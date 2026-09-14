import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { ProfileRow, UserRole } from '../../lib/database.types';

/**
 * The context object and its hook live apart from the provider component so
 * that the provider file exports only a component. Mixing components and
 * plain values in one module breaks React Fast Refresh.
 */

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  role: UserRole | null;
  /** True when the signed-in user may add or edit site content. */
  canEdit: boolean;
  isLoading: boolean;
  signInWithGitHub: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
