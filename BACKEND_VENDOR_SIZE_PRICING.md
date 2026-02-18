# BACKEND - Prix par Taille pour Produits Vendeur

## Résumé

Ce document spécifie les modifications nécessaires au backend pour prendre en charge le système de **prix par taille** lors de la création de produits vendeur depuis `/vendeur/products` (VendorProductsPage).

## Contexte Frontend

### Fichiers Frontend Impliqués

1. **`src/pages/vendor/VendorProductsPage.tsx`** - Page de gestion des produits vendeur
2. **`src/components/vendor/SizePricingConfig.tsx`** - Composant de configuration des prix par taille
3. **`src/services/productService.ts`** - Service API avec types TypeScript
4. **`src/types/product.ts`** - Types pour les prix par taille

### Flux Actuel Frontend

```
SellDesignPage.tsx (publication avec design)
  ↓
useVendorPublish.ts (hook de publication)
  ↓
POST /vendor/products (backend)
```

### État Actuel

Le frontend envoie déjà les données de prix par taille via `useVendorPublish`, mais le backend ne les traite pas encore complètement.

---

## Modifications Backend Requises

### 1. Schéma Prisma (`prisma/schema.prisma`)

Ajouter les champs de prix par taille au modèle `VendorProduct` :

```prisma
model VendorProduct {
  id                Int       @id @default(autoincrement())
  vendorId          Int
  baseProductId     Int

  // Champs existants
  vendorName        String    @map("vendor_name") @db.VarChar(255)
  vendorDescription String?   @map("vendor_description") @db.Text
  vendorPrice       Int       @map("vendor_price") @db.Int
  vendorStock       Int       @map("vendor_stock") @default(10) @db.Int
  status            String    @default('DRAFT') @map("status") @db.VarChar(50)

  // 🆕 NOUVEAUX CHAMPS pour les prix par taille
  useGlobalPricing  Boolean   @default(false) @map("use_global_pricing")
  globalCostPrice   Int?      @map("global_cost_price")
  globalSuggestedPrice Int?   @map("global_suggested_price")

  // Relations existantes
  vendor            Vendor    @relation(fields: [vendorId], references: [id])
  baseProduct       Product   @relation(fields: [baseProductId], references: [id])

  // 🆕 NOUVELLE RELATION pour les prix par taille
  sizePrices        VendorProductSizePrice[]

  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([vendorId])
  @@index([baseProductId])
  @@map("vendor_products")
}

// 🆕 NOUVEAU MODÈLE pour les prix par taille
model VendorProductSizePrice {
  id              Int      @id @default(autoincrement())
  vendorProductId Int      @map("vendor_product_id")
  size            String   @db.VarChar(50)
  costPrice       Int      @map("cost_price") @db.Int
  suggestedPrice  Int      @map("suggested_price") @db.Int
  salePrice       Int?     @map("sale_price") @db.Int // Prix de vente défini par le vendeur

  vendorProduct   VendorProduct @relation(fields: [vendorProductId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@unique([vendorProductId, size])
  @@index([vendorProductId])
  @@map("vendor_product_size_prices")
}
```

### 2. DTO (`src/vendor/dto/vendor-publish.dto.ts`)

Étendre le DTO pour accepter les prix par taille :

```typescript
import { IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SizePricingDto {
  @IsString()
  size: string; // Nom de la taille (ex: "S", "M", "L", "XL")

  @IsNumber()
  costPrice: number; // Prix de revient

  @IsNumber()
  suggestedPrice: number; // Prix de vente suggéré

  @IsOptional()
  @IsNumber()
  salePrice?: number; // Prix de vente défini par le vendeur
}

export class VendorPublishDto {
  // Champs existants
  baseProductId: number;
  designId: number;
  vendorName: string;
  vendorDescription?: string;
  vendorPrice: number;
  vendorStock?: number;
  selectedColors: ColorSelectionDto[];
  selectedSizes: SizeSelectionDto[];
  productStructure: ProductStructureDto;
  designPosition: DesignPositionDto;
  forcedStatus?: 'DRAFT' | 'PENDING';
  postValidationAction?: 'AUTO_PUBLISH' | 'TO_DRAFT';
  bypassValidation?: boolean;

  // 🆕 NOUVEAUX CHAMPS pour les prix par taille
  @IsOptional()
  @IsBoolean()
  useGlobalPricing?: boolean;

  @IsOptional()
  @IsNumber()
  globalCostPrice?: number;

  @IsOptional()
  @IsNumber()
  globalSuggestedPrice?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizePricingDto)
  sizePricing?: SizePricingDto[];
}
```

