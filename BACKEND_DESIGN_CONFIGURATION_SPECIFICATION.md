# Spécifications Backend - Configuration des Designs

## 📋 Vue d'ensemble

Ce document spécifie les modifications backend nécessaires pour implémenter la fonctionnalité de configuration des designs avec nom, description et prix avant validation dans les pages :
- `/vendre-design` (SellDesignPage) - Pour appliquer des designs aux produits
- `/vendeur/designs` (VendorDesignsPage) - Pour gérer le catalogue de designs

## 🎯 Objectifs

1. **Configuration complète des designs** : Nom, description, prix obligatoires avant création
2. **Validation des données** : Contrôles côté serveur pour assurer la cohérence
3. **Gestion des prix** : Prix minimum, validation des montants
4. **Persistance des informations** : Stockage des métadonnées des designs

---

## 📊 Modifications de la Base de Données

### 1. Table `designs` (création ou modification)

```sql
CREATE TABLE designs (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 100), -- Prix en FCFA
  category VARCHAR(50) NOT NULL DEFAULT 'illustration',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER,
  dimensions JSONB, -- {width: number, height: number}
  is_published BOOLEAN DEFAULT FALSE,
  is_pending BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT TRUE,
  tags TEXT[], -- Array de tags
  usage_count INTEGER DEFAULT 0,
  earnings INTEGER DEFAULT 0, -- Gains totaux en FCFA
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_designs_vendor_id ON designs(vendor_id);
CREATE INDEX idx_designs_published ON designs(is_published);
CREATE INDEX idx_designs_category ON designs(category);
```

### 2. Contraintes et validations

```sql
-- Contrainte pour les catégories valides
ALTER TABLE designs ADD CONSTRAINT check_category 
CHECK (category IN ('logo', 'pattern', 'illustration', 'typography', 'abstract'));

-- Contrainte pour le prix minimum
ALTER TABLE designs ADD CONSTRAINT check_price_minimum 
CHECK (price >= 100);

-- Contrainte pour le nom non vide
ALTER TABLE designs ADD CONSTRAINT check_name_not_empty 
CHECK (LENGTH(TRIM(name)) >= 3);
```

---

## 🔧 API Endpoints à Créer/Modifier

### 1. POST `/api/designs` - Création d'un design

**Headers requis :**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (FormData) :**
```typescript
{
  file: File,           // Fichier image du design
  name: string,         // Nom du design (requis, min 3 caractères)
  description?: string, // Description (optionnel)
  price: number,        // Prix en FCFA (requis, min 100)
  category: string      // Catégorie (requis)
}
```

**Validation côté serveur :**
```javascript
const validationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 255,
    trim: true
  },
  description: {
    required: false,
    maxLength: 1000,
    trim: true
  },
  price: {
    required: true,
    type: 'number',
    min: 100,
    max: 1000000
  },
  category: {
    required: true,
    enum: ['logo', 'pattern', 'illustration', 'typography', 'abstract']
  },
  file: {
    required: true,
    types: ['image/jpeg', 'image/png', 'image/svg+xml'],
    maxSize: 10 * 1024 * 1024 // 10MB
  }
};
```

**Réponse de succès (201) :**
```json
{
  "success": true,
  "message": "Design créé avec succès",
  "data": {
    "id": 123,
    "name": "Logo moderne",
    "description": "Un logo épuré pour entreprises",
    "price": 2500,
    "category": "logo",
    "imageUrl": "https://cdn.example.com/designs/123.jpg",
    "thumbnailUrl": "https://cdn.example.com/designs/123_thumb.jpg",
    "fileSize": 1024000,
    "dimensions": {
      "width": 2000,
      "height": 2000
    },
    "isPublished": false,
    "isPending": false,
    "isDraft": true,
    "tags": [],
    "usageCount": 0,
    "earnings": 0,
    "views": 0,
    "likes": 0,
    "createdAt": "2024-01-20T10:30:00Z",
    "updatedAt": "2024-01-20T10:30:00Z",
    "publishedAt": null
  }
}
```

**Réponses d'erreur :**
```json
// 400 - Validation failed
{
  "success": false,
  "message": "Erreurs de validation",
  "errors": {
    "name": "Le nom doit contenir au moins 3 caractères",
    "price": "Le prix minimum est de 100 FCFA",
    "file": "Le fichier doit être une image (JPG, PNG, SVG)"
  }
}

// 413 - File too large
{
  "success": false,
  "message": "Le fichier est trop volumineux (max 10MB)"
}

// 401 - Unauthorized
{
  "success": false,
  "message": "Token d'authentification requis"
}
```

