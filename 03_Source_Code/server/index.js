const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const articleRoutes = require('./src/routes/articles');
const documentationRoutes = require('./src/routes/documentation');
const operationRoutes = require('./src/routes/operations');
const securityRoutes = require('./src/routes/security');
const uploadRoutes = require('./src/routes/upload');
const { auditMiddleware } = require('./src/middleware/audit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Audit middleware - logs all API requests
app.use('/api', auditMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/documentation', documentationRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 BPKB IPB Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🌐 Client: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

module.exports = app;
