# SCE Traiteur — OrderFlow SaaS

Plateforme SaaS multi-tenant de gestion de commandes pour traiteurs.
Commandes via **WhatsApp** ou **site web**, confirmation automatique, stock, assignation automatique de livreurs, notifications WhatsApp, tableau de bord gérant, authentification multi-rôles.

---

## Architecture

```
Client WhatsApp ──► n8n (bot) ──────────────────────► Supabase (PostgreSQL)
Client Web      ──► Dashboard Next.js ──────────────►      ↑
                                                           │
                    Dashboard Gérant /{slug}/* ────────────┤
                    Interface Admin Owner /admin ───────────┤
                    Page Login /login ──────────────────────┘
                              │
                    BEFORE INSERT trigger → assignation livreur
                    AFTER INSERT trigger  → pg_net → n8n → WhatsApp livreur
```

**Stack :**
| Composant | Technologie |
|---|---|
| Base de données | Supabase (PostgreSQL + RLS) |
| Bot WhatsApp | n8n self-hosted + Meta Cloud API |
| Dashboard | Next.js 14 + Tailwind CSS + TypeScript |
| Auth | Supabase Auth + hook JWT custom |
| Temps réel | Supabase Realtime |

---

## Structure du projet

```
scetraiteur/
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      ← Schéma DB complet
│   │   ├── 002_livreur_agenda.sql      ← Agenda livreurs + assignation auto
│   │   ├── 003_notify_livreur_n8n.sql  ← Notification WhatsApp livreur via pg_net
│   │   └── 004_auth_gerants.sql        ← Auth multi-tenant + hook JWT
│   └── seed.sql
├── n8n/
│   ├── workflows/
│   │   ├── whatsapp-order-bot.json             ← Bot commande client
│   │   └── whatsapp-livreur-notification.json  ← Notification livreur assigné
│   └── README.md
└── dashboard/
    └── src/
        ├── app/
        │   ├── login/                          ← Page de connexion
        │   ├── admin/                          ← Interface owner
        │   │   ├── page.tsx                    ← Dashboard stats + liste traiteurs
        │   │   ├── actions.ts                  ← Server actions CRUD tenant/gérant
        │   │   ├── gerants/page.tsx            ← Gestion comptes utilisateurs
        │   │   └── tenants/
        │   │       ├── new/page.tsx            ← Créer un traiteur
        │   │       └── [id]/
        │   │           ├── page.tsx            ← Page serveur (fetch)
        │   │           └── TenantDetail.tsx    ← Édition + gérants + suppression
        │   ├── [tenant]/
        │   │   ├── layout.tsx                  ← Nav + UserMenu (déconnexion)
        │   │   ├── orders/page.tsx             ← Commandes du gérant
        │   │   ├── stock/page.tsx              ← Gestion stock
        │   │   └── livreurs/page.tsx           ← Agenda + disponibilité livreurs
        │   ├── commander/[tenant]/             ← Formulaire commande client (public)
        │   └── api/webhook/                    ← Endpoint webhook Meta
        ├── components/
        │   ├── OrdersTable.tsx                 ← Table commandes + changement statut
        │   ├── DashboardStats.tsx              ← KPIs du jour
        │   ├── StatusBadge.tsx                 ← Badge statut commande
        │   ├── StockAlerts.tsx                 ← Alertes stock faible
        │   ├── StockTable.tsx                  ← Gestion stock ±1 / +10
        │   ├── AgendaTable.tsx                 ← Planning hebdo + absences livreur
        │   ├── LivreurDispoStatus.tsx          ← Badge dispo temps réel
        │   └── UserMenu.tsx                    ← Bouton déconnexion header
        ├── lib/
        │   ├── supabase.ts                     ← Client Supabase browser
        │   ├── auth.ts                         ← Clients server/admin + parseClaims
        │   └── types.ts                        ← Tous les types TypeScript
        └── middleware.ts                       ← Protection routes + isolation tenant
```

---

## Pages et accès

| URL | Accès | Description |
|---|---|---|
| `/login` | Public | Connexion email + mot de passe |
| `/admin` | admin_saas | Dashboard owner : stats + liste traiteurs |
| `/admin/tenants/new` | admin_saas | Créer un nouveau traiteur |
| `/admin/tenants/[id]` | admin_saas | Configurer, éditer, supprimer un traiteur |
| `/admin/gerants` | admin_saas | Gérer tous les comptes utilisateurs |
| `/[slug]/orders` | gerant | Commandes du traiteur |
| `/[slug]/stock` | gerant | Stock du traiteur |
| `/[slug]/livreurs` | gerant | Agenda et disponibilité des livreurs |
| `/commander/[slug]` | Public | Formulaire commande client web |

---

## Base de données — Migrations

### 001 — Schéma initial
- `tenants` — un traiteur = un tenant (slug, couleurs, config WhatsApp)
- `livreurs` — livreurs par tenant
- `categories` + `products` — catalogue avec stock et seuil d'alerte
- `orders` — commandes (canal web/WhatsApp, statuts progressifs)
- `order_items` — lignes de commande avec snapshot prix
- `order_status_history` — audit trail des statuts
- `whatsapp_sessions` — état du bot par numéro
- RLS multi-tenant, triggers `updated_at`, numérotation `ORD-YYYY-XXXX`

### 002 — Agenda livreurs + assignation automatique
- `livreur_agenda` — planning hebdomadaire par livreur (jour + créneau)
- `livreur_conges` — absences ponctuelles avec dates
- Fonction `assign_livreur_disponible()` + trigger **BEFORE INSERT** :
  attribue automatiquement le livreur disponible dans les 30 min suivant la commande,
  vérifie agenda + congés + aucune commande active, équilibrage par charge journalière