### 2. GET `/api/designs` - Liste des designs du vendeur

**Headers requis :**
```
Authorization: Bearer <jwt_token>
```

**Query parameters :**
```
?page=1&limit=20&category=logo&status=published&search=moderne
```

**Réponse de succès (200) :**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 123,
        "name": "Logo moderne",
        "description": "Un logo épuré",
        "price": 2500,
        "category": "logo",
        "imageUrl": "https://cdn.example.com/designs/123.jpg",
        "thumbnailUrl": "https://cdn.example.com/designs/123_thumb.jpg",
        "isPublished": true,
        "isPending": false,
        "isDraft": false,
        "usageCount": 15,
        "earnings": 37500,
        "views": 245,
        "likes": 18,
        "createdAt": "2024-01-15T10:30:00Z",
        "publishedAt": "2024-01-15T14:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 89,
      "itemsPerPage": 20
    },
    "stats": {
      "total": 89,
      "published": 45,
      "pending": 12,
      "draft": 32,
      "totalEarnings": 125000,
      "totalViews": 15430,
      "totalLikes": 892
    }
  }
}
```

### 3. PUT `/api/designs/:id` - Modification d'un design

**Headers requis :**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body :**
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "price": 3000,
  "category": "pattern"
}
```

### 4. PATCH `/api/designs/:id/publish` - Publication/dépublication

**Headers requis :**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body :**
```json
{
  "isPublished": true
}
```

### 5. DELETE `/api/designs/:id` - Suppression d'un design

**Headers requis :**
```
Authorization: Bearer <jwt_token>
```

**Réponse de succès (200) :**
```json
{
  "success": true,
  "message": "Design supprimé avec succès"
}
```

---

## 🔐 Sécurité et Autorisations

### 1. Authentification
- Tous les endpoints nécessitent un JWT token valide
- Le token doit contenir l'ID du vendeur et son rôle

### 2. Autorisations
- Un vendeur ne peut voir/modifier que ses propres designs
- Vérification : `design.vendor_id === user.id`

### 3. Validation des fichiers
```javascript
const allowedMimeTypes = [
  'image/jpeg',
  'image/png', 
  'image/svg+xml'
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

function validateFile(file) {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Format de fichier non supporté');
  }
  
  if (file.size > maxFileSize) {
    throw new Error('Fichier trop volumineux');
  }
}
```

### 4. Nettoyage des données
```javascript
function sanitizeDesignData(data) {
  return {
    name: data.name?.trim(),
    description: data.description?.trim() || null,
    price: parseInt(data.price),
    category: data.category?.toLowerCase()
  };
}
```

---

## 🗄️ Traitement des Images

### 1. Upload et stockage
```javascript
// Exemple avec Cloudinary ou AWS S3
async function processDesignImage(file, designId) {
  // Upload de l'image originale
  const originalUpload = await cloudinary.uploader.upload(file.path, {
    folder: `designs/${designId}`,
    public_id: `original_${designId}`,
    resource_type: 'image'
  });
  
  // Génération de la miniature
  const thumbnailUpload = await cloudinary.uploader.upload(file.path, {
    folder: `designs/${designId}`,
    public_id: `thumb_${designId}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
  
  return {
    imageUrl: originalUpload.secure_url,
    thumbnailUrl: thumbnailUpload.secure_url,
    dimensions: {
      width: originalUpload.width,
      height: originalUpload.height
    }
  };
}
```

### 2. Extraction des métadonnées
```javascript
const sharp = require('sharp');

async function extractImageMetadata(filePath) {
  const metadata = await sharp(filePath).metadata();
  
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size
  };
}
```

---

## 📈 Gestion des Statistiques

### 1. Mise à jour des vues
```sql
-- Trigger pour incrémenter les vues
UPDATE designs 
SET views = views + 1, updated_at = CURRENT_TIMESTAMP 
WHERE id = $1;
```

### 2. Calcul des gains
```sql
-- Mise à jour des gains lors d'une vente
UPDATE designs 
SET earnings = earnings + $2, usage_count = usage_count + 1
WHERE id = $1;
```

---

## 🚀 Intégration Frontend

### 1. Service API côté frontend
```typescript
// services/designService.ts
export class DesignService {
  static async createDesign(formData: FormData): Promise<ApiResponse<Design>> {
    const response = await fetch('/api/designs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });
    
    return response.json();
  }
  
  static async getDesigns(params?: DesignFilters): Promise<ApiResponse<DesignList>> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/api/designs?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    return response.json();
  }
}

