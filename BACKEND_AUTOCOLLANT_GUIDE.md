# Guide Backend - Gestion des Produits Autocollant

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Format des données attendues](#format-des-données-attendues)
3. [Création d'un produit Autocollant](#création-dun-produit-autocollant)
4. [Gestion des fichiers images](#gestion-des-fichiers-images)
5. [Validation des données](#validation-des-données)
6. [Réponses API attendues](#réponses-api-attendues)
7. [Exemples de requêtes](#exemples-de-requêtes)
8. [Gestion des erreurs](#gestion-des-erreurs)

---

## Vue d'ensemble

Les produits de type **AUTOCOLLANT** ont des caractéristiques spécifiques qui les différencient des autres produits :

### Caractéristiques principales

```typescript
interface AutocollantProduct {
  genre: 'AUTOCOLLANT';          // ✅ Genre fixe
  requiresStock: false;          // ✅ Pas de gestion de stock
  stock: undefined;              // ✅ Pas de champ stock
  variations: ProductVariation[]; // ✅ Prix par variation
  sizes: string[];               // ✅ Tailles d'autocollant (ex: "5cm*5cm", "10cm*10cm")
}
```

### Différences avec les produits standards

| Caractéristique | Produit Standard | Autocollant |
|----------------|------------------|-------------|
| `genre` | HOMME/FEMME/BEBE/UNISEXE | AUTOCOLLANT |
| `requiresStock` | true | false |
| `stock` | number (≥0) | undefined |
| Prix variations | Prix global du produit | Prix spécifique par variation |
| Tailles | S, M, L, XL... | 5cm*5cm, 10cm*10cm... |

---

## Format des données attendues

### Endpoint

```
POST /products
Content-Type: multipart/form-data
```

### Structure du FormData

Le frontend envoie les données sous forme de `multipart/form-data` avec deux parties :

#### 1. Partie `productData` (JSON)

```json
{
  "name": "Sticker Personnalisé",
  "description": "Autocollant haute qualité",
  "price": 500,
  "suggestedPrice": 1200,
  "stock": null,
  "status": "PUBLISHED",
  "categoryId": 2,
  "subCategoryId": 3,
  "categories": ["Accessoires", "Sticker"],
  "genre": "AUTOCOLLANT",
  "requiresStock": false,
  "isReadyProduct": false,
  "sizes": ["5cm*5cm", "10cm*10cm"],
  "variations": [
    {
      "value": "Blanc",
      "colorCode": "#FFFFFF",
      "price": 500,
      "stock": 0,
      "images": [
        {
          "fileId": "img_1234567890_0",
          "view": "Front",
          "delimitations": [
            {
              "x": 100,
              "y": 100,
              "width": 800,
              "height": 800,
              "rotation": 0,
              "name": "Zone de personnalisation"
            }
          ]
        }
      ]
    }
  ],
  "colorVariations": [
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "price": 500,
      "stock": 0,
      "images": [
        {
          "fileId": "img_1234567890_0",
          "view": "Front",
          "delimitations": [
            {
              "x": 100,
              "y": 100,
              "width": 800,
              "height": 800,
              "rotation": 0,
              "name": "Zone de personnalisation"
            }
          ],
          "_fileName": "sticker_blanc.jpg",
          "_fileIndex": 0
        }
      ]
    }
  ]
}
```

#### 2. Parties `file_{fileId}` (Fichiers binaires)

Pour chaque image, un fichier est envoyé avec le nom correspondant au `fileId` :

```
file_img_1234567890_0: <binary data>
file_img_1234567890_1: <binary data>
file_img_1234567890_2: <binary data>
...
```

---

## Création d'un produit Autocollant

### Étape 1 : Validation des données

```typescript
// DTO de création (NestJS)
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  suggestedPrice?: number;

  @IsOptional()
  stock?: number;

  @IsString()
  @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status: string;

  @IsNumber()
  categoryId: number;

  @IsOptional()
  subCategoryId?: number;

  @IsString()
  categories: string; // JSON stringifié

  @IsString()
  @IsIn(['HOMME', 'FEMME', 'BEBE', 'UNISEXE', 'AUTOCOLLANT'])
  genre: string;

  @IsBoolean()
  @IsOptional()
  requiresStock?: boolean;

  @IsBoolean()
  @IsOptional()
  isReadyProduct?: boolean;

  @IsString()
  sizes: string; // JSON stringifié

  @IsString()
  variations: string; // JSON stringifié

  @IsString()
  colorVariations: string; // JSON stringifié
}
```

### Étape 2 : Traitement spécifique AUTOCOLLANT

```typescript
async createProduct(createProductDto: CreateProductDto, files: Express.Multer.File[]) {
  // Parser les champs JSON
  const categories = JSON.parse(createProductDto.categories);
  const sizes = JSON.parse(createProductDto.sizes);
  const variations = JSON.parse(createProductDto.variations);
  const colorVariations = JSON.parse(createProductDto.colorVariations);

  // 🔧 DÉTECTION AUTOCOLLANT
  const isAutocollant = createProductDto.genre === 'AUTOCOLLANT';

  console.log('🎨 [BACKEND] Type de produit:', isAutocollant ? 'AUTOCOLLANT' : 'Standard');
  console.log('📊 [BACKEND] requiresStock:', createProductDto.requiresStock);
  console.log('💰 [BACKEND] Prix de base:', createProductDto.price);
  console.log('🎯 [BACKEND] Variations:', variations.length);

  // 🔧 VALIDATIONS SPÉCIFIQUES AUTOCOLLANT
  if (isAutocollant) {
    // ✅ Vérifier que requiresStock est false
    if (createProductDto.requiresStock !== false) {
      console.warn('⚠️ [BACKEND] AUTOCOLLANT avec requiresStock=true, correction automatique');
      createProductDto.requiresStock = false;
    }

    // ✅ Ignorer le champ stock (doit être null/undefined)
    if (createProductDto.stock !== null && createProductDto.stock !== undefined) {
      console.warn('⚠️ [BACKEND] AUTOCOLLANT avec stock défini, suppression automatique');
      createProductDto.stock = null;
    }

    // ✅ Vérifier que les variations ont un prix
    for (const variation of variations) {
      if (!variation.price || variation.price <= 0) {
        throw new BadRequestException(
          `Les variations AUTOCOLLANT doivent avoir un prix. Variation "${variation.value}" sans prix.`
        );
      }
    }

    // ✅ Vérifier les tailles d'autocollant
    const validSizes = [/^\d+cm\s*[\*x]\s*\d+cm$/i];
    for (const size of sizes) {
      const isValid = validSizes.some(regex => regex.test(size));
      if (!isValid) {
        throw new BadRequestException(
          `Taille d'autocollant invalide: "${size}". Format attendu: "5cm*5cm" ou "10cm*10cm"`
        );
      }
    }
  }

  // ... suite du traitement
}
```

### Étape 3 : Upload des images sur Cloudinary

```typescript
async uploadImagesToCloudinary(files: Express.Multer.File[], colorVariations: any[]) {
  const uploadedImages: Map<string, { url: string; publicId: string }> = new Map();

  // 🔧 Parcourir les colorVariations pour trouver les fichiers correspondants
  let fileIndex = 0;

  for (const colorVariation of colorVariations) {
    for (const image of colorVariation.images) {
      const fileId = image.fileId;

      // 🔧 Retrouver le fichier correspondant
      const file = files.find(f => {
        // Le nom du champ dans FormData est `file_{fileId}`
        return f.fieldname === `file_${fileId}`;
      });

      if (!file) {
        console.error(`❌ [BACKEND] Fichier non trouvé pour fileId: ${fileId}`);
        throw new BadRequestException(`Fichier manquant pour l'image: ${fileId}`);
      }

      console.log(`📤 [BACKEND] Upload image: ${file.originalname} (${file.size} bytes)`);

      // Upload sur Cloudinary
      const result = await this.cloudinaryService.uploadImage(file);

      uploadedImages.set(fileId, {
        url: result.secure_url,
        publicId: result.public_id
      });

      console.log(`✅ [BACKEND] Image uploadée: ${result.secure_url}`);

      fileIndex++;
    }
  }

  return uploadedImages;
}
```

### Étape 4 : Création en base de données

```typescript
async createProductInDatabase(createProductDto: CreateProductDto, uploadedImages: Map<string, any>) {
  // 🔧 Créer le produit
  const product = await this.prisma.product.create({
    data: {
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      suggestedPrice: createProductDto.suggestedPrice,
      stock: createProductDto.stock ?? 0, // 0 pour AUTOCOLLANT
      status: createProductDto.status,
      genre: createProductDto.genre,
      isReadyProduct: createProductDto.isReadyProduct ?? false,
      categoryId: createProductDto.categoryId,
      subCategoryId: createProductDto.subCategoryId,
    }
  });

  console.log(`✅ [BACKEND] Produit créé: ID=${product.id}`);

  // 🔧 Créer les tailles
  const sizes = JSON.parse(createProductDto.sizes);
  for (const sizeName of sizes) {
    await this.prisma.size.create({
      data: {
        productId: product.id,
        sizeName: sizeName
      }
    });
  }

  // 🔧 Créer les colorVariations avec images
  const colorVariations = JSON.parse(createProductDto.colorVariations);

  for (const colorVar of colorVariations) {
    // Créer la colorVariation
    const createdColorVar = await this.prisma.colorVariation.create({
      data: {
        productId: product.id,
        name: colorVar.name,
        colorCode: colorVar.colorCode,
        price: colorVar.price || 0, // ✅ Prix spécifique pour AUTOCOLLANT
        stock: colorVar.stock || {}
      }
    });

    console.log(`✅ [BACKEND] ColorVariation créée: ${colorVar.name} (${createdColorVar.id})`);

    // Créer les images
    for (const image of colorVar.images) {
      const uploadedImage = uploadedImages.get(image.fileId);

      if (!uploadedImage) {
        console.error(`❌ [BACKEND] Image uploadée non trouvée: ${image.fileId}`);
        continue;
      }

      // Créer l'image en BDD
      const createdImage = await this.prisma.productImage.create({
        data: {
          colorVariationId: createdColorVar.id,
          view: image.view,
          url: uploadedImage.url,
          publicId: uploadedImage.publicId,
          naturalWidth: 1200, // TODO: Récupérer les vraies dimensions
          naturalHeight: 1200
        }
      });

      console.log(`✅ [BACKEND] Image créée: ${uploadedImage.url}`);

      // Créer les délimitations
      if (image.delimitations && image.delimitations.length > 0) {
        for (const delim of image.delimitations) {
          await this.prisma.delimitation.create({
            data: {
              productImageId: createdImage.id,
              x: delim.x,
              y: delim.y,
              width: delim.width,
              height: delim.height,
              rotation: delim.rotation || 0,
              name: delim.name || null,
              coordinateType: 'PERCENTAGE',
              referenceWidth: 1200,
              referenceHeight: 1200
            }
          });
        }

        console.log(`✅ [BACKEND] ${image.delimitations.length} délimitation(s) créée(s)`);
      }

      // Marquer le produit comme ayant des délimitations
      await this.prisma.product.update({
        where: { id: product.id },
        data: { hasDelimitations: true }
      });
    }
  }

  // 🔧 Lier les catégories
  const categories = JSON.parse(createProductDto.categories);
  for (const categoryName of categories) {
    // TODO: Implémenter la liaison catégorie-produit
  }

  return product;
}
```

---

## Gestion des fichiers images

### Mapping des fileId vers les fichiers

Le frontend envoie les fichiers avec des noms de champs spécifiques :

```typescript
// Format attendu des noms de champs
file_${fileId}

// Exemples :
file_img_1234567890_0
file_img_1234567890_1
file_img_1234567890_2
```

### Configuration Multer

```typescript
// Multer configuration pour gérer plusieurs fichiers
export const multerConfig = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max par fichier
    files: 20 // Max 20 fichiers
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Seuls les fichiers image sont autorisés'), false);
    }
  }
};

