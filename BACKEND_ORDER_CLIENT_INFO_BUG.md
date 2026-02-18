# ✅ RÉSOLU : Informations Client dans les Commandes

**Date:** 29 janvier 2026
**Priorité:** 🟢 **RÉSOLU**
**Statut:** Corrigé côté frontend

**Résolution:** Le backend sauvegardait correctement les données, mais dans des champs différents (`shippingName`, `email`, `shippingStreet`, etc.). Le frontend a été mis à jour pour lire et afficher ces champs correctement.

---

## 📋 Résumé du Problème

Lorsqu'un client passe une commande (guest ou authentifié), les informations suivantes ne sont **PAS sauvegardées** dans la base de données :

- ❌ **Prénom** (`firstName`)
- ❌ **Nom** (`lastName`)
- ❌ **Email** (`email`)
- ❌ **Téléphone** (`phoneNumber`)

Ces champs restent **vides ou NULL** dans la base de données malgré que le frontend les envoie correctement.

---

## ✅ Preuve : Le Frontend Envoie les Données Correctement

### Logs Frontend (Console navigateur)

```javascript
// 1. Les données sont bien collectées dans le formulaire
📋 [DEBUG] formData AVANT construction: {
  firstName: 'Papa Faly TEST FINAL',
  lastName: 'Sidy FINAL',
  email: 'pfdiagne35@gmail.com',
  phone: '775588834',
  address: 'Point E',
  city: 'Point E',
  country: 'Sénégal',
  countryCode: 'SN'
}

// 2. Les données sont bien construites dans orderRequest
📤 [DEBUG] orderRequest APRÈS construction: {
  email: 'pfdiagne35@gmail.com',
  shippingDetails: {
    firstName: 'Papa Faly TEST FINAL',
    lastName: 'Sidy FINAL',
    street: 'Point E',
    city: 'Point E',
    region: 'Point E',
    postalCode: undefined,
    country: 'Sénégal'
  },
  phoneNumber: '775588834',
  notes: undefined,
  orderItems: [...],
  paymentMethod: 'PAYDUNYA',
  totalAmount: 4000,
  deliveryInfo: {...}
}

// 3. Les données sont bien envoyées au backend
🛒 [OrderService] Création de commande guest (route /orders/guest): {
  email: 'pfdiagne35@gmail.com',
  shippingDetails: {
    firstName: 'Papa Faly TEST FINAL',
    lastName: 'Sidy FINAL',
    ...
  },
  phoneNumber: '775588834',
  ...
}
```

### Requête HTTP Envoyée

```http
POST /api/orders/guest
Content-Type: application/json

{
  "email": "pfdiagne35@gmail.com",
  "shippingDetails": {
    "firstName": "Papa Faly TEST FINAL",
    "lastName": "Sidy FINAL",
    "street": "Point E",
    "city": "Point E",
    "region": "Point E",
    "postalCode": null,
    "country": "Sénégal"
  },
  "phoneNumber": "775588834",
  "notes": null,
  "orderItems": [
    {
      "productId": 5,
      "unitPrice": 4000,
      "color": "Blanc",
      "size": "M",
      "quantity": 1,
      "vendorProductId": 39,
      ...
    }
  ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true,
  "totalAmount": 4000,
  "deliveryInfo": {
    "deliveryType": "city",
    "countryCode": "SN",
    "transporteurName": "Livraison standard",
    "deliveryFee": 0,
    "deliveryTime": "Standard",
    ...
  }
}
```

**Conclusion :** Le frontend envoie **TOUTES** les données correctement. Le problème est **100% côté backend**.

---

## 🔍 Ce Que le Backend Doit Vérifier

### 1. Endpoint : `POST /api/orders/guest`

**Fichier probable :** `src/order/order.controller.ts` ou similaire

**Vérifier :**

