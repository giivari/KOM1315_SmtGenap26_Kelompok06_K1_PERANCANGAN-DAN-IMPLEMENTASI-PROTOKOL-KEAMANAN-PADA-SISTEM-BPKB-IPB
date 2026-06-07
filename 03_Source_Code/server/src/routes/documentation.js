const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { generateHash, signData } = require('../utils/crypto_rsa'); // Import fungsi RSA

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/documentation
 * List all documentation (public)
 */
router.get('/', async (req, res) => {
  try {
    const docs = await prisma.documentation.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/documentation/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const doc = await prisma.documentation.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!doc) return res.status(404).json({ error: 'Documentation not found.' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/documentation
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { description, date, photoPath } = req.body;
    if (!description || !date) {
      return res.status(400).json({ error: 'Description and date are required.' });
    }

    // --- PROSES TANDA TANGAN DIGITAL ---
    // 1. Gabungkan data penting yang ingin dijamin keasliannya
    const rawDataString = `${description}|${new Date(date).toISOString()}|${photoPath || ''}`;
    
    // 2. Buat Hash dan Signature
    const docHash = generateHash(rawDataString);
    const signature = signData(rawDataString);
    // -----------------------------------

    const doc = await prisma.documentation.create({
      data: {
        description,
        date: new Date(date),
        photoPath: photoPath || null,
        documentHash: docHash,           // Simpan Hash
        digitalSignature: signature      // Simpan Tanda Tangan
      }
    });
    res.status(201).json(doc);
  } catch (error) {
    console.error('Create documentation error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/documentation/:id
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { description, date, photoPath } = req.body;
    
    // Kita harus memastikan data yang ditandatangani adalah data terbaru
    const parsedDate = date ? new Date(date) : undefined;
    
    // Ambil data lama jika ada field yang tidak di-update oleh user
    const existingDoc = await prisma.documentation.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!existingDoc) {
      return res.status(404).json({ error: 'Documentation not found.' });
    }

    const finalDescription = description || existingDoc.description;
    const finalDate = parsedDate || existingDoc.date;
    const finalPhotoPath = photoPath !== undefined ? photoPath : existingDoc.photoPath;

    // --- PROSES PEMBARUAN TANDA TANGAN DIGITAL ---
    const rawDataString = `${finalDescription}|${finalDate.toISOString()}|${finalPhotoPath || ''}`;
    const docHash = generateHash(rawDataString);
    const signature = signData(rawDataString);
    // ---------------------------------------------

    const doc = await prisma.documentation.update({
      where: { id: parseInt(req.params.id) },
      data: {
        description: finalDescription,
        date: finalDate,
        photoPath: finalPhotoPath,
        documentHash: docHash,
        digitalSignature: signature
      }
    });
    res.json(doc);
  } catch (error) {
    console.error('Update documentation error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/documentation/:id
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.documentation.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Documentation deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;