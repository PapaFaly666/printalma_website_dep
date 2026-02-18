és# Guide Backend - Gestion des Produits Vendeurs Autocollants

## 📋 Résumé

Ce guide explique comment le backend doit gérer les produits vendeurs lorsque le produit de base est un **autocollant** (genre: `AUTOCOLLANT`). Les autocollants nécessitent un traitement différent des autres produits car ils n'ont pas de variations de tailles et de couleurs comme les vêtements.

---

## 🎯 Objectif

Permettre au backend de :
1. **Détecter** si un produit est un autocollant
2. **Valider** correctement les données en fonction du type
3. **Stocker** les informations appropriées
4. **Générer** les réponses API adaptées

---

## 🔍 Détection d'un Autocollant

### Base de données (Prisma Schema)

Dans votre schéma Prisma, le modèle `Product` a un champ `genre` :

```prisma
model Product {
  id          Int            @id @default(autoincrement())
  name        String
  genre       ProductGenre?  @default(UNISEXE)
  // ... autres champs
}

enum ProductGenre {
  HOMME
  FEMME
  BEBE
  UNISEXE
  AUTOCOLLANT  // ✅ Identifie un autocollant
}
```

### Comment détecter

```typescript
// Dans votre service ou contrôleur
const product = await prisma.product.findUnique({
  where: { id: baseProductId }
});

const isSticker = product.genre === 'AUTOCOLLANT';
```

---

## 📥 Endpoint: Création de Produit Vendeur

### Route
```
POST /vendor/products
```

### Différences de Payload

#### Produit Normal (T-shirt, etc.)
```json
{
  "baseProductId": 123,
  "name": "Mon T-shirt personnalisé",
  "description": "Un super t-shirt",
  "price": 15000,
  "stock": 100,
  "sizes": ["S", "M", "L", "XL"],
  "colors": [
    {
      "id": 1,
      "name": "Rouge",
      "colorCode": "#FF0000"
    },
    {
      "id": 2,
      "name": "Bleu",
      "colorCode": "#0000FF"
    }
  ],
  "designId": 456
}
```

#### Autocollant
```json
{
  "baseProductId": 789,
  "name": "Mon Autocollant Logo",
  "description": "Autocollant avec mon logo",
  "price": 2500,
  "stock": 500,
  "sizes": ["10x10"],  // ✅ Peut avoir des tailles (dimensions en cm)
  "colors": [],        // ✅ Vide ou absent (pas de variations de couleurs)
  "designId": 456
}
```

---

## ✅ Validation Backend

### DTO (Data Transfer Object)

Créez ou modifiez votre DTO pour gérer les autocollants :

```typescript
// src/vendor/dto/create-vendor-product.dto.ts

import { IsInt, IsString, IsOptional, IsArray, IsNotEmpty, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVendorProductDto {
  @ApiProperty({ example: 123 })
  @IsInt()
  @IsNotEmpty()
  baseProductId: number;

  @ApiProperty({ example: 'Mon Produit' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Description du produit', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 15000 })
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: ['S', 'M', 'L'], type: [String] })
  @IsArray()
  @IsOptional()
  sizes?: string[];

  @ApiProperty({
    example: [{ id: 1, name: 'Rouge', colorCode: '#FF0000' }],
    type: 'array',
    required: false
  })
  @IsArray()
  @IsOptional()
  colors?: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;

  @ApiProperty({ example: 456, required: false })
  @IsInt()
  @IsOptional()
  designId?: number;

  @ApiProperty({
    example: 'AUTO_PUBLISH',
    enum: ['AUTO_PUBLISH', 'TO_DRAFT'],
    required: false
  })
  @IsEnum(['AUTO_PUBLISH', 'TO_DRAFT'])
  @IsOptional()
  postValidationAction?: 'AUTO_PUBLISH' | 'TO_DRAFT';
}
```

### Service de Validation

Créez une méthode de validation spécifique :

