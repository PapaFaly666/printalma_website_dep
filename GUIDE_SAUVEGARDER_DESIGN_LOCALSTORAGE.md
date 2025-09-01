# 📚 Guide - Sauvegarder les designs depuis localStorage

> **Nouvelle fonctionnalité** : bouton "Créer en attente" dans `/vendeur/sell-design` qui sauvegarde les données de positionnement et transformations du localStorage vers la base de données.

---

## 🎯 Objectif

Permettre aux vendeurs de sauvegarder leur travail de positionnement de design **en cours** sans publier le produit immédiatement. Les données stockées temporairement dans le localStorage sont persistées dans la base de données pour une récupération ultérieure.

---

## 🔧 Fonctionnalités ajoutées

### 1. Bouton "Créer en attente"
- **Emplacement** : Étape "Finalisation" de `/vendeur/sell-design`
- **Action** : Sauvegarde en brouillon (statut `DRAFT`)
- **Données sauvegardées** : Positionnement et transformations depuis localStorage

### 2. Persistance des données
- **Source** : localStorage avec clé `design-position-${productId}-${designUrl}`
- **Destination** : Tables `VendorDesignTransform` et `ProductDesignPosition`
- **Statut** : Produit créé avec statut `DRAFT`

---

## 📋 Flux de fonctionnement

### Étapes du processus :

1. **Sélection produit + design** (étape 1)
2. **Positionnement interactif** (étape 2)
   - `InteractiveDesignPositioner` sauvegarde en localStorage
   - Clé : `design-position-${productId}-${designUrl}`
3. **Finalisation** (étape 3)
   - **Option A** : "Créer en attente" → Sauvegarde en DRAFT
   - **Option B** : "Créer le produit" → Publication normale

### Données sauvegardées :
```json
{
  "positionX": 0.3,
  "positionY": 0.4,
  "scale": 1.2,
  "rotation": 15
}
```

---

## 🛠️ Implémentation technique

### 1. Fonction `handleSaveDraft()` ajoutée

```typescript
const handleSaveDraft = async () => {
  // 1. Récupérer données localStorage
  const storageKey = `design-position-${selectedProduct.id}-${selectedDesign.imageUrl}`;
  const savedTransforms = localStorage.getItem(storageKey);
  
  // 2. Créer le produit vendor (statut DRAFT)
  const vendorProductData = {
    baseProductId: selectedProduct.id,
    forcedStatus: 'DRAFT',
    designPosition: localStorageTransforms,
    bypassValidation: true
  };
  
  // 3. Sauvegarder transformations (VendorDesignTransform)
  await saveDesignTransforms(transformsPayload);
  
  // 4. Sauvegarder position (ProductDesignPosition)
  await vendorProductService.saveDesignPosition(vendorProductId, designId, positionPayload);
}
```

### 2. APIs utilisées

| API | Endpoint | Données |
|-----|----------|---------|
| **Création produit** | `POST /vendor/products` | Produit avec statut DRAFT |
| **Transformations** | `POST /vendor/design-transforms/save` | VendorDesignTransform |
| **Position** | `POST /vendor/design-position` | ProductDesignPosition |

---

## 🗄️ Structure des données

### localStorage → Base de données

```mermaid
graph LR
    A[localStorage] --> B[handleSaveDraft()]
    B --> C[VendorProduct DRAFT]
    B --> D[VendorDesignTransform]
    B --> E[ProductDesignPosition]
```

### Mapping des données :

| localStorage | VendorDesignTransform | ProductDesignPosition |
|-------------|----------------------|----------------------|
| `positionX` | `transforms.positioning.x` | `position.x` |
| `positionY` | `transforms.positioning.y` | `position.y` |
| `scale` | `transforms.positioning.scale` | `position.scale` |
| `rotation` | `transforms.positioning.rotation` | `position.rotation` |

---

## 🧪 Test et validation

### Fichier de test : `test-sell-design-save-draft.html`

