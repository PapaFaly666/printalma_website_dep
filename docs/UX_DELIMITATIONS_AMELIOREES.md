# 🎨 Améliorations UX des Délimitations - Style Spreadshirt

## 📋 Vue d'ensemble

Ce document décrit les améliorations apportées à l'interface de personnalisation pour offrir une expérience utilisateur similaire à **Spreadshirt**, avec des délimitations discrètes et une interface épurée.

---

## ✨ Fonctionnalités implémentées

### 1. **Délimitations masquées par défaut**

Au chargement de la page de personnalisation (`/product/:id/customize`), les délimitations sont **invisibles** pour ne pas perturber la vue du produit.

**Avant** :
- ❌ Délimitations toujours visibles
- ❌ Rectangle bleu permanent
- ❌ Interface encombrée

**Après** :
- ✅ Produit affiché sans distractions
- ✅ Vue claire du produit
- ✅ Interface épurée

---

### 2. **Mode édition intelligent**

Les délimitations apparaissent **uniquement** lorsque l'utilisateur interagit avec les éléments de design.

**Déclencheurs du mode édition** :

1. ✏️ **Clic sur un élément** (texte ou image)
2. 🖱️ **Déplacement d'un élément**
3. ➕ **Ajout d'un texte**
4. 🖼️ **Ajout d'une image ou design**
5. 📝 **Sélection depuis la liste des éléments**

**Sortie du mode édition** :

- 🖱️ **Clic dans le vide** (zone du canvas sans élément)
- 👁️ Les délimitations disparaissent immédiatement
- 🌟 Le client peut voir son design sans obstruction

---

### 3. **Effet de flou sur les zones hors délimitation**

Pendant le mode édition, les zones **hors de la délimitation** sont légèrement assombries et floues pour mettre en évidence la zone personnalisable.

**Caractéristiques** :

