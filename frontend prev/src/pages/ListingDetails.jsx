import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import { getListingById, markListingAsSold } from '../services/api';
import useAuth from '../context/useAuth';
import useWishlist from '../context/useWishlist';
import ListingImage from '../components/listings/ListingImage';
import ListingInfo from '../components/listings/ListingInfo';
import SellerContactCard from '../components/listings/SellerContactCard';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80';

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSaved: checkIsSaved, toggleSaveItem } = useWishlist();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedContact, setCopiedContact] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const shareToastTimer = useRef(null);
  const copiedContactTimer = useRef(null);

  // Clear timers on component unmount to prevent state updates after unmount
  useEffect(() => {
    return () => {
      if (shareToastTimer.current) clearTimeout(shareToastTimer.current);
      if (copiedContactTimer.current) clearTimeout(copiedContactTimer.current);
    };
  }, []);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Fetch listing details and trigger view counter increment
  useEffect(() => {
    let isMounted = true;

    const fetchListing = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getListingById(id);
        if (isMounted && res.data?.success && res.data?.data) {
          setListing(res.data.data);
        } else if (isMounted) {
          setError('Listing not found or has been removed.');
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || 'Failed to load listing details. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchListing();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-6 h-96 bg-slate-200 rounded-3xl"></div>
            <div className="md:col-span-6 space-y-4">
              <div className="h-8 bg-slate-200 rounded-xl w-3/4"></div>
              <div className="h-6 bg-slate-200 rounded-lg w-1/3"></div>
              <div className="h-28 bg-slate-200 rounded-2xl"></div>
              <div className="h-40 bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Listing Unavailable</h2>
        <p className="text-slate-500 text-sm">{error || 'This listing could not be found.'}</p>
        <div className="pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            ← Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const isSold = listing.status === 'Sold' || listing.status === 'SOLD';
  const isAvailable = listing.status === 'Available' || listing.status === 'AVAILABLE';
  const isFree = Number(listing.price) === 0;
  const isSaved = checkIsSaved(listing._id);

  // Check if the currently logged-in user is the owner of the listing
  const currentUserId = user?._id || user?.id;
  const sellerId =
    listing.creatorId?._id ||
    listing.creatorId ||
    listing.seller?._id ||
    listing.seller;
  const isOwner = Boolean(
    currentUserId && sellerId && String(currentUserId) === String(sellerId)
  );

  const sellerName = listing.seller?.name || 'RJIT Student';
  const sellerCollege = listing.seller?.college || 'RJIT Tekanpur';
  const sellerEmail = listing.seller?.email || 'N/A';
  const sellerPhone = listing.seller?.phone || '';

  // Handler: Mark as Sold
  const handleMarkAsSold = async () => {
    try {
      setUpdatingStatus(true);
      setStatusMessage('');
      const res = await markListingAsSold(id);
      if (res.data?.success) {
        const updated = res.data?.data || res.data?.listing;
        setListing((prev) => ({
          ...prev,
          ...(updated || {}),
          status: 'Sold',
        }));
        setStatusMessage('Item marked as Sold successfully!');
      }
    } catch (err) {
      setStatusMessage(
        err.response?.data?.message || 'Failed to mark as sold. Please try again.'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!sellerPhone) return '';
    const cleanDigits = sellerPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const message = encodeURIComponent(
      `Hi, I am interested in your listing "${listing.title}" on ReuseCampus RJIT!`
    );
    return `https://wa.me/${phoneWithCountry}?text=${message}`;
  };

  const getEmailLink = () => {
    const subject = encodeURIComponent(`ReuseCampus RJIT: Inquiring about ${listing.title}`);
    const body = encodeURIComponent(
      `Hi ${sellerName},\n\nI saw your listing for "${listing.title}" (${
        isFree ? 'FREE / DONATION' : `₹${listing.price}`
      }) on ReuseCampus and would like to buy it.\n\nPlease let me know when and where on campus we can meet.\n\nThank you!`
    );
    return `mailto:${sellerEmail}?subject=${subject}&body=${body}`;
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const priceText = isFree ? 'FREE' : `₹${listing.price}`;
    const shareData = {
      title: listing.title,
      text: `${listing.title} - ${priceText} on ReuseCampus RJIT`,
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
      setShareToast(true);
      if (shareToastTimer.current) clearTimeout(shareToastTimer.current);
      shareToastTimer.current = setTimeout(() => setShareToast(false), 2400);
    } catch {
      // clipboard write failed fallback
    }
  };

  const copySellerDetails = () => {
    const formatted = `Seller: ${sellerName}\nCollege: ${sellerCollege}\nEmail: ${sellerEmail}\nPhone: ${
      sellerPhone || 'N/A'
    }\nItem: ${listing.title} (${isFree ? 'FREE' : `₹${listing.price}`})`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    setCopiedContact(true);
    if (copiedContactTimer.current) clearTimeout(copiedContactTimer.current);
    copiedContactTimer.current = setTimeout(() => setCopiedContact(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          id="back-button"
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full px-4 py-2 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Native Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 shadow-sm text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Share this listing"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Share</span>
          </button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => toggleSaveItem(listing._id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border shadow-sm text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              isSaved
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border-slate-200'
            }`}
            title={isSaved ? 'Remove from Wishlist' : 'Save to Wishlist'}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isSaved ? 'fill-red-500 text-red-500 scale-110' : ''
              }`}
            />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold rounded-2xl shadow-2xl border border-emerald-500/30 animate-fadeIn pointer-events-none">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Listing link copied to clipboard!</span>
        </div>
      )}

      {/* Status Action Alert Notification */}
      {statusMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-xs text-emerald-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Listing Layout: 2 Columns */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col md:flex-row gap-0">
        {/* Left Column: Product Photo & Badges */}
        <ListingImage
          imageUrl={listing.imageUrl}
          title={listing.title}
          category={listing.category}
          isFree={isFree}
          isSold={isSold}
          fallbackImage={FALLBACK_IMAGE}
        />

        {/* Right Column: Listing Details, View Counter & Contact/Owner Actions */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <ListingInfo
            listing={listing}
            isFree={isFree}
            isSold={isSold}
            isAvailable={isAvailable}
            isOwner={isOwner}
            updatingStatus={updatingStatus}
            onMarkAsSold={handleMarkAsSold}
          />

          <SellerContactCard
            sellerName={sellerName}
            sellerCollege={sellerCollege}
            sellerEmail={sellerEmail}
            sellerPhone={sellerPhone}
            isSold={isSold}
            isOwner={isOwner}
            whatsAppLink={getWhatsAppLink()}
            emailLink={getEmailLink()}
            copiedContact={copiedContact}
            onCopyDetails={copySellerDetails}
          />
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
