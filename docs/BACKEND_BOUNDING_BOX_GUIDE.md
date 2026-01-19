# Guide Backend - Utilisation du Bounding Box pour le Positionnement

## 📋 Résumé

Le frontend envoie maintenant **containerWidth** et **containerHeight** (le "bounding box") au backend pour garantir un positionnement pixel-perfect du design sur le produit.

**Date:** 18 janvier 2026
**Problème résolu:** Le backend ne savait pas exactement quelle taille de conteneur utiliser pour placer le design

---

## 🎯 Le problème

Avant, le frontend envoyait :
- `x`, `y` : offsets de position
- `scale` : échelle du design (ex: 0.8 = 80%)
- `rotation` : angle de rotation

**Mais le backend ne recevait pas la taille exacte du conteneur** dans lequel placer le design.

Le backend devait deviner/recalculer :
```javascript
containerWidth = delimitation.width × scale  // ❓ Quelle délimitation utiliser?
containerHeight = delimitation.height × scale // ❓ En pixels ou en %?
```

Cela pouvait créer des **incohérences** si :
- Le backend utilisait une délimitation différente de celle affichée au frontend
- Les conversions pixels/pourcentage différaient
- Les arrondis n'étaient pas identiques

---

## ✅ La solution

Le frontend calcule maintenant et envoie **explicitement** les dimensions du bounding box :

```typescript
designPosition: {
  x: 50,                  // Offset horizontal (pixels)
  y: -30,                 // Offset vertical (pixels)
  scale: 0.8,             // Échelle (80% de la délimitation)
  rotation: 0,            // Rotation en degrés
  positionUnit: 'PIXEL',  // Unité des offsets x,y

  // 📏 Dimensions intrinsèques du design
  designWidth: 800,       // Largeur originale du design
  designHeight: 600,      // Hauteur originale du design

  // 🎯 BOUNDING BOX - NOUVEAU !
  containerWidth: 384,    // = delimitation.width × scale (en pixels absolus)
  containerHeight: 480,   // = delimitation.height × scale (en pixels absolus)
}
```

---

## 📐 Ce que représente le Bounding Box

Le **bounding box** est le **rectangle calculé** qui définit l'espace maximal que le design peut occuper :

```
┌────────────────────────────────────────┐
│          Image du produit              │
│                                        │
│      ┌──────────────────────┐          │
│      │   Délimitation       │          │
│      │   (zone imprimable)  │          │
│      │                      │          │
│      │    ┏━━━━━━━━━┓       │          │
│      │    ┃ BOUNDING ┃       │          │ ← Bounding box
│      │    ┃   BOX    ┃       │          │   (containerWidth × containerHeight)
│      │    ┃ 384×480  ┃       │          │
│      │    ┗━━━━━━━━━┛       │          │
│      │                      │          │
│      └──────────────────────┘          │
│                                        │
└────────────────────────────────────────┘
```

**Formule de calcul** :
```javascript
// Le frontend calcule cela à partir de l'image affichée
const delimInPixels = {
  width: delim.coordinateType === 'PIXEL'
    ? delim.width
    : (delim.width / 100) × imageWidth,
  height: delim.coordinateType === 'PIXEL'
    ? delim.height
    : (delim.height / 100) × imageHeight
};

containerWidth = delimInPixels.width × scale;
containerHeight = delimInPixels.height × scale;
```

---

## 🔧 Comment le Backend doit utiliser ces valeurs

### OPTION 1 : Utilisation directe (recommandé)

Le backend peut **utiliser directement** les valeurs envoyées par le frontend :

