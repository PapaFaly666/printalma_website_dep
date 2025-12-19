# Frontend - Modifications pour Traquer le Vendeur des Designs

## 📋 Vue d'ensemble

Ce document liste les modifications frontend nécessaires pour que le `vendorId` soit correctement transmis depuis le choix du design jusqu'au backend lors de l'ajout au panier.

## ✅ État Actuel

### Structure des Données Existante

1. **Design Object** (depuis `/public/designs`):
```typescript
{
  id: number,
  name: string,
  price: number,
  imageUrl: string,
  creator: {
    id: number,           // 🎯 vendorId disponible ici
    shopName: string,
    // Autres propriétés...
  }
}
```

2. **ImageElement Interface** (`ProductDesignEditor.tsx` ligne 49-63):
```typescript
interface ImageElement extends BaseElement {
  type: 'image';
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;

  // ✅ Déjà présent:
  designId?: number;
  designPrice?: number;
  designName?: string;

  // ✅ Déjà déclaré mais pas utilisé:
  vendorId?: number;
  vendorName?: string;
  vendorShopName?: string;
  vendorCommissionRate?: number;
}
```

## 🔧 Modifications Nécessaires

### 1. Modifier `ProductDesignEditor.tsx`

#### A. Fonction `addImage` (ligne 306)

**Avant:**
```typescript
const addImage = (
  imageUrl: string,
  naturalWidth: number,
  naturalHeight: number,
  designId?: number,
  designPrice?: number,
  designName?: string
) => {
```

**Après:**
```typescript
const addImage = (
  imageUrl: string,
  naturalWidth: number,
  naturalHeight: number,
  designId?: number,
  designPrice?: number,
  designName?: string,
  vendorId?: number,        // 🆕 Ajouter
  vendorShopName?: string   // 🆕 Ajouter (optionnel mais utile)
) => {
```

#### B. Objet `newImage` (ligne 369-384)

**Avant:**
```typescript
const newImage: ImageElement = {
  id: generateId(),
  type: 'image',
  imageUrl,
  x: centerX,
  y: centerY,
  width: normalizedWidth,
  height: normalizedHeight,
  rotation: 0,
  naturalWidth,
  naturalHeight,
  zIndex: elements.length,
  // 💰 Ajouter les informations du design pour le calcul du prix
  designId,
  designPrice,
  designName
};
```

**Après:**
```typescript
const newImage: ImageElement = {
  id: generateId(),
  type: 'image',
  imageUrl,
  x: centerX,
  y: centerY,
  width: normalizedWidth,
  height: normalizedHeight,
  rotation: 0,
  naturalWidth,
  naturalHeight,
  zIndex: elements.length,
  // 💰 Informations du design pour le calcul du prix
  designId,
  designPrice,
  designName,
  // 🆕 Informations du vendeur pour les commissions
  vendorId,           // 🆕 Ajouté
  vendorShopName      // 🆕 Ajouté
};
```

#### C. Fonction `addVendorDesign` (ligne 415)

**Avant:**
```typescript
const addVendorDesign = (design: any) => {
  const img = new Image();
  img.onload = () => {
    console.log('💰 [ProductDesignEditor] Ajout design vendeur:', {
      id: design.id,
      name: design.name,
      price: design.price
    });
    addImage(
      design.imageUrl,
      img.naturalWidth,
      img.naturalHeight,
      design.id,        // designId
      design.price,     // designPrice
      design.name       // designName
    );
    setShowDesignLibrary(false);
  };
  img.src = design.imageUrl;
};
```

**Après:**
```typescript
const addVendorDesign = (design: any) => {
  const img = new Image();
  img.onload = () => {
    console.log('💰 [ProductDesignEditor] Ajout design vendeur:', {
      id: design.id,
      name: design.name,
      price: design.price,
      vendorId: design.creator?.id,         // 🆕 Log ajouté
      vendorShopName: design.creator?.shopName  // 🆕 Log ajouté
    });
    addImage(
      design.imageUrl,
      img.naturalWidth,
      img.naturalHeight,
      design.id,                    // designId
      design.price,                 // designPrice
      design.name,                  // designName
      design.creator?.id,           // 🆕 vendorId
      design.creator?.shopName      // 🆕 vendorShopName
    );
    setShowDesignLibrary(false);
  };
  img.src = design.imageUrl;
};
```

### 2. Vérifier la Propagation des Données

#### A. CustomerProductCustomizationPageV3.tsx - handleAddToCart (ligne 745)

La fonction sauvegarde déjà correctement les éléments en base de données. **Aucune modification nécessaire** car les éléments sont transmis tels quels:

```typescript
const customizationData = {
  productId: product.id,
  colorVariationId: colorId,
  viewId: viewId,
  designElements: elements, // ✅ Contient déjà vendorId si présent
  sizeSelections: selections,
  sessionId: customizationService.getOrCreateSessionId(),
};
```

#### B. Vérification Backend

Le backend recevra donc dans `customizationData.designElements`:

```json
[
  {
    "id": "elem_1234",
    "type": "image",
    "imageUrl": "https://...",
    "designId": 42,
    "designPrice": 5000,
    "designName": "Mon Super Design",
    "vendorId": 15,              // 🆕 Maintenant présent
    "vendorShopName": "Shop XYZ", // 🆕 Maintenant présent
    "x": 0.5,
    "y": 0.5,
    "width": 200,
    "height": 200,
    "rotation": 0,
    "zIndex": 1
  }
]
```

## ✅ Tests à Effectuer

### 1. Test Ajout de Design Vendeur

```typescript
// Dans la console du navigateur, après avoir ajouté un design:

// 1. Vérifier l'élément dans l'éditeur
console.log('Éléments dans l'éditeur:', editorRef.current?.getElements());
// Vérifier que chaque ImageElement a bien designId, designPrice, ET vendorId

// 2. Vérifier dans localStorage
const storageKey = `design-data-product-${productId}`;
const saved = localStorage.getItem(storageKey);
console.log('Données sauvegardées:', JSON.parse(saved));
// Vérifier que elementsByView contient bien vendorId
```

### 2. Test Sauvegarde en Base de Données

```sql
-- Vérifier dans la table customizations que les design_elements contiennent vendorId
SELECT
  id,
  product_id,
  design_elements::jsonb AS elements
FROM customizations
WHERE id = [CUSTOMIZATION_ID];

-- Exemple de résultat attendu:
-- design_elements devrait contenir vendorId pour chaque élément de type image avec un designId
```

### 3. Test Complet Bout-en-Bout

1. **Sélectionner un design vendeur** dans la bibliothèque
2. **Placer le design** sur le produit
3. **Ouvrir la console** et vérifier les logs:
   ```
   💰 [ProductDesignEditor] Ajout design vendeur: {
     id: 42,
     name: "Super Design",
     price: 5000,
     vendorId: 15,
     vendorShopName: "My Shop"
   }
   ```
4. **Ajouter au panier**
5. **Vérifier en BDD** que la customization contient le `vendorId`

## 📝 Exemple de Diff Complet

### src/components/ProductDesignEditor.tsx

```diff
  const addImage = (
    imageUrl: string,
    naturalWidth: number,
    naturalHeight: number,
    designId?: number,
    designPrice?: number,
-   designName?: string
+   designName?: string,
+   vendorId?: number,
+   vendorShopName?: string
  ) => {
    // ... code existant ...

    const newImage: ImageElement = {
      id: generateId(),
      type: 'image',
      imageUrl,
      x: centerX,
      y: centerY,
      width: normalizedWidth,
      height: normalizedHeight,
      rotation: 0,
      naturalWidth,
      naturalHeight,
      zIndex: elements.length,
      designId,
      designPrice,
-     designName
+     designName,
+     vendorId,
+     vendorShopName
    };

    // ... reste du code ...
  };

  const addVendorDesign = (design: any) => {
    const img = new Image();
    img.onload = () => {
      console.log('💰 [ProductDesignEditor] Ajout design vendeur:', {
        id: design.id,
        name: design.name,
-       price: design.price
+       price: design.price,
+       vendorId: design.creator?.id,
+       vendorShopName: design.creator?.shopName
      });
      addImage(
        design.imageUrl,
        img.naturalWidth,
        img.naturalHeight,
        design.id,
        design.price,
-       design.name
+       design.name,
+       design.creator?.id,
+       design.creator?.shopName
      );
      setShowDesignLibrary(false);
    };
    img.src = design.imageUrl;
  };
```

## 🚀 Déploiement

### Ordre d'Implémentation Recommandé

1. ✅ **Backend** - Créer la table `design_usages` et implémenter la logique d'extraction
2. ✅ **Frontend** - Modifier `ProductDesignEditor.tsx` pour transmettre le `vendorId`
3. ✅ **Tests** - Vérifier que le `vendorId` est bien transmis jusqu'en BDD
4. ✅ **Validation** - Tester un achat complet et vérifier que les revenus apparaissent dans `/vendeur/design-revenues`

### Commandes de Test