- Vue `v_livreurs_disponibilite` — statut temps réel : `disponible / occupe / hors_plage / conge / inactif`

### 003 — Notification WhatsApp livreur
- Fonction `notify_n8n_livreur_assigned()` + trigger **AFTER INSERT** :
  appel HTTP asynchrone (`pg_net`) vers n8n dès qu'un livreur est assigné
- L'URL n8n est stockée dans la config PostgreSQL :
  ```sql
  ALTER DATABASE postgres
    SET app.n8n_webhook_livreur TO 'https://votre-n8n.com/webhook/livreur-assigned';
  SELECT pg_reload_conf();
  ```

### 004 — Authentification des gérants
- `user_profiles` — lie `auth.users` à un `tenant_id` + rôle (`gerant` / `admin_saas`)
- Fonction `custom_access_token_hook()` — injecte `tenant_id`, `tenant_slug`, `user_role`
  dans le JWT à chaque connexion
- **Activer dans Supabase Dashboard :**
  `Authentication > Hooks > Custom Access Token Hook > public.custom_access_token_hook`

---

## Workflows n8n

### whatsapp-order-bot.json
Bot conversationnel client : menu → sélection → panier → récapitulatif → confirmation → commande créée en base.

### whatsapp-livreur-notification.json
Déclenché par Supabase (`pg_net`) à chaque assignation :
1. Reçoit le payload (commande + livreur + credentials WhatsApp du tenant)
2. Normalise le numéro de téléphone
3. Envoie un message WhatsApp au livreur via Meta Cloud API

**Message reçu par le livreur :**
```
🛵 Nouvelle livraison assignée !

📦 Commande : ORD-2024-0012
👤 Client : Awa Diop
📱 Tél. : +221 77 123 45 67
📍 Adresse : 15 rue Pasteur, Dakar
💰 Total : 8 500 FCFA

Répondez OK pour confirmer la prise en charge.
```

---

## Authentification — Rôles

| Rôle | Accès | Créé par |
|---|---|---|
| `admin_saas` | Tout `/admin/*` + tous les tenants | Via `/admin/gerants` |
| `gerant` | Son tenant uniquement `/{slug}/*` | Via `/admin/gerants` ou `/admin/tenants/[id]` |

Le middleware Next.js (`middleware.ts`) protège toutes les routes :
- Non connecté → `/login`
- `gerant` qui accède au mauvais slug → redirigé vers son propre dashboard
- `gerant` qui tente `/admin` → `/login`

---

## Installation complète

### 1. Supabase

```
Supabase Dashboard > SQL Editor > New query
```
Exécuter dans l'ordre :
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_livreur_agenda.sql`
3. `supabase/migrations/003_notify_livreur_n8n.sql`
4. `supabase/migrations/004_auth_gerants.sql`

Puis activer le hook JWT :
`Authentication > Hooks > Custom Access Token Hook > public.custom_access_token_hook`

### 2. n8n

1. **Settings > Variables** :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `ORDERFLOW_VERIFY_TOKEN`

2. **Workflows > Import from file** :
   - `whatsapp-order-bot.json` → activer
   - `whatsapp-livreur-notification.json` → activer → copier l'URL webhook

3. Enregistrer l'URL dans Supabase :
   ```sql
   ALTER DATABASE postgres
     SET app.n8n_webhook_livreur TO 'https://votre-n8n.com/webhook/livreur-assigned';
   SELECT pg_reload_conf();
   ```

### 3. Dashboard Next.js

```bash
cd dashboard
cp ../.env.example .env.local
# Remplir :
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
npm install
npm run dev
```

### 4. Premier admin SaaS

Une fois le dashboard lancé, exécuter en SQL :
```sql
-- Créer un compte Supabase Auth manuellement dans Authentication > Users
-- puis lier à user_profiles :
INSERT INTO user_profiles (user_id, tenant_id, role, email)
VALUES ('<user_id_supabase_auth>', NULL, 'admin_saas', 'admin@votreapp.com');
```

Ou utiliser la page `/admin/gerants` une fois connecté en tant qu'admin.

---

## Ajouter un nouveau traiteur (< 10 min)

1. `/admin` → **Nouveau traiteur**
2. Remplir nom, slug, couleur, config WhatsApp Meta
3. Ouvrir `/admin/tenants/[id]` → ajouter un gérant (email + mot de passe)
4. Configurer le webhook Meta avec l'URL n8n + le verify_token affiché
5. Le gérant se connecte sur `/login` → arrive sur `/{slug}/orders`

---

## Flux assignation livreur

```
Commande reçue (web ou WhatsApp)
        ↓
  BEFORE INSERT sur orders
  → assign_livreur_disponible()
  → cherche livreur actif dont l'agenda couvre [now, now+30min]
  → pas de congé, pas de commande active
  → livreur_id fixé (ou NULL si aucun dispo)
        ↓
  AFTER INSERT sur orders (si livreur_id IS NOT NULL)
  → notify_n8n_livreur_assigned()
  → pg_net POST vers n8n
        ↓
  n8n → Meta Cloud API → WhatsApp livreur
```

---

## Roadmap

- [ ] Paiement en ligne (Stripe / Wave)
- [ ] Application mobile livreur (confirmation + statut en temps réel)
- [ ] Analytics & rapports CA par tenant
- [ ] Multi-sites par tenant
- [ ] Export CSV des commandes
- [ ] Assignation manuelle depuis le dashboard (remplacer un livreur)
