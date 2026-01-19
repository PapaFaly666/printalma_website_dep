# Comment le Frontend Affiche le Design EXACTEMENT là où il est Positionné

## 🎯 Objectif

Expliquer au backend **ligne par ligne** comment `SimpleProductPreview.tsx` affiche le design pour que le backend reproduise le même rendu.

---

## 📋 Contexte

Quand le vendeur positionne un design dans `SellDesignPage.tsx` :
1. Les positions sont **sauvegardées** (x, y, scale, rotation)
2. Ces positions sont **envoyées au backend** via l'API
3. Le frontend **affiche** le design avec `SimpleProductPreview.tsx`
4. Le backend **doit générer** une image identique

---

## 🔍 Analyse Complète du Code Frontend

### Fichier : `/src/components/vendor/SimpleProductPreview.tsx`

---

## Étape 1 : Récupération de la Position du Design

### Code (lignes 384-533)

```typescript
const getDesignPosition = () => {
  console.log('🎨 getDesignPosition - Début de la fonction');

  // 1. Essayer designPositions depuis l'API
  if (product.designPositions && product.designPositions.length > 0) {
    const designPos = product.designPositions[0];
    console.log('📍 Position depuis designPositions:', designPos.position);

    return {
      x: designPos.position.x,           // Offset X (ex: 0)
      y: designPos.position.y,           // Offset Y (ex: -10)
      scale: designPos.position.scale,   // Échelle (ex: 0.8)
      rotation: designPos.position.rotation || 0,  // Rotation (ex: 0)
      designWidth: designPos.position.designWidth,   // Largeur design
      designHeight: designPos.position.designHeight, // Hauteur design
      source: 'designPositions'
    };
  }

  // 2. Essayer designTransforms depuis l'API
  if (product.designTransforms && product.designTransforms.length > 0) {
    const designTransform = product.designTransforms[0];
    const transform = designTransform.transforms['0']; // Délimitation 0

    if (transform) {
      return {
        x: transform.x,
        y: transform.y,
        scale: transform.scale,
        rotation: transform.rotation || 0,
        designWidth: transform.designWidth,
        designHeight: transform.designHeight,
        source: 'designTransforms'
      };
    }
  }

  // 3. Essayer localStorage (fallback)
  if (product.designId && user?.id) {
    const localStorageData = DesignPositionService.getPosition(
      product.designId,
      product.adminProduct.id,
      user.id
    );

    if (localStorageData && localStorageData.position) {
      return {
        x: localStorageData.position.x,
        y: localStorageData.position.y,
        scale: localStorageData.position.scale,
        rotation: localStorageData.position.rotation || 0,
        designWidth: localStorageData.position.designWidth,
        designHeight: localStorageData.position.designHeight,
        source: 'localStorage'
      };
    }
  }

  // 4. Fallback par défaut
  return {
    x: 0,
    y: 0,
    scale: 0.8,
    rotation: 0,
    source: 'default'
  };
};
```

**Résultat** : Un objet contenant les positions exactes du design.

```javascript
{
  x: 0,         // Offset X depuis centre délimitation
  y: -10,       // Offset Y depuis centre délimitation
  scale: 0.8,   // 80% de la délimitation
  rotation: 0,  // Pas de rotation
  designWidth: 512,
  designHeight: 512
}
```

---

## Étape 2 : Conversion de la Délimitation en Pixels

### Code (lignes 620-636)

```typescript
const computePxPosition = (delim: DelimitationData) => {
  // Dimensions du conteneur d'affichage
  const { width: contW, height: contH } = containerRef.current?.getBoundingClientRect()
    || { width: 0, height: 0 };

  if (contW === 0 || contH === 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  // Dimensions originales de l'image mockup
  const imgW = imageMetrics?.originalWidth || 1200;
  const imgH = imageMetrics?.originalHeight || 1200;

  // Conversion délimitation pourcentage → pixels
  return computeResponsivePosition(
    delim,                              // Délimitation (x, y, width, height en %)
    { width: contW, height: contH },    // Dimensions conteneur
    { originalWidth: imgW, originalHeight: imgH }, // Dimensions image
    'contain'                           // object-fit: contain
  );
};
```

