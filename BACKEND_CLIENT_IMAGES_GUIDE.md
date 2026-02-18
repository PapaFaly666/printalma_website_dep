# Guide Backend - Gestion des Images Uploadées par les Clients

## 📋 Vue d'ensemble

Ce document décrit l'implémentation backend nécessaire pour gérer les images uploadées par les clients lors de la personnalisation de produits.

### Objectifs
- Permettre aux clients d'uploader leurs propres images lors de la personnalisation
- Stocker ces images de manière permanente sur Cloudinary
- Associer les images aux personnalisations et commandes
- Gérer le cycle de vie des images (upload, sauvegarde, suppression)

---

## 🔧 Endpoint à implémenter

### `POST /customizations/upload-image`

Upload une image client vers Cloudinary et retourne les informations de l'image.

#### Headers
```http
Content-Type: multipart/form-data
Authorization: Bearer <token> (optionnel - peut être un guest)
```

#### Body (multipart/form-data)
```
file: File (image/* - max 10MB)
```

#### Response Success (200)
```json
{
  "url": "https://res.cloudinary.com/.../client-uploads/image_abc123.png",
  "publicId": "client-uploads/image_abc123",
  "width": 1920,
  "height": 1080
}
```

#### Response Error (400/500)
```json
{
  "error": "Message d'erreur",
  "message": "Description détaillée"
}
```

---

## 📦 Modèle de données

### Schema Prisma - Mise à jour

Aucune modification du schema Prisma n'est nécessaire car les `designElements` sont déjà stockés en JSON. Les nouvelles propriétés sont automatiquement incluses :

```typescript
// Structure d'un élément image dans designElements (JSON)
interface ImageElement {
  id: string;
  type: 'image';
  imageUrl: string;  // URL Cloudinary
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  naturalWidth: number;
  naturalHeight: number;

  // 💰 Pour les designs vendeur (optionnel)
  designId?: number;
  designPrice?: number;
  designName?: string;
  vendorId?: number;

  // 📤 Pour les uploads client (nouveau)
  cloudinaryPublicId?: string;
  isClientUpload?: boolean;
}
```

### Différenciation des images

| Type | designId | isClientUpload | cloudinaryPublicId | Prix |
|------|----------|----------------|-------------------|------|
| Design vendeur | ✅ Présent | ❌ false/undefined | ❌ Vide | ✅ Prix du design |
| Upload client | ❌ Absent | ✅ true | ✅ Présent | ❌ Gratuit (inclus) |

---

## 🔨 Implémentation Backend

### 1. Service d'Upload Cloudinary

Créer ou mettre à jour le service Cloudinary :

```typescript
// src/customization/services/cloudinary-upload.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryUploadService {
  constructor() {
    // Configuration Cloudinary (déjà configurée dans votre projet)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  /**
   * Upload une image client vers Cloudinary
   */
  async uploadClientImage(
    buffer: Buffer,
    filename: string,
    userId?: number,
    sessionId?: string
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      // Dossier spécifique pour les uploads client
      const folder = 'client-uploads';

      // Générer un public_id unique
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const userPrefix = userId ? `user_${userId}` : `guest_${sessionId?.substring(0, 8)}`;
      const publicId = `${folder}/${userPrefix}_${timestamp}_${randomStr}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: 'image',
          // Optimisations
          quality: 'auto:good',
          format: 'auto', // Auto-conversion au meilleur format
          // Limites de sécurité
          max_image_width: 4096,
          max_image_height: 4096,
          // Métadonnées
          context: {
            type: 'client_upload',
            uploaded_by: userId ? `user_${userId}` : `guest_${sessionId}`,
            original_filename: filename,
            uploaded_at: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) {
            console.error('❌ [Cloudinary] Erreur upload:', error);
            reject(error);
          } else {
            console.log('✅ [Cloudinary] Image uploadée:', {
              url: result.secure_url,
              publicId: result.public_id,
              dimensions: { width: result.width, height: result.height }
            });

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height
            });
          }
        }
      );

      // Convertir le buffer en stream et l'envoyer
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Supprimer une image client de Cloudinary
   */
  async deleteClientImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log('🗑️ [Cloudinary] Image supprimée:', publicId);
    } catch (error) {
      console.error('❌ [Cloudinary] Erreur suppression:', error);
      throw error;
    }
  }

  /**
   * Récupérer les informations d'une image
   */
  async getImageInfo(publicId: string): Promise<any> {
    try {
      return await cloudinary.api.resource(publicId);
    } catch (error) {
      console.error('❌ [Cloudinary] Erreur récupération info:', error);
      throw error;
    }
  }
}
```

### 2. Controller - Endpoint d'upload

```typescript
// src/customization/customization.controller.ts

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryUploadService } from './services/cloudinary-upload.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('customizations')
export class CustomizationController {
  constructor(
    private readonly cloudinaryUploadService: CloudinaryUploadService
  ) {}

