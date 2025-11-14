# 🔍 Guide de Débogage - Affichage des Personnalisations dans le Panier

## 📋 Vue d'ensemble

Ce document explique comment déboguer et tester l'affichage des personnalisations dans le drawer du panier.

---

## 🧪 Test Complet - Étape par Étape

### Étape 1 : Préparation

1. Ouvrir la console du navigateur (F12)
2. Vider le localStorage pour repartir de zéro :
   ```javascript
   localStorage.clear()
   ```
3. Rafraîchir la page

### Étape 2 : Personnalisation du Produit

1. Aller sur `/product/{id}/customize` (remplacer {id} par un ID de produit)
2. Ajouter des éléments de design :
   - Ajouter un texte via la sidebar
   - Modifier le texte, la police, la couleur
   - Ajouter une image (optionnel)

### Étape 3 : Vérifier la Sauvegarde LocalStorage

Dans la console, vérifier que les données sont sauvegardées :

```javascript
// Vérifier les données de design
const productId = window.location.pathname.split('/')[2];
const designData = localStorage.getItem(`design-data-product-${productId}`);
console.log('Design data:', JSON.parse(designData));
```

**Résultat attendu :**
```json
{
  "elements": [
    {
      "id": "...",
      "type": "text",
      "text": "Mon Texte",
      "fontSize": 24,
      "fontFamily": "Arial, sans-serif",
      "color": "#000000",
      "x": 0.5,
      "y": 0.5,
      "rotation": 0
    }
  ],
  "colorVariationId": 123,
  "viewId": 456,
  "timestamp": 1234567890
}
```

### Étape 4 : Ajouter au Panier

1. Cliquer sur "Choisir la quantité & taille"
2. Sélectionner une taille (ex: M) et quantité (ex: 1)
3. Cliquer sur "Ajouter au panier"

### Étape 5 : Analyser les Logs de la Console

Vous devriez voir une séquence de logs comme suit :

#### A. Lecture du localStorage (handleAddToCart)

```
📦 [Customization] Données récupérées depuis localStorage: {elements: Array(1), ...}
📝 [Customization] Éléments à sauvegarder: [...]
📝 [Customization] Détail des éléments: {
  source: "localStorage",
  count: 1,
  elements: [{id: "...", type: "text", text: "Mon Texte"}]
}
```

**✅ Bon signe :** Le count est > 0 et correspond au nombre d'éléments ajoutés

**❌ Problème :** Si count = 0 ou elements = [], cela signifie que :
- Soit les éléments n'ont pas été sauvegardés dans le localStorage
- Soit il y a un problème avec la clé de localStorage

#### B. Sauvegarde de la Personnalisation (API)

```
✅ [Customization] Personnalisation sauvegardée avec ID: 123
```

**✅ Bon signe :** La personnalisation a été sauvegardée en BDD

**❌ Problème :** Si erreur API, vérifier la connexion backend

#### C. Ajout au Panier (CartContext)

```
🛒 [Customization] Ajout article au panier: {
  size: "M",
  customizationId: 123,
  designElementsCount: 1,
  designElements: [...]
}
🛒 [CartContext] Nouveau produit, ajout au panier
🎨 [CartContext] Personnalisation incluse: {
  customizationId: 123,
  hasDesignElements: true,
  designElementsLength: 1,
  designElements: [...]
}
```

**✅ Bon signe :**
- `hasDesignElements: true`
- `designElementsLength > 0`
- `designElements` contient les données

**❌ Problème :** Si `hasDesignElements: false` ou `designElementsLength: 0` :
- Le passage des données de `handleAddToCart` à `addToCart` a échoué
- Vérifier que `elementsToSave` est bien passé

#### D. Sauvegarde du Panier dans localStorage

```
💾 [CartContext] Sauvegarde panier dans localStorage: {
  itemCount: 1,
  itemsWithCustomization: 1,
  itemsWithElements: 1
}
```

**✅ Bon signe :**
- `itemsWithCustomization > 0`
- `itemsWithElements > 0`

**❌ Problème :** Si `itemsWithElements: 0` :
- Les designElements ne sont pas sauvegardés dans les items du panier
- Vérifier le code de création du `newItem` dans CartContext

#### E. Affichage dans le Drawer (CartSidebar)

```
🔍 [CartSidebar] Item inspection: {
  id: "123-Bleu-M",
  customizationId: 123,
  hasDesignUrl: false,
  designElements: [...],
  designElementsLength: 1
}
🎨 [CartSidebar] Élément de design: {type: "text", text: "Mon Texte", ...}
```

