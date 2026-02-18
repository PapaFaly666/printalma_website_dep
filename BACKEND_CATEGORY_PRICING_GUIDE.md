# 📊 Guide Backend : Système de Prix par Catégorie/Variation

**Date:** 31 janvier 2026
**Priorité:** 🟡 **IMPORTANTE**
**Type:** Feature - Nouvelle fonctionnalité de tarification

---

## 📋 Résumé

Le frontend a été mis à jour pour permettre aux administrateurs de définir des **prix de vente** et des **prix de vente suggérés** pour chaque variation de catégorie lors de la création de produits prêts.

Au lieu d'avoir un prix global pour tout le produit, chaque variation (taille/type) peut avoir son propre prix.

---

## 🔄 Structure de Données Frontend

### Interface TypeScript

```typescript
export interface CategoryPricing {
  category: string;          // Format: "Parent > Enfant > Variation"
  salePrice: number;         // Prix de vente en FCFA (centimes)
  suggestedPrice: number;    // Prix de vente suggéré en FCFA (centimes)
}
```

### Exemple de Données Envoyées

```json
{
  "name": "T-shirt Premium",
  "description": "T-shirt de haute qualité",
  "status": "published",
  "categories": [
    "Vêtements > T-shirts > S",
    "Vêtements > T-shirts > M",
    "Vêtements > T-shirts > L"
  ],
  "sizes": ["S", "M", "L"],
  "categoryPricing": [
    {
      "category": "Vêtements > T-shirts > S",
      "salePrice": 5000,
      "suggestedPrice": 7000
    },
    {
      "category": "Vêtements > T-shirts > M",
      "salePrice": 5500,
      "suggestedPrice": 7500
    },
    {
      "category": "Vêtements > T-shirts > L",
      "salePrice": 6000,
      "suggestedPrice": 8000
    }
  ],
  "genre": "UNISEXE",
  "isReadyProduct": true,
  "colorVariations": [...]
}
```

---

## 🎯 Objectif Backend

Le backend doit :

1. ✅ **Recevoir** le champ `categoryPricing` depuis le frontend
2. ✅ **Valider** que chaque catégorie sélectionnée a un prix de vente > 0
3. ✅ **Stocker** ces prix en base de données
4. ✅ **Retourner** ces prix lors de la récupération du produit
5. ✅ **Gérer** les associations entre catégories/variations et prix

---

## 📊 Modèles de Base de Données Recommandés

### Option 1 : Table de Jonction (Recommandée)

Créer une table `ProductCategoryPrice` pour stocker les prix par catégorie.

```prisma
model ProductCategoryPrice {
  id              Int      @id @default(autoincrement())
  productId       Int
  categoryPath    String   @db.VarChar(500)  // "Parent > Enfant > Variation"
  salePrice       Int                         // Prix de vente en centimes
  suggestedPrice  Int      @default(0)        // Prix suggéré en centimes
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, categoryPath])
  @@map("product_category_prices")
}

model Product {
  id                   Int                      @id @default(autoincrement())
  name                 String                   @db.VarChar(255)
  description          String?                  @db.Text
  // ... autres champs existants

  categoryPrices       ProductCategoryPrice[]   // 🆕 Relation avec les prix par catégorie

  @@map("products")
}
```

### Option 2 : JSONB (Alternative)

Stocker `categoryPricing` directement dans le modèle `Product` comme champ JSONB.

```prisma
model Product {
  id              Int      @id @default(autoincrement())
  name            String   @db.VarChar(255)
  description     String?  @db.Text
  // ... autres champs existants

  categoryPricing Json?    // 🆕 Stocker la structure complète en JSONB

  @@map("products")
}
```

**⚠️ Limitation :** Moins performant pour les requêtes et les filtres sur les prix.

---

## 🔧 Endpoint à Modifier

### POST `/api/products/ready`

Endpoint de création de produits prêts.

#### Étapes d'Implémentation

##### 1. Ajouter le DTO

```typescript
// src/products/dto/create-ready-product.dto.ts

import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CategoryPricingDto {
  @IsString()
  category: string;

  @IsInt()
  @Min(1, { message: 'Le prix de vente doit être supérieur à 0' })
  salePrice: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  suggestedPrice?: number;
}

export class CreateReadyProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsArray()
  @IsString({ each: true })
  sizes: string[];

  // 🆕 Ajout du champ categoryPricing
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryPricingDto)
  categoryPricing: CategoryPricingDto[];

  // ... autres champs existants
}
```

##### 2. Validation Métier

