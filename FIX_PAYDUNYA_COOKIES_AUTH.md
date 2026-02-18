# Fix - Authentification par Cookies pour PayDunya

## Problème Résolu

❌ **Avant** : Erreur 401 Unauthorized
```
❌ Erreur: Aucun token d'authentification trouvé. Veuillez vous reconnecter.
POST http://localhost:3004/admin/payment-config/switch 401 (Unauthorized)
```

✅ **Après** : Authentification par cookies (comme les autres pages admin)

## Modifications Effectuées

### 1. Service `paymentConfigService.ts`

**Avant** : Utilisait Bearer Token
```typescript
static async switchMode(mode: 'test' | 'live', token: string) {
  const response = await fetch(`${API_URL}/admin/payment-config/switch`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ provider: 'paydunya', mode })
  });
}
```

**Après** : Utilise les cookies
```typescript
static async switchMode(mode: 'test' | 'live') {
  const response = await fetch(`${API_URL}/admin/payment-config/switch`, {
    method: 'POST',
    credentials: 'include', // ✅ Authentification par cookies
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ provider: 'paydunya', mode })
  });
}
```

**Toutes les méthodes du service ont été mises à jour** :
- ✅ `getPaydunyaConfig()` - credentials: 'include'
- ✅ `getPaydunyaAdminConfig()` - credentials: 'include', plus de paramètre token
- ✅ `switchMode(mode)` - credentials: 'include', plus de paramètre token
- ✅ `updatePaydunyaKeys(data)` - credentials: 'include', plus de paramètre token
- ✅ `togglePaydunyaStatus(isActive)` - credentials: 'include', plus de paramètre token

### 2. Hook `usePaydunyaConfig.ts`

**Avant** : Prenait le token en paramètre
```typescript
export function usePaydunyaConfig(authToken?: string) {
  // ...
  if (authToken) {
    data = await PaymentConfigService.getPaydunyaAdminConfig(authToken);
  }
}
```

**Après** : Prend un boolean isAdmin
```typescript
export function usePaydunyaConfig(isAdmin: boolean = false) {
  // ...
  if (isAdmin) {
    data = await PaymentConfigService.getPaydunyaAdminConfig(); // Cookies auto
  }
}
```

### 3. Page `PaymentMethodsPage.tsx`

**Avant** : Récupérait le token de localStorage
```typescript
const [authToken, setAuthToken] = useState<string>('');
const getAuthToken = () => {
  // Essayer localStorage, auth_session, etc.
  return token;
};
const { config, loading, error, refetch } = usePaydunyaConfig(authToken);
```

**Après** : Utilise directement le hook avec isAdmin=true
```typescript
const { config, loading, error, refetch } = usePaydunyaConfig(true);
```

**Simplification des handlers** :
- ❌ Plus de vérification de token
- ❌ Plus de logs de token
- ❌ Plus de gestion du token

```typescript
// Avant
const handlePaydunMode = async (mode: 'test' | 'live') => {
  if (!authToken) {
    alert('Erreur: Aucun token...');
    return;
  }
  await PaymentConfigService.switchMode(mode, authToken);
};

// Après
const handlePaydunMode = async (mode: 'test' | 'live') => {
  await PaymentConfigService.switchMode(mode); // Cookies auto
};
```

## Comment ça fonctionne maintenant

### 1. Connexion Admin

Quand l'admin se connecte via `/admin/login` :
```typescript
// Backend (NestJS)
@Post('login')
async login(@Res() response, @Body() credentials) {
  // Valider credentials...
  const token = this.jwtService.sign(payload);

  // Créer un cookie HTTP-only sécurisé
  response.cookie('access_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24h
  });

  return response.json({ success: true });
}
```

### 2. Requêtes Admin

Toutes les requêtes incluent automatiquement le cookie :
```typescript
// Frontend
fetch('http://localhost:3004/admin/payment-config/switch', {
  credentials: 'include' // ✅ Envoie automatiquement les cookies
});

// Le navigateur ajoute automatiquement :
// Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Backend Vérifie le Cookie

```typescript
// Backend (NestJS)
@UseGuards(JwtAuthGuard)
@Post('admin/payment-config/switch')
async switchMode(@Req() req, @Body() dto) {
  // JwtAuthGuard extrait automatiquement le token du cookie
  // et le valide

  console.log(req.user); // { userId: 1, role: 'admin' }

  // Exécuter l'action...
}
```

## Avantages de cette approche

✅ **Sécurité accrue** :
- Cookies HTTP-only (inaccessibles via JavaScript)
- Protection CSRF automatique
- Pas de token exposé dans localStorage

✅ **Simplicité** :
- Pas de gestion manuelle du token
- Pas de vérification côté frontend
- Authentification transparente

✅ **Cohérence** :
- Même système que les autres pages admin
- Même flux d'authentification partout

## Test

Pour vérifier que ça fonctionne :

1. **Connectez-vous en tant qu'admin**
2. **Accédez à** `/admin/payment-methods`
3. **Ouvrez la console** (F12)
4. **Vérifiez les cookies** :
   ```javascript
   document.cookie
   // Devrait contenir "access_token=..."
   ```
5. **Essayez de basculer le mode** TEST/LIVE
6. **Dans Network tab**, vérifiez la requête :
   - ✅ Cookie: access_token=...
   - ✅ credentials: include
   - ✅ Status: 200 OK (au lieu de 401)

## Dépannage

### Si vous avez toujours 401 :

1. **Vérifiez les cookies** :
   ```javascript
   console.log('Cookies:', document.cookie);
   ```
   Si vide, reconnectez-vous.

2. **Vérifiez le backend** :
   - JwtAuthGuard est appliqué
   - JwtStrategy extrait le cookie correctement
   - CORS autorise credentials

3. **Vérifiez CORS (backend)** :
   ```typescript
   app.enableCors({
     origin: 'http://localhost:5174',
     credentials: true // ✅ IMPORTANT
   });
   ```

### Si les clés ne s'affichent pas :

1. **Vérifiez la console** :
   ```javascript
   // Devrait voir :
   🔄 [PaymentConfigService] switchMode - Début
   📡 [PaymentConfigService] Response status: 200
   ✅ [PaymentConfigService] switchMode - Succès
   ```

2. **Vérifiez le backend** :
   - L'endpoint `/admin/payment-config/paydunya` est accessible
   - Retourne bien les clés testPublicKey, livePublicKey, etc.

## Résumé

✅ **Plus besoin de gérer les tokens manuellement**
✅ **Authentification automatique par cookies**
✅ **Cohérent avec le reste de l'application**
✅ **Plus sécurisé**

Le système fonctionne maintenant exactement comme les autres pages admin (OrdersManagement, ClientManagement, etc.).

---

**Date** : 12 février 2026
**Version** : 2.0.0
