import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Package, Truck, LayoutDashboard } from 'lucide-react';

async function getTenant(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  return data;
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params:   { tenant: string };
}) {
  const tenant = await getTenant(params.tenant);
  if (!tenant) notFound();

  const navItems = [
    { href: `/${params.tenant}/orders`,   label: 'Commandes', icon: ShoppingBag },
    { href: `/${params.tenant}/stock`,    label: 'Stock',     icon: Package },
    { href: `/${params.tenant}/livreurs`, label: 'Livreurs',  icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {tenant.logo_url && (
              <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto" />
            )}
            <span className="font-bold text-gray-900 text-lg">{tenant.name}</span>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="ml-4 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LayoutDashboard className="h-3 w-3" />
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
