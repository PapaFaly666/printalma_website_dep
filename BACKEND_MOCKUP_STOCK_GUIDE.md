# Guide Backend - Gestion des Stocks lors de la Création de Mockup

## Vue d'ensemble

Lors de la création d'un produit mockup via le frontend, le backend doit gérer les stocks pour chaque variation de couleur. Ce guide explique le format attendu et l'implémentation requise.

## Format de la Requête Frontend

### Endpoint: `POST /products`

Le frontend envoie un `FormData` avec :
- `productData` : JSON contenant les informations du produit
- `files[]` : Images des variations de couleur

### Structure du productData

```json
{
  "name": "T-shirt personnalisé",
  "description": "T-shirt avec impression personnalisée",
  "price": 25.99,
  "suggestedPrice": 29.99,
  "stock": 0,
  "status": "draft",
  "categories": ["Vêtements > Tshirt"],
  "sizes": ["M", "L", "XL"],
  "genre": "UNISEXE",
  "isReadyProduct": false,
  "colorVariations": [
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "stocks": [
        { "sizeName": "M", "stock": 10 },
        { "sizeName": "L", "stock": 20 },
        { "sizeName": "XL", "stock": 15 }
      ],
      "images": [
        {
          "fileId": "1234567890",
          "view": "Front",
          "delimitations": [
            {
              "x": 100,
              "y": 150,
              "width": 200,
              "height": 250,
              "rotation": 0,
              "name": "Zone avant"
            }
          ]
        }
      ]
    },
    {
      "name": "Noir",
      "colorCode": "#000000",
      "stocks": [
        { "sizeName": "M", "stock": 8 },
        { "sizeName": "L", "stock": 25 },
        { "sizeName": "XL", "stock": 12 }
      ],
      "images": [
        {
          "fileId": "1234567891",
          "view": "Front",
          "delimitations": [...]
        }
      ]
    }
  ]
}
```

## ⚠️ Point Clé : Format des Stocks

Le frontend envoie les stocks dans **chaque `colorVariation`** sous forme d'**array d'objets** :

```typescript
stocks: [
  { sizeName: "M", stock: 10 },
  { sizeName: "L", "stock": 20 },
  { sizeName: "XL", stock: 15 }
]
```

**NON PAS** sous forme d'objet :
```typescript
// ❌ Ne pas accepter ce format
stock: { "M": 10, "L": 20, "XL": 15 }
```

## Implémentation Backend (NestJS + Prisma)

### 1. DTO de Validation

```typescript
// src/products/dto/create-product.dto.ts

import { IsArray, IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class StockItemDto {
  @IsString()
  sizeName: string;

  @IsNumber()
  stock: number;
}

class DelimitationDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsNumber()
  @IsOptional()
  rotation?: number;

  @IsString()
  @IsOptional()
  name?: string;
}

class ColorImageDto {
  @IsString()
  fileId: string;

  @IsString()
  view: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DelimitationDto)
  @IsOptional()
  delimitations?: DelimitationDto[];
}

class ColorVariationDto {
  @IsString()
  name: string;

  @IsString()
  colorCode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  @IsOptional()
  stocks?: StockItemDto[]; // ✅ Array d'objets

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorImageDto)
  images: ColorImageDto[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  suggestedPrice?: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  categories: string[];

  @IsArray()
  @IsOptional()
  sizes?: string[];

  @IsString()
  @IsOptional()
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';

  @IsBoolean()
  @IsOptional()
  isReadyProduct?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorVariationDto)
  @IsOptional()
  colorVariations?: ColorVariationDto[];
}
```

### 2. Service - Méthode createProduct

