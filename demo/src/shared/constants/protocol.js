"use strict";
/**
 * LOCK Protocol Constants
 * Based on the protocol specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCK_CONSTANTS = exports.PROTOCOL_VERSION = exports.DEFAULT_CONFIG = exports.VAULT_ID_LENGTH = exports.HKDF_ITERATIONS = exports.HKDF_INFO = exports.HKDF_SALT_LENGTH = exports.WS_EVENTS = exports.WALLET_TYPES = exports.MAX_FILE_SIZE = exports.SUPPORTED_FILE_TYPES = exports.ERROR_CODES = exports.RATE_LIMITS = exports.HTTP_STATUS = exports.API_BASE_PATH = exports.API_VERSION = exports.MAX_TIME_LOCK = exports.MAX_UNLOCK_LIMIT = exports.MAX_UNLOCK_AMOUNT = exports.MIN_UNLOCK_AMOUNT = exports.MAX_FILES_PER_VAULT = exports.MAX_METADATA_SIZE = exports.MAX_VAULT_SIZE = exports.METADATA_VISIBILITY = exports.AMOUNT_CONDITION_TYPES = exports.VAULT_STATUS = exports.DUST_THRESHOLD = exports.MIN_TRANSACTION_FEE = exports.SATOSHIS_PER_BTC = exports.BITCOIN_NETWORKS = exports.POLY1305_TAG_LENGTH = exports.CHACHA20_NONCE_LENGTH = exports.CHACHA20_KEY_LENGTH = exports.AES_TAG_LENGTH = exports.AES_IV_LENGTH = exports.AES_KEY_LENGTH = exports.DEFAULT_ENCRYPTION_ALGORITHM = exports.ENCRYPTION_ALGORITHMS = exports.SEAL_EXTENSION = exports.SEAL_VERSION = exports.SEAL_MAGIC = void 0;
// SEAL File Format Constants
exports.SEAL_MAGIC = 'SEAL';
exports.SEAL_VERSION = 1;
exports.SEAL_EXTENSION = '.seal';
// Supported Encryption Algorithms
exports.ENCRYPTION_ALGORITHMS = {
    AES_256_GCM: 'AES-256-GCM',
    CHACHA20_POLY1305: 'ChaCha20-Poly1305'
};
// Default encryption algorithm (required by spec)
exports.DEFAULT_ENCRYPTION_ALGORITHM = exports.ENCRYPTION_ALGORITHMS.AES_256_GCM;
// Cryptographic Constants
exports.AES_KEY_LENGTH = 32; // 256 bits
exports.AES_IV_LENGTH = 12; // 96 bits for GCM
exports.AES_TAG_LENGTH = 16; // 128 bits
exports.CHACHA20_KEY_LENGTH = 32; // 256 bits
exports.CHACHA20_NONCE_LENGTH = 12; // 96 bits
exports.POLY1305_TAG_LENGTH = 16; // 128 bits
// Bitcoin Constants
exports.BITCOIN_NETWORKS = {
    MAINNET: 'mainnet',
    TESTNET: 'testnet'
};
exports.SATOSHIS_PER_BTC = 100_000_000;
exports.MIN_TRANSACTION_FEE = 1000; // 1000 satoshis minimum fee
exports.DUST_THRESHOLD = 546; // Bitcoin dust threshold
// Vault Status Constants
exports.VAULT_STATUS = {
    DRAFT: 'draft',
    BOUND: 'bound',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    EXHAUSTED: 'exhausted'
};
// Amount Condition Types
exports.AMOUNT_CONDITION_TYPES = {
    FIXED: 'fixed',
    RANGE: 'range',
    ANY: 'any'
};
// Metadata Visibility Options
exports.METADATA_VISIBILITY = {
    ENCRYPTED: 'encrypted',
    PLAINTEXT: 'plaintext'
};
// Protocol Validation Constants
exports.MAX_VAULT_SIZE = 100 * 1024 * 1024; // 100MB max vault size
exports.MAX_METADATA_SIZE = 64 * 1024; // 64KB max metadata size
exports.MAX_FILES_PER_VAULT = 100; // Maximum files per vault
exports.MIN_UNLOCK_AMOUNT = 1000; // Minimum 1000 satoshis
exports.MAX_UNLOCK_AMOUNT = 21_000_000 * exports.SATOSHIS_PER_BTC; // 21M BTC max
exports.MAX_UNLOCK_LIMIT = 1_000_000; // Maximum unlock attempts
exports.MAX_TIME_LOCK = 1_000_000; // Maximum block height for time-lock
// API Constants
exports.API_VERSION = 'v1';
exports.API_BASE_PATH = `/api/${exports.API_VERSION}`;
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
};
// Rate Limiting
exports.RATE_LIMITS = {
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
};
// Error Codes
exports.ERROR_CODES = {
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
};
// File Type Constants
exports.SUPPORTED_FILE_TYPES = [
    'text/plain',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/json',
    'application/zip',
    'application/octet-stream'
];
exports.MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
// Wallet Integration Constants
exports.WALLET_TYPES = {
    BROWSER: 'browser',
    HARDWARE: 'hardware',
    MOBILE: 'mobile'
};
// WebSocket Event Types
exports.WS_EVENTS = {
    VAULT_STATUS_UPDATE: 'vault_status_update',
    TRANSACTION_UPDATE: 'transaction_update',
    UNLOCK_ATTEMPT: 'unlock_attempt',
    ERROR: 'error'
};
// Key Derivation Constants (HKDF)
exports.HKDF_SALT_LENGTH = 32;
exports.HKDF_INFO = 'LOCK-PROTOCOL-V1';
exports.HKDF_ITERATIONS = 100_000;
// Vault ID Generation
exports.VAULT_ID_LENGTH = 64; // SHA-256 hex string length
// Default Configuration Values
exports.DEFAULT_CONFIG = {
    NETWORK: exports.BITCOIN_NETWORKS.TESTNET,
    ENCRYPTION_ALGORITHM: exports.DEFAULT_ENCRYPTION_ALGORITHM,
    METADATA_VISIBILITY: exports.METADATA_VISIBILITY.ENCRYPTED,
    UNLOCK_LIMIT: 1, // Single-use by default
    MIN_CONFIRMATIONS: 1
};
// Protocol Version
exports.PROTOCOL_VERSION = '1.1';
// Export all constants as a single object for convenience
exports.LOCK_CONSTANTS = {
    SEAL_MAGIC: exports.SEAL_MAGIC,
    SEAL_VERSION: exports.SEAL_VERSION,
    SEAL_EXTENSION: exports.SEAL_EXTENSION,
    ENCRYPTION_ALGORITHMS: exports.ENCRYPTION_ALGORITHMS,
    DEFAULT_ENCRYPTION_ALGORITHM: exports.DEFAULT_ENCRYPTION_ALGORITHM,
    BITCOIN_NETWORKS: exports.BITCOIN_NETWORKS,
    VAULT_STATUS: exports.VAULT_STATUS,
    AMOUNT_CONDITION_TYPES: exports.AMOUNT_CONDITION_TYPES,
    METADATA_VISIBILITY: exports.METADATA_VISIBILITY,
    ERROR_CODES: exports.ERROR_CODES,
    WS_EVENTS: exports.WS_EVENTS,
    PROTOCOL_VERSION: exports.PROTOCOL_VERSION
};
//# sourceMappingURL=protocol.js.map