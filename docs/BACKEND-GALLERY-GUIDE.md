# Guide d'Implémentation Backend - Système de Galerie Vendeur

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation complète du système de gestion de galeries pour les vendeurs. Chaque galerie contient **exactement 5 images** avec validation stricte côté backend.

---

## 🗄️ Structure de Base de Données

### Table `vendor_galleries`

```sql
CREATE TABLE vendor_galleries (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  -- Index pour performances
  INDEX idx_vendor_galleries_vendor_id (vendor_id),
  INDEX idx_vendor_galleries_status (status),
  INDEX idx_vendor_galleries_created_at (created_at),

  -- Contraintes
  CONSTRAINT chk_title_length CHECK (CHAR_LENGTH(title) >= 3 AND CHAR_LENGTH(title) <= 100),
  CONSTRAINT chk_description_length CHECK (description IS NULL OR CHAR_LENGTH(description) <= 500)
);
```

### Table `gallery_images`

```sql
CREATE TABLE gallery_images (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER NOT NULL REFERENCES vendor_galleries(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  caption VARCHAR(200),
  order_position INTEGER NOT NULL CHECK (order_position BETWEEN 1 AND 5),
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Index
  INDEX idx_gallery_images_gallery_id (gallery_id),
  INDEX idx_gallery_images_order (gallery_id, order_position),

  -- Contraintes
  CONSTRAINT unique_gallery_order UNIQUE (gallery_id, order_position),
  CONSTRAINT chk_mime_type CHECK (mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp'))
);

-- Trigger pour assurer exactement 5 images par galerie
DELIMITER //
CREATE TRIGGER enforce_gallery_image_count_insert
BEFORE INSERT ON gallery_images
FOR EACH ROW
BEGIN
  DECLARE img_count INT;
  SELECT COUNT(*) INTO img_count FROM gallery_images WHERE gallery_id = NEW.gallery_id;

  IF img_count >= 5 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Une galerie ne peut contenir que 5 images maximum';
  END IF;
END //

CREATE TRIGGER enforce_gallery_image_count_update
BEFORE UPDATE ON gallery_images
FOR EACH ROW
BEGIN
  IF NEW.gallery_id != OLD.gallery_id THEN
    DECLARE img_count INT;
    SELECT COUNT(*) INTO img_count FROM gallery_images WHERE gallery_id = NEW.gallery_id;

    IF img_count >= 5 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La galerie cible contient déjà 5 images';
    END IF;
  END IF;
END //
DELIMITER ;
```

---

## 🔧 Configuration du Serveur

### Multer Configuration (Node.js/Express)

```javascript
// config/multer.config.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// Configuration de stockage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const vendorId = req.user.id;
    const uploadPath = path.join(__dirname, '../../uploads/galleries', vendorId.toString());

    // Créer le dossier si nécessaire
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  }
});

// Filtre de validation
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format non supporté: ${file.mimetype}. Formats acceptés: JPEG, PNG, WebP`), false);
  }
};

// Configuration multer
const galleryUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 fichiers
  }
});

module.exports = { galleryUpload };
```

---

## 🛡️ Validation & Middleware

### Validation Schema (Express-Validator)

```javascript
// validators/gallery.validator.js
const { body, param, validationResult } = require('express-validator');

const GALLERY_CONSTRAINTS = {
  IMAGES_COUNT: 5,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  CAPTION_MAX_LENGTH: 200
};

const validateGalleryCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ min: GALLERY_CONSTRAINTS.TITLE_MIN_LENGTH, max: GALLERY_CONSTRAINTS.TITLE_MAX_LENGTH })
    .withMessage(`Le titre doit contenir entre ${GALLERY_CONSTRAINTS.TITLE_MIN_LENGTH} et ${GALLERY_CONSTRAINTS.TITLE_MAX_LENGTH} caractères`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: GALLERY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH })
    .withMessage(`La description ne peut pas dépasser ${GALLERY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} caractères`),

  // Middleware pour vérifier les fichiers uploadés
  (req, res, next) => {
    const errors = validationResult(req);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }

    if (req.files.length !== GALLERY_CONSTRAINTS.IMAGES_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Une galerie doit contenir exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images`
      });
    }

    // Validation de chaque fichier
    for (const file of req.files) {
      if (file.size > GALLERY_CONSTRAINTS.MAX_IMAGE_SIZE) {
        return res.status(400).json({
          success: false,
          message: `Le fichier ${file.originalname} dépasse la taille maximale de 5MB`
        });
      }

      if (!GALLERY_CONSTRAINTS.ALLOWED_FORMATS.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Le fichier ${file.originalname} a un format non supporté`
        });
      }
    }

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    next();
  }
];

