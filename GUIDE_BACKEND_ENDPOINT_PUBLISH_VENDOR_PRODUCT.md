# 🚀 GUIDE BACKEND - Endpoint Publication Produit Vendeur

## 📋 PROBLÈME IDENTIFIÉ

Le frontend appelle l'endpoint suivant qui retourne une erreur 404 :
```
PATCH http://localhost:3004/vendor/products/122/publish
```

**Erreur :** `404 (Not Found)`

---

## 🎯 SOLUTION À IMPLÉMENTER

### **Endpoint Requis :**
```
PATCH /vendor/products/:id/publish
```

### **Fonctionnalité :**
Changer le statut d'un produit vendeur de `DRAFT` ou `PENDING` vers `PUBLISHED`

---

## 🔧 IMPLÉMENTATION BACKEND

### **1. Route à Ajouter dans `routes/vendor.js`**

```javascript
// routes/vendor.js
const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticateVendor } = require('../middleware/auth');

// ✅ NOUVEL ENDPOINT : Publication d'un produit
router.patch('/products/:id/publish', authenticateVendor, vendorController.publishProduct);

// ... autres routes existantes ...

module.exports = router;
```

### **2. Controller à Ajouter dans `controllers/vendorController.js`**

```javascript
// controllers/vendorController.js

/**
 * 🚀 PUBLICATION D'UN PRODUIT VENDEUR
 * PATCH /vendor/products/:id/publish
 * 
 * Change le statut d'un produit de DRAFT/PENDING vers PUBLISHED
 */
exports.publishProduct = async (req, res) => {
  try {
    console.log('🚀 === PUBLICATION PRODUIT VENDEUR ===');
    
    const { id } = req.params;
    const vendorId = req.user.id; // Récupéré du middleware d'authentification
    
    console.log('📋 Paramètres:', { productId: id, vendorId });
    
    // ✅ VALIDATION DES PARAMÈTRES
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de produit invalide'
      });
    }
    
    const productId = Number(id);
    
    // ✅ RÉCUPÉRATION DU PRODUIT
    const product = await VendorProduct.findOne({
      where: {
        id: productId,
        vendorId: vendorId
      }
    });
    
    if (!product) {
      console.log('❌ Produit non trouvé:', { productId, vendorId });
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé ou accès refusé'
      });
    }
    
    console.log('📦 Produit trouvé:', {
      id: product.id,
      status: product.status,
      vendorId: product.vendorId
    });
    
    // ✅ VÉRIFICATION DU STATUT ACTUEL
    if (product.status === 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        message: 'Le produit est déjà publié'
      });
    }
    
    if (product.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de publier un produit rejeté'
      });
    }
    
    // ✅ VÉRIFICATION DE LA VALIDATION (si applicable)
    if (product.requiresValidation && !product.isValidated) {
      return res.status(400).json({
        success: false,
        message: 'Le produit doit être validé avant publication'
      });
    }
    
    // ✅ MISE À JOUR DU STATUT
    const previousStatus = product.status;
    const newStatus = 'PUBLISHED';
    
    await product.update({
      status: newStatus,
      publishedAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Statut mis à jour:', {
      productId,
      previousStatus,
      newStatus,
      publishedAt: product.publishedAt
    });
    
    // ✅ RÉPONSE DE SUCCÈS
    res.json({
      success: true,
      message: 'Produit publié avec succès',
      product: {
        id: product.id,
        name: product.vendorName,
        status: product.status,
        publishedAt: product.publishedAt
      },
      previousStatus,
      newStatus
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la publication:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur technique'
    });
  }
};
```

### **3. Modèle VendorProduct (si pas encore créé)**

```javascript
// models/VendorProduct.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VendorProduct = sequelize.define('VendorProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  baseProductId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  vendorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  vendorDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  vendorPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  vendorStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  status: {
    type: DataTypes.ENUM('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'),
    defaultValue: 'DRAFT'
  },
  
  requiresValidation: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  isValidated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  designUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  finalImagesBase64: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'vendor_products',
  timestamps: true
});

module.exports = VendorProduct;
```

### **4. Middleware d'Authentification (si pas encore créé)**

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 🔐 MIDDLEWARE D'AUTHENTIFICATION VENDEUR
 * Vérifie que l'utilisateur est connecté et a le rôle VENDOR
 */
const authenticateVendor = async (req, res, next) => {
  try {
    console.log('🔐 === AUTHENTIFICATION VENDEUR ===');
    
    // ✅ RÉCUPÉRATION DU TOKEN
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    
    if (!token) {
      console.log('❌ Aucun token fourni');
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }
    
    console.log('🔑 Token récupéré, longueur:', token.length);
    
    // ✅ VÉRIFICATION DU TOKEN JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token décodé:', { userId: decoded.id, role: decoded.role });
    
    // ✅ RÉCUPÉRATION DE L'UTILISATEUR
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // ✅ VÉRIFICATION DU RÔLE VENDEUR
    if (user.role !== 'VENDOR') {
      console.log('❌ Rôle insuffisant:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Rôle vendeur requis'
      });
    }
    
    // ✅ VÉRIFICATION DU STATUT DU COMPTE
    if (user.status !== 'ACTIVE') {
      console.log('❌ Compte inactif:', user.status);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Compte inactif'
      });
    }
    
    // ✅ AJOUT DES INFORMATIONS UTILISATEUR À LA REQUÊTE
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    };
    
    console.log('✅ Authentification réussie:', req.user);
    next();
    
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

