# 🚀 GUIDE BACKEND - Endpoint POST /api/vendor/products

## 📋 Vue d'ensemble

Ce document détaille l'implémentation de l'endpoint de création de produits vendeur avec upload multiple d'images, utilisé par le workflow `/vendeur/create-product`.

---

## 🔌 ENDPOINT PRINCIPAL

### **POST `/api/vendor/products`**

Cet endpoint reçoit les données du formulaire multi-étapes et crée un nouveau produit vendeur avec ses images.

---

## 📨 FORMAT DE LA REQUÊTE

### **Content-Type:** `multipart/form-data`

```typescript
// Données JSON dans le champ 'productData'
productData: {
  // Étape 1: Sélection mockup
  baseProductId: number,

  // Étape 2: Informations de base
  vendorName: string,
  vendorDescription: string,
  vendorPrice: number, // Prix en centimes (ex: 500000 pour 5000 FCFA)
  vendorStock: number,

  // Étape 3: Détails
  designCategoryId: number, // ID de la catégorie design sélectionnée (thème)
  selectedColors: [
    {
      id: number,
      name: string,
      colorCode: string
    }
  ],
  selectedSizes: [
    {
      id: number,
      sizeName: string
    }
  ],

  // Métadonnées
  postValidationAction: 'TO_DRAFT' | 'TO_PUBLISHED'
}

// Images dans des champs séparés
image_0: File,
image_1: File,
image_2: File,
...
image_15: File // Maximum 16 images
```

### **Exemple de Requête (Node.js/FormData)**
```javascript
const formData = new FormData();

// Données du produit
const productData = {
  baseProductId: 123,
  vendorName: "Mon T-shirt Custom",
  vendorDescription: "T-shirt personnalisé avec mon design unique",
  vendorPrice: 800000, // 8000 FCFA en centimes
  vendorStock: 50,
  designCategoryId: 5,
  selectedColors: [
    { id: 1, name: "Noir", colorCode: "#000000" },
    { id: 2, name: "Blanc", colorCode: "#ffffff" }
  ],
  selectedSizes: [
    { id: 1, sizeName: "M" },
    { id: 2, sizeName: "L" },
    { id: 3, sizeName: "XL" }
  ],
  postValidationAction: "TO_DRAFT"
};

formData.append('productData', JSON.stringify(productData));

// Images (organisées en 4 colonnes max)
for (let i = 0; i < productImages.length; i++) {
  formData.append(`image_${i}`, productImages[i]);
}
```

---

## 🗃️ TRAITEMENT BACKEND

### **1. Authentification et Autorisations**
```typescript
// Vérifier l'authentification
const user = await authenticateUser(request);
if (!user || !['VENDEUR', 'ADMIN'].includes(user.role)) {
  throw new Error('Accès refusé - Rôle vendeur requis');
}
```

### **2. Parsing des Données**
```typescript
// Parser les données JSON
const productData = JSON.parse(request.body.productData);

// Extraire les images
const imageFiles = [];
for (let i = 0; i < 16; i++) {
  const imageField = `image_${i}`;
  if (request.files[imageField]) {
    imageFiles.push(request.files[imageField]);
  }
}
```

### **3. Validations Obligatoires**

#### **a) Validation du Mockup de Base**
```typescript
const baseProduct = await db.products.findOne({
  where: {
    id: productData.baseProductId,
    is_ready_product: false, // Doit être un mockup
    admin_created: true
  }
});

if (!baseProduct) {
  throw new Error('Mockup non trouvé ou invalide');
}
```

#### **b) Validation des Prix (CRITIQUE)**
```typescript
// Convertir le prix en FCFA (diviser par 100)
const vendorPriceInFCFA = productData.vendorPrice / 100;
const basePriceInFCFA = baseProduct.base_price;
const minimumPriceInFCFA = basePriceInFCFA * 1.1; // +10% minimum

if (vendorPriceInFCFA < minimumPriceInFCFA) {
  throw new Error(
    `Prix minimum autorisé: ${minimumPriceInFCFA} FCFA (prix de revient: ${basePriceInFCFA} FCFA + 10%)`
  );
}
```

#### **c) Validation des Sélections**
```typescript
// Vérifier que les couleurs appartiennent au mockup
const validColorIds = baseProduct.colorVariations.map(c => c.id);
const invalidColors = productData.selectedColors.filter(
  color => !validColorIds.includes(color.id)
);
if (invalidColors.length > 0) {
  throw new Error('Couleurs sélectionnées invalides pour ce mockup');
}

// Vérifier que les tailles appartiennent au mockup
const validSizeIds = baseProduct.sizes.map(s => s.id);
const invalidSizes = productData.selectedSizes.filter(
  size => !validSizeIds.includes(size.id)
);
if (invalidSizes.length > 0) {
  throw new Error('Tailles sélectionnées invalides pour ce mockup');
}
```

#### **d) Validation de la Catégorie Design**
```typescript
const designCategory = await db.design_categories.findOne({
  where: {
    id: productData.designCategoryId,
    is_active: true
  }
});

if (!designCategory) {
  throw new Error('Catégorie design non trouvée ou inactive');
}
```

