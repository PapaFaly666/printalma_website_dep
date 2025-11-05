# 🚨 URGENT - Backend Non Implémenté : Endpoint `/orders/guest`

## ❌ Problème Actuel

Le frontend essaie de créer une commande en appelant `POST /orders/guest`, mais le backend **ne renvoie pas l'URL de redirection PayDunya**.

**Erreur dans la console frontend :**
```
❌ [OrderForm] Erreur lors du processus de commande: Error: URL de redirection PayDunya non reçue
```

---

## 🎯 Ce que le Backend DOIT Faire

### Endpoint Requis

**`POST /orders/guest`** - Créer une commande pour un utilisateur non authentifié

**Authentification :** ❌ **AUCUNE** (endpoint public)

---

## 📥 Données Reçues du Frontend

### Format de la Requête

```http
POST /orders/guest HTTP/1.1
Content-Type: application/json

{
  "shippingDetails": {
    "firstName": "Moussa",
    "lastName": "Diop",
    "street": "Rue 10, Médina",
    "city": "Dakar",
    "region": "Dakar",
    "postalCode": "12000",
    "country": "Sénégal"
  },
  "phoneNumber": "77 123 45 67",
  "notes": "Livraison entre 14h et 18h",
  "orderItems": [
    {
      "productId": 1,
      "vendorProductId": 5,
      "quantity": 2,
      "unitPrice": 12500,
      "size": "L",
      "color": "Noir",
      "colorId": 1
    }
  ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true
}
```

**🔍 Voir le fichier exemple :** `backend/test_order_example.json`

---

## 📤 Réponse Attendue par le Frontend

### Format de la Réponse (Succès avec PayDunya)

**⚠️ STRUCTURE EXACTE ATTENDUE PAR LE FRONTEND :**

```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 123,
    "orderNumber": "ORD-1704123456-ABC12",
    "totalAmount": 25000,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "paymentMethod": "PAYDUNYA",

    "customerInfo": {
      "name": "Moussa Diop",
      "email": null,
      "phone": "77 123 45 67",
      "address": "Rue 10, Médina, Dakar, 12000, Sénégal"
    },

    "orderItems": [
      {
        "productId": 1,
        "vendorProductId": 5,
        "quantity": 2,
        "unitPrice": 12500,
        "size": "L",
        "color": "Noir"
      }
    ],

    "payment": {
      "token": "abc123xyz456def789",
      "redirect_url": "https://app.paydunya.com/sandbox-checkout/invoice/abc123xyz456def789",
      "mode": "sandbox"
    }
  }
}
```

**🎯 POINTS CRITIQUES :**

1. ✅ `success: true` **OBLIGATOIRE**
2. ✅ `data.payment.redirect_url` **OBLIGATOIRE** si `paymentMethod === 'PAYDUNYA'`
3. ✅ `data.payment.token` **OBLIGATOIRE** (token PayDunya pour vérification ultérieure)
4. ✅ `data.id` et `data.orderNumber` **OBLIGATOIRES** pour traçabilité

---

## 🚀 Implémentation Backend Minimale (Node.js/Express)

### 1. Route de Base (Sans PayDunya)

