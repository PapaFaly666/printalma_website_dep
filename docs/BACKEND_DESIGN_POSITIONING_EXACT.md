# Guide Backend : Reproduire EXACTEMENT le Positionnement du Frontend

## 🎯 Objectif

Le backend doit générer des images **pixel-perfect** identiques à ce que l'utilisateur voit dans `SimpleProductPreview.tsx`.

---

## 📋 Code Frontend de Référence

**Fichier** : `/src/components/vendor/SimpleProductPreview.tsx`
**Lignes critiques** : 620-937

---

## 🔍 Analyse Ligne par Ligne du Frontend

### Ligne 620-636 : Fonction `computePxPosition` (Conversion délimitation)

```typescript
const computePxPosition = (delim: DelimitationData) => {
  // Obtenir les dimensions du conteneur
  const { width: contW, height: contH } = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
  if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

  // Dimensions originales de l'image mockup
  const imgW = imageMetrics?.originalWidth || 1200;
  const imgH = imageMetrics?.originalHeight || 1200;

  // Utiliser la fonction partagée pour un calcul responsif cohérent
  return computeResponsivePosition(
    delim,
    { width: contW, height: contH },
    { originalWidth: imgW, originalHeight: imgH },
    'contain'
  );
};
```

**Ce que ça fait** :
- Convertit les coordonnées de la délimitation (pourcentage) en pixels d'affichage
- Prend en compte l'`object-fit: contain` de l'image mockup

### Lignes 819-823 : Calcul des dimensions du conteneur du design

```typescript
const designScale = scale || 0.8; // Ratio constant par défaut : 80% de la délimitation
const actualDesignWidth = pos.width * designScale;    // Ex: 600px * 0.8 = 480px
const actualDesignHeight = pos.height * designScale;  // Ex: 600px * 0.8 = 480px
```

**⚠️ TRÈS IMPORTANT** :
- Le conteneur du design fait **exactement** `scale` × dimensions de la délimitation
- **AUCUN ajustement** d'aspect ratio n'est fait ici
- Le design garde son aspect ratio grâce à `object-fit: contain` plus tard

### Lignes 825-831 : Calcul des contraintes de position

```typescript
const maxX = (pos.width - actualDesignWidth) / 2;   // Espace disponible à droite
const minX = -(pos.width - actualDesignWidth) / 2;  // Espace disponible à gauche
const maxY = (pos.height - actualDesignHeight) / 2; // Espace disponible en bas
const minY = -(pos.height - actualDesignHeight) / 2; // Espace disponible en haut

const adjustedX = Math.max(minX, Math.min(x, maxX));
const adjustedY = Math.max(minY, Math.min(y, maxY));
```

**Ce que ça fait** :
- Calcule les limites pour que le design reste **dans** la délimitation
- `x` et `y` sont des **offsets relatifs au centre** de la délimitation
- Les contraintes empêchent le design de sortir

### Lignes 850-890 : Affichage du design (structure HTML/CSS)

```html
<!-- Conteneur de la délimitation -->
<div
  className="absolute overflow-hidden"
  style={{
    left: pos.left,      // Position délimitation en pixels
    top: pos.top,
    width: pos.width,    // Dimensions délimitation en pixels
    height: pos.height,
    pointerEvents: 'none'
  }}
>
  <!-- Conteneur du design -->
  <div
    className="absolute pointer-events-none select-none"
    style={{
      left: '50%',              // Centre de la délimitation
      top: '50%',
      width: actualDesignWidth,  // 480px (80% de 600px)
      height: actualDesignHeight, // 480px
      // Transform pour centrer, puis appliquer offset, puis rotation
      transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${rotation || 0}deg)`,
      transformOrigin: 'center center',
    }}
  >
    <!-- Image du design -->
    <img
      src={product.designApplication.designUrl}
      className="object-contain"  // ⚠️ CRITIQUE : préserve l'aspect ratio
      style={{
        width: '100%',
        height: '100%',
        transform: 'scale(1)', // Pas de scale supplémentaire
      }}
    />
  </div>
