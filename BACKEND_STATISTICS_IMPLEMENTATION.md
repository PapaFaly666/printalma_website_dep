# Implémentation Backend - Statistiques Vendeur

## Endpoint Actuel

D'après votre curl test, l'endpoint actuel est :
```
GET http://localhost:3004/vendor/orders/statistics
```

## Analyse de la Réponse Actuelle

```json
{
  "success": true,
  "message": "Statistiques récupérées",
  "data": {
    "totalOrders": 7,
    "totalRevenue": 63000,
    "averageOrderValue": 9000,
    "monthlyGrowth": 100,
    "pendingOrders": 3,
    "processingOrders": 0,
    "shippedOrders": 0,
    "deliveredOrders": 1,
    "cancelledOrders": 0,
    "revenueThisMonth": 63000,
    "ordersThisMonth": 7,
    "revenueLastMonth": 0,
    "ordersLastMonth": 0
  }
}
```

### Problèmes identifiés dans l'implémentation actuelle

1. **Manque de filtre sur le statut de paiement** : Les revenus incluent peut-être des commandes non payées
2. **Absence des gains du vendeur** : `totalVendorEarnings` manquant
3. **Pas de distinction par statut de paiement** : Ventilation PAID/PENDING/FAILED
4. **Métadonnées manquantes** : Date de calcul, période, etc.

## Implémentation Corrigée Suggérée

### 1. Controller Amélioré

