# Documentation Backend - Configuration Prix et Quantité des Stickers

## Contexte

Le frontend `/vendeur/stickers` permet maintenant aux vendeurs de configurer **le prix** et **la quantité en stock** lors de la création d'un sticker. Cette documentation décrit les modifications nécessaires au backend pour supporter ces nouvelles fonctionnalités.

## Endpoint

**POST** `/vendor/stickers`

## Payload Frontend Actuel

```json
{
  "designId": 123,
  "name": "Autocollant - Nom du Design",
  "description": "Autocollant personnalisé avec le design...",
  "size": {
    "width": 10,
    "height": 10
  },
  "price": 2500,
  "shape": "DIE_CUT",
  "stockQuantity": 100,
  "stickerType": "autocollant",
  "borderColor": "glossy-white"
}
```

## Champs à Traiter

### 1. `price` (Prix personnalisé)

- **Type:** `number`
- **Description:** Prix de vente du sticker en FCFA, défini directement par le vendeur
- **Minimum:** 100 FCFA
-**Maximum:** Aucune limite (ou définir une limite raisonnable comme 100000 FCFA)
- **Validation:** Le prix est maintenant fourni par le frontend et ne doit plus être calculé côté backend

**Actuellement (code existant):**
```typescript
// Le backend calcule peut-être le prix
const basePrice = 1500;
const designPrice = design.price || 0;
const totalPrice = basePrice + designPrice;
```

**Nouveau comportement attendu:**
```typescript
// Le backend utilise directement le prix fourni
const price = createStickerDto.price; // Prix défini par le vendeur
```

### 2. `stockQuantity` (Quantité en stock)

- **Type:** `number`
- **Description:** Nombre d'unités initiales en stock
- **Minimum:** 1
- **Maximum:** 10000 (suggéré)
- **Valeur par défaut:** 50 (si non fournie, mais le frontend l'envoie toujours)

**Actuellement (code existant):**
```typescript
// Peut-être codé en dur à 50
stockQuantity: 50
```

**Nouveau comportement attendu:**
```typescript
// Le backend utilise la quantité fournie par le vendeur
stockQuantity: createStickerDto.stockQuantity || 50
```

## Modifications Requises

### Fichier: `src/sticker/dto/create-sticker.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateStickerDto {
  @ApiProperty({ example: 123, description: 'ID du design à utiliser' })
  @IsInt()
  @IsPositive()
  designId: number;

  @ApiProperty({ example: 'Autocollant Logo', description: 'Nom du sticker' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Autocollant personnalisé avec logo',
    description: 'Description du sticker'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: { width: 10, height: 10 },
    description: 'Taille en cm (width et height)'
  })
  @Type(() => Object)
  size: {
    width: number;
    height: number;
  };

  // ✅ MODIFICATION IMPORTANT: Le prix est maintenant requis et défini par le vendeur
  @ApiProperty({
    example: 2500,
    description: 'Prix de vente en FCFA (défini par le vendeur)',
    minimum: 100,
    maximum: 100000
  })
  @IsInt()
  @IsPositive()
  @Min(100)
  @Max(100000)
  price: number;

  @ApiProperty({
    example: 'DIE_CUT',
    description: 'Forme du sticker',
    enum: ['SQUARE', 'CIRCLE', 'RECTANGLE', 'DIE_CUT']
  })
  @IsString()
  shape: string;

  // ✅ MODIFICATION IMPORTANT: La quantité est maintenant configurable par le vendeur
  @ApiProperty({
    example: 100,
    description: 'Quantité initiale en stock (définie par le vendeur)',
    minimum: 1,
    maximum: 10000,
    default: 50
  })
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(10000)
  stockQuantity: number;

  @ApiProperty({
    example: 'autocollant',
    description: 'Type de sticker: autocollant (bordure fine) ou pare-chocs (bordure large)',
    enum: ['autocollant', 'pare-chocs']
  })
  @IsOptional()
  @IsString()
  stickerType?: 'autocollant' | 'pare-chocs';

  @ApiProperty({
    example: 'glossy-white',
    description: 'Couleur de la bordure: white, glossy-white, matte-white, transparent',
    required: false
  })
  @IsOptional()
  @IsString()
  borderColor?: string;
}
```

### Fichier: `src/sticker/sticker.service.ts`

```typescript
async create(vendorId: number, createStickerDto: CreateStickerDto) {
  // 1. Récupérer le design
  const design = await this.prisma.design.findFirst({
    where: {
      id: createStickerDto.designId,
      vendorId: vendorId, // Vérifier que le design appartient au vendeur
      status: 'PUBLISHED', // Ou autre statut valide
    }
  });

  if (!design) {
    throw new NotFoundException('Design non trouvé ou non autorisé');
  }

  // 2. Créer le sticker avec les valeurs fournies par le vendeur
  const sticker = await this.prisma.stickerProduct.create({
    data: {
      vendorId: vendorId,
      designId: createStickerDto.designId,
      name: createStickerDto.name,
      description: createStickerDto.description,
      size: createStickerDto.size, // { width: 10, height: 10 }
      price: createStickerDto.price, // ✅ Prix direct du vendeur
      shape: createStickerDto.shape,
      stockQuantity: createStickerDto.stockQuantity, // ✅ Quantité du vendeur
      finish: 'glossy', // ou autre finition par défaut
      status: 'PENDING',
      // Ne pas inclure imageUrl initialement, sera mis à jour après génération
    }
  });

  // 3. Générer l'image avec bordures
  const stickerImageBuffer = await this.stickerGenerator.createStickerFromDesign(
    design.imageUrl,
    createStickerDto.stickerType || 'autocollant',
    createStickerDto.borderColor || 'glossy-white',
    `${createStickerDto.size.width}x${createStickerDto.size.height}`,
    createStickerDto.shape
  );

  // 4. Upload sur Cloudinary
  const { url, publicId } = await this.stickerCloudinary.uploadStickerToCloudinary(
    stickerImageBuffer,
    sticker.id,
    createStickerDto.designId
  );

  // 5. Mettre à jour l'URL dans la BDD
  const updatedSticker = await this.prisma.stickerProduct.update({
    where: { id: sticker.id },
    data: {
      imageUrl: url,
      cloudinaryPublicId: publicId
    }
  });

  return {
    success: true,
    message: 'Sticker créé avec succès',
    productId: updatedSticker.id,
    data: updatedSticker
  };
}
```

## Validation Additionnelle (Optionnelle)

### Validation du prix minimum

Vous pouvez ajouter une validation pour éviter que les vendeurs ne fixent un prix trop bas:

```typescript
// Dans sticker.service.ts
const MINIMUM_PRICE = 500; // Prix minimum en FCFA
const BASE_COST = 1000; // Coût de base de production

