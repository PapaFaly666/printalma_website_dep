# 🔧 Guide d'Intégration Backend - Système de Thèmes Tendances

## Vue d'ensemble

Ce guide explique exactement ce que le backend doit implémenter pour que le système de thèmes tendances fonctionne.

---

## 📋 Table des matières

1. [Modifications de la Base de Données](#1-modifications-de-la-base-de-données)
2. [Endpoints API à Créer](#2-endpoints-api-à-créer)
3. [Exemples de Code](#3-exemples-de-code)
4. [Tests à Effectuer](#4-tests-à-effectuer)
5. [Cas d'Usage](#5-cas-dusage)

---

## 1. Modifications de la Base de Données

### 1.1 Ajouter les Colonnes

Ajoutez deux nouvelles colonnes à la table `design_categories` :

```sql
ALTER TABLE design_categories
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_order INTEGER DEFAULT NULL;
```

### 1.2 Ajouter un Index (Recommandé)

Pour optimiser les performances des requêtes :

```sql
CREATE INDEX idx_design_categories_featured
ON design_categories(is_featured, featured_order)
WHERE is_featured = TRUE;
```

### 1.3 Structure de la Table (Après Modification)

```sql
design_categories
├── id (INTEGER, PRIMARY KEY)
├── name (VARCHAR)
├── description (TEXT, NULLABLE)
├── slug (VARCHAR, UNIQUE)
├── cover_image_url (VARCHAR, NULLABLE)
├── is_active (BOOLEAN, DEFAULT TRUE)
├── sort_order (INTEGER, NULLABLE)
├── design_count (INTEGER, DEFAULT 0)
├── created_by (INTEGER, FOREIGN KEY -> users.id)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── is_featured (BOOLEAN, DEFAULT FALSE)      ← NOUVEAU
└── featured_order (INTEGER, NULLABLE)        ← NOUVEAU
```

---

## 2. Endpoints API à Créer

### 2.1 GET `/design-categories/featured` (Public)

**Description** : Récupère les thèmes marqués comme "tendances" pour affichage sur le landing page.

**Authentification** : ❌ Aucune (endpoint public)

**Réponse** : Tableau de catégories (max 5)

#### Spécifications

```
Method: GET
URL: /design-categories/featured
Headers: Aucun requis
Response Status: 200 OK
Response Type: application/json
```

#### Logique Serveur

```
1. Requête SQL :
   SELECT * FROM design_categories
   WHERE is_featured = TRUE
   AND is_active = TRUE
   ORDER BY featured_order ASC
   LIMIT 5

2. Inclure les relations (si applicable) :
   - creator (id, firstName, lastName)

3. Retourner le JSON
```

#### Format de Réponse

```json
[
  {
    "id": 1,
    "name": "MANGAS ET ANIME",
    "description": "Thèmes inspirés des mangas et anime japonais",
    "slug": "mangas-et-anime",
    "coverImageUrl": "https://cdn.example.com/images/mangas-cover.jpg",
    "isActive": true,
    "sortOrder": 1,
    "designCount": 45,
    "isFeatured": true,
    "featuredOrder": 1,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-20T14:22:00.000Z",
    "creator": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "Principal"
    }
  },
  {
    "id": 5,
    "name": "RAP",
    "description": "Hip-hop et culture rap",
    "slug": "rap",
    "coverImageUrl": "https://cdn.example.com/images/rap-cover.jpg",
    "isActive": true,
    "sortOrder": 5,
    "designCount": 32,
    "isFeatured": true,
    "featuredOrder": 2,
    "createdAt": "2025-01-16T09:15:00.000Z",
    "updatedAt": "2025-01-20T14:22:00.000Z",
    "creator": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "Principal"
    }
  }
  // ... jusqu'à 5 thèmes maximum
]
```

#### Cas Particuliers

```json
// Si aucun thème n'est en vedette
[]

// Status: 200 OK (pas d'erreur, juste un tableau vide)
```

---

### 2.2 PUT `/design-categories/admin/featured` (Admin)

**Description** : Met à jour la configuration des thèmes en vedette (lesquels et dans quel ordre).

**Authentification** : ✅ Requise (Admin uniquement)

**Body** : Tableau d'IDs de catégories dans l'ordre souhaité

#### Spécifications

```
Method: PUT
URL: /design-categories/admin/featured
Headers:
  - Authorization: Bearer {admin_token}
  - Content-Type: application/json
Body: { "categoryIds": [1, 5, 3, 8, 2] }
Response Status: 200 OK
Response Type: application/json
```

#### Format du Body

```json
{
  "categoryIds": [1, 5, 3, 8, 2]
}
```

**Notes** :
- L'ordre dans le tableau est important (index 0 = position #1, index 1 = position #2, etc.)
- Maximum 5 IDs
- Les IDs doivent exister dans la table `design_categories`
- Les IDs doivent correspondre à des catégories actives (`is_active = TRUE`)

#### Logique Serveur (Étape par Étape)

```
1. Validation de l'authentification
   - Vérifier que l'utilisateur est admin
   - Si non : retourner 401 Unauthorized ou 403 Forbidden

2. Validation du body
   - Vérifier que categoryIds est un tableau
   - Vérifier que le tableau contient max 5 éléments
   - Si validation échoue : retourner 400 Bad Request

3. Validation des IDs
   - Vérifier que tous les IDs existent dans design_categories
   - Vérifier que tous les IDs correspondent à des catégories actives
   - Si validation échoue : retourner 400 Bad Request

4. Transaction de mise à jour (IMPORTANT : utiliser une transaction)

   BEGIN TRANSACTION;

   a) Réinitialiser tous les thèmes
      UPDATE design_categories
      SET is_featured = FALSE,
          featured_order = NULL
      WHERE is_featured = TRUE;

   b) Marquer les nouveaux thèmes (boucle pour chaque ID)
      Pour i = 0 à length(categoryIds) - 1 :
        UPDATE design_categories
        SET is_featured = TRUE,
            featured_order = i + 1
        WHERE id = categoryIds[i];

   COMMIT TRANSACTION;

   En cas d'erreur : ROLLBACK TRANSACTION;

5. Récupérer et retourner les thèmes mis à jour
   SELECT * FROM design_categories
   WHERE is_featured = TRUE
   ORDER BY featured_order ASC
```

#### Format de Réponse (Succès)

```json
[
  {
    "id": 1,
    "name": "MANGAS ET ANIME",
    "description": "Thèmes inspirés des mangas et anime japonais",
    "slug": "mangas-et-anime",
    "coverImageUrl": "https://cdn.example.com/images/mangas-cover.jpg",
    "isActive": true,
    "sortOrder": 1,
    "designCount": 45,
    "isFeatured": true,
    "featuredOrder": 1,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-20T14:25:00.000Z",
    "creator": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "Principal"
    }
  },
  {
    "id": 5,
    "name": "RAP",
    "description": "Hip-hop et culture rap",
    "slug": "rap",
    "coverImageUrl": "https://cdn.example.com/images/rap-cover.jpg",
    "isActive": true,
    "sortOrder": 5,
    "designCount": 32,
    "isFeatured": true,
    "featuredOrder": 2,
    "createdAt": "2025-01-16T09:15:00.000Z",
    "updatedAt": "2025-01-20T14:25:00.000Z",
    "creator": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "Principal"
    }
  }
  // ... les 5 thèmes dans l'ordre configuré
]
```

#### Erreurs Possibles

```json
// 401 Unauthorized - Token manquant ou invalide
{
  "error": "Unauthorized",
  "message": "Token d'authentification manquant ou invalide"
}

// 403 Forbidden - Utilisateur non admin
{
  "error": "Forbidden",
  "message": "Accès réservé aux administrateurs"
}

// 400 Bad Request - Validation échouée
{
  "error": "Validation Error",
  "message": "Maximum 5 thèmes autorisés"
}

// 400 Bad Request - ID invalide
{
  "error": "Validation Error",
  "message": "La catégorie avec l'ID 999 n'existe pas"
}

// 400 Bad Request - Catégorie inactive
{
  "error": "Validation Error",
  "message": "La catégorie 'NATURE' est inactive et ne peut pas être en vedette"
}

// 500 Internal Server Error - Erreur serveur
{
  "error": "Internal Server Error",
  "message": "Erreur lors de la mise à jour des thèmes en vedette"
}
```

---

## 3. Exemples de Code

### 3.1 Node.js + Express + PostgreSQL (Prisma)

#### Modèle Prisma

```prisma
// schema.prisma
model DesignCategory {
  id              Int       @id @default(autoincrement())
  name            String
  description     String?
  slug            String    @unique
  coverImageUrl   String?   @map("cover_image_url")
  isActive        Boolean   @default(true) @map("is_active")
  sortOrder       Int?      @map("sort_order")
  designCount     Int       @default(0) @map("design_count")
  isFeatured      Boolean   @default(false) @map("is_featured")     // NOUVEAU
  featuredOrder   Int?      @map("featured_order")                  // NOUVEAU
  createdBy       Int       @map("created_by")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  creator         User      @relation(fields: [createdBy], references: [id])
  designs         Design[]

  @@index([isFeatured, featuredOrder], name: "idx_featured")
  @@map("design_categories")
}
```

#### Routes

```javascript
// routes/designCategories.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /design-categories/featured (Public)
router.get('/featured', async (req, res) => {
  try {
    const featuredCategories = await prisma.designCategory.findMany({
      where: {
        isFeatured: true,
        isActive: true
      },
      orderBy: {
        featuredOrder: 'asc'
      },
      take: 5,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(featuredCategories);
  } catch (error) {
    console.error('Error fetching featured categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors du chargement des thèmes en vedette'
    });
  }
});

// PUT /design-categories/admin/featured (Admin only)
router.put('/admin/featured', authenticateAdmin, async (req, res) => {
  try {
    const { categoryIds } = req.body;

    // Validation
    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'categoryIds doit être un tableau'
      });
    }

    if (categoryIds.length > 5) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Maximum 5 thèmes autorisés'
      });
    }

    // Vérifier que tous les IDs existent et sont actifs
    const categories = await prisma.designCategory.findMany({
      where: {
        id: { in: categoryIds }
      }
    });

    if (categories.length !== categoryIds.length) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Un ou plusieurs IDs de catégories sont invalides'
      });
    }

    const inactiveCategories = categories.filter(cat => !cat.isActive);
    if (inactiveCategories.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Les catégories suivantes sont inactives: ${inactiveCategories.map(c => c.name).join(', ')}`
      });
    }

    // Transaction pour mise à jour atomique
    const result = await prisma.$transaction(async (tx) => {
      // 1. Réinitialiser tous les thèmes
      await tx.designCategory.updateMany({
        where: { isFeatured: true },
        data: {
          isFeatured: false,
          featuredOrder: null
        }
      });

      // 2. Marquer les nouveaux thèmes avec leur ordre
      for (let i = 0; i < categoryIds.length; i++) {
        await tx.designCategory.update({
          where: { id: categoryIds[i] },
          data: {
            isFeatured: true,
            featuredOrder: i + 1
          }
        });
      }

      // 3. Récupérer les thèmes mis à jour
      return await tx.designCategory.findMany({
        where: { isFeatured: true },
        orderBy: { featuredOrder: 'asc' },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating featured categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la mise à jour des thèmes en vedette'
    });
  }
});

module.exports = router;
```

#### Middleware d'Authentification

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateAdmin = (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token d\'authentification manquant ou invalide'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que l'utilisateur est admin
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Accès réservé aux administrateurs'
      });
    }

    // Ajouter les infos de l'utilisateur à la requête
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token invalide ou expiré'
    });
  }
};

module.exports = { authenticateAdmin };
```

---

### 3.2 Node.js + Express + PostgreSQL (SQL brut)

```javascript
// routes/designCategories.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateAdmin } = require('../middleware/auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// GET /design-categories/featured (Public)
router.get('/featured', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        dc.*,
        json_build_object(
          'id', u.id,
          'firstName', u.first_name,
          'lastName', u.last_name
        ) as creator
      FROM design_categories dc
      LEFT JOIN users u ON dc.created_by = u.id
      WHERE dc.is_featured = TRUE
        AND dc.is_active = TRUE
      ORDER BY dc.featured_order ASC
      LIMIT 5
    `);

    // Transformer en camelCase pour le frontend
    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      slug: row.slug,
      coverImageUrl: row.cover_image_url,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      designCount: row.design_count,
      isFeatured: row.is_featured,
      featuredOrder: row.featured_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creator: row.creator
    }));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching featured categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors du chargement des thèmes en vedette'
    });
  }
});

