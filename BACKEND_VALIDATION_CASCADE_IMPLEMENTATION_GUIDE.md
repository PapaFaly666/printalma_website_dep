# 🎯 BACKEND — IMPLÉMENTATION VALIDATION EN CASCADE DESIGN → PRODUITS

> **Guide complet** pour implémenter la validation en cascade côté backend
> **Basé sur la documentation frontend** avec gestion des sessions via `credentials: 'include'`

---

## 📋 Architecture du système de cascade

### Workflow de validation en cascade :
1. **Vendeur** crée design → Crée produit(s) avec design → Choisit `postValidationAction`
2. **Vendeur** soumet produit → Status `PENDING` (en attente validation design)
3. **Admin** valide le design → **CASCADE AUTOMATIQUE** sur tous les produits
4. **Système** applique l'action choisie par chaque vendeur pour chaque produit
5. **Vendeur** reçoit notification et peut publier manuellement si `TO_DRAFT`

### Actions disponibles :
- **`AUTO_PUBLISH`** : Publication automatique après validation design ✅
- **`TO_DRAFT`** : Mise en brouillon après validation (publication manuelle) 📝

---

## 🗄️ Modifications base de données

### 1. Table `designs` (modifications)

```sql
-- Ajouter colonnes pour la validation des designs
ALTER TABLE designs 
ADD COLUMN is_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN is_pending BOOLEAN DEFAULT FALSE,
ADD COLUMN validated_at TIMESTAMP NULL,
ADD COLUMN validated_by INT NULL,
ADD COLUMN rejection_reason TEXT NULL,
ADD COLUMN submitted_at TIMESTAMP NULL;

-- Index pour optimiser les requêtes
CREATE INDEX idx_designs_validation ON designs(is_validated, is_pending);
CREATE INDEX idx_designs_pending ON designs(is_pending, submitted_at);
```

### 2. Table `vendor_products` (modifications)

```sql
-- Ajouter colonnes pour la validation en cascade
ALTER TABLE vendor_products 
ADD COLUMN post_validation_action ENUM('AUTO_PUBLISH', 'TO_DRAFT') DEFAULT 'AUTO_PUBLISH',
ADD COLUMN is_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN validated_at TIMESTAMP NULL,
ADD COLUMN validated_by INT NULL,
ADD COLUMN rejection_reason TEXT NULL,
ADD COLUMN design_cloudinary_url TEXT NULL, -- Lien avec le design
ADD COLUMN forced_status ENUM('DRAFT', 'PENDING', 'PUBLISHED') NULL;

-- Index pour la cascade
CREATE INDEX idx_vendor_products_design_url ON vendor_products(design_cloudinary_url);
CREATE INDEX idx_vendor_products_cascade ON vendor_products(status, design_cloudinary_url);
```

### 3. Table de liaison `design_products` (nouvelle)

```sql
-- Table pour lier designs et produits (optionnelle, alternative)
CREATE TABLE design_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  design_id INT NOT NULL,
  vendor_product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_design_product (design_id, vendor_product_id)
);
```

---

## 🔌 Endpoints principaux

### 1. Soumission design pour validation

```javascript
// routes/designs.js

/**
 * POST /api/designs/:id/submit
 * Soumettre un design pour validation
 */
router.post('/:id/submit', requireAuth, requireVendor, async (req, res) => {
  try {
    const { id: designId } = req.params;
    const vendorId = req.user.id;

    console.log(`🎨 Soumission design ${designId} par vendeur ${vendorId}`);

    // Vérifier que le design appartient au vendeur
    const design = await Design.findOne({
      where: { 
        id: designId, 
        vendorId: vendorId,
        is_pending: false,
        is_validated: false
      }
    });

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design non trouvé ou déjà soumis'
      });
    }

    // Marquer le design comme en attente
    await design.update({
      is_pending: true,
      submitted_at: new Date()
    });

    // Notifier les admins
    await notifyAdmins('NEW_DESIGN_SUBMISSION', {
      designId: design.id,
      vendorName: req.user.name,
      imageUrl: design.imageUrl
    });

    res.json({
      success: true,
      message: 'Design soumis pour validation avec succès',
      design: design
    });

  } catch (error) {
    console.error('❌ Erreur soumission design:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission'
    });
  }
});
```

