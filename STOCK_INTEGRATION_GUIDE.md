# Guide d'intégration de la gestion du stock

## Modifications à apporter à ProductFormMain.tsx

### 1. Ajouter les imports nécessaires

```typescript
import { StockManagementPanel } from './StockManagementPanel';
import { PackageOpen } from 'lucide-react';
import { StockBySizeColor } from '../../types/product';
```

### 2. Modifier le CategoriesStep pour gérer les couleurs

Remplacer (lignes 163-187) :

```typescript
const CategoriesStep: React.FC<{
  categories: string[];
  sizes: string[];
  onCategoriesUpdate: (categories: string[]) => void;
  onSizesUpdate: (sizes: string[]) => void;
}> = ({ categories, sizes, onCategoriesUpdate, onSizesUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Catégories et tailles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CategoriesAndSizesPanel
          categories={categories}
          sizes={sizes}
          onCategoriesUpdate={onCategoriesUpdate}
          onSizesUpdate={onSizesUpdate}
        />
      </CardContent>
    </Card>
  );
};
```

Par :

```typescript
const CategoriesStep: React.FC<{
  categories: string[];
  sizes: string[];
  colors: string[];
  onCategoriesUpdate: (categories: string[]) => void;
  onSizesUpdate: (sizes: string[]) => void;
  onColorsUpdate: (colors: string[]) => void;
}> = ({ categories, sizes, colors, onCategoriesUpdate, onSizesUpdate, onColorsUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Catégories, tailles et couleurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CategoriesAndSizesPanel
          categories={categories}
          sizes={sizes}
          colors={colors}
          onCategoriesUpdate={onCategoriesUpdate}
          onSizesUpdate={onSizesUpdate}
          onColorsUpdate={onColorsUpdate}
        />
      </CardContent>
    </Card>
  );
};
```

### 3. Ajouter un StockStep après CategoriesStep

```typescript
const StockStep: React.FC<{
  sizes: string[];
  colors: string[];
  stockBySizeColor: StockBySizeColor;
  onStockUpdate: (stock: StockBySizeColor) => void;
}> = ({ sizes, colors, stockBySizeColor, onStockUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageOpen className="h-5 w-5" />
          Gestion du stock
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StockManagementPanel
          sizes={sizes}
          colors={colors}
          stockBySizeColor={stockBySizeColor}
          onStockUpdate={onStockUpdate}
        />
      </CardContent>
    </Card>
  );
};
```

### 4. Mettre à jour le tableau steps (ligne ~507)

Changer de :
```typescript
const steps = [
  { id: 1, title: 'Informations de base', icon: Package },
  { id: 2, title: 'Variations de couleur', icon: Palette },
  { id: 3, title: 'Catégories et tailles', icon: Tag },
  { id: 4, title: 'Images et délimitations', icon: Layers },
  { id: 5, title: 'Validation', icon: CheckCircle }
];
```

À :
```typescript
const steps = [
  { id: 1, title: 'Informations de base', icon: Package },
  { id: 2, title: 'Variations de couleur', icon: Palette },
  { id: 3, title: 'Catégories et tailles', icon: Tag },
  { id: 4, title: 'Gestion du stock', icon: PackageOpen },
  { id: 5, title: 'Images et délimitations', icon: Layers },
  { id: 6, title: 'Validation', icon: CheckCircle }
];
```

### 5. Mettre à jour renderStepContent() (ligne ~1608)

Modifier le case 3 :
```typescript
case 3:
  return (
    <CategoriesStep
      categories={formData.categories}
      sizes={formData.sizes}
      colors={formData.colors || []}
      onCategoriesUpdate={(categories: string[]) => updateFormData('categories', categories)}
      onSizesUpdate={(sizes: string[]) => updateFormData('sizes', sizes)}
      onColorsUpdate={(colors: string[]) => updateFormData('colors', colors)}
    />
  );
```

Ajouter un case 4 :
```typescript
case 4:
  return (
    <StockStep
      sizes={formData.sizes}
      colors={formData.colors || []}
      stockBySizeColor={formData.stockBySizeColor || {}}
      onStockUpdate={(stock: StockBySizeColor) => updateFormData('stockBySizeColor', stock)}
    />
  );
```

Et décaler les cases suivants :
- case 4 devient case 5 (Délimitations)
- case 5 devient case 6 (Validation)

### 6. Mettre à jour les validations (ligne ~713)

Modifier le case 3 pour ajouter la validation des couleurs :
```typescript
case 3:
  if (formData.categories.length === 0) errors.push('Au moins une catégorie requise');
  if (formData.sizes.length === 0) errors.push('Au moins une taille requise');
  if (!formData.colors || formData.colors.length === 0) errors.push('Au moins une couleur requise');
  break;
```

Ajouter un case 4 pour valider le stock :
```typescript
case 4:
  // Validation optionnelle du stock
  const hasStock = formData.stockBySizeColor && Object.keys(formData.stockBySizeColor).length > 0;
  if (!hasStock) {
    errors.push('⚠️ Aucun stock défini (optionnel)');
  }
  break;
```

Et décaler les cases suivants (4 → 5, etc.)

### 7. Initialiser stockBySizeColor dans useProductForm.ts

Dans `src/hooks/useProductForm.ts`, ajouter dans initialFormData :
```typescript
const initialFormData: ProductFormData = {
  // ... champs existants
  colors: [],
  stockBySizeColor: {}
};
```

## Résultat attendu

Après ces modifications, le formulaire de produit aura :
1. Une étape pour sélectionner catégories, tailles ET couleurs (Noir/Blanc)
2. Une nouvelle étape "Gestion du stock" qui affiche un tableau interactif
3. Le stock sera géré par taille × couleur avec des contrôles +/-
4. Un indicateur visuel du stock total
5. Des actions rapides pour initialiser le stock

Le flux devient :
1. Infos de base
2. Variations de couleur (images)
3. Catégories, tailles et couleurs (Noir/Blanc)
4. **Gestion du stock** (nouveau)
5. Images et délimitations
6. Validation
