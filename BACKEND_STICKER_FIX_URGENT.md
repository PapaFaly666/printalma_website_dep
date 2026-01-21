# 🚨 FIX URGENT - Erreur Commande Sticker Backend

## Problème

```
Foreign key constraint violated on the constraint: `OrderItem_productId_fkey`
```

Le backend essaie de créer un `OrderItem` avec `productId` pour un sticker, mais ce `productId` n'existe pas dans la table `AdminProduct`.

## Cause

Le schéma Prisma actuel impose que `productId` soit obligatoire et référence `AdminProduct`, mais pour les stickers, on doit utiliser `stickerId` à la place.

## Solution Rapide

### 1. Modifier le Schéma Prisma

**Fichier:** `prisma/schema.prisma`

**AVANT :**
```prisma
model OrderItem {
  id        Int      @id @default(autoincrement())
  orderId   Int      @map("order_id")
  productId Int      @map("product_id")  // ❌ Obligatoire
  quantity  Int
  unitPrice Int      @map("unit_price")

  order     Order         @relation(fields: [orderId], references: [id])
  product   AdminProduct  @relation(fields: [productId], references: [id])

  @@map("order_items")
}
```

**APRÈS :**
```prisma
model OrderItem {
  id        Int      @id @default(autoincrement())
  orderId   Int      @map("order_id")

  // ✅ Rendre productId optionnel
  productId Int?     @map("product_id")

  // ✅ Ajouter stickerId optionnel
  stickerId Int?     @map("sticker_id")

  quantity  Int
  unitPrice Int      @map("unit_price")
  size      String?  @db.VarChar(50)
  color     String?  @db.VarChar(100)

  // Relations
  order          Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product        AdminProduct?   @relation(fields: [productId], references: [id])
  stickerProduct StickerProduct? @relation(fields: [stickerId], references: [id])

  @@map("order_items")
  @@index([orderId])
  @@index([productId])
  @@index([stickerId])
}

model StickerProduct {
  // ... champs existants

  // ✅ Ajouter la relation
  orderItems OrderItem[]

  @@map("sticker_products")
}
```

### 2. Créer et Appliquer la Migration

```bash
# Arrêter le serveur backend
# Ctrl+C dans le terminal du backend

# Générer la migration
npx prisma migrate dev --name add_sticker_to_order_items

# Si erreur, forcer la migration (ATTENTION: développement uniquement)
npx prisma migrate dev --name add_sticker_to_order_items --create-only

# Vérifier le fichier SQL généré dans prisma/migrations/

# Appliquer la migration
npx prisma migrate deploy

# Regénérer le client Prisma
npx prisma generate

# Redémarrer le serveur backend
npm run start:dev
```

### 3. Modifier le Service de Commande

**Fichier:** `src/order/order.service.ts`

**Méthode `createGuestOrder()` ou `create()` :**

**AVANT :**
```typescript
const order = await this.prisma.order.create({
  data: {
    // ... autres champs
    orderItems: {
      create: validatedOrderItems.map(item => ({
        productId: item.productId,  // ❌ Obligatoire
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        size: item.size,
        color: item.color,
      }))
    }
  }
});
```

**APRÈS :**
```typescript
const order = await this.prisma.order.create({
  data: {
    // ... autres champs
    orderItems: {
      create: validatedOrderItems.map(item => ({
        // ✅ Gérer les deux cas
        productId: item.productId || null,
        stickerId: item.stickerId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        size: item.size || null,
        color: item.color || null,
      }))
    }
  },
  include: {
    orderItems: {
      include: {
        product: true,
        stickerProduct: true,  // ✅ Inclure les stickers
      }
    }
  }
});
```

### 4. Modifier la Validation

**Fichier:** `src/order/order.service.ts`

**Méthode `validateStickerOrderItems()` ou similaire :**

```typescript
async validateStickerOrderItems(orderItems: any[]) {
  const validatedItems = [];

  for (const item of orderItems) {
    // ✅ Chaque item doit avoir SOIT productId SOIT stickerId
    if (!item.productId && !item.stickerId) {
      throw new BadRequestException(
        'Chaque item doit avoir un productId ou un stickerId'
      );
    }

    // ✅ Validation pour les stickers
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

      if (sticker.status !== 'APPROVED' && sticker.status !== 'PUBLISHED') {
        throw new BadRequestException(
          `Le sticker ${item.stickerId} n'est pas disponible à la vente`
        );
      }

      // Valider les quantités
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

      // Utiliser le prix de la BDD
      validatedItems.push({
        ...item,
        stickerId: item.stickerId,
        productId: null,
        unitPrice: sticker.finalPrice,
      });
    }
    // ✅ Validation pour les produits normaux
    else if (item.productId) {
      const product = await this.prisma.adminProduct.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        throw new NotFoundException(`Produit ${item.productId} introuvable`);
      }

      validatedItems.push({
        ...item,
        productId: item.productId,
        stickerId: null,
      });
    }
  }

  return validatedItems;
}
```

## Test Rapide Après Correction

### 1. Vérifier la Migration

```bash
# Dans le terminal backend
npx prisma studio

