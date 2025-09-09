## Objectif

Ajouter le champ « prix suggéré » au flux d'ajout/édition de produit mockup côté backend afin que l'admin puisse renseigner une valeur guidée qui pré-remplit le prix du produit côté frontend.

## Contexte frontend (déjà en place)

- Page: `/admin/add-product` → composant `ProductFormMain`.
- L'admin saisit un « Prix suggéré (FCFA) » dans l'étape Informations de base. Cette valeur renseigne automatiquement le champ `price` du formulaire côté frontend.
- Pour un support propre côté backend, on expose un champ optionnel `suggestedPrice` dans les DTOs, persistant en base et renvoyé dans les réponses.

## Spécifications backend

### 1) Modèle/Schéma BDD

Ajouter une colonne optionnelle au modèle produit pour stocker le prix suggéré indépendamment du prix de vente effectif.

- Nom de colonne: `suggested_price`
- Type: DECIMAL(10,2) (ou NUMERIC(10,2) selon SGBD)
- Null par défaut

Exemples:

```sql
-- Postgres
ALTER TABLE products ADD COLUMN suggested_price NUMERIC(10,2) NULL;

-- MySQL
ALTER TABLE products ADD COLUMN suggested_price DECIMAL(10,2) NULL;
```

Notes:
- Ne pas appliquer de contrainte NOT NULL: ce champ est optionnel.
- Ne pas remplacer `price` existant: on garde `price` comme prix effectif.

### 2) DTOs et Validation

Dans le DTO de création/mise à jour produit, ajouter un champ optionnel:

```ts
// ProductCreateDto / ProductUpdateDto
class ProductCreateDto {
  name: string;
  description: string;
  price?: number; // prix effectif (existant)
  // ... autres champs

  suggestedPrice?: number; // nouveau champ optionnel
}
```

Règles de validation (class-validator):
- `suggestedPrice` optionnel
- numérique ≥ 0
- idéalement entier multiple de 100 si règle métier (sinon tolérant)

Exemple (NestJS):

```ts
@IsOptional()
@IsNumber({ maxDecimalPlaces: 2 })
@Min(0)
suggestedPrice?: number;
```

### 3) Mapping et Persistance

- Lors de la création/maj produit:
  - Si `suggestedPrice` est présent → persister en `products.suggested_price`.
  - Si `price` est absent et que `suggestedPrice` est défini → option: utiliser `suggestedPrice` comme valeur par défaut pour `price` (facultatif, selon votre logique).

Pseudo-code service:

```ts
if (dto.suggestedPrice != null) {
  product.suggested_price = dto.suggestedPrice;
}

if ((dto.price == null || Number.isNaN(dto.price)) && dto.suggestedPrice != null) {
  product.price = dto.suggestedPrice; // optionnel
}
```

### 4) API (Entrées/Sorties)

- Entrée: accepter `suggestedPrice` dans `POST /products` et `PATCH /products/:id`.
- Sortie: inclure `suggestedPrice` dans la représentation produit renvoyée par `GET /products/:id`, `GET /products`, etc.

Exemple réponse:

```json
{
  "id": 123,
  "name": "Mug",
  "price": 6500,
  "suggestedPrice": 6500,
  "colorVariations": [...]
}
```

### 5) Compatibilité avec le flux Mockup

- Le prix suggéré n'est pas dépendant d'une image mockup en particulier; c'est un indicateur global pour le produit.
- Aucun changement requis dans les endpoints d'upload d'images mockup; ils restent inchangés.
- Si vous avez une logique de calcul automatique (par ex. marge + coût), vous pouvez remplir `suggested_price` côté backend et le renvoyer pour guider l'admin.

### 6) Exemples d'appels

Création produit avec prix suggéré:

```bash
curl -X POST https://api.exemple.com/products \
  -H "Content-Type: application/json" \
  --cookie "auth=..." \
  -d '{
    "name": "T-Shirt",
    "description": "Coton bio",
    "suggestedPrice": 7500,
    "price": 7500,
    "categories": ["Tee-shirts"],
    "colorVariations": []
  }'
```

Mise à jour du prix suggéré uniquement:

```bash
curl -X PATCH https://api.exemple.com/products/123 \
  -H "Content-Type: application/json" \
  --cookie "auth=..." \
  -d '{ "suggestedPrice": 6900 }'
```

### 7) Points de contrôle QA

- Création/édition: `suggestedPrice` est accepté et stocké.
- Lecture: `suggestedPrice` apparaît dans les réponses GET.
- Si règle activée: `price` par défaut = `suggestedPrice` lorsqu'absent.
- Pas d'impact sur l'authentification: on reste sur cookies HttpOnly + `credentials: include` côté frontend.

### 8) Évolutions possibles

- Historiser `suggested_price` (table produit_history) pour audit.
- Ajouter un calcul serveur (coût + marge) pour proposer automatiquement `suggested_price`.
- Exposer un endpoint `GET /products/:id/pricing-suggestion` si la suggestion dépend de données dynamiques.



