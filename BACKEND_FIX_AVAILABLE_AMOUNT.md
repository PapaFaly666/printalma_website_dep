# 🔧 GUIDE BACKEND : Correction du calcul du montant disponible (availableAmount)

## 📋 Problème identifié

**Symptôme :** Quand l'admin livre une commande (statut → `DELIVERED`), le montant "Disponible" dans `/vendeur/appel-de-fonds` augmente du **prix total du produit** au lieu du **prix du design vendeur uniquement**.

**Comportement actuel (incorrect) :**
- Produit vendu : 10 000 FCFA
- Design vendeur : 3 200 FCFA
- Commission : 10%
- **Montant ajouté au disponible : 9 000 FCFA** (10 000 × 0.9) ❌

**Comportement attendu (correct) :**
- **Montant ajouté au disponible : 2 880 FCFA** (3 200 × 0.9) ✅

---

## 🎯 Objectif

Le vendeur doit recevoir **uniquement le prix de son design** (moins la commission), **PAS le prix total du produit**.

---

## 🔍 Analyse technique

### 1. Code problématique actuel

D'après `VENDOR_FUNDS_REQUEST_BACKEND_GUIDE.md`, la procédure `CalculateVendorEarnings` contient :

```sql
-- LIGNE 142-148 : CALCUL INCORRECT
SELECT COALESCE(SUM(oi.unit_price * oi.quantity * (1 - COALESCE(p.commission_rate, 0.10))), 0)
INTO v_total_earnings
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.vendor_id = p_vendor_id
AND o.status IN ('DELIVERED', 'COMPLETED');
```

**Problème :** Utilise `oi.unit_price` (prix du produit complet) au lieu du prix du design.

### 2. Endpoints concernés

Les endpoints suivants retournent des données basées sur ce calcul incorrect :

1. **`GET /vendor/earnings`** → `availableAmount`
2. **`GET /vendor/stats`** → `availableBalance`
3. **`GET /orders/my-orders`** → `statistics.totalVendorAmount`

**Frontend affecté :**
- Page : `/vendeur/appel-de-fonds`
- Composant : `VendorFundsRequestPage.tsx`
- Carte "Disponible" (ligne 446-461)
- Carte "Gains Totaux" (ligne 425-439)

---

## 🗄️ Vérification du schéma de base de données

Avant de corriger, vérifiez votre schéma :

### Option A : Design lié au produit via `design_id`

```sql
-- Vérifier si la table products a une colonne design_id
DESCRIBE products;

-- Vérifier si la table designs existe
DESCRIBE designs;

-- Exemple de structure attendue :
-- products: id, name, vendor_id, design_id, admin_product_id, price, ...
-- designs: id, vendor_id, name, price, image_url, ...
```

### Option B : Design stocké dans `order_items`

```sql
-- Vérifier si order_items stocke le design_price séparément
DESCRIBE order_items;

-- Exemple de structure alternative :
-- order_items: id, order_id, product_id, quantity, unit_price, design_price, ...
```

### Option C : Architecture complexe

```sql
-- Si vous avez une table de liaison product_designs
DESCRIBE product_designs;

-- Exemple :
-- product_designs: id, product_id, design_id, position_data, ...
```

---

## 🔧 Solutions de correction

### **Solution 1 : Modification de la procédure SQL (RECOMMANDÉ)**

Si `products.design_id` existe et `designs.price` existe :

