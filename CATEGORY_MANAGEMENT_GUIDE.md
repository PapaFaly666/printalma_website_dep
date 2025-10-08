# Guide Complet - Gestion des Catégories avec Relations Produits

## Vue d'ensemble

Ce guide explique comment gérer les catégories de manière robuste en tenant compte des relations avec les produits (mockups). Il couvre les opérations CRUD avec validation des contraintes de référence.

## Principes Fondamentaux

### Règles de Gestion

1. **Création de Produit** : On sélectionne une catégorie existante, on ne crée PAS de nouvelle catégorie
2. **Modification de Catégorie** : Si une catégorie est liée à des produits, la modification met à jour tous les produits associés
3. **Suppression de Catégorie** : Si une catégorie a des produits, on DOIT déplacer ces produits vers une autre catégorie avant suppression

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
}

model Product {
  id                Int                @id @default(autoincrement())
  name              String
  description       String?
  price             Float?
  suggestedPrice    Float?
  status            String             @default("draft")
  categories        String[]           // Array de noms de catégories
  sizes             String[]           // Array de tailles
  genre             String?
  isReadyProduct    Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  // Relations
  categoryId        Int?               // ID de la catégorie principale
  category          Category?          @relation("ProductCategory", fields: [categoryId], references: [id], onDelete: SetNull)
  colorVariations   ColorVariation[]
  stocks            ProductStock[]

  @@index([categoryId])
  @@index([status])
}
```

**Points clés** :
- `onDelete: Restrict` pour Category.parent → empêche la suppression d'une catégorie parent si elle a des enfants
- `onDelete: SetNull` pour Product.category → si catégorie supprimée, le produit n'est pas supprimé mais perd sa catégorie

---

### 2. DTO de Validation

```typescript
// src/categories/dto/create-category.dto.ts
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @Max(2)
  @IsOptional()
  level?: number; // 0 = Parent, 1 = Enfant, 2 = Variation

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsString()
  @IsOptional()
  icon?: string;
}

// src/categories/dto/update-category.dto.ts
export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}

