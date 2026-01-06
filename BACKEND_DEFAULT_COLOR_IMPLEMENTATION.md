# Backend - Implémentation de la Couleur par Défaut pour les Produits Vendeur

## 📋 Contexte

Le vendeur peut maintenant définir une couleur par défaut qui sera affichée en premier aux clients lors de la visualisation du produit. Cette fonctionnalité améliore l'expérience utilisateur en s'assurant que le produit s'affiche dans la meilleure couleur choisie par le vendeur.

## 🎯 Modifications Frontend Effectuées

### 1. Nouveaux États et UI
- **État `defaultColorIds`**: Stocke la couleur par défaut pour chaque produit (Record<number, number>)
- **Icône étoile**: Permet au vendeur de marquer une couleur comme "par défaut"
- **Priorité d'affichage**: Couleur par défaut > Première couleur active > Première variation

### 2. Modifications dans `SellDesignPage.tsx`
- Ajout de l'état `defaultColorIds` (ligne 2126)
- Interface utilisateur avec icône Star pour marquer la couleur par défaut
- Logique d'initialisation modifiée pour prioriser la couleur par défaut

### 3. Modifications dans `useVendorPublish.ts`
- Ajout de `defaultColorId?: number` dans l'interface `VendorPublishData`
- Paramètre `defaultColorIds` ajouté à la fonction `publishProducts`
- Le `defaultColorId` est maintenant inclus dans le payload envoyé au backend

## 🔧 Modifications Backend Requises

### 1. Modèle de Données

#### Table: `vendor_products`
Ajouter une nouvelle colonne pour stocker la couleur par défaut :

```sql
ALTER TABLE vendor_products
ADD COLUMN default_color_id INTEGER REFERENCES color_variations(id);
```

**Notes:**
- Nullable (optionnel)
- Foreign key vers la table `color_variations` ou équivalent
- Validation: La couleur par défaut doit faire partie des `selectedColors` du produit

### 2. DTO (Data Transfer Object)

#### VendorPublishDto / CreateVendorProductDto

Ajouter le champ dans le DTO :

```typescript
export class VendorPublishDto {
  @IsNumber()
  baseProductId: number;

  @IsNumber()
  designId: number;

  @IsString()
  vendorName: string;

  @IsOptional()
  @IsString()
  vendorDescription?: string;

  @IsNumber()
  vendorPrice: number;

  @IsOptional()
  @IsNumber()
  vendorStock?: number;

  @IsArray()
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;

  @IsArray()
  selectedSizes: Array<{ id: number; sizeName: string }>;

  // 🆕 NOUVEAU CHAMP
  @IsOptional()
  @IsNumber()
  defaultColorId?: number;

  // ... autres champs
}
```

### 3. Validation Backend

Implémenter une validation pour s'assurer que:
1. Le `defaultColorId` fait partie des `selectedColors`
2. La couleur existe et est active

```typescript
// Exemple de validation
async validateDefaultColor(dto: VendorPublishDto) {
  if (dto.defaultColorId) {
    const isColorSelected = dto.selectedColors.some(
      color => color.id === dto.defaultColorId
    );

    if (!isColorSelected) {
      throw new BadRequestException(
        'La couleur par défaut doit faire partie des couleurs sélectionnées'
      );
    }
  }
}
```

### 4. Service de Création/Mise à Jour

#### Lors de la création du produit vendeur:

```typescript
async createVendorProduct(dto: VendorPublishDto, vendorId: number) {
  // Valider la couleur par défaut
  await this.validateDefaultColor(dto);

  const vendorProduct = await this.vendorProductRepository.create({
    baseProductId: dto.baseProductId,
    designId: dto.designId,
    vendorId: vendorId,
    name: dto.vendorName,
    description: dto.vendorDescription,
    price: dto.vendorPrice,
    stock: dto.vendorStock,
    selectedColors: dto.selectedColors,
    selectedSizes: dto.selectedSizes,
    defaultColorId: dto.defaultColorId, // 🆕 NOUVEAU
    status: dto.forcedStatus || 'DRAFT',
    // ... autres champs
  });

  return vendorProduct;
}
```

### 5. Réponse API

#### GET /vendor/products/:id
Inclure le `defaultColorId` dans la réponse:

```typescript
{
  "success": true,
  "data": {
    "id": 123,
    "name": "T-shirt personnalisé",
    "price": 15000,
    "selectedColors": [
      { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
      { "id": 2, "name": "Noir", "colorCode": "#000000" },
      { "id": 3, "name": "Rouge", "colorCode": "#FF0000" }
    ],
    "defaultColorId": 2, // 🆕 Noir est la couleur par défaut
    // ... autres champs
  }
}
```

#### GET /public/vendor-products/:id
Le `defaultColorId` doit également être inclus dans les endpoints publics pour que les clients voient la bonne couleur en premier:

```typescript
{
  "success": true,
  "data": {
    "id": 123,
    "name": "T-shirt personnalisé",
    "defaultColorId": 2, // 🆕 La couleur à afficher en premier
    "colorVariations": [
      { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
      { "id": 2, "name": "Noir", "colorCode": "#000000" },
      { "id": 3, "name": "Rouge", "colorCode": "#FF0000" }
    ],
    // ... autres champs
  }
}
```

