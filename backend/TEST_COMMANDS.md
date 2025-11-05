# 🧪 Commandes de Test Backend - Système de Commandes PrintAlma

Ce fichier contient toutes les commandes de test pour valider l'implémentation du système de commandes et de paiement Paydunya.

---

## 📋 Prérequis

1. **Backend démarré** sur `http://localhost:3004`
2. **Base de données** configurée et migration exécutée
3. **Variables d'environnement** Paydunya configurées dans `.env`

---

## 🗄️ Tests Base de Données

### Test 1 : Vérifier que la colonne email existe

```bash
mysql -u root -p -e "
  SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND column_name = 'email';
"
```

**Résultat attendu :**
```
+-------------+---------------+-------------+
| COLUMN_NAME | COLUMN_TYPE   | IS_NULLABLE |
+-------------+---------------+-------------+
| email       | varchar(255)  | YES         |
+-------------+---------------+-------------+
```

### Test 2 : Vérifier la vue v_vendor_orders

```bash
mysql -u root -p -e "
  SELECT COUNT(*) as column_count
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'v_vendor_orders'
    AND column_name IN ('customerEmail', 'customerName', 'customerPhone');
"
```

**Résultat attendu :** `column_count: 3`

---

## 🛒 Tests API - Création de Commande

### Test 3 : Créer une commande guest (sans Paydunya)

```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "street": "Rue 10, Médina",
      "city": "Dakar",
      "region": "Dakar",
      "postalCode": "12000",
      "country": "Sénégal"
    },
    "phoneNumber": "77 123 45 67",
    "notes": "Livraison entre 14h et 18h",
    "orderItems": [{
      "productId": 1,
      "vendorProductId": 1,
      "quantity": 2,
      "unitPrice": 12500,
      "size": "L",
      "color": "Noir"
    }],
    "paymentMethod": "CASH_ON_DELIVERY",
    "initiatePayment": false
  }' | jq
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1234567890-ABCDE",
    "totalAmount": 25000,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "paymentMethod": "CASH_ON_DELIVERY",
    "customerInfo": {
      "name": "Jean Dupont",
      "email": null,
      "phone": "77 123 45 67",
      "address": "Rue 10, Médina, Dakar, 12000, Sénégal"
    }
  }
}
```

### Test 4 : Créer une commande avec email

```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d @backend/test_order_example.json | jq
```

**Résultat attendu :** Structure similaire au Test 3 avec `email` renseigné.

### Test 5 : Créer une commande avec Paydunya

```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "firstName": "Moussa",
      "lastName": "Diop",
      "street": "Rue 10, Médina",
      "city": "Dakar",
      "region": "Dakar",
      "country": "Sénégal"
    },
    "phoneNumber": "77 123 45 67",
    "orderItems": [{
      "productId": 1,
      "vendorProductId": 1,
      "quantity": 1,
      "unitPrice": 15000
    }],
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": true
  }' | jq
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "orderNumber": "ORD-...",
    "payment": {
      "token": "abc123xyz",
      "redirect_url": "https://app.paydunya.com/sandbox-checkout/invoice/abc123xyz",
      "mode": "sandbox"
    }
  }
}
```

---

## 🔍 Tests de Vérification

### Test 6 : Vérifier qu'une commande a bien toutes les infos

```bash
# Remplacer ORDER_ID par l'ID de la commande créée au Test 3
mysql -u root -p -e "
  SELECT
    id,
    orderNumber,
    shippingName,
    email,
    phoneNumber,
    shippingStreet,
    shippingCity,
    shippingCountry,
    totalAmount,
    paymentMethod,
    paymentStatus
  FROM orders
  WHERE id = ORDER_ID;
"
```

**Résultat attendu :**
```
+----+-----------------+-------------+------------------+----------------+-------------------+--------------+-----------------+-------------+---------------------+---------------+
| id | orderNumber     | shippingName| email            | phoneNumber    | shippingStreet    | shippingCity | shippingCountry | totalAmount | paymentMethod       | paymentStatus |
+----+-----------------+-------------+------------------+----------------+-------------------+--------------+-----------------+-------------+---------------------+---------------+
| 1  | ORD-1234567-... | Jean Dupont | jean@example.com | 77 123 45 67   | Rue 10, Médina    | Dakar        | Sénégal         | 25000.00    | CASH_ON_DELIVERY    | PENDING       |
+----+-----------------+-------------+------------------+----------------+-------------------+--------------+-----------------+-------------+---------------------+---------------+
```

