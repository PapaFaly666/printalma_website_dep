# 🐛 Fix Backend - Filtre de Statut des Clients

## Problème

Le filtre `status` ne fonctionne pas dans l'endpoint `GET /auth/admin/clients`.

Actuellement, l'endpoint retourne **TOUS** les clients (actifs ET inactifs) même quand on envoie `status=false` ou `status=true`.

## Test Actuel

**URL:** `http://localhost:3004/auth/admin/clients?status=false`

**Résultat attendu:** Uniquement les clients avec `status: false`

**Résultat actuel:** TOUS les clients (actifs ET inactifs)

## Solution Backend (NestJS)

### 1. Vérifier le DTO de requête

Dans votre DTO pour `listClients`, assurez-vous que le champ `status` est correctement transformé en booléen :

```typescript
import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListClientsDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  @IsBoolean()
  status?: boolean;

  // ... autres champs
}
```

### 2. Appliquer le filtre dans le service

Dans votre service de gestion des clients :

```typescript
async listClients(filters: ListClientsDto): Promise<ListClientsResponse> {
  const query = this.userRepository.createQueryBuilder('user')
    .where('user.role = :role', { role: 'VENDEUR' });

  // ✅ Filtre par status
  if (filters.status !== undefined) {
    query.andWhere('user.status = :status', { status: filters.status });
  }

  // ... autres filtres

  const [clients, total] = await query.getManyAndCount();

  return {
    clients,
    pagination: {
      // ... pagination
    }
  };
}
```

### 3. Alternative avec TypeORM `find()`

```typescript
const whereConditions: any = { role: 'VENDEUR' };

if (filters.status !== undefined) {
  whereConditions.status = filters.status;
}

const [clients, total] = await this.userRepository.findAndCount({
  where: whereConditions,
  // ... autres options
});
```

## Solution Temporaire (Frontend)

En attendant le fix backend, un **workaround** a été implémenté dans `useClients.ts` qui filtre côté client.

⚠️ **Cette solution temporaire doit être supprimée** une fois le backend corrigé.

## Fichiers à Modifier (Backend)

1. `src/auth/dto/list-clients.dto.ts` - Ajouter la transformation du booléen
2. `src/auth/auth.service.ts` - Appliquer le filtre `status` dans la requête SQL

## Test de Validation

Une fois le backend corrigé, vérifier que :

1. `GET /auth/admin/clients?status=true` retourne **uniquement** les clients actifs
2. `GET /auth/admin/clients?status=false` retourne **uniquement** les clients inactifs
3. `GET /auth/admin/clients` (sans status) retourne **tous** les clients

## Notes

- Les query parameters sont toujours reçus comme des **strings** en HTTP
- NestJS nécessite une transformation explicite pour les booléens
- Le décorateur `@Transform()` de `class-transformer` est essentiel
