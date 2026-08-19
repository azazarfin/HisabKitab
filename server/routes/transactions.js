const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Chapter = require('../models/Chapter');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const { validateObjectId, isValidObjectId } = require('../middleware/validateObjectId');

// GET /api/transactions?chapterId=xxx — list transactions for a chapter (user-scoped)
router.get('/', async (req, res) => {
  try {
    const { chapterId, type, categoryId, paymentMethodId, startDate, endDate } = req.query;

    if (!chapterId) {
      return res.status(400).json({ message: 'chapterId query param is required' });
    }

    if (!isValidObjectId(chapterId)) {
      return res.status(400).json({ message: 'Invalid chapterId query parameter' });
    }

    const filter = { chapterId, userId: req.user.id };

    if (type && ['balance', 'expense'].includes(type)) {
      filter.type = type;
    }

    if (categoryId) {
      if (categoryId === 'null' || categoryId === 'uncategorized') {
        filter.categoryId = null;
      } else if (isValidObjectId(categoryId)) {
        filter.categoryId = categoryId;
      }
    }

    if (paymentMethodId && isValidObjectId(paymentMethodId)) {
      filter.paymentMethodId = paymentMethodId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) filter.date.$lte = end;
      }
      if (Object.keys(filter.date).length === 0) {
        delete filter.date;
      }
    }

    const transactions = await Transaction.find(filter)
      .populate('categoryId')
      .populate('paymentMethodId')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/transactions — create a transaction
router.post('/', async (req, res) => {
  try {
    const { type, amount, chapterId, categoryId, description, date, paymentMethodId } = req.body;

    if (!type || !['balance', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Valid transaction type (balance or expense) is required' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ message: 'Valid positive amount is required' });
    }

    if (!chapterId || !isValidObjectId(chapterId)) {
      return res.status(400).json({ message: 'Valid chapterId is required' });
    }

    // Verify Chapter ownership
    const chapter = await Chapter.findOne({ _id: chapterId, userId: req.user.id });
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found or does not belong to you' });
    }

    // Verify Category ownership if provided
    let verifiedCategoryId = null;
    if (categoryId) {
      if (!isValidObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid categoryId' });
      }
      const category = await Category.findOne({ _id: categoryId, userId: req.user.id });
      if (!category) {
        return res.status(404).json({ message: 'Category not found or does not belong to you' });
      }
      verifiedCategoryId = category._id;
    }

    // Verify PaymentMethod ownership if provided
    let verifiedPaymentMethodId = null;
    if (paymentMethodId) {
      if (!isValidObjectId(paymentMethodId)) {
        return res.status(400).json({ message: 'Invalid paymentMethodId' });
      }
      const paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, userId: req.user.id });
      if (!paymentMethod) {
        return res.status(404).json({ message: 'Payment method not found or does not belong to you' });
      }
      verifiedPaymentMethodId = paymentMethod._id;
    }

    const transaction = new Transaction({
      userId: req.user.id,
      type,
      amount: numAmount,
      chapterId,
      categoryId: verifiedCategoryId,
      description: description ? String(description).trim() : '',
      date: date ? new Date(date) : new Date(),
      paymentMethodId: verifiedPaymentMethodId,
    });

    const saved = await transaction.save();
    const populated = await saved.populate(['categoryId', 'paymentMethodId']);
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/transactions/:id — update a transaction (whitelisted fields + foreign key ownership)
router.put('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const { type, amount, chapterId, categoryId, description, date, paymentMethodId } = req.body;
    const updateData = {};

    if (type !== undefined) {
      if (!['balance', 'expense'].includes(type)) {
        return res.status(400).json({ message: 'Valid transaction type (balance or expense) is required' });
      }
      updateData.type = type;
    }

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return res.status(400).json({ message: 'Valid positive amount is required' });
      }
      updateData.amount = numAmount;
    }

    if (chapterId !== undefined) {
      if (!isValidObjectId(chapterId)) {
        return res.status(400).json({ message: 'Invalid chapterId' });
      }
      const chapter = await Chapter.findOne({ _id: chapterId, userId: req.user.id });
      if (!chapter) {
        return res.status(404).json({ message: 'Chapter not found or does not belong to you' });
      }
      updateData.chapterId = chapterId;
    }

    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === '') {
        updateData.categoryId = null;
      } else {
        if (!isValidObjectId(categoryId)) {
          return res.status(400).json({ message: 'Invalid categoryId' });
        }
        const category = await Category.findOne({ _id: categoryId, userId: req.user.id });
        if (!category) {
          return res.status(404).json({ message: 'Category not found or does not belong to you' });
        }
        updateData.categoryId = category._id;
      }
    }

    if (paymentMethodId !== undefined) {
      if (paymentMethodId === null || paymentMethodId === '') {
        updateData.paymentMethodId = null;
      } else {
        if (!isValidObjectId(paymentMethodId)) {
          return res.status(400).json({ message: 'Invalid paymentMethodId' });
        }
        const paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, userId: req.user.id });
        if (!paymentMethod) {
          return res.status(404).json({ message: 'Payment method not found or does not belong to you' });
        }
        updateData.paymentMethodId = paymentMethod._id;
      }
    }

    if (description !== undefined) {
      updateData.description = String(description).trim();
    }

    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(['categoryId', 'paymentMethodId']);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/transactions/:id — delete a transaction
router.delete('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