interface DesignFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
}
```

### 2. Types TypeScript
```typescript
interface Design {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: DesignCategory;
  imageUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  isPublished: boolean;
  isPending: boolean;
  isDraft: boolean;
  tags: string[];
  usageCount: number;
  earnings: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

type DesignCategory = 'logo' | 'pattern' | 'illustration' | 'typography' | 'abstract';
```

---

## ⚠️ Gestion des Erreurs

### 1. Codes d'erreur spécifiques
```javascript
const ERROR_CODES = {
  DESIGN_NOT_FOUND: 'DESIGN_NOT_FOUND',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  PRICE_TOO_LOW: 'PRICE_TOO_LOW',
  NAME_TOO_SHORT: 'NAME_TOO_SHORT',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS'
};
```

### 2. Messages d'erreur internationalisés
```javascript
const ERROR_MESSAGES = {
  fr: {
    DESIGN_NOT_FOUND: 'Design non trouvé',
    INVALID_FILE_FORMAT: 'Format de fichier non supporté',
    FILE_TOO_LARGE: 'Fichier trop volumineux (max 10MB)',
    PRICE_TOO_LOW: 'Le prix minimum est de 100 FCFA',
    NAME_TOO_SHORT: 'Le nom doit contenir au moins 3 caractères'
  }
};
```

---

## 🧪 Tests à Implémenter

### 1. Tests unitaires
```javascript
describe('Design Creation', () => {
  test('should create design with valid data', async () => {
    const designData = {
      name: 'Test Design',
      description: 'Test description',
      price: 1500,
      category: 'logo'
    };
    
    const result = await createDesign(designData, mockFile);
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Test Design');
  });
  
  test('should reject design with invalid price', async () => {
    const designData = {
      name: 'Test Design',
      price: 50 // Too low
    };
    
    await expect(createDesign(designData, mockFile))
      .rejects.toThrow('Le prix minimum est de 100 FCFA');
  });
});
```

### 2. Tests d'intégration
```javascript
describe('Design API Integration', () => {
  test('should upload and retrieve design', async () => {
    // Upload
    const uploadResponse = await request(app)
      .post('/api/designs')
      .set('Authorization', `Bearer ${vendorToken}`)
      .attach('file', 'test/fixtures/design.jpg')
      .field('name', 'Integration Test Design')
      .field('price', '2000')
      .field('category', 'illustration');
      
    expect(uploadResponse.status).toBe(201);
    
    // Retrieve
    const getResponse = await request(app)
      .get('/api/designs')
      .set('Authorization', `Bearer ${vendorToken}`);
      
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.designs).toHaveLength(1);
  });
});
```

---

## 📋 Migration et Déploiement

### 1. Script de migration
```sql
-- Migration pour ajouter les nouveaux champs
ALTER TABLE designs ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE designs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 1000;

-- Mise à jour des données existantes
UPDATE designs SET 
  name = COALESCE(name, 'Design sans nom'),
  price = COALESCE(price, 1000)
WHERE name IS NULL OR price IS NULL;

-- Ajout des contraintes après mise à jour
ALTER TABLE designs ALTER COLUMN name SET NOT NULL;
ALTER TABLE designs ALTER COLUMN price SET NOT NULL;
```

### 2. Checklist de déploiement
- [ ] Migration de la base de données
- [ ] Tests de l'API
- [ ] Vérification des uploads d'images
- [ ] Test de la validation des données
- [ ] Vérification des autorisations
- [ ] Test de performance avec de gros fichiers
- [ ] Monitoring des erreurs

---

## 🔍 Monitoring et Logging

### 1. Logs recommandés
```javascript
// Log des créations de designs
logger.info('Design created', {
  designId: design.id,
  vendorId: vendor.id,
  name: design.name,
  price: design.price,
  fileSize: design.fileSize
});

// Log des erreurs de validation
logger.warn('Design validation failed', {
  vendorId: vendor.id,
  errors: validationErrors,
  attemptedData: sanitizedData
});
```

### 2. Métriques à surveiller
- Nombre de designs créés par jour
- Taille moyenne des fichiers uploadés
- Taux d'erreur de validation
- Temps de traitement des images
- Espace de stockage utilisé

---

## 📞 Points de Contact

Pour toute question sur cette spécification :

1. **Validation des données** : Vérifier les règles métier pour les prix et catégories
2. **Stockage des images** : Confirmer la solution (Cloudinary, AWS S3, local)
3. **Performance** : Discuter des limites de taille et de compression
4. **Sécurité** : Valider les règles d'autorisation et de validation

---

*Document généré le : 2024-01-20*
*Version : 1.0*
*Statut : En attente de validation* 