  /**
   * Upload une image client
   * Authentification optionnelle (fonctionne pour guests et users connectés)
   */
  @Post('upload-image')
  @UseGuards(OptionalJwtAuthGuard) // Authentification optionnelle
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, cb) => {
        // Accepter uniquement les images
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Seules les images sont acceptées'),
            false
          );
        }
        cb(null, true);
      }
    })
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    try {
      console.log('📤 [Customization] Upload image client:', {
        filename: file.originalname,
        size: (file.size / 1024).toFixed(2) + ' KB',
        mimetype: file.mimetype,
        userId: req.user?.id,
        sessionId: req.body?.sessionId
      });

      // Extraire l'ID utilisateur ou sessionId
      const userId = req.user?.id;
      const sessionId = req.body?.sessionId || req.headers['x-session-id'];

      // Upload vers Cloudinary
      const result = await this.cloudinaryUploadService.uploadClientImage(
        file.buffer,
        file.originalname,
        userId,
        sessionId
      );

      console.log('✅ [Customization] Image uploadée avec succès:', {
        url: result.url,
        publicId: result.publicId
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('❌ [Customization] Erreur upload:', error);
      throw new BadRequestException(
        error.message || 'Erreur lors de l\'upload de l\'image'
      );
    }
  }
}
```

### 3. Guard d'authentification optionnelle

```typescript
// src/auth/guards/optional-jwt-auth.guard.ts

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard qui permet l'authentification optionnelle
 * L'utilisateur peut être connecté ou non (guest)
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // Pas d'erreur même si pas de token
    // user sera undefined pour les guests
    return user;
  }
}
```

### 4. Module - Enregistrement des services

```typescript
// src/customization/customization.module.ts

import { Module } from '@nestjs/common';
import { CustomizationController } from './customization.controller';
import { CustomizationService } from './customization.service';
import { CloudinaryUploadService } from './services/cloudinary-upload.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CustomizationController],
  providers: [
    CustomizationService,
    CloudinaryUploadService,
    PrismaService
  ],
  exports: [CustomizationService, CloudinaryUploadService]
})
export class CustomizationModule {}
```

---

## 🔐 Sécurité et Validation

### Validation des fichiers

```typescript
// Validations à implémenter dans le FileFilter

