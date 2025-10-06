# ✅ Correction Frontend - Login RBAC

## Problème Résolu

Les utilisateurs créés via le système RBAC (`/admin/users`) ne pouvaient pas se connecter car le frontend ne gérait pas correctement le nouveau format de réponse avec `customRole`.

---

## Changements Appliqués Frontend

### 1. Types TypeScript Mis à Jour

**Fichier:** `src/types/auth.types.ts`

```typescript
// 🆕 Interface pour le rôle RBAC (système nouveau)
export interface CustomRole {
  id: number;
  name: string;
  slug: string;
  description?: string;
  permissions?: Array<{
    id: number;
    key: string;
    name: string;
    module: string;
  }>;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole; // 'SUPERADMIN' | 'ADMIN' | 'VENDEUR'
  customRole?: CustomRole | null; // 🆕 Support RBAC
  vendeur_type: VendeurType | null;
  status: boolean;
  must_change_password?: boolean;
  // ... autres champs
}
```

### 2. Service d'Authentification Adapté

**Fichier:** `src/services/auth.service.ts`

#### Login simplifié

```typescript
async login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await this.request<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  // Sauvegarder les données utilisateur complètes
  if ('user' in response && response.user) {
    console.log('🔍 Données utilisateur reçues du login:', response.user);

    // Le backend retourne maintenant:
    // - role: string ('SUPERADMIN', 'ADMIN', 'VENDEUR') - toujours renseigné
    // - customRole: objet avec permissions ou null
    const processedUser = { ...response.user };

    console.log('✅ Utilisateur traité:', {
      role: processedUser.role,
      hasCustomRole: !!processedUser.customRole,
      customRoleSlug: processedUser.customRole?.slug
    });

    const authData = {
      timestamp: Date.now(),
      user: processedUser,
      isAuthenticated: true
    };
    localStorage.setItem('auth_session', JSON.stringify(authData));
    console.log('💾 Session utilisateur sauvegardée en localStorage');
  }

  return response;
}
```

#### Vérification des permissions mise à jour

```typescript
/**
 * Utilitaire pour vérifier les permissions utilisateur
 * Support des deux systèmes: ancien (role string) et nouveau (customRole RBAC)
 */
hasPermission(user: User | null, requiredRoles: string[]): boolean {
  if (!user) return false;

  // 1️⃣ Vérifier le système RBAC (nouveau) via customRole.slug
  if (user.customRole) {
    const slug = user.customRole.slug.toUpperCase();
    const hasRbacPermission = requiredRoles.some(role =>
      slug === role.toUpperCase()
    );
    if (hasRbacPermission) {
      console.log('✅ Permission accordée via RBAC:', slug);
      return true;
    }
  }

  // 2️⃣ Fallback vers l'ancien système (role string)
  const hasLegacyPermission = requiredRoles.includes(user.role);
  if (hasLegacyPermission) {
    console.log('✅ Permission accordée via ancien système:', user.role);
  }

  return hasLegacyPermission;
}

/**
 * Vérifier si l'utilisateur est admin
 * Support RBAC: vérifie si le slug du customRole est 'admin' ou 'superadmin'
 */
isAdmin(user: User | null): boolean {
  return this.hasPermission(user, ['ADMIN', 'SUPERADMIN']);
}

/**
 * Vérifier si l'utilisateur est super admin
 * Support RBAC: vérifie si le slug du customRole est 'superadmin'
 */
isSuperAdmin(user: User | null): boolean {
  return this.hasPermission(user, ['SUPERADMIN']);
}

/**
 * Vérifier si l'utilisateur est vendeur
 * Support RBAC: vérifie si le slug du customRole est 'vendor'
 */
isVendeur(user: User | null): boolean {
  return this.hasPermission(user, ['VENDEUR', 'VENDOR']);
}
```

### 3. Service de Gestion des Utilisateurs

**Fichier:** `src/services/userManagementService.ts`

Ajout de la fonction pour récupérer les rôles disponibles (sans vendor) :

```typescript
/**
 * Récupérer les rôles disponibles pour créer des utilisateurs (exclut vendor)
 * IMPORTANT: Utilisez cette fonction pour le formulaire de création d'utilisateur
 */
export const fetchAvailableRolesForUsers = async (): Promise<Role[]> => {
  try {
    const response = await axios.get(
      `${API_BASE}/admin/roles/available-for-users`,
      { withCredentials: true }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching available roles for users:', error);
    throw error;
  }
};
```

### 4. Page de Gestion des Utilisateurs

**Fichier:** `src/pages/admin/AdminUsersPage.tsx`

Utilisation de `fetchAvailableRolesForUsers()` pour le dropdown de création :

