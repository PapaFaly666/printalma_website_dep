# Guide Backend - Gestion de la Quantité dans les Commandes

## Vue d'ensemble

Ce document décrit comment gérer correctement la quantité des produits dans les commandes côté backend.

---

## 1. Structure des Données Reçues

### Payload de création de commande

```typescript
interface CreateOrderRequest {
  email: string;
  shippingDetails: ShippingDetails;
  phoneNumber: string;
  notes?: string;
  orderItems: OrderItemRequest[];
  paymentMethod: 'PAYDUNYA' | 'CASH_ON_DELIVERY';
  initiatePayment: boolean;
}

interface OrderItemRequest {
  productId: number;
  quantity: number;        // ← QUANTITÉ ICI
  unitPrice: number;       // Prix unitaire (pas le total)
  size?: string;
  color?: string;
  colorId?: number;
  vendorProductId?: number;
  mockupUrl?: string;
  designId?: number;
  designPositions?: any;
  designMetadata?: any;
  delimitation?: Delimitation;
  customizationId?: number;
  customizationIds?: Record<string, number>;
  designElements?: any[];
  designElementsByView?: Record<string, any[]>;
  viewsMetadata?: ViewMetadata[];
}
```

---

## 2. Calculs à Effectuer Côté Backend

### 2.1 Calcul du prix total par article

```typescript
// Pour chaque orderItem
const totalPrice = orderItem.unitPrice * orderItem.quantity;
```

### 2.2 Calcul du montant total de la commande

```typescript
// Somme de tous les articles
const itemsTotal = orderItems.reduce((sum, item) => {
  return sum + (item.unitPrice * item.quantity);
}, 0);

// Ajouter les frais de livraison
const totalAmount = itemsTotal + shippingFee;
```

---

## 3. Schéma de Base de Données

### Table `order_items`

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  vendor_product_id INTEGER REFERENCES vendor_products(id),

  -- Prix et quantité
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,  -- unit_price * quantity

  -- Variantes
  size VARCHAR(50),
  color VARCHAR(100),
  color_id INTEGER,

  -- Personnalisation
  mockup_url TEXT,
  design_id INTEGER,
  design_positions JSONB,
  design_metadata JSONB,
  delimitation JSONB,
  customization_id INTEGER,
  customization_ids JSONB,
  design_elements JSONB,
  design_elements_by_view JSONB,
  views_metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table `orders`

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),

  -- Montants
  subtotal DECIMAL(10, 2) NOT NULL,      -- Somme des total_price des items
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,  -- subtotal + shipping_fee

  -- Statut
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',

  -- Infos client
  email VARCHAR(255),
  phone_number VARCHAR(50),
  notes TEXT,

  -- Adresse
  shipping_address JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. Logique de Création de Commande

### Controller (NestJS exemple)

```typescript
@Post('create')
async createOrder(@Body() createOrderDto: CreateOrderRequest) {
  // 1. Valider les données
  this.validateOrderRequest(createOrderDto);

  // 2. Calculer les totaux
  let subtotal = 0;
  const processedItems = createOrderDto.orderItems.map(item => {
    const totalPrice = item.unitPrice * item.quantity;
    subtotal += totalPrice;

    return {
      ...item,
      totalPrice,
    };
  });

  // 3. Récupérer les frais de livraison
  const shippingFee = this.calculateShippingFee(createOrderDto);

  // 4. Calculer le montant total
  const totalAmount = subtotal + shippingFee;

  // 5. Créer la commande
  const order = await this.orderService.create({
    ...createOrderDto,
    orderItems: processedItems,
    subtotal,
    shippingFee,
    totalAmount,
  });

  return order;
}
```

### Service

```typescript
@Injectable()
export class OrderService {
  async create(orderData: ProcessedOrderData): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      // Créer la commande
      const order = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          email: orderData.email,
          phoneNumber: orderData.phoneNumber,
          notes: orderData.notes,
          subtotal: orderData.subtotal,
          shippingFee: orderData.shippingFee,
          totalAmount: orderData.totalAmount,
          status: 'pending',
          paymentMethod: orderData.paymentMethod,
          shippingAddress: orderData.shippingDetails,
        },
      });

      // Créer les items
      for (const item of orderData.orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            vendorProductId: item.vendorProductId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            size: item.size,
            color: item.color,
            colorId: item.colorId,
            mockupUrl: item.mockupUrl,
            designId: item.designId,
            designPositions: item.designPositions,
            designMetadata: item.designMetadata,
            delimitation: item.delimitation,
            customizationId: item.customizationId,
            customizationIds: item.customizationIds,
            designElements: item.designElements,
            designElementsByView: item.designElementsByView,
            viewsMetadata: item.viewsMetadata,
          },
        });
      }

      return order;
    });
  }
}
```

