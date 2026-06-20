'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { JOURS, type LivreurAgenda, type LivreurConge } from '@/lib/types';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  livreurId: string;
}

const EMPTY_SLOT  = { jour_semaine: 1, heure_debut: '08:00', heure_fin: '18:00' };
const EMPTY_CONGE = { date_debut: '', date_fin: '', raison: '' };

export function AgendaTable({ livreurId }: Props) {
  const [slots,       setSlots]       = useState<LivreurAgenda[]>([]);
  const [conges,      setConges]      = useState<LivreurConge[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showSlot,    setShowSlot]    = useState(false);
  const [showConge,   setShowConge]   = useState(false);
  const [newSlot,     setNewSlot]     = useState(EMPTY_SLOT);
  const [newConge,    setNewConge]    = useState(EMPTY_CONGE);
  const [slotSaving,  setSlotSaving]  = useState(false);
  const [congeSaving, setCongeSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [slotsRes, congesRes] = await Promise.all([
      supabase
        .from('livreur_agenda')
        .select('*')
        .eq('livreur_id', livreurId)
        .eq('actif', true)
        .order('jour_semaine')
        .order('heure_debut'),
      supabase
        .from('livreur_conges')
        .select('*')
        .eq('livreur_id', livreurId)
        .gte('date_fin', new Date().toISOString())
        .order('date_debut'),
    ]);
    setSlots(slotsRes.data ?? []);
    setConges(congesRes.data ?? []);
    setLoading(false);
  }, [livreurId]);

  useEffect(() => { load(); }, [load]);

  async function addSlot() {
    if (newSlot.heure_fin <= newSlot.heure_debut) return;
    setSlotSaving(true);
    await supabase.from('livreur_agenda').insert({ livreur_id: livreurId, ...newSlot });
    setSlotSaving(false);
    setShowSlot(false);
    setNewSlot(EMPTY_SLOT);
    load();
  }

  async function deleteSlot(id: string) {
    await supabase.from('livreur_agenda').update({ actif: false }).eq('id', id);
    load();
  }

  async function addConge() {
    if (!newConge.date_debut || !newConge.date_fin) return;
    setCongeSaving(true);
    await supabase.from('livreur_conges').insert({
      livreur_id: livreurId,
      date_debut: newConge.date_debut,
      date_fin:   newConge.date_fin,
      raison:     newConge.raison || null,
    });
    setCongeSaving(false);
    setShowConge(false);
    setNewConge(EMPTY_CONGE);
    load();
  }

  async function deleteConge(id: string) {
    await supabase.from('livreur_conges').delete().eq('id', id);
    load();
  }

  const slotsByDay = JOURS.map(jour => ({
    ...jour,
    slots: slots.filter(s => s.jour_semaine === jour.value),
  }));

  if (loading) {
    return <div className="py-4 text-xs text-gray-400">Chargement de l'agenda...</div>;
  }

  return (
    <div className="space-y-6 pt-4">

      {/* Planning hebdomadaire */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Planning hebdomadaire</h4>
          <button
            onClick={() => setShowSlot(v => !v)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="h-3 w-3" /> Ajouter un créneau
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {slotsByDay.map(({ value, label, slots: daySlots }) => (
                <tr key={value} className="bg-white">
                  <td className="px-4 py-2.5 text-gray-500 font-medium w-28 text-xs">{label}</td>
                  <td className="px-4 py-2.5">
                    {daySlots.length === 0 ? (
                      <span className="text-gray-300 text-xs">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map(slot => (
                          <span
                            key={slot.id}
                            className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700"
                          >
                            {slot.heure_debut.slice(0, 5)} – {slot.heure_fin.slice(0, 5)}
                            <button
                              onClick={() => deleteSlot(slot.id)}
                              className="ml-0.5 text-indigo-400 hover:text-red-500 transition-colors leading-none"
                              title="Supprimer ce créneau"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showSlot && (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jour</label>
              <select
                value={newSlot.jour_semaine}
                onChange={e => setNewSlot(s => ({ ...s, jour_semaine: Number(e.target.value) }))}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                {JOURS.map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">De</label>
              <input
                type="time"
                value={newSlot.heure_debut}
                onChange={e => setNewSlot(s => ({ ...s, heure_debut: e.target.value }))}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">À</label>
              <input
                type="time"
                value={newSlot.heure_fin}
                onChange={e => setNewSlot(s => ({ ...s, heure_fin: e.target.value }))}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={addSlot}
              disabled={slotSaving || newSlot.heure_fin <= newSlot.heure_debut}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {slotSaving ? '…' : 'Ajouter'}
            </button>
            <button
              onClick={() => { setShowSlot(false); setNewSlot(EMPTY_SLOT); }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Congés / absences */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Absences à venir</h4>
          <button
            onClick={() => setShowConge(v => !v)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
          >
            <Calendar className="h-3 w-3" /> Ajouter une absence
          </button>
        </div>

        {conges.length === 0 && !showConge ? (
          <p className="text-xs text-gray-400">Aucune absence planifiée.</p>
        ) : (
          <div className="space-y-1.5 mb-3">
            {conges.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg bg-yellow-50 border border-yellow-100 px-4 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-yellow-800">
                    {format(new Date(c.date_debut), 'dd MMM', { locale: fr })}
                    {' → '}
                    {format(new Date(c.date_fin), 'dd MMM yyyy', { locale: fr })}
                  </span>
                  {c.raison && (
                    <span className="ml-2 text-yellow-600 text-xs">"{c.raison}"</span>
                  )}
                </div>
                <button
                  onClick={() => deleteConge(c.id)}
                  className="text-yellow-500 hover:text-red-500 transition-colors"
                  title="Supprimer cette absence"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showConge && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Du</label>
              <input
                type="datetime-local"
                value={newConge.date_debut}
                onChange={e => setNewConge(c => ({ ...c, date_debut: e.target.value }))}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Au</label>
              <input
                type="datetime-local"
                value={newConge.date_fin}
                onChange={e => setNewConge(c => ({ ...c, date_fin: e.target.value }))}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Raison (opt.)</label>
              <input
                type="text"
                value={newConge.raison}
                onChange={e => setNewConge(c => ({ ...c, raison: e.target.value }))}
                placeholder="ex : vacances"
                className="rounded border border-gray-300 px-2 py-1.5 text-sm w-36"
              />
            </div>
            <button
              onClick={addConge}
              disabled={congeSaving || !newConge.date_debut || !newConge.date_fin}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {congeSaving ? '…' : 'Ajouter'}
            </button>
            <button
              onClick={() => { setShowConge(false); setNewConge(EMPTY_CONGE); }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
