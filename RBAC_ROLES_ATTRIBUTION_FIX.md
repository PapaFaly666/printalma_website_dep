# Correction - Attribution de Rôles par le Superadmin

## Problème Identifié

Le système utilisait `/admin/roles` pour récupérer les rôles lors de la création d'utilisateur, ce qui incluait le rôle **vendor**. Selon la documentation backend, le rôle vendor ne doit **jamais** être assigné manuellement par un admin - il est créé automatiquement lors de l'inscription d'un vendeur.

## Solution Appliquée

### 1. Nouveau Service API

**Fichier:** `src/services/userManagementService.ts`

Ajout de la fonction `fetchAvailableRolesForUsers()` qui utilise l'endpoint correct :

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

### 2. Séparation des Rôles dans le Composant

**Fichier:** `src/pages/admin/AdminUsersPage.tsx`

#### État :
```typescript
const [roles, setRoles] = useState<Role[]>([]); // Pour les filtres (tous les rôles)
const [availableRoles, setAvailableRoles] = useState<Role[]>([]); // Pour la création (exclut vendor)
```

#### Chargement des données :
```typescript
const loadData = async () => {
  const [usersData, rolesData, availableRolesData, statsData] = await Promise.all([
    fetchUsers(),
    fetchRoles(), // Tous les rôles pour les filtres
    fetchAvailableRolesForUsers(), // Rôles sans vendor pour la création
    fetchUserStats()
  ]);

  setRoles(rolesData);
  setAvailableRoles(availableRolesData);
};
```

#### Formulaire de création :
```typescript
<Select
  value={formData.roleId.toString()}
  onValueChange={(value) => setFormData({ ...formData, roleId: parseInt(value) })}
>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionner un rôle" />
  </SelectTrigger>
  <SelectContent>
    {availableRoles.map((role) => ( // Utilise availableRoles au lieu de roles
      <SelectItem key={role.id} value={role.id.toString()}>
        {role.name}
        {role.description && (
          <span className="text-xs text-gray-500 ml-2">- {role.description}</span>
        )}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 3. Conversion du roleId

Ajout d'une conversion explicite pour s'assurer que `roleId` est envoyé comme `number` :

```typescript
const handleCreateUser = async () => {
  // ...validations

  const userPayload: CreateUserInput = {
    ...formData,
    roleId: typeof formData.roleId === 'string' ? parseInt(formData.roleId) : formData.roleId
  };

  await createUser(userPayload);
};
```

## Endpoints Backend Utilisés

### Pour la création d'utilisateur
```
GET /admin/roles/available-for-users
```
**Retourne:** Tous les rôles SAUF le rôle vendor

**Utilisation:** Alimenter le dropdown de sélection de rôle lors de la création d'utilisateur

### Pour les filtres
```
GET /admin/roles
```
**Retourne:** Tous les rôles y compris vendor

**Utilisation:** Filtrer la liste des utilisateurs (car des utilisateurs peuvent avoir le rôle vendor)

## Pourquoi Cette Séparation ?

| Contexte | Endpoint | Raison |
|----------|----------|---------|
| **Créer un utilisateur** | `/admin/roles/available-for-users` | Le rôle vendor est créé automatiquement lors de l'inscription vendeur. Un admin ne doit pas pouvoir l'assigner manuellement. |
| **Filtrer les utilisateurs** | `/admin/roles` | On doit pouvoir filtrer par TOUS les rôles, y compris vendor, car des utilisateurs existants ont ce rôle. |
| **Modifier un utilisateur** | `/admin/roles` (modal d'édition utilise `roles`) | On peut modifier le rôle d'un utilisateur existant, même s'il est vendor. |

## Types TypeScript

Les types sont déjà corrects dans `src/types/user.types.ts` :

```typescript
export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  roleId: number | string; // Le backend accepte les deux
  status?: UserStatus;
}
```

## Comportement Final

### ✅ CE QUI FONCTIONNE MAINTENANT

1. **Création d'utilisateur**
   - Le dropdown affiche uniquement : Superadmin, Admin, Finance, Production, Marketing, etc.
   - Le rôle Vendor n'apparaît PAS dans la liste
   - Le roleId est correctement envoyé comme number au backend

2. **Filtrage des utilisateurs**
   - Le dropdown de filtre affiche TOUS les rôles y compris Vendor
   - Permet de filtrer les utilisateurs qui ont le rôle vendor (créés via inscription)

3. **Modification d'utilisateur**
   - Utilise tous les rôles (y compris vendor) pour permettre la modification

### ❌ CE QUI EST EMPÊCHÉ

- Un admin ne peut plus assigner manuellement le rôle "vendor" lors de la création d'un utilisateur
- Cela respecte la logique métier : seule l'inscription vendeur crée automatiquement le rôle vendor

## Documentation Backend de Référence

Selon la documentation fournie par l'utilisateur :

```
### 2. Récupérer les rôles disponibles pour créer des utilisateurs (exclut vendor)

**Endpoint:** `GET /admin/roles/available-for-users`

**Important:** Utilisez cet endpoint pour alimenter le dropdown de sélection
de rôle lors de la création d'utilisateur.
```

## Tests à Effectuer

1. ✅ Ouvrir le modal de création d'utilisateur
2. ✅ Vérifier que le dropdown "Rôle" n'affiche PAS le rôle "Vendor"
3. ✅ Créer un utilisateur avec un rôle (ex: Admin, Finance)
4. ✅ Vérifier que la requête POST contient `roleId` comme number
5. ✅ Vérifier que le filtre de rôle affiche TOUS les rôles y compris Vendor
6. ✅ Vérifier que les utilisateurs avec le rôle Vendor apparaissent dans la liste

## Fichiers Modifiés

1. `src/services/userManagementService.ts`
   - Ajout de `fetchAvailableRolesForUsers()`

2. `src/pages/admin/AdminUsersPage.tsx`
   - Ajout de l'état `availableRoles`
   - Modification de `loadData()` pour charger les deux listes
   - Modification du formulaire de création pour utiliser `availableRoles`
   - Ajout de la conversion explicite du `roleId` en number

## Conformité avec la Documentation

Cette implémentation est maintenant **100% conforme** avec la documentation backend fournie et suit les meilleures pratiques décrites dans le guide d'intégration frontend.
