import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Settings, Users, ExternalLink } from 'lucide-react';
import type { Tenant } from '@/lib/types';

async function getTenants(): Promise<Tenant[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function AdminPage() {
  const tenants = await getTenants();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">OrderFlow — Admin SaaS</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/gerants"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Users className="h-4 w-4" />
              Gérants
            </Link>
            <Link
              href="/admin/tenants/new"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition-colors"
            >
              <Users className="h-4 w-4" />
              Nouveau client
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-6 text-gray-700">
          {tenants.length} client{tenants.length !== 1 ? 's' : ''} actif{tenants.length !== 1 ? 's' : ''}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map(tenant => (
            <div key={tenant.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{tenant.slug}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tenant.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                {tenant.whatsapp_number ?? 'WhatsApp non configuré'}
              </p>

              <div className="flex gap-2">
                <Link
                  href={`/${tenant.slug}/orders`}
                  className="flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Dashboard
                </Link>
                <Link
                  href={`/admin/tenants/${tenant.id}`}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Configurer
                </Link>
              </div>
            </div>
          ))}

          {tenants.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              Aucun client encore. Créez le premier !
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
