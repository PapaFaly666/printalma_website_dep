-- =================================
-- DONNÉES D'EXEMPLE - SYSTÈME DE GESTION DES COMMANDES VENDEUR
-- PrintAlma - Données de test et démonstration
-- =================================

-- Désactiver temporairement les contraintes de clés étrangères pour l'insertion
SET session_replication_role = replica;

-- =================================
-- 1. UTILISATEURS DE TEST
-- =================================

-- Suppression des données existantes (pour réinitialisation)
-- ATTENTION: À adapter selon votre environnement
-- DELETE FROM order_status_history;
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM notifications;
-- DELETE FROM vendor_profiles;
-- DELETE FROM users WHERE email LIKE '%@test.printalma%';

-- Utilisateurs clients
INSERT INTO users (id, first_name, last_name, email, password_hash, role, phone, email_verified, created_at) VALUES
(1000, 'Marie', 'Durand', 'marie.durand@test.printalma.com', '$2b$10$hashedpassword1', 'CLIENT', '+221771234567', true, '2024-01-10 08:00:00'),
(1001, 'Amadou', 'Ba', 'amadou.ba@test.printalma.com', '$2b$10$hashedpassword2', 'CLIENT', '+221769876543', true, '2024-01-11 09:15:00'),
(1002, 'Fatou', 'Sow', 'fatou.sow@test.printalma.com', '$2b$10$hashedpassword3', 'CLIENT', '+221774567890', true, '2024-01-12 10:30:00'),
(1003, 'Ousmane', 'Diallo', 'ousmane.diallo@test.printalma.com', '$2b$10$hashedpassword4', 'CLIENT', '+221783216547', true, '2024-01-13 14:20:00'),
(1004, 'Aïcha', 'Ndiaye', 'aicha.ndiaye@test.printalma.com', '$2b$10$hashedpassword5', 'CLIENT', '+221785432109', true, '2024-01-14 16:45:00')
ON CONFLICT (email) DO NOTHING;

-- Utilisateurs vendeurs
INSERT INTO users (id, first_name, last_name, email, password_hash, role, vendor_type, phone, email_verified, created_at) VALUES
(2000, 'Khadija', 'Design', 'khadija.design@test.printalma.com', '$2b$10$hashedpasswordvendor1', 'VENDEUR', 'DESIGNER', '+221776543210', true, '2024-01-05 12:00:00'),
(2001, 'Mamadou', 'Art', 'mamadou.art@test.printalma.com', '$2b$10$hashedpasswordvendor2', 'VENDEUR', 'ARTISTE', '+221778901234', true, '2024-01-06 13:30:00'),
(2002, 'Awa', 'Créative', 'awa.creative@test.printalma.com', '$2b$10$hashedpasswordvendor3', 'VENDEUR', 'DESIGNER', '+221775678901', true, '2024-01-07 15:15:00')
ON CONFLICT (email) DO NOTHING;

-- Utilisateur admin
INSERT INTO users (id, first_name, last_name, email, password_hash, role, phone, email_verified, created_at) VALUES
(3000, 'Admin', 'PrintAlma', 'admin@test.printalma.com', '$2b$10$hashedpasswordadmin', 'ADMIN', '+221701234567', true, '2024-01-01 10:00:00')
ON CONFLICT (email) DO NOTHING;

-- =================================
-- 2. PROFILS VENDEURS
-- =================================

INSERT INTO vendor_profiles (user_id, shop_name, business_description, business_address, commission_rate, status, created_at) VALUES
(2000, 'Khadija Design Studio', 'Créatrice de designs africains modernes et authentiques. Spécialisée dans les motifs wax contemporains.', 'Dakar, Plateau - Rue Amadou Assane Ndoye', 25.00, 'APPROVED', '2024-01-05 12:30:00'),
(2001, 'Mamadou Art Gallery', 'Artiste peintre et créateur de visuels uniques inspirés de la culture sénégalaise.', 'Saint-Louis - Île de Saint-Louis', 30.00, 'APPROVED', '2024-01-06 14:00:00'),
(2002, 'Awa Créative Designs', 'Studio de création graphique spécialisé dans les designs pour textiles et accessoires.', 'Thiès - Quartier Randoulène', 25.00, 'APPROVED', '2024-01-07 15:45:00')
ON CONFLICT (user_id) DO NOTHING;