```bash
# 1. Démarrer le frontend
npm run dev

# 2. Ouvrir la console navigateur et activer les logs
localStorage.setItem('debug', 'customization*')

# 3. Naviguer vers une page de personnalisation
# 4. Ajouter un design vendeur
# 5. Vérifier les logs dans la console

# 6. Ajouter au panier et créer une commande
# 7. Vérifier dans la BDD
psql -d printalma -c "
  SELECT
    du.*,
    d.name as design_name,
    u.email as vendor_email
  FROM design_usages du
  JOIN designs d ON d.id = du.design_id
  JOIN users u ON u.id = du.vendor_id
  ORDER BY du.created_at DESC
  LIMIT 5;
"
```

## ⚠️ Points d'Attention

### 1. Designs Gratuits
Les designs gratuits (prix = 0) ne créent PAS d'enregistrement `design_usage` car il n'y a pas de revenu à traquer.

### 2. Designs Multiples
Si le même design est utilisé plusieurs fois dans différentes vues, il ne sera enregistré **qu'une seule fois** par commande (logique de dédoublonnage dans le backend).

### 3. Designs Uploadés par le Client
Les images uploadées par le client (via le bouton Upload) n'ont pas de `designId` ni de `vendorId`, donc elles ne génèrent pas de revenus vendeur.

```typescript
// Image uploadée par client
{
  type: 'image',
  imageUrl: 'data:image/png;base64,...',
  designId: undefined,      // Pas de design vendeur
  vendorId: undefined       // Pas de vendeur
}

// Design vendeur
{
  type: 'image',
  imageUrl: 'https://cloudinary.com/...',
  designId: 42,             // Design vendeur présent
  vendorId: 15,             // Vendeur présent
  designPrice: 5000         // Prix présent
}
```

### 4. Compatibilité Descendante
Si des customizations existantes n'ont pas de `vendorId`, le backend doit gérer ce cas:

```javascript
// Dans extractAndRecordDesignUsages()
if (element.type !== 'image' || !element.designId || !element.designPrice) {
  continue;
}

// 🆕 Vérifier que vendorId existe
if (!element.vendorId) {
  console.warn(`⚠️ Design ${element.designId} sans vendorId, tentative de récupération...`);

  // Essayer de récupérer le vendorId depuis la table designs
  const design = await db.designs.findById(element.designId);
  if (design) {
    element.vendorId = design.vendor_id;
  } else {
    console.error(`❌ Impossible de trouver le vendorId pour design ${element.designId}`);
    continue; // Ne pas enregistrer sans vendorId
  }
}
```

## ✅ Checklist Finale

### Frontend
- [ ] Modifier `addImage()` pour accepter `vendorId` et `vendorShopName`
- [ ] Modifier `addVendorDesign()` pour passer `design.creator.id` et `design.creator.shopName`
- [ ] Ajouter les champs dans l'objet `newImage`
- [ ] Tester l'ajout d'un design vendeur et vérifier les logs
- [ ] Vérifier dans localStorage que `vendorId` est présent
- [ ] Vérifier dans la BDD que la customization contient `vendorId`

### Backend
- [ ] Créer la table `design_usages`
- [ ] Implémenter `extractAndRecordDesignUsages()`
- [ ] Gérer le cas où `vendorId` est absent (fallback vers table designs)
- [ ] Implémenter la mise à jour des statuts (webhook PayDunya, livraison, annulation)
- [ ] Créer les endpoints pour `/api/vendor/design-revenues/*`
- [ ] Tester bout-en-bout avec une commande complète

### Tests
- [ ] Créer une commande avec un design vendeur
- [ ] Vérifier que `design_usages` contient un enregistrement
- [ ] Vérifier que les statistiques dans `/vendeur/design-revenues` sont correctes
- [ ] Simuler un paiement et vérifier la mise à jour du statut
- [ ] Simuler une livraison et vérifier le statut `READY_FOR_PAYOUT`

## 🎉 Résultat Final

Une fois toutes les modifications effectuées:

1. **Client personnalise** un produit avec un design vendeur
   ```json
   {
     "designId": 42,
     "vendorId": 15,
     "designPrice": 5000
   }
   ```

2. **Backend enregistre** dans `design_usages`
   ```sql
   INSERT INTO design_usages (
     design_id, vendor_id, design_price,
     vendor_revenue, payment_status
   ) VALUES (
     42, 15, 5000,
     3500, 'PENDING'
   );
   ```

3. **Vendeur consulte** `/vendeur/design-revenues`
   ```
   📊 Revenus des Designs

   Total: 125,000 FCFA
   En attente: 45,000 FCFA
   Complété: 80,000 FCFA

   Design "Super Logo" - 15 utilisations - 45,000 FCFA
   ```

4. **Système de paiement** automatique suit le cycle de vie complet! 🚀
