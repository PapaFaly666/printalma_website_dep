# Guide Backend : Reproduire Exactement la Logique Frontend

## 🎯 Objectif

Le backend doit générer les `finalImages` **identiques** à ce que voit l'utilisateur dans `SimpleProductPreview.tsx`.

---

## 📋 Référence Frontend

Le code de référence est dans :
`/src/components/vendor/SimpleProductPreview.tsx` (lignes 620-937)

---

## 🔍 Logique Frontend (étape par étape)

### Étape 1 : Calculer la position de la délimitation en pixels

La délimitation est stockée en pourcentage dans la base de données.

```typescript
// Exemple de délimitation depuis l'API
{
  x: 25,           // 25% de la largeur de l'image
  y: 25,           // 25% de la hauteur de l'image
  width: 50,       // 50% de la largeur
  height: 50,      // 50% de la hauteur
  coordinateType: 'PERCENTAGE',
  originalImageWidth: 1200,
  originalImageHeight: 1200
}

// Conversion en pixels (image de 1200x1200)
delimInPixels = {
  x: (25 / 100) * 1200 = 300px,
  y: (25 / 100) * 1200 = 300px,
  width: (50 / 100) * 1200 = 600px,
  height: (50 / 100) * 1200 = 600px
}
```

### Étape 2 : Calculer les dimensions du design (COMME LE FRONTEND)

**IMPORTANT** : Le frontend applique le scale DIRECTEMENT aux dimensions de la délimitation, sans ajustement d'aspect ratio.

```typescript
// SimpleProductPreview.tsx lignes 819-823
const designScale = scale || 0.8;  // Ex: 0.8
const actualDesignWidth = pos.width * designScale;    // 600 * 0.8 = 480px
const actualDesignHeight = pos.height * designScale;  // 600 * 0.8 = 480px
```

**⚠️ Ce qu'il faut comprendre** :
- Le conteneur du design fait `scale`% de la délimitation
- Le design est affiché DANS ce conteneur avec `object-fit: contain`
- Le design conserve son aspect ratio original

### Étape 3 : Calculer les contraintes de position (COMME LE FRONTEND)

Les offsets x,y sont relatifs au CENTRE de la délimitation et doivent être contraints.

```typescript
// SimpleProductPreview.tsx lignes 825-831
const maxX = (pos.width - actualDesignWidth) / 2;   // (600-480)/2 = 60px
const minX = -(pos.width - actualDesignWidth) / 2;  // -60px
const maxY = (pos.height - actualDesignHeight) / 2; // (600-480)/2 = 60px
const minY = -(pos.height - actualDesignHeight) / 2; // -60px

const adjustedX = Math.max(minX, Math.min(x, maxX));
const adjustedY = Math.max(minY, Math.min(y, maxY));
```

### Étape 4 : Calculer la position finale (COMME LE FRONTEND)

```typescript
// SimpleProductPreview.tsx ligne 833
// Position du centre du design sur l'image
finalX = delim.x + (delim.width / 2) + adjustedX;
finalY = delim.y + (delim.height / 2) + adjustedY;

// Pour Sharp (coin supérieur gauche), on soustrrait la moitié des dimensions
pasteX = finalX - (actualDesignWidth / 2);
pasteY = finalY - (actualDesignHeight / 2);
```

### Étape 5 : Affichage du design avec `object-fit: contain`

```html
<!-- SimpleProductPreview.tsx lignes 862-887 -->
<div
  style={{
    left: pos.left,          // Position délimitation
    top: pos.top,
    width: pos.width,        // Dimensions délimitation
    height: pos.height
  }}
>
  <div
    style={{
      left: '50%',
      top: '50%',
      width: actualDesignWidth,    // 480px (80% de delim)
      height: actualDesignHeight,  // 480px (80% de delim)
      transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${rotation}deg)`
    }}
  >
    <img
      src={designUrl}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain'  // ⚠️ IMPORTANT : préserve l'aspect ratio
      }}
    />
  </div>
</div>
```

---

## 💻 Implémentation Backend (Sharp)

### Code complet à copier

```javascript
const sharp = require('sharp');

/**
 * Génère l'image finale avec le design positionné COMME le frontend
 *
 * @param {string} mockupUrl - URL du mockup produit
 * @param {string} designUrl - URL du design
 * @param {object} delimitation - Délimitation depuis l'API
 * @param {object} designPosition - Position du design depuis l'API
 * @returns {Promise<Buffer>} - Image finale générée
 */
