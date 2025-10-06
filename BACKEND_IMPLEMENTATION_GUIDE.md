# 🚀 Guide d'Implémentation Backend - Soft Delete des Vendeurs

## 📌 Statut Actuel

- ✅ **Frontend** : 100% implémenté et prêt
- ❌ **Backend** : Endpoints manquants
- ✅ **Base de données** : Colonnes ajoutées et synchronisées

### ⚠️ Erreur Actuelle

```
GET http://localhost:3004/auth/admin/vendors/trash?page=1&limit=10
Status: 400 Bad Request
Error: "Validation failed (numeric string is expected)"
```

**Cause** : Le backend NestJS attend la route mais elle n'est pas encore implémentée. Cette erreur apparaît quand le contrôleur existe mais la logique métier est manquante.

**Solution** : Suivre ce guide pour implémenter les 3 endpoints manquants.

---

## 🗄️ Étape 1 : Vérification de la Base de Données

### Colonnes déjà ajoutées au modèle `User` (Prisma Schema)

Vérifiez que votre fichier `prisma/schema.prisma` contient ces champs :

```prisma
model User {
  id                Int       @id @default(autoincrement())
  email             String    @unique
  password          String
  firstName         String?
  lastName          String?
  role              String    @default("CLIENT")
  status            Boolean   @default(true)
  vendeur_type      String?
  phone             String?
  country           String?
  address           String?
  shop_name         String?
  profile_photo_url String?
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt

  // 🆕 Champs pour le soft delete
  is_deleted        Boolean   @default(false)
  deleted_at        DateTime?
  deleted_by        Int?

  // Relations pour le soft delete
  deletedByUser     User?     @relation("DeletedByUser", fields: [deleted_by], references: [id], onDelete: SetNull)
  deletedUsers      User[]    @relation("DeletedByUser")

  // Index pour optimiser les performances
  @@index([is_deleted])
  @@index([deleted_at])
  @@map("users")
}
```

### Synchronisation

Si les colonnes ne sont pas encore ajoutées, exécutez :

```bash
npx prisma db push
```

---

## 🔧 Étape 2 : Implémentation dans auth.service.ts

Ajoutez ces trois méthodes dans votre fichier `src/auth/auth.service.ts` :

### 1. Soft Delete d'un vendeur

```typescript
/**
 * Supprimer un vendeur (soft delete) - Admin uniquement
 */
async softDeleteVendor(vendorId: number, adminId: number) {
  // Vérifier que c'est bien un vendeur
  const vendor = await this.prisma.user.findUnique({
    where: { id: vendorId }
  });

  if (!vendor) {
    throw new NotFoundException('Vendeur non trouvé');
  }

  if (vendor.role !== 'VENDEUR') {
    throw new BadRequestException('Cet utilisateur n\'est pas un vendeur');
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
  const updatedVendor = await this.prisma.user.update({
    where: { id: vendorId },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      deleted_by: adminId,
      status: false // Désactiver aussi le compte
    }
  });

  return {
    success: true,
    message: 'Vendeur supprimé avec succès',
    vendor: {
      id: updatedVendor.id,
      email: updatedVendor.email,
      firstName: updatedVendor.firstName,
      lastName: updatedVendor.lastName,
      is_deleted: updatedVendor.is_deleted,
      deleted_at: updatedVendor.deleted_at,
      deleted_by: updatedVendor.deleted_by,
      status: updatedVendor.status
    }
  };
}
```

### 2. Restaurer un vendeur supprimé

```typescript
/**
 * Restaurer un vendeur supprimé - Admin uniquement
 */
async restoreVendor(vendorId: number) {
  const vendor = await this.prisma.user.findUnique({
    where: { id: vendorId }
  });

  if (!vendor) {
    throw new NotFoundException('Vendeur non trouvé');
  }

  if (!vendor.is_deleted) {
    throw new BadRequestException('Ce vendeur n\'est pas supprimé');
  }

  if (vendor.role !== 'VENDEUR') {
    throw new BadRequestException('Cet utilisateur n\'est pas un vendeur');
  }

  // Restaurer
  const restoredVendor = await this.prisma.user.update({
    where: { id: vendorId },
    data: {
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      status: true // Réactiver le compte
    }
  });

  return {
    success: true,
    message: 'Vendeur restauré avec succès',
    vendor: restoredVendor
  };
}
```

