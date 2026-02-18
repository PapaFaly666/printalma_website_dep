# Fix - Upload d'Images Client (Erreur 400 Bad Request)

## 🐛 Problème Résolu

**Erreur:** `POST /customizations/upload-image` retournait une erreur `400 Bad Request`

**Cause:** Le header `Content-Type: multipart/form-data` était spécifié manuellement dans la requête axios, ce qui empêchait axios d'ajouter automatiquement la `boundary` nécessaire pour les requêtes multipart.

---

## ✅ Corrections Appliquées

### 1. **`src/services/customizationService.ts`**

#### Avant (❌ Incorrect)
```typescript
const response = await axios.post(`${API_BASE}/customizations/upload-image`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data', // ❌ NE PAS FAIRE ÇA
    ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
  }
});
```

#### Après (✅ Correct)
```typescript
const response = await axios.post(`${API_BASE}/customizations/upload-image`, formData, {
  headers: {
    // ✅ Axios gère automatiquement le Content-Type avec la boundary
    ...(token && { Authorization: `Bearer ${token}` })
  }
});
```

**Changements:**
- ✅ Suppression du header `Content-Type: multipart/form-data`
- ✅ Ajout du `sessionId` pour les guests (utilisateurs non connectés)
- ✅ Amélioration des logs de debug
- ✅ Meilleure extraction des messages d'erreur backend

---

### 2. **`src/components/ProductDesignEditor.tsx`**

**Changements:**
- ✅ Gestion d'erreur améliorée avec messages personnalisés
- ✅ Messages utilisateur plus clairs selon le type d'erreur:
  - Fichier trop volumineux (>10MB)
  - Format non supporté
  - Aucun fichier sélectionné
- ✅ Logs de debug avec status HTTP

---

## 🔍 Pourquoi ça ne fonctionnait pas ?

### Explication Technique

Quand on envoie un fichier avec `multipart/form-data`, le header doit contenir une **boundary** unique qui sépare les différentes parties du formulaire. Par exemple :

```http
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
```

**Problème :** En spécifiant manuellement `Content-Type: multipart/form-data` sans la boundary, axios ne peut pas l'ajouter automatiquement, et le serveur ne peut pas parser correctement la requête.

**Solution :** Laisser axios gérer automatiquement le `Content-Type` quand on utilise `FormData`. Axios détecte automatiquement qu'on envoie un `FormData` et ajoute le bon header avec la boundary.

---

## 📋 Checklist de Vérification Backend

Pour que l'upload fonctionne, vérifiez que le backend a bien :

### 1. **Controller configuré correctement**

```typescript
@Post('upload-image')
@UseInterceptors(
  FileInterceptor('file', {  // ✅ Le nom doit être 'file'
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Invalid file type'), false);
      }
      cb(null, true);
    }
  })
)
async uploadImage(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

### 2. **Validation du fichier**

```typescript
// Le backend doit vérifier :
- file.mimetype commence par 'image/'
- file.size <= 10 * 1024 * 1024 (10MB)
- Formats acceptés: image/jpeg, image/png, image/gif, image/webp
```

### 3. **Gestion des guests**

```typescript
// Le backend doit accepter :
- Authorization: Bearer <token> (utilisateur connecté)
- OU sessionId dans le body (guest)

// Exemple extraction :
const userId = req.user?.id;
const sessionId = req.body?.sessionId || req.headers['x-session-id'];
```

### 4. **Response format**

```typescript
// Le backend doit retourner :
{
  "success": true,
  "url": "https://res.cloudinary.com/.../client-uploads/...",
  "publicId": "client-uploads/user_5_...",
  "width": 1920,
  "height": 1080
}
```

---

## 🧪 Tests

### Test avec cURL

```bash
# Test fichier valide
curl -X POST http://localhost:3004/customizations/upload-image \
  -F "file=@/path/to/image.jpg"

# Devrait retourner 200 avec:
# { "success": true, "url": "...", "publicId": "...", "width": ..., "height": ... }

# Test fichier trop gros (>10MB)
curl -X POST http://localhost:3004/customizations/upload-image \
  -F "file=@/path/to/large-image.jpg"

# Devrait retourner 400 avec:
# { "statusCode": 400, "message": "File size exceeds..." }

# Test format invalide
curl -X POST http://localhost:3004/customizations/upload-image \
  -F "file=@/path/to/document.pdf"

# Devrait retourner 400 avec:
# { "statusCode": 400, "message": "Invalid file type..." }
```

### Test Frontend

1. Ouvrir la page de personnalisation : `http://localhost:5174/product/1/customize`
2. Cliquer sur "Importer" (icône Upload)
3. Sélectionner une image JPEG/PNG < 10MB
4. Vérifier les logs dans la console :
   ```
   📤 [CustomizationService] Upload image: { fileName: "...", fileSize: "...", fileType: "..." }
   ✅ [CustomizationService] Image uploadée: { url: "...", publicId: "..." }
   ✅ [ProductDesignEditor] Image uploadée avec succès: { ... }
   ```
