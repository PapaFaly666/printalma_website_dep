/**
 * =================================
 * EXEMPLES D'IMPLÉMENTATION BACKEND
 * Système de Gestion des Commandes Vendeur - PrintAlma
 * =================================
 *
 * Ce fichier contient des exemples d'implémentation des endpoints
 * pour le système de gestion des commandes vendeur.
 *
 * Framework suggéré: Express.js + Sequelize/TypeORM
 */

const express = require('express');
const { Op } = require('sequelize'); // Ou votre ORM préféré
const router = express.Router();

// =================================
// MIDDLEWARE D'AUTHENTIFICATION
// =================================

/**
 * Middleware pour vérifier l'authentification vendeur
 */
const requireVendorAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.role !== 'VENDEUR') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux vendeurs'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur authentification vendeur:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

/**
 * Middleware pour vérifier l'accès à une commande spécifique
 */
const checkOrderAccess = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const vendorId = req.user.id;

    // Vérifier que le vendeur a des produits dans cette commande
    const orderAccess = await OrderItem.findOne({
      where: {
        order_id: orderId,
        vendor_id: vendorId
      },
      include: [{
        model: Order,
        as: 'order',
        required: true
      }]
    });

    if (!orderAccess) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée ou accès non autorisé'
      });
    }

    req.orderAccess = orderAccess;
    next();
  } catch (error) {
    console.error('Erreur vérification accès commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification d\'accès'
    });
  }
};

// =================================
// ENDPOINT 1: RÉCUPÉRER LES COMMANDES DU VENDEUR
// =================================

/**
 * GET /vendor/orders
 * Récupère toutes les commandes contenant des produits du vendeur
 */
router.get('/orders', requireVendorAuth, async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Construire les conditions de filtrage
    const whereConditions = {};
    const orderItemsWhere = { vendor_id: vendorId };

    // Filtre par statut
    if (status) {
      whereConditions.status = status;
    }

    // Filtre par période
    if (startDate || endDate) {
      whereConditions.created_at = {};
      if (startDate) whereConditions.created_at[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.created_at[Op.lte] = new Date(endDate);
    }

    // Filtre par montant
    if (minAmount || maxAmount) {
      whereConditions.total_amount = {};
      if (minAmount) whereConditions.total_amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) whereConditions.total_amount[Op.lte] = parseFloat(maxAmount);
    }

    // Recherche textuelle
    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
      whereConditions[Op.or] = [
        { order_number: { [Op.iLike]: `%${search}%` } },
        { '$user.first_name$': { [Op.iLike]: `%${search}%` } },
        { '$user.last_name$': { [Op.iLike]: `%${search}%` } },
        { '$user.email$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Calcul de la pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Requête principale avec les jointures
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'profile_photo_url'],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined
        },
        {
          model: OrderItem,
          as: 'orderItems',
          where: orderItemsWhere,
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'description', 'design_name', 'design_description', 'design_image_url', 'category_id'],
            include: [{
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }]
          }]
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true // Important pour le count avec les jointures
    });

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(count / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrevious = parseInt(page) > 1;

    // Formater les données de réponse
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      user: {
        id: order.user.id,
        firstName: order.user.first_name,
        lastName: order.user.last_name,
        email: order.user.email,
        role: order.user.role,
        photo_profil: order.user.profile_photo_url
      },
      status: order.status,
      totalAmount: order.total_amount,
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      shippingAmount: order.shipping_amount,
      paymentMethod: order.payment_method,
      shippingAddress: order.shipping_address,
      phoneNumber: order.phone_number,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      confirmedAt: order.confirmed_at,
      shippedAt: order.shipped_at,
      deliveredAt: order.delivered_at,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        size: item.size,
        color: item.color,
        colorId: item.color_id,
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image_url,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          designName: item.product.design_name,
          designDescription: item.product.design_description,
          designImageUrl: item.product.design_image_url,
          categoryId: item.product.category_id,
          categoryName: item.product.category?.name
        } : null
      }))
    }));

    res.json({
      success: true,
      message: 'Commandes récupérées avec succès',
      data: {
        orders: formattedOrders,
        total: count,
        page: parseInt(page),
        totalPages,
        hasNext,
        hasPrevious
      }
    });

  } catch (error) {
    console.error('Erreur récupération commandes vendeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});

// =================================
// ENDPOINT 2: DÉTAILS D'UNE COMMANDE
// =================================

/**
 * GET /vendor/orders/:orderId
 * Récupère les détails complets d'une commande spécifique
 */
router.get('/orders/:orderId', requireVendorAuth, checkOrderAccess, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'profile_photo_url']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          where: { vendor_id: req.user.id }, // Seulement les items du vendeur
          include: [{
            model: Product,
            as: 'product',
            include: [{
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }]
          }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Formater la réponse (même format que la liste)
    const formattedOrder = {
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      user: {
        id: order.user.id,
        firstName: order.user.first_name,
        lastName: order.user.last_name,
        email: order.user.email,
        role: order.user.role,
        photo_profil: order.user.profile_photo_url
      },
      status: order.status,
      totalAmount: order.total_amount,
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      shippingAmount: order.shipping_amount,
      paymentMethod: order.payment_method,
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      phoneNumber: order.phone_number,
      notes: order.notes,
      trackingNumber: order.tracking_number,
      carrier: order.carrier,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      confirmedAt: order.confirmed_at,
      shippedAt: order.shipped_at,
      deliveredAt: order.delivered_at,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        size: item.size,
        color: item.color,
        colorId: item.color_id,
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image_url,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          price: item.product.price,
          designName: item.product.design_name,
          designDescription: item.product.design_description,
          designImageUrl: item.product.design_image_url,
          categoryId: item.product.category_id,
          categoryName: item.product.category?.name
        }
      }))
    };

    res.json({
      success: true,
      message: 'Détails de commande récupérés',
      data: formattedOrder
    });

  } catch (error) {
    console.error('Erreur récupération détails commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails'
    });
  }
});

