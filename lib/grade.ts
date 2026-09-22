import { Color } from 'three'
import type { AnchorId } from './store'

/**
 * Per-chapter colour and energy. It stays inside the palette (blue → cyan, amber is reserved for
 * "drift") but changes the pace of the scroll: calm and dim for reading, bright for arrivals.
 */
const g = (hex: string, energy: number) => ({ c: new Color(hex), energy })

export const GRADE: Record<AnchorId, { c: Color; energy: number }> = {
  hero: g('#4470f0', 1.0),
  about: g('#4470f0', 0.9),
  'ops-intro': g('#3f8cff', 1.0),
  morphshell: g('#3f8cff', 1.15),
  privdrift: g('#6a72ff', 1.15),
  arsenal: g('#2fc4e6', 1.0),
  'field-log': g('#3a58b8', 0.65),
  milestones: g('#5b86ff', 1.3),
  credentials: g('#3d62c8', 0.8),
  contact: g('#3de7ff', 1.35),
}