```typescript
// Données reçues du frontend
const {
  x,                    // Offset depuis le centre (ex: 50px)
  y,                    // Offset depuis le centre (ex: -30px)
  scale,                // Échelle appliquée (ex: 0.8)
  rotation,             // Rotation (ex: 0°)
  containerWidth,       // 🎯 Largeur du bounding box (ex: 384px)
  containerHeight,      // 🎯 Hauteur du bounding box (ex: 480px)
  designWidth,          // Largeur originale du design (ex: 800px)
  designHeight,         // Hauteur originale du design (ex: 600px)
  positionUnit          // 'PIXEL' ou 'PERCENTAGE'
} = designPosition;

// ÉTAPE 1: Récupérer la délimitation depuis la BDD
const delimitation = await getDelimitationFromDatabase(productImageId);

// Convertir la délimitation en pixels si nécessaire
const delimInPixels = convertDelimitationToPixels(
  delimitation,
  productImage.width,
  productImage.height
);

// ÉTAPE 2: Calculer le centre de la délimitation
const delimCenterX = delimInPixels.x + delimInPixels.width / 2;
const delimCenterY = delimInPixels.y + delimInPixels.height / 2;

// ÉTAPE 3: Calculer la position du centre du conteneur
const containerCenterX = delimCenterX + x; // Appliquer l'offset
const containerCenterY = delimCenterY + y;

// ÉTAPE 4: Calculer la position du coin supérieur gauche du conteneur
const containerLeft = containerCenterX - containerWidth / 2;
const containerTop = containerCenterY - containerHeight / 2;

// ÉTAPE 5: Redimensionner le design pour tenir dans le bounding box
// Utiliser Sharp avec fit: 'inside' pour préserver l'aspect ratio
const resizedDesign = await sharp(designBuffer)
  .resize({
    width: containerWidth,   // 🎯 Utiliser la largeur du bounding box
    height: containerHeight, // 🎯 Utiliser la hauteur du bounding box
    fit: 'inside',           // Préserve l'aspect ratio (comme CSS object-fit: contain)
    position: 'center'       // Centre le design dans le conteneur
  })
  .toBuffer();

// ÉTAPE 6: Récupérer les dimensions réelles après resize
const resizedMetadata = await sharp(resizedDesign).metadata();
const resizedWidth = resizedMetadata.width;
const resizedHeight = resizedMetadata.height;

// ÉTAPE 7: Calculer la position de collage du design
// (le design peut être plus petit que le conteneur à cause de l'aspect ratio)
const designPasteLeft = containerCenterX - resizedWidth / 2;
const designPasteTop = containerCenterY - resizedHeight / 2;

// ÉTAPE 8: Appliquer la rotation si nécessaire
let finalDesign = resizedDesign;
if (rotation !== 0) {
  finalDesign = await sharp(resizedDesign)
    .rotate(rotation, {
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Fond transparent
    })
    .toBuffer();

  // Recalculer la position après rotation
  const rotatedMetadata = await sharp(finalDesign).metadata();
  const rotatedWidth = rotatedMetadata.width;
  const rotatedHeight = rotatedMetadata.height;

  designPasteLeft = containerCenterX - rotatedWidth / 2;
  designPasteTop = containerCenterY - rotatedHeight / 2;
}

// ÉTAPE 9: Composer sur le mockup
const finalImage = await sharp(productImageBuffer)
  .composite([
    {
      input: finalDesign,
      left: Math.round(designPasteLeft),
      top: Math.round(designPasteTop),
      blend: 'over'
    }
  ])
  .toBuffer();
```

### OPTION 2 : Validation des valeurs

Si le backend veut **vérifier** que les valeurs envoyées sont correctes :

```typescript
// Recalculer le bounding box pour validation
const expectedContainerWidth = delimInPixels.width × scale;
const expectedContainerHeight = delimInPixels.height × scale;

// Tolérance de 1px pour les arrondis
const isValid =
  Math.abs(containerWidth - expectedContainerWidth) <= 1 &&
  Math.abs(containerHeight - expectedContainerHeight) <= 1;

if (!isValid) {
  console.warn('⚠️ Bounding box mismatch:', {
    received: { containerWidth, containerHeight },
    expected: { expectedContainerWidth, expectedContainerHeight },
    difference: {
      width: containerWidth - expectedContainerWidth,
      height: containerHeight - expectedContainerHeight
    }
  });

  // Décider si on utilise les valeurs reçues ou recalculées
  // Recommandation: TOUJOURS utiliser les valeurs reçues du frontend
}
```

