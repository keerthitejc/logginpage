import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles, Edges, Trail } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { fx } from './fx'

// The only three colours in the whole app
export const INK = '#0E0E10', LAVA = '#FF6A1A', GOLD = '#FFD166'

const damp = THREE.MathUtils.damp

function LavaCore() {
  const group = useRef(), mat = useRef(), inner = useRef()
  const { viewport } = useThree()
  useFrame((state, dt) => {
    fx.energy = damp(fx.energy, 0, 1.2, dt)
    fx.error = damp(fx.error, 0, 2.5, dt)
    fx.success = damp(fx.success, 0, 0.9, dt)
    const t = state.clock.elapsedTime
    const wide = viewport.width > 9
    const dash = fx.mode === 'dashboard'
    const tx = dash ? (wide ? viewport.width * 0.22 : 0) : (wide ? viewport.width * 0.04 : 0)
    const ty = dash ? (wide ? 0 : 2.6) : (wide ? 0.3 : 2.4)
    const g = group.current
    g.position.x = damp(g.position.x, tx + Math.sin(t * 2.4) * fx.error * 0.25, 3, dt)
    g.position.y = damp(g.position.y, ty, 3, dt)
    const s = (wide ? 1.3 : 1.0) * (dash ? 0.8 : 1) * (1 + fx.success * 0.45 + fx.energy * 0.08)
    g.scale.setScalar(damp(g.scale.x, s, 4, dt))
    g.rotation.y += dt * (0.25 + fx.energy * 1.5 + fx.success * 4)
    g.rotation.x = damp(g.rotation.x, fx.pointer.y * 0.4, 2, dt)
    mat.current.distort = damp(mat.current.distort, 0.32 + fx.energy * 0.25 + fx.error * 0.45 + fx.success * 0.3, 4, dt)
    mat.current.speed = 1.5 + fx.energy * 4 + fx.error * 8
    mat.current.emissiveIntensity = 0.55 + fx.energy * 0.6 + fx.success * 2 + Math.sin(t * 2) * 0.08
    inner.current.scale.setScalar(0.72 + Math.sin(t * 3) * 0.02 + fx.success * 0.2)
  })
  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1, 64]} />
        <MeshDistortMaterial ref={mat} color={LAVA} emissive={LAVA} emissiveIntensity={0.6}
          roughness={0.25} metalness={0.35} distort={0.35} speed={1.5} />
      </mesh>
      <mesh ref={inner}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.35} blending={THREE.AdditiveBlending} />
      </mesh>
      <Rings />
      <Moons />
    </group>
  )
}

function Rings() {
  const r = useRef([])
  useFrame((_, dt) => {
    const sp = 1 + fx.energy * 3 + fx.success * 6
    r.current.forEach((m, i) => { if (!m) return; m.rotation.z += dt * (0.2 + i * 0.12) * sp * (i % 2 ? -1 : 1); m.rotation.x += dt * 0.05 * (i + 1) })
  })
  return [1.55, 1.85, 2.2].map((rad, i) => (
    <mesh key={i} ref={(el) => (r.current[i] = el)} rotation={[Math.PI / 2.3 + i * 0.35, i * 0.6, 0]}>
      <torusGeometry args={[rad, 0.008 + i * 0.004, 16, 160]} />
      <meshBasicMaterial color={i === 1 ? LAVA : GOLD} transparent opacity={0.85 - i * 0.2} toneMapped={false} />
    </mesh>
  ))
}

function Moons() {
  const a = useRef(), b = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime * (1 + fx.energy * 2)
    a.current.position.set(Math.cos(t * 0.9) * 2.0, Math.sin(t * 0.9) * 0.6, Math.sin(t * 0.9) * 2.0)
    b.current.position.set(Math.cos(-t * 0.6 + 2) * 2.4, Math.cos(t * 0.6) * 0.9, Math.sin(-t * 0.6 + 2) * 2.4)
  })
  return (
    <>
      <Trail width={1.2} length={6} color={GOLD} attenuation={(w) => w * w}>
        <mesh ref={a}><sphereGeometry args={[0.07, 16, 16]} /><meshBasicMaterial color={GOLD} toneMapped={false} /></mesh>
      </Trail>
      <Trail width={0.9} length={5} color={LAVA} attenuation={(w) => w * w}>
        <mesh ref={b}><sphereGeometry args={[0.05, 16, 16]} /><meshBasicMaterial color={LAVA} toneMapped={false} /></mesh>
      </Trail>
    </>
  )
}