```sql
-- REMPLACER la procédure CalculateVendorEarnings
DELIMITER $$

DROP PROCEDURE IF EXISTS CalculateVendorEarnings$$

CREATE PROCEDURE CalculateVendorEarnings(IN p_vendor_id BIGINT)
BEGIN
    DECLARE v_total_earnings DECIMAL(10,2) DEFAULT 0;
    DECLARE v_pending_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_this_month DECIMAL(10,2) DEFAULT 0;
    DECLARE v_last_month DECIMAL(10,2) DEFAULT 0;

    -- ✅ CORRECTION : Calculer les gains basés sur le PRIX DU DESIGN
    SELECT COALESCE(SUM(d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))), 0)
    INTO v_total_earnings
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN designs d ON p.design_id = d.id
    WHERE d.vendor_id = p_vendor_id
    AND o.status IN ('DELIVERED', 'COMPLETED');

    -- Calculer le montant en attente (demandes PENDING/APPROVED)
    SELECT COALESCE(SUM(amount), 0)
    INTO v_pending_amount
    FROM vendor_funds_requests
    WHERE vendor_id = p_vendor_id
    AND status IN ('PENDING', 'APPROVED');

    -- ✅ CORRECTION : Gains de ce mois (design price)
    SELECT COALESCE(SUM(d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))), 0)
    INTO v_this_month
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN designs d ON p.design_id = d.id
    WHERE d.vendor_id = p_vendor_id
    AND o.status IN ('DELIVERED', 'COMPLETED')
    AND YEAR(o.updated_at) = YEAR(CURRENT_DATE)
    AND MONTH(o.updated_at) = MONTH(CURRENT_DATE);

    -- ✅ CORRECTION : Gains du mois dernier (design price)
    SELECT COALESCE(SUM(d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))), 0)
    INTO v_last_month
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN designs d ON p.design_id = d.id
    WHERE d.vendor_id = p_vendor_id
    AND o.status IN ('DELIVERED', 'COMPLETED')
    AND YEAR(o.updated_at) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
    AND MONTH(o.updated_at) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH);

    -- Mettre à jour ou insérer dans vendor_earnings
    INSERT INTO vendor_earnings (
        vendor_id,
        total_earnings,
        available_amount,
        pending_amount,
        this_month_earnings,
        last_month_earnings,
        last_calculated_at
    )
    VALUES (
        p_vendor_id,
        v_total_earnings,
        v_total_earnings - v_pending_amount - COALESCE((
            SELECT SUM(amount) FROM vendor_funds_requests
            WHERE vendor_id = p_vendor_id AND status = 'PAID'
        ), 0),
        v_pending_amount,
        v_this_month,
        v_last_month,
        CURRENT_TIMESTAMP
    )
    ON DUPLICATE KEY UPDATE
        total_earnings = v_total_earnings,
        available_amount = v_total_earnings - v_pending_amount - COALESCE((
            SELECT SUM(amount) FROM vendor_funds_requests
            WHERE vendor_id = p_vendor_id AND status = 'PAID'
        ), 0),
        pending_amount = v_pending_amount,
        this_month_earnings = v_this_month,
        last_month_earnings = v_last_month,
        last_calculated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;

END$$

DELIMITER ;
```

**Modifications clés :**
1. **Ligne 16 :** `JOIN designs d ON p.design_id = d.id` → Jointure avec la table designs
2. **Ligne 16 :** `d.price` au lieu de `oi.unit_price` → Utilise le prix du design
3. **Ligne 17 :** `WHERE d.vendor_id = p_vendor_id` → S'assure que c'est bien le design du vendeur
4. **Lignes 29-49 :** Même correction pour les calculs mensuels

---

### **Solution 2 : Si order_items stocke design_price séparément**

Si votre table `order_items` a une colonne `design_price` :

```sql
-- Version simplifiée sans jointure designs
SELECT COALESCE(SUM(oi.design_price * oi.quantity * (1 - COALESCE(p.commission_rate, 0.10))), 0)
INTO v_total_earnings
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.vendor_id = p_vendor_id
AND o.status IN ('DELIVERED', 'COMPLETED')
AND oi.design_price IS NOT NULL;
```

---

### **Solution 3 : Modification du controller Node.js/Express**

Si vous utilisez un ORM ou des requêtes dans le code backend :

```javascript
// controllers/vendorFundsController.js

async calculateVendorEarnings(vendorId) {
  try {
    // ✅ CORRECTION : Requête basée sur le prix du design
    const query = `
      SELECT
        COALESCE(SUM(d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))), 0) as total_earnings,
        COALESCE(SUM(
          CASE
            WHEN YEAR(o.updated_at) = YEAR(CURDATE())
            AND MONTH(o.updated_at) = MONTH(CURDATE())
            THEN d.price * oi.quantity * (1 - COALESCE(d.commission_rate, 0.10))
            ELSE 0
          END
        ), 0) as this_month_earnings
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN designs d ON p.design_id = d.id
      WHERE d.vendor_id = ?
      AND o.status IN ('DELIVERED', 'COMPLETED')
    `;

    const [result] = await db.query(query, [vendorId]);

    // Calculer les montants en attente
    const pendingQuery = `
      SELECT COALESCE(SUM(amount), 0) as pending_amount
      FROM vendor_funds_requests
      WHERE vendor_id = ?
      AND status IN ('PENDING', 'APPROVED')
    `;
    const [pending] = await db.query(pendingQuery, [vendorId]);

    // Calculer les montants déjà payés
    const paidQuery = `
      SELECT COALESCE(SUM(amount), 0) as paid_amount
      FROM vendor_funds_requests
      WHERE vendor_id = ?
      AND status = 'PAID'
    `;
    const [paid] = await db.query(paidQuery, [vendorId]);

    // Calculer le montant disponible
    const availableAmount = result.total_earnings - pending.pending_amount - paid.paid_amount;

    return {
      totalEarnings: result.total_earnings,
      pendingAmount: pending.pending_amount,
      availableAmount: availableAmount,
      thisMonthEarnings: result.this_month_earnings
    };

  } catch (error) {
    console.error('Erreur calcul gains vendeur:', error);
    throw error;
  }
}
```

