import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { pointer, reducedMotion } from './webgl';

/* ── Individual campus item meshes ── */

const Book = ({ position, rotation = 0, color, size = [1.75, 0.30, 1.25] }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion()) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7 + rotation) * 0.06;
  });
  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]}>
      {/* cover */}
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.08} />
      </mesh>
      {/* spine highlight */}
      <mesh position={[-size[0] / 2 + 0.04, 0, 0]}>
        <boxGeometry args={[0.06, size[1] + 0.02, size[2] + 0.01]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.25} emissive={color} emissiveIntensity={0.05} />
      </mesh>
      {/* page block */}
      <mesh position={[0.07, 0, 0]}>
        <boxGeometry args={[size[0] - 0.14, size[1] - 0.07, size[2] + 0.02]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
      </mesh>
      {/* page lines */}
      {[...Array(3)].map((_, i) => (
        <mesh key={i} position={[0.07, -size[1] / 2 + 0.05 + i * 0.07, size[2] / 2 + 0.015]}>
          <boxGeometry args={[size[0] - 0.22, 0.008, 0.004]} />
          <meshStandardMaterial color="#cbd5e1" roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

const Calculator = ({ position }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion()) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.9) * 0.07;
    ref.current.rotation.y = -0.5 + Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
  });
  const keys = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const isEqual = r === 3 && c === 2;
      const isOp = c === 2 && r < 3;
      keys.push(
        <mesh key={`${r}-${c}`} position={[-0.3 + c * 0.3, 0.065, -0.04 + r * 0.27]}>
          <boxGeometry args={[0.22, 0.065, 0.19]} />
          <meshStandardMaterial
            color={isEqual ? '#f59e0b' : isOp ? '#6ee7b7' : '#e2e8f0'}
            roughness={0.5}
            metalness={isEqual ? 0.2 : 0}
          />
        </mesh>
      );
    }
  }
  return (
    <group ref={ref} position={position}>
      {/* body */}
      <mesh>
        <boxGeometry args={[1.1, 0.13, 1.62]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.35} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0.075, -0.62]}>
        <boxGeometry args={[0.9, 0.055, 0.3]} />
        <meshStandardMaterial color="#6ee7b7" emissive="#10b981" emissiveIntensity={0.6} roughness={0.1} />
      </mesh>
      {/* screen glow */}
      <pointLight position={[0, 0.2, -0.62]} intensity={2.5} color="#10b981" distance={1.2} />
      <group position={[0, 0, -0.08]}>{keys}</group>
    </group>
  );
};

const GiftBox = ({ position }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion()) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.1 + 1) * 0.09;
    ref.current.rotation.y = 0.4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
  });
  return (
    <group ref={ref} position={position}>
      {/* base box */}
      <mesh castShadow>
        <boxGeometry args={[0.88, 0.76, 0.88]} />
        <meshStandardMaterial color="#14b8a6" roughness={0.35} metalness={0.1} />
      </mesh>
      {/* lid */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.9, 0.16, 0.9]} />
        <meshStandardMaterial color="#0f766e" roughness={0.3} metalness={0.15} />
      </mesh>
      {/* ribbon cross H */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.9, 0.8, 0.14]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* ribbon cross V */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.14, 0.8, 0.9]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* bow loop 1 */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.055, 12, 26]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.25} />
      </mesh>
      {/* bow loop 2 (perpendicular) */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, Math.PI / 2, 0]}>
        <torusGeometry args={[0.18, 0.055, 12, 26]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.25} />
      </mesh>
    </group>
  );
};

const GradCap = ({ position }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion()) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2) * 0.13;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.28;
  });
  return (
    <group ref={ref} position={position}>
      {/* board */}
      <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[1.6, 0.08, 1.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.2} />
      </mesh>
      {/* rim bevel */}
      <mesh rotation={[0, Math.PI / 4, 0]} position={[0, 0.05, 0]}>
        <boxGeometry args={[1.62, 0.02, 1.62]} />
        <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* cap */}
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.4, 0.47, 0.38, 28]} />
        <meshStandardMaterial color="#1e293b" roughness={0.55} />
      </mesh>
      {/* tassel string */}
      <mesh position={[0.55, -0.08, 0.55]}>
        <cylinderGeometry args={[0.014, 0.014, 0.6, 8]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      {/* tassel ball */}
      <mesh position={[0.55, -0.42, 0.55]}>
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} />
      </mesh>
    </group>
  );
};