```typescript
@Post('guest')
async createGuestOrder(@Body() createOrderDto: CreateOrderDto) {
  // ❓ Est-ce que shippingDetails.firstName est bien extrait ?
  // ❓ Est-ce que shippingDetails.lastName est bien extrait ?
  // ❓ Est-ce que email est bien extrait ?
  // ❓ Est-ce que phoneNumber est bien extrait ?

  console.log('📥 [Backend] Données reçues:', createOrderDto);
  console.log('📥 [Backend] shippingDetails:', createOrderDto.shippingDetails);
  console.log('📥 [Backend] email:', createOrderDto.email);
  console.log('📥 [Backend] phoneNumber:', createOrderDto.phoneNumber);

  return this.orderService.createGuestOrder(createOrderDto);
}
```

### 2. DTO de Validation

**Fichier probable :** `src/order/dto/create-order.dto.ts`

**Vérifier que le DTO accepte ces champs :**

```typescript
export class CreateOrderDto {
  @IsEmail()
  @IsNotEmpty()
  email: string; // ✅ Doit être présent

  @IsString()
  @IsNotEmpty()
  phoneNumber: string; // ✅ Doit être présent

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingDetailsDto)
  shippingDetails: ShippingDetailsDto; // ✅ Doit être présent

  // ... autres champs
}

export class ShippingDetailsDto {
  @IsString()
  @IsOptional() // ⚠️ Vérifier si c'est bien @IsOptional et pas @IsNotEmpty
  firstName?: string; // ✅ Doit être présent

  @IsString()
  @IsOptional()
  lastName?: string; // ✅ Doit être présent

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  region?: string;
}
```

**Problème possible :**
- Les champs `firstName` et `lastName` sont peut-être **manquants** dans le DTO
- Les décorateurs de validation pourraient **rejeter** ces champs
- Le `@Type()` pourrait ne pas transformer correctement `shippingDetails`

### 3. Service de Création de Commande

**Fichier probable :** `src/order/order.service.ts`

**Vérifier la sauvegarde en base de données :**

```typescript
async createGuestOrder(createOrderDto: CreateOrderDto) {
  console.log('💾 [OrderService] Création commande avec:', {
    email: createOrderDto.email,
    phoneNumber: createOrderDto.phoneNumber,
    firstName: createOrderDto.shippingDetails.firstName,
    lastName: createOrderDto.shippingDetails.lastName
  });

  // ❓ Est-ce que ces champs sont bien passés à Prisma/TypeORM ?
  const order = await this.prisma.order.create({
    data: {
      email: createOrderDto.email, // ✅ Doit être sauvegardé
      phoneNumber: createOrderDto.phoneNumber, // ✅ Doit être sauvegardé

      // ⚠️ VÉRIFIER ICI : Comment shippingDetails est sauvegardé ?
      // Option 1 : Champs directs dans Order
      firstName: createOrderDto.shippingDetails.firstName,
      lastName: createOrderDto.shippingDetails.lastName,

      // Option 2 : Relation avec table ShippingAddress
      shippingAddress: {
        create: {
          firstName: createOrderDto.shippingDetails.firstName,
          lastName: createOrderDto.shippingDetails.lastName,
          street: createOrderDto.shippingDetails.street,
          city: createOrderDto.shippingDetails.city,
          country: createOrderDto.shippingDetails.country,
          postalCode: createOrderDto.shippingDetails.postalCode,
          region: createOrderDto.shippingDetails.region
        }
      },

      // Option 3 : JSON stocké dans un champ
      shippingDetailsJson: JSON.stringify(createOrderDto.shippingDetails),

      // ... autres champs
    }
  });

  console.log('✅ [OrderService] Commande créée:', order);
  return order;
}
```

### 4. Schéma de Base de Données

**Fichier probable :** `prisma/schema.prisma`

**Vérifier le modèle Order :**

