# Exemples SQL pour le système de personnalisation

## 📋 Requêtes SQL pratiques

### 1. Créer la table customizations

```sql
CREATE TABLE customizations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  session_id VARCHAR(255) NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  color_variation_id BIGINT UNSIGNED NOT NULL,
  view_id BIGINT UNSIGNED NOT NULL,
  design_elements JSON NOT NULL,
  size_selections JSON NULL,
  preview_image_url VARCHAR(500) NULL,
  total_price DECIMAL(10, 2) DEFAULT 0.00,
  status ENUM('draft', 'saved', 'in_cart', 'ordered') DEFAULT 'draft',
  order_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_product_id (product_id),
  INDEX idx_order_id (order_id),
  INDEX idx_status (status),

  CONSTRAINT fk_customizations_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_customizations_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_customizations_color FOREIGN KEY (color_variation_id)
    REFERENCES color_variations(id) ON DELETE CASCADE,
  CONSTRAINT fk_customizations_view FOREIGN KEY (view_id)
    REFERENCES product_images(id) ON DELETE CASCADE,
  CONSTRAINT fk_customizations_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Ajouter la colonne customization_id à order_items

```sql
ALTER TABLE order_items
ADD COLUMN customization_id BIGINT UNSIGNED NULL AFTER product_id,
ADD INDEX idx_customization_id (customization_id),
ADD CONSTRAINT fk_order_items_customization
  FOREIGN KEY (customization_id)
  REFERENCES customizations(id)
  ON DELETE SET NULL;
```

### 3. Insérer une personnalisation

```sql
INSERT INTO customizations (
  user_id,
  session_id,
  product_id,
  color_variation_id,
  view_id,
  design_elements,
  size_selections,
  total_price,
  status
) VALUES (
  5,  -- user_id (NULL si guest)
  NULL,  -- session_id (utilisé si guest)
  42,  -- product_id
  5,  -- color_variation_id
  12,  -- view_id
  JSON_ARRAY(
    JSON_OBJECT(
      'id', 'element-1737551234567-abc123',
      'type', 'text',
      'x', 0.5,
      'y', 0.3,
      'width', 200,
      'height', 50,
      'rotation', 0,
      'zIndex', 1,
      'text', 'Mon texte personnalisé',
      'fontSize', 32,
      'baseFontSize', 32,
      'baseWidth', 200,
      'fontFamily', 'Arial, sans-serif',
      'color', '#FF0000',
      'fontWeight', 'bold',
      'fontStyle', 'normal',
      'textDecoration', 'none',
      'textAlign', 'center',
      'curve', 0
    ),
    JSON_OBJECT(
      'id', 'element-1737551234568-def456',
      'type', 'image',
      'x', 0.5,
      'y', 0.7,
      'width', 150,
      'height', 150,
      'rotation', 15,
      'zIndex', 0,
      'imageUrl', 'https://res.cloudinary.com/xxx/design.svg',
      'naturalWidth', 500,
      'naturalHeight', 500
    )
  ),
  JSON_ARRAY(
    JSON_OBJECT('size', 'M', 'quantity', 2),
    JSON_OBJECT('size', 'L', 'quantity', 1)
  ),
  15000.00,  -- total_price
  'saved'  -- status
);
```

### 4. Récupérer une personnalisation avec ses relations

```sql
SELECT
  c.*,
  p.name as product_name,
  p.price as product_price,
  cv.name as color_name,
  cv.color_code,
  pi.url as view_url,
  pi.view_type,
  u.name as user_name,
  u.email as user_email
FROM customizations c
LEFT JOIN products p ON c.product_id = p.id
LEFT JOIN color_variations cv ON c.color_variation_id = cv.id
LEFT JOIN product_images pi ON c.view_id = pi.id
LEFT JOIN users u ON c.user_id = u.id
WHERE c.id = 1;
```

### 5. Récupérer toutes les personnalisations d'un utilisateur

```sql
SELECT
  c.*,
  p.name as product_name,
  p.price as product_price
