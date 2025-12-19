# Backend - Suivi des Utilisations de Designs Vendeurs

## 📋 Vue d'ensemble

Ce document explique comment implémenter le système de suivi des revenus des designs vendeurs lorsqu'ils sont utilisés par des clients dans leurs personnalisations de produits.

## 🎯 Objectif

Enregistrer automatiquement dans le système de revenus (`/vendeur/design-revenues`) chaque fois qu'un client:
1. Utilise un design vendeur dans une personnalisation
2. Ajoute le produit au panier
3. Finalise la commande
4. Effectue le paiement

## 📊 Architecture des Données

### 1. Tables Existantes à Utiliser

#### Table `designs`
```sql
-- Contient les designs créés par les vendeurs
CREATE TABLE designs (
  id SERIAL PRIMARY KEY,
  vendor_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category_id INT,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VALIDATED, REJECTED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `customizations`
```sql
-- Contient les personnalisations des clients (déjà existante)
CREATE TABLE customizations (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  color_variation_id INT NOT NULL,
  view_id INT NOT NULL,
  design_elements JSONB NOT NULL, -- Contient les éléments ajoutés par le client
  session_id VARCHAR(255),
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Structure de design_elements (JSONB):
[
  {
    "id": "elem_1234",
    "type": "image",
    "imageUrl": "https://...",
    "designId": 42,          -- 🎯 ID du design vendeur
    "designPrice": 5000,     -- 🎯 Prix du design
    "designVendorId": 15,    -- 🎯 ID du vendeur (à ajouter)
    "x": 0.5,
    "y": 0.5,
    "width": 200,
    "height": 200,
    "rotation": 0,
    "zIndex": 1
  },
  {
    "id": "elem_5678",
    "type": "text",
    "text": "Mon texte",
    ...
  }
]
```

#### Table `orders`
```sql
-- Contient les commandes des clients (déjà existante)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, FAILED
  order_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `order_items`
```sql
-- Contient les articles d'une commande (déjà existante)
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  size VARCHAR(50),
  color VARCHAR(100),
  unit_price DECIMAL(10, 2) NOT NULL,
  customization_ids JSONB, -- 🎯 Stocke les IDs des customizations utilisées
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Structure de customization_ids (JSONB):
{
  "12-34": 456,  -- "colorId-viewId": customizationId
  "12-35": 457
}
```

### 2. Nouvelle Table pour le Suivi des Revenus

#### Table `design_usages`
```sql
CREATE TABLE design_usages (
  id SERIAL PRIMARY KEY,

  -- Informations sur le design
  design_id INT NOT NULL,
  design_name VARCHAR(255) NOT NULL,
  design_price DECIMAL(10, 2) NOT NULL,

  -- Informations sur le vendeur
  vendor_id INT NOT NULL,

  -- Informations sur la commande
  order_id INT NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  order_item_id INT NOT NULL,

  -- Informations sur le client
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),

  -- Informations sur le produit
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,

  -- Calcul des revenus
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 70.00, -- Pourcentage pour le vendeur
  vendor_revenue DECIMAL(10, 2) NOT NULL, -- Montant que le vendeur recevra (70% du prix du design)
  platform_fee DECIMAL(10, 2) NOT NULL, -- Montant pour la plateforme (30%)

  -- Statut de paiement
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- PENDING: Commande en attente
  -- CONFIRMED: Commande confirmée (paiement reçu)
  -- READY_FOR_PAYOUT: Commande livrée, prêt pour paiement au vendeur
  -- PAID: Vendeur a été payé
  -- CANCELLED: Commande annulée (pas de paiement)

  -- Dates importantes
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Date d'utilisation du design
  confirmed_at TIMESTAMP,                            -- Date de confirmation du paiement
  ready_for_payout_at TIMESTAMP,                     -- Date où le design est prêt pour paiement
  paid_at TIMESTAMP,                                 -- Date de paiement au vendeur

  -- Métadonnées
  customization_id INT,                              -- Référence à la personnalisation
  view_key VARCHAR(50),                              -- "colorId-viewId"

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,

  -- Index pour les requêtes fréquentes
  INDEX idx_vendor_payment_status (vendor_id, payment_status),
  INDEX idx_order_id (order_id),
  INDEX idx_design_id (design_id)
);
```

## 🔄 Flux de Traitement

### Étape 1: Ajout au Panier (Frontend)

Dans `CustomerProductCustomizationPageV3.tsx`, la fonction `handleAddToCart` (lignes 745-930) envoie déjà:

```javascript
const customizationData = {
  productId: product.id,
  colorVariationId: colorId,
  viewId: viewId,
  designElements: elements, // 🎯 Contient les designs vendeurs
  sizeSelections: selections,
  sessionId: customizationService.getOrCreateSessionId(),
};

// Sauvegarder chaque vue personnalisée
const result = await customizationService.saveCustomization(customizationData);
customizationIds[viewKey] = result.id; // Stocker l'ID pour le panier
```

**✅ Aucune modification frontend nécessaire** - Les données sont déjà envoyées.

### Étape 2: Création de la Commande (Backend)

Lorsqu'une commande est créée (endpoint: `POST /api/orders`):

```javascript
// Pseudocode Backend
async function createOrder(orderData) {
  // 1. Créer la commande
  const order = await db.orders.create({
    order_number: generateOrderNumber(),
    user_id: orderData.userId,
    customer_name: orderData.customerName,
    customer_email: orderData.customerEmail,
    total_amount: orderData.totalAmount,
    payment_status: 'PENDING',
    order_status: 'PENDING'
  });

  // 2. Créer les order_items
  for (const cartItem of orderData.items) {
    const orderItem = await db.order_items.create({
      order_id: order.id,
      product_id: cartItem.productId,
      product_name: cartItem.name,
      quantity: cartItem.quantity,
      size: cartItem.size,
      color: cartItem.color,
      unit_price: cartItem.price,
      customization_ids: cartItem.customizationIds // 🎯 Stocker les IDs
    });

    // 3. 🆕 Extraire et enregistrer les designs utilisés
    await extractAndRecordDesignUsages(order, orderItem, cartItem.customizationIds);
  }

  return order;
}
```

### Étape 3: Extraction des Designs Utilisés (Backend)

```javascript
/**
 * Extrait les designs vendeurs des customizations et crée les enregistrements design_usages
 */
async function extractAndRecordDesignUsages(order, orderItem, customizationIds) {
  if (!customizationIds || Object.keys(customizationIds).length === 0) {
    console.log(`Aucune personnalisation pour l'article ${orderItem.id}`);
    return;
  }

  // Set pour éviter les doublons de designs
  const recordedDesigns = new Set();

  // Parcourir toutes les vues personnalisées
  for (const [viewKey, customizationId] of Object.entries(customizationIds)) {
    // Récupérer la customization depuis la base de données
    const customization = await db.customizations.findById(customizationId);

    if (!customization || !customization.design_elements) {
      continue;
    }

    // Parcourir les éléments de design
    for (const element of customization.design_elements) {
      // Ne traiter que les images qui sont des designs vendeurs
      if (element.type !== 'image' || !element.designId || !element.designPrice) {
        continue;
      }

      // Éviter les doublons (si le même design est utilisé plusieurs fois)
      if (recordedDesigns.has(element.designId)) {
        console.log(`Design ${element.designId} déjà enregistré pour cette commande`);
        continue;
      }

      // Récupérer les infos complètes du design
      const design = await db.designs.findById(element.designId);

      if (!design) {
        console.warn(`Design ${element.designId} introuvable`);
        continue;
      }

      // Calculer les revenus (70% pour le vendeur, 30% pour la plateforme)
      const designPrice = element.designPrice;
      const commissionRate = 70.00;
      const vendorRevenue = (designPrice * commissionRate) / 100;
      const platformFee = designPrice - vendorRevenue;

      // 🎯 Créer l'enregistrement design_usage
      await db.design_usages.create({
        design_id: design.id,
        design_name: design.name,
        design_price: designPrice,
        vendor_id: design.vendor_id,
        order_id: order.id,
        order_number: order.order_number,
        order_item_id: orderItem.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        product_id: orderItem.product_id,
        product_name: orderItem.product_name,
        commission_rate: commissionRate,
        vendor_revenue: vendorRevenue,
        platform_fee: platformFee,
        payment_status: 'PENDING', // Commande pas encore payée
        customization_id: customizationId,
        view_key: viewKey,
        used_at: new Date()
      });

      console.log(`✅ Design ${design.id} enregistré - Vendeur recevra ${vendorRevenue} FCFA`);

      // Marquer comme enregistré
      recordedDesigns.add(element.designId);
    }
  }

  console.log(`📊 Total: ${recordedDesigns.size} design(s) unique(s) enregistré(s) pour l'article ${orderItem.id}`);
}
```

### Étape 4: Mise à Jour du Statut de Paiement (Backend)

#### Webhook PayDunya - Confirmation de Paiement

```javascript
/**
 * Webhook appelé par PayDunya après un paiement réussi
 * Endpoint: POST /api/webhooks/paydunya
 */
