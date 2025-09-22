# 🎯 BACKEND - Créer Endpoint Dédié pour Wizard Produit

## 🚨 PROBLÈME ACTUEL

Utiliser `/vendor/products` pour le wizard n'est **PAS logique** car :

❌ **Endpoint actuel** : Créé pour **produits avec design appliqué**
❌ **Wizard** : Créé des **produits simples avec images propres**
❌ **Confusion** : Deux logiques différentes dans le même endpoint
❌ **Maintenance** : Code compliqué avec des conditions partout

---

## 🎯 SOLUTION : Endpoint Dédié

### **Créer `/vendor/wizard-products`**

Un endpoint spécialisé UNIQUEMENT pour les produits wizard.

---

## 📁 STRUCTURE RECOMMANDÉE

### **1. Nouveau endpoint**
```
POST /vendor/wizard-products
```

### **2. Séparation claire**

| Endpoint | Usage | Type Produit |
|----------|-------|-------------|
| `/vendor/products` | Produits avec design | Design appliqué sur mockup |
| `/vendor/wizard-products` | **NOUVEAU** Produits wizard | Images propres, pas de design |

---

## 🚀 IMPLÉMENTATION BACKEND

### **1. Route dédiée**

```javascript
// routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const { createWizardProduct } = require('../controllers/wizardProductController');

// Endpoint dédié pour produits wizard
router.post('/wizard-products', authenticate, createWizardProduct);

module.exports = router;
```

### **2. Contrôleur spécialisé**

```javascript
// controllers/wizardProductController.js
const { AdminProduct, VendorProduct, WizardProductImage } = require('../models');
const { uploadBase64Image } = require('../utils/imageUtils');

const createWizardProduct = async (req, res) => {
  try {
    const {
      baseProductId,
      vendorName,
      vendorDescription,
      vendorPrice,
      vendorStock = 10,
      selectedColors,
      selectedSizes,
      productImages, // { baseImage: "data:image/...", detailImages: [...] }
      forcedStatus = 'DRAFT'
    } = req.body;

    // 1. Validation entrée
    validateWizardInput(req.body);

    // 2. Vérifier mockup existe
    const baseProduct = await AdminProduct.findById(baseProductId);
    if (!baseProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produit de base introuvable'
      });
    }

    // 3. Validation marge 10%
    const minimumPrice = baseProduct.price * 1.1;
    if (vendorPrice < minimumPrice) {
      return res.status(400).json({
        success: false,
        message: `Prix trop bas. Minimum: ${minimumPrice.toFixed(0)} FCFA (marge 10%)`
      });
    }

    // 4. Calculer métadonnées
    const vendorProfit = vendorPrice - baseProduct.price;
    const expectedRevenue = Math.round(vendorProfit * 0.7);
    const platformCommission = Math.round(vendorProfit * 0.3);
    const marginPercentage = ((vendorProfit / baseProduct.price) * 100);

    // 5. Créer produit wizard
    const wizardProduct = await VendorProduct.create({
      vendorId: req.user.id,
      baseProductId: baseProductId,
      name: vendorName,
      description: vendorDescription,
      price: vendorPrice,
      stock: vendorStock,
      status: forcedStatus,
      selectedColors: selectedColors,
      selectedSizes: selectedSizes,

      // Spécifique wizard
      designId: null, // PAS de design
      productType: 'WIZARD', // Type spécial

      // Métadonnées wizard
      wizardMetadata: {
        basePrice: baseProduct.price,
        vendorProfit: vendorProfit,
        expectedRevenue: expectedRevenue,
        platformCommission: platformCommission,
        marginPercentage: marginPercentage.toFixed(2)
      }
    });

    // 6. Traiter images wizard
    const savedImages = await processWizardImages(wizardProduct.id, productImages);

    // 7. Réponse succès
    res.status(201).json({
      success: true,
      message: 'Produit wizard créé avec succès',
      data: {
        id: wizardProduct.id,
        vendorId: wizardProduct.vendorId,
        name: wizardProduct.name,
        description: wizardProduct.description,
        price: wizardProduct.price,
        status: wizardProduct.status,
        productType: 'WIZARD',

        baseProduct: {
          id: baseProduct.id,
          name: baseProduct.name,
          price: baseProduct.price
        },

        calculations: {
          basePrice: baseProduct.price,
          vendorProfit: vendorProfit,
          expectedRevenue: expectedRevenue,
          platformCommission: platformCommission,
          marginPercentage: marginPercentage.toFixed(2)
        },

        selectedColors: selectedColors,
        selectedSizes: selectedSizes,
        images: savedImages,

        wizard: {
          createdViaWizard: true,
          hasDesign: false,
          imageCount: savedImages.length
        },

        createdAt: wizardProduct.createdAt,
        updatedAt: wizardProduct.updatedAt
      }
    });

  } catch (error) {
    console.error('Erreur création produit wizard:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la création du produit wizard'
    });
  }
};

module.exports = { createWizardProduct };
```