FROM customizations c
LEFT JOIN products p ON c.product_id = p.id
WHERE c.user_id = 5
ORDER BY c.created_at DESC;
```

### 6. Récupérer les personnalisations d'une session (guest)

```sql
SELECT
  c.*,
  p.name as product_name,
  p.price as product_price
FROM customizations c
LEFT JOIN products p ON c.product_id = p.id
WHERE c.session_id = 'guest-1737551234567-xyz789'
  AND c.status IN ('saved', 'in_cart')
ORDER BY c.created_at DESC;
```

### 7. Mettre à jour le statut d'une personnalisation

```sql
UPDATE customizations
SET
  status = 'ordered',
  order_id = 123,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 1;
```

### 8. Créer une commande avec personnalisation

```sql
-- 1. Créer la commande
INSERT INTO orders (
  user_id,
  session_id,
  shipping_address,
  payment_method,
  total_amount,
  status
) VALUES (
  5,
  NULL,
  JSON_OBJECT(
    'fullName', 'Jean Dupont',
    'phone', '0612345678',
    'address', '123 Rue Example',
    'city', 'Dakar',
    'postalCode', '10000',
    'country', 'Sénégal'
  ),
  'card',
  15000.00,
  'pending'
);

-- 2. Récupérer l'ID de la commande créée
SET @order_id = LAST_INSERT_ID();

-- 3. Créer les items de commande avec personnalisation
INSERT INTO order_items (
  order_id,
  product_id,
  customization_id,
  product_name,
  product_image,
  color_name,
  size,
  unit_price,
  quantity,
  total_price
) VALUES
  (@order_id, 42, 1, 'T-shirt Premium', 'https://...', 'Blanc', 'M', 5000.00, 1, 5000.00),
  (@order_id, 42, 1, 'T-shirt Premium', 'https://...', 'Blanc', 'M', 5000.00, 1, 5000.00),
  (@order_id, 42, 1, 'T-shirt Premium', 'https://...', 'Blanc', 'L', 5000.00, 1, 5000.00);

-- 4. Mettre à jour la personnalisation
UPDATE customizations
SET
  status = 'ordered',
  order_id = @order_id,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 1;
```

### 9. Récupérer une commande avec ses personnalisations

```sql
SELECT
  o.id as order_id,
  o.total_amount,
  o.status as order_status,
  o.created_at as order_date,
  oi.id as item_id,
  oi.product_name,
  oi.color_name,
  oi.size,
  oi.quantity,
  oi.unit_price,
  oi.total_price,
  c.id as customization_id,
  c.design_elements,
  c.size_selections,
  c.status as customization_status,
  p.name as product_name,
  p.price as product_price
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN customizations c ON oi.customization_id = c.id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.id = 123;
```

### 10. Requêtes JSON pour extraire des informations

#### Extraire le premier élément de design
```sql
SELECT
  id,
  JSON_EXTRACT(design_elements, '$[0]') as first_element
FROM customizations
WHERE id = 1;
```

#### Compter le nombre d'éléments de design
```sql
SELECT
  id,
  JSON_LENGTH(design_elements) as element_count
FROM customizations
WHERE id = 1;
```

#### Extraire tous les éléments de type texte
```sql
SELECT
  id,
  JSON_SEARCH(design_elements, 'one', 'text', NULL, '$[*].type') as text_elements
FROM customizations
WHERE id = 1;
```

#### Filtrer les personnalisations avec du texte spécifique
```sql
SELECT *
FROM customizations
WHERE JSON_CONTAINS(
  design_elements,
  JSON_QUOTE('Mon texte'),
  '$[*].text'
);
```

#### Extraire les sélections de taille
```sql
SELECT
  id,
  JSON_EXTRACT(size_selections, '$[0].size') as first_size,
  JSON_EXTRACT(size_selections, '$[0].quantity') as first_quantity
