# Guide Backend : Intégration des Personnalisations dans les Commandes

## 📋 Vue d'ensemble

Ce guide explique comment intégrer le système de personnalisation existant dans le flux de commande pour enregistrer automatiquement les personnalisations en base de données lors de la création d'une commande.

---

## 🗄️ Modifications de la base de données

### 1. Ajouter la colonne `customization_id` à `order_items`

```sql
-- Migration : Ajouter la colonne customization_id
ALTER TABLE order_items
ADD COLUMN customization_id BIGINT UNSIGNED NULL AFTER product_id,
ADD INDEX idx_customization_id (customization_id);

-- Ajouter la contrainte de clé étrangère
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_customization
  FOREIGN KEY (customization_id)
  REFERENCES customizations(id)
  ON DELETE SET NULL;
```

### 2. Vérifier la structure

```sql
DESCRIBE order_items;
```

**Résultat attendu :**

| Colonne | Type | Null | Clé | Default |
|---------|------|------|-----|---------|
| id | bigint unsigned | NO | PRI | NULL |
| order_id | bigint unsigned | NO | MUL | NULL |
| product_id | bigint unsigned | NO | MUL | NULL |
| **customization_id** | **bigint unsigned** | **YES** | **MUL** | **NULL** |
| product_name | varchar(255) | NO | | NULL |
| ... | ... | ... | ... | ... |

---

## 🔄 Flux de commande avec personnalisation

### Schéma du flux

```
Frontend                          Backend
   │                                 │
   │  1. Créer personnalisation      │
   ├────────────────────────────────>│
   │     POST /customizations        │
   │                                 │
   │<────────────────────────────────┤
   │     { id: 123, status: "saved" }│
   │                                 │
   │  2. Ajouter au panier           │
   │     (localStorage + customizationId)
   │                                 │
   │  3. Créer commande              │
   ├────────────────────────────────>│
   │     POST /orders                │
   │     items: [                    │
   │       {                         │
   │         productId: 1,           │
   │         customizationId: 123 ←──┤ Important !
   │         size: "M",              │
   │         quantity: 2             │
   │       }                         │
   │     ]                           │
   │                                 │
   │                                 ├── 4. Créer order
   │                                 │
   │                                 ├── 5. Créer order_items
   │                                 │      avec customization_id
   │                                 │
   │                                 ├── 6. Mettre à jour customizations
   │                                 │      status: "ordered"
   │                                 │      order_id: XXX
   │                                 │
   │<────────────────────────────────┤
   │     { id: XXX, items: [...] }  │
```

---

## 💻 Implémentation Backend

### 1. Contrôleur de commandes (`orderController.js`)

