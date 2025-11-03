# Guide d'Intégration PayDunya - PrintAlma Frontend

**Date**: 3 Novembre 2025
**Version**: 1.0
**Statut**: ✅ Intégration complète

---

## 📋 Vue d'ensemble

PrintAlma utilise maintenant **PayDunya** comme passerelle de paiement principale pour accepter les paiements mobile money en Afrique de l'Ouest (Orange Money, Wave, MTN Money, Moov Money, cartes bancaires).

### Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │─────▶│   Backend    │─────▶│   PayDunya   │─────▶│   Client     │
│  (React/     │◀─────│  (NestJS)    │◀─────│     API      │◀─────│  (Mobile     │
│   Vite)      │      │              │      │              │      │   Money)     │
└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
```

---

## ✅ Fichiers Intégrés

### 1. Configuration
- ✅ `/src/config/paydunyaConfig.ts` - Configuration PayDunya
- ✅ `/src/config/api.ts` - Endpoints API (section PAYDUNYA ajoutée)
- ✅ `.env.paydunya.example` - Variables d'environnement exemple

### 2. Services
- ✅ `/src/services/paydunyaService.ts` - Service PayDunya
- ✅ `/src/services/orderService.ts` - Service de commandes (mis à jour pour PAYDUNYA)

### 3. Hooks
- ✅ `/src/hooks/usePaydunya.ts` - Hook React pour PayDunya
- ✅ `/src/hooks/useOrder.ts` - Hook pour les commandes

### 4. Pages
- ✅ `/src/pages/OrderFormPage.tsx` - Formulaire de commande (utilise PayDunya)
- ✅ `/src/pages/PaymentSuccess.tsx` - Page de succès PayDunya
- ✅ `/src/pages/PaymentCancel.tsx` - Page d'annulation PayDunya

### 5. Routes
- ✅ `/src/App.tsx` - Routes configurées :
  - `/order-form` → Formulaire de commande
  - `/payment/success` → Succès PayDunya
  - `/payment/cancel` → Annulation PayDunya

---

## 🚀 Configuration Rapide

### Étape 1: Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
cp .env.paydunya.example .env.local
```

Puis éditez `.env.local` avec vos clés PayDunya :

```bash
# Mode de paiement (test pour développement, live pour production)
VITE_PAYDUNYA_MODE=test

# URL de l'API Backend
VITE_API_URL=http://localhost:3004

# Clés API PayDunya (obtenues depuis dashboard.paydunya.com)
VITE_PAYDUNYA_MASTER_KEY="votre_master_key"
VITE_PAYDUNYA_PRIVATE_KEY="votre_private_key"
VITE_PAYDUNYA_PUBLIC_KEY="votre_public_key"
VITE_PAYDUNYA_TOKEN="votre_token"
```

### Étape 2: Obtenir les clés PayDunya

1. Créez un compte sur [PayDunya Dashboard](https://dashboard.paydunya.com)
2. Accédez à **Paramètres > API Keys**
3. Copiez vos clés de test (sandbox) ou de production (live)
4. Collez-les dans `.env.local`

### Étape 3: Lancer l'application

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5174` (ou le port configuré).

---

## 💳 Flux de Paiement

### 1. Processus Complet

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Client remplit le formulaire de commande                    │
│     → /order-form                                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. Frontend envoie les données au backend                      │
│     POST /orders { paymentMethod: 'PAYDUNYA', ... }             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. Backend crée la commande et initialise le paiement PayDunya │
│     → Retourne { payment: { token, redirect_url } }             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. Frontend redirige le client vers PayDunya                   │
│     window.location.href = redirect_url                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. Client effectue le paiement sur PayDunya                    │
│     (Orange Money, Wave, carte bancaire, etc.)                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. PayDunya envoie un IPN (callback) au backend               │
│     POST /paydunya/callback                                      │
│     → Backend met à jour le statut de la commande               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  7. PayDunya redirige le client vers:                           │
│     • /payment/success (si paiement réussi)                     │
│     • /payment/cancel (si paiement annulé)                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  8. Page de succès/annulation vérifie le statut                │
│     GET /paydunya/status/{token}                                │
│     → Affiche confirmation ou erreur                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Code d'Exemple (déjà intégré dans OrderFormPage)

```typescript
// OrderFormPage.tsx - Ligne 355

const processPayDunyaPayment = async () => {
  // 1. Préparer les données de commande
  const orderRequest = {
    shippingDetails: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      street: formData.address,
      city: formData.city,
      country: formData.country,
    },
    phoneNumber: formData.phone,
    orderItems: [{
      productId: Number(productData.productId),
      quantity: 1,
      unitPrice: productData.price,
      size: productData.size,
      color: productData.color,
    }],
    paymentMethod: 'PAYDUNYA', // 👈 Important
    initiatePayment: true, // 👈 Déclenche le paiement
  };

  // 2. Envoyer au backend
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderRequest)
  });

  const result = await response.json();

  // 3. Stocker les infos pour la page de retour
  localStorage.setItem('paydunyaPendingPayment', JSON.stringify({
    orderId: result.data.id,
    orderNumber: result.data.orderNumber,
    token: result.data.payment.token,
    totalAmount: result.data.totalAmount,
  }));

  // 4. Rediriger vers PayDunya
  window.location.href = result.data.payment.redirect_url;
};
```

---

## 🧪 Tests

### Test 1: Vérifier la configuration

```bash
curl http://localhost:3004/paydunya/test-config
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "PayDunya service is configured and ready",
  "data": {
    "mode": "test",
    "hasMasterKey": true,
    "hasPrivateKey": true,
    "hasToken": true
  }
}
```

### Test 2: Créer une commande de test

1. Accédez à `http://localhost:5174/order-form`
2. Remplissez le formulaire avec des informations de test :
   - Nom: Test User
   - Téléphone: +221775588834 (numéro de test PayDunya)
   - Adresse: Rue Test, Dakar
