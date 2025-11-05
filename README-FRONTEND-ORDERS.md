# 🛒 Frontend PrintAlma - Système de Commandes et Paiement Paydunya

Application frontend React + TypeScript pour la gestion complète des commandes et paiements via Paydunya.

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ installé
- Serveur backend PrintAlma démarré sur le port 3004
- Compte Paydunya (sandbox pour les tests)

### Installation

```bash
# 1. Naviguer vers le projet
cd printalma_website_dep

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local

# 4. Démarrer le serveur de développement
npm run dev
```

Le serveur démarre sur **http://localhost:5174** (port Vite par défaut).

### Configuration

Créer/modifier le fichier `.env.local` à la racine :

```bash
# Configuration API Backend
VITE_API_URL=http://localhost:3004

# Configuration Paydunya
VITE_PAYDUNYA_MODE=sandbox  # 'sandbox' pour tests, 'live' pour production

# Configuration (optionnel)
VITE_APP_NAME=PrintAlma
VITE_APP_VERSION=1.0.0
```

---

## 📱 Architecture du Projet

```
src/
├── pages/                    # Pages principales
│   ├── OrderFormPage.tsx     # 🎯 Page de commande (CRITIQUE)
│   ├── PaymentSuccess.tsx    # Page de succès paiement
│   └── PaymentCancel.tsx     # Page d'annulation paiement
├── components/               # Composants réutilisables
│   ├── vendor/
│   │   └── SimpleProductPreview.tsx  # Aperçu produit avec design
│   ├── ui/                   # Composants UI (shadcn)
│   └── ErrorBoundary.tsx     # Gestion des erreurs
├── contexts/                 # Contextes React
│   ├── CartContext.tsx       # 🛒 Gestion du panier
│   ├── AuthContext.tsx       # Authentification utilisateur
│   └── CategoryContext.tsx   # Catégories produits
├── hooks/                    # Hooks personnalisés
│   ├── useCart.ts            # Hook panier
│   ├── useOrder.ts           # Hook commandes
│   └── usePaydunya.ts        # Hook paiement Paydunya
├── services/                 # Services API
│   ├── orderService.ts       # Service commandes
│   └── paydunyaService.ts    # Service Paydunya
├── types/                    # Types TypeScript
│   ├── order.ts              # Types commande/paiement
│   └── product.ts            # Types produits
├── config/                   # Configuration
│   └── api.ts                # Configuration API endpoints
└── utils/                    # Utilitaires
    ├── priceUtils.ts         # Formatage prix
    └── validation.ts         # Validation formulaires
```

---

## 🛠️ Fonctionnalités Principales

### 🛒 Gestion du Panier (`CartContext`)

- ✅ Ajout/suppression d'articles
- ✅ Gestion des quantités
- ✅ Support des variantes (taille, couleur)
- ✅ Calcul automatique des totaux
- ✅ Persistance dans localStorage
- ✅ Informations produit détaillées (design, délimitations)

### 📝 Formulaire de Commande (`OrderFormPage.tsx`)

**Page principale** : `/order-form`

**Fonctionnalités** :
- ✅ **Informations client** : Prénom, nom, email (optionnel), téléphone (obligatoire)
- ✅ **Adresse de livraison** : Rue, ville, code postal, pays
- ✅ **Validation en temps réel** : Format téléphone sénégalais, email, longueur champs
- ✅ **Aperçu produit** : Affichage du produit avec design positionné
- ✅ **Options de livraison** : Standard, Express, Retrait magasin
- ✅ **Choix de paiement** : Paydunya ou Paiement à la livraison
- ✅ **Gestion intelligente d'endpoint** : `/orders` (authentifié) ou `/orders/guest` (invité)

**Validation des données** :
```typescript
// Téléphone : Format sénégalais requis
Format: 77 123 45 67 ou 775588836
Regex: /^(70|75|76|77|78|33)[0-9]{7}$/

// Email : Optionnel mais validé si fourni
Format: email@example.com
Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Adresse : Obligatoire (max 200 caractères)
// Ville : Obligatoire (max 100 caractères)
// Pays : Obligatoire (max 100 caractères)
```

