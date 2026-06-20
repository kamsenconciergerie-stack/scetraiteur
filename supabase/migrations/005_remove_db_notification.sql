-- ============================================================
--  OrderFlow SaaS — Suppression notification DB livreur
--  Migration 005
--
--  La notification WhatsApp au livreur est désormais gérée
--  uniquement par le workflow n8n (whatsapp-order-bot.json),
--  plus par le trigger pg_net.
-- ============================================================

DROP TRIGGER IF EXISTS trg_notify_livreur_assigned ON orders;
DROP FUNCTION IF EXISTS notify_n8n_livreur_assigned();
