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
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { getListings } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import useWishlist from '../hooks/useWishlist';
import ListingCard from '../components/listings/ListingCard';
import ListingFilterBar from '../components/listings/ListingFilterBar';
import ListingSkeleton from '../components/ui/ListingSkeleton';
import Tilt3D from '../components/ui/Tilt3D';
import Scene3D from '../components/three/Scene3D';

/**
 * Home — RJIT Campus Marketplace with full 3D frontend.
 * Features: immersive WebGL hero, animated stat chips, 3D listing cards.
 */
const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { savedIds, count: savedCount } = useWishlist();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [isFreeOnly, setIsFreeOnly] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const isSavedUrl = searchParams.get('saved') === 'true';
  const [isSavedLocal, setIsSavedLocal] = useState(false);
  const isSavedOnly = isSavedUrl || isSavedLocal;

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

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchListings = useCallback(
    async (pageToFetch = 1, isAppending = false) => {
      if (isAppending) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const params = { page: pageToFetch, limit: 12 };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (selectedCategory !== 'All') params.category = selectedCategory;
        if (selectedCondition !== 'All') params.condition = selectedCondition;
        if (selectedStatus) params.status = selectedStatus;
        if (sortBy) params.sort = sortBy;
        if (isFreeOnly) params.isFree = true;

        const res = await getListings(params);
        const responseData = res.data?.data || res.data?.listings || res.data?.savedItems;
        if (res.data?.success && Array.isArray(responseData)) {
          const items = responseData.filter((item) => item !== null && item !== undefined && item._id);
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

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      await Promise.resolve();
      if (!ignore) fetchListings(1, false);
    };
    loadData();
    return () => { ignore = true; };
  }, [fetchListings]);

  useEffect(() => {
    if (isSavedUrl) {
      document.getElementById('browse-feed')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isSavedUrl]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const sharedItemId = sp.get('item');
    if (sharedItemId) navigate(`/listings/${sharedItemId}`, { replace: true });
  }, [navigate]);

  const normalizedSavedIds = useMemo(() => {
    return (Array.isArray(savedIds) ? savedIds : [])
      .map((item) => (typeof item === 'object' && item !== null ? String(item._id || item.id || '') : String(item)))
      .filter(Boolean);
  }, [savedIds]);

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
          const newItems = responseData.filter((item) => item !== null && item !== undefined && item._id);
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
    return () => { isCancelled = true; };
  }, [missingSavedKey]);

  const displayedListings = useMemo(() => {
    const valid = listings.filter((item) => item !== null && item !== undefined && item._id);
    if (!isSavedOnly) return valid;
    return valid.filter((item) => normalizedSavedIds.includes(String(item._id)));
  }, [listings, isSavedOnly, normalizedSavedIds]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) fetchListings(page + 1, true);
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
    document.getElementById('browse-feed')?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ── Stat chips for hero ── */
  const heroStats = [
    {
      icon: ShieldCheck,
      title: '100% @rjit.ac.in Verified',
      sub: 'Student-only gatekeeping',
      color: 'emerald',
      delay: '0s',
      pos: 'lg:absolute lg:w-58 lg:top-2 lg:left-2',
    },
    {
      icon: Gift,
      title: '₹0 Junior Donations',
      sub: 'Pass down notes & drafters',
      color: 'teal',
      delay: '0.7s',
      pos: 'lg:absolute lg:w-58 lg:top-16 lg:right-2',
    },
    {
      icon: MessageCircle,
      title: 'Direct WhatsApp Deal',
      sub: 'Instant handover, 0% fee',
      color: 'emerald',
      delay: '1.4s',
      pos: 'lg:absolute lg:w-58 lg:bottom-16 lg:left-2',
    },
    {
      icon: Package,
      title: totalCount > 0 ? `${totalCount} Active Items` : 'Active Items',
      sub: 'Live on RJIT marketplace',
      color: 'teal',
      delay: '2.1s',
      pos: 'lg:absolute lg:w-58 lg:bottom-2 lg:right-2',
    },
  ];

  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'bg-emerald-100 text-emerald-700',
      border: 'border-emerald-100/80',
    },
    teal: {
      bg: 'bg-teal-50',
      icon: 'bg-teal-100 text-teal-700',
      border: 'border-teal-100/80',
    },
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-20">

      {/* ── HERO: Full-bleed 3D section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative bg-gradient-to-br from-emerald-50/95 via-teal-50/60 to-white/95 border border-emerald-200/60 rounded-3xl overflow-hidden shadow-xl">

          {/* Decorative depth layers */}
          <div className="absolute -top-28 -left-28 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -right-28 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />
          <div className="absolute inset-0 hero-grid opacity-60 pointer-events-none" />

          {/* Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center p-6 lg:p-10">

            {/* Left column */}
            <div className="lg:col-span-7 text-left space-y-5">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 text-xs font-black tracking-widest uppercase shadow-sm badge-pulse">
                <span>🎓</span>
                <span>Official RJIT Tekanpur Student Marketplace</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Buy, Sell &amp; Pass Down{' '}
                <br className="hidden sm:block" />
                <span className="text-gradient-emerald">
                  Campus Essentials.
                </span>
              </h1>

              {/* Sub */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                Connect with verified students at RJIT Tekanpur to trade textbooks,
                calculators, engineering drafters, and hostel gear — safely, with
                zero middleman fees.
              </p>

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-xl shadow-emerald-600/25 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  List an Item for Free
                </Link>
                <button
                  type="button"
                  onClick={handleExploreFreeDonations}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/90 hover:bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Explore Free Donations 🎁
                </button>
              </div>

              {/* Quick stats row */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {[
                  { icon: Users, label: 'Verified Students', val: '500+' },
                  { icon: TrendingUp, label: 'Items Traded', val: `${totalCount > 0 ? totalCount : '—'}` },
                  { icon: Zap, label: 'Instant Connect', val: 'WhatsApp' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <span className="font-black text-slate-900">{val}</span>
                    <span className="text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — 3D Scene + floating chips */}
            <div className="lg:col-span-5 relative lg:h-[420px]">
              <div className="h-64 sm:h-80 lg:h-full lg:absolute lg:inset-0">
                <Scene3D kind="hero" />
              </div>

              {/* Floating trust chips */}
              <div className="grid grid-cols-2 gap-3 mt-3 lg:mt-0 lg:block">
                {heroStats.map(({ icon: Icon, title, sub, color, delay, pos }) => {
                  const c = colorMap[color];
                  return (
                    <Tilt3D
                      key={title}
                      max={12}
                      className={`float-3d ${c.bg} backdrop-blur-md p-3 sm:p-4 rounded-2xl border ${c.border} card-3d-shadow flex items-center gap-3 ${pos}`}
                      style={{ animationDelay: delay }}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${c.icon} flex items-center justify-center shrink-0`}
                        style={{ transform: 'translateZ(12px)' }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div style={{ transform: 'translateZ(8px)' }}>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900">{title}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{sub}</p>
                      </div>
                    </Tilt3D>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARKETPLACE FEED ── */}
      <section id="browse-feed" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full w-fit shadow-sm">
              {totalCount} item{totalCount === 1 ? '' : 's'} available
            </span>
          )}
        </div>

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

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <ListingSkeleton key={index} />
            ))}
          </div>
        ) : displayedListings.length === 0 ? (
          <div className="py-20 px-4 bg-white/80 rounded-3xl border border-dashed border-slate-300 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <PackageOpen className="w-7 h-7" />
            </div>
            {isSavedOnly ? (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800">Your Saved Wishlist is Empty</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Tap the heart icon on any listing to save it here!
                </p>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Browse Marketplace
                </button>
              </div>
            ) : isFreeOnly ? (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800">No Free Junior Donations Found</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  No free items match your active filters.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer border border-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Filters
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
                  Try clearing your search query or resetting your filters.
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
                <ListingCard key={item._id} item={item} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white/90 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 font-bold text-sm border border-slate-200 shadow-md hover:shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
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
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
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

      {/* ── VALUE PROPS (3D tilt cards) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck,
              iconBg: 'bg-teal-50',
              iconColor: 'text-teal-600',
              title: 'Verified College Students',
              desc: 'Only students with official @rjit.ac.in institutional accounts can trade, guaranteeing safety and trust.',
              accent: '#14b8a6',
            },
            {
              icon: Coins,
              iconBg: 'bg-emerald-50',
              iconColor: 'text-emerald-600',
              title: 'Zero Middleman Commissions',
              desc: 'Direct peer-to-peer exchange on campus. 100% of the agreed price goes straight to the student seller.',
              accent: '#10b981',
            },
            {
              icon: RefreshCw,
              iconBg: 'bg-cyan-50',
              iconColor: 'text-cyan-600',
              title: 'Sustainable Campus Living',
              desc: 'Prevent hostel waste by passing down textbooks, calculators, and lab tools to upcoming batches.',
              accent: '#06b6d4',
            },
          ].map(({ icon: Icon, iconBg, iconColor, title, desc, accent }) => (
            <Tilt3D
              key={title}
              max={7}
              className="p-6 bg-white/85 rounded-3xl border border-slate-200/80 space-y-4 card-3d-shadow cursor-default"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center`}
                style={{ transform: 'translateZ(16px)' }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div style={{ transform: 'translateZ(10px)' }}>
                <h3 className="font-black text-slate-900 text-base mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
              {/* Bottom accent */}
              <div
                className="h-0.5 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${accent}, transparent)`,
                  transform: 'translateZ(4px)',
                }}
              />
            </Tilt3D>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
