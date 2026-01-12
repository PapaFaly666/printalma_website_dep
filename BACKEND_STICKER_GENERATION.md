# Backend - Génération Optimale des Stickers

## Problème résolu

Le frontend ne génère plus les aperçus avec CSS (trop lourd pour le navigateur). Le backend génère maintenant l'image finale du sticker avec les bordures.

## Architecture Backend

### 1. Endpoint de création de sticker

```typescript
POST /vendor/stickers
```

**Request Body:**
```json
{
  "designId": 123,
  "stickerType": "autocollant",
  "stickerSurface": "blanc-mat",
  "stickerBorderColor": "glossy-white",
  "stickerSize": "83 mm x 100 mm",
  "name": "Autocollant - Mon Design",
  "description": "Description",
  "price": 2500,
  "stock": 50,
  "status": "DRAFT"
}
```

**Workflow Backend:**
1. Récupérer le design depuis la BDD
2. Télécharger l'image du design depuis Cloudinary
3. Générer l'image du sticker avec bordures (voir section ci-dessous)
4. Uploader l'image générée sur Cloudinary
5. Créer l'entrée en BDD avec l'URL de l'image générée
6. Retourner la réponse

**Response:**
```json
{
  "success": true,
  "message": "Sticker créé avec succès",
  "productId": 456,
  "product": {
    "id": 456,
    "name": "Autocollant - Mon Design",
    "price": 2500,
    "imageUrl": "https://res.cloudinary.com/.../sticker_456.png",
    "stickerType": "autocollant",
    "designId": 123,
    "status": "DRAFT"
  }
}
```

## 2. Génération d'image avec Sharp (Node.js)

### Installation

```bash
npm install sharp
```

### Code de génération

```typescript
// services/stickerGenerator.ts
import sharp from 'sharp';
import axios from 'axios';

interface StickerConfig {
  designImageUrl: string;
  borderColor: string;
  stickerType: 'autocollant' | 'pare-chocs';
  width: number;  // en pixels
  height: number; // en pixels
}

export async function generateStickerImage(config: StickerConfig): Promise<Buffer> {
  const { designImageUrl, borderColor, stickerType, width, height } = config;

  // 1. Télécharger l'image du design
  const designResponse = await axios.get(designImageUrl, {
    responseType: 'arraybuffer'
  });
  const designBuffer = Buffer.from(designResponse.data);

  // 2. Charger l'image avec sharp
  let image = sharp(designBuffer);
  const metadata = await image.metadata();

  // 3. Redimensionner l'image au format désiré
  image = image.resize(width, height, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 0 } // Fond transparent
  });

  // 4. Ajouter la bordure blanche selon le type
  if (stickerType === 'autocollant' && borderColor !== 'transparent') {
    // Pour autocollant : bordure fine (3-5px)
    const borderWidth = 4;

    image = image.extend({
      top: borderWidth,
      bottom: borderWidth,
      left: borderWidth,
      right: borderWidth,
      background: borderColor === 'glossy-white'
        ? { r: 255, g: 255, b: 255, alpha: 1 }
        : { r: 255, g: 255, b: 255, alpha: 1 }
    });

    // Effet glossy : ajouter un gradient ou augmenter la saturation
    if (borderColor === 'glossy-white') {
      image = image.modulate({
        brightness: 1.15,
        saturation: 1.1
      });
    }
  } else if (stickerType === 'pare-chocs') {
    // Pour pare-chocs : bordure large (20-30px)
    const borderWidth = 25;

    image = image.extend({
      top: borderWidth,
      bottom: borderWidth,
      left: borderWidth,
      right: borderWidth,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    });
  }

  // 5. Ajouter une ombre portée
  // Note: Sharp ne supporte pas directement les drop-shadow
  // Alternative : créer une couche d'ombre séparée

  // 6. Retourner le buffer final
  return await image.png().toBuffer();
}

// Fonction helper pour convertir mm en pixels (300 DPI)
export function mmToPixels(mm: number, dpi: number = 300): number {
  return Math.round((mm / 25.4) * dpi);
}

// Exemple d'utilisation
export async function createStickerFromDesign(
  designImageUrl: string,
  stickerType: 'autocollant' | 'pare-chocs',
  borderColor: string,
  size: string // Format: "83 mm x 100 mm"
): Promise<Buffer> {
  // Parser la taille
  const [widthStr, heightStr] = size.split(' x ');
  const widthMm = parseInt(widthStr);
  const heightMm = parseInt(heightStr);

  // Convertir en pixels (300 DPI pour impression haute qualité)
  const widthPx = mmToPixels(widthMm);
  const heightPx = mmToPixels(heightMm);

  console.log(`📐 Génération sticker: ${widthMm}x${heightMm}mm = ${widthPx}x${heightPx}px`);

  return await generateStickerImage({
    designImageUrl,
    borderColor,
    stickerType,
    width: widthPx,
    height: heightPx
  });
}
```

### Upload sur Cloudinary

```typescript
// services/cloudinaryUpload.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadStickerToCloudinary(
  imageBuffer: Buffer,
  productId: number,
  designId: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'vendor-stickers',
        public_id: `sticker_${productId}_design_${designId}`,
        format: 'png',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    );

    uploadStream.end(imageBuffer);
  });
}
```

## 3. Contrôleur complet

