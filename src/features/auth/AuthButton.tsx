import React, { useState } from 'react';
import { LogIn, LogOut, Loader2, ShieldCheck, Eye } from 'lucide-react';
import { useAuth } from './AuthContext';

/**
 * Sign-in / sign-out control.
 *
 * Deliberately shows the current role, because the difference between "signed
 * in" and "allowed to edit" is not obvious: a new account defaults to `viewer`,
 * and promoting it to `editor` is a manual step in the Supabase dashboard. That
 * is on purpose — a self-service signup must not be able to grant itself write
 * access — but without saying so, a signed-in user with no upload button looks
 * like a bug.
 */
export const AuthButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { user, profile, role, canEdit, isLoading, signInWithGitHub, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-neutral-400" aria-label="Checking sign-in" />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => run(signInWithGitHub)}
          disabled={busy}
          className={`flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 text-[#183A2A] font-medium hover:border-[#183A2A]/40 transition-colors disabled:opacity-50 ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
          }`}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn size={15} />}
          Sign in with GitHub
        </button>
        {error && <span className="text-[10px] text-rose-600 max-w-[220px] text-right">{error}</span>}
      </div>
    );
  }

  const name = profile?.full_name ?? user.email ?? 'Signed in';

  return (
    <div className="flex items-center gap-2">
      <div className="text-right leading-tight hidden sm:block">
        <div className="text-xs font-medium text-neutral-900 truncate max-w-[160px]">{name}</div>
        <div
          className={`inline-flex items-center gap-1 text-[10px] ${
            canEdit ? 'text-[#35624B]' : 'text-neutral-500'
          }`}
          title={
            canEdit
              ? 'You can add and edit site content'
              : 'Read-only. An admin can promote this account to editor in Supabase.'
          }
        >
          {canEdit ? <ShieldCheck className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {role ?? 'viewer'}
        </div>
      </div>
      <button
        onClick={() => run(signOut)}
        disabled={busy}
        aria-label="Sign out"
        title="Sign out"
        className="p-2 rounded-full border border-black/10 bg-white/80 text-neutral-600 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default AuthButton;
