# Guide Backend - Système de Customisation Multi-Vues

Ce document décrit la structure exacte des données de customisation à implémenter côté backend pour assurer la cohérence entre la création (CustomerProductCustomizationPageV3), la commande (ModernOrderFormPage) et l'affichage admin (OrderDetailPage).

## 📋 Vue d'ensemble

Le système de customisation permet aux clients de personnaliser des produits avec des éléments (texte, images, designs) positionnés sur différentes vues (devant, arrière, etc.). Chaque customisation est organisée par vue et doit conserver toutes les informations de positionnement et de délimitation.

---

## 🗄️ Structure de la Base de Données

### Table: `customizations`

```sql
CREATE TABLE customizations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255), -- Pour les utilisateurs non connectés
  color_variation_id INTEGER NOT NULL,
  view_id INTEGER NOT NULL,
  design_elements JSONB NOT NULL, -- Array d'éléments de design
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'finalized', 'ordered'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customizations_session ON customizations(session_id);
CREATE INDEX idx_customizations_product ON customizations(product_id);
```

### Table: `order_items`

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),

  -- Informations de base
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,

  -- Variations
  color VARCHAR(100),
  size VARCHAR(50),
  color_variation_id INTEGER,
  size_id INTEGER,

  -- URLs d'images
  image_url TEXT,
  mockup_url TEXT,

  -- 🔑 CUSTOMISATION MULTI-VUES
  design_elements_by_view JSONB, -- Structure: {"colorId-viewId": [...elements]}
  customization_ids JSONB, -- Structure: {"colorId-viewId": customizationId}

  -- 🔑 MÉTADONNÉES DES VUES
  views_metadata JSONB, -- Array des infos par vue (imageUrl, viewType, etc.)

  -- 🔑 DÉLIMITATIONS (CRITIQUES)
  delimitation JSONB, -- Délimitation principale (première vue)
  delimitations JSONB, -- Array de toutes les délimitations par vue

  -- Données de couleur complètes
  color_variation JSONB, -- Objet complet avec images, delimitations, etc.

  -- Design vendeur (si applicable)
  design_id INTEGER,
  design_metadata JSONB,
  saved_design_position JSONB,

  -- Métadonnées produit enrichi
  enriched_vendor_product JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📦 Format des Données de Customisation

### 1. Structure `design_elements_by_view`

Organisation des éléments par vue (clé = `"colorId-viewId"`):

```json
{
  "12-45": [
    {
      "id": "text_1234567890",
      "type": "text",
      "text": "Mon Texte",
      "x": 0.5,
      "y": 0.3,
      "width": 200,
      "height": 50,
      "rotation": 0,
      "zIndex": 1,
      "fontSize": 24,
      "fontFamily": "Arial",
      "color": "#000000",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center"
    },
    {
      "id": "image_9876543210",
      "type": "image",
      "imageUrl": "https://example.com/design.png",
      "x": 0.5,
      "y": 0.6,
      "width": 150,
      "height": 150,
      "rotation": 0,
      "zIndex": 2,
      "designId": 789,
      "designPrice": 5000,
      "designName": "Logo Cool"
    }
  ],
  "12-46": [
    {
      "id": "text_1111111111",
      "type": "text",
      "text": "Dos",
      "x": 0.5,
      "y": 0.5,
      "width": 180,
      "height": 40,
      "rotation": 0,
      "zIndex": 1,
      "fontSize": 20,
      "fontFamily": "Arial",
      "color": "#FFFFFF"
    }
  ]
}
```

**⚠️ IMPORTANT - Règles de validation:**
- Les éléments DOIVENT être un array simple, JAMAIS un array imbriqué `[[...]]`
- Chaque élément DOIT avoir `id` et `type`
- Les positions `x` et `y` sont en coordonnées normalisées (0-1)
- Les dimensions `width` et `height` sont en pixels
- Pour les images avec `designId`, inclure `designPrice` pour le calcul du prix total

---

