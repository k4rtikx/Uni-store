import rateLimit from 'express-rate-limit';

/**
 * Architectural Standard (ADR-003: Dual-Tier Rate Limiting - Global Tier)
 * Limits each IP to 150 requests per 15-minute window across all `/api` endpoints.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // 150 requests per window
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Architectural Standard (ADR-003: Dual-Tier Rate Limiting - Strict Auth Tier)
 * Limits each IP to 15 requests per 15-minute window on sensitive authentication endpoints
 * (such as /api/auth/login and /api/auth/register) to prevent brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts, please try again after 15 minutes.',
  },
});
