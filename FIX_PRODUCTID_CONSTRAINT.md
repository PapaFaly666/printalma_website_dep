# 🔧 Fix: Contrainte de Clé Étrangère productId

## 🚨 Problème Initial

**Erreur**: `Foreign key constraint violated on the constraint: OrderItem_productId_fkey`

**Cause Racine**: Le frontend utilisait le mauvais champ pour extraire le productId:
- **CartItem.id**: String composite `"1-Blanc-X"` (productId + couleur + taille)
- **CartItem.productId**: Number `1` (vrai ID du produit)

Le code utilisait `cartItem.id` au lieu de `cartItem.productId`, ce qui causait:
- `Number("1-Blanc-X")` → `NaN` → `0` (avec `|| 0`)
- Envoi de `productId: 0` au backend
- Violation de la contrainte de clé étrangère

## ✅ Solution Appliquée

### Principe
Selon la documentation officielle (`FRONTEND_INTEGRATION_GUIDE.md`), il est **INTERDIT** d'envoyer `productId: 0`. Tous les productIds doivent être:
- Supérieurs à 0
- Correspondre à un produit existant dans la base de données

### Structure CartItem
```typescript
interface CartItem {
  id: string;          // ⚠️ ID composite: "1-Blanc-X" (pour identification unique dans le panier)
  productId: number;   // ✅ Vrai ID du produit: 1 (pour les requêtes API)
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  // ...
}
```

### Modifications Effectuées

#### 1. **src/hooks/useOrder.ts** (ligne 107)

**Avant**:
```typescript
const productId = Number(cartItem.id);  // ❌ cartItem.id = "1-Blanc-X" → NaN
if (!productId || productId <= 0) {
  throw new Error(`Invalid productId: ${cartItem.id}. Must be greater than 0`);
}
```

**Après**:
```typescript
// Important: Utiliser productId (number) et non id (string composite "1-Blanc-X")
const productId = Number(cartItem.productId);  // ✅ cartItem.productId = 1
if (!productId || productId <= 0) {
  throw new Error(`Invalid productId: ${cartItem.productId}. Must be greater than 0`);
}
// ...
productId: productId,  // ✅ productId validé
```

#### 2. **src/services/orderService.ts** (lignes 113 et 299)

**Avant (createQuickOrder)**:
```typescript
const productId = Number(cartItem.id);  // ❌ cartItem.id = "1-Blanc-X"
if (!productId || productId <= 0) {
  throw new Error(`Invalid productId: ${cartItem.id}. Must be greater than 0`);
}
```

**Après (createQuickOrder)**:
```typescript
// Important: Utiliser productId (number) et non id (string composite "1-Blanc-X")
const productId = Number(cartItem.productId);  // ✅ cartItem.productId = 1
if (!productId || productId <= 0) {
  throw new Error(`Invalid productId: ${cartItem.productId}. Must be greater than 0`);
}
// ...
productId: productId,  // ✅
```

**Avant (createOrderFromCart)**:
```typescript
orderItems: cartItems.map(item => ({
  productId: Number(item.id) || 0,  // ❌ item.id = "1-Blanc-X"
  quantity: item.quantity || 1,
  // ...
}))
```

**Après (createOrderFromCart)**:
```typescript
// Important: Utiliser productId (number) et non id (string composite "1-Blanc-X")
const validatedItems = cartItems.map((item, index) => {
  const productId = Number(item.productId);  // ✅ item.productId = 1
  if (!productId || productId <= 0) {
    throw new Error(`Invalid productId in cart item ${index}: ${item.productId}. Must be greater than 0`);
  }
  return {
    productId: productId,  // ✅
    quantity: item.quantity || 1,
    // ...
  };
});
// ...
orderItems: validatedItems,
```

#### 3. **src/pages/OrderFormPage.tsx** (ligne 345)

**Avant**:
```typescript
const productId = Number(productData?.id);  // ❌ productData.id = "1-Blanc-X"
if (!productId || productId <= 0) {
  throw new Error(`Invalid productId: ${productData?.id}. Must be greater than 0`);
}
```

**Après**:
```typescript
// Important: Utiliser productId (number) et non id (string composite "1-Blanc-X")
const productId = Number(productData?.productId);  // ✅ productData.productId = 1
if (!productId || productId <= 0) {
  throw new Error(`Invalid productId: ${productData?.productId}. Must be greater than 0`);
}
// ...
orderItems: [{
  productId: productId,  // ✅
  quantity: 1,
  // ...
}]
```

#### 4. **src/services/newOrderService.ts** (ligne 408)

