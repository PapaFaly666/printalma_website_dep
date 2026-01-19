# Système de Tableaux/Posters pour Vendeurs

## 🎯 Objectif

Permettre aux vendeurs de créer et vendre des **tableaux/posters** avec leurs designs, similaire au système des stickers, avec génération d'image optimale côté backend.

---

## 📋 Vue d'ensemble

Le système de tableaux/posters suit la **même logique que les stickers** :

1. **Vendeur** : Sélectionne un design + choisit format/finition/cadre
2. **Backend** : Génère l'image finale du tableau avec effets/cadre
3. **Frontend** : Affiche les tableaux disponibles dans une section dédiée

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND - VENDEUR                           │
│                   /vendeur/posters                              │
│                                                                 │
│  1. Sélection du design                                        │
│  2. Choix du format (A4, A3, A2, 50x70cm, etc.)               │
│  3. Choix de la finition (Mat, Brillant, Canvas)              │
│  4. Choix du cadre (Sans cadre, Noir, Blanc, Bois)            │
│  5. Définition du prix de vente                                │
│  6. Envoi à l'API                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND - NestJS                             │
│              POST /vendor/posters                               │
│                                                                 │
│  1. Validation des données                                     │
│  2. Génération de l'image du poster avec Sharp                 │
│     - Redimensionnement au format choisi (300 DPI)            │
│     - Application des effets (brillant/mat/canvas)             │
│     - Ajout d'un cadre visuel si sélectionné                   │
│  3. Upload sur Cloudinary                                      │
│  4. Sauvegarde en base de données                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND - PUBLIC/VENDEUR                          │
│            /vendeur/posters (liste)                             │
│            /public/posters (marketplace)                        │
│                                                                 │
│  - Affichage des tableaux avec preview réaliste                │
│  - Filtres par format, finition, prix                          │
│  - Ajout au panier                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Modèle de données

### Table `PosterProduct`

```prisma
model PosterProduct {
  id          Int      @id @default(autoincrement())
  vendorId    Int      @map("vendor_id")
  designId    Int      @map("design_id")

  // Informations produit
  name        String   @db.VarChar(255)
  description String?  @db.Text
  sku         String   @unique @db.VarChar(100)

  // Format du poster
  formatId    String   @map("format_id") @db.VarChar(50)  // 'A4', 'A3', 'A2', '50x70', '70x100', etc.
  width       Float    // Largeur en cm
  height      Float    // Hauteur en cm

  // Finition
  finish      PosterFinish  @default(MAT)

  // Cadre
  frame       PosterFrame   @default(NO_FRAME)

  // Image générée
  imageUrl           String?  @map("image_url") @db.VarChar(500)
  cloudinaryPublicId String?  @map("cloudinary_public_id") @db.VarChar(255)

  // Prix et stock
  finalPrice     Int  // Prix final en centimes
  stockQuantity  Int  @default(0) @map("stock_quantity")

  // Statut
  status      ProductStatus  @default(PENDING)

  // Relations
  vendor      User      @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  design      Design    @relation(fields: [designId], references: [id], onDelete: Cascade)

  // Dates
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("poster_products")
  @@index([vendorId])
  @@index([designId])
  @@index([status])
}

enum PosterFinish {
  MAT       // Papier mat premium
  GLOSSY    // Papier brillant
  CANVAS    // Toile canvas
  FINE_ART  // Fine Art (papier beaux-arts)
}

enum PosterFrame {
  NO_FRAME      // Sans cadre
  BLACK_FRAME   // Cadre noir
  WHITE_FRAME   // Cadre blanc
  WOOD_FRAME    // Cadre bois naturel
  GOLD_FRAME    // Cadre doré
}

enum ProductStatus {
  PENDING       // En attente de validation
  VALIDATED     // Validé par admin
  REJECTED      // Rejeté
  ARCHIVED      // Archivé
}
```

---

## 🎨 Formats disponibles

### Formats standards

