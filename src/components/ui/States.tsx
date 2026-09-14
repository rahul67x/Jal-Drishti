import React from 'react';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';

/**
 * The three states every data-backed panel needs.
 *
 * Kept together because they are always used together, and because a screen
 * that silently renders nothing while loading is indistinguishable from one
 * that is broken.
 */

export const Spinner: React.FC<{ label?: string; className?: string }> = ({
  label = 'Loading',
  className = '',
}) => (
  <div className={`flex items-center justify-center gap-2.5 py-10 text-[#6F6F6F] ${className}`}>
    <Loader2 className="w-4 h-4 animate-spin text-[#35624B]" />
    <span className="text-sm">{label}</span>
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}> = ({ title = 'Could not load this data', error, onRetry, className = '' }) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : null;

  return (
    <div
      className={`rounded-2xl border border-rose-200 bg-rose-50/60 p-5 text-center ${className}`}
    >
      <AlertTriangle className="w-5 h-5 text-rose-600 mx-auto mb-2" />
      <div className="text-sm font-semibold text-rose-900">{title}</div>
      {message && (
        <div className="text-xs text-rose-700/80 mt-1.5 font-mono break-words">{message}</div>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-xs font-medium px-3.5 py-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, hint, icon: Icon = Inbox, action, className = '' }) => (
  <div
    className={`rounded-2xl border border-dashed border-black/12 bg-neutral-50/60 p-8 text-center ${className}`}
  >
    <Icon className="w-6 h-6 text-neutral-400 mx-auto mb-2.5" />
    <div className="text-sm font-medium text-neutral-800">{title}</div>
    {hint && <div className="text-xs text-neutral-500 mt-1.5 max-w-sm mx-auto">{hint}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
