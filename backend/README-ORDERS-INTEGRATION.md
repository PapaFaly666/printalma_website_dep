# 📦 Système de Commandes et Paiement PrintAlma - Guide Backend

## 🎯 Vue d'ensemble

Ce dossier contient tous les fichiers nécessaires pour implémenter le système de commandes PrintAlma avec paiement Paydunya et enregistrement des informations client.

---

## 📁 Fichiers de ce dossier

### 📘 Documentation

| Fichier | Description |
|---------|-------------|
| **`GUIDE-ENREGISTREMENT-INFOS-CLIENT.md`** | Guide complet d'implémentation backend (structure de données, endpoints API, intégration Paydunya, sécurité) |
| **`TEST_COMMANDS.md`** | Toutes les commandes de test pour valider l'implémentation (19 tests complets) |
| **`README-ORDERS-INTEGRATION.md`** | Ce fichier - Vue d'ensemble et démarrage rapide |

### 🗄️ Base de données

| Fichier | Description |
|---------|-------------|
| **`schema-orders.sql`** | Schéma SQL complet des tables orders, order_items, notifications, vues et procédures stockées |
| **`migration_add_email_to_orders.sql`** | Migration pour ajouter la colonne email à la table orders (IDEMPOTENTE) |

### 🧪 Tests

| Fichier | Description |
|---------|-------------|
| **`test_order_example.json`** | Exemple de payload JSON pour tester la création de commande |

---

## 🚀 Démarrage Rapide (5 minutes)

### Étape 1 : Exécuter la migration SQL (2 min)

```bash
# Se connecter à la base de données
mysql -u root -p

# Sélectionner votre base de données
USE votre_nom_de_base;

# Exécuter la migration
source /chemin/vers/backend/migration_add_email_to_orders.sql

# Vérifier que tout s'est bien passé
# Vous devriez voir : "✅ Migration terminée avec succès"
```

**Ou en une seule commande :**
```bash
mysql -u root -p votre_nom_de_base < backend/migration_add_email_to_orders.sql
```

### Étape 2 : Configurer les variables d'environnement (1 min)

Créer ou mettre à jour le fichier `.env` du backend :

```bash
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=votre_nom_de_base

# Paydunya (SANDBOX pour les tests)
PAYDUNYA_MASTER_KEY=votre_master_key
PAYDUNYA_PRIVATE_KEY=votre_private_key
PAYDUNYA_PUBLIC_KEY=votre_public_key
PAYDUNYA_TOKEN=votre_token
PAYDUNYA_MODE=sandbox  # 'sandbox' pour tests, 'live' pour production

# URLs de callback
FRONTEND_URL=http://localhost:5174
BACKEND_URL=http://localhost:3004

# JWT (pour l'authentification vendeur)
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=7d
```

### Étape 3 : Tester que tout fonctionne (2 min)

```bash
# Test 1 : Vérifier que la colonne email existe
mysql -u root -p -e "
  SELECT COLUMN_NAME, COLUMN_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = 'votre_nom_de_base'
    AND table_name = 'orders'
    AND column_name = 'email';
"

# Test 2 : Créer une commande de test
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d @backend/test_order_example.json

# Test 3 : Vérifier en base que la commande a été créée
mysql -u root -p -e "
  SELECT orderNumber, shippingName, email, phoneNumber
  FROM orders
  ORDER BY id DESC
  LIMIT 1;
"
```

**✅ Si ces 3 tests passent, votre backend est prêt !**

---

## 📚 Documentation Détaillée

### 🎯 Pour implémenter le backend

**Lire dans cet ordre :**

1. **`GUIDE-ENREGISTREMENT-INFOS-CLIENT.md`** (30 min de lecture)
   - Comprendre la structure de données
   - Voir les exemples de code pour les endpoints
   - Apprendre l'intégration Paydunya
   - Comprendre la sécurité et les bonnes pratiques

2. **`schema-orders.sql`** (10 min de lecture)
   - Comprendre la structure des tables
   - Voir les relations entre orders, order_items, vendor_products
   - Comprendre les vues et procédures stockées

3. **`TEST_COMMANDS.md`** (référence)
   - Utiliser pour tester chaque fonctionnalité au fur et à mesure
   - 19 tests complets couvrant tous les cas d'usage

---

## 🔧 Implémentation Backend

### Ce qui doit être implémenté

#### 1. Service Paydunya (`services/paydunyaService.js`)

```javascript
// Fonction pour initialiser un paiement
async function initiatePaydunyaPayment(orderData) { ... }

// Fonction pour vérifier le statut d'un paiement
async function verifyPaydunyaPayment(token) { ... }
```

