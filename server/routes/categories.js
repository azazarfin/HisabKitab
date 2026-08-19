const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const RecurringExpense = require('../models/RecurringExpense');
const { validateObjectId } = require('../middleware/validateObjectId');

// GET /api/categories — list all categories for the authenticated user
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/categories — create a new category
router.post('/', async (req, res) => {
  try {
    const { name, emoji, color } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = new Category({
      userId: req.user.id,
      name: name.trim(),
      emoji: emoji || '📦',
      color: color || '#64748b',
    });

    const saved = await category.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/categories/:id — update category (whitelisted fields)
router.put('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const { name, emoji, color } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Category name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    if (emoji !== undefined) updateData.emoji = String(emoji).trim();
    if (color !== undefined) updateData.color = String(color).trim();

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/categories/:id — delete category and clean up references
router.delete('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Set categoryId to null on existing transactions for this user
    await Transaction.updateMany(
      { categoryId: req.params.id, userId: req.user.id },
      { $set: { categoryId: null } }
    );

    // Delete recurring expenses tied to this deleted category
    await RecurringExpense.deleteMany({
      categoryId: req.params.id,
      userId: req.user.id,
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
