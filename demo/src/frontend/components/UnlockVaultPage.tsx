import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, VaultDetailResponse, UnlockVaultResponse } from '../services/api';
import { useWallet } from '../contexts/WalletContext';
import { AddressFormGroup } from './AddressDisplay';

interface DecryptedFile {
  name: string;
  content: Uint8Array;
  mime_type: string;
  size: number;
}

export function UnlockVaultPage() {
  const { id: vaultId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, connection } = useWallet();

  const [vaultDetail, setVaultDetail] = useState<VaultDetailResponse | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockResult, setUnlockResult] = useState<UnlockVaultResponse | null>(null);
  const [unlockStep, setUnlockStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');

  const loadVaultDetail = async () => {
    if (!vaultId) return;

    try {
      setError(null);
      const detail = await apiService.getVault(vaultId, true);
      setVaultDetail(detail);
    } catch (error) {
      console.error('Failed to load vault detail:', error);
      setError(error instanceof Error ? error.message : 'Failed to load vault details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVaultDetail();
  }, [vaultId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!vaultId || !transactionId.trim()) return;

    setIsUnlocking(true);
    setUnlockStep('processing');
    setError(null);

    try {
      console.log('Unlocking vault:', { vaultId, transactionId });

      // Call the unlock API
      const result = await apiService.unlockVault({
        vault_id: vaultId,
        transaction_hex: transactionId.trim()
      });

      setUnlockResult(result);

      if (result.success) {
        setUnlockStep('success');
        console.log('Vault unlocked successfully!', result);
      } else {
        setUnlockStep('failed');
        setError('Unlock failed: Transaction does not meet vault conditions');
      }
    } catch (error) {
      console.error('Error unlocking vault:', error);
      setError(error instanceof Error ? error.message : 'Failed to unlock vault');
      setUnlockStep('failed');
    } finally {
      setIsUnlocking(false);
    }
  };

  const formatBalance = (satoshis: number) => {
    return `${(satoshis / 100000000).toFixed(8)} BTC`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const downloadFile = (file: DecryptedFile) => {
    try {
      const blob = new Blob([file.content], { type: file.mime_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const downloadAllFiles = () => {
    if (!unlockResult?.decrypted_files) return;

    unlockResult.decrypted_files.forEach(file => {
      setTimeout(() => downloadFile(file), 100); // Small delay between downloads
    });
  };

  const isAuthorized = (vault: any) => {
    if (!connection?.address) return false;
    const authorizedWallet = vault.metadata.authorized_wallet;
    if (authorizedWallet === 'ANY') return true;
    if (Array.isArray(authorizedWallet)) {
      return authorizedWallet.includes(connection.address);
    }
    return authorizedWallet === connection.address;
  };

  if (!isConnected) {
    return (
      <div className="unlock-vault-page">
        <div className="card">
          <div className="text-center p-4">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to unlock vaults.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/wallet')}
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="unlock-vault-page">
        <div className="card">
          <div className="text-center p-4">
            <div className="spinner"></div>
            <p>Loading vault details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !vaultDetail) {
    return (
      <div className="unlock-vault-page">
        <div className="card">
          <div className="text-center p-4">
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
            <button
              className="btn btn-outline"
              onClick={loadVaultDetail}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!vaultDetail) {
    return (
      <div className="unlock-vault-page">
        <div className="card">
          <div className="text-center p-4">
            <h2>Vault Not Found</h2>
            <p>The requested vault could not be found.</p>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/vaults')}
            >
              Back to Vaults
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { vault } = vaultDetail;
  const authorized = isAuthorized(vault);

  if (!authorized) {
    return (
      <div className="unlock-vault-page">
        <div className="card">
          <div className="text-center p-4">
            <h2>🔒 Access Denied</h2>
            <p>You are not authorized to unlock this vault.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Only the authorized wallet can unlock this vault.
            </p>
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/vault/${vaultId}`)}
            >
              View Vault Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (vault.status !== 'active') {
    return (
      <div className="unlock-vault-page">
        <div className="card">
          <div className="text-center p-4">
            <h2>⚠️ Vault Not Available</h2>
            <p>This vault is not in an unlockable state.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Current status: <strong>{vault.status}</strong>
            </p>
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/vault/${vaultId}`)}
            >
              View Vault Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (vault.unlock_count >= vault.metadata.unlock_limit) {
    return (
      <div className="unlock-vault-page">
        <div className="card">
          <div className="text-center p-4">
            <h2>🚫 Unlock Limit Reached</h2>
            <p>This vault has reached its unlock limit.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Unlocked {vault.unlock_count} of {vault.metadata.unlock_limit} times
            </p>
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/vault/${vaultId}`)}
            >
              View Vault Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="unlock-vault-page">
      {/* Vault Information */}
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">🔓 Unlock Vault</h1>
          <p className="card-subtitle">
            Provide a valid Bitcoin transaction to unlock this encrypted vault
          </p>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label">Vault Description</label>
                <div className="form-control-static">
                  {vault.metadata.description || 'No description provided'}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Unlock Progress</label>
                <div className="form-control-static">
                  {vault.unlock_count} / {vault.metadata.unlock_limit} unlocks used
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label">Required Amount</label>
                <div className="form-control-static">
                  {vault.metadata.amount_condition.type === 'fixed'
                    ? `Exactly ${formatBalance(vault.metadata.amount_condition.amount!)}`
                    : vault.metadata.amount_condition.type === 'range'
                    ? `Between ${formatBalance(vault.metadata.amount_condition.min!)} - ${formatBalance(vault.metadata.amount_condition.max!)}`
                    : 'Any amount'
                  }
                </div>
              </div>

              {vault.metadata.recipient_wallet && (
                <AddressFormGroup
                  label="Required Recipient"
                  address={vault.metadata.recipient_wallet}
                  showCopyButton={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unlock Form */}
      {unlockStep === 'form' && (
        <div className="card mt-4">
          <div className="card-header">
            <h2 className="card-title">Provide Unlock Transaction</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Bitcoin Transaction ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter the transaction ID that meets the vault conditions"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                  style={{ fontFamily: 'monospace' }}
                />
                <div className="form-help">
                  This transaction must be confirmed on the Bitcoin network and meet
                  all the vault's unlock conditions (amount, wallet, recipient, etc.)
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <div className="form-group">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={isUnlocking || !transactionId.trim()}
                >
                  {isUnlocking ? (
                    <>
                      <div className="spinner"></div>
                      Validating & Unlocking...
                    </>
                  ) : (
                    '🔓 Unlock Vault'
                  )}
                </button>
              </div>
            </form>

            <div className="alert alert-info mt-3">
              <strong>How it works:</strong> The system will validate your Bitcoin transaction
              against the vault's conditions. If valid, the encrypted files will be decrypted
              and made available for download.
            </div>
          </div>
        </div>
      )}

      {/* Processing State */}
      {unlockStep === 'processing' && (
        <div className="card mt-4">
          <div className="text-center p-4">
            <div className="spinner" style={{ width: '48px', height: '48px' }}></div>
            <h3 style={{ marginTop: '16px' }}>Unlocking Vault...</h3>
            <p>Validating transaction and decrypting files</p>
          </div>
        </div>
      )}

      {/* Success State */}
      {unlockStep === 'success' && unlockResult && (
        <div className="card mt-4">
          <div className="card-header">
            <h2 className="card-title">🎉 Vault Unlocked Successfully!</h2>
          </div>
          <div className="card-body">
            <div className="alert alert-success">
              <strong>Success!</strong> The vault has been unlocked and your files are ready for download.
            </div>

            {unlockResult.decrypted_files && unlockResult.decrypted_files.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Decrypted Files ({unlockResult.decrypted_files.length})</h3>
                  <button
                    className="btn btn-primary"
                    onClick={downloadAllFiles}
                  >
                    📁 Download All Files
                  </button>
                </div>

                <div className="file-list">
                  {unlockResult.decrypted_files.map((file, index) => (
                    <div key={index} className="file-item p-3 border rounded mb-2">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            📄 {file.name}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {file.mime_type} • {(file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => downloadFile(file)}
                        >
                          💾 Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/vault/${vaultId}`)}
              >
                View Vault Details
              </button>
              <button
                className="btn btn-outline ml-2"
                onClick={() => navigate('/vaults')}
              >
                Back to Vaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failure State */}
      {unlockStep === 'failed' && (
        <div className="card mt-4">
          <div className="card-header">
            <h2 className="card-title">❌ Unlock Failed</h2>
          </div>
          <div className="card-body">
            <div className="alert alert-error">
              <strong>Unlock Failed:</strong> {error || 'The transaction does not meet the vault conditions.'}
            </div>

            {unlockResult?.proof_of_access && unlockResult.proof_of_access.errors && (
              <div>
                <h4>Validation Errors:</h4>
                <ul>
                  {unlockResult.proof_of_access.errors.map((err: string, index: number) => (
                    <li key={index} style={{ color: '#dc3545' }}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setUnlockStep('form');
                  setError(null);
                  setUnlockResult(null);
                }}
              >
                Try Again
              </button>
              <button
                className="btn btn-outline ml-2"
                onClick={() => navigate(`/vault/${vaultId}`)}
              >
                View Vault Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
