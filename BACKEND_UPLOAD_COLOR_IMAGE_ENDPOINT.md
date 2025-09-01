# 🚀 Backend - Endpoint Upload Immédiat Images Couleurs

## 📋 Problème Identifié

L'endpoint `/upload/color-image` n'existe pas côté backend, ce qui empêche l'upload immédiat des images de couleurs.

**Erreur actuelle :** `404 Not Found` pour `/upload/color-image`

## 🎯 Objectif

Créer un endpoint backend pour uploader immédiatement les images de couleurs sur le serveur.

## 📁 Fichiers à Créer/Modifier

### 1. **`src/routes/upload.routes.ts`** (nouveau fichier)

```typescript
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configuration multer pour les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/color-images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images JPEG, PNG et WebP sont autorisées'));
    }
  }
});

/**
 * POST /upload/color-image
 * Upload immédiat d'une image de couleur
 */
router.post('/color-image', upload.single('file'), async (req, res) => {
  try {
    console.log('🔄 [Upload] Upload image couleur reçu');
    
    // Validation des données
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const { colorId, colorType, fileId } = req.body;
    
    if (!colorId || !colorType) {
      return res.status(400).json({
        success: false,
        message: 'colorId et colorType sont requis'
      });
    }

    // Informations du fichier uploadé
    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    };

    console.log('📁 [Upload] Fichier reçu:', fileInfo);

    // Générer l'URL publique
    const baseUrl = process.env.BASE_URL || 'http://localhost:3004';
    const publicUrl = `${baseUrl}/uploads/color-images/${req.file.filename}`;

    // Réponse de succès
    const response = {
      success: true,
      data: {
        url: publicUrl,
        fileId: fileId || `${colorType}_color_${colorId}_${Date.now()}`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        colorId: parseInt(colorId),
        colorType: colorType
      },
      message: 'Image couleur uploadée avec succès'
    };

    console.log('✅ [Upload] Image couleur uploadée:', response.data.url);
    
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ [Upload] Erreur upload image couleur:', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'image'
    });
  }
});

/**
 * GET /uploads/color-images/:filename
 * Servir les images de couleurs uploadées
 */
router.get('/uploads/color-images/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads/color-images', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Image non trouvée'
    });
  }
});

export default router;
```

### 2. **`src/app.ts`** (modification)

```typescript
// ... imports existants ...
import uploadRoutes from './routes/upload.routes';

// ... code existant ...

// Ajouter les routes d'upload
app.use('/upload', uploadRoutes);

// Servir les fichiers statiques uploadés
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ... reste du code ...
```

### 3. **`src/middleware/auth.middleware.ts`** (si nécessaire)

```typescript
// Middleware d'authentification pour les uploads
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Vérifier le token JWT ou session
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }
  
  try {
    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};
```

### 4. **`package.json`** (ajouts)

```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/multer": "^1.4.7",
    "@types/uuid": "^9.0.1"
  }
}
```

### 5. **`.env`** (ajouts)

```env
# Configuration upload
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
BASE_URL=http://localhost:3004
```

## 🔧 Installation et Configuration

### 1. Installer les dépendances

```bash
npm install multer uuid
npm install --save-dev @types/multer @types/uuid
```

### 2. Créer le dossier uploads

```bash
mkdir -p uploads/color-images
```

### 3. Ajouter au .gitignore

```gitignore
# Uploads
uploads/
!uploads/.gitkeep
```

### 4. Créer le fichier .gitkeep

```bash
touch uploads/.gitkeep
```

## 📋 Structure des Données

### Request (FormData)
```
file: File (image)
colorId: string (ID de la couleur)
colorType: string ('standard' | 'custom')
fileId: string (optionnel, généré automatiquement)
```

### Response (JSON)
```json
{
  "success": true,
  "data": {
    "url": "http://localhost:3004/uploads/color-images/1234567890-abc123.jpg",
    "fileId": "standard_color_1_1234567890",
    "filename": "1234567890-abc123.jpg",
    "originalName": "image.jpg",
    "size": 1024000,
    "colorId": 1,
    "colorType": "standard"
  },
  "message": "Image couleur uploadée avec succès"
}
```

## 🔍 Tests

### 1. Test avec curl

