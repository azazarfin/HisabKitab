const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Recurring expense name is required'],
      trim: true,
      maxlength: 100,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient category-based queries
recurringExpenseSchema.index({ categoryId: 1 });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);
