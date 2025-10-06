# 🔗 Intégration Frontend-Backend - Gestion des Catégories

Ce document explique comment le frontend React se connecte au backend NestJS pour gérer les catégories hiérarchiques (Parent → Sous-catégorie → Variation).

---

## 📋 Vue d'ensemble

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  CategoryManagement.tsx (UI)                           │  │
│  │  ↓                                                      │  │
│  │  CategoryContext.tsx (État global + Appels API)       │  │
│  │  ↓                                                      │  │
│  │  src/services/api.ts (HTTP requests)                  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP REST API
                            │ http://localhost:3004/categories
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     BACKEND (NestJS)                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  categories.controller.ts (Routes)                     │  │
│  │  ↓                                                      │  │
│  │  categories.service.ts (Logique métier)              │  │
│  │  ↓                                                      │  │
│  │  Prisma ORM → PostgreSQL Database                     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Base URL

```typescript
// src/config/api.ts
export const API_BASE_URL = 'http://localhost:3004';
```

### Fichiers modifiés/créés

| Fichier | Description | Statut |
|---------|-------------|--------|
| `src/contexts/CategoryContext.tsx` | Gestion d'état + Appels API | ✅ Modifié |
| `src/pages/CategoryManagement.tsx` | Interface utilisateur | ✅ Modifié |
| `src/services/api.ts` | Fonctions HTTP de base | ✅ Existant |

---

## 📡 Endpoints utilisés par le frontend

### 1. **GET `/categories`** - Lister toutes les catégories

**Frontend (CategoryContext.tsx):**

```typescript
const refreshCategories = async () => {
  setLoading(true);
  setError(null);

  try {
    // Appel de l'API backend
    const data = await fetchCategories();
    setCategories(data);
    return data;
  } catch (err) {
    console.error('Error loading categories:', err);
    setError('Impossible de charger les catégories.');
    return [];
  } finally {
    setLoading(false);
  }
};
```

**Quand est-ce appelé:**
- Au chargement de la page `CategoryManagement`
- Après création/modification/suppression d'une catégorie
- Clic sur le bouton "Actualiser"

**Réponse backend attendue:**

```json
[
  {
    "id": 1,
    "name": "Téléphone",
    "description": "Accessoires téléphone",
    "parentId": null,
    "level": 0,
    "order": 0,
    "createdAt": "2025-09-30T10:00:00.000Z",
    "updatedAt": "2025-09-30T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Coque",
    "description": "Sous-catégorie de Téléphone",
    "parentId": 1,
    "level": 1,
    "order": 0
  }
]
```

---

### 2. **POST `/categories/structure`** - Créer une structure complète

**Frontend (CategoryContext.tsx):**

```typescript
const createCategoryStructure = async (data: {
  parentName: string;
  parentDescription?: string;
  childName?: string;
  variations: string[];
}) => {
  try {
    const response = await fetch('http://localhost:3004/categories/structure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création de la structure');
    }

    const result = await response.json();

    // Rafraîchir les catégories après création
    await refreshCategories();

    return {
      success: result.success,
      createdCount: result.createdCount,
      skippedVariations: result.skippedVariations || []
    };
  } catch (err) {
    console.error('Error creating structure:', err);
    throw err;
  }
};
```

**Utilisé dans (CategoryManagement.tsx):**

```typescript
const handleAddCategory = async () => {
  if (!newCategoryName.trim()) {
    toast.error('Le nom de la catégorie parent est obligatoire');
    return;
  }

  setIsAdding(true);
  try {
    // Appel de l'endpoint /structure
    const result = await createCategoryStructure({
      parentName: newCategoryName.trim(),
      parentDescription: newCategoryDescription.trim(),
      childName: newCategoryChild.trim() || undefined,
      variations: newCategoryVariations.filter(v => v.trim())
    });

    // Fermeture du modal
    setIsAddModalOpen(false);

    // Notifications utilisateur
    if (result.createdCount > 0) {
      toast.success(`Structure créée ! ${result.createdCount} élément(s) ajouté(s).`);
    } else {
      toast.success('Catégories existantes utilisées avec succès !');
    }

    if (result.skippedVariations.length > 0) {
      toast.warning('Variations existantes ignorées', {
        description: `${result.skippedVariations.join(', ')}`
      });
    }
  } catch (error) {
    toast.error('Erreur lors de la création');
  } finally {
    setIsAdding(false);
  }
};
```