-- =================================
-- 3. CATÉGORIES DE PRODUITS
-- =================================

INSERT INTO categories (id, name, description, is_active, created_at) VALUES
(1, 'Vêtements', 'T-shirts, hoodies, robes et autres vêtements personnalisés', true, '2024-01-01 10:00:00'),
(2, 'Accessoires', 'Casquettes, sacs, bijoux et accessoires de mode', true, '2024-01-01 10:00:00'),
(3, 'Maison & Déco', 'Mugs, coussins, tableaux et objets de décoration', true, '2024-01-01 10:00:00'),
(4, 'Papeterie', 'Carnets, agenda, cartes et articles de papeterie', true, '2024-01-01 10:00:00')
ON CONFLICT (id) DO NOTHING;

-- =================================
-- 4. COULEURS ET TAILLES
-- =================================

-- Couleurs
INSERT INTO product_colors (id, name, hex_code, is_active) VALUES
(1, 'Noir', '#000000', true),
(2, 'Blanc', '#FFFFFF', true),
(3, 'Rouge', '#FF0000', true),
(4, 'Bleu', '#0000FF', true),
(5, 'Vert', '#008000', true),
(6, 'Jaune', '#FFFF00', true),
(7, 'Rose', '#FFC0CB', true),
(8, 'Gris', '#808080', true)
ON CONFLICT (id) DO NOTHING;

-- Tailles
INSERT INTO product_sizes (id, name, description, sort_order, is_active) VALUES
(1, 'XS', 'Extra Small', 1, true),
(2, 'S', 'Small', 2, true),
(3, 'M', 'Medium', 3, true),
(4, 'L', 'Large', 4, true),
(5, 'XL', 'Extra Large', 5, true),
(6, 'XXL', '2X Large', 6, true),
(7, 'UNIQUE', 'Taille unique', 7, true)
ON CONFLICT (id) DO NOTHING;

-- =================================
-- 5. PRODUITS EXEMPLE
-- =================================

INSERT INTO products (id, name, description, price, cost_price, vendor_id, category_id, design_name, design_description, status, is_active, slug, stock_quantity, created_at, approved_at, approved_by) VALUES
(1, 'T-shirt Design Afrique Authentique', 'T-shirt en coton bio avec un design africain authentique. Motifs inspirés des traditions sénégalaises.', 17500, 8000, 2000, 1, 'Motif Wax Traditionnel', 'Design inspiré des motifs wax traditionnels du Sénégal avec des couleurs vives et des formes géométriques.', 'APPROVED', true, 't-shirt-design-afrique-authentique', 50, '2024-01-08 10:00:00', '2024-01-08 14:00:00', 3000),

(2, 'Hoodie Premium Baobab', 'Hoodie premium avec design unique du baobab sénégalais. Coton bio, coupe moderne.', 28000, 15000, 2000, 1, 'Baobab Majestueux', 'Illustration artistique du baobab, arbre emblématique du Sénégal, dans un style moderne et épuré.', 'APPROVED', true, 'hoodie-premium-baobab', 30, '2024-01-08 11:00:00', '2024-01-08 15:00:00', 3000),

(3, 'Mug Téranga Sénégal', 'Mug en céramique avec design Téranga (hospitalité sénégalaise). Parfait pour le café ou thé.', 14000, 6000, 2001, 3, 'Téranga Spirit', 'Design célébrant l\'hospitalité sénégalaise avec des éléments culturels et des couleurs du drapeau.', 'APPROVED', true, 'mug-teranga-senegal', 100, '2024-01-09 09:00:00', '2024-01-09 16:00:00', 3000),

(4, 'Casquette Design Wax', 'Casquette ajustable avec motif wax coloré. Style urban et authentique africain.', 12500, 5500, 2002, 2, 'Wax Urban Style', 'Motif wax moderne adapté pour le style streetwear, alliant tradition et modernité.', 'APPROVED', true, 'casquette-design-wax', 75, '2024-01-09 10:30:00', '2024-01-09 17:00:00', 3000),

