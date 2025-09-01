# 🔍 Guide Debug Authentification Vendeur

> **Problème :** Erreurs 403 "Accès refusé à ce produit" dans design-transforms  
> **Date :** 2025-01-02  
> **Status :** 🔧 EN COURS DE RESOLUTION

---

## 📋 Diagnostic Actuel

### ✅ Ce qui fonctionne
- ✅ Backend accessible sur `http://localhost:3004`
- ✅ Endpoints `/vendor/design-transforms` existent
- ✅ Frontend configuré pour connexion directe (sans proxy `/api`)

### ❌ Problème identifié
- ❌ **401 Unauthorized** - Pas de session vendeur authentifiée
- ❌ **403 Forbidden** - Produits IDs 10, 11, 12, 13... n'appartiennent pas au vendeur connecté

---

## 🔧 Solutions Étape par Étape

### 1. **Vérifier l'Authentification Vendeur**

#### A. Se connecter en tant que vendeur
1. Ouvrir le frontend : `http://localhost:5174`
2. Aller sur la page de connexion vendeur
3. Se connecter avec des identifiants vendeur valides
4. Vérifier que le cookie de session est bien défini

#### B. Tester l'authentification
```bash
# Exécuter le script de test
node test-vendor-auth-debug.cjs
```

**Résultat attendu :**
```
✅ Authentification OK: { id: X, email: "...", companyName: "..." }
✅ Produits trouvés: Y
📋 Premiers produits disponibles:
   - ID: 1, Nom: "Mon Produit"
   - ID: 2, Nom: "Autre Produit"
```

### 2. **Vérifier la Propriété des Produits**

#### Problème probable :
Les produits avec IDs **10, 11, 12, 13** n'appartiennent **PAS** au vendeur connecté.

#### Solutions possibles :

##### A. Utiliser les BONS produits du vendeur
```javascript
// Dans votre composant, utilisez les IDs de produits qui appartiennent au vendeur
const validProductIds = [1, 2, 3]; // IDs des produits du vendeur connecté
```

##### B. Créer des produits pour le vendeur connecté
```bash
# Script pour créer des produits de test
node create-vendor-test-products.cjs
```

##### C. Changer de vendeur connecté
Se connecter avec le vendeur qui possède les produits IDs 10, 11, 12, 13.

### 3. **Debug Frontend Amélioré**

#### Nouvelles fonctionnalités ajoutées :
- ✅ **Indicateur d'erreur auth** - Affiche clairement les problèmes d'authentification
- ✅ **Messages explicites** - Distingue 401 (non connecté) vs 403 (produit non autorisé)
- ✅ **Empêche modifications** - Bloque les transformations si erreur auth
- ✅ **Bouton réessayer** - Permet de retenter après connexion

#### Interface utilisateur mise à jour :
```
🔒 Erreur d'Authentification
Non authentifié - Veuillez vous connecter en tant que vendeur
[🔄 Réessayer]
```

ou

```
🔒 Erreur d'Authentification  
Accès refusé - Ce produit (ID: 12) n'appartient pas à votre compte vendeur
[🔄 Réessayer]
```

---

## 🧪 Tests de Validation

### Test 1 : Authentification
```bash
node test-vendor-auth-debug.cjs
```
**Attendu :** Informations vendeur + liste produits

### Test 2 : Design Transforms avec bon produit
```bash
# Utiliser un ID de produit qui appartient au vendeur
curl -X GET "http://localhost:3004/vendor/design-transforms/1?designUrl=test.png" \
  --cookie-jar cookies.txt
```

### Test 3 : Interface frontend
1. Ouvrir page avec composant `ProductImageWithDesign`
2. Vérifier l'indicateur de statut
3. Si erreur auth → Se connecter → Cliquer "Réessayer"

---

## 🔧 Actions Immédiates

### 1. **Connexion Vendeur**
- [ ] Se connecter sur le frontend en tant que vendeur
- [ ] Vérifier cookies de session dans DevTools

### 2. **Identifier Produits Valides**
- [ ] Exécuter `node test-vendor-auth-debug.cjs`
- [ ] Noter les IDs de produits retournés
- [ ] Utiliser ces IDs dans vos composants

### 3. **Tester avec Produits Corrects**
- [ ] Remplacer `productId={10}` par un ID valide
- [ ] Vérifier que l'erreur 403 disparaît
- [ ] Confirmer sauvegarde/chargement des transformations

---

## 🎯 Solution Définitive

### Backend : Améliorer les messages d'erreur
```typescript
// Dans le guard vendeur
if (vendorProduct.vendorId !== vendor.id) {
  throw new ForbiddenException(
    `Produit ${productId} n'appartient pas au vendeur ${vendor.id}. ` +
    `Produits disponibles: [${availableProductIds.join(', ')}]`
  );
}
```

### Frontend : Interface de sélection produit
```typescript
// Composant pour choisir parmi les produits du vendeur
const VendorProductSelector = () => {
  const { data: vendorProducts } = useVendorProducts();
  
  return (
    <select onChange={handleProductChange}>
      {vendorProducts?.map(product => (
        <option key={product.id} value={product.id}>
          {product.name} (ID: {product.id})
        </option>
      ))}
    </select>
  );
};
```

---

## 📞 Actions Suivantes

1. **Immédiat :** Se connecter en tant que vendeur + tester avec script
2. **Court terme :** Utiliser les bons IDs de produit dans les composants  
3. **Moyen terme :** Ajouter sélecteur de produit dans l'interface
4. **Long terme :** Améliorer messages d'erreur backend

---

**Résultat attendu :** ✅ Transformations design sauvegardées sans erreur 403 ! 