---

### **Solution 4 : Si l'architecture est différente**

Si vous avez une structure personnalisée, adaptez la requête selon votre schéma :

```sql
-- Template générique à adapter
SELECT COALESCE(SUM([PRIX_DESIGN] * [QUANTITE] * (1 - [TAUX_COMMISSION])), 0)
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
[VOS_JOINTURES_POUR_OBTENIR_LE_PRIX_DESIGN]
WHERE [CONDITION_POUR_IDENTIFIER_LE_VENDEUR]
AND o.status IN ('DELIVERED', 'COMPLETED');
```

**Remplacez :**
- `[PRIX_DESIGN]` → Colonne contenant le prix du design
- `[QUANTITE]` → Colonne de quantité (généralement `oi.quantity`)
- `[TAUX_COMMISSION]` → Taux de commission (ex: `0.10` pour 10%)
- `[VOS_JOINTURES_POUR_OBTENIR_LE_PRIX_DESIGN]` → Jointures nécessaires
- `[CONDITION_POUR_IDENTIFIER_LE_VENDEUR]` → Condition pour filtrer par vendeur

---

## 🧪 Tests de validation

### Test 1 : Vérifier le calcul avec une commande test

```sql
-- 1. Créer une commande test
INSERT INTO orders (user_id, status, total_amount, created_at, updated_at)
VALUES (1, 'PENDING', 10000, NOW(), NOW());

SET @test_order_id = LAST_INSERT_ID();

-- 2. Ajouter un produit avec design
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (@test_order_id, [PRODUCT_ID_AVEC_DESIGN], 1, 10000);

-- 3. Vérifier le prix du design
SELECT d.price, d.vendor_id
FROM products p
JOIN designs d ON p.design_id = d.id
WHERE p.id = [PRODUCT_ID_AVEC_DESIGN];
-- Note : Supposons que d.price = 3200 FCFA

-- 4. Livrer la commande
UPDATE orders SET status = 'DELIVERED', updated_at = NOW() WHERE id = @test_order_id;

-- 5. Recalculer les gains
CALL CalculateVendorEarnings([VENDOR_ID]);

-- 6. Vérifier le résultat
SELECT
    total_earnings,
    available_amount,
    this_month_earnings
FROM vendor_earnings
WHERE vendor_id = [VENDOR_ID];

-- Résultat attendu :
-- Si le design coûte 3200 FCFA et commission 10% :
-- Gains ajoutés = 3200 * 0.9 = 2880 FCFA
-- PAS 10000 * 0.9 = 9000 FCFA
```

### Test 2 : Vérifier via l'API

```bash
# 1. Obtenir le montant disponible AVANT livraison
curl -X GET "https://printalma-back-dep.onrender.com/vendor/earnings" \
  -H "Authorization: Bearer [TOKEN_VENDEUR]" \
  -H "Content-Type: application/json"

# Noter le availableAmount initial (ex: 3200 FCFA)

# 2. Admin livre une commande avec design à 3200 FCFA

# 3. Vérifier le montant APRÈS livraison
curl -X GET "https://printalma-back-dep.onrender.com/vendor/earnings" \
  -H "Authorization: Bearer [TOKEN_VENDEUR]" \
  -H "Content-Type: application/json"

# Résultat attendu :
# availableAmount = 3200 + (3200 * 0.9) = 6080 FCFA
# PAS 3200 + (10000 * 0.9) = 12200 FCFA
```

### Test 3 : Vérifier dans le frontend

1. **Ouvrir** `/vendeur/appel-de-fonds` dans le navigateur
2. **Noter** le montant "Disponible" actuel
3. **Admin livre une commande** avec un design du vendeur
4. **Rafraîchir** la page `/vendeur/appel-de-fonds`
5. **Vérifier** que le montant a augmenté du prix du design (moins commission), pas du prix du produit

---

## 📊 Validation des données existantes

Après correction, vous devrez peut-être recalculer les gains existants :

