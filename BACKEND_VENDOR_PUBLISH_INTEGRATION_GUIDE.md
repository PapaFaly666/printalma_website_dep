# Guide d'Intégration Backend - Publication Vendeur avec Images Multi-Couleurs

## 📋 Vue d'ensemble

Le frontend envoie maintenant des données complètes pour chaque produit avec **toutes les images de couleurs générées automatiquement**. Ce guide détaille l'implémentation backend nécessaire.

## 🎯 Endpoint Principal

```javascript
POST /api/vendor/publish
Content-Type: application/json
Authentication: Bearer token ou session vendeur
```

## 📊 Structure des Données Reçues

### Payload Principal
```json
{
  "baseProductId": 123,
  "designUrl": "blob:http://localhost:5173/abc123-def456-ghi789",
  "designFile": {
    "name": "mon_design.png",
    "size": 245760,
    "type": "image/png"
  },
  "finalImages": {
    "colorImages": {
      "Rouge": {
        "colorInfo": {
          "id": 12,
          "name": "Rouge",
          "colorCode": "#ff0000"
        },
        "imageUrl": "blob:http://localhost:5173/image-rouge-abc123",
        "imageKey": "123_12"
      },
      "Vert": {
        "colorInfo": {
          "id": 13,
          "name": "Vert", 
          "colorCode": "#00ff00"
        },
        "imageUrl": "blob:http://localhost:5173/image-vert-def456",
        "imageKey": "123_13"
      },
      "Noir": {
        "colorInfo": {
          "id": 14,
          "name": "Noir",
          "colorCode": "#000000"
        },
        "imageUrl": "blob:http://localhost:5173/image-noir-ghi789",
        "imageKey": "123_14"
      }
    },
    "defaultImage": {
      "imageUrl": "blob:http://localhost:5173/image-default-jkl012",
      "imageKey": "123_default"
    },
    "statistics": {
      "totalColorImages": 3,
      "hasDefaultImage": true,
      "availableColors": ["Rouge", "Vert", "Noir"],
      "totalImagesGenerated": 4
    }
  },
  "vendorPrice": 15000,
  "vendorName": "T-shirt Rouge Flamme Design",
  "vendorDescription": "Magnifique t-shirt avec design flamme personnalisé",
  "vendorStock": 50,
  "basePriceAdmin": 12000,
  "selectedSizes": [
    {"id": 1, "sizeName": "S"},
    {"id": 2, "sizeName": "M"},
    {"id": 3, "sizeName": "L"}
  ],
  "selectedColors": [
    {"id": 12, "name": "Rouge", "colorCode": "#ff0000"},
    {"id": 13, "name": "Vert", "colorCode": "#00ff00"},
    {"id": 14, "name": "Noir", "colorCode": "#000000"}
  ],
  "previewView": {
    "viewType": "FRONT",
    "url": "https://api.printalma.com/products/123/views/front-rouge.jpg",
    "delimitations": [
      {
        "x": 150,
        "y": 200,
        "width": 100,
        "height": 100,
        "coordinateType": "PIXEL"
      }
    ]
  },
  "publishedAt": "2024-01-15T10:30:00.000Z",
  "vendorId": 456
}
```

## 🏗️ Implémentation Backend Recommandée

### 1. Contrôleur Principal

```javascript
// controllers/vendorController.js
const publishProduct = async (req, res) => {
  try {
    const vendorId = req.user.id; // depuis l'auth middleware
    const productData = req.body;
    
    console.log('📦 Réception données vendeur:', {
      vendorId,
      baseProductId: productData.baseProductId,
      totalImages: productData.finalImages.statistics.totalImagesGenerated
    });

    // 1. Validation des données
    const validation = await validateProductData(productData, vendorId);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validation.errors
      });
    }

    // 2. Traitement des images (étape critique)
    const processedImages = await processAllProductImages(productData.finalImages);
    
    // 3. Création du produit vendeur
    const vendorProduct = await createVendorProduct({
      ...productData,
      vendorId,
      processedImages
    });

    // 4. Indexation pour recherche
    await indexProductForSearch(vendorProduct);

    res.json({
      success: true,
      productId: vendorProduct.id,
      message: 'Produit publié avec succès',
      imagesProcessed: processedImages.length
    });

  } catch (error) {
    console.error('❌ Erreur publication vendeur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la publication'
    });
  }
};
```

