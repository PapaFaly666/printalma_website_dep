# Guide d'implémentation Backend - Gestion des Stocks

## Vue d'ensemble

Actuellement, la gestion des stocks est **frontend-only** (localStorage). Ce document décrit comment implémenter la gestion des stocks côté backend pour permettre une persistance réelle des données.

## Architecture actuelle (Frontend)

### Structure localStorage
```typescript
// Clé: 'printalma_product_stocks'
{
  [productId: number]: {
    [colorId: number | string]: {
      [sizeId: number | string]: number // stock quantity
    }
  }
}
```

### Services Frontend
- **Fichier**: `src/services/stockService.ts`
- **Fonctions principales**:
  - `fetchProductsWithStock()`: Récupère les produits avec stocks depuis localStorage
  - `updateSizeStock()`: Met à jour le stock d'une taille
  - `rechargeStock()`: Ajoute du stock à une taille existante

### Flux actuel (Création/Édition de produit)
1. **Étape 1-4**: Informations produit, couleurs, catégories, images
2. **Étape 5**: Gestion des stocks (nouveau)
   - Affiche toutes les variations de couleur
   - Pour chaque couleur, affiche les tailles/variations sélectionnées à l'étape 3
   - Permet de définir le stock initial pour chaque combinaison couleur/taille
3. **Étape 6**: Validation et soumission
   - Les stocks sont sauvegardés dans `localStorage` après succès

## Implémentation Backend Requise

### 1. Modèle de données

#### Option A: Table séparée (Recommandé)
```prisma
model ProductStock {
  id          Int      @id @default(autoincrement())
  productId   Int
  colorId     Int
  sizeName    String   // Nom de la taille/variation (ex: "M", "iPhone 12")
  stock       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, colorId, sizeName])
  @@index([productId])
  @@index([colorId])
}
```

#### Option B: JSON dans la table Product
```prisma
model Product {
  // ... champs existants
  stocks      Json?    // Structure: { colorId: { sizeName: stock } }
}
```

**Recommandation**: Option A (table séparée) pour:
- Meilleures performances de requête
- Historique et audit possibles
- Migrations plus faciles

### 2. Endpoints API à créer

#### POST/PATCH `/products/:productId/stocks`
Créer ou mettre à jour les stocks d'un produit complet

**Body:**
```json
{
  "stocks": [
    {
      "colorId": 1,
      "sizeName": "M",
      "stock": 25
    },
    {
      "colorId": 1,
      "sizeName": "L",
      "stock": 30
    },
    {
      "colorId": 2,
      "sizeName": "M",
      "stock": 15
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stocks mis à jour avec succès",
  "data": {
    "productId": 123,
    "totalStockUpdated": 3
  }
}
```

#### GET `/products/:productId/stocks`
Récupérer tous les stocks d'un produit

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": 123,
    "stocks": [
      {
        "id": 1,
        "colorId": 1,
        "colorName": "Blanc",
        "sizeName": "M",
        "stock": 25
      },
      {
        "id": 2,
        "colorId": 1,
        "colorName": "Blanc",
        "sizeName": "L",
        "stock": 30
      }
    ]
  }
}
```

#### PATCH `/products/:productId/stocks/:stockId`
Mettre à jour un stock spécifique

**Body:**
```json
{
  "stock": 50
}
```

#### POST `/products/:productId/stocks/:stockId/recharge`
Recharger le stock (ajouter au stock existant)

**Body:**
```json
{
  "amount": 20
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stock rechargé avec succès",
  "data": {
    "previousStock": 30,
    "addedAmount": 20,
    "newStock": 50
  }
}
```

#### GET `/products` (Modifier endpoint existant)
Inclure les stocks dans la réponse des produits

**Response modifiée:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "T-shirt personnalisé",
      "colorVariations": [
        {
          "id": 1,
          "name": "Blanc",
          "stocks": [
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
            }
          ]
        }
      ]
    }
  ]
}
```

