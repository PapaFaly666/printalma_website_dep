# 📊 Guide Backend - Statistiques du Compte Vendeur

## 🎯 Objectif
Documenter les endpoints backend nécessaires pour afficher les statistiques du compte vendeur dans la section "Statistiques du compte" de `/vendeur/account`.

## 📍 Page Frontend Concernée
**Page :** `/vendeur/account` (VendorAccountPage.tsx)
**Section :** Sidebar "Statistiques du compte" (lignes 1062-1086)

## 📊 Statistiques Actuellement Affichées

### 1. **Membre depuis**
- **Frontend actuel :** `user?.created_at`
- **Format affiché :** Date en français (ex: "15 janvier 2024")
- **Code actuel :**
```typescript
{user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
```

### 2. **Dernière connexion**
- **Frontend actuel :** `user?.last_login_at`
- **Format affiché :** Date en français (ex: "2 mars 2024")
- **Code actuel :**
```typescript
{user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString('fr-FR') : 'N/A'}
```

### 3. **Statut**
- **Frontend actuel :** Badge statique "Actif"
- **À améliorer :** Statut dynamique basé sur l'activité du vendeur

## 🛠️ Endpoints Backend Requis

### 1. Endpoint Utilisateur/Vendeur
**GET** `/api/vendor/profile` ou `/api/auth/profile`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "vendor",
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_login_at": "2024-03-02T14:22:00.000Z",
    "is_active": true,
    "status": true,
    "shop_name": "My Shop",
    "phone": "+33612345678",
    "country": "France",
    "address": "123 Rue Example",
    "profile_photo_url": "https://example.com/photo.jpg"
  }
}
```

### 2. Endpoint Statistiques Vendeur avec Support Activation/Désactivation
**GET** `/vendor/stats`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "publishedDesigns": 12,
    "validatedDesigns": 8,
    "pendingDesignsCount": 3,
    "totalProducts": 15,
    "memberSince": "2024-01-15T10:30:00.000Z",
    "memberSinceFormatted": "15/01/2024 à 10:30",
    "lastLoginAt": "2024-03-02T14:22:00.000Z",
    "lastLoginAtFormatted": "02/03/2024 à 14:22",
    "status": true,
    "statusChangedAt": "2024-01-15T10:30:00.000Z",
    "accountType": "vendor"
  }
}
```

### 3. Endpoint Désactivation de Compte
**POST** `/vendor/account/deactivate` (ou selon votre guide `/vendor/account/status`)

**Corps de la requête :**
```json
{
  "status": false,
  "reason": "Vacances temporaires"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Compte désactivé avec succès",
  "data": {
    "id": 123,
    "status": false,
    "statusChangedAt": "2024-03-02T15:30:00.000Z"
  }
}
```

### 4. Endpoint Réactivation de Compte
**POST** `/vendor/account/reactivate` (ou selon votre guide `/vendor/account/status`)

**Corps de la requête :**
```json
{
  "status": true,
  "reason": "Retour d'activité"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Compte réactivé avec succès",
  "data": {
    "id": 123,
    "status": true,
    "statusChangedAt": "2024-03-02T16:00:00.000Z"
  }
}
```

### 5. Endpoint Information Compte (Optionnel)
**GET** `/vendor/account/info`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": true,
    "statusChangedAt": "2024-03-02T16:00:00.000Z",
    "statistics": {
      "totalProducts": 12,
      "publishedProducts": 8,
      "totalDesigns": 15,
      "publishedDesigns": 10
    }
  }
}
```

## 📅 Champs Date Critiques

### `created_at` (Membre depuis)
- **Type :** `TIMESTAMP` ou `DATETIME`
- **Format ISO :** `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Utilisation :** Calcul de l'âge du compte pour "Membre depuis"
- **Exemple :** `"2024-01-15T10:30:00.000Z"`

