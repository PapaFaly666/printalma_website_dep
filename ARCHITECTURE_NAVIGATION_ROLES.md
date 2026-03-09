# Architecture Navigation & Rôles - PrintAlma

## 📋 Vue d'ensemble

Ce document décrit la nouvelle architecture évolutive et maintenable pour la gestion de la navigation et des permissions dans PrintAlma.

## 🎯 Objectifs

✅ **Évolutivité** : Ajouter facilement de nouveaux menus et permissions
✅ **Maintenabilité** : Configuration centralisée, pas de code dupliqué
✅ **Sécurité** : Filtrage automatique basé sur les permissions
✅ **Performance** : Hooks optimisés avec memoization
✅ **Type-safety** : TypeScript strict pour éviter les erreurs

---

## 🏗️ Architecture Frontend

### 1. Types TypeScript (`src/types/navigation.ts`)

Définition des types pour la navigation :

```typescript
export interface NavItem {
  id: string;                    // Identifiant unique
  label: string;                 // Libellé affiché
  icon: LucideIcon;              // Icône Lucide
  path: string;                  // Chemin de navigation
  permission?: string;           // Permission requise (optionnel)
  badge?: string | (() => string); // Badge statique ou dynamique
  badgeColor?: 'blue' | 'red' | 'yellow' | 'green' | 'purple';
  textColor?: string;            // Couleur du texte
  countKey?: 'mockupsCount' | 'designValidationCount' | 'paymentRequestsCount';
}

export interface NavGroup {
  id: string;                    // Identifiant unique du groupe
  title: string;                 // Titre du groupe
  items: NavItem[];              // Liste des éléments
  permission?: string;           // Permission pour tout le groupe
  permissions?: string[];        // Permissions alternatives (OU logique)
  roles?: ('ADMIN' | 'SUPERADMIN' | 'VENDEUR')[]; // Rôles autorisés
}
```

### 2. Configuration Centralisée (`src/config/navigation.ts`)

Tous les menus sont définis dans un seul fichier :

```typescript
export const navigationConfig: NavigationConfig = {
  admin: [
    {
      id: 'users-group',
      title: 'Utilisateurs',
      permissions: ['users.admins.view', 'users.admins.create', 'users.admins.roles'],
      items: [
        {
          id: 'users',
          label: 'Admins & Superadmins',
          icon: Users,
          path: 'users',
          permission: 'users.admins.view',
        },
        {
          id: 'users-create',
          label: 'Créer utilisateur',
          icon: User,
          path: 'users/create',
          permission: 'users.admins.create',
        },
        {
          id: 'roles',
          label: 'Rôles & Permissions',
          icon: Shield,
          path: 'roles',
          permission: 'users.admins.roles',
        },
      ],
    },
    // ... autres groupes
  ],
  vendor: [ /* ... */ ],
  footer: [ /* ... */ ],
};
```

### 3. Hook de Navigation (`src/hooks/useNavigation.ts`)

Hook intelligent qui filtre automatiquement la navigation selon les permissions :

```typescript
export const useNavigation = () => {
  const { user, isAdmin, isSuperAdmin, isVendeur } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { counts, loading: countsLoading } = useSidebarCounts();

  // Filtrage automatique basé sur les permissions
  const shouldShowItem = (item: NavItem): boolean => {
    if (!item.permission) return true;
    if (isSuperAdmin()) return true;
    return hasPermission(item.permission);
  };

  // Injection des badges dynamiques
  const getItemBadge = (item: NavItem): string => {
    if (item.countKey && counts[item.countKey] > 0) {
      return counts[item.countKey].toString();
    }
    return typeof item.badge === 'function' ? item.badge() : item.badge || '';
  };

  return {
    currentNavigation,  // Navigation filtrée pour le rôle actuel
    footerNavigation,   // Footer filtré
    countsLoading,
  };
};
```

### 4. Composant Sidebar Refactorisé (`src/components/Sidebar.tsx`)

Utilisation du hook pour afficher la navigation :

```typescript
const { currentNavigation, footerNavigation } = useNavigation();

// Rendu simplifié
<nav className="flex-1 py-4 px-3 overflow-y-auto">
  {currentNavigation.map((group) => (
    <NavGroup key={group.id} title={group.title} collapsed={collapsed}>
      {group.items.map((item) => (
        <NavItem
          key={item.id}
          icon={<item.icon size={18} />}
          label={item.label}
          active={activeItem === item.id}
          onClick={() => handleNavigation(item)}
          badge={item.badge || ''}
          badgeColor={item.badgeColor}
        />
      ))}
    </NavGroup>
  ))}
</nav>
```

---

## 🔐 Architecture Backend

### 1. Modèle de Données (Prisma)