```typescript
// src/vendor/services/vendor-product.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorProductDto } from './dto/create-vendor-product.dto';

@Injectable()
export class VendorProductService {
  constructor(private prisma: PrismaService) {}

  async create(vendorId: number, dto: CreateVendorProductDto) {
    // 1. Récupérer le produit de base
    const baseProduct = await this.prisma.product.findUnique({
      where: { id: dto.baseProductId },
      include: {
        colorVariations: true,
        sizes: true
      }
    });

    if (!baseProduct) {
      throw new BadRequestException('Produit de base introuvable');
    }

    // 2. Détecter si c'est un autocollant
    const isSticker = baseProduct.genre === 'AUTOCOLLANT';

    // 3. Validation spécifique
    if (isSticker) {
      this.validateStickerProduct(dto, baseProduct);
    } else {
      this.validateNormalProduct(dto, baseProduct);
    }

    // 4. Créer le produit vendeur
    return this.createVendorProduct(vendorId, dto, baseProduct, isSticker);
  }

  /**
   * Validation pour les autocollants
   */
  private validateStickerProduct(dto: CreateVendorProductDto, baseProduct: any) {
    // ✅ Les autocollants n'ont PAS besoin de couleurs
    if (dto.colors && dto.colors.length > 0) {
      throw new BadRequestException(
        'Les autocollants ne peuvent pas avoir de variations de couleurs'
      );
    }

    // ✅ Les autocollants peuvent avoir des tailles (dimensions)
    // Mais c'est optionnel car certains autocollants ont une taille unique
    if (!dto.sizes || dto.sizes.length === 0) {
      // Utiliser une taille par défaut si non fournie
      dto.sizes = ['Standard'];
    }

    // ✅ Vérifier qu'un design est fourni (obligatoire pour les autocollants)
    if (!dto.designId) {
      throw new BadRequestException(
        'Un design est obligatoire pour créer un autocollant'
      );
    }
  }

  /**
   * Validation pour les produits normaux (vêtements, etc.)
   */
  private validateNormalProduct(dto: CreateVendorProductDto, baseProduct: any) {
    // ✅ Les produits normaux DOIVENT avoir au moins une couleur
    if (!dto.colors || dto.colors.length === 0) {
      throw new BadRequestException(
        'Au moins une couleur est requise pour ce type de produit'
      );
    }

    // ✅ Les produits normaux DOIVENT avoir au moins une taille
    if (!dto.sizes || dto.sizes.length === 0) {
      throw new BadRequestException(
        'Au moins une taille est requise pour ce type de produit'
      );
    }

    // ✅ Vérifier que les couleurs sélectionnées existent dans le produit de base
    const baseColorIds = baseProduct.colorVariations.map((c: any) => c.id);
    const invalidColors = dto.colors.filter(c => !baseColorIds.includes(c.id));

    if (invalidColors.length > 0) {
      throw new BadRequestException(
        `Couleurs invalides: ${invalidColors.map(c => c.name).join(', ')}`
      );
    }

    // ✅ Vérifier que les tailles sélectionnées existent dans le produit de base
    const baseSizes = baseProduct.sizes.map((s: any) => s.sizeName);
    const invalidSizes = dto.sizes.filter(s => !baseSizes.includes(s));

    if (invalidSizes.length > 0) {
      throw new BadRequestException(
        `Tailles invalides: ${invalidSizes.join(', ')}`
      );
    }
  }

  /**
   * Création du produit vendeur dans la base de données
   */
  private async createVendorProduct(
    vendorId: number,
    dto: CreateVendorProductDto,
    baseProduct: any,
    isSticker: boolean
  ) {
    // Préparer les données selon le type
    const colors = isSticker
      ? [] // ✅ Pas de couleurs pour les autocollants
      : dto.colors || [];

    const sizes = dto.sizes || [];

    // Créer le produit vendeur
    const vendorProduct = await this.prisma.vendorProduct.create({
      data: {
        vendorId,
        baseProductId: dto.baseProductId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        sizes: sizes,       // JSON array
        colors: colors,     // JSON array (vide pour autocollants)
        designId: dto.designId,
        status: 'PENDING',  // En attente de validation admin
        postValidationAction: dto.postValidationAction || 'AUTO_PUBLISH',

        // Copier les informations du produit de base
        adminProductName: baseProduct.name,
        adminProductDescription: baseProduct.description,
        adminProductPrice: baseProduct.price,
      },
      include: {
        baseProduct: true,
        design: true,
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
            email: true
          }
        }
      }
    });

    return vendorProduct;
  }

  /**
   * Récupérer un produit vendeur avec informations sur le type
   */
  async findOne(id: number) {
    const vendorProduct = await this.prisma.vendorProduct.findUnique({
      where: { id },
      include: {
        baseProduct: {
          select: {
            id: true,
            name: true,
            genre: true,  // ✅ Inclure le genre pour détection autocollant
            description: true,
            price: true,
            colorVariations: true,
            sizes: true
          }
        },
        design: true,
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true
          }
        }
      }
    });

    if (!vendorProduct) {
      throw new BadRequestException('Produit vendeur introuvable');
    }

    // ✅ Ajouter un flag pour indiquer si c'est un autocollant
    return {
      ...vendorProduct,
      isSticker: vendorProduct.baseProduct.genre === 'AUTOCOLLANT'
    };
  }

  /**
   * Lister les produits d'un vendeur avec filtrage par type
   */
  async findByVendor(vendorId: number, filters?: { isSticker?: boolean }) {
    const where: any = { vendorId };

    // Filtrer par type si demandé
    if (filters?.isSticker !== undefined) {
      where.baseProduct = {
        genre: filters.isSticker ? 'AUTOCOLLANT' : { not: 'AUTOCOLLANT' }
      };
    }

    const vendorProducts = await this.prisma.vendorProduct.findMany({
      where,
      include: {
        baseProduct: {
          select: {
            id: true,
            name: true,
            genre: true,  // ✅ Inclure le genre
          }
        },
        design: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // ✅ Ajouter le flag isSticker à chaque produit
    return vendorProducts.map(vp => ({
      ...vp,
      isSticker: vp.baseProduct.genre === 'AUTOCOLLANT'
    }));
  }
}
```