// Endpoint avec FilesInterceptor
@Post()
@UseInterceptor(FilesInterceptor('files', 20, multerConfig))
async createProduct(
  @Body() createProductDto: CreateProductDto,
  @UploadedFiles() files: Express.Multer.File[]
) {
  // files est un tableau de tous les fichiers uploadés
  // Chaque fichier a un fieldname correspondant à `file_${fileId}`
  console.log(`📦 [BACKEND] ${files.length} fichier(s) reçu(s)`);

  // Afficher les fieldnames pour debug
  files.forEach(file => {
    console.log(`   - ${file.fieldname}: ${file.originalname} (${file.size} bytes)`);
  });

  return this.productService.createProduct(createProductDto, files);
}
```

---

## Validation des données

### Validation du prix des variations

```typescript
// Pour les AUTOCOLLANT, chaque variation doit avoir un prix
if (isAutocollant) {
  for (const variation of variations) {
    if (!variation.price || variation.price <= 0) {
      throw new BadRequestException(
        `Prix invalide pour la variation "${variation.value}". Les autocollants doivent avoir un prix par variation.`
      );
    }
  }
}
```

### Validation des délimitations

```typescript
// Les délimitations sont OBLIGATOIRES pour les produits mockup admin
let hasDelimitations = false;

for (const colorVar of colorVariations) {
  for (const image of colorVar.images) {
    if (image.delimitations && image.delimitations.length > 0) {
      hasDelimitations = true;
      break;
    }
  }
}

