# Guide Backend — Gestion Catégories, Sous-Catégories, Variations et Mockups (Produits)

Objectif: garantir l'intégrité entre catégories et mockups:
- Modifier une catégorie met automatiquement à jour la cohérence côté produits (sans casser les liens)
- Interdire la suppression d’une catégorie si au moins un mockup y est rattaché
- Proposer une réaffectation en masse des mockups avant une suppression

Ce guide fournit le schéma SQL, les règles, et les endpoints à implémenter.

## 1) Modèle de données (schéma recommandé)

Tables clés:
- `categories` (hiérarchie parent/enfant)
- `category_variations` (variations optionnelles d’une sous-catégorie)
- `products` (vos mockups)

```sql
-- Categories (hiérarchiques)
CREATE TABLE categories (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  slug            VARCHAR(160) NOT NULL UNIQUE,
  parent_id       BIGINT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active | inactive
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Variations liées à une (sous-)catégorie
CREATE TABLE category_variations (
  id              BIGSERIAL PRIMARY KEY,
  category_id     BIGINT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  slug            VARCHAR(160) NOT NULL UNIQUE
);

-- Produits (mockups)
CREATE TABLE products (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  price           NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock           INTEGER NOT NULL DEFAULT 0,

  -- Rattachements catégoriels
  category_id     BIGINT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  sub_category_id BIGINT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  variation_id    BIGINT NULL REFERENCES category_variations(id) ON UPDATE CASCADE ON DELETE SET NULL,

  status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT | PUBLISHED | PENDING
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index utiles
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(sub_category_id);
CREATE INDEX idx_products_variation ON products(variation_id);
```

Notes:
- On ne change jamais les `id` → les changements de `name/slug/parent_id/status` n’exigent pas de mise à jour côté produits.
- `ON DELETE RESTRICT` sur `products.category_id` et `products.sub_category_id` empêche la suppression si des produits sont rattachés.
- `variation_id` peut être `SET NULL` à la suppression d’une variation.

## 2) Règles métier

- Modifier une catégorie (name/slug/status/parent_id):
  - Aucun UPDATE côté `products` n’est nécessaire tant que les `id` ne changent pas.
  - Si `status = inactive`, interdire d’assigner cette catégorie à de nouveaux produits; ne pas casser les existants.

- Supprimer une catégorie:
  - Interdit si référencée par `products.category_id` ou `products.sub_category_id` (DELETE RESTRICT)
  - Retourner 409 "CategoryInUse" + compte d’usage
  - Fournir un endpoint de réaffectation en masse pour déplacer les produits vers une autre catégorie avant suppression

- Variations:
  - Si une variation est supprimée, les produits liés voient `variation_id = NULL` (ou interdire la suppression si vous préférez, en utilisant RESTRICT)

## 3) Endpoints à implémenter

### 3.1 Obtenir l’usage d’une catégorie
GET `/admin/categories/:id/usage`

Réponse:
```json
{
  "success": true,
  "data": {
    "categoryId": 12,
    "productsWithCategory": 25,
    "productsWithSubCategory": 8,
    "subcategoriesCount": 4,
    "variationsCount": 6
  }
}
```

Logique: compter dans `products` et dans `categories`/`category_variations`.

### 3.2 Réaffecter des produits avant suppression
POST `/admin/categories/:id/reassign`

Body:
```json
{
  "targetCategoryId": 34,
  "reassignType": "category|subcategory|both",
  "reassignVariations": "keep|null|map",
  "variationMap": [{ "from": 10, "to": 55 }]
}
```

Comportement:
- Transaction atomique
- Si `reassignType = category`, `UPDATE products SET category_id = :target WHERE category_id = :id`
- Si `reassignType = subcategory`, `UPDATE products SET sub_category_id = :target WHERE sub_category_id = :id`
- Si `both`, faire les deux
- Variations:
  - `keep`: laisser `variation_id` tel quel si compatible, sinon `SET NULL`
  - `null`: `UPDATE products SET variation_id = NULL WHERE variation_id IN (variations de :id)`
  - `map`: appliquer `variationMap` pour re-mapper précisément

Réponse:
```json
{
  "success": true,
  "data": { "updated": 33 }
}
```

### 3.3 Mettre à jour une catégorie
PATCH `/admin/categories/:id`

Body (exemples):
```json
{ "name": "T-Shirts", "slug": "t-shirts", "parentId": null, "status": "active" }
```

