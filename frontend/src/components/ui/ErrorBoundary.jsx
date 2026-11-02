import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Global ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and displays a friendly recovery fallback UI
 * instead of a blank screen.
 */
class ErrorBoundary extends React.Component {
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
    // Log error details for telemetry and debugging
    console.error('[ErrorBoundary] Caught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center animate-fade-in">
            {/* Warning Icon with Glow */}
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-50/60 mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              ReuseCampus encountered an unexpected issue while rendering this page.
              Your data and account are safe. Try reloading to continue browsing.
            </p>

            {/* Error Details (Only visible in development mode) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-left overflow-auto max-h-36">
                <p className="text-xs font-mono font-medium text-red-800 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Recovery Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-sm transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Campus Marketplace
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
