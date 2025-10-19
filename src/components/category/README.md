# 🛡️ Composants de Protection des Catégories

Ce dossier contient les composants React pour le système de protection de suppression des catégories.

## 📁 Structure

```
src/components/category/
├── DeleteCategoryButton.tsx    # Bouton de suppression avec protection
├── MigrationDialog.tsx         # Dialogue de migration de produits
├── ProductCountBadge.tsx       # Badge de comptage des produits
├── index.ts                    # Exports centralisés
├── __tests__/                  # Tests unitaires
│   └── ProductCountBadge.test.tsx
└── README.md                   # Cette documentation
```

## 🎯 Composants

### ProductCountBadge

Badge affichant le nombre de produits liés à une catégorie.

**Usage :**
```tsx
import { ProductCountBadge } from '@/components/category';

<ProductCountBadge id={categoryId} type="category" />
```

**Props :**
- `id: number` - ID de la catégorie
- `type: 'category' | 'subcategory' | 'variation'` - Type d'entité
- `className?: string` - Classes CSS optionnelles

**Affichage :**
- ✅ Badge vert si aucun produit
- ⚠️ Badge jaune si produits existants
- 🔄 Spinner pendant le chargement

---

### DeleteCategoryButton

Bouton de suppression avec vérification automatique et dialogue de migration.

**Usage :**
```tsx
import { DeleteCategoryButton } from '@/components/category';

<DeleteCategoryButton
  categoryId={category.id}
  categoryName={category.name}
  type="category"
  onDeleteSuccess={() => refreshData()}
/>
```

**Props :**
- `categoryId: number` - ID de la catégorie
- `categoryName: string` - Nom de la catégorie
- `type?: 'category' | 'subcategory' | 'variation'` - Type (défaut: category)
- `onDeleteSuccess?: () => void` - Callback après succès
- `variant?: ButtonVariant` - Style du bouton
- `size?: ButtonSize` - Taille du bouton
- `className?: string` - Classes CSS
- `showIcon?: boolean` - Afficher l'icône (défaut: true)
- `children?: ReactNode` - Contenu personnalisé

**Workflow :**
1. Vérifie si la suppression est possible
2. Si produits → Affiche MigrationDialog
3. Si pas de produits → Confirmation puis suppression

---

### MigrationDialog

Dialogue modal pour migrer les produits avant suppression.

**Usage :**
```tsx
import { MigrationDialog } from '@/components/category';

<MigrationDialog
  categoryId={category.id}
  categoryName={category.name}
  blockerInfo={{
    blockers: { total: 10, directProducts: 10 },
    message: "Cette catégorie ne peut pas être supprimée..."
  }}
  onClose={() => setShowDialog(false)}
  onMigrationComplete={() => handleSuccess()}
/>
```

**Props :**
- `categoryId: number` - ID de la catégorie source
- `categoryName: string` - Nom de la catégorie source
- `blockerInfo: BlockerInfo` - Informations sur les produits bloquants
- `onClose: () => void` - Callback de fermeture
- `onMigrationComplete: () => void` - Callback après migration

**Fonctionnalités :**
- Liste des produits bloquants
- Sélection de la catégorie de destination
- Prévisualisation de la migration
- Validation et feedback

---

## 🔧 Services & Hooks

### categoryProtectionService

Service pour les appels API.

```tsx
import { categoryProtectionService } from '@/services/categoryProtectionService';

// Vérifier si suppression possible
const canDelete = await categoryProtectionService.canDeleteCategory(id);

// Migrer les produits
await categoryProtectionService.migrateProducts(fromId, toId);

// Supprimer
await categoryProtectionService.deleteCategory(id);
```

### useCategoryDeletion

Hook pour gérer la suppression avec protection.

```tsx
import { useCategoryDeletion } from '@/hooks/useCategoryDeletion';

const { deleteCategory, loading, error } = useCategoryDeletion();

const handleDelete = async () => {
  const result = await deleteCategory(categoryId);
  if (result.success) {
    // Succès
  }
};
```

