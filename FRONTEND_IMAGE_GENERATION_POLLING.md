# 🖼️ Système de Polling de Génération d'Images Multi-Produits

**Date:** 29 janvier 2026
**Version:** 1.0.0
**Auteur:** Claude Sonnet 4.5

---

## 📋 Résumé

Implémentation d'un système de polling automatique pour surveiller la génération des images finales après la création de produits vendeur. Le système utilise l'endpoint `GET /vendor/products/:id/images-status` et affiche un modal de progression qui se ferme automatiquement une fois toutes les images générées.

---

## ✨ Fonctionnalités

- ✅ Polling automatique de plusieurs produits en parallèle
- ✅ Affichage de la progression globale et par produit
- ✅ Fermeture automatique du modal quand toutes les images sont générées
- ✅ Gestion des erreurs avec retry
- ✅ Redirection automatique vers `/vendeur/products` après succès
- ✅ Design moderne avec animations (Framer Motion)

---

## 📁 Fichiers Créés

### 1. Hook de Polling Multi-Produits

**Fichier:** `src/hooks/useMultiProductImagePolling.ts`

Hook personnalisé pour gérer le polling de plusieurs produits simultanément.

**API utilisée:**
```
GET /vendor/products/:id/images-status
```

**Caractéristiques:**
- Polling parallèle de tous les produits
- Intervalle configurable (défaut: 2.5 secondes)
- Agrégation des statuts
- Arrêt automatique quand tous les produits sont terminés
- Timeout configurable (défaut: 120 tentatives = ~5 minutes)

**Interface principale:**
```typescript
interface UseMultiProductImagePollingOptions {
  productIds: number[];
  pollingInterval?: number;
  maxAttempts?: number;
  onAllComplete?: (results: SingleProductStatus[]) => void;
  onProductComplete?: (productId: number, status: SingleProductStatus) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}
```

**Exemple d'utilisation:**
```typescript
const { isPolling, aggregatedStatus, allGenerated } = useMultiProductImagePolling({
  productIds: [123, 124, 125],
  pollingInterval: 2500,
  onAllComplete: (results) => {
    console.log('Toutes les images générées!', results);
  }
});
```

---

### 2. Modal de Progression Multi-Produits

**Fichier:** `src/components/vendor/MultiProductImagesModal.tsx`

Composant React pour afficher la progression de génération d'images.

