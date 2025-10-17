# Guide d'Implémentation Backend - Gestion des Sous-catégories et Variations

Ce guide détaille l'implémentation complète côté backend pour gérer les sous-catégories et variations dans PrintAlma, en se basant sur les données envoyées par le frontend.

## 📊 Données Frontend Actuelles

Le frontend envoie ces structures de données :

### Sous-catégorie (level 1)
```javascript
{
  name: 'ferfref',           // string - Requis
  description: 'fefrer',     // string - Optionnel
  parentId: 4,               // number - ID de la catégorie parente
  level: 1                   // number - Toujours 1 pour sous-catégorie
}
```

### Variation (level 2)
```javascript
{
  name: 'erfer',             // string - Requis
  parentId: 6,               // number - ID de la sous-catégorie parente
  level: 2                   // number - Toujours 2 pour variation
}
```

## 🗄️ Schéma de Base de Données

### 1. Table Categories (structure unifiée recommandée)
```sql
-- Table unifiée pour gérer tous les niveaux
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0,    -- 0: catégorie, 1: sous-catégorie, 2: variation
  parent_id INTEGER NULL,              -- NULL pour les catégories principales
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Index pour les performances
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Contrainte pour éviter les doublons au même niveau
CREATE UNIQUE INDEX idx_categories_unique_name_level
ON categories(name, parent_id, level)
WHERE is_active = true;
```

### 2. Migration depuis la structure existante
Si vous avez déjà une table `categories` basique :

```sql
-- Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_id INTEGER NULL,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Créer les index manquants
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);

-- Ajouter la contrainte de clé étrangère
ALTER TABLE categories
ADD CONSTRAINT fk_categories_parent
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;
```

## 🔧 Contrôleurs Backend

### Structure des fichiers recommandée
```
backend/
├── controllers/
│   └── categoryController.js
├── services/
│   └── categoryService.js
├── models/
│   └── Category.js
├── routes/
│   └── categories.js
├── middleware/
│   ├── auth.js
│   └── validation.js
└── database/
    └── connection.js
```

### 1. Connexion Base de Données (SQLite exemple)

```javascript
// database/connection.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/printalma.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur connexion DB:', err);
  } else {
    console.log('Connecté à la base de données SQLite');
    initializeTables();
  }
});

function initializeTables() {
  // Créer la table categories si elle n'existe pas
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      level INTEGER NOT NULL DEFAULT 0,
      parent_id INTEGER NULL,
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // Créer les index
  db.run(`CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`);
}

module.exports = db;
```

### 2. Service Category

