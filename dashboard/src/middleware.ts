import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseClaims(token: string) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    return {};
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques — aucune vérification
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/commander') ||
    pathname.startsWith('/api/webhook');

  if (isPublic) return NextResponse.next();

  // Créer le client Supabase avec gestion des cookies de session
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()      { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Pas de session → page de login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const claims = parseClaims(session.access_token);

  // Route /admin → réservée aux admin_saas
  if (pathname.startsWith('/admin')) {
    if (claims.user_role !== 'admin_saas') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // Route /[tenant]/* → vérifier que le slug correspond au tenant du gérant
  const slugInUrl = pathname.split('/')[1];
  if (
    slugInUrl &&
    claims.user_role === 'gerant' &&
    claims.tenant_slug &&
    slugInUrl !== claims.tenant_slug
  ) {
    // Redirige vers son propre dashboard
    return NextResponse.redirect(
      new URL(`/${claims.tenant_slug}/orders`, request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/webhook).*)',
  ],
};
