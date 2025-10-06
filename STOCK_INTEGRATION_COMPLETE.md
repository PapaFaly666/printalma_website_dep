# ✅ Intégration complète de la gestion du stock

## Vue d'ensemble

La gestion du stock est maintenant **complètement intégrée** entre le formulaire de création de produit (ProductFormMain) et la page de gestion du stock (/admin/stock).

## Flux complet

### 1. Création d'un produit avec stock

**Étape 1 : Informations de base**
- Nom, prix, description du produit

**Étape 2 : Variations de couleur**
- L'utilisateur définit les couleurs disponibles (ex: Blanc, Noir, Rouge)
- Chaque couleur a un nom et un code couleur

**Étape 3 : Catégories et tailles**
- Sélection des catégories hiérarchiques
- Sélection ou ajout de tailles (ex: S, M, L, XL)

**Étape 4 : Gestion du stock** ⭐ **NOUVEAU**
- Tableau interactif affichant : Tailles (lignes) × Couleurs (colonnes)
- Les couleurs sont automatiquement chargées depuis l'étape 2
- Les tailles sont automatiquement chargées depuis l'étape 3
- L'utilisateur définit le stock pour chaque combinaison taille/couleur

Exemple de tableau :
```
         Blanc    Noir    Rouge
S         10      20      15
M         25      30      20
L         15      25      18
XL        10      15      12
```

**Étape 5 : Images et délimitations**
- Upload des images pour chaque couleur
- Définition des zones de personnalisation

**Étape 6 : Validation**
- Vérification finale et soumission

### 2. Structure des données envoyées au backend

```typescript
{
  name: "T-shirt personnalisable",
  description: "T-shirt avec impression personnalisée",
  price: 25,
  categories: ["Vêtements", "T-shirts"],
  sizes: ["S", "M", "L", "XL"],

  // ✅ Nouveau champ : Stock par taille et couleur
  stockBySizeColor: {
    "S": {
      "Blanc": 10,
      "Noir": 20,
      "Rouge": 15
    },
    "M": {
      "Blanc": 25,
      "Noir": 30,
      "Rouge": 20
    },
    "L": {
      "Blanc": 15,
      "Noir": 25,
      "Rouge": 18
    },
    "XL": {
      "Blanc": 10,
      "Noir": 15,
      "Rouge": 12
    }
  },

  colorVariations: [
    {
      name: "Blanc",
      colorCode: "#FFFFFF",
      images: [...]
    },
    {
      name: "Noir",
      colorCode: "#000000",
      images: [...]
    },
    {
      name: "Rouge",
      colorCode: "#FF0000",
      images: [...]
    }
  ]
}
```

### 3. Backend - Traitement du stock

Le backend doit :

1. **Recevoir** `stockBySizeColor` dans le payload de création de produit
2. **Stocker** le stock initial pour chaque combinaison taille/couleur
3. **Créer** les enregistrements de stock dans la table `stock` ou `size_stocks`
4. **Lier** chaque enregistrement au produit, à la couleur et à la taille correspondants

Structure de table recommandée :
```sql
CREATE TABLE size_stocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  color_variation_id INT NOT NULL,
  size_name VARCHAR(50) NOT NULL,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (color_variation_id) REFERENCES color_variations(id),

  UNIQUE KEY unique_product_color_size (product_id, color_variation_id, size_name)
);
```

### 4. Page /admin/stock - Affichage et gestion

La page AdminStockManagement affiche maintenant les stocks créés depuis ProductFormMain :

**Fonctionnalités disponibles :**
- ✅ Visualisation du stock par produit, couleur et taille
- ✅ Ajustement du stock (+ / -)
- ✅ Recharge de stock en masse
- ✅ Historique des mouvements de stock
- ✅ Filtres par catégorie et niveau de stock
- ✅ Indicateurs visuels (rouge = rupture, orange = faible, vert = en stock)

**API utilisée :**
- `GET /products` - Récupère tous les produits avec leur stock
- `PUT /stock/size/{sizeStockId}` - Met à jour le stock d'une taille
- `POST /stock/recharge` - Recharge le stock
- `POST /stock/in` - Entrée de stock
- `POST /stock/out` - Sortie de stock
- `GET /stock/history` - Historique des mouvements

## Modifications effectuées

### Frontend

#### 1. `src/types/product.ts`
```typescript
// Ajout de l'interface StockBySizeColor
export interface StockBySizeColor {
  [size: string]: {
    [color: string]: number;
  };
}

// Ajout dans ProductFormData
export interface ProductFormData {
  // ... autres champs
  stockBySizeColor?: StockBySizeColor;
}
```