### Test 7 : Vérifier que les items de commande sont enregistrés

```bash
mysql -u root -p -e "
  SELECT
    id,
    orderId,
    productId,
    vendorProductId,
    quantity,
    unitPrice,
    size,
    color
  FROM order_items
  ORDER BY id DESC
  LIMIT 5;
"
```

---

## 👨‍💼 Tests API Vendeur

### Test 8 : Récupérer les commandes d'un vendeur

**Prérequis :** Avoir un token JWT vendeur valide

```bash
# Remplacer YOUR_VENDOR_TOKEN par un vrai token JWT
curl -X GET http://localhost:3004/vendor/orders \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": [
    {
      "orderId": 1,
      "orderNumber": "ORD-1234567890-ABCDE",
      "orderStatus": "PENDING",
      "orderTotalAmount": 25000.00,
      "orderCreatedAt": "2025-01-15T10:30:00.000Z",

      "customerName": "Jean Dupont",
      "customerPhone": "77 123 45 67",
      "customerEmail": "jean@example.com",

      "shippingStreet": "Rue 10, Médina",
      "shippingCity": "Dakar",
      "shippingCountry": "Sénégal",
      "shippingAddressFull": "Rue 10, Médina, Dakar, 12000, Sénégal",

      "productName": "T-Shirt Premium",
      "quantity": 2,
      "unitPrice": 12500,
      "size": "L",
      "color": "Noir",

      "paymentMethod": "CASH_ON_DELIVERY",
      "paymentStatus": "PENDING"
    }
  ]
}
```

### Test 9 : Vérifier l'isolation des données vendeur

```bash
# Se connecter avec 2 vendeurs différents et vérifier que chacun ne voit que ses propres commandes

# Vendeur 1
curl -X GET http://localhost:3004/vendor/orders \
  -H "Authorization: Bearer VENDOR_1_TOKEN" | jq '.data | length'

# Vendeur 2
curl -X GET http://localhost:3004/vendor/orders \
  -H "Authorization: Bearer VENDOR_2_TOKEN" | jq '.data | length'
```

**Résultat attendu :** Chaque vendeur doit voir un nombre différent de commandes.

---

## 💳 Tests Paydunya

### Test 10 : Vérifier le statut d'un paiement Paydunya

```bash
# Remplacer PAYDUNYA_TOKEN par le token retourné lors de la création de commande (Test 5)
curl -X GET http://localhost:3004/paydunya/status/PAYDUNYA_TOKEN \
  -H "Content-Type: application/json" | jq
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "response_code": "00",
    "response_text": "Transaction Found",
    "status": "pending",
    "order_number": "ORD-...",
    "payment_status": "PENDING",
    "total_amount": 15000
  }
}
```

### Test 11 : Simuler un webhook Paydunya (paiement réussi)

```bash
curl -X POST http://localhost:3004/webhooks/paydunya \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "invoice_token": "abc123xyz",
      "status": "completed",
      "custom_data": {
        "order_id": 2,
        "order_number": "ORD-1234567890-XYZ"
      },
      "receipt_url": "https://app.paydunya.com/receipt/abc123xyz"
    }
  }' | jq
```

**Résultat attendu :**
```json
{
  "success": true
}
```

### Test 12 : Vérifier que le statut de la commande a été mis à jour

```bash
# Vérifier en base que le statut est passé à PAID
mysql -u root -p -e "
  SELECT
    id,
    orderNumber,
    paymentStatus,
    status,
    transactionId
  FROM orders
  WHERE id = 2;
"
```

**Résultat attendu :**
```
+----+-----------------+---------------+------------+---------------+
| id | orderNumber     | paymentStatus | status     | transactionId |
+----+-----------------+---------------+------------+---------------+
| 2  | ORD-1234567-... | PAID          | PROCESSING | abc123xyz     |
+----+-----------------+---------------+------------+---------------+
```

---

## ⚠️ Tests de Validation

### Test 13 : Tenter de créer une commande sans téléphone

