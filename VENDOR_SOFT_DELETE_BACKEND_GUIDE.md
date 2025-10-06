# Guide Backend - Suppression Soft Delete des Vendeurs

## 📋 Vue d'ensemble

Ce guide explique comment implémenter la fonctionnalité de **suppression soft delete** (suppression logique) des vendeurs côté backend. Les vendeurs supprimés seront marqués comme supprimés mais conservés dans la base de données, et apparaîtront dans une corbeille accessible aux administrateurs.

## 🎯 Objectifs

1. **Soft Delete** : Marquer les vendeurs comme supprimés sans les supprimer physiquement
2. **Corbeille** : Liste des vendeurs supprimés accessible aux admins
3. **Restauration** : Possibilité de restaurer un vendeur supprimé
4. **Suppression définitive** : Option de suppression permanente (hard delete)

---

## 📊 Modifications de la Base de Données

### 1. Ajouter les colonnes nécessaires à la table `users`

```sql
-- Migration: Ajouter les colonnes pour le soft delete
ALTER TABLE users
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN deleted_by INT NULL DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_is_deleted ON users(is_deleted);

-- Clé étrangère pour deleted_by (optionnel, référence l'admin qui a supprimé)
ALTER TABLE users
ADD CONSTRAINT fk_users_deleted_by
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;
```

### 2. Structure de la table après modification

```typescript
// Entity User (exemple NestJS/TypeORM)
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // ... autres colonnes existantes ...

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'int', nullable: true })
  deleted_by: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deletedByUser?: User;
}
```

---

## 🔧 Endpoints à Implémenter

### 1. **Soft Delete d'un vendeur** (DELETE/PUT)

**Endpoint** : `PUT /auth/admin/vendors/:id/soft-delete`
**Méthode** : `PUT`
**Authentification** : Requiert rôle ADMIN ou SUPERADMIN
**Description** : Marque un vendeur comme supprimé

#### Request
```typescript
// Params
{
  id: number // ID du vendeur à supprimer
}

// Headers
Authorization: Cookie avec session admin
```

#### Response Success (200)
```json
{
  "success": true,
  "message": "Vendeur supprimé avec succès",
  "vendor": {
    "id": 123,
    "email": "vendeur@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "is_deleted": true,
    "deleted_at": "2025-10-02T10:30:00Z",
    "deleted_by": 1
  }
}
```

#### Implémentation Backend (NestJS)
```typescript
@Put('vendors/:id/soft-delete')
@UseGuards(AuthGuard, AdminGuard)
async softDeleteVendor(
  @Param('id') vendorId: number,
  @CurrentUser() admin: User
) {
  // Vérifier que c'est bien un vendeur
  const vendor = await this.userRepository.findOne({
    where: { id: vendorId, role: 'VENDEUR' }
  });

  if (!vendor) {
    throw new NotFoundException('Vendeur non trouvé');
  }

  // Vérifier que le vendeur n'est pas déjà supprimé
  if (vendor.is_deleted) {
    throw new BadRequestException('Ce vendeur est déjà supprimé');
  }

  // Protection SUPERADMIN (optionnel)
  if (vendor.role === 'SUPERADMIN') {
    throw new ForbiddenException('Impossible de supprimer un SUPERADMIN');
  }

  // Marquer comme supprimé
  vendor.is_deleted = true;
  vendor.deleted_at = new Date();
  vendor.deleted_by = admin.id;
  vendor.status = false; // Désactiver aussi le compte

  await this.userRepository.save(vendor);

  return {
    success: true,
    message: 'Vendeur supprimé avec succès',
    vendor: {
      id: vendor.id,
      email: vendor.email,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      is_deleted: vendor.is_deleted,
      deleted_at: vendor.deleted_at,
      deleted_by: vendor.deleted_by
    }
  };
}
```

---

### 2. **Liste de la corbeille** (GET)

**Endpoint** : `GET /auth/admin/vendors/trash`
**Méthode** : `GET`
**Authentification** : Requiert rôle ADMIN ou SUPERADMIN
**Description** : Récupère la liste des vendeurs supprimés (corbeille)

#### Request
```typescript
// Query params (optionnels)
{
  page?: number,      // Numéro de page (défaut: 1)
  limit?: number,     // Nombre par page (défaut: 10)
  search?: string,    // Recherche par nom/email
  vendeur_type?: string // Filtrer par type de vendeur
}
```

