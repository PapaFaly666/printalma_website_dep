-- ========================================================================
-- SCHEMA SQL POUR SYSTÈME DE COMMANDE CLIENT
-- ========================================================================
-- Ce fichier complète schema.sql avec les tables nécessaires pour
-- gérer les commandes des clients (authentifiés ou invités)
-- ========================================================================

-- Table des utilisateurs (clients)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  role ENUM('CLIENT', 'VENDEUR', 'ADMIN') DEFAULT 'CLIENT',
  status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',

  -- Profil vendeur étendu
  shop_name VARCHAR(255),
  shop_description TEXT,
  shop_logo VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_role (role),
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- Créer un compte invité par défaut (userId = 3 comme dans la doc)
INSERT IGNORE INTO users (id, email, firstName, lastName, role, status) VALUES
(3, 'guest@printalma.com', 'Guest', 'User', 'CLIENT', 'ACTIVE');

-- ========================================================================
-- TABLES DE COMMANDE
-- ========================================================================

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderNumber VARCHAR(100) UNIQUE NOT NULL,
  userId INT NOT NULL,

  -- Statut de la commande
  status ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',

  -- Montants
  totalAmount DECIMAL(10,2) NOT NULL,

  -- Informations client
  phoneNumber VARCHAR(20) NOT NULL,
  notes TEXT,

  -- Adresse de livraison
  shippingName VARCHAR(255),
  shippingStreet VARCHAR(255),
  shippingCity VARCHAR(100),
  shippingRegion VARCHAR(100),
  shippingPostalCode VARCHAR(20),
  shippingCountry VARCHAR(100),
  shippingAddressFull TEXT,

  -- Paiement
  paymentMethod VARCHAR(50),
  paymentStatus ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
  transactionId VARCHAR(255),

  -- Métadonnées
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id),

  INDEX idx_order_number (orderNumber),
  INDEX idx_user_id (userId),
  INDEX idx_status (status),
  INDEX idx_payment_status (paymentStatus),
  INDEX idx_created_at (created_at)
);

-- Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,

  -- Produit commandé
  productId INT NOT NULL,              -- ID du baseProduct (mockup admin)
  vendorProductId INT,                 -- ID du produit vendeur (si applicable)

  -- Quantité et prix
  quantity INT NOT NULL DEFAULT 1,
  unitPrice DECIMAL(10,2) NOT NULL,

  -- Variations
  size VARCHAR(50),
  color VARCHAR(100),
  colorId INT,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES admin_products(id),
  FOREIGN KEY (vendorProductId) REFERENCES vendor_products(id),

  INDEX idx_order_id (orderId),
  INDEX idx_product_id (productId),
  INDEX idx_vendor_product_id (vendorProductId)
);

-- ========================================================================
-- TABLE DES NOTIFICATIONS
-- ========================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,

  -- Type et contenu
  type ENUM('NEW_ORDER', 'ORDER_UPDATE', 'PAYMENT_RECEIVED', 'PRODUCT_APPROVED', 'PRODUCT_REJECTED', 'OTHER') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Métadonnées (JSON sous forme de TEXT)
  metadata TEXT,

  -- Statut de lecture
  isRead BOOLEAN DEFAULT FALSE,
  readAt TIMESTAMP NULL,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_id (userId),
  INDEX idx_type (type),
  INDEX idx_is_read (isRead),
  INDEX idx_created_at (created_at)
);

-- ========================================================================
-- MISE À JOUR DE LA TABLE vendor_products POUR LES STATISTIQUES
-- ========================================================================

