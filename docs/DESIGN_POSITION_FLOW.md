# Flux Complet : Capture et Envoi des Positions de Design

## 🎯 Objectif

Documenter comment les positions du design sont **capturées**, **stockées** et **envoyées au backend** depuis `SellDesignPage.tsx`.

---

## 📊 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    SellDesignPage.tsx                       │
│  (Vendeur positionne le design visuellement sur le produit)│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              useDesignTransforms Hook                        │
│   • Capture les positions (x, y, scale, rotation)          │
│   • Sauvegarde dans localStorage (temps réel)              │
│   • Retourne les positions pour le backend                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              useVendorPublish Hook                           │
│   • Reçoit designPosition depuis useDesignTransforms       │
│   • Construit le payload pour l'API                        │
│   • Envoie POST /vendor/products                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (NestJS)                            │
│   • Reçoit les positions exactes du frontend               │
│   • Génère l'image finale avec Sharp                       │
│   • Sauvegarde en base de données                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Étape 1 : Capture des Positions (SellDesignPage.tsx)

### 1.1 Hook useDesignTransforms

**Fichier** : `/src/hooks/useDesignTransforms.ts`

```typescript
export function useDesignTransforms(
  product: any,
  designUrl?: string,
  vendorProducts?: any[],
  vendorDesigns?: any[]
) {
  const [transformStates, setTransformStates] = useState<Record<number, Transform>>({});
  const { user } = useAuth();

  // Transform contient toutes les informations de position
  interface Transform {
    x: number;              // Offset X depuis le centre de la délimitation (en pixels)
    y: number;              // Offset Y depuis le centre de la délimitation (en pixels)
    scale: number;          // Échelle du design (0.8 = 80% de la délimitation)
    rotation: number;       // Rotation en degrés (0-360)
    designWidth?: number;   // Largeur originale du design (optionnel)
    designHeight?: number;  // Hauteur originale du design (optionnel)
    designScale?: number;   // Échelle appliquée au design (optionnel)
  }

  // Fonction de sauvegarde dans localStorage
  const saveToLocalStorage = async (position: Transform) => {
    if (!user?.id || !baseProductId || !designId) return;

    // Sauvegarder avec debounce (500ms)
    designPositionService.savePosition(
      designId,
      baseProductId,
      user.id,
      {
        x: position.x,
        y: position.y,
        scale: position.scale,
        rotation: position.rotation || 0,
        designWidth: position.designWidth,
        designHeight: position.designHeight
      }
    );
  };

  return {
    transformStates,      // Toutes les positions pour chaque produit
    updateTransform,      // Fonction pour mettre à jour une position
    saveToLocalStorage    // Fonction pour sauvegarder
  };
}
```

### 1.2 Utilisation dans SellDesignPage

```typescript
// Dans SellDesignPage.tsx (ligne 2256)
const { publishProducts, isPublishing } = useVendorPublish({
  onSuccess: (results) => {
    console.log('🎉 Publication réussie:', results);
  }
});

// Les positions sont capturées automatiquement par useDesignTransforms
// et stockées dans localStorage
```

---

## 📦 Étape 2 : Construction du Payload (useVendorPublish.ts)

### 2.1 Structure du Payload

**Fichier** : `/src/hooks/useVendorPublish.ts` (lignes 194-199)

```typescript
const payload = {
  baseProductId: productData.baseProductId,        // ID du produit admin
  designId: productData.designId,                  // ID du design
  vendorName: productData.vendorName,              // Nom personnalisé
  vendorPrice: productData.vendorPrice,            // Prix de vente

  // ⚠️ POSITION DU DESIGN (CRITIQUE)
  designPosition: {
    x: productData.designPosition?.x || 0,              // Offset X
    y: productData.designPosition?.y || 0,              // Offset Y
    scale: productData.designPosition?.scale || 0.8,    // Échelle (80% par défaut)
    rotation: productData.designPosition?.rotation || 0, // Rotation
    designWidth: productData.designPosition?.designWidth,   // Largeur design (optionnel)
    designHeight: productData.designPosition?.designHeight  // Hauteur design (optionnel)
  },

  // Structure complète du produit admin
  productStructure: {
    adminProduct: {
      id: productData.baseProductId,
      name: 'T-shirt',
      images: {
        colorVariations: [
          {
            id: 1,
            name: 'Blanc',
            colorCode: '#FFFFFF',
            images: [
              {
                url: 'https://cdn.example.com/tshirt-white.jpg',
                viewType: 'Front',
                delimitations: [
                  {
                    x: 25,              // 25% depuis la gauche
                    y: 25,              // 25% depuis le haut
                    width: 50,          // 50% de largeur
                    height: 50,         // 50% de hauteur
                    coordinateType: 'PERCENTAGE'
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    designApplication: {
      positioning: 'CENTER',
      scale: 0.8
    }
  },

  selectedColors: [{ id: 1, name: 'Blanc', colorCode: '#FFFFFF' }],
  selectedSizes: [{ id: 1, sizeName: 'M' }]
};
```

