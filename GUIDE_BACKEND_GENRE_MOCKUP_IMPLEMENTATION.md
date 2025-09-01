# 🎯 Guide Backend - Implémentation du Champ Genre pour les Mockups

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation du champ `genre` dans le backend pour l'ajout de mockups. Le champ permet de spécifier si un mockup est destiné aux hommes, femmes, bébés ou est unisexe.

## 🎯 Objectif

Ajouter un champ `genre` au modèle de produit pour catégoriser les mockups selon leur public cible :
- **homme** : Mockups destinés aux hommes
- **femme** : Mockups destinés aux femmes  
- **bébé** : Mockups destinés aux bébés/enfants
- **unisexe** : Mockups pour tous les genres

## 🔧 Modifications Backend Requises

### 1. **Modèle de Données (Database Schema)**

#### A. Migration de Base de Données

```sql
-- Migration pour ajouter le champ genre à la table products
ALTER TABLE products ADD COLUMN genre VARCHAR(10) DEFAULT 'unisexe';

-- Index pour optimiser les requêtes par genre
CREATE INDEX idx_products_genre ON products(genre);

-- Contrainte pour limiter les valeurs possibles
ALTER TABLE products ADD CONSTRAINT chk_products_genre 
CHECK (genre IN ('homme', 'femme', 'bébé', 'unisexe'));
```

#### B. Modèle Prisma (si utilisé)

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Float
  status      String   @default("draft")
  isReadyProduct Boolean @default(false)
  genre       String   @default("unisexe") // ← NOUVEAU CHAMP
  
  // Relations existantes...
  categories  Category[]
  colorVariations ColorVariation[]
  sizes       Size[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("products")
}
```

### 2. **Modèle/Entité Backend**

#### A. TypeScript Interface

```typescript
// types/product.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  status: 'draft' | 'published';
  isReadyProduct: boolean;
  genre: 'homme' | 'femme' | 'bébé' | 'unisexe'; // ← NOUVEAU CHAMP
  
  // Relations existantes
  categories: Category[];
  colorVariations: ColorVariation[];
  sizes: Size[];
  createdAt: Date;
  updatedAt: Date;
}

// DTO pour la création
export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  status?: 'draft' | 'published';
  isReadyProduct?: boolean;
  genre?: 'homme' | 'femme' | 'bébé' | 'unisexe'; // ← NOUVEAU CHAMP
  
  categories?: string[];
  sizes?: string[];
  colorVariations?: CreateColorVariationDto[];
}

// DTO pour la mise à jour
export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  status?: 'draft' | 'published';
  isReadyProduct?: boolean;
  genre?: 'homme' | 'femme' | 'bébé' | 'unisexe'; // ← NOUVEAU CHAMP
  
  categories?: string[];
  sizes?: string[];
  colorVariations?: UpdateColorVariationDto[];
}
```

#### B. Validation (Joi ou class-validator)

```typescript
// validation/product.validation.ts
import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().required().min(1),
  price: Joi.number().required().min(0),
  status: Joi.string().valid('draft', 'published').default('draft'),
  isReadyProduct: Joi.boolean().default(false),
  genre: Joi.string().valid('homme', 'femme', 'bébé', 'unisexe').default('unisexe'), // ← NOUVEAU CHAMP
  
  categories: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  colorVariations: Joi.array().items(colorVariationSchema)
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().min(1),
  price: Joi.number().min(0),
  status: Joi.string().valid('draft', 'published'),
  isReadyProduct: Joi.boolean(),
  genre: Joi.string().valid('homme', 'femme', 'bébé', 'unisexe'), // ← NOUVEAU CHAMP
  
  categories: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  colorVariations: Joi.array().items(colorVariationSchema)
});
```

### 3. **Service Backend**

#### A. Service de Produit

```typescript
// services/product.service.ts
export class ProductService {
  // Méthode de création avec genre
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const product = await this.productRepository.create({
      ...createProductDto,
      genre: createProductDto.genre || 'unisexe', // ← Valeur par défaut
    });
    
