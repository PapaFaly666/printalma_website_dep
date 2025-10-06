# Guide Backend - Gestion des Catégories

Ce guide décrit comment implémenter le backend pour gérer les catégories avec la même logique que le frontend.

## 📋 Table des matières

1. [Structure de la base de données](#structure-de-la-base-de-données)
2. [Schéma de la table](#schéma-de-la-table)
3. [API Endpoints](#api-endpoints)
4. [Logique métier](#logique-métier)
5. [Exemples de requêtes](#exemples-de-requêtes)

---

## 🗄️ Structure de la base de données

### Table: `categories`

```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parentId INT NULL,
  level INT DEFAULT 0,
  order INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Contraintes
  FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_category_per_parent (name, parentId),
  INDEX idx_parent (parentId),
  INDEX idx_level (level)
);
```

### Niveaux de catégories

- **level 0**: Catégorie parent (parentId = NULL)
- **level 1**: Sous-catégorie (parentId = ID du parent)
- **level 2**: Variation (parentId = ID de la sous-catégorie)

---

## 🎯 API Endpoints

### 1. GET `/api/categories`

Récupère toutes les catégories avec leur hiérarchie.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Téléphone",
    "description": "Accessoires téléphone",
    "parentId": null,
    "level": 0,
    "order": 0,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Coque",
    "description": "Sous-catégorie de Téléphone",
    "parentId": 1,
    "level": 1,
    "order": 0,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  },
  {
    "id": 3,
    "name": "iPhone 13",
    "description": "Variation de Coque",
    "parentId": 2,
    "level": 2,
    "order": 0,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
]
```

---

### 2. POST `/api/categories`

Crée une nouvelle catégorie (parent, enfant ou variation).

**Request Body:**
```json
{
  "name": "iPhone 14",
  "description": "Variation de Coque",
  "parentId": 2,
  "level": 2,
  "order": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 4,
    "name": "iPhone 14",
    "description": "Variation de Coque",
    "parentId": 2,
    "level": 2,
    "order": 0,
    "createdAt": "2025-01-15T11:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Erreurs possibles:**
```json
{
  "success": false,
  "error": "DUPLICATE_CATEGORY",
  "message": "La catégorie 'iPhone 14' existe déjà dans cette catégorie parent"
}
```

---

### 3. PUT `/api/categories/:id`

Modifie une catégorie existante.

**Request Body:**
```json
{
  "name": "iPhone 14 Pro",
  "description": "Variation de Coque - Mise à jour"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Catégorie modifiée avec succès",
  "data": {
    "id": 4,
    "name": "iPhone 14 Pro",
    "description": "Variation de Coque - Mise à jour",
    "parentId": 2,
    "level": 2,
    "order": 0,
    "createdAt": "2025-01-15T11:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 4. DELETE `/api/categories/:id`

Supprime une catégorie et ses enfants (cascade).

**Response:**
```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès",
  "deletedCount": 5
}
```

---

## 🧠 Logique métier

### Création de catégorie

```javascript
async function createCategory(data) {
  const { name, description, parentId, level } = data;

  // 1. Vérifier si la catégorie existe déjà
  const existing = await db.query(
    'SELECT * FROM categories WHERE name = ? AND parentId IS NOT DISTINCT FROM ?',
    [name.trim(), parentId || null]
  );

  if (existing.length > 0) {
    return {
      success: false,
      error: 'DUPLICATE_CATEGORY',
      message: `La catégorie "${name}" existe déjà`,
      existingCategory: existing[0]
    };
  }

  // 2. Déterminer le level automatiquement
  let calculatedLevel = 0;
  if (parentId) {
    const parent = await db.query('SELECT level FROM categories WHERE id = ?', [parentId]);
    calculatedLevel = parent[0].level + 1;
  }

  // 3. Créer la catégorie
  const result = await db.query(
    'INSERT INTO categories (name, description, parentId, level, `order`) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), description?.trim() || '', parentId || null, calculatedLevel, 0]
  );

  // 4. Retourner la catégorie créée
  const newCategory = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);

  return {
    success: true,
    message: 'Catégorie créée avec succès',
    data: newCategory[0]
  };
}
```

---

### Récupération hiérarchique

```javascript
async function getCategoriesHierarchy() {
  // 1. Récupérer toutes les catégories
  const categories = await db.query('SELECT * FROM categories ORDER BY level, `order`, name');

  // 2. Organiser en hiérarchie (optionnel, peut être fait côté frontend)
  const categoriesMap = {};
  const rootCategories = [];

  categories.forEach(cat => {
    categoriesMap[cat.id] = { ...cat, subcategories: [] };
  });

  categories.forEach(cat => {
    if (cat.parentId) {
      if (categoriesMap[cat.parentId]) {
        categoriesMap[cat.parentId].subcategories.push(categoriesMap[cat.id]);
      }
    } else {
      rootCategories.push(categoriesMap[cat.id]);
    }
  });

  return rootCategories;
}
```

---

### Suppression en cascade

```javascript
async function deleteCategory(id) {
  // 1. Récupérer tous les enfants (récursif)
  const childrenIds = await getAllChildrenIds(id);

  // 2. Supprimer tous les enfants + la catégorie elle-même
  const allIds = [id, ...childrenIds];

  await db.query('DELETE FROM categories WHERE id IN (?)', [allIds]);

  return {
    success: true,
    message: 'Catégorie supprimée avec succès',
    deletedCount: allIds.length
  };
}

async function getAllChildrenIds(parentId) {
  const children = await db.query('SELECT id FROM categories WHERE parentId = ?', [parentId]);
  let allIds = [];

  for (const child of children) {
    allIds.push(child.id);
    const subChildren = await getAllChildrenIds(child.id);
    allIds = [...allIds, ...subChildren];
  }

  return allIds;
}
```

---

## 📝 Exemples de requêtes

### Exemple 1: Créer une structure complète

```javascript
// Scénario frontend:
// - Catégorie parent: "Téléphone" (nouvelle)
// - Sous-catégorie: "Coque" (nouvelle)
// - Variations: ["iPhone 13", "iPhone 14", "iPhone 15"]

// Backend implémentation:

async function createCategoryStructure(data) {
  const { parentName, parentDescription, childName, variations } = data;

  let createdCount = 0;
  let parentResult = null;
  let childResult = null;

  // 1. Créer ou récupérer le parent
  const existingParent = await db.query(
    'SELECT * FROM categories WHERE name = ? AND parentId IS NULL',
    [parentName.trim()]
  );

  if (existingParent.length > 0) {
    parentResult = existingParent[0];
  } else {
    const newParent = await createCategory({
      name: parentName,
      description: parentDescription,
      parentId: null,
      level: 0
    });
    parentResult = newParent.data;
    createdCount++;
  }

  // 2. Créer ou récupérer l'enfant
  if (childName && childName.trim()) {
    const existingChild = await db.query(
      'SELECT * FROM categories WHERE name = ? AND parentId = ?',
      [childName.trim(), parentResult.id]
    );

    if (existingChild.length > 0) {
      childResult = existingChild[0];
    } else {
      const newChild = await createCategory({
        name: childName,
        description: `Sous-catégorie de ${parentResult.name}`,
        parentId: parentResult.id,
        level: 1
      });
      childResult = newChild.data;
      createdCount++;
    }
  }

  // 3. Ajouter les variations
  const targetParentId = childResult ? childResult.id : parentResult.id;
  const skippedVariations = [];

  for (const variation of variations) {
    if (variation.trim()) {
      const existingVariation = await db.query(
        'SELECT * FROM categories WHERE name = ? AND parentId = ?',
        [variation.trim(), targetParentId]
      );

      if (existingVariation.length === 0) {
        await createCategory({
          name: variation.trim(),
          description: `Variation de ${childResult?.name || parentResult.name}`,
          parentId: targetParentId,
          level: childResult ? 2 : 1
        });
        createdCount++;
      } else {
        skippedVariations.push(variation);
      }
    }
  }

  return {
    success: true,
    createdCount,
    skippedVariations,
    message: `Structure créée avec succès ! ${createdCount} nouveaux éléments ajoutés.`
  };
}
```

---

### Exemple 2: Vérifier les doublons avant création

```javascript
async function checkDuplicateCategory(name, parentId = null) {
  const existing = await db.query(
    'SELECT * FROM categories WHERE name = ? AND parentId IS NOT DISTINCT FROM ?',
    [name.trim(), parentId]
  );

  return {
    exists: existing.length > 0,
    category: existing[0] || null
  };
}

// Utilisation:
const check = await checkDuplicateCategory('iPhone 13', 2);
if (check.exists) {
  console.log('La variation existe déjà:', check.category);
}
```

---

## 🔐 Validation et sécurité

### Validation des données

```javascript
function validateCategoryData(data) {
  const errors = [];

  // Nom obligatoire
  if (!data.name || !data.name.trim()) {
    errors.push('Le nom de la catégorie est obligatoire');
  }

  // Longueur max
  if (data.name && data.name.length > 255) {
    errors.push('Le nom ne doit pas dépasser 255 caractères');
  }

  // Level valide
  if (data.level !== undefined && ![0, 1, 2].includes(data.level)) {
    errors.push('Le niveau doit être 0, 1 ou 2');
  }

  // ParentId valide si fourni
  if (data.parentId && typeof data.parentId !== 'number') {
    errors.push('Le parentId doit être un nombre');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 🚀 Middleware d'authentification

```javascript
// Protéger les routes de création/modification/suppression
router.post('/api/categories', authenticateAdmin, async (req, res) => {
  // Seuls les admins peuvent créer des catégories
  const result = await createCategory(req.body);
  res.json(result);
});

router.put('/api/categories/:id', authenticateAdmin, async (req, res) => {
  const result = await updateCategory(req.params.id, req.body);
  res.json(result);
});

router.delete('/api/categories/:id', authenticateAdmin, async (req, res) => {
  const result = await deleteCategory(req.params.id);
  res.json(result);
});

// Lecture publique
router.get('/api/categories', async (req, res) => {
  const categories = await getCategoriesHierarchy();
  res.json(categories);
});
```

---

## 📊 Statistiques et métriques

### Compter les produits par catégorie

```javascript
async function getCategoriesWithProductCount() {
  const categories = await db.query(`
    SELECT
      c.*,
      COUNT(p.id) as productCount
    FROM categories c
    LEFT JOIN products p ON p.categoryId = c.id
    GROUP BY c.id
    ORDER BY c.level, c.order, c.name
  `);

  return categories;
}
```

---

## 🧪 Tests recommandés

### 1. Test de création

```javascript
test('Créer une catégorie parent', async () => {
  const result = await createCategory({
    name: 'Test Parent',
    description: 'Description test',
    parentId: null,
    level: 0
  });

  expect(result.success).toBe(true);
  expect(result.data.name).toBe('Test Parent');
  expect(result.data.level).toBe(0);
});
```

### 2. Test de doublon

```javascript
test('Empêcher la création de doublons', async () => {
  await createCategory({ name: 'Doublon', parentId: null });
  const result = await createCategory({ name: 'Doublon', parentId: null });

  expect(result.success).toBe(false);
  expect(result.error).toBe('DUPLICATE_CATEGORY');
});
```

### 3. Test de suppression en cascade

```javascript
test('Supprimer une catégorie avec ses enfants', async () => {
  const parent = await createCategory({ name: 'Parent', parentId: null });
  await createCategory({ name: 'Enfant1', parentId: parent.data.id });
  await createCategory({ name: 'Enfant2', parentId: parent.data.id });

  const result = await deleteCategory(parent.data.id);

  expect(result.deletedCount).toBe(3);
});
```

---

## 📦 Structure des fichiers recommandée

```
backend/
├── src/
│   ├── controllers/
│   │   └── categoryController.ts       # Logique des routes
│   ├── models/
│   │   └── Category.ts                 # Modèle de données
│   ├── services/
│   │   └── categoryService.ts          # Logique métier
│   ├── routes/
│   │   └── categoryRoutes.ts           # Définition des routes
│   ├── middlewares/
│   │   └── authMiddleware.ts           # Authentification
│   └── validators/
│       └── categoryValidator.ts        # Validation des données
└── database/
    └── migrations/
        └── 001_create_categories.sql   # Migration SQL
```

---

## 🎯 Points clés à retenir

1. **Unicité**: Utiliser la contrainte `UNIQUE (name, parentId)` pour éviter les doublons
2. **Cascade**: Configurer `ON DELETE CASCADE` pour supprimer automatiquement les enfants
3. **Level automatique**: Calculer le level en fonction du parent
4. **Messages clairs**: Retourner des messages explicites (comme le frontend)
5. **Validation**: Toujours valider les données avant insertion
6. **Sécurité**: Protéger les routes de modification avec authentification admin

---

## 📞 Support

Pour toute question sur l'implémentation, référez-vous au code frontend dans:
- `src/pages/CategoryManagement.tsx` - Interface de gestion
- `src/contexts/CategoryContext.tsx` - Logique frontend
- `src/services/api.ts` - Appels API

