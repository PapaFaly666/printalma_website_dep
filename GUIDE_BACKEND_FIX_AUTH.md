# Guide Backend - Correction Autorisation Admin & Endpoint Debug

## Problème Identifié

### 1. Erreur d'Autorisation
```
Error 400: "Seuls les administrateurs peuvent modifier les produits."
```
- Utilisateur connecté avec rôle `SUPERADMIN` ne peut pas modifier les produits
- L'endpoint `PATCH /products/:id` rejette la requête malgré le rôle SUPERADMIN

### 2. Endpoint Debug Manquant
```
Error 404: GET /products/debug/user-role
```
- Endpoint nécessaire pour diagnostiquer les problèmes d'autorisation côté frontend

## Solutions Backend Requises

### 1. Endpoint Debug - `/products/debug/user-role`

Créer un endpoint GET pour diagnostiquer les autorisations utilisateur :

```typescript
// Dans le contrôleur produit (products.controller.ts)
@Get('debug/user-role')
@UseGuards(JwtAuthGuard)
async debugUserRole(@GetUser() user: User) {
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      roleType: user.role, // Pour compatibilité
      firstName: user.firstName,
      lastName: user.lastName
    },
    debug: {
      isAdmin: ['ADMIN', 'SUPERADMIN'].includes(user.role),
      isSuperAdmin: user.role === 'SUPERADMIN',
      includesAdminCheck: ['ADMIN', 'SUPERADMIN'].includes(user.role),
      timestamp: new Date().toISOString(),
      guardsActive: true
    },
    message: 'Debug endpoint pour vérification des autorisations utilisateur'
  };
}
```

### 2. Correction du Middleware d'Autorisation

Vérifier et corriger le middleware/guard qui protège `PATCH /products/:id` :

```typescript
// Guard d'autorisation admin (admin.guard.ts ou similaire)
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    console.log('🔍 AdminGuard - Vérification:', {
      userId: user?.id,
      userRole: user?.role,
      isAuthorized: ['ADMIN', 'SUPERADMIN'].includes(user?.role)
    });
    
    // IMPORTANT: Inclure SUPERADMIN dans la vérification
    return user && ['ADMIN', 'SUPERADMIN'].includes(user.role);
  }
}
```

### 3. Vérification de l'Endpoint PATCH Products

S'assurer que l'endpoint PATCH utilise le bon guard :

```typescript
// Dans products.controller.ts
@Patch(':id')
@UseGuards(JwtAuthGuard, AdminGuard) // Vérifier que AdminGuard autorise SUPERADMIN
async updateProduct(
  @Param('id') id: string,
  @Body() updateProductDto: UpdateProductDto,
  @GetUser() user: User
) {
  console.log('🔍 PATCH /products/:id - User:', {
    id: user.id,
    role: user.role,
    email: user.email
  });
  
  return await this.productsService.update(+id, updateProductDto);
}
```

### 4. Vérification du JWT Auth Guard

S'assurer que le JWT est correctement extrait et validé :

```typescript
// Dans jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🔍 JwtAuthGuard - Activation');
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('🔍 JwtAuthGuard - Résultat:', {
      error: err?.message,
      userPresent: !!user,
      userRole: user?.role,
      info: info?.message
    });
    
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalide');
    }
    return user;
  }
}
```

### 5. Stratégie JWT - Vérification

Dans la stratégie JWT, s'assurer que l'utilisateur est correctement chargé :

```typescript
// Dans jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    
    console.log('🔍 JWT Strategy - Validation:', {
      payloadSub: payload.sub,
      userFound: !!user,
      userRole: user?.role,
      userEmail: user?.email
    });
    
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }
    
    return user;
  }
}
```

### 6. Migration Base de Données (Si nécessaire)

Si le problème vient de la base de données, vérifier les rôles :

```sql
-- Vérifier les utilisateurs et leurs rôles
SELECT id, email, role, "firstName", "lastName", "createdAt" 
FROM "User" 
WHERE role IN ('ADMIN', 'SUPERADMIN')
ORDER BY "createdAt" DESC;

-- Si nécessaire, corriger le rôle d'un utilisateur spécifique
UPDATE "User" 
SET role = 'SUPERADMIN' 
WHERE email = 'admin@example.com';

-- Vérifier que la colonne role accepte les valeurs correctes
\d "User";
```

### 7. Variables d'Environnement

Vérifier les variables d'environnement liées au JWT :

```env
# .env
JWT_SECRET=votre_secret_jwt_ici
JWT_EXPIRES_IN=24h
```

### 8. Logging pour Debug

Ajouter des logs temporaires pour diagnostiquer :

```typescript
// Dans le service ou contrôleur concerné
console.log('🔍 DEBUG - Request Headers:', request.headers.authorization);
console.log('🔍 DEBUG - User from JWT:', user);
console.log('🔍 DEBUG - User Role Check:', {
  role: user?.role,
  isAdmin: user?.role === 'ADMIN',
  isSuperAdmin: user?.role === 'SUPERADMIN',
  isAuthorized: ['ADMIN', 'SUPERADMIN'].includes(user?.role)
});
```

## Tests à Effectuer

### 1. Test de l'Endpoint Debug

```bash
curl -X GET "https://printalma-back-dep.onrender.com/products/debug/user-role" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Test du PATCH Products

```bash
curl -X PATCH "https://printalma-back-dep.onrender.com/products/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Update"}'
```

### 3. Vérification en Base

```sql
-- Trouver l'utilisateur qui a le problème
SELECT * FROM "User" WHERE email = 'email_problematique@example.com';
```

## Checklist de Vérification

- [ ] L'endpoint `GET /products/debug/user-role` retourne les bonnes informations
- [ ] Le middleware AdminGuard inclut bien 'SUPERADMIN' dans les rôles autorisés  
- [ ] Le JWT est correctement extrait du header Authorization
- [ ] L'utilisateur est correctement chargé depuis la base de données
- [ ] Le rôle SUPERADMIN est bien stocké en base pour l'utilisateur concerné
- [ ] Les logs montrent que l'utilisateur passe bien les guards JWT et Admin
- [ ] Le PATCH `/products/:id` fonctionne avec un utilisateur SUPERADMIN

## Réponse Attendue du Debug Endpoint

```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "SUPERADMIN",
    "roleType": "SUPERADMIN",
    "firstName": "Admin",
    "lastName": "User"
  },
  "debug": {
    "isAdmin": true,
    "isSuperAdmin": true,
    "includesAdminCheck": true,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "guardsActive": true
  },
  "message": "Debug endpoint pour vérification des autorisations utilisateur"
}
```

## Actions Prioritaires

1. **Créer l'endpoint debug** pour diagnostiquer le problème
2. **Vérifier le AdminGuard** pour s'assurer qu'il autorise SUPERADMIN  
3. **Ajouter des logs temporaires** dans les guards pour voir où ça bloque
4. **Tester avec Postman/curl** pour isoler le problème

Une fois ces corrections appliquées, le frontend pourra utiliser l'endpoint debug pour vérifier les autorisations et les modifications de produits devraient fonctionner pour les utilisateurs SUPERADMIN.