### 3. Logique Backend (NestJS/Express)

#### Controller Example (NestJS)
```typescript
@Controller('products')
export class ProductsController {

  @Post(':productId/stocks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'VENDEUR')
  async updateProductStocks(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateStocksDto: UpdateStocksDto
  ) {
    return this.productsService.updateProductStocks(productId, updateStocksDto);
  }

  @Get(':productId/stocks')
  async getProductStocks(
    @Param('productId', ParseIntPipe) productId: number
  ) {
    return this.productsService.getProductStocks(productId);
  }

  @Post(':productId/stocks/:stockId/recharge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'VENDEUR')
  async rechargeStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('stockId', ParseIntPipe) stockId: number,
    @Body() rechargeDto: RechargeStockDto
  ) {
    return this.productsService.rechargeStock(productId, stockId, rechargeDto);
  }
}
```

#### Service Example
```typescript
@Injectable()
export class ProductsService {

  async updateProductStocks(
    productId: number,
    updateStocksDto: UpdateStocksDto
  ) {
    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    // Supprimer les stocks existants et créer les nouveaux (upsert)
    const stockOperations = updateStocksDto.stocks.map(stockData =>
      this.prisma.productStock.upsert({
        where: {
          productId_colorId_sizeName: {
            productId,
            colorId: stockData.colorId,
            sizeName: stockData.sizeName
          }
        },
        update: {
          stock: stockData.stock
        },
        create: {
          productId,
          colorId: stockData.colorId,
          sizeName: stockData.sizeName,
          stock: stockData.stock
        }
      })
    );

    await this.prisma.$transaction(stockOperations);

    return {
      success: true,
      message: 'Stocks mis à jour avec succès',
      data: {
        productId,
        totalStockUpdated: updateStocksDto.stocks.length
      }
    };
  }

  async getProductStocks(productId: number) {
    const stocks = await this.prisma.productStock.findMany({
      where: { productId },
      include: {
        product: {
          include: {
            colorVariations: true
          }
        }
      }
    });

    // Enrichir avec les noms de couleur
    const enrichedStocks = stocks.map(stock => {
      const color = stock.product.colorVariations.find(c => c.id === stock.colorId);
      return {
        id: stock.id,
        colorId: stock.colorId,
        colorName: color?.name || 'Inconnu',
        sizeName: stock.sizeName,
        stock: stock.stock
      };
    });

    return {
      success: true,
      data: {
        productId,
        stocks: enrichedStocks
      }
    };
  }

  async rechargeStock(
    productId: number,
    stockId: number,
    rechargeDto: RechargeStockDto
  ) {
    const stock = await this.prisma.productStock.findFirst({
      where: {
        id: stockId,
        productId
      }
    });

    if (!stock) {
      throw new NotFoundException('Stock non trouvé');
    }

    const previousStock = stock.stock;
    const newStock = previousStock + rechargeDto.amount;

    await this.prisma.productStock.update({
      where: { id: stockId },
      data: { stock: newStock }
    });

    return {
      success: true,
      message: 'Stock rechargé avec succès',
      data: {
        previousStock,
        addedAmount: rechargeDto.amount,
        newStock
      }
    };
  }

  // Modifier la méthode existante getProducts
  async getProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        colorVariations: {
          include: {
            images: true
          }
        },
        stocks: true  // Inclure les stocks
      }
    });

    // Formater les données pour le frontend
    return products.map(product => ({
      ...product,
      colorVariations: product.colorVariations.map(color => ({
        ...color,
        stocks: product.stocks
          .filter(s => s.colorId === color.id)
          .reduce((acc, s) => {
            acc[s.sizeName] = s.stock;
            return acc;
          }, {} as Record<string, number>)
      }))
    }));
  }
}
```