```prisma
model CustomRole {
  id          Int      @id @default(autoincrement())
  name        String   // "Super Administrateur", "Modérateur", etc.
  slug        String   @unique // "superadmin", "moderateur", etc.
  description String?
  isSystem    Boolean  @default(false) // Rôles système non modifiables

  users       User[]
  permissions RolePermission[]

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("custom_roles")
}

model Permission {
  id          Int      @id @default(autoincrement())
  key         String   @unique // "users.admins.view"
  name        String   // "Voir les admins"
  description String?
  module      String   // "users", "products", etc.

  roles       RolePermission[]

  createdAt   DateTime @default(now()) @map("created_at")

  @@map("permissions")
}

model RolePermission {
  roleId       Int
  permissionId Int

  role         CustomRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  assignedAt   DateTime @default(now()) @map("assigned_at")

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

model User {
  id      Int     @id @default(autoincrement())
  email   String  @unique
  roleId  Int?    @map("role_id")

  customRole CustomRole? @relation(fields: [roleId], references: [id])

  // ... autres champs
}
```

### 2. Controllers

#### Rôles (`src/roles/roles.controller.ts`)

```typescript
@Controller('admin/roles')
export class RolesController {
  @Get()
  @RequirePermissions('roles.view')
  findAll() { /* ... */ }

  @Get(':id')
  @RequirePermissions('roles.view')
  findOne(@Param('id') id: number) { /* ... */ }

  @Post()
  @RequirePermissions('roles.create')
  create(@Body() dto: CreateRoleDto) { /* ... */ }

  @Patch(':id')
  @RequirePermissions('roles.update')
  update(@Param('id') id: number, @Body() dto: UpdateRoleDto) { /* ... */ }

  @Delete(':id')
  @RequirePermissions('roles.delete')
  remove(@Param('id') id: number) { /* ... */ }
}
```

#### Permissions (`src/permissions/permissions.controller.ts`)

```typescript
@Controller('admin/permissions')
export class PermissionsController {
  @Get('all')
  @RequirePermissions('settings.view')
  getAllPermissions() { /* ... */ }

  @Get('by-module')
  @RequirePermissions('permissions.view')
  getPermissionsByModule() { /* ... */ }

  @Get('my-permissions')
  getMyPermissions(@Req() req) { /* ... */ }

  @Put('roles/:id/permissions')
  @RequirePermissions('users.admins.roles')
  updateRolePermissions(@Param('id') id: string, @Body() data) { /* ... */ }
}
```

#### Utilisateurs (`src/admin-users/admin-users.controller.ts`)

```typescript
@Controller('admin/users')
export class AdminUsersController {
  @Get()
  @RequirePermissions('users.admins.view')
  findAll(@Query() query: ListUsersQueryDto) { /* ... */ }

  @Get('admins-only')
  @RequirePermissions('users.admins.view')
  getAdminsOnly(@Query() query: ListUsersQueryDto) { /* ... */ }

  @Post()
  @RequirePermissions('users.admins.create')
  create(@Body() dto: CreateUserDto) { /* ... */ }

  @Patch(':id')
  @RequirePermissions('users.admins.edit')
  update(@Param('id') id: number, @Body() dto: UpdateUserDto) { /* ... */ }

  @Delete(':id')
  @RequirePermissions('users.admins.delete')
  remove(@Param('id') id: number) { /* ... */ }
}
```

### 3. Guards

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // SuperAdmin a tous les droits
    if (user.role?.slug === 'superadmin') return true;

    // Vérifier les permissions
    return user.permissions.some(p => requiredPermissions.includes(p.key));
  }
}
```

---

## 📊 Flux de Données

### 1. Chargement de la Navigation

```
┌─────────────────┐
│  Page Load      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  useNavigation Hook             │
├─────────────────────────────────┤
│  1. Récupère user & permissions │
│  2. Récupère counts (badges)    │
│  3. Filtre navigationConfig     │
│  4. Injecte badges dynamiques   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Sidebar Component              │
├─────────────────────────────────┤
│  Affiche navigation filtrée     │
└─────────────────────────────────┘
```

### 2. Vérification des Permissions

```
┌────────────────────┐
│  Navigation Click  │
└─────────┬──────────┘
          │
          ▼
┌───────────────────────────────┐
│  Route Protected Component    │
└─────────┬─────────────────────┘
          │
          ▼
┌────────────────────────────────────┐
│  Backend: PermissionsGuard         │
├────────────────────────────────────┤
│  1. Vérifie JWT                    │
│  2. Charge user + permissions      │
│  3. Vérifie @RequirePermissions    │
│  4. Autorise/Refuse                │
└────────┬───────────────────────────┘
          │
          ▼
