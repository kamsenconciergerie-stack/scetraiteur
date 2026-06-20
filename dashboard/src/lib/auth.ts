import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

export interface JwtClaims {
  sub:          string;
  email?:       string;
  tenant_id?:   string;
  tenant_slug?: string;
  user_role?:   'gerant' | 'admin_saas';
}

/** Client Supabase pour les Server Components (lit les cookies de session). */
export function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()          { return cookieStore.getAll(); },
        setAll(toSet)     {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

/** Client Supabase avec service_role — uniquement côté serveur (Server Actions / API routes). */
export function getAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Décode le JWT et retourne les claims personnalisés. */
export function parseClaims(accessToken: string): JwtClaims {
  try {
    const base64 = accessToken.split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    return { sub: '' };
  }
}

/** Retourne la session courante + les claims JWT (Server Component). */
export async function getSessionAndClaims() {
  const supabase = getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { session: null, claims: null };
  return {
    session,
    claims: parseClaims(session.access_token),
  };
}
