# Frontend Endpoints Guide - Stickers & Designs

## 📋 Vue d'ensemble

Ce document répertorie tous les endpoints API utilisés par le frontend pour gérer les **stickers** et les **designs**.

---

## 🎨 Endpoints Designs

### Base URL
```
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
```

---

### 1. Créer un Design

**Endpoint Principal :** `POST /api/designs`

**Endpoint de Fallback :** `POST /vendor/designs`

**Utilisé dans :** `src/services/designService.ts` → `createDesign()`

**Payload (FormData) :**
```typescript
const formData = new FormData();
formData.append('file', payload.file);        // Fichier image (PNG, JPG, SVG)
formData.append('name', payload.name);        // Nom du design
formData.append('description', payload.description || '');
formData.append('price', payload.price.toString());        // Prix en FCFA (100-1000000)
formData.append('categoryId', payload.categoryId.toString());  // ID catégorie (1-6)
// Optionnel:
formData.append('tags', payload.tags || '');  // Tags séparés par virgules
```

**Mapping des Catégories :**
```typescript
CATEGORY_MAPPING = {
  'ILLUSTRATION': 1,
  'LOGO': 2,
  'PATTERN': 3,
  'TYPOGRAPHY': 4,
  'Mangas': 5,
  'ABSTRACT': 6
};
```

**Réponse Attendue :**
```json
{
  "success": true,
  "data": {
    "designId": 123,
    "id": 123,
    "designUrl": "https://res.cloudinary.com/...",
    "imageUrl": "https://res.cloudinary.com/..."
  }
}
```

---

### 2. Lister les Designs du Vendeur

**Endpoint Principal :** `GET /api/designs`

**Endpoint de Fallback :** `GET /vendor/designs`

**Utilisé dans :** `src/services/designService.ts` → `getDesigns()`

**Query Params :**
```
?limit=10
&offset=0
&status=published|pending|draft|all
&search=logo
```

**Réponse Attendue :**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 123,
        "designId": 123,
        "name": "Logo Corporate",
        "description": "Design professionnel",
        "price": 2500,
        "imageUrl": "https://...",
        "thumbnailUrl": "https://...",
        "category": "logo",
        "status": "PUBLISHED",
        "isValidated": true,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    },
    "stats": {
      "total": 50,
      "published": 30,
      "pending": 10,
      "draft": 10
    }
  }
}
```

---

### 3. Récupérer un Design par ID

**Endpoint :** `GET /api/designs/:id`

**Utilisé dans :** `src/services/designService.ts` → (implicitement dans getDesigns)

**Réponse Attendue :**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Logo Corporate",
    "description": "Design professionnel",
    "price": 2500,
    "imageUrl": "https://...",
    "thumbnailUrl": "https://...",
    "categoryId": 2,
    "category": "logo",
    "tags": ["business", "corporate"],
    "status": "PUBLISHED",
    "isValidated": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 4. Mettre à jour un Design

**Endpoint :** `PUT /vendor/designs/:id`

**Utilisé dans :** `src/services/designService.ts` → `updateDesign()`

**Payload (JSON) :**
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "price": 3000
}
```

---

### 5. Supprimer un Design

**Endpoint :** `DELETE /vendor/designs/:id`

**Utilisé dans :** `src/services/designService.ts` → `deleteDesign()`

**Réponse Attendue :**
```json
{
  "success": true,
  "deletedProductsCount": 3,
  "message": "Design et 3 produit(s) associé(s) supprimé(s)"
}
```

---

### 6. Valider/Rejeter un Design (Admin)

**Endpoint :** `PUT /api/designs/:id/validate`

**Utilisé dans :** `src/services/designService.ts` → `validateDesign()`

**Payload :**
```json
{
  "action": "VALIDATE",
  "rejectionReason": "Qualité insuffisante"
}
```

**Actions possibles :**
- `VALIDATE` - Valider le design
- `REJECT` - Rejeter le design

