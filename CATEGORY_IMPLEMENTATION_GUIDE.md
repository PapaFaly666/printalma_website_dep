# 📘 Guide Complet - Implémentation du Système de Catégories Hiérarchiques

**Version**: 2.0
**Date**: 2025-10-13
**Statut**: ✅ Production Ready

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Backend Réelle](#architecture-backend-réelle)
3. [Endpoints API - Documentation Complète](#endpoints-api)
4. [Interfaces TypeScript Frontend](#interfaces-typescript)
5. [Implémentation Frontend](#implémentation-frontend)
6. [Exemples d'utilisation](#exemples-dutilisation)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Vue d'ensemble

### Système Hiérarchique à 3 Niveaux

Le backend utilise un **modèle unifié** avec un seul modèle `Category` et des relations auto-référentielles :

```
Category (level: 0) → Vêtements
    ↓ parentId
Category (level: 1) → T-Shirts [parentId = 1]
    ↓ parentId
Category (level: 2) → Col V [parentId = 5]
```

### Relations avec les Produits

Les produits utilisent **3 Foreign Keys distinctes** :

```typescript
Product {
  categoryId: number;      // ID catégorie niveau 0
  subCategoryId: number;   // ID catégorie niveau 1
  variationId: number;     // ID catégorie niveau 2
}
```

---

## 🔧 Architecture Backend Réelle

### Modèle Prisma (Simplifié)

```prisma
model Category {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  level       Int       @default(0)  // 0, 1, ou 2
  parentId    Int?      @map("parent_id")

  // Relations auto-référentielles
  parent      Category?  @relation("CategoryToCategory", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryToCategory")

  // Relations avec produits (3 types distincts)
  productsAsCategory    Product[] @relation("ProductCategory")
  productsAsSubCategory Product[] @relation("ProductSubCategory")
  productsAsVariation   Product[] @relation("ProductVariation")
}

model Product {
  id            Int  @id @default(autoincrement())
  name          String

  // 🔑 Les 3 Foreign Keys
  categoryId    Int? @map("category_id")
  subCategoryId Int? @map("sub_category_id")
  variationId   Int? @map("variation_id")

  // Relations
  category      Category? @relation("ProductCategory", fields: [categoryId], references: [id])
  subCategory   Category? @relation("ProductSubCategory", fields: [subCategoryId], references: [id])
  variation     Category? @relation("ProductVariation", fields: [variationId], references: [id])
}
```

---

## 🌐 Endpoints API

### **GET /categories/hierarchy**

Récupère toute la hiérarchie des catégories avec leurs enfants.

**Request:**
```http
GET /categories/hierarchy HTTP/1.1
Host: localhost:3000
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Vêtements",
    "description": "Tous les vêtements",
    "level": 0,
    "parentId": null,
    "createdAt": "2025-10-13T10:00:00.000Z",
    "updatedAt": "2025-10-13T10:00:00.000Z",
    "children": [
      {
        "id": 5,
        "name": "T-Shirts",
        "description": "T-shirts pour tous",
        "level": 1,
        "parentId": 1,
        "createdAt": "2025-10-13T10:05:00.000Z",
        "updatedAt": "2025-10-13T10:05:00.000Z",
        "children": [
          {
            "id": 12,
            "name": "Col V",
            "description": "T-shirt avec col en V",
            "level": 2,
            "parentId": 5,
            "createdAt": "2025-10-13T10:10:00.000Z",
            "updatedAt": "2025-10-13T10:10:00.000Z",
            "children": []
          },
          {
            "id": 13,
            "name": "Col Rond",
            "description": "T-shirt avec col rond",
            "level": 2,
            "parentId": 5,
            "createdAt": "2025-10-13T10:15:00.000Z",
            "updatedAt": "2025-10-13T10:15:00.000Z",
            "children": []
          }
        ]
      }
    ]
  }
]
```

---

### **GET /categories/:id**

Récupère une catégorie spécifique avec ses enfants directs.

**Request:**
```http
GET /categories/5 HTTP/1.1
Host: localhost:3000
```

**Response:**
```json
{
  "id": 5,
  "name": "T-Shirts",
  "description": "T-shirts pour tous",
  "level": 1,
  "parentId": 1,
  "createdAt": "2025-10-13T10:05:00.000Z",
  "updatedAt": "2025-10-13T10:05:00.000Z",
  "children": [
    {
      "id": 12,
      "name": "Col V",
      "description": "T-shirt avec col en V",
      "level": 2,
      "parentId": 5
    },
    {
      "id": 13,
      "name": "Col Rond",
      "description": "T-shirt avec col rond",
      "level": 2,
      "parentId": 5
    }
  ],
  "parent": {
    "id": 1,
    "name": "Vêtements",
    "level": 0,
    "parentId": null
  }
}
```

---

### **POST /categories** 🔒 Admin

Crée une nouvelle catégorie (n'importe quel niveau).

**Request:**
```http
POST /categories HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Sweats",
  "description": "Sweats et hoodies confortables",
  "parentId": 1,
  "level": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 6,
    "name": "Sweats",
    "description": "Sweats et hoodies confortables",
    "level": 1,
    "parentId": 1,
    "createdAt": "2025-10-13T11:00:00.000Z",
    "updatedAt": "2025-10-13T11:00:00.000Z"
  }
}
```

**Validation Errors:**

**❌ Nom dupliqué au même niveau:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Une catégorie avec ce nom existe déjà à ce niveau",
  "error": "Conflict"
}
```

**❌ Parent inexistant:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "La catégorie parente n'existe pas",
  "error": "Not Found"
}
```

---

### **PATCH /categories/:id** 🔒 Admin

Met à jour une catégorie existante.

**Request:**
```http
PATCH /categories/5 HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "T-Shirts Premium",
  "description": "T-shirts de qualité supérieure"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Catégorie mise à jour avec succès",
  "data": {
    "id": 5,
    "name": "T-Shirts Premium",
    "description": "T-shirts de qualité supérieure",
    "level": 1,
    "parentId": 1,
    "createdAt": "2025-10-13T10:05:00.000Z",
    "updatedAt": "2025-10-13T12:00:00.000Z"
  }
}
```

---

### **DELETE /categories/:id** 🔒 Admin

Supprime une catégorie (uniquement si non utilisée).

**Request:**
```http
DELETE /categories/12 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <admin_token>
```

**Response (Succès):**
```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès"
}
```

**Response (Erreur - Catégorie utilisée):**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Impossible de supprimer: 5 produit(s) utilisent cette catégorie",
  "error": "Conflict",
  "details": {
    "productsCount": 5,
    "productIds": [101, 102, 103, 104, 105]
  }
}
```

**Response (Erreur - A des enfants):**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Impossible de supprimer: cette catégorie a 3 sous-catégorie(s)",
  "error": "Conflict",
  "details": {
    "childrenCount": 3
  }
}
```

---

### **GET /categories/admin/:id/usage** 🔒 Admin

Obtient les statistiques d'utilisation d'une catégorie.

**Request:**
```http
GET /categories/admin/1/usage HTTP/1.1
Host: localhost:3000
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categoryId": 1,
    "productsWithCategory": 15,
    "productsWithSubCategory": 8,
    "subcategoriesCount": 3,
    "variationsCount": 7
  }
}
```

---

### **POST /categories/admin/:id/reassign** 🔒 Admin

Réaffecte les produits avant suppression.

**Request:**
```http
POST /categories/admin/1/reassign HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "targetCategoryId": 2,
  "reassignType": "both",
  "reassignVariations": "keep"
}
```

**Parameters:**
- `targetCategoryId`: ID de la catégorie cible
- `reassignType`: `"category"` | `"subcategory"` | `"both"`
- `reassignVariations`: `"keep"` | `"null"` | `"map"`

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 15
  }
}
```

---

## 📦 Interfaces TypeScript

### Types de Base

```typescript
// types/category.types.ts

export interface Category {
  id: number;
  name: string;
  description?: string;
  level: number;           // 0 = parent, 1 = enfant, 2 = variation
  parentId: number | null;
  order?: number;
  productCount?: number;
  children?: Category[];
  parent?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: number | null;
  level?: number;
  order?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: number | null;
  order?: number;
}

export interface CategoryUsageResponse {
  success: true;
  data: {
    categoryId: number;
    productsWithCategory: number;
    productsWithSubCategory: number;
    subcategoriesCount: number;
    variationsCount: number;
  };
}

export interface ReassignPayload {
  targetCategoryId: number;
  reassignType: 'category' | 'subcategory' | 'both';
  reassignVariations?: 'keep' | 'null' | 'map';
  variationMap?: Array<{ from: number; to: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
  details?: any;
}
```

---

## 🔌 Service API Frontend

```typescript
// services/categoryAdminService.ts

const API_BASE = 'https://printalma-back-dep.onrender.com';

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as T;
}

/**
 * ✅ Récupère toute la hiérarchie des catégories
 * Endpoint: GET /categories/hierarchy
 */
export async function fetchCategoryHierarchy(): Promise<Category[]> {
  try {
    const response = await api<Category[]>('/categories/hierarchy');
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('❌ Erreur fetchCategoryHierarchy:', error);
    return [];
  }
}

/**
 * ✅ Récupère une catégorie par ID avec ses enfants
 * Endpoint: GET /categories/:id
 */
export async function fetchCategoryById(id: number): Promise<Category | null> {
  try {
    const response = await api<Category>(`/categories/${id}`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur fetchCategoryById(${id}):`, error);
    return null;
  }
}

/**
 * ✅ Crée une nouvelle catégorie
 * Endpoint: POST /categories
 */
export async function createCategory(
  dto: CreateCategoryDto
): Promise<ApiResponse<Category>> {
  try {
    const response = await api<ApiResponse<Category>>('/categories', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return response;
  } catch (error) {
    console.error('❌ Erreur createCategory:', error);
    throw error;
  }
}

/**
 * ✅ Met à jour une catégorie
 * Endpoint: PATCH /categories/:id
 */
export async function updateCategory(
  id: number,
  dto: UpdateCategoryDto
): Promise<ApiResponse<Category>> {
  try {
    const response = await api<ApiResponse<Category>>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return response;
  } catch (error) {
    console.error(`❌ Erreur updateCategory(${id}):`, error);
    throw error;
  }
}

/**
 * ✅ Supprime une catégorie
 * Endpoint: DELETE /categories/:id
 */
export async function deleteCategory(id: number): Promise<ApiResponse<void>> {
  try {
    const response = await api<ApiResponse<void>>(`/categories/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error(`❌ Erreur deleteCategory(${id}):`, error);
    throw error;
  }
}

/**
 * ✅ Obtient les statistiques d'utilisation d'une catégorie
 * Endpoint: GET /categories/admin/:id/usage
 */
export async function fetchCategoryUsage(
  id: number
): Promise<CategoryUsageResponse> {
  try {
    const response = await api<CategoryUsageResponse>(
      `/categories/admin/${id}/usage`
    );
    return response;
  } catch (error) {
    console.error(`❌ Erreur fetchCategoryUsage(${id}):`, error);
    throw error;
  }
}

/**
 * ✅ Réaffecte les produits d'une catégorie vers une autre
 * Endpoint: POST /categories/admin/:id/reassign
 */
export async function reassignCategory(
  id: number,
  payload: ReassignPayload
): Promise<ApiResponse<{ updated: number }>> {
  try {
    const response = await api<ApiResponse<{ updated: number }>>(
      `/categories/admin/${id}/reassign`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return response;
  } catch (error) {
    console.error(`❌ Erreur reassignCategory(${id}):`, error);
    throw error;
  }
}

/**
 * ✅ Récupère les enfants directs d'une catégorie
 * Endpoint: GET /categories/:id -> response.children
 */
export async function fetchCategoryChildren(
  categoryId: number
): Promise<ApiResponse<Category[]>> {
  try {
    console.log(`🔄 Chargement des enfants de la catégorie ${categoryId}...`);

    const response = await api<Category>(`/categories/${categoryId}`);
    const children = response.children || [];

    console.log(`✅ ${children.length} enfant(s) trouvé(s) pour catégorie ${categoryId}`);

    return {
      success: true,
      data: children,
    };
  } catch (error) {
    console.error(`❌ Erreur fetchCategoryChildren(${categoryId}):`, error);
    return { success: false, data: [] };
  }
}

/**
 * ✅ Récupère les variations (level 2) d'une sous-catégorie
 * Endpoint: GET /categories/:id -> response.children.filter(level === 2)
 */
export async function fetchCategoryVariations(
  categoryId: number
): Promise<ApiResponse<Category[]>> {
  try {
    console.log(`🔄 Chargement des variations de la catégorie ${categoryId}...`);

    const response = await api<Category>(`/categories/${categoryId}`);

    // Filtrer uniquement les enfants de level 2 (variations)
    const variations = (response.children || []).filter(
      (child) => child.level === 2
    );

    console.log(`✅ ${variations.length} variation(s) trouvée(s) pour catégorie ${categoryId}`);

    return {
      success: true,
      data: variations,
    };
  } catch (error) {
    console.error(`❌ Erreur fetchCategoryVariations(${categoryId}):`, error);
    return { success: false, data: [] };
  }
}
```

---

## 💡 Exemples d'utilisation

### 1. Charger la hiérarchie complète

```typescript
import { fetchCategoryHierarchy } from '../services/categoryAdminService';

const MyComponent = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategoryHierarchy();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Erreur lors du chargement des catégories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <CategoryTree categories={categories} />
      )}
    </div>
  );
};
```

### 2. Créer une catégorie avec sous-catégories

```typescript
// Créer catégorie racine (level 0)
const rootCategory = await createCategory({
  name: 'Accessoires',
  description: 'Tous les accessoires',
  parentId: null,
  level: 0,
});

