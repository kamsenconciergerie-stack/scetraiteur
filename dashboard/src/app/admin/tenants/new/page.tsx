'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTenantAction } from '../../actions';
import { ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const EMPTY = {
  name:            '',
  slug:            '',
  primary_color:   '#4f46e5',
  whatsapp_number: '',
  phone_number_id: '',
  whatsapp_token:  '',
};

export default function NewTenantPage() {
  const [form,      setForm]      = useState(EMPTY);
  const [error,     setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleNameChange(name: string) {
    setForm(f => ({
      ...f,
      name,
      slug: f.slug === slugify(f.name) || f.slug === '' ? slugify(name) : f.slug,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    setError(null);
    startTransition(async () => {
      const res = await createTenantAction(form);
      if ('error' in res && res.error) { setError(res.error); return; }
      if ('id' in res) router.push(`/admin/tenants/${res.id}`);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">Nouveau traiteur</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Infos générales */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Informations générales</h2>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nom du traiteur <span className="text-red-500">*</span>
              </label>
              <input
                type="text" required
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Kamsen Traiteur"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Slug URL <span className="text-red-500">*</span>
                <span className="ml-1 font-normal text-gray-400">— identifiant unique</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400 shrink-0">orderflow.app/</span>
                <input
                  type="text" required
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="kamsen-traiteur"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {form.slug && (
                <p className="mt-1.5 text-xs text-gray-400 space-y-0.5">
                  <span className="block">📊 Dashboard : /{form.slug}/orders</span>
                  <span className="block">🛒 Commande client : /commander/{form.slug}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Couleur principale</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="h-9 w-16 cursor-pointer rounded-lg border border-gray-300 p-0.5"
                />
                <input
                  type="text"
                  value={form.primary_color}
                  onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="h-9 w-9 rounded-lg border border-gray-200" style={{ backgroundColor: form.primary_color }} />
              </div>
            </div>
          </div>

          {/* Config WhatsApp */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Configuration WhatsApp</h2>
              <p className="text-xs text-gray-400 mt-0.5">Depuis la console Meta Developers du traiteur — peut être ajouté plus tard</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Numéro WhatsApp Business</label>
              <input
                type="tel"
                value={form.whatsapp_number}
                onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                placeholder="+221 77 123 45 67"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number ID (Meta)</label>
              <input
                type="text"
                value={form.phone_number_id}
                onChange={e => setForm(f => ({ ...f, phone_number_id: e.target.value }))}
                placeholder="123456789012345"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Access Token Meta</label>
              <input
                type="password"
                value={form.whatsapp_token}
                onChange={e => setForm(f => ({ ...f, whatsapp_token: e.target.value }))}
                placeholder="EAAxxxxxxxxxxxxxxx"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending || !form.name || !form.slug}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Création…' : 'Créer le traiteur'}
            </button>
            <Link
              href="/admin"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Annuler
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