**Caractéristiques:**
- Affichage de la progression globale (pourcentage, barre de progression)
- Détails par produit (statut, nombre d'images générées)
- Fermeture automatique après succès (délai configurable)
- États: Chargement, En cours, Succès, Erreur
- Design responsive avec dark mode

**Interface principale:**
```typescript
interface MultiProductImagesModalProps {
  productIds: number[];
  isOpen: boolean;
  onClose?: () => void;
  onComplete?: (results: SingleProductStatus[]) => void;
  onError?: (error: string) => void;
  autoCloseDelay?: number; // défaut: 2000ms
}
```

**Exemple d'utilisation:**
```tsx
<MultiProductImagesModal
  productIds={[123, 124, 125]}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onComplete={(results) => {
    console.log('Génération terminée!');
    navigate('/vendeur/products');
  }}
  autoCloseDelay={2000}
/>
```

---

## 🔧 Modifications Apportées

### SellDesignPage.tsx

**Imports ajoutés:**
```typescript
import { MultiProductImagesModal } from '../components/vendor/MultiProductImagesModal';
```

**États ajoutés:**
```typescript
const [createdProductIds, setCreatedProductIds] = useState<number[]>([]);
const [showImagesModal, setShowImagesModal] = useState(false);
```

**Modifications dans `handlePublishProducts`:**

1. **Variable de collecte des productIds:**
```typescript
let allCreatedProductIds: number[] = [];
```

2. **Collecte après chaque création de produits:**
```typescript
// Après chaque appel à publishProducts()
const createdIds = successful.map(r => r.productId).filter((id): id is number => id !== undefined);
allCreatedProductIds.push(...createdIds);
```

3. **Ouverture du modal avec les productIds:**
```typescript
if (allCreatedProductIds.length > 0) {
  setCreatedProductIds(allCreatedProductIds);
  setShowImagesModal(true);
} else {
  // Redirection immédiate si aucun produit créé
  setTimeout(() => navigate('/vendeur/products'), 2000);
}
```

4. **Composant modal ajouté au JSX:**
```tsx
<MultiProductImagesModal
  productIds={createdProductIds}
  isOpen={showImagesModal}
  onClose={() => {
    setShowImagesModal(false);
    setCreatedProductIds([]);
  }}
  onComplete={(results) => {
    setShowImagesModal(false);
    setCreatedProductIds([]);
    setTimeout(() => navigate('/vendeur/products'), 500);
  }}
  autoCloseDelay={2000}
/>
```

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────────────────────┐
│  1. Utilisateur clique "Publier maintenant"                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  2. handlePublishProducts() appelé                          │
│     - Fermeture du modal de confirmation                    │
│     - Affichage du modal de progression ancien              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Création des produits via publishProducts()             │
│     - Appel API: POST /vendor/products                      │
│     - Création en DRAFT/PENDING selon validation design     │
│     - Collecte des productIds retournés                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Fermeture modal ancien + Ouverture nouveau modal        │
│     - setShowProgressModal(false)                           │
│     - setCreatedProductIds([123, 124, 125])                 │
│     - setShowImagesModal(true)                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Polling automatique (useMultiProductImagePolling)       │
│     - Vérification toutes les 2.5 secondes                  │
│     - GET /vendor/products/123/images-status                │
│     - GET /vendor/products/124/images-status                │
│     - GET /vendor/products/125/images-status                │
│     - Agrégation des statuts                                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Mise à jour de l'interface                              │
│     - Barre de progression globale                          │
│     - Statut par produit (X/Y images)                       │
│     - Pourcentage global                                    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Toutes les images générées (allGenerated = true)        │
│     - Callback onAllComplete() appelé                       │
│     - Affichage de l'état de succès                         │
│     - Délai de 2 secondes (autoCloseDelay)                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  8. Fermeture automatique du modal                          │
│     - setShowImagesModal(false)                             │
│     - Redirection vers /vendeur/products                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Réponse API Attendue

**Endpoint:** `GET /vendor/products/:id/images-status`

**Réponse type:**
```json
{
  "success": true,
  "productId": 123,
  "product": {
    "id": 123,
    "status": "PUBLISHED",
    "designId": 42
  },
  "imagesGeneration": {
    "totalExpected": 5,
    "totalGenerated": 5,
    "percentage": 100,
    "allGenerated": true
  },
  "finalImages": [
    {
      "id": 1,
      "colorId": 12,
      "colorName": "Rouge",
      "finalImageUrl": "https://res.cloudinary.com/.../final_123_12.png",
      "imageType": "final"
    },
    {
      "id": 2,
      "colorId": 13,
      "colorName": "Bleu",
      "finalImageUrl": "https://res.cloudinary.com/.../final_123_13.png",
      "imageType": "final"
    }
  ]
}
```

---

## 🎨 Interface Utilisateur

### État: Chargement Initial
```
┌─────────────────────────────────────────┐
│  🖼️ Génération des Images          [X] │
├─────────────────────────────────────────┤
│                                         │
│          ⏳ (spinner animé)             │
│                                         │
│  Chargement du statut de génération... │
│                                         │
└─────────────────────────────────────────┘
```

### État: En Cours
```
┌─────────────────────────────────────────┐
│  🖼️ Génération des Images              │
├─────────────────────────────────────────┤
│  Génération des images en cours...      │
│  2/3 produit(s) terminé(s)              │
│                                         │
│  ████████████░░░░░░░░░░ 60%             │
│  60% (12/20 images)                     │
│                                         │
│  Détails par produit :                  │
│                                         │
│  ✓ 📦 Produit #123     100%             │
│     5/5 images générées                 │
│                                         │
│  ⏳ 📦 Produit #124     60%              │
│     3/5 images                          │
│                                         │
│  ⏳ 📦 Produit #125     40%              │
│     4/10 images                         │
│                                         │
│  🔄 Vérification en cours...            │
└─────────────────────────────────────────┘
```

### État: Succès
```
┌─────────────────────────────────────────┐
│  🖼️ Génération des Images          [X] │
├─────────────────────────────────────────┤
│                                         │
│          ✅ (animation spring)          │
│                                         │
│     Génération terminée !               │
│                                         │
│  20 images générées pour 3 produit(s)   │
│                                         │
│  Fermeture automatique dans 2s...      │
│                                         │
└─────────────────────────────────────────┘
```

### État: Erreur
```
┌─────────────────────────────────────────┐
│  🖼️ Génération des Images          [X] │
├─────────────────────────────────────────┤
│                                         │
│          ❌ (icône rouge)               │
│                                         │
│     Erreur de génération                │
│                                         │
│  Délai d'attente dépassé pour la        │
│  génération des images                  │
│                                         │
│      [ Réessayer ]                      │
│                                         │
└─────────────────────────────────────────┘
```

---

## ⚙️ Configuration

### Paramètres du Polling

**Fichier:** `src/hooks/useMultiProductImagePolling.ts`

```typescript
// Intervalle entre chaque requête (ms)
pollingInterval: 2500  // 2.5 secondes

// Nombre maximum de tentatives avant timeout
maxAttempts: 120  // ~5 minutes (120 × 2.5s)
```

### Délai de Fermeture Automatique

**Fichier:** `src/components/vendor/MultiProductImagesModal.tsx`

```typescript
autoCloseDelay: 2000  // 2 secondes après succès
```

**Fichier:** `src/pages/SellDesignPage.tsx`

```tsx
<MultiProductImagesModal
  autoCloseDelay={2000}  // Configurable ici
  ...
/>
```

---

## 🧪 Tests

### Test Manuel

1. **Créer un produit avec design:**
   - Aller sur `/vendeur/sell-design`
   - Sélectionner un design
   - Choisir un ou plusieurs produits
   - Configurer les couleurs/tailles
   - Cliquer sur "Publier maintenant"

2. **Vérifier le modal de progression:**
   - Le modal ancien devrait se fermer
   - Le nouveau modal `MultiProductImagesModal` devrait s'ouvrir
   - La progression devrait se mettre à jour toutes les 2.5 secondes

3. **Vérifier la fermeture automatique:**
   - Quand toutes les images sont générées (`allGenerated: true`)
   - Le modal devrait afficher "Génération terminée !"
   - Après 2 secondes, le modal devrait se fermer
   - Redirection vers `/vendeur/products` après 0.5 secondes

### Test des Erreurs

1. **Timeout:**
   - Si le polling dépasse 120 tentatives (~5 minutes)
   - Le modal devrait afficher une erreur
   - Bouton "Réessayer" devrait recharger la page

2. **Erreur réseau:**
   - Simuler une erreur réseau (désactiver la connexion)
   - Le modal devrait afficher l'erreur
   - Le polling devrait continuer après reconnexion

---

## 🔍 Débogage

### Logs Console

Le système log chaque étape importante :

```javascript
// Démarrage du polling
🚀 [Multi-Polling] Démarrage pour 3 produit(s): [123, 124, 125]

// Progression
📊 [Multi-Polling] Progression globale: 60% (12/20 images)

// Produit complété
✅ [Produit 123] Toutes les images générées!

// Tous complétés
✅ [Multi-Polling] Toutes les images de tous les produits générées!

// Arrêt du polling
🛑 [Multi-Polling] Arrêt du polling
```

### Vérifier l'état du Hook

```typescript
// Dans MultiProductImagesModal
console.log('État du hook:', {
  isPolling,
  aggregatedStatus,
  allGenerated,
  error
});
```

### Inspecter les Requêtes Réseau

1. Ouvrir DevTools → Onglet Network
2. Filtrer par `/images-status`
3. Vérifier les requêtes toutes les 2.5 secondes
4. Inspecter les réponses JSON

---

## 📝 Notes Importantes

### Anciennes Implémentations

Les fichiers suivants ont été créés précédemment mais **ne sont plus utilisés** :

- ✅ `src/components/vendor/GenerationProgressModal.tsx` - Utilisait un endpoint différent
- ✅ `src/hooks/useGenerationStatus.ts` - Utilisait `/api/public/vendor-products/:productId/generation-status`
- ✅ `src/hooks/useImageGenerationPolling.ts` - Ne gérait qu'un seul produit

Ces fichiers peuvent être **supprimés** ou conservés comme référence.

### Différence avec l'Ancien Système

| Ancien Système | Nouveau Système |
|----------------|-----------------|
| Endpoint: `/api/public/vendor-products/:id/generation-status` | Endpoint: `/vendor/products/:id/images-status` |
| Un seul produit à la fois | Plusieurs produits en parallèle |
| Hook: `useGenerationStatus` | Hook: `useMultiProductImagePolling` |
| Modal: `GenerationProgressModal` | Modal: `MultiProductImagesModal` |

### Authentification

Le hook utilise `credentials: 'include'` pour envoyer automatiquement les cookies de session. Assurez-vous que l'utilisateur est authentifié.

### CORS

Si le polling échoue avec des erreurs CORS, vérifier la configuration du backend :

```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:5174',
  credentials: true
});
```

---

## 🚀 Améliorations Futures Possibles

### 1. Notifications Push

Utiliser WebSockets au lieu du polling pour des mises à jour en temps réel :

```typescript
// backend: Socket.IO
io.on('connection', (socket) => {
  socket.on('subscribe-product', (productId) => {
    // Émettre quand une image est générée
    socket.emit('image-generated', { productId, imageData });
  });
});

// frontend: Hook avec Socket.IO
const { socket } = useSocket();
socket.on('image-generated', (data) => {
  updateProgress(data);
});
```

### 2. Estimations Plus Précises

Calculer le temps restant basé sur les performances réelles :

```typescript
const avgTimePerImage = totalTime / generatedImages;
const remainingTime = avgTimePerImage * remainingImages;
```

### 3. Reprise après Rafraîchissement

Persister l'état dans localStorage pour reprendre après un rafraîchissement :

```typescript
useEffect(() => {
  const saved = localStorage.getItem('pending-products');
  if (saved) {
    const productIds = JSON.parse(saved);
    setCreatedProductIds(productIds);
    setShowImagesModal(true);
  }
}, []);
```

### 4. Mode Arrière-Plan

Permettre à l'utilisateur de continuer à naviguer pendant la génération :

```tsx
<BackgroundTaskIndicator
  tasks={[
    { id: 1, label: 'Génération images produit #123', progress: 60 }
  ]}
  onClickTask={(task) => {
    // Rouvrir le modal de progression
    setShowImagesModal(true);
  }}
/>
```

---

## 📚 Ressources

### Documentation Backend

- `BACKEND_VENDOR_AUTOCOLLANT_GUIDE.md` - Guide de création de stickers
- `BACKEND_AUTOCOLLANT_GUIDE.md` - Système de génération d'images

### Endpoints Utilisés

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/vendor/products` | POST | Créer un produit vendeur |
| `/vendor/products/:id/images-status` | GET | Vérifier statut génération images |

### Dépendances

```json
{
  "framer-motion": "^11.x",
  "lucide-react": "^0.x",
  "react": "^19.x",
  "react-router-dom": "^7.x"
}
```

---

## ✅ Checklist de Validation

- [x] Hook `useMultiProductImagePolling` créé
- [x] Modal `MultiProductImagesModal` créé
- [x] Intégration dans `SellDesignPage`
- [x] Collecte des productIds après création
- [x] Fermeture automatique du modal
- [x] Redirection après succès
- [x] Gestion des erreurs
- [x] Logs de débogage
- [x] Pas d'erreurs TypeScript
- [x] Design responsive
- [x] Support dark mode
- [x] Animations fluides
- [x] Documentation complète

---

**Fin du document**

Date de mise à jour: 29 janvier 2026