```typescript
// controllers/vendor/stickerController.ts
import { Request, Response } from 'express';
import { createStickerFromDesign } from '../../services/stickerGenerator';
import { uploadStickerToCloudinary } from '../../services/cloudinaryUpload';
import { Design, StickerProduct } from '../../models';

export async function createSticker(req: Request, res: Response) {
  try {
    const {
      designId,
      stickerType,
      stickerSurface,
      stickerBorderColor,
      stickerSize,
      name,
      description,
      price,
      stock,
      status
    } = req.body;

    const vendorId = req.user!.id;

    // 1. Vérifier que le design existe et appartient au vendeur
    const design = await Design.findOne({
      where: { id: designId, vendorId }
    });

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design non trouvé'
      });
    }

    // 2. Générer l'image du sticker avec bordures
    console.log(`🎨 Génération du sticker pour le design ${designId}...`);

    const stickerImageBuffer = await createStickerFromDesign(
      design.imageUrl,
      stickerType,
      stickerBorderColor,
      stickerSize
    );

    console.log(`✅ Image générée (${stickerImageBuffer.length} bytes)`);

    // 3. Créer l'entrée en BDD (pour obtenir l'ID)
    const stickerProduct = await StickerProduct.create({
      vendorId,
      designId,
      stickerType,
      stickerSurface,
      stickerBorderColor,
      stickerSize,
      name,
      description,
      price,
      stock: stock || 50,
      status: status || 'DRAFT',
      imageUrl: '' // Sera mis à jour après upload
    });

    // 4. Upload sur Cloudinary
    console.log(`☁️ Upload sur Cloudinary...`);

    const imageUrl = await uploadStickerToCloudinary(
      stickerImageBuffer,
      stickerProduct.id,
      designId
    );

    // 5. Mettre à jour l'URL de l'image
    await stickerProduct.update({ imageUrl });

    console.log(`✅ Sticker créé avec succès: ${imageUrl}`);

    // 6. Retourner la réponse
    return res.status(201).json({
      success: true,
      message: 'Sticker créé avec succès',
      productId: stickerProduct.id,
      product: {
        id: stickerProduct.id,
        name: stickerProduct.name,
        price: stickerProduct.price,
        imageUrl: stickerProduct.imageUrl,
        stickerType: stickerProduct.stickerType,
        designId: stickerProduct.designId,
        status: stickerProduct.status,
        createdAt: stickerProduct.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur création sticker:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du sticker',
      error: error.message
    });
  }
}
```

## 4. Modèle Sequelize

```typescript
// models/StickerProduct.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class StickerProduct extends Model {
  public id!: number;
  public vendorId!: number;
  public designId!: number;

  public stickerType!: 'autocollant' | 'pare-chocs';
  public stickerSurface!: 'blanc-mat' | 'transparent';
  public stickerBorderColor!: string;
  public stickerSize!: string;

  public name!: string;
  public description?: string;
  public price!: number;
  public stock!: number;
  public status!: 'DRAFT' | 'PENDING' | 'PUBLISHED';

  public imageUrl!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StickerProduct.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    designId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'designs',
        key: 'id'
      }
    },
    stickerType: {
      type: DataTypes.ENUM('autocollant', 'pare-chocs'),
      allowNull: false
    },
    stickerSurface: {
      type: DataTypes.ENUM('blanc-mat', 'transparent'),
      allowNull: false,
      defaultValue: 'blanc-mat'
    },
    stickerBorderColor: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'white'
    },
    stickerSize: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PENDING', 'PUBLISHED'),
      allowNull: false,
      defaultValue: 'DRAFT'
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'vendor_sticker_products',
    timestamps: true
  }
);

export default StickerProduct;
```

## 5. Alternative : Canvas sur Node.js (si Sharp ne suffit pas)

Si vous avez besoin d'effets plus complexes (dégradés, ombres portées précises), utilisez `canvas` :

```bash
npm install canvas
```

```typescript
import { createCanvas, loadImage } from 'canvas';

async function generateStickerWithCanvas(designUrl: string, width: number, height: number) {
  const canvas = createCanvas(width + 10, height + 10); // +10 pour bordure
  const ctx = canvas.getContext('2d');

  // Fond blanc
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Charger et dessiner le design
  const image = await loadImage(designUrl);
  ctx.drawImage(image, 5, 5, width, height);

  // Bordure blanche
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Ombre portée
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  return canvas.toBuffer('image/png');
}
```

## 6. Performance et mise en cache

### Queue de traitement (optionnel)

Pour éviter que la génération bloque l'API, utilisez une queue :

```bash
npm install bull redis
```

```typescript
import Queue from 'bull';

const stickerQueue = new Queue('sticker-generation', {
  redis: process.env.REDIS_URL
});

// Ajouter à la queue
stickerQueue.add({
  stickerProductId: 123,
  designId: 456,
  config: { ... }
});

// Worker qui traite la queue
stickerQueue.process(async (job) => {
  const { stickerProductId, designId, config } = job.data;

  // Générer l'image
  const buffer = await createStickerFromDesign(...);

  // Upload
  const url = await uploadStickerToCloudinary(buffer, stickerProductId, designId);

  // Mettre à jour la BDD
  await StickerProduct.update({ imageUrl: url }, { where: { id: stickerProductId } });
});
```

## 7. Résumé des optimisations

✅ **Frontend léger** : Aucun effet CSS lourd, juste une grille simple
✅ **Backend génère les images** : Sharp ou Canvas produisent des PNG de qualité
✅ **Stockage Cloudinary** : Les images sont hébergées et optimisées
✅ **Base de données** : Toutes les infos du sticker sont persistées
✅ **Queue optionnelle** : Pour traiter les générations en arrière-plan

Le navigateur ne lag plus car il n'applique aucun effet CSS complexe !
