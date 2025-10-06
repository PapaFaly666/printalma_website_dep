# Guide Backend - Endpoint de Mise à Jour des Catégories (404 Not Found)

## 🐛 Problème Identifié

Lors de la modification d'une catégorie dans l'interface admin, l'erreur suivante apparaît :

```
PUT http://localhost:3004/categories/21 404 (Not Found)
AxiosError: Request failed with status code 404
```

**Cause :** L'endpoint `PUT /categories/:id` n'existe pas ou n'est pas accessible côté backend.

---

## 📋 Analyse de l'Erreur

### Frontend (ce qui est envoyé)

**Fichier :** `src/services/api.ts:422`

```typescript
export const updateCategory = async (id: number, categoryData: Omit<Category, 'id'>): Promise<Category> => {
  try {
    const response: AxiosResponse<Category> = await axios.put(`${API_URL}/categories/${id}`, categoryData);
    return CategorySchema.parse(response.data);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};
```

**Fichier :** `src/contexts/CategoryContext.tsx:101`

```typescript
const editCategory = async (id: number, name: string, description?: string): Promise<Category | null> => {
  try {
    const updatedCategory = await updateCategory(id, {
      name: name.trim(),
      description: description?.trim()
    });

    // Mise à jour du state local
    setCategories(prev =>
      prev.map(cat => cat.id === id ? updatedCategory : cat)
    );

    toast.success('Catégorie modifiée');
    return updatedCategory;
  } catch (err) {
    console.error('Error updating category:', err);
    toast.error('Impossible de modifier la catégorie');
    return null;
  }
};
```

**Données envoyées :**
```json
{
  "name": "Nouveau nom de catégorie",
  "description": "Description optionnelle"
}
```

---

## 🔧 Solution Backend

### 1. Créer l'Endpoint de Mise à Jour

**Endpoint requis :** `PUT /categories/:id`

**Fichier Backend :** `categories.controller.ts` (ou équivalent)

```typescript
import { Controller, Put, Param, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Mettre à jour une catégorie existante
   * PUT /categories/:id
   */
  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard) // Protection admin
  async updateCategory(
    @Param('id') id: number,
    @Body() updateData: UpdateCategoryDto
  ) {
    try {
      // Vérifier que la catégorie existe
      const category = await this.categoriesService.findOne(id);

      if (!category) {
        throw new HttpException('Catégorie non trouvée', HttpStatus.NOT_FOUND);
      }

      // Vérifier que le nouveau nom n'est pas déjà utilisé (si le nom a changé)
      if (updateData.name && updateData.name !== category.name) {
        const existingCategory = await this.categoriesService.findByName(updateData.name);

        if (existingCategory && existingCategory.id !== id) {
          throw new HttpException(
            'Une catégorie avec ce nom existe déjà',
            HttpStatus.CONFLICT
          );
        }
      }

      // Mettre à jour la catégorie
      const updatedCategory = await this.categoriesService.update(id, {
        name: updateData.name?.trim(),
        description: updateData.description?.trim()
      });

      return {
        success: true,
        message: 'Catégorie mise à jour avec succès',
        category: updatedCategory
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la mise à jour de la catégorie',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
```

---

### 2. Créer le DTO de Validation

**Fichier Backend :** `update-category.dto.ts`

```typescript
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

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
}
```

---

### 3. Implémenter le Service

**Fichier Backend :** `categories.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ) {}

  /**
   * Trouver une catégorie par ID
   */
  async findOne(id: number): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { id }
    });
  }

  /**
   * Trouver une catégorie par nom
   */
  async findByName(name: string): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { name }
    });
  }

  /**
   * Mettre à jour une catégorie
   */
  async update(
    id: number,
    updateData: Partial<Category>
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    // Mettre à jour les champs fournis
    Object.assign(category, updateData);

    // Sauvegarder dans la base de données
    return await this.categoryRepository.save(category);
  }
}
```

---

### 4. Structure de l'Entity

**Fichier Backend :** `category.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  parentId?: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Category;

  @OneToMany(() => Category, category => category.parent)
  children?: Category[];
}
```

---

## 🧪 Tests de l'Endpoint

### Test avec cURL

```bash
# Mettre à jour une catégorie
curl -X PUT http://localhost:3004/categories/21 \
  -H "Content-Type: application/json" \
  -H "Cookie: votre_cookie_session" \
  -d '{
    "name": "Nouveau nom",
    "description": "Nouvelle description"
  }'
```

### Test avec Postman

**Méthode :** `PUT`
**URL :** `http://localhost:3004/categories/21`
**Headers :**
```
Content-Type: application/json
Cookie: connect.sid=votre_session_id
```