---

## 📝 Exemples d'Utilisation

### Exemple 1 : Badge Simple

```tsx
function CategoryList({ categories }) {
  return (
    <div>
      {categories.map(cat => (
        <div key={cat.id}>
          <span>{cat.name}</span>
          <ProductCountBadge id={cat.id} type="category" />
        </div>
      ))}
    </div>
  );
}
```

### Exemple 2 : Bouton de Suppression

```tsx
function CategoryActions({ category, onRefresh }) {
  return (
    <div>
      <DeleteCategoryButton
        categoryId={category.id}
        categoryName={category.name}
        type="category"
        onDeleteSuccess={onRefresh}
        variant="destructive"
        size="sm"
      />
    </div>
  );
}
```

### Exemple 3 : Gestion Manuelle

```tsx
function CustomDeleteFlow() {
  const { deleteCategory, loading } = useCategoryDeletion();
  const [showMigration, setShowMigration] = useState(false);
  const [blockers, setBlockers] = useState(null);

  const handleDelete = async () => {
    const result = await deleteCategory(categoryId);

    if (result.blockers) {
      setBlockers(result.blockers);
      setShowMigration(true);
    } else if (result.success) {
      toast.success('Supprimé !');
    }
  };

  return (
    <>
      <button onClick={handleDelete} disabled={loading}>
        Supprimer
      </button>

      {showMigration && (
        <MigrationDialog
          categoryId={categoryId}
          categoryName={categoryName}
          blockerInfo={blockers}
          onClose={() => setShowMigration(false)}
          onMigrationComplete={handleRefresh}
        />
      )}
    </>
  );
}
```

---

## 🧪 Tests

### Lancer les Tests

```bash
npm run test src/components/category/__tests__
```

### Coverage

```bash
npm run test:coverage src/components/category
```

### Tests Manuels

Voir `/docs/CATEGORY_DELETION_PROTECTION_USAGE.md` pour les scénarios de tests manuels.

---

## 🎨 Personnalisation

### Changer les Styles

Tous les composants utilisent Tailwind CSS et shadcn/ui. Vous pouvez personnaliser :

```tsx
<ProductCountBadge
  id={1}
  type="category"
  className="custom-badge-class"
/>

<DeleteCategoryButton
  categoryId={1}
  categoryName="Test"
  variant="outline"
  size="lg"
  className="my-custom-button"
/>
```

### Modifier les Messages

Dans `DeleteCategoryButton.tsx` :

```tsx
toast.success('Votre message personnalisé');
```

Dans `MigrationDialog.tsx` :

```tsx
<DialogTitle>Votre titre personnalisé</DialogTitle>
```

---

## 📚 Documentation

- **Guide d'Utilisation** : `/docs/CATEGORY_DELETION_PROTECTION_USAGE.md`
- **Résumé d'Implémentation** : `/docs/IMPLEMENTATION_SUMMARY.md`
- **Documentation Backend** : `/docs/CATEGORY_DELETION_PROTECTION.md`

---

## 🆘 Dépannage

### Badge ne charge pas

**Cause** : Backend non accessible
**Solution** : Vérifier l'URL backend dans `categoryProtectionService.ts`

### Migration échoue

**Cause** : Permissions insuffisantes
**Solution** : Vérifier l'authentification utilisateur

### Messages d'erreur génériques

**Cause** : Erreurs backend non gérées
**Solution** : Activer les logs détaillés (console)

---

## 🚀 Contribution

Pour ajouter de nouvelles fonctionnalités :

1. Créer une branche feature
2. Implémenter les changements
3. Ajouter les tests unitaires
4. Mettre à jour la documentation
5. Créer une Pull Request

---

**Dernière mise à jour** : 2025-10-19
**Version** : 1.0.0
