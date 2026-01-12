# Guide: Génération des Stickers avec Effets CSS Côté Backend

## Problème Actuel

Le frontend gère les effets de bordures via CSS (drop-shadow, filtres), ce qui est:
- **Lourd** pour le navigateur (plusieurs layers de filtres)
- **Incohérent** selon les navigateurs
- **Difficile** à maintenir

## Solution: Générer Tout Côté Backend avec Sharp

Le backend doit générer **tous les effets visuels** (bordures, ombres, glossy) directement sur l'image avec Sharp.

---

## 1. Analyse des Effets CSS Actuels

### Fichier de Référence
`src/pages/CustomerProductCustomizationPageV3.tsx` (lignes 1615-1675)

### Effets CSS à Reproduire

```typescript
// 1. Bordure blanche épaisse - 16 layers
drop-shadow(1px 0 0 white)
drop-shadow(-1px 0 0 white)
drop-shadow(0 1px 0 white)
drop-shadow(0 -1px 0 white)
drop-shadow(2px 0 0 white)
drop-shadow(-2px 0 0 white)
drop-shadow(0 2px 0 white)
drop-shadow(0 -2px 0 white)
drop-shadow(3px 0 0 white)
drop-shadow(-3px 0 0 white)
drop-shadow(0 3px 0 white)
drop-shadow(0 -3px 0 white)
drop-shadow(2px 2px 0 white)
drop-shadow(-2px -2px 0 white)
drop-shadow(2px -2px 0 white)
drop-shadow(-2px 2px 0 white)

// 2. Contour gris foncé interne - 4 layers
drop-shadow(0.3px 0 0 rgba(50, 50, 50, 0.7))
drop-shadow(-0.3px 0 0 rgba(50, 50, 50, 0.7))
drop-shadow(0 0.3px 0 rgba(50, 50, 50, 0.7))
drop-shadow(0 -0.3px 0 rgba(50, 50, 50, 0.7))

// 3. Ombre portée - 3 layers
drop-shadow(2px 3px 5px rgba(0, 0, 0, 0.3))
drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.25))
drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.2))

// 4. Effet glossy
drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))
drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))
drop-shadow(0 0 10px rgba(255, 255, 255, 0.4))
brightness(1.15)
contrast(1.1)

// 5. Saturation cartoon
saturate(1.1)
```

---

## 2. Implémentation Backend avec Sharp

### Structure du Service Backend

