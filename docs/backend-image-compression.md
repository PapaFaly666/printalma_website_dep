# Documentation : Gestion de la Compression d'Images - Backend PrintAlma

## Overview

Ce document décrit l'implémentation recommandée côté backend pour gérer les images compressées envoyées par le frontend. Le système frontend compresse automatiquement les images uploadées par les utilisateurs et les stocke soit dans localStorage (petites images) soit dans IndexedDB (grosses images).

## Objectifs

1. **Réduire la bande passante** : Les images sont déjà compressées côté client
2. **Gérer le stockage** : Éviter les fichiers trop volumineux sur le serveur
3. **Maintenir la qualité** : Préserver une qualité suffisante pour l'impression
4. **Optimiser les performances** : Traitement rapide des images

## Flux de travail actuel (Frontend)

1. L'utilisateur sélectionne une image
2. Le frontend compresse l'image (max 1920x1080, qualité 85%)
3. Si < 4MB : Stocké dans localStorage
4. Si > 4MB : Stocké dans IndexedDB avec un ID unique
5. L'image compressée est envoyée en base64 avec les métadonnées

## Implémentation Backend Recommandée

### 1. Schéma de base de données

```sql
-- Table pour les personnalisations de produits
CREATE TABLE product_customizations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  user_id INTEGER REFERENCES users(id),
  color_variation_id INTEGER REFERENCES color_variations(id),
  view_id INTEGER REFERENCES product_views(id),
  design_elements JSONB NOT NULL, -- Contient les éléments de design
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les images uploadées (optionnel, pour stockage persistant)
CREATE TABLE uploaded_images (
  id SERIAL PRIMARY KEY,
  image_id VARCHAR(255) UNIQUE NOT NULL, -- ID généré par le frontend
  user_id INTEGER REFERENCES users(id),
  original_filename VARCHAR(255),
  file_size_original INTEGER, -- Taille originale en octets
  file_size_compressed INTEGER, -- Taille compressée en octets
  compression_ratio DECIMAL(5,2), -- Pourcentage de compression
  width INTEGER, -- Dimensions après compression
  height INTEGER,
  mime_type VARCHAR(50),
  file_path VARCHAR(500), -- Chemin du fichier si stocké sur disque
  s3_url VARCHAR(500), -- URL si stocké sur S3/Cloud Storage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP -- Pour nettoyer les anciennes images
);
```

### 2. API Endpoints

#### POST /api/customizations/save

Reçoit les données de personnalisation avec les images compressées.

```json
{
  "productId": 123,
  "colorVariationId": 456,
  "viewId": 789,
  "designElements": [
    {
      "id": "element-123",
      "type": "image",
      "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "x": 0.5,
      "y": 0.5,
      "width": 200,
      "height": 200,
      "rotation": 0,
      "naturalWidth": 1920,
      "naturalHeight": 1080,
      "zIndex": 1,
      "isUploadedImage": true,
      "imageId": "upload-1234567890-abc123",
      "originalSize": 5242880, // 5MB
      "compressedSize": 524288, // 512KB
      "compressionRatio": 90 // 90% de réduction
    }
  ],
  "sessionId": "session-123"
}
```

#### GET /api/customizations/:id

Retourne la personnalisation avec les images.

### 3. Implémentation Node.js (Express)

