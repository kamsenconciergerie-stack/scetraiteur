'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AgendaTable } from '@/components/AgendaTable';
import { LivreurDispoStatus } from '@/components/LivreurDispoStatus';
import { ChevronDown, ChevronUp, Plus, Truck, RefreshCw } from 'lucide-react';
import type { LivreurAvecDispo } from '@/lib/types';

export default function LivreursPage({ params }: { params: { tenant: string } }) {
  const [tenantId,   setTenantId]   = useState<string | null>(null);
  const [livreurs,   setLivreurs]   = useState<LivreurAvecDispo[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [newL,       setNewL]       = useState({ name: '', phone: '' });
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', params.tenant)
      .single();

    if (!tenantData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setTenantId(tenantData.id);

    const { data } = await supabase
      .from('v_livreurs_disponibilite')
      .select('*')
      .eq('tenant_id', tenantData.id)
      .order('name');

    setLivreurs((data as LivreurAvecDispo[]) ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [params.tenant]);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(livreur: LivreurAvecDispo) {
    await supabase
      .from('livreurs')
      .update({ is_active: !livreur.is_active })
      .eq('id', livreur.id);
    load(true);
  }

  async function addLivreur() {
    if (!tenantId || !newL.name.trim() || !newL.phone.trim()) return;
    setSaving(true);
    await supabase.from('livreurs').insert({
      tenant_id: tenantId,
      name:      newL.name.trim(),
      phone:     newL.phone.trim(),
    });
    setSaving(false);
    setShowForm(false);
    setNewL({ name: '', phone: '' });
    load(true);
  }

  const disponibles = livreurs.filter(l => l.disponibilite === 'disponible').length;
  const occupes     = livreurs.filter(l => l.disponibilite === 'occupe').length;

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">Chargement des livreurs…</div>
    );
  }

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livreurs</h1>
          <p className="text-gray-500 text-sm mt-1">
            {livreurs.length} livreur{livreurs.length > 1 ? 's' : ''}
            {' · '}
            <span className="text-green-600 font-medium">{disponibles} disponible{disponibles > 1 ? 's' : ''}</span>
            {occupes > 0 && (
              <span className="text-orange-600 font-medium"> · {occupes} en livraison</span>
            )}
            {' · '}
            <span className="text-gray-400 text-xs">Assignation automatique activée</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nouveau livreur
          </button>
        </div>
      </div>

      {/* Formulaire ajout livreur */}
      {showForm && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nom complet</label>
            <input
              type="text"
              value={newL.name}
              onChange={e => setNewL(l => ({ ...l, name: e.target.value }))}
              placeholder="Mamadou Diallo"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
            <input
              type="tel"
              value={newL.phone}
              onChange={e => setNewL(l => ({ ...l, phone: e.target.value }))}
              placeholder="+221 77 123 45 67"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={addLivreur}
            disabled={saving || !newL.name.trim() || !newL.phone.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '…' : 'Créer'}
          </button>
          <button
            onClick={() => { setShowForm(false); setNewL({ name: '', phone: '' }); }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Liste des livreurs */}
      <div className="space-y-3">
        {livreurs.map(livreur => (
          <div
            key={livreur.id}
            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Ligne principale */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 shrink-0">
                  <Truck className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{livreur.name}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{livreur.phone}</div>
                </div>
                <LivreurDispoStatus dispo={livreur.disponibilite} />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={livreur.is_active}
                    onChange={() => toggleActive(livreur)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Actif
                </label>
                <button
                  onClick={() => setExpanded(id => id === livreur.id ? null : livreur.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Agenda
                  {expanded === livreur.id
                    ? <ChevronUp  className="h-3 w-3" />
                    : <ChevronDown className="h-3 w-3" />
                  }
                </button>
              </div>
            </div>

            {/* Agenda déroulant */}
            {expanded === livreur.id && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 pb-5">
                <AgendaTable livreurId={livreur.id} />
              </div>
            )}
          </div>
        ))}

        {livreurs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Truck className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Aucun livreur enregistré.</p>
            <p className="text-gray-300 text-xs mt-1">Cliquez sur "Nouveau livreur" pour commencer.</p>
          </div>
        )}
      </div>

      {/* Note d'info */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-600">
        <strong>Assignation automatique</strong> — Chaque nouvelle commande est attribuée au livreur
        disponible dans les 30 minutes qui suivent, selon son planning hebdomadaire et ses absences.
        Si aucun livreur n'est disponible, la commande reste non assignée pour une attribution manuelle.
      </div>
    </div>
  );
}
