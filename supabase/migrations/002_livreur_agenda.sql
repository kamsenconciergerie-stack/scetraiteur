-- ============================================================
--  OrderFlow SaaS — Agenda livreurs & assignation automatique
--  Migration 002
-- ============================================================

-- ============================================================
-- TABLE livreur_agenda (planning hebdomadaire récurrent)
-- jour_semaine suit la convention PostgreSQL DOW :
--   0=Dimanche 1=Lundi 2=Mardi 3=Mercredi 4=Jeudi 5=Vendredi 6=Samedi
-- ============================================================
CREATE TABLE livreur_agenda (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  livreur_id    UUID        NOT NULL REFERENCES livreurs(id) ON DELETE CASCADE,
  jour_semaine  SMALLINT    NOT NULL CHECK (jour_semaine BETWEEN 0 AND 6),
  heure_debut   TIME        NOT NULL,
  heure_fin     TIME        NOT NULL,
  actif         BOOLEAN     DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT agenda_heures_valides CHECK (heure_fin > heure_debut)
);

-- ============================================================
-- TABLE livreur_conges (absences ponctuelles)
-- ============================================================
CREATE TABLE livreur_conges (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  livreur_id    UUID        NOT NULL REFERENCES livreurs(id) ON DELETE CASCADE,
  date_debut    TIMESTAMPTZ NOT NULL,
  date_fin      TIMESTAMPTZ NOT NULL,
  raison        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT conge_dates_valides CHECK (date_fin > date_debut)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_livreur_agenda_livreur  ON livreur_agenda(livreur_id);
CREATE INDEX idx_livreur_agenda_jour     ON livreur_agenda(jour_semaine);
CREATE INDEX idx_livreur_conges_livreur  ON livreur_conges(livreur_id);
CREATE INDEX idx_livreur_conges_dates    ON livreur_conges(date_debut, date_fin);
CREATE INDEX idx_orders_livreur_statut   ON orders(livreur_id, status);
CREATE INDEX idx_orders_livreur_date     ON orders(livreur_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE livreur_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE livreur_conges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_livreur_agenda" ON livreur_agenda
  FOR ALL USING (
    livreur_id IN (
      SELECT id FROM livreurs
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    )
  );

CREATE POLICY "tenant_isolation_livreur_conges" ON livreur_conges
  FOR ALL USING (
    livreur_id IN (
      SELECT id FROM livreurs
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    )
  );

-- ============================================================
-- FONCTION — Assignation automatique du livreur disponible
--
-- Logique :
--  1. Fenêtre de disponibilité = [heure_commande, heure_commande + 30 min]
--  2. Cherche un livreur actif dont l'agenda couvre toute la fenêtre
--  3. Pas de congé en cours sur cette fenêtre
--  4. Pas de commande active (une livraison à la fois par livreur)
--  5. En cas d'égalité → priorité au livreur avec moins de commandes aujourd'hui
--  6. Si aucun dispo → livreur_id reste NULL (assignation manuelle requise)
-- ============================================================
CREATE OR REPLACE FUNCTION assign_livreur_disponible()
RETURNS TRIGGER AS $$
DECLARE
  v_livreur_id   UUID;
  v_heure_cmd    TIMESTAMPTZ;
  v_heure_limite TIMESTAMPTZ;
  v_jour         SMALLINT;
  v_heure_locale TIME;
  v_tz           TEXT := 'Africa/Dakar';
BEGIN
  v_heure_cmd    := COALESCE(NEW.created_at, NOW());
  v_heure_limite := v_heure_cmd + INTERVAL '30 minutes';
  v_jour         := EXTRACT(DOW FROM (v_heure_cmd AT TIME ZONE v_tz))::SMALLINT;
  v_heure_locale := (v_heure_cmd AT TIME ZONE v_tz)::TIME;

  SELECT l.id INTO v_livreur_id
  FROM livreurs l
  JOIN livreur_agenda la ON la.livreur_id = l.id
  WHERE
    l.tenant_id  = NEW.tenant_id
    AND l.is_active = TRUE
    AND la.actif    = TRUE
    AND la.jour_semaine = v_jour
    -- Le créneau agenda couvre toute la fenêtre [cmd, cmd+30min]
    AND la.heure_debut <= v_heure_locale
    AND la.heure_fin   >= (v_heure_limite AT TIME ZONE v_tz)::TIME
    -- Aucun congé sur cette fenêtre
    AND NOT EXISTS (
      SELECT 1 FROM livreur_conges lc
      WHERE lc.livreur_id = l.id
        AND lc.date_debut  <= v_heure_limite
        AND lc.date_fin    >= v_heure_cmd
    )
    -- Aucune commande active en cours (une livraison à la fois)
    AND NOT EXISTS (
      SELECT 1 FROM orders o
      WHERE o.livreur_id = l.id
        AND o.status IN ('received', 'confirmed', 'preparing', 'out_for_delivery')
    )
  ORDER BY (
    -- Équilibrage de charge : moins de commandes dans la journée = priorité
    SELECT COUNT(*) FROM orders o2
    WHERE o2.livreur_id = l.id
      AND DATE(o2.created_at AT TIME ZONE v_tz) = DATE(v_heure_cmd AT TIME ZONE v_tz)
  ) ASC
  LIMIT 1;

  NEW.livreur_id := v_livreur_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER — Se déclenche avant chaque INSERT sur orders
-- N'écrase pas si le livreur est déjà renseigné (assignation manuelle)
-- ============================================================
CREATE TRIGGER trg_assign_livreur_on_order
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.livreur_id IS NULL)
  EXECUTE FUNCTION assign_livreur_disponible();

-- ============================================================
-- VUE — Disponibilité temps réel de tous les livreurs
-- ============================================================
CREATE OR REPLACE VIEW v_livreurs_disponibilite AS
SELECT
  l.id,
  l.tenant_id,
  l.name,
  l.phone,
  l.is_active,
  CASE
    WHEN l.is_active = FALSE THEN 'inactif'
    WHEN EXISTS (
      SELECT 1 FROM livreur_conges lc
      WHERE lc.livreur_id = l.id
        AND NOW() BETWEEN lc.date_debut AND lc.date_fin
    ) THEN 'conge'
    WHEN NOT EXISTS (
      SELECT 1 FROM livreur_agenda la
      WHERE la.livreur_id   = l.id
        AND la.actif        = TRUE
        AND la.jour_semaine = EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Africa/Dakar'))::SMALLINT
        AND la.heure_debut <= (NOW() AT TIME ZONE 'Africa/Dakar')::TIME
        AND la.heure_fin   >= (NOW() AT TIME ZONE 'Africa/Dakar')::TIME
    ) THEN 'hors_plage'
    WHEN EXISTS (
      SELECT 1 FROM orders o
      WHERE o.livreur_id = l.id
        AND o.status IN ('received', 'confirmed', 'preparing', 'out_for_delivery')
    ) THEN 'occupe'
    ELSE 'disponible'
  END AS disponibilite
FROM livreurs l;

-- Autoriser les utilisateurs authentifiés à lire la vue
GRANT SELECT ON v_livreurs_disponibilite TO authenticated;
