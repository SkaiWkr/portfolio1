'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three'
import { mulberry32 } from '@/lib/rng'
import { world } from '@/lib/store'

const DEPTH = 110

const vert = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime, uCamZ, uPx, uSize, uBurst;
  varying float vA;
  void main() {
    float baseZ = aSeed.z * ${DEPTH.toFixed(1)};
    float a = uCamZ + 12.0 - baseZ;
    float wz = (uCamZ + 12.0) - mod(a, ${DEPTH.toFixed(1)});      // fixed in the world, wrapped around the camera
    vec3 w = vec3(
      (aSeed.x - 0.5) * 96.0 + sin(uTime * 0.13 + aSeed.y * 21.0) * 1.8,
      0.8 + aSeed.y * 22.0 + sin(uTime * 0.19 + aSeed.x * 31.0) * 0.9,
      wz
    );
    vec4 mv = viewMatrix * vec4(w, 1.0);
    float d = -mv.z;
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed.w) + aSeed.w * 40.0);
    vA = twinkle * smoothstep(1.5, 9.0, d) * (1.0 - smoothstep(60.0, ${(DEPTH - 12).toFixed(1)}, d));
    gl_PointSize = clamp(uSize * uPx * (34.0 / max(d, 1.0)) * (1.0 + uBurst * 1.2), uPx, 6.0 * uPx);
    gl_Position = projectionMatrix * mv;
  }
`
const frag = /* glsl */ `
  varying float vA;
  uniform float uAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float k = smoothstep(0.5, 0.0, r);
    gl_FragColor = vec4(vec3(0.62, 0.76, 1.0), vA * k * uAlpha);
  }
`

/**
 * Sparse dust hanging in the air. Fixed in the world, so it parallaxes against the lattice as the
 * camera moves and gives the void between stations some depth. Purely atmospheric, very low alpha.
 */
export function Dust({ tier }: { tier: 'lite' | 'full' }) {
  const count = tier === 'full' ? 900 : 240
  const { geo, mat } = useMemo(() => {
    const rnd = mulberry32(2026)
    const seed = new Float32Array(count * 4)
    for (let i = 0; i < seed.length; i++) seed[i] = rnd()
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
    g.setAttribute('aSeed', new BufferAttribute(seed, 4))
    const m = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCamZ: { value: 0 }, uPx: { value: 1 }, uSize: { value: tier === 'full' ? 2.2 : 1.8 }, uBurst: { value: 0 }, uAlpha: { value: 0.5 } },
    })
    return { geo: g, mat: m }
  }, [count, tier])

  useFrame((state) => {
    const u = mat.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uCamZ.value = world.camZ
    u.uPx.value = state.gl.getPixelRatio()
    u.uBurst.value = world.burst
    u.uAlpha.value = (tier === 'full' ? 0.5 : 0.35) * world.energy
  })

  return <points geometry={geo} material={mat} frustumCulled={false} />
}
