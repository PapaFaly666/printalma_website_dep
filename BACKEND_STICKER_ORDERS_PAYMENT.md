# Backend - Commandes et Paiement pour les Stickers

## Contexte

Le système de commande doit gérer les stickers comme des produits spéciaux avec :
- ✅ Validation des quantités min/max
- ✅ Pas de gestion de couleurs/tailles (simplifiées)
- ✅ Prix calculé selon la quantité
- ✅ Intégration avec PayTech/PayDunya pour le paiement

## Données Frontend → Backend

### Structure d'un item sticker dans le panier

```typescript
{
  // Identification
  id: "75-N/A-10x10 cm",           // ID composite pour le panier
  productId: 75,                   // ID du produit (pour compatibilité)
  stickerId: 75,                   // ✅ ID explicite du sticker (IMPORTANT)
  productType: 'STICKER',          // ✅ Type de produit (IMPORTANT)

  // Informations produit
  name: "Autocollant - Design Cool",
  price: 2500,                     // Prix unitaire en FCFA (centimes)
  quantity: 5,                     // Quantité commandée

  // Informations simplifiées (pas de couleur/taille réelles)
  color: 'N/A',                    // Pas de variation de couleur
  colorCode: '#FFFFFF',
  size: '10x10 cm',                // Format texte descriptif

  // Image et design
  imageUrl: "https://res.cloudinary.com/.../sticker_75.png",  // Image avec bordures
  designUrl: "https://res.cloudinary.com/.../design_123.png", // Design source
  designId: 123,

  // Vendeur
  vendorName: "Mon Shop",
  // ⚠️ PAS de vendorProductId pour les stickers
}
```

### Structure envoyée au backend (orderItem)

```typescript
{
  // ✅ Pour un sticker
  stickerId: 75,                   // ID du sticker (REQUIS)
  quantity: 5,                     // Quantité commandée
  unitPrice: 2500,                 // Prix unitaire en centimes
  size: '10x10 cm',                // Taille descriptive
  color: 'N/A',                    // Pas de couleur
  colorId: null                    // Pas de variation de couleur
}

// ✅ Pour un produit normal
{
  productId: 123,                  // ID du produit (REQUIS)
  quantity: 2,
  unitPrice: 5000,
  size: 'M',
  color: 'Blanc',
  colorId: 1
}
```

## 1. Modifications du Schéma Prisma

### Modèle OrderItem

**Fichier:** `prisma/schema.prisma`

```prisma
model OrderItem {
  id        Int      @id @default(autoincrement())
  orderId   Int      @map("order_id")

  // ✅ Support des stickers ET des produits normaux
  productId Int?     @map("product_id")           // ID du produit admin (optionnel)
  stickerId Int?     @map("sticker_id")           // ✅ ID du sticker (optionnel)

  quantity  Int
  unitPrice Int      @map("unit_price")           // Prix unitaire en centimes

  // Métadonnées (optionnelles pour les stickers)
  size      String?  @db.VarChar(50)
  color     String?  @db.VarChar(100)
  colorId   Int?     @map("color_id")

  // Relations
  order          Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product        AdminProduct?  @relation(fields: [productId], references: [id])
  stickerProduct StickerProduct? @relation(fields: [stickerId], references: [id])  // ✅ Nouveau

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("order_items")
  @@index([orderId])
  @@index([productId])
  @@index([stickerId])  // ✅ Nouveau
}

model StickerProduct {
  id          Int      @id @default(autoincrement())
  vendorId    Int      @map("vendor_id")
  designId    Int      @map("design_id")

  name        String   @db.VarChar(255)
  sku         String   @unique @db.VarChar(100)

  // Image générée avec bordures
  imageUrl    String?  @map("image_url") @db.VarChar(500)

  // Prix
  finalPrice  Int      @map("final_price")  // Prix en centimes

  // Quantités min/max
  minQuantity Int      @default(1) @map("min_quantity")
  maxQuantity Int      @default(100) @map("max_quantity")

  // Statut
  status      ProductStatus @default(PENDING)

  // Relations
  vendor      VendorProfile @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  design      Design @relation(fields: [designId], references: [id])
  orderItems  OrderItem[]   // ✅ Relation avec les commandes

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("sticker_products")
}
```

### Migration Prisma

```bash
# Générer la migration
npx prisma migrate dev --name add_sticker_orders_support

# Appliquer en production
npx prisma migrate deploy

# Regénérer le client
npx prisma generate
```

## 2. DTO de Commande

