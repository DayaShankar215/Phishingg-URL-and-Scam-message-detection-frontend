import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

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
  const [showDetails, setShowDetails] = useState(false);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.errorIconContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      </View>

      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{getErrorMessage()}</Text>
      <Text style={styles.errorSubtitle}>
        You can try again or return to the dashboard to continue using the application.
      </Text>

      {errorInfo?.componentStack && (
        <View style={styles.detailsContainer}>
          <TouchableOpacity
            onPress={() => setShowDetails(!showDetails)}
            style={styles.detailsButton}
          >
            <Ionicons
              name="chevron-down"
              size={16}
              color="#64748b"
              style={{ transform: [{ rotate: showDetails ? '180deg' : '0deg' }] }}
            />
            <Text style={styles.detailsButtonText}>
              {showDetails ? 'Hide Error Details' : 'Show Error Details'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.detailsContent}>
              <Text style={styles.detailsLabel}>Component Stack:</Text>
              <Text style={styles.detailsText}>{errorInfo.componentStack}</Text>
              <Text style={[styles.detailsLabel, { marginTop: 16 }]}>Error:</Text>
              <Text style={styles.detailsText}>{error?.stack}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.retryButton} onPress={onReset}>
          <Ionicons name="refresh-outline" size={20} color="white" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={() => onReset()}>
          <Ionicons name="home-outline" size={20} color="#64748b" />
          <Text style={styles.homeButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  detailsContainer: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 24,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailsContent: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  detailsLabel: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#1e293b',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#667eea',
    minWidth: 140,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 140,
  },
  homeButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
