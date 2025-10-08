# 🎯 Guide Backend - Système Sophistiqué de Gestion des Catégories

## 📋 Vue d'ensemble

Ce guide documente l'implémentation backend du système sophistiqué de gestion des catégories avec :
- ✅ **Synchronisation automatique** des produits lors de la modification d'une catégorie
- 🚫 **Contraintes de suppression** empêchant la suppression de catégories liées à des produits
- 🔄 **Déplacement de produits** entre catégories

---

## 🗄️ Structure Prisma (Many-to-Many)

### Schema Prisma recommandé

```prisma
model Category {
  id          Int        @id @default(autoincrement())
  name        String
  description String?
  parentId    Int?
  level       Int        @default(0)  // 0 = parent, 1 = enfant, 2 = variation
  order       Int        @default(0)

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations hiérarchiques
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[] @relation("CategoryHierarchy")

  // ✅ Relation Many-to-Many avec Product
  products    Product[]  @relation("CategoryToProduct")

  @@unique([name, parentId], name: "unique_category_per_parent")
  @@index([parentId])
  @@index([level])
  @@map("categories")
}

model Product {
  id              Int              @id @default(autoincrement())
  name            String
  description     String?
  price           Float
  stock           Int              @default(0)
  status          ProductStatus    @default(DRAFT)

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // ✅ Relation Many-to-Many avec Category
  categories      Category[]       @relation("CategoryToProduct")

  // Autres relations
  colorVariations ColorVariation[]
  sizes           Size[]

  @@map("products")
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

**💡 Point Clé** : La relation `@relation("CategoryToProduct")` crée automatiquement une table de jointure `_CategoryToProduct` qui gère la synchronisation.

---

## 🚀 Endpoints Backend à Implémenter

### 1. Mettre à Jour une Catégorie (avec Synchronisation)

**Endpoint** : `PATCH /categories/:id`

**Description** : Met à jour une catégorie et synchronise automatiquement tous les produits liés via la relation Prisma.

#### Code Controller (`category.controller.ts`)

```typescript
import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoryService.update(+id, updateCategoryDto);
  }
}
```

#### Code Service (`category.service.ts`)

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    // 1. Vérifier que la catégorie existe
    const category = await this.findOne(id);

    // 2. Vérifier les doublons si le nom change
    if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          name: updateCategoryDto.name.trim(),
          parentId: category.parentId || null,
          id: { not: id }
        }
      });

      if (existingCategory) {
        throw new ConflictException({
          success: false,
          error: 'DUPLICATE_CATEGORY',
          message: `Une catégorie avec le nom "${updateCategoryDto.name}" existe déjà au même niveau`
        });
      }
    }

    // 3. Mettre à jour la catégorie
    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name?.trim(),
        description: updateCategoryDto.description?.trim()
      },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } }
      }
    });

    // 4. 🔄 Log de synchronisation (Prisma gère automatiquement)
    const productCount = updatedCategory._count.products;

    if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
      console.log(
        `🔄 Synchronisation: ${productCount} produit(s) lié(s) à la catégorie "${category.name}" → "${updatedCategory.name}"`
      );
    }

    // 5. Retourner la réponse avec le nombre de produits synchronisés
    return {
      success: true,
      message: productCount > 0
        ? `Catégorie mise à jour avec succès (${productCount} produit(s) synchronisé(s))`
        : 'Catégorie mise à jour avec succès',
      data: {
        ...updatedCategory,
        productCount
      }
    };
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } }
      }
    });

    if (!category) {
      throw new NotFoundException(`Catégorie avec ID ${id} non trouvée`);
    }

    return category;
  }
}
```

#### DTO (`update-category.dto.ts`)

```typescript
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;
}
```

---

### 2. Supprimer une Catégorie (avec Contraintes)

**Endpoint** : `DELETE /categories/:id`

**Description** : Supprime une catégorie uniquement si aucun produit n'y est lié (incluant ses sous-catégories).

#### Code Controller

```typescript
@Delete(':id')
@UseGuards(AdminGuard)
async remove(@Param('id') id: string) {
  return this.categoryService.remove(+id);
}
```

#### Code Service

```typescript
async remove(id: number) {
  // 1. Vérifier que la catégorie existe
  const category = await this.findOne(id);

  // 2. Récupérer tous les IDs des enfants (récursif)
  const childrenIds = await this.getAllChildrenIds(id);
  const allIds = [id, ...childrenIds];

  // 3. 🚫 Vérifier si des produits sont liés (catégorie + enfants)
  const productsCount = await this.prisma.product.count({
    where: {
      categories: {
        some: { id: { in: allIds } }
      }
    }
  });

  if (productsCount > 0) {
    throw new BadRequestException(
      `Impossible de supprimer la catégorie car elle (ou ses sous-catégories) est liée à ${productsCount} produit(s). ` +
      `Veuillez d'abord supprimer ou déplacer ces produits vers une autre catégorie.`
    );
  }

  // 4. Supprimer la catégorie (cascade automatique pour les enfants)
  await this.prisma.category.delete({
    where: { id },
  });

  console.log(`🗑️ Suppression: Catégorie "${category.name}" et ${childrenIds.length} sous-catégories`);

  return {
    success: true,
    message: 'Catégorie supprimée avec succès',
    deletedCount: allIds.length
  };
}

