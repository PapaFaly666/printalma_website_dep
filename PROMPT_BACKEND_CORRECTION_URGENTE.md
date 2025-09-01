# 🚨 PROMPT BACKEND - CORRECTION URGENTE

## 🎯 PROBLÈME À CORRIGER

**Erreur actuelle :** `"Invalid extension in transformation: auto"`
**Cause :** Mauvaise configuration Cloudinary + confusion stockage design/mockup
**Impact :** Publication vendeur impossible + images pixellisées

---

## ✅ SOLUTION IMMÉDIATE (15 MINUTES)

### 1. CORRIGER L'ERREUR CLOUDINARY (5 min)

**Localiser le fichier d'upload Cloudinary et remplacer :**

```javascript
// ❌ AVANT (ERREUR)
const result = await cloudinary.uploader.upload(imageData, {
  transformation: {
    format: 'auto',  // ← ERREUR ICI
    quality: 85
  }
});

// ✅ APRÈS (CORRIGÉ)
const result = await cloudinary.uploader.upload(imageData, {
  transformation: {
    width: 2000,         // ← Haute résolution
    height: 2000,        // ← Haute résolution
    crop: 'fit',         // ← Préserve proportions
    format: 'webp',      // ← Format corrigé (PAS 'auto')
    quality: 95,         // ← Qualité élevée
    flags: 'progressive' // ← Chargement optimisé
  },
  resource_type: 'image'
});
```

### 2. SÉPARER DESIGN ORIGINAL vs MOCKUPS (10 min)

**Créer 2 méthodes distinctes dans votre service Cloudinary :**

```javascript
// Méthode 1: Design original seul (100% qualité)
async uploadOriginalDesign(designBase64, vendorId) {
  return await cloudinary.uploader.upload(designBase64, {
    folder: 'designs-originals',
    public_id: `design_original_${vendorId}_${Date.now()}`,
    // ✅ AUCUNE transformation = design pur
    resource_type: 'image'
  });
}

// Méthode 2: Mockup avec design incorporé (haute qualité)
async uploadMockupWithDesign(mockupImageBase64, colorName, vendorId) {
  return await cloudinary.uploader.upload(mockupImageBase64, {
    folder: 'mockups-with-design',
    public_id: `mockup_${vendorId}_${colorName}_${Date.now()}`,
    transformation: {
      width: 2000,
      height: 2000,
      crop: 'fit',
      format: 'webp',      // ✅ PAS 'auto'
      quality: 95,
      flags: 'progressive'
    },
    resource_type: 'image'
  });
}
```

### 3. MODIFIER LE CONTROLLER VENDEUR

**Dans votre controller de création produit :**

```javascript
exports.createVendorProduct = async (req, res) => {
  const { designUrl, finalImagesBase64, ...productData } = req.body;
  
  // 1. Upload design original seul
  const designResult = await uploadOriginalDesign(designUrl, req.user.id);
  
  // 2. Upload mockups avec design incorporé
  const mockupResults = {};
  for (const [colorName, mockupImage] of Object.entries(finalImagesBase64)) {
    mockupResults[colorName] = await uploadMockupWithDesign(
      mockupImage, 
      colorName, 
      req.user.id
    );
  }
  
  // 3. Sauvegarder en base avec séparation correcte
  const vendorProduct = await VendorProduct.create({
    ...productData,
    designUrl: designResult.secure_url,        // ✅ Design original seul
    mockupImages: JSON.stringify(mockupResults), // ✅ Mockups avec design
    // ... autres champs
  });
  
  res.status(201).json({
    success: true,
    productId: vendorProduct.id,
    originalDesign: { designUrl: designResult.secure_url },
    mockupsWithDesign: Object.keys(mockupResults).map(color => ({
      colorName: color,
      mockupUrl: mockupResults[color].secure_url,
      width: 2000,
      height: 2000
    }))
  });
};
```

---

## 🗂️ STRUCTURE FINALE ATTENDUE

### Base de Données
```
vendor_products table:
- designUrl = URL design original seul
- mockupImages = JSON des URLs mockups avec design incorporé
```

### Réponse API
```json
{
  "originalDesign": {
    "designUrl": "https://cloudinary.com/designs-originals/design_123.png"
  },
  "mockupsWithDesign": [
    {
      "colorName": "blanc",
      "mockupUrl": "https://cloudinary.com/mockups-with-design/mockup_blanc_123.webp",
      "width": 2000,
      "height": 2000
    }
  ]
}
```

---

## 🧪 TEST RAPIDE

```bash
# Tester la correction
node test-design-mockup-separation.cjs <TOKEN>
```

---

## 🎯 RÉSULTAT ATTENDU

✅ **Erreur Cloudinary corrigée** (format webp au lieu de 'auto')
✅ **Images haute qualité** (2000x2000px au lieu de 1000x1000px)
✅ **Séparation claire** (design original + mockups séparés)
✅ **Publication vendeur fonctionnelle**

---

*🚨 Cette correction doit être appliquée IMMÉDIATEMENT pour débloquer la publication vendeur !* 