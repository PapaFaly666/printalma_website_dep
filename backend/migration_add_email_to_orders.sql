-- ========================================================================
-- MIGRATION : Ajout de la colonne EMAIL dans la table orders
-- ========================================================================
-- Cette migration ajoute le champ email à la table orders pour permettre
-- l'enregistrement de l'email du client lors de la création de commande
-- ========================================================================

-- Vérifier que nous sommes sur la bonne base de données
SELECT DATABASE() as 'Current Database';

-- ========================================================================
-- ÉTAPE 1 : Ajouter la colonne EMAIL
-- ========================================================================

-- Vérifier si la colonne existe déjà
SET @dbname = DATABASE();
SET @tablename = 'orders';
SET @columnname = 'email';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_schema = @dbname
     AND table_name = @tablename
     AND column_name = @columnname) = 0,
  'ALTER TABLE orders ADD COLUMN email VARCHAR(255) AFTER phoneNumber',
  'SELECT "⚠️  Column email already exists in orders table" as Status'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ========================================================================
-- ÉTAPE 2 : Mettre à jour la vue v_vendor_orders
-- ========================================================================

-- Supprimer l'ancienne vue si elle existe
DROP VIEW IF EXISTS v_vendor_orders;

-- Créer la nouvelle vue avec toutes les informations nécessaires
CREATE VIEW v_vendor_orders AS
SELECT
  -- Informations de commande
  o.id as orderId,
  o.orderNumber,
  o.status as orderStatus,
  o.totalAmount as orderTotalAmount,
  o.created_at as orderCreatedAt,
  o.updated_at as orderUpdatedAt,

  -- 🎯 Informations client (depuis la table orders)
  o.shippingName as customerName,
  o.phoneNumber as customerPhone,
  o.email as customerEmail,              -- 🎯 NOUVEAU CHAMP
  o.notes as customerNotes,

  -- 🎯 Adresse de livraison complète
  o.shippingStreet,
  o.shippingCity,
  o.shippingRegion,
  o.shippingPostalCode,
  o.shippingCountry,
  o.shippingAddressFull,

  -- Paiement
  o.paymentMethod,
  o.paymentStatus,
  o.transactionId,

  -- Articles de commande
  oi.id as orderItemId,
  oi.quantity,
  oi.unitPrice,
  oi.size,
  oi.color,
  oi.colorId,

  -- Produit vendeur
  vp.id as vendorProductId,
  vp.name as productName,
  vp.description as productDescription,
  vp.price as productPrice,
  vp.vendorId,

  -- Informations vendeur
  v.firstName as vendorFirstName,
  v.lastName as vendorLastName,
  v.email as vendorEmail,
  v.shop_name as vendorShopName,
  v.shop_description as vendorShopDescription,

  -- Produit base (admin)
  ap.id as baseProductId,
  ap.name as baseProductName,
  ap.category as baseProductCategory,

  -- Informations utilisateur (si utilisateur authentifié)
  u.email as userEmail,
  u.firstName as userFirstName,
  u.lastName as userLastName,
  u.role as userRole

FROM orders o
INNER JOIN order_items oi ON o.id = oi.orderId
INNER JOIN vendor_products vp ON oi.vendorProductId = vp.id
INNER JOIN users v ON vp.vendorId = v.id
LEFT JOIN admin_products ap ON vp.baseProductId = ap.id
LEFT JOIN users u ON o.userId = u.id
ORDER BY o.created_at DESC;

-- ========================================================================
-- ÉTAPE 3 : Vérifications
-- ========================================================================

-- Vérifier que la colonne email a bien été ajoutée
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'orders'
  AND column_name = 'email';

-- Vérifier que la vue a bien été créée
SELECT COUNT(*) as view_exists
FROM INFORMATION_SCHEMA.VIEWS
WHERE table_schema = DATABASE()
  AND table_name = 'v_vendor_orders';

-- Afficher un exemple de données de la vue (si des commandes existent)
SELECT
  'Vue v_vendor_orders créée avec succès' as Status,
  COUNT(*) as total_orders
FROM v_vendor_orders;

-- ========================================================================
-- RÉSUMÉ DE LA MIGRATION
-- ========================================================================

SELECT '✅ Migration terminée avec succès' as Status;

SELECT
  '📋 Modifications apportées:' as '',
  '1. Colonne email ajoutée à la table orders' as '',
  '2. Vue v_vendor_orders mise à jour avec le champ email' as '',
  '3. Les vendeurs peuvent maintenant voir l\'email des clients' as '';

-- ========================================================================
-- NOTES IMPORTANTES
-- ========================================================================

-- 📝 Cette migration est IDEMPOTENTE :
--    - Elle vérifie si la colonne existe avant de l'ajouter
--    - Elle peut être exécutée plusieurs fois sans erreur
--
-- 🔄 Pour annuler cette migration (rollback) :
--    ALTER TABLE orders DROP COLUMN email;
--    (puis recréer l'ancienne vue v_vendor_orders)
--
-- ⚠️  Après cette migration, le backend DOIT être mis à jour pour :
--    1. Enregistrer l'email du client lors de la création de commande
--    2. Exposer l'email dans l'API GET /vendor/orders
--
-- 📍 Voir le guide complet dans :
--    backend/GUIDE-ENREGISTREMENT-INFOS-CLIENT.md

-- ========================================================================
-- FIN DE LA MIGRATION
-- ========================================================================
