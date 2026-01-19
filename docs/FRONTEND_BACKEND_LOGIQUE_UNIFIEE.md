# Frontend ↔ Backend : Logique Unifiée de Positionnement

## 🎯 Objectif

Garantir que le frontend et le backend utilisent **la même logique** pour calculer les dimensions et la position du design, éliminant ainsi toutes les incohérences.

---

## 📊 Structure des Données Envoyées au Backend

### ✅ Champs Envoyés (OBLIGATOIRES)

```json
{
  "x": 60,                    // Offset depuis le centre de la délimitation (PIXEL)
  "y": -30,                   // Offset depuis le centre de la délimitation (PIXEL)
  "scale": 0.8,              // Échelle appliquée à la délimitation
  "rotation": 0,             // Rotation en degrés
  "positionUnit": "PIXEL",   // Toujours PIXEL
  "delimitationWidth": 600,  // ✅ ESSENTIEL: Largeur de la délimitation en pixels
  "delimitationHeight": 600  // ✅ ESSENTIEL: Hauteur de la délimitation en pixels
}
```

### ❌ Champs NON Envoyés (Calculés par le Backend)

```json
{
  // ❌ Le backend calcule designWidth/designHeight avec fit: 'inside'
  "designWidth": null,
  "designHeight": null,

  // ❌ Le backend recalcule containerWidth/containerHeight
  "containerWidth": null,
  "containerHeight": null
}
```

---

## 🔧 Logique Backend (Unifiée avec le Frontend)

### Étape 1: Calculer les Dimensions du Conteneur

```typescript
// Utiliser les dimensions de la délimitation envoyées par le frontend
const delimitationWidth = designPosition.delimitationWidth;
const delimitationHeight = designPosition.delimitationHeight;

// Calculer les dimensions du conteneur (comme le frontend)
const scale = designPosition.scale || 0.8;
const containerWidth = delimitationWidth * scale;
const containerHeight = delimitationHeight * scale;
```

### Étape 2: Calculer les Contraintes de Position

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

### Étape 3: Calculer la Position Finale

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

### Étape 4: Redimensionner le Design avec fit: 'inside'

```typescript
// ⚠️ CRITIQUE: Le backend calcule les dimensions du design avec fit: 'inside'
// C'est ce qui garantit la cohérence avec le frontend (object-fit: contain)

const resizedDesign = await sharp(designBuffer)
  .resize({
    width: Math.round(containerWidth),
    height: Math.round(containerHeight),
    fit: 'inside',              // ✅ Équivaut à CSS object-fit: contain
    withoutEnlargement: false,
    position: 'center',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .toBuffer();

// Obtenir les dimensions réelles après resize
const metadata = await sharp(resizedDesign).metadata();
const actualDesignWidth = metadata.width;
const actualDesignHeight = metadata.height;
```

### Étape 5: Centrer le Design dans le Conteneur

```typescript
// Le design peut être plus petit que le conteneur (à cause de fit: 'inside')
const designOffsetX = Math.round((containerWidth - actualDesignWidth) / 2);
const designOffsetY = Math.round((containerHeight - actualDesignHeight) / 2);

// Créer un canvas transparent aux dimensions du conteneur
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

### Étape 6: Composer l'Image Finale

```typescript
const finalImage = await sharp(mockupBuffer)
  .composite([{
    input: designInContainer,
    left: Math.round(containerLeft),
    top: Math.round(containerTop)
  }])
  .png({ quality: 95 })
  .toBuffer();
```

---

## 📐 Pourquoi Cette Logique Est Unifiée

### Frontend (CSS)

```css
/* Conteneur du design */
width: 480px;   /* = delimitation.width × scale */
height: 480px;  /* = delimitation.height × scale */

/* Design avec object-fit: contain */
img.design {
  width: 100%;
  height: 100%;
  object-fit: contain;  /* ✅ Sharp fit: 'inside' = object-fit: contain */
}
```

### Backend (Sharp)

```javascript
// Conteneur du design
const containerWidth = 600 × 0.8 = 480px;
const containerHeight = 600 × 0.8 = 480px;

// Design avec fit: 'inside'
await sharp(designBuffer)
  .resize({
    width: 480,
    height: 480,
    fit: 'inside'  /* ✅ fit: 'inside' = object-fit: contain */
  });
```

---

## 🎯 Exemple Complet

### Données d'Entrée

```json
{
  "mockupUrl": "https://example.com/tshirt-1200x1200.jpg",
  "designUrl": "https://example.com/logo-800x600.png",
  "delimitation": {
    "x": 300,
    "y": 300,
    "width": 600,
    "height": 600
  },
  "designPosition": {
    "x": 60,
    "y": -30,
    "scale": 0.8,
    "rotation": 0,
    "delimitationWidth": 600,
    "delimitationHeight": 600
  }
}
```

### Calculs Backend

```javascript
// Étape 1: Dimensions du conteneur
delimitationWidth = 600
delimitationHeight = 600
scale = 0.8
containerWidth = 600 × 0.8 = 480
containerHeight = 600 × 0.8 = 480

