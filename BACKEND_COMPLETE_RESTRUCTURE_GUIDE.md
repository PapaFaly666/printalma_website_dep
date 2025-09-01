# 🚀 GUIDE COMPLET : Restructuration Backend Mockups par Couleur

## 📋 **OBJECTIF**

Restructurer complètement la logique backend pour gérer les mockups par couleur, comme dans l'interface `/vendeur/sell-design`, en supprimant les champs `designUrl`, `mockupUrl` et `originalDesignUrl` de la table `VendorProduct`.

## 🗃️ **1. MODIFICATIONS BASE DE DONNÉES**

### **A. Créer la nouvelle table VendorProductMockups**

```sql
-- Créer la table pour les mockups par couleur
CREATE TABLE vendor_product_mockups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_product_id INT NOT NULL,
  color_id INT NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(7) NOT NULL,
  
  -- URLs et métadonnées du mockup
  mockup_url VARCHAR(500) NOT NULL,
  mockup_public_id VARCHAR(255),
  width INT,
  height INT,
  format VARCHAR(10),
  file_size INT,
  
  -- Statut de génération
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generation_status ENUM('GENERATING', 'COMPLETED', 'FAILED') DEFAULT 'GENERATING',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE,
  FOREIGN KEY (color_id) REFERENCES colors(id),
  
  -- Contrainte unique : un seul mockup par produit-couleur
  UNIQUE KEY unique_product_color (vendor_product_id, color_id),
  
  -- Index pour les requêtes fréquentes
  INDEX idx_vendor_product (vendor_product_id),
  INDEX idx_color (color_id),
  INDEX idx_status (generation_status)
);
```

### **B. Modifier la table VendorProduct**

```sql
-- Ajouter la référence au design
ALTER TABLE vendor_products 
ADD COLUMN design_id INT AFTER base_product_id,
ADD FOREIGN KEY (design_id) REFERENCES designs(id);

-- Commenter/préparer la suppression des anciens champs
-- ❌ Ces champs seront supprimés après migration
-- ALTER TABLE vendor_products 
-- DROP COLUMN design_url,
-- DROP COLUMN mockup_url,
-- DROP COLUMN original_design_url;
```

### **C. S'assurer que la table Designs existe**

```sql
-- Table designs (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS designs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  design_name VARCHAR(255),
  
  -- URL du design original (fond transparent)
  original_design_url VARCHAR(500) NOT NULL,
  design_public_id VARCHAR(255),
  
  -- Métadonnées
  width INT,
  height INT,
  format VARCHAR(10),
  file_size INT,
  
  -- Validation
  is_validated BOOLEAN DEFAULT FALSE,
  validation_status ENUM('PENDING', 'VALIDATED', 'REJECTED') DEFAULT 'PENDING',
  validated_at TIMESTAMP NULL,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vendor_id) REFERENCES users(id),
  
  INDEX idx_vendor (vendor_id),
  INDEX idx_validation (validation_status)
);
```

## 🔧 **2. MODIFICATIONS MODÈLES SEQUELIZE**

### **A. Modèle VendorProductMockup (nouveau)**

```javascript
// models/VendorProductMockup.js
module.exports = (sequelize, DataTypes) => {
  const VendorProductMockup = sequelize.define('VendorProductMockup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vendorProductId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'vendor_product_id'
    },
    colorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'color_id'
    },
    colorName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'color_name'
    },
    colorCode: {
      type: DataTypes.STRING(7),
      allowNull: false,
      field: 'color_code'
    },
    mockupUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'mockup_url'
    },
    mockupPublicId: {
      type: DataTypes.STRING(255),
      field: 'mockup_public_id'
    },
    width: DataTypes.INTEGER,
    height: DataTypes.INTEGER,
    format: DataTypes.STRING(10),
    fileSize: {
      type: DataTypes.INTEGER,
      field: 'file_size'
    },
    generatedAt: {
      type: DataTypes.DATE,
      field: 'generated_at'
    },
    generationStatus: {
      type: DataTypes.ENUM('GENERATING', 'COMPLETED', 'FAILED'),
      defaultValue: 'GENERATING',
      field: 'generation_status'
    }
  }, {
    tableName: 'vendor_product_mockups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  VendorProductMockup.associate = (models) => {
    // Association avec VendorProduct
    VendorProductMockup.belongsTo(models.VendorProduct, {
      foreignKey: 'vendorProductId',
      as: 'vendorProduct'
    });
    
    // Association avec Color
    VendorProductMockup.belongsTo(models.Color, {
      foreignKey: 'colorId',
      as: 'color'
    });
  };

  return VendorProductMockup;
};
```

