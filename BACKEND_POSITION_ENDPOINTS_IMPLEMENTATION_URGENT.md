# 🚨 BACKEND - IMPLÉMENTATION URGENTE ENDPOINTS POSITION + CORRECTION ID

## 📋 PROBLÈME CRITIQUE

Le frontend envoie des requêtes avec `productId: 2` (baseProductId) mais le backend cherche un VendorProduct avec `id: 2` appartenant au vendeur. **Ça n'existe pas !**

### Logs Frontend Actuels :
```
💾 Sauvegarde position: Produit 2 ↔ Design 1
PUT /api/vendor-products/2/designs/1/position/direct → 404
debugInfo: {requestedProductId: 2, requestedDesignId: 1, vendorId: 4}
message: "Produit introuvable"
```

### Vraie Structure des Données :
- `baseProductId: 2` (référence catalogue admin)
- `vendorProduct.id: 37-47` (IDs réels des produits vendeur)
- `vendorId: 4` (ID du vendeur connecté)

---

## 🔧 ENDPOINTS À IMPLÉMENTER

### 1. **GET Position Isolée**
```javascript
// GET /api/vendor-products/:vendorProductId/designs/:designId/position/direct
app.get('/api/vendor-products/:vendorProductId/designs/:designId/position/direct', async (req, res) => {
  try {
    const { vendorProductId, designId } = req.params;
    const vendorId = req.user.id; // Depuis middleware auth
    
    console.log(`🔍 GET Position - VendorProductId: ${vendorProductId}, DesignId: ${designId}, VendorId: ${vendorId}`);
    
    // 🔄 NOUVEAU: Fallback si l'ID fourni est un baseProductId
    if (!vendorProduct) {
      // Essayer de trouver un vendorProduct ayant ce baseProductId
      const mappedByBase = await VendorProduct.findOne({
        where: {
          baseProductId: parseInt(vendorProductId),
          vendorId: vendorId
        }
      });

      if (mappedByBase) {
        console.log('🔁 Mapping baseProductId → vendorProductId:', vendorProductId, '→', mappedByBase.id);
        // Remplacer vendorProduct & update vendorProductId
        vendorProductId = mappedByBase.id;
      } else {
        return res.status(404).json({
          success: false,
          message: "Produit introuvable",
          error: "NOT_FOUND",
          debugInfo: {
            requestedProductId: parseInt(vendorProductId),
            requestedDesignId: parseInt(designId),
            vendorId: vendorId
          }
        });
      }
    }
    
    // Chercher position sauvegardée
    const position = await DesignPosition.findOne({
      where: { 
        vendorProductId: parseInt(vendorProductId),
        designId: parseInt(designId)
      }
    });
    
    if (!position) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        x: position.x,
        y: position.y,
        scale: position.scale || 1,
        rotation: position.rotation || 0,
        constraints: position.constraints || { adaptive: true }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur GET position:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: 'INTERNAL_ERROR'
    });
  }
});
```

### 2. **PUT Sauvegarde Position**
```javascript
// PUT /api/vendor-products/:vendorProductId/designs/:designId/position/direct
app.put('/api/vendor-products/:vendorProductId/designs/:designId/position/direct', async (req, res) => {
  try {
    const { vendorProductId, designId } = req.params;
    const { x, y, scale, rotation, constraints } = req.body;
    const vendorId = req.user.id;
    
    console.log(`💾 PUT Position - VendorProductId: ${vendorProductId}, DesignId: ${designId}, VendorId: ${vendorId}`);
    console.log(`📍 Position data:`, { x, y, scale, rotation });
    
    // 🔄 NOUVEAU: Fallback si l'ID fourni est un baseProductId
    if (!vendorProduct) {
      // Essayer de trouver un vendorProduct ayant ce baseProductId
      const mappedByBase = await VendorProduct.findOne({
        where: {
          baseProductId: parseInt(vendorProductId),
          vendorId: vendorId
        }
      });

      if (mappedByBase) {
        console.log('🔁 Mapping baseProductId → vendorProductId:', vendorProductId, '→', mappedByBase.id);
        // Remplacer vendorProduct & update vendorProductId
        vendorProductId = mappedByBase.id;
      } else {
        return res.status(404).json({
          success: false,
          message: "Produit introuvable",
          error: "NOT_FOUND",
          debugInfo: {
            requestedProductId: parseInt(vendorProductId),
            requestedDesignId: parseInt(designId),
            vendorId: vendorId
          }
        });
      }
    }
    
    // Sauvegarder/mettre à jour position
    const [position, created] = await DesignPosition.upsert({
      vendorProductId: parseInt(vendorProductId),
      designId: parseInt(designId),
      x: parseFloat(x) || 0,
      y: parseFloat(y) || 0,
      scale: parseFloat(scale) || 1,
      rotation: parseFloat(rotation) || 0,
      constraints: constraints || { adaptive: true },
      updatedAt: new Date()
    });
    
    console.log(`✅ Position ${created ? 'créée' : 'mise à jour'}`);
    
    res.status(200).json({
      success: true,
      data: {
        x: position.x,
        y: position.y,
        scale: position.scale,
        rotation: position.rotation,
        constraints: position.constraints,
        created
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur PUT position:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: 'INTERNAL_ERROR'
    });
  }
});
```

