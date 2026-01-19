# Guide Backend - Utilisation du Bounding Box (Version Simple)

## 🎯 Pour les Développeurs Backend Pressés

Le frontend vous envoie maintenant **containerWidth** et **containerHeight**. Voici comment les utiliser.

---

## ⚡ Quick Start - 3 Étapes

### 1. Ce que vous recevez

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
    "containerWidth": 384,    // ← UTILISEZ CETTE VALEUR
    "containerHeight": 480     // ← UTILISEZ CETTE VALEUR
  }
}
```

### 2. Ce que vous devez faire

```typescript
// ❌ NE PAS FAIRE (recalculer)
const containerWidth = delimitation.width * scale; // NON !

// ✅ FAIRE (utiliser directement)
const { containerWidth, containerHeight } = designPosition; // OUI !
```

### 3. Comment l'utiliser

```typescript
// Redimensionner le design pour qu'il tienne dans le bounding box
const resizedDesign = await sharp(designBuffer)
  .resize({
    width: Math.round(containerWidth),   // ← Utiliser tel quel
    height: Math.round(containerHeight), // ← Utiliser tel quel
    fit: 'inside',
    position: 'center'
  })
  .toBuffer();
```

**C'EST TOUT !** Le bounding box est déjà calculé correctement par le frontend.

---

## 📐 Qu'est-ce que le Bounding Box ?

Le **bounding box** (ou conteneur) est le rectangle dans lequel le design sera placé.

**Formule utilisée par le frontend** :
```javascript
// Le frontend calcule ça pour vous
containerWidth = delimitation_en_pixels.width × scale
containerHeight = delimitation_en_pixels.height × scale
```

**Exemple concret** :
- Délimitation : 480px × 600px
- Scale : 0.8 (80%)
- **Bounding box** : 384px × 480px

Le design est ensuite redimensionné pour tenir dans ces 384×480px.

---

## 💻 Code Backend Complet

### Service de Génération d'Image

```typescript
import sharp from 'sharp';

