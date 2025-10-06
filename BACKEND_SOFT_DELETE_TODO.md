# 🚨 TODO Backend - Implémentation Soft Delete des Vendeurs

## ⚠️ État Actuel

Le **frontend est prêt** mais les endpoints backend ne sont **pas encore implémentés**.

Erreur actuelle :
```
GET http://localhost:3004/auth/admin/vendors/trash?page=1&limit=10 400 (Bad Request)
```

---

## 📋 Endpoints à Implémenter

### 1. **Soft Delete d'un vendeur**
- **Route** : `PUT /auth/admin/vendors/:id/soft-delete`
- **Controller** : `auth.controller.ts`
- **Service** : `auth.service.ts` → méthode `softDeleteVendor()`
- **Description** : Marque un vendeur comme supprimé (soft delete)
- **Voir** : [VENDOR_SOFT_DELETE_BACKEND_GUIDE.md](VENDOR_SOFT_DELETE_BACKEND_GUIDE.md#1-soft-delete-dun-vendeur-deleteput) lignes 15-126

### 2. **Liste de la corbeille**
- **Route** : `GET /auth/admin/vendors/trash`
- **Controller** : `auth.controller.ts`
- **Service** : `auth.service.ts` → méthode `getDeletedVendors()`
- **Description** : Récupère la liste paginée des vendeurs supprimés
- **Voir** : [VENDOR_SOFT_DELETE_BACKEND_GUIDE.md](VENDOR_SOFT_DELETE_BACKEND_GUIDE.md#2-liste-de-la-corbeille-get) lignes 128-223

### 3. **Restaurer un vendeur**
- **Route** : `PUT /auth/admin/vendors/:id/restore`
- **Controller** : `auth.controller.ts`
- **Service** : `auth.service.ts` → méthode `restoreVendor()`
- **Description** : Restaure un vendeur précédemment supprimé
- **Voir** : [VENDOR_SOFT_DELETE_BACKEND_GUIDE.md](VENDOR_SOFT_DELETE_BACKEND_GUIDE.md#3-restaurer-un-vendeur-put) lignes 225-283

---

## 🗄️ Modifications de la Base de Données

### Colonnes déjà ajoutées au modèle User (Prisma)

```prisma
model User {
  // ... autres champs existants ...

  is_deleted    Boolean   @default(false)
  deleted_at    DateTime?
  deleted_by    Int?

  // Relations pour le soft delete
  deletedByUser User?    @relation("DeletedByUser", fields: [deleted_by], references: [id], onDelete: SetNull)
  deletedUsers  User[]   @relation("DeletedByUser")

  // Index pour optimiser les performances
  @@index([is_deleted])
  @@index([deleted_at])
}
```

**✅ Ces colonnes ont déjà été synchronisées avec la base de données Neon via `npx prisma db push`**

---

## 🎯 Checklist d'Implémentation Backend

- [ ] **Créer l'endpoint** `PUT /auth/admin/vendors/:id/soft-delete`
  - [ ] Ajouter la route dans `auth.controller.ts`
  - [ ] Implémenter `softDeleteVendor()` dans `auth.service.ts`
  - [ ] Vérifier que `is_deleted = true`, `deleted_at = now()`, `deleted_by = admin.id`, `status = false`
  - [ ] Protection SUPERADMIN (impossible de supprimer un SUPERADMIN)
  
- [ ] **Créer l'endpoint** `GET /auth/admin/vendors/trash`
  - [ ] Ajouter la route dans `auth.controller.ts`
  - [ ] Implémenter `getDeletedVendors()` dans `auth.service.ts`
  - [ ] Filtres : `page`, `limit`, `search`, `vendeur_type`
  - [ ] Inclure la relation `deletedByUser` pour afficher qui a supprimé
  - [ ] Retourner pagination complète
  
- [ ] **Créer l'endpoint** `PUT /auth/admin/vendors/:id/restore`
  - [ ] Ajouter la route dans `auth.controller.ts`
  - [ ] Implémenter `restoreVendor()` dans `auth.service.ts`
  - [ ] Réinitialiser : `is_deleted = false`, `deleted_at = null`, `deleted_by = null`, `status = true`

- [ ] **Modifier les requêtes existantes** pour exclure les vendeurs supprimés
  - [ ] `listClients()` → ajouter filtre `is_deleted: false`
  - [ ] `listAllVendors()` → ajouter filtre `is_deleted: false`
  - [ ] `getVendorStatsByCountry()` → ajouter filtre `is_deleted: false`
  - [ ] `getExtendedVendorProfile()` → ajouter filtre `is_deleted: false`

- [ ] **Tester les endpoints**
  - [ ] Tester soft delete avec Postman/Insomnia
  - [ ] Tester la corbeille avec pagination
  - [ ] Tester la restauration
  - [ ] Vérifier que les vendeurs supprimés n'apparaissent plus dans les listes

---

## 🔗 Frontend Déjà Implémenté

### ✅ Ce qui fonctionne côté frontend

1. **Service API** ([src/services/auth.service.ts](src/services/auth.service.ts)) ✅
   - `softDeleteVendor(vendorId)` - ligne 728
   - `restoreVendor(vendorId)` - ligne 741
   - `getDeletedVendors(filters)` - ligne 754

2. **Page de gestion des clients** ([src/pages/ClientManagement.tsx](src/pages/ClientManagement.tsx)) ✅
   - Bouton "Supprimer le vendeur" dans le menu d'actions
   - Modal de confirmation de suppression
   - Gestion d'erreur avec message clair si endpoint manquant

3. **Page de corbeille** ([src/pages/admin/AdminTrashPage.tsx](src/pages/admin/AdminTrashPage.tsx)) ✅
   - Onglet "Mockups" (déjà fonctionnel)
   - Onglet "Vendeurs" (attend l'implémentation backend)
   - Filtres, recherche, pagination
   - Bouton de restauration
   - Gestion d'erreur avec message clair si endpoints manquants

4. **Composant Tableau** ([src/components/ClientsTable.tsx](src/components/ClientsTable.tsx)) ✅
   - Bouton de suppression dans le menu d'actions
   - Modal de confirmation

5. **Routing** ([src/App.tsx](src/App.tsx)) ✅
   - Route `/admin/trash` configurée

6. **Navigation** ([src/components/Sidebar.tsx](src/components/Sidebar.tsx)) ✅
   - Lien "Corbeille" dans le menu admin

---

## 🚀 Déploiement

Une fois les endpoints implémentés :

1. Tester en local sur `localhost:3004`
2. Déployer sur Render : `https://printalma-back-dep.onrender.com`
3. Le frontend détectera automatiquement que les endpoints fonctionnent

---

## 📞 Contact

Pour toute question sur l'implémentation, référez-vous à :
- [VENDOR_SOFT_DELETE_BACKEND_GUIDE.md](VENDOR_SOFT_DELETE_BACKEND_GUIDE.md) - Guide complet
- Documentation NestJS : https://docs.nestjs.com/
- Documentation Prisma : https://www.prisma.io/docs/

**Le frontend est 100% prêt et n'attend que l'implémentation backend ! 🎉**