#### **e) Validation des Images**
```typescript
// Nombre maximum d'images
if (imageFiles.length === 0) {
  throw new Error('Au moins une image est requise');
}
if (imageFiles.length > 16) {
  throw new Error('Maximum 16 images autorisées');
}

// Validation de chaque image
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const maxSize = 5 * 1024 * 1024; // 5MB

for (const [index, file] of imageFiles.entries()) {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Image ${index + 1}: Type de fichier non autorisé (${file.mimetype})`);
  }

  if (file.size > maxSize) {
    throw new Error(`Image ${index + 1}: Fichier trop volumineux (max 5MB)`);
  }
}
```

### **4. Calculs Automatiques**
```typescript
// Calculs financiers (TOUS automatiques côté backend)
const baseCost = basePriceInFCFA;
const vendorProfit = vendorPriceInFCFA - baseCost;
const vendorRevenue = Math.round(vendorProfit * 0.7); // 70% au vendeur
const platformCommission = Math.round(vendorProfit * 0.3); // 30% à la plateforme

// Log pour vérification
console.log('Calculs financiers:', {
  vendorId: user.id,
  baseProductId: productData.baseProductId,
  baseCost,
  vendorPrice: vendorPriceInFCFA,
  vendorProfit,
  vendorRevenue,
  platformCommission,
  marginPercent: Math.round((vendorProfit / baseCost) * 100)
});
```

### **5. Upload des Images**
```typescript
// Configuration storage (exemple avec AWS S3 ou local)
const uploadConfig = {
  destination: `vendor-products/${user.id}/${Date.now()}`,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 5 * 1024 * 1024
};

// Upload des images avec organisation en colonnes
const uploadedImages = [];
for (const [index, file] of imageFiles.entries()) {
  const columnIndex = index % 4; // 4 colonnes max
  const imageOrder = Math.floor(index / 4); // Position dans la colonne

  // Upload du fichier
  const uploadResult = await uploadImage(file, {
    ...uploadConfig,
    filename: `${columnIndex}_${imageOrder}_${file.originalname}`
  });

  uploadedImages.push({
    imageUrl: uploadResult.url,
    imageOrder: imageOrder,
    columnIndex: columnIndex,
    fileSize: file.size,
    fileType: file.mimetype,
    originalName: file.originalname
  });
}
```

### **6. Insertion en Base de Données**
```typescript
// Transaction pour garantir la cohérence
await db.transaction(async (trx) => {
  // 1. Créer le produit vendeur
  const vendorProduct = await trx.vendor_products.create({
    vendor_id: user.id,
    base_product_id: productData.baseProductId,

    // Informations vendeur
    vendor_name: productData.vendorName,
    vendor_description: productData.vendorDescription,
    vendor_price: vendorPriceInFCFA,
    vendor_stock: productData.vendorStock,

    // Calculs automatiques
    base_cost: baseCost,
    vendor_profit: vendorProfit,
    vendor_revenue: vendorRevenue,
    platform_commission: platformCommission,

    // Sélections
    selected_colors: JSON.stringify(productData.selectedColors),
    selected_sizes: JSON.stringify(productData.selectedSizes),
    design_category_id: productData.designCategoryId,

    // Statut
    status: productData.postValidationAction === 'TO_PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    validation_status: 'PENDING'
  });

  // 2. Insérer les images
  for (const imageData of uploadedImages) {
    await trx.vendor_product_images.create({
      vendor_product_id: vendorProduct.id,
      ...imageData
    });
  }

  return vendorProduct;
});
```

---

## 📤 FORMAT DE RÉPONSE

### **Succès (201 Created)**
```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "data": {
    "id": 456,
    "vendorId": 123,
    "baseProductId": 789,
    "vendorName": "Mon T-shirt Custom",
    "vendorDescription": "T-shirt personnalisé avec mon design unique",
    "vendorPrice": 8000,
    "baseCost": 6000,
    "vendorProfit": 2000,
    "vendorRevenue": 1400,
    "platformCommission": 600,
    "status": "DRAFT",
    "validationStatus": "PENDING",
    "selectedColors": [
      { "id": 1, "name": "Noir", "colorCode": "#000000" }
    ],
    "selectedSizes": [
      { "id": 1, "sizeName": "M" },
      { "id": 2, "sizeName": "L" }
    ],
    "designCategory": {
      "id": 5,
      "name": "Moderne",
      "color": "#3b82f6"
    },
    "images": [
      {
        "id": 1,
        "imageUrl": "https://cdn.example.com/vendor-products/123/1732012345/0_0_design1.jpg",
        "imageOrder": 0,
        "columnIndex": 0
      },
      {
        "id": 2,
        "imageUrl": "https://cdn.example.com/vendor-products/123/1732012345/1_0_design2.jpg",
        "imageOrder": 0,
        "columnIndex": 1
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### **Erreur (400 Bad Request)**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Prix minimum autorisé: 6600 FCFA (prix de revient: 6000 FCFA + 10%)",
  "details": {
    "field": "vendorPrice",
    "providedValue": 6500,
    "minimumValue": 6600,
    "baseCost": 6000
  }
}
```

---

## 🔧 CONFIGURATION SERVEUR

### **1. Middleware Upload**
```javascript
// Exemple avec multer (Node.js)
const multer = require('multer');
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB par fichier
    files: 16 // Maximum 16 fichiers
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  }
});

