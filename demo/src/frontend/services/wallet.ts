/**
 * Bitcoin Wallet Integration Service
 * Handles wallet connections and Bitcoin operations for testnet
 */

import { apiService, WalletInfo } from './api';

export interface WalletConnection {
  address: string;
  publicKey?: string;
  network: 'testnet' | 'mainnet';
  walletType: 'browser' | 'hardware' | 'demo';
}

export interface SignTransactionRequest {
  psbt: string;
  inputs: Array<{
    address: string;
    signingIndexes: number[];
  }>;
}

export interface SignTransactionResponse {
  signedPsbt: string;
  rawTransaction: string;
}

// Demo wallet for testnet development
class DemoWallet {
  private isConnected = false;
  private connection: WalletConnection | null = null;

  async connect(): Promise<WalletConnection> {
    try {
      console.log('Connecting demo wallet...');

      // Simulate wallet connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo, we'll use a known testnet address with some activity
      // In production, this would come from the actual wallet
      const demoAddresses = [
        'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', // Example testnet bech32
        'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', // Example testnet legacy
        'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sL5k7', // Another testnet bech32
      ];

      // Use first address for consistency in demo
      const selectedAddress = demoAddresses[0];

      this.connection = {
        address: selectedAddress,
        publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', // Demo pubkey
        network: 'testnet',
        walletType: 'demo'
      };

      this.isConnected = true;
      console.log('Demo wallet connected:', selectedAddress);
      return this.connection;
    } catch (error) {
      console.error('Failed to connect demo wallet:', error);
      throw new Error('Failed to connect demo wallet: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.connection = null;
  }

  async signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse> {
    if (!this.isConnected || !this.connection) {
      throw new Error('Wallet not connected');
    }

    // Simulate signing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real implementation, this would:
    // 1. Parse the PSBT
    // 2. Show transaction details to user
    // 3. Get user approval
    // 4. Sign with private key
    // 5. Return signed PSBT and raw transaction

    // For demo, we'll return mock data
    // Note: This won't actually work for real transactions
    return {
      signedPsbt: request.psbt + '_SIGNED_DEMO',
      rawTransaction: '0200000001' + '0'.repeat(126) // Mock raw transaction hex
    };
  }

  getConnection(): WalletConnection | null {
    return this.connection;
  }

  isWalletConnected(): boolean {
    return this.isConnected;
  }
}

// Browser wallet integration (for future implementation)
class BrowserWallet {
  async connect(): Promise<WalletConnection> {
    // Check for available Bitcoin wallets
    if (typeof window !== 'undefined') {
      // Check for Unisat
      if ((window as any).unisat) {
        try {
          const accounts = await (window as any).unisat.requestAccounts();
          const network = await (window as any).unisat.getNetwork();
          
          return {
            address: accounts[0],
            network: network === 'livenet' ? 'mainnet' : 'testnet',
            walletType: 'browser'
          };
        } catch (error) {
          console.error('Unisat connection failed:', error);
        }
      }

      // Check for OKX
      if ((window as any).okxwallet?.bitcoin) {
        try {
          const accounts = await (window as any).okxwallet.bitcoin.requestAccounts();
          const network = await (window as any).okxwallet.bitcoin.getNetwork();
          
          return {
            address: accounts[0],
            network: network === 'livenet' ? 'mainnet' : 'testnet',
            walletType: 'browser'
          };
        } catch (error) {
          console.error('OKX connection failed:', error);
        }
      }
    }

    throw new Error('No compatible Bitcoin wallet found. Please install Unisat, OKX, or another supported wallet.');
  }

  async signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse> {
    if (typeof window !== 'undefined') {
      if ((window as any).unisat) {
        const signedPsbt = await (window as any).unisat.signPsbt(request.psbt);
        // Extract raw transaction from signed PSBT
        // This would require additional PSBT parsing
        return {
          signedPsbt,
          rawTransaction: signedPsbt // Simplified for demo
        };
      }

      if ((window as any).okxwallet?.bitcoin) {
        const signedPsbt = await (window as any).okxwallet.bitcoin.signPsbt(request.psbt);
        return {
          signedPsbt,
          rawTransaction: signedPsbt // Simplified for demo
        };
      }
    }

    throw new Error('No wallet available for signing');
  }
}

class WalletService {
  private demoWallet = new DemoWallet();
  private browserWallet = new BrowserWallet();
  private currentWallet: 'demo' | 'browser' | null = null;

  async connectDemoWallet(): Promise<WalletConnection> {
    const connection = await this.demoWallet.connect();
    this.currentWallet = 'demo';
    return connection;
  }

  async connectBrowserWallet(): Promise<WalletConnection> {
    const connection = await this.browserWallet.connect();
    this.currentWallet = 'browser';
    return connection;
  }

  async disconnect(): Promise<void> {
    if (this.currentWallet === 'demo') {
      await this.demoWallet.disconnect();
    }
    this.currentWallet = null;
  }

  async signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse> {
    if (this.currentWallet === 'demo') {
      return this.demoWallet.signTransaction(request);
    } else if (this.currentWallet === 'browser') {
      return this.browserWallet.signTransaction(request);
    }
    
    throw new Error('No wallet connected');
  }

  getConnection(): WalletConnection | null {
    if (this.currentWallet === 'demo') {
      return this.demoWallet.getConnection();
    }
    return null;
  }

  isConnected(): boolean {
    return this.currentWallet !== null;
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    const connection = this.getConnection();
    if (!connection) {
      return null;
    }

    try {
      return await apiService.getWalletInfo(connection.address);
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      return null;
    }
  }

  async refreshWalletInfo(): Promise<WalletInfo | null> {
    return this.getWalletInfo();
  }

  // Utility methods
  formatBalance(satoshis: number): string {
    const btc = satoshis / 100000000;
    return `${btc.toFixed(8)} BTC (${satoshis.toLocaleString()} sats)`;
  }

  formatAddress(address: string): string {
    if (address.length <= 20) return address;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  }

  validateAddress(address: string): boolean {
    // Basic Bitcoin address validation
    if (!address) return false;
    
    // Testnet addresses
    if (address.startsWith('tb1') || address.startsWith('m') || address.startsWith('n') || address.startsWith('2')) {
      return true;
    }
    
    // Mainnet addresses (for reference)
    if (address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3')) {
      return true;
    }
    
    return false;
  }
}

export const walletService = new WalletService();