**Requête envoyée:**

```json
{
  "parentName": "Téléphone",
  "parentDescription": "Accessoires de téléphone",
  "childName": "Coque",
  "variations": ["iPhone 13", "iPhone 14", "iPhone 15"]
}
```

**Réponse backend attendue:**

```json
{
  "success": true,
  "createdCount": 5,
  "skippedVariations": [],
  "message": "Structure créée avec succès ! 5 nouveau(x) élément(s) ajouté(s).",
  "data": {
    "parent": {
      "id": 1,
      "name": "Téléphone",
      "level": 0
    },
    "child": {
      "id": 2,
      "name": "Coque",
      "level": 1,
      "parentId": 1
    },
    "totalVariations": 3,
    "createdVariations": 3
  }
}
```

---

### 3. **POST `/categories`** - Créer une catégorie simple

**Frontend (CategoryContext.tsx):**

```typescript
const addCategory = async (name: string, description?: string, parentId?: number) => {
  try {
    const newCategory = await createCategory({
      name: name.trim(),
      description: description?.trim(),
      parentId: parentId || null,
      level: parentId ? 1 : 0,
      order: 0
    });

    setCategories(prev => [...prev, newCategory]);
    toast.success('Catégorie ajoutée');

    return newCategory;
  } catch (err: any) {
    // Gérer l'erreur de doublon (409)
    if (err.response?.status === 409) {
      toast.warning('Catégorie existante', {
        description: 'Cette catégorie existe déjà et sera utilisée.'
      });
      return err.response?.data?.message?.existingCategory || null;
    }

    toast.error('Erreur lors de l\'ajout');
    return null;
  }
};
```

**Requête envoyée:**

```json
{
  "name": "iPhone 16",
  "description": "Variation de Coque",
  "parentId": 2,
  "level": 2,
  "order": 0
}
```

**Réponse backend (succès):**

```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 10,
    "name": "iPhone 16",
    "description": "Variation de Coque",
    "parentId": 2,
    "level": 2,
    "order": 0,
    "createdAt": "2025-09-30T11:00:00.000Z",
    "updatedAt": "2025-09-30T11:00:00.000Z"
  }
}
```

**Réponse backend (doublon - 409):**

```json
{
  "statusCode": 409,
  "message": {
    "success": false,
    "error": "DUPLICATE_CATEGORY",
    "message": "La catégorie \"iPhone 16\" existe déjà dans cette catégorie parent",
    "existingCategory": {
      "id": 10,
      "name": "iPhone 16",
      "parentId": 2
    }
  }
}
```

---

### 4. **PATCH `/categories/:id`** - Modifier une catégorie

**Frontend (CategoryContext.tsx):**

```typescript
const editCategory = async (id: number, name: string, description?: string) => {
  try {
    const updatedCategory = await updateCategory(id, {
      name: name.trim(),
      description: description?.trim()
    });

    setCategories(prev =>
      prev.map(cat => cat.id === id ? updatedCategory : cat)
    );

    toast.success('Catégorie modifiée');

    return updatedCategory;
  } catch (err) {
    toast.error('Erreur lors de la modification');
    return null;
  }
};
```

**Requête envoyée:**

```json
{
  "name": "iPhone 16 Pro",
  "description": "Variation de Coque - Mise à jour"
}
```

**Réponse backend attendue:**

```json
{
  "id": 10,
  "name": "iPhone 16 Pro",
  "description": "Variation de Coque - Mise à jour",
  "parentId": 2,
  "level": 2,
  "order": 0,
  "createdAt": "2025-09-30T11:00:00.000Z",
  "updatedAt": "2025-09-30T12:00:00.000Z"
}
```

---

### 5. **DELETE `/categories/:id`** - Supprimer une catégorie

**Frontend (CategoryContext.tsx):**

```typescript
const removeCategory = async (id: number) => {
  try {
    await deleteCategory(id);

    setCategories(prev => prev.filter(cat => cat.id !== id));

    return true;
  } catch (err: any) {
    // Gérer l'erreur de produits liés (400)
    if (err.response?.status === 400) {
      toast.error('Suppression impossible', {
        description: err.response?.data?.message || 'Cette catégorie contient des produits.'
      });
    } else {
      toast.error('Erreur lors de la suppression');
    }
    return false;
  }
};
```

**Réponse backend (succès):**

```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès",
  "deletedCount": 5
}
```

**Réponse backend (produits liés - 400):**

