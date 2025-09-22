# 🔧 GUIDE BACKEND - Fix Wizard Produit Sans Design

## 🚨 PROBLÈME ACTUEL

L'endpoint `/vendor/products` refuse la création de produits via le wizard avec l'erreur :
```
Error: designId manquant. Veuillez d'abord créer un design avec POST /vendor/designs
```

**Le problème :** Le wizard `/vendeur/create-product` ne doit PAS créer de design - il crée des **produits simples** avec leurs propres images.

---

## 🎯 SOLUTION REQUISE

### **1. Détecter les produits wizard**

Le frontend envoie un indicateur `isWizardProduct: true` dans le payload. Le backend doit :

```javascript
// Dans /vendor/products endpoint
if (payload.isWizardProduct === true) {
  // Logique spéciale pour produits wizard (SANS design)
  return await createWizardProduct(payload);
} else {
  // Logique normale avec designId requis
  return await createNormalVendorProduct(payload);
}
```

### **2. Créer fonction `createWizardProduct`**

```javascript
async function createWizardProduct(payload) {
  const {
    baseProductId,
    vendorName,
    vendorDescription,
    vendorPrice,
    vendorStock,
    selectedColors,
    selectedSizes,
    productImages, // { baseImage: "data:image/...", detailImages: [...] }
    productStructure,
    forcedStatus = 'DRAFT'
  } = payload;

  // 1. Valider le mockup existe
  const mockup = await AdminProduct.findById(baseProductId);
  if (!mockup) {
    throw new Error('Mockup introuvable');
  }

  // 2. Valider marge minimum 10%
  const minimumPrice = mockup.price * 1.1;
  if (vendorPrice < minimumPrice) {
    throw new Error(`Prix trop bas. Minimum: ${minimumPrice} FCFA (marge 10%)`);
  }

  // 3. Créer le produit vendeur SANS design
  const vendorProduct = await VendorProduct.create({
    vendorId: req.user.id,
    baseProductId: baseProductId,
    name: vendorName,
    description: vendorDescription,
    price: vendorPrice,
    stock: vendorStock,
    status: forcedStatus,
    selectedColors: selectedColors,
    selectedSizes: selectedSizes,

    // IMPORTANT: Pas de designId - c'est un produit simple
    designId: null,
    isWizardProduct: true,

    // Métadonnées wizard
    wizardMetadata: {
      basePrice: mockup.price,
      vendorProfit: vendorPrice - mockup.price,
      expectedRevenue: Math.round((vendorPrice - mockup.price) * 0.7),
      platformCommission: Math.round((vendorPrice - mockup.price) * 0.3),
      marginPercentage: ((vendorPrice - mockup.price) / mockup.price) * 100
    }
  });

  // 4. Traiter et sauvegarder les images produit
  const savedImages = await processWizardImages(vendorProduct.id, productImages);

  // 5. Retourner le produit créé
  return {
    success: true,
    message: 'Produit wizard créé avec succès',
    data: {
      id: vendorProduct.id,
      ...vendorProduct.toJSON(),
      images: savedImages,
      wizard: {
        createdViaWizard: true,
        hasDesign: false,
        imageCount: savedImages.length
      }
    }
  };
}
```

### **3. Fonction traitement images**

```javascript
async function processWizardImages(vendorProductId, productImages) {
  const savedImages = [];

  // Image principale
  if (productImages.baseImage) {
    const baseImagePath = await saveBase64Image(
      productImages.baseImage,
      `wizard-product-${vendorProductId}-base`
    );

    savedImages.push({
      url: baseImagePath,
      type: 'base',
      isMain: true,
      vendorProductId: vendorProductId
    });
  }

  // Images de détail
  if (productImages.detailImages && productImages.detailImages.length > 0) {
    for (let i = 0; i < productImages.detailImages.length; i++) {
      const detailImagePath = await saveBase64Image(
        productImages.detailImages[i],
        `wizard-product-${vendorProductId}-detail-${i + 1}`
      );

      savedImages.push({
        url: detailImagePath,
        type: 'detail',
        isMain: false,
        vendorProductId: vendorProductId,
        orderIndex: i + 1
      });
    }
  }

  // Sauvegarder en base
  await ProductImage.bulkCreate(savedImages);

  return savedImages;
}
```

---

## 📤 PAYLOAD FRONTEND ACTUEL

Le frontend envoie cette structure :

```json
{
  "baseProductId": 34,
  "vendorName": "sweat-baayFall-noir (2)",
  "vendorDescription": "Description du produit",
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
      "sizeName": "M"
    }
  ],
  "productStructure": {
    "adminProduct": {
      "id": 34,
      "name": "Sweat à capuche",
      "description": "Description du produit",
      "price": 6000,
      "images": {
        "colorVariations": [...]
      },
      "sizes": [...]
    }
  },
  "productImages": {
    "baseImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "detailImages": [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    ]
  },
  "forcedStatus": "DRAFT",
  "postValidationAction": "TO_DRAFT",
  "bypassValidation": true,
  "isWizardProduct": true
}
```

