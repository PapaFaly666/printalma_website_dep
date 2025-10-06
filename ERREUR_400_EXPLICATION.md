# ❌ Explication de l'Erreur 400 - Bad Request

## 🔴 Erreur Actuelle

```
GET http://localhost:3004/auth/admin/vendors/trash?page=1&limit=10
Status: 400 Bad Request

Réponse:
{
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 🔍 Analyse de l'Erreur

### Que signifie cette erreur ?

Cette erreur **400 Bad Request** avec le message `"Validation failed (numeric string is expected)"` indique que :

1. ✅ La route `/auth/admin/vendors/trash` **existe** dans le contrôleur backend
2. ❌ Mais le **handler de la route n'est pas correctement implémenté**
3. ❌ Ou les **paramètres de requête ne sont pas validés correctement**

### Pourquoi cette erreur apparaît-elle ?

NestJS utilise des **ValidationPipes** pour valider automatiquement les paramètres. Si un paramètre est attendu mais mal formaté ou si la route n'a pas de logique métier, cette erreur apparaît.

---

## 🛠️ Solutions Possibles

### Solution 1 : La Route N'est Pas Implémentée (Le Plus Probable)

**Cause** : La route existe dans le controller mais la méthode du service n'est pas implémentée.

**Vérification** :
```typescript
// Dans auth.controller.ts
@Get('admin/vendors/trash')
@UseGuards(JwtAuthGuard, AdminGuard)
async getDeletedVendors(...) {
  return this.authService.getDeletedVendors(...); // ← Cette méthode existe-t-elle ?
}
```

**Solution** : Implémenter la méthode `getDeletedVendors()` dans `auth.service.ts` selon le [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md).

---

### Solution 2 : Validation des Paramètres Manquante

**Cause** : Les paramètres `page` et `limit` ne sont pas correctement validés.

**Code Actuel (Potentiellement Incorrect)** :
```typescript
@Get('admin/vendors/trash')
async getDeletedVendors(
  @Query('page', ParseIntPipe) page?: number,  // ← ParseIntPipe peut échouer si page=undefined
  @Query('limit', ParseIntPipe) limit?: number  // ← ParseIntPipe peut échouer si limit=undefined
) {
  // ...
}
```

**Code Correct** :
```typescript
@Get('admin/vendors/trash')
@UseGuards(JwtAuthGuard, AdminGuard)
async getDeletedVendors(
  @Query('page') page?: string,        // ← Accepter comme string
  @Query('limit') limit?: string,      // ← Accepter comme string
  @Query('search') search?: string,
  @Query('vendeur_type') vendeur_type?: string
) {
  return this.authService.getDeletedVendors({
    page: page ? parseInt(page, 10) : undefined,    // ← Convertir dans le controller
    limit: limit ? parseInt(limit, 10) : undefined, // ← Convertir dans le controller
    search,
    vendeur_type
  });
}
```

**Pourquoi ?** : Parce que les query params sont optionnels. Si vous utilisez `ParseIntPipe` sur un paramètre optionnel, NestJS lève une erreur de validation si le paramètre est absent.

---

### Solution 3 : Utiliser `ParseIntPipe` avec l'option `optional`

**Alternative** :
```typescript
import { ParseIntPipe, DefaultValuePipe } from '@nestjs/common';

@Get('admin/vendors/trash')
@UseGuards(JwtAuthGuard, AdminGuard)
async getDeletedVendors(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Query('search') search?: string,
  @Query('vendeur_type') vendeur_type?: string
) {
  return this.authService.getDeletedVendors({
    page,
    limit,
    search,
    vendeur_type
  });
}
```

**Avantage** : Définit des valeurs par défaut pour `page` et `limit` si elles ne sont pas fournies.

---

## 🧪 Comment Tester ?

### Test 1 : Vérifier si la route existe

```bash
# Dans le terminal backend, vérifier les logs au démarrage
# Rechercher : GET /auth/admin/vendors/trash
```

Si la route apparaît dans les logs, elle est bien enregistrée.

### Test 2 : Tester avec Postman/Insomnia

```
GET http://localhost:3004/auth/admin/vendors/trash
Headers:
  Cookie: votre_cookie_de_session

# Sans paramètres pour voir si la route répond
```

Si vous obtenez toujours une 400, c'est que la méthode du service n'est pas implémentée.

### Test 3 : Tester avec des paramètres explicites

```
GET http://localhost:3004/auth/admin/vendors/trash?page=1&limit=10
```

---

## ✅ Checklist de Résolution

- [ ] **Vérifier que la route existe** dans `auth.controller.ts`
- [ ] **Vérifier que `getDeletedVendors()` est implémenté** dans `auth.service.ts`
- [ ] **Vérifier que les colonnes DB existent** (`is_deleted`, `deleted_at`, `deleted_by`)
- [ ] **Corriger la validation des paramètres** (ne pas utiliser `ParseIntPipe` sur des params optionnels)
- [ ] **Tester sans paramètres** : `GET /auth/admin/vendors/trash`
- [ ] **Tester avec paramètres** : `GET /auth/admin/vendors/trash?page=1&limit=10`
- [ ] **Vérifier les logs backend** pour voir le message d'erreur exact

---

## 📋 Résumé

| Problème | Solution |
|----------|----------|
| Route non implémentée | Implémenter `getDeletedVendors()` dans `auth.service.ts` selon le guide |
| Validation échoue | Accepter les query params comme `string` puis les convertir manuellement |
| Colonnes DB manquantes | Exécuter `npx prisma db push` |

---

## 🚀 Prochaine Étape

Suivez le guide complet : [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md)

Une fois les 3 endpoints implémentés correctement, le frontend fonctionnera automatiquement ! 🎉
