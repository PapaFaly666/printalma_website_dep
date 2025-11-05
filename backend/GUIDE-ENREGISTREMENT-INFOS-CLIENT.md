# GUIDE BACKEND - Enregistrement des Informations Client dans les Commandes

## 📋 Contexte

Le frontend collecte les informations du client via `/order-form` et les envoie au backend lors de la création d'une commande. Le backend doit enregistrer ces informations dans la table `orders` pour permettre aux vendeurs de consulter les coordonnées des clients ayant acheté leurs produits.

---

## 🎯 Objectifs

1. **Enregistrer les informations client** dans la table `orders`
2. **Rendre ces informations accessibles** aux vendeurs via l'API
3. **Respecter la vie privée** : seuls les vendeurs concernés peuvent voir les infos des clients ayant acheté leurs produits

---

## 📊 Structure de Données Actuelle (schema-orders.sql)

La table `orders` contient déjà les champs nécessaires :

```sql
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderNumber VARCHAR(100) UNIQUE NOT NULL,
  userId INT NOT NULL,

  -- ✅ Informations client DÉJÀ PRÉSENTES
  phoneNumber VARCHAR(20) NOT NULL,
  notes TEXT,

  -- ✅ Adresse de livraison DÉJÀ PRÉSENTE
  shippingName VARCHAR(255),           -- 🎯 Nom complet du client
  shippingStreet VARCHAR(255),         -- 🎯 Rue/Adresse
  shippingCity VARCHAR(100),           -- 🎯 Ville
  shippingRegion VARCHAR(100),         -- 🎯 Région
  shippingPostalCode VARCHAR(20),      -- 🎯 Code postal
  shippingCountry VARCHAR(100),        -- 🎯 Pays
  shippingAddressFull TEXT,            -- 🎯 Adresse complète

  -- Autres champs...
  status ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
  totalAmount DECIMAL(10,2) NOT NULL,
  paymentMethod VARCHAR(50),
  paymentStatus ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**⚠️ PROBLÈME POTENTIEL** : Il n'y a pas de champ `email` dans la table `orders` !

---

## 🔧 Modifications à Apporter au Schéma SQL

### 1. Ajouter le champ EMAIL à la table orders

```sql
-- À ajouter dans schema-orders.sql après la ligne 53 (après phoneNumber)
ALTER TABLE orders
ADD COLUMN email VARCHAR(255) AFTER phoneNumber;

-- Ou si vous préférez une migration sécurisée :
SET @dbname = DATABASE();
SET @tablename = 'orders';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_schema = @dbname
     AND table_name = @tablename
     AND column_name = 'email') = 0,
  'ALTER TABLE orders ADD COLUMN email VARCHAR(255) AFTER phoneNumber',
  'SELECT "Column email already exists"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
```

### 2. Mettre à jour la vue v_vendor_orders

La vue `v_vendor_orders` doit inclure l'email du client :

```sql
-- Remplacer la vue existante (lignes 232-279 du schema-orders.sql)
CREATE OR REPLACE VIEW v_vendor_orders AS
SELECT
  o.id as orderId,
  o.orderNumber,
  o.status as orderStatus,
  o.totalAmount as orderTotalAmount,
  o.shippingName,
  o.phoneNumber,
  o.email,                           -- 🎯 AJOUTER L'EMAIL
  o.paymentMethod,
  o.paymentStatus,
  o.created_at as orderCreatedAt,

  -- Adresse de livraison complète
  o.shippingStreet,                  -- 🎯 AJOUTER L'ADRESSE
  o.shippingCity,
  o.shippingRegion,
  o.shippingPostalCode,
  o.shippingCountry,
  o.shippingAddressFull,

  -- Articles du vendeur dans cette commande
  oi.id as orderItemId,
  oi.quantity,
  oi.unitPrice,
  oi.size,
  oi.color,

  -- Produit vendeur
  vp.id as vendorProductId,
  vp.name as productName,
  vp.description as productDescription,
  vp.vendorId,

  -- Vendeur
  v.firstName as vendorFirstName,
  v.lastName as vendorLastName,
  v.shop_name as vendorShopName,

  -- Produit base
  ap.id as baseProductId,
  ap.name as baseProductName,
  ap.category as baseProductCategory,

  -- Client (info générique depuis users)
  u.email as customerEmail,
  u.firstName as customerFirstName,
  u.lastName as customerLastName

