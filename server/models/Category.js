const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
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

module.exports = mongoose.model('Category', categorySchema);
