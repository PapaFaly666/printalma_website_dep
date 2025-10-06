# 📚 Guide d'Utilisation des Composants de Catégorie

Ce guide explique comment utiliser les composants `CategoryAutocomplete` et `ChipsInput` dans votre application.

---

## 🎯 CategoryAutocomplete

Composant d'autocomplétion pour sélectionner des catégories avec vérification de doublons via API.

### Caractéristiques

- ✅ Autocomplétion avec suggestions en temps réel
- ✅ Vérification des doublons via API (debounced 500ms)
- ✅ Support des catégories parent/enfant avec badges visuels
- ✅ Détection locale + API pour éviter les doublons
- ✅ Indicateurs visuels de statut (existante/nouvelle)
- ✅ Mode dark/light automatique

### Exemple d'utilisation

```tsx
import { CategoryAutocomplete } from '@/components/ui/category-autocomplete';
import { useState } from 'react';

function ProductForm() {
  const [categoryName, setCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Charger les catégories depuis l'API
  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  return (
    <div>
      <Label>Catégorie du produit</Label>
      <CategoryAutocomplete
        categories={categories}
        value={categoryName}
        onChange={setCategoryName}
        onCategorySelect={setSelectedCategory}
        placeholder="Rechercher ou créer une catégorie..."
        parentId={null} // Optionnel: pour vérifier doublons dans un contexte parent
      />

      {selectedCategory ? (
        <p className="text-sm text-green-600 mt-2">
          ✓ Catégorie "{selectedCategory.name}" sélectionnée
        </p>
      ) : categoryName ? (
        <p className="text-sm text-blue-600 mt-2">
          ✨ Nouvelle catégorie "{categoryName}" sera créée
        </p>
      ) : null}
    </div>
  );
}
```

### Props

```typescript
interface CategoryAutocompleteProps {
  categories: Category[];        // Liste des catégories disponibles
  value: string;                  // Valeur actuelle du champ
  onChange: (value: string) => void;  // Callback quand la valeur change
  onCategorySelect?: (category: Category | null) => void;  // Callback quand une catégorie est sélectionnée
  placeholder?: string;           // Texte du placeholder
  className?: string;             // Classes CSS additionnelles
  disabled?: boolean;             // Désactiver le champ
  parentId?: number | null;       // ID du parent pour vérification de doublons contextuels
}
```

### Type Category

```typescript
interface Category {
  id?: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  level?: number;
}
```

### Comportement de vérification API

L'endpoint appelé : `GET /categories/check-duplicate?name={categoryName}&parentId={parentId}`

Réponse attendue :
```json
{
  "exists": true,
  "category": {
    "id": 123,
    "name": "T-Shirts",
    "description": "Catégorie des t-shirts",
    "parentId": null,
    "level": 0
  }
}
```

---

## 🏷️ ChipsInput

Composant d'input avec système de "chips" (tags) pour saisir des variations multiples.

### Caractéristiques

- ✅ Ajout de chips via Entrée ou virgule
- ✅ Suppression des chips via Backspace ou bouton X
- ✅ Prévention des doublons automatique
- ✅ Limite maximum de chips configurable
- ✅ Design responsive avec dark mode
- ✅ Animations fluides

### Exemple d'utilisation

```tsx
import { ChipsInput } from '@/components/ui/chips-input';
import { useState } from 'react';

function ProductSizesForm() {
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);

  return (
    <div>
      <Label>Tailles disponibles</Label>
      <ChipsInput
        value={sizes}
        onChange={setSizes}
        placeholder="Ajouter des tailles (S, M, L, XL...)"
        maxChips={10}
      />

      <p className="text-xs text-gray-500 mt-2">
        Appuyez sur Entrée ou , pour ajouter une taille
      </p>

      {sizes.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium">Tailles configurées:</p>
          <p className="text-sm text-gray-600">{sizes.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
```

### Props

```typescript
interface ChipsInputProps {
  value: string[];                // Liste des chips actuelles
  onChange: (chips: string[]) => void;  // Callback quand la liste change
  placeholder?: string;           // Texte du placeholder
  className?: string;             // Classes CSS additionnelles
  disabled?: boolean;             // Désactiver le champ
  maxChips?: number;              // Nombre maximum de chips autorisées
}
```

### Interactions clavier

