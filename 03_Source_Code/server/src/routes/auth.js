const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { generateOTP, sendOTPEmail } = require('../utils/otp');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'user' },
      select: { id: true, name: true, email: true, role: true }
    });

    // Log auth event
    await prisma.authEvent.create({
      data: {
        userId: user.id,
        email: user.email,
        eventType: 'REGISTER',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    res.status(201).json({ message: 'Registration successful.', user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/login
 * Step 1: Validate email + password, then send OTP
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await prisma.authEvent.create({
        data: {
          email,
          eventType: 'LOGIN_FAILED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await prisma.authEvent.create({
        data: {
          userId: user.id,
          email,
          eventType: 'LOGIN_FAILED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Invalidate any existing unused OTPs
    await prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        expiresAt,
      }
    });

    // Send OTP via email
    try {
      await sendOTPEmail(user.email, otpCode, user.name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still return success - OTP is in the console for dev
    }

    // Log OTP sent event
    await prisma.authEvent.create({
      data: {
        userId: user.id,
        email: user.email,
        eventType: 'OTP_SENT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    // Create a temporary token (short-lived, just for OTP verification)
    const tempToken = jwt.sign(
      { userId: user.id, purpose: 'otp_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({
      message: 'OTP sent to your email.',
      otpRequired: true,
      tempToken,
      email: user.email,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Step 2: Verify OTP code and issue full JWT
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Temp token and OTP code are required.' });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired verification session.' });
    }

    if (decoded.purpose !== 'otp_verification') {
      return res.status(401).json({ error: 'Invalid token purpose.' });
    }

    const userId = decoded.userId;

    // Find the latest unused OTP for this user
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      await prisma.authEvent.create({
        data: {
          userId,
          eventType: 'OTP_FAILED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      });
      return res.status(401).json({ error: 'OTP expired or invalid. Please request a new one.' });
    }

    if (otpRecord.code !== code) {
      await prisma.authEvent.create({
        data: {
          userId,
          eventType: 'OTP_FAILED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      });
      return res.status(401).json({ error: 'Invalid OTP code.' });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    // Issue full JWT
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful events
    await prisma.authEvent.create({
      data: {
        userId: user.id,
        email: user.email,
        eventType: 'OTP_VERIFIED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    await prisma.authEvent.create({
      data: {
        userId: user.id,
        email: user.email,
        eventType: 'LOGIN_SUCCESS',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    res.json({
      message: 'Login successful.',
      accessToken,
      user,
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP code
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({ error: 'Temp token is required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired verification session.' });
    }

    const userId = decoded.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Invalidate existing OTPs
    await prisma.otpCode.updateMany({
      where: { userId, used: false },
      data: { used: true }
    });

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpCode.create({
      data: { userId, code: otpCode, expiresAt }
    });

    // Send OTP via email
    try {
      await sendOTPEmail(user.email, otpCode, user.name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    // Log event
    await prisma.authEvent.create({
      data: {
        userId,
        email: user.email,
        eventType: 'OTP_SENT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    res.json({ message: 'New OTP sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    await prisma.authEvent.create({
      data: {
        userId: req.user.id,
        email: req.user.email,
        eventType: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    });

    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
