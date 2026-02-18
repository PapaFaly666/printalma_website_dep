# Guide Frontend - Configuration Dynamique PayDunya

## Vue d'ensemble

Ce guide explique comment utiliser l'interface de gestion dynamique des clés API PayDunya dans le frontend de PrintAlma.

**Note importante:** Wave et Orange Money ont été retirés de la liste des moyens de paiement car ils sont déjà gérés par PayDunya.

## Fichiers créés

### 1. Service de Configuration des Paiements

**Fichier:** `src/services/paymentConfigService.ts`

Ce service gère toutes les interactions avec l'API backend pour la configuration PayDunya :

```typescript
// Récupérer la config publique (sans clés sensibles)
PaymentConfigService.getPaydunyaConfig()

// Récupérer la config admin complète (avec clés) - Auth par cookies
PaymentConfigService.getPaydunyaAdminConfig()

// Basculer entre test et live - Auth par cookies
PaymentConfigService.switchMode(mode)

// Mettre à jour les clés API - Auth par cookies
PaymentConfigService.updatePaydunyaKeys(data)

// Activer/désactiver PayDunya - Auth par cookies
PaymentConfigService.togglePaydunyaStatus(isActive)
```

### 2. Hook React Personnalisé

**Fichier:** `src/hooks/usePaydunyaConfig.ts`

Hook pour gérer l'état de la configuration PayDunya :

```typescript
const { config, loading, error, refetch } = usePaydunyaConfig(isAdmin);
```

**Paramètres:**
- `isAdmin` (boolean): Si `true`, récupère la config admin complète (avec auth par cookies), sinon la config publique

**Exemple:**
```typescript
// Dans une page admin
const { config, loading, error, refetch } = usePaydunyaConfig(true);

// Dans une page publique
const { config, loading, error, refetch } = usePaydunyaConfig(false);
```

**Retour:**
- `config`: Configuration PayDunya actuelle
- `loading`: État de chargement
- `error`: Erreur éventuelle
- `refetch`: Fonction pour recharger la configuration

## Interface Admin - PaymentMethodsPage

### Fonctionnalités ajoutées

#### 1. Section Configuration PayDunya

La page `/admin/payment-methods` affiche maintenant une section dédiée à PayDunya avec :

**Affichage du mode actuel :**
- Badge visuel (🧪 TEST ou 🚀 LIVE)
- Description claire du mode
- Avertissement pour le mode LIVE

**Gestion des clés API :**
- Carte pour le mode TEST avec aperçu de la public key
- Carte pour le mode LIVE avec aperçu de la public key
- Boutons pour éditer les clés de chaque mode

**Basculement de mode :**
- Bouton "Activer TEST" / "Activer LIVE"
- Confirmation obligatoire pour passer en LIVE
- Indicateur de chargement pendant le basculement

#### 2. Modal d'édition des clés

Un modal permet d'éditer les clés pour chaque mode :

**Champs disponibles :**
- Master Key (masqué)
- Private Key (masqué)
- Public Key (visible)
- Token (masqué)

**Validation :**
- Tous les champs sont requis
- Avertissement spécial pour le mode LIVE

**Design :**
- Couleur bleue pour le mode TEST
- Couleur ambrée pour le mode LIVE
- Instructions pour obtenir les clés

## Flux d'utilisation

### Cas 1 : Configuration initiale

1. Admin se connecte et accède à `/admin/payment-methods`
2. La section PayDunya affiche le mode actuel (par défaut TEST)
3. Admin clique sur l'icône 🔑 (Key) pour le mode TEST
4. Le modal s'ouvre avec les champs vides
5. Admin entre les clés TEST fournies par PayDunya
6. Admin clique sur "Sauvegarder les clés"
7. Les clés sont envoyées au backend et sauvegardées

### Cas 2 : Basculement vers LIVE

1. Admin configure d'abord les clés LIVE via le modal
2. Admin clique sur "Activer LIVE" dans la carte LIVE
3. Une alerte de confirmation s'affiche :
   ```
   ⚠️ ATTENTION: Basculer en mode PRODUCTION ?

   Toutes les transactions seront RÉELLES et FACTURÉES !

   Êtes-vous sûr de vouloir continuer ?
   ```
4. Si admin confirme, le mode est basculé vers LIVE
5. La configuration est rechargée automatiquement
6. L'interface affiche maintenant le mode LIVE avec l'avertissement

### Cas 3 : Retour en TEST

1. Admin clique sur "Activer TEST" dans la carte TEST
2. Aucune confirmation n'est demandée (retour sécurisé)
3. Le mode est basculé immédiatement
4. L'interface repasse en mode TEST

## Sécurité

### Masquage des clés sensibles

Les clés sensibles sont affichées de manière sécurisée :

```typescript
// Affichage partiel de la public key uniquement
Public Key: {config.testPublicKey?.substring(0, 25)}...
```

Les champs Master Key, Private Key et Token sont de type `password` pour masquer leur contenu.

### Confirmation obligatoire

Le passage en mode LIVE nécessite une double confirmation :

```typescript
if (mode === 'live') {
  const confirmed = window.confirm(
    '⚠️ ATTENTION: Basculer en mode PRODUCTION ?\n\n' +
    'Toutes les transactions seront RÉELLES et FACTURÉES !'
  );
  if (!confirmed) return;
}
```

### Authentification par Cookies

**IMPORTANT:** L'authentification utilise les **cookies HTTP-only**, pas de tokens JWT dans localStorage.

Toutes les requêtes admin incluent :
```typescript
credentials: 'include' // Envoie automatiquement les cookies
```

Le backend vérifie automatiquement le cookie de session pour authentifier l'utilisateur.

