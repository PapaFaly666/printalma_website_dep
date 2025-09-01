# 🎯 Guide Backend - Filtrage Produits Mockup avec Délimitations

## 📋 **Objectif**
Implémenter dans le backend le filtrage des produits pour `/vendeur/sell-design` qui doit retourner uniquement :
- Produits avec `isReadyProduct: false` 
- ET qui ont des délimitations

## 🔧 **Modifications Backend Requises**

### 1. **Endpoint API - GET /products**

#### **Paramètres de requête**
```javascript
// Endpoint pour récupérer les produits mockup avec délimitations
GET /api/products?isReadyProduct=false&hasDelimitations=true&forVendorDesign=true
```

#### **Logique de filtrage côté serveur**
```javascript
// Dans le contrôleur products
const getProductsForVendorDesign = async (req, res) => {
  try {
    const { isReadyProduct, hasDelimitations, forVendorDesign } = req.query;
    
    // Construire la requête de base
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    // Filtrage par isReadyProduct
    if (isReadyProduct === 'false') {
      query += ' AND isReadyProduct = ?';
      params.push(false);
    }
    
    // Filtrage par présence de délimitations
    if (hasDelimitations === 'true') {
      query += ' AND delimitations IS NOT NULL AND delimitations != "[]" AND delimitations != ""';
    }
    
    // Filtrage spécifique pour vendeur design
    if (forVendorDesign === 'true') {
      query += ' AND status = "PUBLISHED"';
    }
    
    const products = await db.query(query, params);
    
    // Filtrer côté serveur pour s'assurer de la validité
    const filteredProducts = products.filter(product => {
      // Vérifier isReadyProduct
      const isNotReady = product.isReadyProduct === false;
      
      // Vérifier les délimitations
      let hasValidDelimitations = false;
      try {
        const delimitations = JSON.parse(product.delimitations || '[]');
        hasValidDelimitations = Array.isArray(delimitations) && delimitations.length > 0;
      } catch (e) {
        hasValidDelimitations = false;
      }
      
      return isNotReady && hasValidDelimitations;
    });
    
    res.json({
      success: true,
      data: filteredProducts,
      count: filteredProducts.length,
      filters: {
        isReadyProduct: false,
        hasDelimitations: true,
        forVendorDesign: true
      }
    });
    
  } catch (error) {
    console.error('Erreur lors du chargement des produits pour vendeur design:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des produits',
      error: error.message
    });
  }
};
```

### 2. **Structure de Base de Données**

#### **Table products mise à jour**
```sql
-- Ajout du champ isReadyProduct s'il n'existe pas
ALTER TABLE products ADD COLUMN isReadyProduct BOOLEAN DEFAULT false;

-- Ajout du champ delimitations s'il n'existe pas
ALTER TABLE products ADD COLUMN delimitations JSON;

-- Index pour optimiser les requêtes
CREATE INDEX idx_products_isReadyProduct ON products(isReadyProduct);
CREATE INDEX idx_products_delimitations ON products((JSON_LENGTH(delimitations)));
```

#### **Exemple de données**
```sql
-- Produit mockup avec délimitations (AFFICHÉ)
INSERT INTO products (name, description, price, isReadyProduct, delimitations, status) 
VALUES (
  'T-shirt Classique Blanc',
  'T-shirt en coton 100% biologique',
  19.99,
  false,
  '[{"x": 0.1, "y": 0.1, "width": 0.8, "height": 0.8}]',
  'PUBLISHED'
);

-- Produit prêt (NON AFFICHÉ)
INSERT INTO products (name, description, price, isReadyProduct, delimitations, status) 
VALUES (
  'T-shirt Prêt',
  'Produit déjà finalisé',
  25.00,
  true,
  '[]',
  'PUBLISHED'
);

-- Mockup sans délimitations (NON AFFICHÉ)
INSERT INTO products (name, description, price, isReadyProduct, delimitations, status) 
VALUES (
  'Mockup Sans Délimitations',
  'Produit mockup sans délimitations',
  15.00,
  false,
  '[]',
  'PUBLISHED'
);
```

### 3. **Validation et Middleware**

