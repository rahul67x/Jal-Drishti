import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { AuthContext, type AuthContextValue } from './AuthContext';

/**
 * Authentication state for the whole app.
 *
 * Viewing is public — judges never need an account — so this exists only to
 * gate writes. Row Level Security is the real enforcement; the UI simply avoids
 * offering buttons that would be refused anyway.
 *
 * The role comes from public.profiles rather than the JWT, because a role baked
 * into a token goes stale the moment it is changed. The RLS policies read the
 * same table, so the UI and the database always agree.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Subscribing to Supabase's auth state is exactly the "synchronise with an
  // external system" case an effect is for.
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsSessionLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setIsSessionLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  // A query rather than an effect: it caches, dedupes, and clears itself when
  // the user changes, without a second piece of state to keep in step.
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profile = userId ? profileQuery.data ?? null : null;

  const value = useMemo<AuthContextValue>(() => {
    const role = profile?.role ?? null;
    return {
      session,
      user: session?.user ?? null,
      profile,
      role,
      // OPEN DEMO MODE. Editing is open to everyone, signed in or not, so the
      // prototype can be shown to judges who have no account. This mirrors
      // migration 0009_open_editing.sql — the database is what actually
      // enforces access, and it is currently open too. Changing this line back
      // without reverting that migration would only hide the buttons, not
      // close the door.
      canEdit: true,
      isLoading: isSessionLoading || (Boolean(userId) && profileQuery.isLoading),
      signInWithGitHub: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: { redirectTo: `${window.location.origin}/sites` },
        });
        if (error) throw error;
      },
      signInWithEmail: async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/sites` },
        });
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    };
  }, [session, profile, isSessionLoading, userId, profileQuery.isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
