import { notFound } from 'next/navigation';
import { getAdminSupabase } from '@/lib/auth';
import { TenantDetail } from './TenantDetail';

interface TenantFull {
  id:               string;
  slug:             string;
  name:             string;
  primary_color:    string;
  whatsapp_number:  string | null;
  phone_number_id:  string | null;
  whatsapp_token:   string | null;
  verify_token:     string | null;
  is_active:        boolean;
  created_at:       string;
}

interface GerantRow {
  id:         string;
  user_id:    string;
  email:      string;
  created_at: string;
}

export default async function TenantPage({ params }: { params: { id: string } }) {
  const admin = getAdminSupabase();

  const [tenantRes, gerantsRes, statsRes] = await Promise.all([
    admin.from('tenants').select('*').eq('id', params.id).single(),
    admin.from('user_profiles').select('id, user_id, email, created_at')
      .eq('tenant_id', params.id).eq('role', 'gerant').order('created_at'),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('tenant_id', params.id),
  ]);

  if (!tenantRes.data) notFound();

  return (
    <TenantDetail
      tenant={tenantRes.data as TenantFull}
      gerants={(gerantsRes.data ?? []) as GerantRow[]}
      ordersCount={statsRes.count ?? 0}
    />
  );
}
