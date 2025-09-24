-- ========================================================================
-- SCHEMA SQL POUR VALIDATION ADMIN DES PRODUITS WIZARD
-- ========================================================================

-- Table des vendeurs
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  shop_name VARCHAR(255),
  status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des produits admin (base)
CREATE TABLE IF NOT EXISTS admin_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  basePrice DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des designs
CREATE TABLE IF NOT EXISTS designs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  vendorId INT NOT NULL,
  imageUrl VARCHAR(500),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);

-- Table principale des produits vendeur
CREATE TABLE IF NOT EXISTS vendor_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendorId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,

  -- STATUS DE VALIDATION
  status ENUM('DRAFT', 'PENDING_VALIDATION', 'APPROVED', 'REJECTED', 'PUBLISHED') DEFAULT 'DRAFT',

  -- TYPE DE PRODUIT
  designId INT NULL,  -- NULL = WIZARD, NOT NULL = TRADITIONAL
  baseProductId INT NOT NULL,  -- Référence au produit admin

  -- VALIDATION
  submittedAt TIMESTAMP NULL,
  validatedAt TIMESTAMP NULL,
  validatedBy INT NULL,  -- ID de l'admin qui a validé
  rejectionReason TEXT NULL,

  -- PUBLICATION
  isPublic BOOLEAN DEFAULT FALSE,
  publishedAt TIMESTAMP NULL,

  -- METADATA
  views INT DEFAULT 0,
  likes INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (vendorId) REFERENCES vendors(id),
  FOREIGN KEY (designId) REFERENCES designs(id),
  FOREIGN KEY (baseProductId) REFERENCES admin_products(id),

  -- Index pour performance
  INDEX idx_status (status),
  INDEX idx_submitted (submittedAt),
  INDEX idx_vendor (vendorId),
  INDEX idx_type (designId),
  INDEX idx_public (isPublic)
);

-- Table des images vendeur (pour produits WIZARD)
CREATE TABLE IF NOT EXISTS vendor_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  cloudinaryUrl VARCHAR(500) NOT NULL,
  cloudinaryPublicId VARCHAR(255),

  -- TYPE ET METADATA
  imageType ENUM('base', 'detail', 'reference', 'variant') DEFAULT 'base',
  colorName VARCHAR(100),
  colorCode VARCHAR(7),  -- Format hexadecimal #FFFFFF

  -- ORDRE D'AFFICHAGE
  sortOrder INT DEFAULT 0,

  -- VALIDATION
  isApproved BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (productId) REFERENCES vendor_products(id) ON DELETE CASCADE,

  -- Index
  INDEX idx_product (productId),
  INDEX idx_type (imageType),
  INDEX idx_order (sortOrder)
);

-- Table des catégories de produits
CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  categoryName VARCHAR(100) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (productId) REFERENCES vendor_products(id) ON DELETE CASCADE,

  -- Index
  INDEX idx_product (productId),
  INDEX idx_category (categoryName)
);

-- Table des logs de validation (pour traçabilité)
CREATE TABLE IF NOT EXISTS validation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  adminId INT NOT NULL,
  action ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'RESUBMITTED') NOT NULL,
  reason TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (productId) REFERENCES vendor_products(id),

  -- Index
  INDEX idx_product (productId),
  INDEX idx_admin (adminId),
  INDEX idx_timestamp (timestamp)
);

-- Table des admins (pour référence)
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  role ENUM('ADMIN', 'SUPER_ADMIN') DEFAULT 'ADMIN',
  isActive BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================================================
-- DONNÉES DE TEST
-- ========================================================================

-- Insérer quelques vendeurs de test
INSERT INTO vendors (firstName, lastName, email, shop_name) VALUES
('Jean', 'Dupont', 'jean.dupont@example.com', 'Boutique Jean'),
('Marie', 'Martin', 'marie.martin@example.com', 'Design Studio Marie'),
('Pierre', 'Leroy', 'pierre.leroy@example.com', 'Vintage Style');

-- Insérer des produits admin de base
INSERT INTO admin_products (name, description, category, basePrice) VALUES
('T-Shirt Basique', 'T-shirt en coton 100% qualité premium', 'Vêtements', 15000),
('Mug Céramique', 'Mug en céramique blanche 325ml', 'Maison', 8000),
('Hoodie Premium', 'Sweat à capuche premium en coton bio', 'Vêtements', 35000),
('Casquette Snapback', 'Casquette ajustable style streetwear', 'Accessoires', 12000);

