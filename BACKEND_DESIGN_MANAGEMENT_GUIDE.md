# Guide Backend - Gestion des Designs dans les Produits

## 📋 Vue d'ensemble

Ce document décrit les modifications nécessaires côté backend pour gérer les designs appliqués aux produits, permettant de distinguer les "produits vierges" (sans design) des produits avec design.

## 🏗️ Structure de données

### 1. Modification du modèle ProductImage

```sql
-- Ajouter une colonne pour l'URL du design
ALTER TABLE product_images 
ADD COLUMN design_url VARCHAR(500) NULL,
ADD COLUMN design_file_name VARCHAR(255) NULL,
ADD COLUMN design_upload_date TIMESTAMP NULL;

-- Index pour optimiser les requêtes de filtrage
CREATE INDEX idx_product_images_design_url ON product_images(design_url);
```

### 2. Structure JSON étendue

```json
{
  "id": "product_123",
  "name": "T-shirt Premium",
  "description": "T-shirt de qualité supérieure",
  "price": 15000,
  "stock": 50,
  "status": "published",
  "categories": ["Vêtements", "T-shirts"],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [
    {
      "id": "color_1",
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [
        {
          "id": "img_1",
          "url": "https://api.example.com/images/tshirt-blanc-front.jpg",
          "view": "Front",
          "designUrl": "https://api.example.com/designs/logo-entreprise.png", // NOUVEAU
          "designFileName": "logo-entreprise.png", // NOUVEAU
          "designUploadDate": "2024-01-15T10:30:00Z", // NOUVEAU
          "delimitations": [
            {
              "id": "delim_1",
              "x": 150,
              "y": 100,
              "width": 200,
              "height": 150,
              "rotation": 0,
              "name": "Zone logo"
            }
          ]
        }
      ]
    }
  ],
  "hasDesign": true, // NOUVEAU - Calculé automatiquement
  "designCount": 2, // NOUVEAU - Nombre total de designs sur le produit
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## 🔧 Endpoints API nécessaires

### 1. Upload de design sur une image

```http
POST /api/products/{productId}/colors/{colorId}/images/{imageId}/design
Content-Type: multipart/form-data

{
  "design": <file>, // Fichier design (PNG, JPG, SVG)
  "name": "Logo entreprise", // Nom optionnel du design
  "replaceExisting": true // Remplacer le design existant si présent
}
```

**Réponse :**
```json
{
  "success": true,
  "designUrl": "https://api.example.com/designs/logo-entreprise.png",
  "designFileName": "logo-entreprise.png",
  "message": "Design uploadé avec succès"
}
```

### 2. Suppression de design

```http
DELETE /api/products/{productId}/colors/{colorId}/images/{imageId}/design
```

**Réponse :**
```json
{
  "success": true,
  "message": "Design supprimé avec succès"
}
```

### 3. Récupération des produits vierges

```http
GET /api/products/blank
```

**Paramètres optionnels :**
- `status`: `published` | `draft` | `all` (défaut: `all`)
- `limit`: nombre de résultats (défaut: 50)
- `offset`: pagination (défaut: 0)
- `search`: recherche textuelle

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "product_456",
      "name": "Mug Personnalisable",
      "description": "Mug blanc prêt pour personnalisation",
      "price": 8000,
      "stock": 100,
      "status": "published",
      "categories": ["Objets", "Mugs"],
      "colorVariations": [
        {
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "images": [
            {
              "id": "img_2",
              "url": "https://api.example.com/images/mug-blanc.jpg",
              "view": "Front",
              "designUrl": null, // Pas de design = produit vierge
              "delimitations": [...]
            }
          ]
        }
      ],
      "hasDesign": false,
      "designCount": 0
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasNext": false
  }
}
```

### 4. Statistiques des designs

```http
GET /api/products/design-stats
```

**Réponse :**
```json
{
  "success": true,
  "stats": {
    "totalProducts": 150,
    "productsWithDesign": 89,
    "blankProducts": 61,
    "designPercentage": 59.3,
    "totalDesigns": 142,
    "averageDesignsPerProduct": 0.95
  }
}
```

## 🔍 Requêtes SQL utiles

### 1. Identifier les produits vierges

```sql
SELECT DISTINCT p.id, p.name, p.status, p.price
FROM products p
JOIN color_variations cv ON p.id = cv.product_id
JOIN product_images pi ON cv.id = pi.color_variation_id
WHERE pi.design_url IS NULL
ORDER BY p.created_at DESC;
```

### 2. Compter les designs par produit