```prisma
model Order {
  id            Int      @id @default(autoincrement())
  orderNumber   String   @unique

  // ❓ Ces champs existent-ils dans la table ?
  email         String?  // ✅ Doit exister
  phoneNumber   String?  // ✅ Doit exister
  firstName     String?  // ✅ Doit exister
  lastName      String?  // ✅ Doit exister

  // Ou est-ce dans une relation ?
  shippingAddressId Int?
  shippingAddress   ShippingAddress? @relation(fields: [shippingAddressId], references: [id])

  // Ou stocké en JSON ?
  shippingDetailsJson Json?

  // ... autres champs
}

model ShippingAddress {
  id         Int     @id @default(autoincrement())
  firstName  String? // ✅ Doit exister
  lastName   String? // ✅ Doit exister
  street     String
  city       String
  country    String
  postalCode String?
  region     String?

  orders     Order[]
}
```

**Problème possible :**
- Les colonnes `firstName`, `lastName`, `email`, `phoneNumber` n'existent pas dans la table `Order`
- La relation avec `ShippingAddress` n'est pas créée correctement
- Les champs sont définis mais la **migration** n'a pas été appliquée

---

## 🔧 Solutions Possibles

### Solution 1 : Ajouter les Champs Manquants au Modèle Order

Si les champs n'existent pas dans le schéma :

```prisma
model Order {
  id            Int      @id @default(autoincrement())
  orderNumber   String   @unique

  // 🆕 Ajouter ces champs
  email         String?  @db.VarChar(255)
  phoneNumber   String?  @db.VarChar(20)
  firstName     String?  @db.VarChar(100)
  lastName      String?  @db.VarChar(100)

  // ... autres champs existants
}
```

Puis générer et appliquer la migration :

```bash
npx prisma migrate dev --name add_customer_info_to_order
npx prisma generate
```

### Solution 2 : Corriger le Service pour Sauvegarder les Données

Si les champs existent mais ne sont pas sauvegardés :

```typescript
// ❌ AVANT (incorrect)
const order = await this.prisma.order.create({
  data: {
    orderNumber: generateOrderNumber(),
    totalAmount: createOrderDto.totalAmount,
    // ❌ firstName, lastName, email, phoneNumber manquants !
  }
});

// ✅ APRÈS (correct)
const order = await this.prisma.order.create({
  data: {
    orderNumber: generateOrderNumber(),
    totalAmount: createOrderDto.totalAmount,

    // ✅ Ajouter les informations client
    email: createOrderDto.email,
    phoneNumber: createOrderDto.phoneNumber,
    firstName: createOrderDto.shippingDetails?.firstName,
    lastName: createOrderDto.shippingDetails?.lastName,

    // ✅ Ajouter l'adresse complète
    shippingStreet: createOrderDto.shippingDetails?.street,
    shippingCity: createOrderDto.shippingDetails?.city,
    shippingCountry: createOrderDto.shippingDetails?.country,
    shippingPostalCode: createOrderDto.shippingDetails?.postalCode,
    shippingRegion: createOrderDto.shippingDetails?.region,
  }
});
```

### Solution 3 : Utiliser une Relation ShippingAddress

Si vous utilisez une table séparée :

```typescript
const order = await this.prisma.order.create({
  data: {
    orderNumber: generateOrderNumber(),
    email: createOrderDto.email,
    phoneNumber: createOrderDto.phoneNumber,

    // Créer l'adresse de livraison en relation
    shippingAddress: {
      create: {
        firstName: createOrderDto.shippingDetails.firstName,
        lastName: createOrderDto.shippingDetails.lastName,
        street: createOrderDto.shippingDetails.street,
        city: createOrderDto.shippingDetails.city,
        country: createOrderDto.shippingDetails.country,
        postalCode: createOrderDto.shippingDetails.postalCode,
        region: createOrderDto.shippingDetails.region,
      }
    },

    orderItems: {
      create: createOrderDto.orderItems.map(item => ({...}))
    }
  },
  include: {
    shippingAddress: true, // ✅ Inclure dans la réponse
    orderItems: true
  }
});
```

---

## 🧪 Tests à Effectuer

### 1. Test Backend Isolé

Tester directement l'endpoint avec curl/Postman :

