# Guide Backend : Affichage Admin des Customisations

## 🎯 Objectif

Permettre à l'admin de visualiser les customisations des commandes avec :
- ✅ Navigation entre les vues (slider)
- ✅ Aperçu visuel des éléments (texte, images)
- ✅ Coordonnées et propriétés de chaque élément
- ✅ Métadonnées complètes pour la production

---

## 📊 Structure des données à stocker

### Table `order_items` - Colonnes essentielles

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),

  -- Détails produit
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  size VARCHAR(50),
  color VARCHAR(100),
  color_id INTEGER,

  -- 🎨 CUSTOMISATION - DONNÉES COMPLÈTES POUR ADMIN
  customization_id INTEGER,                      -- ID principal (première vue)

  customization_ids JSONB,                       -- 🔑 Structure: {"colorId-viewId": customizationId}
  -- Exemple: {"1-5": 456, "1-6": 457, "1-7": 458}

  design_elements_by_view JSONB,                 -- 🔑 Structure: {"colorId-viewId": [elements]}
  -- Exemple: {
  --   "1-5": [{type: "text", text: "DEVANT", x: 0.5, y: 0.3, ...}],
  --   "1-6": [{type: "text", text: "ARRIERE", x: 0.5, y: 0.5, ...}]
  -- }

  -- Métadonnées pour la production
  view_metadata JSONB,                           -- 🆕 RECOMMANDÉ : URLs des images par vue
  -- Exemple: {
  --   "1-5": {
  --     "viewType": "FRONT",
  --     "viewName": "Devant",
  --     "imageUrl": "https://...",
  --     "delimitation": {...}
  --   }
  -- }

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Index pour performance

```sql
-- Index JSONB pour recherche rapide
CREATE INDEX idx_order_items_customization_ids
ON order_items USING gin(customization_ids);

CREATE INDEX idx_order_items_design_elements
ON order_items USING gin(design_elements_by_view);

CREATE INDEX idx_order_items_view_metadata
ON order_items USING gin(view_metadata);

-- Index pour filtre par commande
CREATE INDEX idx_order_items_order_id
ON order_items(order_id);
```

---

## 🔄 Flux de stockage complet

### Étape 1 : Réception des données du frontend

```json
{
  "orderItems": [{
    "productId": 45,
    "customizationIds": {
      "1-5": 456,
      "1-6": 457
    },
    "designElementsByView": {
      "1-5": [
        {
          "id": "text-abc",
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
          "textAlign": "center",
          "zIndex": 1
        }
      ],
      "1-6": [...]
    },
    "delimitations": [
      {
        "viewId": 5,
        "viewType": "FRONT",
        "imageUrl": "https://storage.example.com/products/tshirt-blanc-front.jpg",
        "x": 10,
        "y": 15,
        "width": 30,
        "height": 40,
        "coordinateType": "PERCENTAGE",
        "referenceWidth": 800,
        "referenceHeight": 1000
      },
      {
        "viewId": 6,
        "viewType": "BACK",
        "imageUrl": "https://storage.example.com/products/tshirt-blanc-back.jpg",
        "x": 10,
        "y": 15,
        "width": 30,
        "height": 40,
        "coordinateType": "PERCENTAGE",
        "referenceWidth": 800,
        "referenceHeight": 1000
      }
    ]
  }]
}
```

### Étape 2 : Enrichir et stocker les métadonnées

```javascript
async function createOrderItem(orderId, itemData, transaction) {
  // 1. Construire les métadonnées des vues
  const viewMetadata = {};

  if (itemData.delimitations && itemData.customizationIds) {
    for (const [viewKey, customizationId] of Object.entries(itemData.customizationIds)) {
      const [colorId, viewId] = viewKey.split('-').map(Number);

      // Trouver la délimitation correspondante
      const delimitation = itemData.delimitations.find(d => d.viewId === viewId);

      if (delimitation) {
        viewMetadata[viewKey] = {
          viewId: viewId,
          viewType: delimitation.viewType || 'OTHER',
          viewName: getViewName(delimitation.viewType),
          imageUrl: delimitation.imageUrl,
          customizationId: customizationId,
          delimitation: {
            x: delimitation.x,
            y: delimitation.y,
            width: delimitation.width,
            height: delimitation.height,
            coordinateType: delimitation.coordinateType || 'PERCENTAGE',
            referenceWidth: delimitation.referenceWidth || 800,
            referenceHeight: delimitation.referenceHeight || 1000
          }
        };
      }
    }
  }

  // 2. Créer l'order item avec toutes les données
  const orderItem = await OrderItem.create({
    orderId: orderId,
    productId: itemData.productId,
    quantity: itemData.quantity,
    unitPrice: itemData.unitPrice,
    size: itemData.size,
    color: itemData.color,
    colorId: itemData.colorId,

    // Customisations complètes
    customizationId: itemData.customizationId,
    customizationIds: itemData.customizationIds,
    designElementsByView: itemData.designElementsByView,
    viewMetadata: viewMetadata,  // 🆕 Métadonnées enrichies
  }, { transaction });

  console.log('✅ Order item créé avec métadonnées:', {
    orderId,
    itemId: orderItem.id,
    viewsCount: Object.keys(viewMetadata).length
  });

  return orderItem;
}

// Helper pour traduire le type de vue
function getViewName(viewType) {
  const viewNames = {
    'FRONT': 'Devant',
    'BACK': 'Arrière',
    'LEFT': 'Gauche',
    'RIGHT': 'Droite',
    'TOP': 'Dessus',
    'BOTTOM': 'Dessous',
    'DETAIL': 'Détail',
    'OTHER': 'Autre'
  };
  return viewNames[viewType?.toUpperCase()] || viewType || 'Vue';
}
```