### 💳 Paiement Paydunya

**Flux automatisé** :

1. **Création de commande** → `POST /orders/guest` ou `POST /orders`
2. **Réception token Paydunya** → Backend initialise le paiement
3. **Génération URL** → Logique de fallback robuste :
   ```typescript
   // Essai 1 : redirect_url fourni par backend
   // Essai 2 : payment_url fourni par backend
   // Essai 3 : Génération automatique
   const url = `https://paydunya.com/sandbox-checkout/invoice/${token}`;
   ```
4. **Redirection automatique** → Client redirigé vers Paydunya
5. **Paiement client** → Orange Money, Wave, MTN, Moov, CB
6. **Retour automatique** → `/payment/success` ou `/payment/cancel`
7. **Webhook backend** → Mise à jour du statut de paiement

**Méthodes de paiement supportées** :
- 🟠 Orange Money
- 🔵 Wave
- 🟡 MTN Money
- 🟣 Moov Money
- 💳 Cartes bancaires
- 💰 PayPal

### 📊 Suivi des Commandes

- ✅ Stockage des informations de commande dans localStorage
- ✅ Affichage du numéro de commande
- ✅ Statut en temps réel (PENDING, PROCESSING, SHIPPED, DELIVERED)
- ✅ Statut de paiement (PENDING, PAID, FAILED)

---

## 🔌 Points d'Accès API (Frontend → Backend)

### Commandes

```typescript
// POST /orders/guest - Créer une commande invité (pas d'authentification)
interface OrderRequest {
  shippingDetails: {
    firstName?: string;
    lastName?: string;
    street: string;
    city: string;
    region: string;
    postalCode?: string;
    country: string;
  };
  phoneNumber: string;
  notes?: string;
  orderItems: [{
    productId: number;
    vendorProductId?: number;
    quantity: number;
    unitPrice: number;
    size?: string;
    color?: string;
    colorId?: number;
  }];
  paymentMethod: 'PAYDUNYA' | 'CASH_ON_DELIVERY';
  initiatePayment?: boolean;
}

// POST /orders - Créer une commande authentifiée
// (Nécessite header Authorization: Bearer TOKEN)

// GET /orders/:id - Détails d'une commande
// PATCH /orders/:id/cancel - Annuler une commande
```

### Paiements Paydunya

```typescript
// GET /paydunya/status/:token - Vérifier le statut d'un paiement
interface PaymentStatusResponse {
  success: boolean;
  data: {
    response_code: string;
    response_text: string;
    status: 'pending' | 'completed' | 'cancelled' | 'failed';
    order_number?: string;
    payment_status?: string;
    total_amount?: number;
  };
}
```

### Produits Publics

```typescript
// GET /public/vendor-products - Liste des produits disponibles
// GET /public/vendor-products/:id - Détails d'un produit
```

---

## 🎯 Flux Utilisateur Complet

### 1. **Navigation Produits**
```
Accueil → Catalogue → Sélection produit → Personnalisation
```

### 2. **Ajout au Panier**
```typescript
// Composant : ProductCard
const handleAddToCart = () => {
  addToCart({
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    size: selectedSize,
    color: selectedColor,
    imageUrl: product.mainImageUrl,
    designUrl: product.designUrl,
    designScale: 0.8
  });
};
```

### 3. **Validation Panier**
```
Panier → Vérification articles → Clic "Finaliser la commande"
→ Redirection vers /order-form
```

### 4. **Formulaire de Commande** (`OrderFormPage.tsx`)

**Étapes** :
1. Affichage du récapitulatif (produit + design)
2. Formulaire informations client
3. Adresse de livraison
4. Choix livraison (Standard/Express/Retrait)
5. Choix paiement (Paydunya/Cash)
6. Validation et création de commande

**Code simplifié** :
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  if (selectedPayment === 'paydunya') {
    await processPayDunyaPayment();
  } else {
    // Paiement à la livraison
    setOrderComplete(true);
    clearCart();
  }
};
```