-- Vérifier si les colonnes existent déjà avant de les ajouter
SET @dbname = DATABASE();
SET @tablename = 'vendor_products';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_schema = @dbname
     AND table_name = @tablename
     AND column_name = 'salesCount') = 0,
  'ALTER TABLE vendor_products ADD COLUMN salesCount INT DEFAULT 0',
  'SELECT "Column salesCount already exists"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_schema = @dbname
     AND table_name = @tablename
     AND column_name = 'totalRevenue') = 0,
  'ALTER TABLE vendor_products ADD COLUMN totalRevenue DECIMAL(10,2) DEFAULT 0.00',
  'SELECT "Column totalRevenue already exists"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_schema = @dbname
     AND table_name = @tablename
     AND column_name = 'lastSaleDate') = 0,
  'ALTER TABLE vendor_products ADD COLUMN lastSaleDate TIMESTAMP NULL',
  'SELECT "Column lastSaleDate already exists"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ========================================================================
-- VUES UTILES POUR LES COMMANDES
-- ========================================================================

-- Vue pour les commandes avec détails complets
CREATE OR REPLACE VIEW v_orders_full AS
SELECT
  o.id,
  o.orderNumber,
  o.status,
  o.totalAmount,
  o.phoneNumber,
  o.notes,

  -- Adresse de livraison
  o.shippingName,
  o.shippingStreet,
  o.shippingCity,
  o.shippingRegion,
  o.shippingPostalCode,
  o.shippingCountry,

  -- Paiement
  o.paymentMethod,
  o.paymentStatus,
  o.transactionId,

  -- Client
  u.id as userId,
  u.email as userEmail,
  u.firstName as userFirstName,
  u.lastName as userLastName,
  u.role as userRole,

  -- Nombre d'articles
  (SELECT COUNT(*) FROM order_items oi WHERE oi.orderId = o.id) as itemCount,

  -- Dates
  o.created_at,
  o.updated_at

FROM orders o
LEFT JOIN users u ON o.userId = u.id
ORDER BY o.created_at DESC;

-- Vue pour les commandes d'un vendeur spécifique
CREATE OR REPLACE VIEW v_vendor_orders AS
SELECT
  o.id as orderId,
  o.orderNumber,
  o.status as orderStatus,
  o.totalAmount as orderTotalAmount,
  o.shippingName,
  o.phoneNumber,
  o.paymentMethod,
  o.paymentStatus,
  o.created_at as orderCreatedAt,

  -- Articles du vendeur dans cette commande
  oi.id as orderItemId,
  oi.quantity,
  oi.unitPrice,
  oi.size,
  oi.color,

  -- Produit vendeur
  vp.id as vendorProductId,
  vp.name as productName,
  vp.description as productDescription,
  vp.vendorId,

  -- Vendeur
  v.firstName as vendorFirstName,
  v.lastName as vendorLastName,
  v.shop_name as vendorShopName,

  -- Produit base
  ap.id as baseProductId,
  ap.name as baseProductName,
  ap.category as baseProductCategory,

  -- Client
  u.email as customerEmail,
  u.firstName as customerFirstName,
  u.lastName as customerLastName

FROM orders o
INNER JOIN order_items oi ON o.id = oi.orderId
INNER JOIN vendor_products vp ON oi.vendorProductId = vp.id
INNER JOIN users v ON vp.vendorId = v.id
LEFT JOIN admin_products ap ON vp.baseProductId = ap.id
LEFT JOIN users u ON o.userId = u.id
ORDER BY o.created_at DESC;

-- ========================================================================
-- PROCÉDURES STOCKÉES POUR LES COMMANDES
-- ========================================================================

DELIMITER //

-- Procédure pour mettre à jour les statistiques vendeur après une commande
CREATE PROCEDURE UpdateVendorStats(
  IN p_vendorProductId INT,
  IN p_quantity INT,
  IN p_totalAmount DECIMAL(10,2)
)
BEGIN
  UPDATE vendor_products
  SET
    salesCount = salesCount + p_quantity,
    totalRevenue = totalRevenue + p_totalAmount,
    lastSaleDate = NOW(),
    updated_at = NOW()
  WHERE id = p_vendorProductId;
END //