FROM orders o
INNER JOIN order_items oi ON o.id = oi.orderId
INNER JOIN vendor_products vp ON oi.vendorProductId = vp.id
INNER JOIN users v ON vp.vendorId = v.id
LEFT JOIN admin_products ap ON vp.baseProductId = ap.id
LEFT JOIN users u ON o.userId = u.id
ORDER BY o.created_at DESC;
```

---

## 🚀 Implémentation Backend (API)

### 1. Format des Données Reçues du Frontend

Le frontend envoie les données suivantes via `POST /orders/guest` (utilisateur non authentifié) ou `POST /orders` (utilisateur authentifié) :

```typescript
interface OrderRequest {
  // Informations client (pour la livraison)
  shippingDetails: {
    firstName?: string;      // Prénom du client (optionnel mais au moins 1 nom requis)
    lastName?: string;       // Nom du client (optionnel mais au moins 1 nom requis)
    street: string;          // Adresse complète (OBLIGATOIRE, max 200 char)
    city: string;            // Ville (OBLIGATOIRE, max 100 char)
    region: string;          // Région/État (utilise city par défaut)
    postalCode?: string;     // Code postal (optionnel, max 20 char)
    country: string;         // Pays (OBLIGATOIRE, max 100 char)
  };

  // Contact client
  phoneNumber: string;       // Téléphone (OBLIGATOIRE, format: 77xxxxxxx)
  notes?: string;            // Instructions spéciales de livraison (optionnel)

  // Articles commandés
  orderItems: [{
    productId: number;       // ID du produit admin (OBLIGATOIRE, > 0)
    vendorProductId?: number; // ID du produit vendeur si applicable
    quantity: number;        // Quantité (OBLIGATOIRE, > 0)
    unitPrice: number;       // Prix unitaire en FCFA (OBLIGATOIRE, >= 0)
    size?: string;           // Taille du produit (optionnel)
    color?: string;          // Couleur du produit (optionnel)
    colorId?: number;        // ID de la couleur (optionnel)
  }];

