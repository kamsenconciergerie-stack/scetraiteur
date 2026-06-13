'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { OrdersTable } from '@/components/OrdersTable';
import { DashboardStats } from '@/components/DashboardStats';
import { StockAlerts } from '@/components/StockAlerts';
import type { Order, Product } from '@/lib/types';
import { RefreshCw, Filter } from 'lucide-react';

const STATUS_FILTERS = [
  { value: 'all',      label: 'Toutes' },
  { value: 'received', label: 'Reçues' },
  { value: 'confirmed',label: 'Confirmées' },
  { value: 'stock_issue', label: '⚠️ Stock' },
  { value: 'preparing',label: 'En préparation' },
  { value: 'out_for_delivery', label: 'En livraison' },
  { value: 'delivered',label: 'Livrées' },
  { value: 'cancelled',label: 'Annulées' },
];

export default function OrdersPage({ params }: { params: { tenant: string } }) {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter,   setFilter]   = useState('all');
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', params.tenant)
      .single();

    if (!tenantData) { setLoading(false); return; }

    const [ordersRes, productsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, order_items(*), livreurs(name, phone)')
        .eq('tenant_id', tenantData.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .eq('is_available', true),
    ]);

    setOrders(ordersRes.data ?? []);
    setProducts(productsRes.data ?? []);
    setLoading(false);
  }, [params.tenant]);

  // Chargement initial
  useEffect(() => { load(); }, [load]);

  // Temps réel — Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <DashboardStats orders={orders} />

      <StockAlerts products={products} />

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1 text-xs opacity-70">
                ({orders.filter(o => o.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <OrdersTable orders={filtered} onRefresh={load} />
      )}
    </div>
  );
}
