import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { pointer, reducedMotion } from './webgl';

const PALETTE = [
  '#10b981', '#14b8a6', '#06b6d4', '#34d399',
  '#6ee7b7', '#5eead4', '#67e8f9', '#a7f3d0',
  '#f59e0b', '#6366f1', '#8b5cf6',
];

const SHAPES = ['box', 'ico', 'torus', 'octa', 'cyl', 'dodeca', 'sphere', 'torusKnot'];

const makeItems = () => {
  let s = 42;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: 22 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const band = Math.floor(i / 2);
    return {
      id: i,
      shape: SHAPES[i % SHAPES.length],
      color: PALETTE[i % PALETTE.length],
      position: [
        side * (2.5 + rnd() * 5.5),
        (band / 5.5 - 1) * 9 + (rnd() - 0.5) * 2,
        -3 - rnd() * 8,
      ],
      scale: 0.28 + rnd() * 0.6,
      speed: 0.12 + rnd() * 0.28,
      phase: rnd() * Math.PI * 2,
      opacity: 0.35 + rnd() * 0.3,
      metalness: rnd() * 0.5,
    };
  });
};

const Geo = ({ shape }) => {
  switch (shape) {
    case 'box':       return <boxGeometry args={[1.1, 0.32, 0.85]} />;
    case 'ico':       return <icosahedronGeometry args={[0.65, 0]} />;
    case 'torus':     return <torusGeometry args={[0.55, 0.17, 16, 42]} />;
    case 'octa':      return <octahedronGeometry args={[0.65, 0]} />;
    case 'cyl':       return <cylinderGeometry args={[0.26, 0.26, 1.2, 20]} />;
    case 'sphere':    return <sphereGeometry args={[0.5, 24, 24]} />;
    case 'torusKnot': return <torusKnotGeometry args={[0.35, 0.12, 80, 14]} />;
    default:          return <dodecahedronGeometry args={[0.6, 0]} />;
  }
};

const Floating = ({ item, still }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || still) return;
    const t = state.clock.elapsedTime * item.speed + item.phase;
    ref.current.rotation.x = t * 0.55;
    ref.current.rotation.y = t * 0.75;
    ref.current.rotation.z = t * 0.25;
    ref.current.position.y = item.position[1] + Math.sin(t * 1.2) * 0.38;
    // Subtle breathing scale
    const s = item.scale * (1 + Math.sin(t * 0.7) * 0.04);
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={item.position} scale={item.scale} castShadow>
      <Geo shape={item.shape} />
      <meshStandardMaterial
        color={item.color}
        roughness={0.3}
        metalness={item.metalness}
        transparent
        opacity={item.opacity}
        envMapIntensity={0.6}
      />
    </mesh>
  );
};

/** Occasional "connection lines" spark between nearby shapes for a network feel */
const ConnectionLines = ({ items }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.04;
  });
  return (
    <group ref={ref}>
      {items.slice(0, 8).map((a, i) => {
        const b = items[(i + 3) % items.length];
        const mid = [
          (a.position[0] + b.position[0]) / 2,
          (a.position[1] + b.position[1]) / 2,
          (a.position[2] + b.position[2]) / 2,
        ];
        const len = Math.sqrt(
          (b.position[0] - a.position[0]) ** 2 +
          (b.position[1] - a.position[1]) ** 2 +
          (b.position[2] - a.position[2]) ** 2
        );
        if (len > 12) return null;
        return (
          <mesh key={i} position={mid}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#10b981" transparent opacity={0.25} />
          </mesh>
        );
      })}
    </group>
  );
};

const Rig = ({ children, still }) => {
  const group = useRef();
  useFrame((state, dt) => {
    if (!group.current) return;
    const scroll = typeof window !== 'undefined' ? window.scrollY : 0;
    const targetY = still ? 0 : pointer.x * 0.4;
    const targetX = still ? 0 : -pointer.y * 0.22;
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, dt * 2.2);
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, dt * 2.2);
    group.current.position.y += (scroll * 0.0035 - group.current.position.y) * Math.min(1, dt * 3);
  });
  return <group ref={group}>{children}</group>;
};

/**
 * Full-screen WebGL background. 22 floating campus-themed 3D shapes
 * that react to mouse and scroll, with depth, metalness, and connections.
 */
const SceneBackground = () => {
  const items = useMemo(() => makeItems(), []);
  const still = reducedMotion();
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 9], fov: 52 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        shadows={false}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 8, 5]} intensity={1.4} />
        <pointLight position={[-6, -3, 2]} intensity={15} color="#14b8a6" />
        <pointLight position={[6, 4, -3]} intensity={10} color="#6366f1" />
        <Rig still={still}>
          {items.map((it) => (
            <Floating key={it.id} item={it} still={still} />
          ))}
          <ConnectionLines items={items} />
        </Rig>
      </Canvas>
    </div>
  );
};

export default SceneBackground;
