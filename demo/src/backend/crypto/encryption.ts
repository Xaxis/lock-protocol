/**
 * Cryptographic Services for LOCK Protocol
 * Implements AES-256-GCM and ChaCha20-Poly1305 encryption
 */

import { randomBytes } from 'crypto';
import { 
  AES_KEY_LENGTH, 
  AES_IV_LENGTH, 
  AES_TAG_LENGTH,
  ENCRYPTION_ALGORITHMS 
} from '@shared/constants/protocol';

export interface EncryptedData {
  nonce: Uint8Array;
  ciphertext: Uint8Array;
  tag: Uint8Array;
  algorithm: string;
}

export interface KeyDerivationParams {
  password: string;
  salt?: Uint8Array;
  iterations?: number;
}

export class CryptoService {
  private defaultAlgorithm: string;

  constructor(defaultAlgorithm: string = ENCRYPTION_ALGORITHMS.AES_256_GCM) {
    this.defaultAlgorithm = defaultAlgorithm;
  }

  /**
   * Encrypts data using the specified algorithm
   */
  async encrypt(
    data: Uint8Array, 
    key?: Uint8Array,
    algorithm?: string
  ): Promise<EncryptedData> {
    const algo = algorithm || this.defaultAlgorithm;
    const encryptionKey = key || await this.generateKey();

    switch (algo) {
      case ENCRYPTION_ALGORITHMS.AES_256_GCM:
        return this.encryptAES256GCM(data, encryptionKey);
      
      case ENCRYPTION_ALGORITHMS.CHACHA20_POLY1305:
        return this.encryptChaCha20Poly1305(data, encryptionKey);
      
      default:
        throw new Error(`Unsupported encryption algorithm: ${algo}`);
    }
  }

  /**
   * Decrypts data using the specified algorithm
   */
  async decrypt(
    encryptedData: EncryptedData,
    key?: Uint8Array
  ): Promise<Uint8Array> {
    const decryptionKey = key || await this.generateKey();

    switch (encryptedData.algorithm) {
      case ENCRYPTION_ALGORITHMS.AES_256_GCM:
        return this.decryptAES256GCM(encryptedData, decryptionKey);
      
      case ENCRYPTION_ALGORITHMS.CHACHA20_POLY1305:
        return this.decryptChaCha20Poly1305(encryptedData, decryptionKey);
      
      default:
        throw new Error(`Unsupported decryption algorithm: ${encryptedData.algorithm}`);
    }
  }

  /**
   * Derives encryption key from password using PBKDF2
   */
  async deriveKey(params: KeyDerivationParams): Promise<Uint8Array> {
    const { password, salt = randomBytes(32), iterations = 100000 } = params;
    
    // Use Node.js crypto.pbkdf2 for key derivation
    const { pbkdf2 } = await import('crypto');
    const { promisify } = await import('util');
    const pbkdf2Async = promisify(pbkdf2);

    const derivedKey = await pbkdf2Async(
      password,
      salt,
      iterations,
      AES_KEY_LENGTH,
      'sha256'
    );

    return new Uint8Array(derivedKey);
  }

  /**
   * Derives key using ECDH + HKDF as specified in KEY_DERIVATION.md
   */
  async deriveKeyECDH(
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    info: string = 'LOCK-PROTOCOL-V1'
  ): Promise<Uint8Array> {
    // Import required crypto functions
    const { createECDH, createHash } = await import('crypto');
    
    // Create ECDH instance
    const ecdh = createECDH('secp256k1');
    ecdh.setPrivateKey(privateKey);
    
    // Compute shared secret
    const sharedSecret = ecdh.computeSecret(publicKey);
    
    // Apply HKDF-SHA256 for key derivation
    return this.hkdf(sharedSecret, AES_KEY_LENGTH, info);
  }

  /**
   * Generates a random encryption key
   */
  async generateKey(length: number = AES_KEY_LENGTH): Promise<Uint8Array> {
    return new Uint8Array(randomBytes(length));
  }

  /**
   * Generates a random nonce/IV
   */
  generateNonce(length: number = AES_IV_LENGTH): Uint8Array {
    return new Uint8Array(randomBytes(length));
  }

  /**
   * AES-256-GCM encryption implementation
   */
  private async encryptAES256GCM(
    data: Uint8Array,
    key: Uint8Array
  ): Promise<EncryptedData> {
    const crypto = await import('crypto');
    const nonce = this.generateNonce(AES_IV_LENGTH);

    // Use createCipheriv for GCM mode
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);

    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get the authentication tag
    const tag = cipher.getAuthTag();

