import React from 'react';

/**
 * ErrorBoundary — Catches render errors in child components and
 * displays a recovery UI instead of blanking the entire application.
 *
 * Prevents issues like the previous AlertTriangle import crash
 * from taking down the whole app.
 *
 * Usage:
 *   <ErrorBoundary fallbackMessage="This section encountered an error.">
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for debugging — in production this would go to an error reporting service
    console.error('[ErrorBoundary] Component crash caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'rgba(244, 63, 94, 0.06)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: '0.75rem',
            margin: '1rem 0',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fda4af' }}>
            {this.props.fallbackMessage || 'Something went wrong in this section.'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            An unexpected error occurred. Your data is safe — try reloading this section.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              background: 'rgba(244, 63, 94, 0.1)',
              color: '#fda4af',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
