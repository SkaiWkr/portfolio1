/**
 * Mutable scene state shared between the DOM and the WebGL world.
 * It is read every frame inside useFrame, so it must NOT be React state.
 */

export type StageKey = 'morphshell' | 'privdrift'

export interface Anchor {
  id: string
  top: number
  height: number
  /** fraction of this section's height (at its start) spent travelling in from the previous anchor */
  enter: number
  /** fraction of this section's height (at its end) spent travelling to the next anchor */
  exit: number
}

/** DOM order == world order. Each id must exist as [data-anchor="id"]. */
export const ANCHOR_IDS = [
  'hero',
  'about',
  'ops-intro',
  'morphshell',
  'privdrift',
  'arsenal',
  'field-log',
  'milestones',
  'credentials',
  'contact',
] as const

export type AnchorId = (typeof ANCHOR_IDS)[number]

export const ANCHOR_SPACING = 96

export const anchorIndex = (id: AnchorId) => ANCHOR_IDS.indexOf(id)
export const anchorZ = (id: AnchorId) => -anchorIndex(id) * ANCHOR_SPACING
/** Where the station for an anchor sits in world space (a little ahead of the camera's resting point). */
export const stationZ = (id: AnchorId) => anchorZ(id) - 12

export const world = {
  scrollY: 0,
  viewportH: 800,
  velocity: 0,
  /** 0..1 – how hard the camera is "bursting" (fast scroll or mid-transit); drives blur/chroma/bloom */
  burst: 0,
  /** chapter grade: lattice base colour (0..1 rgb) and overall energy multiplier */
  tint: { r: 0.267, g: 0.439, b: 0.941 },
  energy: 1,
  pointer: { x: 0, y: 0, moved: 0 },
  anchors: [] as Anchor[],
  camZ: 0,
  camX: 0,
  /** integer index of the anchor the camera is at / heading to */
  active: 0,
  /** 0..1 – how much of the lattice brightness to keep (lower behind text-heavy sections) */
  dim: 1,
  /** last section-change sweep across the lattice */
  pulse: { t: -100, x: 0, z: 0 },
  stage: { morphshell: 0, privdrift: 0 } as Record<StageKey, number>,
  arsenal: { cat: 0, node: -1, /** category the visitor is hovering/focusing in the DOM (-1 = follow scroll) */ hoverCat: -1 },
  about: -1,
  milestone: -1,
  cred: -1,
  contact: -1,
  ready: false,
}

/* ---------- tiny subscribe/notify for React-facing values (active chapter, stage index) ---------- */

type Listener = () => void
const listeners = new Set<Listener>()
export const subscribe = (l: Listener) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
export const notify = () => listeners.forEach((l) => l())

export const ui = {
  chapter: 'top' as string,
  /** arsenal category currently highlighted */
  cat: 0,
  /** integer stage currently shown for each scrubbed project */
  stage: { morphshell: 0, privdrift: 0 } as Record<StageKey, number>,
}
export const setCat = (i: number) => {
  if (ui.cat !== i) {
    ui.cat = i
    notify()
  }
}
export const setStage = (k: StageKey, i: number) => {
  if (ui.stage[k] !== i) {
    ui.stage[k] = i
    notify()
  }
}
export const setChapter = (id: string) => {
  if (ui.chapter !== id) {
    ui.chapter = id
    notify()
  }
}

/** Subscribe helpers for useSyncExternalStore. */
export const snapshot = {
  chapter: () => ui.chapter,
  cat: () => ui.cat,
  stage: (k: StageKey) => () => ui.stage[k],
}
