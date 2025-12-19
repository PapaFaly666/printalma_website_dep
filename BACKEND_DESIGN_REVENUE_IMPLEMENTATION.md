# Documentation Backend - Système de Revenus des Designs Vendeur

## Vue d'ensemble

Ce document décrit l'implémentation backend nécessaire pour permettre aux vendeurs de recevoir des paiements lorsque leurs designs sont utilisés dans les personnalisations de produits clients.

## Architecture du Système

### 1. Modèles de Base de Données

#### Table: `design_usages`
Enregistre chaque utilisation d'un design dans une commande.

```sql
CREATE TABLE design_usages (
  id SERIAL PRIMARY KEY,
  design_id INT NOT NULL REFERENCES designs(id),
  order_id INT NOT NULL REFERENCES orders(id),
  order_item_id INT NOT NULL REFERENCES order_items(id),
  customization_id INT REFERENCES customizations(id),
  vendor_id INT NOT NULL REFERENCES users(id),
  customer_id INT NOT NULL REFERENCES users(id),

  -- Informations financières
  design_price DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 70.00, -- Pourcentage
  vendor_revenue DECIMAL(10, 2) NOT NULL, -- Prix * (commission_rate / 100)
  platform_fee DECIMAL(10, 2) NOT NULL, -- Prix * ((100 - commission_rate) / 100)

  -- Statut du paiement
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- PENDING: En attente (commande non confirmée)
  -- CONFIRMED: Confirmé (commande confirmée)
  -- READY_FOR_PAYOUT: Prêt pour paiement (commande livrée + délai écoulé)
  -- PAID: Payé au vendeur
  -- CANCELLED: Annulé (commande annulée)

  -- Dates importantes
  used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  ready_for_payout_at TIMESTAMP,
  paid_at TIMESTAMP,

  -- Métadonnées
  product_name VARCHAR(255),
  product_category VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_design_id (design_id),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_order_id (order_id)
);
```

#### Table: `vendor_payouts`
Gère les demandes et historique de paiements aux vendeurs.

```sql
CREATE TABLE vendor_payouts (
  id SERIAL PRIMARY KEY,
  vendor_id INT NOT NULL REFERENCES users(id),

  -- Montant
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- PENDING: Demande en attente
  -- PROCESSING: En cours de traitement
  -- COMPLETED: Payé
  -- FAILED: Échec
  -- CANCELLED: Annulé

  -- Informations bancaires
  bank_account_id INT NOT NULL REFERENCES vendor_bank_accounts(id),
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_holder_name VARCHAR(255),

  -- Traçabilité
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Référence de transaction
  transaction_reference VARCHAR(100),
  payment_method VARCHAR(50), -- BANK_TRANSFER, MOBILE_MONEY, etc.

  -- Notes et raisons d'échec
  notes TEXT,
  failure_reason TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_vendor_id (vendor_id),
  INDEX idx_status (status),
  INDEX idx_requested_at (requested_at)
);
```

#### Table: `vendor_bank_accounts`
Stocke les informations bancaires des vendeurs.

```sql
CREATE TABLE vendor_bank_accounts (
  id SERIAL PRIMARY KEY,
  vendor_id INT NOT NULL REFERENCES users(id),

  -- Informations bancaires
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  bank_code VARCHAR(20),
  branch_code VARCHAR(20),
  iban VARCHAR(50),
  swift_code VARCHAR(20),

  -- Type de compte
  account_type VARCHAR(50), -- CHECKING, SAVINGS, MOBILE_MONEY
  mobile_money_provider VARCHAR(50), -- ORANGE_MONEY, WAVE, etc.

  -- Vérification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,

  -- Compte par défaut
  is_default BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_vendor_id (vendor_id),
  UNIQUE INDEX idx_vendor_default (vendor_id, is_default) WHERE is_default = TRUE
);
```

#### Table: `design_revenue_settings`
Paramètres de commission et paiement.