3. Sélectionnez **PayDunya** comme méthode de paiement
4. Cliquez sur **Payer avec PayDunya**
5. Vous serez redirigé vers la page de paiement PayDunya (sandbox)

### Test 3: Numéro de test PayDunya

Pour tester en mode sandbox, utilisez :
- **Téléphone**: +221 775 588 834 (numéro officiel de test)
- **Orange Money**: Suivez les instructions sur la page PayDunya
- **Wave**: Testez avec votre compte Wave de test

---

## 🔍 Débogage

### Logs Frontend

Les logs sont affichés dans la console du navigateur :

```javascript
// Logs de création de commande
🛒 [OrderForm] Création de commande réelle avec paiement PayDunya
📦 [OrderForm] Données de commande PayDunya: {...}
✅ [OrderForm] Réponse du backend: {...}
🔄 [OrderForm] Redirection vers PayDunya: https://...
```

### Logs PaymentSuccess

```javascript
// Logs de vérification du paiement
🔍 [PaymentSuccess] Vérification du statut (tentative 1/6)...
📡 [PaymentSuccess] Réponse du backend: {...}
✅ [PaymentSuccess] Paiement confirmé avec succès !
```

### Commandes Utiles

```bash
# Voir les logs du backend
tail -f logs/application.log | grep PayDunya

# Vérifier le statut d'un paiement
curl http://localhost:3004/paydunya/status/{TOKEN}

# Lister les commandes
curl http://localhost:3004/orders/my-orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Problèmes Courants

### Erreur: "URL de redirection PayDunya non reçue"

**Cause**: Le backend n'a pas retourné `payment.redirect_url`

**Solution**:
1. Vérifiez que le backend est configuré avec les clés PayDunya
2. Vérifiez les logs du backend
3. Testez la configuration: `curl http://localhost:3004/paydunya/test-config`

### Erreur: "Invalid productId"

**Cause**: Le `productId` n'est pas un nombre valide

**Solution**:
```typescript
// S'assurer que productId est un nombre
const productId = Number(productData.productId);
if (!productId || productId <= 0) {
  throw new Error(`Invalid productId: ${productData.productId}`);
}
```

### Erreur: Paiement en attente indéfiniment

**Cause**: Le callback PayDunya n'a pas été reçu par le backend

**Solution**:
1. Vérifiez que l'URL de callback est accessible publiquement (pas localhost)
2. Utilisez ngrok pour exposer votre backend en local:
   ```bash
   ngrok http 3004
   ```
3. Configurez l'URL de callback dans PayDunya dashboard

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne jamais exposer les clés secrètes côté frontend**
   - Toutes les requêtes PayDunya passent par le backend
   - Le frontend reçoit uniquement l'URL de redirection

2. **Valider les données utilisateur**
   - Téléphone au format international (+221...)
   - Email valide (si fourni)
   - Montant positif

3. **Toujours vérifier le statut côté backend**
   - Ne pas faire confiance uniquement aux paramètres d'URL
   - Utiliser l'IPN (callback) pour confirmer le paiement

4. **Protéger les routes sensibles**
   - Authentification JWT pour les commandes utilisateur
   - Validation des permissions admin

---

## 📚 Ressources

### Documentation
- [Guide Frontend PayDunya](./PAYDUNYA_FRONTEND_INTEGRATION.md)
- [Documentation API PayDunya](https://developers.paydunya.com/doc/FR/introduction)
- [Dashboard PayDunya](https://dashboard.paydunya.com)

### Support
- **Email**: support@paydunya.com
- **Documentation**: https://developers.paydunya.com
- **Status**: https://status.paydunya.com

---

## ✅ Checklist de Production

Avant de passer en production, vérifiez :

- [ ] Variables d'environnement configurées en mode `live`
- [ ] Clés API de production (pas de test) dans `.env`
- [ ] Backend accessible publiquement (pas localhost)
- [ ] URL de callback configurée dans PayDunya dashboard
- [ ] Certificat SSL (HTTPS) activé
- [ ] Tests de paiement réels effectués
- [ ] Gestion des erreurs complète
- [ ] Logs de monitoring activés
- [ ] Support client préparé

---

**Version**: 1.0
**Dernière mise à jour**: 3 Novembre 2025
**Auteur**: Claude Code - PrintAlma Team
