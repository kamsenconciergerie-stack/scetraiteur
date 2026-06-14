'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Product, Tenant } from '@/lib/types';

import StepIndicator from '@/components/commander/StepIndicator';
import ProductCard from '@/components/commander/ProductCard';
import CartDrawer, { type CartItem } from '@/components/commander/CartDrawer';
import CustomerForm, { type CustomerFormData } from '@/components/commander/CustomerForm';
import OrderSummary from '@/components/commander/OrderSummary';
import SuccessScreen from '@/components/commander/SuccessScreen';

/* ------------------------------------------------------------------ */
/*  Utilitaires                                                          */
/* ------------------------------------------------------------------ */

type Step = 'menu' | 'info' | 'confirm' | 'done';

function formatFCFA(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

/* ------------------------------------------------------------------ */
/*  Skeleton de chargement                                              */
/* ------------------------------------------------------------------ */

function ProductSkeleton() {
  return (
    <div className="animate-pulse flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded-full shrink-0 mt-1" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page principale                                                      */
/* ------------------------------------------------------------------ */

export default function CommanderPage({
  params,
}: {
  params: { tenant: string };
}) {
  const searchParams = useSearchParams();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<Step>('menu');
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [form, setForm] = useState<CustomerFormData>({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    delivery_date: '',
    notes: '',
  });

  /* ---- Chargement tenant + produits ---- */
  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: t } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', params.tenant)
        .eq('is_active', true)
        .single();

      if (!t) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setTenant(t);

      const { data: p } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', t.id)
        .eq('is_available', true)
        .order('name');

      setProducts(p ?? []);
      setLoading(false);
    }

    load();
  }, [params.tenant]);

  /* ---- Pré-remplissage téléphone depuis URL ---- */
  const prefillPhone = searchParams.get('phone') ?? undefined;

  /* ---- Gestion du panier ---- */
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (!existing) return prev;
      if (existing.qty === 1) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
    });
  }, []);

  const deleteFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const qtyInCart = (id: string) =>
    cart.find((i) => i.id === id)?.qty ?? 0;

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  /* ---- Soumission de commande ---- */
  async function submitOrder() {
    if (!tenant) return;
    setSubmitting(true);

    /* Double vérification stock */
    const stockIssues = cart.filter((item) => {
      const prod = products.find((p) => p.id === item.id);
      return prod && prod.stock_quantity < item.qty;
    });

    if (stockIssues.length > 0) {
      alert(
        `Stock insuffisant pour : ${stockIssues.map((i) => i.name).join(', ')}`
      );
      setSubmitting(false);
      return;
    }

    const newOrderNumber = `ORD-WEB-${Date.now()}`;

    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          tenant_id: tenant.id,
          order_number: newOrderNumber,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          customer_address: form.customer_address,
          delivery_date: form.delivery_date || null,
          channel: 'web' as const,
          status: 'confirmed' as const,
          total,
          notes: form.notes || null,
        },
      ])
      .select()
      .single();

    if (error || !order) {
      alert('Erreur lors de la commande. Veuillez reessayer.');
      setSubmitting(false);
      return;
    }

    /* Lignes de commande */
    await supabase.from('order_items').insert(
      cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.qty,
        subtotal: item.price * item.qty,
      }))
    );

    /* Décrémenter le stock */
    for (const item of cart) {
      const prod = products.find((p) => p.id === item.id);
      if (prod) {
        await supabase
          .from('products')
          .update({ stock_quantity: prod.stock_quantity - item.qty })
          .eq('id', item.id);
      }
    }

    /* Webhook n8n (silencieux si URL non configurée) */
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'new_order_web',
            order_number: newOrderNumber,
            tenant_slug: tenant.slug,
            customer_name: form.customer_name,
            customer_phone: form.customer_phone,
            customer_address: form.customer_address,
            delivery_date: form.delivery_date || null,
            notes: form.notes || null,
            items: cart.map((item) => ({
              name: item.name,
              qty: item.qty,
              price: item.price,
              subtotal: item.price * item.qty,
            })),
            total,
            currency: 'FCFA',
          }),
        });
      } catch {
        /* Erreur webhook non bloquante */
      }
    }

    setOrderNumber(newOrderNumber);
    setSubmitting(false);
    setStep('done');
  }

  /* ---- Réinitialisation ---- */
  function resetOrder() {
    setCart([]);
    setStep('menu');
    setOrderNumber('');
    setForm({
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      delivery_date: '',
      notes: '',
    });
  }

  /* ================================================================ */
  /*  Rendu                                                            */
  /* ================================================================ */

  const brandColor = tenant?.primary_color || '#1a56db';

  /* 404 */
  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4" aria-hidden="true">
          🍽️
        </p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Page introuvable
        </h1>
        <p className="text-sm text-gray-500">
          Ce traiteur n&apos;existe pas ou n&apos;est pas encore actif.
        </p>
      </div>
    );
  }

  /* Chargement */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-gray-200 animate-pulse" />
        <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ '--brand': brandColor } as React.CSSProperties}>
      {/* ---- Header ---- */}
      <header
        className="sticky top-0 z-30 shadow-sm"
        style={{ backgroundColor: brandColor }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          {tenant?.logo_url ? (
            <Image
              src={tenant.logo_url}
              alt={`Logo ${tenant?.name}`}
              width={36}
              height={36}
              className="rounded-full object-cover bg-white/20 shrink-0"
            />
          ) : null}
          <h1 className="text-base font-bold text-white truncate">
            {tenant?.name}
          </h1>
        </div>

        {/* Indicateur d'étapes (hors écran succès) */}
        {step !== 'done' && (
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-lg mx-auto">
              <StepIndicator currentStep={step} brandColor={brandColor} />
            </div>
          </div>
        )}
      </header>

      {/* ---- Contenu principal ---- */}
      <main className="max-w-lg mx-auto px-4 pt-5 pb-32">

        {/* ===== ÉTAPE : MENU ===== */}
        {step === 'menu' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Notre menu</h2>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
                <p className="text-3xl mb-2" aria-hidden="true">🍽️</p>
                <p className="text-sm text-gray-500">
                  Aucun produit disponible pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    qty={qtyInCart(product.id)}
                    brandColor={brandColor}
                    onAdd={() => addToCart(product)}
                    onRemove={() => removeFromCart(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ÉTAPE : INFOS CLIENT ===== */}
        {step === 'info' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vos informations</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Nous en avons besoin pour traiter votre commande.
              </p>
            </div>

            {/* Récap panier compact */}
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {cart.length} article{cart.length > 1 ? 's' : ''}
                </span>
                <span className="text-sm font-bold" style={{ color: brandColor }}>
                  {formatFCFA(total)}
                </span>
              </div>
            </div>

            <CustomerForm
              data={form}
              onChange={setForm}
              onSubmit={() => setStep('confirm')}
              onBack={() => setStep('menu')}
              brandColor={brandColor}
              prefillPhone={prefillPhone}
            />
          </div>
        )}

        {/* ===== ÉTAPE : CONFIRMATION ===== */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recapitulatif</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Verifiez votre commande avant de confirmer.
              </p>
            </div>

            <OrderSummary
              items={cart}
              formData={form}
              brandColor={brandColor}
              submitting={submitting}
              onEdit={() => setStep('menu')}
              onEditInfo={() => setStep('info')}
              onConfirm={submitOrder}
            />
          </div>
        )}

        {/* ===== ÉTAPE : SUCCÈS ===== */}
        {step === 'done' && (
          <SuccessScreen
            orderNumber={orderNumber}
            formData={form}
            items={cart}
            total={total}
            brandColor={brandColor}
            whatsappNumber={tenant?.whatsapp_number}
            onNewOrder={resetOrder}
          />
        )}
      </main>

      {/* ---- Cart Drawer (uniquement sur l'étape menu) ---- */}
      {step === 'menu' && (
        <CartDrawer
          items={cart}
          brandColor={brandColor}
          open={cartOpen}
          onOpen={() => setCartOpen(true)}
          onClose={() => setCartOpen(false)}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onDelete={deleteFromCart}
          onCheckout={() => setStep('info')}
        />
      )}
    </div>
  );
}