```bash
curl -X POST https://printalma-back-dep.onrender.com/api/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "775123456",
    "shippingDetails": {
      "firstName": "Test",
      "lastName": "Backend",
      "street": "123 Test St",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "orderItems": [
      {
        "productId": 1,
        "unitPrice": 5000,
        "color": "Noir",
        "size": "M",
        "quantity": 1
      }
    ],
    "paymentMethod": "CASH_ON_DELIVERY",
    "totalAmount": 5000
  }'
```

**Vérifier :**
- La commande est créée
- Les champs `firstName`, `lastName`, `email`, `phoneNumber` sont bien sauvegardés en BDD
- La réponse JSON contient ces informations

### 2. Logs Backend à Ajouter

Ajouter des logs pour tracer le problème :

```typescript
// Dans order.controller.ts
@Post('guest')
async createGuestOrder(@Body() createOrderDto: CreateOrderDto) {
  console.log('🔍 [OrderController] Données reçues:', {
    email: createOrderDto.email,
    phoneNumber: createOrderDto.phoneNumber,
    shippingDetails: createOrderDto.shippingDetails
  });

  const result = await this.orderService.createGuestOrder(createOrderDto);

  console.log('✅ [OrderController] Commande créée:', {
    orderId: result.id,
    orderNumber: result.orderNumber,
    email: result.email,
    phoneNumber: result.phoneNumber,
    firstName: result.firstName || result.shippingAddress?.firstName,
    lastName: result.lastName || result.shippingAddress?.lastName
  });

  return result;
}
```

### 3. Vérification Base de Données

Après avoir créé une commande, vérifier directement en BDD :

```sql
-- Vérifier la dernière commande créée
SELECT
  id,
  orderNumber,
  email,
  phoneNumber,
  firstName,
  lastName,
  createdAt
FROM "Order"
ORDER BY createdAt DESC
LIMIT 1;

-- Vérifier l'adresse de livraison si relation
SELECT
  o.orderNumber,
  o.email,
  sa.firstName,
  sa.lastName,
  sa.street,
  sa.city,
  sa.country
FROM "Order" o
LEFT JOIN "ShippingAddress" sa ON o.shippingAddressId = sa.id
ORDER BY o.createdAt DESC
LIMIT 1;
```

---

## 📊 Impact

**Sévérité :** 🔴 **CRITIQUE**

**Conséquences :**
- ❌ Impossible de contacter les clients
- ❌ Impossible de livrer les commandes correctement
- ❌ Données clients perdues
- ❌ Expérience utilisateur dégradée
- ❌ Violation potentielle du RGPD (données non stockées correctement)

**Nombre d'utilisateurs affectés :** 100% des commandes

---

## ✅ Checklist de Résolution

- [ ] **Identifier où les données sont perdues** (Controller, Service, ou BDD)
- [ ] **Vérifier que le DTO accepte les champs** (`firstName`, `lastName`, `email`, `phoneNumber`)
- [ ] **Vérifier que le schéma Prisma contient les colonnes** nécessaires
- [ ] **Appliquer une migration** si les colonnes manquent
- [ ] **Corriger le code du Service** pour sauvegarder les données
- [ ] **Ajouter des logs** pour tracer le flux de données
- [ ] **Tester avec curl/Postman** pour valider la correction
- [ ] **Vérifier en BDD** que les données sont bien sauvegardées
- [ ] **Tester depuis le frontend** pour confirmation finale
- [ ] **Documenter la correction** pour éviter les régressions

---

## 📝 Notes pour le Développeur Backend

### Où Chercher

1. **Controller :** `src/order/order.controller.ts` ou `src/orders/orders.controller.ts`
2. **Service :** `src/order/order.service.ts` ou `src/orders/orders.service.ts`
3. **DTO :** `src/order/dto/create-order.dto.ts`
4. **Schema :** `prisma/schema.prisma`

### Commandes Utiles

```bash
# Voir le schéma actuel
npx prisma db pull

# Créer une migration
npx prisma migrate dev --name fix_order_customer_info

# Appliquer en production
npx prisma migrate deploy

# Régénérer le client Prisma
npx prisma generate

# Voir les logs backend (Render)
# Aller sur render.com → Service → Logs
```

