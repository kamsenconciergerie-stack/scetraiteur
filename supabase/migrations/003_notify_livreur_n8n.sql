-- ============================================================
--  OrderFlow SaaS — Notification n8n à l'assignation livreur
--  Migration 003
--
--  Architecture :
--    BEFORE INSERT → assign_livreur_disponible()  (migration 002)
--    AFTER INSERT  → notify_n8n_livreur_assigned() (cette migration)
--
--  pg_net est inclus par défaut sur Supabase. L'appel HTTP est
--  asynchrone (non-bloquant) : il ne ralentit pas l'INSERT.
-- ============================================================

-- ============================================================
-- FONCTION — Appeler le webhook n8n après assignation livreur
-- ============================================================
CREATE OR REPLACE FUNCTION notify_n8n_livreur_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_livreur  RECORD;
  v_tenant   RECORD;
  v_payload  JSONB;
  v_n8n_url  TEXT;
BEGIN
  -- URL du webhook n8n lue depuis la config PostgreSQL.
  -- Pour la définir, exécuter une seule fois dans Supabase SQL Editor :
  --   ALTER DATABASE postgres
  --     SET app.n8n_webhook_livreur TO 'https://n8n.exemple.com/webhook/livreur-assigned';
  --   SELECT pg_reload_conf();
  v_n8n_url := current_setting('app.n8n_webhook_livreur', true);

  IF v_n8n_url IS NULL OR v_n8n_url = '' THEN
    RETURN NEW;
  END IF;

  -- Données du livreur
  SELECT name, phone INTO v_livreur
  FROM livreurs WHERE id = NEW.livreur_id;

  -- Config WhatsApp du tenant (phone_number_id + token Meta)
  SELECT name, phone_number_id, whatsapp_token INTO v_tenant
  FROM tenants WHERE id = NEW.tenant_id;

  -- Payload complet envoyé à n8n
  v_payload := jsonb_build_object(
    'order_id',         NEW.id,
    'order_number',     NEW.order_number,
    'customer_name',    NEW.customer_name,
    'customer_phone',   NEW.customer_phone,
    'customer_address', NEW.customer_address,
    'total',            NEW.total,
    'notes',            NEW.notes,
    'livreur_id',       NEW.livreur_id,
    'livreur_name',     v_livreur.name,
    'livreur_phone',    v_livreur.phone,
    'tenant_name',      v_tenant.name,
    'phone_number_id',  v_tenant.phone_number_id,
    'whatsapp_token',   v_tenant.whatsapp_token
  );

  -- Appel HTTP asynchrone vers n8n (non bloquant pour l'INSERT)
  PERFORM net.http_post(
    url     := v_n8n_url,
    body    := v_payload,
    headers := '{"Content-Type": "application/json"}'::JSONB
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER — AFTER INSERT, uniquement si un livreur a été assigné
-- Le BEFORE INSERT (migration 002) a déjà fixé livreur_id.
-- Ce trigger voit donc la valeur finale.
-- ============================================================
CREATE TRIGGER trg_notify_livreur_assigned
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.livreur_id IS NOT NULL)
  EXECUTE FUNCTION notify_n8n_livreur_assigned();
