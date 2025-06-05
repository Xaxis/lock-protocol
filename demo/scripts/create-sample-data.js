/**
 * Script to create sample vault data for testing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Ensure data directories exist
const dataDir = path.join(__dirname, '../data');
const vaultsDir = path.join(dataDir, 'vaults');
const attemptsDir = path.join(dataDir, 'attempts');

[dataDir, vaultsDir, attemptsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Sample vault data
const sampleVaults = [
  {
    id: 'vault_demo_001',
    status: 'active',
    metadata: {
      description: 'Important Documents Backup',
      authorized_wallet: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      amount_condition: {
        type: 'fixed',
        amount: 10000
      },
      recipient_wallet: '',
      time_lock: null,
      unlock_limit: 3,
      created_at: Date.now() - 86400000 // 1 day ago
    },
    seal: {
      nonce: Array.from(crypto.randomBytes(12)),
      ciphertext: Array.from(crypto.randomBytes(256)),
      integrity_tag: Array.from(crypto.randomBytes(16)),
      encryption_algo: 'AES-256-GCM'
    },
    binding_transaction: {
      txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      confirmed: true,
      block_height: 4407800
    },
    unlock_count: 0,
    stored_at: Date.now() - 86400000,
    updated_at: Date.now() - 86400000
  },
  {
    id: 'vault_demo_002',
    status: 'active',
    metadata: {
      description: 'Family Photos Collection',
      authorized_wallet: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      amount_condition: {
        type: 'range',
        min: 5000,
        max: 15000
      },
      recipient_wallet: '',
      time_lock: null,
      unlock_limit: 5,
      created_at: Date.now() - 172800000 // 2 days ago
    },
    seal: {
      nonce: Array.from(crypto.randomBytes(12)),
      ciphertext: Array.from(crypto.randomBytes(512)),
      integrity_tag: Array.from(crypto.randomBytes(16)),
      encryption_algo: 'AES-256-GCM'
    },
    binding_transaction: {
      txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      confirmed: true,
      block_height: 4407750
    },
    unlock_count: 1,
    stored_at: Date.now() - 172800000,
    updated_at: Date.now() - 86400000
  },
  {
    id: 'vault_demo_003',
    status: 'bound',
    metadata: {
      description: 'Secret Project Files',
      authorized_wallet: 'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef',
      amount_condition: {
        type: 'any'
      },
      recipient_wallet: '',
      time_lock: 4408000, // Future block
      unlock_limit: 1,
      created_at: Date.now() - 259200000 // 3 days ago
    },
    seal: {
      nonce: Array.from(crypto.randomBytes(12)),
      ciphertext: Array.from(crypto.randomBytes(128)),
      integrity_tag: Array.from(crypto.randomBytes(16)),
      encryption_algo: 'AES-256-GCM'
    },
    binding_transaction: {
      txid: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      confirmed: false,
      block_height: null
    },
    unlock_count: 0,
    stored_at: Date.now() - 259200000,
    updated_at: Date.now() - 259200000
  },
  {
    id: 'vault_demo_004',
    status: 'exhausted',
    metadata: {
      description: 'One-time Secret Message',
      authorized_wallet: 'ANY',
      amount_condition: {
        type: 'fixed',
        amount: 1000
      },
      recipient_wallet: '',
      time_lock: null,
      unlock_limit: 1,
      created_at: Date.now() - 345600000 // 4 days ago
    },
    seal: {
      nonce: Array.from(crypto.randomBytes(12)),
      ciphertext: Array.from(crypto.randomBytes(64)),
      integrity_tag: Array.from(crypto.randomBytes(16)),
      encryption_algo: 'AES-256-GCM'
    },
    binding_transaction: {
      txid: '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      confirmed: true,
      block_height: 4407700
    },
    unlock_count: 1,
    last_unlocked: Date.now() - 86400000,
    stored_at: Date.now() - 345600000,
    updated_at: Date.now() - 86400000
  }
];

// Create vault files
sampleVaults.forEach(vault => {
  const filePath = path.join(vaultsDir, `${vault.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(vault, null, 2));
  console.log(`Created vault: ${vault.id}`);
});

// Create some sample unlock attempts
const sampleAttempts = [
  {
    vault_id: 'vault_demo_002',
    attempts: [
      {
        transaction_id: 'attempt_tx_001',
        wallet_address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount_spent: 7500,
        success: true,
        timestamp: Date.now() - 86400000,
        error: null
      }
    ]
  },
  {
    vault_id: 'vault_demo_004',
    attempts: [
      {
        transaction_id: 'attempt_tx_002',
        wallet_address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sL5k7',
        amount_spent: 1000,
        success: true,
        timestamp: Date.now() - 86400000,
        error: null
      }
    ]
  }
];

sampleAttempts.forEach(({ vault_id, attempts }) => {
  const filePath = path.join(attemptsDir, `${vault_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(attempts, null, 2));
  console.log(`Created unlock attempts for: ${vault_id}`);
});

console.log('\n✅ Sample data created successfully!');
console.log(`📁 Data directory: ${dataDir}`);
console.log(`🔒 Vaults: ${sampleVaults.length}`);
console.log(`🔓 Unlock attempts: ${sampleAttempts.length}`);
console.log('\nYou can now:');
console.log('1. Visit http://localhost:3000/wallet to connect a demo wallet');
console.log('2. Visit http://localhost:3000/vaults to see your vaults');
console.log('3. Visit http://localhost:3000/create to create new vaults');
console.log('4. Visit http://localhost:3000/unlock to unlock vaults');
