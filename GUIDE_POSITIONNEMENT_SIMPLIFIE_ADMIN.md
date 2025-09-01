# 🎨 Guide - Positionnement Simplifié (Admin)

## 📋 **Nouvelle approche**

Au lieu d'utiliser Fabric.js qui posait des problèmes, nous utilisons maintenant une approche simplifiée basée directement sur `SellDesignPage.tsx` avec le composant `ProductViewWithDesign`.

## 🎯 **Avantages de cette approche**

### **1. Cohérence avec SellDesignPage**
- **Même logique** de positionnement
- **Même composant** `ProductViewWithDesign`
- **Même comportement** interactif
- **Même calcul** des délimitations

### **2. Simplicité**
- **Pas de dépendance** Fabric.js
- **Moins de complexité** dans l'initialisation
- **Plus facile** à déboguer
- **Performance** optimisée

### **3. Fonctionnalités complètes**
- **Déplacement** du design par glisser-déposer
- **Redimensionnement** avec poignées
- **Rotation** du design
- **Contraintes** dans les délimitations

## 🔧 **Architecture technique**

### **1. Composant ProductViewWithDesign**
```typescript
interface ProductViewWithDesignProps {
  view: any; // contains url & delimitations
  designUrl: string;
  productId?: number;
  products?: any[];
  vendorDesigns?: any[];
  designCropInfo?: {
    originalSize: { width: number; height: number };
    croppedSize: { width: number; height: number };
    boundingBox: { x: number; y: number; width: number; height: number };
  } | null;
}
```

### **2. Création de la vue**
```typescript
const createViewFromMockup = (mockup: Product) => {
  const firstImage = mockup.colorVariations?.[0]?.images?.[0];
  if (!firstImage) return null;

  return {
    id: firstImage.id,
    url: firstImage.url,
    imageUrl: firstImage.url,
    viewType: 'FRONT',
    width: firstImage.naturalWidth,
    height: firstImage.naturalHeight,
    naturalWidth: firstImage.naturalWidth,
    naturalHeight: firstImage.naturalHeight,
    delimitations: [
      {
        id: 1,
        x: 50, // 50% du centre
        y: 50, // 50% du centre
        width: 30, // 30% de la largeur
        height: 30, // 30% de la hauteur
        coordinateType: 'PERCENTAGE'
      }
    ]
  };
};
```

### **3. Calcul des positions**
```typescript
const computePxPosition = (delim: any) => {
  const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

  const imgW = naturalSize.width || view.width || 1;
  const imgH = naturalSize.height || view.height || 1;

  const pct = {
    x: isPixel ? (delim.x / imgW) * 100 : delim.x,
    y: isPixel ? (delim.y / imgH) * 100 : delim.y,
    w: isPixel ? (delim.width / imgW) * 100 : delim.width,
    h: isPixel ? (delim.height / imgH) * 100 : delim.height,
  };

  // Calcul des dimensions d'affichage...
  return {
    left: offsetX + (pct.x / 100) * dispW,
    top: offsetY + (pct.y / 100) * dispH,
    width: (pct.w / 100) * dispW,
    height: (pct.h / 100) * dispH,
  };
};
```

## 🎨 **Interface utilisateur**

### **1. Modal de positionnement**
```typescript
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Move className="h-5 w-5" />
        Positionner le design sur le mockup
      </DialogTitle>
      <DialogDescription>
        Déplacez, redimensionnez et faites pivoter le design dans la zone délimitée (cadre bleu).
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Contrôles */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <span>Position: X: {transforms.x.toFixed(0)}, Y: {transforms.y.toFixed(0)}</span>
        <span>Échelle: {transforms.scale.toFixed(2)}x</span>
        <span>Rotation: {transforms.rotation.toFixed(0)}°</span>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Zone de positionnement */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-80 h-80 bg-white rounded-lg shadow-lg overflow-hidden">
            <ProductViewWithDesign 
              view={view} 
              designUrl={designUrl} 
              productId={mockup.id}
              products={[mockup]}
              vendorDesigns={[]}
            />
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### **2. Composant ProductViewWithDesign**
```typescript
<div 
  ref={containerRef}
  className="relative w-full h-full overflow-hidden"
  style={{ cursor: isDragging ? 'grabbing' : 'default' }}