---

## 📤 Réponse API

### Format de Réponse

#### Produit Normal
```json
{
  "id": 123,
  "vendorId": 456,
  "baseProductId": 789,
  "name": "Mon T-shirt personnalisé",
  "description": "Un super t-shirt",
  "price": 15000,
  "stock": 100,
  "status": "PENDING",
  "isSticker": false,
  "sizes": ["S", "M", "L", "XL"],
  "colors": [
    {
      "id": 1,
      "name": "Rouge",
      "colorCode": "#FF0000"
    }
  ],
  "designId": 456,
  "baseProduct": {
    "id": 789,
    "name": "T-shirt Premium",
    "genre": "UNISEXE"
  },
  "createdAt": "2024-01-10T10:00:00Z"
}
```

#### Autocollant
```json
{
  "id": 124,
  "vendorId": 456,
  "baseProductId": 790,
  "name": "Mon Autocollant Logo",
  "description": "Autocollant avec mon logo",
  "price": 2500,
  "stock": 500,
  "status": "PENDING",
  "isSticker": true,
  "sizes": ["10x10", "15x15"],
  "colors": [],  // ✅ Vide pour les autocollants
  "designId": 456,
  "baseProduct": {
    "id": 790,
    "name": "Autocollant Standard",
    "genre": "AUTOCOLLANT"
  },
  "createdAt": "2024-01-10T10:00:00Z"
}
```

---

## 🔧 Contrôleur (Controller)

```typescript
// src/vendor/controllers/vendor-product.controller.ts

import { Controller, Post, Get, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorProductService } from '../services/vendor-product.service';
import { CreateVendorProductDto } from '../dto/create-vendor-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VendorGuard } from '../../auth/guards/vendor.guard';

@ApiTags('Vendor Products')
@Controller('vendor/products')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth()
export class VendorProductController {
  constructor(private readonly vendorProductService: VendorProductService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un produit vendeur (supporte autocollants et produits normaux)' })
  async create(@Req() req, @Body() dto: CreateVendorProductDto) {
    const vendorId = req.user.id;
    return this.vendorProductService.create(vendorId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les produits du vendeur' })
  async findAll(
    @Req() req,
    @Query('isSticker') isSticker?: string
  ) {
    const vendorId = req.user.id;

    // Filtrer par type si demandé
    const filters = isSticker !== undefined
      ? { isSticker: isSticker === 'true' }
      : undefined;

    return this.vendorProductService.findByVendor(vendorId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un produit vendeur' })
  async findOne(@Param('id') id: string) {
    return this.vendorProductService.findOne(parseInt(id));
  }
}
```

---

## 📊 Exemples de Requêtes

### 1. Créer un autocollant

```bash
POST /vendor/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "baseProductId": 790,
  "name": "Autocollant Logo Entreprise",
  "description": "Autocollant haute qualité avec logo",
  "price": 2500,
  "stock": 500,
  "sizes": ["10x10", "15x15"],
  "designId": 456,
  "postValidationAction": "AUTO_PUBLISH"
}
```

