# 🛒 Frontend - Affichage Produits Vendeur avec Design V2 : Implementation Complète

## 📋 Résumé des modifications

Ce guide documente l'implémentation complète du nouveau système d'affichage des produits vendeur avec design incorporé, respectant exactement le même positionnement et dimensionnement défini dans `/vendeur/sell-design`.

## 🎯 Objectif

Basé sur la documentation fournie :
- Récupérer les produits vendeur avec leurs détails complets
- Obtenir les délimitations d'impression sur les mock-ups
- Charger les positions enregistrées des designs
- Afficher les designs exactement là où ils ont été définis

## 🔧 Composants créés/modifiés

### 1. Service API : `vendorProductDetailAPI.ts`

**Nouveau service** conforme à la documentation :

```typescript
// Types basés sur la documentation
export interface VendorProductDetail {
  id: number;
  designApplication: {
    designUrl: string;
    positioning: string;
    scale: number;
  };
  adminProduct: {
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        url: string;
        viewType: string;
        delimitations: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          coordinateType: 'PIXEL' | 'PERCENT';
        }>;
      }>;
    }>;
  };
  selectedColors: Array<{...}>;
  designId: number;
}

// Fonctions principales
export async function fetchVendorProductDetail(vpId: number): Promise<VendorProductDetail>
export async function fetchDesignPosition(vpId: number, designId: number): Promise<DesignPosition | null>
export function calculateDesignPosition(delimitation, savedPosition, fallbackScale, imageWidth, imageHeight): DesignPosition
export function useVendorProductDetail(vpId: number) // Hook React
```

### 2. Composant d'affichage : `ProductDesignPreviewV2.tsx`

**Nouveau composant** utilisant les délimitations et positions absolues :

```typescript
interface ProductDesignPreviewV2Props {
  vendorProductId: number;
  selectedColorId?: number;
  showInfo?: boolean;
  width?: number;
  height?: number;
  onError?: (error: string) => void;
  onEdit?: () => void;
}
```

**Fonctionnalités clés** :
- Récupération automatique des détails via `useVendorProductDetail()`
- Calcul des positions selon la documentation
- Rendu Canvas avec délimitations exactes
- Gestion des unités PIXEL/PERCENT
- Fallback centré si aucune position sauvegardée

### 3. Page produits : `VendorProductsPage.tsx`

**Modifications** :
- Simplification du mapping des produits (pas de calcul de position côté liste)
- Utilisation de `ProductDesignPreviewV2` au lieu de l'ancien composant
- Interface simplifiée `VendorProductListItem`
- Gestion d'erreurs améliorée

## 📡 Workflow d'affichage (selon documentation)

### 1. Récupération liste produits
```
GET /vendor/products?limit=20&offset=0
```

### 2. Détails produit sélectionné
```
GET /vendor/products/{productId}
```

### 3. Position design enregistrée
```
GET /api/vendor-products/{vpId}/designs/{designId}/position/direct
```

### 4. Calcul position finale

```typescript
function calculateDesignPosition(delimitation, savedPosition, fallbackScale, imageWidth, imageHeight) {
  // 1. Adapter les unités (PERCENT -> PIXEL)
  let delim = { ...delimitation };
  if (delimitation.coordinateType === 'PERCENT') {
    delim.x = (delimitation.x / 100) * imageWidth;
    delim.y = (delimitation.y / 100) * imageHeight;
    delim.width = (delimitation.width / 100) * imageWidth;
    delim.height = (delimitation.height / 100) * imageHeight;
  }

  // 2. Utiliser position sauvegardée si disponible
  if (savedPosition) {
    return savedPosition;
  }

  // 3. Fallback : centrer dans la délimitation
  const centerX = delim.x + delim.width / 2;
  const centerY = delim.y + delim.height / 2;
  
  return {
    x: centerX,
    y: centerY,
    scale: fallbackScale,
    rotation: 0
  };
}
```

### 5. Rendu Canvas

