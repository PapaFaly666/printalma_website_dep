# 🧪 Guide de Test PayDunya - OrderFormPage

**Date**: 5 novembre 2025
**Pour**: Tests de l'intégration PayDunya

---

## 🎯 Objectif

Ce guide vous permet de tester rapidement l'intégration PayDunya dans OrderFormPage.

---

## 🚀 Démarrage Rapide

### 1. Vérifier les Serveurs

```bash
# Backend (Terminal 1)
cd backend
npm run start:dev
# Doit tourner sur http://localhost:3004

# Frontend (Terminal 2)
cd printalma_website_dep
npm run dev
# Doit tourner sur http://localhost:5175
```

### 2. Accéder au Formulaire

```
http://localhost:5175/order-form
```

> **Note**: Assurez-vous d'avoir un produit dans le panier avant d'accéder à cette page.

---

## ✅ Tests à Effectuer

### Test 1: Validation du Formulaire

#### Scénario: Email manquant

1. Laisser l'email vide
2. Remplir les autres champs
3. Cliquer sur "Payer avec PayDunya"

**Résultat attendu**:
- ❌ Erreur affichée: "L'email est requis pour le paiement PayDunya"
- Champ email surligné en rouge
- Formulaire non soumis

---

#### Scénario: Email invalide

1. Entrer un email invalide: `test@`
2. Remplir les autres champs
3. Cliquer sur "Payer avec PayDunya"

**Résultat attendu**:
- ❌ Erreur affichée: "L'email est invalide"
- Champ email surligné en rouge
- Formulaire non soumis

---

#### Scénario: Téléphone invalide

1. Entrer un téléphone invalide: `12345`
2. Remplir les autres champs
3. Cliquer sur "Payer avec PayDunya"

**Résultat attendu**:
- ❌ Erreur affichée: "Format invalide. Ex: 77 123 45 67"
- Champ téléphone surligné en rouge
- Formulaire non soumis

---

#### Scénario: Formulaire valide

1. Remplir tous les champs correctement:
   ```
   Prénom: Test
   Nom: Utilisateur
   Email: test@example.com
   Téléphone: 77 123 45 67
   Adresse: 123 Rue Test, Dakar
   Ville: Dakar
   Code postal: 12000
   Pays: Sénégal
   ```

2. Sélectionner la livraison (Standard)
3. Sélectionner PayDunya comme méthode de paiement
4. Cliquer sur "Payer avec PayDunya"

**Résultat attendu**:
- ✅ Aucune erreur
- Passage au Test 2

---

### Test 2: Création de Commande

#### Étapes

1. Ouvrir la Console du navigateur (F12 → Console)
2. Remplir le formulaire (Test 1 - Formulaire valide)
3. Cliquer sur "Payer avec PayDunya"
4. Observer les logs

**Logs attendus dans la console**:

```javascript
🛒 [OrderForm] === DÉBUT DU PROCESSUS PAYDUNYA ===
📧 Email: test@example.com
📱 Téléphone: 77 123 45 67
💰 Montant total: XXXX FCFA
✅ ProductId valide: 1
📦 [OrderForm] Données de commande PayDunya: {
  "email": "test@example.com",
  "phoneNumber": "77 123 45 67",
  "shippingDetails": { ... },
  "orderItems": [ ... ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true
}
🔄 [OrderForm] Envoi de la requête au backend...
```

**Si le backend répond correctement**:

```javascript
✅ [OrderForm] Réponse du backend (normalisée): {
  "success": true,
  "data": {
    "id": 87,
    "orderNumber": "ORD-1762366423948",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "payment": {
      "token": "test_GzRMdpCUqF",
      "redirect_url": "https://app.paydunya.com/sandbox-checkout/...",
      "mode": "test"
    }
  }
}
💾 [OrderForm] Données sauvegardées dans localStorage: { ... }
🔄 [OrderForm] === REDIRECTION VERS PAYDUNYA ===
🌐 URL: https://app.paydunya.com/sandbox-checkout/invoice/test_GzRMdpCUqF
🎫 Token: test_GzRMdpCUqF
📋 Order ID: 87
📋 Order Number: ORD-1762366423948
```

**Vérifications**:
- ✅ Tous les logs s'affichent
- ✅ `initiatePayment: true` est présent
- ✅ Réponse contient `payment.token`
- ✅ Réponse contient `payment.redirect_url`
- ✅ Données sauvegardées dans localStorage
- ✅ Redirection vers PayDunya se prépare

---

### Test 3: Vérification du localStorage

**Après le Test 2**, dans la console:

