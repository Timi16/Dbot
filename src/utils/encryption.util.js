/**
 * Encryption and Security Utilities
 * Handles PIN hashing, seed encryption, etc.
 */
import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';
import { env } from '../config/index.js';
const SALT_ROUNDS = 12; // bcrypt rounds for PIN hashing
/**
 * Hash a PIN using bcrypt
 * @param pin - 4-digit PIN
 * @returns Hashed PIN
 */
export async function hashPin(pin) {
    if (!isValidPin(pin)) {
        throw new Error('Invalid PIN format. Must be 4 digits.');
    }
    return bcrypt.hash(pin, SALT_ROUNDS);
}
/**
 * Verify a PIN against its hash
 * @param pin - Plain PIN to verify
 * @param hash - Stored hash
 * @returns True if PIN matches
 */
export async function verifyPin(pin, hash) {
    if (!pin || !hash) {
        return false;
    }
    return bcrypt.compare(pin, hash);
}
/**
 * Validate PIN format (4 digits, not all same)
 * @param pin - PIN to validate
 * @returns True if valid
 */
export function isValidPin(pin) {
    // Must be exactly 4 digits
    if (!/^\d{4}$/.test(pin)) {
        return false;
    }
    // Cannot be all same digits (0000, 1111, etc.)
    if (/^(\d)\1{3}$/.test(pin)) {
        return false;
    }
    // Cannot be sequential (1234, 4321, etc.)
    const sequential = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'];
    if (sequential.includes(pin)) {
        return false;
    }
    return true;
}
/**
 * Generate a random salt for encryption
 * @returns 16-byte hex salt
 */
export function generateSalt() {
    return CryptoJS.lib.WordArray.random(16).toString();
}
/**
 * Derive encryption key from PIN and salt using PBKDF2
 * @param pin - User's PIN
 * @param salt - Random salt
 * @param iterations - PBKDF2 iterations (default: 10000)
 * @returns Derived key
 */
export function deriveKey(pin, salt, iterations = 10000) {
    const masterKey = env.ENCRYPTION_MASTER_KEY; // Additional layer of security
    const combinedSecret = `${pin}:${masterKey}`;
    return CryptoJS.PBKDF2(combinedSecret, CryptoJS.enc.Hex.parse(salt), {
        keySize: 256 / 32,
        iterations,
    }).toString();
}
/**
 * Encrypt seed phrase with user's PIN
 * @param seedPhrase - Mnemonic to encrypt
 * @param pin - User's PIN
 * @returns Object with encrypted seed and salt
 */
export function encryptSeed(seedPhrase, pin) {
    if (!seedPhrase || !pin) {
        throw new Error('Seed phrase and PIN are required');
    }
    const salt = generateSalt();
    const key = deriveKey(pin, salt);
    const encrypted = CryptoJS.AES.encrypt(seedPhrase, key).toString();
    return { encrypted, salt };
}
/**
 * Decrypt seed phrase with user's PIN
 * @param encryptedSeed - Encrypted seed phrase
 * @param pin - User's PIN
 * @param salt - Salt used during encryption
 * @returns Decrypted seed phrase or null if invalid
 */
export function decryptSeed(encryptedSeed, pin, salt) {
    if (!encryptedSeed || !pin || !salt) {
        return null;
    }
    try {
        const key = deriveKey(pin, salt);
        const bytes = CryptoJS.AES.decrypt(encryptedSeed, key);
        const seedPhrase = bytes.toString(CryptoJS.enc.Utf8);
        // Verify decryption was successful
        if (!seedPhrase || seedPhrase.trim().length === 0) {
            return null;
        }
        return seedPhrase;
    }
    catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
}
/**
 * Generate a secure random 4-digit PIN
 * @returns Random PIN
 */
export function generateRandomPin() {
    let pin;
    do {
        pin = Math.floor(1000 + Math.random() * 9000).toString();
    } while (!isValidPin(pin));
    return pin;
}
/**
 * Mask sensitive data for logging
 * @param data - Sensitive string (seed, private key, etc.)
 * @param visibleChars - Number of chars to show at start and end
 * @returns Masked string
 */
export function maskSensitiveData(data, visibleChars = 4) {
    if (!data || data.length <= visibleChars * 2) {
        return '***';
    }
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    return `${start}...${end}`;
}
//# sourceMappingURL=encryption.util.js.map