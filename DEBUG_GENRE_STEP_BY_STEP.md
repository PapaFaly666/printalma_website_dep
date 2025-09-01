# 🔍 Guide de Débogage - Champ Genre Non Envoyé

## 🚨 Problème Identifié

Le champ `genre` n'apparaît pas dans les logs du backend, ce qui signifie qu'il n'est pas envoyé depuis le frontend.

## 🔧 Étapes de Débogage

### Étape 1: Vérifier l'Interface Utilisateur

1. **Aller sur `/admin/add-product`**
2. **Vérifier que le champ genre est visible** dans la première étape
3. **Vérifier que "Unisexe" est sélectionné par défaut**
4. **Tester la sélection d'un autre genre** (Homme, Femme, Bébé)

**Résultat attendu :** Le dropdown doit être visible avec "Unisexe" sélectionné.

### Étape 2: Vérifier les Logs de Mise à Jour

1. **Ouvrir la console du navigateur** (F12)
2. **Sélectionner un genre différent** dans le dropdown
3. **Vérifier les logs** dans la console

**Logs attendus :**
```javascript
🔄 updateFormData: genre = homme
```

**Si ce log n'apparaît pas :** Le problème vient de la fonction `updateFormData`

### Étape 3: Vérifier l'État du Formulaire

1. **Remplir le formulaire** (nom, description, prix)
2. **Ajouter une couleur et une image**
3. **Sélectionner des catégories**
4. **Aller à l'étape Validation**
5. **Vérifier que le genre apparaît dans le résumé**

**Résultat attendu :** Le badge de genre doit être visible dans la validation.

### Étape 4: Vérifier les Logs d'Envoi

1. **Créer le produit**
2. **Vérifier les logs** dans la console

**Logs attendus :**
```javascript
🔍 Données envoyées au backend: {
  name: "...",
  description: "...",
  price: 1000,
  stock: 0,
  status: "published",
  categories: [...],
  sizes: [...],
  isReadyProduct: true,
  genre: "unisexe", // ← CE CHAMP DOIT ÊTRE PRÉSENT
  colorVariations: [...]
}
🔍 Genre: unisexe
🔍 formData.genre: unisexe
🔍 formData complet: { ... genre: "unisexe" ... }
🔍 productDataToSend complet: { ... genre: "unisexe" ... }
```

### Étape 5: Vérifier le Backend

1. **Vérifier les logs du backend** après création du produit
2. **Vérifier que le champ genre est reçu**

**Logs backend attendus :**
```javascript
🔍 [DEBUG] Données reçues: {
  "name": "test 17",
  "description": "eeeeeeeeeeeeee",
  "price": 12000,
  "stock": 0,
  "status": "published",
  "categories": ["Vêtements > T-shirts"],
  "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  "genre": "unisexe", // ← CE CHAMP DOIT ÊTRE PRÉSENT
  "colorVariations": [...]
}
```

## 🐛 Problèmes Possibles et Solutions

### Problème 1: Champ genre non visible
**Symptôme :** Le dropdown genre n'apparaît pas dans le formulaire
**Solution :** Vérifier que le composant `ProductFormFields` inclut le champ genre

### Problème 2: Pas de logs updateFormData
**Symptôme :** Les logs `🔄 updateFormData: genre = ...` n'apparaissent pas
**Solution :** Vérifier que la fonction `onUpdate` est bien passée au composant

### Problème 3: Genre non inclus dans productDataToSend
**Symptôme :** Le champ genre n'apparaît pas dans les logs d'envoi
**Solution :** Vérifier que `formData.genre` a une valeur valide

### Problème 4: Backend ne reçoit pas le genre
**Symptôme :** Le backend ne reçoit pas le champ genre
**Solution :** Vérifier que le backend traite le champ genre

## 🔍 Tests de Diagnostic

### Test 1: Vérifier l'Initialisation
```javascript
// Dans la console du navigateur
console.log('Test d\'initialisation:');
console.log('formData.genre devrait être "unisexe"');
```

### Test 2: Vérifier la Mise à Jour
```javascript
// Sélectionner un genre différent et vérifier les logs
// Les logs "🔄 updateFormData: genre = ..." doivent apparaître
```

### Test 3: Vérifier l'Envoi
```javascript
// Créer un produit et vérifier les logs
// Les logs "🔍 Genre: ..." doivent apparaître
```

## 📊 Résultats Attendus

Après avoir suivi ce guide, vous devriez voir :

1. **Interface :** Champ genre visible avec "Unisexe" par défaut
2. **Logs frontend :** Logs de mise à jour et d'envoi avec genre
3. **Logs backend :** Champ genre reçu et traité
4. **Validation :** Badge de genre visible dans le résumé
5. **Prévisualisation :** Genre affiché dans la prévisualisation

## 🎯 Succès

Si tous les tests passent, le champ genre est correctement implémenté et fonctionnel !

## 🚨 Si le Problème Persiste

Si le champ genre n'est toujours pas envoyé :

1. **Vérifier que le composant GenreBadge est importé**
2. **Vérifier que les types sont corrects**
3. **Vérifier que la validation ne bloque pas l'envoi**
4. **Vérifier que le backend accepte le champ genre**

Contactez-moi avec les logs exacts pour un diagnostic plus précis. 