```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer la catégorie car elle (ou ses sous-catégories) est liée à 10 produit(s). Veuillez d'abord supprimer ou déplacer ces produits vers une autre catégorie."
}
```

---

## 🎯 Flux complet : Création d'une structure

### Scénario utilisateur

1. L'utilisateur ouvre le modal "Nouvelle catégorie"
2. Il remplit :
   - Catégorie parent: "Téléphone"
   - Sous-catégorie: "Coque"
   - Variations: "iPhone 13", "iPhone 14", "iPhone 15"
3. Il clique sur "Créer"

### Flux technique

```
┌─────────────────────────────────────────────────────────────┐
│  1. FRONTEND - Modal de création                            │
│     → handleAddCategory()                                    │
│     → Validation : newCategoryName != empty                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. FRONTEND - CategoryContext                              │
│     → createCategoryStructure({                             │
│         parentName: "Téléphone",                            │
│         childName: "Coque",                                 │
│         variations: ["iPhone 13", "iPhone 14", "iPhone 15"]│
│       })                                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ POST /categories/structure
                     │ Content-Type: application/json
                     │ Body: { parentName, childName, variations }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. BACKEND - categories.controller.ts                      │
│     → @Post('/structure')                                   │
│     → validateDto(CreateStructureDto)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. BACKEND - categories.service.ts                         │
│     → createCategoryStructure()                             │
│                                                              │
│     A) Vérifier "Téléphone" existe ?                        │
│        → NON: Créer parent (createdCount++)                │
│        → OUI: Utiliser existant                             │
│                                                              │
│     B) Vérifier "Coque" existe dans "Téléphone" ?         │
│        → NON: Créer enfant (createdCount++)                │
│        → OUI: Utiliser existant                             │
│                                                              │
│     C) Pour chaque variation:                               │
│        - Vérifier si existe dans "Coque"                   │
│        - NON: Créer (createdCount++)                       │
│        - OUI: Ajouter à skippedVariations[]                │
│                                                              │
│     D) Retourner:                                           │
│        {                                                     │
│          success: true,                                     │
│          createdCount: 5,                                   │
│          skippedVariations: []                              │
│        }                                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 201 Created
                     │ JSON Response
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. FRONTEND - CategoryContext                              │
│     → Reçoit la réponse                                     │
│     → refreshCategories() // Rafraîchir la liste           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. FRONTEND - CategoryManagement                           │
│     → Fermer le modal                                       │
│     → Réinitialiser le formulaire                          │
│     → toast.success("5 éléments créés !")                  │
│     → Tableau mis à jour automatiquement                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Gestion des erreurs

### Erreurs HTTP gérées

| Code | Signification | Message utilisateur | Action frontend |
|------|---------------|---------------------|-----------------|
| **409** | Conflict | "Catégorie existante" | Toast warning + réutilise |
| **400** | Bad Request | "Produits liés - impossible de supprimer" | Toast error avec détails |
| **404** | Not Found | "Catégorie introuvable" | Toast error |
| **401** | Unauthorized | "Session expirée" | Redirection login |
| **500** | Server Error | "Erreur serveur" | Toast error générique |

### Exemple de gestion d'erreur

```typescript
try {
  const result = await createCategoryStructure({ ... });
} catch (error: any) {
  // Erreur de doublon (409)
  if (error.response?.status === 409) {
    toast.warning('Catégorie existante', {
      description: 'Cette catégorie existe déjà et sera utilisée.'
    });
    return error.response?.data?.message?.existingCategory;
  }

  // Erreur de validation (400)
  if (error.response?.status === 400) {
    toast.error('Données invalides', {
      description: error.response?.data?.message
    });
    return null;
  }

  // Erreur générique
  toast.error('Une erreur est survenue', {
    description: error.message || 'Veuillez réessayer'
  });
  return null;
}
```

---

## 📊 Mise à jour de l'état local

### Stratégies de mise à jour

#### 1. **Mise à jour optimiste** (création simple)

```typescript
// Ajouter directement à l'état local
const newCategory = await createCategory({ ... });
setCategories(prev => [...prev, newCategory]);
```

#### 2. **Rafraîchissement complet** (structure complexe)

```typescript
// Créer la structure
await createCategoryStructure({ ... });

// Rafraîchir toutes les catégories
await refreshCategories();
```

#### 3. **Mise à jour par remplacement** (modification)

```typescript
// Modifier la catégorie
const updated = await updateCategory(id, { ... });

