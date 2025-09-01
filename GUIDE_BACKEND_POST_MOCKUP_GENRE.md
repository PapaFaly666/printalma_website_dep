# 🎯 Guide Backend - Ajout du Champ Genre dans POST /mockups

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation spécifique du champ `genre` dans l'endpoint POST pour créer des mockups. Le champ permet de catégoriser les mockups selon leur public cible.

## 🎯 Objectif

Modifier l'endpoint `POST /mockups` (ou `POST /products` avec `isReadyProduct: false`) pour accepter et traiter le champ `genre` :
- **homme** : Mockups destinés aux hommes
- **femme** : Mockups destinés aux femmes  
- **bébé** : Mockups destinés aux bébés/enfants
- **unisexe** : Mockups pour tous les genres (valeur par défaut)

## 🔧 Modifications Backend Spécifiques

### 1. **Modèle de Données - Migration**

```sql
-- Migration pour ajouter le champ genre à la table products/mockups
ALTER TABLE products ADD COLUMN genre VARCHAR(10) DEFAULT 'unisexe';

-- Index pour optimiser les requêtes par genre
CREATE INDEX idx_products_genre ON products(genre);

-- Contrainte pour limiter les valeurs possibles
ALTER TABLE products ADD CONSTRAINT chk_products_genre 
CHECK (genre IN ('homme', 'femme', 'bébé', 'unisexe'));

-- Mettre à jour les produits existants
UPDATE products SET genre = 'unisexe' WHERE genre IS NULL;
```

### 2. **DTO pour l'Endpoint POST Mockup**

```typescript
// dto/create-mockup.dto.ts
export interface CreateMockupDto {
  name: string;
  description: string;
  price: number;
  status?: 'draft' | 'published';
  isReadyProduct: false; // Toujours false pour les mockups
  genre?: 'homme' | 'femme' | 'bébé' | 'unisexe'; // ← NOUVEAU CHAMP
  
  // Champs existants
  categories?: string[];
  sizes?: string[];
  colorVariations?: CreateColorVariationDto[];
}

// DTO pour la réponse
export interface MockupResponseDto {
  id: number;
  name: string;
  description: string;
  price: number;
  status: 'draft' | 'published';
  isReadyProduct: false;
  genre: 'homme' | 'femme' | 'bébé' | 'unisexe'; // ← NOUVEAU CHAMP
  
  categories: Category[];
  colorVariations: ColorVariation[];
  sizes: Size[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. **Validation pour l'Endpoint POST**

```typescript
// validation/create-mockup.validation.ts
import Joi from 'joi';

export const createMockupSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().required().min(1),
  price: Joi.number().required().min(0),
  status: Joi.string().valid('draft', 'published').default('draft'),
  isReadyProduct: Joi.boolean().valid(false).required(), // Doit être false pour les mockups
  genre: Joi.string().valid('homme', 'femme', 'bébé', 'unisexe').default('unisexe'), // ← NOUVEAU CHAMP
  
  // Champs existants
  categories: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  colorVariations: Joi.array().items(colorVariationSchema)
});

// Validation pour la mise à jour
export const updateMockupSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().min(1),
  price: Joi.number().min(0),
  status: Joi.string().valid('draft', 'published'),
  genre: Joi.string().valid('homme', 'femme', 'bébé', 'unisexe'), // ← NOUVEAU CHAMP
  
  categories: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  colorVariations: Joi.array().items(colorVariationSchema)
});
```

### 4. **Service Mockup avec Genre**

```typescript
// services/mockup.service.ts
export class MockupService {
  constructor(private readonly productRepository: ProductRepository) {}

  // Créer un mockup avec genre
  async createMockup(createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    // Validation spécifique pour les mockups
    if (createMockupDto.isReadyProduct !== false) {
      throw new BadRequestException('Les mockups doivent avoir isReadyProduct: false');
    }

    const mockup = await this.productRepository.create({
      ...createMockupDto,
      genre: createMockupDto.genre || 'unisexe', // ← Valeur par défaut
      isReadyProduct: false, // Forcer à false pour les mockups
    });
    
    return this.mapToResponseDto(mockup);
  }

  // Mettre à jour un mockup avec genre
  async updateMockup(id: number, updateMockupDto: UpdateMockupDto): Promise<MockupResponseDto> {
    const mockup = await this.productRepository.update(id, {
      ...updateMockupDto,
      // Le genre peut être mis à jour
    });
    
    return this.mapToResponseDto(mockup);
  }

  // Récupérer les mockups par genre
  async getMockupsByGenre(genre: 'homme' | 'femme' | 'bébé' | 'unisexe'): Promise<MockupResponseDto[]> {
    const mockups = await this.productRepository.findMany({
      where: { 
        genre,
        isReadyProduct: false // Seulement les mockups
      },
      include: {
        categories: true,
        colorVariations: {
          include: {
            images: true
          }
        },
        sizes: true
      }
    });
    
    return mockups.map(mockup => this.mapToResponseDto(mockup));
  }

  // Récupérer tous les genres disponibles pour les mockups
  async getAvailableMockupGenres(): Promise<string[]> {
    const genres = await this.productRepository.findMany({
      where: { isReadyProduct: false }, // Seulement les mockups
      select: { genre: true },
      distinct: ['genre']
    });
    
    return genres.map(g => g.genre);
  }