// PUT /design-categories/admin/featured (Admin only)
router.put('/admin/featured', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const { categoryIds } = req.body;

    // Validation
    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'categoryIds doit être un tableau'
      });
    }

    if (categoryIds.length > 5) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Maximum 5 thèmes autorisés'
      });
    }

    // Vérifier que tous les IDs existent et sont actifs
    const checkResult = await client.query(
      'SELECT id, name, is_active FROM design_categories WHERE id = ANY($1)',
      [categoryIds]
    );

    if (checkResult.rows.length !== categoryIds.length) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Un ou plusieurs IDs de catégories sont invalides'
      });
    }

    const inactiveCategories = checkResult.rows.filter(cat => !cat.is_active);
    if (inactiveCategories.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Les catégories suivantes sont inactives: ${inactiveCategories.map(c => c.name).join(', ')}`
      });
    }

    // Transaction
    await client.query('BEGIN');

    // 1. Réinitialiser tous les thèmes
    await client.query(`
      UPDATE design_categories
      SET is_featured = FALSE,
          featured_order = NULL
      WHERE is_featured = TRUE
    `);

    // 2. Marquer les nouveaux thèmes avec leur ordre
    for (let i = 0; i < categoryIds.length; i++) {
      await client.query(`
        UPDATE design_categories
        SET is_featured = TRUE,
            featured_order = $1
        WHERE id = $2
      `, [i + 1, categoryIds[i]]);
    }

    // 3. Récupérer les thèmes mis à jour
    const result = await client.query(`
      SELECT
        dc.*,
        json_build_object(
          'id', u.id,
          'firstName', u.first_name,
          'lastName', u.last_name
        ) as creator
      FROM design_categories dc
      LEFT JOIN users u ON dc.created_by = u.id
      WHERE dc.is_featured = TRUE
      ORDER BY dc.featured_order ASC
    `);

    await client.query('COMMIT');

    // Transformer en camelCase
    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      slug: row.slug,
      coverImageUrl: row.cover_image_url,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      designCount: row.design_count,
      isFeatured: row.is_featured,
      featuredOrder: row.featured_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creator: row.creator
    }));

    res.json(categories);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating featured categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la mise à jour des thèmes en vedette'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
```

---

### 3.3 PHP + Laravel

#### Migration

```php
<?php
// database/migrations/2025_01_20_add_featured_to_design_categories.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFeaturedToDesignCategories extends Migration
{
    public function up()
    {
        Schema::table('design_categories', function (Blueprint $table) {
            $table->boolean('is_featured')->default(false);
            $table->integer('featured_order')->nullable();

            $table->index(['is_featured', 'featured_order'], 'idx_featured');
        });
    }

    public function down()
    {
        Schema::table('design_categories', function (Blueprint $table) {
            $table->dropIndex('idx_featured');
            $table->dropColumn(['is_featured', 'featured_order']);
        });
    }
}
```

#### Contrôleur

```php
<?php
// app/Http/Controllers/DesignCategoryController.php

namespace App\Http\Controllers;

use App\Models\DesignCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DesignCategoryController extends Controller
{
    // GET /design-categories/featured (Public)
    public function getFeatured()
    {
        try {
            $categories = DesignCategory::where('is_featured', true)
                ->where('is_active', true)
                ->orderBy('featured_order')
                ->limit(5)
                ->with('creator:id,first_name,last_name')
                ->get();

            return response()->json($categories);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'Erreur lors du chargement des thèmes en vedette'
            ], 500);
        }
    }

    // PUT /design-categories/admin/featured (Admin only)
    public function updateFeatured(Request $request)
    {
        // Validation
        $request->validate([
            'categoryIds' => 'required|array|max:5',
            'categoryIds.*' => 'integer|exists:design_categories,id'
        ]);

        $categoryIds = $request->categoryIds;

        // Vérifier que toutes les catégories sont actives
        $inactiveCount = DesignCategory::whereIn('id', $categoryIds)
            ->where('is_active', false)
            ->count();

        if ($inactiveCount > 0) {
            return response()->json([
                'error' => 'Validation Error',
                'message' => 'Une ou plusieurs catégories sont inactives'
            ], 400);
        }

        try {
            DB::beginTransaction();

            // 1. Réinitialiser tous les thèmes
            DesignCategory::where('is_featured', true)
                ->update([
                    'is_featured' => false,
                    'featured_order' => null
                ]);

            // 2. Marquer les nouveaux thèmes
            foreach ($categoryIds as $index => $categoryId) {
                DesignCategory::where('id', $categoryId)
                    ->update([
                        'is_featured' => true,
                        'featured_order' => $index + 1
                    ]);
            }

            DB::commit();

            // 3. Récupérer les thèmes mis à jour
            $categories = DesignCategory::where('is_featured', true)
                ->orderBy('featured_order')
                ->with('creator:id,first_name,last_name')
                ->get();

            return response()->json($categories);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'Erreur lors de la mise à jour des thèmes en vedette'
            ], 500);
        }
    }
}
```

#### Routes

```php
<?php
// routes/api.php

use App\Http\Controllers\DesignCategoryController;

// Route publique
Route::get('/design-categories/featured', [DesignCategoryController::class, 'getFeatured']);

// Route admin
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::put('/design-categories/admin/featured', [DesignCategoryController::class, 'updateFeatured']);
});
```

---

## 4. Tests à Effectuer

### 4.1 Tests de l'Endpoint GET `/design-categories/featured`

#### Test 1 : Récupération des thèmes en vedette

```bash
curl -X GET http://localhost:3004/design-categories/featured
```

**Résultat attendu** :
- Status 200
- Tableau JSON avec les thèmes featured (max 5)
- Thèmes triés par `featuredOrder`

#### Test 2 : Aucun thème en vedette

1. S'assurer qu'aucun thème n'est marqué comme featured
2. Appeler l'endpoint

**Résultat attendu** :
- Status 200
- Tableau vide `[]`

#### Test 3 : Performance

```bash
ab -n 1000 -c 10 http://localhost:3004/design-categories/featured
```

**Résultat attendu** : Réponse en moins de 100ms

---

### 4.2 Tests de l'Endpoint PUT `/design-categories/admin/featured`

#### Test 1 : Mise à jour réussie

```bash
curl -X PUT http://localhost:3004/design-categories/admin/featured \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryIds": [1, 5, 3, 8, 2]}'
```

**Résultat attendu** :
- Status 200
- Tableau JSON avec 5 thèmes
- `isFeatured = true` et `featuredOrder` correctement définis

#### Test 2 : Sans authentification

```bash
curl -X PUT http://localhost:3004/design-categories/admin/featured \
  -H "Content-Type: application/json" \
  -d '{"categoryIds": [1, 5, 3]}'
```

**Résultat attendu** :
- Status 401
- Message d'erreur

#### Test 3 : Avec token non-admin

```bash
curl -X PUT http://localhost:3004/design-categories/admin/featured \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryIds": [1, 5, 3]}'
```

**Résultat attendu** :
- Status 403
- Message d'erreur

#### Test 4 : Plus de 5 thèmes

```bash
curl -X PUT http://localhost:3004/design-categories/admin/featured \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryIds": [1, 2, 3, 4, 5, 6]}'
```

**Résultat attendu** :
- Status 400
- Message "Maximum 5 thèmes autorisés"

#### Test 5 : ID invalide

```bash
curl -X PUT http://localhost:3004/design-categories/admin/featured \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryIds": [1, 999]}'
```

**Résultat attendu** :
- Status 400
- Message d'erreur sur ID invalide

#### Test 6 : Catégorie inactive

1. Créer une catégorie avec `is_active = false`
2. Essayer de la marquer comme featured

**Résultat attendu** :
- Status 400
- Message d'erreur sur catégorie inactive

#### Test 7 : Vérification de la transaction

1. Simuler une erreur pendant la mise à jour
2. Vérifier que les changements sont annulés (ROLLBACK)

**Résultat attendu** :
- Aucun changement dans la base de données

---

### 4.3 Tests d'Intégration

#### Test 1 : Workflow complet

```bash
# 1. Créer 7 thèmes via l'interface admin

# 2. Marquer 5 thèmes comme featured
curl -X PUT http://localhost:3004/design-categories/admin/featured \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryIds": [1, 2, 3, 4, 5]}'

# 3. Vérifier l'affichage public
curl -X GET http://localhost:3004/design-categories/featured

# 4. Changer l'ordre
curl -X PUT http://localhost:3004/design-categories/admin/featured \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryIds": [5, 4, 3, 2, 1]}'

# 5. Vérifier que l'ordre a changé
curl -X GET http://localhost:3004/design-categories/featured
```

#### Test 2 : Cache (si implémenté)

```bash
# 1. Appeler GET plusieurs fois rapidement
for i in {1..10}; do
  curl -X GET http://localhost:3004/design-categories/featured
done

# 2. Mettre à jour la configuration
curl -X PUT http://localhost:3004/design-categories/admin/featured \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryIds": [1, 2, 3, 4, 5]}'

# 3. Vérifier que le cache est invalidé
curl -X GET http://localhost:3004/design-categories/featured
```

---

## 5. Cas d'Usage

### Cas 1 : Configuration Initiale

**Scénario** : L'admin configure les thèmes tendances pour la première fois.

```sql
-- État initial
SELECT id, name, is_featured, featured_order
FROM design_categories;

-- Résultat:
 id |   name   | is_featured | featured_order
----+----------+-------------+----------------
  1 | MANGAS   | false       | null
  2 | RAP      | false       | null
  3 | GAMING   | false       | null
  4 | MUSIQUE  | false       | null
  5 | ART      | false       | null
```

**Action** : Admin appelle PUT avec `[1, 2, 3, 4, 5]`

```sql
-- État après
SELECT id, name, is_featured, featured_order
FROM design_categories;

-- Résultat:
 id |   name   | is_featured | featured_order
----+----------+-------------+----------------
  1 | MANGAS   | true        | 1
  2 | RAP      | true        | 2
  3 | GAMING   | true        | 3
  4 | MUSIQUE  | true        | 4
  5 | ART      | true        | 5
```

---

### Cas 2 : Changement d'Ordre

**État initial** :
```
#1 MANGAS
#2 RAP
#3 GAMING
#4 MUSIQUE
#5 ART
```

**Action** : Admin réorganise en `[5, 1, 3, 2, 4]`

**État après** :
```
#1 ART       (était #5)
#2 MANGAS    (était #1)
#3 GAMING    (était #3)
#4 RAP       (était #2)
#5 MUSIQUE   (était #4)
```

---

### Cas 3 : Remplacement d'un Thème

**État initial** :
```
#1 MANGAS
#2 RAP
#3 GAMING
#4 MUSIQUE
#5 ART
```

**Action** : Admin veut remplacer GAMING par SPORT (id=6)
- Nouveau tableau : `[1, 2, 6, 4, 5]`

**État après** :
```
#1 MANGAS
#2 RAP
#3 SPORT     (remplace GAMING)
#4 MUSIQUE
#5 ART
```

**Ce qui se passe en BDD** :
```sql
-- GAMING passe à is_featured = false
-- SPORT passe à is_featured = true avec featured_order = 3
```

---

### Cas 4 : Réduction du Nombre de Thèmes

**État initial** : 5 thèmes featured

**Action** : Admin ne veut plus que 3 thèmes
- Nouveau tableau : `[1, 2, 3]`

**État après** :
```
#1 MANGAS
#2 RAP
#3 GAMING
(MUSIQUE et ART ne sont plus featured)
```

---

## 6. Sécurité

### 6.1 Authentification

✅ **Endpoint GET** : Aucune authentification requise (public)

✅ **Endpoint PUT** : Authentification admin obligatoire

### 6.2 Validation

✅ Vérifier le type des paramètres
✅ Limiter à 5 thèmes maximum
✅ Vérifier l'existence des IDs
✅ Vérifier que les catégories sont actives
✅ Utiliser des transactions pour l'atomicité

### 6.3 Protection

✅ Rate limiting recommandé sur l'endpoint PUT
✅ CORS configuré correctement
✅ Sanitisation des entrées
✅ Logs des actions admin

---

## 7. Performance

### 7.1 Index Recommandé

```sql
CREATE INDEX idx_design_categories_featured
ON design_categories(is_featured, featured_order)
WHERE is_featured = TRUE;
```

### 7.2 Cache (Optionnel)

Pour l'endpoint GET `/featured`, un cache de 5-10 minutes est recommandé :

```javascript
// Exemple avec Redis
const redis = require('redis');
const client = redis.createClient();

router.get('/featured', async (req, res) => {
  const cacheKey = 'featured_categories';

  // Essayer de récupérer depuis le cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Sinon, récupérer depuis la BDD
  const categories = await prisma.designCategory.findMany({...});

  // Mettre en cache pour 5 minutes
  await client.setEx(cacheKey, 300, JSON.stringify(categories));

  res.json(categories);
});

// Invalider le cache après mise à jour
router.put('/admin/featured', authenticateAdmin, async (req, res) => {
  // ... logique de mise à jour ...

  // Invalider le cache
  await client.del('featured_categories');

  res.json(result);
});
```

### 7.3 Monitoring

Surveillez :
- Temps de réponse de GET `/featured` (devrait être < 100ms)
- Nombre de requêtes par seconde
- Taux d'erreurs

---

## 8. Checklist d'Implémentation

### Base de Données
- [ ] Migration créée
- [ ] Colonnes `is_featured` et `featured_order` ajoutées
- [ ] Index créé
- [ ] Migration testée en local

### Endpoint GET `/featured`
- [ ] Route créée
- [ ] Requête SQL correcte (WHERE, ORDER BY, LIMIT)
- [ ] Relations incluses (creator)
- [ ] Format de réponse conforme
- [ ] Gestion d'erreurs
- [ ] Testé avec Postman/curl

### Endpoint PUT `/admin/featured`
- [ ] Route créée
- [ ] Middleware d'authentification
- [ ] Validation des données
- [ ] Vérification des permissions admin
- [ ] Transaction implémentée
- [ ] Gestion d'erreurs complète
- [ ] Testé avec Postman/curl

### Tests
- [ ] Test GET avec données
- [ ] Test GET sans données
- [ ] Test PUT avec token admin
- [ ] Test PUT sans token
- [ ] Test PUT avec token non-admin
- [ ] Test PUT avec > 5 thèmes
- [ ] Test PUT avec ID invalide
- [ ] Test PUT avec catégorie inactive
- [ ] Test de transaction (rollback)

### Documentation
- [ ] Swagger/OpenAPI documentation
- [ ] Exemples de requêtes/réponses
- [ ] Messages d'erreur documentés

### Déploiement
- [ ] Variables d'environnement configurées
- [ ] Migration exécutée en production
- [ ] Logs configurés
- [ ] Monitoring en place

---

## 9. Support

### Questions Fréquentes

**Q : Que se passe-t-il si je marque un thème inactif comme featured ?**
R : L'API doit retourner une erreur 400. Le thème doit être actif pour être featured.

**Q : Peut-on avoir moins de 5 thèmes featured ?**
R : Oui, vous pouvez envoyer un tableau de 1 à 5 IDs.

**Q : L'ordre dans le tableau est-il important ?**
R : Oui ! L'index dans le tableau détermine `featuredOrder` (index 0 = order 1).

**Q : Que se passe-t-il si deux requêtes PUT arrivent simultanément ?**
R : Les transactions garantissent l'atomicité. La dernière requête écrasera la première.

---

## 10. Exemple de Test Complet avec Postman

### Collection Postman

```json
{
  "info": {
    "name": "Featured Themes API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Featured Themes (Public)",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/design-categories/featured",
          "host": ["{{baseUrl}}"],
          "path": ["design-categories", "featured"]
        }
      }
    },
    {
      "name": "Update Featured Themes (Admin)",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"categoryIds\": [1, 5, 3, 8, 2]\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/design-categories/admin/featured",
          "host": ["{{baseUrl}}"],
          "path": ["design-categories", "admin", "featured"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3004"
    },
    {
      "key": "adminToken",
      "value": "your_admin_token_here"
    }
  ]
}
```

---

## Contact

Pour toute question sur l'intégration, consultez :
- `FEATURED_THEMES_IMPLEMENTATION.md` : Documentation technique complète
- `LIEN_ENTRE_PAGES.md` : Explication du lien frontend
- Code frontend : `src/pages/admin/FeaturedThemesManager.tsx`

---

**Version** : 1.0
**Date** : 31 Janvier 2025
**Auteur** : Claude Code