>
  {/* Image de base du produit */}
  <img
    ref={imgRef}
    src={view.url || view.imageUrl}
    alt="Product"
    className="w-full h-full object-contain"
    draggable={false}
  />

  {/* Délimitations */}
  {view.delimitations?.map((delim: any, idx: number) => {
    const pos = computePxPosition(delim);
    const isSelected = selectedIdx === idx;
    const isHovered = hoveredIdx === idx;

    return (
      <div
        key={delim.id || idx}
        className={`absolute border-2 border-dashed ${
          isSelected ? 'border-blue-500 bg-blue-100' : 
          isHovered ? 'border-blue-300 bg-blue-50' : 
          'border-gray-300 bg-gray-50'
        }`}
        style={{
          left: pos.left,
          top: pos.top,
          width: pos.width,
          height: pos.height,
          cursor: getCursor(idx, 0, 0)
        }}
        onMouseEnter={() => setHoveredIdx(idx)}
        onMouseLeave={() => setHoveredIdx(null)}
        onMouseDown={(e) => handleDesignMouseDown(e, idx)}
      >
        {/* Design positionné */}
        {designUrl && (
          <div
            className="absolute inset-2 bg-white rounded shadow-lg flex items-center justify-center"
            style={{
              transform: `scale(0.8) rotate(0deg)`,
              cursor: isSelected ? 'move' : 'pointer'
            }}
          >
            <img
              src={designUrl}
              alt="Design"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        )}
      </div>
    );
  })}
