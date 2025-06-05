import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { CreateVaultPage } from './components/CreateVaultPage';
import { VaultListPage } from './components/VaultListPage';
import { VaultDetailPage } from './components/VaultDetailPage';
import { UnlockVaultPage } from './components/UnlockVaultPage';
import { WalletPage } from './components/WalletPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WalletProvider } from './contexts/WalletContext';

function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <div className="app">
          <Navigation />
          <main className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateVaultPage />} />
              <Route path="/vaults" element={<VaultListPage />} />
              <Route path="/vaults/:id" element={<VaultDetailPage />} />
              <Route path="/unlock" element={<UnlockVaultPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </WalletProvider>
    </ErrorBoundary>
  );
}

function NotFoundPage() {
  return (
    <div className="text-center mt-4">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary mt-2">
        Go Home
      </a>
    </div>
  );
}

export default App;
