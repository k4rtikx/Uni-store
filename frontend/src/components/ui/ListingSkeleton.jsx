import React from 'react';

/**
 * Premium shimmer skeleton — matches ListingCard layout exactly.
 * Uses the custom `.skeleton` shimmer animation from index.css.
 */
const ListingSkeleton = () => (
  <div className="bg-white/85 rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm flex flex-col">
    {/* Image area */}
    <div className="relative aspect-[4/3] w-full skeleton">
      {/* badge placeholders */}
      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
        <div className="w-16 h-5 rounded-full bg-slate-300/60" />
      </div>
      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
        <div className="w-7 h-7 rounded-full bg-slate-300/60" />
        <div className="w-7 h-7 rounded-full bg-slate-300/60" />
      </div>
    </div>

    {/* Details */}
    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="w-14 h-4 rounded-md skeleton" />
          <div className="w-16 h-3.5 rounded skeleton" />
        </div>
        <div className="h-5 w-4/5 rounded-md skeleton mt-1" />
        <div className="space-y-1.5 pt-1">
          <div className="h-3 w-full rounded skeleton" />
          <div className="h-3 w-2/3 rounded skeleton" />
        </div>
      </div>

      <div className="pt-2">
        <div className="h-7 w-28 rounded-xl skeleton" />
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full skeleton shrink-0" />
          <div className="h-3.5 w-24 rounded skeleton" />
        </div>
        <div className="h-3.5 w-12 rounded skeleton" />
      </div>
    </div>
  </div>
);

export default ListingSkeleton;
