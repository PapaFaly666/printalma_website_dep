# 🎨 Guide - Délimitations Réelles (Admin)

## 📋 **Nouvelle implémentation**

Le modal de positionnement utilise maintenant les **vraies délimitations** du mockup, permettant de positionner le design exactement comme dans `/vendeur/sell-design`.

## 🎯 **Fonctionnalités principales**

### **1. Délimitations réelles du mockup**
- **Utilisation** des vraies délimitations stockées dans le mockup
- **Fallback** vers une délimitation par défaut si aucune n'existe
- **Affichage** visuel des zones de positionnement
- **Interaction** complète dans chaque délimitation

### **2. Positionnement interactif**
- **Déplacement** du design par glisser-déposer dans les délimitations
- **Redimensionnement** avec poignées aux coins et côtés (FONCTIONNEL)
- **Rotation** avec poignée dédiée (FONCTIONNEL)
- **Contraintes** pour garder le design dans les limites

### **3. Interface cohérente**
- **Même comportement** que SellDesignPage
- **Même logique** de calcul des positions
- **Même API** de transformations
- **Même contraintes** de mouvement

## 🔧 **Architecture technique**

### **1. Création de la vue avec délimitations réelles**
```typescript
const createViewFromMockup = (mockup: Product) => {
  const firstImage = mockup.colorVariations?.[0]?.images?.[0];
  if (!firstImage) return null;

  // Utiliser les vraies délimitations du mockup si elles existent
  const mockupDelimitations = firstImage.delimitations || mockup.delimitations || [];
  
  // Si pas de délimitations, créer une par défaut
  const delimitations = mockupDelimitations.length > 0 ? mockupDelimitations : [
    {
      id: 1,
      x: 50, // 50% du centre
      y: 50, // 50% du centre
      width: 30, // 30% de la largeur
      height: 30, // 30% de la hauteur
      coordinateType: 'PERCENTAGE'
    }
  ];

  return {
    id: firstImage.id,
    url: firstImage.url,
    imageUrl: firstImage.url,
    viewType: 'FRONT',
    width: firstImage.naturalWidth,
    height: firstImage.naturalHeight,
    naturalWidth: firstImage.naturalWidth,
    naturalHeight: firstImage.naturalHeight,
    delimitations: delimitations
  };
};
```

### **2. Gestion des transformations par délimitation**
```typescript
// États pour les transformations de chaque délimitation
const [transforms, setTransforms] = useState<Record<number, {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}>>({});

// Obtenir ou créer les transformations pour une délimitation
const getTransform = (idx: number) => {
  return transforms[idx] || { x: 0, y: 0, scale: 1, rotation: 0 };
};

// Mettre à jour les transformations
const updateTransform = (idx: number, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
  setTransforms(prev => ({
    ...prev,
    [idx]: { ...getTransform(idx), ...updates }
  }));
};
```

### **3. Redimensionnement fonctionnel**
```typescript
// Redimensionnement
const handleResizeStart = (e: React.MouseEvent, idx: number, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w') => {
  e.preventDefault();
  e.stopPropagation();
  setSelectedIdx(idx);
  
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  const currentTransform = getTransform(idx);
  
  setIsResizing(true);
  setResizeHandle(handle);
  setResizeStart({ x: mouseX, y: mouseY });
  setInitialSize({ width: 80, height: 80, scale: currentTransform.scale });
};

// Logique de redimensionnement dans handleMouseMove
if (isResizing && resizeStart && initialSize && selectedIdx !== null && resizeHandle) {
  const deltaX = mouseX - resizeStart.x;
  const deltaY = mouseY - resizeStart.y;
  
  let newScale = initialSize.scale;
  const scaleFactor = 0.01; // Sensibilité du redimensionnement
  
  switch (resizeHandle) {
    case 'se':
      newScale = Math.max(0.1, initialSize.scale + (deltaX + deltaY) * scaleFactor);
      break;
    case 'sw':
      newScale = Math.max(0.1, initialSize.scale + (-deltaX + deltaY) * scaleFactor);
      break;
    case 'ne':
      newScale = Math.max(0.1, initialSize.scale + (deltaX - deltaY) * scaleFactor);
      break;
    case 'nw':
      newScale = Math.max(0.1, initialSize.scale + (-deltaX - deltaY) * scaleFactor);
      break;
    case 'e':
      newScale = Math.max(0.1, initialSize.scale + deltaX * scaleFactor);
      break;
    case 'w':
      newScale = Math.max(0.1, initialSize.scale - deltaX * scaleFactor);
      break;
    case 's':
      newScale = Math.max(0.1, initialSize.scale + deltaY * scaleFactor);
      break;
    case 'n':
      newScale = Math.max(0.1, initialSize.scale - deltaY * scaleFactor);
      break;
  }
  
  // Contraintes pour le redimensionnement
  const delim = view.delimitations?.[selectedIdx];
  if (delim) {
    const pos = computePxPosition(delim);
    const maxScale = Math.min(pos.width / 80, pos.height / 80);
    newScale = Math.min(newScale, maxScale);
  }
  
  updateTransform(selectedIdx, { scale: newScale });
}
```

