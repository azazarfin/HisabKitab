const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const { smtpHealthCheck } = require('./utils/email');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Trust first proxy (Caddy / Nginx)
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP handled by Nginx proxy / SPA
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser with 1MB payload limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Health check endpoint (always accessible, before rate limiters/sanitizers)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HisabKitab API is running' });
});

// Sanitize against NoSQL injection (Express 5 compatible)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  next();
});

// Apply general API rate limiting to all /api routes
app.use('/api', apiLimiter);

// Public Routes (no auth required)
app.use('/api/auth', require('./routes/auth'));

// Protected Routes (auth required)
app.use('/api/chapters', authMiddleware, require('./routes/chapters'));
app.use('/api/categories', authMiddleware, require('./routes/categories'));
app.use('/api/payment-methods', authMiddleware, require('./routes/paymentMethods'));
app.use('/api/transactions', authMiddleware, require('./routes/transactions'));
app.use('/api/recurring', authMiddleware, require('./routes/recurring'));

// Global 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled application error:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Run SMTP health check (non-blocking, connection test only)
  smtpHealthCheck().catch((err) => {
    console.error('❌ SMTP health check error:', err.message);
  });
});

// ─── Graceful Shutdown ────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('✅ HTTP server closed.');
    try {
      await mongoose.connection.close(false);
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.error('❌ Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