```javascript
// routes/orders.js
const express = require('express');
const router = express.Router();

// POST /orders/guest - Créer une commande guest
router.post('/orders/guest', async (req, res) => {
  try {
    const { shippingDetails, phoneNumber, notes, orderItems, paymentMethod, initiatePayment } = req.body;

    // 🎯 1. Valider les données
    if (!phoneNumber || !shippingDetails?.city || !shippingDetails?.country) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes',
        errors: ['Téléphone, ville et pays sont requis']
      });
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Panier vide',
        errors: ['Au moins un article est requis']
      });
    }

    // 🎯 2. Construire le nom complet du client
    const fullName = [
      shippingDetails.firstName || '',
      shippingDetails.lastName || ''
    ].filter(Boolean).join(' ').trim() || 'Client';

    // 🎯 3. Construire l'adresse complète
    const fullAddress = [
      shippingDetails.street,
      shippingDetails.city,
      shippingDetails.postalCode,
      shippingDetails.country
    ].filter(Boolean).join(', ');

    // 🎯 4. Calculer le montant total
    const totalAmount = orderItems.reduce((sum, item) =>
      sum + (item.unitPrice * item.quantity), 0
    );

    // 🎯 5. Générer le numéro de commande
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // 🎯 6. Insérer dans la base de données
    const insertOrderQuery = `
      INSERT INTO orders (
        orderNumber,
        userId,
        phoneNumber,
        email,
        notes,
        shippingName,
        shippingStreet,
        shippingCity,
        shippingRegion,
        shippingPostalCode,
        shippingCountry,
        shippingAddressFull,
        totalAmount,
        paymentMethod,
        paymentStatus,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [orderResult] = await db.execute(insertOrderQuery, [
      orderNumber,
      3,                                      // userId = 3 (guest user)
      phoneNumber,
      shippingDetails.email || null,
      notes || null,
      fullName,
      shippingDetails.street,
      shippingDetails.city,
      shippingDetails.region || shippingDetails.city,
      shippingDetails.postalCode || null,
      shippingDetails.country,
      fullAddress,
      totalAmount,
      paymentMethod,
      'PENDING',
      'PENDING'
    ]);

    const orderId = orderResult.insertId;

    // 🎯 7. Insérer les items de commande
    for (const item of orderItems) {
      await db.execute(
        `INSERT INTO order_items (orderId, productId, vendorProductId, quantity, unitPrice, size, color, colorId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.vendorProductId || null,
          item.quantity,
          item.unitPrice,
          item.size || null,
          item.color || null,
          item.colorId || null
        ]
      );
    }

    // 🎯 8. Si paiement PayDunya, initialiser la transaction
    let paymentData = null;

    if (paymentMethod === 'PAYDUNYA' && initiatePayment) {
      try {
        // ⚠️ APPEL PAYDUNYA ICI
        const paydunyaResponse = await initiatePaydunyaPayment({
          orderId,
          orderNumber,
          totalAmount,
          customerName: fullName,
          customerEmail: shippingDetails.email,
          customerPhone: phoneNumber,
          description: `Commande ${orderNumber}`
        });

        paymentData = {
          token: paydunyaResponse.token,
          redirect_url: paydunyaResponse.payment_url,
          mode: process.env.PAYDUNYA_MODE || 'sandbox'
        };

        // Sauvegarder le token PayDunya dans la commande
        await db.execute(
          'UPDATE orders SET transactionId = ? WHERE id = ?',
          [paydunyaResponse.token, orderId]
        );

      } catch (paymentError) {
        console.error('❌ Erreur PayDunya:', paymentError);
        // Ne pas bloquer la création de commande
        // La commande reste PENDING, le client peut payer plus tard
      }
    }

    // 🎯 9. Réponse au frontend
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

        customerInfo: {
          name: fullName,
          email: shippingDetails.email || null,
          phone: phoneNumber,
          address: fullAddress
        },

        orderItems: orderItems.map(item => ({
          productId: item.productId,
          vendorProductId: item.vendorProductId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          color: item.color
        })),

        // ⚠️ CRUCIAL : Ajouter payment seulement si PayDunya est initialisé
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

module.exports = router;
```

---

### 2. Fonction d'Initialisation PayDunya

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

  // Configuration PayDunya
  const PAYDUNYA_CONFIG = {
    MASTER_KEY: process.env.PAYDUNYA_MASTER_KEY,
    PRIVATE_KEY: process.env.PAYDUNYA_PRIVATE_KEY,
    TOKEN: process.env.PAYDUNYA_TOKEN,
    MODE: process.env.PAYDUNYA_MODE || 'sandbox',
    BASE_URL: process.env.PAYDUNYA_MODE === 'live'
      ? 'https://app.paydunya.com/api/v1'
      : 'https://app.paydunya.com/sandbox-api/v1'
  };

  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3004';

  // Préparer les données de facturation PayDunya
  const invoiceData = {
    invoice: {
      total_amount: totalAmount,
      description: description || `Commande ${orderNumber}`
    },
    store: {
      name: "PrintAlma",
      tagline: "Impression personnalisée",
      postal_address: "Dakar, Sénégal",
      phone: "+221 XX XXX XX XX",
      logo_url: `${FRONTEND_URL}/logo.png`,
      website_url: FRONTEND_URL
    },
    actions: {
      cancel_url: `${FRONTEND_URL}/payment/cancel`,
      return_url: `${FRONTEND_URL}/payment/success?order=${orderNumber}`,
      callback_url: `${BACKEND_URL}/webhooks/paydunya`
    },
    custom_data: {
      order_id: orderId,
      order_number: orderNumber
    }
  };

  // Ajouter les infos client si disponibles
  if (customerName || customerEmail || customerPhone) {
    invoiceData.customer = {};
    if (customerName) invoiceData.customer.name = customerName;
    if (customerEmail) invoiceData.customer.email = customerEmail;
    if (customerPhone) invoiceData.customer.phone = customerPhone;
  }

  // Appel API PayDunya
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
    throw new Error(result.response_text || 'Erreur initialisation PayDunya');
  }

  // Retourner le token et l'URL de paiement
  return {
    token: result.token,
    payment_url: result.response_text,  // URL de redirection
    mode: PAYDUNYA_CONFIG.MODE
  };
}

module.exports = { initiatePaydunyaPayment };
```

---

## 🔐 Variables d'Environnement Requises

Créer/mettre à jour le fichier `.env` du backend :

```bash
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=printalma_db

# PayDunya (Mode SANDBOX pour les tests)
PAYDUNYA_MASTER_KEY=votre_master_key_sandbox
PAYDUNYA_PRIVATE_KEY=votre_private_key_sandbox
PAYDUNYA_PUBLIC_KEY=votre_public_key_sandbox
PAYDUNYA_TOKEN=votre_token_sandbox
PAYDUNYA_MODE=sandbox

# URLs de callback
FRONTEND_URL=http://localhost:5174
BACKEND_URL=http://localhost:3004

# JWT
JWT_SECRET=votre_secret_jwt
```

**📍 Obtenir les clés PayDunya :**
- Mode Sandbox : https://app.paydunya.com/developers
- Documentation : https://developers.paydunya.com/doc/FR/introduction

---

## 🧪 Test Rapide

### 1. Vérifier que l'endpoint existe

```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "firstName": "Test",
      "lastName": "User",
      "street": "Rue Test",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "phoneNumber": "77 123 45 67",
    "orderItems": [{
      "productId": 1,
      "quantity": 1,
      "unitPrice": 10000
    }],
    "paymentMethod": "CASH_ON_DELIVERY"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-...",
    "totalAmount": 10000,
    ...
  }
}
```

### 2. Vérifier en base de données

```bash
mysql -u root -p -e "
  SELECT id, orderNumber, shippingName, phoneNumber, totalAmount
  FROM orders
  ORDER BY id DESC
  LIMIT 1;
