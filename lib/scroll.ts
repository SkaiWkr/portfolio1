import type Lenis from 'lenis'

let instance: Lenis | null = null
export const setLenis = (l: Lenis | null) => {
  instance = l
}
export const getLenis = () => instance

/** Scroll to an element by id, using Lenis when it's active and the native API otherwise. */
export function scrollToId(id: string, offset = 0) {
  const el = document.getElementById(id)
  if (!el) return
  if (instance) instance.scrollTo(el, { offset, duration: 1.6 })
  else el.scrollIntoView({ behavior: 'auto', block: 'start' })
  history.replaceState(null, '', `#${id}`)
}

export function scrollToY(y: number) {
  if (instance) instance.scrollTo(y, { duration: 1.2 })
  else window.scrollTo({ top: y })
}
