import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/anybody/wdth.css'
import '@fontsource-variable/instrument-sans/index.css'
import '@fontsource-variable/jetbrains-mono/index.css'
import './globals.css'
import { site } from '@/lib/data'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Cyber Security`, template: `%s — ${site.name}` },
  description: site.summary,
  authors: [{ name: site.name, url: site.links.github.href }],
  openGraph: {
    title: `${site.name} — Cyber Security`,
    description: site.summary,
    type: 'website',
    siteName: site.name,
  },
  twitter: { card: 'summary_large_image', title: `${site.name} — Cyber Security`, description: site.summary },
}

export const viewport: Viewport = {
  themeColor: '#04070d',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

/** Runs before first paint: decides whether the page gets the tall, scroll-scrubbed layout. */
const motionGate = `(function(){var d=document.documentElement;try{var q=new URLSearchParams(location.search).get('tier');var off=matchMedia('(prefers-reduced-motion: reduce)').matches||localStorage.getItem('sm-fx')==='off'||q==='none';if(q==='full'||q==='lite')off=false;d.dataset.motion=off?'off':'on'}catch(e){d.dataset.motion='on'}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionGate }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
