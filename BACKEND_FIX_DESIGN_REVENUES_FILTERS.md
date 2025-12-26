# 🔧 GUIDE BACKEND : Correction des filtres dans /vendeur/design-revenues

## 📋 Problème identifié

**Symptôme :** Dans la page `/vendeur/design-revenues`, les designs **disparaissent** dès que l'admin livre la commande (statut → `DELIVERED`), mais ils sont **visibles** tant que la commande n'est pas livrée.

**Comportement actuel (incorrect) :**
- Commande en statut `PENDING`, `PROCESSING`, `CONFIRMED` → Design **visible** ✅
- Admin livre la commande → statut `DELIVERED` → Design **disparaît** ❌

**Comportement attendu (correct) :**
- Commande en statut `PENDING`, `PROCESSING`, `CONFIRMED` → Design **visible** ✅
- Admin livre la commande → statut `DELIVERED` → Design **toujours visible** ✅
- Les designs doivent rester visibles **peu importe le statut** de la commande

---

## 🎯 Objectif

Les vendeurs doivent pouvoir voir **tous leurs designs utilisés** dans les commandes, **quel que soit le statut** de la commande (PENDING, DELIVERED, COMPLETED, etc.).

---

## 🔍 Analyse technique

### 1. Endpoints concernés

#### **A. GET /vendor/design-revenues/stats**
Retourne les statistiques globales des revenus.

**Paramètres de requête :**
- `period`: 'week' | 'month' | 'year' | 'all'

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 150000,
    "pendingRevenue": 45000,
    "completedRevenue": 105000,
    "totalUsages": 25,
    "uniqueDesignsUsed": 8,
    "averageRevenuePerDesign": 18750,
    "topDesigns": [
      {
        "designId": 5,
        "designName": "Design Afrique",
        "revenue": 32000,
        "usages": 8
      }
    ]
  }
}
```

#### **B. GET /vendor/design-revenues/designs**
Retourne la liste des designs avec leurs revenus.

**Paramètres de requête :**
- `period`: 'week' | 'month' | 'year' | 'all'
- `sortBy`: 'revenue' | 'usage' | 'recent'
- `search`: string (optionnel)

**Réponse attendue :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "designId": 5,
      "designName": "Design Afrique",
      "designImage": "https://example.com/design.png",
      "designPrice": 3200,
      "totalUsages": 8,
      "totalRevenue": 23040,
      "pendingRevenue": 6400,
      "completedRevenue": 16640,
      "lastUsedAt": "2024-01-20T10:30:00Z",
      "usageHistory": []
    }
  ]
}
```

#### **C. GET /vendor/design-revenues/designs/:designId/history**
Retourne l'historique détaillé d'un design spécifique.

**Réponse attendue :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderId": 123,
      "orderNumber": "CMD-2024-00123",
      "customerName": "Mamadou Diop",
      "productName": "T-Shirt Blanc",
      "usedAt": "2024-01-20T10:30:00Z",
      "revenue": 2880,
      "status": "COMPLETED",
      "commissionRate": 0.10,
      "paymentStatus": "PAID",
      "orderPaymentStatus": "PAID"
    },
    {
      "id": 2,
      "orderId": 124,
      "orderNumber": "CMD-2024-00124",
      "customerName": "Fatou Sow",
      "productName": "T-Shirt Noir",
      "usedAt": "2024-01-21T14:15:00Z",
      "revenue": 2880,
      "status": "PENDING",
      "commissionRate": 0.10,
      "paymentStatus": "PENDING",
      "orderPaymentStatus": "PENDING"
    }
  ]
}
```

---

## 🐛 Cause racine du problème

Le backend filtre probablement les designs basés sur le **statut de la commande**, en n'incluant que les commandes avec certains statuts (ex: `PENDING`, `CONFIRMED`), mais **excluant** les commandes `DELIVERED`.

**Code problématique typique :**

```sql
-- ❌ INCORRECT : Exclut les commandes livrées
SELECT
  d.id as design_id,
  d.name as design_name,
  COUNT(oi.id) as total_usages,
  SUM(d.price * oi.quantity) as total_revenue
