const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { hashSHA256, verifySHA256 } = require('./crypto');

/**
 * Generate a random 6-digit OTP code using CSPRNG
 * 
 * Perbaikan: Menggunakan crypto.randomInt() sebagai pengganti Math.random()
 * - crypto.randomInt() menggunakan Cryptographically Secure Pseudo-Random Number Generator
 * - Math.random() tidak dirancang untuk keamanan (predictable under certain conditions)
 * 
 * @returns {string} 6-digit OTP code (plaintext, untuk dikirim via email)
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash an OTP code using SHA-256 before storing in database
 * 
 * Mengapa hash OTP?
 * - Jika database bocor, penyerang tidak bisa melihat OTP plaintext yang masih valid
 * - SHA-256 cukup karena OTP sudah dilindungi oleh: single-use + expiry (5 menit)
 * 
 * @param {string} otpCode - Plaintext OTP code
 * @returns {string} SHA-256 hex hash
 */
function hashOTP(otpCode) {
  return hashSHA256(otpCode);
}

/**
 * Verify an OTP code against its stored hash
 * @param {string} inputCode - User's input OTP
 * @param {string} storedHash - SHA-256 hash from database
 * @returns {boolean} True if OTP matches
 */
function verifyOTP(inputCode, storedHash) {
  return verifySHA256(inputCode, storedHash);
}

/**
 * Create email transporter
 * 
 * Di production: WAJIB memiliki SMTP config, throw error jika tidak ada
 * Di development: Fallback ke Ethereal (fake SMTP) untuk testing
 */
async function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // If SMTP config is provided, use it
  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // Di production, SMTP credentials WAJIB ada
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SMTP credentials are required in production. ' +
      'Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.'
    );
  }

  // Fallback: create Ethereal test account (dev only)
  console.warn('⚠️  No SMTP config found. Using Ethereal test email (dev only)...');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

/**
 * Send OTP code via email
 * 
 * Keamanan:
 * - Parameter `to` harus diisi dari data User di database, BUKAN dari input request langsung
 * - OTP plaintext TIDAK di-log ke console di production
 * 
 * @param {string} to - Recipient email address (dari database User.email)
 * @param {string} code - 6-digit OTP code
 * @param {string} userName - User's name for personalization
 */
async function sendOTPEmail(to, code, userName = 'User') {
  let transporter;
  try {
    transporter = await createTransporter();
  } catch (err) {
    console.error('❌ Failed to create email transporter:', err.message);
    throw err; // Propagate error — caller HARUS handle ini
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"BPKB IPB" <noreply@bpkb-ipb.ac.id>',
    to,
    subject: `🔐 Kode OTP Login BPKB IPB`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #0B1E4D, #2D55AC); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">BPKB IPB University</h1>
          <p style="color: #93c5fd; margin: 5px 0 0;">Badan Pengembangan Kampus Berkelanjutan</p>
        </div>
        <div style="padding: 30px; background: white;">
          <h2 style="color: #0B1E4D; margin-top: 0;">Halo, ${userName}!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Kami menerima permintaan login ke akun Anda. Gunakan kode OTP berikut untuk melanjutkan:
          </p>
          <div style="background: linear-gradient(135deg, #0B1E4D, #1e3a8a); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
            <p style="color: #93c5fd; font-size: 14px; margin: 0 0 10px;">Kode Verifikasi Anda</p>
            <h1 style="color: white; font-size: 42px; letter-spacing: 12px; margin: 0; font-family: monospace;">${code}</h1>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            ⏰ Kode ini berlaku selama <strong>5 menit</strong>.<br>
            🔒 Jangan bagikan kode ini kepada siapapun.<br>
            ❌ Jika Anda tidak melakukan permintaan ini, abaikan email ini.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © 2026 BPKB IPB University. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Log preview URL for Ethereal (dev only)
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 OTP Email Preview URL:', previewUrl);
    }
    
    // KEAMANAN: Jangan log OTP plaintext, hanya log bahwa email terkirim
    console.log(`📨 OTP email sent to ${to}`);
    return info;
  } catch (sendError) {
    console.error(`❌ Failed to send OTP email to ${to}:`, sendError.message);
    throw sendError; // Propagate — caller harus tahu jika email gagal terkirim
  }
}

module.exports = { generateOTP, hashOTP, verifyOTP, sendOTPEmail };