async function handlePaydunyaWebhook(webhookData) {
  const orderId = webhookData.custom_data?.order_id;

  if (!orderId) {
    console.error('Order ID manquant dans le webhook');
    return;
  }

  // 1. Mettre à jour le statut de la commande
  await db.orders.update({
    where: { id: orderId },
    data: {
      payment_status: 'PAID',
      order_status: 'CONFIRMED',
      updated_at: new Date()
    }
  });

  // 2. 🎯 Mettre à jour les design_usages associés
  await db.design_usages.updateMany({
    where: {
      order_id: orderId,
      payment_status: 'PENDING'
    },
    data: {
      payment_status: 'CONFIRMED',
      confirmed_at: new Date(),
      updated_at: new Date()
    }
  });

  console.log(`✅ Commande ${orderId} confirmée - Design usages mis à jour`);
}
```

#### Livraison de la Commande

```javascript
/**
 * Marquer une commande comme livrée
 * Endpoint: PATCH /api/admin/orders/:orderId/deliver
 */
async function markOrderAsDelivered(orderId) {
  // 1. Mettre à jour le statut de la commande
  await db.orders.update({
    where: { id: orderId },
    data: {
      order_status: 'DELIVERED',
      updated_at: new Date()
    }
  });

  // 2. 🎯 Mettre à jour les design_usages - Prêts pour paiement au vendeur
  await db.design_usages.updateMany({
    where: {
      order_id: orderId,
      payment_status: 'CONFIRMED'
    },
    data: {
      payment_status: 'READY_FOR_PAYOUT',
      ready_for_payout_at: new Date(),
      updated_at: new Date()
    }
  });

  console.log(`✅ Commande ${orderId} livrée - Designs prêts pour paiement aux vendeurs`);
}
```

#### Annulation de Commande

```javascript
/**
 * Annuler une commande
 * Endpoint: PATCH /api/admin/orders/:orderId/cancel
 */
