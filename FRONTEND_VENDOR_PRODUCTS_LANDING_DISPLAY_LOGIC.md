# 🏠 Frontend - Logique d'Affichage Produits Vendeurs Landing

## 🚀 **Vue d'ensemble**

Explication détaillée de quand et comment les produits vendeurs s'affichent dans la page d'accueil (landing page).

## 📊 **Conditions d'Affichage**

### **1. Conditions Obligatoires**
```typescript
// Les produits vendeurs s'affichent UNIQUEMENT si :
vendorProducts.length > 0  // Il y a des produits vendeurs disponibles
```

### **2. Critères de Récupération**
```typescript
// Les produits sont récupérés avec ces critères :
const response = await fetch('http://localhost:3004/public/vendor-products?limit=8&status=PUBLISHED');
```

**Critères appliqués :**
- ✅ **`limit=8`** : Maximum 8 produits affichés
- ✅ **`status=PUBLISHED`** : Seuls les produits publiés
- ✅ **Produits avec designs** : Priorité aux produits avec designs incorporés

## 🔄 **Processus de Chargement**

### **1. Récupération des Données**
```typescript
const fetchVendorProducts = async () => {
    try {
        setVendorProductsLoading(true);
        const response = await fetch('http://localhost:3004/public/vendor-products?limit=8&status=PUBLISHED');
        const data = await response.json();
        
        if (data.success && data.data?.products) {
            setVendorProducts(data.data.products);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des produits vendeurs:', error);
    } finally {
        setVendorProductsLoading(false);
    }
};
```

### **2. Timing d'Exécution**
```typescript
useEffect(() => {
    fetchVendorProducts();
}, []); // Exécuté au montage du composant
```

## 🎯 **Position dans le Landing**

### **1. Ordre d'Affichage**
```typescript
return (
    <div>
        <CarousselContainer />           // 1. Carrousel principal
        <CategoryTabs/>                  // 2. Onglets catégories
        
        {/* 3. Nouveaux produits */}
        {newProducts.length > 0 && (
            <FeaturedSlider items={newProducts} titreSlider='Nouveaux produits' />
        )}
        
        {/* 4. 🆕 PRODUITS VENDEURS - ICI */}
        {vendorProducts.length > 0 && (
            <VendorProductsSlider 
                products={vendorProducts.map(adaptVendorProductForSlider)} 
                title='Créations de nos vendeurs' 
            />
        )}
        
        {/* 5. Produits à la une */}
        {featuredProducts.length > 0 && (
            <FeaturedSlider items={featuredProducts} titreSlider='Produits à la une' />
        )}
        
        {/* 6. Meilleures ventes */}
        {topSellers.length > 0 && (
            <FeaturedSlider items={topSellers} titreSlider='Les meilleures ventes' />
        )}
    </div>
);
```

### **2. Priorité d'Affichage**
1. **Nouveaux produits** (première position)
2. **🆕 Produits vendeurs** (deuxième position - haute visibilité)
3. **Produits à la une** (troisième position)
4. **Meilleures ventes** (quatrième position)

## 🎨 **Adaptation des Données**

### **1. Fonction d'Adaptation**
```typescript
const adaptVendorProductForSlider = (vendorProduct: VendorProduct) => {
    // Formatage du prix en FCFA
    const formatPriceInFCFA = (price: number) => {
        return new Intl.NumberFormat('fr-SN', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0,
            currencyDisplay: 'symbol'
        }).format(price);
    };

    // Préparer les couleurs disponibles
    const availableColors = vendorProduct.adminProduct.colorVariations.map(colorVariation => ({
        id: colorVariation.id,
        name: colorVariation.name,
        hexCode: colorVariation.colorCode,
        imageUrl: colorVariation.images[0]?.url || '/placeholder-product.jpg'
    })) || [];

    return {
        id: vendorProduct.id,
        title: vendorProduct.vendorName,
        image: vendorProduct.designApplication.hasDesign ? 
               vendorProduct.design.imageUrl : 
               vendorProduct.adminProduct.colorVariations[0]?.images[0]?.url || '/placeholder-product.jpg',
        price: formatPriceInFCFA(vendorProduct.price),
        description: vendorProduct.adminProduct.description,
        stock: 999,
        category: vendorProduct.design.category,
        colors: availableColors,
        defaultColorId: availableColors.length > 0 ? availableColors[0].id : undefined,
        categorie: vendorProduct.design.category,
        meilleurVente: vendorProduct.bestSeller?.isBestSeller || false,
        // Informations supplémentaires
        vendor: vendorProduct.vendor,
        design: vendorProduct.design,
        designApplication: vendorProduct.designApplication,
        designPositions: vendorProduct.designPositions,
        adminProduct: vendorProduct.adminProduct,
        images: vendorProduct.images,
        selectedSizes: vendorProduct.selectedSizes,
        selectedColors: vendorProduct.selectedColors,
        designId: vendorProduct.designId
    };
};
```

