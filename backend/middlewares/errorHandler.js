/**
 * 404 Route Not Found Middleware
 * Intercepts requests for non-existent API endpoints and forwards a 404 error
 * to the global error handler.
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Centralized Error Handler Middleware
 * Normalizes Mongoose CastError, ValidationError, duplicate key (11000) errors,
 * JWT errors, and general unhandled exceptions into structured JSON responses
 * with appropriate HTTP status codes.
 */
export const errorHandler = (err, req, res, next) => {
  // If headers were already sent to the client, delegate to the default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode =
    err.statusCode ||
    err.status ||
    (res.statusCode === 200 ? 500 : res.statusCode || 500);
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Bad ObjectId / CastError (e.g., /api/listings/invalid-id)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with invalid identifier: ${err.value}`;
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
  }

  // Handle Mongoose Duplicate Key (E11000) Error
  if (err.code === 11000) {
    statusCode = 400;
    const fields = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate value entered${fields ? ` for field '${fields}'` : ''}. Please choose another value.`;
  }

  // Handle JWT verification failures if passed to next()
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authorization token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authorization token has expired';
  }

  // Handle Multer upload errors if passed to next()
  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = err.message || 'File upload failed';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export default errorHandler;