// Étape 2: Contraintes
maxX = (600 - 480) / 2 = 60
minX = -(600 - 480) / 2 = -60
maxY = (600 - 480) / 2 = 60
minY = -(600 - 480) / 2 = -60

// Appliquer les contraintes
x = clamp(60, -60, 60) = 60  ✅
y = clamp(-30, -60, 60) = -30  ✅

// Étape 3: Position finale
delimCenterX = 300 + (600 / 2) = 600
delimCenterY = 300 + (600 / 2) = 600

containerCenterX = 600 + 60 = 660
containerCenterY = 600 + (-30) = 570

containerLeft = 660 - (480 / 2) = 420
containerTop = 570 - (480 / 2) = 330

// Étape 4: Redimensionner le design
// Design 800x600 → fit: 'inside' 480x480 → 480x360 (ratio préservé)

// Étape 5: Centrer dans le conteneur
designOffsetX = (480 - 480) / 2 = 0
designOffsetY = (480 - 360) / 2 = 60

// Résultat final
{
  left: 420,
  top: 330,
  containerWidth: 480,
  containerHeight: 480,
  designWidth: 480,
  designHeight: 360
}
```

---

## ✅ Points de Validation Backend

### 1. Vérifier les Dimensions de la Délimitation

```typescript
if (!designPosition.delimitationWidth || !designPosition.delimitationHeight) {
  throw new Error('delimitationWidth et delimitationHeight sont obligatoires');
}

if (designPosition.delimitationWidth <= 0 || designPosition.delimitationHeight <= 0) {
  throw new Error('Dimensions de délimitation invalides');
}
```

### 2. Vérifier le Scale

```typescript
const scale = designPosition.scale || 0.8;

if (scale <= 0 || scale > 1) {
  console.warn('Scale invalide, utilisation de 0.8');
  scale = 0.8;
}
```

### 3. Vérifier la Position dans les Contraintes

```typescript
if (x < minX || x > maxX || y < minY || y > maxY) {
  console.warn('Position hors limites, clamping nécessaire');
}
```

### 4. Logger les Calculs

```typescript
console.log('🎨 Génération Image:', {
  entrée: {
    delimitationWidth,
    delimitationHeight,
    scale,
    x: designPosition.x,
    y: designPosition.y
  },
  calculs: {
    containerWidth,
    containerHeight,
    contraintes: { minX, maxX, minY, maxY },
    positionContrainte: { x, y }
  },
  sortie: {
    left: containerLeft,
    top: containerTop,
    containerWidth,
    containerHeight
  }
});
```

---

## 🔄 Frontend vs Backend

| Aspect | Frontend | Backend |
|--------|----------|---------|
| **Dimensions délimitation** | Calculées depuis l'image | Reçues du frontend |
| **Dimensions conteneur** | `delimWidth × scale` | `delimWidth × scale` ✅ |
| **Position** | Offset depuis centre | Offset depuis centre ✅ |
| **Contraintes** | `(delim - container) / 2` | `(delim - container) / 2` ✅ |
| **Redimensionnement design** | `object-fit: contain` | `fit: 'inside'` ✅ |
| **Centrage design** | CSS centrer | Calcul offset ✅ |

---

## 🚀 Avantages de Cette Solution

### 1. **Cohérence Totale**
- Le frontend et le backend utilisent les mêmes formules
- Les calculs sont identiques des deux côtés

### 2. **Simplicité**
- Le frontend envoie seulement les données essentielles
- Le backend calcule tout lui-même

### 3. **Flexibilité**
- Le backend peut ajuster les paramètres si nécessaire
- Pas de dépendance sur les calculs du frontend

### 4. **Performance**
- Le backend fait ses propres calculs optimisés
- Pas de transfert de données inutiles

---

## 📝 Résumé

### Ce que le frontend ENVOIE :

```json
{
  "x": 60,
  "y": -30,
  "scale": 0.8,
  "rotation": 0,
  "delimitationWidth": 600,
  "delimitationHeight": 600
}
```

### Ce que le backend CALCULE :

```json
{
  "containerWidth": 480,      // = 600 × 0.8
  "containerHeight": 480,     // = 600 × 0.8
  "designWidth": 480,         // calculé avec fit: 'inside'
  "designHeight": 360,        // calculé avec fit: 'inside'
  "position": { "left": 420, "top": 330 }
}
```

---

**Date d'implémentation:** 18 janvier 2026
**Version:** 2.0.0 - Logique Unifiée Frontend ↔ Backend
**Auteur:** Solution Finale pour la Cohérence de Positionnement
