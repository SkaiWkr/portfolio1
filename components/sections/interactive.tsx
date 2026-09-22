'use client'

import { about, achievements, certifications, skills, site } from '@/lib/data'
import { scrollToY } from '@/lib/scroll'
import { snapshot, world, type StageKey } from '@/lib/store'
import { useStoreValue } from '@/components/ui/useStoreValue'
import type { Stage } from '@/lib/data'

/** Jump the page to a given fraction of a pinned section. */
function seek(sectionId: string, fraction: number) {
  const el = document.getElementById(sectionId)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  const total = Math.max(0, el.offsetHeight - window.innerHeight)
  // only meaningful when the section is actually pinned (motion layout)
  if (document.documentElement.dataset.motion !== 'on') return
  scrollToY(top + total * fraction + 2)
}

export function StageList({ slug, stages }: { slug: StageKey; stages: readonly Stage[] }) {
  const idx = useStoreValue(snapshot.stage(slug), 0)
  const S = stages.length
  return (
    <ol className="stages" aria-label="Architecture, in order">
      {stages.map((s, i) => (
        <li key={s.label} data-active={i === idx} aria-current={i === idx ? 'step' : undefined}>
          <span className="n">{String(i + 1).padStart(2, '0')}</span>
          <button
            type="button"
            className="label"
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', minHeight: 44 }}
            onClick={() => seek(slug, i / (S - 1))}
          >
            {s.label}
          </button>
          <div className="desc">
            <div>{s.text}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function ArsenalGroups() {
  const cat = useStoreValue(snapshot.cat, 0)
  let offset = 0
  return (
    <ul className="groups">
      {skills.map((g, gi) => {
        const base = offset
        offset += g.items.length
        return (
          <li
            key={g.name}
            className="group"
            data-active={gi === cat}
            onMouseEnter={() => (world.arsenal.hoverCat = gi)}
            onMouseLeave={() => {
              world.arsenal.hoverCat = -1
              world.arsenal.node = -1
            }}
          >
            <button
              type="button"
              className="group-head"
              aria-expanded={gi === cat}
              onFocus={() => (world.arsenal.hoverCat = gi)}
              onBlur={() => (world.arsenal.hoverCat = -1)}
              onClick={() => seek('arsenal', gi / (skills.length - 0.001) + 0.5 / skills.length)}
            >
              <span className="t">{g.name}</span>
              <span className="c">{String(g.items.length).padStart(2, '0')}</span>
            </button>
            <div className="group-body">
              <div>
                <ul className="group-items">
                  {g.items.map((it, j) => (
                    <li
                      key={it}
                      className="chip"
                      onMouseEnter={() => (world.arsenal.node = base + j)}
                      onMouseLeave={() => (world.arsenal.node = -1)}
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function MilestoneList() {
  return (
    <ul className="rows" onMouseLeave={() => (world.milestone = -1)}>
      {achievements.map((a, i) => (
        <li key={a.event} onMouseEnter={() => (world.milestone = i)} onFocus={() => (world.milestone = i)} onBlur={() => (world.milestone = -1)}>
          <div className="row" tabIndex={0} aria-label={`${a.rank} ${a.kind}, ${a.event}, ${a.context}`}>
            <div className="rank" aria-hidden>
              {a.rank}
              <small>{a.kind}</small>
            </div>
            <div>
              <div className="h3">{a.event}</div>
              <div className="muted" style={{ marginTop: '0.25rem' }}>
                {a.context}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function CertList() {
  return (
    <ul className="rows" style={{ marginTop: '1.2rem' }} onMouseLeave={() => (world.cred = -1)}>
      {certifications.map((c, i) => (
        <li key={c} onMouseEnter={() => (world.cred = i)} onFocus={() => (world.cred = i)} onBlur={() => (world.cred = -1)}>
          <div className="cert" tabIndex={0}>
            <span className="n">{String(i + 1).padStart(2, '0')}</span>
            <span style={{ fontSize: '1.08rem' }}>{c}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

const CHANNELS = [site.links.github, site.links.linkedin, site.links.email]

export function ChannelList() {
  return (
    <div className="rows" onMouseLeave={() => (world.contact = -1)}>
      {CHANNELS.map((l, i) => (
        <div key={l.label} style={{ borderTop: i ? '1px solid rgba(148,166,203,0.2)' : undefined }}>
          <a
            className="channel"
            href={l.href}
            target={l.label === 'Email' ? undefined : '_blank'}
            rel={l.label === 'Email' ? undefined : 'noopener noreferrer'}
            onMouseEnter={() => (world.contact = i)}
            onFocus={() => (world.contact = i)}
            onBlur={() => (world.contact = -1)}
          >
            <span className="k">{l.label}</span>
            <span className="v">{l.handle}</span>
            <span className="arrow" aria-hidden>
              ↗
            </span>
          </a>
        </div>
      ))}
    </div>
  )
}

export function PillarList() {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: '2.4rem 0 0', display: 'grid', gap: '1.4rem' }} onMouseLeave={() => (world.about = -1)}>
      {about.pillars.map((p, i) => (
        <li
          key={p.name}
          data-reveal={0.05 * i}
          tabIndex={0}
          onMouseEnter={() => (world.about = i)}
          onFocus={() => (world.about = i)}
          onBlur={() => (world.about = -1)}
          style={{ display: 'grid', gridTemplateColumns: '2.4rem 1fr', gap: '0.2rem 0.6rem' }}
        >
          <span className="mono" style={{ color: 'var(--color-cyan)', paddingTop: '0.3rem' }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="h3">{p.name}</span>
          <span style={{ gridColumn: 2 }} className="muted">
            {p.text}
          </span>
        </li>
      ))}
    </ol>
  )
}