#### DTOs
```typescript
// update-stocks.dto.ts
export class StockItemDto {
  @IsInt()
  colorId: number;

  @IsString()
  @IsNotEmpty()
  sizeName: string;

  @IsInt()
  @Min(0)
  stock: number;
}

export class UpdateStocksDto {
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  stocks: StockItemDto[];
}

// recharge-stock.dto.ts
export class RechargeStockDto {
  @IsInt()
  @Min(1)
  amount: number;
}
```

### 4. Modifications Frontend requises

#### Modifier `stockService.ts`
```typescript
// Remplacer les fonctions localStorage par des appels API

export const fetchProductsWithStock = async (): Promise<ProductStock[]> => {
  try {
    const response = await axios.get(`${API_BASE}/products`, {
      withCredentials: true
    });

    return response.data.data || response.data;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }
};

export const updateProductStocks = async (
  productId: number,
  stocks: { colorId: number; sizeName: string; stock: number }[]
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE}/products/${productId}/stocks`,
      { stocks },
      { withCredentials: true }
    );
  } catch (error) {
    console.error('❌ Error updating stocks:', error);
    throw error;
  }
};

export const rechargeStock = async (
  productId: number,
  stockId: number,
  amount: number
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE}/products/${productId}/stocks/${stockId}/recharge`,
      { amount },
      { withCredentials: true }
    );
  } catch (error) {
    console.error('❌ Error recharging stock:', error);
    throw error;
  }
};
```

#### Modifier `ProductFormMain.tsx` et `useProductForm.ts`
```typescript
// Dans handleSubmit (ProductFormMain.tsx) - ligne 1363
if (result.success) {
  console.log('✅ Succès ProductService:', result);

  // 📦 Sauvegarder les stocks via API au lieu de localStorage
  console.log('📦 Sauvegarde des stocks via API...');

  const stocksToSave = formData.colorVariations.flatMap((color: any) => {
    if (!color.stocks) return [];

    return Object.entries(color.stocks).map(([sizeName, stock]) => ({
      colorId: color.id,
      sizeName,
      stock: stock as number
    }));
  });

  if (stocksToSave.length > 0) {
    try {
      await updateProductStocks(result.data.id, stocksToSave);
      console.log('✅ Stocks sauvegardés avec succès');
    } catch (error) {
      console.error('❌ Erreur sauvegarde stocks:', error);
      toast.warning('Produit créé mais erreur lors de la sauvegarde des stocks');
    }
  }

  toast.success('Produit modifié avec succès');
  navigate('/admin/products');
}
```

```typescript
// Dans submitForm (useProductForm.ts) - ligne 229
if (result.success) {
  // 📦 Sauvegarder les stocks via API
  if (result.data && result.data.id) {
    const stocksToSave = formData.colorVariations.flatMap((color: any) => {
      if (!color.stocks) return [];

      // Mapper avec les IDs de couleur du serveur
      const serverColor = result.data.colorVariations?.find((c: any) => c.name === color.name);
      if (!serverColor) return [];

      return Object.entries(color.stocks).map(([sizeName, stock]) => ({
        colorId: serverColor.id,
        sizeName,
        stock: stock as number
      }));
    });

    if (stocksToSave.length > 0) {
      try {
        await updateProductStocks(result.data.id, stocksToSave);
        console.log('✅ Stocks sauvegardés avec succès');
      } catch (error) {
        console.error('❌ Erreur sauvegarde stocks:', error);
        toast.warning('Produit créé mais erreur lors de la sauvegarde des stocks');
      }
    }
  }

  toast.success(result.message || 'Produit créé avec succès !');
  setFormData(initialFormData);
  return true;
}
```

### 5. Gestion des commandes (Bonus)

Lorsqu'une commande est passée, décrémenter automatiquement les stocks:

