# Guide de Résolution CORS - PrintAlma

## 🚨 Problème

Erreur CORS lors de l'appel à `/auth/vendor/profile` depuis le frontend React :

```
Blocage d'une requête multiorigine (Cross-Origin Request) : la politique « Same Origin » ne permet pas de consulter la ressource distante située sur http://localhost:3004/auth/vendor/profile
```

## 🔧 Solution Implémentée

### 1. Configuration CORS Améliorée

Le fichier `backend/server.js` a été mis à jour avec une configuration CORS plus robuste :

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // Autorise toutes les origines localhost en développement
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    // ... autres validations
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### 2. Middleware de Logging CORS

Ajout de logs détaillés pour diagnostiquer les requêtes CORS :

```javascript
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`🌐 CORS Request - Origin: ${origin}, Method: ${req.method}, Path: ${req.path}`);
  next();
});
```

## 🚀 Étapes de Résolution

### Étape 1: Redémarrer le Serveur Backend

```bash
cd backend
npm install mysql2  # Si pas déjà fait
npm start
```

**Vérifiez les logs au démarrage :**
```
🌟 ========================================
🌟 PRINTALMA BACKEND - UNIFIED VERSION
🌟 ========================================
🚀 Server running on port 3004
```

### Étape 2: Démarrer le Frontend

```bash
# Dans un autre terminal
npm run dev
```

**Vérifiez que le frontend tourne bien sur le port 5174.**

### Étape 3: Tester avec le Script de Test

```bash
cd backend
node test-cors.js
```

**Sortie attendue :**
```
🧪 === TEST CORS - BACKEND PRINTALMA ===
🔍 Vérification du serveur backend...
✅ Serveur backend détecté

1️⃣ Test OPTIONS /auth/vendor/profile
📡 Réponse OPTIONS /auth/vendor/profile:
   Status: 200
   Headers: { 'access-control-allow-origin': 'http://localhost:5174', ... }

✅ Tests CORS terminés avec succès !
```

### Étape 4: Tester depuis le Frontend

1. **Ouvrez les outils de développement** (F12)
2. **Allez dans l'onglet Réseau**
3. **Essayez de mettre à jour les réseaux sociaux** depuis l'interface vendeur
4. **Vérifiez la requête** vers `/auth/vendor/profile`

## 🐛 Débogage

### Si l'erreur persiste :

1. **Vérifiez les logs du backend :**
   ```bash
   # Vous devriez voir les logs CORS
   🌐 CORS Request - Origin: http://localhost:5174, Method: PUT, Path: /auth/vendor/profile
   📋 Headers: { origin: 'http://localhost:5174', ... }
   ```

2. **Vérifiez que le port est correct :**
   ```bash
   # Vérifier si le port 3004 est utilisé
   lsof -i :3004
   ```

3. **Test avec curl :**
   ```bash
   # Test de base
   curl -X GET "http://localhost:3004/health"

   # Test CORS
   curl -X PUT "http://localhost:3004/auth/vendor/profile" \
     -H "Content-Type: application/json" \
     -H "Origin: http://localhost:5174" \
     -d '{"userId": 1, "shop_name": "test"}'
   ```

### Configuration Alternatives

#### Option 1: Utiliser le proxy Vite

Dans `vite.config.ts`, vous pouvez utiliser le proxy existant :

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3004',
    changeOrigin: true,
    secure: false
  }
}
```

Et modifier le frontend pour utiliser `/api/auth/vendor/profile` au lieu de l'URL directe.

#### Option 2: Configuration CORS plus permissive

Pour le développement uniquement, vous pouvez utiliser :

```javascript
app.use(cors({
  origin: '*', // Attention : seulement pour le développement !
  credentials: true
}));
```

## 📊 Vérification

### Points de contrôle :

✅ **Backend configuré** avec CORS
✅ **Origines autorisées** incluent localhost:5174
✅ **Headers CORS** corrects (credentials, methods, allowedHeaders)
✅ **Middleware OPTIONS** pour les requêtes preflight
✅ **Logs de débogage** ajoutés

### Tests à effectuer :

1. ✅ OPTIONS `/auth/vendor/profile` → 200
2. ✅ GET `/auth/vendor/profile?userId=1` → 200 avec données
3. ✅ PUT `/auth/vendor/profile` → 200 avec succès
4. ✅ PUT avec URLs invalides → 400 avec erreurs de validation

## 🔍 Logs Attendus

### Backend logs lors d'une requête réussie :

```
🌐 CORS Request - Origin: http://localhost:5174, Method: PUT, Path: /auth/vendor/profile
📋 Headers: {
  host: 'localhost:3004',
  connection: 'keep-alive',
  'content-length': '123',
  origin: 'http://localhost:5174',
  'user-agent': 'Mozilla/5.0...',
  'content-type': 'application/json',
  accept: '*/*',
  'accept-language': 'fr-FR,fr;q=0.9'
}
🚀 2024-01-15T10:30:00.000Z - PUT /auth/vendor/profile
🔧 === PUT /auth/vendor/profile ===
📋 Données reçues: { userId: 1, facebook_url: 'facebook.com/test', ... }
✅ Profil vendeur mis à jour avec succès
```

### Frontend console logs :

```
🔄 Requête vers: http://localhost:3004/auth/vendor/profile
📝 Options: { credentials: 'include', method: 'PUT', headers: {...} }
📡 Réponse de /auth/vendor/profile: { status: 200, ok: true, ... }
```

## 🎯 Solution Finale

Le problème CORS devrait maintenant être résolu. Si vous rencontrez encore des problèmes :

1. **Redémarrez les deux serveurs** (backend et frontend)
2. **Videz le cache** du navigateur (Ctrl+Shift+R)
3. **Vérifiez les onglets Réseau et Console** dans les outils de développement
4. **Consultez les logs du backend** pour des erreurs supplémentaires

L'implémentation CORS est maintenant robuste et devrait fonctionner correctement avec votre frontend React ! 🚀