1. **Type MIME**: Uniquement image/* (jpg, jpeg, png, gif, webp)
2. **Taille max**: 10 MB
3. **Dimensions max**: 4096x4096 pixels (via Cloudinary)
4. **Format**: Conversion auto au meilleur format par Cloudinary
```

### Limites de taux (Rate Limiting)

```typescript
// Exemple avec @nestjs/throttler

@Throttle(10, 60) // 10 uploads par minute max par IP
@Post('upload-image')
async uploadImage(...) { ... }
```

### Nettoyage des images orphelines

Créer une tâche CRON pour supprimer les images non utilisées :

```typescript
// src/customization/tasks/cleanup-images.task.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryUploadService } from '../services/cloudinary-upload.service';

@Injectable()
export class CleanupImagesTask {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryUploadService
  ) {}

  /**
   * Nettoyer les images uploadées non associées à une commande
   * Exécution: tous les jours à 3h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanedImages() {
    console.log('🧹 [Cleanup] Démarrage nettoyage images orphelines...');

    try {
      // 1. Trouver toutes les customizations "draft" de plus de 7 jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const oldDrafts = await this.prisma.customization.findMany({
        where: {
          status: 'DRAFT',
          orderId: null,
          createdAt: {
            lt: sevenDaysAgo
          }
        }
      });

      console.log(`📋 [Cleanup] ${oldDrafts.length} drafts anciens trouvés`);

      // 2. Pour chaque draft, extraire et supprimer les images client
      let deletedCount = 0;

      for (const draft of oldDrafts) {
        const designElements = draft.designElements as any[];

        if (designElements && Array.isArray(designElements)) {
          for (const element of designElements) {
            if (element.type === 'image' &&
                element.isClientUpload &&
                element.cloudinaryPublicId) {
              try {
                await this.cloudinaryService.deleteClientImage(
                  element.cloudinaryPublicId
                );
                deletedCount++;
                console.log(`🗑️ [Cleanup] Image supprimée: ${element.cloudinaryPublicId}`);
              } catch (error) {
                console.error(`❌ [Cleanup] Erreur suppression ${element.cloudinaryPublicId}:`, error);
              }
            }
          }
        }

        // 3. Supprimer le draft lui-même
        await this.prisma.customization.delete({
          where: { id: draft.id }
        });
      }

      console.log(`✅ [Cleanup] Nettoyage terminé: ${deletedCount} images supprimées, ${oldDrafts.length} drafts supprimés`);
    } catch (error) {
      console.error('❌ [Cleanup] Erreur lors du nettoyage:', error);
    }
  }
}
```

---

## 💾 Gestion des Commandes

### Lors de la création d'une commande

Les images client sont déjà incluses dans les `designElements` de la customization. Aucune modification n'est nécessaire.

**Important** : Ne pas supprimer les images client même si la customization est associée à une commande, car elles font partie du design final.

### Structure dans la BDD

```json
// Exemple d'ordre avec une image client
{
  "id": 123,
  "customizationId": 456,
  "customization": {
    "designElements": [
      {
        "id": "element-abc123",
        "type": "image",
        "imageUrl": "https://res.cloudinary.com/.../client-uploads/user_5_1234567890_abc123.png",
        "cloudinaryPublicId": "client-uploads/user_5_1234567890_abc123",
        "isClientUpload": true,
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 200,
        "rotation": 0,
        "zIndex": 1
      },
      {
        "id": "element-def456",
        "type": "image",
        "imageUrl": "https://res.cloudinary.com/.../designs/vendor_design_789.png",
        "designId": 789,
        "designPrice": 2000,
        "designName": "Logo Entreprise",
        "vendorId": 12,
        "x": 0.3,
        "y": 0.3,
        "width": 150,
        "height": 150,
        "rotation": 0,
        "zIndex": 0
      }
    ]
  }
}
```

---

## 📊 Calcul des Prix

### Règles de prix

| Type d'image | Coût pour le client | Commission vendeur |
|--------------|-------------------|-------------------|
| Upload client | ✅ Gratuit (inclus dans le produit) | ❌ Aucune |
| Design vendeur | ✅ Prix du design (ex: 2000 FCFA) | ✅ Commission sur le prix du design |

### Logique de calcul

```typescript
// Service de calcul des prix

calculateOrderPrice(customizations: Customization[]): OrderPricing {
  let productPrice = 0;
  let designsPrice = 0;
  let vendorCommissions = [];

  for (const customization of customizations) {
    // Prix du produit (taille, etc.)
    productPrice += customization.product.price;

    // Prix des designs vendeur uniquement
    const designElements = customization.designElements as any[];
    const uniqueDesigns = new Set();

    for (const element of designElements) {
      if (element.type === 'image' && element.designId && element.designPrice) {
        // Design vendeur payant
        if (!uniqueDesigns.has(element.designId)) {
          uniqueDesigns.add(element.designId);
          designsPrice += element.designPrice;

          // Calculer la commission vendeur
          if (element.vendorId && element.vendorCommissionRate) {
            vendorCommissions.push({
              vendorId: element.vendorId,
              designId: element.designId,
              amount: element.designPrice * (element.vendorCommissionRate / 100)
            });
          }
        }
      }
      // Les images client (isClientUpload: true) n'ajoutent rien au prix
    }
  }

  return {
    productPrice,
    designsPrice,
    totalPrice: productPrice + designsPrice,
    vendorCommissions
  };
}
```

---

## 🧪 Tests

### Tests unitaires

```typescript
// src/customization/customization.controller.spec.ts

describe('CustomizationController - Upload Image', () => {
  it('devrait uploader une image client avec succès', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-data'),
      originalname: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 500 // 500 KB
    };

    const result = await controller.uploadImage(mockFile, { user: { id: 5 } });

    expect(result.success).toBe(true);
    expect(result.url).toContain('cloudinary.com');
    expect(result.publicId).toContain('client-uploads');
  });

  it('devrait rejeter un fichier trop volumineux', async () => {
    const mockFile = {
      buffer: Buffer.alloc(11 * 1024 * 1024), // 11 MB
      originalname: 'large-image.jpg',
      mimetype: 'image/jpeg',
      size: 11 * 1024 * 1024
    };

    await expect(
      controller.uploadImage(mockFile, {})
    ).rejects.toThrow(BadRequestException);
  });

  it('devrait rejeter un fichier non-image', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-pdf-data'),
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 1024
    };

    await expect(
      controller.uploadImage(mockFile, {})
    ).rejects.toThrow(BadRequestException);
  });
});
```

### Tests d'intégration

```bash
# Test manuel avec curl

curl -X POST http://localhost:3004/customizations/upload-image \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg"
```

---

## 📈 Monitoring et Logs

### Logs à implémenter

```typescript
// Logs recommandés

console.log('📤 [Upload] Début upload', { userId, filename, size });
console.log('✅ [Upload] Upload réussi', { url, publicId, duration });
console.log('❌ [Upload] Erreur', { error, userId, filename });
console.log('🗑️ [Cleanup] Suppression image', { publicId, reason });
console.log('💰 [Order] Calcul prix', { productPrice, designsPrice, total });
```

### Métriques à tracker

- Nombre d'uploads par jour/semaine/mois
- Taille moyenne des images uploadées
- Taux d'échec des uploads
- Nombre d'images orphelines supprimées
- Espace disque utilisé sur Cloudinary

---

## 🚀 Déploiement

### Variables d'environnement

Ajouter au `.env` :

```env
# Cloudinary (déjà configuré normalement)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Limites d'upload
MAX_FILE_SIZE=10485760  # 10MB en bytes
MAX_IMAGE_WIDTH=4096
MAX_IMAGE_HEIGHT=4096

# Nettoyage
CLEANUP_DRAFTS_DAYS=7  # Supprimer les drafts > 7 jours
```

### Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Service Cloudinary opérationnel
- [ ] Endpoint `/customizations/upload-image` accessible
- [ ] Rate limiting activé
- [ ] Tâche CRON de nettoyage configurée
- [ ] Logs et monitoring en place
- [ ] Tests effectués en environnement de staging

---

## 📚 Résumé du Flow Complet

```
┌─────────────────────────────────────────────────────────────┐
│  1. CLIENT UPLOAD IMAGE                                      │
│     └─> ProductDesignEditor.triggerImageUpload()            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. FRONTEND UPLOAD TO BACKEND                               │
│     └─> customizationService.uploadImage(file)              │
│         POST /customizations/upload-image                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. BACKEND UPLOAD TO CLOUDINARY                             │
│     └─> CloudinaryUploadService.uploadClientImage()         │
│         - Validation (type, taille)                          │
│         - Upload vers folder 'client-uploads'                │
│         - Retour: { url, publicId, width, height }           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. FRONTEND AJOUTE IMAGE AU DESIGN                          │
│     └─> addImage(url, width, height, ..., publicId)         │
│         - Création ImageElement avec isClientUpload: true    │
│         - Stockage dans designElements                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. SAUVEGARDE CUSTOMIZATION                                 │
│     └─> customizationService.saveCustomization()            │
│         POST /customizations                                 │
│         - designElements incluent l'image client             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. CRÉATION COMMANDE                                        │
│     └─> Les images sont dans designElements                 │
│         - Designs vendeur: ajoutent au prix                  │
│         - Images client: gratuites                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  7. PRODUCTION & LIVRAISON                                   │
│     └─> Images accessibles via URL Cloudinary               │
│         - Génération du mockup final                         │
│         - Export PDF/PNG                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Notes Importantes

### Différences avec les designs vendeur

| Aspect | Design Vendeur | Upload Client |
|--------|---------------|---------------|
| **Source** | Galerie designs | Upload direct |
| **Stockage** | Dossier `designs/` | Dossier `client-uploads/` |
| **Prix** | Prix du design | Gratuit (inclus) |
| **Commission** | Oui (vendeur) | Non |
| **Propriété** | Vendeur | Client |
| **Réutilisable** | Oui (catalogue) | Non (usage unique) |
| **Suppression** | Jamais (sauf par vendeur) | Après 7 jours si draft |

### Performance

- **Upload**: ~2-5 secondes pour une image de 2MB
- **Stockage**: Illimité sur Cloudinary (dans les limites du plan)
- **Bande passante**: Optimisée par Cloudinary CDN
- **Format**: Conversion automatique au meilleur format (WebP si supporté)

### Limitations

- Taille max: 10MB par image
- Dimensions max: 4096x4096 pixels
- Formats acceptés: JPG, PNG, GIF, WebP
- Rate limit: 10 uploads/minute par utilisateur

---

## 🆘 Troubleshooting

### Erreur "File too large"
- Vérifier `MAX_FILE_SIZE` dans `.env`
- Vérifier la config de `FileInterceptor`

### Erreur "Invalid file type"
- S'assurer que le MIME type commence par `image/`
- Vérifier le `fileFilter` du `FileInterceptor`

### Image non affichée
- Vérifier que l'URL Cloudinary est accessible
- Vérifier les CORS si nécessaire
- Vérifier que `publicId` est correct

### Problème de nettoyage
- Vérifier que la tâche CRON s'exécute
- Vérifier les logs de `CleanupImagesTask`
- Vérifier la connexion Cloudinary API

---

**Date de création**: 2 février 2026
**Version**: 1.0.0
**Auteur**: Claude Sonnet 4.5
