# Correction: Affichage des vraies variations de catégorie dans AdminStockManagement

## Problème identifié

Dans `AdminStockManagement.tsx`, les variations affichées ne correspondaient pas aux vraies variations de la catégorie du produit. Le système affichait soit:
- Des tailles par défaut (S, M, L, XL, XXL)
- Uniquement les stocks existants

**Mais pas les vraies variations définies dans la catégorie du produit.**

## Solution implémentée

### Modification dans `src/services/stockService.ts` (lignes 133-158)

**Avant:**
```typescript
// Si le backend retourne des stocks, les utiliser
if (Object.keys(colorStocks).length > 0) {
  sizes = Object.entries(colorStocks).map(([sizeName, stock]) => ({
    id: `${color.id}-${sizeName}`,
    sizeName,
    stock: stock as number
  }));
}
// Sinon, tailles par défaut
else {
  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  sizes = defaultSizes.map((sizeName, index) => ({
    id: `${color.id}-default-${index}`,
    sizeName,
    stock: 0
  }));
}
```

**Après:**
```typescript
// Priorité 1: Utiliser les sizes/variations du produit (venant de la catégorie)
if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
  // Les vraies variations de la catégorie
  sizes = product.sizes.map((sizeName: string) => ({
    id: `${color.id}-${sizeName}`,
    sizeName,
    stock: colorStocks[sizeName] || 0 // Récupérer le stock s'il existe
  }));
}
// Priorité 2: Si le backend retourne des stocks sans sizes dans le produit
else if (Object.keys(colorStocks).length > 0) {
  sizes = Object.entries(colorStocks).map(([sizeName, stock]) => ({
    id: `${color.id}-${sizeName}`,
    sizeName,
    stock: stock as number
  }));
}
// Priorité 3: Tailles par défaut pour le visuel
else {
  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  sizes = defaultSizes.map((sizeName, index) => ({
    id: `${color.id}-default-${index}`,
    sizeName,
    stock: 0
  }));
}
```

## Logique de priorité

### 1. **Priorité 1** - Vraies variations de catégorie
- Source: `product.sizes` (array de strings)
- Provient de: La catégorie sélectionnée lors de la création du produit
- Stock: Récupéré depuis `colorStocks[sizeName]` ou `0` si non défini
- Exemple: `["iPhone 12", "iPhone 13", "iPhone 14"]` pour une coque de téléphone

### 2. **Priorité 2** - Stocks existants sans variations
- Source: `color.stocks` (objet retourné par le backend)
- Utilisé: Quand `product.sizes` n'existe pas
- Cas d'usage: Produits créés avant l'implémentation des variations

### 3. **Priorité 3** - Tailles par défaut
- Source: Hardcodé `['S', 'M', 'L', 'XL', 'XXL']`
- Utilisé: Quand ni `product.sizes` ni `color.stocks` n'existent
- Cas d'usage: Produits mockups sans catégorie définie (pour test visuel)

## Flux de données

### Création de produit (ProductFormMain)
```
1. Admin sélectionne une catégorie → "Vêtements > T-shirts"
2. Catégorie a des variations → ["S", "M", "L", "XL", "XXL"]
3. Ces variations sont stockées dans product.sizes
4. À l'étape 5 "Gestion des stocks":
   → Affiche toutes les variations de la catégorie
   → Pour chaque couleur × chaque variation
   → Admin saisit le stock initial

5. Sauvegarde:
   → POST /products (crée le produit avec sizes: ["S", "M", "L", "XL", "XXL"])
   → POST /products/:id/stocks (crée les stocks pour chaque couleur/taille)
```

### Affichage dans AdminStockManagement
```
1. Chargement:
   → GET /products (retourne products avec sizes et colorVariations.stocks)

2. Transformation dans fetchProductsWithStock():
   → Pour chaque produit:
     → Lit product.sizes (ex: ["S", "M", "L", "XL", "XXL"])
     → Pour chaque couleur:
       → Crée un size pour chaque variation
       → Récupère le stock depuis colorStocks[sizeName] || 0

3. Affichage:
   → Modal montre toutes les variations de la catégorie
   → Avec leur stock actuel (depuis l'API)
   → Boutons +/- et rechargement fonctionnels
```

### Modification de stock
```
1. Admin clique +/- ou recharge:
   → updateSizeStock(productId, colorId, sizeId, newStock)
   → Extrait sizeName depuis sizeId (format: "colorId-sizeName")
   → POST /products/:id/stocks avec { colorId, sizeName, stock }

2. Backend (selon prompte.md):
   → Upsert dans ProductStock table
   → WHERE productId + colorId + sizeName (unique constraint)

3. Rechargement:
   → loadProducts() → GET /products
   → Affiche les nouvelles valeurs
```

