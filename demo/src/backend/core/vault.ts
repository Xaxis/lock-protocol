/**
 * Core LOCK Protocol Implementation
 * Implements the four core primitives: seal, bind, unseal, rebind
 */

import { 
  Vault, 
  VaultMetadata, 
  SealFile, 
  BitcoinTransaction, 
  ProofOfAccess,
  RebindRequest 
} from '@shared/types/vault';
import { 
  validateVaultMetadata, 
  validateProofOfAccess, 
  generateVaultId 
} from '@shared/validation/vault';
import { 
  VAULT_STATUS, 
  SEAL_MAGIC, 
  SEAL_VERSION, 
  DEFAULT_ENCRYPTION_ALGORITHM,
  ERROR_CODES 
} from '@shared/constants/protocol';
import { CryptoService } from '../crypto/encryption';
import { VaultStorage } from '../storage/vault-storage';

// File data interface for backend processing
interface FileData {
  name: string;
  type: string;
  size: number;
  content: Uint8Array;
}

export class VaultService {
  private cryptoService: CryptoService;
  private storage: VaultStorage;

  constructor(cryptoService: CryptoService, storage: VaultStorage) {
    this.cryptoService = cryptoService;
    this.storage = storage;
  }

  /**
   * SEAL: Creates a draft vault by encrypting files and metadata
   */
  async seal(files: FileData[], metadata: Omit<VaultMetadata, 'txid' | 'created_at'>): Promise<{
    vault_id: string;
    seal: SealFile;
    encrypted_metadata: Uint8Array;
  }> {
    // Validate metadata
    const fullMetadata: VaultMetadata = {
      ...metadata,
      created_at: Date.now()
    };

    const validation = validateVaultMetadata(fullMetadata);
    if (!validation.valid) {
      throw new Error(`Invalid metadata: ${validation.errors.join(', ')}`);
    }

    // Encrypt files into SEAL
    const seal = await this.createSeal(files);
    
    // Encrypt metadata
    const metadataBytes = new TextEncoder().encode(JSON.stringify(fullMetadata));
    const encryptedMetadata = await this.cryptoService.encrypt(metadataBytes);

    // Convert EncryptedData to Uint8Array for storage
    const metadataForStorage = encryptedMetadata.ciphertext;

    // Generate temporary vault ID (will be regenerated after binding)
    const tempTxid = new Uint8Array(32); // Placeholder TXID
    const vaultId = generateVaultId(
      this.sealToBytes(seal),
      metadataForStorage,
      tempTxid
    );

    // For demo mode, store as active vault immediately if no binding transaction is required
    // In production, this would always be stored as draft first
    const vault: Vault = {
      id: vaultId,
      seal,
      metadata: fullMetadata,
      unlock_count: 0,
      status: VAULT_STATUS.ACTIVE // Active since no binding transaction required in demo
    };

    // Store as regular vault (not draft) for demo mode
    await this.storage.storeVault(vault);
    console.log(`VaultService: Stored vault ${vaultId} as active vault`);

    return {
      vault_id: vaultId,
      seal,
      encrypted_metadata: metadataForStorage
    };
  }

  /**
   * BIND: Binds a draft vault to a Bitcoin transaction
   */
  async bind(vaultId: string, transaction: BitcoinTransaction): Promise<Vault> {
    // Retrieve draft vault
    const draftVault = await this.storage.getDraftVault(vaultId);
    if (!draftVault) {
      throw new Error(`Draft vault not found: ${vaultId}`);
    }

    // Validate transaction is confirmed and non-replaceable
    if (transaction.confirmations < 1) {
      throw new Error(ERROR_CODES.TRANSACTION_NOT_CONFIRMED);
    }

    // Update metadata with TXID
    const updatedMetadata: VaultMetadata = {
      ...draftVault.metadata,
      txid: transaction.txid
    };

    // Generate final vault ID
    const sealBytes = this.sealToBytes(draftVault.seal);
    const metadataBytes = new TextEncoder().encode(JSON.stringify(updatedMetadata));
    const txidBytes = this.hexToBytes(transaction.txid);
    
    const finalVaultId = generateVaultId(sealBytes, metadataBytes, txidBytes);

    // Create finalized vault
    const finalizedVault: Vault = {
      id: finalVaultId,
      seal: draftVault.seal,
      metadata: updatedMetadata,
      unlock_count: 0,
      status: VAULT_STATUS.BOUND
    };

    // Store finalized vault and remove draft
    await this.storage.storeVault(finalizedVault);
    await this.storage.removeDraftVault(vaultId);

    return finalizedVault;
  }