### 2. Traitement des Images Multi-Couleurs

```javascript
// services/imageService.js
const processAllProductImages = async (finalImages) => {
  const processedImages = [];
  
  console.log('🎨 Traitement de', finalImages.statistics.totalImagesGenerated, 'images');
  
  // Traiter les images de couleurs
  for (const [colorName, imageData] of Object.entries(finalImages.colorImages)) {
    console.log(`🖼️ Traitement image couleur: ${colorName}`);
    
    try {
      // Télécharger l'image depuis le blob URL
      const imageBuffer = await downloadBlobImage(imageData.imageUrl);
      
      // Uploader vers le stockage (S3, Cloudinary, etc.)
      const uploadResult = await uploadToStorage(imageBuffer, {
        folder: 'vendor-products',
        filename: `product_${imageData.imageKey}_${colorName.toLowerCase()}`,
        colorInfo: imageData.colorInfo
      });
      
      processedImages.push({
        type: 'color',
        colorName: colorName,
        colorId: imageData.colorInfo.id,
        colorCode: imageData.colorInfo.colorCode,
        originalUrl: imageData.imageUrl,
        storedUrl: uploadResult.secure_url,
        imageKey: imageData.imageKey,
        uploadedAt: new Date()
      });
      
      console.log(`✅ Image ${colorName} uploadée:`, uploadResult.secure_url);
      
    } catch (error) {
      console.error(`❌ Erreur traitement image ${colorName}:`, error);
      throw new Error(`Erreur traitement image couleur ${colorName}`);
    }
  }
  
  // Traiter l'image par défaut si elle existe
  if (finalImages.defaultImage) {
    console.log('🖼️ Traitement image par défaut');
    
    try {
      const imageBuffer = await downloadBlobImage(finalImages.defaultImage.imageUrl);
      const uploadResult = await uploadToStorage(imageBuffer, {
        folder: 'vendor-products',
        filename: `product_${finalImages.defaultImage.imageKey}_default`
      });
      
      processedImages.push({
        type: 'default',
        originalUrl: finalImages.defaultImage.imageUrl,
        storedUrl: uploadResult.secure_url,
        imageKey: finalImages.defaultImage.imageKey,
        uploadedAt: new Date()
      });
      
      console.log('✅ Image par défaut uploadée:', uploadResult.secure_url);
      
    } catch (error) {
      console.error('❌ Erreur traitement image par défaut:', error);
      throw new Error('Erreur traitement image par défaut');
    }
  }
  
  console.log(`🎉 ${processedImages.length} images traitées avec succès`);
  return processedImages;
};

// Fonction pour télécharger une image depuis un blob URL
const downloadBlobImage = async (blobUrl) => {
  // Note: En production, le frontend devra envoyer l'image en base64 ou FormData
  // car les blob URLs ne sont pas accessibles depuis le serveur
  console.log('⚠️ ATTENTION: Blob URL détecté, conversion nécessaire côté frontend');
  
  // Pour le moment, simulation
  throw new Error('Blob URL non accessible depuis le serveur - conversion frontend requise');
};
```

### 3. Modèle de Base de Données