(5, 'Tote Bag Artisanal', 'Sac en toile naturelle avec design artisanal sénégalais. Écologique et résistant.', 19000, 9000, 2001, 2, 'Art Sénégalais', 'Design mettant en valeur l\'artisanat traditionnel sénégalais avec des motifs brodés stylisés.', 'APPROVED', true, 'tote-bag-artisanal', 40, '2024-01-10 08:30:00', '2024-01-10 18:00:00', 3000),

(6, 'Coussin Déco Casamance', 'Coussin décoratif 40x40cm avec motifs inspirés de la Casamance. Tissu premium.', 22000, 11000, 2002, 3, 'Casamance Dreams', 'Design inspiré des paysages et de la culture de la Casamance, région du sud du Sénégal.', 'APPROVED', true, 'coussin-deco-casamance', 25, '2024-01-10 14:00:00', '2024-01-10 19:00:00', 3000),

(7, 'Carnet Dakar Vibes', 'Carnet de notes A5 avec couverture design Dakar. 120 pages lignées, papier recyclé.', 8500, 3500, 2000, 4, 'Dakar Cityscape', 'Illustration moderne de Dakar avec ses monuments emblématiques et son dynamisme urbain.', 'APPROVED', true, 'carnet-dakar-vibes', 80, '2024-01-11 09:15:00', '2024-01-11 16:30:00', 3000),

(8, 'T-shirt Femme Empowerment', 'T-shirt femme avec message d\'empowerment en français et wolof. Coupe féminine, coton doux.', 16000, 7500, 2001, 1, 'Femme Forte', 'Design célébrant la force des femmes africaines avec typographie moderne et symboles culturels.', 'APPROVED', true, 't-shirt-femme-empowerment', 60, '2024-01-11 11:45:00', '2024-01-11 17:15:00', 3000)
ON CONFLICT (id) DO NOTHING;

-- =================================
-- 6. VARIANTES PRODUITS (Couleurs et Tailles)
-- =================================

-- Variantes couleurs pour le T-shirt Design Afrique
INSERT INTO product_color_variants (product_id, color_id, stock_quantity, is_available) VALUES
(1, 1, 15, true), -- Noir
(1, 2, 10, true), -- Blanc
(1, 3, 8, true),  -- Rouge
(1, 4, 12, true), -- Bleu
(1, 5, 5, true)   -- Vert
ON CONFLICT (product_id, color_id) DO NOTHING;

-- Variantes tailles pour le T-shirt Design Afrique
INSERT INTO product_size_variants (product_id, size_id, stock_quantity, is_available) VALUES
(1, 2, 8, true),  -- S
(1, 3, 15, true), -- M
(1, 4, 12, true), -- L
(1, 5, 10, true), -- XL
(1, 6, 5, true)   -- XXL
ON CONFLICT (product_id, size_id) DO NOTHING;

-- Variantes pour le Hoodie
INSERT INTO product_color_variants (product_id, color_id, stock_quantity, is_available) VALUES
(2, 1, 8, true),  -- Noir
(2, 2, 6, true),  -- Blanc
(2, 8, 10, true), -- Gris
(2, 4, 6, true)   -- Bleu
ON CONFLICT (product_id, color_id) DO NOTHING;

INSERT INTO product_size_variants (product_id, size_id, stock_quantity, is_available) VALUES
(2, 3, 8, true),  -- M
(2, 4, 10, true), -- L
(2, 5, 8, true),  -- XL
(2, 6, 4, true)   -- XXL
ON CONFLICT (product_id, size_id) DO NOTHING;

-- Variantes pour la Casquette (taille unique, plusieurs couleurs)
INSERT INTO product_color_variants (product_id, color_id, stock_quantity, is_available) VALUES
(4, 1, 20, true), -- Noir
(4, 2, 15, true), -- Blanc
(4, 3, 10, true), -- Rouge
(4, 4, 15, true), -- Bleu
(4, 8, 15, true)  -- Gris
ON CONFLICT (product_id, color_id) DO NOTHING;