### 2. Structure `customization_ids`

Mapping des IDs de customisation par vue:

```json
{
  "12-45": 123,
  "12-46": 124
}
```

---

### 3. Structure `views_metadata`

Métadonnées complètes de chaque vue:

```json
[
  {
    "viewKey": "12-45",
    "viewId": 45,
    "colorVariationId": 12,
    "viewType": "FRONT",
    "imageUrl": "https://example.com/product-front.png",
    "elementsCount": 2
  },
  {
    "viewKey": "12-46",
    "viewId": 46,
    "colorVariationId": 12,
    "viewType": "BACK",
    "imageUrl": "https://example.com/product-back.png",
    "elementsCount": 1
  }
]
```

---

### 4. Structure `delimitation` (Principale)

**🚨 CRITIQUE - Cette structure doit être EXACTE:**

```json
{
  "x": 150.5,
  "y": 200.3,
  "width": 400.0,
  "height": 500.0,
  "coordinateType": "PIXEL",
  "referenceWidth": 1200,
  "referenceHeight": 1500
}
```

**Champs obligatoires:**
- `x`, `y`: Position du coin supérieur gauche de la zone de personnalisation (en pixels)
- `width`, `height`: Dimensions de la zone (en pixels)
- `coordinateType`: TOUJOURS `"PIXEL"` (pas `"PERCENTAGE"`)
- `referenceWidth`, `referenceHeight`: Dimensions RÉELLES de l'image produit

**⚠️ ERREUR FRÉQUENTE À ÉVITER:**
```json
{
  "referenceWidth": 800,
  "referenceHeight": 800
}
```
❌ Ces valeurs par défaut sont INCORRECTES et causent des problèmes de rendu!

---

### 5. Structure `delimitations` (Multi-vues)

Array de délimitations pour toutes les vues:

```json
[
  {
    "viewId": 45,
    "viewKey": "12-45",
    "viewType": "FRONT",
    "imageUrl": "https://example.com/product-front.png",
    "x": 150.5,
    "y": 200.3,
    "width": 400.0,
    "height": 500.0,
    "coordinateType": "PIXEL",
    "referenceWidth": 1200,
    "referenceHeight": 1500
  },
  {
    "viewId": 46,
    "viewKey": "12-46",
    "viewType": "BACK",
    "imageUrl": "https://example.com/product-back.png",
    "x": 180.0,
    "y": 220.0,
    "width": 380.0,
    "height": 480.0,
    "coordinateType": "PIXEL",
    "referenceWidth": 1200,
    "referenceHeight": 1500
  }
]
```

---

### 6. Structure `color_variation`

Objet complet de la variation de couleur avec toutes ses images et délimitations:

```json
{
  "id": 12,
  "name": "Noir",
  "colorCode": "#000000",
  "images": [
    {
      "id": 45,
      "url": "https://example.com/product-front.png",
      "viewType": "FRONT",
      "delimitations": [
        {
          "x": 150.5,
          "y": 200.3,
          "width": 400.0,
          "height": 500.0,
          "coordinateType": "PIXEL",
          "referenceWidth": 1200,
          "referenceHeight": 1500
        }
      ]
    },
    {
      "id": 46,
      "url": "https://example.com/product-back.png",
      "viewType": "BACK",
      "delimitations": [
        {
          "x": 180.0,
          "y": 220.0,
          "width": 380.0,
          "height": 480.0,
          "coordinateType": "PIXEL",
          "referenceWidth": 1200,
          "referenceHeight": 1500
        }
      ]
    }
  ]
}
```

---

## 🔄 Workflow Complet

### Étape 1: Création de la Customisation (Frontend)

**Page:** `CustomerProductCustomizationPageV3.tsx`

```typescript
// L'utilisateur personnalise le produit
const elementsByView = {
  "12-45": [/* éléments vue devant */],
  "12-46": [/* éléments vue arrière */]
};

// Sauvegarde draft (auto-save)
await customizationService.saveCustomization({
  productId: 123,
  colorVariationId: 12,
  viewId: 45, // Vue principale
  designElements: elementsByView["12-45"],
  sessionId: "uuid-session-123"
});
```

