# Siddhant Mandal — portfolio

A scroll-driven WebGL portfolio. One idea runs through it: a **baseline** (a calm field of points) and **drift** (what your cursor and the scroll do to it) — the same idea PrivDrift and MorphShell are built on.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · three / React Three Fiber / drei / postprocessing · GSAP + ScrollTrigger · Lenis.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Content

Every fact on the site lives in `lib/data.ts` (taken from the previous site). Edit there; components only render.

**Before deploying**

1. Copy your résumé PDF into `public/` and set `site.resume` in `lib/data.ts` (e.g. `/Siddhant_Mandal_Resume.pdf`). It currently links to the old site.
2. Set `NEXT_PUBLIC_SITE_URL` in Vercel to the final domain (used for metadata).

## Deploy (Vercel)

Import the repo; the defaults work (framework: Next.js). No environment variables are required.

## How it degrades

| Tier | Who gets it | What they get |
| --- | --- | --- |
| `full` | desktop, fine pointer | ~32k-point lattice, bloom + chromatic aberration, cursor drift, adaptive DPR |
| `lite` | phones, coarse pointer, low memory/cores | ~5k points, DPR 1, 30 fps cap, no post-processing |
| `none` | no WebGL, `prefers-reduced-motion`, or "Effects off" | static SVG backdrop, normal scrolling, every stage/skill expanded |

QA overrides: `?tier=full`, `?tier=lite`, `?tier=none`. The "Effects" toggle in the top bar stores its choice in `localStorage` (`sm-fx`). If the WebGL context is lost and not restored, the page falls back to `none` on its own.

## Layout of the code

```
app/                    home page + /projects/[slug] case studies
components/Shell.tsx    capability detection, Lenis, pointer, scroll → world values
components/canvas/      the single R3F canvas: Lattice, Rig (camera), Morph, Constellation, Stations
components/sections/    DOM content for each chapter
lib/store.ts            mutable world state read every frame (not React state)
lib/camera.ts           per-section camera keyframes (measured from the real DOM layout)
lib/layouts.ts          block layouts for the two project structures
```

The 3D project structures are conceptual illustrations of the documented pipeline stages; they carry no data or claims beyond the stage names.