  // Méthode utilitaire pour mapper vers la réponse
  private mapToResponseDto(mockup: any): MockupResponseDto {
    return {
      id: mockup.id,
      name: mockup.name,
      description: mockup.description,
      price: mockup.price,
      status: mockup.status,
      isReadyProduct: false,
      genre: mockup.genre, // ← NOUVEAU CHAMP
      categories: mockup.categories || [],
      colorVariations: mockup.colorVariations || [],
      sizes: mockup.sizes || [],
      createdAt: mockup.createdAt,
      updatedAt: mockup.updatedAt
    };
  }
}
```

### 5. **Contrôleur Mockup avec Genre**

```typescript
// controllers/mockup.controller.ts
export class MockupController {
  constructor(private readonly mockupService: MockupService) {}

  // POST /mockups - Créer un mockup avec genre
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createMockup(@Body() createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    return await this.mockupService.createMockup(createMockupDto);
  }

  // PATCH /mockups/:id - Mettre à jour un mockup avec genre
  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateMockup(
    @Param('id') id: number,
    @Body() updateMockupDto: UpdateMockupDto
  ): Promise<MockupResponseDto> {
    return await this.mockupService.updateMockup(id, updateMockupDto);
  }

  // GET /mockups/by-genre/:genre - Récupérer les mockups par genre
  @Get('by-genre/:genre')
  async getMockupsByGenre(
    @Param('genre') genre: 'homme' | 'femme' | 'bébé' | 'unisexe'
  ): Promise<MockupResponseDto[]> {
    return await this.mockupService.getMockupsByGenre(genre);
  }

  // GET /mockups/genres - Récupérer tous les genres disponibles
  @Get('genres')
  async getAvailableMockupGenres(): Promise<string[]> {
    return await this.mockupService.getAvailableMockupGenres();
  }

  // GET /mockups - Récupérer tous les mockups avec filtre par genre
  @Get()
  async getAllMockups(
    @Query('genre') genre?: 'homme' | 'femme' | 'bébé' | 'unisexe'
  ): Promise<MockupResponseDto[]> {
    let whereClause: any = { isReadyProduct: false }; // Seulement les mockups
    
    if (genre) {
      whereClause.genre = genre;
    }
    
    const mockups = await this.productRepository.findMany({
      where: whereClause,
      include: {
        categories: true,
        colorVariations: {
          include: {
            images: true
          }
        },
        sizes: true
      }
    });
    
    return mockups.map(mockup => this.mockupService.mapToResponseDto(mockup));
  }
}
```

### 6. **Routes Mockup**

```typescript
// routes/mockup.routes.ts
export const mockupRoutes = {
  // Créer un mockup avec genre
  'POST /mockups': 'MockupController.createMockup',
  
  // Mettre à jour un mockup avec genre
  'PATCH /mockups/:id': 'MockupController.updateMockup',
  
  // Récupérer les mockups par genre
  'GET /mockups/by-genre/:genre': 'MockupController.getMockupsByGenre',
  
  // Récupérer tous les genres disponibles
  'GET /mockups/genres': 'MockupController.getAvailableMockupGenres',
  
  // Récupérer tous les mockups avec filtre
  'GET /mockups': 'MockupController.getAllMockups',
};
```

## 🔄 Exemples d'Utilisation

### 1. **Créer un Mockup pour Homme**

```bash
POST /api/mockups
Content-Type: application/json