**📍 Voir :** `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md` section "Intégration Paydunya"

#### 2. Routes de commande (`routes/orders.js`)

```javascript
// POST /orders/guest - Créer une commande (client non authentifié)
router.post('/orders/guest', validateOrderRequest, async (req, res) => { ... })

// POST /orders - Créer une commande (client authentifié)
router.post('/orders', authenticateUser, validateOrderRequest, async (req, res) => { ... })

// GET /orders/:id - Récupérer une commande
router.get('/orders/:id', async (req, res) => { ... })
```

**📍 Voir :** `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md` section "Mapping des données"

#### 3. Routes vendeur (`routes/vendor.js`)

```javascript
// GET /vendor/orders - Récupérer les commandes d'un vendeur
router.get('/vendor/orders', authenticateVendor, async (req, res) => { ... })

// GET /vendor/orders/:id - Récupérer une commande spécifique
router.get('/vendor/orders/:id', authenticateVendor, async (req, res) => { ... })

// PUT /vendor/orders/:id/status - Mettre à jour le statut d'une commande
router.put('/vendor/orders/:id/status', authenticateVendor, async (req, res) => { ... })
```

**📍 Voir :** `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md` section "API pour les vendeurs"

#### 4. Webhooks Paydunya (`routes/webhooks.js`)

```javascript
// POST /webhooks/paydunya - Recevoir les notifications de paiement
router.post('/webhooks/paydunya', async (req, res) => { ... })
```

**📍 Voir :** `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md` section "Webhook Paydunya"

#### 5. Routes de vérification Paydunya (`routes/paydunya.js`)

```javascript
// GET /paydunya/status/:token - Vérifier le statut d'un paiement
router.get('/paydunya/status/:token', async (req, res) => { ... })
```

**📍 Voir :** `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md` section "Vérification du statut"

#### 6. Middlewares de validation (`middlewares/validation.js`)

```javascript
// Valider les données de commande
function validateOrderRequest(req, res, next) { ... }

// Valider les données de paiement
function validatePaymentData(req, res, next) { ... }
```

**📍 Voir :** `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md` section "Validation des données"

---

## 🧪 Tests

### Exécuter tous les tests

```bash
# Copier le fichier de tests dans un script
chmod +x backend/run_all_tests.sh

# Exécuter tous les tests
./backend/run_all_tests.sh
```

### Tests critiques à valider avant déploiement

| Test | Commande | Résultat attendu |
|------|----------|------------------|
| **Création commande** | `curl -X POST http://localhost:3004/orders/guest -d @test_order_example.json` | `{ "success": true }` |
| **Infos client en base** | `mysql -e "SELECT email, shippingName FROM orders WHERE id=LAST_INSERT_ID();"` | Email et nom présents |
| **API vendeur** | `curl http://localhost:3004/vendor/orders -H "Authorization: Bearer TOKEN"` | Liste des commandes avec infos client |
| **Webhook Paydunya** | Simuler un webhook | Statut mis à jour en base |

**📍 Voir :** `TEST_COMMANDS.md` pour tous les tests détaillés

---

## 📊 Structure de Données

### Tables principales

```
users (clients, vendeurs, admins)
  └── orders (commandes)
       ├── userId (lien vers users)
       ├── shippingName (nom client)
       ├── email (email client) ⭐ NOUVEAU
       ├── phoneNumber (téléphone client)
       ├── shippingStreet, shippingCity, etc.
       └── order_items (articles de commande)
            ├── orderId (lien vers orders)
            ├── productId (produit admin)
            └── vendorProductId (produit vendeur) ⭐ IMPORTANT
```

### Vue `v_vendor_orders`

Cette vue permet aux vendeurs de consulter facilement leurs commandes avec toutes les infos client :

```sql
SELECT * FROM v_vendor_orders WHERE vendorId = 1;
```

**Colonnes importantes :**
- `customerName`, `customerEmail`, `customerPhone`
- `shippingStreet`, `shippingCity`, `shippingCountry`
- `productName`, `quantity`, `unitPrice`
- `orderStatus`, `paymentStatus`

---

## 🔐 Sécurité

### Checklist de sécurité

- [ ] **HTTPS obligatoire** en production pour les webhooks Paydunya
- [ ] **Validation** de toutes les entrées utilisateur
- [ ] **Authentification JWT** pour les endpoints vendeurs
- [ ] **Isolation des données** : un vendeur ne voit que ses commandes
- [ ] **Vérification de signature** des webhooks Paydunya
- [ ] **Logs** de tous les paiements pour audit
- [ ] **Protection CSRF** pour les endpoints publics
- [ ] **Rate limiting** pour éviter les abus