---

## ✅ MODIFICATIONS REQUISES

### **1. Modifier `/vendor/products` endpoint**

```javascript
// Route POST /vendor/products
app.post('/vendor/products', authenticate, async (req, res) => {
  try {
    const payload = req.body;

    // NOUVEAU: Détecter produit wizard
    if (payload.isWizardProduct === true) {
      const result = await createWizardProduct(payload, req.user);
      return res.status(201).json(result);
    }

    // Logique existante pour produits avec design
    const existingLogic = await createVendorProductWithDesign(payload, req.user);
    return res.status(201).json(existingLogic);

  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
```

### **2. Mise à jour modèle VendorProduct**

Ajouter ces champs optionnels :

```javascript
// Modèle VendorProduct
{
  // Champs existants...
  designId: {
    type: DataTypes.INTEGER,
    allowNull: true, // CHANGEMENT: Permettre null pour produits wizard
    references: {
      model: 'Designs',
      key: 'id'
    }
  },

  // NOUVEAUX CHAMPS
  isWizardProduct: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  wizardMetadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}
```

### **3. Validation côté backend**

```javascript
function validateWizardProduct(payload) {
  const errors = [];

  // Validations obligatoires
  if (!payload.baseProductId) errors.push('baseProductId requis');
  if (!payload.vendorName) errors.push('vendorName requis');
  if (!payload.vendorPrice || payload.vendorPrice <= 0) errors.push('vendorPrice invalide');
  if (!payload.selectedColors || payload.selectedColors.length === 0) errors.push('Au moins une couleur requise');
  if (!payload.selectedSizes || payload.selectedSizes.length === 0) errors.push('Au moins une taille requise');
  if (!payload.productImages || !payload.productImages.baseImage) errors.push('Image principale requise');

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  return true;
}
```

---

## 🔄 WORKFLOW COMPLET

### **Frontend → Backend**

1. **Frontend** : Wizard complété, clique "Sauvegarder"
2. **Frontend** : Envoie POST `/vendor/products` avec `isWizardProduct: true`
3. **Backend** : Détecte le flag, utilise `createWizardProduct()`
4. **Backend** : Valide mockup, prix, images
5. **Backend** : Crée VendorProduct SANS designId
6. **Backend** : Sauvegarde images base64 → fichiers
7. **Backend** : Retourne succès avec données produit
8. **Frontend** : Redirige vers `/vendeur/products`

### **Différences avec produits normaux**

| Aspect | Produit Normal | Produit Wizard |
|--------|----------------|----------------|
| **designId** | Obligatoire | `null` |
| **Images** | Via design appliqué | Images propres au produit |
| **Création** | Design → Produit | Produit direct |
| **Validation** | Design + Produit | Produit seulement |

---

## 🧪 TESTS RECOMMANDÉS

### **Test 1 : Produit wizard valide**
```bash
curl -X POST http://localhost:3004/vendor/products \
  -H "Content-Type: application/json" \
  -d '{
    "baseProductId": 1,
    "vendorName": "Test Wizard",
    "vendorDescription": "Test description",
    "vendorPrice": 7000,
    "selectedColors": [{"id": 1, "name": "Noir", "colorCode": "#000000"}],
    "selectedSizes": [{"id": 1, "sizeName": "M"}],
    "productImages": {
      "baseImage": "data:image/png;base64,iVBORw0KGgo..."
    },
    "isWizardProduct": true
  }'
```

**Résultat attendu :** 201 Created, produit créé sans designId

### **Test 2 : Produit normal (comportement inchangé)**
```bash
curl -X POST http://localhost:3004/vendor/products \
  -H "Content-Type: application/json" \
  -d '{
    "baseProductId": 1,
    "designId": 123,
    "vendorName": "Test Normal",
    "vendorPrice": 7000
  }'
```

**Résultat attendu :** Comportement existant conservé

### **Test 3 : Wizard avec prix insuffisant**
```bash
# Avec vendorPrice trop bas
curl -X POST http://localhost:3004/vendor/products \
  -d '{"baseProductId": 1, "vendorPrice": 5000, "isWizardProduct": true, ...}'
```

**Résultat attendu :** 400 Bad Request, "Prix trop bas. Minimum: XXX FCFA"

---

## 📊 RÉSULTAT FINAL

Après cette modification :

✅ **Produits wizard** : Créés sans designId, avec leurs propres images
✅ **Produits normaux** : Fonctionnement inchangé (avec designId obligatoire)
✅ **Validation** : Marge 10% minimum respectée
✅ **Images** : Sauvegarde base64 → fichiers
✅ **Métadonnées** : Calculs profit/commission automatiques

Le wizard `/vendeur/create-product` fonctionnera alors parfaitement sans demander de création de design.