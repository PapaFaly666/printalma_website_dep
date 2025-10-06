# Correction: Erreurs React Key et Object as Child

## Problèmes identifiés

### Erreur 1: "Objects are not valid as a React child"
```
Uncaught Error: Objects are not valid as a React child
(found: object with keys {id, productId, sizeName})
```

**Cause:** `product.sizes` contenait des objets `{id, productId, sizeName}` au lieu de strings simples, et ces objets étaient utilisés directement dans le template React.

### Erreur 2: "Encountered two children with the same key"
```
Encountered two children with the same key, `3-[object Object]`
```

**Causes:**
1. `size.id` utilisé comme clé unique au lieu de la clé composite calculée
2. `size.sizeName` pouvait être un objet au lieu d'une string

## Solutions implémentées

### 1. `src/services/stockService.ts` (lignes 136-145)

**Problème:**
```typescript
sizes = product.sizes.map((sizeName: string) => ({
  id: `${color.id}-${sizeName}`,  // ❌ sizeName peut être un objet
  sizeName,
  stock: colorStocks[sizeName] || 0
}));
```

**Solution:**
```typescript
sizes = product.sizes.map((size: any) => {
  // Gérer le cas où size est un objet {id, sizeName} ou une string
  const sizeName = typeof size === 'string'
    ? size
    : (size.sizeName || size.name || String(size));

  return {
    id: `${color.id}-${sizeName}`,  // ✅ sizeName est toujours une string
    sizeName,
    stock: colorStocks[sizeName] || 0
  };
});
```

### 2. `src/pages/admin/AdminStockManagement.tsx` (lignes 634-645)

**Problème:**
```typescript
{color.sizes.map((size) => {
  const key = `${selectedProduct.id}-${color.id}-${size.id}`;
  return (
    <tr key={size.id}>  {/* ❌ Mauvaise clé, peut avoir des doublons */}
      <td>
        {size.sizeName}   {/* ❌ sizeName peut être un objet */}
      </td>
```

**Solution:**
```typescript
{color.sizes.map((size) => {
  const key = `${selectedProduct.id}-${color.id}-${size.id}`;

  // S'assurer que sizeName est une string
  const sizeName = typeof size.sizeName === 'string'
    ? size.sizeName
    : (size.sizeName?.name || String(size.sizeName));

  return (
    <tr key={key}>  {/* ✅ Utilise la clé composite unique */}
      <td>
        {sizeName}    {/* ✅ sizeName est toujours une string */}
      </td>
```

## Détails techniques

### Structure de données backend

Le backend peut retourner `product.sizes` dans différents formats:

**Format 1: Array de strings (normalisé)**
```json
{
  "sizes": ["S", "M", "L", "XL"]
}
```

**Format 2: Array d'objets (non normalisé)**
```json
{
  "sizes": [
    { "id": 1, "productId": 123, "sizeName": "S" },
    { "id": 2, "productId": 123, "sizeName": "M" }
  ]
}
```

Le code doit gérer les deux cas.

### Extraction de sizeName

La logique d'extraction garantit qu'on obtient toujours une string:

```typescript
const sizeName = typeof size === 'string'
  ? size                           // Cas 1: size est déjà une string
  : (size.sizeName                 // Cas 2: objet avec sizeName
     || size.name                  // Cas 3: objet avec name
     || String(size));             // Cas 4: conversion en string
```

### Clés React uniques

**Mauvaise pratique:**
```typescript
<tr key={size.id}>  // ❌ Peut avoir des doublons entre couleurs
```

**Bonne pratique:**
```typescript
<tr key={`${productId}-${colorId}-${size.id}`}>  // ✅ Clé composite unique
```

La clé composite garantit l'unicité même si plusieurs couleurs ont des tailles avec le même `id`.

## Tests de validation

### Test 1: Produit avec sizes normalisés (strings)
```json
{
  "id": 1,
  "name": "T-shirt",
  "sizes": ["S", "M", "L", "XL"]
}
```
✅ **Résultat:** Affiche correctement toutes les tailles

### Test 2: Produit avec sizes objets
```json
{
  "id": 2,
  "name": "Coque iPhone",
  "sizes": [
    { "id": 1, "sizeName": "iPhone 12" },
    { "id": 2, "sizeName": "iPhone 13" }
  ]
}
```
✅ **Résultat:** Extrait sizeName et affiche correctement

### Test 3: Produit avec sizes mixtes
```json
{
  "id": 3,
  "sizes": ["S", { "sizeName": "M" }, "L"]
}
```
✅ **Résultat:** Gère les deux formats dans le même array

### Test 4: Affichage dans AdminStockManagement
- ✅ Aucune erreur "Objects are not valid as a React child"
- ✅ Aucune erreur "same key"
- ✅ Affichage correct de toutes les variations
- ✅ Modification de stock fonctionnelle

## Prévention future

### Normalisation backend recommandée

Pour éviter ces problèmes, le backend devrait toujours normaliser `product.sizes`:

```typescript
// Dans le backend (NestJS/Express)
async getProducts() {
  const products = await this.prisma.product.findMany({
    include: { /* ... */ }
  });

  return products.map(product => ({
    ...product,
    sizes: product.sizes.map(size =>
      typeof size === 'string' ? size : size.sizeName
    )
  }));
}
```

### Validation TypeScript

Définir des types stricts:

```typescript
interface ProductStock {
  id: number;
  name: string;
  sizes: string[];  // ✅ Toujours un array de strings
  colorVariations: ColorVariation[];
  // ...
}
```

### Vérifications runtime

Ajouter des validations:

```typescript
function normalizeSizeName(size: any): string {
  if (typeof size === 'string') return size;
  if (typeof size === 'object' && size !== null) {
    return size.sizeName || size.name || String(size);
  }
  return String(size);
}
```

## Résumé

✅ **Erreur "Objects are not valid as a React child" - CORRIGÉE**
- `stockService.ts`: Extraction de sizeName depuis objets
- `AdminStockManagement.tsx`: Normalisation avant affichage

✅ **Erreur "same key" - CORRIGÉE**
- Utilisation de clés composites uniques
- Format: `${productId}-${colorId}-${sizeId}`

✅ **Robustesse améliorée**
- Gestion de plusieurs formats de données
- Conversion automatique objet → string
- Pas de crash si format inattendu

✅ **Compatible avec tous les produits**
- Vêtements (S, M, L, XL)
- Accessoires (iPhone 12, iPhone 13, etc.)
- Formats backend mixtes