if (!hasDelimitations) {
  throw new BadRequestException(
    'Au moins une zone de personnalisation (délimitation) est requise pour ce produit.'
  );
}
```

### Validation des tailles

```typescript
// Pour les AUTOCOLLANT, valider le format des tailles
const validateAutocollantSize = (size: string): boolean => {
  // Format attendu: "5cm*5cm", "10cm*10cm", "5cm x 10cm"
  const regex = /^\d+(cm|mm)\s*[\*x]\s*\d+(cm|mm)$/i;
  return regex.test(size.trim());
};

if (isAutocollant) {
  for (const size of sizes) {
    if (!validateAutocollantSize(size)) {
      throw new BadRequestException(
        `Taille d'autocollant invalide: "${size}". Format attendu: "5cm*5cm" ou "10cm*10cm"`
      );
    }
  }
}
```

---

## Réponses API attendues

### Succès

```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "data": {
    "id": 123,
    "name": "Sticker Personnalisé",
    "description": "Autocollant haute qualité",
    "price": 500,
    "suggestedPrice": 1200,
    "stock": 0,
    "status": "PUBLISHED",
    "genre": "AUTOCOLLANT",
    "requiresStock": false,
    "categoryId": 2,
    "subCategoryId": 3,
    "categories": ["Accessoires", "Sticker"],
    "sizes": [
      { "id": 1, "sizeName": "5cm*5cm" },
      { "id": 2, "sizeName": "10cm*10cm" }
    ],
    "colorVariations": [
      {
        "id": 10,
        "name": "Blanc",
        "colorCode": "#FFFFFF",
        "price": 500,
        "stock": {},
        "images": [
          {
            "id": 100,
            "view": "Front",
            "url": "https://res.cloudinary.com/...",
            "delimitations": [
              {
                "id": 1000,
                "x": 100,
                "y": 100,
                "width": 800,
                "height": 800,
                "rotation": 0,
                "name": "Zone de personnalisation"
              }
            ]
          }
        ]
      }
    ],
    "hasDelimitations": true,
    "createdAt": "2026-01-24T22:00:00.000Z",
    "updatedAt": "2026-01-24T22:00:00.000Z"
  }
}
```

### Erreur

```json
{
  "statusCode": 400,
  "message": "Fichier manquant pour l'image: img_1234567890_0",
  "error": "Bad Request"
}
```

---

## Exemples de requêtes

### Exemple complet avec cURL

```bash
curl -X POST https://printalma-back-dep.onrender.com/products \
  -H "Content-Type: multipart/form-data" \
  -F "productData={\"name\":\"Sticker Test\",\"description\":\"Test autocollant\",\"price\":500,\"suggestedPrice\":1200,\"status\":\"PUBLISHED\",\"categoryId\":2,\"subCategoryId\":3,\"categories\":[\"Accessoires\"],\"genre\":\"AUTOCOLLANT\",\"requiresStock\":false,\"isReadyProduct\":false,\"sizes\":[\"5cm*5cm\"],\"variations\":[{\"value\":\"Blanc\",\"colorCode\":\"#FFFFFF\",\"price\":500,\"stock\":0,\"images\":[{\"fileId\":\"img_123_0\",\"view\":\"Front\",\"delimitations\":[{\"x\":100,\"y\":100,\"width\":800,\"height\":800,\"rotation\":0,\"name\":\"Zone\"}]}]}],\"colorVariations\":[{\"name\":\"Blanc\",\"colorCode\":\"#FFFFFF\",\"price\":500,\"stock\":0,\"images\":[{\"fileId\":\"img_123_0\",\"view\":\"Front\",\"delimitations\":[{\"x\":100,\"y\":100,\"width\":800,\"height\":800,\"rotation\":0,\"name\":\"Zone\"}]}]}]}" \
  -F "file_img_123_0=@/path/to/image.jpg"
