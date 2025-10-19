# Guide d'Utilisation - Système de Protection de Suppression des Catégories

## 📖 Vue d'ensemble

Le système de protection empêche la suppression accidentelle de catégories, sous-catégories et variations qui sont utilisées par des produits existants.

## 🎯 Fonctionnalités Principales

### 1. Badge de Comptage des Produits (`ProductCountBadge`)

Affiche automatiquement le nombre de produits liés à chaque catégorie/sous-catégorie/variation.

**Exemple d'utilisation :**

```tsx
import { ProductCountBadge } from '@/components/category';

<ProductCountBadge
  id={categoryId}
  type="category" // ou "subcategory" ou "variation"
/>
```

**Rendu :**
- ✅ Badge vert : "Aucun produit" (suppression possible)
- ⚠️ Badge jaune : "X produit(s)" (suppression bloquée)

### 2. Bouton de Suppression Protégé (`DeleteCategoryButton`)

Bouton de suppression avec vérification automatique et dialogue de migration.

**Exemple d'utilisation :**

```tsx
import { DeleteCategoryButton } from '@/components/category';

<DeleteCategoryButton
  categoryId={category.id}
  categoryName={category.name}
  type="category"
  onDeleteSuccess={() => refreshData()}
/>
```

**Comportement :**
1. Vérifie si la catégorie peut être supprimée
2. Si des produits existent → Affiche le dialogue de migration
3. Si aucun produit → Demande confirmation puis supprime

### 3. Dialogue de Migration (`MigrationDialog`)

Interface pour migrer les produits avant suppression.

**Workflow :**
1. L'utilisateur clique sur "Supprimer"
2. Le système détecte des produits liés
3. Le dialogue s'affiche avec :
   - Liste des produits bloquants
   - Sélecteur de catégorie de destination
   - Bouton "Migrer les Produits"
4. Après migration → Suppression possible

## 🔧 Composants Disponibles

### ProductCountBadge

```tsx
interface ProductCountBadgeProps {
  id: number;                    // ID de la catégorie/sous-catégorie/variation
  type: 'category' | 'subcategory' | 'variation';
  className?: string;            // Classes CSS optionnelles
}
```

### DeleteCategoryButton

```tsx
interface DeleteCategoryButtonProps {
  categoryId: number;
  categoryName: string;
  type?: 'category' | 'subcategory' | 'variation'; // default: 'category'
  onDeleteSuccess?: () => void;  // Callback après succès
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;            // default: true
  children?: React.ReactNode;    // Texte personnalisé du bouton
}
```

### MigrationDialog

```tsx
interface MigrationDialogProps {
  categoryId: number;
  categoryName: string;
  blockerInfo: {
    blockers: {
      total?: number;
      directProducts?: number;
      subCategoryProducts?: number;
      variationProducts?: number;
    };
    message: string;
  };
  onClose: () => void;
  onMigrationComplete: () => void;
}
```

## 📝 Hooks Disponibles

### useCategoryDeletion

Hook personnalisé pour gérer la suppression avec protection.

```tsx
import { useCategoryDeletion } from '@/hooks/useCategoryDeletion';

const MyComponent = () => {
  const {
    deleteCategory,
    deleteSubCategory,
    deleteVariation,
    checkCanDeleteCategory,
    loading,
    error
  } = useCategoryDeletion();

  const handleDelete = async () => {
    const result = await deleteCategory(categoryId);

    if (result.success) {
      console.log('Suppression réussie');
    } else if (result.blockers) {
      console.log('Suppression bloquée:', result.blockers);
    }
  };
};
```

## 🔌 Services API

### categoryProtectionService

Service pour les appels API de protection.

```tsx
import { categoryProtectionService } from '@/services/categoryProtectionService';

// Vérifier si une catégorie peut être supprimée
const canDelete = await categoryProtectionService.canDeleteCategory(categoryId);

// Migrer les produits
await categoryProtectionService.migrateProducts(fromCategoryId, toCategoryId);

// Supprimer une catégorie
await categoryProtectionService.deleteCategory(categoryId);
```

## 🎨 Intégration dans l'Interface

### Dans CategoryManagement.tsx

Le système est déjà intégré dans la page de gestion des catégories :

1. **Badge de comptage** : Affiché automatiquement dans le `CategoryTree`
2. **Suppression protégée** : Via le composant `DeleteConfirmDialog` qui utilise `categoryDeleteService`

### Dans CategoryTree.tsx

Le `ProductCountBadge` est affiché automatiquement pour chaque catégorie :

```tsx
<ProductCountBadge
  id={category.id}
  type={level === 0 ? 'category' : level === 1 ? 'subcategory' : 'variation'}
/>
```

## 🧪 Tests Manuels

### Test 1 : Suppression Bloquée

1. Créer une catégorie "Test"
2. Créer un produit dans cette catégorie
3. Essayer de supprimer la catégorie
4. **Résultat attendu** : Dialogue de migration affiché

### Test 2 : Migration de Produits

1. Suivre Test 1
2. Sélectionner une catégorie de destination
3. Cliquer sur "Migrer les Produits"
4. **Résultat attendu** : Produits déplacés, message de succès

### Test 3 : Suppression Autorisée

1. Créer une catégorie "Test2" sans produits
2. Essayer de supprimer la catégorie
3. **Résultat attendu** : Confirmation puis suppression directe

## ⚠️ Points d'Attention

### Backend

Le backend doit fournir les endpoints suivants :

- `GET /categories/:id/can-delete` - Vérification
- `DELETE /categories/:id` - Suppression
- `POST /products/migrate-category` - Migration

### Authentification

Les appels API utilisent `credentials: 'include'` pour l'authentification par cookies.

### Gestion des Erreurs

Le système gère automatiquement :
- ✅ Erreurs 409 (Conflict) - Catégorie utilisée
- ✅ Messages d'erreur clairs
- ✅ Suggestions d'action

## 📚 Ressources Complémentaires

- **Documentation API Backend** : `/docs/CATEGORY_DELETION_PROTECTION.md`
- **Guide d'Intégration** : `/docs/CATEGORY_PROTECTION_VISUAL.md`
- **Tests Backend** : `/docs/TESTS_MANUELS_PROTECTION_CATEGORIES.md`

## 🆘 Support

En cas de problème :

1. Vérifier les logs de la console navigateur
2. Vérifier les logs du backend
3. Tester les endpoints API avec Thunder Client/Postman
4. Consulter la documentation complète

## 📈 Évolutions Futures

- [ ] Support de la migration par lot
- [ ] Interface de prévisualisation des produits impactés
- [ ] Historique des migrations
- [ ] Annulation de migration (undo)

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-10-19
**Auteur** : Équipe PrintAlma
