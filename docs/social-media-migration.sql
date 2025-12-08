-- =====================================================
-- Migration pour ajouter les réseaux sociaux aux vendeurs
-- Base de données: PrintAlma
-- Version: 1.0
-- =====================================================

-- 1. Ajout des colonnes réseaux sociaux à la table vendors
-- =====================================================

-- Vérification si les colonnes n'existent pas déjà
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500) NULL AFTER shop_name,
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500) NULL AFTER facebook_url,
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500) NULL AFTER instagram_url,
ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(500) NULL AFTER twitter_url,
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500) NULL AFTER tiktok_url,
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500) NULL AFTER youtube_url;

-- 2. Index pour optimiser les requêtes (optionnel)
-- =====================================================

-- Créer des index si nécessaire pour les performances
CREATE INDEX IF NOT EXISTS idx_vendors_facebook ON vendors(facebook_url) WHERE facebook_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_instagram ON vendors(instagram_url) WHERE instagram_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_twitter ON vendors(twitter_url) WHERE twitter_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_tiktok ON vendors(tiktok_url) WHERE tiktok_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_youtube ON vendors(youtube_url) WHERE youtube_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_linkedin ON vendors(linkedin_url) WHERE linkedin_url IS NOT NULL;

-- 3. Contraintes de validation (MySQL 8.0+ / PostgreSQL)
-- =====================================================

-- Pour MySQL 8.0+
ALTER TABLE vendors
ADD CONSTRAINT chk_facebook_url
CHECK (facebook_url IS NULL OR facebook_url REGEXP '^https?://(www\\.)?(facebook\\.com|fb\\.com)/.+'),
ADD CONSTRAINT chk_instagram_url
CHECK (instagram_url IS NULL OR instagram_url REGEXP '^https?://(www\\.)?(instagram\\.com|instagr\\.am)/.+'),
ADD CONSTRAINT chk_twitter_url
CHECK (twitter_url IS NULL OR twitter_url REGEXP '^https?://(www\\.)?(twitter\\.com|x\\.com)/.+'),
ADD CONSTRAINT chk_tiktok_url
CHECK (tiktok_url IS NULL OR tiktok_url REGEXP '^https?://(www\\.)?tiktok\\.com/@.+'),
ADD CONSTRAINT chk_youtube_url
CHECK (youtube_url IS NULL OR youtube_url REGEXP '^https?://(www\\.)?(youtube\\.com/(channel|c|user)/.+|youtu\\.be/.+)'),
ADD CONSTRAINT chk_linkedin_url
CHECK (linkedin_url IS NULL OR linkedin_url REGEXP '^https?://(www\\.)?linkedin\\.com/(in|company)/.+');

-- Pour PostgreSQL
-- ALTER TABLE vendors
-- ADD CONSTRAINT chk_facebook_url
-- CHECK (facebook_url IS NULL OR facebook_url ~ '^https?://(www\.)?(facebook\.com|fb\.com)/.+'),
-- ADD CONSTRAINT chk_instagram_url
-- CHECK (instagram_url IS NULL OR instagram_url ~ '^https?://(www\.)?(instagram\.com|instagr\.am)/.+'),
-- ADD CONSTRAINT chk_twitter_url
-- CHECK (twitter_url IS NULL OR twitter_url ~ '^https?://(www\.)?(twitter\.com|x\.com)/.+'),
-- ADD CONSTRAINT chk_tiktok_url
-- CHECK (tiktok_url IS NULL OR tiktok_url ~ '^https?://(www\.)?tiktok\.com/@.+'),
-- ADD CONSTRAINT chk_youtube_url
-- CHECK (youtube_url IS NULL OR youtube_url ~ '^https?://(www\.)?(youtube\.com/(channel|c|user)/.+|youtu\.be/.+)'),
-- ADD CONSTRAINT chk_linkedin_url
-- CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https?://(www\.)?linkedin\.com/(in|company)/.+');

-- 4. Trigger pour validation automatique (MySQL)
-- =====================================================

DELIMITER //

-- Trigger pour valider les URLs Facebook
CREATE TRIGGER validate_facebook_url
BEFORE INSERT ON vendors
FOR EACH ROW
BEGIN
    IF NEW.facebook_url IS NOT NULL AND NEW.facebook_url NOT REGEXP '^https?://(www\\.)?(facebook\\.com|fb\\.com)/.+' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'URL Facebook invalide';
    END IF;
END //

