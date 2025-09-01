-- ===============================================
-- 🗄️ CASCADE VALIDATION - SETUP BASE DE DONNÉES
-- ===============================================
-- Script pour préparer la base de données pour le système cascade validation
-- À exécuter avant l'implémentation du backend

-- ===============================================
-- 1. CRÉATION TABLE DE LIAISON DESIGN-PRODUIT
-- ===============================================

-- Créer la table de liaison si elle n'existe pas
CREATE TABLE IF NOT EXISTS design_product_links (
    id INT PRIMARY KEY AUTO_INCREMENT,
    design_id INT NOT NULL,
    vendor_product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Contraintes de clés étrangères
    FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE,
    
    -- Éviter les doublons
    UNIQUE KEY unique_design_product (design_id, vendor_product_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_design_links ON design_product_links(design_id);
CREATE INDEX IF NOT EXISTS idx_product_links ON design_product_links(vendor_product_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON design_product_links(created_at);

-- ===============================================
-- 2. MISE À JOUR TABLE VENDOR_PRODUCTS
-- ===============================================

-- Ajouter les colonnes manquantes pour le système cascade
ALTER TABLE vendor_products 
ADD COLUMN IF NOT EXISTS workflow VARCHAR(20) DEFAULT 'MANUAL-PUBLISH' COMMENT 'AUTO-PUBLISH ou MANUAL-PUBLISH',
ADD COLUMN IF NOT EXISTS postValidationAction VARCHAR(20) DEFAULT 'TO_DRAFT' COMMENT 'AUTO_PUBLISH ou TO_DRAFT',
ADD COLUMN IF NOT EXISTS isValidated BOOLEAN DEFAULT false COMMENT 'Design validé par admin',
ADD COLUMN IF NOT EXISTS readyToPublish BOOLEAN DEFAULT false COMMENT 'Prêt pour publication manuelle',
ADD COLUMN IF NOT EXISTS pendingAutoPublish BOOLEAN DEFAULT false COMMENT 'En attente auto-publication',
ADD COLUMN IF NOT EXISTS validatedAt TIMESTAMP NULL COMMENT 'Date de validation du design';

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_vendor_products_workflow ON vendor_products(workflow);
CREATE INDEX IF NOT EXISTS idx_vendor_products_validated ON vendor_products(isValidated);
CREATE INDEX IF NOT EXISTS idx_vendor_products_status ON vendor_products(status);
CREATE INDEX IF NOT EXISTS idx_vendor_products_ready_publish ON vendor_products(readyToPublish);

-- ===============================================
-- 3. MISE À JOUR TABLE DESIGNS
-- ===============================================

-- Ajouter la colonne de date de validation si elle n'existe pas
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS validatedAt TIMESTAMP NULL COMMENT 'Date de validation par admin';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_designs_validated ON designs(isValidated);
CREATE INDEX IF NOT EXISTS idx_designs_validated_at ON designs(validatedAt);

-- ===============================================
-- 4. VUES UTILES POUR LE DEBUG
-- ===============================================

-- Vue pour voir tous les liens design-produit avec détails
CREATE OR REPLACE VIEW v_design_product_links AS
SELECT 
    dpl.id as link_id,
    dpl.design_id,
    d.name as design_name,
    d.isValidated as design_validated,
    d.validatedAt as design_validated_at,
    dpl.vendor_product_id,
    vp.vendor_name as product_name,
    vp.status as product_status,
    vp.workflow,
    vp.postValidationAction,
    vp.isValidated as product_validated,
    vp.readyToPublish,
    vp.pendingAutoPublish,
    vp.validatedAt as product_validated_at,
    dpl.created_at as link_created_at
FROM design_product_links dpl
INNER JOIN designs d ON dpl.design_id = d.id
INNER JOIN vendor_products vp ON dpl.vendor_product_id = vp.id
ORDER BY dpl.created_at DESC;

-- Vue pour les statistiques cascade validation
CREATE OR REPLACE VIEW v_cascade_stats AS
SELECT 
    d.id as design_id,
    d.name as design_name,
    d.isValidated as design_validated,
    COUNT(vp.id) as total_products,
    COUNT(CASE WHEN vp.isValidated = true THEN 1 END) as validated_products,
    COUNT(CASE WHEN vp.status = 'PUBLISHED' THEN 1 END) as published_products,
    COUNT(CASE WHEN vp.status = 'PENDING' THEN 1 END) as pending_products,
    COUNT(CASE WHEN vp.status = 'DRAFT' AND vp.readyToPublish = true THEN 1 END) as ready_to_publish,
    COUNT(CASE WHEN vp.workflow = 'AUTO-PUBLISH' THEN 1 END) as auto_publish_products,
    COUNT(CASE WHEN vp.workflow = 'MANUAL-PUBLISH' THEN 1 END) as manual_publish_products
FROM designs d
LEFT JOIN design_product_links dpl ON d.id = dpl.design_id
LEFT JOIN vendor_products vp ON dpl.vendor_product_id = vp.id
GROUP BY d.id, d.name, d.isValidated
ORDER BY d.id DESC;

-- ===============================================
-- 5. PROCÉDURES STOCKÉES UTILES
-- ===============================================

-- Procédure pour valider un design et tous ses produits
DELIMITER //
CREATE OR REPLACE PROCEDURE ValidateDesignCascade(IN design_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE product_id INT;
    DECLARE product_workflow VARCHAR(20);
    DECLARE product_status VARCHAR(20);
    
    -- Curseur pour parcourir tous les produits liés
    DECLARE product_cursor CURSOR FOR 
        SELECT vp.id, vp.workflow, vp.status
        FROM vendor_products vp
        INNER JOIN design_product_links dpl ON vp.id = dpl.vendor_product_id
        WHERE dpl.design_id = design_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Démarrer une transaction
    START TRANSACTION;
    
    -- 1. Valider le design
    UPDATE designs 
    SET isValidated = true, validatedAt = NOW() 
    WHERE id = design_id;
    
    -- 2. Parcourir et mettre à jour tous les produits liés
    OPEN product_cursor;
    
    read_loop: LOOP
        FETCH product_cursor INTO product_id, product_workflow, product_status;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Logique cascade selon le workflow
        IF product_workflow = 'AUTO-PUBLISH' THEN
            -- Auto-publication
            UPDATE vendor_products 
            SET isValidated = true,
                status = 'PUBLISHED',
                readyToPublish = false,
                pendingAutoPublish = false,
                validatedAt = NOW()
            WHERE id = product_id;
            
        ELSEIF product_workflow = 'MANUAL-PUBLISH' THEN
            -- Publication manuelle - prêt à publier
            UPDATE vendor_products 
            SET isValidated = true,
                status = 'DRAFT',
                readyToPublish = true,
                pendingAutoPublish = false,
                validatedAt = NOW()
            WHERE id = product_id;
        END IF;
        
    END LOOP;
    
    CLOSE product_cursor;
    
    -- Valider la transaction
    COMMIT;
    
    -- Retourner le nombre de produits mis à jour
    SELECT COUNT(*) as updated_products
    FROM vendor_products vp
    INNER JOIN design_product_links dpl ON vp.id = dpl.vendor_product_id
    WHERE dpl.design_id = design_id;
    
END //
DELIMITER ;

-- ===============================================
-- 6. FONCTIONS UTILES
-- ===============================================

-- Fonction pour compter les produits liés à un design
DELIMITER //
CREATE OR REPLACE FUNCTION CountProductsForDesign(design_id INT) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE product_count INT DEFAULT 0;
    
    SELECT COUNT(*)
    INTO product_count
    FROM design_product_links dpl
    WHERE dpl.design_id = design_id;
    
    RETURN product_count;
END //
DELIMITER ;

-- Fonction pour vérifier si un design peut être supprimé
DELIMITER //
CREATE OR REPLACE FUNCTION CanDeleteDesign(design_id INT) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE published_count INT DEFAULT 0;
    
    SELECT COUNT(*)
    INTO published_count
    FROM vendor_products vp
    INNER JOIN design_product_links dpl ON vp.id = dpl.vendor_product_id
    WHERE dpl.design_id = design_id AND vp.status = 'PUBLISHED';
    
    RETURN published_count = 0;
END //
DELIMITER ;

-- ===============================================
-- 7. TRIGGERS POUR MAINTENIR LA COHÉRENCE
-- ===============================================

-- Trigger pour nettoyer les liens quand un design est supprimé
DELIMITER //
CREATE OR REPLACE TRIGGER cleanup_design_links
BEFORE DELETE ON designs
FOR EACH ROW
BEGIN
    -- Vérifier si le design peut être supprimé
    IF NOT CanDeleteDesign(OLD.id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot delete design: has published products';
    END IF;
END //
DELIMITER ;

-- Trigger pour nettoyer les liens quand un produit est supprimé
DELIMITER //
CREATE OR REPLACE TRIGGER cleanup_product_links
AFTER DELETE ON vendor_products
FOR EACH ROW
BEGIN
    DELETE FROM design_product_links 
    WHERE vendor_product_id = OLD.id;
END //
DELIMITER ;

-- ===============================================
-- 8. DONNÉES DE TEST (OPTIONNEL)
-- ===============================================

-- Insérer quelques données de test si les tables sont vides
-- (Décommentez si nécessaire pour les tests)

/*
-- Test design
INSERT IGNORE INTO designs (id, name, description, imageUrl, price, isValidated, created_at) 
VALUES (999, 'Test Design Cascade', 'Design pour tester le système cascade', 'https://example.com/test.png', 500, false, NOW());

-- Test produit
INSERT IGNORE INTO vendor_products (id, base_product_id, vendor_name, vendor_description, vendor_price, status, workflow, postValidationAction, isValidated, readyToPublish, pendingAutoPublish, created_at)
VALUES (999, 1, 'Test Produit Cascade', 'Produit pour tester le système cascade', 2000, 'PENDING', 'AUTO-PUBLISH', 'AUTO_PUBLISH', false, false, true, NOW());

-- Test lien
INSERT IGNORE INTO design_product_links (design_id, vendor_product_id) 
VALUES (999, 999);
*/

-- ===============================================
-- 9. REQUÊTES DE VÉRIFICATION
-- ===============================================

-- Vérifier que toutes les tables existent
SELECT 
    TABLE_NAME,
    TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('designs', 'vendor_products', 'design_product_links');

-- Vérifier que toutes les colonnes existent
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'vendor_products'
AND COLUMN_NAME IN ('workflow', 'postValidationAction', 'isValidated', 'readyToPublish', 'pendingAutoPublish', 'validatedAt')
ORDER BY ORDINAL_POSITION;

-- Vérifier les index
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('design_product_links', 'vendor_products', 'designs')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ===============================================
-- 10. COMMANDES DE NETTOYAGE (SI NÉCESSAIRE)
-- ===============================================

-- À utiliser SEULEMENT si vous voulez tout réinitialiser
/*
-- Supprimer les données de test
DELETE FROM design_product_links WHERE design_id = 999 OR vendor_product_id = 999;
DELETE FROM vendor_products WHERE id = 999;
DELETE FROM designs WHERE id = 999;

-- Supprimer les vues
DROP VIEW IF EXISTS v_design_product_links;
DROP VIEW IF EXISTS v_cascade_stats;

-- Supprimer les procédures
DROP PROCEDURE IF EXISTS ValidateDesignCascade;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS CountProductsForDesign;
DROP FUNCTION IF EXISTS CanDeleteDesign;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS cleanup_design_links;
DROP TRIGGER IF EXISTS cleanup_product_links;

-- Supprimer la table de liaison
DROP TABLE IF EXISTS design_product_links;
*/

-- ===============================================
-- FIN DU SCRIPT
-- ===============================================

-- Afficher un message de confirmation
SELECT 'CASCADE VALIDATION DATABASE SETUP COMPLETED' as Status;

-- Afficher les statistiques finales
SELECT 
    (SELECT COUNT(*) FROM designs) as total_designs,
    (SELECT COUNT(*) FROM vendor_products) as total_products,
    (SELECT COUNT(*) FROM design_product_links) as total_links,
    NOW() as setup_completed_at; 