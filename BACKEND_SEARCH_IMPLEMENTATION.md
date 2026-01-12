# Guide d'Implémentation de la Recherche Backend

## Problème Actuel

La barre de recherche frontend ne fonctionne pas car les endpoints de recherche backend n'existent pas ou ne retournent pas les données dans le bon format.

## Endpoints Requis

Le frontend attend ces endpoints :

### 1. Recherche de Produits Standards (Admin)
```
GET /api/products/search?q={query}&limit={limit}
```

### 2. Recherche de Produits Vendeurs (Stickers/Designs des Vendeurs)
```
GET /api/vendor-products/search?q={query}&limit={limit}
OU
GET /vendor/stickers/search?q={query}&limit={limit}
```

### 3. Recherche Globale Combinée (Optionnel)
```
GET /api/search/autocomplete?q={query}&limit={limit}
```

**IMPORTANT :** Les produits vendeurs incluent les stickers et autres produits créés par les vendeurs à partir de leurs designs.

---

## 1. Implémentation de la Recherche Produits

### Fichier: `src/products/products.controller.ts`

Ajouter cette route au contrôleur des produits :

```typescript
import { Controller, Get, Query } from '@nestjs/common';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Endpoint de recherche de produits
   * GET /api/products/search?q=tshirt&limit=6
   */
  @Get('search')
  async searchProducts(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const searchLimit = limit ? parseInt(limit, 10) : 10;

    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: {
          products: [],
          total: 0,
        },
      };
    }

    const products = await this.productsService.searchProducts(query, searchLimit);

    return {
      success: true,
      data: {
        products,
        total: products.length,
      },
    };
  }

  // ... autres routes existantes
}
```

### Fichier: `src/products/products.service.ts`

Ajouter cette méthode au service des produits :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Rechercher des produits par nom, description, catégorie
   */
  async searchProducts(query: string, limit: number = 10) {
    const searchTerm = query.toLowerCase().trim();

    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            category: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
          {
            subCategory: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        ],
        // Filtrer uniquement les produits publiés
        status: 'PUBLISHED',
      },
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        colorVariations: {
          take: 1, // Prendre seulement la première couleur pour l'aperçu
          include: {
            images: {
              take: 1, // Prendre seulement la première image
              select: {
                url: true,
                view: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formater les résultats pour le frontend
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      status: product.status,
      imageUrl: product.colorVariations?.[0]?.images?.[0]?.url || null,
      category: product.category?.name || null,
      subCategory: product.subCategory?.name || null,
      colorVariations: product.colorVariations,
    }));
  }

  // ... autres méthodes existantes
}
```

---

## 2. Implémentation de la Recherche Produits Vendeurs (Stickers)

### Fichier: `src/sticker/sticker.controller.ts` (Controller Public)

Créer ou modifier le contrôleur public des stickers :

```typescript
import { Controller, Get, Query } from '@nestjs/common';

@Controller('public/stickers')
export class PublicStickerController {
  constructor(private readonly stickerService: StickerService) {}