Validation:
- `slug` unique
- Si `status = inactive`, empêcher l’assignation à de nouveaux produits (règle côté service produits)

### 3.4 Supprimer une catégorie
DELETE `/admin/categories/:id`

Comportement:
- Vérifier usage via requêtes de comptage
- Si usage > 0 → 409 { code: "CategoryInUse", details: { counts... } }
- Sinon supprimer (et cascade sur variations via `ON DELETE CASCADE`)

### 3.5 Aides côté produits
- PATCH `/admin/products/:id/category`
  - Body: `{ "categoryId": 12, "subCategoryId": 45, "variationId": 78 | null }`
  - Valider que `subCategoryId` est enfant (direct ou non) de `categoryId` si votre métier l’exige
  - Optionnel: si `status` de catégorie = inactive, refuser

### 3.6 Lecture variations par catégorie
GET `/admin/categories/:id/variations`

Réponse:
```json
{ "success": true, "data": [ {"id":1,"name":"Col V","slug":"col-v"} ] }
```

## 4) Pseudocode — Réaffectation transactionnelle

```ts
async function reassignCategory(req, res) {
  const { id } = req.params; // category to free
  const { targetCategoryId, reassignType, reassignVariations, variationMap } = req.body;

  await db.tx(async (t) => {
    // Lock rows to avoid race conditions
    await t.none('SELECT id FROM categories WHERE id = $1 FOR UPDATE', [id]);
    await t.none('SELECT id FROM categories WHERE id = $1 FOR UPDATE', [targetCategoryId]);

    if (reassignType === 'category' || reassignType === 'both') {
      await t.none('UPDATE products SET category_id = $1 WHERE category_id = $2', [targetCategoryId, id]);
    }
    if (reassignType === 'subcategory' || reassignType === 'both') {
      await t.none('UPDATE products SET sub_category_id = $1 WHERE sub_category_id = $2', [targetCategoryId, id]);
    }

    if (reassignVariations === 'null') {
      await t.none(
        'UPDATE products SET variation_id = NULL WHERE variation_id IN (SELECT id FROM category_variations WHERE category_id = $1)',
        [id]
      );
    } else if (reassignVariations === 'map' && Array.isArray(variationMap)) {
      for (const m of variationMap) {
        await t.none('UPDATE products SET variation_id = $1 WHERE variation_id = $2', [m.to, m.from]);
      }
    } else {
      // keep: do nothing (ou vérifier compatibilité si nécessaire)
    }
  });

  return res.json({ success: true, data: { updated: true } });
}
```

## 5) Cas d’usage & réponses d’erreur

- Suppression impossible (catégorie utilisée):
  - 409 `{ code: "CategoryInUse", message: "La catégorie est utilisée par N produits.", details: { ...counts } }`
- Incohérence parent/enfant lors d’un PATCH produit:
  - 400 `{ code: "InvalidHierarchy", message: "La sous-catégorie doit appartenir à la catégorie sélectionnée." }`
- Cible de réaffectation invalide:
  - 400 `{ code: "InvalidTarget", message: "Catégorie cible introuvable ou inactive." }`

## 6) Impacts Frontend (référence de mise en œuvre)

- `CategoryManagement.tsx`:
  - Avant DELETE: appeler `/admin/categories/:id/usage` → si `>0`, afficher un assistant pour `/admin/categories/:id/reassign`
  - Après réaffectation réussie: DELETE devient possible

- `ProductListModern.tsx`:
  - Aucun changement requis pour un simple renommage de catégorie
  - Si la hiérarchie change, la lecture des libellés via API reflètera le nouveau parent

- `ProductFormMain.jsx`:
  - Ajouter des sélecteurs: `Catégorie` → charge `Sous-catégories` → charge `Variations`
  - PATCH produit: `/admin/products/:id/category` avec `categoryId`, `subCategoryId`, `variationId|null`

## 7) Migrations existantes & adaptation

Si vous avez déjà des tables produits/catégories:
1. Vérifier/ajouter les FKs et ON DELETE (RESTRICT/SET NULL) comme ci-dessus
2. Ajouter `category_variations` si absent
3. Ajouter index manquants
4. Écrire la logique service + endpoints listés

---

En suivant ce guide, vous aurez:
- Un modèle simple, robuste et transactionnel
- Des suppressions sécurisées et réaffectations en masse
- Une cohérence immédiate côté frontend sans mises à jour manuelles des produits lors des renommages