module.exports = { authenticateVendor };
```

### **5. Configuration App Principal**

```javascript
// app.js ou server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// ✅ MIDDLEWARE DE BASE
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(cookieParser());

// ✅ LIMITES AUGMENTÉES (obligatoire pour les images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ ROUTES
const vendorRoutes = require('./routes/vendor');
app.use('/vendor', vendorRoutes);

// ✅ ROUTE ALTERNATIVE (si nécessaire)
app.use('/api/vendor', vendorRoutes);

console.log('✅ Routes vendeur configurées sur /vendor et /api/vendor');

// ... reste de votre configuration ...
```

---

## 🧪 TEST DE L'IMPLÉMENTATION

### **Script de Test Automatique**

```javascript
// test-publish-endpoint.cjs
const fetch = require('node-fetch');

async function testPublishEndpoint() {
  console.log('🧪 === TEST ENDPOINT PUBLICATION ===\n');
  
  const baseUrl = 'http://localhost:3004';
  const productId = 122; // ID du produit à tester
  
  // 🔑 TOKEN DE TEST (remplacer par un vrai token)
  const authToken = 'VOTRE_TOKEN_JWT_ICI';
  
  try {
    console.log('📡 Test de l\'endpoint PATCH /vendor/products/:id/publish');
    console.log(`🌐 URL: ${baseUrl}/vendor/products/${productId}/publish`);
    console.log(`🔑 Token: ${authToken.substring(0, 20)}...`);
    
    const response = await fetch(`${baseUrl}/vendor/products/${productId}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log(`\n📊 Réponse reçue:`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCÈS !');
      console.log('   Message:', result.message);
      console.log('   Produit:', result.product);
      console.log('   Statut précédent:', result.previousStatus);
      console.log('   Nouveau statut:', result.newStatus);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ ERREUR !');
      console.log('   Message:', errorData.message || 'Aucun message d\'erreur');
      console.log('   Détails:', errorData);
    }
    
  } catch (error) {
    console.error('💥 ERREUR DE CONNEXION:', error.message);
    console.log('\n🔍 Vérifications à faire:');
    console.log('   1. Le serveur backend est-il démarré sur le port 3004 ?');
    console.log('   2. L\'endpoint /vendor/products/:id/publish est-il implémenté ?');
    console.log('   3. Le middleware d\'authentification fonctionne-t-il ?');
  }
}

// Lancer le test
testPublishEndpoint();
```

### **Lancer le Test**

```bash
# Installer node-fetch si nécessaire
npm install node-fetch

# Lancer le test
node test-publish-endpoint.cjs
```

---

## ✅ CHECKLIST D'IMPLÉMENTATION

- [ ] **1. Créer le fichier `routes/vendor.js`** avec la route PATCH
- [ ] **2. Créer le fichier `controllers/vendorController.js`** avec la fonction publishProduct
- [ ] **3. Créer le fichier `models/VendorProduct.js`** (si pas encore créé)
- [ ] **4. Créer le fichier `middleware/auth.js`** avec authenticateVendor
- [ ] **5. Modifier `app.js`** pour ajouter les routes vendeur
- [ ] **6. Configurer les variables d'environnement** (JWT_SECRET, etc.)
- [ ] **7. Tester avec le script de test**

---

## 🔧 VARIABLES D'ENVIRONNEMENT REQUISES

```env
# JWT
JWT_SECRET=votre_secret_jwt_tres_securise

# Database
MONGODB_URI=mongodb://localhost:27017/printalma
# ou
DATABASE_URL=postgresql://user:password@localhost:5432/printalma

# Port (optionnel)
PORT=3004
```

---

## 🚨 DÉPANNAGE RAPIDE

### **Erreur 404 persistante :**
1. Vérifier que la route est bien ajoutée dans `app.js`
2. Vérifier que le fichier `routes/vendor.js` est bien créé
3. Redémarrer le serveur backend

### **Erreur 401 (Unauthorized) :**
1. Vérifier que le middleware d'authentification est bien configuré
2. Vérifier que le token JWT est valide
3. Vérifier que l'utilisateur a bien le rôle VENDOR

### **Erreur 500 (Internal Server Error) :**
1. Vérifier les logs du serveur backend
2. Vérifier que le modèle VendorProduct est bien défini
3. Vérifier la connexion à la base de données

---

## 🎯 RÉSULTAT ATTENDU

Après implémentation, l'endpoint devrait répondre avec :

```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "product": {
    "id": 122,
    "name": "Nom du Produit",
    "status": "PUBLISHED",
    "publishedAt": "2024-01-15T10:30:00.000Z"
  },
  "previousStatus": "DRAFT",
  "newStatus": "PUBLISHED"
}
```

---

## 📞 SUPPORT

Si vous rencontrez des problèmes lors de l'implémentation :

1. **Vérifiez les logs du serveur backend**
2. **Utilisez le script de test fourni**
3. **Vérifiez que tous les fichiers sont créés correctement**
4. **Redémarrez le serveur après modifications**

L'endpoint devrait maintenant fonctionner et permettre la publication des produits vendeur ! 🎉

