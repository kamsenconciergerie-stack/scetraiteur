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
