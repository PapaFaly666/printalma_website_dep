# 🔄 Sauvegarde automatique des personnalisations

**Status:** ✅ Implémenté et actif

---

## 🎯 Problème résolu

**Avant:** Si vous créez une personnalisation et actualisez la page (F5), tout est perdu.

**Maintenant:** Vos personnalisations sont automatiquement sauvegardées et récupérées!

---

## 💾 Comment ça marche?

### 1. **Sauvegarde automatique en temps réel**

Dès que vous modifiez votre design, 2 sauvegardes sont déclenchées:

#### A. localStorage (instantané)
```
Vous ajoutez du texte
  ↓
💾 Sauvegarde immédiate dans localStorage
  ↓
Disponible instantanément même hors ligne
```

#### B. Backend (toutes les 10 secondes)
```
Première modification
  ↓
⏱️ Attente 3 secondes
  ↓
💾 Sauvegarde backend (POST /customizations)
  ↓
Puis toutes les 10 secondes
  ↓
💾 Mise à jour backend automatique
```

### 2. **Récupération automatique au chargement (en 2 étapes)**

```
Vous ouvrez /product/1/customize
  ↓
ÉTAPE 1: Restauration couleur/vue (immédiate)
  ↓
📦 Lecture localStorage
  ↓
🎨 Restauration selectedColorVariation
🖼️ Restauration selectedView
  ↓
ÉTAPE 2: Attente que le canvas soit prêt (300ms)
  ↓
✅ Canvas initialisé avec bonnes dimensions
  ↓
📦 Restauration des éléments depuis localStorage
  ↓
🎨 Application dans setDesignElements() (state)
  ↓
⏱️ Attente supplémentaire (500ms)
  ↓
🎨 Application dans editorRef.setElements() (canvas)
  ↓
Toast: "X élément(s) récupéré(s)"
```

**Pourquoi 2 étapes?**
- Le canvas a besoin de la couleur et vue pour calculer les dimensions
- Les positions des éléments sont calculées en fonction du canvas
- Si on restaure trop tôt, les positions seront incorrectes

---

## ⚡ Fonctionnalités

### ✅ Sauvegarde intelligente

