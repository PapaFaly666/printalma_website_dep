# Guide du Modal d'Upload d'Images

## Vue d'ensemble

Le composant `ImageUploadModal` a été créé pour gérer l'upload d'images avec validation stricte des contraintes de qualité et de taille.

## Fonctionnalités

### 1. Formats supportés
- **JPG/JPEG** (image/jpeg) 📷
- **PNG** (image/png) 🖼️
- **WEBP** (image/webp) 🌐
- **SVG** (image/svg+xml) 📐

### 2. Contraintes de validation

#### Taille maximale
- **5 MB** (5 242 880 bytes)
- Un message d'erreur s'affiche si le fichier dépasse cette limite

#### Résolution minimale
- **100 DPI** minimum requis
- Le DPI est calculé automatiquement à partir de:
  - Dimensions de l'image (largeur × hauteur)
  - Taille du fichier
  - Format de l'image

**Note:** Les images SVG sont exemptées de la vérification DPI car elles sont vectorielles.

#### Calcul du DPI
```typescript
const estimatedDPI = Math.sqrt((width * height) / (fileSize / 1024)) * 10;
const dpi = Math.round(Math.max(estimatedDPI, 72));
```

### 3. Interface utilisateur

#### Zone de drag & drop
- Glissez-déposez votre image directement
- Indicateur visuel lors du survol
- Animation de feedback

#### Bouton de sélection
- Cliquez pour ouvrir l'explorateur de fichiers
- Filtrage automatique par type MIME

#### Aperçu en temps réel
- Prévisualisation de l'image avant confirmation
- Affichage des métadonnées:
  - Dimensions (largeur × hauteur en pixels)
  - DPI estimé
  - Taille du fichier (en MB)
  - Format détecté

#### Messages de validation
- **Succès** (vert): Image valide avec toutes les métadonnées
- **Erreur** (rouge): Raison précise du rejet
  - Format non supporté
  - Fichier trop volumineux
  - Qualité insuffisante (DPI trop bas)
  - Fichier corrompu

## Intégration dans CustomerProductCustomizationPageV3

### Import
```typescript
import ImageUploadModal from '../components/ImageUploadModal';
```

### État
```typescript
const [showImageUploadModal, setShowImageUploadModal] = useState(false);
```

### Bouton d'ouverture
```typescript
<button onClick={() => setShowImageUploadModal(true)}>
  <Upload className="w-5 h-5" />
  Importer
</button>
```

### Handler de sélection
```typescript
const handleImageUpload = (file: File, imageUrl: string) => {
  if (editorRef.current) {
    const uploadedDesign = {
      id: `upload-${Date.now()}`,
      name: file.name,
      imageUrl: imageUrl,
      price: 0, // Gratuit car uploadé par l'utilisateur
      isUpload: true,
      description: `Image uploadée: ${file.name}`
    };

    editorRef.current.addVendorDesign(uploadedDesign);

    toast({
      title: '✅ Image ajoutée',
      description: `${file.name} a été ajoutée au design`,
      duration: 3000
    });
  }
};
```

### Composant modal
```tsx
<ImageUploadModal
  isOpen={showImageUploadModal}
  onClose={() => setShowImageUploadModal(false)}
  onImageSelect={handleImageUpload}
/>
```

## Props du composant

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Contrôle la visibilité du modal |
| `onClose` | `() => void` | Callback appelé lors de la fermeture |
| `onImageSelect` | `(file: File, imageUrl: string) => void` | Callback appelé lors de la confirmation avec le fichier et son URL object |

## Workflow utilisateur

1. **Ouverture du modal**
   - Clic sur le bouton "Importer"
   - Modal s'affiche avec les contraintes

2. **Sélection de l'image**
   - Drag & drop OU
   - Clic sur "Parcourir les fichiers"

3. **Validation automatique**
   - Vérification du format
   - Vérification de la taille (≤ 5MB)
   - Chargement de l'image
   - Calcul du DPI (≥ 100 DPI)

4. **Aperçu et métadonnées**
   - Si valide: aperçu + métadonnées + bouton "Confirmer"
   - Si invalide: message d'erreur + possibilité de réessayer

5. **Confirmation**
   - Clic sur "Confirmer et ajouter"
   - Callback `onImageSelect` appelé
   - Modal se ferme automatiquement
   - Image ajoutée à l'éditeur de design

## Exemple de messages

### Succès
```
✓ Image valide : 1920x1080px, ~150 DPI, 2.34 MB
```

### Erreurs possibles
```
Format non supporté. Formats acceptés : JPG/JPEG, PNG, WEBP, SVG
```
```
Fichier trop volumineux (7.52 MB). Taille maximale : 5 MB
```
```
Qualité insuffisante (85 DPI estimé). Minimum requis : 100 DPI
```
```
Impossible de charger l'image. Fichier corrompu ?
```

## Nettoyage de la mémoire

Le composant gère automatiquement:
- Révocation des Object URLs pour éviter les fuites mémoire
- Réinitialisation de tous les états lors de la fermeture
- Nettoyage du preview lors d'un nouveau fichier

## Personnalisation

### Modifier les contraintes
Dans `ImageUploadModal.tsx`:

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // Modifier ici (en bytes)
const MIN_DPI = 100; // Modifier ici
```

### Ajouter des formats
Dans `SUPPORTED_FORMATS`:

```typescript
{ mime: 'image/gif', ext: 'GIF', icon: '🎞️' }
```

## Compatibilité

- ✅ Desktop (drag & drop complet)
- ✅ Mobile (sélection de fichiers)
- ✅ Responsive design
- ✅ Tous les navigateurs modernes

## Améliorations futures possibles

- [ ] Support de fichiers multiples
- [ ] Compression automatique si > 5MB
- [ ] Conversion de format (ex: HEIC → JPG)
- [ ] Détection EXIF pour DPI réel
- [ ] Crop/rotation avant upload
- [ ] Historique des uploads récents

---

**Date de création:** Janvier 2026
**Auteur:** Assistant IA
**Version:** 1.0.0
