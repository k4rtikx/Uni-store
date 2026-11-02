import React, { useRef, useCallback } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Tilt3D — real CSS 3D tilt with perspective + glare + depth ring.
 * Children at `translateZ(N px)` float above the card face.
 *
 * Props:
 *   as         – HTML tag (default 'div')
 *   max        – max tilt angle in degrees (default 10)
 *   glare      – show glare layer (default true)
 *   scale      – hover scale factor (default 1.025)
 *   perspective– CSS perspective distance (default 1000)
 *   className  – extra classes
 */
const Tilt3D = ({
  as: Tag = 'div',
  max = 10,
  glare = true,
  scale = 1.025,
  perspective = 1000,
  className = '',
  style,
  children,
  ...rest
}) => {
  const ref = useRef(null);
  const glareRef = useRef(null);
  const frameRef = useRef(null);

  const handleMove = useCallback(
    (e) => {
      if (e.pointerType === 'touch' || prefersReducedMotion()) return;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const ry = (px - 0.5) * 2 * max;
        const rx = (0.5 - py) * 2 * max;
        el.style.transition = 'transform 60ms ease-out';
        el.style.transform = `perspective(${perspective}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(${scale},${scale},${scale})`;
        if (glareRef.current) {
          const angle = Math.atan2(py - 0.5, px - 0.5) * (180 / Math.PI) + 90;
          glareRef.current.style.opacity = String(0.12 + Math.abs(px - 0.5) * 0.3);
          glareRef.current.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0.55) 0%, transparent 65%)`;
        }
      });
    },
    [max, scale, perspective]
  );

  const handleLeave = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 550ms cubic-bezier(.18,.82,.22,1)';
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  }, [perspective]);

  return (
    <Tag
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`tilt-3d ${className}`}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform', ...style }}
      {...rest}
    >
      {children}
      {glare && (
        <span
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
          style={{
            transform: 'translateZ(2px)',
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </Tag>
  );
};

export default Tilt3D;
