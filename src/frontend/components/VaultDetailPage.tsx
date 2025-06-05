import React from 'react';
import { useParams } from 'react-router-dom';

export function VaultDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="vault-detail-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Vault Details</h1>
          <p className="card-subtitle">Vault ID: {id}</p>
        </div>
        
        <div className="alert alert-info">
          <strong>Coming Soon:</strong> Detailed vault information, unlock history, 
          and management options will be available here.
        </div>
        
        <p>This page will show:</p>
        <ul>
          <li>Complete vault metadata</li>
          <li>Unlock attempt history</li>
          <li>Transaction details</li>
          <li>Rebinding options</li>
          <li>Download encrypted SEAL file</li>
        </ul>
      </div>
    </div>
  );
}
