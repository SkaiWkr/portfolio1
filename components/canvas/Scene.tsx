'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette, wrapEffect } from '@react-three/postprocessing'
import { BlendFunction, type BloomEffect } from 'postprocessing'
import { useEffect, useMemo, useRef, useState } from 'react'
import { morphShellLayout, privDriftLayout } from '@/lib/layouts'
import { world } from '@/lib/store'
import { Constellation } from './Constellation'
import { Dust } from './Dust'
import { Lattice } from './Lattice'
import { Morph } from './Morph'
import { Rig } from './Rig'
import { ZoomBurstEffect } from './ZoomBurst'
import { Contact, Credentials, Milestones, Pillars } from './Stations'

type SceneTier = 'lite' | 'full'

/** Phones: render on our own clock so the loop never exceeds ~30fps. */
function FrameCap({ fps }: { fps: number }) {
  const advance = useThree((s) => s.advance)
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => {
    setFrameloop('never')
    let raf = 0
    let last = 0
    // watchdog: lite tier has no PerformanceMonitor (that's R3F-context adaptive-DPR machinery,
    // full-tier only) — if a device can't even sustain this reduced scene, fall back to the static
    // backdrop instead of leaving it janky for the whole visit
    let emaFps = fps
    let badSince = -1
    let fired = false
    const start = performance.now()
    const step = 1000 / fps
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = now - last
      if (dt < step - 1) return
      if (last > 0) emaFps += (1000 / dt - emaFps) * 0.15
      last = now
      advance(now / 1000)
      if (!fired && now - start > 3000) {
        if (emaFps < 12) {
          if (badSince < 0) badSince = now
          else if (now - badSince > 4000) {
            fired = true
            window.dispatchEvent(new Event('sm-perf-fallback'))
          }
        } else {
          badSince = -1
        }
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [advance, fps, setFrameloop])
  return null
}

/** Marks the world as ready once the first frames have been drawn (lets the page fade the canvas in). */
function ReadySignal() {
  const n = useRef(0)
  useFrame(() => {
    if (world.ready) return
    if (++n.current > 3) {
      world.ready = true
      document.documentElement.dataset.ready = 'true'
      window.dispatchEvent(new Event('sm-ready'))
    }
  })
  return null
}

const ZoomBurst = wrapEffect(ZoomBurstEffect)

/**
 * Filmic layer. Fast scrolling and section changes trigger a zoom-burst (radial blur + chromatic split)
 * and a bloom surge; at rest it is just bloom, a soft vignette and a whisper of grain.
 */
/** Mounted once real movement has happened; before that the convolution pass costs nothing because
 *  it doesn't exist yet — the hero's first paint is never slowed down by an effect it isn't using. */
function useEverMoved() {
  const [on, setOn] = useState(false)
  useFrame(() => {
    if (!on && world.burst > 0.01) setOn(true)
  })
  return on
}

function Fx() {
  const zoomReady = useEverMoved()
  const zoom = useRef<ZoomBurstEffect>(null)
  const bloom = useRef<BloomEffect>(null)
  const aspect = useThree((s) => s.size.width / s.size.height)
  useFrame((state) => {
    const z = zoom.current
    if (!z) return
    const b = world.burst
    z.strength = b * 0.12
    z.chroma = 0.25 + b * 0.9
    z.center.set(aspect >= 1.05 ? 0.6 : 0.5, 0.5)
    const flash = Math.exp(-(state.clock.elapsedTime - world.pulse.t) * 2.2)
    if (bloom.current) bloom.current.intensity = 0.9 * world.energy + b * 1.1 + flash * 0.7
  })
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom ref={bloom} intensity={0.9} luminanceThreshold={0.28} luminanceSmoothing={0.35} mipmapBlur radius={0.7} />
      {zoomReady && <ZoomBurst ref={zoom} />}
      <Vignette offset={0.22} darkness={0.6} />
      {/* additive on purpose: soft-light/overlay blends break on HDR values above 1 */}
      <Noise blendFunction={BlendFunction.ADD} opacity={0.012} />
    </EffectComposer>
  )
}

export default function Scene({ tier }: { tier: SceneTier }) {
  const full = tier === 'full'
  const [dpr, setDpr] = useState<number>(full ? 1.5 : 1)
  // second-stage fallback: if dropping resolution isn't enough, drop the postprocessing chain
  // entirely rather than silently giving up — bloom's mip chain is the actual dominant cost on a
  // weak GPU, not the resolution PerformanceMonitor otherwise only ever touches
  const [fx, setFx] = useState(true)
  const morphshell = useMemo(() => morphShellLayout(), [])
  const privdrift = useMemo(() => privDriftLayout(), [])

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: [0, 3.2, 8], fov: 58, near: 0.1, far: 260 }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden
      onCreated={({ gl }) => {
        const el = gl.domElement
        let timer = 0
        el.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          // give the browser a moment to restore the context before giving up on 3D
          timer = window.setTimeout(() => window.dispatchEvent(new Event('sm-webgl-lost')), 2500)
        })
        el.addEventListener('webglcontextrestored', () => window.clearTimeout(timer))
      }}
    >
      <color attach="background" args={['#04070d']} />
      <fog attach="fog" args={['#04070d', 60, 200]} />
      {full && (
        <PerformanceMonitor
          ms={200}
          iterations={6}
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(fx ? 1.5 : 1.25)}
          onFallback={() => setFx(false)}
          flipflops={3}
        />
      )}
      {!full && <FrameCap fps={30} />}
      <Rig tier={tier} />
      <Lattice tier={tier} />
      <Dust tier={tier} />
      <Morph layout={morphshell} stageKey="morphshell" anchor="morphshell" interactive={full} />
      <Morph layout={privdrift} stageKey="privdrift" anchor="privdrift" interactive={full} />
      <Constellation interactive={full} />
      <Pillars />
      <Milestones />
      <Credentials />
      <Contact />
      <ReadySignal />
      {full && fx && <Fx />}
    </Canvas>
  )
}