### 2. Validation design avec cascade automatique

```javascript
/**
 * PUT /api/designs/:id/validate
 * Valider/rejeter un design ET appliquer la cascade sur tous les produits
 * 🔥 LOGIQUE CRUCIALE : Validation en cascade
 */
router.put('/:id/validate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id: designId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'VALIDATE' | 'REJECT'
    const adminId = req.user.id;

    console.log(`⚖️ Admin ${adminId} ${action} design ${designId}`);

    // Transaction pour assurer la cohérence
    const result = await sequelize.transaction(async (t) => {
      
      // 1. Vérifier que le design est en attente
      const design = await Design.findOne({
        where: { 
          id: designId,
          is_pending: true,
          is_validated: false
        },
        transaction: t
      });

      if (!design) {
        throw new Error('Design non trouvé ou déjà traité');
      }

      let designUpdateData;
      
      if (action === 'VALIDATE') {
        // 2A. Valider le design
        designUpdateData = {
          is_validated: true,
          is_pending: false,
          validated_at: new Date(),
          validated_by: adminId,
          rejection_reason: null
        };

        console.log(`✅ Design validé, déclenchement cascade...`);

        // 3. 🔥 CASCADE : Appliquer l'action sur tous les produits
        const affectedProducts = await applyValidationCascade(design, t);
        
        console.log(`🌊 Cascade appliquée sur ${affectedProducts.length} produits`);

        // 4. Notifier tous les vendeurs concernés
        await notifyVendorsAfterCascade(affectedProducts);

      } else {
        // 2B. Rejeter le design
        designUpdateData = {
          is_validated: false,
          is_pending: false,
          validated_at: null,
          rejection_reason: rejectionReason
        };

        console.log(`❌ Design rejeté: ${rejectionReason}`);

        // Remettre tous les produits en brouillon
        await VendorProduct.update(
          { 
            status: 'DRAFT', 
            rejection_reason: `Design rejeté: ${rejectionReason}` 
          },
          { 
            where: { 
              design_cloudinary_url: design.imageUrl,
              status: 'PENDING'
            },
            transaction: t 
          }
        );
      }

      // Mettre à jour le design
      await design.update(designUpdateData, { transaction: t });

      return { design, action };
    });

    res.json({
      success: true,
      message: action === 'VALIDATE' ? 'Design validé et cascade appliquée' : 'Design rejeté',
      design: result.design
    });

  } catch (error) {
    console.error('❌ Erreur validation design:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la validation'
    });
  }
});

/**
 * 🌊 Fonction de cascade : applique l'action sur tous les produits
 */
async function applyValidationCascade(design, transaction) {
  console.log(`🌊 Début cascade pour design: ${design.imageUrl}`);

  // Trouver tous les produits en attente avec ce design
  const pendingProducts = await VendorProduct.findAll({
    where: {
      design_cloudinary_url: design.imageUrl,
      status: 'PENDING'
    },
    include: [{
      model: User,
      as: 'vendor',
      attributes: ['id', 'name', 'email']
    }],
    transaction
  });

  console.log(`📦 ${pendingProducts.length} produits trouvés pour cascade`);

  const affectedProducts = [];

  for (const product of pendingProducts) {
    let newStatus;
    let updateData = {
      is_validated: true,
      validated_at: new Date(),
      validated_by: design.validated_by
    };

    // 🔥 Appliquer l'action choisie par le vendeur
    if (product.postValidationAction === 'AUTO_PUBLISH') {
      // Publication automatique
      newStatus = 'PUBLISHED';
      updateData.status = 'PUBLISHED';
      updateData.published_at = new Date();
      console.log(`🚀 Produit ${product.id} → PUBLISHED (AUTO_PUBLISH)`);
    } else {
      // Mise en brouillon validé
      newStatus = 'DRAFT';
      updateData.status = 'DRAFT';
      console.log(`📝 Produit ${product.id} → DRAFT validé (TO_DRAFT)`);
    }

    // Mettre à jour le produit
    await product.update(updateData, { transaction });

    affectedProducts.push({
      ...product.toJSON(),
      newStatus,
      vendor: product.vendor
    });
  }

  return affectedProducts;
}

/**
 * 📧 Notifier les vendeurs après cascade
 */
async function notifyVendorsAfterCascade(affectedProducts) {
  const vendorGroups = affectedProducts.reduce((acc, product) => {
    const vendorId = product.vendor.id;
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor: product.vendor,
        products: []
      };
    }
    acc[vendorId].products.push(product);
    return acc;
  }, {});

  for (const [vendorId, data] of Object.entries(vendorGroups)) {
    const autoPublished = data.products.filter(p => p.newStatus === 'PUBLISHED');
    const toDraft = data.products.filter(p => p.newStatus === 'DRAFT');

    if (autoPublished.length > 0) {
      await notifyVendor(vendorId, 'PRODUCTS_AUTO_PUBLISHED', {
        vendorName: data.vendor.name,
        count: autoPublished.length,
        products: autoPublished.map(p => p.name)
      });
    }

    if (toDraft.length > 0) {
      await notifyVendor(vendorId, 'PRODUCTS_VALIDATED_TO_DRAFT', {
        vendorName: data.vendor.name,
        count: toDraft.length,
        products: toDraft.map(p => p.name)
      });
    }
  }
}
```