function Shards({ count = 16 }) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({
    pos: [(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10, -2 - Math.random() * 8],
    scale: 0.15 + Math.random() * 0.45,
    rot: [Math.random() * 6, Math.random() * 6, 0],
    geo: i % 3,
  })), [count])
  return items.map((it, i) => (
    <Float key={i} speed={1 + (i % 4) * 0.4} rotationIntensity={2} floatIntensity={2.5}>
      <mesh position={it.pos} scale={it.scale} rotation={it.rot}>
        {it.geo === 0 ? <octahedronGeometry /> : it.geo === 1 ? <tetrahedronGeometry /> : <icosahedronGeometry />}
        <meshStandardMaterial color={INK} metalness={0.9} roughness={0.2} />
        <Edges color={i % 2 ? GOLD : LAVA} threshold={10} />
      </mesh>
    </Float>
  ))
}

function Embers({ count = 600 }) {
  const ref = useRef()
  const [positions, speeds, colors] = useMemo(() => {
    const p = new Float32Array(count * 3), s = new Float32Array(count), c = new Float32Array(count * 3)
    const lava = new THREE.Color(LAVA), gold = new THREE.Color(GOLD)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 24
      p[i * 3 + 1] = (Math.random() - 0.5) * 14
      p[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2
      s[i] = 0.2 + Math.random() * 0.8
      const col = Math.random() > 0.5 ? lava : gold
      c.set([col.r, col.g, col.b], i * 3)
    }
    return [p, s, c]
  }, [count])
  useFrame((state, dt) => {
    const arr = ref.current.geometry.attributes.position.array
    const boost = 1 + fx.energy * 2 + fx.success * 10
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt * boost
      arr[i * 3] += Math.sin(t + i) * dt * 0.15
      if (arr[i * 3 + 1] > 7) arr[i * 3 + 1] = -7
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.9} depthWrite={false}
        blending={THREE.AdditiveBlending} toneMapped={false} sizeAttenuation />
    </points>
  )
}

function LavaFloor() {
  const ref = useRef()
  const geo = useMemo(() => new THREE.PlaneGeometry(40, 20, 80, 40), [])
  const base = useMemo(() => geo.attributes.position.array.slice(), [geo])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const a = geo.attributes.position.array
    const amp = 0.35 + fx.energy * 0.4 + fx.success * 1.2
    for (let i = 0; i < a.length; i += 3) {
      const x = base[i], y = base[i + 1]
      a[i + 2] = Math.sin(x * 0.4 + t) * Math.cos(y * 0.5 + t * 0.7) * amp + Math.sin(x * 1.3 - t * 1.5) * 0.08
    }
    geo.attributes.position.needsUpdate = true
  })
  return (
    <mesh ref={ref} geometry={geo} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -3.6, -4]}>
      <meshBasicMaterial color={LAVA} wireframe transparent opacity={0.22} toneMapped={false} />
    </mesh>
  )
}

function CameraRig() {
  useFrame((state, dt) => {
    const c = state.camera
    c.position.x = damp(c.position.x, fx.pointer.x * 0.8, 2, dt)
    c.position.y = damp(c.position.y, fx.pointer.y * 0.5, 2, dt)
    c.lookAt(0, 0, 0)
  })
  return null
}

function Effects() {
  const ca = useRef()
  const offset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), [])
  useFrame(() => { const o = 0.0006 + fx.error * 0.012; offset.set(o, o) })
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={1.25} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
      <ChromaticAberration ref={ca} offset={offset} blendFunction={BlendFunction.NORMAL} />
      <Noise opacity={0.04} />
      <Vignette eskil={false} offset={0.2} darkness={0.85} />
    </EffectComposer>
  )
}

export default function Scene() {
  return (
    <Canvas className="scene" dpr={[1, 1.75]} camera={{ position: [0, 0, 7], fov: 50 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}>
      <color attach="background" args={[INK]} />
      <fog attach="fog" args={[INK, 8, 22]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[4, 3, 4]} intensity={60} color={GOLD} />
      <pointLight position={[-5, -2, 2]} intensity={40} color={LAVA} />
      <LavaCore />
      <Shards />
      <Embers />
      <LavaFloor />
      <Sparkles count={80} scale={[14, 8, 6]} size={3} speed={0.6} color={GOLD} />
      <CameraRig />
      <Effects />
    </Canvas>
  )
}
