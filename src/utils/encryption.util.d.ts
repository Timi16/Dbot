/**
 * Encryption and Security Utilities
 * Handles PIN hashing, seed encryption, etc.
 */
/**
 * Hash a PIN using bcrypt
 * @param pin - 4-digit PIN
 * @returns Hashed PIN
 */
export declare function hashPin(pin: string): Promise<string>;
/**
 * Verify a PIN against its hash
 * @param pin - Plain PIN to verify
 * @param hash - Stored hash
 * @returns True if PIN matches
 */
export declare function verifyPin(pin: string, hash: string): Promise<boolean>;
/**
 * Validate PIN format (4 digits, not all same)
 * @param pin - PIN to validate
 * @returns True if valid
 */
export declare function isValidPin(pin: string): boolean;
/**
 * Generate a random salt for encryption
 * @returns 16-byte hex salt
 */
export declare function generateSalt(): string;
/**
 * Derive encryption key from PIN and salt using PBKDF2
 * @param pin - User's PIN
 * @param salt - Random salt
 * @param iterations - PBKDF2 iterations (default: 10000)
 * @returns Derived key
 */
export declare function deriveKey(pin: string, salt: string, iterations?: number): string;
/**
 * Encrypt seed phrase with user's PIN
 * @param seedPhrase - Mnemonic to encrypt
 * @param pin - User's PIN
 * @returns Object with encrypted seed and salt
 */
export declare function encryptSeed(seedPhrase: string, pin: string): {
    encrypted: string;
    salt: string;
};
/**
 * Decrypt seed phrase with user's PIN
 * @param encryptedSeed - Encrypted seed phrase
 * @param pin - User's PIN
 * @param salt - Salt used during encryption
 * @returns Decrypted seed phrase or null if invalid
 */
export declare function decryptSeed(encryptedSeed: string, pin: string, salt: string): string | null;
/**
 * Generate a secure random 4-digit PIN
 * @returns Random PIN
 */
export declare function generateRandomPin(): string;
/**
 * Mask sensitive data for logging
 * @param data - Sensitive string (seed, private key, etc.)
 * @param visibleChars - Number of chars to show at start and end
 * @returns Masked string
 */
export declare function maskSensitiveData(data: string, visibleChars?: number): string;
//# sourceMappingURL=encryption.util.d.ts.map