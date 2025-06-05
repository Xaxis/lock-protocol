import React, { useState } from 'react';

export function UnlockVaultPage() {
  const [vaultId, setVaultId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsUnlocking(true);

    try {
      // TODO: Implement vault unlocking API call
      console.log('Unlocking vault:', { vaultId, transactionId });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Vault unlocked successfully! (Demo)');
    } catch (error) {
      console.error('Error unlocking vault:', error);
      alert('Error unlocking vault. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="unlock-vault-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Unlock Vault</h1>
          <p className="card-subtitle">
            Provide a valid Bitcoin transaction to unlock an encrypted vault
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Vault ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter the vault ID you want to unlock"
              value={vaultId}
              onChange={(e) => setVaultId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transaction ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="Bitcoin transaction ID that meets the vault conditions"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
            <div className="form-help">
              This transaction must be confirmed on the Bitcoin network and meet
              all the vault's unlock conditions (amount, wallet, time-lock, etc.)
            </div>
          </div>

          <div className="form-group">
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isUnlocking || !vaultId || !transactionId}
            >
              {isUnlocking ? (
                <>
                  <div className="spinner"></div>
                  Validating & Unlocking...
                </>
              ) : (
                'Unlock Vault'
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
  );
}
