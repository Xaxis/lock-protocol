import React, { useState } from 'react';

export function WalletPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState({
    address: '',
    balance: 0,
    network: 'testnet'
  });

  const connectWallet = async () => {
    try {
      // TODO: Implement actual wallet connection
      console.log('Connecting wallet...');
      
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWalletInfo({
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        balance: 0.001, // BTC
        network: 'testnet'
      });
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletInfo({ address: '', balance: 0, network: 'testnet' });
  };

  return (
    <div className="wallet-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Bitcoin Wallet</h1>
          <p className="card-subtitle">
            Connect your Bitcoin wallet to create and unlock vaults
          </p>
        </div>

        {!isConnected ? (
          <div className="text-center">
            <div className="mb-3">
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>👛</div>
              <h3>Connect Your Wallet</h3>
              <p>
                Connect a Bitcoin wallet to start using the LOCK protocol.
                Your private keys never leave your wallet.
              </p>
            </div>

            <div className="grid grid-2" style={{ gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
              <button className="btn btn-primary" onClick={connectWallet}>
                Browser Wallet
              </button>
              <button className="btn btn-outline" disabled>
                Hardware Wallet
              </button>
            </div>

            <div className="alert alert-info mt-3">
              <strong>Demo Mode:</strong> This demo uses simulated wallet connections.
              In production, this would integrate with real Bitcoin wallets like
              MetaMask, Unisat, or hardware wallets.
            </div>
          </div>
        ) : (
          <div>
            <div className="alert alert-success">
              <strong>✅ Wallet Connected</strong>
            </div>

            <div className="grid grid-2">
              <div>
                <h3>Wallet Information</h3>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <div className="form-input" style={{ 
                    backgroundColor: '#f8f9fa', 
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    wordBreak: 'break-all'
                  }}>
                    {walletInfo.address}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Balance</label>
                  <div className="form-input" style={{ backgroundColor: '#f8f9fa' }}>
                    {walletInfo.balance} BTC ({(walletInfo.balance * 100000000).toLocaleString()} sats)
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Network</label>
                  <div className="form-input" style={{ backgroundColor: '#f8f9fa' }}>
                    {walletInfo.network}
                  </div>
                </div>
              </div>

              <div>
                <h3>Quick Actions</h3>
                <div className="d-flex flex-column" style={{ gap: '12px' }}>
                  <a href="/create" className="btn btn-primary">
                    Create New Vault
                  </a>
                  <a href="/vaults" className="btn btn-outline">
                    View My Vaults
                  </a>
                  <a href="/unlock" className="btn btn-outline">
                    Unlock Vault
                  </a>
                  <button className="btn btn-secondary" onClick={disconnectWallet}>
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3>Recent Transactions</h3>
              <div className="card">
                <div className="text-center p-3">
                  <p>No recent transactions</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Vault-related transactions will appear here
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Integration Info */}
      <div className="card mt-4">
        <div className="card-header">
          <h2 className="card-title">Supported Wallets</h2>
        </div>
        
        <div className="grid grid-3">
          <div className="text-center">
            <h4>🌐 Browser Wallets</h4>
            <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
              <li>Unisat Wallet</li>
              <li>OKX Wallet</li>
              <li>Xverse</li>
              <li>Hiro Wallet</li>
            </ul>
          </div>
          
          <div className="text-center">
            <h4>🔒 Hardware Wallets</h4>
            <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
              <li>Ledger</li>
              <li>Trezor</li>
              <li>BitBox</li>
              <li>ColdCard</li>
            </ul>
          </div>
          
          <div className="text-center">
            <h4>📱 Mobile Wallets</h4>
            <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
              <li>Blue Wallet</li>
              <li>Muun Wallet</li>
              <li>Phoenix</li>
              <li>Breez</li>
            </ul>
          </div>
        </div>
        
        <div className="alert alert-warning mt-3">
          <strong>Security Note:</strong> Always verify wallet connections and transaction
          details before signing. The LOCK protocol never requests your private keys.
        </div>
      </div>
    </div>
  );
}