```sql
-- Table des produits vendeur
CREATE TABLE vendor_products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vendor_id BIGINT NOT NULL,
  base_product_id BIGINT NOT NULL,
  
  -- Informations vendeur
  vendor_name VARCHAR(255) NOT NULL,
  vendor_description TEXT,
  vendor_price DECIMAL(10,2) NOT NULL,
  vendor_stock INT DEFAULT 0,
  
  -- Prix de référence admin
  base_price_admin DECIMAL(10,2) NOT NULL,
  
  -- Design appliqué
  design_url TEXT,
  design_filename VARCHAR(255),
  
  -- Métadonnées
  preview_view JSON,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('DRAFT', 'PUBLISHED', 'SUSPENDED') DEFAULT 'PUBLISHED',
  
  -- Index
  INDEX idx_vendor (vendor_id),
  INDEX idx_base_product (base_product_id),
  INDEX idx_status (status),
  
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (base_product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Table des images de couleurs
CREATE TABLE vendor_product_color_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vendor_product_id BIGINT NOT NULL,
  
  -- Informations couleur
  color_id BIGINT,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(7) NOT NULL,
  
  -- Image
  image_url TEXT NOT NULL,
  image_key VARCHAR(100),
  image_type ENUM('color', 'default') DEFAULT 'color',
  
  -- Métadonnées
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_size INT,
  
  -- Index
  INDEX idx_vendor_product (vendor_product_id),
  INDEX idx_color (color_id),
  INDEX idx_type (image_type),
  
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE
);

-- Table des tailles sélectionnées
CREATE TABLE vendor_product_sizes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vendor_product_id BIGINT NOT NULL,
  size_id BIGINT NOT NULL,
  size_name VARCHAR(50) NOT NULL,
  
  INDEX idx_vendor_product (vendor_product_id),
  INDEX idx_size (size_id),
  
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE
);

-- Table des couleurs sélectionnées  
CREATE TABLE vendor_product_colors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  vendor_product_id BIGINT NOT NULL,
  color_id BIGINT NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(7) NOT NULL,
  
  INDEX idx_vendor_product (vendor_product_id),
  INDEX idx_color (color_id),
  
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE
);
```

### 4. Service de Création Produit