    return product;
  }

  // Méthode de mise à jour avec genre
  async updateProduct(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.update(id, {
      ...updateProductDto,
      // Le genre peut être mis à jour
    });
    
    return product;
  }

  // Méthode pour récupérer par genre
  async getProductsByGenre(genre: 'homme' | 'femme' | 'bébé' | 'unisexe'): Promise<Product[]> {
    return await this.productRepository.findMany({
      where: { genre },
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
  }

  // Méthode pour récupérer tous les genres disponibles
  async getAvailableGenres(): Promise<string[]> {
    const genres = await this.productRepository.findMany({
      select: { genre: true },
      distinct: ['genre']
    });
    
    return genres.map(g => g.genre);
  }
}
```

### 4. **Contrôleur Backend**

#### A. Contrôleur de Produit

```typescript
// controllers/product.controller.ts
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Créer un produit avec genre
  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return await this.productService.createProduct(createProductDto);
  }

  // Mettre à jour un produit avec genre
  @Patch(':id')
  async updateProduct(
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<Product> {
    return await this.productService.updateProduct(id, updateProductDto);
  }

  // Récupérer les produits par genre
  @Get('by-genre/:genre')
  async getProductsByGenre(
    @Param('genre') genre: 'homme' | 'femme' | 'bébé' | 'unisexe'
  ): Promise<Product[]> {
    return await this.productService.getProductsByGenre(genre);
  }

  // Récupérer tous les genres disponibles
  @Get('genres')
  async getAvailableGenres(): Promise<string[]> {
    return await this.productService.getAvailableGenres();
  }

  // Récupérer tous les produits avec filtre par genre
  @Get()
  async getAllProducts(
    @Query('genre') genre?: 'homme' | 'femme' | 'bébé' | 'unisexe',
    @Query('isReadyProduct') isReadyProduct?: boolean
  ): Promise<Product[]> {
    let whereClause: any = {};
    
    if (genre) {
      whereClause.genre = genre;
    }
    
    if (isReadyProduct !== undefined) {
      whereClause.isReadyProduct = isReadyProduct;
    }
    
    return await this.productService.findMany(whereClause);
  }
}
```

### 5. **Routes Backend**

```typescript
// routes/product.routes.ts
export const productRoutes = {
  // Routes existantes...
  'POST /products': 'ProductController.createProduct',
  'PATCH /products/:id': 'ProductController.updateProduct',
  'GET /products': 'ProductController.getAllProducts',
  
  // Nouvelles routes pour le genre
  'GET /products/by-genre/:genre': 'ProductController.getProductsByGenre',
  'GET /products/genres': 'ProductController.getAvailableGenres',
};
```

### 6. **Tests Backend**

```typescript
// tests/product.test.ts
describe('Product Genre', () => {
  it('should create product with genre', async () => {
    const productData = {
      name: 'T-shirt Homme',
      description: 'T-shirt pour homme',
      price: 5000,
      genre: 'homme' as const,
      isReadyProduct: false
    };

    const product = await productService.createProduct(productData);
    
    expect(product.genre).toBe('homme');
  });

  it('should default to unisexe when genre not provided', async () => {
    const productData = {
      name: 'T-shirt Unisexe',
      description: 'T-shirt unisexe',
      price: 5000,
      isReadyProduct: false
    };

    const product = await productService.createProduct(productData);
    
    expect(product.genre).toBe('unisexe');
  });

  it('should filter products by genre', async () => {
    const hommeProducts = await productService.getProductsByGenre('homme');
    
    expect(hommeProducts.every(p => p.genre === 'homme')).toBe(true);
  });

  it('should return available genres', async () => {
    const genres = await productService.getAvailableGenres();
    
    expect(genres).toContain('homme');
    expect(genres).toContain('femme');
    expect(genres).toContain('bébé');
    expect(genres).toContain('unisexe');
  });
});
```

## 🔄 Intégration Frontend-Backend

### 1. **API Endpoints à Implémenter**

```typescript
// Endpoints nécessaires pour le frontend
POST /api/products
- Body: { name, description, price, genre, isReadyProduct, ... }
- Response: Product avec genre

GET /api/products?genre=homme&isReadyProduct=false
- Query params: genre, isReadyProduct
- Response: Product[] filtrés

GET /api/products/by-genre/:genre
- Params: genre (homme|femme|bébé|unisexe)
- Response: Product[] du genre spécifié

GET /api/products/genres
- Response: string[] des genres disponibles

