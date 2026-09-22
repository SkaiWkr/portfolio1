# Design & architecture plan

## 1. What the reference video actually shows

The clip is a phone recording of a laptop screen, so this is read from the picture, not from source code.

| Observed | Likely technique | Used here? |
|---|---|---|
| Crisp line-art mark (intersecting strokes, a circle, horizontal rules) with horizontal motion smear | Stroke drawing (SVG/canvas) + velocity blur | Idea kept: thin line-work HUD, velocity-driven chromatic split. Mark itself not copied. |
| White flash, then a liquid/chromatic warp of the wordmark | Fragment-shader displacement on a text plane | Kept in spirit: scroll-velocity chromatic aberration + a ring "pulse" that sweeps the lattice on every section change. |
| Giant "WORK" over a mosaic that breaks apart and reforms | Tile/pixel-grid shader | Kept in spirit: the world is a point lattice that a cursor breaks away from a baseline and that relaxes back. |
| Angled image planes in a carousel, title + tags beneath | Perspective planes, render-to-texture, zoom-burst transition | Replaced: project scenes are 3D structures that morph stage by stage (no fake screenshots). |
| A single light, text-only interlude | Palette inversion | Not used (brief asks for a dark system). |

Not copied: the logo mark, the tile look, the carousel, the copy, the palette.

## 2. Concept: baseline vs. drift

The portfolio's own subject is *watching what changes*: PrivDrift compares a live system to a trusted baseline;
MorphShell watches behaviour instead of signatures. So the world is one continuous **lattice (the baseline)**.
The visitor's cursor pulls it out of shape (drift), and it relaxes back. The camera flies down the lattice as you scroll,
and each section is a station on the way.

The one memorable moment: the hero name is set in a width-variable face; letters *drift* in width near the cursor
and settle back, exactly like the lattice does.

## 3. Tokens

- Color: void `#04070d`, abyss `#08111f`, deep `#0d1a33`, electric blue `#2f6bff`, cyan `#3de7ff`, ice `#e8eefc`, mist `#94a6cb`.
  Amber `#ffb454` is reserved for one meaning only: *drift / risk*.
- Type: **Anybody** (variable weight + width axes) for display; **Instrument Sans** for reading; **JetBrains Mono** only for genuinely technical strings.
- Layout: text left (5/12), world right; on portrait phones the world sits above the text. Left aligned throughout.

## 4. Architecture

```
app/                     Next.js App Router (home + /projects/[slug] case studies)
components/canvas/       ONE fixed R3F canvas: Lattice, Rig (scroll camera), stations, effects
components/sections/     DOM story sections (server-rendered content, client-enhanced)
lib/data.ts              single source of truth for all content (from the live site)
lib/store.ts             mutable scroll/scene store read by useFrame (no React re-renders)
lib/capability.ts        device tiering: none | lite | full
```

- **One canvas, one GL context.** Stations only render when the camera is near them.
- **Scroll → camera.** Section anchors are measured from the DOM; the camera holds ("plateau") while a section is read
  and travels between anchors with easing. Works for any section height, so it survives responsive layouts.
- **Operations** are pinned scroll-scrubbed walkthroughs. Each stage is a step from the project's real architecture list;
  the 3D structure morphs between stages.
- **Tiers.** `full`: ~32k points, bloom + chromatic aberration, adaptive DPR. `lite` (phones, coarse pointer,
  low-memory/low-core): ~5k points, DPR 1, 30 fps cap, no post-processing. `none` (no WebGL, reduced motion, or the
  Effects toggle): static CSS/SVG backdrop, no smooth-scroll, no scrubbing, everything still readable.
- Everything is decorative to assistive tech (`aria-hidden`); content is real HTML.