const Drafter = ({ position }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion()) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.85 + 2) * 0.08;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.06;
  });
  return (
    <group ref={ref} position={position} rotation={[0, 0.5, 0]}>
      {/* Long ruler */}
      <mesh>
        <boxGeometry args={[0.12, 0.04, 2.2]} />
        <meshStandardMaterial color="#bae6fd" roughness={0.2} metalness={0.5} transparent opacity={0.85} />
      </mesh>
      {/* Tick marks */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[0, 0.025, -1.0 + i * 0.28]}>
          <boxGeometry args={[0.12, 0.01, 0.015]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}
      {/* Triangle set square */}
      <group position={[0.4, 0, 0.3]} rotation={[0, 0.3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0, 0.7, 0.7, 3, 1]} />
          <meshStandardMaterial color="#a5f3fc" roughness={0.15} metalness={0.4} transparent opacity={0.75} />
        </mesh>
      </group>
    </group>
  );
};

/** Orbit ring */
const OrbitRing = ({ radius = 2.5, tilt = Math.PI / 2.6, speed = 0.22, color = '#10b981' }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion()) return;
    ref.current.rotation.z = state.clock.elapsedTime * speed;
    ref.current.rotation.x = tilt + Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.025, 14, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        transparent
        opacity={0.65}
      />
    </mesh>
  );
};

/** Floating particles cluster */
const Particles = () => {
  const count = 28;
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion()) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.08;
  });
  return (
    <group ref={ref}>
      {Array.from({ length: count }, (_, i) => {
        const theta = (i / count) * Math.PI * 2;
        const phi = Math.acos(2 * ((i * 0.618) % 1) - 1);
        const r = 1.9 + (i % 3) * 0.5;
        return (
          <mesh
            key={i}
            position={[
              r * Math.sin(phi) * Math.cos(theta),
              r * Math.cos(phi),
              r * Math.sin(phi) * Math.sin(theta),
            ]}
          >
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#06b6d4' : '#6366f1'}
              emissive={i % 3 === 0 ? '#10b981' : '#06b6d4'}
              emissiveIntensity={0.5}
              transparent
              opacity={0.55}
            />
          </mesh>
        );
      })}
    </group>
  );
};

/** Mouse-reactive group that wraps all scene objects */
const Rig = () => {
  const group = useRef();
  useFrame((state, dt) => {
    if (!group.current) return;
    const still = reducedMotion();
    const idle = still ? 0 : state.clock.elapsedTime * 0.22;
    const ty = idle + (still ? 0 : pointer.x * 0.75);
    const tx = still ? 0 : -pointer.y * 0.32;
    const k = Math.min(1, dt * 3.2);
    group.current.rotation.y += (ty - group.current.rotation.y) * k;
    group.current.rotation.x += (tx - group.current.rotation.x) * k;
  });
  return (
    <group ref={group} position={[0, -0.2, 0]}>
      {/* Stack of 3 textbooks */}
      <Book position={[0, -0.72, 0]} rotation={0.10} color="#047857" />
      <Book position={[0.08, -0.40, 0.02]} rotation={-0.20} color="#0f766e" size={[1.58, 0.28, 1.12]} />
      <Book position={[-0.06, -0.10, 0.01]} rotation={0.28} color="#0e7490" size={[1.42, 0.26, 1.02]} />

      {/* Campus tools */}
      <Calculator position={[1.85, -0.5, 0.6]} />
      <GiftBox position={[-1.85, -0.22, 0.48]} />
      <GradCap position={[0, 1.05, 0]} />
      <Drafter position={[0.2, -0.9, 1.1]} />

      {/* Orbital rings */}
      <OrbitRing radius={2.55} tilt={Math.PI / 2.5} speed={0.22} color="#10b981" />
      <OrbitRing radius={3.1} tilt={Math.PI / 1.8} speed={-0.14} color="#06b6d4" />

      {/* Particle cloud */}
      <Particles />
    </group>
  );
};

/**
 * Interactive WebGL hero: books + calculator + gift + grad cap + drafter,
 * orbital rings, particle cloud. Responds to mouse and auto-rotates.
 */
const HeroScene = () => (
  <Canvas
    dpr={[1, 2]}
    camera={{ position: [0, 1.8, 7.0], fov: 40 }}
    gl={{ alpha: true, antialias: true }}
    style={{ pointerEvents: 'none' }}
    shadows={false}
  >
    <ambientLight intensity={1.2} />
    <directionalLight position={[4, 7, 4]} intensity={2.4} />
    <pointLight position={[-4, 3, 3]} intensity={30} color="#2dd4bf" />
    <pointLight position={[3, -2, 4]} intensity={18} color="#818cf8" />
    <Rig />
  </Canvas>
);

export default HeroScene;
