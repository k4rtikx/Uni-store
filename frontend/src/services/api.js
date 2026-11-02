import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('reusecampus_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Allow browser/axios to set proper multipart/form-data boundary for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle expired sessions and 401 Unauthorized errors cleanly
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Ignore 401s on auth credential and recovery endpoints
    const isAuthExempt =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (status === 401 && !isAuthExempt) {
      // Clear client session tokens
      localStorage.removeItem('reusecampus_token');
      localStorage.removeItem('reusecampus_user');

      // Dispatch global auth expiration event for React context synchronization
      window.dispatchEvent(new Event('reusecampus-auth-expired'));
    }

    return Promise.reject(error);
  }
);

/* ==========================================================================
   AUTHENTICATION & USER APIS
   ========================================================================== */

/**
 * Authenticate existing user with email and password
 * @param {Object|string} dataOrEmail - Credentials object { email, password } or email string
 * @param {string} [maybePassword] - Password string if first argument is email
 */
export const loginUser = async (dataOrEmail, maybePassword) => {
  const payload =
    typeof dataOrEmail === 'string'
      ? { email: dataOrEmail, password: maybePassword }
      : dataOrEmail;
  return API.post('/auth/login', payload);
};
export const loginUserApi = loginUser;

/**
 * Register a new RJIT campus user
 * @param {Object} userData - Registration payload
 */
export const registerUser = async (userData) => {
  return API.post('/auth/register', userData);
};
export const registerUserApi = registerUser;

/**
 * Retrieve currently authenticated user profile
 */
export const getMe = async () => {
  return API.get('/auth/me');
};
export const getMeApi = getMe;

/**
 * Request 6-digit OTP for password recovery
 * @param {string} identifier - Registered email or phone number
 */
export const forgotPassword = async (identifier) => {
  return API.post('/auth/forgot-password', { identifier });
};
export const forgotPasswordApi = forgotPassword;

/**
 * Verify 6-digit recovery OTP and retrieve short-lived reset token
 * @param {string} identifier - Registered email or phone
 * @param {string} otp - 6-digit OTP code
 */
export const verifyOtp = async (identifier, otp) => {
  return API.post('/auth/verify-otp', { identifier, otp });
};
export const verifyOtpApi = verifyOtp;

/**
 * Reset user password with verified reset token
 * @param {string} resetToken - Verified JWT token with password_reset purpose
 * @param {string} newPassword - New password (min 6 characters)
 */
export const resetPassword = async (resetToken, newPassword) => {
  return API.post('/auth/reset-password', { resetToken, newPassword });
};
export const resetPasswordApi = resetPassword;

/**
 * Update authenticated user's profile details
 * @param {Object} profileData - Profile updates { name, college, phone, avatar }
 */
export const updateProfile = async (profileData) => {
  return API.put('/users/me', profileData);
};
export const updateProfileApi = updateProfile;

/**
 * Retrieve saved listings (wishlist) for authenticated student with dead-reference cleanup
 */
export const getSavedItems = async () => {
  return API.get('/users/saved');
};
export const getSavedItemsApi = getSavedItems;
export const getWishlist = getSavedItems;
export const getWishlistApi = getSavedItems;

/**
 * Toggle saving/unsaving a listing for authenticated user
 * @param {string} id - Listing MongoDB ID
 */
export const toggleSaveItem = async (id) => {
  return API.post(`/users/saved/${id}`);
};
export const toggleSaveItemApi = toggleSaveItem;
export const toggleWishlistApi = toggleSaveItem;

/* ==========================================================================
   LISTINGS APIS
   ========================================================================== */

/**
 * Retrieve listings with search, filter, and pagination options
 * @param {Object} [params] - Query parameters
 */
export const getListings = async (params) => {
  return API.get('/listings', { params });
};
export const getListingsApi = getListings;

/**
 * Retrieve single listing by ID and increment views counter
 * @param {string} id - Listing MongoDB ID
 */
export const getListingById = async (id) => {
  return API.get(`/listings/${id}`);
};
export const getListingByIdApi = getListingById;

/**
 * Create a new campus listing (supports JSON or FormData with image file)
 * @param {FormData|Object} listingData
 */
export const createListing = async (listingData) => {
  return API.post('/listings', listingData);
};
export const createListingApi = createListing;

/**
 * Retrieve all listings created by authenticated user
 */
export const getMyListings = async () => {
  return API.get('/listings/my');
};
export const getMyListingsApi = getMyListings;

/**
 * Mark a listing as Sold
 * @param {string} id - Listing MongoDB ID
 */
export const markListingSold = async (id) => {
  return API.patch(`/listings/${id}/sell`);
};
export const markListingSoldApi = markListingSold;
export const markListingAsSold = markListingSold;

/**
 * Update listing status (Available / Sold)
 * @param {string} id - Listing MongoDB ID
 * @param {string} status - New status string
 */
export const updateListingStatus = async (id, status) => {
  return API.patch(`/listings/${id}/status`, { status });
};
export const updateListingStatusApi = updateListingStatus;

/**
 * Update existing listing details
 * @param {string} id - Listing MongoDB ID
 * @param {Object} listingData - Fields to update
 */
export const updateListing = async (id, listingData) => {
  return API.put(`/listings/${id}`, listingData);
};
export const updateListingApi = updateListing;

/**
 * Delete a listing permanently
 * @param {string} id - Listing MongoDB ID
 */
export const deleteListing = async (id) => {
  return API.delete(`/listings/${id}`);
};
export const deleteListingApi = deleteListing;

export { API };
export default API;
