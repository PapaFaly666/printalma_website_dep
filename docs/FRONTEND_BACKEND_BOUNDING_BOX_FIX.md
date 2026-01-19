# Frontend → Backend : Bounding Box Communication Fix

## 🎯 Problème Résolu

Le frontend envoyait les positions du design avec `containerWidth` et `containerHeight`, mais le backend ne connaissait pas les dimensions de la délimitation originale. Cela rendait impossible le calcul correct des contraintes et de la position finale.

## ✅ Solution Implémentée

Le frontend envoie maintenant les dimensions de la délimitation originale en plus des dimensions du conteneur.

---

## 📦 Nouveaux Champs dans `designPosition`

### Structure Complète

```json
{
  "x": 0,                    // Offset horizontal depuis le centre de la délimitation (PIXEL)
  "y": 0,                    // Offset vertical depuis le centre de la délimitation (PIXEL)
  "scale": 0.8,              // Échelle appliquée à la délimitation (0.8 = 80%)
  "rotation": 0,             // Rotation en degrés
  "positionUnit": "PIXEL",   // Unité de position (PIXEL ou PERCENTAGE)

  // 🆕 Dimensions du design intrinsèques
  "designWidth": 800,        // Largeur originale du design en pixels
  "designHeight": 600,       // Hauteur originale du design en pixels

  // 🆕 Dimensions du conteneur (délimitation × scale)
  "containerWidth": 480,     // = delimitation.width × scale
  "containerHeight": 480,    // = delimitation.height × scale

  // 🆕 NOUVEAUX CHAMPS: Dimensions de la délimitation originale
  "delimitationWidth": 600,  // Largeur de la délimitation sur l'image originale
  "delimitationHeight": 600  // Hauteur de la délimitation sur l'image originale
}
```

---

## 🔧 Utilisation Backend

### 1. Récupérer les dimensions de la délimitation

```typescript
const delimitationWidth = designPosition.delimitationWidth;
const delimitationHeight = designPosition.delimitationHeight;
```

### 2. Calculer les dimensions du conteneur (si non envoyées)

```typescript
const scale = designPosition.scale || 0.8;
const containerWidth = delimitationWidth * scale;
const containerHeight = delimitationHeight * scale;
```

### 3. Calculer les contraintes de position

```typescript
// Limites d'offset pour que le design reste dans la délimitation
const maxX = (delimitationWidth - containerWidth) / 2;
const minX = -(delimitationWidth - containerWidth) / 2;
const maxY = (delimitationHeight - containerHeight) / 2;
const minY = -(delimitationHeight - containerHeight) / 2;

// Appliquer les contraintes
const x = Math.max(minX, Math.min(designPosition.x, maxX));
const y = Math.max(minY, Math.min(designPosition.y, maxY));
```

### 4. Calculer la position finale

```typescript
// Centre de la délimitation
const delimCenterX = delimitation.x + (delimitationWidth / 2);
const delimCenterY = delimitation.y + (delimitationHeight / 2);

// Position du centre du conteneur du design
const containerCenterX = delimCenterX + x;
const containerCenterY = delimCenterY + y;

// Position du coin supérieur gauche du conteneur (pour Sharp)
const containerLeft = containerCenterX - (containerWidth / 2);
const containerTop = containerCenterY - (containerHeight / 2);
```

---

## 📊 Exemple Concret

### Données d'entrée

```json
{
  "delimitation": { "x": 300, "y": 300, "width": 600, "height": 600 },
  "designPosition": {
    "x": 60,
    "y": -30,
    "scale": 0.8,
    "delimitationWidth": 600,
    "delimitationHeight": 600
  }
}
```

### Calculs

```javascript
// Étape 1: Récupérer les dimensions de la délimitation
delimitationWidth = 600
delimitationHeight = 600

// Étape 2: Calculer les dimensions du conteneur
scale = 0.8
containerWidth = 600 × 0.8 = 480
containerHeight = 600 × 0.8 = 480

// Étape 3: Calculer les contraintes
maxX = (600 - 480) / 2 = 60
minX = -(600 - 480) / 2 = -60
maxY = (600 - 480) / 2 = 60
minY = -(600 - 480) / 2 = -60

// Appliquer les contraintes
x = clamp(60, -60, 60) = 60  // ✅ Dans la limite
y = clamp(-30, -60, 60) = -30  // ✅ Dans la limite

// Étape 4: Calculer la position finale
delimCenterX = 300 + (600 / 2) = 600
delimCenterY = 300 + (600 / 2) = 600

containerCenterX = 600 + 60 = 660
containerCenterY = 600 + (-30) = 570

containerLeft = 660 - (480 / 2) = 420
containerTop = 570 - (480 / 2) = 330

// Résultat final Sharp
{
  left: 420,
  top: 330,
  width: 480,
  height: 480
}
```

