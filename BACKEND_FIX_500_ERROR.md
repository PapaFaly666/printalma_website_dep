# 🔴 URGENT : Fix Erreur 500 Backend - Création Produit

## 📋 Problème

Le frontend renvoie une **erreur 500** lors de la création d'un produit, et le backend ne produit **aucun log**.

### Test effectué avec curl :

```bash
curl -X POST "https://printalma-back-dep.onrender.com/products" \
  -F 'productData={"name":"Test","price":500,"categoryId":2,"categories":"[\"Test\"]","genre":"AUTOCOLLANT","sizes":"[\"5cm*5cm\"]","variations":"[]","colorVariations":"[]"}' \
  -F "files=@/tmp/test.png"
```

**Résultat :** `{"statusCode":500,"message":"Internal server error"}`

Sans fichier :
```bash
curl -X POST "https://printalma-back-dep.onrender.com/products" \
  -F 'productData={"name":"Test","price":500,"categoryId":2,...}'
```

**Résultat :** `{"message":"At least one image file is required."}` ✅

## 🔍 Diagnostic

Le backend reçoit correctement le `productData` mais échoue lors du traitement des fichiers.

## 🛠️ Solution Backend

### 1. Vérifier FilesInterceptor

```typescript
// products.controller.ts

@Post()
@UseInterceptor(FilesInterceptor('files', 20))  // <-- Le nom du champ DOIT être 'files'
async createProduct(
  @Body() createProductDto: CreateProductDto,
  @UploadedFiles() files: Express.Multer.File[]  // <-- Les fichiers seront ici
) {
  console.log('📦 [BACKEND] Fichiers reçus:', files.length);

  if (!files || files.length === 0) {
    throw new BadRequestException('At least one image file is required.');
  }

  return this.productsService.create(createProductDto, files);
}
```

### 2. DTO avec validation correcte

```typescript
// create-product.dto.ts

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status: string;

  @IsNumber()
  categoryId: number;

  @IsNumber()
  @IsOptional()
  subCategoryId?: number;

  @IsString()
  categories: string; // JSON stringifié

  @IsString()
  @IsIn(['HOMME', 'FEMME', 'BEBE', 'UNISEXE', 'AUTOCOLLANT'])
  genre: string;

  @IsString()
  sizes: string; // JSON stringifié

  @IsString()
  variations: string; // JSON stringifié

  @IsString()
  colorVariations: string; // JSON stringifié
}
```

### 3. Parser correctement les JSON stringifiés

```typescript
// products.service.ts

async create(createProductDto: CreateProductDto, files: Express.Multer.File[]) {
  console.log('🚀 [BACKEND] Création de produit...');
  console.log('📦 [BACKEND] Fichiers reçus:', files.length);

  // Parser les JSON stringifiés
  const categories = JSON.parse(createProductDto.categories);
  const sizes = JSON.parse(createProductDto.sizes);
  const variations = JSON.parse(createProductDto.variations);
  const colorVariations = JSON.parse(createProductDto.colorVariations);

  console.log('📋 [BACKEND] Categories:', categories);
  console.log('📏 [BACKEND] Sizes:', sizes);
  console.log('🎨 [BACKEND] Variations:', variations.length);
  console.log('🎨 [BACKEND] ColorVariations:', colorVariations.length);

  // ... suite du traitement
}
```

### 4. Vérifier Multer configuration

```typescript
// multer.config.ts

export const multerConfig = {
  storage: multer.memoryStorage(),  // Important: utiliser memoryStorage
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 20
  }
};

// main.ts ou app.module.ts
import * as multer from 'multer';

app.use(multer().any());  // Pour accepter les fichiers
```

## 🧪 Test après correction

Une fois les corrections appliquées, tester avec :

```bash
# Test sans fichier (doit renvoyer 400 "At least one image file is required")
curl -X POST "https://printalma-back-dep.onrender.com/products" \
  -F 'productData={"name":"Test","price":500,"categoryId":2,"categories":"[\"Test\"]","genre":"AUTOCOLLANT","sizes":"[\"5cm*5cm\"]","variations":"[]","colorVariations":"[]"}'

# Test avec fichier (doit renvoyer 201 avec le produit créé)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test.png

curl -X POST "https://printalma-back-dep.onrender.com/products" \
  -F 'productData={"name":"Test Correct","description":"Test","price":500,"categoryId":2,"categories":"[\"Test\"]","genre":"AUTOCOLLANT","sizes":"[\"5cm*5cm\"]","variations":"[]","colorVariations":"[]"}' \
  -F "files=@/tmp/test.png"
```

## 📊 Logs attendus après correction

```log
🚀 [BACKEND] Création de produit...
📦 [BACKEND] Fichiers reçus: 1
📋 [BACKEND] Categories: ["Test"]
📏 [BACKEND] Sizes: ["5cm*5cm"]
🎨 [BACKEND] Variations: 0
🎨 [BACKEND] ColorVariations: 0
✅ [BACKEND] Produit créé avec succès: ID=123
```

## 🔍 Points à vérifier en priorité

1. **FilesInterceptor** : Le nom du champ ('files') correspond-il à ce qui est envoyé ?
2. **DTO** : Les champs JSON stringifiés sont-ils bien parsés ?
3. **Multer** : `memoryStorage()` est-il utilisé ?
4. **Cloudinary** : Le service d'upload fonctionne-t-il ?
5. **Logs** : Ajouter des logs dans le contrôleur et le service

## 🚨 Si l'erreur persiste

Si l'erreur 500 persiste, le problème peut venir de :

1. **Cloudinary** : Vérifier les variables d'environnement (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
2. **Base de données** : Vérifier la connexion Prisma
3. **Validation DTO** : Désactiver temporairement la validation pour identifier le champ problématique

```typescript
// Désactiver temporairement la validation
@UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false }))
async createProduct(...) {
  ...
}
```

## 📞 Contact

Pour toute question sur ce fix, contacter l'équipe frontend avec les logs détaillés du backend.