// Appliquer le middleware
app.post('/api/vendor/products',
  authenticateUser,
  upload.array('images', 16), // Jusqu'à 16 fichiers
  createVendorProduct
);
```

### **2. Variables d'Environnement**
```env
# Upload Configuration
UPLOAD_MAX_FILE_SIZE=5242880  # 5MB en bytes
UPLOAD_MAX_FILES=16
UPLOAD_ALLOWED_TYPES=image/jpeg,image/jpg,image/png,image/webp

# Storage Configuration (exemple S3)
AWS_S3_BUCKET=printalma-vendor-products
AWS_S3_REGION=us-east-1
UPLOAD_BASE_URL=https://cdn.printalma.com/vendor-products

# Business Rules
VENDOR_MIN_MARGIN_PERCENT=10
VENDOR_REVENUE_PERCENT=70
PLATFORM_COMMISSION_PERCENT=30
```

---

## 📊 MONITORING ET LOGS

### **1. Métriques à Tracker**
```typescript
// Métriques de création de produits
await metrics.increment('vendor_product.created', {
  vendorId: user.id,
  baseProductId: productData.baseProductId,
  priceRange: getPriceRange(vendorPriceInFCFA),
  imageCount: imageFiles.length
});

// Métriques financières
await metrics.histogram('vendor_product.profit_margin', marginPercent, {
  vendorId: user.id
});
```

### **2. Logs de Sécurité**
```typescript
// Log des tentatives de violation de marge
if (vendorPriceInFCFA < minimumPriceInFCFA) {
  await securityLog.warn('MARGIN_VIOLATION_ATTEMPT', {
    vendorId: user.id,
    attemptedPrice: vendorPriceInFCFA,
    minimumPrice: minimumPriceInFCFA,
    baseProductId: productData.baseProductId,
    ip: request.ip
  });
}
```

---

## 🧪 TESTS DE L'ENDPOINT

### **1. Test de Création Normale**
```javascript
const testData = {
  productData: JSON.stringify({
    baseProductId: 1,
    vendorName: "Test Product",
    vendorDescription: "Test Description",
    vendorPrice: 770000, // 7700 FCFA (marge > 10% sur base 6000)
    vendorStock: 10,
    designCategoryId: 1,
    selectedColors: [{ id: 1, name: "Noir", colorCode: "#000000" }],
    selectedSizes: [{ id: 1, sizeName: "M" }],
    postValidationAction: "TO_DRAFT"
  })
};

// Ajouter des images de test
const response = await request(app)
  .post('/api/vendor/products')
  .attach('image_0', 'test-files/image1.jpg')
  .attach('image_1', 'test-files/image2.jpg')
  .field('productData', testData.productData)
  .expect(201);
```

### **2. Test de Violation de Marge**
```javascript
const testDataLowPrice = {
  productData: JSON.stringify({
    // ... autres champs ...
    vendorPrice: 650000, // 6500 FCFA (< 6600 minimum)
  })
};

const response = await request(app)
  .post('/api/vendor/products')
  .field('productData', testDataLowPrice.productData)
  .expect(400);

expect(response.body.message).toContain('Prix minimum autorisé: 6600 FCFA');
```

---

## 🚨 GESTION D'ERREURS

### **Types d'Erreurs Possibles**
```typescript
// Erreurs de validation
'INVALID_MOCKUP' → 400
'PRICE_TOO_LOW' → 400
'INVALID_COLORS' → 400
'INVALID_SIZES' → 400
'INVALID_CATEGORY' → 400
'NO_IMAGES' → 400
'TOO_MANY_IMAGES' → 400
'IMAGE_TOO_LARGE' → 400
'INVALID_IMAGE_TYPE' → 400

// Erreurs d'authentification
'UNAUTHORIZED' → 401
'FORBIDDEN' → 403

// Erreurs serveur
'UPLOAD_FAILED' → 500
'DATABASE_ERROR' → 500
```

---

## ✅ CHECKLIST DE VALIDATION

- [ ] Endpoint configuré avec authentification
- [ ] Middleware d'upload configuré (max 16 images, 5MB chacune)
- [ ] Validation des prix avec marge 10% minimum
- [ ] Calculs automatiques des commissions (70%/30%)
- [ ] Validation des couleurs/tailles du mockup
- [ ] Upload des images avec organisation en colonnes
- [ ] Insertion transactionnelle en base de données
- [ ] Gestion d'erreurs complète
- [ ] Logs de sécurité et métriques
- [ ] Tests automatisés passants
- [ ] Variables d'environnement configurées

---

**🎯 Résultat:** Un endpoint robuste qui garantit l'intégrité des données, respecte les règles business et offre une expérience utilisateur fluide pour la création de produits vendeur avec upload d'images multiples.