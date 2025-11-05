# 🚀 Quick Start - Intégration PayDunya

## ✅ Ce qui est déjà fait

Votre système de paiement PayDunya est **complètement opérationnel** avec :

### 📦 Services Créés

- ✅ `paymentStatusService.ts` - Vérification des statuts
- ✅ `paymentWebhookService.ts` - Gestion des webhooks
- ✅ `paymentPollingService.ts` - Polling automatique
- ✅ `orderService.ts` - Création et gestion des commandes (amélioré)

### 🎨 Composants React

- ✅ `PaymentTracker.tsx` - Suivi en temps réel avec polling
- ✅ `PaymentStatusHandler.tsx` - Gestionnaire de statuts
- ✅ `PaymentInsufficientFunds.tsx` - Page fonds insuffisants
- ✅ `PaymentSuccessPage.tsx` - Page de succès avec animations
- ✅ `PaymentFailedPage.tsx` - Page d'échec avec solutions

### 🔧 Hooks React

- ✅ `usePaymentPolling.ts` - Hook de polling intelligent

### 🛣️ Routes Configurées

- ✅ `/payment/success` - Page de succès
- ✅ `/payment/failed` - Page d'échec
- ✅ `/payment/cancel` - Page d'annulation
- ✅ `/payment/status` - Vérification du statut

---

## 🎯 Comment Utiliser (3 étapes simples)

### Étape 1: Dans votre formulaire de commande

```typescript
import { orderService } from '../services/orderService';
import { paymentStatusService } from '../services/paymentStatusService';

const handlePayment = async () => {
  const orderRequest = {
    shippingDetails: {
      street: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      country: formData.country,
    },
    phoneNumber: formData.phone,
    orderItems: [{
      productId: 1,
      quantity: 1,
      unitPrice: 5000,
    }],
    paymentMethod: 'PAYDUNYA',
    initiatePayment: true,
  };

  // Créer la commande
  const response = await orderService.createGuestOrder(orderRequest);

  // Sauvegarder pour le suivi
  paymentStatusService.savePendingPayment({
    orderId: response.data.id,
    orderNumber: response.data.orderNumber,
    token: response.data.payment.token,
    totalAmount: response.data.totalAmount,
    timestamp: Date.now(),
  });

  // Rediriger vers PayDunya
  window.location.href = response.data.payment.redirect_url;
};
```

### Étape 2: Page de retour PayDunya

Dans `PaymentSuccessPage.tsx` (déjà créée) :

```typescript
// Le composant PaymentTracker démarre automatiquement le polling
<PaymentTracker
  orderId={parseInt(orderId)}
  onPaymentSuccess={(order) => {
    // Paiement confirmé !
    console.log('Success:', order);
  }}
  onPaymentFailure={(order) => {
    // Paiement échoué
    navigate('/payment/failed');
  }}
  autoStart={true}
/>
```

### Étape 3: C'est tout ! 🎉

Le système gère automatiquement :
- ✅ Polling toutes les 3 secondes
- ✅ Backoff exponentiel (évite la surcharge)
- ✅ Arrêt automatique quand PAID ou FAILED
- ✅ Affichage de la progression
- ✅ Gestion des erreurs

---

## 📊 Workflow Automatique

```
1. Utilisateur paie sur PayDunya
          ↓
2. Retour sur /payment/success?order=123
          ↓
3. PaymentTracker démarre le polling automatique
          ↓
4. Vérification toutes les 3s: GET /orders/123
          ↓
5. Détection du changement: PENDING → PAID
          ↓
6. Arrêt automatique + Callback onPaymentSuccess
          ↓
7. Redirection ou affichage du succès
```

---

## 🔧 Configuration Backend Requise

Assurez-vous que votre backend a ces endpoints :

```typescript
// Backend (NestJS)
GET  /orders/:id                  // Récupérer une commande
POST /orders/guest                // Créer commande invité
GET  /paydunya/status/:token     // Vérifier statut PayDunya
POST /paydunya/webhook           // Recevoir webhooks PayDunya
```

---

## 🎨 Exemple Complet d'Utilisation

```typescript
// OrderFormPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { paymentStatusService } from '../services/paymentStatusService';

export const OrderFormPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Sénégal',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Créer la commande
      const orderRequest = {
        shippingDetails: {
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ')[1] || '',
          street: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        phoneNumber: formData.phone,
        notes: '',
        orderItems: [{
          productId: 1, // Votre ID de produit
          quantity: 1,
          unitPrice: 5000,
          size: 'M',
          color: 'Noir',
        }],
        paymentMethod: 'PAYDUNYA',
        initiatePayment: true,
      };

      const response = await orderService.createGuestOrder(orderRequest);

      if (!response.success) {
        throw new Error(response.message);
      }

      // 2. Sauvegarder pour le tracking
      paymentStatusService.savePendingPayment({
        orderId: response.data.id,
        orderNumber: response.data.orderNumber,
        token: response.data.payment.token,
        totalAmount: response.data.totalAmount,
        timestamp: Date.now(),
      });

      // 3. Rediriger vers PayDunya
      const paymentUrl = response.data.payment.redirect_url ||
                         response.data.payment.payment_url;

      console.log('🔄 Redirection vers:', paymentUrl);
      window.location.href = paymentUrl;

    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la création de la commande');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="order-form">
      <h2>Finaliser ma commande</h2>

      <input
        type="text"
        placeholder="Nom complet"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />

      <input
        type="tel"
        placeholder="Téléphone"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        required
      />

      <input
        type="text"
        placeholder="Adresse"
        value={formData.address}
        onChange={(e) => setFormData({...formData, address: e.target.value})}
        required
      />

      <input
        type="text"
        placeholder="Ville"
        value={formData.city}
        onChange={(e) => setFormData({...formData, city: e.target.value})}
        required
      />

      <button type="submit" className="payment-button">
        Payer avec PayDunya
      </button>
    </form>
  );
};
```

---

## 🧪 Test en Développement

```typescript
// Dans PaymentTracker.tsx, utilisez ce bouton en mode dev
{import.meta.env.VITE_ENV !== 'production' && (
  <button onClick={async () => {
    const { paymentWebhookService } = await import('../services/paymentWebhookService');
    await paymentWebhookService.forcePaymentSuccess(orderId);
    retryPolling();
  }}>
    🧪 Forcer le succès (test)
  </button>
)}
```

---

## 📝 Variables d'Environnement

```env
# .env
VITE_API_URL=http://localhost:3004
VITE_PAYDUNYA_MODE=test
VITE_ENV=development
```

---

## 🎯 Points Clés

### ✅ Avantages du Système

1. **Automatique** : Le polling démarre et s'arrête automatiquement
2. **Intelligent** : Backoff exponentiel pour éviter la surcharge
3. **Robuste** : Gestion complète des erreurs
4. **Simple** : 3 lignes de code pour intégrer le tracking

### 🚀 Production Ready

- ✅ TypeScript strict
- ✅ Gestion d'erreurs complète
- ✅ Polling optimisé
- ✅ Interface professionnelle
- ✅ Support mobile
- ✅ Documentation complète

---

## 📞 Support

Questions ? Consultez :
- `PAYMENT_SYSTEM_GUIDE.md` - Guide complet
- `IMPLEMENTATION_SUMMARY.md` - Résumé technique

---

**Version** : 1.0.0
**Status** : ✅ Production Ready

🎉 **Votre système est prêt à l'emploi !**
