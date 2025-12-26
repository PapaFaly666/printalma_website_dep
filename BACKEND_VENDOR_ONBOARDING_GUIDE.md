# 🔧 Guide Backend - Onboarding Vendeur

## 📋 Vue d'ensemble

Ce guide décrit l'implémentation complète du backend pour gérer l'onboarding des vendeurs, incluant :
- Enregistrement des numéros de téléphone (minimum 2, maximum 3)
- Enregistrement des réseaux sociaux (optionnel)
- Upload de la photo de profil
- Vérification du statut de complétion du profil
- Modification ultérieure des informations

---

## 🗄️ Structure de la base de données

### 1. Table `vendors` (modification)

Ajouter les colonnes suivantes à la table existante :

```sql
ALTER TABLE vendors
ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN profile_image VARCHAR(500) NULL,
ADD COLUMN onboarding_completed_at TIMESTAMP NULL;
```

### 2. Nouvelle table `vendor_phones`

```sql
CREATE TABLE vendor_phones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vendor_phone (vendor_id, phone_number),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_primary (vendor_id, is_primary)
);

-- Contrainte : Un seul numéro principal par vendeur
-- Sera géré dans le code avec une transaction
```

### 3. Nouvelle table `vendor_social_media`

```sql
CREATE TABLE vendor_social_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'youtube') NOT NULL,
  url VARCHAR(500) NOT NULL,
  username VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vendor_platform (vendor_id, platform),
  INDEX idx_vendor_id (vendor_id)
);
```

---

## 📁 Structure des fichiers backend

```
backend/
├── routes/
│   └── vendorOnboarding.js          # Routes d'onboarding
├── controllers/
│   └── vendorOnboardingController.js # Logique métier
├── middleware/
│   ├── uploadMiddleware.js          # Multer pour upload images
│   └── vendorAuth.js                 # Middleware d'authentification vendeur
├── utils/
│   ├── imageUpload.js                # Helpers upload d'images
│   └── validation.js                 # Validations (téléphone, URLs)
└── migrations/
    └── 001_vendor_onboarding.sql     # Script de migration SQL
```

---

## 🚀 Implémentation

### 1. Migration SQL

**Fichier** : `backend/migrations/001_vendor_onboarding.sql`

```sql
-- Migration pour l'onboarding vendeur
-- Exécuter dans l'ordre

-- 1. Modifier la table vendors
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP NULL;

-- 2. Créer la table vendor_phones
CREATE TABLE IF NOT EXISTS vendor_phones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vendor_phone (vendor_id, phone_number),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_primary (vendor_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Créer la table vendor_social_media
CREATE TABLE IF NOT EXISTS vendor_social_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'youtube') NOT NULL,
  url VARCHAR(500) NOT NULL,
  username VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vendor_platform (vendor_id, platform),
  INDEX idx_vendor_id (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Nettoyer les anciennes données si nécessaire
-- DELETE FROM vendor_phones WHERE vendor_id NOT IN (SELECT id FROM vendors);
-- DELETE FROM vendor_social_media WHERE vendor_id NOT IN (SELECT id FROM vendors);
```

### 2. Middleware d'upload d'images

**Fichier** : `backend/middleware/uploadMiddleware.js`

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, '../uploads/vendors/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Format: vendor_123_timestamp.jpg
    const vendorId = req.user?.id || 'temp';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `vendor_${vendorId}_${timestamp}${ext}`);
  }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.'));
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: fileFilter
});

module.exports = upload;
```

### 3. Utilitaires de validation

**Fichier** : `backend/utils/validation.js`

```javascript
/**
 * Valider un numéro de téléphone sénégalais
 * Formats acceptés: +221XXXXXXXXX, 221XXXXXXXXX, 7XXXXXXXX, 3XXXXXXXX
 */
function validateSenegalPhone(phone) {
  const cleanedPhone = phone.replace(/[\s-]/g, '');
  const phoneRegex = /^(\+?221|221)?[73][0-9]{8}$/;
  return phoneRegex.test(cleanedPhone);
}

/**
 * Normaliser un numéro de téléphone sénégalais
 * Retourne au format +221XXXXXXXXX
 */