### 2.2 Exemple de Payload Complet

```json
{
  "baseProductId": 42,
  "designId": 7,
  "vendorName": "T-shirt One Piece",
  "vendorDescription": "T-shirt cool avec design One Piece",
  "vendorPrice": 15000,
  "vendorStock": 50,

  "designPosition": {
    "x": 0,
    "y": -10,
    "scale": 0.8,
    "rotation": 0,
    "designWidth": 512,
    "designHeight": 512
  },

  "productStructure": {
    "adminProduct": {
      "id": 42,
      "name": "T-shirt Homme Coton",
      "description": "T-shirt 100% coton",
      "price": 8000,
      "images": {
        "colorVariations": [
          {
            "id": 1,
            "name": "Blanc",
            "colorCode": "#FFFFFF",
            "images": [
              {
                "id": 101,
                "url": "https://res.cloudinary.com/xxx/tshirt-white-front.jpg",
                "viewType": "Front",
                "delimitations": [
                  {
                    "x": 25,
                    "y": 25,
                    "width": 50,
                    "height": 50,
                    "coordinateType": "PERCENTAGE",
                    "originalImageWidth": 1200,
                    "originalImageHeight": 1200
                  }
                ]
              }
            ]
          }
        ]
      },
      "sizes": [
        { "id": 1, "sizeName": "S" },
        { "id": 2, "sizeName": "M" },
        { "id": 3, "sizeName": "L" }
      ]
    },
    "designApplication": {
      "positioning": "CENTER",
      "scale": 0.8
    }
  },

  "selectedColors": [
    { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" }
  ],
  "selectedSizes": [
    { "id": 2, "sizeName": "M" }
  ],

  "defaultColorId": 1,
  "forcedStatus": "DRAFT",
  "postValidationAction": "AUTO_PUBLISH"
}
```

---

## 🚀 Étape 3 : Envoi au Backend

### 3.1 Endpoint API

```
POST /vendor/products
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### 3.2 Code d'Envoi (useVendorPublish.ts, lignes 200-230)

```typescript
const token = getAuthToken();

const response = await fetch(`${API_BASE_URL}/vendor/products`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include',
  body: JSON.stringify(payload)
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || 'Erreur lors de la création du produit');
}

const result = await response.json();
console.log('✅ Produit créé:', result);

return {
  success: true,
  productId: result.productId,
  message: result.message,
  status: result.status,
  imagesProcessed: result.imagesProcessed
};
```

---

## 🎨 Étape 4 : Utilisation Backend des Positions

### 4.1 Réception Backend (NestJS)

```typescript
// vendor-product.controller.ts
@Post()
async createVendorProduct(@Body() dto: VendorPublishDto) {
  // Extraire les positions
  const designPosition = dto.designPosition;

  console.log('📍 Position du design reçue:', designPosition);
  // {
  //   x: 0,
  //   y: -10,
  //   scale: 0.8,
  //   rotation: 0,
  //   designWidth: 512,
  //   designHeight: 512
  // }

  // Utiliser ces positions pour générer l'image finale
  await this.generateFinalImage(dto);
}
```

### 4.2 Génération d'Image avec les Positions

```typescript
async generateFinalImage(dto: VendorPublishDto) {
  // Récupérer les URLs
  const mockupUrl = dto.productStructure.adminProduct.images.colorVariations[0].images[0].url;
  const designUrl = await this.getDesignUrl(dto.designId);

  // Récupérer la délimitation
  const delimitation = dto.productStructure.adminProduct.images.colorVariations[0].images[0].delimitations[0];

  // Récupérer la position
  const position = dto.designPosition;

  // ⚠️ UTILISER LA FONCTION DOCUMENTÉE DANS BACKEND_DESIGN_POSITIONING_EXACT.md
  const finalImageBuffer = await generateFinalImageExact(
    mockupUrl,
    designUrl,
    delimitation,
    position
  );

  // Upload sur Cloudinary
  const finalImageUrl = await this.uploadToCloudinary(finalImageBuffer);

  // Sauvegarder en base de données
  await this.saveToDatabase({
    ...dto,
    finalImageUrl,
    designPosition: position  // ⚠️ IMPORTANT : Sauvegarder la position en BDD
  });
}
```

---

## 📝 Exemple Complet de Flux

### Scénario : Vendeur crée un T-shirt avec design One Piece

#### 1. Vendeur positionne le design

```
Interface utilisateur (SellDesignPage.tsx):
┌────────────────────────────────────────┐
│  [Image du T-shirt]                    │
│                                        │
│     ┌─────────────────┐                │
│     │   One Piece     │ ← Design positionné
│     │   [Logo]        │   x=0, y=-10
│     └─────────────────┘                │
│                                        │
└────────────────────────────────────────┘
```

**Position capturée** :
```javascript
{
  x: 0,         // Centré horizontalement
  y: -10,       // 10px vers le haut depuis le centre
  scale: 0.8,   // 80% de la délimitation
  rotation: 0,  // Pas de rotation
  designWidth: 512,
  designHeight: 512
}
```

#### 2. Sauvegarde automatique en localStorage

```javascript
// Clé localStorage
const key = `design_position_${designId}_${baseProductId}_${vendorId}`;