### **B. Modifier le modèle VendorProduct**

```javascript
// models/VendorProduct.js - Ajouter les associations
VendorProduct.associate = (models) => {
  // Associations existantes...
  VendorProduct.belongsTo(models.User, { foreignKey: 'vendorId', as: 'vendor' });
  VendorProduct.belongsTo(models.BaseProduct, { foreignKey: 'baseProductId', as: 'baseProduct' });
  
  // ✅ NOUVELLE : Association avec Design
  VendorProduct.belongsTo(models.Design, { 
    foreignKey: 'designId', 
    as: 'design' 
  });
  
  // ✅ NOUVELLE : Association avec Mockups
  VendorProduct.hasMany(models.VendorProductMockup, {
    foreignKey: 'vendorProductId',
    as: 'mockups'
  });
  
  // Associations existantes pour les couleurs et tailles...
  VendorProduct.belongsToMany(models.Color, {
    through: models.VendorProductSelectedColor,
    foreignKey: 'vendorProductId',
    otherKey: 'colorId',
    as: 'selectedColors'
  });
  
  VendorProduct.belongsToMany(models.Size, {
    through: models.VendorProductSelectedSize,
    foreignKey: 'vendorProductId',
    otherKey: 'sizeId',
    as: 'selectedSizes'
  });
};
```

### **C. Modèle Design (si pas existant)**

```javascript
// models/Design.js
module.exports = (sequelize, DataTypes) => {
  const Design = sequelize.define('Design', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'vendor_id'
    },
    designName: {
      type: DataTypes.STRING(255),
      field: 'design_name'
    },
    originalDesignUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'original_design_url'
    },
    designPublicId: {
      type: DataTypes.STRING(255),
      field: 'design_public_id'
    },
    width: DataTypes.INTEGER,
    height: DataTypes.INTEGER,
    format: DataTypes.STRING(10),
    fileSize: {
      type: DataTypes.INTEGER,
      field: 'file_size'
    },
    isValidated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_validated'
    },
    validationStatus: {
      type: DataTypes.ENUM('PENDING', 'VALIDATED', 'REJECTED'),
      defaultValue: 'PENDING',
      field: 'validation_status'
    },
    validatedAt: {
      type: DataTypes.DATE,
      field: 'validated_at'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      field: 'rejection_reason'
    }
  }, {
    tableName: 'designs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Design.associate = (models) => {
    Design.belongsTo(models.User, { foreignKey: 'vendorId', as: 'vendor' });
    Design.hasMany(models.VendorProduct, { foreignKey: 'designId', as: 'vendorProducts' });
  };

  return Design;
};
```

## 🎯 **3. NOUVEAU CONTRÔLEUR VENDOR PRODUCTS**

```javascript
// controllers/vendorController.js
const { VendorProduct, BaseProduct, Category, User, Color, Size, Design, VendorProductMockup } = require('../models');

const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Construire les conditions de recherche
    const whereConditions = { vendorId };
    if (status) {
      whereConditions.status = status;
    }
    if (search) {
      whereConditions.vendorName = { [Op.iLike]: `%${search}%` };
    }

    // ✅ NOUVELLE REQUÊTE avec associations mockups et design
    const { count, rows: products } = await VendorProduct.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: BaseProduct,
          as: 'baseProduct',
          include: [
            {
              model: Category,
              as: 'categories'
            }
          ]
        },
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'firstName', 'lastName', 'email', 'vendeurType', 'phone', 'country']
        },
        {
          model: Design,
          as: 'design',
          attributes: ['id', 'originalDesignUrl', 'designPublicId', 'isValidated', 'validationStatus', 'validatedAt', 'rejectionReason']
        },
        {
          model: Color,
          as: 'selectedColors',
          attributes: ['id', 'name', 'colorCode'],
          through: { attributes: [] }
        },
        {
          model: Size,
          as: 'selectedSizes',
          attributes: ['id', 'sizeName'],
          through: { attributes: [] }
        },
        {
          model: VendorProductMockup,
          as: 'mockups',
          attributes: ['id', 'colorId', 'colorName', 'colorCode', 'mockupUrl', 'mockupPublicId', 'width', 'height', 'format', 'generationStatus', 'generatedAt']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // ✅ FORMATER LA RÉPONSE avec la nouvelle structure
    const formattedProducts = products.map(product => {
      const productData = product.toJSON();
      
      // Calculer l'URL du mockup principal (premier mockup disponible)
      const primaryMockup = productData.mockups && productData.mockups.length > 0 
        ? productData.mockups[0] 
        : null;
      
      return {
        ...productData,
        primaryMockupUrl: primaryMockup?.mockupUrl || null,
        // ✅ Garder la compatibilité temporaire (à supprimer plus tard)
        designUrl: productData.design?.originalDesignUrl || null,
        mockupUrl: primaryMockup?.mockupUrl || null
      };
    });

    // Pagination
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          total: count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          page: parseInt(page),
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur getVendorProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: error.message
    });
  }
};
```

