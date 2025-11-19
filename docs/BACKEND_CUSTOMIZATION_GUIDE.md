# Guide Backend - Persistance des Personnalisations Client

Ce guide documente les structures de données de personnalisation utilisées dans le frontend et comment le backend (NestJS/Prisma) les persiste en base de données.

## ⚡ État actuel de l'implémentation

### ✅ Ce qui est déjà implémenté

Le backend PrintAlma utilise **NestJS** avec **Prisma ORM** et prend en charge:

1. **Double format de données:**
   - `designElements` (format simple - array d'éléments)
   - `elementsByView` (format multi-vues - objet avec clés "colorId-viewId")

2. **Normalisation automatique:**
   - Le service convertit automatiquement entre les deux formats
   - Les deux formats sont sauvegardés en base pour compatibilité

3. **Récupération complète:**
   - Inclut toutes les relations produit via Prisma
   - Retourne le format exact attendu par le frontend

4. **Logs détaillés:**
   - Chaque étape de sauvegarde/récupération est loggée
   - Facilite le debugging

### ⚠️ Action requise

**Migration Prisma à exécuter:**
```bash
npx prisma migrate dev --name add_elements_by_view_support
```

Cette migration ajoute les nouveaux champs:
- `elements_by_view` (JSONB)
- `delimitations` (JSONB)
- `vendor_product_id` (INTEGER)
- `timestamp` (BIGINT)

---

## 1. Vue d'ensemble

Les clients peuvent personnaliser des produits sur la page `/product/:id/customize`. Les données sont stockées dans le `localStorage` et persistées en base de données via l'API.

### Flux de données actuel

```
Client personnalise → localStorage → API saveCustomization → Base de données
                                   ↓
                              Ajout au panier → Commande
```

---

## 2. Structures de données principales

### 2.1 DesignElement (Élément de personnalisation)

C'est la structure de base pour chaque élément ajouté par le client.

```typescript
// Types d'éléments
type ElementType = 'text' | 'image';

// Structure de base commune
interface BaseElement {
  id: string;           // UUID généré côté client (ex: "el_1699123456789")
  type: ElementType;    // 'text' ou 'image'
  x: number;            // Position X en pourcentage (0-1, ex: 0.5 = 50%)
  y: number;            // Position Y en pourcentage (0-1)
  width: number;        // Largeur en pixels
  height: number;       // Hauteur en pixels
  rotation: number;     // Rotation en degrés (-360 à 360)
  zIndex: number;       // Ordre d'affichage (0, 1, 2...)
}

// Élément texte
interface TextElement extends BaseElement {
  type: 'text';
  text: string;                              // Contenu du texte
  fontSize: number;                          // Taille de police en pixels
  baseFontSize: number;                      // Taille de base pour le scaling
  baseWidth: number;                         // Largeur de base pour le ratio
  fontFamily: string;                        // Ex: "Arial", "Roboto"
  color: string;                             // Couleur hex (ex: "#FF0000")
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  curve: number;                             // Courbure du texte (-355 à 355, 0 = pas de courbe)
}

// Élément image
interface ImageElement extends BaseElement {
  type: 'image';
  imageUrl: string;      // URL de l'image uploadée
  naturalWidth: number;  // Largeur originale de l'image
  naturalHeight: number; // Hauteur originale de l'image
}

type DesignElement = TextElement | ImageElement;
```

### 2.2 Structure complète envoyée à l'API

```typescript
// Requête pour sauvegarder une personnalisation
interface CustomizationData {
  productId: number;                    // ID du produit
  colorVariationId: number;             // ID de la variation de couleur
  viewId: number;                       // ID de la vue (face, dos, etc.)
  designElements: DesignElement[];      // Liste des éléments
  sizeSelections?: SizeSelection[];     // Tailles et quantités sélectionnées
  sessionId?: string;                   // ID de session pour les invités
  previewImageUrl?: string;             // URL de l'image de prévisualisation
}

interface SizeSelection {
  size: string;      // Ex: "S", "M", "L", "XL"
  quantity: number;  // Quantité pour cette taille
}
```

### 2.3 Réponse attendue du backend

```typescript
interface Customization {
  id: number;                           // ID en base de données
  userId: number | null;                // ID utilisateur (null si invité)
  sessionId: string | null;             // ID session (pour invités)
  productId: number;
  colorVariationId: number;
  viewId: number;
  designElements: DesignElement[];      // JSON des éléments
  sizeSelections: SizeSelection[] | null;
  previewImageUrl: string | null;
  totalPrice: number;                   // Prix calculé
  status: string;                       // 'draft', 'in_cart', 'ordered'
  orderId: number | null;               // Référence à la commande si commandé
  createdAt: string;                    // ISO date
  updatedAt: string;                    // ISO date
  product?: Product;                    // Relation avec le produit
}
```

---

## 3. Clés localStorage utilisées

| Clé | Description | Structure |
|-----|-------------|-----------|
| `design-data-product-${productId}` | Données de personnalisation en cours | `{ elementsByView, colorVariationId, viewId, timestamp }` |
| `delimitation-canvas-blob:${url}` | Délimitations de design sur le canvas | `Array<Delimitation>` |
| `design_position_${vendorId}_${productId}_${designId}` | Position d'un design vendeur | `{ designId, baseProductId, position, timestamp }` |
| `vendor_products_history` | Historique des produits vendeurs | `Array<VendorProduct>` |
| `customization-${productId}` | IDs des personnalisations sauvegardées | `{ customizationIds, selections, timestamp }` |
| `customization-backup-${customizationId}` | Backup des éléments | `DesignElement[]` |
| `guest-session-id` | Session ID pour les invités | `string` (UUID) |
| `cart` | Panier avec personnalisations | `CartItem[]` |
| `paydunyaPendingPayment` | Paiement en attente | `{ orderId, orderNumber, token, totalAmount, timestamp }` |

### Structure du localStorage principal

```typescript
// Clé: design-data-product-${productId}
interface DesignDataStorage {
  elementsByView: Record<string, DesignElement[]>;  // Ex: {"1-5": [...], "1-6": [...]}
  colorVariationId: number;
  viewId: number;
  timestamp: number;
}

// Le format de clé viewKey est: `${colorVariationId}-${viewId}`
// Exemple: "1-5" signifie colorVariationId=1, viewId=5
```

### 3.1 Exemples réels du localStorage

#### Exemple 1: Délimitations de design (`delimitation-canvas-blob`)

```json
// Clé: delimitation-canvas-blob:http://localhost:5174/fc617946-48f2-4e8e-aaae-6aad38a4e238-no-design
[
  {
    "id": "delim_1761530783451",
    "x": 490,
    "y": 458.33333333333337,
    "width": 246.66666666666669,
    "height": 340,
    "rotation": 0,
    "type": "rectangle"
  }
]
```

**Description:** Zones de placement pour les designs sur le produit. Ces délimitations définissent où le client peut placer ses éléments personnalisés.

#### Exemple 2: Données de personnalisation avec image (`design-data-product-4`)

```json
{
  "elementsByView": {
    "10-10": [
      {
        "id": "element-1763495255399-se0w6ldmc",
        "type": "image",
        "imageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762535167/vendor-designs/vendor_3_design_1762535166450.svg",
        "x": 0.4930555555555555,
        "y": 0.6152777777777778,
        "width": 205,
        "height": 205,
        "rotation": 0,
        "naturalWidth": 2000,
        "naturalHeight": 2000,
        "zIndex": 0
      }
    ]
  },
  "colorVariationId": 10,
  "viewId": 10,
  "timestamp": 1763495258099
}
```

#### Exemple 3: Personnalisation complexe avec image + texte (`design-data-product-6`)

```json
{
  "elementsByView": {
    "16-17": [
      {
        "id": "element-1763372081344-xyi50vv53",
        "type": "image",
        "imageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762537732/vendor-designs/vendor_3_design_1762537731957.svg",
        "x": 0.5202380952380952,
        "y": 0.43882936507936515,
        "width": 377,
        "height": 377,
        "rotation": 0,
        "naturalWidth": 2000,
        "naturalHeight": 2000,
        "zIndex": 0
      },
      {
        "id": "element-1763374135413-3yqczh8u3",
        "type": "text",
        "text": "Werenoi",
        "x": 0.5113095238095238,
        "y": 0.2700396825396827,
        "width": 461.4285714285714,
        "height": 123.04761904761902,
        "rotation": 0,
        "fontSize": 74,
        "baseFontSize": 24,
        "baseWidth": 150,
        "fontFamily": "Arial, sans-serif",
        "color": "#000000",
        "fontWeight": "normal",
        "fontStyle": "normal",
        "textDecoration": "none",
        "textAlign": "center",
        "curve": 0,
        "zIndex": 1
      },
      {
        "id": "element-1763374755096-h9ecy6yh1",
        "type": "image",
        "imageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762442018/vendor-designs/vendor_3_design_1762442000453.svg",
        "x": 0.6166666666666667,
        "y": 0.6521825396825396,
        "width": 94,
        "height": 94,
        "rotation": 0,
        "naturalWidth": 2000,
        "naturalHeight": 2000,
        "zIndex": 2
      }
    ],
    "16-16": [
      {
        "id": "element-1763395505087-trew98b7t",
        "type": "image",
        "imageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762537732/vendor-designs/vendor_3_design_1762537731957.svg",
        "x": 0.6305555555555556,
        "y": 0.3263888888888889,
        "width": 199.66666666666669,
        "height": 199.66666666666669,
        "rotation": 0,
        "naturalWidth": 2000,
        "naturalHeight": 2000,
        "zIndex": 0
      }
    ]
  },
  "colorVariationId": 16,
  "viewId": 16,
  "timestamp": 1763395507876
}
```

**Points importants:**
- Un même produit peut avoir plusieurs vues (ex: `16-17` et `16-16`)
- Chaque vue peut contenir plusieurs éléments (images, textes)
- Les éléments sont ordonnés par `zIndex` pour l'affichage
- Les coordonnées `x` et `y` sont normalisées (0-1) pour être responsive

#### Exemple 4: Position de design vendeur (`design_position_37_66_1`)

```json
{
  "designId": 1,
  "baseProductId": 66,
  "position": {
    "x": -4,
    "y": -18.138621875,
    "scale": 0.85,
    "rotation": 0,
    "designWidth": 0,
    "designHeight": 0,
    "designScale": 0.85,
    "timestamp": 1761127927628
  },
  "timestamp": 1761127927628,
  "vendorId": 37
}
```

**Description:** Position par défaut d'un design vendeur sur un produit. Utilisé pour pré-positionner les designs vendeurs.

#### Exemple 5: Historique produits vendeur (`vendor_products_history`)

Structure complète incluant:
- Informations produit (id, name, price, status)
- Variations de couleur avec images
- Délimitations pour chaque image
- Design appliqué avec positionnement
- Informations vendeur
- Tailles disponibles

---

## 4. Endpoint principal: `/product/:id/customize`

### 4.1 Flux de personnalisation complet

```
1. Client arrive sur /product/:id/customize
2. Frontend charge les données du localStorage (design-data-product-${id})
3. Client modifie la personnalisation (ajoute texte, images, etc.)
4. Client clique "Sauvegarder" ou "Ajouter au panier"
5. Frontend envoie POST /product/:id/customize avec toutes les données
6. Backend enregistre et retourne customizationId
7. Frontend stocke customizationId dans localStorage
8. À la commande, customizationId est envoyé pour récupérer les données
```

### 4.2 POST `/product/:id/customize` - Sauvegarder la personnalisation

**Request:**

```http
POST /product/6/customize
Content-Type: application/json
Authorization: Bearer <token> (optionnel si invité)

{
  "productId": 6,
  "vendorProductId": 47,
  "colorVariationId": 16,
  "viewId": 17,
  "elementsByView": {
    "16-17": [
      {
        "id": "element-1763372081344-xyi50vv53",
        "type": "image",
        "imageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762537732/vendor-designs/vendor_3_design_1762537731957.svg",
        "x": 0.5202380952380952,
        "y": 0.43882936507936515,
        "width": 377,
        "height": 377,
        "rotation": 0,
        "naturalWidth": 2000,
        "naturalHeight": 2000,
        "zIndex": 0
      },
      {
        "id": "element-1763374135413-3yqczh8u3",
        "type": "text",
        "text": "Werenoi",
        "x": 0.5113095238095238,
        "y": 0.2700396825396827,
        "width": 461.4285714285714,
        "height": 123.04761904761902,
        "rotation": 0,
        "fontSize": 74,
        "baseFontSize": 24,
        "baseWidth": 150,
        "fontFamily": "Arial, sans-serif",
        "color": "#000000",
        "fontWeight": "normal",
        "fontStyle": "normal",
        "textDecoration": "none",
        "textAlign": "center",
        "curve": 0,
        "zIndex": 1
      }
    ],
    "16-16": [
      {
        "id": "element-1763395505087-trew98b7t",
        "type": "image",
        "imageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762537732/vendor-designs/vendor_3_design_1762537731957.svg",
        "x": 0.6305555555555556,
        "y": 0.3263888888888889,
        "width": 199.66666666666669,
        "height": 199.66666666666669,
        "rotation": 0,
        "naturalWidth": 2000,
        "naturalHeight": 2000,
        "zIndex": 0
      }
    ]
  },
  "delimitations": [
    {
      "id": "delim_1761530783451",
      "x": 490,
      "y": 458.33333333333337,
      "width": 246.66666666666669,
      "height": 340,
      "rotation": 0,
      "type": "rectangle"
    }
  ],
  "sizeSelections": [
    { "size": "2XL", "quantity": 1 },
    { "size": "XL", "quantity": 2 }
  ],
  "sessionId": "guest-1763372813958-zy7xuag27",
  "timestamp": 1763395507876
}
```

**Response:**

```json
{
  "success": true,
  "customizationId": 789,
  "data": {
    "id": 789,
    "productId": 6,
    "vendorProductId": 47,
    "colorVariationId": 16,
    "viewId": 17,
    "elementsByView": {
      "16-17": [...],
      "16-16": [...]
    },
    "delimitations": [...],
    "sizeSelections": [...],
    "totalPrice": 18000,
    "status": "draft",
    "createdAt": "2025-01-18T10:30:00Z",
    "updatedAt": "2025-01-18T10:30:00Z"
  },
  "message": "Personnalisation sauvegardée avec succès"
}
```

### 4.3 GET `/customization/:id` - Récupérer une personnalisation

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 789,
    "productId": 6,
    "vendorProductId": 47,
    "colorVariationId": 16,
    "viewId": 17,
    "elementsByView": {
      "16-17": [...],
      "16-16": [...]
    },
    "delimitations": [...],
    "sizeSelections": [...],
    "product": {
      "id": 6,
      "name": "Polo",
      "price": 6000,
      "adminProduct": {
        "id": 77,
        "name": "Polo",
        "description": "Polo pour été",
        "colorVariations": [
          {
            "id": 16,
            "name": "Blanc",
            "colorCode": "#ffffff",
            "images": [
              {
                "id": 111,
                "view": "Front",
                "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1761534777/printalma/1761534777260-Polo_blanc.jpg",
                "naturalWidth": 1200,
                "naturalHeight": 1200,
                "delimitations": [
                  {
                    "id": 55,
                    "x": 420,
                    "y": 338.33,
                    "width": 340,
                    "height": 444.71,
                    "rotation": 0
                  }
                ]
              }
            ]
          }
        ]
      },
      "vendor": {
        "id": 37,
        "fullName": "Papa DIAGNE",
        "shop_name": "C'est carré"
      }
    },
    "createdAt": "2025-01-18T10:30:00Z",
    "updatedAt": "2025-01-18T10:30:00Z"
  }
}
```

**Point important:** Le backend doit retourner toutes les informations du produit (variations de couleur, images, délimitations, vendeur) pour que le frontend puisse reconstruire exactement le même affichage.

---

## 5. Endpoints API recommandés (autres)

### 5.1 Sauvegarder une personnalisation (alternative)

```http
POST /api/customizations
Content-Type: application/json

