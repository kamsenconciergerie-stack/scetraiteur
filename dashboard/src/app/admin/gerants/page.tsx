'use client';

import { useEffect, useState, useTransition } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { createGerantAction, createAdminSaasAction, deleteGerantAction } from '../actions';
import { Users, Plus, Trash2, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import type { Tenant } from '@/lib/types';

interface UserProfile {
  id:         string;
  user_id:    string;
  email:      string;
  role:       string;
  tenant_id:  string | null;
  created_at: string;
  tenants?:   { name: string; slug: string } | null;
}

const EMPTY_GERANT = { email: '', password: '', tenant_id: '' };
const EMPTY_ADMIN  = { email: '', password: '' };

export default function GerantsPage() {
  const [profiles,      setProfiles]      = useState<UserProfile[]>([]);
  const [tenants,       setTenants]       = useState<Tenant[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showGerant,    setShowGerant]    = useState(false);
  const [showAdmin,     setShowAdmin]     = useState(false);
  const [newGerant,     setNewGerant]     = useState(EMPTY_GERANT);
  const [newAdmin,      setNewAdmin]      = useState(EMPTY_ADMIN);
  const [formError,     setFormError]     = useState<string | null>(null);
  const [isPending,     startTransition]  = useTransition();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function load() {
    setLoading(true);
    const [profilesRes, tenantsRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*, tenants(name, slug)')
        .order('created_at', { ascending: false }),
      supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
        .order('name'),
    ]);
    setProfiles((profilesRes.data as UserProfile[]) ?? []);
    setTenants(tenantsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleCreateGerant() {
    setFormError(null);
    startTransition(async () => {
      const res = await createGerantAction(newGerant);
      if (res.error) { setFormError(res.error); return; }
      setShowGerant(false);
      setNewGerant(EMPTY_GERANT);
      load();
    });
  }

  function handleCreateAdmin() {
    setFormError(null);
    startTransition(async () => {
      const res = await createAdminSaasAction(newAdmin);
      if (res.error) { setFormError(res.error); return; }
      setShowAdmin(false);
      setNewAdmin(EMPTY_ADMIN);
      load();
    });
  }

  function handleDelete(userId: string, email: string) {
    if (!confirm(`Supprimer le compte de ${email} ?`)) return;
    startTransition(async () => {
      await deleteGerantAction(userId);
      load();
    });
  }

  const gerants   = profiles.filter(p => p.role === 'gerant');
  const admins    = profiles.filter(p => p.role === 'admin_saas');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">Gestion des comptes</h1>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Retour admin
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* Gérants */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Gérants</h2>
              <p className="text-xs text-gray-500 mt-0.5">Un gérant accède au dashboard d'un seul traiteur.</p>
            </div>
            <button
              onClick={() => { setShowGerant(v => !v); setShowAdmin(false); setFormError(null); }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Nouveau gérant
            </button>
          </div>

          {showGerant && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Créer un compte gérant</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={newGerant.email}
                    onChange={e => setNewGerant(g => ({ ...g, email: e.target.value }))}
                    placeholder="gerant@dupont-traiteur.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={newGerant.password}
                    onChange={e => setNewGerant(g => ({ ...g, password: e.target.value }))}
                    placeholder="Min. 8 caractères"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Traiteur associé</label>
                  <select
                    value={newGerant.tenant_id}
                    onChange={e => setNewGerant(g => ({ ...g, tenant_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— Sélectionner un traiteur —</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                    ))}
                  </select>
                </div>
              </div>
              {formError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCreateGerant}
                  disabled={isPending || !newGerant.email || !newGerant.password || !newGerant.tenant_id}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Création…' : 'Créer le compte'}
                </button>
                <button
                  onClick={() => setShowGerant(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-10 text-center text-gray-400 text-sm">Chargement…</div>
            ) : gerants.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Aucun gérant encore.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Traiteur</th>
                    <th className="px-5 py-3 text-left">Dashboard</th>
                    <th className="px-5 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gerants.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{p.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {p.tenants?.name ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        {p.tenants?.slug && (
                          <Link
                            href={`/${p.tenants.slug}/orders`}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            /{p.tenants.slug}/orders
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDelete(p.user_id, p.email)}
                          disabled={isPending}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Admins SaaS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Administrateurs SaaS</h2>
              <p className="text-xs text-gray-500 mt-0.5">Accès complet à tous les tenants et à cette page.</p>
            </div>
            <button
              onClick={() => { setShowAdmin(v => !v); setShowGerant(false); setFormError(null); }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" /> Nouvel admin
            </button>
          </div>

          {showAdmin && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Créer un compte administrateur SaaS</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={e => setNewAdmin(a => ({ ...a, email: e.target.value }))}
                    placeholder="admin@orderflow.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={e => setNewAdmin(a => ({ ...a, password: e.target.value }))}
                    placeholder="Min. 8 caractères"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              {formError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCreateAdmin}
                  disabled={isPending || !newAdmin.email || !newAdmin.password}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Création…' : 'Créer l'admin'}
                </button>
                <button
                  onClick={() => setShowAdmin(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {admins.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Aucun administrateur.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {admins.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-indigo-500" />
                          <span className="text-gray-900">{p.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDelete(p.user_id, p.email)}
                          disabled={isPending}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
