import React, { useRef, useCallback } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Tilt3D - real CSS 3D tilt wrapper.
 * Follows the pointer with perspective rotation + moving glare.
 * Children can use `translateZ()` (e.g. className "z-pop") to float above the card.
 */
const Tilt3D = ({
  as: Tag = 'div',
  max = 10,
  glare = true,
  scale = 1.02,
  className = '',
  style,
  children,
  ...rest
}) => {
  const ref = useRef(null);
  const glareRef = useRef(null);

  const handleMove = useCallback(
    (e) => {
      if (e.pointerType === 'touch' || prefersReducedMotion()) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const ry = (px - 0.5) * 2 * max;
      const rx = (0.5 - py) * 2 * max;
      el.style.transition = 'transform 80ms ease-out';
      el.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(
        2
      )}deg) scale3d(${scale},${scale},${scale})`;
      if (glareRef.current) {
        glareRef.current.style.opacity = '1';
        glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${
          py * 100
        }%, rgba(255,255,255,0.45), rgba(255,255,255,0) 55%)`;
      }
    },
    [max, scale]
  );

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 500ms cubic-bezier(.2,.8,.2,1)';
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  }, []);

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
          style={{ transform: 'translateZ(1px)', mixBlendMode: 'soft-light' }}
        />
      )}
    </Tag>
  );
};

export default Tilt3D;
