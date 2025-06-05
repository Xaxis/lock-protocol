import React, { useState, useEffect } from 'react';
import { useWallet, useWalletOperations } from '../contexts/WalletContext';
import { apiService } from '../services/api';

export function CreateVaultPage() {
  const { isConnected, connection, walletInfo } = useWallet();
  const { getCurrentAddress, signTransaction } = useWalletOperations();

  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState({
    authorized_wallet: '',
    amount_condition: {
      type: 'fixed',
      amount: 10000 // 10,000 satoshis
    },
    recipient_wallet: '',
    time_lock: '',
    unlock_limit: 1,
    description: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<'form' | 'creating' | 'signing' | 'complete'>('form');
  const [vaultResult, setVaultResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill authorized wallet with current wallet address
  useEffect(() => {
    if (isConnected && connection && !metadata.authorized_wallet) {
      setMetadata(prev => ({
        ...prev,
        authorized_wallet: connection.address
      }));
    }
  }, [isConnected, connection]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  const handleMetadataChange = (field: string, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmountConditionChange = (field: string, value: any) => {
    setMetadata(prev => ({
      ...prev,
      amount_condition: {
        ...prev.amount_condition,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    setCreationStep('creating');
    setError(null);

    try {
      console.log('Creating vault with:', { files, metadata });

      // Step 1: Create vault
      const result = await apiService.createVault({
        files,
        metadata: {
          ...metadata,
          time_lock: metadata.time_lock ? parseInt(metadata.time_lock) : undefined
        }
      });

      setVaultResult(result);
      setCreationStep('signing');

      // Step 2: Sign the binding transaction if required
      if (result.binding_transaction_required && result.psbt) {
        try {
          const signedResult = await signTransaction(result.psbt);

          // Step 3: Finalize vault with signed transaction
          await apiService.finalizeVault(result.vault_id, signedResult.rawTransaction);

          setCreationStep('complete');
        } catch (signError) {
          console.error('Error signing transaction:', signError);
          setError('Failed to sign transaction: ' + (signError instanceof Error ? signError.message : 'Unknown error'));
          setCreationStep('form');
        }
      } else {
        setCreationStep('complete');
      }

    } catch (error) {
      console.error('Error creating vault:', error);
      setError('Error creating vault: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setCreationStep('form');
    } finally {
      setIsCreating(false);
    }
  };

  // Show wallet connection requirement
  if (!isConnected) {
    return (
      <div className="create-vault-page">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Create New Vault</h1>
            <p className="card-subtitle">
              Connect your wallet to create encrypted vaults
            </p>
          </div>

          <div className="text-center p-4">
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
            <h3>Wallet Required</h3>
            <p>You need to connect a Bitcoin wallet to create vaults.</p>
            <a href="/wallet" className="btn btn-primary mt-3">
              Connect Wallet
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show creation success
  if (creationStep === 'complete' && vaultResult) {
    return (
      <div className="create-vault-page">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Vault Created Successfully! 🎉</h1>
          </div>

          <div className="text-center p-4">
            <div className="alert alert-success">
              <strong>Your vault has been created and secured!</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Vault ID</label>
              <div className="form-input" style={{
                backgroundColor: '#f8f9fa',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {vaultResult.vault_id}
              </div>
            </div>

            <div className="d-flex" style={{ gap: '12px', justifyContent: 'center' }}>
              <a href={`/vaults/${vaultResult.vault_id}`} className="btn btn-primary">
                View Vault
              </a>
              <a href="/vaults" className="btn btn-outline">
                All Vaults
              </a>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setCreationStep('form');
                  setVaultResult(null);
                  setFiles([]);
                  setError(null);
                }}
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-vault-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Create New Vault</h1>
          <p className="card-subtitle">
            Encrypt files and bind them to Bitcoin transactions for secure access control
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {creationStep === 'creating' && (
          <div className="text-center p-4">
            <div className="spinner"></div>
            <h3>Creating Vault...</h3>
            <p>Encrypting files and preparing transaction...</p>
          </div>
        )}

        {creationStep === 'signing' && (
          <div className="text-center p-4">
            <div className="spinner"></div>
            <h3>Waiting for Transaction Signature</h3>
            <p>Please sign the transaction in your wallet to finalize the vault.</p>
          </div>
        )}

        {creationStep === 'form' && (

        <form onSubmit={handleSubmit}>
          {/* File Upload */}
          <div className="form-group">
            <label className="form-label">Files to Encrypt</label>
            <div className="file-upload">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                id="file-input"
              />
              <label htmlFor="file-input">
                <div>
                  📁 Click to select files or drag and drop
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Maximum 50MB per file, 100 files total
                </div>
              </label>
            </div>
            {files.length > 0 && (
              <div className="mt-2">
                <strong>Selected files:</strong>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {files.map((file, index) => (
                    <li key={index}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Authorized Wallet */}
          <div className="form-group">
            <label className="form-label">Authorized Wallet Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="Bitcoin address that can unlock this vault"
              value={metadata.authorized_wallet}
              onChange={(e) => handleMetadataChange('authorized_wallet', e.target.value)}
              required
            />
            <div className="form-help">
              Enter the Bitcoin address that will be authorized to unlock this vault.
              Use "ANY" to allow any wallet to unlock it.
            </div>
          </div>

          {/* Amount Condition */}
          <div className="form-group">
            <label className="form-label">Amount Condition</label>
            <div className="grid grid-2">
              <div>
                <select
                  className="form-select"
                  value={metadata.amount_condition.type}
                  onChange={(e) => handleAmountConditionChange('type', e.target.value)}
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="range">Amount Range</option>
                  <option value="any">Any Amount</option>
                </select>
              </div>
              {metadata.amount_condition.type === 'fixed' && (
                <div>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Amount in satoshis"
                    value={metadata.amount_condition.amount}
                    onChange={(e) => handleAmountConditionChange('amount', parseInt(e.target.value))}
                    min="1000"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Recipient Wallet */}
          <div className="form-group">
            <label className="form-label">Recipient Wallet (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Where unlock transaction should send funds (leave empty for self-spend)"
              value={metadata.recipient_wallet}
              onChange={(e) => handleMetadataChange('recipient_wallet', e.target.value)}
            />
          </div>

          {/* Time Lock */}
          <div className="form-group">
            <label className="form-label">Time Lock (Optional)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Bitcoin block height (e.g., 850000)"
              value={metadata.time_lock}
              onChange={(e) => handleMetadataChange('time_lock', e.target.value)}
            />
            <div className="form-help">
              Vault will only be unlockable after this Bitcoin block height.
              Current block height: ~850,000
            </div>
          </div>

          {/* Unlock Limit */}
          <div className="form-group">
            <label className="form-label">Unlock Limit</label>
            <input
              type="number"
              className="form-input"
              placeholder="Maximum number of times this vault can be unlocked"
              value={metadata.unlock_limit}
              onChange={(e) => handleMetadataChange('unlock_limit', parseInt(e.target.value))}
              min="1"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Describe what this vault contains or its purpose"
              value={metadata.description}
              onChange={(e) => handleMetadataChange('description', e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <div className="form-group">
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isCreating || files.length === 0 || !metadata.authorized_wallet}
            >
              {isCreating ? (
                <>
                  <div className="spinner"></div>
                  Creating Vault...
                </>
              ) : (
                'Create Vault'
              )}
            </button>
          </div>
        </form>
        )}

        {/* Wallet Info Display */}
        {isConnected && walletInfo && (
          <div className="alert alert-info mt-3">
            <strong>Connected Wallet:</strong> {connection?.address &&
              `${connection.address.substring(0, 8)}...${connection.address.substring(connection.address.length - 8)}`}
            <br />
            <strong>Balance:</strong> {walletInfo.balance ?
              `${(walletInfo.balance / 100000000).toFixed(8)} BTC (${walletInfo.balance.toLocaleString()} sats)` :
              'Loading...'}
          </div>
        )}

        {/* Info Box */}
        <div className="alert alert-info mt-3">
          <strong>Next Steps:</strong> After creating the vault, you'll need to sign a Bitcoin
          transaction to bind it to your wallet. This transaction proves ownership and
          finalizes the vault creation process.
        </div>
      </div>
    </div>
  );
}
