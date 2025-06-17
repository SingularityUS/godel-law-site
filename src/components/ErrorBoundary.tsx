
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center p-8 border-2 border-black max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-black" style={{ fontFamily: 'Courier New, monospace' }}>
              SOMETHING WENT WRONG
            </h1>
            <p className="text-sm mb-4 text-gray-700" style={{ fontFamily: 'Courier New, monospace' }}>
              The application encountered an error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="border-2 border-black bg-white hover:bg-gray-100 px-4 py-2 text-sm font-bold"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              REFRESH PAGE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
