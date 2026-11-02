import React, { useRef, useEffect } from 'react';
import { Tag } from 'lucide-react';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80';

const DEPTH = 36; // px thickness of the 3D slab

/**
 * ListingImage - the product photo sits on a real 3D slab (front, back and 4 edges).
 * Drag (mouse / touch) to spin it, hover to tilt. It eases back and idles with a slow sway.
 */
const ListingImage = ({
  imageUrl,
  title,
  category,
  isFree = false,
  isSold = false,
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
}) => {
  const slabRef = useRef(null);
  const state = useRef({ rx: -4, ry: 18, vx: 0, dragging: false, lastX: 0, lastY: 0, hover: false, mx: 0, my: 0 });

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf;
    const loop = (t) => {
      const s = state.current;
      if (!s.dragging) {
        let targetY;
        let targetX;
        if (s.hover) {
          targetY = s.mx * 28;
          targetX = -s.my * 18;
        } else {
          targetY = reduce ? 14 : Math.sin(t / 1800) * 24;
          targetX = reduce ? -4 : -4 + Math.cos(t / 2400) * 4;
        }
        // keep the shortest path home after a full spin
        const turns = Math.round(s.ry / 360);
        const base = turns * 360;
        s.ry += (base + targetY - s.ry) * 0.08;
        s.rx += (targetX - s.rx) * 0.08;
      }
      if (slabRef.current) {
        slabRef.current.style.transform = `rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown = (e) => {
    const s = state.current;
    s.dragging = true;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const s = state.current;
    const r = e.currentTarget.getBoundingClientRect();
    s.mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    s.my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (s.dragging) {
      s.ry += (e.clientX - s.lastX) * 0.6;
      s.rx = Math.max(-35, Math.min(35, s.rx - (e.clientY - s.lastY) * 0.4));
      s.lastX = e.clientX;
      s.lastY = e.clientY;
    }
  };
  const onUp = () => {
    state.current.dragging = false;
  };

  const edge = 'absolute bg-gradient-to-b from-emerald-600 to-teal-800';

  return (
    <div className="w-full md:w-1/2 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 p-6 sm:p-10 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-200/90 min-h-[360px] sm:min-h-[500px]">
      {/* Top Badges */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10 max-w-[85%]">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-slate-800 shadow-sm border border-slate-200/80 flex items-center gap-1">
          <Tag className="w-3 h-3 text-emerald-600" />
          {category}
        </span>
        {isFree && (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-400/40">
            🎁 FREE DONATION
          </span>
        )}
        {isSold ? (
          <span
            id="sold-badge-pill"
            className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500 text-slate-950 shadow-md border border-amber-300"
          >
            SOLD
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-900 text-white shadow-sm">
            AVAILABLE
          </span>
        )}
      </div>

      {/* 3D stage */}
      <div
        className="w-full flex items-center justify-center my-auto touch-pan-y select-none cursor-grab active:cursor-grabbing"
        style={{ perspective: '1300px' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerEnter={() => (state.current.hover = true)}
        onPointerLeave={() => {
          state.current.hover = false;
          state.current.dragging = false;
        }}
      >
        <div
          ref={slabRef}
          className="relative w-[min(100%,340px)] aspect-[4/5]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* floor shadow */}
          <div
            className="absolute left-[8%] right-[8%] -bottom-10 h-8 rounded-[50%] bg-slate-900/25 blur-xl"
            style={{ transform: `translateZ(-${DEPTH}px) rotateX(90deg)` }}
          />

          {/* back face */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-900 flex items-center justify-center text-white/90 font-extrabold tracking-tight text-xl"
            style={{ transform: `translateZ(-${DEPTH / 2}px) rotateY(180deg)`, backfaceVisibility: 'hidden' }}
          >
            Reuse<span className="text-emerald-300">Campus</span>
          </div>

          {/* edges (give the slab real thickness) */}
          <div
            className={`${edge} top-0 bottom-0 left-0`}
            style={{ width: DEPTH, transform: `translateX(-${DEPTH / 2}px) rotateY(-90deg)`, transformOrigin: 'center' }}
          />
          <div
            className={`${edge} top-0 bottom-0 right-0`}
            style={{ width: DEPTH, transform: `translateX(${DEPTH / 2}px) rotateY(90deg)`, transformOrigin: 'center' }}
          />
          <div
            className="absolute left-0 right-0 top-0 bg-emerald-500"
            style={{ height: DEPTH, transform: `translateY(-${DEPTH / 2}px) rotateX(90deg)` }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 bg-teal-900"
            style={{ height: DEPTH, transform: `translateY(${DEPTH / 2}px) rotateX(-90deg)` }}
          />

          {/* front face (the product photo) */}
          <div
            className="absolute inset-0 rounded-2xl bg-white overflow-hidden shadow-2xl ring-1 ring-slate-200/80 flex items-center justify-center p-2"
            style={{ transform: `translateZ(${DEPTH / 2}px)`, backfaceVisibility: 'hidden' }}
          >
            <img
              id="listing-detail-photo"
              src={imageUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              draggable={false}
              className={`w-full h-full object-contain rounded-xl transition-all duration-300 ${
                isSold ? 'grayscale-[35%] opacity-80' : ''
              }`}
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
            />
            {isSold && (
              <div
                id="photo-sold-overlay"
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none"
              >
                <div className="px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-lg tracking-widest uppercase shadow-2xl border-2 border-amber-300 animate-pulse">
                  SOLD
                </div>
              </div>
            )}
          </div>

          {/* floating price-tag pop-out in front of the slab */}
          <div
            className="absolute -right-3 top-6 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold shadow-xl pointer-events-none"
            style={{ transform: `translateZ(${DEPTH / 2 + 34}px)`, backfaceVisibility: 'hidden' }}
          >
            {isFree ? 'FREE 🎁' : 'Campus deal'}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[11px] font-semibold text-slate-400 select-none">
        Drag to rotate · hover to tilt
      </p>
    </div>
  );
};

export default ListingImage;
