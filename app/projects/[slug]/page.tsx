import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { projects, site } from '@/lib/data'

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const p = projects.find((x) => x.slug === slug)
  if (!p) return {}
  return { title: `${p.name} — Case study`, description: p.description }
}

const Block = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section style={{ marginTop: 'clamp(3rem, 8vw, 5.5rem)' }} aria-labelledby={`h-${n}`}>
    <p className="eyebrow">
      <span>{n}</span>
    </p>
    <h2 id={`h-${n}`} className="h2" style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.6rem)' }}>
      {title}
    </h2>
    <div className="prose-block">{children}</div>
  </section>
)

export default async function CaseStudy({ params }: { params: Params }) {
  const { slug } = await params
  const i = projects.findIndex((p) => p.slug === slug)
  if (i < 0) notFound()
  const p = projects[i]
  const next = projects[(i + 1) % projects.length]

  return (
    <>
      <div className="backdrop" aria-hidden />
      <header className="topbar">
        <Link className="brand" href="/">
          {site.name}
        </Link>
        <Link className="pill" href="/#operations">
          ← All operations
        </Link>
      </header>

      <main id="main" className="wrap" style={{ paddingBlock: 'clamp(7rem, 16vh, 10rem) 4rem', position: 'relative', zIndex: 1 }}>
        <p className="eyebrow">Case study · {String(i + 1).padStart(2, '0')}</p>
        <h1 className="name" style={{ fontSize: 'clamp(3rem, 9vw, 8rem)', marginTop: '1.4rem', whiteSpace: 'normal' }}>
          {p.name}
        </h1>
        <p className="lead" style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
          {p.subtitle}
        </p>
        <p className="lead" style={{ maxWidth: '46rem' }}>
          {p.description}
        </p>
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', padding: 0, margin: '1.6rem 0 0', listStyle: 'none' }}>
          {p.tech.map((t) => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', marginTop: '2rem' }}>
          <a className="btn btn-primary" href={p.github} target="_blank" rel="noopener noreferrer">
            GitHub <span className="arrow" aria-hidden>↗</span>
          </a>
        </div>

        <Block n="01" title="Overview">
          <p>{p.overview}</p>
        </Block>
        <Block n="02" title="The problem">
          <p>{p.problem}</p>
        </Block>
        <Block n="03" title="Architecture">
          <ol className="stages" style={{ marginTop: '1.4rem' }}>
            {p.architecture.map((s, k) => (
              <li key={s.label} data-active="true">
                <span className="n">{String(k + 1).padStart(2, '0')}</span>
                <span className="label">{s.label}</span>
                <div className="desc">
                  <div>{s.text}</div>
                </div>
              </li>
            ))}
          </ol>
        </Block>
        <Block n="04" title="The solution">
          <p>{p.solution}</p>
        </Block>
        <Block n="05" title="Implementation">
          <ol>
            {p.implementation.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </Block>
        <Block n="06" title="Challenges">
          <ul>
            {p.challenges.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Block>
        <Block n="07" title="Lessons learned">
          <ul>
            {p.lessons.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Block>
        <Block n="08" title="Future work">
          <ul>
            {p.future.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Block>

        <Link
          href={`/projects/${next.slug}`}
          className="row"
          style={{ marginTop: '5rem', gridTemplateColumns: '1fr auto', borderBlock: '1px solid rgba(148,166,203,0.2)' }}
        >
          <span>
            <span className="mono muted" style={{ display: 'block' }}>
              Next operation
            </span>
            <span className="h3">{next.name}</span>
          </span>
          <span aria-hidden className="muted">→</span>
        </Link>
      </main>
    </>
  )
}
