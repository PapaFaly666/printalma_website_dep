-- =================================
-- SCHEMA BASE DE DONNÉES - SYSTÈME DE GESTION DES COMMANDES VENDEUR
-- PrintAlma - Gestion des commandes
-- =================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================
-- 1. TABLES PRINCIPALES
-- =================================

-- Table des utilisateurs (si pas déjà existante)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CLIENT',
    vendor_type VARCHAR(50), -- Pour les vendeurs : DESIGNER, ARTISTE, INFLUENCEUR
    profile_photo_url TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT users_role_check CHECK (role IN ('CLIENT', 'VENDEUR', 'ADMIN')),
    CONSTRAINT users_vendor_type_check CHECK (
        vendor_type IS NULL OR
        vendor_type IN ('DESIGNER', 'ARTISTE', 'INFLUENCEUR')
    )
);

-- Table des profils étendus vendeur
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_name VARCHAR(255),
    business_description TEXT,
    business_address TEXT,
    tax_number VARCHAR(100),
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(255),
    commission_rate DECIMAL(5,2) DEFAULT 30.00, -- Commission en %
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, SUSPENDED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT vendor_profiles_status_check CHECK (
        status IN ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED')
    )
);

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des couleurs produit
CREATE TABLE IF NOT EXISTS product_colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    hex_code VARCHAR(7), -- #FFFFFF
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des tailles produit
CREATE TABLE IF NOT EXISTS product_sizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(10) NOT NULL, -- XS, S, M, L, XL, XXL
    description VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2), -- Prix de revient
    vendor_id INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),

    -- Métadonnées design
    design_name VARCHAR(255),
    design_description TEXT,
    design_image_url TEXT,
    design_file_url TEXT, -- Fichier haute résolution

    -- Statuts et validation
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PENDING, APPROVED, REJECTED
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,

    -- SEO et métadonnées
    slug VARCHAR(255) UNIQUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags TEXT[], -- Array de tags

    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),

    -- Contraintes
    CONSTRAINT products_status_check CHECK (
        status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED')
    ),
    CONSTRAINT products_price_positive CHECK (price > 0)
);

-- Table de liaison produits-couleurs
CREATE TABLE IF NOT EXISTS product_color_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_id INTEGER NOT NULL REFERENCES product_colors(id),
    additional_price DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,

    UNIQUE(product_id, color_id)
);

-- Table de liaison produits-tailles
CREATE TABLE IF NOT EXISTS product_size_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_id INTEGER NOT NULL REFERENCES product_sizes(id),
    additional_price DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,

    UNIQUE(product_id, size_id)
);

-- =================================
-- 2. SYSTÈME DE COMMANDES
-- =================================

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),

    -- Statuts
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    -- Montants
    total_amount DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2),
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,

    -- Paiement
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    payment_reference VARCHAR(255),

    -- Adresses (stockées en JSON pour flexibilité)
    shipping_address JSONB NOT NULL,
    billing_address JSONB,

    -- Contact
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),

    -- Notes et métadonnées
    notes TEXT,
    internal_notes TEXT, -- Notes internes admin/vendeur
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),

    -- Timestamps de suivi
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    processed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    -- Validation admin
    validated_at TIMESTAMP,
    validated_by INTEGER REFERENCES users(id),

    -- Contraintes
    CONSTRAINT orders_status_check CHECK (
        status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED')
    ),
    CONSTRAINT orders_payment_status_check CHECK (
        payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')
    ),
    CONSTRAINT orders_total_positive CHECK (total_amount >= 0)
);

-- Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),

    -- Quantité et prix
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

    -- Variantes sélectionnées
    size VARCHAR(10),
    color VARCHAR(50),
    color_id INTEGER REFERENCES product_colors(id),
    size_id INTEGER REFERENCES product_sizes(id),

    -- Métadonnées produit au moment de la commande (pour historique)
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    product_image_url TEXT,
    design_name VARCHAR(255),
    design_image_url TEXT,
    vendor_id INTEGER NOT NULL, -- Dénormalisé pour performance

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT order_items_unit_price_positive CHECK (unit_price >= 0)
);

-- =================================
-- 3. SYSTÈME DE NOTIFICATIONS
-- =================================

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Métadonnées contextuelles
    related_order_id INTEGER REFERENCES orders(id),
    related_product_id INTEGER REFERENCES products(id),
    metadata JSONB, -- Données supplémentaires flexibles

    -- États
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,

    -- Channels de notification
    email_sent BOOLEAN DEFAULT false,
    push_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP,
    sent_at TIMESTAMP
);

-- =================================
-- 4. LOGS ET HISTORIQUE
-- =================================

-- Table des logs de changement de statut
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Changement de statut
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,

    -- Utilisateur responsable du changement
    changed_by INTEGER REFERENCES users(id),
    change_reason VARCHAR(255),
    notes TEXT,

    -- Métadonnées
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT order_status_history_to_status_check CHECK (
        to_status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED')
    )
);

-- =================================
-- 5. INDEXES POUR PERFORMANCE
-- =================================

