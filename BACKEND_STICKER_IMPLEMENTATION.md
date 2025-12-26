# Guide d'implémentation Backend - Système de Vente de Stickers

## 📋 Vue d'ensemble

Ce document décrit l'implémentation backend nécessaire pour permettre aux vendeurs de créer et vendre des stickers personnalisés avec leurs designs.

## 🗄️ Schéma de base de données

### 1. Nouvelle table `sticker_products`

```sql
CREATE TABLE sticker_products (
  id SERIAL PRIMARY KEY,

  -- Références
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  design_id INTEGER NOT NULL REFERENCES vendor_designs(id) ON DELETE CASCADE,

  -- Informations du produit
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE, -- Code produit unique

  -- Configuration du sticker
  size_id VARCHAR(50) NOT NULL, -- 'small', 'medium', 'large', 'xlarge', 'custom'
  width_cm DECIMAL(10, 2) NOT NULL, -- Largeur en cm
  height_cm DECIMAL(10, 2) NOT NULL, -- Hauteur en cm

  finish VARCHAR(50) NOT NULL, -- 'matte', 'glossy', 'transparent', 'holographic', 'metallic'
  shape VARCHAR(50) NOT NULL, -- 'square', 'circle', 'rectangle', 'die-cut'

  -- Prix et stock
  base_price DECIMAL(10, 2) NOT NULL, -- Prix de base avant finition
  finish_multiplier DECIMAL(3, 2) DEFAULT 1.00, -- Multiplicateur de finition
  final_price DECIMAL(10, 2) NOT NULL, -- Prix final (calculé)
  minimum_quantity INTEGER DEFAULT 1, -- Quantité minimum par commande
  stock_quantity INTEGER DEFAULT 0, -- Stock disponible

  -- Métadonnées
  status VARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  sale_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,

  -- Index
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_design_id (design_id),
  INDEX idx_status (status),
  INDEX idx_size (size_id),
  INDEX idx_finish (finish),

  -- Contraintes
  CONSTRAINT chk_dimensions CHECK (width_cm > 0 AND height_cm > 0),
  CONSTRAINT chk_price CHECK (base_price >= 0 AND final_price >= 0),
  CONSTRAINT chk_quantity CHECK (minimum_quantity > 0 AND stock_quantity >= 0)
);
```

### 2. Table `sticker_sizes` (Configuration des tailles)

```sql
CREATE TABLE sticker_sizes (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  width_cm DECIMAL(10, 2) NOT NULL,
  height_cm DECIMAL(10, 2) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_size_dimensions CHECK (width_cm > 0 AND height_cm > 0),
  CONSTRAINT chk_size_price CHECK (base_price >= 0)
);

-- Données initiales
INSERT INTO sticker_sizes (id, name, description, width_cm, height_cm, base_price, display_order) VALUES
('small', 'Petit', '5cm x 5cm - Parfait pour ordinateur portable', 5.00, 5.00, 500.00, 1),
('medium', 'Moyen', '10cm x 10cm - Taille standard polyvalente', 10.00, 10.00, 1000.00, 2),
('large', 'Grand', '15cm x 15cm - Grand format pour décoration', 15.00, 15.00, 1500.00, 3),
('xlarge', 'Très Grand', '20cm x 20cm - Format XXL', 20.00, 20.00, 2500.00, 4);
```

### 3. Table `sticker_finishes` (Configuration des finitions)

```sql
CREATE TABLE sticker_finishes (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_multiplier CHECK (price_multiplier >= 1.00)
);

-- Données initiales
INSERT INTO sticker_finishes (id, name, description, price_multiplier, display_order) VALUES
('matte', 'Mat', 'Finition mate élégante, anti-reflet', 1.00, 1),
('glossy', 'Brillant', 'Finition brillante éclatante', 1.10, 2),
('transparent', 'Transparent', 'Fond transparent, design visible', 1.30, 3),
('holographic', 'Holographique', 'Effet arc-en-ciel premium', 1.50, 4),
('metallic', 'Métallique', 'Effet métallisé brillant', 1.40, 5);
```

### 4. Table `sticker_order_items` (Items de commande)

