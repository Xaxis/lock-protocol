import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, VaultDetailResponse, Vault, UnlockAttempt } from '../services/api';
import { useWallet } from '../contexts/WalletContext';
import { AddressFormGroup } from './AddressDisplay';

export function VaultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, connection } = useWallet();

  const [vaultDetail, setVaultDetail] = useState<VaultDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadVaultDetail = async () => {
    if (!id) return;

    try {
      setError(null);
      const detail = await apiService.getVault(id, true);
      setVaultDetail(detail);
    } catch (error) {
      console.error('Failed to load vault detail:', error);
      setError(error instanceof Error ? error.message : 'Failed to load vault details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshVaultDetail = async () => {
    setIsRefreshing(true);
    await loadVaultDetail();
  };

  useEffect(() => {
    loadVaultDetail();
  }, [id]);

  const formatAddress = (address: string, length: number = 16) => {
    if (!address) return 'Unknown';
    if (address.length <= length) return address;
    return `${address.substring(0, length)}...`;
  };

  const formatBalance = (satoshis: number) => {
    return `${(satoshis / 100000000).toFixed(8)} BTC`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#28a745';
      case 'draft': return '#ffc107';
      case 'unlocked': return '#17a2b8';
      case 'expired': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '🔒';
      case 'draft': return '📝';
      case 'unlocked': return '🔓';
      case 'expired': return '⏰';
      default: return '❓';
    }
  };

  const isAuthorized = (vault: Vault) => {
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
      <div className="vault-detail-page">
        <div className="card">
          <div className="text-center p-4">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to view vault details.</p>
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
      <div className="vault-detail-page">
        <div className="card">
          <div className="text-center p-4">
            <div className="spinner"></div>
            <p>Loading vault details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vault-detail-page">
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
      <div className="vault-detail-page">
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

  const { vault, unlock_attempts = [] } = vaultDetail;
  const authorized = isAuthorized(vault);

  return (
    <div className="vault-detail-page">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="card-title">
                {getStatusIcon(vault.status)} Vault Details
              </h1>
              <p className="card-subtitle">
                ID: {formatAddress(vault.id, 32)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{
                padding: '4px 12px',
                borderRadius: '16px',
                backgroundColor: getStatusColor(vault.status),
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                {vault.status.toUpperCase()}
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={refreshVaultDetail}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vault Metadata */}
      <div className="card mt-4">
        <div className="card-header">
          <h2 className="card-title">Vault Information</h2>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label">Description</label>
                <div className="form-control-static">
                  {vault.metadata.description || 'No description provided'}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Created</label>
                <div className="form-control-static">
                  {formatDate(vault.metadata.created_at)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Unlock Limit</label>
                <div className="form-control-static">
                  {vault.metadata.unlock_limit} time{vault.metadata.unlock_limit !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Unlock Count</label>
                <div className="form-control-static">
                  {vault.unlock_count} / {vault.metadata.unlock_limit}
                  {vault.unlock_count >= vault.metadata.unlock_limit && (
                    <span style={{ color: '#dc3545', marginLeft: '8px' }}>
                      (Limit Reached)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <AddressFormGroup
                label="Authorized Wallet"
                address={Array.isArray(vault.metadata.authorized_wallet)
                  ? vault.metadata.authorized_wallet.join(', ')
                  : vault.metadata.authorized_wallet}
                showCopyButton={true}
              />

              {vault.metadata.recipient_wallet && (
                <AddressFormGroup
                  label="Recipient Wallet"
                  address={vault.metadata.recipient_wallet}
                  showCopyButton={true}
                />
              )}

              <div className="form-group">
                <label className="form-label">Amount Condition</label>
                <div className="form-control-static">
                  {vault.metadata.amount_condition.type === 'fixed'
                    ? `Fixed: ${formatBalance(vault.metadata.amount_condition.amount)}`
                    : vault.metadata.amount_condition.type === 'range'
                    ? `Range: ${formatBalance(vault.metadata.amount_condition.min_amount)} - ${formatBalance(vault.metadata.amount_condition.max_amount)}`
                    : 'Any amount'
                  }
                </div>
              </div>

              {vault.metadata.time_lock && (
                <div className="form-group">
                  <label className="form-label">Time Lock</label>
                  <div className="form-control-static">
                    Until block {vault.metadata.time_lock.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Authorization Status */}
      <div className="card mt-4">
        <div className="card-header">
          <h2 className="card-title">Access Control</h2>
        </div>
        <div className="card-body">
          <div className="alert" style={{
            backgroundColor: authorized ? '#d4edda' : '#f8d7da',
            borderColor: authorized ? '#c3e6cb' : '#f5c6cb',
            color: authorized ? '#155724' : '#721c24'
          }}>
            <strong>
              {authorized ? '✅ Authorized' : '❌ Not Authorized'}
            </strong>
            <br />
            {authorized
              ? 'You are authorized to unlock this vault.'
              : 'You are not authorized to unlock this vault. Only the authorized wallet can access the contents.'
            }
          </div>

          {authorized && vault.status === 'active' && vault.unlock_count < vault.metadata.unlock_limit && (
            <div className="mt-3">
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/unlock/${vault.id}`)}
              >
                🔓 Unlock Vault
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unlock History */}
      <div className="card mt-4">
        <div className="card-header">
          <h2 className="card-title">Unlock History</h2>
        </div>
        <div className="card-body">
          {unlock_attempts.length === 0 ? (
            <div className="text-center p-3">
              <p>No unlock attempts recorded</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Unlock attempts will appear here when someone tries to access the vault
              </p>
            </div>
          ) : (
            <div>
              {unlock_attempts.map((attempt, index) => (
                <div key={attempt.id} className={`p-3 ${index > 0 ? 'border-top' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {attempt.success ? '✅' : '❌'}
                        </span>
                        <strong>
                          {attempt.success ? 'Successful Unlock' : 'Failed Unlock Attempt'}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {formatDate(attempt.timestamp)}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        <strong>Transaction:</strong> {formatAddress(attempt.transaction_id)}
                      </div>
                      {attempt.error_message && (
                        <div style={{ fontSize: '0.8rem', color: '#dc3545', marginTop: '4px' }}>
                          <strong>Error:</strong> {attempt.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="card mt-4">
        <div className="card-header">
          <h2 className="card-title">Actions</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/vaults')}
            >
              ← Back to Vaults
            </button>

            {authorized && (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    // TODO: Implement download SEAL file
                    alert('Download SEAL file functionality coming soon!');
                  }}
                >
                  📁 Download SEAL File
                </button>

                {vault.status === 'active' && (
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      // TODO: Implement rebind functionality
                      alert('Rebind vault functionality coming soon!');
                    }}
                  >
                    🔄 Rebind Vault
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
