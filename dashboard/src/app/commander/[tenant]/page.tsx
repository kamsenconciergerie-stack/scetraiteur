'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Tenant } from '@/lib/types';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle } from 'lucide-react';

interface CartItem extends Product {
  qty: number;
}

export default function CommanderPage({ params }: { params: { tenant: string } }) {
  const [tenant,    setTenant]    = useState<Tenant | null>(null);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [cart,      setCart]      = useState<CartItem[]>([]);
  const [step,      setStep]      = useState<'menu' | 'info' | 'confirm' | 'done'>('menu');
  const [submitting,setSubmitting]= useState(false);
  const [form, setForm] = useState({
    customer_name:    '',
    customer_phone:   '',
    customer_address: '',
    delivery_date:    '',
    notes:            '',
  });

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', params.tenant)
        .eq('is_active', true)
        .single();
      setTenant(t);

      if (t) {
        const { data: p } = await supabase
          .from('products')
          .select('*')
          .eq('tenant_id', t.id)
          .eq('is_available', true)
          .gt('stock_quantity', 0)
          .order('name');
        setProducts(p ?? []);
      }
    }
    load();
  }, [params.tenant]);

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (!existing) return prev;
      if (existing.qty === 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  }

  function deleteFromCart(id: string) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const qtyInCart = (id: string) => cart.find(i => i.id === id)?.qty ?? 0;

  async function submitOrder() {
    if (!tenant) return;
    setSubmitting(true);

    // Vérification stock côté client (double check serveur recommandé)
    const stockIssues = cart.filter(item => {
      const prod = products.find(p => p.id === item.id);
      return prod && prod.stock_quantity < item.qty;
    });

    if (stockIssues.length > 0) {
      alert(`Stock insuffisant pour : ${stockIssues.map(i => i.name).join(', ')}`);
      setSubmitting(false);
      return;
    }

    const orderNumber = `ORD-WEB-${Date.now()}`;

    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        tenant_id:        tenant.id,
        order_number:     orderNumber,
        customer_name:    form.customer_name,
        customer_phone:   form.customer_phone,
        customer_address: form.customer_address,
        delivery_date:    form.delivery_date || null,
        channel:          'web',
        status:           'confirmed',
        total,
        notes:            form.notes || null,
      }])
      .select()
      .single();

    if (error || !order) {
      alert('Erreur lors de la commande. Veuillez réessayer.');
      setSubmitting(false);
      return;
    }

    // Créer les lignes de commande
    await supabase.from('order_items').insert(
      cart.map(item => ({
        order_id:      order.id,
        product_id:    item.id,
        product_name:  item.name,
        product_price: item.price,
        quantity:      item.qty,
        subtotal:      item.price * item.qty,
      }))
    );

    // Décrémenter le stock
    for (const item of cart) {
      const prod = products.find(p => p.id === item.id);
      if (prod) {
        await supabase
          .from('products')
          .update({ stock_quantity: prod.stock_quantity - item.qty })
          .eq('id', item.id);
      }
    }

    setStep('done');
    setSubmitting(false);
  }

  if (!tenant) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Chargement...</p>
    </div>
  );

  const brandColor = tenant.primary_color || '#1a56db';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="text-white px-6 py-4 shadow-sm" style={{ backgroundColor: brandColor }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">{tenant.name}</h1>
          {step === 'menu' && cart.length > 0 && (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-semibold">{total.toFixed(2)} €</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* ÉTAPE : DONE */}
        {step === 'done' && (
          <div className="text-center py-16">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Commande confirmée !</h2>
            <p className="text-gray-600 mb-6">
              Merci {form.customer_name} ! Votre commande a bien été enregistrée.
              Nous vous contacterons au {form.customer_phone} pour confirmer la livraison.
            </p>
            <button
              onClick={() => { setCart([]); setStep('menu'); setForm({ customer_name:'',customer_phone:'',customer_address:'',delivery_date:'',notes:'' }); }}
              className="rounded-lg px-6 py-2.5 text-white font-medium"
              style={{ backgroundColor: brandColor }}
            >
              Nouvelle commande
            </button>
          </div>
        )}

        {/* ÉTAPE : MENU */}
        {step === 'menu' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Notre menu</h2>
            <div className="space-y-3">
              {products.map(product => {
                const qty = qtyInCart(product.id);
                return (
                  <div key={product.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{product.description}</p>
                      )}
                      <p className="text-sm font-semibold mt-1" style={{ color: brandColor }}>
                        {product.price.toFixed(2)} €
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {qty > 0 ? (
                        <>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="rounded-full border p-1.5 hover:bg-gray-100"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center font-bold">{qty}</span>
                          <button
                            onClick={() => addToCart(product)}
                            className="rounded-full p-1.5 text-white"
                            style={{ backgroundColor: brandColor }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="rounded-full px-3 py-1.5 text-sm text-white font-medium"
                          style={{ backgroundColor: brandColor }}
                        >
                          Ajouter
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {cart.length > 0 && (
              <div className="sticky bottom-4">
                <button
                  onClick={() => setStep('info')}
                  className="w-full rounded-xl py-3.5 text-white font-semibold shadow-lg text-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  Voir mon panier ({cart.length} article{cart.length > 1 ? 's' : ''}) — {total.toFixed(2)} €
                </button>
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE : INFO CLIENT */}
        {step === 'info' && (
          <div className="space-y-6">
            <button onClick={() => setStep('menu')} className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour au menu
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Vos informations</h2>

            <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              {[
                { key: 'customer_name',    label: 'Nom complet *',        type: 'text',           placeholder: 'Jean Dupont' },
                { key: 'customer_phone',   label: 'Téléphone *',          type: 'tel',            placeholder: '+33612345678' },
                { key: 'customer_address', label: 'Adresse de livraison *',type: 'text',          placeholder: '12 rue de la Paix, Paris' },
                { key: 'delivery_date',    label: 'Date de livraison souhaitée', type: 'datetime-local', placeholder: '' },
                { key: 'notes',            label: 'Notes (optionnel)',     type: 'text',           placeholder: 'Étage, code porte...' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    required={field.label.includes('*')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (!form.customer_name || !form.customer_phone || !form.customer_address) {
                  alert('Merci de remplir tous les champs obligatoires.');
                  return;
                }
                setStep('confirm');
              }}
              className="w-full rounded-xl py-3 text-white font-semibold"
              style={{ backgroundColor: brandColor }}
            >
              Voir le récapitulatif
            </button>
          </div>
        )}

        {/* ÉTAPE : CONFIRMATION */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <button onClick={() => setStep('info')} className="text-sm text-gray-500 hover:text-gray-700">
              ← Modifier mes infos
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Récapitulatif</h2>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Vos informations</h3>
                <p className="text-sm"><strong>Nom :</strong> {form.customer_name}</p>
                <p className="text-sm"><strong>Tél :</strong> {form.customer_phone}</p>
                <p className="text-sm"><strong>Adresse :</strong> {form.customer_address}</p>
                {form.delivery_date && <p className="text-sm"><strong>Livraison :</strong> {form.delivery_date}</p>}
                {form.notes && <p className="text-sm"><strong>Notes :</strong> {form.notes}</p>}
              </div>

              <hr />

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Votre commande</h3>
                <ul className="space-y-2">
                  {cart.map(item => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.qty}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{(item.price * item.qty).toFixed(2)} €</span>
                        <button onClick={() => deleteFromCart(item.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-gray-300 hover:text-red-500" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-bold text-base mt-3 pt-3 border-t">
                  <span>Total</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <button
              onClick={submitOrder}
              disabled={submitting || cart.length === 0}
              className="w-full rounded-xl py-3 text-white font-semibold disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: brandColor }}
            >
              {submitting ? 'Envoi en cours...' : 'Confirmer ma commande'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