#### **Middleware de validation**
```javascript
// Middleware pour valider les paramètres de requête
const validateVendorDesignParams = (req, res, next) => {
  const { isReadyProduct, hasDelimitations, forVendorDesign } = req.query;
  
  // Validation des paramètres requis
  if (forVendorDesign === 'true') {
    if (isReadyProduct !== 'false') {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre isReadyProduct doit être false pour les vendeurs'
      });
    }
    
    if (hasDelimitations !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre hasDelimitations doit être true pour les vendeurs'
      });
    }
  }
  
  next();
};
```

#### **Route mise à jour**
```javascript
// Route pour les produits vendeur design
router.get('/products', validateVendorDesignParams, getProductsForVendorDesign);
```

### 4. **Tests Backend**

#### **Test unitaire**
```javascript
// test-vendor-design-products.js
const testVendorDesignProducts = async () => {
  console.log('🧪 Test - Produits pour vendeur design');
  
  try {
    // Test 1: Récupération des produits avec filtres
    const response = await fetch('/api/products?isReadyProduct=false&hasDelimitations=true&forVendorDesign=true');
    const data = await response.json();
    
    console.log('✅ Réponse API:', data);
    
    // Vérifications
    const products = data.data || [];
    const allValid = products.every(product => {
      const isNotReady = product.isReadyProduct === false;
      const hasDelimitations = product.delimitations && 
                              Array.isArray(product.delimitations) && 
                              product.delimitations.length > 0;
      
      return isNotReady && hasDelimitations;
    });
    
    console.log('✅ Tous les produits sont valides:', allValid);
    console.log('📊 Nombre de produits retournés:', products.length);
    
    // Afficher les produits
    products.forEach(product => {
      console.log(`- ${product.name} (isReady: ${product.isReadyProduct}, delimitations: ${product.delimitations?.length || 0})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

testVendorDesignProducts();
```

### 5. **Intégration Frontend**

#### **Service API mis à jour**
```javascript
// services/productService.js
export const getProductsForVendorDesign = async () => {
  try {
    const response = await fetch('/api/products?isReadyProduct=false&hasDelimitations=true&forVendorDesign=true');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erreur lors du chargement des produits');
    }
    
    return {
      success: true,
      products: data.data,
      count: data.count
    };
    
  } catch (error) {
    console.error('Erreur lors du chargement des produits pour vendeur design:', error);
    return {
      success: false,
      message: error.message,
      products: []
    };
  }
};
```

#### **Page SellDesignPage mise à jour**
```javascript
// Dans SellDesignPage.tsx
useEffect(() => {
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const result = await getProductsForVendorDesign();
      
      if (result.success) {
        setProducts(result.products);
      } else {
        toast.error(result.message || 'Erreur lors du chargement des produits');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  loadProducts();
}, []);
```

## 🚀 **Déploiement**

### **Étapes de mise en œuvre**

1. **Base de données**
   ```sql
   -- Exécuter les migrations
   ALTER TABLE products ADD COLUMN isReadyProduct BOOLEAN DEFAULT false;
   ALTER TABLE products ADD COLUMN delimitations JSON;
   CREATE INDEX idx_products_isReadyProduct ON products(isReadyProduct);
   ```

2. **Backend**
   ```bash
   # Ajouter le contrôleur et les routes
   # Tester avec les tests unitaires
   npm test test-vendor-design-products.js
   ```

3. **Frontend**
   ```bash
   # Mettre à jour le service API
   # Tester la page /vendeur/sell-design
   ```

## 📊 **Résultat attendu**

- ✅ Seuls les produits avec `isReadyProduct: false` ET des délimitations sont retournés
- ✅ Les produits prêts sont filtrés côté serveur
- ✅ Les mockups sans délimitations sont filtrés côté serveur
- ✅ Validation robuste côté serveur et client
- ✅ Performance optimisée avec des index de base de données

## 🔍 **Debug et Monitoring**

```javascript
// Logs de debug
console.log('🔍 Filtrage produits vendeur design:');
console.log('- isReadyProduct:', isReadyProduct);
console.log('- hasDelimitations:', hasDelimitations);
console.log('- Produits filtrés:', filteredProducts.length);
```

Ce guide garantit une implémentation complète et robuste du filtrage des produits mockup avec délimitations dans le backend. 