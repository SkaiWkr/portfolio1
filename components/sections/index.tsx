import Link from 'next/link'
import type { CSSProperties } from 'react'
import {
  about,
  achievementsIntro,
  contact,
  education,
  experience,
  experienceIntro,
  projects,
  projectsIntro,
  site,
  skillsIntro,
  skills,
  type Project,
} from '@/lib/data'
import { DriftName } from '@/components/ui/DriftName'
import { ArsenalGroups, CertList, ChannelList, MilestoneList, PillarList, StageList } from './interactive'

const Eyebrow = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <p className="eyebrow" data-reveal>
    <span>{n}</span>
    <span aria-hidden>—</span>
    <span>{children}</span>
  </p>
)


/** Display heading split into masked words so it can be revealed word by word (see Shell). */
function H2({ text }: { text: string }) {
  return (
    <h2 className="h2" aria-label={text} data-split>
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span className="w" aria-hidden>
            <span className="wi">{w}</span>
          </span>{' '}
        </span>
      ))}
    </h2>
  )
}

/**
 * A giant outlined word behind a chapter: pure scale contrast. It lives in a clipped window on the
 * right (where the 3D world is), so it never sits behind the copy, and it slides with scroll.
 */
const Word = ({ children, from = '46%' }: { children: string; from?: string }) => (
  <span className="word-clip" aria-hidden style={{ left: from }}>
    <span className="word" data-word>
      {children}
    </span>
  </span>
)

/* -------------------------------------------------------------------------- hero */

