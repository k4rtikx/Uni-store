import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { pointer, reducedMotion } from './webgl';

const Book = ({ position, rotation = 0, color, size = [1.7, 0.28, 1.2] }) => (
  <group position={position} rotation={[0, rotation, 0]}>
    {/* cover */}
    <mesh castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.1} />
    </mesh>
    {/* page block (slightly inset, lighter) */}
    <mesh position={[0.06, 0, 0]}>
      <boxGeometry args={[size[0] - 0.12, size[1] - 0.06, size[2] + 0.02]} />
      <meshStandardMaterial color="#f8fafc" roughness={0.9} />
    </mesh>
  </group>
);

const Calculator = ({ position }) => {
  const keys = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      keys.push(
        <mesh key={`${r}-${c}`} position={[-0.3 + c * 0.3, 0.1, -0.05 + r * 0.26]}>
          <boxGeometry args={[0.2, 0.07, 0.17]} />
          <meshStandardMaterial color={r === 3 && c === 2 ? '#f59e0b' : '#e2e8f0'} roughness={0.5} />
        </mesh>
      );
    }
  }
  return (
    <group position={position} rotation={[0, -0.5, 0]}>
      <mesh>
        <boxGeometry args={[1.05, 0.12, 1.55]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.08, -0.58]}>
        <boxGeometry args={[0.85, 0.05, 0.28]} />
        <meshStandardMaterial color="#6ee7b7" emissive="#10b981" emissiveIntensity={0.35} />
      </mesh>
      <group position={[0, 0, -0.1]}>{keys}</group>
    </group>
  );
};

const GiftBox = ({ position }) => (
  <group position={position} rotation={[0, 0.4, 0]}>
    <mesh>
      <boxGeometry args={[0.8, 0.7, 0.8]} />
      <meshStandardMaterial color="#14b8a6" roughness={0.4} />
    </mesh>
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.84, 0.74, 0.16]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.35} />
    </mesh>
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.16, 0.74, 0.84]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.16, 0.06, 12, 24]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
  </group>
);

const GradCap = ({ position }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion()) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.3) * 0.12;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.25;
  });
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1.5, 0.08, 1.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.38, 0.45, 0.35, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      <mesh position={[0.5, -0.1, 0.5]}>
        <cylinderGeometry args={[0.015, 0.015, 0.55, 8]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0.5, -0.4, 0.5]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
};

const Orbit = () => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion()) return;
    ref.current.rotation.z = state.clock.elapsedTime * 0.25;
    ref.current.rotation.x = Math.PI / 2.4 + Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[2.3, 0.03, 12, 90]} />
      <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} transparent opacity={0.7} />
    </mesh>
  );
};

const Rig = () => {
  const group = useRef();
  useFrame((state, dt) => {
    if (!group.current) return;
    const still = reducedMotion();
    const idle = still ? 0 : state.clock.elapsedTime * 0.25;
    const ty = idle + (still ? 0 : pointer.x * 0.7);
    const tx = still ? 0 : -pointer.y * 0.3;
    const k = Math.min(1, dt * 3);
    group.current.rotation.y += (ty - group.current.rotation.y) * k;
    group.current.rotation.x += (tx - group.current.rotation.x) * k;
  });
  return (
    <group ref={group} position={[0, -0.3, 0]}>
      <Book position={[0, -0.6, 0]} rotation={0.1} color="#047857" />
      <Book position={[0.1, -0.3, 0.02]} rotation={-0.18} color="#0f766e" size={[1.55, 0.26, 1.1]} />
      <Book position={[-0.05, -0.02, 0]} rotation={0.25} color="#0e7490" size={[1.4, 0.24, 1]} />
      <Calculator position={[1.7, -0.5, 0.6]} />
      <GiftBox position={[-1.7, -0.25, 0.5]} />
      <GradCap position={[0, 0.9, 0]} />
      <Orbit />
    </group>
  );
};

/**
 * Interactive WebGL hero: books + calculator + gift box + grad cap, orbiting ring.
 * Reacts to the mouse position and slowly rotates on its own.
 */
const HeroScene = () => (
  <Canvas
    dpr={[1, 2]}
    camera={{ position: [0, 1.6, 6.2], fov: 42 }}
    gl={{ alpha: true, antialias: true }}
    style={{ pointerEvents: 'none' }}
  >
    <ambientLight intensity={1.1} />
    <directionalLight position={[4, 6, 4]} intensity={2.2} />
    <pointLight position={[-4, 2, 3]} intensity={25} color="#2dd4bf" />
    <Rig />
  </Canvas>
);

export default HeroScene;
