/**
 * Vault Storage Interface and Implementation
 * Handles persistent storage of vaults, metadata, and unlock attempts
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { Vault, UnlockAttempt } from '@shared/types/vault';
import { VAULT_STATUS } from '../../shared/constants/protocol';

export interface VaultStorage {
  // Draft vault operations
  storeDraftVault(vault: Vault, encryptedMetadata: Uint8Array): Promise<void>;
  getDraftVault(vaultId: string): Promise<Vault | null>;
  removeDraftVault(vaultId: string): Promise<void>;

  // Finalized vault operations
  storeVault(vault: Vault): Promise<void>;
  getVault(vaultId: string): Promise<Vault | null>;
  updateVault(vault: Vault): Promise<void>;
  removeVault(vaultId: string): Promise<void>;
  listVaults(filters?: VaultListFilters): Promise<Vault[]>;

  // Unlock attempt tracking
  recordUnlockAttempt(vaultId: string, attempt: UnlockAttempt): Promise<void>;
  getUnlockAttempts(vaultId: string): Promise<UnlockAttempt[]>;

  // Utility methods
  vaultExists(vaultId: string): Promise<boolean>;
  getVaultCount(): Promise<number>;
}

export interface VaultListFilters {
  walletAddress?: string;
  status?: string;
  limit?: number;
  offset?: number;
  createdAfter?: number;
  createdBefore?: number;
}

/**
 * File-based storage implementation
 * In production, this would be replaced with a proper database
 */
export class FileVaultStorage implements VaultStorage {
  private storageDir: string;
  private draftsDir: string;
  private vaultsDir: string;
  private attemptsDir: string;

  constructor(storageDir: string = './data') {
    this.storageDir = storageDir;
    this.draftsDir = join(storageDir, 'drafts');
    this.vaultsDir = join(storageDir, 'vaults');
    this.attemptsDir = join(storageDir, 'attempts');
    
    this.initializeStorage();
  }

  /**
   * Initialize storage directories
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      await fs.mkdir(this.draftsDir, { recursive: true });
      await fs.mkdir(this.vaultsDir, { recursive: true });
      await fs.mkdir(this.attemptsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  /**
   * Store draft vault
   */
  async storeDraftVault(vault: Vault, encryptedMetadata: Uint8Array): Promise<void> {
    const filePath = join(this.draftsDir, `${vault.id}.json`);
    const metadataPath = join(this.draftsDir, `${vault.id}.metadata`);
    
    const vaultData = {
      ...vault,
      stored_at: Date.now()
    };

    await fs.writeFile(filePath, JSON.stringify(vaultData, null, 2));
    await fs.writeFile(metadataPath, encryptedMetadata);
  }

