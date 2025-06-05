/**
 * LOCK Protocol Constants
 * Based on the protocol specifications
 */
export declare const SEAL_MAGIC = "SEAL";
export declare const SEAL_VERSION = 1;
export declare const SEAL_EXTENSION = ".seal";
export declare const ENCRYPTION_ALGORITHMS: {
    readonly AES_256_GCM: "AES-256-GCM";
    readonly CHACHA20_POLY1305: "ChaCha20-Poly1305";
};
export declare const DEFAULT_ENCRYPTION_ALGORITHM: "AES-256-GCM";
export declare const AES_KEY_LENGTH = 32;
export declare const AES_IV_LENGTH = 12;
export declare const AES_TAG_LENGTH = 16;
export declare const CHACHA20_KEY_LENGTH = 32;
export declare const CHACHA20_NONCE_LENGTH = 12;
export declare const POLY1305_TAG_LENGTH = 16;
export declare const BITCOIN_NETWORKS: {
    readonly MAINNET: "mainnet";
    readonly TESTNET: "testnet";
};
export declare const SATOSHIS_PER_BTC = 100000000;
export declare const MIN_TRANSACTION_FEE = 1000;
export declare const DUST_THRESHOLD = 546;
export declare const VAULT_STATUS: {
    readonly DRAFT: "draft";
    readonly BOUND: "bound";
    readonly ACTIVE: "active";
    readonly EXPIRED: "expired";
    readonly EXHAUSTED: "exhausted";
};
export declare const AMOUNT_CONDITION_TYPES: {
    readonly FIXED: "fixed";
    readonly RANGE: "range";
    readonly ANY: "any";
};
export declare const METADATA_VISIBILITY: {
    readonly ENCRYPTED: "encrypted";
    readonly PLAINTEXT: "plaintext";
};
export declare const MAX_VAULT_SIZE: number;
export declare const MAX_METADATA_SIZE: number;
export declare const MAX_FILES_PER_VAULT = 100;
export declare const MIN_UNLOCK_AMOUNT = 1000;
export declare const MAX_UNLOCK_AMOUNT: number;
export declare const MAX_UNLOCK_LIMIT = 1000000;
export declare const MAX_TIME_LOCK = 1000000;
export declare const API_VERSION = "v1";
export declare const API_BASE_PATH = "/api/v1";
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const RATE_LIMITS: {
    readonly DEFAULT: {
        readonly WINDOW_MS: number;
        readonly MAX_REQUESTS: 100;
    };
    readonly VAULT_CREATION: {
        readonly WINDOW_MS: number;
        readonly MAX_REQUESTS: 10;
    };
    readonly UNLOCK_ATTEMPTS: {
        readonly WINDOW_MS: number;
        readonly MAX_REQUESTS: 20;
    };
};
export declare const ERROR_CODES: {
    readonly INVALID_VAULT_ID: "INVALID_VAULT_ID";
    readonly INVALID_TRANSACTION: "INVALID_TRANSACTION";
    readonly INVALID_METADATA: "INVALID_METADATA";
    readonly INVALID_AMOUNT: "INVALID_AMOUNT";
    readonly INVALID_WALLET: "INVALID_WALLET";
    readonly VAULT_NOT_FOUND: "VAULT_NOT_FOUND";
    readonly VAULT_NOT_BOUND: "VAULT_NOT_BOUND";
    readonly VAULT_EXHAUSTED: "VAULT_EXHAUSTED";
    readonly VAULT_TIME_LOCKED: "VAULT_TIME_LOCKED";
    readonly UNAUTHORIZED_WALLET: "UNAUTHORIZED_WALLET";
    readonly INSUFFICIENT_AMOUNT: "INSUFFICIENT_AMOUNT";
    readonly UNLOCK_LIMIT_EXCEEDED: "UNLOCK_LIMIT_EXCEEDED";
    readonly TRANSACTION_NOT_CONFIRMED: "TRANSACTION_NOT_CONFIRMED";
    readonly TRANSACTION_INVALID: "TRANSACTION_INVALID";
    readonly INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS";
    readonly ENCRYPTION_FAILED: "ENCRYPTION_FAILED";
    readonly DECRYPTION_FAILED: "DECRYPTION_FAILED";
    readonly STORAGE_ERROR: "STORAGE_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
};
export declare const SUPPORTED_FILE_TYPES: readonly ["text/plain", "application/pdf", "image/jpeg", "image/png", "image/gif", "application/json", "application/zip", "application/octet-stream"];
export declare const MAX_FILE_SIZE: number;
export declare const WALLET_TYPES: {
    readonly BROWSER: "browser";
    readonly HARDWARE: "hardware";
    readonly MOBILE: "mobile";
};
export declare const WS_EVENTS: {
    readonly VAULT_STATUS_UPDATE: "vault_status_update";
    readonly TRANSACTION_UPDATE: "transaction_update";
    readonly UNLOCK_ATTEMPT: "unlock_attempt";
    readonly ERROR: "error";
};
export declare const HKDF_SALT_LENGTH = 32;
export declare const HKDF_INFO = "LOCK-PROTOCOL-V1";
export declare const HKDF_ITERATIONS = 100000;
export declare const VAULT_ID_LENGTH = 64;
export declare const DEFAULT_CONFIG: {
    readonly NETWORK: "testnet";
    readonly ENCRYPTION_ALGORITHM: "AES-256-GCM";
    readonly METADATA_VISIBILITY: "encrypted";
    readonly UNLOCK_LIMIT: 1;
    readonly MIN_CONFIRMATIONS: 1;
};
export declare const PROTOCOL_VERSION = "1.1";
export declare const LOCK_CONSTANTS: {
    readonly SEAL_MAGIC: "SEAL";
    readonly SEAL_VERSION: 1;
    readonly SEAL_EXTENSION: ".seal";
    readonly ENCRYPTION_ALGORITHMS: {
        readonly AES_256_GCM: "AES-256-GCM";
        readonly CHACHA20_POLY1305: "ChaCha20-Poly1305";
    };
    readonly DEFAULT_ENCRYPTION_ALGORITHM: "AES-256-GCM";
    readonly BITCOIN_NETWORKS: {
        readonly MAINNET: "mainnet";
        readonly TESTNET: "testnet";
    };
    readonly VAULT_STATUS: {
        readonly DRAFT: "draft";
        readonly BOUND: "bound";
        readonly ACTIVE: "active";
        readonly EXPIRED: "expired";
        readonly EXHAUSTED: "exhausted";
    };
    readonly AMOUNT_CONDITION_TYPES: {
        readonly FIXED: "fixed";
        readonly RANGE: "range";
        readonly ANY: "any";
    };
    readonly METADATA_VISIBILITY: {
        readonly ENCRYPTED: "encrypted";
        readonly PLAINTEXT: "plaintext";
    };
    readonly ERROR_CODES: {
        readonly INVALID_VAULT_ID: "INVALID_VAULT_ID";
        readonly INVALID_TRANSACTION: "INVALID_TRANSACTION";
        readonly INVALID_METADATA: "INVALID_METADATA";
        readonly INVALID_AMOUNT: "INVALID_AMOUNT";
        readonly INVALID_WALLET: "INVALID_WALLET";
        readonly VAULT_NOT_FOUND: "VAULT_NOT_FOUND";
        readonly VAULT_NOT_BOUND: "VAULT_NOT_BOUND";
        readonly VAULT_EXHAUSTED: "VAULT_EXHAUSTED";
        readonly VAULT_TIME_LOCKED: "VAULT_TIME_LOCKED";
        readonly UNAUTHORIZED_WALLET: "UNAUTHORIZED_WALLET";
        readonly INSUFFICIENT_AMOUNT: "INSUFFICIENT_AMOUNT";
        readonly UNLOCK_LIMIT_EXCEEDED: "UNLOCK_LIMIT_EXCEEDED";
        readonly TRANSACTION_NOT_CONFIRMED: "TRANSACTION_NOT_CONFIRMED";
        readonly TRANSACTION_INVALID: "TRANSACTION_INVALID";
        readonly INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS";
        readonly ENCRYPTION_FAILED: "ENCRYPTION_FAILED";
        readonly DECRYPTION_FAILED: "DECRYPTION_FAILED";
        readonly STORAGE_ERROR: "STORAGE_ERROR";
        readonly NETWORK_ERROR: "NETWORK_ERROR";
    };
    readonly WS_EVENTS: {
        readonly VAULT_STATUS_UPDATE: "vault_status_update";
        readonly TRANSACTION_UPDATE: "transaction_update";
        readonly UNLOCK_ATTEMPT: "unlock_attempt";
        readonly ERROR: "error";
    };
    readonly PROTOCOL_VERSION: "1.1";
};
//# sourceMappingURL=protocol.d.ts.map