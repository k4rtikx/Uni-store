import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { pointer, reducedMotion } from './webgl';

const PALETTE = ['#10b981', '#14b8a6', '#06b6d4', '#34d399', '#f59e0b', '#6366f1'];

const SHAPES = ['box', 'ico', 'torus', 'octa', 'cyl', 'dodeca'];

const makeItems = () => {
  // Deterministic pseudo-random so the layout is stable between renders
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: 16 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    return {
      id: i,
      shape: SHAPES[i % SHAPES.length],
      color: PALETTE[i % PALETTE.length],
      position: [side * (2.2 + rnd() * 4.5), (rnd() - 0.5) * 9, -2 - rnd() * 6],
      scale: 0.35 + rnd() * 0.65,
      speed: 0.15 + rnd() * 0.35,
      phase: rnd() * Math.PI * 2,
    };
  });
};

const Geo = ({ shape }) => {
  switch (shape) {
    case 'box':
      return <boxGeometry args={[1.2, 0.35, 0.9]} />;
    case 'ico':
      return <icosahedronGeometry args={[0.7, 0]} />;
    case 'torus':
      return <torusGeometry args={[0.6, 0.18, 16, 40]} />;
    case 'octa':
      return <octahedronGeometry args={[0.7, 0]} />;
    case 'cyl':
      return <cylinderGeometry args={[0.28, 0.28, 1.3, 20]} />;
    default:
      return <dodecahedronGeometry args={[0.65, 0]} />;
  }
};

const Floating = ({ item, still }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || still) return;
    const t = state.clock.elapsedTime * item.speed + item.phase;
    ref.current.rotation.x = t * 0.6;
    ref.current.rotation.y = t * 0.8;
    ref.current.position.y = item.position[1] + Math.sin(t * 1.4) * 0.35;
  });
  return (
    <mesh ref={ref} position={item.position} scale={item.scale}>
      <Geo shape={item.shape} />
      <meshStandardMaterial
        color={item.color}
        roughness={0.35}
        metalness={0.15}
        transparent
        opacity={0.55}
      />
    </mesh>
  );
};

const Rig = ({ children, still }) => {
  const group = useRef();
  useFrame((state, dt) => {
    if (!group.current) return;
    const scroll = typeof window !== 'undefined' ? window.scrollY : 0;
    const targetY = still ? 0 : pointer.x * 0.35;
    const targetX = still ? 0 : -pointer.y * 0.2;
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, dt * 2);
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, dt * 2);
    // scroll "travels" through the scene
    group.current.position.y += (scroll * 0.004 - group.current.position.y) * Math.min(1, dt * 3);
  });
  return <group ref={group}>{children}</group>;
};

/**
 * Fixed, full-screen WebGL background. Floating campus-themed 3D shapes that
 * react to the mouse and to scrolling. Sits behind all content.
 */
const SceneBackground = () => {
  const items = useMemo(() => makeItems(), []);
  const still = reducedMotion();
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 6, 5]} intensity={1.2} />
        <pointLight position={[-6, -3, 2]} intensity={12} color="#14b8a6" />
        <Rig still={still}>
          {items.map((it) => (
            <Floating key={it.id} item={it} still={still} />
          ))}
        </Rig>
      </Canvas>
    </div>
  );
};

export default SceneBackground;