CREATE TRIGGER validate_facebook_url_update
BEFORE UPDATE ON vendors
FOR EACH ROW
BEGIN
    IF NEW.facebook_url IS NOT NULL AND NEW.facebook_url NOT REGEXP '^https?://(www\\.)?(facebook\\.com|fb\\.com)/.+' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'URL Facebook invalide';
    END IF;
END //

DELIMITER ;

-- 5. Requêtes de test et validation
-- =====================================================

-- Insérer un vendeur de test avec réseaux sociaux
INSERT INTO vendors (
    user_id,
    shop_name,
    phone,
    country,
    address,
    facebook_url,
    instagram_url,
    twitter_url,
    tiktok_url,
    youtube_url,
    linkedin_url,
    created_at,
    updated_at
) VALUES (
    1,
    'Boutique Test',
    '+221 77 123 45 67',
    'Sénégal',
    'Dakar',
    'https://facebook.com/boutiquetest',
    'https://instagram.com/@boutiquetest',
    'https://x.com/boutiquetest',
    'https://tiktok.com/@boutiquetest',
    'https://youtube.com/channel/boutiquetest',
    'https://linkedin.com/company/boutiquetest',
    NOW(),
    NOW()
);

-- Tester la mise à jour
UPDATE vendors
SET
    facebook_url = 'https://facebook.com/nouvelleboutique',
    instagram_url = 'https://instagram.com/@nouvelleboutique'
WHERE user_id = 1;

-- Vérifier les données
SELECT
    user_id,
    shop_name,
    facebook_url,
    instagram_url,
    twitter_url,
    tiktok_url,
    youtube_url,
    linkedin_url,
    updated_at
FROM vendors
WHERE user_id = 1;

-- 6. Requêtes de reporting (utiles pour l'administration)
-- =====================================================

-- Vendeurs avec au moins un réseau social
SELECT
    COUNT(*) as total_vendors_with_social,
    COUNT(CASE WHEN facebook_url IS NOT NULL THEN 1 END) as with_facebook,
    COUNT(CASE WHEN instagram_url IS NOT NULL THEN 1 END) as with_instagram,
    COUNT(CASE WHEN twitter_url IS NOT NULL THEN 1 END) as with_twitter,
    COUNT(CASE WHEN tiktok_url IS NOT NULL THEN 1 END) as with_tiktok,
    COUNT(CASE WHEN youtube_url IS NOT NULL THEN 1 END) as with_youtube,
    COUNT(CASE WHEN linkedin_url IS NOT NULL THEN 1 END) as with_linkedin
FROM vendors
WHERE
    facebook_url IS NOT NULL OR
    instagram_url IS NOT NULL OR
    twitter_url IS NOT NULL OR
    tiktok_url IS NOT NULL OR
    youtube_url IS NOT NULL OR
    linkedin_url IS NOT NULL;

-- 7. Script de rollback (en cas de problème)
-- =====================================================

-- Supprimer les contraintes (MySQL)
-- ALTER TABLE vendors DROP CONSTRAINT chk_facebook_url;
-- ALTER TABLE vendors DROP CONSTRAINT chk_instagram_url;
-- ALTER TABLE vendors DROP CONSTRAINT chk_twitter_url;
-- ALTER TABLE vendors DROP CONSTRAINT chk_tiktok_url;
-- ALTER TABLE vendors DROP CONSTRAINT chk_youtube_url;
-- ALTER TABLE vendors DROP CONSTRAINT chk_linkedin_url;

-- Supprimer les triggers
-- DROP TRIGGER IF EXISTS validate_facebook_url;
-- DROP TRIGGER IF EXISTS validate_facebook_url_update;

-- Supprimer les index
-- DROP INDEX IF EXISTS idx_vendors_facebook ON vendors;
-- DROP INDEX IF EXISTS idx_vendors_instagram ON vendors;
-- DROP INDEX IF EXISTS idx_vendors_twitter ON vendors;
-- DROP INDEX IF EXISTS idx_vendors_tiktok ON vendors;
-- DROP INDEX IF EXISTS idx_vendors_youtube ON vendors;
-- DROP INDEX IF EXISTS idx_vendors_linkedin ON vendors;

-- Supprimer les colonnes (ATTENTION: cela effacera les données!)
-- ALTER TABLE vendors DROP COLUMN facebook_url;
-- ALTER TABLE vendors DROP COLUMN instagram_url;
-- ALTER TABLE vendors DROP COLUMN twitter_url;
-- ALTER TABLE vendors DROP COLUMN tiktok_url;
-- ALTER TABLE vendors DROP COLUMN youtube_url;
-- ALTER TABLE vendors DROP COLUMN linkedin_url;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================