FROM designs d
JOIN products p ON p.design_id = d.id
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE d.vendor_id = ?
AND o.status IN ('PENDING', 'CONFIRMED', 'PROCESSING')  -- ⚠️ PROBLÈME ICI
GROUP BY d.id;
```

---

## 🔧 Solutions de correction

### **Solution 1 : Inclure TOUS les statuts de commande (RECOMMANDÉ)**

Modifier la requête pour **NE PAS filtrer** par statut, ou inclure **tous les statuts** sauf `CANCELLED`:

```sql
-- ✅ CORRECT : Inclut toutes les commandes sauf annulées
SELECT
  d.id as design_id,
  d.name as design_name,
  d.image_url as design_image,
  d.price as design_price,
  COUNT(DISTINCT oi.order_id) as total_usages,
  SUM(d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))) as total_revenue,
  SUM(
    CASE
      WHEN o.status IN ('PENDING', 'CONFIRMED', 'PROCESSING')
      THEN d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))
      ELSE 0
    END
  ) as pending_revenue,
  SUM(
    CASE
      WHEN o.status IN ('DELIVERED', 'COMPLETED') AND o.payment_status = 'PAID'
      THEN d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))
      ELSE 0
    END
  ) as completed_revenue,
  MAX(o.created_at) as last_used_at
FROM designs d
JOIN products p ON p.design_id = d.id
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE d.vendor_id = ?
AND o.status != 'CANCELLED'  -- ✅ Exclure uniquement les annulées
GROUP BY d.id, d.name, d.image_url, d.price
ORDER BY total_revenue DESC;
```

**Changements clés :**
1. **Ligne 20 :** `AND o.status != 'CANCELLED'` au lieu de `AND o.status IN ('PENDING', ...)`
2. **Lignes 9-14 :** Calcul conditionnel de `pending_revenue` pour les commandes non livrées
3. **Lignes 15-20 :** Calcul conditionnel de `completed_revenue` pour les commandes livrées et payées

---

### **Solution 2 : Inclure explicitement tous les statuts**

Si vous préférez lister explicitement les statuts autorisés :

```sql
-- ✅ ALTERNATIVE : Liste explicite de tous les statuts
WHERE d.vendor_id = ?
AND o.status IN (
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',      -- ✅ AJOUT IMPORTANT
  'COMPLETED'       -- ✅ AJOUT IMPORTANT
)
-- N'inclut pas : 'CANCELLED', 'REFUNDED'
```

---

### **Solution 3 : Controller Node.js/Express**

Si vous utilisez un ORM ou des requêtes dans le code backend :

```javascript
// controllers/vendorDesignRevenueController.js

async getDesignRevenues(req, res) {
  try {
    const vendorId = req.user.id; // ID du vendeur connecté
    const { period = 'month', sortBy = 'revenue', search } = req.query;

    // Calculer la date de début selon la période
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01'); // Date très ancienne
        break;
    }

    // ✅ CORRECTION : Requête sans filtre de statut restrictif
    const query = `
      SELECT
        d.id as design_id,
        d.name as design_name,
        d.image_url as design_image,
        d.price as design_price,
        COUNT(DISTINCT oi.order_id) as total_usages,
        SUM(d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))) as total_revenue,
        SUM(
          CASE
            WHEN o.status IN ('PENDING', 'CONFIRMED', 'PROCESSING')
            THEN d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))
            ELSE 0
          END
        ) as pending_revenue,
        SUM(
          CASE
            WHEN o.status IN ('DELIVERED', 'COMPLETED') AND o.payment_status = 'PAID'
            THEN d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))
            ELSE 0
          END
        ) as completed_revenue,
        MAX(o.created_at) as last_used_at
      FROM designs d
      JOIN products p ON p.design_id = d.id
      JOIN order_items oi ON oi.product_id = p.id
      JOIN orders o ON o.id = oi.order_id
      WHERE d.vendor_id = ?
      AND o.status != 'CANCELLED'
      AND o.created_at >= ?
      ${search ? "AND d.name LIKE ?" : ""}
      GROUP BY d.id, d.name, d.image_url, d.price
    `;

    // Préparer les paramètres
    const params = [vendorId, startDate];
    if (search) {
      params.push(`%${search}%`);
    }

    // Ajouter le tri
    let orderByClause = '';
    switch (sortBy) {
      case 'revenue':
        orderByClause = 'ORDER BY total_revenue DESC';
        break;
      case 'usage':
        orderByClause = 'ORDER BY total_usages DESC';
        break;
      case 'recent':
        orderByClause = 'ORDER BY last_used_at DESC';
        break;
      default:
        orderByClause = 'ORDER BY total_revenue DESC';
    }

    const finalQuery = query + ' ' + orderByClause;

    // Exécuter la requête
    const [designs] = await db.query(finalQuery, params);

    // Formater la réponse
    const formattedDesigns = designs.map(design => ({
      id: design.design_id,
      designId: design.design_id,
      designName: design.design_name,
      designImage: design.design_image,
      designPrice: parseFloat(design.design_price),
      totalUsages: parseInt(design.total_usages),
      totalRevenue: parseFloat(design.total_revenue || 0),
      pendingRevenue: parseFloat(design.pending_revenue || 0),
      completedRevenue: parseFloat(design.completed_revenue || 0),
      lastUsedAt: design.last_used_at,
      usageHistory: [] // Sera chargé séparément si besoin
    }));

    res.json({
      success: true,
      data: formattedDesigns
    });

  } catch (error) {
    console.error('Erreur récupération design revenues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des revenus des designs'
    });
  }
}