**Fichier:** `src/orders/dto/create-order.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, ValidateNested, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({
    example: 1,
    description: 'ID du produit admin (optionnel si stickerId fourni)'
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiProperty({
    example: 75,
    description: 'ID du sticker (optionnel si productId fourni)'
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  stickerId?: number;

  @ApiProperty({ example: 5, description: 'Quantité commandée' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 2500,
    description: 'Prix unitaire en FCFA (centimes)'
  })
  @IsInt()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 'M', required: false })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({ example: 'Blanc', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  colorId?: number;
}

export class ShippingDetailsDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '123 Rue de la Paix' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Dakar' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Sénégal', default: 'Sénégal' })
  @IsString()
  country: string;

  @ApiProperty({ example: '12000', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;
}

export enum PaymentMethod {
  PAYTECH = 'PAYTECH',
  PAYDUNYA = 'PAYDUNYA',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  OTHER = 'OTHER'
}

export class CreateOrderDto {
  @ApiProperty({ type: ShippingDetailsDto })
  @ValidateNested()
  @Type(() => ShippingDetailsDto)
  shippingDetails: ShippingDetailsDto;

  @ApiProperty({ example: '+221771234567' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @ApiProperty({
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ example: true, default: false })
  @IsOptional()
  initiatePayment?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

## 3. Service de Commande

**Fichier:** `src/orders/orders.service.ts`

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService, // Service de paiement PayTech/PayDunya
  ) {}

  async createOrder(userId: number | null, dto: CreateOrderDto) {
    // 1. Valider et enrichir les orderItems
    const validatedItems = await this.validateOrderItems(dto.orderItems);

    // 2. Calculer le montant total
    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // 3. Générer un numéro de commande unique
    const orderNumber = await this.generateOrderNumber();

    // 4. Créer la commande en base de données
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        totalAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: dto.paymentMethod || 'CASH_ON_DELIVERY',
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        notes: dto.notes,

        // Shipping details (JSON ou relation séparée)
        shippingDetails: dto.shippingDetails as any,

        // Order items
        orderItems: {
          create: validatedItems.map(item => ({
            productId: item.productId || null,
            stickerId: item.stickerId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            size: item.size || null,
            color: item.color || null,
            colorId: item.colorId || null,
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true,
            stickerProduct: true, // ✅ Inclure les stickers
          }
        }
      }
    });

    // 5. Initier le paiement si demandé
    let paymentData = null;
    if (dto.initiatePayment && dto.paymentMethod !== 'CASH_ON_DELIVERY') {
      paymentData = await this.initiatePayment(order, dto.paymentMethod);
    }

    return {
      success: true,
      message: 'Commande créée avec succès',
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        payment: paymentData,
      }
    };
  }

  // ✅ Validation des items de commande avec support des stickers
  private async validateOrderItems(items: OrderItemDto[]): Promise<OrderItemDto[]> {
    const validatedItems: OrderItemDto[] = [];

    for (const item of items) {
      // Chaque item doit avoir soit productId, soit stickerId
      if (!item.productId && !item.stickerId) {
        throw new BadRequestException(
          'Chaque item doit avoir un productId ou un stickerId'
        );
      }

      // Validation pour les stickers
      if (item.stickerId) {
        const sticker = await this.prisma.stickerProduct.findUnique({
          where: { id: item.stickerId },
          select: {
            id: true,
            finalPrice: true,
            minQuantity: true,
            maxQuantity: true,
            status: true,
          }
        });

        if (!sticker) {
          throw new NotFoundException(`Sticker ${item.stickerId} introuvable`);
        }

        // Vérifier le statut
        if (sticker.status !== 'APPROVED' && sticker.status !== 'PUBLISHED') {
          throw new BadRequestException(
            `Le sticker ${item.stickerId} n'est pas disponible à la vente`
          );
        }

        // ✅ Valider les quantités min/max
        if (item.quantity < sticker.minQuantity) {
          throw new BadRequestException(
            `Quantité minimale pour ce sticker : ${sticker.minQuantity} unités`
          );
        }

        if (item.quantity > sticker.maxQuantity) {
          throw new BadRequestException(
            `Quantité maximale pour ce sticker : ${sticker.maxQuantity} unités`
          );
        }

        // Vérifier le prix
        if (item.unitPrice !== sticker.finalPrice) {
          console.warn(
            `⚠️ Prix unitaire incorrect pour sticker ${item.stickerId}: ` +
            `reçu ${item.unitPrice}, attendu ${sticker.finalPrice}`
          );
          // Utiliser le prix de la base de données
          item.unitPrice = sticker.finalPrice;
        }

        validatedItems.push(item);
      }
      // Validation pour les produits normaux
      else if (item.productId) {
        const product = await this.prisma.adminProduct.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new NotFoundException(`Produit ${item.productId} introuvable`);
        }

        // Validation des couleurs/tailles si nécessaire
        // ... (logique existante)

        validatedItems.push(item);
      }
    }

    return validatedItems;
  }

  // Générer un numéro de commande unique
  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${timestamp}-${random}`;
  }

  // Initier le paiement PayTech/PayDunya
  private async initiatePayment(order: any, paymentMethod: string) {
    if (paymentMethod === 'PAYTECH') {
      return await this.paymentService.initiatePaytech(order);
    } else if (paymentMethod === 'PAYDUNYA') {
      return await this.paymentService.initiatePaydunya(order);
    }
    return null;
  }

  // Obtenir les commandes d'un utilisateur avec les stickers
  async getUserOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: true,
            stickerProduct: {
              include: {
                design: true,
                vendor: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: orders.map(order => this.formatOrderResponse(order))
    };
  }

  // Formater la réponse de commande
  private formatOrderResponse(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items: order.orderItems.map((item: any) => {
        // Si c'est un sticker
        if (item.stickerId && item.stickerProduct) {
          return {
            type: 'STICKER',
            id: item.stickerProduct.id,
            name: item.stickerProduct.name,
            imageUrl: item.stickerProduct.imageUrl,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            designName: item.stickerProduct.design?.name,
            vendorName: item.stickerProduct.vendor?.shop_name,
          };
        }
        // Si c'est un produit normal
        else if (item.productId && item.product) {
          return {
            type: 'PRODUCT',
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            size: item.size,
            color: item.color,
          };
        }
        return null;
      }).filter(Boolean)
    };
  }
}
```

