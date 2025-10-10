# Note Backend — Variations exposées via `children` au lieu de `variations`

Contexte (frontend ProductFormMain):
- Le frontend charge les listes dépendantes Catégorie → Sous‑catégorie → Variation.
- Contrat prévu: 
  - GET `/categories/admin/:id/children` → sous‑catégories directes
  - GET `/categories/admin/:id/variations` → variations de la catégorie/sous‑catégorie
  - PATCH `/products/admin/:id/category` → sauvegarde `{ categoryId, subCategoryId, variationId }`

Problème observé (local):
- Pour `id = 98`, l’API renvoie les « variations » via `GET /categories/admin/98/children`.
- Exemple (200 OK):
```
GET /categories/admin/98/children
{
  "success": true,
  "data": [
    { "id": 99, "name": "D",   "parentId": 98, "level": 2 },
    { "id": 100,"name": "d",   "parentId": 98, "level": 2 },
    { "id": 101,"name": "z",   "parentId": 98, "level": 2 }
  ]
}
```
- Le point d’accès `/categories/admin/:id/variations` semble absent/retourne vide dans ce cas.

Impact frontend:
- Le select « Variation » est vide si on suit strictement `/variations`.
- Un fallback a été implémenté: si `/variations` est vide/erreur, on utilise `/children` comme source de variations.

Recommandations backend (alignement):
1) Option A (préférée): implémenter `GET /categories/admin/:id/variations` et y retourner les entrées de niveau variation (shape minimal `{ id, name }`).
2) Option B: documenter officiellement que les variations d’une sous‑catégorie sont exposées via `GET /categories/admin/:id/children` et garantir le shape minimal `{ id, name }`.
3) Dans tous les cas, conserver un schéma de réponse cohérent:
   - Succès: `{ "success": true, "data": Array<{ id: number; name: string }> }`
   - Erreurs 4xx avec code sémantique (`InvalidTarget`, etc.)

Validation hiérarchique côté PATCH produit:
- Si `subCategoryId` est fourni, vérifier qu’il appartient à `categoryId`.
- Si `variationId` est fourni, vérifier qu’elle appartient à `subCategoryId` (si présent) ou à `categoryId`.

Checklist backend:
- [ ] Endpoint stable pour la liste des variations (A ou B)
- [ ] Shape minimal uniforme `{ id, name }` pour `children` et/ou `variations`
- [ ] Codes d’erreur sémantiques cohérents et statuts 200/400

Note: Le frontend gère déjà le fallback vers `children` pour rester compatible avec l’existant. 
