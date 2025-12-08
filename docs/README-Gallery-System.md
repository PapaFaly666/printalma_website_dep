# 🖼️ Système de Gestion de Galeries Vendeur - Documentation Complète

## 📋 Vue d'ensemble

Le système de gestion de galeries permet aux vendeurs de créer et gérer des collections visuelles de **exactement 5 images** pour mettre en valeur leurs créations.

---

## ✨ Fonctionnalités

### Côté Frontend

✅ **Interface moderne et intuitive**
- Design responsive avec Tailwind CSS et shadcn/ui
- Animations fluides avec Framer Motion
- Grille adaptative et mode liste
- Recherche en temps réel

✅ **Gestion complète des galeries**
- Création de galeries avec upload multiple
- Édition des galeries existantes
- Suppression avec confirmation
- Publication/Dépublication

✅ **Validation stricte**
- Exactement 5 images requises par galerie
- Formats acceptés : JPEG, PNG, WebP
- Taille maximale : 5MB par image
- Validation du titre (3-100 caractères)
- Description optionnelle (max 500 caractères)

✅ **Expérience utilisateur optimale**
- Prévisualisation des images avant upload
- Barre de progression visuelle
- Messages d'erreur clairs et contextuels
- Indicateurs de statut (Brouillon/Publié/Archivé)
- Drag & drop (peut être ajouté facilement)

---

## 🏗️ Architecture Frontend

### Fichiers créés

```
src/
├── types/
│   └── gallery.ts                        # Types TypeScript pour les galeries
├── pages/vendor/
│   └── VendorGalleryPage.tsx             # Page principale de gestion
├── services/
│   └── gallery.service.ts                # Service API pour les appels backend
└── App.tsx                                # Route ajoutée: /vendeur/galleries
```

### Types principaux

```typescript
interface Gallery {
  id?: number;
  vendorId: number;
  title: string;
  description?: string;
  images: GalleryImage[];
  status: GalleryStatus;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface GalleryImage {
  id?: number;
  url: string;
  file?: File;
  caption?: string;
  order: number; // 1-5
  preview?: string;
}

enum GalleryStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}
```

---

## 🎨 Composants UI

### VendorGalleryPage

Composant principal qui gère :
- Liste des galeries avec affichage grille/liste
- Recherche et filtrage
- Actions CRUD (Create, Read, Update, Delete)
- Formulaire modal de création/édition

### GalleryFormDialog

Sous-composant pour le formulaire :
- Upload d'images avec prévisualisation
- Validation en temps réel
- Barre de progression (0-5 images)
- Gestion des légendes optionnelles

---

## 🔌 Service API

### Méthodes disponibles

```typescript
// Récupérer les galeries
await galleryService.getVendorGalleries(page, limit, status);

// Récupérer une galerie
await galleryService.getGalleryById(galleryId);

// Créer une galerie
await galleryService.createGallery({
  title: 'Ma Galerie',
  description: 'Description optionnelle',
  images: [file1, file2, file3, file4, file5],
  captions: ['Légende 1', 'Légende 2', ...]
});

// Mettre à jour
await galleryService.updateGallery(galleryId, {
  title: 'Nouveau titre',
  status: GalleryStatus.PUBLISHED
});

// Supprimer
await galleryService.deleteGallery(galleryId);

// Publier/Dépublier
await galleryService.togglePublishGallery(galleryId, true);
```

### Utilitaires

```typescript
// Valider les images avant upload
const validation = galleryService.validateImages(files);
if (!validation.valid) {
  console.error(validation.errors);
}

// Optimiser les images (compression côté client)
const optimizedFiles = await galleryService.optimizeImages(files);
```

---

## 🚀 Utilisation

### Accès à la page

Route : `/vendeur/galleries`

La route est protégée et nécessite une authentification vendeur.

### Créer une galerie

1. Cliquer sur "Créer une galerie"
2. Remplir le titre (requis)
3. Ajouter une description (optionnel)
4. Uploader exactement 5 images
5. Optionnel : Ajouter des légendes
6. Cliquer sur "Créer la galerie"

### Modifier une galerie

1. Cliquer sur les 3 points (⋮) sur une galerie
2. Sélectionner "Modifier"
3. Modifier les champs souhaités
4. Cliquer sur "Mettre à jour"

### Publier une galerie

Les galeries doivent être publiées pour être visibles publiquement.

1. Cliquer sur les 3 points (⋮)
2. Sélectionner "Publier" ou "Dépublier"

---

## 🔧 Backend - Implémentation

### Guide complet disponible

📄 **Voir : `docs/BACKEND-GALLERY-GUIDE.md`**

Le guide backend contient :
- Schéma de base de données complet
- Configuration Multer pour upload
- Validation avec express-validator
- Contrôleurs CRUD complets
- Routes Express
- Tests unitaires avec Jest
- Sécurité (rate limiting, sanitization)
- Documentation OpenAPI/Swagger

### Endpoints API requis

```
POST   /api/vendor/galleries              # Créer une galerie
GET    /api/vendor/galleries              # Liste des galeries
GET    /api/vendor/galleries/:id          # Une galerie spécifique
PUT    /api/vendor/galleries/:id          # Mettre à jour
DELETE /api/vendor/galleries/:id          # Supprimer
PATCH  /api/vendor/galleries/:id/publish  # Publier/Dépublier
```

---

## 📊 Base de Données

### Tables principales

