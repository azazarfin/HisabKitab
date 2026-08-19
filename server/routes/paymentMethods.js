const express = require('express');
const router = express.Router();
const PaymentMethod = require('../models/PaymentMethod');
const Transaction = require('../models/Transaction');
const { validateObjectId } = require('../middleware/validateObjectId');

// GET /api/payment-methods — list all for the authenticated user
router.get('/', async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ userId: req.user.id }).sort({ name: 1 });
    res.json(methods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/payment-methods — create
router.post('/', async (req, res) => {
  try {
    const { name, emoji } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Payment method name is required' });
    }

    const method = new PaymentMethod({
      userId: req.user.id,
      name: name.trim(),
      emoji: emoji || '💳',
    });

    const saved = await method.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A payment method with this name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/payment-methods/:id — update (whitelisted fields)
router.put('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const { name, emoji } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Payment method name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    if (emoji !== undefined) updateData.emoji = String(emoji).trim();

    const method = await PaymentMethod.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    res.json(method);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A payment method with this name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/payment-methods/:id — delete and clear transaction references
router.delete('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const method = await PaymentMethod.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    // Set paymentMethodId to null on transactions using this method
    await Transaction.updateMany(
      { paymentMethodId: req.params.id, userId: req.user.id },
      { $set: { paymentMethodId: null } }
    );

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
