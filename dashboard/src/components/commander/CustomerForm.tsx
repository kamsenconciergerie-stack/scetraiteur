'use client';

import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, MessageSquare } from 'lucide-react';

export interface CustomerFormData {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_date: string;
  notes: string;
}

interface CustomerFormProps {
  data: CustomerFormData;
  onChange: (data: CustomerFormData) => void;
  onSubmit: () => void;
  onBack: () => void;
  brandColor: string;
  prefillPhone?: string;
}

/* Regex numéro sénégalais : +221 XX XXX XXXX ou 7X XXX XXXX */
const SENEGAL_PHONE_REGEX =
  /^(\+221\s?)?(70|75|76|77|78|33)\s?\d{3}\s?\d{4}$/;

const REQUIRED_KEYS: (keyof CustomerFormData)[] = [
  'customer_name',
  'customer_phone',
  'customer_address',
];

export default function CustomerForm({
  data,
  onChange,
  onSubmit,
  onBack,
  brandColor,
  prefillPhone,
}: CustomerFormProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CustomerFormData, boolean>>>({});

  /* Pré-remplir le téléphone depuis ?phone= */
  useEffect(() => {
    if (prefillPhone && !data.customer_phone) {
      onChange({ ...data, customer_phone: prefillPhone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillPhone]);

  function validate(field: keyof CustomerFormData, value: string): string {
    if (REQUIRED_KEYS.includes(field) && !value.trim()) {
      return 'Ce champ est obligatoire.';
    }
    if (field === 'customer_phone' && value.trim()) {
      const cleaned = value.replace(/\s/g, '');
      if (!SENEGAL_PHONE_REGEX.test(cleaned)) {
        return 'Format attendu : +221 7X XXX XXXX ou 7X XXX XXXX';
      }
    }
    return '';
  }

  function handleChange(field: keyof CustomerFormData, value: string) {
    onChange({ ...data, [field]: value });
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
    }
  }

  function handleBlur(field: keyof CustomerFormData) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, data[field]) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    /* Valider tous les champs */
    const allFields: (keyof CustomerFormData)[] = [
      'customer_name',
      'customer_phone',
      'customer_address',
      'delivery_date',
      'notes',
    ];
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};
    const newTouched: Partial<Record<keyof CustomerFormData, boolean>> = {};
    let hasError = false;

    for (const field of allFields) {
      newTouched[field] = true;
      const err = validate(field, data[field]);
      newErrors[field] = err;
      if (err) hasError = true;
    }

    setTouched(newTouched);
    setErrors(newErrors);

    if (!hasError) {
      onSubmit();
    }
  }

  const focusRingStyle = {
    '--tw-ring-color': brandColor,
  } as React.CSSProperties;

  const fields: {
    key: keyof CustomerFormData;
    label: string;
    type: string;
    placeholder: string;
    required: boolean;
    icon: React.ReactNode;
    hint?: string;
  }[] = [
    {
      key: 'customer_name',
      label: 'Prénom et Nom',
      type: 'text',
      placeholder: 'Moussa Diallo',
      required: true,
      icon: <User className="h-4 w-4" />,
    },
    {
      key: 'customer_phone',
      label: 'Téléphone',
      type: 'tel',
      placeholder: '+221 77 123 45 67',
      required: true,
      icon: <Phone className="h-4 w-4" />,
      hint: 'Format sénégalais : +221 7X XXX XXXX',
    },
    {
      key: 'customer_address',
      label: 'Adresse de livraison',
      type: 'text',
      placeholder: 'Rue 10, Médina, Dakar',
      required: true,
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      key: 'delivery_date',
      label: 'Date et heure souhaitées (optionnel)',
      type: 'datetime-local',
      placeholder: '',
      required: false,
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      key: 'notes',
      label: 'Notes (optionnel)',
      type: 'text',
      placeholder: 'Précisions sur la commande, accès, etc.',
      required: false,
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {fields.map((field) => {
          const hasError = touched[field.key] && !!errors[field.key];
          return (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
              >
                <span className="text-gray-400">{field.icon}</span>
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-0.5" aria-hidden="true">
                    *
                  </span>
                )}
              </label>

              {field.key === 'notes' ? (
                <textarea
                  id={field.key}
                  value={data[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field.key)}
                  placeholder={field.placeholder}
                  rows={3}
                  style={focusRingStyle}
                  className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:ring-2 ${
                    hasError
                      ? 'border-red-400 bg-red-50 focus:ring-red-300'
                      : 'border-gray-200 bg-gray-50 focus:border-transparent'
                  }`}
                  aria-describedby={hasError ? `${field.key}-error` : undefined}
                  aria-invalid={hasError}
                />
              ) : (
                <input
                  id={field.key}
                  type={field.type}
                  value={data[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onBlur={() => handleBlur(field.key)}
                  placeholder={field.placeholder}
                  required={field.required}
                  autoComplete={
                    field.key === 'customer_name'
                      ? 'name'
                      : field.key === 'customer_phone'
                      ? 'tel'
                      : field.key === 'customer_address'
                      ? 'street-address'
                      : 'off'
                  }
                  style={focusRingStyle}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:ring-2 ${
                    hasError
                      ? 'border-red-400 bg-red-50 focus:ring-red-300'
                      : 'border-gray-200 bg-gray-50 focus:border-transparent'
                  }`}
                  aria-describedby={hasError ? `${field.key}-error` : undefined}
                  aria-invalid={hasError}
                />
              )}

              {hasError && (
                <p
                  id={`${field.key}-error`}
                  className="mt-1 text-xs text-red-500"
                  role="alert"
                >
                  {errors[field.key]}
                </p>
              )}

              {!hasError && field.hint && (
                <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          className="w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-opacity active:opacity-90"
          style={{ backgroundColor: brandColor }}
        >
          Voir le recapitulatif
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-2xl py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Retour au menu
        </button>
      </div>
    </form>
  );
}
