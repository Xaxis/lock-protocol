/**
 * Bitcoin Transaction Handling for LOCK Protocol
 * Implements PSBT generation, transaction validation, and blockchain queries
 */

import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import axios from 'axios';

import { 
  BitcoinTransaction, 
  PSBT, 
  UTXO, 
  WalletInfo, 
  AmountCondition,
  TransactionInput,
  TransactionOutput 
} from '@shared/types/vault';
import { 
  BITCOIN_NETWORKS, 
  MIN_TRANSACTION_FEE, 
  DUST_THRESHOLD,
  AMOUNT_CONDITION_TYPES 
} from '@shared/constants/protocol';

const ECPair = ECPairFactory(ecc);

export class BitcoinService {
  private network: bitcoin.Network;
  private rpcUrl: string;
  private rpcAuth?: { user: string; password: string };

  constructor(
    networkType: 'testnet' | 'mainnet' = 'testnet',
    rpcUrl?: string,
    rpcAuth?: { user: string; password: string }
  ) {
    this.network = networkType === 'mainnet' 
      ? bitcoin.networks.bitcoin 
      : bitcoin.networks.testnet;
    
    this.rpcUrl = rpcUrl || this.getDefaultRpcUrl(networkType);
    this.rpcAuth = rpcAuth;
  }

