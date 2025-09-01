# 🚨 DIAGNOSTIC — Positions non sauvegardées en base

> **Problème :** Le frontend ne comprend pas les positions, rien n'est mis en base de données  
> **Objectif :** Identifier et résoudre les blocages de sauvegarde

---

## 🔍 Étape 1 : Vérifier les appels API

### Console Browser (F12 → Network)

Recherchez ces appels lors du déplacement d'un design :

```
✅ ATTENDU :
POST /api/vendor/design-transforms/save
PUT /api/vendor-products/123/designs/1/position

❌ MANQUANT = PROBLÈME :
Aucun appel API visible = hooks non déclenchés
```

### Debug Console (F12 → Console)

Ajoutez ces logs temporaires dans `useDesignTransforms` :

```js
// Dans src/hooks/useDesignTransforms.ts
const updateTransform = useCallback((index: number, updates: Partial<Transform>) => {
  console.log('🎯 UPDATE TRANSFORM:', { index, updates, validProductId, enabled: positioningHook });
  
  if (index === 0 && validProductId && validProductId > 0) {
    console.log('🛡️ UTILISANT SYSTÈME ISOLATION');
    const currentTransform = getTransform(index);
    const newTransform = { ...currentTransform, ...updates };
    const newPosition = convertTransformToPosition(newTransform);
    console.log('💾 SAUVEGARDE POSITION:', newPosition);
    
    positioningHook.savePositionDelayed(newPosition, 1000);
    return;
  }
  
  console.log('🔄 UTILISANT ANCIEN SYSTÈME');
  // ... rest of function
}, [getTransform, positioningHook.savePositionDelayed, validProductId]);
```

---

## 🔍 Étape 2 : Identifier le problème racine

### Cas A : Aucun log "UPDATE TRANSFORM"
**Problème :** Les événements de drag ne sont pas captés

**Solution :**
```js
// Vérifier dans ProductViewWithDesign.tsx
const handleMouseMove = (e: MouseEvent) => {
  console.log('🖱️ MOUSE MOVE DETECTED');
  if (!dragState.current) return;
  
  const { delimIdx, startX, startY, origX, origY, mode, origScale } = dragState.current;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  console.log('📦 CALLING updateTransform:', { delimIdx, dx, dy });
  if (mode === 'move') {
    updateTransform(delimIdx!, { x: origX + dx, y: origY + dy });
  }
};
```

### Cas B : Log "UTILISANT ANCIEN SYSTÈME"
**Problème :** `validProductId` est null/undefined

**Solution :**
```js
// Debug dans useDesignTransforms.ts
console.log('🔍 DEBUG PRODUCT IDS:', {
  product: product,
  vpId: vpId,
  'product?.id': product?.id,
  validProductId: validProductId,
  designId: designId
});
```

### Cas C : Log "UTILISANT SYSTÈME ISOLATION" mais pas d'appel API
**Problème :** Hook `useDesignPositioning` non activé

**Solution :**
```js
// Debug dans useDesignPositioning.ts
export function useDesignPositioning({ productId, designId, enabled = true }) {
  console.log('🛡️ HOOK POSITIONING:', { productId, designId, enabled });
  
  const savePositionDelayed = useCallback((newPosition, delay = 2000) => {
    console.log('💾 SAVE POSITION DELAYED:', { newPosition, delay });
    setOptimisticPosition(newPosition);
    
    setTimeout(() => {
      console.log('🚀 EXECUTING SAVE MUTATION');
      savePositionMutation.mutate(newPosition);
    }, delay);
  }, [savePositionMutation]);
}
```

---

## 🔍 Étape 3 : Tests manuels rapides

### Test 1 : API directe
```js
// Console browser (F12)
fetch('/api/vendor-products/123/designs/1/position', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    x: 100,
    y: 100,
    scale: 1,
    rotation: 0
  })
}).then(r => r.json()).then(console.log);
```

**Résultats attendus :**
- ✅ `200 OK` = Backend fonctionne
- ❌ `400/404` = Problème backend
- ❌ `CORS/Network Error` = Problème de connexion

### Test 2 : Hook isolation direct
```js
// Dans la console, sur une page avec le composant
const testHook = () => {
  const hook = useDesignPositioning({
    productId: 123, // Remplacer par un vrai ID
    designId: 1,
    enabled: true
  });
  
  console.log('Hook state:', hook);
  
  // Test sauvegarde
  hook.savePosition({
    x: 200,
    y: 150,
    scale: 1.2,
    rotation: 0
  });
};
```

---

## 🔧 Solutions par problème identifié