### 3. Création produit avec design

```javascript
// routes/vendorProducts.js

/**
 * POST /api/vendor/publish
 * Créer un produit personnalisé avec design et action post-validation
 */
router.post('/publish', requireAuth, requireVendor, async (req, res) => {
  try {
    const {
      vendorName,
      vendorPrice,
      designCloudinaryUrl,
      postValidationAction,
      forcedStatus,
      productStructure
    } = req.body;
    
    const vendorId = req.user.id;

    console.log(`🛍️ Création produit par vendeur ${vendorId} avec design: ${designCloudinaryUrl}`);

    // Vérifier si le design existe et son statut
    const design = await Design.findOne({
      where: { imageUrl: designCloudinaryUrl }
    });

    let productStatus = forcedStatus || 'DRAFT';
    
    if (design) {
      if (design.is_validated) {
        // Design déjà validé → produit peut être publié directement
        productStatus = 'PUBLISHED';
      } else if (design.is_pending) {
        // Design en attente → produit en attente aussi
        productStatus = 'PENDING';
      }
    } else {
      // Nouveau design → créer et marquer en attente
      await Design.create({
        imageUrl: designCloudinaryUrl,
        vendorId: vendorId,
        is_pending: false, // Sera soumis séparément
        is_validated: false
      });
    }

    // Créer le produit
    const product = await VendorProduct.create({
      name: vendorName,
      price: vendorPrice,
      design_cloudinary_url: designCloudinaryUrl,
      post_validation_action: postValidationAction,
      status: productStatus,
      vendor_id: vendorId,
      is_validated: design?.is_validated || false,
      product_structure: productStructure,
      // ... autres champs
    });

    console.log(`✅ Produit créé avec status: ${productStatus}`);

    res.json({
      success: true,
      message: 'Produit créé avec succès',
      product: product,
      designStatus: {
        exists: !!design,
        isValidated: design?.is_validated || false,
        isPending: design?.is_pending || false
      }
    });

  } catch (error) {
    console.error('❌ Erreur création produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit'
    });
  }
});
```

### 4. Modification action post-validation