// Endpoint pour l'historique détaillé d'un design
async getDesignUsageHistory(req, res) {
  try {
    const vendorId = req.user.id;
    const { designId } = req.params;

    // Vérifier que le design appartient au vendeur
    const designCheck = await db.query(
      'SELECT id FROM designs WHERE id = ? AND vendor_id = ?',
      [designId, vendorId]
    );

    if (designCheck[0].length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce design'
      });
    }

    // ✅ CORRECTION : Récupérer TOUTES les utilisations sauf annulées
    const query = `
      SELECT
        oi.id,
        o.id as order_id,
        o.order_number,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        p.name as product_name,
        o.created_at as used_at,
        d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10)) as revenue,
        o.status,
        o.payment_status,
        o.payment_status as order_payment_status,
        COALESCE(d.commission_rate, 0.10) as commission_rate
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      JOIN designs d ON d.id = p.design_id
      JOIN users u ON u.id = o.user_id
      WHERE d.id = ?
      AND d.vendor_id = ?
      AND o.status != 'CANCELLED'
      ORDER BY o.created_at DESC
    `;

    const [history] = await db.query(query, [designId, vendorId]);

    // Formater la réponse
    const formattedHistory = history.map(usage => ({
      id: usage.id,
      orderId: usage.order_id,
      orderNumber: usage.order_number,
      customerName: usage.customer_name,
      productName: usage.product_name,
      usedAt: usage.used_at,
      revenue: parseFloat(usage.revenue),
      status: usage.status === 'DELIVERED' || usage.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
      commissionRate: parseFloat(usage.commission_rate),
      paymentStatus: usage.payment_status,
      orderPaymentStatus: usage.order_payment_status
    }));

    res.json({
      success: true,
      data: formattedHistory
    });

  } catch (error) {
    console.error('Erreur récupération historique design:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
}
```

---

### **Solution 4 : Statistiques globales**

Pour l'endpoint `/vendor/design-revenues/stats` :

```javascript
async getRevenueStats(req, res) {
  try {
    const vendorId = req.user.id;
    const { period = 'month' } = req.query;

    // Calculer la date de début selon la période
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01');
        break;
    }

    // ✅ CORRECTION : Statistiques incluant toutes les commandes
    const statsQuery = `
      SELECT
        SUM(d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))) as total_revenue,
        SUM(
          CASE
            WHEN o.status IN ('PENDING', 'CONFIRMED', 'PROCESSING')
            THEN d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))
            ELSE 0
          END
        ) as pending_revenue,
        SUM(
          CASE
            WHEN o.status IN ('DELIVERED', 'COMPLETED') AND o.payment_status = 'PAID'
            THEN d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))
            ELSE 0
          END
        ) as completed_revenue,
        COUNT(DISTINCT oi.order_id) as total_usages,
        COUNT(DISTINCT d.id) as unique_designs_used
      FROM designs d
      JOIN products p ON p.design_id = d.id
      JOIN order_items oi ON oi.product_id = p.id
      JOIN orders o ON o.id = oi.order_id
      WHERE d.vendor_id = ?
      AND o.status != 'CANCELLED'
      AND o.created_at >= ?
    `;

    const [stats] = await db.query(statsQuery, [vendorId, startDate]);

    // Top designs
    const topDesignsQuery = `
      SELECT
        d.id as design_id,
        d.name as design_name,
        SUM(d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))) as revenue,
        COUNT(DISTINCT oi.order_id) as usages
      FROM designs d
      JOIN products p ON p.design_id = d.id
      JOIN order_items oi ON oi.product_id = p.id
      JOIN orders o ON o.id = oi.order_id
      WHERE d.vendor_id = ?
      AND o.status != 'CANCELLED'
      AND o.created_at >= ?
      GROUP BY d.id, d.name
      ORDER BY revenue DESC
      LIMIT 5
    `;

    const [topDesigns] = await db.query(topDesignsQuery, [vendorId, startDate]);

    const result = {
      totalRevenue: parseFloat(stats[0].total_revenue || 0),
      pendingRevenue: parseFloat(stats[0].pending_revenue || 0),
      completedRevenue: parseFloat(stats[0].completed_revenue || 0),
      totalUsages: parseInt(stats[0].total_usages || 0),
      uniqueDesignsUsed: parseInt(stats[0].unique_designs_used || 0),
      averageRevenuePerDesign: stats[0].unique_designs_used > 0
        ? parseFloat(stats[0].total_revenue) / parseInt(stats[0].unique_designs_used)
        : 0,
      topDesigns: topDesigns.map(design => ({
        designId: design.design_id,
        designName: design.design_name,
        revenue: parseFloat(design.revenue),
        usages: parseInt(design.usages)
      }))
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Erreur récupération stats revenus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
}
```

---

## 🧪 Tests de validation

### Test 1 : Vérifier qu'un design reste visible après livraison

```bash
# 1. Créer une commande test avec un design
curl -X POST "https://printalma-back-dep.onrender.com/orders" \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=[TOKEN_CLIENT]" \
  -d '{
    "items": [
      {
        "productId": [PRODUCT_WITH_VENDOR_DESIGN],
        "quantity": 1
      }
    ]
  }'

# 2. Vérifier que le design apparaît dans /vendor/design-revenues
curl -X GET "https://printalma-back-dep.onrender.com/vendor/design-revenues/designs?period=all" \
  -H "Cookie: jwt=[TOKEN_VENDEUR]"
# ✅ Le design doit être visible

# 3. Admin livre la commande
curl -X PATCH "https://printalma-back-dep.onrender.com/admin/orders/[ORDER_ID]" \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=[TOKEN_ADMIN]" \
  -d '{ "status": "DELIVERED" }'

# 4. RE-VÉRIFIER que le design est toujours visible
curl -X GET "https://printalma-back-dep.onrender.com/vendor/design-revenues/designs?period=all" \
  -H "Cookie: jwt=[TOKEN_VENDEUR]"
# ✅ Le design DOIT TOUJOURS être visible
# ❌ ÉCHEC si le design a disparu
```

### Test 2 : Vérifier les statistiques

```bash
# Après livraison de plusieurs commandes, vérifier les stats
curl -X GET "https://printalma-back-dep.onrender.com/vendor/design-revenues/stats?period=month" \
  -H "Cookie: jwt=[TOKEN_VENDEUR]"

# Résultat attendu :
# {
#   "totalRevenue": [MONTANT_TOTAL],
#   "pendingRevenue": [MONTANT_COMMANDES_NON_LIVREES],
#   "completedRevenue": [MONTANT_COMMANDES_LIVREES],  ← ✅ DOIT ÊTRE > 0
#   "totalUsages": [NOMBRE_TOTAL],                     ← ✅ DOIT INCLURE LIVRÉES
#   "uniqueDesignsUsed": [NOMBRE_DESIGNS]
# }
```

### Test 3 : Vérifier l'historique d'un design

```bash
# Récupérer l'historique d'un design spécifique
curl -X GET "https://printalma-back-dep.onrender.com/vendor/design-revenues/designs/[DESIGN_ID]/history" \
  -H "Cookie: jwt=[TOKEN_VENDEUR]"

# Résultat attendu : doit inclure les commandes livrées
# {
#   "success": true,
#   "data": [
#     {
#       "orderNumber": "CMD-2024-00123",
#       "status": "COMPLETED",           ← ✅ Commandes livrées
#       "orderPaymentStatus": "PAID",
#       "revenue": 2880
#     },
#     {
#       "orderNumber": "CMD-2024-00124",
#       "status": "PENDING",             ← ✅ Commandes en attente
#       "orderPaymentStatus": "PENDING",
#       "revenue": 2880
#     }
#   ]
# }
```

---

## 📊 Structure de données attendue

### Table `designs`
```sql
CREATE TABLE designs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vendor_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(4,3) DEFAULT 0.10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES users(id)
);
```

### Table `products`
```sql
CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vendor_id BIGINT NOT NULL,
  design_id BIGINT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED') DEFAULT 'DRAFT',
  FOREIGN KEY (vendor_id) REFERENCES users(id),
  FOREIGN KEY (design_id) REFERENCES designs(id)
);
```

### Table `orders`
```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id BIGINT NOT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Table `order_items`
```sql
CREATE TABLE order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## 🚀 Routes à implémenter/corriger

```javascript
// routes/vendorDesignRevenue.js
const express = require('express');
const router = express.Router();
const vendorDesignRevenueController = require('../controllers/vendorDesignRevenueController');
const { authMiddleware, vendorMiddleware } = require('../middleware/auth');