```typescript
async function renderProductWithDesign(product, savedPosition, canvasId) {
  // 1. Choisir couleur et mock-up
  const selectedColor = product.selectedColors[0];
  const colorVariation = product.adminProduct.colorVariations.find(cv => cv.id === selectedColor.id);
  const mockupImage = colorVariation.images.find(img => img.viewType === 'FRONT') || colorVariation.images[0];
  
  // 2. Charger images
  const mockupImg = await loadImage(mockupImage.url);
  const designImg = await loadImage(product.designApplication.designUrl);
  
  // 3. Configurer canvas
  canvas.width = mockupImg.width;
  canvas.height = mockupImg.height;
  
  // 4. Dessiner mock-up
  ctx.drawImage(mockupImg, 0, 0);
  
  // 5. Calculer position finale
  const delimitation = mockupImage.delimitations[0];
  const finalPosition = calculateDesignPosition(delimitation, savedPosition, product.designApplication.scale, mockupImg.width, mockupImg.height);
  
  // 6. Dessiner design avec transformations
  ctx.save();
  ctx.translate(finalPosition.x, finalPosition.y);
  ctx.rotate((finalPosition.rotation * Math.PI) / 180);
  ctx.scale(finalPosition.scale, finalPosition.scale);
  ctx.drawImage(designImg, -designImg.width / 2, -designImg.height / 2, designImg.width, designImg.height);
  ctx.restore();
}
```

## 🧪 Tests et vérification

### Fichier de test : `test-vendor-products-v2-display.html`

**Test complet** implémentant :
- Workflow selon la documentation
- Calcul des positions avec exemples
- Rendu Canvas des produits
- Logs détaillés pour debug
- Gestion des erreurs

### Utilisation :
```bash
# Ouvrir dans le navigateur
open test-vendor-products-v2-display.html

# Vérifier les logs de la console
# Tester différents scénarios (position sauvegardée vs fallback)
```

## 🎨 Avantages de la nouvelle architecture

### 1. **Positionnement exact**
- Respect des délimitations d'impression
- Positions absolues (pixels) au lieu de pourcentages
- Cohérence avec `/vendeur/sell-design`

### 2. **Performance améliorée**
- Chargement différé des détails (seulement si nécessaire)
- Cache des positions via le hook `useVendorProductDetail`
- Rendu Canvas optimisé

### 3. **Maintenabilité**
- Code séparé par responsabilité
- Types TypeScript stricts
- Documentation complète

### 4. **Extensibilité**
- Support des couleurs multiples
- Gestion des rotations
- Adaptable aux futures évolutions

## 📊 Différences avec l'ancien système

| Aspect | Ancien système | Nouveau système V2 |
|--------|---------------|-------------------|
| **Positionnement** | Pourcentages (0-1) | Pixels absolus dans délimitations |
| **Chargement** | Tout en une fois | Différé par besoin |
| **Rendu** | Transform CSS | Canvas avec délimitations |
| **Position** | Calculée côté liste | Récupérée depuis API |
| **Fallback** | Centre global | Centre dans délimitation |

## 🚀 Déploiement

### 1. Fichiers à déployer
```
src/services/vendorProductDetailAPI.ts
src/components/vendor/ProductDesignPreviewV2.tsx
src/pages/vendor/VendorProductsPage.tsx (modifié)
```

### 2. Vérifications
- [ ] API endpoints disponibles
- [ ] Authentification configurée
- [ ] Images Cloudinary accessibles
- [ ] Tests passants

### 3. Rollback si nécessaire
```typescript
// Revenir à l'ancien composant
import ProductDesignPreview from '../../components/vendor/ProductDesignPreview';
// au lieu de ProductDesignPreviewV2
```

## 📝 Notes importantes

### Gestion des erreurs
- **403** : Produit n'appartient pas au vendeur
- **404** : Produit ou design introuvable
- **Position null** : Fallback automatique au centre de la délimitation

### Performance
- Le rendu Canvas est async et peut prendre quelques secondes
- Les images sont mises en cache par le navigateur
- Throttling recommandé pour les sauvegardes de position

### Compatibilité
- Fonctionne avec l'architecture V2 du backend
- Rétrocompatible avec les anciens produits (fallback)
- Support des formats d'image modernes (WebP, AVIF)

---

✅ **L'implémentation est maintenant complète et respecte exactement la documentation fournie pour l'affichage des produits avec design incorporé, avec le même positionnement et dimensionnement défini dans `/vendeur/sell-design`.** 