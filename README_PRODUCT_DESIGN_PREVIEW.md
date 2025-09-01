# Système d'Aperçu de Produits avec Designs

Ce document explique comment utiliser les composants d'aperçu pour visualiser les produits avec des designs superposés, créés selon les spécifications demandées.

## 📋 Composants Créés

### 1. `ProductDesignPreview` (Composant de Base)
**Fichier:** `src/components/vendor/ProductDesignPreview.tsx`

Composant de base pour afficher un produit avec un design superposé selon les transformations normalisées.

#### Props
```typescript
interface ProductDesignPreviewProps {
  // Images
  productImageUrl: string;        // URL de l'image du produit (fond)
  designUrl: string;              // URL de l'image du design (superposition)
  
  // Transformations normalisées
  positionX: number;              // 0-1 (pourcentage horizontal)
  positionY: number;              // 0-1 (pourcentage vertical)
  scale: number;                  // 0.1-2 (facteur d'échelle)
  rotation: number;               // 0-360 (rotation en degrés)
  
  // Métadonnées optionnelles
  productName?: string;
  designName?: string;
  
  // Options d'affichage
  showInfo?: boolean;             // Afficher les informations overlay
  className?: string;
  width?: number;
  height?: number;
  
  // Callback pour les erreurs
  onError?: (error: string) => void;
}
```

#### Exemple d'utilisation
```tsx
<ProductDesignPreview
  productImageUrl="https://example.com/product.jpg"
  designUrl="https://example.com/design.png"
  positionX={0.5}
  positionY={0.3}
  scale={1.2}
  rotation={0}
  productName="T-shirt personnalisé"
  designName="Logo entreprise"
  showInfo={true}
  width={400}
  height={400}
  onError={(error) => console.error('Erreur:', error)}
/>
```

### 2. `VendorProductDesignPreview` (Wrapper API)
**Fichier:** `src/components/vendor/VendorProductDesignPreview.tsx`

Wrapper qui utilise les données au format `VendorDesignProductResponse` de l'API.

#### Props
```typescript
interface VendorProductDesignPreviewProps {
  vendorDesignProduct: VendorDesignProductResponse;
  showInfo?: boolean;
  className?: string;
  width?: number;
  height?: number;
  onError?: (error: string) => void;
}
```

#### Exemple d'utilisation
```tsx
<VendorProductDesignPreview
  vendorDesignProduct={product}
  showInfo={true}
  width={300}
  height={300}
  onError={(error) => console.error('Erreur:', error)}
/>
```

### 3. `LegacyVendorProductPreview` (Adapter Legacy)
**Fichier:** `src/components/vendor/VendorProductDesignPreview.tsx`

Adapter pour les données au format legacy/transformé existant.

#### Props
```typescript
interface LegacyVendorProductPreviewProps {
  product: {
    id: number;
    name?: string;
    designUrl?: string;
    view?: {
      url?: string;
      imageUrl?: string;
    };
    vendorProduct?: {
      name?: string;
    };
  };
  
  transforms?: {
    positionX?: number;
    positionY?: number;
    scale?: number;
    rotation?: number;
  };
  
  showInfo?: boolean;
  className?: string;
  width?: number;
  height?: number;
  onError?: (error: string) => void;
}
```

## 🎨 Caractéristiques Techniques

### Transformations CSS
Le composant applique les transformations selon cette logique :

```css
transform: translate(${positionX * 100}%, ${positionY * 100}%) scale(${scale}) rotate(${rotation}deg);
transform-origin: top left;
```

### Structure HTML
```html
<div class="product-design-preview" style="position: relative;">
  <!-- Image du produit (fond) -->
  <img style="position: absolute; object-fit: contain; z-index: 1;" />
  
  <!-- Image du design (superposition) -->
  <img style="position: absolute; transform: ...; z-index: 2;" />
  
  <!-- Overlays d'information -->
  <div style="position: absolute; z-index: 20;">...</div>
</div>
```

### Gestion des Erreurs
- Affichage d'indicateurs de chargement
- Gestion des erreurs d'images
- Validation des données manquantes
- Callbacks d'erreur personnalisables

## 🚀 Pages d'Exemple

### 1. Page de Démonstration
**Fichier:** `src/pages/vendor/VendorProductPreviewDemo.tsx`