**Réponse Attendue :**
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": {
    "design": { ... },
    "affectedProducts": 5
  }
}
```

---

### 7. Récupérer les Designs en Attente (Admin)

**Endpoint :** `GET /api/designs/admin/pending`

**Utilisé dans :** `src/services/designService.ts` → `getPendingDesigns()`

**Query Params :**
```
?page=1
&limit=10
&search=logo
&sortBy=submittedAt
&sortOrder=desc
```

---

### 8. Récupérer Tous les Designs (Admin)

**Endpoint :** `GET /api/designs/admin/all`

**Utilisé dans :** `src/services/designService.ts` → `getAllDesigns()`

**Query Params :**
```
?page=1
&limit=20
&search=logo
&status=ALL|PENDING|VALIDATED|REJECTED
&sortBy=createdAt|price|vendor
&sortOrder=asc|desc
```

**Réponse Attendue :**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 123,
        "name": "Logo Corporate",
        "vendor": {
          "id": 1,
          "firstName": "Jean",
          "lastName": "Dupont",
          "email": "jean@email.com"
        },
        "validationStatus": "PENDING",
        "submittedForValidationAt": "2024-01-15T10:00:00Z",
        "validatedAt": "2024-01-15T12:00:00Z",
        "validatorName": "Admin",
        "rejectionReason": null,
        "associatedProducts": 5
      }
    ],
    "pagination": { ... },
    "stats": {
      "total": 100,
      "pending": 20,
      "validated": 70,
      "rejected": 10
    }
  }
}
```

---

### 9. Récupérer les Designs Publics

**Endpoint :** `GET /public/designs`

**Utilisé dans :** `src/services/designService.ts` → `getPublicDesigns()`

**Query Params :**
```
?page=1
&limit=20
&category=logo
&minPrice=1000
&maxPrice=10000
&search=logo
&sortBy=price
&sortOrder=asc
```

---

## 🏷️ Endpoints Catégories de Designs

### Base URL
```
`${API_BASE_URL}/design-categories`
```

### Lister les Catégories Actives

**Endpoint :** `GET /design-categories/active`

**Utilisé dans :** `src/services/designCategoryService.ts`

**Réponse Attendue :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ILLUSTRATION",
      "description": "Illustrations artistiques",
      "isActive": true
    },
    {
      "id": 2,
      "name": "LOGO",
      "description": "Logos et identité visuelle",
      "isActive": true
    }
  ]
}
```

---

## 🎯 Endpoints Stickers (Vendeur)

### Base URL
```
`${API_BASE_URL}/vendor/stickers`
```

### 1. Créer un Produit Sticker

**Endpoint :** `POST /vendor/stickers`

**Utilisé dans :** `src/services/vendorStickerService.ts` → `createStickerProduct()`

**Payload (JSON) :**
```json
{
  "designId": 123,
  "stickerType": "autocollant",
  "stickerSurface": "blanc-mat",
  "stickerBorderColor": "glossy-white",
  "stickerSize": "83 mm x 100 mm",
  "name": "Autocollant Logo",
  "description": "Sticker haute qualité avec logo",
  "price": 2500,
  "stock": 100,
  "status": "PUBLISHED",
  "autoPublish": true
}
```

**Types de Stickers :**
- `autocollant` - Bordure fine (4px)
- `pare-chocs` - Bordure large (25px)

**Surfaces :**
- `blanc-mat` - Surface blanche opaque mate
- `transparent` - Surface transparente

**Couleurs de Bordure :**
- `transparent` - Sans bordure
- `white` - Blanc standard
- `glossy-white` - Blanc brillant

**Tailles Standards :**
```
Autocollant:
- "83 mm x 100 mm"
- "100 mm x 120 mm"
- "120 mm x 144 mm"
- "150 mm x 180 mm"

