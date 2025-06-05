import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="container">
            <div className="card mt-4">
              <div className="card-header">
                <h2 className="card-title" style={{ color: 'var(--error-color)' }}>
                  ⚠️ Something went wrong
                </h2>
              </div>
              
              <div className="alert alert-error">
                <strong>Error:</strong> {this.state.error?.message || 'An unexpected error occurred'}
              </div>
              
              <p>
                We apologize for the inconvenience. This error has been logged and will be investigated.
              </p>
              
              <details className="mt-3">
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Technical Details (Click to expand)
                </summary>
                <pre style={{ 
                  background: '#f8f9fa', 
                  padding: '16px', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  marginTop: '8px'
                }}>
                  {this.state.error?.stack}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
              
              <div className="mt-3">
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </button>
                <a 
                  href="/" 
                  className="btn btn-outline ml-2"
                  style={{ marginLeft: '12px' }}
                >
                  Go Home
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
