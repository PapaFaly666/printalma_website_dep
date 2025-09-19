# 🚀 GUIDE BACKEND - Workflow de Création de Produits Vendeur

## 📋 Vue d'ensemble

Ce guide détaille les exigences backend pour le nouveau workflow de création de produits vendeur multi-étapes. Le système permet aux vendeurs de créer des produits basés sur des mockups admin avec un contrôle strict des marges et commissions.

---

## 🗃️ STRUCTURE DE BASE DE DONNÉES

### 1. **Table `products` (Mockups Admin)**
```sql
-- Cette table contient les mockups créés par l'admin
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) NOT NULL DEFAULT 0; -- Prix de revient
ALTER TABLE products ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2); -- Prix suggéré pour la vente
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_ready_product BOOLEAN DEFAULT false; -- false = mockup, true = produit prêt
ALTER TABLE products ADD COLUMN IF NOT EXISTS admin_created BOOLEAN DEFAULT true; -- Créé par admin
```

### 2. **Table `vendor_products` (Produits Vendeurs)**
```sql
CREATE TABLE IF NOT EXISTS vendor_products (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Informations vendeur
  vendor_name VARCHAR(255) NOT NULL, -- Nom personnalisé par le vendeur
  vendor_description TEXT, -- Description personnalisée
  vendor_price DECIMAL(10,2) NOT NULL, -- Prix de vente final
  vendor_stock INTEGER DEFAULT 0,

  -- Calculs automatiques
  base_cost DECIMAL(10,2) NOT NULL, -- Prix de revient du mockup (copié depuis products.base_price)
  vendor_profit DECIMAL(10,2) NOT NULL, -- Bénéfice vendeur (vendor_price - base_cost)
  vendor_revenue DECIMAL(10,2) NOT NULL, -- Revenu vendeur après commission (vendor_profit * 0.7)
  platform_commission DECIMAL(10,2) NOT NULL, -- Commission plateforme (vendor_profit * 0.3)

  -- Sélections vendeur
  selected_colors JSONB, -- Couleurs choisies du mockup
  selected_sizes JSONB, -- Tailles choisies du mockup
  design_category_id BIGINT REFERENCES design_categories(id), -- Thème choisi

  -- Statuts et métadonnées
  status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, REJECTED, SUSPENDED
  validation_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_base_product_id ON vendor_products(base_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_status ON vendor_products(status);
CREATE INDEX IF NOT EXISTS idx_vendor_products_validation_status ON vendor_products(validation_status);
```

### 3. **Table `vendor_product_images` (Images vendeur)**
```sql
CREATE TABLE IF NOT EXISTS vendor_product_images (
  id BIGSERIAL PRIMARY KEY,
  vendor_product_id BIGINT NOT NULL REFERENCES vendor_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 0,
  column_index INTEGER DEFAULT 0, -- 0-3 pour les 4 colonnes max

  -- NOUVEAUX CHAMPS pour distinction base/détail
  is_base_image BOOLEAN DEFAULT false, -- true pour l'image principale (première uploadée)
  image_type VARCHAR(20) DEFAULT 'detail', -- 'base' pour l'image principale, 'detail' pour les autres
  original_name VARCHAR(255), -- Nom original du fichier uploadé

  file_size BIGINT,
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_product_images_vendor_product_id ON vendor_product_images(vendor_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_images_base ON vendor_product_images(is_base_image);
CREATE INDEX IF NOT EXISTS idx_vendor_product_images_type ON vendor_product_images(image_type);
```

### 4. **Mise à jour Table `design_categories`**
```sql
-- S'assurer que la table design_categories existe avec les bons champs
ALTER TABLE design_categories ADD COLUMN IF NOT EXISTS cover_image_url TEXT; -- Image de couverture pour les thèmes
ALTER TABLE design_categories ADD COLUMN IF NOT EXISTS design_count INTEGER DEFAULT 0; -- Nombre de designs dans cette catégorie
```

---

## 🔌 ENDPOINTS REQUIS

### 1. **GET `/api/products?isReadyProduct=false`**
```typescript
// Récupérer tous les mockups disponibles pour les vendeurs
Response: {
  success: true,
  data: [
    {
      id: number,
      name: string,
      description: string,
      price: number, // Prix de revient (base_price)
      suggestedPrice: number, // Prix suggéré (suggested_price)
      genre: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE',
      categories: [{ id: number, name: string }],
      colorVariations: [
        {
          id: number,
          name: string,
          colorCode: string,
          images: [
            {
              id: number,
              url: string,
              viewType: string
            }
          ]
        }
      ],
      sizes: [
        {
          id: number,
          sizeName: string
        }
      ]
    }
  ]
}
```

