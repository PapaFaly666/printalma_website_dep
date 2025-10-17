# Guide Frontend - Gestion des Variations et Sous-catégories

Ce guide explique comment fonctionne la gestion des variations et sous-catégories dans le composant `CategoryManagement.tsx` de PrintAlma.

## 📋 Vue d'ensemble

Le système de gestion de catégories supporte une structure hiérarchique à 3 niveaux :
- **Catégorie principale** (niveau 0)
- **Sous-catégorie** (niveau 1)
- **Variation** (niveau 2)

## 🎯 Fonctionnalités Principales

### 1. Gestion des Sous-catégories

#### État et Variables
```typescript
// État du modal d'ajout de sous-catégorie
const [showAddSubCategoryModal, setShowAddSubCategoryModal] = useState(false);

// Formulaire de sous-catégorie
const [newSubCategory, setNewSubCategory] = useState({
  name: '',
  description: ''
});
```

#### Fonctions Clés

**`handleAddSubCategory(parentCategory: Category)`**
- Déclenche l'ouverture du modal d'ajout
- Stocke la catégorie parente sélectionnée
- Réinitialise le formulaire

**`handleSaveSubCategory()`**
- Crée les données de la sous-catégorie avec la structure :
```typescript
{
  name: string,
  description: string,
  parentId: string,
  level: 1 // Niveau sous-catégorie
}
```

#### Implémentation Frontend Actuelle
- Mode temporaire : console.log() pour démonstration
- API non connectée (TODO dans le code)
- Réinitialisation complète après sauvegarde

### 2. Gestion des Variations

#### État et Variables
```typescript
// État du modal d'ajout de variations
const [showAddVariationModal, setShowAddVariationModal] = useState(false);

// Sous-catégorie parente sélectionnée
const [selectedParentSubCategory, setSelectedParentSubCategory] = useState<Category | null>(null);

// Liste des variations à ajouter (mode multiple)
const [variationsToAdd, setVariationsToAdd] = useState<string[]>([]);
const [currentVariationInput, setCurrentVariationInput] = useState('');
```

#### Fonctions Clés

**`handleAddVariation(parentSubCategory: Category)`**
- Ouvre le modal d'ajout de variations
- Définit la sous-catégorie parente
- Réinitialise la liste des variations

**`handleAddVariationToList()`**
- Ajoute une variation à la liste temporaire
- Vide le champ de saisie automatiquement

**`handleRemoveVariationFromList(index: number)`**
- Supprime une variation spécifique de la liste

**`handleSaveAllVariations()`**
- Crée toutes les variations en une seule fois
- Structure des données :
```typescript
{
  name: string,
  parentId: string,
  level: 2 // Niveau variation
}
```

**`handleVariationInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>)`**
- Gestion de la touche "Entrée" pour ajout rapide
- Permet un ajout rapide sans cliquer sur le bouton

## 🔧 Composants UI Utilisés

### Modal d'Ajout Sous-catégorie
- Position : Ligne 2040+ dans le fichier
- Champs : Nom (requis), Description (optionnel)
- Validation : Le nom est obligatoire pour activer le bouton

### Modal d'Ajout Variations
- Position : Ligne 2103+ dans le fichier
- Interface d'ajout multiple avec liste dynamique
- Support du raccourci clavier "Entrée"
- Affichage en temps réel du nombre de variations à ajouter

## 🎨 Interface Utilisateur

### CatégorieTree Component
Le composant `CategoryTree` (importé ligne 59) reçoit les props :
```typescript
onAddSubCategory={handleAddSubCategory}
onAddVariation={handleAddVariation}
```

### Boutons d'Action
- Icônes `PlusCircle` pour ajouter
- Boutons avec validation disabled state
- Feedback visuel immédiat

## 🔄 Flux de Données Actuel

### Sous-catégories
1. Clique sur "Ajouter sous-catégorie" → `handleAddSubCategory`
2. Saisie formulaire → `setNewSubCategory`
3. Validation → `handleSaveSubCategory`
4. **[TODO]** Appel API (non implémenté)
5. **[TODO]** Rechargement hiérarchie

### Variations
1. Clique sur "Ajouter variations" → `handleAddVariation`
2. Saisie multiple avec "Entrée" → `handleAddVariationToList`
3. Validation finale → `handleSaveAllVariations`
4. **[TODO]** Appel API en lot (non implémenté)
5. **[TODO]** Rechargement hiérarchie

## 🚀 Points d'Attention pour Développeurs

### Connexion Backend Requise
Les fonctions `handleSaveSubCategory` et `handleSaveAllVariations` contiennent des TODO :
- Appeler les services API appropriés
- Gérer les erreurs de validation
- Mettre à jour le contexte de catégories
- Afficher les notifications toast

### Gestion d'Erreurs
- Ajouter la validation des doublons
- Gérer les conflits de noms
- Valider les caractères spéciaux

### Optimisations Possibles
- Mode édition pour modifications
- Glisser-déposer pour réorganisation
- Import/export en masse
- Auto-complétion pour les variations courantes

## 📁 Fichiers Connexes

- `src/services/categoryService.ts` - Service de base
- `src/contexts/CategoryContext.tsx` - Gestion d'état globale
- `src/components/categories/CategoryTree.tsx` - Arborescence visuelle
- `src/types/category.types.ts` - Types TypeScript

## 🎯 Prochaines Étapes d'Implémentation

1. **Connexion API** : Remplacer les console.log par appels réels
2. **Validation** : Ajouter les règles de validation métier
3. **Feedback** : Intégrer les notifications toast
4. **Tests** : Créer les tests unitaires pour ces fonctionnalités
5. **Accessibilité** : Améliorer la navigation au clavier

---

*Ce guide sera mis à jour lors de l'implémentation complète des fonctionnalités backend.*