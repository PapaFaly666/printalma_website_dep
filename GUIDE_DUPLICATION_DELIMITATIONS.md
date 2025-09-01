# 🎯 Guide d'utilisation : Duplication des délimitations

## 📖 Vue d'ensemble

La nouvelle fonctionnalité de **duplication des délimitations** permet aux administrateurs de copier facilement les zones de personnalisation d'une image couleur vers d'autres images couleurs, améliorant significativement l'expérience utilisateur lors de la création de produits.

## 🚀 Comment l'utiliser

### 1. **Accéder à la page d'ajout de produit**
- Naviguez vers `/admin/add-product` 
- Ou cliquez sur "Ajouter produit" dans le dashboard admin

### 2. **Créer les variations de couleur**
- Ajoutez au moins 2 variations de couleur avec leurs images respectives
- Définissez les zones de délimitation sur au moins une image

### 3. **Dupliquer les délimitations**

#### Étape 1 : Localiser le bouton
- Dans l'interface de délimitation d'une image qui contient des zones
- Recherchez le bouton **"Dupliquer zones"** avec l'icône de copie
- Ce bouton n'apparaît que si l'image contient au moins une délimitation

#### Étape 2 : Sélectionner la source
- Cliquez sur **"Dupliquer zones"**
- Une fenêtre modale s'ouvre avec :
  - **À gauche** : Image source avec ses délimitations
  - **À droite** : Toutes les autres images couleurs disponibles

#### Étape 3 : Choisir les délimitations à copier
- Cochez/décochez les zones à dupliquer
- Par défaut, toutes les zones sont sélectionnées
- Visualisez les zones directement sur l'image source

#### Étape 4 : Sélectionner les destinations
- Cliquez sur les images de destination où copier les zones
- Utilisez les boutons **"Tout sélectionner"** / **"Tout désélectionner"** pour un contrôle rapide
- Les images sont organisées par couleur pour une navigation facile

#### Étape 5 : Confirmer la duplication
- Vérifiez le récapitulatif en bas : `X délimitation(s) → Y image(s) sélectionnée(s)`
- Cliquez sur **"Dupliquer (X → Y)"**
- ✅ Success ! Les zones sont copiées avec des IDs uniques

## 🎨 Fonctionnalités avancées

### **Préservation des propriétés**
- ✅ Position et dimensions exactes
- ✅ Rotation si applicable
- ✅ Noms des zones (avec suffixe "copie")
- ✅ Tous les métadonnées debug

### **Gestion intelligente des conflits**
- Les nouvelles délimitations s'ajoutent aux existantes
- Pas d'écrasement des zones déjà présentes
- IDs uniques générés automatiquement

### **Interface utilisateur optimisée**
- Aperçu visuel des délimitations
- Badges informatifs (nombre de zones)
- Organisation par couleur
- Feedback en temps réel

## 💡 Conseils d'utilisation

### **Workflow recommandé**
1. **Définissez les zones sur la meilleure image** (la plus claire, la mieux exposée)
2. **Dupliquez vers toutes les couleurs similaires** en une seule fois
3. **Ajustez finement** les zones sur les images spécifiques si nécessaire

### **Cas d'usage typiques**
- **T-shirts** : Délimitez le logo sur une couleur, dupliquez sur toutes les autres
- **Mugs** : Définissez la zone d'impression principale puis copiez
- **Coques de téléphone** : Zone de design identique sur toutes les couleurs

### **Bonnes pratiques**
- ✅ Travaillez sur des images de dimensions similaires
- ✅ Dupliquez d'abord, ajustez ensuite
- ✅ Utilisez des noms descriptifs pour vos zones
- ✅ Sauvegardez régulièrement votre travail

## 🔧 Résolution de problèmes

### **Le bouton "Dupliquer zones" n'apparaît pas**
- ❌ Aucune délimitation définie sur cette image
- ✅ Créez d'abord une zone de délimitation

### **Erreur lors de la duplication**
- ❌ Aucune image de destination sélectionnée
- ❌ Aucune délimitation source sélectionnée
- ✅ Vérifiez vos sélections et réessayez

### **Les zones ne s'affichent pas correctement**
- ❌ Images de dimensions très différentes
- ✅ Utilisez des images de proportions similaires pour de meilleurs résultats

## 🎯 Avantages de cette fonctionnalité

### **Gain de temps**
- ⏱️ **Avant** : Redéfinir chaque zone manuellement (5-10 min par couleur)
- ⚡ **Après** : Duplication en masse en quelques clics (30 secondes)

### **Consistance**
- 🎯 Zones identiques sur toutes les couleurs
- 📏 Positionnement précis et uniforme
- 🔄 Facilité de maintenance

### **Productivité**
- 📈 Création de produits 5x plus rapide
- 🎨 Plus de temps pour le design et la qualité
- 💪 Moins d'erreurs de positionnement

---

**💡 Astuce** : Cette fonctionnalité est particulièrement utile pour les produits avec de nombreuses variations de couleur. Utilisez-la dès que vous avez plus de 2 couleurs à configurer ! 