### 2. **GET `/api/design-categories/active`**
```typescript
// Récupérer les catégories de design actives (utilisées comme "thèmes")
Response: [
  {
    id: number,
    name: string,
    description: string,
    slug: string,
    icon: string,
    color: string, // Couleur hex pour l'affichage
    coverImageUrl: string, // Image de couverture
    isActive: boolean,
    sortOrder: number,
    designCount: number, // Nombre de designs dans cette catégorie
    createdAt: string,
    updatedAt: string
  }
]
```

### 3. **POST `/api/vendor/products`**
```typescript
// Créer un nouveau produit vendeur
Request: {
  baseProductId: number, // ID du mockup sélectionné
  vendorName: string, // Nom personnalisé
  vendorDescription: string,
  vendorPrice: number, // Prix de vente (en centimes)
  vendorStock: number,
  selectedColors: [
    {
      id: number,
      name: string,
      colorCode: string
    }
  ],
  selectedSizes: [
    {
      id: number,
      sizeName: string
    }
  ],
  designCategoryId: number, // ID du thème sélectionné
  productImages: File[], // Images uploadées
  postValidationAction: 'TO_DRAFT' | 'TO_PUBLISHED'
}

// VALIDATION BACKEND OBLIGATOIRE:
// 1. Vérifier que vendorPrice >= baseProduct.base_price * 1.1 (marge 10% minimum)
// 2. Calculer automatiquement:
//    - base_cost = baseProduct.base_price
//    - vendor_profit = vendorPrice - base_cost
//    - vendor_revenue = vendor_profit * 0.7
//    - platform_commission = vendor_profit * 0.3

Response: {
  success: true,
  data: {
    id: number,
    vendorId: number,
    baseProductId: number,
    vendorName: string,
    vendorDescription: string,
    vendorPrice: number,
    baseCost: number,
    vendorProfit: number,
    vendorRevenue: number,
    platformCommission: number,
    status: string,
    validationStatus: string,
    selectedColors: object,
    selectedSizes: object,
    designCategoryId: number,
    images: [
      {
        id: number,
        imageUrl: string,
        imageOrder: number,
        columnIndex: number,
        isBaseImage: boolean, // true pour l'image principale
        imageType: 'base' | 'detail', // Type d'image
        originalName: string // Nom original du fichier
      }
    ],
    createdAt: string,
    updatedAt: string
  },
  message: "Produit créé avec succès"
}
```

### 4. **GET `/api/vendor/products`**
```typescript
// Récupérer tous les produits du vendeur connecté
Response: {
  success: true,
  data: [
    {
      id: number,
      vendorName: string,
      vendorPrice: number,
      baseCost: number,
      vendorProfit: number,
      vendorRevenue: number,
      status: string,
      validationStatus: string,
      baseProduct: {
        id: number,
        name: string,
        imageUrl: string
      },
      designCategory: {
        id: number,
        name: string,
        color: string
      },
      images: [{ imageUrl: string }],
      createdAt: string
    }
  ]
}
```

---

## ⚖️ RÈGLES DE VALIDATION BACKEND

### 1. **Validation des Prix**
```typescript
// OBLIGATOIRE: Vérifier la marge minimale de 10%
const minimumPrice = baseProduct.base_price * 1.1;
if (vendorPrice < minimumPrice) {
  throw new Error(`Prix minimum autorisé: ${minimumPrice} FCFA (prix de revient + 10%)`);
}
```

### 2. **Calculs Automatiques**
```typescript
// Toujours calculer automatiquement côté backend
const baseCost = baseProduct.base_price;
const vendorProfit = vendorPrice - baseCost;
const vendorRevenue = Math.round(vendorProfit * 0.7); // 70% au vendeur
const platformCommission = Math.round(vendorProfit * 0.3); // 30% à la plateforme
```