**Fonctionnalités testées :**
- Simulation des données localStorage
- Test de la sauvegarde en brouillon
- Vérification des APIs (transformations, position, création produit)
- Interface de test interactive

**Utilisation :**
```bash
# Ouvrir dans le navigateur
open test-sell-design-save-draft.html
```

---

## 🔄 Avantages de cette approche

### 1. **Sauvegarde incrémentale**
- Travail préservé en cas de problème
- Possibilité de reprendre plus tard
- Pas de perte de données

### 2. **Flexibilité**
- Brouillon modifiable
- Publication différée
- Validation optionnelle

### 3. **Cohérence des données**
- Synchronisation localStorage ↔ BDD
- Respect des contraintes de base
- Traçabilité complète

---

## 📝 Interface utilisateur

### Boutons dans l'étape "Finalisation" :

```jsx
<div className="flex items-center gap-2">
  <Button variant="outline" onClick={handleSaveDraft}>
    <Save className="h-4 w-4 mr-2" />
    Créer en attente
  </Button>
  <Button onClick={handleSaveProduct}>
    <Check className="h-4 w-4 mr-2" />
    Créer le produit
  </Button>
</div>
```

### États d'interaction :
- **Sauvegarde en cours** : `isSaving = true`
- **Succès** : Toast "Produit sauvegardé en brouillon !"
- **Erreur** : Toast avec message d'erreur
- **Redirection** : Vers `/vendeur/products`

---

## 🚀 Utilisation pratique

### Scénario d'usage :

1. **Vendeur** sélectionne un produit et un design
2. **Positionnement** : Ajuste position, échelle, rotation
3. **Sauvegarde temporaire** : Données en localStorage
4. **Interruption** : Vendeur ferme le navigateur
5. **Reprise** : Données restaurées depuis localStorage
6. **Finalisation** : Clic sur "Créer en attente"
7. **Résultat** : Produit en brouillon avec données persistées

### Récupération ultérieure :
- Produit visible dans `/vendeur/products` avec statut DRAFT
- Possibilité de modifier et publier plus tard
- Transformations et positions préservées

---

## 🛡️ Sécurité et validation

### Contrôles implémentés :
- **Vérification propriétaire** : `vendorProduct.vendorId === req.user.id`
- **Validation design** : `design.vendorId === req.user.id`
- **Transactions** : Atomicité des opérations multiples
- **Bypass validation** : `bypassValidation: true` pour les noms auto-générés

### Gestion d'erreurs :
```typescript
try {
  await saveDesignTransforms(transformsPayload);
  await vendorProductService.saveDesignPosition(vendorProductId, designId, positionPayload);
} catch (error) {
  console.error('Erreur lors de la sauvegarde:', error);
  toast.error('Erreur lors de la sauvegarde du brouillon');
}
```

---

## 🔧 Maintenance et debug

### Logs utiles :
```javascript
console.log('🚀 Données localStorage:', localStorageTransforms);
console.log('🏭 Payload création produit:', vendorProductData);
console.log('🔄 Payload transformations:', transformsPayload);
console.log('📍 Payload position:', positionPayload);
```

### Vérification en base :
```sql
-- Vérifier les transformations sauvegardées
SELECT * FROM vendor_design_transform WHERE vendor_product_id = ?;

-- Vérifier les positions sauvegardées
SELECT * FROM product_design_position WHERE vendor_product_id = ?;

-- Vérifier les produits en brouillon
SELECT * FROM vendor_products WHERE status = 'DRAFT';
```

---

## 🎉 Résumé

Cette fonctionnalité permet une **sauvegarde fluide** du travail de positionnement design avec :
- ✅ Persistance des données localStorage
- ✅ Création de produits en brouillon
- ✅ Synchronisation avec les tables de transformation
- ✅ Interface utilisateur intuitive
- ✅ Gestion d'erreurs robuste

Le vendeur peut maintenant **travailler sereinement** sans craindre de perdre son travail de positionnement. 