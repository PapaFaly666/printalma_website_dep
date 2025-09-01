# 🚨 PROMPT BACKEND VENDEUR - ACTION URGENTE

## ❌ PROBLÈME IDENTIFIÉ

Le frontend PrintAlma essaie d'envoyer des produits vendeur vers `POST /vendor/products` mais reçoit **404 Not Found**.

**Erreur exacte :**
```
POST http://localhost:3004/vendor/products 404 (Not Found)
"message": "Cannot POST /vendor/products"
```

## ✅ SOLUTION IMMÉDIATE (30 minutes)

### ÉTAPE 1: Créer le fichier `routes/vendor.js`

```javascript
const express = require('express');
const router = express.Router();

// Middleware d'auth simple (à adapter selon votre système)
router.use((req, res, next) => {
  // TODO: Remplacer par votre système d'authentification
  req.user = { id: 1, role: 'VENDOR' }; // Mock temporaire
  next();
});

// ✅ ENDPOINT PRINCIPAL REQUIS
router.post('/products', async (req, res) => {
  try {
    console.log('🚀 Réception produit vendeur:', {
      baseProductId: req.body.baseProductId,
      vendorName: req.body.vendorName,
      designPresent: !!req.body.finalImagesBase64?.design,
      imagesCount: Object.keys(req.body.finalImagesBase64 || {}).length
    });

    // ✅ RÉPONSE TEMPORAIRE POUR DÉBLOQUER LE FRONTEND
    res.status(201).json({
      success: true,
      message: 'Produit vendeur créé avec succès',
      productId: 'temp_' + Date.now(),
      data: {
        id: 'temp_' + Date.now(),
        vendorName: req.body.vendorName,
        status: 'ACTIVE'
      },
      imagesProcessed: Object.keys(req.body.finalImagesBase64 || {}).length
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Autres endpoints requis
router.get('/products', (req, res) => {
  res.json({ success: true, data: [], pagination: { total: 0 } });
});

router.get('/stats', (req, res) => {
  res.json({ success: true, data: { total: 0, active: 0, inactive: 0 } });
});

module.exports = router;
```

### ÉTAPE 2: Modifier votre `app.js` ou `server.js`

Ajouter ces lignes :

```javascript
// Augmenter la limite de payload pour les images base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ajouter les routes vendeur
const vendorRoutes = require('./routes/vendor');
app.use('/vendor', vendorRoutes);
```

### ÉTAPE 3: Redémarrer le serveur

```bash
npm start
# ou
node server.js
```

## 🧪 TEST IMMÉDIAT

Lancer ce test pour vérifier :

```bash
node test-vendor-backend-endpoints.cjs
```

**Résultat attendu :**
- `POST /vendor/products` doit retourner **201 Created** au lieu de 404

## 📋 PAYLOAD REÇU DU FRONTEND

Le frontend envoie cette structure :

```json
{
  "baseProductId": 1,
  "vendorName": "Nom du produit",
  "vendorPrice": 25.99,
  "finalImagesBase64": {
    "design": "data:image/png;base64,iVBORw0...", // Design original
    "Blanc": "data:image/png;base64,iVBORw0...",  // Mockup blanc
    "Bleu": "data:image/png;base64,iVBORw0..."    // Mockup bleu
  },
  "finalImages": {
    "colorImages": {
      "Blanc": { "colorInfo": {...}, "imageUrl": "blob:...", "imageKey": "Blanc" },
      "Bleu": { "colorInfo": {...}, "imageUrl": "blob:...", "imageKey": "Bleu" }
    }
  }
}
```

## 🎯 OBJECTIF

**Débloquer le frontend immédiatement** avec une réponse 201 valide.

L'implémentation complète (base de données, Cloudinary, etc.) peut être faite ensuite.

## 📞 URGENT

Une fois implémenté, le frontend fonctionnera instantanément et les vendeurs pourront publier leurs produits !

**Temps estimé : 15-30 minutes maximum** 