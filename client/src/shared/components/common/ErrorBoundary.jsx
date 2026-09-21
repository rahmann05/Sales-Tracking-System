import React, { Component } from 'react';

/**
 * ErrorBoundary (Class Component)
 * Demonstrates Class Component lifecycle: getDerivedStateFromError & componentDidCatch
 * Provides fallback UI in case of React rendering errors.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for diagnostics
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="glass-card"
          style={{
            padding: '2.5rem',
            margin: '2rem auto',
            maxWidth: '600px',
            borderRadius: '24px',
            textAlign: 'center',
            border: '1px solid rgba(186, 26, 26, 0.3)',
            backgroundColor: 'rgba(255, 218, 214, 0.3)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--error)' }}>
            warning
          </span>
          <h2 className="font-headline" style={{ fontSize: '1.5rem', color: 'var(--error)', marginTop: '0.5rem' }}>
            Terjadi Kesalahan Aplikasi
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', margin: '1rem 0' }}>
            {this.state.error?.toString() || 'Kesalahan yang tidak diharapkan telah terjadi.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'var(--on-primary)',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