// =================================
// ENDPOINT 3: MISE À JOUR DU STATUT
// =================================

/**
 * PATCH /vendor/orders/:orderId/status
 * Met à jour le statut d'une commande (avec restrictions vendeur)
 */
router.patch('/orders/:orderId/status', requireVendorAuth, checkOrderAccess, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const vendorId = req.user.id;

    // Validation du statut
    const VENDOR_ALLOWED_TRANSITIONS = {
      'PENDING': ['CONFIRMED'],
      'CONFIRMED': ['PROCESSING'],
      'PROCESSING': ['SHIPPED'],
      'SHIPPED': [],
      'DELIVERED': [],
      'CANCELLED': [],
      'REJECTED': []
    };

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que la transition est autorisée
    const allowedStatuses = VENDOR_ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Transition de statut non autorisée: ${order.status} → ${status}`
      });
    }

    // Mettre à jour le statut
    const updateData = {
      status: status,
      updated_at: new Date()
    };

    // Mettre à jour les timestamps spécifiques
    if (status === 'CONFIRMED' && !order.confirmed_at) {
      updateData.confirmed_at = new Date();
    } else if (status === 'PROCESSING' && !order.processed_at) {
      updateData.processed_at = new Date();
    } else if (status === 'SHIPPED' && !order.shipped_at) {
      updateData.shipped_at = new Date();
    }

    await order.update(updateData);

    // Ajouter une entrée dans l'historique (si pas géré par trigger)
    await OrderStatusHistory.create({
      order_id: orderId,
      from_status: order.status,
      to_status: status,
      changed_by: vendorId,
      notes: notes || `Statut mis à jour par le vendeur`,
      created_at: new Date()
    });

    // Créer une notification pour le client
    await Notification.create({
      user_id: order.user_id,
      type: 'ORDER_STATUS_CHANGED',
      title: 'Statut de commande mis à jour',
      message: `Votre commande ${order.order_number} est maintenant: ${getStatusLabel(status)}`,
      related_order_id: orderId,
      created_at: new Date()
    });

    // Recharger la commande avec toutes ses relations
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'profile_photo_url']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          where: { vendor_id: vendorId },
          include: [{
            model: Product,
            as: 'product',
            include: [{
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }]
          }]
        }
      ]
    });

    // Émettre un événement WebSocket si configuré
    if (global.io) {
      global.io.to(`user_${order.user_id}`).emit('order:status_changed', {
        orderId: orderId,
        newStatus: status,
        orderNumber: order.order_number,
        message: `Votre commande ${order.order_number} est maintenant: ${getStatusLabel(status)}`
      });

      global.io.to(`vendor_${vendorId}`).emit('vendor:order_updated', {
        orderId: orderId,
        newStatus: status,
        orderNumber: order.order_number
      });
    }

    res.json({
      success: true,
      message: `Statut mis à jour vers: ${getStatusLabel(status)}`,
      data: updatedOrder // Formater comme dans les autres endpoints
    });

  } catch (error) {
    console.error('Erreur mise à jour statut commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// =================================
// ENDPOINT 4: STATISTIQUES VENDEUR
// =================================

/**
 * GET /vendor/orders/statistics
 * Récupère les statistiques de commandes du vendeur
 */
router.get('/orders/statistics', requireVendorAuth, async (req, res) => {
  try {
    const vendorId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Statistiques globales
    const totalStats = await OrderItem.findOne({
      where: { vendor_id: vendorId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('order_id'))), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('total_price')), 'averageOrderValue']
      ],
      raw: true
    });

    // Statistiques par statut
    const statusStats = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'count']
      ],
      include: [{
        model: OrderItem,
        as: 'orderItems',
        where: { vendor_id: vendorId },
        attributes: []
      }],
      group: ['status'],
      raw: true
    });

    // Statistiques du mois en cours
    const thisMonthStats = await OrderItem.findOne({
      where: { vendor_id: vendorId },
      include: [{
        model: Order,
        as: 'order',
        where: {
          created_at: { [Op.gte]: startOfMonth }
        },
        attributes: []
      }],
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('order_id'))), 'ordersThisMonth'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'revenueThisMonth']
      ],
      raw: true
    });

    // Statistiques du mois dernier
    const lastMonthStats = await OrderItem.findOne({
      where: { vendor_id: vendorId },
      include: [{
        model: Order,
        as: 'order',
        where: {
          created_at: {
            [Op.gte]: startOfLastMonth,
            [Op.lt]: startOfMonth
          }
        },
        attributes: []
      }],
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('order_id'))), 'ordersLastMonth'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'revenueLastMonth']
      ],
      raw: true
    });

    // Formater les statistiques par statut
    const statusCounts = statusStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase() + 'Orders'] = parseInt(stat.count);
      return acc;
    }, {});

    // Calculer la croissance mensuelle
    const ordersThisMonth = parseInt(thisMonthStats?.ordersThisMonth || 0);
    const ordersLastMonth = parseInt(lastMonthStats?.ordersLastMonth || 0);
    const monthlyGrowth = ordersLastMonth > 0
      ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
      : 0;

    const statistics = {
      totalOrders: parseInt(totalStats?.totalOrders || 0),
      totalRevenue: parseFloat(totalStats?.totalRevenue || 0),
      averageOrderValue: parseFloat(totalStats?.averageOrderValue || 0),
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2)),

      // Statistiques par statut
      pendingOrders: statusCounts.pendingOrders || 0,
      processingOrders: statusCounts.processingOrders || 0,
      shippedOrders: statusCounts.shippedOrders || 0,
      deliveredOrders: statusCounts.deliveredOrders || 0,
      cancelledOrders: statusCounts.cancelledOrders || 0,

      // Statistiques temporelles
      revenueThisMonth: parseFloat(thisMonthStats?.revenueThisMonth || 0),
      ordersThisMonth: ordersThisMonth,
      revenueLastMonth: parseFloat(lastMonthStats?.revenueLastMonth || 0),
      ordersLastMonth: ordersLastMonth
    };

    res.json({
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: statistics
    });

  } catch (error) {
    console.error('Erreur récupération statistiques vendeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// =================================
// ENDPOINT 5: EXPORT CSV
// =================================

/**
 * GET /vendor/orders/export/csv
 * Exporte les commandes du vendeur au format CSV
 */
router.get('/orders/export/csv', requireVendorAuth, async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, startDate, endDate } = req.query;

    const whereConditions = {};
    const orderItemsWhere = { vendor_id: vendorId };

    if (status) whereConditions.status = status;
    if (startDate || endDate) {
      whereConditions.created_at = {};
      if (startDate) whereConditions.created_at[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.created_at[Op.lte] = new Date(endDate);
    }

    const orders = await Order.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          where: orderItemsWhere,
          attributes: ['quantity', 'unit_price', 'total_price', 'product_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Générer le CSV
    const csvHeaders = [
      'Numéro',
      'Client',
      'Email',
      'Statut',
      'Produits',
      'Montant Total',
      'Date Création',
      'Date Livraison'
    ];

    const csvRows = orders.map(order => [
      order.order_number,
      `${order.user.first_name} ${order.user.last_name}`,
      order.user.email,
      getStatusLabel(order.status),
      order.orderItems.map(item => `${item.quantity}x ${item.product_name}`).join('; '),
      order.total_amount,
      order.created_at.toISOString().split('T')[0],
      order.delivered_at ? order.delivered_at.toISOString().split('T')[0] : ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="commandes-${vendorId}-${Date.now()}.csv"`);
    res.send('\uFEFF' + csvContent); // BOM pour Excel

  } catch (error) {
    console.error('Erreur export CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export CSV'
    });
  }
});

