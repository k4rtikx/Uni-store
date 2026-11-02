import React, { useRef, useEffect } from 'react';
import { Search, X, ArrowUpDown, Heart, Gift } from 'lucide-react';
import {
  CATEGORY_FILTERS,
  CONDITION_FILTERS,
  STATUS_OPTIONS,
  SORT_OPTIONS,
} from '../../constants/campusConstants';

/**
 * Filter and search command bar for marketplace listings
 * Compact, light emerald & mint floating command bar with cohesive theme pills
 */
const ListingFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCondition,
  onConditionChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  isFreeOnly = false,
  onToggleFreeOnly,
  isSavedOnly = false,
  onToggleSavedOnly,
  savedCount = 0,
}) => {
  const searchInputRef = useRef(null);

  // Keyboard shortcut listener for Ctrl+K, Cmd+K, or "/"
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-md shadow-emerald-950/5 border border-emerald-100/90 space-y-3">
      {/* Modern Compact Spotlight Search Bar */}
      <div className="relative flex items-center bg-slate-50/80 hover:bg-slate-50 focus-within:bg-white rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 p-2 sm:p-2.5 transition-all">
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 ml-2.5 shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search textbooks, lab coats, drafters, calculators, hostel cycles..."
          className="w-full px-3 py-0.5 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm sm:text-base font-normal"
        />
        
        {/* Clear query button */}
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search query"
            className="p-1 mr-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          /* Keyboard shortcut pill hint */
          <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-0.5 rounded-md bg-white border border-slate-200/90 text-[11px] font-mono text-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] select-none">
            <span className="text-[10px]">Ctrl</span>
            <span>K</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar: Status, Condition, and Sort By */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-0.5">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Status Segment */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <div className="flex flex-wrap gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => onStatusChange(st.value)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStatus === st.value
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Segment */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Condition:</span>
            <div className="flex flex-wrap gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
              {CONDITION_FILTERS.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => onConditionChange(cond)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCondition === cond
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <label htmlFor="sort-select" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            Sort:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm hover:bg-white transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tactile Segmented Quick Filters & Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar pb-1 pt-0.5">
        {/* Quick Filter: Standout Free Donations */}
        <button
          type="button"
          onClick={() => onToggleFreeOnly && onToggleFreeOnly(!isFreeOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
            isFreeOnly
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/30'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
          }`}
        >
          <Gift className={`w-3.5 h-3.5 ${isFreeOnly ? 'text-white' : 'text-emerald-600'}`} />
          <span>🎁 Free Donations</span>
        </button>

        {/* Quick Filter: Wishlist / Saved Items */}
        <button
          type="button"
          onClick={() => onToggleSavedOnly && onToggleSavedOnly(!isSavedOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
            isSavedOnly
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-500/30'
              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300'
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isSavedOnly ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'
            }`}
          />
          <span>❤️ Saved ({savedCount})</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

        {/* Category Pills */}
        {CATEGORY_FILTERS.map((cat) => {
          const isSelected = selectedCategory === cat && !isFreeOnly && !isSavedOnly;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-100/80 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/60'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ListingFilterBar;