```javascript
/**
 * PUT /api/vendor-product-validation/post-validation-action/:productId
 * Modifier l'action post-validation tant que le produit n'est pas validé
 */
router.put('/post-validation-action/:productId', requireAuth, requireVendor, async (req, res) => {
  try {
    const { productId } = req.params;
    const { action } = req.body;
    const vendorId = req.user.id;

    console.log(`🔄 Modification action produit ${productId} vers: ${action}`);

    // Vérifier que le produit peut être modifié
    const product = await VendorProduct.findOne({
      where: { 
        id: productId, 
        vendor_id: vendorId,
        status: 'PENDING', // Seuls les produits en attente peuvent être modifiés
        is_validated: false
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé, déjà validé ou vous n\'êtes pas autorisé'
      });
    }

    // Mettre à jour l'action
    await product.update({
      post_validation_action: action
    });

    console.log(`✅ Action mise à jour: ${action}`);

    res.json({
      success: true,
      message: 'Action post-validation mise à jour',
      product: product
    });

  } catch (error) {
    console.error('❌ Erreur modification action:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification'
    });
  }
});
```

### 5. Publication manuelle produit validé

```javascript
/**
 * POST /api/vendor-product-validation/publish/:productId
 * Publier manuellement un produit validé en brouillon
 */
router.post('/publish/:productId', requireAuth, requireVendor, async (req, res) => {
  try {
    const { productId } = req.params;
    const vendorId = req.user.id;

    console.log(`🚀 Publication manuelle produit ${productId}`);

    // Vérifier que le produit est validé en brouillon
    const product = await VendorProduct.findOne({
      where: { 
        id: productId, 
        vendor_id: vendorId,
        status: 'DRAFT',
        is_validated: true // Doit être validé par cascade
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé, non validé ou déjà publié'
      });
    }

    // Publier le produit
    await product.update({
      status: 'PUBLISHED',
      published_at: new Date()
    });

    // Notifier le succès
    await notifyVendor(vendorId, 'PRODUCT_MANUALLY_PUBLISHED', {
      productName: product.name
    });

    console.log(`✅ Produit ${productId} publié manuellement`);

    res.json({
      success: true,
      message: 'Produit publié avec succès',
      product: product
    });

  } catch (error) {
    console.error('❌ Erreur publication manuelle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la publication'
    });
  }
});
```

### 6. Liste produits vendeur avec filtres

```javascript
/**
 * GET /api/vendor/products
 * Lister les produits du vendeur avec filtres
 */
router.get('/products', requireAuth, requireVendor, async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, isValidated } = req.query;

    console.log(`📋 Liste produits vendeur ${vendorId}, filtres:`, { status, isValidated });

    let whereClause = { vendor_id: vendorId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (isValidated !== undefined) {
      whereClause.is_validated = isValidated === 'true';
    }

    const products = await VendorProduct.findAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'price', 'status', 'is_validated', 
        'post_validation_action', 'validated_at', 'published_at',
        'rejection_reason', 'design_cloudinary_url',
        'created_at', 'updated_at'
      ],
      include: [{
        model: Design,
        as: 'design',
        attributes: ['id', 'imageUrl', 'is_validated', 'is_pending'],
        required: false
      }],
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      products: products,
      filters: { status, isValidated },
      count: products.length
    });

  } catch (error) {
    console.error('❌ Erreur liste produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des produits'
    });
  }
});
```

---

## 🔔 Système de notifications étendu