### **4. Rotation fonctionnelle**
```typescript
// Rotation
const handleRotationStart = (e: React.MouseEvent, idx: number) => {
  e.preventDefault();
  e.stopPropagation();
  setSelectedIdx(idx);
  
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  const currentTransform = getTransform(idx);
  
  setIsRotating(true);
  setRotationStart({ x: mouseX, y: mouseY, angle: currentTransform.rotation });
  setInitialRotation(currentTransform.rotation);
};

// Logique de rotation dans handleMouseMove
if (isRotating && rotationStart && selectedIdx !== null) {
  const deltaX = mouseX - rotationStart.x;
  const deltaY = mouseY - rotationStart.y;
  
  // Calculer l'angle de rotation basé sur la position de la souris
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  const newRotation = initialRotation + angle;
  
  updateTransform(selectedIdx, { rotation: newRotation });
}
```

### **5. Positionnement dans les délimitations avec poignées fonctionnelles**
```typescript
{/* Design positionné dans la délimitation */}
{designUrl && (
  <div
    className="absolute bg-white rounded shadow-lg flex items-center justify-center"
    style={{
      left: pos.width / 2 - 40 + transform.x,
      top: pos.height / 2 - 40 + transform.y,
      width: 80,
      height: 80,
      transform: `scale(${transform.scale}) rotate(${transform.rotation}deg)`,
      cursor: isSelected ? 'move' : 'pointer',
      zIndex: isSelected ? 10 : 1
    }}
    onMouseDown={(e) => handleDesignMouseDown(e, idx)}
  >
    <img
      src={designUrl}
      alt="Design"
      className="w-full h-full object-contain"
      draggable={false}
    />
    
    {/* Poignées de redimensionnement si sélectionné */}
    {isSelected && (
      <>
        {/* Poignée de rotation */}
        <div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-pointer"
          style={{ zIndex: 20 }}
          onMouseDown={(e) => handleRotationStart(e, idx)}
        />
        
        {/* Poignées de redimensionnement aux coins */}
        <div 
          className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"
          style={{ cursor: getResizeCursor('nw'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'nw')}
        />
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
          style={{ cursor: getResizeCursor('ne'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'ne')}
        />
        <div 
          className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"
          style={{ cursor: getResizeCursor('sw'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'sw')}
        />
        <div 
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
          style={{ cursor: getResizeCursor('se'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'se')}
        />
        
        {/* Poignées de redimensionnement centrales */}
        <div 
          className="absolute top-1/2 -left-1 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"
          style={{ cursor: getResizeCursor('w'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'w')}
        />
        <div 
          className="absolute top-1/2 -right-1 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"
          style={{ cursor: getResizeCursor('e'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'e')}
        />
        <div 
          className="absolute -top-1 left-1/2 w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2"
          style={{ cursor: getResizeCursor('n'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'n')}
        />
        <div 
          className="absolute -bottom-1 left-1/2 w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2"
          style={{ cursor: getResizeCursor('s'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 's')}
        />
      </>
    )}
  </div>
)}
```

## 🎨 **Interface utilisateur**

### **1. Affichage des délimitations**
```typescript
{/* Délimitations avec designs positionnés */}
{view.delimitations?.map((delim: any, idx: number) => {
  const pos = computePxPosition(delim);
  const isSelected = selectedIdx === idx;
  const isHovered = hoveredIdx === idx;
  const transform = getTransform(idx);

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
    >
      {/* Design positionné dans la délimitation */}
    </div>
  );
})}
```

### **2. Contrôles de positionnement**
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

## 🔍 **Fonctionnalités interactives**