## 🏭 **4. SERVICE DE GÉNÉRATION DE MOCKUPS**

```javascript
// services/MockupGenerationService.js
const cloudinary = require('cloudinary').v2;
const { VendorProductMockup, VendorProduct, Design, Color } = require('../models');

class MockupGenerationService {
  
  /**
   * Générer tous les mockups pour un produit vendeur
   */
  async generateMockupsForProduct(vendorProductId) {
    try {
      console.log(`🎨 Génération des mockups pour le produit ${vendorProductId}`);
      
      // Récupérer le produit avec design et couleurs
      const vendorProduct = await VendorProduct.findByPk(vendorProductId, {
        include: [
          { model: Design, as: 'design' },
          { model: Color, as: 'selectedColors', through: { attributes: [] } }
        ]
      });
      
      if (!vendorProduct) {
        throw new Error(`Produit vendeur ${vendorProductId} introuvable`);
      }
      
      if (!vendorProduct.design) {
        throw new Error(`Aucun design associé au produit ${vendorProductId}`);
      }
      
      const results = [];
      
      // Générer un mockup pour chaque couleur sélectionnée
      for (const color of vendorProduct.selectedColors) {
        try {
          const mockupResult = await this.generateMockupForColor(
            vendorProduct,
            vendorProduct.design,
            color
          );
          results.push(mockupResult);
        } catch (error) {
          console.error(`❌ Erreur génération mockup ${vendorProductId}-${color.id}:`, error);
          // Enregistrer l'échec mais continuer avec les autres couleurs
          await this.recordFailedMockup(vendorProductId, color, error.message);
        }
      }
      
      console.log(`✅ Génération terminée: ${results.length} mockups créés`);
      return results;
      
    } catch (error) {
      console.error('❌ Erreur génération mockups:', error);
      throw error;
    }
  }
  
  /**
   * Générer un mockup pour une couleur spécifique
   */
  async generateMockupForColor(vendorProduct, design, color) {
    // Marquer comme en cours de génération
    const mockupRecord = await VendorProductMockup.upsert({
      vendorProductId: vendorProduct.id,
      colorId: color.id,
      colorName: color.name,
      colorCode: color.colorCode,
      mockupUrl: '', // Temporaire
      generationStatus: 'GENERATING',
      generatedAt: new Date()
    });
    
    try {
      // Générer l'URL du mockup avec l'API de délimitation
      const mockupUrl = await this.generateMockupImage(
        design.originalDesignUrl,
        vendorProduct.baseProduct.type,
        color.colorCode
      );
      
      // Uploader sur Cloudinary si nécessaire
      const cloudinaryResult = await this.uploadMockupToCloudinary(
        mockupUrl,
        `mockup_${vendorProduct.id}_${color.id}`
      );
      
      // Mettre à jour l'enregistrement avec le résultat
      const updatedMockup = await VendorProductMockup.upsert({
        vendorProductId: vendorProduct.id,
        colorId: color.id,
        colorName: color.name,
        colorCode: color.colorCode,
        mockupUrl: cloudinaryResult.secure_url,
        mockupPublicId: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        fileSize: cloudinaryResult.bytes,
        generationStatus: 'COMPLETED',
        generatedAt: new Date()
      });
      
      return updatedMockup;
      
    } catch (error) {
      // Marquer comme échoué
      await VendorProductMockup.update(
        { generationStatus: 'FAILED' },
        { 
          where: { 
            vendorProductId: vendorProduct.id, 
            colorId: color.id 
          } 
        }
      );
      throw error;
    }
  }
  
  /**
   * Générer l'image de mockup via votre API de délimitation
   */
  async generateMockupImage(designUrl, productType, colorCode) {
    // TODO: Remplacer par votre logique de génération de mockup
    // Exemple d'appel à votre API existante
    const mockupApiUrl = `${process.env.MOCKUP_API_URL}/generate`;
    
    const response = await fetch(mockupApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        designUrl,
        productType,
        colorCode,
        outputFormat: 'jpg'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API mockup: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.mockupUrl;
  }
  
  /**
   * Uploader le mockup sur Cloudinary
   */
  async uploadMockupToCloudinary(imageUrl, publicId) {
    return await cloudinary.uploader.upload(imageUrl, {
      public_id: `vendor-mockups/${publicId}`,
      folder: 'vendor-mockups',
      overwrite: true,
      format: 'jpg',
      quality: 'auto'
    });
  }
  
  /**
   * Enregistrer un mockup échoué
   */
  async recordFailedMockup(vendorProductId, color, errorMessage) {
    return await VendorProductMockup.upsert({
      vendorProductId,
      colorId: color.id,
      colorName: color.name,
      colorCode: color.colorCode,
      mockupUrl: '',
      generationStatus: 'FAILED',
      generatedAt: new Date()
    });
  }
}

module.exports = new MockupGenerationService();
```

