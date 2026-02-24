# Guide d'utilisation Orange Money - Frontend

**Date**: 2026-02-24
**Version**: 1.0.0
**Backend**: Conforme API Orange Money v1.0.0

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Parcours utilisateur](#parcours-utilisateur)
4. [Services disponibles](#services-disponibles)
5. [Pages et composants](#pages-et-composants)
6. [Configuration](#configuration)
7. [Exemples d'utilisation](#exemples-dutilisation)
8. [Gestion des erreurs](#gestion-des-erreurs)
9. [Tests et débogage](#tests-et-débogage)

---

## 🎯 Vue d'ensemble

L'intégration Orange Money dans le frontend Printalma permet aux utilisateurs de payer leurs commandes via :

- **QR Code** : Pour scanner avec l'application Orange Money
- **Deeplinks** : Pour ouvrir directement MAX IT ou Orange Money sur mobile
- **Polling automatique** : Vérification du statut toutes les secondes (max 3 minutes)
- **Redirections automatiques** : Vers la page de confirmation après paiement réussi

### ✅ Fonctionnalités

- ✅ Génération de QR Code et deeplinks
- ✅ Affichage du QR Code sur la page de paiement
- ✅ Polling automatique du statut de paiement
- ✅ Gestion des états : PENDING, PAID, FAILED, CANCELLED
- ✅ Redirection automatique après succès
- ✅ Annulation du paiement après 60 secondes
- ✅ Sauvegarde dans localStorage avec expiration (30 minutes)

---

## 🏗️ Architecture

### Structure des fichiers

```
src/
├── services/
│   ├── orangeMoneyService.ts          # Service principal Orange Money
│   └── paymentWebhookService.ts       # Vérification de statut
├── pages/
│   ├── ModernOrderFormPage.tsx        # Formulaire de commande avec Orange Money
│   └── payment/
│       └── OrangeMoneyPaymentPage.tsx # Page de paiement avec polling
├── types/
│   └── payment.ts                     # Types PaymentStatus
└── App.tsx                            # Routing
```

### Flux de données

```
┌─────────────────────┐
│ ModernOrderFormPage │
│ (Sélection Orange   │
│  Money comme moyen  │
│  de paiement)       │
└──────────┬──────────┘
           │
           │ 1. createPayment()
           ▼
┌─────────────────────┐
│ OrangeMoneyService  │
│ - Crée le paiement  │
│ - Génère QR Code    │
│ - Sauvegarde local  │
└──────────┬──────────┘
           │
           │ 2. Navigate to /payment/orange-money
           ▼
┌─────────────────────────┐
│ OrangeMoneyPaymentPage  │
│ - Affiche QR Code       │
│ - Polling automatique   │
│ - Vérifie statut        │
└──────────┬──────────────┘
           │
           │ 3. Polling via paymentWebhookService
           ▼
┌─────────────────────────┐
│ Backend API             │
│ /orange-money/          │
│ payment-status/:number  │
└──────────┬──────────────┘
           │
           │ 4. Réponse statut
           ▼
┌─────────────────────────┐
│ Redirection automatique │
│ - PAID → /order-...     │
│ - FAILED → Retry        │
└─────────────────────────┘
```

---

## 👤 Parcours utilisateur

### Étape 1 : Sélection Orange Money

Sur la page de commande (`/order-form`), l'utilisateur :

1. Remplit ses informations de livraison
2. Sélectionne **Orange Money** comme méthode de paiement
3. Clique sur **Finaliser la commande**

### Étape 2 : Génération du QR Code

Le frontend :

1. Crée la commande avec `paymentMethod: 'ORANGE_MONEY'`
2. Appelle `OrangeMoneyService.createPayment()`
3. Sauvegarde les données (QR Code, deeplinks) dans localStorage
4. Redirige vers `/payment/orange-money?orderNumber=...`

### Étape 3 : Paiement

Sur la page de paiement (`/payment/orange-money`), l'utilisateur :

1. **Desktop** : Voit le QR Code et peut le scanner avec son téléphone
2. **Mobile** : Voit des boutons pour ouvrir MAX IT ou Orange Money
3. Effectue le paiement dans l'application Orange Money

### Étape 4 : Vérification automatique

Le frontend :

1. **Polling automatique** : Vérifie le statut toutes les 1 seconde
2. **Affichage en temps réel** : Barre de progression et compteur
3. **Détection du statut** :
   - `PAID` → Redirection automatique vers la confirmation
   - `FAILED` / `CANCELLED` → Affichage de l'erreur avec bouton de réessai
   - `PENDING` → Continue le polling (max 3 minutes)

### Étape 5 : Confirmation ou échec

- **Succès** : Redirection automatique vers la page de confirmation
- **Échec** : Affichage de l'erreur avec options de réessai ou retour

---

## 🛠️ Services disponibles

### `OrangeMoneyService`

Service principal pour gérer les paiements Orange Money.

**Localisation** : `src/services/orangeMoneyService.ts`

#### Méthodes principales

##### `createPayment(request: OrangePaymentRequest)`

Génère un QR Code et des deeplinks pour un paiement.

```typescript
import { OrangeMoneyService } from '../services/orangeMoneyService';

const response = await OrangeMoneyService.createPayment({
  orderId: 123,
  amount: 15000,
  customerName: 'Jean Dupont',
  customerPhone: '221771234567',
  orderNumber: 'ORD-2024-001',
});

if (response.success && response.data) {
  const { qrCode, deepLinks, reference, validity } = response.data;
  // qrCode: Base64 image
  // deepLinks: { MAXIT: 'maxit://...', OM: 'om://...' }
  // validity: 600 (secondes)
}
```

##### `checkPaymentStatus(orderNumber: string)`

Vérifie le statut actuel d'un paiement.

```typescript
const status = await OrangeMoneyService.checkPaymentStatus('ORD-2024-001');

console.log(status.paymentStatus); // 'PENDING', 'PAID', 'FAILED', 'CANCELLED'
console.log(status.shouldRedirect); // true si redirection nécessaire
console.log(status.redirectUrl);   // URL de redirection
```

##### `pollPaymentStatus(orderNumber, maxAttempts?, intervalMs?, onStatusUpdate?)`

Polling automatique avec callback de mise à jour.

```typescript
const result = await OrangeMoneyService.pollPaymentStatus(
  'ORD-2024-001',
  180,    // max 180 tentatives
  1000,   // intervalle de 1 seconde
  (status) => {
    console.log('Statut mis à jour:', status.paymentStatus);
  }
);

if (result.paymentStatus === 'PAID') {
  console.log('Paiement réussi !');
}
```

##### `savePaymentData(data: OrangeMoneyStoredData)`

Sauvegarde les données de paiement dans localStorage (expire après 30 minutes).

```typescript
OrangeMoneyService.savePaymentData({
  qrCode: 'base64...',
  deepLinks: { MAXIT: '...', OM: '...' },
  reference: 'OM-REF-001',
  orderNumber: 'ORD-2024-001',
  totalAmount: 15000,
  timestamp: Date.now(),
});
```

##### `getPaymentData()`

Récupère les données depuis localStorage (retourne `null` si expirées).

```typescript
const data = OrangeMoneyService.getPaymentData();

if (data) {
  console.log('QR Code:', data.qrCode);
  console.log('Commande:', data.orderNumber);
}
```

##### `clearPaymentData()`

Efface les données de paiement du localStorage.

```typescript
OrangeMoneyService.clearPaymentData();
```

##### `cancelPayment(orderNumber: string)`

Annule un paiement en cours.

```typescript
const result = await OrangeMoneyService.cancelPayment('ORD-2024-001');

if (result.success) {
  console.log('Paiement annulé avec succès');
}
```

##### Méthodes utilitaires

```typescript
// Vérifier si l'utilisateur est sur mobile
const isMobile = OrangeMoneyService.isMobile();

// Obtenir un message convivial
const message = OrangeMoneyService.getStatusMessage('PAID');
// → "✅ Paiement réussi ! Votre commande a été confirmée."

// Obtenir une couleur pour l'affichage
const color = OrangeMoneyService.getStatusColor('PENDING');
// → "orange"

// Obtenir une icône
const icon = OrangeMoneyService.getStatusIcon('FAILED');
// → "❌"
```

---

## 📄 Pages et composants

### `ModernOrderFormPage`

Page du formulaire de commande avec intégration Orange Money.

**Localisation** : `src/pages/ModernOrderFormPage.tsx`

#### Fonctionnalités

- Sélection d'Orange Money comme méthode de paiement
- Validation du formulaire avant soumission
- Création de la commande avec `paymentMethod: 'ORANGE_MONEY'`
- Génération du QR Code via `OrangeMoneyService.createPayment()`
- Sauvegarde dans localStorage
- Redirection vers `/payment/orange-money`

#### Code clé

```typescript
// Fonction de traitement du paiement Orange Money
const processOrangeMoneyPayment = async () => {
  // 1. Créer la commande
  const orderResponse = await orderService.createOrderWithPayment({
    ...formData,
    paymentMethod: 'ORANGE_MONEY',
    initiatePayment: false,
  });

  // 2. Générer le QR Code
  const orangePaymentResult = await OrangeMoneyService.createPayment({
    orderId: orderResponse.data.id,
    amount: totalAmount,
    customerName: `${formData.firstName} ${formData.lastName}`,
    customerPhone: formData.phone,
    orderNumber: orderResponse.data.orderNumber,
  });

  // 3. Sauvegarder dans localStorage
  const orangeMoneyData = {
    qrCode: orangePaymentResult.data.qrCode,
    deepLinks: orangePaymentResult.data.deepLinks,
    reference: orangePaymentResult.data.reference,
    orderNumber: orderResponse.data.orderNumber,
    totalAmount,
    timestamp: Date.now(),
  };

  localStorage.setItem('orangeMoneyPayment', JSON.stringify(orangeMoneyData));

  // 4. Rediriger
  navigate(`/payment/orange-money?orderNumber=${orderResponse.data.orderNumber}`);
};
```

---

### `OrangeMoneyPaymentPage`

Page d'affichage du QR Code avec polling automatique.

**Localisation** : `src/pages/payment/OrangeMoneyPaymentPage.tsx`

#### Fonctionnalités

- **Affichage du QR Code** : Image base64 avec dimensions optimisées
- **Deeplinks** : Boutons pour ouvrir MAX IT ou Orange Money
- **Polling automatique** : Vérification toutes les 1 seconde (max 180 tentatives = 3 minutes)
- **Barre de progression** : Affichage visuel du temps restant
- **Gestion des états** :
  - `PENDING` : Affichage du QR Code et instructions
  - `PAID` : Écran de succès avec détails de la transaction
  - `FAILED` / `CANCELLED` : Écran d'erreur avec options de réessai
- **Annulation** : Bouton d'annulation après 60 secondes
- **Redirection automatique** : Si `shouldRedirect=true` dans la réponse

#### Structure

```tsx
<OrangeMoneyPaymentPage>
  {/* État PENDING */}
  {!isFinalState && (
    <div>
      <Loader /> {/* Spinner de chargement */}
      <QRCode src={orangeMoneyData.qrCode} />
      <Deeplinks>
        <Button href={deepLinks.MAXIT}>Ouvrir MAX IT</Button>
        <Button href={deepLinks.OM}>Ouvrir Orange Money</Button>
      </Deeplinks>
      <ProgressBar progress={attempts / maxAttempts * 100} />
      {attempts >= 60 && <CancelButton onClick={handleCancelPayment} />}
    </div>
  )}

  {/* État PAID */}
  {paymentStatus === 'PAID' && (
    <SuccessScreen>
      <CheckCircle />
      <OrderDetails orderData={orderData} />
      <Actions>
        <Button onClick={goToOrders}>Voir mes commandes</Button>
        <Button onClick={goHome}>Accueil</Button>
      </Actions>
    </SuccessScreen>
  )}

  {/* État FAILED / CANCELLED */}
  {(paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') && (
    <ErrorScreen>
      <XCircle />
      <ErrorMessage>{error}</ErrorMessage>
      <Actions>
        <Button onClick={handleRetryPayment}>Réessayer</Button>
        <Button onClick={goHome}>Accueil</Button>
      </Actions>
    </ErrorScreen>
  )}
</OrangeMoneyPaymentPage>
```

---

## ⚙️ Configuration

### Variables d'environnement

Aucune variable d'environnement spécifique n'est requise côté frontend. Le backend gère les credentials Orange Money.

### Routing

La route `/payment/orange-money` est configurée dans `App.tsx` :

```tsx
// App.tsx
import OrangeMoneyPaymentPage from './pages/payment/OrangeMoneyPaymentPage';

function App() {
  return (
    <Routes>
      {/* ... autres routes ... */}

      {/* Route de paiement Orange Money avec polling automatique */}
      <Route path='/payment/orange-money' element={<OrangeMoneyPaymentPage />} />
    </Routes>
  );
}
```

---

## 💡 Exemples d'utilisation

### Exemple 1 : Intégrer Orange Money dans un formulaire personnalisé

```tsx
import { OrangeMoneyService } from '../services/orangeMoneyService';
import { useNavigate } from 'react-router-dom';

function MyCustomOrderForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOrangeMoneyPayment = async () => {
    try {
      setIsProcessing(true);

      // 1. Créer la commande dans votre système
      const order = await createOrder({
        items: cartItems,
        customerInfo: formData,
        paymentMethod: 'ORANGE_MONEY',
      });

      // 2. Générer le paiement Orange Money
      const paymentResult = await OrangeMoneyService.createPayment({
        orderId: order.id,
        amount: order.totalAmount,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        orderNumber: order.orderNumber,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error);
      }

      // 3. Sauvegarder les données
      OrangeMoneyService.savePaymentData({
        qrCode: paymentResult.data.qrCode,
        deepLinks: paymentResult.data.deepLinks,
        reference: paymentResult.data.reference,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        timestamp: Date.now(),
      });

      // 4. Rediriger
      navigate(`/payment/orange-money?orderNumber=${order.orderNumber}`);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Échec de la création du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button onClick={handleOrangeMoneyPayment} disabled={isProcessing}>
      {isProcessing ? 'Traitement...' : 'Payer avec Orange Money'}
    </button>
  );
}
```

---

### Exemple 2 : Vérifier manuellement le statut d'un paiement

```tsx
import { OrangeMoneyService } from '../services/orangeMoneyService';

function PaymentStatusChecker({ orderNumber }: { orderNumber: string }) {
  const [status, setStatus] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    const result = await OrangeMoneyService.checkPaymentStatus(orderNumber);

    if (result.success) {
      setStatus(result.paymentStatus || 'UNKNOWN');
    } else {
      setStatus('ERROR');
    }

    setIsChecking(false);
  };

  return (
    <div>
      <p>Statut actuel : {OrangeMoneyService.getStatusIcon(status)} {status}</p>
      <button onClick={checkStatus} disabled={isChecking}>
        {isChecking ? 'Vérification...' : 'Vérifier le statut'}
      </button>
    </div>
  );
}
```

---

### Exemple 3 : Polling personnalisé avec feedback en temps réel

```tsx
import { OrangeMoneyService } from '../services/orangeMoneyService';

function CustomPaymentPolling({ orderNumber }: { orderNumber: string }) {
  const [attempts, setAttempts] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('PENDING');
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = async () => {
    setIsPolling(true);

    const result = await OrangeMoneyService.pollPaymentStatus(
      orderNumber,
      60,     // 60 tentatives
      2000,   // toutes les 2 secondes
      (status) => {
        // Callback appelé à chaque vérification
        setAttempts((prev) => prev + 1);
        setCurrentStatus(status.paymentStatus || 'PENDING');
        console.log('Mise à jour:', status);
      }
    );

    setIsPolling(false);

    if (result.paymentStatus === 'PAID') {
      alert('Paiement réussi !');
    } else {
      alert('Paiement échoué ou annulé');
    }
  };

  return (
    <div>
      <h2>Polling personnalisé</h2>
      <p>Tentatives: {attempts}</p>
      <p>Statut: {currentStatus}</p>
      <button onClick={startPolling} disabled={isPolling}>
        {isPolling ? 'Vérification en cours...' : 'Démarrer le polling'}
      </button>
    </div>
  );
}
```

---

## 🚨 Gestion des erreurs

### Erreurs courantes

#### 1. **Erreur de création de paiement**

**Cause** : Impossible de générer le QR Code (backend inaccessible, credentials invalides, etc.)

**Gestion** :
```typescript
const paymentResult = await OrangeMoneyService.createPayment(request);

if (!paymentResult.success) {
  // Afficher un message d'erreur
  toast.error(paymentResult.error || 'Échec de la création du paiement');

  // Logger l'erreur
  console.error('Échec Orange Money:', paymentResult.error);

  // Proposer une alternative
  // Par exemple : rediriger vers un autre moyen de paiement
}
```

#### 2. **Timeout du paiement (après 3 minutes)**

**Cause** : L'utilisateur n'a pas payé dans le délai imparti.

**Gestion** :
- La page `OrangeMoneyPaymentPage` affiche automatiquement un statut `FAILED`
- L'utilisateur peut cliquer sur "Réessayer le paiement" pour retourner au formulaire

#### 3. **Paiement annulé par l'utilisateur**

**Cause** : L'utilisateur clique sur le bouton "Annuler ce paiement".

**Gestion** :
```typescript
const handleCancelPayment = async () => {
  const result = await OrangeMoneyService.cancelPayment(orderNumber);

  if (result.success) {
    // Arrêter le polling
    stopPolling();

    // Afficher l'état échoué
    setPaymentStatus('CANCELLED');
    setError('Vous avez annulé le paiement');
  }
};
```

#### 4. **Données expirées dans localStorage**

**Cause** : L'utilisateur revient sur la page après 30 minutes.

**Gestion** :
```typescript
const data = OrangeMoneyService.getPaymentData();

if (!data) {
  // Données expirées ou inexistantes
  console.warn('Données de paiement expirées');

  // Rediriger vers la page d'accueil ou de commande
  navigate('/');
}
```

#### 5. **Backend non accessible**

**Cause** : Le backend ne répond pas lors de la vérification du statut.

**Gestion** :
- Le polling continue jusqu'au nombre maximum de tentatives
- Si toutes les tentatives échouent, afficher un message d'erreur et proposer de contacter le support

---

## 🧪 Tests et débogage

### Tests manuels recommandés

#### Test 1 : Parcours complet (Desktop)

1. Aller sur `/order-form`
2. Remplir le formulaire de commande
3. Sélectionner **Orange Money** comme moyen de paiement
4. Cliquer sur **Finaliser la commande**
5. Vérifier que :
   - ✅ Le QR Code s'affiche correctement
   - ✅ Les deeplinks sont présents
   - ✅ Le polling démarre automatiquement
   - ✅ Le compteur de tentatives augmente

#### Test 2 : Parcours complet (Mobile)

1. Ouvrir le site sur mobile
2. Suivre les étapes 1-4 du Test 1
3. Vérifier que :
   - ✅ Les boutons "Ouvrir MAX IT" et "Ouvrir Orange Money" s'affichent
   - ✅ Cliquer sur un bouton ouvre l'application correspondante
   - ✅ Après paiement dans l'app, le statut se met à jour automatiquement

#### Test 3 : Annulation de paiement

1. Suivre le parcours complet jusqu'à la page de paiement
2. Attendre 60 secondes
3. Cliquer sur **Annuler ce paiement**
4. Vérifier que :
   - ✅ Le polling s'arrête
   - ✅ Le statut passe à `CANCELLED`
   - ✅ Un message d'erreur s'affiche
   - ✅ Un bouton "Réessayer" est disponible

#### Test 4 : Timeout (3 minutes)

1. Suivre le parcours complet jusqu'à la page de paiement
2. NE PAS payer
3. Attendre 3 minutes (180 secondes)
4. Vérifier que :
   - ✅ Le polling s'arrête automatiquement
   - ✅ Le statut passe à `FAILED`
   - ✅ Un message de timeout s'affiche

#### Test 5 : Paiement réussi

1. Suivre le parcours complet
2. Payer avec l'application Orange Money (ou simuler un callback SUCCESS côté backend)
3. Vérifier que :
   - ✅ Le polling détecte le statut `PAID`
   - ✅ L'écran de succès s'affiche
   - ✅ Les détails de la transaction sont affichés
   - ✅ Le panier est vidé
   - ✅ (Optionnel) Redirection automatique vers la confirmation

---

### Logs de débogage

Le service `OrangeMoneyService` et la page `OrangeMoneyPaymentPage` loguent automatiquement les événements dans la console :

```
🍊 [Orange Money] Création du paiement: ORD-2024-001
✅ [Orange Money] Paiement créé avec succès
💾 [Orange Money] Données sauvegardées dans localStorage
🔍 [Orange Money] Vérification statut pour: ORD-2024-001
📊 [Orange Money] Statut récupéré: PENDING
🔄 [Orange Money] Tentative 1/180
🔄 [Orange Money] Tentative 2/180
...
✅ [Orange Money] Statut final: PAID
🗑️ [Orange Money] Données supprimées du localStorage
```

#### Activer les logs détaillés

Pour activer des logs plus détaillés, vous pouvez ajouter `console.log` dans les fonctions de callback :

```typescript
const result = await OrangeMoneyService.pollPaymentStatus(
  orderNumber,
  180,
  1000,
  (status) => {
    console.log('📊 [DEBUG] Statut complet:', JSON.stringify(status, null, 2));
  }
);
```

---

### Tester avec le backend

Le backend dispose de scripts de test complets :

```bash
# Backend en local
cd /chemin/vers/printalma-back-dep

# Test de la configuration
./test-orange-config.sh

# Test d'un paiement complet
./test-orange-payment.sh ORD-TEST-001

# Test END-TO-END complet (24+ tests)
./test-orange-money-complete.sh
```

Consultez `RESULTATS_TESTS_ORANGE_MONEY.md` pour voir les résultats des derniers tests.

---

## 📚 Ressources

- **Backend README** : `ORANGE_MONEY_IMPLEMENTATION_SUMMARY.md`
- **Tests backend** : `README_TESTS_ORANGE_MONEY.md`
- **Résultats des tests** : `RESULTATS_TESTS_ORANGE_MONEY.md`
- **Guide callbacks** : `ORANGE_MONEY_CALLBACKS_GUIDE.md`
- **API Orange Money** : Documentation officielle Orange Money API v1.0.0

---

## 🎉 Conclusion

L'implémentation Orange Money dans le frontend Printalma est :

- ✅ **Complète** : QR Code, deeplinks, polling, gestion des états
- ✅ **Robuste** : Gestion des erreurs, timeout, annulation
- ✅ **User-friendly** : Interface claire, instructions détaillées
- ✅ **Testée** : Parcours complet testé en production

**Le système est prêt pour la production !** 🚀

---

**Dernière mise à jour** : 2026-02-24
**Auteur** : Claude Sonnet 4.5
**Version** : 1.0.0