```javascript
// controllers/vendorStatisticsController.js
const db = require('../config/database');
const { Op } = require('sequelize');

class VendorStatisticsController {

  async getStatistics(req, res) {
    try {
      const vendorId = req.user.id;
      const { period = 'month' } = req.query;

      // Déterminer les périodes de comparaison
      const { currentPeriod, lastPeriod } = this.getPeriodRanges(period);

      // Récupérer toutes les commandes du vendeur pour les périodes actuelles et passées
      const [currentOrders, lastOrders] = await Promise.all([
        this.getVendorOrders(vendorId, currentPeriod.start, currentPeriod.end),
        this.getVendorOrders(vendorId, lastPeriod.start, lastPeriod.end)
      ]);

      // Calculer les statistiques
      const statistics = await this.calculateDetailedStatistics(currentOrders, lastOrders, currentPeriod);

      return res.json({
        success: true,
        message: 'Statistiques récupérées avec succès',
        data: statistics
      });

    } catch (error) {
      console.error('Erreur statistiques vendeur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }

  getPeriodRanges(period) {
    const now = new Date();
    let currentPeriod, lastPeriod;

    switch (period) {
      case 'month':
        currentPeriod = {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        };
        lastPeriod = {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        };
        break;

      case 'week':
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        currentPeriod = {
          start: weekStart,
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        };

        lastPeriod = {
          start: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(weekStart.getTime() - 1)
        };
        break;

      // ... autres périodes
    }

    return { currentPeriod, lastPeriod };
  }

  async getVendorOrders(vendorId, startDate, endDate) {
    return await db.Order.findAll({
      where: {
        userId: vendorId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: db.OrderItem,
          as: 'orderItems',
          include: [
            {
              model: db.Product,
              as: 'product'
            }
          ]
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async calculateDetailedStatistics(currentOrders, lastOrders, currentPeriod) {

    // Filtrer les commandes payées uniquement pour les calculs financiers
    const paidCurrentOrders = currentOrders.filter(order => order.paymentStatus === 'PAID');
    const paidLastOrders = lastOrders.filter(order => order.paymentStatus === 'PAID');

    // Statistiques de commandes (toutes commandes confondues)
    const orderStats = {
      totalOrders: currentOrders.length,
      pendingOrders: currentOrders.filter(o => o.status === 'PENDING').length,
      processingOrders: currentOrders.filter(o => o.status === 'PROCESSING').length,
      shippedOrders: currentOrders.filter(o => o.status === 'SHIPPED').length,
      deliveredOrders: currentOrders.filter(o => o.status === 'DELIVERED').length,
      cancelledOrders: currentOrders.filter(o => o.status === 'CANCELLED').length,
      failedPaymentOrders: currentOrders.filter(o => o.paymentStatus === 'FAILED').length
    };

    // Statistiques financières (uniquement commandes payées)
    const financialStats = this.calculateFinancialStats(paidCurrentOrders);

    // Statistiques temporelles
    const temporalStats = this.calculateTemporalStats(
      paidCurrentOrders,
      paidLastOrders,
      currentPeriod
    );

    // Analyse par statut de paiement
    const paymentBreakdown = this.calculatePaymentBreakdown(currentOrders);

    // Produits les plus vendus
    const topProducts = await this.getTopProducts(currentOrders);

    return {
      ...orderStats,
      ...financialStats,
      ...temporalStats,
      paymentBreakdown,
      topProducts,
      metadata: {
        period: currentPeriod.type || 'month',
        calculatedAt: new Date().toISOString(),
        totalOrdersAnalyzed: currentOrders.length
      }
    };
  }

  calculateFinancialStats(paidOrders) {
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalVendorEarnings = paidOrders.reduce((sum, order) =>
      sum + (order.commissionAmount ? order.totalAmount - order.commissionAmount :
      order.commission_info?.vendor_amount || 0), 0);
    const totalCommission = paidOrders.reduce((sum, order) =>
      sum + (order.commissionAmount || order.commission_info?.commission_amount || 0), 0);

    return {
      totalRevenue,
      totalVendorEarnings,
      totalCommission,
      averageOrderValue: paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0,
      averageCommission: paidOrders.length > 0 ? Math.round(totalCommission / paidOrders.length) : 0
    };
  }

  calculateTemporalStats(currentPaidOrders, lastPaidOrders, currentPeriod) {
    const currentRevenue = currentPaidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const lastRevenue = lastPaidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const revenueGrowth = lastRevenue > 0 ?
      Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 1000) / 10 :
      (currentRevenue > 0 ? 100 : 0);

    return {
      revenueThisMonth: currentRevenue,
      ordersThisMonth: currentPaidOrders.length,
      revenueLastMonth: lastRevenue,
      ordersLastMonth: lastPaidOrders.length,
      monthlyGrowth: revenueGrowth
    };
  }

  calculatePaymentBreakdown(orders) {
    const breakdown = {
      PAID: { count: 0, amount: 0, percentage: 0 },
      PENDING: { count: 0, amount: 0, percentage: 0 },
      FAILED: { count: 0, amount: 0, percentage: 0 },
      CANCELLED: { count: 0, amount: 0, percentage: 0 }
    };

    const totalOrders = orders.length;

    orders.forEach(order => {
      const status = order.paymentStatus || 'PENDING';
      if (breakdown[status]) {
        breakdown[status].count++;
        breakdown[status].amount += order.totalAmount || 0;
      }
    });

    // Calculer les pourcentages
    Object.keys(breakdown).forEach(status => {
      breakdown[status].percentage = totalOrders > 0 ?
        Math.round((breakdown[status].count / totalOrders) * 1000) / 10 : 0;
    });

    return breakdown;
  }

  async getTopProducts(orders) {
    const productStats = {};

    orders.forEach(order => {
      if (order.orderItems) {
        order.orderItems.forEach(item => {
          const productId = item.productId;
          if (!productStats[productId]) {
            productStats[productId] = {
              productId,
              productName: item.product?.name || 'Produit inconnu',
              totalSales: 0,
              revenue: 0
            };
          }
          productStats[productId].totalSales += item.quantity;
          productStats[productId].revenue += item.totalPrice || 0;
        });
      }
    });

    // Convertir en tableau et trier
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const totalRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0);

    // Ajouter les pourcentages
    topProducts.forEach(product => {
      product.percentage = totalRevenue > 0 ?
        Math.round((product.revenue / totalRevenue) * 1000) / 10 : 0;
    });

    return topProducts;
  }
}

module.exports = new VendorStatisticsController();
```

### 2. Middleware d'Authentification

```javascript
// middleware/vendorAuth.js
const authMiddleware = (req, res, next) => {
  // Vérifier que l'utilisateur est authentifié
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }

  // Vérifier que l'utilisateur est un vendeur
  if (req.user.role !== 'VENDEUR' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux vendeurs'
    });
  }

  next();
};
```

### 3. Routes

