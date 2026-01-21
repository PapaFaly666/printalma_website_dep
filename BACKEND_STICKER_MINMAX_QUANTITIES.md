# Backend - Adaptation Stickers: Quantités Min/Max au lieu de Stock

## Contexte

Le système de stickers a été modifié pour **remplacer la gestion du stock** par des **quantités minimale et maximale par commande**.

**Changements:**
- ❌ Supprimer: `stockQuantity` (stock initial)
- ✅ Ajouter: `minQuantity` (minimum d'autocollants par commande, ≥ 1)
- ✅ Ajouter: `maxQuantity` (maximum d'autocollants par commande)

## 1. Modifications du Schéma Prisma

**Fichier:** `prisma/schema.prisma`

```prisma
model StickerProduct {
  id                 Int      @id @default(autoincrement())
  vendorId           Int      @map("vendor_id")
  designId           Int      @map("design_id")

  name               String   @db.VarChar(255)
  description        String?  @db.Text
  sku                String   @unique @db.VarChar(100)

  // Taille (JSON)
  size               Json     @db.Json

  // Finition et forme
  finish             String?  @default("glossy") @db.VarChar(50)
  shape              StickerShape @default(SQUARE)

  // Image générée avec bordures
  imageUrl           String?  @map("image_url") @db.VarChar(500)
  cloudinaryPublicId String?  @map("cloudinary_public_id") @db.VarChar(255)

  // Prix
  finalPrice         Int      @map("final_price")

  // ❌ SUPPRIMER CE CHAMP
  // stockQuantity      Int?     @default(0) @map("stock_quantity")

  // ✅ AJOUTER CES CHAMPS
  minQuantity        Int      @default(1) @map("min_quantity")
  maxQuantity        Int      @default(100) @map("max_quantity")

  // Statut
  status             ProductStatus @default(PENDING)

  // Métadonnées
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  // Relations
  vendor             VendorProfile @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  design             Design @relation(fields: [designId], references: [id])

  @@map("sticker_products")
}

enum StickerShape {
  SQUARE
  CIRCLE
  RECTANGLE
  DIE_CUT
}

enum ProductStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
}
```

### Migration Prisma

```bash
# 1. Créer la migration
npx prisma migrate dev --name replace_stock_with_min_max_quantities

# 2. Appliquer en production
npx prisma migrate deploy

# 3. Regénérer le client Prisma
npx prisma generate
```

### Script de migration des données (optionnel)

Si vous avez déjà des stickers en base avec `stockQuantity`, vous pouvez migrer les données :

```typescript
// scripts/migrate-sticker-quantities.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateStickers() {
  const stickers = await prisma.stickerProduct.findMany({
    where: {
      stockQuantity: { gt: 0 }
    }
  });

  for (const sticker of stickers) {
    await prisma.stickerProduct.update({
      where: { id: sticker.id },
      data: {
        minQuantity: 1,
        maxQuantity: Math.max(sticker.stockQuantity || 100, 100),
        // stockQuantity sera supprimé par la migration
      }
    });
  }

  console.log(`✅ ${stickers.length} stickers migrés avec succès`);
}

migrateStickers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## 2. Modifications du DTO de Création

**Fichier:** `src/sticker/dto/create-sticker.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsObject,
  Min,
  Max,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class StickerSizeDto {
  @ApiProperty({ example: 'medium' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Moyen (10x10 cm)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 10, description: 'Largeur en cm' })
  @IsNumber()
  @Min(1)
  @Max(100)
  width: number;

  @ApiProperty({ example: 10, description: 'Hauteur en cm' })
  @IsNumber()
  @Min(1)
  @Max(100)
  height: number;
}

export enum StickerShape {
  SQUARE = 'SQUARE',
  CIRCLE = 'CIRCLE',
  RECTANGLE = 'RECTANGLE',
  DIE_CUT = 'DIE_CUT'
}

export class CreateStickerDto {
  @ApiProperty({
    example: 123,
    description: 'ID du design à transformer en sticker'
  })
  @IsNumber()
  @IsNotEmpty()
  designId: number;

  @ApiProperty({
    example: 'Autocollant - Mon Design',
    description: 'Nom du produit sticker'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Autocollant personnalisé avec design haute qualité',
    description: 'Description du sticker',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: StickerSizeDto,
    description: 'Taille du sticker (width et height en cm)'
  })
  @ValidateNested()
  @Type(() => StickerSizeDto)
  @IsObject()
  size: StickerSizeDto;

  @ApiProperty({
    example: 2000,
    description: 'Prix du sticker en FCFA (centimes)'
  })
  @IsNumber()
  @Min(100)
  price: number;

  @ApiProperty({
    example: 'glossy',
    description: 'Finition: glossy, matte',
    required: false
  })
  @IsOptional()
  @IsString()
  finish?: string;

  @ApiProperty({
    example: 'SQUARE',
    description: 'Forme du sticker',
    enum: StickerShape,
    required: false
  })
  @IsOptional()
  @IsEnum(StickerShape)
  shape?: StickerShape;

  // ❌ SUPPRIMER CE CHAMP
  // @ApiProperty({ example: 50, description: 'Quantité en stock' })
  // @IsOptional()
  // @IsNumber()
  // @Min(0)
  // stockQuantity?: number;

  // ✅ AJOUTER CES CHAMPS
  @ApiProperty({
    example: 1,
    description: 'Quantité minimale par commande (minimum 1)',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'La quantité minimale doit être au moins 1' })
  minQuantity?: number;

  @ApiProperty({
    example: 100,
    description: 'Quantité maximale par commande',
    minimum: 1,
    maximum: 10000
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  maxQuantity?: number;

  // Configuration de génération d'image
  @ApiProperty({
    example: 'autocollant',
    description: 'Type de sticker: autocollant (bordure fine) ou pare-chocs (bordure large)',
    enum: ['autocollant', 'pare-chocs']
  })
  @IsOptional()
  @IsString()
  stickerType?: 'autocollant' | 'pare-chocs';

  @ApiProperty({
    example: 'glossy-white',
    description: 'Couleur de la bordure: white, glossy-white, matte-white, transparent',
    required: false
  })
  @IsOptional()
  @IsString()
  borderColor?: string;
}
```

## 3. Modifications du Service

**Fichier:** `src/sticker/sticker.service.ts`

### Méthode `create()`

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStickerDto } from './dto/create-sticker.dto';
import { StickerGeneratorService } from './services/sticker-generator.service';
import { StickerCloudinaryService } from './services/sticker-cloudinary.service';

@Injectable()
export class StickerService {
  constructor(
    private prisma: PrismaService,
    private stickerGenerator: StickerGeneratorService,
    private stickerCloudinary: StickerCloudinaryService,
  ) {}

  async create(vendorId: number, dto: CreateStickerDto) {
    // 1. Vérifier que le design existe et appartient au vendeur
    const design = await this.prisma.design.findFirst({
      where: {
        id: dto.designId,
        vendorId: vendorId,
        isValidated: true, // Seulement les designs validés
      },
    });

    if (!design) {
      throw new NotFoundException(
        'Design introuvable ou non validé. Seuls les designs validés peuvent être transformés en stickers.'
      );
    }

    // ✅ Validation des quantités min/max
    const minQuantity = dto.minQuantity ?? 1;
    const maxQuantity = dto.maxQuantity ?? 100;

    if (minQuantity < 1) {
      throw new BadRequestException('La quantité minimale doit être au moins 1');
    }

    if (maxQuantity < minQuantity) {
      throw new BadRequestException(
        `La quantité maximale (${maxQuantity}) doit être supérieure ou égale à la quantité minimale (${minQuantity})`
      );
    }

    // 2. Calculer les dimensions et valider
    const sizeString = `${dto.size.width}x${dto.size.height}`;
    const stickerType = dto.stickerType || 'autocollant';
    const borderColor = dto.borderColor || 'glossy-white';
    const shape = dto.shape || 'DIE_CUT';

    // 3. Générer un SKU unique
    const sku = await this.generateUniqueSKU(vendorId, dto.designId);

    // 4. Créer le produit sticker en BDD (sans imageUrl pour le moment)
    const sticker = await this.prisma.stickerProduct.create({
      data: {
        vendorId,
        designId: dto.designId,
        name: dto.name,
        description: dto.description,
        sku,
        size: dto.size,
        finish: dto.finish || 'glossy',
        shape,
        finalPrice: dto.price,
        // ❌ NE PLUS UTILISER stockQuantity
        // ✅ UTILISER minQuantity et maxQuantity
        minQuantity,
        maxQuantity,
        status: 'PENDING',
      },
      include: {
        design: {
          select: {
            name: true,
            imageUrl: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    // 5. Générer l'image avec bordures (Sharp)
    try {
      console.log('🎨 Génération de l\'image du sticker...');

      const stickerImageBuffer = await this.stickerGenerator.createStickerFromDesign(
        design.imageUrl,
        stickerType,
        borderColor,
        sizeString,
        shape
      );

      // 6. Upload sur Cloudinary
      console.log('☁️ Upload de l\'image sur Cloudinary...');
      const { url, publicId } = await this.stickerCloudinary.uploadStickerToCloudinary(
        stickerImageBuffer,
        sticker.id,
        dto.designId
      );

      // 7. Mettre à jour le sticker avec l'URL de l'image
      const updatedSticker = await this.prisma.stickerProduct.update({
        where: { id: sticker.id },
        data: {
          imageUrl: url,
          cloudinaryPublicId: publicId,
        },
        include: {
          design: {
            select: {
              name: true,
              imageUrl: true,
              thumbnailUrl: true,
            },
          },
        },
      });

      console.log('✅ Sticker créé avec succès:', {
        id: updatedSticker.id,
        imageUrl: updatedSticker.imageUrl,
        minQuantity: updatedSticker.minQuantity,
        maxQuantity: updatedSticker.maxQuantity,
      });

      return {
        success: true,
        message: 'Sticker créé avec succès',
        productId: updatedSticker.id,
        data: this.formatStickerResponse(updatedSticker),
      };
    } catch (imageError) {
      console.error('❌ Erreur lors de la génération de l\'image:', imageError);

      // Le sticker est créé mais sans image
      return {
        success: true,
        message: 'Sticker créé, mais l\'image n\'a pas pu être générée. Vous pouvez réessayer plus tard.',
        productId: sticker.id,
        data: this.formatStickerResponse(sticker),
        warning: 'Image non générée',
      };
    }
  }

  private formatStickerResponse(sticker: any) {
    return {
      id: sticker.id,
      vendorId: sticker.vendorId,
      designId: sticker.designId,
      name: sticker.name,
      description: sticker.description,
      sku: sticker.sku,
      size: sticker.size,
      finish: sticker.finish,
      shape: sticker.shape,
      imageUrl: sticker.imageUrl,
      finalPrice: sticker.finalPrice,
      // ✅ Retourner les nouvelles quantités
      minQuantity: sticker.minQuantity,
      maxQuantity: sticker.maxQuantity,
      status: sticker.status,
      createdAt: sticker.createdAt,
      updatedAt: sticker.updatedAt,
      design: sticker.design ? {
        name: sticker.design.name,
        imageUrl: sticker.design.imageUrl || sticker.design.thumbnailUrl,
      } : null,
    };
  }

  private async generateUniqueSKU(vendorId: number, designId: number): Promise<string> {
    const count = await this.prisma.stickerProduct.count({
      where: { vendorId },
    });
    return `STK-${vendorId}-${designId}-${count + 1}`;
  }

  // ... autres méthodes (findAll, findOne, update, etc.)
}
```

## 4. Validation Logique lors de la Commande

**Fichier:** `src/orders/orders.service.ts` (ou similaire)

Lorsqu'un client passe commande, il faut valider que la quantité demandée respecte les limites :

```typescript
async validateStickerQuantity(stickerId: number, requestedQuantity: number) {
  const sticker = await this.prisma.stickerProduct.findUnique({
    where: { id: stickerId },
    select: {
      id: true,
      name: true,
      minQuantity: true,
      maxQuantity: true,
    },
  });

  if (!sticker) {
    throw new NotFoundException('Sticker introuvable');
  }

  if (requestedQuantity < sticker.minQuantity) {
    throw new BadRequestException(
      `La quantité minimale pour "${sticker.name}" est de ${sticker.minQuantity} autocollants`
    );
  }

  if (requestedQuantity > sticker.maxQuantity) {
    throw new BadRequestException(
      `La quantité maximale pour "${sticker.name}" est de ${sticker.maxQuantity} autocollants`
    );
  }

  return true;
}
```

## 5. Tests

### Test du DTO

```typescript
// src/sticker/dto/create-sticker.dto.spec.ts
import { validate } from 'class-validator';
import { CreateStickerDto } from './create-sticker.dto';

describe('CreateStickerDto', () => {
  it('devrait valider avec minQuantity = 1', async () => {
    const dto = new CreateStickerDto();
    dto.designId = 123;
    dto.name = 'Test Sticker';
    dto.size = { width: 10, height: 10 };
    dto.price = 2000;
    dto.minQuantity = 1;
    dto.maxQuantity = 100;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('devrait rejeter minQuantity < 1', async () => {
    const dto = new CreateStickerDto();
    dto.designId = 123;
    dto.name = 'Test Sticker';
    dto.size = { width: 10, height: 10 };
    dto.price = 2000;
    dto.minQuantity = 0; // ❌ Invalide

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.min).toBeDefined();
  });

  it('devrait accepter maxQuantity >= minQuantity', async () => {
    const dto = new CreateStickerDto();
    dto.designId = 123;
    dto.name = 'Test Sticker';
    dto.size = { width: 10, height: 10 };
    dto.price = 2000;
    dto.minQuantity = 5;
    dto.maxQuantity = 100;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
```

### Test du Service

```typescript
// src/sticker/sticker.service.spec.ts
describe('StickerService', () => {
  it('devrait créer un sticker avec minQuantity=1 et maxQuantity=100 par défaut', async () => {
    const dto: CreateStickerDto = {
      designId: 123,
      name: 'Test Sticker',
      size: { width: 10, height: 10 },
      price: 2000,
    };

    const result = await service.create(1, dto);

    expect(result.data.minQuantity).toBe(1);
    expect(result.data.maxQuantity).toBe(100);
  });

  it('devrait rejeter maxQuantity < minQuantity', async () => {
    const dto: CreateStickerDto = {
      designId: 123,
      name: 'Test Sticker',
      size: { width: 10, height: 10 },
      price: 2000,
      minQuantity: 10,
      maxQuantity: 5, // ❌ Invalide
    };

    await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
  });
});
```

## 6. Documentation API (Swagger)

L'endpoint `POST /vendor/stickers` aura cette documentation mise à jour :

```json
{
  "designId": 123,
  "name": "Autocollant - Mon Design",
  "description": "Autocollant personnalisé",
  "size": {
    "width": 10,
    "height": 10
  },
  "price": 2000,
  "finish": "glossy",
  "shape": "DIE_CUT",
  "minQuantity": 1,
  "maxQuantity": 100,
  "stickerType": "autocollant",
  "borderColor": "glossy-white"
}
```

**Réponse:**

```json
{
  "success": true,
  "message": "Sticker créé avec succès",
  "productId": 456,
  "data": {
    "id": 456,
    "vendorId": 1,
    "designId": 123,
    "name": "Autocollant - Mon Design",
    "sku": "STK-1-123-1",
    "size": {
      "width": 10,
      "height": 10
    },
    "finish": "glossy",
    "shape": "DIE_CUT",
    "imageUrl": "https://res.cloudinary.com/.../sticker_456_design_123_1234567890.png",
    "finalPrice": 2000,
    "minQuantity": 1,
    "maxQuantity": 100,
    "status": "PENDING",
    "createdAt": "2026-01-21T10:00:00.000Z",
    "updatedAt": "2026-01-21T10:00:00.000Z"
  }
}
```

## 7. Résumé des Changements

| Avant | Après |
|-------|-------|
| `stockQuantity: number` (stock initial) | ❌ Supprimé |
| - | ✅ `minQuantity: number` (minimum: 1) |
| - | ✅ `maxQuantity: number` (maximum par commande) |

### Validation
- ✅ `minQuantity` doit être **≥ 1**
- ✅ `maxQuantity` doit être **≥ minQuantity**
- ✅ Lors d'une commande, la quantité demandée doit être entre `minQuantity` et `maxQuantity`

### Valeurs par défaut
- `minQuantity`: **1** (au moins 1 autocollant)
- `maxQuantity`: **100** (100 autocollants max par commande)

## 8. Checklist d'Implémentation

- [ ] Modifier `prisma/schema.prisma`
  - [ ] Supprimer `stockQuantity`
  - [ ] Ajouter `minQuantity Int @default(1)`
  - [ ] Ajouter `maxQuantity Int @default(100)`
- [ ] Créer et appliquer la migration Prisma
  ```bash
  npx prisma migrate dev --name replace_stock_with_min_max_quantities
  ```
- [ ] Modifier `src/sticker/dto/create-sticker.dto.ts`
  - [ ] Supprimer `stockQuantity`
  - [ ] Ajouter `minQuantity` avec validation `@Min(1)`
  - [ ] Ajouter `maxQuantity` avec validation `@Min(1)` et `@Max(10000)`
- [ ] Modifier `src/sticker/sticker.service.ts`
  - [ ] Remplacer `stockQuantity` par `minQuantity` et `maxQuantity` dans `create()`
  - [ ] Ajouter validation `maxQuantity >= minQuantity`
  - [ ] Mettre à jour `formatStickerResponse()` pour retourner les nouveaux champs
- [ ] Ajouter validation dans `src/orders/orders.service.ts`
  - [ ] Vérifier que la quantité commandée est entre `minQuantity` et `maxQuantity`
- [ ] Mettre à jour la documentation Swagger
- [ ] Écrire les tests unitaires
- [ ] Tester en local
- [ ] Déployer en production

## 9. FAQ

**Q: Que se passe-t-il si je ne fournis pas `minQuantity` et `maxQuantity` ?**
R: Valeurs par défaut : `minQuantity = 1`, `maxQuantity = 100`

**Q: Peut-on avoir `minQuantity = 0` ?**
R: Non, la quantité minimale doit être au moins 1.

**Q: Quelle est la quantité maximale autorisée ?**
R: 10,000 autocollants (configurable via `@Max(10000)`)

**Q: Faut-il migrer les anciennes données ?**
R: Si vous avez déjà des stickers avec `stockQuantity`, utilisez le script de migration fourni ci-dessus.

**Q: Comment gérer les commandes avec les anciennes données ?**
R: La migration Prisma supprimera automatiquement `stockQuantity` et appliquera les valeurs par défaut `minQuantity=1` et `maxQuantity=100`.

---

**Date:** 21 janvier 2026
**Version:** 2.0.0
**Auteur:** Claude Sonnet 4.5
