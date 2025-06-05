/**
 * Jest test setup file
 * Configures global test environment and utilities
 */

import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock File API for Node.js tests
global.File = class MockFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  
  constructor(bits: any[], filename: string, options: any = {}) {
    this.name = filename;
    this.type = options.type || '';
    this.size = bits.reduce((size, bit) => size + (bit.length || bit.byteLength || 0), 0);
    this.lastModified = Date.now();
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
  
  stream() {
    return new ReadableStream();
  }
  
  text() {
    return Promise.resolve('');
  }
} as any;

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  createMockFile: (name: string, content: string = '', type: string = 'text/plain') => {
    return new File([content], name, { type });
  },
  
  createMockVault: (overrides: any = {}) => {
    return {
      id: 'test_vault_123',
      status: 'active',
      metadata: {
        authorized_wallet: 'bc1qtest123',
        amount_condition: { type: 'fixed', amount: 10000 },
        created_at: Date.now(),
        ...overrides.metadata
      },
      unlock_count: 0,
      seal: {
        magic: 'SEAL',
        version: 1,
        encryption_algo: 'AES-256-GCM',
        nonce: new Uint8Array(12),
        ciphertext: new Uint8Array(100),
        integrity_tag: new Uint8Array(16)
      },
      ...overrides
    };
  },
  
  createMockTransaction: (overrides: any = {}) => {
    return {
      txid: 'test_tx_123',
      raw_hex: '0100000001...',
      inputs: [{
        prev_txid: 'prev_tx_123',
        prev_vout: 0,
        script_sig: '',
        witness: [],
        value: 100000,
        address: 'bc1qtest123'
      }],
      outputs: [{
        value: 90000,
        script_pubkey: '',
        address: 'bc1qtest456',
        vout: 0
      }],
      confirmations: 1,
      fee: 10000,
      ...overrides
    };
  }
};

// Declare global types for TypeScript
declare global {
  var testUtils: {
    createMockFile: (name: string, content?: string, type?: string) => File;
    createMockVault: (overrides?: any) => any;
    createMockTransaction: (overrides?: any) => any;
  };
}
