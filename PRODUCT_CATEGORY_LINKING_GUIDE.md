# Guide - Liaison Catégories ↔ Produits (Sans Création)

## 🎯 Objectif

Permettre de **lier des catégories existantes** aux produits lors de leur création/modification, **sans jamais créer de nouvelles catégories** depuis le formulaire de produit.

---

## 📋 Principes Fondamentaux

### Règles de Gestion

1. ✅ **Sélection uniquement** : Le formulaire de produit affiche uniquement les catégories existantes
2. ❌ **Pas de création** : Impossible de créer une nouvelle catégorie depuis ProductFormMain
3. 🔗 **Liaison par ID** : Les produits stockent l'ID de la catégorie (clé étrangère)
4. 📝 **Nom en cache** : Le nom de la catégorie est aussi stocké pour affichage rapide
5. 🔄 **Synchronisation** : Si une catégorie est renommée, tous les produits liés sont mis à jour

---

## Architecture Backend (NestJS + Prisma)

### 1. Modèle Prisma

```prisma
model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  level       Int       @default(0) // 0 = Parent, 1 = Enfant, 2 = Variation
  parentId    Int?
  icon        String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Restrict)
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]  @relation("ProductCategory")

  @@index([parentId])
  @@index([level])
  @@index([name])
}

model Product {
  id                Int                @id @default(autoincrement())
  name              String
  description       String?
  price             Float?
  suggestedPrice    Float?
  status            String             @default("draft")

  // 🔗 IMPORTANT: Relations avec catégories
  categoryId        Int?               // ID de la catégorie principale
  categoryName      String?            // Nom en cache pour affichage rapide
  categories        String[]           // Array de noms (legacy/fallback)

  sizes             String[]
  genre             String?
  isReadyProduct    Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  // Relations
  category          Category?          @relation("ProductCategory", fields: [categoryId], references: [id], onDelete: SetNull)
  colorVariations   ColorVariation[]
  stocks            ProductStock[]

  @@index([categoryId])
  @@index([status])
  @@index([categoryName])
}
```

**Points clés** :
- `categoryId` : Relation forte avec la catégorie (clé étrangère)
- `categoryName` : Cache du nom pour performance (denormalization)
- `categories` : Array legacy pour compatibilité ascendante
- `onDelete: SetNull` : Si catégorie supprimée, le produit n'est pas supprimé mais perd sa catégorie

---

### 2. DTO Backend

```typescript
// src/products/dto/create-product.dto.ts
import { IsString, IsOptional, IsInt, IsArray, IsNumber, IsBoolean } from 'class-validator';

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

  @IsString()
  @IsOptional()
  status?: string;

  // 🔗 IMPORTANT: Lien vers la catégorie
  @IsInt()
  @IsOptional()
  categoryId?: number; // ID de la catégorie principale à lier

  @IsArray()
  @IsOptional()
  sizes?: string[];

  @IsString()
  @IsOptional()
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';

  @IsBoolean()
  @IsOptional()
  isReadyProduct?: boolean;

  // Variations de couleur avec leurs stocks
  @IsArray()
  @IsOptional()
  colorVariations?: Array<{
    name: string;
    colorCode: string;
    stockBySize?: { [size: string]: number };
    images: Array<{
      fileId?: string;
      url?: string;
      view: string;
      delimitations?: any[];
    }>;
  }>;
}

// src/products/dto/update-product.dto.ts
export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  suggestedPrice?: number;

  @IsString()
  @IsOptional()
  status?: string;

  // 🔗 IMPORTANT: Permet de changer la catégorie
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsArray()
  @IsOptional()
  sizes?: string[];

  @IsString()
  @IsOptional()
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';

  // colorVariations peut être mis à jour
  @IsArray()
  @IsOptional()
  colorVariations?: any[];
}
```

---

### 3. Service Backend - Gestion des Catégories

