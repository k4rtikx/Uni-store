import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, ShoppingBag } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/50 text-center space-y-6">
        {/* Glow compass icon */}
        <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60 shadow-sm">
          <Compass className="w-10 h-10 animate-pulse-subtle" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black tracking-widest uppercase text-emerald-600 bg-emerald-100/70 px-3 py-1 rounded-full">
            Error 404
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Lost on Campus?
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            The marketplace page or listing you are looking for does not exist, has been removed, or moved to a new block.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
          <Link
            to="/create"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-sm transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Post Item
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