- **Instantanée** dans localStorage (0ms de latence)
- **Automatique** dans backend (toutes les 10s)
- **Silencieuse** (pas de toast à chaque auto-save)
- **Optimisée** (ne sauvegarde que s'il y a des éléments)

### ✅ Récupération prioritaire

1. **Backend en priorité** (données partagées entre appareils)
2. **localStorage en fallback** (si backend indisponible)
3. **Gestion d'erreurs** (toujours un fallback fonctionnel)

### ✅ Protection des données

- Double sauvegarde (localStorage + backend)
- Pas de perte même si le serveur est down
- SessionId persistant pour les guests

---

## 🧪 Test

### Scénario 1: Sauvegarde automatique

1. Ouvrir: `http://localhost:5174/product/1/customize`
2. Ajouter du texte "Test Auto-Save"
3. Attendre 3 secondes
4. Vérifier la console (F12):
   ```
   💾 [Auto-save] Sauvegarde automatique backend réussie
   ```
5. Attendre 10 secondes → nouvelle sauvegarde automatique

### Scénario 2: Récupération après actualisation

1. Créer une personnalisation (ajouter texte + image)
2. Déplacer les éléments aux positions souhaitées
3. **Actualiser la page (F5)**
4. ✅ La couleur et la vue sont restaurées immédiatement
5. ⏱️ Après 300ms: Les éléments apparaissent
6. ✅ Les éléments sont aux BONNES positions (comme avant F5)
7. Toast: "X élément(s) récupéré(s)"

### Scénario 3: Vérifier dans le backend

```bash
# 1. Récupérer votre sessionId
# Console navigateur (F12):
localStorage.getItem('guest-session-id')
# Résultat: "guest-1705147890-abc123"

# 2. Vérifier dans le backend
curl http://localhost:3004/customizations/session/guest-1705147890-abc123

# Résultat:
[
  {
    "id": 1,
    "productId": 1,
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "text": "Test Auto-Save",
        ...
      }
    ],
    "updatedAt": "2025-01-13T12:34:56.789Z"
  }
]
```

---

## 📊 Logs console

### Chargement de la page
```
📦 [Customization] Lecture localStorage pour couleur/vue...
🎨 [Customization] Restauration couleur: { id: 13, ... }
🖼️ [Customization] Restauration vue: { id: 13, ... }
✅ [Customization] Restauration des éléments: [ { id: "element-...", x: 0.496, y: 0.454, ... } ]
🎨 [Customization] Application des éléments dans l'éditeur
```

### Modification en cours
```
💾 Auto-sauvegarde localStorage: { elements: [...], ... }
💾 [Auto-save] Sauvegarde automatique backend réussie
```

### Toutes les 10 secondes (si modifications)
```
💾 [Auto-save] Sauvegarde automatique backend réussie
```

---

## ⚙️ Configuration

### Délais de sauvegarde automatique

```typescript
// Première sauvegarde après modification
const initialTimeout = setTimeout(autoSaveToBackend, 3000); // 3 secondes

// Sauvegardes suivantes
const interval = setInterval(autoSaveToBackend, 10000); // 10 secondes
```

**Pour modifier les délais:**
1. Ouvrir `src/pages/CustomerProductCustomizationPageV3.tsx`
2. Ligne 243: Changer `3000` (temps avant première sauvegarde en ms)
3. Ligne 246: Changer `10000` (intervalle entre sauvegardes en ms)

### Désactiver l'auto-save (non recommandé)

Commenter les lignes 218-252 dans `CustomerProductCustomizationPageV3.tsx`:

```typescript
// Sauvegarde automatique dans le backend toutes les 10 secondes
// useEffect(() => {
//   ... tout le code de l'auto-save
// }, [id, product, designElements, selectedColorVariation, selectedView]);
```

---

## 🔍 Détails techniques

### Ordre de chargement (2 étapes distinctes)

```
ÉTAPE 1: Restauration couleur/vue
├─ Déclenché dès que le produit est chargé
├─ Dépendances: [id, product]
├─ Lit localStorage: design-data-product-{productId}
└─ Définit: selectedColorVariation, selectedView

ÉTAPE 2: Restauration éléments (300ms plus tard)
├─ Déclenché APRÈS que couleur/vue soient définies
├─ Dépendances: [id, product, selectedColorVariation, selectedView]
├─ Attend 300ms (canvas monte et se prépare)
├─ Appelle setDesignElements() (state React)
└─ Appelle editorRef.setElements() après 500ms (canvas Fabric.js)

Pourquoi 2 étapes?
→ Le canvas calcule les positions en fonction des dimensions de l'image
→ Sans couleur/vue, les dimensions sont incorrectes
→ = Positions restaurées au mauvais endroit ❌
```

### Upsert automatique

Le backend utilise un système **upsert** (update or insert):

- Si une personnalisation `draft` existe pour ce produit/session → **Mise à jour**
- Sinon → **Création d'une nouvelle**

Cela évite les doublons et garantit qu'il n'y a qu'une seule personnalisation en cours par produit.

### Données sauvegardées

```typescript
{
  productId: number;              // ID du produit
  colorVariationId: number;       // Couleur choisie
  viewId: number;                 // Vue Front/Back
  designElements: [               // Tous les éléments
    {
      id: string;
      type: 'text' | 'image';
      x, y, width, height;        // Position et taille
      rotation: number;           // Rotation en degrés
      zIndex: number;             // Ordre d'affichage
      // ... propriétés spécifiques au type
    }
  ],
  sessionId: string;              // Pour identifier le guest
}
```

---

## 🐛 Résolution de problèmes

### Problème: Auto-save ne fonctionne pas

**Vérifier:**
1. Backend tourne: `curl http://localhost:3004/health`
2. Console logs (F12): Voir les erreurs d'auto-save
3. Network tab (F12): Vérifier les requêtes POST /customizations

**Solution:**
```javascript
// Console navigateur (F12)
// Vérifier le sessionId
localStorage.getItem('guest-session-id')

// Forcer une sauvegarde manuelle
const customizationService = await import('./services/customizationService');
const sessionId = customizationService.default.getOrCreateSessionId();
console.log('SessionId:', sessionId);
```

### Problème: Design non restauré aux bonnes positions après F5

**Causes possibles:**
1. ❌ Les éléments sont restaurés AVANT que le canvas soit prêt
2. ❌ La couleur/vue ne sont pas restaurées en premier
3. ❌ Le délai d'attente est trop court

**Solution (déjà implémentée):**
Le système utilise maintenant 2 useEffect séparés:

```javascript
// useEffect 1: Restaure couleur/vue immédiatement
useEffect(() => {
  // Restaure selectedColorVariation et selectedView
}, [id, product]);

// useEffect 2: Restaure éléments APRÈS
useEffect(() => {
  // Attend que selectedColorVariation ET selectedView soient définis
  if (!selectedColorVariation || !selectedView) return;

  // Attend 300ms pour que le canvas monte
  setTimeout(() => {
    setDesignElements(data.elements);

    // Attend 500ms de plus pour le canvas Fabric.js
    setTimeout(() => {
      editorRef.current?.setElements(data.elements);
    }, 500);
  }, 300);
}, [id, product, selectedColorVariation, selectedView]);
```

**Vérification:**
```javascript
// Console navigateur (F12) - Vous devriez voir dans l'ordre:
// 1. 📦 [Customization] Lecture localStorage pour couleur/vue...
// 2. 🎨 [Customization] Restauration couleur: {...}
// 3. 🖼️ [Customization] Restauration vue: {...}
// 4. ✅ [Customization] Restauration des éléments: [...]
// 5. 🎨 [Customization] Application des éléments dans l'éditeur
```

### Problème: Trop de requêtes backend

**Si l'auto-save toutes les 10s est trop fréquent:**

1. Augmenter l'intervalle à 30s ou 60s
2. Ou utiliser seulement la sauvegarde manuelle (bouton "Enregistrer")

---

## ✅ Avantages

1. **Aucune perte de données** même après F5
2. **Transparente pour l'utilisateur** (silencieuse)
3. **Fonctionnement hors ligne** (localStorage)
4. **Synchronisation multi-appareils** possible (même sessionId)
5. **Pas de surprise** pour l'utilisateur (toast au chargement)

---

## 📝 Prochaines améliorations possibles

### 1. Indicateur visuel d'auto-save
```typescript
// Afficher un petit badge "Sauvegardé" pendant 2s
<span className="text-xs text-green-600">
  ✓ Sauvegardé
</span>
```

### 2. Sauvegarde avant fermeture de page
```typescript
// Détecter la fermeture et sauvegarder
window.addEventListener('beforeunload', async (e) => {
  await customizationService.saveCustomization(data);
});
```

### 3. Historique des versions
- Garder les 5 dernières versions
- Permettre de revenir en arrière
- Afficher un diff des changements

### 4. Partage de designs
- Générer un lien de partage
- QR code pour mobile
- Collaboration en temps réel

---

**🎉 Votre travail est maintenant protégé automatiquement!**

Plus besoin de se souvenir de cliquer sur "Enregistrer" - c'est fait automatiquement en arrière-plan.
