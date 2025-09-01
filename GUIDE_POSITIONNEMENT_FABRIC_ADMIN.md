# 🎨 Guide - Positionnement avec Fabric.js et Délimitations (Admin)

## 📋 **Nouvelle implémentation**

La page `/admin/ready-products/create` utilise maintenant **Fabric.js** avec des **délimitations** pour le positionnement des designs, identique à `SellDesignPage.tsx`.

## 🎯 **Fonctionnalités principales**

### **1. Fabric.js Canvas**
- **Canvas interactif** avec contrôles natifs
- **Objets sélectionnables** avec poignées de redimensionnement
- **Rotation fluide** avec poignée de rotation
- **Déplacement** par glisser-déposer

### **2. Délimitations visuelles**
- **Zones de positionnement** définies par des rectangles
- **Contraintes** pour garder le design dans les limites
- **Affichage visuel** avec bordures pointillées
- **Couleur bleue** pour identifier les zones

### **3. Contrôles avancés**
- **Redimensionnement** avec poignées aux coins
- **Rotation** avec poignée dédiée
- **Déplacement** libre dans les délimitations
- **Réinitialisation** en un clic

## 🔧 **Architecture technique**

### **1. Initialisation Fabric.js**
```typescript
const canvas = new fabric.Canvas(canvasRef.current, {
  selection: false,
  preserveObjectStacking: true
});

fabricCanvasRef.current = canvas;
```

### **2. Chargement du mockup**
```typescript
fabric.Image.fromURL(mockup.colorVariations?.[0]?.images?.[0]?.url || '', (img) => {
  img.set({
    left: 0,
    top: 0,
    selectable: false,
    evented: false
  });
  
  // Ajuster la taille et position
  const containerWidth = 800;
  const containerHeight = 600;
  // Calcul des dimensions...
});
```

### **3. Création des délimitations**
```typescript
const defaultDelimitations = [
  {
    id: 1,
    x: 50, // 50% du centre
    y: 50, // 50% du centre
    width: 30, // 30% de la largeur
    height: 30, // 30% de la hauteur
    coordinateType: 'PERCENTAGE'
  }
];

// Ajouter les rectangles visuels
defaultDelimitations.forEach((delim) => {
  const delimRect = new fabric.Rect({
    left: offsetX + (delim.x / 100) * dispW,
    top: offsetY + (delim.y / 100) * dispH,
    width: (delim.width / 100) * dispW,
    height: (delim.height / 100) * dispH,
    fill: 'rgba(0, 123, 255, 0.2)',
    stroke: '#007bff',
    strokeWidth: 2,
    strokeDashArray: [5, 5],
    selectable: false,
    evented: false
  });
  canvas.add(delimRect);
});
```

### **4. Chargement du design**
```typescript
fabric.Image.fromURL(designUrl, (designImg) => {
  const delim = defaultDelimitations[0];
  const pos = computePxPosition(delim, dispW, dispH, offsetX, offsetY);
  
  designImg.set({
    left: pos.left + pos.width / 2 - designImg.width! / 2,
    top: pos.top + pos.height / 2 - designImg.height! / 2,
    originX: 'center',
    originY: 'center',
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockUniScaling: false,
    cornerColor: '#007bff',
    cornerSize: 10,
    transparentCorners: false
  });
  
  canvas.add(designImg);
  canvas.setActiveObject(designImg);
});
```

## 🎨 **Interface utilisateur**

### **1. Canvas Fabric.js**
```typescript
<div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
  <canvas
    ref={canvasRef}
    className="w-full h-full"
  />
  
  {/* Instructions */}
  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
    <div className="flex items-center gap-2">
      <Square className="h-4 w-4" />
      <span>Zone de positionnement</span>
    </div>
    <div className="text-xs opacity-80 mt-1">
      Glissez, redimensionnez et faites pivoter le design
    </div>
  </div>
</div>
```