### 3. Liste de la corbeille (vendeurs supprimés)

```typescript
/**
 * Récupérer la liste des vendeurs supprimés (corbeille) - Admin uniquement
 */
async getDeletedVendors(filters: {
  page?: number;
  limit?: number;
  search?: string;
  vendeur_type?: string;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  // Construction de la requête WHERE
  const where: any = {
    role: 'VENDEUR',
    is_deleted: true
  };

  // Filtre de recherche
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { shop_name: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  // Filtre par type de vendeur
  if (filters.vendeur_type) {
    where.vendeur_type = filters.vendeur_type;
  }

  // Récupérer les vendeurs supprimés avec pagination
  const [vendors, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        deleted_at: 'desc' // Plus récents en premier
      },
      include: {
        deletedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    }),
    this.prisma.user.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    vendors,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    },
    message: `${total} vendeur(s) supprimé(s) trouvé(s)`
  };
}
```

---

## 🛣️ Étape 3 : Implémentation dans auth.controller.ts

Ajoutez ces trois routes dans votre fichier `src/auth/auth.controller.ts` :

```typescript
import {
  Controller,
  Put,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ... autres routes existantes ...

  /**
   * Soft Delete d'un vendeur
   */
  @Put('admin/vendors/:id/soft-delete')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async softDeleteVendor(
    @Param('id', ParseIntPipe) vendorId: number,
    @Request() req: any
  ) {
    const adminId = req.user.userId; // ID de l'admin qui supprime
    return this.authService.softDeleteVendor(vendorId, adminId);
  }

  /**
   * Restaurer un vendeur supprimé
   */
  @Put('admin/vendors/:id/restore')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async restoreVendor(@Param('id', ParseIntPipe) vendorId: number) {
    return this.authService.restoreVendor(vendorId);
  }

  /**
   * Liste de la corbeille (vendeurs supprimés)
   */
  @Get('admin/vendors/trash')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getDeletedVendors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('vendeur_type') vendeur_type?: string
  ) {
    return this.authService.getDeletedVendors({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      vendeur_type
    });
  }
}
```

---

## 🔒 Étape 4 : Modifier les Requêtes Existantes

### 1. Méthode `listClients()` - Exclure les vendeurs supprimés

Trouvez la méthode `listClients()` et ajoutez le filtre `is_deleted: false` :

```typescript
async listClients(filters: any) {
  const where: any = {
    role: 'VENDEUR',
    is_deleted: false // 🆕 Ajouter cette ligne
  };

  // ... reste de la logique
}
```

### 2. Méthode `listAllVendors()` - Exclure les vendeurs supprimés

```typescript
async listAllVendors() {
  return this.prisma.user.findMany({
    where: {
      role: 'VENDEUR',
      is_deleted: false // 🆕 Ajouter cette ligne
    },
    // ... reste de la logique
  });
}
```

### 3. Méthode `getVendorStatsByCountry()` - Exclure des statistiques

```typescript
async getVendorStatsByCountry() {
  const vendors = await this.prisma.user.findMany({
    where: {
      role: 'VENDEUR',
      is_deleted: false // 🆕 Ajouter cette ligne
    },
    // ... reste de la logique
  });
}
```

### 4. Méthode `getExtendedVendorProfile()` - Exclure des profils

```typescript
async getExtendedVendorProfile(vendorId: number) {
  const vendor = await this.prisma.user.findFirst({
    where: {
      id: vendorId,
      role: 'VENDEUR',
      is_deleted: false // 🆕 Ajouter cette ligne
    },
    // ... reste de la logique
  });

  if (!vendor) {
    throw new NotFoundException('Vendeur non trouvé ou supprimé');
  }

  return vendor;
}
```

---

## ✅ Étape 5 : Tests

### Test 1 : Soft Delete

```bash
# Requête
PUT http://localhost:3004/auth/admin/vendors/123/soft-delete
Authorization: Cookie avec session admin

# Réponse attendue (200 OK)
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
    "deleted_by": 1,
    "status": false
  }
}
```

### Test 2 : Liste de la corbeille