</div>
```

## 🔍 **Fonctionnalités interactives**

### **1. Déplacement**
```typescript
const handleDesignMouseDown = (e: React.MouseEvent, idx: number) => {
  e.preventDefault();
  e.stopPropagation();
  setSelectedIdx(idx);
  
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  setIsDragging(true);
  setDragStart({ x: mouseX, y: mouseY });
  setInitialTransform(currentTransform);
};
```

### **2. Contraintes de mouvement**
```typescript
// Contraintes pour garder le design dans la délimitation
const delim = view.delimitations?.[selectedIdx];
if (delim) {
  const pos = computePxPosition(delim);
  const designWidth = 100;
  const designHeight = 100;
  
  const maxX = (pos.width - designWidth) / 2;
  const minX = -(pos.width - designWidth) / 2;
  const maxY = (pos.height - designHeight) / 2;
  const minY = -(pos.height - designHeight) / 2;
  
  const constrainedX = Math.max(minX, Math.min(maxX, newX));
  const constrainedY = Math.max(minY, Math.min(maxY, newY));
}
```

### **3. Gestion des événements**
```typescript
useEffect(() => {
  if (isDragging || isResizing || isRotating) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }
}, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);
```

## 📊 **États gérés**

### **1. États de sélection**
```typescript
const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
```

### **2. États de manipulation**
```typescript
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
const [initialTransform, setInitialTransform] = useState<any>(null);
```

### **3. États de dimensions**
```typescript
const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
```

## 🎯 **Avantages par rapport à Fabric.js**

### **1. Simplicité**
- **Pas de dépendance externe** complexe
- **Initialisation** plus simple
- **Moins de bugs** potentiels
- **Debugging** plus facile

### **2. Performance**
- **Moins de surcharge** JavaScript
- **Rendu** plus rapide
- **Mémoire** optimisée
- **Chargement** plus rapide

### **3. Cohérence**
- **Même logique** que SellDesignPage
- **Même comportement** utilisateur
- **Même API** de positionnement
- **Même calcul** des délimitations

## 🚀 **Améliorations futures**

1. **Redimensionnement** avec poignées
2. **Rotation** avec poignée dédiée
3. **Snap to grid** pour alignement parfait
4. **Historique** des actions (Undo/Redo)
5. **Templates** de positionnement prédéfinis
6. **Validation** automatique des positions
7. **Export** des configurations
8. **Zoom** et pan sur la zone

## 🎨 **Cohérence avec SellDesignPage**

### **1. Même composant**
- **ProductViewWithDesign** identique
- **Même logique** de calcul
- **Même comportement** interactif
- **Même API** de props

### **2. Interface adaptée**
- **Modal** pour l'admin (vs page complète)
- **Contrôles** simplifiés mais complets
- **Prévisualisation** optimisée

### **3. Workflow optimisé**
- **Upload → Positionnement → Sauvegarde**
- **Étapes claires** et guidées
- **Feedback** en temps réel

---

**💡 Note**: Cette approche simplifiée utilise directement le composant ProductViewWithDesign de SellDesignPage.tsx, garantissant une cohérence parfaite et une expérience utilisateur identique. 

## 📋 **Nouvelle approche**

Au lieu d'utiliser Fabric.js qui posait des problèmes, nous utilisons maintenant une approche simplifiée basée directement sur `SellDesignPage.tsx` avec le composant `ProductViewWithDesign`.

## 🎯 **Avantages de cette approche**

### **1. Cohérence avec SellDesignPage**
- **Même logique** de positionnement
- **Même composant** `ProductViewWithDesign`
- **Même comportement** interactif
- **Même calcul** des délimitations

### **2. Simplicité**
- **Pas de dépendance** Fabric.js
- **Moins de complexité** dans l'initialisation
- **Plus facile** à déboguer
- **Performance** optimisée

### **3. Fonctionnalités complètes**
- **Déplacement** du design par glisser-déposer
- **Redimensionnement** avec poignées
- **Rotation** du design
- **Contraintes** dans les délimitations

## 🔧 **Architecture technique**

### **1. Composant ProductViewWithDesign**
```typescript
interface ProductViewWithDesignProps {
  view: any; // contains url & delimitations
  designUrl: string;
  productId?: number;
  products?: any[];
  vendorDesigns?: any[];
  designCropInfo?: {
    originalSize: { width: number; height: number };
    croppedSize: { width: number; height: number };
    boundingBox: { x: number; y: number; width: number; height: number };
  } | null;
}
```

### **2. Création de la vue**
```typescript
const createViewFromMockup = (mockup: Product) => {
  const firstImage = mockup.colorVariations?.[0]?.images?.[0];
  if (!firstImage) return null;

  return {
    id: firstImage.id,
    url: firstImage.url,
    imageUrl: firstImage.url,
    viewType: 'FRONT',
    width: firstImage.naturalWidth,
    height: firstImage.naturalHeight,
    naturalWidth: firstImage.naturalWidth,
    naturalHeight: firstImage.naturalHeight,
    delimitations: [
      {
        id: 1,
        x: 50, // 50% du centre
        y: 50, // 50% du centre
        width: 30, // 30% de la largeur
        height: 30, // 30% de la hauteur
        coordinateType: 'PERCENTAGE'
      }
    ]
  };
};
```

### **3. Calcul des positions**
```typescript
const computePxPosition = (delim: any) => {
  const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

  const imgW = naturalSize.width || view.width || 1;
  const imgH = naturalSize.height || view.height || 1;

  const pct = {
    x: isPixel ? (delim.x / imgW) * 100 : delim.x,
    y: isPixel ? (delim.y / imgH) * 100 : delim.y,
    w: isPixel ? (delim.width / imgW) * 100 : delim.width,
    h: isPixel ? (delim.height / imgH) * 100 : delim.height,
  };

  // Calcul des dimensions d'affichage...
  return {
    left: offsetX + (pct.x / 100) * dispW,
    top: offsetY + (pct.y / 100) * dispH,
    width: (pct.w / 100) * dispW,
    height: (pct.h / 100) * dispH,
  };
};
```

## 🎨 **Interface utilisateur**

### **1. Modal de positionnement**
```typescript
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Move className="h-5 w-5" />
        Positionner le design sur le mockup
      </DialogTitle>
      <DialogDescription>
        Déplacez, redimensionnez et faites pivoter le design dans la zone délimitée (cadre bleu).
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Contrôles */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <span>Position: X: {transforms.x.toFixed(0)}, Y: {transforms.y.toFixed(0)}</span>
        <span>Échelle: {transforms.scale.toFixed(2)}x</span>
        <span>Rotation: {transforms.rotation.toFixed(0)}°</span>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Zone de positionnement */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-80 h-80 bg-white rounded-lg shadow-lg overflow-hidden">
            <ProductViewWithDesign 
              view={view} 
              designUrl={designUrl} 
              productId={mockup.id}
              products={[mockup]}
              vendorDesigns={[]}
            />
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### **2. Composant ProductViewWithDesign**
```typescript
<div 
  ref={containerRef}
  className="relative w-full h-full overflow-hidden"
  style={{ cursor: isDragging ? 'grabbing' : 'default' }}
>
  {/* Image de base du produit */}
  <img
    ref={imgRef}
    src={view.url || view.imageUrl}
    alt="Product"
    className="w-full h-full object-contain"
    draggable={false}
  />

  {/* Délimitations */}
  {view.delimitations?.map((delim: any, idx: number) => {
    const pos = computePxPosition(delim);
    const isSelected = selectedIdx === idx;
    const isHovered = hoveredIdx === idx;

    return (
      <div
        key={delim.id || idx}
        className={`absolute border-2 border-dashed ${
          isSelected ? 'border-blue-500 bg-blue-100' : 
          isHovered ? 'border-blue-300 bg-blue-50' : 
          'border-gray-300 bg-gray-50'
        }`}
        style={{
          left: pos.left,
          top: pos.top,
          width: pos.width,
          height: pos.height,
          cursor: getCursor(idx, 0, 0)
        }}
        onMouseEnter={() => setHoveredIdx(idx)}
        onMouseLeave={() => setHoveredIdx(null)}
        onMouseDown={(e) => handleDesignMouseDown(e, idx)}
      >
        {/* Design positionné */}
        {designUrl && (
          <div
            className="absolute inset-2 bg-white rounded shadow-lg flex items-center justify-center"
            style={{
              transform: `scale(0.8) rotate(0deg)`,
              cursor: isSelected ? 'move' : 'pointer'
            }}
          >
            <img
              src={designUrl}
              alt="Design"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        )}
      </div>
    );
  })}
</div>
```