---

## 📡 API pour l'affichage admin

### Endpoint 1 : Récupérer une commande avec customisations

**Route** : `GET /admin/orders/:orderId`

```javascript
async function getOrderForAdmin(req, res) {
  const { orderId } = req.params;

  try {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'description', 'price']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Enrichir les items avec les détails de customization
    const enrichedItems = await Promise.all(
      order.orderItems.map(async (item) => {
        const itemData = item.toJSON();

        // Si l'item a des customisations
        if (itemData.customizationIds) {
          // Récupérer les customizations complètes depuis la BDD
          const customizationIdArray = Object.values(itemData.customizationIds);

          const customizations = await Customization.findAll({
            where: {
              id: { [Op.in]: customizationIdArray }
            }
          });

          // Organiser par vue
          itemData.customizationsByView = {};
          for (const [viewKey, customizationId] of Object.entries(itemData.customizationIds)) {
            const customization = customizations.find(c => c.id === customizationId);
            if (customization) {
              itemData.customizationsByView[viewKey] = customization;
            }
          }

          // Ajouter les informations enrichies
          itemData.customizationDetails = {
            totalViews: Object.keys(itemData.customizationIds).length,
            viewKeys: Object.keys(itemData.customizationIds),
            hasMetadata: !!itemData.viewMetadata,
            viewNames: Object.entries(itemData.viewMetadata || {}).map(([key, meta]) => ({
              key,
              name: meta.viewName,
              type: meta.viewType
            }))
          };
        }

        return itemData;
      })
    );

    // Remplacer les items avec les données enrichies
    const orderData = order.toJSON();
    orderData.orderItems = enrichedItems;

    res.json({
      success: true,
      data: orderData
    });

  } catch (error) {
    console.error('Erreur récupération commande admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}
```

### Réponse JSON pour l'admin

```json
{
  "success": true,
  "data": {
    "id": 789,
    "orderNumber": "ORD-2025-ABC123",
    "status": "CONFIRMED",
    "totalAmount": 15000,
    "orderItems": [
      {
        "id": 1234,
        "productId": 45,
        "quantity": 1,
        "size": "M",
        "color": "Blanc",

        "customizationIds": {
          "1-5": 456,
          "1-6": 457
        },

        "designElementsByView": {
          "1-5": [
            {
              "id": "text-abc",
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
            }
          ],
          "1-6": [...]
        },

        "viewMetadata": {
          "1-5": {
            "viewId": 5,
            "viewType": "FRONT",
            "viewName": "Devant",
            "imageUrl": "https://storage.example.com/products/tshirt-blanc-front.jpg",
            "customizationId": 456,
            "delimitation": {
              "x": 10,
              "y": 15,
              "width": 30,
              "height": 40,
              "coordinateType": "PERCENTAGE",
              "referenceWidth": 800,
              "referenceHeight": 1000
            }
          },
          "1-6": {
            "viewId": 6,
            "viewType": "BACK",
            "viewName": "Arrière",
            "imageUrl": "https://storage.example.com/products/tshirt-blanc-back.jpg",
            "customizationId": 457,
            "delimitation": {...}
          }
        },

        "customizationDetails": {
          "totalViews": 2,
          "viewKeys": ["1-5", "1-6"],
          "hasMetadata": true,
          "viewNames": [
            {"key": "1-5", "name": "Devant", "type": "FRONT"},
            {"key": "1-6", "name": "Arrière", "type": "BACK"}
          ]
        },

        "product": {
          "id": 45,
          "name": "T-Shirt Premium Coton",
          "price": 15000
        }
      }
    ]
  }
}
```