// Appliquer l'authentification vendeur
router.use(authMiddleware);
router.use(vendorMiddleware);

// Routes
router.get('/stats', vendorDesignRevenueController.getRevenueStats);
router.get('/designs', vendorDesignRevenueController.getDesignRevenues);
router.get('/designs/:designId/history', vendorDesignRevenueController.getDesignUsageHistory);

module.exports = router;
```

```javascript
// Dans app.js ou server.js
const vendorDesignRevenueRoutes = require('./routes/vendorDesignRevenue');
app.use('/vendor/design-revenues', vendorDesignRevenueRoutes);
```

---

## 📋 Checklist de déploiement

- [ ] Vérifier que la table `designs` a bien une colonne `vendor_id`
- [ ] Vérifier que les `products` ont une référence à `design_id`
- [ ] Modifier les requêtes SQL pour ne PAS filtrer par statut restrictif
- [ ] Inclure `o.status != 'CANCELLED'` au lieu de `o.status IN (...)`
- [ ] Tester avec une commande en statut PENDING → design visible
- [ ] Livrer la commande (statut → DELIVERED) → design toujours visible
- [ ] Vérifier que `completedRevenue` augmente après livraison
- [ ] Vérifier que `pendingRevenue` diminue après livraison
- [ ] Vérifier l'historique inclut les commandes livrées
- [ ] Tester les filtres de période (week, month, year, all)
- [ ] Tester la recherche par nom de design
- [ ] Tester le tri (revenue, usage, recent)

---

## 🆘 En cas de problème

### Problème 1 : Les designs n'apparaissent pas du tout

**Cause possible :** La table `products` n'a pas de `design_id` ou la jointure est incorrecte

**Solution :** Vérifier la structure de la base de données
```sql
DESCRIBE products;
DESCRIBE designs;

