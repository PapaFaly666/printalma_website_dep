# Guide d'Implémentation Backend pour la Gestion des Designs de Produits

## Vue d'ensemble

Ce document décrit en détail comment le backend doit gérer les trois options de designs de produits spécifiées dans la documentation:
1. Aucun design
2. Design existant
3. Nouveau design personnalisé

## Structure des requêtes envoyées par le frontend

### Option 1: Aucun design

**Format**: JSON (`application/json`)

**Contenu de la requête**:
```json
{
  "name": "Nom du produit",
  "description": "Description du produit",
  "price": 19.99,
  "stock": 100,
  "status": "DRAFT",
  "categoryId": 1,
  "sizeIds": ["1", "2", "3"],
  "colorIds": ["1", "2"],
  "customColors": [] // Optionnel
}
```

**Point de terminaison**: `/products` (méthode POST)

### Option 2: Design existant

**Format**: JSON (`application/json`)

**Contenu de la requête**:
```json
{
  "name": "Nom du produit",
  "description": "Description du produit",
  "price": 19.99,
  "stock": 100,
  "status": "DRAFT",
  "categoryId": 1,
  "designId": 1, // ID du design existant
  "sizeIds": ["1", "2", "3"],
  "colorIds": ["1", "2"],
  "customColors": [] // Optionnel
}
```

**Point de terminaison**: `/products` (méthode POST)

### Option 3: Nouveau design personnalisé

**Format**: FormData (`multipart/form-data`)

**Contenu de la requête**:
- `name`: String - Nom du produit
- `description`: String - Description du produit
- `price`: String - Prix du produit (en nombre)
- `stock`: String - Stock du produit (en nombre)
- `status`: String - Statut du produit (ex: "DRAFT")
- `categoryId`: String - ID de la catégorie
- `sizeIds`: String - Tableau JSON stringifié des IDs de tailles
- `colorIds`: String - Tableau JSON stringifié des IDs de couleurs
- `customColors`: String (optionnel) - Tableau JSON stringifié des couleurs personnalisées
- `customDesign`: String - Objet JSON stringifié contenant les informations du design
- `designImage`: File (optionnel) - Fichier image du design

**Exemple de `customDesign`**:
```json
{
  "name": "Nom du design personnalisé",
  "description": "Description du design personnalisé"
}
```

**Point de terminaison**: `/products/with-design` (méthode POST)

## Implémentation backend

### Configuration du contrôleur

```typescript
import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Option 1 et Option 2: Produit sans design ou avec design existant
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    console.log('DTO reçu:', createProductDto);
    
    // Vérifier si un designId est présent dans la requête
    if (createProductDto.designId) {
      console.log('Design existant spécifié, designId:', createProductDto.designId);
    } else {
      console.log('Aucun design spécifié pour ce produit.');
    }
    
    // Traitement et stockage du produit
    const product = await this.productsService.create(createProductDto);
    
    // Retourner la réponse avec des métadonnées utiles
    return {
      ...product,
      meta: {
        message: 'Produit créé avec succès',
        designCreationMethod: createProductDto.designId ? 'design_existant' : 'sans_design',
        designId: createProductDto.designId || null,
        designName: createProductDto.designId ? await this.getDesignName(createProductDto.designId) : null,
        designImageUrl: createProductDto.designId ? await this.getDesignImageUrl(createProductDto.designId) : null,
        hasDesign: !!createProductDto.designId
      }
    };
  }

  // Option 3: Produit avec nouveau design personnalisé
  @Post('with-design')
  @UseInterceptors(
    FileInterceptor('designImage', {
      storage: diskStorage({
        destination: './uploads/designs',
        filename: (req, file, cb) => {
          // Générer un nom de fichier unique
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `design-${uniqueSuffix}${ext}`);
        },
      }),
      // Vérifier que le fichier est bien une image
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          return cb(new Error('Seules les images sont acceptées'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createWithDesign(
    @Body() createProductDto: any,
    @UploadedFile() designImage: Express.Multer.File,
  ) {
    console.log('DTO reçu:', createProductDto);
    console.log('Headers Content-Type:', this.getContentType());
    console.log('Design image reçue:', designImage);
    
    // IMPORTANT: Parser le customDesign qui est reçu comme une chaîne JSON
    let customDesign;
    try {
      if (createProductDto.customDesign) {
        customDesign = JSON.parse(createProductDto.customDesign);
        console.log('customDesign parsé:', customDesign);
      }
    } catch (error) {
      console.error('Erreur lors du parsing de customDesign:', error);
      throw new Error('Le format de customDesign est invalide');
    }
    
    // IMPORTANT: Parser les tableaux qui sont reçus comme des chaînes JSON
    try {
      if (createProductDto.sizeIds) {
        createProductDto.sizeIds = JSON.parse(createProductDto.sizeIds);
      }
      if (createProductDto.colorIds) {
        createProductDto.colorIds = JSON.parse(createProductDto.colorIds);
      }
      if (createProductDto.customColors) {
        createProductDto.customColors = JSON.parse(createProductDto.customColors);
      }
    } catch (error) {
      console.error('Erreur lors du parsing des tableaux:', error);
    }
    
    // Traiter et enregistrer le design
    const designData = {
      name: customDesign?.name || 'Design sans nom',
      description: customDesign?.description || 'Aucune description',
      imageUrl: designImage ? `/uploads/designs/${designImage.filename}` : null
    };
    
    const savedDesign = await this.productsService.createDesign(designData);
    
    // Préparer les données du produit avec le nouveau designId
    const productData = {
      ...createProductDto,
      designId: savedDesign.id
    };
    
    // Traiter et enregistrer le produit
    const product = await this.productsService.create(productData);
    
    // Retourner la réponse avec des métadonnées utiles
    return {
      ...product,
      design: savedDesign,
      meta: {
        message: 'Produit créé avec succès',
        designCreationMethod: designImage 
          ? 'design_personnalisé_avec_image' 
          : 'design_personnalisé_sans_image',
        designId: savedDesign.id,
        designName: savedDesign.name,
        designImageUrl: savedDesign.imageUrl,
        hasDesign: true
      }
    };
  }

  // Méthodes utilitaires
  private getContentType(): string {
    // Récupérer le Content-Type depuis la requête
    return this.req?.headers['content-type'] || '';
  }

  private async getDesignName(designId: number): Promise<string> {
    const design = await this.productsService.findDesignById(designId);
    return design?.name || null;
  }

  private async getDesignImageUrl(designId: number): Promise<string> {
    const design = await this.productsService.findDesignById(designId);
    return design?.imageUrl || null;
  }
}
```