| ID | Nom | Dimensions (cm) | Dimensions (px @ 300 DPI) | Prix base |
|----|-----|-----------------|---------------------------|-----------|
| A5 | A5 | 14.8 × 21.0 | 1748 × 2480 | 500 FCFA |
| A4 | A4 | 21.0 × 29.7 | 2480 × 3508 | 800 FCFA |
| A3 | A3 | 29.7 × 42.0 | 3508 × 4961 | 1500 FCFA |
| A2 | A2 | 42.0 × 59.4 | 4961 × 7016 | 3000 FCFA |
| A1 | A1 | 59.4 × 84.1 | 7016 × 9933 | 5000 FCFA |
| 30x40 | 30×40 cm | 30.0 × 40.0 | 3543 × 4724 | 1200 FCFA |
| 40x50 | 40×50 cm | 40.0 × 50.0 | 4724 × 5906 | 2000 FCFA |
| 50x70 | 50×70 cm | 50.0 × 70.0 | 5906 × 8268 | 3500 FCFA |
| 70x100 | 70×100 cm | 70.0 × 100.0 | 8268 × 11811 | 6000 FCFA |

### Calcul DPI → Pixels

```typescript
function cmToPixels(cm: number, dpi: number = 300): number {
  const inches = cm / 2.54;
  return Math.round(inches * dpi);
}

// Exemple : A4 (21 × 29.7 cm) @ 300 DPI
const widthPx = cmToPixels(21);  // 2480 px
const heightPx = cmToPixels(29.7); // 3508 px
```

---

## 🖼️ Finitions et effets

### 1. Mat (MAT)

**Caractéristiques** :
- Papier mat premium
- Pas de reflets
- Couleurs douces

**Effets backend** :
```typescript
// Aucun effet spécial, juste haute qualité
await sharp(designBuffer)
  .resize(widthPx, heightPx, { fit: 'inside' })
  .png({ quality: 100 })
  .toBuffer();
```

### 2. Brillant (GLOSSY)

**Caractéristiques** :
- Papier brillant
- Couleurs vives
- Effet glossy

**Effets backend** :
```typescript
// Augmenter contraste et saturation
await sharp(designBuffer)
  .resize(widthPx, heightPx, { fit: 'inside' })
  .modulate({
    brightness: 1.05,  // +5% luminosité
    saturation: 1.15,  // +15% saturation
  })
  .sharpen()
  .png({ quality: 100 })
  .toBuffer();
```

### 3. Canvas (CANVAS)

**Caractéristiques** :
- Texture toile
- Aspect artistique
- Profondeur

**Effets backend** :
```typescript
// Ajouter texture canvas
const canvasTexture = await this.loadCanvasTexture();

await sharp(designBuffer)
  .resize(widthPx, heightPx, { fit: 'inside' })
  .composite([
    {
      input: canvasTexture,
      blend: 'overlay',  // Superposer texture
      opacity: 0.3       // 30% d'opacité
    }
  ])
  .png({ quality: 100 })
  .toBuffer();
```

### 4. Fine Art (FINE_ART)

**Caractéristiques** :
- Papier beaux-arts
- Grain visible
- Aspect galerie

**Effets backend** :
```typescript
// Grain léger + couleurs naturelles
await sharp(designBuffer)
  .resize(widthPx, heightPx, { fit: 'inside' })
  .modulate({
    brightness: 0.98,  // Légèrement plus sombre
    saturation: 1.05   // Saturation subtile
  })
  .sharpen({ sigma: 0.5 })
  .png({ quality: 100 })
  .toBuffer();
```

---

## 🖼️ Cadres visuels

### 1. Sans cadre (NO_FRAME)

Pas de cadre ajouté, juste le poster.

### 2. Cadre noir (BLACK_FRAME)

**Effet** : Bordure noire de 5% de la largeur totale

```typescript
const frameWidth = Math.round(widthPx * 0.05); // 5% de la largeur

const framedWidth = widthPx + (frameWidth * 2);
const framedHeight = heightPx + (frameWidth * 2);

await sharp({
  create: {
    width: framedWidth,
    height: framedHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 1 } // Noir
  }
})
.composite([{
  input: posterBuffer,
  left: frameWidth,
  top: frameWidth
}])
.png()
.toBuffer();
```

### 3. Cadre blanc (WHITE_FRAME)

Identique au noir, mais avec `background: { r: 255, g: 255, b: 255, alpha: 1 }`.

### 4. Cadre bois (WOOD_FRAME)

**Effet** : Texture bois avec ombrage