### 3. **Validation des Sélections**
```typescript
// Vérifier que les couleurs sélectionnées appartiennent au mockup
const validColors = baseProduct.colorVariations.map(c => c.id);
const invalidColors = selectedColors.filter(c => !validColors.includes(c.id));
if (invalidColors.length > 0) {
  throw new Error('Couleurs sélectionnées invalides');
}

// Même validation pour les tailles
const validSizes = baseProduct.sizes.map(s => s.id);
const invalidSizes = selectedSizes.filter(s => !validSizes.includes(s.id));
if (invalidSizes.length > 0) {
  throw new Error('Tailles sélectionnées invalides');
}
```

### 4. **Validation des Images**
```typescript
// Maximum 16 images (4 colonnes x 4 images max par colonne)
if (productImages.length > 16) {
  throw new Error('Maximum 16 images autorisées');
}

// Types de fichiers autorisés
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const invalidFiles = productImages.filter(file => !allowedTypes.includes(file.type));
if (invalidFiles.length > 0) {
  throw new Error('Types de fichiers non autorisés');
}

// Taille maximale 5MB par image
const oversizedFiles = productImages.filter(file => file.size > 5 * 1024 * 1024);
if (oversizedFiles.length > 0) {
  throw new Error('Images trop volumineuses (max 5MB)');
}
```

---

## 🔐 SÉCURITÉ ET PERMISSIONS

### 1. **Authentification Requise**
- Tous les endpoints vendeur nécessitent une authentification
- Vérifier que l'utilisateur a le rôle `VENDEUR` ou `ADMIN`

### 2. **Isolation des Données**
- Un vendeur ne peut voir que ses propres produits
- Les admins peuvent voir tous les produits vendeur

### 3. **Validation des Droits**
```typescript
// Vérifier que le vendeur peut modifier ce produit
if (vendorProduct.vendorId !== currentUser.id && currentUser.role !== 'ADMIN') {
  throw new Error('Accès refusé');
}
```

---

## 📊 MÉTRIQUES ET ANALYTICS

### 1. **Champs à Tracker**
- Nombre de produits créés par vendeur
- Revenus générés par vendeur
- Commissions perçues par la plateforme
- Mockups les plus utilisés
- Catégories de design les plus populaires

### 2. **Endpoints Analytics** (Optionnel)
```typescript
GET /api/admin/vendor-products/stats
GET /api/vendor/my-stats
```

---

## 🚀 MIGRATION ET DÉPLOIEMENT

### 1. **Script de Migration**
```sql
-- Migration pour ajouter les nouveaux champs
BEGIN;

-- Ajouter les colonnes manquantes à products
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2);
UPDATE products SET base_price = price WHERE base_price = 0;

-- Créer les nouvelles tables
-- (Insérer ici les CREATE TABLE ci-dessus)

COMMIT;
```

### 2. **Population des Données**
```sql
-- Mettre à jour le nombre de designs par catégorie
UPDATE design_categories
SET design_count = (
  SELECT COUNT(*)
  FROM designs
  WHERE category_id = design_categories.id
);
```

---

## 🧪 TESTS À EFFECTUER

### 1. **Tests Unitaires**
- Validation des prix (marge 10%)
- Calculs des commissions
- Validation des sélections couleurs/tailles

### 2. **Tests d'Intégration**
- Workflow complet de création
- Upload d'images
- Récupération des données

### 3. **Tests de Performance**
- Chargement des mockups avec images
- Création de produits avec multiples images
- Requêtes analytics

---

## 📋 CHECKLIST DE VALIDATION

- [ ] Tables créées avec tous les champs requis
- [ ] Index de performance ajoutés
- [ ] Endpoints implémentés avec validation
- [ ] Règles de marge 10% appliquées
- [ ] Calculs de commission automatiques
- [ ] Gestion d'erreurs appropriée
- [ ] Authentification et permissions
- [ ] Tests unitaires passés
- [ ] Tests d'intégration validés
- [ ] Documentation API mise à jour

---

## 🆘 SUPPORT ET DEBUGGING

### Logs à Activer
```typescript
// Logger les créations de produits
console.log('Vendor Product Creation:', {
  vendorId,
  baseProductId,
  vendorPrice,
  calculatedProfit,
  calculatedRevenue
});
```

### Points de Contrôle
1. Vérifier que `base_price` est bien défini sur les mockups
2. S'assurer que les calculs de commission sont corrects
3. Valider que les images s'uploadent dans le bon dossier
4. Contrôler les permissions vendeur

---

**🎯 Objectif:** Ce système doit garantir que les vendeurs créent des produits rentables tout en respectant les contraintes des mockups admin, avec une expérience utilisateur fluide et des calculs financiers précis.