  /**
   * UNSEAL: Validates PoA and decrypts vault if valid
   */
  async unseal(vaultId: string, transaction: BitcoinTransaction): Promise<{
    success: boolean;
    decrypted_files?: FileData[];
    proof_of_access: ProofOfAccess;
  }> {
    // Retrieve vault
    const vault = await this.storage.getVault(vaultId);
    if (!vault) {
      throw new Error(`Vault not found: ${vaultId}`);
    }

    // Validate Proof-of-Access
    const proofOfAccess = validateProofOfAccess(transaction, vault);

    if (!proofOfAccess.valid) {
      // Record failed attempt
      await this.storage.recordUnlockAttempt(vaultId, {
        vault_id: vaultId,
        transaction,
        timestamp: Date.now(),
        result: 'failure',
        error: proofOfAccess.errors.join(', ')
      });

      return {
        success: false,
        proof_of_access: proofOfAccess
      };
    }

    // Decrypt SEAL using transaction-derived key
    const decryptedFiles = await this.decryptSeal(vault.seal, transaction);

    // Update unlock count
    vault.unlock_count += 1;
    
    // Check if vault is exhausted
    if (vault.metadata.unlock_limit && vault.unlock_count >= vault.metadata.unlock_limit) {
      vault.status = VAULT_STATUS.EXHAUSTED;
    }

    // Update vault
    await this.storage.updateVault(vault);

    // Record successful attempt
    await this.storage.recordUnlockAttempt(vaultId, {
      vault_id: vaultId,
      transaction,
      timestamp: Date.now(),
      result: 'success'
    });

    return {
      success: true,
      decrypted_files: decryptedFiles,
      proof_of_access: proofOfAccess
    };
  }