  /**
   * Endpoint de recherche de produits vendeurs (stickers)
   * GET /public/stickers/search?q=logo&limit=6
   */
  @Get('search')
  async searchStickers(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const searchLimit = limit ? parseInt(limit, 10) : 10;

    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: {
          products: [],
          total: 0,
        },
      };
    }

    const stickers = await this.stickerService.searchStickers(query, searchLimit);

    return {
      success: true,
      data: {
        products: stickers,
        total: stickers.length,
      },
    };
  }

  /**
   * Alternative : Recherche générale de produits vendeurs
   * GET /vendor/products/search?q=logo&limit=6
   */
  @Get('vendor/products/search')
  async searchVendorProducts(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const searchLimit = limit ? parseInt(limit, 10) : 10;

    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: {
          products: [],
          total: 0,
        },
      };
    }

    const products = await this.stickerService.searchVendorProducts(query, searchLimit);

    return {
      success: true,
      data: {
        products,
        total: products.length,
      },
    };
  }

  // ... autres routes existantes
}
```

### Fichier: `src/sticker/sticker.service.ts`

Ajouter ces méthodes au service des stickers :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StickerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Rechercher des stickers par nom, description, design
   */
  async searchStickers(query: string, limit: number = 10) {
    const searchTerm = query.toLowerCase().trim();

    const stickers = await this.prisma.stickerProduct.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            design: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
          {
            design: {
              tags: {
                hasSome: [searchTerm],
              },
            },
          },
        ],
        // Filtrer uniquement les stickers publiés
        status: 'PUBLISHED',
      },
      take: limit,
      include: {
        design: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            thumbnailUrl: true,
          },
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shopName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formater les résultats pour le frontend
    return stickers.map((sticker) => ({
      id: sticker.id,
      name: sticker.name,
      description: sticker.description,
      price: sticker.finalPrice,
      type: 'product' as const,
      imageUrl: sticker.imageUrl || sticker.design?.imageUrl || sticker.design?.thumbnailUrl,
      category: 'Stickers',
      subCategory: sticker.stickerType === 'autocollant' ? 'Autocollants' : 'Pare-chocs',
      vendorName: sticker.vendor?.shopName || `${sticker.vendor?.firstName} ${sticker.vendor?.lastName}`,
      size: sticker.stickerSize,
      finish: sticker.stickerSurface,
      stock: sticker.stockQuantity,
      url: `/sticker/${sticker.id}`,
    }));
  }

  /**
   * Rechercher tous types de produits vendeurs (stickers + autres)
   * À adapter selon votre modèle de données
   */
  async searchVendorProducts(query: string, limit: number = 10) {
    const searchTerm = query.toLowerCase().trim();

    // Rechercher dans les stickers
    const stickers = await this.searchStickers(query, limit);

    // Si vous avez d'autres types de produits vendeurs, les rechercher aussi
    // Par exemple : custom products, printed designs, etc.

    // Pour l'instant on retourne uniquement les stickers
    return stickers;
  }

  // ... autres méthodes existantes
}
```

---

## 3. Recherche Globale Combinée (Optionnel mais Recommandé)

### Fichier: `src/search/search.controller.ts`

Créer un nouveau module de recherche :

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Endpoint d'autocomplétion globale
   * GET /api/search/autocomplete?q=tsh&limit=10
   * Recherche dans produits standards + produits vendeurs (stickers)
   */
  @Get('autocomplete')
  async autocomplete(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const searchLimit = limit ? parseInt(limit, 10) : 10;

    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: {
          results: [],
          total: 0,
        },
      };
    }

    const results = await this.searchService.autocomplete(query, searchLimit);

    return {
      success: true,
      data: {
        results,
        total: results.length,
      },
    };
  }
}
```

### Fichier: `src/search/search.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { StickerService } from '../sticker/sticker.service';

interface SearchResult {
  id: number | string;
  name: string;
  type: 'product' | 'article';
  imageUrl?: string;
  price?: number;
  category?: string;
  subCategory?: string;
  url: string;
}

@Injectable()
export class SearchService {
  constructor(
    private productsService: ProductsService,
    private stickerService: StickerService,
  ) {}

  /**
   * Recherche combinée dans produits standards + produits vendeurs
   */
  async autocomplete(query: string, limit: number = 10): Promise<SearchResult[]> {
    // Rechercher en parallèle dans produits standards et stickers
    const [standardProducts, vendorProducts] = await Promise.all([
      this.productsService.searchProducts(query, Math.ceil(limit / 2)),
      this.stickerService.searchVendorProducts(query, Math.ceil(limit / 2)),
    ]);

    // Transformer les produits standards en SearchResult
    const standardResults: SearchResult[] = standardProducts.map((product) => ({
      id: product.id,
      name: product.name,
      type: 'product',
      imageUrl: product.imageUrl,
      price: product.price,
      category: product.category,
      subCategory: product.subCategory,
      url: `/product/${product.id}`,
    }));

    // Les produits vendeurs sont déjà au bon format
    const vendorResults: SearchResult[] = vendorProducts.map((product) => ({
      id: product.id,
      name: product.name,
      type: 'article', // ou 'product' selon votre logique frontend
      imageUrl: product.imageUrl,
      price: product.price,
      category: product.category,
      subCategory: product.subCategory,
      url: product.url,
    }));

    // Combiner et limiter les résultats
    // Priorité aux produits vendeurs (stickers) car plus pertinents
    const combined = [...vendorResults, ...standardResults];
    return combined.slice(0, limit);
  }
}
```

### Fichier: `src/search/search.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ProductsModule } from '../products/products.module';
import { StickerModule } from '../sticker/sticker.module';

