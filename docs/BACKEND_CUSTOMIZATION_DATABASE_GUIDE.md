# Guide Backend : Enregistrement des Commandes avec Personnalisation

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Structure des données](#structure-des-données)
3. [Schéma de base de données](#schéma-de-base-de-données)
4. [Endpoints API](#endpoints-api)
5. [Logique métier](#logique-métier)
6. [Exemples de code](#exemples-de-code)
7. [Flux complet](#flux-complet)

---

## Vue d'ensemble

Le système de personnalisation permet aux clients de :
- Ajouter du texte personnalisé sur les produits
- Placer des images/designs sur les produits
- Positionner, redimensionner et faire pivoter les éléments
- Sauvegarder ces personnalisations pour chaque vue du produit

Les données de personnalisation sont d'abord sauvegardées dans **localStorage** (côté client), puis envoyées au **backend** lors de l'ajout au panier.

---

## Structure des données

### 1. DesignElement (Élément de personnalisation)

Chaque élément (texte ou image) placé sur un produit contient :

```typescript
interface DesignElement {
  // Identifiant unique
  id: string;                    // Ex: "element-1737551234567-abc123"

  // Type d'élément
  type: 'text' | 'image';

  // Position (coordonnées relatives 0-1)
  x: number;                     // Position X (0 = gauche, 1 = droite)
  y: number;                     // Position Y (0 = haut, 1 = bas)

  // Dimensions (en pixels)
  width: number;                 // Largeur en pixels
  height: number;                // Hauteur en pixels

  // Transformation
  rotation: number;              // Rotation en degrés (0-360)
  zIndex: number;                // Ordre d'affichage (0 = arrière-plan)

  // === Champs spécifiques au TEXTE === //
  text?: string;                 // Contenu du texte
  fontSize?: number;             // Taille de police en pixels
  baseFontSize?: number;         // Taille de base (pour responsive)
  baseWidth?: number;            // Largeur de base (pour responsive)
  fontFamily?: string;           // Police (ex: "Arial, sans-serif")
  color?: string;                // Couleur (ex: "#000000")
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  curve?: number;                // Courbure du texte (-355 à 355)

  // === Champs spécifiques à l'IMAGE === //
  imageUrl?: string;             // URL de l'image (Cloudinary, etc.)
  naturalWidth?: number;         // Largeur originale de l'image
  naturalHeight?: number;        // Hauteur originale de l'image
}
```

**Exemple concret - Élément texte :**
```json
{
  "id": "element-1737551234567-abc123",
  "type": "text",
  "x": 0.5,
  "y": 0.3,
  "width": 200,
  "height": 50,
  "rotation": 0,
  "zIndex": 1,
  "text": "Mon texte personnalisé",
  "fontSize": 32,
  "baseFontSize": 32,
  "baseWidth": 200,
  "fontFamily": "Arial, sans-serif",
  "color": "#FF0000",
  "fontWeight": "bold",
  "fontStyle": "normal",
  "textDecoration": "none",
  "textAlign": "center",
  "curve": 0
}
```

**Exemple concret - Élément image :**
```json
{
  "id": "element-1737551234568-def456",
  "type": "image",
  "x": 0.5,
  "y": 0.7,
  "width": 150,
  "height": 150,
  "rotation": 15,
  "zIndex": 0,
  "imageUrl": "https://res.cloudinary.com/xxx/image/upload/v123/design.svg",
  "naturalWidth": 500,
  "naturalHeight": 500
}
```

### 2. SizeSelection (Sélection taille/quantité)

```typescript
interface SizeSelection {
  size: string;      // Ex: "M", "L", "XL"
  quantity: number;  // Ex: 2
}
```

**Exemple :**
```json
[
  { "size": "M", "quantity": 2 },
  { "size": "L", "quantity": 1 },
  { "size": "XL", "quantity": 3 }
]
```

### 3. CustomizationData (Données envoyées au backend)

```typescript
interface CustomizationData {
  productId: number;                    // ID du produit
  colorVariationId: number;             // ID de la variation de couleur
  viewId: number;                       // ID de la vue (Front, Back, etc.)
  designElements: DesignElement[];      // Éléments de personnalisation
  sizeSelections?: SizeSelection[];     // Sélections taille/quantité
  sessionId?: string;                   // ID session pour utilisateurs non-connectés
  previewImageUrl?: string;             // URL de l'aperçu (optionnel)
}
```

**Exemple complet envoyé au backend :**
```json
{
  "productId": 42,
  "colorVariationId": 5,
  "viewId": 12,
  "designElements": [
    {
      "id": "element-1737551234567-abc123",
      "type": "text",
      "x": 0.5,
      "y": 0.3,
      "width": 200,
      "height": 50,
      "rotation": 0,
      "zIndex": 1,
      "text": "Mon texte",
      "fontSize": 32,
      "baseFontSize": 32,
      "baseWidth": 200,
      "fontFamily": "Arial, sans-serif",
      "color": "#FF0000",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center",
      "curve": 0
    },
    {
      "id": "element-1737551234568-def456",
      "type": "image",
      "x": 0.5,
      "y": 0.7,
      "width": 150,
      "height": 150,
      "rotation": 15,
      "zIndex": 0,
      "imageUrl": "https://res.cloudinary.com/xxx/design.svg",
      "naturalWidth": 500,
      "naturalHeight": 500
    }
  ],
  "sizeSelections": [
    { "size": "M", "quantity": 2 },
    { "size": "L", "quantity": 1 }
  ],
  "sessionId": "guest-1737551234567-xyz789"
}
```

---

## Schéma de base de données

### Table : `customizations`

Table principale pour stocker les personnalisations.

```sql
CREATE TABLE customizations (
  -- Identifiants
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Utilisateur (null si guest)
  user_id BIGINT UNSIGNED NULL,
  session_id VARCHAR(255) NULL,  -- Pour les utilisateurs non-connectés

  -- Produit et vue
  product_id BIGINT UNSIGNED NOT NULL,
  color_variation_id BIGINT UNSIGNED NOT NULL,
  view_id BIGINT UNSIGNED NOT NULL,

  -- Éléments de personnalisation (JSON)
  design_elements JSON NOT NULL,

  -- Sélections taille/quantité (JSON)
  size_selections JSON NULL,

  -- Aperçu
  preview_image_url VARCHAR(500) NULL,

  -- Prix et état
  total_price DECIMAL(10, 2) DEFAULT 0.00,
  status ENUM('draft', 'saved', 'in_cart', 'ordered') DEFAULT 'draft',

  -- Lien avec la commande
  order_id BIGINT UNSIGNED NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Index
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_product_id (product_id),
  INDEX idx_order_id (order_id),
  INDEX idx_status (status),

  -- Contraintes
  CONSTRAINT fk_customizations_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_customizations_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_customizations_color FOREIGN KEY (color_variation_id)
    REFERENCES color_variations(id) ON DELETE CASCADE,
  CONSTRAINT fk_customizations_view FOREIGN KEY (view_id)
    REFERENCES product_images(id) ON DELETE CASCADE,
  CONSTRAINT fk_customizations_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE SET NULL
);
```

**Exemple de données dans la table :**

| id | user_id | session_id | product_id | color_variation_id | view_id | design_elements | size_selections | status | order_id |
|----|---------|------------|------------|--------------------|---------|-----------------|-----------------|--------|----------|
| 1 | 5 | NULL | 42 | 5 | 12 | `[{...}]` | `[{"size":"M","quantity":2}]` | ordered | 123 |
| 2 | NULL | guest-123-xyz | 43 | 6 | 13 | `[{...}]` | `[{"size":"L","quantity":1}]` | in_cart | NULL |

### Table : `order_items` (Mise à jour)

Ajouter une colonne pour lier les articles de commande aux personnalisations.

```sql
ALTER TABLE order_items
ADD COLUMN customization_id BIGINT UNSIGNED NULL AFTER product_id,
ADD CONSTRAINT fk_order_items_customization
  FOREIGN KEY (customization_id)
  REFERENCES customizations(id)
  ON DELETE SET NULL;
```

**Structure complète de `order_items` :**

```sql
CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  customization_id BIGINT UNSIGNED NULL,  -- 🆕 Lien vers la personnalisation

  -- Détails du produit
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500) NULL,
  color_name VARCHAR(100) NULL,
  size VARCHAR(50) NULL,

  -- Prix et quantité
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Index
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  INDEX idx_customization_id (customization_id),

  -- Contraintes
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_customization FOREIGN KEY (customization_id)
    REFERENCES customizations(id) ON DELETE SET NULL
);
```

---

## Endpoints API

### POST `/customizations`

**Créer une nouvelle personnalisation**

**Request :**
```json
{
  "productId": 42,
  "colorVariationId": 5,
  "viewId": 12,
  "designElements": [...],
  "sizeSelections": [...],
  "sessionId": "guest-123-xyz"
}
```

**Response :**
```json
{
  "id": 1,
  "userId": null,
  "sessionId": "guest-123-xyz",
  "productId": 42,
  "colorVariationId": 5,
  "viewId": 12,
  "designElements": [...],
  "sizeSelections": [...],
  "previewImageUrl": null,
  "totalPrice": 0,
  "status": "saved",
  "orderId": null,
  "createdAt": "2025-01-22T10:30:00Z",
  "updatedAt": "2025-01-22T10:30:00Z"
}
```

### GET `/customizations/:id`

**Récupérer une personnalisation par ID**

**Response :**
```json
{
  "id": 1,
  "userId": 5,
  "sessionId": null,
  "productId": 42,
  "colorVariationId": 5,
  "viewId": 12,
  "designElements": [...],
  "sizeSelections": [...],
  "previewImageUrl": null,
  "totalPrice": 15000,
  "status": "ordered",
  "orderId": 123,
  "createdAt": "2025-01-22T10:30:00Z",
  "updatedAt": "2025-01-22T10:35:00Z",
  "product": {
    "id": 42,
    "name": "T-shirt Premium",
    "price": 5000
  }
}
```

### GET `/customizations/user/me`

**Récupérer les personnalisations de l'utilisateur connecté**

**Headers :**
```
Authorization: Bearer <token>
```

**Response :**
```json
[
  {
    "id": 1,
    "productId": 42,
    "designElements": [...],
    "status": "ordered",
    "createdAt": "2025-01-22T10:30:00Z"
  }
]
```

### GET `/customizations/session/:sessionId`

**Récupérer les personnalisations d'une session (guest)**

**Response :**
```json
[
  {
    "id": 2,
    "sessionId": "guest-123-xyz",
    "productId": 43,
    "designElements": [...],
    "status": "in_cart",
    "createdAt": "2025-01-22T11:00:00Z"
  }
]
```

### PUT `/customizations/:id`

**Mettre à jour une personnalisation**

**Request :**
```json
{
  "designElements": [...],
  "status": "in_cart"
}
```

**Response :**
```json
{
  "id": 1,
  "designElements": [...],
  "status": "in_cart",
  "updatedAt": "2025-01-22T10:40:00Z"
}
```

### DELETE `/customizations/:id`

**Supprimer une personnalisation**

**Response :**
```json
{
  "message": "Customization deleted successfully"
}
```

---

## Logique métier

### 1. Création de personnalisation

```javascript
// POST /customizations
async createCustomization(req, res) {
  try {
    const {
      productId,
      colorVariationId,
      viewId,
      designElements,
      sizeSelections,
      sessionId
    } = req.body;

    // Validation
    if (!productId || !colorVariationId || !viewId || !designElements) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Récupérer l'utilisateur (null si guest)
    const userId = req.user?.id || null;

    // Calculer le prix total (optionnel)
    const product = await Product.findById(productId);
    let totalPrice = 0;

    if (sizeSelections && sizeSelections.length > 0) {
      totalPrice = sizeSelections.reduce((sum, sel) => {
        return sum + (product.price * sel.quantity);
      }, 0);
    }

    // Créer la personnalisation
    const customization = await Customization.create({
      userId,
      sessionId: userId ? null : sessionId,
      productId,
      colorVariationId,
      viewId,
      designElements: JSON.stringify(designElements),
      sizeSelections: sizeSelections ? JSON.stringify(sizeSelections) : null,
      totalPrice,
      status: 'saved'
    });

    // Retourner avec les éléments parsés
    res.status(201).json({
      ...customization.toJSON(),
      designElements: JSON.parse(customization.designElements),
      sizeSelections: customization.sizeSelections
        ? JSON.parse(customization.sizeSelections)
        : null
    });

  } catch (error) {
    console.error('Error creating customization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 2. Création de commande avec personnalisations

```javascript
// POST /orders
async createOrder(req, res) {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const userId = req.user?.id;
    const sessionId = req.body.sessionId;

    // 1. Créer la commande
    const order = await Order.create({
      userId,
      sessionId: userId ? null : sessionId,
      shippingAddress: JSON.stringify(shippingAddress),
      paymentMethod,
      status: 'pending',
      totalAmount: 0
    });

    let totalAmount = 0;

    // 2. Créer les items de commande
    for (const item of items) {
      const product = await Product.findById(item.productId);
      const unitPrice = product.suggestedPrice || product.price;
      const itemTotal = unitPrice * item.quantity;

      // Créer l'item de commande
      const orderItem = await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        customizationId: item.customizationId || null, // 🆕 Lien personnalisation
        productName: product.name,
        productImage: item.imageUrl,
        colorName: item.color,
        size: item.size,
        unitPrice,
        quantity: item.quantity,
        totalPrice: itemTotal
      });

      // 3. Si personnalisation, mettre à jour son statut
      if (item.customizationId) {
        await Customization.update(
          {
            status: 'ordered',
            orderId: order.id
          },
          {
            where: { id: item.customizationId }
          }
        );
      }

      totalAmount += itemTotal;
    }

    // 4. Mettre à jour le total de la commande
    await order.update({ totalAmount });

    // 5. Retourner la commande complète
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Customization,
              as: 'customization'
            }
          ]
        }
      ]
    });

    res.status(201).json(fullOrder);

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 3. Récupération d'une commande avec personnalisations