**Body (JSON) :**
```json
{
  "name": "Coques de téléphone",
  "description": "Catégorie pour les coques de protection"
}
```

**Réponse attendue (200 OK) :**
```json
{
  "success": true,
  "message": "Catégorie mise à jour avec succès",
  "category": {
    "id": 21,
    "name": "Coques de téléphone",
    "description": "Catégorie pour les coques de protection",
    "parentId": null
  }
}
```

---

## 🔒 Sécurité et Permissions

### Guards Requis

```typescript
@Put(':id')
@UseGuards(AuthGuard, AdminGuard) // Seuls les admins peuvent modifier
async updateCategory(@Param('id') id: number, @Body() updateData: UpdateCategoryDto) {
  // ...
}
```

### Vérifications Nécessaires

1. ✅ **Authentification** : L'utilisateur est-il connecté ?
2. ✅ **Autorisation** : L'utilisateur est-il admin ?
3. ✅ **Existence** : La catégorie existe-t-elle ?
4. ✅ **Unicité** : Le nouveau nom n'est-il pas déjà utilisé ?
5. ✅ **Validation** : Les données sont-elles valides ?
6. ✅ **Intégrité** : La modification ne casse-t-elle pas les relations ?

---

## 🚨 Cas d'Erreur à Gérer

### 1. Catégorie Non Trouvée (404)

```typescript
if (!category) {
  throw new HttpException('Catégorie non trouvée', HttpStatus.NOT_FOUND);
}
```

**Réponse :**
```json
{
  "statusCode": 404,
  "message": "Catégorie non trouvée",
  "error": "Not Found"
}
```

### 2. Nom Déjà Utilisé (409)

```typescript
if (existingCategory && existingCategory.id !== id) {
  throw new HttpException(
    'Une catégorie avec ce nom existe déjà',
    HttpStatus.CONFLICT
  );
}
```

**Réponse :**
```json
{
  "statusCode": 409,
  "message": "Une catégorie avec ce nom existe déjà",
  "error": "Conflict"
}
```

### 3. Données Invalides (400)

```typescript
// Automatique avec class-validator
```

**Réponse :**
```json
{
  "statusCode": 400,
  "message": ["Le nom doit contenir au moins 2 caractères"],
  "error": "Bad Request"
}
```

### 4. Non Autorisé (403)

```typescript
@UseGuards(AuthGuard, AdminGuard)
```

**Réponse :**
```json
{
  "statusCode": 403,
  "message": "Accès interdit",
  "error": "Forbidden"
}
```

---

## 📊 SQL Query Générée

```sql
-- Trouver la catégorie
SELECT * FROM categories WHERE id = 21;

-- Vérifier l'unicité du nom (si modifié)
SELECT * FROM categories WHERE name = 'Nouveau nom' AND id != 21;

-- Mettre à jour
UPDATE categories
SET
  name = 'Nouveau nom',
  description = 'Nouvelle description'
WHERE id = 21;

-- Retourner la catégorie mise à jour
SELECT * FROM categories WHERE id = 21;
```

---

## 🔄 Endpoints Relatifs aux Catégories

Voici tous les endpoints qui devraient exister pour une gestion complète :

| Méthode | Endpoint | Description | Status |
|---------|----------|-------------|--------|
| GET | `/categories` | Liste toutes les catégories | ✅ Existe |
| GET | `/categories/hierarchy` | Hiérarchie des catégories | ✅ Existe |
| GET | `/categories/:id` | Détails d'une catégorie | ⚠️ À vérifier |
| POST | `/categories` | Créer une catégorie | ✅ Existe |
| POST | `/categories/structure` | Créer structure complète | ✅ Existe |
| **PUT** | **`/categories/:id`** | **Mettre à jour une catégorie** | ❌ **MANQUANT** |
| DELETE | `/categories/:id` | Supprimer une catégorie | ✅ Existe |

---

## ✅ Checklist d'Implémentation Backend

- [ ] Créer `update-category.dto.ts` avec validation
- [ ] Implémenter `updateCategory()` dans le service
- [ ] Créer l'endpoint `PUT /categories/:id` dans le controller
- [ ] Ajouter les guards d'authentification et d'autorisation
- [ ] Gérer les cas d'erreur (404, 409, 400, 403)
- [ ] Vérifier l'unicité du nom lors de la modification
- [ ] Tester l'endpoint avec Postman/cURL
- [ ] Vérifier que le frontend fonctionne correctement
- [ ] Ajouter des logs pour le debugging
- [ ] Documenter l'endpoint dans l'API

---

## 🔍 Debugging

### Logs Backend Recommandés

