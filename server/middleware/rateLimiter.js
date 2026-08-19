const rateLimit = require('express-rate-limit');

// General rate limiter for standard API routes (300 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Strict rate limiter for sensitive authentication endpoints (15 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

// Refresh token rate limiter (60 requests per 15 minutes)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many refresh token attempts. Please try again later.',
    code: 'REFRESH_RATE_LIMIT_EXCEEDED',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  refreshLimiter,
};