INSERT INTO product_size_variants (product_id, size_id, stock_quantity, is_available) VALUES
(4, 7, 75, true) -- Taille unique
ON CONFLICT (product_id, size_id) DO NOTHING;

-- =================================
-- 7. COMMANDES EXEMPLE
-- =================================

-- Commande 1: Marie Durand - En traitement
INSERT INTO orders (id, order_number, user_id, status, total_amount, subtotal, tax_amount, shipping_amount, payment_method, shipping_address, phone_number, notes, created_at, updated_at, confirmed_at, processed_at) VALUES
(1, 'CMD-2024-01-0001', 1000, 'PROCESSING', 35000, 31500, 0, 3500, 'MOBILE_MONEY',
'{"name":"Marie Durand","firstName":"Marie","lastName":"Durand","street":"123 Rue de la Paix","city":"Dakar","region":"Dakar","country":"Sénégal","fullFormatted":"123 Rue de la Paix, Dakar, Sénégal","phone":"+221771234567"}',
'+221771234567', 'Livraison urgente s''il vous plaît. Appelez avant la livraison.',
'2024-01-15 10:30:00', '2024-01-16 14:20:00', '2024-01-15 11:00:00', '2024-01-16 14:20:00')
ON CONFLICT (id) DO NOTHING;

-- Articles de la commande 1
INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, color, color_id, size_id, product_name, product_description, product_image_url, design_name, design_image_url, vendor_id) VALUES
(1, 1, 2, 17500, 'M', 'Noir', 1, 3, 'T-shirt Design Afrique Authentique', 'T-shirt en coton bio avec un design africain authentique', 'https://via.placeholder.com/300', 'Motif Wax Traditionnel', 'https://via.placeholder.com/200', 2000)
ON CONFLICT DO NOTHING;

-- Commande 2: Amadou Ba - Expédiée
INSERT INTO orders (id, order_number, user_id, status, total_amount, subtotal, tax_amount, shipping_amount, payment_method, shipping_address, phone_number, tracking_number, carrier, created_at, updated_at, confirmed_at, processed_at, shipped_at) VALUES
(2, 'CMD-2024-01-0002', 1001, 'SHIPPED', 28000, 25500, 0, 2500, 'WAVE',
'{"name":"Amadou Ba","firstName":"Amadou","lastName":"Ba","street":"45 Avenue Bourguiba","city":"Thiès","region":"Thiès","country":"Sénégal","fullFormatted":"45 Avenue Bourguiba, Thiès, Sénégal","phone":"+221769876543"}',
'+221769876543', 'TRK123456789', 'DHL Sénégal',
'2024-01-14 14:20:00', '2024-01-17 09:15:00', '2024-01-14 15:00:00', '2024-01-16 10:30:00', '2024-01-17 09:15:00')
ON CONFLICT (id) DO NOTHING;

-- Articles de la commande 2
INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, color, color_id, size_id, product_name, product_description, product_image_url, design_name, design_image_url, vendor_id) VALUES
(2, 2, 1, 28000, 'L', 'Gris', 8, 4, 'Hoodie Premium Baobab', 'Hoodie premium avec design unique du baobab sénégalais', 'https://via.placeholder.com/300', 'Baobab Majestueux', 'https://via.placeholder.com/200', 2000)
ON CONFLICT DO NOTHING;

-- Commande 3: Fatou Sow - Livrée
INSERT INTO orders (id, order_number, user_id, status, total_amount, subtotal, tax_amount, shipping_amount, payment_method, shipping_address, phone_number, tracking_number, created_at, updated_at, confirmed_at, processed_at, shipped_at, delivered_at) VALUES
(3, 'CMD-2024-01-0003', 1002, 'DELIVERED', 42000, 39000, 0, 3000, 'CASH_ON_DELIVERY',
'{"name":"Fatou Sow","firstName":"Fatou","lastName":"Sow","street":"78 Rue Victor Hugo","city":"Saint-Louis","region":"Saint-Louis","country":"Sénégal","fullFormatted":"78 Rue Victor Hugo, Saint-Louis, Sénégal","phone":"+221774567890"}',
'+221774567890', 'TRK987654321',
'2024-01-10 16:45:00', '2024-01-18 11:30:00', '2024-01-10 17:00:00', '2024-01-12 09:00:00', '2024-01-15 14:20:00', '2024-01-18 11:30:00')
ON CONFLICT (id) DO NOTHING;

