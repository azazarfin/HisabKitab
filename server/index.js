const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chapters', require('./routes/chapters'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/payment-methods', require('./routes/paymentMethods'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/recurring', require('./routes/recurring'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HisabKitab API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