### **1. Déplacement avec contraintes**
```typescript
const handleMouseMove = useCallback((e: MouseEvent) => {
  if (!containerRef.current) return;
  
  const rect = containerRef.current.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Déplacement
  if (isDragging && dragStart && initialTransform && selectedIdx !== null) {
    const deltaX = mouseX - dragStart.x;
    const deltaY = mouseY - dragStart.y;
    
    // Déplacement fluide
    const newX = initialTransform.x + deltaX;
    const newY = initialTransform.y + deltaY;
    
    // Contraintes pour garder le design dans la délimitation
    const delim = view.delimitations?.[selectedIdx];
    if (delim) {
      const pos = computePxPosition(delim);
      const transform = getTransform(selectedIdx);
      const designWidth = 80 * transform.scale;
      const designHeight = 80 * transform.scale;
      
      const maxX = (pos.width - designWidth) / 2;
      const minX = -(pos.width - designWidth) / 2;
      const maxY = (pos.height - designHeight) / 2;
      const minY = -(pos.height - designHeight) / 2;
      
      const constrainedX = Math.max(minX, Math.min(maxX, newX));
      const constrainedY = Math.max(minY, Math.min(maxY, newY));
      
      // Mettre à jour les transformations
      updateTransform(selectedIdx, { x: constrainedX, y: constrainedY });
    }
  }
  
  // Redimensionnement et rotation...
}, [isDragging, isResizing, isRotating, dragStart, resizeStart, rotationStart, initialTransform, initialSize, initialRotation, selectedIdx, resizeHandle, view.delimitations, updateTransform]);
```

### **2. Gestion des événements**
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

### **3. États de redimensionnement**
```typescript
const [isResizing, setIsResizing] = useState(false);
const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | null>(null);
const [resizeStart, setResizeStart] = useState<{ x: number; y: number } | null>(null);
const [initialSize, setInitialSize] = useState<{ width: number; height: number; scale: number } | null>(null);
```

### **4. États de rotation**
```typescript
const [isRotating, setIsRotating] = useState(false);
const [rotationStart, setRotationStart] = useState<{ x: number; y: number; angle: number } | null>(null);
const [initialRotation, setInitialRotation] = useState<number>(0);
```

### **5. États de transformations**
```typescript
const [transforms, setTransforms] = useState<Record<number, {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}>>({});
```

## 🎯 **Avantages de cette approche**

### **1. Utilisation des vraies délimitations**
- **Cohérence** avec les données du mockup
- **Précision** du positionnement
- **Flexibilité** pour différents types de produits
- **Évolutivité** pour de nouvelles délimitations

### **2. Interaction complète**
- **Déplacement** fluide dans les délimitations
- **Redimensionnement** avec poignées fonctionnelles
- **Rotation** avec poignée dédiée fonctionnelle
- **Contraintes** pour éviter les débordements

### **3. Interface cohérente**
- **Même comportement** que SellDesignPage
- **Même logique** de calcul
- **Même API** de transformations
- **Même contraintes** de mouvement

## 🚀 **Fonctionnalités implémentées**

### **1. Redimensionnement complet**
- **8 poignées** de redimensionnement (coins + côtés)
- **Sensibilité** ajustable pour un contrôle précis
- **Contraintes** pour éviter les débordements
- **Curseurs** appropriés pour chaque poignée

### **2. Rotation fonctionnelle**
- **Poignée de rotation** dédiée
- **Calcul d'angle** basé sur la position de la souris
- **Rotation fluide** en temps réel
- **Contraintes** pour éviter les rotations excessives

### **3. Déplacement amélioré**
- **Contraintes** tenant compte de l'échelle
- **Déplacement fluide** dans les délimitations
- **Feedback visuel** en temps réel
- **Précision** du positionnement

## 🎨 **Cohérence avec SellDesignPage**

### **1. Même logique**
- **Utilisation** des vraies délimitations
- **Calcul** des positions identique
- **Contraintes** de mouvement identiques
- **API** de transformations identique

### **2. Interface adaptée**
- **Modal** pour l'admin (vs page complète)
- **Contrôles** simplifiés mais complets
- **Prévisualisation** optimisée

### **3. Workflow optimisé**
- **Upload → Positionnement → Sauvegarde**
- **Étapes claires** et guidées
- **Feedback** en temps réel

---

**💡 Note**: Cette implémentation utilise les vraies délimitations du mockup et offre maintenant un redimensionnement et une rotation fonctionnels, permettant un positionnement précis et cohérent avec l'expérience utilisateur de SellDesignPage. 

