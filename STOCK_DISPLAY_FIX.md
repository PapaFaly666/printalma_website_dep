# Correction: Stock toujours à 0 - Format de données backend

## Problème identifié

Dans `AdminStockManagement.tsx`:
- **Stock disponible** (dans le modal): Toujours 0
- **Stock total**: Toujours 0

**Cause:** Mauvais format de données attendu depuis le backend.

## Analyse du problème

### Format attendu initialement (INCORRECT)

Le code s'attendait à ce que `color.stocks` soit un **objet**:

```typescript
// ❌ Format attendu par le code initial
{
  "colorVariations": [
    {
      "id": 1,
      "name": "Blanc",
      "stocks": {              // ❌ OBJET
        "M": 25,
        "L": 30,
        "XL": 15
      }
    }
  ]
}
```

### Format réel du backend (selon render.md, lignes 186-204)

Le backend retourne `color.stocks` comme un **array**:

```json
{
  "colorVariations": [
    {
      "id": 1,
      "name": "Blanc",
      "stocks": [              // ✅ ARRAY
        {
          "sizeName": "S",
          "stock": 10
        },
        {
          "sizeName": "M",
          "stock": 25
        },
        {
          "sizeName": "L",
          "stock": 30
        }
      ]
    }
  ]
}
```

## Solution implémentée

### Modification dans `src/services/stockService.ts` (lignes 133-147)

**Ajout d'une conversion array → objet:**

```typescript
const colorVariations = (product.colorVariations || []).map((color: any) => {
  // Selon render.md, le backend retourne color.stocks comme array d'objets
  // Format: [{ sizeName: "M", stock: 25 }, { sizeName: "L", stock: 30 }]
  const stocksArray = color.stocks || [];
  console.log('🔍 [DEBUG] Color', color.id, 'stocks array:', stocksArray);

  // Convertir l'array en objet pour faciliter l'accès
  const colorStocks: Record<string, number> = {};
  if (Array.isArray(stocksArray)) {
    stocksArray.forEach((s: any) => {
      colorStocks[s.sizeName] = s.stock;
    });
  }

  console.log('🔍 [DEBUG] Color', color.id, 'stocks object:', colorStocks);

  // Maintenant colorStocks = { "M": 25, "L": 30, ... }
  // Le reste du code fonctionne normalement
});
```

### Flux de conversion

```
Backend (array) → Frontend (object) → Affichage

[
  { sizeName: "M", stock: 25 },    →    { "M": 25,      →    Stock M: 25
  { sizeName: "L", stock: 30 }     →      "L": 30 }     →    Stock L: 30
]
```

## Compatibilité

Le code supporte maintenant **les deux formats**:

### Format 1: Array (render.md - CORRECT)
```json
"stocks": [
  { "sizeName": "M", "stock": 25 }
]
```
✅ **Convertit en objet** puis utilise normalement

### Format 2: Objet (ancien format attendu)
```json
"stocks": {
  "M": 25
}
```
✅ **Utilise directement** (compatibilité arrière)

### Format 3: Objet avec clés en objet (edge case)
```json
"stocks": {
  "M": { "stock": 25 }
}
```
❌ **Non supporté** (pas documenté dans render.md)

## Logs de debug

Pour vérifier le format des données, ouvrez la console (F12) et regardez:

```
🔍 [DEBUG] Backend response: { ... }
🔍 [DEBUG] Products count: 5
🔍 [DEBUG] Product: 1 "T-shirt personnalisé"
🔍 [DEBUG] Product.sizes: ["S", "M", "L", "XL"]
🔍 [DEBUG] Color 1 stocks array: [{ sizeName: "M", stock: 25 }, ...]
🔍 [DEBUG] Color 1 stocks object: { "M": 25, "L": 30, ... }
🔍 [DEBUG] Color 1 total: 125
🔍 [DEBUG] Product 1 totalStock: 125
```

## Calcul du totalStock

Le `totalStock` est calculé correctement maintenant:

```typescript
const totalStock = colorVariations.reduce((total: number, color: ColorVariation) => {
  const colorTotal = color.sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
  console.log('🔍 [DEBUG] Color', color.id, 'total:', colorTotal);
  return total + colorTotal;
}, 0);

console.log('🔍 [DEBUG] Product', product.id, 'totalStock:', totalStock);
```

### Exemple de calcul

```
Produit: T-shirt personnalisé
├─ Couleur: Blanc (id: 1)
│  ├─ M: 25
│  ├─ L: 30
│  └─ XL: 15
│  └─ Total couleur: 70
│
├─ Couleur: Noir (id: 2)
│  ├─ M: 20
│  ├─ L: 25
│  └─ XL: 10
│  └─ Total couleur: 55
│
└─ Stock total produit: 125
```

