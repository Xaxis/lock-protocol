/**
 * LOCK Protocol Constants
 * Based on the protocol specifications
 */

// SEAL File Format Constants
export const SEAL_MAGIC = 'SEAL';
export const SEAL_VERSION = 1;
export const SEAL_EXTENSION = '.seal';

// Supported Encryption Algorithms
export const ENCRYPTION_ALGORITHMS = {
  AES_256_GCM: 'AES-256-GCM',
  CHACHA20_POLY1305: 'ChaCha20-Poly1305'
} as const;

// Default encryption algorithm (required by spec)
export const DEFAULT_ENCRYPTION_ALGORITHM = ENCRYPTION_ALGORITHMS.AES_256_GCM;

// Cryptographic Constants
export const AES_KEY_LENGTH = 32; // 256 bits
export const AES_IV_LENGTH = 12;  // 96 bits for GCM
export const AES_TAG_LENGTH = 16; // 128 bits

export const CHACHA20_KEY_LENGTH = 32; // 256 bits
export const CHACHA20_NONCE_LENGTH = 12; // 96 bits
export const POLY1305_TAG_LENGTH = 16; // 128 bits

// Bitcoin Constants
export const BITCOIN_NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet'
} as const;

export const SATOSHIS_PER_BTC = 100_000_000;
export const MIN_TRANSACTION_FEE = 1000; // 1000 satoshis minimum fee
export const DUST_THRESHOLD = 546; // Bitcoin dust threshold

// Vault Status Constants
export const VAULT_STATUS = {
  DRAFT: 'draft',
  BOUND: 'bound', 
  ACTIVE: 'active',
  EXPIRED: 'expired',
  EXHAUSTED: 'exhausted'
} as const;

// Amount Condition Types
export const AMOUNT_CONDITION_TYPES = {
  FIXED: 'fixed',
  RANGE: 'range',
  ANY: 'any'
} as const;

// Metadata Visibility Options
export const METADATA_VISIBILITY = {
  ENCRYPTED: 'encrypted',
  PLAINTEXT: 'plaintext'
} as const;

// Protocol Validation Constants
export const MAX_VAULT_SIZE = 100 * 1024 * 1024; // 100MB max vault size
export const MAX_METADATA_SIZE = 64 * 1024; // 64KB max metadata size
export const MAX_FILES_PER_VAULT = 100; // Maximum files per vault

export const MIN_UNLOCK_AMOUNT = 1000; // Minimum 1000 satoshis
export const MAX_UNLOCK_AMOUNT = 21_000_000 * SATOSHIS_PER_BTC; // 21M BTC max

export const MAX_UNLOCK_LIMIT = 1_000_000; // Maximum unlock attempts
export const MAX_TIME_LOCK = 1_000_000; // Maximum block height for time-lock

// API Constants
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  VAULT_CREATION: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10
  },
  UNLOCK_ATTEMPTS: {
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    MAX_REQUESTS: 20
  }
} as const;

// Error Codes
export const ERROR_CODES = {
  // Validation Errors
  INVALID_VAULT_ID: 'INVALID_VAULT_ID',
  INVALID_TRANSACTION: 'INVALID_TRANSACTION',
  INVALID_METADATA: 'INVALID_METADATA',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_WALLET: 'INVALID_WALLET',
  
  // Protocol Errors
  VAULT_NOT_FOUND: 'VAULT_NOT_FOUND',
  VAULT_NOT_BOUND: 'VAULT_NOT_BOUND',
  VAULT_EXHAUSTED: 'VAULT_EXHAUSTED',
  VAULT_TIME_LOCKED: 'VAULT_TIME_LOCKED',
  
  // Access Errors
  UNAUTHORIZED_WALLET: 'UNAUTHORIZED_WALLET',
  INSUFFICIENT_AMOUNT: 'INSUFFICIENT_AMOUNT',
  UNLOCK_LIMIT_EXCEEDED: 'UNLOCK_LIMIT_EXCEEDED',
  
  // Bitcoin Errors
  TRANSACTION_NOT_CONFIRMED: 'TRANSACTION_NOT_CONFIRMED',
  TRANSACTION_INVALID: 'TRANSACTION_INVALID',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  
  // System Errors
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

// File Type Constants
export const SUPPORTED_FILE_TYPES = [
  'text/plain',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/json',
  'application/zip',
  'application/octet-stream'
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file

// Wallet Integration Constants
export const WALLET_TYPES = {
  BROWSER: 'browser',
  HARDWARE: 'hardware',
  MOBILE: 'mobile'
} as const;

// WebSocket Event Types
export const WS_EVENTS = {
  VAULT_STATUS_UPDATE: 'vault_status_update',
  TRANSACTION_UPDATE: 'transaction_update',
  UNLOCK_ATTEMPT: 'unlock_attempt',
  ERROR: 'error'
} as const;

// Key Derivation Constants (HKDF)
export const HKDF_SALT_LENGTH = 32;
export const HKDF_INFO = 'LOCK-PROTOCOL-V1';
export const HKDF_ITERATIONS = 100_000;

// Vault ID Generation
export const VAULT_ID_LENGTH = 64; // SHA-256 hex string length

// Default Configuration Values
export const DEFAULT_CONFIG = {
  NETWORK: BITCOIN_NETWORKS.TESTNET,
  ENCRYPTION_ALGORITHM: DEFAULT_ENCRYPTION_ALGORITHM,
  METADATA_VISIBILITY: METADATA_VISIBILITY.ENCRYPTED,
  UNLOCK_LIMIT: 1, // Single-use by default
  MIN_CONFIRMATIONS: 1
} as const;

// Protocol Version
export const PROTOCOL_VERSION = '1.1';

// Export all constants as a single object for convenience
export const LOCK_CONSTANTS = {
  SEAL_MAGIC,
  SEAL_VERSION,
  SEAL_EXTENSION,
  ENCRYPTION_ALGORITHMS,
  DEFAULT_ENCRYPTION_ALGORITHM,
  BITCOIN_NETWORKS,
  VAULT_STATUS,
  AMOUNT_CONDITION_TYPES,
  METADATA_VISIBILITY,
  ERROR_CODES,
  WS_EVENTS,
  PROTOCOL_VERSION
} as const;