```typescript
async function processOrder(orderItems: OrderItem[]) {
  const stockUpdates = orderItems.map(async item => {
    // Trouver le stock correspondant
    const stock = await prisma.productStock.findFirst({
      where: {
        productId: item.productId,
        colorId: item.colorVariantId,
        sizeName: item.size
      }
    });

    if (!stock || stock.stock < item.quantity) {
      throw new Error(`Stock insuffisant pour ${item.productName} - ${item.size}`);
    }

    // Décrémenter le stock
    return prisma.productStock.update({
      where: { id: stock.id },
      data: {
        stock: {
          decrement: item.quantity
        }
      }
    });
  });

  await Promise.all(stockUpdates);
}
```

## Migration Progressive

### Phase 1: Backend uniquement (Actuel → Backend)
1. Implémenter les endpoints backend
2. Tester avec Postman/Thunder Client
3. Déployer en production

### Phase 2: Frontend + Backend (Hybride)
1. Modifier `stockService.ts` pour utiliser les APIs
2. Garder localStorage comme fallback
3. Tester en développement

### Phase 3: Backend seulement
1. Supprimer complètement localStorage
2. Nettoyer le code frontend
3. Déployer en production

## Checklist d'implémentation

### Backend
- [ ] Créer le modèle `ProductStock` dans Prisma
- [ ] Générer et exécuter les migrations
- [ ] Créer les DTOs de validation
- [ ] Implémenter les endpoints CRUD stocks
- [ ] Ajouter les guards d'authentification
- [ ] Modifier l'endpoint GET `/products` pour inclure les stocks
- [ ] Tester tous les endpoints
- [ ] Documenter l'API (Swagger/OpenAPI)

### Frontend
- [ ] Créer/modifier les fonctions dans `stockService.ts`
- [ ] Mettre à jour `ProductFormMain.tsx` pour appeler l'API
- [ ] Mettre à jour `useProductForm.ts` pour appeler l'API
- [ ] Mettre à jour `AdminStockManagement.tsx` pour utiliser l'API
- [ ] Gérer les états de chargement
- [ ] Gérer les erreurs API
- [ ] Tester le flux complet création/édition
- [ ] Supprimer le code localStorage (Phase 3)

### Tests
- [ ] Tests unitaires backend (Jest)
- [ ] Tests d'intégration API
- [ ] Tests frontend (React Testing Library)
- [ ] Tests E2E (Playwright/Cypress)

## Notes importantes

1. **Sécurité**: Ajouter des validations pour empêcher les stocks négatifs
2. **Performance**: Utiliser des transactions pour les mises à jour multiples
3. **Audit**: Envisager une table d'historique des stocks
4. **Notifications**: Alerter quand le stock est bas (< 5 par exemple)
5. **Concurrence**: Gérer les conflits lors de mises à jour simultanées

## Exemple complet de flux

```
1. Admin crée un produit avec:
   - Nom: "T-shirt personnalisé"
   - Couleurs: Blanc, Noir
   - Catégorie: Vêtements > T-shirts
   - Variations: S, M, L, XL

2. À l'étape 5 (Gestion stocks):
   - Blanc: S=10, M=25, L=30, XL=15
   - Noir: S=8, M=20, L=25, XL=12

3. Lors de la soumission:
   - Frontend envoie POST /products avec infos produit
   - Backend crée le produit et retourne l'ID
   - Frontend envoie POST /products/:id/stocks avec les stocks
   - Backend crée 8 entrées dans ProductStock

4. Affichage dans AdminStockManagement:
   - Frontend appelle GET /products
   - Backend retourne les produits avec stocks inclus
   - Interface affiche les stocks actuels

5. Client passe commande:
   - 1x T-shirt Blanc M
   - Backend décrémente automatiquement le stock de Blanc M (25 → 24)
```

## Support et questions

Pour toute question sur l'implémentation, consulter:
- Documentation Prisma: https://www.prisma.io/docs
- Documentation NestJS: https://docs.nestjs.com
- Référence React Query: https://tanstack.com/query/latest
