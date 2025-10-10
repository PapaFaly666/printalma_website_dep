# Guide Backend — Sélection des variations (ProductFormMain)

Objectif: permettre au frontend (étape « Catégories et tailles » dans `src/components/product-form/ProductFormMain.tsx`) d’afficher et sélectionner correctement:
- Catégorie (niveau 0)
- Sous-catégorie (niveau 1)
- Variation (niveau 2)

Et de sauvegarder ces choix sur le produit avec vérifications de hiérarchie côté backend.

---

## Modèle recommandé

- Table `categories(id, name, slug UNIQUE, parent_id NULLABLE, status)`
- Table `category_variations(id, category_id FK → categories.id, name, slug UNIQUE)`
- Table `products( id, name, …, category_id FK (RESTRICT), sub_category_id FK (RESTRICT), variation_id FK (SET NULL) )`

Contraintes à appliquer:
- Si `sub_category_id` est fourni, il doit être enfant de `category_id`.
- Si `variation_id` est fourni, elle doit être enfant de `sub_category_id` (si présent) ou de `category_id`.

---

## Endpoints à exposer (contrat API)

1) Lister les sous‑catégories d’une catégorie
- GET `/categories/admin/:id/children`
- 200:
```json
{ "success": true, "data": [ { "id": 45, "name": "T-Shirts" } ] }
```

2) Lister les variations d’une catégorie (ou sous‑catégorie)
- GET `/categories/admin/:id/variations`
- 200:
```json
{ "success": true, "data": [ { "id": 78, "name": "Col V" } ] }
```

3) Mettre à jour les catégories d’un produit
- PATCH `/products/admin/:id/category`
- Body:
```json
{ "categoryId": 12, "subCategoryId": 45, "variationId": 78 }
```
- Réponses:
  - 200 `{ "success": true, "data": { "id": 1 } }`
  - 400 `{ "code": "InvalidHierarchy", "message": "Sous-catégorie non liée à la catégorie" }`
  - 400 `{ "code": "InvalidTarget", "message": "Catégorie/variation introuvable ou inactive" }`

4) Optionnel: Obtenir l’arbre complet
- GET `/categories/admin/:id/tree`

---

## Validation côté backend (pseudo)

PATCH produit `/products/admin/:id/category`:
1. Vérifier existence/validité de `categoryId` (et `status != inactive` si règle).
2. Si `subCategoryId` fourni: vérifier lien parent → enfant.
3. Si `variationId` fourni: vérifier que `variation.category_id == subCategoryId` (sinon `categoryId`).
4. Appliquer la mise à jour et retourner 200.

---

## Exemples SQL (PostgreSQL)

Sous‑catégorie enfant direct de la catégorie:
```sql
SELECT 1 FROM categories sub WHERE sub.id = $1 AND sub.parent_id = $2;
```

Variation enfant de subCategory OU category:
```sql
SELECT 1
FROM category_variations v
WHERE v.id = $1 AND (v.category_id = $2 OR v.category_id = $3);
```

Lister sous‑catégories:
```sql
SELECT id, name FROM categories WHERE parent_id = $1 ORDER BY name;
```

Lister variations:
```sql
SELECT id, name FROM category_variations WHERE category_id = $1 ORDER BY name;
```

---

## Intégration Frontend attendue

Dans `ProductFormMain.tsx`:
- Après sélection de catégorie: appeler `/categories/admin/:id/children`, puis `/categories/admin/:id/variations`.
- Après sélection de sous‑catégorie: appeler `/categories/admin/:id/variations` avec l’ID de la sous‑catégorie.
- Sauvegarder via `PATCH /products/admin/:id/category` (ids numériques, `null` accepté pour un niveau non utilisé).

Erreurs à gérer:
- 400 `InvalidHierarchy` → réinitialiser la sous‑catégorie/variation et notifier.
- 400 `InvalidTarget` → invalider la sélection.

---

## Checklist Backend
- [ ] GET `/categories/admin/:id/children` renvoie les sous‑catégories
- [ ] GET `/categories/admin/:id/variations` renvoie les variations
- [ ] PATCH `/products/admin/:id/category` valide et met à jour la hiérarchie
- [ ] Codes d’erreur sémantiques: `InvalidHierarchy`, `InvalidTarget`
- [ ] Statuts HTTP cohérents (200/400)
- [ ] CORS/cookies configurés si auth par session

---

## Débogage rapide
- Tester `/categories/admin/:id/variations` pour une sous‑catégorie ciblée (retourne une liste non vide)
- PATCH valide avec trio (`categoryId`, `subCategoryId`, `variationId`) → 200
- PATCH avec sous‑catégorie non liée → 400 `InvalidHierarchy`
- Vérifier que les IDs sont numériques et non des strings côté backend

En alignant ces endpoints et validations, la sélection de variation dans « Catégories et tailles » fonctionnera correctement.