/**
 * Récupère récursivement tous les IDs des enfants d'une catégorie
 */
private async getAllChildrenIds(parentId: number): Promise<number[]> {
  const children = await this.prisma.category.findMany({
    where: { parentId },
    select: { id: true }
  });

  let allIds: number[] = [];

  for (const child of children) {
    allIds.push(child.id);
    const subChildren = await this.getAllChildrenIds(child.id);
    allIds = [...allIds, ...subChildren];
  }

  return allIds;
}
```

---

### 3. Déplacer un Produit vers d'Autres Catégories

**Endpoint** : `PATCH /products/:productId/categories`

**Description** : Déplace un produit vers une ou plusieurs nouvelles catégories.

#### Code Controller (`product.controller.ts`)

```typescript
import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { UpdateProductCategoriesDto } from './dto/update-product-categories.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Patch(':productId/categories')
  @UseGuards(AdminGuard)
  async updateCategories(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductCategoriesDto
  ) {
    return this.productService.updateProductCategories(+productId, dto.categoryIds);
  }
}
```

#### Code Service (`product.service.ts`)

```typescript
async updateProductCategories(productId: number, categoryIds: number[]) {
  // 1. Vérifier que le produit existe
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    include: { categories: true }
  });

  if (!product) {
    throw new NotFoundException(`Produit avec ID ${productId} non trouvé`);
  }

  // 2. Vérifier que toutes les catégories existent
  const categories = await this.prisma.category.findMany({
    where: { id: { in: categoryIds } }
  });

  if (categories.length !== categoryIds.length) {
    throw new BadRequestException('Une ou plusieurs catégories sont invalides');
  }

  // 3. Mettre à jour les catégories du produit (remplace toutes les anciennes)
  const updatedProduct = await this.prisma.product.update({
    where: { id: productId },
    data: {
      categories: {
        set: categoryIds.map(id => ({ id })) // 🔄 "set" remplace toutes les catégories
      }
    },
    include: {
      categories: true
    }
  });

  console.log(
    `🔄 Déplacement: Produit "${product.name}" ` +
    `de [${product.categories.map(c => c.name).join(', ')}] ` +
    `vers [${updatedProduct.categories.map(c => c.name).join(', ')}]`
  );

  return {
    success: true,
    message: 'Catégories du produit mises à jour avec succès',
    data: updatedProduct
  };
}
```

#### DTO (`update-product-categories.dto.ts`)

```typescript
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class UpdateProductCategoriesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une catégorie doit être sélectionnée' })
  @IsInt({ each: true, message: 'Chaque ID de catégorie doit être un entier' })
  categoryIds: number[];
}
```

---

### 4. Compter les Produits Liés à une Catégorie

**Endpoint** : `GET /categories/:id/product-count`

**Description** : Retourne le nombre total de produits liés à une catégorie (incluant ses sous-catégories).

#### Code Controller

```typescript
@Get(':id/product-count')
async getProductCount(@Param('id') id: string) {
  return this.categoryService.getProductCount(+id);
}
```

#### Code Service

```typescript
async getProductCount(id: number) {
  // 1. Vérifier que la catégorie existe
  await this.findOne(id);

  // 2. Récupérer tous les IDs (catégorie + enfants)
  const childrenIds = await this.getAllChildrenIds(id);
  const allIds = [id, ...childrenIds];

  // 3. Compter les produits liés
  const count = await this.prisma.product.count({
    where: {
      categories: {
        some: { id: { in: allIds } }
      }
    }
  });

  return {
    success: true,
    count,
    categoryId: id,
    includesChildren: childrenIds.length > 0
  };
}
```

---

## 🧪 Tests Backend (Exemple avec Jest)

### Test de Synchronisation

```typescript
describe('CategoryService - Update with Sync', () => {
  it('should update category and sync linked products', async () => {
    // 1. Créer une catégorie
    const category = await categoryService.create({
      name: 'T-Shirts',
      description: 'Tous les T-Shirts'
    });

    // 2. Créer 3 produits liés
    for (let i = 1; i <= 3; i++) {
      await productService.create({
        name: `Produit ${i}`,
        price: 29.99,
        categories: [category.id]
      });
    }

    // 3. Modifier le nom de la catégorie
    const result = await categoryService.update(category.id, {
      name: 'T-Shirts Premium'
    });

    // 4. Vérifier la synchronisation
    expect(result.success).toBe(true);
    expect(result.message).toContain('3 produit(s) synchronisé(s)');
    expect(result.data.productCount).toBe(3);

    // 5. Vérifier que les produits affichent le nouveau nom
    const products = await productService.findAll({
      where: { categories: { some: { id: category.id } } },
      include: { categories: true }
    });

    products.forEach(product => {
      expect(product.categories[0].name).toBe('T-Shirts Premium');
    });
  });
});
```

### Test de Contrainte de Suppression

```typescript
describe('CategoryService - Delete with Constraint', () => {
  it('should block deletion if products are linked', async () => {
    // 1. Créer catégorie + produit
    const category = await categoryService.create({ name: 'Vêtements' });
    await productService.create({
      name: 'T-Shirt',
      price: 19.99,
      categories: [category.id]
    });

    // 2. Tenter de supprimer
    await expect(
      categoryService.remove(category.id)
    ).rejects.toThrow(
      'Impossible de supprimer la catégorie car elle est liée à 1 produit(s)'
    );
  });

  it('should allow deletion if no products are linked', async () => {
    // 1. Créer catégorie sans produits
    const category = await categoryService.create({ name: 'Vêtements' });

    // 2. Supprimer
    const result = await categoryService.remove(category.id);

    // 3. Vérifier
    expect(result.success).toBe(true);
    expect(result.message).toBe('Catégorie supprimée avec succès');
  });
});
```

### Test de Déplacement de Produits

```typescript
describe('ProductService - Move Categories', () => {
  it('should move product to another category', async () => {
    // 1. Créer 2 catégories
    const cat1 = await categoryService.create({ name: 'T-Shirts' });
    const cat2 = await categoryService.create({ name: 'Polos' });

    // 2. Créer produit lié à cat1
    const product = await productService.create({
      name: 'T-Shirt Classique',
      price: 24.99,
      categories: [cat1.id]
    });

    // 3. Déplacer vers cat2
    const result = await productService.updateProductCategories(
      product.id,
      [cat2.id]
    );

    // 4. Vérifier
    expect(result.success).toBe(true);
    expect(result.data.categories[0].id).toBe(cat2.id);
    expect(result.data.categories[0].name).toBe('Polos');
  });
});
```

---

## 📊 Diagramme de Flux Backend

```
┌─────────────────────────────────────────────────────────────┐
│              PATCH /categories/:id                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ 1. Vérifier existence    │
                 │    findOne(id)           │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ 2. Vérifier doublon nom  │
                 │    (si nom change)       │
                 └─────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 [Doublon]           [Pas de doublon]
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ ConflictException│  │ 3. Prisma.update │
         │ 409 Conflict     │  │    category      │
         └──────────────────┘  └──────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ 4. Include _count      │
                           │    products            │
                           └────────────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ 5. 🔄 Prisma sync auto │
                           │    (via _CategoryToProduct) │
                           └────────────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ 6. Log synchronisation │
                           │    console.log(count)  │
                           └────────────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ 7. Return 200 OK       │
                           │    + productCount      │
                           └────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              DELETE /categories/:id                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ 1. Vérifier existence    │
                 │    findOne(id)           │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ 2. getAllChildrenIds()   │
                 │    (récursif)            │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ 3. Compter produits liés │
                 │    allIds = [id, ...children] │
                 └─────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              [Produits liés]     [Aucun produit]
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ BadRequestException│  │ 4. Prisma.delete │
         │ 400 Bad Request  │  │    (cascade auto) │
         └──────────────────┘  └──────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ 5. Log suppression     │
                           │    console.log(deleted)│
                           └────────────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ 6. Return 200 OK       │
                           │    + deletedCount      │
                           └────────────────────────┘
