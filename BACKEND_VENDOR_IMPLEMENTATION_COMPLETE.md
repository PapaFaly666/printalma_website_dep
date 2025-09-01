# Backend Vendeur - Implémentation Complète PrintAlma

## 🚨 PROBLÈME IDENTIFIÉ

Le frontend essaie d'envoyer vers `POST /vendor/products` mais l'endpoint retourne **404 Not Found**.

**Logs Frontend :**
```
POST http://localhost:3004/vendor/products 404 (Not Found)
❌ Endpoint non trouvé - Vérifiez que http://localhost:3004/vendor/products existe sur le backend
```

## 📋 SOLUTION COMPLÈTE

### 1. Route Vendeur (`routes/vendor.js`)

```javascript
/**
 * Routes Vendeur - PrintAlma
 * Gestion des produits vendeur avec design incorporé
 */

const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticateVendor } = require('../middleware/auth');

// Middleware d'authentification vendeur
router.use(authenticateVendor);

// Routes produits vendeur
router.get('/products', vendorController.getVendorProducts);
router.post('/products', vendorController.createVendorProduct);
router.get('/products/:id', vendorController.getVendorProduct);
router.patch('/products/:id', vendorController.updateVendorProduct);
router.delete('/products/:id', vendorController.deleteVendorProduct);

// Route statistiques
router.get('/stats', vendorController.getVendorStats);

// Route spéciale pour publication avec design
router.post('/publish-with-design', vendorController.publishWithDesign);

module.exports = router;
```

### 2. Controller Vendeur (`controllers/vendorController.js`)

