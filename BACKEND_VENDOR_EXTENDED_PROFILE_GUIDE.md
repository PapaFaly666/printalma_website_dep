# 🚀 Guide Backend - Profil Vendeur Étendu

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation des nouveaux champs pour la création et gestion des profils vendeurs étendus dans l'API backend PrintAlma.

## 🆕 Nouveaux Champs Ajoutés

### Structure de données étendue

```typescript
interface VendorExtendedProfile {
  // Champs existants
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
  
  // 🆕 NOUVEAUX CHAMPS
  phone?: string;           // Numéro de téléphone
  country?: string;         // Pays de résidence
  address?: string;         // Adresse complète
  shopName: string;         // Nom de la boutique (obligatoire)
  profilePhoto?: File;      // Photo de profil (upload)
}
```

## 🛠️ Modifications Database

### 1. Migration de la table `users`

```sql
-- Ajouter les nouveaux champs à la table users
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20),
ADD COLUMN country VARCHAR(100),
ADD COLUMN address TEXT,
ADD COLUMN shop_name VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN profile_photo_url VARCHAR(500);

-- Index pour optimiser les recherches
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_shop_name ON users(shop_name);
```

### 2. Table pour gestion des uploads (optionnel)

```sql
-- Table pour tracer les uploads de photos
CREATE TABLE vendor_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔧 Endpoint API Modifié

### POST `/api/admin/create-vendor`

#### Request Body Multipart/Form-Data

```typescript
interface CreateVendorRequest {
  // Champs obligatoires
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
  shopName: string;
  
  // Champs optionnels
  phone?: string;
  country?: string;
  address?: string;
  profilePhoto?: File; // Fichier image
}
```

#### Validation des données

```javascript
const validateVendorData = (req) => {
  const errors = [];
  
  // Validations obligatoires
  if (!req.body.firstName?.trim()) {
    errors.push('Le prénom est requis');
  }
  
  if (!req.body.lastName?.trim()) {
    errors.push('Le nom est requis');
  }
  
  if (!req.body.email?.trim()) {
    errors.push('L\'email est requis');
  } else if (!isValidEmail(req.body.email)) {
    errors.push('Format d\'email invalide');
  }
  
  if (!req.body.vendeur_type) {
    errors.push('Le type de vendeur est requis');
  }
  
  if (!req.body.shopName?.trim()) {
    errors.push('Le nom de la boutique est requis');
  }
  
  // Validations optionnelles
  if (req.body.phone && !isValidPhone(req.body.phone)) {
    errors.push('Format de téléphone invalide');
  }
  
  if (req.file && !isValidImage(req.file)) {
    errors.push('Format d\'image invalide ou taille trop importante');
  }
  
  return errors;
};

const isValidPhone = (phone) => {
  return /^[\+]?[0-9\s\-\(\)]{8,}$/.test(phone);
};

const isValidImage = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  return allowedTypes.includes(file.mimetype) && file.size <= maxSize;
};
```

## 📁 Gestion des Uploads

### Configuration Multer

```javascript
const multer = require('multer');
const path = require('path');

// Configuration pour les photos de profil
const profilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-photos/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `vendor_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});
```

## 🔄 Implémentation Complète

### Contrôleur principal

```javascript
const createVendor = async (req, res) => {
  try {
    // 1. Validation des données
    const validationErrors = validateVendorData(req);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }

    // 2. Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    }

    // 3. Gérer l'upload de photo
    let profilePhotoUrl = null;
    if (req.file) {
      profilePhotoUrl = `/uploads/profile-photos/${req.file.filename}`;
      
      // Optionnel : Enregistrer dans la table uploads
      await VendorUpload.create({
        user_id: null, // Sera mis à jour après création du user
        file_path: profilePhotoUrl,
        file_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      });
    }

    // 4. Générer mot de passe temporaire
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 5. Créer le vendeur
    const newVendor = await User.create({
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      email: req.body.email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'VENDEUR',
      vendeur_type: req.body.vendeur_type,
      phone: req.body.phone?.trim() || null,
      country: req.body.country || null,
      address: req.body.address?.trim() || null,
      shop_name: req.body.shopName.trim(),
      profile_photo_url: profilePhotoUrl,
      status: true,
      must_change_password: true
    });

    // 6. Mettre à jour l'ID user dans uploads si photo
    if (req.file) {
      await VendorUpload.update(
        { user_id: newVendor.id },
        { where: { file_path: profilePhotoUrl, user_id: null } }
      );
    }

    // 7. Envoyer email avec identifiants
    await sendVendorWelcomeEmail({
      email: newVendor.email,
      firstName: newVendor.firstName,
      lastName: newVendor.lastName,
      tempPassword: tempPassword,
      shopName: newVendor.shop_name
    });

    // 8. Réponse succès
    res.status(201).json({
      success: true,
      message: 'Vendeur créé avec succès',
      user: {
        id: newVendor.id,
        firstName: newVendor.firstName,
        lastName: newVendor.lastName,
        email: newVendor.email,
        vendeur_type: newVendor.vendeur_type,
        shop_name: newVendor.shop_name,
        phone: newVendor.phone,
        country: newVendor.country,
        address: newVendor.address,
        profile_photo_url: newVendor.profile_photo_url,
        created_at: newVendor.created_at
      }
    });

  } catch (error) {
    console.error('Erreur création vendeur:', error);
    
    // Nettoyer le fichier uploadé en cas d'erreur
    if (req.file) {
      const fs = require('fs');
      const filePath = path.join('uploads/profile-photos/', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Erreur suppression fichier:', err);
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
```

### Route Express

