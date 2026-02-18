# 🔧 Guide Backend - Gestion des Produits TABLEAU

## 📋 Vue d'ensemble

Le **TABLEAU** est un nouveau type de produit similaire à l'**AUTOCOLLANT** : **il ne nécessite pas de gestion de stock**.

### Caractéristiques des produits TABLEAU

```typescript
interface TableauProduct {
  genre: 'TABLEAU';          // ✅ Genre fixe
  requiresStock: false,      // ✅ Pas de gestion de stock
  stock: null,               // ✅ Stock null (pas de stock)
  variations: ProductVariation[]; // ✅ Prix par variation
  sizes: string[];           // ✅ Tailles de tableau (ex: "20x30cm", "40x60cm")
}
```

### Différences avec les produits standards

| Caractéristique | Produit Standard | TABLEAU (comme AUTOCOLLANT) |
|----------------|------------------|----------------------------|
| `genre` | HOMME/FEMME/BEBE/UNISEXE | TABLEAU |
| `requiresStock` | true | false |
| `stock` | number (≥0) | null |
| Prix variations | Prix global du produit | Prix spécifique par variation |
| Tailles | S, M, L, XL... | 20x30cm, 40x60cm... |

## 🚀 Implémentation Backend

### 1. Modification du DTO

Ajoutez `'TABLEAU'` aux valeurs possibles du champ `genre` :

```typescript
// create-product.dto.ts

export class CreateProductDto {
  // ... autres champs

  @IsString()
  @IsIn(['HOMME', 'FEMME', 'BEBE', 'UNISEXE', 'AUTOCOLLANT', 'TABLEAU']) // ✅ AJOUTER TABLEAU
  genre: string;

  @IsOptional()
  @IsBoolean()
  requiresStock?: boolean;
}
```

### 2. Validation du genre TABLEAU

```typescript
// products.service.ts

async createProduct(createProductDto: CreateProductDto, files: Express.Multer.File[]) {
  const isAutocollant = createProductDto.genre === 'AUTOCOLLANT';
  const isTableau = createProductDto.genre === 'TABLEAU'; // ✅ AJOUTER
  const isProductWithoutStock = isAutocollant || isTableau; // ✅ PRODUITS SANS STOCK

  // 🔧 VALIDATIONS SPÉCIFIQUES
  if (isProductWithoutStock) {
    // ✅ Vérifier que requiresStock est false
    if (createProductDto.requiresStock !== false) {
      console.warn('⚠️ [BACKEND] Produit sans stock avec requiresStock=true, correction automatique');
      createProductDto.requiresStock = false;
    }

    // ✅ Stock doit être null ou 0
    if (createProductDto.stock !== null && createProductDto.stock !== undefined && createProductDto.stock !== 0) {
      console.warn('⚠️ [BACKEND] Produit sans stock avec stock défini, suppression automatique');
      createProductDto.stock = null;
    }

    // ✅ Vérifier que chaque variation a un prix
    for (const variation of variations) {
      if (!variation.price || variation.price <= 0) {
        const productType = isTableau ? 'TABLEAU' : 'AUTOCOLLANT';
        throw new BadRequestException(
          `Les variations ${productType} doivent avoir un prix. Variation "${variation.value}" sans prix.`
        );
      }
    }
  }

  // ... suite du traitement
}
```

### 3. Création en base de données

```typescript
// Créer le produit
const product = await this.prisma.product.create({
  data: {
    name: createProductDto.name,
    description: createProductDto.description,
    price: createProductDto.price,
    suggestedPrice: createProductDto.suggestedPrice,
    stock: isProductWithoutStock ? 0 : (createProductDto.stock ?? 0), // ✅ 0 pour TABLEAU/AUTOCOLLANT
    status: createProductDto.status,
    genre: createProductDto.genre,
    isReadyProduct: createProductDto.isReadyProduct ?? false,
    categoryId: createProductDto.categoryId,
    subCategoryId: createProductDto.subCategoryId,
  }
});
```

### 4. Création des colorVariations

```typescript
for (const colorVar of colorVariations) {
  // Créer la colorVariation
  const createdColorVar = await this.prisma.colorVariation.create({
    data: {
      productId: product.id,
      name: colorVar.name,
      colorCode: colorVar.colorCode,
      price: colorVar.price || 0, // ✅ Prix spécifique pour TABLEAU/AUTOCOLLANT
      stock: isProductWithoutStock ? {} : (colorVar.stock || {}) // ✅ {} pour TABLEAU
    }
  });

  console.log(`✅ [BACKEND] ColorVariation créée: ${colorVar.name} (${createdColorVar.id})`);

  // ... création des images et délimitations
}
```

## 📊 Exemple de Payload

### Requête de création de produit TABLEAU

