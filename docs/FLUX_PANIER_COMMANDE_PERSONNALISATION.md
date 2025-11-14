# 🛒 Flux Complet : Panier et Commande avec Personnalisation

## 📋 Vue d'ensemble

Ce document décrit le flux complet pour ajouter un produit personnalisé au panier et passer une commande.

---

## 🎯 Parcours utilisateur

```
1. Personnalisation (/product/:id/customize)
   ↓
2. Sélection taille & quantité (Modal)
   ↓
3. Sauvegarde BDD (customizations table)
   ↓
4. Ajout au panier (avec customizationId)
   ↓
5. Visualisation panier (/cart)
   ↓
6. Formulaire de commande (/order-form)
   ↓
7. Paiement
   ↓
8. Confirmation (/order-confirmation)
```

---

## 🔧 Architecture Technique

### 1. Page de Personnalisation

**Fichier** : `src/pages/CustomerProductCustomizationPageV3.tsx`

**Fonctionnalités** :
- Personnalisation du produit (texte, images, designs)
- Choix de la couleur et de la vue
- Sauvegarde automatique dans localStorage
- Modal de sélection taille/quantité

**États principaux** :
```typescript
const [product, setProduct] = useState<AdminProduct | null>(null);
const [selectedColorVariation, setSelectedColorVariation] = useState<any>(null);
const [selectedView, setSelectedView] = useState<any>(null);
const [designElements, setDesignElements] = useState<any[]>([]);
const [showSizeModal, setShowSizeModal] = useState(false);
```

---

### 2. Flux d'Ajout au Panier

#### Étape 1 : Ouverture du modal de sélection

```typescript
const handleOpenSizeModal = () => {
  setShowSizeModal(true);
};
```

Le bouton dans l'interface :
```tsx
<Button onClick={handleOpenSizeModal} className="w-full py-6 text-lg">
  <ShoppingCart className="w-5 h-5 mr-2" />
  Choisir la quantité & taille
</Button>
```

#### Étape 2 : Sélection des tailles et quantités

**Composant** : `src/components/SizeQuantityModal.tsx`

L'utilisateur sélectionne :
- **Tailles disponibles** : S, M, L, XL, etc.
- **Quantité par taille** : 1, 2, 3, etc.

Exemple de sélection :
```typescript
[
  { size: 'M', quantity: 2 },
  { size: 'L', quantity: 1 }
]
```

#### Étape 3 : Sauvegarde de la personnalisation

```typescript
const handleAddToCart = async (selections: Array<{ size: string; quantity: number }>) => {
  // 1. Sauvegarder la personnalisation en BDD
  const customizationData = {
    productId: product.id,
    colorVariationId: selectedColorVariation?.id || 0,
    viewId: selectedView?.id || 0,
    designElements: designElements,
    sizeSelections: selections,
    sessionId: customizationService.getOrCreateSessionId(),
  };

  const result = await customizationService.saveCustomization(customizationData);

  // Récupère un objet avec : { id: number, ... }
  console.log('Customization ID:', result.id);
```

**Table BDD** : `customizations`
```sql
CREATE TABLE customizations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  session_id VARCHAR(255),
  product_id INTEGER NOT NULL,
  color_variation_id INTEGER,
  view_id INTEGER,
  design_elements JSONB NOT NULL,
  size_selections JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Étape 4 : Ajout au panier avec customizationId

```typescript
  // 2. Ajouter chaque sélection au panier
  for (const selection of selections) {
    for (let i = 0; i < selection.quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        suggestedPrice: product.suggestedPrice,
        color: selectedColorVariation?.name || 'Défaut',
        colorCode: selectedColorVariation?.colorCode || '#000000',
        size: selection.size,
        imageUrl: selectedView?.url || '',
        customizationId: result.id,  // ✨ LIEN VERS LA PERSONNALISATION
        designElements: designElements // Pour l'aperçu dans le panier
      });
    }
  }
}
```

#### Étape 5 : Navigation vers le panier

```typescript
  // 3. Fermer le modal
  setShowSizeModal(false);

  // 4. Proposer de voir le panier
  setTimeout(() => {
    if (window.confirm('Voulez-vous voir votre panier ?')) {
      navigate('/cart');
    }
  }, 500);
```

---

### 3. Système de Panier

**Fichier** : `src/contexts/CartContext.tsx`

**Type CartItem** : `src/types/cart.ts`

```typescript
export interface CartItem {
  id: string;                    // Unique ID: productId-color-size
  productId: number;
  name: string;
  price: number;
  suggestedPrice?: number;
  color: string;
  colorCode: string;
  size: string;
  quantity: number;
  imageUrl: string;

  // 🆕 Personnalisation
  customizationId?: number;      // Lien vers customizations.id
  designElements?: any[];        // Pour l'aperçu dans le panier

