# 📘 Alignement des endpoints selon le guide API Publication Vendeur

## Changements effectués

### 1. ✅ POST `/vendor/designs` - Création de design
**Statut** : Déjà implémenté correctement
- Fichier : `src/services/designService.ts`
- Méthode : `createDesign()` avec fallback vers POST `/vendor/designs`
- Payload : `{ name, category, imageBase64, description?, tags? }`

### 2. ✅ POST `/vendor/products` - Création de produit vendeur
**Statut** : Déjà implémenté correctement
- Fichier : `src/services/vendorProductService.ts`
- Méthode : `createVendorProduct()`
- Payload : `{ baseProductId, designId, vendorName, vendorPrice, vendorStock, selectedColors, selectedSizes, postValidationAction, productStructure }`

### 3. 🆕 POST `/vendor/design-transforms/save` - Sauvegarde des transformations
**Statut** : Nouvellement ajouté dans le workflow
- Fichier : `src/hooks/useVendorPublish.ts`
- Ajout : Étape 3 du workflow après création du produit
- Payload : `{ vendorProductId, designUrl, transforms: { "0": { x, y, scale } }, lastModified }`

### 4. ✅ GET `/vendor/design-transforms/:vendorProductId` - Récupération des transformations
**Statut** : Déjà implémenté correctement
- Fichier : `src/services/designTransformsAPI.ts`
- Méthode : `loadDesignTransforms()`

### 5. 🔧 Amélioration de la récupération du statut de validation
**Statut** : Ajout de fallbacks pour plus de robustesse
- Fichier : `src/services/designService.ts`
- Méthode : `getDesignValidationStatus()`
- Fallbacks : `/vendor/designs/:id` → `/vendor/designs?status=all` → VendorDesignProductAPI → Legacy endpoints

## Workflow complet implémenté

```typescript
// 1. Créer un design
const designResponse = await fetch('/vendor/designs', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Dragon Mystique',
    category: 'LOGO',
    imageBase64: 'data:image/png;base64,iVBORw0K...'
  })
});

// 2. Créer un produit vendeur
const productResponse = await fetch('/vendor/products', {
  method: 'POST',
  body: JSON.stringify({
    baseProductId: 10,
    designId: 42,
    vendorName: 'T-shirt Dragon',
    vendorPrice: 24.9,
    vendorStock: 100,
    selectedColors: [{ id: 1, name: 'Black', colorCode: '#000' }],
    selectedSizes: [{ id: 3, sizeName: 'L' }],
    postValidationAction: 'AUTO_PUBLISH',
    productStructure: { designApplication: { scale: 0.8 } }
  })
});

// 3. Sauvegarder les transformations du design
const transformsResponse = await fetch('/vendor/design-transforms/save', {
  method: 'POST',
  body: JSON.stringify({
    vendorProductId: 123,
    designUrl: 'https://…/dragon.png',
    transforms: { "0": { x: 30, y: 35, scale: 0.9 } },
    lastModified: Date.now()
  })
});

// 4. (Optionnel) Récupérer les transformations pour édition
const loadedTransforms = await fetch('/vendor/design-transforms/123');
```

## Fichiers modifiés

1. **src/hooks/useVendorPublish.ts**
   - Ajout de l'étape 3 : sauvegarde des transformations après création du produit
   - Import dynamique de `saveDesignTransforms`

2. **src/services/designService.ts**
   - Ajout d'un fallback via listing des designs pour `getDesignValidationStatus`
   - Amélioration de la robustesse avec plusieurs tentatives d'endpoints

3. **src/services/vendorProductService.ts**
   - Déjà aligné sur POST `/vendor/products`

4. **src/services/designTransformsAPI.ts**
   - Déjà aligné sur les bons endpoints

## Endpoints utilisés (conformes au guide)

- ✅ POST `/vendor/designs`
- ✅ POST `/vendor/products`
- ✅ POST `/vendor/design-transforms/save`
- ✅ GET `/vendor/design-transforms/:vendorProductId`
- 🆕 GET `/vendor/designs?status=all` (fallback pour validation)

## Tous les cookies de session sont inclus

Tous les appels utilisent `credentials: 'include'` pour envoyer les cookies de session comme spécifié dans le guide. 