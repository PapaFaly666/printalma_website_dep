# 🗑️ Soft Delete des Vendeurs - README

## 🎯 Vue d'Ensemble

Cette fonctionnalité permet aux administrateurs de **supprimer logiquement** (soft delete) des vendeurs sans les supprimer physiquement de la base de données. Les vendeurs supprimés sont placés dans une **corbeille** et peuvent être **restaurés** à tout moment.

---

## 📋 État de l'Implémentation

| Composant | Statut | Détails |
|-----------|--------|---------|
| **Frontend** | ✅ 100% | Tous les composants sont implémentés et prêts |
| **Backend** | ❌ 0% | Aucun endpoint n'est implémenté |
| **Base de données** | ✅ 100% | Les colonnes sont déjà ajoutées |

---

## 🚀 Démarrage Rapide pour le Backend

### Option 1 : Guide Complet (Recommandé)

Suivez le guide détaillé : **[BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md)**

Ce guide contient :
- ✅ Code complet à copier-coller
- ✅ Explications détaillées
- ✅ Tests à effectuer
- ✅ Résolution de problèmes

**Temps estimé** : 1h40 - 2h15

---

### Option 2 : Quick Start (Pour les Développeurs Expérimentés)

#### Étape 1 : Ajouter les méthodes au service

Fichier : `src/auth/auth.service.ts`

```typescript
// 1. Soft Delete
async softDeleteVendor(vendorId: number, adminId: number) {
  const vendor = await this.prisma.user.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.role !== 'VENDEUR' || vendor.is_deleted) {
    throw new BadRequestException('Vendeur invalide ou déjà supprimé');
  }
  return this.prisma.user.update({
    where: { id: vendorId },
    data: { is_deleted: true, deleted_at: new Date(), deleted_by: adminId, status: false }
  });
}

// 2. Restauration
async restoreVendor(vendorId: number) {
  const vendor = await this.prisma.user.findUnique({ where: { id: vendorId } });
  if (!vendor || !vendor.is_deleted || vendor.role !== 'VENDEUR') {
    throw new BadRequestException('Vendeur non trouvé ou non supprimé');
  }
  return this.prisma.user.update({
    where: { id: vendorId },
    data: { is_deleted: false, deleted_at: null, deleted_by: null, status: true }
  });
}

// 3. Liste corbeille
async getDeletedVendors(filters: any) {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = { role: 'VENDEUR', is_deleted: true };
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }
  if (filters.vendeur_type) where.vendeur_type = filters.vendeur_type;

  const [vendors, total] = await Promise.all([
    this.prisma.user.findMany({
      where, skip, take: limit,
      orderBy: { deleted_at: 'desc' },
      include: { deletedByUser: { select: { id: true, firstName: true, lastName: true } } }
    }),
    this.prisma.user.count({ where })
  ]);

  return {
    vendors,
    pagination: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrevious: page > 1
    }
  };
}
```

#### Étape 2 : Ajouter les routes au controller

Fichier : `src/auth/auth.controller.ts`

```typescript
@Put('admin/vendors/:id/soft-delete')
@UseGuards(JwtAuthGuard, AdminGuard)
async softDeleteVendor(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
  return this.authService.softDeleteVendor(id, req.user.userId);
}

@Put('admin/vendors/:id/restore')
@UseGuards(JwtAuthGuard, AdminGuard)
async restoreVendor(@Param('id', ParseIntPipe) id: number) {
  return this.authService.restoreVendor(id);
}

@Get('admin/vendors/trash')
@UseGuards(JwtAuthGuard, AdminGuard)
async getDeletedVendors(@Query() filters: any) {
  return this.authService.getDeletedVendors(filters);
}
```

#### Étape 3 : Modifier les requêtes existantes

Ajouter `is_deleted: false` dans les méthodes suivantes :
- `listClients()`
- `listAllVendors()`
- `getVendorStatsByCountry()`
- `getExtendedVendorProfile()`

**Temps estimé** : 30-45 min

---

## 📂 Structure des Fichiers

### Frontend (Déjà Implémentés)

```
src/
├── services/
│   └── auth.service.ts              ✅ 3 méthodes API ajoutées
├── pages/
│   ├── ClientManagement.tsx         ✅ Bouton supprimer + gestion
│   └── admin/
│       └── AdminTrashPage.tsx       ✅ Page corbeille (2 onglets)
├── components/
│   ├── ClientsTable.tsx             ✅ Bouton + modal supprimer
│   └── Sidebar.tsx                  ✅ Lien corbeille
└── App.tsx                          ✅ Route /admin/trash
```

