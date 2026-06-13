import { ShoppingBag, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import type { Order } from '@/lib/types';

interface Props {
  orders: Order[];
}

export function DashboardStats({ orders }: Props) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const pending = orders.filter(o =>
    ['received', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)
  ).length;

  const delivered = orders.filter(o => o.status === 'delivered').length;

  const stats = [
    {
      label:   'Commandes aujourd\'hui',
      value:   todayOrders.length,
      icon:    ShoppingBag,
      color:   'text-blue-600',
      bg:      'bg-blue-50',
    },
    {
      label:   'En cours',
      value:   pending,
      icon:    Clock,
      color:   'text-amber-600',
      bg:      'bg-amber-50',
    },
    {
      label:   'Livrées (total)',
      value:   delivered,
      icon:    CheckCircle,
      color:   'text-green-600',
      bg:      'bg-green-50',
    },
    {
      label:   'CA livré',
      value:   `${totalRevenue.toFixed(2)} €`,
      icon:    TrendingUp,
      color:   'text-purple-600',
      bg:      'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map(stat => (
        <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className={`inline-flex rounded-lg p-2 ${stat.bg} mb-3`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