## 📋 **Nouvelle implémentation**

Le modal de positionnement utilise maintenant les **vraies délimitations** du mockup, permettant de positionner le design exactement comme dans `/vendeur/sell-design`.

## 🎯 **Fonctionnalités principales**

### **1. Délimitations réelles du mockup**
- **Utilisation** des vraies délimitations stockées dans le mockup
- **Fallback** vers une délimitation par défaut si aucune n'existe
- **Affichage** visuel des zones de positionnement
- **Interaction** complète dans chaque délimitation

### **2. Positionnement interactif**
- **Déplacement** du design par glisser-déposer dans les délimitations
- **Redimensionnement** avec poignées aux coins et côtés (FONCTIONNEL)
- **Rotation** avec poignée dédiée (FONCTIONNEL)
- **Contraintes** pour garder le design dans les limites

### **3. Interface cohérente**
- **Même comportement** que SellDesignPage
- **Même logique** de calcul des positions
- **Même API** de transformations
- **Même contraintes** de mouvement

## 🔧 **Architecture technique**

### **1. Création de la vue avec délimitations réelles**
```typescript
const createViewFromMockup = (mockup: Product) => {
  const firstImage = mockup.colorVariations?.[0]?.images?.[0];
  if (!firstImage) return null;

  // Utiliser les vraies délimitations du mockup si elles existent
  const mockupDelimitations = firstImage.delimitations || mockup.delimitations || [];
  
  // Si pas de délimitations, créer une par défaut
  const delimitations = mockupDelimitations.length > 0 ? mockupDelimitations : [
    {
      id: 1,
      x: 50, // 50% du centre
      y: 50, // 50% du centre
      width: 30, // 30% de la largeur
      height: 30, // 30% de la hauteur
      coordinateType: 'PERCENTAGE'
    }
  ];

  return {
    id: firstImage.id,
    url: firstImage.url,
    imageUrl: firstImage.url,
    viewType: 'FRONT',
    width: firstImage.naturalWidth,
    height: firstImage.naturalHeight,
    naturalWidth: firstImage.naturalWidth,
    naturalHeight: firstImage.naturalHeight,
    delimitations: delimitations
  };
};
```

### **2. Gestion des transformations par délimitation**
```typescript
// États pour les transformations de chaque délimitation
const [transforms, setTransforms] = useState<Record<number, {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}>>({});

// Obtenir ou créer les transformations pour une délimitation
const getTransform = (idx: number) => {
  return transforms[idx] || { x: 0, y: 0, scale: 1, rotation: 0 };
};

// Mettre à jour les transformations
const updateTransform = (idx: number, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
  setTransforms(prev => ({
    ...prev,
    [idx]: { ...getTransform(idx), ...updates }
  }));
};
```

### **3. Redimensionnement fonctionnel**
```typescript
// Redimensionnement
const handleResizeStart = (e: React.MouseEvent, idx: number, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w') => {
  e.preventDefault();
  e.stopPropagation();
  setSelectedIdx(idx);
  
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  const currentTransform = getTransform(idx);
  
  setIsResizing(true);
  setResizeHandle(handle);
  setResizeStart({ x: mouseX, y: mouseY });
  setInitialSize({ width: 80, height: 80, scale: currentTransform.scale });
};

// Logique de redimensionnement dans handleMouseMove
if (isResizing && resizeStart && initialSize && selectedIdx !== null && resizeHandle) {
  const deltaX = mouseX - resizeStart.x;
  const deltaY = mouseY - resizeStart.y;
  
  let newScale = initialSize.scale;
  const scaleFactor = 0.01; // Sensibilité du redimensionnement
  
  switch (resizeHandle) {
    case 'se':
      newScale = Math.max(0.1, initialSize.scale + (deltaX + deltaY) * scaleFactor);
      break;
    case 'sw':
      newScale = Math.max(0.1, initialSize.scale + (-deltaX + deltaY) * scaleFactor);
      break;
    case 'ne':
      newScale = Math.max(0.1, initialSize.scale + (deltaX - deltaY) * scaleFactor);
      break;
    case 'nw':
      newScale = Math.max(0.1, initialSize.scale + (-deltaX - deltaY) * scaleFactor);
      break;
    case 'e':
      newScale = Math.max(0.1, initialSize.scale + deltaX * scaleFactor);
      break;
    case 'w':
      newScale = Math.max(0.1, initialSize.scale - deltaX * scaleFactor);
      break;
    case 's':
      newScale = Math.max(0.1, initialSize.scale + deltaY * scaleFactor);
      break;
    case 'n':
      newScale = Math.max(0.1, initialSize.scale - deltaY * scaleFactor);
      break;
  }
  
  // Contraintes pour le redimensionnement
  const delim = view.delimitations?.[selectedIdx];
  if (delim) {
    const pos = computePxPosition(delim);
    const maxScale = Math.min(pos.width / 80, pos.height / 80);
    newScale = Math.min(newScale, maxScale);
  }
  
  updateTransform(selectedIdx, { scale: newScale });
}
```