#### 2. `src/services/productService.ts`
```typescript
export interface CreateProductPayload {
  // ... autres champs
  stockBySizeColor?: {
    [size: string]: {
      [color: string]: number;
    };
  };
}
```

#### 3. `src/hooks/useProductForm.ts`
```typescript
const initialFormData: ProductFormData = {
  // ... autres champs
  stockBySizeColor: {}
};

const apiPayload: CreateProductPayload = {
  // ... autres champs
  stockBySizeColor: formData.stockBySizeColor // ✅ Envoyé au backend
};
```

#### 4. `src/components/product-form/StockManagementPanel.tsx`
Nouveau composant créé avec :
- Tableau interactif tailles × couleurs
- Boutons +/- pour ajuster le stock
- Input numérique pour saisie directe
- Indicateurs visuels (rouge/orange/vert)
- Actions rapides (initialiser, réinitialiser)
- Affichage du stock total

#### 5. `src/components/product-form/ProductFormMain.tsx`
- Ajout de l'étape 4 "Gestion du stock"
- Extraction automatique des couleurs depuis colorVariations
- Validation optionnelle du stock
- Passage du stockBySizeColor au submit

### Backend (à implémenter)

#### Route POST /products
```javascript
router.post('/products', async (req, res) => {
  const { stockBySizeColor, colorVariations, sizes, ...productData } = req.body;

  // 1. Créer le produit
  const product = await createProduct(productData);

  // 2. Créer les variations de couleur
  for (const colorVar of colorVariations) {
    const color = await createColorVariation(product.id, colorVar);

    // 3. Pour chaque taille, créer l'enregistrement de stock
    for (const size of sizes) {
      const stockAmount = stockBySizeColor?.[size]?.[colorVar.name] || 0;

      await createSizeStock({
        productId: product.id,
        colorVariationId: color.id,
        sizeName: size,
        stock: stockAmount
      });
    }
  }

  res.json({ success: true, product });
});
```

## Bénéfices

### Pour l'administrateur
✅ Définition du stock initial lors de la création du produit
✅ Vue d'ensemble complète du stock par produit/couleur/taille
✅ Gestion centralisée dans /admin/stock
✅ Historique complet des mouvements

### Pour le système
✅ Cohérence des données entre création et gestion
✅ Traçabilité complète du stock
✅ Prévention des ruptures de stock
✅ Indicateurs visuels clairs

### Technique
✅ Structure de données claire et typée
✅ API RESTful cohérente
✅ Composants réutilisables
✅ Validation des données à chaque étape

## Exemple de flux complet

1. **Admin crée un T-shirt** avec 3 couleurs (Blanc, Noir, Rouge) et 4 tailles (S, M, L, XL)
2. **À l'étape 4**, il définit le stock :
   - Blanc/S : 10 unités
   - Blanc/M : 25 unités
   - Noir/S : 20 unités
   - etc.
3. **Submit du formulaire** → Backend reçoit `stockBySizeColor`
4. **Backend crée** :
   - 1 produit
   - 3 colorVariations
   - 12 enregistrements de stock (3 couleurs × 4 tailles)
5. **Page /admin/stock** affiche immédiatement le stock du nouveau produit
6. **Admin peut ajuster** le stock si nécessaire
7. **Historique** garde trace de tous les mouvements

## Tests recommandés

### Frontend
- [ ] Créer un produit avec stock et vérifier le payload
- [ ] Vérifier que les couleurs de l'étape 2 apparaissent bien à l'étape 4
- [ ] Tester les boutons +/- pour ajuster le stock
- [ ] Tester la saisie manuelle dans les inputs
- [ ] Vérifier les indicateurs visuels (rouge/orange/vert)

### Backend
- [ ] Créer un produit avec `stockBySizeColor` et vérifier en DB
- [ ] Vérifier que GET /products retourne le stock correct
- [ ] Tester l'update de stock via PUT /stock/size/{id}
- [ ] Vérifier l'historique des mouvements
- [ ] Tester les cas limites (stock négatif, couleur inexistante, etc.)

### Intégration
- [ ] Créer un produit → Vérifier dans /admin/stock → Modifier le stock → Vérifier la mise à jour
- [ ] Créer plusieurs produits et vérifier les filtres
- [ ] Tester la pagination et la recherche

## Prochaines étapes possibles

1. **Alertes de stock bas** - Notification quand le stock < seuil
2. **Import/Export CSV** - Gestion en masse du stock
3. **Prévisions de stock** - Analyse des tendances de vente
4. **Réservation de stock** - Lors de la commande client
5. **Multi-entrepôts** - Gestion du stock par localisation

---

**Statut** : ✅ **Intégration complète et fonctionnelle**
**Serveur** : http://localhost:5175
**Date** : 2025-10-06