```javascript
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Configuration du stockage des images
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/customizations');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}.jpg`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Endpoint pour sauvegarder la personnalisation
router.post('/save', async (req, res) => {
  try {
    const { productId, colorVariationId, viewId, designElements, sessionId } = req.body;

    // Traiter chaque élément de design
    const processedElements = await Promise.all(designElements.map(async (element) => {
      if (element.type === 'image' && element.isUploadedImage) {
        // Traiter l'image uploadée compressée
        return await processUploadedImage(element);
      }
      return element;
    }));

    // Sauvegarder en base de données
    const customization = await db.query(`
      INSERT INTO product_customizations
      (product_id, color_variation_id, view_id, design_elements, session_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [productId, colorVariationId, viewId, JSON.stringify(processedElements), sessionId]);

    res.json({
      success: true,
      customization: customization.rows[0]
    });

  } catch (error) {
    console.error('Erreur sauvegarde personnalisation:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la sauvegarde'
    });
  }
});

// Fonction pour traiter une image uploadée
async function processUploadedImage(element) {
  const { imageUrl, imageId, originalSize, compressedSize, compressionRatio } = element;

  try {
    // Extraire les données base64
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Optionnel: Validation supplémentaire avec Sharp
    const metadata = await sharp(buffer).metadata();

    // Générer un nom de fichier unique
    const filename = `${imageId}.jpg`;
    const filepath = path.join(__dirname, '../../uploads/customizations', filename);

    // Sauvegarder le fichier sur le disque
    await fs.writeFile(filepath, buffer);

    // Optionnel: Créer une miniature pour l'aperçu
    const thumbnailPath = path.join(__dirname, '../../uploads/customizations/thumbnails', filename);
    await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });
    await sharp(buffer)
      .resize(200, 200, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Mettre à jour la base de données des images uploadées
    await db.query(`
      INSERT INTO uploaded_images
      (image_id, original_filename, file_size_original, file_size_compressed,
       compression_ratio, width, height, mime_type, file_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (image_id) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
    `, [
      imageId,
      element.designName || `upload-${imageId}`,
      originalSize,
      compressedSize,
      compressionRatio,
      metadata.width,
      metadata.height,
      `image/${metadata.format}`,
      filepath
    ]);

    // Retourner l'élément avec l'URL du fichier au lieu du base64
    return {
      ...element,
      imageUrl: `/uploads/customizations/${filename}`,
      thumbnailUrl: `/uploads/customizations/thumbnails/${filename}`
    };

  } catch (error) {
    console.error('Erreur traitement image:', error);
    // En cas d'erreur, garder le base64
    return element;
  }
}

// Endpoint pour récupérer une personnalisation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT * FROM product_customizations
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personnalisation non trouvée' });
    }

    let customization = result.rows[0];
    let designElements = JSON.parse(customization.design_elements);

    // Traiter les images pour les retournées en base64 si nécessaire
    designElements = await Promise.all(designElements.map(async (element) => {
      if (element.type === 'image' && element.isUploadedImage && !element.imageUrl.startsWith('data:')) {
        // Lire le fichier et le convertir en base64
        try {
          const filepath = path.join(__dirname, '../../', element.imageUrl);
          const buffer = await fs.readFile(filepath);
          const base64 = buffer.toString('base64');
          element.imageUrl = `data:image/jpeg;base64,${base64}`;
        } catch (error) {
          console.error('Erreur lecture fichier image:', error);
          // Garder l'URL telle quelle
        }
      }
      return element;
    }));

    customization.design_elements = JSON.stringify(designElements);

    res.json({ customization });

  } catch (error) {
    console.error('Erreur récupération personnalisation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Cleanup des anciennes images (tâche planifiée)
async function cleanupOldImages() {
  try {
    const result = await db.query(`
      DELETE FROM uploaded_images
      WHERE expires_at < CURRENT_TIMESTAMP
      RETURNING file_path
    `);

    // Supprimer les fichiers physiques
    for (const row of result.rows) {
      try {
        await fs.unlink(row.file_path);
        // Supprimer aussi la miniature si elle existe
        const thumbnailPath = row.file_path.replace('/uploads/', '/uploads/thumbnails/');
        await fs.unlink(thumbnailPath);
      } catch (error) {
        console.error('Erreur suppression fichier:', error);
      }
    }

    console.log(`Nettoyage: ${result.rows.length} anciennes images supprimées`);

  } catch (error) {
    console.error('Erreur nettoyage images:', error);
  }
}

// Planifier le nettoyage quotidien
setInterval(cleanupOldImages, 24 * 60 * 60 * 1000);

module.exports = router;
```

### 4. Configuration du serveur

#### Pour servir les fichiers statiques (Express)

```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

#### Configuration Nginx (si utilisé)

```nginx
# Limiter la taille des uploads
client_max_body_size 10M;

# Servir les images avec cache
location /uploads/ {
    alias /var/www/printalma/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";

    # Compression pour les images non compressées
    gzip_types image/jpeg image/png image/webp;
}
```

### 5. Bonnes pratiques

1. **Validation des images**
   - Vérifier les dimensions maximales
   - Valider les métadonnées de compression
   - Vérifier le ratio de compression

2. **Stockage**
   - Utiliser CDN pour les images en production
   - Implémenter la réplication cross-région
   - Configurer le backup automatique

3. **Sécurité**
   - Scanner les images uploadées pour détecter les malwares
   - Limiter le nombre d'uploads par utilisateur
   - Implémenter un rate limiting

4. **Monitoring**
   - Surveiller l'espace disque utilisé
   - Tracker les temps de traitement
   - Monitorer les ratios de compression

### 6. Alternative: Stockage Cloud (AWS S3)

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function uploadToS3(buffer, filename, imageId) {
  const params = {
    Bucket: process.env.S3_BUCKET_CUSTOMIZATIONS,
    Key: `customizations/${filename}`,
    Body: buffer,
    ContentType: 'image/jpeg',
    Metadata: {
      imageId: imageId,
      uploadTime: new Date().toISOString()
    }
  };

  return await s3.upload(params).promise();
}
```

### 7. Tests

```javascript
// Test unitaire pour le traitement d'image
describe('Image Processing', () => {
  test('should compress uploaded image correctly', async () => {
    const mockElement = {
      type: 'image',
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
      isUploadedImage: true,
      imageId: 'test-123',
      originalSize: 5000000,
      compressedSize: 500000,
      compressionRatio: 90
    };

    const processed = await processUploadedImage(mockElement);

    expect(processed.imageUrl).toMatch(/^\/uploads\//);
    expect(processed.thumbnailUrl).toBeDefined();
  });
});
```

## Conclusion

Cette implémentation backend permet de :

- Recevoir efficacement les images déjà compressées par le frontend
- Optimiser le stockage en évitant les doublons
- Maintenir des performances élevées
- Fournir une scalabilité pour la croissance

La compression côté frontend réduit significativement la charge serveur et améliore l'expérience utilisateur en réduisant les temps d'upload.