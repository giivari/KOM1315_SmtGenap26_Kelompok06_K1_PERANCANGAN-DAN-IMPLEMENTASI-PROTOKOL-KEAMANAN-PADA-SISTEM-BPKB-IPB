const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// =============================================
// SHA-256 HASHING (untuk OTP)
// =============================================

/**
 * Hash a string using SHA-256
 * Used for OTP hashing before storing in database
 * 
 * Mengapa SHA-256 untuk OTP (bukan bcrypt)?
 * - OTP adalah string pendek (6 digit) dengan masa berlaku singkat (5 menit)
 * - Bcrypt terlalu lambat untuk OTP verification yang perlu cepat
 * - SHA-256 cukup karena OTP sudah memiliki proteksi: single-use + expiry
 * 
 * @param {string} text - The plaintext to hash
 * @returns {string} SHA-256 hex digest
 */
function hashSHA256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Verify a plaintext against a SHA-256 hash
 * @param {string} plaintext - The plaintext to verify
 * @param {string} hash - The stored SHA-256 hash
 * @returns {boolean} True if match
 */
function verifySHA256(plaintext, hash) {
  return hashSHA256(plaintext) === hash;
}

// =============================================
// AES-256-GCM ENCRYPTION (untuk Data at Rest)
// =============================================

const IV_LENGTH = 12; // GCM standard: 96 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Encrypt a string using AES-256-GCM
 * 
 * Mengapa GCM mode (bukan CBC)?
 * - GCM menyediakan Authenticated Encryption (enkripsi + integritas sekaligus)
 * - Tidak rentan terhadap Padding Oracle Attack (berbeda dengan CBC)
 * - Authentication Tag memastikan ciphertext tidak dimodifikasi
 * 
 * @param {string} text - Plaintext to encrypt
 * @param {string} encryptionKey - 32-byte hex key from .env
 * @returns {string} Format: iv:authTag:encryptedData (all hex)
 */
function encryptAES(text, encryptionKey) {
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables');
  }

  const key = Buffer.from(encryptionKey, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 * @param {string} encryptedText - Format: iv:authTag:encryptedData
 * @param {string} encryptionKey - 32-byte hex key from .env
 * @returns {string} Decrypted plaintext
 */
function decryptAES(encryptedText, encryptionKey) {
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables');
  }

  const key = Buffer.from(encryptionKey, 'hex');
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted text format. Expected iv:authTag:data');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// =============================================
// RSA-SHA256 DIGITAL SIGNATURE (untuk Admin Actions)
// =============================================

const CERTS_DIR = path.join(__dirname, '../../certs');

/**
 * Generate RSA key pair and save to certs/ directory
 * Only needs to be called once during setup
 */
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
  }

  fs.writeFileSync(path.join(CERTS_DIR, 'private.pem'), privateKey);
  fs.writeFileSync(path.join(CERTS_DIR, 'public.pem'), publicKey);

  console.log('🔑 RSA key pair generated in certs/ directory');
  return { publicKey, privateKey };
}

/**
 * Sign data with RSA-SHA256 private key
 * Used for critical admin actions (article publish, user management)
 * 
 * @param {object|string} data - Data to sign
 * @returns {string} Base64-encoded signature
 */
function signData(data) {
  const privateKeyPath = path.join(CERTS_DIR, 'private.pem');

  if (!fs.existsSync(privateKeyPath)) {
    console.warn('⚠️  No private key found. Generating new RSA key pair...');
    generateKeyPair();
  }

  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(typeof data === 'string' ? data : JSON.stringify(data));
  return signer.sign(privateKey, 'base64');
}

/**
 * Verify a digital signature with RSA-SHA256 public key
 * @param {object|string} data - Original data
 * @param {string} signature - Base64-encoded signature
 * @returns {boolean} True if signature is valid
 */
function verifySignature(data, signature) {
  const publicKeyPath = path.join(CERTS_DIR, 'public.pem');

  if (!fs.existsSync(publicKeyPath)) {
    throw new Error('Public key not found. Run generateKeyPair() first.');
  }

  const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(typeof data === 'string' ? data : JSON.stringify(data));
  return verifier.verify(publicKey, signature, 'base64');
}

/**
 * Generate a random encryption key (32 bytes = 256 bits)
 * Call once: node -e "require('./src/utils/crypto').generateEncryptionKey()"
 * @returns {string} 64-character hex string
 */
function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  console.log(`\n🔐 Generated ENCRYPTION_KEY: ${key}`);
  console.log('   Add this to your .env file.\n');
  return key;
}

module.exports = {
  // SHA-256
  hashSHA256,
  generateHash: hashSHA256,
  verifySHA256,
  // AES-256-GCM
  encryptAES,
  decryptAES,
  // RSA Digital Signature
  generateKeyPair,
  signData,
  verifySignature,
  // Utility
  generateEncryptionKey,
};
