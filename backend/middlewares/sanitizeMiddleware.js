import mongoSanitize from 'express-mongo-sanitize';

/**
 * Architectural Standard (ADR-003: Multi-Layer NoSQL Query Sanitizer)
 * Combines express-mongo-sanitize with custom recursive key stripping:
 * 1. Sanitizes MongoDB query operators ($) and dot-notation paths (.)
 * 2. Express 5 compatible (safely mutates in-place without illegal assignment to req.query getter)
 * 3. Preserves legitimate string values like emails, passwords, and Base64 images
 */

export const sanitizeKeys = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = sanitizeKeys(obj[i]);
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    // If the key starts with '$' (Mongo operator) or contains '.' (nested path operator)
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      obj[key] = sanitizeKeys(obj[key]);
    }
  }

  return obj;
};

export const sanitizeInput = (req, res, next) => {
  // Layer 1: express-mongo-sanitize in-place sanitization
  if (req.body && typeof req.body === 'object') {
    mongoSanitize.sanitize(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    mongoSanitize.sanitize(req.params);
  }
  if (req.query && typeof req.query === 'object') {
    mongoSanitize.sanitize(req.query);
  }

  // Layer 2: Custom recursive operator & dot-notation stripping
  if (req.body) sanitizeKeys(req.body);
  if (req.query) sanitizeKeys(req.query);
  if (req.params) sanitizeKeys(req.params);

  next();
};

export default sanitizeInput;
