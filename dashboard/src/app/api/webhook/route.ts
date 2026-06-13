import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — Vérification webhook Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  // Vérifier que le token correspond à un tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('verify_token', token)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

// POST — Messages entrants Meta (fallback si n8n non disponible)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Vérification signature Meta (sécurité)
    const signature = req.headers.get('x-hub-signature-256');
    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 401 });
    }

    // Enregistrer le message brut pour debug/replay
    const entry   = body?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const phoneNumberId = changes?.metadata?.phone_number_id;

    if (!phoneNumberId || !changes?.messages?.length) {
      // Notification de statut (delivered, read) — ignorer
      return NextResponse.json({ status: 'ok' });
    }

    // Log en DB pour audit (optionnel)
    await supabase.from('whatsapp_sessions').upsert(
      [{
        tenant_id: '00000000-0000-0000-0000-000000000000', // placeholder
        phone: changes.messages[0]?.from ?? 'unknown',
        state: 'LOGGED',
        context: { raw: body, ts: new Date().toISOString() },
      }],
      { onConflict: 'tenant_id,phone', ignoreDuplicates: false }
    );

    // En production, le traitement est fait par n8n.
    // Cette route sert de fallback et de point de vérification.
    return NextResponse.json({ status: 'received' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