"
```

---

## ✅ Checklist d'Implémentation

- [ ] **Migration SQL exécutée** (`backend/migration_add_email_to_orders.sql`)
- [ ] **Endpoint `POST /orders/guest` créé** dans `routes/orders.js`
- [ ] **Service PayDunya créé** dans `services/paydunyaService.js`
- [ ] **Variables d'environnement** PayDunya configurées
- [ ] **Test manuel** avec curl (commande sans PayDunya)
- [ ] **Test avec PayDunya** (commande avec paiement)
- [ ] **Vérification en base** que les données sont enregistrées

---

## 📚 Documentation Complète

Voir les guides complets dans le dossier `backend/` :

1. **`GUIDE-ENREGISTREMENT-INFOS-CLIENT.md`** - Guide technique complet
2. **`TEST_COMMANDS.md`** - 19 tests pour valider l'implémentation
3. **`README-ORDERS-INTEGRATION.md`** - Vue d'ensemble et démarrage rapide

---

## 🚨 Message au Développeur Backend

**Le frontend est PRÊT et ATTEND cette implémentation.**

Sans cet endpoint, les clients ne peuvent pas commander sur le site.

**Temps estimé d'implémentation :** 2-3 heures pour un développeur expérimenté

**Priorité :** 🔴 **CRITIQUE - BLOQUANT**

---

*Document créé le 05 Novembre 2025*
*Dernière mise à jour : 05 Novembre 2025*
