import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
          <div className="panel max-w-lg text-center">
            <h1 className="text-2xl font-bold">Something broke on this screen.</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Refresh the page and try again. The backend audit log can help trace the action that
              caused it.
            </p>
            <button className="btn btn-primary mt-6" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