### **2. Contrôles en temps réel**
```typescript
<div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">
      Position: X: {transforms.x.toFixed(0)}, Y: {transforms.y.toFixed(0)}
    </span>
  </div>
  
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">
      Échelle: {transforms.scale.toFixed(2)}x
    </span>
  </div>
  
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">
      Rotation: {transforms.rotation.toFixed(0)}°
    </span>
  </div>
  
  <Button variant="outline" size="sm" onClick={handleReset}>
    <RotateCcw className="h-4 w-4 mr-2" />
    Réinitialiser
  </Button>
</div>
```

## 🔍 **Fonctionnalités avancées**

### **1. Calcul de position**
```typescript
const computePxPosition = (delim: any, dispW: number, dispH: number, offsetX: number, offsetY: number) => {
  return {
    left: offsetX + (delim.x / 100) * dispW,
    top: offsetY + (delim.y / 100) * dispH,
    width: (delim.width / 100) * dispW,
    height: (delim.height / 100) * dispH
  };
};
```

### **2. Événements de modification**
```typescript
designImg.on('modified', () => {
  const newTransforms = {
    x: designImg.left!,
    y: designImg.top!,
    scale: designImg.scaleX!,
    rotation: designImg.angle || 0
  };
  setTransforms(newTransforms);
});
```

### **3. Réinitialisation**
```typescript
const handleReset = useCallback(() => {
  if (designObject && fabricCanvasRef.current) {
    const delim = delimitations[0];
    const pos = computePxPosition(delim, containerSize.width, containerSize.height, 0, 0);
    
    designObject.set({
      left: pos.left + pos.width / 2,
      top: pos.top + pos.height / 2,
      scaleX: 1,
      scaleY: 1,
      angle: 0
    });
    
    fabricCanvasRef.current.renderAll();
    setTransforms({ x: designObject.left!, y: designObject.top!, scale: 1, rotation: 0 });
  }
}, [designObject, delimitations, containerSize]);
```

## 📊 **États gérés**

### **1. États Fabric.js**
```typescript
const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
const [designObject, setDesignObject] = useState<fabric.Object | null>(null);
const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
```

### **2. États de délimitations**
```typescript
const [delimitations, setDelimitations] = useState<any[]>([]);
```

### **3. États de transformation**
```typescript
const [transforms, setTransforms] = useState({
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0
});
```

## 🎯 **Avantages de Fabric.js**

### **1. Contrôles natifs**
- **Poignées de redimensionnement** automatiques
- **Poignée de rotation** intégrée
- **Déplacement fluide** par glisser-déposer
- **Sélection visuelle** claire

### **2. Performance**
- **Rendu optimisé** par le canvas
- **Événements natifs** du navigateur
- **Animations fluides** sans lag
- **Gestion mémoire** automatique

### **3. Flexibilité**
- **API complète** pour les manipulations
- **Événements personnalisables** 
- **Styles configurables** pour les contrôles
- **Intégration facile** avec React

## 🚀 **Améliorations futures**

1. **Multiples délimitations** pour différents types de produits
2. **Snap to grid** pour un alignement parfait
3. **Historique des actions** (Undo/Redo)
4. **Templates de positionnement** prédéfinis
5. **Validation automatique** des positions
6. **Export des configurations** de positionnement
7. **Zoom et pan** sur le canvas
8. **Layers** pour gérer plusieurs designs

## 🎨 **Cohérence avec SellDesignPage**

### **1. Même logique**
- **Fabric.js** comme moteur de rendu
- **Délimitations** pour les contraintes
- **Calcul de position** identique
- **Événements** similaires

### **2. Interface adaptée**
- **Modal** pour l'admin (vs page complète)
- **Contrôles simplifiés** mais complets
- **Prévisualisation** optimisée

### **3. Workflow optimisé**
- **Upload → Positionnement → Sauvegarde**
- **Étapes claires** et guidées
- **Feedback** en temps réel

---

**💡 Note :** Cette implémentation utilise Fabric.js avec des délimitations pour offrir une expérience de positionnement professionnelle, identique à celle de SellDesignPage.tsx, mais adaptée aux besoins de l'interface admin. 