```sql
CREATE TABLE design_revenue_settings (
  id SERIAL PRIMARY KEY,

  -- Taux de commission (pourcentage)
  default_commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 70.00,

  -- Montant minimum de retrait
  minimum_payout_amount DECIMAL(10, 2) NOT NULL DEFAULT 10000.00, -- 10 000 FCFA

  -- Délai avant disponibilité du paiement (en jours)
  payout_delay_days INT NOT NULL DEFAULT 7,

  -- Calendrier de paiement
  payout_schedule VARCHAR(50) DEFAULT 'ON_DEMAND', -- ON_DEMAND, WEEKLY, MONTHLY

  -- Actif/Inactif
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 2. API Endpoints

### 2.1 Statistiques de Revenus

**GET** `/api/vendor/design-revenues/stats`

Retourne les statistiques globales de revenus pour le vendeur connecté.

**Query Parameters:**
- `period` (optional): `week` | `month` | `year` | `all` (défaut: `month`)

**Response:**
```json
{
  "totalRevenue": 125000,
  "pendingRevenue": 35000,
  "completedRevenue": 90000,
  "totalUsages": 45,
  "uniqueDesignsUsed": 8,
  "averageRevenuePerDesign": 15625,
  "topDesigns": [
    {
      "designId": 101,
      "designName": "Logo Entreprise Premium",
      "revenue": 48000,
      "usages": 12
    }
  ]
}
```

**Logique Backend:**
```javascript
async getRevenueStats(vendorId, period) {
  // Déterminer la date de début selon la période
  const startDate = calculateStartDate(period);

  // Requête SQL
  const stats = await db.query(`
    SELECT
      SUM(vendor_revenue) as total_revenue,
      SUM(CASE WHEN payment_status IN ('PENDING', 'CONFIRMED') THEN vendor_revenue ELSE 0 END) as pending_revenue,
      SUM(CASE WHEN payment_status = 'PAID' THEN vendor_revenue ELSE 0 END) as completed_revenue,
      COUNT(*) as total_usages,
      COUNT(DISTINCT design_id) as unique_designs_used,
      AVG(vendor_revenue) as average_revenue
    FROM design_usages
    WHERE vendor_id = ? AND used_at >= ? AND payment_status != 'CANCELLED'
  `, [vendorId, startDate]);

  // Top designs
  const topDesigns = await db.query(`
    SELECT
      du.design_id,
      d.name as design_name,
      SUM(du.vendor_revenue) as revenue,
      COUNT(*) as usages
    FROM design_usages du
    JOIN designs d ON d.id = du.design_id
    WHERE du.vendor_id = ? AND du.used_at >= ? AND du.payment_status != 'CANCELLED'
    GROUP BY du.design_id, d.name
    ORDER BY revenue DESC
    LIMIT 5
  `, [vendorId, startDate]);

  return { ...stats, topDesigns };
}
```

---

### 2.2 Liste des Designs avec Revenus

**GET** `/api/vendor/design-revenues/designs`

Retourne la liste des designs du vendeur avec leurs revenus.

**Query Parameters:**
- `period` (optional): `week` | `month` | `year` | `all`
- `sortBy` (optional): `revenue` | `usage` | `recent`
- `search` (optional): Recherche par nom de design

**Response:**
```json
[
  {
    "id": 1,
    "designId": 101,
    "designName": "Logo Entreprise Premium",
    "designImage": "https://...",
    "designPrice": 4000,
    "totalUsages": 12,
    "totalRevenue": 33600,
    "pendingRevenue": 8400,
    "completedRevenue": 25200,
    "lastUsedAt": "2025-01-10T14:30:00Z"
  }
]
```

---

### 2.3 Historique d'Utilisation d'un Design

**GET** `/api/vendor/design-revenues/designs/:designId/history`

Retourne l'historique détaillé des utilisations d'un design.

**Response:**
```json
[
  {
    "id": 1,
    "orderId": 1001,
    "orderNumber": "ORD-2025-001",
    "customerName": "Jean Dupont",
    "productName": "T-Shirt Premium",
    "usedAt": "2025-01-10T14:30:00Z",
    "designPrice": 4000,
    "commissionRate": 70,
    "revenue": 2800,
    "status": "PAID"
  }
]
```

---

### 2.4 Demander un Paiement

**POST** `/api/vendor/design-revenues/payout`

Permet au vendeur de demander un retrait de ses revenus.

**Request Body:**
```json
{
  "amount": 50000,
  "bankAccountId": 1
}
```

**Validations:**
- Montant >= minimum_payout_amount
- Montant <= solde disponible du vendeur
- Compte bancaire vérifié
- Pas de demande en cours

**Response:**
```json
{
  "id": 123,
  "amount": 50000,
  "status": "PENDING",
  "requestedAt": "2025-01-15T10:00:00Z",
  "estimatedProcessingTime": "2-3 jours ouvrables"
}
```

---

### 2.5 Historique des Paiements

**GET** `/api/vendor/design-revenues/payouts`

Retourne l'historique des demandes de paiement.

**Response:**
```json
[
  {
    "id": 123,
    "amount": 50000,
    "status": "COMPLETED",
    "requestedAt": "2025-01-10T10:00:00Z",
    "completedAt": "2025-01-12T15:30:00Z",
    "bankAccount": {
      "bankName": "Ecobank",
      "accountNumber": "****1234"
    },
    "transactionReference": "TXN-2025-001"
  }
]
```

---

## 3. Processus de Suivi des Revenus

### 3.1 Enregistrement d'une Utilisation de Design

Lorsqu'une commande est créée avec une personnalisation utilisant un design vendeur :

```javascript
async recordDesignUsage(order, orderItem, customization) {
  // Récupérer les designs utilisés depuis customization.designElements
  const designElements = customization.designElements || [];

  for (const element of designElements) {
    if (element.type === 'image' && element.designId && element.designPrice > 0) {
      const design = await Design.findById(element.designId);

      if (design && design.vendorId) {
        // Récupérer les paramètres de commission
        const settings = await DesignRevenueSettings.findOne({ is_active: true });
        const commissionRate = settings?.default_commission_rate || 70;

        // Calculer les revenus
        const designPrice = element.designPrice;
        const vendorRevenue = designPrice * (commissionRate / 100);
        const platformFee = designPrice * ((100 - commissionRate) / 100);

        // Enregistrer l'utilisation
        await DesignUsage.create({
          design_id: element.designId,
          order_id: order.id,
          order_item_id: orderItem.id,
          customization_id: customization.id,
          vendor_id: design.vendorId,
          customer_id: order.userId,
          design_price: designPrice,
          commission_rate: commissionRate,
          vendor_revenue: vendorRevenue,
          platform_fee: platformFee,
          payment_status: 'PENDING',
          used_at: new Date(),
          product_name: orderItem.productName,
          product_category: orderItem.category
        });

        console.log(`✅ Design usage recorded: Design ${element.designId}, Revenue ${vendorRevenue}`);
      }
    }
  }
}
```

---

### 3.2 Mise à Jour du Statut de Paiement

Les statuts de paiement évoluent selon le cycle de vie de la commande :

```javascript
// Lorsque la commande est confirmée (paiement client validé)
async onOrderConfirmed(orderId) {
  await DesignUsage.updateMany(
    { order_id: orderId, payment_status: 'PENDING' },
    {
      payment_status: 'CONFIRMED',
      confirmed_at: new Date()
    }
  );
}

