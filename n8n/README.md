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