```javascript
// Vérifier les données sauvegardées
localStorage.getItem('pendingPayment')
```

**Résultat attendu**:

```json
{
  "orderId": 87,
  "orderNumber": "ORD-1762366423948",
  "token": "test_GzRMdpCUqF",
  "totalAmount": 10000,
  "timestamp": 1730835223948
}
```

**Vérifications**:
- ✅ orderId est un nombre
- ✅ orderNumber commence par "ORD-"
- ✅ token commence par "test_" (en mode sandbox)
- ✅ totalAmount correspond au montant de la commande
- ✅ timestamp est récent

---

### Test 4: Redirection vers PayDunya

**Note**: Ce test nécessite que le backend soit correctement configuré avec les clés PayDunya.

#### Si le backend est configuré:

1. Après le Test 2, vous serez redirigé vers PayDunya
2. URL attendue: `https://app.paydunya.com/sandbox-checkout/invoice/test_xxxxx`

**Sur la page PayDunya**:
- ✅ Affichage de la facture
- ✅ Montant correct
- ✅ Nom du magasin: "PrintAlma"
- ✅ Méthodes de paiement disponibles

#### Si le backend n'est PAS configuré:

Une erreur s'affichera:

```
❌ Erreur lors du traitement du paiement PayDunya

Veuillez vérifier vos informations de commande

Veuillez réessayer ou contacter le support si le problème persiste.
```

**Solution**: Configurer les clés PayDunya dans le backend (voir section Configuration).

---

### Test 5: Simulation de Paiement (Backend configuré)

**Sur PayDunya Sandbox**:

1. Choisir une méthode de paiement
2. Utiliser les numéros de test:
   ```
   Orange Money: 77 000 00 00
   Wave: 77 111 11 11
   MTN: 77 222 22 22
   ```
3. Confirmer le paiement

**Résultat attendu**:
- ✅ Paiement accepté
- ✅ Redirection automatique vers `/payment/success`

---

### Test 6: Page de Succès

**Après redirection depuis PayDunya**:

URL: `http://localhost:5175/payment/success?order=87&token=test_GzRMdpCUqF`

**Affichage attendu**:

```
┌─────────────────────────────────────────────┐
│             Paiement réussi ! ✅            │
│                                             │
│  Votre commande a été confirmée avec       │
│  succès                                     │
│                                             │
│  Numéro de commande: ORD-1762366423948     │
│  Montant: 10 000 FCFA                      │
│                                             │
│  [Vérification automatique du statut...]   │
│  Progress: ████████████░░░░░░ 60%         │
│  Tentatives: 6/60                          │
│                                             │
│  Statut: PENDING → PAID ✅                 │
└─────────────────────────────────────────────┘
```

**Vérifications**:
- ✅ Animation confetti (5 secondes)
- ✅ Icône de succès affichée
- ✅ Numéro de commande correct
- ✅ Montant correct
- ✅ PaymentTracker affiché
- ✅ Barre de progression visible
- ✅ Polling démarre automatiquement

**Logs attendus**:

```javascript
🔄 [PaymentTracker] Démarrage du polling pour orderId: 87
⏱️  [Polling] Tentative 1/60
📊 [Polling] Statut actuel: PENDING
⏱️  [Polling] Tentative 2/60
📊 [Polling] Statut actuel: PENDING
⏱️  [Polling] Tentative 3/60
📊 [Polling] Statut actuel: PAID ✅
🎉 [PaymentTracker] Paiement confirmé !
💾 [PaymentTracker] Nettoyage du localStorage
```

---

### Test 7: Gestion des Erreurs

#### Test 7.1: Erreur Backend (400)

**Simulation**:
- Modifier temporairement le code pour envoyer des données invalides

**Résultat attendu**:
```
❌ Veuillez vérifier vos informations de commande

Veuillez réessayer ou contacter le support si le problème persiste.
```

---

#### Test 7.2: Erreur Backend (500)

**Simulation**:
- Arrêter le backend

**Résultat attendu**:
```
❌ Erreur serveur. Veuillez réessayer plus tard.

Veuillez réessayer ou contacter le support si le problème persiste.
```

---

#### Test 7.3: Erreur Réseau

**Simulation**:
- Désactiver la connexion Internet
- Essayer de créer une commande

**Résultat attendu**:
```
❌ Problème de connexion. Vérifiez votre connexion Internet.

Veuillez réessayer ou contacter le support si le problème persiste.
```

---

## 🔧 Configuration Backend pour Tests

### Variables d'Environnement

