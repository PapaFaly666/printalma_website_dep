# Documentation API Backend - Catégories, Sous-catégories et Variations

Ce document définit les endpoints nécessaires pour le backend afin de supporter la gestion des variations et sous-catégories dans PrintAlma.

## 🏗️ Architecture Modèle

Le système utilise une structure à 3 niveaux hiérarchiques :

```mermaid
graph TD
    A[Catégorie (niveau 0)] --> B[Sous-catégorie (niveau 1)]
    B --> C[Variation (niveau 2)]
```

## 📊 Modèles de Données

### Categories (categories table)
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  displayOrder INTEGER DEFAULT 0,
  coverImageUrl VARCHAR(500),
  coverImagePublicId VARCHAR(500),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SubCategories (sub_categories table)
```sql
CREATE TABLE sub_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  categoryId INTEGER NOT NULL,
  displayOrder INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(categoryId, name)
);
```

### Variations (variations table)
```sql
CREATE TABLE variations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  subCategoryId INTEGER NOT NULL,
  displayOrder INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subCategoryId) REFERENCES sub_categories(id) ON DELETE CASCADE,
  UNIQUE(subCategoryId, name)
);
```

## 🔌 Endpoints API

### 1. SOUS-CATÉGORIES (Niveau 1)

#### POST /sub-categories
**Ajouter une sous-catégorie à une catégorie**

```typescript
// Request Body
{
  "name": "string",           // Requis
  "description?: "string",    // Optionnel
  "categoryId": number,       // Requis - ID de la catégorie parente
  "displayOrder?: number      // Optionnel, défaut: 0
}

// Response 201 Created
{
  "success": true,
  "message": "Sous-catégorie créée avec succès",
  "data": {
    "id": 1,
    "name": "T-Shirts",
    "slug": "t-shirts",
    "description": "T-shirts coton bio",
    "categoryId": 1,
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "category": {
      "id": 1,
      "name": "Vêtements",
      "slug": "vetements"
    }
  }
}

// Error Responses
400: {
  "success": false,
  "error": "MISSING_CATEGORY_ID",
  "message": "L'ID de la catégorie est requis"
}

400: {
  "success": false,
  "error": "DUPLICATE_SUBCATEGORY",
  "message": "Une sous-catégorie avec ce nom existe déjà dans cette catégorie"
}

404: {
  "success": false,
  "error": "CATEGORY_NOT_FOUND",
  "message": "La catégorie spécifiée n'existe pas"
}
```

#### GET /sub-categories
**Lister toutes les sous-catégories (avec filtre optionnel)**

```typescript
// Query Parameters
categoryId?: number    // Optionnel - Filtrer par catégorie parente

// Response 200 OK
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-Shirts",
      "slug": "t-shirts",
      "description": "T-shirts coton bio",
      "categoryId": 1,
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": 1,
        "name": "Vêtements",
        "slug": "vetements"
      },
      "variations": []  // Si demandé avec include=variations
    }
  ]
}
```

#### GET /sub-categories/:id
**Récupérer une sous-catégorie par ID**

```typescript
// Response 200 OK
{
  "success": true,
  "data": {
    "id": 1,
    "name": "T-Shirts",
    "slug": "t-shirts",
    "description": "T-shirts coton bio",
    "categoryId": 1,
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "category": {
      "id": 1,
      "name": "Vêtements",
      "slug": "vetements"
    },
    "variations": [
      {
        "id": 1,
        "name": "Col V",
        "slug": "col-v"
      }
    ]
  }
}
```

#### PATCH /sub-categories/:id
**Mettre à jour une sous-catégorie**

```typescript
// Request Body
{
  "name?: "string",
  "description?: "string",
  "displayOrder?: number",
  "isActive?: boolean"
}

// Response 200 OK
{
  "success": true,
  "message": "Sous-catégorie mise à jour avec succès",
  "data": { /* Sous-catégorie mise à jour */ }
}
```

#### DELETE /sub-categories/:id
**Supprimer une sous-catégorie**

```typescript
// Response 200 OK
{
  "success": true,
  "message": "Sous-catégorie supprimée avec succès"
}

// Error 400 si contrainte
{
  "success": false,
  "error": "SUBCATEGORY_HAS_VARIATIONS",
  "message": "Impossible de supprimer: des variations sont liées à cette sous-catégorie"
}
```

### 2. VARIATIONS (Niveau 2)

#### POST /variations
**Ajouter une variation à une sous-catégorie**

```typescript
// Request Body
{
  "name": "string",           // Requis
  "description?: "string",    // Optionnel
  "subCategoryId": number,    // Requis - ID de la sous-catégorie parente
  "displayOrder?: number      // Optionnel, défaut: 0
}

// Response 201 Created
{
  "success": true,
  "message": "Variation créée avec succès",
  "data": {
    "id": 1,
    "name": "Col V",
    "slug": "col-v",
    "description": "T-shirt avec col en V",
    "subCategoryId": 1,
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "subCategory": {
      "id": 1,
      "name": "T-Shirts",
      "slug": "t-shirts",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Vêtements",
        "slug": "vetements"
      }
    }
  }
}

// Error Responses
400: {
  "success": false,
  "error": "MISSING_SUBCATEGORY_ID",
  "message": "L'ID de la sous-catégorie est requis"
}

400: {
  "success": false,
  "error": "DUPLICATE_VARIATION",
  "message": "Une variation avec ce nom existe déjà dans cette sous-catégorie"
}

404: {
  "success": false,
  "error": "SUBCATEGORY_NOT_FOUND",
  "message": "La sous-catégorie spécifiée n'existe pas"
}
```

#### POST /variations/batch
**Ajouter plusieurs variations en lot (recommandé pour le frontend)**

