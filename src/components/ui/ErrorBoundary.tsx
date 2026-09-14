import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Catches render errors so one broken component does not blank the page.
 *
 * Without this, a single thrown error in any component unmounts the entire
 * React tree and leaves a white screen with nothing but a console message —
 * which, during a demo, is indistinguishable from the site being down.
 *
 * Still a class component: React has no hook equivalent of
 * componentDidCatch.
 */

interface Props {
  children: React.ReactNode;
  /** Shown in the message so the reader knows which part failed. */
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.label ?? 'render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center">
        <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
        <div className="text-sm font-semibold text-rose-900">
          {this.props.label ? `${this.props.label} could not be displayed` : 'Something went wrong'}
        </div>
        <div className="text-xs text-rose-700/80 mt-1.5 font-mono break-words max-w-lg mx-auto">
          {error.message}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => this.setState({ error: null })}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-rose-300 text-rose-800 hover:bg-rose-100 transition-colors"
          >
            Reload the page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
