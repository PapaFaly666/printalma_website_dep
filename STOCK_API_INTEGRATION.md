# Intégration API pour la Gestion des Stocks - TERMINÉ ✅

## Vue d'ensemble

La gestion des stocks a été migrée de localStorage vers l'API backend. Tous les composants utilisent maintenant les endpoints API pour la persistance des données.

## Modifications effectuées

### 1. `src/services/stockService.ts`

#### Configuration
- **STOCK_MODE**: Configuré à `'api'` (ligne 10)
- Supporte 3 modes: `'localStorage'`, `'api'`, `'hybrid'`

#### Fonctions modifiées

##### `fetchProductsWithStock()` (lignes 111-221)
- ✅ Récupère les stocks depuis l'API backend via `GET /products`
- ✅ Parse l'objet `stocks` retourné par le backend (format: `{ sizeName: stock }`)
- ✅ Gère les cas où aucun stock n'existe (retourne 0)
- ✅ Supporte les tailles par défaut pour le visuel

##### `updateSizeStock()` (lignes 226-285)
- ✅ Converti en fonction async
- ✅ Utilise `POST /products/:id/stocks` en mode API
- ✅ Extrait le `sizeName` depuis le `sizeId` (format: `colorId-sizeName`)
- ✅ Appelle `updateProductStocks()` pour la mise à jour bulk
- ✅ Garde la compatibilité localStorage en mode localStorage

##### `rechargeStock()` (lignes 290-360)
- ✅ Converti en fonction async
- ✅ Récupère d'abord les stocks via `getProductStocks()` pour trouver le `stockId`
- ✅ Utilise `POST /products/:id/stocks/:stockId/recharge` en mode API
- ✅ Gère correctement le mapping `sizeId` → `sizeName` → `stockId`

##### `updateProductStocks()` (lignes 364-393)
- ✅ Déjà implémenté pour l'API
- ✅ Utilise `POST /products/:id/stocks` avec payload bulk
- ✅ Supporte mode localStorage/api/hybrid

##### `getProductStocks()` (lignes 398-417)
- ✅ Déjà implémenté pour l'API
- ✅ Utilise `GET /products/:id/stocks`

##### `rechargeStockAPI()` (lignes 422-441)
- ✅ Déjà implémenté pour l'API
- ✅ Utilise `POST /products/:id/stocks/:stockId/recharge`

### 2. `src/pages/admin/AdminStockManagement.tsx`

#### Modifications

