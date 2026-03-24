/**
 * PII encryption utility using Node.js built-in crypto.
 * Uses AES-256-GCM for authenticated encryption.
 * 
 * Requires ENCRYPTION_KEY env var (32-byte hex string, 64 hex chars).
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is required for PII encryption');
    }
    return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string.
 * @param {string} text - plaintext to encrypt
 * @returns {string} encrypted string in format: iv:authTag:ciphertext (all hex)
 */
export function encrypt(text) {
    if (!text) return text;
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string.
 * @param {string} encryptedText - encrypted string in format: iv:authTag:ciphertext
 * @returns {string} decrypted plaintext
 */
export function decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    const key = getKey();

    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText; // Not encrypted

    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
