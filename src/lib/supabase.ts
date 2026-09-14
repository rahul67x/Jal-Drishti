import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * The single Supabase client for the whole app.
 *
 * On the anon key being public: it is compiled into the JavaScript bundle and
 * anyone can read it out of devtools. That is expected and safe, but ONLY
 * because Row Level Security is enabled on every table (see
 * supabase/migrations/0007_rls.sql). It grants read access to published content
 * and nothing more.
 *
 * The service_role key bypasses RLS entirely and must NEVER appear here, in any
 * VITE_ variable, or anywhere else that reaches the browser. It belongs only in
 * .env.seed, which is gitignored and read exclusively by local Node scripts.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Copy .env.example to .env.local and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your project dashboard ' +
      '(Project Settings > API), then restart the dev server.'
  );
}

// Supabase issues keys in two formats, and each has a public and a secret
// variant. Shipping a secret one to the browser would bypass every Row Level
// Security policy, so both formats are checked here and failing is loud.
//
//   new-style:  sb_publishable_...  safe    |  sb_secret_...      NEVER
//   legacy JWT: role "anon"         safe    |  role "service_role" NEVER
const SECRET_KEY_ADVICE =
  'Never expose a secret key to the browser: it bypasses every Row Level ' +
  'Security policy. Use the publishable or anon key from Project Settings > API.';

if (supabaseAnonKey.startsWith('sb_secret_')) {
  throw new Error(`VITE_SUPABASE_ANON_KEY is a secret key. ${SECRET_KEY_ADVICE}`);
}

if (supabaseAnonKey.split('.').length === 3) {
  let role: string | undefined;
  try {
    role = JSON.parse(atob(supabaseAnonKey.split('.')[1]))?.role;
  } catch {
    // Not a decodable JWT payload; leave it to Supabase to reject.
  }
  if (role && role !== 'anon') {
    throw new Error(
      `VITE_SUPABASE_ANON_KEY carries role "${role}", not "anon". ${SECRET_KEY_ADVICE}`
    );
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Public URL for a file in a public bucket (rasters, photos, satellite plates). */
export function publicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Short-lived signed URL for a file in the private `reports` bucket.
 * Defaults to one hour.
 */
export async function signedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
