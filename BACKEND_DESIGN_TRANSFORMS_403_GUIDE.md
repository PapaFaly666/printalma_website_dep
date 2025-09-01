# 🚨 Guide Backend - Erreur 403 Design Transforms

## Problème identifié

Les appels à `/vendor/design-transforms/:id` retournent une erreur 403 car le frontend envoie l'ID du produit admin au lieu de l'ID du produit vendeur.

### Logs d'erreur observés
```
🚀 API Request: GET /vendor/design-transforms/43 undefined
🚀 API Request: GET /vendor/design-transforms/47 undefined
🚀 API Request: GET /vendor/design-transforms/39 undefined
❌ API Error: 403 Object
⚠️ Échec chargement backend: Request failed with status code 403
🔄 Erreur 403 détectée - Mode conception admin product
```

## Analyse du problème

### Structure des données
- **AdminProduct** (table `product`) : ID = 14, 15, 16, etc.
- **VendorProduct** (table `vendorProduct`) : ID = 409, 410, 411, 412, etc.
- Relation : `vendorProduct.baseProductId` → `product.id`

### Problème d'autorisation
Le backend vérifie que le vendeur connecté a accès au produit via son ID vendeur, pas l'ID admin.

## Solution Frontend implémentée

### 1. Helper `getVendorProductId`
```typescript
// src/utils/vendorProductHelpers.ts
export function getVendorProductId(product: any): number | undefined {
  if (!product) return undefined;
  
  // Architecture V2: nested vendorProduct object
  if (product.vendorProduct && product.vendorProduct.id) {
    return product.vendorProduct.id;
  }
  
  // Flat field sometimes returned by API
  if (product.vendorProductId) {
    return product.vendorProductId;
  }
  
  // If already a vendor product (status not null)
  if (['DRAFT', 'PENDING', 'PUBLISHED'].includes(product.status)) {
    return product.id;
  }
  
  // Fallback: undefined (admin product only)
  return undefined;
}
```

### 2. Composant ProductViewWithDesign
```typescript
// src/components/vendor/ProductViewWithDesign.tsx
const ProductViewWithDesign: React.FC<ProductViewWithDesignProps> = ({ 
  view, 
  designUrl, 
  productId = 0 
}) => {
  const {
    transformStates,
    updateTransform,
    getTransform,
    resetTransforms,
    saveNow,
    isLoading: isLoadingTransforms,
    isSaving,
    lastSaveTime
  } = useDesignTransforms(productId, designUrl);
  
  // ... reste du composant
};
```

### 3. Utilisation dans VendorProductsPage
```typescript
// src/pages/vendor/VendorProductsPage.tsx
const vendorProductId = selectedProduct ? (
  selectedProduct.id ?? // Si c'est déjà un produit vendeur
  selectedProduct.vendorProductId ?? // Champ à plat
  selectedProduct.vendorProduct?.id ?? // Objet imbriqué
  0
) : 0;

<ProductViewWithDesign
  view={selectedProduct.view || {}}
  designUrl={selectedProduct.designUrl || ''}
  productId={vendorProductId}
/>
```

## Vérifications Backend nécessaires

### 1. Endpoint `/vendor/design-transforms/:id`
Vérifier que l'endpoint accepte bien l'ID du vendorProduct et non l'ID de l'adminProduct.

### 2. Middleware d'autorisation
```typescript
// Exemple de vérification côté backend
const vendorProduct = await VendorProduct.findOne({
  where: { 
    id: req.params.id,
    vendorId: req.user.vendorId // Vérifier que le vendeur possède ce produit
  }
});

if (!vendorProduct) {
  return res.status(403).json({ error: 'Accès refusé à ce produit' });
}
```

### 3. Logs de debug recommandés
```typescript
console.log('🎯 GET /vendor/design-transforms/:id', {
  requestedId: req.params.id,
  vendorId: req.user.vendorId,
  isVendorProduct: req.params.id > 400, // Heuristique simple
  foundProduct: !!vendorProduct
});
```

## Tests de validation

### 1. Test avec ID vendeur valide
```bash
curl -X GET "http://localhost:3000/api/v1/vendor/design-transforms/409" \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN"
```

### 2. Test avec ID admin (doit échouer)
```bash
curl -X GET "http://localhost:3000/api/v1/vendor/design-transforms/14" \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN"
```

## Statut de l'implémentation

✅ Frontend : Helper `getVendorProductId` implémenté
✅ Frontend : Composant `ProductViewWithDesign` créé
✅ Frontend : Intégration dans `VendorProductsPage`
⚠️ Backend : Vérification des endpoints nécessaire
⚠️ Backend : Logs de debug à ajouter

## Prochaines étapes

1. Vérifier la logique d'autorisation dans `/vendor/design-transforms/:id`
2. Ajouter des logs de debug côté backend
3. Tester avec des IDs vendeur valides
4. Valider que les transformations se sauvegardent correctement 