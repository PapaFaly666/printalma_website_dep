# 🛡️ Guide Backend - Validation Admin des Produits WIZARD

## 📋 Vue d'ensemble

Ce guide explique comment implémenter et gérer la validation admin des produits WIZARD (produits sans design) dans le backend PrintAlma.

## 🎯 Fonctionnalités requises

### 1. **Endpoints API Admin**

```javascript
// GET /api/products/admin/pending
// POST /api/products/:id/validate
// GET /api/products/admin/stats
```

### 2. **Types de produits à valider**
- **WIZARD** : Produits sans design (designId = null)
- **TRADITIONAL** : Produits avec design (designId présent)

---

## 🔧 Implementation Backend

### 1. Controller Admin (`adminController.js`)

```javascript
/**
 * GET /api/products/admin/pending
 * Récupère les produits en attente de validation
 */
async function getPendingProducts(req, res) {
  const { page = 1, limit = 20, search = '' } = req.query;

  // Query Database pour produits PENDING_VALIDATION
  const products = await db.query(`
    SELECT
      p.*,
      v.firstName, v.lastName, v.email, v.shop_name,
      vi.* as vendorImages,
      bp.name as adminProductName
    FROM vendor_products p
    LEFT JOIN vendors v ON p.vendorId = v.id
    LEFT JOIN vendor_images vi ON p.id = vi.productId
    LEFT JOIN admin_products bp ON p.baseProductId = bp.id
    WHERE p.status = 'PENDING_VALIDATION'
    ORDER BY p.submittedAt DESC
    LIMIT ? OFFSET ?
  `, [limit, (page-1)*limit]);

  res.json({
    success: true,
    data: products,
    pagination: { /* ... */ }
  });
}

/**
 * POST /api/products/:id/validate
 * Valide ou rejette un produit
 */
async function validateProduct(req, res) {
  const { id } = req.params;
  const { approved, rejectionReason } = req.body;

  // Mettre à jour le statut
  await db.query(`
    UPDATE vendor_products
    SET status = ?,
        validatedAt = NOW(),
        rejectionReason = ?
    WHERE id = ?
  `, [
    approved ? 'APPROVED' : 'REJECTED',
    approved ? null : rejectionReason,
    id
  ]);

  // Notifier le vendeur
  await notifyVendor(id, approved, rejectionReason);

  res.json({ success: true });
}
```

### 2. Structure Base de Données

```sql
-- Table des produits vendeur
CREATE TABLE vendor_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendorId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status ENUM('DRAFT', 'PENDING_VALIDATION', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',

  -- Type de produit
  designId INT NULL, -- NULL = WIZARD, NOT NULL = TRADITIONAL
  baseProductId INT NOT NULL, -- Référence au produit admin

  -- Validation
  submittedAt TIMESTAMP NULL,
  validatedAt TIMESTAMP NULL,
  rejectionReason TEXT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (vendorId) REFERENCES vendors(id),
  FOREIGN KEY (designId) REFERENCES designs(id),
  FOREIGN KEY (baseProductId) REFERENCES admin_products(id)
);

-- Table des images vendeur (pour produits WIZARD)
CREATE TABLE vendor_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  cloudinaryUrl VARCHAR(500) NOT NULL,
  imageType ENUM('base', 'detail', 'reference') DEFAULT 'base',
  colorName VARCHAR(100),
  colorCode VARCHAR(7),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (productId) REFERENCES vendor_products(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX idx_vendor_products_status ON vendor_products(status);
CREATE INDEX idx_vendor_products_submitted ON vendor_products(submittedAt);
```

### 3. Routes API (`routes/api.js`)

```javascript
const express = require('express');
const router = express.Router();
const {
  getPendingProducts,
  validateProduct,
  getValidationStats
} = require('../controllers/adminController');

// Middleware d'authentification admin
const requireAdmin = (req, res, next) => {
  // Vérifier que l'utilisateur est admin
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

// Routes admin validation
router.get('/products/admin/pending', requireAdmin, getPendingProducts);
router.post('/products/:id/validate', requireAdmin, validateProduct);
router.get('/products/admin/stats', requireAdmin, getValidationStats);

module.exports = router;
```

