'use client'

import { useEffect, useRef, useState } from 'react'
import { chapters, site } from '@/lib/data'
import { writeFxPreference, type Tier } from '@/lib/capability'
import { getLenis } from '@/lib/scroll'
import { snapshot } from '@/lib/store'
import { useStoreValue } from './useStoreValue'

export function Nav({ tier }: { tier: Tier }) {
  const [open, setOpen] = useState(false)
  const chapter = useStoreValue(snapshot.chapter, 'top')
  const first = useRef<HTMLAnchorElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const [canToggle, setCanToggle] = useState(false)
  const current = chapters.find((c) => c.id === chapter) ?? chapters[0]

  useEffect(() => {
    setCanToggle(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (!open) return
    getLenis()?.stop()
    document.body.style.overflow = 'hidden'
    const main = document.getElementById('main')
    main?.setAttribute('inert', '')
    // wait a beat: the menu is still visibility:hidden on the commit that opens it
    let focusTimer = 0
    let tries = 0
    const tryFocus = () => {
      first.current?.focus()
      if (document.activeElement !== first.current && tries++ < 20) focusTimer = window.setTimeout(tryFocus, 50)
    }
    focusTimer = window.setTimeout(tryFocus, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btn.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      main?.removeAttribute('inert')
      getLenis()?.start()
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const fxOn = tier === 'lite' || tier === 'full'
  const toggleFx = () => {
    writeFxPreference(fxOn ? 'off' : 'on')
    const u = new URL(window.location.href)
    u.searchParams.delete('tier')
    window.location.href = u.toString()
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label={`${site.name} — back to top`}>
          {site.name}
        </a>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {canToggle && tier !== 'pending' && (
            <button className="pill" type="button" aria-pressed={fxOn} onClick={toggleFx} title="Toggle 3D effects and smooth scrolling">
              <span className="dot" aria-hidden />
              <span className="lbl">Effects&nbsp;</span>
              {fxOn ? 'on' : 'off'}
            </button>
          )}
          <button ref={btn} className="pill" type="button" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Chapters'}
          </button>
        </div>
      </header>

      <nav id="menu" className="menu" data-open={open} aria-label="Chapters" aria-hidden={!open} inert={!open}>
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <a
                ref={i === 0 ? first : undefined}
                href={`#${c.id}`}
                aria-current={c.id === chapter}
                onClick={() => setOpen(false)}
              >
                <span>{c.n}</span>
                {c.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="chapter-now" aria-hidden>
        <b>{current.n}</b>
        <span>{current.label}</span>
      </div>
    </>
  )
}