Créer un fichier `.env` dans le backend:

```env
# PayDunya Sandbox Configuration
PAYDUNYA_MASTER_KEY=test_master_key_here
PAYDUNYA_PRIVATE_KEY=test_private_key_here
PAYDUNYA_TOKEN=test_token_here
PAYDUNYA_MODE=test
PAYDUNYA_STORE_NAME=PrintAlma

# URLs de Redirection (Local)
PAYDUNYA_RETURN_URL=http://localhost:5175/payment/success
PAYDUNYA_CANCEL_URL=http://localhost:5175/payment/cancel
PAYDUNYA_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/paydunya/webhook

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/printalma

# API
PORT=3004
NODE_ENV=development
```

### Obtenir les Clés PayDunya

1. Créer un compte sur [PayDunya](https://paydunya.com/)
2. Aller dans Dashboard → Paramètres → API
3. Copier:
   - Master Key
   - Private Key
   - Token
4. Coller dans le `.env`

---

## 📊 Checklist de Test Complet

### Tests Fonctionnels

- [ ] Validation email manquant
- [ ] Validation email invalide
- [ ] Validation téléphone invalide
- [ ] Validation adresse manquante
- [ ] Validation ville manquante
- [ ] Formulaire valide accepté
- [ ] Création de commande réussie
- [ ] Logs console complets
- [ ] localStorage sauvegardé
- [ ] Redirection vers PayDunya
- [ ] Paiement sur PayDunya
- [ ] Retour vers /payment/success
- [ ] Polling automatique
- [ ] Détection statut PAID
- [ ] Nettoyage localStorage
- [ ] Affichage des erreurs 400/500
- [ ] Gestion erreur réseau

### Tests UI/UX

- [ ] Formulaire responsive (mobile)
- [ ] Champs avec icônes visibles
- [ ] Messages d'erreur clairs
- [ ] Bouton de paiement cliquable
- [ ] Loader affiché pendant soumission
- [ ] Confetti sur page de succès
- [ ] Animation smooth
- [ ] Barre de progression visible
- [ ] Timeline des étapes affichée
- [ ] Boutons d'action fonctionnels

### Tests de Performance

- [ ] Temps de création < 3s
- [ ] Polling intervalle 3s respecté
- [ ] Arrêt automatique du polling
- [ ] Pas de fuites mémoire
- [ ] Console sans erreurs

---

## 🐛 Dépannage

### Problème: "payment" est undefined

**Cause**: Backend mal configuré ou `initiatePayment` manquant

**Solution**:
1. Vérifier les clés PayDunya dans `.env` backend
2. Vérifier que `initiatePayment: true` dans la requête
3. Consulter les logs du backend

---

### Problème: Pas de redirection

**Cause**: `redirect_url` manquante ou invalide

**Solution**:
1. Vérifier les logs console
2. Vérifier que `payment.redirect_url` existe
3. Vérifier la validation des données de paiement

---

### Problème: Polling ne démarre pas

**Cause**: orderId manquant ou localStorage vide

**Solution**:
1. Vérifier les query params: `?order=87&token=xxx`
2. Vérifier le localStorage: `localStorage.getItem('pendingPayment')`
3. Vérifier que PaymentTracker reçoit l'orderId

---

### Problème: Statut reste PENDING

**Cause**: Webhook non reçu

**Solution en local**:
1. Utiliser ngrok pour exposer localhost:
   ```bash
   ngrok http 3004
   ```
2. Copier l'URL ngrok dans `PAYDUNYA_WEBHOOK_URL`
3. Ou utiliser le script de simulation webhook

---

## 📞 Support

Pour toute question sur les tests:

1. Consulter la documentation:
   - `PAYMENT_SYSTEM_GUIDE.md`
   - `INTEGRATION_PAYDUNYA_ORDERFORM.md`
   - `PAYDUNYA_IMPLEMENTATION_SUMMARY.md`

2. Vérifier les logs dans la console

3. Contacter le support:
   - Email: support@printalma.com
   - Discord: [Lien Discord]

---

## ✅ Résultat Final

Si tous les tests passent:

```
✅ Validation du formulaire: OK
✅ Création de commande: OK
✅ localStorage: OK
✅ Redirection PayDunya: OK
✅ Paiement sandbox: OK
✅ Page de succès: OK
✅ Polling automatique: OK
✅ Gestion des erreurs: OK

🎉 L'intégration PayDunya est opérationnelle !
```

---

**Auteur**: Claude Code (Anthropic)
**Date**: 5 novembre 2025
**Version**: 1.0
