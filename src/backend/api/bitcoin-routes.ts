/**
 * Bitcoin API Routes
 * Implements REST endpoints for Bitcoin operations
 */

import { Router, Request, Response } from 'express';
import { BitcoinService } from '../bitcoin/transaction';
import { 
  GeneratePSBTRequest,
  GeneratePSBTResponse,
  ValidateTransactionRequest,
  ValidateTransactionResponse,
  GetTransactionStatusRequest,
  GetTransactionStatusResponse,
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
  GetWalletInfoRequest,
  GetWalletInfoResponse,
  ApiResponse
} from '../../shared/types/api';
import { HTTP_STATUS, ERROR_CODES } from '../../shared/constants/protocol';

export function createBitcoinRoutes(bitcoinService: BitcoinService): Router {
  const router = Router();

  /**
   * POST /api/bitcoin/psbt
   * Generate PSBT for vault binding transaction
   */
  router.post('/psbt', async (req: Request, res: Response) => {
    try {
      const { 
        wallet_address, 
        amount_condition, 
        recipient_address 
      }: GeneratePSBTRequest = req.body;

      if (!wallet_address || !amount_condition) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'wallet_address and amount_condition are required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Generate PSBT
      const result = await bitcoinService.generatePSBT(
        wallet_address,
        amount_condition,
        recipient_address
      );

      const response: GeneratePSBTResponse = {
        psbt: result.psbt,
        selected_amount: result.selectedAmount
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<GeneratePSBTResponse>);

    } catch (error) {
      console.error('Error generating PSBT:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * POST /api/bitcoin/validate
   * Validate transaction for Proof-of-Access
   */
  router.post('/validate', async (req: Request, res: Response) => {
    try {
      const { 
        transaction, 
        vault_metadata 
      }: ValidateTransactionRequest = req.body;

      if (!transaction || !vault_metadata) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'transaction and vault_metadata are required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Validate transaction
      const validation = await bitcoinService.validateTransaction(
        transaction,
        vault_metadata.amount_condition,
        vault_metadata.authorized_wallet,
        vault_metadata.recipient_wallet
      );

      const response: ValidateTransactionResponse = {
        valid: validation.valid,
        errors: validation.errors,
        proof_of_access: {
          transaction,
          vault: null, // Would be populated with actual vault
          valid: validation.valid,
          errors: validation.errors,
          timestamp: Date.now()
        }
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<ValidateTransactionResponse>);

    } catch (error) {
      console.error('Error validating transaction:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * GET /api/bitcoin/status/:txid
   * Get transaction status and details
   */
  router.get('/status/:txid', async (req: Request, res: Response) => {
    try {
      const { txid } = req.params;

      if (!txid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Transaction ID is required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Get transaction status
      const transaction = await bitcoinService.getTransactionStatus(txid);
      
      const status = transaction.confirmations > 0 ? 'confirmed' : 'pending';

      const response: GetTransactionStatusResponse = {
        transaction,
        status
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<GetTransactionStatusResponse>);

    } catch (error) {
      console.error('Error getting transaction status:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * POST /api/bitcoin/broadcast
   * Broadcast signed transaction to network
   */
  router.post('/broadcast', async (req: Request, res: Response) => {
    try {
      const { raw_hex }: BroadcastTransactionRequest = req.body;

      if (!raw_hex) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'raw_hex is required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Broadcast transaction
      const txid = await bitcoinService.broadcastTransaction(raw_hex);

      const response: BroadcastTransactionResponse = {
        txid,
        success: true
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<BroadcastTransactionResponse>);

    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * GET /api/bitcoin/wallet/:address
   * Get wallet information including balance and UTXOs
   */
  router.get('/wallet/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Wallet address is required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Get wallet info
      const walletInfo = await bitcoinService.getWalletInfo(address);

      const response: GetWalletInfoResponse = {
        address: walletInfo.address,
        balance: walletInfo.balance,
        utxos: walletInfo.utxos,
        network: walletInfo.network
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<GetWalletInfoResponse>);

    } catch (error) {
      console.error('Error getting wallet info:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * GET /api/bitcoin/fees
   * Get current network fee estimates
   */
  router.get('/fees', async (req: Request, res: Response) => {
    try {
      // Get fee estimates for different confirmation targets
      const feeEstimates = {
        fast: 20000,    // 1-2 blocks (high priority)
        medium: 15000,  // 3-6 blocks (medium priority)
        slow: 10000     // 6+ blocks (low priority)
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: feeEstimates,
        timestamp: Date.now()
      } as ApiResponse);

    } catch (error) {
      console.error('Error getting fee estimates:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * GET /api/bitcoin/network
   * Get current network information
   */
  router.get('/network', async (req: Request, res: Response) => {
    try {
      const networkInfo = {
        network: 'testnet', // or 'mainnet'
        block_height: 850000, // Current block height
        difficulty: 1000000,  // Current difficulty
        hash_rate: '100 EH/s' // Current hash rate
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: networkInfo,
        timestamp: Date.now()
      } as ApiResponse);

    } catch (error) {
      console.error('Error getting network info:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * POST /api/bitcoin/address/validate
   * Validate Bitcoin address format
   */
  router.post('/address/validate', async (req: Request, res: Response) => {
    try {
      const { address, network } = req.body;

      if (!address) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Address is required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Validate address format
      const isValid = true; // Placeholder - implement proper validation
      const addressType = 'P2WPKH'; // Placeholder - detect address type

      const response = {
        valid: isValid,
        address,
        type: addressType,
        network: network || 'testnet'
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse);

    } catch (error) {
      console.error('Error validating address:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  return router;
}