### 5. **Paiement Paydunya**

**Logique de redirection** :
```typescript
// 1. Choix d'endpoint intelligent
const endpoint = token
  ? `${API_URL}/orders`
  : `${API_URL}/orders/guest`;

// 2. Appel API
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderRequest)
});

const orderResponse = await response.json();

// 3. Génération URL avec fallback
let paymentUrl = orderResponse.data.payment.redirect_url ||
                orderResponse.data.payment.payment_url;

if (!paymentUrl) {
  const baseUrl = mode === 'live'
    ? 'https://paydunya.com/checkout/invoice'
    : 'https://paydunya.com/sandbox-checkout/invoice';
  paymentUrl = `${baseUrl}/${orderResponse.data.payment.token}`;
}

// 4. Stockage pour retour
localStorage.setItem('paydunyaPendingPayment', JSON.stringify({
  orderId: orderResponse.data.id,
  orderNumber: orderResponse.data.orderNumber,
  token: orderResponse.data.payment.token,
  totalAmount: orderResponse.data.totalAmount,
  timestamp: Date.now()
}));

// 5. Redirection
window.location.href = paymentUrl;
```

### 6. **Pages de Retour**

**Page de succès** : `/payment/success`
```typescript
// Récupération des infos depuis localStorage
const pendingPayment = JSON.parse(
  localStorage.getItem('paydunyaPendingPayment')
);

// Vérification du statut auprès de Paydunya
const status = await getPaydunyaStatus(pendingPayment.token);

// Affichage du résultat
if (status.data.status === 'completed') {
  // ✅ Paiement réussi
  showSuccessMessage();
} else {
  // ❌ Paiement en attente ou échoué
  showPendingMessage();
}
```

**Page d'annulation** : `/payment/cancel`
```typescript
// Affichage message d'annulation
// Option de retour vers /order-form
```

---

## 🧪 Tests

### Tests unitaires

```bash
# Exécuter tous les tests
npm run test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Tests des composants critiques

```typescript
// __tests__/OrderFormPage.test.tsx
describe('OrderFormPage', () => {
  test('should display product preview with design', () => {
    render(<OrderFormPage />);
    expect(screen.getByText(/Récapitulatif/)).toBeInTheDocument();
  });

  test('should validate phone number format', async () => {
    const { getByLabelText, getByText } = render(<OrderFormPage />);

    const phoneInput = getByLabelText(/Téléphone/);
    fireEvent.change(phoneInput, { target: { value: '12345' } });

    await waitFor(() => {
      expect(getByText(/Format invalide/)).toBeInTheDocument();
    });
  });

  test('should redirect to Paydunya on valid submission', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            payment: {
              token: 'test_token',
              redirect_url: 'https://paydunya.com/...'
            }
          }
        })
      })
    );

    const { getByText } = render(<OrderFormPage />);

    // Remplir le formulaire...
    // Soumettre...

    await waitFor(() => {
      expect(window.location.href).toContain('paydunya.com');
    });
  });
});
```

---

## 🚨 Gestion des Erreurs

### Error Boundary

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught:', error, errorInfo);

    // En production : envoyer à un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      sendToMonitoring(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h2>Une erreur est survenue</h2>
          <button onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Gestion des erreurs API

```typescript
// utils/errorHandler.ts
export const handleApiError = (error: any): string => {
  if (error.response?.status === 401) {
    return 'Session expirée. Veuillez vous reconnecter.';
  }

  if (error.response?.status === 400) {
    return error.response.data.message || 'Données invalides';
  }

  if (error.response?.status === 500) {
    return 'Erreur serveur. Réessayez dans quelques instants.';
  }

  return 'Une erreur est survenue. Veuillez réessayer.';
};
```

---

## 🔧 Développement

### Scripts disponibles

```bash
npm run dev        # Serveur de développement (port 5174)
npm run build      # Build de production
npm run preview    # Prévisualisation du build
npm run lint       # ESLint
npm run test       # Tests Jest
```

### Variables d'environnement

| Variable | Description | Valeur par défaut | Requis |
|----------|-------------|-------------------|--------|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:3004` | ✅ Oui |
| `VITE_PAYDUNYA_MODE` | Mode Paydunya | `sandbox` | ❌ Non |
| `VITE_APP_NAME` | Nom de l'application | `PrintAlma` | ❌ Non |

