# 🔧 Guide Backend - Système d'Appel de Fonds Vendeur

## 🎯 Problème à Résoudre

Le frontend est entièrement fonctionnel avec fallback mock, mais nécessite une connexion backend pour :
- Récupérer les vrais gains vendeur
- Créer et gérer les demandes d'appel de fonds
- Permettre aux admins d'approuver/rejeter les demandes

## 📊 Base de Données - Tables Requises

### Table `vendor_funds_requests`
```sql
CREATE TABLE vendor_funds_requests (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER')),
    phone_number VARCHAR(20),
    bank_account VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
    reject_reason TEXT,
    admin_note TEXT,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_date TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_vendor_funds_requests_vendor_id ON vendor_funds_requests(vendor_id);
CREATE INDEX idx_vendor_funds_requests_status ON vendor_funds_requests(status);
CREATE INDEX idx_vendor_funds_requests_request_date ON vendor_funds_requests(request_date);
```

### Vue pour les gains vendeur
```sql
CREATE OR REPLACE VIEW vendor_earnings_view AS
SELECT
    v.id as vendor_id,
    COALESCE(SUM(oi.total_price * v.commission_rate), 0) as total_earnings,
    COALESCE(SUM(oi.total_price * v.commission_rate), 0) -
    COALESCE(
        (SELECT SUM(amount) FROM vendor_funds_requests
         WHERE vendor_id = v.id AND status IN ('APPROVED', 'PAID')), 0
    ) as available_amount,
    COALESCE(
        (SELECT SUM(amount) FROM vendor_funds_requests
         WHERE vendor_id = v.id AND status = 'PENDING'), 0
    ) as pending_amount,
    COALESCE(
        (SELECT SUM(oi.total_price * v.commission_rate)
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.vendor_id = v.id
         AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0
    ) as this_month_earnings
FROM users v
LEFT JOIN order_items oi ON v.id = oi.vendor_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE v.role = 'vendeur'
GROUP BY v.id;
```

## 🔌 Endpoints API Requis

### 1. Endpoints Vendeur

#### `GET /api/vendor/earnings`
Récupère les gains du vendeur connecté
```javascript
// Response
{
  "success": true,
  "data": {
    "totalEarnings": 182500,
    "availableAmount": 159000,
    "pendingAmount": 23500,
    "thisMonthEarnings": 182500,
    "lastMonthEarnings": 156000,
    "commissionPaid": 18250,
    "totalCommission": 20075,
    "averageCommissionRate": 0.10
  }
}
```

#### `POST /api/vendor/funds-requests`
Créer une nouvelle demande d'appel de fonds
```javascript
// Request Body
{
  "amount": 50000,
  "paymentMethod": "WAVE",
  "phoneNumber": "+221771234567"
}

// Response
{
  "success": true,
  "data": {
    "id": 123,
    "amount": 50000,
    "status": "PENDING",
    "requestDate": "2025-01-15T10:30:00Z"
  }
}
```

#### `GET /api/vendor/funds-requests`
Récupère les demandes du vendeur avec pagination
```javascript
// Query params: ?page=1&limit=10&status=PENDING

// Response
{
  "success": true,
  "data": {
    "requests": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### 2. Endpoints Admin

#### `GET /api/admin/funds-requests`
Récupère toutes les demandes pour l'admin
```javascript
// Query params: ?page=1&limit=20&status=PENDING&vendor_id=123

// Response
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": 123,
        "vendorId": 456,
        "vendor": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "amount": 50000,
        "paymentMethod": "WAVE",
        "phoneNumber": "+221771234567",
        "status": "PENDING",
        "requestDate": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

#### `PATCH /api/admin/funds-requests/:id/process`
Traiter une demande (approuver/rejeter/marquer comme payé)
```javascript
// Request Body
{
  "action": "approve", // "approve", "reject", "mark_paid"
  "adminNote": "Demande approuvée",
  "rejectReason": null // Requis si action = "reject"
}

// Response
{
  "success": true,
  "data": {
    "id": 123,
    "status": "APPROVED",
    "processedDate": "2025-01-15T11:00:00Z",
    "adminNote": "Demande approuvée"
  }
}
```

#### `GET /api/admin/funds-requests/statistics`
Statistiques pour le dashboard admin
```javascript
// Response
{
  "success": true,
  "data": {
    "pendingRequests": 12,
    "pendingAmount": 580000,
    "processedToday": 5,
    "avgProcessingTime": 2.3, // en heures
    "statusBreakdown": {
      "PENDING": 12,
      "APPROVED": 25,
      "PAID": 18,
      "REJECTED": 3
    },
    "methodBreakdown": {
      "WAVE": 35,
      "ORANGE_MONEY": 18,
      "BANK_TRANSFER": 5
    }
  }
}
```

## 🔧 Implémentation Backend - Exemples

