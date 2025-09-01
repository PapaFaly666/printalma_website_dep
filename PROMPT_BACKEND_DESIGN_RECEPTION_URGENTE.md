# 🚨 PROMPT BACKEND URGENT - Réception Design Frontend

## 📋 CONTEXTE
Le frontend PrintAlma envoie maintenant le design original ET les mockups en base64 dans une structure spécifique. Le backend doit être adapté pour recevoir et traiter ces données correctement.

## 🎯 STRUCTURE REÇUE PAR LE BACKEND

### Payload Frontend → Backend
```json
{
  "baseProductId": 1,
  "vendorName": "Mon Produit",
  "vendorPrice": 25000,
  "vendorDescription": "Description",
  "vendorStock": 10,
  
  "designUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  
  "finalImagesBase64": {
    "design": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "blanc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "noir": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "rouge": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  },
  
  "selectedColors": [
    { "id": 1, "name": "blanc", "colorCode": "#FFFFFF" },
    { "id": 2, "name": "noir", "colorCode": "#000000" },
    { "id": 3, "name": "rouge", "colorCode": "#FF0000" }
  ],
  
  "selectedSizes": [
    { "id": 1, "sizeName": "S" },
    { "id": 2, "sizeName": "M" },
    { "id": 3, "sizeName": "L" }
  ],
  
  "basePriceAdmin": 15000,
  "publishedAt": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 CORRECTIONS BACKEND REQUISES

### 1. CONFIGURATION EXPRESS (URGENT)
```javascript
// app.js ou server.js
const express = require('express');
const app = express();

// ✅ AUGMENTER LES LIMITES (obligatoire)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

console.log('✅ Limites Express configurées: 50mb');
```

### 2. CONTROLLER VENDEUR (À CORRIGER)
```javascript
// controllers/vendorController.js
exports.createVendorProduct = async (req, res) => {
  try {
    console.log('🔍 === RÉCEPTION DONNÉES FRONTEND ===');
    
    // ✅ EXTRACTION CORRECTE DES DONNÉES
    const {
      baseProductId,
      vendorName,
      vendorPrice,
      vendorDescription,
      vendorStock,
      designUrl,              // ← Design original en base64
      finalImagesBase64,      // ← Mockups + design en base64
      selectedColors,
      selectedSizes,
      basePriceAdmin,
      publishedAt
    } = req.body;
    
    // ✅ VALIDATION DESIGN
    if (!designUrl || !designUrl.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'Design original manquant ou format invalide',
        received: { designUrl: designUrl ? 'présent' : 'absent' }
      });
    }
    
    // ✅ VALIDATION FINALIMAGESBASE64
    if (!finalImagesBase64 || typeof finalImagesBase64 !== 'object') {
      return res.status(400).json({
        error: 'finalImagesBase64 manquant ou format invalide',
        received: Object.keys(req.body)
      });
    }
    
    // ✅ VÉRIFICATION DESIGN DANS FINALIMAGESBASE64
    if (!finalImagesBase64.design) {
      return res.status(400).json({
        error: 'Design original manquant dans finalImagesBase64',
        received: Object.keys(finalImagesBase64)
      });
    }
    
    console.log('✅ Validation réussie:', {
      designUrl: 'Présent (' + Math.round(designUrl.length / 1024) + 'KB)',
      finalImagesKeys: Object.keys(finalImagesBase64),
      colorsCount: selectedColors?.length || 0,
      sizesCount: selectedSizes?.length || 0
    });
    
    // ✅ UPLOAD DESIGN ORIGINAL (100% qualité)
    console.log('🎨 Upload du design original...');
    const designCloudinaryResult = await cloudinaryService.uploadOriginalDesign(
      finalImagesBase64.design,  // ← Design en base64
      `design_${Date.now()}`
    );
    
    // ✅ UPLOAD MOCKUPS PAR COULEUR
    console.log('🖼️ Upload des mockups par couleur...');
    const mockupUrls = {};
    
    for (const [colorName, imageBase64] of Object.entries(finalImagesBase64)) {
      if (colorName === 'design') continue; // Skip le design original
      
      console.log(`📝 Upload mockup ${colorName}...`);
      const mockupResult = await cloudinaryService.uploadProductImage(
        imageBase64,
        `mockup_${baseProductId}_${colorName}_${Date.now()}`
      );
      mockupUrls[colorName] = mockupResult.secure_url;
      console.log(`✅ Mockup ${colorName} uploadé`);
    }
    
    // ✅ SAUVEGARDE EN BASE DE DONNÉES
    const vendorProduct = await VendorProduct.create({
      baseProductId,
      vendorName,
      vendorPrice,
      vendorDescription,
      vendorStock,
      
      // ✅ DESIGN ORIGINAL SEUL
      designUrl: designCloudinaryResult.secure_url,
      
      // ✅ MOCKUPS AVEC DESIGN INCORPORÉ
      mockupImages: JSON.stringify(mockupUrls),
      
      selectedColors: JSON.stringify(selectedColors),
      selectedSizes: JSON.stringify(selectedSizes),
      basePriceAdmin,
      publishedAt: new Date(publishedAt),
      
      status: 'ACTIVE',
      createdAt: new Date()
    });
    
    console.log('✅ Produit vendeur créé:', vendorProduct.id);
    
    // ✅ RÉPONSE SUCCÈS
    res.status(201).json({
      success: true,
      productId: vendorProduct.id,
      message: 'Produit publié avec succès',
      originalDesign: {
        designUrl: designCloudinaryResult.secure_url
      },
      mockupImages: mockupUrls,
      imagesProcessed: Object.keys(finalImagesBase64).length
    });
    
  } catch (error) {
    console.error('❌ Erreur création produit vendeur:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
};
```

### 3. SERVICE CLOUDINARY (À CRÉER/MODIFIER)
```javascript
// services/cloudinaryService.js
const cloudinary = require('cloudinary').v2;

class CloudinaryService {
  
  /**
   * ✅ Upload du design original en 100% qualité
   */
  async uploadOriginalDesign(base64Data, filename) {
    try {
      console.log('🎨 Upload design original en haute qualité...');
      
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: 'printalma/designs-originals',
        public_id: filename,
        resource_type: 'image',
        
        // ✅ QUALITÉ MAXIMALE POUR LE DESIGN
        quality: 100,
        format: 'png',
        width: 2000,
        height: 2000,
        crop: 'limit',
        flags: 'preserve_transparency'
      });
      
      console.log('✅ Design original uploadé:', result.secure_url);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur upload design:', error);
      throw new Error('Impossible d\'uploader le design original');
    }
  }
  
  /**
   * ✅ Upload des mockups avec design incorporé
   */
  async uploadProductImage(base64Data, filename) {
    try {
      console.log('🖼️ Upload mockup produit...');
      
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: 'printalma/products-mockups',
        public_id: filename,
        resource_type: 'image',
        
        // ✅ QUALITÉ OPTIMISÉE POUR LES MOCKUPS
        quality: 95,
        format: 'webp',
        width: 1500,
        height: 1500,
        crop: 'limit'
      });
      
      console.log('✅ Mockup uploadé:', result.secure_url);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur upload mockup:', error);
      throw new Error('Impossible d\'uploader le mockup');
    }
  }
}