FROM customizations
WHERE id = 1;
```

### 11. Statistiques et rapports

#### Nombre de personnalisations par statut
```sql
SELECT
  status,
  COUNT(*) as count
FROM customizations
GROUP BY status;
```

#### Personnalisations les plus récentes
```sql
SELECT
  c.id,
  c.created_at,
  p.name as product_name,
  u.name as user_name,
  c.status
FROM customizations c
LEFT JOIN products p ON c.product_id = p.id
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 10;
```

#### Produits les plus personnalisés
```sql
SELECT
  p.id,
  p.name,
  COUNT(c.id) as customization_count
FROM products p
LEFT JOIN customizations c ON p.id = c.product_id
GROUP BY p.id, p.name
ORDER BY customization_count DESC
LIMIT 10;
```

#### Revenu total des personnalisations commandées
```sql
SELECT
  SUM(total_price) as total_revenue
FROM customizations
WHERE status = 'ordered';
```

#### Personnalisations par vue
```sql
SELECT
  pi.view_type,
  COUNT(c.id) as count
FROM customizations c
LEFT JOIN product_images pi ON c.view_id = pi.id
GROUP BY pi.view_type
ORDER BY count DESC;
```

### 12. Nettoyage et maintenance

#### Supprimer les personnalisations brouillons anciennes (plus de 30 jours)
```sql
DELETE FROM customizations
WHERE status = 'draft'
  AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

#### Supprimer les personnalisations orphelines (produit supprimé)
```sql
DELETE c FROM customizations c
LEFT JOIN products p ON c.product_id = p.id
WHERE p.id IS NULL;
```

#### Archiver les anciennes personnalisations
```sql
-- Créer une table d'archive
CREATE TABLE customizations_archive LIKE customizations;

-- Copier les personnalisations anciennes
INSERT INTO customizations_archive
SELECT * FROM customizations
WHERE status = 'ordered'
  AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Supprimer de la table principale
DELETE FROM customizations
WHERE status = 'ordered'
  AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### 13. Requêtes de migration

#### Migrer les sessionId vers userId lors de la connexion
```sql
-- Quand un guest se connecte, migrer ses personnalisations
UPDATE customizations
SET
  user_id = 5,
  session_id = NULL
WHERE session_id = 'guest-1737551234567-xyz789'
  AND user_id IS NULL;
```

#### Recalculer le prix total
```sql
UPDATE customizations c
JOIN products p ON c.product_id = p.id
SET c.total_price = (
  SELECT SUM(
    p.price * JSON_EXTRACT(sel.value, '$.quantity')
  )
  FROM JSON_TABLE(
    c.size_selections,
    '$[*]' COLUMNS(
      value JSON PATH '$'
    )
  ) AS sel
)
WHERE c.size_selections IS NOT NULL;
```

### 14. Requêtes de vérification

#### Vérifier l'intégrité des données
```sql
-- Personnalisations avec produits invalides
SELECT c.id, c.product_id
FROM customizations c
LEFT JOIN products p ON c.product_id = p.id
WHERE p.id IS NULL;

-- Personnalisations avec couleurs invalides
SELECT c.id, c.color_variation_id
FROM customizations c
LEFT JOIN color_variations cv ON c.color_variation_id = cv.id
WHERE cv.id IS NULL;

-- Personnalisations avec vues invalides
SELECT c.id, c.view_id
FROM customizations c
LEFT JOIN product_images pi ON c.view_id = pi.id
WHERE pi.id IS NULL;
```

#### Vérifier les JSON valides
```sql
SELECT id
FROM customizations
WHERE NOT JSON_VALID(design_elements);

SELECT id
FROM customizations
WHERE size_selections IS NOT NULL
  AND NOT JSON_VALID(size_selections);
```

---

## 🔧 Procédures stockées utiles

### Créer une personnalisation (procédure)

```sql
DELIMITER //

