# Guide d'Implémentation Backend - Gestion des Catégories Hiérarchiques

## Vue d'ensemble

Ce document décrit l'implémentation nécessaire côté backend pour gérer l'ajout de sous-catégories aux catégories et de variations aux sous-catégories.

## Structure des Données

### Modèle Category

```typescript
interface Category {
  id: number;
  name: string;
  description?: string;
  level: number;           // 0 = Catégorie parente, 1 = Sous-catégorie, 2 = Variation
  parentId: number | null; // ID de la catégorie parente
  order?: number;          // Ordre d'affichage
  productCount?: number;   // Nombre de produits associés
  sizes?: string[];        // Tailles disponibles (pour les variations)
  createdAt: Date;
  updatedAt: Date;
}
```

## Endpoints API Nécessaires

### 1. Créer une sous-catégorie

**POST** `/api/categories/:parentId/subcategories`

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Corps de la requête**:
```json
{
  "name": "Nom de la sous-catégorie",
  "description": "Description optionnelle"
}
```

**Réponse réussie (201)**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Nom de la sous-catégorie",
    "description": "Description optionnelle",
    "level": 1,
    "parentId": 45,
    "order": 1,
    "productCount": 0,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Sous-catégorie créée avec succès"
}
```

**Réponses d'erreur**:
- `400` - Données invalides
- `401` - Non authentifié
- `403` - Permissions insuffisantes
- `404` - Catégorie parente non trouvée
- `409` - Sous-catégorie avec ce nom existe déjà

### 2. Créer plusieurs variations

**POST** `/api/categories/:subcategoryId/variations`

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Corps de la requête**:
```json
{
  "variations": [
    {
      "name": "Variation 1",
      "description": "Description optionnelle 1"
    },
    {
      "name": "Variation 2",
      "description": "Description optionnelle 2"
    }
  ]
}
```

**Réponse réussie (201)**:
```json
{
  "success": true,
  "data": {
    "created": [
      {
        "id": 124,
        "name": "Variation 1",
        "description": "Description optionnelle 1",
        "level": 2,
        "parentId": 123,
        "order": 1,
        "createdAt": "2024-01-15T10:31:00Z",
        "updatedAt": "2024-01-15T10:31:00Z"
      },
      {
        "id": 125,
        "name": "Variation 2",
        "description": "Description optionnelle 2",
        "level": 2,
        "parentId": 123,
        "order": 2,
        "createdAt": "2024-01-15T10:31:00Z",
        "updatedAt": "2024-01-15T10:31:00Z"
      }
    ],
    "skipped": [],
    "totalCount": 2
  },
  "message": "2 variations créées avec succès"
}
```

**Réponses d'erreur**:
- `400` - Données invalides ou tableau vide
- `401` - Non authentifié
- `403` - Permissions insuffisantes
- `404` - Sous-catégorie non trouvée
- `409` - Conflit de noms

### 3. Récupérer la hiérarchie complète

**GET** `/api/categories/hierarchy`

**Headers**:
- `Authorization: Bearer <token>`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Vêtements",
      "description": "Catégorie principale",
      "level": 0,
      "parentId": null,
      "order": 1,
      "productCount": 15,
      "subcategories": [
        {
          "id": 10,
          "name": "T-shirts",
          "description": "Sous-catégorie T-shirts",
          "level": 1,
          "parentId": 1,
          "order": 1,
          "productCount": 8,
          "children": [
            {
              "id": 100,
              "name": "Col V",
              "description": "Variation Col V",
              "level": 2,
              "parentId": 10,
              "order": 1
            }
          ]
        }
      ]
    }
  ]
}
```

## Logique Métier

### Validation des Noms

1. **Unicité** : Le nom d'une sous-catégorie doit être unique au sein de sa catégorie parente
2. **Unicité** : Le nom d'une variation doit être unique au sein de sa sous-catégorie parente
3. **Format** : Les noms ne doivent pas être vides et peuvent contenir jusqu'à 100 caractères

### Gestion de l'Ordre

- Les sous-catégories et variations doivent avoir un champ `order` automatique
- L'ordre est calculé comme `max(order) + 1` parmi les éléments du même niveau
- Permet un affichage cohérent dans l'interface

### Permissions Requises

1. **Admin** : Peut créer des sous-catégories et variations dans n'importe quelle catégorie
2. **Vendeur** : Peut créer des sous-catégories et variations uniquement dans ses catégories assignées

## Base de Données (PostgreSQL)

### Migration SQL

```sql
-- S'assurer que la table categories a les bons champs
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS product_count INTEGER DEFAULT 0;

-- Index pour optimiser les requêtes hiérarchiques
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);

-- Contrainte pour éviter les références circulaires
ALTER TABLE categories
ADD CONSTRAINT check_no_circular_reference
CHECK (id != parent_id);
```

## Services Backend (Node.js/Express)

### Structure des fichiers

```
src/
├── controllers/
│   ├── categoryController.js
├── services/
│   ├── categoryService.js
├── models/
│   ├── Category.js
├── routes/
│   ├── categoryRoutes.js
└── middleware/
    ├── auth.js
    ├── validation.js
```

### Exemple d'implémentation - Controller

