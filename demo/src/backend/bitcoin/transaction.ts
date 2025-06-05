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
  private networkType: 'testnet' | 'mainnet';
  private blockstreamApiUrl: string;
  private mempoolApiUrl: string;
  private blockcypherApiUrl: string;
  private blockcypherToken?: string;

  constructor(
    networkType: 'testnet' | 'mainnet' = 'testnet'
  ) {
    this.networkType = networkType;
    this.network = networkType === 'mainnet'
      ? bitcoin.networks.bitcoin
      : bitcoin.networks.testnet;

    // Use public APIs for blockchain data
    if (networkType === 'testnet') {
      this.blockstreamApiUrl = process.env.BITCOIN_API_URL || 'https://blockstream.info/testnet/api';
      this.mempoolApiUrl = process.env.MEMPOOL_API_URL || 'https://mempool.space/testnet/api';
      this.blockcypherApiUrl = process.env.BLOCKCYPHER_API_URL || 'https://api.blockcypher.com/v1/btc/test3';
    } else {
      this.blockstreamApiUrl = 'https://blockstream.info/api';
      this.mempoolApiUrl = 'https://mempool.space/api';
      this.blockcypherApiUrl = 'https://api.blockcypher.com/v1/btc/main';
    }

    this.blockcypherToken = process.env.BLOCKCYPHER_TOKEN;
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
   * Broadcasts a signed transaction to the network using Blockstream API
   */
  async broadcastTransaction(rawHex: string): Promise<string> {
    try {
      console.log(`Broadcasting transaction: ${rawHex.substring(0, 20)}...`);

      // Use Blockstream API to broadcast transaction
      const response = await axios.post(`${this.blockstreamApiUrl}/tx`, rawHex, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });

      const txid = response.data;
      console.log(`Transaction broadcast successfully: ${txid}`);
      return txid;
    } catch (error) {
      console.error('Error broadcasting transaction:', error);

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data || error.message;
        throw new Error(`Failed to broadcast transaction: ${errorMessage}`);
      }

      throw new Error(`Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets transaction status and details using Blockstream API
   */
  async getTransactionStatus(txid: string): Promise<BitcoinTransaction> {
    try {
      console.log(`Fetching transaction status for: ${txid}`);

      // Get transaction details from Blockstream API
      const [txResponse, rawTxResponse] = await Promise.all([
        axios.get(`${this.blockstreamApiUrl}/tx/${txid}`),
        axios.get(`${this.blockstreamApiUrl}/tx/${txid}/hex`)
      ]);

      const tx = txResponse.data;
      const rawHex = rawTxResponse.data;

      // Parse inputs with values
      const inputs: TransactionInput[] = [];
      for (let i = 0; i < tx.vin.length; i++) {
        const input = tx.vin[i];

        // Get previous transaction to find input value and address
        let inputValue = 0;
        let inputAddress = '';

        if (!input.is_coinbase) {
          try {
            const prevTxResponse = await axios.get(`${this.blockstreamApiUrl}/tx/${input.txid}`);
            const prevTx = prevTxResponse.data;
            const prevOutput = prevTx.vout[input.vout];
            inputValue = prevOutput.value;
            inputAddress = prevOutput.scriptpubkey_address || '';
          } catch (error) {
            console.warn(`Could not fetch previous transaction ${input.txid}:`, error);
          }
        }

        inputs.push({
          prev_txid: input.txid,
          prev_vout: input.vout,
          script_sig: input.scriptsig || '',
          witness: input.witness || [],
          value: inputValue,
          address: inputAddress
        });
      }

      // Parse outputs
      const outputs: TransactionOutput[] = tx.vout.map((output: any) => ({
        value: output.value,
        script_pubkey: output.scriptpubkey,
        address: output.scriptpubkey_address || '',
        vout: output.n || 0
      }));

      // Calculate confirmations
      let confirmations = 0;
      if (tx.status.confirmed) {
        try {
          const tipResponse = await axios.get(`${this.blockstreamApiUrl}/blocks/tip/height`);
          const currentHeight = tipResponse.data;
          confirmations = currentHeight - tx.status.block_height + 1;
        } catch (error) {
          console.warn('Could not fetch current block height:', error);
          confirmations = 1; // Assume at least 1 confirmation if confirmed
        }
      }

      return {
        txid: tx.txid,
        raw_hex: rawHex,
        inputs,
        outputs,
        block_height: tx.status.block_height || 0,
        confirmations,
        fee: tx.fee || 0
      };
    } catch (error) {
      console.error(`Error fetching transaction ${txid}:`, error);
      throw new Error(`Failed to get transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets wallet information including balance and UTXOs using Blockstream API
   */
  async getWalletInfo(address: string): Promise<WalletInfo> {
    try {
      console.log(`Fetching wallet info for address: ${address}`);

      // Validate address format first
      if (!this.validateAddress(address)) {
        throw new Error(`Invalid Bitcoin address: ${address}`);
      }

      // Get UTXOs and address stats in parallel
      const [utxos, addressStatsResponse] = await Promise.all([
        this.getWalletUTXOs(address),
        axios.get(`${this.blockstreamApiUrl}/address/${address}`).catch(() => null)
      ]);

      // Calculate confirmed and unconfirmed balances
      const confirmedBalance = utxos
        .filter(utxo => utxo.confirmed)
        .reduce((sum, utxo) => sum + utxo.value, 0);

      const unconfirmedBalance = utxos
        .filter(utxo => !utxo.confirmed)
        .reduce((sum, utxo) => sum + utxo.value, 0);

      const totalBalance = confirmedBalance + unconfirmedBalance;

      // Get additional stats from address endpoint
      let transactionCount = 0;
      let totalReceived = 0;
      let totalSent = 0;

      if (addressStatsResponse?.data) {
        const stats = addressStatsResponse.data.chain_stats;
        transactionCount = stats.tx_count || 0;
        totalReceived = stats.funded_txo_sum || 0;
        totalSent = stats.spent_txo_sum || 0;
      }

      console.log(`Wallet info for ${address}: Balance=${totalBalance} sats, UTXOs=${utxos.length}, TXs=${transactionCount}`);

      return {
        address,
        public_key: '', // Would be derived from address in production
        balance: totalBalance,
        confirmed_balance: confirmedBalance,
        unconfirmed_balance: unconfirmedBalance,
        utxos,
        transaction_count: transactionCount,
        total_received: totalReceived,
        total_sent: totalSent,
        network: this.networkType
      };
    } catch (error) {
      console.error(`Error fetching wallet info for ${address}:`, error);
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
   * Estimates transaction fee using Mempool.space API
   */
  private async estimateFee(): Promise<number> {
    try {
      // Get fee estimates from Mempool.space
      const response = await axios.get(`${this.mempoolApiUrl}/v1/fees/recommended`);
      const feeRates = response.data;

      // Use medium priority fee rate (sat/vB)
      const feeRatePerVByte = feeRates.halfHourFee || feeRates.hourFee || 10;

      // Estimate transaction size (typical P2WPKH transaction)
      const estimatedSize = 140; // bytes for 1 input, 2 outputs P2WPKH
      const estimatedFee = feeRatePerVByte * estimatedSize;

      console.log(`Estimated fee: ${estimatedFee} sats (${feeRatePerVByte} sat/vB)`);

      return Math.max(estimatedFee, MIN_TRANSACTION_FEE);
    } catch (error) {
      console.warn('Could not fetch fee estimates, using fallback:', error);
      return MIN_TRANSACTION_FEE * 10; // Conservative fallback
    }
  }

  /**
   * Gets UTXOs for a wallet address using Blockstream API
   */
  private async getWalletUTXOs(address: string): Promise<UTXO[]> {
    try {
      console.log(`Fetching UTXOs for address: ${address}`);

      // Use Blockstream API to get UTXOs with timeout
      const response = await axios.get(`${this.blockstreamApiUrl}/address/${address}/utxo`, {
        timeout: 10000 // 10 second timeout
      });
      const utxos = response.data;

      console.log(`Found ${utxos.length} UTXOs for address ${address}`);

      // Convert to our UTXO format
      const formattedUtxos: UTXO[] = [];

      for (const utxo of utxos) {
        // Get transaction details to get script_pubkey
        const txResponse = await axios.get(`${this.blockstreamApiUrl}/tx/${utxo.txid}`, {
          timeout: 5000 // 5 second timeout for individual transactions
        });
        const tx = txResponse.data;
        const output = tx.vout[utxo.vout];

        formattedUtxos.push({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value,
          script_pubkey: output.scriptpubkey,
          address: address,
          confirmed: utxo.status.confirmed
        });
      }

      return formattedUtxos;
    } catch (error) {
      console.error(`Error fetching UTXOs for ${address}:`, error);

      // If the address has no UTXOs or there's an error, return empty array
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`No UTXOs found for address ${address}`);
        return [];
      }

      throw new Error(`Failed to get UTXOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets current block height
   */
  async getCurrentBlockHeight(): Promise<number> {
    try {
      const response = await axios.get(`${this.blockstreamApiUrl}/blocks/tip/height`, {
        timeout: 5000 // 5 second timeout
      });
      return response.data;
    } catch (error) {
      console.warn('Could not fetch current block height:', error);
      return 0;
    }
  }

  /**
   * Validates Bitcoin address format
   */
  validateAddress(address: string): boolean {
    try {
      bitcoin.address.toOutputScript(address, this.network);
      return true;
    } catch (error) {
      return false;
    }
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
