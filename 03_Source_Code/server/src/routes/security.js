const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/security/summary
 * Overview summary of all security events
 */
router.get('/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalAuthEvents, todayAuthEvents, totalAuditLogs, todayAuditLogs, totalAuthzEvents, deniedAuthzEvents, totalUsers] = await Promise.all([
      prisma.authEvent.count({ where: { timestamp: { gte: thirtyDaysAgo } } }),
      prisma.authEvent.count({ where: { timestamp: { gte: today } } }),
      prisma.auditLog.count({ where: { timestamp: { gte: thirtyDaysAgo } } }),
      prisma.auditLog.count({ where: { timestamp: { gte: today } } }),
      prisma.authorizationEvent.count({ where: { timestamp: { gte: thirtyDaysAgo } } }),
      prisma.authorizationEvent.count({ where: { allowed: false, timestamp: { gte: thirtyDaysAgo } } }),
      prisma.user.count(),
    ]);

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

    // Get all auth events from last 30 days
    const events = await prisma.authEvent.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      orderBy: { timestamp: 'asc' },
      select: { eventType: true, timestamp: true },
    });

    // Group by day
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

    // Event type totals
    const totals = {};
    events.forEach(event => {
      totals[event.eventType] = (totals[event.eventType] || 0) + 1;
    });

    // Recent events
    const recentEvents = await prisma.authEvent.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });

    res.json({
      daily: Object.values(dailyStats),
      totals,
      recentEvents,
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

    // Group by route
    const routeStats = {};
    events.forEach(event => {
      const route = event.route.split('?')[0]; // Remove query params
      if (!routeStats[route]) {
        routeStats[route] = { route, allowed: 0, denied: 0 };
      }
      if (event.allowed) {
        routeStats[route].allowed++;
      } else {
        routeStats[route].denied++;
      }
    });

    // Group by role
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

    // Daily stats
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

    // Recent events
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

    const where = search ? {
      OR: [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
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

    res.json({
      logs,
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
