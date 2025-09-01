# Exemples d'Implémentation Backend - Configuration des Designs

## 🚀 Exemples de Code Concrets

### 1. Controller de Designs (Express.js)

```javascript
// controllers/designController.js
const { validationResult } = require('express-validator');
const Design = require('../models/Design');
const { uploadToCloudinary, generateThumbnail } = require('../services/imageService');

class DesignController {
  // Créer un nouveau design
  static async createDesign(req, res) {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.mapped()
        });
      }

      const { name, description, price, category } = req.body;
      const vendorId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Fichier image requis'
        });
      }

      // Traitement de l'image
      const imageData = await uploadToCloudinary(file, {
        folder: `designs/${vendorId}`,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      // Génération de la miniature
      const thumbnailData = await generateThumbnail(file, {
        width: 400,
        height: 400,
        crop: 'fill'
      });

      // Création du design en base
      const design = await Design.create({
        vendorId,
        name: name.trim(),
        description: description?.trim() || null,
        price: parseInt(price),
        category,
        imageUrl: imageData.secure_url,
        thumbnailUrl: thumbnailData.secure_url,
        fileSize: file.size,
        dimensions: {
          width: imageData.width,
          height: imageData.height
        },
        isDraft: true,
        isPublished: false,
        isPending: false
      });

      // Log de l'activité
      req.logger.info('Design created successfully', {
        designId: design.id,
        vendorId,
        name: design.name,
        price: design.price
      });

      res.status(201).json({
        success: true,
        message: 'Design créé avec succès',
        data: design.toJSON()
      });

    } catch (error) {
      req.logger.error('Error creating design', {
        error: error.message,
        vendorId: req.user?.id,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Récupérer les designs du vendeur
  static async getDesigns(req, res) {
    try {
      const vendorId = req.user.id;
      const {
        page = 1,
        limit = 20,
        category,
        status,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { vendorId };

      // Filtres
      if (category && category !== 'all') {
        whereClause.category = category;
      }

      if (status && status !== 'all') {
        switch (status) {
          case 'published':
            whereClause.isPublished = true;
            break;
          case 'pending':
            whereClause.isPending = true;
            break;
          case 'draft':
            whereClause.isDraft = true;
            break;
        }
      }

      // Recherche textuelle
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Requête paginée
      const { rows: designs, count } = await Design.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      // Statistiques
      const stats = await Design.getVendorStats(vendorId);

      res.json({
        success: true,
        data: {
          designs: designs.map(d => d.toJSON()),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          },
          stats
        }
      });

    } catch (error) {
      req.logger.error('Error fetching designs', {
        error: error.message,
        vendorId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des designs'
      });
    }
  }

  // Modifier un design
  static async updateDesign(req, res) {
    try {
      const { id } = req.params;
      const vendorId = req.user.id;
      const { name, description, price, category } = req.body;

      const design = await Design.findOne({
        where: { id, vendorId }
      });

      if (!design) {
        return res.status(404).json({
          success: false,
          message: 'Design non trouvé'
        });
      }

      // Mise à jour
      await design.update({
        name: name?.trim(),
        description: description?.trim() || null,
        price: price ? parseInt(price) : design.price,
        category: category || design.category,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Design mis à jour avec succès',
        data: design.toJSON()
      });

    } catch (error) {
      req.logger.error('Error updating design', {
        error: error.message,
        designId: req.params.id,
        vendorId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour'
      });
    }
  }

  // Publier/dépublier un design
  static async togglePublish(req, res) {
    try {
      const { id } = req.params;
      const vendorId = req.user.id;
      const { isPublished } = req.body;

      const design = await Design.findOne({
        where: { id, vendorId }
      });

      if (!design) {
        return res.status(404).json({
          success: false,
          message: 'Design non trouvé'
        });
      }

      await design.update({
        isPublished: !!isPublished,
        isPending: false,
        isDraft: !isPublished,
        publishedAt: isPublished ? new Date() : null,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: isPublished ? 'Design publié' : 'Design retiré de la vente',
        data: design.toJSON()
      });

    } catch (error) {
      req.logger.error('Error toggling design publish status', {
        error: error.message,
        designId: req.params.id,
        vendorId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la publication'
      });
    }
  }

  // Supprimer un design
  static async deleteDesign(req, res) {
    try {
      const { id } = req.params;
      const vendorId = req.user.id;

      const design = await Design.findOne({
        where: { id, vendorId }
      });

      if (!design) {
        return res.status(404).json({
          success: false,
          message: 'Design non trouvé'
        });
      }

      // Supprimer les images de Cloudinary
      if (design.imageUrl) {
        await deleteFromCloudinary(design.imageUrl);
      }
      if (design.thumbnailUrl) {
        await deleteFromCloudinary(design.thumbnailUrl);
      }

      // Supprimer de la base
      await design.destroy();

      res.json({
        success: true,
        message: 'Design supprimé avec succès'
      });

    } catch (error) {
      req.logger.error('Error deleting design', {
        error: error.message,
        designId: req.params.id,
        vendorId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression'
      });
    }
  }
}

module.exports = DesignController;
```

