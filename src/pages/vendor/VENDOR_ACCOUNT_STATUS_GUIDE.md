# 🚨 Guide Frontend - Gestion des Statuts Vendeurs

## ❌ **PROBLÈME RÉSOLU**

Le frontend recevait des erreurs `403` ou `401` sans distinguer :
- **Session expirée** (besoin de se reconnecter)
- **Compte désactivé** (besoin de réactiver le compte)
- **Rôle insuffisant** (contacter l'admin)

---

## ✅ **SOLUTION IMPLÉMENTÉE**

### **1. Nouveau endpoint de diagnostic**
```http
GET /vendor/account/status-check
```
**Usage :** Diagnostiquer pourquoi l'accès est refusé

### **2. Codes d'erreur spécifiques**
- `SESSION_EXPIRED` → Rediriger vers login
- `ACCOUNT_DEACTIVATED` → Afficher formulaire de réactivation
- `INSUFFICIENT_ROLE` → Contacter admin

### **3. Actions recommandées**
- `REDIRECT_TO_LOGIN`
- `SHOW_REACTIVATION_FORM`
- `CONTACT_ADMIN`
- `CONTINUE`

---

## 🔧 **INTÉGRATION FRONTEND**

### **Service JavaScript de gestion des erreurs**

```javascript
class VendorErrorHandler {
    constructor(apiUrl = 'http://localhost:3004') {
        this.apiUrl = apiUrl;
    }

    /**
     * 🔍 Diagnostiquer le problème d'accès
     */
    async diagnoseAccessError() {
        try {
            const response = await fetch(`${this.apiUrl}/vendor/account/status-check`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                // Token JWT invalide ou expiré
                return {
                    error: 'SESSION_EXPIRED',
                    message: 'Votre session a expiré. Veuillez vous reconnecter.',
                    action: 'REDIRECT_TO_LOGIN',
                    httpStatus: 401
                };
            }

            if (response.ok) {
                const data = await response.json();
                return data.data; // Contient accessLevel, message, action
            }

            // Autre erreur
            throw new Error(`HTTP ${response.status}`);

        } catch (error) {
            console.error('❌ Erreur diagnostic:', error);

            // Si même le diagnostic échoue, c'est probablement un problème de réseau/session
            return {
                error: 'SESSION_EXPIRED',
                message: 'Impossible de vérifier votre statut. Veuillez vous reconnecter.',
                action: 'REDIRECT_TO_LOGIN',
                httpStatus: 401
            };
        }
    }

    /**
     * 🎯 Gérer les erreurs d'accès automatiquement
     */
    async handleAccessError(originalError) {
        console.log('🚨 Erreur d\'accès détectée:', originalError);

        // Diagnostiquer le problème
        const diagnosis = await this.diagnoseAccessError();
        console.log('🔍 Diagnostic:', diagnosis);

        // Retourner l'action recommandée
        return this.getRecommendedAction(diagnosis);
    }

    /**
     * 📋 Déterminer l'action à prendre
     */
    getRecommendedAction(diagnosis) {
        switch (diagnosis.accessLevel || diagnosis.error) {
            case 'SESSION_EXPIRED':
                return {
                    type: 'REDIRECT_TO_LOGIN',
                    title: 'Session expirée',
                    message: diagnosis.message,
                    primaryAction: 'Se reconnecter',
                    primaryUrl: '/login',
                    showReactivationForm: false
                };

            case 'ACCOUNT_DEACTIVATED':
                return {
                    type: 'SHOW_REACTIVATION_FORM',
                    title: 'Compte désactivé',
                    message: diagnosis.message,
                    primaryAction: 'Réactiver mon compte',
                    secondaryAction: 'Se déconnecter',
                    secondaryUrl: '/logout',
                    showReactivationForm: true,
                    userId: diagnosis.userId,
                    userEmail: diagnosis.userEmail
                };

            case 'INSUFFICIENT_ROLE':
                return {
                    type: 'CONTACT_ADMIN',
                    title: 'Accès non autorisé',
                    message: diagnosis.message,
                    primaryAction: 'Contacter le support',
                    primaryUrl: '/contact',
                    showReactivationForm: false
                };

            case 'CAN_ACCESS':
                return {
                    type: 'CONTINUE',
                    title: 'Accès autorisé',
                    message: 'Votre compte fonctionne normalement.',
                    showReactivationForm: false
                };

            default:
                return {
                    type: 'UNKNOWN_ERROR',
                    title: 'Erreur inconnue',
                    message: 'Une erreur inattendue s\'est produite.',
                    primaryAction: 'Rafraîchir la page',
                    showReactivationForm: false
                };
        }
    }

    /**
     * 🔄 Intercepteur pour les appels API
     */
    async interceptApiCall(apiCallFunction) {
        try {
            return await apiCallFunction();
        } catch (error) {
            // Si c'est une erreur 401/403, diagnostiquer
            if (error.status === 401 || error.status === 403) {
                const action = await this.handleAccessError(error);

                // Retourner l'erreur avec l'action recommandée
                throw {
                    ...error,
                    vendorAction: action
                };
            }

            // Autres erreurs passent tel quel
            throw error;
        }
    }
}

// Instance globale
const vendorErrorHandler = new VendorErrorHandler();
```

### **Service de réactivation de compte**

```javascript
class VendorReactivationService {
    constructor(apiUrl = 'http://localhost:3004') {
        this.apiUrl = apiUrl;
    }

    /**
     * 🟢 Réactiver le compte vendeur
     */
    async reactivateAccount(reason = 'Réactivation depuis l\'interface') {
        try {
            const response = await fetch(`${this.apiUrl}/vendor/account/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: true,
                    reason: reason
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Erreur ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const result = await response.json();
            console.log('✅ Compte réactivé:', result);
            return result;

        } catch (error) {
            console.error('❌ Erreur réactivation:', error);
            throw error;
        }
    }

    /**
     * 🔴 Désactiver le compte vendeur
     */
    async deactivateAccount(reason = 'Désactivation depuis l\'interface') {
        try {
            const response = await fetch(`${this.apiUrl}/vendor/account/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: false,
                    reason: reason
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Erreur ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const result = await response.json();
            console.log('✅ Compte désactivé:', result);
            return result;

        } catch (error) {
            console.error('❌ Erreur désactivation:', error);
            throw error;
        }
    }
}

// Instance globale
const vendorReactivation = new VendorReactivationService();
```

---

## 🎨 **COMPOSANTS UI RECOMMANDÉS**

### **1. Composant de diagnostic d'erreur**

```javascript
// React/Vue component
const VendorAccessError = ({ error, onAction }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [diagnosis, setDiagnosis] = useState(null);

    useEffect(() => {
        // Diagnostiquer automatiquement au montage
        diagnoseProblem();
    }, []);

    const diagnoseProblem = async () => {
        setIsLoading(true);
        try {
            const result = await vendorErrorHandler.handleAccessError(error);
            setDiagnosis(result);
        } catch (err) {
            console.error('Erreur diagnostic:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReactivation = async () => {
        setIsLoading(true);
        try {
            await vendorReactivation.reactivateAccount('Réactivation depuis l\'erreur d\'accès');
            alert('✅ Compte réactivé avec succès !');
            window.location.reload(); // Recharger la page
        } catch (error) {
            alert('❌ Erreur lors de la réactivation: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="loading">🔍 Diagnostic en cours...</div>;
    }

    if (!diagnosis) {
        return <div className="error">❌ Impossible de diagnostiquer le problème</div>;
    }

    return (
        <div className={`vendor-access-error ${diagnosis.type.toLowerCase()}`}>
            <div className="error-icon">
                {diagnosis.type === 'SESSION_EXPIRED' ? '🔐' :
                 diagnosis.type === 'ACCOUNT_DEACTIVATED' ? '⏸️' :
                 diagnosis.type === 'INSUFFICIENT_ROLE' ? '🚫' : '❓'}
            </div>

            <h3>{diagnosis.title}</h3>
            <p>{diagnosis.message}</p>

            <div className="actions">
                {diagnosis.type === 'REDIRECT_TO_LOGIN' && (
                    <button
                        onClick={() => window.location.href = diagnosis.primaryUrl}
                        className="btn-primary"
                    >
                        {diagnosis.primaryAction}
                    </button>
                )}

                {diagnosis.type === 'SHOW_REACTIVATION_FORM' && (
                    <>
                        <button
                            onClick={handleReactivation}
                            className="btn-success"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Réactivation...' : diagnosis.primaryAction}
                        </button>
                        <button
                            onClick={() => window.location.href = diagnosis.secondaryUrl}
                            className="btn-secondary"
                        >
                            {diagnosis.secondaryAction}
                        </button>
                    </>
                )}

                {diagnosis.type === 'CONTACT_ADMIN' && (
                    <button
                        onClick={() => window.location.href = diagnosis.primaryUrl}
                        className="btn-warning"
                    >
                        {diagnosis.primaryAction}
                    </button>
                )}
            </div>

            {diagnosis.userEmail && (
                <div className="user-info">
                    <small>Compte: {diagnosis.userEmail}</small>
                </div>
            )}
        </div>
    );
};
```

### **2. Intercepteur global pour les appels API**

```javascript
// Wrapper pour fetch avec gestion automatique des erreurs vendeur
const vendorFetch = async (url, options = {}) => {
    try {
        // Appel API normal
        const response = await fetch(url, {
            credentials: 'include',
            ...options
        });

        // Si succès, retourner tel quel
        if (response.ok) {
            return response;
        }

        // Si erreur 401/403, diagnostiquer
        if (response.status === 401 || response.status === 403) {
            const errorData = await response.json().catch(() => ({}));

            // Diagnostiquer le problème
            const diagnosis = await vendorErrorHandler.handleAccessError({
                status: response.status,
                data: errorData
            });

            // Créer une erreur enrichie
            const enrichedError = new Error(`HTTP ${response.status}`);
            enrichedError.status = response.status;
            enrichedError.data = errorData;
            enrichedError.vendorDiagnosis = diagnosis;

            throw enrichedError;
        }

        // Autres erreurs
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
        // Si l'erreur a déjà un diagnostic, la rethrow
        if (error.vendorDiagnosis) {
            throw error;
        }

        // Sinon, c'est probablement un problème réseau/session
        const diagnosis = await vendorErrorHandler.handleAccessError(error);
        error.vendorDiagnosis = diagnosis;
        throw error;
    }
};

// Usage dans les services
const createDesign = async (designData) => {
    try {
        const response = await vendorFetch('/vendor/designs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(designData)
        });

        return response.json();
    } catch (error) {
        // L'erreur contient maintenant error.vendorDiagnosis
        if (error.vendorDiagnosis) {
            // Afficher le composant d'erreur approprié
            showVendorErrorComponent(error.vendorDiagnosis);
        }
        throw error;
    }
};
```

---

## 📱 **EXEMPLES D'UTILISATION**

### **Scénario 1 : Vendeur accède à /designs avec compte désactivé**

```javascript
// 1. Le frontend fait un appel à /vendor/designs
try {
    const designs = await vendorFetch('/vendor/designs');
} catch (error) {
    // 2. Erreur 403 détectée, diagnostic automatique
    console.log(error.vendorDiagnosis);
    /*
    {
        type: 'SHOW_REACTIVATION_FORM',
        title: 'Compte désactivé',
        message: 'Votre compte vendeur est désactivé. Vous pouvez le réactiver depuis vos paramètres.',
        primaryAction: 'Réactiver mon compte',
        showReactivationForm: true,
        userId: 123,
        userEmail: 'vendor@example.com'
    }
    */

    // 3. Afficher le formulaire de réactivation
    showReactivationForm(error.vendorDiagnosis);
}
```

### **Scénario 2 : Session expirée**

```javascript
try {
    const products = await vendorFetch('/vendor/products');
} catch (error) {
    console.log(error.vendorDiagnosis);
    /*
    {
        type: 'REDIRECT_TO_LOGIN',
        title: 'Session expirée',
        message: 'Votre session a expiré. Veuillez vous reconnecter.',
        primaryAction: 'Se reconnecter',
        primaryUrl: '/login'
    }
    */

    // Redirection automatique vers login
    window.location.href = '/login';
}
```

---

## 🧪 **TESTS DES DIFFÉRENTS SCÉNARIOS**

### **Test 1 : Compte actif (normal)**
```bash
curl -X GET 'http://localhost:3004/vendor/account/status-check' \
  -H 'Authorization: Bearer VALID_VENDOR_TOKEN'

# Réponse attendue:
# {
#   "success": true,
#   "data": {
#     "accessLevel": "CAN_ACCESS",
#     "message": "Votre compte est actif et fonctionnel.",
#     "action": "CONTINUE"
#   }
# }
```

### **Test 2 : Compte désactivé**
```bash
# 1. Désactiver le compte
curl -X PATCH 'http://localhost:3004/vendor/account/status' \
  -H 'Authorization: Bearer VENDOR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"status": false}'

# 2. Vérifier le diagnostic
curl -X GET 'http://localhost:3004/vendor/account/status-check' \
  -H 'Authorization: Bearer VENDOR_TOKEN'

# Réponse attendue:
# {
#   "success": true,
#   "data": {
#     "accessLevel": "ACCOUNT_DEACTIVATED",
#     "message": "Votre compte vendeur est désactivé. Vous pouvez le réactiver depuis vos paramètres.",
#     "action": "SHOW_REACTIVATION_FORM"
#   }
# }
```

### **Test 3 : Session expirée**
```bash
curl -X GET 'http://localhost:3004/vendor/account/status-check' \
  -H 'Authorization: Bearer INVALID_OR_EXPIRED_TOKEN'

# Réponse attendue: 401 Unauthorized
```

### **Test 4 : Essayer d'accéder aux designs avec compte désactivé**
```bash
curl -X GET 'http://localhost:3004/vendor/designs' \
  -H 'Authorization: Bearer DEACTIVATED_VENDOR_TOKEN'

# Réponse attendue: 403 avec détails sur la désactivation
```

---

## 📋 **CHECKLIST D'INTÉGRATION**

- [ ] ✅ Implémenter `VendorErrorHandler`
- [ ] ✅ Implémenter `VendorReactivationService`
- [ ] ✅ Créer le composant `VendorAccessError`
- [ ] ✅ Remplacer `fetch` par `vendorFetch` dans les services vendeur
- [ ] ✅ Tester les 4 scénarios principaux
- [ ] ✅ Ajouter la gestion des erreurs dans les pages /designs et /products
- [ ] ✅ Configurer les redirections appropriées
- [ ] ✅ Tester l'UX complète

---

## 🎯 **RÉSUMÉ**

**AVANT :** Erreur générique 403 → Utilisateur confus
**APRÈS :** Diagnostic précis → Action claire → Résolution rapide

**Nouveaux endpoints :**
- `GET /vendor/account/status-check` - Diagnostic des problèmes d'accès
- `PATCH /vendor/account/status` - Réactivation du compte

**Messages clairs :**
- ❌ "Session expirée" → **Se reconnecter**
- ⏸️ "Compte désactivé" → **Réactiver le compte**
- 🚫 "Rôle insuffisant" → **Contacter l'admin**

Le frontend peut maintenant gérer intelligemment tous les cas d'erreur ! 🚀