### Création du DTO avec validation

```typescript
// create-product.dto.ts
import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsNotEmpty()
  @IsEnum(['DRAFT', 'PUBLISHED'])
  status: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  categoryId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  designId?: number;

  @IsNotEmpty()
  @IsArray()
  sizeIds: string[];

  @IsNotEmpty()
  @IsArray()
  colorIds: string[];

  @IsOptional()
  @IsArray()
  customColors?: Array<{ name: string; hexCode: string }>;
}

// Classe spéciale pour le endpoint with-design qui attend un FormData
// Note: Dans ce cas, les validations sont moins strictes car les types sont tous
// convertis en chaînes via FormData
export class CreateProductWithDesignDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  price: string; // Sera un string dans FormData

  @IsNotEmpty()
  stock: string; // Sera un string dans FormData

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  categoryId: string; // Sera un string dans FormData

  @IsNotEmpty()
  @IsString()
  sizeIds: string; // JSON.stringify([1, 2, 3])

  @IsNotEmpty()
  @IsString()
  colorIds: string; // JSON.stringify([1, 2])

  @IsOptional()
  @IsString()
  customColors?: string; // JSON.stringify([{name, hexCode}, ...])

  @IsNotEmpty()
  @IsString()
  customDesign: string; // JSON.stringify({name, description})
}
```

### Configuration de Multer pour le traitement des fichiers

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Service de produits

```typescript
// products.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Traiter et convertir les données si nécessaire
    const productData = {
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      stock: createProductDto.stock,
      status: createProductDto.status,
      categoryId: createProductDto.categoryId,
      designId: createProductDto.designId || null,
    };

    // Créer d'abord le produit
    const product = await this.prisma.product.create({
      data: productData,
    });

    // Ensuite associer les tailles (size)
    if (createProductDto.sizeIds && createProductDto.sizeIds.length > 0) {
      await this.attachSizes(product.id, createProductDto.sizeIds);
    }

    // Associer les couleurs (color)
    if (createProductDto.colorIds && createProductDto.colorIds.length > 0) {
      await this.attachColors(product.id, createProductDto.colorIds);
    }

    // Créer et associer les couleurs personnalisées
    if (createProductDto.customColors && createProductDto.customColors.length > 0) {
      await this.createCustomColors(product.id, createProductDto.customColors);
    }

    // Retourner le produit avec ses relations
    return this.findOne(product.id);
  }

  async createDesign(designData: { 
    name: string; 
    description: string; 
    imageUrl: string | null;
  }) {
    return this.prisma.design.create({
      data: designData,
    });
  }

  async findDesignById(id: number) {
    return this.prisma.design.findUnique({
      where: { id },
    });
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sizes: true,
        colors: true,
        customColors: true,
        design: true,
      },
    });
  }

  // Méthodes d'aide pour créer les relations
  private async attachSizes(productId: number, sizeIds: string[]) {
    const data = sizeIds.map(sizeId => ({
      productId,
      sizeId: parseInt(sizeId),
    }));

    return this.prisma.productSize.createMany({
      data,
      skipDuplicates: true,
    });
  }

  private async attachColors(productId: number, colorIds: string[]) {
    const data = colorIds.map(colorId => ({
      productId,
      colorId: parseInt(colorId),
    }));

    return this.prisma.productColor.createMany({
      data,
      skipDuplicates: true,
    });
  }

  private async createCustomColors(
    productId: number,
    customColors: Array<{ name: string; hexCode: string }>,
  ) {
    const data = customColors.map(color => ({
      name: color.name,
      hexCode: color.hexCode,
      productId,
    }));

    return this.prisma.customColor.createMany({
      data,
    });
  }
}
```