**Exemple de calcul** :

```javascript
// Entrée
delim = {
  x: 25,        // 25%
  y: 25,        // 25%
  width: 50,    // 50%
  height: 50,   // 50%
  coordinateType: 'PERCENTAGE'
}

imgW = 1200
imgH = 1200
contW = 400  // Conteneur d'affichage
contH = 400

// Sortie (après conversion et adaptation au conteneur)
pos = {
  left: 100,    // Position X en pixels d'affichage
  top: 100,     // Position Y en pixels d'affichage
  width: 200,   // Largeur en pixels d'affichage
  height: 200   // Hauteur en pixels d'affichage
}
```

---

## Étape 3 : Calcul des Dimensions du Conteneur du Design

### Code (lignes 819-823)

```typescript
// Récupérer la position du design
const { x, y, scale, rotation, designWidth, designHeight } = designPosition;

// Obtenir la délimitation en pixels
const delimitation = delimitations[0];
const pos = computePxPosition(delimitation);

// ⚠️ CALCUL CRITIQUE : Dimensions du conteneur du design
const designScale = scale || 0.8;
const actualDesignWidth = pos.width * designScale;    // 200 * 0.8 = 160px
const actualDesignHeight = pos.height * designScale;  // 200 * 0.8 = 160px
```

**Explication** :
- Le conteneur du design fait **exactement** `scale` × dimensions de la délimitation
- Si la délimitation fait 200×200px et scale = 0.8, le conteneur fait 160×160px
- Le design sera affiché **DANS** ce conteneur avec `object-fit: contain`

---

## Étape 4 : Calcul des Contraintes de Position

### Code (lignes 825-831)

```typescript
// Contraintes pour que le design reste DANS la délimitation
const maxX = (pos.width - actualDesignWidth) / 2;   // (200-160)/2 = 20px
const minX = -(pos.width - actualDesignWidth) / 2;  // -20px
const maxY = (pos.height - actualDesignHeight) / 2; // 20px
const minY = -(pos.height - actualDesignHeight) / 2; // -20px

// Appliquer les contraintes (clamp)
const adjustedX = Math.max(minX, Math.min(x, maxX));
const adjustedY = Math.max(minY, Math.min(y, maxY));
```

**Exemple** :
```javascript
x = 50  // Demandé : 50px vers la droite
maxX = 20  // Maximum autorisé : 20px

adjustedX = Math.min(50, 20) = 20  // Limité à 20px
```

---

## Étape 5 : Affichage HTML/CSS du Design

### Code (lignes 850-890)

```html
<!-- Conteneur de la délimitation -->
<div
  className="absolute overflow-hidden"
  style={{
    left: pos.left,      // 100px
    top: pos.top,        // 100px
    width: pos.width,    // 200px
    height: pos.height,  // 200px
    pointerEvents: 'none'
  }}
>
  <!-- Conteneur du design -->
  <div
    className="absolute pointer-events-none select-none"
    style={{
      left: '50%',                    // Centre horizontal délimitation
      top: '50%',                     // Centre vertical délimitation
      width: actualDesignWidth,       // 160px (80% de 200px)
      height: actualDesignHeight,     // 160px
      transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${rotation || 0}deg)`,
      transformOrigin: 'center center',
    }}
  >
    <!-- Image du design -->
    <img
      src={product.designApplication.designUrl}
      className="object-contain"  // ⚠️ CRITIQUE : préserve aspect ratio
      style={{
        width: '100%',              // 100% du conteneur (160px)
        height: '100%',             // 100% du conteneur (160px)
      }}
    />
  </div>
</div>
```

---

## 📐 Décomposition du Transform CSS

### Le transform a 3 transformations dans l'ordre :

```css
transform:
  translate(-50%, -50%)              /* 1. Centre le conteneur */
  translate(${adjustedX}px, ${adjustedY}px)  /* 2. Applique l'offset */
  rotate(${rotation}deg)             /* 3. Applique la rotation */
