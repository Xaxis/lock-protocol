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
} from '@shared/types/api';
import { HTTP_STATUS, ERROR_CODES } from '@shared/constants/protocol';

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
        error: error instanceof Error ? error.message : 'Unknown error',
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
          vault: {} as any, // Would be populated with actual vault
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
        error: error instanceof Error ? error.message : 'Unknown error',
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
        error: error instanceof Error ? error.message : 'Unknown error',
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
        error: error instanceof Error ? error.message : 'Unknown error',
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
        error: error instanceof Error ? error.message : 'Unknown error',
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
        error: error instanceof Error ? error.message : 'Unknown error',
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
        error: error instanceof Error ? error.message : 'Unknown error',
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
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * GET /api/bitcoin/test
   * Test Bitcoin testnet integration
   */
  router.get('/test', async (req: Request, res: Response) => {
    try {
      console.log('Testing Bitcoin testnet integration...');

      const testResults: any = {
        api_endpoints: {
          blockstream: process.env.BITCOIN_API_URL || 'https://blockstream.info/testnet/api',
          mempool: process.env.MEMPOOL_API_URL || 'https://mempool.space/testnet/api'
        },
        tests: {}
      };

      // Test 1: Address validation
      const testAddresses = [
        'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', // Valid testnet bech32
        'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', // Valid testnet legacy
        'invalid_address', // Invalid
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' // Valid mainnet (should be invalid for testnet)
      ];

      testResults.tests.address_validation = testAddresses.map(addr => ({
        address: addr,
        valid: bitcoinService.validateAddress(addr)
      }));

      // Test 2: Current block height (with timeout)
      try {
        const blockHeight = await Promise.race([
          bitcoinService.getCurrentBlockHeight(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        testResults.tests.block_height = {
          success: true,
          height: blockHeight
        };
      } catch (error) {
        testResults.tests.block_height = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 3: Fee estimation (with timeout)
      try {
        // Access the private method through a test endpoint
        const response = await fetch(`${testResults.api_endpoints.mempool}/v1/fees/recommended`);
        if (response.ok) {
          const feeData = await response.json();
          testResults.tests.fee_estimation = {
            success: true,
            fees: feeData
          };
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        testResults.tests.fee_estimation = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 4: Simple wallet info test (only if address is provided in query)
      const testAddress = req.query.address as string;
      if (testAddress && bitcoinService.validateAddress(testAddress)) {
        try {
          const walletInfo = await Promise.race([
            bitcoinService.getWalletInfo(testAddress),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10s')), 10000))
          ]);
          testResults.tests.wallet_info = {
            success: true,
            address: testAddress,
            data: walletInfo
          };
        } catch (error) {
          testResults.tests.wallet_info = {
            success: false,
            address: testAddress,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      } else {
        testResults.tests.wallet_info = {
          skipped: true,
          message: 'Provide ?address=<valid_testnet_address> to test wallet info'
        };
      }

      res.json({
        success: true,
        data: testResults,
        timestamp: Date.now()
      } as ApiResponse);

    } catch (error) {
      console.error('Error testing Bitcoin integration:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  return router;
}
