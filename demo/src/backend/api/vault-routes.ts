/**
 * Vault API Routes
 * Implements REST endpoints for vault operations
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { VaultService } from '../core/vault';
import { BitcoinService } from '../bitcoin/transaction';
import { 
  CreateVaultRequest,
  CreateVaultResponse,
  BindVaultRequest,
  BindVaultResponse,
  UnsealVaultRequest,
  UnsealVaultResponse,
  RebindVaultRequest,
  RebindVaultResponse,
  ListVaultsRequest,
  ListVaultsResponse,
  GetVaultRequest,
  GetVaultResponse,
  ApiResponse
} from '@shared/types/api';
import { HTTP_STATUS, ERROR_CODES } from '@shared/constants/protocol';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 100 // Maximum 100 files
  }
});

export function createVaultRoutes(
  vaultService: VaultService,
  bitcoinService: BitcoinService
): Router {
  const router = Router();

  /**
   * POST /api/vaults/seal
   * Create and seal a new vault
   */
  router.post('/seal', upload.array('files'), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'No files provided',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Parse metadata from request body
      const metadata = JSON.parse(req.body.metadata);
      
      // Convert multer files to FileData objects
      const fileObjects = files.map(file => ({
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        content: new Uint8Array(file.buffer)
      }));

      // Create vault
      const result = await vaultService.seal(fileObjects, metadata);

      // Generate PSBT for binding
      const psbtResult = await bitcoinService.generatePSBT(
        metadata.authorized_wallet === "ANY" ? req.body.wallet_address : metadata.authorized_wallet,
        metadata.amount_condition,
        metadata.recipient_wallet
      );

      const response: CreateVaultResponse = {
        vault_id: result.vault_id,
        seal_file: result.seal.ciphertext, // Return encrypted data
        psbt: psbtResult.psbt
      };

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<CreateVaultResponse>);

    } catch (error) {
      console.error('Error creating vault:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * POST /api/vaults/bind
   * Bind a draft vault to a Bitcoin transaction
   */
  router.post('/bind', async (req: Request, res: Response) => {
    try {
      const { vault_id, signed_transaction }: BindVaultRequest = req.body;

      if (!vault_id || !signed_transaction) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'vault_id and signed_transaction are required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Bind vault to transaction
      const vault = await vaultService.bind(vault_id, signed_transaction);

      const response: BindVaultResponse = {
        vault,
        finalized: true
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<BindVaultResponse>);

    } catch (error) {
      console.error('Error binding vault:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * POST /api/vaults/unseal
   * Attempt to unseal a vault with Proof-of-Access
   */
  router.post('/unseal', async (req: Request, res: Response) => {
    try {
      const { vault_id, unlock_transaction }: UnsealVaultRequest = req.body;

      if (!vault_id || !unlock_transaction) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'vault_id and unlock_transaction are required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Attempt to unseal vault
      const result = await vaultService.unseal(vault_id, unlock_transaction);

      const response: UnsealVaultResponse = {
        success: result.success,
        decrypted_files: result.decrypted_files?.map(file => ({
          name: file.name,
          content: file.content,
          mime_type: file.type,
          size: file.size
        })),
        proof_of_access: result.proof_of_access
      };

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.FORBIDDEN;

      res.status(statusCode).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<UnsealVaultResponse>);

    } catch (error) {
      console.error('Error unsealing vault:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * POST /api/vaults/rebind
   * Transfer vault ownership to a new wallet
   */
  router.post('/rebind', async (req: Request, res: Response) => {
    try {
      const rebindRequest: RebindVaultRequest = req.body;

      if (!rebindRequest.vault_id || !rebindRequest.new_transaction || !rebindRequest.old_wallet_signature) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'vault_id, new_transaction, and old_wallet_signature are required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Rebind vault
      const vault = await vaultService.rebind(rebindRequest);

      const response: RebindVaultResponse = {
        vault,
        new_vault_id: vault.id
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<RebindVaultResponse>);

    } catch (error) {
      console.error('Error rebinding vault:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * GET /api/vaults
   * List vaults with optional filters
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const {
        wallet_address,
        status,
        limit = 20,
        offset = 0
      } = req.query as any;

      const filters = {
        walletAddress: wallet_address,
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      // Get vaults from storage (this would be implemented in VaultService)
      const vaults: any[] = []; // Placeholder - implement vault listing
      const total = 0; // Placeholder - implement count

      const response: ListVaultsResponse = {
        vaults,
        total,
        limit: filters.limit,
        offset: filters.offset
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<ListVaultsResponse>);

    } catch (error) {
      console.error('Error listing vaults:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * GET /api/vaults/:id
   * Get vault details
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { include_metadata } = req.query;

      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Vault ID is required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Get vault (this would be implemented in VaultService)
      const vault = null; // Placeholder - implement vault retrieval
      
      if (!vault) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_CODES.VAULT_NOT_FOUND,
          timestamp: Date.now()
        } as ApiResponse);
      }

      const response: GetVaultResponse = {
        vault,
        unlock_attempts: include_metadata ? [] : undefined // Placeholder
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: response,
        timestamp: Date.now()
      } as ApiResponse<GetVaultResponse>);

    } catch (error) {
      console.error('Error getting vault:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  /**
   * GET /api/vaults/:id/metadata
   * Get vault metadata (if authorized)
   */
  router.get('/:id/metadata', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { wallet_address } = req.query;

      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Vault ID is required',
          timestamp: Date.now()
        } as ApiResponse);
      }

      // Get vault metadata (this would be implemented in VaultService)
      // Check authorization based on wallet_address
      const metadata = null; // Placeholder

      if (!metadata) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_CODES.VAULT_NOT_FOUND,
          timestamp: Date.now()
        } as ApiResponse);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: metadata,
        timestamp: Date.now()
      } as ApiResponse);

    } catch (error) {
      console.error('Error getting vault metadata:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      } as ApiResponse);
    }
  });

  return router;
}