# Vérifier que la table OrderItem a bien les colonnes:
# - productId (nullable)
# - stickerId (nullable)
```

### 2. Tester la Commande

```bash
# Redémarrer le backend
npm run start:dev

# Dans le frontend, ajouter un sticker au panier et commander
# Vérifier les logs backend:

# ✅ Logs attendus:
[Nest] LOG [OrderService] Validation item 0: { stickerId: 75, quantity: 5 }
[Nest] LOG [OrderService] Sticker trouvé: { id: 75, finalPrice: 2500, status: 'APPROVED' }
[Nest] LOG [OrderService] Commande créée: { orderNumber: 'ORD-...', totalAmount: 12500 }
```

### 3. Vérifier en Base de Données

```sql
-- Vérifier la commande créée
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;

-- Vérifier les order_items
SELECT
  id,
  order_id,
  product_id,
  sticker_id,
  quantity,
  unit_price
FROM order_items
WHERE order_id = (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1);

-- Devrait afficher:
-- product_id: NULL
-- sticker_id: 75
-- quantity: 5
-- unit_price: 2500
```

## Checklist de Correction

- [ ] Modifier `prisma/schema.prisma`
  - [ ] Rendre `productId` optionnel (`Int?`)
  - [ ] Ajouter `stickerId Int?`
  - [ ] Ajouter relation `stickerProduct`
  - [ ] Ajouter `orderItems` dans `StickerProduct`
- [ ] Créer et appliquer la migration
  ```bash
  npx prisma migrate dev --name add_sticker_to_order_items
  npx prisma generate
  ```
- [ ] Modifier `src/order/order.service.ts`
  - [ ] Adapter `validateStickerOrderItems()`
  - [ ] Adapter `create()` ou `createGuestOrder()`
  - [ ] Gérer `productId: null` et `stickerId: 75`
- [ ] Redémarrer le backend
  ```bash
  npm run start:dev
  ```
- [ ] Tester une commande avec un sticker
- [ ] Vérifier en base de données
- [ ] Tester le paiement PayTech/PayDunya

## Erreurs Possibles et Solutions

### Erreur 1: Migration échoue

```
Error: Foreign key constraint failed
```

**Solution:**
```bash
# Supprimer les OrderItems existants (développement uniquement)
npx prisma studio
# Supprimer manuellement les OrderItems qui ont des productId invalides

# Ou réinitialiser la base (⚠️ PERTE DE DONNÉES)
npx prisma migrate reset
```

### Erreur 2: Client Prisma non à jour

```
Property 'stickerProduct' does not exist
```

**Solution:**
```bash
npx prisma generate
# Redémarrer le serveur
```

### Erreur 3: Contrainte de validation

```
Either productId or stickerId must be provided
```

**Solution:**
Vérifier que le frontend envoie bien `stickerId` dans l'orderItem.

```javascript
// Dans la console du navigateur
console.log(JSON.stringify(orderData, null, 2))

// Devrait afficher:
{
  "orderItems": [
    {
      "stickerId": 75,
      "quantity": 5,
      "unitPrice": 2500,
      "size": "10x10 cm",
      "color": "N/A"
    }
  ]
}
```

## Prochaines Étapes

Une fois la correction appliquée :

1. ✅ Tester commande avec un seul sticker
2. ✅ Tester commande avec plusieurs stickers
3. ✅ Tester commande mixte (sticker + produit)
4. ✅ Tester paiement PayTech
5. ✅ Tester paiement PayDunya
6. ✅ Vérifier l'affichage des commandes dans l'admin
7. ✅ Vérifier l'affichage des commandes pour le vendeur

---

**Priorité:** 🚨 URGENT - Bloque les commandes de stickers
**Temps estimé:** 10-15 minutes
**Difficulté:** Moyenne (migration de base de données)

**Date:** 21 janvier 2026
**Auteur:** Claude Sonnet 4.5
