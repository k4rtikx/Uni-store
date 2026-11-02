import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Lock,
  Edit3,
  RotateCcw,
  IndianRupee,
  X,
  Check,
  Camera,
  ExternalLink,
  AlertTriangle,
  ArrowUpRight,
  ArrowLeft,
} from 'lucide-react';
import {
  getMyListings,
  markListingSold,
  updateListingStatus,
  updateListing,
  deleteListing,
} from '../services/api';
import useAuth from '../context/useAuth';
import { compressImageFile } from '../utils/imageCompressor';

import { CATEGORIES, CONDITIONS } from '../constants/campusConstants';

const MyListings = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'SOLD'

  // Edit Listing State
  const [editingListing, setEditingListing] = useState(null);
  const [isDonate, setIsDonate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  // Delete Confirmation Modal State
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch logged-in student's listings
  const fetchMyListings = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await getMyListings();
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setListings(res.data.data);
      } else {
        setListings([]);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Could not load your listings. Please refresh.'
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      await Promise.resolve();
      if (!ignore && !authLoading) {
        fetchMyListings();
      }
    };
    loadData();
    return () => {
      ignore = true;
    };
  }, [authLoading, fetchMyListings]);

  // Status Summary Stats
  const totalCount = listings.length;
  const activeCount = listings.filter(
    (item) => (item.status || '').toUpperCase() === 'AVAILABLE'
  ).length;
  const soldCount = listings.filter(
    (item) => (item.status || '').toUpperCase() === 'SOLD'
  ).length;

  // Filtered listings based on tab
  const displayedListings = listings.filter((item) => {
    const s = (item.status || '').toUpperCase();
    if (filterTab === 'AVAILABLE') return s === 'AVAILABLE';
    if (filterTab === 'SOLD') return s === 'SOLD';
    return true;
  });

  // Toggle status between Available and Sold
  const handleToggleStatus = async (id, currentStatus) => {
    const isCurrAvailable = (currentStatus || '').toUpperCase() === 'AVAILABLE';
    const newStatus = isCurrAvailable ? 'Sold' : 'Available';
    try {
      setActionSuccess('');
      setErrorMessage('');

      const res = isCurrAvailable
        ? await markListingSold(id)
        : await updateListingStatus(id, newStatus);

      if (res.data?.success) {
        const updatedItem = res.data?.data || res.data?.listing;
        setActionSuccess(
          newStatus === 'Sold'
            ? 'Item marked as SOLD! Great job passing it down.'
            : 'Item re-listed as AVAILABLE for campus buyers.'
        );
        setListings((prev) =>
          prev.map((item) =>
            item._id === id
              ? (updatedItem ? { ...item, ...updatedItem, status: newStatus } : { ...item, status: newStatus })
              : item
          )
        );
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not update item status.');
    }
  };

  // Open Edit Modal with pre-filled values
  const handleOpenEdit = (item) => {
    const isFree = Number(item.price) === 0 || item.isFree === true;
    setIsDonate(isFree);
    setEditingListing({
      _id: item._id,
      title: item.title || '',
      price: item.price !== undefined && item.price !== null ? String(item.price) : '',
      category: item.category || 'Books',
      condition: item.condition || 'Good',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      status: item.status || 'AVAILABLE',
    });
    setShowUrlInput(false);
    setErrorMessage('');
    setActionSuccess('');
  };

  // Image replacement via file upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 900, 0.8);
      setEditingListing((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
    } catch (err) {
      alert(err.message || 'Failed to process selected image file.');
    } finally {
      setCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Edit Handler
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingListing) return;

    setErrorMessage('');

    const trimmedTitle = editingListing.title.trim();
    const trimmedDesc = editingListing.description.trim();
    const numPrice = isDonate ? 0 : Number(editingListing.price);

    if (!trimmedTitle) {
      setErrorMessage('Item title cannot be empty or whitespace only.');
      return;
    }
    if (!trimmedDesc) {
      setErrorMessage('Item description cannot be empty or whitespace only.');
      return;
    }
    if (!isDonate && (editingListing.price === '' || isNaN(numPrice) || numPrice < 0)) {
      setErrorMessage('Price cannot be negative. Set ₹0 for free giveaways.');
      return;
    }

    setSavingEdit(true);

    try {
      const payload = {
        title: trimmedTitle,
        price: numPrice,
        category: editingListing.category,
        condition: editingListing.condition,
        description: trimmedDesc,
        imageUrl: editingListing.imageUrl.trim(),
        status: editingListing.status,
      };

      const res = await updateListing(editingListing._id, payload);

      if (res.data?.success) {
        const updatedItem = res.data?.data || res.data?.listing;
        setActionSuccess('Listing updated successfully!');
        if (updatedItem) {
          setListings((prev) =>
            prev.map((item) => (item._id === editingListing._id ? { ...item, ...updatedItem } : item))
          );
        }
        setEditingListing(null);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Failed to update listing. Please check your inputs.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    setActionSuccess('');
    setErrorMessage('');

    try {
      const res = await deleteListing(deletingItem._id);
      if (res.data?.success) {
        setActionSuccess(`"${deletingItem.title}" has been permanently removed.`);
        setListings((prev) => prev.filter((item) => item._id !== deletingItem._id));
        setDeletingItem(null);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Could not remove listing. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Unauthenticated State
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to view your seller dashboard</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            You need a verified campus student account to manage your listings, edit items, and track sales.
          </p>
        </div>
        <Link
          to="/login"
          state={{ from: { pathname: '/my-listings' } }}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-all active:scale-95"
        >
          Sign In to Campus Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            Seller Management
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            My Campus Listings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track your second-hand items, toggle availability, edit listings, and confirm campus sales.
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-sm shadow-sm hover:shadow-md hover:shadow-emerald-600/20 transition-all shrink-0 active:scale-95"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          Post New Item
        </Link>
      </div>

      {/* Clean Luxury Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Listings Card */}
        <div
          onClick={() => setFilterTab('ALL')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            filterTab === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                filterTab === 'ALL' ? 'text-slate-400' : 'text-slate-400'
              }`}
            >
              Total Listings
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                filterTab === 'ALL'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-bold">{totalCount}</span>
            <span
              className={`text-xs font-medium ${
                filterTab === 'ALL' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              items posted
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs font-semibold gap-1">
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Active / Available Listings Card */}
        <div
          onClick={() => setFilterTab('AVAILABLE')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            filterTab === 'AVAILABLE'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/25'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                filterTab === 'AVAILABLE' ? 'text-emerald-100' : 'text-slate-400'
              }`}
            >
              Active Listings
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                filterTab === 'AVAILABLE'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-bold">{activeCount}</span>
            <span
              className={`text-xs font-medium ${
                filterTab === 'AVAILABLE' ? 'text-emerald-100' : 'text-slate-500'
              }`}
            >
              available on campus
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs font-semibold gap-1">
            <span>Show Available Only</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Sold Listings Card */}
        <div
          onClick={() => setFilterTab('SOLD')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            filterTab === 'SOLD'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xl shadow-amber-600/25'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                filterTab === 'SOLD' ? 'text-amber-100' : 'text-slate-400'
              }`}
            >
              Sold Items
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                filterTab === 'SOLD' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-bold">{soldCount}</span>
            <span
              className={`text-xs font-medium ${
                filterTab === 'SOLD' ? 'text-amber-100' : 'text-slate-500'
              }`}
            >
              completed sales
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs font-semibold gap-1">
            <span>Show Sold Only</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Notifications / Feedback */}
      {actionSuccess && (
        <div className="flex items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-medium animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium animate-fadeIn shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-600 hover:text-rose-800 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Items ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('AVAILABLE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Available ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('SOLD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'SOLD'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Sold ({soldCount})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {displayedListings.length} of {totalCount} item{totalCount === 1 ? '' : 's'}
        </span>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-9 h-9 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Loading your campus listings...</p>
        </div>
      ) : displayedListings.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-4 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {filterTab === 'ALL'
                ? 'No listings posted yet'
                : filterTab === 'AVAILABLE'
                ? 'No active items available'
                : 'No sold items yet'}
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
              {filterTab === 'ALL'
                ? "Have textbooks, calculators, lab coats, or stationery you don't need? Pass them on to fellow students!"
                : filterTab === 'AVAILABLE'
                ? 'All your posted items have been marked as sold, or you have not posted any yet.'
                : 'When campus buyers purchase your items, mark them as sold to keep your history organized.'}
            </p>
          </div>
          {filterTab !== 'ALL' ? (
            <button
              onClick={() => setFilterTab('ALL')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
            >
              Reset Filter
            </button>
          ) : (
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Create Your First Listing
            </Link>
          )}
        </div>
      ) : (
        /* Listing Cards with 3 Action Buttons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedListings.map((item) => {
            const isSold = (item.status || '').toUpperCase() === 'SOLD';

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col group relative"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      isSold ? 'grayscale-[40%] opacity-85' : ''
                    }`}
                    onError={(e) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  {/* Category Badge Top-Left */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-slate-900/75 text-white shadow-sm border border-white/20">
                      {item.category}
                    </span>
                  </div>

                  {/* Status Indicator Top-Right */}
                  <span
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider shadow-sm uppercase ${
                      isSold
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {item.status}
                  </span>

                  {/* Watermark badge on image if sold */}
                  {isSold && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                      <span className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm tracking-widest uppercase shadow-lg border border-amber-300">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                </div>

                {/* Listing Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {item.condition}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    {Number(item.price) === 0 ? (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-xs sm:text-sm border border-emerald-200 shadow-sm">
                          🎁 FREE FOR JUNIORS
                        </span>
                      </div>
                    ) : (
                      <p className="font-mono text-2xl font-bold text-slate-900 mt-3">
                        ₹{item.price.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons Toolbar: Mark Sold / Edit / Delete */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Action A: "Mark as Sold" / "Mark Available" Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item._id, item.status)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        isSold
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                      title={isSold ? 'Re-list as AVAILABLE' : 'Mark as SOLD'}
                    >
                      {isSold ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Mark Available
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark as Sold
                        </>
                      )}
                    </button>

                    {/* Action B: Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer border border-slate-200 active:scale-95"
                      title="Edit Item Details"
                      aria-label="Edit Listing"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Action C: Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-slate-200 active:scale-95"
                      title="Delete Listing"
                      aria-label="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clean Edit Listing Modal Pre-filled With Current Fields & File Upload */}
      {editingListing && (
        <div
          onClick={() => setEditingListing(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fadeIn overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 relative my-8 text-left"
          >
            {/* Close Button */}
            <button
              onClick={() => setEditingListing(null)}
              type="button"
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer group"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-emerald-600" />
                  <span>Back</span>
                </button>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider border border-emerald-200">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  Edit Listing
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Edit Item Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update item specifications, change price, or upload a replacement photo.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Item Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  value={editingListing.title}
                  onChange={(e) =>
                    setEditingListing({ ...editingListing, title: e.target.value })
                  }
                  required
                  placeholder="e.g. Higher Engineering Mathematics by B.S. Grewal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={editingListing.category}
                    onChange={(e) =>
                      setEditingListing({ ...editingListing, category: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Condition *
                  </label>
                  <select
                    value={editingListing.condition}
                    onChange={(e) =>
                      setEditingListing({ ...editingListing, condition: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prominent Free Donation Toggle */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <label
                  htmlFor="edit-free-donation-toggle"
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <input
                    id="edit-free-donation-toggle"
                    type="checkbox"
                    checked={isDonate}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsDonate(checked);
                      setEditingListing((prev) => ({
                        ...prev,
                        price: checked ? '0' : '',
                      }));
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1">
                      🎁 Donate this item for FREE to a Junior (₹0)
                    </span>
                    <p className="text-[10px] sm:text-[11px] text-emerald-700">
                      Giveaway mode: Sets price to ₹0 for juniors
                    </p>
                  </div>
                </label>

                {isDonate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white shadow-sm shrink-0">
                    FREE
                  </span>
                )}
              </div>

              {/* Price & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      value={editingListing.price}
                      onChange={(e) =>
                        setEditingListing({ ...editingListing, price: e.target.value })
                      }
                      disabled={isDonate}
                      required={!isDonate}
                      placeholder={isDonate ? '0 (Free Donation to Juniors)' : '0 (Set 0 for free giveaway)'}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-mono transition-all ${
                        isDonate
                          ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800 font-bold cursor-not-allowed'
                          : 'border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={editingListing.status}
                    onChange={(e) =>
                      setEditingListing({ ...editingListing, status: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="SOLD">SOLD</option>
                  </select>
                </div>
              </div>

              {/* Image Preview & Replacement Section (Allows File Upload Replacement) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Item Photo *
                </label>

                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                    <img
                      src={editingListing.imageUrl}
                      alt="Current"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    {compressingImage && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={compressingImage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {compressingImage ? 'Processing...' : 'Replace Photo'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {showUrlInput ? 'Hide URL' : 'Edit URL'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Upload from phone/camera or paste a web link.
                    </p>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* Optional Direct URL Input */}
                {showUrlInput && (
                  <div className="mt-2 animate-fadeIn">
                    <input
                      type="text"
                      value={editingListing.imageUrl}
                      onChange={(e) =>
                        setEditingListing({ ...editingListing, imageUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={editingListing.description}
                  onChange={(e) =>
                    setEditingListing({ ...editingListing, description: e.target.value })
                  }
                  required
                  placeholder="Specify edition, highlights, accessories included, campus handover location..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || compressingImage}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Delete Confirmation Modal */}
      {deletingItem && (
        <div
          onClick={() => !isDeleting && setDeletingItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 text-center relative"
          >
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Delete this listing?</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to permanently remove{' '}
                <strong className="text-slate-800">"{deletingItem.title}"</strong>?
              </p>
              <p className="text-xs text-slate-400 mt-1">
                This action cannot be undone and the item will be removed from the campus marketplace.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                No, Keep Item
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