---

## 🎨 Exemple concret

### Données envoyées par le frontend

```json
{
  "designPosition": {
    "x": 50,
    "y": -30,
    "scale": 0.8,
    "rotation": 0,
    "positionUnit": "PIXEL",
    "designWidth": 800,
    "designHeight": 600,
    "containerWidth": 384,
    "containerHeight": 480
  }
}
```

### Délimitation dans la BDD

```json
{
  "x": 30,
  "y": 20,
  "width": 40,
  "height": 50,
  "coordinateType": "PERCENTAGE"
}
```

### Image du produit

```json
{
  "width": 1200,
  "height": 1200
}
```

### Calculs backend

```javascript
// 1. Délimitation en pixels
const delimInPixels = {
  x: (30 / 100) × 1200 = 360px,
  y: (20 / 100) × 1200 = 240px,
  width: (40 / 100) × 1200 = 480px,
  height: (50 / 100) × 1200 = 600px
};

// 2. Vérification du bounding box (optionnel)
const expectedContainerWidth = 480 × 0.8 = 384px ✅
const expectedContainerHeight = 600 × 0.8 = 480px ✅
// Les valeurs correspondent !

// 3. Centre de la délimitation
const delimCenterX = 360 + 480/2 = 600px;
const delimCenterY = 240 + 600/2 = 540px;

// 4. Centre du conteneur (avec offset)
const containerCenterX = 600 + 50 = 650px;
const containerCenterY = 540 + (-30) = 510px;

// 5. Coin supérieur gauche du conteneur
const containerLeft = 650 - 384/2 = 458px;
const containerTop = 510 - 480/2 = 270px;

// 6. Redimensionner le design (800×600 → fit dans 384×480)
// Avec fit: 'inside', le design devient 384×288 (aspect ratio préservé)

// 7. Position de collage du design
const designPasteLeft = 650 - 384/2 = 458px;
const designPasteTop = 510 - 288/2 = 366px;

// 8. Pas de rotation dans cet exemple

// 9. Composer l'image finale
```

**Résultat** : Le design est placé exactement comme dans la preview frontend !

---

## ⚠️ Points d'attention

### 1. Toujours utiliser les valeurs du frontend

Les valeurs `containerWidth` et `containerHeight` sont calculées par le frontend à partir de l'image **réellement affichée** à l'utilisateur. Elles sont donc **la source de vérité**.

**Ne pas recalculer le bounding box côté backend** (sauf pour validation). Utilisez directement les valeurs reçues.

### 2. Gestion des arrondis

Les calculs peuvent produire des valeurs décimales. Le frontend et le backend peuvent arrondir différemment.

**Solution** : Accepter une tolérance de ±1px lors de la validation.

### 3. Unité de position (positionUnit)

- `positionUnit: 'PIXEL'` : Les offsets `x` et `y` sont en **pixels absolus**
- `positionUnit: 'PERCENTAGE'` : Les offsets `x` et `y` sont en **pourcentage de la délimitation**

```javascript
// Conversion si nécessaire
if (positionUnit === 'PERCENTAGE') {
  x = (x / 100) × delimInPixels.width;
  y = (y / 100) × delimInPixels.height;
}
```

### 4. Aspect ratio du design

Le design peut avoir un aspect ratio différent du bounding box. Sharp avec `fit: 'inside'` gère cela automatiquement :

```javascript
// Exemple: Design carré (800×800) dans bounding box rectangulaire (384×480)
await sharp(design).resize({
  width: 384,
  height: 480,
  fit: 'inside' // ✅ Le design devient 384×384, centré verticalement
});
```

Le design final peut être plus petit que le bounding box → c'est **normal** et attendu.

### 5. Rotation

La rotation s'applique **après** le redimensionnement et change les dimensions finales :