### 6. Migration de Données

Pour les produits existants sans couleur par défaut:

```sql
-- Option 1: Définir la première couleur sélectionnée comme défaut
UPDATE vendor_products vp
SET default_color_id = (
  SELECT (selected_colors->0->>'id')::integer
  FROM vendor_products
  WHERE id = vp.id
  AND selected_colors IS NOT NULL
  AND jsonb_array_length(selected_colors) > 0
)
WHERE default_color_id IS NULL
  AND selected_colors IS NOT NULL
  AND jsonb_array_length(selected_colors) > 0;
```

**OU**

```sql
-- Option 2: Laisser NULL et gérer côté frontend (recommandé)
-- Le frontend utilisera la première couleur active si defaultColorId est null
```

## 📊 Flux de Données

### 1. Création d'un Produit Vendeur

```
Frontend (SellDesignPage)
  ↓
  Vendeur sélectionne couleurs [Blanc, Noir, Rouge]
  ↓
  Vendeur clique sur ⭐ pour marquer "Noir" comme défaut
  ↓
  defaultColorIds = { 123: 2 } // productId: 123, colorId: 2
  ↓
  publishProducts(..., defaultColorIds)
  ↓
Backend (useVendorPublish.ts)
  ↓
  POST /vendor/products
  {
    selectedColors: [
      { id: 1, name: "Blanc", colorCode: "#FFFFFF" },
      { id: 2, name: "Noir", colorCode: "#000000" },
      { id: 3, name: "Rouge", colorCode: "#FF0000" }
    ],
    defaultColorId: 2 // 🆕
  }
  ↓
Backend (API)
  ↓
  Validation: defaultColorId (2) est dans selectedColors ✓
  ↓
  Sauvegarde en base de données
  ↓
  Réponse avec defaultColorId inclus
```

### 2. Affichage Public du Produit

```
Client visite /vendor-product-detail/123
  ↓
Frontend fetch GET /public/vendor-products/123
  ↓
Backend retourne:
  {
    colorVariations: [...],
    defaultColorId: 2
  }
  ↓
Frontend initialise l'affichage
  ↓
  Si defaultColorId existe → Afficher la couleur 2 (Noir)
  Sinon → Afficher la première couleur active
```

## ✅ Checklist d'Implémentation Backend

- [ ] Ajouter la colonne `default_color_id` à la table `vendor_products`
- [ ] Mettre à jour le DTO `VendorPublishDto` avec le champ `defaultColorId`
- [ ] Implémenter la validation du `defaultColorId`
- [ ] Modifier le service de création pour sauvegarder `defaultColorId`
- [ ] Modifier le service de mise à jour pour supporter `defaultColorId`
- [ ] Inclure `defaultColorId` dans les réponses API GET
- [ ] Tester avec Postman/Insomnia
- [ ] Migration optionnelle des données existantes
- [ ] Documentation API mise à jour

## 🧪 Tests Recommandés

### Test 1: Création avec couleur par défaut valide
```http
POST /vendor/products
{
  "selectedColors": [
    { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
    { "id": 2, "name": "Noir", "colorCode": "#000000" }
  ],
  "defaultColorId": 2
}
```
**Résultat attendu:** ✅ Produit créé avec defaultColorId = 2

### Test 2: Création avec couleur par défaut invalide
```http
POST /vendor/products
{
  "selectedColors": [
    { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
    { "id": 2, "name": "Noir", "colorCode": "#000000" }
  ],
  "defaultColorId": 99
}
```
**Résultat attendu:** ❌ Erreur 400 - "La couleur par défaut doit faire partie des couleurs sélectionnées"

### Test 3: Création sans couleur par défaut
```http
POST /vendor/products
{
  "selectedColors": [
    { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" }
  ]
}
```
**Résultat attendu:** ✅ Produit créé avec defaultColorId = null

### Test 4: Récupération produit public
```http
GET /public/vendor-products/123
```
**Résultat attendu:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "defaultColorId": 2,
    "colorVariations": [...]
  }
}
```

## 📝 Notes Importantes

1. **Compatibilité Ascendante**: Les produits existants sans `defaultColorId` continuent de fonctionner (le frontend utilise la première couleur)

2. **Validation Stricte**: La couleur par défaut DOIT être dans les couleurs sélectionnées

3. **Optionnel**: Le champ est optionnel - les vendeurs peuvent ne pas définir de couleur par défaut

4. **Frontend Gère les Fallbacks**: Si `defaultColorId` est null ou invalide, le frontend utilise des valeurs par défaut intelligentes

## 🔗 Fichiers Frontend Modifiés

- `/src/pages/SellDesignPage.tsx` - État defaultColorIds et UI
- `/src/hooks/useVendorPublish.ts` - Interface et payload avec defaultColorId
- `/src/components/FeaturedSlider.tsx` - Affichage avec couleur par défaut (déjà fonctionnel)

## 🚀 Impact Utilisateur

- **Vendeurs**: Peuvent contrôler la couleur affichée en premier aux clients
- **Clients**: Voient immédiatement le produit dans la meilleure couleur selon le vendeur
- **Amélioration UX**: Les produits sont plus attractifs dès le premier affichage