```javascript
// categoryController.js
const categoryService = require('../services/categoryService');

class CategoryController {
  // Créer une sous-catégorie
  async createSubCategory(req, res) {
    try {
      const { parentId } = req.params;
      const { name, description } = req.body;

      const result = await categoryService.createSubCategory({
        name,
        description,
        parentId,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Sous-catégorie créée avec succès'
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Créer plusieurs variations
  async createVariations(req, res) {
    try {
      const { subcategoryId } = req.params;
      const { variations } = req.body;

      const result = await categoryService.createMultipleVariations({
        variations,
        subcategoryId,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: result,
        message: `${result.totalCount} variation(s) créée(s) avec succès`
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Récupérer la hiérarchie
  async getHierarchy(req, res) {
    try {
      const hierarchy = await categoryService.getHierarchy();

      res.json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CategoryController();
```

### Exemple d'implémentation - Service

```javascript
// categoryService.js
const { Category } = require('../models');
const { Op } = require('sequelize');

class CategoryService {
  async createSubCategory({ name, description, parentId, userId }) {
    // Validation de la catégorie parente
    const parent = await Category.findByPk(parentId);
    if (!parent) {
      throw new Error('Catégorie parente non trouvée');
    }

    if (parent.level !== 0) {
      throw new Error('Seules les catégories principales peuvent avoir des sous-catégories');
    }

    // Vérifier l'unicité du nom
    const existing = await Category.findOne({
      where: {
        name,
        parentId,
        level: 1
      }
    });

    if (existing) {
      throw new Error('Une sous-catégorie avec ce nom existe déjà');
    }

    // Calculer l'ordre
    const maxOrder = await Category.max('order', {
      where: { parentId, level: 1 }
    }) || 0;

    // Créer la sous-catégorie
    return await Category.create({
      name,
      description,
      parentId,
      level: 1,
      order: maxOrder + 1
    });
  }

  async createMultipleVariations({ variations, subcategoryId, userId }) {
    if (!variations || variations.length === 0) {
      throw new Error('Aucune variation à créer');
    }

    // Validation de la sous-catégorie parente
    const parent = await Category.findByPk(subcategoryId);
    if (!parent) {
      throw new Error('Sous-catégorie non trouvée');
    }

    if (parent.level !== 1) {
      throw new Error('Seules les sous-catégories peuvent avoir des variations');
    }

    const created = [];
    const skipped = [];

    // Obtenir l'ordre de départ
    const maxOrder = await Category.max('order', {
      where: { parentId: subcategoryId, level: 2 }
    }) || 0;

    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];

      try {
        // Vérifier l'unicité
        const existing = await Category.findOne({
          where: {
            name: variation.name,
            parentId: subcategoryId,
            level: 2
          }
        });

        if (existing) {
          skipped.push({
            name: variation.name,
            reason: 'Nom déjà existant'
          });
          continue;
        }

        // Créer la variation
        const newVariation = await Category.create({
          name: variation.name,
          description: variation.description,
          parentId: subcategoryId,
          level: 2,
          order: maxOrder + i + 1
        });

        created.push(newVariation);
      } catch (error) {
        skipped.push({
          name: variation.name,
          reason: error.message
        });
      }
    }

    return {
      created,
      skipped,
      totalCount: created.length
    };
  }

  async getHierarchy() {
    const categories = await Category.findAll({
      where: { level: 0 },
      include: [
        {
          model: Category,
          as: 'subcategories',
          where: { level: 1 },
          include: [
            {
              model: Category,
              as: 'children',
              where: { level: 2 }
            }
          ]
        }
      ],
      order: [['order', 'ASC'], ['subcategories', 'order', 'ASC']]
    });

    return categories;
  }
}

module.exports = new CategoryService();
```

## Tests API

### Test avec Postman/cURL

**Créer une sous-catégorie**:
```bash
curl -X POST http://localhost:3004/api/categories/1/subcategories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nouvelle sous-catégorie", "description": "Description"}'
```

**Créer plusieurs variations**:
```bash
curl -X POST http://localhost:3004/api/categories/10/variations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variations": [
      {"name": "Rouge"},
      {"name": "Bleu"},
      {"name": "Vert"}
    ]
  }'
```

## Intégration Frontend

### Mettre à jour les services frontend

```typescript
// src/services/categoryService.ts
export const createSubCategory = async (parentId: number, data: {name: string, description?: string}) => {
  const response = await api.post(`/categories/${parentId}/subcategories`, data);
  return response.data;
};

export const createMultipleVariations = async (subcategoryId: number, variations: {name: string, description?: string}[]) => {
  const response = await api.post(`/categories/${subcategoryId}/variations`, { variations });
  return response.data;
};
```

## Notes Importantes

1. **Sécurité** : Toujours valider les permissions de l'utilisateur avant de créer/modifier
2. **Performance** : Utiliser des index pour les requêtes hiérarchiques
3. **Gestion d'erreurs** : Retourner des messages clairs pour chaque type d'erreur
4. **Validation** : Valider tous les champs d'entrée côté backend et frontend
5. **Transactions** : Utiliser des transactions pour la création multiple pour garantir la cohérence

## Checklist d'Implémentation

- [ ] Mettre à jour le modèle Category avec les nouveaux champs
- [ ] Créer les migrations SQL nécessaires
- [ ] Implémenter les endpoints API
- [ ] Ajouter la validation des données
- [ ] Configurer les permissions et l'authentification
- [ ] Créer les services métier
- [ ] Ajouter les tests unitaires
- [ ] Mettre à jour la documentation API
- [ ] Tester avec le frontend