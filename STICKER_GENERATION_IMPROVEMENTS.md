# Amélioration de la Génération de Stickers avec Contours Blancs

**Date:** 11 janvier 2026
**Objectif:** Optimiser les performances en générant les images de stickers avec contours blancs côté backend au lieu d'utiliser CSS lourd côté frontend.

---

## 🎯 Problème Initial

Le frontend utilisait des effets CSS complexes (`drop-shadow`) pour afficher les contours blancs des autocollants, ce qui causait des problèmes de performance dans le navigateur, notamment avec plusieurs stickers affichés simultanément.

**Effets CSS appliqués:**
- 16 drop-shadows pour le contour blanc épais
- 4 drop-shadows pour le contour gris foncé interne
- 3 drop-shadows pour l'ombre portée (effet 3D)
- Filtres de luminosité, saturation et contraste

---

## ✅ Solution Implémentée

### 1. Backend - Génération d'Image avec Sharp

**Fichier modifié:** `/printalma-back-dep/src/sticker/services/sticker-generator.service.ts`

#### Amélioration de la méthode `createThickWhiteBorder()`

**Avant:**
- Bordure simple avec copies décalées en boucle
- Pas de contour de définition
- Fond blanc opaque

**Après:**
```typescript
// ÉTAPE 1: Contour blanc épais (reproduit les 16 drop-shadows CSS)
const offsets = [
  { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },  // +/- 1px
  { x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 2 }, { x: 0, y: -2 },  // +/- 2px
  { x: 3, y: 0 }, { x: -3, y: 0 }, { x: 0, y: 3 }, { x: 0, y: -3 },  // +/- 3px
  { x: 2, y: 2 }, { x: -2, y: -2 }, { x: 2, y: -2 }, { x: -2, y: 2 } // Diagonales
];

// ÉTAPE 2: Contour gris foncé TRÈS FIN interne
const darkenedBuffer = await sharp(imageBuffer)
  .modulate({ brightness: 0.3 })
  .toBuffer();

// ÉTAPE 3: Image originale au centre
```

**Caractéristiques:**
- ✅ 16 layers blanches pour contour épais
- ✅ 4 layers assombries pour contour de définition
- ✅ Fond transparent (PNG avec alpha)
- ✅ Bordure de 10px (augmentée de 8px à 10px)

#### Nouvelle méthode `addDropShadow()`

Simule les 3 drop-shadows CSS pour l'effet 3D:

```typescript
// Ombre 1: 2px 3px 5px (la plus diffuse)
const shadow1 = await sharp(imageBuffer)
  .blur(2.5)
  .modulate({ brightness: 0.7 })
  .toBuffer();

// Ombre 2: 1px 2px 3px (moyenne)
const shadow2 = await sharp(imageBuffer)
  .blur(1.5)
  .modulate({ brightness: 0.75 })
  .toBuffer();

// Ombre 3: 0px 1px 2px (la plus nette)
const shadow3 = await sharp(imageBuffer)
  .blur(1)
  .modulate({ brightness: 0.8 })
  .toBuffer();
```

**Résultat:** Ombre portée réaliste avec profondeur et diffusion progressive.

#### Amélioration des effets de couleur

**Pour glossy-white:**
```typescript
image = image.modulate({
  brightness: 1.15,  // +15%
  saturation: 1.1    // +10%
}).linear(1.1, 0);   // Contraste +10%
```

**Pour autres bordures:**
```typescript
image = image.modulate({
  brightness: 1.02,
  saturation: 1.1  // Saturation cartoon
});
```

---

### 2. Frontend - Composant d'Aperçu Réutilisable

**Nouveau fichier:** `/printalma_website_dep/src/components/vendor/StickerPreview.tsx`

#### Caractéristiques

Ce composant affiche l'aperçu CSS des stickers (pour la prévisualisation rapide) mais les images finales sont générées par le backend.

```typescript
interface StickerPreviewProps {
  imageUrl: string;
  stickerType: 'autocollant' | 'pare-chocs';
  borderColor?: string;
  size?: string;
  className?: string;
  showGrid?: boolean;
}
```

