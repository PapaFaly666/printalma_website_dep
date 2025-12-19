# ⚠️ Backend à Déployer - Profil Vendeur

## 🚨 Problème Actuel

L'endpoint `/auth/vendor/profile/status` fonctionne en **local** mais retourne **404 en production**.

```bash
# ✅ Local (fonctionne)
curl http://localhost:3004/auth/vendor/profile/status

# ❌ Production (404)
curl https://printalma-back-dep.onrender.com/auth/vendor/profile/status
```

## 📋 Endpoints Backend Requis

Le backend doit implémenter les endpoints suivants selon la doc `BACKEND_DESIGN_REVENUE_IMPLEMENTATION.md` :

### 1. Vérifier le statut du profil
```http
GET /auth/vendor/profile/status
Authorization: Bearer <token> ou Cookie auth_token
```

**Réponse attendue:**
```json
{
  "isFirstLogin": true,
  "isProfileComplete": false,
  "missingItems": [
    "Biographie",
    "Au moins un réseau social"
  ],
  "profile": {
    "professional_title": "Créateur de designs personnalisés carré",
    "vendor_bio": null,
    "has_social_media": false
  }
}
```

### 2. Mettre à jour la biographie et le titre
```http
PUT /auth/vendor/profile/bio
Authorization: Bearer <token> ou Cookie auth_token
Content-Type: application/json

{
  "vendor_bio": "Designer graphique passionné...",
  "professional_title": "Designer Graphique Senior"
}
```

### 3. Mettre à jour les réseaux sociaux
```http
PUT /auth/vendor/profile/social-media
Authorization: Bearer <token> ou Cookie auth_token
Content-Type: application/json

{
  "instagram": "https://instagram.com/compte",
  "facebook": "https://facebook.com/compte"
}
```

### 4. Marquer la première connexion comme terminée
```http
POST /auth/vendor/first-login-complete
Authorization: Bearer <token> ou Cookie auth_token
```

### 5. Récupérer le profil actuel
```http
GET /auth/vendor/profile/bio
Authorization: Bearer <token> ou Cookie auth_token
```

## 🛠️ Actions Requises

1. **Déployer le backend** avec les nouveaux endpoints sur `printalma-back-dep.onrender.com`
2. **Vérifier que la base de données** a les colonnes nécessaires :
   - `vendor_bio` (TEXT, nullable)
   - `professional_title` (VARCHAR(200), nullable)
   - Colonnes pour réseaux sociaux (instagram_url, facebook_url, etc.)
   - `profile_completed` (BOOLEAN, default false)
   - `first_login_completed` (BOOLEAN, default false)

3. **Tester les endpoints** avec :
   ```bash
   # Tester le statut
   curl -X GET https://printalma-back-dep.onrender.com/auth/vendor/profile/status \
     -H "Cookie: auth_token=VOTRE_TOKEN"

   # Tester la mise à jour
   curl -X PUT https://printalma-back-dep.onrender.com/auth/vendor/profile/bio \
     -H "Cookie: auth_token=VOTRE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "vendor_bio": "Test bio de plus de 10 caractères",
       "professional_title": "Test Titre"
     }'
   ```

## 🔄 État Actuel du Frontend

Le frontend gère gracieusement l'absence de l'endpoint :

- ⚠️ Si 404 → La bannière est **automatiquement masquée**
- ⚠️ Un warning s'affiche dans la console : "Endpoint pas encore déployé"
- ✅ Aucune erreur visible pour l'utilisateur

**Logs console:**
```
⚠️ [useVendorProfile] Endpoint /auth/vendor/profile/status pas encore déployé en production
💡 [useVendorProfile] La bannière de profil sera désactivée jusqu'au déploiement du backend
```

## ✅ Une Fois le Backend Déployé

1. La bannière s'affichera automatiquement pour les vendeurs avec profil incomplet
2. Les vendeurs pourront compléter leur profil via `/vendeur/profile-setup`
3. La bannière reviendra à chaque connexion jusqu'à complétion du profil
4. Comportement identique à Instagram/LinkedIn

## 📚 Documentation Complète

Voir les fichiers suivants pour plus de détails :
- `GUIDE_TEST_PROFIL_VENDEUR.md` - Guide de test complet
- `BACKEND_DESIGN_REVENUE_IMPLEMENTATION.md` - Spécifications backend (si disponible)
- Doc intégrée dans ce message

## 🎯 Priorité

**MOYENNE** - La fonctionnalité est importante pour augmenter la visibilité des vendeurs, mais le site fonctionne sans elle.

## 📞 Contact

Une fois le backend déployé, le frontend fonctionnera automatiquement sans modification !