```typescript
// src/products/products.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * ✅ Créer un produit avec liaison à une catégorie existante
   */
  async createProduct(dto: CreateProductDto, files: Express.Multer.File[]) {
    // 1. Vérifier que la catégorie existe si categoryId fourni
    let categoryName: string | undefined;

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId }
      });

      if (!category) {
        throw new NotFoundException(
          `Catégorie avec l'ID ${dto.categoryId} introuvable. ` +
          `Veuillez sélectionner une catégorie existante.`
        );
      }

      categoryName = category.name;
      console.log(`✅ Liaison avec catégorie existante: ${category.name} (ID: ${category.id})`);
    }

    // 2. Créer le produit avec la liaison
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        suggestedPrice: dto.suggestedPrice,
        status: dto.status || 'draft',

        // 🔗 Liaison avec la catégorie
        categoryId: dto.categoryId,
        categoryName: categoryName, // Cache du nom
        categories: categoryName ? [categoryName] : [], // Legacy array

        sizes: dto.sizes || [],
        genre: dto.genre || 'UNISEXE',
        isReadyProduct: dto.isReadyProduct || false
      },
      include: {
        category: true, // Inclure la catégorie dans la réponse
        colorVariations: {
          include: {
            images: true
          }
        }
      }
    });

    console.log(`✅ Produit créé avec liaison catégorie:`, {
      productId: product.id,
      productName: product.name,
      categoryId: product.categoryId,
      categoryName: product.categoryName
    });

    // 3. Gérer les variations de couleur et stocks
    if (dto.colorVariations && dto.colorVariations.length > 0) {
      // ... (code existant pour créer les colorVariations)
    }

    return {
      success: true,
      message: 'Produit créé avec succès',
      data: product
    };
  }

  /**
   * ✅ Modifier un produit (permet de changer de catégorie)
   */
  async updateProduct(productId: number, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });

    if (!product) {
      throw new NotFoundException(`Produit ${productId} introuvable`);
    }

    // 1. Vérifier la nouvelle catégorie si categoryId fourni
    let categoryName: string | undefined = product.categoryName;

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        // Retirer la liaison avec la catégorie
        categoryName = undefined;
        console.log(`🔄 Suppression de la liaison catégorie pour produit ${productId}`);
      } else {
        // Vérifier que la nouvelle catégorie existe
        const category = await this.prisma.category.findUnique({
          where: { id: dto.categoryId }
        });

        if (!category) {
          throw new NotFoundException(
            `Catégorie avec l'ID ${dto.categoryId} introuvable`
          );
        }

        categoryName = category.name;
        console.log(`🔄 Changement de catégorie: ${product.categoryName} → ${category.name}`);
      }
    }

    // 2. Mettre à jour le produit
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        suggestedPrice: dto.suggestedPrice,
        status: dto.status,

        // 🔗 Mise à jour de la liaison catégorie
        categoryId: dto.categoryId,
        categoryName: categoryName,
        categories: categoryName ? [categoryName] : [],

        sizes: dto.sizes,
        genre: dto.genre
      },
      include: {
        category: true,
        colorVariations: {
          include: {
            images: true
          }
        }
      }
    });

    return {
      success: true,
      message: 'Produit mis à jour avec succès',
      data: updatedProduct
    };
  }

  /**
   * 📋 Récupérer tous les produits avec leurs catégories
   */
  async getAllProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true, // Inclure les infos de catégorie
        colorVariations: {
          include: {
            images: true
          }
        },
        stocks: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: products.map(product => ({
        ...product,
        // Enrichir avec les infos de catégorie
        categoryInfo: product.category ? {
          id: product.category.id,
          name: product.category.name,
          level: product.category.level,
          icon: product.category.icon
        } : null
      }))
    };
  }

  /**
   * 📋 Récupérer les produits par catégorie
   */
  async getProductsByCategory(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new NotFoundException(`Catégorie ${categoryId} introuvable`);
    }

    const products = await this.prisma.product.findMany({
      where: { categoryId },
      include: {
        category: true,
        colorVariations: {
          include: {
            images: true
          }
        }
      }
    });

    return {
      success: true,
      category: category,
      productCount: products.length,
      data: products
    };
  }

  /**
   * 🔄 Synchroniser les noms de catégories (appelé quand une catégorie est renommée)
   */
  async syncCategoryNames(categoryId: number, newName: string) {
    console.log(`🔄 Synchronisation du nom de catégorie ${categoryId}: → ${newName}`);

    const result = await this.prisma.product.updateMany({
      where: { categoryId },
      data: {
        categoryName: newName,
        categories: [newName] // Mise à jour du cache
      }
    });

    console.log(`✅ ${result.count} produit(s) mis à jour avec le nouveau nom de catégorie`);

    return {
      success: true,
      updatedCount: result.count
    };
  }
}
```

---

### 4. Controller Backend

```typescript
// src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body('productData') productDataJson: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const productData: CreateProductDto = JSON.parse(productDataJson);

    console.log('📥 Création de produit avec catégorie:', {
      name: productData.name,
      categoryId: productData.categoryId
    });

    return this.productsService.createProduct(productData, files || []);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto
  ) {
    console.log('📥 Modification de produit:', {
      productId: id,
      categoryId: dto.categoryId
    });

    return this.productsService.updateProduct(id, dto);
  }

  @Get()
  async findAll() {
    return this.productsService.getAllProducts();
  }

  @Get('by-category/:categoryId')
  async findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.productsService.getProductsByCategory(categoryId);
  }
}
```

---

### 5. Webhook de Synchronisation (Categories → Products)

```typescript
// src/categories/categories.service.ts

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService // Injection du service produits
  ) {}

  /**
   * ✏️ Modifier une catégorie ET synchroniser les produits
   */
  async updateCategory(categoryId: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      throw new NotFoundException(`Catégorie ${categoryId} introuvable`);
    }

    // Vérifier unicité du nom
    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: { name: dto.name }
      });

      if (existing) {
        throw new ConflictException(`Le nom "${dto.name}" est déjà utilisé`);
      }
    }

    // Mettre à jour la catégorie
    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon
      }
    });

    // 🔄 IMPORTANT: Synchroniser les produits si le nom a changé
    if (dto.name && dto.name !== category.name) {
      await this.productsService.syncCategoryNames(categoryId, dto.name);
    }

    return {
      success: true,
      message: `Catégorie mise à jour (${category._count.products} produit(s) synchronisé(s))`,
      data: updated
    };
  }
}
```

---

## Frontend (React + TypeScript)

### 1. Service Frontend

```typescript
// src/services/categoryService.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface Category {
  id: number;
  name: string;
  description?: string;
  level: number;
  parentId?: number;
  icon?: string;
  _count?: {
    products: number;
    children: number;
  };
}

