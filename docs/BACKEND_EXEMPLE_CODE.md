# Exemple de Code Backend - Génération avec Bounding Box

## 🎯 Code Prêt à l'Emploi

Copiez-collez ce code dans votre service backend et adaptez-le à vos besoins.

---

## 📦 Service Complet (NestJS + Sharp)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import axios from 'axios';

interface DesignPosition {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  positionUnit?: 'PIXEL' | 'PERCENTAGE';
  designWidth?: number;
  designHeight?: number;
  containerWidth: number;   // ← Valeur du frontend
  containerHeight: number;  // ← Valeur du frontend
}

interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PIXEL' | 'PERCENTAGE';
}

@Injectable()
export class ProductImageGeneratorService {
  private readonly logger = new Logger(ProductImageGeneratorService.name);

  /**
   * Génère l'image finale d'un produit avec le design positionné
   *
   * @param productImageUrl - URL de l'image du mockup produit
   * @param designImageUrl - URL de l'image du design
   * @param delimitation - Zone imprimable sur le produit
   * @param designPosition - Position et dimensions du design (du frontend)
   * @returns Buffer de l'image finale
   */
  async generateFinalImage(
    productImageUrl: string,
    designImageUrl: string,
    delimitation: Delimitation,
    designPosition: DesignPosition
  ): Promise<Buffer> {

    this.logger.log('🎨 === DÉBUT GÉNÉRATION IMAGE FINALE ===');

    try {
      // ÉTAPE 1: Télécharger les images
      this.logger.log('📥 Téléchargement des images...');
      const [productBuffer, designBuffer] = await Promise.all([
        this.downloadImage(productImageUrl),
        this.downloadImage(designImageUrl)
      ]);

      // ÉTAPE 2: Récupérer les métadonnées
      const productMeta = await sharp(productBuffer).metadata();
      const designMeta = await sharp(designBuffer).metadata();

      const imageWidth = productMeta.width!;
      const imageHeight = productMeta.height!;

      this.logger.log(`📐 Dimensions mockup: ${imageWidth}×${imageHeight}px`);
      this.logger.log(`🎨 Dimensions design: ${designMeta.width}×${designMeta.height}px`);

      // ÉTAPE 3: Extraire les valeurs du frontend
      const {
        x,
        y,
        scale,
        rotation = 0,
        containerWidth,   // ← 🎯 BOUNDING BOX du frontend
        containerHeight,  // ← 🎯 BOUNDING BOX du frontend
        positionUnit = 'PIXEL'
      } = designPosition;

      this.logger.log('📦 Bounding Box reçu du frontend:', {
        containerWidth,
        containerHeight,
        scale
      });

      // ÉTAPE 4: Convertir la délimitation en pixels
      const delimInPixels = this.convertDelimitationToPixels(
        delimitation,
        imageWidth,
        imageHeight
      );

      this.logger.log('📍 Délimitation en pixels:', delimInPixels);

      // ÉTAPE 5: Convertir les offsets si nécessaire
      let offsetX = x;
      let offsetY = y;

      if (positionUnit === 'PERCENTAGE') {
        offsetX = (x / 100) * delimInPixels.width;
        offsetY = (y / 100) * delimInPixels.height;
        this.logger.log(`🔄 Offsets convertis: x=${offsetX}px, y=${offsetY}px`);
      }

      // ÉTAPE 6: Calculer les positions
      const delimCenterX = delimInPixels.x + delimInPixels.width / 2;
      const delimCenterY = delimInPixels.y + delimInPixels.height / 2;

      const containerCenterX = delimCenterX + offsetX;
      const containerCenterY = delimCenterY + offsetY;

      this.logger.log('📍 Position conteneur:', {
        centerX: containerCenterX,
        centerY: containerCenterY
      });

      // ÉTAPE 7: 🎯 Redimensionner le design dans le bounding box
      this.logger.log(`📦 Redimensionnement du design dans ${containerWidth}×${containerHeight}px...`);

      let processedDesign = await sharp(designBuffer)
        .resize({
          width: Math.round(containerWidth),   // ← 🎯 Utiliser le bounding box
          height: Math.round(containerHeight), // ← 🎯 du frontend
          fit: 'inside',
          position: 'center'
        })
        .toBuffer();

      // ÉTAPE 8: Récupérer les dimensions réelles après resize
      const resizedMeta = await sharp(processedDesign).metadata();
      let finalWidth = resizedMeta.width!;
      let finalHeight = resizedMeta.height!;

      this.logger.log(`🖼️ Dimensions après resize: ${finalWidth}×${finalHeight}px`);

      // ÉTAPE 9: Appliquer la rotation si nécessaire
      if (rotation !== 0) {
        this.logger.log(`🔄 Application de la rotation: ${rotation}°`);

        processedDesign = await sharp(processedDesign)
          .rotate(rotation, {
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toBuffer();

        const rotatedMeta = await sharp(processedDesign).metadata();
        finalWidth = rotatedMeta.width!;
        finalHeight = rotatedMeta.height!;

        this.logger.log(`🖼️ Dimensions après rotation: ${finalWidth}×${finalHeight}px`);
      }

      // ÉTAPE 10: Calculer la position de collage
      const pasteLeft = Math.round(containerCenterX - finalWidth / 2);
      const pasteTop = Math.round(containerCenterY - finalHeight / 2);

      this.logger.log(`📍 Position collage design: (${pasteLeft}, ${pasteTop})`);

      // ÉTAPE 11: Composer l'image finale
      this.logger.log('🎨 Composition de l\'image finale...');

      const finalImage = await sharp(productBuffer)
        .composite([
          {
            input: processedDesign,
            left: pasteLeft,
            top: pasteTop,
            blend: 'over'
          }
        ])
        .toBuffer();

      const finalMeta = await sharp(finalImage).metadata();

      this.logger.log(`✅ Image finale générée: ${finalMeta.width}×${finalMeta.height}px (${finalImage.length} bytes)`);
      this.logger.log('🎨 === FIN GÉNÉRATION IMAGE FINALE ===');

      return finalImage;

    } catch (error) {
      this.logger.error('❌ Erreur lors de la génération de l\'image:', error);
      throw error;
    }
  }

  /**
   * Convertit la délimitation en pixels absolus
   */
  private convertDelimitationToPixels(
    delim: Delimitation,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number; width: number; height: number } {

    const isPixel = delim.coordinateType === 'PIXEL';

    return {
      x: isPixel ? delim.x : (delim.x / 100) * imageWidth,
      y: isPixel ? delim.y : (delim.y / 100) * imageHeight,
      width: isPixel ? delim.width : (delim.width / 100) * imageWidth,
      height: isPixel ? delim.height : (delim.height / 100) * imageHeight
    };
  }

  /**
   * Télécharge une image depuis une URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`❌ Erreur téléchargement image: ${url}`, error);
      throw new Error(`Impossible de télécharger l'image: ${url}`);
    }
  }
}
```

---

## 🔧 Utilisation dans le Controller

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ProductImageGeneratorService } from './product-image-generator.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('vendor/products')
export class VendorProductController {

  constructor(
    private readonly imageGenerator: ProductImageGeneratorService,
    private readonly cloudinary: CloudinaryService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  async createVendorProduct(@Body() dto: CreateVendorProductDto) {

    // 1. Récupérer les données nécessaires depuis la BDD
    const baseProduct = await this.prisma.product.findUnique({
      where: { id: dto.baseProductId },
      include: {
        colorVariations: {
          include: {
            images: {
              include: {
                delimitations: true
              }
            }
          }
        }
      }
    });

    const design = await this.prisma.design.findUnique({
      where: { id: dto.designId }
    });

    // 2. Récupérer l'image et la délimitation
    const productImage = baseProduct.colorVariations[0].images[0];
    const delimitation = productImage.delimitations[0];

    // 3. 🎯 Générer l'image finale avec le bounding box du frontend
    const finalImageBuffer = await this.imageGenerator.generateFinalImage(
      productImage.url,
      design.imageUrl,
      delimitation,
      dto.designPosition  // ← Contient containerWidth et containerHeight
    );

    // 4. Upload sur Cloudinary
    const uploadResult = await this.cloudinary.uploadImage(
      finalImageBuffer,
      {
        folder: 'vendor-products',
        public_id: `product_${dto.baseProductId}_design_${dto.designId}_${Date.now()}`
      }
    );

    // 5. Sauvegarder en BDD
    const vendorProduct = await this.prisma.vendorProduct.create({
      data: {
        vendorId: req.user.id,
        designId: dto.designId,
        baseProductId: dto.baseProductId,
        name: dto.vendorName,
        price: dto.vendorPrice,
        stock: dto.vendorStock,
        finalImageUrl: uploadResult.secure_url,  // ← Image générée
        status: 'PENDING',
        // ... autres champs
      }
    });

    return {
      success: true,
      productId: vendorProduct.id,
      finalImageUrl: vendorProduct.finalImageUrl,
      message: 'Produit créé avec succès'
    };
  }
}
```

---

## 🧪 Test Unitaire

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductImageGeneratorService } from './product-image-generator.service';
import sharp from 'sharp';
import * as fs from 'fs';

describe('ProductImageGeneratorService', () => {
  let service: ProductImageGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductImageGeneratorService],
    }).compile();

    service = module.get<ProductImageGeneratorService>(ProductImageGeneratorService);
  });

  it('devrait générer une image avec le bounding box', async () => {
    // Données de test
    const productImageUrl = 'https://res.cloudinary.com/.../mockup.png';
    const designImageUrl = 'https://res.cloudinary.com/.../design.png';

    const delimitation = {
      x: 30,
      y: 20,
      width: 40,
      height: 50,
      coordinateType: 'PERCENTAGE' as const
    };

    const designPosition = {
      x: 0,
      y: 0,
      scale: 0.8,
      rotation: 0,
      positionUnit: 'PIXEL' as const,
      designWidth: 800,
      designHeight: 600,
      containerWidth: 384,   // ← Bounding box du frontend
      containerHeight: 480   // ← Bounding box du frontend
    };

    // Générer l'image
    const result = await service.generateFinalImage(
      productImageUrl,
      designImageUrl,
      delimitation,
      designPosition
    );

    // Vérifications
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Sauvegarder pour inspection visuelle
    fs.writeFileSync('./test-output.png', result);

    // Vérifier les métadonnées
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(1200);
  });
});
```

---

## 📊 Exemple de Logs Attendus

Quand tout fonctionne correctement, vous devriez voir :

```
🎨 === DÉBUT GÉNÉRATION IMAGE FINALE ===
📥 Téléchargement des images...
📐 Dimensions mockup: 1200×1200px
🎨 Dimensions design: 800×600px
📦 Bounding Box reçu du frontend: { containerWidth: 384, containerHeight: 480, scale: 0.8 }
📍 Délimitation en pixels: { x: 360, y: 240, width: 480, height: 600 }
📍 Position conteneur: { centerX: 600, centerY: 540 }
📦 Redimensionnement du design dans 384×480px...
🖼️ Dimensions après resize: 384×288px
📍 Position collage design: (408, 396)
🎨 Composition de l'image finale...
✅ Image finale générée: 1200×1200px (245871 bytes)
🎨 === FIN GÉNÉRATION IMAGE FINALE ===
```

**Points clés dans les logs** :
- ✅ Bounding Box reçu : 384×480px
- ✅ Design redimensionné : 384×288px (aspect ratio préservé)
- ✅ Image finale : 1200×1200px

---

## ⚠️ Problèmes Courants et Solutions

### Problème 1: "containerWidth is undefined"

**Cause** : Le frontend n'envoie pas le bounding box.

**Solution** : Vérifier que le frontend inclut bien `containerWidth` et `containerHeight` dans `designPosition`.

### Problème 2: Image générée différente de la preview

**Cause** : Vous recalculez le bounding box au lieu d'utiliser celui du frontend.

**Solution** :
```typescript
// ❌ NE PAS FAIRE
const containerWidth = delimInPixels.width * scale;

// ✅ FAIRE
const { containerWidth, containerHeight } = designPosition;
```

### Problème 3: Design coupé

**Cause** : Utilisation de `fit: 'cover'` au lieu de `fit: 'inside'`.

**Solution** :
```typescript
await sharp(design).resize({
  width: containerWidth,
  height: containerHeight,
  fit: 'inside'  // ← IMPORTANT
});
```

### Problème 4: Position incorrecte

**Cause** : Oubli de convertir les offsets si `positionUnit === 'PERCENTAGE'`.

**Solution** : Utiliser le code fourni ci-dessus qui gère automatiquement la conversion.

---

## ✅ Checklist de Vérification

Avant de déployer :

- [ ] Vous récupérez `containerWidth` et `containerHeight` du `designPosition`
- [ ] Vous utilisez `Math.round()` sur les dimensions
- [ ] Vous utilisez `fit: 'inside'` pour le resize
- [ ] Vous gérez `positionUnit` (PIXEL/PERCENTAGE)
- [ ] Vous gérez la rotation après le resize
- [ ] Les logs affichent le bounding box reçu
- [ ] L'image générée = preview frontend (test visuel)

---

## 🎯 Résumé

**3 règles d'or** :

1. **Utilisez le bounding box du frontend** (containerWidth, containerHeight)
2. **Ne recalculez PAS** les dimensions
3. **Utilisez fit: 'inside'** pour préserver l'aspect ratio

**Code minimal** :
```typescript
const { containerWidth, containerHeight } = designPosition;

const resized = await sharp(design).resize({
  width: Math.round(containerWidth),
  height: Math.round(containerHeight),
  fit: 'inside'
}).toBuffer();
```

---

**Auteur:** Claude Sonnet 4.5
**Date:** 18 janvier 2026
**Version:** 1.0
