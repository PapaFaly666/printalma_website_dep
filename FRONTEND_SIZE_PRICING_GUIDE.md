# 📊 Guide Frontend : Intégration du Système de Prix par Taille

**Date:** 31 janvier 2026
**Version:** 1.0
**Fichiers modifiés:**
- `src/components/product-form/ProductFormFields.tsx`
- `src/components/product-form/CategoriesAndSizesPanel.tsx`
- `src/types/product.ts`
- `src/hooks/useProductForm.ts`

---

## 📋 Vue d'ensemble

Le frontend prend maintenant en charge les **prix par taille** pour les produits créés par les administrateurs. Chaque taille peut avoir son propre :
- **Prix de revient** (`costPrice`) - Coût de production en FCFA
- **Prix de vente suggéré** (`suggestedPrice`) - Prix recommandé pour la vente en FCFA

Une option **"Prix globaux"** permet d'appliquer les mêmes valeurs à toutes les tailles.

---

## 🔄 Modifications Frontend Effectuées

### 1. Suppression du champ "Prix de revient" global

Le champ `price` (prix de revient global) a été **retiré** de `ProductFormFields.tsx` (Informations principales).

### 2. Ajout des prix par taille dans CategoriesAndSizesPanel

Nouveau panneau **"Tailles et tarification"** avec pour chaque taille :

```
┌─────────────────────────────────────────────┐
│ 📦 Tailles et tarification (3 tailles)      │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─ S ───────────────────────────────────┐  │
│ │ 💰 Prix de revient (FCFA)              │  │
│ │ [2000]                                 │  │
│ │                                         │  │
│ │ 💡 Prix de vente suggéré (FCFA)         │  │
│ │ [5000]                                 │  │
│ │                                         │  │
│ │ Marge: 3000 FCFA (150%)                │  │
│ └─────────────────────────────────────────┘  │
│                                             │
│ ┌─ M ───────────────────────────────────┐  │
│ │ 💰 Prix de revient (FCFA)              │  │
│ │ [2200]                                 │  │
│ │                                         │  │
│ │ 💡 Prix de vente suggéré (FCFA)         │  │
│ │ [5500]                                 │  │
│ │                                         │  │
│ │ Marge: 3300 FCFA (150%)                │  │
│ └─────────────────────────────────────────┘  │
│                                             │
│ └─────────────────────────────────────────────┘
```

### 3. Ajout de la section "Prix globaux"

Nouvelle section dans `ProductFormFields.tsx` (Informations principales) :

```
┌─────────────────────────────────────────────┐
│ 🏷️ Mêmes prix pour toutes les tailles      │
│ ☑️ Cochez cette case si toutes les tailles │
│    ont les mêmes prix de revient et de     │
│    vente suggéré                           │
│                                             │
│ ☑️ Activé                                  │
│                                             │
│ ┌─ Prix globaux ─────────────────────────┐  │
│ │ 💰 Prix de revient global (FCFA)        │  │
│ │ [2000]                                  │  │
│ │                                         │  │
│ │ 💡 Prix de vente suggéré global (FCFA)  │  │
│ │ [5000]                                  │  │
│ └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 📦 Types TypeScript Mis à Jour

### SizePricing Interface

```typescript
// src/components/product-form/CategoriesAndSizesPanel.tsx

export interface SizePricing {
  size: string;              // Nom de la taille (ex: "S", "M", "L")
  suggestedPrice: number;    // Prix de vente suggéré en FCFA
  costPrice: number;         // Prix de revient en FCFA
}
```

### ProductFormData Interface

```typescript
// src/types/product.ts

export interface ProductFormData {
  id?: number;
  name: string;
  price?: number;              // ⚠️ Déprécié - utiliser sizePricing
  suggestedPrice?: number;
  stock?: number;
  status: 'published' | 'draft';
  description: string;
  categoryId?: number;
  categories: string[];
  sizes: string[];
  colors?: string[];
  designs: string[];
  colorVariations: ColorVariation[];
  hasDesign?: boolean;
  designCount?: number;
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE' | 'AUTOCOLLANT' | 'TABLEAU';
  stockBySizeColor?: StockBySizeColor;
  requiresStock?: boolean;

  // 🆕 Champs pour la tarification par taille
  sizePricing?: SizePricing[];      // Prix par taille
  useGlobalPricing?: boolean;       // Activer les prix globaux
  globalCostPrice?: number;         // Prix de revient global
  globalSuggestedPrice?: number;    // Prix de vente suggéré global
}
```

---

## 🔧 Composants Modifiés

### 1. ProductFormFields.tsx

**Changement :** Ajout de la section "Prix globaux"

```tsx
// src/components/product-form/ProductFormFields.tsx

