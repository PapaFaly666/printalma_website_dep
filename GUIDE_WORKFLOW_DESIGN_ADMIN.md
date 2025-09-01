# 🎨 Guide - Workflow Design Admin

## 📋 **Vue d'ensemble**

Le workflow de design dans `/admin/ready-products/create` permet maintenant de :

1. **Uploader un design** (comme dans `/vendeur/sell-design`)
2. **Afficher les mockups avec le design incorporé** dans les délimitations
3. **Positionner et ajuster le design** sur chaque mockup

## 🔄 **Nouveau Workflow**

### **Étape 1 : Sélection du mode**
- **Mode "Créer un produit prêt"** : Workflow classique pour créer un produit depuis zéro
- **Mode "Appliquer un design"** : Nouveau workflow pour appliquer un design sur des mockups existants

### **Étape 2 : Upload du design**
1. Sélectionner un fichier image (PNG, JPG, SVG)
2. Configurer les informations du design :
   - **Nom du design**
   - **Description**
   - **Prix (en centimes)**
3. Confirmer la configuration

### **Étape 3 : Affichage des mockups avec design**
- Les mockups s'affichent avec le design incorporé dans leurs délimitations
- Utilisation du composant `ProductViewWithDesign` pour l'affichage interactif
- Chaque mockup montre le design positionné selon ses délimitations réelles

### **Étape 4 : Positionnement du design**
- Bouton "Positionner le design" sur chaque mockup
- Redirection vers `/admin/design-positioning` avec les données du mockup et du design
- Interface de positionnement interactive (drag, resize, rotate)

## 🎯 **Fonctionnalités clés**

### **Design Upload**
```typescript
// Gestion de l'upload de design
const handleDesignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files[0];
  setTempDesignFile(file);
  const objectUrl = URL.createObjectURL(file);
  setTempDesignUrl(objectUrl);
  setShowDesignPriceModal(true);
};
```

### **Configuration du design**
```typescript
// Modal de configuration
<Dialog open={showDesignPriceModal}>
  <DialogContent>
    <Input value={designName} onChange={...} />
    <Textarea value={designDescription} onChange={...} />
    <Input type="number" value={designPrice} onChange={...} />
  </DialogContent>
</Dialog>
```

### **Affichage avec délimitations**
```typescript
// Création de la vue avec délimitations
const createViewFromMockup = (mockup: Product) => {
  const firstImage = mockup.colorVariations?.[0]?.images?.[0];
  const delimitations = firstImage.delimitations || mockup.delimitations || [];
  
  return {
    id: firstImage.id,
    url: firstImage.url,
    delimitations: delimitations
  };
};
```

### **Intégration ProductViewWithDesign**
```typescript
<ProductViewWithDesign 
  view={view} 
  designUrl={designUrl} 
  productId={mockup.id}
  products={[mockup]}
  vendorDesigns={[]}
/>
```

## 🎨 **Interface utilisateur**

### **Mode Design - Étape 1**
- Interface d'upload avec aperçu du design
- Formulaire de configuration (nom, description, prix)
- Validation des champs

### **Mode Design - Étape 2**
- Affichage des mockups avec design incorporé
- Chaque mockup montre le design dans ses délimitations
- Bouton "Positionner le design" pour chaque mockup
- Informations sur les délimitations disponibles

### **Navigation**
- Bouton "Retour au choix de mode" pour changer de workflow
- Redirection vers la page de positionnement avec données complètes

## 🔧 **Composants utilisés**

### **MockupCardWithDesign**
- Affiche le mockup avec le design incorporé
- Utilise `ProductViewWithDesign` pour l'affichage interactif
- Gère les délimitations réelles du mockup
- Bouton de redirection vers le positionnement

### **ProductViewWithDesign**
- Composant réutilisé depuis `SellDesignPage.tsx`
- Gère le positionnement, redimensionnement et rotation
- Utilise les délimitations réelles du produit
- Interface interactive complète