{
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "homme",
  "categories": ["Vêtements", "Homme"],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [
    {
      "name": "Noir",
      "colorCode": "#000000",
      "images": [
        {
          "file": "image-file",
          "view": "Front"
        }
      ]
    }
  ]
}
```

**Réponse attendue :**
```json
{
  "id": 123,
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "homme",
  "categories": [...],
  "colorVariations": [...],
  "sizes": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. **Créer un Mockup pour Femme**

```bash
POST /api/mockups
Content-Type: application/json

{
  "name": "T-shirt Femme Élégant",
  "description": "T-shirt élégant pour femme",
  "price": 6000,
  "status": "published",
  "isReadyProduct": false,
  "genre": "femme",
  "categories": ["Vêtements", "Femme"],
  "sizes": ["XS", "S", "M", "L"],
  "colorVariations": [...]
}
```

### 3. **Créer un Mockup Unisexe (valeur par défaut)**

```bash
POST /api/mockups
Content-Type: application/json

{
  "name": "T-shirt Unisexe Basic",
  "description": "T-shirt basique pour tous",
  "price": 4500,
  "status": "draft",
  "isReadyProduct": false,
  "categories": ["Vêtements", "Unisexe"],
  "sizes": ["S", "M", "L"],
  "colorVariations": [...]
}
```

**Note :** Le champ `genre` sera automatiquement défini à `"unisexe"` car non spécifié.

## 🧪 Tests pour l'Endpoint POST

```typescript
// tests/mockup.test.ts
describe('POST /mockups - Genre Field', () => {
  it('should create mockup with homme genre', async () => {
    const mockupData = {
      name: 'T-shirt Homme',
      description: 'T-shirt pour homme',
      price: 5000,
      isReadyProduct: false,
      genre: 'homme' as const,
      categories: ['Vêtements'],
      sizes: ['S', 'M', 'L'],
      colorVariations: []
    };

    const response = await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(201);

    expect(response.body.genre).toBe('homme');
    expect(response.body.isReadyProduct).toBe(false);
  });

  it('should default to unisexe when genre not provided', async () => {
    const mockupData = {
      name: 'T-shirt Unisexe',
      description: 'T-shirt unisexe',
      price: 5000,
      isReadyProduct: false,
      categories: ['Vêtements'],
      sizes: ['S', 'M', 'L'],
      colorVariations: []
    };

    const response = await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(201);

    expect(response.body.genre).toBe('unisexe');
  });

  it('should reject invalid genre values', async () => {
    const mockupData = {
      name: 'T-shirt Test',
      description: 'Test',
      price: 5000,
      isReadyProduct: false,
      genre: 'invalid' as any,
      categories: ['Vêtements'],
      sizes: ['S'],
      colorVariations: []
    };

    await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(400);
  });

  it('should reject if isReadyProduct is not false', async () => {
    const mockupData = {
      name: 'T-shirt Test',
      description: 'Test',
      price: 5000,
      isReadyProduct: true, // Doit être false pour les mockups
      genre: 'homme',
      categories: ['Vêtements'],
      sizes: ['S'],
      colorVariations: []
    };

    await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(400);
  });
});
```

## 🔍 Validation et Gestion d'Erreurs

```typescript
// middleware/validation.middleware.ts
export const validateMockupGenre = (req: Request, res: Response, next: NextFunction) => {
  const { genre } = req.body;
  
  if (genre && !['homme', 'femme', 'bébé', 'unisexe'].includes(genre)) {
    return res.status(400).json({
      error: 'Invalid genre value',
      message: 'Genre must be one of: homme, femme, bébé, unisexe',
      received: genre
    });
  }
  
  next();
};

// middleware/mockup.middleware.ts
export const validateMockupData = (req: Request, res: Response, next: NextFunction) => {
  const { isReadyProduct } = req.body;
  
  if (isReadyProduct !== false) {
    return res.status(400).json({
      error: 'Invalid isReadyProduct value',
      message: 'Mockups must have isReadyProduct: false',
      received: isReadyProduct
    });
  }
  
  next();
};
```

## 📊 Logs et Monitoring

```typescript
// services/mockup.service.ts
async createMockup(createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
  // Log avant création
  logger.info('Creating mockup', {
    name: createMockupDto.name,
    genre: createMockupDto.genre || 'unisexe',
    isReadyProduct: createMockupDto.isReadyProduct
  });

  const mockup = await this.productRepository.create({
    ...createMockupDto,
    genre: createMockupDto.genre || 'unisexe',
    isReadyProduct: false,
  });
  
  // Log après création
  logger.info('Mockup created successfully', {
    mockupId: mockup.id,
    genre: mockup.genre,
    name: mockup.name
  });
  
  return this.mapToResponseDto(mockup);
}
```

## ✅ Checklist de Validation

- [ ] Migration de base de données exécutée
- [ ] DTO CreateMockupDto mis à jour avec le champ genre
- [ ] Validation Joi/class-validator ajoutée
- [ ] Service MockupService mis à jour
- [ ] Contrôleur MockupController mis à jour
- [ ] Routes mockup ajoutées
- [ ] Tests unitaires écrits et passants
- [ ] Tests d'intégration écrits et passants
- [ ] Validation des erreurs implémentée
- [ ] Logs ajoutés pour le monitoring
- [ ] Documentation API mise à jour

## 🚀 Déploiement

### 1. **Migration**

```bash
# Exécuter la migration
npm run migrate:up

# Vérifier la migration
npm run migrate:status
```

### 2. **Tests**

```bash
# Tests spécifiques pour les mockups avec genre
npm run test:mockup

# Tests de régression
npm run test
```

### 3. **Validation en Production**

```bash
# Vérifier que les anciens mockups ont une valeur par défaut
SELECT COUNT(*) FROM products WHERE isReadyProduct = false AND genre IS NULL;

# Mettre à jour si nécessaire
UPDATE products SET genre = 'unisexe' WHERE isReadyProduct = false AND genre IS NULL;
```

---

**Note** : Ce guide se concentre spécifiquement sur l'endpoint POST pour les mockups. Assurez-vous que votre backend utilise la même logique pour les autres endpoints (GET, PATCH, DELETE) des mockups. 

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation spécifique du champ `genre` dans l'endpoint POST pour créer des mockups. Le champ permet de catégoriser les mockups selon leur public cible.

## 🎯 Objectif

Modifier l'endpoint `POST /mockups` (ou `POST /products` avec `isReadyProduct: false`) pour accepter et traiter le champ `genre` :
- **homme** : Mockups destinés aux hommes
- **femme** : Mockups destinés aux femmes  
- **bébé** : Mockups destinés aux bébés/enfants
- **unisexe** : Mockups pour tous les genres (valeur par défaut)

## 🔧 Modifications Backend Spécifiques

### 1. **Modèle de Données - Migration**

```sql
-- Migration pour ajouter le champ genre à la table products/mockups
ALTER TABLE products ADD COLUMN genre VARCHAR(10) DEFAULT 'unisexe';

-- Index pour optimiser les requêtes par genre
CREATE INDEX idx_products_genre ON products(genre);

-- Contrainte pour limiter les valeurs possibles
ALTER TABLE products ADD CONSTRAINT chk_products_genre 
CHECK (genre IN ('homme', 'femme', 'bébé', 'unisexe'));

-- Mettre à jour les produits existants
UPDATE products SET genre = 'unisexe' WHERE genre IS NULL;
```

### 2. **DTO pour l'Endpoint POST Mockup**

```typescript
// dto/create-mockup.dto.ts
export interface CreateMockupDto {
  name: string;
  description: string;
  price: number;
  status?: 'draft' | 'published';
  isReadyProduct: false; // Toujours false pour les mockups
  genre?: 'homme' | 'femme' | 'bébé' | 'unisexe'; // ← NOUVEAU CHAMP
  
  // Champs existants
  categories?: string[];
  sizes?: string[];
  colorVariations?: CreateColorVariationDto[];
}

// DTO pour la réponse
export interface MockupResponseDto {
  id: number;
  name: string;
  description: string;
  price: number;
  status: 'draft' | 'published';
  isReadyProduct: false;
  genre: 'homme' | 'femme' | 'bébé' | 'unisexe'; // ← NOUVEAU CHAMP
  
  categories: Category[];
  colorVariations: ColorVariation[];
  sizes: Size[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. **Validation pour l'Endpoint POST**

```typescript
// validation/create-mockup.validation.ts
import Joi from 'joi';

export const createMockupSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().required().min(1),
  price: Joi.number().required().min(0),
  status: Joi.string().valid('draft', 'published').default('draft'),
  isReadyProduct: Joi.boolean().valid(false).required(), // Doit être false pour les mockups
  genre: Joi.string().valid('homme', 'femme', 'bébé', 'unisexe').default('unisexe'), // ← NOUVEAU CHAMP
  
  // Champs existants
  categories: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  colorVariations: Joi.array().items(colorVariationSchema)
});