**Avant**:
```typescript
const productIdAsNumber = parseInt(item.id || item.productId, 10);  // ❌ item.id = "1-Blanc-X"
if (isNaN(productIdAsNumber) || productIdAsNumber <= 0) {
  throw new Error(`L'article "..." a un ID de produit invalide (${productIdAsNumber}).`);
}
```

**Après**:
```typescript
// Important: Utiliser productId (number) et non id (string composite "1-Blanc-X")
const productIdAsNumber = parseInt(item.productId, 10);  // ✅ item.productId = 1
if (isNaN(productIdAsNumber) || productIdAsNumber <= 0) {
  throw new Error(`L'article "..." a un ID de produit invalide (${item.productId}). L'ID doit être supérieur à 0.`);
}
```

## 📋 Validation des Modifications

### Tests Effectués
1. ✅ Build TypeScript réussi sans erreurs
2. ✅ Serveur de développement démarre correctement
3. ✅ Validation ajoutée à tous les points d'entrée de création de commande

### Points de Validation
- `useOrder.ts`: Hook de création de commande
- `orderService.ts`: Service de commande (2 méthodes)
- `OrderFormPage.tsx`: Page de formulaire de commande
- `newOrderService.ts`: Nouveau service de commande

## 🎯 Résultats Attendus

### Avant le Fix
```javascript
// Dans le panier
cartItem = {
  id: "1-Blanc-X",        // ⚠️ ID composite
  productId: 1,           // ✅ Vrai ID
  color: "Blanc",
  size: "X"
}

// Code erroné
const productId = Number(cartItem.id);  // Number("1-Blanc-X") → NaN
productId = productId || 0;             // NaN || 0 → 0

// Envoi au backend
{
  orderItems: [{
    productId: 0,  // ❌ Violation de contrainte FK
    quantity: 1
  }]
}
// Résultat: Erreur Foreign key constraint violated
```

### Après le Fix
```javascript
// Dans le panier (inchangé)
cartItem = {
  id: "1-Blanc-X",        // ⚠️ ID composite (pour le panier)
  productId: 1,           // ✅ Vrai ID (pour l'API)
  color: "Blanc",
  size: "X"
}

// Code corrigé
const productId = Number(cartItem.productId);  // Number(1) → 1 ✅
if (!productId || productId <= 0) {
  throw new Error('Invalid productId: Must be greater than 0');
}

// Envoi au backend (si validation réussie)
{
  orderItems: [{
    productId: 1,  // ✅ ID valide
    quantity: 1
  }]
}
// Résultat: Commande créée avec succès
```

## 🔍 Messages d'Erreur

### Messages d'erreur améliorés
Les nouveaux messages d'erreur identifient clairement le problème:

**Avant (message confus)**:
```
Invalid productId: 1-Blanc-X. Must be greater than 0
```
→ L'utilisateur voit "1-Blanc-X" et ne comprend pas pourquoi c'est invalide

**Après (message clair)**:
```
Invalid productId: 1. Must be greater than 0  (si productId est réellement invalide)
```
→ Message clair avec la vraie valeur numérique

Ces messages permettent de:
- Identifier rapidement le problème
- Voir la vraie valeur numérique du productId
- Comprendre la contrainte (> 0)

## 📚 Références

- Documentation officielle: `FRONTEND_INTEGRATION_GUIDE.md`
- Guide backend: `GUIDE_BACKEND_SHIPPING_ADDRESS.md`
- Liste des produits disponibles dans la BDD (IDs valides: 1, 2, 3)

## 🚀 Prochaines Étapes

1. Tester la création de commande avec un produit valide
2. Vérifier que les erreurs de validation s'affichent correctement dans l'UI
3. S'assurer que tous les produits dans le panier ont des IDs valides avant soumission

## 🚨 Points Importants

### Différence entre `id` et `productId`
```typescript
// Structure CartItem
{
  id: "1-Blanc-X",          // ⚠️ String - ID COMPOSITE pour le panier
  productId: 1,             // ✅ Number - Vrai ID pour l'API
  color: "Blanc",
  size: "X"
}
```

**Pourquoi deux IDs ?**
- **`id`**: Identifie de manière unique chaque combinaison (produit + couleur + taille) dans le panier
  - Permet d'avoir le même produit avec des tailles/couleurs différentes
  - Format: `"${productId}-${color}-${size}"`
  - Exemple: `"1-Blanc-X"`, `"1-Noir-L"`, `"1-Blanc-L"`

- **`productId`**: Le vrai ID du produit dans la base de données
  - Utilisé pour toutes les requêtes API
  - Format: Number
  - Exemple: `1`, `2`, `3`

**Règle d'or**:
- ✅ Utiliser `cartItem.productId` pour les requêtes API
- ❌ Ne JAMAIS utiliser `cartItem.id` pour les requêtes API

---

**Date de correction**: 29/10/2025
**Fichiers modifiés**: 4
**Changements**: Utilisation de `productId` au lieu de `id` dans 4 fichiers
**Erreur résolue**: `Foreign key constraint violated on the constraint: OrderItem_productId_fkey`
