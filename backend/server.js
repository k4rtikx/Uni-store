// 1. Load environment variables before ANY other imports (ES module standard)
import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env inside the backend directory is found regardless of where npm/node was initiated
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Application imports
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import mongoose from 'mongoose';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { globalApiLimiter } from './middlewares/rateLimiter.js';
import sanitizeInput from './middlewares/sanitizeMiddleware.js';

/**
 * Architectural Standard (ADR-004: Fail-Fast Environment Validation)
 * Checks for mandatory production environment variables before booting.
 * Throws and exits immediately with code 1 if critical configuration is missing,
 * avoiding corrupt, partially-booted, or insecure runtime states.
 */
const validateEnvironment = () => {
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'test') {
      console.warn(`[Environment] Test runner active. Missing non-test env vars: ${missing.join(', ')}`);
      return;
    }
    console.error(`[FATAL] Missing mandatory environment variables: ${missing.join(', ')}`);
    console.error('[FATAL] Please configure your .env file using backend/.env.example as a template.');
    process.exit(1);
  } else {
    console.log('[Environment] All mandatory environment variables validated successfully.');
  }
};

validateEnvironment();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// HTTP Security Headers (secures headers while allowing cross-origin image rendering)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: false,
  })
);

// Connect to MongoDB Database (bypassed in test environment for deterministic headless unit tests)
if (process.env.NODE_ENV !== 'test') {
  if (process.env.MONGO_URI) {
    connectDB();
  } else {
    console.log('[Database] MONGO_URI not set. Skipping initial MongoDB connection.');
  }
}

// Strict CORS Configuration (allowing only trusted frontend origins with restricted HTTP methods)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or automated test runners)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(
        (allowed) => origin === allowed || (origin && origin.replace(/\/$/, '') === allowed.replace(/\/$/, ''))
      );

      if (isAllowed || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  })
);

// Body Parsing Middlewares (increased limit to 10mb for student device photo uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// NoSQL Injection Protection Middleware (express-mongo-sanitize + in-house recursive key stripping)
app.use(sanitizeInput);

// Global API Rate Limiter (150 requests per 15 mins per IP on /api)
app.use('/api', globalApiLimiter);

// Health Check Endpoint (Deployment and uptime monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ReuseCampus API is running',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Server instance reference for graceful connection termination
let server = null;

// Start Server (only if not imported by automated test runners)
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[ReuseCampus Server] Running on http://localhost:${PORT}`);
  });
}

/**
 * Graceful Shutdown Handler
 * Intercepts termination signals (SIGTERM, SIGINT) and unhandled rejections:
 * 1. Closes HTTP server to stop accepting new client requests.
 * 2. Drains active in-flight requests cleanly within a 10s deadline.
 * 3. Gracefully closes the MongoDB Mongoose connection pool to prevent socket leaks.
 */
export const handleGracefulShutdown = (signal, exitCode = 0) => {
  console.log(`[Process] Received ${signal}. Initiating graceful shutdown sequence...`);

  // Force exit fallback timer in case connection draining hangs
  const forceExitTimer = setTimeout(() => {
    console.error('[Process] Graceful shutdown deadline exceeded (10s). Forcing process exit.');
    process.exit(1);
  }, 10000);

  if (forceExitTimer.unref) forceExitTimer.unref();

  const closeDatabase = async () => {
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log('[Database] Mongoose connection pool closed successfully.');
      }
    } catch (err) {
      console.error('[Database Error] Error during MongoDB disconnection:', err.message);
    }
  };

  if (server) {
    server.close(async () => {
      console.log('[HTTP Server] Closed all active client connections.');
      await closeDatabase();
      clearTimeout(forceExitTimer);
      console.log('[Process] Graceful shutdown completed cleanly. Bye!');
      process.exit(exitCode);
    });
  } else {
    closeDatabase().finally(() => {
      clearTimeout(forceExitTimer);
      process.exit(exitCode);
    });
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM', 0));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT', 0));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Promise Rejection at:', promise, 'reason:', reason);
  handleGracefulShutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught Exception thrown:', error);
  handleGracefulShutdown('uncaughtException', 1);
});

export { app, server };
export default app;
