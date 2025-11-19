# Backend Integration Guide - Multi-View Customizations

## Overview
Le frontend `ModernOrderFormPage.tsx` envoie maintenant des données de personnalisation multi-vues structurées pour permettre au backend de traiter les produits personnalisés avec plusieurs vues (devant, dos, etc.).

## Structure des données envoyées

Lors de la création d'une commande, chaque `orderItem` contient maintenant les champs suivants pour les personnalisations multi-vues :

```json
{
  "orderItems": [{
    "productId": 123,
    "customizationIds": {
      "1-5": 1001,
      "1-6": 1002,
      "2-5": 1003
    },
    "designElementsByView": {
      "1-5": [
        {
          "id": "element_1",
          "type": "text",
          "x": 0.5,
          "y": 0.3,
          "width": 200,
          "height": 50,
          "rotation": 0,
          "text": "Mon texte",
          "fontSize": 24,
          "fontFamily": "Arial",
          "color": "#FF0000"
        }
      ],
      "1-6": [
        {
          "id": "element_2",
          "type": "image",
          "x": 0.5,
          "y": 0.4,
          "width": 150,
          "height": 150,
          "rotation": 45,
          "imageUrl": "https://example.com/design.png"
        }
      ]
    },
    "viewsMetadata": [
      {
        "viewKey": "1-5",
        "colorId": 1,
        "viewId": 5,
        "viewType": "FRONT",
        "imageUrl": "https://example.com/product-front.jpg",
        "hasElements": true,
        "elementsCount": 1
      },
      {
        "viewKey": "1-6",
        "colorId": 1,
        "viewId": 6,
        "viewType": "BACK",
        "imageUrl": "https://example.com/product-back.jpg",
        "hasElements": true,
        "elementsCount": 1
      },
      {
        "viewKey": "2-5",
        "colorId": 2,
        "viewId": 5,
        "viewType": "FRONT",
        "imageUrl": "https://example.com/product-blue-front.jpg",
        "hasElements": false,
        "elementsCount": 0
      }
    ],
    "mockupUrl": "https://example.com/mockup.jpg",
    "delimitation": {
      "x": 0.2,
      "y": 0.2,
      "width": 0.6,
      "height": 0.6,
      "coordinateType": "PERCENTAGE",
      "referenceWidth": 800,
      "referenceHeight": 800
    }
  }]
}
```

## Format des clés

**`customizationIds` et `designElementsByView` utilisent le format de clé : `"colorId-viewId"`**

- `colorId`: ID de la variation de couleur dans la base de données
- `viewId`: ID de la vue (défini dans les délimitations du produit)

Exemples :
- `"1-5"`: couleur ID 1, vue ID 5 (devant)
- `"1-6"`: couleur ID 1, vue ID 6 (dos)
- `"2-5"`: couleur ID 2 (bleu), vue ID 5 (devant)

## Champs expliqués

### `customizationIds` : `Record<string, number>`
- **Clé**: `"colorId-viewId"`
- **Valeur**: ID de la personnalisation sauvegardée en base de données
- **Utilité**: Permet de retrouver les personnalisations sauvegardées pour chaque vue

### `designElementsByView` : `Record<string, any[]>`
- **Clé**: `"colorId-viewId"`
- **Valeur**: Tableau d'éléments de design pour cette vue
- **Utilité**: Contient les éléments (texte, image) positionnés sur cette vue

### `viewsMetadata` : `Array<ViewMetadata>`
Contient les métadonnées pour chaque vue personnalisée :

```typescript
interface ViewMetadata {
  viewKey: string;      // "1-5" - clé de la vue
  colorId: number;      // 1 - ID de la variation de couleur
  viewId: number;       // 5 - ID de la vue
  viewType: string;     // "FRONT" | "BACK" | "LEFT" | "RIGHT" | etc.
  imageUrl: string;     // URL de l'image de référence pour cette vue
  hasElements: boolean; // true si cette vue contient des éléments
  elementsCount: number; // Nombre d'éléments dans cette vue
}
```

