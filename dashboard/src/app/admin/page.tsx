export const dynamic = 'force-dynamic';

import { getAdminSupabase } from '@/lib/auth';
import Link from 'next/link';
import { Settings, Users, ExternalLink, Store, Plus, ShieldCheck } from 'lucide-react';
import type { Tenant } from '@/lib/types';

async function getData() {
  const admin = getAdminSupabase();
  const [tenantsRes, gerantsRes] = await Promise.all([
    admin.from('tenants').select('*').order('created_at', { ascending: false }),
    admin.from('user_profiles').select('tenant_id, role'),
  ]);
  return {
    tenants: (tenantsRes.data ?? []) as Tenant[],
    profiles: gerantsRes.data ?? [],
  };
}

export default async function AdminPage() {
  const { tenants, profiles } = await getData();

  const activeCount  = tenants.filter(t => t.is_active).length;
  const gerantCount  = profiles.filter(p => p.role === 'gerant').length;
  const adminCount   = profiles.filter(p => p.role === 'admin_saas').length;

  function gerantsForTenant(id: string) {
    return profiles.filter(p => p.tenant_id === id && p.role === 'gerant').length;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">OrderFlow — Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/gerants"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" /> Comptes
            </Link>
            <Link
              href="/admin/tenants/new"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Nouveau traiteur
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Traiteurs total',  value: tenants.length,  color: 'text-gray-900' },
            { label: 'Actifs',           value: activeCount,     color: 'text-green-600' },
            { label: 'Gérants',          value: gerantCount,     color: 'text-indigo-600' },
            { label: 'Admins SaaS',      value: adminCount,      color: 'text-gray-600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Liste des traiteurs */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Traiteurs ({tenants.length})
          </h2>

          {tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
              <Store className="h-12 w-12 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Aucun traiteur encore.</p>
              <Link
                href="/admin/tenants/new"
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Créer le premier
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tenants.map(tenant => (
                <div
                  key={tenant.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header carte */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-8 w-8 rounded-lg shrink-0"
                        style={{ backgroundColor: tenant.primary_color }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-tight">{tenant.name}</h3>
                        <p className="text-xs text-gray-400 font-mono">{tenant.slug}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tenant.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {/* Infos */}
                  <div className="space-y-1 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {gerantsForTenant(tenant.id)} gérant{gerantsForTenant(tenant.id) !== 1 ? 's' : ''}
                    </div>
                    <div className={`flex items-center gap-1.5 ${tenant.whatsapp_number ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{tenant.whatsapp_number ? '✓ WhatsApp configuré' : '○ WhatsApp non configuré'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/${tenant.slug}/orders`}
                      className="flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> Dashboard
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
