import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { apiService, TransactionHistoryResponse, BitcoinTransaction } from '../services/api';
import { AddressFormGroup } from './AddressDisplay';

export function WalletPage() {
  const {
    isConnected,
    connection,
    walletInfo,
    isConnecting,
    isLoadingWalletInfo,
    error,
    connectDemoWallet,
    connectBrowserWallet,
    disconnect,
    refreshWalletInfo,
    clearError,
    formatBalance,
    formatAddress
  } = useWallet();

  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingBitcoin, setIsTestingBitcoin] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<BitcoinTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const testBitcoinIntegration = async () => {
    setIsTestingBitcoin(true);
    try {
      const address = connection?.address;
      const results = await apiService.testBitcoinIntegration(address);
      setTestResults(results);
    } catch (error) {
      console.error('Bitcoin test failed:', error);
      alert('Bitcoin test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsTestingBitcoin(false);
    }
  };

  const loadTransactionHistory = async () => {
    if (!connection?.address) return;

    setIsLoadingTransactions(true);
    setTransactionError(null);

    try {
      const response = await apiService.getTransactionHistory(connection.address, 10);
      setTransactionHistory(response.transactions);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      setTransactionError(error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Load transaction history when wallet is connected
  useEffect(() => {
    if (isConnected && connection?.address && !isLoadingWalletInfo) {
      loadTransactionHistory();
    }
  }, [isConnected, connection?.address, isLoadingWalletInfo]);

  return (
    <div className="wallet-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Bitcoin Wallet</h1>
          <p className="card-subtitle">
            Connect your Bitcoin wallet to create and unlock vaults
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
            <button
              className="btn btn-sm btn-outline ml-2"
              onClick={clearError}
            >
              Dismiss
            </button>
          </div>
        )}

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
              <button
                className="btn btn-primary"
                onClick={connectDemoWallet}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className="spinner"></div>
                    Connecting...
                  </>
                ) : (
                  'Demo Wallet (Testnet)'
                )}
              </button>
              <button
                className="btn btn-outline"
                onClick={connectBrowserWallet}
                disabled={isConnecting}
              >
                Browser Wallet
              </button>
            </div>

            <div className="alert alert-info mt-3">
              <strong>Testnet Mode:</strong> This demo uses Bitcoin testnet for safe testing.
              Demo wallet provides a simulated connection with real testnet addresses.
              Browser wallet connects to Unisat, OKX, or other compatible wallets.
            </div>
          </div>
        ) : (
          <div>
            <div className="alert alert-success">
              <strong>✅ Wallet Connected</strong> ({connection?.walletType})
            </div>

            {isLoadingWalletInfo ? (
              <div className="text-center p-3">
                <div className="spinner"></div>
                <p>Loading wallet information...</p>
              </div>
            ) : (
              <div className="grid grid-2">
                <div>
                  <h3>Wallet Information</h3>
                  <AddressFormGroup
                    address={connection?.address || ''}
                    label="Address"
                  />

                  <div className="form-group">
                    <label className="form-label">Balance</label>
                    <div className="form-input" style={{ backgroundColor: '#f8f9fa' }}>
                      {walletInfo ? formatBalance(walletInfo.balance) : 'Loading...'}
                      {walletInfo?.confirmed_balance !== undefined && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Confirmed: {formatBalance(walletInfo.confirmed_balance)}
                          {walletInfo.unconfirmed_balance! > 0 && (
                            <>, Unconfirmed: {formatBalance(walletInfo.unconfirmed_balance!)}</>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Network</label>
                    <div className="form-input" style={{ backgroundColor: '#f8f9fa' }}>
                      {connection?.network}
                    </div>
                  </div>

                  {walletInfo && (
                    <div className="form-group">
                      <label className="form-label">Statistics</label>
                      <div className="form-input" style={{ backgroundColor: '#f8f9fa' }}>
                        <div>UTXOs: {walletInfo.utxos?.length || 0}</div>
                        <div>Transactions: {walletInfo.transaction_count || 0}</div>
                        {walletInfo.total_received !== undefined && (
                          <div>Total Received: {formatBalance(walletInfo.total_received)}</div>
                        )}
                      </div>
                    </div>
                  )}
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
                    <button
                      className="btn btn-outline"
                      onClick={refreshWalletInfo}
                      disabled={isLoadingWalletInfo}
                    >
                      {isLoadingWalletInfo ? 'Refreshing...' : 'Refresh Balance'}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={testBitcoinIntegration}
                      disabled={isTestingBitcoin}
                    >
                      {isTestingBitcoin ? 'Testing...' : 'Test Bitcoin API'}
                    </button>
                    <button className="btn btn-secondary" onClick={disconnect}>
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              </div>
            )}

            {testResults && (
              <div className="mt-4">
                <h3>Bitcoin Integration Test Results</h3>
                <div className="card">
                  <div className="p-3">
                    <div className="grid grid-2">
                      <div>
                        <h4>Address Validation</h4>
                        {testResults.tests?.address_validation?.map((test: any, index: number) => (
                          <div key={index} style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'monospace' }}>{formatAddress(test.address)}</span>
                            <span style={{ color: test.valid ? 'green' : 'red', marginLeft: '8px' }}>
                              {test.valid ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4>Network Status</h4>
                        <div style={{ fontSize: '0.9rem' }}>
                          <div>Block Height: {testResults.tests?.block_height?.success ?
                            testResults.tests.block_height.height : 'Failed'}</div>
                          <div>Fee Estimation: {testResults.tests?.fee_estimation?.success ?
                            `${testResults.tests.fee_estimation.fees.halfHourFee} sat/vB` : 'Failed'}</div>
                        </div>
                      </div>
                    </div>
                    {testResults.tests?.wallet_info && !testResults.tests.wallet_info.skipped && (
                      <div className="mt-3">
                        <h4>Wallet Test</h4>
                        <div style={{ fontSize: '0.9rem' }}>
                          {testResults.tests.wallet_info.success ? (
                            <div style={{ color: 'green' }}>✓ Wallet info loaded successfully</div>
                          ) : (
                            <div style={{ color: 'red' }}>✗ {testResults.tests.wallet_info.error}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Recent Transactions</h3>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={loadTransactionHistory}
                  disabled={isLoadingTransactions}
                >
                  {isLoadingTransactions ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              <div className="card">
                {isLoadingTransactions ? (
                  <div className="text-center p-3">
                    <div className="spinner"></div>
                    <p>Loading transaction history...</p>
                  </div>
                ) : transactionError ? (
                  <div className="text-center p-3">
                    <div className="alert alert-error">
                      <strong>Error:</strong> {transactionError}
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={loadTransactionHistory}
                    >
                      Try Again
                    </button>
                  </div>
                ) : transactionHistory.length === 0 ? (
                  <div className="text-center p-3">
                    <p>No recent transactions</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Vault-related transactions will appear here
                    </p>
                  </div>
                ) : (
                  <div>
                    {transactionHistory.map((tx, index) => (
                      <div key={tx.txid} className={`p-3 ${index > 0 ? 'border-top' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '4px' }}>
                              <strong>TX:</strong> {formatAddress(tx.txid)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                              {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : 'Unknown time'}
                              {tx.block_height && (
                                <> • Block {tx.block_height.toLocaleString()}</>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }}>
                              <div>
                                <strong>Inputs:</strong> {tx.inputs.length}
                                {tx.inputs.length > 0 && (
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {formatBalance(tx.inputs.reduce((sum, input) => sum + input.value, 0))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <strong>Outputs:</strong> {tx.outputs.length}
                                {tx.outputs.length > 0 && (
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {formatBalance(tx.outputs.reduce((sum, output) => sum + output.value, 0))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <strong>Fee:</strong> {formatBalance(tx.fee)}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor: tx.confirmations > 0 ? '#d4edda' : '#fff3cd',
                              color: tx.confirmations > 0 ? '#155724' : '#856404'
                            }}>
                              {tx.confirmations > 0 ? `${tx.confirmations} confirmations` : 'Unconfirmed'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