// Validation pour la mise à jour
export const updateMockupSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().min(1),
  price: Joi.number().min(0),
  status: Joi.string().valid('draft', 'published'),
  genre: Joi.string().valid('homme', 'femme', 'bébé', 'unisexe'), // ← NOUVEAU CHAMP
  
  categories: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  colorVariations: Joi.array().items(colorVariationSchema)
});
```

### 4. **Service Mockup avec Genre**

```typescript
// services/mockup.service.ts
export class MockupService {
  constructor(private readonly productRepository: ProductRepository) {}

  // Créer un mockup avec genre
  async createMockup(createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    // Validation spécifique pour les mockups
    if (createMockupDto.isReadyProduct !== false) {
      throw new BadRequestException('Les mockups doivent avoir isReadyProduct: false');
    }

    const mockup = await this.productRepository.create({
      ...createMockupDto,
      genre: createMockupDto.genre || 'unisexe', // ← Valeur par défaut
      isReadyProduct: false, // Forcer à false pour les mockups
    });
    
    return this.mapToResponseDto(mockup);
  }

  // Mettre à jour un mockup avec genre
  async updateMockup(id: number, updateMockupDto: UpdateMockupDto): Promise<MockupResponseDto> {
    const mockup = await this.productRepository.update(id, {
      ...updateMockupDto,
      // Le genre peut être mis à jour
    });
    
    return this.mapToResponseDto(mockup);
  }

  // Récupérer les mockups par genre
  async getMockupsByGenre(genre: 'homme' | 'femme' | 'bébé' | 'unisexe'): Promise<MockupResponseDto[]> {
    const mockups = await this.productRepository.findMany({
      where: { 
        genre,
        isReadyProduct: false // Seulement les mockups
      },
      include: {
        categories: true,
        colorVariations: {
          include: {
            images: true
          }
        },
        sizes: true
      }
    });
    
    return mockups.map(mockup => this.mapToResponseDto(mockup));
  }

  // Récupérer tous les genres disponibles pour les mockups
  async getAvailableMockupGenres(): Promise<string[]> {
    const genres = await this.productRepository.findMany({
      where: { isReadyProduct: false }, // Seulement les mockups
      select: { genre: true },
      distinct: ['genre']
    });
    
    return genres.map(g => g.genre);
  }

  // Méthode utilitaire pour mapper vers la réponse
  private mapToResponseDto(mockup: any): MockupResponseDto {
    return {
      id: mockup.id,
      name: mockup.name,
      description: mockup.description,
      price: mockup.price,
      status: mockup.status,
      isReadyProduct: false,
      genre: mockup.genre, // ← NOUVEAU CHAMP
      categories: mockup.categories || [],
      colorVariations: mockup.colorVariations || [],
      sizes: mockup.sizes || [],
      createdAt: mockup.createdAt,
      updatedAt: mockup.updatedAt
    };
  }
}
```

### 5. **Contrôleur Mockup avec Genre**

```typescript
// controllers/mockup.controller.ts
export class MockupController {
  constructor(private readonly mockupService: MockupService) {}

  // POST /mockups - Créer un mockup avec genre
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createMockup(@Body() createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    return await this.mockupService.createMockup(createMockupDto);
  }

  // PATCH /mockups/:id - Mettre à jour un mockup avec genre
  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateMockup(
    @Param('id') id: number,
    @Body() updateMockupDto: UpdateMockupDto
  ): Promise<MockupResponseDto> {
    return await this.mockupService.updateMockup(id, updateMockupDto);
  }

  // GET /mockups/by-genre/:genre - Récupérer les mockups par genre
  @Get('by-genre/:genre')
  async getMockupsByGenre(
    @Param('genre') genre: 'homme' | 'femme' | 'bébé' | 'unisexe'
  ): Promise<MockupResponseDto[]> {
    return await this.mockupService.getMockupsByGenre(genre);
  }

  // GET /mockups/genres - Récupérer tous les genres disponibles
  @Get('genres')
  async getAvailableMockupGenres(): Promise<string[]> {
    return await this.mockupService.getAvailableMockupGenres();
  }