```javascript
// controllers/orderController.js
const { Order, OrderItem, Customization, Product, User } = require('../models');
const { sequelize } = require('../models');

/**
 * Créer une nouvelle commande avec personnalisations
 * POST /orders
 */
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      items,           // Tableau des items
      shippingAddress, // Adresse de livraison
      paymentMethod,   // Méthode de paiement
      sessionId        // Session ID pour guests
    } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        error: 'Shipping address is required'
      });
    }

    // Récupérer l'utilisateur (null si guest)
    const userId = req.user?.id || null;

    console.log('📦 [OrderController] Creating order for', userId ? `user ${userId}` : `guest ${sessionId}`);
    console.log('📦 [OrderController] Items:', items.length);

    // 1. Créer la commande
    const order = await Order.create({
      userId,
      sessionId: userId ? null : sessionId,
      shippingAddress: JSON.stringify(shippingAddress),
      paymentMethod: paymentMethod || 'card',
      status: 'pending',
      totalAmount: 0 // Sera calculé après
    }, { transaction });

    console.log('✅ [OrderController] Order created with ID:', order.id);

    let totalAmount = 0;
    const createdItems = [];

    // 2. Créer les items de commande
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Récupérer le produit
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Calculer le prix
      const unitPrice = product.suggestedPrice || product.price;
      const quantity = item.quantity || 1;
      const itemTotal = unitPrice * quantity;

      // Créer l'item de commande
      const orderItem = await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        customizationId: item.customizationId || null, // 🔑 IMPORTANT !
        productName: product.name,
        productImage: item.imageUrl || product.imageUrl,
        colorName: item.color || null,
        colorCode: item.colorCode || null,
        size: item.size || null,
        unitPrice,
        quantity,
        totalPrice: itemTotal
      }, { transaction });

      console.log(`✅ [OrderController] Item ${i + 1}/${items.length} created:`, {
        orderItemId: orderItem.id,
        productId: item.productId,
        customizationId: item.customizationId || 'none',
        size: item.size,
        quantity
      });

      createdItems.push(orderItem);
      totalAmount += itemTotal;

      // 3. Si personnalisation, mettre à jour son statut
      if (item.customizationId) {
        const customization = await Customization.findByPk(item.customizationId, {
          transaction
        });

        if (customization) {
          await customization.update({
            status: 'ordered',
            orderId: order.id
          }, { transaction });

          console.log(`✅ [OrderController] Customization ${item.customizationId} updated to "ordered"`);
        } else {
          console.warn(`⚠️ [OrderController] Customization ${item.customizationId} not found`);
        }
      }
    }

    // 4. Mettre à jour le total de la commande
    await order.update({ totalAmount }, { transaction });

    console.log('✅ [OrderController] Order total amount:', totalAmount);

    // 5. Commit de la transaction
    await transaction.commit();

    console.log('✅ [OrderController] Transaction committed successfully');

    // 6. Récupérer la commande complète avec les relations
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'suggestedPrice']
            },
            {
              model: Customization,
              as: 'customization',
              attributes: ['id', 'designElements', 'sizeSelections', 'status']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // 7. Parser les JSON des personnalisations
    const orderData = fullOrder.toJSON();
    if (orderData.items) {
      orderData.items = orderData.items.map(item => {
        if (item.customization && item.customization.designElements) {
          try {
            item.customization.designElements = JSON.parse(item.customization.designElements);
          } catch (e) {
            console.error('Error parsing designElements:', e);
          }
        }
        if (item.customization && item.customization.sizeSelections) {
          try {
            item.customization.sizeSelections = JSON.parse(item.customization.sizeSelections);
          } catch (e) {
            console.error('Error parsing sizeSelections:', e);
          }
        }
        return item;
      });
    }

    res.status(201).json({
      success: true,
      data: orderData
    });

  } catch (error) {
    // Rollback de la transaction en cas d'erreur
    await transaction.rollback();

    console.error('❌ [OrderController] Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Récupérer une commande par ID avec personnalisations
 * GET /orders/:id
 */
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'suggestedPrice', 'imageUrl']
            },
            {
              model: Customization,
              as: 'customization',
              attributes: ['id', 'designElements', 'sizeSelections', 'status', 'previewImageUrl']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Vérifier les permissions
    const userId = req.user?.id;
    if (userId && order.userId !== userId) {
      // Vérifier si c'est un admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }
    }

    // Parser les JSON
    const orderData = order.toJSON();
    if (orderData.items) {
      orderData.items = orderData.items.map(item => {
        if (item.customization && item.customization.designElements) {
          try {
            item.customization.designElements = JSON.parse(item.customization.designElements);
          } catch (e) {
            console.error('Error parsing designElements:', e);
          }
        }
        if (item.customization && item.customization.sizeSelections) {
          try {
            item.customization.sizeSelections = JSON.parse(item.customization.sizeSelections);
          } catch (e) {
            console.error('Error parsing sizeSelections:', e);
          }
        }
        return item;
      });
    }

    res.json({
      success: true,
      data: orderData
    });

  } catch (error) {
    console.error('❌ [OrderController] Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Récupérer les commandes de l'utilisateur connecté
 * GET /orders/user/me
 */
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, offset = 0 } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'imageUrl']
            },
            {
              model: Customization,
              as: 'customization',
              attributes: ['id', 'status', 'previewImageUrl']
            }
          ]
        }
      ]
    });

    // Parser les JSON
    const ordersData = orders.map(order => {
      const orderData = order.toJSON();
      if (orderData.items) {
        orderData.items = orderData.items.map(item => {
          if (item.customization && item.customization.designElements) {
            try {
              item.customization.designElements = JSON.parse(item.customization.designElements);
            } catch (e) {
              // Ignore
            }
          }
          return item;
        });
      }
      return orderData;
    });

    res.json({
      success: true,
      data: {
        total: count,
        orders: ordersData,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ [OrderController] Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = exports;
```

---

## 📝 Modèle Sequelize : OrderItem (mise à jour)

