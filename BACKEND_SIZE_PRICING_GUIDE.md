o
      "costPrice": 2400,
      "suggestedPrice": 6000
    }
  ],
  "genre": "UNISEXE",
  "isReadyProduct": true,
  "colorVariations": [...]
}
```

#### Avec prix globaux

```json
{
  "name": "T-shirt Premium",
  "description": "T-shirt de haute qualité",
  "status": "published",
  "categories": ["Vêtements > T-shirts > S", "Vêtements > T-shirts > M", "Vêtements > T-shirts > L"],
  "sizes": ["S", "M", "L"],
  "useGlobalPricing": true,
  "globalCostPrice": 2000,
  "globalSuggestedPrice": 5000,
  "sizePricing": [
    {
      "size": "S",
      "costPrice": 2000,
      "suggestedPrice": 5000
    },
    {
      "size": "M",
      "costPrice": 2000,
      "suggestedPrice": 5000
    },
    {
      "size": "L",
      "costPrice": 2000,
      "suggestedPrice": 5000
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

1. ✅ **Recevoir** les champs `sizePricing`, `useGlobalPricing`, `globalCostPrice`, `globalSuggestedPrice`
2. ✅ **Valider** que chaque taille a un prix de vente suggéré > 0
3. ✅ **Stocker** ces prix en base de données
4. ✅ **Retourner** ces prix lors de la récupération du produit
5. ✅ **Calculer** automatiquement les prix globaux si `useGlobalPricing` est true

---

## 📊 Modèles de Base de Données Recommandés

### Option 1 : Table de Jonction (Recommandée)

Créer une table `ProductSizePrice` pour stocker les prix par taille.

```prisma
model ProductSizePrice {
  id              Int      @id @default(autoincrement())
  productId       Int
  size            String   @db.VarChar(100)     // "S", "M", "L", etc.
  costPrice       Int      @default(0)          // Prix de revient en FCFA
  suggestedPrice  Int                           // Prix de vente suggéré en FCFA
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, size])
  @@map("product_size_prices")
}

model Product {
  id                   Int                   @id @default(autoincrement())
  name                 String                @db.VarChar(255)
  description          String?               @db.Text
  // ... autres champs existants

  useGlobalPricing     Boolean               @default(false)
  globalCostPrice      Int                   @default(0)
  globalSuggestedPrice Int                   @default(0)

  sizePrices           ProductSizePrice[]    // 🆕 Relation avec les prix par taille

  @@map("products")
}
```

### Option 2 : JSONB (Alternative)

Stocker `sizePricing` directement dans le modèle `Product` comme champ JSONB.

```prisma
model Product {
  id                   Int      @id @default(autoincrement())
  name                 String   @db.VarChar(255)
  description          String?  @db.Text
  // ... autres champs existants

  useGlobalPricing     Boolean  @default(false)
  globalCostPrice      Int      @default(0)
  globalSuggestedPrice Int      @default(0)
  sizePricing          Json?    // 🆕 Stocker la structure complète en JSONB

  @@map("products")
}
```

**⚠️ Limitation :** Moins performant pour les requêtes et les filtres sur les prix.

---

## 🔧 Endpoints à Modifier

### POST `/api/products/ready` (Création)

Endpoint de création de produits prêts.

#### DTO à Ajouter

```typescript
// src/products/dto/create-ready-product.dto.ts

import { IsArray, IsInt, IsOptional, IsBoolean, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SizePricingDto {
  @IsString()
  size: string;

  @IsInt()
  @Min(0)
  suggestedPrice: number;

  @IsInt()
  @Min(0)
  costPrice: number;
}

export class CreateReadyProductDto {
  // ... champs existants

  @IsOptional()
  @IsBoolean()
  useGlobalPricing?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  globalCostPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  globalSuggestedPrice?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizePricingDto)
  sizePricing?: SizePricingDto[];
}
```

#### Validation à Ajouter

```typescript
// src/products/products.service.ts

async createReadyProduct(dto: CreateReadyProductDto) {
  // ... validation existante

  // 🆕 Validation des prix par taille
  if (dto.sizes && dto.sizes.length > 0) {
    if (!dto.sizePricing || dto.sizePricing.length === 0) {
      throw new BadRequestException('Les prix par taille sont requis');
    }

    // Vérifier que chaque taille a un prix
    const sizesWithoutPrice = dto.sizes.filter(size =>
      !dto.sizePricing!.find(p => p.size === size && p.suggestedPrice > 0)
    );

    if (sizesWithoutPrice.length > 0) {
      throw new BadRequestException(
        `Prix de vente suggéré manquant pour les tailles: ${sizesWithoutPrice.join(', ')}`
      );
    }

    // Si useGlobalPricing est true, vérifier que les prix globaux sont définis
    if (dto.useGlobalPricing) {
      if (!dto.globalCostPrice || dto.globalCostPrice < 0) {
        throw new BadRequestException('Prix de revient global requis');
      }
      if (!dto.globalSuggestedPrice || dto.globalSuggestedPrice <= 0) {
        throw new BadRequestException('Prix de vente suggéré global requis et doit être > 0');
      }

      // Vérifier que tous les prix correspondent aux prix globaux
      const invalidPrices = dto.sizePricing.filter(p =>
        p.costPrice !== dto.globalCostPrice ||
        p.suggestedPrice !== dto.globalSuggestedPrice
      );

      if (invalidPrices.length > 0) {
        throw new BadRequestException(
          'Les prix par taille doivent correspondre aux prix globaux quand useGlobalPricing est true'
        );
      }
    }
  }

  // ... suite du traitement
}
```

#### Création en Base de Données

```typescript
// Créer le produit
const product = await this.prisma.product.create({
  data: {
    name: dto.name,
    description: dto.description,
    status: dto.status,
    useGlobalPricing: dto.useGlobalPricing || false,
    globalCostPrice: dto.globalCostPrice || 0,
    globalSuggestedPrice: dto.globalSuggestedPrice || 0,
    // ... autres champs
  }
});

// Créer les prix par taille
if (dto.sizePricing && dto.sizePricing.length > 0) {
  await this.prisma.productSizePrice.createMany({
    data: dto.sizePricing.map(pricing => ({
      productId: product.id,
      size: pricing.size,
      costPrice: pricing.costPrice,
      suggestedPrice: pricing.suggestedPrice
    }))
  });
}
```

### GET `/api/products/:id` (Récupération)

Retourner les prix par taille.

```typescript
async findOne(id: number) {
  const product = await this.prisma.product.findUnique({
    where: { id },
    include: {
      sizePrices: true,  // 🆕 Inclure les prix par taille
      // ... autres relations
    }
  });

  return {
    ...product,
    sizePricing: product.sizePrices.map(sp => ({
      size: sp.size,
      costPrice: sp.costPrice,
      suggestedPrice: sp.suggestedPrice
    }))
  };
}
```

### PATCH `/api/products/:id` (Mise à jour)

```typescript
async updateReadyProduct(id: number, dto: UpdateReadyProductDto) {
  // ... validation similaire à la création

  // Mettre à jour le produit
  const product = await this.prisma.product.update({
    where: { id },
    data: {
      useGlobalPricing: dto.useGlobalPricing,
      globalCostPrice: dto.globalCostPrice,
      globalSuggestedPrice: dto.globalSuggestedPrice,
      // ... autres champs
    }
  });

  // Supprimer les anciens prix par taille
  await this.prisma.productSizePrice.deleteMany({
    where: { productId: id }
  });

  // Créer les nouveaux prix par taille
  if (dto.sizePricing && dto.sizePricing.length > 0) {
    await this.prisma.productSizePrice.createMany({
      data: dto.sizePricing.map(pricing => ({
        productId: id,
        size: pricing.size,
        costPrice: pricing.costPrice,
        suggestedPrice: pricing.suggestedPrice
      }))
    });
  }

  return product;
}
```

---

## 📈 Calculs et Utilisation des Prix

### Marge par Taille

Le frontend calcule automatiquement la marge pour chaque taille :

```typescript
marge = suggestedPrice - costPrice
pourcentageMarge = (marge / costPrice) * 100
```

### Prix Affiché sur le Frontend

Quand `useGlobalPricing` est true, le frontend :
1. Applique automatiquement les prix globaux à toutes les tailles
2. Affiche les mêmes valeurs dans tous les champs de prix par taille
3. Permet encore de modifier individuellement chaque taille si nécessaire

---

## 🧪 Tests de Validation

### Scénario 1 : Prix individuels par taille

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "sizes": ["S", "M", "L"],
    "useGlobalPricing": false,
    "sizePricing": [
      {"size": "S", "costPrice": 2000, "suggestedPrice": 5000},
      {"size": "M", "costPrice": 2200, "suggestedPrice": 5500},
      {"size": "L", "costPrice": 2400, "suggestedPrice": 6000}
    ]
  }'
```

**Résultat attendu :** ✅ Produit créé avec des prix différents par taille

### Scénario 2 : Prix globaux

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "sizes": ["S", "M", "L"],
    "useGlobalPricing": true,
    "globalCostPrice": 2000,
    "globalSuggestedPrice": 5000,
    "sizePricing": [
      {"size": "S", "costPrice": 2000, "suggestedPrice": 5000},
      {"size": "M", "costPrice": 2000, "suggestedPrice": 5000},
      {"size": "L", "costPrice": 2000, "suggestedPrice": 5000}
    ]
  }'
```

**Résultat attendu :** ✅ Produit créé avec les mêmes prix pour toutes les tailles

### Scénario 3 : Erreur - Prix manquant

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "sizes": ["S", "M", "L"],
    "sizePricing": [
      {"size": "S", "costPrice": 2000, "suggestedPrice": 0}
    ]
  }'
```

**Résultat attendu :** ❌ 400 - "Prix de vente suggéré manquant pour les tailles: M, L"

### Scénario 4 : Erreur - Prix globaux incohérents

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "sizes": ["S", "M"],
    "useGlobalPricing": true,
    "globalCostPrice": 2000,
    "globalSuggestedPrice": 5000,
    "sizePricing": [
      {"size": "S", "costPrice": 2000, "suggestedPrice": 5000},
      {"size": "M", "costPrice": 2500, "suggestedPrice": 5500}
    ]
  }'
```

**Résultat attendu :** ❌ 400 - "Les prix par taille doivent correspondre aux prix globaux"

---

## 📝 Réponse API

### Format de Réponse Complet

```json
{
  "id": 123,
  "name": "T-shirt Premium",
  "description": "T-shirt de haute qualité",
  "status": "published",
  "sizes": ["S", "M", "L"],
  "useGlobalPricing": false,
  "globalCostPrice": 0,
  "globalSuggestedPrice": 0,
  "sizePricing": [
    {
      "size": "S",
      "costPrice": 2000,
      "suggestedPrice": 5000
    },
    {
      "size": "M",
      "costPrice": 2200,
      "suggestedPrice": 5500
    },
    {
      "size": "L",
      "costPrice": 2400,
      "suggestedPrice": 6000
    }
  ],
  "genre": "UNISEXE",
  "colorVariations": [...],
  "createdAt": "2026-01-31T10:00:00.000Z",
  "updatedAt": "2026-01-31T10:00:00.000Z"
}
```

---

## 🔍 Requêtes Utiles

### Obtenir tous les produits avec leurs prix par taille

```typescript
const products = await this.prisma.product.findMany({
  include: {
    sizePrices: {
      orderBy: { size: 'asc' }
    }
  }
});
```

### Filtrer les produits par prix suggéré

```typescript
const affordableProducts = await this.prisma.product.findMany({
  where: {
    sizePrices: {
      some: {
        suggestedPrice: {
          lte: 5000  // Prix <= 5000 FCFA
        }
      }
    }
  },
  include: {
    sizePrices: true
  }
});
```

### Calculer la marge moyenne d'un produit

```typescript
async getAverageMargin(productId: number) {
  const sizePrices = await this.prisma.productSizePrice.findMany({
    where: { productId }
  });

  if (sizePrices.length === 0) return 0;

  const totalMargin = sizePrices.reduce((sum, sp) => {
    return sum + (sp.suggestedPrice - sp.costPrice);
  }, 0);

  return totalMargin / sizePrices.length;
}
```

---

## ⚠️ Points d'Attention

### 1. Validation Stricte

- Toujours vérifier que `suggestedPrice > 0` pour chaque taille
- Vérifier la cohérence entre prix globaux et prix par taille quand `useGlobalPricing = true`

### 2. Performance

- Utiliser l'Option 1 (table de jonction) pour de meilleures performances
- Indexer les champs `size` et `suggestedPrice` pour les recherches fréquentes

### 3. Backward Compatibility

- Les champs `price` et `suggestedPrice` existants dans le modèle `Product` peuvent être gardés comme valeurs par défaut
- Si `sizePricing` est vide, utiliser ces valeurs par défaut

### 4. Affichage Frontend

- Le frontend affiche le prix de vente suggéré comme "Prix" pour le client
- Le prix de revient est interne et ne doit jamais être affiché aux clients

---

## 📚 Code Complet

### Migration de Base de Données

```bash
# Créer la migration
npx prisma migrate dev --name add_product_size_prices

# Ou en production
npx prisma migrate deploy
```

### Fichier de Migration SQL

```sql
-- CreateTable
CREATE TABLE "product_size_prices" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "size" VARCHAR(100) NOT NULL,
    "costPrice" INTEGER NOT NULL DEFAULT 0,
    "suggestedPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_size_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_size_prices_productId_size_key" ON "product_size_prices"("productId", "size");

-- AddForeignKey
ALTER TABLE "product_size_prices" ADD CONSTRAINT "product_size_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ajouter les champs globaux à la table products
ALTER TABLE "products" ADD COLUMN "useGlobalPricing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "globalCostPrice" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "globalSuggestedPrice" INTEGER NOT NULL DEFAULT 0;
```

---

## 🎯 Résumé des Champs

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `useGlobalPricing` | boolean | Non | Active les prix globaux pour toutes les tailles |
| `globalCostPrice` | number | Non | Prix de revient global (FCFA) |
| `globalSuggestedPrice` | number | Non | Prix de vente suggéré global (FCFA) |
| `sizePricing[]` | array | Oui | Liste des prix par taille |
| `sizePricing[].size` | string | Oui | Nom de la taille |
| `sizePricing[].costPrice` | number | Oui | Prix de revient pour cette taille |
| `sizePricing[].suggestedPrice` | number | Oui | Prix de vente suggéré pour cette taille (doit être > 0) |

---

**Fin du guide**
