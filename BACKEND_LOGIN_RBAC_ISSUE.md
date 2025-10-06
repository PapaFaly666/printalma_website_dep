# 🚨 PROBLÈME URGENT - Login avec Utilisateurs RBAC

## Problème Constaté

Lorsqu'un admin crée un utilisateur via le système RBAC (ex: SUPERADMIN) et que cet utilisateur tente de se connecter, **il ne peut pas accéder à la page** car le frontend ne reconnaît pas son rôle.

### Logs Frontend

```javascript
✅ Session stockée valide trouvée: {
  id: 21,
  email: 'pfd.d@zig.univ.sn',
  firstName: 'Papa',
  lastName: 'Faly',
  role: null,  // ❌ PROBLÈME ICI
  status: true,
  vendeur_type: null
}
```

### Conséquence

Le frontend ne peut pas déterminer si l'utilisateur est `ADMIN`, `SUPERADMIN` ou `VENDEUR` car `role: null`.

Les fonctions `isAdmin()`, `isSuperAdmin()`, `isVendeur()` retournent `false` → l'utilisateur ne peut accéder à aucune page.

---

## Architecture Actuelle

### Frontend attend :

```typescript
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'VENDEUR';  // ✅ STRING attendu
  customRole?: {                              // 🆕 Optionnel pour RBAC
    id: number;
    name: string;
    slug: string;  // 'superadmin', 'admin', 'vendor'
    permissions: Permission[];
  } | null;
}
```

### Backend retourne actuellement (supposé) :

```json
{
  "id": 21,
  "email": "pfd.d@zig.univ.sn",
  "firstName": "Papa",
  "lastName": "Faly",
  "role": null,  // ❌ Au lieu d'un string ou objet
  "status": true
}
```

---

## Solution Requise Backend

### Option 1 : Retourner role comme STRING + customRole comme OBJET (RECOMMANDÉ)

Le backend doit retourner **les deux** lors du login :

```json
{
  "user": {
    "id": 21,
    "email": "pfd.d@zig.univ.sn",
    "firstName": "Papa",
    "lastName": "Faly",
    "role": "SUPERADMIN",  // ✅ STRING pour compatibilité
    "customRole": {         // ✅ OBJET RBAC pour permissions
      "id": 1,
      "name": "Super Admin",
      "slug": "superadmin",
      "description": "Accès complet au système",
      "permissions": [
        {
          "id": 1,
          "key": "users.view",
          "name": "Voir utilisateurs",
          "module": "users"
        },
        // ... autres permissions
      ]
    },
    "status": true,
    "must_change_password": false
  }
}
```

**Mapping suggéré :**
- Si `customRole.slug === 'superadmin'` → `role: 'SUPERADMIN'`
- Si `customRole.slug === 'admin'` → `role: 'ADMIN'`
- Si `customRole.slug === 'vendor'` → `role: 'VENDEUR'`
- Pour tous les autres rôles custom (finance, production, marketing) → `role: 'ADMIN'`

### Option 2 : Retourner uniquement customRole comme OBJET

Si le backend préfère ne pas dupliquer, il peut retourner uniquement `customRole` :

```json
{
  "user": {
    "id": 21,
    "email": "pfd.d@zig.univ.sn",
    "firstName": "Papa",
    "lastName": "Faly",
    "customRole": {  // ✅ OBJET complet au lieu de null
      "id": 1,
      "name": "Super Admin",
      "slug": "superadmin",
      "permissions": [...]
    },
    "status": true
  }
}
```

**Dans ce cas, le frontend fera le mapping lui-même** basé sur `customRole.slug`.

---

## Endpoints Concernés

Tous ces endpoints doivent retourner le format corrigé :

1. **`POST /auth/login`** ⭐ PRIORITÉ ABSOLUE
   - Retourne les infos utilisateur après connexion
   - Doit inclure `role` (string) ET/OU `customRole` (objet)

2. **`GET /auth/profile`**
   - Retourne le profil complet de l'utilisateur connecté
   - Même format que login

3. **`GET /auth/check`**
   - Vérifie si l'utilisateur est authentifié
   - Retourne `{ isAuthenticated: true, user: {...} }`
   - Même format que login

---

## Tables Backend Concernées

D'après la documentation RBAC fournie :

