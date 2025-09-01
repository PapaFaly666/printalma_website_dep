# 🎨 Guide - Affichage Design dans Délimitations

## 📋 Vue d'ensemble

Cette implémentation permet d'afficher précisément le design du vendeur superposé dans les zones de délimitation sur les images de produits. Le système utilise les coordonnées de délimitation pour positionner le design sur chaque vue du produit.

## 🚀 Démarrage Rapide

### 1. Composants Créés

- `ProductImageWithDesign.tsx` - Composant principal pour afficher une image avec design superposé
- `ProductImageGallery.tsx` - Galerie d'images avec navigation et sélection de couleurs
- `DesignPreview.tsx` - Aperçu du design sur plusieurs couleurs
- `DesignConfigPanel.tsx` - Panneau de configuration du design
- `VendorProductCardWithDesign.tsx` - Carte produit intégrée avec design
- `useDelimitations.ts` - Hook pour gérer les calculs de délimitations

### 2. Démonstration

Accédez au composant de démonstration :
```tsx
import VendorDesignDemo from './src/components/examples/VendorDesignDemo';
```

## 🎯 Utilisation dans les Cartes Existantes

### Modification du VendorProductCard

```tsx
import ProductImageWithDesign from '../ProductImageWithDesign';

// Dans le JSX, remplacer l'image simple par :
{product.designApplication?.designUrl && primaryImage.delimitations?.length ? (
  <ProductImageWithDesign
    productImage={primaryImage}
    designUrl={product.designApplication.designUrl}
    designConfig={{
      positioning: product.designApplication.positioning || 'CENTER',
      scale: product.designApplication.scale || 0.8
    }}
    showDelimitations={showDelimitations}
    className="w-full h-full"
  />
) : (
  <img
    src={primaryImage.url}
    alt={`${product.vendorName} - ${selectedColor.name}`}
    className="w-full h-full object-cover"
  />
)}
```

## 📊 Structure des Données

### Interface Délimitation
```tsx
interface Delimitation {
  x: number;           // Position X (pixels ou pourcentage)
  y: number;           // Position Y (pixels ou pourcentage)
  width: number;       // Largeur de la zone
  height: number;      // Hauteur de la zone
  coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
}
```

### Interface Image Produit
```tsx
interface ProductImage {
  id: number;
  url: string;
  viewType: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';
  delimitations: Delimitation[];
}
```

### Interface Design Application
```tsx
interface DesignApplication {
  designUrl: string;
  positioning: 'CENTER' | 'TOP' | 'BOTTOM';
  scale: number; // 0.3 à 1.0
}
```

## 🎨 Types de Coordonnées

### PERCENTAGE (Recommandé)
- Coordonnées relatives de 0 à 100%
- S'adaptent automatiquement à toutes les tailles d'affichage
- Exemple : `{ x: 30, y: 25, width: 40, height: 35, coordinateType: 'PERCENTAGE' }`

### ABSOLUTE
- Coordonnées en pixels fixes
- Basées sur la taille naturelle de l'image
- Redimensionnées proportionnellement à l'affichage

## ⚙️ Configuration du Design

### Positionnement
- **CENTER** : Centré dans la délimitation
- **TOP** : Aligné en haut avec marge de 10px
- **BOTTOM** : Aligné en bas avec marge de 10px

### Échelle
- Valeur de 0.3 (30%) à 1.0 (100%)
- Appliquée à la taille de la zone de délimitation

## 🔧 Intégration Backend

### Exemple de données attendues
```json
{
  "id": 1,
  "vendorName": "T-Shirt Premium",
  "colorVariations": [
    {
      "id": 1,
      "name": "Noir",
      "colorCode": "#000000",
      "images": [
        {
          "id": 1,
          "url": "https://example.com/tshirt-black-front.jpg",
          "viewType": "FRONT",
          "delimitations": [
            {
              "x": 30,
              "y": 25,
              "width": 40,
              "height": 35,
              "coordinateType": "PERCENTAGE"
            }
          ]
        }
      ]
    }
  ],
  "designApplication": {
    "designUrl": "https://res.cloudinary.com/design.png",
    "positioning": "CENTER",
    "scale": 0.8
  }
}
```

## 📱 Mode Debug

### Activation
```tsx
<ProductImageWithDesign
  productImage={image}
  designUrl={designUrl}
  designConfig={config}
  showDelimitations={true} // Active le mode debug
/>
```

### Fonctionnalités Debug
- Affichage des contours de délimitation en rouge
- Numérotation des zones
- Info-bulles avec type de coordonnées

## 🎮 Composant de Démonstration

Le composant `VendorDesignDemo` permet de :
- Tester les différents modes d'affichage
- Configurer le design en temps réel
- Activer/désactiver le mode debug
- Voir les trois composants principaux

## 🔄 Calculs de Position

### Pour coordonnées en pourcentage
```tsx
const x = (delimitation.x / 100) * containerWidth;
const y = (delimitation.y / 100) * containerHeight;
const width = (delimitation.width / 100) * containerWidth;
const height = (delimitation.height / 100) * containerHeight;
```

### Pour coordonnées absolues
```tsx
const scaleX = containerWidth / naturalWidth;
const scaleY = containerHeight / naturalHeight;
const x = delimitation.x * scaleX;
const y = delimitation.y * scaleY;
```

## ✅ Bonnes Pratiques

### 1. Performance
- Utiliser le lazy loading pour les images
- Optimiser les images via Cloudinary
- Éviter les recalculs inutiles

### 2. UX
- Prévoir des images de fallback
- Afficher des indicateurs de chargement
- Gérer les erreurs d'images gracieusement

### 3. Responsive
- Utiliser les coordonnées en pourcentage
- Tester sur différentes tailles d'écran
- Maintenir les proportions

## 🐛 Dépannage

### Design ne s'affiche pas
1. Vérifier que `designUrl` est valide
2. S'assurer que `delimitations` n'est pas vide
3. Contrôler la console pour les erreurs d'images

### Positionnement incorrect
1. Vérifier le type de coordonnées
2. Contrôler les valeurs de délimitation
3. Tester avec `showDelimitations={true}`

### Performance lente
1. Optimiser les tailles d'images
2. Implémenter le lazy loading
3. Utiliser la mise en cache

## 📈 Prochaines Évolutions

- Support de délimitations multiples par image
- Rotation et transformations du design
- Prévisualisation 3D
- Éditeur de délimitations intégré
- Support des designs vectoriels

---

## 🎯 Résumé

Cette implémentation permet un affichage précis et configurable des designs vendeurs dans les zones de délimitation des produits, avec support complet du responsive design et des outils de debug pour faciliter l'intégration et la maintenance. 