```

---

## Gestion des erreurs

### Codes d'erreur spécifiques

| Code | Message | Cause |
|------|---------|-------|
| 400 | "Fichier manquant pour l'image: {fileId}" | Fichier non trouvé dans FormData |
| 400 | "Taille d'autocollant invalide: {size}" | Format de taille incorrect |
| 400 | "Prix invalide pour la variation "{name}"" | Prix manquant ou ≤ 0 pour AUTOCOLLANT |
| 400 | "Au moins une zone de personnalisation requise" | Pas de délimitation définie |
| 500 | "Erreur lors de l'upload Cloudinary" | Erreur upload image |

### Logs de debug

```typescript
// Logs à implémenter pour le debug
console.log('🎨 [BACKEND] === CRÉATION PRODUIT AUTOCOLLANT ===');
console.log('📋 [BACKEND] Données reçues:', {
  name: createProductDto.name,
  genre: createProductDto.genre,
  requiresStock: createProductDto.requiresStock,
  variationsCount: variations.length,
  imagesCount: colorVariations.reduce((sum, cv) => sum + cv.images.length, 0),
  filesReceived: files.length
});

console.log('📦 [BACKEND] Fichiers reçus:');
files.forEach(file => {
  console.log(`   - ${file.fieldname}: ${file.originalname} (${file.size} bytes)`);
});

