'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTenantPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:             '',
    slug:             '',
    whatsapp_number:  '',
    phone_number_id:  '',
    whatsapp_token:   '',
    verify_token:     crypto.randomUUID(),
    primary_color:    '#1a56db',
  });

  function handleName(value: string) {
    const slug = value
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setForm(f => ({ ...f, name: value, slug }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('tenants').insert([form]);
    setSaving(false);
    if (!error) router.push('/admin');
    else alert('Erreur : ' + error.message);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Nouveau client traiteur</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entreprise *
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={e => handleName(e.target.value)}
              placeholder="Dupont Traiteur"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (URL) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">orderflow.app/</span>
              <input
                required
                type="text"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <hr />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro WhatsApp Business
            </label>
            <input
              type="text"
              value={form.whatsapp_number}
              onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))}
              placeholder="+33612345678"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number ID (Meta)
            </label>
            <input
              type="text"
              value={form.phone_number_id}
              onChange={e => setForm(f => ({ ...f, phone_number_id: e.target.value }))}
              placeholder="123456789012345"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp Access Token (Meta)
            </label>
            <input
              type="password"
              value={form.whatsapp_token}
              onChange={e => setForm(f => ({ ...f, whatsapp_token: e.target.value }))}
              placeholder="EAABw..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verify Token (webhook Meta)
            </label>
            <input
              type="text"
              value={form.verify_token}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              À coller dans Meta Business Manager › Webhook › Verify Token
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur principale
            </label>
            <input
              type="color"
              value={form.primary_color}
              onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
              className="h-10 w-20 cursor-pointer rounded-lg border border-gray-300"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Création...' : 'Créer le client'}
          </button>
        </form>
      </main>
    </div>
  );
}
