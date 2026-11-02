import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateListing from './pages/CreateListing';
import MyListings from './pages/MyListings';
import ListingDetails from './pages/ListingDetails';
import SavedItems from './pages/SavedItems';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import Scene3D from './components/three/Scene3D';

/** Pages fly in from depth with a 3D perspective swing on every route change. */
const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <div className="page-3d">
      <div key={location.pathname} className="page-3d-inner">
        {children}
      </div>
    </div>
  );
};

const CURRENT_YEAR = new Date().getFullYear();

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <Router>
          <div className="min-h-screen flex flex-col text-slate-900">

            {/* Fixed WebGL background — behind everything */}
            <Scene3D kind="background" />

            {/* Sticky frosted-glass navbar */}
            <Navbar />

            {/* Main routed content */}
            <main className="flex-1">
              <PageTransition>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/create"
                    element={
                      <ProtectedRoute>
                        <CreateListing />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-listings"
                    element={
                      <ProtectedRoute>
                        <MyListings />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/listings/:id" element={<ListingDetails />} />
                  <Route path="/listing/:id" element={<ListingDetails />} />
                  <Route path="/saved" element={<SavedItems />} />
                  <Route path="/wishlist" element={<SavedItems />} />
                  <Route path="/saved-items" element={<SavedItems />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </main>

            {/* Premium glass footer */}
            <footer className="border-t border-white/50 py-8 text-center text-xs text-slate-500 relative overflow-hidden">
              {/* Faint grid in footer */}
              <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="logo-3d w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xs shadow-md shadow-emerald-500/25">
                    R
                  </div>
                  <span className="font-black text-slate-800 tracking-tight">
                    Reuse<span className="text-emerald-600">Campus</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 font-medium hidden sm:inline">
                    Rustamji Institute of Technology (RJIT)
                  </span>
                </div>
                <p className="font-medium text-slate-500">
                  © {CURRENT_YEAR} ReuseCampus. Built for sustainable campus living.
                </p>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Live Marketplace
                  </span>
                  <span>RJIT Tekanpur</span>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
