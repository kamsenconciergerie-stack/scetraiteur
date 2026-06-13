'use client';

import { AlertTriangle, Package } from 'lucide-react';
import type { Product } from '@/lib/types';

interface Props {
  products: Product[];
}

export function StockAlerts({ products }: Props) {
  const alerts = products.filter(p => p.stock_quantity <= p.stock_alert_threshold);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h3 className="font-semibold text-amber-800">
          {alerts.length} article{alerts.length > 1 ? 's' : ''} en stock faible
        </h3>
      </div>
      <ul className="space-y-1">
        {alerts.map(p => (
          <li key={p.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-amber-700">
              <Package className="h-3.5 w-3.5" />
              {p.name}
            </span>
            <span className={`font-bold ${p.stock_quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
              {p.stock_quantity === 0 ? 'Rupture' : `${p.stock_quantity} restants`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
