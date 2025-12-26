# ✅ Correction - Service Vendor Onboarding

## 🐛 Problème rencontré

```
POST http://localhost:3004/api/vendor/complete-onboarding 400 (Bad Request)
Error: Invalid `this.prisma.user.findUnique()`
```

### Cause
Le service utilisait `axios` avec `withCredentials: true` mais ne gérait pas correctement l'authentification JWT requise par le backend NestJS/Prisma.

---

## ✅ Solution implémentée

### 1. Utilisation de `hybridAuthService`

Le backend PrintAlma utilise un système d'authentification hybride :
- **Cookies HTTP-only** (principal)
- **JWT Bearer Token** (fallback)

Le service `hybridAuthService` gère automatiquement les deux méthodes.

### 2. Modifications apportées

**Fichier modifié** : `src/services/vendorOnboardingService.ts`

#### Avant (avec axios)
```typescript
import axios from 'axios';

async completeOnboarding(data, profileImage) {
  const formData = new FormData();
  // ...
  const response = await axios.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  });
}
```

#### Après (avec hybridAuthService)
```typescript
import { hybridAuthService } from './hybridAuthService';

async completeOnboarding(data, profileImage) {
  const formData = new FormData();
  // ...

  const headers = hybridAuthService.getAuthHeaders();
  delete headers['Content-Type']; // FormData génère automatiquement le boundary

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
    credentials: 'include',
  });
}
```

### 3. Tous les endpoints mis à jour

✅ `completeOnboarding()` - Upload avec FormData
✅ `getProfileStatus()` - GET avec auth
✅ `getOnboardingInfo()` - GET avec auth
✅ `updatePhones()` - PUT avec JSON

---

## 🔑 Authentification hybride

### Comment ça fonctionne

1. **Tentative 1** : Cookies HTTP-only
   ```http
   POST /api/vendor/complete-onboarding
   Cookie: connect.sid=xxx
   ```

2. **Tentative 2** (si 401) : JWT Bearer Token
   ```http
   POST /api/vendor/complete-onboarding
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Cookie: connect.sid=xxx
   ```

### Où est stocké le token JWT ?

```javascript
// Dans localStorage
const authSession = localStorage.getItem('auth_session');
const data = JSON.parse(authSession);
const token = data.token || data.jwt;
```

Le `hybridAuthService` charge automatiquement le token depuis `localStorage` à l'initialisation.

---

## 📊 Flux complet

```
Frontend (VendorOnboardingPage)
    ↓
vendorOnboardingService.completeOnboarding()
    ↓
hybridAuthService.getAuthHeaders()
    ↓ (charge token depuis localStorage si disponible)
fetch avec FormData + headers
    ↓
Backend NestJS (/api/vendor/complete-onboarding)
    ↓
Middleware authenticateVendor
    ↓ (vérifie Authorization: Bearer <token>)
Prisma.user.findUnique({ where: { id: decoded.userId }})
    ↓
Controller completeOnboarding
```

---

## 🧪 Test de l'authentification

### Vérifier le token dans la console

```javascript
// Dans la console du navigateur
const authSession = localStorage.getItem('auth_session');
console.log('Session:', JSON.parse(authSession));

// Vérifier si le token est chargé
import { hybridAuthService } from './services/hybridAuthService';
hybridAuthService.loadTokenFromStorage();
```

### Logs détaillés

Le service affiche maintenant des logs complets :

```
📤 Préparation des données pour l'onboarding...
📞 Téléphones: [{number: "+221771234567", isPrimary: true}, ...]
🌐 Réseaux sociaux: [{platform: "facebook", url: "..."}]
📸 Photo de profil: profile.jpg 125648 bytes
🔑 Headers d'authentification: {Authorization: "Bearer ..."}
📡 Réponse du serveur: 200 OK
✅ Onboarding complété: {success: true, ...}
```

---

## 🔧 Configuration requise

### 1. Variables d'environnement

```env
# .env
VITE_API_URL=http://localhost:3004
```

### 2. Backend doit accepter

```typescript
// Headers attendus par le backend
{
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'multipart/form-data; boundary=...'  // Auto-généré
}
```

### 3. CORS configuré

```typescript
// backend main.ts
app.enableCors({
  origin: 'http://localhost:5174',
  credentials: true,
});
```

---

## 🐛 Debugging

### Erreur 400 Bad Request

**Cause possible** : Le token JWT est invalide ou manquant

**Solution** :
```javascript
// Vérifier dans la console
localStorage.getItem('auth_session')

// Recharger le token
import { hybridAuthService } from './services/hybridAuthService';
hybridAuthService.loadTokenFromStorage();
```

### Erreur 401 Unauthorized

**Cause** : Token expiré ou utilisateur n'est pas un VENDEUR

**Solution** :
1. Se reconnecter
2. Vérifier le rôle dans la session : `JSON.parse(localStorage.getItem('auth_session')).user.role`

### Erreur CORS

**Cause** : Frontend ne tourne pas sur `http://localhost:5174`

**Solution** :
```bash
# Vérifier l'URL
npm run dev
# Devrait afficher : Local: http://localhost:5174/
```

---

## ✅ Checklist de vérification

- [ ] Le frontend tourne sur `http://localhost:5174`
- [ ] Le backend tourne sur `http://localhost:3004`
- [ ] Le token JWT est dans `localStorage` (vérifier la console)
- [ ] L'utilisateur connecté a le rôle `VENDEUR`
- [ ] Les logs du service s'affichent correctement
- [ ] La requête contient le header `Authorization`
- [ ] Le FormData contient `phones`, `socialMedia` (optionnel), `profileImage`

---

## 📝 Notes importantes

1. **Ne pas définir `Content-Type` pour FormData**
   - Le navigateur génère automatiquement le `boundary`
   - Définir manuellement causera une erreur 400

2. **Utiliser `hybridAuthService` pour toutes les requêtes authentifiées**
   - Ne pas utiliser axios directement
   - Le service gère cookies + JWT automatiquement

3. **Logs détaillés activés**
   - Surveiller la console pour debug
   - Tous les appels affichent leurs données

---

## 🚀 Prochaines étapes

1. ✅ Service frontend corrigé
2. ⏳ Tester l'onboarding complet
3. ⏳ Vérifier la redirection après onboarding
4. ⏳ Tester la modification des numéros

**Le service est maintenant compatible avec l'authentification du backend !** 🎉
