const nodemailer = require('nodemailer');

/**
 * Generate a random 6-digit OTP code
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create email transporter
 * Uses Ethereal (fake SMTP) in development if no SMTP config is provided
 */
async function createTransporter() {
  // If SMTP config is provided, use it
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: create Ethereal test account (dev only)
  console.log('⚠️  No SMTP config found. Using Ethereal test email...');
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
 * @param {string} to - Recipient email address
 * @param {string} code - 6-digit OTP code
 * @param {string} userName - User's name for personalization
 */
async function sendOTPEmail(to, code, userName = 'User') {
  const transporter = await createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"BPKB IPB" <noreply@bpkb-ipb.ac.id>',
    to,
    subject: `🔐 Kode OTP Login BPKB IPB - ${code}`,
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

  const info = await transporter.sendMail(mailOptions);
  
  // Log preview URL for Ethereal (dev only)
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('📧 OTP Email Preview URL:', previewUrl);
  }
  
  console.log(`📨 OTP ${code} sent to ${to}`);
  return info;
}

module.exports = { generateOTP, sendOTPEmail };
