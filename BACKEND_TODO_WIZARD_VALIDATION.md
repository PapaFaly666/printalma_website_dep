# 🚀 TODO Backend - Validation Produits WIZARD

## ⚡ Résumé Rapide

L'interface admin de validation des produits WIZARD est **prête côté frontend** et bascule automatiquement entre données mockées et vraies données backend.

**Route accessible :** `/admin/wizard-validation`

## 🎯 Endpoints à Implémenter

### 1. **GET /admin/pending-products** ⭐ PRIORITÉ HAUTE
```javascript
// Récupère les produits en attente avec distinction WIZARD/TRADITIONNEL
// Paramètres optionnels: ?productType=WIZARD&vendor=nom&status=PENDING
```

### 2. **PATCH /admin/validate-product/:id** ⭐ PRIORITÉ HAUTE
```javascript
// Valide un produit individuel
// Body: { approved: true/false, rejectionReason?: string }
```

### 3. **PATCH /admin/validate-products-batch** 🔹 PRIORITÉ NORMALE
```javascript
// Validation en lot
// Body: { productIds: [1,2,3], approved: true/false, rejectionReason?: string }
```

## 🔧 Logique Clé

### Détection WIZARD
```javascript
const isWizardProduct = !product.designId || product.designId === null || product.designId === 0;
```

### Enrichissement Données
```javascript
const enrichedProduct = {
  ...product,
  isWizardProduct: isWizardProduct,
  productType: isWizardProduct ? 'WIZARD' : 'TRADITIONAL',
  hasDesign: !isWizardProduct,
  adminProductName: product.baseProduct?.name
};
```

## 📄 Documentation Complète
Voir le fichier **`GUIDE_BACKEND_WIZARD_VALIDATION.md`** pour :
- Spécifications détaillées des endpoints
- Exemples de réponses JSON
- Modèles de base de données
- Tests recommandés
- Configuration sécurité

## ✅ Frontend Prêt
- ✅ Interface complète implémentée
- ✅ Types TypeScript définis
- ✅ Gestion automatique mock/real data
- ✅ Bannière dynamique de statut backend
- ✅ Tests possible immédiatement après implémentation

## 🔄 Test de Transition
1. Frontend détecte automatiquement si endpoints existent
2. Si oui → utilise vraies données
3. Si non → utilise données mockées
4. Bannière verte/bleue indique le mode actuel

**Aucune modification frontend requise après implémentation backend !**