## Points clés à vérifier

1. **Content-Type pour FormData**:
   - Ne pas vérifier explicitement `multipart/form-data`. Le navigateur ajoute automatiquement un boundary.
   - Le Content-Type réel ressemblera à `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`

2. **Parsing des champs JSON en FormData**:
   - Tous les tableaux et objets complexes arrivent comme des chaînes JSON.
   - Vous devez utiliser `JSON.parse()` sur:
     - `sizeIds`
     - `colorIds`  
     - `customColors`
     - `customDesign`

3. **Traitement de l'image**:
   - Pour un flux optimal, stockez d'abord l'image.
   - Créez ensuite l'entrée de design dans la base de données.
   - Liez enfin le design au produit en utilisant le designId.

4. **Validation des données**:
   - Validez que `customDesign` est présent et correctement formaté.
   - L'image est optionnelle, mais si elle est fournie, assurez-vous qu'elle est valide.
   - Vérifiez que les données JSON parsées ont la structure attendue.

## Guide de débogage

Si vous rencontrez des problèmes lors de la réception des designs:

1. **Vérifiez les headers de la requête**:
   ```typescript
   console.log('Headers complets:', req.headers);
   ```

2. **Inspectez le DTO brut tel qu'il est reçu**:
   ```typescript
   console.log('DTO brut avant traitement:', req.body);
   ```

3. **Examinez l'état du fichier**:
   ```typescript
   console.log('Fichier reçu:', designImage ? {
     filename: designImage.filename,
     originalName: designImage.originalname,
     size: designImage.size,
     mimetype: designImage.mimetype
   } : null);
   ```

4. **Vérifiez les parse d'objets JSON**:
   ```typescript
   try {
     const parsed = JSON.parse(req.body.customDesign);
     console.log('customDesign parsé avec succès:', parsed);
   } catch (e) {
     console.error('Erreur de parsing customDesign:', e);
     console.log('Valeur brute customDesign:', req.body.customDesign);
   }
   ```

## Exemples de requêtes pour tester

### Test manuel avec curl

#### Option 1: Produit sans design
```bash
curl -X POST http://localhost:3004/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "description": "T-shirt test sans design",
    "price": 19.99,
    "stock": 50,
    "status": "DRAFT",
    "categoryId": 1,
    "sizeIds": ["1", "2"],
    "colorIds": ["1"]
  }'
```

#### Option 2: Produit avec design existant
```bash
curl -X POST http://localhost:3004/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "description": "T-shirt test avec design existant",
    "price": 19.99,
    "stock": 50,
    "status": "DRAFT",
    "categoryId": 1,
    "designId": 1,
    "sizeIds": ["1", "2"],
    "colorIds": ["1"]
  }'
```

#### Option 3: Produit avec nouveau design
```bash
curl -X POST http://localhost:3004/products/with-design \
  -F "name=T-shirt Test" \
  -F "description=T-shirt test avec nouveau design" \
  -F "price=19.99" \
  -F "stock=50" \
  -F "status=DRAFT" \
  -F "categoryId=1" \
  -F "sizeIds=[\"1\",\"2\"]" \
  -F "colorIds=[\"1\"]" \
  -F "customDesign={\"name\":\"Mon design\",\"description\":\"Description de mon design\"}" \
  -F "designImage=@/chemin/vers/image.jpg"
```

