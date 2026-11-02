import React from 'react';
import { Tag } from 'lucide-react';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80';

/**
 * ListingImage Component
 * Stateless component to render listing hero image, status badges, and sold overlays.
 */
const ListingImage = ({
  imageUrl,
  title,
  category,
  isFree = false,
  isSold = false,
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
}) => {
  return (
    <div className="w-full md:w-1/2 bg-slate-50 p-6 sm:p-10 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-200/90 min-h-[320px] sm:min-h-[460px]">
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
        {/* Prominent SOLD badge or Status */}
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

      {/* Item Photo with Sold Dimming / Greying */}
      <div className="w-full h-full flex items-center justify-center relative my-auto">
        <img
          id="listing-detail-photo"
          src={imageUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          className={`max-h-[380px] sm:max-h-[440px] w-full object-contain rounded-2xl drop-shadow-md transition-all duration-300 ${
            isSold ? 'grayscale-[35%] opacity-80' : 'hover:scale-[1.02]'
          }`}
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />

        {/* Prominent SOLD Badge Overlay on Dimmed Photo */}
        {isSold && (
          <div
            id="photo-sold-overlay"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center rounded-2xl pointer-events-none"
          >
            <div className="px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-lg tracking-widest uppercase shadow-2xl border-2 border-amber-300 animate-pulse">
              SOLD
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingImage;
