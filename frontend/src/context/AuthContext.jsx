import React, { useState, useEffect } from 'react';
import {
  getMeApi,
  loginUserApi,
  registerUserApi,
  updateProfileApi,
} from '../services/api';
import { AuthContext } from './authContextInstance';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify initial user session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('reusecampus_token');
      if (token) {
        try {
          // Backend provides GET /api/auth/me (and /api/users/me)
          const res = await getMeApi();
          if (res.data?.success && res.data?.data) {
            setUser(res.data.data);
          } else {
            setUser(null);
          }
        } catch {
          localStorage.removeItem('reusecampus_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('reusecampus-auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('reusecampus-auth-expired', handleAuthExpired);
    };
  }, []);

  // Login handler accepting user data and JWT token
  const login = (userData, token) => {
    if (token) {
      localStorage.setItem('reusecampus_token', token);
    }
    setUser(userData);
  };

  // Helper to authenticate with credentials and unpack { success: true, data: { ... } }
  const loginUser = async (email, password) => {
    const res = await loginUserApi({ email, password });
    if (res.data?.success && res.data?.data) {
      const { token } = res.data.data;
      if (token) {
        localStorage.setItem('reusecampus_token', token);
      }
      setUser(res.data.data);
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to authenticate');
  };

  // Helper to register a new user and unpack { success: true, data: { ... } }
  const registerUser = async (userData) => {
    const res = await registerUserApi(userData);
    if (res.data?.success && res.data?.data) {
      const { token } = res.data.data;
      if (token) {
        localStorage.setItem('reusecampus_token', token);
      }
      setUser(res.data.data);
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to register account');
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('reusecampus_token');
    setUser(null);
  };

  // Update user profile helper (PUT /api/users/me)
  const updateProfile = async (profileData) => {
    const res = await updateProfileApi(profileData);
    if (res.data?.success && res.data?.data) {
      setUser((prev) => ({ ...prev, ...res.data.data }));
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to update profile');
  };

  // Update saved items helper to synchronize wishlist item IDs with User state
  const updateSavedItems = (savedItemIds) => {
    const cleanedIds = Array.isArray(savedItemIds)
      ? savedItemIds
          .map((item) => (typeof item === 'object' && item !== null ? String(item._id || item.id || '') : String(item)))
          .filter(Boolean)
      : [];
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        savedItems: cleanedIds,
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        loginUser,
        registerUser,
        logout,
        updateProfile,
        updateSavedItems,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

