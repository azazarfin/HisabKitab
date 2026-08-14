const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 50,
    },
    emoji: {
      type: String,
      default: '📦',
      maxlength: 10,
    },
    color: {
      type: String,
      default: '#64748b',
      maxlength: 20,
    },
  },
  {
    timestamps: true,
  }
);

// Unique category name per user (not globally)
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