function normalizeSenegalPhone(phone) {
  let cleaned = phone.replace(/[\s-]/g, '');

  // Ajouter +221 si manquant
  if (!cleaned.startsWith('+221') && !cleaned.startsWith('221')) {
    cleaned = '+221' + cleaned;
  } else if (cleaned.startsWith('221')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Valider une URL de réseau social
 */
function validateSocialUrl(platform, url) {
  if (!url || url.trim() === '') return true; // Optionnel

  const patterns = {
    facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/.+$/i,
    instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/.+$/i,
    twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+$/i,
    linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/.+$/i,
    youtube: /^(https?:\/\/)?(www\.)?youtube\.com\/@?.+$/i
  };

  return patterns[platform]?.test(url) || false;
}

/**
 * Extraire le nom d'utilisateur d'une URL de réseau social
 */
function extractUsername(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const pathname = urlObj.pathname;
    return pathname.split('/').filter(Boolean).pop() || '';
  } catch {
    return url;
  }
}

module.exports = {
  validateSenegalPhone,
  normalizeSenegalPhone,
  validateSocialUrl,
  extractUsername
};
```

### 4. Controller

**Fichier** : `backend/controllers/vendorOnboardingController.js`

```javascript
const db = require('../config/database');
const {
  validateSenegalPhone,
  normalizeSenegalPhone,
  validateSocialUrl,
  extractUsername
} = require('../utils/validation');
const path = require('path');
const fs = require('fs');

/**
 * Compléter l'onboarding vendeur
 * POST /api/vendor/complete-onboarding
 */
exports.completeOnboarding = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const vendorId = req.user.id;
    const { phones, socialMedia } = req.body;

    // 1. Validation des numéros de téléphone
    if (!phones || !Array.isArray(phones) || phones.length < 2 || phones.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez fournir entre 2 et 3 numéros de téléphone'
      });
    }

    // Valider chaque numéro
    const validatedPhones = [];
    let primaryCount = 0;

    for (const phone of phones) {
      if (!validateSenegalPhone(phone.number)) {
        return res.status(400).json({
          success: false,
          message: `Numéro invalide: ${phone.number}. Format attendu: +221XXXXXXXXX ou 7XXXXXXXX`
        });
      }

      const normalized = normalizeSenegalPhone(phone.number);
      validatedPhones.push({
        number: normalized,
        isPrimary: phone.isPrimary || false
      });

      if (phone.isPrimary) primaryCount++;
    }

    // Vérifier qu'il y a exactement un numéro principal
    if (primaryCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez désigner exactement un numéro comme principal'
      });
    }

    // Vérifier les doublons
    const phoneNumbers = validatedPhones.map(p => p.number);
    if (new Set(phoneNumbers).size !== phoneNumbers.length) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez fourni le même numéro plusieurs fois'
      });
    }

    // 2. Supprimer les anciens numéros du vendeur
    await connection.query(
      'DELETE FROM vendor_phones WHERE vendor_id = ?',
      [vendorId]
    );

    // 3. Insérer les nouveaux numéros
    for (const phone of validatedPhones) {
      await connection.query(
        'INSERT INTO vendor_phones (vendor_id, phone_number, is_primary) VALUES (?, ?, ?)',
        [vendorId, phone.number, phone.isPrimary]
      );
    }

    // 4. Traiter les réseaux sociaux (optionnel)
    if (socialMedia && Array.isArray(socialMedia) && socialMedia.length > 0) {
      // Valider chaque réseau social
      for (const social of socialMedia) {
        if (!validateSocialUrl(social.platform, social.url)) {
          return res.status(400).json({
            success: false,
            message: `URL invalide pour ${social.platform}: ${social.url}`
          });
        }
      }

      // Supprimer les anciens réseaux sociaux
      await connection.query(
        'DELETE FROM vendor_social_media WHERE vendor_id = ?',
        [vendorId]
      );

      // Insérer les nouveaux
      for (const social of socialMedia) {
        const username = extractUsername(social.url);
        await connection.query(
          'INSERT INTO vendor_social_media (vendor_id, platform, url, username) VALUES (?, ?, ?, ?)',
          [vendorId, social.platform, social.url, username]
        );
      }
    }

    // 5. Traiter la photo de profil (si uploadée via multer)
    let profileImagePath = null;
    if (req.file) {
      profileImagePath = `/uploads/vendors/profiles/${req.file.filename}`;

      // Supprimer l'ancienne photo si elle existe
      const [oldVendor] = await connection.query(
        'SELECT profile_image FROM vendors WHERE id = ?',
        [vendorId]
      );

      if (oldVendor[0]?.profile_image) {
        const oldImagePath = path.join(__dirname, '../', oldVendor[0].profile_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    // 6. Mettre à jour le profil vendeur
    const updateQuery = profileImagePath
      ? 'UPDATE vendors SET profile_completed = TRUE, profile_image = ?, onboarding_completed_at = NOW() WHERE id = ?'
      : 'UPDATE vendors SET profile_completed = TRUE, onboarding_completed_at = NOW() WHERE id = ?';

    const updateParams = profileImagePath
      ? [profileImagePath, vendorId]
      : [vendorId];

    await connection.query(updateQuery, updateParams);

    // 7. Commit de la transaction
    await connection.commit();

    // 8. Récupérer les données complètes du vendeur
    const [vendor] = await connection.query(
      `SELECT
        v.*,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('number', phone_number, 'isPrimary', is_primary)
        ) FROM vendor_phones WHERE vendor_id = v.id) as phones,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('platform', platform, 'url', url, 'username', username)
        ) FROM vendor_social_media WHERE vendor_id = v.id) as socialMedia
      FROM vendors v
      WHERE v.id = ?`,
      [vendorId]
    );

    res.json({
      success: true,
      message: 'Profil complété avec succès',
      vendor: {
        id: vendor[0].id,
        profileCompleted: vendor[0].profile_completed,
        profileImage: vendor[0].profile_image,
        phones: JSON.parse(vendor[0].phones || '[]'),
        socialMedia: JSON.parse(vendor[0].socialMedia || '[]')
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur onboarding vendeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la complétion du profil',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Vérifier le statut de complétion du profil
 * GET /api/vendor/profile-status
 */
exports.getProfileStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const [vendor] = await db.query(
      `SELECT
        v.profile_completed,
        v.profile_image,
        v.onboarding_completed_at,
        COUNT(DISTINCT vp.id) as phone_count,
        COUNT(DISTINCT vsm.id) as social_count
      FROM vendors v
      LEFT JOIN vendor_phones vp ON vp.vendor_id = v.id
      LEFT JOIN vendor_social_media vsm ON vsm.vendor_id = v.id
      WHERE v.id = ?
      GROUP BY v.id`,
      [vendorId]
    );

    if (!vendor[0]) {
      return res.status(404).json({
        success: false,
        message: 'Vendeur non trouvé'
      });
    }

    const isComplete = vendor[0].profile_completed && vendor[0].phone_count >= 2;

    res.json({
      success: true,
      profileCompleted: isComplete,
      details: {
        hasProfileImage: !!vendor[0].profile_image,
        phoneCount: vendor[0].phone_count,
        socialMediaCount: vendor[0].social_count,
        completedAt: vendor[0].onboarding_completed_at
      }
    });

  } catch (error) {
    console.error('Erreur vérification profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du profil'
    });
  }
};

/**
 * Récupérer les informations d'onboarding du vendeur
 * GET /api/vendor/onboarding-info
 */
exports.getOnboardingInfo = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const [vendor] = await db.query(
      `SELECT
        v.profile_image,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', id, 'number', phone_number, 'isPrimary', is_primary)
        ) FROM vendor_phones WHERE vendor_id = v.id) as phones,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', id, 'platform', platform, 'url', url, 'username', username)
        ) FROM vendor_social_media WHERE vendor_id = v.id) as socialMedia
      FROM vendors v
      WHERE v.id = ?`,
      [vendorId]
    );

    if (!vendor[0]) {
      return res.status(404).json({
        success: false,
        message: 'Vendeur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        profileImage: vendor[0].profile_image,
        phones: JSON.parse(vendor[0].phones || '[]'),
        socialMedia: JSON.parse(vendor[0].socialMedia || '[]')
      }
    });

  } catch (error) {
    console.error('Erreur récupération info onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations'
    });
  }
};