---

## 🎨 Endpoint pour générer un mockup de vue

**Route** : `GET /admin/orders/:orderId/items/:itemId/preview/:viewKey`

```javascript
async function getItemViewPreview(req, res) {
  const { orderId, itemId, viewKey } = req.params;

  try {
    const orderItem = await OrderItem.findOne({
      where: {
        id: itemId,
        orderId: orderId
      }
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: 'Item non trouvé'
      });
    }

    // Extraire les données pour cette vue
    const viewElements = orderItem.designElementsByView?.[viewKey] || [];
    const viewMeta = orderItem.viewMetadata?.[viewKey];

    if (!viewMeta) {
      return res.status(404).json({
        success: false,
        message: `Vue "${viewKey}" non trouvée`
      });
    }

    res.json({
      success: true,
      data: {
        viewKey: viewKey,
        viewName: viewMeta.viewName,
        viewType: viewMeta.viewType,
        imageUrl: viewMeta.imageUrl,
        delimitation: viewMeta.delimitation,
        elements: viewElements,
        elementCount: viewElements.length
      }
    });

  } catch (error) {
    console.error('Erreur récupération preview:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}
```

### Réponse

```json
{
  "success": true,
  "data": {
    "viewKey": "1-5",
    "viewName": "Devant",
    "viewType": "FRONT",
    "imageUrl": "https://storage.example.com/products/tshirt-blanc-front.jpg",
    "delimitation": {
      "x": 10,
      "y": 15,
      "width": 30,
      "height": 40,
      "coordinateType": "PERCENTAGE",
      "referenceWidth": 800,
      "referenceHeight": 1000
    },
    "elements": [
      {
        "id": "text-abc",
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
      }
    ],
    "elementCount": 1
  }
}
```

---

## 📊 Requêtes SQL utiles pour l'admin

### 1. Lister toutes les commandes avec customisations

```sql
SELECT
  o.id,
  o.order_number,
  o.status,
  o.created_at,
  COUNT(DISTINCT oi.id) AS total_items,
  COUNT(DISTINCT CASE WHEN oi.customization_ids IS NOT NULL THEN oi.id END) AS customized_items,
  SUM((jsonb_each(oi.customization_ids)).value::text::int) FILTER (WHERE oi.customization_ids IS NOT NULL) AS total_views
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY o.id
ORDER BY o.created_at DESC;
```

### 2. Extraire tous les éléments de texte d'une commande

```sql
SELECT
  oi.id AS item_id,
  p.name AS product_name,
  views.view_key,
  vm.value->>'viewName' AS view_name,
  elem->>'text' AS custom_text,
  elem->>'fontSize' AS font_size,
  elem->>'fontFamily' AS font_family,
  elem->>'color' AS text_color,
  elem->>'x' AS position_x,
  elem->>'y' AS position_y
FROM order_items oi
JOIN products p ON p.id = oi.product_id
CROSS JOIN LATERAL jsonb_each(oi.design_elements_by_view) AS views(view_key, view_elements)
CROSS JOIN LATERAL jsonb_each(oi.view_metadata) AS vm(vm_key, value)
CROSS JOIN LATERAL jsonb_array_elements(views.view_elements) AS elem
WHERE oi.order_id = 789
  AND elem->>'type' = 'text'
  AND views.view_key = vm.vm_key
ORDER BY views.view_key, (elem->>'zIndex')::int;
```

### 3. Statistiques par type d'élément

```sql
SELECT
  elem->>'type' AS element_type,
  COUNT(*) AS usage_count,
  COUNT(DISTINCT oi.order_id) AS orders_count,
  AVG((elem->>'fontSize')::numeric) FILTER (WHERE elem->>'type' = 'text') AS avg_font_size
FROM order_items oi
CROSS JOIN LATERAL jsonb_each(oi.design_elements_by_view) AS views(view_key, view_elements)
CROSS JOIN LATERAL jsonb_array_elements(views.view_elements) AS elem
WHERE oi.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY elem->>'type';
```

### 4. Récupérer les métadonnées d'une vue spécifique

```sql
SELECT
  oi.id,
  oi.view_metadata->'1-5' AS front_view_metadata,
  oi.view_metadata->'1-5'->>'viewName' AS view_name,
  oi.view_metadata->'1-5'->>'imageUrl' AS view_image_url,
  jsonb_array_length(oi.design_elements_by_view->'1-5') AS elements_count
FROM order_items oi
WHERE oi.order_id = 789;
```

---

## 🖼️ Exemple de composant frontend admin (React)

