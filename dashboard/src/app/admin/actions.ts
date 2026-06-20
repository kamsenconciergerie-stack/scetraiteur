'use server';

import { getAdminSupabase } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createGerantAction(data: {
  email:     string;
  password:  string;
  tenant_id: string;
}) {
  const admin = getAdminSupabase();

  const { data: authUser, error } = await admin.auth.admin.createUser({
    email:          data.email,
    password:       data.password,
    email_confirm:  true,
  });

  if (error) return { error: error.message };

  const { error: profileError } = await admin.from('user_profiles').insert({
    user_id:   authUser.user.id,
    tenant_id: data.tenant_id,
    role:      'gerant',
    email:     data.email,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/admin/gerants');
  return { success: true };
}

export async function createAdminSaasAction(data: {
  email:    string;
  password: string;
}) {
  const admin = getAdminSupabase();

  const { data: authUser, error } = await admin.auth.admin.createUser({
    email:         data.email,
    password:      data.password,
    email_confirm: true,
  });

  if (error) return { error: error.message };

  await admin.from('user_profiles').insert({
    user_id:   authUser.user.id,
    tenant_id: null,
    role:      'admin_saas',
    email:     data.email,
  });

  revalidatePath('/admin/gerants');
  return { success: true };
}

export async function deleteGerantAction(userId: string) {
  const admin = getAdminSupabase();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath('/admin/gerants');
  return { success: true };
}

// ============================================================
// TENANT ACTIONS
// ============================================================

export async function createTenantAction(data: {
  name:             string;
  slug:             string;
  primary_color:    string;
  whatsapp_number:  string;
  phone_number_id:  string;
  whatsapp_token:   string;
}) {
  const admin = getAdminSupabase();
  const { data: tenant, error } = await admin
    .from('tenants')
    .insert({ ...data, is_active: true })
    .select('id')
    .single();
  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { success: true, id: tenant.id };
}

export async function updateTenantAction(id: string, data: {
  name?:            string;
  slug?:            string;
  primary_color?:   string;
  whatsapp_number?: string;
  phone_number_id?: string;
  whatsapp_token?:  string;
  is_active?:       boolean;
}) {
  const admin = getAdminSupabase();
  const { error } = await admin.from('tenants').update(data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  revalidatePath(`/admin/tenants/${id}`);
  return { success: true };
}

export async function deleteTenantAction(id: string) {
  const admin = getAdminSupabase();

  // Supprimer d'abord les comptes Auth des gérants liés à ce tenant
  const { data: profiles } = await admin
    .from('user_profiles')
    .select('user_id')
    .eq('tenant_id', id);

  for (const p of profiles ?? []) {
    await admin.auth.admin.deleteUser(p.user_id);
  }

  // La suppression du tenant cascade toutes les données (orders, products, livreurs…)
  const { error } = await admin.from('tenants').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin');
  return { success: true };
}