```

### 1. `translate(-50%, -50%)`

```
Avant:
┌─────────────────────────────────┐
│ Délimitation                    │
│                                 │
│  [Design]  ← Coin supérieur     │
│            gauche à left:50%,   │
│            top:50%              │
│                                 │
└─────────────────────────────────┘

Après translate(-50%, -50%):
┌─────────────────────────────────┐
│ Délimitation                    │
│                                 │
│        [Design]  ← Centre du    │
│                    design au    │
│                    centre de la │
│                    délimitation │
└─────────────────────────────────┘
```

**Calcul** :
- `left: 50%` = 100px (centre horizontal de la délimitation)
- `top: 50%` = 100px (centre vertical de la délimitation)
- `translate(-50%, -50%)` = décale le design de -80px en X et -80px en Y
- **Résultat** : Le centre du design est à (100, 100)

### 2. `translate(${adjustedX}px, ${adjustedY}px)`

```
Offset demandé : x=0, y=-10

Avant:
┌─────────────────────────────────┐
│ Délimitation                    │
│                                 │
│        [Design]  ← Centré       │
│                                 │
└─────────────────────────────────┘

Après translate(0px, -10px):
┌─────────────────────────────────┐
│ Délimitation                    │
│        [Design]  ← Décalé 10px  │
│                    vers le haut │
│                                 │
└─────────────────────────────────┘
```

**Calcul** :
- Centre initial : (100, 100)
- Offset : x=0, y=-10
- **Résultat** : Centre du design à (100, 90)

### 3. `rotate(${rotation}deg)`

```
Rotation : 15°

Avant:
┌─────────────────┐
│     Design      │
│                 │
└─────────────────┘

Après rotate(15deg):
    ┌─────────┐
   ╱ Design   ╲
  ╱            ╲
 └──────────────┘
