# Corrections pour le Déploiement en Production

## Problème Identifié
L'application ne parvenait pas à afficher les données du tableau de bord (produits vendeur, designs) depuis la base de données en production car de nombreux appels API utilisaient des URLs hardcodées `http://localhost:3004` au lieu d'utiliser la variable d'environnement `VITE_API_URL`.

## Solutions Appliquées

### 1. ✅ Correction des URLs Hardcodées

Tous les fichiers suivants ont été mis à jour pour utiliser `import.meta.env.VITE_API_URL` :

#### Pages d'Authentification
- `src/components/auth/LoginForm.tsx`
- `src/pages/auth/AdminLoginPage.tsx`
- `src/pages/auth/MixedLoginPage.tsx`
- `src/pages/auth/SecretAdminLoginPage.tsx`
- `src/pages/auth/VendorLoginClassicPage.tsx`
- `src/pages/auth/VendorLoginPage.tsx`
- `src/pages/auth/VendorRegisterPage.tsx`

#### Pages du Tableau de Bord Vendeur
- `src/pages/vendor/VendorDesignsPage.tsx`
- `src/pages/vendor/VendorOrderDetailPage.tsx`
- `src/pages/vendor/VendorWithdrawalsPage.tsx`

#### Pages Publiques et Profil
- `src/pages/ProfilePage.tsx` (3 endpoints corrigés)

#### Services et Utilitaires
- `src/lib/api.ts` (endpoints PayDunya)
- `src/pages/admin/AdminUsersPage.tsx` (axios baseURL)

### 2. ✅ Ajout de `credentials: 'include'`

Tous les appels fetch d'authentification incluent maintenant `credentials: 'include'` pour supporter les cookies en production (CORS cross-domain) :

```typescript
const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
  method: 'POST',
  credentials: 'include', // ✅ Ajouté
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});
```

### 3. ✅ Configuration Environnement

Les fichiers `.env` et `.env.production` sont correctement configurés :

```bash
VITE_API_URL=https://printalma-back-dep.onrender.com
VITE_ENVIRONMENT=production
VITE_SECURE_COOKIES=true
VITE_SAME_SITE=lax
```

## Vérifications Backend Nécessaires

⚠️ **IMPORTANT** : Pour que le frontend fonctionne correctement en production, vous devez vérifier les configurations suivantes du backend :

### 1. Configuration CORS

Le backend doit autoriser les requêtes depuis votre frontend en production. Vérifiez que votre configuration CORS inclut :

```javascript
// Backend (Express.js exemple)
app.use(cors({
  origin: 'https://votre-frontend.onrender.com', // ou le domaine de votre frontend
  credentials: true, // IMPORTANT pour les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
```

### 2. Configuration des Cookies

Les cookies doivent être configurés pour fonctionner en cross-domain :

```javascript
// Backend
app.use(session({
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production', // true en production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24h
  }
}));
```

### 3. Endpoints à Vérifier

Assurez-vous que ces endpoints sont accessibles et retournent des données :

- `GET /vendor/stats` - Statistiques du tableau de bord vendeur
- `GET /vendor/designs` - Liste des designs du vendeur
- `GET /vendor/orders/{id}` - Détails d'une commande
- `GET /vendor/withdrawals` - Historique des retraits
- `GET /public/users/vendors` - Liste publique des vendeurs

### 4. Variables d'Environnement Backend

Vérifiez que votre backend a ces variables :

```bash
NODE_ENV=production
FRONTEND_URL=https://votre-frontend.onrender.com
ALLOWED_ORIGINS=https://votre-frontend.onrender.com
```

## Tests de Vérification

Après déploiement, testez :

1. ✅ **Connexion vendeur** : Login doit fonctionner
2. ✅ **Tableau de bord** : Les statistiques doivent s'afficher
3. ✅ **Produits** : La liste des produits doit charger
4. ✅ **Designs** : Les designs doivent être visibles
5. ✅ **Commandes** : Les commandes doivent s'afficher

## Debug en Production

Si les données ne s'affichent toujours pas :

1. **Ouvrez la Console du Navigateur** (F12)
2. **Vérifiez l'onglet Network** :
   - Les requêtes API vont-elles vers `https://printalma-back-dep.onrender.com` ?
   - Y a-t-il des erreurs CORS (rouge) ?
   - Les status codes sont-ils 200 ou des erreurs (401, 403, 500) ?

3. **Vérifiez l'onglet Application > Cookies** :
   - Les cookies sont-ils présents ?
   - Ont-ils l'attribut `Secure` et `SameSite=None` en production ?

4. **Vérifiez les erreurs API** :
   - 401 Unauthorized → Problème d'authentification/cookies
   - 403 Forbidden → Problème de permissions
   - 500 Server Error → Erreur backend
   - CORS Error → Configuration CORS backend

## Commandes de Déploiement

```bash
# Build de production
npm run build

# Le dossier dist/ contient les fichiers à déployer
# Sur Render, il détecte automatiquement le build Vite
```

## Support Supplémentaire

Si le problème persiste :
1. Vérifiez les logs du backend Render
2. Activez le mode debug dans le backend pour voir les requêtes
3. Utilisez `curl` pour tester les endpoints directement :

```bash
# Test endpoint avec credentials
curl -X GET 'https://printalma-back-dep.onrender.com/vendor/stats' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Cookie: session=YOUR_SESSION_COOKIE' \
  --verbose
```

---

**Date des corrections** : 2025-12-11
**Build** : ✅ Réussi
**TypeScript** : ✅ Aucune erreur