**Aucun token n'est stocké dans localStorage** - c'est géré par les cookies sécurisés côté serveur.

## API Endpoints utilisés

### Public
```
GET /payment-config/paydunya
```
Récupère la configuration publique (mode actuel, public key, isActive)

### Admin
```
GET /admin/payment-config/paydunya
```
Récupère la configuration complète avec toutes les clés

```
POST /admin/payment-config/switch
Body: { provider: 'paydunya', mode: 'test' | 'live' }
```
Bascule entre les modes test et live

```
PATCH /admin/payment-config/paydunya
Body: {
  mode: 'test' | 'live',
  publicKey: string,
  privateKey: string,
  token: string,
  masterKey?: string | null
}
```
Met à jour les clés pour un mode spécifique (masterKey est optionnel)

## Exemple de configuration

### Mode TEST

```json
{
  "id": 1,
  "provider": "paydunya",
  "isActive": true,
  "activeMode": "test",
  "testPublicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "testPrivateKey": "test_private_xxx",
  "testToken": "BuVSxxx9B",
  "testMasterKey": null,
  "livePublicKey": null,
  "livePrivateKey": null,
  "liveToken": null,
  "liveMasterKey": null,
  "webhookSecret": null,
  "metadata": {},
  "createdAt": "2026-02-12T10:34:12.000Z",
  "updatedAt": "2026-02-12T14:57:13.000Z"
}
```

### Mode LIVE

```json
{
  "id": 1,
  "provider": "paydunya",
  "isActive": true,
  "activeMode": "live",
  "testPublicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "testPrivateKey": "test_private_xxx",
  "testToken": "BuVSxxx9B",
  "testMasterKey": null,
  "livePublicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "livePrivateKey": "live_private_xxx",
  "liveToken": "lt8Yxxx8f",
  "liveMasterKey": null,
  "webhookSecret": null,
  "metadata": {},
  "createdAt": "2026-02-12T10:34:12.000Z",
  "updatedAt": "2026-02-12T14:57:13.000Z"
}
```

## Gestion des erreurs

Le système gère plusieurs types d'erreurs :

### Erreur de chargement
```typescript
if (error) {
  return (
    <div className="text-center py-8 text-gray-600">
      <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-amber-500" />
      <p>Configuration PayDunya non disponible</p>
    </div>
  );
}
```

### Erreur de basculement
```typescript
try {
  await PaymentConfigService.switchMode(mode, authToken);
  alert(`✅ Basculement réussi vers le mode ${mode.toUpperCase()}`);
} catch (error: any) {
  alert(`❌ Erreur: ${error.message}`);
}
```

### Validation des champs
```typescript
if (!paydunyaFormData.masterKey || !paydunyaFormData.privateKey ||
    !paydunyaFormData.publicKey || !paydunyaFormData.token) {
  alert('⚠️ Tous les champs sont requis');
  return;
}
```

## Indicateurs visuels

### Mode TEST
- 🧪 Icône de laboratoire
- Couleur bleue (#3B82F6)
- Badge "Mode TEST"
- Message : "Transactions de test uniquement - Aucun paiement réel"

### Mode LIVE
- 🚀 Icône de fusée
- Couleur ambrée (#F59E0B)
- Badge "Mode PRODUCTION"
- Message : "⚠️ ATTENTION: Tous les paiements sont réels et facturés"

### État actif/inactif
- ✅ Badge vert avec "Actif" si isActive = true
- ❌ Badge gris avec "Inactif" si isActive = false

## Animations et transitions

### Modal d'édition
```css
animation: scaleIn 0.3s ease-out
```

### Boutons
- Transition smooth sur hover
- Indicateur de chargement (spinner) pendant les opérations

### Cartes
- Hover effect avec shadow
- Transition de couleur

## Responsive Design

L'interface est entièrement responsive :

- **Desktop** : Affichage en grille 2 colonnes pour les cartes TEST/LIVE
- **Tablet** : Passage en 1 colonne
- **Mobile** :
  - Boutons en pleine largeur
  - Modal avec scroll vertical si nécessaire
  - Textes adaptés pour petits écrans

## Moyens de Paiement Disponibles

La page affiche maintenant uniquement :

1. **PayDunya** (avec gestion TEST/LIVE)
   - Wave (inclus dans PayDunya)
   - Orange Money (inclus dans PayDunya)
   - MTN Mobile Money (inclus dans PayDunya)
   - Moov Money (inclus dans PayDunya)
   - Cartes bancaires (inclus dans PayDunya)

2. **Paiement à la livraison** (système)
   - Méthode non supprimable
   - Gestion locale sans API externe

**Note:** Wave et Orange Money ont été retirés de la liste des moyens de paiement individuels car PayDunya les gère déjà de manière intégrée.

## Prochaines améliorations possibles

1. **Historique des changements** : Logger chaque basculement de mode
2. **Test de connexion** : Bouton pour tester les clés avant de les sauvegarder
3. **Notifications** : Toast notifications au lieu d'alertes natives
4. **Backup automatique** : Sauvegarder les anciennes clés avant mise à jour
5. **Validation côté client** : Vérifier le format des clés
6. **Affichage des dates** : Montrer createdAt et updatedAt dans l'interface

## Support

Pour toute question ou problème :

1. Vérifier que le backend expose bien les endpoints `/admin/payment-config/*`
2. Vérifier que le token JWT est valide et que l'utilisateur est admin
3. Consulter la console du navigateur pour les logs détaillés
4. Vérifier les variables d'environnement du backend pour PayDunya

---

**Date de création** : 12 février 2026
**Version** : 1.0.0
**Auteur** : Claude Sonnet 4.5
