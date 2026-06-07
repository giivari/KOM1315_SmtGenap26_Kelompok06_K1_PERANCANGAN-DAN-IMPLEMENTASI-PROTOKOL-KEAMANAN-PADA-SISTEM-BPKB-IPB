const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

/**
 * GET /api/articles/:articleId/comments
 * List comments for an article (public)
 */
router.get('/', async (req, res) => {
  try {
    const articleId = parseInt(req.params.articleId);

    const comments = await prisma.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/articles/:articleId/comments
 * Add a comment to an article (authenticated users only)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const articleId = parseInt(req.params.articleId);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Komentar tidak boleh kosong.' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Komentar maksimal 1000 karakter.' });
    }

    // Check article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan.' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        articleId,
        userId: req.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/articles/:articleId/comments/:id
 * Delete a comment (owner or admin)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Komentar tidak ditemukan.' });
    }

    // Only owner or admin can delete
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Anda tidak memiliki izin untuk menghapus komentar ini.' });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: 'Komentar berhasil dihapus.' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
