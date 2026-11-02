import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusCircle,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
  UploadCloud,
  Camera,
  X,
  Link as LinkIcon,
  ArrowLeft,
} from 'lucide-react';
import { createListing } from '../services/api';
import useAuth from '../context/useAuth';

import { CATEGORIES, CONDITIONS } from '../constants/campusConstants';

// Preset sample images for quick testing
const imagePresets = [
  {
    name: 'Textbook',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Calculator',
    url: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Lab Coat',
    url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Study Lamp',
    url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Desk Chair',
    url: 'https://images.unsplash.com/photo-1580481077195-c3a82da91609?auto=format&fit=crop&w=600&q=80',
  },
];

const CreateListing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Books',
    condition: 'Good',
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [isFreeDonation, setIsFreeDonation] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  // Device file upload handler with instant preview
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setErrorMessage('');
    setImageFile(file);
    setImageFileName(file.name);

    // Generate local preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSelectPreset = (url, name) => {
    setImageFile(null);
    setPreviewUrl('');
    setFormData((prev) => ({ ...prev, imageUrl: url }));
    setImageFileName(`${name} Preset Photo`);
    if (errorMessage) setErrorMessage('');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl('');
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setImageFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isAuthenticated) {
      setErrorMessage('You must be signed in with your college account to publish a listing.');
      return;
    }

    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();
    const numPrice = isFreeDonation ? 0 : Number(formData.price);

    if (!trimmedTitle) {
      setErrorMessage('Please provide an item title (cannot be whitespace only).');
      return;
    }

    if (!trimmedDescription) {
      setErrorMessage('Please provide an item description.');
      return;
    }

    if (!isFreeDonation && (formData.price === '' || isNaN(numPrice) || numPrice < 0)) {
      setErrorMessage('Price cannot be negative. Set ₹0 for free giveaways.');
      return;
    }

    if (!imageFile && !formData.imageUrl.trim()) {
      setErrorMessage('Please select an item photo file or provide an image.');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', trimmedTitle);
      submitData.append('description', trimmedDescription);
      submitData.append('price', numPrice);
      submitData.append('category', formData.category);
      submitData.append('condition', formData.condition);

      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.imageUrl.trim()) {
        submitData.append('imageUrl', formData.imageUrl.trim());
      }

      const res = await createListing(submitData);

      if (res.data?.success) {
        setSuccessMessage('Listing published successfully! Redirecting...');
        setTimeout(() => {
          navigate('/my-listings');
        }, 1200);
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Failed to create listing. Please check your inputs.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 sm:py-10 relative">
      {/* Subtle ambient glows */}
      <div className="absolute top-10 -left-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-16 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/80 shadow-2xl shadow-slate-900/5 space-y-8 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer group"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-emerald-600" />
              <span>Back</span>
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              Sell or Donate to Students
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Create a New Campus Listing
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Fill out the details below so students on your campus can find and buy your item.
          </p>
        </div>

        {!isAuthenticated && (
          <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="font-medium">You must be signed in to publish items.</span>
            </div>
            <Link
              to="/login"
              state={{ from: { pathname: '/create' } }}
              className="px-4 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-sm"
            >
              Sign In First
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-medium animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Item Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Thomas Calculus 14th Edition with Solution Manual"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all"
            />
          </div>

          {/* Category & Condition Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Condition *
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all cursor-pointer"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Free Donation to Junior Toggle & Price */}
          <div className="space-y-3">
            {/* Prominent Free Donation Checkbox */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl transition-all">
              <label htmlFor="create-free-donation-toggle" className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  id="create-free-donation-toggle"
                  type="checkbox"
                  checked={isFreeDonation}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsFreeDonation(checked);
                    setFormData((prev) => ({
                      ...prev,
                      price: checked ? '0' : '',
                    }));
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                />
                <div>
                  <span className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    🎁 Donate this item for FREE to a Junior (₹0)
                  </span>
                  <p className="text-[11px] text-emerald-700">
                    Give back to your campus community by passing down textbooks, notes, or lab gear without charge.
                  </p>
                </div>
              </label>

              {isFreeDonation && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm shrink-0">
                  FREE GIVEAWAY
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Price (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={isFreeDonation}
                  placeholder={isFreeDonation ? '0 (Free Donation to Juniors)' : '0 (Set 0 for free giveaway)'}
                  min="0"
                  required={!isFreeDonation}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-mono transition-all ${
                    isFreeDonation
                      ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800 font-bold cursor-not-allowed'
                      : 'border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Item Photo Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Item Photo *
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                {showUrlInput ? 'Hide URL paste' : 'Or paste image URL'}
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="device-photo-input"
            />

            {/* Photo Selection Card or Live Preview */}
            {!previewUrl && !formData.imageUrl ? (
              <label
                htmlFor="device-photo-input"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-2xl cursor-pointer transition-all group text-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Upload Item Photo from Device
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click to browse (PNG, JPG, JPEG, WEBP — auto-optimized via Cloudinary)
                  </p>
                </div>
              </label>
            ) : (
              /* Live Preview Card */
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100">
                <div className="relative h-56 w-full">
                  <img
                    src={previewUrl || formData.imageUrl}
                    alt="Item Preview"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
                      title="Remove Photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="text-xs font-medium bg-slate-900/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      {imageFileName || 'Item Photo Ready'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Optional URL input fallback */}
            {showUrlInput && (
              <div className="pt-2 animate-fadeIn">
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    handleChange(e);
                    setImageFile(null);
                    setPreviewUrl('');
                    if (e.target.value) {
                      setImageFileName('Custom Image URL');
                    }
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
                />
              </div>
            )}

            {/* Quick Image Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Or pick a sample campus photo:
              </span>
              <div className="flex flex-wrap gap-2">
                {imagePresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url, preset.name)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-slate-600 font-medium transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Item Description *
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what condition the item is in, any markings, reason for selling, and where you can meet on campus (e.g. Student Union or Library)..."
              required
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isAuthenticated}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-95 text-base cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing Listing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Publish Listing
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
