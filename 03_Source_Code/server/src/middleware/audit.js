const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Accounting / Audit Middleware
 * Logs every API request to the audit_logs table
 * Records: user, action (method + path), resource, IP, user agent, timestamp
 */
const auditMiddleware = async (req, res, next) => {
  // Skip logging for security dashboard reads to avoid noise
  const skipPaths = ['/api/security/', '/api/health'];
  const shouldSkip = skipPaths.some(p => req.originalUrl.startsWith(p));
  
  if (shouldSkip) {
    return next();
  }

  // Log after the response is sent
  const startTime = Date.now();
  
  res.on('finish', async () => {
    try {
      const userId = req.user?.id || null;
      const action = `${req.method} ${req.path}`;
      const resource = req.path.split('/')[1] || 'unknown';
      const duration = Date.now() - startTime;
      
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          details: JSON.stringify({
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
          }),
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'] || 'unknown',
        }
      });
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  });

  next();
};

/**
 * Remove sensitive fields from request body before logging
 */
function sanitizeBody(body) {
  if (!body) return undefined;
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'otp', 'code', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) sanitized[field] = '***REDACTED***';
  });
  return sanitized;
}

module.exports = { auditMiddleware };
