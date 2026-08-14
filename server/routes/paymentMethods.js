const express = require('express');
const router = express.Router();
const PaymentMethod = require('../models/PaymentMethod');

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
    const method = new PaymentMethod({ userId: req.user.id, name, emoji });
    const saved = await method.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A payment method with this name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/payment-methods/:id — update
router.put('/:id', async (req, res) => {
  try {
    const method = await PaymentMethod.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
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

// DELETE /api/payment-methods/:id — delete
router.delete('/:id', async (req, res) => {
  try {
    const method = await PaymentMethod.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    res.json({ message: 'Payment method deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