### 2. Créer un t-shirt

```bash
POST /vendor/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "baseProductId": 123,
  "name": "T-shirt personnalisé",
  "description": "T-shirt avec mon design",
  "price": 15000,
  "stock": 100,
  "sizes": ["S", "M", "L", "XL"],
  "colors": [
    { "id": 1, "name": "Rouge", "colorCode": "#FF0000" },
    { "id": 2, "name": "Bleu", "colorCode": "#0000FF" }
  ],
  "designId": 456,
  "postValidationAction": "AUTO_PUBLISH"
}
```

### 3. Lister uniquement les autocollants

```bash
GET /vendor/products?isSticker=true
Authorization: Bearer <token>
```

### 4. Lister uniquement les produits normaux

```bash
GET /vendor/products?isSticker=false
Authorization: Bearer <token>
```

---

## 🎨 Frontend - Envoi des Données

Dans `SellDesignPage.tsx`, le frontend doit envoyer les bonnes données selon le type :

```typescript
// Frontend code example
const createVendorProduct = async (product: Product) => {
  const isSticker = product.genre === 'AUTOCOLLANT';

  const payload = {
    baseProductId: product.id,
    name: editStates[product.id]?.name || product.name,
    description: editStates[product.id]?.description || product.description,
    price: calculateFinalPrice(product),
    stock: calculateTotalStock(product),
    sizes: product.sizes?.map(s => s.sizeName) || [],
    colors: isSticker
      ? []  // ✅ Vide pour les autocollants
      : getSelectedColors(product),
    designId: design.id,
    postValidationAction: 'AUTO_PUBLISH'
  };

  const response = await fetch('/api/vendor/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
};
```

---

## ✅ Checklist d'Implémentation

- [ ] Ajouter la validation `isSticker` dans le service
- [ ] Créer `validateStickerProduct()` et `validateNormalProduct()`
- [ ] Modifier le DTO pour rendre `colors` optionnel
- [ ] Ajouter le champ `isSticker` dans les réponses API
- [ ] Créer le endpoint de filtrage `?isSticker=true/false`
- [ ] Tester la création d'autocollants
- [ ] Tester la création de produits normaux
- [ ] Vérifier que les couleurs sont rejetées pour les autocollants
- [ ] Documenter l'API avec Swagger

---

## 🧪 Tests

### Test 1: Créer un autocollant avec couleurs (doit échouer)

```typescript
describe('VendorProductService - Stickers', () => {
  it('should reject sticker with colors', async () => {
    const dto = {
      baseProductId: STICKER_PRODUCT_ID,
      name: 'Test',
      price: 2500,
      stock: 100,
      colors: [{ id: 1, name: 'Rouge', colorCode: '#FF0000' }],
      designId: 1
    };

    await expect(
      service.create(VENDOR_ID, dto)
    ).rejects.toThrow('Les autocollants ne peuvent pas avoir de variations de couleurs');
  });
});
```

### Test 2: Créer un autocollant sans design (doit échouer)

```typescript
it('should reject sticker without design', async () => {
  const dto = {
    baseProductId: STICKER_PRODUCT_ID,
    name: 'Test',
    price: 2500,
    stock: 100,
    sizes: ['10x10']
  };

  await expect(
    service.create(VENDOR_ID, dto)
  ).rejects.toThrow('Un design est obligatoire pour créer un autocollant');
});
```

### Test 3: Créer un autocollant valide (doit réussir)

```typescript
it('should create sticker successfully', async () => {
  const dto = {
    baseProductId: STICKER_PRODUCT_ID,
    name: 'Mon Autocollant',
    description: 'Super autocollant',
    price: 2500,
    stock: 100,
    sizes: ['10x10', '15x15'],
    designId: 1
  };

  const result = await service.create(VENDOR_ID, dto);

  expect(result).toBeDefined();
  expect(result.colors).toEqual([]);
  expect(result.isSticker).toBe(true);
});
```

---

## 📚 Références

- **Schéma Prisma**: `/prisma/schema.prisma`
- **Documentation Autocollants**: `BACKEND_ADAPTATION_AUTOCOLLANT.md`
- **Frontend**: `src/pages/SellDesignPage.tsx`
- **Service Autocollants**: `backend/src/sticker/` (si applicable)

---

**Date de création**: 26 janvier 2026
**Auteur**: Claude Sonnet 4.5
**Version**: 1.0.0