**✅ Bon signe :**
- `customizationId` présent
- `designElementsLength > 0`
- Chaque élément est affiché

**❌ Problème :** Si `designElementsLength: undefined` ou `0` :
- Les items du panier ne contiennent pas designElements
- Vérifier le chargement du panier depuis localStorage

---

## 🔧 Diagnostics des Problèmes Courants

### Problème 1 : designElements vide au moment de l'ajout au panier

**Symptôme :**
```
📝 [Customization] Détail des éléments: {count: 0, elements: []}
```

**Causes possibles :**
1. Les éléments n'ont pas été ajoutés via ProductDesignEditor
2. Le localStorage n'a pas été mis à jour
3. La clé de localStorage est incorrecte

**Solution :**
1. Vérifier que `handleElementsChange` est appelé dans ProductDesignEditor
2. Vérifier l'auto-sauvegarde :
   ```
   💾 Auto-sauvegarde localStorage: {elements: Array(X), ...}
   ```
3. Inspecter le localStorage manuellement :
   ```javascript
   Object.keys(localStorage).filter(k => k.includes('design-data'))
   ```

### Problème 2 : designElements perdus lors de l'ajout au panier

**Symptôme :**
```
🛒 [Customization] Ajout article au panier: {designElementsCount: 1, ...}
🎨 [CartContext] Personnalisation incluse: {hasDesignElements: false}
```

**Causes possibles :**
1. Le paramètre `designElements` n'est pas passé correctement à `addToCart`
2. Problème de typage TypeScript

**Solution :**
1. Vérifier dans `CustomerProductCustomizationPageV3.tsx` ligne ~446 :
   ```typescript
   addToCart({
     ...
     designElements: elementsToSave  // Doit être présent
   });
   ```
2. Vérifier que `CartContext.tsx` accepte bien `designElements` dans la signature

### Problème 3 : designElements perdus dans le localStorage du panier

**Symptôme :**
```
💾 [CartContext] Sauvegarde panier: {itemsWithElements: 0}
```

**Causes possibles :**
1. Le type `CartItem` ne contient pas `designElements`
2. La sérialisation JSON échoue silencieusement

**Solution :**
1. Vérifier `src/types/cart.ts` :
   ```typescript
   export interface CartItem {
     ...
     customizationId?: number;
     designElements?: any[];  // Doit être présent
   }
   ```
2. Vérifier manuellement le localStorage du panier :
   ```javascript
   JSON.parse(localStorage.getItem('cart'))
   ```

### Problème 4 : designElements ne s'affichent pas dans le drawer

**Symptôme :**
- Logs montrent que designElements existent
- Badge "Produit personnalisé" ne s'affiche pas

**Causes possibles :**
1. La condition d'affichage dans CartSidebar est fausse
2. designElements est un tableau vide `[]`

**Solution :**
1. Vérifier dans `CartSidebar.tsx` ligne ~557 :
   ```typescript
   (item.customizationId || item.designUrl) && (...)
   ```
2. Vérifier ligne ~567 :
   ```typescript
   {item.designElements && item.designElements.length > 0 && (...)}
   ```

---

## 🎯 Points de Contrôle Critiques

### 1. Sauvegarde initiale (ProductDesignEditor → State)

**Fichier :** `CustomerProductCustomizationPageV3.tsx`
**Fonction :** `handleElementsChange` (ligne ~219)

```typescript
const handleElementsChange = useCallback((newElements: typeof designElements) => {
  console.log('🔄 [Customization] Éléments changés:', newElements);
  setDesignElements(newElements);
}, []);
```

### 2. Auto-sauvegarde dans localStorage

**Fichier :** `CustomerProductCustomizationPageV3.tsx`
**useEffect :** Auto-sauvegarde (ligne ~238)

```typescript
useEffect(() => {
  // ...
  const dataToSave = {
    elements: designElements,  // CRITIQUE
    colorVariationId: selectedColorVariation?.id,
    viewId: selectedView?.id,
    timestamp: Date.now()
  };
  localStorage.setItem(storageKey, JSON.stringify(dataToSave));
}, [designElements, selectedColorVariation, selectedView, id]);
```

### 3. Lecture depuis localStorage lors de l'ajout au panier

**Fichier :** `CustomerProductCustomizationPageV3.tsx`
**Fonction :** `handleAddToCart` (ligne ~385)

```typescript
const storageKey = `design-data-product-${id}`;
const saved = localStorage.getItem(storageKey);
const savedData = JSON.parse(saved);
const elementsToSave = savedData?.elements || designElements;  // CRITIQUE
```

### 4. Passage des données à CartContext

