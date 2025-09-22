# 🔌 GUIDE INTÉGRATION - Wizard Backend

## 📋 Vue d'ensemble

Ce guide documente l'intégration complète entre le frontend wizard `/vendeur/create-product` et l'endpoint backend `/api/vendeur/create-product`. L'intégration inclut la gestion des images avec hiérarchie, les validations en temps réel, et une expérience utilisateur optimisée.

---

## ✅ INTÉGRATIONS RÉALISÉES

### **1. Hook `useWizardProductUpload`**
- **Fichier:** `src/hooks/useWizardProductUpload.ts`
- **Fonctionnalités:**
  - Validation frontend avant envoi
  - Upload avec FormData et hiérarchie d'images
  - Gestion des erreurs spécifiques
  - Progression d'upload simulée
  - Calculs automatiques avec `WizardCalculations`

### **2. Composant `ProductCreationWizard` mis à jour**
- **Fichier:** `src/components/vendor/ProductCreationWizard.tsx`
- **Améliorations:**
  - Intégration du nouveau hook
  - Boutons séparés "Brouillon" et "Publier"
  - Gestion d'erreurs détaillée
  - Preview amélioré avec hiérarchie d'images
  - Barre de progression en temps réel

### **3. Structure des données optimisée**
- **Interface `WizardProductData`:** Format adapté à l'endpoint backend
- **Interface `WizardImages`:** Hiérarchie baseImage + detailImages
- **Validation cohérente:** Frontend et backend alignés

---

## 🚀 FLUX DE DONNÉES

### **Frontend → Backend**

```typescript
// 1. Données du wizard préparées
const wizardData: WizardProductData = {
  selectedMockup: {
    id: formData.selectedMockup.id,
    name: formData.selectedMockup.name,
    price: formData.selectedMockup.price, // Prix de revient
    suggestedPrice: formData.selectedMockup.suggestedPrice
  },
  productName: formData.productName,
  productDescription: formData.productDescription,
  productPrice: formData.productPrice, // En FCFA, pas en centimes
  basePrice: formData.basePrice,
  vendorProfit: formData.vendorProfit,
  expectedRevenue: formData.expectedRevenue,
  isPriceCustomized: formData.isPriceCustomized,
  selectedTheme: formData.selectedTheme, // ID catégorie design
  selectedColors: formData.selectedColors,
  selectedSizes: formData.selectedSizes,
  postValidationAction: 'TO_DRAFT' | 'TO_PUBLISHED'
};

// 2. Images avec hiérarchie
const wizardImages: WizardImages = {
  baseImage: formData.productImages[0], // Image principale
  detailImages: formData.productImages.slice(1) // Images détail
};

// 3. FormData envoyée
const formData = new FormData();
formData.append('productData', JSON.stringify(wizardData));
formData.append('baseImage', wizardImages.baseImage);
wizardImages.detailImages.forEach((image, index) => {
  formData.append(`detailImage_${index + 1}`, image);
});
```

### **Backend → Frontend**