```javascript
// routes/vendor.js
const express = require('express');
const router = express.Router();
const vendorStatisticsController = require('../controllers/vendorStatisticsController');
const vendorAuth = require('../middleware/vendorAuth');

// Toutes les routes vendeurs nécessitent une authentification
router.use(vendorAuth);

// Endpoint de statistiques
router.get('/orders/statistics', vendorStatisticsController.getStatistics);

// Autres routes vendeurs...
router.get('/orders', require('./vendorOrders'));

module.exports = router;
```

### 4. Configuration Principale

```javascript
// app.js
const vendorRoutes = require('./routes/vendor');

app.use('/vendor', vendorRoutes);
```

## Test et Validation

### Test avec Postman/Curl

```bash
# Test basique
curl -X GET \
  'http://localhost:3004/vendor/orders/statistics' \
  -H 'Authorization: Bearer VOTRE_TOKEN'

# Test avec période spécifique
curl -X GET \
  'http://localhost:3004/vendor/orders/statistics?period=week' \
  -H 'Authorization: Bearer VOTRE_TOKEN'
```

### Réponse Attendue

```json
{
  "success": true,
  "message": "Statistiques récupérées avec succès",
  "data": {
    "totalOrders": 7,
    "pendingOrders": 3,
    "processingOrders": 0,
    "shippedOrders": 0,
    "deliveredOrders": 1,
    "cancelledOrders": 0,
    "failedPaymentOrders": 3,

    "totalRevenue": 63000,
    "totalVendorEarnings": 44100,
    "totalCommission": 18900,
    "averageOrderValue": 9000,
    "averageCommission": 2700,

    "revenueThisMonth": 63000,
    "ordersThisMonth": 4,
    "revenueLastMonth": 0,
    "ordersLastMonth": 0,
    "monthlyGrowth": 100,

    "paymentBreakdown": {
      "PAID": {
        "count": 4,
        "amount": 36000,
        "percentage": 57.1
      },
      "PENDING": {
        "count": 3,
        "amount": 27000,
        "percentage": 42.9
      },
      "FAILED": {
        "count": 0,
        "amount": 0,
        "percentage": 0
      }
    },

    "topProducts": [
      {
        "productId": 1,
        "productName": "Tshirt de luxe",
        "totalSales": 7,
        "revenue": 63000,
        "percentage": 100
      }
    ],

    "metadata": {
      "period": "month",
      "calculatedAt": "2025-12-02T12:00:00.000Z",
      "totalOrdersAnalyzed": 7
    }
  }
}
```

## Integration avec le Frontend

### Mise à jour du VendorSales.tsx

```typescript
// Remplacer le useMemo par l'appel API
const [statistics, setStatistics] = useState(null);
const [loadingStats, setLoadingStats] = useState(true);

const loadVendorStatistics = async () => {
  try {
    setLoadingStats(true);
    const response = await fetch('/vendor/orders/statistics?period=month', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    const data = await response.json();

    if (data.success) {
      setStatistics(data.data);
    } else {
      toast.error(data.message || 'Erreur lors du chargement des statistiques');
    }
  } catch (error) {
    console.error('Erreur statistiques:', error);
    toast.error('Erreur lors du chargement des statistiques');
  } finally {
    setLoadingStats(false);
  }
};

useEffect(() => {
  loadVendorStatistics();
}, [statusFilter, dateFilter]);

// Utilisation dans le rendu
<div className="text-2xl font-bold text-gray-900">
  {loadingStats ? '...' : formatAmount(statistics?.totalRevenue || 0)}
</div>
<div className="text-xs text-gray-500">
  Revenu total (commandes payées)
</div>
```

## Optimisations Futures

### 1. Système de Cache

```javascript
// Cache Redis pour les statistiques
const cacheKey = `vendor_stats_${vendorId}_${period}`;
const cached = await redis.get(cacheKey);

if (cached && !forceRefresh) {
  return JSON.parse(cached);
}

// Calculer et mettre en cache pour 5 minutes
const statistics = await calculateStatistics();
await redis.setex(cacheKey, 300, JSON.stringify(statistics));
```

### 2. Calcul Asynchrone

```javascript
// Job en arrière-plan pour les gros volumes
const queue = require('bull');

const statisticsQueue = new Queue('statistics calculation');

statisticsQueue.process(async (job) => {
  const { vendorId, period } = job.data;
  return await calculateVendorStatistics(vendorId, period);
});
```

Cette implémentation corrige les problèmes identifiés et fournit une base solide pour des statistiques précises et performantes.