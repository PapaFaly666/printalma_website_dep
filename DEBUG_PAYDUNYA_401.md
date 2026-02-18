# Guide de Débogage - Erreur 401 Unauthorized PayDunya

## Problème

```
❌ Erreur: Unauthorized
POST http://localhost:3004/admin/payment-config/switch 401 (Unauthorized)
```

## Solutions

### 1. Vérifier la Console du Navigateur

Ouvrez la console du navigateur (F12) et recherchez ces logs :

```
🔑 [PaymentMethods] Token récupéré: eyJhbGciOiJIUzI1NiIsI...
🔄 [PaymentMethods] Basculement vers mode: test
🔑 [PaymentMethods] Utilisation du token: eyJhbGciOiJIUzI1NiIs...
🔄 [PaymentConfigService] switchMode - Début
```

**Si vous voyez `Token récupéré: AUCUN TOKEN`**, le problème vient du frontend :
- Vous n'êtes pas connecté
- Le token n'est pas stocké correctement

**Si le token est présent mais vous avez toujours 401**, le problème vient du backend :
- Le token est expiré
- Le backend n'accepte pas ce token
- Les routes admin ne sont pas correctement protégées

### 2. Vérifier le LocalStorage

Dans la console du navigateur, tapez :

```javascript
console.log('token:', localStorage.getItem('token'));
console.log('access_token:', localStorage.getItem('access_token'));
console.log('authToken:', localStorage.getItem('authToken'));
console.log('admin_token:', localStorage.getItem('admin_token'));
console.log('auth_session:', localStorage.getItem('auth_session'));
```

**Résultat attendu** : Au moins un de ces items doit contenir un JWT (commence par `eyJ`).

**Si aucun token n'est présent** :
1. Vérifiez que vous êtes bien connecté
2. Reconnectez-vous
3. Vérifiez que le login stocke bien le token

### 3. Tester le Token Manuellement

Dans la console du navigateur :

```javascript
// Récupérer le token
const token = localStorage.getItem('token') || localStorage.getItem('access_token');

// Tester l'endpoint
fetch('http://localhost:3004/admin/payment-config/paydunya', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('✅ Succès:', data))
.catch(err => console.error('❌ Erreur:', err));
```

**Si ça fonctionne** :
- Le token est valide
- Le problème vient de la façon dont le frontend envoie le token

**Si ça ne fonctionne pas** :
- Le token est invalide ou expiré
- Le backend ne reconnaît pas ce token
- Les permissions sont incorrectes

### 4. Vérifier les Headers de la Requête

Dans l'onglet **Network** (Réseau) de la console :
1. Cliquez sur la requête `switch` qui a échoué
2. Regardez l'onglet **Headers**
3. Vérifiez la section **Request Headers**

**Vérifiez que vous avez** :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Si `Authorization` est absent ou mal formaté** :
- Le token n'est pas passé correctement
- Problème dans le code frontend

### 5. Vérifier le Payload du Token

Décodez votre token JWT sur [jwt.io](https://jwt.io) :

```javascript
const token = localStorage.getItem('token') || localStorage.getItem('access_token');
console.log('Token à décoder:', token);
```

Copiez le token et collez-le sur jwt.io.

**Vérifiez** :
- `exp` (expiration) : doit être dans le futur
- `role` : doit être `admin` ou `superadmin`
- `userId` : doit être présent

**Si le token est expiré** :
```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
const exp = payload.exp * 1000; // Convertir en millisecondes
const now = Date.now();

console.log('Token expire le:', new Date(exp));
console.log('Maintenant:', new Date(now));
console.log('Expiré:', exp < now ? 'OUI ❌' : 'NON ✅');
```

### 6. Reconnecter l'Utilisateur

Si le token est expiré ou invalide :

1. **Déconnectez-vous** :
   ```javascript
   localStorage.clear();
   window.location.reload();
   ```

2. **Reconnectez-vous** avec vos identifiants admin

3. **Vérifiez que le nouveau token est bien stocké** :
   ```javascript
   console.log('Nouveau token:', localStorage.getItem('token'));
   ```

### 7. Vérifier les Cookies (Backend)

Le backend peut aussi utiliser les cookies pour l'authentification.

Dans la console :
```javascript
console.log('Cookies:', document.cookie);
```

**Si vous voyez des cookies JWT/auth** :
- Le backend peut utiliser les cookies au lieu du header Authorization
- Vérifiez que `withCredentials: true` est configuré

### 8. Vérifier la Configuration Backend

Si le problème persiste côté backend, vérifiez :

**Routes Admin** (`src/admin/admin.module.ts` ou équivalent) :
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Post('payment-config/switch')
```

**JwtAuthGuard** doit être correctement configuré :
```typescript
// auth/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**JwtStrategy** doit extraire le token :
```typescript
// auth/jwt.strategy.ts
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }
}
```

### 9. Logs Backend

Si vous avez accès au backend, activez les logs :

```typescript
// Dans admin.controller.ts
@Post('payment-config/switch')
async switchMode(@Body() dto: SwitchModeDto, @Req() req: any) {
  console.log('🔐 User:', req.user); // Doit afficher l'utilisateur
  console.log('📦 Body:', dto);

  // Si req.user est undefined, le guard ne fonctionne pas
  if (!req.user) {
    console.error('❌ req.user is undefined - JwtAuthGuard failed');
  }

  // ...
}
```

### 10. Solution Temporaire de Contournement

Si rien ne fonctionne et que vous devez tester rapidement, vous pouvez :

**Option A : Utiliser Postman/Thunder Client**
1. GET `/auth/login` avec vos credentials
2. Copier le token JWT de la réponse
3. POST `/admin/payment-config/switch` avec le token dans Authorization

**Option B : Hardcoder temporairement le token (DEV ONLY)**
```typescript
// PaymentMethodsPage.tsx - TEMPORAIRE POUR TEST
const [authToken, setAuthToken] = useState<string>('VOTRE_TOKEN_ICI');
```

**⚠️ NE JAMAIS COMMITER CETTE MODIFICATION**

## Checklist de Résolution

- [ ] Console du navigateur : le token est-il présent ?
- [ ] LocalStorage : le token est-il stocké ?
- [ ] Token décodé : est-il expiré ?
- [ ] Token décodé : le rôle est-il `admin` ?
- [ ] Network tab : le header `Authorization` est-il présent ?
- [ ] Test manuel fetch : l'endpoint répond-il avec le token ?
- [ ] Backend logs : `req.user` est-il défini ?
- [ ] JwtAuthGuard : est-il bien appliqué à la route ?
- [ ] Reconnexion : un nouveau token fonctionne-t-il ?

## Résumé

**Erreur 401 signifie** :
- Le token n'est pas envoyé (frontend)
- Le token est invalide/expiré (frontend)
- Le token n'est pas reconnu (backend)
- La route n'est pas correctement protégée (backend)

**Solutions les plus courantes** :
1. **Reconnectez-vous** (90% des cas)
2. **Vérifiez le token dans localStorage**
3. **Vérifiez que vous êtes admin**

---

**Avec les modifications apportées**, vous devriez maintenant voir des logs détaillés dans la console qui vous indiqueront exactement où se situe le problème.

Rechargez la page et essayez à nouveau. Les logs vous guideront.
