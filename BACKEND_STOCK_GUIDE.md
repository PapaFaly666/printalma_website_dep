# Guide Backend - Affichage Stock Disponible et Stock Total

## Vue d'ensemble

Ce guide explique comment le backend doit formater les données pour que le frontend puisse afficher correctement:
- **Stock disponible** par variation (taille/modèle)
- **Stock total** par produit

## Structure de données requise

### Format de réponse GET /products

Le backend doit retourner les produits avec les stocks dans ce format:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-shirt personnalisé",
      "sizes": ["S", "M", "L", "XL"],  // ← Variations de la catégorie
      "colorVariations": [
        {
          "id": 1,
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "images": [...],
          "stocks": [                   // ← IMPORTANT: Array d'objets
            {
              "sizeName": "S",
              "stock": 10
            },
            {
              "sizeName": "M",
              "stock": 25
            },
            {
              "sizeName": "L",
              "stock": 30
            },
            {
              "sizeName": "XL",
              "stock": 15
            }
          ]
        },
        {
          "id": 2,
          "name": "Noir",
          "colorCode": "#000000",
          "images": [...],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 8
            },
            {
              "sizeName": "M",
              "stock": 20
            },
            {
              "sizeName": "L",
              "stock": 25
            },
            {
              "sizeName": "XL",
              "stock": 12
            }
          ]
        }
      ]
    }
  ]
}
```

## Implémentation Backend (NestJS/Prisma)

### 1. Modèle Prisma

Assurez-vous d'avoir ces relations:

```prisma
model Product {
  id                Int                @id @default(autoincrement())
  name              String
  sizes             String[]           // Array de strings: ["S", "M", "L", "XL"]
  colorVariations   ColorVariation[]
  stocks            ProductStock[]     // Relation avec la table stocks
  // ... autres champs
}

model ColorVariation {
  id              Int      @id @default(autoincrement())
  productId       Int
  name            String
  colorCode       String
  images          ColorImage[]

  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model ProductStock {
  id          Int      @id @default(autoincrement())
  productId   Int
  colorId     Int      // ID de la variation de couleur
  sizeName    String   // "S", "M", "L", "iPhone 12", etc.
  stock       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, colorId, sizeName])
  @@index([productId])
  @@index([colorId])
}
```

### 2. Service - Méthode getProducts()

```typescript
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getProducts() {
    // 1. Récupérer les produits avec leurs relations
    const products = await this.prisma.product.findMany({
      include: {
        colorVariations: {
          include: {
            images: true
          }
        },
        stocks: true  // ← IMPORTANT: Inclure les stocks
      }
    });

    // 2. Formater les données pour le frontend
    return {
      success: true,
      data: products.map(product => ({
        id: product.id,
        name: product.name,
        sizes: product.sizes,  // ← Array de strings ["S", "M", "L"]

        // ... autres champs du produit

        colorVariations: product.colorVariations.map(color => ({
          id: color.id,
          name: color.name,
          colorCode: color.colorCode,
          images: color.images.map(img => ({
            id: img.id,
            url: img.url,
            view: img.view
          })),

          // ← IMPORTANT: Formatter les stocks comme array d'objets
          stocks: product.stocks
            .filter(s => s.colorId === color.id)
            .map(s => ({
              sizeName: s.sizeName,
              stock: s.stock
            }))
        }))
      }))
    };
  }
}
```

### 3. Point clé - Format des stocks

**❌ NE PAS FAIRE (objet):**
```typescript
// ❌ Mauvais format
stocks: product.stocks
  .filter(s => s.colorId === color.id)
  .reduce((acc, s) => {
    acc[s.sizeName] = s.stock;
    return acc;
  }, {})

// Résultat: { "M": 25, "L": 30 }  // ❌ Objet
```

**✅ FAIRE (array):**
```typescript
// ✅ Bon format
stocks: product.stocks
  .filter(s => s.colorId === color.id)
  .map(s => ({
    sizeName: s.sizeName,
    stock: s.stock
  }))

// Résultat: [                      // ✅ Array d'objets
//   { sizeName: "M", stock: 25 },
//   { sizeName: "L", stock: 30 }
// ]
```

## Calcul côté Frontend

### Stock disponible (par variation)

Le frontend affiche chaque variation avec son stock:

```
Couleur: Blanc
┌──────────┬─────────────────┐
│ Taille   │ Stock disponible│
├──────────┼─────────────────┤
│ M        │ 25              │  ← Depuis stocks[0].stock
│ L        │ 30              │  ← Depuis stocks[1].stock
│ XL       │ 15              │  ← Depuis stocks[2].stock
└──────────┴─────────────────┘
```

### Stock total (par produit)

Le frontend calcule automatiquement:

```typescript
// Calcul automatique dans stockService.ts
const totalStock = colorVariations.reduce((total, color) => {
  const colorTotal = color.sizes.reduce((sum, size) => sum + size.stock, 0);
  return total + colorTotal;
}, 0);

