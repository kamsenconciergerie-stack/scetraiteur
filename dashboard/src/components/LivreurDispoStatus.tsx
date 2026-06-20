import type { LivreurDisponibilite } from '@/lib/types';

const CONFIG: Record<LivreurDisponibilite, { label: string; dot: string; badge: string }> = {
  disponible:  { label: 'Disponible',   dot: 'bg-green-400',  badge: 'bg-green-100 text-green-800' },
  occupe:      { label: 'En livraison', dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-800' },
  hors_plage:  { label: 'Hors plage',   dot: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-500' },
  conge:       { label: 'En congé',     dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
  inactif:     { label: 'Inactif',      dot: 'bg-red-300',    badge: 'bg-red-50 text-red-400' },
};

export function LivreurDispoStatus({ dispo }: { dispo: LivreurDisponibilite }) {
  const { label, dot, badge } = CONFIG[dispo] ?? CONFIG.inactif;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