### 3. **POST Legacy Transforms (Fallback)**
```javascript
// POST /api/vendor/design-transforms/save
app.post('/api/vendor/design-transforms/save', async (req, res) => {
  try {
    const { productId, designId, transforms } = req.body;
    const vendorId = req.user.id;
    
    console.log(`💾 Legacy Transforms - ProductId: ${productId}, DesignId: ${designId}`);
    
    // ✅ VÉRIFICATION SÉCURISÉE
    const vendorProduct = await VendorProduct.findOne({
      where: { 
        id: parseInt(productId), 
        vendorId: vendorId 
      }
    });
    
    if (!vendorProduct) {
      return res.status(404).json({
        success: false,
        message: "Produit introuvable pour transforms legacy",
        error: "NOT_FOUND"
      });
    }
    
    // Si transforms.positioning existe, le sauvegarder comme position isolée
    if (transforms.positioning) {
      const pos = transforms.positioning;
      await DesignPosition.upsert({
        vendorProductId: parseInt(productId),
        designId: parseInt(designId) || 1,
        x: parseFloat(pos.x) || 0,
        y: parseFloat(pos.y) || 0,
        scale: parseFloat(pos.scale) || 1,
        rotation: parseFloat(pos.rotation) || 0,
        constraints: pos.constraints || { adaptive: true }
      });
      console.log('✅ Position legacy migrée vers système isolé');
    }
    
    res.status(200).json({
      success: true,
      message: 'Transformations legacy sauvegardées',
      migrated: !!transforms.positioning
    });
    
  } catch (error) {
    console.error('❌ Erreur legacy transforms:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
```

---

## 🗄️ MODÈLE BASE DE DONNÉES

### Table `design_positions`
```sql
CREATE TABLE IF NOT EXISTS design_positions (
  id SERIAL PRIMARY KEY,
  vendor_product_id INTEGER NOT NULL,
  design_id INTEGER NOT NULL DEFAULT 1,
  x FLOAT NOT NULL DEFAULT 0,
  y FLOAT NOT NULL DEFAULT 0,
  scale FLOAT NOT NULL DEFAULT 1,
  rotation FLOAT NOT NULL DEFAULT 0,
  constraints JSON DEFAULT '{"adaptive": true}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_position (vendor_product_id, design_id),
  INDEX idx_vendor_product (vendor_product_id),
  INDEX idx_design (design_id)
);
```

### Modèle Sequelize
```javascript
// models/DesignPosition.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DesignPosition = sequelize.define('DesignPosition', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vendorProductId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'vendor_product_id',
      references: {
        model: 'vendor_products',
        key: 'id'
      }
    },
    designId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'design_id'
    },
    x: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    y: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    scale: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1
    },
    rotation: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    constraints: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { adaptive: true }
    }
  }, {
    tableName: 'design_positions',
    timestamps: true,
    underscored: true
  });

  DesignPosition.associate = (models) => {
    DesignPosition.belongsTo(models.VendorProduct, {
      foreignKey: 'vendorProductId',
      as: 'vendorProduct'
    });
  };

  return DesignPosition;
};
```

---

## 🔍 DIAGNOSTIC DES IDS

### Problème Frontend Actuel :
```
validProductId: 2  ❌ (baseProductId)
```

### IDs Corrects à Utiliser :
```sql
-- Vérifier les vrais IDs vendeur
SELECT id, name, base_product_id, vendor_id 
FROM vendor_products 
WHERE vendor_id = 4;

-- Résultat attendu :
-- id=37, name="Tshirt", base_product_id=2, vendor_id=4
-- id=38, name="Tshirt", base_product_id=2, vendor_id=4
-- etc.
```

### Frontend Doit Envoyer :
```
PUT /api/vendor-products/37/designs/1/position/direct  ✅
PUT /api/vendor-products/38/designs/1/position/direct  ✅
```

**PAS :**
```
PUT /api/vendor-products/2/designs/1/position/direct   ❌
```

---

## 🧪 TESTS DE VALIDATION

### 1. Test GET Position
```bash
curl -X GET "http://localhost:3004/api/vendor-products/37/designs/1/position/direct" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": null
}
```

### 2. Test PUT Position
```bash
curl -X PUT "http://localhost:3004/api/vendor-products/37/designs/1/position/direct" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{"x": -26, "y": -76, "scale": 0.408, "rotation": 0}'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "x": -26,
    "y": -76,
    "scale": 0.408,
    "rotation": 0,
    "constraints": {"adaptive": true},
    "created": true
  }
}
```

### 3. Test avec Mauvais ID (doit échouer)
```bash
curl -X PUT "http://localhost:3004/api/vendor-products/2/designs/1/position/direct" \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{"x": 10, "y": 20, "scale": 1, "rotation": 0}'
```

**Réponse attendue :**
```json
{
  "success": false,
  "message": "Produit introuvable",
  "error": "NOT_FOUND",
  "debugInfo": {
    "requestedProductId": 2,
    "requestedDesignId": 1,
    "vendorId": 4,
    "availableProducts": [
      {"id": 37, "name": "Tshirt", "baseProductId": 2},
      {"id": 38, "name": "Tshirt", "baseProductId": 2}
    ]
  }
}
```

---

## 🚀 DÉPLOIEMENT URGENT

1. **Créer la table `design_positions`**
2. **Ajouter le modèle Sequelize**
3. **Implémenter les 3 endpoints**
4. **Tester avec les vrais IDs vendeur (37-47)**
5. **Vérifier les logs de debug**

---

## ✅ RÉSULTAT ATTENDU

### Avant (Actuel) :
```
PUT /api/vendor-products/2/designs/1/position/direct → 404
message: "Produit introuvable"
```

### Après (Corrigé) :
```
PUT /api/vendor-products/37/designs/1/position/direct → 200
{
  "success": true,
  "data": {"x": -26, "y": -76, "scale": 0.408, "rotation": 0}
}
```

**Une fois implémenté, les positions seront sauvegardées et le frontend n'aura plus d'erreurs 404 !** 
 