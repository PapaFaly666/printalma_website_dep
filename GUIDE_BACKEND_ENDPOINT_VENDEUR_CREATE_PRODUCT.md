# 🚀 GUIDE BACKEND - Endpoint POST /api/vendeur/create-product

## 📋 Vue d'ensemble

Ce document détaille l'implémentation de l'endpoint spécifique pour le workflow de création de produits vendeur via l'interface `/vendeur/create-product`. Cet endpoint diffère du endpoint général `/api/vendor/products` par sa structure de données et sa logique métier spécifique.

## 🔄 DIFFÉRENCES AVEC `/api/vendor/products`

| Aspect | `/api/vendor/products` | `/api/vendeur/create-product` |
|--------|------------------------|------------------------------|
| **Usage** | API générale | Interface wizard spécifique |
| **Format données** | Structure backend native | Structure frontend optimisée |
| **Validation** | Basique | Avancée avec étapes |
| **Images** | Upload simple | Hiérarchie base/détail |
| **Réponse** | Données brutes | Format UI-friendly |

---

## 🔌 ENDPOINT PRINCIPAL

### **POST `/api/vendeur/create-product`**

Endpoint spécialement conçu pour l'interface de création de produits vendeur multi-étapes.

---

## 📨 FORMAT DE LA REQUÊTE

### **Content-Type:** `multipart/form-data`

```typescript
// Données JSON dans le champ 'productData'
productData: {
  // Étape 1: Mockup sélectionné
  selectedMockup: {
    id: number,
    name: string,
    price: number, // Prix de revient
    suggestedPrice?: number
  },

  // Étape 2: Informations produit
  productName: string,
  productDescription: string,
  productPrice: number, // Prix en FCFA (pas en centimes)
  basePrice: number, // Prix de revient
  vendorProfit: number, // Bénéfice calculé
  expectedRevenue: number, // Revenu attendu (70%)
  isPriceCustomized: boolean,

  // Étape 3: Détails et sélections
  selectedTheme: string, // ID de la catégorie design
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

// Images avec hiérarchie spécifique
baseImage: File, // OBLIGATOIRE: Image principale
detailImage_1: File, // OPTIONNEL: Image détail 1
detailImage_2: File, // OPTIONNEL: Image détail 2
...
detailImage_15: File // OPTIONNEL: Image détail 15 (max 16 total)
```

### **Exemple de Requête (Frontend)**
```javascript
const formData = new FormData();

// Données structurées du wizard
const productData = {
  selectedMockup: {
    id: 123,
    name: "T-shirt Basic",
    price: 6000,
    suggestedPrice: 8000
  },
  productName: "Mon T-shirt Custom Design",
  productDescription: "T-shirt personnalisé avec design unique",
  productPrice: 8500, // Prix en FCFA
  basePrice: 6000,
  vendorProfit: 2500,
  expectedRevenue: 1750, // 70% de 2500
  isPriceCustomized: true,
  selectedTheme: "5", // ID catégorie design
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

// Images avec hiérarchie
formData.append('baseImage', baseImageFile); // Image principale
formData.append('detailImage_1', detailImage1File);
formData.append('detailImage_2', detailImage2File);
// ... autres images détail
```

---

## 🗃️ TRAITEMENT BACKEND

### **1. Authentification et Autorisations**
```typescript
// Vérifier l'authentification vendeur
const user = await authenticateUser(request);
if (!user || !['VENDEUR', 'ADMIN'].includes(user.role)) {
  return res.status(401).json({
    success: false,
    error: 'UNAUTHORIZED',
    message: 'Accès refusé - Authentification vendeur requise'
  });
}

// Log de l'activité
console.log('Création produit via wizard:', {
  vendorId: user.id,
  timestamp: new Date().toISOString(),
  userAgent: request.headers['user-agent']
});
```

### **2. Parsing et Validation des Données**
```typescript
// Parser les données JSON du wizard
let productData;
try {
  productData = JSON.parse(request.body.productData);
} catch (error) {
  return res.status(400).json({
    success: false,
    error: 'INVALID_JSON',
    message: 'Format de données invalide'
  });
}

// Validation structure des données
const requiredFields = [
  'selectedMockup', 'productName', 'productDescription',
  'productPrice', 'selectedTheme', 'selectedColors', 'selectedSizes'
];

for (const field of requiredFields) {
  if (!productData[field]) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELD',
      message: `Champ requis manquant: ${field}`
    });
  }
}
```

### **3. Validations Métier Spécifiques**

