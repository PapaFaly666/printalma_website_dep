# Documentation Technique - Endpoint Statistiques Vendeur

## Vue d'ensemble

Ce document décrit l'architecture et l'implémentation de l'endpoint de statistiques pour les vendeurs sur la plateforme PrintAlma.

## Implémentation Frontend Actuelle

### Analyse du code existant (VendorSales.tsx)

Le frontend calcule actuellement les statistiques localement avec les limitations suivantes :

```typescript
// Calculs effectués côté frontend
const statistics = useMemo(() => {
  const paidOrders = orders.filter(order => order.paymentStatus === 'PAID');
  return {
    totalOrders: pagination?.total || 0,
    totalRevenue: paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    totalVendorEarnings: paidOrders.reduce((sum, order) => sum + (order.commission_info?.vendor_amount || 0), 0),
    pendingOrders: orders.filter(o => o.status === 'PENDING').length,
    processingOrders: orders.filter(o => o.status === 'PROCESSING').length,
    shippedOrders: orders.filter(o => o.status === 'SHIPPED').length,
    deliveredOrders: orders.filter(o => o.status === 'DELIVERED').length,
    cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length,
  };
}, [orders, pagination]);
```

### Problèmes identifiés

1. **Performance** : Calculs effectués côté client à chaque rendu
2. **Limitations** : Seules les commandes paginées sont analysées
3. **Incohérences** : Stats basées sur données partielles
4. **Maintenance** : Logique métier dispersée entre frontend et backend

## Architecture Backend Proposée

### Endpoint Principal

```
GET /vendor/orders/statistics
```

### Paramètres de Requête