async function cancelOrder(orderId) {
  // 1. Mettre à jour le statut de la commande
  await db.orders.update({
    where: { id: orderId },
    data: {
      order_status: 'CANCELLED',
      updated_at: new Date()
    }
  });

  // 2. 🎯 Annuler les design_usages
  await db.design_usages.updateMany({
    where: {
      order_id: orderId,
      payment_status: { in: ['PENDING', 'CONFIRMED'] }
    },
    data: {
      payment_status: 'CANCELLED',
      updated_at: new Date()
    }
  });

  console.log(`❌ Commande ${orderId} annulée - Design usages annulés`);
}
```

## 📡 API Endpoints pour le Frontend

### 1. Récupérer les Statistiques de Revenus

**Endpoint déjà défini dans `vendorDesignRevenueService.ts`:**

```javascript
// GET /api/vendor/design-revenues/stats?period=month
async function getRevenueStats(vendorId, period = 'month') {
  // Calculer les dates selon la période
  const dateFilter = calculateDateFilter(period);

  // Requête pour les statistiques
  const stats = await db.design_usages.aggregate({
    where: {
      vendor_id: vendorId,
      used_at: dateFilter,
    },
    _sum: {
      vendor_revenue: true
    },
    _count: true
  });

  // Détail par statut
  const pendingRevenue = await db.design_usages.aggregate({
    where: {
      vendor_id: vendorId,
      payment_status: { in: ['PENDING', 'CONFIRMED'] },
      used_at: dateFilter
    },
    _sum: { vendor_revenue: true }
  });

  const completedRevenue = await db.design_usages.aggregate({
    where: {
      vendor_id: vendorId,
      payment_status: { in: ['READY_FOR_PAYOUT', 'PAID'] },
      used_at: dateFilter
    },
    _sum: { vendor_revenue: true }
  });

  // Nombre de designs uniques utilisés
  const uniqueDesigns = await db.design_usages.aggregate({
    where: {
      vendor_id: vendorId,
      used_at: dateFilter
    },
    _count: {
      design_id: true
    },
    distinct: ['design_id']
  });

  return {
    totalRevenue: stats._sum.vendor_revenue || 0,
    pendingRevenue: pendingRevenue._sum.vendor_revenue || 0,
    completedRevenue: completedRevenue._sum.vendor_revenue || 0,
    totalUsages: stats._count,
    uniqueDesignsUsed: uniqueDesigns._count.design_id,
    averageRevenuePerDesign: stats._count > 0
      ? (stats._sum.vendor_revenue / uniqueDesigns._count.design_id)
      : 0
  };
}
```

### 2. Récupérer la Liste des Designs avec Revenus

```javascript
// GET /api/vendor/design-revenues/designs?period=month&sortBy=revenue
async function getDesignRevenues(vendorId, filters) {
  const { period = 'month', sortBy = 'revenue', search = '' } = filters;
  const dateFilter = calculateDateFilter(period);

  // Grouper par design
  const designUsages = await db.design_usages.groupBy({
    by: ['design_id', 'design_name'],
    where: {
      vendor_id: vendorId,
      used_at: dateFilter,
      design_name: { contains: search, mode: 'insensitive' }
    },
    _sum: {
      vendor_revenue: true
    },
    _count: true,
    _max: {
      used_at: true
    }
  });

  // Enrichir avec les informations du design
  const enrichedDesigns = await Promise.all(
    designUsages.map(async (usage) => {
      const design = await db.designs.findUnique({
        where: { id: usage.design_id }
      });

      // Récupérer l'historique d'utilisation pour ce design
      const usageHistory = await db.design_usages.findMany({
        where: {
          design_id: usage.design_id,
          vendor_id: vendorId,
          used_at: dateFilter
        },
        include: {
          order: true
        },
        orderBy: {
          used_at: 'desc'
        }
      });

      return {
        id: usage.design_id,
        designId: usage.design_id,
        designName: usage.design_name,
        designImage: design?.image_url || design?.thumbnail_url || '',
        designPrice: design?.price || 0,
        totalUsages: usage._count,
        totalRevenue: usage._sum.vendor_revenue || 0,
        pendingRevenue: usageHistory
          .filter(u => ['PENDING', 'CONFIRMED'].includes(u.payment_status))
          .reduce((sum, u) => sum + parseFloat(u.vendor_revenue), 0),
        completedRevenue: usageHistory
          .filter(u => ['READY_FOR_PAYOUT', 'PAID'].includes(u.payment_status))
          .reduce((sum, u) => sum + parseFloat(u.vendor_revenue), 0),
        lastUsedAt: usage._max.used_at,
        usageHistory: usageHistory.map(u => ({
          id: u.id,
          orderId: u.order_id,
          orderNumber: u.order_number,
          customerName: u.customer_name,
          productName: u.product_name,
          usedAt: u.used_at,
          revenue: parseFloat(u.vendor_revenue),
          status: mapPaymentStatusToUIStatus(u.payment_status),
          commissionRate: parseFloat(u.commission_rate)
        }))
      };
    })
  );

  // Trier selon le critère
  enrichedDesigns.sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      case 'usage':
        return b.totalUsages - a.totalUsages;
      case 'recent':
        return new Date(b.lastUsedAt) - new Date(a.lastUsedAt);
      default:
        return 0;
    }
  });

  return enrichedDesigns;
}