## Formulaire HTML de test

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test de création de produit avec design</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input[type="text"], input[type="number"], select, textarea { width: 100%; padding: 8px; }
    button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
    .tab { display: none; }
    .tab.active { display: block; }
    .tabs { display: flex; margin-bottom: 20px; }
    .tab-button { padding: 10px 15px; cursor: pointer; border: 1px solid #ddd; background: #f1f1f1; }
    .tab-button.active { background: #ddd; }
  </style>
</head>
<body>
  <h1>Testeur de création de produit</h1>
  
  <div class="tabs">
    <div class="tab-button active" onclick="showTab(0)">Sans design</div>
    <div class="tab-button" onclick="showTab(1)">Design existant</div>
    <div class="tab-button" onclick="showTab(2)">Nouveau design</div>
  </div>
  
  <div class="tab active" id="tab0">
    <h2>Option 1: Produit sans design</h2>
    <form id="form-without-design">
      <div class="form-group">
        <label for="name0">Nom du produit</label>
        <input type="text" id="name0" name="name" value="Produit test sans design" required>
      </div>
      <div class="form-group">
        <label for="description0">Description</label>
        <textarea id="description0" name="description" required>Description du produit sans design</textarea>
      </div>
      <div class="form-group">
        <label for="price0">Prix</label>
        <input type="number" id="price0" name="price" value="19.99" step="0.01" required>
      </div>
      <div class="form-group">
        <label for="stock0">Stock</label>
        <input type="number" id="stock0" name="stock" value="50" required>
      </div>
      <div class="form-group">
        <label for="status0">Statut</label>
        <select id="status0" name="status" required>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
        </select>
      </div>
      <div class="form-group">
        <label for="categoryId0">Catégorie ID</label>
        <input type="number" id="categoryId0" name="categoryId" value="1" required>
      </div>
      <div class="form-group">
        <label for="sizeIds0">IDs des tailles (séparés par virgule)</label>
        <input type="text" id="sizeIds0" name="sizeIds" value="1,2" required>
      </div>
      <div class="form-group">
        <label for="colorIds0">IDs des couleurs (séparés par virgule)</label>
        <input type="text" id="colorIds0" name="colorIds" value="1" required>
      </div>
      <button type="submit">Créer produit sans design</button>
    </form>
  </div>
  
  <div class="tab" id="tab1">
    <h2>Option 2: Produit avec design existant</h2>
    <form id="form-with-existing-design">
      <div class="form-group">
        <label for="name1">Nom du produit</label>
        <input type="text" id="name1" name="name" value="Produit test avec design existant" required>
      </div>
      <div class="form-group">
        <label for="description1">Description</label>
        <textarea id="description1" name="description" required>Description du produit avec design existant</textarea>
      </div>
      <div class="form-group">
        <label for="price1">Prix</label>
        <input type="number" id="price1" name="price" value="29.99" step="0.01" required>
      </div>
      <div class="form-group">
        <label for="stock1">Stock</label>
        <input type="number" id="stock1" name="stock" value="30" required>
      </div>
      <div class="form-group">
        <label for="status1">Statut</label>
        <select id="status1" name="status" required>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
        </select>
      </div>
      <div class="form-group">
        <label for="categoryId1">Catégorie ID</label>
        <input type="number" id="categoryId1" name="categoryId" value="1" required>
      </div>
      <div class="form-group">
        <label for="designId">Design ID</label>
        <input type="number" id="designId" name="designId" value="1" required>
      </div>
      <div class="form-group">
        <label for="sizeIds1">IDs des tailles (séparés par virgule)</label>
        <input type="text" id="sizeIds1" name="sizeIds" value="1,2" required>
      </div>
      <div class="form-group">
        <label for="colorIds1">IDs des couleurs (séparés par virgule)</label>
        <input type="text" id="colorIds1" name="colorIds" value="1" required>
      </div>
      <button type="submit">Créer produit avec design existant</button>
    </form>
  </div>
  
  <div class="tab" id="tab2">
    <h2>Option 3: Produit avec nouveau design</h2>
    <form id="form-with-new-design" enctype="multipart/form-data">
      <div class="form-group">
        <label for="name2">Nom du produit</label>
        <input type="text" id="name2" name="name" value="Produit test avec nouveau design" required>
      </div>
      <div class="form-group">
        <label for="description2">Description du produit</label>
        <textarea id="description2" name="description" required>Description du produit avec nouveau design</textarea>
      </div>
      <div class="form-group">
        <label for="price2">Prix</label>
        <input type="number" id="price2" name="price" value="39.99" step="0.01" required>
      </div>
      <div class="form-group">
        <label for="stock2">Stock</label>
        <input type="number" id="stock2" name="stock" value="20" required>
      </div>
      <div class="form-group">
        <label for="status2">Statut</label>
        <select id="status2" name="status" required>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
        </select>
      </div>
      <div class="form-group">
        <label for="categoryId2">Catégorie ID</label>
        <input type="number" id="categoryId2" name="categoryId" value="1" required>
      </div>
      <div class="form-group">
        <label for="sizeIds2">IDs des tailles (séparés par virgule)</label>
        <input type="text" id="sizeIds2" name="sizeIds" value="1,2" required>
      </div>
      <div class="form-group">
        <label for="colorIds2">IDs des couleurs (séparés par virgule)</label>
        <input type="text" id="colorIds2" name="colorIds" value="1" required>
      </div>
      <div class="form-group">
        <label for="designName">Nom du design</label>
        <input type="text" id="designName" name="designName" value="Mon nouveau design" required>
      </div>
      <div class="form-group">
        <label for="designDescription">Description du design</label>
        <textarea id="designDescription" name="designDescription">Description du nouveau design</textarea>
      </div>
      <div class="form-group">
        <label for="designImage">Image du design</label>
        <input type="file" id="designImage" name="designImage" accept="image/*">
      </div>
      <button type="submit">Créer produit avec nouveau design</button>
    </form>
  </div>
  
  <div id="result" style="margin-top: 20px; padding: 10px; background: #f8f8f8; border: 1px solid #ddd; display: none;">
    <h3>Résultat:</h3>
    <pre id="result-content"></pre>
  </div>
  
  <script>
    function showTab(index) {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.getElementById(`tab${index}`).classList.add('active');
      document.querySelectorAll('.tab-button')[index].classList.add('active');
    }
    
    document.getElementById('form-without-design').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      
      // Convertir certains champs
      data.price = parseFloat(data.price);
      data.stock = parseInt(data.stock);
      data.categoryId = parseInt(data.categoryId);
      data.sizeIds = data.sizeIds.split(',').map(id => id.trim());
      data.colorIds = data.colorIds.split(',').map(id => id.trim());
      
      await sendRequest('http://localhost:3004/products', data);
    });
    
    document.getElementById('form-with-existing-design').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      
      // Convertir certains champs
      data.price = parseFloat(data.price);
      data.stock = parseInt(data.stock);
      data.categoryId = parseInt(data.categoryId);
      data.designId = parseInt(data.designId);
      data.sizeIds = data.sizeIds.split(',').map(id => id.trim());
      data.colorIds = data.colorIds.split(',').map(id => id.trim());
      
      await sendRequest('http://localhost:3004/products', data);
    });
    
    document.getElementById('form-with-new-design').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      // Préparer customDesign
      const customDesign = {
        name: formData.get('designName'),
        description: formData.get('designDescription')
      };
      
      // Supprimer les champs qui ne sont pas attendus par l'API
      formData.delete('designName');
      formData.delete('designDescription');
      
      // Ajouter customDesign en tant que JSON string
      formData.set('customDesign', JSON.stringify(customDesign));
      
      // Convertir les arrays en JSON strings
      formData.set('sizeIds', JSON.stringify(formData.get('sizeIds').split(',').map(id => id.trim())));
      formData.set('colorIds', JSON.stringify(formData.get('colorIds').split(',').map(id => id.trim())));
      
      await sendFormDataRequest('http://localhost:3004/products/with-design', formData);
    });
    
    async function sendRequest(url, data) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        showResult(result);
      } catch (error) {
        showResult({ error: error.message });
      }
    }
    
    async function sendFormDataRequest(url, formData) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData
          // NE PAS définir Content-Type ici - le navigateur s'en occupe
        });
        
        const result = await response.json();
        showResult(result);
      } catch (error) {
        showResult({ error: error.message });
      }
    }
    
    function showResult(data) {
      const resultEl = document.getElementById('result');
      const contentEl = document.getElementById('result-content');
      
      contentEl.textContent = JSON.stringify(data, null, 2);
      resultEl.style.display = 'block';
      resultEl.scrollIntoView({ behavior: 'smooth' });
    }
  </script>
</body>
</html>
```

## Conclusion

Cette documentation fournit un guide complet pour implémenter la gestion des designs de produits côté backend. Suivez ces recommandations pour assurer une intégration fluide entre votre frontend et backend.

Les points les plus importants à retenir sont:
1. Utilisez le bon format de requête selon l'option choisie (JSON vs FormData)
2. Parsez correctement les champs JSON dans les requêtes FormData
3. Gérez correctement les images téléchargées
4. Fournissez des métadonnées utiles dans les réponses

En suivant ce guide, vous pourrez implémenter une API robuste qui accepte et traite correctement les trois options de designs de produits. 