/**
 * Mettre à jour les numéros de téléphone
 * PUT /api/vendor/update-phones
 */
exports.updatePhones = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const vendorId = req.user.id;
    const { phones } = req.body;

    // Validation (même logique que completeOnboarding)
    if (!phones || !Array.isArray(phones) || phones.length < 2 || phones.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez fournir entre 2 et 3 numéros de téléphone'
      });
    }

    const validatedPhones = [];
    let primaryCount = 0;

    for (const phone of phones) {
      if (!validateSenegalPhone(phone.number)) {
        return res.status(400).json({
          success: false,
          message: `Numéro invalide: ${phone.number}`
        });
      }

      const normalized = normalizeSenegalPhone(phone.number);
      validatedPhones.push({
        number: normalized,
        isPrimary: phone.isPrimary || false
      });

      if (phone.isPrimary) primaryCount++;
    }

    if (primaryCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez désigner exactement un numéro comme principal'
      });
    }

    const phoneNumbers = validatedPhones.map(p => p.number);
    if (new Set(phoneNumbers).size !== phoneNumbers.length) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez fourni le même numéro plusieurs fois'
      });
    }

    // Supprimer et réinsérer
    await connection.query('DELETE FROM vendor_phones WHERE vendor_id = ?', [vendorId]);

    for (const phone of validatedPhones) {
      await connection.query(
        'INSERT INTO vendor_phones (vendor_id, phone_number, is_primary) VALUES (?, ?, ?)',
        [vendorId, phone.number, phone.isPrimary]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Numéros de téléphone mis à jour avec succès'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur mise à jour numéros:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des numéros'
    });
  } finally {
    connection.release();
  }
};