```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "street": "Rue 10",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "orderItems": [{
      "productId": 1,
      "quantity": 1,
      "unitPrice": 10000
    }],
    "paymentMethod": "CASH_ON_DELIVERY"
  }' | jq
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    "Le numéro de téléphone est requis"
  ]
}
```

### Test 14 : Tenter de créer une commande sans nom

```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "street": "Rue 10",
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
  }' | jq
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    "Au moins un prénom ou nom est requis"
  ]
}
```

### Test 15 : Tenter de créer une commande avec un email invalide

```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "not-an-email",
      "street": "Rue 10",
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
  }' | jq
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    "Format d'email invalide"
  ]
}
```

---

## 🔐 Tests de Sécurité

### Test 16 : Tenter d'accéder aux commandes vendeur sans token

```bash
curl -X GET http://localhost:3004/vendor/orders \
  -H "Content-Type: application/json" | jq
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Non autorisé",
  "error": "Token manquant"
}
```

### Test 17 : Tenter d'accéder aux commandes vendeur avec un token invalide

```bash
curl -X GET http://localhost:3004/vendor/orders \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Non autorisé",
  "error": "Token invalide"
}
```

---

## 📊 Tests de Performance

### Test 18 : Créer 10 commandes simultanées

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3004/orders/guest \
    -H "Content-Type: application/json" \
    -d '{
      "shippingDetails": {
        "firstName": "Client'$i'",
        "lastName": "Test",
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
    }' &
done

# Attendre que toutes les requêtes se terminent
wait

echo "✅ 10 commandes créées"
```

### Test 19 : Vérifier les performances de la vue v_vendor_orders

```bash
mysql -u root -p -e "
  EXPLAIN SELECT * FROM v_vendor_orders WHERE vendorId = 1;
"
```

---

## 📝 Checklist de Validation Complète

Avant de déployer en production, vérifier que tous les tests passent :

- [ ] **Test 1** : Colonne email existe dans orders ✅
- [ ] **Test 2** : Vue v_vendor_orders contient les colonnes client ✅
- [ ] **Test 3** : Création de commande guest (sans email) ✅
- [ ] **Test 4** : Création de commande guest (avec email) ✅
- [ ] **Test 5** : Création de commande avec Paydunya ✅
- [ ] **Test 6** : Vérification en base des infos client ✅
- [ ] **Test 7** : Vérification des items de commande ✅
- [ ] **Test 8** : API /vendor/orders retourne les infos client ✅
- [ ] **Test 9** : Isolation des données vendeur ✅
- [ ] **Test 10** : Vérification statut Paydunya ✅
- [ ] **Test 11** : Webhook Paydunya (paiement réussi) ✅
- [ ] **Test 12** : Mise à jour statut après webhook ✅
- [ ] **Test 13** : Validation - téléphone requis ✅
- [ ] **Test 14** : Validation - nom requis ✅
- [ ] **Test 15** : Validation - format email ✅
- [ ] **Test 16** : Sécurité - token manquant ✅
- [ ] **Test 17** : Sécurité - token invalide ✅

---

## 🚀 Outils Utiles

### Visualiser les logs backend en temps réel

```bash
# Si le backend utilise PM2
pm2 logs

# Ou avec tail si les logs sont dans un fichier
tail -f logs/backend.log
```

### Nettoyer les données de test

```bash
# ATTENTION : Ceci supprime TOUTES les commandes !
mysql -u root -p -e "
  DELETE FROM order_items;
  DELETE FROM orders WHERE userId = 3;
  ALTER TABLE orders AUTO_INCREMENT = 1;
  ALTER TABLE order_items AUTO_INCREMENT = 1;
"
```

### Créer un token JWT de test pour vendeur

```javascript
// Node.js script pour générer un token de test
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    id: 1,
    email: 'vendeur@test.com',
    role: 'VENDEUR'
  },
  process.env.JWT_SECRET || 'votre_secret_jwt',
  { expiresIn: '7d' }
);

console.log('Token JWT:', token);
```

---

**📍 Pour toute question ou problème avec les tests, consultez :**
- Le guide complet : `backend/GUIDE-ENREGISTREMENT-INFOS-CLIENT.md`
- La documentation Paydunya : https://developers.paydunya.com/doc/FR/introduction
