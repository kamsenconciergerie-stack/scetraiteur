'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { Package, Plus, Minus } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  products:  Product[];
  onRefresh: () => void;
}

export function StockTable({ products, onRefresh }: Props) {
  const [updating, setUpdating] = useState<string | null>(null);

  async function adjustStock(product: Product, delta: number) {
    const newQty = Math.max(0, product.stock_quantity + delta);
    setUpdating(product.id);
    await supabase
      .from('products')
      .update({ stock_quantity: newQty })
      .eq('id', product.id);
    setUpdating(null);
    onRefresh();
  }

  async function toggleAvailability(product: Product) {
    setUpdating(product.id);
    await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);
    setUpdating(null);
    onRefresh();
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">Produit</th>
            <th className="px-4 py-3 text-left">Prix</th>
            <th className="px-4 py-3 text-left">Stock</th>
            <th className="px-4 py-3 text-left">Seuil alerte</th>
            <th className="px-4 py-3 text-left">Disponible</th>
            <th className="px-4 py-3 text-left">Ajuster</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {products.map(product => {
            const isLow     = product.stock_quantity <= product.stock_alert_threshold;
            const isOut     = product.stock_quantity === 0;
            return (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{product.price.toFixed(2)} €</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'font-bold',
                    isOut  ? 'text-red-600' :
                    isLow  ? 'text-amber-600' :
                             'text-green-600'
                  )}>
                    {product.stock_quantity}
                    {isOut && <span className="ml-1 text-xs font-normal">(rupture)</span>}
                    {!isOut && isLow && <span className="ml-1 text-xs font-normal">(faible)</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{product.stock_alert_threshold}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAvailability(product)}
                    disabled={updating === product.id}
                    className={clsx(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      product.is_available
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {product.is_available ? 'Oui' : 'Non'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustStock(product, -1)}
                      disabled={updating === product.id || product.stock_quantity === 0}
                      className="rounded-md border p-1 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => adjustStock(product, +1)}
                      disabled={updating === product.id}
                      className="rounded-md border p-1 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => adjustStock(product, +10)}
                      disabled={updating === product.id}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-30"
                    >
                      +10
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