### Étape 2: Ajout au Panier

**Page:** `CustomerProductCustomizationPageV3.tsx` → fonction `handleAddToCart` (ligne 715)

```typescript
// Filtrer les vues avec éléments (couleur actuelle uniquement)
const viewsWithElements = Object.entries(elementsByView).filter(
  ([viewKey, elements]) => {
    const [colorId] = viewKey.split('-').map(Number);
    return colorId === selectedColorVariation.id && elements.length > 0;
  }
);

// Sauvegarder chaque vue en BDD
const customizationIds = {};
for (const [viewKey, elements] of viewsWithElements) {
  const [colorId, viewId] = viewKey.split('-').map(Number);

  const result = await customizationService.saveCustomization({
    productId,
    colorVariationId: colorId,
    viewId: viewId,
    designElements: elements,
    sizeSelections: selections,
    sessionId: sessionId
  });

  customizationIds[viewKey] = result.id;
}

// Ajouter au panier avec TOUTES les données
addToCart({
  // ... données de base
  customizationIds: customizationIds,
  designElementsByView: designElementsByViewKey,
  delimitations: allDelimitations
});
```

### Étape 3: Passage de Commande

**Page:** `ModernOrderFormPage.tsx`

Le panier est envoyé au backend avec la structure complète:

```typescript
const orderData = {
  items: cartItems.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.price,
    size: item.size,
    color: item.color,
    colorVariationId: item.colorVariationId,

    // 🔑 Données de customisation
    designElementsByView: item.designElementsByView,
    customizationIds: item.customizationIds,

    // 🔑 Métadonnées
    viewsMetadata: buildViewsMetadata(item),

    // 🔑 Délimitations
    delimitation: item.delimitations?.[0], // Première vue
    delimitations: item.delimitations,

    // 🔑 Variation de couleur complète
    colorVariation: buildColorVariationObject(item)
  }))
};
```

### Étape 4: Enregistrement en Base (Backend)

**Endpoint:** `POST /api/orders`

```javascript
// Pour chaque item de commande
const orderItem = {
  order_id: orderId,
  product_id: item.productId,

  // Données de base
  name: item.name,
  quantity: item.quantity,
  unit_price: item.unitPrice,
  total_price: item.totalPrice,

  // Variations
  color: item.color,
  size: item.size,
  color_variation_id: item.colorVariationId,

  // 🔑 CUSTOMISATION (Sauvegarder TEL QUEL, pas de transformation)
  design_elements_by_view: item.designElementsByView,
  customization_ids: item.customizationIds,
  views_metadata: item.viewsMetadata,

  // 🔑 DÉLIMITATIONS (CRITIQUES)
  delimitation: item.delimitation,
  delimitations: item.delimitations,

  // 🔑 COLOR VARIATION (Objet complet)
  color_variation: item.colorVariation
};

// ⚠️ VALIDATION AVANT INSERTION
if (orderItem.design_elements_by_view) {
  for (const [viewKey, elements] of Object.entries(orderItem.design_elements_by_view)) {
    // Vérifier que ce n'est PAS un array imbriqué
    if (Array.isArray(elements) && Array.isArray(elements[0])) {
      throw new Error(`Double wrapping détecté pour la vue ${viewKey}`);
    }

    // Vérifier que chaque élément a id et type
    for (const el of elements) {
      if (!el.id || !el.type) {
        throw new Error(`Élément invalide dans la vue ${viewKey}`);
      }
    }
  }
}

// Vérifier les délimitations
if (orderItem.delimitations) {
  for (const delim of orderItem.delimitations) {
    if (!delim.referenceWidth || !delim.referenceHeight) {
      throw new Error('Délimitation sans dimensions de référence');
    }
    if (delim.referenceWidth === 800 || delim.referenceHeight === 800) {
      console.warn('⚠️ Valeurs de référence suspectes (800x800)');
    }
  }
}

await db.query('INSERT INTO order_items SET ?', orderItem);
```