## 4. Controller

**Fichier:** `src/orders/orders.controller.ts`

```typescript
import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Créer une commande (utilisateur authentifié)
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une commande avec paiement (utilisateur authentifié)' })
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user.id;
    return this.ordersService.createOrder(userId, dto);
  }

  // Créer une commande guest (sans authentification)
  @Post('guest')
  @ApiOperation({ summary: 'Créer une commande guest (sans compte)' })
  async createGuestOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(null, dto);
  }

  // Obtenir les commandes de l'utilisateur
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir mes commandes' })
  async getUserOrders(@Req() req: any) {
    const userId = req.user.id;
    return this.ordersService.getUserOrders(userId);
  }
}
```

## 5. Exemple de Requête/Réponse

### Requête - Commande UNIQUEMENT avec stickers

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "street": "123 Rue de la Paix",
    "city": "Dakar",
    "country": "Sénégal",
    "postalCode": "12000"
  },
  "phoneNumber": "+221771234567",
  "email": "john@example.com",
  "orderItems": [
    {
      "stickerId": 75,
      "quantity": 5,
      "unitPrice": 2500,
      "size": "10x10 cm",
      "color": "N/A",
      "colorId": null
    },
    {
      "stickerId": 76,
      "quantity": 10,
      "unitPrice": 2000,
      "size": "15x15 cm",
      "color": "N/A",
      "colorId": null
    }
  ],
  "paymentMethod": "PAYTECH",
  "initiatePayment": true,
  "notes": "Livraison rapide svp"
}
```

### Requête - Commande MIXTE (stickers + produits)

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingDetails": {
    "firstName": "Jane",
    "lastName": "Smith",
    "street": "456 Avenue de la République",
    "city": "Dakar",
    "country": "Sénégal"
  },
  "phoneNumber": "+221771234568",
  "email": "jane@example.com",
  "orderItems": [
    {
      "stickerId": 75,
      "quantity": 3,
      "unitPrice": 2500,
      "size": "10x10 cm",
      "color": "N/A",
      "colorId": null
    },
    {
      "productId": 123,
      "quantity": 2,
      "unitPrice": 15000,
      "size": "L",
      "color": "Noir",
      "colorId": 3
    }
  ],
  "paymentMethod": "CASH_ON_DELIVERY",
  "initiatePayment": false
}
```

### Réponse

```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 123,
    "orderNumber": "ORD-1737456789012-3456",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": 32500,
    "payment": {
      "token": "abc123xyz",
      "redirect_url": "https://paytech.sn/payment/abc123xyz",
      "mode": "live"
    }
  }
}
```