// Exemple:
// Blanc: M(25) + L(30) + XL(15) = 70
// Noir:  M(20) + L(25) + XL(12) = 57
// Total produit: 70 + 57 = 127
```

## Exemples concrets

### Exemple 1: T-shirt avec 2 couleurs

**Request:** `GET /products`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-shirt personnalisé",
      "sizes": ["S", "M", "L", "XL", "XXL"],
      "colorVariations": [
        {
          "id": 1,
          "name": "Blanc",
          "stocks": [
            { "sizeName": "S", "stock": 10 },
            { "sizeName": "M", "stock": 25 },
            { "sizeName": "L", "stock": 30 },
            { "sizeName": "XL", "stock": 15 },
            { "sizeName": "XXL", "stock": 5 }
          ]
        },
        {
          "id": 2,
          "name": "Noir",
          "stocks": [
            { "sizeName": "S", "stock": 8 },
            { "sizeName": "M", "stock": 20 },
            { "sizeName": "L", "stock": 25 },
            { "sizeName": "XL", "stock": 12 },
            { "sizeName": "XXL", "stock": 3 }
          ]
        }
      ]
    }
  ]
}
```

**Résultat Frontend:**
- Stock disponible Blanc M: **25**
- Stock disponible Noir M: **20**
- Stock total produit: **153** (85 + 68)

### Exemple 2: Coque iPhone avec 1 couleur

**Request:** `GET /products`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Coque iPhone personnalisée",
      "sizes": ["iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15"],
      "colorVariations": [
        {
          "id": 3,
          "name": "Transparent",
          "stocks": [
            { "sizeName": "iPhone 12", "stock": 15 },
            { "sizeName": "iPhone 13", "stock": 20 },
            { "sizeName": "iPhone 14", "stock": 18 },
            { "sizeName": "iPhone 15", "stock": 25 }
          ]
        }
      ]
    }
  ]
}
```

**Résultat Frontend:**
- Stock disponible iPhone 13: **20**
- Stock total produit: **78** (15 + 20 + 18 + 25)

### Exemple 3: Produit sans stock

**Request:** `GET /products`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Mug personnalisé",
      "sizes": ["300ml", "400ml"],
      "colorVariations": [
        {
          "id": 4,
          "name": "Blanc",
          "stocks": []  // ← Array vide si aucun stock
        }
      ]
    }
  ]
}
```

**Résultat Frontend:**
- Stock disponible 300ml: **0** (par défaut)
- Stock disponible 400ml: **0** (par défaut)
- Stock total produit: **0**

## Gestion des cas particuliers

### Cas 1: Variation sans stock défini

Si une variation (ex: "XL") existe dans `product.sizes` mais n'a pas de stock en DB:

**Backend retourne:**
```json
{
  "sizes": ["S", "M", "L", "XL"],
  "stocks": [
    { "sizeName": "S", "stock": 10 },
    { "sizeName": "M", "stock": 25 }
    // ← Pas de stock pour L et XL
  ]
}
```

**Frontend affiche:**
- Stock S: **10** ✅
- Stock M: **25** ✅
- Stock L: **0** ✅ (par défaut)
- Stock XL: **0** ✅ (par défaut)

### Cas 2: Stock en DB sans variation correspondante

Si un stock existe en DB mais la variation n'est plus dans `product.sizes`:

**Backend:**
```sql
-- Table ProductStock contient:
-- productId=1, colorId=1, sizeName="XXL", stock=5

-- Mais product.sizes = ["S", "M", "L", "XL"]  (pas de "XXL")
```

**Comportement:**
- Le frontend n'affiche que les variations dans `product.sizes`
- Le stock "XXL" existe en DB mais n'est pas affiché
- C'est normal: l'admin a retiré cette variation

**Recommandation:** Nettoyer les stocks orphelins périodiquement:

```typescript
// Script de nettoyage (à exécuter périodiquement)
async cleanOrphanStocks() {
  const products = await this.prisma.product.findMany({
    include: { stocks: true }
  });

  for (const product of products) {
    const validSizes = product.sizes;
    const orphanStocks = product.stocks.filter(
      s => !validSizes.includes(s.sizeName)
    );

    if (orphanStocks.length > 0) {
      await this.prisma.productStock.deleteMany({
        where: {
          id: { in: orphanStocks.map(s => s.id) }
        }
      });
    }
  }
}
```

### Cas 3: Plusieurs couleurs même produit

Le backend DOIT filtrer les stocks par `colorId`:

```typescript
// ✅ CORRECT
stocks: product.stocks
  .filter(s => s.colorId === color.id)  // ← Filtrer par couleur
  .map(s => ({ sizeName: s.sizeName, stock: s.stock }))

// ❌ INCORRECT - Retourne tous les stocks sans filtrer
stocks: product.stocks
  .map(s => ({ sizeName: s.sizeName, stock: s.stock }))
```

**Exemple:**
```
Product #1 "T-shirt"
├─ Color #1 "Blanc"
│  └─ Stocks: M(25), L(30)  ← Filtré par colorId=1
│
└─ Color #2 "Noir"
   └─ Stocks: M(20), L(25)  ← Filtré par colorId=2
```

## Vérification de l'implémentation

### Checklist Backend

- [ ] Le modèle `ProductStock` existe avec les champs `productId`, `colorId`, `sizeName`, `stock`
- [ ] Contrainte unique sur `(productId, colorId, sizeName)`
- [ ] `Product.sizes` est un array de strings
- [ ] `GET /products` inclut la relation `stocks`
- [ ] Les stocks sont filtrés par `colorId`
- [ ] Les stocks sont retournés comme **array d'objets** (pas objet)
- [ ] Format: `[{ sizeName: "M", stock: 25 }]`
- [ ] Les stocks vides retournent array vide `[]`

### Test avec Postman/Thunder Client

**Request:**
```
GET http://localhost:3004/products
```

**Vérifier la réponse:**
```json
{
  "data": [
    {
      "colorVariations": [
        {
          "stocks": [               // ← Doit être un ARRAY
            {
              "sizeName": "M",      // ← Doit avoir sizeName
              "stock": 25           // ← Doit avoir stock (nombre)
            }
          ]
        }
      ]
    }
  ]
}
```

### Test Frontend

1. Ouvrir `http://localhost:5174/admin/stock-management`
2. Vérifier dans le tableau principal:
   - **Stock total** ≠ 0 ✅
3. Cliquer sur un produit
4. Vérifier dans le modal:
   - **Stock disponible** pour chaque variation ≠ 0 ✅

### Logs de debug Frontend

Ouvrir la console (F12) et chercher:

```
✅ Bon format:
🔍 [DEBUG] Color 1 stocks array: [{ sizeName: "M", stock: 25 }, ...]
🔍 [DEBUG] Color 1 stocks object: { "M": 25, "L": 30 }
🔍 [DEBUG] Color 1 total: 125

❌ Mauvais format:
🔍 [DEBUG] Color 1 stocks array: { "M": 25, "L": 30 }  // ← Objet au lieu d'array
🔍 [DEBUG] Color 1 stocks object: NaN
🔍 [DEBUG] Color 1 total: 0
```

## Points d'attention

### ⚠️ Performance

Pour de nombreux produits (>1000), optimiser avec:

```typescript
// Option 1: Pagination
async getProducts(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      skip,
      take: limit,
      include: { colorVariations: { include: { images: true } }, stocks: true }
    }),
    this.prisma.product.count()
  ]);

  return {
    success: true,
    data: this.formatProducts(products),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// Option 2: Lazy loading des stocks
async getProducts() {
  const products = await this.prisma.product.findMany({
    include: { colorVariations: { include: { images: true } } }
    // ← Ne pas inclure stocks ici
  });

  // Retourner sans stocks, le frontend chargera stocks à la demande
  return { success: true, data: products };
}

async getProductStocks(productId: number) {
  const stocks = await this.prisma.productStock.findMany({
    where: { productId }
  });

  return { success: true, data: stocks };
}
```

### ⚠️ Sécurité

```typescript
// Ajouter des guards pour protéger les endpoints
@Get('products')
@UseGuards(JwtAuthGuard)  // ← Authentification requise
async getProducts() {
  // ...
}

@Post('products/:id/stocks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'VENDEUR')  // ← Seulement admin/vendeur
async updateStocks(@Param('id') id: number, @Body() dto: UpdateStocksDto) {
  // ...
}
```

### ⚠️ Validation

```typescript
// DTOs pour valider les données
export class UpdateStocksDto {
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  stocks: StockItemDto[];
}

export class StockItemDto {
  @IsInt()
  @Min(1)
  colorId: number;

  @IsString()
  @IsNotEmpty()
  sizeName: string;

  @IsInt()
  @Min(0)  // ← Stock ne peut pas être négatif
  stock: number;
}
```

## Résumé

✅ **Format requis:** Array d'objets `[{ sizeName, stock }]`
✅ **Filtrage:** Par `colorId` pour chaque couleur
✅ **Champs obligatoires:** `sizeName` (string), `stock` (number)
✅ **Cas vide:** Retourner array vide `[]`
✅ **Relation:** `include: { stocks: true }` dans Prisma
✅ **Mapping:** `.map()` au lieu de `.reduce()`

Le frontend calculera automatiquement le **stock total** à partir des stocks individuels. Pas besoin de le calculer côté backend!
