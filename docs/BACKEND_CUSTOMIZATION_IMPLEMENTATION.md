# Implémentation Backend : Contrôleurs et Routes

## 📁 Structure des fichiers

```
backend/
├── controllers/
│   └── customizationController.js
├── routes/
│   └── customizationRoutes.js
├── models/
│   ├── Customization.js
│   └── index.js
├── middleware/
│   ├── auth.js
│   └── validateCustomization.js
└── migrations/
    ├── XXXXXX-create-customizations.js
    └── XXXXXX-add-customization-to-order-items.js
```

---

## 🎛️ Contrôleur : customizationController.js

```javascript
// controllers/customizationController.js
const { Customization, Product, ColorVariation, ProductImage, User, Order } = require('../models');

/**
 * Créer une nouvelle personnalisation
 * POST /api/customizations
 */
exports.createCustomization = async (req, res) => {
  try {
    const {
      productId,
      colorVariationId,
      viewId,
      designElements,
      sizeSelections,
      sessionId,
      previewImageUrl
    } = req.body;

    // Validation des champs requis
    if (!productId || !colorVariationId || !viewId || !designElements) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, colorVariationId, viewId, designElements'
      });
    }

    // Valider que designElements est un tableau
    if (!Array.isArray(designElements)) {
      return res.status(400).json({
        success: false,
        error: 'designElements must be an array'
      });
    }

    // Vérifier que le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Vérifier que la variation de couleur existe
    const colorVariation = await ColorVariation.findByPk(colorVariationId);
    if (!colorVariation) {
      return res.status(404).json({
        success: false,
        error: 'Color variation not found'
      });
    }

    // Vérifier que la vue existe
    const view = await ProductImage.findByPk(viewId);
    if (!view) {
      return res.status(404).json({
        success: false,
        error: 'View not found'
      });
    }

    // Récupérer l'utilisateur (null si guest)
    const userId = req.user?.id || null;

    // Calculer le prix total
    let totalPrice = 0;
    if (sizeSelections && Array.isArray(sizeSelections) && sizeSelections.length > 0) {
      const productPrice = product.suggestedPrice || product.price;
      totalPrice = sizeSelections.reduce((sum, selection) => {
        return sum + (productPrice * selection.quantity);
      }, 0);
    }

    // Créer la personnalisation
    const customization = await Customization.create({
      userId,
      sessionId: userId ? null : sessionId,
      productId,
      colorVariationId,
      viewId,
      designElements: JSON.stringify(designElements),
      sizeSelections: sizeSelections ? JSON.stringify(sizeSelections) : null,
      previewImageUrl,
      totalPrice,
      status: 'saved'
    });

    console.log('✅ [CustomizationController] Personnalisation créée:', customization.id);

    // Retourner avec les JSON parsés
    const response = customization.toJSON();
    response.designElements = JSON.parse(response.designElements);
    if (response.sizeSelections) {
      response.sizeSelections = JSON.parse(response.sizeSelections);
    }

    res.status(201).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ [CustomizationController] Error creating customization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Récupérer une personnalisation par ID
 * GET /api/customizations/:id
 */
exports.getCustomization = async (req, res) => {
  try {
    const { id } = req.params;

    const customization = await Customization.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'suggestedPrice']
        },
        {
          model: ColorVariation,
          as: 'colorVariation',
          attributes: ['id', 'name', 'colorCode']
        },
        {
          model: ProductImage,
          as: 'view',
          attributes: ['id', 'url', 'viewType']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    // Parser les JSON
    const response = customization.toJSON();
    response.designElements = JSON.parse(response.designElements);
    if (response.sizeSelections) {
      response.sizeSelections = JSON.parse(response.sizeSelections);
    }

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ [CustomizationController] Error fetching customization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Récupérer les personnalisations de l'utilisateur connecté
 * GET /api/customizations/user/me
 */
exports.getMyCustomizations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const customizations = await Customization.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'suggestedPrice']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Parser les JSON pour chaque personnalisation
    const response = customizations.map(c => {
      const data = c.toJSON();
      data.designElements = JSON.parse(data.designElements);
      if (data.sizeSelections) {
        data.sizeSelections = JSON.parse(data.sizeSelections);
      }
      return data;
    });

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ [CustomizationController] Error fetching user customizations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Récupérer les personnalisations d'une session (guest)
 * GET /api/customizations/session/:sessionId
 */
exports.getSessionCustomizations = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.query;

    const where = { sessionId };
    if (status) {
      where.status = status;
    }

    const customizations = await Customization.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'suggestedPrice']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Parser les JSON
    const response = customizations.map(c => {
      const data = c.toJSON();
      data.designElements = JSON.parse(data.designElements);
      if (data.sizeSelections) {
        data.sizeSelections = JSON.parse(data.sizeSelections);
      }
      return data;
    });

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ [CustomizationController] Error fetching session customizations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Mettre à jour une personnalisation
 * PUT /api/customizations/:id
 */
exports.updateCustomization = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      designElements,
      sizeSelections,
      previewImageUrl,
      status
    } = req.body;

    const customization = await Customization.findByPk(id);

    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    // Vérifier les permissions
    const userId = req.user?.id;
    if (userId && customization.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};

    if (designElements !== undefined) {
      updateData.designElements = JSON.stringify(designElements);
    }
    if (sizeSelections !== undefined) {
      updateData.sizeSelections = sizeSelections ? JSON.stringify(sizeSelections) : null;
    }
    if (previewImageUrl !== undefined) {
      updateData.previewImageUrl = previewImageUrl;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    // Mettre à jour
    await customization.update(updateData);

    // Retourner avec les JSON parsés
    const response = customization.toJSON();
    response.designElements = JSON.parse(response.designElements);
    if (response.sizeSelections) {
      response.sizeSelections = JSON.parse(response.sizeSelections);
    }

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ [CustomizationController] Error updating customization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Supprimer une personnalisation
 * DELETE /api/customizations/:id
 */
exports.deleteCustomization = async (req, res) => {
  try {
    const { id } = req.params;

    const customization = await Customization.findByPk(id);

    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    // Vérifier les permissions
    const userId = req.user?.id;
    if (userId && customization.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Ne pas supprimer si déjà commandé
    if (customization.status === 'ordered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete ordered customization'
      });
    }

    await customization.destroy();

    res.json({
      success: true,
      message: 'Customization deleted successfully'
    });

  } catch (error) {
    console.error('❌ [CustomizationController] Error deleting customization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Migrer les personnalisations d'une session vers un utilisateur
 * POST /api/customizations/migrate-session
 */
exports.migrateSessionToUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    // Mettre à jour toutes les personnalisations de la session
    const [updatedCount] = await Customization.update(
      {
        userId,
        sessionId: null
      },
      {
        where: {
          sessionId,
          userId: null
        }
      }
    );

    console.log(`✅ [CustomizationController] Migrated ${updatedCount} customizations from session to user`);

    res.json({
      success: true,
      message: `${updatedCount} customization(s) migrated successfully`
    });

  } catch (error) {
    console.error('❌ [CustomizationController] Error migrating customizations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = exports;
```

