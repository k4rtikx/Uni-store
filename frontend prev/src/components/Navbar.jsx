import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  PlusCircle,
  Package,
  LogIn,
  UserPlus,
  LogOut,
  Menu,
  X,
  Home,
  User,
  ShieldCheck,
  Phone,
  Mail,
  Loader2,
  Check,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Heart,
} from 'lucide-react';
import useAuth from '../context/useAuth';
import useWishlist from '../context/useWishlist';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateProfile, isAuthenticated } = useAuth();
  const { savedItems } = useWishlist();

  // Synchronize badge count across AuthContext user.savedItems and WishlistContext savedItems
  const badgeCount = Math.max(
    Array.isArray(user?.savedItems) ? user.savedItems.length : 0,
    Array.isArray(savedItems) ? savedItems.length : 0
  );

  const searchParams = new URLSearchParams(location.search);
  const isSavedActive = location.pathname === '/' && searchParams.get('saved') === 'true';

  const handleWishlistClick = () => {
    if (location.pathname === '/' && isSavedActive) {
      searchParams.delete('saved');
      const searchStr = searchParams.toString();
      navigate(searchStr ? `/?${searchStr}` : '/', { replace: true });
    } else {
      searchParams.set('saved', 'true');
      navigate(`/?${searchParams.toString()}`);
    }
  };

  // Profile modal edit fields
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const profileSuccessTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (profileSuccessTimer.current) clearTimeout(profileSuccessTimer.current);
    };
  }, []);

  // Sync profile fields when modal opens
  useEffect(() => {
    let ignore = false;
    const syncProfile = async () => {
      await Promise.resolve();
      if (!ignore && user && isProfileOpen) {
        setProfileName(user.name || '');
        setProfilePhone(user.phone || '');
      }
    };
    syncProfile();
    return () => {
      ignore = true;
    };
  }, [user, isProfileOpen]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
    setIsProfileOpen(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    const trimmedName = profileName.trim();
    if (!trimmedName) {
      setProfileError('Please enter your full name (cannot be empty).');
      return;
    }

    const trimmedPhone = profilePhone.trim();
    if (trimmedPhone) {
      const phoneRegex = /^(?:(?:\+|0{0,2})91[\s-]?)?[6789]\d{9}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setProfileError(
          'Please enter a valid 10-digit Indian phone number (e.g., +91 98765 43210 or 9876543210).'
        );
        return;
      }
    }

    setIsUpdating(true);

    try {
      if (updateProfile) {
        await updateProfile({
          name: trimmedName,
          phone: trimmedPhone,
        });
      }
      setProfileSuccess('Campus profile updated successfully!');
      if (profileSuccessTimer.current) clearTimeout(profileSuccessTimer.current);
      profileSuccessTimer.current = setTimeout(() => {
        setProfileSuccess('');
      }, 3000);
    } catch (err) {
      setProfileError(
        err.response?.data?.message || err.message || 'Could not update profile. Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-15 sm:h-18">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group transition-transform active:scale-95 shrink-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                  Reuse<span className="text-emerald-600">Campus</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/60 uppercase tracking-wider shrink-0">
                  RJIT
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive('/')
                    ? 'bg-slate-100 text-slate-900 shadow-inner'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>

              {isAuthenticated && (
                <Link
                  to="/my-listings"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive('/my-listings')
                      ? 'bg-slate-100 text-slate-900 shadow-inner'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  My Listings
                </Link>
              )}

              {/* Sell / Donate Item CTA Button */}
              <Link
                to="/create"
                className="ml-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-sm font-semibold transition-colors duration-200 active:scale-95 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Sell / Donate Item</span>
              </Link>
            </div>

            {/* Desktop Auth Links */}
            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200/80">
              {/* Navbar Wishlist Heart Icon Button */}
              <button
                type="button"
                onClick={handleWishlistClick}
                className={`relative p-2 rounded-full transition-all cursor-pointer active:scale-95 group ${
                  isSavedActive
                    ? 'text-rose-600 bg-rose-50 shadow-sm ring-1 ring-rose-200'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/80'
                }`}
                title={`Saved Items (${badgeCount})`}
                aria-label="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isSavedActive || badgeCount > 0 ? 'fill-red-500 text-red-500' : 'text-slate-600'
                  }`}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs animate-fadeIn">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>

              {isAuthenticated ? (
                <div className="group flex items-center">
                  {/* Sleek Circular Avatar Badge with Initial */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileError('');
                      setProfileSuccess('');
                      setIsProfileOpen(true);
                    }}
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/35 ring-2 ring-emerald-500/30 hover:ring-emerald-500/70 transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                    title={`${user?.name || 'Campus Student'} - Click to manage profile`}
                    aria-label="User Profile"
                  >
                    <span>
                      {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </span>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-xs"
                      title="Verified Student"
                    >
                      <Check className="w-2 h-2 stroke-[3]" />
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    type="button"
                    title="Sign Out"
                    className="opacity-0 -translate-x-2 w-0 p-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-0 group-hover:w-auto group-hover:p-2 group-hover:ml-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/login')
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-500/30 transition-all active:scale-95"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-700" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions Strip (scaled appropriately to fit a single row on mobile without overflow) */}
            <div className="flex md:hidden items-center gap-1.5">
              {/* Scaled Sell Button for mobile */}
              <Link
                to="/create"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-xs active:scale-95 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Sell</span>
              </Link>

              {/* Mobile Wishlist */}
              <button
                type="button"
                onClick={handleWishlistClick}
                className={`relative p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  isSavedActive ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:text-rose-600'
                }`}
                title={`Saved Items (${badgeCount})`}
                aria-label="Wishlist"
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isSavedActive || badgeCount > 0 ? 'fill-red-500 text-red-500' : 'text-slate-600'
                  }`}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </button>

              {/* Scaled Mobile Avatar (if authenticated) */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileError('');
                    setProfileSuccess('');
                    setIsProfileOpen(true);
                  }}
                  className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-xs flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                  title="Profile"
                  aria-label="Profile"
                >
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}</span>
                </button>
              )}

              {/* Hamburger Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer shrink-0"
                aria-label="Toggle Navigation"
              >
                {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2 shadow-xl">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setProfileError('');
                  setProfileSuccess('');
                  setIsProfileOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 mb-2 bg-slate-50 hover:bg-emerald-50/60 rounded-2xl transition-colors text-left border border-slate-200 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-slate-800 leading-tight">
                      {user?.name}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium leading-tight truncate">
                    {user?.college || user?.email}
                  </span>
                </div>
              </button>
            )}

            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                isActive('/')
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            <Link
              to="/create"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4 text-emerald-100" />
              Sell / Donate Item
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-listings"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive('/my-listings')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                My Listings
              </Link>
            )}

            <Link
              to="/saved"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600"
            >
              <div className="flex items-center gap-2.5">
                <Heart className={`w-4 h-4 ${badgeCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                <span>Saved Wishlist</span>
              </div>
              {badgeCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {badgeCount}
                </span>
              )}
            </Link>

            <div className="pt-3 mt-2 border-t border-slate-100">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({user?.name?.split(' ')[0]})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-900 bg-emerald-100 rounded-xl hover:bg-emerald-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Sleek "My Campus Profile" Modal */}
      {isProfileOpen && (
        <div
          onClick={() => setIsProfileOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-6 relative text-left"
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setIsProfileOpen(false)}
              type="button"
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header with Back Button */}
            <div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer group mb-2"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back</span>
              </button>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Student
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2">My Campus Profile</h3>
                <p className="text-xs text-slate-500">
                  Manage your student identity and contact information for peer trades.
                </p>
              </div>
            </div>

            {/* Profile Avatar Card */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/20 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-900 text-base truncate">
                  {user?.name || 'Student'}
                </h4>
                <div className="flex items-center gap-1 text-xs text-emerald-800 font-semibold truncate mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{user?.college || 'RJIT Tekanpur'}</span>
                </div>
              </div>
            </div>

            {/* Success and Error Alerts */}
            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Verified Institutional Email (Read-only) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Institutional Email
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium cursor-not-allowed select-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Locked to your college domain to safeguard student-only transactions.
                </p>
              </div>

              {/* College Name (Read-only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  College / Campus
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={user?.college || 'Rustamji Institute of Technology (RJIT)'}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Student Name (Editable) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* WhatsApp Contact Phone (Editable) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  WhatsApp Contact Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Campus buyers will use this number to message you on WhatsApp for handovers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
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
    </>
  );
};

export default Navbar;
