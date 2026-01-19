# Alignement Bounding Box Frontend/Backend

**Date:** 19 janvier 2026
**Version:** 2.0
**Auteur:** Claude Sonnet 4.5

---

## 📋 Résumé

Ce document explique comment le frontend calcule la **bounding box absolue** d'un design positionné sur un produit, et comment le backend doit interpréter ces données pour générer l'image finale **pixel-perfect**.

### Problème Résolu

**Avant:** Le frontend envoyait des offsets relatifs (x, y) depuis le centre de la délimitation, mais ne calculait pas correctement la bounding box absolue en pixels sur l'image originale. Quand le design était placé dans un coin, le backend ne comprenait pas la position réelle.

**Après:** Le frontend utilise maintenant un système unifié de calcul de bounding box qui convertit correctement les positions relatives en coordonnées absolues, quelle que soit la position du design.

---

## 🎯 Algorithme de Positionnement

### Vue d'ensemble

Le positionnement d'un design suit 3 étapes :

1. **Délimitation** : Zone de placement sur le produit (x, y, width, height)
2. **Conteneur** : Rectangle qui contient le design (dimensions = délimitation × scale)
3. **Design** : Image redimensionnée avec `object-fit: contain` ou `Sharp.resize({ fit: 'inside' })`

```
┌────────────────────────────────────────────┐
│         IMAGE PRODUIT (1200×1200px)        │
│                                            │
│      ┌─────────────────────┐              │
│      │   DÉLIMITATION      │              │
│      │   (400×400px)       │              │
│      │                     │              │
│      │   ┌──────────┐      │              │
│      │   │CONTENEUR │      │              │
│      │   │(320×320) │      │ ← scale=0.8  │
│      │   │          │      │              │
│      │   │ ┌──────┐ │      │              │
│      │   │ │DESIGN│ │      │ ← fit:inside │
│      │   │ └──────┘ │      │              │
│      │   └──────────┘      │              │
│      │         ↑           │              │
│      │    offset (x,y)     │              │
│      │   depuis centre     │              │
│      └─────────────────────┘              │
│                                            │
└────────────────────────────────────────────┘
```

---

## 📐 Format des Données Envoyées par le Frontend

Le frontend envoie un objet `DesignTransform` avec les propriétés suivantes :

```typescript
interface DesignTransform {
  // POSITION (offsets depuis le centre de la délimitation)
  x: number;                    // Offset horizontal en PIXELS ABSOLUS (image originale)
  y: number;                    // Offset vertical en PIXELS ABSOLUS (image originale)
  positionUnit: 'PIXEL';        // Unité (toujours PIXEL maintenant)

  // ÉCHELLE
  designScale: number;          // Échelle du design (0.8 = 80% de la délimitation)

  // ROTATION
  rotation: number;             // Rotation en degrés (0-360)

  // DIMENSIONS DE LA DÉLIMITATION (essentielles pour le backend)
  delimitationWidth: number;    // Largeur de la délimitation en pixels absolus
  delimitationHeight: number;   // Hauteur de la délimitation en pixels absolus
}
```

### Exemple Concret

```json
{
  "x": 50,
  "y": -30,
  "designScale": 0.8,
  "rotation": 0,
  "positionUnit": "PIXEL",
  "delimitationWidth": 400,
  "delimitationHeight": 400
}
```

**Interprétation :**
- La délimitation fait 400×400px
- Le conteneur fait 320×320px (400 × 0.8)
- Le design est déplacé de 50px vers la droite et 30px vers le haut depuis le centre
- Pas de rotation

---

## 🔢 Calcul de la Bounding Box Absolue

### Formules Backend

Le backend doit calculer la bounding box absolue (coin supérieur gauche + dimensions) :

```typescript
// 1. Dimensions du conteneur
const containerWidth = delimitationWidth × designScale;
const containerHeight = delimitationHeight × designScale;

// 2. Centre de la délimitation
const centerX = delimitation.x + delimitationWidth / 2;
const centerY = delimitation.y + delimitationHeight / 2;

// 3. Coin supérieur gauche du conteneur (bounding box)
const boundingBox = {
  left: centerX + offsetX - containerWidth / 2,
  top: centerY + offsetY - containerHeight / 2,
  width: containerWidth,
  height: containerHeight
};
```

### Exemple de Calcul

**Données reçues du frontend :**
```json
{
  "x": 50,
  "y": -30,
  "designScale": 0.8,
  "delimitationWidth": 400,
  "delimitationHeight": 400
}
```

**Délimitation sur le produit :**
```json
{
  "x": 100,
  "y": 100,
  "width": 400,
  "height": 400
}
```

