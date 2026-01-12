# Guide d'utilisation - Système de Stickers Vendeur

## Vue d'ensemble

Le système de stickers vendeur permet aux vendeurs de transformer leurs designs en produits stickers autocollants ou pare-chocs. Chaque sticker devient un produit indépendant dans le catalogue.

## Architecture

### Composants créés

1. **Service API** (`src/services/vendorStickerService.ts`)
   - Gestion CRUD des produits stickers
   - Calcul automatique des prix
   - Configuration des options (tailles, surfaces, bordures)

2. **Composant de création** (`src/components/vendor/VendorStickerCreator.tsx`)
   - Interface wizard en 3 étapes
   - Aperçu en temps réel
   - Validation des configurations

3. **Page de gestion** (`src/pages/vendor/VendorStickerPage.tsx`)
   - Intégration du composant VendorStickerCreator
   - Sélection de designs existants

## Utilisation

### Pour les vendeurs

#### 1. Créer un sticker depuis un design

```typescript
// Depuis VendorDesignsPage ou VendorStickerPage
import VendorStickerCreator from './components/vendor/VendorStickerCreator';

<VendorStickerCreator
  design={{
    id: designId,
    name: 'Mon Design',
    imageUrl: 'https://...',
    price: 0
  }}
  onSuccess={(productId) => {
    // Rediriger vers la page du produit créé
    navigate(`/vendeur/products/${productId}`);
  }}
  onCancel={() => {
    // Retour à la liste des designs
    navigate('/vendeur/designs');
  }}
/>
```

#### 2. Étapes de création

**Étape 1 : Choix du type**
- Autocollant (avec contours découpés)
- Pare-chocs (format rectangulaire)

**Étape 2 : Configuration**
- Taille (plusieurs options prédéfinies)
- Surface (blanc mat ou transparent pour autocollants)
- Bordure (transparent, blanc, blanc brillant pour autocollants)
- Nom et description du produit
- Stock initial

**Étape 3 : Aperçu et confirmation**
- Visualisation du sticker avec effets
- Résumé de la configuration
- Prix calculé automatiquement
- Option de publication automatique

#### 3. Prix automatiques

Le système calcule automatiquement les prix selon :
- **Type de base** :
  - Autocollant : 2 000 FCFA
  - Pare-chocs : 4 500 FCFA
- **Multiplicateur de taille** : selon les dimensions sélectionnées
- **Prix du design** : ajouté au prix final

```typescript
const prix = (prixBase × multiplicateurTaille) + prixDesign
```

### API Endpoints

#### Créer un produit sticker

```http
POST /vendor/stickers
Content-Type: application/json

{
  "designId": 123,
  "stickerType": "autocollant",
  "stickerSurface": "blanc-mat",
  "stickerBorderColor": "glossy-white",
  "stickerSize": "83 mm x 100 mm",
  "name": "Mon Sticker Personnalisé",
  "description": "Description du sticker",
  "price": 2500,
  "stock": 10,
  "status": "DRAFT",
  "autoPublish": false
}
```

#### Lister les produits stickers

```http
GET /vendor/stickers?limit=20&offset=0&status=published
```

#### Obtenir un produit sticker

```http
GET /vendor/stickers/:id
```

#### Mettre à jour un produit sticker

```http
PUT /vendor/stickers/:id
Content-Type: application/json

{
  "name": "Nouveau nom",
  "price": 3000,
  "stock": 20
}
```

#### Supprimer un produit sticker

```http
DELETE /vendor/stickers/:id
```

#### Publier un produit sticker

```http
PUT /vendor/stickers/:id/publish
```

## Configuration des types de stickers

### Autocollants

**Tailles disponibles** :
- 83 mm x 100 mm (minimum)
- 100 mm x 120 mm
- 120 mm x 144 mm
- 150 mm x 180 mm

**Surfaces** :
- Blanc mat : Surface opaque avec finition mate
- Transparent : Seul le design est visible

**Bordures** :
- Transparent : Sans bordure visible
- Blanc : Bordure blanche mate
- Blanc brillant : Bordure blanche avec effet glossy

### Pare-chocs

**Tailles disponibles** :
- 100 mm x 300 mm (minimum)
- 120 mm x 360 mm
- 150 mm x 450 mm

**Caractéristiques** :
- Format rectangulaire uniquement
- Bordure blanche large automatique
- Surface blanc mat

## Intégration dans l'interface vendeur

### Ajouter le bouton de création dans VendorDesignsPage

```tsx
import { Sticker } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Dans le menu dropdown de chaque design
<DropdownMenuItem
  onClick={() => navigate(`/vendeur/stickers/create?designId=${design.id}`)}
>
  <Sticker className="w-4 h-4 mr-2" />
  Créer un sticker
</DropdownMenuItem>
```

### Page de création de sticker