Page interactive complète avec :
- Contrôles en temps réel des transformations
- Aperçu des différents formats de données
- Interface de test avec sliders
- Galerie de produits

### 2. Page VendorProducts avec Aperçu
**Fichier:** `src/pages/vendor/VendorProductsPageWithPreview.tsx`

Version améliorée de la page des produits vendeur avec :
- Aperçus intégrés dans les cards
- Modal d'aperçu détaillé
- Actions rapides (voir, modifier, supprimer)
- Intégration avec la cascade validation

## 📱 Utilisation dans les Pages

### Page VendorProductsPage
```tsx
import { LegacyVendorProductPreview } from '../../components/vendor/VendorProductDesignPreview';

// Dans votre composant
<LegacyVendorProductPreview
  product={product}
  transforms={{
    positionX: 0.5,
    positionY: 0.3,
    scale: 1.0,
    rotation: 0
  }}
  showInfo={false}
  width={300}
  height={300}
/>
```

### Page VendorDesignsPage
```tsx
import ProductDesignPreview from '../../components/vendor/ProductDesignPreview';

// Dans votre composant
<ProductDesignPreview
  productImageUrl={product.imageUrl}
  designUrl={design.url}
  positionX={design.positionX}
  positionY={design.positionY}
  scale={design.scale}
  rotation={design.rotation}
  showInfo={true}
/>
```

## 🔧 Intégration avec l'API

### Format des Données Attendues
```typescript
interface VendorDesignProductResponse {
  id: number;
  productId: number;
  designUrl: string;
  designFileName?: string;
  positionX: number;        // 0-1
  positionY: number;        // 0-1
  scale: number;           // 0.1-2
  rotation: number;        // 0-360
  name?: string;
  description?: string;
  product?: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
  };
}
```

### Compatibilité avec les Données Existantes
Le composant `LegacyVendorProductPreview` est conçu pour fonctionner avec les structures de données existantes, permettant une migration progressive.

## 🎛️ Options de Configuration

### Tailles d'Aperçu
```tsx
// Tailles prédéfinies
const PREVIEW_SIZES = {
  small: { width: 200, height: 200 },
  medium: { width: 300, height: 300 },
  large: { width: 400, height: 400 },
  xlarge: { width: 500, height: 500 }
};
```

### Valeurs par Défaut
```tsx
const DEFAULT_TRANSFORMS = {
  positionX: 0.5,    // Centre horizontal
  positionY: 0.3,    // Tiers supérieur
  scale: 1.0,        // Taille normale
  rotation: 0        // Pas de rotation
};
```

## 🛠️ Développement et Tests

### Tests d'Intégration
Pour tester les composants :

1. **Page de démonstration** : `/vendeur/products/demo`
2. **Page avec aperçus** : `/vendeur/products/preview`
3. **Tests unitaires** : `npm test ProductDesignPreview`

### Débogage
Activez `showInfo={true}` pour voir :
- Position en pourcentage
- Échelle appliquée
- Rotation en degrés
- Nom du produit et design

## 📈 Performance

### Optimisations
- Images chargées de manière asynchrone
- Gestion des erreurs gracieuse
- ResizeObserver pour les redimensionnements
- Lazy loading des transformations

### Recommandations
- Utilisez des images optimisées (WebP, formats appropriés)
- Limitez la taille des aperçus selon le contexte
- Implémentez un système de cache pour les images fréquemment affichées

## 🔄 Migration depuis l'Existant

### Étapes de Migration
1. Importez `LegacyVendorProductPreview` dans vos composants existants
2. Remplacez les aperçus actuels par le nouveau composant
3. Testez avec vos données existantes
4. Migrez progressivement vers `VendorProductDesignPreview` quand possible

### Compatibilité
Le système est conçu pour être compatible avec :
- Données existantes de `ProductViewWithDesign`
- Hook `useDesignTransforms`
- APIs existantes
- Structures de données legacy

## 📞 Support

En cas de problème :
1. Vérifiez la console pour les erreurs
2. Assurez-vous que les URLs d'images sont valides
3. Vérifiez que les transformations sont dans les bonnes plages
4. Consultez les exemples dans `VendorProductPreviewDemo.tsx`

---

*Ce système d'aperçu a été conçu pour offrir une visualisation fidèle et en temps réel des produits avec designs superposés, tout en maintenant la compatibilité avec l'existant.* 