**Calcul :**

```javascript
// 1. Dimensions du conteneur
containerWidth = 400 × 0.8 = 320px
containerHeight = 400 × 0.8 = 320px

// 2. Centre de la délimitation
centerX = 100 + 400/2 = 300px
centerY = 100 + 400/2 = 300px

// 3. Bounding box (avec offsets)
left = 300 + 50 - 320/2 = 300 + 50 - 160 = 190px
top = 300 + (-30) - 320/2 = 300 - 30 - 160 = 110px

// Résultat final
boundingBox = {
  left: 190,
  top: 110,
  width: 320,
  height: 320
}
```

---

## 🖼️ Redimensionnement du Design (Backend)

Une fois la bounding box calculée, le backend redimensionne le design avec **Sharp** :

```typescript
import sharp from 'sharp';

// Charger l'image du design
const designImage = await sharp(designBuffer);
const metadata = await designImage.metadata();

// Redimensionner avec fit: 'inside' (préserve le ratio, comme object-fit: contain)
const resizedDesign = await designImage
  .resize({
    width: Math.round(boundingBox.width),
    height: Math.round(boundingBox.height),
    fit: 'inside',           // ⚠️ CRITIQUE : préserve l'aspect ratio
    background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent
  })
  .toBuffer();

// Positionner sur l'image produit
const finalImage = await sharp(productImageBuffer)
  .composite([{
    input: resizedDesign,
    left: Math.round(boundingBox.left),
    top: Math.round(boundingBox.top)
  }])
  .toBuffer();
```

### ⚠️ Point Critique : `fit: 'inside'`

Le paramètre `fit: 'inside'` est **ESSENTIEL** pour garantir la cohérence avec le frontend :

- **Frontend** : `object-fit: contain` centre l'image dans le conteneur en préservant le ratio
- **Backend** : `fit: 'inside'` fait exactement la même chose avec Sharp

**Exemple :**

Design original : 500×300px
Conteneur : 320×320px

```javascript
// Avec fit: 'inside'
// Ratio design = 500/300 = 1.67
// Largeur max = 320px
// Hauteur = 320 / 1.67 = 192px
// ✅ Le design fait 320×192px, centré verticalement dans le conteneur 320×320px

// Sans fit: 'inside' (erreur !)
// ❌ Le design serait déformé en 320×320px
```

---

## 🔄 Cas Particulier : Designs dans les Coins

### Problème Initial

Quand le design était placé dans un coin de la délimitation (par exemple coin supérieur gauche), les calculs incorrects donnaient une bounding box qui sortait de l'image.

### Solution

Le frontend applique maintenant des **contraintes** pour que le conteneur ne sorte JAMAIS de la délimitation :

```typescript
// Contraintes calculées
const maxX = (delimitationWidth - containerWidth) / 2;   // Offset max vers la droite
const minX = -(delimitationWidth - containerWidth) / 2;  // Offset max vers la gauche
const maxY = (delimitationHeight - containerHeight) / 2;
const minY = -(delimitationHeight - containerHeight) / 2;

// Application
const constrainedX = Math.max(minX, Math.min(maxX, offsetX));
const constrainedY = Math.max(minY, Math.min(maxY, offsetY));
```

**Exemple :**

Délimitation : 400×400px
Conteneur : 320×320px (scale 0.8)

```javascript
maxX = (400 - 320) / 2 = 40px   // Le conteneur peut aller jusqu'à 40px à droite
minX = -40px                     // Ou 40px à gauche
maxY = 40px
minY = -40px

// Si l'utilisateur essaie de mettre x = 100px (trop loin)
constrainedX = min(100, 40) = 40px  // ✅ Limité à 40px
```

Le backend reçoit donc **toujours** des valeurs x,y qui garantissent que le conteneur reste dans la délimitation.

---

## 🧮 Utilitaire Frontend : `boundingBoxCalculator.ts`

Le frontend utilise maintenant un module utilitaire centralisé pour tous les calculs de bounding box.

### Fonctions Principales

#### 1. `calculateDesignPositioning()`

Fonction complète qui calcule tout en une fois :

```typescript
import { calculateDesignPositioning } from '../utils/boundingBoxCalculator';

const positioning = calculateDesignPositioning(
  {
    x: delim.x,
    y: delim.y,
    width: delim.width,
    height: delim.height,
    coordinateType: delim.coordinateType,
    imageWidth: 1200,
    imageHeight: 1200
  },
  {
    x: transform.x,
    y: transform.y,
    designScale: transform.designScale
  },
  {
    width: viewportWidth,   // Taille affichée dans le navigateur
    height: viewportHeight
  }
);

// Résultat
console.log(positioning);
// {
//   delimAbsolute: { x: 100, y: 100, width: 400, height: 400 },
//   boundingBox: { left: 190, top: 110, width: 320, height: 320 },
//   constraints: { minX: -40, maxX: 40, minY: -40, maxY: 40 },
//   scaleRatio: 2.5,  // Si viewport = 160px et absolu = 400px
//   containerWidth: 320,
//   containerHeight: 320
// }
```