```tsx
// src/pages/vendor/VendorStickerCreatePage.tsx
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import VendorStickerCreator from '../../components/vendor/VendorStickerCreator';
import designService from '../../services/designService';

const VendorStickerCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const designId = searchParams.get('designId');

  const [design, setDesign] = React.useState(null);

  React.useEffect(() => {
    if (designId) {
      loadDesign(parseInt(designId));
    }
  }, [designId]);

  const loadDesign = async (id: number) => {
    try {
      const data = await designService.getDesignById(id);
      setDesign(data);
    } catch (error) {
      console.error('Erreur chargement design:', error);
    }
  };

  if (!design) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <VendorStickerCreator
        design={design}
        onSuccess={(productId) => navigate(`/vendeur/products/${productId}`)}
        onCancel={() => navigate('/vendeur/designs')}
      />
    </div>
  );
};

export default VendorStickerCreatePage;
```

## Routes à ajouter

```tsx
// Dans src/App.tsx ou le fichier de routes
import VendorStickerPage from './pages/vendor/VendorStickerPage';
import VendorStickerCreatePage from './pages/vendor/VendorStickerCreatePage';

// Routes vendeur
<Route path="/vendeur/stickers" element={<VendorStickerPage />} />
<Route path="/vendeur/stickers/create" element={<VendorStickerCreatePage />} />
```

## Backend requis

Le backend doit implémenter les endpoints suivants :

### Modèle de données

```sql
CREATE TABLE vendor_sticker_products (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES users(id),
  design_id INTEGER NOT NULL REFERENCES designs(id),

  -- Configuration sticker
  sticker_type VARCHAR(20) NOT NULL CHECK (sticker_type IN ('autocollant', 'pare-chocs')),
  sticker_surface VARCHAR(20) NOT NULL CHECK (sticker_surface IN ('blanc-mat', 'transparent')),
  sticker_border_color VARCHAR(20) NOT NULL,
  sticker_size VARCHAR(50) NOT NULL,

  -- Informations produit
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED')),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE
);

CREATE INDEX idx_vendor_sticker_products_vendor ON vendor_sticker_products(vendor_id);
CREATE INDEX idx_vendor_sticker_products_design ON vendor_sticker_products(design_id);
CREATE INDEX idx_vendor_sticker_products_status ON vendor_sticker_products(status);
```

### Contrôleur (exemple Node.js/Express)

```typescript
// routes/vendor/stickers.ts
import { Router } from 'express';
import { auth, vendorOnly } from '../middleware/auth';

const router = Router();

// Créer un produit sticker
router.post('/', auth, vendorOnly, async (req, res) => {
  const {
    designId,
    stickerType,
    stickerSurface,
    stickerBorderColor,
    stickerSize,
    name,
    description,
    price,
    stock,
    status,
    autoPublish
  } = req.body;

  // Valider les données
  if (!designId || !stickerType || !name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Données manquantes'
    });
  }

  // Vérifier que le design appartient au vendeur
  const design = await db.query(
    'SELECT * FROM designs WHERE id = $1 AND vendor_id = $2',
    [designId, req.user.id]
  );

  if (design.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Design non trouvé'
    });
  }

  // Créer le produit sticker
  const result = await db.query(
    `INSERT INTO vendor_sticker_products
    (vendor_id, design_id, sticker_type, sticker_surface, sticker_border_color,
     sticker_size, name, description, price, stock, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      req.user.id,
      designId,
      stickerType,
      stickerSurface,
      stickerBorderColor,
      stickerSize,
      name,
      description || null,
      price,
      stock || 10,
      autoPublish ? 'PUBLISHED' : 'DRAFT'
    ]
  );

  res.json({
    success: true,
    message: 'Produit sticker créé avec succès',
    productId: result.rows[0].id,
    product: result.rows[0]
  });
});

// Autres endpoints (GET, PUT, DELETE...)

export default router;
```

## Tests

### Test de création

```typescript
describe('Vendor Sticker Service', () => {
  it('should calculate correct price for autocollant', () => {
    const price = vendorStickerService.calculateStickerPrice(
      'autocollant',
      500, // prix design
      '83 mm x 100 mm'
    );

    expect(price).toBe(2500); // 2000 base + 500 design
  });

  it('should create sticker product', async () => {
    const payload = {
      designId: 1,
      stickerType: 'autocollant',
      stickerSurface: 'blanc-mat',
      stickerBorderColor: 'white',
      stickerSize: '83 mm x 100 mm',
      name: 'Test Sticker',
      price: 2500,
      stock: 10
    };

    const result = await vendorStickerService.createStickerProduct(payload);

    expect(result.success).toBe(true);
    expect(result.productId).toBeDefined();
  });
});
```

## Dépannage

### Erreur "designId est requis"
Vérifiez que le design est bien sélectionné avant de créer le sticker.

### Prix à 0
Le calcul automatique peut échouer si le type de sticker n'est pas défini. Assurez-vous de passer par toutes les étapes du wizard.

### Aperçu ne s'affiche pas
Vérifiez que l'URL de l'image du design est accessible et que le CORS est correctement configuré.

## Évolutions futures

- [ ] Support des designs vectoriels (SVG)
- [ ] Personnalisation des couleurs de fond
- [ ] Effets spéciaux (holographique, métallique)
- [ ] Pack de stickers (plusieurs designs en un produit)
- [ ] Impression personnalisée des dimensions
- [ ] Intégration avec système de production
- [ ] Calcul automatique des frais de livraison selon la taille

## Support

Pour toute question ou problème :
- Documentation API : `/docs/api/vendor-stickers`
- Support technique : support@printalma.com
- Discord communauté : [Lien Discord]