CREATE PROCEDURE create_customization(
  IN p_user_id BIGINT,
  IN p_session_id VARCHAR(255),
  IN p_product_id BIGINT,
  IN p_color_variation_id BIGINT,
  IN p_view_id BIGINT,
  IN p_design_elements JSON,
  IN p_size_selections JSON,
  OUT p_customization_id BIGINT
)
BEGIN
  DECLARE v_product_price DECIMAL(10, 2);
  DECLARE v_total_price DECIMAL(10, 2) DEFAULT 0.00;

  -- Récupérer le prix du produit
  SELECT price INTO v_product_price
  FROM products
  WHERE id = p_product_id;

  -- Calculer le prix total si size_selections fourni
  IF p_size_selections IS NOT NULL THEN
    SELECT SUM(
      v_product_price * JSON_EXTRACT(sel.value, '$.quantity')
    ) INTO v_total_price
    FROM JSON_TABLE(
      p_size_selections,
      '$[*]' COLUMNS(
        value JSON PATH '$'
      )
    ) AS sel;
  END IF;

  -- Insérer la personnalisation
  INSERT INTO customizations (
    user_id,
    session_id,
    product_id,
    color_variation_id,
    view_id,
    design_elements,
    size_selections,
    total_price,
    status
  ) VALUES (
    p_user_id,
    CASE WHEN p_user_id IS NOT NULL THEN NULL ELSE p_session_id END,
    p_product_id,
    p_color_variation_id,
    p_view_id,
    p_design_elements,
    p_size_selections,
    v_total_price,
    'saved'
  );

  SET p_customization_id = LAST_INSERT_ID();
END //

DELIMITER ;

-- Utilisation
CALL create_customization(
  5,  -- user_id
  NULL,  -- session_id
  42,  -- product_id
  5,  -- color_variation_id
  12,  -- view_id
  JSON_ARRAY(JSON_OBJECT('type', 'text', 'text', 'Mon texte')),  -- design_elements
  JSON_ARRAY(JSON_OBJECT('size', 'M', 'quantity', 2)),  -- size_selections
  @new_id
);

SELECT @new_id as customization_id;
```

---

## 📊 Vues SQL utiles

### Vue des personnalisations complètes

```sql
CREATE VIEW customizations_with_details AS
SELECT
  c.id,
  c.user_id,
  c.session_id,
  c.status,
  c.total_price,
  c.created_at,
  c.updated_at,
  u.name as user_name,
  u.email as user_email,
  p.id as product_id,
  p.name as product_name,
  p.price as product_price,
  cv.name as color_name,
  cv.color_code,
  pi.view_type,
  pi.url as view_url,
  o.id as order_id,
  o.status as order_status,
  JSON_LENGTH(c.design_elements) as element_count
FROM customizations c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN products p ON c.product_id = p.id
LEFT JOIN color_variations cv ON c.color_variation_id = cv.id
LEFT JOIN product_images pi ON c.view_id = pi.id
LEFT JOIN orders o ON c.order_id = o.id;

-- Utilisation
SELECT * FROM customizations_with_details
WHERE user_id = 5
ORDER BY created_at DESC;
```

---

## 🎯 Conseils de performance

1. **Index sur les colonnes JSON**
   - MySQL 8.0+ supporte les index sur les colonnes JSON
   ```sql
   ALTER TABLE customizations
   ADD INDEX idx_status_json ((CAST(status AS CHAR(20))));
   ```

2. **Partitionnement par date**
   - Pour de très grandes tables
   ```sql
   ALTER TABLE customizations
   PARTITION BY RANGE (YEAR(created_at)) (
     PARTITION p2024 VALUES LESS THAN (2025),
     PARTITION p2025 VALUES LESS THAN (2026),
     PARTITION p_future VALUES LESS THAN MAXVALUE
   );
   ```

3. **Cache des requêtes fréquentes**
   - Utiliser Redis pour les personnalisations actives

4. **Archivage régulier**
   - Déplacer les anciennes personnalisations vers une table d'archive

---

Ce fichier fournit tous les exemples SQL nécessaires pour gérer efficacement le système de personnalisation !
