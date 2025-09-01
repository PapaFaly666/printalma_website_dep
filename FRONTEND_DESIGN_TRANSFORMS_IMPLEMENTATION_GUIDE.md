# 🎯 FRONTEND - Guide Implémentation Design Transforms

## 📋 PROBLÈME ANALYSÉ

### Erreurs actuelles :
1. **Erreur 403** au chargement initial dans `/vendeur/sell-design`
2. **Transformations non conservées** dans `/vendeur/products` 
3. **Designs toujours centrés** malgré les modifications

### Cause racine :
- Confusion entre **Admin Product ID** et **Vendor Product ID**
- Transformations sauvegardées non récupérées dans l'affichage
- Hook `useDesignTransforms` ne gère pas gracieusement l'erreur 403

## 🔧 SOLUTIONS FRONTEND

### 1. Améliorer la gestion d'erreur 403 dans useDesignTransforms

**Fichier :** `src/hooks/useDesignTransforms.ts`

```typescript
// 🆕 GESTION AMÉLIORÉE ERREUR 403 : Mode graceful pour admin products
if (error?.response?.status === 403) {
  console.log('🔄 Erreur 403 détectée - Mode conception admin product');
  setBackendAvailable(false);
  setAuthError(null); // ✅ Ne pas considérer 403 comme erreur auth bloquante
  
  // Essayer de charger depuis localStorage en fallback
  try {
    const key = `design_transforms_${productId}_${btoa(designUrl)}`;
    const localData = localStorage.getItem(key);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (parsed.transforms && Object.keys(parsed.transforms).length > 0) {
        setTransformStates(parsed.transforms);
        console.log('✅ Transformations chargées depuis localStorage (fallback 403):', parsed.transforms);
        isInitialized.current = true;
        return;
      }
    }
  } catch (localError) {
    console.warn('⚠️ Erreur lecture localStorage après 403:', localError);
  }
  
  console.log('ℹ️ Aucune transformation sauvegardée trouvée, initialisation vide (mode 403)');
  setTransformStates({});
  isInitialized.current = true;
  return;
}
```

### 2. Ajouter un hook pour charger les transformations sauvegardées

**Nouveau fichier :** `src/hooks/useSavedDesignTransforms.ts`

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
      return;
    }

    const loadTransforms = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Essayer de charger depuis le backend
        const backendData = await loadDesignTransforms(productId, designUrl);
        if (backendData?.transforms) {
          setTransforms(backendData.transforms);
          console.log('✅ Transformations chargées depuis backend:', backendData.transforms);
          return;
        }
      } catch (err: any) {
        // 403 = mode conception admin product, pas une vraie erreur
        if (err?.response?.status !== 403) {
          console.warn('⚠️ Erreur chargement backend:', err.message);
        }
      }

      try {
        // 2. Fallback localStorage
        const key = `design_transforms_${productId}_${btoa(designUrl)}`;
        const localData = localStorage.getItem(key);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed.transforms) {
            setTransforms(parsed.transforms);
            console.log('✅ Transformations chargées depuis localStorage:', parsed.transforms);
            return;
          }
        }
      } catch (err) {
        console.warn('⚠️ Erreur lecture localStorage:', err);
      }

      // 3. Aucune transformation trouvée
      setTransforms(null);
      console.log('ℹ️ Aucune transformation sauvegardée trouvée');
      
      setLoading(false);
    };

    loadTransforms();
  }, [productId, designUrl]);

  return { transforms, loading, error };
};
```

### 3. Créer un composant wrapper pour les produits avec design

**Nouveau fichier :** `src/components/ProductWithSavedTransforms.tsx`

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
}

export const ProductWithSavedTransforms: React.FC<ProductWithSavedTransformsProps> = ({
  productId,
  productImage,
  designUrl,
  designConfig,
  className,
  interactive = false,
  showDelimitations = false
}) => {
  const { transforms, loading } = useSavedDesignTransforms(productId, designUrl);

  console.log('🔄 ProductWithSavedTransforms:', {
    productId,
    designUrl: designUrl.substring(0, 50) + '...',
    hasTransforms: !!transforms,
    transformsCount: transforms ? Object.keys(transforms).length : 0,
    transformsData: transforms,
    loading
  });

  if (loading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${className}`}>
        <div className="flex items-center justify-center h-full">
          <span className="text-sm text-gray-500">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <ProductImageWithDesign
      productImage={productImage}
      designUrl={designUrl}
      designConfig={designConfig}
      showDelimitations={showDelimitations}
      className={className}
      interactive={interactive}
      designTransforms={transforms}
    />
  );
};