```javascript
// Design avant rotation: 384×288
// Design après rotation 45°: ~480×480 (diagonale)
```

Toujours recalculer la position de collage après la rotation pour garder le centre au même endroit.

---

## 📊 Comparaison avec/sans Bounding Box

### ❌ SANS bounding box (ancien système)

```typescript
// Backend doit deviner
const containerWidth = delimitation.width × scale; // ⚠️ Quelle délimitation?
const containerHeight = delimitation.height × scale;

// Risques:
// - Utiliser la mauvaise image/délimitation
// - Conversion pixels/% incorrecte
// - Arrondis différents du frontend
```

### ✅ AVEC bounding box (nouveau système)

```typescript
// Backend utilise directement les valeurs du frontend
const { containerWidth, containerHeight } = designPosition;

// Avantages:
// ✅ Valeurs exactes calculées par le frontend
// ✅ Aucune ambiguïté
// ✅ Cohérence pixel-perfect garantie
```

---

## 🧪 Tests de validation

### Test 1: Vérifier que les valeurs sont envoyées

```typescript
// Backend
console.log('📦 Design Position reçue:', designPosition);

// Doit afficher:
// {
//   containerWidth: 384,
//   containerHeight: 480,
//   ...
// }
```

### Test 2: Comparer avec recalcul

```typescript
const expected = {
  width: delimInPixels.width × scale,
  height: delimInPixels.height × scale
};

const diff = {
  width: containerWidth - expected.width,
  height: containerHeight - expected.height
};

console.log('📊 Comparaison bounding box:', {
  received: { containerWidth, containerHeight },
  expected,
  diff,
  isValid: Math.abs(diff.width) <= 1 && Math.abs(diff.height) <= 1
});
```

### Test 3: Vérifier le rendu final

```typescript
// Comparer l'image générée avec la preview frontend
// Les deux doivent être pixel-perfect identiques
```

---

## 🔄 Workflow complet

```
┌─────────────────────────────────────────────────┐
│           FRONTEND (SellDesignPage)             │
│                                                 │
│  1. Utilisateur positionne le design           │
│  2. Frontend calcule:                          │
│     - delimInPixels (image affichée)           │
│     - containerWidth = delimInPixels.width × scale │
│     - containerHeight = delimInPixels.height × scale │
│  3. Sauvegarde en localStorage                 │
│  4. Envoie au backend via API                  │
└─────────────────────────────────────────────────┘
                    │
                    │ POST /vendor/products
                    ▼
┌─────────────────────────────────────────────────┐
│              BACKEND (NestJS)                   │
│                                                 │
│  1. Reçoit designPosition avec:                │
│     - containerWidth ✅                        │
│     - containerHeight ✅                       │
│  2. Utilise directement ces valeurs            │
│  3. Calcule la position finale                 │
│  4. Redimensionne avec Sharp                   │
│  5. Génère l'image finale                      │
│                                                 │
│  Résultat: Image identique au frontend !       │
└─────────────────────────────────────────────────┘
```

---

## 📚 Code d'exemple complet (Backend)