##### `handleProductClick()` (lignes 106-111)
- ✅ Supprimé `initializeStocksForProduct()` (stocks viennent de l'API)
- ✅ Simplifié: affiche directement le produit

##### `handleStockAdjust()` (lignes 114-181)
- ✅ Converti en fonction async
- ✅ Appelle `await updateSizeStock()` pour la mise à jour API
- ✅ Recharge les produits via `loadProducts()` après mise à jour
- ✅ Gestion d'erreur avec try/catch et alerte utilisateur

##### `handleRecharge()` (lignes 184-216)
- ✅ Converti en fonction async
- ✅ Appelle `await rechargeStock()` pour la mise à jour API
- ✅ Recharge les produits via `loadProducts()` après mise à jour
- ✅ Gestion d'erreur avec try/catch et alerte utilisateur

##### Supprimé
- ❌ `initializeStocksForProduct()` - Plus nécessaire car stocks chargés depuis l'API

### 3. `src/components/product-form/ProductFormMain.tsx`

#### État actuel
- ✅ Déjà configuré pour utiliser `updateProductStocks()` (ligne 1392)
- ✅ Gère la création et l'édition de produits
- ✅ Sauvegarde les stocks après succès de création/modification
- ✅ Gestion d'erreur avec try/catch et toast notifications

### 4. `src/hooks/useProductForm.ts`

#### État actuel
- ✅ Déjà configuré pour utiliser `updateProductStocks()` (ligne 250)
- ✅ Mappe correctement les IDs de couleur frontend → backend
- ✅ Sauvegarde les stocks après création du produit

## Structure des données

### Format frontend → backend

```typescript
// Format envoyé à l'API
{
  stocks: [
    {
      colorId: 1,          // ID de la variation de couleur
      sizeName: "M",       // Nom de la taille (string)
      stock: 25            // Quantité en stock
    },
    // ...
  ]
}
```

### Format backend → frontend

```typescript
// Retourné par GET /products
{
  colorVariations: [
    {
      id: 1,
      name: "Blanc",
      stocks: {          // Objet avec sizeName → stock
        "S": 10,
        "M": 25,
        "L": 30
      }
    }
  ]
}
```

### Mapping des IDs

- **Frontend**: `sizeId` est généré comme `${colorId}-${sizeName}` (ex: `1-M`)
- **Backend**: `stockId` est l'ID auto-incrémenté de la table `ProductStock`
- **Conversion**: Extraction du `sizeName` depuis `sizeId` pour trouver le `stockId` via `getProductStocks()`

## Endpoints API utilisés

### `POST /products/:id/stocks`
- **Usage**: Création/mise à jour bulk des stocks
- **Called by**:
  - `updateProductStocks()` - Création/édition de produit
  - `updateSizeStock()` - Ajustement individuel

### `GET /products/:id/stocks`
- **Usage**: Récupération des stocks d'un produit
- **Called by**:
  - `getProductStocks()` - Pour trouver le stockId
  - `rechargeStock()` - Avant rechargement

### `POST /products/:id/stocks/:stockId/recharge`
- **Usage**: Rechargement d'un stock (ajout)
- **Called by**:
  - `rechargeStockAPI()` - Rechargement de stock
  - `rechargeStock()` - Via mapping

### `GET /products`
- **Usage**: Récupération de tous les produits avec stocks
- **Called by**:
  - `fetchProductsWithStock()` - AdminStockManagement

## Flux de données

### Création de produit (ProductFormMain)

```
1. Utilisateur remplit le formulaire
   ├─ Étape 1-4: Infos produit, couleurs, catégories, images
   └─ Étape 5: Saisie des stocks par couleur/taille

2. Clic sur "Créer le produit"
   ├─ useProductForm.submitForm()
   ├─ ProductService.createProduct() → Backend crée le produit
   └─ Reçoit l'ID du produit créé

3. Sauvegarde des stocks
   ├─ Mappe les IDs de couleur frontend → backend
   ├─ Appelle updateProductStocks(productId, stocks)
   └─ POST /products/:id/stocks

4. Confirmation utilisateur
   └─ Toast success
```

### Modification de stock (AdminStockManagement)

```
1. Admin clique sur un produit
   └─ Modal s'ouvre avec stocks actuels (depuis API)

2. Admin ajuste un stock (+/-)
   ├─ handleStockAdjust(productId, colorId, sizeId, currentStock, delta)
   ├─ Calcule newStock = currentStock + delta
   ├─ updateSizeStock(productId, colorId, sizeId, newStock)
   │  ├─ Extrait sizeName depuis sizeId
   │  └─ POST /products/:id/stocks
   └─ Recharge loadProducts() pour afficher les données à jour

3. Admin recharge un stock
   ├─ handleRecharge(productId, colorId, sizeId)
   ├─ rechargeStock(productId, colorId, sizeId, amount)
   │  ├─ GET /products/:id/stocks pour trouver stockId
   │  └─ POST /products/:id/stocks/:stockId/recharge
   └─ Recharge loadProducts() pour afficher les données à jour
```

## Tests recommandés

### Test 1: Création de produit avec stocks
1. ✅ Créer un nouveau produit mockup
2. ✅ Ajouter des variations de couleur
3. ✅ Sélectionner des tailles à l'étape 3
4. ✅ Définir les stocks à l'étape 5
5. ✅ Vérifier que les stocks sont sauvegardés dans la DB
6. ✅ Vérifier l'affichage dans AdminStockManagement

### Test 2: Modification de produit avec stocks
1. ✅ Éditer un produit existant
2. ✅ Modifier les stocks à l'étape 5
3. ✅ Sauvegarder
4. ✅ Vérifier que les stocks sont mis à jour dans la DB
5. ✅ Vérifier l'affichage dans AdminStockManagement

### Test 3: Ajustement de stock
1. ✅ Ouvrir AdminStockManagement
2. ✅ Cliquer sur un produit
3. ✅ Ajuster un stock (+/-)
4. ✅ Vérifier la mise à jour immédiate
5. ✅ Recharger la page et vérifier la persistance

### Test 4: Rechargement de stock
1. ✅ Ouvrir AdminStockManagement
2. ✅ Cliquer sur un produit
3. ✅ Saisir une quantité et cliquer "Recharger"
4. ✅ Vérifier l'ajout au stock existant
5. ✅ Recharger la page et vérifier la persistance

## Migration et rollback

### Si problème avec l'API

Changer le `STOCK_MODE` dans `src/services/stockService.ts`:

```typescript
// Rollback temporaire vers localStorage
const STOCK_MODE: 'localStorage' | 'api' | 'hybrid' = 'localStorage';

// Ou mode hybrid (les deux en parallèle)
const STOCK_MODE: 'localStorage' | 'api' | 'hybrid' = 'hybrid';
```

### Nettoyage futur

Une fois l'API stable en production, supprimer:
- Fonctions localStorage (`loadStocksFromLocalStorage`, `saveStocksToLocalStorage`, etc.)
- Logique conditionnelle `if (STOCK_MODE === 'localStorage')`
- Constante `STOCK_STORAGE_KEY`
- Interface `StockData`

## Statut final

✅ **STOCK_MODE configuré à 'api'**
✅ **fetchProductsWithStock() utilise l'API**
✅ **updateSizeStock() utilise l'API**
✅ **rechargeStock() utilise l'API**
✅ **AdminStockManagement.tsx mis à jour (async)**
✅ **ProductFormMain.tsx déjà compatible**
✅ **useProductForm.ts déjà compatible**
✅ **Gestion d'erreur complète**
✅ **Rechargement des données après modification**

## Prochaines étapes (optionnel)

1. **Tests E2E** avec Playwright/Cypress
2. **Optimisation**: Utiliser React Query pour le caching
3. **Notifications**: Alertes automatiques quand stock < seuil
4. **Historique**: Table d'audit des changements de stock
5. **Concurrence**: Gérer les modifications simultanées (optimistic locking)
6. **Performance**: Pagination pour AdminStockManagement si > 100 produits
