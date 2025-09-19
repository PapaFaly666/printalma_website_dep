## Guide backend: champs pour l'affichage du compte vendeur

Objectif: fournir au frontend les informations nécessaires pour afficher dans `/vendeur/account`:
- Membre depuis (date d'inscription)
- Dernière connexion
- Statut du compte (actif/inactif)

### Endpoints requis

- GET `/api/auth/profile` (ou `/api/vendor/profile` si séparation)
  - Authentification requise (cookie session ou Bearer JWT)
  - Retourne les métadonnées utilisateur/vendeur minimales suivantes:

```json
{
  "success": true,
  "data": {
    "id": 7,
    "role": "vendor",
    "firstName": "Papa",
    "lastName": "Diagne",
    "email": "vendor@example.com",
    "created_at": "2025-01-15T10:30:00.000Z",   
    "last_login_at": "2025-09-16T14:22:00.000Z", 
    "is_active": true,
    "shop_name": "Ma Boutique",
    "phone": "+221771234567",
    "country": "Sénégal",
    "address": "Dakar, SN",
    "profile_photo_url": "https://.../photo.jpg"
  }
}
```

Notes:
- `created_at` et `last_login_at` en ISO 8601 (UTC). Le frontend formate en français via `toLocaleDateString('fr-FR')`.
- Si aucune dernière connexion, renvoyer `null` ou omettre la clé (le frontend affiche `N/A`).
- `is_active` booléen utilisé pour afficher un badge « Actif/ Inactif ».

### Contrats côté backend

- Auth obligatoire: 401 si non connecté
- Vérification du rôle: 403 si l'utilisateur n'est pas `vendor`
- Structure stable des champs ci‑dessus; éviter de renommer sans coordonner

### Source des données (suggestions)

- Table `users` (ou `vendors`) doit contenir:
  - `created_at` (timestamp de création)
  - `last_login_at` (timestamp de dernière connexion, MAJ lors du login)
  - `is_active` (bool ou dérivé de l'état du compte)

Exemple SQL (PostgreSQL):
```sql
SELECT id, role, first_name AS "firstName", last_name AS "lastName",
       email, created_at, last_login_at, is_active,
       shop_name, phone, country, address, profile_photo_url
FROM users
WHERE id = $1;
```

Exemple Node/Express (TypeScript):
```ts
app.get('/api/auth/profile', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const user = await db.user.findByPk(userId, {
    attributes: [
      'id','role','firstName','lastName','email',
      'created_at','last_login_at','is_active',
      'shop_name','phone','country','address','profile_photo_url'
    ]
  });
  if (!user) return res.status(404).json({ success: false, message: 'Not found' });
  if (user.role !== 'vendor') return res.status(403).json({ success: false, message: 'Forbidden' });
  res.json({ success: true, data: user });
});
```

Mise à jour du `last_login_at` au login:
```ts
// Après validation des identifiants
await db.user.update({ last_login_at: new Date().toISOString() }, { where: { id: user.id } });
```

### Tests de conformité (checklist)

- [ ] Un vendor authentifié reçoit `200` avec les champs listés
- [ ] Un non authentifié reçoit `401`
- [ ] Un utilisateur non vendor reçoit `403`
- [ ] `created_at` est non nul et au format ISO
- [ ] `last_login_at` est ISO ou `null` si jamais connecté
- [ ] `is_active` est booléen

### Évolutions optionnelles

- GET `/api/vendor/account-stats` (agrégats rapides)
```json
{
  "success": true,
  "data": {
    "totalDesigns": 12,
    "publishedDesigns": 7,
    "pendingDesigns": 3,
    "rejectedDesigns": 2,
    "totalSales": 154,
    "totalEarnings": 250000,
    "lastSaleAt": "2025-09-16T13:00:00.000Z"
  }
}
```

Ces champs sont facultatifs et destinés à enrichir la section « Statistiques du compte » ultérieurement.