async function generateFinalImageLikeFrontend(
  mockupUrl,
  designUrl,
  delimitation,
  designPosition
) {
  // =====================================================
  // ÉTAPE 1 : Charger les images et obtenir les métadonnées
  // =====================================================
  const [mockupMetadata, designMetadata] = await Promise.all([
    sharp(mockupUrl).metadata(),
    sharp(designUrl).metadata()
  ]);

  const imageWidth = mockupMetadata.width;
  const imageHeight = mockupMetadata.height;

  console.log('📐 Dimensions image mockup:', { imageWidth, imageHeight });

  // =====================================================
  // ÉTAPE 2 : Convertir la délimitation en pixels
  // =====================================================
  let delimInPixels;

  if (delimitation.coordinateType === 'PERCENTAGE') {
    // Gérer le cas spécial où les valeurs > 100 sont des pixels sur une image de référence
    if (delimitation.x > 100 || delimitation.y > 100 ||
        delimitation.width > 100 || delimitation.height > 100) {

      // Convertir depuis l'image de référence vers l'image actuelle
      const refWidth = delimitation.originalImageWidth || 1200;
      const refHeight = delimitation.originalImageHeight || 1200;

      const percentX = (delimitation.x / refWidth) * 100;
      const percentY = (delimitation.y / refHeight) * 100;
      const percentWidth = (delimitation.width / refWidth) * 100;
      const percentHeight = (delimitation.height / refHeight) * 100;

      delimInPixels = {
        x: (percentX / 100) * imageWidth,
        y: (percentY / 100) * imageHeight,
        width: (percentWidth / 100) * imageWidth,
        height: (percentHeight / 100) * imageHeight
      };
    } else {
      // Pourcentage normal
      delimInPixels = {
        x: (delimitation.x / 100) * imageWidth,
        y: (delimitation.y / 100) * imageHeight,
        width: (delimitation.width / 100) * imageWidth,
        height: (delimitation.height / 100) * imageHeight
      };
    }
  } else {
    // Coordonnées déjà en pixels
    delimInPixels = {
      x: delimitation.x,
      y: delimitation.y,
      width: delimitation.width,
      height: delimitation.height
    };
  }

  console.log('📍 Délimitation en pixels:', delimInPixels);

  // =====================================================
  // ÉTAPE 3 : Calculer les dimensions du design (COMME FRONTEND)
  // =====================================================
  const scale = designPosition.scale || 0.8;

  // ✅ IMPORTANT : Appliquer DIRECTEMENT le scale aux dimensions de la délimitation
  // NE PAS ajuster pour l'aspect ratio ici (le frontend ne le fait pas)
  const actualDesignWidth = delimInPixels.width * scale;
  const actualDesignHeight = delimInPixels.height * scale;

  console.log('🎨 Dimensions design (scale ' + scale + '):', {
    actualDesignWidth,
    actualDesignHeight,
    delimitationWidth: delimInPixels.width,
    delimitationHeight: delimInPixels.height
  });

  // =====================================================
  // ÉTAPE 4 : Calculer les contraintes (COMME FRONTEND)
  // =====================================================
  const maxX = (delimInPixels.width - actualDesignWidth) / 2;
  const minX = -(delimInPixels.width - actualDesignWidth) / 2;
  const maxY = (delimInPixels.height - actualDesignHeight) / 2;
  const minY = -(delimInPixels.height - actualDesignHeight) / 2;

  // Ajuster la position pour rester dans les limites
  const adjustedX = Math.max(minX, Math.min(designPosition.x, maxX));
  const adjustedY = Math.max(minY, Math.min(designPosition.y, maxY));

  console.log('🔒 Contraintes:', { minX, maxX, minY, maxY });
  console.log('📍 Position ajustée:', {
    original: { x: designPosition.x, y: designPosition.y },
    adjusted: { x: adjustedX, y: adjustedY }
  });

  // =====================================================
  // ÉTAPE 5 : Calculer la position finale (COMME FRONTEND)
  // =====================================================
  // Position du centre du design
  const designCenterX = delimInPixels.x + (delimInPixels.width / 2) + adjustedX;
  const designCenterY = delimInPixels.y + (delimInPixels.height / 2) + adjustedY;

  // Position du coin supérieur gauche (pour Sharp)
  const finalX = designCenterX - (actualDesignWidth / 2);
  const finalY = designCenterY - (actualDesignHeight / 2);

  console.log('📍 Position finale (Sharp):', {
    centerX: designCenterX,
    centerY: designCenterY,
    finalX,
    finalY
  });

  // =====================================================
  // ÉTAPE 6 : Redimensionner le design avec object-fit: contain
  // =====================================================
  // Sharp avec fit: 'inside' = équivalent de object-fit: contain du CSS
  const resizedDesign = await sharp(designUrl)
    .resize({
      width: Math.round(actualDesignWidth),
      height: Math.round(actualDesignHeight),
      fit: 'inside',      // ⚠️ IMPORTANT : préserve l'aspect ratio
      withoutEnlargement: false,
      position: 'center'
    })
    .toBuffer();

  // =====================================================
  // ÉTAPE 7 : Appliquer la rotation (si nécessaire)
  // =====================================================
  let processedDesign = resizedDesign;
  const rotation = designPosition.rotation || 0;

  if (rotation !== 0) {
    // Rotation autour du centre de l'image
    processedDesign = await sharp(resizedDesign)
      .rotate(rotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
  }

  // =====================================================
  // ÉTAPE 8 : Composer l'image finale
  // =====================================================
  const finalImage = await sharp(mockupUrl)
    .composite([{
      input: processedDesign,
      left: Math.round(finalX),
      top: Math.round(finalY)
    }])
    .png({ quality: 95 })
    .toBuffer();

  console.log('✅ Image finale générée avec succès');

  return finalImage;
}

// =====================================================
// EXEMPLE D'UTILISATION
// =====================================================
async function exampleUsage() {
  const mockupUrl = 'https://cdn.example.com/tshirt-white-1200x1200.jpg';
  const designUrl = 'https://cdn.example.com/logo-2000x2000.png';

  const delimitation = {
    x: 25,
    y: 25,
    width: 50,
    height: 50,
    coordinateType: 'PERCENTAGE',
    originalImageWidth: 1200,
    originalImageHeight: 1200
  };

  const designPosition = {
    x: 0,      // Centré horizontalement
    y: 0,      // Centré verticalement
    scale: 0.8,
    rotation: 0
  };

  const finalImageBuffer = await generateFinalImageLikeFrontend(
    mockupUrl,
    designUrl,
    delimitation,
    designPosition
  );

  // Sauvegarder ou uploader
  // ...
}
```

---

## 🎯 Points Clés à Retenir

### ✅ Ce que le frontend fait réellement

1. **Dimensions du design** = `delimWidth * scale` × `delimHeight * scale`
   - SANS ajustement pour l'aspect ratio
   - Le conteneur fait ces dimensions exactes

2. **Le design est affiché avec `object-fit: contain`**
   - Le design conserve son aspect ratio
   - Il est contenu dans le conteneur sans déformation
   - Sharp: utiliser `fit: 'inside'`

3. **Les offsets x,y sont relatifs au centre de la délimitation**
   - `maxX = (delimWidth - designWidth) / 2`
   - `adjustedX = clamp(x, -maxX, maxX)`

4. **Position finale**
   - `finalX = delimX + (delimWidth/2) + adjustedX - (designWidth/2)`
   - `finalY = delimY + (delimHeight/2) + adjustedY - (designHeight/2)`

### ❌ Ce qu'il ne faut PAS faire

1. **NE PAS ajuster l'aspect ratio lors du calcul des dimensions**
   ```javascript
   // ❌ FAUX
   const aspectRatio = designWidth / designHeight;
   if (aspectRatio > 1) {
     finalWidth = maxWidth;
     finalHeight = maxWidth / aspectRatio;
   }

   // ✅ CORRECT
   const finalWidth = delimWidth * scale;
   const finalHeight = delimHeight * scale;
   ```

2. **NE PAS utiliser `fit: 'cover'`**
   ```javascript
   // ❌ FAUX
   .resize({ width, height, fit: 'cover' })

   // ✅ CORRECT
   .resize({ width, height, fit: 'inside' })
   ```

3. **NE PAS confondre les coordonnées**
   - `x, y` du design sont des **offsets du centre** de la délimitation
   - Pas des coordonnées absolues sur l'image

---

## 🧪 Test de Validation

Pour valider que le backend reproduit correctement le frontend :

```javascript
// Test avec les mêmes données
const testData = {
  mockupUrl: 'https://cdn.example.com/tshirt-1200x1200.jpg',
  designUrl: 'https://cdn.example.com/logo-2000x2000.png',
  delimitation: {
    x: 25,
    y: 25,
    width: 50,
    height: 50,
    coordinateType: 'PERCENTAGE',
    originalImageWidth: 1200,
    originalImageHeight: 1200
  },
  designPosition: {
    x: 0,
    y: 0,
    scale: 0.8,
    rotation: 0
  }
};

// Résultat attendu
console.log('Résultat attendu:');
console.log('Délimitation: x=300, y=300, width=600, height=600');
console.log('Design: width=480, height=480 (600*0.8)');
console.log('Centre délimitation: x=600, y=600');
console.log('Centre design: x=600, y=600 (pas d\'offset)');
console.log('Position Sharp: x=360, y=360');
```

---

## 📚 Références

- **Code frontend** : `/src/components/vendor/SimpleProductPreview.tsx` (lignes 620-937)
- **Utilitaire positioning** : `/src/utils/responsiveDesignPositioning.ts`
- **Documentation complète** : `/docs/DESIGN_POSITIONING_LOGIC.md`

---

**Version** : 2.0 - Corrigée pour correspondre exactement au frontend
**Date** : 15 janvier 2026
**Auteur** : Analyse du code frontend SimpleProductPreview.tsx