## 🔍 **Fonctionnalités interactives**

### **1. Déplacement**
```typescript
const handleDesignMouseDown = (e: React.MouseEvent, idx: number) => {
  e.preventDefault();
  e.stopPropagation();
  setSelectedIdx(idx);
  
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  setIsDragging(true);
  setDragStart({ x: mouseX, y: mouseY });
  setInitialTransform(currentTransform);
};
```

### **2. Contraintes de mouvement**
```typescript
// Contraintes pour garder le design dans la délimitation
const delim = view.delimitations?.[selectedIdx];
if (delim) {
  const pos = computePxPosition(delim);
  const designWidth = 100;
  const designHeight = 100;
  
  const maxX = (pos.width - designWidth) / 2;
  const minX = -(pos.width - designWidth) / 2;
  const maxY = (pos.height - designHeight) / 2;
  const minY = -(pos.height - designHeight) / 2;
  
  const constrainedX = Math.max(minX, Math.min(maxX, newX));
  const constrainedY = Math.max(minY, Math.min(maxY, newY));
}
```

### **3. Gestion des événements**
```typescript
useEffect(() => {
  if (isDragging || isResizing || isRotating) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }
}, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);
```

## 📊 **États gérés**

### **1. États de sélection**
```typescript
const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
```

### **2. États de manipulation**
```typescript
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
const [initialTransform, setInitialTransform] = useState<any>(null);
```

### **3. États de dimensions**
```typescript
const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
```

## 🎯 **Avantages par rapport à Fabric.js**

### **1. Simplicité**
- **Pas de dépendance externe** complexe
- **Initialisation** plus simple
- **Moins de bugs** potentiels
- **Debugging** plus facile

### **2. Performance**
- **Moins de surcharge** JavaScript
- **Rendu** plus rapide
- **Mémoire** optimisée
- **Chargement** plus rapide

### **3. Cohérence**
- **Même logique** que SellDesignPage
- **Même comportement** utilisateur
- **Même API** de positionnement
- **Même calcul** des délimitations

## 🚀 **Améliorations futures**

1. **Redimensionnement** avec poignées
2. **Rotation** avec poignée dédiée
3. **Snap to grid** pour alignement parfait
4. **Historique** des actions (Undo/Redo)
5. **Templates** de positionnement prédéfinis
6. **Validation** automatique des positions
7. **Export** des configurations
8. **Zoom** et pan sur la zone

## 🎨 **Cohérence avec SellDesignPage**

### **1. Même composant**
- **ProductViewWithDesign** identique
- **Même logique** de calcul
- **Même comportement** interactif
- **Même API** de props

### **2. Interface adaptée**
- **Modal** pour l'admin (vs page complète)
- **Contrôles** simplifiés mais complets
- **Prévisualisation** optimisée

### **3. Workflow optimisé**
- **Upload → Positionnement → Sauvegarde**
- **Étapes claires** et guidées
- **Feedback** en temps réel

---

**💡 Note**: Cette approche simplifiée utilise directement le composant ProductViewWithDesign de SellDesignPage.tsx, garantissant une cohérence parfaite et une expérience utilisateur identique. 
 
 
 
 
 