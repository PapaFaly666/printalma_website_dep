# 🚨 URGENT - Fix Backend - Filtre de Statut INVERSÉ

## ⚠️ Problème Critique Identifié

Le filtre `status` dans l'endpoint `GET /auth/admin/clients` **INVERSE LA LOGIQUE** !

### Ce qui se passe actuellement :

- ❌ Quand on envoie `status=false` → Le backend retourne les clients avec `status=true` (actifs)
- ❌ Quand on envoie `status=true` → Le backend retourne les clients avec `status=false` (inactifs)

### Preuve du bug :

**Test effectué :**
```bash
GET /auth/admin/clients?status=false
```

**Résultat obtenu :**
```json
{
  "clients": [
    {"id": 16, "firstName": "Lamines", "status": true},
    {"id": 14, "firstName": "Papa", "status": true},
    {"id": 12, "firstName": "Jean", "status": true},
    {"id": 11, "firstName": "Marie", "status": true},
    {"id": 8, "firstName": "Jean fefe fe fe", "status": true},
    {"id": 7, "firstName": "Papa", "status": true}
  ]
}
```

**Résultat attendu :**
```json
{
  "clients": [
    {"id": 15, "firstName": "Yankhoba", "status": false},
    {"id": 13, "firstName": "Client", "status": false}
  ]
}
```

## 🔧 Solution Temporaire (Frontend)

Un **workaround temporaire** a été implémenté dans `src/services/auth.service.ts` qui **INVERSE** le booléen avant de l'envoyer au backend :

```typescript
// ⚠️ WORKAROUND TEMPORAIRE - Ligne 301-304
if (key === 'status' && typeof value === 'boolean') {
  const invertedValue = !value; // INVERSION
  params.append(key, invertedValue ? 'true' : 'false');
}
```

**Ce workaround DOIT être supprimé** une fois le backend corrigé !

## 🛠️ Fix Backend Requis

### 1. Localiser le bug dans le backend

Le problème est probablement dans le service ou le contrôleur qui gère le filtre `status`. Recherchez :

```typescript
// ❌ Code problématique possible :
where: { status: !filters.status }  // Inversion incorrecte

// OU
.andWhere('user.status != :status', { status: filters.status })  // Mauvais opérateur

// OU
.andWhere('user.status IS NOT :status', { status: filters.status })  // Logique inversée
```

### 2. Code correct attendu

```typescript
// ✅ Code correct :
if (filters.status !== undefined) {
  query.andWhere('user.status = :status', { status: filters.status });
}

// OU avec TypeORM find()
const whereConditions: any = { role: 'VENDEUR' };
if (filters.status !== undefined) {
  whereConditions.status = filters.status;  // Pas d'inversion !
}
```

### 3. Vérifier la transformation du DTO

Assurez-vous que le DTO transforme correctement la string en booléen :

```typescript
import { Transform } from 'class-transformer';

export class ListClientsDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  status?: boolean;
}
```

## 🧪 Tests de Validation

Une fois le backend corrigé :

1. **Test 1 - Inactifs:**
```bash
GET /auth/admin/clients?status=false
# Doit retourner UNIQUEMENT les clients avec status=false (#15, #13)
```

2. **Test 2 - Actifs:**
```bash
GET /auth/admin/clients?status=true
# Doit retourner UNIQUEMENT les clients avec status=true (#16, #14, #12, #11, #8, #7)
```

3. **Test 3 - Tous:**
```bash
GET /auth/admin/clients
# Doit retourner TOUS les clients (#16, #15, #14, #13, #12, #11, #8, #7)
```

## 📝 Actions Requises

### Backend (URGENT) :
1. ✅ Identifier le code qui inverse la logique
2. ✅ Corriger pour utiliser `status = filters.status` (sans inversion)
3. ✅ Tester avec les 3 cas ci-dessus
4. ✅ Déployer le fix

### Frontend (après fix backend) :
1. ✅ Supprimer le workaround dans `src/services/auth.service.ts` (lignes 298-310)
2. ✅ Restaurer le code simple : `params.append(key, value ? 'true' : 'false')`
3. ✅ Tester que les filtres fonctionnent correctement

## 🔍 Fichiers Backend à Vérifier

1. `src/auth/auth.service.ts` - Méthode `listClients()`
2. `src/auth/auth.controller.ts` - Endpoint GET `/admin/clients`
3. `src/auth/dto/list-clients.dto.ts` - Transformation du paramètre `status`

## ⚡ Priorité

**CRITIQUE** - Ce bug rend le filtre de statut complètement inutilisable et inverse tous les résultats.
