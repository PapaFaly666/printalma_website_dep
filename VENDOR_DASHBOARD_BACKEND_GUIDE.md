# Guide d'intégration Backend - Dashboard Vendeur

## Vue d'ensemble

Le frontend du dashboard vendeur a été mis à jour pour afficher des données dynamiques. Ce guide explique les endpoints backend requis et les structures de données attendues.

## Endpoints requis

### 1. Statistiques des produits vendeur
**Endpoint:** `GET /vendor/stats`
**Authentification:** Cookies de session vendeur

#### Réponse attendue:
```json
{
  "success": true,
  "data": {
    "totalProducts": 24,
    "publishedProducts": 18,
    "draftProducts": 4,
    "pendingProducts": 2,
    "totalValue": 425000,
    "averagePrice": 17708,
    "architecture": "v2_preserved_admin"
  }
}
```

#### Logique backend suggérée:
```sql
-- Exemple de requêtes SQL pour calculer les statistiques
SELECT
  COUNT(*) as totalProducts,
  COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as publishedProducts,
  COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draftProducts,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pendingProducts,
  SUM(vendor_price) as totalValue,
  AVG(vendor_price) as averagePrice
FROM vendor_products
WHERE vendor_id = ?
```

### 2. Liste des designs vendeur
**Endpoint:** `GET /vendor-design-products`
**Authentification:** Cookies de session vendeur

#### Réponse attendue:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Mon Super Design",
      "description": "Description du design",
      "status": "validated",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "designUrl": "https://cloudinary.../design.png",
      "vendor": {
        "id": 123,
        "email": "vendor@example.com",
        "shop_name": "Mon Shop"
      }
    }
  ]
}
```

## Implémentation côté frontend

### Code actuel dans VendorDashboardPage.tsx:

```typescript
// Chargement des données réelles
const [productStats, designStats] = await Promise.all([
  vendorProductService.getVendorStats().catch(() => null),
  vendorDesignProductAPI.getAll().catch(() => ({ data: [] }))
]);

// Calcul des statistiques
const totalProducts = productStats?.data?.totalProducts || 0;
const publishedProducts = productStats?.data?.publishedProducts || 0;
const draftProducts = productStats?.data?.draftProducts || 0;
const pendingProducts = productStats?.data?.pendingProducts || 0;
const totalValue = productStats?.data?.totalValue || 0;

