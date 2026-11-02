/**
 * Higher-order function to wrap asynchronous Express route handlers
 * and forward any uncaught exceptions to the global error middleware.
 *
 * @param {Function} fn - Asynchronous route handler function with (req, res, next) signature
 * @returns {Function} Express middleware handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch((err) => {
    if (typeof next === 'function') {
      return next(err);
    }
    throw err;
  });
};

export default asyncHandler;

