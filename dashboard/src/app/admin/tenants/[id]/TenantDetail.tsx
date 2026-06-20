'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateTenantAction,
  deleteTenantAction,
  createGerantAction,
  deleteGerantAction,
} from '../../actions';
import { ArrowLeft, ExternalLink, Trash2, Plus, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface TenantFull {
  id: string; slug: string; name: string; primary_color: string;
  whatsapp_number: string | null; phone_number_id: string | null;
  whatsapp_token: string | null; verify_token: string | null;
  is_active: boolean; created_at: string;
}
interface GerantRow { id: string; user_id: string; email: string; created_at: string; }

interface Props {
  tenant:      TenantFull;
  gerants:     GerantRow[];
  ordersCount: number;
}

const EMPTY_GERANT = { email: '', password: '' };

export function TenantDetail({ tenant: initial, gerants: initialGerants, ordersCount }: Props) {
  const [tenant,      setTenant]      = useState(initial);
  const [gerants,     setGerants]     = useState(initialGerants);
  const [saved,       setSaved]       = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [showGerant,  setShowGerant]  = useState(false);
  const [newGerant,   setNewGerant]   = useState(EMPTY_GERANT);
  const [deleteSlug,  setDeleteSlug]  = useState('');
  const [isPending,   startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    setFormError(null);
    startTransition(async () => {
      const res = await updateTenantAction(tenant.id, {
        name:            tenant.name,
        slug:            tenant.slug,
        primary_color:   tenant.primary_color,
        whatsapp_number: tenant.whatsapp_number ?? '',
        phone_number_id: tenant.phone_number_id ?? '',
        whatsapp_token:  tenant.whatsapp_token  ?? '',
        is_active:       tenant.is_active,
      });
      if (res.error) { setFormError(res.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  function handleAddGerant() {
    setFormError(null);
    startTransition(async () => {
      const res = await createGerantAction({ ...newGerant, tenant_id: tenant.id });
      if (res.error) { setFormError(res.error); return; }
      setShowGerant(false);
      setNewGerant(EMPTY_GERANT);
      // Refresh gérants list
      router.refresh();
    });
  }

  function handleDeleteGerant(userId: string, email: string) {
    if (!confirm(`Supprimer le compte de ${email} ?`)) return;
    startTransition(async () => {
      await deleteGerantAction(userId);
      setGerants(g => g.filter(x => x.user_id !== userId));
    });
  }

  function handleDeleteTenant() {
    if (deleteSlug !== tenant.slug) return;
    startTransition(async () => {
      await deleteTenantAction(tenant.id);
      router.push('/admin');
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-5 rounded" style={{ backgroundColor: tenant.primary_color }} />
              <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tenant.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${tenant.slug}/orders`}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <Link
              href={`/commander/${tenant.slug}`}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Commande client
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Commandes', value: ordersCount },
            { label: 'Gérants',   value: gerants.length },
            { label: 'Slug',      value: tenant.slug, mono: true },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className={`text-lg font-bold text-gray-900 ${s.mono ? 'font-mono text-sm' : ''}`}>
                {s.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Informations générales */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Informations générales</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <input
                type="text"
                value={tenant.name}
                onChange={e => setTenant(t => ({ ...t, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
              <input
                type="text"
                value={tenant.slug}
                onChange={e => setTenant(t => ({ ...t, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Couleur</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={tenant.primary_color}
                  onChange={e => setTenant(t => ({ ...t, primary_color: e.target.value }))}
                  className="h-9 w-16 cursor-pointer rounded-lg border border-gray-300 p-0.5"
                />
                <input
                  type="text"
                  value={tenant.primary_color}
                  onChange={e => setTenant(t => ({ ...t, primary_color: e.target.value }))}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-5">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tenant.is_active}
                  onChange={e => setTenant(t => ({ ...t, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                Traiteur actif
              </label>
            </div>
          </div>
        </div>

        {/* Configuration WhatsApp */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Configuration WhatsApp</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Numéro WhatsApp</label>
              <input
                type="tel"
                value={tenant.whatsapp_number ?? ''}
                onChange={e => setTenant(t => ({ ...t, whatsapp_number: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number ID</label>
              <input
                type="text"
                value={tenant.phone_number_id ?? ''}
                onChange={e => setTenant(t => ({ ...t, phone_number_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Access Token Meta</label>
              <input
                type="password"
                value={tenant.whatsapp_token ?? ''}
                onChange={e => setTenant(t => ({ ...t, whatsapp_token: e.target.value }))}
                placeholder="Laisser vide pour ne pas modifier"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Verify Token webhook <span className="font-normal text-gray-400">(à coller dans Meta)</span>
              </label>
              <input
                type="text"
                value={tenant.verify_token ?? ''}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Bouton sauvegarde */}
        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer les modifications'}
        </button>

        {/* Gérants */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Gérants de ce traiteur</h2>
            <button
              onClick={() => setShowGerant(v => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter un gérant
            </button>
          </div>

          {showGerant && (
            <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={newGerant.email}
                    onChange={e => setNewGerant(g => ({ ...g, email: e.target.value }))}
                    placeholder="gerant@traiteur.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={newGerant.password}
                    onChange={e => setNewGerant(g => ({ ...g, password: e.target.value }))}
                    placeholder="Min. 8 caractères"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddGerant}
                  disabled={isPending || !newGerant.email || !newGerant.password}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? '…' : 'Créer le compte'}
                </button>
                <button onClick={() => setShowGerant(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {gerants.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun gérant encore. Ajoutez-en un pour qu'il puisse se connecter.</p>
          ) : (
            <div className="space-y-2">
              {gerants.map(g => (
                <div key={g.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{g.email}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteGerant(g.user_id, g.email)}
                    disabled={isPending}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone dangereuse */}
        <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-700">Zone dangereuse</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Supprimer ce traiteur effacera définitivement toutes ses commandes, produits,
            livreurs et comptes gérants. Cette action est irréversible.
          </p>
          <div className="space-y-2">
            <label className="block text-xs text-gray-600">
              Tapez <span className="font-mono font-bold text-red-600">{tenant.slug}</span> pour confirmer
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={deleteSlug}
                onChange={e => setDeleteSlug(e.target.value)}
                placeholder={tenant.slug}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={handleDeleteTenant}
                disabled={isPending || deleteSlug !== tenant.slug}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {isPending ? '…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