  /**
   * Generates a PSBT for vault binding transaction
   */
  async generatePSBT(
    walletAddress: string,
    amountCondition: AmountCondition,
    recipientAddress?: string
  ): Promise<{ psbt: PSBT; selectedAmount?: number }> {
    // Get wallet UTXOs
    const utxos = await this.getWalletUTXOs(walletAddress);
    if (utxos.length === 0) {
      throw new Error('No UTXOs available for transaction');
    }

    // Determine transaction amount
    const { amount, selectedAmount } = this.calculateTransactionAmount(amountCondition);
    
    // Estimate fee
    const estimatedFee = await this.estimateFee();
    const totalRequired = amount + estimatedFee;

    // Select UTXOs
    const selectedUtxos = this.selectUTXOs(utxos, totalRequired);
    const totalInput = selectedUtxos.reduce((sum, utxo) => sum + utxo.value, 0);

    if (totalInput < totalRequired) {
      throw new Error('Insufficient funds for transaction');
    }

    // Create PSBT
    const psbt = new bitcoin.Psbt({ network: this.network });

    // Add inputs
    for (const utxo of selectedUtxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: Buffer.from(utxo.script_pubkey, 'hex'),
          value: utxo.value
        }
      });
    }

    // Add outputs
    const recipient = recipientAddress || walletAddress; // Self-spend if no recipient
    psbt.addOutput({
      address: recipient,
      value: amount
    });

    // Add change output if needed
    const change = totalInput - amount - estimatedFee;
    if (change > DUST_THRESHOLD) {
      psbt.addOutput({
        address: walletAddress,
        value: change
      });
    }

    const psbtData: PSBT = {
      psbt: psbt.toBase64(),
      amount,
      fee: estimatedFee,
      inputs: selectedUtxos.map(utxo => ({
        utxo,
        derivation_path: this.getDerivationPath(walletAddress)
      })),
      outputs: [
        {
          address: recipient,
          value: amount,
          is_change: false
        },
        ...(change > DUST_THRESHOLD ? [{
          address: walletAddress,
          value: change,
          is_change: true
        }] : [])
      ]
    };

    return { psbt: psbtData, selectedAmount };
  }

  /**
   * Validates a Bitcoin transaction for PoA compliance
   */
  async validateTransaction(
    transaction: BitcoinTransaction,
    amountCondition: AmountCondition,
    authorizedWallets: string | string[] | "ANY",
    recipientWallet?: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Parse transaction
      const tx = bitcoin.Transaction.fromHex(transaction.raw_hex);
      
      // Validate transaction structure
      if (tx.getId() !== transaction.txid) {
        errors.push('Transaction ID mismatch');
      }

      // Validate inputs and outputs match
      if (tx.ins.length !== transaction.inputs.length) {
        errors.push('Input count mismatch');
      }

      if (tx.outs.length !== transaction.outputs.length) {
        errors.push('Output count mismatch');
      }

      // Validate authorized wallet
      if (authorizedWallets !== "ANY") {
        const authorized = Array.isArray(authorizedWallets) 
          ? authorizedWallets 
          : [authorizedWallets];
        
        const hasAuthorizedInput = transaction.inputs.some(input =>
          authorized.includes(input.address)
        );

        if (!hasAuthorizedInput) {
          errors.push('No authorized wallet found in transaction inputs');
        }
      }

      // Validate amount condition
      const totalSpent = this.calculateTotalSpent(transaction);
      if (!this.validateAmount(totalSpent, amountCondition)) {
        errors.push('Amount condition not satisfied');
      }

      // Validate recipient
      if (recipientWallet && recipientWallet !== "self") {
        const hasCorrectRecipient = transaction.outputs.some(output =>
          output.address === recipientWallet
        );

        if (!hasCorrectRecipient) {
          errors.push('Incorrect recipient wallet');
        }
      }

      // Validate confirmation status
      if (transaction.confirmations < 1) {
        errors.push('Transaction not confirmed');
      }

    } catch (error) {
      errors.push(`Transaction parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Broadcasts a signed transaction to the network
   */
  async broadcastTransaction(rawHex: string): Promise<string> {
    try {
      const response = await this.rpcCall('sendrawtransaction', [rawHex]);
      return response.result;
    } catch (error) {
      throw new Error(`Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets transaction status and details
   */
  async getTransactionStatus(txid: string): Promise<BitcoinTransaction> {
    try {
      const response = await this.rpcCall('getrawtransaction', [txid, true]);
      const tx = response.result;

      return {
        txid: tx.txid,
        raw_hex: tx.hex,
        inputs: tx.vin.map((input: any, index: number) => this.parseTransactionInput(input, index)),
        outputs: tx.vout.map((output: any) => this.parseTransactionOutput(output)),
        block_height: tx.blockheight,
        confirmations: tx.confirmations || 0,
        fee: this.calculateFee(tx)
      };
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets wallet information including balance and UTXOs
   */
  async getWalletInfo(address: string): Promise<WalletInfo> {
    try {
      const utxos = await this.getWalletUTXOs(address);
      const balance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

      return {
        address,
        public_key: '', // Would be derived from address in production
        balance,
        utxos,
        network: this.network === bitcoin.networks.bitcoin ? 'mainnet' : 'testnet'
      };
    } catch (error) {
      throw new Error(`Failed to get wallet info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculates transaction amount based on amount condition
   */
  private calculateTransactionAmount(condition: AmountCondition): { 
    amount: number; 
    selectedAmount?: number 
  } {
    switch (condition.type) {
      case AMOUNT_CONDITION_TYPES.FIXED:
        return { amount: condition.amount! };

      case AMOUNT_CONDITION_TYPES.RANGE:
        // Randomly select amount within range
        const min = condition.min!;
        const max = condition.max!;
        const selectedAmount = Math.floor(Math.random() * (max - min + 1)) + min;
        return { amount: selectedAmount, selectedAmount };

      case AMOUNT_CONDITION_TYPES.ANY:
        // Use minimum viable amount
        return { amount: DUST_THRESHOLD + MIN_TRANSACTION_FEE };

      default:
        throw new Error(`Invalid amount condition type: ${condition.type}`);
    }
  }

  /**
   * Validates transaction amount against condition
   */
  private validateAmount(totalSpent: number, condition: AmountCondition): boolean {
    switch (condition.type) {
      case AMOUNT_CONDITION_TYPES.FIXED:
        return totalSpent === condition.amount;

      case AMOUNT_CONDITION_TYPES.RANGE:
        if (condition.selected_amount !== undefined) {
          return totalSpent === condition.selected_amount;
        }
        return totalSpent >= condition.min! && totalSpent <= condition.max!;

      case AMOUNT_CONDITION_TYPES.ANY:
        return totalSpent > 0;

      default:
        return false;
    }
  }

  /**
   * Calculates total amount spent in transaction
   */
  private calculateTotalSpent(transaction: BitcoinTransaction): number {
    const totalInputs = transaction.inputs.reduce((sum, input) => sum + input.value, 0);
    const totalOutputs = transaction.outputs.reduce((sum, output) => sum + output.value, 0);
    return totalInputs - totalOutputs;
  }

  /**
   * Selects UTXOs for transaction using simple algorithm
   */
  private selectUTXOs(utxos: UTXO[], targetAmount: number): UTXO[] {
    // Sort UTXOs by value (largest first)
    const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
    
    const selected: UTXO[] = [];
    let totalValue = 0;

    for (const utxo of sortedUtxos) {
      if (!utxo.confirmed) continue; // Only use confirmed UTXOs
      
      selected.push(utxo);
      totalValue += utxo.value;

      if (totalValue >= targetAmount) {
        break;
      }
    }

    return selected;
  }

  /**
   * Estimates transaction fee
   */
  private async estimateFee(): Promise<number> {
    try {
      // Simple fee estimation - in production, use proper fee estimation
      const response = await this.rpcCall('estimatesmartfee', [6]); // 6 blocks
      const feeRate = response.result.feerate || 0.00001; // BTC per KB
      const estimatedSize = 250; // Estimated transaction size in bytes
      return Math.max(Math.ceil(feeRate * estimatedSize * 100000000 / 1000), MIN_TRANSACTION_FEE);
    } catch (error) {
      return MIN_TRANSACTION_FEE; // Fallback to minimum fee
    }
  }

  /**
   * Gets UTXOs for a wallet address
   */
  private async getWalletUTXOs(address: string): Promise<UTXO[]> {
    try {
      // This would typically use a block explorer API or Bitcoin Core RPC
      // For demo purposes, return mock UTXOs
      return [
        {
          txid: '0'.repeat(64),
          vout: 0,
          value: 100000, // 0.001 BTC
          script_pubkey: '76a914' + '0'.repeat(40) + '88ac',
          address,
          confirmed: true
        }
      ];
    } catch (error) {
      throw new Error(`Failed to get UTXOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Makes RPC call to Bitcoin node
   */
  private async rpcCall(method: string, params: any[] = []): Promise<any> {
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    const config: any = {
      method: 'POST',
      url: this.rpcUrl,
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (this.rpcAuth) {
      config.auth = this.rpcAuth;
    }

    const response = await axios(config);
    
    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data;
  }

  /**
   * Gets default RPC URL for network
   */
  private getDefaultRpcUrl(network: 'testnet' | 'mainnet'): string {
    return network === 'mainnet' 
      ? 'http://localhost:8332' 
      : 'http://localhost:18332';
  }

  /**
   * Gets derivation path for address (placeholder)
   */
  private getDerivationPath(address: string): string {
    return "m/84'/0'/0'/0/0"; // Standard BIP84 path
  }

  /**
   * Parses transaction input from RPC response
   */
  private parseTransactionInput(input: any, index: number): TransactionInput {
    return {
      prev_txid: input.txid,
      prev_vout: input.vout,
      script_sig: input.scriptSig?.hex || '',
      witness: input.txinwitness || [],
      value: 0, // Would need to look up previous output
      address: '' // Would need to derive from script
    };
  }

  /**
   * Parses transaction output from RPC response
   */
  private parseTransactionOutput(output: any): TransactionOutput {
    return {
      value: Math.round(output.value * 100000000), // Convert BTC to satoshis
      script_pubkey: output.scriptPubKey.hex,
      address: output.scriptPubKey.addresses?.[0] || '',
      vout: output.n
    };
  }

  /**
   * Calculates transaction fee
   */
  private calculateFee(tx: any): number {
    // This would calculate actual fee by looking up input values
    return MIN_TRANSACTION_FEE; // Placeholder
  }
}