```typescript
// Réponse de succès
{
  "success": true,
  "message": "Produit créé avec succès via le wizard",
  "data": {
    "id": 456,
    "vendorId": 123,
    "productName": "Mon T-shirt Custom Design",
    "productPrice": 8500,
    "basePrice": 6000,
    "vendorProfit": 2500,
    "expectedRevenue": 1750,
    "platformCommission": 750,
    "status": "DRAFT" | "PUBLISHED",
    "validationStatus": "PENDING",
    "mockup": { ... },
    "theme": { ... },
    "selectedColors": [...],
    "selectedSizes": [...],
    "images": {
      "baseImage": { "url": "...", "isBase": true, "type": "base" },
      "detailImages": [{ "url": "...", "isBase": false, "type": "detail" }],
      "totalImages": 2
    },
    "wizard": {
      "createdViaWizard": true,
      "priceCustomized": true,
      "completedSteps": 5
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔧 VALIDATIONS IMPLÉMENTÉES

### **Frontend (Pré-validation)**
```typescript
const validateWizardData = (data: WizardProductData, images: WizardImages) => {
  const errors: Record<string, string> = {};

  // Image principale obligatoire
  if (!images.baseImage) {
    errors.baseImage = 'Image principale obligatoire';
  }

  // Marge minimum 10%
  const minimumPrice = data.basePrice * 1.1;
  if (data.productPrice < minimumPrice) {
    errors.productPrice = `Prix minimum: ${minimumPrice.toLocaleString()} FCFA (marge 10%)`;
  }

  // Cohérence des calculs
  const expectedProfit = data.productPrice - data.basePrice;
  const expectedRevenue = Math.round(expectedProfit * 0.7);

  if (Math.abs(data.vendorProfit - expectedProfit) > 1) {
    errors.vendorProfit = 'Erreur dans le calcul du bénéfice';
  }

  if (Math.abs(data.expectedRevenue - expectedRevenue) > 1) {
    errors.expectedRevenue = 'Erreur dans le calcul du revenu attendu';
  }

  // Sélections obligatoires
  if (!data.selectedColors.length) {
    errors.selectedColors = 'Au moins une couleur doit être sélectionnée';
  }

  if (!data.selectedSizes.length) {
    errors.selectedSizes = 'Au moins une taille doit être sélectionnée';
  }

  // Validation images
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (images.baseImage && images.baseImage.size > maxSize) {
    errors.baseImageSize = 'Image principale trop volumineuse (max 5MB)';
  }

  if (images.baseImage && !allowedTypes.includes(images.baseImage.type)) {
    errors.baseImageType = 'Type d\'image non autorisé (JPG, PNG, WebP uniquement)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### **Backend (Validation définitive)**
- Vérification mockup valide et disponible
- Validation marge 10% minimum
- Cohérence des calculs recalculés
- Validation couleurs/tailles appartiennent au mockup
- Validation catégorie design active
- Upload et validation des images

---

## 🎨 EXPÉRIENCE UTILISATEUR

### **Étape 5 - Preview amélioré**

1. **Résumé détaillé du produit**
   - Prix de vente et prix de revient
   - Calcul automatique du bénéfice et revenu
   - Affichage de la marge en pourcentage
   - Commission plateforme calculée

2. **Hiérarchie des images claire**
   - Image principale mise en évidence
   - Images de détail dans une grille
   - Labels "BASE" et numéros pour les détails

3. **Gestion d'erreurs avancée**
   - Validation en temps réel
   - Messages d'erreur spécifiques
   - Suggestions d'amélioration

4. **Progression d'upload**
   - Barre de progression visuelle
   - Messages d'état détaillés
   - Feedback immédiat

### **Actions finales**
- **Sauvegarder en brouillon:** Statut DRAFT
- **Publier directement:** Statut PUBLISHED

---

## 🔄 GESTION D'ERREURS

### **Erreurs communes et solutions**

| Erreur Backend | Message Frontend | Action |
|----------------|------------------|---------|
| `INSUFFICIENT_MARGIN` | "Prix trop bas - Une marge de 10% minimum est requise" | Augmenter le prix |
| `MISSING_BASE_IMAGE` | "Image principale obligatoire" | Ajouter une image |
| `INVALID_COLORS` | "Couleurs sélectionnées non disponibles pour ce mockup" | Modifier les couleurs |
| `INVALID_SIZES` | "Tailles sélectionnées non disponibles pour ce mockup" | Modifier les tailles |
| `MOCKUP_NOT_FOUND` | "Mockup sélectionné introuvable" | Retour étape 1 |
| `INVALID_THEME` | "Thème sélectionné invalide" | Retour étape 3 |

### **Exemple de gestion d'erreur**
```typescript
const handleSubmit = async (action: 'TO_DRAFT' | 'TO_PUBLISHED') => {
  try {
    const result = await uploadProduct(wizardData, wizardImages);
    if (result.success) {
      toast.success(`Produit ${action === 'TO_PUBLISHED' ? 'publié' : 'sauvegardé'} avec succès !`);
      navigate('/vendeur/products');
    }
  } catch (error: any) {
    // Gestion spécifique par type d'erreur
    if (error.message.includes('INSUFFICIENT_MARGIN')) {
      toast.error('Prix trop bas - Une marge de 10% minimum est requise');
    } else if (error.message.includes('MISSING_BASE_IMAGE')) {
      toast.error('Image principale obligatoire');
    } else if (error.message.includes('INVALID_COLORS')) {
      toast.error('Couleurs sélectionnées non disponibles pour ce mockup');
    } else {
      toast.error(error.message || 'Erreur lors de la création du produit');
    }
  }
};
```

---

## 🧪 TESTS RECOMMANDÉS

### **Tests unitaires**
```typescript
describe('useWizardProductUpload', () => {
  it('should validate wizard data correctly', () => {
    const validData: WizardProductData = {
      // ... données valides
    };
    const validImages: WizardImages = {
      baseImage: new File([''], 'test.jpg', { type: 'image/jpeg' }),
      detailImages: []
    };

    const { validateWizardData } = useWizardProductUpload();
    const result = validateWizardData(validData, validImages);

    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('should reject insufficient margin', () => {
    const invalidData: WizardProductData = {
      // ... données avec prix trop bas
      basePrice: 1000,
      productPrice: 1050 // Seulement 5% de marge
    };

    const result = validateWizardData(invalidData, validImages);
    expect(result.isValid).toBe(false);
    expect(result.errors.productPrice).toContain('Prix minimum');
  });
});
```

### **Tests d'intégration**
```typescript
describe('ProductCreationWizard Integration', () => {
  it('should create product successfully via wizard', async () => {
    // Mock API response
    const mockResponse = {
      success: true,
      data: { id: 123, status: 'DRAFT' }
    };

    fetchMock.post('/api/vendeur/create-product', mockResponse);

    // Simuler le workflow complet
    render(<ProductCreationWizard />);

    // Étape 1: Sélectionner mockup
    // Étape 2: Remplir informations
    // Étape 3: Sélectionner détails
    // Étape 4: Upload images
    // Étape 5: Valider et créer

    const createButton = screen.getByText('Sauvegarder en brouillon');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Produit sauvegardé avec succès !')).toBeInTheDocument();
    });
  });
});
```

---

## 📊 MÉTRIQUES ET MONITORING

### **Événements à tracker**
```typescript
// Début du wizard
analytics.track('wizard_product_creation_started', {
  vendorId: user.id,
  timestamp: new Date().toISOString()
});

// Completion d'étape
analytics.track('wizard_step_completed', {
  vendorId: user.id,
  step: currentStep,
  stepName: STEPS[currentStep - 1].title
});

// Erreur de validation
analytics.track('wizard_validation_error', {
  vendorId: user.id,
  step: currentStep,
  errorType: error.error,
  errorMessage: error.message
});

// Création réussie
analytics.track('wizard_product_created', {
  vendorId: user.id,
  productId: result.data.id,
  action: postValidationAction,
  marginPercent: (vendorProfit / basePrice) * 100,
  imageCount: images.detailImages.length + 1,
  completionTime: Date.now() - startTime
});
```

---

## 🔐 SÉCURITÉ

### **Validation côté frontend**
- Vérification des types d'images
- Limitation de la taille des fichiers
- Validation des calculs mathématiques

### **Sécurité backend**
- Authentification vendeur obligatoire
- Validation des droits sur le mockup
- Vérification de l'intégrité des données
- Limitation des uploads

---

## ✅ CHECKLIST FINAL

- [x] Hook `useWizardProductUpload` créé et testé
- [x] Interface `WizardProductData` définie
- [x] Interface `WizardImages` avec hiérarchie
- [x] Validation frontend implémentée
- [x] Gestion d'erreurs détaillée
- [x] Composant wizard mis à jour
- [x] Preview amélioré avec hiérarchie d'images
- [x] Boutons brouillon/publier séparés
- [x] Barre de progression d'upload
- [x] Messages d'état informatifs
- [x] Calculs automatiques intégrés
- [x] Documentation complète

---

## 🎯 RÉSULTAT

L'intégration est maintenant complète et fournit :

1. **Expérience utilisateur fluide** avec feedback en temps réel
2. **Validation robuste** côté frontend et backend
3. **Gestion d'erreurs sophistiquée** avec messages clairs
4. **Hiérarchie d'images** parfaitement implémentée
5. **Interface moderne** en noir et blanc
6. **Performance optimisée** avec validation pré-upload

Le workflow `/vendeur/create-product` est maintenant entièrement fonctionnel et intégré avec l'endpoint backend spécialisé.