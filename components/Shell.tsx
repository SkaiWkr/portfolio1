'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { measureAnchors } from '@/lib/anchors'
import { detectTier, type Tier } from '@/lib/capability'
import { clamp, sstep } from '@/lib/math'
import { setLenis } from '@/lib/scroll'
import { setCat, setChapter, setStage, world, type StageKey } from '@/lib/store'
import { skills } from '@/lib/data'
import { Nav } from './ui/Nav'
import { StaticBackdrop } from './ui/StaticBackdrop'

const Scene = dynamic(() => import('./canvas/Scene'), { ssr: false })

const CHAPTER_OF: Record<string, string> = {
  hero: 'top',
  about: 'about',
  'ops-intro': 'operations',
  morphshell: 'operations',
  privdrift: 'operations',
  arsenal: 'arsenal',
  'field-log': 'field-log',
  milestones: 'milestones',
  credentials: 'credentials',
  contact: 'contact',
}

const STAGES: Record<StageKey, number> = { morphshell: 5, privdrift: 4 }

/**
 * Owns everything that is not content: capability detection, the single WebGL canvas, smooth scroll,
 * pointer tracking, and turning scroll position into the values the world reads each frame.
 */
export function Shell() {
  const [tier, setTier] = useState<Tier>('pending')

  useEffect(() => {
    const t = detectTier()
    const d = document.documentElement
    d.dataset.tier = t
    d.dataset.motion = t === 'none' ? 'off' : 'on'
    setTier(t)
  }, [])

  useEffect(() => {
    const onLost = () => {
      document.documentElement.dataset.tier = 'none'
      document.documentElement.dataset.motion = 'off'
      setTier('none')
    }
    // sm-webgl-lost: the GPU context died and didn't come back.
    // sm-perf-fallback: lite tier's own watchdog (no PerformanceMonitor on phones) — the device
    // can't sustain even the reduced scene, so drop to the static backdrop rather than stay janky.
    window.addEventListener('sm-webgl-lost', onLost)
    window.addEventListener('sm-perf-fallback', onLost)
    return () => {
      window.removeEventListener('sm-webgl-lost', onLost)
      window.removeEventListener('sm-perf-fallback', onLost)
    }
  }, [])

  useEffect(() => {
    if (tier !== 'lite' && tier !== 'full') return
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, anchors: true, wheelMultiplier: 0.95 })
    setLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // --- layout measurement -------------------------------------------------------------
    const measure = () => {
      measureAnchors()
      ScrollTrigger.refresh()
    }
    let timer = 0
    const remeasure = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(measure, 120)
    }
    measure()
    const ro = new ResizeObserver(remeasure)
    ro.observe(document.body)
    window.addEventListener('resize', remeasure)
    document.fonts?.ready.then(remeasure)

    // --- pointer ---------------------------------------------------------------------------
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      world.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
      world.pointer.moved = 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    // --- scroll → world ----------------------------------------------------------------------
    const scrubs = Array.from(document.querySelectorAll<HTMLElement>('[data-scrub]'))
    const cats = skills.length
    const kinetic = Array.from(document.querySelectorAll<HTMLElement>('.h2, .rank'))
    const words = Array.from(document.querySelectorAll<HTMLElement>('[data-word]')).map((el) => ({ el, sec: el.closest<HTMLElement>('[data-anchor]') }))
    let lastV = 0
    const worldEl = document.querySelector<HTMLElement>('.world-scale')
    let lastScale = 1
    const drive = () => {
      // phones have no post-processing: give them the same beat with a compositor-only scale punch
      if (tier === 'lite' && worldEl) {
        // at rest the transform must be exactly `none`: any non-identity scale makes the compositor
        // resample the whole canvas every frame
        if (world.burst < 0.004) {
          if (lastScale !== 1) {
            worldEl.style.transform = ''
            lastScale = 1
          }
        } else {
          const sc = 1 + world.burst * 0.05
          if (Math.abs(sc - lastScale) > 0.0015) {
            worldEl.style.transform = `scale(${sc.toFixed(4)})`
            lastScale = sc
          }
        }
      }
      const y = window.scrollY
      const vh = window.innerHeight
      const vw = window.innerWidth
      world.scrollY = y

      // display type: split + skew only while moving fast; exactly 0 at rest
      const v = Math.min(1, world.velocity * 0.9)
      if (Math.abs(v - lastV) > 0.02 || (v === 0 && lastV !== 0)) {
        lastV = v
        const val = v < 0.03 ? '0' : v.toFixed(3)
        for (const el of kinetic) el.style.setProperty('--v', val)
      }

      // chapter words drift across the screen as their section passes
      if (vw >= 1024) {
        for (const w of words) {
          if (!w.sec) continue
          const r = w.sec.getBoundingClientRect()
          const t = clamp((vh - r.top) / (vh + r.height))
          w.el.style.transform = `translate3d(${((0.3 - t * 0.7) * vw).toFixed(1)}px,0,0)`
        }
      }
      world.viewportH = vh

      for (const el of scrubs) {
        const key = el.dataset.scrub as StageKey | 'arsenal'
        const r = el.getBoundingClientRect()
        const total = Math.max(1, r.height - vh)
        const p = clamp(-r.top / total)
        el.style.setProperty('--p', p.toFixed(4))
        if (key === 'arsenal') {
          const v = p * (cats - 0.001)
          const i = Math.min(cats - 1, Math.floor(v))
          const cat = world.arsenal.hoverCat >= 0 ? world.arsenal.hoverCat : i
          world.arsenal.cat = cat
          setCat(cat)
        } else {
          const S = STAGES[key]
          const v = p * (S - 1)
          const i = Math.min(S - 1, Math.floor(v))
          world.stage[key] = i + sstep(0.32, 0.68, v - i)
          setStage(key, Math.round(world.stage[key]))
        }
      }

      // which chapter is under the middle of the screen
      const mid = y + vh * 0.5
      let id = 'hero'
      for (const a of world.anchors) if (mid >= a.top) id = a.id
      setChapter(CHAPTER_OF[id] ?? 'top')
    }
    gsap.ticker.add(drive)

    // --- opening sequence: plays as the camera pushes in -----------------------------------
    const playIntro = () => {
      document.documentElement.dataset.intro = 'run'
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.fromTo('.hero-anim.eyebrow', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9 }, 0.2)
        .fromTo('.name .ch', { yPercent: 112, opacity: 1 }, { yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.05 }, 0.1)
        .fromTo('.tagline li', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.14 }, 1.0)
        .fromTo('.hero-lead', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1 }, 1.25)
        .fromTo('.hero-actions', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1 }, 1.45)
        .fromTo('.scroll-hint', { opacity: 0 }, { opacity: 1, duration: 1 }, 2.0)
      const qa = new URLSearchParams(window.location.search).get('introAt')
      if (qa !== null) tl.pause().progress(Math.min(1, Math.max(0, parseFloat(qa))))
    }
    if (document.documentElement.dataset.ready === 'true') playIntro()
    else window.addEventListener('sm-ready', playIntro, { once: true })

    // --- content reveals ---------------------------------------------------------------------
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
        gsap.from(el.querySelectorAll('.wi'), {
          yPercent: 118,
          rotate: 5,
          duration: 1.1,
          ease: 'power4.out',
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        const d = parseFloat(el.dataset.reveal || '0')
        gsap.from(el, {
          y: 26,
          opacity: 0,
          duration: 0.95,
          delay: d,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        })
      })
    })

    return () => {
      ctx.revert()
      gsap.ticker.remove(drive)
      gsap.ticker.remove(tick)
      window.removeEventListener('sm-ready', playIntro)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', remeasure)
      window.clearTimeout(timer)
      ro.disconnect()
      lenis.destroy()
      setLenis(null)
    }
  }, [tier])

  const three = tier === 'lite' || tier === 'full'
  return (
    <>
      <div className="backdrop" aria-hidden style={{ display: three ? 'none' : undefined }}>
        <StaticBackdrop />
      </div>
      {three && (
        <div className="world" aria-hidden>
          {/* isolated from the fixed positioning context so a per-frame scale on phones is pure
              compositing and never touches the layer that pins this to the viewport */}
          <div className="world-scale">
            <Scene tier={tier} />
          </div>
        </div>
      )}
      <Nav tier={tier} />
    </>
  )
}