---

## 5. Validation

### Règles de validation pour la quantité

```typescript
// Dans le DTO de validation
import { IsInt, Min, Max } from 'class-validator';

export class OrderItemDto {
  @IsInt()
  @Min(1, { message: 'La quantité minimum est 1' })
  @Max(100, { message: 'La quantité maximum est 100' })
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}
```

### Vérification du stock

```typescript
async validateStock(items: OrderItemRequest[]): Promise<void> {
  for (const item of items) {
    const product = await this.productService.findById(item.productId);

    if (!product) {
      throw new NotFoundException(`Produit ${item.productId} non trouvé`);
    }

    // Vérifier le stock si applicable
    if (product.trackInventory && product.stock < item.quantity) {
      throw new BadRequestException(
        `Stock insuffisant pour ${product.name}. Disponible: ${product.stock}, Demandé: ${item.quantity}`
      );
    }
  }
}
```

---

## 6. Mise à Jour du Stock

### Après création de commande réussie

```typescript
async decrementStock(orderItems: OrderItem[]): Promise<void> {
  for (const item of orderItems) {
    await this.prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });
  }
}
```

### En cas d'annulation

```typescript
async restoreStock(orderItems: OrderItem[]): Promise<void> {
  for (const item of orderItems) {
    await this.prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          increment: item.quantity,
        },
      },
    });
  }
}
```

---

## 7. Réponse API

### Structure de réponse pour une commande créée

```typescript
interface OrderResponse {
  success: boolean;
  data: {
    id: number;
    orderNumber: string;
    status: string;
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
    orderItems: Array<{
      id: number;
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      size?: string;
      color?: string;
      // ... autres champs
    }>;
    // ... autres champs
  };
  payment?: {
    token: string;
    redirect_url: string;
    // ... autres champs PayDunya
  };
}
```

---

## 8. Tests

### Tests unitaires recommandés

```typescript
describe('OrderService', () => {
  describe('create', () => {
    it('should calculate totalPrice correctly for each item', async () => {
      const orderData = {
        orderItems: [
          { productId: 1, quantity: 3, unitPrice: 1000 },
          { productId: 2, quantity: 2, unitPrice: 2500 },
        ],
      };

      const order = await service.create(orderData);

      expect(order.orderItems[0].totalPrice).toBe(3000); // 3 * 1000
      expect(order.orderItems[1].totalPrice).toBe(5000); // 2 * 2500
    });

    it('should calculate order subtotal correctly', async () => {
      const orderData = {
        orderItems: [
          { productId: 1, quantity: 3, unitPrice: 1000 },
          { productId: 2, quantity: 2, unitPrice: 2500 },
        ],
      };

      const order = await service.create(orderData);

      expect(order.subtotal).toBe(8000); // 3000 + 5000
    });

    it('should reject quantity less than 1', async () => {
      const orderData = {
        orderItems: [
          { productId: 1, quantity: 0, unitPrice: 1000 },
        ],
      };

      await expect(service.create(orderData)).rejects.toThrow();
    });

    it('should reject when stock is insufficient', async () => {
      // Mock product with stock = 2
      const orderData = {
        orderItems: [
          { productId: 1, quantity: 5, unitPrice: 1000 },
        ],
      };

      await expect(service.create(orderData)).rejects.toThrow('Stock insuffisant');
    });
  });
});
```

---

## 9. Points d'Attention

### Sécurité

1. **Ne jamais faire confiance au prix envoyé par le frontend** - Toujours recalculer côté backend
2. **Valider que la quantité est un entier positif**
3. **Vérifier les limites de quantité** (min/max)

### Performance

1. **Utiliser des transactions** pour garantir l'intégrité des données
2. **Batch les opérations de mise à jour de stock** si possible
3. **Indexer les colonnes fréquemment requêtées** (order_id, product_id)

### Logs

```typescript
// Logger les informations importantes
this.logger.log(`Commande créée: ${order.orderNumber}, Total: ${order.totalAmount}, Items: ${order.orderItems.length}`);

// Pour debug
this.logger.debug(`Item détail: ProductId=${item.productId}, Qty=${item.quantity}, Unit=${item.unitPrice}, Total=${item.totalPrice}`);
```

---

## 10. Migration SQL (si nécessaire)

Si la colonne `quantity` n'existe pas encore :

```sql
-- Ajouter la colonne quantity si elle n'existe pas
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- Ajouter la colonne total_price si elle n'existe pas
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);

-- Mettre à jour les total_price existants
UPDATE order_items
SET total_price = unit_price * quantity
WHERE total_price IS NULL;

-- Rendre total_price NOT NULL après mise à jour
ALTER TABLE order_items
ALTER COLUMN total_price SET NOT NULL;
```

---

---

## 11. Gestion des Tailles Multiples

