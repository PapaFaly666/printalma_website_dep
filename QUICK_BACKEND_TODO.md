# ⚡ Backend TODO - Soft Delete Vendeurs

## 🎯 Mission

Implémenter 3 endpoints pour gérer la suppression logique des vendeurs.

**Temps estimé** : 1h40 - 2h15

---

## ✅ Étapes à Suivre

### 1️⃣ Ouvrir `src/auth/auth.service.ts`

Ajouter ces 3 méthodes (code complet dans [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md)) :

```typescript
async softDeleteVendor(vendorId: number, adminId: number) { ... }
async restoreVendor(vendorId: number) { ... }
async getDeletedVendors(filters: any) { ... }
```

**Lignes à ajouter** : ~150

---

### 2️⃣ Ouvrir `src/auth/auth.controller.ts`

Ajouter ces 3 routes :

```typescript
@Put('admin/vendors/:id/soft-delete')
@UseGuards(JwtAuthGuard, AdminGuard)
async softDeleteVendor(...) { ... }

@Put('admin/vendors/:id/restore')
@UseGuards(JwtAuthGuard, AdminGuard)
async restoreVendor(...) { ... }

@Get('admin/vendors/trash')
@UseGuards(JwtAuthGuard, AdminGuard)
async getDeletedVendors(...) { ... }
```

**Lignes à ajouter** : ~30

---

### 3️⃣ Modifier 4 Requêtes Existantes

Dans `src/auth/auth.service.ts`, ajouter `is_deleted: false` dans :

- `listClients()` → ligne ~476
- `listAllVendors()` → ligne ~1580
- `getVendorStatsByCountry()` → ligne ~1285
- `getExtendedVendorProfile()` → ligne ~1121

**Lignes à modifier** : ~4

---

### 4️⃣ Tester avec Postman

```bash
# Test 1
PUT http://localhost:3004/auth/admin/vendors/123/soft-delete

# Test 2
GET http://localhost:3004/auth/admin/vendors/trash?page=1&limit=10

# Test 3
PUT http://localhost:3004/auth/admin/vendors/123/restore
```

---

### 5️⃣ Déployer

```bash
git add .
git commit -m "feat: Soft delete des vendeurs"
git push
```

Render déploiera automatiquement.

---

## 📚 Ressources

| Document | Utilité |
|----------|---------|
| [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md) | **Code complet à copier-coller** |
| [ERREUR_400_EXPLICATION.md](ERREUR_400_EXPLICATION.md) | Comprendre l'erreur actuelle |
| [STATUS_SOFT_DELETE.md](STATUS_SOFT_DELETE.md) | État complet du projet |
| [README_SOFT_DELETE.md](README_SOFT_DELETE.md) | Vue d'ensemble |

---

## 🔴 Erreur Actuelle (Normal)

```
GET /auth/admin/vendors/trash → 400 Bad Request
```

C'est normal ! Le frontend appelle l'endpoint mais il n'existe pas encore.

**Solution** : Implémenter les 3 endpoints ci-dessus.

---

## ✅ Résultat Attendu

Une fois terminé :

1. ✅ Les admins peuvent supprimer des vendeurs depuis `/admin/clients`
2. ✅ Les vendeurs supprimés vont dans la corbeille `/admin/trash`
3. ✅ Les vendeurs peuvent être restaurés en un clic
4. ✅ Les vendeurs supprimés n'apparaissent plus dans les listes

---

**Let's go! 🚀 Suivez [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md) pour le code complet !**
