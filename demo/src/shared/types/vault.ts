/**
 * Core LOCK Protocol Type Definitions
 * Based on the LOCK protocol specifications
 */

export interface VaultMetadata {
  /** Wallet addresses authorized to unlock this vault */
  authorized_wallet: string | string[] | "ANY";
  
  /** Amount condition for unlock transactions */
  amount_condition: AmountCondition;
  
  /** Where the unlock transaction should send funds */
  recipient_wallet?: string; // If not specified, defaults to "self"
  
  /** Optional time-lock using Bitcoin block height */
  time_lock?: number;
  
  /** Maximum number of times this vault can be unlocked */
  unlock_limit?: number;
  
  /** Whether metadata should be visible in plaintext */
  metadata_visibility?: "encrypted" | "plaintext";
  
  /** Binding transaction ID */
  txid?: string;
  
  /** Creation timestamp */
  created_at: number;
  
  /** Optional vault description */
  description?: string;
}

export interface AmountCondition {
  type: "fixed" | "range" | "any";
  amount?: number; // For fixed type (in satoshis)
  min?: number;    // For range type (in satoshis)
  max?: number;    // For range type (in satoshis)
  selected_amount?: number; // The specific amount selected during PSBT generation for range type
}

export interface SealFile {
  /** Magic bytes identifier */
  magic: string; // "SEAL"
  
  /** Format version */
  version: number;
  
  /** Encryption algorithm used */
  encryption_algo: "AES-256-GCM" | "ChaCha20-Poly1305";
  
  /** Encryption nonce/IV */
  nonce: Uint8Array;
  
  /** Encrypted payload */
  ciphertext: Uint8Array;
  
  /** Authentication tag */
  integrity_tag: Uint8Array;
  
  /** Optional metadata hint */
  metadata_hint?: string;
}

export interface Vault {
  /** Unique vault identifier */
  id: string;
  
  /** Encrypted SEAL file */
  seal: SealFile;
  
  /** Vault metadata (encrypted or plaintext) */
  metadata: VaultMetadata;
  
  /** Current unlock count */
  unlock_count: number;
  
  /** Vault status */
  status: VaultStatus;
}

export type VaultStatus = "draft" | "bound" | "active" | "expired" | "exhausted";

export interface UnlockAttempt {
  /** Vault ID being unlocked */
  vault_id: string;
  
  /** Bitcoin transaction attempting unlock */
  transaction: BitcoinTransaction;
  
  /** Timestamp of attempt */
  timestamp: number;
  
  /** Result of the attempt */
  result: "success" | "failure";
  
  /** Error message if failed */
  error?: string;
}

export interface BitcoinTransaction {
  /** Transaction ID */
  txid: string;

  /** Raw transaction hex */
  raw_hex: string;

  /** Transaction inputs */
  inputs: TransactionInput[];

  /** Transaction outputs */
  outputs: TransactionOutput[];

  /** Block height (if confirmed) */
  block_height?: number;

  /** Confirmation count */
  confirmations: number;

  /** Network fees paid */
  fee: number;

  /** Transaction timestamp (Unix timestamp) */
  timestamp?: number;
}

export interface TransactionInput {
  /** Previous transaction ID */
  prev_txid: string;
  
  /** Previous output index */
  prev_vout: number;
  
  /** Script signature */
  script_sig: string;
  
  /** Witness data (for SegWit) */
  witness?: string[];
  
  /** Input value in satoshis */
  value: number;
  
  /** Address that signed this input */
  address: string;
}

export interface TransactionOutput {
  /** Output value in satoshis */
  value: number;
  
  /** Output script */
  script_pubkey: string;
  
  /** Destination address */
  address: string;
  
  /** Output index */
  vout: number;
}

export interface PSBT {
  /** Base64 encoded PSBT */
  psbt: string;
  
  /** Transaction ID (once signed) */
  txid?: string;
  
  /** Total amount to be spent */
  amount: number;
  
  /** Network fee */
  fee: number;
  
  /** Inputs being spent */
  inputs: PSBTInput[];
  
  /** Outputs being created */
  outputs: PSBTOutput[];
}

export interface PSBTInput {
  /** UTXO being spent */
  utxo: UTXO;
  
  /** Derivation path for signing */
  derivation_path?: string;
}

export interface PSBTOutput {
  /** Output address */
  address: string;
  
  /** Output value */
  value: number;
  
  /** Whether this is a change output */
  is_change: boolean;
}

export interface UTXO {
  /** Transaction ID */
  txid: string;
  
  /** Output index */
  vout: number;
  
  /** Value in satoshis */
  value: number;
  
  /** Script pubkey */
  script_pubkey: string;
  
  /** Address */
  address: string;
  
  /** Whether this UTXO is confirmed */
  confirmed: boolean;
}

export interface WalletInfo {
  /** Wallet address */
  address: string;

  /** Public key */
  public_key: string;

  /** Total balance in satoshis */
  balance: number;

  /** Confirmed balance in satoshis */
  confirmed_balance?: number;

  /** Unconfirmed balance in satoshis */
  unconfirmed_balance?: number;

  /** Available UTXOs */
  utxos: UTXO[];

  /** Total number of transactions */
  transaction_count?: number;

  /** Total amount received in satoshis */
  total_received?: number;

  /** Total amount sent in satoshis */
  total_sent?: number;

  /** Network (testnet/mainnet) */
  network: "testnet" | "mainnet";
}

export interface RebindRequest {
  /** Current vault ID */
  vault_id: string;
  
  /** New binding transaction */
  new_transaction: BitcoinTransaction;
  
  /** Signature from old wallet authorizing the rebind */
  old_wallet_signature: string;
  
  /** Optional new metadata */
  new_metadata?: Partial<VaultMetadata>;
}

export interface ProofOfAccess {
  /** Transaction being validated */
  transaction: BitcoinTransaction;
  
  /** Vault being unlocked */
  vault: Vault;
  
  /** Validation result */
  valid: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Validation timestamp */
  timestamp: number;
}