## 🔄 **5. ENDPOINT DE CRÉATION/MISE À JOUR PRODUIT**

```javascript
// controllers/vendorController.js
const MockupGenerationService = require('../services/MockupGenerationService');

const createVendorProduct = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      baseProductId,
      designId,
      vendorName,
      vendorDescription,
      price,
      vendorStock,
      selectedSizes,
      selectedColors
    } = req.body;
    
    const vendorId = req.user.id;
    
    // Valider que le design existe et appartient au vendeur
    const design = await Design.findOne({
      where: { id: designId, vendorId }
    });
    
    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design introuvable ou non autorisé'
      });
    }
    
    // ✅ CRÉER LE PRODUIT avec designId au lieu des URLs
    const vendorProduct = await VendorProduct.create({
      vendorId,
      baseProductId,
      designId,  // ✅ Nouvelle référence
      vendorName,
      vendorDescription,
      price,
      vendorStock,
      status: 'DRAFT',
      isValidated: design.isValidated,
      designValidationStatus: design.validationStatus
    }, { transaction });
    
    // Associer les tailles et couleurs sélectionnées
    if (selectedSizes?.length > 0) {
      await vendorProduct.setSelectedSizes(selectedSizes, { transaction });
    }
    
    if (selectedColors?.length > 0) {
      await vendorProduct.setSelectedColors(selectedColors, { transaction });
    }
    
    await transaction.commit();
    
    // ✅ GÉNÉRER LES MOCKUPS EN ARRIÈRE-PLAN
    // Ne pas attendre la génération pour ne pas bloquer la réponse
    MockupGenerationService.generateMockupsForProduct(vendorProduct.id)
      .catch(error => {
        console.error('❌ Erreur génération mockups en arrière-plan:', error);
      });
    
    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès. Génération des mockups en cours...',
      data: {
        vendorProduct,
        mockupGenerationStatus: 'STARTED'
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erreur création produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit',
      error: error.message
    });
  }
};
```

## 📊 **6. SCRIPT DE MIGRATION DES DONNÉES**