class CategoryService {
  /**
   * Récupérer toutes les catégories disponibles
   */
  async getAllCategories(): Promise<Category[]> {
    const response = await axios.get(`${API_BASE}/categories`, {
      withCredentials: true
    });
    return response.data.data || response.data;
  }

  /**
   * Récupérer les catégories par niveau
   */
  async getCategoriesByLevel(level: number): Promise<Category[]> {
    const response = await axios.get(`${API_BASE}/categories`, {
      params: { level },
      withCredentials: true
    });
    return response.data.data || response.data;
  }

  /**
   * Récupérer les produits d'une catégorie
   */
  async getProductsByCategory(categoryId: number) {
    const response = await axios.get(`${API_BASE}/products/by-category/${categoryId}`, {
      withCredentials: true
    });
    return response.data;
  }
}

export default new CategoryService();
```

---

### 2. Composant Sélecteur de Catégorie

```typescript
// src/components/product-form/CategorySelector.tsx
import React, { useEffect, useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Info, Package } from 'lucide-react';
import categoryService, { Category } from '../../services/categoryService';
import { toast } from 'sonner';

interface CategorySelectorProps {
  value?: number; // ID de la catégorie sélectionnée
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
      console.log('📦 Catégories chargées:', data.length);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erreur lors du chargement des catégories';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (categoryIdStr: string) => {
    if (categoryIdStr === 'none') {
      onChange(null);
      return;
    }

    const categoryId = parseInt(categoryIdStr);
    onChange(categoryId);