---

## 📊 Format des Données

### 1. **Produit WIZARD en attente**

```json
{
  "id": 1,
  "name": "T-Shirt Personnalisé Vendeur A",
  "price": 25000,
  "status": "PENDING_VALIDATION",
  "submittedAt": "2025-01-24T00:00:00.000Z",

  // Identifiant du type
  "designId": null,  // ⚡ NULL = WIZARD
  "designName": null,

  // Produit de base
  "adminProductName": "T-Shirt Basique",
  "baseProduct": {
    "id": 1,
    "name": "T-Shirt Basique"
  },

  // Images uploadées par le vendeur
  "vendorImages": [
    {
      "id": 1,
      "cloudinaryUrl": "https://res.cloudinary.com/...",
      "imageType": "base",
      "colorName": "Blanc",
      "colorCode": "#FFFFFF"
    },
    {
      "id": 2,
      "cloudinaryUrl": "https://res.cloudinary.com/...",
      "imageType": "detail",
      "colorName": "Blanc",
      "colorCode": "#FFFFFF"
    }
  ],

  // Vendeur
  "vendor": {
    "id": 1,
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "shop_name": "Boutique Jean"
  },

  "categories": ["T-Shirts", "Mode"]
}
```

### 2. **Produit TRADITIONAL en attente**

```json
{
  "id": 2,
  "name": "Mug avec Design Cool",
  "price": 15000,
  "status": "PENDING_VALIDATION",
  "submittedAt": "2025-01-23T00:00:00.000Z",

  // Identifiant du type
  "designId": 101,  // ⚡ NOT NULL = TRADITIONAL
  "designName": "Design Cool Abstract",

  // Images générées (admin + design)
  "images": [
    "https://res.cloudinary.com/demo/image/upload/v1/mug-sample.jpg"
  ],
  "vendorImages": [], // ⚡ Vide pour TRADITIONAL

  // ... reste identique
}
```

---

## 🔄 Workflow de Validation

### 1. **Soumission par le Vendeur**

```javascript
// POST /api/vendor/products/:id/submit-for-validation
async function submitForValidation(req, res) {
  const { id } = req.params;

  // Vérifier que le produit est complet
  const product = await getProductById(id);

  if (product.designId === null) {
    // WIZARD: Vérifier que des images sont uploadées
    const images = await getVendorImages(id);
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez uploader au moins une image'
      });
    }
  }

  // Changer le statut
  await updateProductStatus(id, 'PENDING_VALIDATION');

  res.json({ success: true });
}
```

### 2. **Validation par l'Admin**

```javascript
// POST /api/products/:id/validate
async function validateProduct(req, res) {
  const { id } = req.params;
  const { approved, rejectionReason } = req.body;

  const newStatus = approved ? 'APPROVED' : 'REJECTED';

  // Transaction pour garantir la cohérence
  await db.transaction(async (trx) => {
    // Mettre à jour le produit
    await trx('vendor_products')
      .where('id', id)
      .update({
        status: newStatus,
        validatedAt: new Date(),
        rejectionReason: approved ? null : rejectionReason
      });

    if (approved) {
      // Si approuvé, rendre le produit visible publiquement
      await trx('vendor_products')
        .where('id', id)
        .update({ isPublic: true });
    }
  });

  // Notification vendeur
  await sendValidationNotification(id, approved, rejectionReason);

  res.json({ success: true });
}
```

---

## 🚀 Démarrage Rapide

### 1. **Installation**

```bash
cd backend
npm install express cors dotenv mysql2

# Créer les tables
mysql -u root -p < schema.sql
```

### 2. **Configuration**

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors({ credentials: true, origin: 'http://localhost:5174' }));
app.use(express.json());
app.use('/api', apiRoutes);