- **Entrée** ou **Virgule (,)** : Ajouter un chip
- **Backspace** : Supprimer le dernier chip (quand l'input est vide)
- **Clic sur X** : Supprimer un chip spécifique

---

## 📦 Cas d'usage recommandés

### CategoryAutocomplete

1. **Formulaire de création de produit**
   - Sélection/création de catégorie principale
   - Sélection de sous-catégories

2. **Formulaire de design**
   - Choix de catégorie de design
   - Organisation par thématique

3. **Filtres de recherche**
   - Filtrer produits par catégorie
   - Navigation dans l'arborescence

### ChipsInput

1. **Variations de produits**
   - Tailles : S, M, L, XL, XXL
   - Couleurs : Rouge, Bleu, Vert
   - Matériaux : Coton, Polyester

2. **Tags et métadonnées**
   - Tags de produits : été, tendance, promo
   - Mots-clés SEO

3. **Configuration de stock**
   - Références multiples
   - Codes-barres multiples

---

## 🎨 Personnalisation

### Thème sombre

Les deux composants supportent automatiquement le dark mode via Tailwind CSS.

### Styles personnalisés

```tsx
<CategoryAutocomplete
  className="border-2 border-blue-500"  // Style personnalisé
  // ... autres props
/>

<ChipsInput
  className="bg-gray-50 rounded-lg"  // Style personnalisé
  // ... autres props
/>
```

---

## 🔧 Configuration Backend Requise

### Endpoint de vérification de doublons

```typescript
// Backend: NestJS exemple
@Get('check-duplicate')
async checkDuplicate(
  @Query('name') name: string,
  @Query('parentId') parentId?: string
): Promise<{ exists: boolean; category: Category | null }> {
  const existingCategory = await this.categoryService.findByName(
    name,
    parentId ? parseInt(parentId) : null
  );

  return {
    exists: !!existingCategory,
    category: existingCategory || null
  };
}
```

---

## 📝 Exemple Complet: Formulaire de Produit

```tsx
import { CategoryAutocomplete, ChipsInput } from '@/components/ui';
import { useState, useEffect } from 'react';
import { fetchCategories } from '@/services/api';

function CreateProductForm() {
  const [categoryName, setCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const handleSubmit = async () => {
    const productData = {
      categoryId: selectedCategory?.id,
      categoryName: selectedCategory ? undefined : categoryName, // Créer si nouvelle
      sizes,
      colors
    };

    // Envoyer au backend...
    console.log('Product data:', productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Catégorie */}
      <div>
        <Label>Catégorie *</Label>
        <CategoryAutocomplete
          categories={categories}
          value={categoryName}
          onChange={setCategoryName}
          onCategorySelect={setSelectedCategory}
          placeholder="Sélectionner ou créer une catégorie..."
        />
      </div>

      {/* Tailles */}
      <div>
        <Label>Tailles disponibles</Label>
        <ChipsInput
          value={sizes}
          onChange={setSizes}
          placeholder="Ex: S, M, L, XL..."
          maxChips={15}
        />
      </div>

      {/* Couleurs */}
      <div>
        <Label>Couleurs disponibles</Label>
        <ChipsInput
          value={colors}
          onChange={setColors}
          placeholder="Ex: Rouge, Bleu, Noir..."
          maxChips={20}
        />
      </div>

      <Button type="submit">
        Créer le produit
      </Button>
    </form>
  );
}
```

---

## 🐛 Dépannage

### CategoryAutocomplete ne vérifie pas les doublons

- ✅ Vérifier que l'endpoint `/categories/check-duplicate` existe
- ✅ Vérifier la variable d'environnement `VITE_API_URL`
- ✅ Vérifier la console pour les erreurs réseau

### ChipsInput n'ajoute pas de chips

- ✅ Vérifier que `onChange` est bien défini
- ✅ Vérifier que `maxChips` n'est pas atteint
- ✅ Vérifier que le champ n'est pas `disabled`

---

## 📚 Ressources

- **Fichiers sources:**
  - `src/components/ui/category-autocomplete.tsx`
  - `src/components/ui/chips-input.tsx`

- **Documentation backend:**
  - `CATEGORY_BACKEND_GUIDE.md`
  - `CATEGORY_FRONTEND_BACKEND_INTEGRATION.md`

- **Export centralisé:**
  - `src/components/ui/index.ts`