-- Articles de la commande 3 (commande multiple)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, color, color_id, size_id, product_name, product_description, product_image_url, design_name, design_image_url, vendor_id) VALUES
(3, 3, 3, 14000, NULL, NULL, NULL, NULL, 'Mug Téranga Sénégal', 'Mug en céramique avec design Téranga', 'https://via.placeholder.com/300', 'Téranga Spirit', 'https://via.placeholder.com/200', 2001)
ON CONFLICT DO NOTHING;

-- Commande 4: Ousmane Diallo - En attente
INSERT INTO orders (id, order_number, user_id, status, total_amount, subtotal, tax_amount, shipping_amount, payment_method, shipping_address, phone_number, notes, created_at, updated_at) VALUES
(4, 'CMD-2024-01-0004', 1003, 'PENDING', 25000, 22500, 0, 2500, 'MOBILE_MONEY',
'{"name":"Ousmane Diallo","firstName":"Ousmane","lastName":"Diallo","street":"12 Boulevard de la République","city":"Kaolack","region":"Kaolack","country":"Sénégal","fullFormatted":"12 Boulevard de la République, Kaolack, Sénégal","phone":"+221783216547"}',
'+221783216547', 'Merci de bien emballer le produit.',
'2024-01-19 08:15:00', '2024-01-19 08:15:00')
ON CONFLICT (id) DO NOTHING;

-- Articles de la commande 4
INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, color, color_id, size_id, product_name, product_description, product_image_url, design_name, design_image_url, vendor_id) VALUES
(4, 4, 2, 12500, 'UNIQUE', 'Noir', 1, 7, 'Casquette Design Wax', 'Casquette ajustable avec motif wax coloré', 'https://via.placeholder.com/300', 'Wax Urban Style', 'https://via.placeholder.com/200', 2002)
ON CONFLICT DO NOTHING;

-- Commande 5: Aïcha Ndiaye - Confirmée
INSERT INTO orders (id, order_number, user_id, status, total_amount, subtotal, tax_amount, shipping_amount, payment_method, shipping_address, phone_number, created_at, updated_at, confirmed_at) VALUES
(5, 'CMD-2024-01-0005', 1004, 'CONFIRMED', 57000, 54000, 0, 3000, 'BANK_TRANSFER',
'{"name":"Aïcha Ndiaye","firstName":"Aïcha","lastName":"Ndiaye","street":"25 Rue de Thiong","city":"Dakar","region":"Dakar","country":"Sénégal","fullFormatted":"25 Rue de Thiong, Dakar, Sénégal","phone":"+221785432109"}',
'+221785432109',
'2024-01-18 13:25:00', '2024-01-18 16:40:00', '2024-01-18 16:40:00')
ON CONFLICT (id) DO NOTHING;

-- Articles de la commande 5 (commande mixte multi-vendeurs)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, color, color_id, size_id, product_name, product_description, product_image_url, design_name, design_image_url, vendor_id) VALUES
(5, 5, 1, 19000, NULL, NULL, NULL, NULL, 'Tote Bag Artisanal', 'Sac en toile naturelle avec design artisanal sénégalais', 'https://via.placeholder.com/300', 'Art Sénégalais', 'https://via.placeholder.com/200', 2001),
(5, 6, 1, 22000, NULL, NULL, NULL, NULL, 'Coussin Déco Casamance', 'Coussin décoratif 40x40cm avec motifs inspirés de la Casamance', 'https://via.placeholder.com/300', 'Casamance Dreams', 'https://via.placeholder.com/200', 2002),
(5, 8, 1, 16000, 'M', 'Rose', 7, 3, 'T-shirt Femme Empowerment', 'T-shirt femme avec message d\'empowerment', 'https://via.placeholder.com/300', 'Femme Forte', 'https://via.placeholder.com/200', 2001)
ON CONFLICT DO NOTHING;