```typescript
const [roles, setRoles] = useState<Role[]>([]); // Pour les filtres (tous les rôles)
const [availableRoles, setAvailableRoles] = useState<Role[]>([]); // Pour la création (exclut vendor)

const loadData = async () => {
  const [usersData, rolesData, availableRolesData, statsData] = await Promise.all([
    fetchUsers(),
    fetchRoles(), // Tous les rôles pour les filtres
    fetchAvailableRolesForUsers(), // Rôles sans vendor pour la création
    fetchUserStats()
  ]);

  setRoles(rolesData);
  setAvailableRoles(availableRolesData); // 🆕 Stocker séparément
  // ...
};

// Dans le formulaire de création
<Select value={formData.roleId.toString()}>
  <SelectContent>
    {availableRoles.map((role) => ( // 🆕 Utilise availableRoles
      <SelectItem key={role.id} value={role.id.toString()}>
        {role.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

## Format de Réponse Attendu du Backend

### Login Réussi (utilisateur RBAC)

```json
{
  "user": {
    "id": 21,
    "email": "pfd.d@zig.univ.sn",
    "firstName": "Papa",
    "lastName": "Faly",
    "role": "SUPERADMIN",  // ✅ Toujours renseigné (mappé depuis customRole.slug)
    "customRole": {         // ✅ Objet complet avec permissions
      "id": 1,
      "name": "Super Admin",
      "slug": "superadmin",
      "description": "Accès complet au système",
      "permissions": [
        {
          "id": 1,
          "slug": "users.view",
          "name": "Voir utilisateurs",
          "module": "users",
          "description": "Voir la liste des utilisateurs"
        }
      ]
    },
    "vendeur_type": null,
    "status": true,
    "must_change_password": false
  }
}
```

### Login Réussi (ancien utilisateur)

```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",       // ✅ De la colonne enum 'role'
    "customRole": null,    // ✅ Null car pas de roleId
    "vendeur_type": null,
    "status": true,
    "must_change_password": false
  }
}
```

---

## Flux d'Authentification

### Étape 1 : Login
```typescript
POST /auth/login
{
  "email": "pfd.d@zig.univ.sn",
  "password": "printalmatest123"
}
```

### Étape 2 : Réponse Backend
Le backend retourne `role` (string) + `customRole` (objet ou null)

### Étape 3 : Stockage Frontend
```typescript
localStorage.setItem('auth_session', JSON.stringify({
  timestamp: Date.now(),
  user: {
    id: 21,
    email: "pfd.d@zig.univ.sn",
    role: "SUPERADMIN",  // ✅ Jamais null
    customRole: { ... }  // ✅ Avec permissions
  },
  isAuthenticated: true
}));
```

### Étape 4 : Vérification des Permissions
```typescript
// AuthContext utilise authService.isAdmin()
isAdmin(user) // Vérifie user.customRole.slug === 'admin' || 'superadmin'
              // OU vérifie user.role === 'ADMIN' || 'SUPERADMIN'
```

### Étape 5 : Accès aux Pages
```typescript
// Dans App.tsx
<Route element={<AdminRoute />}>
  <Route path="users" element={<AdminUsersPage />} />
  {/* L'utilisateur RBAC peut maintenant accéder */}
</Route>
```

---

## Mapping Role ↔ CustomRole

| Backend customRole.slug | Frontend user.role | Accès Pages |
|------------------------|-------------------|-------------|
| `superadmin` | `SUPERADMIN` | ✅ Toutes pages admin |
| `admin` | `ADMIN` | ✅ Pages admin |
| `vendor` | `VENDEUR` | ✅ Pages vendeur |
| `finance` | `ADMIN` | ✅ Pages admin (mappé) |
| `production` | `ADMIN` | ✅ Pages admin (mappé) |
| `marketing` | `ADMIN` | ✅ Pages admin (mappé) |

**Note:** Le backend fait le mapping automatiquement, le frontend reçoit directement le bon `role`.

---

## Tests Frontend

### Test 1 : Vérifier la réception des données

Après login, dans la console browser :

```javascript
// Vérifier localStorage
const session = JSON.parse(localStorage.getItem('auth_session'));
console.log('Role:', session.user.role); // Doit être 'SUPERADMIN', pas null
console.log('CustomRole:', session.user.customRole); // Doit être un objet
console.log('Permissions:', session.user.customRole?.permissions); // Array
```

### Test 2 : Vérifier les permissions

```javascript
// Dans la console après login
authService.isAdmin(user); // true pour SUPERADMIN
authService.isSuperAdmin(user); // true pour SUPERADMIN
authService.hasPermission(user, ['ADMIN', 'SUPERADMIN']); // true
```

### Test 3 : Vérifier l'accès aux pages

1. Se connecter avec un utilisateur SUPERADMIN créé via `/admin/users`
2. Vérifier la redirection automatique vers `/admin/dashboard`
3. Vérifier l'accès à `/admin/users`
4. Vérifier l'accès à `/admin/roles`

---

## Rétrocompatibilité

✅ **Ancien système** : Les utilisateurs avec `role` enum et sans `customRole` fonctionnent toujours

✅ **Nouveau système** : Les utilisateurs avec `customRole` sont maintenant supportés

✅ **Hybrid** : Les deux systèmes coexistent sans conflit

---

## Logs de Débogage

Le frontend affiche maintenant des logs clairs :

```
🔍 Données utilisateur reçues du login: {...}
✅ Utilisateur traité: { role: 'SUPERADMIN', hasCustomRole: true, customRoleSlug: 'superadmin' }
💾 Session utilisateur sauvegardée en localStorage
✅ Permission accordée via RBAC: SUPERADMIN
```

---

## Prochaines Étapes

1. ✅ Frontend adapté pour recevoir `customRole`
2. ✅ Fonctions de permissions mises à jour
3. ✅ Dropdown de création n'affiche plus le rôle vendor
4. ⏳ **Tester avec le backend mis à jour**
5. ⏳ Implémenter la vérification de permissions granulaires (optionnel)

---

## Fichiers Modifiés

1. ✅ `src/types/auth.types.ts` - Ajout de `CustomRole` interface
2. ✅ `src/services/auth.service.ts` - Simplification du login, adaptation des permissions
3. ✅ `src/services/userManagementService.ts` - Ajout de `fetchAvailableRolesForUsers()`
4. ✅ `src/pages/admin/AdminUsersPage.tsx` - Utilisation de `availableRoles` pour la création

---

**Date:** 2025-10-03
**Statut:** ✅ PRÊT - Frontend adapté, en attente du backend mis à jour
**Version:** 1.0