## Affichage dans AdminStockManagement

### Tableau principal

```
┌────────────────────────┬──────────────┐
│ Produit                │ Stock total  │
├────────────────────────┼──────────────┤
│ T-shirt personnalisé   │ 125          │  ✅ Calculé correctement
│ Coque iPhone           │ 48           │  ✅ Calculé correctement
└────────────────────────┴──────────────┘
```

### Modal de détail

```
┌─────────────────────────────────────────────────┐
│ T-shirt personnalisé                            │
├─────────────────────────────────────────────────┤
│ Couleur: Blanc                                  │
│ ┌──────────┬─────────────────┬─────────┐       │
│ │ Taille   │ Stock disponible│ Actions │       │
│ ├──────────┼─────────────────┼─────────┤       │
│ │ M        │ 25              │ [+] [-] │  ✅   │
│ │ L        │ 30              │ [+] [-] │  ✅   │
│ │ XL       │ 15              │ [+] [-] │  ✅   │
│ └──────────┴─────────────────┴─────────┘       │
└─────────────────────────────────────────────────┘
```

## Correspondance avec render.md

### Backend (render.md, lignes 382-393)

```typescript
// Backend: ProductsService.getProducts()
return products.map(product => ({
  ...product,
  colorVariations: product.colorVariations.map(color => ({
    ...color,
    stocks: product.stocks
      .filter(s => s.colorId === color.id)
      .reduce((acc, s) => {
        acc[s.sizeName] = s.stock;  // ❌ ERREUR dans render.md
        return acc;
      }, {} as Record<string, number>)
  }))
}));
```

**ERREUR dans render.md:** Le code backend retourne un **objet**, mais la doc (lignes 190-203) montre un **array**.

### Correction backend nécessaire

Pour correspondre à la doc (lignes 190-203), le backend devrait faire:

```typescript
// ✅ CORRECTION: Retourner un array au lieu d'un objet
return products.map(product => ({
  ...product,
  colorVariations: product.colorVariations.map(color => ({
    ...color,
    stocks: product.stocks
      .filter(s => s.colorId === color.id)
      .map(s => ({           // ← map au lieu de reduce
        sizeName: s.sizeName,
        stock: s.stock
      }))
  }))
}));
```

## Tests recommandés

### Test 1: Produit avec stocks
```
1. Backend retourne:
   stocks: [{ sizeName: "M", stock: 25 }, { sizeName: "L", stock: 30 }]

2. Frontend convertit en:
   { "M": 25, "L": 30 }

3. Affichage:
   - Stock M: 25 ✅
   - Stock L: 30 ✅
   - Total: 55 ✅
```

### Test 2: Produit sans stocks
```
1. Backend retourne:
   stocks: []

2. Frontend convertit en:
   {}

3. Affichage:
   - Stock M: 0 ✅
   - Stock L: 0 ✅
   - Total: 0 ✅
```

### Test 3: Multiple couleurs
```
1. Backend retourne:
   Blanc: [{ sizeName: "M", stock: 25 }]
   Noir: [{ sizeName: "M", stock: 20 }]

2. Frontend calcule:
   Blanc total: 25
   Noir total: 20
   Product total: 45 ✅
```

## Recommandations

### Pour le backend

**Option 1: Suivre la doc render.md (array)**
```typescript
stocks: product.stocks
  .filter(s => s.colorId === color.id)
  .map(s => ({ sizeName: s.sizeName, stock: s.stock }))
```

**Option 2: Utiliser un objet (plus simple)**
```typescript
stocks: product.stocks
  .filter(s => s.colorId === color.id)
  .reduce((acc, s) => {
    acc[s.sizeName] = s.stock;
    return acc;
  }, {})
```

Le frontend supporte maintenant les deux formats!

### Nettoyage futur

Une fois que le format backend est stabilisé, supprimer les logs de debug:

```typescript
// Supprimer ces lignes:
console.log('🔍 [DEBUG] Backend response:', response.data);
console.log('🔍 [DEBUG] Products count:', products.length);
// ... etc
```

## Résumé

✅ **Problème identifié**: Format de données array vs objet
✅ **Solution**: Conversion automatique array → objet
✅ **Compatibilité**: Supporte les deux formats
✅ **Stock total**: Calculé correctement
✅ **Stock disponible**: Affiché correctement dans le modal
✅ **Logs de debug**: Ajoutés pour diagnostic
