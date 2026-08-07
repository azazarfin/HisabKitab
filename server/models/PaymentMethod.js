const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Payment method name is required'],
      trim: true,
      unique: true,
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

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
