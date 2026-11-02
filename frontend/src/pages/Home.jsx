import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Coins,
  RefreshCw,
  Loader2,
  PackageOpen,
  RotateCcw,
  Gift,
  MessageCircle,
  Package,
} from 'lucide-react';
import { getListings } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import useAuth from '../context/useAuth';
import useWishlist from '../hooks/useWishlist';
import ListingCard from '../components/listings/ListingCard';
import ListingFilterBar from '../components/listings/ListingFilterBar';
import ListingSkeleton from '../components/ui/ListingSkeleton';

/**
 * Main campus marketplace discovery feed with compact Light Emerald Split Hero,
 * unified filter bar, and immediate product visibility.
 */
const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { savedIds, count: savedCount } = useWishlist();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [isFreeOnly, setIsFreeOnly] = useState(false);

  // URL-driven and local Saved Items filter (single source of truth, zero loop)
  const searchParams = new URLSearchParams(location.search);
  const isSavedUrl = searchParams.get('saved') === 'true';
  const [isSavedLocal, setIsSavedLocal] = useState(false);
  const isSavedOnly = isSavedUrl || isSavedLocal;

  // Clean toggle handler that seamlessly synchronizes URL & state without re-mount loops
  const handleToggleSavedOnly = useCallback(
    (nextVal) => {
      const shouldBeSaved = typeof nextVal === 'boolean' ? nextVal : !isSavedOnly;
      const nextParams = new URLSearchParams(location.search);
      if (shouldBeSaved) {
        nextParams.set('saved', 'true');
      } else {
        nextParams.delete('saved');
      }
      const searchStr = nextParams.toString();
      navigate(searchStr ? `/?${searchStr}` : '/', { replace: true });
      setIsSavedLocal(shouldBeSaved);
    },
    [isSavedOnly, location.search, navigate]
  );

  // Debounced search to prevent excessive backend querying
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch listings for marketplace browse feed (independent of wishlist state to prevent loops)
  const fetchListings = useCallback(
    async (pageToFetch = 1, isAppending = false) => {
      if (isAppending) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const params = {
          page: pageToFetch,
          limit: 12,
        };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (selectedCategory !== 'All') params.category = selectedCategory;
        if (selectedCondition !== 'All') params.condition = selectedCondition;
        if (selectedStatus) params.status = selectedStatus;
        if (sortBy) params.sort = sortBy;
        if (isFreeOnly) params.isFree = true;

        const res = await getListings(params);
        const responseData = res.data?.data || res.data?.listings || res.data?.savedItems;
        if (res.data?.success && Array.isArray(responseData)) {
          const items = responseData.filter(
            (item) => item !== null && item !== undefined && item._id
          );

          if (isAppending) {
            setListings((prev) => [...prev, ...items]);
          } else {
            setListings(items);
          }

          setPage(pageToFetch);
          setHasMore(Boolean(res.data.pagination?.hasMore));
          setTotalCount(res.data.pagination?.total || items.length);
        } else {
          if (!isAppending) setListings([]);
          setHasMore(false);
        }
      } catch {
        setError('Unable to load listings. Please check your network connection.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, selectedCategory, selectedCondition, selectedStatus, sortBy, isFreeOnly]
  );

  // Trigger marketplace fetch whenever browse filters change
  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchListings(1, false);
      }
    };
    loadData();
    return () => {
      ignore = true;
    };
  }, [fetchListings]);

  // Smooth scroll to feed when ?saved=true is loaded without triggering any state changes
  useEffect(() => {
    if (isSavedUrl) {
      const feedElement = document.getElementById('browse-feed');
      feedElement?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isSavedUrl]);

  // Handle shared link with ?item=<id> by navigating directly to full listing details
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sharedItemId = searchParams.get('item');
    if (sharedItemId) {
      navigate(`/listings/${sharedItemId}`, { replace: true });
    }
  }, [navigate]);

  // Normalized saved IDs array for instant memory comparisons
  const normalizedSavedIds = useMemo(() => {
    return (Array.isArray(savedIds) ? savedIds : [])
      .map((item) => (typeof item === 'object' && item !== null ? String(item._id || item.id || '') : String(item)))
      .filter(Boolean);
  }, [savedIds]);

  // Quietly load any bookmarked items that aren't in memory yet (zero screen flicker or loading spinners)
  const missingSavedIds = useMemo(() => {
    if (!isSavedOnly || normalizedSavedIds.length === 0) return [];
    const loadedIds = new Set(listings.map((l) => String(l._id)));
    return normalizedSavedIds.filter((id) => !loadedIds.has(id));
  }, [isSavedOnly, normalizedSavedIds, listings]);

  const missingSavedKey = missingSavedIds.join(',');

  useEffect(() => {
    if (!missingSavedKey) return;
    let isCancelled = false;
    const fetchMissing = async () => {
      try {
        const res = await getListings({ ids: missingSavedKey, status: 'ALL', limit: 100 });
        const responseData = res.data?.data || res.data?.listings || res.data?.savedItems;
        if (!isCancelled && res.data?.success && Array.isArray(responseData)) {
          const newItems = responseData.filter(
            (item) => item !== null && item !== undefined && item._id
          );
          if (newItems.length > 0) {
            setListings((prev) => {
              const prevIds = new Set(prev.map((i) => String(i._id)));
              const toAdd = newItems.filter((i) => !prevIds.has(String(i._id)));
              return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
            });
          }
        }
      } catch (err) {
        console.warn('Quiet fetch for missing saved items:', err);
      }
    };
    fetchMissing();
    return () => {
      isCancelled = true;
    };
  }, [missingSavedKey]);

  // Instant zero-blink client-side memory filtering for Saved Items view
  const displayedListings = useMemo(() => {
    const valid = listings.filter((item) => item !== null && item !== undefined && item._id);
    if (!isSavedOnly) {
      return valid;
    }
    return valid.filter((item) => normalizedSavedIds.includes(String(item._id)));
  }, [listings, isSavedOnly, normalizedSavedIds]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchListings(page + 1, true);
    }
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSelectedStatus('ALL');
    setSortBy('newest');
    setIsFreeOnly(false);
    setIsSavedLocal(false);
    if (isSavedUrl) {
      const nextParams = new URLSearchParams(location.search);
      nextParams.delete('saved');
      const searchStr = nextParams.toString();
      navigate(searchStr ? `/?${searchStr}` : '/', { replace: true });
    }
  };

  const handleExploreFreeDonations = () => {
    setIsFreeOnly(true);
    setIsSavedLocal(false);
    if (isSavedUrl) {
      const nextParams = new URLSearchParams(location.search);
      nextParams.delete('saved');
      navigate(nextParams.toString() ? `/?${nextParams.toString()}` : '/', { replace: true });
    }
    const feedElement = document.getElementById('browse-feed');
    feedElement?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Cohesive Light Emerald Split Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/70 rounded-3xl p-6 lg:p-10 shadow-sm relative overflow-hidden">
          {/* Soft, light decorative background accents */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-dot-pattern opacity-35 pointer-events-none" />

          {/* 2-Column Split Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Column: Headline & Action Buttons */}
            <div className="lg:col-span-7 text-left space-y-4">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300/60 text-xs font-bold tracking-wide uppercase shadow-sm">
                <span>🎓</span>
                <span>Official RJIT Tekanpur Student Marketplace</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Buy, Sell & Pass Down <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Campus Essentials.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                Connect directly with verified students at RJIT Tekanpur to trade textbooks, calculators,
                engineering drafters, and hostel gear safely with zero middleman fees.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  List an Item for Free →
                </Link>
                <button
                  type="button"
                  onClick={handleExploreFreeDonations}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-sm shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                >
                  Explore Free Donations 🎁
                </button>
              </div>
            </div>

            {/* Right Column: 2x2 Bento Grid of Frosted White Trust Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-3.5">
              {/* Card 1: 100% @rjit.ac.in Verified */}
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    100% @rjit.ac.in Verified
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Student gatekeeping
                  </p>
                </div>
              </div>

              {/* Card 2: ₹0 Junior Donations */}
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    ₹0 Junior Donations
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Pass down notes & drafters
                  </p>
                </div>
              </div>

              {/* Card 3: Direct WhatsApp Deal */}
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Direct WhatsApp Deal
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Instant handover, 0% fee
                  </p>
                </div>
              </div>

              {/* Card 4: Dynamic Active Items Count */}
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {totalCount > 0 ? `${totalCount} Active Items` : 'Active Items'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Live on RJIT marketplace
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Marketplace Feed with Immediate Product Grid Visibility */}
      <section id="browse-feed" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus Marketplace Feed
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Fresh second-hand items listed by verified students at RJIT Tekanpur
            </p>
          </div>
          {totalCount > 0 && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full w-fit">
              {totalCount} item{totalCount === 1 ? '' : 's'} available
            </span>
          )}
        </div>

        {/* Unified Command-Style Filter & Search Bar */}
        <ListingFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedCondition={selectedCondition}
          onConditionChange={setSelectedCondition}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          isFreeOnly={isFreeOnly}
          onToggleFreeOnly={setIsFreeOnly}
          isSavedOnly={isSavedOnly}
          onToggleSavedOnly={handleToggleSavedOnly}
          savedCount={savedCount}
        />

        {/* Error notification banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Listings Display Grid or Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <ListingSkeleton key={index} />
            ))}
          </div>
        ) : displayedListings.length === 0 ? (
          <div className="py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <PackageOpen className="w-7 h-7" />
            </div>
            {isSavedOnly ? (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800">Your Saved Wishlist is Empty</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  You haven't bookmarked any campus items yet. Tap the heart icon on any listing to save it here!
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All Filters & Browse Marketplace
                  </button>
                </div>
              </div>
            ) : isFreeOnly ? (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800">No Free Junior Donations Found</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  No free items match your active filters. Try resetting your filters or donate an item to a junior!
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer border border-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                  <Link
                    to="/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                  >
                    🎁 Donate an Item Free
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800">No campus listings match your criteria</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Try clearing your search query or resetting your category and condition filters.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer border border-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                  <Link
                    to="/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                  >
                    Post an Item
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {displayedListings.map((item) => (
                <ListingCard
                  key={item._id}
                  item={item}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 font-bold text-sm border border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      Loading more items...
                    </>
                  ) : (
                    <>
                      <span>Load More Items</span>
                      {totalCount > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {listings.length} of {totalCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Sustainable Campus Value Props */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Verified College Students</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Only students with official @rjit.ac.in institutional accounts can trade, guaranteeing safety and trust.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Zero Middleman Commissions</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Direct peer-to-peer exchange right on campus. 100% of the agreed price goes straight to the student seller.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Sustainable Campus Living</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Prevent hostel waste by passing down textbooks, calculators, and lab tools to upcoming batches.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
