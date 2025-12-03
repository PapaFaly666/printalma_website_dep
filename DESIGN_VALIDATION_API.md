# API de Validation de Design - Guide d'Utilisation

## Endpoint

```
PUT /api/designs/:id/validate
```

## Authentification

L'endpoint nécessite une authentification admin. L'application utilise un **système d'authentification hybride** :

1. **Cookies HTTP (Priorité)** : Authentification sécurisée via cookies httpOnly
2. **Fallback JWT** : Si les cookies échouent, utilise le header Authorization avec un Bearer token

Le service `hybridAuthService` gère automatiquement cette logique.

## Format de la Requête

### Headers
```
Content-Type: application/json
Accept: application/json
```

### Body
```json
{
  "action": "VALIDATE" | "REJECT",
  "rejectionReason": "string (optionnel si action=VALIDATE, requis si action=REJECT)"
}
```

## Exemples

### 1. Valider un Design

**Développement (localhost):**
```bash
curl -X 'PUT' \
  'http://localhost:3004/api/designs/7/validate' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "action": "VALIDATE"
}'
```

**Production:**
```bash
curl -X 'PUT' \
  'https://printalma-back-dep.onrender.com/api/designs/7/validate' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "action": "VALIDATE"
}'
```

### 2. Rejeter un Design

```bash
curl -X 'PUT' \
  'http://localhost:3004/api/designs/7/validate' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "action": "REJECT",
  "rejectionReason": "La qualité de l'\''image n'\''est pas suffisante"
}'
```

## Réponse Succès (200 OK)

```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": {
    "id": 7,
    "name": "corrompu_with_bgc",
    "description": "efzfze",
    "price": 12000,
    "categoryId": 8,
    "imageUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "fileSize": 1037055,
    "dimensions": {
      "width": 1080,
      "height": 1080
    },
    "isPublished": true,
    "isPending": false,
    "isDraft": true,
    "isValidated": true,
    "validationStatus": "VALIDATED",
    "validatedAt": "2025-12-01T00:20:53.797Z",
    "validatorName": "Papa Faly Diagne",
    "tags": [],
    "usageCount": 0,
    "earnings": 0,
    "views": 0,
    "likes": 0,
    "createdAt": "2025-11-30T23:57:44.427Z",
    "updatedAt": "2025-12-01T00:20:53.797Z",
    "publishedAt": "2025-12-01T00:20:53.797Z",
    "vendor": {
      "id": 7,
      "firstName": "Dip",
      "lastName": "Doundou guiss",
      "email": "dip@gmail.com",
      "shop_name": null,
      "phone": null,
      "profile_photo_url": null,
      "country": null,
      "address": null
    },
    "autoValidation": {
      "updatedProducts": [],
      "count": 0
    }
  }
}
```

## Utilisation dans le Code

### Configuration des Endpoints

Les endpoints de design sont configurés dans `/src/config/api.ts` :

```typescript
export const API_ENDPOINTS = {
  // ...
  DESIGNS: {
    // Valider ou rejeter un design (admin)
    VALIDATE: (designId: number) => `/api/designs/${designId}/validate`,
    // Récupérer tous les designs avec filtres
    GET_ALL: '/api/designs',
    // Récupérer un design spécifique
    GET: (designId: number) => `/api/designs/${designId}`,
    // Créer un design (vendeur)
    CREATE: '/api/designs',
    // Mettre à jour un design (vendeur)
    UPDATE: (designId: number) => `/api/designs/${designId}`,
    // Supprimer un design (vendeur/admin)
    DELETE: (designId: number) => `/api/designs/${designId}`
  }
};
```

### Exemple d'Utilisation (React/TypeScript)

```typescript
import { API_CONFIG, API_ENDPOINTS } from '../../config/api';
import { hybridAuthService } from '../../services/hybridAuthService';

// Valider un design
const handleValidateDesign = async (designId: number, approved: boolean, reason?: string) => {
  try {
    const validationUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.DESIGNS.VALIDATE(designId)}`;

    const response = await hybridAuthService.makeAuthenticatedRequest(
      validationUrl,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: approved ? 'VALIDATE' : 'REJECT',
          rejectionReason: approved ? undefined : reason
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('Design validé:', result);
    return result;
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    throw error;
  }
};
```

## Variables d'Environnement

L'URL de base de l'API est configurée via la variable d'environnement `VITE_API_URL` :

**Développement (`.env.development`):**
```env
VITE_API_URL=http://localhost:3004
```

**Production (`.env.production`):**
```env
VITE_API_URL=https://printalma-back-dep.onrender.com
```

**Valeur par défaut** (si non définie) : `http://localhost:3004`

## Système d'Authentification Hybride

Le `hybridAuthService` effectue automatiquement :

1. **Première tentative** : Requête avec cookies uniquement
2. **Si 401** : Tentative avec header `Authorization: Bearer {token}`
3. **Logs détaillés** : Chaque étape est loggée pour faciliter le débogage

```typescript
// Le service gère automatiquement l'authentification
const response = await hybridAuthService.makeAuthenticatedRequest(url, options);
```

## Erreurs Courantes

### 401 Unauthorized
- **Cause** : Session expirée ou droits insuffisants
- **Solution** : Vérifier l'authentification admin, se reconnecter

### 400 Bad Request
- **Cause** : Paramètres invalides (ex: rejectionReason manquante lors d'un REJECT)
- **Solution** : Vérifier le format de la requête

### 404 Not Found
- **Cause** : Design inexistant
- **Solution** : Vérifier l'ID du design

## Workflow de Validation

1. **Liste des designs** : Récupérer via `GET /api/designs`
2. **Examiner un design** : Afficher les détails
3. **Valider ou rejeter** : Appeler `PUT /api/designs/:id/validate`
4. **Cascade** : Le backend met à jour automatiquement les produits associés

## Notes Importantes

- ✅ Le système utilise principalement les **cookies HTTP** pour l'authentification (plus sécurisé)
- ✅ Le token JWT est un **fallback** pour gérer les cas où les cookies échouent
- ✅ L'URL backend s'adapte automatiquement selon l'environnement (dev/prod)
- ✅ Tous les logs sont en français pour faciliter le débogage