```javascript
// models/OrderItem.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'order_id'
    },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'product_id'
    },
    customizationId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'customization_id'
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'product_name'
    },
    productImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'product_image'
    },
    colorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'color_name'
    },
    colorCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'color_code'
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_price'
    }
  }, {
    tableName: 'order_items',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Associations
  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
    OrderItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
    OrderItem.belongsTo(models.Customization, {
      foreignKey: 'customizationId',
      as: 'customization'
    });
  };

  return OrderItem;
};
```

---

## 🚀 Frontend : Envoyer les données de commande

### Exemple TypeScript/React

```typescript
// pages/checkout/CheckoutPage.tsx
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import orderService from '@/services/orderService';

const CheckoutPage = () => {
  const { items, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleSubmitOrder = async (shippingAddress: any, paymentMethod: string) => {
    try {
      setLoading(true);

      // Préparer les items avec customizationId
      const orderItems = items.map(item => ({
        productId: item.id,
        customizationId: item.customizationId || null, // 🔑 IMPORTANT !
        size: item.size,
        quantity: item.quantity || 1,
        color: item.color,
        colorCode: item.colorCode,
        imageUrl: item.imageUrl
      }));

      console.log('📦 [Checkout] Creating order with items:', orderItems);

      // Créer la commande
      const order = await orderService.createOrder({
        items: orderItems,
        shippingAddress,
        paymentMethod,
        sessionId: localStorage.getItem('guest-session-id')
      });

      console.log('✅ [Checkout] Order created:', order.id);

      // Vider le panier
      clearCart();

      // Nettoyer localStorage
      items.forEach(item => {
        if (item.customizationId) {
          localStorage.removeItem(`design-data-product-${item.id}`);
          localStorage.removeItem(`customization-${item.id}`);
        }
      });

      // Rediriger vers la page de confirmation
      window.location.href = `/order-confirmation/${order.id}`;

    } catch (error) {
      console.error('❌ [Checkout] Error creating order:', error);
      alert('Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Finaliser la commande</h1>
      {/* ... formulaire ... */}
      <button onClick={() => handleSubmitOrder(address, 'card')}>
        Passer commande
      </button>
    </div>
  );
};
```

### Service de commande

```typescript
// services/orderService.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

interface OrderItem {
  productId: number;
  customizationId?: number | null;
  size?: string;
  quantity: number;
  color?: string;
  colorCode?: string;
  imageUrl?: string;
}

interface OrderData {
  items: OrderItem[];
  shippingAddress: any;
  paymentMethod: string;
  sessionId?: string;
}

class OrderService {
  /**
   * Créer une nouvelle commande
   */
  async createOrder(data: OrderData) {
    try {
      console.log('📦 [OrderService] Creating order with data:', data);

      const response = await axios.post(`${API_BASE}/orders`, data, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });

      console.log('✅ [OrderService] Order created:', response.data);
      return response.data.data;

    } catch (error: any) {
      console.error('❌ [OrderService] Error creating order:', error);
      throw error;
    }
  }

  /**
   * Récupérer une commande par ID
   */
  async getOrder(id: number) {
    try {
      const response = await axios.get(`${API_BASE}/orders/${id}`, {
        headers: {
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });

      return response.data.data;

    } catch (error) {
      console.error('❌ [OrderService] Error fetching order:', error);
      throw error;
    }
  }

  /**
   * Récupérer les commandes de l'utilisateur
   */
  async getMyOrders(params?: { status?: string; limit?: number; offset?: number }) {
    try {
      const response = await axios.get(`${API_BASE}/orders/user/me`, {
        params,
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`
        }
      });

      return response.data.data;

    } catch (error) {
      console.error('❌ [OrderService] Error fetching orders:', error);
      throw error;
    }
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }
}

export default new OrderService();
```

---

## 🧪 Tests

### Test avec cURL

```bash
# 1. Créer une personnalisation
CUSTOMIZATION_RESPONSE=$(curl -s -X POST http://localhost:3004/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 1,
        "text": "Test Order",
        "fontSize": 24,
        "fontFamily": "Arial",
        "color": "#000000"
      }
    ],
    "sessionId": "guest-test-order-123"
  }')

echo "Customization created:"
echo $CUSTOMIZATION_RESPONSE | jq '.'

# Extraire l'ID de personnalisation
CUSTOMIZATION_ID=$(echo $CUSTOMIZATION_RESPONSE | jq -r '.id')
echo "Customization ID: $CUSTOMIZATION_ID"