### Backend (À Implémenter)

```
src/
├── auth/
│   ├── auth.service.ts              ❌ Ajouter 3 méthodes
│   └── auth.controller.ts           ❌ Ajouter 3 routes
└── prisma/
    └── schema.prisma                ✅ Colonnes déjà ajoutées
```

---

## 🧪 Tests

### Tests Frontend (Déjà Fonctionnels)

1. ✅ Aller sur `/admin/clients`
2. ✅ Voir le bouton "Supprimer le vendeur" dans les actions
3. ✅ Aller sur `/admin/trash`
4. ✅ Voir les 2 onglets : Mockups + Vendeurs
5. ✅ L'onglet Mockups fonctionne
6. ❌ L'onglet Vendeurs affiche une erreur 400 (normal, backend manquant)

### Tests Backend (À Effectuer Après Implémentation)

```bash
# 1. Soft Delete
PUT http://localhost:3004/auth/admin/vendors/123/soft-delete
→ Devrait retourner 200 OK

# 2. Liste corbeille
GET http://localhost:3004/auth/admin/vendors/trash?page=1&limit=10
→ Devrait retourner la liste des vendeurs supprimés

# 3. Restauration
PUT http://localhost:3004/auth/admin/vendors/123/restore
→ Devrait retourner 200 OK
```

---

## 🐛 Résolution de Problèmes

### Erreur 400 "Validation failed"

**Symptôme** :
```
GET /auth/admin/vendors/trash?page=1&limit=10
Error: "Validation failed (numeric string is expected)"
```

**Cause** : Le backend n'a pas encore implémenté l'endpoint.

**Solution** : Suivre le guide [ERREUR_400_EXPLICATION.md](ERREUR_400_EXPLICATION.md)

---

### Colonne "is_deleted" n'existe pas

**Symptôme** :
```
Error: Column 'is_deleted' does not exist
```

**Cause** : La base de données n'est pas synchronisée.

**Solution** :
```bash
npx prisma db push
```

---

### Les vendeurs supprimés apparaissent toujours

**Symptôme** : Les vendeurs supprimés sont visibles dans `/admin/clients`

**Cause** : Les requêtes existantes n'ont pas été modifiées.

**Solution** : Ajouter `is_deleted: false` dans les méthodes `listClients()`, etc.

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| [STATUS_SOFT_DELETE.md](STATUS_SOFT_DELETE.md) | Statut détaillé de l'implémentation |
| [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md) | Guide complet d'implémentation backend |
| [ERREUR_400_EXPLICATION.md](ERREUR_400_EXPLICATION.md) | Explication de l'erreur 400 actuelle |
| [VENDOR_SOFT_DELETE_BACKEND_GUIDE.md](VENDOR_SOFT_DELETE_BACKEND_GUIDE.md) | Guide original de la fonctionnalité |

---

## ✅ Checklist Backend

- [ ] Ajouter `softDeleteVendor()` dans `auth.service.ts`
- [ ] Ajouter `restoreVendor()` dans `auth.service.ts`
- [ ] Ajouter `getDeletedVendors()` dans `auth.service.ts`
- [ ] Ajouter route `PUT /admin/vendors/:id/soft-delete` dans `auth.controller.ts`
- [ ] Ajouter route `PUT /admin/vendors/:id/restore` dans `auth.controller.ts`
- [ ] Ajouter route `GET /admin/vendors/trash` dans `auth.controller.ts`
- [ ] Modifier `listClients()` pour exclure `is_deleted: true`
- [ ] Modifier `listAllVendors()` pour exclure `is_deleted: true`
- [ ] Modifier `getVendorStatsByCountry()` pour exclure `is_deleted: true`
- [ ] Modifier `getExtendedVendorProfile()` pour exclure `is_deleted: true`
- [ ] Tester avec Postman
- [ ] Déployer sur Render
- [ ] Tester le frontend

---

## 🎉 Résultat Final

Une fois le backend implémenté, les administrateurs pourront :

1. **Supprimer des vendeurs** depuis `/admin/clients`
2. **Voir les vendeurs supprimés** dans `/admin/trash` (onglet Vendeurs)
3. **Restaurer des vendeurs** en un clic
4. **Gérer les mockups supprimés** dans le même endroit (onglet Mockups)

Le tout dans une interface unifiée et intuitive ! 🚀

---

**Prêt à implémenter ? Suivez le guide [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md) ! 💪**