```sql
CREATE TABLE sticker_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sticker_product_id INTEGER NOT NULL REFERENCES sticker_products(id),

  -- Détails de la commande
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL, -- Prix unitaire au moment de la commande
  total_price DECIMAL(10, 2) NOT NULL, -- Prix total (quantity * unit_price)

  -- Configuration (snapshot au moment de la commande)
  size_name VARCHAR(100),
  finish_name VARCHAR(100),
  shape_name VARCHAR(100),
  dimensions_cm VARCHAR(50), -- Format: "10x10"

  -- Métadonnées
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_order_id (order_id),
  INDEX idx_sticker_product_id (sticker_product_id),

  CONSTRAINT chk_order_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_price CHECK (unit_price >= 0 AND total_price >= 0)
);
```

## 🔌 API Endpoints

### 1. Création d'un sticker

**POST** `/api/vendor/stickers`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "designId": 123,
  "name": "Sticker Logo Entreprise",
  "description": "Sticker personnalisé avec logo entreprise en haute qualité",
  "size": {
    "id": "medium",
    "width": 10,
    "height": 10
  },
  "finish": "glossy",
  "shape": "die-cut",
  "price": 1100,
  "minimumQuantity": 1,
  "stockQuantity": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sticker créé avec succès",
  "data": {
    "id": 456,
    "vendorId": 789,
    "designId": 123,
    "name": "Sticker Logo Entreprise",
    "sku": "STK-789-123-456",
    "size": {
      "id": "medium",
      "name": "Moyen",
      "width": 10,
      "height": 10
    },
    "finish": "glossy",
    "shape": "die-cut",
    "basePrice": 1000,
    "finishMultiplier": 1.10,
    "finalPrice": 1100,
    "status": "PENDING",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### 2. Liste des stickers du vendeur

**GET** `/api/vendor/stickers`

**Query Parameters:**
- `status` (optional): DRAFT | PENDING | PUBLISHED | REJECTED
- `page` (default: 1)
- `limit` (default: 20)
- `sortBy` (default: created_at): created_at | price | sale_count
- `sortOrder` (default: desc): asc | desc

**Response:**
```json
{
  "success": true,
  "data": {
    "stickers": [
      {
        "id": 456,
        "name": "Sticker Logo Entreprise",
        "designPreview": "https://...",
        "size": "Moyen (10x10cm)",
        "finish": "Brillant",
        "price": 1100,
        "status": "PUBLISHED",
        "saleCount": 15,
        "viewCount": 234,
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 87,
      "itemsPerPage": 20
    }
  }
}
```

### 3. Détails d'un sticker

**GET** `/api/vendor/stickers/:id`
stickers
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "vendor": {
      "id": 789,
      "shopName": "Design Studio",
      "rating": 4.8
    },
    "design": {
      "id": 123,
      "name": "Logo Entreprise",
      "imageUrl": "https://...",
      "category": "LOGO"
    },
    "name": "Sticker Logo Entreprise",
    "description": "Sticker personnalisé...",
    "sku": "STK-789-123-456",
    "configuration": {
      "size": {
        "id": "medium",
        "name": "Moyen",
        "width": 10,
        "height": 10
      },
      "finish": {
        "id": "glossy",
        "name": "Brillant",
        "multiplier": 1.10
      },
      "shape": "die-cut"
    },
    "pricing": {
      "basePrice": 1000,
      "finishMultiplier": 1.10,
      "finalPrice": 1100,
      "currency": "FCFA"
    },
    "stock": {
      "quantity": 100,
      "minimumOrder": 1
    },
    "status": "PUBLISHED",
    "stats": {
      "viewCount": 234,
      "saleCount": 15,
      "favoriteCount": 8
    },
    "createdAt": "2025-01-15T10:30:00Z",
    "publishedAt": "2025-01-15T14:20:00Z"
  }
}
```

### 4. Mise à jour d'un sticker

**PUT** `/api/vendor/stickers/:id`

**Request Body:**
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "price": 1200,
  "stockQuantity": 150,
  "status": "PUBLISHED"
}
```

### 5. Suppression d'un sticker

**DELETE** `/api/vendor/stickers/:id`

**Response:**
```json
{
  "success": true,
  "message": "Sticker supprimé avec succès"
}
```

### 6. Liste publique des stickers

**GET** `/api/public/stickers`