```javascript
const express = require('express');
const router = express.Router();

// Route pour créer un vendeur avec upload
router.post('/create-vendor', 
  authenticateAdmin, // Middleware d'authentification admin
  uploadProfilePhoto.single('profilePhoto'), // Middleware upload
  createVendor
);

module.exports = router;
```

## 📧 Template Email de Bienvenue

```javascript
const sendVendorWelcomeEmail = async (vendorData) => {
  const { email, firstName, lastName, tempPassword, shopName } = vendorData;
  
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Bienvenue sur PrintAlma</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #000; text-align: center;">Bienvenue sur PrintAlma !</h1>
            
            <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
            
            <p>Votre compte vendeur a été créé avec succès sur la plateforme PrintAlma.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Informations de votre boutique :</h3>
                <ul>
                    <li><strong>Nom de la boutique :</strong> ${shopName}</li>
                    <li><strong>Email de connexion :</strong> ${email}</li>
                    <li><strong>Mot de passe temporaire :</strong> <code style="background: #e9e9e9; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></li>
                </ul>
            </div>
            
            <p><strong>⚠️ Important :</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre première connexion.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/login" 
                   style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Se connecter à PrintAlma
                </a>
            </div>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="text-align: center; color: #666; font-size: 14px;">
                © 2024 PrintAlma - Plateforme de création et vente de designs
            </p>
        </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Bienvenue sur PrintAlma - Votre boutique "${shopName}" est prête !`,
    html: emailTemplate
  });
};
```

## 🔍 Endpoints de Consultation

### GET `/api/vendor/profile` - Profil vendeur complet

```javascript
const getVendorProfile = async (req, res) => {
  try {
    const vendor = await User.findByPk(req.user.id, {
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'vendeur_type',
        'phone', 'country', 'address', 'shop_name', 'profile_photo_url',
        'created_at', 'last_login_at'
      ]
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendeur non trouvé'
      });
    }

    res.json({
      success: true,
      vendor: vendor
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
```

### PUT `/api/vendor/profile` - Mise à jour profil

```javascript
const updateVendorProfile = async (req, res) => {
  try {
    const allowedFields = ['phone', 'country', 'address', 'shop_name'];
    const updateData = {};

    // Filtrer les champs autorisés
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Gérer la nouvelle photo si fournie
    if (req.file) {
      updateData.profile_photo_url = `/uploads/profile-photos/${req.file.filename}`;
      
      // Supprimer l'ancienne photo
      const vendor = await User.findByPk(req.user.id);
      if (vendor.profile_photo_url) {
        const oldPhotoPath = path.join(process.cwd(), vendor.profile_photo_url);
        fs.unlink(oldPhotoPath, (err) => {
          if (err) console.error('Erreur suppression ancienne photo:', err);
        });
      }
    }

    await User.update(updateData, {
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
```

## 📊 Statistiques Étendues

### Statistiques par pays

```javascript
const getVendorStatsByCountry = async (req, res) => {
  try {
    const stats = await User.findAll({
      attributes: [
        'country',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { role: 'VENDEUR' },
      group: ['country'],
      order: [[sequelize.literal('count'), 'DESC']]
    });

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Erreur stats pays:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
```

## 🔒 Sécurité et Bonnes Pratiques

### 1. Validation des uploads
- Limiter la taille des fichiers (5MB max)
- Vérifier le type MIME
- Scanner les fichiers contre les malwares (optionnel)

### 2. Protection des données
- Crypter les informations sensibles
- Logs d'audit pour les modifications
- Respect RGPD pour les données personnelles

### 3. Optimisation des performances
- Index sur les colonnes searchables
- Pagination pour les listes
- Cache pour les données fréquemment accédées

## 🚀 Déploiement

### Variables d'environnement

```bash
# Ajout dans .env
UPLOAD_MAX_SIZE=5242880  # 5MB
PROFILE_PHOTOS_DIR=uploads/profile-photos
EMAIL_TEMPLATES_DIR=templates/emails
```

### Structure des dossiers

```
uploads/
├── profile-photos/
│   ├── vendor_1234567890_123456789.jpg
│   └── vendor_1234567891_123456790.png
└── temp/
    └── (fichiers temporaires)
```

## ✅ Tests

### Test de création vendeur complet

```javascript
describe('Création vendeur étendu', () => {
  it('devrait créer un vendeur avec tous les champs', async () => {
    const vendorData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@test.com',
      vendeur_type: 'DESIGNER',
      phone: '+33 6 12 34 56 78',
      country: 'France',
      address: '123 Rue de la Paix, 75001 Paris',
      shopName: 'Boutique Design Jean'
    };

    const response = await request(app)
      .post('/api/admin/create-vendor')
      .field('firstName', vendorData.firstName)
      .field('lastName', vendorData.lastName)
      .field('email', vendorData.email)
      .field('vendeur_type', vendorData.vendeur_type)
      .field('phone', vendorData.phone)
      .field('country', vendorData.country)
      .field('address', vendorData.address)
      .field('shopName', vendorData.shopName)
      .attach('profilePhoto', 'test/fixtures/test-avatar.jpg')
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.user.shop_name).toBe(vendorData.shopName);
  });
});
```

---

## 📝 Résumé des Modifications

1. ✅ **Base de données** : Ajout de 5 nouvelles colonnes
2. ✅ **API** : Extension de l'endpoint de création
3. ✅ **Upload** : Gestion des photos de profil
4. ✅ **Validation** : Contrôles étendus des données
5. ✅ **Email** : Template de bienvenue amélioré
6. ✅ **Sécurité** : Bonnes pratiques implémentées

Cette implémentation permet une gestion complète des profils vendeurs étendus tout en maintenant la compatibilité avec l'existant. 