```typescript
// Charger texture bois
const woodTexture = await this.loadWoodTexture();

// Créer cadre avec texture
const framedPoster = await sharp({
  create: {
    width: framedWidth,
    height: framedHeight,
    channels: 4,
    background: { r: 139, g: 90, b: 43, alpha: 1 } // Brun
  }
})
.composite([
  {
    input: woodTexture,  // Texture bois
    blend: 'multiply',
    tile: true
  },
  {
    input: posterBuffer,  // Poster au centre
    left: frameWidth,
    top: frameWidth
  }
])
.png()
.toBuffer();
```

### 5. Cadre doré (GOLD_FRAME)

**Effet** : Gradient doré avec ombrage

```typescript
// SVG de cadre doré
const goldFrameSvg = `
  <svg width="${framedWidth}" height="${framedHeight}">
    <defs>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#FFA500;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#DAA520;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${framedWidth}" height="${framedHeight}" fill="url(#gold)" />
  </svg>
`;

const goldFrame = Buffer.from(goldFrameSvg);

await sharp(goldFrame)
  .composite([{
    input: posterBuffer,
    left: frameWidth,
    top: frameWidth
  }])
  .png()
  .toBuffer();
```

---

## 🔧 Implémentation Backend

### Service de génération : `poster-generator.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import axios from 'axios';

interface PosterConfig {
  designImageUrl: string;
  format: {
    id: string;
    width: number;  // en cm
    height: number; // en cm
  };
  finish: 'MAT' | 'GLOSSY' | 'CANVAS' | 'FINE_ART';
  frame: 'NO_FRAME' | 'BLACK_FRAME' | 'WHITE_FRAME' | 'WOOD_FRAME' | 'GOLD_FRAME';
}

@Injectable()
export class PosterGeneratorService {
  private readonly logger = new Logger(PosterGeneratorService.name);
  private readonly DPI = 300;

  /**
   * Convertir cm → pixels @ 300 DPI
   */
  private cmToPixels(cm: number): number {
    const inches = cm / 2.54;
    return Math.round(inches * this.DPI);
  }

  /**
   * Télécharger une image depuis une URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    return Buffer.from(response.data);
  }

  /**
   * Appliquer la finition au poster
   */
  private async applyFinish(
    imageBuffer: Buffer,
    finish: PosterConfig['finish']
  ): Promise<Buffer> {
    let processedImage = sharp(imageBuffer);

    switch (finish) {
      case 'GLOSSY':
        processedImage = processedImage
          .modulate({
            brightness: 1.05,
            saturation: 1.15,
          })
          .sharpen();
        break;

      case 'CANVAS':
        // Ajouter texture canvas (simplifiée)
        processedImage = processedImage
          .modulate({
            brightness: 0.98,
            saturation: 1.08,
          })
          .sharpen({ sigma: 0.5 });
        break;

      case 'FINE_ART':
        processedImage = processedImage
          .modulate({
            brightness: 0.98,
            saturation: 1.05,
          })
          .sharpen({ sigma: 0.5 });
        break;

      case 'MAT':
      default:
        // Pas d'effet spécial
        break;
    }

    return processedImage.png({ quality: 100 }).toBuffer();
  }

  /**
   * Ajouter un cadre au poster
   */
  private async addFrame(
    posterBuffer: Buffer,
    frame: PosterConfig['frame'],
    widthPx: number,
    heightPx: number
  ): Promise<Buffer> {
    if (frame === 'NO_FRAME') {
      return posterBuffer;
    }

    const frameWidth = Math.round(widthPx * 0.05); // 5% de la largeur
    const framedWidth = widthPx + (frameWidth * 2);
    const framedHeight = heightPx + (frameWidth * 2);

    let frameColor: { r: number; g: number; b: number; alpha: number };

    switch (frame) {
      case 'BLACK_FRAME':
        frameColor = { r: 0, g: 0, b: 0, alpha: 1 };
        break;
      case 'WHITE_FRAME':
        frameColor = { r: 255, g: 255, b: 255, alpha: 1 };
        break;
      case 'WOOD_FRAME':
        frameColor = { r: 139, g: 90, b: 43, alpha: 1 };
        break;
      case 'GOLD_FRAME':
        frameColor = { r: 218, g: 165, b: 32, alpha: 1 };
        break;
      default:
        return posterBuffer;
    }

    return await sharp({
      create: {
        width: framedWidth,
        height: framedHeight,
        channels: 4,
        background: frameColor
      }
    })
    .composite([{
      input: posterBuffer,
      left: frameWidth,
      top: frameWidth
    }])
    .png({ quality: 95 })
    .toBuffer();
  }