5. L'image devrait apparaître dans l'éditeur

---

## 🚨 Erreurs Courantes Backend

### Erreur 1: "No file provided"

**Cause:** Le nom du champ FormData ne correspond pas au nom attendu par le backend

**Solution:**
```typescript
// Frontend
formData.append('file', file);  // ✅ Doit être 'file'

// Backend
@UseInterceptors(FileInterceptor('file'))  // ✅ Doit correspondre
```

### Erreur 2: "File size exceeds limit"

**Cause:** La limite de taille est trop restrictive ou le fichier est trop gros

**Solution:**
```typescript
// Backend - Augmenter la limite si nécessaire
limits: {
  fileSize: 10 * 1024 * 1024, // 10MB
}
```

### Erreur 3: "Invalid file type"

**Cause:** Le type MIME n'est pas accepté

**Solution:**
```typescript
// Backend - Accepter les types image/*
fileFilter: (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException(`Type invalide: ${file.mimetype}`), false);
  }
}
```

### Erreur 4: "Cloudinary upload failed"

**Cause:** Problème de configuration Cloudinary

**Solution:**
```typescript
// Vérifier les variables d'environnement
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

// Vérifier la configuration dans le code
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

---

## 📊 Logs de Debug

### Frontend

```javascript
// Avant l'upload
📤 [CustomizationService] Upload image: {
  fileName: "photo.jpg",
  fileSize: "2048.00 KB",
  fileType: "image/jpeg"
}

// Pour guest
👤 [CustomizationService] Guest upload avec sessionId: guest_1706870400000_abc123

// Succès
✅ [CustomizationService] Image uploadée: {
  url: "https://res.cloudinary.com/.../client-uploads/...",
  publicId: "client-uploads/user_5_1706870400000_abc123",
  width: 1920,
  height: 1080
}

// Erreur
❌ [CustomizationService] Erreur upload image: Error: File size exceeds limit
📝 [CustomizationService] Détails erreur: {
  status: 400,
  statusText: "Bad Request",
  data: { statusCode: 400, message: "File size exceeds..." }
}
```

### Backend (Attendu)

```typescript
// Réception requête
📤 [Customization] Upload image client: {
  filename: "photo.jpg",
  size: "2097152 KB",
  mimetype: "image/jpeg",
  userId: 5,
  sessionId: undefined
}

// Upload Cloudinary
✅ [Cloudinary] Image uploadée: {
  url: "https://res.cloudinary.com/...",
  publicId: "client-uploads/user_5_1706870400000_abc123",
  dimensions: { width: 1920, height: 1080 }
}

// Retour
✅ [Customization] Image uploadée avec succès: {
  url: "...",
  publicId: "..."
}
```

---

## 🔐 Sécurité

### Validations Requises

1. **Type de fichier** : Uniquement `image/jpeg`, `image/png`, `image/gif`, `image/webp`
2. **Taille** : Maximum 10MB
3. **Dimensions** : Maximum 4096x4096 pixels (validé par Cloudinary)
4. **Rate Limiting** : Maximum 10 uploads par minute par IP/utilisateur

### Configuration Recommandée

```typescript
// Backend - Middleware de rate limiting
@Throttle(10, 60)  // 10 requêtes par 60 secondes
@Post('upload-image')
async uploadImage(...) { ... }
```

---

## 📚 Références

- **Documentation Backend Complète** : `BACKEND_CLIENT_IMAGES_GUIDE.md`
- **Documentation Frontend** : `FRONTEND_IMAGE_UPLOAD_GUIDE.md`
- **Axios avec FormData** : https://axios-http.com/docs/multipart
- **NestJS FileInterceptor** : https://docs.nestjs.com/techniques/file-upload

---

## ✅ Résumé

**Problème :** 400 Bad Request lors de l'upload d'image

**Solution :**
1. ✅ Ne PAS spécifier `Content-Type: multipart/form-data` manuellement
2. ✅ Laisser axios gérer automatiquement le header avec la boundary
3. ✅ Ajouter le `sessionId` pour les guests
4. ✅ Améliorer la gestion d'erreur avec messages clairs

**Prochaines étapes :**
1. Vérifier que le backend implémente correctement l'endpoint
2. Tester l'upload avec différentes tailles et formats d'images
3. Vérifier que les images sont bien sauvegardées dans Cloudinary
4. Tester la commande avec des images client

---

**Date de résolution** : 2 février 2026
**Version** : 1.0.1
**Auteur** : Claude Sonnet 4.5