```

**Point de rotation** : `transformOrigin: center center`
- La rotation se fait autour du centre du conteneur
- Le centre reste à la même position

---

## 💻 Équivalent Backend avec Sharp

### Fonction Complète

```javascript
async function displayDesignExactlyLikeFrontend(
  mockupUrl,
  designUrl,
  delimitation,
  designPosition
) {
  // =================================================================
  // ÉTAPE 1 : Charger les images
  // =================================================================
  const [mockupBuffer, designBuffer] = await Promise.all([
    downloadImage(mockupUrl),
    downloadImage(designUrl)
  ]);

  const mockupMetadata = await sharp(mockupBuffer).metadata();
  const mockupWidth = mockupMetadata.width;
  const mockupHeight = mockupMetadata.height;

  console.log('📐 Dimensions mockup:', { mockupWidth, mockupHeight });

  // =================================================================
  // ÉTAPE 2 : Convertir délimitation en pixels
  // Correspond à computePxPosition() du frontend
  // =================================================================
  let delimInPixels;

  if (delimitation.coordinateType === 'PERCENTAGE') {
    delimInPixels = {
      x: (delimitation.x / 100) * mockupWidth,
      y: (delimitation.y / 100) * mockupHeight,
      width: (delimitation.width / 100) * mockupWidth,
      height: (delimitation.height / 100) * mockupHeight
    };
  } else {
    delimInPixels = delimitation;
  }

  console.log('📍 Délimitation en pixels:', delimInPixels);

  // =================================================================
  // ÉTAPE 3 : Calculer dimensions conteneur design
  // Correspond aux lignes 819-823 du frontend
  // =================================================================
  const scale = designPosition.scale || 0.8;

  const containerWidth = delimInPixels.width * scale;
  const containerHeight = delimInPixels.height * scale;

  console.log('📦 Dimensions conteneur:', { containerWidth, containerHeight });

  // =================================================================
  // ÉTAPE 4 : Calculer contraintes
  // Correspond aux lignes 825-831 du frontend
  // =================================================================
  const maxX = (delimInPixels.width - containerWidth) / 2;
  const minX = -(delimInPixels.width - containerWidth) / 2;
  const maxY = (delimInPixels.height - containerHeight) / 2;
  const minY = -(delimInPixels.height - containerHeight) / 2;

  const x = designPosition.x || 0;
  const y = designPosition.y || 0;
  const adjustedX = Math.max(minX, Math.min(x, maxX));
  const adjustedY = Math.max(minY, Math.min(y, maxY));

  console.log('📍 Position ajustée:', { adjustedX, adjustedY });

  // =================================================================
  // ÉTAPE 5 : Calculer position finale
  // Correspond au transform: translate(-50%, -50%) translate(x, y)
  // =================================================================
  // Centre de la délimitation
  const delimCenterX = delimInPixels.x + (delimInPixels.width / 2);
  const delimCenterY = delimInPixels.y + (delimInPixels.height / 2);

  // Position du centre du conteneur
  const containerCenterX = delimCenterX + adjustedX;
  const containerCenterY = delimCenterY + adjustedY;

  // Position du coin supérieur gauche (pour Sharp)
  const containerLeft = containerCenterX - (containerWidth / 2);
  const containerTop = containerCenterY - (containerHeight / 2);

  console.log('📍 Position conteneur:', {
    centerX: containerCenterX,
    centerY: containerCenterY,
    left: containerLeft,
    top: containerTop
  });

  // =================================================================
  // ÉTAPE 6 : Redimensionner design avec object-fit: contain
  // Correspond à className="object-contain"
  // =================================================================
  let resizedDesign = await sharp(designBuffer)
    .resize({
      width: Math.round(containerWidth),
      height: Math.round(containerHeight),
      fit: 'inside',              // ⚠️ = object-fit: contain du CSS
      withoutEnlargement: false,
      position: 'center',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  const resizedMetadata = await sharp(resizedDesign).metadata();

  // =================================================================
  // ÉTAPE 7 : Créer canvas transparent et centrer le design
  // Le design redimensionné peut être plus petit que le conteneur
  // =================================================================
  const designOffsetX = Math.round((containerWidth - resizedMetadata.width) / 2);
  const designOffsetY = Math.round((containerHeight - resizedMetadata.height) / 2);

  const designInContainer = await sharp({
    create: {
      width: Math.round(containerWidth),
      height: Math.round(containerHeight),
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{
    input: resizedDesign,
    left: designOffsetX,
    top: designOffsetY
  }])
  .png()
  .toBuffer();

  // =================================================================
  // ÉTAPE 8 : Appliquer rotation si nécessaire
  // Correspond à rotate() du transform
  // =================================================================
  let processedDesign = designInContainer;
  const rotation = designPosition.rotation || 0;

  if (rotation !== 0) {
    console.log('🔄 Application rotation:', rotation + '°');

    processedDesign = await sharp(designInContainer)
      .rotate(rotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Recalculer position après rotation
    const rotatedMetadata = await sharp(processedDesign).metadata();
    const rotatedLeft = containerCenterX - (rotatedMetadata.width / 2);
    const rotatedTop = containerCenterY - (rotatedMetadata.height / 2);

    // Composer avec rotation
    const finalImage = await sharp(mockupBuffer)
      .composite([{
        input: processedDesign,
        left: Math.round(rotatedLeft),
        top: Math.round(rotatedTop)
      }])
      .png({ quality: 95 })
      .toBuffer();

    return finalImage;
  }

  // =================================================================
  // ÉTAPE 9 : Composer image finale (sans rotation)
  // =================================================================
  const finalImage = await sharp(mockupBuffer)
    .composite([{
      input: processedDesign,
      left: Math.round(containerLeft),
      top: Math.round(containerTop)
    }])
    .png({ quality: 95 })
    .toBuffer();

  console.log('✅ Image générée EXACTEMENT comme le frontend');
  return finalImage;
}
```

---

## 📊 Exemple Complet avec Valeurs

### Données d'entrée

```javascript
mockup: 1200x1200px
delimitation: {
  x: 25,        // 25%
  y: 25,        // 25%
  width: 50,    // 50%
  height: 50,   // 50%
  coordinateType: 'PERCENTAGE'
}
designPosition: {
  x: 0,         // Centré
  y: -10,       // 10px vers le haut
  scale: 0.8,   // 80%
  rotation: 0
}
design: 512x512px
```

### Calculs étape par étape

```javascript
// Étape 1 : Délimitation en pixels
delimInPixels = {
  x: (25/100) * 1200 = 300px
  y: (25/100) * 1200 = 300px
  width: (50/100) * 1200 = 600px
  height: (50/100) * 1200 = 600px
}

// Étape 2 : Dimensions conteneur
containerWidth = 600 * 0.8 = 480px
containerHeight = 600 * 0.8 = 480px

// Étape 3 : Contraintes
maxX = (600 - 480) / 2 = 60px
minX = -60px
maxY = 60px
minY = -60px

adjustedX = clamp(0, -60, 60) = 0px
adjustedY = clamp(-10, -60, 60) = -10px  // Dans les limites

// Étape 4 : Centre délimitation
delimCenterX = 300 + (600/2) = 600px
delimCenterY = 300 + (600/2) = 600px

// Étape 5 : Centre conteneur
containerCenterX = 600 + 0 = 600px
containerCenterY = 600 + (-10) = 590px

// Étape 6 : Position coin supérieur gauche
containerLeft = 600 - (480/2) = 360px
containerTop = 590 - (480/2) = 350px

// Résultat final pour Sharp
{
  left: 360,
  top: 350,
  width: 480,
  height: 480
}
```

### Résultat visuel

```
Image mockup (1200x1200)
┌─────────────────────────────────────┐
│                                     │
│     Délimitation (300,300,600,600)  │
│     ┌─────────────────────┐         │
│     │                     │         │
│     │   [Design]  ← 360,350,480,480│
│     │   Décalé    (10px vers haut) │
│     │   10px haut                  │
│     └─────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Validation

Pour vérifier que le backend reproduit le frontend :

- [ ] Les dimensions du conteneur = `delimWidth * scale` et `delimHeight * scale`
- [ ] Le design est redimensionné avec `fit: 'inside'` (= object-fit: contain)
- [ ] Le design est centré dans un canvas transparent aux dimensions du conteneur
- [ ] Les offsets x,y sont appliqués depuis le centre de la délimitation
- [ ] Les contraintes (min/max) sont appliquées
- [ ] La rotation utilise le centre comme point d'origine
- [ ] Le résultat est identique au frontend pixel par pixel

---

## 🐛 Debug

### Comparer Frontend vs Backend

1. **Frontend** : Ouvrir DevTools, chercher :
   ```
   🎨 Positionnement exact comme SellDesignPage
   ```

2. **Comparer les valeurs** :
   ```javascript
   Frontend:
   delimInPixels: { x: 300, y: 300, width: 600, height: 600 }
   containerWidth: 480
   adjustedX: 0, adjustedY: -10
   containerLeft: 360, containerTop: 350

   Backend: (doit être identique)
   delimInPixels: { x: 300, y: 300, width: 600, height: 600 }
   containerWidth: 480
   adjustedX: 0, adjustedY: -10
   containerLeft: 360, containerTop: 350
   ```

3. **Logs détaillés** :
   ```javascript
   console.log('📐 Mockup:', mockupWidth, mockupHeight);
   console.log('📍 Délimitation pixels:', delimInPixels);
   console.log('📦 Conteneur:', containerWidth, containerHeight);
   console.log('📍 Position:', adjustedX, adjustedY);
   console.log('🎯 Position finale:', containerLeft, containerTop);
   ```

---

## 📚 Références

- **Frontend** : `/src/components/vendor/SimpleProductPreview.tsx` (lignes 790-937)
- **Code Sharp complet** : `/docs/BACKEND_DESIGN_POSITIONING_EXACT.md`
- **Flux complet** : `/docs/DESIGN_POSITION_FLOW.md`

---

**Version** : 1.0
**Date** : 15 janvier 2026
**Auteur** : Explication ligne par ligne du rendu frontend