### **3. Validation spécialisée**

```javascript
// utils/wizardValidation.js
const validateWizardInput = (data) => {
  const errors = [];

  if (!data.baseProductId) {
    errors.push('baseProductId requis');
  }

  if (!data.vendorName || data.vendorName.trim().length === 0) {
    errors.push('vendorName requis');
  }

  if (!data.vendorDescription || data.vendorDescription.trim().length === 0) {
    errors.push('vendorDescription requis');
  }

  if (!data.vendorPrice || data.vendorPrice <= 0) {
    errors.push('vendorPrice doit être supérieur à 0');
  }

  if (!data.selectedColors || data.selectedColors.length === 0) {
    errors.push('Au moins une couleur doit être sélectionnée');
  }

  if (!data.selectedSizes || data.selectedSizes.length === 0) {
    errors.push('Au moins une taille doit être sélectionnée');
  }

  if (!data.productImages || !data.productImages.baseImage) {
    errors.push('Image principale (baseImage) obligatoire');
  }

  // Validation format base64
  if (data.productImages && data.productImages.baseImage) {
    if (!data.productImages.baseImage.startsWith('data:image/')) {
      errors.push('Format baseImage invalide (doit être base64)');
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
};

module.exports = { validateWizardInput };
```

### **4. Traitement images dédié**

```javascript
// utils/wizardImageProcessor.js
const processWizardImages = async (wizardProductId, productImages) => {
  const savedImages = [];

  try {
    // Image principale (obligatoire)
    if (productImages.baseImage) {
      const baseImageUrl = await uploadBase64Image(
        productImages.baseImage,
        `wizard-product-${wizardProductId}-base`
      );

      const baseImageRecord = await WizardProductImage.create({
        wizardProductId: wizardProductId,
        url: baseImageUrl,
        type: 'BASE',
        isMain: true,
        orderIndex: 0
      });

      savedImages.push({
        id: baseImageRecord.id,
        url: baseImageUrl,
        type: 'BASE',
        isMain: true,
        orderIndex: 0
      });
    }

    // Images de détail (optionnelles)
    if (productImages.detailImages && productImages.detailImages.length > 0) {
      for (let i = 0; i < productImages.detailImages.length; i++) {
        const detailImageUrl = await uploadBase64Image(
          productImages.detailImages[i],
          `wizard-product-${wizardProductId}-detail-${i + 1}`
        );

        const detailImageRecord = await WizardProductImage.create({
          wizardProductId: wizardProductId,
          url: detailImageUrl,
          type: 'DETAIL',
          isMain: false,
          orderIndex: i + 1
        });

        savedImages.push({
          id: detailImageRecord.id,
          url: detailImageUrl,
          type: 'DETAIL',
          isMain: false,
          orderIndex: i + 1
        });
      }
    }

    return savedImages;

  } catch (error) {
    console.error('Erreur traitement images wizard:', error);
    throw new Error('Échec sauvegarde images: ' + error.message);
  }
};

module.exports = { processWizardImages };
```

### **5. Modèle table images wizard**

```javascript
// models/WizardProductImage.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WizardProductImage = sequelize.define('WizardProductImage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    wizardProductId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'VendorProducts',
        key: 'id'
      }
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('BASE', 'DETAIL'),
      allowNull: false
    },
    isMain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'wizard_product_images',
    timestamps: true
  });

  return WizardProductImage;
};
```

---

## 📤 PAYLOAD FRONTEND

Le frontend enverra à `/vendor/wizard-products` :

```json
{
  "baseProductId": 34,
  "vendorName": "Sweat Custom Noir",
  "vendorDescription": "Sweat à capuche personnalisé de qualité",
  "vendorPrice": 10000,
  "vendorStock": 10,
  "selectedColors": [
    {
      "id": 1,
      "name": "Noir",
      "colorCode": "#000000"
    }
  ],
  "selectedSizes": [
    {
      "id": 1,
      "sizeName": "S"
    },
    {
      "id": 2,
      "sizeName": "M"
    }
  ],
  "productImages": {
    "baseImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "detailImages": [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    ]
  },
  "forcedStatus": "DRAFT"
}
```