```javascript
// services/categoryService.js
const db = require('../database/connection');
const { promisify } = require('util');

// Promisify les méthodes db pour utiliser async/await
const dbRun = promisify(db.run).bind(db);
const dbGet = promisify(db.get).bind(db);
const dbAll = promisify(db.all).bind(db);

class CategoryService {
  /**
   * Créer une sous-catégorie (level 1)
   */
  async createSubCategory(data) {
    const { name, description, parentId } = data;

    // Validation de l'existence de la catégorie parente
    const parentCategory = await dbGet(
      'SELECT * FROM categories WHERE id = ? AND level = 0 AND is_active = 1',
      [parentId]
    );

    if (!parentCategory) {
      throw new Error('CATEGORY_NOT_FOUND');
    }

    // Vérification des doublons
    const existingCategory = await dbGet(
      'SELECT id FROM categories WHERE name = ? AND parent_id = ? AND level = 1 AND is_active = 1',
      [name.trim(), parentId]
    );

    if (existingCategory) {
      throw new Error('DUPLICATE_SUBCATEGORY');
    }

    // Génération du slug unique
    const slug = await this.generateUniqueSlug(name.trim(), parentId);

    // Calcul du display_order
    const maxOrderResult = await dbGet(
      'SELECT MAX(display_order) as max_order FROM categories WHERE parent_id = ? AND level = 1',
      [parentId]
    );

    const displayOrder = (maxOrderResult.max_order || 0) + 1;

    // Insertion de la sous-catégorie
    const result = await dbRun(`
      INSERT INTO categories (name, slug, description, level, parent_id, display_order, is_active)
      VALUES (?, ?, ?, 1, ?, ?, 1)
    `, [name.trim(), slug, description?.trim() || null, parentId, displayOrder]);

    // Récupérer la sous-catégorie créée
    const subCategory = await dbGet(
      'SELECT * FROM categories WHERE id = ?',
      [result.lastID]
    );

    return subCategory;
  }

  /**
   * Créer une variation (level 2)
   */
  async createVariation(data) {
    const { name, parentId } = data;

    // Validation de l'existence de la sous-catégorie parente
    const parentSubCategory = await dbGet(
      'SELECT * FROM categories WHERE id = ? AND level = 1 AND is_active = 1',
      [parentId]
    );

    if (!parentSubCategory) {
      throw new Error('SUBCATEGORY_NOT_FOUND');
    }

    // Vérification des doublons
    const existingVariation = await dbGet(
      'SELECT id FROM categories WHERE name = ? AND parent_id = ? AND level = 2 AND is_active = 1',
      [name.trim(), parentId]
    );

    if (existingVariation) {
      throw new Error('DUPLICATE_VARIATION');
    }

    // Génération du slug unique
    const slug = await this.generateUniqueSlug(name.trim(), parentId);

    // Calcul du display_order
    const maxOrderResult = await dbGet(
      'SELECT MAX(display_order) as max_order FROM categories WHERE parent_id = ? AND level = 2',
      [parentId]
    );

    const displayOrder = (maxOrderResult.max_order || 0) + 1;

    // Insertion de la variation
    const result = await dbRun(`
      INSERT INTO categories (name, slug, description, level, parent_id, display_order, is_active)
      VALUES (?, ?, null, 2, ?, ?, 1)
    `, [name.trim(), slug, parentId, displayOrder]);

    // Récupérer la variation créée
    const variation = await dbGet(
      'SELECT * FROM categories WHERE id = ?',
      [result.lastID]
    );

    return variation;
  }

  /**
   * Créer plusieurs variations en lot
   */
  async createVariationsBatch(data) {
    const { variations } = data;
    const results = {
      created: [],
      skipped: [],
      duplicates: []
    };

    for (const variationData of variations) {
      try {
        const variation = await this.createVariation(variationData);
        results.created.push(variation);
      } catch (error) {
        if (error.message === 'DUPLICATE_VARIATION') {
          results.duplicates.push({
            name: variationData.name,
            reason: 'Doublon existant'
          });
        }
        results.skipped.push(variationData.name);
      }
    }

    return results;
  }

  /**
   * Générer un slug unique
   */
  async generateUniqueSlug(name, parentId) {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await dbGet('SELECT id FROM categories WHERE slug = ?', [slug])) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Récupérer la hiérarchie complète
   */
  async getHierarchy() {
    const categories = await dbAll(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.level,
        c.parent_id,
        c.display_order,
        c.is_active,
        c.created_at,
        c.updated_at
      FROM categories c
      WHERE c.is_active = 1
      ORDER BY c.level, c.parent_id, c.display_order
    `);

    // Construire l'arborescence
    const hierarchy = this.buildHierarchy(categories);

    return hierarchy;
  }

  /**
   * Construire l'arborescence à partir de la liste plate
   */
  buildHierarchy(categories) {
    const categoryMap = {};
    const rootCategories = [];

    // Créer une map de toutes les catégories
    categories.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        subCategories: [],
        variations: []
      };
    });

    // Organiser en arborescence
    categories.forEach(category => {
      if (category.level === 0) {
        rootCategories.push(categoryMap[category.id]);
      } else if (category.parent_id && categoryMap[category.parent_id]) {
        if (category.level === 1) {
          categoryMap[category.parent_id].subCategories.push(categoryMap[category.id]);
        } else if (category.level === 2) {
          // Trouver la sous-catégorie parente
          const parent = categoryMap[category.parent_id];
          if (parent && parent.parent_id && categoryMap[parent.parent_id]) {
            categoryMap[parent.parent_id].variations.push(categoryMap[category.id]);
          }
        }
      }
    });

    return rootCategories;
  }

  /**
   * Récupérer une catégorie par ID avec ses parents
   */
  async getCategoryById(id) {
    const category = await dbGet(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND');
    }

    // Récupérer les informations du parent si existant
    if (category.parent_id) {
      category.parent = await dbGet(
        'SELECT id, name, slug, level FROM categories WHERE id = ? AND is_active = 1',
        [category.parent_id]
      );
    }

    return category;
  }

  /**
   * Vérifier si une catégorie peut être supprimée
   */
  async canDeleteCategory(categoryId) {
    const childrenCount = await dbGet(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ? AND is_active = 1',
      [categoryId]
    );

    if (childrenCount.count > 0) {
      throw new Error('CATEGORY_HAS_CHILDREN');
    }

    return true;
  }
}

module.exports = new CategoryService();
```

### 3. Contrôleur Category

```javascript
// controllers/categoryController.js
const categoryService = require('../services/categoryService');

