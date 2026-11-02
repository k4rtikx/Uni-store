import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, CheckCircle2, Sparkles } from 'lucide-react';

/**
 * ListingInfo Component
 * Stateless component displaying title, condition, price, view counter,
 * sold banners, owner actions, and description.
 */
const ListingInfo = ({
  listing,
  isFree = false,
  isSold = false,
  isAvailable = true,
  isOwner = false,
  updatingStatus = false,
  onMarkAsSold,
}) => {
  return (
    <div className="space-y-4">
      {/* Condition Pill & Timestamp */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Condition: {listing.condition}
          </span>
          {isOwner && (
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Your Listing
            </span>
          )}
        </div>

        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {new Date(listing.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Listing Title */}
      <h1
        id="listing-detail-title"
        className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight"
      >
        {listing.title}
      </h1>

      {/* Price & Product View Counter Area */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-1 pb-2 border-b border-slate-100">
        {/* Pricing Display */}
        <div className="flex items-baseline gap-2">
          {isFree ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-800 font-black text-lg sm:text-xl border border-emerald-300 shadow-sm">
              🎁 FREE FOR JUNIORS
            </span>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span
                id="listing-detail-price"
                className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900"
              >
                ₹{Number(listing.price).toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Campus Deal
              </span>
            </div>
          )}
        </div>

        {/* View Counter Display (Near title/price) */}
        <div
          id="listing-view-counter"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-sm text-xs sm:text-sm font-bold"
          title="Total views recorded for this product"
        >
          <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>👁️ {listing.views ?? 0} Views</span>
        </div>
      </div>

      {/* Prominent SOLD Banner if status === 'Sold' */}
      {isSold && (
        <div
          id="prominent-sold-banner"
          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm flex items-center justify-between shadow-md border border-amber-300 tracking-wide"
        >
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-950 text-amber-400 text-xs font-black tracking-widest uppercase">
              SOLD
            </span>
            <span>This item has been marked as SOLD.</span>
          </div>
          <span className="text-xs uppercase tracking-wider opacity-90 hidden sm:inline">
            Deal Closed
          </span>
        </div>
      )}

      {/* Owner "Mark as Sold" Control */}
      {isOwner && isAvailable && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Seller Ownership Actions
            </span>
            <span className="text-[11px] font-semibold text-amber-700">
              Item is currently Available
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Have you agreed to a deal with a fellow student? Mark this listing as Sold to
            close outreach and prevent further inquiries.
          </p>
          <div className="pt-1 flex flex-col sm:flex-row gap-2.5 w-full">
            <button
              id="mark-as-sold-btn"
              type="button"
              onClick={onMarkAsSold}
              disabled={updatingStatus}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{updatingStatus ? 'Updating...' : 'Mark as Sold'}</span>
            </button>

            <Link
              to="/my-listings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors shadow-sm"
            >
              Manage My Listings
            </Link>
          </div>
        </div>
      )}

      {/* Description Section */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Item Description
        </h3>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto">
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {listing.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ListingInfo;