### `last_login_at` (Dernière connexion)
- **Type :** `TIMESTAMP` ou `DATETIME`
- **Format ISO :** `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Mise à jour :** À chaque connexion réussie du vendeur
- **Utilisation :** Affichage "Dernière connexion" dans les stats
- **Exemple :** `"2024-03-02T14:22:00.000Z"`

### `status` / `is_active` (Statut du compte)
- **Type :** `BOOLEAN`
- **Valeurs :** `true` (actif) / `false` (désactivé)
- **Utilisation :** Badge "Actif" ou "Désactivé" dans les stats
- **Impact :** Contrôle la visibilité des produits/designs du vendeur

### `statusChangedAt` (Date de changement de statut)
- **Type :** `TIMESTAMP` ou `DATETIME`
- **Format ISO :** `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Mise à jour :** À chaque activation/désactivation du compte
- **Utilisation :** Historique des changements de statut
- **Exemple :** `"2024-03-02T16:00:00.000Z"`

## 🔧 Implémentation Backend Recommandée

### 1. Middleware de Tracking de Connexion
```javascript
// Middleware à ajouter lors de l'authentification réussie
const updateLastLogin = async (userId) => {
  await User.update(
    { last_login_at: new Date() },
    { where: { id: userId } }
  );
};
```

### 2. Endpoint Profile Vendeur avec Statut
```javascript
// GET /api/vendor/profile
router.get('/profile', authenticateVendor, async (req, res) => {
  try {
    const vendor = await User.findByPk(req.user.id, {
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'role',
        'created_at', 'last_login_at', 'is_active', 'status',
        'shop_name', 'phone', 'country', 'address', 'profile_photo_url'
      ]
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendeur non trouvé'
      });
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});
```

### 3. Endpoint Stats Vendeur avec Dates Formatées
```javascript
// GET /vendor/stats (selon votre guide existant)
router.get('/stats', authenticateVendor, async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Récupérer les stats existantes + infos compte
    const vendor = await User.findByPk(vendorId, {
      attributes: ['created_at', 'last_login_at', 'status', 'statusChangedAt']
    });

    // Formater les dates pour le frontend français
    const formatDateFr = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // ... récupérer les autres stats (designs, produits, etc.)

    res.json({
      success: true,
      data: {
        // Stats existantes
        publishedDesigns: /* votre logique */,
        validatedDesigns: /* votre logique */,
        pendingDesignsCount: /* votre logique */,
        totalProducts: /* votre logique */,

        // Nouvelles données pour les stats du compte
        memberSince: vendor.created_at,
        memberSinceFormatted: formatDateFr(vendor.created_at),
        lastLoginAt: vendor.last_login_at,
        lastLoginAtFormatted: formatDateFr(vendor.last_login_at),
        status: vendor.status ?? true,
        statusChangedAt: vendor.statusChangedAt,
        accountType: "vendor"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});
```

### 4. Endpoints Activation/Désactivation (selon VENDOR_ACCOUNT_STATUS_GUIDE.md)
```javascript
// POST /vendor/account/status (endpoint unifié selon votre guide)
router.patch('/account/status', authenticateVendor, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const vendorId = req.user.id;

    // Validation
    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le statut doit être un booléen'
      });
    }

    // Mettre à jour le statut
    await User.update(
      {
        status: status,
        statusChangedAt: new Date()
      },
      { where: { id: vendorId } }
    );

    // Log de la raison si fournie
    if (reason) {
      console.log(`Vendeur ${vendorId} ${status ? 'activé' : 'désactivé'} - Raison: ${reason}`);
    }

    res.json({
      success: true,
      message: status ? 'Compte réactivé avec succès' : 'Compte désactivé avec succès',
      data: {
        id: vendorId,
        status: status,
        statusChangedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});
```

## 📱 Integration Frontend

### Code Frontend Existant dans VendorAccountPage.tsx
Le frontend a déjà été implémenté pour supporter le système d'activation/désactivation. Voici les éléments clés :