#### **a) Validation du Mockup**
```typescript
// Vérifier que le mockup existe et est valide
const mockup = await db.products.findOne({
  where: {
    id: productData.selectedMockup.id,
    is_ready_product: false,
    admin_created: true
  },
  include: ['colorVariations', 'sizes']
});

if (!mockup) {
  return res.status(404).json({
    success: false,
    error: 'MOCKUP_NOT_FOUND',
    message: 'Mockup sélectionné introuvable ou invalide'
  });
}

// Vérifier cohérence des prix
if (mockup.base_price !== productData.basePrice) {
  return res.status(400).json({
    success: false,
    error: 'PRICE_MISMATCH',
    message: 'Prix de base incohérent avec le mockup sélectionné'
  });
}
```

#### **b) Validation des Prix Avancée**
```typescript
// Validation marge minimum (10%)
const minimumPrice = productData.basePrice * 1.1;
if (productData.productPrice < minimumPrice) {
  return res.status(400).json({
    success: false,
    error: 'INSUFFICIENT_MARGIN',
    message: `Prix minimum autorisé: ${minimumPrice} FCFA (marge 10% minimum)`,
    details: {
      baseCost: productData.basePrice,
      minimumPrice: minimumPrice,
      providedPrice: productData.productPrice,
      requiredMargin: '10%'
    }
  });
}

// Validation cohérence des calculs frontend
const expectedProfit = productData.productPrice - productData.basePrice;
const expectedRevenue = Math.round(expectedProfit * 0.7);

if (Math.abs(productData.vendorProfit - expectedProfit) > 1) {
  return res.status(400).json({
    success: false,
    error: 'CALCULATION_ERROR',
    message: 'Erreur dans les calculs de bénéfice'
  });
}

if (Math.abs(productData.expectedRevenue - expectedRevenue) > 1) {
  return res.status(400).json({
    success: false,
    error: 'REVENUE_CALCULATION_ERROR',
    message: 'Erreur dans le calcul du revenu attendu'
  });
}
```

#### **c) Validation des Sélections Couleurs/Tailles**
```typescript
// Validation couleurs sélectionnées
const validColorIds = mockup.colorVariations.map(c => c.id);
const invalidColors = productData.selectedColors.filter(
  color => !validColorIds.includes(color.id)
);

if (invalidColors.length > 0) {
  return res.status(400).json({
    success: false,
    error: 'INVALID_COLORS',
    message: 'Couleurs sélectionnées non disponibles pour ce mockup',
    details: {
      invalidColors: invalidColors.map(c => c.name),
      availableColors: mockup.colorVariations.map(c => c.name)
    }
  });
}

// Validation tailles sélectionnées
const validSizeIds = mockup.sizes.map(s => s.id);
const invalidSizes = productData.selectedSizes.filter(
  size => !validSizeIds.includes(size.id)
);

if (invalidSizes.length > 0) {
  return res.status(400).json({
    success: false,
    error: 'INVALID_SIZES',
    message: 'Tailles sélectionnées non disponibles pour ce mockup',
    details: {
      invalidSizes: invalidSizes.map(s => s.sizeName),
      availableSizes: mockup.sizes.map(s => s.sizeName)
    }
  });
}
```

#### **d) Validation Catégorie Design (Thème)**
```typescript
const designCategory = await db.design_categories.findOne({
  where: {
    id: parseInt(productData.selectedTheme),
    is_active: true
  }
});

if (!designCategory) {
  return res.status(400).json({
    success: false,
    error: 'INVALID_THEME',
    message: 'Thème sélectionné introuvable ou inactif'
  });
}
```

### **4. Gestion des Images avec Hiérarchie**
```typescript
// Extraction des images avec hiérarchie
const baseImage = request.files['baseImage']?.[0];
if (!baseImage) {
  return res.status(400).json({
    success: false,
    error: 'MISSING_BASE_IMAGE',
    message: 'Image principale (base) obligatoire'
  });
}

// Extraire les images de détail
const detailImages = [];
for (let i = 1; i <= 15; i++) {
  const detailImage = request.files[`detailImage_${i}`]?.[0];
  if (detailImage) {
    detailImages.push(detailImage);
  }
}

const allImages = [baseImage, ...detailImages];

// Validation des images
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const maxSize = 5 * 1024 * 1024; // 5MB

for (const [index, image] of allImages.entries()) {
  const imageType = index === 0 ? 'principale' : 'détail';

  if (!allowedTypes.includes(image.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_IMAGE_TYPE',
      message: `Image ${imageType}: type non autorisé (${image.mimetype})`
    });
  }

  if (image.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: 'IMAGE_TOO_LARGE',
      message: `Image ${imageType}: taille trop importante (max 5MB)`
    });
  }
}

console.log('Images validées:', {
  baseImage: baseImage.originalname,
  detailImages: detailImages.map(img => img.originalname),
  totalImages: allImages.length
});
```

