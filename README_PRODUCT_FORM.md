# Interface d'Ajout de Produits - Documentation

## 🎯 Vue d'ensemble

Cette interface moderne permet aux utilisateurs d'ajouter facilement de nouveaux produits avec toutes leurs caractéristiques, variations de couleur, images et zones de personnalisation. Elle utilise Fabric.js pour la délimitation interactive et est construite avec React, TypeScript, Tailwind CSS et shadcn/ui.

## ✨ Fonctionnalités principales

### 📝 Formulaire principal
- **Informations de base** : nom, prix, stock, statut (publié/brouillon), description
- **Validation en temps réel** avec messages d'erreur
- **Indicateur de progression** visuel
- **Statistiques du formulaire** en temps réel

### 🏷️ Gestion des caractéristiques
- **Catégories dynamiques** avec suggestions
- **Types de design** avec suggestions
- **Interface intuitive** pour ajouter/supprimer

### 🎨 Variations de couleur
- **Sélecteur de couleur** intégré
- **Upload d'images multiples** par couleur
- **Gestion des vues** (face, dos, zoom, etc.)
- **Interface glisser-déposer** pour les images

### 🎯 Délimitation interactive (Fabric.js)
- **Canvas interactif** pour tracer des zones
- **Outils de dessin** : sélection, dessin, déplacement
- **Redimensionnement et rotation** des zones
- **Prévisualisation en temps réel** du design
- **Export des aperçus** en PNG

## 🛠️ Architecture technique

### Structure des fichiers
```
src/
├── components/
│   └── product-form/
│       ├── ProductFormMain.tsx          # Composant principal
│       ├── ProductFormFields.tsx        # Champs du formulaire
│       ├── ProductCharacteristicsPanel.tsx # Catégories et designs
│       ├── ColorVariationsPanel.tsx     # Variations de couleur
│       ├── DelimitationCanvas.tsx       # Canvas Fabric.js
│       └── index.ts                     # Exports
├── hooks/
│   ├── useProductForm.ts               # Logique du formulaire
│   └── useFabricCanvas.ts              # Logique du canvas
├── types/
│   └── product.ts                      # Types TypeScript
└── pages/
    └── AddProductPage.tsx              # Page d'utilisation
```

### Dépendances principales
- **React 19** avec hooks
- **TypeScript** pour la sécurité des types
- **Fabric.js** pour le canvas interactif
- **Framer Motion** pour les animations
- **shadcn/ui** pour les composants UI
- **Tailwind CSS** pour le styling
- **Sonner** pour les notifications

## 🚀 Utilisation

### Import simple
```tsx
import { ProductFormMain } from './components/product-form';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <ProductFormMain />
      <Toaster position="top-right" richColors />
    </>
  );
}
```

### Utilisation avec routeur
```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AddProductPage from './pages/AddProductPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/add-product" element={<AddProductPage />} />
      </Routes>
    </Router>
  );
}
```

## 🎨 Personnalisation

### Modification des couleurs
Les couleurs peuvent être personnalisées via les variables CSS de Tailwind ou directement dans les composants.

### Ajout de validations
```tsx
// Dans useProductForm.ts
const validateForm = useCallback((): boolean => {
  const newErrors: ProductFormErrors = {};
  
  // Ajouter vos validations personnalisées
  if (formData.customField && formData.customField.length < 5) {
    newErrors.customField = 'Minimum 5 caractères requis';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}, [formData]);
```

### Extension des types
```tsx
// Dans types/product.ts
export interface ProductFormData {
  // ... champs existants
  customField?: string;
  additionalData?: any;
}
```

## 🔧 Hooks personnalisés

### useProductForm
Gère l'état complet du formulaire avec toutes les opérations CRUD sur les données du produit.

**Méthodes principales :**
- `updateFormData()` - Met à jour un champ
- `addColorVariation()` - Ajoute une nouvelle couleur
- `addImageToColor()` - Ajoute une image à une couleur
- `submitForm()` - Valide et soumet le formulaire

### useFabricCanvas
Gère le canvas Fabric.js pour la délimitation interactive.

**Méthodes principales :**
- `addDelimitation()` - Ajoute une zone de délimitation
- `enableDrawingMode()` - Active le mode dessin
- `centerDesignInDelimitation()` - Centre un design dans la zone
- `exportCanvas()` - Exporte le canvas en image

## 📱 Responsive Design

L'interface s'adapte automatiquement aux différentes tailles d'écran :
- **Mobile** : Layout vertical empilé
- **Tablet** : Layout hybride
- **Desktop** : Layout 2 colonnes (formulaire | canvas)

## 🎬 Animations

Utilise Framer Motion pour des animations fluides :
- **Entrée en fondu** pour les composants
- **Transitions de page** smooth
- **Feedback visuel** sur les interactions
- **Animations de liste** pour les éléments dynamiques

## 📊 Gestion d'état

L'état est géré localement avec useState et useCallback pour les performances :
- **État du formulaire** : données, erreurs, chargement
- **État du canvas** : délimitation, mode d'interaction
- **Sélections utilisateur** : image active, couleur active

## 🔄 Intégration API

Le hook `useProductForm` est prêt pour l'intégration API :

```tsx
const submitForm = useCallback(async () => {
  try {
    const formData = new FormData();
    
    // Ajouter les données du produit
    formData.append('name', formData.name);
    formData.append('price', formData.price.toString());
    // ... autres champs
    
    // Ajouter les images
    formData.colorVariations.forEach(color => {
      color.images.forEach(image => {
        if (image.file) {
          formData.append('images', image.file);
        }
      });
    });
    
    const response = await fetch('/api/products', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      toast.success('Produit créé avec succès !');
    }
  } catch (error) {
    toast.error('Erreur lors de la création');
  }
}, [formData]);
```

## 🎯 Exemples d'utilisation

### Création d'un produit T-shirt
1. Remplir le nom : "T-shirt Premium"
2. Définir le prix : 15000 FCFA
3. Ajouter la description
4. Créer les couleurs : Blanc, Noir, Rouge
5. Upload des images pour chaque couleur
6. Délimiter la zone de personnalisation sur chaque image
7. Sauvegarder

### Test de la délimitation
1. Ajouter une image
2. Sélectionner l'image dans le panneau droit
3. Cliquer sur "Délimiter" ou utiliser le mode dessin
4. Tracer un rectangle sur l'image
5. Ajuster la zone avec les poignées
6. Tester avec "Test design"

## 🔍 Debugging

Pour déboguer l'interface :
1. Ouvrir les outils de développement
2. Cliquer sur "Prévisualiser" pour voir les données dans la console
3. Vérifier les erreurs de validation en temps réel
4. Utiliser les badges de statut pour suivre la progression

## 🚀 Déploiement

L'interface est prête pour la production avec :
- **Build optimisé** avec Vite
- **Types TypeScript** pour la sécurité
- **Composants modulaires** pour la maintenance
- **Performance optimisée** avec React 19

## 📞 Support

Pour toute question ou problème :
1. Vérifier cette documentation
2. Consulter les types TypeScript
3. Examiner les exemples de code
4. Tester avec les données d'exemple 