console.log('Catégorie créée:', rootCategory.data);

// Créer sous-catégorie (level 1)
const subCategory = await createCategory({
  name: 'Sacs',
  description: 'Sacs à dos et sacs à main',
  parentId: rootCategory.data.id,
  level: 1,
});

console.log('Sous-catégorie créée:', subCategory.data);

// Créer variation (level 2)
const variation = await createCategory({
  name: 'Sac à dos 15L',
  description: 'Petit sac à dos pour la ville',
  parentId: subCategory.data.id,
  level: 2,
});

console.log('Variation créée:', variation.data);
```

### 3. Sélecteur hiérarchique pour formulaire produit

```typescript
const ProductCategorySelector = ({ onCategorySelect }) => {
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<number | null>(null);
  const [variationId, setVariationId] = useState<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [variations, setVariations] = useState<Category[]>([]);

  const [loading, setLoading] = useState({
    categories: false,
    subCategories: false,
    variations: false,
  });

  // Charger catégories niveau 0
  useEffect(() => {
    const load = async () => {
      setLoading((prev) => ({ ...prev, categories: true }));
      const data = await fetchCategoryHierarchy();
      setCategories(data.filter((c) => c.level === 0));
      setLoading((prev) => ({ ...prev, categories: false }));
    };
    load();
  }, []);

  // Charger sous-catégories quand catégorie sélectionnée
  useEffect(() => {
    if (!categoryId) {
      setSubCategories([]);
      setVariations([]);
      return;
    }

    const load = async () => {
      setLoading((prev) => ({ ...prev, subCategories: true }));
      const response = await fetchCategoryChildren(categoryId);
      setSubCategories(response.data || []);
      setLoading((prev) => ({ ...prev, subCategories: false }));
    };
    load();
  }, [categoryId]);

  // Charger variations quand sous-catégorie sélectionnée
  useEffect(() => {
    if (!subCategoryId) {
      setVariations([]);
      return;
    }

    const load = async () => {
      setLoading((prev) => ({ ...prev, variations: true }));
      const response = await fetchCategoryVariations(subCategoryId);
      setVariations(response.data || []);
      setLoading((prev) => ({ ...prev, variations: false }));
    };
    load();
  }, [subCategoryId]);

  const handleCategoryChange = (id: number | null) => {
    setCategoryId(id);
    setSubCategoryId(null);
    setVariationId(null);
    onCategorySelect({ categoryId: id, subCategoryId: null, variationId: null });
  };

  const handleSubCategoryChange = (id: number | null) => {
    setSubCategoryId(id);
    setVariationId(null);
    onCategorySelect({ categoryId, subCategoryId: id, variationId: null });
  };

  const handleVariationChange = (id: number | null) => {
    setVariationId(id);
    onCategorySelect({ categoryId, subCategoryId, variationId: id });
  };

  return (
    <div className="space-y-4">
      {/* Catégorie (niveau 0) */}
      <div>
        <label className="block mb-2 font-medium">Catégorie principale *</label>
        <select
          value={categoryId || ''}
          onChange={(e) => handleCategoryChange(e.target.value ? Number(e.target.value) : null)}
          disabled={loading.categories}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Sélectionner --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sous-catégorie (niveau 1) */}
      {categoryId && (
        <div>
          <label className="block mb-2 font-medium">Sous-catégorie</label>
          <select
            value={subCategoryId || ''}
            onChange={(e) => handleSubCategoryChange(e.target.value ? Number(e.target.value) : null)}
            disabled={loading.subCategories}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Aucune --</option>
            {subCategories.map((sub) => (
              <option key={sub.id} value={sub.