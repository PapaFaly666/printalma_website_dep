# Backend Quick Reference - Bounding Box

## 🚀 TL;DR Pour Développeurs Pressés

### Ce que vous recevez

```json
{
  "designPosition": {
    "containerWidth": 384,
    "containerHeight": 480
  }
}
```

### Ce que vous devez faire

```typescript
const { containerWidth, containerHeight } = designPosition;

await sharp(design).resize({
  width: Math.round(containerWidth),
  height: Math.round(containerHeight),
  fit: 'inside'
});
```

**C'EST TOUT !** Ne recalculez rien.

---

## 📐 Schéma Explicatif

### Ce que le Frontend Envoie

```
Frontend calcule:
┌─────────────────────────────────┐
│ Délimitation: 480×600px         │
│ Scale: 0.8 (80%)                │
│ ↓                               │
│ containerWidth = 480 × 0.8 = 384│
│ containerHeight = 600 × 0.8 = 480│
└─────────────────────────────────┘
            ↓
    Envoie au Backend
            ↓
┌─────────────────────────────────┐
│ designPosition: {               │
│   containerWidth: 384,          │
│   containerHeight: 480          │
│ }                               │
└─────────────────────────────────┘
```

### Ce que le Backend Doit Faire

```
Backend reçoit:
┌─────────────────────────────────┐
│ containerWidth: 384             │
│ containerHeight: 480            │
└─────────────────────────────────┘
            ↓
   Utilise directement
            ↓
┌─────────────────────────────────┐
│ sharp(design).resize({          │
│   width: 384,                   │
│   height: 480,                  │
│   fit: 'inside'                 │
│ })                              │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│ Design redimensionné:           │
│ 384×288px                       │
│ (aspect ratio préservé)         │
└─────────────────────────────────┘
```

---

## ✅ DO - Bonnes Pratiques

```typescript
// ✅ 1. Utiliser le bounding box du frontend
const { containerWidth, containerHeight } = designPosition;

// ✅ 2. Arrondir les valeurs
const width = Math.round(containerWidth);
const height = Math.round(containerHeight);

// ✅ 3. Utiliser fit: 'inside'
await sharp(design).resize({
  width,
  height,
  fit: 'inside',  // Préserve l'aspect ratio
  position: 'center'
});

// ✅ 4. Logger les valeurs
console.log('📦 Bounding Box:', { containerWidth, containerHeight });
```

---

## ❌ DON'T - Erreurs à Éviter

```typescript
// ❌ 1. NE PAS recalculer
const containerWidth = delimitation.width * scale;  // NON !

// ❌ 2. NE PAS utiliser fit: 'cover'
await sharp(design).resize({
  fit: 'cover'  // Le design sera coupé !
});

// ❌ 3. NE PAS oublier d'arrondir
await sharp(design).resize({
  width: containerWidth,  // Peut être 384.7 → erreur !
  height: containerHeight
});

// ❌ 4. NE PAS ignorer le bounding box
// Toujours l'utiliser !
```

---

## 📊 Payload Complet

```typescript
interface DesignPosition {
  // Position
  x: number;                    // ex: 0
  y: number;                    // ex: 0
  scale: number;                // ex: 0.8

  // Rotation
  rotation?: number;            // ex: 0

  // Unité
  positionUnit?: 'PIXEL' | 'PERCENTAGE';  // ex: 'PIXEL'

  // Dimensions du design
  designWidth?: number;         // ex: 800
  designHeight?: number;        // ex: 600

  // 🎯 BOUNDING BOX (CRUCIAL)
  containerWidth: number;       // ex: 384
  containerHeight: number;      // ex: 480
}
```

---

## 🔍 Exemple Complet

### Données reçues

```json
{
  "designPosition": {
    "x": 0,
    "y": 0,
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

### Code backend

```typescript
async function generateImage(designPosition: DesignPosition) {
  // 1. Extraire le bounding box
  const { containerWidth, containerHeight } = designPosition;

  console.log('📦 Bounding Box:', { containerWidth, containerHeight });

  // 2. Redimensionner le design
  const resized = await sharp(designBuffer)
    .resize({
      width: Math.round(containerWidth),
      height: Math.round(containerHeight),
      fit: 'inside',
      position: 'center'
    })
    .toBuffer();

  // 3. Récupérer les dimensions réelles
  const meta = await sharp(resized).metadata();
  console.log('🖼️ Design redimensionné:', {
    width: meta.width,
    height: meta.height
  });

  // 4. Composer sur le mockup
  // ... (voir BACKEND_EXEMPLE_CODE.md pour le code complet)
}
```

### Résultat attendu

```
📦 Bounding Box: { containerWidth: 384, containerHeight: 480 }
🖼️ Design redimensionné: { width: 384, height: 288 }
✅ Image finale générée
```

**Note** : Le design fait 384×288 au lieu de 384×480 car l'aspect ratio est préservé (fit: 'inside').

---

## ⚠️ FAQ Ultra-Rapide

**Q: Dois-je recalculer containerWidth ?**
A: **NON !** Utilisez la valeur du frontend.

**Q: Pourquoi le design est plus petit que le bounding box ?**
A: **Normal !** `fit: 'inside'` préserve l'aspect ratio.

**Q: Et si containerWidth est undefined ?**
A: Le frontend ne l'envoie pas. Vérifier le payload.

**Q: Puis-je valider les valeurs ?**
A: Oui, mais **utilisez toujours** celles du frontend.

**Q: L'image est différente du frontend ?**
A: Vous recalculez probablement. **Utilisez le bounding box du frontend.**

---

## 📚 Documentation Complète

Pour plus de détails :
- **BACKEND_EXEMPLE_CODE.md** : Code complet prêt à l'emploi
- **BACKEND_BOUNDING_BOX_USAGE_SIMPLE.md** : Guide détaillé
- **BACKEND_BOUNDING_BOX_GUIDE.md** : Documentation complète

---

## 🎯 Règle d'Or

> **Le frontend calcule le bounding box.**
> **Le backend l'utilise directement.**
> **L'image finale = preview frontend.**

---

**Auteur:** Claude Sonnet 4.5
**Date:** 18 janvier 2026