    const category = categories.find(c => c.id === categoryId);
    if (category) {
      console.log('✅ Catégorie sélectionnée:', category.name, `(ID: ${category.id})`);
      toast.success(`Catégorie sélectionnée: ${category.name}`);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="category" className="text-sm font-semibold">
        Catégorie *
      </Label>

      <Select
        value={value?.toString() || 'none'}
        onValueChange={handleChange}
        disabled={disabled || loading}
      >
        <SelectTrigger id="category" className="w-full">
          <SelectValue placeholder={loading ? 'Chargement...' : 'Sélectionnez une catégorie'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-gray-500">Aucune catégorie</span>
          </SelectItem>

          {categories.length > 0 ? (
            categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center gap-2">
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.name}</span>
                  {category._count && category._count.products > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({category._count.products} produit{category._count.products > 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-categories" disabled>
              <span className="text-gray-500">Aucune catégorie disponible</span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          ⚠️ <strong>Sélectionnez une catégorie existante</strong><br />
          Pour créer une nouvelle catégorie, rendez-vous dans{' '}
          <a href="/admin/categories" className="underline font-semibold">
            Gestion des catégories
          </a>
        </AlertDescription>
      </Alert>

      {value && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Package className="h-4 w-4" />
          <span>
            Catégorie liée: <strong>{categories.find(c => c.id === value)?.name}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
```

---

### 3. Intégration dans ProductFormMain

```typescript
// src/components/product-form/ProductFormMain.tsx

import { CategorySelector } from './CategorySelector';

// Dans le composant ProductFormMain

const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

// Mettre à jour le formData quand la catégorie change
useEffect(() => {
  if (selectedCategoryId !== null) {
    updateFormData('categoryId', selectedCategoryId);
  }
}, [selectedCategoryId]);

// Dans le rendu du step 3 (Catégories et tailles)
const CategoriesStep: React.FC<{
  categoryId: number | null;
  sizes: string[];
  onCategoryChange: (categoryId: number | null) => void;
  onSizesUpdate: (sizes: string[]) => void;
}> = ({ categoryId, sizes, onCategoryChange, onSizesUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Catégorie et tailles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélecteur de catégorie */}
        <CategorySelector
          value={categoryId || undefined}
          onChange={onCategoryChange}
        />

        {/* Gestion des tailles (code existant) */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Tailles disponibles</Label>
          {/* ... code existant pour les tailles */}
        </div>
      </CardContent>
    </Card>
  );
};

// Dans renderStepContent()
case 3:
  return (
    <CategoriesStep
      categoryId={selectedCategoryId}
      sizes={formData.sizes}
      onCategoryChange={(categoryId) => {
        setSelectedCategoryId(categoryId);
        // Optionnel: mettre à jour formData immédiatement
        updateFormData('categoryId', categoryId);
      }}
      onSizesUpdate={(sizes: string[]) => updateFormData('sizes', sizes)}
    />
  );
```

---

### 4. Hook useProductForm - Mise à jour

```typescript
// src/hooks/useProductForm.ts

import { updateProductStocks } from '../services/stockService';

const initialFormData: ProductFormData = {
  name: '',
  price: 0,
  suggestedPrice: undefined,
  stock: 0,
  status: 'draft',
  description: '',
  categoryId: null, // ✅ Ajout du champ categoryId
  categories: [], // Legacy
  designs: [],
  colorVariations: [],
  sizes: [],
  colors: [],
  stockBySizeColor: {},
  genre: 'UNISEXE'
};

// Dans submitForm()
const apiPayload: CreateProductPayload = {
  name: formData.name,
  description: formData.description,
  price: formData.price,
  suggestedPrice: formData.suggestedPrice,
  stock: formData.stock,
  status: formData.status,

  // 🔗 IMPORTANT: Envoyer categoryId au backend
  categoryId: formData.categoryId,

  sizes: normalizeSizes(formData.sizes || []),
  genre: formData.genre || 'UNISEXE',
  isReadyProduct: false,
  colorVariations: formData.colorVariations.map(color => ({
    name: color.name,
    colorCode: color.colorCode,
    stockBySize: color.stock || {},
    images: color.images.map(image => ({
      fileId: image.id,
      view: image.view,
      delimitations: (image.delimitations || []).map(delim => ({
        x: delim.x,
        y: delim.y,
        width: delim.width,
        height: delim.height,
        rotation: delim.rotation || 0,
        name: delim.name
      }))
    }))
  }))
};
```

---

### 5. Types TypeScript

```typescript
// src/types/product.ts

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  suggestedPrice?: number;
  stock: number;
  status: string;

  // 🔗 Catégories
  categoryId: number | null; // ID de la catégorie liée
  categories: string[]; // Legacy array

  designs: string[];
  colorVariations: ColorVariation[];
  sizes: string[];
  colors: string[];
  stockBySizeColor: StockBySizeColor;
  genre: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price?: number;
  suggestedPrice?: number;

  // 🔗 Catégories
  categoryId?: number;
  categoryName?: string;
  category?: {
    id: number;
    name: string;
    level: number;
    icon?: string;
  };

  colorVariations?: ColorVariation[];
  sizes?: string[];
  genre?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Flux Utilisateur Complet

### Création de Produit

```
1. Admin ouvre ProductFormMain
   ↓
2. Step 3: Catégories et tailles
   ↓
3. CategorySelector charge toutes les catégories existantes
   ↓
4. Admin sélectionne "Vêtements > Tshirt" (ID: 42)
   ↓
5. formData.categoryId = 42
   ↓
6. Submit → Backend reçoit { categoryId: 42, ... }
   ↓
7. Backend vérifie que catégorie 42 existe
   ↓
8. Product créé avec:
   - categoryId: 42
   - categoryName: "Vêtements > Tshirt" (cache)
   - categories: ["Vêtements > Tshirt"] (legacy)
   ↓
9. Produit lié à la catégorie existante ✅
```

### Modification de Catégorie d'un Produit

```
1. Admin édite un produit (ID: 123)
   ↓
2. Catégorie actuelle: "Polo" (ID: 50)
   ↓
3. Admin change pour "Tshirt" (ID: 42)
   ↓
4. Submit → Backend reçoit { categoryId: 42 }
   ↓
5. Backend met à jour:
   - categoryId: 42
   - categoryName: "Tshirt"
   - categories: ["Tshirt"]
   ↓
6. Produit relié à nouvelle catégorie ✅
```

### Renommage de Catégorie (Synchronisation)

```
1. Admin renomme "Tshirt" → "T-Shirt Premium"
   ↓
2. Backend met à jour la catégorie
   ↓
3. Backend appelle syncCategoryNames(42, "T-Shirt Premium")
   ↓
4. Tous les produits avec categoryId: 42 sont mis à jour:
   - categoryName: "T-Shirt Premium"
   - categories: ["T-Shirt Premium"]
   ↓
5. 15 produits synchronisés automatiquement ✅
```

---

## Points Clés de Sécurité

### Backend

1. ✅ **Validation stricte** : Vérifier que categoryId existe avant création/modification
2. ✅ **Relations Prisma** : Utiliser `onDelete: SetNull` pour préserver les produits
3. ✅ **Synchronisation** : Mettre à jour categoryName quand la catégorie est renommée
4. ✅ **Cache denormalisé** : Stocker categoryName pour performance
5. ✅ **Transactions** : Utiliser `$transaction` pour opérations atomiques

### Frontend

1. ✅ **Lecture seule** : CategorySelector n'affiche que les catégories existantes
2. ✅ **Pas de création** : Redirection vers /admin/categories pour créer
3. ✅ **Validation** : Empêcher submit sans catégorie sélectionnée
4. ✅ **Feedback** : Toast de confirmation lors de la sélection
5. ✅ **Cache local** : Charger les catégories au montage du composant

---

## Endpoints Backend

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/categories` | Lister toutes les catégories |
| `GET` | `/products` | Lister tous les produits (avec category) |
| `GET` | `/products/by-category/:id` | Produits d'une catégorie |
| `POST` | `/products` | Créer produit (avec categoryId) |
| `PATCH` | `/products/:id` | Modifier produit (changer categoryId) |
| `PATCH` | `/categories/:id` | Modifier catégorie (sync auto) |

---

## Migration des Données Existantes

### Script de Migration Prisma

```typescript
// prisma/migrations/add_category_relation.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Migration: Liaison produits → catégories existantes');

  // 1. Récupérer tous les produits
  const products = await prisma.product.findMany({
    where: {
      categoryId: null, // Produits sans liaison
      categories: { isEmpty: false } // Mais avec un nom de catégorie legacy
    }
  });

  console.log(`📦 ${products.length} produit(s) à migrer`);

  for (const product of products) {
    const categoryName = product.categories[0]; // Prendre la première catégorie

    if (categoryName) {
      // Chercher la catégorie par nom
      const category = await prisma.category.findUnique({
        where: { name: categoryName }
      });

      if (category) {
        // Lier le produit à la catégorie
        await prisma.product.update({
          where: { id: product.id },
          data: {
            categoryId: category.id,
            categoryName: category.name
          }
        });

        console.log(`✅ Produit ${product.id} lié à catégorie ${category.name}`);
      } else {
        console.log(`⚠️ Produit ${product.id}: Catégorie "${categoryName}" introuvable`);
      }
    }
  }

  console.log('✅ Migration terminée');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Tests Recommandés

### Backend

```typescript
describe('ProductsService - Category Linking', () => {
  it('should create product with existing category', async () => {
    const category = await prisma.category.create({
      data: { name: 'Test Category', level: 0 }
    });

    const result = await service.createProduct({
      name: 'Test Product',
      categoryId: category.id,
      // ...
    }, []);

    expect(result.success).toBe(true);
    expect(result.data.categoryId).toBe(category.id);
    expect(result.data.categoryName).toBe('Test Category');
  });

  it('should fail when categoryId does not exist', async () => {
    await expect(
      service.createProduct({
        name: 'Test Product',
        categoryId: 99999, // N'existe pas
        // ...
      }, [])
    ).rejects.toThrow(NotFoundException);
  });

  it('should sync product names when category is renamed', async () => {
    const category = await prisma.category.create({
      data: { name: 'Old Name', level: 0 }
    });

    await prisma.product.create({
      data: {
        name: 'Product 1',
        categoryId: category.id,
        categoryName: 'Old Name'
      }
    });

    await service.syncCategoryNames(category.id, 'New Name');

    const product = await prisma.product.findFirst({
      where: { categoryId: category.id }
    });

    expect(product.categoryName).toBe('New Name');
  });
});
```

### Frontend

```typescript
describe('CategorySelector', () => {
  it('should display only existing categories', async () => {
    render(<CategorySelector value={null} onChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('Créer une nouvelle catégorie')).not.toBeInTheDocument();
    });
  });

  it('should emit categoryId when selection changes', async () => {
    const onChange = jest.fn();
    render(<CategorySelector value={null} onChange={onChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.click(select);

    const option = screen.getByText('Test Category');
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith(expect.any(Number));
  });
});
```

---

## Checklist d'Implémentation

### Backend
- [ ] Ajouter `categoryId` et `categoryName` au modèle Product
- [ ] Créer relation `@relation("ProductCategory")`
- [ ] Implémenter validation dans CreateProductDto
- [ ] Vérifier existence de categoryId dans createProduct()
- [ ] Implémenter syncCategoryNames()
- [ ] Mettre à jour updateCategory() pour appeler sync
- [ ] Créer endpoint GET /products/by-category/:id
- [ ] Tester la création avec categoryId valide/invalide
- [ ] Tester la synchronisation lors du renommage

### Frontend
- [ ] Créer CategorySelector component
- [ ] Charger les catégories au montage
- [ ] Afficher message informatif (pas de création)
- [ ] Ajouter lien vers /admin/categories
- [ ] Intégrer dans ProductFormMain (Step 3)
- [ ] Mettre à jour ProductFormData avec categoryId
- [ ] Modifier submitForm() pour envoyer categoryId
- [ ] Tester sélection et liaison
- [ ] Tester changement de catégorie en édition

---

Cette architecture garantit que **les catégories sont toujours créées depuis CategoryManagement** et que **les produits se lient uniquement aux catégories existantes**, tout en maintenant la synchronisation automatique des données. 🚀