```typescript
// src/vendor-product/services/product-preview-generator.service.ts

export class ProductPreviewGeneratorService {
  async generatePreview(
    productImageUrl: string,
    designImageUrl: string,
    delimitation: Delimitation,
    designPosition: DesignPosition
  ): Promise<Buffer> {

    // 1. Télécharger les images
    const [productBuffer, designBuffer] = await Promise.all([
      this.downloadImage(productImageUrl),
      this.downloadImage(designImageUrl)
    ]);

    // 2. Métadonnées de l'image du produit
    const productMeta = await sharp(productBuffer).metadata();
    const imageWidth = productMeta.width;
    const imageHeight = productMeta.height;

    // 3. Convertir la délimitation en pixels
    const delimInPixels = this.convertDelimitationToPixels(
      delimitation,
      imageWidth,
      imageHeight
    );

    // 4. Extraire les valeurs du bounding box
    const {
      x,
      y,
      scale,
      rotation = 0,
      containerWidth,   // 🎯 Bounding box du frontend
      containerHeight,  // 🎯 Bounding box du frontend
      positionUnit = 'PIXEL'
    } = designPosition;

    // 5. (Optionnel) Validation
    const expectedWidth = delimInPixels.width * scale;
    const expectedHeight = delimInPixels.height * scale;

    if (Math.abs(containerWidth - expectedWidth) > 1 ||
        Math.abs(containerHeight - expectedHeight) > 1) {
      this.logger.warn('Bounding box mismatch, using frontend values');
    }

    // 6. Calculer la position
    const delimCenterX = delimInPixels.x + delimInPixels.width / 2;
    const delimCenterY = delimInPixels.y + delimInPixels.height / 2;

    const offsetX = positionUnit === 'PERCENTAGE'
      ? (x / 100) * delimInPixels.width
      : x;
    const offsetY = positionUnit === 'PERCENTAGE'
      ? (y / 100) * delimInPixels.height
      : y;

    const containerCenterX = delimCenterX + offsetX;
    const containerCenterY = delimCenterY + offsetY;

    // 7. Redimensionner le design
    let processedDesign = await sharp(designBuffer)
      .resize({
        width: Math.round(containerWidth),   // 🎯 Utiliser le bounding box
        height: Math.round(containerHeight), // 🎯 Utiliser le bounding box
        fit: 'inside',
        position: 'center'
      })
      .toBuffer();

    // 8. Récupérer les dimensions réelles
    const resizedMeta = await sharp(processedDesign).metadata();
    let finalWidth = resizedMeta.width;
    let finalHeight = resizedMeta.height;

    // 9. Appliquer la rotation si nécessaire
    if (rotation !== 0) {
      processedDesign = await sharp(processedDesign)
        .rotate(rotation, {
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      const rotatedMeta = await sharp(processedDesign).metadata();
      finalWidth = rotatedMeta.width;
      finalHeight = rotatedMeta.height;
    }

    // 10. Calculer la position de collage
    const pasteLeft = Math.round(containerCenterX - finalWidth / 2);
    const pasteTop = Math.round(containerCenterY - finalHeight / 2);

    // 11. Composer l'image finale
    const finalImage = await sharp(productBuffer)
      .composite([
        {
          input: processedDesign,
          left: pasteLeft,
          top: pasteTop,
          blend: 'over'
        }
      ])
      .toBuffer();

    return finalImage;
  }

  private convertDelimitationToPixels(
    delim: Delimitation,
    imageWidth: number,
    imageHeight: number
  ) {
    const isPixel = delim.coordinateType === 'PIXEL';

    return {
      x: isPixel ? delim.x : (delim.x / 100) * imageWidth,
      y: isPixel ? delim.y : (delim.y / 100) * imageHeight,
      width: isPixel ? delim.width : (delim.width / 100) * imageWidth,
      height: isPixel ? delim.height : (delim.height / 100) * imageHeight
    };
  }
}
```

---

## ✅ Checklist d'implémentation

- [ ] Le backend reçoit `containerWidth` et `containerHeight`
- [ ] Les valeurs sont utilisées pour redimensionner le design
- [ ] Le calcul de position utilise les mêmes formules que le frontend
- [ ] La rotation est gérée après le redimensionnement
- [ ] L'image finale est pixel-perfect identique au frontend
- [ ] Les logs permettent de déboguer facilement
- [ ] Les tests valident la cohérence frontend/backend

---

## 🎯 Conclusion

Le **bounding box** (containerWidth, containerHeight) envoyé par le frontend garantit que le backend place le design **exactement** comme dans la preview.

**Règle d'or** : **TOUJOURS utiliser les valeurs du frontend**. Ne pas recalculer.

**Résultat** : Cohérence pixel-perfect entre la preview et l'image finale générée ! 🎨✨

---

**Auteur:** Claude Sonnet 4.5
**Date:** 18 janvier 2026
**Version:** 1.0
