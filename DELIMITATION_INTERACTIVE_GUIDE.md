# Guide : Délimitation Interactive avec Fabric.js

## 🎯 Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de délimiter une zone rectangulaire sur une image avec un contrôle total sur la position et la taille. Elle est idéale pour les applications d'impression personnalisée ou de placement de designs.

## 🚀 Accès rapide

**URL de démonstration :** [http://localhost:5173/delimitation-demo](http://localhost:5173/delimitation-demo)

## ✨ Fonctionnalités

### ✅ Interactions utilisateur
- **Tracer** : Cliquez sur l'icône carré puis tracez une zone avec la souris
- **Déplacer** : Glissez la zone pour la repositionner
- **Redimensionner** : Utilisez les poignées pour ajuster la taille
- **Contraintes** : La zone reste toujours dans les limites de l'image

### ✅ Feedback temps réel
- Coordonnées X, Y affichées en permanence
- Dimensions largeur/hauteur mises à jour instantanément
- Calcul automatique de la superficie en px²
- Indicateur visuel des changements non sauvegardés

### ✅ Contrôle de sauvegarde
- **Aucune sauvegarde automatique** pendant les interactions
- Bouton **"Sauvegarder les changements"** apparaît seulement après modifications
- Le bouton disparaît après confirmation de sauvegarde
- **UX moderne** : interface propre sans boutons inutiles

## 🔧 Intégration technique

### Composant principal

```tsx
import { InteractiveDelimitationCanvas } from './components/product-form/InteractiveDelimitationCanvas';

interface DelimitationData {
  id: string;
  x: number;      // Position X en pixels réels de l'image
  y: number;      // Position Y en pixels réels de l'image  
  width: number;  // Largeur en pixels réels
  height: number; // Hauteur en pixels réels
  rotation: number;
}

<InteractiveDelimitationCanvas
  imageUrl="https://example.com/image.jpg"
  onDelimitationSave={(delimitation: DelimitationData) => {
    // Sauvegarder en base de données ou API
    console.log('Sauvegarde:', delimitation);
  }}
  onDelimitationChange={(delimitation: DelimitationData | null) => {
    // Changements en temps réel (optionnel)
    console.log('Changement:', delimitation);
  }}
  designUrl="https://example.com/design.jpg" // Optionnel
  className="w-full"
/>
```

### Coordonnées réelles vs Canvas

🔄 **Conversion automatique** : Le composant gère automatiquement la conversion entre :
- **Coordonnées canvas** : Position sur l'affichage Fabric.js
- **Coordonnées réelles** : Position sur l'image source originale

```typescript
// Exemple de coordonnées retournées
const delimitation = {
  id: "delim_1704123456789",
  x: 150,      // 150px du bord gauche de l'image originale
  y: 200,      // 200px du bord haut de l'image originale
  width: 300,  // 300px de largeur sur l'image originale
  height: 200, // 200px de hauteur sur l'image originale
  rotation: 0
};
```

## 🎨 Interface utilisateur

### Barre d'outils
- **Sélecteur** (🖱️) : Mode déplacement/redimensionnement  
- **Carré** (🔲) : Mode traçage de nouvelle zone
- **Poubelle** (🗑️) : Supprimer la zone actuelle

### Affichage des coordonnées
```
┌─────────────────┐
│ X: 150px        │
│ Y: 200px        │  
│ L: 300px        │
│ H: 200px        │
│─────────────────│
│ Aire: 60,000px² │
│ ● Non sauvegardé │
└─────────────────┘
```

### Bouton de sauvegarde
Le bouton **"Sauvegarder les changements"** apparaît uniquement quand :
- Une zone existe ET a été modifiée depuis la dernière sauvegarde
- Après un déplacement (`object:moving`) ou redimensionnement (`object:scaling`)
- Animation d'apparition fluide avec pulsation pour attirer l'attention

**Disparition du bouton :**
- Automatiquement après clic sur "Sauvegarder"
- Retour à l'état "propre" sans bouton visible
- Comportement inspiré de Canva/Figma

## 🛠️ Cas d'usage

### 1. UX moderne sans boutons parasites
```typescript
// Le bouton n'apparaît que quand nécessaire
const [hasModifications, setHasModifications] = useState(false);

// Écouter les modifications spécifiquement
rect.on('moving', () => setHasModifications(true));
rect.on('scaling', () => setHasModifications(true));

// Réinitialiser après sauvegarde
const handleSave = () => {
  onSave(delimitation);
  setHasModifications(false); // Bouton disparaît
};
```

### 2. Impression personnalisée
```typescript
const handleSaveDelimitation = async (delimitation: DelimitationData) => {
  // Envoyer à l'API de personnalisation
  await fetch('/api/products/delimitation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: 'prod_123',
      delimitation: delimitation
    })
  });
  
  // Le bouton disparaîtra automatiquement après cette fonction
};
```

### 3. Centrage automatique de design
```typescript
// Calculer la position centrée pour un design de 100x60px
const centerDesign = (delimitation: DelimitationData) => ({
  x: delimitation.x + (delimitation.width - 100) / 2,
  y: delimitation.y + (delimitation.height - 60) / 2
});
```

### 4. Validation de contraintes
```typescript
const validateDelimitation = (delimitation: DelimitationData) => {
  const minSize = 50; // 50px minimum
  const maxSize = 500; // 500px maximum
  
  return (
    delimitation.width >= minSize &&
    delimitation.height >= minSize &&
    delimitation.width <= maxSize &&
    delimitation.height <= maxSize
  );
};
```

## 🔍 Débogage

### Coordonnées incorrectes
Si les coordonnées ne correspondent pas à l'image réelle :
1. Vérifiez que `imageUrl` pointe vers l'image correcte
2. Assurez-vous que l'image est complètement chargée
3. Consultez la console pour les erreurs Fabric.js

### Problèmes de performance
```typescript
// Optimiser les updates fréquents
const handleDelimitationChange = useMemo(
  () => throttle((delimitation) => {
    // Logique de mise à jour
  }, 100),
  []
);
```

### Fabric.js canvas vide
```typescript
// Attendre le chargement complet
useEffect(() => {
  const timer = setTimeout(() => {
    if (fabricCanvasRef.current && imageUrl) {
      loadImage();
    }
  }, 100);
  
  return () => clearTimeout(timer);
}, [imageUrl]);
```

## 📋 Dépendances

```json
{
  "fabric": "^5.3.0",
  "@types/fabric": "^5.3.0",
  "framer-motion": "^10.16.0",
  "sonner": "^1.0.0"
}
```

## 🎯 Tests recommandés

1. **Test de tracé** : Tracer différentes tailles de zones
2. **Test de déplacement** : Vérifier les contraintes aux bords
3. **Test de redimensionnement** : Poignées fonctionnelles
4. **Test de sauvegarde** : Coordonnées correctes sauvegardées
5. **Test responsive** : Comportement sur mobile/tablette

---

## 🚀 Prêt à utiliser !

Votre implémentation de délimitation interactive est maintenant prête. Elle offre une expérience utilisateur moderne et fluide avec un contrôle total sur la sauvegarde des données.

**Point d'accès :** `/delimitation-demo` dans votre application React. 

## 🎯 Comportement détaillé

### États du bouton de sauvegarde

1. **Masqué par défaut** - Avant toute action
2. **Apparition** - Dès qu'une zone est tracée, déplacée ou redimensionnée
3. **Visible avec animation** - Pulsation pour attirer l'attention
1. **Masqué par défaut** - Aucune zone ou zone non modifiée
2. **Apparition** - Après déplacement ou redimensionnement
3. **Visible avec animation** - Pulsation pour attirer l'attention  
4. **Disparition** - Après clic sur sauvegarder

### Événements déclencheurs

```typescript
// Ces événements font apparaître le bouton
rect.on('moving', handleMovement);    // Déplacement
rect.on('scaling', handleScaling);    // Redimensionnement

// Ces événements NE font PAS apparaître le bouton
rect.on('selected', ...);             // Sélection
rect.on('deselected', ...);           // Désélection
```

### Flow UX optimal

```
1. Tracer zone → aucun bouton (zone juste créée)
2. Déplacer zone → bouton apparaît avec animation
3. Cliquer "Sauvegarder" → bouton disparaît
4. Redimensionner → bouton réapparaît
5. Sauvegarder → bouton disparaît à nouveau
``` 