// src/categories/dto/delete-category.dto.ts
export class DeleteCategoryDto {
  @IsInt()
  @IsOptional()
  moveProductsToCategoryId?: number; // Catégorie de destination pour les produits
}
```

---

### 3. Service Backend - Opérations CRUD

```typescript
// src/categories/categories.service.ts
import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, DeleteCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * ✅ Créer une nouvelle catégorie
   */
  async createCategory(dto: CreateCategoryDto) {
    // Vérifier si le nom existe déjà
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name }
    });

    if (existing) {
      throw new ConflictException(`La catégorie "${dto.name}" existe déjà`);
    }

    // Vérifier que le parent existe si parentId fourni
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId }
      });

      if (!parent) {
        throw new NotFoundException(`Catégorie parent ${dto.parentId} introuvable`);
      }

      // Valider la hiérarchie (max 3 niveaux)
      if (parent.level >= 2) {
        throw new BadRequestException('Impossible de créer une sous-catégorie de niveau 3+');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        level: dto.level || 0,
        parentId: dto.parentId,
        icon: dto.icon
      }
    });

    return {
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    };
  }

  /**
   * 📋 Récupérer toutes les catégories
   */
  async getAllCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    });

    return {
      success: true,
      data: categories
    };
  }

  /**
   * 📋 Récupérer la hiérarchie complète
   */
  async getCategoryHierarchy() {
    const categories = await this.prisma.category.findMany({
      where: { level: 0 }, // Parents uniquement
      include: {
        children: {
          include: {
            children: true, // Variations
            _count: {
              select: { products: true }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return {
      success: true,
      data: categories
    };
  }

  /**
   * ✏️ Modifier une catégorie (avec mise à jour des produits)
   */
  async updateCategory(categoryId: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: true,
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      throw new NotFoundException(`Catégorie ${categoryId} introuvable`);
    }

    // Vérifier l'unicité du nom si modifié
    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: { name: dto.name }
      });

      if (existing) {
        throw new ConflictException(`Le nom "${dto.name}" est déjà utilisé`);
      }
    }

    // ✅ IMPORTANT: Mettre à jour la catégorie ET les produits associés
    const updatedCategory = await this.prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la catégorie
      const updated = await tx.category.update({
        where: { id: categoryId },
        data: {
          name: dto.name,
          description: dto.description,
          icon: dto.icon
        }
      });

      // 2. Mettre à jour les produits si le nom a changé
      if (dto.name && dto.name !== category.name) {
        console.log(`📝 Mise à jour de ${category._count.products} produits avec la nouvelle catégorie "${dto.name}"`);

        // Mettre à jour l'array categories de chaque produit
        await tx.product.updateMany({
          where: { categoryId: categoryId },
          data: {
            categories: {
              set: [dto.name] // Remplace l'ancien nom par le nouveau
            }
          }
        });
      }

      return updated;
    });

    return {
      success: true,
      message: `Catégorie mise à jour (${category._count.products} produit(s) affecté(s))`,
      data: updatedCategory
    };
  }

  /**
   * 🗑️ Supprimer une catégorie (avec déplacement de produits)
   */
  async deleteCategory(categoryId: number, dto?: DeleteCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        children: true,
        products: true,
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException(`Catégorie ${categoryId} introuvable`);
    }

    // ❌ BLOQUER si la catégorie a des enfants
    if (category._count.children > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette catégorie car elle contient ${category._count.children} sous-catégorie(s). ` +
        `Veuillez d'abord supprimer ou déplacer les sous-catégories.`
      );
    }

    // ⚠️ VÉRIFIER si la catégorie a des produits
    if (category._count.products > 0) {
      if (!dto?.moveProductsToCategoryId) {
        // Retourner une erreur avec la liste des produits
        return {
          success: false,
          requiresProductMigration: true,
          productCount: category._count.products,
          message: `Cette catégorie contient ${category._count.products} produit(s). ` +
                   `Veuillez spécifier une catégorie de destination pour les produits.`,
          products: category.products.map(p => ({
            id: p.id,
            name: p.name
          }))
        };
      }

      // Vérifier que la catégorie de destination existe
      const targetCategory = await this.prisma.category.findUnique({
        where: { id: dto.moveProductsToCategoryId }
      });

      if (!targetCategory) {
        throw new NotFoundException(
          `Catégorie de destination ${dto.moveProductsToCategoryId} introuvable`
        );
      }

      // ✅ Déplacer les produits vers la nouvelle catégorie
      console.log(`🔄 Déplacement de ${category._count.products} produits vers "${targetCategory.name}"`);

      await this.prisma.$transaction(async (tx) => {
        // 1. Mettre à jour tous les produits
        await tx.product.updateMany({
          where: { categoryId: categoryId },
          data: {
            categoryId: dto.moveProductsToCategoryId,
            categories: {
              set: [targetCategory.name] // Mettre à jour l'array de catégories
            }
          }
        });

        // 2. Supprimer la catégorie
        await tx.category.delete({
          where: { id: categoryId }
        });
      });

      return {
        success: true,
        message: `Catégorie supprimée. ${category._count.products} produit(s) déplacé(s) vers "${targetCategory.name}"`,
        movedProducts: category._count.products,
        targetCategory: targetCategory.name
      };
    }

    // ✅ Pas de produits, suppression directe
    await this.prisma.category.delete({
      where: { id: categoryId }
    });

    return {
      success: true,
      message: 'Catégorie supprimée avec succès',
      data: { id: categoryId }
    };
  }

  /**
   * 📊 Obtenir les statistiques d'une catégorie
   */
  async getCategoryStats(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException(`Catégorie ${categoryId} introuvable`);
    }

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        productCount: category._count.products,
        childrenCount: category._count.children,
        level: category.level
      }
    };
  }
}
```

---

### 4. Controller Backend

```typescript
// src/categories/categories.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, DeleteCategoryDto } from './dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Get()
  async findAll() {
    return this.categoriesService.getAllCategories();
  }

  @Get('hierarchy')
  async getHierarchy() {
    return this.categoriesService.getCategoryHierarchy();
  }

  @Get(':id/stats')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.getCategoryStats(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto?: DeleteCategoryDto
  ) {
    return this.categoriesService.deleteCategory(id, dto);
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
   * Récupérer toutes les catégories
   */
  async getAllCategories(): Promise<Category[]> {
    const response = await axios.get(`${API_BASE}/categories`, {
      withCredentials: true
    });
    return response.data.data || response.data;
  }

  /**
   * Récupérer la hiérarchie
   */
  async getCategoryHierarchy(): Promise<Category[]> {
    const response = await axios.get(`${API_BASE}/categories/hierarchy`, {
      withCredentials: true
    });
    return response.data.data || response.data;
  }

  /**
   * Créer une catégorie
   */
  async createCategory(data: {
    name: string;
    description?: string;
    level?: number;
    parentId?: number;
    icon?: string;
  }) {
    const response = await axios.post(`${API_BASE}/categories`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Modifier une catégorie
   */
  async updateCategory(id: number, data: {
    name?: string;
    description?: string;
    icon?: string;
  }) {
    const response = await axios.patch(`${API_BASE}/categories/${id}`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Supprimer une catégorie (avec déplacement de produits)
   */
  async deleteCategory(id: number, moveProductsToCategoryId?: number) {
    const response = await axios.delete(`${API_BASE}/categories/${id}`, {
      data: { moveProductsToCategoryId },
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Obtenir les stats d'une catégorie
   */
  async getCategoryStats(id: number) {
    const response = await axios.get(`${API_BASE}/categories/${id}/stats`, {
      withCredentials: true
    });
    return response.data.data;
  }
}

export default new CategoryService();
```

---

### 2. Hook de Gestion des Catégories

```typescript
// src/hooks/useCategories.ts
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import categoryService, { Category } from '../services/categoryService';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erreur lors du chargement';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const createCategory = async (data: {
    name: string;
    description?: string;
    level?: number;
    parentId?: number;
  }) => {
    try {
      const result = await categoryService.createCategory(data);
      toast.success(result.message || 'Catégorie créée');
      await loadCategories();
      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erreur lors de la création';
      toast.error(errorMsg);
      throw err;
    }
  };

  const updateCategory = async (id: number, data: {
    name?: string;
    description?: string;
  }) => {
    try {
      const result = await categoryService.updateCategory(id, data);
      toast.success(result.message || 'Catégorie mise à jour');
      await loadCategories();
      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erreur lors de la modification';
      toast.error(errorMsg);
      throw err;
    }
  };

  const deleteCategory = async (id: number, moveProductsToCategoryId?: number) => {
    try {
      const result = await categoryService.deleteCategory(id, moveProductsToCategoryId);

      if (!result.success && result.requiresProductMigration) {
        // Retourner les infos pour que le composant demande une catégorie de destination
        return result;
      }

      toast.success(result.message || 'Catégorie supprimée');
      await loadCategories();
      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(errorMsg);
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
```

---

### 3. Composant de Sélection de Catégorie (ProductForm)

```typescript
// src/components/CategorySelector.tsx
import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useCategories } from '../hooks/useCategories';

interface CategorySelectorProps {
  value?: number;
  onChange: (categoryId: number, categoryName: string) => void;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const { categories, loading } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(value);

  useEffect(() => {
    setSelectedCategory(value);
  }, [value]);

  const handleChange = (categoryId: string) => {
    const id = parseInt(categoryId);
    const category = categories.find(c => c.id === id);

    if (category) {
      setSelectedCategory(id);
      onChange(id, category.name);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Catégorie *</Label>
      <Select
        value={selectedCategory?.toString()}
        onValueChange={handleChange}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionnez une catégorie" />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>Chargement...</SelectItem>
          ) : (
            categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.icon && `${category.icon} `}
                {category.name}
                {category._count && category._count.products > 0 && (
                  <span className="text-gray-500 ml-2">
                    ({category._count.products} produit{category._count.products > 1 ? 's' : ''})
                  </span>
                )}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500">
        ⚠️ Sélectionnez une catégorie existante. Les nouvelles catégories doivent être créées depuis la gestion des catégories.
      </p>
    </div>
  );
};
```

---

### 4. Modal de Suppression avec Déplacement

```typescript
// src/components/CategoryDeleteModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: {
    id: number;
    name: string;
    productCount?: number;
  } | null;
  onConfirm: (categoryId: number, targetCategoryId?: number) => Promise<void>;
}

export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  isOpen,
  onClose,
  category,
  onConfirm
}) => {
  const { categories } = useCategories();
  const [targetCategoryId, setTargetCategoryId] = useState<number | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTargetCategoryId(undefined);
    }
  }, [isOpen]);

  if (!category) return null;

  const hasProducts = category.productCount && category.productCount > 0;

  // Filtrer les catégories disponibles (exclure la catégorie à supprimer)
  const availableCategories = categories.filter(c => c.id !== category.id);

  const handleConfirm = async () => {
    if (hasProducts && !targetCategoryId) {
      return; // Ne pas permettre la suppression sans catégorie de destination
    }

    setIsDeleting(true);
    try {
      await onConfirm(category.id, targetCategoryId);
      onClose();
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer la catégorie ?</DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de supprimer la catégorie "{category.name}"
          </DialogDescription>
        </DialogHeader>

        {hasProducts && (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cette catégorie contient <strong>{category.productCount} produit(s)</strong>.
                Vous devez choisir une catégorie de destination pour ces produits.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Déplacer les produits vers *</Label>
              <Select
                value={targetCategoryId?.toString()}
                onValueChange={(value) => setTargetCategoryId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.icon && `${cat.icon} `}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Les {category.productCount} produit(s) seront automatiquement déplacés vers cette catégorie
              </p>
            </div>
          </>
        )}

        {!hasProducts && (
          <Alert>
            <AlertDescription>
              Cette catégorie ne contient aucun produit. Elle sera supprimée définitivement.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || (hasProducts && !targetCategoryId)}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Flux Utilisateur Complet

### 1. Création de Produit

```
Utilisateur → Sélectionne une catégorie existante dans ProductForm
           → Si besoin d'une nouvelle catégorie, doit aller dans CategoryManagement
           → Impossible de créer une catégorie depuis ProductForm
```

### 2. Modification de Catégorie

```
Admin → CategoryManagement → Modifier "Vêtements"
      → Change le nom en "Vêtements & Accessoires"
      → Backend met à jour automatiquement tous les produits liés
      → Tous les produits affichent maintenant "Vêtements & Accessoires"
```

### 3. Suppression de Catégorie

```
Admin → CategoryManagement → Supprimer "Tshirt"
      → Backend détecte 15 produits liés
      → Frontend affiche modal de déplacement
      → Admin sélectionne "Polo" comme destination
      → Backend déplace les 15 produits vers "Polo"
      → Backend supprime "Tshirt"
      → Toast: "Catégorie supprimée. 15 produits déplacés vers Polo"
```

---

## Points Clés de Sécurité

### Backend

1. ✅ **Validation stricte** : Vérifier l'existence des catégories avant toute opération
2. ✅ **Transactions** : Utiliser `$transaction` pour garantir la cohérence
3. ✅ **Contraintes Prisma** : `onDelete: Restrict` pour empêcher les suppressions en cascade non désirées
4. ✅ **Messages clairs** : Informer l'utilisateur du nombre de produits affectés

### Frontend

1. ✅ **Désactiver la création** : Ne pas permettre de créer des catégories depuis ProductForm
2. ✅ **Sélecteur simple** : Afficher uniquement les catégories existantes
3. ✅ **Confirmation visuelle** : Modal explicite pour la suppression avec déplacement
4. ✅ **Feedback utilisateur** : Toast informatif sur les actions effectuées

---

## Tests Recommandés

### Backend

```typescript
// Test de suppression avec produits
describe('CategoriesService - Delete', () => {
  it('should require target category when deleting category with products', async () => {
    const result = await service.deleteCategory(categoryWithProducts.id);

    expect(result.success).toBe(false);
    expect(result.requiresProductMigration).toBe(true);
    expect(result.productCount).toBeGreaterThan(0);
  });

  it('should move products when deleting category', async () => {
    const result = await service.deleteCategory(
      categoryWithProducts.id,
      { moveProductsToCategoryId: targetCategory.id }
    );

    expect(result.success).toBe(true);
    expect(result.movedProducts).toBeGreaterThan(0);
  });
});
```

### Frontend

```typescript
// Test du modal de suppression
describe('CategoryDeleteModal', () => {
  it('should require target category selection when category has products', () => {
    render(
      <CategoryDeleteModal
        isOpen={true}
        category={{ id: 1, name: 'Test', productCount: 5 }}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    const deleteButton = screen.getByText('Supprimer');
    expect(deleteButton).toBeDisabled();
  });
});
```

---

## Résumé des Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/categories` | Lister toutes les catégories |
| `GET` | `/categories/hierarchy` | Hiérarchie complète |
| `GET` | `/categories/:id/stats` | Stats d'une catégorie |
| `POST` | `/categories` | Créer une catégorie |
| `PATCH` | `/categories/:id` | Modifier (met à jour les produits) |
| `DELETE` | `/categories/:id` | Supprimer (avec déplacement) |

---

## Checklist d'Implémentation

### Backend
- [ ] Créer le modèle Prisma avec contraintes
- [ ] Implémenter le service avec transactions
- [ ] Ajouter validation DTO
- [ ] Créer le controller
- [ ] Tester la suppression avec produits
- [ ] Tester la modification avec propagation

### Frontend
- [ ] Créer CategorySelector (lecture seule)
- [ ] Créer CategoryDeleteModal avec sélection
- [ ] Mettre à jour ProductForm (désactiver création)
- [ ] Mettre à jour CategoryManagement
- [ ] Ajouter feedback utilisateur
- [ ] Tester les flux complets

---

Cette architecture garantit l'intégrité des données tout en offrant une UX fluide pour la gestion des catégories et de leurs relations avec les produits.