### 3. Service Vendor (`src/vendor/vendor-product.service.ts`)

Modifier la méthode `createVendorProduct` pour traiter les prix par taille :

```typescript
async createVendorProduct(dto: VendorPublishDto, vendorId: number) {
  console.log('📦 Création produit vendeur avec prix par taille...');

  // 1. Récupérer le produit de base avec ses prix par taille
  const baseProduct = await this.prisma.product.findUnique({
    where: { id: dto.baseProductId },
    include: {
      sizePrices: true, // 🆕 Inclure les prix par taille du produit admin
    }
  });

  if (!baseProduct) {
    throw new BadRequestException('Produit de base non trouvé');
  }

  // 2. Créer le produit vendeur
  const vendorProduct = await this.prisma.vendorProduct.create({
    data: {
      vendorId,
      baseProductId: dto.baseProductId,
      vendorName: dto.vendorName,
      vendorDescription: dto.vendorDescription,
      vendorPrice: dto.vendorPrice,
      vendorStock: dto.vendorStock || 10,
      status: dto.forcedStatus || 'DRAFT',

      // 🆕 Prix par taille
      useGlobalPricing: dto.useGlobalPricing ?? false,
      globalCostPrice: dto.globalCostPrice,
      globalSuggestedPrice: dto.globalSuggestedPrice,
    }
  });

  // 🆕 3. Créer les prix par taille du vendeur
  if (dto.sizePricing && dto.sizePricing.length > 0) {
    console.log(`💰 Création de ${dto.sizePricing.length} prix par taille pour le vendeur...`);

    const sizePricesData = dto.sizePricing.map(sp => ({
      vendorProductId: vendorProduct.id,
      size: sp.size,
      costPrice: sp.costPrice,
      suggestedPrice: sp.suggestedPrice,
      salePrice: sp.salePrice ?? sp.suggestedPrice, // Utiliser le prix personnalisé ou le prix suggéré
    }));

    await this.prisma.vendorProductSizePrice.createMany({
      data: sizePricesData
    });

    console.log(`✅ ${sizePricesData.length} prix par taille créés`);
  } else if (baseProduct.sizePrices && baseProduct.sizePrices.length > 0) {
    // 🆕 Fallback: Copier les prix du produit admin si aucun prix personnalisé
    console.log('💰 Copie des prix par taille depuis le produit admin...');

    const sizePricesData = baseProduct.sizePrices.map(sp => ({
      vendorProductId: vendorProduct.id,
      size: sp.size,
      costPrice: sp.costPrice,
      suggestedPrice: sp.suggestedPrice,
      salePrice: sp.suggestedPrice, // Prix de vente par défaut = prix suggéré
    }));

    await this.prisma.vendorProductSizePrice.createMany({
      data: sizePricesData
    });

    console.log(`✅ ${sizePricesData.length} prix par taille copiés depuis le produit admin`);
  }

  // ... reste du code de création (design, images, etc.)

  return {
    success: true,
    productId: vendorProduct.id,
    message: 'Produit vendeur créé avec succès',
    data: await this.getVendorProductWithSizePrices(vendorProduct.id)
  };
}

// 🆕 Méthode helper pour récupérer un produit avec ses prix par taille
async getVendorProductWithSizePrices(vendorProductId: number) {
  const product = await this.prisma.vendorProduct.findUnique({
    where: { id: vendorProductId },
    include: {
      sizePrices: {
        orderBy: { size: 'asc' }
      },
      vendor: {
        select: {
          id: true,
          fullName: true,
          shopName: true,
        }
      },
      baseProduct: {
        include: {
          sizePrices: true, // Prix admin pour référence
        }
      }
    }
  });

  if (!product) {
    throw new NotFoundException('Produit vendeur non trouvé');
  }

  // Calculer les prix min/max
  const sizePrices = product.sizePrices || [];
  const minPrice = sizePrices.length > 0
    ? Math.min(...sizePrices.map(sp => sp.salePrice || sp.suggestedPrice))
    : product.vendorPrice;
  const maxPrice = sizePrices.length > 0
    ? Math.max(...sizePrices.map(sp => sp.salePrice || sp.suggestedPrice))
    : product.vendorPrice;

  return {
    ...product,
    priceRange: {
      min: minPrice,
      max: maxPrice,
      hasMultiplePrices: minPrice !== maxPrice
    },
    useGlobalPricing: product.useGlobalPricing,
    globalCostPrice: product.globalCostPrice,
    globalSuggestedPrice: product.globalSuggestedPrice,
  };
}
```

