import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="nav">
      <div className="nav-container container">
        <Link to="/" className="nav-brand">
          🔐 LOCK Protocol
        </Link>
        
        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/create" className={`nav-link ${isActive('/create')}`}>
              Create Vault
            </Link>
          </li>
          <li>
            <Link to="/vaults" className={`nav-link ${isActive('/vaults')}`}>
              My Vaults
            </Link>
          </li>
          <li>
            <Link to="/unlock" className={`nav-link ${isActive('/unlock')}`}>
              Unlock Vault
            </Link>
          </li>
          <li>
            <Link to="/wallet" className={`nav-link ${isActive('/wallet')}`}>
              Wallet
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