### Problème 1 : productId = 0 ou null
```js
// Dans le composant parent qui utilise ProductViewWithDesign
const ProductConfigurator = ({ vendorProduct }) => {
  console.log('🔍 VENDOR PRODUCT:', vendorProduct);
  
  // ✅ S'assurer que vendorProduct.id existe
  if (!vendorProduct?.id) {
    return <div>⚠️ Produit non chargé</div>;
  }
  
  return (
    <ProductViewWithDesign 
      product={vendorProduct} 
      designUrl={designUrl}
    />
  );
};
```

### Problème 2 : designId invalide
```js
// Vérifier l'origine du designId
const ProductWithDesign = ({ product, design }) => {
  const validDesignId = design?.id || design?.designId || 1;
  console.log('🎨 DESIGN ID:', { design, validDesignId });
  
  return (
    <ProductViewWithDesign 
      product={{ ...product, designId: validDesignId }}
      designUrl={design?.url}
    />
  );
};
```

### Problème 3 : Hook non activé
```js
// Forcer l'activation temporairement
const positioningHook = useDesignPositioning({
  productId: validProductId || 0,
  designId: designId,
  enabled: true // ✅ Forcer à true pour debug
});
```

### Problème 4 : Sauvegarde mais pas en base
**Vérifier le backend :**
```bash
# Logs backend
tail -f backend.log | grep -i position

# Base de données
SELECT * FROM product_design_positions ORDER BY updated_at DESC LIMIT 10;
```

---

## 🎯 Script de diagnostic automatique

Ajoutez ce composant temporaire sur votre page :

```tsx
// components/debug/PositionDiagnostic.tsx
import React, { useState } from 'react';
import { useDesignPositioning } from '@/hooks/useDesignPositioning';

export const PositionDiagnostic = ({ productId = 123, designId = 1 }) => {
  const [testResults, setTestResults] = useState([]);
  
  const hook = useDesignPositioning({
    productId,
    designId, 
    enabled: true
  });
  
  const runDiagnostic = async () => {
    const results = [];
    
    // Test 1: Hook state
    results.push(`Hook state: ${JSON.stringify({
      position: hook.position,
      isLoading: hook.isLoading,
      error: hook.error,
      isSaving: hook.isSaving
    })}`);
    
    // Test 2: Save position
    try {
      await hook.savePosition({
        x: Math.random() * 300,
        y: Math.random() * 200,
        scale: 1,
        rotation: 0
      });
      results.push('✅ Sauvegarde réussie');
    } catch (error) {
      results.push(`❌ Erreur sauvegarde: ${error.message}`);
    }
    
    // Test 3: API directe
    try {
      const response = await fetch(`/api/vendor-products/${productId}/designs/${designId}/position`);
      const data = await response.json();
      results.push(`✅ API GET: ${JSON.stringify(data)}`);
    } catch (error) {
      results.push(`❌ Erreur API GET: ${error.message}`);
    }
    
    setTestResults(results);
  };
  
  return (
    <div className="fixed top-4 right-4 bg-white border p-4 rounded shadow-lg max-w-md z-50">
      <h3 className="font-bold mb-2">🚨 Diagnostic Positions</h3>
      <div className="text-xs mb-2">
        Product: {productId} | Design: {designId}
      </div>
      
      <button 
        onClick={runDiagnostic}
        className="bg-blue-500 text-white px-3 py-1 rounded text-sm mb-2"
      >
        🔍 Lancer diagnostic
      </button>
      
      <div className="text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
        {testResults.map((result, i) => (
          <div key={i}>{result}</div>
        ))}
      </div>
    </div>
  );
};
```

**Utilisation :**
```tsx
// Dans votre page de test
import { PositionDiagnostic } from '@/components/debug/PositionDiagnostic';

export default function TestPage() {
  return (
    <div>
      <PositionDiagnostic productId={123} designId={1} />
      {/* Vos autres composants */}
    </div>
  );
}
```

---

## 📋 Checklist de vérification

- [ ] **Network tab** : Appels API visibles lors du drag ?
- [ ] **Console logs** : "UPDATE TRANSFORM" apparaît ?
- [ ] **ProductId valide** : `productId > 0` ?
- [ ] **DesignId valide** : `designId > 0` ?
- [ ] **Hook activé** : `enabled: true` ?
- [ ] **Backend disponible** : API répond en `200 OK` ?
- [ ] **Table DB existe** : `product_design_positions` créée ?
- [ ] **Credentials** : Authentification vendeur OK ?

---

## 🆘 Support rapide

Si après ce diagnostic vous avez encore des problèmes :

1. **Copiez les logs de la console**
2. **Copiez les résultats du composant PositionDiagnostic**  
3. **Indiquez les appels visibles dans Network tab**

Cela permettra d'identifier rapidement la cause racine du problème ! 🎯 