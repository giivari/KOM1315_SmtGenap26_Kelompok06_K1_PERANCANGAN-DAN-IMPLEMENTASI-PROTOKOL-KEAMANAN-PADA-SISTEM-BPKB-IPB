const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/operations
 * Get all operations (public)
 */
router.get('/', async (req, res) => {
  try {
    const operations = await prisma.operation.findMany();
    res.json(operations);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/operations
 * Update operations (admin only)
 */
router.put('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body; // Array of { category, value }

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Expected array of updates.' });
    }

    const results = [];
    for (const item of updates) {
      const updated = await prisma.operation.updateMany({
        where: { category: item.category },
        data: { value: parseInt(item.value) }
      });
      results.push({ category: item.category, updated: updated.count });
    }

    res.json({ message: 'Operations updated.', results });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
