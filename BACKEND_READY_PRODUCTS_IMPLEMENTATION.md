# Implémentation Backend - Produits Prêts

## Vue d'ensemble

Ce guide détaille l'implémentation des endpoints backend pour les produits prêts. Ces endpoints permettent aux administrateurs de gérer des produits prêts à l'emploi sans délimitations.

## Endpoints à implémenter

### 1. GET `/products/ready`
**Description**: Lister tous les produits prêts

**Headers requis**:
```
Authorization: Bearer <admin_token>
```

**Query Parameters**:
- `status`: `published` | `draft` | `all` (défaut: `all`)
- `limit`: Nombre de résultats (défaut: 20)
- `offset`: Pagination (défaut: 0)
- `search`: Recherche textuelle

**Réponse**:
```json
{
  "products": [
    {
      "id": 123,
      "name": "T-Shirt Premium Prêt",
      "description": "Un t-shirt premium prêt à l'emploi",
      "price": 2500,
      "stock": 100,
      "status": "PUBLISHED",
      "isReadyProduct": true,
      "categories": [...],
      "sizes": [...],
      "colorVariations": [...],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

### 2. POST `/products/ready`
**Description**: Créer un nouveau produit prêt

**Headers requis**:
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body (multipart/form-data)**:
- `productData`: JSON string contenant les données du produit
- `file_*`: Images du produit

**Exemple de `productData`**:
```json
{
  "name": "T-Shirt Premium Prêt",
  "description": "Un t-shirt premium prêt à l'emploi",
  "price": 2500,
  "stock": 100,
  "status": "draft",
  "categories": ["T-shirts", "Prêt-à-porter"],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [
        {
          "fileId": "front_white",
          "view": "Front"
        },
        {
          "fileId": "back_white",
          "view": "Back"
        }
      ]
    }
  ]
}
```

**Réponse**:
```json
{
  "id": 123,
  "name": "T-Shirt Premium Prêt",
  "description": "Un t-shirt premium prêt à l'emploi",
  "price": 2500,
  "stock": 100,
  "status": "DRAFT",
  "isReadyProduct": true,
  "categories": [...],
  "sizes": [...],
  "colorVariations": [...]
}
```

### 3. GET `/products/ready/:id`
**Description**: Récupérer un produit prêt spécifique

**Headers requis**:
```
Authorization: Bearer <admin_token>
```

**Réponse**:
```json
{
  "id": 123,
  "name": "T-Shirt Premium Prêt",
  "description": "Un t-shirt premium prêt à l'emploi",
  "price": 2500,
  "stock": 100,
  "status": "PUBLISHED",
  "isReadyProduct": true,
  "categories": [...],
  "sizes": [...],
  "colorVariations": [
    {
      "id": 1,
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [
        {
          "id": 1,
          "url": "https://res.cloudinary.com/...",
          "view": "Front",
          "naturalWidth": 800,
          "naturalHeight": 600
        }
      ]
    }
  ]
}
```

### 4. PATCH `/products/ready/:id`
**Description**: Mettre à jour un produit prêt

**Headers requis**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body**:
```json
{
  "name": "T-Shirt Premium Prêt - Mis à jour",
  "description": "Description mise à jour",
  "price": 3000,
  "stock": 150,
  "status": "published",
  "categories": ["T-shirts", "Prêt-à-porter", "Premium"],
  "sizes": ["XS", "S", "M", "L", "XL", "XXL"]
}
```

**Réponse**: Le produit mis à jour

### 5. DELETE `/products/ready/:id`
**Description**: Supprimer un produit prêt

**Headers requis**:
```
Authorization: Bearer <admin_token>
```

**Réponse**: `204 No Content`

## Structure de base de données

### Table `ready_products`
```sql
CREATE TABLE ready_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  is_ready_product BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `ready_product_categories`
```sql
CREATE TABLE ready_product_categories (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES ready_products(id) ON DELETE CASCADE,
  category_name VARCHAR(255) NOT NULL
);
```