-- Insérer quelques designs de test
INSERT INTO designs (name, vendorId, imageUrl) VALUES
('Design Cool Abstract', 1, 'https://res.cloudinary.com/demo/image/upload/v1/design1.jpg'),
('Logo Vintage', 2, 'https://res.cloudinary.com/demo/image/upload/v1/design2.jpg'),
('Pattern Géométrique', 3, 'https://res.cloudinary.com/demo/image/upload/v1/design3.jpg');

-- Insérer des produits en attente de validation
INSERT INTO vendor_products (vendorId, name, description, price, status, designId, baseProductId, submittedAt) VALUES
-- WIZARD Products (designId = NULL)
(1, 'T-Shirt Personnalisé Vendeur A', 'T-shirt avec design unique uploadé par le vendeur', 25000, 'PENDING_VALIDATION', NULL, 1, NOW()),
(3, 'Hoodie Vintage Personnalisé', 'Hoodie avec motifs vintage exclusifs', 45000, 'PENDING_VALIDATION', NULL, 3, DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- TRADITIONAL Products (avec designId)
(2, 'Mug avec Design Cool', 'Mug avec design abstrait appliqué', 15000, 'PENDING_VALIDATION', 1, 2, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'Casquette Logo Vintage', 'Casquette avec logo vintage stylé', 18000, 'PENDING_VALIDATION', 2, 4, DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- Insérer des images vendeur pour les produits WIZARD
INSERT INTO vendor_images (productId, cloudinaryUrl, cloudinaryPublicId, imageType, colorName, colorCode, sortOrder) VALUES
-- Images pour T-Shirt Personnalisé (productId = 1)
(1, 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-white.jpg', 'tshirt-white', 'base', 'Blanc', '#FFFFFF', 1),
(1, 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-black.jpg', 'tshirt-black', 'base', 'Noir', '#000000', 2),
(1, 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-detail.jpg', 'tshirt-detail', 'detail', 'Blanc', '#FFFFFF', 3),

-- Images pour Hoodie Vintage (productId = 2)
(2, 'https://res.cloudinary.com/demo/image/upload/v1/hoodie-vintage-front.jpg', 'hoodie-vintage-front', 'base', 'Marron', '#8B4513', 1),
(2, 'https://res.cloudinary.com/demo/image/upload/v1/hoodie-vintage-back.jpg', 'hoodie-vintage-back', 'detail', 'Marron', '#8B4513', 2),
(2, 'https://res.cloudinary.com/demo/image/upload/v1/hoodie-vintage-side.jpg', 'hoodie-vintage-side', 'reference', 'Marron', '#8B4513', 3);

-- Insérer des catégories pour les produits
INSERT INTO product_categories (productId, categoryName) VALUES
(1, 'T-Shirts'),
(1, 'Mode'),
(1, 'Personnalisé'),
(2, 'Hoodies'),
(2, 'Streetwear'),
(2, 'Vintage'),
(3, 'Mugs'),
(3, 'Maison'),
(3, 'Design'),
(4, 'Casquettes'),
(4, 'Accessoires'),
(4, 'Logo');

-- Insérer un admin de test
INSERT INTO admins (username, email, password_hash, firstName, lastName, role) VALUES
('admin', 'admin@printalma.com', '$2b$10$example_hash_here', 'Admin', 'Principal', 'SUPER_ADMIN');

-- ========================================================================
-- VUES UTILES POUR LES REQUÊTES
-- ========================================================================

-- Vue pour les produits en attente avec toutes les infos
CREATE VIEW v_pending_products AS
SELECT
  p.id,
  p.name,
  p.description,
  p.price,
  p.status,
  p.submittedAt,
  p.designId,
  p.baseProductId,

  -- Type de produit
  CASE WHEN p.designId IS NULL THEN 'WIZARD' ELSE 'TRADITIONAL' END as productType,

  -- Vendor info
  v.id as vendorId,
  v.firstName as vendorFirstName,
  v.lastName as vendorLastName,
  v.email as vendorEmail,
  v.shop_name as vendorShopName,

  -- Base product info
  ap.name as adminProductName,
  ap.category as adminProductCategory,

  -- Design info (pour TRADITIONAL)
  d.name as designName,
  d.imageUrl as designImageUrl,

  -- Statistiques
  (SELECT COUNT(*) FROM vendor_images vi WHERE vi.productId = p.id) as imageCount,
  (SELECT COUNT(*) FROM product_categories pc WHERE pc.productId = p.id) as categoryCount

FROM vendor_products p
LEFT JOIN vendors v ON p.vendorId = v.id
LEFT JOIN admin_products ap ON p.baseProductId = ap.id
LEFT JOIN designs d ON p.designId = d.id

WHERE p.status = 'PENDING_VALIDATION'
ORDER BY p.submittedAt DESC;

-- Vue pour les statistiques admin
CREATE VIEW v_validation_stats AS
SELECT
  COUNT(*) as totalProducts,
  SUM(CASE WHEN status = 'PENDING_VALIDATION' THEN 1 ELSE 0 END) as pendingValidation,
  SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
  SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published,

  -- Par type
  SUM(CASE WHEN designId IS NULL THEN 1 ELSE 0 END) as wizardProducts,
  SUM(CASE WHEN designId IS NOT NULL THEN 1 ELSE 0 END) as traditionalProducts,

  -- En attente par type
  SUM(CASE WHEN designId IS NULL AND status = 'PENDING_VALIDATION' THEN 1 ELSE 0 END) as pendingWizard,
  SUM(CASE WHEN designId IS NOT NULL AND status = 'PENDING_VALIDATION' THEN 1 ELSE 0 END) as pendingTraditional

FROM vendor_products;

-- ========================================================================
-- PROCÉDURES STOCKÉES UTILES
-- ========================================================================

DELIMITER //

-- Procédure pour approuver un produit
CREATE PROCEDURE ApproveProduct(
  IN p_productId INT,
  IN p_adminId INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Mettre à jour le produit
  UPDATE vendor_products
  SET
    status = 'APPROVED',
    validatedAt = NOW(),
    validatedBy = p_adminId,
    rejectionReason = NULL,
    isPublic = TRUE,
    publishedAt = NOW()
  WHERE id = p_productId;

  -- Logger l'action
  INSERT INTO validation_logs (productId, adminId, action, timestamp)
  VALUES (p_productId, p_adminId, 'APPROVED', NOW());

  COMMIT;
END //

-- Procédure pour rejeter un produit
CREATE PROCEDURE RejectProduct(
  IN p_productId INT,
  IN p_adminId INT,
  IN p_reason TEXT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Mettre à jour le produit
  UPDATE vendor_products
  SET
    status = 'REJECTED',
    validatedAt = NOW(),
    validatedBy = p_adminId,
    rejectionReason = p_reason,
    isPublic = FALSE
  WHERE id = p_productId;

  -- Logger l'action
  INSERT INTO validation_logs (productId, adminId, action, reason, timestamp)
  VALUES (p_productId, p_adminId, 'REJECTED', p_reason, NOW());

  COMMIT;
END //

DELIMITER ;

-- ========================================================================
-- INDEX POUR PERFORMANCE
-- ========================================================================

-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_vendor_products_status_submitted ON vendor_products(status, submittedAt);
CREATE INDEX idx_vendor_products_vendor_status ON vendor_products(vendorId, status);
CREATE INDEX idx_vendor_products_type_status ON vendor_products(designId, status);
CREATE INDEX idx_vendor_images_product_type ON vendor_images(productId, imageType);

-- Index pour les recherches textuelles
CREATE FULLTEXT INDEX idx_vendor_products_search ON vendor_products(name, description);
CREATE FULLTEXT INDEX idx_vendors_search ON vendors(firstName, lastName, shop_name);

-- ========================================================================
-- TRIGGERS POUR COHÉRENCE DES DONNÉES
-- ========================================================================

DELIMITER //

-- Trigger pour auto-calculer sortOrder des images
CREATE TRIGGER tr_vendor_images_sort_order
BEFORE INSERT ON vendor_images
FOR EACH ROW
BEGIN
  IF NEW.sortOrder = 0 THEN
    SET NEW.sortOrder = (
      SELECT COALESCE(MAX(sortOrder), 0) + 1
      FROM vendor_images
      WHERE productId = NEW.productId
    );
  END IF;
END //

-- Trigger pour mettre à jour la date de modification
CREATE TRIGGER tr_vendor_products_updated
BEFORE UPDATE ON vendor_products
FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END //

DELIMITER ;

-- ========================================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ========================================================================

-- Ce schéma supporte :
-- ✅ Produits WIZARD (sans design, avec images vendeur)
-- ✅ Produits TRADITIONAL (avec design, images générées)
-- ✅ Workflow de validation complet
-- ✅ Traçabilité des actions admin
-- ✅ Performance optimisée avec index
-- ✅ Vues pour simplifier les requêtes
-- ✅ Procédures stockées pour les opérations complexes
-- ✅ Triggers pour maintenir la cohérence

-- Pour déployer :
-- mysql -u root -p < schema.sql