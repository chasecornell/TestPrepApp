import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#330000', color: '#ffaaaa', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>React Rendering Crash</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Show details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px 20px', background: 'white', color: 'black' }}
          >
            Reload Window
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