```typescript
// backend/src/sticker/services/sticker-generator.service.ts

import { Injectable } from '@nestjs/common';
import sharp, { Region } from 'sharp';

interface StickerConfig {
  designImageUrl: string;
  stickerType: 'autocollant' | 'pare-chocs';
  borderColor: 'transparent' | 'white' | 'glossy-white' | 'matte-white';
  size: { width: number; height: number }; // en mm
  shape: 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT';
}

@Injectable()
export class StickerGeneratorService {
  private readonly DPI = 300;
  private readonly MM_TO_INCH = 0.0393701;

  /**
   * Convertit mm en pixels à 300 DPI
   */
  mmToPixels(mm: number): number {
    return Math.round(mm * this.DPI * this.MM_TO_INCH);
  }

  /**
   * Télécharge une image depuis une URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Génère l'image du sticker avec TOUS les effets
   */
  async generateStickerImage(config: StickerConfig): Promise<Buffer> {
    // 1. Télécharger le design
    const designBuffer = await this.downloadImage(config.designImageUrl);

    // 2. Calculer les dimensions
    const targetWidth = this.mmToPixels(config.size.width);
    const targetHeight = this.mmToPixels(config.size.height);

    // 3. Traitement Sharp avec tous les effets
    let image = sharp(designBuffer);

    // 4. Redimensionner en conservant le ratio
    image = image.resize(targetWidth, targetHeight, {
      fit: 'inside',
      withoutEnlargement: false
    });

    // 5. Obtenir les dimensions réelles
    const metadata = await image.metadata();
    const actualWidth = metadata.width || targetWidth;
    const actualHeight = metadata.height || targetHeight;

    // 6. Créer l'image avec bordures
    const borderWidth = config.stickerType === 'autocollant' ? 16 : 40;

    // 7. Canvas avec bordure blanche
    const canvasWidth = actualWidth + borderWidth * 2;
    const canvasHeight = actualHeight + borderWidth * 2;

    // 8. Créer un canvas blanc
    const canvas = sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    // 9. Effet glossy (ajustements de couleur)
    image = image.modulate({
      brightness: config.borderColor === 'glossy-white' ? 115 : 102,
      saturation: 110
    });

    if (config.borderColor === 'glossy-white') {
      image = image.linear(1.1, 0); // Contraste +10%
    }

    // 10. Ajouter le contour gris foncé interne (très fin)
    const darkGrayBorder = 2; // 2 pixels
    const canvasWithGrayBorder = sharp({
      create: {
        width: actualWidth + darkGrayBorder * 2,
        height: actualHeight + darkGrayBorder * 2,
        channels: 4,
        background: { r: 50, g: 50, b: 50, alpha: 0.7 }
      }
    });

    const darkBorderedImage = await canvasWithGrayBorder.composite([
      {
        input: await image.toBuffer(),
        top: darkGrayBorder,
        left: darkGrayBorder
      }
    ]);

    // 11. Ajouter la bordure blanche
    const whiteBorderedImage = await canvas.composite([
      {
        input: darkBorderedImage,
        top: borderWidth,
        left: borderWidth
      }
    ]);

    // 12. Ajouter l'ombre portée
    const finalImage = await whiteBorderedImage
      .flatten({ background: '#ffffff' })
      .extend({
        top: 8,
        bottom: 8,
        left: 8,
        right: 8,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .composite([
        {
          input: await this.createDropShadow(canvasWidth, canvasHeight),
          blend: 'over'
        }
      ]);

    // 13. Appliquer la forme si nécessaire
    if (config.shape === 'CIRCLE') {
      return this.applyCircleMask(finalImage);
    }

    return await finalImage.png().toBuffer();
  }

  /**
   * Crée un calque d'ombre portée
   */
  private async createDropShadow(width: number, height: number): Promise<Buffer> {
    const shadowCanvas = sharp({
      create: {
        width: width + 16,
        height: height + 16,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });

    const shadow = await shadowCanvas.composite([
      {
        input: {
          create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0.2 }
          }
        },
        top: 8,
        left: 8,
        blend: 'over'
      }
    ]);

    // Flou gaussian pour l'ombre
    return await shadow
      .blur(5)
      .modulate({ brightness: 100 })
      .toBuffer();
  }

  /**
   * Applique un masque circulaire
   */
  private async applyCircleMask(image: sharp.Sharp): Promise<Buffer> {
    const metadata = await image.metadata();
    const size = Math.min(metadata.width || 0, metadata.height || 0);
    const radius = size / 2;

    const svgMask = `
      <svg width="${size}" height="${size}">
        <defs>
          <mask id="circle-mask">
            <circle cx="${radius}" cy="${radius}" r="${radius - 10}" fill="white" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="black" />
        <circle cx="${radius}" cy="${radius}" r="${radius - 10}" fill="white" />
      </svg>
    `;

    return await image
      .composite([
        {
          input: Buffer.from(svgMask),
          blend: 'dest-in'
        }
      ])
      .png()
      .toBuffer();
  }
}
```

---

## 3. Intégration dans le Service Sticker

