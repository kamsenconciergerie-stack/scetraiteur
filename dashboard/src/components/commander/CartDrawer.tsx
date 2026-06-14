'use client';

import { useEffect, useRef } from 'react';
import { Minus, Plus, Trash2, X, ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';

export interface CartItem extends Product {
  qty: number;
}

interface CartDrawerProps {
  items: CartItem[];
  brandColor: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAdd: (product: Product) => void;
  onRemove: (id: string) => void;
  onDelete: (id: string) => void;
  onCheckout: () => void;
}

function formatFCFA(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export default function CartDrawer({
  items,
  brandColor,
  open,
  onOpen,
  onClose,
  onAdd,
  onRemove,
  onDelete,
  onCheckout,
}: CartDrawerProps) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const drawerRef = useRef<HTMLDivElement>(null);

  /* Fermeture par touche Échap */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* Bloquer le scroll body quand le drawer est ouvert */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      {/* Bouton sticky bas d'écran */}
      {!open && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-area-inset-bottom">
          <div className="pb-4 max-w-lg mx-auto">
            <button
              onClick={onOpen}
              aria-label="Ouvrir le panier"
              className="w-full flex items-center justify-between rounded-2xl px-5 py-3.5 text-white shadow-2xl transition-opacity active:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5" />
                <span className="font-semibold text-sm">
                  Mon panier ({totalQty} article{totalQty > 1 ? 's' : ''})
                </span>
              </div>
              <span className="font-bold text-sm">{formatFCFA(total)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer coulissant du bas */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag indicator */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            Mon panier
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({totalQty} article{totalQty > 1 ? 's' : ''})
            </span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer le panier"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Liste des articles */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatFCFA(item.price)} / unité
                </p>
              </div>

              {/* Contrôles quantité */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onRemove(item.id)}
                  aria-label={`Retirer un ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 active:bg-gray-50"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-sm font-bold text-gray-900">
                  {item.qty}
                </span>
                <button
                  onClick={() => onAdd(item)}
                  aria-label={`Ajouter un ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white active:opacity-80"
                  style={{ backgroundColor: brandColor }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Sous-total */}
              <span className="w-24 text-right text-sm font-semibold text-gray-900 shrink-0">
                {formatFCFA(item.price * item.qty)}
              </span>

              {/* Supprimer */}
              <button
                onClick={() => onDelete(item.id)}
                aria-label={`Supprimer ${item.name} du panier`}
                className="shrink-0 p-1 text-gray-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pt-3 pb-6 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {formatFCFA(total)}
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              onCheckout();
            }}
            className="w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-opacity active:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            Commander — {formatFCFA(total)}
          </button>
        </div>
      </div>
    </>
  );
}
