# Exemples d'API : Customisations dans les Commandes

## 📋 Exemples de requêtes et réponses

Ce document contient des exemples complets de requêtes/réponses pour aider à l'implémentation backend.

---

## 1️⃣ Création de commande avec customisations (PayDunya)

### Requête Frontend → Backend

**Endpoint** : `POST /orders` (utilisateur authentifié) ou `POST /orders/guest`

```json
{
  "email": "client@example.com",
  "shippingDetails": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "street": "123 Rue de la République",
    "city": "Dakar",
    "region": "Dakar",
    "postalCode": "12000",
    "country": "Sénégal"
  },
  "phoneNumber": "77 123 45 67",
  "notes": "Livraison rapide SVP",
  "orderItems": [
    {
      "productId": 45,
      "quantity": 1,
      "unitPrice": 15000,
      "size": "M",
      "color": "Blanc",
      "colorId": 1,

      "customizationId": 456,
      "customizationIds": {
        "1-5": 456,
        "1-6": 457
      },
      "designElementsByView": {
        "1-5": [
          {
            "id": "text-abc123",
            "type": "text",
            "text": "PRINTALMA",
            "x": 0.5,
            "y": 0.35,
            "width": 300,
            "height": 60,
            "rotation": 0,
            "fontSize": 48,
            "fontFamily": "Impact",
            "color": "#FF0000",
            "fontWeight": "bold",
            "fontStyle": "normal",
            "textDecoration": "none",
            "textAlign": "center",
            "zIndex": 1
          },
          {
            "id": "image-def456",
            "type": "image",
            "imageUrl": "https://storage.example.com/designs/logo-123.png",
            "x": 0.5,
            "y": 0.65,
            "width": 200,
            "height": 200,
            "rotation": 0,
            "zIndex": 2
          }
        ],
        "1-6": [
          {
            "id": "text-ghi789",
            "type": "text",
            "text": "10",
            "x": 0.5,
            "y": 0.5,
            "width": 150,
            "height": 80,
            "rotation": 0,
            "fontSize": 72,
            "fontFamily": "Arial Black",
            "color": "#000000",
            "fontWeight": "bold",
            "zIndex": 1
          }
        ]
      }
    }
  ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true
}
```

### Réponse Backend → Frontend

```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 789,
    "orderNumber": "ORD-2025-ABC123",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": 15000,
    "payment": {
      "token": "paydunyatoken123456",
      "redirect_url": "https://app.paydunya.com/sandbox/checkout/paydunyatoken123456",
      "payment_url": "https://app.paydunya.com/sandbox/checkout/paydunyatoken123456",
      "mode": "test"
    }
  }
}
```

---

## 2️⃣ Création de commande avec customisations (Paiement à la livraison)

### Requête

```json
{
  "email": "marie@example.com",
  "shippingDetails": {
    "firstName": "Marie",
    "lastName": "Sow",
    "street": "45 Avenue Bourguiba",
    "city": "Thiès",
    "region": "Thiès",
    "postalCode": "21000",
    "country": "Sénégal"
  },
  "phoneNumber": "76 987 65 43",
  "orderItems": [
    {
      "productId": 23,
      "quantity": 2,
      "unitPrice": 12000,
      "size": "L",
      "color": "Noir",
      "colorId": 2,

      "customizationId": 890,
      "customizationIds": {
        "2-7": 890
      },
      "designElementsByView": {
        "2-7": [
          {
            "id": "text-xyz",
            "type": "text",
            "text": "SENEGAL",
            "x": 0.5,
            "y": 0.4,
            "width": 250,
            "height": 50,
            "rotation": 0,
            "fontSize": 36,
            "fontFamily": "Roboto",
            "color": "#00FF00",
            "fontWeight": "bold",
            "zIndex": 1
          }
        ]
      }
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
    "id": 790,
    "orderNumber": "ORD-2025-DEF456",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": 24000
  }
}
```

---

## 3️⃣ Récupération d'une commande avec customisations

### Requête

**Endpoint** : `GET /orders/789`

### Réponse