// Lorsque la commande est livrée
async onOrderDelivered(orderId) {
  const settings = await DesignRevenueSettings.findOne({ is_active: true });
  const delayDays = settings?.payout_delay_days || 7;

  const readyForPayoutDate = new Date();
  readyForPayoutDate.setDate(readyForPayoutDate.getDate() + delayDays);

  await DesignUsage.updateMany(
    { order_id: orderId, payment_status: 'CONFIRMED' },
    {
      payment_status: 'READY_FOR_PAYOUT',
      ready_for_payout_at: readyForPayoutDate
    }
  );
}

// Lorsque la commande est annulée
async onOrderCancelled(orderId) {
  await DesignUsage.updateMany(
    { order_id: orderId, payment_status: { $in: ['PENDING', 'CONFIRMED'] } },
    {
      payment_status: 'CANCELLED'
    }
  );
}
```

---

### 3.3 Traitement des Paiements Vendeur

Job automatique qui s'exécute quotidiennement :

```javascript
async processPendingPayouts() {
  const now = new Date();

  // Récupérer les demandes de paiement en attente
  const pendingPayouts = await VendorPayout.find({
    status: 'PENDING',
    requested_at: { $lte: now }
  });

  for (const payout of pendingPayouts) {
    try {
      // Mettre à jour le statut
      payout.status = 'PROCESSING';
      await payout.save();

      // Effectuer le paiement via le service de paiement
      const paymentResult = await paymentService.sendBankTransfer({
        amount: payout.amount,
        bankAccount: payout.bank_account_id,
        reference: `PAYOUT-${payout.id}`
      });

      if (paymentResult.success) {
        // Marquer comme complété
        payout.status = 'COMPLETED';
        payout.completed_at = new Date();
        payout.transaction_reference = paymentResult.transactionId;
        await payout.save();

        // Marquer les usages correspondants comme payés
        await DesignUsage.updateMany(
          {
            vendor_id: payout.vendor_id,
            payment_status: 'READY_FOR_PAYOUT',
            ready_for_payout_at: { $lte: now }
          },
          {
            payment_status: 'PAID',
            paid_at: new Date()
          }
        );

        // Envoyer notification au vendeur
        await notificationService.sendPayoutCompletedEmail(payout);

      } else {
        payout.status = 'FAILED';
        payout.failure_reason = paymentResult.error;
        await payout.save();
      }

    } catch (error) {
      console.error(`Erreur traitement payout ${payout.id}:`, error);
      payout.status = 'FAILED';
      payout.failure_reason = error.message;
      await payout.save();
    }
  }
}
```

---

## 4. Calcul du Solde Disponible

Le solde disponible du vendeur = tous les revenus `READY_FOR_PAYOUT` qui ne sont pas déjà inclus dans une demande de paiement en cours :

```javascript
async getAvailableBalance(vendorId) {
  const result = await DesignUsage.aggregate([
    {
      $match: {
        vendor_id: vendorId,
        payment_status: 'READY_FOR_PAYOUT',
        ready_for_payout_at: { $lte: new Date() }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$vendor_revenue' }
      }
    }
  ]);

  return result[0]?.total || 0;
}
```

---

## 5. Notifications

### 5.1 Notifications Vendeur

- **Nouveau revenu** : Lorsqu'un client utilise son design
- **Revenu prêt** : Lorsque des revenus deviennent disponibles pour retrait
- **Paiement effectué** : Lorsqu'un paiement est complété
- **Paiement échoué** : En cas d'échec de paiement

### 5.2 Templates Email

**Nouveau Revenu :**
```
Sujet: 💰 Nouveau revenu de design !