export function Hero() {
  return (
    <section id="top" data-anchor="hero" data-enter="0" data-exit="0.32" className="section" aria-label="Introduction">
      <div className="wrap" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', paddingBlock: '5.5rem 2rem' }}>
        {/* mobile only: the 3D world isn't confined to a side column here like it is on desktop, so
            the stacked text needs its own backing to stay legible over bright dust/lattice points */}
        <div className="hero-scrim" style={{ width: '100%' }}>
          <p className="eyebrow hero-anim" style={{ marginBottom: '1.6rem' }}>
            {site.descriptor}
          </p>
          <DriftName lines={[site.first, site.last]} label={site.name} />
          <ul className="tagline" aria-label="Detect, analyze, defend">
            {site.tagline.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="copy" style={{ marginTop: '2rem' }}>
            <p className="lead hero-lead hero-anim" style={{ marginTop: 0 }}>
              {site.summary}
            </p>
            <div className="hero-anim hero-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '2rem' }}>
              <a className="btn btn-primary" href="#operations">
                See the work <span className="arrow" aria-hidden>→</span>
              </a>
              <a className="btn" href={site.resume} target="_blank" rel="noopener noreferrer">
                Résumé <span className="arrow" aria-hidden>↗</span>
              </a>
              <a className="btn" href={site.links.github.href} target="_blank" rel="noopener noreferrer">
                GitHub <span className="arrow" aria-hidden>↗</span>
              </a>
            </div>
            <div className="scroll-hint hero-anim" aria-hidden>
              <i /> Scroll
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- about */

export function About() {
  return (
    <section id="about" data-anchor="about" data-enter="0.3" data-exit="0.25" className="section section-pad m-under" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center' }}>
      <Word>ABOUT</Word>
      <div className="wrap" style={{ width: '100%' }}>
        <div className="copy scrim">
          <Eyebrow n="02">About</Eyebrow>
          <H2 text={about.heading} />
          <p className="lead" data-reveal="0.1">
            {site.summary}
          </p>
          <PillarList />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- operations */

export function OpsIntro() {
  return (
    <section id="operations" data-anchor="ops-intro" data-enter="0.3" data-exit="0.3" className="section section-pad" style={{ minHeight: '90svh', display: 'flex', alignItems: 'center' }}>
      <Word>OPERATIONS</Word>
      <div className="wrap" style={{ width: '100%' }}>
        <div className="copy scrim">
          <Eyebrow n="03">Operations</Eyebrow>
          <H2 text={projectsIntro.heading} />
          <p className="lead" data-reveal="0.1">
            {projectsIntro.text}
          </p>
          <ul style={{ listStyle: 'none', margin: '2.4rem 0 0', padding: 0 }} className="rows">
            {projects.map((p, i) => (
              <li key={p.slug} data-reveal={0.05 * i}>
                <a href={`#${p.slug}`} className="row" style={{ gridTemplateColumns: '2.4rem 1fr auto' }}>
                  <span className="mono" style={{ color: 'var(--color-cyan)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="h3" style={{ display: 'block' }}>
                      {p.name}
                    </span>
                    <span className="muted" style={{ fontSize: '0.95rem' }}>
                      {p.subtitle}
                    </span>
                  </span>
                  <span aria-hidden className="muted">↓</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function ProjectScrub({ project, index }: { project: Project; index: number }) {
  const span = `${(project.architecture.length - 1) * 70 + 100}svh`
  return (
    <section
      id={project.slug}
      data-anchor={project.slug}
      data-scrub={project.slug}
      data-enter="0.06"
      data-exit="0.06"
      className="scrub"
      style={{ '--span': span } as CSSProperties}
      aria-label={`${project.name} — architecture walkthrough`}
    >
      <div className="panel">
        <Word>{project.name}</Word>
        <div className="wrap" style={{ width: '100%' }}>
          <div className="copy">
            <Eyebrow n={String(index + 1).padStart(2, '0')}>
              Operation · {project.slug === 'morphshell' ? 'Analysis' : 'Monitoring'}
            </Eyebrow>
            <H2 text={project.name} />
            <p className="mono hide-mobile" style={{ color: 'var(--color-cyan)', marginTop: '0.9rem' }}>
              {project.subtitle}
            </p>
            <p className="lead hide-short hide-mobile" style={{ fontSize: '1rem', marginTop: '1rem' }}>
              {project.description}
            </p>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', padding: 0, margin: '1.2rem 0 0', listStyle: 'none' }} className="hide-mobile">
              {project.tech.map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
            <StageList slug={project.slug} stages={project.architecture} />
            <div className="progress" aria-hidden>
              <i />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', marginTop: '1.5rem' }}>
              <Link className="btn btn-primary" href={`/projects/${project.slug}`}>
                Case study <span className="arrow" aria-hidden>→</span>
              </Link>
              <a className="btn" href={project.github} target="_blank" rel="noopener noreferrer">
                GitHub <span className="arrow" aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- arsenal */

export function Arsenal() {
  const span = `${(skills.length - 1) * 60 + 100}svh`
  return (
    <section id="arsenal" data-anchor="arsenal" data-scrub="arsenal" data-enter="0.08" data-exit="0.08" className="scrub" style={{ '--span': span } as CSSProperties}>
      <div className="panel">
        <Word>ARSENAL</Word>
        <div className="wrap" style={{ width: '100%' }}>
          <div className="copy">
            <Eyebrow n="04">Arsenal</Eyebrow>
            <H2 text={skillsIntro.heading} />
            <p className="lead hide-short hide-mobile" style={{ fontSize: '1rem' }}>
              {skillsIntro.text}
            </p>
            <ArsenalGroups />
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- field log */

export function FieldLog() {
  return (
    <section id="field-log" data-anchor="field-log" data-enter="0.1" data-exit="0.06" className="section section-pad">
      <Word from="68%">FIELD LOG</Word>
      <div className="wrap">
        <div className="copy-wide scrim">
          <Eyebrow n="05">Field log</Eyebrow>
          <H2 text={experienceIntro.heading} />
          <p className="lead" data-reveal="0.1">
            {experienceIntro.text}
          </p>
          <ol className="log">
            {experience.map((r) => (
              <li key={r.org + r.start} data-live={r.end === null} data-reveal>
                <div className="role-head">
                  <h3 className="h3">{r.role}</h3>
                  <span className="mono muted">{r.period}</span>
                  {r.note && <span className="chip">{r.note}</span>}
                </div>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--color-cyan)' }}>{r.org}</p>
                <ul>
                  {r.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- milestones */

export function Milestones() {
  return (
    <section id="milestones" data-anchor="milestones" data-enter="0.2" data-exit="0.2" className="section section-pad m-under" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center' }}>
      <Word>MILESTONES</Word>
      <div className="wrap" style={{ width: '100%' }}>
        <div className="copy scrim">
          <Eyebrow n="06">Milestones</Eyebrow>
          <H2 text={achievementsIntro.heading} />
          <MilestoneList />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- credentials */

export function Credentials() {
  return (
    <section id="credentials" data-anchor="credentials" data-enter="0.2" data-exit="0.2" className="section section-pad m-under" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center' }}>
      <Word>CREDENTIALS</Word>
      <div className="wrap" style={{ width: '100%' }}>
        <div className="copy scrim">
          <Eyebrow n="07">Credentials</Eyebrow>
          <H2 text={education.heading} />
          <div data-reveal="0.1" style={{ marginTop: '1.8rem' }}>
            <p className="h3">{education.school}</p>
            <p className="muted" style={{ margin: '0.4rem 0 0' }}>
              {education.degree}
            </p>
            <p className="mono muted" style={{ margin: '0.9rem 0 0' }}>
              {education.location} · {education.period} · CGPA {education.cgpa}
            </p>
          </div>
          <h3 className="mono" style={{ margin: '2.4rem 0 0', color: 'var(--color-cyan)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Certifications
          </h3>
          <CertList />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- contact */

export function Contact() {
  return (
    <section id="contact" data-anchor="contact" data-enter="0.25" data-exit="0" className="section section-pad m-under" style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Word>CONTACT</Word>
      <div className="wrap" style={{ width: '100%', marginBlock: 'auto' }}>
        <div className="copy scrim">
          <p className="eyebrow" data-reveal>
            <span>08</span>
            <span aria-hidden>—</span>
            <span>{contact.heading}</span>
          </p>
          <H2 text={contact.lead} />
          <p className="lead" data-reveal="0.1">
            {contact.text}
          </p>
          <div data-reveal="0.15" style={{ marginTop: '2.2rem' }}>
            <ChannelList />
          </div>
          <div style={{ marginTop: '2rem' }} data-reveal="0.2">
            <a className="btn btn-primary" href={site.resume} target="_blank" rel="noopener noreferrer">
              Download résumé <span className="arrow" aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>
      <footer className="wrap footer">
        <span>© {new Date().getFullYear()} {site.name}</span>
      </footer>
    </section>
  )
}