```sql
SELECT 
    p.id,
    p.name,
    COUNT(pi.design_url) as design_count,
    CASE 
        WHEN COUNT(pi.design_url) > 0 THEN true 
        ELSE false 
    END as has_design
FROM products p
JOIN color_variations cv ON p.id = cv.product_id
JOIN product_images pi ON cv.id = pi.color_variation_id
GROUP BY p.id, p.name
ORDER BY design_count DESC;
```

### 3. Statistiques globales

```sql
SELECT 
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT CASE WHEN pi.design_url IS NOT NULL THEN p.id END) as products_with_design,
    COUNT(DISTINCT CASE WHEN pi.design_url IS NULL THEN p.id END) as blank_products,
    COUNT(pi.design_url) as total_designs
FROM products p
JOIN color_variations cv ON p.id = cv.product_id
JOIN product_images pi ON cv.id = pi.color_variation_id;
```

## 📁 Gestion des fichiers

### 1. Structure de stockage recommandée

```
/uploads/
  /designs/
    /products/
      /{productId}/
        /{colorId}/
          /{imageId}/
            /original_design.png
            /thumbnail_design.png (optionnel)
```

### 2. Formats acceptés

- **Images :** PNG, JPG, JPEG (recommandé: PNG pour transparence)
- **Vectoriel :** SVG (à convertir en PNG pour affichage)
- **Taille max :** 10MB par fichier
- **Résolution recommandée :** 300 DPI pour impression

### 3. Validation des fichiers

```javascript
// Exemple de validation côté serveur
const validateDesignFile = (file) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Format de fichier non supporté');
  }
  
  if (file.size > maxSize) {
    throw new Error('Fichier trop volumineux (max 10MB)');
  }
  
  return true;
};
```

## 🔄 Processus de création/modification

### 1. Création d'un produit avec design

1. **Créer le produit** (POST `/api/products`)
2. **Ajouter les variations de couleur** 
3. **Uploader les images de base**
4. **Uploader les designs** (POST `/api/products/{id}/colors/{colorId}/images/{imageId}/design`)
5. **Définir les délimitations**

### 2. Ajout de design à un produit existant

1. **Identifier l'image cible**
2. **Uploader le design**
3. **Mettre à jour les métadonnées**
4. **Recalculer les statistiques du produit**

## 🚨 Considérations importantes

### 1. Performance

- **Indexer** les colonnes `design_url` et `has_design`
- **Optimiser** les requêtes de filtrage des produits vierges
- **Mettre en cache** les statistiques de designs

### 2. Sécurité

- **Valider** tous les uploads de fichiers
- **Restreindre** les types de fichiers acceptés
- **Scanner** les fichiers pour détecter les malwares
- **Limiter** la taille des uploads

### 3. Sauvegarde

- **Sauvegarder** régulièrement les designs uploadés
- **Versionner** les designs (optionnel)
- **Nettoyer** les fichiers orphelins

### 4. API Response

- **Inclure** systématiquement `hasDesign` et `designCount` dans les réponses produits
- **Optimiser** les requêtes pour éviter les N+1
- **Paginer** les résultats pour les grandes listes

## 📊 Monitoring recommandé

1. **Nombre de designs uploadés par jour**
2. **Taille totale des fichiers designs**
3. **Ratio produits vierges / produits avec design**
4. **Temps de réponse des endpoints de design**
5. **Erreurs d'upload de fichiers**

## 🔧 Exemple d'implémentation (Node.js/Express)

```javascript
// Route pour upload de design
app.post('/api/products/:productId/colors/:colorId/images/:imageId/design', 
  upload.single('design'),
  validateDesignFile,
  async (req, res) => {
    try {
      const { productId, colorId, imageId } = req.params;
      const designFile = req.file;
      
      // Sauvegarder le fichier
      const designUrl = await saveDesignFile(designFile, productId, colorId, imageId);
      
      // Mettre à jour la base de données
      await updateImageDesign(imageId, {
        designUrl,
        designFileName: designFile.originalname,
        designUploadDate: new Date()
      });
      
      // Recalculer les stats du produit
      await updateProductDesignStats(productId);
      
      res.json({
        success: true,
        designUrl,
        designFileName: designFile.originalname,
        message: 'Design uploadé avec succès'
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Route pour récupérer les produits vierges
app.get('/api/products/blank', async (req, res) => {
  try {
    const { status = 'all', limit = 50, offset = 0, search } = req.query;
    
    const blankProducts = await getBlankProducts({
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
      search
    });
    
    res.json({
      success: true,
      data: blankProducts.products,
      pagination: {
        total: blankProducts.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasNext: blankProducts.total > (parseInt(offset) + parseInt(limit))
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

Ce guide fournit toutes les informations nécessaires pour implémenter la gestion des designs côté backend, permettant au frontend de distinguer et afficher correctement les produits vierges. 