-- Procédure pour créer une notification
CREATE PROCEDURE CreateNotification(
  IN p_userId INT,
  IN p_type VARCHAR(50),
  IN p_title VARCHAR(255),
  IN p_message TEXT,
  IN p_metadata TEXT
)
BEGIN
  INSERT INTO notifications (userId, type, title, message, metadata, created_at)
  VALUES (p_userId, p_type, p_title, p_message, p_metadata, NOW());
END //

-- Procédure pour marquer une notification comme lue
CREATE PROCEDURE MarkNotificationAsRead(
  IN p_notificationId INT
)
BEGIN
  UPDATE notifications
  SET
    isRead = TRUE,
    readAt = NOW()
  WHERE id = p_notificationId;
END //

-- Procédure pour obtenir les notifications non lues d'un utilisateur
CREATE PROCEDURE GetUnreadNotifications(
  IN p_userId INT
)
BEGIN
  SELECT
    id,
    type,
    title,
    message,
    metadata,
    created_at
  FROM notifications
  WHERE userId = p_userId
    AND isRead = FALSE
  ORDER BY created_at DESC;
END //

-- Procédure pour mettre à jour le statut d'une commande
CREATE PROCEDURE UpdateOrderStatus(
  IN p_orderId INT,
  IN p_status VARCHAR(50)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  UPDATE orders
  SET
    status = p_status,
    updated_at = NOW()
  WHERE id = p_orderId;

  -- Si la commande est livrée, mettre à jour les statistiques vendeur
  IF p_status = 'DELIVERED' THEN
    -- Mettre à jour les statistiques pour chaque produit vendeur de la commande
    UPDATE vendor_products vp
    INNER JOIN order_items oi ON vp.id = oi.vendorProductId
    SET
      vp.salesCount = vp.salesCount + oi.quantity,
      vp.totalRevenue = vp.totalRevenue + (oi.quantity * oi.unitPrice),
      vp.lastSaleDate = NOW()
    WHERE oi.orderId = p_orderId;
  END IF;

  COMMIT;
END //

DELIMITER ;

-- ========================================================================
-- INDEX POUR PERFORMANCE
-- ========================================================================

-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_orders_user_status ON orders(userId, status);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_order_items_order_product ON order_items(orderId, vendorProductId);
CREATE INDEX idx_notifications_user_read ON notifications(userId, isRead);

-- ========================================================================
-- TRIGGERS POUR AUTOMATISATION
-- ========================================================================

DELIMITER //

-- Trigger pour générer automatiquement un orderNumber
CREATE TRIGGER tr_orders_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.orderNumber IS NULL OR NEW.orderNumber = '' THEN
    SET NEW.orderNumber = CONCAT('ORD-', UNIX_TIMESTAMP(), '-', NEW.userId);
  END IF;
END //

-- Trigger pour mettre à jour la date de modification
CREATE TRIGGER tr_orders_updated
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END //

DELIMITER ;

-- ========================================================================
-- DONNÉES DE TEST
-- ========================================================================

-- Insérer quelques utilisateurs de test
INSERT IGNORE INTO users (email, firstName, lastName, role, status) VALUES
('client1@example.com', 'Jean', 'Dupont', 'CLIENT', 'ACTIVE'),
('client2@example.com', 'Marie', 'Martin', 'CLIENT', 'ACTIVE'),
('vendor1@example.com', 'Pierre', 'Leroy', 'VENDEUR', 'ACTIVE');

-- ========================================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ========================================================================

-- Ce schéma supporte :
-- ✅ Commandes client (authentifié et invité)
-- ✅ Gestion complète des informations de livraison
-- ✅ Intégration paiement (PayTech, Cash on Delivery)
-- ✅ Notifications en temps réel
-- ✅ Statistiques vendeur automatiques
-- ✅ Lien entre commandes et produits vendeur
-- ✅ Traçabilité complète
-- ✅ Performance optimisée avec index
-- ✅ Vues pour simplifier les requêtes
-- ✅ Procédures stockées pour les opérations complexes
-- ✅ Triggers pour automatisation

-- Pour déployer :
-- mysql -u root -p nom_de_votre_base < schema-orders.sql
