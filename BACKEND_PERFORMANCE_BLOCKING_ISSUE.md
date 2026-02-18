# 🔴 Problème de Blocage et Performance - Guide de Résolution Backend

## 📋 Table des Matières

1. [Description du Problème](#description-du-problème)
2. [Symptômes Observés](#symptômes-observés)
3. [Causes Probables](#causes-probables)
4. [Solutions Immédiates](#solutions-immédiates)
5. [Optimisations Long Terme](#optimisations-long-terme)
6. [Monitoring et Debugging](#monitoring-et-debugging)

---

## 🔴 Description du Problème

### Localisation
- **Page affectée** : `/vendeur/sell-design` (`SellDesignPage.tsx`)
- **Endpoint backend** : `POST /vendor/products`
- **Symptôme principal** : L'interface se bloque complètement lors de la création de produits, et reste bloquée même après navigation vers d'autres pages

### Comportement
```
1. Vendeur sélectionne des produits avec des couleurs
2. Clique sur "Publier" ou "Sauvegarder en brouillon"
3. Modal de progression apparaît
4. API est appelée: POST /vendor/products
5. L'UI devient non-responsive
6. Même après navigation vers une autre page, l'UI reste bloquée
```

---

## 👁️ Symptômes Observés

### Frontend
- ✅ Modal de progression s'affiche correctement
- ✅ Appels API sont bien envoyés
- ❌ L'UI ne répond plus aux interactions
- ❌ Le blocage persiste après navigation
- ❌ Le navigateur peut devenir lent/planté

### Backend (probable)
- ⚠️ **Requêtes qui prennent trop de temps** (> 10-30 secondes)
- ⚠️ **Génération d'images synchrone** qui bloque le thread
- ⚠️ **Uploads multiples vers Cloudinary** sans parallélisation
- ⚠️ **Manque de timeouts** sur les opérations externes
- ⚠️ **Memory leaks** potentiels lors du traitement d'images

---

## 🔍 Causes Probables

### 1. Génération d'Images Synchrone (CRITIQUE)

**Problème** : Le backend génère probablement les images avec le design de manière synchrone :

```typescript
// ❌ MAUVAIS - Code actuel probable
async createVendorProduct(dto: VendorPublishDto) {
  // 1. Créer le produit en BDD
  const product = await this.prisma.vendorProduct.create({ ... });

  // 2. Générer les images pour CHAQUE couleur (BLOQUANT)
  for (const color of selectedColors) {
    const finalImage = await this.generateImageWithDesign(product, color);
    await this.uploadToCloudinary(finalImage);
  }

  // 3. Retourner la réponse (après plusieurs secondes/minutes)
  return { success: true, productId: product.id };
}
```

**Pourquoi c'est problématique** :
- Si 5 couleurs sont sélectionnées × 3 secondes par couleur = **15 secondes minimum**
- Le thread Node.js est bloqué pendant ce temps
- Le frontend attend la réponse sans feedback
- Sharp (traitement d'image) est CPU-intensive

### 2. Uploads Cloudinary Séquentiels

```typescript
// ❌ MAUVAIS - Uploads séquentiels
for (const color of colors) {
  const uploadResult = await cloudinary.uploader.upload(imageBuffer);
  // Attendre que chaque upload termine avant le suivant
}
```

### 3. Pas de Timeout sur les Opérations Externes

```typescript
// ❌ MAUVAIS - Pas de timeout
await cloudinary.uploader.upload(imageBuffer); // Peut prendre 30s+ si réseau lent
```

### 4. Pas de Queue de Traitement

Toutes les opérations sont faites dans la requête HTTP, ce qui :

- Bloque la réponse HTTP
- Empêche le scaling horizontal
- Risque de timeout si beaucoup de produits

---

## ✅ Solutions Immédiates

### Priorité 1 : Ajouter des Timeouts (CRITIQUE)

```typescript
// ✅ CORRECT - Ajouter des timeouts
import { setTimeout } from 'timers/promises';

// Timeout pour Cloudinary upload
const uploadWithTimeout = async (buffer: Buffer, options: any) => {
  const UPLOAD_TIMEOUT = 10000; // 10 secondes max

  const uploadPromise = cloudinary.uploader.upload(buffer, options);
  const timeoutPromise = setTimeout(UPLOAD_TIMEOUT);

  const result = await Promise.race([uploadPromise, timeoutPromise]);

  if (!result) {
    throw new Error('Upload timeout - opération annulée');
  }

  return result;
};
```

### Priorité 2 : Paralléliser les Uploads Cloudinary

```typescript
// ✅ CORRECT - Uploads parallèles
import { PromisePool } from '@supercharge/promise-pool';

// Traiter toutes les couleurs en parallèle (max 3 à la fois)
const { results } = await PromisePool
  .for(selectedColors)
  .withConcurrency(3) // Max 3 uploads en parallèle
  .process(async (color) => {
    const finalImage = await this.generateImageWithDesign(product, color);
    const uploadResult = await uploadWithTimeout(finalImage.buffer, {
      folder: `vendor-products/${product.id}`,
      timeout: 10000
    });

    return {
      colorId: color.id,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };
  });
```

### Priorité 3 : Retourner Réponse Immédiate + Traitement Asynchrone

```typescript
// ✅ CORRECT - Réponse immédiate
@Post()
async createVendorProduct(@Body() dto: VendorPublishDto) {
  // 1. Créer le produit en BDD avec status "PROCESSING"
  const product = await this.prisma.vendorProduct.create({
    data: {
      ...dto,
      status: 'PROCESSING', // ✅ Nouveau status
      imagesGenerated: false
    }
  });

  // 2. Retourner IMMÉDIATEMENT la réponse
  // Le frontend sait que le traitement est en cours
  const response = {
    success: true,
    productId: product.id,
    status: 'PROCESSING',
    message: 'Produit créé. Génération des images en cours...'
  };

  // 3. Lancer la génération d'images en ARRIÈRE-PLAN (non-bloquant)
  this.generateImagesInBackground(product.id, dto.selectedColors)
    .catch(err => console.error('Erreur génération images:', err));

  return response;
}

// ✅ Nouvelle méthode pour traitement asynchrone
private async generateImagesInBackground(productId: number, colors: any[]) {
  try {
    console.log(`🎨 Début génération asynchrone pour produit ${productId}`);

    // Marquer le produit comme "en cours de traitement"
    await this.prisma.vendorProduct.update({
      where: { id: productId },
      data: { status: 'PROCESSING' }
    });

    // Générer les images
    const generatedImages = await this.generateAllImages(productId, colors);

    // Mettre à jour le produit avec les URLs générées
    await this.prisma.vendorProduct.update({
      where: { id: productId },
      data: {
        status: 'PUBLISHED', // ✅ Prêt à être affiché
        finalImages: generatedImages,
        imagesGenerated: true
      }
    });

    console.log(`✅ Génération terminée pour produit ${productId}`);

    // 📡 Optionnel: WebSocket notification au frontend
    // this.gateway.sendToUser(product.vendorId, {
    //   type: 'PRODUCT_IMAGES_GENERATED',
    //   productId,
    //   images: generatedImages
    // });

  } catch (error) {
    // Marquer comme échec
    await this.prisma.vendorProduct.update({
      where: { id: productId },
      data: { status: 'ERROR' }
    });

    console.error(`❌ Erreur génération images pour produit ${productId}:`, error);
  }
}
```

### Priorité 4 : Optimiser la Génération d'Images

```typescript
// ✅ CORRECT - Optimisations Sharp
import sharp from 'sharp';

// Créer une instance Sharp réutilisable
const sharpInstance = sharp({
  // Limiter l'utilisation mémoire
  limitInputPixels: 268402689, // ~16384x16384 max
  // Utiliser moins de mémoire
  failOnError: false,
  // Activer le cache libvips
  cache: true
});

// Optimiser la génération
private async generateImageWithDesign(product: any, color: any): Promise<Buffer> {
  try {
    // 1. Télécharger les images en parallèle
    const [mockupBuffer, designBuffer] = await Promise.all([
      this.downloadWithTimeout(product.mockupUrl, 5000),
      this.downloadWithTimeout(product.designUrl, 5000)
    ]);

    // 2. Utiliser Sharp avec des options optimisées
    const image = sharp(mockupBuffer, {
      failOnError: false // Ne pas échouer si image corrompue
    });

    // 3. Redimensionner si nécessaire (avec qualité optimale)
    const resized = image
      .resize(1200, 1200, { // Taille fixe pour cohérence
        fit: 'inside',
        withoutEnlargement: true // Ne pas agrandir si plus petit
      })
      .png({ // Format PNG avec compression
        compressionLevel: 9, // Compression maximale
        quality: 90,
        effort: 7 // Équilibre vitesse/qualité
      });

    // 4. Appliquer le design (si nécessaire)
    if (designBuffer) {
      // Composite le design sur le mockup
      const composite = await resized
        .composite([{
          input: designBuffer,
          gravity: 'center',
          blend: 'over'
        }])
        .toBuffer();

      return composite;
    }

    return await resized.toBuffer();

  } catch (error) {
    console.error(`Erreur génération image pour ${color.name}:`, error);
    throw error;
  }
}

// ✅ Téléchargement avec timeout
private async downloadWithTimeout(url: string, timeoutMs: number): Promise<Buffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // Timeout global
      // @ts-ignore
      timeout: timeoutMs
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    clearTimeout(timeoutId);

    return Buffer.from(buffer);

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`Timeout téléchargement (${timeoutMs}ms)`);
    }

    throw error;
  }
}
```

---

## 🚀 Optimisations Long Terme

### 1. Implémenter une Queue de Traitement (BullMQ)

```bash
npm install @nestjs/bullmq bull
npm install --save-dev @types/bull
```

```typescript
// ✅ CORRECT - Queue pour traitement asynchrone
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

// Configuration
const imageGenerationQueue = new Queue('image-generation', {
  connection: new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
  }),
});

// Ajouter un job à la queue
async createVendorProduct(dto: VendorPublishDto) {
  const product = await this.prisma.vendorProduct.create({
    data: {
      ...dto,
      status: 'QUEUED' // ✅ En attente de traitement
    }
  });

  // Ajouter à la queue
  await imageGenerationQueue.add('generate-images', {
    productId: product.id,
    colors: dto.selectedColors
  }, {
    // Options de job
    attempts: 3, // Réessayer 3 fois en cas d'échec
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    timeout: 60000 // 1 minute max par couleur
  });

  return {
    success: true,
    productId: product.id,
    status: 'QUEUED'
  };
}

// Worker (dans un service séparé ou microservice)
const worker = new Worker('image-generation', async (job) => {
  const { productId, colors } = job.data;

  try {
    // Mettre à jour le statut
    await updateProductStatus(productId, 'PROCESSING');

    // Générer les images
    const results = await generateAllImages(productId, colors);

    // Marquer comme terminé
    await updateProductStatus(productId, 'PUBLISHED');

    return results;

  } catch (error) {
    await updateProductStatus(productId, 'ERROR');
    throw error;
  }
}, {
  connection: new Redis(),
  concurrency: 3 // Max 3 jobs en parallèle
});

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} terminé`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} échoué:`, err);
});
```

### 2. Mettre en Cache les Images Générées

```typescript
// ✅ CORRECT - Cache des images générées
import { Cache } from 'cache-manager';

// Clé de cache: `product:${productId}:color:${colorId}:final`
async getCachedImage(productId: number, colorId: number): Promise<Buffer | null> {
  const cacheKey = `product:${productId}:color:${colorId}:final`;

  const cached = await this.cacheManager.get<Buffer>(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit pour ${cacheKey}`);
    return cached;
  }

  return null;
}

async generateImageWithCache(product: any, color: any): Promise<string> {
  // Vérifier le cache d'abord
  const cached = await this.getCachedImage(product.id, color.id);
  if (cached) {
    return cached; // Ou uploader directement le cache
  }

  // Générer l'image
  const buffer = await this.generateImageWithDesign(product, color);

  // Mettre en cache (24h)
  await this.cacheManager.set(
    `product:${product.id}:color:${color.id}:final`,
    buffer,
    86400 // 24 heures
  );

  return buffer;
}
```

### 3. Utiliser un CDN pour les Images Générées

```typescript
// ✅ CORRECT - Upload direct vers CDN
const uploadResult = await cloudinary.uploader.upload(buffer, {
  folder: 'vendor-products',
  // Optimisations CDN
  transformation: [
    { quality: 'auto', fetch_format: 'auto' },
    { width: 1200, height: 1200, crop: 'limit' }
  ],
  // Activer le CDN
  cdn_subdomain: true,
  secure: true,
  // Cache-Control header
  headers: [ 'Cache-Control: max-age=31536000' ]
});
```

### 4. Ajouter des WebSockets pour les Notifications en Temps Réel

```typescript
// ✅ CORRECT - Notifications temps réel
@WebSocketGateway()
export class ProductGateway {
  @WebSocketServer()
  server: Server;

  // Notifier le frontend quand la génération est terminée
  notifyImagesGenerated(vendorId: number, productId: number, images: any[]) {
    this.server.emit(`vendor:${vendorId}:products`, {
      type: 'IMAGES_GENERATED',
      productId,
      images,
      timestamp: new Date().toISOString()
    });
  }

  // Notifier la progression
  notifyProgress(vendorId: number, productId: number, progress: number) {
    this.server.emit(`vendor:${vendorId}:products`, {
      type: 'GENERATION_PROGRESS',
      productId,
      progress,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## 📊 Monitoring et Debugging

### 1. Ajouter des Logs de Performance

```typescript
// ✅ CORRECT - Logs de performance
import { logger } from '@/utils/logger';

async createVendorProduct(dto: VendorPublishDto) {
  const startTime = Date.now();

  logger.log(`🚀 [PRODUCT] Début création produit - ${dto.vendorName}`);

  try {
    // 1. Création BDD
    const dbStart = Date.now();
    const product = await this.prisma.vendorProduct.create({ ... });
    logger.log(`✅ [PRODUCT] BDD créé en ${Date.now() - dbStart}ms`);

    // 2. Génération images
    const genStart = Date.now();
    const images = await this.generateAllImages(product.id, dto.selectedColors);
    logger.log(`🎨 [PRODUCT] Images générées en ${Date.now() - genStart}ms (${images.length} images)`);

    // 3. Upload Cloudinary
    const uploadStart = Date.now();
    const uploadResults = await this.uploadAllImages(images);
    logger.log(`☁️ [PRODUCT] Upload terminé en ${Date.now() - uploadStart}ms (${uploadResults.length} uploads)`);

    const totalTime = Date.now() - startTime;
    logger.log(`✅ [PRODUCT] Produit créé en ${totalTime}ms (${totalTime/1000}s)`);

    return { success: true, productId: product.id };

  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error(`❌ [PRODUCT] Erreur après ${totalTime}ms:`, error);
    throw error;
  }
}
```

### 2. Métriques de Performance

```typescript
// ✅ CORRECT - Métriques Prometheus/OpenTelemetry
import { Counter, Histogram } from 'prom-client';

// Métriques
const productCreationDuration = new Histogram({
  name: 'product_creation_duration_seconds',
  help: 'Durée de création des produits',
  labelNames: ['status', 'colors_count']
});

const imageGenerationDuration = new Histogram({
  name: 'image_generation_duration_seconds',
  help: 'Durée de génération des images',
  labelNames: ['color_name', 'status']
});

// Utilisation
const endDuration = productCreationDuration.startTimer();
try {
  await this.createVendorProduct(dto);
  endDuration({ status: 'success', colors_count: dto.selectedColors.length });
} catch (error) {
  endDuration({ status: 'error', colors_count: dto.selectedColors.length });
}
```

### 3. Alertes et Monitoring

```yaml
# ✅ Alertes Prometheus (ex: prometheus.yml)
groups:
  - name: product_creation
    rules:
      - alert: ProductCreationSlow
        expr: product_creation_duration_seconds{quantile="0.95"} > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Création de produit lente"
          description: "95% des créations prennent plus de 30 secondes"

      - alert: ProductCreationTimeout
        expr: rate(product_creation_duration_seconds_count{status="error"}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Timeouts de création de produit"
          description: "Plus de 10% des créations échouent"
```

---

## 📝 Checklist d'Implémentation

### Phase 1 : Urgent (Aujourd'hui)

- [ ] **Ajouter des timeouts** sur tous les appels externes (Cloudinary, téléchargements)
- [ ] **Limite de temps** par couleur (ex: 10 secondes max)
- [ ] **Logs de performance** pour identifier les goulots d'étranglement
- [ ] **Timeout global** sur la requête HTTP (ex: 60 secondes)

### Phase 2 : Court Terme (Cette semaine)

- [ ] **Paralléliser les uploads** vers Cloudinary (concurrency: 3)
- [ ] **Retourner une réponse immédiate** avec status "PROCESSING"
- [ ] **Génération d'images asynchrone** en arrière-plan
- [ ] **Endpoint de statut** pour vérifier la progression

### Phase 3 : Moyen Terme (Ce mois)

- [ ] **Implémenter BullMQ** pour la queue de traitement
- [ ] **Cache des images générées** (Redis ou in-memory)
- [ ] **WebSockets** pour notifications temps réel
- [ ] **Monitoring Prometheus** pour les métriques

### Phase 4 : Long Terme

- [ ] **Microservice** dédié à la génération d'images
- [ ] **Pré-génération** des images populaires
- [ ] **CDN** pour la distribution des images
- [ ] **Scaling horizontal** avec Kubernetes

---

## 🔗 Ressources

- **Sharp Performance**: https://sharp.pixelplumbing.nl/api-utility/
- **BullMQ Documentation**: https://docs.bullmq.io/
- **NestJS Queues**: https://docs.nestjs.com/techniques/queues
- **Cloudinary Upload API**: https://cloudinary.com/documentation/upload_images
- **Prometheus Metrics**: https://prometheus.io/docs/practices/naming/

---

## 📞 Support

Pour toute question ou problème supplémentaire, contacter l'équipe frontend avec :

1. **Logs du navigateur** (Console)
2. **Logs du backend** pour la requête spécifique
3. **Horodatage précis** du problème
4. **Screenshot** du comportement

---

**Document créé** : 2026-01-28
**Version** : 1.0
**Auteur** : Claude Code Assistant