  /**
   * Get draft vault
   */
  async getDraftVault(vaultId: string): Promise<Vault | null> {
    try {
      const filePath = join(this.draftsDir, `${vaultId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const vault = JSON.parse(data);
      
      // Convert stored data back to proper types
      return this.deserializeVault(vault);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Remove draft vault
   */
  async removeDraftVault(vaultId: string): Promise<void> {
    try {
      const filePath = join(this.draftsDir, `${vaultId}.json`);
      const metadataPath = join(this.draftsDir, `${vaultId}.metadata`);
      
      await fs.unlink(filePath);
      await fs.unlink(metadataPath).catch(() => {}); // Ignore if metadata file doesn't exist
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Store finalized vault
   */
  async storeVault(vault: Vault): Promise<void> {
    const filePath = join(this.vaultsDir, `${vault.id}.json`);
    
    const vaultData = {
      ...vault,
      stored_at: Date.now(),
      updated_at: Date.now()
    };

    await fs.writeFile(filePath, JSON.stringify(vaultData, null, 2));
  }

  /**
   * Get finalized vault
   */
  async getVault(vaultId: string): Promise<Vault | null> {
    try {
      const filePath = join(this.vaultsDir, `${vaultId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const vault = JSON.parse(data);
      
      return this.deserializeVault(vault);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update vault
   */
  async updateVault(vault: Vault): Promise<void> {
    const filePath = join(this.vaultsDir, `${vault.id}.json`);
    
    const vaultData = {
      ...vault,
      updated_at: Date.now()
    };

    await fs.writeFile(filePath, JSON.stringify(vaultData, null, 2));
  }

  /**
   * Remove vault
   */
  async removeVault(vaultId: string): Promise<void> {
    try {
      const filePath = join(this.vaultsDir, `${vaultId}.json`);
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * List vaults with optional filters
   */
  async listVaults(filters: VaultListFilters = {}): Promise<Vault[]> {
    try {
      const files = await fs.readdir(this.vaultsDir);
      const vaultFiles = files.filter((file: any) => file.endsWith('.json'));
      
      const vaults: Vault[] = [];
      
      for (const file of vaultFiles) {
        try {
          const filePath = join(this.vaultsDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const vault = this.deserializeVault(JSON.parse(data));
          
          if (this.matchesFilters(vault, filters)) {
            vaults.push(vault);
          }
        } catch (error) {
          console.error(`Error reading vault file ${file}:`, error);
        }
      }

      // Sort by creation time (newest first)
      vaults.sort((a, b) => b.metadata.created_at - a.metadata.created_at);

      // Apply pagination
      const { offset = 0, limit } = filters;
      const start = offset;
      const end = limit ? start + limit : undefined;
      
      return vaults.slice(start, end);
    } catch (error) {
      console.error('Error listing vaults:', error);
      return [];
    }
  }

  /**
   * Record unlock attempt
   */
  async recordUnlockAttempt(vaultId: string, attempt: UnlockAttempt): Promise<void> {
    const filePath = join(this.attemptsDir, `${vaultId}.json`);
    
    let attempts: UnlockAttempt[] = [];
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      attempts = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }

    attempts.push(attempt);
    
    // Keep only last 100 attempts per vault
    if (attempts.length > 100) {
      attempts = attempts.slice(-100);
    }

    await fs.writeFile(filePath, JSON.stringify(attempts, null, 2));
  }

  /**
   * Get unlock attempts for vault
   */
  async getUnlockAttempts(vaultId: string): Promise<UnlockAttempt[]> {
    try {
      const filePath = join(this.attemptsDir, `${vaultId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Check if vault exists
   */
  async vaultExists(vaultId: string): Promise<boolean> {
    try {
      const filePath = join(this.vaultsDir, `${vaultId}.json`);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get total vault count
   */
  async getVaultCount(): Promise<number> {
    try {
      const files = await fs.readdir(this.vaultsDir);
      return files.filter((file: any) => file.endsWith('.json')).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Deserialize vault data from storage
   */
  private deserializeVault(data: any): Vault {
    // Convert Uint8Array fields back from arrays
    if (data.seal) {
      if (data.seal.nonce && Array.isArray(data.seal.nonce)) {
        data.seal.nonce = new Uint8Array(data.seal.nonce);
      }
      if (data.seal.ciphertext && Array.isArray(data.seal.ciphertext)) {
        data.seal.ciphertext = new Uint8Array(data.seal.ciphertext);
      }
      if (data.seal.integrity_tag && Array.isArray(data.seal.integrity_tag)) {
        data.seal.integrity_tag = new Uint8Array(data.seal.integrity_tag);
      }
    }

    return data as Vault;
  }

  /**
   * Check if vault matches filters
   */
  private matchesFilters(vault: Vault, filters: VaultListFilters): boolean {
    if (filters.walletAddress) {
      const authorized = vault.metadata.authorized_wallet;
      if (authorized !== "ANY") {
        const addresses = Array.isArray(authorized) ? authorized : [authorized];
        if (!addresses.includes(filters.walletAddress)) {
          return false;
        }
      }
    }

    if (filters.status && vault.status !== filters.status) {
      return false;
    }

    if (filters.createdAfter && vault.metadata.created_at < filters.createdAfter) {
      return false;
    }

    if (filters.createdBefore && vault.metadata.created_at > filters.createdBefore) {
      return false;
    }

    return true;
  }
}

/**
 * In-memory storage implementation for testing
 */
export class MemoryVaultStorage implements VaultStorage {
  private drafts = new Map<string, { vault: Vault; metadata: Uint8Array }>();
  private vaults = new Map<string, Vault>();
  private attempts = new Map<string, UnlockAttempt[]>();

  async storeDraftVault(vault: Vault, encryptedMetadata: Uint8Array): Promise<void> {
    this.drafts.set(vault.id, { vault, metadata: encryptedMetadata });
  }

  async getDraftVault(vaultId: string): Promise<Vault | null> {
    const draft = this.drafts.get(vaultId);
    return draft ? draft.vault : null;
  }

  async removeDraftVault(vaultId: string): Promise<void> {
    this.drafts.delete(vaultId);
  }

  async storeVault(vault: Vault): Promise<void> {
    this.vaults.set(vault.id, vault);
  }

  async getVault(vaultId: string): Promise<Vault | null> {
    return this.vaults.get(vaultId) || null;
  }

  async updateVault(vault: Vault): Promise<void> {
    this.vaults.set(vault.id, vault);
  }

  async removeVault(vaultId: string): Promise<void> {
    this.vaults.delete(vaultId);
  }

  async listVaults(filters: VaultListFilters = {}): Promise<Vault[]> {
    const allVaults = Array.from(this.vaults.values());
    // Apply basic filtering (simplified for demo)
    return allVaults.slice(filters.offset || 0, filters.limit);
  }

  async recordUnlockAttempt(vaultId: string, attempt: UnlockAttempt): Promise<void> {
    const existing = this.attempts.get(vaultId) || [];
    existing.push(attempt);
    this.attempts.set(vaultId, existing);
  }

  async getUnlockAttempts(vaultId: string): Promise<UnlockAttempt[]> {
    return this.attempts.get(vaultId) || [];
  }

  async vaultExists(vaultId: string): Promise<boolean> {
    return this.vaults.has(vaultId);
  }

  async getVaultCount(): Promise<number> {
    return this.vaults.size;
  }
}
