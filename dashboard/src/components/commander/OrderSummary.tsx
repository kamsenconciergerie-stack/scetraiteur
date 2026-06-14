'use client';

import { Pencil } from 'lucide-react';
import type { CustomerFormData } from './CustomerForm';
import type { CartItem } from './CartDrawer';

interface OrderSummaryProps {
  items: CartItem[];
  formData: CustomerFormData;
  brandColor: string;
  submitting: boolean;
  onEdit: () => void;
  onEditInfo: () => void;
  onConfirm: () => void;
}

function formatFCFA(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function OrderSummary({
  items,
  formData,
  brandColor,
  submitting,
  onEdit,
  onEditInfo,
  onConfirm,
}: OrderSummaryProps) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="space-y-4">
      {/* Section : Vos articles */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Vos articles</h3>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs font-medium transition-opacity active:opacity-70"
            style={{ color: brandColor }}
            aria-label="Modifier les articles du panier"
          >
            <Pencil className="h-3 w-3" />
            Modifier
          </button>
        </div>

        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {item.name}
                <span className="ml-1 text-gray-400">x{item.qty}</span>
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatFCFA(item.price * item.qty)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold" style={{ color: brandColor }}>
            {formatFCFA(total)}
          </span>
        </div>
      </div>

      {/* Section : Vos infos */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Vos informations</h3>
          <button
            onClick={onEditInfo}
            className="flex items-center gap-1 text-xs font-medium transition-opacity active:opacity-70"
            style={{ color: brandColor }}
            aria-label="Modifier mes informations"
          >
            <Pencil className="h-3 w-3" />
            Modifier
          </button>
        </div>

        <dl className="space-y-2">
          <div className="flex gap-2">
            <dt className="text-xs text-gray-400 w-20 shrink-0">Nom</dt>
            <dd className="text-xs font-medium text-gray-900">
              {formData.customer_name}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-xs text-gray-400 w-20 shrink-0">Telephone</dt>
            <dd className="text-xs font-medium text-gray-900">
              {formData.customer_phone}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-xs text-gray-400 w-20 shrink-0">Adresse</dt>
            <dd className="text-xs font-medium text-gray-900">
              {formData.customer_address}
            </dd>
          </div>
          {formData.delivery_date && (
            <div className="flex gap-2">
              <dt className="text-xs text-gray-400 w-20 shrink-0">Livraison</dt>
              <dd className="text-xs font-medium text-gray-900">
                {formatDate(formData.delivery_date)}
              </dd>
            </div>
          )}
          {formData.notes && (
            <div className="flex gap-2">
              <dt className="text-xs text-gray-400 w-20 shrink-0">Notes</dt>
              <dd className="text-xs font-medium text-gray-900">
                {formData.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Bouton de confirmation */}
      <button
        onClick={onConfirm}
        disabled={submitting || items.length === 0}
        className="w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-opacity active:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: brandColor }}
        aria-busy={submitting}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
            Envoi en cours...
          </span>
        ) : (
          `Confirmer ma commande — ${formatFCFA(total)}`
        )}
      </button>
    </div>
  );
}
