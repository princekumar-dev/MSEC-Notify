import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F0FDF9] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-5 border-2 border-rose-300 shadow-xl animate-slideUp">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto text-rose-600">
              <FiAlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-slate-900 font-display">
                Something went wrong
              </h1>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                An unexpected error occurred. Please try refreshing the page or return to the dashboard.
              </p>
              {this.state.error && (
                <p className="text-xs font-mono text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 mt-3 text-left break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="btn-mint font-bold w-full justify-center"
            >
              <FiRefreshCw /> Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