Bonjour {vendorName},

Félicitations ! Votre design "{designName}" vient d'être utilisé dans une commande.

Revenu: {revenue} FCFA
Commande: {orderNumber}
Client: {customerName}

Ce revenu sera disponible pour retrait après livraison de la commande.

Cordialement,
L'équipe PrintAlma
```

---

## 6. Sécurité et Validation

### 6.1 Authentification
- Toutes les routes doivent vérifier que l'utilisateur est un vendeur
- Vérifier que le vendeur accède uniquement à ses propres données

### 6.2 Validation des Demandes de Paiement
- Montant >= minimum configuré
- Solde disponible suffisant
- Compte bancaire vérifié
- Pas de demande en cours
- Limites de retrait quotidiennes/mensuelles

### 6.3 Prévention de Fraude
- Détecter les patterns suspects (multiples petites commandes, annulations répétées)
- Vérifier l'authenticité des designs
- Système de signalement pour designs inappropriés

---

## 7. Tests à Implémenter

### 7.1 Tests Unitaires
```javascript
describe('DesignRevenueService', () => {
  it('should record design usage when order is created', async () => {
    // Test
  });

  it('should calculate correct commission based on rate', async () => {
    // Test
  });

  it('should update payment status when order is confirmed', async () => {
    // Test
  });

  it('should process payout request correctly', async () => {
    // Test
  });
});
```

### 7.2 Tests d'Intégration
- Flux complet: commande → confirmation → livraison → paiement
- Gestion des annulations
- Traitement automatique des paiements

---

## 8. Monitoring et Rapports

### 8.1 Métriques à Suivre
- Revenus totaux générés par les designs
- Taux de conversion (designs vus vs utilisés)
- Temps moyen de paiement
- Taux de succès des paiements
- Designs les plus rentables

### 8.2 Tableaux de Bord Admin
- Vue d'ensemble des revenus vendeurs
- Paiements en attente
- Historique des transactions
- Rapports financiers

---

## 9. Évolutions Futures

- **Tarification dynamique** : Permettre aux vendeurs de définir leurs propres prix
- **Promotions** : Réductions temporaires sur certains designs
- **Abonnements** : Forfaits mensuels pour accès illimité aux designs
- **Marketplace** : Plateforme publique de vente de designs
- **Analytics avancés** : Insights sur l'utilisation des designs
- **Référencement** : Programme de parrainage entre vendeurs

---

## 10. Configuration Recommandée

```javascript
// config/design-revenue.js
module.exports = {
  commission: {
    defaultRate: 70, // 70% pour le vendeur
    minimumPayout: 10000, // 10 000 FCFA
    payoutDelayDays: 7, // 7 jours après livraison
  },

  limits: {
    dailyPayoutLimit: 500000, // 500 000 FCFA par jour
    monthlyPayoutLimit: 5000000, // 5 000 000 FCFA par mois
  },

  paymentMethods: ['BANK_TRANSFER', 'MOBILE_MONEY'],

  notifications: {
    newRevenue: true,
    revenueReady: true,
    payoutCompleted: true,
    payoutFailed: true
  }
};
```

---

## Support et Contact

Pour toute question sur l'implémentation, contactez l'équipe de développement backend.