-- Index sur les commandes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Index pour les requêtes vendeur (très important)
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Index composites pour les requêtes de filtrage vendeur
CREATE INDEX IF NOT EXISTS idx_orders_vendor_status_date ON orders(status, created_at DESC)
WHERE id IN (
    SELECT DISTINCT order_id
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
);

-- Index sur les produits
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Index sur les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Index sur l'historique
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- =================================
-- 6. FONCTIONS ET TRIGGERS
-- =================================

-- Fonction pour générer les numéros de commande
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
    order_num TEXT;
BEGIN
    -- Format: CMD-YYYY-MM-XXXX
    year_month := TO_CHAR(NOW(), 'YYYY-MM');

    -- Obtenir le prochain numéro de séquence pour ce mois
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(order_number FROM 'CMD-\d{4}-\d{2}-(\d+)')
            AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM orders
    WHERE order_number LIKE 'CMD-' || year_month || '-%';

    order_num := 'CMD-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');

    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement les numéros de commande
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour historique des changements de statut
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Insérer dans l'historique si le statut a changé
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (
            order_id,
            from_status,
            to_status,
            changed_by,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.validated_by, OLD.validated_by),
            CASE
                WHEN NEW.status = 'CONFIRMED' THEN 'Commande confirmée'
                WHEN NEW.status = 'PROCESSING' THEN 'Commande en cours de traitement'
                WHEN NEW.status = 'SHIPPED' THEN 'Commande expédiée'
                WHEN NEW.status = 'DELIVERED' THEN 'Commande livrée'
                WHEN NEW.status = 'CANCELLED' THEN 'Commande annulée'
                ELSE 'Changement de statut'
            END
        );

        -- Mettre à jour les timestamps correspondants
        CASE NEW.status
            WHEN 'CONFIRMED' THEN
                NEW.confirmed_at = COALESCE(NEW.confirmed_at, NOW());
            WHEN 'PROCESSING' THEN
                NEW.processed_at = COALESCE(NEW.processed_at, NOW());
            WHEN 'SHIPPED' THEN
                NEW.shipped_at = COALESCE(NEW.shipped_at, NOW());
            WHEN 'DELIVERED' THEN
                NEW.delivered_at = COALESCE(NEW.delivered_at, NOW());
            WHEN 'CANCELLED' THEN
                NEW.cancelled_at = COALESCE(NEW.cancelled_at, NOW());
            ELSE
                NULL;
        END CASE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_order_status_change
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- =================================
-- 7. VUES UTILES
-- =================================

-- Vue pour les commandes avec informations vendeur
CREATE OR REPLACE VIEW vendor_orders_summary AS
SELECT DISTINCT
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.created_at,
    o.updated_at,
    u.first_name || ' ' || u.last_name AS customer_name,
    u.email AS customer_email,
    oi.vendor_id,
    COUNT(oi.id) AS items_count,
    SUM(oi.total_price) AS vendor_total
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN users u ON o.user_id = u.id
GROUP BY o.id, o.order_number, o.status, o.total_amount, o.created_at, o.updated_at,
         u.first_name, u.last_name, u.email, oi.vendor_id;

-- Vue pour les statistiques vendeur
CREATE OR REPLACE VIEW vendor_statistics AS
SELECT
    oi.vendor_id,
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(oi.total_price) AS total_revenue,
    AVG(oi.total_price) AS avg_order_value,
    COUNT(CASE WHEN o.status = 'PENDING' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN o.status = 'CONFIRMED' THEN 1 END) AS confirmed_orders,
    COUNT(CASE WHEN o.status = 'PROCESSING' THEN 1 END) AS processing_orders,
    COUNT(CASE WHEN o.status = 'SHIPPED' THEN 1 END) AS shipped_orders,
    COUNT(CASE WHEN o.status = 'DELIVERED' THEN 1 END) AS delivered_orders,
    COUNT(CASE WHEN o.status = 'CANCELLED' THEN 1 END) AS cancelled_orders
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
GROUP BY oi.vendor_id;

-- =================================
-- COMMENTAIRES ET DOCUMENTATION
-- =================================

COMMENT ON TABLE orders IS 'Table principale des commandes clients';
COMMENT ON TABLE order_items IS 'Articles individuels dans chaque commande';
COMMENT ON TABLE order_status_history IS 'Historique des changements de statut des commandes';
COMMENT ON TABLE vendor_profiles IS 'Profils étendus des vendeurs avec informations business';
COMMENT ON TABLE notifications IS 'Système de notifications pour tous les utilisateurs';

COMMENT ON COLUMN orders.shipping_address IS 'Adresse de livraison stockée en JSONB pour flexibilité';
COMMENT ON COLUMN orders.order_number IS 'Numéro unique généré automatiquement au format CMD-YYYY-MM-XXXX';
COMMENT ON COLUMN order_items.vendor_id IS 'ID vendeur dénormalisé pour optimiser les requêtes';
COMMENT ON COLUMN products.status IS 'Statut de validation du produit par les admins';

-- =================================
-- FIN DU SCHEMA
-- =================================