@Module({
  imports: [ProductsModule, StickerModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
```

### Fichier: `src/app.module.ts`

Ajouter le SearchModule :

```typescript
import { Module } from '@nestjs/common';
import { SearchModule } from './search/search.module';
// ... autres imports

@Module({
  imports: [
    // ... autres modules
    SearchModule, // ✅ Ajouter ici
  ],
})
export class AppModule {}
```

---

## 4. Configuration Prisma (Si nécessaire)

Assurez-vous que votre schéma Prisma supporte la recherche insensible à la casse.

### Fichier: `prisma/schema.prisma`

Vérifiez que vous avez :

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"] // Optionnel pour PostgreSQL
}

datasource db {
  provider = "postgresql" // ou "mysql"
  url      = env("DATABASE_URL")
}

model Product {
  id              Int       @id @default(autoincrement())
  name            String    @db.VarChar(255)
  description     String?   @db.Text
  price           Decimal   @db.Decimal(10, 2)
  status          String    @default("DRAFT")
  categoryId      Int?      @map("category_id")
  subCategoryId   Int?      @map("sub_category_id")

  category        Category?     @relation(fields: [categoryId], references: [id])
  subCategory     SubCategory?  @relation(fields: [subCategoryId], references: [id])
  colorVariations ColorVariation[]

  @@map("products")
}

model Design {
  id               Int       @id @default(autoincrement())
  name             String    @db.VarChar(255)
  description      String?   @db.Text
  price            Decimal   @db.Decimal(10, 2)
  imageUrl         String?   @map("image_url")
  thumbnailUrl     String?   @map("thumbnail_url")
  tags             String[]  // Array de tags pour PostgreSQL
  validationStatus String    @default("PENDING") @map("validation_status")
  isPublished      Boolean   @default(false) @map("is_published")
  categoryId       Int?      @map("category_id")
  vendorId         Int       @map("vendor_id")

  category         Category? @relation(fields: [categoryId], references: [id])
  vendor           User      @relation(fields: [vendorId], references: [id])
  stickerProducts  StickerProduct[] // Relation avec les stickers

  @@map("designs")
}

model StickerProduct {
  id                 Int       @id @default(autoincrement())
  vendorId           Int       @map("vendor_id")
  designId           Int       @map("design_id")
  name               String    @db.VarChar(255)
  description        String?   @db.Text
  sku                String    @unique @db.VarChar(100)
  stickerType        String    @map("sticker_type") // 'autocollant' | 'pare-chocs'
  stickerSurface     String    @map("sticker_surface") // 'blanc-mat' | 'transparent'
  stickerBorderColor String?   @map("sticker_border_color")
  stickerSize        String    @map("sticker_size") // ex: "10x10"
  imageUrl           String?   @map("image_url") @db.VarChar(500)
  cloudinaryPublicId String?   @map("cloudinary_public_id") @db.VarChar(255)
  finalPrice         Decimal   @map("final_price") @db.Decimal(10, 2)
  stockQuantity      Int       @default(0) @map("stock_quantity")
  status             String    @default("PENDING") // PENDING | PUBLISHED | DRAFT
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  vendor             User      @relation(fields: [vendorId], references: [id])
  design             Design    @relation(fields: [designId], references: [id])

  @@map("sticker_products")
}
```

---

## 5. Tests des Endpoints

### Test avec cURL

#### Recherche Produits
```bash
curl -X GET "http://localhost:3004/api/products/search?q=tsh&limit=6" \
  -H "Content-Type: application/json"
```

Réponse attendue :
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "T-shirt Blanc",
        "description": "T-shirt confortable",
        "price": 5000,
        "imageUrl": "https://...",
        "category": "Vêtements",
        "subCategory": "T-shirts"
      }
    ],
    "total": 1
  }
}
```

#### Recherche Produits Vendeurs (Stickers)
```bash
curl -X GET "http://localhost:3004/public/stickers/search?q=logo&limit=6" \
  -H "Content-Type: application/json"
```

Réponse attendue :
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Sticker Logo Entreprise",
        "description": "Sticker haute qualité",
        "price": 2500,
        "type": "product",
        "imageUrl": "https://...",
        "category": "Stickers",
        "subCategory": "Autocollants",
        "vendorName": "Ma Boutique",
        "size": "10x10",
        "finish": "glossy",
        "stock": 50,
        "url": "/sticker/1"
      }
    ],
    "total": 1
  }
}
```

#### Recherche Globale
```bash
curl -X GET "http://localhost:3004/api/search/autocomplete?q=tsh&limit=10" \
  -H "Content-Type: application/json"
```

