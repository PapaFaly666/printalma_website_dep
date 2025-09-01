# 🧪 Guide de Test - Champ Genre dans Admin/Add-Product

## 📋 Instructions de Test

### 1. **Test de Base - Création d'un Produit**

1. **Aller sur la page admin/add-product**
   ```
   http://localhost:3000/admin/add-product
   ```

2. **Remplir les informations de base**
   - Nom: "Test Produit Genre"
   - Description: "Test du champ genre"
   - Prix: 1000
   - **Vérifier que le champ Genre est visible** avec les options :
     - Homme
     - Femme
     - Bébé
     - Unisexe (sélectionné par défaut)

3. **Continuer vers l'étape Couleurs**
   - Ajouter une variation de couleur
   - Uploader une image

4. **Continuer vers l'étape Catégories**
   - Sélectionner au moins une catégorie

5. **Aller à l'étape Validation**
   - **Vérifier que le genre apparaît dans le résumé**
   - **Vérifier que le badge de genre est affiché** (gris pour "Unisexe")

6. **Cliquer sur "Prévisualiser"**
   - **Vérifier que le genre apparaît dans la prévisualisation**
   - **Vérifier que le badge est visible**

7. **Créer le produit**
   - **Vérifier dans les logs de la console** que le genre est envoyé

### 2. **Test avec Différents Genres**

#### Test avec Genre "Homme"
1. Sélectionner "Homme" dans le dropdown
2. Vérifier que le badge devient **bleu**
3. Créer le produit et vérifier les logs

#### Test avec Genre "Femme"
1. Sélectionner "Femme" dans le dropdown
2. Vérifier que le badge devient **rose**
3. Créer le produit et vérifier les logs

#### Test avec Genre "Bébé"
1. Sélectionner "Bébé" dans le dropdown
2. Vérifier que le badge devient **orange**
3. Créer le produit et vérifier les logs

### 3. **Vérification des Logs**

Dans la console du navigateur, vous devriez voir :
```javascript
🔍 Données envoyées au backend: {
  name: "Test Produit Genre",
  description: "Test du champ genre",
  price: 1000,
  stock: 12,
  status: "published",
  categories: ["Vêtements > T-shirts"],
  sizes: ["S", "M", "L"],
  isReadyProduct: true,
  genre: "unisexe", // ← VÉRIFIER QUE CE CHAMP EST PRÉSENT
  colorVariations: [...]
}
🔍 Genre: unisexe
🔍 formData.genre: unisexe
```

### 4. **Test de Validation**

#### Test sans sélectionner de genre
1. Laisser le genre sur "Unisexe" (valeur par défaut)
2. Vérifier que la validation passe (pas d'erreur)
3. Créer le produit

#### Test avec genre sélectionné
1. Sélectionner un genre différent
2. Vérifier que la validation passe
3. Créer le produit

### 5. **Vérification Backend**

Dans les logs du backend, vous devriez voir :
```javascript
🔍 [DEBUG] Données reçues: {
  "name": "Test Produit Genre",
  "description": "Test du champ genre",
  "price": 1000,
  "stock": 12,
  "status": "published",
  "categories": ["Vêtements > T-shirts"],
  "sizes": ["S", "M", "L"],
  "genre": "unisexe", // ← VÉRIFIER QUE CE CHAMP EST PRÉSENT
  "colorVariations": [...]
}
```

## ✅ Checklist de Validation

- [ ] **Champ genre visible** dans le formulaire
- [ ] **Valeur par défaut "Unisexe"** sélectionnée
- [ ] **Dropdown fonctionnel** avec 4 options
- [ ] **Badge affiché** dans la validation (gris pour Unisexe)
- [ ] **Badge affiché** dans la prévisualisation
- [ ] **Logs frontend** montrent le genre envoyé
- [ ] **Logs backend** reçoivent le champ genre
- [ ] **Couleurs des badges** correctes selon le genre
- [ ] **Validation passe** avec genre par défaut
- [ ] **Validation passe** avec genre sélectionné

## 🐛 Problèmes Possibles

### Problème 1: Genre non envoyé
**Symptôme:** Le champ genre n'apparaît pas dans les logs backend
**Solution:** Vérifier que le champ est bien inclus dans `productDataToSend`

### Problème 2: Validation échoue
**Symptôme:** Erreur "Genre cible requis"
**Solution:** Vérifier que le genre est initialisé avec 'unisexe'

### Problème 3: Badge non affiché
**Symptôme:** Le badge de genre n'apparaît pas
**Solution:** Vérifier l'import du composant GenreBadge

### Problème 4: Couleurs incorrectes
**Symptôme:** Les badges n'ont pas les bonnes couleurs
**Solution:** Vérifier la fonction `getGenreConfig` dans GenreBadge

## 📊 Résultats Attendus

Après avoir suivi ce guide, vous devriez voir :

1. **Dans le formulaire :** Champ genre avec dropdown fonctionnel
2. **Dans la validation :** Résumé avec badge de genre coloré
3. **Dans la prévisualisation :** Section genre avec badge
4. **Dans les logs frontend :** Genre inclus dans les données
5. **Dans les logs backend :** Genre reçu et traité

## 🎯 Succès

Si tous les tests passent, le champ genre est correctement implémenté et fonctionnel ! 