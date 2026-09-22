import { Color } from 'three'
import { mulberry32 } from './rng'

/**
 * Layouts for the two project "stations". Each is a set of N instanced blocks that
 * re-arrange themselves per architecture stage. These are conceptual illustrations of the
 * documented pipeline — they carry no data and make no claims beyond the stage names.
 */

export const N = 120
/** x y z | sx sy sz | r g b */
export const STRIDE = 9

export interface EdgeSet {
  positions: Float32Array
  color: string
  /** opacity per stage */
  weights: number[]
}

export interface Layout {
  stages: Float32Array[]
  edges: EdgeSet[]
  /** stage 0 is alive: writes one instance (STRIDE floats) into `out` for time t */
  animate0: (i: number, t: number, out: Float32Array) => void
}

type RGB = [number, number, number]
const rgb = (hex: string, m = 1): RGB => {
  const c = new Color(hex)
  return [c.r * m, c.g * m, c.b * m]
}

const PAL = {
  steel: rgb('#3d62c8'),
  dim: rgb('#1e3068'),
  faint: rgb('#16234d'),
  blue: rgb('#2f6bff', 1.2),
  cyan: rgb('#3de7ff', 1.5),
  ice: rgb('#e8f4ff', 1.9),
  amber: rgb('#ffb454', 1.6),
}

function put(a: Float32Array, i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, c: RGB) {
  const o = i * STRIDE
  a[o] = x
  a[o + 1] = y
  a[o + 2] = z
  a[o + 3] = sx
  a[o + 4] = sy
  a[o + 5] = sz
  a[o + 6] = c[0]
  a[o + 7] = c[1]
  a[o + 8] = c[2]
}

const blank = () => new Float32Array(N * STRIDE)
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

