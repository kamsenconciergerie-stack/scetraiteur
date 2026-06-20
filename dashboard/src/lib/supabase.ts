import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient gère la session automatiquement via les cookies Supabase
export const supabase = createBrowserClient(supabaseUrl, supabaseAnon);