```bash
# Requête
GET http://localhost:3004/auth/admin/vendors/trash?page=1&limit=10
Authorization: Cookie avec session admin

# Réponse attendue (200 OK)
{
  "vendors": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  },
  "message": "5 vendeur(s) supprimé(s) trouvé(s)"
}
```

### Test 3 : Restauration

```bash
# Requête
PUT http://localhost:3004/auth/admin/vendors/123/restore
Authorization: Cookie avec session admin

# Réponse attendue (200 OK)
{
  "success": true,
  "message": "Vendeur restauré avec succès",
  "vendor": {
    "id": 123,
    "is_deleted": false,
    "deleted_at": null,
    "deleted_by": null,
    "status": true
  }
}
```

### Test 4 : Vérifier l'exclusion automatique

```bash
# Requête
GET http://localhost:3004/auth/admin/vendors

# Les vendeurs supprimés ne doivent PAS apparaître dans la liste
```

---

## 🐛 Résolution de Problèmes

### Erreur : "Cannot read property 'userId' of undefined"

**Solution** : Vérifiez que votre JWT strategy définit bien `userId` dans le payload :

```typescript
// jwt.strategy.ts
async validate(payload: any) {
  return {
    userId: payload.sub,  // ou payload.id selon votre config
    email: payload.email,
    role: payload.role
  };
}
```

### Erreur : "is_deleted column does not exist"

**Solution** : Synchronisez la base de données :

```bash
npx prisma db push
```

### Erreur 401 Unauthorized

**Solution** : Vérifiez que le cookie de session est bien envoyé avec la requête.

---

## 📦 Résumé des Fichiers à Modifier

| Fichier | Action | Lignes estimées |
|---------|--------|-----------------|
| `prisma/schema.prisma` | ✅ Déjà fait | - |
| `src/auth/auth.service.ts` | Ajouter 3 méthodes | ~150 lignes |
| `src/auth/auth.controller.ts` | Ajouter 3 routes | ~30 lignes |
| `src/auth/auth.service.ts` (existing) | Modifier 4 méthodes | ~4 lignes |

**Total** : ~180 lignes de code à ajouter/modifier

---

## 🎯 Checklist Finale

- [ ] ✅ Vérifier que les colonnes `is_deleted`, `deleted_at`, `deleted_by` existent dans la DB
- [ ] ✅ Ajouter la méthode `softDeleteVendor()` dans `auth.service.ts`
- [ ] ✅ Ajouter la méthode `restoreVendor()` dans `auth.service.ts`
- [ ] ✅ Ajouter la méthode `getDeletedVendors()` dans `auth.service.ts`
- [ ] ✅ Ajouter la route `PUT /admin/vendors/:id/soft-delete` dans `auth.controller.ts`
- [ ] ✅ Ajouter la route `PUT /admin/vendors/:id/restore` dans `auth.controller.ts`
- [ ] ✅ Ajouter la route `GET /admin/vendors/trash` dans `auth.controller.ts`
- [ ] ✅ Modifier `listClients()` pour exclure `is_deleted: true`
- [ ] ✅ Modifier `listAllVendors()` pour exclure `is_deleted: true`
- [ ] ✅ Modifier `getVendorStatsByCountry()` pour exclure `is_deleted: true`
- [ ] ✅ Modifier `getExtendedVendorProfile()` pour exclure `is_deleted: true`
- [ ] ✅ Tester les 3 endpoints avec Postman/Insomnia
- [ ] ✅ Vérifier que les vendeurs supprimés n'apparaissent plus dans les listes
- [ ] ✅ Déployer sur Render
- [ ] ✅ Tester le frontend avec le backend déployé

---

## 🚀 Déploiement

1. **Commit et push les changements** :
```bash
git add .
git commit -m "feat: Implémentation du soft delete des vendeurs"
git push origin main
```

2. **Render déploiera automatiquement** les changements

3. **Tester le frontend** : Allez sur `/admin/trash` et vérifiez que tout fonctionne

---

## 📞 Support

En cas de problème, vérifiez :
1. Les logs du backend sur Render
2. La console du navigateur (erreurs réseau)
3. Que les colonnes existent bien dans la base de données Neon

**Le frontend est 100% prêt ! Une fois le backend implémenté selon ce guide, tout fonctionnera parfaitement. 🎉**