  /**
   * Générer l'image finale du poster
   */
  async generatePosterImage(config: PosterConfig): Promise<Buffer> {
    this.logger.log(`🎨 Génération poster ${config.format.id} (${config.finish}, ${config.frame})`);

    // 1. Télécharger le design
    const designBuffer = await this.downloadImage(config.designImageUrl);

    // 2. Calculer les dimensions en pixels
    const widthPx = this.cmToPixels(config.format.width);
    const heightPx = this.cmToPixels(config.format.height);

    this.logger.log(`📐 Dimensions: ${config.format.width}×${config.format.height}cm = ${widthPx}×${heightPx}px @ ${this.DPI} DPI`);

    // 3. Redimensionner le design
    let posterBuffer = await sharp(designBuffer)
      .resize(widthPx, heightPx, {
        fit: 'inside',
        withoutEnlargement: false,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 100 })
      .toBuffer();

    // 4. Appliquer la finition
    posterBuffer = await this.applyFinish(posterBuffer, config.finish);

    // 5. Ajouter le cadre
    posterBuffer = await this.addFrame(posterBuffer, config.frame, widthPx, heightPx);

    this.logger.log(`✅ Poster généré: ${posterBuffer.length} bytes`);

    return posterBuffer;
  }
}
```

---

## 🎨 Interface Frontend Vendeur

### Route : `/vendeur/posters`

```tsx
// src/pages/VendorPostersPage.tsx

import React, { useState } from 'react';
import { Frame, Image as ImageIcon, Plus } from 'lucide-react';
import Button from '../components/ui/Button';

const POSTER_FORMATS = [
  { id: 'A4', name: 'A4', width: 21.0, height: 29.7, price: 800 },
  { id: 'A3', name: 'A3', width: 29.7, height: 42.0, price: 1500 },
  { id: 'A2', name: 'A2', width: 42.0, height: 59.4, price: 3000 },
  { id: '50x70', name: '50×70 cm', width: 50.0, height: 70.0, price: 3500 },
  { id: '70x100', name: '70×100 cm', width: 70.0, height: 100.0, price: 6000 },
];

const FINISHES = [
  { id: 'MAT', name: 'Mat', description: 'Papier mat premium, sans reflets' },
  { id: 'GLOSSY', name: 'Brillant', description: 'Papier brillant, couleurs vives' },
  { id: 'CANVAS', name: 'Canvas', description: 'Texture toile, aspect artistique' },
  { id: 'FINE_ART', name: 'Fine Art', description: 'Papier beaux-arts, grain visible' },
];

const FRAMES = [
  { id: 'NO_FRAME', name: 'Sans cadre', price: 0 },
  { id: 'BLACK_FRAME', name: 'Cadre noir', price: 1000 },
  { id: 'WHITE_FRAME', name: 'Cadre blanc', price: 1000 },
  { id: 'WOOD_FRAME', name: 'Cadre bois', price: 1500 },
  { id: 'GOLD_FRAME', name: 'Cadre doré', price: 2000 },
];

