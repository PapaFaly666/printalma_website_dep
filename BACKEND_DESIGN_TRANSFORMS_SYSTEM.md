# Backend - Système de Sauvegarde des Transformations de Design

## 🎯 Objectif
Implémenter un système backend pour sauvegarder et restaurer automatiquement les modifications de design (position, échelle, recadrage) effectuées par les vendeurs sur les produits.

## 📋 Spécifications API

### 1. **Structure de Données**

```sql
-- Nouvelle table pour stocker les transformations
CREATE TABLE vendor_design_transforms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    product_id INT NOT NULL,
    design_url VARCHAR(500) NOT NULL,
    transforms JSON NOT NULL, -- Stockage des transformations par délimitation
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index pour performance
    INDEX idx_vendor_product (vendor_id, product_id),
    INDEX idx_design_url (design_url),
    
    -- Contraintes
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT unique_vendor_product_design UNIQUE (vendor_id, product_id, design_url)
);
```

**Structure JSON des transformations :**
```json
{
  "0": {
    "x": 25.5,
    "y": 30.2,
    "scale": 0.8
  },
  "1": {
    "x": -10.0,
    "y": 15.5,
    "scale": 1.2
  }
}
```

### 2. **Endpoints API**

#### **POST /api/vendor/design-transforms**
**Sauvegarde les transformations**

```typescript
// Request Body
interface SaveTransformsRequest {
  productId: number;
  designUrl: string;
  transforms: Record<number, {
    x: number;
    y: number;
    scale: number;
  }>;
  lastModified: number;
}

// Response
interface SaveTransformsResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    lastModified: string;
  };
}
```

**Implémentation :**
```javascript
router.post('/design-transforms', authenticateVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { productId, designUrl, transforms, lastModified } = req.body;

    // Validation
    if (!productId || !designUrl || !transforms) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes : productId, designUrl et transforms requis'
      });
    }

    // Vérifier que le vendeur a accès à ce produit
    const hasAccess = await checkVendorProductAccess(vendorId, productId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce produit'
      });
    }

    // Upsert des transformations
    const query = `
      INSERT INTO vendor_design_transforms 
      (vendor_id, product_id, design_url, transforms, last_modified)
      VALUES (?, ?, ?, ?, FROM_UNIXTIME(?))
      ON DUPLICATE KEY UPDATE
      transforms = VALUES(transforms),
      last_modified = VALUES(last_modified)
    `;

    const [result] = await db.execute(query, [
      vendorId,
      productId,
      designUrl,
      JSON.stringify(transforms),
      lastModified / 1000 // Convertir ms en secondes
    ]);

    res.json({
      success: true,
      message: 'Transformations sauvegardées',
      data: {
        id: result.insertId || result.insertId,
        lastModified: new Date(lastModified).toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur sauvegarde transformations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la sauvegarde'
    });
  }
});
```

#### **GET /api/vendor/design-transforms/:productId**
**Charge les transformations sauvegardées**

```typescript
// Query Parameters
interface LoadTransformsQuery {
  designUrl: string;
}

// Response
interface LoadTransformsResponse {
  success: boolean;
  data: {
    productId: number;
    designUrl: string;
    transforms: Record<number, {
      x: number;
      y: number;
      scale: number;
    }>;
    lastModified: number;
  } | null;
}
```

**Implémentation :**
```javascript
router.get('/design-transforms/:productId', authenticateVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { productId } = req.params;
    const { designUrl } = req.query;

    if (!designUrl) {
      return res.status(400).json({
        success: false,
        message: 'Parameter designUrl requis'
      });
    }

    // Vérifier l'accès
    const hasAccess = await checkVendorProductAccess(vendorId, parseInt(productId));
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce produit'
      });
    }

    // Charger les transformations
    const query = `
      SELECT product_id, design_url, transforms, 
             UNIX_TIMESTAMP(last_modified) * 1000 as last_modified
      FROM vendor_design_transforms
      WHERE vendor_id = ? AND product_id = ? AND design_url = ?
      ORDER BY last_modified DESC
      LIMIT 1
    `;

    const [rows] = await db.execute(query, [vendorId, productId, designUrl]);

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const transform = rows[0];
    res.json({
      success: true,
      data: {
        productId: parseInt(productId),
        designUrl: designUrl,
        transforms: JSON.parse(transform.transforms),
        lastModified: transform.last_modified
      }
    });

  } catch (error) {
    console.error('❌ Erreur chargement transformations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du chargement'
    });
  }
});
```

### 3. **Fonction utilitaire**

```javascript
// Vérifier l'accès du vendeur au produit
async function checkVendorProductAccess(vendorId, productId) {
  try {
    const query = `
      SELECT 1 FROM vendor_products vp
      WHERE vp.vendor_id = ? AND vp.admin_product_id = ?
      LIMIT 1
    `;
    
    const [rows] = await db.execute(query, [vendorId, productId]);
    return rows.length > 0;
  } catch (error) {
    console.error('Erreur vérification accès produit:', error);
    return false;
  }
}
```

## 🔄 **Flux de Fonctionnement**

### Sauvegarde Automatique (Frontend)
1. **Utilisateur modifie** position/échelle du design
2. **Hook useDesignTransforms** détecte le changement
3. **Debounce de 1 seconde** évite trop d'appels
4. **Appel API POST** avec fallback localStorage
5. **Indicateur visuel** "Sauvegarde..." pendant l'opération

### Restauration au Chargement
1. **Page se charge** avec productId + designUrl
2. **Appel API GET** pour charger les transformations
3. **Restauration des positions/échelles** sauvegardées
4. **Indicateur "Chargement des modifications..."**

## 🚀 **Optimisations**

### Performance
- **Index sur (vendor_id, product_id)** pour requêtes rapides
- **Contrainte unique** pour éviter les doublons
- **JSON pour stockage flexible** des transformations

### Robustesse
- **Fallback localStorage** si API indisponible
- **Validation stricte** des permissions vendeur
- **Gestion d'erreurs complète** avec messages explicites

### UX
- **Sauvegarde transparente** avec debounce intelligent
- **Indicateurs visuels** pour feedback utilisateur
- **Boutons Reset/Sauver** pour contrôle manuel

## 📝 **Tests Recommandés**

```javascript
// Test de sauvegarde
POST /api/vendor/design-transforms
{
  "productId": 123,
  "designUrl": "https://example.com/design.png",
  "transforms": {
    "0": { "x": 25, "y": 30, "scale": 0.8 },
    "1": { "x": -10, "y": 15, "scale": 1.2 }
  },
  "lastModified": 1672531200000
}

// Test de chargement
GET /api/vendor/design-transforms/123?designUrl=https://example.com/design.png

// Test de permissions
// Tenter d'accéder au produit d'un autre vendeur (doit échouer)
```

## 🎯 **Résultat Attendu**

✅ **Sauvegarde automatique** des modifications vendeur  
✅ **Restauration transparente** au rechargement  
✅ **Fallback localStorage** si problème réseau  
✅ **Performance optimale** avec index et debounce  
✅ **Sécurité robuste** avec vérification des permissions  
✅ **UX fluide** avec indicateurs visuels  

---

**Note :** Cette implémentation évite les boucles infinies grâce au debounce et ne sauvegarde pas pendant le chargement initial, garantissant une expérience utilisateur optimale. 