const validateGalleryUpdate = [
  param('id').isInt().withMessage('ID de galerie invalide'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: GALLERY_CONSTRAINTS.TITLE_MIN_LENGTH, max: GALLERY_CONSTRAINTS.TITLE_MAX_LENGTH }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: GALLERY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH }),
  body('status')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
    .withMessage('Statut invalide'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateGalleryCreation,
  validateGalleryUpdate,
  GALLERY_CONSTRAINTS
};
```

---

## 🎯 Contrôleurs (Controllers)

### Gallery Controller

```javascript
// controllers/gallery.controller.js
const db = require('../config/database');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class GalleryController {

  /**
   * Créer une nouvelle galerie
   * POST /api/vendor/galleries
   */
  async createGallery(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const { title, description } = req.body;
      const vendorId = req.user.id;
      const files = req.files;

      // Parsing des légendes (optionnel)
      const captions = req.body.captions ? JSON.parse(req.body.captions) : [];

      // Créer la galerie
      const [galleryResult] = await connection.query(
        `INSERT INTO vendor_galleries (vendor_id, title, description, status)
         VALUES (?, ?, ?, 'DRAFT')`,
        [vendorId, title, description || null]
      );

      const galleryId = galleryResult.insertId;

      // Traiter et sauvegarder chaque image
      const imagePromises = files.map(async (file, index) => {
        // Optimisation de l'image avec Sharp
        const optimizedPath = file.path.replace(path.extname(file.path), '_optimized.webp');

        const metadata = await sharp(file.path)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toFile(optimizedPath);

        // Supprimer l'original
        await fs.unlink(file.path);

        // URL relative pour la base de données
        const imageUrl = `/uploads/galleries/${vendorId}/${path.basename(optimizedPath)}`;

        // Insérer dans la base de données
        await connection.query(
          `INSERT INTO gallery_images
           (gallery_id, image_url, image_path, caption, order_position, file_size, mime_type, width, height)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            galleryId,
            imageUrl,
            optimizedPath,
            captions[index] || null,
            index + 1,
            metadata.size,
            'image/webp',
            metadata.width,
            metadata.height
          ]
        );
      });

      await Promise.all(imagePromises);
      await connection.commit();

      // Récupérer la galerie complète
      const gallery = await this.getGalleryById(galleryId);

      res.status(201).json({
        success: true,
        message: 'Galerie créée avec succès',
        data: gallery
      });

    } catch (error) {
      await connection.rollback();
      console.error('Erreur création galerie:', error);

      // Nettoyage des fichiers en cas d'erreur
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (err) {
            console.error('Erreur nettoyage fichier:', err);
          }
        }
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la galerie',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer toutes les galeries du vendeur
   * GET /api/vendor/galleries
   */
  async getVendorGalleries(req, res) {
    try {
      const vendorId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT g.*,
               COUNT(gi.id) as images_count
        FROM vendor_galleries g
        LEFT JOIN gallery_images gi ON g.id = gi.gallery_id
        WHERE g.vendor_id = ? AND g.deleted_at IS NULL
      `;
      const params = [vendorId];

      if (status) {
        query += ' AND g.status = ?';
        params.push(status);
      }

      query += ' GROUP BY g.id ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [galleries] = await db.query(query, params);

      // Récupérer les images pour chaque galerie
      const galleriesWithImages = await Promise.all(
        galleries.map(async (gallery) => {
          const [images] = await db.query(
            `SELECT * FROM gallery_images WHERE gallery_id = ? ORDER BY order_position`,
            [gallery.id]
          );
          return { ...gallery, images };
        })
      );

      // Compter le total
      const [totalResult] = await db.query(
        `SELECT COUNT(*) as total FROM vendor_galleries
         WHERE vendor_id = ? AND deleted_at IS NULL ${status ? 'AND status = ?' : ''}`,
        status ? [vendorId, status] : [vendorId]
      );

      res.json({
        success: true,
        data: {
          galleries: galleriesWithImages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalResult[0].total,
            totalPages: Math.ceil(totalResult[0].total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Erreur récupération galeries:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des galeries',
        error: error.message
      });
    }
  }

  /**
   * Récupérer une galerie par ID
   * GET /api/vendor/galleries/:id
   */
  async getGallery(req, res) {
    try {
      const { id } = req.params;
      const vendorId = req.user.id;

      const gallery = await this.getGalleryById(id, vendorId);

      if (!gallery) {
        return res.status(404).json({
          success: false,
          message: 'Galerie non trouvée'
        });
      }

      res.json({
        success: true,
        data: gallery
      });

    } catch (error) {
      console.error('Erreur récupération galerie:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la galerie',
        error: error.message
      });
    }
  }

  /**
   * Mettre à jour une galerie
   * PUT /api/vendor/galleries/:id
   */
  async updateGallery(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const vendorId = req.user.id;
      const { title, description, status, is_published } = req.body;

      // Vérifier que la galerie appartient au vendeur
      const [galleries] = await connection.query(
        'SELECT * FROM vendor_galleries WHERE id = ? AND vendor_id = ?',
        [id, vendorId]
      );

      if (galleries.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Galerie non trouvée'
        });
      }

      // Préparer les champs à mettre à jour
      const updates = [];
      const params = [];

      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }

      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }

      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      if (is_published !== undefined) {
        updates.push('is_published = ?');
        params.push(is_published);
      }

      updates.push('updated_at = NOW()');
      params.push(id);

      // Exécuter la mise à jour
      await connection.query(
        `UPDATE vendor_galleries SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      await connection.commit();

      const gallery = await this.getGalleryById(id, vendorId);

      res.json({
        success: true,
        message: 'Galerie mise à jour avec succès',
        data: gallery
      });

    } catch (error) {
      await connection.rollback();
      console.error('Erreur mise à jour galerie:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la galerie',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  /**
   * Supprimer une galerie (soft delete)
   * DELETE /api/vendor/galleries/:id
   */
  async deleteGallery(req, res) {
    try {
      const { id } = req.params;
      const vendorId = req.user.id;

      // Vérifier que la galerie appartient au vendeur
      const [galleries] = await db.query(
        'SELECT * FROM vendor_galleries WHERE id = ? AND vendor_id = ?',
        [id, vendorId]
      );

      if (galleries.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Galerie non trouvée'
        });
      }

      // Soft delete
      await db.query(
        'UPDATE vendor_galleries SET deleted_at = NOW() WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Galerie supprimée avec succès'
      });

    } catch (error) {
      console.error('Erreur suppression galerie:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la galerie',
        error: error.message
      });
    }
  }

  /**
   * Publier/Dépublier une galerie
   * PATCH /api/vendor/galleries/:id/publish
   */
  async togglePublish(req, res) {
    try {
      const { id } = req.params;
      const vendorId = req.user.id;
      const { is_published } = req.body;

      // Vérifier que la galerie a exactement 5 images
      const [imageCount] = await db.query(
        `SELECT COUNT(*) as count FROM gallery_images gi
         JOIN vendor_galleries g ON gi.gallery_id = g.id
         WHERE g.id = ? AND g.vendor_id = ?`,
        [id, vendorId]
      );

      if (imageCount[0].count !== 5) {
        return res.status(400).json({
          success: false,
          message: 'Une galerie doit avoir exactement 5 images pour être publiée'
        });
      }

      await db.query(
        `UPDATE vendor_galleries
         SET is_published = ?, status = ?, updated_at = NOW()
         WHERE id = ? AND vendor_id = ?`,
        [is_published, is_published ? 'PUBLISHED' : 'DRAFT', id, vendorId]
      );

      res.json({
        success: true,
        message: is_published ? 'Galerie publiée' : 'Galerie dépubliée'
      });

    } catch (error) {
      console.error('Erreur publication galerie:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la publication de la galerie',
        error: error.message
      });
    }
  }

  /**
   * Méthode utilitaire pour récupérer une galerie complète
   */
  async getGalleryById(galleryId, vendorId = null) {
    let query = 'SELECT * FROM vendor_galleries WHERE id = ?';
    const params = [galleryId];

    if (vendorId) {
      query += ' AND vendor_id = ?';
      params.push(vendorId);
    }

    const [galleries] = await db.query(query, params);

    if (galleries.length === 0) {
      return null;
    }

    const [images] = await db.query(
      'SELECT * FROM gallery_images WHERE gallery_id = ? ORDER BY order_position',
      [galleryId]
    );

    return {
      ...galleries[0],
      images
    };
  }
}

module.exports = new GalleryController();
```

---

## 🛣️ Routes

### Gallery Routes

```javascript
// routes/gallery.routes.js
const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery.controller');
const { galleryUpload } = require('../config/multer.config');
const { validateGalleryCreation, validateGalleryUpdate } = require('../validators/gallery.validator');
const { authenticateVendor } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent l'authentification vendeur
router.use(authenticateVendor);

// Créer une galerie
router.post(
  '/',
  galleryUpload.array('images', 5),
  validateGalleryCreation,
  galleryController.createGallery
);

// Récupérer toutes les galeries du vendeur
router.get('/', galleryController.getVendorGalleries);

// Récupérer une galerie spécifique
router.get('/:id', galleryController.getGallery);

// Mettre à jour une galerie
router.put('/:id', validateGalleryUpdate, galleryController.updateGallery);

// Supprimer une galerie
router.delete('/:id', galleryController.deleteGallery);

// Publier/Dépublier
router.patch('/:id/publish', galleryController.togglePublish);

module.exports = router;
```

### Intégration dans app.js

```javascript
// app.js
const galleryRoutes = require('./routes/gallery.routes');

app.use('/api/vendor/galleries', galleryRoutes);
```

---

## 🧪 Tests

### Tests Unitaires (Jest)

```javascript
// tests/gallery.test.js
const request = require('supertest');
const app = require('../app');
const db = require('../config/database');

describe('Gallery API', () => {
  let vendorToken;
  let galleryId;

  beforeAll(async () => {
    // Login vendeur
    const loginRes = await request(app)
      .post('/api/auth/vendor/login')
      .send({ email: 'vendor@test.com', password: 'password123' });

    vendorToken = loginRes.body.token;
  });

  describe('POST /api/vendor/galleries', () => {
    it('devrait créer une galerie avec 5 images', async () => {
      const res = await request(app)
        .post('/api/vendor/galleries')
        .set('Authorization', `Bearer ${vendorToken}`)
        .field('title', 'Test Gallery')
        .field('description', 'Test Description')
        .attach('images', 'tests/fixtures/image1.jpg')
        .attach('images', 'tests/fixtures/image2.jpg')
        .attach('images', 'tests/fixtures/image3.jpg')
        .attach('images', 'tests/fixtures/image4.jpg')
        .attach('images', 'tests/fixtures/image5.jpg');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(5);

      galleryId = res.body.data.id;
    });

    it('devrait rejeter une galerie avec moins de 5 images', async () => {
      const res = await request(app)
        .post('/api/vendor/galleries')
        .set('Authorization', `Bearer ${vendorToken}`)
        .field('title', 'Incomplete Gallery')
        .attach('images', 'tests/fixtures/image1.jpg')
        .attach('images', 'tests/fixtures/image2.jpg');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('devrait rejeter une galerie avec plus de 5 images', async () => {
      const res = await request(app)
        .post('/api/vendor/galleries')
        .set('Authorization', `Bearer ${vendorToken}`)
        .field('title', 'Too Many Images')
        .attach('images', 'tests/fixtures/image1.jpg')
        .attach('images', 'tests/fixtures/image2.jpg')
        .attach('images', 'tests/fixtures/image3.jpg')
        .attach('images', 'tests/fixtures/image4.jpg')
        .attach('images', 'tests/fixtures/image5.jpg')
        .attach('images', 'tests/fixtures/image6.jpg');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/vendor/galleries', () => {
    it('devrait récupérer toutes les galeries du vendeur', async () => {
      const res = await request(app)
        .get('/api/vendor/galleries')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.galleries)).toBe(true);
    });
  });

  describe('PUT /api/vendor/galleries/:id', () => {
    it('devrait mettre à jour une galerie', async () => {
      const res = await request(app)
        .put(`/api/vendor/galleries/${galleryId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/vendor/galleries/:id', () => {
    it('devrait supprimer une galerie', async () => {
      const res = await request(app)
        .delete(`/api/vendor/galleries/${galleryId}`)
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
```

---

## 📊 Monitoring & Logs

### Logging avec Winston

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/gallery-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/gallery-combined.log' })
  ]
});

module.exports = logger;
```

### Utilisation dans le contrôleur

```javascript
const logger = require('../utils/logger');

// Dans createGallery
logger.info('Gallery created', {
  vendorId: req.user.id,
  galleryId: galleryResult.insertId,
  imageCount: files.length
});

// En cas d'erreur
logger.error('Gallery creation failed', {
  vendorId: req.user.id,
  error: error.message,
  stack: error.stack
});
```

---

## 🔐 Sécurité

### Points de sécurité à implémenter

1. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const galleryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 créations max par fenêtre
  message: 'Trop de galeries créées, réessayez plus tard'
});

router.post('/', galleryLimiter, ...);
```

2. **Sanitization**
```javascript
const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (req, res, next) => {
  if (req.body.title) {
    req.body.title = sanitizeHtml(req.body.title, { allowedTags: [] });
  }
  if (req.body.description) {
    req.body.description = sanitizeHtml(req.body.description, { allowedTags: [] });
  }
  next();
};
```

3. **CSRF Protection**
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

router.post('/', csrfProtection, ...);
```

---

## 📝 Documentation API (OpenAPI/Swagger)

```yaml
openapi: 3.0.0
info:
  title: Gallery Management API
  version: 1.0.0

paths:
  /api/vendor/galleries:
    post:
      summary: Créer une galerie
      tags:
        - Galleries
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - title
                - images
              properties:
                title:
                  type: string
                  minLength: 3
                  maxLength: 100
                description:
                  type: string
                  maxLength: 500
                images:
                  type: array
                  minItems: 5
                  maxItems: 5
                  items:
                    type: string
                    format: binary
                captions:
                  type: array
                  items:
                    type: string
                    maxLength: 200
      responses:
        '201':
          description: Galerie créée avec succès
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
```

---

## ✅ Checklist d'Implémentation

- [ ] Créer les tables de base de données
- [ ] Configurer Multer pour l'upload
- [ ] Implémenter les validateurs
- [ ] Créer le contrôleur avec toutes les méthodes CRUD
- [ ] Définir les routes
- [ ] Ajouter les tests unitaires
- [ ] Mettre en place le logging
- [ ] Implémenter la sécurité (rate limiting, sanitization)
- [ ] Documenter l'API avec Swagger
- [ ] Tester en production

---

## 🚀 Optimisations Recommandées

1. **Compression d'images** : Utiliser Sharp pour optimiser automatiquement
2. **CDN** : Servir les images via un CDN (CloudFront, Cloudinary)
3. **Lazy Loading** : Implémenter le chargement progressif côté frontend
4. **Caching** : Redis pour mettre en cache les galeries fréquemment consultées
5. **Queue Jobs** : Bull/BullMQ pour traiter les uploads en arrière-plan

---

**Auteur**: PrintAlma Dev Team
**Date**: 2024
**Version**: 1.0.0
