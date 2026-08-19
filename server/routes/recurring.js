const express = require('express');
const router = express.Router();
const RecurringExpense = require('../models/RecurringExpense');
const Category = require('../models/Category');
const { validateObjectId, isValidObjectId } = require('../middleware/validateObjectId');

// GET /api/recurring — list all, optionally filter by categoryId (user-scoped)
router.get('/', async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.categoryId) {
      if (!isValidObjectId(req.query.categoryId)) {
        return res.status(400).json({ message: 'Invalid categoryId parameter' });
      }
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

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ message: 'Valid positive amount is required' });
    }

    if (!categoryId || !isValidObjectId(categoryId)) {
      return res.status(400).json({ message: 'Valid categoryId is required' });
    }

    // Verify category ownership
    const category = await Category.findOne({ _id: categoryId, userId: req.user.id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found or does not belong to you' });
    }

    const item = new RecurringExpense({
      userId: req.user.id,
      name: name.trim(),
      amount: numAmount,
      categoryId,
      description: description ? String(description).trim() : '',
    });

    const saved = await item.save();
    const populated = await saved.populate('categoryId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/recurring/:id — update (whitelisted fields with category ownership validation)
router.put('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const { name, amount, categoryId, description } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      updateData.name = name.trim();
    }

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return res.status(400).json({ message: 'Valid positive amount is required' });
      }
      updateData.amount = numAmount;
    }

    if (categoryId !== undefined) {
      if (!isValidObjectId(categoryId)) {
        return res.status(400).json({ message: 'Valid categoryId is required' });
      }
      const category = await Category.findOne({ _id: categoryId, userId: req.user.id });
      if (!category) {
        return res.status(404).json({ message: 'Category not found or does not belong to you' });
      }
      updateData.categoryId = categoryId;
    }

    if (description !== undefined) {
      updateData.description = String(description).trim();
    }

    const item = await RecurringExpense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateData },
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
router.delete('/:id', validateObjectId(['id']), async (req, res) => {
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