```javascript
// utils/notifications.js

/**
 * Messages de notification pour la cascade
 */
const getNotificationMessage = (type, data) => {
  const messages = {
    // Design
    'NEW_DESIGN_SUBMISSION': `🎨 ${data.vendorName} a soumis un design pour validation`,
    'DESIGN_VALIDATED': `✅ Design validé ! Cascade appliquée sur les produits`,
    'DESIGN_REJECTED': `❌ Design rejeté : ${data.rejectionReason}`,
    
    // Cascade produits
    'PRODUCTS_AUTO_PUBLISHED': `🚀 ${data.count} produit(s) publié(s) automatiquement : ${data.products.join(', ')}`,
    'PRODUCTS_VALIDATED_TO_DRAFT': `📝 ${data.count} produit(s) validé(s) en brouillon : ${data.products.join(', ')}`,
    'PRODUCT_MANUALLY_PUBLISHED': `🎉 Produit "${data.productName}" publié manuellement`,
    
    // Erreurs
    'CASCADE_ERROR': `⚠️ Erreur lors de la cascade de validation`
  };
  return messages[type] || 'Nouvelle notification';
};

/**
 * Envoyer email de notification après cascade
 */
const sendCascadeEmail = async (vendorEmail, type, data) => {
  const templates = {
    'PRODUCTS_AUTO_PUBLISHED': {
      subject: '🚀 Vos produits ont été publiés automatiquement',
      html: `
        <h2>Bonne nouvelle !</h2>
        <p>Votre design a été validé et ${data.count} produit(s) ont été publiés automatiquement :</p>
        <ul>${data.products.map(name => `<li>${name}</li>`).join('')}</ul>
        <p>Vos produits sont maintenant visibles par vos clients.</p>
      `
    },
    'PRODUCTS_VALIDATED_TO_DRAFT': {
      subject: '✅ Vos produits ont été validés',
      html: `
        <h2>Design validé !</h2>
        <p>Votre design a été validé et ${data.count} produit(s) sont prêts à être publiés :</p>
        <ul>${data.products.map(name => `<li>${name}</li>`).join('')}</ul>
        <p>Connectez-vous pour publier vos produits quand vous le souhaitez.</p>
      `
    }
  };

  const template = templates[type];
  if (template) {
    await sendEmail({
      to: vendorEmail,
      subject: template.subject,
      html: template.html
    });
  }
};

module.exports = { 
  notifyAdmins, 
  notifyVendor, 
  sendCascadeEmail,
  getNotificationMessage 
};
```

---

## 🧪 Tests de la cascade

```javascript
// test-cascade-validation.js
const axios = require('axios');

const API_BASE = 'http://localhost:3004/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

async function testCascadeValidation() {
  console.log('🌊 Test validation en cascade');
  console.log('==============================\n');

  try {
    // 1. Connexion vendeur
    console.log('1️⃣ Connexion vendeur...');
    await api.post('/auth/login', {
      email: 'vendor@test.com',
      password: 'password'
    });

    // 2. Créer plusieurs produits avec le même design
    console.log('2️⃣ Création de 3 produits avec le même design...');
    const designUrl = 'https://res.cloudinary.com/test/design-cascade.jpg';
    const products = [];

    for (let i = 1; i <= 3; i++) {
      const response = await api.post('/vendor/publish', {
        vendorName: `Produit Test Cascade ${i}`,
        vendorPrice: 2000 + (i * 100),
        designCloudinaryUrl: designUrl,
        postValidationAction: i <= 2 ? 'AUTO_PUBLISH' : 'TO_DRAFT',
        forcedStatus: 'PENDING',
        productStructure: { type: 'tshirt', size: 'M' }
      });
      products.push(response.data.product);
      console.log(`   ✅ Produit ${i} créé (action: ${i <= 2 ? 'AUTO_PUBLISH' : 'TO_DRAFT'})`);
    }

    // 3. Soumettre le design pour validation
    console.log('\n3️⃣ Soumission du design pour validation...');
    const designId = products[0].design?.id || 1; // Supposer que le design existe
    await api.post(`/designs/${designId}/submit`);
    console.log('   ✅ Design soumis');

    // 4. Connexion admin
    console.log('\n4️⃣ Connexion admin...');
    await api.post('/auth/login', {
      email: 'admin@test.com',
      password: 'admin_password'
    });

    // 5. Valider le design → Déclencher la cascade
    console.log('\n5️⃣ Validation du design → Cascade...');
    await api.put(`/designs/${designId}/validate`, {
      action: 'VALIDATE'
    });
    console.log('   ✅ Design validé, cascade déclenchée');

    // 6. Vérifier les résultats
    console.log('\n6️⃣ Vérification des résultats...');
    await api.post('/auth/login', {
      email: 'vendor@test.com',
      password: 'password'
    });

    const finalResponse = await api.get('/vendor/products');
    const finalProducts = finalResponse.data.products;

    console.log('\n📊 Résultats de la cascade:');
    for (const product of finalProducts) {
      if (products.some(p => p.id === product.id)) {
        console.log(`   - ${product.name}:`);
        console.log(`     Status: ${product.status}`);
        console.log(`     isValidated: ${product.is_validated}`);
        console.log(`     Action: ${product.post_validation_action}`);
      }
    }

    // 7. Test publication manuelle pour TO_DRAFT
    const draftProduct = finalProducts.find(p => 
      p.status === 'DRAFT' && p.is_validated && p.post_validation_action === 'TO_DRAFT'
    );

    if (draftProduct) {
      console.log('\n7️⃣ Publication manuelle du produit TO_DRAFT...');
      await api.post(`/vendor-product-validation/publish/${draftProduct.id}`);
      console.log('   ✅ Produit publié manuellement');
    }

    console.log('\n🎉 Test cascade terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur test cascade:', error.response?.data || error.message);
  }
}

// Exécuter le test
testCascadeValidation();
```