---

## 6. Optimisations de Performance

### Ajouter des Index sur les Colonnes de Recherche

```sql
-- Index pour recherche de produits standards
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_description ON products(description);

-- Index pour recherche de stickers (produits vendeurs)
CREATE INDEX idx_sticker_products_name ON sticker_products(name);
CREATE INDEX idx_sticker_products_description ON sticker_products(description);
CREATE INDEX idx_sticker_products_status ON sticker_products(status);

-- Index pour recherche de designs (utilisés dans les stickers)
CREATE INDEX idx_designs_name ON designs(name);
CREATE INDEX idx_designs_tags ON designs USING GIN (tags); -- Pour PostgreSQL

-- Index pour les catégories
CREATE INDEX idx_categories_name ON categories(name);
```

### Mise en Cache (Optionnel)

```typescript
import { Injectable, CacheInterceptor } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class SearchService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private productsService: ProductsService,
    private designsService: DesignsService,
  ) {}

  async autocomplete(query: string, limit: number = 10): Promise<SearchResult[]> {
    const cacheKey = `search:${query}:${limit}`;

    // Vérifier le cache
    const cached = await this.cacheManager.get<SearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Effectuer la recherche
    const [products, designs] = await Promise.all([
      this.productsService.searchProducts(query, Math.ceil(limit / 2)),
      this.designsService.searchDesigns(query, Math.ceil(limit / 2)),
    ]);

    // ... transformation des résultats

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, combined, 300);

    return combined;
  }
}
```

---

## 7. CORS (Important pour le Frontend)

Assurez-vous que votre backend autorise les requêtes depuis le frontend.

### Fichier: `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer CORS
  app.enableCors({
    origin: [
      'http://localhost:5174', // Frontend dev
      'https://printalma.com', // Production
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3004);
}
bootstrap();
```

---

## 8. Variables d'Environnement

### Fichier: `.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/printalma"
PORT=3004
NODE_ENV=development
```

---

## Résumé de l'Implémentation

### ✅ Ce qui doit être fait :

1. **Créer les routes de recherche** dans `ProductsController` et `StickerController`
2. **Créer les méthodes de recherche** dans `ProductsService` et `StickerService`
3. **Optionnel : Créer un module Search** pour la recherche combinée
4. **Ajouter les index en base de données** pour optimiser les performances
5. **Configurer CORS** pour autoriser les requêtes frontend
6. **Tester les endpoints** avec cURL ou Postman

### 📋 Ordre d'Implémentation Recommandé :

1. ✅ Étape 1 : Recherche Produits Standards (endpoints + service)
2. ✅ Étape 2 : **Recherche Produits Vendeurs/Stickers (PRIORITAIRE)** (endpoints + service)
3. ✅ Étape 3 : Tester les deux endpoints séparément
4. ⚙️ Étape 4 : (Optionnel) Créer le module Search combiné
5. 🚀 Étape 5 : Optimisations (index, cache)

**Note importante :** L'étape 2 (Recherche Stickers) est **PRIORITAIRE** car la recherche doit principalement afficher les produits vendeurs (stickers créés à partir de designs).

### 🧪 Comment Tester :

1. Démarrer le backend : `npm run start:dev`
2. Tester avec cURL ou Postman
3. Ouvrir le frontend et taper dans la barre de recherche
4. Vérifier la console du navigateur pour voir les logs détaillés

---

## Dépannage

### Problème : "Cannot find module"
**Solution :** Vérifiez que tous les modules sont bien importés dans `app.module.ts`

### Problème : "CORS error"
**Solution :** Vérifiez la configuration CORS dans `main.ts`

### Problème : "No results returned"
**Solution :**
1. Vérifiez que vous avez des données en BDD
2. Vérifiez les filtres (status: 'PUBLISHED', validationStatus: 'VALIDATED')
3. Testez avec une recherche simple sans filtres

### Problème : "Search too slow"
**Solution :** Ajoutez les index en base de données (voir section 6)

---

## Contact

Si vous avez des questions ou besoin d'aide pour l'implémentation, vérifiez :
1. Les logs du backend
2. La console du navigateur (frontend)
3. Les requêtes réseau dans l'onglet Network du navigateur

---

**Date de création :** 12 janvier 2026
**Version :** 1.0.0
**Auteur :** Claude Sonnet 4.5