  // GET /mockups - Récupérer tous les mockups avec filtre par genre
  @Get()
  async getAllMockups(
    @Query('genre') genre?: 'homme' | 'femme' | 'bébé' | 'unisexe'
  ): Promise<MockupResponseDto[]> {
    let whereClause: any = { isReadyProduct: false }; // Seulement les mockups
    
    if (genre) {
      whereClause.genre = genre;
    }
    
    const mockups = await this.productRepository.findMany({
      where: whereClause,
      include: {
        categories: true,
        colorVariations: {
          include: {
            images: true
          }
        },
        sizes: true
      }
    });
    
    return mockups.map(mockup => this.mockupService.mapToResponseDto(mockup));
  }
}
```

### 6. **Routes Mockup**

```typescript
// routes/mockup.routes.ts
export const mockupRoutes = {
  // Créer un mockup avec genre
  'POST /mockups': 'MockupController.createMockup',
  
  // Mettre à jour un mockup avec genre
  'PATCH /mockups/:id': 'MockupController.updateMockup',
  
  // Récupérer les mockups par genre
  'GET /mockups/by-genre/:genre': 'MockupController.getMockupsByGenre',
  
  // Récupérer tous les genres disponibles
  'GET /mockups/genres': 'MockupController.getAvailableMockupGenres',
  
  // Récupérer tous les mockups avec filtre
  'GET /mockups': 'MockupController.getAllMockups',
};
```

## 🔄 Exemples d'Utilisation

### 1. **Créer un Mockup pour Homme**

```bash
POST /api/mockups
Content-Type: application/json