### **5. Upload et Traitement des Images**
```typescript
const uploadedImages = [];

// Upload image principale
const baseImageResult = await uploadImage(baseImage, {
  destination: `vendor-products/${user.id}/${Date.now()}`,
  filename: `base_${baseImage.originalname}`
});

uploadedImages.push({
  imageUrl: baseImageResult.url,
  imageOrder: 0,
  columnIndex: 0,
  isBaseImage: true,
  imageType: 'base',
  fileSize: baseImage.size,
  fileType: baseImage.mimetype,
  originalName: baseImage.originalname
});

// Upload images de détail
for (const [index, detailImage] of detailImages.entries()) {
  const detailImageResult = await uploadImage(detailImage, {
    destination: `vendor-products/${user.id}/${Date.now()}`,
    filename: `detail_${index + 1}_${detailImage.originalname}`
  });

  uploadedImages.push({
    imageUrl: detailImageResult.url,
    imageOrder: Math.floor((index + 1) / 4), // Position dans la colonne
    columnIndex: (index + 1) % 4, // Index de colonne (0-3)
    isBaseImage: false,
    imageType: 'detail',
    fileSize: detailImage.size,
    fileType: detailImage.mimetype,
    originalName: detailImage.originalname
  });
}
```

### **6. Insertion en Base de Données**
```typescript
// Transaction pour garantir la cohérence
const result = await db.transaction(async (trx) => {
  // Créer le produit vendeur
  const vendorProduct = await trx.vendor_products.create({
    vendor_id: user.id,
    base_product_id: productData.selectedMockup.id,

    // Informations produit
    vendor_name: productData.productName,
    vendor_description: productData.productDescription,
    vendor_price: productData.productPrice,
    vendor_stock: 100, // Stock par défaut

    // Calculs financiers
    base_cost: productData.basePrice,
    vendor_profit: productData.vendorProfit,
    vendor_revenue: productData.expectedRevenue,
    platform_commission: productData.vendorProfit - productData.expectedRevenue,

    // Sélections
    selected_colors: JSON.stringify(productData.selectedColors),
    selected_sizes: JSON.stringify(productData.selectedSizes),
    design_category_id: parseInt(productData.selectedTheme),

    // Statuts
    status: productData.postValidationAction === 'TO_PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    validation_status: 'PENDING',

    // Métadonnées wizard
    created_via_wizard: true,
    price_customized: productData.isPriceCustomized
  });

  // Insérer les images avec hiérarchie
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
  "message": "Produit créé avec succès via le wizard",
  "data": {
    "id": 456,
    "vendorId": 123,
    "productName": "Mon T-shirt Custom Design",
    "productPrice": 8500,
    "basePrice": 6000,
    "vendorProfit": 2500,
    "expectedRevenue": 1750,
    "platformCommission": 750,
    "status": "DRAFT",
    "validationStatus": "PENDING",

    "mockup": {
      "id": 123,
      "name": "T-shirt Basic",
      "basePrice": 6000
    },

    "theme": {
      "id": 5,
      "name": "Moderne",
      "color": "#3b82f6"
    },

    "selectedColors": [
      { "id": 1, "name": "Noir", "colorCode": "#000000" },
      { "id": 2, "name": "Blanc", "colorCode": "#ffffff" }
    ],

    "selectedSizes": [
      { "id": 1, "sizeName": "M" },
      { "id": 2, "sizeName": "L" },
      { "id": 3, "sizeName": "XL" }
    ],

    "images": {
      "baseImage": {
        "id": 1,
        "url": "https://cdn.example.com/vendor-products/123/1732012345/base_design1.jpg",
        "isBase": true,
        "type": "base"
      },
      "detailImages": [
        {
          "id": 2,
          "url": "https://cdn.example.com/vendor-products/123/1732012345/detail_1_design2.jpg",
          "isBase": false,
          "type": "detail"
        }
      ],
      "totalImages": 2
    },

    "wizard": {
      "createdViaWizard": true,
      "priceCustomized": true,
      "completedSteps": 5
    },

    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### **Erreur de Validation (400 Bad Request)**
```json
{
  "success": false,
  "error": "INSUFFICIENT_MARGIN",
  "message": "Prix minimum autorisé: 6600 FCFA (marge 10% minimum)",
  "details": {
    "step": 2,
    "field": "productPrice",
    "baseCost": 6000,
    "minimumPrice": 6600,
    "providedPrice": 6500,
    "requiredMargin": "10%"
  },
  "suggestions": [
    "Augmentez le prix de vente à au moins 6600 FCFA",
    "Le prix de revient du mockup est de 6000 FCFA",
    "Une marge de 10% minimum est requise"
  ]
}
```

### **Erreur de Sélection (400 Bad Request)**
```json
{
  "success": false,
  "error": "INVALID_COLORS",
  "message": "Couleurs sélectionnées non disponibles pour ce mockup",
  "details": {
    "step": 3,
    "field": "selectedColors",
    "mockupId": 123,
    "invalidColors": ["Rouge"],
    "availableColors": ["Noir", "Blanc", "Gris"]
  },
  "suggestions": [
    "Sélectionnez uniquement les couleurs disponibles pour ce mockup",
    "Retournez à l'étape 1 pour choisir un autre mockup"
  ]
}
```

---

## 🧪 TESTS SPÉCIFIQUES

### **1. Test Workflow Complet**
```javascript
describe('POST /api/vendeur/create-product', () => {
  it('should create product via wizard workflow', async () => {
    const formData = new FormData();

    // Données valides du wizard
    const productData = {
      selectedMockup: { id: 1, name: "T-shirt", price: 6000 },
      productName: "Test Product",
      productDescription: "Test Description",
      productPrice: 7000,
      basePrice: 6000,
      vendorProfit: 1000,
      expectedRevenue: 700,
      selectedTheme: "1",
      selectedColors: [{ id: 1, name: "Noir", colorCode: "#000000" }],
      selectedSizes: [{ id: 1, sizeName: "M" }],
      postValidationAction: "TO_DRAFT"
    };

    formData.append('productData', JSON.stringify(productData));
    formData.append('baseImage', baseImageFile);
    formData.append('detailImage_1', detailImageFile);

    const response = await request(app)
      .post('/api/vendeur/create-product')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send(formData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.wizard.createdViaWizard).toBe(true);
    expect(response.body.data.images.baseImage).toBeDefined();
  });
});
```

### **2. Test Validation Prix**
```javascript
it('should reject insufficient margin', async () => {
  const productData = {
    // ... autres champs ...
    productPrice: 6500, // < 6600 (prix base 6000 + 10%)
    basePrice: 6000
  };

  const response = await request(app)
    .post('/api/vendeur/create-product')
    .send(formData)
    .expect(400);

  expect(response.body.error).toBe('INSUFFICIENT_MARGIN');
  expect(response.body.details.minimumPrice).toBe(6600);
});
```

### **3. Test Images Hiérarchie**
```javascript
it('should require base image', async () => {
  const formData = new FormData();
  formData.append('productData', JSON.stringify(validProductData));
  // Pas d'image de base

  const response = await request(app)
    .post('/api/vendeur/create-product')
    .send(formData)
    .expect(400);

  expect(response.body.error).toBe('MISSING_BASE_IMAGE');
});
```

---

## 🔧 CONFIGURATION SERVEUR

### **Middleware Upload Spécialisé**
```javascript
const multer = require('multer');