// =================================
// FONCTIONS UTILITAIRES
// =================================

/**
 * Obtient le label localisé d'un statut
 */
function getStatusLabel(status) {
  const labels = {
    'PENDING': 'En attente',
    'CONFIRMED': 'Confirmée',
    'PROCESSING': 'En traitement',
    'SHIPPED': 'Expédiée',
    'DELIVERED': 'Livrée',
    'CANCELLED': 'Annulée',
    'REJECTED': 'Rejetée'
  };
  return labels[status] || status;
}

/**
 * Validation des transitions de statut pour vendeurs
 */
function canVendorUpdateStatus(currentStatus, newStatus) {
  const allowedTransitions = {
    'PENDING': ['CONFIRMED'],
    'CONFIRMED': ['PROCESSING'],
    'PROCESSING': ['SHIPPED'],
    'SHIPPED': [],
    'DELIVERED': [],
    'CANCELLED': [],
    'REJECTED': []
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
}

// =================================
// GESTION DES ERREURS GLOBALES
// =================================

/**
 * Middleware de gestion d'erreurs pour les routes vendeur
 */
router.use((error, req, res, next) => {
  console.error('Erreur route vendeur:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id
  });

  // Erreurs de validation Sequelize
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: error.errors.map(e => e.message)
    });
  }

  // Erreurs de contraintes de base de données
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Conflit de données'
    });
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

module.exports = router;

// =================================
// NOTES D'IMPLÉMENTATION
// =================================

/*
1. SÉCURITÉ:
   - Toujours vérifier l'authentification vendeur
   - Vérifier l'accès aux commandes (vendor_id dans order_items)
   - Valider les transitions de statut
   - Logger les actions sensibles

2. PERFORMANCE:
   - Utiliser des index sur vendor_id, order_id, status
   - Limiter les résultats avec pagination
   - Utiliser des requêtes optimisées avec includes

3. MONITORING:
   - Logger toutes les erreurs avec contexte
   - Monitorer les temps de réponse
   - Tracker les métriques business (commandes/jour, etc.)

4. WEBSOCKETS:
   - Émettre des événements pour les changements de statut
   - Notifier les clients et vendeurs en temps réel
   - Gérer la déconnexion/reconnexion

5. TESTS:
   - Tester chaque endpoint avec différents cas
   - Tester les permissions et la sécurité
   - Tests d'intégration avec la base de données
*/