# 🚀 Guide de Démarrage Rapide - Interface d'Ajout de Produits

## ✅ Installation et Démarrage

### 1. Démarrer le serveur
```bash
npm run dev
```

### 2. Accéder à l'interface
- **Via l'admin** : `http://localhost:5173/admin/add-product`
- **Interface standalone** : `http://localhost:5173/product-form-demo`

## 🎯 Test Rapide (5 minutes)

### Étape 1 : Informations de base
1. **Nom** : "T-shirt Premium Test"
2. **Prix** : 15000
3. **Stock** : 50
4. **Description** : "Un superbe t-shirt pour tester l'interface"
5. **Statut** : Activé (switch vers "Publié")

### Étape 2 : Caractéristiques
1. **Catégories** : Cliquer sur "Vêtements" et "Casual" dans les suggestions
2. **Designs** : Cliquer sur "Graphique" et "Moderne" dans les suggestions

### Étape 3 : Variations de couleur
1. Cliquer sur **"Ajouter couleur"**
2. **Nom** : "Rouge"
3. **Couleur** : Sélectionner rouge avec le sélecteur
4. **Images** : Cliquer sur "Ajouter images" et uploader une image de t-shirt

### Étape 4 : Délimitation (Canvas Fabric.js)
1. **Sélectionner l'image** uploadée dans le panneau droit
2. Cliquer sur **"Délimiter"** 
3. **Tracer un rectangle** sur la zone à personnaliser
4. **Redimensionner** avec les poignées bleues
5. Tester avec **"Test design"** pour voir un aperçu

### Étape 5 : Sauvegarder
1. Vérifier que la barre de progression indique **100%**
2. Cliquer sur **"Sauvegarder"**
3. ✅ Notification de succès !

## 🛠️ Fonctionnalités à Tester

### ✨ Interface Principale
- [ ] Validation en temps réel
- [ ] Barre de progression 
- [ ] Statistiques (couleurs, images)
- [ ] Switch publié/brouillon

### 🎨 Canvas Fabric.js
- [ ] Mode sélection (pointeur)
- [ ] Mode dessin (rectangle)
- [ ] Redimensionnement de la zone
- [ ] Rotation de la zone
- [ ] Test design automatique
- [ ] Export en PNG

### 🌈 Gestion des Couleurs
- [ ] Ajout de couleurs
- [ ] Sélecteur de couleur
- [ ] Upload multiple d'images
- [ ] Suppression d'images (hover)
- [ ] Animation des cartes

### 🏷️ Catégories et Designs
- [ ] Ajout manuel
- [ ] Suggestions cliquables
- [ ] Suppression par clic sur X
- [ ] Animations d'apparition

## 🎮 Raccourcis Clavier

- **Entrée** : Valider ajout catégorie/design
- **Échap** : Annuler mode dessin
- **Ctrl+S** : Sauvegarder (si formulaire valide)

## 🔍 Debug et Console

### Console Browser (F12)
- **Prévisualiser** : Affiche toutes les données du formulaire
- **Erreurs canvas** : Vérifiez la console pour les erreurs Fabric.js
- **Validation** : Messages d'erreur en temps réel

### Indicateurs Visuels
- 🟢 **Vert** : Champ valide/action réussie
- 🔴 **Rouge** : Erreur de validation
- 🔵 **Bleu** : État actif/sélectionné
- ⚪ **Gris** : État inactif/désactivé

## 📱 Test Responsive

### Desktop (>1200px)
- Layout 2 colonnes : Formulaire | Canvas
- Tous les composants visibles

### Tablet (768px - 1200px)
- Layout adaptatif
- Canvas en pleine largeur

### Mobile (<768px)
- Layout vertical empilé
- Canvas réduit mais fonctionnel

## 🚨 Résolution de Problèmes

### Canvas ne s'affiche pas
1. Vérifier que Fabric.js est installé : `npm list fabric`
2. Recharger la page (F5)
3. Vérifier la console pour erreurs

### Images ne s'uploadent pas
1. Vérifier que le fichier est une image (jpg, png, svg)
2. Taille max recommandée : 5MB
3. Vérifier les permissions du navigateur

### Délimitation ne fonctionne pas
1. S'assurer qu'une image est sélectionnée
2. Essayer le bouton "Délimiter" si le mode dessin ne marche pas
3. Vérifier que le canvas est initialisé (badge vert)

## 📊 Données d'Exemple

### Produit T-shirt Complet
```json
{
  "name": "T-shirt Premium Collection",
  "price": 15000,
  "stock": 100,
  "status": "published",
  "description": "T-shirt en coton bio, coupe moderne, parfait pour la personnalisation",
  "categories": ["Vêtements", "Casual", "Unisexe"],
  "designs": ["Graphique", "Logo", "Moderne"],
  "colorVariations": [
    {
      "name": "Blanc Classique",
      "colorCode": "#FFFFFF",
      "images": [/* avec délimitation */]
    },
    {
      "name": "Noir Élégant", 
      "colorCode": "#000000",
      "images": [/* avec délimitation */]
    }
  ]
}
```

## 🎉 Succès !

Si vous avez suivi toutes les étapes, vous devriez avoir :
- ✅ Un produit complet avec images et délimitations
- ✅ Une interface responsive et fluide
- ✅ Des animations et feedback utilisateur
- ✅ Un aperçu exportable en PNG

**Prêt pour la production !** 🚀 