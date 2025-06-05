/**
 * API Request/Response Type Definitions
 */

import { Vault, VaultMetadata, BitcoinTransaction, PSBT, UnlockAttempt, RebindRequest, ProofOfAccess } from './vault';

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Vault API Types
export interface CreateVaultRequest {
  files: File[];
  metadata: Omit<VaultMetadata, 'txid' | 'created_at'>;
}

export interface CreateVaultResponse {
  vault_id: string;
  seal_file: Uint8Array;
  psbt: PSBT;
}

export interface BindVaultRequest {
  vault_id: string;
  signed_transaction: BitcoinTransaction;
}

export interface BindVaultResponse {
  vault: Vault;
  finalized: boolean;
}

export interface UnsealVaultRequest {
  vault_id: string;
  unlock_transaction: BitcoinTransaction;
}

export interface UnsealVaultResponse {
  success: boolean;
  decrypted_files?: DecryptedFile[];
  proof_of_access: ProofOfAccess;
}

export interface DecryptedFile {
  name: string;
  content: Uint8Array;
  mime_type: string;
  size: number;
}

export interface RebindVaultRequest extends RebindRequest {}

export interface RebindVaultResponse {
  vault: Vault;
  new_vault_id: string;
}

export interface ListVaultsRequest {
  wallet_address?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ListVaultsResponse {
  vaults: Vault[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetVaultRequest {
  vault_id: string;
  include_metadata?: boolean;
}

export interface GetVaultResponse {
  vault: Vault;
  unlock_attempts?: UnlockAttempt[];
}

// Bitcoin API Types
export interface GeneratePSBTRequest {
  wallet_address: string;
  amount_condition: VaultMetadata['amount_condition'];
  recipient_address?: string;
}

export interface GeneratePSBTResponse {
  psbt: PSBT;
  selected_amount?: number; // For range conditions
}

export interface ValidateTransactionRequest {
  transaction: BitcoinTransaction;
  vault_metadata: VaultMetadata;
}

export interface ValidateTransactionResponse {
  valid: boolean;
  errors: string[];
  proof_of_access: ProofOfAccess;
}

export interface GetTransactionStatusRequest {
  txid: string;
}

export interface GetTransactionStatusResponse {
  transaction: BitcoinTransaction;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface BroadcastTransactionRequest {
  raw_hex: string;
}

export interface BroadcastTransactionResponse {
  txid: string;
  success: boolean;
}

// Wallet API Types
export interface ConnectWalletRequest {
  wallet_type: 'browser' | 'hardware' | 'mobile';
  network: 'testnet' | 'mainnet';
}

export interface ConnectWalletResponse {
  address: string;
  public_key: string;
  balance: number;
  network: string;
}

export interface GetWalletInfoRequest {
  address: string;
}

export interface GetWalletInfoResponse {
  address: string;
  balance: number;
  utxos: any[];
  network: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export interface VaultStatusUpdate extends WebSocketMessage {
  type: 'vault_status_update';
  payload: {
    vault_id: string;
    status: string;
    transaction?: BitcoinTransaction;
  };
}

export interface TransactionUpdate extends WebSocketMessage {
  type: 'transaction_update';
  payload: {
    txid: string;
    confirmations: number;
    status: string;
  };
}

export interface UnlockAttemptUpdate extends WebSocketMessage {
  type: 'unlock_attempt';
  payload: {
    vault_id: string;
    attempt: UnlockAttempt;
  };
}

// Utility Types
export type RequestHandler<TRequest = any, TResponse = any> = (
  req: TRequest
) => Promise<ApiResponse<TResponse>>;

export type ApiEndpoint = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: RequestHandler;
  auth_required?: boolean;
  rate_limit?: number;
};

// Configuration Types
export interface ApiConfig {
  port: number;
  host: string;
  cors_origins: string[];
  rate_limit: {
    window_ms: number;
    max_requests: number;
  };
  bitcoin: {
    network: 'testnet' | 'mainnet';
    rpc_url: string;
    rpc_user?: string;
    rpc_password?: string;
  };
  storage: {
    type: 'memory' | 'file' | 'database';
    connection_string?: string;
  };
  encryption: {
    default_algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
    key_derivation: {
      iterations: number;
      salt_length: number;
    };
  };
}