```javascript
// GET /orders/:id
async getOrder(req, res) {
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
              as: 'product'
            },
            {
              model: Customization,
              as: 'customization'
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Parser les JSON pour chaque personnalisation
    const orderData = order.toJSON();
    orderData.items = orderData.items.map(item => {
      if (item.customization) {
        item.customization.designElements = JSON.parse(
          item.customization.designElements
        );
        if (item.customization.sizeSelections) {
          item.customization.sizeSelections = JSON.parse(
            item.customization.sizeSelections
          );
        }
      }
      return item;
    });

    res.json(orderData);

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Exemples de code

### Modèle Sequelize : Customization

```javascript
// models/Customization.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customization = sequelize.define('Customization', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'user_id'
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'session_id'
    },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'product_id'
    },
    colorVariationId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'color_variation_id'
    },
    viewId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'view_id'
    },
    designElements: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'design_elements'
    },
    sizeSelections: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'size_selections'
    },
    previewImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'preview_image_url'
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'total_price'
    },
    status: {
      type: DataTypes.ENUM('draft', 'saved', 'in_cart', 'ordered'),
      allowNull: false,
      defaultValue: 'draft'
    },
    orderId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'order_id'
    }
  }, {
    tableName: 'customizations',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Associations
  Customization.associate = (models) => {
    Customization.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Customization.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
    Customization.belongsTo(models.ColorVariation, {
      foreignKey: 'colorVariationId',
      as: 'colorVariation'
    });
    Customization.belongsTo(models.ProductImage, {
      foreignKey: 'viewId',
      as: 'view'
    });
    Customization.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
  };

  return Customization;
};
```

### Migration Sequelize

```javascript
// migrations/XXXXXX-create-customizations.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customizations', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      product_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      color_variation_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'color_variations',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      view_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'product_images',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      design_elements: {
        type: Sequelize.JSON,
        allowNull: false
      },
      size_selections: {
        type: Sequelize.JSON,
        allowNull: true
      },
      preview_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.ENUM('draft', 'saved', 'in_cart', 'ordered'),
        allowNull: false,
        defaultValue: 'draft'
      },
      order_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index
    await queryInterface.addIndex('customizations', ['user_id']);
    await queryInterface.addIndex('customizations', ['session_id']);
    await queryInterface.addIndex('customizations', ['product_id']);
    await queryInterface.addIndex('customizations', ['order_id']);
    await queryInterface.addIndex('customizations', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customizations');
  }
};
```

---

## Flux complet

### 1. Client personnalise un produit

```
[Frontend]
1. Client ouvre /product/42/customize
2. Client ajoute du texte : "Mon texte"
3. Client place une image de design
4. Client redimensionne et fait pivoter les éléments
5. Données sauvegardées dans localStorage :
   {
     "elementsByView": {
       "5-12": [
         { type: "text", x: 0.5, y: 0.3, ... },
         { type: "image", x: 0.5, y: 0.7, ... }
       ]
     },
     "colorVariationId": 5,
     "viewId": 12
   }
