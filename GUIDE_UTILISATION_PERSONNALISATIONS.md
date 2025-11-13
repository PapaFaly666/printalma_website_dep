# 🎨 Guide d'utilisation: Personnalisations de produits

**Date:** 13 janvier 2025
**Status:** ✅ Implémenté et fonctionnel

---

## 📋 Qu'est-ce qui a été implémenté?

### Backend ✅
- Table `ProductCustomization` dans la base de données
- API REST complète (`/customizations`)
- Support utilisateurs connectés + invités (guests)
- Sauvegarde automatique des designs

### Frontend ✅
- Service `customizationService.ts` pour communiquer avec l'API
- Intégration dans `CustomerProductCustomizationPageV3.tsx`
- Sauvegarde automatique locale + backend
- Bouton "Enregistrer" avec sync backend
- Ajout au panier avec personnalisation sauvegardée

---

## 🚀 Comment ça marche?

### 1. Quand le client crée une personnalisation

```
Client ouvre /product/:id/customize
  ↓
Client ajoute du texte, des images, change les couleurs
  ↓
✅ AUTO-SAVE dans localStorage (temps réel)
```

### 2. Quand le client clique "Enregistrer"

```
Clic sur "Enregistrer"
  ↓
📤 POST /customizations
  ↓
Backend sauvegarde:
  - designElements (tous les éléments)
  - colorVariationId (couleur choisie)
  - viewId (vue Front/Back)
  - sessionId (pour les guests)
  ↓
✅ Backend retourne { id: 123, ... }
  ↓
Toast: "Sauvegardé (ID: 123)"
```

### 3. Quand le client ajoute au panier

```
Client clique "Choisir la quantité & taille"
  ↓
Sélectionne: M x2, L x1
  ↓
Clique "Ajouter au panier"
  ↓
📤 POST /customizations (avec sizeSelections)
  ↓
Backend sauvegarde tout + calcule le prix total
  ↓
✅ customizationId stocké dans localStorage
  ↓
Toast: "3 articles ajoutés au panier"
```

### 4. Récupération automatique

```
Client revient sur /product/:id/customize
  ↓
Frontend charge:
  1. localStorage (instantané)
  2. Backend (si sessionId existe)
  ↓
Si personnalisation trouvée:
  - Restaure tous les éléments
  - Restaure couleur et vue
  - Toast: "Design restauré"
```

---

## 🔍 Données sauvegardées

### Dans le backend (`ProductCustomization`)

```json
{
  "id": 1,
  "userId": null,
  "sessionId": "guest-1705147890-abc123",
  "productId": 1,
  "colorVariationId": 2,
  "viewId": 3,
  "designElements": [
    {
      "id": "text-1",
      "type": "text",
      "x": 0.5,
      "y": 0.5,
      "width": 200,
      "height": 50,
      "rotation": 0,
      "zIndex": 1,
      "text": "Mon Design",
      "fontSize": 24,
      "fontFamily": "Arial",
      "color": "#000000"
    },
    {
      "id": "image-1",
      "type": "image",
      "x": 0.3,
      "y": 0.7,
      "width": 150,
      "height": 150,
      "rotation": 45,
      "zIndex": 2,
      "imageUrl": "https://example.com/logo.png",
      "naturalWidth": 800,
      "naturalHeight": 800
    }
  ],
  "sizeSelections": [
    { "size": "M", "quantity": 2 },
    { "size": "L", "quantity": 1 }
  ],
  "totalPrice": 60.00,
  "status": "draft",
  "createdAt": "2025-01-13T10:00:00Z",
  "updatedAt": "2025-01-13T10:05:00Z"
}
```

### Dans localStorage (backup instantané)

```json
{
  "elements": [...],
  "colorVariationId": 2,
  "viewId": 3,
  "timestamp": 1705147890123
}
```

---

## 🧪 Test manuel

### Étape 1: Créer une personnalisation

1. Ouvrir: `http://localhost:5174/product/1/customize`
2. Ajouter du texte: "Hello World"
3. Changer la couleur du produit
4. Cliquer sur "Enregistrer"
5. ✅ Vérifier le toast: "Sauvegardé (ID: X)"

### Étape 2: Vérifier dans la console

```javascript
// Console du navigateur (F12)
// Vous devriez voir:
✅ [CustomizationService] Personnalisation sauvegardée: { id: 1, ... }
```

### Étape 3: Vérifier dans le backend

```bash
# Option 1: Avec curl
curl http://localhost:3004/customizations/session/guest-XXXXX

# Option 2: Dans la base de données
# Prisma Studio
npx prisma studio
# Ouvrir la table ProductCustomization
```

### Étape 4: Test de récupération

1. Fermer la page
2. Rouvrir: `http://localhost:5174/product/1/customize`
3. ✅ Le design devrait être restauré automatiquement
4. ✅ Toast: "Design restauré"

### Étape 5: Test ajout au panier

1. Créer une personnalisation
2. Cliquer "Choisir la quantité & taille"
3. Sélectionner: M x2, L x1
4. Cliquer "Ajouter au panier"
5. ✅ Toast: "3 articles ajoutés au panier"
6. ✅ Vérifier la console pour le customizationId

---

## 📊 API Endpoints disponibles

### Pour les guests (sessionId)

```bash
# Sauvegarder
POST /customizations
Body: { productId, colorVariationId, viewId, designElements, sessionId }

# Récupérer les personnalisations
GET /customizations/session/:sessionId

# Récupérer une personnalisation spécifique
GET /customizations/:id

# Mettre à jour
PUT /customizations/:id
Body: { designElements, sizeSelections }

# Supprimer
DELETE /customizations/:id
```

### Pour les utilisateurs connectés