┌─────────────────┐
│  Controller     │
└─────────────────┘
```

---

## 🔧 Ajouter un Nouveau Menu

### Frontend

1. **Ajouter l'item dans `src/config/navigation.ts`:**

```typescript
{
  id: 'new-feature',
  label: 'Nouvelle Fonctionnalité',
  icon: Sparkles,
  path: 'new-feature',
  permission: 'features.new.view', // ✅ Facultatif
  badge: 'NOUVEAU',
  badgeColor: 'blue',
}
```

2. **Ajouter la route dans `src/App.tsx`:**

```typescript
<Route path="new-feature" element={<NewFeaturePage />} />
```

### Backend

1. **Ajouter la permission (si nécessaire):**

```sql
INSERT INTO permissions (key, name, description, module)
VALUES ('features.new.view', 'Voir nouvelle fonctionnalité', 'Accès à la nouvelle fonctionnalité', 'features');
```

2. **Créer le controller:**

```typescript
@Controller('admin/new-feature')
export class NewFeatureController {
  @Get()
  @RequirePermissions('features.new.view')
  findAll() { /* ... */ }
}
```

**C'est tout !** 🎉 La navigation s'affiche automatiquement pour les utilisateurs ayant la permission.

---

## 🚨 Dépannage

### Problème: Aucun utilisateur n'apparaît dans `/admin/users`

**Cause:** Les utilisateurs n'ont pas de `roleId` (non migrés vers CustomRole)

**Solution:**
```bash
cd /home/pfdev/Bureau/PrintalmaProject/printalma-back-dep
node migrate-users-to-custom-roles.js
```

### Problème: Menu ne s'affiche pas malgré la permission

**Vérifications:**
1. L'utilisateur a-t-il la permission dans la BDD ?
2. La clé de permission est-elle correcte (ex: `users.admins.view`) ?
3. Le groupe parent a-t-il au moins un item visible ?

**Debug:**
```typescript
const { hasPermission } = usePermissions();
console.log('Has permission:', hasPermission('users.admins.view'));
```

### Problème: Badge ne s'affiche pas

**Vérifications:**
1. `countKey` est défini dans la config
2. `useSidebarCounts` retourne bien la clé
3. Le count est > 0

---

## 📝 Conventions de Nommage

### Permissions (clés)

Format: `{module}.{ressource}.{action}`

Exemples:
- `users.admins.view` - Voir les administrateurs
- `users.admins.create` - Créer un administrateur
- `users.admins.edit` - Modifier un administrateur
- `users.admins.delete` - Supprimer un administrateur
- `users.admins.roles` - Gérer les rôles et permissions
- `products.mockups.view` - Voir les mockups
- `orders.view` - Voir les commandes
- `payments.requests.view` - Voir les demandes de paiement

### Slugs de Rôles

- `superadmin` - Super Administrateur (tous les droits)
- `admin` - Administrateur
- `moderateur` - Modérateur
- `support` - Support Client
- `comptable` - Comptable
- `vendor` - Vendeur

---

## 📚 Documentation des APIs

### Frontend Services

**`src/services/rolesService.ts`**
- `getAllPermissions()` - Toutes les permissions groupées
- `getAllRoles()` - Tous les rôles
- `getRoleById(id)` - Détails d'un rôle
- `updateRolePermissions(roleId, permissionIds)` - MAJ permissions
- `getMyPermissions()` - Permissions de l'utilisateur connecté

**`src/hooks/usePermissions.ts`**
- `hasPermission(key)` - Vérifie une permission
- `hasAnyPermission(keys)` - Vérifie au moins une permission
- `hasAllPermissions(keys)` - Vérifie toutes les permissions

**`src/hooks/useNavigation.ts`**
- `currentNavigation` - Navigation filtrée
- `footerNavigation` - Footer filtré
- `adminNavigation` - Navigation admin
- `vendorNavigation` - Navigation vendeur

### Backend Endpoints

**Rôles:**
- `GET /admin/roles` - Liste des rôles
- `GET /admin/roles/:id` - Détails d'un rôle
- `POST /admin/roles` - Créer un rôle
- `PATCH /admin/roles/:id` - Modifier un rôle
- `DELETE /admin/roles/:id` - Supprimer un rôle

**Permissions:**
- `GET /admin/permissions` - Toutes les permissions
- `GET /admin/permissions/by-module` - Groupées par module
- `GET /admin/permissions/my-permissions` - Mes permissions
- `PUT /admin/permissions/roles/:id/permissions` - MAJ permissions d'un rôle

**Utilisateurs:**
- `GET /admin/users` - Tous les utilisateurs (sauf vendeurs)
- `GET /admin/users/admins-only` - Seulement admin/superadmin
- `GET /admin/users/:id` - Détails d'un utilisateur
- `POST /admin/users` - Créer un utilisateur
- `PATCH /admin/users/:id` - Modifier un utilisateur
- `DELETE /admin/users/:id` - Supprimer un utilisateur

---

## ✅ Avantages de cette Architecture

| Avant | Après |
|-------|-------|
| 🔴 Code dupliqué | ✅ Configuration centralisée |
| 🔴 Difficile d'ajouter un menu | ✅ Ajout en 2 lignes |
| 🔴 Permissions manuelles | ✅ Filtrage automatique |
| 🔴 Pas de type-safety | ✅ TypeScript strict |
| 🔴 Badges hardcodés | ✅ Badges dynamiques |
| 🔴 Performance médiocre | ✅ Hooks memoizés |

---

## 🎯 Prochaines Étapes

- [ ] Ajouter tests unitaires pour `useNavigation`
- [ ] Documenter toutes les permissions existantes
- [ ] Créer interface admin pour gérer les permissions
- [ ] Ajouter logs d'audit pour les changements de rôles
- [ ] Implémenter cache des permissions côté backend

---

**Date de création:** 9 mars 2026
**Auteur:** Claude Sonnet 4.5
**Version:** 1.0.0
