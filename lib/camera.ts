import { MathUtils, Vector3 } from 'three'
import { ANCHOR_IDS, anchorZ, stationZ, type AnchorId } from './store'

export interface Key {
  pos: Vector3
  look: Vector3
  fov: number
  /** lattice brightness multiplier */
  dim: number
  /** how far the camera creeps forward across a long resting period (world units) */
  dolly: number
}

/** Position a camera (looking straight down -z) so `target` lands at (nx, ny) in NDC. */
function frame(target: Vector3, dist: number, nx: number, ny: number, fov: number, aspect: number) {
  const tv = Math.tan(MathUtils.degToRad(fov / 2))
  const th = tv * aspect
  return new Vector3(target.x - nx * dist * th, target.y - ny * dist * tv, target.z + dist)
}

/** how far the camera sits from a project station while it is being read, and the phone pull-back */
export const STATION_DIST = 13
export const PORTRAIT_PULLBACK = 2.3
export const STATION_Y = 3.2

export function buildKeys(aspect: number): Record<AnchorId, Key> {
  const wide = aspect >= 1.05
  // where a station should appear on screen: right half on wide screens, upper half on portrait phones
  const nx = wide ? 0.5 : 0
  const ny = wide ? 0.02 : 0.62
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z)

  const framed = (id: AnchorId, dist: number, fov: number, dim: number, dolly: number, ox = nx, oy = ny, ty = STATION_Y): Key => {
    const t = v(0, ty, stationZ(id))
    // portrait screens are narrow: pull back so the whole structure fits across the width
    const pos = frame(t, wide ? dist : dist * PORTRAIT_PULLBACK, ox, oy, fov, aspect)
    return { pos, look: pos.clone().add(v(0, 0, -30)), fov, dim, dolly }
  }

  const Z = (id: AnchorId) => anchorZ(id)
  const heroFov = wide ? 58 : 72

  const keys = {
    hero: { pos: v(0, 3.2, Z('hero') + 8), look: v(0, 1.5, Z('hero') - 40), fov: heroFov, dim: 1, dolly: 6 },
    about: framed('about', 15, 54, 0.9, 3),
    'ops-intro': { pos: v(0, 1.2, Z('ops-intro') + 8), look: v(0, 3.8, Z('ops-intro') - 40), fov: wide ? 60 : 70, dim: 0.9, dolly: 2 },
    morphshell: framed('morphshell', STATION_DIST, 50, 0.85, 5),
    privdrift: framed('privdrift', STATION_DIST, 50, 0.85, 5),
    arsenal: framed('arsenal', 14, 50, 0.85, 2),
    'field-log': { pos: v(0, 1.5, Z('field-log') + 8), look: v(0, 2.2, Z('field-log') - 40), fov: wide ? 64 : 72, dim: 0.62, dolly: 8 },
    milestones: framed('milestones', 17, 52, 0.85, 2, nx, ny, 2.4),
    credentials: { pos: v(0, 7, Z('credentials') + 8), look: v(0, 0, Z('credentials') - 30), fov: 50, dim: 0.62, dolly: 2 },
    contact: framed('contact', 17, 55, 1, 3, wide ? 0.5 : 0, wide ? 0.02 : 0.32, 4.4),
  } satisfies Record<AnchorId, Key>

  // safety net: every id must have a key
  ANCHOR_IDS.forEach((id) => {
    if (!keys[id]) throw new Error(`missing camera key for ${id}`)
  })
  return keys
}

export const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