```

---

## 🎯 Points Clés à Implémenter

### ✅ Synchronisation Automatique
1. **Prisma gère automatiquement** la relation via `_CategoryToProduct`
2. Utiliser `include: { _count: { select: { products: true } } }` pour compter
3. Logger les synchronisations pour transparence

### 🚫 Contraintes de Suppression
1. **Vérifier récursivement** tous les enfants avec `getAllChildrenIds()`
2. Compter les produits liés avec `where: { categories: { some: { id: { in: allIds } } } }`
3. Lancer `BadRequestException` avec message clair

### 🔄 Déplacement de Produits
1. Utiliser `categories: { set: [...] }` pour remplacer toutes les catégories
2. Valider l'existence de toutes les catégories avant
3. Logger le déplacement pour audit

---

## 📝 Checklist d'Implémentation

- [ ] Mettre à jour le schema Prisma avec relation `@relation("CategoryToProduct")`
- [ ] Exécuter `npx prisma migrate dev --name add-category-product-relation`
- [ ] Implémenter `PATCH /categories/:id` avec sync
- [ ] Implémenter `DELETE /categories/:id` avec contraintes
- [ ] Implémenter `PATCH /products/:id/categories` pour déplacement
- [ ] Implémenter `GET /categories/:id/product-count`
- [ ] Ajouter méthode privée `getAllChildrenIds()` récursive
- [ ] Écrire tests unitaires pour les 3 scénarios
- [ ] Ajouter logs de debug avec console.log()
- [ ] Documenter les endpoints dans Swagger/OpenAPI

---

## 🚀 Conclusion

Ce système backend assure :
- ✅ **Intégrité des données** : Synchronisation automatique via Prisma
- 🚫 **Sécurité** : Impossible de casser les relations produit-catégorie
- 📊 **Transparence** : Messages clairs sur les opérations effectuées
- 🧪 **Testabilité** : Tous les cas sont couverts par des tests

La relation many-to-many gère automatiquement la synchronisation, il suffit d'ajouter les contraintes de validation ! 🎉