### 4. Controller Vendor (`src/vendor/vendor-product.controller.ts`)

Mettre à jour la réponse de l'endpoint pour inclure les prix par taille :

```typescript
@Post()
@UseGuards(JwtAuthGuard)
async createVendorProduct(
  @Body() dto: VendorPublishDto,
  @Request() req,
) {
  const vendorId = req.user?.sub || req.user?.id || req.user?.vendorId;

  const result = await this.vendorProductService.createVendorProduct(dto, vendorId);

  return {
    success: true,
    message: result.message,
    productId: result.productId,
    data: {
      id: result.data.id,
      vendorName: result.data.vendorName,
      vendorPrice: result.data.vendorPrice,
      status: result.data.status,

      // 🆕 Informations sur les prix par taille
      priceRange: result.data.priceRange,
      useGlobalPricing: result.data.useGlobalPricing,
      globalCostPrice: result.data.globalCostPrice,
      globalSuggestedPrice: result.data.globalSuggestedPrice,
      sizePrices: result.data.sizePrices?.map(sp => ({
        size: sp.size,
        costPrice: sp.costPrice,
        suggestedPrice: sp.suggestedPrice,
        salePrice: sp.salePrice,
      })),

      // ... autres champs
    }
  };
}

@Get()
@UseGuards(JwtAuthGuard)
async getVendorProducts(@Request() req) {
  const vendorId = req.user?.sub || req.user?.id || req.user?.vendorId;

  const products = await this.prisma.vendorProduct.findMany({
    where: {
      vendorId,
      isDeleted: false // Si vous utilisez le soft delete
    },
    include: {
      sizePrices: {
        orderBy: { size: 'asc' }
      },
      baseProduct: {
        include: {
          sizePrices: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Transformer les produits pour inclure les informations de prix
  return {
    success: true,
    data: products.map(product => {
      const sizePrices = product.sizePrices || [];
      const minPrice = sizePrices.length > 0
        ? Math.min(...sizePrices.map(sp => sp.salePrice || sp.suggestedPrice))
        : product.vendorPrice;
      const maxPrice = sizePrices.length > 0
        ? Math.max(...sizePrices.map(sp => sp.salePrice || sp.suggestedPrice))
        : product.vendorPrice;

      return {
        id: product.id,
        vendorName: product.vendorName,
        vendorPrice: product.vendorPrice,
        status: product.status,

        // 🆕 Prix par taille
        priceRange: {
          min: minPrice,
          max: maxPrice,
          display: minPrice === maxPrice
            ? `${minPrice} FCFA`
            : `De ${minPrice} à ${maxPrice} FCFA`
        },
        useGlobalPricing: product.useGlobalPricing,
        sizePrices: sizePrices.map(sp => ({
          size: sp.size,
          costPrice: sp.costPrice,
          suggestedPrice: sp.suggestedPrice,
          salePrice: sp.salePrice,
        })),

        // ... autres champs
      };
    })
  };
}
```

---

## Structure des Données

### Payload Frontend → Backend

```json
{
  "baseProductId": 123,
  "designId": 456,
  "vendorName": "T-Shirt Personnalisé",
  "vendorDescription": "T-shirt avec mon design unique",
  "vendorPrice": 15000,
  "vendorStock": 50,

  "selectedColors": [
    { "id": 1, "name": "Noir", "colorCode": "#000000", "isActive": true }
  ],
  "selectedSizes": [
    { "id": 1, "sizeName": "S", "isActive": true },
    { "id": 2, "sizeName": "M", "isActive": true },
    { "id": 3, "sizeName": "L", "isActive": true }
  ],

  "productStructure": { ... },
  "designPosition": { ... },

  // 🆕 Prix par taille
  "useGlobalPricing": false,
  "sizePricing": [
    {
      "size": "S",
      "costPrice": 8000,
      "suggestedPrice": 12000,
      "salePrice": 15000
    },
    {
      "size": "M",
      "costPrice": 8500,
      "suggestedPrice": 13000,
      "salePrice": 16000
    },
    {
      "size": "L",
      "costPrice": 9000,
      "suggestedPrice": 14000,
      "salePrice": 17000
    }
  ],

  "forcedStatus": "PENDING",
  "postValidationAction": "AUTO_PUBLISH"
}
```

### Réponse Backend → Frontend

