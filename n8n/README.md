# n8n — Configuration du bot WhatsApp

## Variables d'environnement à définir dans n8n

Aller dans **n8n > Settings > Variables** et créer :

| Variable | Description | Exemple |
|---|---|---|
| `SUPABASE_URL` | URL de ton projet Supabase | `https://xyzxyz.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Clé `service_role` (pas anon) | `eyJhbG...` |
| `ORDERFLOW_VERIFY_TOKEN` | Token de vérification Meta webhook | `mon-verify-token-secret` |

## Import du workflow

1. Aller dans n8n > **Workflows > Import from file**
2. Sélectionner `workflows/whatsapp-order-bot.json`
3. Activer le workflow

## URL du webhook

Après activation, copier l'URL du nœud **WhatsApp Webhook** :
```
https://ton-n8n.domain.com/webhook/whatsapp
```

Cette URL sera configurée dans Meta Business Manager.

## Configuration Meta (WhatsApp Cloud API)

1. Aller sur [developers.facebook.com](https://developers.facebook.com)
2. App > WhatsApp > Configuration
3. **Webhook URL** : coller l'URL n8n ci-dessus
4. **Verify Token** : même valeur que `ORDERFLOW_VERIFY_TOKEN`
5. S'abonner à l'événement : `messages`

## Test rapide

Envoyer "Bonjour" au numéro WhatsApp du tenant.
Le bot doit répondre avec le menu.

---

## Workflow 2 — Notification WhatsApp livreur (`whatsapp-livreur-notification.json`)

Ce workflow est déclenché automatiquement par la base de données (via `pg_net`) chaque fois qu'une commande est assignée à un livreur.

### Import

1. n8n > **Workflows > Import from file**
2. Sélectionner `workflows/whatsapp-livreur-notification.json`
3. Activer le workflow
4. Copier l'URL du nœud **Webhook Livreur Assigné** :
   ```
   https://ton-n8n.domain.com/webhook/livreur-assigned
   ```

### Connecter Supabase au workflow

Exécuter **une seule fois** dans le Supabase SQL Editor :

```sql
ALTER DATABASE postgres
  SET app.n8n_webhook_livreur TO 'https://ton-n8n.domain.com/webhook/livreur-assigned';

SELECT pg_reload_conf();
```

Remplacer l'URL par celle copiée à l'étape précédente.

### Flux complet

```
Commande insérée (web ou WhatsApp)
        ↓
  BEFORE INSERT trigger
  → assign_livreur_disponible()
  → livreur_id fixé dans la ligne
        ↓
  AFTER INSERT trigger
  → notify_n8n_livreur_assigned()
  → pg_net POST → n8n webhook
        ↓
  n8n : formater le téléphone + composer le message
        ↓
  Meta Cloud API → WhatsApp du livreur
```

### Message reçu par le livreur

```
🛵 Nouvelle livraison assignée !

📦 Commande : ORD-2024-0012
👤 Client : Awa Diop
📱 Tél. : +221 77 123 45 67
📍 Adresse : 15 rue Pasteur, Dakar
💰 Total : 8 500 FCFA
📝 Notes : Sonner deux fois

Répondez OK pour confirmer la prise en charge.
```

### Aucune variable n8n supplémentaire requise

Les credentials WhatsApp (phone_number_id, token) sont transmis par Supabase dans le payload — ils viennent directement du tenant concerné.