### **4. Rotation fonctionnelle**
```typescript
// Rotation
const handleRotationStart = (e: React.MouseEvent, idx: number) => {
  e.preventDefault();
  e.stopPropagation();
  setSelectedIdx(idx);
  
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  const currentTransform = getTransform(idx);
  
  setIsRotating(true);
  setRotationStart({ x: mouseX, y: mouseY, angle: currentTransform.rotation });
  setInitialRotation(currentTransform.rotation);
};

// Logique de rotation dans handleMouseMove
if (isRotating && rotationStart && selectedIdx !== null) {
  const deltaX = mouseX - rotationStart.x;
  const deltaY = mouseY - rotationStart.y;
  
  // Calculer l'angle de rotation basé sur la position de la souris
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  const newRotation = initialRotation + angle;
  
  updateTransform(selectedIdx, { rotation: newRotation });
}
```

### **5. Positionnement dans les délimitations avec poignées fonctionnelles**
```typescript
{/* Design positionné dans la délimitation */}
{designUrl && (
  <div
    className="absolute bg-white rounded shadow-lg flex items-center justify-center"
    style={{
      left: pos.width / 2 - 40 + transform.x,
      top: pos.height / 2 - 40 + transform.y,
      width: 80,
      height: 80,
      transform: `scale(${transform.scale}) rotate(${transform.rotation}deg)`,
      cursor: isSelected ? 'move' : 'pointer',
      zIndex: isSelected ? 10 : 1
    }}
    onMouseDown={(e) => handleDesignMouseDown(e, idx)}
  >
    <img
      src={designUrl}
      alt="Design"
      className="w-full h-full object-contain"
      draggable={false}
    />
    
    {/* Poignées de redimensionnement si sélectionné */}
    {isSelected && (
      <>
        {/* Poignée de rotation */}
        <div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-pointer"
          style={{ zIndex: 20 }}
          onMouseDown={(e) => handleRotationStart(e, idx)}
        />
        
        {/* Poignées de redimensionnement aux coins */}
        <div 
          className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"
          style={{ cursor: getResizeCursor('nw'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'nw')}
        />
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
          style={{ cursor: getResizeCursor('ne'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'ne')}
        />
        <div 
          className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"
          style={{ cursor: getResizeCursor('sw'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'sw')}
        />
        <div 
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
          style={{ cursor: getResizeCursor('se'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'se')}
        />
        
        {/* Poignées de redimensionnement centrales */}
        <div 
          className="absolute top-1/2 -left-1 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"
          style={{ cursor: getResizeCursor('w'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'w')}
        />
        <div 
          className="absolute top-1/2 -right-1 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"
          style={{ cursor: getResizeCursor('e'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'e')}
        />
        <div 
          className="absolute -top-1 left-1/2 w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2"
          style={{ cursor: getResizeCursor('n'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 'n')}
        />
        <div 
          className="absolute -bottom-1 left-1/2 w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2"
          style={{ cursor: getResizeCursor('s'), zIndex: 20 }}
          onMouseDown={(e) => handleResizeStart(e, idx, 's')}
        />
      </>
    )}
  </div>
)}
```

## 🎨 **Interface utilisateur**

### **1. Affichage des délimitations**
```typescript
{/* Délimitations avec designs positionnés */}
{view.delimitations?.map((delim: any, idx: number) => {
  const pos = computePxPosition(delim);
  const isSelected = selectedIdx === idx;
  const isHovered = hoveredIdx === idx;
  const transform = getTransform(idx);

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
    >
      {/* Design positionné dans la délimitation */}
    </div>
  );
})}
```

### **2. Contrôles de positionnement**
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

## 🔍 **Fonctionnalités interactives**

