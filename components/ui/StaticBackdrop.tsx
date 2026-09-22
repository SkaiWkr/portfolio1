/**
 * The no-WebGL backdrop: the same idea as the 3D world, drawn once. Level baseline lines,
 * with one place where they have been pulled off course.
 */
const LINES = 15
const W = 1600
const H = 900

function line(i: number) {
  const t = i / (LINES - 1)
  const y0 = 470 + t * 330
  const spread = 0.35 + t * 0.9
  const pts: string[] = []
  for (let x = 0; x <= W; x += 20) {
    const dx = (x - 1120) / (180 + t * 120)
    const bump = Math.exp(-dx * dx) * (38 + t * 46) * (1 - t * 0.35)
    const wave = Math.sin(x * 0.006 + i * 0.7) * 5 * spread
    pts.push(`${x},${(y0 - bump + wave).toFixed(1)}`)
  }
  return pts.join(' ')
}

export function StaticBackdrop() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="bd-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#3d62c8" stopOpacity="0" />
          <stop offset="0.45" stopColor="#3d62c8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#3de7ff" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {Array.from({ length: LINES }, (_, i) => (
        <polyline key={i} points={line(i)} fill="none" stroke="url(#bd-fade)" strokeWidth={1} opacity={0.25 + (i / LINES) * 0.6} />
      ))}
      <circle cx="1120" cy="612" r="3" fill="#ffb454" />
    </svg>
  )
}