console.log('✅ [BACKEND] Produit créé avec succès:', product.id);
```

---

## Checklist d'implémentation

- [ ] Parser les champs JSON (`categories`, `sizes`, `variations`, `colorVariations`)
- [ ] Détecter si le produit est un AUTOCOLLANT (`genre === 'AUTOCOLLANT'`)
- [ ] Valider `requiresStock === false` pour AUTOCOLLANT
- [ ] Ignorer le champ `stock` pour AUTOCOLLANT
- [ ] Valider que chaque variation a un prix
- [ ] Valider le format des tailles d'autocollant
- [ ] Retrouver les fichiers par leur `fileId` dans `files`
- [ ] Upload les images sur Cloudinary
- [ ] Créer le produit en base de données
- [ ] Créer les tailles
- [ ] Créer les colorVariations avec leur prix spécifique
- [ ] Créer les images avec leurs URLs Cloudinary
- [ ] Créer les délimitations
- [ ] Marquer le produit avec `hasDelimitations: true`
- [ ] Retourner une réponse JSON avec le produit créé

---

## Notes importantes

1. **FileId :** Le `fileId` est généré par le frontend et sert à faire le lien entre les `colorVariations` et les fichiers dans le FormData.

2. **Prix :** Pour les AUTOCOLLANT, le prix est défini PAR VARIATION de couleur, pas un prix global pour le produit.

3. **Stock :** Les AUTOCOLLANT n'ont pas de stock (`requiresStock: false`).

4. **Délimitations :** Au moins une délimitation est OBLIGATOIRE pour les produits mockup admin.

5. **Cloudinary :** Utiliser le dossier `printalma` avec un `publicId` unique pour chaque image.

---

## Support

Pour toute question ou problème, consultez les fichiers :
- `BACKEND_ADAPTATION_AUTOCOLLANT.md` (adaptation backend précédente)
- `FRONTEND_MIGRATION_NOTES.md` (notes de migration frontend)
- `CLAUDE.md` (instructions générales du projet)
