const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET /api/categories — list all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/categories — create a new category
router.post('/', async (req, res) => {
  try {
    const { name, emoji, color } = req.body;
    const category = new Category({ name, emoji, color });
    const saved = await category.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/categories/:id — update category
router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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

// DELETE /api/categories/:id — delete category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