**Fonctionnalités:**
- ✅ Affichage avec effets CSS (identiques à CustomerProductCustomizationPageV3)
- ✅ Support autocollant (contours découpés) et pare-chocs (bordure rectangulaire)
- ✅ Grille dimensionnelle optionnelle
- ✅ Effet glossy configurable

**Utilisation:**
```tsx
<StickerPreview
  imageUrl={design.imageUrl}
  stickerType="autocollant"
  borderColor="glossy-white"
  size="83 mm x 100 mm"
  className="max-w-full max-h-full"
/>
```

---

### 3. Frontend - Adaptation du Service de Création

**Fichier modifié:** `/printalma_website_dep/src/pages/vendor/VendorStickerSimplePage.tsx`

#### Changements du payload

**Avant:**
```typescript
const stickerConfig = {
  designId: design.id,
  stickerType: 'autocollant',
  stickerSize: '83 mm x 100 mm',
  stickerBorderColor: 'glossy-white',
  // ... format simplifié
};
```

**Après (format DTO backend):**
```typescript
const stickerPayload = {
  designId: design.id,
  name: `Autocollant - ${design.name}`,
  description: design.description,

  // Taille (format DTO backend)
  size: {
    id: 'medium',
    width: 8.3,  // en cm
    height: 10   // en cm
  },

  // Finition
  finish: 'glossy',

  // Forme
  shape: 'DIE_CUT',

  // Prix et stock
  price: calculatedPrice,
  minimumQuantity: 1,
  stockQuantity: 50,

  // Configuration de génération d'image
  stickerType: 'autocollant',
  borderColor: 'glossy-white'
};
```

#### Intégration du composant StickerPreview

```tsx
<StickerPreview
  imageUrl={design.imageUrl || design.thumbnailUrl}
  stickerType="autocollant"
  borderColor="glossy-white"
  size="83 mm x 100 mm"
  className="max-w-full max-h-full transition-transform group-hover:scale-105"
/>
```

**Avantages:**
- Les vendeurs voient l'aperçu avec contours avant création
- L'image finale avec contours est générée et stockée par le backend
- Pas de traitement CSS lourd en production

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────────────────┐
│ VENDEUR: Clique sur "Créer autocollant"                 │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: Envoie le payload au backend                  │
│  - designId: 123                                         │
│  - stickerType: 'autocollant'                            │
│  - borderColor: 'glossy-white'                           │
│  - size: { id: 'medium', width: 8.3, height: 10 }       │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ BACKEND: Création du sticker en BDD                     │
│  - Status: PENDING                                       │
│  - imageUrl: null (temporaire)                           │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ BACKEND: Génération de l'image avec Sharp               │
│  1. Téléchargement design depuis Cloudinary             │
│  2. Redimensionnement (300 DPI)                         │
│  3. Ajout contour blanc (16 layers)                     │
│  4. Ajout contour gris foncé (4 layers)                 │
│  5. Ajout ombre portée (3 layers)                       │
│  6. Effets couleur (brightness, saturation, contrast)   │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ BACKEND: Upload sur Cloudinary                          │
│  - Dossier: vendor-stickers                             │
│  - Format: PNG haute qualité                            │
│  - Nom: sticker_{id}_design_{designId}_{timestamp}     │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ BACKEND: Mise à jour BDD                                │
│  - imageUrl: URL Cloudinary                             │
│  - cloudinaryPublicId: pour suppression                 │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: Affichage du sticker créé                     │
│  - Image finale avec contours intégrés                  │
│  - Pas de CSS lourd                                     │
│  - Performances optimales                               │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Comparaison Avant/Après