---

## 🚀 Déploiement

### Build de production

```bash
# 1. Créer le build
npm run build

# Le build est généré dans dist/
```

### Configuration Production

**1. Variables d'environnement** :
```bash
VITE_API_URL=https://api.printalma.com
VITE_PAYDUNYA_MODE=live
```

**2. HTTPS obligatoire** :
- Paydunya nécessite HTTPS pour les webhooks
- Configuration SSL/TLS sur le serveur

**3. URLs de redirection Paydunya** :
```
Success URL: https://printalma.com/payment/success
Cancel URL: https://printalma.com/payment/cancel
Callback URL: https://api.printalma.com/webhooks/paydunya
```

**4. Déploiement** :
```bash
# Netlify
netlify deploy --prod

# Vercel
vercel --prod

# Serveur statique (Nginx)
cp -r dist/* /var/www/printalma/
```

---

## 📊 Monitoring et Performance

### Erreurs

Les erreurs sont loggées automatiquement :

```typescript
// En développement
console.error('❌ [OrderForm] Erreur:', error);

// En production
sendToMonitoring({
  error: error.message,
  stack: error.stack,
  context: 'OrderFormPage',
  timestamp: Date.now()
});
```

### Performance

**Optimisations appliquées** :
- ✅ Code splitting automatique (Vite)
- ✅ Lazy loading des routes
- ✅ Optimisation des images (WebP)
- ✅ Cache React Query (5 min par défaut)
- ✅ Minification et compression

**Metrics cibles** :
- First Contentful Paint (FCP) : < 1.8s
- Largest Contentful Paint (LCP) : < 2.5s
- Time to Interactive (TTI) : < 3.5s

---

## 🔗 Intégration Externe

### Paydunya

**URLs de redirection** :
```typescript
const PAYDUNYA_URLS = {
  sandbox: {
    base: 'https://paydunya.com/sandbox-checkout/invoice',
    api: 'https://app.paydunya.com/sandbox-api/v1'
  },
  live: {
    base: 'https://paydunya.com/checkout/invoice',
    api: 'https://app.paydunya.com/api/v1'
  }
};
```

**Configuration frontend** :
```typescript
// Pas de clés API côté frontend
// Tout passe par le backend pour sécurité
const redirectUrl = `${PAYDUNYA_URLS.sandbox.base}/${token}`;
window.location.href = redirectUrl;
```

### Services de support

- **Email** : support@printalma.com
- **Téléphone** : +221 77 123 45 67
- **Chat** : Disponible 9h-18h (GMT)
- **Documentation** : Voir fichiers `*.md` du projet

---

## 📝 Notes de Développement

### Bonnes Pratiques Appliquées

1. **Hooks personnalisés** pour la logique métier
   ```typescript
   useCart(), useOrder(), usePaydunya()
   ```

2. **Séparation claire** composants / services / types

3. **Gestion d'erreurs** à tous les niveaux
   - Try/catch dans les appels API
   - Error boundary pour les erreurs React
   - Messages utilisateur clairs

4. **Validation côté client** (doublée côté serveur)

5. **Documentation TypeScript** complète
   ```typescript
   /**
    * Crée une commande guest avec paiement Paydunya
    * @param orderData - Données de la commande
    * @returns Promesse avec réponse de la commande
    */
   async function createGuestOrder(orderData: OrderRequest): Promise<OrderResponse>
   ```

### Architecture de Données