```javascript
// scripts/migrateMockupsData.js
const { VendorProduct, VendorProductMockup, Color } = require('../models');
const MockupGenerationService = require('../services/MockupGenerationService');

async function migrateMockupsData() {
  try {
    console.log('🔄 Début migration des données mockups...');
    
    // Récupérer tous les produits avec des mockupUrl existants
    const productsWithMockups = await VendorProduct.findAll({
      where: {
        mockupUrl: { [Op.ne]: null }
      },
      include: [
        { model: Color, as: 'selectedColors', through: { attributes: [] } }
      ]
    });
    
    console.log(`📊 ${productsWithMockups.length} produits à migrer`);
    
    for (const product of productsWithMockups) {
      try {
        // Si le produit a une URL de mockup mais pas de mockups dans la nouvelle table
        const existingMockups = await VendorProductMockup.count({
          where: { vendorProductId: product.id }
        });
        
        if (existingMockups === 0 && product.selectedColors.length > 0) {
          // Créer un mockup pour la première couleur avec l'URL existante
          const firstColor = product.selectedColors[0];
          
          await VendorProductMockup.create({
            vendorProductId: product.id,
            colorId: firstColor.id,
            colorName: firstColor.name,
            colorCode: firstColor.colorCode,
            mockupUrl: product.mockupUrl,
            generationStatus: 'COMPLETED',
            generatedAt: product.updatedAt
          });
          
          // Générer les mockups pour les autres couleurs
          if (product.selectedColors.length > 1) {
            await MockupGenerationService.generateMockupsForProduct(product.id);
          }
          
          console.log(`✅ Migré produit ${product.id}`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur migration produit ${product.id}:`, error);
      }
    }
    
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  migrateMockupsData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrateMockupsData;
```

## 🧪 **7. TESTS**

```javascript
// tests/vendorProducts.test.js
const request = require('supertest');
const app = require('../app');
const { VendorProduct, VendorProductMockup, Design } = require('../models');

describe('Vendor Products - New Mockup Structure', () => {
  
  test('should create product with design reference', async () => {
    const productData = {
      baseProductId: 1,
      designId: 123,  // ✅ Nouvelle référence
      vendorName: 'Test Product',
      price: 25.99,
      selectedColors: [1, 2, 3],
      selectedSizes: [1, 2]
    };
    
    const response = await request(app)
      .post('/api/vendor/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send(productData);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.vendorProduct.designId).toBe(123);
  });
  
  test('should return products with mockups by color', async () => {
    const response = await request(app)
      .get('/api/vendor/products')
      .set('Authorization', `Bearer ${vendorToken}`);
    
    expect(response.status).toBe(200);
    
    const products = response.body.data.products;
    expect(Array.isArray(products)).toBe(true);
    
    products.forEach(product => {
      // Vérifier la nouvelle structure
      expect(product).toHaveProperty('designId');
      expect(product).toHaveProperty('mockups');
      expect(Array.isArray(product.mockups)).toBe(true);
      
      // Chaque mockup doit avoir les bonnes propriétés
      product.mockups.forEach(mockup => {
        expect(mockup).toHaveProperty('colorId');
        expect(mockup).toHaveProperty('colorName');
        expect(mockup).toHaveProperty('mockupUrl');
        expect(mockup).toHaveProperty('generationStatus');
      });
    });
  });
});
```

## 🚀 **8. PLAN DE DÉPLOIEMENT**

### **Phase 1 : Préparation (1-2 jours)**
1. ✅ Créer les nouvelles tables (vendor_product_mockups)
2. ✅ Ajouter la colonne design_id 
3. ✅ Créer les nouveaux modèles Sequelize
4. ✅ Tester en développement

### **Phase 2 : Migration parallèle (2-3 jours)**
1. ✅ Déployer les nouveaux endpoints en conservant les anciens
2. ✅ Migrer les données existantes
3. ✅ Générer les mockups manquants
4. ✅ Tester l'intégration frontend

### **Phase 3 : Bascule (1 jour)**
1. ✅ Basculer le frontend vers les nouveaux endpoints
2. ✅ Supprimer les anciens champs (design_url, mockup_url, original_design_url)
3. ✅ Nettoyer le code legacy

### **Phase 4 : Optimisation (1 jour)**
1. ✅ Optimiser les performances
2. ✅ Ajouter le cache si nécessaire
3. ✅ Monitoring et alertes

## ✅ **RÉSULTAT ATTENDU**

Après cette restructuration :
- ✅ Chaque produit a une référence vers un design unique
- ✅ Chaque couleur a son propre mockup généré
- ✅ Structure identique à `/vendeur/sell-design`
- ✅ Pas de mélange d'images entre produits
- ✅ Performance optimisée avec requêtes spécifiques
- ✅ Évolutivité pour d'autres types de mockups 