# 2. Créer une commande avec cette personnalisation
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3004/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": 1,
        \"customizationId\": $CUSTOMIZATION_ID,
        \"size\": \"M\",
        \"quantity\": 2,
        \"color\": \"Blanc\",
        \"colorCode\": \"#FFFFFF\",
        \"imageUrl\": \"https://example.com/product.jpg\"
      }
    ],
    \"shippingAddress\": {
      \"fullName\": \"Jean Test\",
      \"phone\": \"0612345678\",
      \"address\": \"123 Rue Test\",
      \"city\": \"Dakar\",
      \"postalCode\": \"10000\",
      \"country\": \"Sénégal\"
    },
    \"paymentMethod\": \"card\",
    \"sessionId\": \"guest-test-order-123\"
  }")

echo "Order created:"
echo $ORDER_RESPONSE | jq '.'

# Extraire l'ID de commande
ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id')
echo "Order ID: $ORDER_ID"

# 3. Vérifier la commande
curl -s http://localhost:3004/orders/$ORDER_ID | jq '.'

# 4. Vérifier que la personnalisation a été mise à jour
curl -s http://localhost:3004/customizations/$CUSTOMIZATION_ID | jq '.'
```

### Script de test complet

Créer un fichier `test-order-with-customization.sh` :

```bash
#!/bin/bash

echo "🧪 Test : Commande avec personnalisation"
echo "========================================"

# Couleurs pour les logs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Créer une personnalisation
echo -e "\n${YELLOW}📝 Étape 1 : Création de la personnalisation${NC}"
CUSTOMIZATION_RESPONSE=$(curl -s -X POST http://localhost:3004/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 1,
        "text": "Test Order",
        "fontSize": 24,
        "fontFamily": "Arial",
        "color": "#000000"
      }
    ],
    "sizeSelections": [
      {
        "size": "M",
        "quantity": 2
      }
    ],
    "sessionId": "guest-test-order-123"
  }')

CUSTOMIZATION_ID=$(echo $CUSTOMIZATION_RESPONSE | jq -r '.id')

if [ "$CUSTOMIZATION_ID" = "null" ]; then
  echo -e "${RED}❌ Erreur : Personnalisation non créée${NC}"
  echo $CUSTOMIZATION_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Personnalisation créée avec ID: $CUSTOMIZATION_ID${NC}"
echo $CUSTOMIZATION_RESPONSE | jq '.status, .designElements | length'

# 2. Créer une commande
echo -e "\n${YELLOW}📦 Étape 2 : Création de la commande${NC}"
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3004/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": 1,
        \"customizationId\": $CUSTOMIZATION_ID,
        \"size\": \"M\",
        \"quantity\": 2,
        \"color\": \"Blanc\",
        \"imageUrl\": \"https://example.com/product.jpg\"
      }
    ],
    \"shippingAddress\": {
      \"fullName\": \"Jean Test\",
      \"phone\": \"0612345678\",
      \"address\": \"123 Rue Test\",
      \"city\": \"Dakar\",
      \"postalCode\": \"10000\",
      \"country\": \"Sénégal\"
    },
    \"paymentMethod\": \"card\",
    \"sessionId\": \"guest-test-order-123\"
  }")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id')

if [ "$ORDER_ID" = "null" ]; then
  echo -e "${RED}❌ Erreur : Commande non créée${NC}"
  echo $ORDER_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Commande créée avec ID: $ORDER_ID${NC}"
echo $ORDER_RESPONSE | jq '.data | {id, totalAmount, status, itemsCount: (.items | length)}'