### 2. Modèle Sequelize

```javascript
// models/Design.js
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Design = sequelize.define('Design', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 100,
      max: 1000000
    }
  },
  category: {
    type: DataTypes.ENUM('logo', 'pattern', 'illustration', 'typography', 'abstract'),
    allowNull: false,
    defaultValue: 'illustration'
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  thumbnailUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPending: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDraft: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  earnings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'designs',
  timestamps: true,
  underscored: true
});

// Méthodes statiques
Design.getVendorStats = async function(vendorId) {
  const designs = await this.findAll({
    where: { vendorId },
    attributes: [
      'isPublished',
      'isPending', 
      'isDraft',
      'earnings',
      'views',
      'likes'
    ]
  });

  return {
    total: designs.length,
    published: designs.filter(d => d.isPublished).length,
    pending: designs.filter(d => d.isPending).length,
    draft: designs.filter(d => d.isDraft).length,
    totalEarnings: designs.reduce((sum, d) => sum + d.earnings, 0),
    totalViews: designs.reduce((sum, d) => sum + d.views, 0),
    totalLikes: designs.reduce((sum, d) => sum + d.likes, 0)
  };
};

// Méthodes d'instance
Design.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  return {
    id: values.id,
    name: values.name,
    description: values.description,
    price: values.price,
    category: values.category,
    imageUrl: values.image_url,
    thumbnailUrl: values.thumbnail_url,
    fileSize: values.file_size,
    dimensions: values.dimensions,
    isPublished: values.is_published,
    isPending: values.is_pending,
    isDraft: values.is_draft,
    tags: values.tags,
    usageCount: values.usage_count,
    earnings: values.earnings,
    views: values.views,
    likes: values.likes,
    createdAt: values.created_at,
    updatedAt: values.updated_at,
    publishedAt: values.published_at
  };
};

module.exports = Design;
```

### 3. Middleware de Validation

```javascript
// middleware/designValidation.js
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configuration Multer pour l'upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Validations pour la création de design
const validateDesignCreation = [
  upload.single('file'),
  
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Le nom doit contenir entre 3 et 255 caractères')
    .notEmpty()
    .withMessage('Le nom est requis'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
    
  body('price')
    .isInt({ min: 100, max: 1000000 })
    .withMessage('Le prix doit être entre 100 et 1,000,000 FCFA')
    .toInt(),
    
  body('category')
    .isIn(['logo', 'pattern', 'illustration', 'typography', 'abstract'])
    .withMessage('Catégorie non valide')
];

// Validations pour la mise à jour
const validateDesignUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Le nom doit contenir entre 3 et 255 caractères'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
    
  body('price')
    .optional()
    .isInt({ min: 100, max: 1000000 })
    .withMessage('Le prix doit être entre 100 et 1,000,000 FCFA')
    .toInt(),
    
  body('category')
    .optional()
    .isIn(['logo', 'pattern', 'illustration', 'typography', 'abstract'])
    .withMessage('Catégorie non valide')
];

module.exports = {
  validateDesignCreation,
  validateDesignUpdate,
  upload
};
```

### 4. Service de Gestion d'Images

```javascript
// services/imageService.js
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class ImageService {
  // Upload vers Cloudinary
  static async uploadToCloudinary(file, options = {}) {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: options.folder || 'designs',
            transformation: options.transformation || [],
            quality: 'auto',
            fetch_format: 'auto',
            ...options
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        stream.end(file.buffer);
      });

      return result;
    } catch (error) {
      console.error('Erreur upload Cloudinary:', error);
      throw new Error('Erreur lors de l\'upload de l\'image');
    }
  }

  // Génération de miniature
  static async generateThumbnail(file, options = {}) {
    try {
      const { width = 400, height = 400, crop = 'fill' } = options;
      
      // Redimensionner avec Sharp
      const resizedBuffer = await sharp(file.buffer)
        .resize(width, height, {
          fit: crop === 'fill' ? 'cover' : 'inside',
          withoutEnlargement: false
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload de la miniature
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: options.folder || 'designs/thumbnails',
            transformation: [
              { width, height, crop: 'fill' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        stream.end(resizedBuffer);
      });

      return result;
    } catch (error) {
      console.error('Erreur génération miniature:', error);
      throw new Error('Erreur lors de la génération de la miniature');
    }
  }

  // Suppression d'image
  static async deleteFromCloudinary(imageUrl) {
    try {
      // Extraire le public_id de l'URL
      const publicId = this.extractPublicId(imageUrl);
      
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error('Erreur suppression Cloudinary:', error);
      // Ne pas faire échouer la suppression si l'image n'existe plus
    }
  }

  // Extraire le public_id de l'URL Cloudinary
  static extractPublicId(url) {
    const matches = url.match(/\/([^\/]+)\.(jpg|jpeg|png|gif|svg)$/i);
    return matches ? matches[1] : null;
  }

  // Extraction des métadonnées
  static async extractMetadata(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha
      };
    } catch (error) {
      console.error('Erreur extraction métadonnées:', error);
      return null;
    }
  }
}

module.exports = ImageService;
```