---

## 📊 Endpoints de monitoring

```javascript
// routes/admin.js

/**
 * GET /api/admin/cascade-stats
 * Statistiques de la cascade de validation
 */
router.get('/cascade-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      // Designs en attente
      Design.count({ where: { is_pending: true } }),
      
      // Produits en attente par action
      VendorProduct.count({ 
        where: { status: 'PENDING', post_validation_action: 'AUTO_PUBLISH' } 
      }),
      VendorProduct.count({ 
        where: { status: 'PENDING', post_validation_action: 'TO_DRAFT' } 
      }),
      
      // Produits validés en brouillon
      VendorProduct.count({ 
        where: { status: 'DRAFT', is_validated: true } 
      }),
      
      // Cascades récentes (dernières 24h)
      VendorProduct.count({
        where: {
          validated_at: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        pendingDesigns: stats[0],
        pendingAutoPublish: stats[1],
        pendingToDraft: stats[2],
        validatedDrafts: stats[3],
        recentCascades: stats[4]
      }
    });

  } catch (error) {
    console.error('❌ Erreur stats cascade:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des statistiques'
    });
  }
});
```

---

## ✅ Checklist d'implémentation

### Base de données ✅
- [ ] Modifier table `designs` (validation)
- [ ] Modifier table `vendor_products` (cascade)
- [ ] Créer table `design_products` (optionnelle)
- [ ] Ajouter index de performance

### Endpoints ✅
- [ ] `POST /api/designs/:id/submit`
- [ ] `PUT /api/designs/:id/validate` (avec cascade)
- [ ] `POST /api/vendor/publish` (avec design)
- [ ] `PUT /api/vendor-product-validation/post-validation-action/:productId`
- [ ] `POST /api/vendor-product-validation/publish/:productId`
- [ ] `GET /api/vendor/products` (avec filtres)

### Logique cascade ✅
- [ ] Fonction `applyValidationCascade()`
- [ ] Transaction pour cohérence
- [ ] Notifications multi-vendeurs
- [ ] Gestion des erreurs

### Notifications ✅
- [ ] Notifications en base
- [ ] Emails de cascade
- [ ] WebSocket (optionnel)

### Tests ✅
- [ ] Test cascade complète
- [ ] Test publication manuelle
- [ ] Test modification action
- [ ] Monitoring admin

---

## 🚀 Points clés de l'implémentation

### **1. Transaction critique :**
```javascript
const result = await sequelize.transaction(async (t) => {
  // Valider design
  // Appliquer cascade
  // Notifier vendeurs
});
```

### **2. Logique de cascade :**
```javascript
if (product.postValidationAction === 'AUTO_PUBLISH') {
  product.status = 'PUBLISHED'; // Immédiat
} else {
  product.status = 'DRAFT'; // Manuel
  product.isValidated = true;
}
```

### **3. Gestion des erreurs :**
- Rollback automatique en cas d'erreur
- Notifications d'erreur aux admins
- Logs détaillés pour debugging

---

**🎉 Avec cette implémentation, le système de validation en cascade design → produits sera entièrement fonctionnel !**

**Avantages :**
- ✅ **Validation en une fois** pour tous les produits d'un design
- ✅ **Respect du choix** de chaque vendeur (auto/manuel)
- ✅ **Notifications intelligentes** par type d'action
- ✅ **Cohérence transactionnelle** garantie
- ✅ **Monitoring** et statistiques pour les admins 
 