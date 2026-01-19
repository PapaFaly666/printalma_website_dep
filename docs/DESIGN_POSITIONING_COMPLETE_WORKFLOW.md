# Workflow Complet : Système de Positionnement des Designs

## Vue d'ensemble

Ce document explique **en profondeur** comment le système de positionnement des designs fonctionne dans PrintAlma, depuis l'interface de positionnement du vendeur jusqu'à la génération finale des images par le backend.

---

## 📋 Table des matières

1. [Architecture globale](#architecture-globale)
2. [Étape 1 : Positionnement par le vendeur (SellDesignPage)](#étape-1--positionnement-par-le-vendeur)
3. [Étape 2 : Sauvegarde dans localStorage](#étape-2--sauvegarde-dans-localstorage)
4. [Étape 3 : Publication du produit](#étape-3--publication-du-produit)
5. [Étape 4 : Génération de l'image par le backend](#étape-4--génération-de-limage-par-le-backend)
6. [Étape 5 : Affichage cohérent en preview](#étape-5--affichage-cohérent-en-preview)
7. [Système de coordonnées et transformations](#système-de-coordonnées-et-transformations)
8. [Exemples concrets avec calculs](#exemples-concrets-avec-calculs)

---

## Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND - VENDEUR                          │
│                    (SellDesignPage.tsx)                         │
│                                                                 │
│  1. Vendeur positionne visuellement le design sur le produit   │
│     - Déplace avec la souris (x, y)                            │
│     - Redimensionne (scale)                                    │
│     - Fait pivoter (rotation)                                  │
│                                                                 │
│  2. useDesignTransforms capture les positions en temps réel    │
│     - Sauvegarde dans localStorage (debounce 500ms)            │
│     - Format: { x, y, scale, rotation, designWidth, ... }     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LOCALSTORAGE (Cache)                         │
│                                                                 │
│  Clé: design_position_${designId}_${baseProductId}_${vendorId} │
│  Valeur: {                                                     │
│    position: { x: 15.44, y: -30.43, scale: 0.53, rotation: 0 }│
│    timestamp: 1768556896021                                    │
│  }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              PUBLICATION (useVendorPublish)                     │
│                                                                 │
│  3. Construction du payload API avec designPosition            │
│     POST /vendor/products                                      │
│     {                                                          │
│       designId: 5,                                            │
│       baseProductId: 2,                                        │
│       designPosition: {                                        │
│         x: 15.44, y: -30.43, scale: 0.53, rotation: 0        │
│       },                                                       │
│       productStructure: { ... },                              │
│       selectedColors: [ ... ],                                 │
│       selectedSizes: [ ... ]                                   │
│     }                                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND - NestJS                             │
│              (VendorProductController)                          │
│                                                                 │
│  4. Réception du payload                                       │
│  5. Génération de l'image finale avec Sharp                    │
│     - Télécharge mockup + design                               │
│     - Convertit délimitation (% → pixels)                      │
│     - Calcule dimensions conteneur (delim.width * scale)       │
│     - Applique contraintes (design reste dans délimitation)    │
│     - Redimensionne design (fit: inside = object-fit: contain) │
│     - Applique rotation                                        │
│     - Compose mockup + design                                  │
│  6. Upload sur Cloudinary                                      │
│  7. Sauvegarde en base de données                              │
│     - finalImageUrl (image générée)                            │
│     - designPosition (positions exactes)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                FRONTEND - PUBLIC/PREVIEW                        │
│             (SimpleProductPreview.tsx)                          │
│                                                                 │
│  8. Affichage du produit final                                 │
│     - Récupère designPosition depuis l'API                     │
│     - Calcule position EXACTEMENT comme le backend             │
│     - Affiche avec CSS transform (identique au backend)        │
│     - Résultat: Ce que le vendeur a vu = Ce qui est affiché   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Étape 1 : Positionnement par le vendeur

### Interface : SellDesignPage.tsx

Le vendeur utilise une interface interactive avec **Fabric.js** pour positionner son design sur le produit.

### Composants clés

#### 1. Hook `useDesignTransforms`

**Fichier** : `/src/hooks/useDesignTransforms.ts`

```typescript
interface Transform {
  x: number;              // Offset horizontal depuis le centre (px)
  y: number;              // Offset vertical depuis le centre (px)
  scale: number;          // Échelle du design (0.8 = 80% de la délimitation)
  rotation: number;       // Rotation en degrés (0-360)
  designWidth?: number;   // Largeur originale du design (optionnel)
  designHeight?: number;  // Hauteur originale du design (optionnel)
  designScale?: number;   // Échelle appliquée au design (optionnel)
}
```

**Fonctionnement** :
- Capture chaque mouvement du design en temps réel
- Calcule les positions relatives au centre de la délimitation
- Sauvegarde automatiquement dans localStorage (avec debounce)

#### 2. Système de coordonnées

**Référentiel** : Centre de la délimitation (zone imprimable)

```
┌────────────────────────────────────────┐
│         Image du produit (mockup)      │
│                                        │
│    ┌──────────────────────┐            │
│    │   Délimitation       │            │
│    │                      │            │
│    │         ● (0,0)      │  ← Centre  │
│    │      Centre          │            │
│    │                      │            │
│    └──────────────────────┘            │
│                                        │
└────────────────────────────────────────┘

Positions possibles :
- x = 0, y = 0     → Design centré
- x = 50, y = 0    → Design décalé de 50px à droite
- x = 0, y = -30   → Design décalé de 30px vers le haut
- x = -20, y = 40  → Design décalé de 20px à gauche, 40px vers le bas
```

#### 3. Contraintes de positionnement

Le design ne peut pas sortir de la délimitation :

```typescript
// Si scale = 0.8 (80% de la délimitation)
// Le design peut se déplacer de ±10% dans chaque direction

const maxX = (delimWidth - designWidth) / 2;   // +10% délimitation
const minX = -(delimWidth - designWidth) / 2;  // -10% délimitation
const maxY = (delimHeight - designHeight) / 2;
const minY = -(delimHeight - designHeight) / 2;

// Appliquer les contraintes
const adjustedX = Math.max(minX, Math.min(x, maxX));
const adjustedY = Math.max(minY, Math.min(y, maxY));
```

---

## Étape 2 : Sauvegarde dans localStorage

### Service : DesignPositionService

**Fichier** : `/src/services/DesignPositionService.ts`

### Structure de la clé

```javascript
const key = `design_position_${designId}_${baseProductId}_${vendorId}`;
```

**Exemple** :
```javascript
key = "design_position_5_2_3"
```

### Structure de la valeur

```javascript
{
  designId: 5,
  baseProductId: 2,
  vendorId: 3,
  position: {
    x: 15.441443135133063,      // Offset X depuis le centre
    y: -30.432591370330456,     // Offset Y depuis le centre
    scale: 0.5313796280384727,  // Échelle (53% de la délimitation)
    rotation: 0,                // Pas de rotation
    designScale: 0.5313796280384727,
    designWidth: 512,           // Largeur originale du design
    designHeight: 512           // Hauteur originale du design
  },
  timestamp: 1768556896022      // Date de sauvegarde
}
```

### Fonctionnement

1. **Sauvegarde avec debounce (500ms)**
   - Évite de sauvegarder à chaque pixel de mouvement
   - Sauvegarde uniquement après 500ms d'inactivité

2. **Récupération automatique**
   - Au chargement de la page
   - Restaure la position exacte du design

3. **Synchronisation avec l'API**
   - Lors de la publication, les données sont envoyées au backend
   - Le backend les sauvegarde en base de données

---

## Étape 3 : Publication du produit

### Hook : useVendorPublish

**Fichier** : `/src/hooks/useVendorPublish.ts`

### Construction du payload

```typescript
const payload = {
  // Identifiants
  baseProductId: productData.baseProductId,        // ID du produit admin (ex: 2)
  designId: productData.designId,                  // ID du design (ex: 5)
  vendorId: user.id,                               // ID du vendeur (ex: 3)

  // Informations produit vendeur
  vendorName: productData.vendorName,              // Nom personnalisé
  vendorDescription: productData.vendorDescription,
  vendorPrice: productData.vendorPrice,            // Prix de vente
  vendorStock: productData.vendorStock,

  // ⚠️ POSITION DU DESIGN (CRITIQUE)
  designPosition: {
    x: productData.designPosition?.x || 0,              // Offset X
    y: productData.designPosition?.y || 0,              // Offset Y
    scale: productData.designPosition?.scale || 0.8,    // Échelle
    rotation: productData.designPosition?.rotation || 0, // Rotation
    designWidth: productData.designPosition?.designWidth,   // Largeur
    designHeight: productData.designPosition?.designHeight  // Hauteur
  },

  // Structure complète du produit admin
  productStructure: {
    adminProduct: {
      id: productData.baseProductId,
      name: 'T-shirt Homme Coton',
      images: {
        colorVariations: [
          {
            id: 1,
            name: 'Blanc',
            colorCode: '#FFFFFF',
            images: [
              {
                url: 'https://cdn.example.com/tshirt-white.jpg',
                viewType: 'Front',
                delimitations: [
                  {
                    x: 25,              // 25% depuis la gauche
                    y: 25,              // 25% depuis le haut
                    width: 50,          // 50% de largeur
                    height: 50,         // 50% de hauteur
                    coordinateType: 'PERCENTAGE'
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  },

  // Sélections du vendeur
  selectedColors: [{ id: 1, name: 'Blanc', colorCode: '#FFFFFF' }],
  selectedSizes: [{ id: 1, sizeName: 'M' }],

  // Paramètres de publication
  defaultColorId: 1,
  forcedStatus: 'DRAFT',
  postValidationAction: 'AUTO_PUBLISH'
};
```

### Envoi de la requête

```typescript
const response = await fetch(`${API_BASE_URL}/vendor/products`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include',
  body: JSON.stringify(payload)
});

const result = await response.json();
console.log('✅ Produit créé:', result);
```

### Réponse du serveur

```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "productId": 123,
  "status": "DRAFT",
  "imagesProcessed": 1,
  "data": {
    "id": 123,
    "vendorName": "T-shirt One Piece Cool",
    "finalImageUrl": "https://res.cloudinary.com/.../final-image.png",
    "designPosition": {
      "x": 15.44,
      "y": -30.43,
      "scale": 0.53,
      "rotation": 0
    }
  }
}
```

---

## Étape 4 : Génération de l'image par le backend

### Backend : NestJS + Sharp

**Endpoint** : `POST /vendor/products`

### Algorithme de génération (pixel-perfect)

#### 1. Téléchargement des images

```typescript
const mockupBuffer = await downloadImage(mockupUrl);
const designBuffer = await downloadImage(designUrl);

const mockupMetadata = await sharp(mockupBuffer).metadata();
const designMetadata = await sharp(designBuffer).metadata();
```

#### 2. Conversion de la délimitation en pixels

```typescript
// Délimitation reçue : { x: 25, y: 25, width: 50, height: 50, coordinateType: 'PERCENTAGE' }
// Image mockup : 1200x1200px

if (delimitation.coordinateType === 'PERCENTAGE') {
  delimInPixels = {
    x: (25 / 100) * 1200 = 300px,
    y: (25 / 100) * 1200 = 300px,
    width: (50 / 100) * 1200 = 600px,
    height: (50 / 100) * 1200 = 600px
  };
}
```

#### 3. Calcul des dimensions du conteneur du design

```typescript
// Position reçue : { x: 0, y: 0, scale: 0.8, rotation: 0 }

const scale = designPosition.scale || 0.8;

// Le conteneur fait scale% de la délimitation
const containerWidth = delimInPixels.width * scale;    // 600 * 0.8 = 480px
const containerHeight = delimInPixels.height * scale;  // 600 * 0.8 = 480px
```

**⚠️ Important** : Le conteneur a toujours les proportions de la délimitation multipliées par scale, **pas** les proportions du design.

#### 4. Application des contraintes

```typescript
// Le design peut se déplacer dans la zone disponible
const maxX = (delimInPixels.width - containerWidth) / 2;   // (600-480)/2 = 60px
const minX = -(delimInPixels.width - containerWidth) / 2;  // -60px
const maxY = (delimInPixels.height - containerHeight) / 2; // 60px
const minY = -(delimInPixels.height - containerHeight) / 2; // -60px

const adjustedX = Math.max(minX, Math.min(x, maxX));
const adjustedY = Math.max(minY, Math.min(y, maxY));
```

#### 5. Calcul de la position finale

```typescript
// Centre de la délimitation
const delimCenterX = delimInPixels.x + (delimInPixels.width / 2);
const delimCenterY = delimInPixels.y + (delimInPixels.height / 2);

// Position du centre du conteneur du design
const containerCenterX = delimCenterX + adjustedX;
const containerCenterY = delimCenterY + adjustedY;

// Position du coin supérieur gauche (pour Sharp)
const containerLeft = containerCenterX - (containerWidth / 2);
const containerTop = containerCenterY - (containerHeight / 2);
```

#### 6. Redimensionnement du design (object-fit: contain)

```typescript
// Sharp avec fit: 'inside' = équivalent CSS object-fit: contain
// Le design garde son aspect ratio et est contenu dans le conteneur
let resizedDesign = await sharp(designBuffer)
  .resize({
    width: Math.round(containerWidth),
    height: Math.round(containerHeight),
    fit: 'inside',              // ⚠️ CRITIQUE : préserve l'aspect ratio
    withoutEnlargement: false,
    position: 'center',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .toBuffer();
```

**Exemple** :
- Conteneur : 480x480px
- Design original : 512x768px (portrait)
- Après resize : 320x480px (garde l'aspect ratio)

#### 7. Centrage du design dans le conteneur

```typescript
// Le design redimensionné est plus petit que le conteneur
// On le centre dans un canvas transparent

const resizedMetadata = await sharp(resizedDesign).metadata();
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
```

#### 8. Application de la rotation (si nécessaire)

```typescript
const rotation = designPosition.rotation || 0;

if (rotation !== 0) {
  processedDesign = await sharp(designInContainer)
    .rotate(rotation, {
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();
}
```

#### 9. Composition finale

```typescript
const finalImage = await sharp(mockupBuffer)
  .composite([{
    input: processedDesign,
    left: Math.round(containerLeft),
    top: Math.round(containerTop)
  }])
  .png({ quality: 95 })
  .toBuffer();
```

#### 10. Upload sur Cloudinary et sauvegarde

```typescript
const cloudinaryUrl = await uploadToCloudinary(finalImage);

await prisma.vendorProduct.create({
  data: {
    vendorId: dto.vendorId,
    baseProductId: dto.baseProductId,
    designId: dto.designId,
    finalImageUrl: cloudinaryUrl,
    designPosition: dto.designPosition  // ⚠️ Sauvegarde des positions
  }
});
```

---

## Étape 5 : Affichage cohérent en preview

### Composant : SimpleProductPreview.tsx

**Objectif** : Afficher le design **exactement** comme le backend l'a généré.

### Algorithme d'affichage (identique au backend)

#### 1. Récupération de la position

```typescript
const getDesignPosition = () => {
  // 1. Depuis l'API (priorité)
  if (product.designPositions && product.designPositions.length > 0) {
    return product.designPositions[0].position;
  }

  // 2. Depuis localStorage (fallback)
  if (product.designId && user?.id) {
    const localData = DesignPositionService.getPosition(
      product.designId,
      product.adminProduct.id,
      user.id
    );
    return localData?.position;
  }

  // 3. Valeurs par défaut
  return {
    x: 0,
    y: 0,
    scale: product.designApplication.scale || 0.8,
    rotation: 0
  };
};
```

#### 2. Calcul des métriques de l'image mockup

```typescript
const calculateImageMetrics = () => {
  const img = imgRef.current;
  const container = containerRef.current;

  const originalWidth = img.naturalWidth;   // 1200px
  const originalHeight = img.naturalHeight; // 1200px

  const containerWidth = container.getBoundingClientRect().width;   // 400px
  const containerHeight = container.getBoundingClientRect().height; // 400px

  // Calculer le ratio d'affichage (object-fit: contain)
  const containerRatio = containerWidth / containerHeight;
  const imageRatio = originalWidth / originalHeight;

  let displayWidth, displayHeight, offsetX, offsetY;

  if (imageRatio > containerRatio) {
    displayWidth = containerWidth;
    displayHeight = containerWidth / imageRatio;
    offsetX = 0;
    offsetY = (containerHeight - displayHeight) / 2;
  } else {
    displayHeight = containerHeight;
    displayWidth = containerHeight * imageRatio;
    offsetX = (containerWidth - displayWidth) / 2;
    offsetY = 0;
  }

  const canvasScale = displayWidth / originalWidth;

  return {
    originalWidth,
    originalHeight,
    displayWidth,
    displayHeight,
    canvasScale,        // 400/1200 = 0.333
    canvasOffsetX: offsetX,
    canvasOffsetY: offsetY
  };
};
```

#### 3. Conversion de la délimitation

```typescript
const computePxPosition = (delim) => {
  const contW = containerRef.current.getBoundingClientRect().width;  // 400px
  const contH = containerRef.current.getBoundingClientRect().height; // 400px

  const imgW = imageMetrics.originalWidth;  // 1200px
  const imgH = imageMetrics.originalHeight; // 1200px

  // Utilise la fonction partagée
  return computeResponsivePosition(
    delim,
    { width: contW, height: contH },
    { originalWidth: imgW, originalHeight: imgH },
    'contain'
  );
};
```

#### 4. Affichage avec CSS (identique au backend)

```jsx
{/* Conteneur de la délimitation */}
<div
  className="absolute overflow-hidden"
  style={{
    left: pos.left,      // 80px (25% de 400)
    top: pos.top,        // 80px
    width: pos.width,    // 200px (50% de 400)
    height: pos.height   // 200px
  }}
>
  {/* Conteneur du design */}
  <div
    className="absolute"
    style={{
      left: '50%',
      top: '50%',
      width: pos.width * scale,    // 200 * 0.8 = 160px
      height: pos.height * scale,  // 200 * 0.8 = 160px
      transform: `
        translate(-50%, -50%)                    // Centrer
        translate(${adjustedX}px, ${adjustedY}px)  // Offset
        rotate(${rotation}deg)                   // Rotation
      `,
      transformOrigin: 'center center'
    }}
  >
    {/* Image du design */}
    <img
      src={product.designApplication.designUrl}
      className="object-contain"  // ⚠️ Préserve l'aspect ratio
      style={{
        width: '100%',
        height: '100%'
      }}
    />
  </div>
</div>
```

---

## Système de coordonnées et transformations

### Référentiel de base

```
┌────────────────────────────────────────────────────────────┐
│  Image mockup (ex: 1200x1200px)                            │
│  Origine: (0, 0) en haut à gauche                          │
│                                                            │
│    ┌──────────────────────────────────────┐                │
│    │  Délimitation (ex: 300, 300, 600x600)│                │
│    │  Origine délim: (300, 300)           │                │
│    │                                      │                │
│    │             ● (600, 600)             │  ← Centre délim│
│    │          Centre délim                │                │
│    │                                      │                │
│    │                                      │                │
│    └──────────────────────────────────────┘                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Transformation des coordonnées

#### Frontend → Backend

Les positions sont **identiques** entre frontend et backend :

```typescript
// Frontend (localStorage)
{
  x: 15.44,
  y: -30.43,
  scale: 0.53,
  rotation: 0
}

// Backend (API)
{
  x: 15.44,      // ⚠️ Même valeur
  y: -30.43,     // ⚠️ Même valeur
  scale: 0.53,   // ⚠️ Même valeur
  rotation: 0    // ⚠️ Même valeur
}
```

**Aucune conversion n'est nécessaire !**

#### Interprétation des valeurs

```typescript
// x et y sont des offsets depuis le centre de la délimitation
x > 0  →  Design décalé vers la droite
x < 0  →  Design décalé vers la gauche
y > 0  →  Design décalé vers le bas
y < 0  →  Design décalé vers le haut

// scale est un pourcentage de la délimitation
scale = 1.0  →  Design occupe 100% de la délimitation
scale = 0.8  →  Design occupe 80% de la délimitation
scale = 0.5  →  Design occupe 50% de la délimitation

// rotation est en degrés
rotation = 0    →  Pas de rotation
rotation = 45   →  Rotation de 45° sens horaire
rotation = -90  →  Rotation de 90° sens anti-horaire
```

---

## Exemples concrets avec calculs

### Exemple 1 : Design centré

#### Données d'entrée

```javascript
mockup: 1200x1200px
délimitation: { x: 25%, y: 25%, width: 50%, height: 50%, coordinateType: 'PERCENTAGE' }
position: { x: 0, y: 0, scale: 0.8, rotation: 0 }
```

#### Calculs backend

```javascript
// 1. Délimitation en pixels
delimInPixels = {
  x: (25/100) * 1200 = 300px,
  y: (25/100) * 1200 = 300px,
  width: (50/100) * 1200 = 600px,
  height: (50/100) * 1200 = 600px
}

// 2. Dimensions conteneur
containerWidth = 600 * 0.8 = 480px
containerHeight = 600 * 0.8 = 480px

// 3. Centre délimitation
delimCenterX = 300 + (600/2) = 600px
delimCenterY = 300 + (600/2) = 600px

// 4. Centre conteneur (x=0, y=0)
containerCenterX = 600 + 0 = 600px
containerCenterY = 600 + 0 = 600px

// 5. Position coin supérieur gauche
containerLeft = 600 - (480/2) = 360px
containerTop = 600 - (480/2) = 360px

// Résultat Sharp
{
  left: 360,
  top: 360,
  width: 480,
  height: 480
}
```

#### Résultat visuel

```
┌────────────────────────────────────────┐
│  Mockup 1200x1200                      │
│  ┌──────────────────────┐ (300,300)    │
│  │ Délimitation 600x600 │              │
│  │                      │              │
│  │    ┌──────────┐      │              │
│  │    │  Design  │      │  ← Centré   │
│  │    │  480x480 │      │              │
│  │    └──────────┘      │              │
│  │                      │              │
│  └──────────────────────┘              │
│                                        │
└────────────────────────────────────────┘
```

### Exemple 2 : Design décalé vers le haut à droite

#### Données d'entrée

```javascript
mockup: 1200x1200px
délimitation: { x: 25%, y: 25%, width: 50%, height: 50%, coordinateType: 'PERCENTAGE' }
position: { x: 30, y: -20, scale: 0.8, rotation: 0 }
```

#### Calculs backend

```javascript
// 1-2. Identiques à l'exemple 1
delimInPixels = { x: 300, y: 300, width: 600, height: 600 }
containerWidth = 480px
containerHeight = 480px

// 3. Centre délimitation
delimCenterX = 600px
delimCenterY = 600px

// 4. Centre conteneur (x=30, y=-20)
containerCenterX = 600 + 30 = 630px   // ← Décalé de 30px à droite
containerCenterY = 600 + (-20) = 580px // ← Décalé de 20px vers le haut

// 5. Position coin supérieur gauche
containerLeft = 630 - (480/2) = 390px
containerTop = 580 - (480/2) = 340px

// Résultat Sharp
{
  left: 390,
  top: 340,
  width: 480,
  height: 480
}
```

#### Résultat visuel

```
┌────────────────────────────────────────┐
│  Mockup 1200x1200                      │
│  ┌──────────────────────┐ (300,300)    │
│  │ Délimitation 600x600 │              │
│  │       ┌──────────┐   │              │
│  │       │  Design  │   │  ← Décalé   │
│  │       │  480x480 │   │   (+30, -20)│
│  │       └──────────┘   │              │
│  │                      │              │
│  └──────────────────────┘              │
│                                        │
└────────────────────────────────────────┘
```

### Exemple 3 : Design avec rotation

#### Données d'entrée

```javascript
mockup: 1200x1200px
délimitation: { x: 25%, y: 25%, width: 50%, height: 50%, coordinateType: 'PERCENTAGE' }
position: { x: 0, y: 0, scale: 0.6, rotation: 45 }
```

#### Calculs backend

```javascript
// 1-2. Similaires aux exemples précédents
delimInPixels = { x: 300, y: 300, width: 600, height: 600 }
containerWidth = 600 * 0.6 = 360px
containerHeight = 600 * 0.6 = 360px

// 3-5. Position sans rotation
containerLeft = 420px
containerTop = 420px

// 6. Application de la rotation (45°)
rotatedDesign = await sharp(designInContainer)
  .rotate(45, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();

// La rotation augmente les dimensions pour contenir l'image tournée
// Ex: 360x360 → ~509x509 après rotation de 45°

// Recentrer après rotation
rotatedMetadata = { width: 509, height: 509 }
rotatedLeft = 600 - (509/2) = 345.5px
rotatedTop = 600 - (509/2) = 345.5px
```

#### Résultat visuel

```
┌────────────────────────────────────────┐
│  Mockup 1200x1200                      │
│  ┌──────────────────────┐ (300,300)    │
│  │ Délimitation 600x600 │              │
│  │                      │              │
│  │       ╱────╲         │              │
│  │      │Design│        │  ← Rotation │
│  │       ╲────╱         │     45°     │
│  │                      │              │
│  └──────────────────────┘              │
│                                        │
└────────────────────────────────────────┘
```

---

## Points clés à retenir

### 1. Système de coordonnées cohérent

- **Origine** : Centre de la délimitation
- **Unités** : Pixels (offsets)
- **Pas de conversion** entre frontend et backend

### 2. Scale = pourcentage de la délimitation

- `scale = 0.8` → Le design occupe 80% de la délimitation
- Les dimensions du conteneur sont toujours `delimWidth * scale` et `delimHeight * scale`
- Le design lui-même garde son aspect ratio grâce à `object-fit: contain` / `fit: inside`

### 3. Contraintes automatiques

- Le design ne peut pas sortir de la délimitation
- Les offsets x,y sont contraints par `min/max X/Y`
- Le système garantit que le design reste toujours visible

### 4. Pixel-perfect entre frontend et backend

- Le backend utilise **exactement** le même algorithme que le frontend
- Les calculs sont **identiques** (mêmes formules, mêmes étapes)
- Le résultat est **visuellement identique**

### 5. Responsive garanti

- Les coordonnées sont relatives (pourcentages)
- Le calcul s'adapte à toutes les tailles d'écran
- La position relative reste constante

### 6. Traçabilité complète

- Sauvegarde dans localStorage (cache)
- Envoi au backend (API)
- Sauvegarde en base de données (persistance)
- Le même objet `designPosition` est utilisé partout

---

## Conclusion

Le système de positionnement des designs dans PrintAlma est un système **robuste**, **cohérent** et **pixel-perfect** qui garantit que :

✅ Ce que le vendeur voit = Ce qui est généré = Ce qui est affiché

Le secret : **Le même algorithme partout**, du frontend au backend, en passant par l'affichage public.

---

**Date** : 16 janvier 2026
**Version** : 1.0
**Auteur** : Documentation complète du workflow de positionnement