## 📊 **États gérés**

### **Design Upload**
```typescript
const [designFile, setDesignFile] = useState<File | null>(null);
const [designUrl, setDesignUrl] = useState<string>('');
const [designName, setDesignName] = useState<string>('');
const [designDescription, setDesignDescription] = useState<string>('');
const [designPrice, setDesignPrice] = useState<number>(0);
const [showDesignPriceModal, setShowDesignPriceModal] = useState(false);
```

### **Mockups**
```typescript
const [mockups, setMockups] = useState<Product[]>([]);
const [loadingMockups, setLoadingMockups] = useState(false);
```

## 🚀 **Avantages du nouveau workflow**

1. **Cohérence** : Même logique que `/vendeur/sell-design`
2. **Prévisualisation** : Voir le design incorporé avant positionnement
3. **Délimitations réelles** : Utilise les vraies délimitations des mockups
4. **Interface moderne** : Design noir et blanc, composants réutilisables
5. **Workflow fluide** : Upload → Configuration → Prévisualisation → Positionnement

## 🔗 **Intégration avec le backend**

### **Chargement des mockups**
```typescript
const response = await fetch('/api/products?isReadyProduct=false');
const filteredMockups = mockupsData.filter(product => product.isReadyProduct === false);
```

### **Redirection vers positionnement**
```typescript
navigate('/admin/design-positioning', {
  state: {
    selectedMockups: [mockup],
    designUrl,
    designName,
    designDescription,
    designPrice
  }
});
```

## 🎯 **Prochaines étapes**

1. **Positionnement avancé** : Améliorer l'interface de positionnement
2. **Sauvegarde** : Sauvegarder les transformations appliquées
3. **Création de produit prêt** : Créer le produit final avec design appliqué
4. **Gestion des erreurs** : Améliorer la gestion des cas d'erreur

---

**💡 Note** : Ce workflow permet aux admins de créer des produits prêts en appliquant des designs sur des mockups existants, tout en conservant la flexibilité du workflow classique de création. 

## 📋 **Vue d'ensemble**

Le workflow de design dans `/admin/ready-products/create` permet maintenant de :

1. **Uploader un design** (comme dans `/vendeur/sell-design`)
2. **Afficher les mockups avec le design incorporé** dans les délimitations
3. **Positionner et ajuster le design** sur chaque mockup

## 🔄 **Nouveau Workflow**

### **Étape 1 : Sélection du mode**
- **Mode "Créer un produit prêt"** : Workflow classique pour créer un produit depuis zéro
- **Mode "Appliquer un design"** : Nouveau workflow pour appliquer un design sur des mockups existants

### **Étape 2 : Upload du design**
1. Sélectionner un fichier image (PNG, JPG, SVG)
2. Configurer les informations du design :
   - **Nom du design**
   - **Description**
   - **Prix (en centimes)**
3. Confirmer la configuration

### **Étape 3 : Affichage des mockups avec design**
- Les mockups s'affichent avec le design incorporé dans leurs délimitations
- Utilisation du composant `ProductViewWithDesign` pour l'affichage interactif
- Chaque mockup montre le design positionné selon ses délimitations réelles

### **Étape 4 : Positionnement du design**
- Bouton "Positionner le design" sur chaque mockup
- Redirection vers `/admin/design-positioning` avec les données du mockup et du design
- Interface de positionnement interactive (drag, resize, rotate)

## 🎯 **Fonctionnalités clés**

### **Design Upload**
```typescript
// Gestion de l'upload de design
const handleDesignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files[0];
  setTempDesignFile(file);
  const objectUrl = URL.createObjectURL(file);
  setTempDesignUrl(objectUrl);
  setShowDesignPriceModal(true);
};
```

