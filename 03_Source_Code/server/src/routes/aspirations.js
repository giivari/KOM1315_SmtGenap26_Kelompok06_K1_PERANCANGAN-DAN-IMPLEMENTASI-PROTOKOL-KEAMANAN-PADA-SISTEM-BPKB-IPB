const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/aspirations
 * List all aspirations (public — shows resolved and in_progress)
 */
router.get('/', async (req, res) => {
  try {
    const aspirations = await prisma.aspiration.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });
    res.json(aspirations);
  } catch (error) {
    console.error('Get aspirations error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/aspirations/my
 * List aspirations submitted by the current user
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const aspirations = await prisma.aspiration.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(aspirations);
  } catch (error) {
    console.error('Get my aspirations error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/aspirations/all
 * List all aspirations (admin only)
 */
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const aspirations = await prisma.aspiration.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    res.json(aspirations);
  } catch (error) {
    console.error('Get all aspirations error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/aspirations
 * Submit a new aspiration/report (authenticated users)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, location, imagePath, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Judul, deskripsi, dan kategori wajib diisi.' });
    }

    const validCategories = ['laporan_kerusakan', 'pemborosan_energi', 'ide_penghijauan', 'lainnya'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Kategori tidak valid.' });
    }

    const aspiration = await prisma.aspiration.create({
      data: {
        title,
        description,
        category,
        location: location || null,
        imagePath: imagePath || null,
        priority: priority || 'normal',
        userId: req.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      message: 'Aspirasi berhasil dikirim.',
      aspiration,
    });
  } catch (error) {
    console.error('Create aspiration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/aspirations/:id/status
 * Update aspiration status (admin only)
 */
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }

    const aspiration = await prisma.aspiration.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!aspiration) {
      return res.status(404).json({ error: 'Aspirasi tidak ditemukan.' });
    }

    const updated = await prisma.aspiration.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        adminNote: adminNote || aspiration.adminNote,
        resolvedAt: status === 'resolved' ? new Date() : aspiration.resolvedAt,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({
      message: `Status aspirasi berhasil diubah menjadi "${status}".`,
      aspiration: updated,
    });
  } catch (error) {
    console.error('Update aspiration status error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/aspirations/:id
 * Delete aspiration (admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const aspiration = await prisma.aspiration.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!aspiration) {
      return res.status(404).json({ error: 'Aspirasi tidak ditemukan.' });
    }

    await prisma.aspiration.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Aspirasi berhasil dihapus.' });
  } catch (error) {
    console.error('Delete aspiration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