```typescript
// backend/src/sticker/sticker.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StickerGeneratorService } from './services/sticker-generator.service';
import { StickerCloudinaryService } from './services/sticker-cloudinary.service';

@Injectable()
export class StickerService {
  constructor(
    private prisma: PrismaService,
    private stickerGenerator: StickerGeneratorService,
    private stickerCloudinary: StickerCloudinaryService,
  ) {}

  async create(createStickerDto: CreateStickerDto, vendorId: number) {
    // 1. Valider et récupérer le design
    const design = await this.prisma.design.findUnique({
      where: { id: createStickerDto.designId }
    });

    if (!design || design.vendorId !== vendorId) {
      throw new BadRequestException('Design non trouvé ou non autorisé');
    }

    // 2. Déterminer le type de sticker
    const stickerType = createStickerDto.stickerType || 'autocollant';
    const borderColor = createStickerDto.borderColor || 'glossy-white';
    const shape = createStickerDto.shape || 'SQUARE';

    // 3. Calculer la taille en mm
    const sizeWidth = createStickerDto.size.width;
    const sizeHeight = createStickerDto.size.height;
    const sizeString = `${sizeWidth}x${sizeHeight}cm`;

    // 4. Créer le sticker en BDD (sans imageUrl pour l'instant)
    const sticker = await this.prisma.stickerProduct.create({
      data: {
        vendorId,
        designId: design.id,
        name: createStickerDto.name,
        description: createStickerDto.description,
        size: sizeString,
        finish: createStickerDto.finish,
        shape,
        price: createStickerDto.price,
        stockQuantity: createStickerDto.stockQuantity,
        status: 'PENDING',
        stickerType,
        borderColor,
        imageUrl: null, // Sera mis à jour après génération
        cloudinaryPublicId: null
      }
    });

    // 5. Générer l'image AVEC TOUS LES EFFETS
    try {
      const stickerImageBuffer = await this.stickerGenerator.generateStickerImage({
        designImageUrl: design.imageUrl,
        stickerType,
        borderColor,
        size: { width: sizeWidth * 10, height: sizeHeight * 10 }, // cm -> mm
        shape
      });

      // 6. Upload sur Cloudinary
      const { url, publicId } = await this.stickerCloudinary.uploadStickerToCloudinary(
        stickerImageBuffer,
        sticker.id,
        design.id
      );

      // 7. Mettre à jour l'URL
      await this.prisma.stickerProduct.update({
        where: { id: sticker.id },
        data: {
          imageUrl: url,
          cloudinaryPublicId: publicId
        }
      });

      // 8. Retourner le sticker complet
      return {
        success: true,
        productId: sticker.id,
        data: {
          ...sticker,
          imageUrl: url,
          size: {
            id: createStickerDto.size.id,
            name: `${sizeWidth}x${sizeHeight}cm`,
            width: sizeWidth,
            height: sizeHeight
          }
        }
      };
    } catch (error) {
      // En cas d'erreur de génération, le sticker est quand même créé
      console.error('Erreur génération sticker:', error);
      return {
        success: true,
        productId: sticker.id,
        warning: 'Sticker créé mais image non générée',
        data: sticker
      };
    }
  }
}
```

---

## 4. Simplification du Frontend

### Supprimer les Effets CSS

Une fois que le backend génère toutes les images avec les effets, le frontend n'a plus besoin de gérer les CSS.

```typescript
// src/components/vendor/StickerCard.tsx - SIMPLIFIÉ

const StickerCard: React.FC<StickerCardProps> = ({ sticker, onDelete, onView }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-lg transition-all overflow-hidden">
      {/* Image directe - PAS de CSS effects */}
      <div className="relative aspect-square bg-gray-100 p-4 flex items-center justify-center">
        <img
          src={sticker.stickerImage || sticker.designPreview}
          alt={sticker.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* ... reste du composant ... */}
    </div>
  );
};
```

### Supprimer le Toggle CSS/Serveur