module.exports = exports;
```

### 5. Routes

**Fichier** : `backend/routes/vendorOnboarding.js`

```javascript
const express = require('express');
const router = express.Router();
const vendorOnboardingController = require('../controllers/vendorOnboardingController');
const { authenticateVendor } = require('../middleware/vendorAuth');
const upload = require('../middleware/uploadMiddleware');

// Toutes les routes nécessitent l'authentification vendeur
router.use(authenticateVendor);

// Compléter l'onboarding (avec upload de photo)
router.post(
  '/complete-onboarding',
  upload.single('profileImage'),
  vendorOnboardingController.completeOnboarding
);

// Vérifier le statut du profil
router.get('/profile-status', vendorOnboardingController.getProfileStatus);

// Récupérer les informations d'onboarding
router.get('/onboarding-info', vendorOnboardingController.getOnboardingInfo);

// Mettre à jour les numéros de téléphone
router.put('/update-phones', vendorOnboardingController.updatePhones);

module.exports = router;
```

### 6. Intégration dans api.js

**Fichier** : `backend/routes/api.js`

```javascript
// Ajouter cette ligne avec les autres imports de routes
const vendorOnboardingRoutes = require('./vendorOnboarding');

// Ajouter cette ligne avec les autres app.use
app.use('/api/vendor', vendorOnboardingRoutes);
```

---

## 🧪 Tests avec Postman/cURL

### 1. Compléter l'onboarding

```bash
POST http://localhost:3004/api/vendor/complete-onboarding
Content-Type: multipart/form-data
Cookie: sessionId=xxx  # Session vendeur

# Form Data:
phones: [
  {"number": "+221771234567", "isPrimary": true},
  {"number": "772345678", "isPrimary": false}
]
socialMedia: [
  {"platform": "facebook", "url": "https://facebook.com/myshop"},
  {"platform": "instagram", "url": "https://instagram.com/myshop"}
]
profileImage: [fichier image]
```

### 2. Vérifier le statut

```bash
GET http://localhost:3004/api/vendor/profile-status
Cookie: sessionId=xxx
```

### 3. Récupérer les infos

```bash
GET http://localhost:3004/api/vendor/onboarding-info
Cookie: sessionId=xxx
```

### 4. Mettre à jour les numéros

```bash
PUT http://localhost:3004/api/vendor/update-phones
Content-Type: application/json
Cookie: sessionId=xxx

{
  "phones": [
    {"number": "+221771234567", "isPrimary": true},
    {"number": "+221772345678", "isPrimary": false}
  ]
}
```

---

## ✅ Checklist de déploiement

- [ ] Exécuter le script de migration SQL
- [ ] Créer le dossier `backend/uploads/vendors/profiles/`
- [ ] Installer les dépendances: `npm install multer`
- [ ] Copier les fichiers dans le backend
- [ ] Ajouter les routes dans `api.js`
- [ ] Tester avec Postman
- [ ] Configurer les permissions du dossier uploads
- [ ] Ajouter le dossier uploads au `.gitignore`

---

## 🔒 Sécurité

1. **Validation stricte** des numéros de téléphone
2. **Limite de taille** des images (5 MB)
3. **Types de fichiers** autorisés uniquement
4. **Transactions SQL** pour garantir la cohérence
5. **Suppression des anciennes images** lors du remplacement
6. **Authentification requise** sur toutes les routes

---

## 📝 Notes importantes

- Les réseaux sociaux sont **optionnels** et peuvent être ajoutés/modifiés plus tard
- Un vendeur peut **modifier ses numéros** après l'onboarding
- La photo de profil est **requise** pour compléter l'onboarding
- Le système vérifie qu'il y a **exactement un numéro principal**
- Les numéros sont **normalisés** au format `+221XXXXXXXXX`