{/* Prix globaux - optionnel pour toutes les tailles */}
<div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
  <div className="flex items-center space-x-2">
    <Switch
      id="useGlobalPricing"
      checked={formData.useGlobalPricing ?? false}
      onCheckedChange={(checked) => onUpdate('useGlobalPricing', checked)}
    />
    <Label htmlFor="useGlobalPricing" className="text-sm font-semibold cursor-pointer">
      🏷️ Mêmes prix pour toutes les tailles
    </Label>
  </div>
  <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
    Cochez cette case si toutes les tailles ont les mêmes prix de revient et de vente suggéré
  </p>

  {formData.useGlobalPricing && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 ml-6"
    >
      {/* Prix de revient global */}
      <div className="space-y-2">
        <Label htmlFor="globalCostPrice" className="text-sm font-medium">
          💰 Prix de revient global (FCFA)
        </Label>
        <Input
          id="globalCostPrice"
          type="number"
          value={formData.globalCostPrice || ''}
          onChange={(e) => onUpdate('globalCostPrice', parseFloat(e.target.value) || 0)}
          placeholder="Coût de production"
          min="0"
          step="100"
          className="font-semibold"
        />
      </div>

      {/* Prix de vente suggéré global */}
      <div className="space-y-2">
        <Label htmlFor="globalSuggestedPrice" className="text-sm font-medium">
          💡 Prix de vente suggéré global (FCFA)
        </Label>
        <Input
          id="globalSuggestedPrice"
          type="number"
          value={formData.globalSuggestedPrice || ''}
          onChange={(e) => onUpdate('globalSuggestedPrice', parseFloat(e.target.value) || 0)}
          placeholder="Prix recommandé"
          min="0"
          step="100"
          className="font-semibold border-green-500"
          required
        />
      </div>
    </motion.div>
  )}
</div>
```

### 2. CategoriesAndSizesPanel.tsx

**Changement :** Panneau "Tailles et tarification" avec prix par taille

```tsx
// src/components/product-form/CategoriesAndSizesPanel.tsx

