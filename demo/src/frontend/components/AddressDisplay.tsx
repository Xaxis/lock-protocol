/**
 * AddressDisplay Component
 * A reusable component for displaying Bitcoin addresses with copy functionality
 */

import React, { useState } from 'react';

interface AddressDisplayProps {
  address: string;
  label?: string;
  showCopyButton?: boolean;
  truncate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AddressDisplay({ 
  address, 
  label, 
  showCopyButton = true, 
  truncate = false,
  className = '',
  style = {}
}: AddressDisplayProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const displayAddress = truncate && address.length > 20 
    ? `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
    : address;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    ...style
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#f8f9fa',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    wordBreak: 'break-all' as const,
    paddingRight: showCopyButton ? '50px' : '12px',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '8px 12px',
    width: '100%',
    boxSizing: 'border-box' as const
  };

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '4px 8px',
    minWidth: '32px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: copySuccess ? '#d4edda' : 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  };

  return (
    <div className={`address-display ${className}`}>
      {label && (
        <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>
          {label}
        </label>
      )}
      <div style={containerStyle}>
        <div style={inputStyle}>
          {displayAddress}
        </div>
        {showCopyButton && (
          <button
            onClick={handleCopy}
            title={copySuccess ? 'Copied!' : 'Copy address'}
            style={buttonStyle}
            className="btn btn-sm"
          >
            {copySuccess ? '✓' : '📋'}
          </button>
        )}
      </div>
    </div>
  );
}

// Convenience component for form groups
export function AddressFormGroup({ 
  address, 
  label = 'Address',
  ...props 
}: AddressDisplayProps) {
  return (
    <div className="form-group">
      <AddressDisplay 
        address={address} 
        label={label}
        {...props}
      />
    </div>
  );
}
