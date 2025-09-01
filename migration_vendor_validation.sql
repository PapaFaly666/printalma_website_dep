-- Migration pour le système de validation vendeur
-- À exécuter sur la base de données

-- 1. Ajouter les nouvelles colonnes à la table vendor_products
ALTER TABLE vendor_products 
ADD COLUMN post_validation_action ENUM('AUTO_PUBLISH', 'TO_DRAFT') DEFAULT 'AUTO_PUBLISH' AFTER status,
ADD COLUMN is_validated BOOLEAN DEFAULT FALSE AFTER post_validation_action,
ADD COLUMN validated_at TIMESTAMP NULL AFTER is_validated,
ADD COLUMN validated_by INT NULL AFTER validated_at,
ADD COLUMN rejection_reason TEXT NULL AFTER validated_by,
ADD COLUMN submitted_at TIMESTAMP NULL AFTER rejection_reason,
ADD COLUMN published_at TIMESTAMP NULL AFTER submitted_at;

-- 2. Ajouter les index pour optimiser les performances
CREATE INDEX idx_vendor_products_status ON vendor_products(status);
CREATE INDEX idx_vendor_products_validation ON vendor_products(is_validated, status);
CREATE INDEX idx_vendor_products_pending ON vendor_products(status, submitted_at);

-- 3. Ajouter la clé étrangère pour validated_by (optionnel)
ALTER TABLE vendor_products 
ADD CONSTRAINT fk_vendor_products_validated_by 
FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Mettre à jour les produits existants avec les valeurs par défaut
UPDATE vendor_products 
SET 
  post_validation_action = 'AUTO_PUBLISH',
  is_validated = CASE 
    WHEN status = 'PUBLISHED' THEN TRUE 
    ELSE FALSE 
  END,
  validated_at = CASE 
    WHEN status = 'PUBLISHED' THEN updated_at 
    ELSE NULL 
  END,
  published_at = CASE 
    WHEN status = 'PUBLISHED' THEN updated_at 
    ELSE NULL 
  END
WHERE post_validation_action IS NULL;

-- 5. Créer la table notifications si elle n'existe pas (optionnel)
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read),
  INDEX idx_notifications_type (type)
);

-- 6. Vérifier la structure finale
DESCRIBE vendor_products;

-- 7. Afficher un résumé des modifications
SELECT 
  'Migration terminée' as status,
  COUNT(*) as total_products,
  SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_products,
  SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_products,
  SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published_products,
  SUM(CASE WHEN is_validated = TRUE THEN 1 ELSE 0 END) as validated_products
FROM vendor_products; 
 