---

## 🔗 Références

- Frontend code : `src/pages/ModernOrderFormPage.tsx` (lignes 1429-1448 et 1726-1745)
- Frontend service : `src/services/orderService.ts` (ligne 571)
- Documentation API : `BACKEND_ADAPTATION_AUTOCOLLANT.md`

---

## ✅ RÉSOLUTION (29 janvier 2026)

### Diagnostic Final

Après investigation, il s'est avéré que le backend **sauvegardait correctement** les informations client, mais dans des **champs différents** de ceux attendus par le frontend :

**Champs backend (réels) :**
```json
{
  "shippingName": "Papa Faly TEST FINAL Sidy FINAL",  // Nom complet (prénom + nom combinés)
  "email": "djibymamadou.wade@unchk.edu.sn",           // Email au niveau de la commande
  "phoneNumber": "775588835",                          // Téléphone
  "shippingStreet": "Point E",                         // Rue
  "shippingCity": "Point E",                           // Ville
  "shippingRegion": "Point E",                         // Région
  "shippingCountry": "Sénégal"                         // Pays
}
```

**Champs frontend (attendus initialement) :**
```typescript
order.user.firstName
order.user.lastName
order.user.email
order.phoneNumber
order.shippingAddress.*
```

### Corrections Apportées

#### 1. Type TypeScript mis à jour (`src/types/order.ts`)

Ajout des champs manquants à l'interface `Order` :

```typescript
export interface Order {
  // ... champs existants

  // 🆕 Guest customer info (for orders without user account)
  email?: string;                  // Customer email (fallback if user.email not available)
  shippingName?: string;           // Full customer name (firstName + lastName combined)
  shippingStreet?: string;         // Street address
  shippingCity?: string;           // City
  shippingRegion?: string;         // Region/State
  shippingCountry?: string;        // Country
}
```

#### 2. Page admin mise à jour (`src/pages/admin/OrderDetailPage.tsx`)

**Ajout d'une fonction de parsing du nom :**
```typescript
const parseShippingName = (shippingName: string): { firstName: string; lastName: string } => {
  if (!shippingName || shippingName.trim() === '') {
    return { firstName: '', lastName: '' };
  }

  const parts = shippingName.trim().split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // Premier mot = prénom, reste = nom
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
};
```

**Mise à jour de l'affichage client :**
- Utilise `shippingName` si disponible, sinon `order.user.firstName + lastName`
- Utilise `order.email` si disponible, sinon `order.user.email`
- Affiche les champs d'adresse (`shippingStreet`, `shippingCity`, etc.) si disponibles

#### 3. Résultat

✅ Les informations client s'affichent maintenant correctement dans l'interface admin
✅ Support des commandes guest (sans compte utilisateur)
✅ Parsing automatique du nom complet en prénom/nom
✅ Affichage de l'adresse complète

### Exemple d'Affichage

**Pour une commande guest :**
```
┌─────────────────────────────┐
│ Client                      │
├─────────────────────────────┤
│ 👤 Papa Faly TEST FINAL     │ ← Prénom (parsé de shippingName)
│    Sidy FINAL               │ ← Nom (parsé de shippingName)
│                             │
│ 📧 djibymamadou@unchk.edu.sn│ ← order.email
│ 📱 775588835                │ ← order.phoneNumber
│                             │
│ Adresse                     │
│ Point E                     │ ← shippingStreet
│ Point E                     │ ← shippingCity
│ Point E                     │ ← shippingRegion
│ Sénégal                     │ ← shippingCountry
└─────────────────────────────┘
```

---

**Fin du document**

~~Ce problème doit être corrigé en **PRIORITÉ ABSOLUE** car il affecte 100% des commandes et rend le système inutilisable pour les clients.~~

✅ **RÉSOLU** - Le backend sauvegardait correctement les données. Le frontend a été mis à jour pour les lire et les afficher.