module.exports = new CloudinaryService();
```

### 4. MODÈLE BASE DE DONNÉES (À MODIFIER)
```sql
-- Migration pour la table vendor_products
ALTER TABLE vendor_products 
ADD COLUMN design_url VARCHAR(500) COMMENT 'URL Cloudinary du design original seul',
ADD COLUMN mockup_images JSON COMMENT 'URLs des mockups avec design incorporé par couleur',
MODIFY COLUMN selected_colors JSON COMMENT 'Couleurs sélectionnées avec IDs et codes',
MODIFY COLUMN selected_sizes JSON COMMENT 'Tailles sélectionnées avec IDs';
```

### 5. ROUTE ENDPOINT (À VÉRIFIER)
```javascript
// routes/vendor.js
const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ ENDPOINT CORRECT (utilisé par le frontend)
router.post('/products', authMiddleware.verifyVendor, vendorController.createVendorProduct);

module.exports = router;

// Dans app.js
app.use('/api/vendor', require('./routes/vendor'));
```

## 🧪 TEST BACKEND

### Script de Test
```javascript
// test-backend-reception.js
const fetch = require('node-fetch');

const testReception = async () => {
  const testPayload = {
    baseProductId: 1,
    vendorName: 'Test Backend Reception',
    vendorPrice: 25000,
    designUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg==',
    finalImagesBase64: {
      'design': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg==',
      'blanc': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg=='
    },
    selectedColors: [{ id: 1, name: 'blanc', colorCode: '#FFFFFF' }],
    selectedSizes: [{ id: 1, sizeName: 'M' }],
    basePriceAdmin: 15000
  };
  
  try {
    const response = await fetch('http://localhost:3004/api/vendor/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Erreur test:', error);
  }
};

testReception();
```

## 📋 CHECKLIST BACKEND

### Configuration ✅
- [ ] Limites Express augmentées à 50mb
- [ ] Cloudinary configuré avec les bonnes credentials
- [ ] Base de données avec colonnes design_url et mockup_images

### Controller ✅  
- [ ] Extraction correcte de req.body.designUrl
- [ ] Extraction correcte de req.body.finalImagesBase64
- [ ] Validation présence design dans finalImagesBase64.design
- [ ] Upload design original en qualité 100%
- [ ] Upload mockups en qualité optimisée
- [ ] Sauvegarde URLs séparées (design vs mockups)

### Tests ✅
- [ ] Script de test fonctionnel
- [ ] Logs backend visibles et corrects
- [ ] Réponse 201 avec productId
- [ ] Images visibles sur Cloudinary

## 🎯 RÉSULTAT ATTENDU

### Logs Backend Corrects
```
🔍 === RÉCEPTION DONNÉES FRONTEND ===
✅ Validation réussie: { designUrl: 'Présent (15KB)', finalImagesKeys: ['design', 'blanc', 'noir'] }
🎨 Upload du design original...
✅ Design original uploadé: https://cloudinary.com/designs-originals/design_123.png
🖼️ Upload des mockups par couleur...
✅ Mockup blanc uploadé: https://cloudinary.com/products-mockups/mockup_1_blanc_123.webp
✅ Produit vendeur créé: 123
```

### Réponse API Correcte
```json
{
  "success": true,
  "productId": 123,
  "message": "Produit publié avec succès",
  "originalDesign": {
    "designUrl": "https://cloudinary.com/designs-originals/design_123.png"
  },
  "mockupImages": {
    "blanc": "https://cloudinary.com/products-mockups/mockup_1_blanc_123.webp",
    "noir": "https://cloudinary.com/products-mockups/mockup_1_noir_123.webp"
  },
  "imagesProcessed": 3
}
```

---

*🚨 **URGENT :** Ces corrections sont nécessaires pour que le backend puisse recevoir et traiter correctement le design et les mockups envoyés par le frontend !* 