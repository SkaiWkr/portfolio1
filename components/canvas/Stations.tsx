'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Points,
  PointsMaterial,
} from 'three'
import { about, achievements, certifications, site } from '@/lib/data'
import { damp, sstep } from '@/lib/math'
import { mulberry32 } from '@/lib/rng'
import { stationZ, world, type AnchorId } from '@/lib/store'

const STEEL = new Color('#5f8bff')
const DIM = new Color('#16265a')
const CYAN = new Color('#3de7ff')
const ICE = new Color('#e8f4ff')

/** Shared: visible only near the camera, with a soft fade at the edges of the range. */
function useProximity(anchor: AnchorId, ref: React.RefObject<Group | null>) {
  const z = stationZ(anchor)
  return (): number => {
    const g = ref.current
    if (!g) return 0
    const dz = Math.abs(world.camZ - z)
    g.visible = dz < 75
    return g.visible ? 1 - sstep(38, 75, dz) : 0
  }
}

/* ------------------------------------------------------------------ milestones */

/** One slab per recognition. Purely decorative: hovering an entry in the DOM lifts its slab. */
export function Milestones() {
  const group = useRef<Group>(null)
  const slabs = useRef<(Group | null)[]>([])
  const beams = useRef<(Mesh | null)[]>([])
  const lit = useRef(achievements.map(() => 0))
  const fadeOf = useProximity('milestones', group)
  const z = stationZ('milestones')
  const n = achievements.length

  const fillMat = useMemo(() => new MeshBasicMaterial({ color: '#0a1a44', transparent: true, opacity: 0.5, toneMapped: false }), [])
  const lineMats = useMemo(() => achievements.map(() => new LineBasicMaterial({ color: STEEL, transparent: true })), [])
  const beamMats = useMemo(
    () => achievements.map(() => new MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false })),
    [],
  )
  const c = useMemo(() => new Color(), [])

  useFrame((state, dt) => {
    const fade = fadeOf()
    if (!fade) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < n; i++) {
      const on = world.milestone === i ? 1 : 0
      lit.current[i] += (on - lit.current[i]) * damp(6, dt)
      const k = lit.current[i]
      const s = slabs.current[i]
      if (s) {
        s.position.y = Math.sin(t * 0.7 + i * 1.3) * 0.12 + k * 0.7
        s.rotation.y = Math.sin(t * 0.3 + i) * 0.06 + (i - (n - 1) / 2) * -0.16
      }
      lineMats[i].color.copy(c.copy(STEEL).lerp(ICE, k))
      lineMats[i].opacity = (0.85 + k * 0.15) * fade
      beamMats[i].opacity = k * 0.5 * fade
    }
    fillMat.opacity = 0.5 * fade
  })

  const geo = useMemo(() => {
    const g = new BufferGeometry()
    const w = 0.9,
      h = 2.4,
      d = 0.22
    const v = [
      [-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d],
      [-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d],
    ]
    const e = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]
    const p = new Float32Array(e.length * 3)
    e.forEach((k, i) => p.set(v[k], i * 3))
    g.setAttribute('position', new BufferAttribute(p, 3))
    return g
  }, [])

  return (
    <group ref={group} position={[0, 2.4, z]} visible={false}>
      {achievements.map((a, i) => {
        const x = (i - (n - 1) / 2) * 2.7
        return (
          <group key={a.event} position={[x, 0, Math.abs(i - (n - 1) / 2) * -0.6]}>
            <group ref={(el) => void (slabs.current[i] = el)}>
              <mesh material={fillMat}>
                <boxGeometry args={[1.8, 4.8, 0.44]} />
              </mesh>
              <lineSegments geometry={geo} material={lineMats[i]} />
              <mesh ref={(el) => void (beams.current[i] = el)} material={beamMats[i]} position={[0, 0, 0]}>
                <planeGeometry args={[0.16, 14]} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}

/* ---------------------------------------------------------------- credentials */

const RING_R = [1.8, 3.1, 4.4, 5.7]

/** Concentric rings seen from above; one per certification. */
export function Credentials() {
  const group = useRef<Group>(null)
  const rings = useRef<(LineLoop | null)[]>([])
  const tickGroups = useRef<(Object3D | null)[]>([])
  const lit = useRef(certifications.map(() => 0))
  const fadeOf = useProximity('credentials', group)
  const size = useThree((s) => s.size)
  const wide = size.width / size.height >= 1.05
  const z = stationZ('credentials')
  const c = useMemo(() => new Color(), [])

  const circle = useMemo(
    () =>
      RING_R.map((r) => {
        const seg = 160
        const p = new Float32Array(seg * 3)
        for (let i = 0; i < seg; i++) {
          const a = (i / seg) * Math.PI * 2
          p[i * 3] = Math.cos(a) * r
          p[i * 3 + 2] = Math.sin(a) * r
        }
        const g = new BufferGeometry()
        g.setAttribute('position', new BufferAttribute(p, 3))
        return g
      }),
    [],
  )
  const ticks = useMemo(
    () =>
      RING_R.map((r, k) => {
        const count = 10 + k * 6
        const p = new Float32Array(count * 6)
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2
          const ca = Math.cos(a),
            sa = Math.sin(a)
          p.set([ca * (r - 0.12), 0, sa * (r - 0.12), ca * (r + 0.12), 0, sa * (r + 0.12)], i * 6)
        }
        const g = new BufferGeometry()
        g.setAttribute('position', new BufferAttribute(p, 3))
        return g
      }),
    [],
  )
  const mats = useMemo(() => RING_R.map(() => new LineBasicMaterial({ color: STEEL, transparent: true })), [])
  const tickMats = useMemo(() => RING_R.map(() => new LineBasicMaterial({ color: STEEL, transparent: true })), [])

  useFrame((state, dt) => {
    const fade = fadeOf()
    const g = group.current
    if (!fade || !g) return
    const t = state.clock.elapsedTime
    g.position.x += ((wide ? 5.2 : 0) - g.position.x) * damp(4, dt)
    for (let i = 0; i < RING_R.length; i++) {
      const on = i < certifications.length && world.cred === i ? 1 : 0
      lit.current[i] += (on - lit.current[i]) * damp(6, dt)
      const k = lit.current[i]
      const dir = i % 2 ? -1 : 1
      const tg = tickGroups.current[i]
      if (tg) tg.rotation.y = t * 0.12 * dir * (1 + i * 0.3) + k * 0.4
      const ring = rings.current[i]
      if (ring) ring.rotation.y = -t * 0.03 * dir
      c.copy(STEEL).lerp(CYAN, k)
      mats[i].color.copy(c)
      mats[i].opacity = (0.7 + k * 0.3) * fade
      tickMats[i].color.copy(c.copy(DIM).lerp(ICE, 0.4 + k * 0.6))
      tickMats[i].opacity = (0.7 + k * 0.3) * fade
    }
  })

  return (
    <group ref={group} position={[0, 0.06, wide ? z : z - 14]} visible={false}>
      {RING_R.map((_, i) => (
        <group key={i}>
          <lineLoop ref={(el) => void (rings.current[i] = el)} geometry={circle[i]} material={mats[i]} />
          <group ref={(el) => void (tickGroups.current[i] = el)}>
            <lineSegments geometry={ticks[i]} material={tickMats[i]} />
          </group>
        </group>
      ))}
    </group>
  )
}

/* -------------------------------------------------------------------- contact */

const CONTACT_LINKS = [site.links.github, site.links.linkedin, site.links.email]

/** A ring of points with one node per channel. Hovering a channel in the DOM lights its node. */
export function Contact() {
  const group = useRef<Group>(null)
  const ring = useRef<Points>(null)
  const nodes = useRef<(Mesh | null)[]>([])
  const lit = useRef(CONTACT_LINKS.map(() => 0))
  const fadeOf = useProximity('contact', group)
  const z = stationZ('contact')

  const ptsGeo = useMemo(() => {
    const rnd = mulberry32(11)
    const n = 1800
    const p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2
      const r = 4 + (rnd() - 0.5) * 1.1
      const y = (rnd() - 0.5) * 0.9 * Math.pow(rnd(), 1.5)
      p.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(p, 3))
    return g
  }, [])
  const ptsMat = useMemo(
    () => new PointsMaterial({ color: '#7aa2ff', size: 0.075, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  )
  const spokeGeo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(CONTACT_LINKS.length * 6), 3))
    return g
  }, [])
  const spokeMat = useMemo(
    () => new LineBasicMaterial({ color: '#3d62c8', transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false }),
    [],
  )
  const nodeMats = useMemo(() => CONTACT_LINKS.map(() => new MeshBasicMaterial({ color: '#3d62c8', transparent: true, toneMapped: false })), [])
  const c = useMemo(() => new Color(), [])

  useFrame((state, dt) => {
    const fade = fadeOf()
    const g = group.current
    if (!fade || !g) return
    const t = state.clock.elapsedTime
    if (ring.current) ring.current.rotation.y = t * 0.06
    g.rotation.x += ((0.55 + world.pointer.y * 0.12) - g.rotation.x) * damp(3, dt)
    g.rotation.z += ((world.pointer.x * 0.08) - g.rotation.z) * damp(3, dt)
    ptsMat.opacity = 0.9 * fade
    spokeMat.opacity = 0.6 * fade

    const pos = spokeGeo.getAttribute('position') as BufferAttribute
    CONTACT_LINKS.forEach((_, i) => {
      const on = world.contact === i ? 1 : 0
      lit.current[i] += (on - lit.current[i]) * damp(7, dt)
      const k = lit.current[i]
      const a = t * 0.18 + (i / CONTACT_LINKS.length) * Math.PI * 2
      const x = Math.cos(a) * 4
      const zz = Math.sin(a) * 4
      const node = nodes.current[i]
      if (node) {
        node.position.set(x, 0, zz)
        node.scale.setScalar(0.22 + k * 0.32)
      }
      nodeMats[i].color.copy(c.set('#3d62c8').lerp(ICE, k))
      nodeMats[i].opacity = fade
      pos.setXYZ(i * 2, x, 0, zz)
      pos.setXYZ(i * 2 + 1, 0, 0, 0)
    })
    pos.needsUpdate = true
  })

  return (
    <group ref={group} position={[0, 4.4, z]} visible={false}>
      <points ref={ring} geometry={ptsGeo} material={ptsMat} frustumCulled={false} />
      <lineSegments geometry={spokeGeo} material={spokeMat} frustumCulled={false} />
      {CONTACT_LINKS.map((l, i) => (
        <mesh key={l.label} ref={(el) => void (nodes.current[i] = el)} material={nodeMats[i]}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
      <mesh scale={0.3}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#3de7ff" wireframe toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------------------------------- about */

const PILLAR_H = 3.3
const SPACING = 3.3

type Builder = { count: number; init: (pos: Float32Array) => void; frame: (t: number, pos: Float32Array, col: Float32Array, k: number) => void }

const shade = (out: Float32Array, i: number, b: number, k: number) => {
  // DIM -> CYAN -> ICE as b rises; k (hover) lifts the whole pillar
  const v = Math.min(1, b + k * 0.45)
  const w = Math.max(0, v - 0.6) / 0.4
  out[i * 3] = 0.06 + v * 0.2 + w * 0.7
  out[i * 3 + 1] = 0.1 + v * 0.75 + w * 0.2
  out[i * 3 + 2] = 0.3 + v * 0.7 + w * 0.1
}

/** Detect: a fixed grid — the baseline — with a scan band that momentarily disturbs whatever it crosses. */
const detect = (): Builder => {
  const cols = 5,
    rows = 30,
    deep = 2
  const count = cols * rows * deep
  const base = new Float32Array(count * 3)
  let n = 0
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      for (let d = 0; d < deep; d++) {
        base.set([(c - (cols - 1) / 2) * 0.42, -PILLAR_H + (r / (rows - 1)) * PILLAR_H * 2, (d - 0.5) * 0.5], n * 3)
        n++
      }
  return {
    count,
    init: (pos) => pos.set(base),
    frame: (t, pos, col, k) => {
      const scan = (((t * 0.32) % 1.4) - 0.2) * PILLAR_H * 2 - PILLAR_H
      for (let i = 0; i < count; i++) {
        const y = base[i * 3 + 1]
        const b = Math.exp(-Math.pow((y - scan) / 0.55, 2))
        pos[i * 3] = base[i * 3] + b * Math.sin(t * 5 + i) * 0.16
        pos[i * 3 + 1] = y
        pos[i * 3 + 2] = base[i * 3 + 2] + b * Math.cos(t * 4 + i * 1.3) * 0.16
        shade(col, i, 0.12 + b, k)
      }
    },
  }
}

/** Analyze: a double helix with rungs, turning as it is read. */
const analyze = (): Builder => {
  const strand = 90,
    rungs = 30
  const count = strand * 2 + rungs * 3
  return {
    count,
    init: () => {},
    frame: (t, pos, col, k) => {
      let n = 0
      const at = (s: number, y: number) => {
        const a = y * 1.35 + t * 0.55 + s * Math.PI
        return [Math.cos(a) * 0.85, Math.sin(a) * 0.85] as const
      }
      for (let s = 0; s < 2; s++)
        for (let i = 0; i < strand; i++) {
          const y = -PILLAR_H + (i / (strand - 1)) * PILLAR_H * 2
          const [x, z] = at(s, y)
          pos.set([x, y, z], n * 3)
          shade(col, n, 0.25 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(y * 1.7 - t * 1.6), 3), k)
          n++
        }
      for (let r = 0; r < rungs; r++) {
        const y = -PILLAR_H + ((r + 0.5) / rungs) * PILLAR_H * 2
        const [x0, z0] = at(0, y)
        const [x1, z1] = at(1, y)
        for (let q = 0; q < 3; q++) {
          const f = (q + 1) / 4
          pos.set([x0 + (x1 - x0) * f, y, z0 + (z1 - z0) * f], n * 3)
          shade(col, n, 0.14 + 0.3 * Math.pow(0.5 + 0.5 * Math.sin(y * 1.7 - t * 1.6), 3), k)
          n++
        }
      }
    },
  }
}

/** Defend: stacked rings that breathe in sequence — a closed perimeter that holds. */
const defend = (): Builder => {
  const rings = 10,
    per = 28
  const count = rings * per
  return {
    count,
    init: () => {},
    frame: (t, pos, col, k) => {
      let n = 0
      for (let r = 0; r < rings; r++) {
        const y = -PILLAR_H + ((r + 0.5) / rings) * PILLAR_H * 2
        const rad = 0.75 + 0.3 * Math.sin(t * 0.8 + r * 0.7)
        const dir = r % 2 ? -1 : 1
        const pulse = Math.pow(Math.max(0, Math.sin(t * 1.5 - r * 0.7)), 4)
        for (let i = 0; i < per; i++) {
          const a = (i / per) * Math.PI * 2 + t * 0.3 * dir
          pos.set([Math.cos(a) * rad, y, Math.sin(a) * rad], n * 3)
          shade(col, n, 0.2 + 0.7 * pulse, k)
          n++
        }
      }
    },
  }
}

/** Detect · Analyze · Defend as three abstract columns; hovering a pillar in the DOM lifts its column. */
export function Pillars() {
  const group = useRef<Group>(null)
  const fadeOf = useProximity('about', group)
  const z = stationZ('about')
  const lit = useRef([0, 0, 0])
  const items = useMemo(() => {
    return [detect(), analyze(), defend()].map((b) => {
      const pos = new Float32Array(b.count * 3)
      const col = new Float32Array(b.count * 3)
      b.init(pos)
      const g = new BufferGeometry()
      g.setAttribute('position', new BufferAttribute(pos, 3))
      g.setAttribute('color', new BufferAttribute(col, 3))
      const m = new PointsMaterial({
        size: 0.1,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
      return { b, pos, col, g, m }
    })
  }, [])
  const frameGeo = useMemo(() => {
    const w = 0.95
    const h = PILLAR_H + 0.35
    const p = new Float32Array([-w, -h, 0, w, -h, 0, w, -h, 0, w, h, 0, w, h, 0, -w, h, 0, -w, h, 0, -w, -h, 0])
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(p, 3))
    return g
  }, [])
  const frameMat = useMemo(() => new LineBasicMaterial({ color: '#2a4390', transparent: true, opacity: 0.5 }), [])

  useFrame((state, dt) => {
    const fade = fadeOf()
    const g = group.current
    if (!fade || !g) return
    const t = state.clock.elapsedTime
    g.rotation.y = Math.sin(t * 0.25) * 0.08 + world.pointer.x * 0.1
    items.forEach((it, i) => {
      lit.current[i] += ((world.about === i ? 1 : 0) - lit.current[i]) * damp(6, dt)
      it.b.frame(t, it.pos, it.col, lit.current[i])
      ;(it.g.getAttribute('position') as BufferAttribute).needsUpdate = true
      ;(it.g.getAttribute('color') as BufferAttribute).needsUpdate = true
      it.m.opacity = (0.75 + lit.current[i] * 0.25) * fade
      it.m.size = 0.1 + lit.current[i] * 0.05
    })
    frameMat.opacity = 0.5 * fade
  })

  return (
    <group ref={group} position={[0, STATION_Y_ABOUT, z]} visible={false}>
      {items.map((it, i) => (
        <group key={i} position={[(i - (about.pillars.length - 1) / 2) * SPACING, 0, 0]}>
          <points geometry={it.g} material={it.m} frustumCulled={false} />
          <lineSegments geometry={frameGeo} material={frameMat} />
        </group>
      ))}
    </group>
  )
}

const STATION_Y_ABOUT = 3.2