class CategoryController {
  /**
   * Créer une sous-catégorie
   * POST /api/categories/subcategory
   */
  async createSubCategory(req, res) {
    try {
      const { name, description, parentId, level } = req.body;

      // Validation basique
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_NAME',
          message: 'Le nom est requis'
        });
      }

      if (!parentId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_PARENT_ID',
          message: 'L\'ID de la catégorie parente est requis'
        });
      }

      if (level !== 1) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_LEVEL',
          message: 'Le niveau doit être 1 pour une sous-catégorie'
        });
      }

      const subCategory = await categoryService.createSubCategory({
        name: name.trim(),
        description: description?.trim() || null,
        parentId: parseInt(parentId),
        level: 1
      });

      res.status(201).json({
        success: true,
        message: 'Sous-catégorie créée avec succès',
        data: subCategory
      });

    } catch (error) {
      console.error('Erreur création sous-catégorie:', error);

      let statusCode = 500;
      let errorResponse = {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la création de la sous-catégorie'
      };

      if (error.message === 'CATEGORY_NOT_FOUND') {
        statusCode = 404;
        errorResponse = {
          success: false,
          error: 'CATEGORY_NOT_FOUND',
          message: 'La catégorie parente n\'existe pas'
        };
      } else if (error.message === 'DUPLICATE_SUBCATEGORY') {
        statusCode = 400;
        errorResponse = {
          success: false,
          error: 'DUPLICATE_SUBCATEGORY',
          message: 'Une sous-catégorie avec ce nom existe déjà dans cette catégorie'
        };
      }

      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * Créer une variation
   * POST /api/categories/variation
   */
  async createVariation(req, res) {
    try {
      const { name, parentId, level } = req.body;

      // Validation basique
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_NAME',
          message: 'Le nom est requis'
        });
      }

      if (!parentId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_PARENT_ID',
          message: 'L\'ID de la sous-catégorie parente est requis'
        });
      }

      if (level !== 2) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_LEVEL',
          message: 'Le niveau doit être 2 pour une variation'
        });
      }

      const variation = await categoryService.createVariation({
        name: name.trim(),
        parentId: parseInt(parentId),
        level: 2
      });

      res.status(201).json({
        success: true,
        message: 'Variation créée avec succès',
        data: variation
      });

    } catch (error) {
      console.error('Erreur création variation:', error);

      let statusCode = 500;
      let errorResponse = {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la création de la variation'
      };

      if (error.message === 'SUBCATEGORY_NOT_FOUND') {
        statusCode = 404;
        errorResponse = {
          success: false,
          error: 'SUBCATEGORY_NOT_FOUND',
          message: 'La sous-catégorie parente n\'existe pas'
        };
      } else if (error.message === 'DUPLICATE_VARIATION') {
        statusCode = 400;
        errorResponse = {
          success: false,
          error: 'DUPLICATE_VARIATION',
          message: 'Une variation avec ce nom existe déjà dans cette sous-catégorie'
        };
      }

      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * Créer plusieurs variations en lot
   * POST /api/categories/variations/batch
   */
  async createVariationsBatch(req, res) {
    try {
      const { variations } = req.body;

      if (!variations || !Array.isArray(variations) || variations.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_VARIATIONS',
          message: 'Le tableau des variations est requis et ne doit pas être vide'
        });
      }

      const results = await categoryService.createVariationsBatch({ variations });

      res.status(201).json({
        success: true,
        message: `${results.created.length} variation(s) créée(s) avec succès`,
        data: results
      });

    } catch (error) {
      console.error('Erreur création variations en lot:', error);

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la création des variations'
      });
    }
  }

  /**
   * Récupérer la hiérarchie complète
   * GET /api/categories/hierarchy
   */
  async getHierarchy(req, res) {
    try {
      const hierarchy = await categoryService.getHierarchy();

      res.json({
        success: true,
        data: hierarchy
      });

    } catch (error) {
      console.error('Erreur récupération hiérarchie:', error);

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération de la hiérarchie'
      });
    }
  }

  /**
   * Récupérer une catégorie par ID
   * GET /api/categories/:id
   */
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(parseInt(id));

      res.json({
        success: true,
        data: category
      });

    } catch (error) {
      console.error('Erreur récupération catégorie:', error);

      let statusCode = 500;
      let errorResponse = {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erreur lors de la récupération de la catégorie'
      };

      if (error.message === 'CATEGORY_NOT_FOUND') {
        statusCode = 404;
        errorResponse = {
          success: false,
          error: 'CATEGORY_NOT_FOUND',
          message: 'La catégorie n\'existe pas'
        };
      }

      res.status(statusCode).json(errorResponse);
    }
  }
}

module.exports = new CategoryController();
```

### 4. Middleware d'Authentification (optionnel)

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'NO_TOKEN',
      message: 'Token d\'authentification requis'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Token invalide'
    });
  }
};

module.exports = authMiddleware;
```

### 5. Routes