### Réponse - Obtenir mes commandes

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "orderNumber": "ORD-1737456789012-3456",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "totalAmount": 32500,
      "createdAt": "2026-01-21T10:00:00.000Z",
      "items": [
        {
          "type": "STICKER",
          "id": 75,
          "name": "Autocollant - Design Cool",
          "imageUrl": "https://res.cloudinary.com/.../sticker_75.png",
          "quantity": 5,
          "unitPrice": 2500,
          "totalPrice": 12500,
          "designName": "Design Cool",
          "vendorName": "Mon Shop"
        },
        {
          "type": "STICKER",
          "id": 76,
          "name": "Autocollant - Logo Entreprise",
          "imageUrl": "https://res.cloudinary.com/.../sticker_76.png",
          "quantity": 10,
          "unitPrice": 2000,
          "totalPrice": 20000,
          "designName": "Logo Entreprise",
          "vendorName": "Mon Shop"
        }
      ]
    }
  ]
}
```

## 6. Erreurs Gérées

### Validation des quantités

```json
{
  "success": false,
  "message": "Quantité minimale pour ce sticker : 5 unités",
  "statusCode": 400
}
```

```json
{
  "success": false,
  "message": "Quantité maximale pour ce sticker : 100 unités",
  "statusCode": 400
}
```

### Sticker indisponible

```json
{
  "success": false,
  "message": "Le sticker 75 n'est pas disponible à la vente",
  "statusCode": 400
}
```

### Prix incorrect

Le backend corrige automatiquement le prix et utilise celui de la base de données :

```typescript
if (item.unitPrice !== sticker.finalPrice) {
  console.warn(`⚠️ Prix unitaire incorrect, utilisation du prix de la BDD`);
  item.unitPrice = sticker.finalPrice;
}
```

## 7. Intégration PayTech/PayDunya

### Service de Paiement

**Fichier:** `src/payment/payment.service.ts`

```typescript
@Injectable()
export class PaymentService {
  async initiatePaytech(order: any) {
    const paytechConfig = {
      api_key: process.env.PAYTECH_API_KEY,
      secret_key: process.env.PAYTECH_SECRET_KEY,
    };

    const paymentData = {
      item_name: `Commande ${order.orderNumber}`,
      item_price: order.totalAmount,
      currency: 'XOF',
      ref_command: order.orderNumber,
      command_name: `Commande PrintAlma ${order.orderNumber}`,
      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      ipn_url: `${process.env.BACKEND_URL}/payment/paytech/webhook`,
    };

    // Appel API PayTech
    const response = await axios.post(
      'https://paytech.sn/api/payment/request-payment',
      paymentData,
      { headers: { Authorization: `Bearer ${paytechConfig.api_key}` } }
    );

    return {
      token: response.data.token,
      redirect_url: response.data.redirect_url,
      mode: 'live'
    };
  }

  async initiatePaydunya(order: any) {
    // Logique similaire pour PayDunya
    // ...
  }
}
```

## 8. Tests

### Test du service

```typescript
describe('OrdersService - Stickers', () => {
  it('devrait créer une commande avec stickers', async () => {
    const dto: CreateOrderDto = {
      shippingDetails: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Rue',
        city: 'Dakar',
        country: 'Sénégal'
      },
      phoneNumber: '+221771234567',
      orderItems: [
        {
          stickerId: 75,
          quantity: 5,
          unitPrice: 2500
        }
      ],
      paymentMethod: 'CASH_ON_DELIVERY'
    };

    const result = await service.createOrder(1, dto);

    expect(result.success).toBe(true);
    expect(result.data.totalAmount).toBe(12500);
  });

  it('devrait rejeter une quantité inférieure au minimum', async () => {
    const dto: CreateOrderDto = {
      // ... même config
      orderItems: [
        {
          stickerId: 75,
          quantity: 1,  // Si minQuantity = 5
          unitPrice: 2500
        }
      ]
    };

    await expect(service.createOrder(1, dto))
      .rejects
      .toThrow('Quantité minimale pour ce sticker : 5 unités');
  });
});
```

## 9. Checklist d'Implémentation

- [ ] Modifier `prisma/schema.prisma`
  - [ ] Ajouter `stickerId` à `OrderItem`
  - [ ] Ajouter relation `stickerProduct` à `OrderItem`
  - [ ] Ajouter relation `orderItems` à `StickerProduct`
- [ ] Créer la migration Prisma
  ```bash
  npx prisma migrate dev --name add_sticker_orders_support
  ```
- [ ] Modifier `src/orders/dto/create-order.dto.ts`
  - [ ] Ajouter `stickerId` à `OrderItemDto`
  - [ ] Rendre `productId` optionnel
- [ ] Modifier `src/orders/orders.service.ts`
  - [ ] Implémenter `validateOrderItems()` avec support stickers
  - [ ] Valider les quantités min/max
  - [ ] Vérifier le statut du sticker
  - [ ] Corriger le prix si nécessaire
- [ ] Mettre à jour `formatOrderResponse()` pour inclure les stickers
- [ ] Tester la création de commandes avec stickers
- [ ] Tester la validation des quantités
- [ ] Tester le paiement PayTech/PayDunya
- [ ] Déployer en production

## 10. Logs et Débogage

### Frontend - Logs dans orderService.ts

```typescript
// Lors de la création de commande
🎨 [OrderService] Item 0: {
  productType: 'STICKER',
  stickerId: 75,
  isSticker: true,
  productId: 75
}