### Vue d'ensemble

Quand un client personnalise un produit et choisit plusieurs tailles, le frontend envoie **plusieurs orderItems** avec la même personnalisation mais des tailles différentes.

### Exemple de Payload

```typescript
// Un client commande un t-shirt personnalisé en 3 tailles
{
  orderItems: [
    {
      productId: 42,
      quantity: 2,
      unitPrice: 15000,
      size: 'S',
      color: 'Blanc',
      // Données de personnalisation partagées
      designElementsByView: { "1-5": [...elements...] },
      customizationIds: { "1-5": 123 },
      viewsMetadata: [...],
      delimitation: {...},
      mockupUrl: "https://...",
    },
    {
      productId: 42,
      quantity: 3,
      unitPrice: 15000,
      size: 'M',
      color: 'Blanc',
      // Même personnalisation
      designElementsByView: { "1-5": [...elements...] },
      customizationIds: { "1-5": 123 },
      viewsMetadata: [...],
      delimitation: {...},
      mockupUrl: "https://...",
    },
    {
      productId: 42,
      quantity: 1,
      unitPrice: 15000,
      size: 'L',
      color: 'Blanc',
      // Même personnalisation
      designElementsByView: { "1-5": [...elements...] },
      customizationIds: { "1-5": 123 },
      viewsMetadata: [...],
      delimitation: {...},
      mockupUrl: "https://...",
    }
  ]
}
```

### Logique Backend

```typescript
async createOrder(orderData: CreateOrderRequest): Promise<Order> {
  return this.prisma.$transaction(async (tx) => {
    // Créer la commande
    const order = await tx.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        email: orderData.email,
        // ... autres champs
      },
    });

    // Créer chaque item (un par taille)
    for (const item of orderData.orderItems) {
      const totalPrice = item.unitPrice * item.quantity;

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: totalPrice,
          size: item.size, // Taille unique par item
          color: item.color,
          // Personnalisation partagée entre les items de tailles différentes
          designElementsByView: item.designElementsByView,
          customizationIds: item.customizationIds,
          viewsMetadata: item.viewsMetadata,
          delimitation: item.delimitation,
          mockupUrl: item.mockupUrl,
        },
      });
    }

    // Calculer le total de la commande
    const subtotal = orderData.orderItems.reduce(
      (sum, item) => sum + (item.unitPrice * item.quantity),
      0
    );

    // Mettre à jour le total
    await tx.order.update({
      where: { id: order.id },
      data: {
        subtotal,
        totalAmount: subtotal + (orderData.shippingFee || 0),
      },
    });

    return order;
  });
}
```

### Points Importants

1. **Chaque taille = un orderItem séparé** - Ne pas fusionner les tailles
2. **Même personnalisation** - Les items partagent les mêmes `designElementsByView`, `customizationIds`, etc.
3. **Stock par taille** - Décrémenter le stock pour chaque taille séparément
4. **Prix identique** - Le `unitPrice` est le même pour toutes les tailles (sauf si pricing par taille)

### Validation

```typescript
// Vérifier que chaque taille a du stock suffisant
async validateMultipleSizes(orderItems: OrderItemRequest[]): Promise<void> {
  // Grouper par productId + size pour vérifier le stock
  const sizeQuantities = new Map<string, number>();

  for (const item of orderItems) {
    const key = `${item.productId}-${item.size}`;
    const current = sizeQuantities.get(key) || 0;
    sizeQuantities.set(key, current + item.quantity);
  }

  for (const [key, totalQty] of sizeQuantities) {
    const [productId, size] = key.split('-');

    // Vérifier le stock pour cette taille
    const sizeStock = await this.getSizeStock(parseInt(productId), size);

    if (sizeStock < totalQty) {
      throw new BadRequestException(
        `Stock insuffisant pour la taille ${size}. Disponible: ${sizeStock}, Demandé: ${totalQty}`
      );
    }
  }
}
```

---

## Résumé

Le frontend envoie maintenant la quantité correcte dans `orderItem.quantity`. Le backend doit :

1. **Recevoir** la quantité depuis le payload
2. **Valider** que la quantité est >= 1 et <= limite max
3. **Calculer** `totalPrice = unitPrice * quantity` pour chaque item
4. **Calculer** `subtotal = sum(totalPrice)` pour la commande
5. **Stocker** quantity, unitPrice, et totalPrice dans la base
6. **Mettre à jour** le stock si applicable
7. **Retourner** les données calculées dans la réponse

### Pour les tailles multiples :

8. **Traiter chaque item séparément** - Un item par taille
9. **Partager la personnalisation** - Mêmes données de customization pour tous les items
10. **Valider le stock par taille** - Vérifier la disponibilité de chaque taille
11. **Calculer le total global** - Somme de tous les items toutes tailles confondues