app.listen(3004, () => {
  console.log('🚀 Backend démarré sur http://localhost:3004');
  console.log('✅ Endpoints admin validation disponibles:');
  console.log('   📋 GET /api/products/admin/pending');
  console.log('   ✅ POST /api/products/:id/validate');
  console.log('   📊 GET /api/products/admin/stats');
});
```

### 3. **Test des Endpoints**

```bash
# Récupérer les produits en attente
curl "http://localhost:3004/api/products/admin/pending"

# Approuver un produit
curl -X POST "http://localhost:3004/api/products/1/validate" \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# Rejeter un produit
curl -X POST "http://localhost:3004/api/products/1/validate" \
  -H "Content-Type: application/json" \
  -d '{"approved": false, "rejectionReason": "Images de mauvaise qualité"}'
```

---

## 🔍 Détection Type Produit

### Frontend Logic

```typescript
// Détecter le type de produit
const isWizardProduct = !product.designId ||
                       product.designId === null ||
                       product.designId === 0 ||
                       product.designId === undefined;

if (isWizardProduct) {
  // Afficher les vendorImages
  product.vendorImages.map(image => /* ... */);
} else {
  // Afficher les images générées
  product.images.map(image => /* ... */);
}
```

### Backend Query

```sql
-- Récupérer tous les produits avec type
SELECT
  p.*,
  CASE
    WHEN p.designId IS NULL THEN 'WIZARD'
    ELSE 'TRADITIONAL'
  END as productType,

  -- Images selon le type
  CASE
    WHEN p.designId IS NULL THEN JSON_ARRAYAGG(vi.*)
    ELSE JSON_ARRAYAGG(pi.*)
  END as images

FROM vendor_products p
LEFT JOIN vendor_images vi ON p.id = vi.productId AND p.designId IS NULL
LEFT JOIN product_images pi ON p.id = pi.productId AND p.designId IS NOT NULL
WHERE p.status = 'PENDING_VALIDATION'
GROUP BY p.id;
```

---

## 📈 Surveillance et Métriques

### 1. **Dashboard Stats**

```javascript
async function getValidationStats(req, res) {
  const stats = await db.query(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'PENDING_VALIDATION' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN designId IS NULL THEN 1 ELSE 0 END) as wizardProducts,
      SUM(CASE WHEN designId IS NOT NULL THEN 1 ELSE 0 END) as traditionalProducts
    FROM vendor_products
  `);

  res.json({ success: true, data: stats[0] });
}
```

### 2. **Logs et Monitoring**

```javascript
// Logger pour traçabilité
const logValidation = async (productId, adminId, action, reason = null) => {
  await db.query(`
    INSERT INTO validation_logs (productId, adminId, action, reason, timestamp)
    VALUES (?, ?, ?, ?, NOW())
  `, [productId, adminId, action, reason]);
};

// Utilisation
await logValidation(id, req.user.id, approved ? 'APPROVED' : 'REJECTED', rejectionReason);
```

---

## ⚠️ Points d'Attention

### 1. **Sécurité**
- ✅ Authentification admin obligatoire
- ✅ Validation des données d'entrée
- ✅ Sanitisation des raisons de rejet
- ✅ Rate limiting sur les endpoints

### 2. **Performance**
- ✅ Index sur `status` et `submittedAt`
- ✅ Pagination sur les listes
- ✅ Cache pour les statistiques
- ✅ Optimisation des jointures

### 3. **Notifications**
- ✅ Email au vendeur après validation
- ✅ Notifications in-app
- ✅ Webhooks pour intégrations tierces

---

## 📝 Exemple Complet

Voir les fichiers créés :
- `backend/controllers/adminController.js` - Controller principal
- `backend/routes/api.js` - Routes avec authentification
- Schéma SQL pour les tables nécessaires

Le système est maintenant prêt à gérer la validation admin des produits WIZARD et TRADITIONAL ! 🎉