export default function VendorPostersPage() {
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('A4');
  const [selectedFinish, setSelectedFinish] = useState('MAT');
  const [selectedFrame, setSelectedFrame] = useState('NO_FRAME');
  const [price, setPrice] = useState(0);

  const handleCreatePoster = async () => {
    const payload = {
      designId: selectedDesign,
      formatId: selectedFormat,
      finish: selectedFinish,
      frame: selectedFrame,
      price: price
    };

    const response = await fetch('/vendor/posters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Poster créé:', result);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Frame className="h-8 w-8" />
            Mes Tableaux/Posters
          </h1>
          <p className="text-gray-600 mt-2">
            Créez et vendez vos designs en format poster
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Créer un poster
        </Button>
      </div>

      {/* Étape 1 : Sélection du design */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          1. Sélectionnez votre design
        </h3>
        {/* Grille des designs */}
      </div>

      {/* Étape 2 : Format */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">2. Choisissez le format</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {POSTER_FORMATS.map((format) => (
            <button
              key={format.id}
              onClick={() => setSelectedFormat(format.id)}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedFormat === format.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">{format.name}</div>
              <div className="text-sm text-gray-600">
                {format.width} × {format.height} cm
              </div>
              <div className="text-sm text-blue-600 font-medium mt-2">
                +{format.price} FCFA
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Étape 3 : Finition */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">3. Choisissez la finition</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {FINISHES.map((finish) => (
            <button
              key={finish.id}
              onClick={() => setSelectedFinish(finish.id)}
              className={`p-4 border-2 rounded-lg transition-all text-left ${
                selectedFinish === finish.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">{finish.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                {finish.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Étape 4 : Cadre */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">4. Ajoutez un cadre (optionnel)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {FRAMES.map((frame) => (
            <button
              key={frame.id}
              onClick={() => setSelectedFrame(frame.id)}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedFrame === frame.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">{frame.name}</div>
              {frame.price > 0 && (
                <div className="text-sm text-blue-600 font-medium mt-2">
                  +{frame.price} FCFA
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Étape 5 : Prix */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">5. Définissez votre prix de vente</h3>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
          placeholder="Prix en FCFA"
        />
      </div>

      {/* Bouton de création */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleCreatePoster}
          disabled={!selectedDesign}
          className="px-8 py-3 text-lg"
        >
          Créer le poster
        </Button>
      </div>
    </div>
  );
}
```

---

## 📊 Ajout au menu vendeur

```tsx
// Dans le composant de navigation vendeur

<button
  onClick={() => navigate('/vendeur/posters')}
  className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 w-full text-gray-700 hover:bg-gray-100 hover:text-black justify-start"
>
  <span className="flex-shrink-0 text-gray-700">
    <Frame className="h-5 w-5" />
  </span>
  <span className="ml-4 truncate text-gray-700">
    Tableaux/Posters
  </span>
</button>
```

---

## 🎯 Avantages du système

### ✅ Performance

- **Backend génère l'image** : Pas de calculs CSS lourds
- **Image optimisée** : Upload unique sur Cloudinary
- **Affichage instantané** : Simple `<img src={poster.imageUrl} />`

### ✅ Qualité

- **300 DPI** : Qualité d'impression professionnelle
- **Effets réalistes** : Finitions et cadres authentiques
- **Preview exact** : Ce que tu vois = ce que tu reçois

### ✅ Flexibilité

- **Multiples formats** : Du A5 au 70×100 cm
- **4 finitions** : Mat, Brillant, Canvas, Fine Art
- **5 types de cadres** : Sans cadre à doré
- **Prix personnalisables** : Chaque vendeur fixe son prix

---

## 📝 Checklist d'implémentation

### Phase 1 : Backend

- [ ] Créer le modèle `PosterProduct` dans Prisma
- [ ] Créer le service `PosterGeneratorService`
- [ ] Créer le service `PosterCloudinaryService`
- [ ] Créer le controller `VendorPosterController`
- [ ] Créer les DTOs (CreatePosterDto, UpdatePosterDto)
- [ ] Ajouter les routes API

### Phase 2 : Frontend Vendeur

- [ ] Créer la page `/vendeur/posters`
- [ ] Créer le composant `PosterCreationForm`
- [ ] Créer le composant `PosterCard` (affichage)
- [ ] Ajouter l'entrée au menu vendeur
- [ ] Implémenter le système de filtres

### Phase 3 : Frontend Public

- [ ] Créer la page `/posters` (marketplace)
- [ ] Créer le composant `PosterGrid`
- [ ] Implémenter la page détails poster
- [ ] Ajouter au système de panier

### Phase 4 : Tests

- [ ] Tester génération pour chaque format
- [ ] Tester chaque finition
- [ ] Tester chaque cadre
- [ ] Tester performances (génération < 5s)

---

**Date** : 16 janvier 2026
**Version** : 1.0
**Auteur** : Conception du système de tableaux/posters pour vendeurs
**Statut** : 📋 Spécification complète, prêt pour implémentation