### Table `ready_product_sizes`
```sql
CREATE TABLE ready_product_sizes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES ready_products(id) ON DELETE CASCADE,
  size_name VARCHAR(50) NOT NULL
);
```

### Table `ready_color_variations`
```sql
CREATE TABLE ready_color_variations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES ready_products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color_code VARCHAR(7) NOT NULL
);
```

### Table `ready_product_images`
```sql
CREATE TABLE ready_product_images (
  id SERIAL PRIMARY KEY,
  color_variation_id INTEGER REFERENCES ready_color_variations(id) ON DELETE CASCADE,
  view VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  public_id VARCHAR(255),
  natural_width INTEGER,
  natural_height INTEGER
);
```

## Validation des données

### CreateReadyProductDto
```typescript
{
  name: string;                    // Nom du produit (2-255 caractères)
  description: string;             // Description (10-5000 caractères)
  price: number;                   // Prix (positif)
  stock?: number;                  // Stock (optionnel, défaut: 0)
  status?: 'published' | 'draft';  // Statut (optionnel, défaut: 'draft')
  categories: string[];            // Catégories (au moins 1)
  sizes?: string[];                // Tailles (optionnel)
  colorVariations: ReadyColorVariationDto[];
}
```

### ReadyColorVariationDto
```typescript
{
  name: string;                    // Nom de la couleur (1-100 caractères)
  colorCode: string;               // Code hexadécimal (#RRGGBB)
  images: ReadyProductImageDto[];
}
```

### ReadyProductImageDto
```typescript
{
  fileId: string;                  // Identifiant unique du fichier
  view: 'Front' | 'Back' | 'Left' | 'Right' | 'Top' | 'Bottom' | 'Detail';
}
```

## Sécurité et permissions

### Middleware d'authentification
```javascript
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Seuls les administrateurs peuvent accéder aux produits prêts.'
    });
  }
  next();
};
```

### Validation des fichiers
```javascript
const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Type de fichier non supporté');
  }

  if (file.size > maxSize) {
    throw new Error('Fichier trop volumineux (max 5MB)');
  }
};
```

## Exemple d'implémentation (Express.js)

### Route principale
```javascript
const express = require('express');
const multer = require('multer');
const router = express.Router();

// Middleware pour upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// GET /products/ready
router.get('/products/ready', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0, search } = req.query;
    
    let query = 'SELECT * FROM ready_products WHERE is_ready_product = true';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = $1';
      params.push(status.toUpperCase());
    }

    if (search) {
      query += ' AND (name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    
    res.json({
      products: result.rows,
      total: result.rowCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: result.rowCount === parseInt(limit)
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /products/ready
router.post('/products/ready', requireAuth, requireAdmin, upload.any(), async (req, res) => {
  try {
    const productData = JSON.parse(req.body.productData);
    
    // Validation des données
    validateReadyProductData(productData);
    
    // Upload des images vers Cloudinary
    const uploadedImages = await uploadImagesToCloudinary(req.files);
    
    // Création du produit en base
    const product = await createReadyProduct(productData, uploadedImages);
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ message: error.message });
  }
});

// Autres routes...
```

## Tests

### Script de test
```bash
node test-ready-products.js
```

### Tests à implémenter
1. **Création de produit prêt**
2. **Validation des données**
3. **Upload d'images**
4. **Gestion des erreurs**
5. **Permissions admin**

## Déploiement

### Variables d'environnement
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Migration de base de données
```sql
-- Créer les tables pour les produits prêts
-- Voir structure ci-dessus
```

## Notes importantes

1. **Isolation**: Les produits prêts sont complètement séparés des produits mockup
2. **Performance**: Ajouter des index sur `is_ready_product` et `status`
3. **Sécurité**: Validation stricte des permissions admin
4. **Images**: Gestion optimisée avec Cloudinary
5. **Validation**: Validation côté client et serveur

## Support

Pour toute question sur l'implémentation :
1. Vérifier les logs serveur
2. Tester avec le script de test
3. Contacter l'équipe de développement 