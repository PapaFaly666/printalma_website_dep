# 🐛 Debug - Couleur par Défaut

## Problème Actuel
Les produits s'affichent toujours en **Blanc** au lieu de la couleur par défaut définie (`defaultColorId`).

## 🔍 Comment Débugger

### Étape 1: Ouvrir la Console du Navigateur
1. Ouvrez votre site dans le navigateur
2. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
3. Allez dans l'onglet **Console**

### Étape 2: Rafraîchir la Page Landing
1. Allez sur la page d'accueil (Landing)
2. Regardez la console

### Étape 3: Chercher les Logs de Debug

Vous devriez voir des logs comme ceci pour **chaque produit** :

```
🎨 [SimpleProductPreview] Initialisation couleur pour produit: {
  productId: 18,
  defaultColorId: 4,
  selectedColors: [
    { id: 1, name: "Blanc", colorCode: "#ffffff" },
    { id: 2, name: "Blue", colorCode: "#1134c0" },
    { id: 3, name: "Rouge", colorCode: "#f40101" },
    { id: 4, name: "Noir", colorCode: "#000000" }
  ],
  initialColorId: undefined
}
```

Ensuite, vous verrez **UN** de ces messages :

#### ✅ CAS 1: Tout fonctionne correctement
```
🎨 [SimpleProductPreview] Recherche de la couleur par défaut ID: 4 dans: [...]
🎨 [SimpleProductPreview] ✅ Couleur par défaut trouvée: Noir (ID: 4)
```
→ **Le produit devrait s'afficher en NOIR**

#### ⚠️ CAS 2: defaultColorId non trouvé dans selectedColors
```
🎨 [SimpleProductPreview] Recherche de la couleur par défaut ID: 4 dans: [...]
⚠️ [SimpleProductPreview] Couleur par défaut ID 4 non trouvée dans selectedColors
🎨 [SimpleProductPreview] ⚪ Utilisation de la première couleur: Blanc (ID: 1)
```
→ **Problème:** La couleur par défaut n'est pas dans les couleurs sélectionnées du produit

#### ⚪ CAS 3: Pas de defaultColorId
```
🎨 [SimpleProductPreview] Pas de defaultColorId défini
🎨 [SimpleProductPreview] ⚪ Utilisation de la première couleur: Blanc (ID: 1)
```
→ **Normal:** Le produit n'a pas de couleur par défaut (affiche Blanc)

## 📊 Analyse des Logs

### Si vous voyez le CAS 1 (✅) mais le produit est encore Blanc
**Problème:** Le `currentColorId` est correctement défini, mais l'image ne change pas.

**✅ RÉSOLU:** Ce problème a été corrigé dans `SimpleProductPreview.tsx`. Le composant utilise maintenant `useMemo` pour recalculer l'image lorsque `currentColorId` change.

**Vérification dans les nouveaux logs:**
```javascript
// Vous devriez maintenant voir ces logs:
🖼️ [useMemo] Recalcul de l'image pour currentColorId: 4
🖼️ [useMemo] Image mockup sélectionnée: {
  productId: 18,
  currentColorId: 4,
  currentColorName: "Noir",
  colorVariationId: 4,
  colorVariationName: "Noir",
  mockupImageUrl: "...",
  viewType: "Front"
}
```

Si le recalcul ne se produit pas, vérifiez que `currentColorId` change bien dans les logs d'initialisation.

---

### Si vous voyez le CAS 2 (⚠️)
**Problème:** `defaultColorId` ne correspond à aucune couleur dans `selectedColors`.

**Causes possibles:**
1. Le vendeur a désactivé la couleur par défaut après l'avoir définie
2. Le `defaultColorId` n'est pas correctement sauvegardé dans la base de données
3. L'adaptation dans `NouveauteSection.tsx` ne mappe pas correctement les couleurs

**Solution:** Vérifiez les données de l'API :
```bash
curl http://localhost:3004/public/new-arrivals
```

Cherchez le produit concerné et vérifiez :
- `defaultColorId` est bien défini
- Les `colorVariations` contiennent une couleur avec cet ID
- Cette couleur est bien dans les couleurs disponibles

---

### Si vous voyez le CAS 3 (⚪)
**Problème:** Le `defaultColorId` n'est pas transmis au composant.

**Causes possibles:**
1. L'API ne retourne pas `defaultColorId`
2. L'adaptation dans `NouveauteSection.tsx` ne transmet pas `defaultColorId`

**Vérification dans les logs:**
```
🔍 [adaptNewArrival] Données brutes: {
  ...
  defaultColorId: ???  // ← Vérifiez cette valeur
}
```

## 🔧 Solutions Rapides

### Solution 1: Vérifier l'API
```bash
# Vérifiez que l'API retourne bien defaultColorId
curl http://localhost:3004/public/new-arrivals | grep -A5 defaultColorId
```

### Solution 2: Vérifier l'Adaptation
Ouvrez `/src/pages/NouveauteSection.tsx` ligne 217 et vérifiez :
```typescript
defaultColorId: item.defaultColorId, // ← Cette ligne doit exister
```

### Solution 3: Vérifier selectedColors
Dans la console, vérifiez que `selectedColors` contient bien toutes les couleurs :
```javascript
// Doit contenir au moins 4 couleurs: Blanc, Blue, Rouge, Noir
selectedColors: [
  { id: 1, name: "Blanc", ... },
  { id: 2, name: "Blue", ... },
  { id: 3, name: "Rouge", ... },
  { id: 4, name: "Noir", ... }
]
```

## 📸 Exemple de Debug Réussi

Pour le produit **"Tshirt test couleur"** (ID 18) avec `defaultColorId: 4` :

```
🎨 [SimpleProductPreview] Initialisation couleur pour produit: {
  productId: 18,
  defaultColorId: 4,
  selectedColors: [...4 couleurs...],
  initialColorId: undefined
}
🎨 [SimpleProductPreview] Recherche de la couleur par défaut ID: 4 dans: [...]
🎨 [SimpleProductPreview] ✅ Couleur par défaut trouvée: Noir (ID: 4)
```

→ **Résultat attendu:** Le T-shirt s'affiche en **NOIR** 🖤

## 🆘 Si Rien ne Fonctionne

Partagez les logs de la console en suivant ce format :

```
Produit ID: 18
Nom: Tshirt test couleur
defaultColorId attendu: 4 (Noir)

Logs console:
[Copiez tous les logs 🎨 [SimpleProductPreview] pour ce produit]

Couleur affichée: Blanc (au lieu de Noir)
```

Cela m'aidera à identifier exactement où le problème se situe.