</div>
```

**Décomposition du transform** :
1. `translate(-50%, -50%)` : Centre le conteneur du design au centre de la délimitation
2. `translate(${adjustedX}px, ${adjustedY}px)` : Applique l'offset utilisateur
3. `rotate(${rotation}deg)` : Applique la rotation

---

## 💻 Implémentation Backend avec Sharp

### Code Complet Commenté

```javascript
const sharp = require('sharp');
const axios = require('axios');

/**
 * Télécharge une image depuis une URL
 */
async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

/**
 * Reproduit EXACTEMENT la logique de SimpleProductPreview.tsx
 */
async function generateFinalImageExact(
  mockupUrl,      // URL de l'image mockup (ex: T-shirt blanc)
  designUrl,      // URL du design (ex: logo SVG/PNG)
  delimitation,   // Délimitation depuis l'API
  designPosition  // Position du design depuis l'API
) {
  console.log('🎨 === DÉBUT GÉNÉRATION IMAGE FINALE ===');

  // =================================================================
  // ÉTAPE 1 : Charger les images et métadonnées
  // =================================================================
  console.log('📥 Téléchargement des images...');
  const [mockupBuffer, designBuffer] = await Promise.all([
    downloadImage(mockupUrl),
    downloadImage(designUrl)
  ]);

  const mockupMetadata = await sharp(mockupBuffer).metadata();
  const designMetadata = await sharp(designBuffer).metadata();

  const mockupWidth = mockupMetadata.width;
  const mockupHeight = mockupMetadata.height;
  const designWidth = designMetadata.width;
  const designHeight = designMetadata.height;

  console.log('📐 Dimensions mockup:', { mockupWidth, mockupHeight });
  console.log('🎨 Dimensions design:', { designWidth, designHeight });

  // =================================================================
  // ÉTAPE 2 : Convertir la délimitation en pixels
  // Correspond à computePxPosition() du frontend
  // =================================================================
  console.log('📍 Conversion délimitation en pixels...');
  console.log('📍 Délimitation reçue:', delimitation);

  let delimInPixels;

  if (delimitation.coordinateType === 'PERCENTAGE') {
    // Cas 1 : Pourcentage standard (0-100)
    if (delimitation.x <= 100 && delimitation.y <= 100 &&
        delimitation.width <= 100 && delimitation.height <= 100) {

      delimInPixels = {
        x: (delimitation.x / 100) * mockupWidth,
        y: (delimitation.y / 100) * mockupHeight,
        width: (delimitation.width / 100) * mockupWidth,
        height: (delimitation.height / 100) * mockupHeight
      };

    } else {
      // Cas 2 : Valeurs en pixels stockées avec PERCENTAGE
      // (le frontend admin peut stocker des pixels dans une image de référence)
      const refWidth = delimitation.originalImageWidth || mockupWidth;
      const refHeight = delimitation.originalImageHeight || mockupHeight;

      // Convertir pixels de référence → pourcentage → pixels actuels
      const percentX = (delimitation.x / refWidth) * 100;
      const percentY = (delimitation.y / refHeight) * 100;
      const percentWidth = (delimitation.width / refWidth) * 100;
      const percentHeight = (delimitation.height / refHeight) * 100;

      delimInPixels = {
        x: (percentX / 100) * mockupWidth,
        y: (percentY / 100) * mockupHeight,
        width: (percentWidth / 100) * mockupWidth,
        height: (percentHeight / 100) * mockupHeight
      };
    }
  } else {
    // PIXEL : déjà en pixels
    delimInPixels = {
      x: delimitation.x,
      y: delimitation.y,
      width: delimitation.width,
      height: delimitation.height
    };
  }

  console.log('📍 Délimitation en pixels:', delimInPixels);

  // =================================================================
  // ÉTAPE 3 : Calculer les dimensions du conteneur du design
  // Correspond aux lignes 819-823 du frontend
  // =================================================================
  const scale = designPosition.scale || 0.8;

  // ⚠️ IMPORTANT : Appliquer le scale DIRECTEMENT aux dimensions de la délimitation
  // Le frontend ne fait AUCUN ajustement d'aspect ratio ici
  const containerWidth = delimInPixels.width * scale;
  const containerHeight = delimInPixels.height * scale;

  console.log('📦 Dimensions conteneur design (scale ' + scale + '):', {
    containerWidth,
    containerHeight,
    scale
  });

  // =================================================================
  // ÉTAPE 4 : Calculer les contraintes de position
  // Correspond aux lignes 825-831 du frontend
  // =================================================================
  const maxX = (delimInPixels.width - containerWidth) / 2;
  const minX = -(delimInPixels.width - containerWidth) / 2;
  const maxY = (delimInPixels.height - containerHeight) / 2;
  const minY = -(delimInPixels.height - containerHeight) / 2;

  // Appliquer les contraintes (clamp)
  const x = designPosition.x || 0;
  const y = designPosition.y || 0;
  const adjustedX = Math.max(minX, Math.min(x, maxX));
  const adjustedY = Math.max(minY, Math.min(y, maxY));

  console.log('🔒 Contraintes:', { minX, maxX, minY, maxY });
  console.log('📍 Position:', {
    demandée: { x, y },
    ajustée: { adjustedX, adjustedY }
  });

  // =================================================================
  // ÉTAPE 5 : Calculer la position finale du conteneur
  // Correspond au transform du frontend
  // =================================================================
  // Centre de la délimitation
  const delimCenterX = delimInPixels.x + (delimInPixels.width / 2);
  const delimCenterY = delimInPixels.y + (delimInPixels.height / 2);

  // Position du centre du conteneur du design
  const containerCenterX = delimCenterX + adjustedX;
  const containerCenterY = delimCenterY + adjustedY;

  // Position du coin supérieur gauche du conteneur (pour Sharp)
  const containerLeft = containerCenterX - (containerWidth / 2);
  const containerTop = containerCenterY - (containerHeight / 2);

  console.log('📍 Position conteneur:', {
    centerX: containerCenterX,
    centerY: containerCenterY,
    left: containerLeft,
    top: containerTop
  });

  // =================================================================
  // ÉTAPE 6 : Redimensionner le design avec object-fit: contain
  // Correspond à l'image avec className="object-contain"
  // =================================================================
  console.log('🖼️ Redimensionnement design avec fit: inside...');

  // Sharp avec fit: 'inside' = équivalent CSS object-fit: contain
  // Le design garde son aspect ratio et est contenu dans le conteneur
  let resizedDesign = await sharp(designBuffer)
    .resize({
      width: Math.round(containerWidth),
      height: Math.round(containerHeight),
      fit: 'inside',              // ⚠️ CRITIQUE : équivaut à object-fit: contain
      withoutEnlargement: false,
      position: 'center',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // Obtenir les dimensions réelles après resize
  const resizedMetadata = await sharp(resizedDesign).metadata();
  console.log('🖼️ Dimensions après resize:', {
    width: resizedMetadata.width,
    height: resizedMetadata.height
  });

  // =================================================================
  // ÉTAPE 7 : Créer un canvas transparent aux dimensions du conteneur
  // =================================================================
  // Le design redimensionné peut être plus petit que le conteneur
  // (à cause de fit: inside qui préserve l'aspect ratio)
  // On doit le centrer dans un canvas transparent de la taille du conteneur

  console.log('🎨 Création canvas transparent...');

  // Centrer le design redimensionné dans le conteneur
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
  // ÉTAPE 8 : Appliquer la rotation (si nécessaire)
  // Correspond au rotate() dans le transform
  // =================================================================
  let processedDesign = designInContainer;
  const rotation = designPosition.rotation || 0;

  if (rotation !== 0) {
    console.log('🔄 Application rotation:', rotation + '°');

    // Sharp rotate avec fond transparent
    processedDesign = await sharp(designInContainer)
      .rotate(rotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // La rotation peut changer les dimensions (pour contenir l'image tournée)
    const rotatedMetadata = await sharp(processedDesign).metadata();
    console.log('🔄 Dimensions après rotation:', {
      width: rotatedMetadata.width,
      height: rotatedMetadata.height
    });

    // Recalculer le centre après rotation
    const rotatedCenterX = containerCenterX;
    const rotatedCenterY = containerCenterY;
    const rotatedLeft = rotatedCenterX - (rotatedMetadata.width / 2);
    const rotatedTop = rotatedCenterY - (rotatedMetadata.height / 2);

    // Composer l'image finale avec le design tourné
    const finalImage = await sharp(mockupBuffer)
      .composite([{
        input: processedDesign,
        left: Math.round(rotatedLeft),
        top: Math.round(rotatedTop)
      }])
      .png({ quality: 95 })
      .toBuffer();

    console.log('✅ Image finale générée avec rotation');
    return finalImage;
  }

  // =================================================================
  // ÉTAPE 9 : Composer l'image finale (sans rotation)
  // =================================================================
  console.log('🎨 Composition finale...');

  const finalImage = await sharp(mockupBuffer)
    .composite([{
      input: processedDesign,
      left: Math.round(containerLeft),
      top: Math.round(containerTop)
    }])
    .png({ quality: 95 })
    .toBuffer();

  console.log('✅ Image finale générée avec succès');
  console.log('🎨 === FIN GÉNÉRATION IMAGE FINALE ===\n');

  return finalImage;
}

// =================================================================
// EXEMPLE D'UTILISATION
// =================================================================
async function example() {
  const mockupUrl = 'https://cdn.example.com/tshirt-white-front-1200x1200.jpg';
  const designUrl = 'https://cdn.example.com/logo-512x512.png';

  // Données depuis l'API
  const delimitation = {
    x: 25,        // 25% depuis le bord gauche
    y: 25,        // 25% depuis le bord haut
    width: 50,    // 50% de largeur
    height: 50,   // 50% de hauteur
    coordinateType: 'PERCENTAGE',
    originalImageWidth: 1200,
    originalImageHeight: 1200
  };

  const designPosition = {
    x: 0,         // Centré horizontalement (offset 0)
    y: 0,         // Centré verticalement (offset 0)
    scale: 0.8,   // 80% de la délimitation
    rotation: 0   // Pas de rotation
  };

  try {
    const finalImageBuffer = await generateFinalImageExact(
      mockupUrl,
      designUrl,
      delimitation,
      designPosition
    );

    // Sauvegarder ou uploader sur Cloudinary
    const fs = require('fs');
    fs.writeFileSync('final-image.png', finalImageBuffer);
    console.log('💾 Image sauvegardée: final-image.png');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exporter la fonction
module.exports = { generateFinalImageExact };
```

---

## 🎯 Explication Détaillée du Transform CSS

Le frontend utilise ce transform :
```css
transform: translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${rotation}deg)
```

### Décomposition :

1. **`translate(-50%, -50%)`**
   - Déplace le conteneur de -50% de sa propre taille en X et Y
   - Effet : Le **centre** du conteneur est maintenant à la position `left: 50%, top: 50%`
   - Le conteneur est centré au centre de la délimitation

2. **`translate(${adjustedX}px, ${adjustedY}px)`**
   - Applique l'offset utilisateur
   - `adjustedX` peut être négatif (gauche) ou positif (droite)
   - `adjustedY` peut être négatif (haut) ou positif (bas)

3. **`rotate(${rotation}deg)`**
   - Rotation autour du `transformOrigin: center center`
   - Le centre du design reste fixe, l'image tourne autour

### Équivalent Backend (Sharp) :

```javascript
// 1. Centrer au centre de la délimitation
const centerX = delimInPixels.x + (delimInPixels.width / 2);
const centerY = delimInPixels.y + (delimInPixels.height / 2);

// 2. Appliquer l'offset
const finalCenterX = centerX + adjustedX;
const finalCenterY = centerY + adjustedY;

// 3. Convertir en position du coin supérieur gauche
const left = finalCenterX - (containerWidth / 2);
const top = finalCenterY - (containerHeight / 2);

// 4. Rotation (Sharp gère automatiquement le centre)
if (rotation !== 0) {
  processedDesign = await sharp(processedDesign)
    .rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
}
```

---

## 📊 Exemple Concret avec Calculs

### Données d'entrée :

```javascript
Mockup: 1200x1200px
Délimitation: x=25%, y=25%, width=50%, height=50%
Design: x=0, y=0, scale=0.8, rotation=0
```

### Calculs étape par étape :

```javascript
// Étape 1 : Délimitation en pixels
delimInPixels = {
  x: (25/100) * 1200 = 300px
  y: (25/100) * 1200 = 300px
  width: (50/100) * 1200 = 600px
  height: (50/100) * 1200 = 600px
}

// Étape 2 : Dimensions conteneur design
containerWidth = 600 * 0.8 = 480px
containerHeight = 600 * 0.8 = 480px

// Étape 3 : Contraintes
maxX = (600 - 480) / 2 = 60px
minX = -(600 - 480) / 2 = -60px
maxY = (600 - 480) / 2 = 60px
minY = -(600 - 480) / 2 = -60px

adjustedX = clamp(0, -60, 60) = 0px
adjustedY = clamp(0, -60, 60) = 0px

// Étape 4 : Centre de la délimitation
delimCenterX = 300 + (600/2) = 600px
delimCenterY = 300 + (600/2) = 600px

// Étape 5 : Centre du conteneur
containerCenterX = 600 + 0 = 600px
containerCenterY = 600 + 0 = 600px

// Étape 6 : Position coin supérieur gauche
containerLeft = 600 - (480/2) = 360px
containerTop = 600 - (480/2) = 360px

// Résultat final Sharp
{
  left: 360,
  top: 360,
  width: 480,
  height: 480
}
```

---

## ✅ Checklist de Validation

Pour vérifier que le backend reproduit correctement le frontend :

- [ ] Les dimensions du conteneur = `delimWidth * scale` et `delimHeight * scale`
- [ ] Le design est redimensionné avec `fit: 'inside'` (préserve aspect ratio)
- [ ] Le design est centré dans un canvas transparent aux dimensions du conteneur
- [ ] Les offsets x,y sont appliqués depuis le centre de la délimitation
- [ ] Les contraintes empêchent le design de sortir de la délimitation
- [ ] La rotation est appliquée avec fond transparent
- [ ] Les logs montrent les calculs intermédiaires

---

## 🐛 Debug

### Activer les logs détaillés :

```javascript
console.log('📐 Délimitation:', delimInPixels);
console.log('📦 Conteneur:', { containerWidth, containerHeight });
console.log('🔒 Contraintes:', { minX, maxX, minY, maxY });
console.log('📍 Position:', { adjustedX, adjustedY });
console.log('🎯 Position finale:', { containerLeft, containerTop });
```

### Comparer avec le frontend :

1. Ouvrir le navigateur sur une page produit
2. Ouvrir DevTools Console
3. Chercher les logs `🎨 Positionnement exact comme SellDesignPage`
4. Comparer les valeurs avec les logs backend

---

## 📚 Références

- **Frontend** : `/src/components/vendor/SimpleProductPreview.tsx` (lignes 620-937)
- **Transform CSS** : Lignes 870
- **Calcul dimensions** : Lignes 819-823
- **Contraintes** : Lignes 825-831

---

**Version** : 3.0 - Reproduit exactement le frontend avec tous les détails
**Date** : 15 janvier 2026
**Auteur** : Analyse approfondie de SimpleProductPreview.tsx
