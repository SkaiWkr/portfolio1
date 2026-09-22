'use client'

import { useEffect, useRef } from 'react'

const BASE = 84 // resting width (font-stretch %)
const MAX = 146 // widest a letter gets when the cursor is on it
// font-stretch is a layout-affecting property (it reflows the whole nowrap line): animating it
// every rendered frame means a full text layout pass every frame, for as long as the hero is on
// screen, whether or not anything is actually near the cursor. The ease is already gradual, so
// updating it at this cadence instead is not visibly different but cuts that cost by roughly half
// on desktop and by two-thirds on lite's already-throttled loop.
const STEP_MS = 45

/**
 * The hero name. Each letter is set in a variable-width face and "drifts" wider as the cursor
 * passes over it, then relaxes back to its baseline — the site's one idea, written in type.
 */
export function DriftName({ lines, label }: { lines: readonly string[]; label: string }) {
  const root = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const chars = Array.from(el.querySelectorAll<HTMLElement>('.ch'))
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off'
    if (still) return

    const cur = chars.map(() => BASE)
    let R = 24 // recomputed once font size is known below
    const measureR = () => {
      R = parseFloat(getComputedStyle(el).fontSize) * 1.5
    }
    measureR()

    const p = { x: -1e4, y: -1e4, last: -10 }
    let lastStep = 0
    let visible = true
    let raf = 0
    let prev = performance.now()
    let t0 = -1

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      p.x = e.clientX
      p.y = e.clientY
      p.last = performance.now() / 1000
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 })
    io.observe(el)
    // font size (and so R) is a clamp() on viewport width — only re-read it when that can have
    // changed, not from the name's own width changes as letters widen
    window.addEventListener('resize', measureR)

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible) {
        prev = now
        return
      }
      if (now - lastStep < STEP_MS) return
      const dt = Math.min(0.08, (now - prev) / 1000)
      prev = now
      lastStep = now
      if (t0 < 0 && document.documentElement.dataset.ready === 'true') t0 = now
      const t = t0 < 0 ? -1 : (now - t0) / 1000
      const idle = now / 1000 - p.last
      const ambient = Math.min(1, Math.max(0, (idle - 2.5) / 1.5))

      // read: one layout-forcing pass per step (not per rendered frame)
      const rects = chars.map((c) => c.getBoundingClientRect())
      // write: same pass — every step, not every frame, since font-stretch itself reflows the line
      chars.forEach((c, i) => {
        const r = rects[i]
        const dx = r.left + r.width / 2 - p.x
        const dy = r.top + r.height / 2 - p.y
        const k = Math.exp(-(dx * dx + dy * dy) / (R * R))
        // slow ambient swell so the name is alive on touch screens and while the mouse rests
        const wave = Math.pow(0.5 + 0.5 * Math.sin(t * 0.9 - i * 0.6), 5) * 0.55 * ambient
        // intro: a single swell travels through the name as the baseline forms
        const intro = Math.exp(-Math.pow((t - 0.35 - i * 0.09) / 0.32, 2)) * 0.9 * (t >= 0 && t < 2.4 ? 1 : 0)
        const target = BASE + (MAX - BASE) * Math.min(1, Math.max(k, wave, intro))
        cur[i] += (target - cur[i]) * (1 - Math.exp(-dt * 9))
        c.style.fontStretch = `${cur[i].toFixed(1)}%`
      })
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      io.disconnect()
      window.removeEventListener('resize', measureR)
    }
  }, [])

  return (
    <h1 ref={root} className="name" aria-label={label}>
      {lines.map((line) => (
        <span className="line" key={line} aria-hidden>
          {Array.from(line).map((c, i) => (
            <span className="ch" key={i}>
              {c}
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}