-- Commande 6: Marie Durand (commande récente) - Confirmée
INSERT INTO orders (id, order_number, user_id, status, total_amount, subtotal, tax_amount, shipping_amount, payment_method, shipping_address, phone_number, notes, created_at, updated_at, confirmed_at) VALUES
(6, 'CMD-2024-01-0006', 1000, 'CONFIRMED', 8500, 7500, 0, 1000, 'MOBILE_MONEY',
'{"name":"Marie Durand","firstName":"Marie","lastName":"Durand","street":"123 Rue de la Paix","city":"Dakar","region":"Dakar","country":"Sénégal","fullFormatted":"123 Rue de la Paix, Dakar, Sénégal","phone":"+221771234567"}',
'+221771234567', 'Cadeau pour ma sœur',
'2024-01-20 09:30:00', '2024-01-20 10:15:00', '2024-01-20 10:15:00')
ON CONFLICT (id) DO NOTHING;

-- Articles de la commande 6
INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, color, color_id, size_id, product_name, product_description, product_image_url, design_name, design_image_url, vendor_id) VALUES
(6, 7, 1, 8500, NULL, NULL, NULL, NULL, 'Carnet Dakar Vibes', 'Carnet de notes A5 avec couverture design Dakar', 'https://via.placeholder.com/300', 'Dakar Cityscape', 'https://via.placeholder.com/200', 2000)
ON CONFLICT DO NOTHING;

-- =================================
-- 8. NOTIFICATIONS EXEMPLE
-- =================================

INSERT INTO notifications (user_id, type, title, message, related_order_id, is_read, created_at) VALUES
-- Notifications pour Khadija (vendeur 2000)
(2000, 'NEW_ORDER', 'Nouvelle commande reçue', 'Vous avez reçu une nouvelle commande #CMD-2024-01-0001 de Marie Durand', 1, false, '2024-01-15 10:31:00'),
(2000, 'ORDER_STATUS_CHANGED', 'Commande confirmée', 'La commande #CMD-2024-01-0001 a été confirmée par le client', 1, true, '2024-01-15 11:01:00'),
(2000, 'NEW_ORDER', 'Nouvelle commande reçue', 'Vous avez reçu une nouvelle commande #CMD-2024-01-0002 de Amadou Ba', 2, true, '2024-01-14 14:21:00'),
(2000, 'NEW_ORDER', 'Nouvelle commande reçue', 'Vous avez reçu une nouvelle commande #CMD-2024-01-0006 de Marie Durand', 6, false, '2024-01-20 09:31:00'),

-- Notifications pour Mamadou (vendeur 2001)
(2001, 'NEW_ORDER', 'Nouvelle commande reçue', 'Vous avez reçu une nouvelle commande #CMD-2024-01-0003 de Fatou Sow', 3, true, '2024-01-10 16:46:00'),
(2001, 'ORDER_DELIVERED', 'Commande livrée', 'La commande #CMD-2024-01-0003 a été livrée avec succès', 3, false, '2024-01-18 11:31:00'),
(2001, 'NEW_ORDER', 'Nouvelle commande reçue', 'Vous avez reçu une nouvelle commande #CMD-2024-01-0005 de Aïcha Ndiaye', 5, false, '2024-01-18 13:26:00'),

-- Notifications pour Awa (vendeur 2002)
(2002, 'NEW_ORDER', 'Nouvelle commande reçue', 'Vous avez reçu une nouvelle commande #CMD-2024-01-0004 de Ousmane Diallo', 4, false, '2024-01-19 08:16:00'),
(2002, 'NEW_ORDER', 'Nouvelle commande reçue', 'Vous avez reçu une nouvelle commande #CMD-2024-01-0005 de Aïcha Ndiaye', 5, false, '2024-01-18 13:26:00')
ON CONFLICT DO NOTHING;

-- =================================
-- 9. HISTORIQUE DES STATUTS (sera rempli automatiquement par les triggers)
-- =================================

-- L'historique sera généré automatiquement par les triggers quand les statuts changent
-- Mais on peut insérer quelques entrées manuelles pour l'exemple

INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, notes, created_at) VALUES
(1, 'PENDING', 'CONFIRMED', 1000, 'Commande confirmée par le client', '2024-01-15 11:00:00'),
(1, 'CONFIRMED', 'PROCESSING', 2000, 'Commande prise en charge par le vendeur', '2024-01-16 14:20:00'),
(2, 'PENDING', 'CONFIRMED', 1001, 'Commande confirmée par le client', '2024-01-14 15:00:00'),
(2, 'CONFIRMED', 'PROCESSING', 2000, 'Préparation de la commande', '2024-01-16 10:30:00'),
(2, 'PROCESSING', 'SHIPPED', 2000, 'Commande expédiée via DHL', '2024-01-17 09:15:00'),
(3, 'PENDING', 'CONFIRMED', 1002, 'Commande confirmée par le client', '2024-01-10 17:00:00'),
(3, 'CONFIRMED', 'PROCESSING', 2001, 'Préparation des mugs', '2024-01-12 09:00:00'),
(3, 'PROCESSING', 'SHIPPED', 2001, 'Expédition vers Saint-Louis', '2024-01-15 14:20:00'),
(3, 'SHIPPED', 'DELIVERED', NULL, 'Livraison confirmée', '2024-01-18 11:30:00'),
(5, 'PENDING', 'CONFIRMED', 1004, 'Commande confirmée par virement bancaire', '2024-01-18 16:40:00'),
(6, 'PENDING', 'CONFIRMED', 1000, 'Commande confirmée par le client', '2024-01-20 10:15:00')
ON CONFLICT DO NOTHING;

-- =================================
-- 10. MISE À JOUR DES SÉQUENCES
-- =================================

-- Mettre à jour les séquences pour éviter les conflits d'ID
SELECT setval('users_id_seq', 4000, true);
SELECT setval('products_id_seq', 100, true);
SELECT setval('categories_id_seq', 10, true);
SELECT setval('product_colors_id_seq', 20, true);
SELECT setval('product_sizes_id_seq', 10, true);
SELECT setval('orders_id_seq', 100, true);
SELECT setval('order_items_id_seq', 100, true);
SELECT setval('notifications_id_seq', 100, true);
SELECT setval('order_status_history_id_seq', 100, true);

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = DEFAULT;

-- =================================
-- 11. VÉRIFICATIONS ET STATISTIQUES
-- =================================

-- Vérifier les données insérées
SELECT
    'Users' as table_name,
    count(*) as count,
    count(CASE WHEN role = 'VENDEUR' THEN 1 END) as vendors,
    count(CASE WHEN role = 'CLIENT' THEN 1 END) as clients
FROM users
WHERE email LIKE '%@test.printalma.com'

UNION ALL

SELECT
    'Products' as table_name,
    count(*) as count,
    count(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
    count(CASE WHEN is_active = true THEN 1 END) as active
FROM products

UNION ALL

SELECT
    'Orders' as table_name,
    count(*) as count,
    count(DISTINCT user_id) as unique_customers,
    sum(total_amount) as total_revenue
FROM orders

UNION ALL

SELECT
    'Order Items' as table_name,
    count(*) as count,
    count(DISTINCT vendor_id) as vendors_with_sales,
    sum(total_price) as total_vendor_revenue
FROM order_items;

-- Statistiques par vendeur
SELECT
    u.first_name || ' ' || u.last_name as vendor_name,
    vp.shop_name,
    count(DISTINCT o.id) as total_orders,
    sum(oi.total_price) as total_revenue,
    avg(oi.total_price) as avg_order_value
FROM users u
JOIN vendor_profiles vp ON u.id = vp.user_id
LEFT JOIN order_items oi ON u.id = oi.vendor_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE u.role = 'VENDEUR'
GROUP BY u.id, u.first_name, u.last_name, vp.shop_name
ORDER BY total_revenue DESC;

-- =================================
-- FIN DES DONNÉES D'EXEMPLE
-- =================================

-- Message de confirmation
SELECT '✅ Données d''exemple insérées avec succès!' as status;
SELECT '📊 Utilisez les requêtes ci-dessus pour vérifier les données' as info;
SELECT '🚀 Le système de gestion des commandes vendeur est prêt pour les tests' as ready;