---

## 📊 RÉPONSE BACKEND

```json
{
  "success": true,
  "message": "Produit wizard créé avec succès",
  "data": {
    "id": 789,
    "vendorId": 123,
    "name": "Sweat Custom Noir",
    "description": "Sweat à capuche personnalisé de qualité",
    "price": 10000,
    "status": "DRAFT",
    "productType": "WIZARD",

    "baseProduct": {
      "id": 34,
      "name": "Sweat à capuche unisexe",
      "price": 6000
    },

    "calculations": {
      "basePrice": 6000,
      "vendorProfit": 4000,
      "expectedRevenue": 2800,
      "platformCommission": 1200,
      "marginPercentage": "66.67"
    },

    "selectedColors": [
      {
        "id": 1,
        "name": "Noir",
        "colorCode": "#000000"
      }
    ],

    "selectedSizes": [
      {
        "id": 1,
        "sizeName": "S"
      },
      {
        "id": 2,
        "sizeName": "M"
      }
    ],

    "images": [
      {
        "id": 456,
        "url": "https://res.cloudinary.com/printma/image/upload/wizard-product-789-base.jpg",
        "type": "BASE",
        "isMain": true,
        "orderIndex": 0
      },
      {
        "id": 457,
        "url": "https://res.cloudinary.com/printma/image/upload/wizard-product-789-detail-1.jpg",
        "type": "DETAIL",
        "isMain": false,
        "orderIndex": 1
      },
      {
        "id": 458,
        "url": "https://res.cloudinary.com/printma/image/upload/wizard-product-789-detail-2.jpg",
        "type": "DETAIL",
        "isMain": false,
        "orderIndex": 2
      }
    ],

    "wizard": {
      "createdViaWizard": true,
      "hasDesign": false,
      "imageCount": 3
    },

    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🧪 TESTS RECOMMANDÉS

### **Test 1: Création réussie**
```bash
curl -X POST http://localhost:3004/vendor/wizard-products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "baseProductId": 34,
    "vendorName": "Test Wizard",
    "vendorDescription": "Test description",
    "vendorPrice": 7000,
    "selectedColors": [{"id": 1, "name": "Noir", "colorCode": "#000000"}],
    "selectedSizes": [{"id": 1, "sizeName": "M"}],
    "productImages": {
      "baseImage": "data:image/png;base64,iVBORw0KGgo..."
    }
  }'
```

**Résultat attendu :** 201 Created

### **Test 2: Prix insuffisant**
```bash
curl -X POST http://localhost:3004/vendor/wizard-products \
  -d '{
    "baseProductId": 34,
    "vendorPrice": 5000,
    ...
  }'
```

**Résultat attendu :** 400 Bad Request, "Prix trop bas. Minimum: 6600 FCFA"

### **Test 3: Mockup inexistant**
```bash
curl -X POST http://localhost:3004/vendor/wizard-products \
  -d '{
    "baseProductId": 999999,
    ...
  }'
```

**Résultat attendu :** 404 Not Found, "Produit de base introuvable"

---

## ✅ AVANTAGES ENDPOINT DÉDIÉ

### **🎯 Clarté**
- Logique wizard séparée
- Code plus maintenant
- Pas de conditions compliquées

### **🚀 Performance**
- Endpoint optimisé pour wizard
- Pas de vérifications inutiles
- Traitement direct des images

### **🔧 Maintenance**
- Modifications wizard indépendantes
- Tests séparés
- Débogage facilité

### **📈 Évolutivité**
- Nouvelles fonctionnalités wizard isolées
- API REST standard
- Documentation claire

---

## 🔄 MIGRATION FRONTEND

Le frontend devra changer l'URL d'appel :

```javascript
// AVANT
fetch('/vendor/products', { ... })

// APRÈS
fetch('/vendor/wizard-products', { ... })
```

Et supprimer tous les champs spécifiques aux designs :
- ❌ `productStructure`
- ❌ `designApplication`
- ❌ `isWizardProduct`
- ❌ `bypassValidation`

---

## 🎯 RÉSULTAT FINAL

✅ **Endpoint dédié** : `/vendor/wizard-products`
✅ **Logique séparée** : Pas de confusion avec produits design
✅ **Images propres** : Sauvegarde directe des images wizard
✅ **Validation spécialisée** : Règles métier wizard
✅ **Réponse claire** : Structure adaptée au wizard
✅ **Maintenance facile** : Code isolé et testable

Le wizard aura son propre endpoint logique et maintenable ! 🎨