if (createStickerDto.price < MINIMUM_PRICE) {
  throw new BadRequestException(
    `Le prix doit être d'au moins ${MINIMUM_PRICE} FCFA`
  );
}

// Optionnel: Avertir si le prix est trop proche du coût de production
if (createStickerDto.price < BASE_COST) {
  console.warn(`⚠️ Vendor ${vendorId} set price ${createStickerDto.price} below cost ${BASE_COST}`);
}
```

### Validation de la quantité

```typescript
// Dans sticker.service.ts
const MAX_QUANTITY = 10000;

if (createStickerDto.stockQuantity > MAX_QUANTITY) {
  throw new BadRequestException(
    `La quantité ne peut pas dépasser ${MAX_QUANTITY} unités`
  );
}
```

## Tests

### Test avec prix personnalisé et quantité personnalisée

```bash
curl -X POST http://localhost:3004/vendor/stickers \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "designId": 123,
    "name": "Mon Sticker Premium",
    "description": "Sticker haute qualité",
    "size": {"width": 10, "height": 10},
    "price": 5000,
    "shape": "DIE_CUT",
    "stockQuantity": 200,
    "stickerType": "autocollant",
    "borderColor": "glossy-white"
  }'
```

**Réponse attendue:**

```json
{
  "success": true,
  "message": "Sticker créé avec succès",
  "productId": 456,
  "data": {
    "id": 456,
    "vendorId": 1,
    "designId": 123,
    "name": "Mon Sticker Premium",
    "price": 5000,
    "stockQuantity": 200,
    "size": { "width": 10, "height": 10 },
    "shape": "DIE_CUT",
    "imageUrl": "https://res.cloudinary.com/.../sticker_456_design_123_1234567890.png",
    "status": "PENDING"
  }
}
```

## Résumé des Changements

| Champ | Avant | Après |
|-------|-------|-------|
| `price` | Calculé par backend (1500 + prix design) | Fourni par frontend (vendeur le fixe) |
| `stockQuantity` | Codé en dur à 50 | Fourni par frontend (vendeur le fixe) |
| Validation | Pas de validation spécifique | Min: 100 FCFA, Max: 100000 FCFA |
| Stock | Fixe à 50 | Variable: 1 à 10000 |

## Compatibilité

Ces changements sont **rétrocompatibles** si vous ajoutez des valeurs par défaut dans le DTO:

```typescript
@IsOptional()
price?: number;

@IsOptional()
stockQuantity?: number;

// Dans le service:
const finalPrice = createStickerDto.price || 1500;
const finalStock = createStickerDto.stockQuantity || 50;
```

Cependant, le frontend envoie toujours ces valeurs, donc ce n'est pas nécessaire pour la nouvelle version.
