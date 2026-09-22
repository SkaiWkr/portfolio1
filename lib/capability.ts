export type Tier = 'pending' | 'none' | 'lite' | 'full'

const FX_KEY = 'sm-fx'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function hasWebGL(strict: boolean): boolean {
  try {
    const c = document.createElement('canvas')
    const opts: WebGLContextAttributes = { failIfMajorPerformanceCaveat: strict, powerPreference: 'high-performance' }
    const gl = c.getContext('webgl2', opts) || c.getContext('webgl', opts)
    if (!gl) return false
    ;(gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export function readFxPreference(): 'on' | 'off' | null {
  try {
    const v = window.localStorage.getItem(FX_KEY)
    return v === 'on' || v === 'off' ? v : null
  } catch {
    return null
  }
}

export function writeFxPreference(v: 'on' | 'off') {
  try {
    window.localStorage.setItem(FX_KEY, v)
  } catch {
    /* storage may be unavailable */
  }
}

/**
 * Decide how much of the experience this device gets.
 *   none  – no WebGL, reduced motion, or the visitor turned effects off: static backdrop, no scrubbing
 *   lite  – phones / coarse pointers / low-memory or low-core devices: small point cloud, DPR 1, 30fps, no post-processing
 *   full  – everything
 * `?tier=full|lite|none` overrides detection (useful for QA).
 */
export function detectTier(): Exclude<Tier, 'pending'> {
  const forced = new URLSearchParams(window.location.search).get('tier')
  if (forced === 'full' || forced === 'lite' || forced === 'none') return forced

  if (prefersReducedMotion()) return 'none'
  if (readFxPreference() === 'off') return 'none'
  if (!hasWebGL(true)) return 'none'

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 820
  const nav = navigator as Navigator & { deviceMemory?: number }
  const lowMem = (nav.deviceMemory ?? 8) <= 4
  const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4
  if (coarse || narrow || lowMem || lowCores) return 'lite'
  return 'full'
}