```sql
-- Recalculer pour tous les vendeurs
SELECT id FROM users WHERE role = 'VENDOR';

-- Pour chaque vendeur_id retourné :
CALL CalculateVendorEarnings([VENDOR_ID]);

-- Ou en batch :
DELIMITER $$

CREATE PROCEDURE RecalculateAllVendorEarnings()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id BIGINT;
    DECLARE vendor_cursor CURSOR FOR SELECT id FROM users WHERE role = 'VENDOR';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN vendor_cursor;

    read_loop: LOOP
        FETCH vendor_cursor INTO v_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        CALL CalculateVendorEarnings(v_id);
    END LOOP;

    CLOSE vendor_cursor;
END$$

DELIMITER ;

-- Exécuter la recalculation globale
CALL RecalculateAllVendorEarnings();
```

---

## 🚀 Déploiement

### 1. Sur un environnement de développement local

```bash
# Se connecter à la base de données locale
mysql -u root -p printalma_db

# Exécuter le script de correction
source /path/to/fix_available_amount.sql

# Tester avec un compte vendeur
```

### 2. Sur le serveur de production (Render)

```bash
# Option A : Via l'interface Render
# 1. Aller dans Render Dashboard → Database
# 2. Cliquer sur "Query" ou "Connect"
# 3. Coller le script SQL de correction
# 4. Exécuter

# Option B : Via MySQL client
mysql -h [RENDER_DB_HOST] -u [RENDER_DB_USER] -p[RENDER_DB_PASSWORD] [DATABASE_NAME] < fix_available_amount.sql
```

### 3. Redémarrer les services backend

```bash
# Dans Render Dashboard → Web Services
# Cliquer sur le service backend → "Manual Deploy" → "Deploy latest commit"
```

---

## 📋 Checklist de déploiement

- [ ] Vérifier le schéma de base de données actuel
- [ ] Identifier comment les designs sont liés aux produits
- [ ] Créer le script SQL de correction adapté à votre schéma
- [ ] Tester sur une base de développement locale
- [ ] Vérifier que les calculs sont corrects avec des données test
- [ ] Sauvegarder la base de production avant modification
- [ ] Appliquer le script sur la base de production
- [ ] Recalculer les gains pour tous les vendeurs existants
- [ ] Tester via l'API `/vendor/earnings`
- [ ] Vérifier dans le frontend `/vendeur/appel-de-fonds`
- [ ] Redémarrer les services backend si nécessaire
- [ ] Monitorer les logs pour détecter d'éventuelles erreurs

---

## 🆘 En cas de problème

### Problème 1 : Erreur "Unknown column 'designs.price'"

**Cause :** La table `designs` n'a pas de colonne `price`

**Solution :** Vérifier le nom exact de la colonne :
```sql
DESCRIBE designs;
-- Chercher une colonne comme : price, amount, vendor_price, design_price, etc.
-- Adapter la requête avec le bon nom de colonne
```

### Problème 2 : Erreur "Unknown column 'products.design_id'"

**Cause :** Les designs ne sont pas liés directement aux produits

**Solution :** Identifier l'architecture réelle :
```sql
-- Vérifier s'il existe une table de liaison
SHOW TABLES LIKE '%design%';
SHOW TABLES LIKE '%product%';

-- Vérifier les colonnes de products
DESCRIBE products;

-- Adapter la requête selon l'architecture trouvée
```

### Problème 3 : Les montants sont toujours incorrects

**Cause possible 1 :** La procédure stockée n'est pas utilisée

**Solution :** Vérifier que le endpoint appelle bien la procédure :
```javascript
// Dans le controller, vérifier qu'on appelle :
await sequelize.query('CALL CalculateVendorEarnings(?)', [vendorId]);
```

**Cause possible 2 :** Le cache frontend affiche des anciennes valeurs

**Solution :** Vider le cache navigateur et localStorage :
```javascript
// Dans la console navigateur
localStorage.clear();
location.reload();
```

---

## 📞 Support

Si vous avez besoin d'aide pour :
- Comprendre votre schéma de base de données
- Adapter le script SQL à votre architecture
- Déboguer les erreurs SQL
- Tester les modifications

Fournissez ces informations :
1. Résultat de `DESCRIBE products;`
2. Résultat de `DESCRIBE designs;`
3. Résultat de `DESCRIBE order_items;`
4. Un exemple de données (produit, design, commande)
5. Les messages d'erreur exacts si applicable

---

## 📝 Résumé

**Problème :** Le montant disponible augmente du prix total du produit au lieu du prix du design

**Solution :** Modifier les requêtes SQL pour utiliser `designs.price` au lieu de `order_items.unit_price`

**Fichiers à modifier :**
- Procédure stockée `CalculateVendorEarnings`
- Possiblement les controllers backend qui calculent les gains

**Impact :** Après correction, les vendeurs verront le montant correct basé uniquement sur le prix de leurs designs

**Test :** Livrer une commande test et vérifier que le montant disponible augmente du prix du design (moins commission) uniquement