**📍 Voir :** `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md` section "Sécurité et Confidentialité"

---

## 🐛 Problèmes Courants

### 1. Email null en base de données

**Problème :** La colonne email est null après création de commande

**Solutions :**
1. Vérifier que la migration a bien été exécutée
2. Vérifier que le frontend envoie bien `shippingDetails.email`
3. Vérifier que le backend mappe correctement `shippingDetails.email` vers la colonne `email`

```bash
# Test rapide
curl -X POST http://localhost:3004/orders/guest -d '{"shippingDetails": {"email": "test@test.com", ...}, ...}'
mysql -e "SELECT email FROM orders ORDER BY id DESC LIMIT 1;"
```

### 2. Vendeur ne voit aucune commande

**Problème :** `GET /vendor/orders` retourne un tableau vide

**Causes possibles :**
1. `vendorProductId` est null dans `order_items`
2. Le vendeur n'a aucune commande réellement
3. Problème de jointure dans la vue

**Solution :**
```bash
# Vérifier que vendorProductId est bien renseigné
mysql -e "SELECT orderId, productId, vendorProductId FROM order_items WHERE vendorProductId IS NULL;"

# Si des lignes existent, il faut corriger le code de création de commande
```

### 3. Webhook Paydunya ne fonctionne pas

**Problème :** Le statut de paiement n'est pas mis à jour après paiement

**Solutions :**
1. Vérifier que l'URL du webhook est accessible publiquement (HTTPS)
2. Tester le webhook manuellement avec curl
3. Vérifier les logs du backend
4. Vérifier que `custom_data.order_id` est bien envoyé lors de l'initialisation Paydunya

```bash
# Test manuel du webhook
curl -X POST http://localhost:3004/webhooks/paydunya \
  -d '{"data": {"invoice_token": "test", "status": "completed", "custom_data": {"order_id": 1}}}'
```

**📍 Voir :** `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md` section "Debugging"

---

## 🚀 Déploiement en Production

### Checklist avant déploiement

1. **Base de données**
   - [ ] Migration `migration_add_email_to_orders.sql` exécutée
   - [ ] Sauvegarde de la base de données effectuée
   - [ ] Index créés pour performance

2. **Configuration**
   - [ ] Variables d'environnement Paydunya en mode `live`
   - [ ] URLs de callback HTTPS configurées
   - [ ] JWT_SECRET changé pour un secret fort
   - [ ] Logs configurés pour production

3. **Code Backend**
   - [ ] Tous les endpoints implémentés et testés
   - [ ] Validation de données activée
   - [ ] Gestion d'erreurs robuste
   - [ ] Logs de paiement activés

4. **Sécurité**
   - [ ] HTTPS activé partout
   - [ ] Rate limiting configuré
   - [ ] CORS configuré correctement
   - [ ] Vérification de signature Paydunya activée

5. **Tests**
   - [ ] Tous les tests de `TEST_COMMANDS.md` passent
   - [ ] Test de bout en bout avec Paydunya réel
   - [ ] Test de charge effectué

**📍 Voir :** `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md` section "Checklist de déploiement"

---

## 📞 Support et Ressources

### Documentation

- **Guide complet backend** : `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md`
- **Tests** : `TEST_COMMANDS.md`
- **Schéma SQL** : `schema-orders.sql`
- **Migration SQL** : `migration_add_email_to_orders.sql`

### Ressources externes

- **Documentation Paydunya** : https://developers.paydunya.com/doc/FR/introduction
- **Documentation PrintAlma frontend** : Voir le guide d'intégration frontend fourni

### Contact

Pour toute question sur l'implémentation :
1. Consulter d'abord `GUIDE-ENREGISTREMENT-INFOS-CLIENT.md`
2. Vérifier les logs du backend
3. Tester avec les commandes de `TEST_COMMANDS.md`

---

## 🎉 Résumé

Ce système de commandes vous permet de :

✅ **Enregistrer toutes les informations client** (nom, email, téléphone, adresse complète)
✅ **Accepter les paiements Paydunya** avec redirection automatique
✅ **Notifier les vendeurs** des nouvelles commandes
✅ **Permettre aux vendeurs** de consulter les coordonnées de leurs clients
✅ **Gérer les webhooks** pour mettre à jour automatiquement les statuts
✅ **Respecter la sécurité** et la confidentialité des données

**🚀 Le frontend est déjà prêt, il ne reste plus qu'à implémenter le backend en suivant ce guide !**

---

*Dernière mise à jour : 05 Novembre 2025*