#### 1. Chargement des Statistiques du Compte
```typescript
// Le code utilise déjà /vendor/stats pour récupérer les données
useEffect(() => {
  const loadAccountStats = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.VENDOR.STATS}`, {
        credentials: 'include'
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.success && json?.data) {
        setAccountStats({
          memberSince: json.data.memberSince ?? null,
          lastLoginAt: json.data.lastLoginAt ?? null,
          memberSinceFormatted: json.data.memberSinceFormatted ?? null,
          lastLoginAtFormatted: json.data.lastLoginAtFormatted ?? null,
        });
        // Support du statut d'activation
        if (typeof json.data.status === 'boolean') {
          setAccountActive(json.data.status);
        }
      }
    } catch {}
  };
  loadAccountStats();
}, []);
```

#### 2. Actions d'Activation/Désactivation
```typescript
// Fonctions pour désactiver/réactiver le compte
const deactivateAccount = async () => {
  try {
    setIsLoading(true);
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.VENDOR_DEACTIVATE}`, {
      method: 'POST',
      credentials: 'include'
    });
    const json = await res.json();
    if (res.ok && json?.success) {
      setAccountActive(false);
      toast.success('Compte vendeur désactivé');
    }
  } catch (e) {
    toast.error('Erreur lors de la désactivation');
  } finally {
    setIsLoading(false);
  }
};

const reactivateAccount = async () => {
  // Logique similaire pour la réactivation
};
```

#### 3. Affichage des Statistiques dans la Sidebar
```typescript
// Sidebar avec badges dynamiques selon le statut
<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  <span className="text-sm text-gray-600">Membre depuis</span>
  <span className="text-sm font-semibold text-gray-900">
    {accountStats?.memberSinceFormatted
      ?? formatIsoToFr(accountStats?.memberSince)
      ?? (user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—')}
  </span>
</div>

<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  <span className="text-sm text-gray-600">Dernière connexion</span>
  <span className="text-sm font-semibold text-gray-900">
    {accountStats?.lastLoginAtFormatted
      ?? formatIsoToFr(accountStats?.lastLoginAt)
      ?? (user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString('fr-FR') : '—')}
  </span>
</div>

<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  <span className="text-sm text-gray-600">Statut</span>
  {accountActive === false ? (
    <Badge className="bg-red-100 text-red-800 font-semibold">Désactivé</Badge>
  ) : (
    <Badge className="bg-green-100 text-green-800 font-semibold">Actif</Badge>
  )}
</div>
```

## 🎯 Configuration Endpoints Frontend

### API_ENDPOINTS Configuration
Selon le code frontend existant, les endpoints suivants doivent être configurés dans `src/config/api.ts` :

```typescript
export const API_ENDPOINTS = {
  VENDOR: {
    STATS: '/vendor/stats', // ✅ Déjà configuré selon le frontend
  },
  AUTH: {
    PROFILE: '/auth/profile', // ✅ Pour récupérer le profil utilisateur
    VENDOR_DEACTIVATE: '/vendor/account/deactivate', // ou '/vendor/account/status' selon votre choix
    VENDOR_REACTIVATE: '/vendor/account/reactivate', // ou '/vendor/account/status' selon votre choix
  }
};
```

## 🚀 Améliorations Futures Suggérées

### 1. Logique de Visibilité (Déjà Implémentée selon VENDOR_ACCOUNT_STATUS_GUIDE.md)
- **Impact de la désactivation :** Tous les produits/designs du vendeur deviennent invisibles
- **Filtrage automatique :** `vendor: { status: true }` dans les requêtes publiques
- **Endpoints affectés :**
  - `/public/vendor-products` - Produits des vendeurs actifs uniquement
  - `/public/vendor-products/search` - Recherche limitée aux vendeurs actifs
  - `/public/vendor-products/:id` - Détails uniquement si vendeur actif

### 2. Statistiques Avancées (Optionnelles)
- **Nombre de connexions :** Total des logins du vendeur
- **Activité récente :** Dernière action effectuée (design, produit, etc.)
- **Temps d'inactivité :** Nombre de jours depuis la dernière connexion
- **Score de performance :** Basé sur les ventes et l'activité

### 3. Notifications et Historique
- **Historique des activations/désactivations :** Log des changements de statut
- **Notifications par email :** Confirmer les changements de statut
- **Raisons de désactivation :** Enregistrer et afficher les raisons

### 4. Métriques de Performance Vendeur
- **Taux de complétion du profil :** Pourcentage des champs remplis
- **Score d'engagement :** Basé sur l'activité récente
- **Temps de réponse moyen :** Pour les messages clients
- **Taux de satisfaction :** Basé sur les avis clients

## 🔒 Sécurité

### Authentification
- **Middleware requis :** `authenticateVendor`
- **Vérification du rôle :** S'assurer que l'utilisateur est bien un vendeur
- **Cookies sécurisés :** Utiliser `credentials: 'include'`

### Données Sensibles
- **Email :** Retourner uniquement pour le propriétaire du compte
- **Téléphone :** Masquer partiellement si nécessaire
- **Dernière connexion :** Accessible uniquement au propriétaire

## 📝 Tests Recommandés

### Tests Backend
```javascript
describe('GET /vendor/profile', () => {
  it('should return vendor profile with dates', async () => {
    const response = await request(app)
      .get('/vendor/profile')
      .set('Cookie', vendorAuthCookie);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('created_at');
    expect(response.body.data).toHaveProperty('last_login_at');
    expect(new Date(response.body.data.created_at)).toBeInstanceOf(Date);
  });
});
```

### Tests Frontend
- **Format des dates :** Vérifier l'affichage en français
- **Gestion des erreurs :** Affichage de "N/A" si pas de données
- **Responsive :** Test sur mobile et desktop

## 📊 Structure Base de Données

### Table `users` - Extensions Nécessaires
```sql
-- Champs pour le tracking des connexions et statuts
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS statusChangedAt TIMESTAMP;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_status_changed ON users(statusChangedAt);
```

### Champs Existants à Vérifier
```sql
-- S'assurer que ces champs existent déjà
-- created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- is_active BOOLEAN DEFAULT true (peut servir comme fallback pour 'status')
```

## 🎯 Résumé des Actions

### Backend Priority 1 (Statistiques de Base)
1. ✅ **Dates de connexion :** S'assurer que `created_at` et `last_login_at` sont correctement remplis
2. ✅ **Endpoint `/vendor/stats` :** Ajouter `memberSince`, `lastLoginAt` et leurs versions formatées
3. ✅ **Statut du compte :** Inclure le champ `status` dans les réponses API
4. ✅ **Format des dates :** Retourner les dates au format ISO 8601 + versions formatées françaises

### Backend Priority 2 (Activation/Désactivation - selon VENDOR_ACCOUNT_STATUS_GUIDE.md)
1. ✅ **Endpoint de statut :** Implémenter `/vendor/account/status` avec PATCH
2. ✅ **Logique de visibilité :** Filtrer par `vendor: { status: true }` dans les requêtes publiques
3. ✅ **Middleware d'authentification :** Vérifier que les vendeurs désactivés ne peuvent pas créer de contenu
4. ✅ **Tracking des changements :** Logger les changements de statut avec `statusChangedAt`

### Frontend
1. ✅ **Code existant :** Le frontend supporte déjà le système complet
2. ✅ **Statistiques dynamiques :** Affichage de "Membre depuis", "Dernière connexion", "Statut"
3. ✅ **Actions d'activation :** Boutons pour désactiver/réactiver le compte
4. ✅ **Gestion d'erreurs :** Fallbacks pour les cas où les données sont indisponibles

### Configuration Frontend
1. ✅ **Endpoints API :** Vérifier que `API_ENDPOINTS.VENDOR.STATS` pointe vers `/vendor/stats`
2. ✅ **Endpoints activation :** Configurer `VENDOR_DEACTIVATE` et `VENDOR_REACTIVATE`
3. ✅ **Gestion des cookies :** Utiliser `credentials: 'include'` pour toutes les requêtes

---

## 🏆 **ÉTAT ACTUEL**

**✅ Frontend :** Complètement implémenté et prêt
**⏳ Backend :** Nécessite l'ajout des champs de dates formatées dans `/vendor/stats`
**✅ Système d'activation :** Logique déjà documentée dans VENDOR_ACCOUNT_STATUS_GUIDE.md

**🎯 Action Immédiate :** Modifier l'endpoint `/vendor/stats` pour inclure `memberSince`, `lastLoginAt` et leurs versions formatées selon les spécifications de ce guide.