## Traitement recommandé côté backend

### 1. Validation des données
```javascript
// Vérifier la cohérence des données
const validateMultiViewData = (orderItem) => {
  const { customizationIds, designElementsByView, viewsMetadata } = orderItem;

  // Vérifier que les clés correspondent
  const customKeys = Object.keys(customizationIds || {});
  const designKeys = Object.keys(designElementsByView || {});
  const metadataKeys = viewsMetadata?.map(vm => vm.viewKey) || [];

  // Les clés doivent être cohérentes entre les trois champs
  const allKeys = [...new Set([...customKeys, ...designKeys, ...metadataKeys])];

  return {
    isValid: allKeys.length > 0,
    totalViews: allKeys.length,
    viewsWithElements: metadataKeys.filter(key =>
      viewsMetadata.find(vm => vm.viewKey === key)?.hasElements
    )
  };
};
```

### 2. Sauvegarde en base de données
```javascript
// Exemple de schéma de table pour les personnalisations multi-vues
const customizationSchema = {
  id: 'INTEGER PRIMARY KEY',
  orderId: 'INTEGER',
  productId: 'INTEGER',
  colorId: 'INTEGER',
  viewId: 'INTEGER',
  viewKey: 'VARCHAR(20)', // "colorId-viewId"
  viewType: 'VARCHAR(20)', // "FRONT", "BACK", etc.
  designElements: 'JSON', // Éléments de design pour cette vue
  imageUrl: 'VARCHAR(500)',
  createdAt: 'TIMESTAMP',
  updatedAt: 'TIMESTAMP'
};
```

### 3. Génération des images de prévisualisation
Pour chaque vue dans `viewsMetadata` :
1. Utiliser `imageUrl` comme image de base
2. Appliquer les éléments de `designElementsByView[viewKey]`
3. Sauvegarder l'image générée avec la clé `viewKey`

### 4. Intégration avec l'existant
Les champs existants restent compatibles :
- `customizationId`: ID principal (première vue pour compatibilité)
- `mockupUrl`: URL du mockup principal
- `delimitation`: Délimitation principale

## Cas d'usage

### Produit avec une seule vue
```json
{
  "customizationIds": { "1-5": 1001 },
  "designElementsByView": { "1-5": [...] },
  "viewsMetadata": [{ "viewKey": "1-5", "viewType": "FRONT", "hasElements": true }]
}
```

### Produit avec plusieurs vues
```json
{
  "customizationIds": {
    "1-5": 1001,  // Devant - couleur 1
    "1-6": 1002,  // Dos - couleur 1
    "1-7": 1003   // Manche - couleur 1
  },
  "designElementsByView": {
    "1-5": [...], // Éléments devant
    "1-6": [...], // Éléments dos
    "1-7": [...]  // Éléments manche
  },
  "viewsMetadata": [
    { "viewKey": "1-5", "viewType": "FRONT", "hasElements": true },
    { "viewKey": "1-6", "viewType": "BACK", "hasElements": true },
    { "viewKey": "1-7", "viewType": "SLEEVE", "hasElements": true }
  ]
}
```

## Logs de debug
Le frontend envoie des logs détaillés pour aider au debug :

```javascript
console.log('🔍 [ModernOrderForm] Préparation des données multi-vues:', {
  hasCustomizationIds: !!productData.customizationIds,
  hasDesignElementsByView: !!productData.designElementsByView,
  customizationIdsKeys: Object.keys(productData.customizationIds || []),
  designElementsByViewKeys: Object.keys(productData.designElementsByView || {})
});

console.log('✅ [ModernOrderForm] Données multi-vues préparées:', multiViewData);
```

## Compatibilité
- ✅ Compatible avec les commandes existantes (champs optionnels)
- ✅ Rétrocompatible avec les produits mono-vue
- ✅ Logs détaillés pour le debug
- ✅ Structure flexible pour les futures évolutions