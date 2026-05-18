const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/articles
 * List published articles (public)
 */
router.get('/', async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      where: { isDraft: false },
      orderBy: { date: 'desc' },
    });
    res.json(articles);
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/articles/all
 * List all articles including drafts (admin only)
 */
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(articles);
  } catch (error) {
    console.error('Get all articles error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/articles/:id
 * Get article detail (public for published, admin for drafts)
 */
router.get('/:id', async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }
    res.json(article);
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/articles
 * Create article (admin only)
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, content, date, author, imagePath, isDraft } = req.body;

    if (!name || !content || !date) {
      return res.status(400).json({ error: 'Name, content, and date are required.' });
    }

    const article = await prisma.article.create({
      data: {
        name,
        content,
        date: new Date(date),
        author: author || null,
        imagePath: imagePath || null,
        isDraft: isDraft !== undefined ? isDraft : true,
      }
    });

    res.status(201).json(article);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/articles/:id
 * Update article (admin only)
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, content, date, author, imagePath, isDraft } = req.body;

    const article = await prisma.article.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        content,
        date: date ? new Date(date) : undefined,
        author,
        imagePath,
        isDraft,
      }
    });

    res.json(article);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/articles/:id
 * Delete article (admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.article.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Article deleted successfully.' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
