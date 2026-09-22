import { ANCHOR_IDS, world, type Anchor } from './store'

/** Read section positions from the DOM so the camera path always matches the real layout. */
export function measureAnchors() {
  const list: Anchor[] = []
  const y0 = window.scrollY
  for (const id of ANCHOR_IDS) {
    const el = document.querySelector<HTMLElement>(`[data-anchor="${id}"]`)
    if (!el) continue
    const r = el.getBoundingClientRect()
    list.push({
      id,
      top: r.top + y0,
      height: r.height,
      enter: parseFloat(el.dataset.enter ?? '0.25'),
      exit: parseFloat(el.dataset.exit ?? '0.25'),
    })
  }
  world.anchors = list
  world.viewportH = window.innerHeight
}

export interface Located {
  i: number
  j: number
  /** 0 while resting at anchor i, 0..1 while travelling i -> j */
  t: number
  /** progress through the resting period at anchor i */
  p: number
}

/** Map a document Y (viewport centre) onto the camera path. */
export function locate(y: number): Located {
  const a = world.anchors
  const n = a.length
  if (n === 0) return { i: 0, j: 0, t: 0, p: 0 }
  const ps = (k: number) => (k === 0 ? a[0].top : a[k].top + a[k].enter * a[k].height)
  const pe = (k: number) => (k === n - 1 ? a[k].top + a[k].height : a[k].top + a[k].height * (1 - a[k].exit))
  for (let k = 0; k < n; k++) {
    if (y <= pe(k) || k === n - 1) {
      if (y >= ps(k) || k === 0) {
        const span = Math.max(1, pe(k) - ps(k))
        return { i: k, j: k, t: 0, p: Math.min(1, Math.max(0, (y - ps(k)) / span)) }
      }
      const s = pe(k - 1)
      const e = ps(k)
      return { i: k - 1, j: k, t: Math.min(1, Math.max(0, (y - s) / Math.max(1, e - s))), p: 1 }
    }
  }
  return { i: n - 1, j: n - 1, t: 0, p: 1 }
}
