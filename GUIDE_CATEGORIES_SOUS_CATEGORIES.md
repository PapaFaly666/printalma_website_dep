# 🏷️ Guide : Gestion des Catégories et Sous-catégories

## Vue d'ensemble

Le système de catégories hiérarchiques permet de classer les produits avec plus de précision, exactement comme demandé :

**Exemple :** Un T-shirt appartient à la catégorie **"Vêtements"** et à la sous-catégorie **"T-shirts"**

## Localisation dans l'interface

### Page d'ajout de produit : `/admin/add-product`

1. **Étape 1 :** Informations de base
2. **Étape 2 :** Caractéristiques → **C'est ici que se trouve le sélecteur de catégories**
3. Étape 3 : Images & Vues
4. Étape 4 : Zones de personnalisation
5. Étape 5 : Prévisualisation

## Structure hiérarchique complète

```
📦 Vêtements (ID: 1)
├── 👕 T-shirts (ID: 11)
├── 🧥 Sweats (ID: 12)
├── 👔 Polos (ID: 13)
├── 👔 Chemises (ID: 14)
└── 👖 Pantalons (ID: 15)

🎒 Accessoires (ID: 2)
├── 🧢 Casquettes (ID: 21)
├── 👜 Sacs (ID: 22)
├── ⌚ Montres (ID: 23)
└── 💍 Bijoux (ID: 24)

🏢 Articles de bureau (ID: 3)
├── ☕ Mugs (ID: 31)
├── ✏️ Stylos (ID: 32)
├── 📓 Carnets (ID: 33)
└── 💾 Clés USB (ID: 34)

🎨 Décoration (ID: 4)
├── 🛏️ Coussins (ID: 41)
├── 🖼️ Tableaux (ID: 42)
└── 🔖 Stickers (ID: 43)

⚡ Électronique (ID: 5)
└── (Pas de sous-catégories)
```

## Comment utiliser le sélecteur

### Étape par étape pour un T-shirt :

1. **Accédez à** `/admin/add-product`
2. **Remplissez l'étape 1** (nom, description, prix)
3. **Passez à l'étape 2** "Caractéristiques"
4. **Dans la section "Catégorie"** :
   - Cliquez sur le dropdown
   - Cliquez sur "👕 Vêtements" pour l'étendre
   - Sélectionnez "👕 T-shirts"
   - Résultat : **"Vêtements > T-shirts"**

### Données générées :
```javascript
{
  categoryId: 1,      // Vêtements
  subcategoryId: 11   // T-shirts
}
```

## Interface utilisateur

### Fonctionnalités du sélecteur :

✅ **Navigation hiérarchique** : Cliquez pour étendre/réduire les catégories  
✅ **Sélection visuelle** : Path complet affiché (ex: "Vêtements > T-shirts")  
✅ **Compteur** : Badge avec le nombre de sous-catégories  
✅ **Annulation** : Bouton × pour effacer la sélection  
✅ **Validation** : Champ requis avec indicateur visuel  

### États de sélection possibles :

1. **Catégorie + Sous-catégorie** : "Vêtements > T-shirts"
2. **Catégorie uniquement** : "Électronique" (pas de sous-catégories)
3. **Aucune sélection** : Placeholder "Sélectionner une catégorie"

## Exemples concrets

### Cas d'usage 1 : T-shirt personnalisable
```
✅ Sélection : Vêtements > T-shirts
📊 categoryId: 1, subcategoryId: 11
```

### Cas d'usage 2 : Mug personnalisé
```
✅ Sélection : Articles de bureau > Mugs  
📊 categoryId: 3, subcategoryId: 31
```

### Cas d'usage 3 : Produit électronique
```
✅ Sélection : Électronique
📊 categoryId: 5, subcategoryId: null
```

## Avantages du système

### 🎯 **Organisation claire**
- Catégories principales pour navigation rapide
- Sous-catégories pour spécification précise

### 📱 **UX moderne**
- Interface similaire aux applications mobiles populaires
- Navigation intuitive avec icônes et couleurs

### ⚡ **Performance**
- Recherche rapide par catégorie/sous-catégorie
- Filtrage efficace des produits

### 🔧 **Flexibilité**
- Support des catégories sans sous-catégories
- Extensible pour ajouter de nouvelles hiérarchies

## Validation et erreurs

### Champs requis :
- ✅ Une catégorie doit être sélectionnée
- ✅ Validation visuelle avec indicateur rouge (*)

### Messages d'erreur :
- ❌ "La catégorie est obligatoire" si non sélectionnée
- ✅ Sauvegarde uniquement si validation passée

## Test du système

### Page de test disponible :
📄 **`test-category-selector.html`** - Interface de démonstration interactive

### Commandes pour tester :
```bash
# Ouvrir la page de test
open test-category-selector.html

# Ou aller directement dans l'application
http://localhost:3000/admin/add-product
```

## Intégration technique

### Composant utilisé :
```tsx
<CategorySelector
  categories={availableCategories}
  selectedCategoryId={product.categoryId}
  selectedSubcategoryId={product.subcategoryId}
  onCategoryChange={handleCategoryChange}
  onSubcategoryChange={handleSubcategoryChange}
  required={true}
/>
```

### Handlers :
```typescript
const handleCategoryChange = (categoryId: number | null) => {
  setProduct(prev => ({ 
    ...prev, 
    categoryId: categoryId || 0,
    subcategoryId: 0  // Reset subcategory
  }));
};

const handleSubcategoryChange = (subcategoryId: number | null) => {
  setProduct(prev => ({ 
    ...prev, 
    subcategoryId: subcategoryId || 0
  }));
};
```

## Résolution des problèmes

### ❓ "Je ne vois pas le sélecteur de catégories"
- ✅ Vérifiez que vous êtes sur `/admin/add-product`
- ✅ Passez à l'étape 2 "Caractéristiques"
- ✅ Le sélecteur est dans le panneau de gauche

### ❓ "Les sous-catégories ne s'affichent pas"
- ✅ Cliquez d'abord sur la catégorie principale pour l'étendre
- ✅ Recherchez l'icône chevron (▶️/🔽) à côté de la catégorie

### ❓ "Ma sélection n'est pas sauvegardée"
- ✅ Vérifiez que vous avez cliqué sur la sous-catégorie, pas juste la catégorie
- ✅ Attendez l'affichage du path complet (ex: "Vêtements > T-shirts")

## Prochaines étapes

Une fois la catégorie sélectionnée, vous pouvez :

1. **Continuer avec les tailles** (S, M, L, XL)
2. **Choisir les couleurs** disponibles
3. **Ajouter des images** du produit
4. **Définir les zones** de personnalisation
5. **Publier le produit** dans le catalogue

---

**✨ Le système est maintenant opérationnel dans `/admin/add-product` !** 