# 3. Vérifier que la personnalisation a été liée
echo -e "\n${YELLOW}🔍 Étape 3 : Vérification du lien${NC}"
UPDATED_CUSTOMIZATION=$(curl -s http://localhost:3004/customizations/$CUSTOMIZATION_ID)

CUST_STATUS=$(echo $UPDATED_CUSTOMIZATION | jq -r '.status')
CUST_ORDER_ID=$(echo $UPDATED_CUSTOMIZATION | jq -r '.orderId')

echo "Status de la personnalisation : $CUST_STATUS"
echo "Order ID lié : $CUST_ORDER_ID"

if [ "$CUST_STATUS" = "ordered" ] && [ "$CUST_ORDER_ID" = "$ORDER_ID" ]; then
  echo -e "${GREEN}✅ La personnalisation a été correctement liée à la commande${NC}"
else
  echo -e "${RED}❌ Erreur : La personnalisation n'a pas été mise à jour correctement${NC}"
  exit 1
fi

# 4. Vérifier la commande complète
echo -e "\n${YELLOW}📊 Étape 4 : Récupération de la commande complète${NC}"
FULL_ORDER=$(curl -s http://localhost:3004/orders/$ORDER_ID)

echo $FULL_ORDER | jq '.data | {
  id,
  status,
  totalAmount,
  items: .items | map({
    productName,
    customizationId,
    hasCustomization: (.customization != null),
    customizationStatus: .customization.status
  })
}'

echo -e "\n${GREEN}✅ Test réussi !${NC}"
echo "========================================"
echo "Résumé :"
echo "  - Personnalisation ID: $CUSTOMIZATION_ID"
echo "  - Commande ID: $ORDER_ID"
echo "  - Status personnalisation: $CUST_STATUS"
echo "  - Lien établi: ✅"
```

Rendre exécutable et lancer :

```bash
chmod +x test-order-with-customization.sh
./test-order-with-customization.sh
```

---

## 📊 Requêtes SQL utiles

### Voir les commandes avec personnalisations

```sql
SELECT
  o.id AS order_id,
  o.total_amount,
  o.status AS order_status,
  o.created_at,
  oi.product_name,
  oi.size,
  oi.quantity,
  c.id AS customization_id,
  c.status AS customization_status,
  JSON_LENGTH(c.design_elements) AS element_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN customizations c ON oi.customization_id = c.id
WHERE c.id IS NOT NULL
ORDER BY o.created_at DESC;
```

### Statistiques des personnalisations commandées

```sql
SELECT
  COUNT(DISTINCT c.id) AS total_customizations,
  COUNT(DISTINCT o.id) AS total_orders,
  SUM(o.total_amount) AS total_revenue,
  AVG(JSON_LENGTH(c.design_elements)) AS avg_elements_per_customization
FROM customizations c
LEFT JOIN orders o ON c.order_id = o.id
WHERE c.status = 'ordered';
```

### Produits les plus personnalisés

```sql
SELECT
  p.id,
  p.name,
  COUNT(c.id) AS customization_count,
  COUNT(CASE WHEN c.status = 'ordered' THEN 1 END) AS ordered_count
FROM products p
LEFT JOIN customizations c ON p.id = c.product_id
GROUP BY p.id, p.name
HAVING customization_count > 0
ORDER BY ordered_count DESC, customization_count DESC
LIMIT 10;
```

---

## ✅ Checklist d'intégration

### Base de données
- [ ] Ajouter la colonne `customization_id` à `order_items`
- [ ] Ajouter l'index sur `customization_id`
- [ ] Ajouter la contrainte de clé étrangère
- [ ] Vérifier que la table `customizations` existe

### Backend
- [ ] Mettre à jour le modèle `OrderItem` avec `customizationId`
- [ ] Ajouter l'association avec `Customization`
- [ ] Modifier le contrôleur de commandes pour gérer `customizationId`
- [ ] Mettre à jour le statut des personnalisations lors de la commande
- [ ] Inclure les personnalisations dans les requêtes de commandes
- [ ] Parser les JSON avant de retourner au frontend

### Frontend
- [ ] Sauvegarder `customizationId` lors de l'ajout au panier
- [ ] Envoyer `customizationId` dans les items de commande
- [ ] Afficher les personnalisations dans la page de commande
- [ ] Nettoyer localStorage après commande validée

### Tests
- [ ] Tester création de commande avec personnalisation
- [ ] Vérifier que le statut passe à "ordered"
- [ ] Vérifier que `order_id` est bien rempli
- [ ] Tester récupération de commande avec personnalisation
- [ ] Tester commande mixte (items avec et sans personnalisation)

---

## 🎯 Prochaines étapes

1. **Génération de fichiers de production**
   - Créer des PDF/PNG pour l'impression
   - Inclure les designs positionnés correctement

2. **Interface admin**
   - Visualiser les personnalisations des commandes
   - Exporter les fichiers pour production

3. **Notifications**
   - Email avec aperçu de la personnalisation
   - Notification vendeur pour commandes avec personnalisation

4. **Analytics**
   - Tableau de bord des personnalisations
   - Éléments les plus utilisés
   - Produits les plus personnalisés

---

**Le système est maintenant complet et prêt pour la production ! 🚀**
