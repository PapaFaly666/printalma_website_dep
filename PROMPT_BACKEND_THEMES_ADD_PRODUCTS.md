# 🎯 Prompt Backend - Ajout de Produits aux Thèmes

## 📋 **Demande**

Implémenter l'endpoint `POST /themes/:id/products` pour permettre l'ajout de produits à un thème existant.

## 🔧 **Endpoint à implémenter**

### **POST /themes/:id/products**

**Description :** Ajouter des produits à un thème spécifique

**URL :** `POST /themes/:id/products`

**Headers requis :**
```
Content-Type: application/json
Authorization: Bearer <admin_token> (optionnel pour les tests)
```

**Body (JSON) :**
```json
{
  "productIds": [1, 2, 3, 4]
}
```

**Paramètres :**
- `id` : ID du thème (number, requis)
- `productIds` : Array d'IDs de produits à ajouter (number[], requis)

## 📊 **Réponse attendue**

### **Succès (200 OK)**
```json
{
  "success": true,
  "message": "Produits ajoutés au thème avec succès",
  "data": {
    "themeId": 1,
    "addedProducts": 3,
    "totalProducts": 5,
    "products": [
      {
        "id": 1,
        "name": "T-Shirt Manga",
        "price": 2500,
        "status": "published"
      },
      {
        "id": 2,
        "name": "Mug Anime",
        "price": 1500,
        "status": "published"
      }
    ]
  }
}
```

### **Erreur - Thème non trouvé (404 Not Found)**
```json
{
  "success": false,
  "error": "Thème non trouvé",
  "message": "Le thème avec l'ID 999 n'existe pas",
  "statusCode": 404
}
```

### **Erreur - Produits non trouvés (400 Bad Request)**
```json
{
  "success": false,
  "error": "Produits non trouvés",
  "message": "Certains produits n'existent pas",
  "statusCode": 400,
  "data": {
    "invalidProductIds": [999, 1000]
  }
}
```

### **Erreur - Validation (400 Bad Request)**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "productIds doit être un tableau non vide",
  "statusCode": 400
}
```

## 🗄️ **Structure de base de données**

### **Table `theme_products` (relation many-to-many)**
```sql
CREATE TABLE theme_products (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(theme_id, product_id)
);
```

### **Index recommandés :**
```sql
CREATE INDEX idx_theme_products_theme_id ON theme_products(theme_id);
CREATE INDEX idx_theme_products_product_id ON theme_products(product_id);
```

## 🔧 **Implémentation Express.js**

### **Route principale :**
```javascript
// POST /themes/:id/products
app.post('/themes/:id/products', async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);
    const { productIds } = req.body;

    // Validation
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'productIds doit être un tableau non vide',
        statusCode: 400
      });
    }

    // Vérifier que le thème existe
    const theme = await db.query('SELECT * FROM themes WHERE id = $1', [themeId]);
    if (theme.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Thème non trouvé',
        message: `Le thème avec l'ID ${themeId} n'existe pas`,
        statusCode: 404
      });
    }

    // Vérifier que tous les produits existent
    const products = await db.query(
      'SELECT id, name, price, status FROM products WHERE id = ANY($1)',
      [productIds]
    );

    const existingProductIds = products.rows.map(p => p.id);
    const invalidProductIds = productIds.filter(id => !existingProductIds.includes(id));

    if (invalidProductIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Produits non trouvés',
        message: 'Certains produits n\'existent pas',
        statusCode: 400,
        data: { invalidProductIds }
      });
    }

    // Ajouter les produits au thème (ignorer les doublons)
    const insertPromises = productIds.map(productId => 
      db.query(
        'INSERT INTO theme_products (theme_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [themeId, productId]
      )
    );

    await Promise.all(insertPromises);

    // Récupérer les produits ajoutés
    const addedProducts = await db.query(
      `SELECT p.id, p.name, p.price, p.status 
       FROM products p 
       INNER JOIN theme_products tp ON p.id = tp.product_id 
       WHERE tp.theme_id = $1 AND p.id = ANY($2)`,
      [themeId, productIds]
    );

    // Compter le total de produits dans le thème
    const totalCount = await db.query(
      'SELECT COUNT(*) as count FROM theme_products WHERE theme_id = $1',
      [themeId]
    );

    res.json({
      success: true,
      message: 'Produits ajoutés au thème avec succès',
      data: {
        themeId,
        addedProducts: addedProducts.rows.length,
        totalProducts: parseInt(totalCount.rows[0].count),
        products: addedProducts.rows
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de produits au thème:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: 'Erreur lors de l\'ajout de produits au thème',
      statusCode: 500
    });
  }
});
```

## 🧪 **Tests à effectuer**

### **Test 1 : Ajout normal**
```bash
curl -X POST http://localhost:3004/themes/1/products \
  -H "Content-Type: application/json" \
  -d '{"productIds": [1, 2, 3]}'
```

### **Test 2 : Thème inexistant**
```bash
curl -X POST http://localhost:3004/themes/999/products \
  -H "Content-Type: application/json" \
  -d '{"productIds": [1, 2]}'
```

### **Test 3 : Produits inexistants**
```bash
curl -X POST http://localhost:3004/themes/1/products \
  -H "Content-Type: application/json" \
  -d '{"productIds": [999, 1000]}'
```

### **Test 4 : Validation**
```bash
curl -X POST http://localhost:3004/themes/1/products \
  -H "Content-Type: application/json" \
  -d '{"productIds": []}'
```

## 📋 **Fonctionnalités requises**

1. ✅ **Validation** des données d'entrée
2. ✅ **Vérification** de l'existence du thème
3. ✅ **Vérification** de l'existence des produits
4. ✅ **Ajout** des relations en base de données
5. ✅ **Gestion** des doublons (ON CONFLICT DO NOTHING)
6. ✅ **Retour** des informations sur les produits ajoutés
7. ✅ **Comptage** du total de produits dans le thème
8. ✅ **Gestion d'erreurs** appropriée

## 🎯 **Intégration avec le frontend**

Une fois cet endpoint implémenté, le frontend pourra :
- ✅ Charger les produits disponibles via `GET /products`
- ✅ Ajouter des produits au thème via `POST /themes/:id/products`
- ✅ Afficher le nouveau compteur de produits dans le thème
- ✅ Mettre à jour la liste des produits du thème

## 📝 **Notes importantes**

1. **Sécurité** : Ajouter une validation d'autorisation admin si nécessaire
2. **Performance** : Utiliser des transactions pour les opérations multiples
3. **Logs** : Logger les ajouts de produits pour audit
4. **Cache** : Considérer l'invalidation du cache des thèmes

**Cet endpoint est essentiel pour la fonctionnalité d'ajout de produits aux thèmes dans l'interface d'administration !** 🎉 