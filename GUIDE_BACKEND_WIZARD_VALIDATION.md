# 🎯 Guide Backend - Implémentation Validation Produits WIZARD

## 📋 Contexte

L'interface admin pour la validation des produits WIZARD a été implémentée côté frontend. Ce guide détaille les endpoints backend requis pour intégrer cette fonctionnalité.

## 🔧 Endpoints Requis

### 1. **GET /admin/pending-products** - Liste des produits en attente

#### Description
Récupère la liste des produits vendeurs en attente de validation avec distinction WIZARD/TRADITIONNEL.

#### Paramètres Query (optionnels)
```typescript
{
  productType?: 'WIZARD' | 'TRADITIONAL',  // Filtrer par type
  vendor?: string,                         // Filtrer par nom de vendeur
  status?: 'PENDING' | 'DRAFT' | 'PUBLISHED'
}
```

#### Headers
```http
Authorization: Bearer <admin-token>
Content-Type: application/json
```

#### Logique Backend
```typescript
// Détection automatique des produits WIZARD
const isWizardProduct = !product.designId || product.designId === null || product.designId === 0;

// Enrichissement des données produit
const enrichedProduct = {
  ...product,
  isWizardProduct: isWizardProduct,
  productType: isWizardProduct ? 'WIZARD' : 'TRADITIONAL',
  hasDesign: !isWizardProduct,
  adminProductName: product.baseProduct?.name || product.productName
};
```

#### Réponse Attendue
```json
{
  "success": true,
  "message": "Produits récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 138,
        "vendorName": "T-shirt Personnalisé Famille",
        "vendorDescription": "T-shirt blanc avec photos de famille personnalisées",
        "vendorPrice": 12000,
        "vendorStock": 50,
        "status": "PENDING",
        "isValidated": false,
        "validatedAt": null,
        "validatedBy": null,
        "postValidationAction": "AUTO_PUBLISH",
        "designCloudinaryUrl": null,
        "rejectionReason": null,

        // ✅ Nouvelles propriétés WIZARD
        "isWizardProduct": true,
        "productType": "WIZARD",
        "hasDesign": false,
        "adminProductName": "T-shirt Blanc Classique",
        "baseProduct": {
          "id": 34,
          "name": "T-shirt Blanc Classique"
        },

        "vendor": {
          "id": 7,
          "firstName": "John",
          "lastName": "Vendeur",
          "email": "john@vendor.com",
          "shop_name": "Ma Boutique Photo"
        },

        "createdAt": "2024-09-15T10:30:00.000Z",
        "updatedAt": "2024-09-15T10:30:00.000Z"
      }
    ],
    "stats": {
      "pending": 12,
      "validated": 45,
      "rejected": 8,
      "total": 65,
      "wizardCount": 7,
      "traditionalCount": 5
    }
  }
}
```

### 2. **PATCH /admin/validate-product/:id** - Validation d'un produit

#### Description
Approuve ou rejette un produit vendeur (WIZARD ou traditionnel).

#### Paramètres URL
- `id`: ID du produit à valider

#### Body
```json
{
  "approved": true,
  "rejectionReason": "Optionnel si approved=false"
}
```

#### Logique Backend
```typescript
// 1. Vérifier les permissions admin
if (!user.isAdmin()) {
  return res.status(403).json({ success: false, message: 'Accès refusé' });
}

// 2. Récupérer le produit
const product = await VendorProduct.findById(productId);
if (!product) {
  return res.status(404).json({ success: false, message: 'Produit non trouvé' });
}

// 3. Mettre à jour le statut
if (approved) {
  product.status = product.postValidationAction === 'AUTO_PUBLISH' ? 'PUBLISHED' : 'DRAFT';
  product.isValidated = true;
  product.validatedAt = new Date();
  product.validatedBy = user.id;
  product.rejectionReason = null;
} else {
  product.status = 'DRAFT';
  product.isValidated = false;
  product.rejectionReason = rejectionReason;
}

await product.save();

// 4. Notification vendeur (optionnel)
await notifyVendor(product.vendorId, approved ? 'APPROVED' : 'REJECTED', product);
```

#### Réponse
```json
{
  "success": true,
  "message": "Produit validé avec succès",
  "data": {
    "productId": 138,
    "status": "PUBLISHED",
    "action": "AUTO_PUBLISH"
  }
}
```

### 3. **PATCH /admin/validate-products-batch** - Validation en lot

#### Description
Valide plusieurs produits en une seule opération.

#### Body
```json
{
  "productIds": [138, 139, 140],
  "approved": true,
  "rejectionReason": "Optionnel si approved=false"
}
```

#### Réponse
```json
{
  "success": true,
  "message": "3 produits validés avec succès",
  "data": {
    "processedCount": 3,
    "successCount": 3,
    "failedCount": 0,
    "results": [
      {
        "productId": 138,
        "status": "success",
        "action": "PUBLISHED"
      }
    ]
  }
}
```

## 🗄️ Modèles de Base de Données

### Extension du modèle VendorProduct

```sql
-- Ajouter ces colonnes si pas déjà présentes
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP NULL;
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS validated_by INTEGER NULL;
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS post_validation_action ENUM('AUTO_PUBLISH', 'TO_DRAFT') DEFAULT 'AUTO_PUBLISH';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_vendor_products_status ON vendor_products(status);
CREATE INDEX IF NOT EXISTS idx_vendor_products_validation ON vendor_products(is_validated, status);
```

