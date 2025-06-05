import React, { useState } from 'react';

export function CreateVaultPage() {
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
    setIsCreating(true);

    try {
      // TODO: Implement vault creation API call
      console.log('Creating vault with:', { files, metadata });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Vault created successfully! (Demo)');
    } catch (error) {
      console.error('Error creating vault:', error);
      alert('Error creating vault. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-vault-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Create New Vault</h1>
          <p className="card-subtitle">
            Encrypt files and bind them to Bitcoin transactions for secure access control
          </p>
        </div>

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