**Fichier :** `CustomerProductCustomizationPageV3.tsx`
**Fonction :** `handleAddToCart` (ligne ~436)

```typescript
addToCart({
  ...
  customizationId: result.id,
  designElements: elementsToSave  // CRITIQUE
});
```

### 5. Création de l'item dans le panier

**Fichier :** `CartContext.tsx`
**Fonction :** `addToCart` (ligne ~195)

```typescript
const newItem: CartItem = {
  ...
  customizationId: product.customizationId,
  designElements: product.designElements  // CRITIQUE
};
```

### 6. Affichage dans le drawer

**Fichier :** `CartSidebar.tsx`
**Ligne :** ~567

```typescript
{item.designElements && item.designElements.length > 0 && (
  <div className="space-y-2">
    {item.designElements.map((element: any, idx: number) => (
      // Affichage de chaque élément
    ))}
  </div>
)}
```

---

## 📊 Flux de Données Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utilisateur ajoute du texte via ProductDesignEditor     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ProductDesignEditor appelle onElementsChange            │
│    → handleElementsChange(newElements)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. setDesignElements(newElements)                           │
│    → State mis à jour                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. useEffect détecte changement de designElements           │
│    → Auto-sauvegarde dans localStorage                      │
│    → Clé: `design-data-product-${id}`                       │
│    → Valeur: {elements: [...], colorVariationId, viewId}    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Utilisateur clique "Ajouter au panier"                  │
│    → handleAddToCart(selections)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Lecture du localStorage                                  │
│    → savedData = JSON.parse(localStorage.getItem(...))      │
│    → elementsToSave = savedData?.elements || designElements │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Sauvegarde en BDD (customizationService)                │
│    → customizationId généré                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Appel addToCart(CartContext)                             │
│    → Passage de customizationId + designElements            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Création du CartItem                                     │
│    → newItem avec customizationId + designElements          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Sauvegarde du panier dans localStorage                  │
│     → Clé: 'cart'                                           │
│     → Valeur: [CartItem, ...]                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. Ouverture du drawer (openCart)                         │
│     → CartSidebar reçoit items via CartContext              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 12. CartSidebar affiche les items                          │
│     → Pour chaque item avec customizationId:                │
│       - Badge "Produit personnalisé"                        │
│       - Liste des designElements                            │
│       - Aperçu texte/images                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Vérification

Avant de rapporter un bug, vérifier que :

- [ ] Le serveur de développement est bien démarré (`npm run dev`)
- [ ] Aucune erreur dans la console avant de commencer le test
- [ ] Le localStorage a été vidé avant le test
- [ ] Le produit a bien des delimitations configurées
- [ ] Au moins un élément de design a été ajouté (texte ou image)
- [ ] L'auto-sauvegarde dans localStorage a bien eu lieu
- [ ] Tous les logs de débogage sont visibles dans la console
- [ ] Le backend est accessible (API customizations)

---

## 🐛 Rapport de Bug

Si le problème persiste, noter :

1. **Logs de la console** (copier-coller complet)
2. **Contenu du localStorage :**
   ```javascript
   // Design data
   localStorage.getItem('design-data-product-XXX')

   // Cart data
   localStorage.getItem('cart')
   ```
3. **État du panier au moment du problème :**
   ```javascript
   // Dans CartSidebar, ajouter temporairement :
   console.log('Items du panier:', items)
   ```

---

## 📝 Notes Importantes

1. **localStorage vs State :** Le code privilégie le localStorage comme source de vérité car le state peut être réinitialisé lors de rerenders.

2. **Timing :** Les logs doivent apparaître dans l'ordre du flux ci-dessus. Si l'ordre est différent, c'est un signe de problème.

3. **Fallback :** Le code utilise `savedData?.elements || designElements` pour avoir un fallback au cas où le localStorage ne serait pas accessible.

4. **Sérialisation :** JSON.stringify/parse peut échouer silencieusement sur des données circulaires ou trop volumineuses.

---

## 🚀 Prochaines Étapes si tout fonctionne

Une fois le débogage terminé et l'affichage fonctionnel :

1. Supprimer les logs de débogage excessifs (garder seulement les logs importants)
2. Tester avec des cas limites :
   - Beaucoup d'éléments (10+)
   - Images lourdes
   - Textes très longs
   - Caractères spéciaux
3. Tester le refresh de page avec panier rempli
4. Tester la commande avec produits personnalisés

---

**Dernière mise à jour :** 2025-11-14
**Fichiers concernés :**
- `src/pages/CustomerProductCustomizationPageV3.tsx`
- `src/contexts/CartContext.tsx`
- `src/components/CartSidebar.tsx`
- `src/types/cart.ts`