```json
{
  "success": true,
  "data": {
    "id": 789,
    "orderNumber": "ORD-2025-ABC123",
    "userId": 12,
    "status": "CONFIRMED",
    "paymentStatus": "COMPLETED",
    "totalAmount": 15000,
    "shippingFee": 0,

    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "client@example.com",
    "phoneNumber": "77 123 45 67",
    "street": "123 Rue de la République",
    "city": "Dakar",
    "region": "Dakar",
    "postalCode": "12000",
    "country": "Sénégal",
    "notes": "Livraison rapide SVP",

    "createdAt": "2025-01-17T10:30:00Z",
    "updatedAt": "2025-01-17T10:35:00Z",
    "confirmedAt": "2025-01-17T10:35:00Z",

    "orderItems": [
      {
        "id": 1234,
        "orderId": 789,
        "productId": 45,
        "quantity": 1,
        "unitPrice": 15000,
        "size": "M",
        "color": "Blanc",
        "colorId": 1,

        "customizationId": 456,
        "customizationIds": {
          "1-5": 456,
          "1-6": 457
        },
        "designElementsByView": {
          "1-5": [
            {
              "id": "text-abc123",
              "type": "text",
              "text": "PRINTALMA",
              "x": 0.5,
              "y": 0.35,
              "width": 300,
              "height": 60,
              "rotation": 0,
              "fontSize": 48,
              "fontFamily": "Impact",
              "color": "#FF0000",
              "fontWeight": "bold",
              "zIndex": 1
            },
            {
              "id": "image-def456",
              "type": "image",
              "imageUrl": "https://storage.example.com/designs/logo-123.png",
              "x": 0.5,
              "y": 0.65,
              "width": 200,
              "height": 200,
              "rotation": 0,
              "zIndex": 2
            }
          ],
          "1-6": [
            {
              "id": "text-ghi789",
              "type": "text",
              "text": "10",
              "x": 0.5,
              "y": 0.5,
              "width": 150,
              "height": 80,
              "rotation": 0,
              "fontSize": 72,
              "fontFamily": "Arial Black",
              "color": "#000000",
              "fontWeight": "bold",
              "zIndex": 1
            }
          ]
        },

        "product": {
          "id": 45,
          "name": "T-Shirt Premium Coton",
          "description": "T-shirt de qualité supérieure",
          "price": 15000
        }
      }
    ]
  }
}
```

---

## 4️⃣ Structure de la table `order_items` après insertion

### SQL pour visualiser les données

```sql
SELECT
  id,
  order_id,
  product_id,
  quantity,
  unit_price,
  size,
  color,
  customization_id,
  customization_ids,
  jsonb_pretty(design_elements_by_view) AS design_elements_formatted
FROM order_items
WHERE order_id = 789;
```

### Résultat

```
id   | 1234
order_id | 789
product_id | 45
quantity | 1
unit_price | 15000.00
size | M
color | Blanc
customization_id | 456
customization_ids | {"1-5": 456, "1-6": 457}
design_elements_formatted |
{
  "1-5": [
    {
      "id": "text-abc123",
      "type": "text",
      "text": "PRINTALMA",
      "x": 0.5,
      "y": 0.35,
      "width": 300,
      "height": 60,
      "rotation": 0,
      "fontSize": 48,
      "fontFamily": "Impact",
      "color": "#FF0000",
      "fontWeight": "bold",
      "zIndex": 1
    },
    {
      "id": "image-def456",
      "type": "image",
      "imageUrl": "https://storage.example.com/designs/logo-123.png",
      "x": 0.5,
      "y": 0.65,
      "width": 200,
      "height": 200,
      "rotation": 0,
      "zIndex": 2
    }
  ],
  "1-6": [
    {
      "id": "text-ghi789",
      "type": "text",
      "text": "10",
      "x": 0.5,
      "y": 0.5,
      "width": 150,
      "height": 80,
      "rotation": 0,
      "fontSize": 72,
      "fontFamily": "Arial Black",
      "color": "#000000",
      "fontWeight": "bold",
      "zIndex": 1
    }
  ]
}
```

---

## 5️⃣ Mise à jour des customizations après commande

### SQL pour lier les customizations à la commande

```sql
-- Commande #789 avec customizationIds: {"1-5": 456, "1-6": 457}

UPDATE customizations
SET
  order_id = 789,
  status = 'ORDERED',
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (456, 457);
```

### Vérification

```sql
SELECT
  id,
  product_id,
  color_variation_id,
  view_id,
  status,
  order_id,
  jsonb_array_length(design_elements) AS elements_count
FROM customizations
WHERE id IN (456, 457);
```

### Résultat attendu

```
id  | 456
product_id | 45
color_variation_id | 1
view_id | 5
status | ORDERED
order_id | 789
elements_count | 2

id  | 457
product_id | 45
color_variation_id | 1
view_id | 6
status | ORDERED
order_id | 789
elements_count | 1
```

---

## 6️⃣ Requêtes pour affichage admin

### Récupérer toutes les commandes avec customisations

```sql
SELECT
  o.id,
  o.order_number,
  o.status,
  o.total_amount,
  COUNT(DISTINCT oi.id) AS total_items,
  COUNT(DISTINCT CASE WHEN oi.customization_ids IS NOT NULL THEN oi.id END) AS customized_items,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY o.id
ORDER BY o.created_at DESC;
```