```typescript
// src/products/products.service.ts

async createReadyProduct(dto: CreateReadyProductDto, files: any[]) {
  // ✅ Validation : Vérifier que chaque catégorie a un prix
  const categoriesSet = new Set(dto.categories);
  const pricingSet = new Set(dto.categoryPricing.map(p => p.category));

  for (const category of categoriesSet) {
    if (!pricingSet.has(category)) {
      throw new BadRequestException(
        `Prix de vente manquant pour la catégorie: ${category}`
      );
    }
  }

  // ✅ Validation : Vérifier que tous les prix sont > 0
  for (const pricing of dto.categoryPricing) {
    if (pricing.salePrice <= 0) {
      throw new BadRequestException(
        `Le prix de vente doit être supérieur à 0 pour la catégorie: ${pricing.category}`
      );
    }
  }

  // ... continuer avec la création du produit
}
```

##### 3. Sauvegarde en Base de Données (Option 1 : Table de Jonction)

```typescript
// src/products/products.service.ts

async createReadyProduct(dto: CreateReadyProductDto, files: any[]) {
  // ... validations

  // 1. Créer le produit
  const product = await this.prisma.product.create({
    data: {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      isReadyProduct: true,
      genre: dto.genre,
      // ... autres champs
    }
  });

  // 2. Créer les prix par catégorie
  const categoryPrices = dto.categoryPricing.map(pricing => ({
    productId: product.id,
    categoryPath: pricing.category,
    salePrice: pricing.salePrice,
    suggestedPrice: pricing.suggestedPrice || 0
  }));

  await this.prisma.productCategoryPrice.createMany({
    data: categoryPrices
  });

  // 3. Retourner le produit avec les prix
  return await this.prisma.product.findUnique({
    where: { id: product.id },
    include: {
      categoryPrices: true,
      // ... autres relations
    }
  });
}
```

##### 4. Sauvegarde en Base de Données (Option 2 : JSONB)

```typescript
// src/products/products.service.ts

async createReadyProduct(dto: CreateReadyProductDto, files: any[]) {
  // ... validations

  const product = await this.prisma.product.create({
    data: {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      isReadyProduct: true,
      genre: dto.genre,
      categoryPricing: dto.categoryPricing, // ✅ Stocker directement en JSONB
      // ... autres champs
    }
  });

  return product;
}
```

---

## 📤 Réponse API Attendue

### Format de Réponse

```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "data": {
    "id": 123,
    "name": "T-shirt Premium",
    "description": "T-shirt de haute qualité",
    "status": "PUBLISHED",
    "isReadyProduct": true,
    "genre": "UNISEXE",
    "categories": [
      "Vêtements > T-shirts > S",
      "Vêtements > T-shirts > M",
      "Vêtements > T-shirts > L"
    ],
    "sizes": ["S", "M", "L"],
    "categoryPricing": [
      {
        "id": 1,
        "category": "Vêtements > T-shirts > S",
        "salePrice": 5000,
        "suggestedPrice": 7000
      },
      {
        "id": 2,
        "category": "Vêtements > T-shirts > M",
        "salePrice": 5500,
        "suggestedPrice": 7500
      },
      {
        "id": 3,
        "category": "Vêtements > T-shirts > L",
        "salePrice": 6000,
        "suggestedPrice": 8000
      }
    ],
    "colorVariations": [...],
    "createdAt": "2026-01-31T10:00:00.000Z",
    "updatedAt": "2026-01-31T10:00:00.000Z"
  }
}
```

---

## 🔄 Endpoint de Récupération

### GET `/api/products/:id`

Lors de la récupération d'un produit, inclure les prix par catégorie.

```typescript
// src/products/products.service.ts

async getProductById(id: number) {
  const product = await this.prisma.product.findUnique({
    where: { id },
    include: {
      categoryPrices: true, // ✅ Inclure les prix
      colorVariations: {
        include: {
          images: true
        }
      },
      // ... autres relations
    }
  });

  if (!product) {
    throw new NotFoundException(`Produit ${id} non trouvé`);
  }

  return {
    success: true,
    data: {
      ...product,
      categoryPricing: product.categoryPrices // ✅ Mapper au format frontend
    }
  };
}
```

---

## 📊 Migration de Données Existantes

### Script de Migration

Pour les produits existants qui ont un prix global, créer des prix par catégorie.