#### Response Success (200)
```json
{
  "vendors": [
    {
      "id": 123,
      "email": "vendeur@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "vendeur_type": "DESIGNER",
      "is_deleted": true,
      "deleted_at": "2025-10-02T10:30:00Z",
      "deleted_by": 1,
      "deletedByUser": {
        "id": 1,
        "firstName": "Admin",
        "lastName": "Principal"
      },
      "created_at": "2025-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### Implémentation Backend (NestJS)
```typescript
@Get('vendors/trash')
@UseGuards(AuthGuard, AdminGuard)
async getDeletedVendors(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  @Query('search') search?: string,
  @Query('vendeur_type') vendeurType?: string
) {
  const skip = (page - 1) * limit;

  const queryBuilder = this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.deletedByUser', 'deletedBy')
    .where('user.role = :role', { role: 'VENDEUR' })
    .andWhere('user.is_deleted = :isDeleted', { isDeleted: true })
    .orderBy('user.deleted_at', 'DESC');

  // Filtre de recherche
  if (search) {
    queryBuilder.andWhere(
      '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
      { search: `%${search}%` }
    );
  }

  // Filtre par type
  if (vendeurType) {
    queryBuilder.andWhere('user.vendeur_type = :vendeurType', { vendeurType });
  }

  const [vendors, total] = await queryBuilder
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  return {
    vendors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

---

### 3. **Restaurer un vendeur** (PUT)

**Endpoint** : `PUT /auth/admin/vendors/:id/restore`
**Méthode** : `PUT`
**Authentification** : Requiert rôle ADMIN ou SUPERADMIN
**Description** : Restaure un vendeur supprimé

#### Response Success (200)
```json
{
  "success": true,
  "message": "Vendeur restauré avec succès",
  "vendor": {
    "id": 123,
    "email": "vendeur@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "is_deleted": false,
    "deleted_at": null,
    "deleted_by": null,
    "status": true
  }
}
```

#### Implémentation Backend (NestJS)
```typescript
@Put('vendors/:id/restore')
@UseGuards(AuthGuard, AdminGuard)
async restoreVendor(@Param('id') vendorId: number) {
  const vendor = await this.userRepository.findOne({
    where: { id: vendorId, role: 'VENDEUR', is_deleted: true }
  });

  if (!vendor) {
    throw new NotFoundException('Vendeur supprimé non trouvé');
  }

  // Restaurer
  vendor.is_deleted = false;
  vendor.deleted_at = null;
  vendor.deleted_by = null;
  vendor.status = true; // Réactiver le compte

  await this.userRepository.save(vendor);

  return {
    success: true,
    message: 'Vendeur restauré avec succès',
    vendor
  };
}
```

---

### 4. **Suppression définitive** (DELETE)

**Endpoint** : `DELETE /auth/admin/vendors/:id/hard-delete`
**Méthode** : `DELETE`
**Authentification** : Requiert rôle SUPERADMIN uniquement
**Description** : Supprime définitivement un vendeur de la base de données

⚠️ **ATTENTION** : Cette action est irréversible !

#### Response Success (200)
```json
{
  "success": true,
  "message": "Vendeur supprimé définitivement"
}
```

#### Implémentation Backend (NestJS)
```typescript
@Delete('vendors/:id/hard-delete')
@UseGuards(AuthGuard, SuperAdminGuard) // SUPERADMIN uniquement !
async hardDeleteVendor(@Param('id') vendorId: number) {
  const vendor = await this.userRepository.findOne({
    where: { id: vendorId, role: 'VENDEUR', is_deleted: true }
  });

  if (!vendor) {
    throw new NotFoundException('Vendeur supprimé non trouvé');
  }

  // Supprimer définitivement
  await this.userRepository.remove(vendor);

  return {
    success: true,
    message: 'Vendeur supprimé définitivement'
  };
}
```

---

## 🔒 Sécurité et Permissions

### Règles de sécurité

1. **Soft Delete** : Accessible aux ADMIN et SUPERADMIN
2. **Corbeille** : Accessible aux ADMIN et SUPERADMIN
3. **Restauration** : Accessible aux ADMIN et SUPERADMIN
4. **Hard Delete** : SUPERADMIN uniquement (recommandé)

### Protections supplémentaires

```typescript
// Ne pas permettre la suppression de SUPERADMIN
if (vendor.role === 'SUPERADMIN') {
  throw new ForbiddenException('Impossible de supprimer un SUPERADMIN');
}

// Ne pas compter les vendeurs supprimés dans les stats
const activeVendors = await this.userRepository.count({
  where: { role: 'VENDEUR', is_deleted: false }
});
```

---

## 📝 Modifications des Requêtes Existantes

### Exclure les vendeurs supprimés des listings

Modifier toutes les requêtes existantes pour exclure les vendeurs supprimés par défaut :

```typescript
// AVANT
const vendors = await this.userRepository.find({
  where: { role: 'VENDEUR' }
});

// APRÈS
const vendors = await this.userRepository.find({
  where: { role: 'VENDEUR', is_deleted: false }
});
```

### Endpoint /auth/admin/list-clients

Modifier pour exclure les vendeurs supprimés :

```typescript
@Get('list-clients')
@UseGuards(AuthGuard, AdminGuard)
async listClients(@Query() filters: ListClientsQuery) {
  const queryBuilder = this.userRepository
    .createQueryBuilder('user')
    .where('user.role = :role', { role: 'VENDEUR' })
    .andWhere('user.is_deleted = :isDeleted', { isDeleted: false }); // ← Ajouter cette ligne

  // ... reste de la logique
}
```

---

## 🧪 Tests

### Tests à créer

```typescript
describe('Vendor Soft Delete', () => {
  it('devrait soft delete un vendeur', async () => {
    const response = await request(app)
      .put('/auth/admin/vendors/123/soft-delete')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(response.body.vendor.is_deleted).toBe(true);
  });

  it('devrait récupérer la liste de la corbeille', async () => {
    const response = await request(app)
      .get('/auth/admin/vendors/trash')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(response.body.vendors).toBeDefined();
  });

  it('devrait restaurer un vendeur', async () => {
    const response = await request(app)
      .put('/auth/admin/vendors/123/restore')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(response.body.vendor.is_deleted).toBe(false);
  });

  it('ne devrait pas permettre de supprimer un SUPERADMIN', async () => {
    await request(app)
      .put('/auth/admin/vendors/1/soft-delete')
      .set('Cookie', adminCookie)
      .expect(403);
  });
});
```

---

## 📦 Résumé des Endpoints

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| PUT | `/auth/admin/vendors/:id/soft-delete` | ADMIN, SUPERADMIN | Supprimer un vendeur (soft delete) |
| GET | `/auth/admin/vendors/trash` | ADMIN, SUPERADMIN | Liste de la corbeille |
| PUT | `/auth/admin/vendors/:id/restore` | ADMIN, SUPERADMIN | Restaurer un vendeur |
| DELETE | `/auth/admin/vendors/:id/hard-delete` | SUPERADMIN | Suppression définitive |

---

## ✅ Checklist d'implémentation

- [ ] Créer la migration pour ajouter `is_deleted`, `deleted_at`, `deleted_by`
- [ ] Modifier l'entité User pour inclure les nouveaux champs
- [ ] Implémenter l'endpoint soft delete
- [ ] Implémenter l'endpoint de la corbeille
- [ ] Implémenter l'endpoint de restauration
- [ ] Implémenter l'endpoint hard delete (SUPERADMIN)
- [ ] Modifier toutes les requêtes existantes pour exclure `is_deleted = true`
- [ ] Ajouter les guards de sécurité appropriés
- [ ] Créer les tests unitaires et e2e
- [ ] Mettre à jour la documentation API
- [ ] Tester en local
- [ ] Déployer et tester en production

---

## 🎨 Frontend - Intégration

Une fois le backend implémenté, le frontend pourra :

1. Afficher un bouton "Supprimer" dans le menu d'actions des vendeurs
2. Ajouter une section "Corbeille" dans le menu admin
3. Permettre de restaurer ou supprimer définitivement depuis la corbeille
4. Afficher des confirmations pour chaque action

Les endpoints frontend seront ajoutés dans `src/services/auth.service.ts` une fois que le backend sera prêt.

---

## 📞 Support

Pour toute question sur l'implémentation, référez-vous à :
- La documentation NestJS : https://docs.nestjs.com/
- La documentation TypeORM : https://typeorm.io/
- Le fichier `CLAUDE.md` du projet pour l'architecture

---

**Bon développement ! 🚀**