```typescript
// Request Body
{
  "variations": [
    {
      "name": "Col V",
      "description": "T-shirt avec col en V",
      "subCategoryId": 1,
      "displayOrder": 0
    },
    {
      "name": "Col Rond",
      "description": "T-shirt classique col rond",
      "subCategoryId": 1,
      "displayOrder": 1
    }
  ]
}

// Response 201 Created
{
  "success": true,
  "message": "2 variations créées avec succès",
  "data": {
    "created": [
      { /* Variation 1 créée */ },
      { /* Variation 2 créée */ }
    ],
    "skipped": [],
    "duplicates": []
  }
}

// Response avec doublons
{
  "success": true,
  "message": "1 variation créée, 1 doublon ignorée",
  "data": {
    "created": [
      { /* Variation créée */ }
    ],
    "skipped": ["Col Rond"],
    "duplicates": ["Col Rond existe déjà"]
  }
}
```

#### GET /variations
**Lister toutes les variations (avec filtre optionnel)**

```typescript
// Query Parameters
subCategoryId?: number  // Optionnel - Filtrer par sous-catégorie parente

// Response 200 OK
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Col V",
      "slug": "col-v",
      "description": "T-shirt avec col en V",
      "subCategoryId": 1,
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "subCategory": {
        "id": 1,
        "name": "T-Shirts",
        "slug": "t-shirts",
        "categoryId": 1,
        "category": {
          "id": 1,
          "name": "Vêtements",
          "slug": "vetements"
        }
      }
    }
  ]
}
```

#### GET /variations/:id
**Récupérer une variation par ID**

```typescript
// Response 200 OK
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Col V",
    "slug": "col-v",
    "description": "T-shirt avec col en V",
    "subCategoryId": 1,
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "subCategory": {
      "id": 1,
      "name": "T-Shirts",
      "slug": "t-shirts",
      "categoryId": 1
    }
  }
}
```

#### PATCH /variations/:id
**Mettre à jour une variation**

```typescript
// Request Body
{
  "name?: "string",
  "description?: "string",
  "displayOrder?: number",
  "isActive?: boolean"
}

// Response 200 OK
{
  "success": true,
  "message": "Variation mise à jour avec succès",
  "data": { /* Variation mise à jour */ }
}
```

#### DELETE /variations/:id
**Supprimer une variation**

```typescript
// Response 200 OK
{
  "success": true,
  "message": "Variation supprimée avec succès"
}

// Error 400 si contrainte
{
  "success": false,
  "error": "VARIATION_HAS_PRODUCTS",
  "message": "Impossible de supprimer: des produits sont liés à cette variation"
}
```

## 🔗 Endpoint Hiérarchique

### GET /categories/hierarchy
**Récupérer l'arborescence complète**

```typescript
// Response 200 OK
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Vêtements",
      "slug": "vetements",
      "displayOrder": 0,
      "isActive": true,
      "subCategories": [
        {
          "id": 1,
          "name": "T-Shirts",
          "slug": "t-shirts",
          "categoryId": 1,
          "displayOrder": 0,
          "isActive": true,
          "variations": [
            {
              "id": 1,
              "name": "Col V",
              "slug": "col-v",
              "subCategoryId": 1,
              "displayOrder": 0,
              "isActive": true
            }
          ]
        }
      ]
    }
  ]
}
```

## 🔧 Implémentation Backend Recommandée

### Validation des Données

```javascript
// Exemple middleware de validation pour sous-catégorie
const validateSubCategory = (req, res, next) => {
  const { name, categoryId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_NAME',
      message: 'Le nom est requis'
    });
  }

  if (!categoryId) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_CATEGORY_ID',
      message: 'L\'ID de la catégorie est requis'
    });
  }

  next();
};
```

### Gestion des Slug

```javascript
// Fonction de génération de slug
const generateSlug = (name, parentId = null) => {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Vérifier les doublons et ajouter suffixe si nécessaire
  // Logique spécifique selon la table (categories/sub_categories/variations)
  return uniqueSlug;
};
```

### Contraintes et Suppression

```javascript
// Gestion des contraintes avant suppression
const canDeleteSubCategory = async (subCategoryId) => {
  const variationCount = await db.variations.count({
    where: { subCategoryId }
  });

  if (variationCount > 0) {
    throw new Error('SUBCATEGORY_HAS_VARIATIONS');
  }

  return true;
};
```

## 🎯 Intégration Frontend

### Utilisation avec CategoryManagement.tsx

Le frontend actuel (`CategoryManagement.tsx`) a besoin de ces services pour remplacer les TODO:

```typescript
// Remplacer les console.log() existants:
const handleSaveSubCategory = async () => {
  try {
    const response = await categoryRealApi.createSubCategory({
      name: newSubCategory.name,
      description: newSubCategory.description,
      categoryId: selectedParentCategory.id
    });

    toast.success('Sous-catégorie créée avec succès');
    refreshData(); // Recharger les données
    setShowAddSubCategoryModal(false);
  } catch (error) {
    toast.error(error.message);
  }
};

const handleSaveAllVariations = async () => {
  try {
    const response = await categoryRealApi.createVariationsBatch({
      variations: variationsToAdd.map(name => ({
        name,
        subCategoryId: selectedParentSubCategory.id
      }))
    });

    toast.success(`${response.data.created.length} variations créées`);
    refreshData(); // Recharger les données
    setShowAddVariationModal(false);
  } catch (error) {
    toast.error(error.message);
  }
};
```

---

*Cette documentation servira de référence pour l'implémentation complète du backend afin de supporter toutes les fonctionnalités de gestion des catégories, sous-catégories et variations.*