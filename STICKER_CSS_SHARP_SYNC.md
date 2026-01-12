# Documentation Synchronisation CSS/Sharp - Stickers

**Date:** 11 janvier 2026
**Version:** 1.0.0

---

## 📋 Résumé

Ce document décrit comment les filtres CSS du frontend sont synchronisés avec le traitement d'image Sharp du backend pour garantir un rendu identique.

---

## 🎯 Objectif

Garantir que **l'aperçu CSS** affiché à l'utilisateur pendant la création soit **identique** à **l'image générée par Sharp** stockée en base de données.

---

## 🔄 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRÉATION DU STICKER                         │
│  1. Utilisateur sélectionne design + options                  │
│  2. Aperçu CSS temps réel (SynchronizedStickerPreview)         │
│  3. Utilisateur valide → Création                             │
│  4. Backend génère image avec Sharp (mêmes paramètres)         │
│  5. Image stockée sur Cloudinary + URL en BDD                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AFFICHAGE DU STICKER                        │
│  1. Frontend reçoit stickerImage (URL Cloudinary)             │
│  2. SynchronizedStickerPreview détecte stickerImage           │
│  3. Affiche l'image SANS filtres CSS (déjà dans l'image)       │
│  4. Badge "Pré-généré" indique que l'image vient du backend    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Fichiers Impliqués

### Frontend

| Fichier | Rôle |
|---------|------|
| `src/utils/stickerFilters.ts` | **Utilitaire central** - Constantes synchronisées CSS/Sharp |
| `src/components/SynchronizedStickerPreview.tsx` | Composant d'aperçu (mode CSS ou image pré-générée) |
| `src/components/vendor/StickerCard.tsx` | Carte d'affichage (mode image pré-générée) |
| `src/pages/CustomerProductCustomizationPageV3.tsx` | Page de création avec aperçu CSS temps réel |

### Backend

| Fichier | Rôle |
|---------|------|
| `src/sticker/services/sticker-generator.service.ts` | Génération d'image avec Sharp |
| `src/sticker/services/sticker-cloudinary.service.ts` | Upload Cloudinary |
| `src/sticker/sticker.service.ts` | Service principal (CRUD) |

---

## 🔢 Configuration Synchronisée

### Constantes Partagées

```typescript
// src/utils/stickerFilters.ts (Frontend)
// = sticker-generator.service.ts (Backend)

export const STICKER_CONFIG = {
  autocollant: {
    borderWidth: 10,        // 10px Sharp = 16 layers CSS
    shadowOffsets: [1..16], // 16 layers de contour blanc
    darkBorderWidth: 0.3,   // 4 layers de définition gris
    shadows: [              // 3 ombres portées 3D
      { x: 2, y: 3, blur: 5, alpha: 0.3 },
      { x: 1, y: 2, blur: 3, alpha: 0.25 },
      { x: 0, y: 1, blur: 2, alpha: 0.2 }
    ]
  },
  'pare-chocs': {
    borderWidth: 25,        // 25px Sharp
    shadowOffsets: [1..16],
    darkBorderWidth: 0.3,
    shadows: []             // Pas d'ombre pour pare-chocs
  }
};
```

### Effets Glossy

```typescript
export const BORDER_COLOR_CONFIG = {
  'glossy-white': {
    brightness: 1.15,  // +15%
    saturation: 1.1,   // +10%
    contrast: 1.1      // +10%
  },
  'white': {
    brightness: 1.02,
    saturation: 1.1,
    contrast: 1.05
  },
  'matte-white': {
    brightness: 1.0,
    saturation: 1.0,
    contrast: 1.0
  },
  'transparent': {
    // Aucun effet
  }
};
```

---

## 🎨 Mapping CSS ↔ Sharp

### Autocollant

| Effet | CSS (Frontend) | Sharp (Backend) |
|-------|----------------|-----------------|
| Contour blanc (16 layers) | `drop-shadow(1px 0 0 white)` ... `drop-shadow(16px 0 0 white)` | `extend({ top: 10, bottom: 10, left: 10, right: 10 })` |
| Définition gris (4 layers) | `drop-shadow(0.3px 0 0 rgba(50,50,50,0.7))` | `extend({ top: 4, bottom: 4, left: 4, right: 4 }, { background: 'rgba(50,50,50,0.7)' })` |
| Ombres 3D (3 couches) | `drop-shadow(2px 3px 5px rgba(0,0,0,0.3))` | `blur(5)` avec `composite('over', BLACK)` |
| Glossy | `brightness(1.15) saturate(1.1) contrast(1.1)` | `modulate({ brightness: 1.15, saturation: 1.1 })` + `linear('if(lt(0,1),1,1)')` |

### Pare-chocs

