'use client';

import { MessageCircle, RefreshCw } from 'lucide-react';
import type { CustomerFormData } from './CustomerForm';
import type { CartItem } from './CartDrawer';

interface SuccessScreenProps {
  orderNumber: string;
  formData: CustomerFormData;
  items: CartItem[];
  total: number;
  brandColor: string;
  whatsappNumber?: string | null;
  onNewOrder: () => void;
}

function formatFCFA(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function buildWhatsAppUrl(
  number: string,
  orderNumber: string,
  customerName: string,
  total: number
): string {
  const clean = number.replace(/\D/g, '');
  const phone = clean.startsWith('221') ? clean : `221${clean}`;
  const text = encodeURIComponent(
    `Bonjour ! Je viens de passer la commande ${orderNumber} pour un total de ${formatFCFA(total)}. Pouvez-vous me donner un suivi ? Merci, ${customerName}.`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export default function SuccessScreen({
  orderNumber,
  formData,
  items,
  total,
  brandColor,
  whatsappNumber,
  onNewOrder,
}: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-10 space-y-6">
      {/* Checkmark animé */}
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: `${brandColor}18` }}
        aria-hidden="true"
      >
        {/* Cercle animé */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 80 80"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke={brandColor}
            strokeWidth="3"
            strokeDasharray="226"
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{
              animation: 'dash 0.6s ease-out forwards',
            }}
          />
        </svg>
        {/* Checkmark */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-9 w-9"
          style={{ color: brandColor }}
          aria-hidden="true"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 30,
              strokeDashoffset: 0,
              animation: 'checkmark 0.4s 0.3s ease-out both',
            }}
          />
        </svg>
      </div>

      {/* Styles d'animation inline */}
      <style>{`
        @keyframes dash {
          from { stroke-dashoffset: 226; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes checkmark {
          from { stroke-dashoffset: 30; }
          to   { stroke-dashoffset: 0;  }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fade-up { animation: fadeUp 0.4s 0.5s ease-out both; }
      `}</style>

      {/* Titre & numéro de commande */}
      <div className="animate-fade-up space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Commande enregistree
        </p>
        <h1 className="text-xl font-bold text-gray-900">
          {orderNumber}
        </h1>
        <p className="text-sm text-gray-500">
          Merci{' '}
          <span className="font-semibold text-gray-800">
            {formData.customer_name}
          </span>{' '}
          ! Votre commande a ete prise en compte.
        </p>
      </div>

      {/* Résumé commande */}
      <div className="animate-fade-up w-full max-w-xs rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          Recapitulatif
        </p>
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {item.name} x{item.qty}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatFCFA(item.price * item.qty)}
            </span>
          </div>
        ))}
        <div
          className="flex items-center justify-between pt-2 border-t border-gray-100"
        >
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-sm font-bold" style={{ color: brandColor }}>
            {formatFCFA(total)}
          </span>
        </div>
        <p className="text-xs text-gray-400 pt-1">
          Contact : {formData.customer_phone}
        </p>
      </div>

      {/* Boutons */}
      <div className="animate-fade-up w-full max-w-xs space-y-3">
        {whatsappNumber && (
          <a
            href={buildWhatsAppUrl(
              whatsappNumber,
              orderNumber,
              formData.customer_name,
              total
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-opacity active:opacity-90"
            style={{ backgroundColor: '#25D366' }}
            aria-label="Suivre ma commande sur WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
            Suivre ma commande sur WhatsApp
          </a>
        )}

        <button
          onClick={onNewOrder}
          className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-semibold border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
          aria-label="Passer une nouvelle commande"
        >
          <RefreshCw className="h-4 w-4" />
          Nouvelle commande
        </button>
      </div>
    </div>
  );
}
