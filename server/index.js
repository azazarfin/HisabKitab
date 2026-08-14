const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');
const { smtpHealthCheck } = require('./utils/email');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Public Routes (no auth required)
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HisabKitab API is running' });
});

// Protected Routes (auth required)
app.use('/api/chapters', authMiddleware, require('./routes/chapters'));
app.use('/api/categories', authMiddleware, require('./routes/categories'));
app.use('/api/payment-methods', authMiddleware, require('./routes/paymentMethods'));
app.use('/api/transactions', authMiddleware, require('./routes/transactions'));
app.use('/api/recurring', authMiddleware, require('./routes/recurring'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Run SMTP health check (non-blocking)
  smtpHealthCheck().catch((err) => {
    console.error('❌ SMTP health check error:', err.message);
  });
});