-- Vérifier qu'il existe des liens entre products et designs
SELECT p.id, p.name, p.design_id, d.name as design_name
FROM products p
LEFT JOIN designs d ON d.id = p.design_id
WHERE p.vendor_id = [VENDOR_ID]
LIMIT 10;
```

### Problème 2 : Les revenus sont à 0

**Cause possible :** Le calcul du revenu ne tient pas compte du prix du design

**Solution :** Vérifier que vous utilisez bien `d.price` (prix du design) et pas `p.price` (prix du produit)

```sql
-- Vérifier manuellement
SELECT
  d.price as design_price,
  p.price as product_price,
  oi.quantity,
  d.price * oi.quantity * 0.9 as calculated_revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN designs d ON d.id = p.design_id
WHERE d.vendor_id = [VENDOR_ID]
LIMIT 5;
```

### Problème 3 : Certaines commandes n'apparaissent pas

**Cause possible :** Un filtre caché sur le statut de paiement ou autre condition

**Solution :** Vérifier toutes les conditions WHERE dans vos requêtes
```sql
-- Requête de debug : voir TOUTES les commandes d'un vendeur
SELECT
  o.id,
  o.order_number,
  o.status,
  o.payment_status,
  d.name as design_name
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
JOIN designs d ON d.id = p.design_id
WHERE d.vendor_id = [VENDOR_ID]
ORDER BY o.created_at DESC;
```

---

## 📝 Résumé

**Problème :** Les designs disparaissent de `/vendeur/design-revenues` après livraison

**Cause :** Le backend filtre les designs en excluant les commandes `DELIVERED`

**Solution :** Modifier les requêtes pour inclure **TOUS** les statuts sauf `CANCELLED`

**Changement clé :**
```sql
-- ❌ AVANT
AND o.status IN ('PENDING', 'CONFIRMED', 'PROCESSING')

-- ✅ APRÈS
AND o.status != 'CANCELLED'
```

**Impact :** Les vendeurs peuvent maintenant voir tous leurs designs utilisés, peu importe le statut de livraison

---

## 📞 Support

Pour toute question ou problème :
1. Vérifier le schéma de base de données avec `DESCRIBE [table]`
2. Tester les requêtes SQL manuellement
3. Vérifier les logs du backend pour identifier les erreurs
4. Fournir les messages d'erreur exacts et des exemples de données
