# Guide Complet - Modification Avancée des Catégories avec Slug et Hiérarchie

## 📋 Vue d'ensemble

Ce guide explique comment implémenter un système complet de modification des catégories incluant :
- ✅ Modification du nom et de la description
- ✅ Génération automatique de slug unique
- ✅ Changement de hiérarchie (parentId)
- ✅ Conservation des liens avec les produits
- ✅ Gestion des conflits de noms/slugs
- ✅ Historique des modifications

---

## 🗄️ Structure de Base de Données

### 1. Modifier la table `categories`

```sql
-- Ajouter les colonnes nécessaires
ALTER TABLE categories
ADD COLUMN slug VARCHAR(255) UNIQUE,
ADD COLUMN previous_names TEXT, -- JSON array des anciens noms
ADD COLUMN updated_by INT NULL,
ADD COLUMN version INT DEFAULT 1;

-- Index pour les performances
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parentId);

-- Clé étrangère pour updated_by
ALTER TABLE categories
ADD CONSTRAINT fk_categories_updated_by
FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
```

### 2. Structure complète de la table

```sql
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  imageUrl VARCHAR(500),
  parentId INT NULL,
  level INT DEFAULT 0,
  `order` INT DEFAULT 0,
  previous_names TEXT, -- JSON: ["Ancien nom 1", "Ancien nom 2"]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NULL,
  version INT DEFAULT 1,

  CONSTRAINT fk_categories_parent FOREIGN KEY (parentId)
    REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_categories_updated_by FOREIGN KEY (updated_by)
    REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 🔧 Backend - Implémentation

### 1. DTO de Mise à Jour Complet

**Fichier :** `update-category.dto.ts`

```typescript
import { IsString, IsOptional, IsInt, MinLength, MaxLength, IsNumber, Min } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  imageUrl?: string;

  @IsInt()
  @IsOptional()
  parentId?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}