| Effet | CSS (Frontend) | Sharp (Backend) |
|-------|----------------|-----------------|
| Bordure blanche large | `border: 8px solid white` + `box-shadow: 0 0 0 4px white` | `extend({ top: 25, bottom: 25, left: 25, right: 25 })` |
| Ombre portée | `box-shadow: 0 8px 16px rgba(0,0,0,0.2)` | Non implémenté (pas d'ombre pour pare-chocs) |

---

## 💻 Utilisation

### Aperçu Temps Réel (Mode CSS)

```tsx
import SynchronizedStickerPreview from '@/components/SynchronizedStickerPreview';

<SynchronizedStickerPreview
  designUrl={design.imageUrl}      // Design original
  stickerType="autocollant"        // Type de sticker
  borderColor="glossy-white"       // Couleur de bordure
  size="83 mm x 100 mm"           // Taille pour la grille
  showGrid={true}                 // Afficher la grille de mesure
  alt="Aperçu du sticker"
/>
```

### Affichage Image Pré-générée (Mode Backend)

```tsx
import SynchronizedStickerPreview from '@/components/SynchronizedStickerPreview';

<SynchronizedStickerPreview
  designUrl={design.imageUrl}
  stickerImage={sticker.stickerImage}  // ← Image générée par Sharp
  stickerType="autocollant"
  borderColor="glossy-white"
  size="83 mm x 100 mm"
  alt="Sticker final"
/>
```

**Note:** Si `stickerImage` est fourni, le composant l'affiche directement **sans** filtres CSS.

---

## 🧪 Tests

### Test de Synchronisation

Pour vérifier que CSS et Sharp produisent le même rendu :

```tsx
// Mode comparaison (force CSS même avec stickerImage)
<SynchronizedStickerPreview
  designUrl={design.imageUrl}
  stickerImage={sticker.stickerImage}
  stickerType="autocollant"
  borderColor="glossy-white"
  forceCssFilters={true}  // ← Force l'utilisation des filtres CSS
/>
```

Affiche côte à côte :
- Version CSS (live)
- Version Sharp (pré-générée)

Les deux doivent être **visuellement identiques**.

---

## 🔧 Maintenance

### Ajouter un nouveau type de sticker

1. **Ajouter la constante** dans `src/utils/stickerFilters.ts` :

```typescript
export const STICKER_CONFIG = {
  // ... types existants
  'nouveau-type': {
    borderWidth: 15,
    shadowOffsets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    darkBorderWidth: 0.5,
    shadows: []
  }
} as const;
```

2. **Mettre à jour le backend** dans `sticker-generator.service.ts` avec les mêmes valeurs.

3. **Tester** la synchronisation visuelle.

### Modifier les effets glossy

1. **Modifier `BORDER_COLOR_CONFIG`** dans `src/utils/stickerFilters.ts` :

```typescript
'glossy-white': {
  brightness: 1.20,  // Nouvelle valeur
  saturation: 1.15,
  contrast: 1.15
}
```

2. **Modifier le backend** avec `modulate()` correspondant :

```typescript
.modulate({
  brightness: 1.20,
  saturation: 1.15
})
.linear('if(lt(0,1),1,1)') // Contrast
```

---

## 📊 Performance

| Mode | Temps Génération | Taille Image | Utilisation |
|------|------------------|--------------|-------------|
| CSS (Live) | 0 ms (instant) | 0 KB (pas de fichier) | Création/édition |
| Sharp (Backend) | 2-8 secondes | 500-2000 KB PNG | Stockage/affichage |

**Avantage de l'approche hybride :**
- Aperçu instantané pendant la création (CSS)
- Image optimisée stockée pour l'affichage final (Sharp)
- Meilleure UX et performances

---

## 🐛 Problèmes Connus

### Problème: Les bordures CSS sont plus épaisses que Sharp

**Solution:** Vérifier que `shadowOffsets` a le bon nombre d'éléments. 16 layers CSS ≈ 10px Sharp.

### Problème: L'effet glossy est trop fort

**Solution:** Réduire les valeurs de `brightness` et `saturation` dans `BORDER_COLOR_CONFIG`.

### Problème: Les ombres 3D ne s'affichent pas

**Solution:** Vérifier que `shadows` dans `STICKER_CONFIG` contient les 3 couches d'ombre.

---

## ✅ Checklist

- [x] Constantes synchronisées dans `stickerFilters.ts`
- [x] Composant `SynchronizedStickerPreview` créé
- [x] Backend Sharp utilise les mêmes valeurs
- [x] `CustomerProductCustomizationPageV3` utilise le nouveau composant
- [ ] Tests visuels de synchronisation effectués
- [ ] Documentation backend mise à jour

---

**Pour plus d'informations, voir:**
- Backend: `STICKER_COMPLETE_WORKFLOW.md`
- Frontend: `src/utils/stickerFilters.ts`