```

### 2. Client ajoute au panier

```
[Frontend]
1. Client clique "Ajouter au panier"
2. Modal de sélection taille/quantité s'ouvre
3. Client sélectionne : M (2x), L (1x)
4. Frontend envoie POST /customizations :
   {
     "productId": 42,
     "colorVariationId": 5,
     "viewId": 12,
     "designElements": [...],
     "sizeSelections": [
       { "size": "M", "quantity": 2 },
       { "size": "L", "quantity": 1 }
     ],
     "sessionId": "guest-123-xyz"
   }

[Backend]
5. Backend crée l'enregistrement dans customizations
6. Backend retourne : { "id": 1, ... }

[Frontend]
7. Frontend stocke customizationId dans localStorage
8. Frontend ajoute 3 items au panier (2 M + 1 L) avec :
   - customizationId: 1
   - designElements: [...] (pour affichage)
   - delimitations: [...] (pour positionnement)
```

### 3. Client passe commande

```
[Frontend]
1. Client va au panier
2. Client clique "Commander"
3. Frontend envoie POST /orders :
   {
     "items": [
       {
         "productId": 42,
         "customizationId": 1,  // 🔑 Lien vers personnalisation
         "size": "M",
         "quantity": 1,
         "color": "Blanc",
         "imageUrl": "..."
       },
       {
         "productId": 42,
         "customizationId": 1,
         "size": "M",
         "quantity": 1,
         "color": "Blanc",
         "imageUrl": "..."
       },
       {
         "productId": 42,
         "customizationId": 1,
         "size": "L",
         "quantity": 1,
         "color": "Blanc",
         "imageUrl": "..."
       }
     ],
     "shippingAddress": {...},
     "paymentMethod": "card"
   }

