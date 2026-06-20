-- ============================================================
--  OrderFlow — Créer le premier compte admin SaaS
--
--  ÉTAPE 1 : Créer le compte dans Authentication > Users
--    Supabase Dashboard > Authentication > Users > Invite user
--    Email : votre-email@domaine.com
--    (ou Add user > Create new user)
--    Copiez l'UUID généré (colonne "UID")
--
--  ÉTAPE 2 : Coller l'UUID ci-dessous et exécuter dans SQL Editor
-- ============================================================

INSERT INTO public.user_profiles (user_id, tenant_id, role, email)
VALUES (
  'COLLER-UUID-ICI',   -- ← UUID du compte créé dans Authentication > Users
  NULL,                -- admin_saas n'appartient à aucun tenant
  'admin_saas',
  'votre-email@domaine.com'  -- ← même email que le compte Auth
);

-- Vérification
SELECT * FROM public.user_profiles WHERE role = 'admin_saas';