### 5. Routes

```javascript
// routes/designs.js
const express = require('express');
const router = express.Router();
const DesignController = require('../controllers/designController');
const { validateDesignCreation, validateDesignUpdate } = require('../middleware/designValidation');
const { requireAuth, requireVendor } = require('../middleware/auth');

// Middleware global pour toutes les routes
router.use(requireAuth);
router.use(requireVendor);

// Routes CRUD
router.post('/', validateDesignCreation, DesignController.createDesign);
router.get('/', DesignController.getDesigns);
router.put('/:id', validateDesignUpdate, DesignController.updateDesign);
router.patch('/:id/publish', DesignController.togglePublish);
router.delete('/:id', DesignController.deleteDesign);

// Route pour incrémenter les vues
router.patch('/:id/view', DesignController.incrementViews);

module.exports = router;
```

### 6. Tests d'Intégration

```javascript
// tests/design.test.js
const request = require('supertest');
const app = require('../app');
const { Design, User } = require('../models');
const path = require('path');

describe('Design API', () => {
  let vendorToken;
  let vendorId;

  beforeEach(async () => {
    // Créer un vendeur de test
    const vendor = await User.create({
      name: 'Test Vendor',
      email: 'vendor@test.com',
      password: 'password123',
      role: 'VENDEUR'
    });
    
    vendorId = vendor.id;
    vendorToken = generateToken(vendor);
  });

  afterEach(async () => {
    await Design.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('POST /api/designs', () => {
    it('should create a design with valid data', async () => {
      const response = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${vendorToken}`)
        .attach('file', path.join(__dirname, 'fixtures/test-design.jpg'))
        .field('name', 'Test Design')
        .field('description', 'A test design')
        .field('price', '2500')
        .field('category', 'logo');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Design');
      expect(response.body.data.price).toBe(2500);
    });

    it('should reject design with invalid price', async () => {
      const response = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${vendorToken}`)
        .attach('file', path.join(__dirname, 'fixtures/test-design.jpg'))
        .field('name', 'Test Design')
        .field('price', '50') // Too low
        .field('category', 'logo');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.price).toBeDefined();
    });

    it('should reject design without file', async () => {
      const response = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${vendorToken}`)
        .field('name', 'Test Design')
        .field('price', '2500')
        .field('category', 'logo');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/designs', () => {
    beforeEach(async () => {
      // Créer des designs de test
      await Design.bulkCreate([
        {
          vendorId,
          name: 'Logo Design',
          price: 2500,
          category: 'logo',
          imageUrl: 'http://example.com/logo.jpg',
          isPublished: true
        },
        {
          vendorId,
          name: 'Pattern Design',
          price: 1800,
          category: 'pattern',
          imageUrl: 'http://example.com/pattern.jpg',
          isDraft: true
        }
      ]);
    });

    it('should return all vendor designs', async () => {
      const response = await request(app)
        .get('/api/designs')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.designs).toHaveLength(2);
      expect(response.body.data.stats.total).toBe(2);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/designs?category=logo')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.designs).toHaveLength(1);
      expect(response.body.data.designs[0].category).toBe('logo');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/designs?status=published')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.designs).toHaveLength(1);
      expect(response.body.data.designs[0].isPublished).toBe(true);
    });
  });
});
```

### 7. Configuration d'Environnement

```bash
# .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

DB_HOST=localhost
DB_PORT=5432
DB_NAME=printalma_db
DB_USER=postgres
DB_PASSWORD=password

JWT_SECRET=your_jwt_secret
JWT_EXPIRE_TIME=7d

MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/svg+xml
```

### 8. Package.json Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "express-validator": "^6.15.0",
    "multer": "^1.4.5-lts.1",
    "sequelize": "^6.32.1",
    "pg": "^8.11.0",
    "cloudinary": "^1.37.3",
    "sharp": "^0.32.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "nodemon": "^2.0.22"
  }
}
```

Ce document fournit une base solide pour l'implémentation backend complète de la fonctionnalité de configuration des designs ! 🚀 