### Étape 5: Affichage Admin

**Page:** `OrderDetailPage.tsx`

```typescript
// Récupération depuis la BDD
const order = await getOrderById(orderId);

// Pour chaque item
order.items.forEach(item => {
  // ✅ Utiliser directement les données sauvegardées
  const elementsByView = item.designElementsByView || {};
  const viewsMetadata = item.viewsMetadata || [];

  // ✅ Récupérer les délimitations dans l'ordre de priorité
  let delimitation = item.delimitation;

  if (!delimitation && item.colorVariation?.images) {
    // Chercher dans colorVariation.images[].delimitations
    for (const image of item.colorVariation.images) {
      if (image.delimitations?.[0]) {
        delimitation = image.delimitations[0];
        break;
      }
    }
  }

  // Afficher chaque vue
  Object.entries(elementsByView).forEach(([viewKey, elements]) => {
    const [colorId, viewId] = viewKey.split('-').map(Number);

    // Trouver la délimitation spécifique à cette vue
    let viewDelimitation = delimitation;
    if (item.colorVariation?.images) {
      const viewImage = item.colorVariation.images.find(img => img.id === viewId);
      if (viewImage?.delimitations?.[0]) {
        viewDelimitation = viewImage.delimitations[0];
      }
    }

    // Render
    <CustomizationPreview
      productImageUrl={viewImage.url}
      designElements={elements}
      delimitation={viewDelimitation}
    />
  });
});
```

---

## 🛡️ Règles de Validation Backend

### 1. Validation des Éléments

```javascript
function validateDesignElements(elements) {
  if (!Array.isArray(elements)) {
    throw new Error('design_elements doit être un array');
  }

  // ❌ Bloquer le double wrapping
  if (elements.length > 0 && Array.isArray(elements[0])) {
    throw new Error('Double wrapping d\'array détecté');
  }

  for (const element of elements) {
    // Champs obligatoires
    if (!element.id || !element.type) {
      throw new Error('Élément sans id ou type');
    }

    // Validation par type
    if (element.type === 'text') {
      if (!element.text) {
        throw new Error('Élément texte sans contenu');
      }
      if (!element.fontSize || !element.fontFamily) {
        throw new Error('Élément texte sans police');
      }
    }

    if (element.type === 'image') {
      if (!element.imageUrl) {
        throw new Error('Élément image sans URL');
      }
    }

    // Positions
    if (typeof element.x !== 'number' || typeof element.y !== 'number') {
      throw new Error('Position invalide');
    }

    if (typeof element.width !== 'number' || typeof element.height !== 'number') {
      throw new Error('Dimensions invalides');
    }
  }

  return true;
}
```

### 2. Validation des Délimitations

```javascript
function validateDelimitation(delimitation) {
  if (!delimitation) return false;

  // Champs obligatoires
  const required = ['x', 'y', 'width', 'height', 'referenceWidth', 'referenceHeight'];
  for (const field of required) {
    if (typeof delimitation[field] !== 'number') {
      throw new Error(`Délimitation: ${field} manquant ou invalide`);
    }
  }

  // ⚠️ Détecter les valeurs suspectes
  if (delimitation.referenceWidth === 800 || delimitation.referenceHeight === 800) {
    console.warn('⚠️ Délimitation avec valeurs 800x800 (possiblement incorrectes)');
  }

  // Vérifier le format
  if (delimitation.coordinateType && delimitation.coordinateType !== 'PIXEL' && delimitation.coordinateType !== 'PERCENTAGE') {
    throw new Error('coordinateType invalide (doit être PIXEL ou PERCENTAGE)');
  }

  return true;
}
```

---

## 📊 Endpoints API Requis

### 1. Sauvegarder une Customisation (Draft ou Final)

