const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Payment method name is required'],
      trim: true,
      maxlength: 50,
    },
    emoji: {
      type: String,
      default: '💳',
      maxlength: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Unique payment method name per user (not globally)
paymentMethodSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
