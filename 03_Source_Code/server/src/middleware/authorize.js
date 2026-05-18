const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Authorization Middleware (RBAC)
 * Checks if the authenticated user has one of the allowed roles
 * Logs all authorization decisions to authorization_events table
 * 
 * @param  {...string} allowedRoles - Roles allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    const userId = req.user?.id || null;
    const userRole = req.user?.role || 'anonymous';
    const route = req.originalUrl;
    const method = req.method;
    const allowed = allowedRoles.includes(userRole);

    // Log authorization event
    try {
      await prisma.authorizationEvent.create({
        data: {
          userId,
          route,
          method,
          role: userRole,
          allowed,
        }
      });
    } catch (logErr) {
      console.error('Failed to log authorization event:', logErr);
    }

    if (!allowed) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRole: allowedRoles,
        yourRole: userRole
      });
    }

    next();
  };
};

module.exports = { authorize };
