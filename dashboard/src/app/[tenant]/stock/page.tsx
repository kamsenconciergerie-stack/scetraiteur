'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { StockTable } from '@/components/StockTable';
import { StockAlerts } from '@/components/StockAlerts';
import type { Product } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

export default function StockPage({ params }: { params: { tenant: string } }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', params.tenant)
      .single();

    if (!tenantData) { setLoading(false); return; }

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantData.id)
      .order('name');

    setProducts(data ?? []);
    setLoading(false);
  }, [params.tenant]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion du stock</h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <StockAlerts products={products} />

      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <StockTable products={products} onRefresh={load} />
      )}
    </div>
  );
}
