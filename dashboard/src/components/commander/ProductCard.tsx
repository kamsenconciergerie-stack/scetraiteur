'use client';

import { Minus, Plus } from 'lucide-react';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  qty: number;
  brandColor: string;
  onAdd: () => void;
  onRemove: () => void;
}

function formatFCFA(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export default function ProductCard({
  product,
  qty,
  brandColor,
  onAdd,
  onRemove,
}: ProductCardProps) {
  const outOfStock = product.stock_quantity === 0;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Infos produit */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className="font-semibold text-gray-900 text-sm leading-snug flex-1">
            {product.name}
          </p>
          {outOfStock && (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
              Rupture
            </span>
          )}
        </div>

        {product.description && (
          <p
            className="mt-1 text-xs text-gray-400 leading-relaxed"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </p>
        )}

        <p className="mt-2 text-sm font-bold" style={{ color: brandColor }}>
          {formatFCFA(product.price)}
        </p>
      </div>

      {/* Contrôles quantité */}
      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        {outOfStock ? (
          <span className="text-xs text-gray-400 italic">Indisponible</span>
        ) : qty > 0 ? (
          <>
            <button
              onClick={onRemove}
              aria-label={`Retirer un ${product.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 active:bg-gray-50 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-5 text-center text-sm font-bold text-gray-900">
              {qty}
            </span>
            <button
              onClick={onAdd}
              aria-label={`Ajouter un ${product.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity active:opacity-80"
              style={{ backgroundColor: brandColor }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={onAdd}
            aria-label={`Ajouter ${product.name} au panier`}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: brandColor }}
          >
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
}
