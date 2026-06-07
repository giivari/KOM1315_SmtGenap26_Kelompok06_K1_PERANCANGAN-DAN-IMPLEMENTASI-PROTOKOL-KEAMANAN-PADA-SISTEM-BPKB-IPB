const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Kunci rahasia 32 karakter (256-bit) untuk AES-256
// Di lingkungan produksi (production), variabel ini WAJIB ditaruh di dalam file .env
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'BpkbIpbSecretKeyUntukAes256Crypt';

/**
 * Fungsi bantuan untuk mengenkripsi IP Address menggunakan AES-256-CBC
 */
function encryptIP(ip) {
  if (!ip) return { encryptedData: null, iv: null };
  
  // Generate Initialization Vector (IV) acak sebesar 16 byte
  const iv = crypto.randomBytes(16); 
  
  // Buat objek cipher
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);
  
  // Lakukan enkripsi
  let encrypted = cipher.update(ip, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex')
  };
}

/**
 * Accounting / Audit Middleware
 * Logs every API request to the audit_logs table
 */
const auditMiddleware = async (req, res, next) => {
  // Skip logging for security dashboard reads to avoid noise
  const skipPaths = ['/api/security/', '/api/health'];
  const shouldSkip = skipPaths.some(p => req.originalUrl.startsWith(p));
  
  if (shouldSkip) {
    return next();
  }

  const startTime = Date.now();
  
  res.on('finish', async () => {
    try {
      const userId = req.user?.id || null;
      const action = `${req.method} ${req.path}`;
      const resource = req.path.split('/')[1] || 'unknown';
      const duration = Date.now() - startTime;
      
      // Tangkap IP Address asli
      const rawIp = req.ip || req.connection?.remoteAddress;
      
      // --- PROSES ENKRIPSI ---
      const { encryptedData, iv } = encryptIP(rawIp);
      // -----------------------
      
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
          ipAddress: encryptedData, // Disimpan sebagai Ciphertext (acak)
          ipAddressIv: iv,          // Disimpan agar bisa didekripsi nanti
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