```javascript
/**
 * Controller Vendeur - PrintAlma
 * Gestion des produits vendeur avec images et design
 */

const VendorProduct = require('../models/VendorProduct');
const BaseProduct = require('../models/BaseProduct');
const cloudinaryService = require('../services/cloudinaryService');

class VendorController {
  
  /**
   * ✅ ENDPOINT PRINCIPAL: Création produit vendeur
   * POST /vendor/products
   */
  async createVendorProduct(req, res) {
    try {
      console.log('🚀 === CRÉATION PRODUIT VENDEUR ===');
      console.log('📋 Payload reçu:', {
        baseProductId: req.body.baseProductId,
        vendorName: req.body.vendorName,
        designUrl: req.body.designUrl ? 'PRÉSENT' : 'ABSENT',
        finalImagesBase64Keys: req.body.finalImagesBase64 ? Object.keys(req.body.finalImagesBase64) : [],
        colorImagesKeys: req.body.finalImages?.colorImages ? Object.keys(req.body.finalImages.colorImages) : []
      });

      const {
        baseProductId,
        designUrl,
        finalImages,
        finalImagesBase64,
        vendorPrice,
        vendorName,
        vendorDescription,
        vendorStock,
        basePriceAdmin,
        selectedSizes,
        selectedColors,
        previewView,
        vendorId
      } = req.body;

      // Validation des données
      if (!baseProductId || !vendorName || !vendorPrice || !finalImagesBase64) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes: baseProductId, vendorName, vendorPrice, finalImagesBase64 requis'
        });
      }

      // Vérifier que le produit de base existe
      const baseProduct = await BaseProduct.findById(baseProductId);
      if (!baseProduct) {
        return res.status(404).json({
          success: false,
          message: `Produit de base ${baseProductId} non trouvé`
        });
      }

      console.log('✅ Produit de base trouvé:', baseProduct.name);

      // ✅ ÉTAPE 1: Upload du design original
      let uploadedDesignUrl = null;
      if (finalImagesBase64.design) {
        console.log('🎨 Upload du design original...');
        uploadedDesignUrl = await cloudinaryService.uploadOriginalDesign(
          finalImagesBase64.design,
          `design_${vendorId || 'unknown'}_${Date.now()}`
        );
        console.log('✅ Design uploadé:', uploadedDesignUrl);
      }

      // ✅ ÉTAPE 2: Upload des mockups avec design incorporé
      const uploadedImages = {};
      const colorImagesKeys = Object.keys(finalImages.colorImages || {});
      
      console.log(`🖼️ Upload de ${colorImagesKeys.length} images produit...`);
      
      for (const colorName of colorImagesKeys) {
        if (finalImagesBase64[colorName]) {
          console.log(`📸 Upload image ${colorName}...`);
          
          const uploadedUrl = await cloudinaryService.uploadProductImage(
            finalImagesBase64[colorName],
            `product_${baseProductId}_${colorName}_${Date.now()}`
          );
          
          uploadedImages[colorName] = {
            ...finalImages.colorImages[colorName],
            imageUrl: uploadedUrl, // URL Cloudinary finale
            originalImageUrl: finalImages.colorImages[colorName].imageUrl // Blob URL original
          };
          
          console.log(`✅ ${colorName} uploadé: ${uploadedUrl}`);
        }
      }

      // ✅ ÉTAPE 3: Création en base de données
      const vendorProduct = new VendorProduct({
        // Références
        baseProductId,
        vendorId: vendorId || req.user?.id,
        
        // Informations vendeur
        vendorName,
        vendorDescription,
        vendorPrice,
        vendorStock: vendorStock || 100,
        basePriceAdmin,
        
        // Design et images
        designUrl: uploadedDesignUrl, // ✅ Design original seul
        mockupImages: uploadedImages, // ✅ Images produit avec design incorporé
        
        // Métadonnées
        selectedSizes,
        selectedColors,
        previewView,
        
        // Statistiques
        totalImages: Object.keys(uploadedImages).length,
        availableColors: Object.keys(uploadedImages),
        
        // Status
        status: 'ACTIVE',
        publishedAt: new Date()
      });

      await vendorProduct.save();

      console.log('✅ Produit vendeur créé:', vendorProduct._id);

      // ✅ RÉPONSE SUCCESS
      res.status(201).json({
        success: true,
        message: 'Produit vendeur créé avec succès',
        productId: vendorProduct._id,
        data: {
          id: vendorProduct._id,
          vendorName: vendorProduct.vendorName,
          designUrl: vendorProduct.designUrl,
          mockupImages: Object.keys(vendorProduct.mockupImages),
          totalImages: vendorProduct.totalImages,
          status: vendorProduct.status
        },
        imagesProcessed: Object.keys(uploadedImages).length
      });

    } catch (error) {
      console.error('❌ Erreur création produit vendeur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création',
        error: error.message
      });
    }
  }

  /**
   * GET /vendor/products - Liste des produits vendeur
   */
  async getVendorProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search
      } = req.query;

      const vendorId = req.user?.id;
      const query = { vendorId };

      if (status) query.status = status;
      if (search) {
        query.$or = [
          { vendorName: { $regex: search, $options: 'i' } },
          { vendorDescription: { $regex: search, $options: 'i' } }
        ];
      }

      const products = await VendorProduct.find(query)
        .populate('baseProductId')
        .sort({ publishedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await VendorProduct.countDocuments(query);

      res.json({
        success: true,
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération produits:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération',
        error: error.message
      });
    }
  }

  /**
   * GET /vendor/stats - Statistiques vendeur
   */
  async getVendorStats(req, res) {
    try {
      const vendorId = req.user?.id;

      const stats = await VendorProduct.aggregate([
        { $match: { vendorId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$vendorPrice' }
          }
        }
      ]);

      const total = await VendorProduct.countDocuments({ vendorId });

      res.json({
        success: true,
        data: {
          total,
          byStatus: stats,
          active: stats.find(s => s._id === 'ACTIVE')?.count || 0,
          inactive: stats.find(s => s._id === 'INACTIVE')?.count || 0,
          pending: stats.find(s => s._id === 'PENDING')?.count || 0
        }
      });

    } catch (error) {
      console.error('❌ Erreur statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul des statistiques',
        error: error.message
      });
    }
  }

  /**
   * GET /vendor/products/:id - Détail produit vendeur
   */
  async getVendorProduct(req, res) {
    try {
      const product = await VendorProduct.findById(req.params.id)
        .populate('baseProductId');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('❌ Erreur récupération produit:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération',
        error: error.message
      });
    }
  }

  /**
   * PATCH /vendor/products/:id - Mise à jour produit
   */
  async updateVendorProduct(req, res) {
    try {
      const updates = req.body;
      const product = await VendorProduct.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Produit mis à jour'
      });

    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour',
        error: error.message
      });
    }
  }

  /**
   * DELETE /vendor/products/:id - Suppression produit
   */
  async deleteVendorProduct(req, res) {
    try {
      const product = await VendorProduct.findByIdAndDelete(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Produit supprimé'
      });

    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression',
        error: error.message
      });
    }
  }

  /**
   * POST /vendor/publish-with-design - Publication avec design haute qualité
   */
  async publishWithDesign(req, res) {
    try {
      // Même logique que createVendorProduct mais avec options haute qualité
      return this.createVendorProduct(req, res);
    } catch (error) {
      console.error('❌ Erreur publication design:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la publication',
        error: error.message
      });
    }
  }
}

module.exports = new VendorController();
```

### 3. Modèle VendorProduct (`models/VendorProduct.js`)