```javascript
// routes/categories.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

// Routes publiques
router.get('/hierarchy', categoryController.getHierarchy);
router.get('/:id', categoryController.getCategoryById);

// Routes protégées (requièrent authentification)
router.post('/subcategory', authMiddleware, categoryController.createSubCategory);
router.post('/variation', authMiddleware, categoryController.createVariation);
router.post('/variations/batch', authMiddleware, categoryController.createVariationsBatch);

module.exports = router;
```

### 6. Serveur Principal

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/categories', categoryRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend PrintAlma opérationnel',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Erreur interne du serveur'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔍 Santé du serveur: http://localhost:${PORT}/api/health`);
});
```

## 🔄 Intégration avec le Frontend

### Mise à jour du service frontend

Dans `CategoryManagement.tsx`, remplacez les TODO existants :

```typescript
// Remplacer la fonction handleSaveSubCategory
const handleSaveSubCategory = async () => {
  if (!selectedParentCategory || !newSubCategory.name.trim()) return;

  setIsEditing(true);

  try {
    const response = await fetch(`${API_BASE}/api/categories/subcategory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: newSubCategory.name,
        description: newSubCategory.description,
        parentId: selectedParentCategory.id,
        level: 1
      })
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Sous-catégorie créée avec succès');
      refreshData(); // Recharger les catégories depuis le contexte
      setShowAddSubCategoryModal(false);
      setNewSubCategory({ name: '', description: '' });
      setSelectedParentCategory(null);
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    console.error('Erreur création sous-catégorie:', error);
    toast.error('Erreur lors de la création de la sous-catégorie');
  } finally {
    setIsEditing(false);
  }
};

// Remplacer la fonction handleSaveAllVariations
const handleSaveAllVariations = async () => {
  if (!selectedParentSubCategory || variationsToAdd.length === 0) return;

  setIsEditing(true);

  try {
    const response = await fetch(`${API_BASE}/api/categories/variations/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        variations: variationsToAdd.map(name => ({
          name: name.trim(),
          parentId: selectedParentSubCategory.id,
          level: 2
        }))
      })
    });

    const result = await response.json();

    if (result.success) {
      const createdCount = result.data.created.length;
      const skippedCount = result.data.skipped.length;

      if (createdCount > 0) {
        toast.success(`${createdCount} variation(s) créée(s) avec succès`);
      }

      if (skippedCount > 0) {
        toast.warning(`${skippedCount} variation(s) ignorée(s) (doublons)`);
      }

      refreshData(); // Recharger les catégories depuis le contexte
      setShowAddVariationModal(false);
      setVariationsToAdd([]);
      setCurrentVariationInput('');
      setSelectedParentSubCategory(null);
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    console.error('Erreur création variations:', error);
    toast.error('Erreur lors de la création des variations');
  } finally {
    setIsEditing(false);
  }
};
```

## ✅ Checklist d'Implémentation

### Backend
- [ ] Configurer la base de données SQLite
- [ ] Créer la table `categories` avec les colonnes `level` et `parent_id`
- [ ] Implémenter le service `CategoryService`
- [ ] Créer le contrôleur `CategoryController`
- [ ] Configurer les routes API
- [ ] Ajouter le middleware CORS pour le frontend
- [ ] Tester tous les endpoints avec Postman/curl

### Base de Données
- [ ] Exécuter la migration SQL
- [ ] Insérer quelques catégories de test (niveau 0)
- [ ] Vérifier les contraintes et index

### Tests
```bash
# Tests avec curl
curl -X GET http://localhost:3004/api/health

# Créer une sous-catégorie
curl -X POST http://localhost:3004/api/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{"name":"T-Shirts","description":"T-shirts coton","parentId":1,"level":1}' \
  --cookie-jar cookies.txt

# Créer plusieurs variations
curl -X POST http://localhost:3004/api/categories/variations/batch \
  -H "Content-Type: application/json" \
  -d '{"variations":[{"name":"Col V","parentId":1,"level":2},{"name":"Col Rond","parentId":1,"level":2}]}' \
  --cookie cookies.txt

# Récupérer la hiérarchie
curl -X GET http://localhost:3004/api/categories/hierarchy
```

### Frontend
- [ ] Mettre à jour les appels API dans `CategoryManagement.tsx`
- [ ] Tester l'intégration complète
- [ ] Vérifier l'affichage des messages d'erreur
- [ ] Valider le rafraîchissement des données après création

### Déploiement
- [ ] Configurer les variables d'environnement
- [ ] Ajouter le logging pour le debugging
- [ ] Configurer la sauvegarde de la base de données
- [ ] Documenter l'API pour l'équipe frontend

---

Ce guide fournit une implémentation backend complète avec SQLite, express et node.js pour gérer les sous-catégories et variations. Le code est prêt à être utilisé et testé.