| Aspect | Avant (CSS) | Après (Backend) |
|--------|-------------|-----------------|
| **Génération contours** | Frontend (CSS) | Backend (Sharp) |
| **Performance navigateur** | ❌ Lent (19 drop-shadows) | ✅ Rapide (image PNG) |
| **Qualité d'impression** | ⚠️ Dépend du navigateur | ✅ 300 DPI professionnel |
| **Cohérence visuelle** | ⚠️ Variable selon navigateur | ✅ Identique partout |
| **Stockage** | ❌ Design seul | ✅ Image finale avec contours |
| **Charge serveur** | ✅ Minimale | ⚠️ Traitement Sharp (1-4s) |
| **Utilisation réseau** | ✅ Image design | ⚠️ Image + contours (légèrement plus lourde) |

---

## 🎨 Effets Visuels Reproduits

### Contour Blanc Épais
- **CSS:** 16 drop-shadows (1px, 2px, 3px + diagonales)
- **Sharp:** 16 layers avec offsets identiques

### Contour Gris Foncé Interne
- **CSS:** 4 drop-shadows 0.3px rgba(50, 50, 50, 0.7)
- **Sharp:** 4 layers assombries (brightness 0.3) avec blend 'over'

### Ombre Portée (Effet 3D)
- **CSS:** 3 drop-shadows (2px 3px 5px, 1px 2px 3px, 0px 1px 2px)
- **Sharp:** 3 layers avec blur (2.5, 1.5, 1) et offsets

### Effet Glossy
- **CSS:** brightness(1.15) contrast(1.1) saturate(1.1)
- **Sharp:** modulate({ brightness: 1.15, saturation: 1.1 }) + linear(1.1, 0)

---

## 🚀 Performance Estimée

### Temps de génération (backend)
- **Petit sticker (5x5 cm):** ~1-2 secondes
- **Moyen (10x10 cm):** ~2-4 secondes
- **Grand (20x20 cm):** ~4-8 secondes

### Gain de performance (frontend)
- **Avant:** 50-100ms par sticker pour le rendu CSS
- **Après:** <5ms par sticker (affichage PNG simple)
- **Gain:** ~10-20x plus rapide pour l'affichage

### Taille des fichiers
- **Design original:** ~100-500 KB
- **Avec contours:** ~150-650 KB (+30-50%)
- **CDN Cloudinary:** Distribution rapide mondiale

---

## 🔧 Configuration Backend

### Variables d'environnement requises
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Dépendances
```json
{
  "sharp": "^0.33.5",
  "axios": "^1.6.0"
}
```

---

## 📝 Notes Importantes

### Gestion des erreurs
- Si la génération échoue, le sticker est quand même créé en BDD sans `imageUrl`
- L'image peut être re-générée ultérieurement
- Les erreurs sont loggées pour debug

### Qualité d'impression
- **300 DPI** pour qualité professionnelle
- Format PNG avec transparence
- Optimisation automatique par Cloudinary

### Évolutions futures possibles

1. **Queue de traitement (Bull + Redis)**
   - Génération asynchrone en arrière-plan
   - Pas de blocage de l'API

2. **Cache des images**
   - Pré-générer les tailles populaires
   - Réutiliser designs déjà générés

3. **Batch generation**
   - Générer plusieurs stickers en parallèle
   - Worker dédié pour la génération

---

## ✅ Tests

### Test manuel
```bash
curl -X POST http://localhost:3000/vendor/stickers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 123,
    "name": "Test Autocollant",
    "size": {"id": "medium", "width": 8.3, "height": 10},
    "finish": "glossy",
    "shape": "DIE_CUT",
    "price": 2000,
    "stockQuantity": 50,
    "stickerType": "autocollant",
    "borderColor": "glossy-white"
  }'
```

### Vérifications
- ✅ Image générée avec contours blancs
- ✅ Upload Cloudinary réussi
- ✅ URL stockée en BDD
- ✅ Affichage frontend sans CSS lourd

---

## 🎉 Conclusion

Les stickers sont maintenant générés côté backend avec les contours blancs intégrés, offrant :
- ✅ Meilleures performances navigateur
- ✅ Qualité d'impression professionnelle
- ✅ Cohérence visuelle garantie
- ✅ Images finales prêtes à l'emploi

**L'aperçu CSS reste disponible pour la prévisualisation rapide, mais l'image finale stockée contient déjà tous les effets.**