### **Configuration du design**
```typescript
// Modal de configuration
<Dialog open={showDesignPriceModal}>
  <DialogContent>
    <Input value={designName} onChange={...} />
    <Textarea value={designDescription} onChange={...} />
    <Input type="number" value={designPrice} onChange={...} />
  </DialogContent>
</Dialog>
```

### **Affichage avec délimitations**
```typescript
// Création de la vue avec délimitations
const createViewFromMockup = (mockup: Product) => {
  const firstImage = mockup.colorVariations?.[0]?.images?.[0];
  const delimitations = firstImage.delimitations || mockup.delimitations || [];
  
  return {
    id: firstImage.id,
    url: firstImage.url,
    delimitations: delimitations
  };
};
```

### **Intégration ProductViewWithDesign**
```typescript
<ProductViewWithDesign 
  view={view} 
  designUrl={designUrl} 
  productId={mockup.id}
  products={[mockup]}
  vendorDesigns={[]}
/>
```

## 🎨 **Interface utilisateur**

### **Mode Design - Étape 1**
- Interface d'upload avec aperçu du design
- Formulaire de configuration (nom, description, prix)
- Validation des champs

### **Mode Design - Étape 2**
- Affichage des mockups avec design incorporé
- Chaque mockup montre le design dans ses délimitations
- Bouton "Positionner le design" pour chaque mockup
- Informations sur les délimitations disponibles

### **Navigation**
- Bouton "Retour au choix de mode" pour changer de workflow
- Redirection vers la page de positionnement avec données complètes

## 🔧 **Composants utilisés**

### **MockupCardWithDesign**
- Affiche le mockup avec le design incorporé
- Utilise `ProductViewWithDesign` pour l'affichage interactif
- Gère les délimitations réelles du mockup
- Bouton de redirection vers le positionnement

### **ProductViewWithDesign**
- Composant réutilisé depuis `SellDesignPage.tsx`
- Gère le positionnement, redimensionnement et rotation
- Utilise les délimitations réelles du produit
- Interface interactive complète

## 📊 **États gérés**

### **Design Upload**
```typescript
const [designFile, setDesignFile] = useState<File | null>(null);
const [designUrl, setDesignUrl] = useState<string>('');
const [designName, setDesignName] = useState<string>('');
const [designDescription, setDesignDescription] = useState<string>('');
const [designPrice, setDesignPrice] = useState<number>(0);
const [showDesignPriceModal, setShowDesignPriceModal] = useState(false);
```

### **Mockups**
```typescript
const [mockups, setMockups] = useState<Product[]>([]);
const [loadingMockups, setLoadingMockups] = useState(false);
```

## 🚀 **Avantages du nouveau workflow**

1. **Cohérence** : Même logique que `/vendeur/sell-design`
2. **Prévisualisation** : Voir le design incorporé avant positionnement
3. **Délimitations réelles** : Utilise les vraies délimitations des mockups
4. **Interface moderne** : Design noir et blanc, composants réutilisables
5. **Workflow fluide** : Upload → Configuration → Prévisualisation → Positionnement

## 🔗 **Intégration avec le backend**

### **Chargement des mockups**
```typescript
const response = await fetch('/api/products?isReadyProduct=false');
const filteredMockups = mockupsData.filter(product => product.isReadyProduct === false);
```

### **Redirection vers positionnement**
```typescript
navigate('/admin/design-positioning', {
  state: {
    selectedMockups: [mockup],
    designUrl,
    designName,
    designDescription,
    designPrice
  }
});
```

## 🎯 **Prochaines étapes**

1. **Positionnement avancé** : Améliorer l'interface de positionnement
2. **Sauvegarde** : Sauvegarder les transformations appliquées
3. **Création de produit prêt** : Créer le produit final avec design appliqué
4. **Gestion des erreurs** : Améliorer la gestion des cas d'erreur

---

**💡 Note** : Ce workflow permet aux admins de créer des produits prêts en appliquant des designs sur des mockups existants, tout en conservant la flexibilité du workflow classique de création. 
 
 
 
 
 