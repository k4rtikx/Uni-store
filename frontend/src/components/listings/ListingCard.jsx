import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Heart, CheckCircle2, ArrowRight, Share2, Check, Eye } from 'lucide-react';
import useWishlist from '../../context/useWishlist';
import Tilt3D from '../ui/Tilt3D';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

/**
 * 3D Marketplace Listing Card.
 * Features: pointer-tilt, moving glare, floating depth badges, wish-heart pulse.
 */
const ListingCard = ({ item, listing: propListing }) => {
  const listing = propListing || item;
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const { isSaved: checkIsSaved, toggleSaveItem } = useWishlist();

  const isSold = listing?.status === 'Sold' || listing?.status === 'SOLD';
  const isFree = Number(listing?.price) === 0;
  const isSaved = checkIsSaved(listing?._id);
  const shareTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    };
  }, []);

  const sellerInitial = listing?.seller?.name ? listing.seller.name.charAt(0).toUpperCase() : 'S';
  const sellerName = listing?.seller?.name || 'CED Student';

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/listings/${listing._id}`;
    const priceText = isFree ? 'FREE' : `?${listing.price}`;
    const shareData = {
      title: listing.title,
      text: `${listing.title} - ${priceText} (${listing.condition}) on Uni-store CED`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedShare(true);
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
      shareTimerRef.current = setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleCardClick = () => {
    if (listing?._id) navigate(`/listings/${listing._id}`);
  };

  return (
    <Tilt3D
      as="article"
      max={8}
      perspective={900}
      scale={1.03}
      onClick={handleCardClick}
      className={`group relative cursor-pointer rounded-2xl card-3d-shadow ${
        isSold ? 'opacity-75 grayscale-[20%]' : ''
      }`}
    >
      {/* Card face */}
      <div className="bg-white/90 rounded-2xl border border-slate-200/80 group-hover:border-emerald-400/50 overflow-hidden flex flex-col h-full transition-colors duration-300">

        {/* Image */}
        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
          {/* Loading skeleton */}
          {!isLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          <img
            src={listing.imageUrl || FALLBACK_IMAGE}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${isSold ? 'grayscale-[30%]' : ''}`}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
              setIsLoaded(true);
            }}
          />

          {/* Gradient overlay at bottom for depth */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none" />

          {/* Sold overlay */}
          {isSold && (
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1.5px] flex items-center justify-center pointer-events-none z-20">
              <span className="px-3.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs tracking-widest uppercase shadow-xl border border-amber-300 animate-pulse">
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                {listing.condition}
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                {listing.views !== undefined && listing.views !== null && (
                  <span className="flex items-center gap-0.5 text-slate-500 font-bold" title={`${listing.views} Views`}>
                    <Eye className="w-3 h-3" />
                    <span>{listing.views}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(listing.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {listing.title}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{listing.description}</p>
          </div>

          {/* Price */}
          <div className="pt-1">
            {isFree ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200 shadow-sm">
                🎁 FREE FOR JUNIORS
              </span>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">
                  ?{listing.price.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-slate-400">campus deal</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 p-[1.5px] shrink-0">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-800">
                  {sellerInitial}
                </div>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[110px]">{sellerName}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified CED" />
              </div>
            </div>
            <div className="text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
              <span>Details</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating depth layers (translateZ so they pop out of the card) ── */}

      {/* Category + free/sold badges */}
      <div
        className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 max-w-[70%] pointer-events-none"
        style={{ transform: 'translateZ(36px)' }}
      >
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-sm bg-white/92 text-slate-800 border border-slate-200/90 shadow-lg">
          {listing.category}
        </span>
        {isFree && !isSold && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border border-emerald-400/40">
            🎁 FREE
          </span>
        )}
        {isSold && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 shadow-lg border border-amber-300 uppercase tracking-wider">
            SOLD
          </span>
        )}
      </div>

      {/* Share + Wishlist buttons */}
      <div
        className="absolute top-2.5 right-2.5 flex items-center gap-1.5"
        style={{ transform: 'translateZ(46px)' }}
      >
        {/* Share */}
        <div className="relative">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share listing"
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-lg ${
              copiedShare
                ? 'bg-emerald-600 text-white shadow-emerald-500/30 scale-110'
                : 'bg-white/90 text-slate-600 hover:text-emerald-700 hover:bg-white hover:scale-110'
            }`}
            title={copiedShare ? 'Link Copied!' : 'Share listing'}
          >
            {copiedShare ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Share2 className="w-4 h-4" />}
          </button>
          {copiedShare && (
            <span className="absolute -bottom-7 right-0 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md shadow-lg whitespace-nowrap pointer-events-none z-30">
              Copied!
            </span>
          )}
        </div>

        {/* Heart wishlist */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSaveItem(listing._id);
          }}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-lg active:scale-90 ${
            isSaved
              ? 'bg-white text-red-500 shadow-red-500/25 scale-110'
              : 'bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white hover:scale-110'
          }`}
          title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-300 ${
              isSaved ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-500'
            }`}
          />
        </button>
      </div>
    </Tilt3D>
  );
};

export default ListingCard;

