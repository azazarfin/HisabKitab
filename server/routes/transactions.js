const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// GET /api/transactions?chapterId=xxx — list transactions for a chapter
router.get('/', async (req, res) => {
  try {
    const { chapterId } = req.query;

    if (!chapterId) {
      return res.status(400).json({ message: 'chapterId query param is required' });
    }

    const transactions = await Transaction.find({ chapterId })
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
    const transaction = new Transaction(req.body);
    const saved = await transaction.save();
    const populated = await saved.populate(['categoryId', 'paymentMethodId']);
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/transactions/:id — update a transaction
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(['categoryId', 'paymentMethodId']);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/transactions/:id — delete a transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
