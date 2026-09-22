'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Raycaster, ShaderMaterial, Vector2, Vector3 } from 'three'
import { mulberry32 } from '@/lib/rng'
import { damp } from '@/lib/math'
import { world } from '@/lib/store'
import { TRAIL, latticeFragment, latticeVertex } from './shaders'

const CONFIG = {
  full: { cell: 0.9, width: 120, depth: 200, back: 14, far: 185, size: 3.0 },
  lite: { cell: 1.5, width: 84, depth: 130, back: 10, far: 120, size: 3.8 },
} as const

/**
 * The baseline. A field of points that follows the camera; the cursor's recent path drags points
 * out of their baseline positions ("drift") and they settle back as the trail fades.
 */
export function Lattice({ tier }: { tier: 'lite' | 'full' }) {
  const cfg = CONFIG[tier]

  const geometry = useMemo(() => {
    const cols = Math.floor(cfg.width / cfg.cell)
    const rows = Math.floor((cfg.depth + cfg.back) / cfg.cell)
    const pos = new Float32Array(cols * rows * 3)
    const rand = new Float32Array(cols * rows)
    const rnd = mulberry32(5)
    let n = 0
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        pos[n * 3] = (i - cols / 2) * cfg.cell
        pos[n * 3 + 1] = 0
        pos[n * 3 + 2] = -cfg.depth + j * cfg.cell
        rand[n] = rnd()
        n++
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aRand', new BufferAttribute(rand, 1))
    return g
  }, [cfg])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: latticeVertex,
        fragmentShader: latticeFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uCamZ: { value: 0 },
          uCell: { value: cfg.cell },
          uPx: { value: 1 },
          uSize: { value: cfg.size },
          uFar: { value: cfg.far },
          uIntro: { value: 0 },
          uMax: { value: tier === 'full' ? 16 : 6 },
          uPulseO: { value: new Vector2() },
          uPulseR: { value: 0 },
          uPulseK: { value: 0 },
          uTrail: { value: Array.from({ length: TRAIL }, () => new Vector3()) },
          uBase: { value: new Color('#4470f0') },
          uHot: { value: new Color('#3de7ff') },
          uWhite: { value: new Color('#eaf6ff') },
          uDim: { value: 1 },
        },
      }),
    [cfg, tier],
  )

  const raycaster = useMemo(() => new Raycaster(), [])
  const ndc = useMemo(() => new Vector2(), [])
  const s = useRef({ idx: 0, lx: 1e9, lz: 1e9, synth: 0, t0: -1 })

  useFrame((state, dt) => {
    const u = material.uniforms
    const t = state.clock.elapsedTime
    const st = s.current
    if (st.t0 < 0) st.t0 = t

    u.uTime.value = t
    u.uCamZ.value = state.camera.position.z
    u.uPx.value = state.viewport.dpr
    u.uIntro.value = Math.min(1, (t - st.t0) / 2.8)
    u.uDim.value += (world.dim - u.uDim.value) * damp(4, dt)
    u.uBase.value.setRGB(world.tint.r, world.tint.g, world.tint.b)

    // Section-change sweep
    const age = t - world.pulse.t
    u.uPulseO.value.set(world.pulse.x, world.pulse.z)
    u.uPulseR.value = age * 44
    u.uPulseK.value = age < 4 ? Math.exp(-age * 1.2) : 0

    // Drift trail: decay, then spawn from the pointer's position on the ground plane
    const trail = u.uTrail.value as Vector3[]
    const k = Math.exp(-dt * 0.9)
    for (const v of trail) {
      v.z *= k
      if (v.z < 0.01) v.z = 0
    }

    const spawn = (x: number, z: number) => {
      const dx = x - st.lx
      const dz = z - st.lz
      if (dx * dx + dz * dz < 0.8) return
      trail[st.idx].set(x, z, 1)
      st.idx = (st.idx + 1) % TRAIL
      st.lx = x
      st.lz = z
    }

    if (tier === 'full' && world.pointer.moved > 0) {
      ndc.set(world.pointer.x, world.pointer.y)
      raycaster.setFromCamera(ndc, state.camera)
      const o = raycaster.ray.origin
      const d = raycaster.ray.direction
      if (d.y < -0.01) {
        const tt = -o.y / d.y
        if (tt < 140) spawn(o.x + d.x * tt, o.z + d.z * tt)
      }
    } else if (t - st.synth > 0.35) {
      // no pointer (phones, or before the first mouse move): a slow ambient sweep keeps the baseline alive
      st.synth = t
      spawn(Math.sin(t * 0.4) * 9, state.camera.position.z - 16 - (Math.sin(t * 0.23) + 1) * 10)
    }
  })

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />
}