```typescript
// src/products/products.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[]
  ) {
    const {
      name,
      description,
      price,
      suggestedPrice,
      status,
      categories,
      sizes,
      genre,
      isReadyProduct,
      colorVariations
    } = createProductDto;

    // 1. Créer le produit principal
    const product = await this.prisma.product.create({
      data: {
        name,
        description,
        price,
        suggestedPrice,
        status: status || 'draft',
        categories,
        sizes, // Array de strings: ["M", "L", "XL"]
        genre: genre || 'UNISEXE',
        isReadyProduct: isReadyProduct || false,
        // Ne pas mettre stock global ici car il sera calculé automatiquement
      }
    });

    // 2. Créer les variations de couleur avec leurs stocks
    if (colorVariations && colorVariations.length > 0) {
      for (const colorVariation of colorVariations) {
        // 2.1 Créer la variation de couleur
        const color = await this.prisma.colorVariation.create({
          data: {
            productId: product.id,
            name: colorVariation.name,
            colorCode: colorVariation.colorCode
          }
        });

        // 2.2 Créer les images pour cette couleur
        if (colorVariation.images && colorVariation.images.length > 0) {
          for (const imageDto of colorVariation.images) {
            // Trouver le fichier correspondant au fileId
            const file = files.find(f => f.originalname.includes(imageDto.fileId));

            if (file) {
              // Uploader le fichier et obtenir l'URL
              const imageUrl = await this.uploadFile(file);

              // Créer l'image en base
              const image = await this.prisma.colorImage.create({
                data: {
                  colorVariationId: color.id,
                  url: imageUrl,
                  view: imageDto.view
                }
              });

              // Créer les délimitations si présentes
              if (imageDto.delimitations && imageDto.delimitations.length > 0) {
                for (const delim of imageDto.delimitations) {
                  await this.prisma.delimitation.create({
                    data: {
                      imageId: image.id,
                      x: delim.x,
                      y: delim.y,
                      width: delim.width,
                      height: delim.height,
                      rotation: delim.rotation || 0,
                      name: delim.name
                    }
                  });
                }
              }
            }
          }
        }

        // 2.3 ✅ IMPORTANT : Créer les stocks pour cette couleur
        if (colorVariation.stocks && colorVariation.stocks.length > 0) {
          for (const stockItem of colorVariation.stocks) {
            await this.prisma.productStock.upsert({
              where: {
                productId_colorId_sizeName: {
                  productId: product.id,
                  colorId: color.id,
                  sizeName: stockItem.sizeName
                }
              },
              update: {
                stock: stockItem.stock
              },
              create: {
                productId: product.id,
                colorId: color.id,
                sizeName: stockItem.sizeName,
                stock: stockItem.stock
              }
            });
          }

          console.log(`✅ Stock créé pour ${colorVariation.name}:`, colorVariation.stocks);
        }
      }
    }

    // 3. Recharger le produit avec toutes ses relations
    return this.prisma.product.findUnique({
      where: { id: product.id },
      include: {
        colorVariations: {
          include: {
            images: {
              include: {
                delimitations: true
              }
            }
          }
        },
        stocks: true
      }
    });
  }

  // Méthode utilitaire pour uploader un fichier
  private async uploadFile(file: Express.Multer.File): Promise<string> {
    // Implémenter l'upload vers votre storage (S3, Cloudinary, local, etc.)
    // Retourner l'URL publique du fichier
    return 'https://example.com/uploads/' + file.filename;
  }
}
```

### 3. Controller

```typescript
// src/products/products.controller.ts

import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async createProduct(
    @Body('productData') productDataJson: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      // Parser le JSON
      const productData: CreateProductDto = JSON.parse(productDataJson);

      console.log('📥 Création de produit:', {
        name: productData.name,
        colorVariations: productData.colorVariations?.length,
        filesCount: files?.length
      });

      // Log des stocks reçus
      productData.colorVariations?.forEach((color, index) => {
        console.log(`📦 Stocks pour ${color.name}:`, color.stocks);
      });

      // Créer le produit
      const product = await this.productsService.createProduct(
        productData,
        files || []
      );

      return {
        success: true,
        message: 'Produit créé avec succès',
        data: product
      };
    } catch (error) {
      console.error('❌ Erreur création produit:', error);
      throw new BadRequestException(error.message);
    }
  }
}
```

### 4. Modèle Prisma

Assurez-vous d'avoir ces modèles dans votre `schema.prisma` :

```prisma
model Product {
  id                Int                @id @default(autoincrement())
  name              String
  description       String?
  price             Float?
  suggestedPrice    Float?
  status            String             @default("draft")
  categories        String[]           // Array de strings
  sizes             String[]           // Array de strings: ["M", "L", "XL"]
  genre             String?            // HOMME, FEMME, BEBE, UNISEXE
  isReadyProduct    Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  colorVariations   ColorVariation[]
  stocks            ProductStock[]

  @@index([status])
}

model ColorVariation {
  id          Int           @id @default(autoincrement())
  productId   Int
  name        String
  colorCode   String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  product     Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  images      ColorImage[]

  @@index([productId])
}

model ColorImage {
  id                Int      @id @default(autoincrement())
  colorVariationId  Int
  url               String
  view              String   // Front, Back, Left, Right
  createdAt         DateTime @default(now())

  colorVariation    ColorVariation @relation(fields: [colorVariationId], references: [id], onDelete: Cascade)
  delimitations     Delimitation[]

  @@index([colorVariationId])
}

model Delimitation {
  id        Int      @id @default(autoincrement())
  imageId   Int
  name      String?
  x         Float
  y         Float
  width     Float
  height    Float
  rotation  Float    @default(0)
  createdAt DateTime @default(now())

  image     ColorImage @relation(fields: [imageId], references: [id], onDelete: Cascade)

  @@index([imageId])
}

model ProductStock {
  id          Int      @id @default(autoincrement())
  productId   Int
  colorId     Int      // ID de la ColorVariation
  sizeName    String   // "M", "L", "XL", etc.
  stock       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, colorId, sizeName])
  @@index([productId])
  @@index([colorId])
}
```