## 📋 **Nouvelle implémentation**

La page `/admin/ready-products/create` utilise maintenant **Fabric.js** avec des **délimitations** pour le positionnement des designs, identique à `SellDesignPage.tsx`.

## 🎯 **Fonctionnalités principales**

### **1. Fabric.js Canvas**
- **Canvas interactif** avec contrôles natifs
- **Objets sélectionnables** avec poignées de redimensionnement
- **Rotation fluide** avec poignée de rotation
- **Déplacement** par glisser-déposer

### **2. Délimitations visuelles**
- **Zones de positionnement** définies par des rectangles
- **Contraintes** pour garder le design dans les limites
- **Affichage visuel** avec bordures pointillées
- **Couleur bleue** pour identifier les zones

### **3. Contrôles avancés**
- **Redimensionnement** avec poignées aux coins
- **Rotation** avec poignée dédiée
- **Déplacement** libre dans les délimitations
- **Réinitialisation** en un clic

## 🔧 **Architecture technique**

### **1. Initialisation Fabric.js**
```typescript
const canvas = new fabric.Canvas(canvasRef.current, {
  selection: false,
  preserveObjectStacking: true
});

fabricCanvasRef.current = canvas;
```

### **2. Chargement du mockup**
```typescript
fabric.Image.fromURL(mockup.colorVariations?.[0]?.images?.[0]?.url || '', (img) => {
  img.set({
    left: 0,
    top: 0,
    selectable: false,
    evented: false
  });
  
  // Ajuster la taille et position
  const containerWidth = 800;
  const containerHeight = 600;
  // Calcul des dimensions...
});
```

### **3. Création des délimitations**
```typescript
const defaultDelimitations = [
  {
    id: 1,
    x: 50, // 50% du centre
    y: 50, // 50% du centre
    width: 30, // 30% de la largeur
    height: 30, // 30% de la hauteur
    coordinateType: 'PERCENTAGE'
  }
];

// Ajouter les rectangles visuels
defaultDelimitations.forEach((delim) => {
  const delimRect = new fabric.Rect({
    left: offsetX + (delim.x / 100) * dispW,
    top: offsetY + (delim.y / 100) * dispH,
    width: (delim.width / 100) * dispW,
    height: (delim.height / 100) * dispH,
    fill: 'rgba(0, 123, 255, 0.2)',
    stroke: '#007bff',
    strokeWidth: 2,
    strokeDashArray: [5, 5],
    selectable: false,
    evented: false
  });
  canvas.add(delimRect);
});
```

### **4. Chargement du design**
```typescript
fabric.Image.fromURL(designUrl, (designImg) => {
  const delim = defaultDelimitations[0];
  const pos = computePxPosition(delim, dispW, dispH, offsetX, offsetY);
  
  designImg.set({
    left: pos.left + pos.width / 2 - designImg.width! / 2,
    top: pos.top + pos.height / 2 - designImg.height! / 2,
    originX: 'center',
    originY: 'center',
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockUniScaling: false,
    cornerColor: '#007bff',
    cornerSize: 10,
    transparentCorners: false
  });
  
  canvas.add(designImg);
  canvas.setActiveObject(designImg);
});
```

## 🎨 **Interface utilisateur**

### **1. Canvas Fabric.js**
```typescript
<div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
  <canvas
    ref={canvasRef}
    className="w-full h-full"
  />
  
  {/* Instructions */}
  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
    <div className="flex items-center gap-2">
      <Square className="h-4 w-4" />
      <span>Zone de positionnement</span>
    </div>
    <div className="text-xs opacity-80 mt-1">
      Glissez, redimensionnez et faites pivoter le design
    </div>
  </div>
</div>
```