{
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "homme",
  "categories": ["Vêtements", "Homme"],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [
    {
      "name": "Noir",
      "colorCode": "#000000",
      "images": [
        {
          "file": "image-file",
          "view": "Front"
        }
      ]
    }
  ]
}
```

**Réponse attendue :**
```json
{
  "id": 123,
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "homme",
  "categories": [...],
  "colorVariations": [...],
  "sizes": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. **Créer un Mockup pour Femme**

```bash
POST /api/mockups
Content-Type: application/json

{
  "name": "T-shirt Femme Élégant",
  "description": "T-shirt élégant pour femme",
  "price": 6000,
  "status": "published",
  "isReadyProduct": false,
  "genre": "femme",
  "categories": ["Vêtements", "Femme"],
  "sizes": ["XS", "S", "M", "L"],
  "colorVariations": [...]
}
```

### 3. **Créer un Mockup Unisexe (valeur par défaut)**

```bash
POST /api/mockups
Content-Type: application/json

{
  "name": "T-shirt Unisexe Basic",
  "description": "T-shirt basique pour tous",
  "price": 4500,
  "status": "draft",
  "isReadyProduct": false,
  "categories": ["Vêtements", "Unisexe"],
  "sizes": ["S", "M", "L"],
  "colorVariations": [...]
}
```

**Note :** Le champ `genre` sera automatiquement défini à `"unisexe"` car non spécifié.

## 🧪 Tests pour l'Endpoint POST

```typescript
// tests/mockup.test.ts
describe('POST /mockups - Genre Field', () => {
  it('should create mockup with homme genre', async () => {
    const mockupData = {
      name: 'T-shirt Homme',
      description: 'T-shirt pour homme',
      price: 5000,
      isReadyProduct: false,
      genre: 'homme' as const,
      categories: ['Vêtements'],
      sizes: ['S', 'M', 'L'],
      colorVariations: []
    };

    const response = await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(201);

    expect(response.body.genre).toBe('homme');
    expect(response.body.isReadyProduct).toBe(false);
  });

  it('should default to unisexe when genre not provided', async () => {
    const mockupData = {
      name: 'T-shirt Unisexe',
      description: 'T-shirt unisexe',
      price: 5000,
      isReadyProduct: false,
      categories: ['Vêtements'],
      sizes: ['S', 'M', 'L'],
      colorVariations: []
    };

    const response = await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(201);

    expect(response.body.genre).toBe('unisexe');
  });

  it('should reject invalid genre values', async () => {
    const mockupData = {
      name: 'T-shirt Test',
      description: 'Test',
      price: 5000,
      isReadyProduct: false,
      genre: 'invalid' as any,
      categories: ['Vêtements'],
      sizes: ['S'],
      colorVariations: []
    };

    await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(400);
  });

  it('should reject if isReadyProduct is not false', async () => {
    const mockupData = {
      name: 'T-shirt Test',
      description: 'Test',
      price: 5000,
      isReadyProduct: true, // Doit être false pour les mockups
      genre: 'homme',
      categories: ['Vêtements'],
      sizes: ['S'],
      colorVariations: []
    };

    await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(400);
  });
});
```

## 🔍 Validation et Gestion d'Erreurs

```typescript
// middleware/validation.middleware.ts
export const validateMockupGenre = (req: Request, res: Response, next: NextFunction) => {
  const { genre } = req.body;
  
  if (genre && !['homme', 'femme', 'bébé', 'unisexe'].includes(genre)) {
    return res.status(400).json({
      error: 'Invalid genre value',
      message: 'Genre must be one of: homme, femme, bébé, unisexe',
      received: genre
    });
  }
  
  next();
};

// middleware/mockup.middleware.ts
export const validateMockupData = (req: Request, res: Response, next: NextFunction) => {
  const { isReadyProduct } = req.body;
  
  if (isReadyProduct !== false) {
    return res.status(400).json({
      error: 'Invalid isReadyProduct value',
      message: 'Mockups must have isReadyProduct: false',
      received: isReadyProduct
    });
  }
  
  next();
};
```

## 📊 Logs et Monitoring

```typescript
// services/mockup.service.ts
async createMockup(createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
  // Log avant création
  logger.info('Creating mockup', {
    name: createMockupDto.name,
    genre: createMockupDto.genre || 'unisexe',
    isReadyProduct: createMockupDto.isReadyProduct
  });

  const mockup = await this.productRepository.create({
    ...createMockupDto,
    genre: createMockupDto.genre || 'unisexe',
    isReadyProduct: false,
  });
  
  // Log après création
  logger.info('Mockup created successfully', {
    mockupId: mockup.id,
    genre: mockup.genre,
    name: mockup.name
  });
  
  return this.mapToResponseDto(mockup);
}
```

## ✅ Checklist de Validation

- [ ] Migration de base de données exécutée
- [ ] DTO CreateMockupDto mis à jour avec le champ genre
- [ ] Validation Joi/class-validator ajoutée
- [ ] Service MockupService mis à jour
- [ ] Contrôleur MockupController mis à jour
- [ ] Routes mockup ajoutées
- [ ] Tests unitaires écrits et passants
- [ ] Tests d'intégration écrits et passants
- [ ] Validation des erreurs implémentée
- [ ] Logs ajoutés pour le monitoring
- [ ] Documentation API mise à jour

## 🚀 Déploiement

### 1. **Migration**

```bash
# Exécuter la migration
npm run migrate:up

# Vérifier la migration
npm run migrate:status
```

### 2. **Tests**

```bash
# Tests spécifiques pour les mockups avec genre
npm run test:mockup

# Tests de régression
npm run test
```

### 3. **Validation en Production**

```bash
# Vérifier que les anciens mockups ont une valeur par défaut
SELECT COUNT(*) FROM products WHERE isReadyProduct = false AND genre IS NULL;

# Mettre à jour si nécessaire
UPDATE products SET genre = 'unisexe' WHERE isReadyProduct = false AND genre IS NULL;
```

---

**Note** : Ce guide se concentre spécifiquement sur l'endpoint POST pour les mockups. Assurez-vous que votre backend utilise la même logique pour les autres endpoints (GET, PATCH, DELETE) des mockups. 

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation spécifique du champ `genre` dans l'endpoint POST pour créer des mockups. Le champ permet de catégoriser les mockups selon leur public cible.

## 🎯 Objectif

Modifier l'endpoint `POST /mockups` (ou `POST /products` avec `isReadyProduct: false`) pour accepter et traiter le champ `genre` :
- **homme** : Mockups destinés aux hommes
- **femme** : Mockups destinés aux femmes  
- **bébé** : Mockups destinés aux bébés/enfants
- **unisexe** : Mockups pour tous les genres (valeur par défaut)

## 🔧 Modifications Backend Spécifiques

### 1. **Modèle de Données - Migration**

```sql
-- Migration pour ajouter le champ genre à la table products/mockups
ALTER TABLE products ADD COLUMN genre VARCHAR(10) DEFAULT 'unisexe';

-- Index pour optimiser les requêtes par genre
CREATE INDEX idx_products_genre ON products(genre);

-- Contrainte pour limiter les valeurs possibles
ALTER TABLE products ADD CONSTRAINT chk_products_genre 
CHECK (genre IN ('homme', 'femme', 'bébé', 'unisexe'));

-- Mettre à jour les produits existants
UPDATE products SET genre = 'unisexe' WHERE genre IS NULL;
```

### 2. **DTO pour l'Endpoint POST Mockup**

```typescript
// dto/create-mockup.dto.ts
export interface CreateMockupDto {
  name: string;
  description: string;
  price: number;
  status?: 'draft' | 'published';
  isReadyProduct: false; // Toujours false pour les mockups
  genre?: 'homme' | 'femme' | 'bébé' | 'unisexe'; // ← NOUVEAU CHAMP
  
  // Champs existants
  categories?: string[];
  sizes?: string[];
  colorVariations?: CreateColorVariationDto[];
}

// DTO pour la réponse
export interface MockupResponseDto {
  id: number;
  name: string;
  description: string;
  price: number;
  status: 'draft' | 'published';
  isReadyProduct: false;
  genre: 'homme' | 'femme' | 'bébé' | 'unisexe'; // ← NOUVEAU CHAMP
  
  categories: Category[];
  colorVariations: ColorVariation[];
  sizes: Size[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. **Validation pour l'Endpoint POST**

```typescript
// validation/create-mockup.validation.ts
import Joi from 'joi';

export const createMockupSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().required().min(1),
  price: Joi.number().required().min(0),
  status: Joi.string().valid('draft', 'published').default('draft'),
  isReadyProduct: Joi.boolean().valid(false).required(), // Doit être false pour les mockups
  genre: Joi.string().valid('homme', 'femme', 'bébé', 'unisexe').default('unisexe'), // ← NOUVEAU CHAMP
  
  // Champs existants
  categories: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  colorVariations: Joi.array().items(colorVariationSchema)
});

// Validation pour la mise à jour
export const updateMockupSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().min(1),
  price: Joi.number().min(0),
  status: Joi.string().valid('draft', 'published'),
  genre: Joi.string().valid('homme', 'femme', 'bébé', 'unisexe'), // ← NOUVEAU CHAMP
  
  categories: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  colorVariations: Joi.array().items(colorVariationSchema)
});
```

### 4. **Service Mockup avec Genre**

```typescript
// services/mockup.service.ts
export class MockupService {
  constructor(private readonly productRepository: ProductRepository) {}

  // Créer un mockup avec genre
  async createMockup(createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    // Validation spécifique pour les mockups
    if (createMockupDto.isReadyProduct !== false) {
      throw new BadRequestException('Les mockups doivent avoir isReadyProduct: false');
    }

    const mockup = await this.productRepository.create({
      ...createMockupDto,
      genre: createMockupDto.genre || 'unisexe', // ← Valeur par défaut
      isReadyProduct: false, // Forcer à false pour les mockups
    });
    
    return this.mapToResponseDto(mockup);
  }