## Endpoint pour Récupérer les Stocks

### GET `/products/:id/stocks`

Retourne les stocks d'un produit spécifique :

```typescript
async getProductStocks(productId: number) {
  const stocks = await this.prisma.productStock.findMany({
    where: { productId },
    include: {
      product: {
        include: {
          colorVariations: true
        }
      }
    }
  });

  return {
    success: true,
    data: stocks.map(stock => ({
      id: stock.id,
      colorId: stock.colorId,
      sizeName: stock.sizeName,
      stock: stock.stock,
      colorName: stock.product.colorVariations.find(c => c.id === stock.colorId)?.name
    }))
  };
}
```

### POST `/products/:id/stocks`

Mise à jour bulk des stocks :

```typescript
async updateProductStocks(
  productId: number,
  stocks: { colorId: number; sizeName: string; stock: number }[]
) {
  // Utiliser une transaction pour garantir la cohérence
  await this.prisma.$transaction(
    stocks.map(item =>
      this.prisma.productStock.upsert({
        where: {
          productId_colorId_sizeName: {
            productId,
            colorId: item.colorId,
            sizeName: item.sizeName
          }
        },
        update: {
          stock: item.stock
        },
        create: {
          productId,
          colorId: item.colorId,
          sizeName: item.sizeName,
          stock: item.stock
        }
      })
    )
  );

  return {
    success: true,
    message: 'Stocks mis à jour avec succès'
  };
}
```

## Récupérer les Produits avec Stocks (pour /admin/stock)

### GET `/products`

Le endpoint doit retourner les produits avec leurs stocks formatés :

```typescript
async getProducts() {
  const products = await this.prisma.product.findMany({
    include: {
      colorVariations: {
        include: {
          images: true
        }
      },
      stocks: true
    }
  });

  return {
    success: true,
    data: products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      suggestedPrice: product.suggestedPrice,
      status: product.status,
      categories: product.categories,
      sizes: product.sizes, // ✅ Array de strings
      genre: product.genre,
      isReadyProduct: product.isReadyProduct,

      // ✅ Formater les variations avec leurs stocks
      colorVariations: product.colorVariations.map(color => ({
        id: color.id,
        name: color.name,
        colorCode: color.colorCode,
        images: color.images.map(img => ({
          id: img.id,
          url: img.url,
          view: img.view
        })),

        // ✅ IMPORTANT: Retourner stocks comme array d'objets
        stocks: product.stocks
          .filter(s => s.colorId === color.id)
          .map(s => ({
            id: s.id,
            sizeName: s.sizeName,
            stock: s.stock
          }))
      }))
    }))
  };
}
```

## Exemple de Flux Complet

### 1. Frontend envoie la requête

```typescript
// Frontend: useProductForm.ts
const formData = new FormData();
formData.append('productData', JSON.stringify({
  name: "T-shirt personnalisé",
  colorVariations: [
    {
      name: "Blanc",
      colorCode: "#FFFFFF",
      stocks: [
        { sizeName: "M", stock: 10 },
        { sizeName: "L", stock: 20 }
      ],
      images: [...]
    }
  ]
}));
formData.append('files', file1);

await axios.post('/products', formData);
```

### 2. Backend crée le produit et les stocks

```typescript
// Backend: products.service.ts
const product = await createProduct(...);
// Crée automatiquement les entrées dans ProductStock
```

### 3. Frontend récupère les produits avec stocks

```typescript
// Frontend: AdminStockManagement.tsx
const response = await axios.get('/products');
// Affiche les stocks dans l'interface
```

## Points Clés à Retenir

1. ✅ **Format stocks** : Toujours un **array d'objets** `[{ sizeName, stock }]`
2. ✅ **Stockage** : Table `ProductStock` avec clé unique `(productId, colorId, sizeName)`
3. ✅ **Upsert** : Utiliser `upsert` pour éviter les doublons
4. ✅ **Transaction** : Utiliser des transactions pour les mises à jour bulk
5. ✅ **Cascade** : Relations en cascade pour la suppression
6. ✅ **Index** : Index sur `productId` et `colorId` pour les performances

## Testing

### Test de création avec stocks

```bash
curl -X POST http://localhost:3004/products \
  -F 'productData={"name":"Test","colorVariations":[{"name":"Blanc","colorCode":"#FFF","stocks":[{"sizeName":"M","stock":10}],"images":[{"fileId":"1","view":"Front"}]}]}' \
  -F 'files=@image.jpg'
```

### Test de récupération

```bash
curl http://localhost:3004/products
```

Cela devrait retourner le produit avec ses stocks dans le bon format.
