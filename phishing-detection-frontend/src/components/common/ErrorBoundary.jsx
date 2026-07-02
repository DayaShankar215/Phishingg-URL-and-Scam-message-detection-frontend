import React, { useState } from 'react';
import { 
  FaExclamationTriangle, 
  FaRedo, 
  FaHome, 
  FaSync,
  FaChevronLeft 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo} 
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, onReset }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const goHome = () => {
    onReset();
    navigate('/');
  };

  const getErrorMessage = () => {
    if (error?.message) return error.message;
    if (error?.status) return `HTTP ${error.status}: ${error.statusText || 'Error'}`;
    if (errorInfo?.componentStack?.length) {
      const componentName = errorInfo.componentStack.match(/in (\w+)/)?.[1];
      return componentName ? `Error in ${componentName} component` : 'Unknown error'; 
    }
    return 'Something went wrong. Please try again.';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 24px',
      textAlign: 'center',
      background: 'var(--bg-primary, #f8fafc)',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f5576c20 0%, #ef444420 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 10px 30px rgba(239, 68, 68, 0.2)',
      }}>
        <FaExclamationTriangle style={{ fontSize: '40px', color: '#ef4444' }} />
      </div>
      <h1 style={{
        fontSize: '28px',
        fontWeight: '700',
        color: 'var(--text-primary, #1e293b)',
        marginBottom: '12px',
      }}>
        Something went wrong
      </h1>
      <p style={{
        fontSize: '16px',
        color: 'var(--text-secondary, #64748b)',
        maxWidth: '480px',
        lineHeight: '1.6',
        marginBottom: '8px',
      }}>
        {getErrorMessage()}
      </p>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-muted, #94a3b8)',
        maxWidth: '480px',
        lineHeight: '1.5',
        marginBottom: '24px',
      }}>
        You can try again or return to the dashboard to continue using the application.
      </p>

      {errorInfo?.componentStack && (
        <div style={{ marginBottom: '24px', width: '100%', maxWidth: '600px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '8px',
              background: 'var(--bg-card, white)',
              color: 'var(--text-primary, #1e293b)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <FaChevronLeft style={{ 
              transform: showDetails ? 'rotate(90deg)' : 'rotate(-90deg)', 
              transition: 'transform 0.3s' 
            }} />
            {showDetails ? 'Hide Error Details' : 'Show Error Details'}
          </button>

          {showDetails && (
            <div style={{
              marginTop: '12px',
              padding: '16px',
              background: 'var(--bg-secondary, #f1f5f9)',
              borderRadius: '12px',
              textAlign: 'left',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: 'var(--text-primary, #1e293b)',
              overflow: 'auto',
              maxHeight: '200px',
            }}>
              <div style={{ marginBottom: '8px', color: '#ef4444', fontWeight: '600' }}>
                Component Stack:
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{errorInfo.componentStack}</div>
              <div style={{ marginTop: '12px', color: '#ef4444', fontWeight: '600' }}>
                Error:
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{error?.stack}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
          }}
        >
          <FaSync />
          Try Again
        </button>
        <button
          onClick={goHome}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            background: 'var(--bg-card, white)',
            color: 'var(--text-primary, #1e293b)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary, #f1f5f9)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-card, white)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FaHome />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;