### **2. Contrôles en temps réel**
```typescript
<div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">
      Position: X: {transforms.x.toFixed(0)}, Y: {transforms.y.toFixed(0)}
    </span>
  </div>
  
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">
      Échelle: {transforms.scale.toFixed(2)}x
    </span>
  </div>
  
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">
      Rotation: {transforms.rotation.toFixed(0)}°
    </span>
  </div>
  
  <Button variant="outline" size="sm" onClick={handleReset}>
    <RotateCcw className="h-4 w-4 mr-2" />
    Réinitialiser
  </Button>
</div>
```

## 🔍 **Fonctionnalités avancées**

### **1. Calcul de position**
```typescript
const computePxPosition = (delim: any, dispW: number, dispH: number, offsetX: number, offsetY: number) => {
  return {
    left: offsetX + (delim.x / 100) * dispW,
    top: offsetY + (delim.y / 100) * dispH,
    width: (delim.width / 100) * dispW,
    height: (delim.height / 100) * dispH
  };
};
```

### **2. Événements de modification**
```typescript
designImg.on('modified', () => {
  const newTransforms = {
    x: designImg.left!,
    y: designImg.top!,
    scale: designImg.scaleX!,
    rotation: designImg.angle || 0
  };
  setTransforms(newTransforms);
});
```

### **3. Réinitialisation**
```typescript
const handleReset = useCallback(() => {
  if (designObject && fabricCanvasRef.current) {
    const delim = delimitations[0];
    const pos = computePxPosition(delim, containerSize.width, containerSize.height, 0, 0);
    
    designObject.set({
      left: pos.left + pos.width / 2,
      top: pos.top + pos.height / 2,
      scaleX: 1,
      scaleY: 1,
      angle: 0
    });
    
    fabricCanvasRef.current.renderAll();
    setTransforms({ x: designObject.left!, y: designObject.top!, scale: 1, rotation: 0 });
  }
}, [designObject, delimitations, containerSize]);
```

## 📊 **États gérés**

### **1. États Fabric.js**
```typescript
const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
const [designObject, setDesignObject] = useState<fabric.Object | null>(null);
const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
```

### **2. États de délimitations**
```typescript
const [delimitations, setDelimitations] = useState<any[]>([]);
```

### **3. États de transformation**
```typescript
const [transforms, setTransforms] = useState({
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0
});
```

## 🎯 **Avantages de Fabric.js**

### **1. Contrôles natifs**
- **Poignées de redimensionnement** automatiques
- **Poignée de rotation** intégrée
- **Déplacement fluide** par glisser-déposer
- **Sélection visuelle** claire

### **2. Performance**
- **Rendu optimisé** par le canvas
- **Événements natifs** du navigateur
- **Animations fluides** sans lag
- **Gestion mémoire** automatique

### **3. Flexibilité**
- **API complète** pour les manipulations
- **Événements personnalisables** 
- **Styles configurables** pour les contrôles
- **Intégration facile** avec React

## 🚀 **Améliorations futures**

1. **Multiples délimitations** pour différents types de produits
2. **Snap to grid** pour un alignement parfait
3. **Historique des actions** (Undo/Redo)
4. **Templates de positionnement** prédéfinis
5. **Validation automatique** des positions
6. **Export des configurations** de positionnement
7. **Zoom et pan** sur le canvas
8. **Layers** pour gérer plusieurs designs

## 🎨 **Cohérence avec SellDesignPage**

### **1. Même logique**
- **Fabric.js** comme moteur de rendu
- **Délimitations** pour les contraintes
- **Calcul de position** identique
- **Événements** similaires

### **2. Interface adaptée**
- **Modal** pour l'admin (vs page complète)
- **Contrôles simplifiés** mais complets
- **Prévisualisation** optimisée

### **3. Workflow optimisé**
- **Upload → Positionnement → Sauvegarde**
- **Étapes claires** et guidées
- **Feedback** en temps réel

---

**💡 Note :** Cette implémentation utilise Fabric.js avec des délimitations pour offrir une expérience de positionnement professionnelle, identique à celle de SellDesignPage.tsx, mais adaptée aux besoins de l'interface admin. 
 
 
 
 
 