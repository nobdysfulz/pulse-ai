import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 Application Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
              <h2 className="text-2xl font-bold text-text-heading">Something went wrong</h2>
            </div>
            
            <p className="text-text-body mb-4">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>
            
            {this.state.error && (
              <div className="bg-muted/50 rounded p-3 mb-4 text-sm text-text-muted font-mono overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={this.handleReload}
                variant="default"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              <Button 
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
