# BACKEND - CORRECTION URGENTE PRODUIT 404

## PROBLÈME IDENTIFIÉ
L'endpoint `GET /products/{id}` retourne 404 pour le produit ID 169, même avec les fallbacks testés :
- `/products/169` → 404
- `/vendor/admin/products/169` → 404  
- `/api/vendor/admin/products/169` → 404

## DIAGNOSTICS À EFFECTUER

### 1. Vérifier l'existence du produit
```sql
-- Vérifier si le produit existe
SELECT id, name, status, vendorId, deletedAt 
FROM products 
WHERE id = 169;

-- Vérifier les produits autour
SELECT id, name, status, vendorId, deletedAt 
FROM products 
WHERE id BETWEEN 165 AND 175
ORDER BY id;
```

### 2. Vérifier les routes backend
Contrôler que ces routes existent et fonctionnent :

```javascript
// Routes à vérifier dans le backend
app.get('/products/:id', getProductById);
app.get('/vendor/admin/products/:id', authenticateVendor, getVendorProductById);  
app.get('/api/vendor/admin/products/:id', authenticateVendor, getVendorProductById);
```

## CORRECTIONS À APPLIQUER

### 1. Route principale produits publics
```javascript
// Dans routes/products.js ou controllers/productController.js
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Recherche avec jointures complètes
    const product = await Product.findOne({
      where: { 
        id: parseInt(id),
        deletedAt: null  // Exclure les produits supprimés
      },
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: ColorVariation,
          as: 'colorVariations',
          include: [
            {
              model: ProductImage,
              as: 'images',
              include: [{
                model: Delimitation,
                as: 'delimitations'
              }]
            }
          ]
        },
        {
          model: Size,
          as: 'sizes'
        },
        {
          model: Design,
          as: 'design'
        }
      ]
    });

    if (!product) {
      // Log pour debug
      console.log(`❌ Produit ${id} non trouvé`);
      
      // Vérifier si supprimé
      const deletedProduct = await Product.findOne({
        where: { id: parseInt(id) },
        paranoid: false
      });
      
      if (deletedProduct && deletedProduct.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'Produit supprimé',
          error: 'PRODUCT_DELETED'
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
        error: 'PRODUCT_NOT_FOUND'
      });
    }

    console.log(`✅ Produit ${id} trouvé: ${product.name}`);
    
    res.json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération du produit ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
```

### 2. Route vendeur avec authentification
```javascript
// Dans routes/vendor.js ou controllers/vendorController.js
exports.getVendorProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user?.id || req.vendorId;
    
    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }
    
    const product = await Product.findOne({
      where: { 
        id: parseInt(id),
        vendorId: vendorId,  // Produit appartient au vendeur
        deletedAt: null
      },
      include: [
        // Mêmes includes que ci-dessus
        {
          model: Category,
          as: 'category'
        },
        {
          model: ColorVariation,
          as: 'colorVariations',
          include: [
            {
              model: ProductImage,
              as: 'images',
              include: [{
                model: Delimitation,
                as: 'delimitations'
              }]
            }
          ]
        },
        {
          model: Size,
          as: 'sizes'
        },
        {
          model: Design,
          as: 'design'
        }
      ]
    });

    if (!product) {
      console.log(`❌ Produit ${id} non trouvé pour vendeur ${vendorId}`);
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé ou non autorisé'
      });
    }

    console.log(`✅ Produit vendeur ${id} trouvé: ${product.name}`);
    
    res.json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error(`❌ Erreur vendeur produit ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
```

### 3. Route admin (fallback ultime)
```javascript
// Dans routes/admin.js
exports.getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Admin peut voir tous les produits, même supprimés
    const product = await Product.findOne({
      where: { id: parseInt(id) },
      paranoid: false,  // Inclure les supprimés
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: ColorVariation,
          as: 'colorVariations',
          include: [
            {
              model: ProductImage,
              as: 'images',
              include: [{
                model: Delimitation,
                as: 'delimitations'
              }]
            }
          ]
        },
        {
          model: Size,
          as: 'sizes'
        },
        {
          model: Design,
          as: 'design'
        },
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit inexistant'
      });
    }

    res.json({
      success: true,
      data: product,
      meta: {
        isDeleted: !!product.deletedAt,
        deletedAt: product.deletedAt
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur admin produit ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
```

### 4. Configuration des routes
```javascript
// Dans app.js ou routes/index.js

// Routes publiques
app.get('/products/:id', productController.getProductById);

// Routes vendeur (avec authentification)
app.get('/vendor/admin/products/:id', 
  authenticateVendor, 
  vendorController.getVendorProductById
);

app.get('/api/vendor/admin/products/:id', 
  authenticateVendor, 
  vendorController.getVendorProductById
);

// Routes admin
app.get('/admin/products/:id', 
  authenticateAdmin, 
  adminController.getAdminProductById
);

app.get('/api/admin/products/:id', 
  authenticateAdmin, 
  adminController.getAdminProductById
);
```

### 5. Middleware d'authentification
```javascript
// Dans middleware/auth.js
exports.authenticateVendor = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.role !== 'VENDOR') {
      return res.status(403).json({
        success: false,
        message: 'Accès vendeur requis'
      });
    }

    req.user = user;
    req.vendorId = user.id;
    next();
    
  } catch (error) {
    console.error('Erreur authentification vendeur:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};
```

## TESTS À EFFECTUER

### 1. Test direct en base
```sql
-- Vérifier l'existence
SELECT COUNT(*) FROM products WHERE id = 169;

-- Vérifier avec détails
SELECT p.id, p.name, p.status, p.vendorId, p.deletedAt,
       v.firstName, v.lastName, v.email
FROM products p
LEFT JOIN users v ON p.vendorId = v.id
WHERE p.id = 169;
```

### 2. Test endpoints
```bash
# Test endpoint principal
curl -X GET http://localhost:3004/products/169

# Test endpoint vendeur (avec token)
curl -X GET http://localhost:3004/vendor/admin/products/169 \
  -H "Cookie: token=YOUR_TOKEN"

# Test endpoint admin
curl -X GET http://localhost:3004/admin/products/169 \
  -H "Cookie: token=ADMIN_TOKEN"
```

### 3. Logs de debug
Ajouter ces logs dans les contrôleurs :
```javascript
console.log(`🔍 Recherche produit ID: ${id}`);
console.log(`👤 Utilisateur: ${req.user?.id} (${req.user?.role})`);
console.log(`📦 Produit trouvé:`, product ? `${product.name} (${product.status})` : 'Non trouvé');
```

## PRIORITÉS

1. **URGENT** : Vérifier l'existence du produit 169 en base
2. **URGENT** : Corriger le contrôleur principal `/products/:id`
3. **IMPORTANT** : Ajouter les logs de debug
4. **IMPORTANT** : Tester tous les endpoints
5. **MOYEN** : Optimiser les requêtes avec includes

## RÉSULTAT ATTENDU

Après correction, ces appels doivent fonctionner :
- `GET /products/169` → Succès si produit existe et pas supprimé
- `GET /vendor/admin/products/169` → Succès si vendeur propriétaire
- `GET /admin/products/169` → Succès pour admin même si supprimé

Le frontend pourra alors afficher correctement les détails du produit 169. 