// Remplacer dans l'état local
setCategories(prev =>
  prev.map(cat => cat.id === id ? updated : cat)
);
```

#### 4. **Suppression par filtrage** (suppression)

```typescript
// Supprimer la catégorie
await deleteCategory(id);

// Filtrer l'état local
setCategories(prev => prev.filter(cat => cat.id !== id));
```

---

## 🎨 Notifications utilisateur (Toasts)

### Types de notifications

```typescript
// ✅ Succès
toast.success('Structure créée avec succès !', {
  description: '5 éléments ajoutés'
});

// ⚠️ Avertissement
toast.warning('Variations existantes ignorées', {
  description: 'iPhone 13, iPhone 14'
});

// ❌ Erreur
toast.error('Suppression impossible', {
  description: 'Cette catégorie contient 10 produits'
});

// ℹ️ Information
toast.info('Catégorie existante', {
  description: 'La catégorie sera réutilisée'
});
```

---

## 🧪 Tests d'intégration

### Test 1: Créer une structure complète

```typescript
// Données de test
const testData = {
  parentName: 'Test Parent',
  childName: 'Test Child',
  variations: ['Var1', 'Var2', 'Var3']
};

// Appel
const result = await createCategoryStructure(testData);

// Vérifications
expect(result.success).toBe(true);
expect(result.createdCount).toBe(5); // 1 parent + 1 child + 3 variations
expect(result.skippedVariations).toEqual([]);
```

### Test 2: Détecter les doublons

```typescript
// Première création
await createCategoryStructure({
  parentName: 'Parent',
  variations: ['Var1', 'Var2']
});

// Deuxième création avec doublons
const result = await createCategoryStructure({
  parentName: 'Parent',
  variations: ['Var1', 'Var2', 'Var3']
});

// Vérifications
expect(result.createdCount).toBe(1); // Seulement Var3
expect(result.skippedVariations).toEqual(['Var1', 'Var2']);
```

### Test 3: Suppression avec produits liés

```typescript
// Créer une catégorie avec produits
const category = await createCategory({ name: 'Test' });
await createProduct({ categoryId: category.id });

// Tenter de supprimer
try {
  await deleteCategory(category.id);
  fail('Devrait échouer');
} catch (error) {
  expect(error.response.status).toBe(400);
  expect(error.response.data.message).toContain('produit(s)');
}
```

---

## 🚀 Checklist de déploiement

### Backend

- [ ] API `/categories` fonctionne et retourne la liste
- [ ] API `/categories/structure` crée la hiérarchie
- [ ] API `/categories/:id` modifie une catégorie
- [ ] API `DELETE /categories/:id` supprime avec cascade
- [ ] Vérification des doublons (contrainte unique)
- [ ] Gestion des produits liés
- [ ] Validation des données (DTO)
- [ ] CORS configuré pour le frontend
- [ ] Variables d'environnement configurées

### Frontend

- [ ] `CategoryContext` connecté au backend
- [ ] Modal de création fonctionnel
- [ ] Modal d'édition fonctionnel
- [ ] Modal de suppression fonctionnel
- [ ] Gestion des erreurs 409, 400, 404
- [ ] Toasts affichés correctement
- [ ] Tableau organisé hiérarchiquement
- [ ] Variations affichées sous les sous-catégories
- [ ] Loading states pendant les requêtes

### Tests

- [ ] Création d'une structure complète
- [ ] Création avec doublons
- [ ] Modification d'une catégorie
- [ ] Suppression sans produits
- [ ] Suppression avec produits (erreur attendue)
- [ ] Gestion des erreurs réseau

---

## 📞 Support et documentation

### Références

- **API Backend**: `/src/components/product-form/docModifie.md`
- **Guide Backend**: `CATEGORY_BACKEND_GUIDE.md`
- **Code Frontend**:
  - `src/contexts/CategoryContext.tsx`
  - `src/pages/CategoryManagement.tsx`

### Variables d'environnement

```env
# Frontend (.env)
VITE_API_URL=http://localhost:3004

# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/printalma
PORT=3004
```

---

**✨ L'intégration Frontend-Backend est maintenant complète !**

Le système gère automatiquement :
- ✅ Création de structures hiérarchiques complexes
- ✅ Détection et gestion des doublons
- ✅ Modifications et suppressions
- ✅ Erreurs et notifications utilisateur
- ✅ Mise à jour de l'interface en temps réel
