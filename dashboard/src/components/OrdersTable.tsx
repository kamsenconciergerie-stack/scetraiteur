'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from './StatusBadge';
import type { Order, OrderStatus } from '@/lib/types';
import { MessageCircle, Globe, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  received:         'confirmed',
  confirmed:        'preparing',
  stock_issue:      'confirmed',
  preparing:        'out_for_delivery',
  out_for_delivery: 'delivered',
};

interface Props {
  orders:    Order[];
  onRefresh: () => void;
}

export function OrdersTable({ orders, onRefresh }: Props) {
  const [updating, setUpdating] = useState<string | null>(null);

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(order.id);
    await supabase
      .from('orders')
      .update({ status: next })
      .eq('id', order.id);
    setUpdating(null);
    onRefresh();
  }

  async function cancelOrder(order: Order) {
    if (!confirm(`Annuler la commande ${order.order_number} ?`)) return;
    setUpdating(order.id);
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id);
    setUpdating(null);
    onRefresh();
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        Aucune commande pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">N°</th>
            <th className="px-4 py-3 text-left">Client</th>
            <th className="px-4 py-3 text-left">Canal</th>
            <th className="px-4 py-3 text-left">Total</th>
            <th className="px-4 py-3 text-left">Statut</th>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono font-medium text-gray-900">
                {order.order_number}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{order.customer_name}</div>
                <div className="text-gray-400 text-xs">{order.customer_phone}</div>
              </td>
              <td className="px-4 py-3">
                {order.channel === 'whatsapp'
                  ? <MessageCircle className="h-4 w-4 text-green-500" />
                  : <Globe className="h-4 w-4 text-blue-500" />
                }
              </td>
              <td className="px-4 py-3 font-medium">
                {order.total != null ? `${order.total.toFixed(2)} €` : '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {format(new Date(order.created_at), 'dd MMM HH:mm', { locale: fr })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {NEXT_STATUS[order.status] && (
                    <button
                      onClick={() => advanceStatus(order)}
                      disabled={updating === order.id}
                      className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                      Avancer
                    </button>
                  )}
                  {!['delivered', 'cancelled'].includes(order.status) && (
                    <button
                      onClick={() => cancelOrder(order)}
                      disabled={updating === order.id}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