### Controller Vendeur (Node.js/Express)
```javascript
// controllers/vendorFundsController.js
const VendorFundsService = require('../services/vendorFundsService');

exports.getEarnings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const earnings = await VendorFundsService.getVendorEarnings(vendorId);

    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des gains',
      error: error.message
    });
  }
};

exports.createFundsRequest = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { amount, paymentMethod, phoneNumber, bankAccount } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant invalide'
      });
    }

    // Vérifier le solde disponible
    const earnings = await VendorFundsService.getVendorEarnings(vendorId);
    if (amount > earnings.availableAmount) {
      return res.status(400).json({
        success: false,
        message: 'Montant supérieur au solde disponible'
      });
    }

    const request = await VendorFundsService.createFundsRequest({
      vendorId,
      amount,
      paymentMethod,
      phoneNumber,
      bankAccount
    });

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la demande',
      error: error.message
    });
  }
};
```

### Service Layer
```javascript
// services/vendorFundsService.js
const db = require('../config/database');

class VendorFundsService {

  static async getVendorEarnings(vendorId) {
    const query = `
      SELECT
        total_earnings,
        available_amount,
        pending_amount,
        this_month_earnings
      FROM vendor_earnings_view
      WHERE vendor_id = $1
    `;

    const result = await db.query(query, [vendorId]);

    if (result.rows.length === 0) {
      return {
        totalEarnings: 0,
        availableAmount: 0,
        pendingAmount: 0,
        thisMonthEarnings: 0,
        lastMonthEarnings: 0,
        commissionPaid: 0,
        totalCommission: 0,
        averageCommissionRate: 0.10
      };
    }

    return result.rows[0];
  }

  static async createFundsRequest(data) {
    const query = `
      INSERT INTO vendor_funds_requests
      (vendor_id, amount, payment_method, phone_number, bank_account)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.vendorId,
      data.amount,
      data.paymentMethod,
      data.phoneNumber,
      data.bankAccount
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async getVendorRequests(vendorId, { page = 1, limit = 10, status = null }) {
    let query = `
      SELECT * FROM vendor_funds_requests
      WHERE vendor_id = $1
    `;
    let params = [vendorId];

    if (status && status !== 'all') {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY request_date DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, (page - 1) * limit);

    const result = await db.query(query, params);

    // Count total
    const countQuery = `
      SELECT COUNT(*) FROM vendor_funds_requests
      WHERE vendor_id = $1 ${status && status !== 'all' ? 'AND status = $2' : ''}
    `;
    const countParams = status && status !== 'all' ? [vendorId, status] : [vendorId];
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return {
      requests: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1
      }
    };
  }
}

module.exports = VendorFundsService;
```

## 🚀 Étapes d'Intégration

### 1. Setup Initial
```bash
# Créer les tables
psql -d votre_db -f create_funds_tables.sql

# Ajouter les colonnes manquantes si nécessaire
ALTER TABLE users ADD COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.10;
ALTER TABLE order_items ADD COLUMN vendor_id INTEGER REFERENCES users(id);
```

### 2. Configuration Routes
```javascript
// routes/vendor.js
const express = require('express');
const vendorFundsController = require('../controllers/vendorFundsController');
const { authenticateVendor } = require('../middleware/auth');

const router = express.Router();

router.get('/earnings', authenticateVendor, vendorFundsController.getEarnings);
router.post('/funds-requests', authenticateVendor, vendorFundsController.createFundsRequest);
router.get('/funds-requests', authenticateVendor, vendorFundsController.getFundsRequests);

module.exports = router;
```

### 3. Test des Endpoints
```bash
# Test récupération gains
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3004/api/vendor/earnings

# Test création demande
curl -X POST \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"amount":50000,"paymentMethod":"WAVE","phoneNumber":"+221771234567"}' \
     http://localhost:3004/api/vendor/funds-requests
```

## 🔐 Sécurité et Validations

### Validations Backend
- Vérifier l'authentification vendeur
- Valider les montants (positifs, <= solde disponible)
- Sanitiser les numéros de téléphone
- Rate limiting sur les créations de demandes
- Logs d'audit pour toutes les actions admin

### Permissions
- Vendeurs : accès seulement à leurs propres données
- Admins : accès à toutes les demandes
- Validation des transitions de statut (PENDING → APPROVED → PAID)

## 📈 Monitoring et Analytics

### Métriques à Tracker
- Temps moyen de traitement des demandes
- Taux d'approbation/rejet
- Volume de demandes par méthode de paiement
- Montants moyens demandés

### Logs Importants
```javascript
// Exemple de logging
logger.info('Funds request created', {
  vendorId,
  amount,
  paymentMethod,
  requestId: result.id
});
```

## 🎯 Points d'Attention

1. **Cohérence des Données** : S'assurer que les calculs de gains sont identiques entre frontend et backend
2. **Gestion des Concurrences** : Gérer les cas où un vendeur crée plusieurs demandes rapidement
3. **Notifications** : Implémenter des notifications email/SMS pour les changements de statut
4. **Backup des Données** : Sauvegarder régulièrement les données sensibles de paiement

---

✅ **Une fois le backend implémenté selon ce guide, le frontend se connectera automatiquement et cessera d'utiliser les données mock.**