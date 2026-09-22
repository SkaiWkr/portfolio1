import { Shell } from '@/components/Shell'
import { About, Arsenal, Contact, Credentials, FieldLog, Hero, Milestones, OpsIntro, ProjectScrub } from '@/components/sections'
import { projects } from '@/lib/data'

export default function Home() {
  return (
    <>
      <Shell />
      <main id="main">
        <Hero />
        <About />
        <OpsIntro />
        {projects.map((p, i) => (
          <ProjectScrub key={p.slug} project={p} index={i} />
        ))}
        <Arsenal />
        <FieldLog />
        <Milestones />
        <Credentials />
        <Contact />
      </main>
    </>
  )
}