#### `vendor_galleries`
- id (PK)
- vendor_id (FK → users)
- title (VARCHAR 100)
- description (TEXT)
- status (ENUM: DRAFT, PUBLISHED, ARCHIVED)
- is_published (BOOLEAN)
- created_at, updated_at, deleted_at

#### `gallery_images`
- id (PK)
- gallery_id (FK → vendor_galleries)
- image_url (VARCHAR 500)
- image_path (VARCHAR 500)
- caption (VARCHAR 200)
- order_position (INT 1-5)
- file_size, mime_type, width, height
- created_at

### Contraintes importantes

- **Exactement 5 images** : Trigger SQL empêche plus de 5 images
- **Order unique** : UNIQUE(gallery_id, order_position)
- **Cascade delete** : Supprimer galerie → supprimer images

---

## 🛡️ Validation

### Côté Frontend

```typescript
GALLERY_CONSTRAINTS = {
  IMAGES_COUNT: 5,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  CAPTION_MAX_LENGTH: 200
}
```

### Côté Backend

Validation identique avec express-validator + triggers SQL.

---

## 🎯 Cas d'Usage

### Cas 1 : Designer créant son portfolio
```
1. Crée une galerie "Collection Automne 2024"
2. Upload 5 designs de vêtements
3. Ajoute des descriptions
4. Publie la galerie
→ Visible sur sa page vendeur
```

### Cas 2 : Artiste présentant ses œuvres
```
1. Crée plusieurs galeries thématiques
2. Chaque galerie = 5 œuvres cohérentes
3. Garde certaines en brouillon
4. Publie progressivement
→ Portfolio structuré et professionnel
```

---

## 🔐 Sécurité

### Implémenté côté frontend

✅ Validation stricte des types MIME
✅ Vérification de la taille des fichiers
✅ Sanitization des entrées utilisateur
✅ Protection CSRF via tokens
✅ Authentication requise (VendeurRoute)

### À implémenter côté backend

⚠️ Rate limiting (max 10 galeries/15 min)
⚠️ Sanitization HTML (titre, description)
⚠️ Validation MIME côté serveur
⚠️ Scan antivirus des uploads (optionnel)
⚠️ Watermarking automatique (optionnel)

---

## 📈 Optimisations

### Performances

1. **Compression d'images**
   - Sharp côté backend pour WebP
   - Canvas API côté frontend (déjà implémenté)

2. **Lazy Loading**
   - Chargement progressif des images
   - Intersection Observer API

3. **CDN**
   - Servir les images via CloudFront/Cloudinary
   - Réduire la latence

4. **Caching**
   - Redis pour les galeries populaires
   - Service Worker pour cache local

### À ajouter dans le futur

- 🎨 **Drag & Drop** pour réorganiser les images
- 🖼️ **Crop & Rotate** : Éditeur d'image intégré
- 📱 **Mobile responsive** : Optimisation tactile
- 🔍 **Zoom images** : Lightbox avec zoom
- 📊 **Analytics** : Vues par galerie
- 💾 **Auto-save** : Sauvegarde automatique brouillon
- 🏷️ **Tags** : Système de tags pour filtrer

---

## 🧪 Tests

### Tests frontend (à implémenter)

```bash
npm run test:gallery
```

Tests recommandés :
- Upload de 5 images ✓
- Rejet < 5 images ✓
- Rejet > 5 images ✓
- Validation des formats ✓
- Validation des tailles ✓
- CRUD complet ✓

### Tests backend

Voir `docs/BACKEND-GALLERY-GUIDE.md` section "Tests"

---

## 📱 Responsive Design

Le composant est entièrement responsive :

- **Mobile** : 1 colonne
- **Tablet** : 2 colonnes
- **Desktop** : 3 colonnes
- **Large** : 4 colonnes (optionnel)

---

## 🎨 Personnalisation

### Modifier le nombre d'images

Pour changer le nombre d'images requis (actuellement 5) :

1. Frontend : `src/types/gallery.ts`
   ```typescript
   IMAGES_COUNT: 5 → IMAGES_COUNT: X
   ```

2. Backend : Modifier les contraintes SQL et validateurs

⚠️ **Attention** : Nécessite migration de base de données

---

## 🐛 Debugging

### Problèmes courants

**Images ne s'uploadent pas**
- Vérifier les permissions du dossier uploads/
- Vérifier la taille max dans nginx/apache
- Vérifier les CORS

**Validation échoue**
- Console navigateur pour voir les erreurs
- Vérifier le format exact des fichiers
- Tester avec d'autres images

**Galerie ne se crée pas**
- Vérifier les logs backend
- Vérifier les contraintes SQL
- Tester l'endpoint avec Postman

---

## 📞 Support

Pour toute question sur l'implémentation :

1. Consulter `docs/BACKEND-GALLERY-GUIDE.md`
2. Vérifier les types dans `src/types/gallery.ts`
3. Consulter le code source de `VendorGalleryPage.tsx`

---

## 🎉 Résumé

✅ **Frontend complet** : Interface moderne et validation robuste
✅ **Types TypeScript** : Typage strict pour la sécurité
✅ **Service API** : Prêt à connecter au backend
✅ **Guide backend** : Documentation exhaustive
✅ **Validation stricte** : 5 images exactement
✅ **UX optimale** : Animations et feedback utilisateur

**Statut** : Prêt pour l'intégration backend 🚀

---

**Auteur** : PrintAlma Dev Team
**Date** : 2024
**Version** : 1.0.0