🎨 [OrderService] Sticker OrderItem construit: {
  stickerId: 75,
  quantity: 5,
  unitPrice: 2500,
  size: '10x10 cm',
  color: 'N/A',
  colorId: null
}

🛒 [OrderService] Création de commande depuis le panier: {
  cartItems: [{ productType: 'STICKER', stickerId: 75, ... }],
  shippingInfo: { ... },
  paymentMethod: 'PAYTECH'
}
```

### Backend - Logs attendus

```typescript
// Dans orders.service.ts
✅ [OrdersService] Validation item 0: {
  type: 'STICKER',
  stickerId: 75,
  quantity: 5,
  minQuantity: 1,
  maxQuantity: 100
}

✅ [OrdersService] Prix validé pour sticker 75: 2500 FCFA

✅ [OrdersService] Commande créée: {
  orderNumber: 'ORD-1737456789012-3456',
  totalAmount: 12500,
  itemsCount: 1
}
```

## 11. Tests Frontend

### Test d'ajout au panier

```typescript
// Dans la console du navigateur
localStorage.getItem('cart')
// Devrait afficher:
[{
  "id": "75-N/A-10x10 cm",
  "productType": "STICKER",
  "stickerId": 75,
  "productId": 75,
  "name": "Autocollant - Design Cool",
  "price": 2500,
  "quantity": 5,
  "size": "10x10 cm",
  "color": "N/A",
  "imageUrl": "https://res.cloudinary.com/.../sticker_75.png"
}]
```

### Test de commande

```javascript
// Ouvrir la console et vérifier les logs
// 1. Ajouter un sticker au panier
// 2. Aller au panier
// 3. Cliquer sur "Commander"
// 4. Vérifier les logs dans la console:

// ✅ Logs attendus:
🎨 [OrderService] Item 0: { productType: 'STICKER', stickerId: 75, isSticker: true }
🎨 [OrderService] Sticker OrderItem construit: { stickerId: 75, quantity: 5, unitPrice: 2500 }
🛒 [OrderService] Création de commande depuis le panier
✅ [OrderService] Commande créée avec succès
```

## 12. Résumé

| Fonctionnalité | Statut |
|----------------|--------|
| Ajout au panier frontend | ✅ Implémenté |
| Affichage dans le panier | ✅ Implémenté |
| Validation quantités frontend | ✅ Implémenté |
| Création de commande frontend | ✅ Implémenté |
| Schéma Prisma backend | ⏳ À adapter |
| DTO de commande backend | ⏳ À adapter |
| Service de validation backend | ⏳ À implémenter |
| Paiement PayTech | ⏳ À tester |
| Paiement PayDunya | ⏳ À tester |

### Frontend - Complété ✅

1. ✅ Ajout au panier avec `productType: 'STICKER'`
2. ✅ Affichage correct dans le panier (image sur fond gris)
3. ✅ Validation des quantités min/max
4. ✅ Gestion de la quantité dans le panier
5. ✅ Envoi de `stickerId` au backend lors de la commande
6. ✅ Logs de débogage complets

### Backend - À Implémenter ⏳

1. ⏳ Migration Prisma pour `stickerId` dans `OrderItem`
2. ⏳ Validation du `stickerId` dans `orders.service.ts`
3. ⏳ Validation des quantités min/max
4. ⏳ Vérification du prix du sticker
5. ⏳ Tests de création de commande
6. ⏳ Tests de paiement

---

**Date:** 21 janvier 2026
**Version:** 2.0.0
**Auteur:** Claude Sonnet 4.5
**Mise à jour:** Frontend complété, backend documenté