Pare-chocs:
- "100 mm x 300 mm"
- "120 mm x 360 mm"
- "150 mm x 450 mm"
```

**Réponse Attendue :**
```json
{
  "success": true,
  "message": "Sticker créé avec succès",
  "productId": 456,
  "data": {
    "id": 456,
    "vendorId": 1,
    "designId": 123,
    "name": "Autocollant Logo",
    "description": "Sticker haute qualité",
    "price": 2500,
    "stock": 100,
    "status": "PUBLISHED",
    "stickerType": "autocollant",
    "stickerSurface": "blanc-mat",
    "stickerBorderColor": "glossy-white",
    "stickerSize": "83 mm x 100 mm",
    "imageUrl": "https://res.cloudinary.com/.../sticker_456_design_123_1234567890.png",
    "cloudinaryPublicId": "vendor-stickers/sticker_456_design_123_1234567890",
    "design": {
      "id": 123,
      "name": "Logo Corporate",
      "imageUrl": "https://...",
      "thumbnailUrl": "https://..."
    },
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 2. Lister les Stickers du Vendeur

**Endpoint :** `GET /vendor/stickers`

**Utilisé dans :** `src/services/vendorStickerService.ts` → `getStickerProducts()`

**Query Params :**
```
?limit=20
&offset=0
&status=all|published|draft|pending
&search=logo
```

**Réponse Attendue :**
```json
{
  "success": true,
  "data": {
    "stickers": [
      {
        "id": 456,
        "name": "Autocollant Logo",
        "stickerImage": "https://res.cloudinary.com/.../sticker_456_...png",
        "designPreview": "https://res.cloudinary.com/.../design_123.png",
        "size": "83 mm x 100 mm",
        "finish": "glossy",
        "price": 2500,
        "status": "PUBLISHED",
        "saleCount": 15,
        "viewCount": 150,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 50,
      "itemsPerPage": 20
    }
  }
}
```

---

### 3. Récupérer un Sticker par ID

**Endpoint :** `GET /vendor/stickers/:id`

**Utilisé dans :** `src/services/vendorStickerService.ts` → `getStickerProduct()`

**Réponse Attendue :**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "name": "Autocollant Logo",
    "description": "Sticker haute qualité",
    "price": 2500,
    "stock": 100,
    "status": "PUBLISHED",
    "stickerType": "autocollant",
    "stickerSurface": "blanc-mat",
    "stickerBorderColor": "glossy-white",
    "stickerSize": "83 mm x 100 mm",
    "imageUrl": "https://res.cloudinary.com/...",
    "cloudinaryPublicId": "vendor-stickers/...",
    "designId": 123,
    "designName": "Logo Corporate",
    "designImageUrl": "https://...",
    "designThumbnailUrl": "https://...",
    "designPrice": 500,
    "vendorId": 1,
    "vendor": {
      "id": 1,
      "fullName": "Jean Dupont",
      "shop_name": "MaBoutique",
      "email": "jean@email.com"
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 4. Mettre à jour un Sticker

**Endpoint :** `PUT /vendor/stickers/:id`

**Utilisé dans :** `src/services/vendorStickerService.ts` → `updateStickerProduct()`

**Payload (JSON) :**
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "price": 3000,
  "stock": 50,
  "stickerSize": "100 mm x 120 mm",
  "status": "PUBLISHED"
}
```

---

### 5. Supprimer un Sticker

**Endpoint :** `DELETE /vendor/stickers/:id`

**Utilisé dans :** `src/services/vendorStickerService.ts` → `deleteStickerProduct()`

**Réponse Attendue :**
```json
{
  "success": true,
  "message": "Sticker supprimé avec succès"
}
```

---

### 6. Publier un Sticker

**Endpoint :** `PUT /vendor/stickers/:id/publish`

**Utilisé dans :** `src/services/vendorStickerService.ts` → `publishStickerProduct()`

**Réponse Attendue :**
```json
{
  "success": true,
  "message": "Sticker publié avec succès",
  "product": { ... }
}
```

---

## 🛍️ Endpoints Stickers (Public)

### Base URL
```
`${API_BASE_URL}/public/stickers`
```

### 1. Lister les Stickers Publics

**Endpoint :** `GET /public/stickers`

**Utilisé dans :** `src/services/publicStickerService.ts` → `getPublicStickers()`

**Query Params :**
```
?search=logo
&vendorId=1
&size=83 mm x 100 mm
&finish=glossy
&minPrice=1000
&maxPrice=5000
&page=1
&limit=20
```

**Réponse Attendue :**
```json
{
  "success": true,
  "data": {
    "stickers": [
      {
        "id": 456,
        "name": "Autocollant Logo",
        "description": "Sticker haute qualité",
        "sku": "STK-1-123-1",
        "imageUrl": "https://res.cloudinary.com/.../sticker_456_...png",
        "design": {
          "id": 123,
          "name": "Logo Corporate",
          "imageUrl": "https://...",
          "thumbnailUrl": "https://...",
          "category": 2
        },
        "configuration": {
          "size": {
            "width": 83,
            "height": 100
          },
          "finish": "glossy",
          "shape": "SQUARE"
        },
        "pricing": {
          "basePrice": 2000,
          "finishMultiplier": 1.0,
          "finalPrice": 2500,
          "currency": "FCFA"
        },
        "stock": {
          "quantity": 100,
          "minimumOrder": 1
        },
        "status": "PUBLISHED",
        "stats": {
          "viewCount": 150,
          "saleCount": 15
        },
        "vendor": {
          "id": 1,
          "shopName": "MaBoutique"
        },
        "createdAt": "2024-01-15T10:00:00Z",
        "publishedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 50,
      "itemsPerPage": 20
    }
  }
}
```

---

### 2. Récupérer un Sticker Public par ID

**Endpoint :** `GET /public/stickers/:id`

**Utilisé dans :** `src/services/publicStickerService.ts` → `getPublicSticker()`

**Réponse Attendue :** Même format que ci-dessus.

---

### 3. Configurations Disponibles

**Endpoint :** `GET /public/stickers/configurations`

**Utilisé dans :** `src/services/publicStickerService.ts` → `getConfigurations()`

**Réponse Attendue :**
```json
{
  "success": true,
  "data": {
    "shapes": [
      {
        "id": "SQUARE",
        "name": "Carré",
        "description": "Forme carrée classique"
      },
      {
        "id": "CIRCLE",
        "name": "Cercle",
        "description": "Forme circulaire"
      },
      {
        "id": "RECTANGLE",
        "name": "Rectangle",
        "description": "Forme rectangulaire"
      },
      {
        "id": "DIE_CUT",
        "name": "Découpe personnalisée",
        "description": "Découpe selon la forme du design"
      }
    ],
    "stickerTypes": [
      {
        "id": "autocollant",
        "name": "Autocollant",
        "description": "Sticker décoratif avec bordure fine"
      },
      {
        "id": "pare-chocs",
        "name": "Pare-chocs",
        "description": "Sticker robuste avec bordure large"
      }
    ],
    "borderColors": [
      {
        "id": "glossy-white",
        "name": "Blanc brillant",
        "description": "Bordure blanche avec effet brillant"
      },
      {
        "id": "matte-white",
        "name": "Blanc mat",
        "description": "Bordure blanche mate"
      },
      {
        "id": "transparent",
        "name": "Transparent",
        "description": "Sans bordure visible"
      }
    ]
  }
}
```

---

## 🔐 Authentification

### Cookies
Le frontend utilise l'authentification par cookies pour toutes les requêtes :

```typescript
credentials: 'include',
headers: {
  'Content-Type': 'application/json'
}
```

### Headers Additionnels (si nécessaire)
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`  // Fallback si cookies échouent
}
```

---

## 📡 Flux Complet de Création d'un Sticker

```
┌─────────────────────────────────────────────────────────────────┐
│              1. Vendeur crée un design                          │
│              POST /api/designs                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              2. Design validé par admin                         │
│              PUT /api/designs/:id/validate                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              3. Vendeur crée un sticker                         │
│              POST /vendor/stickers                              │
│              {                                                   │
│                designId: 123,                                   │
│                stickerType: "autocollant",                      │
│                stickerSize: "83 mm x 100 mm",                   │
│                ...                                               │
│              }                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              4. Backend génère l'image avec bordures            │
│              - Télécharge le design depuis Cloudinary           │
│              - Redimensionne (300 DPI)                          │
│              - Ajoute les bordures (4px ou 25px)                │
│              - Upload sur Cloudinary                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              5. Sticker disponible publiquement                 │
│              GET /public/stickers                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Calcul du Prix d'un Sticker

### Formule (Côté Frontend)
```typescript
// src/services/vendorStickerService.ts → calculateStickerPrice()

const basePrice = stickerType === 'autocollant' ? 2000 : 4500;
let sizeMultiplier = 1.0;

if (width > 100) sizeMultiplier = 1.5;
if (width > 150) sizeMultiplier = 2.0;

const totalPrice = Math.round((basePrice * sizeMultiplier) + designPrice);
```

### Exemples
```
Autocollant 83x100mm : 2000 FCFA + prix design
Autocollant 150x180mm : 3000 FCFA + prix design
Pare-chocs 100x300mm : 4500 FCFA + prix design
Pare-chocs 150x450mm : 9000 FCFA + prix design
```

---

## 📚 Types TypeScript

### Design
```typescript
interface Design {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  isDraft?: boolean;
  isPending?: boolean;
  isValidated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### StickerProduct
```typescript
interface StickerProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING';
  stickerType: 'autocollant' | 'pare-chocs';
  stickerSurface: 'blanc-mat' | 'transparent';
  stickerBorderColor: string;
  stickerSize: string;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  designId: number;
  designName: string;
  designImageUrl: string;
  vendorId: number;
  createdAt: string;
  updatedAt: string;
}
```

### PublicSticker
```typescript
interface PublicSticker {
  id: number;
  name: string;
  description?: string;
  imageUrl: string;
  design: {
    id: number;
    name: string;
    imageUrl: string;
  };
  configuration: {
    size: { width: number; height: number };
    finish: string;
    shape: string;
  };
  pricing: {
    basePrice: number;
    finishMultiplier: number;
    finalPrice: number;
    currency: string;
  };
  stock: {
    quantity: number;
    minimumOrder: number;
  };
  status: string;
  stats: {
    viewCount: number;
    saleCount: number;
  };
  vendor: {
    id: number;
    shopName: string;
  };
}
```

---

## 🔍 Debug

### Logs Frontend
```javascript
// Création design
🎨 === DÉBUT CRÉATION DESIGN ===
📋 Payload initial: { hasFile: true, name: "Logo", price: 2500, ... }
🏷️ Conversion category "LOGO" → categoryId 2
📝 FormData préparée:
  - file: logo.png (123456 bytes, image/png)
  - name: Logo
  - price: 2500
  - categoryId: 2

// Création sticker
🎨 === CRÉATION PRODUIT STICKER ===
📋 Payload: { designId: 123, stickerType: "autocollant", ... }
✅ Produit sticker créé: { productId: 456, imageUrl: "https://..." }
```

### Vérifier les Appels API
1. Ouvrir DevTools → Network
2. Filtrer par "designs" ou "stickers"
3. Vérifier les payloads et réponses
4. Console logs pour debugging

---

## 📄 Fichiers Frontend Correspondants

### Services
- `src/services/designService.ts` - Gestion des designs
- `src/services/vendorStickerService.ts` - Stickers vendeur
- `src/services/publicStickerService.ts` - Stickers publics
- `src/services/designCategoryService.ts` - Catégories de designs

### Types
- `src/types/product.ts` - Types produits/designs
- `src/types/vendorDesignProduct.ts` - Types designs produits vendeur

### Pages
- `src/pages/vendor/VendorStickerPage.tsx` - Page gestion stickers vendeur
- `src/pages/vendor/VendorStickerSimplePage.tsx` - Page création stickers
- `src/pages/PublicVendorProductDetailPage.tsx` - Page détail sticker public

### Composants
- `src/components/vendor/VendorStickerCreator.tsx` - Formulaire création sticker
- `src/components/vendor/StickerCard.tsx` - Carte sticker
- `src/components/StickerPreview.tsx` - Prévisualisation sticker

---

## ✅ Checklist Implémentation Backend

Pour chaque endpoint, vérifier :

- [ ] Méthode HTTP correcte (GET, POST, PUT, DELETE)
- [ ] URL correspond au frontend
- [ ] Payload request valide (validation)
- [ ] Response format correspond au type TypeScript
- [ ] Codes HTTP appropriés (200, 201, 400, 401, 404, 500)
- [ ] Authentification par cookies fonctionnelle
- [ ] Gestion des erreurs avec messages clairs
- [ ] Logs pour debugging
- [ ] Pagination pour les listes
- [ ] Filtres et recherche fonctionnels

---

**Version :** 1.0
**Date :** 15 janvier 2026
**Auteur :** Guide Frontend → Backend