---

## 🛣️ Routes : customizationRoutes.js

```javascript
// routes/customizationRoutes.js
const express = require('express');
const router = express.Router();
const customizationController = require('../controllers/customizationController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { validateCustomization } = require('../middleware/validateCustomization');

/**
 * POST /api/customizations
 * Créer une nouvelle personnalisation
 * Auth optionnelle (guest ou utilisateur connecté)
 */
router.post(
  '/',
  optionalAuthenticate,
  validateCustomization,
  customizationController.createCustomization
);

/**
 * GET /api/customizations/:id
 * Récupérer une personnalisation par ID
 * Auth optionnelle
 */
router.get(
  '/:id',
  optionalAuthenticate,
  customizationController.getCustomization
);

/**
 * GET /api/customizations/user/me
 * Récupérer les personnalisations de l'utilisateur connecté
 * Auth requise
 */
router.get(
  '/user/me',
  authenticate,
  customizationController.getMyCustomizations
);

/**
 * GET /api/customizations/session/:sessionId
 * Récupérer les personnalisations d'une session (guest)
 * Pas d'auth requise
 */
router.get(
  '/session/:sessionId',
  customizationController.getSessionCustomizations
);

/**
 * PUT /api/customizations/:id
 * Mettre à jour une personnalisation
 * Auth optionnelle
 */
router.put(
  '/:id',
  optionalAuthenticate,
  customizationController.updateCustomization
);

/**
 * DELETE /api/customizations/:id
 * Supprimer une personnalisation
 * Auth optionnelle
 */
router.delete(
  '/:id',
  optionalAuthenticate,
  customizationController.deleteCustomization
);

/**
 * POST /api/customizations/migrate-session
 * Migrer les personnalisations d'une session vers un utilisateur
 * Auth requise
 */
router.post(
  '/migrate-session',
  authenticate,
  customizationController.migrateSessionToUser
);

module.exports = router;
```

---

## 🔐 Middleware : auth.js

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware d'authentification requis
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Enlever 'Bearer '

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    console.error('❌ [Auth] Error authenticating:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: error.message
    });
  }
};

/**
 * Middleware d'authentification optionnelle
 * Continue même si pas de token
 */
exports.optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token, continuer sans utilisateur
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    req.user = user || null;
    next();

  } catch (error) {
    // Erreur de token, continuer sans utilisateur
    req.user = null;
    next();
  }
};

module.exports = exports;
```

---

## ✅ Middleware : validateCustomization.js

```javascript
// middleware/validateCustomization.js

