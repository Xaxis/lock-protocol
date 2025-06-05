/**
 * LOCK Protocol Validation Functions
 * Implements validation rules from the specifications
 */
import { VaultMetadata, AmountCondition, BitcoinTransaction, Vault, ProofOfAccess } from '../types/vault';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * Validates vault metadata according to LOCK protocol specifications
 */
export declare function validateVaultMetadata(metadata: VaultMetadata): ValidationResult;
/**
 * Validates amount condition according to protocol rules
 */
export declare function validateAmountCondition(condition: AmountCondition): ValidationResult;
/**
 * Validates a Bitcoin transaction for Proof-of-Access
 */
export declare function validateProofOfAccess(transaction: BitcoinTransaction, vault: Vault): ProofOfAccess;
/**
 * Generates a canonical vault ID
 */
export declare function generateVaultId(sealBytes: Uint8Array, metadataBytes: Uint8Array, txidBytes: Uint8Array): string;
//# sourceMappingURL=vault.d.ts.map