```typescript
// AdminOrderItemPreview.tsx
import React, { useState } from 'react';

interface OrderItemWithCustomization {
  id: number;
  customizationIds: Record<string, number>;
  designElementsByView: Record<string, any[]>;
  viewMetadata: Record<string, any>;
}

const AdminOrderItemPreview: React.FC<{
  item: OrderItemWithCustomization;
}> = ({ item }) => {
  const [selectedViewIndex, setSelectedViewIndex] = useState(0);

  // Extraire les vues disponibles
  const availableViews = Object.entries(item.viewMetadata || {}).map(
    ([viewKey, metadata]) => ({
      viewKey,
      ...metadata
    })
  );

  const currentView = availableViews[selectedViewIndex];
  const currentElements = currentView
    ? item.designElementsByView[currentView.viewKey] || []
    : [];

  return (
    <div className="admin-customization-preview">
      {/* Navigation entre les vues */}
      <div className="view-navigation">
        {availableViews.map((view, index) => (
          <button
            key={view.viewKey}
            onClick={() => setSelectedViewIndex(index)}
            className={selectedViewIndex === index ? 'active' : ''}
          >
            {view.viewName}
          </button>
        ))}
      </div>

      {/* Aperçu de la vue */}
      {currentView && (
        <div className="view-preview">
          <div className="product-image">
            <img src={currentView.imageUrl} alt={currentView.viewName} />

            {/* Overlay des éléments */}
            {currentElements.map((element, idx) => (
              <div
                key={element.id || idx}
                className="design-element"
                style={{
                  position: 'absolute',
                  left: `${element.x * 100}%`,
                  top: `${element.y * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`
                }}
              >
                {element.type === 'text' ? (
                  <div
                    style={{
                      fontSize: element.fontSize,
                      fontFamily: element.fontFamily,
                      color: element.color,
                      fontWeight: element.fontWeight
                    }}
                  >
                    {element.text}
                  </div>
                ) : (
                  <img src={element.imageUrl} alt="Design" />
                )}
              </div>
            ))}
          </div>

          {/* Détails des éléments */}
          <div className="elements-details">
            <h3>Éléments ({currentElements.length})</h3>
            {currentElements.map((element, idx) => (
              <div key={idx} className="element-info">
                <strong>{element.type}</strong>
                {element.type === 'text' && (
                  <div>
                    <p>Texte: {element.text}</p>
                    <p>Police: {element.fontFamily}, {element.fontSize}px</p>
                    <p>Couleur: {element.color}</p>
                  </div>
                )}
                <p>Position: ({(element.x * 100).toFixed(1)}%, {(element.y * 100).toFixed(1)}%)</p>
                <p>Rotation: {element.rotation}°</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderItemPreview;
```

---

## ✅ Checklist d'implémentation backend

### Phase 1 : Structure des données
- [ ] Ajouter `customization_ids` (JSONB) à `order_items`
- [ ] Ajouter `design_elements_by_view` (JSONB) à `order_items`
- [ ] Ajouter `view_metadata` (JSONB) à `order_items` (recommandé)
- [ ] Créer les index JSONB

### Phase 2 : Endpoints de création
- [ ] Modifier `POST /orders` pour stocker `customizationIds`
- [ ] Modifier `POST /orders` pour stocker `designElementsByView`
- [ ] Enrichir et stocker `viewMetadata`
- [ ] Mettre à jour `customizations.order_id` et `status`

### Phase 3 : Endpoints admin
- [ ] Créer `GET /admin/orders/:orderId` avec customisations enrichies
- [ ] Créer `GET /admin/orders/:orderId/items/:itemId/preview/:viewKey`
- [ ] Tester la récupération des métadonnées
- [ ] Vérifier que toutes les vues sont accessibles

### Phase 4 : Tests
- [ ] Tester avec 1 vue
- [ ] Tester avec 2+ vues
- [ ] Vérifier les métadonnées
- [ ] Vérifier les coordonnées des éléments
- [ ] Tester les requêtes SQL de statistiques

---

## 🎯 Résumé pour l'admin

Avec cette implémentation, l'admin pourra :

1. ✅ **Voir toutes les vues** personnalisées d'un produit
2. ✅ **Naviguer entre les vues** avec un slider
3. ✅ **Visualiser les éléments** (texte, images) sur chaque vue
4. ✅ **Consulter les coordonnées** exactes de chaque élément
5. ✅ **Accéder aux métadonnées** pour la production
6. ✅ **Générer des statistiques** sur les customisations

**Données stockées par item** :
- `customization_ids` : `{"1-5": 456, "1-6": 457}`
- `design_elements_by_view` : Tous les éléments par vue
- `view_metadata` : URLs, délimitations, noms des vues

---

**Version** : 1.0
**Date** : 2025-01-17
**Priorité** : HAUTE 🔥
