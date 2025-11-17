# Guide Backend : Enregistrement des Customisations dans les Commandes

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Structure des données reçues](#structure-des-données-reçues)
3. [Schéma de base de données](#schéma-de-base-de-données)
4. [Flux de traitement](#flux-de-traitement)
5. [Exemples de code](#exemples-de-code)
6. [Validation des données](#validation-des-données)
7. [Exemples SQL](#exemples-sql)

---

## 🎯 Vue d'ensemble

Lorsqu'un client crée une commande avec des produits personnalisés, le frontend envoie des données de customisation qui doivent être enregistrées en base de données pour :
- **Conserver l'historique** des personnalisations
- **Permettre la reproduction** du produit personnalisé
- **Afficher les détails** dans l'interface admin/vendeur
- **Générer les mockups** pour la production

---

## 📦 Structure des données reçues

### Endpoint : `POST /orders` ou `POST /orders/guest`

Le frontend envoie un objet `CreateOrderRequest` contenant un tableau `orderItems`. Chaque item peut contenir des données de customisation :

```typescript
{
  "shippingDetails": { ... },
  "phoneNumber": "77 123 45 67",
  "email": "client@example.com",
  "orderItems": [
    {
      // Données de base du produit
      "productId": 123,
      "quantity": 1,
      "unitPrice": 15000,
      "size": "M",
      "color": "Blanc",
      "colorId": 1,

      // 🆕 DONNÉES DE CUSTOMISATION - NOUVEAU SYSTÈME (Multi-vues)
      "customizationId": 456,                    // ID principal (première vue)
      "customizationIds": {                       // 🔑 CLEF : Tous les IDs par vue
        "1-5": 456,                              // colorId-viewId: customizationId
        "1-6": 457                               // Vue arrière
      },
      "designElementsByView": {                   // 🔑 CLEF : Éléments organisés par vue
        "1-5": [                                 // Vue devant
          {
            "id": "text-123",
            "type": "text",
            "text": "MON TEXTE",
            "x": 0.5,                            // Position en pourcentage (0-1)
            "y": 0.3,
            "width": 200,                         // Taille en pixels
            "height": 50,
            "rotation": 0,
            "fontSize": 24,
            "fontFamily": "Arial",
            "color": "#000000",
            "fontWeight": "bold",
            "zIndex": 1
          },
          {
            "id": "image-456",
            "type": "image",
            "imageUrl": "https://example.com/image.png",
            "x": 0.5,
            "y": 0.6,
            "width": 150,
            "height": 150,
            "rotation": 0,
            "zIndex": 2
          }
        ],
        "1-6": [                                 // Vue arrière
          {
            "id": "text-789",
            "type": "text",
            "text": "NUMÉRO 10",
            "x": 0.5,
            "y": 0.5,
            "width": 100,
            "height": 40,
            "rotation": 0,
            "fontSize": 32,
            "fontFamily": "Impact",
            "color": "#FF0000",
            "zIndex": 1
          }
        ]
      },

      // ANCIEN SYSTÈME (rétro-compatibilité)
      "designElements": [ ... ],                 // @deprecated

      // Autres données de design (ancien système vendeur)
      "vendorProductId": 789,
      "mockupUrl": "https://...",
      "designId": 12,
      "designPositions": { ... },
      "designMetadata": { ... },
      "delimitation": { ... }
    }
  ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true
}
```

---

## 🗄️ Schéma de base de données

### Table `orders`
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(100),                    -- Pour les commandes guests

  -- Informations de livraison
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  street VARCHAR(200) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) NOT NULL,
  notes TEXT,

  -- Montants et paiement
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'CASH_ON_DELIVERY',
  payment_status VARCHAR(50) DEFAULT 'PENDING',
  transaction_id VARCHAR(100),

  -- Statuts
  status VARCHAR(50) DEFAULT 'PENDING',
  confirmed_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `order_items`
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  vendor_product_id INTEGER REFERENCES vendor_products(id),

  -- Détails du produit
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  size VARCHAR(50),
  color VARCHAR(100),
  color_id INTEGER,

  -- 🎨 CUSTOMISATION - Ancien système (vendeur design)
  design_id INTEGER REFERENCES designs(id),
  mockup_url TEXT,
  design_positions JSONB,                     -- Positions du design vendeur
  design_metadata JSONB,                      -- Métadonnées du design
  delimitation JSONB,                         -- Zone de placement

  -- 🆕 CUSTOMISATION - Nouveau système (multi-vues client)
  customization_id INTEGER,                   -- ID principal (première vue)
  customization_ids JSONB,                    -- 🔑 {"1-5": 456, "1-6": 457}
  design_elements_by_view JSONB,              -- 🔑 Éléments par vue
  design_elements JSONB,                      -- @deprecated (compatibilité)

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `customizations` (existante - référence)
```sql
CREATE TABLE customizations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(100),
  product_id INTEGER NOT NULL REFERENCES products(id),
  color_variation_id INTEGER NOT NULL,
  view_id INTEGER NOT NULL,

  -- Éléments de design pour CETTE vue
  design_elements JSONB NOT NULL,             -- Array d'éléments (texte, images)
  size_selections JSONB,                      -- Sélections de taille
  preview_image_url TEXT,
  total_price DECIMAL(10, 2),

  -- Statut et ordre
  status VARCHAR(50) DEFAULT 'DRAFT',
  order_id INTEGER REFERENCES orders(id),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 Flux de traitement

### Étape 1 : Réception de la commande
```javascript
POST /orders
POST /orders/guest

// Le backend reçoit le CreateOrderRequest
```

### Étape 2 : Validation
1. ✅ Vérifier que `orderItems` n'est pas vide
2. ✅ Valider chaque `productId`
3. ✅ Vérifier `customizationIds` si présent
4. ✅ Valider la structure de `designElementsByView`

### Étape 3 : Création de la commande
1. Créer l'enregistrement `orders`
2. Calculer le `total_amount`
3. Générer le `order_number`

### Étape 4 : Enregistrement des items
Pour chaque `orderItem` :
1. Créer l'enregistrement `order_items`
2. **Enregistrer les customisations** (voir exemples ci-dessous)
3. Lier les `customization_id` si présents

### Étape 5 : Mise à jour des customizations
Si `customizationIds` est fourni :
```javascript
{
  "1-5": 456,
  "1-6": 457
}
```
Pour chaque ID :
- Mettre à jour `customizations.order_id = <order_id>`
- Mettre à jour `customizations.status = 'ORDERED'`

---

## 💻 Exemples de code

### Exemple 1 : Traitement d'un orderItem avec customisations

```javascript
// Node.js / TypeScript (NestJS)

async function createOrderItem(orderId, itemData, transaction) {
  const {
    productId,
    quantity,
    unitPrice,
    size,
    color,
    colorId,

    // Nouvelles données de customisation
    customizationId,
    customizationIds,
    designElementsByView,
    designElements, // @deprecated

    // Ancien système
    vendorProductId,
    mockupUrl,
    designId,
    designPositions,
    designMetadata,
    delimitation
  } = itemData;

  // 1️⃣ Créer l'order item
  const orderItem = await OrderItem.create({
    orderId,
    productId,
    vendorProductId,
    quantity,
    unitPrice,
    size,
    color,
    colorId,

    // Customisations
    customizationId,
    customizationIds: customizationIds || null,
    designElementsByView: designElementsByView || null,
    designElements: designElements || null,

    // Ancien système
    designId,
    mockupUrl,
    designPositions: designPositions || null,
    designMetadata: designMetadata || null,
    delimitation: delimitation || null,
  }, { transaction });

  // 2️⃣ Mettre à jour les customizations liées
  if (customizationIds) {
    const customizationIdArray = Object.values(customizationIds);

    await Customization.update(
      {
        orderId: orderId,
        status: 'ORDERED'
      },
      {
        where: {
          id: { [Op.in]: customizationIdArray }
        },
        transaction
      }
    );

    console.log(`✅ ${customizationIdArray.length} customizations liées à la commande #${orderId}`);
  }

  return orderItem;
}
```

### Exemple 2 : Validation des données

```javascript
function validateCustomizationData(itemData) {
  const errors = [];

  // Vérifier la structure de customizationIds
  if (itemData.customizationIds) {
    if (typeof itemData.customizationIds !== 'object') {
      errors.push('customizationIds doit être un objet');
    } else {
      // Vérifier le format des clés: "colorId-viewId"
      for (const [key, value] of Object.entries(itemData.customizationIds)) {
        if (!/^\d+-\d+$/.test(key)) {
          errors.push(`Format invalide pour customizationIds: "${key}"`);
        }
        if (!Number.isInteger(value) || value <= 0) {
          errors.push(`ID invalide pour la vue "${key}": ${value}`);
        }
      }
    }
  }

  // Vérifier la structure de designElementsByView
  if (itemData.designElementsByView) {
    if (typeof itemData.designElementsByView !== 'object') {
      errors.push('designElementsByView doit être un objet');
    } else {
      for (const [viewKey, elements] of Object.entries(itemData.designElementsByView)) {
        if (!Array.isArray(elements)) {
          errors.push(`Les éléments de la vue "${viewKey}" doivent être un tableau`);
        } else {
          // Valider chaque élément
          elements.forEach((element, index) => {
            if (!element.type || !['text', 'image'].includes(element.type)) {
              errors.push(`Type invalide pour l'élément ${index} de la vue "${viewKey}"`);
            }
            if (element.type === 'text' && !element.text) {
              errors.push(`Texte manquant pour l'élément ${index} de la vue "${viewKey}"`);
            }
            if (element.type === 'image' && !element.imageUrl) {
              errors.push(`URL d'image manquante pour l'élément ${index} de la vue "${viewKey}"`);
            }
            // Valider les coordonnées
            if (typeof element.x !== 'number' || typeof element.y !== 'number') {
              errors.push(`Coordonnées invalides pour l'élément ${index} de la vue "${viewKey}"`);
            }
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Exemple 3 : Récupération pour affichage admin

```javascript
async function getOrderWithCustomizations(orderId) {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      }
    ]
  });

  // Enrichir avec les détails de customization
  for (const item of order.orderItems) {
    if (item.customizationIds) {
      // Récupérer toutes les customizations liées
      const customizationIdArray = Object.values(item.customizationIds);

      item.customizations = await Customization.findAll({
        where: {
          id: { [Op.in]: customizationIdArray }
        }
      });

      // Organiser par vue
      item.customizationsByView = {};
      for (const [viewKey, customizationId] of Object.entries(item.customizationIds)) {
        item.customizationsByView[viewKey] = item.customizations.find(
          c => c.id === customizationId
        );
      }
    }
  }

  return order;
}
```

---

## ✅ Validation des données

### Checklist de validation

- [ ] `productId` existe dans la table `products`
- [ ] `customizationIds` est un objet avec format `"colorId-viewId": customizationId`
- [ ] Tous les `customizationId` dans `customizationIds` existent dans `customizations`
- [ ] `designElementsByView` est un objet avec clés correspondant à `customizationIds`
- [ ] Chaque élément dans `designElementsByView` a les champs requis :
  - `type`: "text" ou "image"
  - `x`, `y`: coordonnées (0-1 pour pourcentage)
  - `width`, `height`: dimensions en pixels
  - Pour `type: "text"`: `text`, `fontSize`, `fontFamily`, `color`
  - Pour `type: "image"`: `imageUrl`

### Règles métier

1. **Cohérence des vues** : Les clés de `customizationIds` doivent correspondre aux clés de `designElementsByView`
2. **Propriété des customizations** : Vérifier que les customizations appartiennent bien à l'utilisateur ou à la session
3. **Statut des customizations** : Ne lier que les customizations avec status `'DRAFT'` ou `'PENDING'`
4. **Prix** : Recalculer le prix en fonction des customizations (si applicable)

---

## 📝 Exemples SQL

### Insérer un order item avec customisations

```sql
INSERT INTO order_items (
  order_id,
  product_id,
  quantity,
  unit_price,
  size,
  color,
  color_id,
  customization_id,
  customization_ids,
  design_elements_by_view
) VALUES (
  123,                                          -- order_id
  456,                                          -- product_id
  1,                                            -- quantity
  15000.00,                                     -- unit_price
  'M',                                          -- size
  'Blanc',                                      -- color
  1,                                            -- color_id
  789,                                          -- customization_id (première vue)
  '{"1-5": 789, "1-6": 790}'::jsonb,           -- customization_ids
  '{
    "1-5": [
      {
        "id": "text-1",
        "type": "text",
        "text": "MON TEXTE",
        "x": 0.5,
        "y": 0.3,
        "width": 200,
        "height": 50,
        "fontSize": 24,
        "fontFamily": "Arial",
        "color": "#000000",
        "zIndex": 1
      }
    ],
    "1-6": [
      {
        "id": "text-2",
        "type": "text",
        "text": "NUMÉRO 10",
        "x": 0.5,
        "y": 0.5,
        "width": 100,
        "height": 40,
        "fontSize": 32,
        "fontFamily": "Impact",
        "color": "#FF0000",
        "zIndex": 1
      }
    ]
  }'::jsonb                                     -- design_elements_by_view
);
```

### Mettre à jour les customizations après création de commande

```sql
UPDATE customizations
SET
  order_id = 123,
  status = 'ORDERED',
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (789, 790);
```

### Récupérer une commande avec toutes ses customisations

```sql
SELECT
  o.id AS order_id,
  o.order_number,
  oi.id AS item_id,
  oi.product_id,
  oi.customization_ids,
  oi.design_elements_by_view,
  p.name AS product_name
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.id = 123;
```

### Extraire les éléments de design d'une vue spécifique

```sql
-- PostgreSQL
SELECT
  oi.id,
  oi.design_elements_by_view->'1-5' AS front_view_elements,
  oi.design_elements_by_view->'1-6' AS back_view_elements
FROM order_items oi
WHERE oi.order_id = 123;
```

### Statistiques sur les customisations

```sql
-- Nombre de commandes avec customisations par période
SELECT
  DATE(o.created_at) AS order_date,
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN oi.customization_ids IS NOT NULL THEN o.id END) AS orders_with_customization,
  COUNT(DISTINCT CASE WHEN oi.customization_ids IS NOT NULL THEN o.id END) * 100.0 / COUNT(DISTINCT o.id) AS customization_rate
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(o.created_at)
ORDER BY order_date DESC;
```

---

## 🎯 Points clés à retenir

### ✅ À FAIRE
1. **Enregistrer `customizationIds`** et `designElementsByView` dans `order_items`
2. **Mettre à jour `customizations.order_id`** pour lier les customisations à la commande
3. **Changer le status** des customisations de `'DRAFT'` à `'ORDERED'`
4. **Valider la structure** des données avant insertion
5. **Utiliser des transactions** pour garantir la cohérence

### ❌ À ÉVITER
1. ❌ Ne pas ignorer `customizationIds` (nouveau système)
2. ❌ Ne pas écraser les données existantes dans `customizations`
3. ❌ Ne pas oublier de mettre à jour le `status`
4. ❌ Ne pas stocker uniquement `customizationId` (singulier) - il faut les deux
5. ❌ Ne pas valider uniquement au niveau du frontend

---

## 📞 Support

Pour toute question sur l'implémentation :
1. Consulter les fichiers de documentation existants dans `/docs`
2. Vérifier les exemples de code dans ce guide
3. Tester avec les données d'exemple fournies

---

**Date de création** : 2025-01-17
**Version** : 1.0
**Frontend compatible** : CustomerProductCustomizationPageV3, CartSidebar, OrderFormPage, ModernOrderFormPage
