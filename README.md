# SCE Traiteur — OrderFlow SaaS

Plateforme SaaS multi-tenant de gestion de commandes pour traiteurs.  
Commandes via **WhatsApp** ou **site web**, confirmation automatique, vérification de stock, notification livreur, tableau de bord gérant.

---

## Architecture

```
Client WhatsApp ──► n8n (bot paramétré) ──► Supabase (PostgreSQL)
Client Web      ──► Dashboard Next.js   ──►      ↑
                                                  │
                         Dashboard Gérant ────────┘
                         Admin SaaS ──────────────┘
```

**Stack :**
| Composant | Technologie |
|---|---|
| Base de données | Supabase (PostgreSQL + RLS) |
| Bot WhatsApp | n8n self-hosted + Meta Cloud API |
| Dashboard | Next.js 14 + Tailwind CSS |
| Auth | Supabase Auth |
| Temps réel | Supabase Realtime |

---

## Structure du projet

```
scetraiteur/
├── supabase/
│   ├── migrations/001_initial_schema.sql   ← Schéma DB complet
│   └── seed.sql                            ← Données de test
├── n8n/
│   ├── workflows/whatsapp-order-bot.json  ← Workflow importable
│   └── README.md                          ← Config n8n
└── dashboard/                             ← Application Next.js
    └── src/
        ├── app/
        │   ├── admin/                     ← Gestion des tenants (admin SaaS)
        │   ├── [tenant]/orders/           ← Dashboard commandes gérant
        │   ├── [tenant]/stock/            ← Gestion stock gérant
        │   ├── commander/[tenant]/        ← Formulaire commande web client
        │   └── api/webhook/               ← Endpoint webhook Meta (fallback)
        ├── components/
        │   ├── OrdersTable.tsx            ← Table avec changement de statut
        │   ├── DashboardStats.tsx         ← KPIs du jour
        │   ├── StockAlerts.tsx            ← Alertes stock faible
        │   └── StockTable.tsx             ← Gestion stock ±1 / +10
        └── lib/
            ├── supabase.ts
            └── types.ts
```

---

## Démarrage rapide (Phase 0 — 2 semaines)

### Étape 1 — Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor → New query**
3. Coller et exécuter `supabase/migrations/001_initial_schema.sql`
4. Coller et exécuter `supabase/seed.sql` (remplacer les tokens Meta)
5. Récupérer : **Project URL** et **service_role key** (Settings > API)

### Étape 2 — n8n

1. Aller dans n8n → **Settings → Variables**, créer :
   - `SUPABASE_URL` = votre URL Supabase
   - `SUPABASE_SERVICE_KEY` = votre service_role key
   - `ORDERFLOW_VERIFY_TOKEN` = `mon-verify-token-secret`
2. **Workflows → Import from file** → sélectionner `n8n/workflows/whatsapp-order-bot.json`
3. Activer le workflow
4. Copier l'URL du webhook (ex: `https://votre-n8n.com/webhook/whatsapp`)

### Étape 3 — Meta WhatsApp

1. [developers.facebook.com](https://developers.facebook.com) → votre App → WhatsApp → Configuration
2. **Callback URL** : URL webhook n8n (étape 2)
3. **Verify Token** : `mon-verify-token-secret`
4. S'abonner à l'événement `messages`

### Étape 4 — Dashboard (optionnel en Phase 0)

```bash
# Installer Node.js d'abord : https://nodejs.org
cd dashboard
cp ../.env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Dashboard disponible sur `http://localhost:3000`

---

## URLs

| URL | Description |
|---|---|
| `/admin` | Admin SaaS — liste et création de tenants |
| `/admin/tenants/new` | Formulaire de création d'un tenant |
| `/{slug}/orders` | Dashboard commandes du gérant |
| `/{slug}/stock` | Gestion du stock |
| `/commander/{slug}` | Formulaire de commande web (pour les clients) |

---

## Flux de commande WhatsApp

```
Client: "Bonjour"
Bot: [Affiche le menu numéroté]

Client: "1 x2, 3 x1"
Bot: [Récapitulatif panier, demande OK]

Client: "OK"
Bot: "Quel est votre nom ?"

Client: "Marie Dupont"
Bot: "Quelle est votre adresse ?"

Client: "12 rue de la Paix, Paris"
Bot: "Pour quelle date ?"

Client: "Demain 12h"
Bot: [Récapitulatif final, demande OUI/NON]

Client: "OUI"
Bot: ✅ Confirmation + notification livreur automatique
```

---

## Ajouter un nouveau client traiteur

1. Dashboard `/admin` → **Nouveau client**
2. Remplir : nom, slug, numéro WhatsApp, Phone Number ID Meta, Access Token
3. Copier le **Verify Token** généré → le coller dans Meta Business Manager
4. Le tenant est actif immédiatement

**Temps d'onboarding : < 10 minutes**

---

## Roadmap

- [ ] Paiement en ligne (Stripe / Wave)
- [ ] Application mobile livreur
- [ ] Analytics & rapports CA
- [ ] Assignation automatique des livreurs
- [ ] Multi-sites par tenant
- [ ] Export CSV des commandes