```

---

### 2. Service de Génération de Slug

**Fichier :** `slug.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class SlugService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ) {}

  /**
   * Générer un slug à partir d'un texte
   */
  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD') // Décomposer les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces, tirets
      .trim()
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-'); // Supprimer tirets multiples
  }

  /**
   * Vérifier si un slug existe déjà
   */
  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const query = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.slug = :slug', { slug });

    if (excludeId) {
      query.andWhere('category.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  /**
   * Générer un slug unique en ajoutant un suffixe si nécessaire
   */
  async generateUniqueSlug(name: string, excludeId?: number): Promise<string> {
    const baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Boucler jusqu'à trouver un slug unique
    while (await this.slugExists(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
```

---

### 3. Service de Catégories Mis à Jour

**Fichier :** `categories.service.ts`

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SlugService } from './slug.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private slugService: SlugService
  ) {}

  /**
   * Trouver une catégorie par ID
   */
  async findOne(id: number): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children']
    });
  }

  /**
   * Trouver une catégorie par nom (exact)
   */
  async findByName(name: string): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { name }
    });
  }

  /**
   * Mettre à jour une catégorie avec gestion complète
   */
  async update(
    id: number,
    updateData: UpdateCategoryDto,
    userId: number
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    // 1. Vérifier le changement de nom et unicité
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await this.findByName(updateData.name);

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Une catégorie avec ce nom existe déjà');
      }

      // Sauvegarder l'ancien nom dans l'historique
      const previousNames = category.previous_names
        ? JSON.parse(category.previous_names)
        : [];

      if (!previousNames.includes(category.name)) {
        previousNames.push(category.name);
      }

      category.previous_names = JSON.stringify(previousNames);

      // Générer un nouveau slug unique
      category.slug = await this.slugService.generateUniqueSlug(
        updateData.name,
        id
      );

      category.name = updateData.name;
    }

    // 2. Gestion du changement de parentId (hiérarchie)
    if (updateData.parentId !== undefined) {
      // Vérifier que le nouveau parent existe (si non null)
      if (updateData.parentId !== null) {
        const newParent = await this.findOne(updateData.parentId);

        if (!newParent) {
          throw new NotFoundException('Catégorie parent non trouvée');
        }

        // Empêcher une catégorie d'être son propre parent
        if (updateData.parentId === id) {
          throw new ConflictException('Une catégorie ne peut pas être son propre parent');
        }

        // Empêcher les boucles infinies (A -> B -> A)
        if (await this.wouldCreateCycle(id, updateData.parentId)) {
          throw new ConflictException('Cette modification créerait une boucle dans la hiérarchie');
        }
      }

      category.parentId = updateData.parentId;

      // Recalculer le level automatiquement
      category.level = await this.calculateLevel(updateData.parentId);
    }

    // 3. Autres mises à jour simples
    if (updateData.description !== undefined) {
      category.description = updateData.description;
    }

    if (updateData.imageUrl !== undefined) {
      category.imageUrl = updateData.imageUrl;
    }

    if (updateData.order !== undefined) {
      category.order = updateData.order;
    }

    // 4. Métadonnées de mise à jour
    category.updated_by = userId;
    category.version = (category.version || 0) + 1;

    // 5. Sauvegarder
    return await this.categoryRepository.save(category);
  }

  /**
   * Calculer le niveau hiérarchique d'une catégorie
   */
  private async calculateLevel(parentId: number | null): Promise<number> {
    if (!parentId) {
      return 0; // Catégorie racine
    }

    const parent = await this.findOne(parentId);
    if (!parent) {
      return 0;
    }

    return (parent.level || 0) + 1;
  }

  /**
   * Vérifier si un changement de parent créerait une boucle
   */
  private async wouldCreateCycle(
    categoryId: number,
    newParentId: number
  ): Promise<boolean> {
    let currentParentId: number | null = newParentId;

    // Remonter la chaîne des parents
    while (currentParentId !== null) {
      if (currentParentId === categoryId) {
        return true; // Boucle détectée
      }

      const parent = await this.findOne(currentParentId);
      if (!parent) {
        break;
      }

      currentParentId = parent.parentId;
    }

    return false;
  }

  /**
   * Récupérer tous les produits liés à une catégorie
   */
  async getRelatedProducts(categoryId: number): Promise<number[]> {
    // À implémenter selon votre structure de produits
    // Retourne les IDs des produits liés
    return [];
  }
}
```

---

### 4. Controller Mis à Jour

**Fichier :** `categories.controller.ts`

```typescript
import {
  Controller,
  Put,
  Param,
  Body,
  UseGuards,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Mettre à jour une catégorie
   * PUT /categories/:id
   */
  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async updateCategory(
    @Param('id') id: number,
    @Body() updateData: UpdateCategoryDto,
    @CurrentUser() user: User
  ) {
    try {
      const updatedCategory = await this.categoriesService.update(
        id,
        updateData,
        user.id
      );

      return {
        success: true,
        message: 'Catégorie mise à jour avec succès',
        category: updatedCategory,
        changes: {
          nameChanged: updateData.name !== undefined,
          hierarchyChanged: updateData.parentId !== undefined,
          slugGenerated: updatedCategory.slug
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Erreur lors de la mise à jour:', error);
      throw new HttpException(
        'Erreur lors de la mise à jour de la catégorie',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtenir l'historique des noms d'une catégorie
   * GET /categories/:id/history
   */
  @Get(':id/history')
  @UseGuards(AuthGuard, AdminGuard)
  async getCategoryHistory(@Param('id') id: number) {
    const category = await this.categoriesService.findOne(id);

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    const previousNames = category.previous_names
      ? JSON.parse(category.previous_names)
      : [];

    return {
      currentName: category.name,
      slug: category.slug,
      previousNames,
      version: category.version,
      lastUpdated: category.updated_at
    };
  }
}
```

---

### 5. Entity Mise à Jour

**Fichier :** `category.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'int', nullable: true })
  @Index()
  parentId?: number;

  @Column({ type: 'int', default: 0 })
  level: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'text', nullable: true })
  previous_names?: string; // JSON array

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by?: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  // Relations
  @ManyToOne(() => Category, category => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Category;

  @OneToMany(() => Category, category => category.parent)
  children?: Category[];
}
```

---

## 🎨 Frontend - Adaptation

### 1. Mise à Jour du Type Category

**Fichier :** `src/schemas/category.schema.ts`

```typescript
import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Le nom de la catégorie ne peut pas être vide"),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  parentId: z.number().optional().nullable(),
  level: z.number().optional().default(0),
  order: z.number().optional().default(0),
  previous_names: z.string().optional(), // JSON string
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  updated_by: z.number().optional(),
  version: z.number().optional(),
});

export type Category = Omit<z.infer<typeof CategorySchema>, 'name'> & { name: string };
```

### 2. Mise à Jour de l'API Service

**Fichier :** `src/services/api.ts`

```typescript
export const updateCategory = async (
  id: number,
  categoryData: {
    name?: string;
    description?: string;
    imageUrl?: string;
    parentId?: number | null;
    order?: number;
  }
): Promise<Category> => {
  try {
    const response: AxiosResponse<any> = await axios.put(
      `${API_URL}/categories/${id}`,
      categoryData
    );

    const categoryResponse = response.data.category || response.data;
    return CategorySchema.parse(categoryResponse);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Nouvelle fonction pour récupérer l'historique
export const getCategoryHistory = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/categories/${id}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching category history:', error);
    throw error;
  }
};
```

### 3. Modal d'Édition Amélioré

**Fichier :** `src/pages/CategoryManagement.tsx` (ajout)

```typescript
// Ajouter un état pour la sélection du parent
const [editParentId, setEditParentId] = useState<number | null>(null);

const openEditModal = (category: Category) => {
  setCurrentCategory(category);
  setNewCategoryName(category.name);
  setNewCategoryDescription(category.description || '');
  setEditParentId(category.parentId || null);
  setIsEditModalOpen(true);
};

const handleEditCategory = async () => {
  if (!currentCategory || !newCategoryName.trim()) {
    toast.error('Le nom de la catégorie est obligatoire');
    return;
  }

  setIsEditing(true);
  try {
    const result = await updateCategory(currentCategory.id as number, {
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim(),
      parentId: editParentId
    });

    if (result) {
      setIsEditModalOpen(false);
      setCurrentCategory(null);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setEditParentId(null);

      // Rafraîchir les catégories
      await refreshData();

      toast.success('Catégorie modifiée', {
        description: result.slug
          ? `Slug généré: ${result.slug}`
          : 'La catégorie a été mise à jour avec succès'
      });
    }
  } finally {
    setIsEditing(false);
  }
};
```

---

## 🧪 Tests

### Test 1: Modification du nom

```bash
curl -X PUT http://localhost:3004/categories/21 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=session_id" \
  -d '{
    "name": "T-shirts Premium"
  }'
```

**Résultat attendu:**
- Nom mis à jour
- Slug généré: `t-shirts-premium`
- Ancien nom sauvegardé dans `previous_names`
- Produits toujours liés

### Test 2: Changement de hiérarchie

```bash
curl -X PUT http://localhost:3004/categories/21 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=session_id" \
  -d '{
    "parentId": 5
  }'
```

**Résultat attendu:**
- `parentId` mis à jour
- `level` recalculé automatiquement
- Produits toujours liés

### Test 3: Tentative de boucle infinie

```bash
curl -X PUT http://localhost:3004/categories/21 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=session_id" \
  -d '{
    "parentId": 21
  }'
```

**Résultat attendu:**
```json
{
  "statusCode": 409,
  "message": "Une catégorie ne peut pas être son propre parent",
  "error": "Conflict"
}
```

---

## 📊 Impact sur les Produits

### Les produits restent liés

```sql
-- Les produits ne sont PAS affectés par les modifications de catégories
SELECT p.id, p.name, p.categoryId, c.name as category_name, c.slug
FROM products p
INNER JOIN categories c ON p.categoryId = c.id
WHERE c.id = 21;
```

**Important:** Les produits sont liés par `categoryId` (clé primaire), pas par le nom ou le slug. Donc:
- ✅ Changement de nom → Produits toujours liés
- ✅ Changement de slug → Produits toujours liés
- ✅ Changement de hiérarchie → Produits toujours liés
- ⚠️ Suppression de catégorie → Gérer CASCADE ou SET NULL

---

## ✅ Checklist d'Implémentation

### Backend
- [ ] Ajouter colonnes `slug`, `previous_names`, `updated_by`, `version` à la table
- [ ] Créer `SlugService` pour la génération de slugs
- [ ] Implémenter `wouldCreateCycle()` pour éviter les boucles
- [ ] Mettre à jour `CategoriesService.update()`
- [ ] Ajouter endpoint `GET /categories/:id/history`
- [ ] Ajouter tests unitaires
- [ ] Tester avec Postman

### Frontend
- [ ] Mettre à jour `CategorySchema` avec nouveaux champs
- [ ] Modifier `updateCategory()` dans `api.ts`
- [ ] Ajouter sélection du parent dans le modal d'édition
- [ ] Implémenter `getCategoryHistory()`
- [ ] Afficher le slug généré dans les toasts
- [ ] Tester en local

---

## 🔒 Considérations de Sécurité

1. **Validation stricte** des `parentId` pour éviter les boucles
2. **Transactions SQL** pour les mises à jour complexes
3. **Permissions** : Seuls les admins peuvent modifier
4. **Audit trail** : Garder l'historique des changements
5. **Slugs uniques** : Éviter les conflits d'URL

---

## 📝 Notes Importantes

1. **Slugs automatiques**: Générés à partir du nom, peuvent être personnalisés
2. **SEO-friendly**: Les slugs facilitent le référencement
3. **Historique**: `previous_names` permet de tracker les changements
4. **Versionning**: `version` permet de gérer les conflits concurrents
5. **Produits préservés**: Les liens produit-catégorie ne sont JAMAIS cassés

---

**Guide complet pour une gestion professionnelle des catégories ! 🎉**