```json
{
  "success": true,
  "message": "Produit vendeur créé avec succès",
  "productId": 789,
  "data": {
    "id": 789,
    "vendorName": "T-Shirt Personnalisé",
    "vendorPrice": 15000,
    "status": "PENDING",

    // 🆕 Informations sur les prix par taille
    "priceRange": {
      "min": 15000,
      "max": 17000,
      "display": "De 15,000 à 17,000 FCFA",
      "hasMultiplePrices": true
    },
    "useGlobalPricing": false,
    "sizePrices": [
      {
        "size": "S",
        "costPrice": 8000,
        "suggestedPrice": 12000,
        "salePrice": 15000
      },
      {
        "size": "M",
        "costPrice": 8500,
        "suggestedPrice": 13000,
        "salePrice": 16000
      },
      {
        "size": "L",
        "costPrice": 9000,
        "suggestedPrice": 14000,
        "salePrice": 17000
      }
    ],

    // ... autres champs
  }
}
```

---

## Migration de la Base de Données

```bash
# Créer une migration Prisma
npx prisma migrate dev --name add_vendor_size_pricing

# Ou en production
npx prisma migrate deploy --name add_vendor_size_pricing
```

SQL généré (approximatif) :

```sql
-- Ajouter les champs à vendor_products
ALTER TABLE vendor_products
  ADD COLUMN use_global_pricing BOOLEAN DEFAULT false,
  ADD COLUMN global_cost_price INTEGER,
  ADD COLUMN global_suggested_price INTEGER;

-- Créer la table vendor_product_size_prices
CREATE TABLE vendor_product_size_prices (
  id SERIAL PRIMARY KEY,
  vendor_product_id INTEGER NOT NULL REFERENCES vendor_products(id) ON DELETE CASCADE,
  size VARCHAR(50) NOT NULL,
  cost_price INTEGER NOT NULL,
  suggested_price INTEGER NOT NULL,
  sale_price INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_product_id, size)
);

-- Index
CREATE INDEX idx_vendor_product_size_prices_vendor_product_id ON vendor_product_size_prices(vendor_product_id);
```

---

## Validation des Données

### Règles de Validation

1. **Si `useGlobalPricing = true`** :
   - `globalCostPrice` et `globalSuggestedPrice` doivent être définis
   - Tous les prix de vente utilisent ces valeurs globales
   - `sizePricing` peut être vide ou ignoré

2. **Si `useGlobalPricing = false`** :
   - `sizePricing` doit contenir au moins une entrée
   - Chaque entrée doit avoir : `size`, `costPrice`, `suggestedPrice`
   - `salePrice` est optionnel (par défaut = `suggestedPrice`)

3. **Prix minimum** :
   - `salePrice >= costPrice * 1.10` (marge minimum de 10%)
   - Avertissement si `salePrice < suggestedPrice`

---

## Compatibilité

### Version API

- **Endpoint**: `POST /vendor/products`
- **Version**: Compatible avec l'API existante
- **Rétrocompatibilité**: Les prix par taille sont optionnels

### Frontend

Le composant `SizePricingConfig` envoie déjà les données dans le bon format via `useVendorPublish`. Aucune modification frontend n'est nécessaire une fois le backend mis à jour.

---

## Tests

### Test 1: Création avec prix par taille

```bash
curl -X POST http://localhost:3004/vendor/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "baseProductId": 123,
    "designId": 456,
    "vendorName": "T-Shirt Test",
    "vendorPrice": 15000,
    "useGlobalPricing": false,
    "sizePricing": [
      { "size": "S", "costPrice": 8000, "suggestedPrice": 12000, "salePrice": 15000 },
      { "size": "M", "costPrice": 8500, "suggestedPrice": 13000, "salePrice": 16000 }
    ]
  }'
```

Résultat attendu : Produit créé avec 2 entrées dans `vendor_product_size_prices`.

### Test 2: Récupération des produits vendeur

```bash
curl http://localhost:3004/vendor/products \
  -H "Authorization: Bearer <token>"
```

Résultat attendu : Liste de produits avec `priceRange` et `sizePrices`.

---

## Résumé des Changements

| Fichier | Changement |
|---------|-----------|
| `prisma/schema.prisma` | Ajout champs `useGlobalPricing`, `globalCostPrice`, `globalSuggestedPrice` à `VendorProduct` |
| `prisma/schema.prisma` | Nouveau modèle `VendorProductSizePrice` |
| `src/vendor/dto/vendor-publish.dto.ts` | Ajout champs `sizePricing`, `useGlobalPricing`, etc. |
| `src/vendor/vendor-product.service.ts` | Traitement des prix par taille lors de la création |
| `src/vendor/vendor-product.controller.ts` | Inclusion des prix par taille dans les réponses |

---

**Date de création**: 31 janvier 2026
**Version**: 1.0.0