PATCH /api/products/:id
- Body: { genre, ... }
- Response: Product mis à jour
```

### 2. **Exemple de Requête Frontend**

```typescript
// Exemple d'utilisation côté frontend
const createMockup = async (productData: CreateProductDto) => {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'T-shirt Homme Premium',
      description: 'T-shirt de qualité pour homme',
      price: 8000,
      genre: 'homme', // ← NOUVEAU CHAMP
      isReadyProduct: false,
      categories: ['Vêtements', 'Homme'],
      sizes: ['S', 'M', 'L', 'XL'],
      colorVariations: [...]
    })
  });
  
  return await response.json();
};
```

## 🎯 Cas d'Usage

### 1. **Création de Mockup avec Genre**

```typescript
// Exemple de création d'un mockup pour homme
const mockupData = {
  name: 'T-shirt Homme Classic',
  description: 'T-shirt basique pour homme',
  price: 5000,
  genre: 'homme', // ← Spécifier le genre
  isReadyProduct: false, // Mockup
  categories: ['Vêtements', 'Homme'],
  sizes: ['S', 'M', 'L', 'XL'],
  colorVariations: [
    {
      name: 'Noir',
      colorCode: '#000000',
      images: [...]
    }
  ]
};
```

### 2. **Filtrage par Genre**

```typescript
// Récupérer tous les mockups pour homme
const hommeMockups = await fetch('/api/products?genre=homme&isReadyProduct=false');

// Récupérer tous les mockups pour femme
const femmeMockups = await fetch('/api/products?genre=femme&isReadyProduct=false');

// Récupérer tous les mockups unisexe
const unisexeMockups = await fetch('/api/products?genre=unisexe&isReadyProduct=false');
```

### 3. **Interface d'Administration**

```typescript
// Interface pour filtrer les produits par genre
const ProductFilter = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  
  const filteredProducts = products.filter(product => {
    if (selectedGenre === 'all') return true;
    return product.genre === selectedGenre;
  });
  
  return (
    <div>
      <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
        <option value="all">Tous les genres</option>
        <option value="homme">Homme</option>
        <option value="femme">Femme</option>
        <option value="bébé">Bébé</option>
        <option value="unisexe">Unisexe</option>
      </select>
      
      {/* Affichage des produits filtrés */}
    </div>
  );
};
```

## 🚀 Déploiement

### 1. **Migration de Base de Données**

```bash
# Exécuter la migration pour ajouter le champ genre
npm run migrate:up

# Vérifier que la migration s'est bien passée
npm run migrate:status
```

### 2. **Tests de Régression**

```bash
# Lancer les tests pour s'assurer que rien ne casse
npm run test

# Tests spécifiques pour le genre
npm run test:genre
```

### 3. **Validation en Production**

```bash
# Vérifier que les anciens produits ont une valeur par défaut
SELECT COUNT(*) FROM products WHERE genre IS NULL;

# Mettre à jour les anciens produits si nécessaire
UPDATE products SET genre = 'unisexe' WHERE genre IS NULL;
```

## 📊 Monitoring et Analytics

### 1. **Métriques à Surveiller**

```typescript
// Métriques pour surveiller l'utilisation du genre
const genreMetrics = {
  totalProducts: await productService.count(),
  productsByGenre: {
    homme: await productService.count({ where: { genre: 'homme' } }),
    femme: await productService.count({ where: { genre: 'femme' } }),
    bébé: await productService.count({ where: { genre: 'bébé' } }),
    unisexe: await productService.count({ where: { genre: 'unisexe' } })
  }
};
```

### 2. **Logs à Ajouter**

```typescript
// Logs pour tracer l'utilisation du genre
logger.info('Product created', {
  productId: product.id,
  genre: product.genre,
  isReadyProduct: product.isReadyProduct
});

logger.info('Products filtered by genre', {
  genre: requestedGenre,
  count: products.length
});
```

## ✅ Checklist de Validation

- [ ] Migration de base de données exécutée
- [ ] Modèle/Entité mis à jour avec le champ genre
- [ ] Validation ajoutée (Joi/class-validator)
- [ ] Service backend mis à jour
- [ ] Contrôleur backend mis à jour
- [ ] Routes backend ajoutées
- [ ] Tests unitaires écrits et passants
- [ ] Tests d'intégration écrits et passants
- [ ] Documentation API mise à jour
- [ ] Frontend intégré et testé
- [ ] Déploiement en production réussi
- [ ] Monitoring configuré

## 🔗 Ressources Supplémentaires

- **Documentation API** : Mettre à jour la documentation Swagger/OpenAPI
- **Tests E2E** : Ajouter des tests end-to-end pour les flux complets
- **Performance** : Vérifier l'impact sur les performances des requêtes
- **Sécurité** : Valider que le champ genre ne pose pas de problèmes de sécurité

---

**Note** : Ce guide suppose une architecture backend moderne avec TypeScript. Adaptez les exemples selon votre stack technique spécifique (Node.js/Express, NestJS, Fastify, etc.). 