```javascript
/**
 * Modèle VendorProduct - PrintAlma
 * Structure des produits vendeur avec design et images
 */

const mongoose = require('mongoose');

const VendorProductSchema = new mongoose.Schema({
  // Références
  baseProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BaseProduct',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Informations vendeur
  vendorName: {
    type: String,
    required: true,
    maxlength: 200
  },
  vendorDescription: {
    type: String,
    maxlength: 1000
  },
  vendorPrice: {
    type: Number,
    required: true,
    min: 0
  },
  vendorStock: {
    type: Number,
    default: 100,
    min: 0
  },
  basePriceAdmin: {
    type: Number,
    required: true
  },

  // ✅ DESIGN ET IMAGES SÉPARÉS
  designUrl: {
    type: String,
    required: true,
    comment: 'URL Cloudinary du design original seul'
  },
  mockupImages: {
    type: Map,
    of: {
      colorInfo: {
        id: Number,
        name: String,
        colorCode: String
      },
      imageUrl: {
        type: String,
        required: true,
        comment: 'URL Cloudinary du mockup avec design incorporé'
      },
      originalImageUrl: String,
      imageKey: String
    },
    comment: 'Images produit avec design incorporé, clé = nom couleur'
  },

  // Métadonnées
  selectedSizes: [{
    id: Number,
    sizeName: String
  }],
  selectedColors: [{
    id: Number,
    name: String,
    colorCode: String
  }],
  previewView: {
    viewType: String,
    url: String,
    id: Number,
    width: Number,
    height: Number,
    naturalWidth: Number,
    naturalHeight: Number,
    delimitations: Array
  },

  // Statistiques
  totalImages: {
    type: Number,
    default: 0
  },
  availableColors: [String],

  // Status et dates
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED'],
    default: 'ACTIVE'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour les requêtes vendeur
VendorProductSchema.index({ vendorId: 1, status: 1 });
VendorProductSchema.index({ baseProductId: 1 });
VendorProductSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('VendorProduct', VendorProductSchema);
```

### 4. Service Cloudinary (`services/cloudinaryService.js`)

```javascript
/**
 * Service Cloudinary - PrintAlma
 * Upload optimisé pour design et mockups
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {

  /**
   * ✅ Upload design original (haute qualité)
   */
  async uploadOriginalDesign(base64Data, fileName) {
    try {
      console.log('🎨 Upload design original...');
      
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: 'printalma/designs',
        public_id: fileName,
        format: 'png', // ✅ PNG pour transparence
        quality: 100, // ✅ Qualité maximale
        width: 2000,
        height: 2000,
        crop: 'limit', // ✅ Garde les proportions
        flags: 'preserve_transparency'
      });

      console.log('✅ Design uploadé:', result.secure_url);
      return result.secure_url;

    } catch (error) {
      console.error('❌ Erreur upload design:', error);
      throw new Error('Impossible d\'uploader le design: ' + error.message);
    }
  }

  /**
   * ✅ Upload mockup avec design incorporé
   */
  async uploadProductImage(base64Data, fileName) {
    try {
      console.log('📸 Upload mockup produit...');
      
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: 'printalma/products',
        public_id: fileName,
        format: 'webp', // ✅ WebP pour optimisation
        quality: 95, // ✅ Haute qualité
        width: 1000,
        height: 1000,
        crop: 'limit'
      });

      console.log('✅ Mockup uploadé:', result.secure_url);
      return result.secure_url;

    } catch (error) {
      console.error('❌ Erreur upload mockup:', error);
      throw new Error('Impossible d\'uploader le mockup: ' + error.message);
    }
  }

  /**
   * Suppression d'image
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      return false;
    }
  }
}

module.exports = new CloudinaryService();
```

### 5. Middleware d'authentification (`middleware/auth.js`)

```javascript
/**
 * Middleware d'authentification vendeur
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateVendor = async (req, res, next) => {
  try {
    // Récupérer le token depuis les cookies
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que c'est un vendeur actif
    if (user.role !== 'VENDOR' || user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Compte vendeur inactif'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

module.exports = { authenticateVendor };
```

### 6. Configuration App Principal (`app.js` ou `server.js`)

```javascript
// Ajouter les routes vendeur
const vendorRoutes = require('./routes/vendor');

// Configuration middleware
app.use(express.json({ limit: '50mb' })); // ✅ Augmenter limite payload
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/vendor', vendorRoutes); // ✅ Route principale
app.use('/api/vendor', vendorRoutes); // ✅ Route alternative avec /api
```

## 🧪 TEST DE L'IMPLÉMENTATION

Lancez le script de diagnostic :

```bash
node test-vendor-backend-endpoints.cjs
```

## ✅ CHECKLIST D'IMPLÉMENTATION

- [ ] 1. Créer `routes/vendor.js`
- [ ] 2. Créer `controllers/vendorController.js`
- [ ] 3. Créer `models/VendorProduct.js`
- [ ] 4. Créer `services/cloudinaryService.js`
- [ ] 5. Modifier `middleware/auth.js`
- [ ] 6. Modifier `app.js` pour ajouter les routes
- [ ] 7. Configurer variables d'environnement Cloudinary
- [ ] 8. Tester avec le script de diagnostic

## 🔧 VARIABLES D'ENVIRONNEMENT REQUISES

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=your_jwt_secret

# Database
MONGODB_URI=mongodb://localhost:27017/printalma
```

## 📋 STRUCTURE FINALE ATTENDUE

```json
{
  "success": true,
  "message": "Produit vendeur créé avec succès",
  "productId": "64a7b2c3d4e5f6789abc1234",
  "data": {
    "id": "64a7b2c3d4e5f6789abc1234",
    "vendorName": "Mon Produit Personnalisé",
    "designUrl": "https://res.cloudinary.com/.../design_original.png",
    "mockupImages": ["Blanc", "Bleu", "Rouge"],
    "totalImages": 3,
    "status": "ACTIVE"
  },
  "imagesProcessed": 3
}
```

Une fois implémenté, le frontend fonctionnera immédiatement ! 🚀 