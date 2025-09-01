# 🚀 TODO Backend - Endpoints Commandes

## 📋 Endpoints à implémenter

### 1. Statistiques des commandes
**Endpoint:** `GET /orders/admin/statistics`
**Authentification:** Requise (Admin/SuperAdmin)
**Réponse attendue:**

```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "revenue": {
      "total": 45000,
      "monthly": 12000
    },
    "ordersCount": {
      "today": 5,
      "week": 23,
      "month": 87
    },
    "ordersByStatus": {
      "pending": 12,
      "confirmed": 25,
      "processing": 18,
      "shipped": 35,
      "delivered": 45,
      "cancelled": 15
    }
  }
}
```

### 2. Test d'authentification
**Endpoint:** `GET /api/orders/test-auth`
**Authentification:** Requise
**Réponse attendue:**

```json
{
  "success": true,
  "message": "Authentification réussie",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "SUPERADMIN"
  }
}
```

## 🔧 Implémentation suggérée (Node.js/Express)

### Controller des statistiques

```javascript
// controllers/orderStatsController.js
const getOrderStatistics = async (req, res) => {
  try {
    // Vérifier les permissions admin
    if (!req.user || !['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Permissions administrateur requises'
      });
    }

    // Calculer les statistiques
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('totalAmount', {
      where: { status: { [Op.in]: ['DELIVERED', 'CONFIRMED'] } }
    });
    
    const monthlyRevenue = await Order.sum('totalAmount', {
      where: {
        status: { [Op.in]: ['DELIVERED', 'CONFIRMED'] },
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    const ordersToday = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: new Date().setHours(0, 0, 0, 0)
        }
      }
    });

    const ordersThisWeek = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const ordersThisMonth = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    // Compter par statut
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    ordersByStatus.forEach(item => {
      const status = item.status.toLowerCase();
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status] = parseInt(item.count);
      }
    });

    const statistics = {
      totalOrders,
      revenue: {
        total: totalRevenue || 0,
        monthly: monthlyRevenue || 0
      },
      ordersCount: {
        today: ordersToday,
        week: ordersThisWeek,
        month: ordersThisMonth
      },
      ordersByStatus: statusCounts
    };

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = { getOrderStatistics };
```

### Routes

```javascript
// routes/orders.js
const express = require('express');
const router = express.Router();
const { getOrderStatistics } = require('../controllers/orderStatsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Statistiques (Admin uniquement)
router.get('/admin/statistics', authenticateToken, requireAdmin, getOrderStatistics);

// Test d'authentification
router.get('/test-auth', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Authentification réussie',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
```

### Middleware d'authentification

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    // Vérifier le cookie de session ou le header Authorization
    const token = req.cookies.session || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Permissions administrateur requises'
    });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
```

## 🧪 Tests

### Test avec curl (après implémentation)

```bash
# Test des statistiques (avec authentification)
curl -X GET "http://localhost:3004/orders/admin/statistics" \
  -H "Cookie: session=your_session_cookie" \
  -H "accept: application/json"

# Test d'authentification
curl -X GET "http://localhost:3004/api/orders/test-auth" \
  -H "Cookie: session=your_session_cookie" \
  -H "accept: application/json"
```

### Test dans la console du navigateur

```javascript
// Test des statistiques
fetch('/orders/admin/statistics', { 
  credentials: 'include' 
})
.then(r => r.json())
.then(console.log);

// Test d'authentification
fetch('/api/orders/test-auth', { 
  credentials: 'include' 
})
.then(r => r.json())
.then(console.log);
```

## 📝 Notes importantes

1. **Authentification par cookies** : Le frontend utilise `credentials: 'include'`
2. **Permissions** : Vérifier les rôles ADMIN/SUPERADMIN
3. **Gestion d'erreurs** : Retourner des codes HTTP appropriés
4. **Performance** : Optimiser les requêtes de statistiques avec des index
5. **Cache** : Considérer la mise en cache des statistiques pour de meilleures performances

## ✅ Checklist d'implémentation

- [ ] Créer le controller des statistiques
- [ ] Ajouter les routes manquantes
- [ ] Implémenter le middleware d'authentification
- [ ] Tester les endpoints avec curl
- [ ] Tester l'intégration frontend
- [ ] Ajouter la gestion d'erreurs
- [ ] Optimiser les performances
- [ ] Documenter l'API 