  /**
   * Get a specific vault by ID
   */
  async getVault(vaultId: string): Promise<Vault | null> {
    try {
      console.log(`VaultService: Getting vault ${vaultId}`);

      // Try to get from regular vaults first
      let vault = await this.storage.getVault(vaultId);

      // If not found, try draft vaults
      if (!vault) {
        vault = await this.storage.getDraftVault(vaultId);
      }

      if (vault) {
        console.log(`VaultService: Found vault ${vaultId} with status ${vault.status}`);
      } else {
        console.log(`VaultService: Vault ${vaultId} not found`);
      }

      return vault;
    } catch (error) {
      console.error(`VaultService: Error getting vault ${vaultId}:`, error);
      throw new Error(`Failed to get vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List vaults with optional filters
   */
  async listVaults(filters: {
    walletAddress?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Vault[]> {
    try {
      console.log('VaultService: Listing vaults with filters:', filters);

      // Get all vaults from storage
      const allVaults = await this.storage.listVaults();
      console.log(`VaultService: Found ${allVaults.length} total vaults`);

      // Apply filters
      let filteredVaults = allVaults;

      // Filter by wallet address
      if (filters.walletAddress) {
        filteredVaults = filteredVaults.filter(vault => {
          const authorizedWallet = vault.metadata.authorized_wallet;
          if (authorizedWallet === 'ANY') return true;
          if (Array.isArray(authorizedWallet)) {
            return authorizedWallet.includes(filters.walletAddress!);
          }
          return authorizedWallet === filters.walletAddress;
        });
        console.log(`VaultService: After wallet filter: ${filteredVaults.length} vaults`);
      }

      // Filter by status
      if (filters.status) {
        filteredVaults = filteredVaults.filter(vault => vault.status === filters.status);
        console.log(`VaultService: After status filter: ${filteredVaults.length} vaults`);
      }

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 20;

      const paginatedVaults = filteredVaults.slice(offset, offset + limit);
      console.log(`VaultService: After pagination: ${paginatedVaults.length} vaults`);

      return paginatedVaults;
    } catch (error) {
      console.error('VaultService: Error listing vaults:', error);
      throw new Error(`Failed to list vaults: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * REBIND: Transfers vault ownership to a new wallet
   */
  async rebind(request: RebindRequest): Promise<Vault> {
    // Retrieve current vault
    const vault = await this.storage.getVault(request.vault_id);
    if (!vault) {
      throw new Error(`Vault not found: ${request.vault_id}`);
    }

    // Validate old wallet signature
    const isValidSignature = await this.validateRebindSignature(
      vault,
      request.old_wallet_signature
    );

    if (!isValidSignature) {
      throw new Error('Invalid signature from current owner');
    }

    // Update metadata
    const updatedMetadata: VaultMetadata = {
      ...vault.metadata,
      ...request.new_metadata,
      txid: request.new_transaction.txid
    };

    // Generate new vault ID
    const sealBytes = this.sealToBytes(vault.seal);
    const metadataBytes = new TextEncoder().encode(JSON.stringify(updatedMetadata));
    const txidBytes = this.hexToBytes(request.new_transaction.txid);
    
    const newVaultId = generateVaultId(sealBytes, metadataBytes, txidBytes);

    // Create updated vault
    const updatedVault: Vault = {
      id: newVaultId,
      seal: vault.seal,
      metadata: updatedMetadata,
      unlock_count: 0, // Reset or inherit based on requirements
      status: VAULT_STATUS.BOUND
    };

    // Store updated vault and remove old one
    await this.storage.storeVault(updatedVault);
    await this.storage.removeVault(request.vault_id);

    return updatedVault;
  }

  /**
   * Creates a SEAL file from input files
   */
  private async createSeal(files: FileData[]): Promise<SealFile> {
    // Combine files into a single payload
    const payload = await this.combineFiles(files);

    // For demo purposes, use a consistent key derivation
    // In production, this would be derived from the binding transaction
    const key = await this.cryptoService.deriveKey({
      password: 'demo-vault-key',
      salt: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      iterations: 1000
    });

    // Encrypt payload with consistent key
    const encryptedData = await this.cryptoService.encrypt(payload, key);

    return {
      magic: SEAL_MAGIC,
      version: SEAL_VERSION,
      encryption_algo: DEFAULT_ENCRYPTION_ALGORITHM,
      nonce: encryptedData.nonce,
      ciphertext: encryptedData.ciphertext,
      integrity_tag: encryptedData.tag,
      metadata_hint: files.length === 1 ? files[0].type : 'application/zip'
    };
  }

  /**
   * Decrypts a SEAL file back to original files
   */
  private async decryptSeal(seal: SealFile, transaction?: BitcoinTransaction): Promise<FileData[]> {
    // For demo purposes, use the same consistent key as during encryption
    // In production, this would derive the key from the transaction using ECDH
    const key = await this.cryptoService.deriveKey({
      password: 'demo-vault-key',
      salt: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      iterations: 1000
    });

    // Decrypt the payload
    const decryptedPayload = await this.cryptoService.decrypt({
      nonce: seal.nonce,
      ciphertext: seal.ciphertext,
      tag: seal.integrity_tag,
      algorithm: seal.encryption_algo
    }, key);

    // Extract files from payload
    return this.extractFiles(decryptedPayload);
  }



  /**
   * Combines multiple files into a single encrypted payload
   */
  private async combineFiles(files: FileData[]): Promise<Uint8Array> {
    // Simple implementation - in production, use a proper archive format
    const combined = [];
    
    for (const file of files) {
      const content = file.content;
      const header = {
        name: file.name,
        type: file.type,
        size: content.length
      };

      const headerBytes = new TextEncoder().encode(JSON.stringify(header) + '\n');
      combined.push(headerBytes, content);
    }

    const totalLength = combined.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const arr of combined) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result;
  }

  /**
   * Extracts files from a combined payload
   */
  private extractFiles(payload: Uint8Array): FileData[] {
    // Simple implementation - in production, use proper archive extraction
    const files: FileData[] = [];
    let offset = 0;

    while (offset < payload.length) {
      // Find header end
      const headerEnd = payload.indexOf(10, offset); // '\n'
      if (headerEnd === -1) break;

      // Parse header
      const headerBytes = payload.slice(offset, headerEnd);
      const headerText = new TextDecoder().decode(headerBytes);
      const header = JSON.parse(headerText);

      // Extract file content
      const contentStart = headerEnd + 1;
      const contentEnd = contentStart + header.size;
      const content = payload.slice(contentStart, contentEnd);

      // Create file data
      const file: FileData = {
        name: header.name,
        type: header.type,
        size: header.size,
        content: content
      };
      files.push(file);

      offset = contentEnd;
    }

    return files;
  }

  /**
   * Converts SEAL to bytes for vault ID generation
   */
  private sealToBytes(seal: SealFile): Uint8Array {
    // Serialize SEAL to canonical byte format
    const parts = [
      new TextEncoder().encode(seal.magic),
      new Uint8Array([seal.version]),
      new TextEncoder().encode(seal.encryption_algo),
      seal.nonce,
      seal.ciphertext,
      seal.integrity_tag
    ];

    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }

    return result;
  }

  /**
   * Converts hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Validates rebind signature from old wallet
   */
  private async validateRebindSignature(
    vault: Vault,
    signature: string
  ): Promise<boolean> {
    // In production, implement proper signature validation
    // This would verify that the signature was created by the wallet
    // that owns the current binding transaction
    return signature.length > 0; // Placeholder validation
  }
}