#### 2. `calculateBoundingBox()`

Calcul simple de la bounding box :

```typescript
import { calculateBoundingBox } from '../utils/boundingBoxCalculator';

const bbox = calculateBoundingBox(
  { x: 100, y: 100, width: 400, height: 400, coordinateType: 'PIXEL' },
  { x: 50, y: -30, designScale: 0.8 }
);

// { left: 190, top: 110, width: 320, height: 320 }
```

#### 3. `calculatePositionConstraints()`

Calcul des limites min/max :

```typescript
import { calculatePositionConstraints } from '../utils/boundingBoxCalculator';

const constraints = calculatePositionConstraints(
  { x: 100, y: 100, width: 400, height: 400, coordinateType: 'PIXEL' },
  0.8  // designScale
);

// { minX: -40, maxX: 40, minY: -40, maxY: 40 }
```

---

## 🔧 Implémentation Backend Recommandée

### Fonction de Calcul Complète

```typescript
interface DesignTransform {
  x: number;
  y: number;
  designScale: number;
  rotation: number;
  positionUnit: 'PIXEL';
  delimitationWidth: number;
  delimitationHeight: number;
}

interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PIXEL' | 'PERCENTAGE';
}

/**
 * Calcule la bounding box absolue pour le positionnement du design
 */
function calculateAbsoluteBoundingBox(
  delimitation: Delimitation,
  transform: DesignTransform,
  imageWidth: number,
  imageHeight: number
): { left: number; top: number; width: number; height: number } {

  // 1. Convertir la délimitation en pixels absolus si nécessaire
  let delimX = delimitation.x;
  let delimY = delimitation.y;
  let delimWidth = delimitation.width;
  let delimHeight = delimitation.height;

  if (delimitation.coordinateType === 'PERCENTAGE') {
    delimX = (delimitation.x / 100) * imageWidth;
    delimY = (delimitation.y / 100) * imageHeight;
    delimWidth = (delimitation.width / 100) * imageWidth;
    delimHeight = (delimitation.height / 100) * imageHeight;
  }

  // 2. Calculer les dimensions du conteneur
  const containerWidth = delimWidth * transform.designScale;
  const containerHeight = delimHeight * transform.designScale;

  // 3. Calculer le centre de la délimitation
  const centerX = delimX + delimWidth / 2;
  const centerY = delimY + delimHeight / 2;

  // 4. Calculer le coin supérieur gauche de la bounding box
  const left = centerX + transform.x - containerWidth / 2;
  const top = centerY + transform.y - containerHeight / 2;

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(containerWidth),
    height: Math.round(containerHeight)
  };
}
```

### Utilisation avec Sharp

```typescript
import sharp from 'sharp';

async function generateProductWithDesign(
  productImageBuffer: Buffer,
  designImageBuffer: Buffer,
  delimitation: Delimitation,
  transform: DesignTransform
): Promise<Buffer> {

  // 1. Charger l'image produit pour obtenir ses dimensions
  const productImage = sharp(productImageBuffer);
  const productMeta = await productImage.metadata();
  const imageWidth = productMeta.width || 1200;
  const imageHeight = productMeta.height || 1200;

  // 2. Calculer la bounding box absolue
  const bbox = calculateAbsoluteBoundingBox(
    delimitation,
    transform,
    imageWidth,
    imageHeight
  );

  console.log('📐 Bounding Box calculée:', bbox);

  // 3. Redimensionner le design avec fit: 'inside'
  const resizedDesign = await sharp(designImageBuffer)
    .resize({
      width: bbox.width,
      height: bbox.height,
      fit: 'inside',  // ⚠️ CRITIQUE
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // 4. Appliquer la rotation si nécessaire
  let finalDesign = resizedDesign;
  if (transform.rotation !== 0) {
    finalDesign = await sharp(resizedDesign)
      .rotate(transform.rotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
  }

  // 5. Composer le design sur le produit
  const result = await productImage
    .composite([{
      input: finalDesign,
      left: bbox.left,
      top: bbox.top
    }])
    .toBuffer();

  return result;
}
```

---

## ✅ Tests de Validation

### Test 1 : Design Centré