### **2. Logique de Sélection d'Image**
```typescript
// Priorité pour l'image à afficher :
image: vendorProduct.designApplication.hasDesign ? 
       vendorProduct.design.imageUrl :  // 1. Image du design si disponible
       vendorProduct.adminProduct.colorVariations[0]?.images[0]?.url || '/placeholder-product.jpg'  // 2. Image du produit
```

## 📱 **Composant d'Affichage**

### **1. VendorProductsSlider**
```typescript
{vendorProducts.length > 0 && (
    <VendorProductsSlider 
        products={vendorProducts.map(adaptVendorProductForSlider)} 
        title='Créations de nos vendeurs' 
    />
)}
```

### **2. Caractéristiques du Slider**
- ✅ **Titre** : "Créations de nos vendeurs"
- ✅ **Design incorporé** : Affichage avec design positionné
- ✅ **Informations vendeur** : Nom, boutique, photo
- ✅ **Prix formaté** : En FCFA
- ✅ **Couleurs disponibles** : Switching entre couleurs
- ✅ **Navigation** : Vers page de détails

## 🛡️ **Gestion d'Erreurs**

### **1. État de Chargement**
```typescript
const [vendorProductsLoading, setVendorProductsLoading] = useState(false);
```

### **2. Gestion des Erreurs**
```typescript
try {
    // Récupération des données
} catch (error) {
    console.error('Erreur lors du chargement des produits vendeurs:', error);
} finally {
    setVendorProductsLoading(false);
}
```

### **3. Valeurs par Défaut**
```typescript
// Images de fallback
'/placeholder-product.jpg'  // Image produit par défaut
'/placeholder-avatar.jpg'   // Photo vendeur par défaut

// Valeurs par défaut
stock: 999,  // Stock par défaut
meilleurVente: false,  // Badge meilleure vente
```

## 🧪 **Scénarios de Test**

### **Test 1: Produits Disponibles**
1. **Condition** : `vendorProducts.length > 0`
2. **Résultat** : Slider affiché avec titre "Créations de nos vendeurs"
3. **Position** : Après "Nouveaux produits", avant "Produits à la une"

### **Test 2: Aucun Produit**
1. **Condition** : `vendorProducts.length === 0`
2. **Résultat** : Slider non affiché
3. **Comportement** : Page continue normalement

### **Test 3: Erreur API**
1. **Condition** : Erreur lors de la récupération
2. **Résultat** : Slider non affiché, erreur loggée
3. **Comportement** : Page continue normalement

### **Test 4: Produits avec Design**
1. **Condition** : `designApplication.hasDesign === true`
2. **Résultat** : Design incorporé visible
3. **Image** : `vendorProduct.design.imageUrl`

### **Test 5: Produits sans Design**
1. **Condition** : `designApplication.hasDesign === false`
2. **Résultat** : Image du produit affichée
3. **Image** : `vendorProduct.adminProduct.colorVariations[0]?.images[0]?.url`

## 📊 **Résumé des Conditions**

### **✅ Affichage Activé**
- Produits avec `status: 'PUBLISHED'`
- Maximum 8 produits
- Au moins 1 produit disponible
- API fonctionnelle

### **❌ Affichage Désactivé**
- Aucun produit disponible
- Erreur API
- Produits non publiés
- Données invalides

## 🎉 **Résultat Final**

Les produits vendeurs s'affichent dans le landing page **UNIQUEMENT** quand :
1. ✅ **Il y a des produits publiés** (`status: 'PUBLISHED'`)
2. ✅ **L'API répond correctement**
3. ✅ **Au moins 1 produit est disponible**
4. ✅ **Les données sont valides**

Le slider apparaît en **deuxième position** (après "Nouveaux produits") avec le titre **"Créations de nos vendeurs"** et affiche les produits avec leurs designs incorporés ! 🏠 