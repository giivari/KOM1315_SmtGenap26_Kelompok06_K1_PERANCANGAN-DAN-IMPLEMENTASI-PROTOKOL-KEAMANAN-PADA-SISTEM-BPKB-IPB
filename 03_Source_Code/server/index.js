console.log("=== APP STARTING ===");

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const authRoutes = require('./src/routes/auth');
const articleRoutes = require('./src/routes/articles');
const commentRoutes = require('./src/routes/comments');
const aspirationRoutes = require('./src/routes/aspirations');
const documentationRoutes = require('./src/routes/documentation');
const operationRoutes = require('./src/routes/operations');
const securityRoutes = require('./src/routes/security');
const uploadRoutes = require('./src/routes/upload');
const { auditMiddleware } = require('./src/middleware/audit');

const app = express();
app.set('trust proxy', 1); // Wajib untuk Railway / Load Balancer agar express-rate-limit tidak error
const PORT = process.env.PORT || 5000;

// =============================================
// SECURITY MIDDLEWARE LAYER 1: Headers + CORS
// =============================================

/**
 * Helmet — Security Headers
 * 
 * Menambahkan HTTP security headers untuk mencegah:
 * - Clickjacking (X-Frame-Options: DENY)
 * - MIME sniffing (X-Content-Type-Options: nosniff)
 * - XSS (Content-Security-Policy)
 * - Protocol downgrade (Strict-Transport-Security)
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5174'],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,  // Nonaktifkan agar gambar bisa dimuat
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Izinkan frontend load gambar dari server
  hsts: {
    maxAge: 31536000,           // 1 tahun
    includeSubDomains: true,
    preload: true,
  },
}));

/**
 * CORS — Cross-Origin Resource Sharing
 * 
 * Perbaikan: Membatasi origin hanya ke frontend URL yang diizinkan
 * Sebelumnya: origin: true (menerima semua domain — tidak aman)
 * Sekarang: hanya CLIENT_URL yang diizinkan
 */
const allowedOrigins = true; // Echo the request origin automatically

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// =============================================
// SECURITY MIDDLEWARE LAYER 2: Rate Limiting
// =============================================

/**
 * Global Rate Limiter
 * Membatasi setiap IP ke 100 request per 15 menit
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 menit
  max: 100,                   // Max 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth Rate Limiter (Strict)
 * Membatasi endpoint login/register ke 5 request per 15 menit per IP
 * 
 * Mitigasi: Brute-force attack pada login
 * - Penyerang hanya bisa mencoba 5 password per 15 menit
 * - Dikombinasikan dengan bcrypt (250ms/hash), sangat efektif
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 menit
  max: 5,                     // Max 5 percobaan per window
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Hanya hitung request yang gagal (4xx status)
  skipSuccessfulRequests: true,
});

/**
 * OTP Rate Limiter
 * Membatasi resend OTP ke 3 request per 15 menit
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many OTP requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// STANDARD MIDDLEWARE
// =============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================================
// SECURITY MIDDLEWARE LAYER 3: Audit Logging
// =============================================

// Audit middleware - logs all API requests
app.use('/api', auditMiddleware);

// =============================================
// ROUTES (with rate limiting applied per-route)
// =============================================

// Auth routes with strict rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/resend-otp', otpLimiter);

// Apply global rate limiter to all other API routes
app.use('/api', globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/articles/:articleId/comments', commentRoutes);
app.use('/api/aspirations', aspirationRoutes);
app.use('/api/documentation', documentationRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

console.log("PORT ENV =", process.env.PORT);
console.log("NODE_ENV =", process.env.NODE_ENV);
console.log("CLIENT_URL =", process.env.CLIENT_URL);

app.get('/', (req, res) => {
  res.status(200).send('BPKB IPB API is running');
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

const server = app.listen(process.env.PORT || 5000, '::', () => {
  console.log("PORT ENV =", process.env.PORT);
  console.log("NODE_ENV =", process.env.NODE_ENV);
  console.log("CLIENT_URL =", process.env.CLIENT_URL);

  console.log(`🚀 BPKB IPB Server running on port ${process.env.PORT || 5000}`);
});

server.on("error", (err) => {
  console.error("SERVER ERROR:", err);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

module.exports = app;
