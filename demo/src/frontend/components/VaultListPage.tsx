import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { apiService, Vault } from '../services/api';

export function VaultListPage() {
  const { isConnected, connection } = useWallet();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && connection) {
      loadVaults();
    }
  }, [isConnected, connection]);

  const loadVaults = async () => {
    if (!connection) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.listVaults({
        walletAddress: connection.address,
        limit: 50
      });
      setVaults(result.vaults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vaults';
      setError(errorMessage);
      console.error('Failed to load vaults:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVaults = vaults.filter(vault => {
    if (filter === 'all') return true;
    return vault.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'status-draft';
      case 'bound': return 'status-bound';
      case 'active': return 'status-active';
      case 'expired': return 'status-expired';
      case 'exhausted': return 'status-exhausted';
      default: return 'status-draft';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatAmount = (condition: any) => {
    switch (condition.type) {
      case 'fixed':
        return `${condition.amount.toLocaleString()} sats`;
      case 'range':
        return `${condition.min.toLocaleString()} - ${condition.max.toLocaleString()} sats`;
      case 'any':
        return 'Any amount';
      default:
        return 'Unknown';
    }
  };

  // Show wallet connection requirement
  if (!isConnected) {
    return (
      <div className="vault-list-page">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">My Vaults</h1>
            <p className="card-subtitle">
              Connect your wallet to view your vaults
            </p>
          </div>

          <div className="text-center p-4">
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
            <h3>Wallet Required</h3>
            <p>You need to connect a Bitcoin wallet to view your vaults.</p>
            <a href="/wallet" className="btn btn-primary mt-3">
              Connect Wallet
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="vault-list-page">
        <div className="text-center p-4">
          <div className="spinner"></div>
          <h3>Loading vaults...</h3>
          <p>Fetching your vaults from the blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-list-page">
      <div className="d-flex justify-between align-center mb-4">
        <h1>My Vaults</h1>
        <div className="d-flex" style={{ gap: '12px' }}>
          <button
            className="btn btn-outline"
            onClick={loadVaults}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/create" className="btn btn-primary">
            Create New Vault
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-3">
          <strong>Error:</strong> {error}
          <button
            className="btn btn-sm btn-outline ml-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {connection && (
        <div className="alert alert-info mb-3">
          <strong>Connected Wallet:</strong> {connection.address.substring(0, 8)}...{connection.address.substring(connection.address.length - 8)}
          <span className="ml-2">({connection.network})</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="card mb-3">
        <div className="d-flex" style={{ gap: '8px', padding: '16px' }}>
          {['all', 'draft', 'bound', 'active', 'expired', 'exhausted'].map(status => (
            <button
              key={status}
              className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${vaults.length})`}
              {status !== 'all' && ` (${vaults.filter(v => v.status === status).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Vault List */}
      {filteredVaults.length === 0 ? (
        <div className="card text-center">
          <h3>No vaults found</h3>
          <p>
            {filter === 'all' 
              ? "You haven't created any vaults yet."
              : `No vaults with status "${filter}".`
            }
          </p>
          <Link to="/create" className="btn btn-primary">
            Create Your First Vault
          </Link>
        </div>
      ) : (
        <div className="grid">
          {filteredVaults.map(vault => (
            <div key={vault.id} className="card">
              <div className="card-header">
                <div className="d-flex justify-between align-center">
                  <h3 className="card-title mb-0">
                    {vault.metadata.description || 'Untitled Vault'}
                  </h3>
                  <span className={`status ${getStatusColor(vault.status)}`}>
                    {vault.status}
                  </span>
                </div>
                <div className="card-subtitle">
                  ID: {vault.id}
                </div>
              </div>

              <div className="vault-details">
                <div className="grid grid-2" style={{ gap: '12px', fontSize: '0.9rem' }}>
                  <div>
                    <strong>Created:</strong> {formatDate(vault.metadata.created_at)}
                  </div>
                  <div>
                    <strong>Unlock Amount:</strong> {formatAmount(vault.metadata.amount_condition)}
                  </div>
                  <div>
                    <strong>Authorized Wallet:</strong>
                    <div style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {vault.metadata.authorized_wallet}
                    </div>
                  </div>
                  <div>
                    <strong>Usage:</strong> {vault.unlock_count} / {vault.metadata.unlock_limit || '∞'}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-between align-center mt-3">
                <Link 
                  to={`/vaults/${vault.id}`} 
                  className="btn btn-outline btn-sm"
                >
                  View Details
                </Link>
                
                {vault.status === 'active' && (
                  <Link 
                    to={`/unlock?vault=${vault.id}`} 
                    className="btn btn-primary btn-sm"
                  >
                    Unlock Vault
                  </Link>
                )}
                
                {vault.status === 'draft' && (
                  <button className="btn btn-warning btn-sm">
                    Complete Binding
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Vault Statistics</h3>
        </div>
        <div className="grid grid-3">
          <div className="text-center">
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {vaults.length}
            </div>
            <div>Total Vaults</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
              {vaults.filter(v => v.status === 'active').length}
            </div>
            <div>Active Vaults</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
              {vaults.reduce((sum, v) => sum + v.unlock_count, 0)}
            </div>
            <div>Total Unlocks</div>
          </div>
        </div>
      </div>
    </div>
  );
}