```sql
-- Table users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE,
  firstName VARCHAR,
  lastName VARCHAR,
  password VARCHAR,
  role VARCHAR DEFAULT 'VENDEUR',  -- Ancien système
  customRoleId INT REFERENCES custom_roles(id),  -- Nouveau système RBAC
  status VARCHAR DEFAULT 'ACTIVE',
  must_change_password BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table custom_roles
CREATE TABLE custom_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE,
  slug VARCHAR UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table role_permissions
CREATE TABLE role_permissions (
  role_id INT REFERENCES custom_roles(id),
  permission_id INT REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

---

## Logique Backend Suggérée

### Dans le contrôleur de login :

```typescript
// Pseudo-code
async login(req, res) {
  const user = await findUserByEmail(email);

  // Vérifier mot de passe...

  // Charger le customRole avec permissions
  let customRole = null;
  let roleString = user.role; // 'SUPERADMIN', 'ADMIN', 'VENDEUR' de la DB

  if (user.customRoleId) {
    customRole = await db.query(`
      SELECT
        cr.id, cr.name, cr.slug, cr.description,
        json_agg(json_build_object(
          'id', p.id,
          'key', p.key,
          'name', p.name,
          'module', p.module
        )) as permissions
      FROM custom_roles cr
      LEFT JOIN role_permissions rp ON cr.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE cr.id = $1
      GROUP BY cr.id
    `, [user.customRoleId]);

    // Si customRole existe, mapper le slug vers le role string
    if (customRole) {
      const slugUpper = customRole.slug.toUpperCase();
      if (slugUpper === 'SUPERADMIN') roleString = 'SUPERADMIN';
      else if (slugUpper === 'ADMIN') roleString = 'ADMIN';
      else if (slugUpper === 'VENDOR') roleString = 'VENDEUR';
      else roleString = 'ADMIN'; // Par défaut pour rôles custom
    }
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: roleString,        // ✅ STRING
      customRole: customRole,  // ✅ OBJET ou null
      status: user.status === 'ACTIVE',
      must_change_password: user.must_change_password
    }
  });
}
```

---

## Tests à Effectuer Backend

### Test 1 : Utilisateur RBAC (créé via /admin/users)

**Requête :**
```bash
POST /auth/login
{
  "email": "pfd.d@zig.univ.sn",
  "password": "printalmatest123"
}
```

**Réponse attendue :**
```json
{
  "user": {
    "id": 21,
    "email": "pfd.d@zig.univ.sn",
    "firstName": "Papa",
    "lastName": "Faly",
    "role": "SUPERADMIN",  // ✅ Pas null
    "customRole": {
      "id": 1,
      "name": "Super Admin",
      "slug": "superadmin",
      "permissions": [...]
    },
    "status": true,
    "must_change_password": false
  }
}
```

### Test 2 : Ancien utilisateur (créé avant RBAC)

**Requête :**
```bash
POST /auth/login
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Réponse attendue :**
```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",      // ✅ De la colonne 'role' de users
    "customRole": null,   // ✅ Null car pas de customRoleId
    "status": true
  }
}
```

### Test 3 : Vendeur (avec vendeur_type)

**Requête :**
```bash
POST /auth/login
{
  "email": "vendor@example.com",
  "password": "password"
}
```

**Réponse attendue :**
```json
{
  "user": {
    "id": 10,
    "email": "vendor@example.com",
    "firstName": "John",
    "lastName": "Vendor",
    "role": "VENDEUR",
    "customRole": null,  // Ou objet si role vendor RBAC
    "vendeur_type": "DESIGNER",
    "status": true
  }
}
```

---

## Modifications Frontend Déjà Effectuées

Le frontend a été adapté pour supporter les deux systèmes :

```typescript
// auth.service.ts
hasPermission(user: User | null, requiredRoles: string[]): boolean {
  if (!user) return false;

  // 1️⃣ Vérifier le système RBAC (nouveau) via customRole.slug
  if (user.customRole) {
    const slug = user.customRole.slug.toUpperCase();
    return requiredRoles.some(role => slug === role.toUpperCase());
  }

  // 2️⃣ Fallback vers l'ancien système (role string)
  return requiredRoles.includes(user.role);
}

isAdmin(user: User | null): boolean {
  return this.hasPermission(user, ['ADMIN', 'SUPERADMIN']);
}

isSuperAdmin(user: User | null): boolean {
  return this.hasPermission(user, ['SUPERADMIN']);
}
```

✅ Le frontend est **déjà prêt** à gérer les deux formats.

---

## Urgence

🔴 **BLOQUANT** - Les utilisateurs créés via le nouveau système RBAC ne peuvent pas se connecter.

---

## Questions pour le Backend

1. Actuellement, que retourne `/auth/login` dans le champ `role` pour un utilisateur créé via `/admin/users` ?
2. Le champ `customRoleId` est-il bien renseigné dans la table `users` lors de la création ?
3. Les permissions sont-elles bien chargées avec le `customRole` via JOIN sur `role_permissions` ?
4. Y a-t-il une différence entre les endpoints `/auth/login`, `/auth/profile` et `/auth/check` ?

---

## Contact

Pour tester la correction, créer un utilisateur SUPERADMIN via :

```bash
POST /admin/users
{
  "name": "Test User",
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "TestPassword123!",
  "phone": "+221773992233",
  "roleId": 1,  // ID du rôle SUPERADMIN
  "status": "ACTIVE"
}
```

Puis tenter de se connecter avec cet utilisateur et vérifier la réponse de `/auth/login`.