  // Mettre à jour un mockup avec genre
  async updateMockup(id: number, updateMockupDto: UpdateMockupDto): Promise<MockupResponseDto> {
    const mockup = await this.productRepository.update(id, {
      ...updateMockupDto,
      // Le genre peut être mis à jour
    });
    
    return this.mapToResponseDto(mockup);
  }

  // Récupérer les mockups par genre
  async getMockupsByGenre(genre: 'homme' | 'femme' | 'bébé' | 'unisexe'): Promise<MockupResponseDto[]> {
    const mockups = await this.productRepository.findMany({
      where: { 
        genre,
        isReadyProduct: false // Seulement les mockups
      },
      include: {
        categories: true,
        colorVariations: {
          include: {
            images: true
          }
        },
        sizes: true
      }
    });
    
    return mockups.map(mockup => this.mapToResponseDto(mockup));
  }

  // Récupérer tous les genres disponibles pour les mockups
  async getAvailableMockupGenres(): Promise<string[]> {
    const genres = await this.productRepository.findMany({
      where: { isReadyProduct: false }, // Seulement les mockups
      select: { genre: true },
      distinct: ['genre']
    });
    
    return genres.map(g => g.genre);
  }

  // Méthode utilitaire pour mapper vers la réponse
  private mapToResponseDto(mockup: any): MockupResponseDto {
    return {
      id: mockup.id,
      name: mockup.name,
      description: mockup.description,
      price: mockup.price,
      status: mockup.status,
      isReadyProduct: false,
      genre: mockup.genre, // ← NOUVEAU CHAMP
      categories: mockup.categories || [],
      colorVariations: mockup.colorVariations || [],
      sizes: mockup.sizes || [],
      createdAt: mockup.createdAt,
      updatedAt: mockup.updatedAt
    };
  }
}
```

### 5. **Contrôleur Mockup avec Genre**

```typescript
// controllers/mockup.controller.ts
export class MockupController {
  constructor(private readonly mockupService: MockupService) {}

  // POST /mockups - Créer un mockup avec genre
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createMockup(@Body() createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    return await this.mockupService.createMockup(createMockupDto);
  }

  // PATCH /mockups/:id - Mettre à jour un mockup avec genre
  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateMockup(
    @Param('id') id: number,
    @Body() updateMockupDto: UpdateMockupDto
  ): Promise<MockupResponseDto> {
    return await this.mockupService.updateMockup(id, updateMockupDto);
  }

  // GET /mockups/by-genre/:genre - Récupérer les mockups par genre
  @Get('by-genre/:genre')
  async getMockupsByGenre(
    @Param('genre') genre: 'homme' | 'femme' | 'bébé' | 'unisexe'
  ): Promise<MockupResponseDto[]> {
    return await this.mockupService.getMockupsByGenre(genre);
  }

  // GET /mockups/genres - Récupérer tous les genres disponibles
  @Get('genres')
  async getAvailableMockupGenres(): Promise<string[]> {
    return await this.mockupService.getAvailableMockupGenres();
  }

  // GET /mockups - Récupérer tous les mockups avec filtre par genre
  @Get()
  async getAllMockups(
    @Query('genre') genre?: 'homme' | 'femme' | 'bébé' | 'unisexe'
  ): Promise<MockupResponseDto[]> {
    let whereClause: any = { isReadyProduct: false }; // Seulement les mockups
    
    if (genre) {
      whereClause.genre = genre;
    }
    
    const mockups = await this.productRepository.findMany({
      where: whereClause,
      include: {
        categories: true,
        colorVariations: {
          include: {
            images: true
          }
        },
        sizes: true
      }
    });
    
    return mockups.map(mockup => this.mockupService.mapToResponseDto(mockup));
  }
}
```

### 6. **Routes Mockup**

```typescript
// routes/mockup.routes.ts
export const mockupRoutes = {
  // Créer un mockup avec genre
  'POST /mockups': 'MockupController.createMockup',
  
  // Mettre à jour un mockup avec genre
  'PATCH /mockups/:id': 'MockupController.updateMockup',
  
  // Récupérer les mockups par genre
  'GET /mockups/by-genre/:genre': 'MockupController.getMockupsByGenre',
  
  // Récupérer tous les genres disponibles
  'GET /mockups/genres': 'MockupController.getAvailableMockupGenres',
  
  // Récupérer tous les mockups avec filtre
  'GET /mockups': 'MockupController.getAllMockups',
};
```

## 🔄 Exemples d'Utilisation

### 1. **Créer un Mockup pour Homme**

```bash
POST /api/mockups
Content-Type: application/json

