import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Heart, CheckCircle2, ArrowRight, Share2, Check } from 'lucide-react';
import useWishlist from '../../context/useWishlist';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

/**
 * Luxury Airbnb/Gumroad-Style Marketplace Listing Card
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
  const sellerName = listing?.seller?.name || 'RJIT Student';

  // Native Web Share with Clipboard Fallback
  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/listings/${listing._id}`;
    const priceText = isFree ? 'FREE' : `₹${listing.price}`;
    const shareData = {
      title: listing.title,
      text: `${listing.title} - ${priceText} (${listing.condition}) on ReuseCampus RJIT`,
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
    if (listing?._id) {
      navigate(`/listings/${listing._id}`);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/40 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_20px_30px_-10px_rgba(15,23,42,0.1)] transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col cursor-pointer relative ${
        isSold ? 'opacity-65 grayscale-[25%]' : ''
      }`}
    >
      {/* Image Container with Aspect Ratio 4/3 */}
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${isSold ? 'grayscale-[35%]' : ''}`}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
            setIsLoaded(true);
          }}
        />

        {/* Top-Left Category Pill, Free Tag & Sold Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10 max-w-[75%]">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-md bg-white/90 text-slate-800 border border-slate-200/90 shadow-sm">
            {listing.category}
          </span>
          {isFree && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-400/40">
              🎁 FREE
            </span>
          )}
          {isSold && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 shadow-md border border-amber-300 uppercase tracking-wider">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Top-Right Action Buttons: Share & Wishlist */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {/* Native Share Button */}
          <div className="relative">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share listing"
              className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md ${
                copiedShare
                  ? 'bg-emerald-600 text-white shadow-emerald-500/30 scale-105'
                  : 'bg-white/85 text-slate-600 hover:text-emerald-700 hover:bg-white hover:scale-105'
              }`}
              title={copiedShare ? 'Link Copied!' : 'Share listing'}
            >
              {copiedShare ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {copiedShare && (
              <span className="absolute -bottom-7 right-0 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md shadow-lg whitespace-nowrap animate-fadeIn pointer-events-none z-30">
                Link Copied!
              </span>
            )}
          </div>

          {/* Heart Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveItem(listing._id);
            }}
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md active:scale-90 ${
              isSaved
                ? 'bg-white text-red-500 shadow-red-500/25 scale-105'
                : 'bg-white/85 text-slate-500 hover:text-red-500 hover:bg-white hover:scale-105'
            }`}
            title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-200 ${
                isSaved ? 'fill-red-500 text-red-500' : 'text-slate-500'
              }`}
            />
          </button>
        </div>

        {/* Sold Overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-20">
            <span className="px-3.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs tracking-widest uppercase shadow-xl border border-amber-300 animate-pulse">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Metadata pill & Timestamp & Views */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md text-[11px]">
              {listing.condition}
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              {listing.views !== undefined && listing.views !== null && (
                <span className="flex items-center gap-0.5 text-slate-500 font-bold" title={`${listing.views} Views`}>
                  <span>👁️</span>
                  <span>{listing.views}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {new Date(listing.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Pricing Area */}
        <div className="pt-2">
          {isFree ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-xs sm:text-sm border border-emerald-200 shadow-sm">
              🎁 FREE FOR JUNIORS
            </span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
                ₹{listing.price.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-slate-400">campus deal</span>
            </div>
          )}
        </div>

        {/* Card Footer: Seller Avatar with Gradient Ring & View Details */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Seller avatar initial with gradient ring */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-800">
                {sellerInitial}
              </div>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[110px]">
                {sellerName}
              </span>
              <CheckCircle2
                className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                title="Verified RJIT"
              />
            </div>
          </div>

          {/* Subtle View Details indicator */}
          <div className="text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </article>
  );
};

export default ListingCard;