const designs = Array.isArray(designStats.data) ? designStats.data : [];
const totalDesigns = designs.length;
```

## Endpoints backend actuels à vérifier

### VendorProductService - Endpoint existant:
- **URL:** `GET ${API_BASE_URL}/vendor/stats`
- **Service:** `vendorProductService.getVendorStats()`
- **Status:** ⚠️ À implémenter/vérifier

### VendorDesignProductAPI - Endpoint existant:
- **URL:** `GET ${API_BASE_URL}/vendor-design-products`
- **Service:** `vendorDesignProductAPI.getAll()`
- **Status:** ⚠️ À vérifier la structure de réponse

## Détails d'implémentation backend

### 1. Controller pour /vendor/stats

```javascript
// Exemple Node.js/Express
router.get('/stats', authenticateVendor, async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Requête pour obtenir les statistiques des produits
    const productStats = await db.query(`
      SELECT
        COUNT(*) as totalProducts,
        COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as publishedProducts,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draftProducts,
        COUNT(CASE WHEN status = 'PENDING_VALIDATION' THEN 1 END) as pendingProducts,
        COALESCE(SUM(vendor_price), 0) as totalValue,
        COALESCE(AVG(vendor_price), 0) as averagePrice
      FROM vendor_products
      WHERE vendor_id = ?
    `, [vendorId]);

    res.json({
      success: true,
      data: {
        ...productStats[0],
        architecture: 'v2_preserved_admin'
      }
    });
  } catch (error) {
    console.error('Erreur récupération stats vendeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
```

### 2. Controller pour /vendor-design-products

```javascript
router.get('/vendor-design-products', authenticateVendor, async (req, res) => {
  try {
    const vendorId = req.user.id;

    const designs = await db.query(`
      SELECT
        vdp.*,
        v.email as vendor_email,
        v.shop_name as vendor_shop_name
      FROM vendor_design_products vdp
      JOIN vendors v ON v.id = vdp.vendor_id
      WHERE vdp.vendor_id = ?
      ORDER BY vdp.created_at DESC
    `, [vendorId]);

    const formattedDesigns = designs.map(design => ({
      id: design.id,
      name: design.name,
      description: design.description,
      status: design.status,
      createdAt: design.created_at,
      updatedAt: design.updated_at,
      designUrl: design.design_url,
      vendor: {
        id: vendorId,
        email: design.vendor_email,
        shop_name: design.vendor_shop_name
      }
    }));

    res.json({
      success: true,
      data: formattedDesigns
    });
  } catch (error) {
    console.error('Erreur récupération designs vendeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
```

## Structure de base de données suggérée

### Table vendor_products
```sql
CREATE TABLE vendor_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_description TEXT,
  vendor_price DECIMAL(10,2) NOT NULL,
  vendor_stock INT DEFAULT 10,
  status ENUM('DRAFT', 'PUBLISHED', 'PENDING_VALIDATION') DEFAULT 'DRAFT',
  base_product_id INT NOT NULL,
  design_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (base_product_id) REFERENCES admin_products(id),
  FOREIGN KEY (design_id) REFERENCES vendor_design_products(id)
);
```

### Table vendor_design_products
```sql
CREATE TABLE vendor_design_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  design_url VARCHAR(500) NOT NULL,
  status ENUM('pending', 'validated', 'rejected') DEFAULT 'pending',
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (category_id) REFERENCES design_categories(id)
);
```

## Authentification

### Middleware d'authentification vendeur
```javascript
const authenticateVendor = (req, res, next) => {
  // Vérifier le cookie de session ou token JWT
  const sessionId = req.cookies['session_id'];

  if (!sessionId) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  // Vérifier la session et récupérer l'utilisateur
  // req.user = { id: vendorId, role: 'vendor', ... }
  next();
};
```

## Gestion d'erreurs

### Réponses d'erreur standardisées
```json
{
  "success": false,
  "message": "Message d'erreur descriptif",
  "error_code": "VENDOR_NOT_FOUND" // optionnel
}
```

## Variables d'environnement

```env
# URL de base de l'API (utilisée côté frontend)
VITE_API_URL=https://printalma-back-dep.onrender.com

# Configuration CORS (côté backend)
ALLOWED_ORIGINS=http://localhost:5174,https://votre-frontend.com
```

## Tests recommandés

### 1. Test de l'endpoint /vendor/stats
```bash
curl -X GET \
  'https://printalma-back-dep.onrender.com/vendor/stats' \
  -H 'Cookie: session_id=xyz123' \
  -H 'Content-Type: application/json'
```

### 2. Test de l'endpoint /vendor-design-products
```bash
curl -X GET \
  'https://printalma-back-dep.onrender.com/vendor-design-products' \
  -H 'Cookie: session_id=xyz123' \
  -H 'Content-Type: application/json'
```

## Priorités d'implémentation

1. **Haute priorité:**
   - Endpoint `GET /vendor/stats` avec les statistiques de base
   - Vérification de l'endpoint `GET /vendor-design-products`

2. **Moyenne priorité:**
   - Ajout de métriques avancées (vues, conversions)
   - Optimisation des requêtes SQL

3. **Basse priorité:**
   - Cache Redis pour les statistiques
   - API de métriques en temps réel

## Notes importantes

- Les cookies de session sont utilisés pour l'authentification (pas de headers Authorization)
- L'API base URL est configurée via `VITE_API_URL`
- Les réponses doivent inclure `success: true/false`
- Gérer les cas où un vendeur n'a aucun produit/design
- Prévoir la gestion d'erreur côté frontend avec des fallbacks

## Checklist pour le backend

- [ ] Implémenter `GET /vendor/stats`
- [ ] Vérifier `GET /vendor-design-products`
- [ ] Tester l'authentification par cookies
- [ ] Vérifier les permissions vendeur
- [ ] Ajouter la gestion d'erreurs
- [ ] Tester avec des vendeurs ayant différents volumes de données
- [ ] Valider les structures JSON de réponse