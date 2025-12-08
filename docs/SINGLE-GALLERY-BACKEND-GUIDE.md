# Guide d'implémentation Backend - Galerie Unique par Vendeur

## Vue d'ensemble

Ce document décrit les modifications nécessaires pour implémenter un système de galerie où chaque vendeur a **une seule galerie contenant exactement 5 images**.

## Changements par rapport au système précédent

- **Avant** : Un vendeur pouvait créer plusieurs galeries
- **Après** : Un vendeur a **une seule galerie** avec **exactement 5 images**
- La galerie est créée automatiquement lors de la première création
- Les mises à jour se font sur cette galerie unique

## Schéma de la base de données

### Table `vendor_galleries`

```sql
CREATE TABLE vendor_galleries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL, -- Soft delete

    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_status (status),
    INDEX idx_published (is_published)
);
```

### Table `gallery_images`

```sql
CREATE TABLE gallery_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gallery_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(200),
    order_position TINYINT NOT NULL, -- Position de 1 à 5
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (gallery_id) REFERENCES vendor_galleries(id) ON DELETE CASCADE,
    UNIQUE KEY unique_gallery_order (gallery_id, order_position),
    INDEX idx_gallery_order (gallery_id, order_position)
);
```

## Contraintes à appliquer

### Validation au niveau de la base de données

```sql
-- Trigger pour s'assurer qu'une galerie a toujours 5 images maximum
DELIMITER //
CREATE TRIGGER check_gallery_images_count
BEFORE INSERT ON gallery_images
FOR EACH ROW
BEGIN
    DECLARE image_count INT;
    SELECT COUNT(*) INTO image_count
    FROM gallery_images
    WHERE gallery_id = NEW.gallery_id;

    IF image_count >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Une galerie ne peut contenir que 5 images maximum';
    END IF;
END//
DELIMITER ;
```

## Endpoints API

### 1. Récupérer la galerie du vendeur connecté

```
GET /api/vendor/galleries/my-gallery
```

**Response :**
```json
{
    "success": true,
    "data": {
        "gallery": {
            "id": 1,
            "vendor_id": 123,
            "title": "Ma galerie",
            "description": "Description de ma galerie",
            "status": "PUBLISHED",
            "is_published": true,
            "images": [
                {
                    "id": 1,
                    "image_url": "https://example.com/image1.jpg",
                    "caption": "Légende image 1",
                    "order": 1
                },
                // ... jusqu'à 5 images
            ],
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    }
}
```

**Si le vendeur n'a pas de galerie :**
```json
{
    "success": true,
    "data": {
        "gallery": null
    }
}
```

### 2. Créer ou mettre à jour la galerie

```
POST /api/vendor/galleries/my-gallery
Content-Type: multipart/form-data
```

**Body :**
- `title` (string, requis) : Titre de la galerie
- `description` (string, optionnel) : Description
- `images` (files, requis) : Exactement 5 fichiers images
- `captions` (JSON string, optionnel) : Tableau de légendes

**Response :**
```json
{
    "success": true,
    "message": "Galerie créée avec succès",
    "data": {
        "gallery": {
            // Même structure que la réponse GET
        }
    }
}
```

### 3. Mettre à jour les informations (titre, description, statut)

```
PUT /api/vendor/galleries/my-gallery
Content-Type: application/json
```

**Body :**
```json
{
    "title": "Nouveau titre",
    "description": "Nouvelle description",
    "status": "PUBLISHED",
    "is_published": true
}
```

### 4. Publier/Dépublier la galerie

```
PATCH /api/vendor/galleries/my-gallery/publish
Content-Type: application/json
```

**Body :**
```json
{
    "is_published": true
}
```

### 5. Supprimer la galerie (soft delete)

```
DELETE /api/vendor/galleries/my-gallery
```

### 6. Récupérer la galerie publique d'un vendeur

```
GET /api/public/galleries/vendor/{vendorId}
```

**Response :** (uniquement si la galerie est publiée)
```json
{
    "success": true,
    "data": {
        "gallery": {
            // Structure complète de la galerie
        }
    }
}
```

## Validation des images

### Contrôles à implémenter

1. **Nombre exact d'images** : 5 images requises
2. **Formats supportés** : JPEG, PNG, WebP
3. **Taille maximale** : 5MB par image
4. **Dimensions recommandées** : 1200x1200px (carré)

### Middleware de validation

```javascript
const multer = require('multer');
const path = require('path');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/galleries/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Filtre de fichiers
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format de fichier non supporté. Utilisez JPEG, PNG ou WebP.'), false);
    }
};

// Configuration de multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5
    }
});

// Middleware pour valider qu'on a exactement 5 images
const validateExactFiveImages = (req, res, next) => {
    if (!req.files || req.files.length !== 5) {
        return res.status(400).json({
            success: false,
            message: 'Vous devez fournir exactement 5 images'
        });
    }
    next();
};
```

## Logique métier

### Contraintes à respecter

1. **Unicité** : Un vendeur ne peut avoir qu'une seule galerie
2. **Intégrité** : Une galerie doit avoir 5 images pour être publiée
3. **Continuité** : Les positions des images doivent être de 1 à 5 sans trou

### Exemple de logique de création/mise à jour

