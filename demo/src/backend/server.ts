/**
 * LOCK Protocol Demo Server
 * Main Express server with all API routes and middleware
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer, Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';

import { VaultService } from './core/vault';
import { CryptoService } from './crypto/encryption';
import { BitcoinService } from './bitcoin/transaction';
import { FileVaultStorage, MemoryVaultStorage } from './storage/vault-storage';
import { createVaultRoutes } from './api/vault-routes';
import { createBitcoinRoutes } from './api/bitcoin-routes';
import { API_BASE_PATH, HTTP_STATUS } from '@shared/constants/protocol';
import { ApiResponse } from '@shared/types/api';

// Load environment variables
dotenv.config();

// Extend Express Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

class LockProtocolServer {
  private app: express.Application;
  private server!: Server;
  private wss!: WebSocketServer;
  private vaultService!: VaultService;
  private bitcoinService!: BitcoinService;
  private cryptoService!: CryptoService;

  constructor() {
    this.app = express();
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Initialize core services
   */
  private initializeServices(): void {
    // Initialize crypto service
    this.cryptoService = new CryptoService();

    // Initialize storage (use memory storage for demo, file storage for persistence)
    const useFileStorage = process.env.USE_FILE_STORAGE === 'true';
    const storage = useFileStorage 
      ? new FileVaultStorage(process.env.STORAGE_DIR || './data')
      : new MemoryVaultStorage();

    // Initialize vault service
    this.vaultService = new VaultService(this.cryptoService, storage);

    // Initialize Bitcoin service
    const network = (process.env.BITCOIN_NETWORK as 'testnet' | 'mainnet') || 'testnet';
    const rpcUrl = process.env.BITCOIN_RPC_URL;
    const rpcAuth = process.env.BITCOIN_RPC_USER && process.env.BITCOIN_RPC_PASSWORD 
      ? { user: process.env.BITCOIN_RPC_USER, password: process.env.BITCOIN_RPC_PASSWORD }
      : undefined;

    this.bitcoinService = new BitcoinService(network, rpcUrl, rpcAuth);
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));

    // CORS configuration
    const corsOptions = {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };
    this.app.use(cors(corsOptions));

    // Request parsing
    this.app.use(express.json({ limit: '100mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));

    // Logging
    this.app.use(morgan('combined'));

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: Date.now(),
          version: process.env.npm_package_version || '1.0.0',
          uptime: process.uptime()
        },
        timestamp: Date.now()
      } as ApiResponse);
    });

    // API documentation endpoint
    this.app.get('/api', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          name: 'LOCK Protocol API',
          version: '1.0.0',
          description: 'REST API for LOCK protocol vault operations',
          endpoints: {
            vaults: `${API_BASE_PATH}/vaults`,
            bitcoin: `${API_BASE_PATH}/bitcoin`,
            health: '/health'
          },
          documentation: '/api/docs'
        },
        timestamp: Date.now()
      } as ApiResponse);
    });

    // Mount API routes
    this.app.use(`${API_BASE_PATH}/vaults`, createVaultRoutes(this.vaultService, this.bitcoinService));
    this.app.use(`${API_BASE_PATH}/bitcoin`, createBitcoinRoutes(this.bitcoinService));

    // Serve static files (for frontend)
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static('dist/frontend'));

      // Catch-all handler for SPA routing
      this.app.get('*', (req: Request, res: Response) => {
        res.sendFile('index.html', { root: 'dist/frontend' });
      });
    }

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: `Route not found: ${req.method} ${req.originalUrl}`,
        timestamp: Date.now()
      } as ApiResponse);
    });
  }

  /**
   * Setup WebSocket server for real-time updates
   */
  private setupWebSocket(): void {
    if (!this.server) {
      throw new Error('HTTP server must be created before WebSocket setup');
    }

    this.wss = new WebSocketServer({
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('WebSocket client connected:', req.socket.remoteAddress);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        payload: {
          message: 'Connected to LOCK Protocol WebSocket',
          timestamp: Date.now()
        },
        timestamp: Date.now()
      }));

      // Handle client messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Invalid message format' },
            timestamp: Date.now()
          }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  /**
   * Handle WebSocket messages from clients
   */
  private handleWebSocketMessage(ws: WebSocket, message: WebSocketMessage): void {
    switch (message.type) {
      case 'subscribe_vault':
        // Subscribe to vault updates
        console.log('Client subscribed to vault:', message.payload?.vault_id);
        break;

      case 'subscribe_transaction':
        // Subscribe to transaction updates
        console.log('Client subscribed to transaction:', message.payload?.txid);
        break;

      case 'ping':
        // Respond to ping
        ws.send(JSON.stringify({
          type: 'pong',
          payload: { timestamp: Date.now() },
          timestamp: Date.now()
        }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          payload: { error: `Unknown message type: ${message.type}` },
          timestamp: Date.now()
        }));
    }
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message,
        timestamp: Date.now()
      } as ApiResponse);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  /**
   * Start the server
   */
  public start(): void {
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || 'localhost';

    // Create HTTP server
    this.server = createServer(this.app);

    // Setup WebSocket after server creation
    this.setupWebSocket();

    this.server.listen(port, host, () => {
      console.log(`🚀 LOCK Protocol server running on http://${host}:${port}`);
      console.log(`📡 WebSocket server available at ws://${host}:${port}/ws`);
      console.log(`🔗 API endpoints available at http://${host}:${port}${API_BASE_PATH}`);
      console.log(`🏥 Health check available at http://${host}:${port}/health`);

      if (process.env.NODE_ENV === 'development') {
        console.log(`📚 API documentation: http://${host}:${port}/api`);
      }
    });
  }

  /**
   * Graceful shutdown
   */
  private shutdown(): void {
    console.log('Shutting down server...');

    // Close WebSocket server if it exists
    if (this.wss) {
      this.wss.close(() => {
        console.log('WebSocket server closed');
      });
    }

    // Close HTTP server if it exists
    if (this.server) {
      this.server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new LockProtocolServer();
  server.start();
}

export default LockProtocolServer;