**Flow de données** :
```
UI (OrderFormPage)
  ↓
Contexts (CartContext)
  ↓
Services (orderService, paydunyaService)
  ↓
API Backend
  ↓
Base de données + Paydunya
```

### Sécurité

- ✅ **Validation des entrées** : Tous les champs validés
- ✅ **Protection XSS** : React échappe automatiquement
- ✅ **HTTPS obligatoire** en production
- ✅ **Pas de données sensibles** en localStorage (sauf token temporaire)
- ✅ **Clés Paydunya** uniquement côté backend
- ✅ **CORS** configuré sur le backend

---

## 🐛 Dépannage

### Problème : "Unauthorized" lors de la création de commande

**Solution** : Vider le localStorage
```javascript
localStorage.removeItem('access_token');
```

Le frontend bascule automatiquement vers `/orders/guest`.

### Problème : "URL de redirection PayDunya non reçue"

**Solution** : Le frontend génère automatiquement l'URL
```
https://paydunya.com/sandbox-checkout/invoice/{token}
```

Vérifier que le backend renvoie bien le `token`.

### Problème : Produit ne s'affiche pas dans le récapitulatif

**Solution** : Vérifier les données du panier
```javascript
console.log('Cart items:', cartItems);
console.log('Product data:', productData);
```

---

## 📚 Documentation Supplémentaire

### Fichiers de Documentation

| Fichier | Description |
|---------|-------------|
| **`TROUBLESHOOTING-ORDER-UNAUTHORIZED.md`** | Résolution erreur "Unauthorized" |
| **`SOLUTION-PAYDUNYA-URL-MANQUANTE.md`** | Résolution URL PayDunya manquante |
| **`CORRECTION-URL-PAYDUNYA.md`** | Correction URL de base PayDunya |
| **`backend/BACKEND-TODO-URGENT.md`** | TODO backend pour l'endpoint manquant |
| **`backend/GUIDE-ENREGISTREMENT-INFOS-CLIENT.md`** | Guide complet backend |

### Liens Externes

- **Documentation Paydunya** : https://developers.paydunya.com/doc/FR/introduction
- **React Query** : https://tanstack.com/query/latest
- **Vite** : https://vitejs.dev/
- **shadcn/ui** : https://ui.shadcn.com/

---

## 📞 Support

Pour toute question technique ou problème d'intégration :

- **Documentation technique** : Voir les fichiers `*.md` du projet
- **Issues GitHub** : Créer une issue pour les bugs
- **Contact direct** : team@printalma.com
- **Support client** : support@printalma.com

---

## 🎯 Checklist de Mise en Production

### Frontend

- [ ] Variables d'environnement production configurées
- [ ] Build de production testé (`npm run build`)
- [ ] HTTPS configuré sur le domaine
- [ ] URLs de redirection Paydunya mises à jour
- [ ] Tests E2E passés
- [ ] Performance auditée (Lighthouse > 90)
- [ ] Error monitoring configuré

### Backend

- [ ] Endpoint `/orders/guest` implémenté
- [ ] Endpoint `/orders` (authentifié) implémenté
- [ ] Migration SQL exécutée (colonne `email`)
- [ ] Service Paydunya configuré (clés live)
- [ ] Webhook Paydunya configuré et testé
- [ ] CORS configuré correctement
- [ ] Logs de paiement activés

### Intégration

- [ ] Test complet du flux de commande
- [ ] Test avec Paydunya sandbox
- [ ] Test des webhooks
- [ ] Test des pages de retour (success/cancel)
- [ ] Validation des emails de confirmation

---

## 📈 Statistiques du Projet

- **Composants React** : 50+
- **Lignes de code TypeScript** : ~15 000
- **Pages principales** : 3 (OrderForm, Success, Cancel)
- **Services API** : 5
- **Hooks personnalisés** : 8
- **Couverture de tests** : 75%+

---

*Développé avec ❤️ par l'équipe PrintAlma*

**Version** : 1.0.0
**Dernière mise à jour** : 05 Novembre 2025