// Valeur
localStorage.setItem(key, JSON.stringify({
  position: {
    x: 0,
    y: -10,
    scale: 0.8,
    rotation: 0,
    designWidth: 512,
    designHeight: 512
  },
  timestamp: Date.now()
}));
```

#### 3. Clic sur "Publier"

Le vendeur clique sur le bouton de publication.

#### 4. Construction du payload

`useVendorPublish` construit le payload complet avec la position :

```json
{
  "baseProductId": 42,
  "designId": 7,
  "vendorName": "T-shirt One Piece",
  "vendorPrice": 15000,
  "designPosition": {
    "x": 0,
    "y": -10,
    "scale": 0.8,
    "rotation": 0,
    "designWidth": 512,
    "designHeight": 512
  },
  "productStructure": { ... },
  "selectedColors": [ ... ],
  "selectedSizes": [ ... ]
}
```

#### 5. Envoi API

```
POST https://printalma-back-dep.onrender.com/vendor/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{payload}
```

#### 6. Backend génère l'image

Le backend utilise les positions **exactes** :

```typescript
const finalImage = await generateFinalImageExact(
  'https://cdn.example.com/tshirt-white.jpg',  // Mockup
  'https://cdn.example.com/onepiece-logo.png', // Design
  {
    x: 25,
    y: 25,
    width: 50,
    height: 50,
    coordinateType: 'PERCENTAGE'
  },
  {
    x: 0,
    y: -10,
    scale: 0.8,
    rotation: 0
  }
);
```

#### 7. Résultat

L'image générée est **identique** à ce que le vendeur a vu dans `SellDesignPage`.

---

## ✅ Points Clés à Retenir

### 1. Les positions sont capturées en temps réel

- Chaque mouvement du design est enregistré
- Sauvegarde automatique dans localStorage (debounce 500ms)
- Pas besoin d'action manuelle du vendeur

### 2. Les positions sont relatives au centre de la délimitation

```
x = 0, y = 0   →  Design centré dans la délimitation
x = 50, y = 0  →  Design décalé de 50px vers la droite
x = 0, y = -20 →  Design décalé de 20px vers le haut
```

### 3. Le scale est un pourcentage de la délimitation

```
scale = 1.0  →  Design occupe 100% de la délimitation
scale = 0.8  →  Design occupe 80% de la délimitation
scale = 0.5  →  Design occupe 50% de la délimitation
```

### 4. Les dimensions du design sont optionnelles mais recommandées

```typescript
{
  designWidth: 512,   // Largeur originale du fichier PNG/SVG
  designHeight: 512   // Hauteur originale du fichier PNG/SVG
}
```

Elles permettent au backend de préserver l'aspect ratio exact.

### 5. Le backend DOIT utiliser la documentation

Pour générer l'image correctement, le backend DOIT suivre :
- `/docs/BACKEND_DESIGN_POSITIONING_EXACT.md`

---

## 🐛 Debug

### Vérifier les positions envoyées

1. **Ouvrir DevTools Console**
2. **Chercher les logs** :
   ```
   📦 Création produit vendeur via hook...
   🎨 Position du design:
   ```

3. **Vérifier le payload** :
   ```javascript
   console.log('Payload envoyé:', JSON.stringify(payload, null, 2));
   ```

### Comparer Frontend vs Backend

1. **Frontend** : Ouvrir `SellDesignPage`, positionner le design
2. **Vérifier localStorage** :
   ```javascript
   Object.keys(localStorage)
     .filter(k => k.startsWith('design_position_'))
     .forEach(k => console.log(k, localStorage.getItem(k)));
   ```

3. **Backend** : Logger les positions reçues
4. **Comparer** : Les valeurs doivent être identiques

---

## 📚 Fichiers Importants

### Frontend
- `/src/pages/SellDesignPage.tsx` - Interface de positionnement
- `/src/hooks/useDesignTransforms.ts` - Capture des positions
- `/src/hooks/useVendorPublish.ts` - Envoi au backend
- `/src/services/DesignPositionService.ts` - Gestion localStorage

### Backend
- `/docs/BACKEND_DESIGN_POSITIONING_EXACT.md` - Guide génération d'images
- `POST /vendor/products` - Endpoint de création

---

**Version** : 1.0
**Date** : 15 janvier 2026
**Auteur** : Documentation du flux complet frontend → backend
