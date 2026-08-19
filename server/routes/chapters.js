const express = require('express');
const router = express.Router();
const Chapter = require('../models/Chapter');
const Transaction = require('../models/Transaction');
const { validateObjectId } = require('../middleware/validateObjectId');

// GET /api/chapters — list all chapters for the authenticated user
router.get('/', async (req, res) => {
  try {
    const chapters = await Chapter.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/chapters/:id — get single chapter (only if owned by user)
router.get('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const chapter = await Chapter.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/chapters — create new chapter
router.post('/', async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Chapter name is required' });
    }

    const chapter = new Chapter({
      userId: req.user.id,
      name: name.trim(),
      description: description ? String(description).trim() : '',
      startDate: startDate || null,
      endDate: endDate || null,
    });

    const saved = await chapter.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/chapters/:id/import/:sourceId — import transactions from another chapter
router.post('/:id/import/:sourceId', validateObjectId(['id', 'sourceId']), async (req, res) => {
  try {
    const { id: targetId, sourceId } = req.params;

    if (targetId === sourceId) {
      return res.status(400).json({ message: 'Cannot import a chapter into itself' });
    }

    const [targetChapter, sourceChapter] = await Promise.all([
      Chapter.findOne({ _id: targetId, userId: req.user.id }),
      Chapter.findOne({ _id: sourceId, userId: req.user.id }),
    ]);

    if (!targetChapter || !sourceChapter) {
      return res.status(404).json({ message: 'Target or source chapter not found' });
    }

    // Get all transactions from the source chapter (owned by this user)
    const sourceTransactions = await Transaction.find({
      chapterId: sourceId,
      userId: req.user.id,
    });

    // Create copies for the target chapter
    const newTransactions = sourceTransactions.map((t) => ({
      userId: req.user.id,
      type: t.type,
      amount: t.amount,
      chapterId: targetId,
      categoryId: t.categoryId,
      description: t.description,
      date: t.date || new Date(),
      paymentMethodId: t.paymentMethodId,
    }));

    if (newTransactions.length > 0) {
      await Transaction.insertMany(newTransactions);
    }

    res.json({
      message: `Imported ${newTransactions.length} transactions`,
      count: newTransactions.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/chapters/:id — update chapter (whitelisted fields only)
router.put('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const { name, description, startDate, endDate, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Chapter name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = String(description).trim();
    }
    if (startDate !== undefined) {
      updateData.startDate = startDate || null;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate || null;
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const chapter = await Chapter.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    res.json(chapter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/chapters/:id — delete chapter and its transactions
router.delete('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const chapter = await Chapter.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    // Also delete all transactions in this chapter belonging to this user
    await Transaction.deleteMany({ chapterId: req.params.id, userId: req.user.id });

    res.json({ message: 'Chapter and its transactions deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
