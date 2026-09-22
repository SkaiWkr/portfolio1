'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three'
import { PORTRAIT_PULLBACK, STATION_DIST, STATION_Y } from '@/lib/camera'
import { N, STRIDE, type Layout } from '@/lib/layouts'
import { damp, sstep } from '@/lib/math'
import { mulberry32 } from '@/lib/rng'
import { world, stationZ, type AnchorId, type StageKey } from '@/lib/store'

const HOT = new Color('#e8f4ff')

interface Props {
  layout: Layout
  stageKey: StageKey
  anchor: AnchorId
  interactive: boolean
}

/**
 * A structure made of N blocks that re-arranges itself as the visitor scrolls through a project's
 * architecture stages. The stage value comes from the pinned section in the DOM.
 */
export function Morph({ layout, stageKey, anchor, interactive }: Props) {
  const group = useRef<Group>(null)
  const mesh = useRef<InstancedMesh>(null)
  const mat = useRef<MeshBasicMaterial>(null)
  const lines = useRef<(LineSegments | null)[]>([])
  const sm = useRef(0)
  const z = stationZ(anchor)
  const S = layout.stages.length

  const camera = useThree((st) => st.camera)
  const aspect = useThree((st) => st.size.width / st.size.height)
  const scratch = useMemo(() => new Float32Array(STRIDE), [])
  // where each block comes from when the structure is far away (x, y, z, arrival delay, spinX, spinY)
  const scatter = useMemo(() => {
    const rnd = mulberry32(anchor === 'morphshell' ? 71 : 97)
    const a = new Float32Array(N * 6)
    for (let i = 0; i < N; i++) {
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(2 * rnd() - 1)
      const r = 12 + rnd() * 22
      a.set([Math.sin(ph) * Math.cos(th) * r, Math.sin(ph) * Math.sin(th) * r * 0.7, Math.cos(ph) * r, rnd(), (rnd() - 0.5) * 6, (rnd() - 0.5) * 6], i * 6)
    }
    return a
  }, [anchor])
  // cursor push, smoothed per block: x, y, z offset + "hot" amount
  const push = useMemo(() => new Float32Array(N * 4), [])
  const wv = useMemo(() => new Vector3(), [])
  const dummy = useMemo(() => new Object3D(), [])
  const color = useMemo(() => new Color(), [])
  const edgeGeo = useMemo(
    () =>
      layout.edges.map((e) => {
        const g = new BufferGeometry()
        g.setAttribute('position', new BufferAttribute(e.positions, 3))
        return g
      }),
    [layout],
  )
  const edgeMat = useMemo(
    () =>
      layout.edges.map(
        (e) => new LineBasicMaterial({ color: e.color, transparent: true, opacity: 0, depthWrite: false }),
      ),
    [layout],
  )

  useEffect(
    () => () => {
      edgeGeo.forEach((g) => g.dispose())
      edgeMat.forEach((m) => m.dispose())
    },
    [edgeGeo, edgeMat],
  )

  useFrame((state, dt) => {
    const g = group.current
    const m = mesh.current
    if (!g || !m) return
    const dz = Math.abs(world.camZ - z)
    g.visible = dz < 75
    if (!g.visible) return
    const fade = 1 - sstep(38, 75, dz)
    // 0 when the camera is at reading distance, 1 when the station is far away
    const rest = aspect >= 1.05 ? STATION_DIST : STATION_DIST * PORTRAIT_PULLBACK
    const scattered = sstep(rest + 3, rest + 36, dz)

    sm.current += (world.stage[stageKey] - sm.current) * damp(7, dt)
    const v = sm.current
    const i0 = Math.min(Math.floor(v), S - 1)
    const i1 = Math.min(i0 + 1, S - 1)
    const e = sstep(0, 1, v - i0)
    const t = state.clock.elapsedTime
    const B = layout.stages[i1]

    for (let i = 0; i < N; i++) {
      const o = i * STRIDE
      let A = layout.stages[i0]
      let ao = o
      if (i0 === 0) {
        layout.animate0(i, t, scratch)
        A = scratch
        ao = 0
      }
      let x = A[ao] + (B[o] - A[ao]) * e
      let y = A[ao + 1] + (B[o + 1] - A[ao + 1]) * e
      let zz = A[ao + 2] + (B[o + 2] - A[ao + 2]) * e
      let sx = A[ao + 3] + (B[o + 3] - A[ao + 3]) * e
      let sy = A[ao + 4] + (B[o + 4] - A[ao + 4]) * e
      let sz = A[ao + 5] + (B[o + 5] - A[ao + 5]) * e

      // arrival: blocks fly in from all around as the camera approaches, each on its own delay,
      // and break apart again as it leaves
      const k6 = i * 6
      const raw = Math.min(1, Math.max(0, scattered * 1.5 - scatter[k6 + 3] * 0.5))
      const sc = raw * raw * (3 - 2 * raw)
      x += scatter[k6] * sc
      y += scatter[k6 + 1] * sc
      zz += scatter[k6 + 2] * sc
      const shrink = 1 - 0.7 * sc
      sx *= shrink
      sy *= shrink
      sz *= shrink

      // the cursor pushes blocks out of place (the same "drift" the floor shows), then they settle back
      const p4 = i * 4
      let tx = 0,
        ty = 0,
        tz = 0,
        th = 0
      if (interactive && world.pointer.moved > 0 && sc < 0.05) {
        wv.set(x, y, zz).applyMatrix4(g.matrixWorld).project(camera)
        const dx = (wv.x - world.pointer.x) * aspect
        const dy = wv.y - world.pointer.y
        const d = Math.hypot(dx, dy) || 1e-4
        const inf = Math.exp(-(d * d) / 0.035)
        tx = (dx / d) * inf * 1.3
        ty = (dy / d) * inf * 1.3
        tz = inf * 0.9
        th = inf
      }
      const kd = damp(tx || ty ? 12 : 5, dt)
      push[p4] += (tx - push[p4]) * kd
      push[p4 + 1] += (ty - push[p4 + 1]) * kd
      push[p4 + 2] += (tz - push[p4 + 2]) * kd
      push[p4 + 3] += (th - push[p4 + 3]) * kd
      x += push[p4]
      y += push[p4 + 1]
      zz += push[p4 + 2]
      const hot = push[p4 + 3]

      dummy.position.set(x, y, zz)
      dummy.rotation.set(scatter[k6 + 4] * sc, scatter[k6 + 5] * sc, 0)
      dummy.scale.set(sx * (1 + hot * 0.35), sy * (1 + hot * 0.35), sz * (1 + hot * 0.35))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      color.setRGB(
        A[ao + 6] + (B[o + 6] - A[ao + 6]) * e,
        A[ao + 7] + (B[o + 7] - A[ao + 7]) * e,
        A[ao + 8] + (B[o + 8] - A[ao + 8]) * e,
      )
      if (hot > 0.02) color.lerp(HOT, Math.min(1, hot * 0.9))
      m.setColorAt(i, color)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    if (mat.current) mat.current.opacity = fade

    layout.edges.forEach((edge, k) => {
      const w = edge.weights
      edgeMat[k].opacity = (w[i0] * (1 - e) + w[i1] * e) * fade
      const l = lines.current[k]
      if (l) l.visible = edgeMat[k].opacity > 0.01
    })

    // gentle float + pointer parallax
    g.position.y = STATION_Y + Math.sin(t * 0.6) * 0.08
    const ry = interactive ? world.pointer.x * 0.28 : 0
    const rx = interactive ? -world.pointer.y * 0.14 : 0
    g.rotation.y += (ry - g.rotation.y) * damp(3, dt)
    g.rotation.x += (rx - g.rotation.x) * damp(3, dt)
  })

  return (
    <group ref={group} position={[0, STATION_Y, z]} visible={false}>
      <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial ref={mat} transparent toneMapped={false} />
      </instancedMesh>
      {layout.edges.map((_, k) => (
        <lineSegments
          key={k}
          ref={(el) => {
            lines.current[k] = el
          }}
          geometry={edgeGeo[k]}
          material={edgeMat[k]}
          frustumCulled={false}
        />
      ))}
    </group>
  )
}
