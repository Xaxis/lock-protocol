/**
 * LOCK Protocol Validation Functions
 * Implements validation rules from the specifications
 */

import { 
  VaultMetadata, 
  AmountCondition, 
  BitcoinTransaction, 
  Vault,
  ProofOfAccess 
} from '../types/vault';
import { 
  MIN_UNLOCK_AMOUNT, 
  MAX_UNLOCK_AMOUNT, 
  MAX_UNLOCK_LIMIT,
  MAX_TIME_LOCK,
  VAULT_STATUS,
  AMOUNT_CONDITION_TYPES,
  ERROR_CODES
} from '../constants/protocol';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates vault metadata according to LOCK protocol specifications
 */
export function validateVaultMetadata(metadata: VaultMetadata): ValidationResult {
  const errors: string[] = [];

  // Validate authorized_wallet
  if (!metadata.authorized_wallet) {
    errors.push('authorized_wallet is required');
  } else if (metadata.authorized_wallet !== 'ANY') {
    const wallets = Array.isArray(metadata.authorized_wallet) 
      ? metadata.authorized_wallet 
      : [metadata.authorized_wallet];
    
    for (const wallet of wallets) {
      if (!isValidBitcoinAddress(wallet)) {
        errors.push(`Invalid Bitcoin address: ${wallet}`);
      }
    }
  }

  // Validate amount_condition
  const amountValidation = validateAmountCondition(metadata.amount_condition);
  if (!amountValidation.valid) {
    errors.push(...amountValidation.errors);
  }

  // Validate recipient_wallet if specified
  if (metadata.recipient_wallet && !isValidBitcoinAddress(metadata.recipient_wallet)) {
    errors.push(`Invalid recipient wallet address: ${metadata.recipient_wallet}`);
  }

  // Validate time_lock
  if (metadata.time_lock !== undefined) {
    if (!Number.isInteger(metadata.time_lock) || metadata.time_lock < 0) {
      errors.push('time_lock must be a non-negative integer');
    }
    if (metadata.time_lock > MAX_TIME_LOCK) {
      errors.push(`time_lock cannot exceed ${MAX_TIME_LOCK}`);
    }
  }

  // Validate unlock_limit
  if (metadata.unlock_limit !== undefined) {
    if (!Number.isInteger(metadata.unlock_limit) || metadata.unlock_limit < 1) {
      errors.push('unlock_limit must be a positive integer');
    }
    if (metadata.unlock_limit > MAX_UNLOCK_LIMIT) {
      errors.push(`unlock_limit cannot exceed ${MAX_UNLOCK_LIMIT}`);
    }
  }

  // Validate created_at
  if (!metadata.created_at || !Number.isInteger(metadata.created_at)) {
    errors.push('created_at must be a valid timestamp');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates amount condition according to protocol rules
 */
export function validateAmountCondition(condition: AmountCondition): ValidationResult {
  const errors: string[] = [];

  if (!condition || !condition.type) {
    errors.push('amount_condition.type is required');
    return { valid: false, errors };
  }

  switch (condition.type) {
    case AMOUNT_CONDITION_TYPES.FIXED:
      if (condition.amount === undefined) {
        errors.push('amount is required for fixed amount condition');
      } else if (!isValidAmount(condition.amount)) {
        errors.push(`Invalid amount: ${condition.amount}`);
      }
      break;

    case AMOUNT_CONDITION_TYPES.RANGE:
      if (condition.min === undefined || condition.max === undefined) {
        errors.push('min and max are required for range amount condition');
      } else {
        if (!isValidAmount(condition.min)) {
          errors.push(`Invalid min amount: ${condition.min}`);
        }
        if (!isValidAmount(condition.max)) {
          errors.push(`Invalid max amount: ${condition.max}`);
        }
        if (condition.min >= condition.max) {
          errors.push('min amount must be less than max amount');
        }
      }
      break;

    case AMOUNT_CONDITION_TYPES.ANY:
      // No additional validation needed for "any" type
      break;

    default:
      errors.push(`Invalid amount condition type: ${condition.type}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a Bitcoin transaction for Proof-of-Access
 */
export function validateProofOfAccess(
  transaction: BitcoinTransaction,
  vault: Vault
): ProofOfAccess {
  const errors: string[] = [];
  const metadata = vault.metadata;

  // Check if vault is in valid state for unlocking
  if (vault.status !== VAULT_STATUS.ACTIVE && vault.status !== VAULT_STATUS.BOUND) {
    errors.push(`Vault is not in unlockable state: ${vault.status}`);
  }

  // Validate authorized wallet
  if (!validateAuthorizedWallet(transaction, metadata.authorized_wallet)) {
    errors.push(ERROR_CODES.UNAUTHORIZED_WALLET);
  }

  // Validate amount condition
  if (!validateTransactionAmount(transaction, metadata.amount_condition)) {
    errors.push(ERROR_CODES.INSUFFICIENT_AMOUNT);
  }

  // Validate recipient wallet
  if (!validateRecipientWallet(transaction, metadata.recipient_wallet)) {
    errors.push('Transaction recipient does not match vault requirements');
  }

  // Validate time-lock
  if (metadata.time_lock && !validateTimeLock(transaction, metadata.time_lock)) {
    errors.push(ERROR_CODES.VAULT_TIME_LOCKED);
  }

  // Validate unlock limit
  if (metadata.unlock_limit && vault.unlock_count >= metadata.unlock_limit) {
    errors.push(ERROR_CODES.UNLOCK_LIMIT_EXCEEDED);
  }

  // Validate transaction confirmation
  if (transaction.confirmations < 1) {
    errors.push(ERROR_CODES.TRANSACTION_NOT_CONFIRMED);
  }

  return {
    transaction,
    vault,
    valid: errors.length === 0,
    errors,
    timestamp: Date.now()
  };
}

/**
 * Validates that transaction is from an authorized wallet
 */
function validateAuthorizedWallet(
  transaction: BitcoinTransaction,
  authorizedWallet: string | string[] | "ANY"
): boolean {
  if (authorizedWallet === "ANY") {
    return true;
  }

  const authorizedAddresses = Array.isArray(authorizedWallet) 
    ? authorizedWallet 
    : [authorizedWallet];

  // Check if any input is from an authorized address
  return transaction.inputs.some(input => 
    authorizedAddresses.includes(input.address)
  );
}

/**
 * Validates transaction amount against vault conditions
 * Checks that the transaction has an output with the required amount
 */
function validateTransactionAmount(
  transaction: BitcoinTransaction,
  condition: AmountCondition
): boolean {
  // For amount validation, we check if any output matches the required amount
  // This represents the actual value being sent, not the transaction fee
  const outputAmounts = transaction.outputs.map(output => output.value);

  switch (condition.type) {
    case AMOUNT_CONDITION_TYPES.FIXED:
      // Check if any output has exactly the required amount
      return outputAmounts.includes(condition.amount!);

    case AMOUNT_CONDITION_TYPES.RANGE:
      // For range conditions, validate against the selected amount from PSBT generation
      if (condition.selected_amount !== undefined) {
        return outputAmounts.includes(condition.selected_amount);
      }
      // Fallback to range validation - check if any output is within range
      return outputAmounts.some(amount =>
        amount >= condition.min! && amount <= condition.max!
      );

    case AMOUNT_CONDITION_TYPES.ANY:
      // Any positive output amount is valid
      return outputAmounts.some(amount => amount > 0);

    default:
      return false;
  }
}

/**
 * Validates transaction recipient
 */
function validateRecipientWallet(
  transaction: BitcoinTransaction,
  recipientWallet?: string
): boolean {
  if (!recipientWallet || recipientWallet === "self") {
    // For self-spend, check if any output goes back to an input address
    const inputAddresses = transaction.inputs.map(input => input.address);
    return transaction.outputs.some(output => 
      inputAddresses.includes(output.address)
    );
  }

  // Check if any output goes to the specified recipient
  return transaction.outputs.some(output => 
    output.address === recipientWallet
  );
}

/**
 * Validates time-lock condition
 */
function validateTimeLock(
  transaction: BitcoinTransaction,
  timeLock: number
): boolean {
  return transaction.block_height !== undefined && 
         transaction.block_height >= timeLock;
}

/**
 * Validates Bitcoin address format
 */
function isValidBitcoinAddress(address: string): boolean {
  // Basic validation - in production, use a proper Bitcoin address validator
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Check for common Bitcoin address patterns
  const patterns = [
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2PKH/P2SH (Legacy)
    /^bc1[a-z0-9]{39,59}$/,              // Bech32 (SegWit v0)
    /^bc1p[a-z0-9]{58}$/,                // Bech32m (SegWit v1/Taproot)
    /^[2mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Testnet
    /^tb1[a-z0-9]{39,59}$/,              // Testnet Bech32
    /^tb1p[a-z0-9]{58}$/                 // Testnet Bech32m
  ];

  return patterns.some(pattern => pattern.test(address));
}

/**
 * Validates amount value
 */
function isValidAmount(amount: number): boolean {
  return Number.isInteger(amount) && 
         amount >= MIN_UNLOCK_AMOUNT && 
         amount <= MAX_UNLOCK_AMOUNT;
}

/**
 * Generates a canonical vault ID
 */
export function generateVaultId(
  sealBytes: Uint8Array,
  metadataBytes: Uint8Array,
  txidBytes: Uint8Array
): string {
  // In a real implementation, this would use crypto.subtle.digest or similar
  // For now, return a placeholder that follows the correct format
  const combined = new Uint8Array(sealBytes.length + metadataBytes.length + txidBytes.length);
  combined.set(sealBytes, 0);
  combined.set(metadataBytes, sealBytes.length);
  combined.set(txidBytes, sealBytes.length + metadataBytes.length);
  
  // This would be SHA-256 in production
  return Array.from(combined)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 64); // Truncate to 64 chars for demo
}