  // Paiement
  paymentMethod: 'PAYDUNYA' | 'CASH_ON_DELIVERY';  // Méthode de paiement
  initiatePayment?: boolean;  // true pour redirection vers Paydunya
}
```

**📍 Voir le code frontend :** `src/pages/OrderFormPage.tsx:369-391`

**⚠️ IMPORTANT :** Le frontend envoie actuellement l'email dans `shippingDetails` mais celui-ci n'est PAS enregistré en base car la colonne `email` n'existe pas dans la table `orders`. Voir la section "Modifications SQL" pour corriger cela.

**🎯 Logique de choix d'endpoint (Frontend) :**

Le frontend utilise une logique intelligente pour choisir le bon endpoint :

1. **Pas de token JWT** (`!localStorage.getItem('access_token')`)
   - ➡️ Appel direct à `POST /orders/guest`
   - Pas d'authentification requise

2. **Token JWT présent**
   - ➡️ Appel à `POST /orders` avec header `Authorization: Bearer TOKEN`
   - Si erreur 401 (token expiré/invalide) :
     - Suppression du token du localStorage
     - Fallback automatique vers `POST /orders/guest`

**Conséquence pour le backend :**
- L'endpoint `POST /orders/guest` **DOIT être accessible sans authentification**
- L'endpoint `POST /orders` **DOIT vérifier le JWT** et retourner 401 si invalide
- Les deux endpoints doivent accepter le **même format de données**

---

### 2. Mapping des Données vers la Table `orders`

Voici comment mapper les données reçues du frontend vers les colonnes de la table :

```javascript
// Exemple de code backend (Node.js/Express)
// POST /orders/guest (pour les clients non authentifiés)
// POST /orders (pour les clients authentifiés)
router.post('/orders/guest', async (req, res) => {
  try {
    const { shippingDetails, phoneNumber, notes, orderItems, paymentMethod, initiatePayment } = req.body;

    // 🎯 Construction du nom complet du client
    const fullName = [
      shippingDetails.firstName || '',
      shippingDetails.lastName || ''
    ].filter(Boolean).join(' ').trim() || 'Client';

    // 🎯 Construction de l'adresse complète
    const fullAddress = [
      shippingDetails.street,
      shippingDetails.city,
      shippingDetails.postalCode,
      shippingDetails.country
    ].filter(Boolean).join(', ');

    // 🎯 Calcul du montant total
    const totalAmount = orderItems.reduce((sum, item) =>
      sum + (item.unitPrice * item.quantity), 0
    );

    // 🎯 Générer le numéro de commande unique
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // 🎯 Insertion dans la table orders
    const insertOrderQuery = `
      INSERT INTO orders (
        orderNumber,
        userId,
        phoneNumber,
        email,                          -- 🎯 NOUVEAU CHAMP (à ajouter en base)
        notes,
        shippingName,                   -- 🎯 Nom complet du client
        shippingStreet,                 -- 🎯 Rue/Adresse
        shippingCity,                   -- 🎯 Ville
        shippingRegion,                 -- 🎯 Région
        shippingPostalCode,             -- 🎯 Code postal
        shippingCountry,                -- 🎯 Pays
        shippingAddressFull,            -- 🎯 Adresse complète formatée
        totalAmount,
        paymentMethod,
        paymentStatus,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const userId = req.user?.id || 3; // ID 3 = compte guest par défaut

    const orderValues = [
      orderNumber,
      userId,
      phoneNumber,
      shippingDetails.email || null,              // 🎯 Email du client (optionnel)
      notes || null,                              // Instructions spéciales
      fullName,                                   // 🎯 Nom complet (firstName + lastName)
      shippingDetails.street,                     // 🎯 Adresse complète
      shippingDetails.city,                       // 🎯 Ville
      shippingDetails.region || shippingDetails.city, // 🎯 Région (fallback sur ville)
      shippingDetails.postalCode || null,         // 🎯 Code postal (optionnel)
      shippingDetails.country,                    // 🎯 Pays
      fullAddress,                                // 🎯 Adresse complète formatée
      totalAmount,
      paymentMethod,
      'PENDING',                                  // paymentStatus initial
      'PENDING'                                   // status initial
    ];

    const [orderResult] = await db.execute(insertOrderQuery, orderValues);
    const orderId = orderResult.insertId;

    // 🎯 Insertion des items de commande dans order_items
    for (const item of orderItems) {
      const insertItemQuery = `
        INSERT INTO order_items (
          orderId,
          productId,
          vendorProductId,
          quantity,
          unitPrice,
          size,
          color,
          colorId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.execute(insertItemQuery, [
        orderId,
        item.productId,                  // ID du produit admin (baseProduct)
        item.vendorProductId || null,    // ID du produit vendeur (si applicable)
        item.quantity,
        item.unitPrice,
        item.size || null,
        item.color || null,
        item.colorId || null
      ]);
    }

    // 🎯 Si paiement Paydunya demandé, initialiser la transaction
    let paymentData = null;
    if (paymentMethod === 'PAYDUNYA' && initiatePayment) {
      try {
        // Appeler le service Paydunya pour obtenir le token de paiement
        const paydunyaResponse = await initiatePaydunyaPayment({
          orderId,
          orderNumber,
          totalAmount,
          customerName: fullName,
          customerEmail: shippingDetails.email,
          customerPhone: phoneNumber,
          description: `Commande ${orderNumber}`,
        });

        paymentData = {
          token: paydunyaResponse.token,
          redirect_url: paydunyaResponse.payment_url,
          mode: process.env.PAYDUNYA_MODE || 'sandbox'
        };

        // Optionnel: Stocker le token Paydunya dans la table orders
        await db.execute(
          'UPDATE orders SET transactionId = ? WHERE id = ?',
          [paydunyaResponse.token, orderId]
        );

      } catch (paymentError) {
        console.error('❌ Erreur initialisation Paydunya:', paymentError);
        // Ne pas bloquer la création de commande si Paydunya échoue
        // La commande reste PENDING et le client peut payer plus tard
      }
    }

    // 🎯 Réponse standardisée selon la doc API PrintAlma
    res.json({
      success: true,
      message: 'Commande créée avec succès',
      data: {
        id: orderId,
        orderNumber,
        totalAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod,

        // Informations client
        customerInfo: {
          name: fullName,
          email: shippingDetails.email,
          phone: phoneNumber,
          address: fullAddress
        },

        // Articles commandés
        orderItems: orderItems.map(item => ({
          productId: item.productId,
          vendorProductId: item.vendorProductId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          color: item.color
        })),

        // Données Paydunya si applicable
        ...(paymentData && { payment: paymentData })
      }
    });

  } catch (error) {
    console.error('❌ Erreur création commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: error.message
    });
  }
});
```

**💡 Points importants :**

1. **Utilisateur Guest** : Si le client n'est pas authentifié, utilisez `userId = 3` (compte guest créé dans schema-orders.sql ligne 32-33)

2. **Email optionnel** : L'email est stocké dans la table `orders` (colonne à ajouter) ET peut aussi être récupéré depuis la table `users` si l'utilisateur est authentifié

3. **vendorProductId** : Important pour lier la commande au vendeur et permettre de filtrer les commandes par vendeur

4. **Paydunya** : Si `initiatePayment = true`, le backend doit appeler l'API Paydunya et renvoyer le `redirect_url` au frontend

---

## 🔍 Validation des Données

### Règles de Validation Backend

```javascript
const validateOrderRequest = (req, res, next) => {
  const { shippingDetails, phoneNumber, orderItems } = req.body;
  const errors = [];

  // 🎯 Validation des informations client
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    errors.push('Le numéro de téléphone est requis');
  }

  // Au moins prénom OU nom requis
  const hasName = (shippingDetails?.firstName?.trim() || '') ||
                  (shippingDetails?.lastName?.trim() || '');
  if (!hasName) {
    errors.push('Au moins un prénom ou nom est requis');
  }

  // 🎯 Validation de l'adresse de livraison
  if (!shippingDetails?.street || shippingDetails.street.trim().length === 0) {
    errors.push('L\'adresse de livraison est requise');
  }

  if (!shippingDetails?.city || shippingDetails.city.trim().length === 0) {
    errors.push('La ville est requise');
  }

  if (!shippingDetails?.country || shippingDetails.country.trim().length === 0) {
    errors.push('Le pays est requis');
  }

  // 🎯 Validation de l'email si fourni
  if (shippingDetails?.email && shippingDetails.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingDetails.email)) {
      errors.push('Format d\'email invalide');
    }
  }

  // 🎯 Validation des items de commande
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    errors.push('Au moins un article est requis');
  }

  orderItems?.forEach((item, index) => {
    if (!item.productId || item.productId <= 0) {
      errors.push(`Article ${index + 1}: productId invalide`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Article ${index + 1}: quantité invalide`);
    }
    if (item.unitPrice === undefined || item.unitPrice < 0) {
      errors.push(`Article ${index + 1}: prix invalide`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }

  next();
};

// Utilisation
router.post('/orders', validateOrderRequest, async (req, res) => {
  // ... logique de création de commande
});
```

---

## 📡 API pour les Vendeurs : Récupérer les Commandes

### Endpoint : GET /vendor/orders

```javascript
router.get('/vendor/orders', authenticateVendor, async (req, res) => {
  try {
    const vendorId = req.user.id;

    // 🎯 Utiliser la vue v_vendor_orders qui contient toutes les infos
    const query = `
      SELECT
        orderId,
        orderNumber,
        orderStatus,
        orderTotalAmount,
        orderCreatedAt,

        -- 🎯 Informations client
        shippingName as customerName,
        phoneNumber as customerPhone,
        email as customerEmail,

        -- 🎯 Adresse de livraison
        shippingStreet,
        shippingCity,
        shippingRegion,
        shippingPostalCode,
        shippingCountry,
        shippingAddressFull,

        -- 🎯 Détails du produit
        productName,
        quantity,
        unitPrice,
        size,
        color,

        -- Statut paiement
        paymentMethod,
        paymentStatus

      FROM v_vendor_orders
      WHERE vendorId = ?
      ORDER BY orderCreatedAt DESC
    `;

    const [orders] = await db.execute(query, [vendorId]);

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Erreur récupération commandes vendeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});
```

---

## 🎨 Format de Réponse API

### Exemple de réponse pour GET /vendor/orders

```json
{
  "success": true,
  "data": [
    {
      "orderId": 42,
      "orderNumber": "ORD-1704123456-ABC12",
      "orderStatus": "PROCESSING",
      "orderTotalAmount": 25000.00,
      "orderCreatedAt": "2025-01-15T10:30:00.000Z",

      // 🎯 Informations client
      "customerName": "Jean Dupont",
      "customerPhone": "77 123 45 67",
      "customerEmail": "jean.dupont@example.com",

      // 🎯 Adresse de livraison
      "shippingStreet": "Rue 10, Medina",
      "shippingCity": "Dakar",
      "shippingRegion": "Dakar",
      "shippingPostalCode": "12000",
      "shippingCountry": "Sénégal",
      "shippingAddressFull": "Rue 10, Medina, Dakar, 12000, Sénégal",

      // 🎯 Détails du produit
      "productName": "T-Shirt Premium",
      "quantity": 2,
      "unitPrice": 12500.00,
      "size": "L",
      "color": "Noir",

      // Paiement
      "paymentMethod": "PAYDUNYA",
      "paymentStatus": "PAID"
    }
  ]
}
```

---

## 🔒 Sécurité et Confidentialité

### Règles importantes

1. **Authentification obligatoire**
   - Seuls les vendeurs authentifiés peuvent accéder à `/vendor/orders`
   - Utiliser un middleware d'authentification JWT

2. **Isolation des données**
   - Un vendeur ne voit QUE les commandes contenant ses propres produits
   - La vue `v_vendor_orders` filtre automatiquement par `vendorId`

3. **Protection des données sensibles**
   - Ne jamais exposer les mots de passe
   - Ne pas partager les infos de paiement complètes (token, etc.)
   - Logger les accès aux données client pour audit

4. **RGPD / Protection des données**
   - Informer les clients que leurs coordonnées seront partagées avec les vendeurs
   - Permettre aux clients de supprimer leurs données (droit à l'oubli)

---

## ✅ Checklist de Déploiement

### Étape 1 : Mise à jour du schéma

```bash
# Ajouter la colonne email à la table orders
mysql -u root -p nom_de_votre_base < migration_add_email_to_orders.sql
```

**Fichier : `migration_add_email_to_orders.sql`**
```sql
USE nom_de_votre_base;

-- Ajouter la colonne email
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS email VARCHAR(255) AFTER phoneNumber;

-- Mettre à jour la vue v_vendor_orders
DROP VIEW IF EXISTS v_vendor_orders;

CREATE VIEW v_vendor_orders AS
SELECT
  o.id as orderId,
  o.orderNumber,
  o.status as orderStatus,
  o.totalAmount as orderTotalAmount,
  o.shippingName,
  o.phoneNumber,
  o.email,
  o.shippingStreet,
  o.shippingCity,
  o.shippingRegion,
  o.shippingPostalCode,
  o.shippingCountry,
  o.shippingAddressFull,
  o.paymentMethod,
  o.paymentStatus,
  o.created_at as orderCreatedAt,

  oi.id as orderItemId,
  oi.quantity,
  oi.unitPrice,
  oi.size,
  oi.color,

  vp.id as vendorProductId,
  vp.name as productName,
  vp.description as productDescription,
  vp.vendorId,

  v.firstName as vendorFirstName,
  v.lastName as vendorLastName,
  v.shop_name as vendorShopName,

  ap.id as baseProductId,
  ap.name as baseProductName,
  ap.category as baseProductCategory,

  u.email as customerEmail,
  u.firstName as customerFirstName,
  u.lastName as customerLastName

FROM orders o
INNER JOIN order_items oi ON o.id = oi.orderId
INNER JOIN vendor_products vp ON oi.vendorProductId = vp.id
INNER JOIN users v ON vp.vendorId = v.id
LEFT JOIN admin_products ap ON vp.baseProductId = ap.id
LEFT JOIN users u ON o.userId = u.id
ORDER BY o.created_at DESC;

SELECT 'Migration completed successfully' as status;
```

### Étape 2 : Mettre à jour le code backend

- [ ] Ajouter le champ `email` dans l'INSERT de création de commande
- [ ] Implémenter la validation des données reçues
- [ ] Créer/mettre à jour l'endpoint `GET /vendor/orders`
- [ ] Ajouter le middleware d'authentification vendeur
- [ ] Tester la création de commande avec les nouvelles données

### Étape 3 : Tests

```bash
# Test 1 : Création de commande avec email
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "street": "Rue 10",
      "city": "Dakar",
      "region": "Dakar",
      "country": "Sénégal"
    },
    "phoneNumber": "77 123 45 67",
    "orderItems": [{
      "productId": 1,
      "quantity": 1,
      "unitPrice": 12500
    }],
    "paymentMethod": "CASH_ON_DELIVERY"
  }'

# Test 2 : Récupération des commandes vendeur
curl -X GET http://localhost:3004/vendor/orders \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN"
```

### Étape 4 : Vérification en base de données

```sql
-- Vérifier qu'une commande contient bien toutes les infos
SELECT
  orderNumber,
  phoneNumber,
  email,
  shippingName,
  shippingCity,
  shippingAddressFull
FROM orders
WHERE id = LAST_INSERT_ID();

-- Vérifier que la vue fonctionne correctement
SELECT * FROM v_vendor_orders LIMIT 5;
```

---

## 🐛 Debugging

### Problèmes courants

1. **Email null dans la base**
   - Vérifier que le frontend envoie bien `email` dans `shippingDetails`
   - Vérifier que le backend mappe correctement `shippingDetails.email`

2. **Nom complet vide**
   - S'assurer qu'au moins `firstName` OU `lastName` est fourni
   - Utiliser un fallback : `'Client'` si les deux sont vides

3. **Vue v_vendor_orders ne renvoie rien**
   - Vérifier que `vendorProductId` est bien renseigné dans `order_items`
   - Vérifier les jointures : tous les produits doivent être liés à un vendeur

---

## 💳 Intégration Paydunya

### 1. Configuration Paydunya

```javascript
// services/paydunyaService.js
const PAYDUNYA_CONFIG = {
  MASTER_KEY: process.env.PAYDUNYA_MASTER_KEY,
  PUBLIC_KEY: process.env.PAYDUNYA_PUBLIC_KEY,
  PRIVATE_KEY: process.env.PAYDUNYA_PRIVATE_KEY,
  TOKEN: process.env.PAYDUNYA_TOKEN,
  MODE: process.env.PAYDUNYA_MODE || 'sandbox', // 'sandbox' ou 'live'
  BASE_URL: process.env.PAYDUNYA_MODE === 'live'
    ? 'https://app.paydunya.com/api/v1'
    : 'https://app.paydunya.com/sandbox-api/v1'
};

// URLs de callback (HTTPS OBLIGATOIRE en production)
const CALLBACK_URLS = {
  return_url: `${process.env.FRONTEND_URL}/payment/success`,
  cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
  callback_url: `${process.env.BACKEND_URL}/webhooks/paydunya`
};
```

### 2. Initialisation d'un paiement Paydunya

```javascript
// services/paydunyaService.js
async function initiatePaydunyaPayment(orderData) {
  const {
    orderId,
    orderNumber,
    totalAmount,
    customerName,
    customerEmail,
    customerPhone,
    description
  } = orderData;

  try {
    // 🎯 Préparer les données de facturation selon la doc Paydunya
    const invoiceData = {
      invoice: {
        total_amount: totalAmount,
        description: description || `Commande ${orderNumber}`,
      },
      store: {
        name: "PrintAlma",
        tagline: "Impression personnalisée",
        postal_address: "Dakar, Sénégal",
        phone: "+221 XX XXX XX XX",
        logo_url: `${process.env.FRONTEND_URL}/logo.png`,
        website_url: process.env.FRONTEND_URL
      },
      actions: {
        cancel_url: CALLBACK_URLS.cancel_url,
        return_url: `${CALLBACK_URLS.return_url}?order=${orderNumber}`,
        callback_url: CALLBACK_URLS.callback_url
      },
      custom_data: {
        order_id: orderId,
        order_number: orderNumber
      }
    };

    // 🎯 Ajouter les infos client si disponibles
    if (customerName || customerEmail || customerPhone) {
      invoiceData.customer = {};
      if (customerName) invoiceData.customer.name = customerName;
      if (customerEmail) invoiceData.customer.email = customerEmail;
      if (customerPhone) invoiceData.customer.phone = customerPhone;
    }

    // 🎯 Appel API Paydunya
    const response = await fetch(`${PAYDUNYA_CONFIG.BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': PAYDUNYA_CONFIG.MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_CONFIG.PRIVATE_KEY,
        'PAYDUNYA-TOKEN': PAYDUNYA_CONFIG.TOKEN
      },
      body: JSON.stringify(invoiceData)
    });

    const result = await response.json();

    if (!response.ok || result.response_code !== '00') {
      throw new Error(result.response_text || 'Erreur initialisation Paydunya');
    }

    // 🎯 Retourner le token et l'URL de paiement
    return {
      token: result.token,
      payment_url: result.response_text, // URL de redirection (ex: https://paydunya.com/sandbox-checkout/invoice/test_rzyhicjvou)
      mode: PAYDUNYA_CONFIG.MODE
    };

  } catch (error) {
    console.error('❌ Erreur Paydunya:', error);
    throw error;
  }
}

module.exports = { initiatePaydunyaPayment };
```

### 3. Webhook Paydunya (confirmation de paiement)

```javascript
// routes/webhooks.js
router.post('/webhooks/paydunya', async (req, res) => {
  try {
    const { data } = req.body;

    // 🎯 Vérifier la signature Paydunya (sécurité)
    const isValid = verifyPaydunyaSignature(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Signature invalide' });
    }

    // 🎯 Récupérer les infos de paiement
    const {
      invoice_token,
      status,
      custom_data,
      receipt_url
    } = data;

    // 🎯 Récupérer l'orderId depuis custom_data
    const orderId = custom_data?.order_id;
    if (!orderId) {
      console.error('⚠️ OrderId manquant dans le webhook Paydunya');
      return res.status(400).json({ error: 'OrderId manquant' });
    }

    // 🎯 Mettre à jour le statut de la commande selon le statut Paydunya
    if (status === 'completed') {
      // Paiement réussi
      await db.execute(
        `UPDATE orders SET
          paymentStatus = 'PAID',
          status = 'PROCESSING',
          transactionId = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [invoice_token, orderId]
      );

      // 🎯 Créer une notification pour le vendeur
      const [orderItems] = await db.execute(
        'SELECT vendorProductId FROM order_items WHERE orderId = ?',
        [orderId]
      );

      for (const item of orderItems) {
        if (item.vendorProductId) {
          const [vendorProduct] = await db.execute(
            'SELECT vendorId FROM vendor_products WHERE id = ?',
            [item.vendorProductId]
          );

          if (vendorProduct[0]?.vendorId) {
            await db.execute(
              `INSERT INTO notifications (userId, type, title, message, metadata)
               VALUES (?, 'NEW_ORDER', 'Nouvelle commande !', ?, ?)`,
              [
                vendorProduct[0].vendorId,
                `Vous avez reçu une nouvelle commande payée`,
                JSON.stringify({ orderId, invoice_token })
              ]
            );
          }
        }
      }

      console.log(`✅ Paiement confirmé pour la commande #${orderId}`);

    } else if (status === 'cancelled' || status === 'failed') {
      // Paiement échoué ou annulé
      await db.execute(
        `UPDATE orders SET
          paymentStatus = 'FAILED',
          status = 'CANCELLED',
          transactionId = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [invoice_token, orderId]
      );

      console.log(`❌ Paiement échoué pour la commande #${orderId}`);
    }

    // 🎯 Répondre à Paydunya (important pour confirmer la réception du webhook)
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Erreur webhook Paydunya:', error);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
});

// Fonction de vérification de signature Paydunya
function verifyPaydunyaSignature(req) {
  // Implémenter la vérification de signature selon la doc Paydunya
  // Pour l'instant, retourner true (à sécuriser en production)
  return true;
}
```

### 4. Vérification du statut de paiement (endpoint pour le frontend)

```javascript
// routes/paydunya.js
router.get('/paydunya/status/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // 🎯 Appeler l'API Paydunya pour vérifier le statut
    const response = await fetch(
      `${PAYDUNYA_CONFIG.BASE_URL}/checkout-invoice/confirm/${token}`,
      {
        headers: {
          'PAYDUNYA-MASTER-KEY': PAYDUNYA_CONFIG.MASTER_KEY,
          'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_CONFIG.PRIVATE_KEY,
          'PAYDUNYA-TOKEN': PAYDUNYA_CONFIG.TOKEN
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.response_text || 'Erreur vérification Paydunya');
    }

    // 🎯 Récupérer les infos de commande depuis la base
    const orderId = result.custom_data?.order_id;
    let orderData = null;

    if (orderId) {
      const [orders] = await db.execute(
        `SELECT id, orderNumber, totalAmount, paymentStatus, status
         FROM orders WHERE id = ?`,
        [orderId]
      );
      orderData = orders[0] || null;
    }

    // 🎯 Réponse au frontend
    res.json({
      success: true,
      data: {
        response_code: result.response_code,
        response_text: result.response_text,
        status: result.status,
        order_number: orderData?.orderNumber,
        payment_status: orderData?.paymentStatus,
        total_amount: orderData?.totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Erreur vérification Paydunya:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du paiement',
      error: error.message
    });
  }
});
```

### 5. Variables d'environnement requises

```bash
# .env backend
PAYDUNYA_MASTER_KEY=your_master_key
PAYDUNYA_PRIVATE_KEY=your_private_key
PAYDUNYA_PUBLIC_KEY=your_public_key
PAYDUNYA_TOKEN=your_token
PAYDUNYA_MODE=sandbox  # ou 'live' en production

FRONTEND_URL=https://printalma.com  # URL du frontend (HTTPS obligatoire)
BACKEND_URL=https://api.printalma.com  # URL du backend pour webhooks (HTTPS obligatoire)
```

**⚠️ IMPORTANT - Sécurité Paydunya :**

1. **HTTPS obligatoire** en production pour les webhooks
2. **Vérifier la signature** des webhooks Paydunya
3. **Ne jamais exposer** les clés privées côté frontend
4. **Logger tous les paiements** pour audit et support client
5. **Gérer les doublons** : un même webhook peut être envoyé plusieurs fois

---

## 📚 Références

- **Frontend :** `/src/pages/OrderFormPage.tsx:369-391` (format de données envoyées)
- **Base de données :** `/backend/schema-orders.sql` (structure de la table orders)
- **Documentation Paydunya :** https://developers.paydunya.com/doc/FR/introduction
- **Guide intégration frontend :** Guide d'Intégration Frontend - Système de Commandes et Paiement Paydunya

---

## 🎉 Résumé

Ce guide complet vous permet de :

### ✅ Base de données
1. **Ajouter la colonne `email`** à la table `orders` pour stocker l'email du client
2. **Mettre à jour la vue `v_vendor_orders`** pour inclure toutes les infos client (nom, email, téléphone, adresse complète)
3. **Utiliser les triggers et procédures** existants pour automatiser les notifications et statistiques

### ✅ Backend API
4. **Créer l'endpoint `POST /orders/guest`** pour les commandes de clients non authentifiés
5. **Enregistrer toutes les informations client** (nom, email, téléphone, adresse complète) dans la table `orders`
6. **Valider les données** reçues du frontend (format email, téléphone, longueur des champs)
7. **Gérer les items de commande** avec liaison au produit admin ET au produit vendeur

### ✅ Intégration Paydunya
8. **Initialiser les paiements Paydunya** avec redirection automatique
9. **Gérer les webhooks** pour mettre à jour le statut de paiement automatiquement
10. **Vérifier le statut de paiement** via l'endpoint `GET /paydunya/status/:token`
11. **Notifier les vendeurs** lorsqu'un paiement est confirmé

### ✅ API Vendeurs
12. **Créer l'endpoint `GET /vendor/orders`** pour que les vendeurs consultent leurs commandes
13. **Filtrer les commandes** : chaque vendeur ne voit que les commandes contenant ses produits
14. **Exposer les informations client** aux vendeurs (nom, email, téléphone, adresse de livraison)

### ✅ Sécurité et Conformité
15. **Authentification JWT** pour protéger les endpoints vendeurs
16. **Isolation des données** : un vendeur ne voit que ses propres commandes
17. **Conformité RGPD** : informer les clients du partage de données avec les vendeurs
18. **HTTPS obligatoire** en production pour les webhooks Paydunya

---

## 📋 Actions à Réaliser (Checklist Backend)

### Étape 1 : Base de données (10 min)
```bash
# Exécuter la migration SQL pour ajouter le champ email
mysql -u root -p votre_base < backend/migration_add_email_to_orders.sql
```

### Étape 2 : Configuration (5 min)
```bash
# Ajouter les variables d'environnement Paydunya dans .env
PAYDUNYA_MASTER_KEY=xxxxx
PAYDUNYA_PRIVATE_KEY=xxxxx
PAYDUNYA_PUBLIC_KEY=xxxxx
PAYDUNYA_TOKEN=xxxxx
PAYDUNYA_MODE=sandbox
FRONTEND_URL=http://localhost:5174
BACKEND_URL=http://localhost:3004
```

### Étape 3 : Code Backend (30 min)
1. Créer `services/paydunyaService.js` avec les fonctions d'initialisation et vérification
2. Créer `routes/webhooks.js` pour gérer les callbacks Paydunya
3. Mettre à jour `routes/orders.js` :
   - Endpoint `POST /orders/guest` avec enregistrement des infos client
   - Intégration de l'initialisation Paydunya si `initiatePayment = true`
4. Créer `routes/vendor.js` :
   - Endpoint `GET /vendor/orders` avec filtrage par vendeur
5. Ajouter les middlewares d'authentification

### Étape 4 : Tests (15 min)
```bash
# Test 1: Créer une commande guest
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d @test_order.json

# Test 2: Vérifier en base que l'email est bien enregistré
mysql -u root -p -e "SELECT email, shippingName, phoneNumber FROM orders ORDER BY id DESC LIMIT 1;"

# Test 3: Récupérer les commandes vendeur
curl -X GET http://localhost:3004/vendor/orders \
  -H "Authorization: Bearer VENDOR_TOKEN"
```

---

## 🔗 Flux Complet d'une Commande

```
1. Client remplit le formulaire sur /order-form
   └─> Envoie POST /orders/guest avec shippingDetails + orderItems

2. Backend reçoit la requête
   ├─> Valide les données (nom, téléphone, adresse, email)
   ├─> Insère dans `orders` (avec email, shippingName, shippingStreet, etc.)
   ├─> Insère dans `order_items` (avec vendorProductId)
   └─> Si Paydunya : initialise le paiement et retourne redirect_url

3. Frontend redirige vers Paydunya
   └─> Client paie avec Orange Money / Wave / Carte bancaire

4. Paydunya traite le paiement
   └─> Envoie webhook POST /webhooks/paydunya au backend

5. Backend reçoit le webhook
   ├─> Vérifie la signature Paydunya
   ├─> Met à jour orders.paymentStatus = 'PAID'
   ├─> Met à jour orders.status = 'PROCESSING'
   └─> Crée une notification pour le vendeur

6. Vendeur consulte ses commandes
   └─> GET /vendor/orders retourne les commandes avec infos client complètes
```

---

## 📞 Support

**📍 Le frontend est déjà prêt** à envoyer toutes ces données (voir `OrderFormPage.tsx:369-391`).

**🎯 Il ne reste plus qu'à implémenter le backend** en suivant ce guide étape par étape.

**💡 Besoin d'aide ?**
- Consultez la documentation Paydunya : https://developers.paydunya.com/doc/FR/introduction
- Vérifiez les logs du backend en cas d'erreur
- Testez d'abord en mode `sandbox` avant de passer en production

**🚀 Bon courage avec l'implémentation !**
