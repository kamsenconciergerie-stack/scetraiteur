'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface Props {
  email: string;
}

export function UserMenu({ email }: Props) {
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 hidden sm:block">{email}</span>
      <button
        onClick={handleSignOut}
        title="Se déconnecter"
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Déconnexion
      </button>
    </div>
  );
}