```javascript
// services/vendorProductService.js
const createVendorProduct = async (productData) => {
  const transaction = await db.beginTransaction();
  
  try {
    // 1. Créer le produit principal
    const vendorProduct = await db.query(`
      INSERT INTO vendor_products (
        vendor_id, base_product_id, vendor_name, vendor_description,
        vendor_price, vendor_stock, base_price_admin, design_url,
        design_filename, preview_view, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      productData.vendorId,
      productData.baseProductId,
      productData.vendorName,
      productData.vendorDescription,
      productData.vendorPrice,
      productData.vendorStock,
      productData.basePriceAdmin,
      productData.designUrl,
      productData.designFile?.name,
      JSON.stringify(productData.previewView),
      productData.publishedAt
    ]);
    
    const vendorProductId = vendorProduct.insertId;
    
    // 2. Sauvegarder les images de couleurs
    for (const processedImage of productData.processedImages) {
      await db.query(`
        INSERT INTO vendor_product_color_images (
          vendor_product_id, color_id, color_name, color_code,
          image_url, image_key, image_type, file_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        vendorProductId,
        processedImage.colorId || null,
        processedImage.colorName || 'default',
        processedImage.colorCode || '#000000',
        processedImage.storedUrl,
        processedImage.imageKey,
        processedImage.type,
        processedImage.fileSize || 0
      ]);
    }
    
    // 3. Sauvegarder les tailles sélectionnées
    for (const size of productData.selectedSizes) {
      await db.query(`
        INSERT INTO vendor_product_sizes (vendor_product_id, size_id, size_name)
        VALUES (?, ?, ?)
      `, [vendorProductId, size.id, size.sizeName]);
    }
    
    // 4. Sauvegarder les couleurs sélectionnées
    for (const color of productData.selectedColors) {
      await db.query(`
        INSERT INTO vendor_product_colors (vendor_product_id, color_id, color_name, color_code)
        VALUES (?, ?, ?, ?)
      `, [vendorProductId, color.id, color.name, color.colorCode]);
    }
    
    await transaction.commit();
    
    console.log('✅ Produit vendeur créé:', vendorProductId);
    return { id: vendorProductId, ...productData };
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erreur création produit vendeur:', error);
    throw error;
  }
};
```

## 🚨 Points Critiques d'Implémentation

### 1. **Problème Blob URLs**
Les blob URLs du frontend ne sont pas accessibles depuis le serveur. Solutions :

```javascript
// Option A: Conversion en base64 côté frontend
const convertBlobToBase64 = async (blobUrl) => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

// Option B: Envoi en FormData
const sendAsFormData = async (productData, images) => {
  const formData = new FormData();
  formData.append('productData', JSON.stringify(productData));
  
  for (const [key, blobUrl] of Object.entries(images)) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    formData.append(`image_${key}`, blob, `${key}.png`);
  }
  
  return formData;
};
```

### 2. **Validation Robuste**

```javascript
const validateProductData = async (data, vendorId) => {
  const errors = [];
  
  // Vérifier que le vendeur existe et est actif
  const vendor = await db.query('SELECT status FROM users WHERE id = ? AND role = "VENDEUR"', [vendorId]);
  if (!vendor.length || vendor[0].status !== 'ACTIVE') {
    errors.push('Vendeur non autorisé');
  }
  
  // Vérifier que le produit de base existe
  const baseProduct = await db.query('SELECT id FROM products WHERE id = ?', [data.baseProductId]);
  if (!baseProduct.length) {
    errors.push('Produit de base introuvable');
  }
  
  // Vérifier le prix vendeur >= prix admin
  if (data.vendorPrice < data.basePriceAdmin) {
    errors.push(`Prix vendeur (${data.vendorPrice}) inférieur au prix minimum (${data.basePriceAdmin})`);
  }
  
  // Vérifier qu'il y a au moins une couleur et une taille
  if (!data.selectedColors.length) {
    errors.push('Au moins une couleur doit être sélectionnée');
  }
  if (!data.selectedSizes.length) {
    errors.push('Au moins une taille doit être sélectionnée');
  }
  
  // Vérifier qu'il y a des images
  if (!data.finalImages.statistics.totalImagesGenerated) {
    errors.push('Aucune image générée');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 3. **API de Consultation**

```javascript
// GET /api/vendor/products/:vendorId
const getVendorProducts = async (req, res) => {
  const { vendorId } = req.params;
  
  const products = await db.query(`
    SELECT 
      vp.*,
      p.name as base_product_name,
      p.category,
      COUNT(DISTINCT vpci.id) as image_count,
      COUNT(DISTINCT vps.id) as size_count,
      COUNT(DISTINCT vpc.id) as color_count
    FROM vendor_products vp
    LEFT JOIN products p ON vp.base_product_id = p.id
    LEFT JOIN vendor_product_color_images vpci ON vp.id = vpci.vendor_product_id
    LEFT JOIN vendor_product_sizes vps ON vp.id = vps.vendor_product_id
    LEFT JOIN vendor_product_colors vpc ON vp.id = vpc.vendor_product_id
    WHERE vp.vendor_id = ?
    GROUP BY vp.id
    ORDER BY vp.published_at DESC
  `, [vendorId]);
  
  res.json({ success: true, products });
};

// GET /api/vendor/products/:productId/images
const getProductImages = async (req, res) => {
  const { productId } = req.params;
  
  const images = await db.query(`
    SELECT * FROM vendor_product_color_images 
    WHERE vendor_product_id = ?
    ORDER BY image_type, color_name
  `, [productId]);
  
  res.json({ success: true, images });
};
```

## 🔄 Frontend - Modifications Nécessaires

Pour résoudre le problème des blob URLs, modifier le frontend :

```javascript
// Dans handlePublishProducts, avant l'envoi
const convertImagesToBase64 = async (capturedImages) => {
  const base64Images = {};
  
  for (const [key, blobUrl] of Object.entries(capturedImages)) {
    try {
      const base64 = await convertBlobToBase64(blobUrl);
      base64Images[key] = base64;
    } catch (error) {
      console.error(`Erreur conversion ${key}:`, error);
    }
  }
  
  return base64Images;
};

// Modifier le payload pour inclure les images en base64
const payload = {
  // ... autres données
  finalImagesBase64: await convertImagesToBase64(capturedImages),
  // ... reste du payload
};
```

## 📈 Optimisations Recommandées

1. **Cache Redis** pour les métadonnées produits
2. **Queue système** pour le traitement d'images
3. **CDN** pour servir les images finales
4. **Elasticsearch** pour la recherche produits vendeur
5. **Monitoring** des performances upload

## ✅ Checklist d'Implémentation

- [ ] Endpoint POST /api/vendor/publish créé
- [ ] Tables de base de données créées et indexées
- [ ] Service de traitement d'images implémenté
- [ ] Validation des données robuste
- [ ] Gestion des transactions DB
- [ ] Conversion blob URLs → base64/FormData côté frontend
- [ ] API de consultation des produits vendeur
- [ ] Tests unitaires et d'intégration
- [ ] Monitoring et logs
- [ ] Documentation API complète

Ce guide couvre tous les aspects nécessaires pour implémenter le backend de publication vendeur avec gestion complète des images multi-couleurs ! 🚀 