// Configuration spécifique pour le wizard
const wizardUpload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB par image
    files: 16 // 1 base + 15 détail max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    // Vérifier le type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Type non autorisé: ${file.mimetype}`));
    }

    // Vérifier la hiérarchie des noms
    if (file.fieldname === 'baseImage') {
      cb(null, true);
    } else if (file.fieldname.startsWith('detailImage_')) {
      cb(null, true);
    } else {
      cb(new Error(`Nom de champ invalide: ${file.fieldname}`));
    }
  }
});

// Configurer les champs d'upload
const uploadFields = [
  { name: 'baseImage', maxCount: 1 },
  ...Array.from({ length: 15 }, (_, i) => ({
    name: `detailImage_${i + 1}`,
    maxCount: 1
  }))
];

// Appliquer le middleware
app.post('/api/vendeur/create-product',
  authenticateUser,
  wizardUpload.fields(uploadFields),
  createProductViaWizard
);
```

---

## 📊 MÉTRIQUES SPÉCIFIQUES

### **Tracking du Wizard**
```typescript
// Métriques de performance du wizard
await metrics.increment('wizard.product_creation.started', {
  vendorId: user.id,
  step: 'complete'
});

await metrics.histogram('wizard.product_creation.completion_time',
  Date.now() - startTime, {
    vendorId: user.id,
    priceCustomized: productData.isPriceCustomized
  }
);

// Métriques business
await metrics.increment('wizard.product_creation.margin_analysis', {
  marginRange: getMarginRange(productData.vendorProfit / productData.basePrice),
  priceCustomized: productData.isPriceCustomized
});
```

---

## ✅ CHECKLIST VALIDATION

- [ ] Endpoint `/api/vendeur/create-product` créé
- [ ] Validation structure données wizard
- [ ] Validation marge 10% minimum
- [ ] Calculs automatiques vérifiés
- [ ] Hiérarchie images base/détail implémentée
- [ ] Validation couleurs/tailles mockup
- [ ] Transaction base de données
- [ ] Format réponse optimisé frontend
- [ ] Tests unitaires wizard
- [ ] Métriques et logs spécifiques
- [ ] Documentation API complète

---

**🎯 Objectif:** Fournir un endpoint robuste spécialement conçu pour l'interface wizard `/vendeur/create-product`, avec validations avancées et gestion optimisée de la hiérarchie des images pour une expérience utilisateur exceptionnelle.