**Query Parameters:**
- `search` (optional): Recherche par nom
- `vendorId` (optional): Filtrer par vendeur
- `size` (optional): Filtrer par taille
- `finish` (optional): Filtrer par finition
- `minPrice` (optional): Prix minimum
- `maxPrice` (optional): Prix maximum
- `page` (default: 1)
- `limit` (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "stickers": [...],
    "filters": {
      "sizes": [...],
      "finishes": [...],
      "priceRange": { "min": 500, "max": 5000 }
    },
    "pagination": {...}
  }
}
```

### 7. Obtenir les configurations disponibles

**GET** `/api/public/stickers/configurations`

**Response:**
```json
{
  "success": true,
  "data": {
    "sizes": [
      {
        "id": "small",
        "name": "Petit",
        "description": "5cm x 5cm",
        "width": 5,
        "height": 5,
        "basePrice": 500
      }
    ],
    "finishes": [
      {
        "id": "matte",
        "name": "Mat",
        "description": "Finition mate élégante",
        "priceMultiplier": 1.00
      }
    ],
    "shapes": [
      {
        "id": "square",
        "name": "Carré",
        "description": "Forme carrée classique"
      }
    ]
  }
}
```

## 🔧 Logique métier

### 1. Calcul du prix

```typescript
// Pseudo-code
function calculateStickerPrice(
  basePrice: number,
  finishMultiplier: number,
  quantity: number
): number {
  return basePrice * finishMultiplier * quantity;
}
```

### 2. Génération du SKU

```typescript
// Format: STK-{vendorId}-{designId}-{productId}
function generateSKU(vendorId: number, designId: number, productId: number): string {
  return `STK-${vendorId}-${designId}-${productId}`;
}
```

### 3. Validation de création

```typescript
interface ValidationRules {
  // Le design doit appartenir au vendeur
  designOwnership: boolean;

  // Le design doit être validé
  designValidated: boolean;

  // Dimensions valides
  validDimensions: boolean;

  // Prix minimum respecté
  minimumPrice: boolean; // >= 500 FCFA

  // Stock minimum
  minimumStock: boolean; // >= 0
}
```

### 4. Workflow de validation

```
1. DRAFT (Brouillon)
   ↓
2. PENDING (En attente de validation admin)
   ↓
3. PUBLISHED (Publié et visible) OU REJECTED (Rejeté)
```

## 🔐 Permissions et sécurité

### 1. Middlewares requis

```typescript
// Vérification que l'utilisateur est un vendeur
checkVendorRole()

// Vérification de la propriété du sticker
checkStickerOwnership(stickerId: number)

// Vérification de la propriété du design
checkDesignOwnership(designId: number)

// Limitation du taux de création
rateLimitStickerCreation() // Max 10 stickers/heure
```

### 2. Validations

```typescript
// Validation des dimensions
- width_cm: 1-50 cm
- height_cm: 1-50 cm

// Validation du prix
- basePrice: >= 500 FCFA
- finalPrice: >= 500 FCFA

// Validation de la quantité
- minimumQuantity: >= 1
- stockQuantity: >= 0

// Validation du nom
- length: 3-255 caractères
- pas de caractères spéciaux interdits

// Validation de la description
- length: 10-2000 caractères
- pas de contenu auto-généré
```

## 📊 Analytics et statistiques

### 1. Métriques à tracker

```sql
-- Table analytics_sticker_views
CREATE TABLE analytics_sticker_views (
  id SERIAL PRIMARY KEY,
  sticker_id INTEGER NOT NULL REFERENCES sticker_products(id),
  user_id INTEGER REFERENCES users(id), -- NULL si anonyme
  session_id VARCHAR(255),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_sticker_id (sticker_id),
  INDEX idx_viewed_at (viewed_at)
);

