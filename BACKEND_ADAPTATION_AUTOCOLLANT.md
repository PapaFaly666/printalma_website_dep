# Documentation Backend - Adaptation Système Autocollant

## Date de création
24 janvier 2026

## Auteur
Claude Sonnet 4.5

---

## 📋 Résumé des changements frontend

Le frontend a été modifié pour améliorer la gestion des autocollants dans `/admin/add-product` :

### Changements principaux :

1. **Nouveau genre : AUTOCOLLANT**
   - Ajouté aux options de Genre cible
   - Les autocollants ne nécessitent pas de gestion de stock

2. **Gestion automatique du stock**
   - Nouveau champ : `requiresStock?: boolean` dans `ProductFormData`
   - Si `genre === 'AUTOCOLLANT'` → `requiresStock = false` automatiquement
   - Le checkbox de gestion de stock est masqué pour les autocollants

3. **Navigation simplifiée**
   - Pour les produits avec `requiresStock === false` :
     - L'étape 4 (Gestion du stock) est automatiquement masquée
     - Navigation : Étape 1 → 2 → 3 → 5 → 6 (saute l'étape 4)

4. **Prix par variation de couleur**
   - Pour les autocollants, chaque variation de couleur peut avoir son propre prix
   - Pré-rempli avec le `suggestedPrice` du produit

---

## 🎯 Adaptations requises côté Backend

### 1. Modèle Prisma - Ajout du champ `requiresStock`

**Fichier :** `prisma/schema.prisma`

#### Modèle `Product`

```prisma
model Product {
  id                Int       @id @default(autoincrement())
  name              String    @db.VarChar(255)
  price             Float     // Prix de revient
  suggestedPrice    Float?    @map("suggested_price") // Prix de vente suggéré
  stock             Int?      @default(0)
  status            String    @default("published") @db.VarChar(50)
  description       String    @db.Text

  // Nouveau champ pour la gestion du stock
  requiresStock     Boolean   @default(true) @map("requires_stock") @db.Boolean

  // Genre cible (HOMME, FEMME, BEBE, UNISEXE, AUTOCOLLANT)
  genre             String?   @db.VarChar(50)

  // Relations et autres champs existants
  categoryId        Int?      @map("category_id")
  category          Category? @relation(fields: [categoryId], references: [id])

  colorVariations   ColorVariation[]
  sizes             ProductSize[]

  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  @@map("products")
}
```

#### Modèle `ColorVariation`

```prisma
model ColorVariation {
  id          Int       @id @default(autoincrement())
  productId   Int       @map("product_id")
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  name        String    @db.VarChar(100) // Ex: "Noir", "Blanc"
  colorCode   String    @db.VarChar(7)   // Ex: "#000000"

  // Nouveau : Prix spécifique pour cette couleur (pour autocollants)
  price       Float?    @map("price")

  // Stock par taille pour cette couleur
  stock       Json?     @db.Json // Format: { "M": 10, "L": 15, "XL": 5 }

  images      ColorVariationImage[]

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("color_variations")
}
```

---

### 2. DTOs - Mise à jour des types TypeScript

**Fichier :** `src/products/dto/create-product.dto.ts`

```typescript
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum ProductGenre {
  HOMME = 'HOMME',
  FEMME = 'FEMME',
  BEBE = 'BEBE',
  UNISEXE = 'UNISEXE',
  AUTOCOLLANT = 'AUTOCOLLANT'
}

export class ColorVariationDto {
  @ApiProperty({ example: 'Noir' })
  @IsString()
  name: string;

  @ApiProperty({ example: '#000000' })
  @IsString()
  colorCode: string;

  @ApiProperty({
    example: 2500,
    required: false,
    description: 'Prix spécifique pour cette variation (utilisé pour les autocollants)'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    example: { M: 10, L: 15, XL: 5 },
    required: false,
    description: 'Stock par taille pour cette couleur'
  })
  @IsOptional()
  stock?: { [size: string]: number };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  images?: any[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'T-shirt Premium' })
  @IsString()
  name: string;

  @ApiProperty({ example: 5000, description: 'Prix de revient (FCFA)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 8000,
    required: false,
    description: 'Prix de vente suggéré (FCFA)'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  suggestedPrice?: number;

  @ApiProperty({ example: 'Description du produit' })
  @IsString()
  description: string;

  @ApiProperty({
    enum: ProductGenre,
    example: ProductGenre.UNISEXE,
    required: false,
    description: 'Genre cible du produit'
  })
  @IsOptional()
  @IsEnum(ProductGenre)
  genre?: ProductGenre;

  @ApiProperty({
    example: true,
    default: true,
    description: 'Indique si le produit nécessite une gestion de stock'
  })
  @IsOptional()
  @IsBoolean()
  requiresStock?: boolean;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'ID de la catégorie'
  })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({
    type: [ColorVariationDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorVariationDto)
  colorVariations?: ColorVariationDto[];

  @ApiProperty({
    example: ['M', 'L', 'XL'],
    required: false
  })
  @IsOptional()
  @IsArray()
  sizes?: string[];
}
```

---

### 3. Service - Logique métier

**Fichier :** `src/products/products.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductGenre } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: number) {
    const {
      name,
      price,
      suggestedPrice,
      description,
      genre,
      requiresStock,
      stock,
      categoryId,
      colorVariations,
      sizes
    } = createProductDto;

    // Validation : Si AUTOCOLLANT, requiresStock doit être false
    if (genre === ProductGenre.AUTOCOLLANT && requiresStock !== false) {
      throw new BadRequestException(
        'Les produits de type AUTOCOLLANT ne peuvent pas avoir de gestion de stock'
      );
    }

    // Validation : Prix de vente suggéré obligatoire
    if (!suggestedPrice || suggestedPrice <= 0) {
      throw new BadRequestException('Le prix de vente suggéré est obligatoire');
    }

    // Validation : Stock requis uniquement si requiresStock === true
    if (requiresStock === true && stock === undefined) {
      throw new BadRequestException(
        'Le stock initial est requis pour les produits avec gestion de stock'
      );
    }

    // Pour les autocollants, valider que chaque variation de couleur a un prix
    if (genre === ProductGenre.AUTOCOLLANT && colorVariations) {
      for (const variation of colorVariations) {
        if (!variation.price || variation.price <= 0) {
          throw new BadRequestException(
            `Le prix est obligatoire pour la variation de couleur "${variation.name}"`
          );
        }
      }
    }

    // Créer le produit
    const product = await this.prisma.product.create({
      data: {
        name,
        price,
        suggestedPrice,
        description,
        genre,
        requiresStock: requiresStock ?? true, // Par défaut true
        stock: requiresStock === false ? null : (stock ?? 0),
        categoryId,

        // Créer les variations de couleur
        colorVariations: colorVariations ? {
          create: colorVariations.map(cv => ({
            name: cv.name,
            colorCode: cv.colorCode,
            price: cv.price,
            stock: cv.stock ? JSON.stringify(cv.stock) : null
          }))
        } : undefined,

        // Créer les tailles
        sizes: sizes ? {
          create: sizes.map(size => ({ name: size }))
        } : undefined
      },
      include: {
        colorVariations: true,
        sizes: true,
        category: true
      }
    });

    return {
      success: true,
      message: 'Produit créé avec succès',
      data: product
    };
  }

  async findAll(filters?: {
    genre?: ProductGenre;
    requiresStock?: boolean;
    categoryId?: number;
  }) {
    const products = await this.prisma.product.findMany({
      where: {
        genre: filters?.genre,
        requiresStock: filters?.requiresStock,
        categoryId: filters?.categoryId
      },
      include: {
        colorVariations: true,
        sizes: true,
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: products
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        colorVariations: {
          include: {
            images: true
          }
        },
        sizes: true,
        category: true
      }
    });

    if (!product) {
      throw new BadRequestException(`Produit #${id} non trouvé`);
    }

    return {
      success: true,
      data: product
    };
  }

  async update(id: number, updateData: Partial<CreateProductDto>) {
    const product = await this.findOne(id);

    // Si on change le genre vers AUTOCOLLANT, forcer requiresStock à false
    if (updateData.genre === ProductGenre.AUTOCOLLANT) {
      updateData.requiresStock = false;
      updateData.stock = null;
    }

    // Si on active requiresStock, le stock doit être fourni
    if (updateData.requiresStock === true && updateData.stock === undefined) {
      throw new BadRequestException(
        'Le stock est requis lors de l\'activation de la gestion de stock'
      );
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: updateData.name,
        price: updateData.price,
        suggestedPrice: updateData.suggestedPrice,
        description: updateData.description,
        genre: updateData.genre,
        requiresStock: updateData.requiresStock,
        stock: updateData.requiresStock === false ? null : updateData.stock,
        categoryId: updateData.categoryId
      },
      include: {
        colorVariations: true,
        sizes: true,
        category: true
      }
    });

    return {
      success: true,
      message: 'Produit mis à jour',
      data: updated
    };
  }
}
```

---

### 4. Controller - Endpoints API

**Fichier :** `src/products/products.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, ProductGenre } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau produit (Admin)' })
  @ApiResponse({ status: 201, description: 'Produit créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async create(@Body() createProductDto: CreateProductDto, @Request() req) {
    return this.productsService.create(createProductDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les produits' })
  @ApiQuery({ name: 'genre', enum: ProductGenre, required: false })
  @ApiQuery({ name: 'requiresStock', type: Boolean, required: false })
  @ApiQuery({ name: 'categoryId', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Liste des produits' })
  async findAll(
    @Query('genre') genre?: ProductGenre,
    @Query('requiresStock') requiresStock?: string,
    @Query('categoryId') categoryId?: string
  ) {
    return this.productsService.findAll({
      genre,
      requiresStock: requiresStock === 'true' ? true : requiresStock === 'false' ? false : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un produit par ID' })
  @ApiResponse({ status: 200, description: 'Détails du produit' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(parseInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un produit (Admin)' })
  @ApiResponse({ status: 200, description: 'Produit mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateProductDto>
  ) {
    return this.productsService.update(parseInt(id), updateData);
  }
}
```

---

## 5. Migration Prisma

### Créer la migration

```bash
npx prisma migrate dev --name add_requires_stock_and_variation_price
```

### Contenu de la migration

**Fichier :** `prisma/migrations/XXXXXX_add_requires_stock_and_variation_price/migration.sql`

```sql
-- Ajouter le champ requiresStock au modèle Product
ALTER TABLE "products"
ADD COLUMN "requires_stock" BOOLEAN NOT NULL DEFAULT true;

-- Ajouter le champ price au modèle ColorVariation
ALTER TABLE "color_variations"
ADD COLUMN "price" DOUBLE PRECISION;

-- Mettre à jour les produits existants de type AUTOCOLLANT
UPDATE "products"
SET "requires_stock" = false
WHERE "genre" = 'AUTOCOLLANT';

-- Commentaire
COMMENT ON COLUMN "products"."requires_stock" IS 'Indique si le produit nécessite une gestion de stock';
COMMENT ON COLUMN "color_variations"."price" IS 'Prix spécifique pour cette variation (utilisé pour les autocollants)';
```

---

## 6. Validation des règles métier

### Règles à implémenter

1. **Autocollants sans stock**
   ```typescript
   if (genre === 'AUTOCOLLANT' && requiresStock !== false) {
     throw new BadRequestException('Les autocollants ne peuvent pas avoir de stock');
   }
   ```

2. **Prix de vente suggéré obligatoire**
   ```typescript
   if (!suggestedPrice || suggestedPrice <= 0) {
     throw new BadRequestException('Prix de vente suggéré obligatoire');
   }
   ```

3. **Prix par variation pour autocollants**
   ```typescript
   if (genre === 'AUTOCOLLANT' && colorVariations) {
     for (const variation of colorVariations) {
       if (!variation.price) {
         throw new BadRequestException(
           `Prix obligatoire pour la variation "${variation.name}"`
         );
       }
     }
   }
   ```

4. **Stock requis uniquement si requiresStock === true**
   ```typescript
   if (requiresStock === true && stock === undefined) {
     throw new BadRequestException('Stock requis avec gestion de stock activée');
   }
   ```

---

## 7. Exemples d'utilisation API

### Créer un autocollant

```http
POST /products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Autocollant Logo Entreprise",
  "price": 500,
  "suggestedPrice": 2000,
  "description": "Autocollant haute qualité avec logo",
  "genre": "AUTOCOLLANT",
  "requiresStock": false,
  "categoryId": 5,
  "colorVariations": [
    {
      "name": "Noir",
      "colorCode": "#000000",
      "price": 2000
    },
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "price": 1800
    }
  ]
}
```

**Réponse:**

```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "data": {
    "id": 123,
    "name": "Autocollant Logo Entreprise",
    "price": 500,
    "suggestedPrice": 2000,
    "genre": "AUTOCOLLANT",
    "requiresStock": false,
    "stock": null,
    "colorVariations": [
      {
        "id": 456,
        "name": "Noir",
        "colorCode": "#000000",
        "price": 2000
      },
      {
        "id": 457,
        "name": "Blanc",
        "colorCode": "#FFFFFF",
        "price": 1800
      }
    ]
  }
}
```

### Créer un produit classique avec stock

```http
POST /products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "T-shirt Premium",
  "price": 5000,
  "suggestedPrice": 8000,
  "description": "T-shirt coton premium",
  "genre": "UNISEXE",
  "requiresStock": true,
  "stock": 100,
  "categoryId": 1,
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [
    {
      "name": "Noir",
      "colorCode": "#000000",
      "stock": {
        "S": 20,
        "M": 30,
        "L": 30,
        "XL": 20
      }
    }
  ]
}
```

### Filtrer les autocollants

```http
GET /products?genre=AUTOCOLLANT&requiresStock=false
```

**Réponse:**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "Autocollant Logo Entreprise",
      "genre": "AUTOCOLLANT",
      "requiresStock": false,
      "colorVariations": [...]
    }
  ]
}
```

---

## 8. Tests unitaires recommandés

**Fichier :** `src/products/products.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { ProductGenre } from './dto/create-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn()
            }
          }
        }
      ]
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('devrait créer un autocollant sans stock', async () => {
      const dto = {
        name: 'Test Autocollant',
        price: 500,
        suggestedPrice: 2000,
        description: 'Test',
        genre: ProductGenre.AUTOCOLLANT,
        requiresStock: false,
        colorVariations: [
          { name: 'Noir', colorCode: '#000000', price: 2000 }
        ]
      };

      jest.spyOn(prisma.product, 'create').mockResolvedValue({
        id: 1,
        ...dto,
        stock: null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const result = await service.create(dto, 1);

      expect(result.success).toBe(true);
      expect(result.data.requiresStock).toBe(false);
      expect(result.data.stock).toBeNull();
    });

    it('devrait rejeter un autocollant avec requiresStock=true', async () => {
      const dto = {
        name: 'Test Autocollant',
        price: 500,
        suggestedPrice: 2000,
        description: 'Test',
        genre: ProductGenre.AUTOCOLLANT,
        requiresStock: true, // ❌ Invalide
        colorVariations: []
      };

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('devrait rejeter un autocollant sans prix par variation', async () => {
      const dto = {
        name: 'Test Autocollant',
        price: 500,
        suggestedPrice: 2000,
        description: 'Test',
        genre: ProductGenre.AUTOCOLLANT,
        requiresStock: false,
        colorVariations: [
          { name: 'Noir', colorCode: '#000000' } // ❌ Pas de prix
        ]
      };

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('devrait créer un produit classique avec stock', async () => {
      const dto = {
        name: 'T-shirt',
        price: 5000,
        suggestedPrice: 8000,
        description: 'Test',
        genre: ProductGenre.UNISEXE,
        requiresStock: true,
        stock: 100
      };

      jest.spyOn(prisma.product, 'create').mockResolvedValue({
        id: 1,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const result = await service.create(dto, 1);

      expect(result.success).toBe(true);
      expect(result.data.requiresStock).toBe(true);
      expect(result.data.stock).toBe(100);
    });

    it('devrait rejeter un produit avec stock sans requiresStock', async () => {
      const dto = {
        name: 'T-shirt',
        price: 5000,
        suggestedPrice: 8000,
        description: 'Test',
        genre: ProductGenre.UNISEXE,
        requiresStock: true
        // ❌ Pas de stock fourni
      };

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
```

---

## 9. Documentation Swagger

Ajouter dans `main.ts` :

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('PrintAlma API')
  .setDescription('API pour la gestion des produits PrintAlma')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Products', 'Gestion des produits avec support des autocollants')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document);
```

Accès : `http://localhost:3004/api-docs`

---

## 10. Checklist d'implémentation

### ✅ Étapes à suivre

- [ ] **1. Mise à jour du schéma Prisma**
  - [ ] Ajouter `requiresStock` au modèle `Product`
  - [ ] Ajouter `price` au modèle `ColorVariation`
  - [ ] Ajouter `AUTOCOLLANT` à l'enum `genre`

- [ ] **2. Créer la migration**
  ```bash
  npx prisma migrate dev --name add_requires_stock_and_variation_price
  ```

- [ ] **3. Mettre à jour les DTOs**
  - [ ] Ajouter `requiresStock?: boolean` dans `CreateProductDto`
  - [ ] Ajouter `price?: number` dans `ColorVariationDto`
  - [ ] Mettre à jour `ProductGenre` enum

- [ ] **4. Implémenter la logique métier**
  - [ ] Validation : AUTOCOLLANT → requiresStock = false
  - [ ] Validation : Prix par variation obligatoire pour AUTOCOLLANT
  - [ ] Validation : Stock requis si requiresStock = true
  - [ ] Validation : suggestedPrice obligatoire

- [ ] **5. Mettre à jour le controller**
  - [ ] Ajouter filtres `genre` et `requiresStock` sur GET /products
  - [ ] Documenter avec Swagger

- [ ] **6. Tests**
  - [ ] Tests unitaires pour les validations
  - [ ] Tests d'intégration pour les endpoints
  - [ ] Tests E2E pour les workflows complets

- [ ] **7. Déploiement**
  - [ ] Appliquer la migration en production
  - [ ] Vérifier la compatibilité avec les données existantes
  - [ ] Tester les endpoints en staging

---

## 11. Compatibilité avec les données existantes

### Migration des données

```sql
-- Produits existants : par défaut requiresStock = true
UPDATE "products"
SET "requires_stock" = true
WHERE "requires_stock" IS NULL;

-- Si des autocollants existent déjà, les mettre à jour
UPDATE "products"
SET "requires_stock" = false,
    "stock" = NULL
WHERE "genre" = 'AUTOCOLLANT';
```

---

## 12. Logs et monitoring

Ajouter des logs dans le service :

```typescript
async create(createProductDto: CreateProductDto, userId: number) {
  const { genre, requiresStock } = createProductDto;

  console.log(`📦 [ProductsService] Création produit:`, {
    genre,
    requiresStock,
    userId
  });

  if (genre === ProductGenre.AUTOCOLLANT) {
    console.log(`🎨 [ProductsService] Autocollant détecté → Stock désactivé`);
  }

  // ... reste du code
}
```

---

## 13. Résumé des endpoints

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/products` | Créer un produit | Admin |
| `GET` | `/products` | Liste des produits | Public |
| `GET` | `/products?genre=AUTOCOLLANT` | Filtrer par genre | Public |
| `GET` | `/products?requiresStock=false` | Produits sans stock | Public |
| `GET` | `/products/:id` | Détails d'un produit | Public |
| `PUT` | `/products/:id` | Modifier un produit | Admin |
| `DELETE` | `/products/:id` | Supprimer un produit | Admin |

---

## 14. Intégration avec le système de stickers

Le système d'autocollants créé via `/admin/add-product` est compatible avec le système de génération de stickers côté vendeur (`/vendor/stickers`) :

1. **Admin crée un autocollant** → Genre = AUTOCOLLANT, requiresStock = false
2. **Vendeur sélectionne cet autocollant** → Peut créer des produits stickers personnalisés
3. **Backend génère l'image** → Sharp ajoute les bordures
4. **Upload sur Cloudinary** → Image finale stockée

---

## 15. Contact et support

Pour toute question sur cette adaptation :

- **Documentation frontend :** Voir les fichiers modifiés dans `/src/components/product-form/`
- **Documentation backend stickers :** Voir `CLAUDE.md` section "Implémentation du Système de Génération Optimale des Stickers"

---

**Fin de la documentation**

Date de dernière mise à jour : 24 janvier 2026
