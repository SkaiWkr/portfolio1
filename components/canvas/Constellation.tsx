'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Object3D,
} from 'three'
import { STATION_Y } from '@/lib/camera'
import { skills } from '@/lib/data'
import { damp, sstep } from '@/lib/math'
import { stationZ, world } from '@/lib/store'

const HUB_R = 3.6
const Z = stationZ('arsenal')

const DIM = new Color('#1c2c62')
const STEEL = new Color('#3d62c8')
const CYAN = new Color('#3de7ff').multiplyScalar(1.5)
const ICE = new Color('#e8f4ff').multiplyScalar(1.9)

/** Skills as an orbiting system: one hub per group, one node per skill. DOM controls drive the highlight. */
export function Constellation({ interactive }: { interactive: boolean }) {
  const group = useRef<Group>(null)
  const hubMesh = useRef<InstancedMesh>(null)
  const nodeMesh = useRef<InstancedMesh>(null)
  const lineRef = useRef<LineSegments>(null)
  const core = useRef<Object3D>(null)
  const ang = useRef(0)

  const model = useMemo(() => {
    const hubs = skills.map((_, k) => {
      const a = (k / skills.length) * Math.PI * 2
      return { angle: a, x: Math.cos(a) * HUB_R, y: Math.sin(k * 1.7) * 1.1, z: Math.sin(a) * HUB_R }
    })
    const nodes: { hub: number; ox: number; oy: number; oz: number; speed: number; phase: number }[] = []
    skills.forEach((g, k) => {
      const n = g.items.length
      const R = 0.9 + Math.sqrt(n) * 0.32
      for (let j = 0; j < n; j++) {
        const y = 1 - ((j + 0.5) / n) * 2
        const rad = Math.sqrt(1 - y * y)
        const th = j * 2.399963
        nodes.push({
          hub: k,
          ox: Math.cos(th) * rad * R,
          oy: y * R,
          oz: Math.sin(th) * rad * R,
          speed: (k % 2 ? -1 : 1) * (0.16 + 0.03 * k),
          phase: j * 0.7,
        })
      }
    })
    return { hubs, nodes }
  }, [])

  const inten = useRef({ hub: new Float32Array(skills.length), node: new Float32Array(model.nodes.length) })
  const dummy = useMemo(() => new Object3D(), [])
  const c = useMemo(() => new Color(), [])

  const lineGeo = useMemo(() => {
    const segs = model.nodes.length + model.hubs.length
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(segs * 6), 3))
    g.setAttribute('color', new BufferAttribute(new Float32Array(segs * 6), 3))
    return g
  }, [model])
  const lineMat = useMemo(
    () => new LineBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.9 }),
    [],
  )

  useFrame((state, dt) => {
    const g = group.current
    const hm = hubMesh.current
    const nm = nodeMesh.current
    const lg = lineRef.current
    if (!g || !hm || !nm || !lg) return
    const dz = Math.abs(world.camZ - Z)
    g.visible = dz < 75
    if (!g.visible) return
    const fade = 1 - sstep(38, 75, dz)
    const t = state.clock.elapsedTime
    const cat = world.arsenal.cat

    // turn the active hub toward the camera along the shortest path
    const target = model.hubs[cat].angle - Math.PI / 2
    let d = (target - ang.current) % (Math.PI * 2)
    if (d > Math.PI) d -= Math.PI * 2
    if (d < -Math.PI) d += Math.PI * 2
    ang.current += d * damp(2.4, dt)
    g.rotation.y = ang.current + Math.sin(t * 0.3) * 0.05
    const ry = interactive ? world.pointer.x * 0.15 : 0
    g.rotation.x += ((interactive ? -world.pointer.y * 0.1 : 0) - g.rotation.x) * damp(3, dt)
    g.rotation.z = ry * 0.2

    const pos = lineGeo.getAttribute('position') as BufferAttribute
    const col = lineGeo.getAttribute('color') as BufferAttribute
    const { hub: hi, node: ni } = inten.current

    // hubs
    model.hubs.forEach((h, k) => {
      const tgt = k === cat ? 1 : 0.28
      hi[k] += (tgt - hi[k]) * damp(6, dt)
      dummy.position.set(h.x, h.y, h.z)
      dummy.scale.setScalar(0.15 + hi[k] * 0.12)
      dummy.updateMatrix()
      hm.setMatrixAt(k, dummy.matrix)
      hm.setColorAt(k, c.copy(DIM).lerp(ICE, hi[k]))
      // spoke to the core
      const o = (model.nodes.length + k) * 6
      pos.setXYZ(o / 3, h.x, h.y, h.z)
      pos.setXYZ(o / 3 + 1, 0, 0, 0)
      c.copy(DIM).lerp(STEEL, hi[k]).multiplyScalar(0.55)
      col.setXYZ(o / 3, c.r, c.g, c.b)
      col.setXYZ(o / 3 + 1, c.r * 0.2, c.g * 0.2, c.b * 0.2)
    })

    // skills orbit their hub
    model.nodes.forEach((n, i) => {
      const h = model.hubs[n.hub]
      const th = t * n.speed + n.phase
      const cs = Math.cos(th)
      const sn = Math.sin(th)
      const x = h.x + n.ox * cs - n.oz * sn
      const y = h.y + n.oy + Math.sin(t * 0.5 + i) * 0.06
      const z = h.z + n.ox * sn + n.oz * cs
      const hovered = world.arsenal.node === i
      const tgt = hovered ? 1.7 : n.hub === cat ? 1 : 0.22
      ni[i] += (tgt - ni[i]) * damp(8, dt)
      dummy.position.set(x, y, z)
      dummy.scale.setScalar(0.06 + ni[i] * 0.07)
      dummy.updateMatrix()
      nm.setMatrixAt(i, dummy.matrix)
      nm.setColorAt(i, c.copy(DIM).lerp(hovered ? ICE : CYAN, Math.min(1, ni[i])))
      pos.setXYZ(i * 2, h.x, h.y, h.z)
      pos.setXYZ(i * 2 + 1, x, y, z)
      c.copy(STEEL).multiplyScalar(0.12 + ni[i] * 0.4)
      col.setXYZ(i * 2, c.r, c.g, c.b)
      col.setXYZ(i * 2 + 1, c.r, c.g, c.b)
    })

    hm.instanceMatrix.needsUpdate = true
    nm.instanceMatrix.needsUpdate = true
    if (hm.instanceColor) hm.instanceColor.needsUpdate = true
    if (nm.instanceColor) nm.instanceColor.needsUpdate = true
    pos.needsUpdate = true
    col.needsUpdate = true
    lineMat.opacity = 0.9 * fade
    if (core.current) {
      core.current.rotation.y = t * 0.3
      core.current.rotation.x = t * 0.2
      core.current.scale.setScalar(0.5 + Math.sin(t * 1.4) * 0.03)
    }
    void MathUtils
  })

  return (
    <group ref={group} position={[0, STATION_Y, Z]} visible={false}>
      <instancedMesh ref={hubMesh} args={[undefined, undefined, model.hubs.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={nodeMesh} args={[undefined, undefined, model.nodes.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <lineSegments ref={lineRef} geometry={lineGeo} material={lineMat} frustumCulled={false} />
      <mesh ref={core}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#3de7ff" wireframe toneMapped={false} />
      </mesh>
    </group>
  )
}