{
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "homme",
  "categories": ["Vêtements", "Homme"],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [
    {
      "name": "Noir",
      "colorCode": "#000000",
      "images": [
        {
          "file": "image-file",
          "view": "Front"
        }
      ]
    }
  ]
}
```

**Réponse attendue :**
```json
{
  "id": 123,
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "homme",
  "categories": [...],
  "colorVariations": [...],
  "sizes": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. **Créer un Mockup pour Femme**

```bash
POST /api/mockups
Content-Type: application/json

{
  "name": "T-shirt Femme Élégant",
  "description": "T-shirt élégant pour femme",
  "price": 6000,
  "status": "published",
  "isReadyProduct": false,
  "genre": "femme",
  "categories": ["Vêtements", "Femme"],
  "sizes": ["XS", "S", "M", "L"],
  "colorVariations": [...]
}
```

### 3. **Créer un Mockup Unisexe (valeur par défaut)**

```bash
POST /api/mockups
Content-Type: application/json

{
  "name": "T-shirt Unisexe Basic",
  "description": "T-shirt basique pour tous",
  "price": 4500,
  "status": "draft",
  "isReadyProduct": false,
  "categories": ["Vêtements", "Unisexe"],
  "sizes": ["S", "M", "L"],
  "colorVariations": [...]
}
```

**Note :** Le champ `genre` sera automatiquement défini à `"unisexe"` car non spécifié.

## 🧪 Tests pour l'Endpoint POST

```typescript
// tests/mockup.test.ts
describe('POST /mockups - Genre Field', () => {
  it('should create mockup with homme genre', async () => {
    const mockupData = {
      name: 'T-shirt Homme',
      description: 'T-shirt pour homme',
      price: 5000,
      isReadyProduct: false,
      genre: 'homme' as const,
      categories: ['Vêtements'],
      sizes: ['S', 'M', 'L'],
      colorVariations: []
    };

    const response = await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(201);

    expect(response.body.genre).toBe('homme');
    expect(response.body.isReadyProduct).toBe(false);
  });

  it('should default to unisexe when genre not provided', async () => {
    const mockupData = {
      name: 'T-shirt Unisexe',
      description: 'T-shirt unisexe',
      price: 5000,
      isReadyProduct: false,
      categories: ['Vêtements'],
      sizes: ['S', 'M', 'L'],
      colorVariations: []
    };

    const response = await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(201);

    expect(response.body.genre).toBe('unisexe');
  });

  it('should reject invalid genre values', async () => {
    const mockupData = {
      name: 'T-shirt Test',
      description: 'Test',
      price: 5000,
      isReadyProduct: false,
      genre: 'invalid' as any,
      categories: ['Vêtements'],
      sizes: ['S'],
      colorVariations: []
    };

    await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(400);
  });

  it('should reject if isReadyProduct is not false', async () => {
    const mockupData = {
      name: 'T-shirt Test',
      description: 'Test',
      price: 5000,
      isReadyProduct: true, // Doit être false pour les mockups
      genre: 'homme',
      categories: ['Vêtements'],
      sizes: ['S'],
      colorVariations: []
    };

    await request(app)
      .post('/api/mockups')
      .send(mockupData)
      .expect(400);
  });
});
```

## 🔍 Validation et Gestion d'Erreurs

```typescript
// middleware/validation.middleware.ts
export const validateMockupGenre = (req: Request, res: Response, next: NextFunction) => {
  const { genre } = req.body;
  
  if (genre && !['homme', 'femme', 'bébé', 'unisexe'].includes(genre)) {
    return res.status(400).json({
      error: 'Invalid genre value',
      message: 'Genre must be one of: homme, femme, bébé, unisexe',
      received: genre
    });
  }
  
  next();
};

// middleware/mockup.middleware.ts
export const validateMockupData = (req: Request, res: Response, next: NextFunction) => {
  const { isReadyProduct } = req.body;
  
  if (isReadyProduct !== false) {
    return res.status(400).json({
      error: 'Invalid isReadyProduct value',
      message: 'Mockups must have isReadyProduct: false',
      received: isReadyProduct
    });
  }
  
  next();
};
```

## 📊 Logs et Monitoring

```typescript
// services/mockup.service.ts
async createMockup(createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
  // Log avant création
  logger.info('Creating mockup', {
    name: createMockupDto.name,
    genre: createMockupDto.genre || 'unisexe',
    isReadyProduct: createMockupDto.isReadyProduct
  });

  const mockup = await this.productRepository.create({
    ...createMockupDto,
    genre: createMockupDto.genre || 'unisexe',
    isReadyProduct: false,
  });
  
  // Log après création
  logger.info('Mockup created successfully', {
    mockupId: mockup.id,
    genre: mockup.genre,
    name: mockup.name
  });
  
  return this.mapToResponseDto(mockup);
}
```

## ✅ Checklist de Validation

- [ ] Migration de base de données exécutée
- [ ] DTO CreateMockupDto mis à jour avec le champ genre
- [ ] Validation Joi/class-validator ajoutée
- [ ] Service MockupService mis à jour
- [ ] Contrôleur MockupController mis à jour
- [ ] Routes mockup ajoutées
- [ ] Tests unitaires écrits et passants
- [ ] Tests d'intégration écrits et passants
- [ ] Validation des erreurs implémentée
- [ ] Logs ajoutés pour le monitoring
- [ ] Documentation API mise à jour

## 🚀 Déploiement

### 1. **Migration**

```bash
# Exécuter la migration
npm run migrate:up

# Vérifier la migration
npm run migrate:status
```

### 2. **Tests**

```bash
# Tests spécifiques pour les mockups avec genre
npm run test:mockup

# Tests de régression
npm run test
```

### 3. **Validation en Production**

```bash
# Vérifier que les anciens mockups ont une valeur par défaut
SELECT COUNT(*) FROM products WHERE isReadyProduct = false AND genre IS NULL;

# Mettre à jour si nécessaire
UPDATE products SET genre = 'unisexe' WHERE isReadyProduct = false AND genre IS NULL;
```

---

**Note** : Ce guide se concentre spécifiquement sur l'endpoint POST pour les mockups. Assurez-vous que votre backend utilise la même logique pour les autres endpoints (GET, PATCH, DELETE) des mockups. 