// Mapper le statut interne vers le statut UI
function mapPaymentStatusToUIStatus(paymentStatus) {
  switch (paymentStatus) {
    case 'PENDING':
    case 'CONFIRMED':
      return 'PENDING';
    case 'READY_FOR_PAYOUT':
    case 'PAID':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}
```

### 3. Récupérer l'Historique d'un Design

```javascript
// GET /api/vendor/design-revenues/designs/:designId/history
async function getDesignUsageHistory(vendorId, designId) {
  const usageHistory = await db.design_usages.findMany({
    where: {
      design_id: parseInt(designId),
      vendor_id: vendorId
    },
    orderBy: {
      used_at: 'desc'
    }
  });

  return usageHistory.map(usage => ({
    id: usage.id,
    orderId: usage.order_id,
    orderNumber: usage.order_number,
    customerName: usage.customer_name,
    productName: usage.product_name,
    usedAt: usage.used_at,
    revenue: parseFloat(usage.vendor_revenue),
    status: mapPaymentStatusToUIStatus(usage.payment_status),
    commissionRate: parseFloat(usage.commission_rate)
  }));
}
```

## 🔧 Modifications Nécessaires au Frontend

### Ajouter vendorId aux éléments de design

Dans `CustomerProductCustomizationPageV3.tsx`, lorsqu'un design vendeur est ajouté, il faut s'assurer que le `vendorId` est inclus:

```typescript
// Dans ProductDesignEditor.tsx ou le composant qui gère l'ajout de designs
const addVendorDesign = (design: any) => {
  const newElement = {
    id: `design-${Date.now()}`,
    type: 'image',
    imageUrl: design.imageUrl,
    designId: design.id,           // ✅ Déjà présent
    designPrice: design.price,     // ✅ Déjà présent
    designVendorId: design.vendorId, // 🆕 À AJOUTER
    x: 0.5,
    y: 0.5,
    width: 200,
    height: 200,
    rotation: 0,
    zIndex: getCurrentMaxZIndex() + 1
  };

  // Ajouter au canvas...
};
```

Le service `designService.getPublicDesigns()` devrait déjà retourner le `vendorId` (ou `creator.id`). Si ce n'est pas le cas, modifier l'API backend pour l'inclure.

## ✅ Checklist d'Implémentation

### Backend

- [ ] Créer la table `design_usages` avec tous les champs
- [ ] Ajouter des index sur `vendor_id`, `payment_status`, `order_id`, `design_id`
- [ ] Implémenter `extractAndRecordDesignUsages()` dans la création de commande
- [ ] Implémenter la mise à jour de statut dans le webhook PayDunya
- [ ] Implémenter la mise à jour lors de la livraison
- [ ] Implémenter la mise à jour lors de l'annulation
- [ ] Créer l'endpoint `GET /api/vendor/design-revenues/stats`
- [ ] Créer l'endpoint `GET /api/vendor/design-revenues/designs`
- [ ] Créer l'endpoint `GET /api/vendor/design-revenues/designs/:designId/history`
- [ ] Ajouter des tests unitaires pour chaque fonction
- [ ] Ajouter des logs détaillés pour le debugging

### Frontend

- [ ] Vérifier que `vendorId` est inclus dans les éléments de design (sinon l'ajouter)
- [ ] Tester l'ajout au panier avec des designs vendeurs
- [ ] Tester l'affichage dans `VendorDesignRevenuesPage`
- [ ] Vérifier que les statistiques se mettent à jour après un paiement

### Base de Données

- [ ] Créer un script de migration pour la table `design_usages`
- [ ] Ajouter une contrainte pour éviter les doublons (design_id + order_item_id)
- [ ] Créer une vue SQL pour les statistiques fréquentes (optionnel)

## 📝 Exemple de Migration SQL (Prisma)

```prisma
model DesignUsage {
  id                  Int      @id @default(autoincrement())

  // Design info
  designId            Int      @map("design_id")
  designName          String   @map("design_name") @db.VarChar(255)
  designPrice         Decimal  @map("design_price") @db.Decimal(10, 2)

  // Vendor info
  vendorId            Int      @map("vendor_id")

  // Order info
  orderId             Int      @map("order_id")
  orderNumber         String   @map("order_number") @db.VarChar(50)
  orderItemId         Int      @map("order_item_id")

  // Customer info
  customerName        String   @map("customer_name") @db.VarChar(255)
  customerEmail       String?  @map("customer_email") @db.VarChar(255)

  // Product info
  productId           Int      @map("product_id")
  productName         String   @map("product_name") @db.VarChar(255)

  // Revenue calculation
  commissionRate      Decimal  @default(70.00) @map("commission_rate") @db.Decimal(5, 2)
  vendorRevenue       Decimal  @map("vendor_revenue") @db.Decimal(10, 2)
  platformFee         Decimal  @map("platform_fee") @db.Decimal(10, 2)

  // Payment status
  paymentStatus       String   @default("PENDING") @map("payment_status") @db.VarChar(20)

  // Timestamps
  usedAt              DateTime @default(now()) @map("used_at")
  confirmedAt         DateTime? @map("confirmed_at")
  readyForPayoutAt    DateTime? @map("ready_for_payout_at")
  paidAt              DateTime? @map("paid_at")

  // Metadata
  customizationId     Int?     @map("customization_id")
  viewKey             String?  @map("view_key") @db.VarChar(50)

  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  // Relations
  design              Design   @relation(fields: [designId], references: [id], onDelete: Cascade)
  vendor              User     @relation("VendorDesignUsages", fields: [vendorId], references: [id], onDelete: Cascade)
  order               Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderItem           OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  @@map("design_usages")
  @@index([vendorId, paymentStatus], name: "idx_vendor_payment_status")
  @@index([orderId], name: "idx_order_id")
  @@index([designId], name: "idx_design_id")
  @@unique([designId, orderItemId], name: "unique_design_order_item")
}
```

## 🐛 Debugging et Logs

Ajouter des logs détaillés à chaque étape:

```javascript
console.log('🔍 [Design Usage] Analyse de la commande', {
  orderId: order.id,
  orderNumber: order.order_number,
  itemsCount: orderItems.length
});

console.log('✅ [Design Usage] Design enregistré', {
  designId: design.id,
  designName: design.name,
  vendorId: design.vendor_id,
  vendorRevenue: vendorRevenue,
  orderId: order.id
});

console.log('📊 [Design Usage] Statistiques', {
  totalDesigns: recordedDesigns.size,
  totalRevenue: totalVendorRevenue,
  orderId: order.id
});
```

## 🎉 Résultat Final

Une fois implémenté, le système fonctionnera automatiquement:

1. **Client personnalise** → Design elements sauvegardés avec `designId`, `designPrice`, `vendorId`
2. **Client commande** → `design_usages` créés avec statut `PENDING`
3. **Client paye** → Statut mis à jour à `CONFIRMED`
4. **Commande livrée** → Statut mis à jour à `READY_FOR_PAYOUT`
5. **Vendeur consulte** `/vendeur/design-revenues` → Voit ses revenus en temps réel
6. **Admin paye le vendeur** → Statut mis à jour à `PAID`

Le tout cohérent avec l'interface UI déjà créée! 🚀