```
POST /api/customizations
Content-Type: application/json

{
  "productId": 123,
  "colorVariationId": 12,
  "viewId": 45,
  "designElements": [...],
  "sessionId": "uuid-123",
  "status": "draft" | "finalized"
}

Response:
{
  "id": 456,
  "productId": 123,
  "colorVariationId": 12,
  "viewId": 45,
  "designElements": [...],
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

### 2. Récupérer le Draft d'un Produit

```
GET /api/customizations/draft/:productId
Headers: { sessionId: "uuid-123" }

Response:
{
  "id": 456,
  "productId": 123,
  "colorVariationId": 12,
  "viewId": 45,
  "designElements": [...],
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

### 3. Créer une Commande

```
POST /api/orders
Content-Type: application/json

{
  "userId": 789,
  "shippingAddress": {...},
  "phoneNumber": "+221 XX XXX XX XX",
  "items": [
    {
      "productId": 123,
      "quantity": 2,
      "unitPrice": 15000,
      "size": "M",
      "color": "Noir",
      "colorVariationId": 12,

      // Customisation
      "designElementsByView": {
        "12-45": [...],
        "12-46": [...]
      },
      "customizationIds": {
        "12-45": 456,
        "12-46": 457
      },
      "viewsMetadata": [...],
      "delimitation": {...},
      "delimitations": [...],
      "colorVariation": {...}
    }
  ]
}
```

### 4. Récupérer les Détails d'une Commande (Admin)

```
GET /api/admin/orders/:orderId

Response:
{
  "id": 1001,
  "orderNumber": "ORD-2025-001",
  "status": "PENDING",
  "user": {...},
  "shippingAddress": {...},
  "orderItems": [
    {
      "id": 5001,
      "productId": 123,
      "name": "T-Shirt Premium",
      "quantity": 2,
      "unitPrice": 15000,
      "totalPrice": 30000,

      // Customisation complète
      "designElementsByView": {
        "12-45": [...],
        "12-46": [...]
      },
      "customizationIds": {...},
      "viewsMetadata": [...],
      "delimitation": {...},
      "delimitations": [...],
      "colorVariation": {...}
    }
  ],
  "totalAmount": 30000,
  "createdAt": "2025-01-15T11:00:00Z"
}
```

---

## 🐛 Problèmes Fréquents et Solutions

### Problème 1: Double Wrapping d'Arrays

**Symptôme:**
```json
{
  "designElementsByView": {
    "12-45": [[/* éléments */]]  // ❌ Array imbriqué
  }
}
```

**Cause:** Mauvaise manipulation côté frontend ou backend

**Solution:**
```javascript
// Backend - Validation avant sauvegarde
if (Array.isArray(elements[0])) {
  throw new Error('Double wrapping détecté');
}

// Frontend - Vérification avant envoi
if (Array.isArray(currentElements[0])) {
  console.error('BUG: Double wrapping détecté');
  return; // Ne pas envoyer
}
```

---

### Problème 2: Délimitations avec Valeurs 800x800

**Symptôme:**
```json
{
  "referenceWidth": 800,
  "referenceHeight": 800
}
```
Résultat: Éléments mal positionnés car les vraies dimensions sont différentes

**Solution:**
```javascript
// Backend - Obtenir les VRAIES dimensions depuis l'image produit
const productImage = await getProductImage(colorVariationId, viewId);
const imageMetadata = await getImageDimensions(productImage.url);

const delimitation = {
  ...delimData,
  referenceWidth: imageMetadata.width,  // Ex: 1200
  referenceHeight: imageMetadata.height // Ex: 1500
};
```

---

### Problème 3: Éléments Manquants après Restauration

**Symptôme:** Les éléments ne s'affichent pas dans OrderDetailPage

**Causes possibles:**
1. `designElementsByView` est `null` ou `undefined`
2. Les viewKeys ne correspondent pas (format incorrect)
3. Les délimitations sont manquantes
4. `colorVariation.images` est vide

**Solution:**
```javascript
// Backend - S'assurer que TOUTES les données sont sauvegardées
const orderItem = {
  // ... autres champs

  // NE JAMAIS laisser null
  design_elements_by_view: item.designElementsByView || {},
  delimitations: item.delimitations || [],
  color_variation: item.colorVariation || null,
  views_metadata: item.viewsMetadata || []
};

// S'assurer que color_variation inclut images avec delimitations
if (orderItem.color_variation && !orderItem.color_variation.images) {
  // Récupérer depuis la table color_variations
  const fullColorVariation = await getColorVariationWithImages(item.colorVariationId);
  orderItem.color_variation = fullColorVariation;
}
```

---

### Problème 4: Conversion Pourcentage vs Pixels

**Symptôme:** Éléments positionnés incorrectement

**Cause:** Confusion entre coordonnées normalisées (0-1) et pixels

**Standard du système:**
- **Éléments** (`x`, `y`): Coordonnées normalisées 0-1
- **Éléments** (`width`, `height`): Pixels
- **Délimitations**: Toujours en pixels

**Validation backend:**
```javascript
function validateElementPosition(element) {
  // x et y doivent être entre 0 et 1
  if (element.x < 0 || element.x > 1 || element.y < 0 || element.y > 1) {
    throw new Error('Position hors limites (doit être 0-1)');
  }

  // width et height en pixels (valeurs raisonnables)
  if (element.width < 10 || element.width > 2000) {
    throw new Error('Largeur invalide');
  }
  if (element.height < 10 || element.height > 2000) {
    throw new Error('Hauteur invalide');
  }
}
```

---

## ✅ Checklist Backend

### Configuration BDD
- [ ] Table `customizations` créée avec tous les champs
- [ ] Table `order_items` inclut tous les champs JSONB requis
- [ ] Index créés pour les performances

### Endpoints API
- [ ] `POST /api/customizations` - Sauvegarder draft
- [ ] `GET /api/customizations/draft/:productId` - Récupérer draft
- [ ] `POST /api/orders` - Créer commande avec customisations
- [ ] `GET /api/admin/orders/:orderId` - Détails complets pour admin

### Validation
- [ ] Validation des `design_elements` (pas de double wrapping)
- [ ] Validation des délimitations (champs obligatoires)
- [ ] Validation des positions (0-1 pour x/y)
- [ ] Validation des dimensions (pixels raisonnables)

### Enrichissement des Données
- [ ] Obtention des VRAIES dimensions d'image (`referenceWidth/Height`)
- [ ] Inclusion de `colorVariation` complet avec `images[]`
- [ ] Chaque `image` dans `colorVariation` inclut ses `delimitations[]`
- [ ] Métadonnées de vues (`viewsMetadata`) construites correctement

### Stockage
- [ ] `design_elements_by_view` sauvegardé TEL QUEL (pas de transformation)
- [ ] `delimitations` array complet sauvegardé
- [ ] `color_variation` objet complet sauvegardé
- [ ] Pas de valeurs `null` pour les champs JSONB (utiliser `{}` ou `[]`)

### Tests
- [ ] Test: Customisation simple (1 vue, 1 élément texte)
- [ ] Test: Customisation multi-vues (2+ vues)
- [ ] Test: Customisation avec designs payants
- [ ] Test: Récupération et affichage admin
- [ ] Test: Valeurs de référence correctes (pas 800x800)

---

## 📞 Support

Pour toute question sur l'implémentation backend, référez-vous à:
- `src/services/customizationService.ts` - Logique frontend de sauvegarde
- `src/pages/CustomerProductCustomizationPageV3.tsx` - Ligne 715+ pour `handleAddToCart`
- `src/pages/admin/OrderDetailPage.tsx` - Ligne 490+ pour affichage admin
- `src/components/order/CustomizationPreview.tsx` - Composant de rendu

---

**Version:** 1.0
**Date:** 2025-01-15
**Auteur:** Documentation Backend Customisation System
