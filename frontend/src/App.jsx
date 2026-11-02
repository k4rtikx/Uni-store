import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

const CURRENT_YEAR = new Date().getFullYear();

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          {/* Responsive Navigation Bar */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1">
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
          </main>

          {/* Luxury Minimal Footer */}
          <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  R
                </div>
                <span className="font-bold text-slate-800">ReuseCampus</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500 font-medium">Rustamji Institute of Technology (RJIT)</span>
              </div>
              <p className="font-medium text-slate-500">© {CURRENT_YEAR} ReuseCampus. Built for sustainable campus living.</p>
            </div>
          </footer>
        </div>
      </Router>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
