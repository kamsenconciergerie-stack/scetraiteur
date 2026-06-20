-- ============================================================
--  OrderFlow SaaS — Authentification des gérants
--  Migration 004
--
--  Après avoir exécuté cette migration, activer le hook dans
--  Supabase Dashboard :
--  Authentication > Hooks > Custom Access Token Hook
--  → sélectionner public.custom_access_token_hook
-- ============================================================

-- ============================================================
-- TABLE user_profiles
-- Lie chaque compte Supabase Auth à un tenant et un rôle.
-- tenant_id = NULL pour les admin SaaS.
-- ============================================================
CREATE TABLE user_profiles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID        REFERENCES tenants(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'gerant'
                          CHECK (role IN ('gerant', 'admin_saas')),
  email       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les lookups fréquents
CREATE INDEX idx_user_profiles_user_id   ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Un gérant peut lire uniquement son propre profil
CREATE POLICY "own_profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

-- Seul le service_role (admin) peut insérer / modifier / supprimer
CREATE POLICY "service_role_full_access" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- HOOK — Ajouter tenant_id, tenant_slug et user_role dans le JWT
--
-- Ce hook est appelé par Supabase Auth à chaque génération de token.
-- Les claims ajoutés sont accessibles côté client via le JWT décodé
-- et côté base via auth.jwt() ->> 'tenant_id'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claims     JSONB;
  v_tenant_id  UUID;
  v_tenant_slug TEXT;
  v_role       TEXT;
BEGIN
  -- Récupérer tenant_id, slug et rôle depuis le profil
  SELECT
    p.tenant_id,
    t.slug,
    p.role
  INTO v_tenant_id, v_tenant_slug, v_role
  FROM public.user_profiles p
  LEFT JOIN public.tenants t ON t.id = p.tenant_id
  WHERE p.user_id = (event ->> 'userId')::UUID;

  v_claims := event -> 'claims';

  -- Injecter les claims personnalisés
  IF v_tenant_id IS NOT NULL THEN
    v_claims := jsonb_set(v_claims, '{tenant_id}',   to_jsonb(v_tenant_id::TEXT));
  END IF;

  IF v_tenant_slug IS NOT NULL THEN
    v_claims := jsonb_set(v_claims, '{tenant_slug}', to_jsonb(v_tenant_slug));
  END IF;

  IF v_role IS NOT NULL THEN
    v_claims := jsonb_set(v_claims, '{user_role}',   to_jsonb(v_role));
  END IF;

  RETURN jsonb_set(event, '{claims}', v_claims);
END;
$$;

-- Autoriser Supabase Auth à appeler ce hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