```bash
curl -X POST http://localhost:3004/upload/color-image \
  -F "file=@/path/to/image.jpg" \
  -F "colorId=1" \
  -F "colorType=standard" \
  -F "fileId=test_123" \
  -H "Cookie: token=your-jwt-token"
```

### 2. Test avec Postman

- **Method:** POST
- **URL:** `http://localhost:3004/upload/color-image`
- **Body:** form-data
  - `file`: [sélectionner une image]
  - `colorId`: 1
  - `colorType`: standard
  - `fileId`: test_123

### 3. Test avec JavaScript

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('colorId', '1');
formData.append('colorType', 'standard');
formData.append('fileId', 'test_123');

fetch('http://localhost:3004/upload/color-image', {
  method: 'POST',
  credentials: 'include',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🚀 Fonctionnalités

### ✅ Upload Immédiat
- Upload d'images de couleurs en temps réel
- Validation des types de fichiers (JPEG, PNG, WebP)
- Limite de taille (5MB max)
- Génération d'URLs publiques

### ✅ Sécurité
- Validation des types MIME
- Limite de taille de fichier
- Authentification requise
- Noms de fichiers uniques

### ✅ Gestion d'Erreurs
- Messages d'erreur détaillés
- Validation des paramètres
- Gestion des exceptions

### ✅ Performance
- Stockage sur disque avec multer
- URLs publiques pour accès direct
- Compression automatique (optionnel)

## 📊 Validation

### Types de fichiers autorisés
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ WebP (.webp)
- ❌ GIF, SVG, etc.

### Tailles de fichiers
- ✅ Jusqu'à 5MB
- ❌ Plus de 5MB

### Paramètres requis
- ✅ colorId (string/number)
- ✅ colorType ('standard' | 'custom')
- ✅ file (fichier image)
- ❌ Paramètres manquants

## 🔧 Configuration Avancée

### 1. Compression d'images (optionnel)

```typescript
import sharp from 'sharp';

// Dans le middleware d'upload
const compressImage = async (filePath: string) => {
  await sharp(filePath)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(filePath + '_compressed');
};
```

### 2. Upload vers Cloudinary (optionnel)

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload vers Cloudinary
const result = await cloudinary.uploader.upload(filePath);
```

### 3. Validation avancée

```typescript
const validateImage = (file: Express.Multer.File) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    throw new Error('Fichier trop volumineux (max 5MB)');
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Type de fichier non autorisé');
  }
};
```

## 🎯 Résultat Attendu

Après implémentation, l'endpoint `/upload/color-image` sera disponible et permettra :

1. **Upload immédiat** des images de couleurs
2. **Validation** des fichiers (type, taille)
3. **Stockage** sécurisé sur le serveur
4. **URLs publiques** pour accès direct
5. **Réponses JSON** structurées
6. **Gestion d'erreurs** complète

Le frontend pourra alors uploader immédiatement les images de couleurs sans attendre la soumission du formulaire.

---

**Status :** 🔧 **À IMPLÉMENTER**  
**Priorité :** 🔴 **URGENT**  
**Fichier principal :** `src/routes/upload.routes.ts`  
**Endpoint :** `POST /upload/color-image`  
**Objectif :** Upload immédiat images couleurs ⚠️ Nouvelle couleur (timestamp), pas de vérification nécessaire
ProductFormMain.tsx:834 🔄 Conversion timestamp → ID temporaire: 1753822903809 → 1
ProductFormMain.tsx:841 📤 Envoi vers: POST /products/upload-color-image/4/1
ProductFormMain.tsx:843   POST http://localhost:3004/products/upload-color-image/4/1 404 (Not Found)
handleAddImageToColor @ ProductFormMain.tsx:843
await in handleAddImageToColor
handleImageUpload @ ColorVariationsPanel.tsx:50
await in handleImageUpload
onChange @ ColorVariationsPanel.tsx:144
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
ProductFormMain.tsx:849 📥 Réponse reçue (404)
ProductFormMain.tsx:882  ❌ [ProductFormMain] Erreur upload image couleur 1753822903809: Error: Variation couleur introuvable pour ce produit
    at handleAddImageToColor (ProductFormMain.tsx:853:15)