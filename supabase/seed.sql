-- ============================================================
--  OrderFlow — Données de test (tenant pilote)
--  Exécuter APRÈS 001_initial_schema.sql
-- ============================================================

-- Tenant pilote
INSERT INTO tenants (slug, name, primary_color, whatsapp_number, phone_number_id, whatsapp_token, verify_token)
VALUES (
  'dupont-traiteur',
  'Dupont Traiteur',
  '#e85d04',
  '+33612345678',
  'VOTRE_PHONE_NUMBER_ID_META',
  'VOTRE_ACCESS_TOKEN_META',
  'mon-verify-token-secret'
) RETURNING id;

-- Remplacer 'TENANT_ID' par l'UUID retourné ci-dessus
-- puis exécuter le reste du script.

-- Catégories
INSERT INTO categories (tenant_id, name, position)
SELECT id, 'Entrées', 1 FROM tenants WHERE slug = 'dupont-traiteur';

INSERT INTO categories (tenant_id, name, position)
SELECT id, 'Plats chauds', 2 FROM tenants WHERE slug = 'dupont-traiteur';

INSERT INTO categories (tenant_id, name, position)
SELECT id, 'Desserts', 3 FROM tenants WHERE slug = 'dupont-traiteur';

-- Produits
INSERT INTO products (tenant_id, category_id, name, description, price, stock_quantity, stock_alert_threshold)
SELECT
  t.id,
  c.id,
  'Salade César',
  'Laitue romaine, croûtons, parmesan, sauce César maison',
  8.50,
  20,
  5
FROM tenants t
JOIN categories c ON c.tenant_id = t.id AND c.name = 'Entrées'
WHERE t.slug = 'dupont-traiteur';

INSERT INTO products (tenant_id, category_id, name, description, price, stock_quantity, stock_alert_threshold)
SELECT
  t.id,
  c.id,
  'Velouté de potiron',
  'Crème de potiron, crème fraîche, graines de courge',
  7.00,
  15,
  3
FROM tenants t
JOIN categories c ON c.tenant_id = t.id AND c.name = 'Entrées'
WHERE t.slug = 'dupont-traiteur';

INSERT INTO products (tenant_id, category_id, name, description, price, stock_quantity, stock_alert_threshold)
SELECT
  t.id,
  c.id,
  'Poulet rôti & pommes de terre',
  'Poulet fermier rôti, pommes de terre sautées, jus de volaille',
  15.00,
  12,
  3
FROM tenants t
JOIN categories c ON c.tenant_id = t.id AND c.name = 'Plats chauds'
WHERE t.slug = 'dupont-traiteur';

INSERT INTO products (tenant_id, category_id, name, description, price, stock_quantity, stock_alert_threshold)
SELECT
  t.id,
  c.id,
  'Tajine d''agneau',
  'Agneau mijoté, pois chiches, pruneaux, épices',
  18.00,
  10,
  2
FROM tenants t
JOIN categories c ON c.tenant_id = t.id AND c.name = 'Plats chauds'
WHERE t.slug = 'dupont-traiteur';

INSERT INTO products (tenant_id, category_id, name, description, price, stock_quantity, stock_alert_threshold)
SELECT
  t.id,
  c.id,
  'Fondant au chocolat',
  'Coulant chocolat noir 70%, crème anglaise',
  6.00,
  25,
  5
FROM tenants t
JOIN categories c ON c.tenant_id = t.id AND c.name = 'Desserts'
WHERE t.slug = 'dupont-traiteur';

-- Livreur
INSERT INTO livreurs (tenant_id, name, phone)
SELECT id, 'Moussa Diallo', '+33698765432'
FROM tenants WHERE slug = 'dupont-traiteur';

-- Vérification
SELECT 'Tenants'   AS table_name, COUNT(*) FROM tenants    UNION ALL
SELECT 'Catégories',              COUNT(*) FROM categories  UNION ALL
SELECT 'Produits',                COUNT(*) FROM products    UNION ALL
SELECT 'Livreurs',                COUNT(*) FROM livreurs;