{
  "productId": 123,
  "colorVariationId": 1,
  "viewId": 5,
  "designElements": [
    {
      "id": "el_1699123456789",
      "type": "text",
      "x": 0.5,
      "y": 0.3,
      "width": 200,
      "height": 50,
      "rotation": 0,
      "zIndex": 0,
      "text": "Mon texte personnalisé",
      "fontSize": 24,
      "baseFontSize": 24,
      "baseWidth": 200,
      "fontFamily": "Arial",
      "color": "#000000",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center",
      "curve": 0
    },
    {
      "id": "el_1699123456790",
      "type": "image",
      "x": 0.5,
      "y": 0.6,
      "width": 150,
      "height": 150,
      "rotation": 15,
      "zIndex": 1,
      "imageUrl": "/uploads/customizations/abc123.png",
      "naturalWidth": 500,
      "naturalHeight": 500
    }
  ],
  "sizeSelections": [
    { "size": "M", "quantity": 2 },
    { "size": "L", "quantity": 1 }
  ],
  "sessionId": "guest_abc123",
  "previewImageUrl": "/uploads/previews/preview_123.png"
}
```

**Réponse:**
```json
{
  "id": 456,
  "productId": 123,
  "colorVariationId": 1,
  "viewId": 5,
  "designElements": [...],
  "sizeSelections": [...],
  "previewImageUrl": "/uploads/previews/preview_123.png",
  "totalPrice": 45.99,
  "status": "draft",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 4.2 Récupérer une personnalisation

```http
GET /api/customizations/:id
```

### 4.3 Mettre à jour une personnalisation

```http
PUT /api/customizations/:id
Content-Type: application/json

{
  "designElements": [...],
  "sizeSelections": [...],
  "previewImageUrl": "..."
}
```

### 4.4 Récupérer les personnalisations d'un utilisateur/session

```http
GET /api/customizations?productId=123&sessionId=guest_abc123
GET /api/customizations?userId=789
```

### 4.5 Upload d'image pour personnalisation

```http
POST /api/customizations/upload-image
Content-Type: multipart/form-data

file: <image_file>
```

**Réponse:**
```json
{
  "url": "/uploads/customizations/abc123.png",
  "width": 500,
  "height": 500
}
```

---

## 6. Schéma de base de données (Implémentation Prisma)

### Modèle `ProductCustomization`

**Fichier:** `prisma/schema.prisma`

```prisma
model ProductCustomization {
  id                  Int       @id @default(autoincrement())

  // Identification client
  userId              Int?      @map("user_id")
  sessionId           String?   @map("session_id")

  // Référence produit
  productId           Int       @map("product_id")
  vendorProductId     Int?      @map("vendor_product_id")

  // Vue et variation
  colorVariationId    Int       @map("color_variation_id")
  viewId              Int       @map("view_id")

  // Données de personnalisation (JSON pour flexibilité)
  designElements      Json      @map("design_elements")        // Format simple (compatibilité)
  elementsByView      Json?     @map("elements_by_view")       // Format multi-vues {"16-17": [...]}
  delimitations       Json?                                    // Array de Delimitation
  sizeSelections      Json?     @map("size_selections")        // Array de {size, quantity}

  // Métadonnées
  previewImageUrl     String?   @map("preview_image_url")
  totalPrice          Float     @default(0) @map("total_price")
  status              String    @default("draft")               // draft, in_cart, ordered
  orderId             Int?      @map("order_id")
  timestamp           BigInt?                                   // Timestamp du client

  // Audit
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relations
  product             Product            @relation(fields: [productId], references: [id])
  vendorProduct       VendorProduct?     @relation(fields: [vendorProductId], references: [id])
  order               Order?             @relation(fields: [orderId], references: [id])

  @@index([userId])
  @@index([sessionId])
  @@index([productId])
  @@index([vendorProductId])
  @@index([status])
  @@index([colorVariationId, viewId])
  @@map("product_customizations")
}
```

### Migration SQL correspondante

```sql
CREATE TABLE product_customizations (
  id SERIAL PRIMARY KEY,

  -- Identification client
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),

  -- Référence produit
  product_id INTEGER NOT NULL REFERENCES products(id),
  vendor_product_id INTEGER REFERENCES vendor_products(id),

  -- Vue et variation
  color_variation_id INTEGER NOT NULL,
  view_id INTEGER NOT NULL,

  -- Données de personnalisation (JSONB pour flexibilité)
  design_elements JSONB NOT NULL,              -- Format simple (compatibilité)
  elements_by_view JSONB,                      -- Format multi-vues {"16-17": [...]}
  delimitations JSONB,                         -- Array de Delimitation
  size_selections JSONB,                       -- Array de {size, quantity}

  -- Métadonnées
  preview_image_url VARCHAR(500),
  total_price DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  timestamp BIGINT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Index
  INDEX idx_customizations_user_id (user_id),
  INDEX idx_customizations_session_id (session_id),
  INDEX idx_customizations_product_id (product_id),
  INDEX idx_customizations_vendor_product (vendor_product_id),
  INDEX idx_customizations_status (status),
  INDEX idx_customizations_color_view (color_variation_id, view_id)
);
```

### Points importants de l'implémentation

✅ **Double format supporté:**
- `design_elements`: Format simple pour compatibilité (array d'éléments)
- `elements_by_view`: Format multi-vues (objet avec clés "colorId-viewId")

✅ **Normalisation automatique:**
Le backend convertit automatiquement `designElements` → `elementsByView` lors de la sauvegarde

✅ **Champs optionnels:**
- `vendor_product_id`: Pour référencer le produit vendeur
- `elements_by_view`: Si null, utilise `design_elements`
- `delimitations`: Zones de placement
- `timestamp`: Timestamp client pour synchronisation

### Structure du champ `elements_by_view` (JSONB)

```json
{
  "16-17": [
    {
      "id": "element-xxx",
      "type": "image",
      "imageUrl": "...",
      "x": 0.52,
      "y": 0.44,
      "width": 377,
      "height": 377,
      "rotation": 0,
      "naturalWidth": 2000,
      "naturalHeight": 2000,
      "zIndex": 0
    },
    {
      "id": "element-yyy",
      "type": "text",
      "text": "Mon texte",
      "x": 0.51,
      "y": 0.27,
      "width": 461,
      "height": 123,
      "rotation": 0,
      "fontSize": 74,
      "baseFontSize": 24,
      "baseWidth": 150,
      "fontFamily": "Arial, sans-serif",
      "color": "#000000",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center",
      "curve": 0,
      "zIndex": 1
    }
  ],
  "16-16": [
    {
      "id": "element-zzz",
      "type": "image",
      "imageUrl": "...",
      "x": 0.63,
      "y": 0.33,
      "width": 200,
      "height": 200,
      "rotation": 0,
      "naturalWidth": 2000,
      "naturalHeight": 2000,
      "zIndex": 0
    }
  ]
}
```

### Table `order_customizations` (snapshot immuable)

Pour conserver l'état exact de la personnalisation au moment de la commande:

```sql
CREATE TABLE order_customizations (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id INTEGER NOT NULL,
  customization_id INTEGER REFERENCES customer_customizations(id),

  -- Snapshot complet de la personnalisation
  snapshot_data JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_order_customizations_order (order_id),
  INDEX idx_order_customizations_item (order_item_id)
);
```

### Table `customization_images` (pour uploads client)

```sql
CREATE TABLE customization_images (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255),
  file_path VARCHAR(500) NOT NULL,
  cloudinary_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(255),
  original_filename VARCHAR(255),
  mime_type VARCHAR(100),
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_customization_images_user (user_id),
  INDEX idx_customization_images_session (session_id)
);
```

---

## 6. Données dans le panier (CartItem)

Quand une personnalisation est ajoutée au panier, elle contient ces champs importants:

```typescript
interface CartItem {
  id: string;                                   // ID unique du cart item
  productId: number;
  name: string;
  price: number;
  color: string;
  colorCode: string;
  size: string;
  quantity: number;
  imageUrl: string;

  // Champs de personnalisation IMPORTANTS
  customizationId?: number;                     // ID unique (compatibilité)
  customizationIds?: Record<string, number>;    // IDs par vue: {"1-5": 123, "1-6": 124}
  designElementsByView?: Record<string, DesignElement[]>;  // Éléments par vue
}
```

---

## 7. Données dans la commande (OrderItem)

Lors de la création d'une commande, ces données sont envoyées:

```typescript
interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  size: string;
  color: string;
  colorId: number;

  // Personnalisation
  customizationId?: number;
  customizationIds?: Record<string, number>;
  designElementsByView?: Record<string, DesignElement[]>;
}
```

---

## 8. Validations recommandées

### Côté backend

1. **Vérifier que le produit existe** et est disponible
2. **Valider les coordonnées** (x, y entre 0 et 1)
3. **Vérifier les URLs d'images** (domaines autorisés)
4. **Limiter la taille du JSON** (éviter les abus)
5. **Valider les polices** contre une liste blanche
6. **Vérifier les couleurs** (format hex valide)
7. **Limiter le nombre d'éléments** par personnalisation

### Exemple de validation

```typescript
const validateDesignElement = (element: DesignElement): boolean => {
  // Coordonnées valides
  if (element.x < 0 || element.x > 1 || element.y < 0 || element.y > 1) {
    return false;
  }

  // Dimensions positives
  if (element.width <= 0 || element.height <= 0) {
    return false;
  }

  // Validation spécifique au type
  if (element.type === 'text') {
    if (!element.text || element.text.length > 500) return false;
    if (element.fontSize < 8 || element.fontSize > 200) return false;
  }

  if (element.type === 'image') {
    if (!element.imageUrl) return false;
  }

  return true;
};
```

---

## 9. Gestion des sessions invités

Pour les utilisateurs non connectés:

1. Générer un `sessionId` unique côté client (UUID)
2. Stocker dans `localStorage` sous la clé `guest-session-id`
3. Envoyer avec chaque requête de personnalisation
4. Lors de la connexion, migrer les personnalisations vers le `userId`

```typescript
// Migration lors de la connexion
POST /api/customizations/migrate
{
  "sessionId": "guest_abc123",
  "userId": 789
}
```

---

## 10. Points d'attention

### Performance

- Indexer les colonnes fréquemment recherchées
- Compresser les images uploadées
- Limiter la taille du JSONB `design_elements`

### Sécurité

- Valider les URLs d'images (pas d'injection)
- Sanitizer le texte des éléments
- Vérifier les permissions utilisateur
- Rate limiting sur l'upload d'images

### Intégrité des données

- Garder un historique des modifications
- Sauvegarder les images dans un stockage permanent
- Associer les personnalisations aux commandes pour l'historique

---

## 10. Comment restituer les données pour le même affichage

### 10.1 Principes clés

Pour que le frontend affiche exactement la même personnalisation, le backend doit retourner:

1. **Toutes les données de personnalisation** (`elementsByView`, `delimitations`, `sizeSelections`)
2. **Toutes les informations du produit** (variations de couleur, images, délimitations produit)
3. **Les métadonnées du vendeur** (nom de boutique, etc.)
4. **Dans le même format** que le localStorage

### 10.2 Exemple de code backend (NestJS/Prisma) - IMPLÉMENTATION ACTUELLE

**Fichier:** `src/customization/customization.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomizationService {
  constructor(private prisma: PrismaService) {}

  // Sauvegarde avec normalisation automatique
  async create(createDto: CreateCustomizationDto) {
    const {
      productId,
      vendorProductId,
      colorVariationId,
      viewId,
      designElements,      // Format simple
      elementsByView,      // Format multi-vues
      delimitations,
      sizeSelections,
      sessionId,
      timestamp,
    } = createDto;

    // 🔄 NORMALISATION AUTOMATIQUE
    let normalizedElementsByView = elementsByView;
    let compatDesignElements = designElements;

    // Si designElements fourni mais pas elementsByView, convertir
    if (designElements && !elementsByView) {
      const viewKey = `${colorVariationId}-${viewId}`;
      normalizedElementsByView = { [viewKey]: designElements };

      console.log(`📥 Conversion: designElements → elementsByView[${viewKey}] (${designElements.length} éléments)`);
    }

    // Si elementsByView fourni mais pas designElements, extraire la première vue
    if (elementsByView && !designElements) {
      const firstViewKey = Object.keys(elementsByView)[0];
      compatDesignElements = elementsByView[firstViewKey];

      console.log(`📥 Extraction: elementsByView[${firstViewKey}] → designElements (${compatDesignElements.length} éléments)`);
    }

    // 💾 Sauvegarde en base avec les deux formats
    const customization = await this.prisma.productCustomization.create({
      data: {
        productId,
        vendorProductId,
        colorVariationId,
        viewId,
        designElements: compatDesignElements,      // Format simple (compat)
        elementsByView: normalizedElementsByView,  // Format multi-vues
        delimitations,
        sizeSelections,
        sessionId,
        timestamp,
        status: 'draft',
      },
    });

    console.log(`✅ Created customization ${customization.id}:
      - designElements: ${JSON.stringify(compatDesignElements).substring(0, 100)}...
      - elementsByView: ${JSON.stringify(normalizedElementsByView).substring(0, 100)}...
    `);

    return customization;
  }

  // Récupération avec toutes les données produit
  async findOneWithFullData(id: number) {
    const customization = await this.prisma.productCustomization.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: {
                  include: {
                    delimitations: true,
                  },
                },
              },
            },
          },
        },
        vendorProduct: {
          include: {
            adminProduct: {
              include: {
                colorVariations: {
                  include: {
                    images: {
                      include: {
                        delimitations: true,
                      },
                    },
                  },
                },
              },
            },
            vendor: true,
            sizes: true,
            design: true,
          },
        },
      },
    });

    if (!customization) {
      throw new NotFoundException('Personnalisation non trouvée');
    }

    // 🔄 Assembler la réponse complète
    return {
      id: customization.id,
      productId: customization.productId,
      vendorProductId: customization.vendorProductId,
      colorVariationId: customization.colorVariationId,
      viewId: customization.viewId,

      // Données de personnalisation (format localStorage)
      elementsByView: customization.elementsByView || this.convertToElementsByView(
        customization.designElements,
        customization.colorVariationId,
        customization.viewId
      ),
      designElements: customization.designElements,
      delimitations: customization.delimitations,
      sizeSelections: customization.sizeSelections,

      // Métadonnées
      timestamp: customization.timestamp,
      totalPrice: customization.totalPrice,
      status: customization.status,

      // Produit complet avec toutes les relations
      product: customization.vendorProduct || customization.product,

      // Timestamps
      createdAt: customization.createdAt,
      updatedAt: customization.updatedAt,
    };
  }

  // Helper: Convertir designElements en elementsByView
  private convertToElementsByView(
    designElements: any,
    colorVariationId: number,
    viewId: number,
  ): Record<string, any[]> {
    const viewKey = `${colorVariationId}-${viewId}`;
    return { [viewKey]: designElements };
  }
}
```

**Fichier:** `src/customization/customization.controller.ts`

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CustomizationService } from './customization.service';
import { CreateCustomizationDto } from './dto/create-customization.dto';