### Extraire les textes personnalisés d'une commande

```sql
SELECT
  oi.id AS item_id,
  p.name AS product_name,
  elem->>'text' AS custom_text,
  elem->>'fontSize' AS font_size,
  elem->>'color' AS text_color,
  view_key
FROM order_items oi
JOIN products p ON p.id = oi.product_id
CROSS JOIN LATERAL jsonb_each(oi.design_elements_by_view) AS views(view_key, view_elements)
CROSS JOIN LATERAL jsonb_array_elements(view_elements) AS elem
WHERE oi.order_id = 789
  AND elem->>'type' = 'text';
```

### Résultat

```
item_id | product_name              | custom_text | font_size | text_color | view_key
1234    | T-Shirt Premium Coton     | PRINTALMA   | 48        | #FF0000    | 1-5
1234    | T-Shirt Premium Coton     | 10          | 72        | #000000    | 1-6
```

---

## 7️⃣ Tests et validation

### Cas de test 1 : Commande simple avec 1 vue

```bash
curl -X POST http://localhost:3004/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "shippingDetails": {
      "firstName": "Test",
      "lastName": "User",
      "street": "123 Test St",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "phoneNumber": "77 000 00 00",
    "orderItems": [{
      "productId": 1,
      "quantity": 1,
      "unitPrice": 10000,
      "size": "M",
      "color": "Blanc",
      "colorId": 1,
      "customizationId": 100,
      "customizationIds": {"1-5": 100},
      "designElementsByView": {
        "1-5": [
          {
            "id": "test-1",
            "type": "text",
            "text": "TEST",
            "x": 0.5,
            "y": 0.5,
            "width": 100,
            "height": 50,
            "fontSize": 24,
            "fontFamily": "Arial",
            "color": "#000000",
            "zIndex": 1
          }
        ]
      }
    }],
    "paymentMethod": "CASH_ON_DELIVERY"
  }'
```

### Cas de test 2 : Commande avec 3 vues

```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guest@example.com",
    "shippingDetails": {
      "firstName": "Guest",
      "lastName": "User",
      "street": "456 Guest Ave",
      "city": "Thiès",
      "country": "Sénégal"
    },
    "phoneNumber": "76 000 00 00",
    "orderItems": [{
      "productId": 2,
      "quantity": 1,
      "unitPrice": 20000,
      "size": "L",
      "color": "Noir",
      "colorId": 2,
      "customizationId": 200,
      "customizationIds": {
        "2-5": 200,
        "2-6": 201,
        "2-7": 202
      },
      "designElementsByView": {
        "2-5": [{"id": "t1", "type": "text", "text": "FRONT", "x": 0.5, "y": 0.3, "width": 100, "height": 40, "fontSize": 20, "fontFamily": "Arial", "color": "#FFF", "zIndex": 1}],
        "2-6": [{"id": "t2", "type": "text", "text": "BACK", "x": 0.5, "y": 0.3, "width": 100, "height": 40, "fontSize": 20, "fontFamily": "Arial", "color": "#FFF", "zIndex": 1}],
        "2-7": [{"id": "t3", "type": "text", "text": "SLEEVE", "x": 0.5, "y": 0.5, "width": 50, "height": 30, "fontSize": 16, "fontFamily": "Arial", "color": "#FFF", "zIndex": 1}]
      }
    }],
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": true
  }'
```

---

## 📊 Statistiques utiles

### Taux de customisation

```sql
SELECT
  DATE(o.created_at) AS date,
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN oi.customization_ids IS NOT NULL THEN o.id END) AS customized_orders,
  ROUND(
    COUNT(DISTINCT CASE WHEN oi.customization_ids IS NOT NULL THEN o.id END)::numeric
    / NULLIF(COUNT(DISTINCT o.id), 0) * 100,
    2
  ) AS customization_rate_percent
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(o.created_at)
ORDER BY date DESC;
```

### Éléments les plus utilisés

```sql
SELECT
  elem->>'type' AS element_type,
  elem->>'fontFamily' AS font_family,
  elem->>'color' AS color,
  COUNT(*) AS usage_count
FROM order_items oi
CROSS JOIN LATERAL jsonb_each(oi.design_elements_by_view) AS views(view_key, view_elements)
CROSS JOIN LATERAL jsonb_array_elements(view_elements) AS elem
WHERE oi.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND elem->>'type' = 'text'
GROUP BY elem->>'type', elem->>'fontFamily', elem->>'color'
ORDER BY usage_count DESC
LIMIT 10;
```

---

**Date de création** : 2025-01-17
**Version** : 1.0
**Lié à** : `BACKEND_ORDER_CUSTOMIZATION_GUIDE.md`