```typescript
// scripts/migrate-category-pricing.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCategoryPricing() {
  const productsWithoutPricing = await prisma.product.findMany({
    where: {
      categoryPrices: {
        none: {}
      }
    },
    include: {
      categories: true
    }
  });

  console.log(`🔄 Migration de ${productsWithoutPricing.length} produits...`);

  for (const product of productsWithoutPricing) {
    // Pour chaque catégorie, créer un prix égal au prix global
    const categoryPrices = product.categories.map(cat => ({
      productId: product.id,
      categoryPath: cat.fullPath, // Supposons que c'est le chemin complet
      salePrice: product.price || 0,
      suggestedPrice: product.suggestedPrice || 0
    }));

    if (categoryPrices.length > 0) {
      await prisma.productCategoryPrice.createMany({
        data: categoryPrices,
        skipDuplicates: true
      });

      console.log(`✅ Migré ${categoryPrices.length} prix pour le produit ${product.id}`);
    }
  }

  console.log('✅ Migration terminée!');
}

migrateCategoryPricing()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Exécuter la migration :

```bash
npx ts-node scripts/migrate-category-pricing.ts
```

---

## 🧪 Tests à Effectuer

### 1. Test de Création avec Prix

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "description": "Test avec prix par catégorie",
    "categories": ["Vêtements > T-shirts > S", "Vêtements > T-shirts > M"],
    "sizes": ["S", "M"],
    "categoryPricing": [
      {
        "category": "Vêtements > T-shirts > S",
        "salePrice": 5000,
        "suggestedPrice": 7000
      },
      {
        "category": "Vêtements > T-shirts > M",
        "salePrice": 5500,
        "suggestedPrice": 7500
      }
    ],
    "status": "published",
    "genre": "UNISEXE",
    "isReadyProduct": true
  }'
```

### 2. Test de Validation (Prix Manquant)

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "categories": ["Vêtements > T-shirts > S", "Vêtements > T-shirts > M"],
    "sizes": ["S", "M"],
    "categoryPricing": [
      {
        "category": "Vêtements > T-shirts > S",
        "salePrice": 5000
      }
    ]
  }'
```

**Réponse attendue :**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Prix de vente manquant pour la catégorie: Vêtements > T-shirts > M"
}
```

### 3. Test de Validation (Prix Invalide)

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "categories": ["Vêtements > T-shirts > S"],
    "sizes": ["S"],
    "categoryPricing": [
      {
        "category": "Vêtements > T-shirts > S",
        "salePrice": 0
      }
    ]
  }'
```

**Réponse attendue :**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Le prix de vente doit être supérieur à 0 pour la catégorie: Vêtements > T-shirts > S"
}
```

---

## 🎯 Cas d'Usage Métier

### 1. Prix Différenciés par Taille

```javascript
// Exemple : T-shirts avec prix croissant selon la taille
categoryPricing: [
  { category: "Vêtements > T-shirts > S",   salePrice: 5000,  suggestedPrice: 7000 },
  { category: "Vêtements > T-shirts > M",   salePrice: 5500,  suggestedPrice: 7500 },
  { category: "Vêtements > T-shirts > L",   salePrice: 6000,  suggestedPrice: 8000 },
  { category: "Vêtements > T-shirts > XL",  salePrice: 6500,  suggestedPrice: 8500 },
  { category: "Vêtements > T-shirts > XXL", salePrice: 7000,  suggestedPrice: 9000 }
]
```

### 2. Prix Différenciés par Type d'Objet

```javascript
// Exemple : Coques téléphone avec prix différents selon le modèle
categoryPricing: [
  { category: "Objets > Coques téléphone > iPhone 12", salePrice: 3000, suggestedPrice: 4500 },
  { category: "Objets > Coques téléphone > iPhone 13", salePrice: 3200, suggestedPrice: 4700 },
  { category: "Objets > Coques téléphone > iPhone 14", salePrice: 3500, suggestedPrice: 5000 },
  { category: "Objets > Coques téléphone > iPhone 15", salePrice: 4000, suggestedPrice: 5500 }
]
```

### 3. Prix Unique pour Toutes les Variations

```javascript
// Exemple : Même prix pour toutes les couleurs d'une casquette
categoryPricing: [
  { category: "Accessoires > Casquettes > Unique", salePrice: 4500, suggestedPrice: 6000 }
]
```

---

## 🔒 Sécurité et Validation

### Règles de Validation Backend

1. ✅ **Chaque catégorie doit avoir un prix de vente > 0**
2. ✅ **Le prix suggéré doit être >= prix de vente (si fourni)**
3. ✅ **Le nombre de categoryPricing doit correspondre au nombre de categories**
4. ✅ **Les clés `category` dans categoryPricing doivent correspondre exactement aux valeurs dans `categories`**
5. ✅ **Les prix doivent être des entiers positifs (en centimes)**