```javascript
async function createOrUpdateGallery(vendorId, galleryData, images) {
    // Vérifier que le vendeur n'a pas déjà une galerie
    let gallery = await Gallery.findOne({ where: { vendor_id: vendorId } });

    if (!gallery) {
        // Création
        gallery = await Gallery.create({
            vendor_id: vendorId,
            title: galleryData.title,
            description: galleryData.description,
            status: 'DRAFT'
        });
    } else {
        // Mise à jour
        await gallery.update({
            title: galleryData.title,
            description: galleryData.description
        });

        // Supprimer les anciennes images si on en fournit de nouvelles
        if (images && images.length > 0) {
            await GalleryImage.destroy({ where: { gallery_id: gallery.id } });
        }
    }

    // Ajouter les nouvelles images si fournies
    if (images && images.length === 5) {
        const captions = galleryData.captions || [];
        const imageData = images.map((image, index) => ({
            gallery_id: gallery.id,
            image_url: `/uploads/galleries/${image.filename}`,
            caption: captions[index] || `Image ${index + 1}`,
            order_position: index + 1
        }));

        await GalleryImage.bulkCreate(imageData);
    }

    return gallery;
}
```

## Gestion des erreurs

### Messages d'erreur standards

```javascript
const GALLERY_ERRORS = {
    NOT_FOUND: {
        success: false,
        message: 'Aucune galerie trouvée pour ce vendeur'
    },
    ALREADY_EXISTS: {
        success: false,
        message: 'Ce vendeur a déjà une galerie'
    },
    INVALID_IMAGE_COUNT: {
        success: false,
        message: 'Une galerie doit contenir exactement 5 images'
    },
    INVALID_IMAGE_FORMAT: {
        success: false,
        message: 'Format d\'image non supporté. Utilisez JPEG, PNG ou WebP'
    },
    IMAGE_TOO_LARGE: {
        success: false,
        message: 'La taille d\'une image ne peut pas dépasser 5MB'
    },
    CANNOT_PUBLISH_INCOMPLETE: {
        success: false,
        message: 'La galerie doit contenir 5 images pour être publiée'
    }
};
```

## Optimisations

### Index de base de données

```sql
-- Index pour les performances
CREATE INDEX idx_vendor_galleries_lookup ON vendor_galleries(vendor_id, deleted_at);
CREATE INDEX idx_public_galleries ON vendor_galleries(is_published, status, deleted_at);
CREATE INDEX idx_gallery_images_sorted ON gallery_images(gallery_id, order_position);
```

### Cache Redis

```javascript
// Clés de cache
const CACHE_KEYS = {
    vendorGallery: (vendorId) => `vendor_gallery_${vendorId}`,
    publicGallery: (vendorId) => `public_gallery_${vendorId}`
};

// Durée de cache
const CACHE_TTL = {
    gallery: 3600, // 1 heure
    publicGallery: 7200 // 2 heures
};
```

## Tests à implémenter

### Tests unitaires

1. Test de création de galerie avec 5 images valides
2. Test de rejet si moins de 5 images
3. Test de rejet si plus de 5 images
4. Test d'interdiction de création d'une deuxième galerie
5. Test de mise à jour des informations
6. Test de publication/dépublication

### Tests d'intégration

1. Test du workflow complet de création
2. Test de la contrainte d'unicité par vendeur
3. Test de la persistance des images
4. Test de la suppression soft delete

## Sécurité

### Points de vigilance

1. **Validation stricte** des fichiers uploadés
2. **Sanitization** des titres et descriptions
3. **Vérification** des permissions (vendeur connecté)
4. **Rate limiting** sur les endpoints d'upload
5. **Scan antivirus** sur les fichiers uploadés

### Middleware d'authentification

```javascript
const authMiddleware = async (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    // Vérifier que l'utilisateur est un vendeur
    // Ajouter vendor_id à la requête
    next();
};
```

## Migration depuis l'ancien système

Si vous avez déjà un système de galeries multiples :

```sql
-- Script de migration pour conserver la première galerie de chaque vendeur
CREATE TEMPORARY TABLE temp_vendor_galleries AS
SELECT DISTINCT
    vendor_id,
    MIN(id) as gallery_id_to_keep
FROM galleries
WHERE deleted_at IS NULL
GROUP BY vendor_id;

-- Supprimer les galeries en double
DELETE g FROM galleries g
JOIN temp_vendor_galleries t ON g.vendor_id = t.vendor_id
WHERE g.id != t.gallery_id_to_keep;

-- S'assurer que les galeries restantes ont 5 images ou moins
-- (implémenter la logique de nettoyage nécessaire)
```

## Monitoring

### Métriques à suivre

1. Nombre de galeries créées par jour
2. Taux de galeries publiées vs brouillons
3. Temps moyen de création d'une galerie
4. Erreurs d'upload par type
5. Espace de stockage utilisé par les images

### Logs importants

```javascript
logger.info('Gallery created', {
    vendorId,
    galleryId,
    imageCount: 5
});

logger.warn('Gallery creation failed', {
    vendorId,
    error: error.message,
    imageCount: req.files?.length
});
```

Ce guide fournit une base complète pour implémenter le système de galerie unique par vendeur avec 5 images obligatoires. Adaptez selon votre stack technique et vos besoins spécifiques.