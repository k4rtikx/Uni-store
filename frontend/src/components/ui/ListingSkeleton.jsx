import React from 'react';

/**
 * Skeleton card component mirroring the exact geometry and layout of ListingCard
 */
const ListingSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm flex flex-col animate-pulse">
      {/* Image Skeleton with aspect-[4/3] */}
      <div className="relative aspect-[4/3] w-full bg-slate-200">
        {/* Floating Category Badge Skeleton */}
        <div className="absolute top-2.5 left-2.5 w-16 h-5 rounded-full bg-slate-300" />
        {/* Floating Heart Skeleton */}
        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-slate-300" />
      </div>

      {/* Details Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Condition and Date Row */}
          <div className="flex items-center justify-between">
            <div className="w-14 h-4 rounded bg-slate-200" />
            <div className="w-16 h-3.5 rounded bg-slate-200" />
          </div>

          {/* Title Line */}
          <div className="h-5 w-4/5 rounded-md bg-slate-200 mt-1" />

          {/* Description Lines */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </div>

        {/* Pricing Area */}
        <div className="pt-2">
          <div className="h-7 w-28 rounded-lg bg-slate-200" />
        </div>

        {/* Card Footer Skeleton */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0" />
            <div className="h-3.5 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-3.5 w-12 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default ListingSkeleton;
