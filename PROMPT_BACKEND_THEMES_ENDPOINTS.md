# 🎨 Prompt Backend - Endpoints pour l'Interface des Thèmes

## 🚨 **URGENT : Endpoints manquants**

Le frontend essaie d'accéder à `GET http://localhost:3004/themes` et `POST http://localhost:3004/themes` mais reçoit des erreurs 404 (Not Found).

## 📋 **Endpoints à implémenter**

### **1. GET /themes - Liste des thèmes**

**Request :**
```http
GET http://localhost:3004/themes
Headers:
  Authorization: Bearer <admin_token>
  Content-Type: application/json
```

**Query Parameters (optionnels) :**
```javascript
{
  status?: 'active' | 'inactive' | 'all',
  category?: string,
  search?: string,
  limit?: number (default: 20),
  offset?: number (default: 0),
  featured?: boolean
}
```

**Response (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Manga Collection",
      "description": "Thème dédié aux mangas et animes populaires",
      "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover.jpg",
      "productCount": 15,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z",
      "status": "active",
      "category": "anime",
      "featured": true
    },
    {
      "id": 2,
      "name": "Sport Elite",
      "description": "Produits pour les passionnés de sport",
      "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/sport-cover.jpg",
      "productCount": 8,
      "createdAt": "2024-01-10T09:15:00.000Z",
      "updatedAt": "2024-01-18T16:20:00.000Z",
      "status": "active",
      "category": "sports",
      "featured": false
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Response (404) :**
```json
{
  "success": false,
  "error": "Aucun thème trouvé",
  "statusCode": 404
}
```

### **2. POST /themes - Créer un thème**

**Request :**
```http
POST http://localhost:3004/themes
Headers:
  Authorization: Bearer <admin_token>
  Content-Type: multipart/form-data
```

**Body (FormData) :**
```javascript
{
  name: "Nouveau Thème",
  description: "Description du thème",
  category: "entertainment",
  status: "active",
  featured: "false",
  coverImage: File (image, max 5MB)
}
```

**Response (201) :**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Nouveau Thème",
    "description": "Description du thème",
    "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/new-theme-cover.jpg",
    "productCount": 0,
    "createdAt": "2024-01-25T12:00:00.000Z",
    "updatedAt": "2024-01-25T12:00:00.000Z",
    "status": "active",
    "category": "entertainment",
    "featured": false
  },
  "message": "Thème créé avec succès"
}
```

**Response (400) :**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Le nom du thème est requis",
    "La description doit contenir au moins 10 caractères",
    "L'image de couverture est requise"
  ],
  "statusCode": 400
}
```

### **3. GET /themes/:id - Détails d'un thème**

**Request :**
```http
GET http://localhost:3004/themes/1
Headers:
  Authorization: Bearer <admin_token>
  Content-Type: application/json
```

**Response (200) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Manga Collection",
    "description": "Thème dédié aux mangas et animes populaires",
    "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover.jpg",
    "productCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z",
    "status": "active",
    "category": "anime",
    "featured": true,
    "products": [
      {
        "id": 101,
        "name": "T-Shirt Naruto",
        "price": 2500,
        "status": "published"
      }
    ]
  }
}
```

### **4. PUT /themes/:id - Modifier un thème**

**Request :**
```http
PUT http://localhost:3004/themes/1
Headers:
  Authorization: Bearer <admin_token>
  Content-Type: multipart/form-data
```

**Body (FormData) :**
```javascript
{
  name: "Manga Collection Updated",
  description: "Description mise à jour",
  category: "anime",
  status: "active",
  featured: "true",
  coverImage: File (optionnel, nouvelle image)
}
```

**Response (200) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Manga Collection Updated",
    "description": "Description mise à jour",
    "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover-updated.jpg",
    "productCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-25T15:30:00.000Z",
    "status": "active",
    "category": "anime",
    "featured": true
  },
  "message": "Thème modifié avec succès"
}
```

### **5. DELETE /themes/:id - Supprimer un thème**

**Request :**
```http
DELETE http://localhost:3004/themes/1
Headers:
  Authorization: Bearer <admin_token>
  Content-Type: application/json
```

**Response (204) :**
```http
HTTP/1.1 204 No Content
```

**Response (404) :**
```json
{
  "success": false,
  "error": "Thème non trouvé",
  "statusCode": 404
}
```

## 🗄️ **Structure de base de données**

### **Table `themes`**
```sql
CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  cover_image_url VARCHAR(500),
  cover_image_public_id VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  featured BOOLEAN DEFAULT false,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_themes_status ON themes(status);
CREATE INDEX idx_themes_category ON themes(category);
CREATE INDEX idx_themes_featured ON themes(featured);
```

### **Table `theme_products` (relation many-to-many)**
```sql
CREATE TABLE theme_products (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER REFERENCES themes(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(theme_id, product_id)
);

CREATE INDEX idx_theme_products_theme_id ON theme_products(theme_id);
CREATE INDEX idx_theme_products_product_id ON theme_products(product_id);
```

## 🔧 **Implémentation Express.js**

