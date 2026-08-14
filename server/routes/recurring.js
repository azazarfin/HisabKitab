const express = require('express');
const router = express.Router();
const RecurringExpense = require('../models/RecurringExpense');

// GET /api/recurring — list all, optionally filter by categoryId (user-scoped)
router.get('/', async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }

    const items = await RecurringExpense.find(filter)
      .populate('categoryId')
      .sort({ name: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/recurring — create
router.post('/', async (req, res) => {
  try {
    const { name, amount, categoryId, description } = req.body;
    const item = new RecurringExpense({ userId: req.user.id, name, amount, categoryId, description });
    const saved = await item.save();
    const populated = await saved.populate('categoryId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/recurring/:id — update
router.put('/:id', async (req, res) => {
  try {
    const item = await RecurringExpense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('categoryId');

    if (!item) {
      return res.status(404).json({ message: 'Recurring expense not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/recurring/:id — delete
router.delete('/:id', async (req, res) => {
  try {
    const item = await RecurringExpense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!item) {
      return res.status(404).json({ message: 'Recurring expense not found' });
    }

    res.json({ message: 'Recurring expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