```typescript
// src/components/vendor/VendorStickersList.tsx - SANS TOGGLE

export const VendorStickersList: React.FC<VendorStickersListProps> = ({ className }) => {
  // PLUS de state useCSSEffects
  // PLUS de toggle buttons

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Mes Autocollants
            <Badge variant="secondary">{totalItems}</Badge>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Stickers générés avec bordures cartoon
          </p>
        </div>
        <Button onClick={() => navigate('/vendeur/stickers')}>
          Créer un autocollant
        </Button>
      </div>

      {/* Grille - PAS de prop useCSSEffects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stickers.map((sticker) => (
          <StickerCard
            key={sticker.id}
            sticker={sticker}
            onDelete={handleDelete}
            onView={handleViewImage}
          />
        ))}
      </div>
    </div>
  );
};
```

### Supprimer StickerPreviewWithBorders

Le composant `StickerPreviewWithBorders.tsx` peut être **supprimé** car il ne sert plus à rien.

---

## 5. Avantages de cette Approche

| Aspect | CSS Frontend | Sharp Backend |
|--------|--------------|---------------|
| **Performance** | Lourd pour le navigateur | Traitement serveur unique |
| **Cohérence** | Variable selon navigateurs | Identique partout |
| **Qualité** | Dépend du rendu CSS | Haute qualité (300 DPI) |
| **Maintenance** | Complexe | Centralisé |
| **CDN** | Non | Oui (Cloudinary) |
| **SEO** | Non | Oui (images indexables) |

---

## 6. Checklist de Migration

### Backend (NestJS)

- [ ] Installer Sharp: `npm install sharp`
- [ ] Créer `sticker-generator.service.ts`
- [ ] Créer `sticker-cloudinary.service.ts` (si pas encore fait)
- [ ] Mettre à jour `sticker.service.ts` pour utiliser le générateur
- [ ] Tester la génération avec différentes options:
  - [ ] autocollant + glossy-white
  - [ ] autocollant + matte-white
  - [ ] autocollant + transparent
  - [ ] pare-chocs
  - [ ] formes (cercle, carré, etc.)

### Frontend (React)

- [ ] Supprimer `StickerPreviewWithBorders.tsx`
- [ ] Simplifier `StickerCard.tsx` (enlever les CSS effects)
- [ ] Simplifier `VendorStickersList.tsx` (enlever le toggle)
- [ ] Mettre à jour `CustomerProductCustomizationPageV3.tsx` (si utilisé pour les stickers)
- [ ] Tester l'affichage des stickers générés

---

## 7. Tests

### Test Backend

```bash
curl -X POST http://localhost:3004/vendor/stickers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 123,
    "name": "Test Sticker Complet",
    "size": {"id": "medium", "width": 10, "height": 10},
    "finish": "glossy",
    "shape": "CIRCLE",
    "price": 2500,
    "stockQuantity": 100,
    "stickerType": "autocollant",
    "borderColor": "glossy-white"
  }'
```

### Vérification

1. L'image retournée dans `imageUrl` doit avoir:
   - ✅ Bordure blanche épaisse visible
   - ✅ Contour gris foncé interne
   - ✅ Ombre portée
   - ✅ Effet glossy (brillance)
   - ✅ Couleurs saturées

2. Comparer avec l'aperçu CSS actuel - doivent être **identiques visuellement**

---

## 8. Notes Importantes

### Résolution
- **300 DPI** pour impression professionnelle
- 10cm = 1181 pixels

### Temps de Génération
- Petit (5x5 cm): ~2-3 secondes
- Moyen (10x10 cm): ~4-6 secondes
- Grand (20x20 cm): ~8-12 secondes

### Si Trop Lent
Implémenter une queue de jobs avec Bull:

```bash
npm install @nestjs/bull bull
```

```typescript
// sticker.module.ts
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sticker-generation'
    })
  ],
  // ...
})
export class StickerModule {}
```

---

## Conclusion

✅ **Le backend génère TOUT** (bordures, ombres, glossy)

✅ **Le frontend affiche seulement** l'image finale

✅ **Performance optimale** - traitement une seule fois au lieu de à chaque render

✅ **Maintenance simplifiée** - logique centralisée dans le service Sharp

---

**Date:** 11 janvier 2026
**Version:** 2.0.0 - Full Backend Generation
