const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto'); // Tambahkan modul crypto bawaan Node.js
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();
const prisma = new PrismaClient();

// Kunci rahasia harus sama persis dengan yang ada di audit.js
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'BpkbIpbSecretKeyUntukAes256Crypt';

/**
 * Fungsi bantuan untuk mendekripsi IP Address menggunakan AES-256-CBC
 */
function decryptIP(ciphertext, ivHex) {
  if (!ciphertext || !ivHex) return ciphertext; // Kembalikan nilai asli jika tidak terenkripsi
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(SECRET_KEY), 
      Buffer.from(ivHex, 'hex')
    );
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return 'Decryption Error';
  }
}

/**
 * GET /api/security/summary
 * Overview summary of all security events
 */
router.get('/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const totalAuthEvents = await prisma.authEvent.count({ where: { timestamp: { gte: thirtyDaysAgo } } });
    const todayAuthEvents = await prisma.authEvent.count({ where: { timestamp: { gte: today } } });
    const totalAuditLogs = await prisma.auditLog.count({ where: { timestamp: { gte: thirtyDaysAgo } } });
    const todayAuditLogs = await prisma.auditLog.count({ where: { timestamp: { gte: today } } });
    const totalAuthzEvents = await prisma.authorizationEvent.count({ where: { timestamp: { gte: thirtyDaysAgo } } });
    const deniedAuthzEvents = await prisma.authorizationEvent.count({ where: { allowed: false, timestamp: { gte: thirtyDaysAgo } } });
    const totalUsers = await prisma.user.count();

    res.json({
      totalAuthEvents,
      todayAuthEvents,
      totalAuditLogs,
      todayAuditLogs,
      totalAuthzEvents,
      deniedAuthzEvents,
      totalUsers,
    });
  } catch (error) {
    console.error('Security summary error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/security/auth-stats
 * Authentication statistics for charts
 */
router.get('/auth-stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = await prisma.authEvent.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      orderBy: { timestamp: 'asc' },
      select: { eventType: true, timestamp: true },
    });

    const dailyStats = {};
    events.forEach(event => {
      const day = event.timestamp.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = {
          date: day,
          LOGIN_SUCCESS: 0,
          LOGIN_FAILED: 0,
          OTP_SENT: 0,
          OTP_VERIFIED: 0,
          OTP_FAILED: 0,
          REGISTER: 0,
          LOGOUT: 0,
        };
      }
      if (dailyStats[day][event.eventType] !== undefined) {
        dailyStats[day][event.eventType]++;
      }
    });

    const totals = {};
    events.forEach(event => {
      totals[event.eventType] = (totals[event.eventType] || 0) + 1;
    });

    const recentEvents = await prisma.authEvent.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });

    // --- PROSES DEKRIPSI IP UNTUK RECENT AUTH EVENTS ---
    const decryptedRecentEvents = recentEvents.map(event => ({
      ...event,
      ipAddress: decryptIP(event.ipAddress, event.ipAddressIv)
    }));
    // --------------------------------------------------

    res.json({
      daily: Object.values(dailyStats),
      totals,
      recentEvents: decryptedRecentEvents,
    });
  } catch (error) {
    console.error('Auth stats error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/security/authz-stats
 * Authorization statistics for charts
 */
router.get('/authz-stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = await prisma.authorizationEvent.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      orderBy: { timestamp: 'asc' },
    });

    const routeStats = {};
    events.forEach(event => {
      const route = event.route.split('?')[0];
      if (!routeStats[route]) {
        routeStats[route] = { route, allowed: 0, denied: 0 };
      }
      if (event.allowed) {
        routeStats[route].allowed++;
      } else {
        routeStats[route].denied++;
      }
    });

    const roleStats = {};
    events.forEach(event => {
      const role = event.role || 'anonymous';
      if (!roleStats[role]) {
        roleStats[role] = { role, allowed: 0, denied: 0 };
      }
      if (event.allowed) {
        roleStats[role].allowed++;
      } else {
        roleStats[role].denied++;
      }
    });

    const dailyStats = {};
    events.forEach(event => {
      const day = event.timestamp.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { date: day, allowed: 0, denied: 0 };
      }
      if (event.allowed) {
        dailyStats[day].allowed++;
      } else {
        dailyStats[day].denied++;
      }
    });

    const recentEvents = await prisma.authorizationEvent.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });

    res.json({
      byRoute: Object.values(routeStats),
      byRole: Object.values(roleStats),
      daily: Object.values(dailyStats),
      recentEvents,
    });
  } catch (error) {
    console.error('Authz stats error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/security/audit-logs
 * Paginated audit logs
 */
router.get('/audit-logs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Catatan: Pencarian langsung menggunakan 'contains' pada ipAddress ciphertext database tidak akan akurat.
    // Filter pencarian di bawah dipertahankan agar fitur pencarian 'action' dan 'resource' tidak rusak.
    const where = search ? {
      OR: [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // --- PROSES DEKRIPSI IP UNTUK SETIAP BARIS LOG ---
    const decryptedLogs = logs.map(log => ({
      ...log,
      ipAddress: decryptIP(log.ipAddress, log.ipAddressIv)
    }));
    // -------------------------------------------------

    res.json({
      logs: decryptedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;