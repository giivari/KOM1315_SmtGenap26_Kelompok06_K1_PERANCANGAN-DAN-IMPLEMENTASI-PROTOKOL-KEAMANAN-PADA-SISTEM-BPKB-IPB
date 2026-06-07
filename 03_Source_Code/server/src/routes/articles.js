const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/articles
 * List published articles (public)
 * Returns articles that are approved OR published (isDraft=false) for backward compatibility
 */
router.get('/', async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { status: 'approved', isDraft: false },
          { status: 'draft', isDraft: false }, // backward compat: old published articles
        ]
      },
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
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      }
    });
    res.json(articles);
  } catch (error) {
    console.error('Get all articles error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/articles/pending
 * List pending articles waiting for admin review
 */
router.get('/pending', authenticate, authorize('admin'), async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
      }
    });
    res.json(articles);
  } catch (error) {
    console.error('Get pending articles error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/articles/my-submissions
 * List articles submitted by the current user
 */
router.get('/my-submissions', authenticate, async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      where: { submittedBy: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(articles);
  } catch (error) {
    console.error('Get my submissions error:', error);
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
      where: { id: parseInt(req.params.id) },
      include: {
        submitter: { select: { id: true, name: true } },
      }
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
        status: isDraft === false ? 'approved' : 'draft',
      }
    });

    res.status(201).json(article);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/articles/submit
 * User submits an article for review
 */
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { name, content, imagePath } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Judul dan konten artikel wajib diisi.' });
    }

    const article = await prisma.article.create({
      data: {
        name,
        content,
        date: new Date(),
        author: req.user.name,
        imagePath: imagePath || null,
        isDraft: true,
        status: 'pending',
        submittedBy: req.user.id,
      }
    });

    res.status(201).json({
      message: 'Artikel berhasil disubmit dan sedang menunggu review admin.',
      article,
    });
  } catch (error) {
    console.error('Submit article error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/articles/:id/review
 * Admin approves or rejects a user-submitted article
 */
router.put('/:id/review', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { action, reviewNote } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject".' });
    }

    const article = await prisma.article.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    if (article.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending articles can be reviewed.' });
    }

    const updated = await prisma.article.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        isDraft: action === 'approve' ? false : true,
        reviewedBy: req.user.id,
        reviewNote: reviewNote || null,
      }
    });

    res.json({
      message: `Article ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      article: updated,
    });
  } catch (error) {
    console.error('Review article error:', error);
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
        status: isDraft === false ? 'approved' : 'draft',
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