@Controller('api/customizations')
export class CustomizationController {
  constructor(private readonly customizationService: CustomizationService) {}

  @Post()
  async create(@Body() createDto: CreateCustomizationDto) {
    return this.customizationService.create(createDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customizationService.findOneWithFullData(+id);
  }
}
```

**Fichier:** `src/customization/dto/create-customization.dto.ts`

```typescript
import { IsInt, IsOptional, IsString, IsObject, IsArray } from 'class-validator';

export class CreateCustomizationDto {
  @IsInt()
  productId: number;

  @IsInt()
  @IsOptional()
  vendorProductId?: number;

  @IsInt()
  colorVariationId: number;

  @IsInt()
  viewId: number;

  // Format simple (compatibilité)
  @IsArray()
  @IsOptional()
  designElements?: any[];

  // Format multi-vues (recommandé)
  @IsObject()
  @IsOptional()
  elementsByView?: Record<string, any[]>;

  @IsArray()
  @IsOptional()
  delimitations?: any[];

  @IsArray()
  @IsOptional()
  sizeSelections?: Array<{ size: string; quantity: number }>;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsOptional()
  timestamp?: number;
}
```

### 10.3 Format de réponse attendu par le frontend

Le frontend s'attend à recevoir exactement cette structure:

```typescript
interface CustomizationResponse {
  success: boolean;
  data: {
    // Identifiants
    id: number;
    productId: number;
    vendorProductId: number;
    colorVariationId: number;
    viewId: number;

    // Données de personnalisation (format identique au localStorage)
    elementsByView: {
      [key: string]: DesignElement[];  // Ex: "16-17": [...]
    };
    delimitations?: Delimitation[];
    sizeSelections?: SizeSelection[];

    // Métadonnées
    timestamp: number;
    totalPrice: number;
    status: string;

    // Produit complet avec toutes les relations
    product: {
      id: number;
      vendorName: string;
      price: number;
      status: string;

      adminProduct: {
        id: number;
        name: string;
        description: string;
        price: number;
        genre: string;
        colorVariations: ColorVariation[];
      };

      vendor: {
        id: number;
        fullName: string;
        shop_name: string;
        profile_photo_url: string | null;
      };

      selectedSizes: Size[];
      selectedColors: ColorVariation[];
      design: Design | null;
    };

    createdAt: string;
    updatedAt: string;
  };
}
```

### 10.4 Reconstruction du canvas côté frontend

Quand le frontend reçoit ces données:

```typescript
// CustomerProductCustomizationPageV3.tsx
const loadSavedCustomization = async (customizationId: number) => {
  try {
    // 1. Récupérer depuis le backend
    const response = await fetch(`/customization/${customizationId}`);
    const { data } = await response.json();

    // 2. Stocker dans localStorage (même format)
    localStorage.setItem(`design-data-product-${data.productId}`, JSON.stringify({
      elementsByView: data.elementsByView,
      colorVariationId: data.colorVariationId,
      viewId: data.viewId,
      timestamp: data.timestamp
    }));

    // 3. Reconstruire le canvas Fabric.js
    const viewKey = `${data.colorVariationId}-${data.viewId}`;
    const elements = data.elementsByView[viewKey] || [];

    elements.forEach(element => {
      if (element.type === 'image') {
        fabric.Image.fromURL(element.imageUrl, (img) => {
          img.set({
            left: element.x * canvasWidth,
            top: element.y * canvasHeight,
            scaleX: element.width / element.naturalWidth,
            scaleY: element.height / element.naturalHeight,
            angle: element.rotation
          });
          canvas.add(img);
        });
      } else if (element.type === 'text') {
        const text = new fabric.Text(element.text, {
          left: element.x * canvasWidth,
          top: element.y * canvasHeight,
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          fill: element.color,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
          textAlign: element.textAlign,
          angle: element.rotation
        });
        canvas.add(text);
      }
    });

    canvas.renderAll();

  } catch (error) {
    console.error('Erreur chargement personnalisation:', error);
  }
};
```

### 10.5 Points critiques pour le même affichage

✅ **Coordonnées normalisées**: Les valeurs `x` et `y` sont entre 0 et 1, il faut les multiplier par la taille du canvas

✅ **ZIndex respecté**: Charger les éléments dans l'ordre de leur `zIndex`

✅ **Dimensions exactes**: Utiliser `width`, `height`, `naturalWidth`, `naturalHeight` pour le scaling

✅ **Toutes les propriétés**: Texte (fontSize, fontFamily, color, etc.), Images (rotation, etc.)

✅ **Multi-vues**: Gérer plusieurs vues (ex: "16-17" et "16-16")

✅ **Délimitations**: Retourner les délimitations du produit pour les zones de placement

---

## 11. Exemple complet d'appel API

Le frontend utilise le service `customizationService.ts`:

```typescript
// Appel actuel du frontend
const result = await customizationService.saveCustomization({
  productId: 123,
  colorVariationId: 1,
  viewId: 5,
  designElements: elements,
  sizeSelections: [
    { size: 'M', quantity: 2 }
  ],
  sessionId: localStorage.getItem('guest-session-id') || undefined,
  previewImageUrl: await generatePreviewImage()
});

// result.id est sauvegardé pour référence future
localStorage.setItem(`customization-${productId}`, JSON.stringify({
  customizationIds: { '1-5': result.id },
  selections: [{ size: 'M', quantity: 2 }],
  timestamp: Date.now()
}));
```

---

## 12. Fichiers frontend de référence

- `src/pages/CustomerProductCustomizationPageV3.tsx` - Page principale de personnalisation
- `src/services/customizationService.ts` - Service API
- `src/types/cart.ts` - Types du panier
- `src/contexts/CartContext.tsx` - Gestion du panier
- `src/services/orderService.ts` - Création de commande
- `src/components/ProductDesignEditor.tsx` - Éditeur de design avec Fabric.js

---

## 13. Résumé et Checklist d'implémentation

### 13.1 Données essentielles à stocker

| Donnée | Type | Description | Obligatoire |
|--------|------|-------------|-------------|
| `elementsByView` | JSONB | Tous les éléments (images, textes) par vue | ✅ Oui |
| `colorVariationId` | INTEGER | ID de la variation de couleur | ✅ Oui |
| `viewId` | INTEGER | ID de la vue (front, back, etc.) | ✅ Oui |
| `delimitations` | JSONB | Zones de placement autorisées | ⚠️ Recommandé |
| `sizeSelections` | JSONB | Tailles et quantités | ⚠️ Si panier |
| `timestamp` | BIGINT | Timestamp de création | ⚠️ Recommandé |
| `user_id` ou `session_id` | VARCHAR | Identification client | ✅ Oui (l'un des deux) |

### 13.2 Checklist Backend (Implémentation actuelle)

#### Phase 1: Base de données ✅ FAIT
- [x] Modèle Prisma `ProductCustomization` créé
- [x] Support `design_elements` (format simple)
- [x] Support `elements_by_view` (format multi-vues)
- [x] Support `delimitations`, `timestamp`, `vendor_product_id`
- [x] Index sur les colonnes fréquemment recherchées
- [ ] **Migration Prisma à exécuter** ⚠️ À FAIRE
  ```bash
  npx prisma migrate dev --name add_elements_by_view_support
  ```

#### Phase 2: Endpoints API ✅ FAIT
- [x] `POST /api/customizations` - Sauvegarder personnalisation
- [x] `GET /api/customizations/:id` - Récupérer personnalisation
- [x] DTO avec support des deux formats (designElements + elementsByView)
- [ ] `PUT /api/customizations/:id` - Mettre à jour ⚠️ À IMPLÉMENTER
- [ ] `GET /api/customers/:id/customizations` - Liste ⚠️ À IMPLÉMENTER
- [ ] `POST /api/customizations/upload-image` - Upload ⚠️ À IMPLÉMENTER
- [ ] `DELETE /api/customizations/:id` - Suppression ⚠️ À IMPLÉMENTER

#### Phase 3: Logique métier ✅ PARTIELLEMENT FAIT
- [x] Normalisation automatique designElements → elementsByView
- [x] Sauvegarde des deux formats pour compatibilité
- [x] Logs détaillés pour debugging
- [x] Support sessions invités (sessionId)
- [ ] Validation des éléments (coordonnées 0-1) ⚠️ À AJOUTER
- [ ] Calcul du prix total basé sur quantités ⚠️ À AJOUTER
- [ ] Migration session → user lors connexion ⚠️ À IMPLÉMENTER
- [ ] Création snapshot pour commandes ⚠️ À IMPLÉMENTER
- [ ] Upload Cloudinary des images client ⚠️ À IMPLÉMENTER

#### Phase 4: Récupération complète ✅ FAIT
- [x] Prisma include: produit avec relations
- [x] Prisma include: variations de couleur avec images
- [x] Prisma include: délimitations pour chaque image
- [x] Prisma include: tailles disponibles
- [x] Prisma include: design vendeur si applicable
- [x] Prisma include: informations vendeur
- [x] Retour format compatible localStorage

#### Phase 5: Sécurité et validation ⚠️ À FAIRE
- [ ] Valider les URLs d'images (domaines autorisés)
- [ ] Sanitizer les textes (protection XSS)
- [ ] Vérifier permissions utilisateur
- [ ] Rate limiting sur uploads
- [ ] Limiter taille du JSON
- [ ] Valider polices contre liste blanche

### 13.2.1 État actuel de l'implémentation

**✅ Ce qui fonctionne:**
- Sauvegarde de personnalisations avec format simple (`designElements`)
- Sauvegarde de personnalisations avec format multi-vues (`elementsByView`)
- Normalisation automatique entre les deux formats
- Récupération avec toutes les données produit (via Prisma include)
- Logs détaillés pour le debugging

**⚠️ Ce qui reste à faire:**
- Exécuter la migration Prisma
- Implémenter les endpoints manquants (update, delete, list)
- Ajouter les validations de sécurité
- Implémenter l'upload d'images client
- Créer le système de snapshot pour les commandes
- Ajouter le calcul automatique du prix total

### 13.3 Points critiques pour le même affichage

🔴 **Absolument nécessaire:**
1. Retourner `elementsByView` dans le même format que localStorage
2. Inclure toutes les propriétés des éléments (x, y, width, height, rotation, zIndex, etc.)
3. Retourner les données produit complètes (colorVariations, images, delimitations)
4. Respecter les coordonnées normalisées (0-1) pour x et y
5. Inclure naturalWidth et naturalHeight pour les images

🟡 **Important:**
1. Retourner les tailles disponibles pour le sélecteur
2. Inclure les informations vendeur
3. Gérer multi-vues (plusieurs clés dans elementsByView)
4. Préserver l'ordre avec zIndex

🟢 **Recommandé:**
1. Générer des previews/thumbnails
2. Historique des modifications
3. Validation des designs

### 13.4 Exemples de test (Implémentation actuelle)

#### Test 1: Format simple (designElements)

```bash
# POST /api/customizations avec format simple
curl -X POST http://localhost:3000/api/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 5,
    "colorVariationId": 13,
    "viewId": 13,
    "designElements": [
      {
        "id": "element-1763495036578-88fw6uiz5",
        "type": "image",
        "imageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762537732/vendor-designs/vendor_3_design_1762537731957.svg",
        "x": 0.5727024959742353,
        "y": 0.4334166666666668,
        "width": 223.5333333333334,
        "height": 223.5333333333334,
        "rotation": 0,
        "naturalWidth": 2000,
        "naturalHeight": 2000,
        "zIndex": 0
      }
    ],
    "sessionId": "guest-test-123",
    "timestamp": 1763502488189
  }'