### Schema TypeScript/Sequelize

```typescript
// Modèle VendorProduct étendu
interface VendorProduct {
  id: number;
  vendorId: number;
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
  vendorStock: number;
  status: 'PENDING' | 'DRAFT' | 'PUBLISHED';
  isValidated: boolean;
  validatedAt?: Date;
  validatedBy?: number;
  postValidationAction: 'AUTO_PUBLISH' | 'TO_DRAFT';
  rejectionReason?: string;

  // Relations
  designId?: number;
  baseProductId: number;
  vendorId: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Relations
  design?: Design;
  baseProduct?: BaseProduct;
  vendor?: Vendor;
}
```

## 🔐 Sécurité et Permissions

### Middleware d'authentification
```typescript
// Vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Permissions administrateur requises'
    });
  }
  next();
};

// Appliquer le middleware
app.use('/admin/pending-products', requireAdmin);
app.use('/admin/validate-product', requireAdmin);
app.use('/admin/validate-products-batch', requireAdmin);
```

### Validation des données
```typescript
// Validation pour endpoint de validation
const validateProductSchema = {
  approved: { type: 'boolean', required: true },
  rejectionReason: {
    type: 'string',
    required: false,
    minLength: 5,
    maxLength: 500
  }
};

// Validation conditionnelle
if (!approved && !rejectionReason) {
  return res.status(400).json({
    success: false,
    message: 'Raison de rejet requise quand approved=false'
  });
}
```

## 📊 Statistiques et Métriques

### Calcul des statistiques
```typescript
const getValidationStats = async () => {
  const stats = await VendorProduct.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Calculer les types de produits
  const wizardCount = await VendorProduct.countDocuments({
    $or: [
      { designId: null },
      { designId: { $exists: false } },
      { designId: 0 }
    ],
    status: 'PENDING'
  });

  const traditionalCount = await VendorProduct.countDocuments({
    designId: { $ne: null, $gt: 0 },
    status: 'PENDING'
  });

  return {
    pending: stats.find(s => s._id === 'PENDING')?.count || 0,
    validated: stats.find(s => s._id === 'PUBLISHED')?.count || 0,
    rejected: stats.filter(s => s._id === 'DRAFT' && s.rejectionReason).length,
    total: stats.reduce((sum, s) => sum + s.count, 0),
    wizardCount,
    traditionalCount
  };
};
```

## 🔄 Gestion des Notifications

### Notification vendeur après validation
```typescript
const notifyVendor = async (vendorId: number, action: 'APPROVED' | 'REJECTED', product: VendorProduct) => {
  const notification = {
    vendorId,
    type: action === 'APPROVED' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
    title: action === 'APPROVED'
      ? '✅ Produit approuvé'
      : '❌ Produit rejeté',
    message: action === 'APPROVED'
      ? `Votre produit "${product.vendorName}" a été approuvé et est maintenant ${product.status === 'PUBLISHED' ? 'publié' : 'en brouillon'}.`
      : `Votre produit "${product.vendorName}" a été rejeté. Raison: ${product.rejectionReason}`,
    data: {
      productId: product.id,
      productName: product.vendorName,
      action,
      rejectionReason: product.rejectionReason
    },
    createdAt: new Date()
  };

  await NotificationService.create(notification);

  // Envoyer notification en temps réel via WebSocket
  io.to(`vendor_${vendorId}`).emit('product_validation', notification);
};
```

## 🧪 Tests Recommandés

### Tests unitaires
```typescript
describe('Admin Product Validation', () => {
  test('should list pending products with WIZARD detection', async () => {
    const response = await request(app)
      .get('/admin/pending-products')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.products).toHaveLength(3);
    expect(response.body.data.products[0]).toHaveProperty('isWizardProduct');
  });

  test('should approve WIZARD product correctly', async () => {
    const response = await request(app)
      .patch('/admin/validate-product/138')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true })
      .expect(200);

    expect(response.body.success).toBe(true);

    // Vérifier en base
    const product = await VendorProduct.findById(138);
    expect(product.isValidated).toBe(true);
    expect(product.status).toBe('PUBLISHED');
  });
});
```

## 📝 Notes d'Implémentation

### Priorités
1. **Endpoint GET /admin/pending-products** (critique pour affichage)
2. **Endpoint PATCH /admin/validate-product/:id** (critique pour validation)
3. **Endpoint PATCH /admin/validate-products-batch** (nice-to-have)

### Optimisations
- **Mise en cache** des statistiques (Redis)
- **Pagination** pour grandes listes de produits
- **Indexes** database pour performance
- **Rate limiting** sur endpoints admin

### Compatibilité
- Assurer la rétrocompatibilité avec l'existant
- Gérer les produits existants sans `designId`
- Migration douce des données historiques

## 🚀 Déploiement

### Variables d'environnement
```env
# Notifications
ENABLE_VENDOR_NOTIFICATIONS=true
WEBSOCKET_ENABLED=true

# Rate limiting
ADMIN_RATE_LIMIT_REQUESTS=100
ADMIN_RATE_LIMIT_WINDOW=900000  # 15 minutes
```

### Configuration nginx (si applicable)
```nginx
location /admin/pending-products {
    proxy_pass http://backend;
    proxy_set_header Authorization $http_authorization;
    client_max_body_size 10M;
}
```

---

## 📞 Contact Frontend

Une fois ces endpoints implémentés, le frontend est prêt à consommer les données réelles. Aucune modification frontend supplémentaire n'est requise.