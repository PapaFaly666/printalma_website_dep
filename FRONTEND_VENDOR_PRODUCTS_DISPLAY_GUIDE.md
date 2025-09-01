# 🖼️ FRONTEND - Guide Affichage Transformations Vendeur Products

## 🎯 OBJECTIF

Faire en sorte que les **modifications de déplacement de design** effectuées dans `/vendeur/sell-design` soient **visibles et conservées** dans `/vendeur/products`.

## 📋 ÉTAPES D'IMPLÉMENTATION

### ÉTAPE 1 : Créer le hook useSavedDesignTransforms

**Fichier :** `src/hooks/useSavedDesignTransforms.ts`

```typescript
import { useState, useEffect } from 'react';
import { loadDesignTransforms } from '../services/designTransforms';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export const useSavedDesignTransforms = (productId: number, designUrl: string) => {
  const [transforms, setTransforms] = useState<Record<number, Transform> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !designUrl) {
      setLoading(false);
      setTransforms(null);
      return;
    }

    const loadTransforms = async () => {
      console.log(`🔍 Chargement transformations pour produit ${productId}...`);
      setLoading(true);
      setError(null);

      try {
        // 1. Tentative backend d'abord
        const backendData = await loadDesignTransforms(productId, designUrl);
        if (backendData?.transforms && Object.keys(backendData.transforms).length > 0) {
          setTransforms(backendData.transforms);
          console.log(`✅ Transformations backend trouvées pour produit ${productId}:`, backendData.transforms);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        // Erreur 403 = normal pour admin products en phase conception
        if (err?.response?.status === 403) {
          console.log(`ℹ️ Erreur 403 pour produit ${productId} - Mode conception admin`);
        } else {
          console.warn(`⚠️ Erreur backend pour produit ${productId}:`, err.message);
          setError(err.message);
        }
      }

      try {
        // 2. Fallback localStorage
        const key = `design_transforms_${productId}_${btoa(designUrl)}`;
        const localData = localStorage.getItem(key);
        
        if (localData) {
          const parsed = JSON.parse(localData);
          const savedTransforms = parsed.transforms || parsed;
          
          if (savedTransforms && Object.keys(savedTransforms).length > 0) {
            setTransforms(savedTransforms);
            console.log(`✅ Transformations localStorage trouvées pour produit ${productId}:`, savedTransforms);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn(`⚠️ Erreur localStorage pour produit ${productId}:`, err);
      }

      // 3. Aucune transformation trouvée
      console.log(`ℹ️ Aucune transformation pour produit ${productId}`);
      setTransforms(null);
      setLoading(false);
    };

    loadTransforms();
  }, [productId, designUrl]);

  return { 
    transforms, 
    loading, 
    error,
    hasTransforms: transforms && Object.keys(transforms).length > 0
  };
};
```

### ÉTAPE 2 : Créer le composant ProductWithSavedTransforms

**Fichier :** `src/components/ProductWithSavedTransforms.tsx`

```typescript
import React from 'react';
import ProductImageWithDesign from './ProductImageWithDesign';
import { useSavedDesignTransforms } from '../hooks/useSavedDesignTransforms';

interface ProductWithSavedTransformsProps {
  productId: number;
  productImage: {
    id: number;
    url: string;
    viewType: string;
    delimitations: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
    }>;
  };
  designUrl: string;
  designConfig?: {
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  };
  className?: string;
  interactive?: boolean;
  showDelimitations?: boolean;
  fallbackComponent?: React.ReactNode;
}

export const ProductWithSavedTransforms: React.FC<ProductWithSavedTransformsProps> = ({
  productId,
  productImage,
  designUrl,
  designConfig = { positioning: 'CENTER', scale: 0.6 },
  className = '',
  interactive = false,
  showDelimitations = false,
  fallbackComponent
}) => {
  const { transforms, loading, hasTransforms } = useSavedDesignTransforms(productId, designUrl);

  console.log(`🎯 ProductWithSavedTransforms - Produit ${productId}:`, {
    designUrl: designUrl.substring(0, 50) + '...',
    hasTransforms,
    transformsCount: transforms ? Object.keys(transforms).length : 0,
    transformsData: transforms,
    loading,
    hasDelimitations: productImage?.delimitations?.length > 0
  });

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Chargement transformations...</span>
        </div>
      </div>
    );
  }

  // Si pas de transformations et fallback fourni
  if (!hasTransforms && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Rendu avec transformations (ou sans transformations = position par défaut)
  return (
    <div className="relative">
      <ProductImageWithDesign
        productImage={productImage}
        designUrl={designUrl}
        designConfig={designConfig}
        showDelimitations={showDelimitations}
        className={className}
        interactive={interactive}
        designTransforms={transforms}
      />
      
      {/* Badge indicateur transformations */}
      {hasTransforms && !interactive && (
        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full opacity-75">
          Personnalisé
        </div>
      )}
    </div>
  );
};

export default ProductWithSavedTransforms;
```

### ÉTAPE 3 : Modifier ModernVendorProductCard

**Fichier :** `src/components/vendor/ModernVendorProductCard.tsx`