export default ProductWithSavedTransforms;
```

### 4. Modifier VendorProductService pour inclure les transformations

**Fichier :** `src/services/vendorProductService.ts`

```typescript
// Dans la méthode getVendorProducts, ajouter un chargement des transformations
async getVendorProducts(params?: {
  limit?: number;
  offset?: number;
  status?: 'all' | 'published' | 'draft' | 'pending';
  search?: string;
  includeTransforms?: boolean; // 🆕 Option pour charger les transformations
}): Promise<VendorProductsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);

  const response = await fetch(`${this.baseUrl}/products?${queryParams}`, getRequestOptions());
  
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // 🆕 Si includeTransforms est demandé, charger les transformations pour chaque produit
  if (params?.includeTransforms && data.products) {
    for (const product of data.products) {
      if (product.designApplication?.designBase64) {
        try {
          // Essayer de charger les transformations pour ce produit
          const transformsResponse = await fetch(
            `${this.baseUrl}/design-transforms/${product.id}?designUrl=${encodeURIComponent(product.designApplication.designBase64)}`,
            getRequestOptions()
          );
          
          if (transformsResponse.ok) {
            const transformsData = await transformsResponse.json();
            if (transformsData.data?.transforms) {
              product.designApplication.designTransforms = transformsData.data.transforms;
              console.log(`✅ Transformations chargées pour produit ${product.id}:`, transformsData.data.transforms);
            }
          }
        } catch (error) {
          // Silencieux si pas de transformations (403 ou autre)
          console.log(`ℹ️ Pas de transformations pour produit ${product.id}`);
        }
      }
    }
  }

  return {
    products: data.products.map((product: any) => this.adaptLegacyProduct(product)),
    pagination: data.pagination,
    healthMetrics: data.healthMetrics
  };
}
```

### 5. Modifier ModernVendorProductCard pour utiliser les transformations

**Fichier :** `src/components/vendor/ModernVendorProductCard.tsx`

```typescript
// Remplacer l'utilisation directe de ProductImageWithDesign par ProductWithSavedTransforms
import ProductWithSavedTransforms from '../ProductWithSavedTransforms';

// Dans le rendu de la carte :
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
```

### 6. Modifier useVendorProducts pour charger les transformations

**Fichier :** `src/hooks/useVendorProducts.ts`

```typescript
// Ajouter une option pour charger les transformations
const { products, loading, error, refetch } = useVendorProducts({ 
  includeTransforms: true // 🆕 Charger les transformations automatiquement
});
```

## 🧪 ÉTAPES DE TEST

### 1. Test dans /vendeur/sell-design
```bash
# Ouvrir la console (F12)
# Aller sur /vendeur/sell-design
# Sélectionner un design
# Déplacer le design sur un produit
# Vérifier les logs : "✅ Transformations sauvegardées en localStorage (fallback)"
```

### 2. Test dans /vendeur/products  
```bash
# Aller sur /vendeur/products
# Vérifier les logs : "✅ Transformations chargées pour produit X"
# Vérifier que les designs ne sont pas centrés
# Vérifier que les positions correspondent aux modifications
```

### 3. Test de persistance
```bash
# Modifier position dans /vendeur/sell-design
# Aller sur /vendeur/products 
# Vérifier que la position est conservée
# Rafraîchir la page
# Vérifier que la position est toujours conservée
```

## 🚀 DÉPLOIEMENT

### Ordre d'implémentation :
1. **Créer `useSavedDesignTransforms.ts`**
2. **Créer `ProductWithSavedTransforms.tsx`**  
3. **Modifier `useDesignTransforms.ts`** (gestion 403)
4. **Modifier `VendorProductService`** (includeTransforms)
5. **Modifier `ModernVendorProductCard`** (utiliser nouveau composant)
6. **Modifier `useVendorProducts`** (activer includeTransforms)

### Tests critiques :
- ✅ Erreur 403 ne casse plus l'expérience
- ✅ Transformations sauvegardées en localStorage comme fallback
- ✅ Transformations affichées dans /vendeur/products
- ✅ Persistance entre les pages
- ✅ Rafraîchissement conserve les positions

Cette implémentation permet une **transition smooth** entre la phase conception et l'affichage final des produits vendeur. 