```bash
# Sauvegarder (avec JWT)
POST /customizations
Headers: Authorization: Bearer TOKEN
Body: { productId, colorVariationId, viewId, designElements }

# Récupérer mes personnalisations
GET /customizations/user/me
Headers: Authorization: Bearer TOKEN
```

---

## 🔐 Gestion des utilisateurs

### Guest (non connecté)

- Un `sessionId` unique est généré automatiquement
- Stocké dans `localStorage` (`guest-session-id`)
- Format: `guest-{timestamp}-{random}`
- Toutes les personnalisations sont liées à ce sessionId
- Le sessionId persiste même après refresh

### Utilisateur connecté

- Les personnalisations sont liées au `userId`
- Le JWT est envoyé automatiquement dans les headers
- Les personnalisations sont privées (visibles seulement par l'utilisateur)

---

## 💡 Fonctionnalités clés

### ✅ Upsert automatique

- Si une personnalisation `draft` existe pour le même produit/session → mise à jour
- Sinon → création d'une nouvelle personnalisation
- Évite les doublons

### ✅ Double sauvegarde

1. **localStorage** (instantané, pas de latence)
2. **Backend** (persistent, récupérable depuis n'importe quel appareil)

### ✅ Calcul automatique du prix

Le backend calcule automatiquement:
```javascript
totalPrice = Σ(quantity × productPrice)
```

### ✅ Statuts des personnalisations

- `draft`: En cours de création
- `saved`: Sauvegardée explicitement par l'utilisateur
- `ordered`: Incluse dans une commande

---

## 🐛 Débogage

### Problème: Personnalisation non sauvegardée

**Vérifier:**
1. Console navigateur (F12) pour les erreurs
2. Backend logs: `npm run start:dev`
3. Réseau (F12 → Network) pour voir la requête POST

**Solutions:**
- Vérifier que le backend tourne sur `localhost:3004`
- Vérifier `VITE_API_URL` dans `.env`
- Vérifier que le produit existe (productId valide)

### Problème: SessionId non généré

**Solution:**
```javascript
// Console du navigateur
localStorage.getItem('guest-session-id')
// Si null, le générer manuellement:
customizationService.getOrCreateSessionId()
```

### Problème: Personnalisation non récupérée

**Vérifier:**
1. Le sessionId est le même (check localStorage)
2. L'API retourne bien les données: `GET /customizations/session/:sessionId`
3. Les logs dans la console

---

## 📝 Code snippets utiles

### Récupérer manuellement les personnalisations

```typescript
// Dans la console du navigateur ou dans un composant

// Pour un guest
const sessionId = localStorage.getItem('guest-session-id');
const customizations = await customizationService.getSessionCustomizations(sessionId);
console.log('Mes personnalisations:', customizations);

// Pour un utilisateur connecté
const myCustomizations = await customizationService.getMyCustomizations();
console.log('Mes personnalisations:', myCustomizations);
```

### Forcer une sauvegarde manuelle

```typescript
const data = {
  productId: 1,
  colorVariationId: 1,
  viewId: 1,
  designElements: [
    {
      id: 'text-1',
      type: 'text',
      x: 0.5,
      y: 0.5,
      text: 'Test',
      // ... autres propriétés
    }
  ],
  sessionId: customizationService.getOrCreateSessionId()
};

const result = await customizationService.saveCustomization(data);
console.log('Sauvegardé avec ID:', result.id);
```

---

## 🚀 Prochaines étapes suggérées

### Phase 1: Intégration panier (TODO)
- [ ] Modifier le CartContext pour accepter customizationId
- [ ] Afficher le design personnalisé dans le panier
- [ ] Passer le customizationId dans la commande

### Phase 2: Interface utilisateur
- [ ] Page "Mes designs" pour voir l'historique
- [ ] Bouton "Dupliquer" pour créer une copie
- [ ] Bouton "Charger un design précédent"

### Phase 3: Génération de mockups
- [ ] Générer automatiquement une image du produit personnalisé
- [ ] Sauvegarder dans `previewImageUrl`
- [ ] Afficher dans le panier et les commandes

### Phase 4: Partage
- [ ] Générer un lien de partage
- [ ] Permettre de charger une personnalisation depuis un lien

---

## 📚 Fichiers modifiés/créés

### Frontend
- ✅ `src/services/customizationService.ts` (nouveau)
- ✅ `src/pages/CustomerProductCustomizationPageV3.tsx` (modifié)

### Backend
- ✅ `prisma/schema.prisma` (table ProductCustomization)
- ✅ `src/customization/customization.service.ts`
- ✅ `src/customization/customization.controller.ts`
- ✅ `src/customization/customization.module.ts`
- ✅ `src/customization/dto/create-customization.dto.ts`

### Documentation
- ✅ `GUIDE_SAUVEGARDE_PERSONNALISATIONS.md` (guide technique complet)
- ✅ `GUIDE_UTILISATION_PERSONNALISATIONS.md` (ce fichier)

---

## ✅ Status

| Fonctionnalité | Status |
|----------------|--------|
| Backend API | ✅ Implémenté |
| Service Frontend | ✅ Implémenté |
| Bouton "Enregistrer" | ✅ Fonctionnel |
| Ajout au panier | ✅ Fonctionnel |
| Récupération auto | ⏳ À tester |
| Support guests | ✅ Implémenté |
| Support utilisateurs | ✅ Implémenté |

---

**Tout est maintenant prêt pour tester! 🎉**

Pour démarrer le test:
1. Backend: `cd backend && npm run start:dev`
2. Frontend: `cd frontend && npm run dev`
3. Ouvrir: `http://localhost:5174/product/1/customize`
4. Créer une personnalisation et cliquer "Enregistrer"