```typescript
@Put(':id')
async updateCategory(@Param('id') id: number, @Body() updateData: UpdateCategoryDto) {
  console.log('🔄 [UPDATE CATEGORY] ID:', id);
  console.log('🔄 [UPDATE CATEGORY] Data:', updateData);

  try {
    const result = await this.categoriesService.update(id, updateData);
    console.log('✅ [UPDATE CATEGORY] Success:', result);
    return result;
  } catch (error) {
    console.error('❌ [UPDATE CATEGORY] Error:', error);
    throw error;
  }
}
```

### Vérifier les Routes Enregistrées

Lors du démarrage du serveur NestJS, vérifiez que la route est bien enregistrée :

```
[Nest] 12345  - 02/10/2025, 3:30:00 PM     LOG [RouterExplorer] Mapped {/categories/:id, PUT} route
```

---

## 📝 Notes Importantes

1. **Ordre des routes** : Assurez-vous que `PUT /categories/:id` est défini APRÈS les routes spécifiques comme `/categories/hierarchy`

2. **TypeORM Relations** : Si vous modifiez le `parentId`, assurez-vous que les relations sont correctement mises à jour

3. **Cache** : Si vous utilisez du cache, pensez à l'invalider après la mise à jour

4. **Transactions** : Pour des mises à jour complexes, utilisez des transactions :

```typescript
async update(id: number, updateData: Partial<Category>): Promise<Category> {
  return await this.categoryRepository.manager.transaction(async manager => {
    // Opérations de mise à jour
    return await manager.save(Category, updatedCategory);
  });
}
```

5. **⚠️ Format de Réponse Important** : Le backend DOIT retourner la catégorie dans le bon format :

```typescript
// ✅ CORRECT - Format recommandé (géré automatiquement par le frontend)
return {
  success: true,
  message: 'Catégorie mise à jour avec succès',
  category: updatedCategory  // ← La catégorie doit être dans "category"
};

// ✅ AUSSI CORRECT - Retour direct de la catégorie
return updatedCategory;

// ❌ INCORRECT - Causera une erreur Zod
return {
  success: true,
  data: updatedCategory  // ← "data" au lieu de "category"
};
```

**Note :** Le frontend (`src/services/api.ts`) a été mis à jour pour accepter les deux formats :
- `{ success, message, category }` (format recommandé)
- Retour direct de l'objet catégorie

---

## 🚀 Après l'Implémentation

Une fois l'endpoint implémenté, le frontend devrait fonctionner automatiquement car le code est déjà en place dans :

- ✅ `src/services/api.ts` - Appel API
- ✅ `src/contexts/CategoryContext.tsx` - Gestion du state
- ✅ `src/pages/CategoryManagement.tsx` - Interface utilisateur

**Test Frontend :**
1. Aller sur `/admin/categories`
2. Cliquer sur "Actions" → "Modifier" pour une catégorie
3. Changer le nom
4. Cliquer sur "Enregistrer"
5. Vérifier que la modification est bien appliquée

---

## 🐛 Troubleshooting - Erreurs Courantes

### Erreur Zod : "Required" sur le champ "name"

**Erreur :**
```
ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": ["name"],
    "message": "Required"
  }
]
```

**Cause :** Le backend retourne un format de réponse incompatible avec le schéma Zod du frontend.

**Solution :**

1. **Vérifier le format de réponse du backend** avec les DevTools réseau :
   - Ouvrir les DevTools (F12)
   - Onglet "Network"
   - Filtrer "XHR"
   - Cliquer sur la requête `PUT /categories/:id`
   - Vérifier la réponse dans l'onglet "Response"

2. **Format attendu :** Le backend doit retourner soit :
   ```json
   {
     "success": true,
     "message": "Catégorie mise à jour avec succès",
     "category": {
       "id": 21,
       "name": "Nouveau nom",
       "description": "Description",
       "parentId": null
     }
   }
   ```

   OU directement :
   ```json
   {
     "id": 21,
     "name": "Nouveau nom",
     "description": "Description",
     "parentId": null
   }
   ```

3. **Fix Frontend :** Le code dans `src/services/api.ts` a déjà été corrigé pour gérer les deux formats.

4. **Fix Backend :** Assurez-vous que votre controller retourne bien `category: updatedCategory` et pas `data: updatedCategory`.

---

## 📞 Support

Si l'erreur persiste après l'implémentation :

1. Vérifier les logs du backend
2. Vérifier que l'endpoint est bien enregistré
3. Tester l'endpoint directement avec Postman
4. Vérifier les permissions utilisateur
5. Vérifier la configuration CORS
6. Vérifier le format de réponse dans les DevTools (Network)
7. Vérifier que la catégorie existe bien dans la base de données

**Bonne implémentation ! 🎉**