  // Autres champs...
  designUrl?: string;
  vendorName?: string;
  designId?: number;
  // ...
}
```

**Fonction addToCart** :

```typescript
const addToCart = (product: {
  id: number;
  name: string;
  price: number;
  color: string;
  size: string;
  imageUrl: string;
  customizationId?: number;
  designElements?: any[];
  // ...
}) => {
  const cartItemId = `${product.id}-${product.color}-${product.size}`;

  // Chercher si l'article existe déjà
  const existingItem = items.find(item => item.id === cartItemId);

  if (existingItem) {
    // Incrémenter la quantité
    setItems(items.map(item =>
      item.id === cartItemId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    ));
  } else {
    // Créer un nouvel article
    const newItem: CartItem = {
      id: cartItemId,
      productId: product.id,
      name: product.name,
      price: product.price,
      color: product.color,
      colorCode: product.colorCode,
      size: product.size,
      quantity: 1,
      imageUrl: product.imageUrl,
      customizationId: product.customizationId,
      designElements: product.designElements
    };

    setItems([...items, newItem]);
  }

  // Sauvegarde automatique dans localStorage
};
```

**Stockage** :
- Le panier est automatiquement sauvegardé dans `localStorage` avec la clé `'cart'`
- Restauré au chargement de l'application

---

### 4. Page du Panier

**Fichier** : `src/components/CartPage.tsx`

**Affichage** :
- Liste des articles avec aperçu de la personnalisation
- Quantités modifiables
- Prix total
- Bouton "Commander"

**Exemple de rendu avec personnalisation** :

```tsx
{items.map(item => (
  <div key={item.id} className="flex gap-4 border-b pb-4">
    <img src={item.imageUrl} alt={item.name} className="w-24 h-24" />

    <div className="flex-1">
      <h3>{item.name}</h3>
      <p>Couleur: {item.color}</p>
      <p>Taille: {item.size}</p>
      <p>Prix: {item.price} FCFA</p>

      {/* 🎨 Indicateur de personnalisation */}
      {item.customizationId && (
        <div className="bg-blue-50 p-2 rounded mt-2">
          <p className="text-xs text-blue-800">
            ✨ Produit personnalisé
            {item.designElements && ` - ${item.designElements.length} élément(s)`}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
        <span>{item.quantity}</span>
        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
        <button onClick={() => removeFromCart(item.id)}>Supprimer</button>
      </div>
    </div>
  </div>
))}
```

---

### 5. Formulaire de Commande

**Fichier** : `src/pages/ModernOrderFormPage.tsx`

**Données collectées** :
- Informations client (nom, email, téléphone, adresse)
- Mode de livraison (domicile, point relais, etc.)
- Mode de paiement (carte, mobile money, etc.)

**Soumission** :

```typescript
const handleSubmitOrder = async (formData) => {
  // 1. Récupérer les articles du panier
  const cartItems = items.map(item => ({
    productId: item.productId,
    colorVariationId: item.colorVariationId,
    size: item.size,
    quantity: item.quantity,
    price: item.price,
    customizationId: item.customizationId  // ✨ LIEN VERS LA PERSONNALISATION
  }));

  // 2. Créer la commande
  const order = {
    customerInfo: formData,
    items: cartItems,
    totalAmount: getTotalPrice(),
    paymentMethod: formData.paymentMethod,
    deliveryMethod: formData.deliveryMethod
  };

  // 3. Envoyer au backend
  const result = await orderService.createOrder(order);

  // 4. Rediriger vers le paiement
  if (result.paymentUrl) {
    window.location.href = result.paymentUrl;
  }
};
```

**Table BDD** : `orders` et `order_items`

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  session_id VARCHAR(255),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  delivery_address TEXT,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER,
  customization_id INTEGER REFERENCES customizations(id), -- ✨ LIEN
  size VARCHAR(50),
  quantity INTEGER,
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2)
);
```

---

### 6. Backend - Récupération des Personnalisations

Lors du traitement de la commande côté backend, le système peut récupérer les détails de personnalisation :

```javascript
// Backend Node.js/Express
app.post('/api/orders', async (req, res) => {
  const { customerInfo, items } = req.body;

  // 1. Créer la commande
  const order = await Order.create({
    customer_name: customerInfo.name,
    customer_email: customerInfo.email,
    // ...
  });

  // 2. Créer les items avec les personnalisations
  for (const item of items) {
    await OrderItem.create({
      order_id: order.id,
      product_id: item.productId,
      customization_id: item.customizationId, // ✨ LIEN
      size: item.size,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    });

    // 3. Récupérer les détails de personnalisation si nécessaire
    if (item.customizationId) {
      const customization = await Customization.findById(item.customizationId);

      console.log('Design elements:', customization.design_elements);
      console.log('Color:', customization.color_variation_id);
      console.log('View:', customization.view_id);

      // Générer un mockup, envoyer au fabricant, etc.
    }
  }

  res.json({ orderId: order.id });
});
```

---

### 7. Génération du Mockup Final

Pour la production, le système doit générer un mockup avec les éléments de design positionnés :

```javascript
// Service de génération de mockup
const generateMockup = async (customizationId) => {
  // 1. Récupérer la personnalisation
  const customization = await Customization.findById(customizationId);

  // 2. Récupérer le produit et ses images
  const product = await Product.findById(customization.product_id);
  const view = product.images.find(img => img.id === customization.view_id);

  // 3. Utiliser Canvas ou Sharp pour composer l'image
  const canvas = createCanvas(view.width, view.height);
  const ctx = canvas.getContext('2d');

  // Image du produit
  const productImage = await loadImage(view.url);
  ctx.drawImage(productImage, 0, 0);

  // Appliquer chaque élément de design
  for (const element of customization.design_elements) {
    if (element.type === 'text') {
      ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      ctx.fillStyle = element.color;
      ctx.fillText(element.text, element.x, element.y);
    } else if (element.type === 'image') {
      const designImage = await loadImage(element.imageUrl);
      ctx.drawImage(
        designImage,
        element.x,
        element.y,
        element.width,
        element.height
      );
    }
  }

  // 4. Sauvegarder le mockup final
  const buffer = canvas.toBuffer('image/png');
  const mockupUrl = await uploadToS3(buffer, `mockups/${customizationId}.png`);

  return mockupUrl;
};
```

---

## 📊 Schéma de Base de Données Complet

```sql
-- Produits
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Variations de couleur
CREATE TABLE color_variations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  name VARCHAR(100),
  color_code VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Images des produits (vues)
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  color_variation_id INTEGER REFERENCES color_variations(id),
  url TEXT,
  view_name VARCHAR(100),  -- 'front', 'back', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Délimitations (zones personnalisables)
CREATE TABLE delimitations (
  id SERIAL PRIMARY KEY,
  product_image_id INTEGER REFERENCES product_images(id),
  x FLOAT,
  y FLOAT,
  width FLOAT,
  height FLOAT,
  reference_width FLOAT,
  reference_height FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 🎨 Personnalisations
CREATE TABLE customizations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255),  -- Pour les guests
  product_id INTEGER REFERENCES products(id),
  color_variation_id INTEGER REFERENCES color_variations(id),
  view_id INTEGER REFERENCES product_images(id),
  design_elements JSONB NOT NULL DEFAULT '[]',  -- Éléments de design
  size_selections JSONB,                         -- Tailles sélectionnées
  preview_image_url TEXT,                        -- Mockup généré
  status VARCHAR(50) DEFAULT 'draft',            -- 'draft', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 🛒 Commandes
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  delivery_address TEXT,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 📦 Items de commande
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  customization_id INTEGER REFERENCES customizations(id), -- ✨ LIEN
  color_variation_id INTEGER REFERENCES color_variations(id),
  size VARCHAR(50),
  quantity INTEGER,
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Points Clés

### ✅ Ce qui fonctionne maintenant :

1. ✅ **Personnalisation** : Texte, images, designs positionnables
2. ✅ **Sauvegarde localStorage** : Restauration après F5
3. ✅ **Sauvegarde BDD** : Via `customizationService.saveCustomization()`
4. ✅ **Ajout au panier** : Avec `customizationId` lié
5. ✅ **Navigation** : Proposition d'aller au panier après ajout

### 🚧 À implémenter côté backend :

1. 🔧 **API `/api/orders`** : Créer une commande avec les items
2. 🔧 **Génération mockups** : Canvas/Sharp pour créer les images finales
3. 🔧 **Webhook de paiement** : Mettre à jour le statut de commande
4. 🔧 **Email de confirmation** : Envoyer les détails au client
5. 🔧 **Interface admin** : Voir les commandes avec personnalisations

---

## 🧪 Test du flux complet

### Scénario de test :

1. **Aller sur** `/product/123/customize`
2. **Ajouter** un texte "Mon Design"
3. **Changer** la couleur en bleu
4. **Cliquer** sur "Choisir la quantité & taille"
5. **Sélectionner** M (x2), L (x1)
6. **Cliquer** sur "Ajouter au panier"
7. **Vérifier** :
   - ✅ Personnalisation sauvegardée en BDD (customizations.id)
   - ✅ 3 articles ajoutés au panier (2xM + 1xL)
   - ✅ Chaque article a un `customizationId`
8. **Aller** sur `/cart`
9. **Vérifier** :
   - ✅ Les 3 articles sont visibles
   - ✅ Badge "Produit personnalisé" affiché
   - ✅ Prix total correct
10. **Cliquer** sur "Commander"
11. **Remplir** le formulaire de commande
12. **Valider** et vérifier la redirection vers le paiement

---

## 📝 Résumé

Le flux est maintenant **complet côté frontend** :
- ✅ Personnalisation sauvegardée
- ✅ Panier fonctionnel avec `customizationId`
- ✅ Navigation fluide

Le backend doit maintenant :
- 🔧 Traiter les commandes avec les `customizationId`
- 🔧 Générer les mockups finaux
- 🔧 Gérer les paiements et confirmations
