import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import { useRef } from "react";

function Core() {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Normal continuous rotation
    meshRef.current.rotation.x = time * 0.25;
    meshRef.current.rotation.y = time * 0.4;

    // Mouse movement
    const mouseX = state.pointer.x;
    const mouseY = state.pointer.y;

    // Smooth movement toward mouse position
    meshRef.current.position.x +=
      (mouseX * 0.8 - meshRef.current.position.x) * 0.03;

    meshRef.current.position.y +=
      (mouseY * 0.5 - meshRef.current.position.y) * 0.03;
  });

  return (
    <Float
      speed={2}
      rotationIntensity={1}
      floatIntensity={2}
    >
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 2]} />

        <meshStandardMaterial
          color="#6366f1"
          wireframe
          emissive="#4f46e5"
          emissiveIntensity={2}
        />
      </mesh>
    </Float>
  );
}

export default function Scene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>

      <ambientLight intensity={0.5} />

      <pointLight
        position={[3, 3, 3]}
        intensity={20}
        color="#6366f1"
      />

      <pointLight
        position={[-3, -2, 2]}
        intensity={15}
        color="#ec4899"
      />

      <Stars
        radius={50}
        depth={30}
        count={1500}
        factor={3}
        saturation={0}
        fade
        speed={1}
      />

      <Core />

    </Canvas>
  );
}