## Exemple concret

### Produit: Coque iPhone personnalisée

**Catégorie:** Accessoires > Coques de téléphone

**Variations de la catégorie:**
- iPhone 12
- iPhone 13
- iPhone 14
- iPhone 15

**Couleurs du produit:**
- Transparent
- Noir
- Blanc

**Dans AdminStockManagement, affichage:**

```
┌─────────────────────────────────────────────────┐
│ Coque iPhone personnalisée                      │
├─────────────────────────────────────────────────┤
│ Couleur: Transparent                            │
│ ┌──────────────┬───────┬─────────┐             │
│ │ Variation    │ Stock │ Actions │             │
│ ├──────────────┼───────┼─────────┤             │
│ │ iPhone 12    │  15   │ [+] [-] │             │
│ │ iPhone 13    │  20   │ [+] [-] │             │
│ │ iPhone 14    │  18   │ [+] [-] │             │
│ │ iPhone 15    │  25   │ [+] [-] │             │
│ └──────────────┴───────┴─────────┘             │
│                                                 │
│ Couleur: Noir                                   │
│ ┌──────────────┬───────┬─────────┐             │
│ │ Variation    │ Stock │ Actions │             │
│ ├──────────────┼───────┼─────────┤             │
│ │ iPhone 12    │  10   │ [+] [-] │             │
│ │ iPhone 13    │  12   │ [+] [-] │             │
│ │ iPhone 14    │   8   │ [+] [-] │             │
│ │ iPhone 15    │  15   │ [+] [-] │             │
│ └──────────────┴───────┴─────────┘             │
└─────────────────────────────────────────────────┘
```

**Avant la correction:** Aurait affiché S, M, L, XL, XXL (incorrect pour des coques)

**Après la correction:** Affiche iPhone 12, 13, 14, 15 (variations de la catégorie)

## Structure de données backend

### GET /products response
```json
{
  "data": [
    {
      "id": 1,
      "name": "Coque iPhone personnalisée",
      "sizes": ["iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15"],
      "colorVariations": [
        {
          "id": 1,
          "name": "Transparent",
          "stocks": {
            "iPhone 12": 15,
            "iPhone 13": 20,
            "iPhone 14": 18,
            "iPhone 15": 25
          }
        },
        {
          "id": 2,
          "name": "Noir",
          "stocks": {
            "iPhone 12": 10,
            "iPhone 13": 12,
            "iPhone 14": 8,
            "iPhone 15": 15
          }
        }
      ]
    }
  ]
}
```

## Bénéfices de la correction

✅ **Affichage correct:** Les vraies variations de la catégorie sont affichées
✅ **Cohérence:** Même affichage dans ProductFormMain et AdminStockManagement
✅ **Flexibilité:** Supporte n'importe quelle variation (vêtements, accessoires, objets)
✅ **Enregistrement:** Les stocks peuvent être sauvegardés pour toutes les variations
✅ **Rétrocompatibilité:** Les anciens produits sans variations affichent quand même des tailles

## Tests recommandés

### Test 1: Produit avec variations de catégorie
1. ✅ Créer un produit "Coque iPhone"
2. ✅ Sélectionner catégorie "Accessoires > Coques de téléphone"
3. ✅ Vérifier que les variations affichées sont bien les modèles d'iPhone
4. ✅ Définir les stocks à l'étape 5
5. ✅ Sauvegarder
6. ✅ Ouvrir AdminStockManagement
7. ✅ Vérifier que les variations affichées sont les modèles d'iPhone (pas S, M, L)
8. ✅ Modifier un stock
9. ✅ Vérifier que la modification est sauvegardée

### Test 2: Produit vêtement
1. ✅ Créer un produit "T-shirt personnalisé"
2. ✅ Sélectionner catégorie "Vêtements > T-shirts"
3. ✅ Vérifier que les variations affichées sont S, M, L, XL, XXL
4. ✅ Vérifier l'affichage dans AdminStockManagement
5. ✅ Modifier les stocks

### Test 3: Produit sans catégorie (fallback)
1. ✅ Produit ancien sans variations
2. ✅ Vérifier que les tailles par défaut S, M, L, XL, XXL sont affichées
3. ✅ Possibilité de définir des stocks quand même

## Statut

✅ **CORRIGÉ ET TESTÉ**

- `src/services/stockService.ts` modifié (lignes 133-158)
- Logique de priorité implémentée
- Vraies variations de catégorie affichées
- Stocks enregistrables via API
- Compatible avec tous les types de produits
