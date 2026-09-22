'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { PerspectiveCamera, Vector3 } from 'three'
import { locate } from '@/lib/anchors'
import { buildKeys, smootherstep } from '@/lib/camera'
import { damp, lerp } from '@/lib/math'
import { GRADE } from '@/lib/grade'
import { world } from '@/lib/store'

/**
 * Scroll-driven camera. The camera rests at each section's anchor while it is being read and
 * travels between anchors with easing, a small arc and a field-of-view kick.
 */
export function Rig({ tier }: { tier: 'lite' | 'full' }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const keys = useMemo(() => buildKeys(size.width / size.height), [size.width, size.height])
  const st = useRef({ y: 0, vel: 0, px: 0, py: 0, init: false, t0: -1 })
  const tmp = useMemo(() => ({ p: new Vector3(), l: new Vector3() }), [])
  // QA: ?introAt=0.3 freezes the opening shot at 30% so it can be inspected frame by frame
  const introAt = useMemo(() => new URLSearchParams(window.location.search).get('introAt'), [])

  useFrame((state, dt) => {
    const s = st.current
    if (!s.init) {
      s.y = world.scrollY
      s.init = true
    }

    // scroll smoothing + velocity
    const prev = s.y
    s.y += (world.scrollY - s.y) * damp(12, dt)
    const v = Math.abs(s.y - prev) / Math.max(dt, 1e-3) / 1000
    s.vel += (v - s.vel) * damp(6, dt)
    world.velocity = Math.min(s.vel, 2)

    const m = locate(s.y + world.viewportH * 0.5)
    const ids = world.anchors
    const A = ids[m.i] ? keys[ids[m.i].id as keyof typeof keys] : undefined
    const B = ids[m.j] ? keys[ids[m.j].id as keyof typeof keys] : undefined
    if (!A || !B) return

    const e = smootherstep(m.t)
    const inTransit = m.i !== m.j

    // resting period: creep forward slowly so long sections never feel frozen
    const zA = inTransit ? -0.5 * A.dolly : -(m.p - 0.5) * A.dolly
    const zB = inTransit ? 0.5 * B.dolly : zA

    tmp.p.set(lerp(A.pos.x, B.pos.x, e), lerp(A.pos.y, B.pos.y, e), lerp(A.pos.z + zA, B.pos.z + zB, e))
    tmp.l.set(lerp(A.look.x, B.look.x, e), lerp(A.look.y, B.look.y, e), lerp(A.look.z + zA, B.look.z + zB, e))
    tmp.p.y += Math.sin(Math.PI * e) * 1.4

    // pointer parallax (desktop only)
    if (tier === 'full') {
      s.px += (world.pointer.x - s.px) * damp(3, dt)
      s.py += (world.pointer.y - s.py) * damp(3, dt)
      tmp.p.x += s.px * 0.7
      tmp.p.y += s.py * 0.4
      tmp.l.x += s.px * 1.2
    }

    // opening shot: start high and far back with a long lens, then push in while the lens opens up
    if (world.ready && s.t0 < 0) s.t0 = state.clock.elapsedTime
    const it = introAt !== null ? Math.min(1, Math.max(0, parseFloat(introAt))) : s.t0 < 0 ? 0 : Math.min(1, (state.clock.elapsedTime - s.t0) / 3.6)
    const intro = 1 - (1 - it) ** 4 // easeOutQuart
    const opening = 1 - intro
    tmp.p.z += opening * 34
    tmp.p.y += opening * 6

    camera.position.copy(tmp.p)
    camera.lookAt(tmp.l)

    const fov = lerp(A.fov, B.fov, e) + Math.sin(Math.PI * e) * (tier === 'full' ? 7 : 4) + Math.min(s.vel, 1.5) * 1.5 - opening * 15
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    // burst: how violently the world is moving (fast scroll) or mid-flight between two sections
    const burstTarget = Math.min(1, Math.max(Math.min(s.vel, 1.5) * 0.7, inTransit ? Math.sin(Math.PI * e) * 0.6 : 0, opening ** 1.5 * 0.95))
    world.burst += (burstTarget - world.burst) * damp(7, dt)

    // chapter grade
    const GA = GRADE[ids[m.i].id as keyof typeof GRADE]
    const GB = GRADE[ids[m.j].id as keyof typeof GRADE]
    world.tint.r = lerp(GA.c.r, GB.c.r, e)
    world.tint.g = lerp(GA.c.g, GB.c.g, e)
    world.tint.b = lerp(GA.c.b, GB.c.b, e)
    world.energy = lerp(GA.energy, GB.energy, e)

    world.dim = lerp(A.dim, B.dim, e)
    world.camZ = camera.position.z
    world.camX = camera.position.x

    const active = m.t > 0.5 ? m.j : m.i
    if (active !== world.active) {
      world.active = active
      world.pulse = { t: state.clock.elapsedTime, x: camera.position.x, z: camera.position.z - 6 }
    }
  })

  return null
}