### Exemple de Validation Complète

```typescript
// src/products/products.service.ts

private validateCategoryPricing(dto: CreateReadyProductDto) {
  const { categories, categoryPricing } = dto;

  // 1. Vérifier que le nombre correspond
  if (categories.length !== categoryPricing.length) {
    throw new BadRequestException(
      `Le nombre de prix (${categoryPricing.length}) doit correspondre au nombre de catégories (${categories.length})`
    );
  }

  // 2. Vérifier que chaque catégorie a un prix
  const categoriesSet = new Set(categories);
  const pricingMap = new Map(categoryPricing.map(p => [p.category, p]));

  for (const category of categoriesSet) {
    const pricing = pricingMap.get(category);

    if (!pricing) {
      throw new BadRequestException(
        `Prix manquant pour la catégorie: ${category}`
      );
    }

    if (pricing.salePrice <= 0) {
      throw new BadRequestException(
        `Prix de vente invalide pour ${category}: ${pricing.salePrice}`
      );
    }

    if (pricing.suggestedPrice && pricing.suggestedPrice < pricing.salePrice) {
      throw new BadRequestException(
        `Le prix suggéré (${pricing.suggestedPrice}) doit être >= au prix de vente (${pricing.salePrice}) pour ${category}`
      );
    }
  }

  // 3. Vérifier qu'il n'y a pas de prix pour des catégories non sélectionnées
  for (const pricing of categoryPricing) {
    if (!categoriesSet.has(pricing.category)) {
      throw new BadRequestException(
        `Prix défini pour une catégorie non sélectionnée: ${pricing.category}`
      );
    }
  }
}
```

---

## 📊 Statistiques et Analytics

### Requêtes Utiles

#### Prix moyen par catégorie

```sql
SELECT
  category_path,
  AVG(sale_price) as avg_sale_price,
  AVG(suggested_price) as avg_suggested_price,
  COUNT(*) as total_products
FROM product_category_prices
GROUP BY category_path
ORDER BY avg_sale_price DESC;
```

#### Produits avec les marges les plus élevées

```sql
SELECT
  p.id,
  p.name,
  pcp.category_path,
  pcp.sale_price,
  pcp.suggested_price,
  (pcp.suggested_price - pcp.sale_price) as margin,
  ROUND(((pcp.suggested_price - pcp.sale_price)::numeric / pcp.sale_price * 100), 2) as margin_percentage
FROM products p
JOIN product_category_prices pcp ON p.id = pcp.product_id
WHERE pcp.suggested_price > 0
ORDER BY margin_percentage DESC
LIMIT 20;
```

---

## ✅ Checklist d'Implémentation Backend

- [ ] **Créer le modèle Prisma** `ProductCategoryPrice` (ou ajouter champ JSONB)
- [ ] **Générer la migration** : `npx prisma migrate dev --name add_category_pricing`
- [ ] **Créer le DTO** `CategoryPricingDto`
- [ ] **Mettre à jour** `CreateReadyProductDto` avec le champ `categoryPricing`
- [ ] **Ajouter la validation** dans le service
- [ ] **Implémenter la sauvegarde** des prix par catégorie
- [ ] **Mettre à jour** l'endpoint GET pour retourner les prix
- [ ] **Migrer les données** existantes (optionnel)
- [ ] **Tester** avec curl/Postman
- [ ] **Déployer** en production

---

## 🔗 Références

- **Frontend Component:** `src/components/product-form/CategoriesAndSizesPanel.tsx`
- **Frontend Page:** `src/pages/admin/CreateReadyProductPage.tsx`
- **Frontend Types:** `src/components/product-form/CategoriesAndSizesPanel.tsx` (ligne 22-27)
- **API Endpoint:** `POST /api/products/ready`

---

## 📝 Notes Importantes

1. **Compatibilité Descendante:** Si certains produits existants ont un prix global (`product.price`), le backend doit continuer à le supporter temporairement.

2. **Priorité des Prix:** Si `categoryPricing` existe, il a la priorité sur `product.price` global.

3. **Frontend par Défaut:** Le panel de prix est **ouvert par défaut** (peut être modifié avec `setShowPricingPanel(true)` au chargement).

4. **Validation UX:** Le frontend empêche l'utilisateur de passer à l'étape de validation si au moins un prix de vente est manquant.

5. **Format de Stockage:** Les prix sont stockés en **centimes** (FCFA), pas en euros ni en FCFA avec décimales.

---

**Fin du document**

Ce guide doit permettre au backend d'implémenter complètement le système de prix par catégorie/variation introduit dans le frontend.
