/**
 * Frontend API Service
 * Handles all communication with the LOCK Protocol backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface WalletInfo {
  address: string;
  balance: number;
  confirmed_balance?: number;
  unconfirmed_balance?: number;
  utxos: any[];
  transaction_count?: number;
  total_received?: number;
  total_sent?: number;
  network: 'testnet' | 'mainnet';
}

export interface TransactionHistoryResponse {
  address: string;
  transactions: BitcoinTransaction[];
  count: number;
}

export interface BitcoinTransaction {
  txid: string;
  raw_hex: string;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  block_height?: number;
  confirmations: number;
  fee: number;
  timestamp?: number;
}

export interface TransactionInput {
  prev_txid: string;
  prev_vout: number;
  script_sig: string;
  witness: string[];
  value: number;
  address: string;
}

export interface TransactionOutput {
  value: number;
  address: string;
  script_pubkey: string;
  vout: number;
}

export interface VaultMetadata {
  authorized_wallet: string | string[] | "ANY";
  amount_condition: {
    type: 'fixed' | 'range' | 'any';
    amount?: number;
    min?: number;
    max?: number;
    selected_amount?: number;
  };
  recipient_wallet?: string;
  time_lock?: number;
  unlock_limit: number;
  description?: string;
  created_at: number;
}

export interface Vault {
  id: string;
  status: string;
  metadata: VaultMetadata;
  seal?: {
    nonce: Uint8Array;
    ciphertext: Uint8Array;
    integrity_tag: Uint8Array;
    encryption_algo: string;
  };
  binding_transaction?: any;
  unlock_count: number;
  last_unlocked?: number;
}

export interface CreateVaultRequest {
  files: File[];
  metadata: Omit<VaultMetadata, 'created_at'>;
}

export interface CreateVaultResponse {
  vault_id: string;
  psbt: string | null;
  binding_transaction_required: boolean;
}

export interface UnlockVaultRequest {
  vault_id: string;
  transaction_hex: string;
}

export interface UnlockVaultResponse {
  success: boolean;
  decrypted_files?: Array<{
    name: string;
    content: Uint8Array;
    mime_type: string;
    size: number;
  }>;
  proof_of_access?: any;
}

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Bitcoin API methods
  async getWalletInfo(address: string): Promise<WalletInfo> {
    console.log(`API: Fetching wallet info for ${address}`);
    try {
      const response = await this.request<WalletInfo>(`/bitcoin/wallet/${address}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to get wallet info');
      }
      console.log(`API: Wallet info received for ${address}:`, response.data);
      return response.data!;
    } catch (error) {
      console.error(`API: Failed to get wallet info for ${address}:`, error);
      throw error;
    }
  }

  async getTransactionHistory(address: string, limit: number = 10): Promise<TransactionHistoryResponse> {
    console.log(`API: Fetching transaction history for ${address}`);
    try {
      const response = await this.request<TransactionHistoryResponse>(`/bitcoin/wallet/${address}/transactions?limit=${limit}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to get transaction history');
      }
      console.log(`API: Transaction history received for ${address}:`, response.data?.transactions.length, 'transactions');
      return response.data!;
    } catch (error) {
      console.error(`API: Failed to get transaction history for ${address}:`, error);
      throw error;
    }
  }

  async generatePSBT(
    walletAddress: string,
    amountCondition: any,
    recipientAddress?: string
  ): Promise<any> {
    const response = await this.request('/bitcoin/psbt', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress,
        amount_condition: amountCondition,
        recipient_address: recipientAddress,
      }),
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate PSBT');
    }
    return response.data;
  }

  async broadcastTransaction(rawHex: string): Promise<string> {
    const response = await this.request<{ txid: string }>('/bitcoin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ raw_hex: rawHex }),
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to broadcast transaction');
    }
    return response.data!.txid;
  }

  async getTransactionStatus(txid: string): Promise<any> {
    const response = await this.request(`/bitcoin/transaction/${txid}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get transaction status');
    }
    return response.data;
  }

  async testBitcoinIntegration(address?: string): Promise<any> {
    const endpoint = address ? `/bitcoin/test?address=${address}` : '/bitcoin/test';
    const response = await this.request(endpoint);
    if (!response.success) {
      throw new Error(response.error || 'Bitcoin test failed');
    }
    return response.data;
  }

  // Vault API methods
  async createVault(request: CreateVaultRequest): Promise<CreateVaultResponse> {
    console.log('API: Creating vault with files:', request.files.length);

    const formData = new FormData();

    // Add files
    request.files.forEach((file, index) => {
      formData.append(`files`, file);
      console.log(`API: Added file ${index}: ${file.name} (${file.size} bytes)`);
    });

    // Add metadata
    const metadata = {
      ...request.metadata,
      created_at: Date.now(),
    };
    formData.append('metadata', JSON.stringify(metadata));
    console.log('API: Added metadata:', metadata);

    const response = await fetch(`${API_BASE_URL}/vaults/seal`, {
      method: 'POST',
      body: formData,
    });

    console.log('API: Vault creation response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Vault creation failed:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API: Vault creation result:', result);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create vault');
    }

    return result.data;
  }

  async getVault(vaultId: string): Promise<Vault> {
    const response = await this.request<Vault>(`/vaults/${vaultId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get vault');
    }
    return response.data!;
  }

  async listVaults(filters?: {
    walletAddress?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ vaults: Vault[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.walletAddress) params.append('wallet_address', filters.walletAddress);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const endpoint = `/vaults${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.request<{ vaults: Vault[]; total: number }>(endpoint);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to list vaults');
    }
    return response.data!;
  }

  async unlockVault(request: UnlockVaultRequest): Promise<UnlockVaultResponse> {
    console.log(`API: Unlocking vault ${request.vault_id}`);

    const response = await this.request<UnlockVaultResponse>(`/vaults/unseal`, {
      method: 'POST',
      body: JSON.stringify({
        vault_id: request.vault_id,
        unlock_transaction: request.transaction_hex
      }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to unlock vault');
    }

    console.log(`API: Vault ${request.vault_id} unlocked successfully`);
    return response.data!;
  }

  async finalizeVault(vaultId: string, transactionHex: string): Promise<void> {
    console.log(`API: Finalizing vault ${vaultId} with transaction`);

    const response = await this.request(`/vaults/bind`, {
      method: 'POST',
      body: JSON.stringify({
        vault_id: vaultId,
        signed_transaction: transactionHex
      }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to finalize vault');
    }

    console.log(`API: Vault ${vaultId} finalized successfully`);
  }
}

export const apiService = new ApiService();