### **1. Routes**
```javascript
// routes/themes.js
const express = require('express');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const router = express.Router();

// Middleware d'authentification admin
const requireAdmin = require('../middleware/requireAdmin');

// Configuration multer pour upload d'images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// GET /themes - Liste des thèmes
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, category, search, limit = 20, offset = 0, featured } = req.query;
    
    let query = 'SELECT * FROM themes WHERE 1=1';
    const params = [];
    
    if (status && status !== 'all') {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }
    
    if (category) {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }
    
    if (search) {
      query += ' AND (name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }
    
    if (featured !== undefined) {
      query += ' AND featured = $' + (params.length + 1);
      params.push(featured === 'true');
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.rows.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur GET /themes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      statusCode: 500
    });
  }
});

// POST /themes - Créer un thème
router.post('/', requireAdmin, upload.single('coverImage'), async (req, res) => {
  try {
    const { name, description, category, status = 'active', featured = 'false' } = req.body;
    
    // Validation
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [
          !name && 'Le nom du thème est requis',
          !description && 'La description est requise',
          !category && 'La catégorie est requise'
        ].filter(Boolean),
        statusCode: 400
      });
    }
    
    let coverImageUrl = null;
    let coverImagePublicId = null;
    
    // Upload image si fournie
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: 'themes',
          resource_type: 'image'
        }
      );
      coverImageUrl = uploadResult.secure_url;
      coverImagePublicId = uploadResult.public_id;
    }
    
    // Insérer en base
    const result = await pool.query(
      `INSERT INTO themes (name, description, cover_image_url, cover_image_public_id, category, status, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, coverImageUrl, coverImagePublicId, category, status, featured === 'true']
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Thème créé avec succès'
    });
  } catch (error) {
    console.error('Erreur POST /themes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      statusCode: 500
    });
  }
});

// GET /themes/:id - Détails d'un thème
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT t.*, 
              COUNT(tp.product_id) as product_count
       FROM themes t
       LEFT JOIN theme_products tp ON t.id = tp.theme_id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Thème non trouvé',
        statusCode: 404
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur GET /themes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      statusCode: 500
    });
  }
});

// PUT /themes/:id - Modifier un thème
router.put('/:id', requireAdmin, upload.single('coverImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, status, featured } = req.body;
    
    // Vérifier que le thème existe
    const existingTheme = await pool.query('SELECT * FROM themes WHERE id = $1', [id]);
    if (existingTheme.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Thème non trouvé',
        statusCode: 404
      });
    }
    
    let coverImageUrl = existingTheme.rows[0].cover_image_url;
    let coverImagePublicId = existingTheme.rows[0].cover_image_public_id;
    
    // Upload nouvelle image si fournie
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (coverImagePublicId) {
        await cloudinary.uploader.destroy(coverImagePublicId);
      }
      
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: 'themes',
          resource_type: 'image'
        }
      );
      coverImageUrl = uploadResult.secure_url;
      coverImagePublicId = uploadResult.public_id;
    }
    
    // Mettre à jour en base
    const result = await pool.query(
      `UPDATE themes 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           cover_image_url = $3,
           cover_image_public_id = $4,
           category = COALESCE($5, category),
           status = COALESCE($6, status),
           featured = COALESCE($7, featured),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, description, coverImageUrl, coverImagePublicId, category, status, featured === 'true', id]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Thème modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur PUT /themes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      statusCode: 500
    });
  }
});

// DELETE /themes/:id - Supprimer un thème
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le thème existe
    const existingTheme = await pool.query('SELECT * FROM themes WHERE id = $1', [id]);
    if (existingTheme.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Thème non trouvé',
        statusCode: 404
      });
    }
    
    // Supprimer l'image de Cloudinary si elle existe
    if (existingTheme.rows[0].cover_image_public_id) {
      await cloudinary.uploader.destroy(existingTheme.rows[0].cover_image_public_id);
    }
    
    // Supprimer de la base
    await pool.query('DELETE FROM themes WHERE id = $1', [id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Erreur DELETE /themes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      statusCode: 500
    });
  }
});

module.exports = router;
```

### **2. Middleware d'authentification admin**
```javascript
// middleware/requireAdmin.js
const requireAdmin = (req, res, next) => {
  // Vérifier le token et le rôle admin
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token d\'authentification requis',
      statusCode: 401
    });
  }
  
  try {
    // Vérifier le token et le rôle (implémentation selon votre système)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé - Admin requis',
        statusCode: 403
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide',
      statusCode: 401
    });
  }
};

module.exports = requireAdmin;
```

### **3. Intégration dans app.js**
```javascript
// app.js
const themesRouter = require('./routes/themes');

// Ajouter les routes
app.use('/themes', themesRouter);
```

## 🧪 **Tests avec cURL**

### **Test GET /themes**
```bash
curl -X GET http://localhost:3004/themes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### **Test POST /themes**
```bash
curl -X POST http://localhost:3004/themes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Manga Collection" \
  -F "description=Thème dédié aux mangas" \
  -F "category=anime" \
  -F "status=active" \
  -F "featured=false" \
  -F "coverImage=@/path/to/image.jpg"
```

## 🎯 **Priorités d'implémentation**

1. **URGENT** : `GET /themes` - Pour afficher la liste
2. **URGENT** : `POST /themes` - Pour créer des thèmes
3. **Important** : `PUT /themes/:id` - Pour modifier
4. **Important** : `DELETE /themes/:id` - Pour supprimer
5. **Optionnel** : `GET /themes/:id` - Pour les détails

## ✅ **Validation frontend**

Une fois implémenté, le frontend devrait :
- ✅ Charger la liste des thèmes sans erreur 404
- ✅ Créer de nouveaux thèmes avec upload d'image
- ✅ Modifier et supprimer des thèmes
- ✅ Afficher les détails complets

**Le frontend est prêt et attend ces endpoints !** 🚀 