```typescript
// Ajouter l'import
import ProductWithSavedTransforms from '../ProductWithSavedTransforms';

// Dans le composant ModernVendorProductCard, remplacer cette section :

{/* Image du produit */}
<div className="relative w-full h-48">
  {/* 🆕 CORRECTION: Utiliser ProductWithSavedTransforms pour conserver les positions */}
  {hasDesign && designUrl && productImageData ? (
    <ProductWithSavedTransforms
      productId={product.id}
      productImage={productImageData}
      designUrl={designUrl}
      designConfig={{
        positioning: product.designApplication?.positioning || 'CENTER',
        scale: product.designApplication?.scale || 0.6
      }}
      className="w-full h-full"
      interactive={false}
      showDelimitations={false}
      fallbackComponent={
        <ProductImageDisplay
          src={imageUrl}
          alt={product.name}
          className="w-full h-full"
          hasDesign={hasDesign}
          showDesignBadge={true}
        />
      }
    />
  ) : (
    <ProductImageDisplay
      src={imageUrl}
      alt={product.name}
      className="w-full h-full"
      hasDesign={hasDesign}
      showDesignBadge={true}
    />
  )}
  
  {/* 🎨 Indicateur de couleurs (Architecture V2) */}
  {availableColors.length > 1 && (
    <div className="absolute bottom-2 right-2 flex gap-1">
      {availableColors.slice(0, 3).map((color: any, index: number) => (
        <div
          key={color.id || index}
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: color.colorCode || '#ccc' }}
          title={color.name}
        />
      ))}
      {availableColors.length > 3 && (
        <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-sm flex items-center justify-center">
          <span className="text-xs text-white font-bold">+</span>
        </div>
      )}
    </div>
  )}
</div>
```

### ÉTAPE 4 : Modifier VendorProductCardWithDesign (si utilisé)

**Fichier :** `src/components/VendorProductCardWithDesign.tsx`

```typescript
// Remplacer l'utilisation de ProductImageWithDesign par ProductWithSavedTransforms
import ProductWithSavedTransforms from './ProductWithSavedTransforms';

// Dans le rendu :
<ProductWithSavedTransforms
  productId={product.id}
  productImage={productImageData}
  designUrl={product.designApplication?.designBase64 || ''}
  designConfig={{
    positioning: product.designApplication?.positioning || 'CENTER',
    scale: product.designApplication?.scale || 0.6
  }}
  className="w-full h-full object-cover"
  interactive={false}
  showDelimitations={false}
/>
```

### ÉTAPE 5 : Optionnel - Charger les transformations en masse

**Fichier :** `src/services/vendorProductService.ts`

```typescript
// Méthode pour charger les transformations de tous les produits d'un coup
async loadTransformsForProducts(products: VendorProduct[]): Promise<VendorProduct[]> {
  const productsWithTransforms = await Promise.all(
    products.map(async (product) => {
      if (product.designApplication?.designBase64) {
        try {
          const transformsResponse = await fetch(
            `${this.baseUrl}/design-transforms/${product.id}?designUrl=${encodeURIComponent(product.designApplication.designBase64)}`,
            getRequestOptions()
          );
          
          if (transformsResponse.ok) {
            const transformsData = await transformsResponse.json();
            if (transformsData.data?.transforms) {
              return {
                ...product,
                designApplication: {
                  ...product.designApplication,
                  designTransforms: transformsData.data.transforms
                }
              };
            }
          }
        } catch (error) {
          // Silencieux - pas grave si pas de transformations
          console.log(`ℹ️ Pas de transformations pour produit ${product.id}`);
        }
      }
      return product;
    })
  );

  return productsWithTransforms;
}
```

## 🧪 TESTS DE VALIDATION

### Test 1 : Vérification du chargement des transformations

```typescript
// Console Browser (F12)
// Sur la page /vendeur/products, vérifier les logs :

// ✅ Attendu :
// 🔍 Chargement transformations pour produit 15...
// ✅ Transformations localStorage trouvées pour produit 15: {0: {x: 100, y: 50, scale: 1.2}}
// 🎯 ProductWithSavedTransforms - Produit 15: {hasTransforms: true, transformsCount: 1, ...}
```

### Test 2 : Vérification visuelle

```bash
1. Aller sur /vendeur/sell-design
2. Sélectionner un design et le déplacer sur un produit
3. Aller sur /vendeur/products
4. Vérifier que le design n'est PAS centré
5. Vérifier que la position correspond au déplacement effectué
6. Rafraîchir la page
7. Vérifier que la position est conservée
```

### Test 3 : Badge de personnalisation

```bash
# Vérifier qu'un petit badge "Personnalisé" apparaît sur les produits 
# qui ont des transformations sauvegardées
```

## 🚀 DÉPLOIEMENT RAPIDE

### Script d'installation complète :

```bash
# 1. Créer les nouveaux fichiers
touch src/hooks/useSavedDesignTransforms.ts
touch src/components/ProductWithSavedTransforms.tsx

# 2. Copier le contenu des étapes 1 et 2 dans ces fichiers

# 3. Modifier ModernVendorProductCard.tsx selon l'étape 3

# 4. Tester sur /vendeur/products
```

### Ordre de priorité :
1. **CRITIQUE** : Étapes 1, 2, 3 (hook + composant + card)
2. **IMPORTANT** : Étape 4 (autres composants si utilisés)
3. **OPTIONNEL** : Étape 5 (chargement en masse backend)

## ✅ RÉSULTAT ATTENDU

Après implémentation :

- ✅ **Erreur 403 ne casse plus l'expérience** - Mode graceful
- ✅ **Transformations visibles dans /vendeur/products** - Positions conservées  
- ✅ **Persistance complète** - Rafraîchissement + navigation
- ✅ **Fallback localStorage robuste** - Même si backend indisponible
- ✅ **Badge personnalisation** - Distinction visuelle produits modifiés
- ✅ **Performance optimisée** - Chargement en parallèle

### Scénario utilisateur final :
1. Vendeur va sur `/vendeur/sell-design`
2. Sélectionne un design et le déplace/redimensionne
3. Va sur `/vendeur/products`
4. **VOIT ses modifications conservées** ✨
5. Rafraîchit la page  
6. **Modifications toujours là** ✨ 