| Paramètre | Type | Description | Valeur par défaut |
|-----------|------|-------------|-------------------|
| `period` | string | Période d'analyse (`today`, `week`, `month`, `quarter`, `year`, `all`) | `month` |
| `vendorId` | number | ID du vendeur (optionnel, utilise l'utilisateur connecté) | - |
| `cache` | boolean | Forcer le recalcul des stats (`false`) | `true` |
| `currency` | string | Devise des montants | `XOF` |

### Structure de Réponse

```json
{
  "success": true,
  "message": "Statistiques récupérées avec succès",
  "data": {
    // Statistiques de commandes
    "orderStats": {
      "totalOrders": 150,
      "pendingOrders": 12,
      "processingOrders": 8,
      "shippedOrders": 25,
      "deliveredOrders": 95,
      "cancelledOrders": 10,
      "failedPaymentOrders": 0
    },

    // Statistiques financières (uniquement commandes payées)
    "financialStats": {
      "totalRevenue": 1350000,
      "totalVendorEarnings": 945000,
      "totalCommission": 405000,
      "averageOrderValue": 9000,
      "averageCommission": 2700
    },

    // Statistiques temporelles
    "temporalStats": {
      "revenueThisPeriod": 180000,
      "ordersThisPeriod": 20,
      "revenueLastPeriod": 150000,
      "ordersLastPeriod": 15,
      "growthRate": 20,
      "periodComparison": {
        "period": "month",
        "currentPeriodStart": "2025-12-01T00:00:00.000Z",
        "currentPeriodEnd": "2025-12-31T23:59:59.999Z",
        "lastPeriodStart": "2025-11-01T00:00:00.000Z",
        "lastPeriodEnd": "2025-11-30T23:59:59.999Z"
      }
    },

    // Performance et tendances
    "performanceStats": {
      "conversionRate": 85.5,
      "averageProcessingTime": 48, // heures
      "averageDeliveryTime": 72, // heures
      "customerSatisfactionScore": 4.6,
      "repeatCustomers": 45
    },

    // Produits les plus vendus
    "topProducts": [
      {
        "productId": 1,
        "productName": "Tshirt de luxe",
        "totalSales": 50,
        "revenue": 450000,
        "percentage": 33.3
      }
    ],

    // Répartition par statut de paiement
    "paymentStatusBreakdown": {
      "PAID": {
        "count": 140,
        "amount": 1350000,
        "percentage": 93.3
      },
      "PENDING": {
        "count": 12,
        "amount": 108000,
        "percentage": 8.0
      },
      "FAILED": {
        "count": 0,
        "amount": 0,
        "percentage": 0.0
      }
    },

    // Métadonnées
    "metadata": {
      "lastUpdated": "2025-12-02T12:00:00.000Z",
      "calculationTime": 0.15,
      "dataSource": "database",
      "cacheExpiry": "2025-12-02T12:05:00.000Z",
      "totalOrdersAnalyzed": 150
    }
  }
}
```

## Implémentation Backend

### 1. Schéma de Base de Données

```sql
-- Table pour le cache des statistiques
CREATE TABLE vendor_statistics_cache (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES users(id),
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    statistics_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(vendor_id, period_type, period_start, period_end)
);

-- Index pour optimisation
CREATE INDEX idx_vendor_stats_cache_lookup ON vendor_statistics_cache(vendor_id, period_type, expires_at);
```

### 2. Service de Calcul des Statistiques

```javascript
// vendorStatisticsService.js
class VendorStatisticsService {

  async getVendorStatistics(vendorId, options = {}) {
    const {
      period = 'month',
      useCache = true,
      forceRefresh = false
    } = options;

    // Vérifier le cache
    if (useCache && !forceRefresh) {
      const cached = await this.getCachedStatistics(vendorId, period);
      if (cached && !this.isCacheExpired(cached)) {
        return cached;
      }
    }

    // Calculer les statistiques
    const statistics = await this.calculateStatistics(vendorId, period);

    // Mettre en cache
    if (useCache) {
      await this.cacheStatistics(vendorId, period, statistics);
    }

    return statistics;
  }

  async calculateStatistics(vendorId, period) {
    const { startDate, endDate, lastStartDate, lastEndDate } = this.getPeriodDates(period);

    // Récupérer toutes les commandes du vendeur
    const orders = await this.getAllVendorOrders(vendorId, startDate, endDate);
    const lastPeriodOrders = await this.getAllVendorOrders(vendorId, lastStartDate, lastEndDate);

    return {
      orderStats: this.calculateOrderStats(orders),
      financialStats: this.calculateFinancialStats(orders),
      temporalStats: await this.calculateTemporalStats(orders, lastPeriodOrders, period),
      performanceStats: await this.calculatePerformanceStats(orders),
      topProducts: await this.getTopProducts(orders),
      paymentStatusBreakdown: this.calculatePaymentStats(orders),
      metadata: {
        lastUpdated: new Date().toISOString(),
        calculationTime: 0, // À mesurer
        dataSource: 'database',
        totalOrdersAnalyzed: orders.length
      }
    };
  }

  calculateOrderStats(orders) {
    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'PENDING').length,
      processingOrders: orders.filter(o => o.status === 'PROCESSING').length,
      shippedOrders: orders.filter(o => o.status === 'SHIPPED').length,
      deliveredOrders: orders.filter(o => o.status === 'DELIVERED').length,
      cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length,
      failedPaymentOrders: orders.filter(o => o.paymentStatus === 'FAILED').length
    };
  }

  calculateFinancialStats(orders) {
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');

    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalVendorEarnings = paidOrders.reduce((sum, order) =>
      sum + (order.commission_info?.vendor_amount || 0), 0);
    const totalCommission = paidOrders.reduce((sum, order) =>
      sum + (order.commission_info?.commission_amount || 0), 0);

    return {
      totalRevenue,
      totalVendorEarnings,
      totalCommission,
      averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
      averageCommission: paidOrders.length > 0 ? totalCommission / paidOrders.length : 0
    };
  }

  async calculateTemporalStats(currentOrders, lastPeriodOrders, period) {
    const currentRevenue = currentOrders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const lastRevenue = lastPeriodOrders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const revenueGrowth = lastRevenue > 0 ?
      ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    return {
      revenueThisPeriod: currentRevenue,
      ordersThisPeriod: currentOrders.length,
      revenueLastPeriod: lastRevenue,
      ordersLastPeriod: lastPeriodOrders.length,
      growthRate: Math.round(revenueGrowth * 100) / 100,
      periodComparison: this.getPeriodComparison(period)
    };
  }

  calculatePaymentStats(orders) {
    const stats = {};
    const totalOrders = orders.length;

    // Grouper par statut de paiement
    orders.forEach(order => {
      const status = order.paymentStatus || 'UNKNOWN';
      if (!stats[status]) {
        stats[status] = { count: 0, amount: 0 };
      }
      stats[status].count++;
      stats[status].amount += order.totalAmount || 0;
    });

    // Calculer les pourcentages
    Object.keys(stats).forEach(status => {
      stats[status].percentage = totalOrders > 0 ?
        Math.round((stats[status].count / totalOrders) * 1000) / 10 : 0;
    });

    return stats;
  }

  getPeriodDates(period) {
    const now = new Date();
    let startDate, endDate, lastStartDate, lastEndDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        lastStartDate = new Date(startDate);
        lastStartDate.setDate(lastStartDate.getDate() - 1);
        lastEndDate = startDate;
        break;

      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
        lastStartDate = new Date(startDate);
        lastStartDate.setDate(lastStartDate.getDate() - 7);
        lastEndDate = startDate;
        break;

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        lastStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        lastEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      // ... autres périodes
    }

    return { startDate, endDate, lastStartDate, lastEndDate };
  }
}
```

### 3. Controller API

```javascript
// vendorStatisticsController.js
class VendorStatisticsController {

  async getStatistics(req, res) {
    try {
      const { period = 'month', cache = 'true', currency = 'XOF' } = req.query;
      const vendorId = req.user.id; // Récupéré du middleware d'auth

      const statisticsService = new VendorStatisticsService();
      const statistics = await statisticsService.getVendorStatistics(vendorId, {
        period,
        useCache: cache === 'true',
        forceRefresh: cache === 'false'
      });

      return res.status(200).json({
        success: true,
        message: 'Statistiques récupérées avec succès',
        data: statistics
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}
```

### 4. Route Configuration

```javascript
// routes/vendor.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const vendorStatisticsController = require('../controllers/vendorStatisticsController');

// Toutes les routes nécessitent une authentification vendeur
router.use(authMiddleware);

router.get('/orders/statistics', vendorStatisticsController.getStatistics);

module.exports = router;
```

## Migration du Frontend

### 1. Remplacement des calculs locaux

```typescript
// Dans VendorSales.tsx
const [statistics, setStatistics] = useState(null);
const [loadingStats, setLoadingStats] = useState(true);

// Remplacer le useMemo par un appel API
useEffect(() => {
  loadVendorStatistics();
}, [statusFilter, dateFilter]);

const loadVendorStatistics = async () => {
  try {
    setLoadingStats(true);
    const response = await fetch('/vendor/orders/statistics?period=month&cache=true');
    const data = await response.json();

    if (data.success) {
      setStatistics(data.data);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    toast.error('Erreur lors du chargement des statistiques');
  } finally {
    setLoadingStats(false);
  }
};

// Utiliser les statistiques dans le rendu
<div className="text-2xl font-bold text-gray-900">
  {loadingStats ? '...' : formatAmount(statistics?.financialStats?.totalRevenue || 0)}
</div>
```

## Avantages de cette Architecture

### 1. **Performance**
- Calculs effectués côté serveur
- Mise en cache intelligente
- Réduction de la charge client

### 2. **Cohérence**
- Source de vérité unique
- Statistiques basées sur 100% des données
- Logique métier centralisée

### 3. **Scalabilité**
- Gestion optimisée des grandes volumes de données
- Cache distribué possible
- Calculs asynchrones

### 4. **Maintenance**
- Code backend centralisé
- Facile à maintenir et faire évoluer
- Tests automatisés possibles

## Plan de Migration

1. **Phase 1**: Créer l'endpoint backend
2. **Phase 2**: Mettre en place le système de cache
3. **Phase 3**: Mettre à jour le frontend progressivement
4. **Phase 4**: Supprimer les calculs côté client
5. **Phase 5**: Optimisation et monitoring

## Monitoring et Métriques

### KPIs à surveiller

- Temps de réponse de l'endpoint
- Taux de hit du cache
- Fréquence de recalcul
- Performance des requêtes SQL
- Utilisation mémoire serveur

### Alertes

- Temps de réponse > 2 secondes
- Taux d'erreur > 5%
- Cache vide fréquent
- Requêtes trop longues