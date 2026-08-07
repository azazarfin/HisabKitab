const express = require('express');
const router = express.Router();
const Chapter = require('../models/Chapter');
const Transaction = require('../models/Transaction');

// GET /api/chapters — list all chapters
router.get('/', async (req, res) => {
  try {
    const chapters = await Chapter.find().sort({ createdAt: -1 });
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/chapters/:id — get single chapter
router.get('/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
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
    const chapter = new Chapter({ name, description, startDate, endDate });
    const saved = await chapter.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/chapters/:id/import/:sourceId — import transactions from another chapter
router.post('/:id/import/:sourceId', async (req, res) => {
  try {
    const targetChapter = await Chapter.findById(req.params.id);
    const sourceChapter = await Chapter.findById(req.params.sourceId);

    if (!targetChapter || !sourceChapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    // Get all transactions from the source chapter
    const sourceTransactions = await Transaction.find({ chapterId: req.params.sourceId });

    // Create copies for the target chapter
    const newTransactions = sourceTransactions.map((t) => ({
      type: t.type,
      amount: t.amount,
      chapterId: req.params.id,
      categoryId: t.categoryId,
      description: t.description,
      date: new Date(),
      paymentMethodId: t.paymentMethodId,
    }));

    if (newTransactions.length > 0) {
      await Transaction.insertMany(newTransactions);
    }

    res.json({ message: `Imported ${newTransactions.length} transactions`, count: newTransactions.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/chapters/:id — update chapter
router.put('/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    res.json(chapter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/chapters/:id — delete chapter and its transactions
router.delete('/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    // Also delete all transactions in this chapter
    await Transaction.deleteMany({ chapterId: req.params.id });

    res.json({ message: 'Chapter and its transactions deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
