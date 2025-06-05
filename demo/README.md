# LOCK Protocol TypeScript Demo

A complete TypeScript implementation of the LOCK protocol with both backend API and frontend interface.

## Architecture Overview

This demo implements the LOCK protocol as defined in the specifications, providing:

- **Backend API**: Node.js/Express server implementing core LOCK protocol operations
- **Frontend UI**: React-based interface for vault management and Bitcoin wallet integration
- **Shared Libraries**: Common types, validation, and cryptographic utilities

## Project Structure

```
src/
├── backend/                 # Node.js/Express API server
│   ├── api/                # REST API endpoints
│   ├── core/               # Core LOCK protocol implementation
│   ├── crypto/             # Cryptographic utilities
│   ├── bitcoin/            # Bitcoin transaction handling
│   ├── storage/            # Vault storage and management
│   └── server.ts           # Main server entry point
├── frontend/               # React frontend application
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API client services
│   ├── utils/              # Frontend utilities
│   └── App.tsx             # Main React app
├── shared/                 # Shared code between backend/frontend
│   ├── types/              # TypeScript type definitions
│   ├── validation/         # Protocol validation logic
│   └── constants/          # Protocol constants
└── tests/                  # Test suites
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── e2e/                # End-to-end tests
```

## Core Features

### Backend API
- **Vault Operations**: Create, seal, bind, unseal, rebind vaults
- **Bitcoin Integration**: PSBT generation, transaction validation, blockchain queries
- **Cryptography**: AES-256-GCM encryption, ECDH key derivation, HKDF
- **Storage**: Vault metadata management, unlock counter tracking
- **Validation**: Proof-of-Access (PoA) validation engine

### Frontend Interface
- **Vault Creation**: File upload, metadata configuration, binding transaction
- **Wallet Integration**: Bitcoin wallet connection, transaction signing
- **Vault Management**: Browse vaults, view metadata, unlock attempts
- **Transaction Broadcasting**: PSBT signing and broadcast interface

## Protocol Implementation

This demo implements the complete LOCK protocol specification:

1. **SEAL Format**: Binary `.seal` files with AES-256-GCM encryption
2. **Vault Metadata**: Encrypted unlock conditions and access rules
3. **Binding Transactions**: Bitcoin transaction anchoring for vault ownership
4. **Proof-of-Access**: Transaction validation against vault conditions
5. **Rebinding**: Secure vault ownership transfer

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Bitcoin testnet access (for testing)

### Installation
```bash
# Install dependencies
npm install

# Build shared libraries
npm run build:shared

# Start backend server
npm run dev:backend

# Start frontend (in separate terminal)
npm run dev:frontend
```

### Configuration
Copy `.env.example` to `.env` and configure:
- Bitcoin network settings (testnet/mainnet)
- API endpoints
- Encryption parameters

## API Endpoints

### Vault Operations
- `POST /api/vaults/seal` - Create and seal a new vault
- `POST /api/vaults/bind` - Bind vault to Bitcoin transaction
- `POST /api/vaults/unseal` - Attempt to unseal vault with PoA
- `POST /api/vaults/rebind` - Transfer vault ownership

### Bitcoin Operations
- `POST /api/bitcoin/psbt` - Generate PSBT for vault binding
- `POST /api/bitcoin/validate` - Validate transaction for PoA
- `GET /api/bitcoin/status/:txid` - Check transaction status

### Vault Management
- `GET /api/vaults` - List accessible vaults
- `GET /api/vaults/:id` - Get vault details
- `GET /api/vaults/:id/metadata` - Get vault metadata (if authorized)

## Security Considerations

- All vault contents are encrypted with AES-256-GCM
- Private keys never leave the client browser/wallet
- Bitcoin transactions provide cryptographic proof of access
- Vault IDs are deterministically generated from content + metadata + TXID
- Time-locks use Bitcoin block height for tamper resistance

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Development

### Backend Development
```bash
npm run dev:backend    # Start with hot reload
npm run build:backend  # Build for production
```

### Frontend Development
```bash
npm run dev:frontend   # Start with hot reload
npm run build:frontend # Build for production
```

## Protocol Compliance

This implementation follows the LOCK protocol specifications:
- ✅ SEAL Format Specification
- ✅ Vault Metadata Specification  
- ✅ PoA Validation Rules
- ✅ Client Compliance Requirements
- ✅ Key Derivation Standards
- ✅ Rebinding Protocol

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## Support

For questions about the LOCK protocol implementation:
- Review the `/specs` directory for protocol details
- Check the `/diagrams` for visual protocol flows
- Refer to the whitepaper for conceptual overview