    return {
      nonce,
      ciphertext: new Uint8Array(encrypted),
      tag: new Uint8Array(tag),
      algorithm: ENCRYPTION_ALGORITHMS.AES_256_GCM
    };
  }

  /**
   * AES-256-GCM decryption implementation
   */
  private async decryptAES256GCM(
    encryptedData: EncryptedData,
    key: Uint8Array
  ): Promise<Uint8Array> {
    const crypto = await import('crypto');

    // Ensure data is properly converted to Buffer (handle JSON deserialization)
    const nonce = this.ensureBuffer(encryptedData.nonce);
    const tag = this.ensureBuffer(encryptedData.tag);
    const ciphertext = this.ensureBuffer(encryptedData.ciphertext);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);

    // Set the authentication tag
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return new Uint8Array(decrypted);
  }

  /**
   * Ensures data is converted to Buffer, handling various input types
   */
  private ensureBuffer(data: any): Buffer {
    if (Buffer.isBuffer(data)) {
      return data;
    }
    if (data instanceof Uint8Array) {
      return Buffer.from(data);
    }
    if (Array.isArray(data)) {
      return Buffer.from(data);
    }
    if (typeof data === 'object' && data !== null) {
      // Handle objects with numeric keys (from JSON deserialization)
      const values = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b)).map(key => data[key]);
      return Buffer.from(values);
    }
    throw new Error(`Cannot convert data to Buffer: ${typeof data}`);
  }

  /**
   * ChaCha20-Poly1305 encryption implementation
   * Note: This is a simplified implementation for demo purposes
   */
  private async encryptChaCha20Poly1305(
    data: Uint8Array,
    key: Uint8Array
  ): Promise<EncryptedData> {
    // For demo purposes, fall back to AES-256-GCM
    // In production, implement proper ChaCha20-Poly1305
    console.warn('ChaCha20-Poly1305 not fully implemented, using AES-256-GCM');
    return this.encryptAES256GCM(data, key);
  }

  /**
   * ChaCha20-Poly1305 decryption implementation
   */
  private async decryptChaCha20Poly1305(
    encryptedData: EncryptedData,
    key: Uint8Array
  ): Promise<Uint8Array> {
    // For demo purposes, fall back to AES-256-GCM
    console.warn('ChaCha20-Poly1305 not fully implemented, using AES-256-GCM');
    return this.decryptAES256GCM(encryptedData, key);
  }

  /**
   * HKDF implementation for key derivation
   */
  private async hkdf(
    inputKeyMaterial: Buffer,
    length: number,
    info: string,
    salt?: Buffer
  ): Promise<Uint8Array> {
    const { createHmac, createHash } = await import('crypto');
    
    // Use empty salt if not provided
    const actualSalt = salt || Buffer.alloc(32);
    
    // Extract phase
    const prk = createHmac('sha256', actualSalt)
      .update(inputKeyMaterial)
      .digest();
    
    // Expand phase
    const infoBuffer = Buffer.from(info, 'utf8');
    const n = Math.ceil(length / 32); // SHA-256 output length
    let okm = Buffer.alloc(0);
    let t = Buffer.alloc(0);
    
    for (let i = 1; i <= n; i++) {
      const hmac = createHmac('sha256', prk);
      hmac.update(t);
      hmac.update(infoBuffer);
      hmac.update(Buffer.from([i]));
      t = hmac.digest();
      okm = Buffer.concat([okm, t]);
    }
    
    return new Uint8Array(okm.slice(0, length));
  }

  /**
   * Secure random number generation
   */
  generateSecureRandom(length: number): Uint8Array {
    return new Uint8Array(randomBytes(length));
  }

  /**
   * Hash data using SHA-256
   */
  async hash(data: Uint8Array): Promise<Uint8Array> {
    const { createHash } = await import('crypto');
    const hash = createHash('sha256');
    hash.update(data);
    return new Uint8Array(hash.digest());
  }

  /**
   * Verify data integrity using HMAC
   */
  async verifyHMAC(
    data: Uint8Array,
    key: Uint8Array,
    expectedHMAC: Uint8Array
  ): Promise<boolean> {
    const { createHmac } = await import('crypto');
    const hmac = createHmac('sha256', key);
    hmac.update(data);
    const computedHMAC = new Uint8Array(hmac.digest());
    
    // Constant-time comparison
    if (computedHMAC.length !== expectedHMAC.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < computedHMAC.length; i++) {
      result |= computedHMAC[i] ^ expectedHMAC[i];
    }
    
    return result === 0;
  }
}