```json
{
  "name": "Tableau Moderne Abstrait",
  "description": "Tableau décoratif haute qualité",
  "price": 15000,
  "suggestedPrice": 25000,
  "stock": null,
  "status": "PUBLISHED",
  "categoryId": 5,
  "subCategoryId": 12,
  "categories": ["Décoration", "Tableaux"],
  "genre": "TABLEAU",
  "requiresStock": false,
  "isReadyProduct": false,
  "sizes": ["20x30cm", "40x60cm", "60x80cm"],
  "variations": [
    {
      "value": "Sans Cadre",
      "colorCode": "#FFFFFF",
      "price": 15000,
      "stock": null,
      "images": [
        {
          "fileId": "img_1234567890_0",
          "view": "Front",
          "delimitations": [
            {
              "x": 100,
              "y": 100,
              "width": 800,
              "height": 600,
              "rotation": 0,
              "name": "Zone d'impression"
            }
          ]
        }
      ]
    },
    {
      "value": "Avec Cadre Noir",
      "colorCode": "#000000",
      "price": 20000,
      "stock": null,
      "images": [
        {
          "fileId": "img_1234567890_1",
          "view": "Front",
          "delimitations": [
            {
              "x": 100,
              "y": 100,
              "width": 800,
              "height": 600,
              "rotation": 0,
              "name": "Zone d'impression"
            }
          ]
        }
      ]
    }
  ]
}
```

## 🔍 Points à vérifier

### Validation des tailles

Pour les TABLEAU, les tailles sont généralement au format "LxHcm" :

```typescript
// 🔧 VALIDATION DES TAILLES POUR TABLEAU
const validateTableauSize = (size: string): boolean => {
  // Format attendu: "20x30cm", "40x60cm", "60x80cm", etc.
  const regex = /^\d+[xX]\d+(cm|mm)$/i;
  return regex.test(size.trim());
};

if (createProductDto.genre === 'TABLEAU') {
  for (const size of sizes) {
    if (!validateTableauSize(size)) {
      throw new BadRequestException(
        `Taille de tableau invalide: "${size}". Format attendu: "20x30cm" ou "40x60cm"`
      );
    }
  }
}
```

### Gestion du stock

```typescript
// ✅ IMPORTANT : Les TABLEAU n'ont pas de stock
if (createProductDto.genre === 'TABLEAU') {
  // Vérifier que le champ stock est null ou non fourni
  if (createProductDto.stock !== null && createProductDto.stock !== undefined) {
    throw new BadRequestException(
      "Les produits de type TABLEAU ne peuvent pas avoir de gestion de stock"
    );
  }

  // Vérifier que requiresStock est false
  if (createProductDto.requiresStock !== false) {
    throw new BadRequestException(
      "Les produits de type TABLEAU ne peuvent pas avoir de gestion de stock (requiresStock doit être false)"
    );
  }
}
```

## 📝 Résumé des modifications

### Fichiers à modifier

1. **DTO** (`create-product.dto.ts`)
   - Ajouter `'TABLEAU'` aux valeurs possibles de `genre`

2. **Service** (`products.service.ts`)
   - Ajouter la détection `isTableau = genre === 'TABLEAU'`
   - Créer la variable `isProductWithoutStock = isAutocollant || isTableau`
   - Appliquer les mêmes règles que pour AUTOCOLLANT

3. **Contrôleur** (`products.controller.ts`)
   - Aucune modification nécessaire si le DTO est correct

### Règles de gestion

| Règle | Produit Standard | AUTOCOLLANT | TABLEAU |
|-------|----------------|-------------|---------|
| Gestion de stock | ✅ Oui | ❌ Non | ❌ Non |
| `requiresStock` | true | false | false |
| `stock` | number | null | null |
| Prix par variation | Prix global | Prix spécifique | Prix spécifique |
| Validation stock | Requise | Aucune | Aucune |

## 🎯 Checklist d'implémentation

- [ ] Ajouter `'TABLEAU'` au DTO `CreateProductDto.genre`
- [ ] Ajouter la détection `isTableau` dans le service
- [ ] Créer `isProductWithoutStock = isAutocollant || isTableau`
- [ ] Appliquer les règles de stock (null, 0, ou {})
- [ ] Valider les tailles spécifiques aux tableaux
- [ ] Tester la création d'un produit TABLEAU
- [ ] Tester la modification d'un produit TABLEAU
- [ ] Vérifier que le stock ne peut pas être ajouté à un TABLEAU

## 🧪 Tests

### Test de création

```bash
curl -X POST "http://localhost:3004/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tableau Test",
    "description": "Test tableau",
    "price": 15000,
    "categoryId": 5,
    "categories": ["Test"],
    "genre": "TABLEAU",
    "sizes": ["20x30cm"],
    "variations": [{
      "value": "Sans Cadre",
      "colorCode": "#FFFFFF",
      "price": 15000,
      "stock": null,
      "images": []
    }],
    "colorVariations": [{
      "name": "Sans Cadre",
      "colorCode": "#FFFFFF",
      "price": 15000,
      "stock": null,
      "images": []
    }]
  }'
```

### Résultat attendu

```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "data": {
    "id": 123,
    "name": "Tableau Test",
    "genre": "TABLEAU",
    "stock": 0,
    "requiresStock": false,
    "colorVariations": [...]
  }
}
```

## 📞 Support

Pour toute question sur l'implémentation des produits TABLEAU, se référer à :
- `BACKEND_AUTOCOLLANT_GUIDE.md` (guide similaire pour AUTOCOLLANT)
- `BACKEND_FIX_500_ERROR.md` (résolution des erreurs 500)

---

**Date d'implémentation :** 26 janvier 2026
**Version :** 1.0.0
**Similaire à :** AUTOCOLLANT (même logique de gestion de stock)
