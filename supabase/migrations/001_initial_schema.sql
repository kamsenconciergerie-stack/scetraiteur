-- ============================================================
--  OrderFlow SaaS — Schéma initial multi-tenant
--  Coller dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TENANTS (un traiteur = un tenant)
-- ============================================================
CREATE TABLE tenants (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT        UNIQUE NOT NULL,          -- ex: "dupont-traiteur"
  name              TEXT        NOT NULL,                 -- ex: "Dupont Traiteur"
  logo_url          TEXT,
  primary_color     TEXT        DEFAULT '#1a56db',
  whatsapp_number   TEXT,                                 -- ex: "+33612345678"
  phone_number_id   TEXT,                                 -- Meta API: Phone Number ID
  whatsapp_token    TEXT,                                 -- Meta API: Access Token (à chiffrer en prod)
  verify_token      TEXT        DEFAULT gen_random_uuid()::TEXT, -- pour webhook Meta
  is_active         BOOLEAN     DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LIVREURS
-- ============================================================
CREATE TABLE livreurs (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  phone       TEXT    NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATALOGUE — Catégories
-- ============================================================
CREATE TABLE categories (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATALOGUE — Produits
-- ============================================================
CREATE TABLE products (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id           UUID           REFERENCES categories(id) ON DELETE SET NULL,
  name                  TEXT           NOT NULL,
  description           TEXT,
  price                 DECIMAL(10,2)  NOT NULL,
  stock_quantity        INTEGER        DEFAULT 0,
  stock_alert_threshold INTEGER        DEFAULT 5,
  is_available          BOOLEAN        DEFAULT TRUE,
  created_at            TIMESTAMPTZ    DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    DEFAULT NOW()
);

-- ============================================================
-- COMMANDES
-- ============================================================
CREATE TABLE orders (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number      TEXT          NOT NULL,  -- ex: "ORD-2024-001"

  -- Client
  customer_name     TEXT          NOT NULL,
  customer_phone    TEXT          NOT NULL,
  customer_address  TEXT,

  -- Logistique
  delivery_date     TIMESTAMPTZ,
  livreur_id        UUID          REFERENCES livreurs(id) ON DELETE SET NULL,

  -- Canal
  channel           TEXT          NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'web')),

  -- Statut
  status            TEXT          NOT NULL DEFAULT 'received'
    CHECK (status IN (
      'received',           -- Reçue (auto)
      'confirmed',          -- Confirmée (auto si stock OK)
      'stock_issue',        -- Problème stock (gérant intervient)
      'preparing',          -- En préparation
      'out_for_delivery',   -- En livraison
      'delivered',          -- Livrée
      'cancelled'           -- Annulée
    )),

  -- Montants
  subtotal          DECIMAL(10,2),
  total             DECIMAL(10,2),

  notes             TEXT,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- Séquence pour les numéros de commande par tenant
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- ============================================================
-- LIGNES DE COMMANDE
-- ============================================================
CREATE TABLE order_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID          REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT          NOT NULL,   -- snapshot au moment de la commande
  product_price   DECIMAL(10,2) NOT NULL,
  quantity        INTEGER       NOT NULL CHECK (quantity > 0),
  subtotal        DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- HISTORIQUE DES STATUTS (audit trail)
-- ============================================================
CREATE TABLE order_status_history (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status  TEXT,
  new_status  TEXT    NOT NULL,
  changed_by  TEXT    DEFAULT 'system',  -- 'system', 'gerant', 'livreur'
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSIONS WHATSAPP (état du bot par utilisateur)
-- ============================================================
CREATE TABLE whatsapp_sessions (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone       TEXT    NOT NULL,
  state       TEXT    NOT NULL DEFAULT 'INITIAL',
  context     JSONB   DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, phone)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_orders_tenant_id        ON orders(tenant_id);
CREATE INDEX idx_orders_status           ON orders(status);
CREATE INDEX idx_orders_created_at       ON orders(created_at DESC);
CREATE INDEX idx_products_tenant_id      ON products(tenant_id);
CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(tenant_id, phone);
CREATE INDEX idx_tenants_phone_id        ON tenants(phone_number_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenants                ENABLE ROW LEVEL SECURITY;
ALTER TABLE livreurs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions      ENABLE ROW LEVEL SECURITY;

-- Le service_role (utilisé par n8n) bypass le RLS automatiquement.
-- Les gérants s'authentifient via Supabase Auth avec un JWT contenant tenant_id.

-- Politique : chaque gérant ne voit que les données de son tenant
CREATE POLICY "tenant_isolation_orders" ON orders
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "tenant_isolation_products" ON products
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "tenant_isolation_livreurs" ON livreurs
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "tenant_isolation_categories" ON categories
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "tenant_isolation_order_items" ON order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM orders
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    )
  );

-- ============================================================
-- TRIGGER — updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER — historique des statuts automatique
-- ============================================================
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, 'system');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_history
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- ============================================================
-- FONCTION — Générer un numéro de commande unique par tenant
-- ============================================================
CREATE OR REPLACE FUNCTION generate_order_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_year  TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM orders
  WHERE tenant_id = p_tenant_id
    AND TO_CHAR(created_at, 'YYYY') = v_year;
  RETURN 'ORD-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