[Backend]
4. Backend crée l'order
5. Backend crée les order_items avec customization_id
6. Backend met à jour customizations :
   - status: 'ordered'
   - order_id: 123
7. Backend retourne la commande complète
```

### 4. Admin/Vendeur consulte la commande

```
[Backend]
1. GET /orders/123
2. Backend récupère :
   - Order
   - OrderItems
   - Customizations (avec designElements)
3. Backend parse les JSON et retourne tout

[Frontend Admin/Vendeur]
4. Affiche la commande avec :
   - Produits commandés
   - Tailles et quantités
   - Aperçu des personnalisations
   - Éléments de design positionnés correctement
```

---

## Points importants

### ✅ À faire

1. **Valider les données** avant insertion
   - Vérifier que productId, colorVariationId, viewId existent
   - Valider la structure des designElements

2. **Parser les JSON** lors de la récupération
   - `designElements` est stocké en JSON
   - `sizeSelections` est stocké en JSON
   - Toujours parser avant d'envoyer au frontend

3. **Gérer les utilisateurs connectés ET guests**
   - Si userId existe → utiliser userId, sessionId = null
   - Si userId null → utiliser sessionId

4. **Mettre à jour le statut** des personnalisations
   - `draft` → En cours de création
   - `saved` → Sauvegardé mais pas encore au panier
   - `in_cart` → Dans le panier
   - `ordered` → Commandé

5. **Lier les personnalisations aux commandes**
   - Mettre à jour `order_id` dans customizations
   - Mettre à jour `customization_id` dans order_items

### ⚠️ Pièges à éviter

1. **Ne pas oublier de parser les JSON**
   ```javascript
   // ❌ FAUX
   return customization;

   // ✅ BON
   return {
     ...customization,
     designElements: JSON.parse(customization.designElements)
   };
   ```

2. **Ne pas mélanger userId et sessionId**
   ```javascript
   // ✅ BON
   userId: req.user?.id || null,
   sessionId: req.user?.id ? null : sessionId
   ```

3. **Vérifier les permissions**
   - Un utilisateur ne peut modifier que ses propres personnalisations
   - Un guest ne peut modifier que les personnalisations de sa session

---

## Conclusion

Ce guide complet vous permet de :
- ✅ Comprendre la structure des données de personnalisation
- ✅ Créer le schéma de base de données
- ✅ Implémenter les endpoints API
- ✅ Gérer le flux complet de la personnalisation à la commande
- ✅ Afficher correctement les personnalisations dans les commandes

**Fichiers à créer/modifier :**
1. `migrations/create-customizations.js` - Migration pour créer la table
2. `models/Customization.js` - Modèle Sequelize
3. `controllers/customizationController.js` - Logique métier
4. `routes/customizationRoutes.js` - Routes API
5. `migrations/add-customization-to-order-items.js` - Lien avec order_items

Pour toute question ou besoin d'aide supplémentaire, n'hésitez pas à consulter ce guide !