---

## 🔍 Vérifications

### Backend doit vérifier

1. **Dimensions de la délimitation présentes**
   ```typescript
   if (!designPosition.delimitationWidth || !designPosition.delimitationHeight) {
     // Fallback: utiliser les délimitations depuis productStructure
     const delimitation = productStructure.adminProduct.images.colorVariations[0].images[0].delimitations[0];
     // Convertir en pixels si nécessaire...
   }
   ```

2. **Cohérence des dimensions**
   ```typescript
   // Vérifier que containerWidth = delimitationWidth × scale
   const expectedContainerWidth = designPosition.delimitationWidth * designPosition.scale;
   if (Math.abs(designPosition.containerWidth - expectedContainerWidth) > 1) {
     console.warn('Incohérence détectée dans containerWidth');
   }
   ```

3. **Position dans les limites**
   ```typescript
   // Vérifier que x,y sont dans les contraintes
   if (designPosition.x < minX || designPosition.x > maxX) {
     console.warn('Position x hors limites, clamping nécessaire');
   }
   ```

---

## 🚀 Avantages de Cette Solution

### 1. **Indépendance du frontend**
- Le backend peut recalculer tous les paramètres
- Pas de dépendance sur les valeurs envoyées par le frontend

### 2. **Cohérence garantie**
- Les contraintes sont calculées de la même manière
- Le backend peut valider les positions avant de générer les images

### 3. **Flexibilité**
- Le backend peut ajuster le scale si nécessaire
- Les dimensions de la délimitation permettent de recalculer tout

### 4. **Débogage facilité**
- Les logs peuvent montrer les dimensions de la délimitation
- Plus facile de tracer les problèmes de positionnement

---

## 📝 Modifications Frontend Effectuées

### 1. Hook `useDesignTransforms.ts`

```typescript
export interface Transform {
  // ... champs existants
  delimitationWidth?: number;  // 🆕 NOUVEAU
  delimitationHeight?: number; // 🆕 NOUVEAU
}
```

### 2. Hook `useVendorPublish.ts`

```typescript
designPosition?: {
  // ... champs existants
  delimitationWidth?: number;  // 🆕 NOUVEAU
  delimitationHeight?: number; // 🆕 NOUVEAU
}
```

### 3. Page `SellDesignPage.tsx`

```typescript
// Calcul des dimensions de la délimitation en pixels absolus
const delimInPixels = computeDelimitationInPixels(delim);

// Envoi au backend
updateTransform(selectedIdx, {
  ...initialTransform,
  x: constrainedX,
  y: constrainedY,
  containerWidth: delimInPixels.width * designScale,
  containerHeight: delimInPixels.height * designScale,
  delimitationWidth: delimInPixels.width,   // 🆕 NOUVEAU
  delimitationHeight: delimInPixels.height, // 🆕 NOUVEAU
});
```

---

## ⚠️ Points d'Attention

### 1. Rétrocompatibilité

Le backend doit gérer les cas où `delimitationWidth` et `delimitationHeight` ne sont pas présents (anciennes versions du frontend) :

```typescript
const delimitationWidth = designPosition.delimitationWidth
  || (designPosition.containerWidth / designPosition.scale);
const delimitationHeight = designPosition.delimitationHeight
  || (designPosition.containerHeight / designPosition.scale);
```

### 2. Validation

Toujours valider que les dimensions sont cohérentes avant de générer les images :

```typescript
if (delimitationWidth <= 0 || delimitationHeight <= 0) {
  throw new Error('Dimensions de délimitation invalides');
}
```

### 3. Logs

Garder des logs détaillés pour le débogage :

```typescript
console.log('📐 Design Position Backend:', {
  received: designPosition,
  calculated: {
    delimitationWidth,
    delimitationHeight,
    containerWidth,
    containerHeight,
    constraints: { minX, maxX, minY, maxY },
    finalPosition: { x, y },
    sharpPosition: { left: containerLeft, top: containerTop }
  }
});
```

---

## 🎯 Résumé

| Champ | Description | Exemple |
|-------|-------------|---------|
| `delimitationWidth` | Largeur de la délimitation en pixels sur l'image originale | `600` |
| `delimitationHeight` | Hauteur de la délimitation en pixels sur l'image originale | `600` |
| `containerWidth` | Largeur du conteneur (delimitationWidth × scale) | `480` |
| `containerHeight` | Hauteur du conteneur (delimitationHeight × scale) | `480` |
| `x` | Offset horizontal depuis le centre de la délimitation | `60` |
| `y` | Offset vertical depuis le centre de la délimitation | `-30` |
| `scale` | Échelle appliquée à la délimitation | `0.8` |

---

**Date d'implémentation:** 18 janvier 2026
**Version:** 1.0.0
**Auteur:** Frontend Backend Communication Fix