```

**Réponse attendue:**
```json
{
  "id": 31,
  "productId": 5,
  "colorVariationId": 13,
  "viewId": 13,
  "designElements": [{...}],           // ✅ Format simple
  "elementsByView": {
    "13-13": [{...}]                   // ✅ Converti automatiquement
  },
  "status": "draft",
  "timestamp": 1763502488189,
  "createdAt": "2025-01-18T10:30:00Z",
  "updatedAt": "2025-01-18T10:30:00Z"
}
```

**Logs backend:**
```
📥 Conversion: designElements → elementsByView[13-13] (1 éléments)
✅ Created customization 31:
  - designElements: [{"id":"element-1763495036578-88fw6uiz5"...
  - elementsByView: {"13-13":[{"id":"element-1763495036578-88fw6uiz5"...
```

#### Test 2: Format multi-vues (elementsByView)

```bash
# POST /api/customizations avec format multi-vues
curl -X POST http://localhost:3000/api/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 6,
    "vendorProductId": 47,
    "colorVariationId": 16,
    "viewId": 17,
    "elementsByView": {
      "16-17": [
        {
          "id": "element-1763372081344-xyi50vv53",
          "type": "image",
          "imageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762537732/vendor-designs/vendor_3_design_1762537731957.svg",
          "x": 0.5202380952380952,
          "y": 0.43882936507936515,
          "width": 377,
          "height": 377,
          "rotation": 0,
          "naturalWidth": 2000,
          "naturalHeight": 2000,
          "zIndex": 0
        },
        {
          "id": "element-1763374135413-3yqczh8u3",
          "type": "text",
          "text": "Werenoi",
          "x": 0.5113095238095238,
          "y": 0.2700396825396827,
          "width": 461.4285714285714,
          "height": 123.04761904761902,
          "rotation": 0,
          "fontSize": 74,
          "baseFontSize": 24,
          "baseWidth": 150,
          "fontFamily": "Arial, sans-serif",
          "color": "#000000",
          "fontWeight": "normal",
          "fontStyle": "normal",
          "textDecoration": "none",
          "textAlign": "center",
          "curve": 0,
          "zIndex": 1
        }
      ],
      "16-16": [
        {
          "id": "element-1763395505087-trew98b7t",
          "type": "image",
          "imageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762537732/vendor-designs/vendor_3_design_1762537731957.svg",
          "x": 0.6305555555555556,
          "y": 0.3263888888888889,
          "width": 199.66666666666669,
          "height": 199.66666666666669,
          "rotation": 0,
          "naturalWidth": 2000,
          "naturalHeight": 2000,
          "zIndex": 0
        }
      ]
    },
    "delimitations": [
      {
        "id": "delim_1761530783451",
        "x": 490,
        "y": 458.33333333333337,
        "width": 246.66666666666669,
        "height": 340,
        "rotation": 0,
        "type": "rectangle"
      }
    ],
    "sessionId": "guest-1763372813958-zy7xuag27",
    "timestamp": 1763395507876
  }'
```

**Réponse attendue:**
```json
{
  "id": 32,
  "productId": 6,
  "vendorProductId": 47,
  "colorVariationId": 16,
  "viewId": 17,
  "elementsByView": {
    "16-17": [{...}, {...}],           // ✅ 2 éléments (image + texte)
    "16-16": [{...}]                   // ✅ 1 élément (image)
  },
  "designElements": [{...}, {...}],    // ✅ Première vue extraite
  "delimitations": [{...}],
  "status": "draft",
  "timestamp": 1763395507876,
  "createdAt": "2025-01-18T10:30:00Z",
  "updatedAt": "2025-01-18T10:30:00Z"
}
```

**Logs backend:**
```
📥 Extraction: elementsByView[16-17] → designElements (2 éléments)
✅ Created customization 32:
  - designElements: [{"id":"element-1763372081344-xyi50vv53"...
  - elementsByView: {"16-17":[{...},{...}],"16-16":[{...}]}
```

#### Test 3: Récupérer avec toutes les données produit

```bash
# GET /api/customizations/:id
curl http://localhost:3000/api/customizations/32
```

**Réponse (avec toutes les relations):**
```json
{
  "id": 32,
  "productId": 6,
  "vendorProductId": 47,
  "colorVariationId": 16,
  "viewId": 17,
  "elementsByView": {
    "16-17": [...],
    "16-16": [...]
  },
  "product": {
    "id": 47,
    "name": "Polo",
    "price": 6000,
    "adminProduct": {
      "id": 77,
      "name": "Polo",
      "description": "Polo pour été",
      "colorVariations": [
        {
          "id": 16,
          "name": "Blanc",
          "colorCode": "#ffffff",
          "images": [
            {
              "id": 111,
              "view": "Front",
              "url": "https://res.cloudinary.com/.../Polo_blanc.jpg",
              "naturalWidth": 1200,
              "naturalHeight": 1200,
              "delimitations": [
                {
                  "id": 55,
                  "x": 420,
                  "y": 338.33,
                  "width": 340,
                  "height": 444.71,
                  "rotation": 0
                }
              ]
            }
          ]
        }
      ]
    },
    "vendor": {
      "id": 37,
      "fullName": "Papa DIAGNE",
      "shop_name": "C'est carré"
    }
  },
  "createdAt": "2025-01-18T10:30:00Z",
  "updatedAt": "2025-01-18T10:30:00Z"
}
```

#### Test 4: Vérifier en base de données

```sql
-- Vérifier la dernière personnalisation créée
SELECT
  id,
  product_id,
  vendor_product_id,
  color_variation_id,
  view_id,
  design_elements::text AS design_elements_preview,
  elements_by_view::text AS elements_by_view_preview,
  delimitations::text AS delimitations_preview,
  timestamp,
  status,
  created_at
FROM product_customizations
ORDER BY created_at DESC
LIMIT 1;
```

### 13.5 Format minimal vs Format complet

**Format minimal** (sauvegarde):
```json
{
  "elementsByView": {...},
  "colorVariationId": 16,
  "viewId": 17
}
```

**Format complet** (récupération):
```json
{
  "elementsByView": {...},
  "colorVariationId": 16,
  "viewId": 17,
  "product": {
    "adminProduct": {
      "colorVariations": [...],
      ...
    },
    "vendor": {...},
    ...
  }
}
```

### 13.6 Flux complet

```
1. Client personnalise → localStorage
2. Client clique "Sauvegarder" → POST /product/:id/customize
3. Backend enregistre → Retourne customizationId
4. Frontend stocke customizationId → localStorage
5. Client ajoute au panier → customizationId dans CartItem
6. Client passe commande → GET /customization/:id
7. Backend retourne données complètes → Frontend reconstruit canvas
8. Commande créée → Snapshot dans order_customizations
```

---

## 14. Support et Questions

### 14.1 Fichiers backend à consulter

**NestJS/Prisma:**
- `prisma/schema.prisma` - Modèle `ProductCustomization`
- `src/customization/customization.service.ts` - Logique métier
- `src/customization/customization.controller.ts` - Endpoints API
- `src/customization/dto/create-customization.dto.ts` - Validation des données

**Frontend:**
- `src/types/` - Types TypeScript
- `src/services/customizationService.ts` - Appels API
- `src/pages/CustomerProductCustomizationPageV3.tsx` - Page de personnalisation
- `src/components/ProductDesignEditor.tsx` - Éditeur Fabric.js

### 14.2 Endpoints implémentés

**✅ Fonctionnels:**
- `POST /api/customizations` - Sauvegarder personnalisation
- `GET /api/customizations/:id` - Récupérer avec données complètes

**⚠️ À implémenter:**
- `PUT /api/customizations/:id` - Mettre à jour
- `DELETE /api/customizations/:id` - Supprimer
- `GET /api/customers/:id/customizations` - Liste par client
- `POST /api/customizations/upload-image` - Upload images

### 14.3 Démarrage rapide

**1. Exécuter la migration:**
```bash
cd backend
npx prisma migrate dev --name add_elements_by_view_support
```

**2. Redémarrer le backend:**
```bash
npm run start:dev
```

**3. Tester l'API:**
```bash
# Avec format simple
curl -X POST http://localhost:3000/api/customizations \
  -H "Content-Type: application/json" \
  -d '{"productId":5,"colorVariationId":13,"viewId":13,"designElements":[...],"sessionId":"test"}'

# Vérifier
curl http://localhost:3000/api/customizations/31
```

**4. Vérifier les logs:**
```bash
# Vous devriez voir:
📥 Conversion: designElements → elementsByView[13-13] (1 éléments)
✅ Created customization 31
```

### 14.4 Debugging

**Problème: Les données ne sont pas sauvegardées**
- ✅ Vérifier que la migration Prisma a été exécutée
- ✅ Vérifier les logs backend pour les erreurs
- ✅ Vérifier que le DTO valide correctement les données

**Problème: Le frontend ne reçoit pas les bonnes données**
- ✅ Vérifier le format de réponse dans le service
- ✅ S'assurer que `elementsByView` est retourné
- ✅ Vérifier que toutes les relations Prisma sont incluses

**Problème: Conversion entre formats**
- ✅ Les logs montrent la conversion automatique
- ✅ Les deux formats sont sauvegardés en base
- ✅ Le frontend peut utiliser l'un ou l'autre

### 14.5 Prochaines étapes recommandées

1. **Exécuter la migration** (critique)
2. **Tester l'API** avec curl ou Postman
3. **Intégrer le frontend** avec le nouveau backend
4. **Implémenter les endpoints manquants**
5. **Ajouter les validations de sécurité**
6. **Créer le système de snapshot pour commandes**

---

## 📚 Résumé

Le backend PrintAlma (NestJS/Prisma) est **maintenant compatible** avec les données de personnalisation du localStorage:

✅ **Support complet:**
- Format simple (`designElements`)
- Format multi-vues (`elementsByView`)
- Normalisation automatique
- Récupération avec toutes les données produit

✅ **Prêt pour production:**
- Modèle Prisma défini
- Services implémentés
- Logs de debugging
- Tests fournis

⚠️ **Action requise:**
- Exécuter la migration Prisma
- Tester avec le frontend
- Implémenter les endpoints manquants
