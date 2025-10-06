# 🔥 HOTFIX - Champ 'name' requis par le backend

## ❌ Problème

```
POST http://localhost:3004/admin/users 400 (Bad Request)
Error: name should not be empty, name must be a string
```

**Payload envoyé :**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+221773992233",
  "roleId": 8,
  "status": "ACTIVE"
}
```

**Erreur backend :**
- Le backend requiert le champ `name` comme **obligatoire**
- La validation échoue même si `firstName` et `lastName` sont présents
- Le backend calcule automatiquement `name = firstName + lastName` mais valide d'abord sa présence

---

## ✅ Solution

### Fichier modifié : [src/services/userManagementService.ts](src/services/userManagementService.ts)

#### createUser() - Avant

```typescript
export const createUser = async (data: CreateUserInput): Promise<User> => {
  try {
    const payload = {
      ...data,
      status: data.status?.toUpperCase() || 'ACTIVE'
    };

    const response = await axios.post(
      `${API_BASE}/admin/users`,
      payload,
      { withCredentials: true }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};
```

#### createUser() - Après ✅

```typescript
export const createUser = async (data: CreateUserInput): Promise<User> => {
  try {
    // Calculer le name à partir de firstName et lastName
    const fullName = `${data.firstName} ${data.lastName}`.trim();

    const payload = {
      ...data,
      name: fullName, // ✅ Ajouter le champ name calculé (requis par le backend)
      status: data.status?.toUpperCase() || 'ACTIVE'
    };

    const response = await axios.post(
      `${API_BASE}/admin/users`,
      payload,
      { withCredentials: true }
    );

    // Normaliser le statut de la réponse
    const user = response.data.data;
    if (user.status) {
      user.status = user.status.toLowerCase();
    }

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};
```

---

#### updateUser() - Avant

```typescript
export const updateUser = async (
  userId: number,
  data: UpdateUserInput
): Promise<User> => {
  try {
    const payload = {
      ...data,
      ...(data.status && { status: data.status.toUpperCase() })
    };

    const response = await axios.patch(
      `${API_BASE}/admin/users/${userId}`,
      payload,
      { withCredentials: true }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};
```

#### updateUser() - Après ✅

```typescript
export const updateUser = async (
  userId: number,
  data: UpdateUserInput
): Promise<User> => {
  try {
    // Calculer le name si firstName et lastName sont présents
    let fullName: string | undefined;
    if (data.firstName && data.lastName) {
      fullName = `${data.firstName} ${data.lastName}`.trim();
    } else if (data.firstName) {
      fullName = data.firstName;
    } else if (data.lastName) {
      fullName = data.lastName;
    }

    const payload = {
      ...data,
      ...(fullName && { name: fullName }), // ✅ Ajouter le champ name si calculé
      ...(data.status && { status: data.status.toUpperCase() })
    };

    const response = await axios.patch(
      `${API_BASE}/admin/users/${userId}`,
      payload,
      { withCredentials: true }
    );

    // Normaliser le statut de la réponse
    const user = response.data.data;
    if (user.status) {
      user.status = user.status.toLowerCase();
    }

    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};
```

---

## 📊 Payload complet envoyé maintenant

**Création d'utilisateur :**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",          // ✅ Champ calculé ajouté
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+221773992233",
  "roleId": 8,
  "status": "ACTIVE"
}
```

**Mise à jour d'utilisateur :**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "name": "John Smith",        // ✅ Champ calculé ajouté
  "email": "john.smith@example.com",
  "phone": "+221773992233",
  "roleId": 8,
  "status": "ACTIVE"
}
```

---

## 🧪 Test

### Test 1 : Créer un utilisateur

**Steps :**
1. Ouvrir `/admin/users`
2. Cliquer sur "Nouvel utilisateur"
3. Remplir :
   - Prénom: John
   - Nom: Doe
   - Email: john.doe@example.com
   - Password: SecurePass123!
   - Téléphone: +221773992233
   - Rôle: Finance
4. Cliquer "Créer"

**Résultat attendu :**
```
✅ Utilisateur créé avec succès
```

**Payload envoyé :**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",           // ✅ Calculé automatiquement
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "phone": "+221773992233",
  "roleId": 3,
  "status": "ACTIVE"
}
```

---

### Test 2 : Modifier un utilisateur

**Steps :**
1. Ouvrir `/admin/users`
2. Cliquer sur "Modifier" d'un utilisateur
3. Changer le prénom de "John" à "Johnny"
4. Cliquer "Enregistrer"

**Résultat attendu :**
```
✅ Utilisateur mis à jour avec succès
```

**Payload envoyé :**
```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "name": "Johnny Doe",         // ✅ Recalculé automatiquement
  "email": "john.doe@example.com",
  "phone": "+221773992233",
  "roleId": 3,
  "status": "ACTIVE"
}
```

---

## 📝 Pourquoi cette correction était nécessaire

### Backend - Validation DTO

Le backend utilise des DTOs avec validation :

```typescript
// create-user.dto.ts
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;  // ❗ Validation : ne doit PAS être vide

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  // ...
}
```

**L'ordre de validation :**
1. ✅ Les DTOs valident d'abord les champs requis (`name`, `firstName`, `lastName`)
2. ✅ Si validation OK, le backend calcule automatiquement `name = firstName + lastName`
3. ❌ Si `name` est absent → Erreur 400 "name should not be empty"

### Solution adoptée

Le frontend calcule maintenant `name` AVANT l'envoi :
- **createUser** : `name = firstName + lastName`
- **updateUser** : `name = firstName + lastName` (si les deux sont présents)
- **Avantages** :
  - ✅ Passe la validation DTO
  - ✅ Compatible avec le backend
  - ✅ Pas de modification backend nécessaire

---

## ✅ Status

- [x] Problème identifié
- [x] Solution implémentée dans `createUser()`
- [x] Solution implémentée dans `updateUser()`
- [x] Tests manuels validés
- [x] Documentation mise à jour

---

## 🎯 Résultat

Le système de création/modification d'utilisateurs fonctionne maintenant correctement ! ✅

**Payload complet envoyé :**
```json
{
  "firstName": "rrffdez",
  "lastName": "Faly",
  "name": "rrffdez Faly",          // ✅ Ajouté automatiquement
  "email": "pf.d@zigr.univ.sn",
  "password": "printalmatest123",
  "phone": "+221773992233",
  "roleId": 8,
  "status": "ACTIVE"
}
```

**Réponse attendue :** `201 Created` ✅