async function generateProductWithDesign(
  productImageUrl: string,
  designImageUrl: string,
  delimitation: Delimitation,
  designPosition: DesignPosition
): Promise<Buffer> {

  // 1. Télécharger les images
  const [productBuffer, designBuffer] = await Promise.all([
    downloadImage(productImageUrl),
    downloadImage(designImageUrl)
  ]);

  // 2. Métadonnées de l'image produit
  const productMeta = await sharp(productBuffer).metadata();
  const imageWidth = productMeta.width!;
  const imageHeight = productMeta.height!;

  // 3. Extraire les valeurs du frontend
  const {
    x,
    y,
    scale,
    rotation = 0,
    containerWidth,   // ← Valeur du frontend
    containerHeight,  // ← Valeur du frontend
    positionUnit = 'PIXEL'
  } = designPosition;

  console.log('📦 Bounding Box reçu du frontend:', {
    containerWidth,
    containerHeight
  });

  // 4. Convertir la délimitation en pixels (pour calculer les positions)
  const delimInPixels = convertDelimitationToPixels(
    delimitation,
    imageWidth,
    imageHeight
  );

  // 5. Convertir les offsets si nécessaire
  let offsetX = x;
  let offsetY = y;

  if (positionUnit === 'PERCENTAGE') {
    offsetX = (x / 100) * delimInPixels.width;
    offsetY = (y / 100) * delimInPixels.height;
  }

  // 6. Calculer la position du centre du conteneur
  const delimCenterX = delimInPixels.x + delimInPixels.width / 2;
  const delimCenterY = delimInPixels.y + delimInPixels.height / 2;

  const containerCenterX = delimCenterX + offsetX;
  const containerCenterY = delimCenterY + offsetY;

  // 7. 🎯 Redimensionner le design dans le bounding box
  let processedDesign = await sharp(designBuffer)
    .resize({
      width: Math.round(containerWidth),   // ← Utiliser le bounding box
      height: Math.round(containerHeight), // ← Utiliser le bounding box
      fit: 'inside',
      position: 'center'
    })
    .toBuffer();

  // 8. Récupérer les dimensions réelles après resize
  const resizedMeta = await sharp(processedDesign).metadata();
  let finalWidth = resizedMeta.width!;
  let finalHeight = resizedMeta.height!;

  console.log('🖼️ Design redimensionné:', {
    original: { width: designMeta.width, height: designMeta.height },
    boundingBox: { containerWidth, containerHeight },
    resized: { finalWidth, finalHeight }
  });

  // 9. Appliquer la rotation si nécessaire
  if (rotation !== 0) {
    processedDesign = await sharp(processedDesign)
      .rotate(rotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    const rotatedMeta = await sharp(processedDesign).metadata();
    finalWidth = rotatedMeta.width!;
    finalHeight = rotatedMeta.height!;
  }

  // 10. Calculer la position de collage
  const pasteLeft = Math.round(containerCenterX - finalWidth / 2);
  const pasteTop = Math.round(containerCenterY - finalHeight / 2);

  console.log('📍 Position finale du design:', { pasteLeft, pasteTop });

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

  console.log('✅ Image finale générée');

  return finalImage;
}
```

### Fonction Helper

```typescript
/**
 * Convertit la délimitation en pixels absolus
 */
function convertDelimitationToPixels(
  delim: Delimitation,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {

  const isPixel = delim.coordinateType === 'PIXEL';

  return {
    x: isPixel ? delim.x : (delim.x / 100) * imageWidth,
    y: isPixel ? delim.y : (delim.y / 100) * imageHeight,
    width: isPixel ? delim.width : (delim.width / 100) * imageWidth,
    height: isPixel ? delim.height : (delim.height / 100) * imageHeight
  };
}
```

---

## 🔍 Exemple Concret avec Valeurs Réelles

### Données reçues du frontend

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

### Image du produit

- Dimensions : 1200 × 1200 px
- Délimitation : x=30%, y=20%, width=40%, height=50%

### Calculs backend

```typescript
// 1. Délimitation en pixels
const delimInPixels = {
  x: (30/100) * 1200 = 360px,
  y: (20/100) * 1200 = 240px,
  width: (40/100) * 1200 = 480px,
  height: (50/100) * 1200 = 600px
};

// 2. Bounding box (déjà calculé par le frontend)
const containerWidth = 384px;  // ← Du frontend
const containerHeight = 480px; // ← Du frontend

// 3. Centre de la délimitation
const delimCenterX = 360 + 480/2 = 600px;
const delimCenterY = 240 + 600/2 = 540px;

// 4. Centre du conteneur (avec offset)
const containerCenterX = 600 + 50 = 650px;
const containerCenterY = 540 - 30 = 510px;

// 5. Redimensionner le design (800×600 → fit dans 384×480)
await sharp(design).resize({
  width: 384,   // ← containerWidth
  height: 480,  // ← containerHeight
  fit: 'inside'
});
// Résultat: design 384×288 (aspect ratio préservé)

// 6. Position de collage
const pasteLeft = 650 - 384/2 = 458px;
const pasteTop = 510 - 288/2 = 366px;
```

### Résultat visuel

```
┌─────────────────────────────────────────┐
│      Mockup 1200×1200px                 │
│                                         │
│    ┌────────────────────┐               │
│    │  Délimitation      │               │
│    │  360,240           │               │
│    │  480×600px         │               │
│    │                    │               │
│    │   ┌──────────┐     │               │
│    │   │  Design  │     │  ← 384×288px  │
│    │   │ 384×288  │     │  à (458,366)  │
│    │   └──────────┘     │               │
│    │                    │               │
│    └────────────────────┘               │
└─────────────────────────────────────────┘
```

---

## ❓ FAQ Backend

### Q1: Dois-je recalculer containerWidth et containerHeight ?

**NON !** Utilisez directement les valeurs du frontend.

```typescript
// ❌ NE PAS FAIRE
const containerWidth = delimInPixels.width * scale;

// ✅ FAIRE
const { containerWidth, containerHeight } = designPosition;
```

### Q2: Et si je veux valider les valeurs ?

Vous pouvez comparer, mais **utilisez toujours les valeurs du frontend** :

```typescript
// Validation optionnelle
const expectedWidth = delimInPixels.width * scale;
const diff = Math.abs(containerWidth - expectedWidth);

if (diff > 1) {
  console.warn('⚠️ Bounding box différent de l\'attendu:', {
    received: containerWidth,
    expected: expectedWidth,
    diff
  });
}

// Mais UTILISEZ QUAND MÊME la valeur du frontend
await sharp(design).resize({
  width: containerWidth,  // ← Valeur du frontend
  height: containerHeight
});
```

### Q3: Pourquoi le design est plus petit que le bounding box ?

C'est **normal** ! Le design est redimensionné avec `fit: 'inside'` qui **préserve l'aspect ratio**.

**Exemple** :
- Bounding box : 384 × 480 px
- Design original : 800 × 600 px (ratio 4:3)
- Design redimensionné : **384 × 288 px** (ratio 4:3 préservé)

Le design fait 384×288 au lieu de 384×480 car il doit garder son aspect ratio.

### Q4: Comment gérer la rotation ?

La rotation s'applique **après** le redimensionnement :

```typescript
// 1. Redimensionner d'abord
let design = await sharp(buffer).resize({
  width: containerWidth,
  height: containerHeight,
  fit: 'inside'
}).toBuffer();

// 2. Puis rotation
if (rotation !== 0) {
  design = await sharp(design).rotate(rotation, {
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  }).toBuffer();
}
```

### Q5: Les valeurs du frontend sont-elles fiables ?

**OUI !** Le frontend calcule le bounding box à partir de l'image **réellement affichée** à l'utilisateur.

Les valeurs sont basées sur :
- Les dimensions réelles de l'image mockup (`naturalSize.width/height`)
- La délimitation définie dans votre BDD
- Le scale choisi par l'utilisateur

C'est la **source de vérité** pour garantir que l'image finale = preview frontend.

---

## ⚠️ Erreurs Courantes

### Erreur #1: Recalculer le bounding box

```typescript
// ❌ MAUVAIS
const containerWidth = delimitation.width * scale;
const containerHeight = delimitation.height * scale;

await sharp(design).resize({ width: containerWidth, height: containerHeight });
```

**Problème** : Vous risquez d'utiliser une délimitation différente ou des conversions pixels/% différentes.

**Solution** :
```typescript
// ✅ BON
const { containerWidth, containerHeight } = designPosition;

await sharp(design).resize({ width: containerWidth, height: containerHeight });
```

### Erreur #2: Ne pas arrondir les valeurs

```typescript
// ❌ MAUVAIS
await sharp(design).resize({
  width: containerWidth,  // ex: 384.7
  height: containerHeight
});
```

**Problème** : Sharp n'aime pas les valeurs décimales.

**Solution** :
```typescript
// ✅ BON
await sharp(design).resize({
  width: Math.round(containerWidth),
  height: Math.round(containerHeight)
});
```

### Erreur #3: Utiliser fit: 'cover' au lieu de fit: 'inside'

```typescript
// ❌ MAUVAIS
await sharp(design).resize({
  width: containerWidth,
  height: containerHeight,
  fit: 'cover'  // ❌ Le design peut être coupé !
});
```

**Solution** :
```typescript
// ✅ BON
await sharp(design).resize({
  width: containerWidth,
  height: containerHeight,
  fit: 'inside'  // ✅ Préserve l'aspect ratio
});
```

---

## 📊 Checklist de Validation

- [ ] Vous récupérez `containerWidth` et `containerHeight` du payload
- [ ] Vous les utilisez **directement** sans recalculer
- [ ] Vous arrondissez les valeurs (`Math.round()`)
- [ ] Vous utilisez `fit: 'inside'` pour le resize
- [ ] Vous loggez les valeurs pour debug
- [ ] L'image finale est pixel-perfect identique au frontend

---

## 🐛 Debug

### Logs à Ajouter

```typescript
console.log('📦 === GÉNÉRATION IMAGE AVEC BOUNDING BOX ===');
console.log('📦 Bounding Box reçu:', { containerWidth, containerHeight });
console.log('📐 Délimitation en pixels:', delimInPixels);
console.log('📍 Centre délimitation:', { delimCenterX, delimCenterY });
console.log('📍 Centre conteneur:', { containerCenterX, containerCenterY });
console.log('🎨 Design après resize:', { finalWidth, finalHeight });
console.log('📍 Position finale:', { pasteLeft, pasteTop });
```

### Comparer avec le Frontend

1. **Frontend** : Prendre une capture de la preview
2. **Backend** : Générer l'image finale
3. **Comparer** : Les deux doivent être identiques

Si différent :
- Vérifier les logs ci-dessus
- Comparer avec les logs frontend
- Vérifier que vous utilisez bien le bounding box du frontend

---

## 🎯 Résumé en 3 Points

1. **Le frontend envoie containerWidth et containerHeight**
   - Ces valeurs sont déjà calculées correctement
   - Basées sur l'image réelle affichée à l'utilisateur

2. **Utilisez-les directement dans Sharp**
   ```typescript
   await sharp(design).resize({
     width: Math.round(containerWidth),
     height: Math.round(containerHeight),
     fit: 'inside'
   })
   ```

3. **Ne recalculez PAS**
   - Le frontend est la source de vérité
   - Garantit que l'image finale = preview frontend

---

## 📞 Support

Si l'image générée est différente du frontend :

1. Comparer les logs frontend/backend
2. Vérifier que vous utilisez `containerWidth/containerHeight` du payload
3. Vérifier que vous n'utilisez pas `fit: 'cover'`
4. Vérifier que la délimitation est la même

**La règle d'or** : Faites confiance aux valeurs du frontend ! 🎨

---

**Auteur:** Claude Sonnet 4.5
**Date:** 18 janvier 2026
**Version:** 1.0