-- Table analytics_sticker_favorites
CREATE TABLE analytics_sticker_favorites (
  id SERIAL PRIMARY KEY,
  sticker_id INTEGER NOT NULL REFERENCES sticker_products(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_favorite (sticker_id, user_id),
  INDEX idx_sticker_id (sticker_id),
  INDEX idx_user_id (user_id)
);
```

### 2. Endpoints analytics

**GET** `/api/vendor/stickers/:id/analytics`

**Response:**
```json
{
  "success": true,
  "data": {
    "views": {
      "total": 234,
      "last7Days": 45,
      "last30Days": 189
    },
    "sales": {
      "total": 15,
      "totalRevenue": 16500,
      "last7Days": 3,
      "last30Days": 12
    },
    "favorites": {
      "total": 8
    },
    "conversionRate": 6.41 // (sales / views) * 100
  }
}
```

## 🎯 Intégration avec le système existant

### 1. Liaison avec les commandes

```typescript
// Lors de la création d'une commande
interface OrderItem {
  type: 'PRODUCT' | 'STICKER';
  productId?: number; // Si type = PRODUCT
  stickerId?: number; // Si type = STICKER
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

### 2. Commission vendeur

```typescript
// Utiliser le même système de commission que les produits
interface VendorCommission {
  stickerSaleId: number;
  vendorId: number;
  grossAmount: number; // Prix total
  commissionRate: number; // Ex: 0.15 (15%)
  commissionAmount: number;
  netAmount: number; // Montant pour le vendeur
}
```

### 3. Notifications

```typescript
// Événements à notifier
enum StickerEvent {
  CREATED = 'sticker.created',
  VALIDATED = 'sticker.validated',
  REJECTED = 'sticker.rejected',
  SOLD = 'sticker.sold',
  OUT_OF_STOCK = 'sticker.out_of_stock'
}
```

## 📝 Migration

```sql
-- Script de migration
START TRANSACTION;

-- Créer les tables dans l'ordre
CREATE TABLE sticker_sizes (...);
CREATE TABLE sticker_finishes (...);
CREATE TABLE sticker_products (...);
CREATE TABLE sticker_order_items (...);
CREATE TABLE analytics_sticker_views (...);
CREATE TABLE analytics_sticker_favorites (...);

-- Insérer les données de configuration
INSERT INTO sticker_sizes (...);
INSERT INTO sticker_finishes (...);

-- Créer les index
CREATE INDEX idx_vendor_stickers ON sticker_products(vendor_id, status);
CREATE INDEX idx_published_stickers ON sticker_products(status, published_at);

COMMIT;
```

## 🧪 Tests à implémenter

### 1. Tests unitaires

```typescript
describe('Sticker Creation', () => {
  test('should create sticker with valid data')
  test('should reject sticker with invalid dimensions')
  test('should reject sticker with price below minimum')
  test('should calculate correct final price')
  test('should generate unique SKU')
});

describe('Sticker Permissions', () => {
  test('should allow vendor to create sticker with own design')
  test('should reject sticker with another vendor design')
  test('should allow vendor to update own sticker')
  test('should reject update of other vendor sticker')
});
```

### 2. Tests d'intégration

```typescript
describe('Sticker Purchase Flow', () => {
  test('should add sticker to cart')
  test('should create order with sticker items')
  test('should decrease stock after purchase')
  test('should calculate vendor commission')
});
```

## 📚 Documentation complémentaire

### Exemples de requêtes cURL

```bash
# Créer un sticker
curl -X POST http://localhost:3004/api/vendor/stickers \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 123,
    "name": "Mon Sticker",
    "size": {"id": "medium", "width": 10, "height": 10},
    "finish": "glossy",
    "shape": "die-cut",
    "price": 1100
  }'

# Lister les stickers
curl -X GET "http://localhost:3004/api/vendor/stickers?status=PUBLISHED&page=1" \
  -H "Authorization: Bearer {token}"

# Obtenir les configurations
curl -X GET "http://localhost:3004/api/public/stickers/configurations"
```

## ✅ Checklist d'implémentation

- [ ] Créer les tables de base de données
- [ ] Implémenter les endpoints API vendeur
- [ ] Implémenter les endpoints API publics
- [ ] Ajouter les middlewares de sécurité
- [ ] Implémenter le système de validation
- [ ] Intégrer avec le système de commandes
- [ ] Implémenter le système de commission
- [ ] Ajouter les analytics et métriques
- [ ] Créer les tests unitaires
- [ ] Créer les tests d'intégration
- [ ] Documenter l'API (Swagger/OpenAPI)
- [ ] Tester en environnement de staging
- [ ] Déployer en production

## 🚀 Points d'attention

1. **Performance**: Indexer correctement les colonnes fréquemment recherchées
2. **Scalabilité**: Prévoir la gestion de milliers de stickers
3. **Sécurité**: Valider toutes les entrées utilisateur
4. **Cohérence**: Utiliser des transactions pour les opérations critiques
5. **Monitoring**: Logger les événements importants
6. **Cache**: Mettre en cache les configurations (tailles, finitions)

## 📞 Support

Pour toute question sur l'implémentation, contacter l'équipe backend.