```json
{
  "x": 0,
  "y": 0,
  "designScale": 0.8,
  "delimitationWidth": 400,
  "delimitationHeight": 400
}
```

**Délimitation :** x=100, y=100, width=400, height=400

**Résultat attendu :**
```javascript
containerWidth = 320
centerX = 300
left = 300 + 0 - 160 = 140 ✅
top = 300 + 0 - 160 = 140 ✅

// Le design est centré dans la délimitation
```

### Test 2 : Design dans le Coin Supérieur Gauche

```json
{
  "x": -40,
  "y": -40,
  "designScale": 0.8,
  "delimitationWidth": 400,
  "delimitationHeight": 400
}
```

**Résultat attendu :**
```javascript
containerWidth = 320
left = 300 + (-40) - 160 = 100 ✅  // Coin de la délimitation
top = 300 + (-40) - 160 = 100 ✅

// Le design est au coin supérieur gauche de la délimitation
```

### Test 3 : Design dans le Coin Inférieur Droit

```json
{
  "x": 40,
  "y": 40,
  "designScale": 0.8,
  "delimitationWidth": 400,
  "delimitationHeight": 400
}
```

**Résultat attendu :**
```javascript
left = 300 + 40 - 160 = 180 ✅
top = 300 + 40 - 160 = 180 ✅

// 100 (début délim) + 400 (largeur) - 320 (conteneur) = 180 ✅
// Le design est au coin inférieur droit de la délimitation
```

---

## 🐛 Débogage

### Vérifications Backend

Ajoutez des logs pour vérifier les calculs :

```typescript
console.log('📥 Transform reçu:', transform);
console.log('📏 Délimitation:', delimitation);
console.log('🖼️ Image produit:', imageWidth, 'x', imageHeight);
console.log('📦 Conteneur:', containerWidth, 'x', containerHeight);
console.log('🎯 Centre délim:', centerX, centerY);
console.log('📐 Bounding box:', bbox);
```

### Vérifications Visuelles

Pour vérifier que le positionnement est correct, superposez un rectangle de debug :

```typescript
// Dessiner la délimitation en rouge (debug)
const withDebug = await sharp(result)
  .composite([{
    input: Buffer.from(
      `<svg width="${delimWidth}" height="${delimHeight}">
        <rect width="100%" height="100%"
              fill="none" stroke="red" stroke-width="2"/>
       </svg>`
    ),
    left: Math.round(delimX),
    top: Math.round(delimY)
  }])
  .toBuffer();
```

---

## 📚 Références

### Fichiers Frontend

- **`src/utils/boundingBoxCalculator.ts`** : Utilitaire de calcul unifié
- **`src/pages/SellDesignPage.tsx`** : Implémentation dans l'interface vendeur
- **`src/hooks/useDesignTransforms.ts`** : Gestion des transformations et sauvegarde

### Documentation Associée

- **`BACKEND_DESIGN_POSITIONING_EXACT.md`** : Algorithme détaillé de positionnement
- **`FRONTEND_BACKEND_POSITIONING_ALIGNMENT.md`** : Logique unifiée frontend/backend
- **`DESIGN_POSITIONING_LOGIC.md`** : Vue d'ensemble du système de positionnement

---

## 🎓 Résumé pour le Backend

### Ce que le Backend Reçoit

```json
{
  "x": 50,
  "y": -30,
  "designScale": 0.8,
  "rotation": 0,
  "positionUnit": "PIXEL",
  "delimitationWidth": 400,
  "delimitationHeight": 400
}
```

### Ce que le Backend Doit Faire

1. **Calculer la bounding box absolue** :
   ```javascript
   const containerWidth = delimitationWidth × designScale;
   const centerX = delimitation.x + delimitationWidth / 2;
   const left = centerX + x - containerWidth / 2;
   const top = centerY + y - containerHeight / 2;
   ```

2. **Redimensionner le design avec `fit: 'inside'`** :
   ```javascript
   sharp(designBuffer).resize({
     width: containerWidth,
     height: containerHeight,
     fit: 'inside'  // ⚠️ ESSENTIEL
   })
   ```

3. **Positionner le design** :
   ```javascript
   sharp(productBuffer).composite([{
     input: resizedDesign,
     left: bbox.left,
     top: bbox.top
   }])
   ```

### Points Critiques

✅ **Toujours utiliser `fit: 'inside'`** pour préserver le ratio
✅ **Les offsets x,y sont en pixels absolus sur l'image originale**
✅ **Les offsets sont depuis le CENTRE de la délimitation**
✅ **Le frontend garantit que le conteneur reste dans la délimitation**
✅ **Arrondir toutes les valeurs finales avec `Math.round()`**

---

**Fin du document**