{/* Panel Tailles - Simplifié : les variations = tailles */}
{selectedVariations.length > 0 && (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="bg-gray-900 dark:bg-black p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ruler className="h-5 w-5 text-white" />
          <h3 className="text-base font-semibold text-white">Tailles et tarification</h3>
        </div>
        <Badge className="bg-white text-gray-900 text-xs">
          {sizes.length} taille{sizes.length > 1 ? 's' : ''}
        </Badge>
      </div>
    </div>

    <div className="p-6">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Les tailles correspondent aux variations sélectionnées ci-dessus. Définissez les tarifs pour chaque taille.
      </p>

      {/* Tableau des prix par taille */}
      <div className="space-y-4">
        {sizes.map((size) => {
          const pricing = getSizePricing(size);
          return (
            <motion.div
              key={size}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
            >
              {/* Nom de la taille */}
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 border border-gray-900 dark:border-white">
                  {size}
                </Badge>
              </div>

              {/* Champs de prix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prix de revient */}
                <div className="space-y-2">
                  <Label htmlFor={`costPrice-${size}`} className="text-sm font-medium">
                    💰 Prix de revient (FCFA)
                  </Label>
                  <Input
                    id={`costPrice-${size}`}
                    type="number"
                    value={pricing.costPrice || ''}
                    onChange={(e) => updateSizePricing(size, 'costPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Coût de production"
                    min="0"
                    step="100"
                    className="font-semibold"
                  />
                </div>

                {/* Prix de vente suggéré */}
                <div className="space-y-2">
                  <Label htmlFor={`suggestedPrice-${size}`} className="text-sm font-medium">
                    💡 Prix de vente suggéré (FCFA)
                  </Label>
                  <Input
                    id={`suggestedPrice-${size}`}
                    type="number"
                    value={pricing.suggestedPrice || ''}
                    onChange={(e) => updateSizePricing(size, 'suggestedPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Prix recommandé"
                    min="0"
                    step="100"
                    className="font-semibold border-green-500"
                    required
                  />
                </div>
              </div>

              {/* Indicateur de marge */}
              {pricing.costPrice > 0 && pricing.suggestedPrice > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <span className={`text-xs font-medium ${
                    pricing.suggestedPrice > pricing.costPrice
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    Marge: {pricing.suggestedPrice - pricing.costPrice} FCFA
                    {pricing.costPrice > 0 && ` (${Math.round(((pricing.suggestedPrice - pricing.costPrice) / pricing.costPrice) * 100)}%)`}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
)}
```

### 3. Synchronisation automatique avec les prix globaux

```tsx
// src/components/product-form/CategoriesAndSizesPanel.tsx

// Initialiser/Mettre à jour les prix par taille quand les tailles changent
useEffect(() => {
  if (sizes.length > 0) {
    setLocalSizePricing((prevPricing) => {
      const newPricing: SizePricing[] = sizes.map((size) => {
        const existing = prevPricing.find((p) => p.size === size);

        // Si useGlobalPricing est activé, utiliser les prix globaux
        if (useGlobalPricing) {
          return {
            size,
            suggestedPrice: globalSuggestedPrice || 0,
            costPrice: globalCostPrice || 0
          };
        }

        // Sinon, utiliser les valeurs existantes ou des valeurs par défaut
        return existing || {
          size,
          suggestedPrice: 0,
          costPrice: 0
        };
      });
      return newPricing;
    });
  } else {
    setLocalSizePricing([]);
  }
}, [sizes, useGlobalPricing, globalCostPrice, globalSuggestedPrice]);
```

---

## 📤 Payload Envoyé au Backend

### Avec prix individuels par taille

```json
{
  "name": "T-shirt Premium",
  "description": "T-shirt de haute qualité",
  "status": "published",
  "categories": ["Vêtements > T-shirts > S", "Vêtements > T-shirts > M"],
  "sizes": ["S", "M", "L"],
  "genre": "UNISEXE",
  "isReadyProduct": true,
  "colorVariations": [
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [...]
    }
  ],

  // 🆕 Prix par taille
  "useGlobalPricing": false,
  "sizePricing": [
    {
      "size": "S",
      "costPrice": 2000,
      "suggestedPrice": 5000
    },
    {
      "size": "M",
      "costPrice": 2200,
      "suggestedPrice": 5500
    },
    {
      "size": "L",
      "costPrice": 2400,
      "suggestedPrice": 6000
    }
  ]
}
```

### Avec prix globaux

```json
{
  "name": "T-shirt Basic",
  "description": "T-shirt basique",
  "status": "published",
  "categories": ["Vêtements > T-shirts"],
  "sizes": ["S", "M", "L", "XL"],
  "genre": "UNISEXE",
  "isReadyProduct": true,
  "colorVariations": [...],

  // 🆕 Prix globaux
  "useGlobalPricing": true,
  "globalCostPrice": 1500,
  "globalSuggestedPrice": 4000,
  "sizePricing": [
    {"size": "S", "costPrice": 1500, "suggestedPrice": 4000},
    {"size": "M", "costPrice": 1500, "suggestedPrice": 4000},
    {"size": "L", "costPrice": 1500, "suggestedPrice": 4000},
    {"size": "XL", "costPrice": 1500, "suggestedPrice": 4000}
  ]
}
```

---

## 🎯 Flux Utilisateur

### Scénario 1 : Prix individuels par taille

1. **Étape 1 - Informations principales**
   - Remplir le nom, description
   - Laisser "Mêmes prix pour toutes les tailles" **décoché**
   - Cliquer sur "Suivant"

2. **Étape 3 - Catégories et tailles**
   - Sélectionner les catégories/variations
   - Les tailles s'affichent automatiquement
   - Pour chaque taille, remplir :
     - 💰 Prix de revient (FCFA)
     - 💡 Prix de vente suggéré (FCFA)
   - La marge s'affiche automatiquement

### Scénario 2 : Prix globaux

1. **Étape 1 - Informations principales**
   - Remplir le nom, description
   - **Cocher** "Mêmes prix pour toutes les tailles"
   - Remplir :
     - 💰 Prix de revient global (FCFA)
     - 💡 Prix de vente suggéré global (FCFA)
   - Cliquer sur "Suivant"

2. **Étape 3 - Catégories et tailles**
   - Sélectionner les catégories/variations
   - Les tailles s'affichent avec les prix **déjà remplis**
   - Les prix correspondent aux prix globaux définis

---

## ⚠️ Validations Frontend Supprimées

Les validations suivantes ont été **retirées** car le prix n'est plus requis à l'étape 1 :

```typescript
// ❌ RETIRÉ de ProductFormMain.tsx (ligne 1069)
if (formData.price <= 0) errors.push('Prix invalide');

// ❌ RETIRÉ de useProductForm.ts (ligne 157)
if (formData.price <= 0) {
  newErrors.price = 'Le prix doit être supérieur à 0';
}

// ❌ RETIRÉ de CreateReadyProductPage.tsx (lignes 487, 621)
if (formData.price <= 0) errors.push('Prix doit être supérieur à 0');

// ❌ RETIRÉ de EditReadyProductPage.tsx (lignes 223, 379)
if (formData.price <= 0) errors.push('Prix doit être supérieur à 0');
```

La validation des prix se fait maintenant dans le panneau **"Tailles et tarification"** à l'étape 3.

---

## 🧪 Tests Manuels

### Test 1 : Création avec prix individuels

1. Aller sur `/admin/add-product`
2. Remplir nom et description
3. Laisser "Mêmes prix" décoché
4. À l'étape 3, sélectionner des tailles
5. Remplir des prix différents pour chaque taille
6. Vérifier que les marges s'affichent correctement

### Test 2 : Création avec prix globaux

1. Aller sur `/admin/add-product`
2. Remplir nom et description
3. **Cocher** "Mêmes prix"
4. Remplir les prix globaux
5. À l'étape 3, sélectionner des tailles
6. Vérifier que tous les prix sont pré-remplis

### Test 3 : Modification des prix globaux

1. Cocher "Mêmes prix"
2. Remplir les prix globaux (ex: 2000, 5000)
3. Aller à l'étape 3
4. Revenir à l'étape 1
5. Modifier le prix global (ex: 2500, 6000)
6. Retourner à l'étape 3
7. Vérifier que les prix par taille ont été mis à jour

---

## 📊 Affichage des Prix

### Pour l'administrateur

```tsx
// Afficher les prix par taille avec marge
{product.sizePrices?.map((sp) => {
  const margin = sp.suggestedPrice - sp.costPrice;
  const marginPercent = (margin / sp.costPrice) * 100;

  return (
    <div key={sp.size}>
      <span>Taille {sp.size}</span>
      <span>Coût: {sp.costPrice} FCFA</span>
      <span>Prix: {sp.suggestedPrice} FCFA</span>
      <span>Marge: {marginPercent.toFixed(1)}%</span>
    </div>
  );
})}
```

### Pour le client

```tsx
// Afficher SEULEMENT le prix de vente suggéré
{product.sizePrices?.map((sp) => (
  <div key={sp.size}>
    <span>Taille {sp.size}</span>
    <span>{sp.suggestedPrice} FCFA</span>
  </div>
))}
```

**⚠️ IMPORTANT :** Ne jamais afficher le `costPrice` aux clients !

---

## 🔍 Points d'Attention

### 1. Indicateur de marge

La marge est calculée automatiquement et affichée en vert si positive, en rouge si négative :

```tsx
{pricing.suggestedPrice > pricing.costPrice
  ? 'text-green-600 dark:text-green-400'
  : 'text-red-600 dark:text-red-400'
}
```

### 2. Synchronisation des prix globaux

Quand `useGlobalPricing` est activé, tout changement des prix globaux met automatiquement à jour tous les prix par taille.

### 3. Prix obligatoire

Le champ "Prix de vente suggéré" est obligatoire pour chaque taille (`required`).

### 4. État initial du formulaire

```typescript
// src/hooks/useProductForm.ts

const initialFormData: ProductFormData = {
  name: '',
  price: 0,                      // Déprécié mais gardé pour compatibilité
  suggestedPrice: undefined,
  stock: 0,
  status: 'published',
  description: '',
  categoryId: undefined,
  categories: [],
  designs: [],
  colorVariations: [],
  sizes: [],
  colors: [],
  stockBySizeColor: {},
  genre: 'UNISEXE',
  sizePricing: [],               // 🆕 Prix par taille
  useGlobalPricing: false,       // 🆕 Checkbox désactivée par défaut
  globalCostPrice: 0,            // 🆕 Prix de revient global
  globalSuggestedPrice: 0        // 🆕 Prix de vente suggéré global
};
```

---

## 📝 Résumé des Champs

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `useGlobalPricing` | boolean | Non | Active les prix globaux (défaut: false) |
| `globalCostPrice` | number | Non | Prix de revient global en FCFA |
| `globalSuggestedPrice` | number | Non | Prix de vente suggéré global en FCFA |
| `sizePricing[]` | SizePricing[] | Oui | Liste des prix par taille |
| `sizePricing[].size` | string | Oui | Nom de la taille |
| `sizePricing[].costPrice` | number | Oui | Prix de revient en FCFA |
| `sizePricing[].suggestedPrice` | number | Oui | Prix de vente suggéré en FCFA (doit être > 0) |

---

## 🎨 Composants Parents Mis à Jour

Les composants suivants ont été mis à jour pour passer les nouvelles props :

### ProductFormMain.tsx

```tsx
<CategoriesStep
  sizes={formData.sizes}
  categories={formData.categories || []}
  sizePricing={formData.sizePricing}
  useGlobalPricing={formData.useGlobalPricing}
  globalCostPrice={formData.globalCostPrice}
  globalSuggestedPrice={formData.globalSuggestedPrice}
  onCategoriesUpdate={(categories: string[]) => updateFormData('categories', categories)}
  onSizesUpdate={(sizes: string[]) => updateFormData('sizes', sizes)}
  onSizePricingUpdate={(pricing: any[]) => updateFormData('sizePricing', pricing)}
/>
```

### CreateReadyProductPage.tsx & EditReadyProductPage.tsx

Même pattern que `ProductFormMain.tsx`.

---

**Fin du guide**