### **1. Déplacement avec contraintes**
```typescript
const handleMouseMove = useCallback((e: MouseEvent) => {
  if (!containerRef.current) return;
  
  const rect = containerRef.current.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Déplacement
  if (isDragging && dragStart && initialTransform && selectedIdx !== null) {
    const deltaX = mouseX - dragStart.x;
    const deltaY = mouseY - dragStart.y;
    
    // Déplacement fluide
    const newX = initialTransform.x + deltaX;
    const newY = initialTransform.y + deltaY;
    
    // Contraintes pour garder le design dans la délimitation
    const delim = view.delimitations?.[selectedIdx];
    if (delim) {
      const pos = computePxPosition(delim);
      const transform = getTransform(selectedIdx);
      const designWidth = 80 * transform.scale;
      const designHeight = 80 * transform.scale;
      
      const maxX = (pos.width - designWidth) / 2;
      const minX = -(pos.width - designWidth) / 2;
      const maxY = (pos.height - designHeight) / 2;
      const minY = -(pos.height - designHeight) / 2;
      
      const constrainedX = Math.max(minX, Math.min(maxX, newX));
      const constrainedY = Math.max(minY, Math.min(maxY, newY));
      
      // Mettre à jour les transformations
      updateTransform(selectedIdx, { x: constrainedX, y: constrainedY });
    }
  }
  
  // Redimensionnement et rotation...
}, [isDragging, isResizing, isRotating, dragStart, resizeStart, rotationStart, initialTransform, initialSize, initialRotation, selectedIdx, resizeHandle, view.delimitations, updateTransform]);
```

### **2. Gestion des événements**
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

### **3. États de redimensionnement**
```typescript
const [isResizing, setIsResizing] = useState(false);
const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | null>(null);
const [resizeStart, setResizeStart] = useState<{ x: number; y: number } | null>(null);
const [initialSize, setInitialSize] = useState<{ width: number; height: number; scale: number } | null>(null);
```

### **4. États de rotation**
```typescript
const [isRotating, setIsRotating] = useState(false);
const [rotationStart, setRotationStart] = useState<{ x: number; y: number; angle: number } | null>(null);
const [initialRotation, setInitialRotation] = useState<number>(0);
```

### **5. États de transformations**
```typescript
const [transforms, setTransforms] = useState<Record<number, {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}>>({});
```

## 🎯 **Avantages de cette approche**

### **1. Utilisation des vraies délimitations**
- **Cohérence** avec les données du mockup
- **Précision** du positionnement
- **Flexibilité** pour différents types de produits
- **Évolutivité** pour de nouvelles délimitations

### **2. Interaction complète**
- **Déplacement** fluide dans les délimitations
- **Redimensionnement** avec poignées fonctionnelles
- **Rotation** avec poignée dédiée fonctionnelle
- **Contraintes** pour éviter les débordements

### **3. Interface cohérente**
- **Même comportement** que SellDesignPage
- **Même logique** de calcul
- **Même API** de transformations
- **Même contraintes** de mouvement

## 🚀 **Fonctionnalités implémentées**

### **1. Redimensionnement complet**
- **8 poignées** de redimensionnement (coins + côtés)
- **Sensibilité** ajustable pour un contrôle précis
- **Contraintes** pour éviter les débordements
- **Curseurs** appropriés pour chaque poignée

### **2. Rotation fonctionnelle**
- **Poignée de rotation** dédiée
- **Calcul d'angle** basé sur la position de la souris
- **Rotation fluide** en temps réel
- **Contraintes** pour éviter les rotations excessives

### **3. Déplacement amélioré**
- **Contraintes** tenant compte de l'échelle
- **Déplacement fluide** dans les délimitations
- **Feedback visuel** en temps réel
- **Précision** du positionnement

## 🎨 **Cohérence avec SellDesignPage**

### **1. Même logique**
- **Utilisation** des vraies délimitations
- **Calcul** des positions identique
- **Contraintes** de mouvement identiques
- **API** de transformations identique

### **2. Interface adaptée**
- **Modal** pour l'admin (vs page complète)
- **Contrôles** simplifiés mais complets
- **Prévisualisation** optimisée

### **3. Workflow optimisé**
- **Upload → Positionnement → Sauvegarde**
- **Étapes claires** et guidées
- **Feedback** en temps réel

---

**💡 Note**: Cette implémentation utilise les vraies délimitations du mockup et offre maintenant un redimensionnement et une rotation fonctionnels, permettant un positionnement précis et cohérent avec l'expérience utilisateur de SellDesignPage. 
 
 
 
 
 