function boxEdges(hx: number, hy: number, hz: number): number[] {
  const c = [
    [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
    [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz],
  ]
  const e = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
  return e.flatMap(([a, b]) => [...c[a], ...c[b]])
}

function rectEdges(w: number, h: number, z = 0): number[] {
  const x = w / 2
  const y = h / 2
  return [-x, -y, z, x, -y, z, x, -y, z, x, y, z, x, y, z, -x, y, z, -x, y, z, -x, -y, z]
}

/* ------------------------------------------------------------------ MorphShell */

export function morphShellLayout(): Layout {
  const rnd = mulberry32(11)
  const S = [blank(), blank(), blank(), blank(), blank()]

  // 0 — Emulation layer: raw bytes inside an isolated cage
  for (let i = 0; i < N; i++) {
    const s = 0.14 + rnd() * 0.16
    put(S[0], i, (rnd() - 0.5) * 6.4, (rnd() - 0.5) * 3.6, (rnd() - 0.5) * 3.6, s, s, s, rnd() < 0.12 ? PAL.cyan : PAL.steel)
  }

  // 1 — Disassembly layer: instructions as a listing (24 rows x 5 tokens)
  for (let r = 0; r < 24; r++) {
    let x = -3.6 + (rnd() < 0.2 ? 0.4 : 0)
    const y = 3.3 - r * 0.28
    const widths = [0.55, 0.8 + rnd() * 0.3, 0.5 + rnd(), 0.4 + rnd() * 0.8, 0.5 + rnd() * 1.4]
    const cols: RGB[] = [PAL.dim, rnd() < 0.15 ? PAL.ice : PAL.cyan, PAL.steel, PAL.steel, PAL.dim]
    for (let c = 0; c < 5; c++) {
      put(S[1], r * 5 + c, x + widths[c] / 2, y, 0, widths[c], 0.1, 0.1, cols[c])
      x += widths[c] + 0.16
    }
  }

  // 2 — Feature extraction: six feature columns, everything else falls away
  const counts = [14, 9, 17, 6, 12, 10]
  let idx = 0
  counts.forEach((cnt, k) => {
    for (let j = 0; j < cnt; j++) {
      const top = j === cnt - 1
      put(S[2], idx++, -4 + k * 1.6, -3 + j * 0.4, 0, 0.32, 0.32, 0.32, top ? PAL.ice : mix(PAL.steel, PAL.cyan, j / cnt))
    }
  })
  while (idx < N) {
    const s = 0.05 + rnd() * 0.05
    put(S[2], idx++, (rnd() - 0.5) * 10, (rnd() - 0.5) * 6.4, -1 - rnd() * 2.5, s, s, s, PAL.faint)
  }

  // 3 — Classification: a small forest of decision trees, then an aggregating rail
  const treeEdges: number[] = []
  idx = 0
  for (let t = 0; t < 5; t++) {
    const cx = -4.4 + t * 2.2
    const pos: number[][][] = []
    for (let d = 0; d < 4; d++) {
      pos[d] = []
      const n = 2 ** d
      for (let j = 0; j < n; j++) {
        const x = cx + ((j + 0.5) / n - 0.5) * 1.9
        const y = 3.0 - d * 1.05
        pos[d].push([x, y, 0])
        const s = [0.3, 0.26, 0.22, 0.18][d]
        put(S[3], idx++, x, y, 0, s, s, s, d === 0 ? PAL.cyan : d === 3 ? (rnd() < 0.3 ? PAL.ice : PAL.blue) : PAL.steel)
        if (d > 0) {
          const p = pos[d - 1][Math.floor(j / 2)]
          treeEdges.push(p[0], p[1], 0, x, y, 0)
        }
      }
    }
  }
  const rail = N - idx - 1
  for (let k = 0; k < rail; k++) put(S[3], idx++, -5 + (k * 10) / (rail - 1), -2.5, 0, 0.1, 0.1, 0.1, PAL.dim)
  put(S[3], idx++, 0, -3.5, 0, 0.5, 0.5, 0.5, PAL.ice)

  // 4 — Reporting: a structured JSON-style document
  const levels = [0, 1, 1, 1, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 1, 2, 2, 1, 0]
  for (let r = 0; r < 20; r++) {
    let x = -2.3 + levels[r] * 0.45
    const y = 3.0 - r * 0.31
    for (let p = 0; p < 3; p++) {
      const kw = 0.35 + rnd() * 0.25
      const vw = 0.25 + rnd() * 0.45
      const hot = r >= 16 && r <= 17 && p === 1
      put(S[4], r * 6 + p * 2, x + kw / 2, y, 0, kw, 0.11, 0.1, hot ? PAL.cyan : PAL.dim)
      x += kw + 0.12
      put(S[4], r * 6 + p * 2 + 1, x + vw / 2, y, 0, vw, 0.11, 0.1, hot ? PAL.ice : PAL.steel)
      x += vw + 0.12
    }
  }

  const s0 = S[0]
  return {
    stages: S,
    edges: [
      { positions: new Float32Array(boxEdges(3.7, 2.2, 2.2)), color: '#3de7ff', weights: [0.9, 0.16, 0.08, 0.05, 0.04] },
      { positions: new Float32Array(treeEdges), color: '#3d62c8', weights: [0, 0, 0, 0.8, 0.1] },
      { positions: new Float32Array(rectEdges(5.4, 6.9)), color: '#3d62c8', weights: [0, 0, 0, 0.1, 0.9] },
    ],
    animate0: (i, t, out) => {
      const o = i * STRIDE
      const ph = i * 1.618
      out[0] = s0[o] + Math.sin(t * 0.5 + ph) * 0.35
      out[1] = s0[o + 1] + Math.cos(t * 0.42 + ph * 1.3) * 0.3
      out[2] = s0[o + 2] + Math.sin(t * 0.37 + ph * 0.7) * 0.3
      for (let k = 3; k < STRIDE; k++) out[k] = s0[o + k]
    },
  }
}

/* ------------------------------------------------------------------- PrivDrift */

const RADII = [1.5, 2.3, 3.1, 3.9, 4.7]
const PER_RING = 24
const OMEGA = [0.35, -0.28, 0.22, -0.18, 0.14]
const TILT_Y = 0.55
const TILT_Z = 0.83
const DRIFTED = [5, 27, 41, 58, 66, 83, 92, 104, 118]

const ringPoint = (r: number, phi: number): [number, number, number] => [r * Math.cos(phi), r * Math.sin(phi) * TILT_Y, r * Math.sin(phi) * TILT_Z]

export function privDriftLayout(): Layout {
  const rnd = mulberry32(23)
  const S = [blank(), blank(), blank(), blank()]
  const angle = (i: number) => ((i % PER_RING) / PER_RING) * Math.PI * 2 + Math.floor(i / PER_RING) * 0.4
  const ringCol = (ring: number): RGB => mix(PAL.steel, PAL.cyan, ring / 4)

  // 0 — Collector: five signal rings, alive (see animate0). Static copy = baseline geometry.
  for (let i = 0; i < N; i++) {
    const ring = Math.floor(i / PER_RING)
    const [x, y, z] = ringPoint(RADII[ring], angle(i))
    put(S[0], i, x, y, z, 0.17, 0.17, 0.17, ringCol(ring))
  }

  // 1 — Baseline: the same state, frozen and uniform
  for (let i = 0; i < N; i++) {
    const ring = Math.floor(i / PER_RING)
    const [x, y, z] = ringPoint(RADII[ring], angle(i))
    put(S[1], i, x, y, z, 0.16, 0.16, 0.16, PAL.steel)
  }

  // 2 — Detector: live state vs baseline; a few nodes have drifted
  const connectors: number[] = []
  for (let i = 0; i < N; i++) {
    const ring = Math.floor(i / PER_RING)
    const [x, y, z] = ringPoint(RADII[ring], angle(i))
    const k = DRIFTED.indexOf(i)
    if (k >= 0) {
      const len = Math.hypot(x, y) || 1
      const dx = x + (x / len) * (0.9 + 0.12 * k)
      const dy = y + (y / len) * (0.9 + 0.12 * k) + 0.4
      const dz = z + 1.4 + 0.18 * k
      put(S[2], i, dx, dy, dz, 0.27, 0.27, 0.27, PAL.amber)
      connectors.push(x, y, z, dx, dy, dz)
    } else {
      put(S[2], i, x, y, z, 0.12, 0.12, 0.12, PAL.dim)
    }
  }

  // 3 — Reporter: drifted nodes become a ranked bar chart; unchanged state recedes into a grid
  const heights = [3.8, 3.1, 2.6, 2.2, 1.8, 1.5, 1.2, 0.9, 0.6]
  let m = 0
  for (let i = 0; i < N; i++) {
    const k = DRIFTED.indexOf(i)
    if (k >= 0) {
      const h = heights[k]
      put(S[3], i, -3.6 + k * 0.9, -3.3 + h / 2, 0, 0.5, h, 0.5, k === 0 ? PAL.amber : mix(PAL.amber, PAL.ice, k / 9))
    } else {
      put(S[3], i, -3.85 + (m % 15) * 0.55, 1.3 + Math.floor(m / 15) * 0.36, -2.5, 0.09, 0.09, 0.09, PAL.faint)
      m++
    }
  }
  void rnd

  const ringOutlines: number[] = []
  RADII.forEach((r) => {
    const seg = 72
    for (let s = 0; s < seg; s++) {
      const a = ringPoint(r, (s / seg) * Math.PI * 2)
      const b = ringPoint(r, ((s + 1) / seg) * Math.PI * 2)
      ringOutlines.push(...a, ...b)
    }
  })

  const s0 = S[0]
  return {
    stages: S,
    edges: [
      { positions: new Float32Array(ringOutlines), color: '#3d62c8', weights: [0.4, 0.55, 0.18, 0] },
      { positions: new Float32Array(connectors), color: '#ffb454', weights: [0, 0, 0.9, 0.12] },
    ],
    animate0: (i, t, out) => {
      const o = i * STRIDE
      const ring = Math.floor(i / PER_RING)
      const [x, y, z] = ringPoint(RADII[ring], angle(i) + t * OMEGA[ring])
      out[0] = x
      out[1] = y
      out[2] = z
      for (let k = 3; k < STRIDE; k++) out[k] = s0[o + k]
    },
  }
}
