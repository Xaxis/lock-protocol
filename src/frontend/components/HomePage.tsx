import React from 'react';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="text-center mb-4">
        <h1>LOCK Protocol Demo</h1>
        <p className="text-secondary mb-3">
          Verifiable Access Through Proof-of-Work, Not Permission
        </p>
        <p className="mb-4">
          Experience the future of digital access control with Bitcoin-based vault unlocking.
          Create encrypted vaults that can only be opened with valid Bitcoin transactions.
        </p>
        <div className="d-flex justify-center" style={{ gap: '16px' }}>
          <Link to="/create" className="btn btn-primary btn-lg">
            Create Your First Vault
          </Link>
          <Link to="/unlock" className="btn btn-outline btn-lg">
            Unlock a Vault
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-3 mt-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔐 Sovereign Access</h3>
          </div>
          <p>
            Your vault, your rules. Access is enforced by Bitcoin's proof-of-work,
            not by centralized servers or permissions.
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>No passwords to remember</li>
            <li>No accounts to manage</li>
            <li>No servers to trust</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚡ Bitcoin-Powered</h3>
          </div>
          <p>
            Unlock vaults by broadcasting Bitcoin transactions that meet
            cryptographic conditions. Energy and ownership become your keys.
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Proof-of-Access validation</li>
            <li>Time-locked releases</li>
            <li>Amount-based conditions</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🛡️ Cryptographically Secure</h3>
          </div>
          <p>
            Files are encrypted with AES-256-GCM. Vault metadata is tamper-proof.
            Everything is verifiable and auditable.
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Military-grade encryption</li>
            <li>Deterministic vault IDs</li>
            <li>Immutable access rules</li>
          </ul>
        </div>
      </section>

      {/* How It Works */}
      <section className="mt-4">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">How LOCK Protocol Works</h2>
          </div>
          
          <div className="grid grid-2">
            <div>
              <h3>1. Seal Your Files</h3>
              <p>
                Upload files and define unlock conditions: which Bitcoin addresses
                can unlock it, how much they need to spend, and optional time-locks.
              </p>
              
              <h3>2. Bind to Bitcoin</h3>
              <p>
                Sign a Bitcoin transaction to cryptographically bind the vault
                to your wallet. This creates an immutable ownership record.
              </p>
            </div>
            
            <div>
              <h3>3. Share the Vault</h3>
              <p>
                The encrypted vault can be stored anywhere - cloud storage,
                USB drives, or even printed as QR codes. The unlock logic
                lives on Bitcoin.
              </p>
              
              <h3>4. Unlock with Bitcoin</h3>
              <p>
                To access the files, broadcast a Bitcoin transaction that
                meets the vault's conditions. Valid transactions automatically
                decrypt the contents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="mt-4">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Use Cases</h2>
          </div>
          
          <div className="grid grid-3">
            <div>
              <h4>🎯 Digital Inheritance</h4>
              <p>
                Create time-locked vaults that automatically become accessible
                to beneficiaries after a specific Bitcoin block height.
              </p>
            </div>
            
            <div>
              <h4>💼 Escrow Services</h4>
              <p>
                Lock documents or instructions that only unlock when payment
                conditions are met on the Bitcoin blockchain.
              </p>
            </div>
            
            <div>
              <h4>🔒 Secure Backup</h4>
              <p>
                Store encrypted backups that require proof of wallet ownership
                to access, eliminating password-based vulnerabilities.
              </p>
            </div>
            
            <div>
              <h4>📜 Dead Drops</h4>
              <p>
                Share sensitive information that can only be accessed by
                specific Bitcoin addresses at predetermined times.
              </p>
            </div>
            
            <div>
              <h4>🎮 Gaming & NFTs</h4>
              <p>
                Create unlockable content tied to Bitcoin transactions,
                enabling new forms of digital ownership and rewards.
              </p>
            </div>
            
            <div>
              <h4>🏢 Enterprise Access</h4>
              <p>
                Implement tamper-proof access control for sensitive corporate
                data using Bitcoin-based authentication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Info */}
      <section className="mt-4">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Protocol Specifications</h2>
          </div>
          
          <div className="grid grid-2">
            <div>
              <h4>Core Features</h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li>AES-256-GCM encryption</li>
                <li>Bitcoin transaction validation</li>
                <li>PSBT (Partially Signed Bitcoin Transaction) support</li>
                <li>Deterministic vault ID generation</li>
                <li>Rebinding for ownership transfer</li>
                <li>Time-lock support via block height</li>
              </ul>
            </div>
            
            <div>
              <h4>Network Support</h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Bitcoin Testnet (for development)</li>
                <li>Bitcoin Mainnet (for production)</li>
                <li>Hardware wallet integration</li>
                <li>Web wallet compatibility</li>
                <li>Mobile wallet support</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-3">
            <p>
              <strong>Open Source:</strong> This implementation follows the complete
              LOCK protocol specification. View the source code, specifications,
              and contribute to the project on GitHub.
            </p>
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className="text-center mt-4">
        <div className="card">
          <h2>Ready to Get Started?</h2>
          <p className="mb-3">
            Create your first Bitcoin-secured vault in minutes.
            No registration required - just connect your wallet and start sealing files.
          </p>
          <div className="d-flex justify-center" style={{ gap: '16px' }}>
            <Link to="/wallet" className="btn btn-secondary">
              Connect Wallet
            </Link>
            <Link to="/create" className="btn btn-primary">
              Create Vault
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