- 🌫️ **Flou léger** (3px) sur les zones non personnalisables
- 🎨 **Semi-transparence** (15% d'opacité noire)
- ⚡ **Masque SVG** pour des performances optimales
- 🔄 **Transition fluide** lors de l'activation/désactivation

**Avantages** :

- ✅ Zone personnalisable clairement définie
- ✅ Pas de confusion sur où placer les éléments
- ✅ Esthétique professionnelle
- ✅ Expérience utilisateur améliorée

---

## 🔧 Implémentation technique

### État ajouté

```typescript
// Mode édition : afficher les délimitations uniquement quand on édite
const [isEditMode, setIsEditMode] = useState(false);
```

### Activation du mode édition

```typescript
// Lors du clic sur un élément
const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
  setSelectedElementId(elementId);
  setIsEditMode(true); // 🔥 Activer le mode édition
  setIsDragging(true);
  // ...
};

// Lors de l'ajout d'un texte
const addText = () => {
  // ...
  setElements([...elements, newText]);
  setSelectedElementId(newText.id);
  setIsEditMode(true); // 🔥 Activer le mode édition
};

// Lors de l'ajout d'une image
const addImage = (imageUrl: string, naturalWidth: number, naturalHeight: number) => {
  // ...
  setElements([...elements, newImage]);
  setSelectedElementId(newImage.id);
  setIsEditMode(true); // 🔥 Activer le mode édition
};
```

### Désactivation du mode édition

```typescript
// Clic dans le vide
<div
  ref={canvasRef}
  onClick={(e) => {
    if (e.target === e.currentTarget) {
      setSelectedElementId(null);
      setIsEditMode(false); // 🔥 Désactiver le mode édition
    }
  }}
>
```

### Affichage conditionnel des délimitations

```typescript
{/* Délimitation visible UNIQUEMENT en mode édition */}
{isEditMode && delimitation && canvasRef.current && (() => {
  // Calculs de position...
  return (
    <div
      className="absolute border-2 border-dashed pointer-events-none transition-all duration-300"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        backgroundColor: 'rgba(59, 130, 246, 0.05)'
      }}
    />
  );
})()}
```

### Masque de flou SVG

```typescript
{/* Masque de flou pour les zones hors délimitation - UNIQUEMENT en mode édition */}
{isEditMode && delimitation && canvasRef.current && (() => {
  const delimX = delimitation.x * scaleX;
  const delimY = delimitation.y * scaleY;
  const delimWidth = delimitation.width * scaleX;
  const delimHeight = delimitation.height * scaleY;

  return (
    <svg className="absolute inset-0 pointer-events-none">
      <defs>
        {/* Filtre de flou léger */}
        <filter id="blur-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>

        {/* Masque pour définir la zone nette (délimitation) */}
        <mask id="delimitation-mask">
          {/* Tout en blanc = flou */}
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {/* Zone de délimitation en noir = nette */}
          <rect x={delimX} y={delimY} width={delimWidth} height={delimHeight} fill="black" />
        </mask>
      </defs>

      {/* Rectangle semi-transparent avec flou, masqué par la délimitation */}
      <rect
        x="0" y="0" width="100%" height="100%"
        fill="rgba(0, 0, 0, 0.15)"
        filter="url(#blur-filter)"
        mask="url(#delimitation-mask)"
      />
    </svg>
  );
})()}
```

---

## 🎯 Comportement attendu

### Scénario 1 : Nouveau visiteur

1. 👤 L'utilisateur arrive sur `/product/123/customize`
2. 👁️ Il voit le produit **sans délimitations** (vue épurée)
3. 🖱️ Il clique sur "Ajouter du texte"
4. ✨ **Les délimitations apparaissent** avec un flou autour
5. ✏️ Il peut modifier le texte
6. 🖱️ Il clique dans le vide
7. 👁️ **Les délimitations disparaissent**, il voit son design final

### Scénario 2 : Design existant restauré

1. 👤 L'utilisateur revient sur un produit déjà personnalisé
2. 👁️ Il voit le produit avec ses éléments **mais sans délimitations**
3. 🖱️ Il clique sur un élément pour le modifier
4. ✨ **Les délimitations apparaissent**
5. ✏️ Il déplace l'élément
6. 🖱️ Il clique dans le vide
7. 👁️ **Les délimitations disparaissent**

### Scénario 3 : Ajout de design vendeur

1. 👤 L'utilisateur clique sur "Designs"
2. 🖼️ Il sélectionne un design dans la bibliothèque
3. ✨ Le design est ajouté au centre + **délimitations apparaissent**
4. 🖱️ Il peut le redimensionner/déplacer
5. 🖱️ Clic dans le vide
6. 👁️ **Les délimitations disparaissent**

---

## 🎨 Comparaison avant/après

### **AVANT** : Interface encombrée

```
┌─────────────────────────────┐
│                             │
│  ┌─────────────────────┐   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │ ← Délimitations toujours visibles
│  │ ▓  [Votre texte]  ▓ │   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
│  └─────────────────────┘   │
│                             │
│   👕 T-shirt                │
└─────────────────────────────┘
```

### **APRÈS** : Interface épurée

**Vue par défaut** (mode édition désactivé) :
```
┌─────────────────────────────┐
│                             │
│                             │
│      [Votre texte]          │ ← Pas de délimitations !
│                             │
│                             │
│   👕 T-shirt                │
└─────────────────────────────┘
```

**Pendant l'édition** (mode édition activé) :
```
┌─────────────────────────────┐
│ 🌫️🌫️🌫️🌫️🌫️🌫️🌫️🌫️🌫️🌫️  │ ← Flou léger
│ 🌫️┌─────────────────┐🌫️  │
│ 🌫️│                 │🌫️  │
│ 🌫️│  [Votre texte]  │🌫️  │ ← Zone claire
│ 🌫️│                 │🌫️  │
│ 🌫️└─────────────────┘🌫️  │
│ 🌫️🌫️🌫️ 👕 T-shirt 🌫️🌫️  │
└─────────────────────────────┘
```

---

## 📊 Avantages UX

| Aspect | Avant | Après |
|--------|-------|-------|
| **Première impression** | ⚠️ Interface technique | ✅ Vue produit claire |
| **Clarté** | ⚠️ Délimitations permanentes | ✅ Apparition contextuelle |
| **Focus** | ⚠️ Distraction visuelle | ✅ Zone d'édition évidente |
| **Professionnalisme** | ⚠️ Interface d'admin | ✅ Expérience client premium |
| **Aperçu final** | ⚠️ Toujours avec bordures | ✅ Vue réaliste du produit |

---

## 🚀 Améliorations futures possibles

### 1. **Animation d'apparition/disparition**

Ajouter une transition fade-in/fade-out pour les délimitations :

```css
.delimitation-overlay {
  transition: opacity 300ms ease-in-out;
}
```

### 2. **Indicateur visuel du mode édition**

Afficher un petit badge "Mode édition" en haut à droite :

```tsx
{isEditMode && (
  <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
    ✏️ Mode édition
  </div>
)}
```

### 3. **Raccourci clavier**

Permettre de basculer le mode édition avec `Échap` :

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelectedElementId(null);
      setIsEditMode(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### 4. **Bouton "Prévisualiser"**

Ajouter un bouton explicite pour basculer entre les modes :

```tsx
<Button
  variant={isEditMode ? 'default' : 'outline'}
  onClick={() => setIsEditMode(!isEditMode)}
>
  {isEditMode ? '👁️ Aperçu' : '✏️ Éditer'}
</Button>
```

### 5. **Effet de zoom sur la zone personnalisable**

Au passage en mode édition, zoomer légèrement sur la délimitation.

---

## 🔍 Debugging

### Vérifier si le mode édition fonctionne

Ouvrir la console du navigateur et taper :

```javascript
// Vérifier l'état du mode édition
console.log('Mode édition:', document.querySelector('[data-edit-mode]')?.dataset.editMode);
```

### Logs ajoutés

Les logs suivants sont disponibles dans la console :

- `✏️ Mode édition activé` - Lors de l'activation
- `👁️ Mode édition désactivé` - Lors de la désactivation
- `➕ Élément ajouté, mode édition: true` - Ajout d'élément

---

## 📁 Fichiers modifiés

- `src/components/ProductDesignEditor.tsx` - Composant principal d'édition
  - Ajout du state `isEditMode`
  - Modification des handlers de clic
  - Ajout du masque SVG de flou
  - Affichage conditionnel des délimitations

---

## ✅ Tests recommandés

### Test 1 : Délimitations masquées par défaut
1. Ouvrir `/product/{id}/customize`
2. ✅ Vérifier que les délimitations sont **invisibles**

### Test 2 : Apparition lors de l'ajout de texte
1. Cliquer sur "Texte"
2. ✅ Les délimitations **apparaissent**
3. ✅ Le flou est visible autour

### Test 3 : Disparition au clic dans le vide
1. Ajouter un élément
2. Cliquer dans une zone vide du canvas
3. ✅ Les délimitations **disparaissent**
4. ✅ Le flou disparaît

### Test 4 : Réapparition au clic sur élément
1. Cliquer dans le vide (délimitations invisibles)
2. Cliquer sur un élément existant
3. ✅ Les délimitations **réapparaissent**

### Test 5 : Restauration depuis localStorage
1. Créer un design avec plusieurs éléments
2. Actualiser la page (F5)
3. ✅ Les éléments sont restaurés
4. ✅ Les délimitations sont **invisibles** au départ
5. Cliquer sur un élément
6. ✅ Les délimitations **apparaissent**

---

## 🎯 Conclusion

Ces améliorations transforment l'interface de personnalisation en une expérience **professionnelle et épurée**, similaire aux leaders du marché comme **Spreadshirt**.

L'utilisateur bénéficie désormais de :
- ✅ Une **vue claire** du produit par défaut
- ✅ Des **délimitations contextuelles** qui n'apparaissent qu'au besoin
- ✅ Un **effet visuel** qui guide l'édition
- ✅ La possibilité de **prévisualiser** son design sans obstruction

**Résultat** : Une expérience utilisateur **intuitive, élégante et professionnelle** ! 🎉