/**
 * Valider les données de personnalisation
 */
exports.validateCustomization = (req, res, next) => {
  const {
    productId,
    colorVariationId,
    viewId,
    designElements,
    sizeSelections
  } = req.body;

  // Vérifier les champs requis
  if (!productId || !colorVariationId || !viewId || !designElements) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      required: ['productId', 'colorVariationId', 'viewId', 'designElements']
    });
  }

  // Vérifier les types
  if (typeof productId !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'productId must be a number'
    });
  }

  if (typeof colorVariationId !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'colorVariationId must be a number'
    });
  }

  if (typeof viewId !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'viewId must be a number'
    });
  }

  // Vérifier designElements
  if (!Array.isArray(designElements)) {
    return res.status(400).json({
      success: false,
      error: 'designElements must be an array'
    });
  }

  // Valider chaque élément de design
  for (let i = 0; i < designElements.length; i++) {
    const element = designElements[i];

    // Champs requis pour tous les éléments
    const requiredFields = ['id', 'type', 'x', 'y', 'width', 'height', 'rotation', 'zIndex'];
    for (const field of requiredFields) {
      if (element[field] === undefined) {
        return res.status(400).json({
          success: false,
          error: `designElements[${i}].${field} is required`
        });
      }
    }

    // Valider le type
    if (!['text', 'image'].includes(element.type)) {
      return res.status(400).json({
        success: false,
        error: `designElements[${i}].type must be 'text' or 'image'`
      });
    }

    // Valider les coordonnées (0-1)
    if (element.x < 0 || element.x > 1 || element.y < 0 || element.y > 1) {
      return res.status(400).json({
        success: false,
        error: `designElements[${i}] coordinates (x, y) must be between 0 and 1`
      });
    }

    // Valider les dimensions (positives)
    if (element.width <= 0 || element.height <= 0) {
      return res.status(400).json({
        success: false,
        error: `designElements[${i}] dimensions (width, height) must be positive`
      });
    }

    // Validation spécifique au type texte
    if (element.type === 'text' && !element.text) {
      return res.status(400).json({
        success: false,
        error: `designElements[${i}].text is required for text elements`
      });
    }

    // Validation spécifique au type image
    if (element.type === 'image' && !element.imageUrl) {
      return res.status(400).json({
        success: false,
        error: `designElements[${i}].imageUrl is required for image elements`
      });
    }
  }

  // Valider sizeSelections si présent
  if (sizeSelections !== undefined) {
    if (!Array.isArray(sizeSelections)) {
      return res.status(400).json({
        success: false,
        error: 'sizeSelections must be an array'
      });
    }

    for (let i = 0; i < sizeSelections.length; i++) {
      const selection = sizeSelections[i];

      if (!selection.size || typeof selection.size !== 'string') {
        return res.status(400).json({
          success: false,
          error: `sizeSelections[${i}].size is required and must be a string`
        });
      }

      if (typeof selection.quantity !== 'number' || selection.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: `sizeSelections[${i}].quantity must be a positive number`
        });
      }
    }
  }

  // Tout est valide
  next();
};

module.exports = exports;
```

---

## 📝 Intégration dans app.js

```javascript
// app.js ou server.js
const express = require('express');
const cors = require('cors');
const customizationRoutes = require('./routes/customizationRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limite augmentée pour les images base64
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/customizations', customizationRoutes);

// ... autres routes

// Démarrer le serveur
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;
```

---

## 🧪 Tests avec cURL

### Créer une personnalisation (guest)

```bash
curl -X POST http://localhost:3004/api/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 42,
    "colorVariationId": 5,
    "viewId": 12,
    "designElements": [
      {
        "id": "element-123",
        "type": "text",
        "x": 0.5,
        "y": 0.3,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 1,
        "text": "Mon texte",
        "fontSize": 32,
        "fontFamily": "Arial",
        "color": "#FF0000"
      }
    ],
    "sizeSelections": [
      { "size": "M", "quantity": 2 }
    ],
    "sessionId": "guest-123-xyz"
  }'
```

### Créer une personnalisation (utilisateur connecté)

```bash
curl -X POST http://localhost:3004/api/customizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "productId": 42,
    "colorVariationId": 5,
    "viewId": 12,
    "designElements": [...],
    "sizeSelections": [...]
  }'
```

### Récupérer une personnalisation

```bash
curl http://localhost:3004/api/customizations/1
```

### Récupérer les personnalisations de l'utilisateur

```bash
curl http://localhost:3004/api/customizations/user/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Mettre à jour une personnalisation

```bash
curl -X PUT http://localhost:3004/api/customizations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_cart"
  }'
```

### Supprimer une personnalisation

```bash
curl -X DELETE http://localhost:3004/api/customizations/1
```

---

Ce fichier fournit une implémentation complète et prête à l'emploi du système de personnalisation côté backend !
