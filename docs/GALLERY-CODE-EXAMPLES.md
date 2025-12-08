# 💻 Exemples de Code - Système de Galerie

## 🎯 Snippets Prêts à l'Emploi

### 1. Connexion API dans le Frontend

#### Remplacer les Mock Data

**Dans `VendorGalleryPage.tsx`, ligne ~82** :

```typescript
// ❌ AVANT (Mock)
const loadGalleries = async () => {
  setIsLoading(true);
  try {
    const mockGalleries: Gallery[] = [
      {
        id: 1,
        vendorId: user?.id || 0,
        title: 'Collection Été 2024',
        // ...
      }
    ];
    setGalleries(mockGalleries);
  } catch (error) {
    toast.error('Erreur lors du chargement des galeries');
  } finally {
    setIsLoading(false);
  }
};

// ✅ APRÈS (API Réelle)
const loadGalleries = async () => {
  setIsLoading(true);
  try {
    const response = await galleryService.getVendorGalleries();
    setGalleries(response.galleries);
  } catch (error) {
    toast.error('Erreur lors du chargement des galeries');
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};
```

---

### 2. Backend - Configuration Express Complète

#### app.js ou server.js

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requêtes max par fenêtre
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const galleryRoutes = require('./routes/gallery.routes');
app.use('/api/vendor/galleries', galleryRoutes);

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur'
  });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
```

---

### 3. Middleware d'Authentification Vendeur

#### middleware/auth.middleware.js

```javascript
const jwt = require('jsonwebtoken');

/**
 * Middleware pour vérifier que l'utilisateur est authentifié et est un vendeur
 */
const authenticateVendor = async (req, res, next) => {
  try {
    // Récupérer le token depuis les cookies ou headers
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que l'utilisateur est un vendeur
    if (decoded.role !== 'VENDEUR') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux vendeurs.'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      vendorType: decoded.vendorType
    };

    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

module.exports = { authenticateVendor };
```

---

### 4. Configuration Cloudinary (Alternative à Sharp)

#### config/cloudinary.config.js

```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage Cloudinary pour Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: `galleries/${req.user.id}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };
  }
});

const galleryUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  }
});

module.exports = { galleryUpload, cloudinary };
```

---

### 5. Utilisation avec Prisma ORM (Alternative SQL brut)

#### prisma/schema.prisma

```prisma
model VendorGallery {
  id          Int      @id @default(autoincrement())
  vendorId    Int      @map("vendor_id")
  title       String   @db.VarChar(100)
  description String?  @db.Text
  status      GalleryStatus @default(DRAFT)
  isPublished Boolean  @default(false) @map("is_published")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  vendor User @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  images GalleryImage[]

  @@index([vendorId])
  @@index([status])
  @@map("vendor_galleries")
}

model GalleryImage {
  id            Int      @id @default(autoincrement())
  galleryId     Int      @map("gallery_id")
  imageUrl      String   @map("image_url") @db.VarChar(500)
  imagePath     String   @map("image_path") @db.VarChar(500)
  caption       String?  @db.VarChar(200)
  orderPosition Int      @map("order_position")
  fileSize      Int      @map("file_size")
  mimeType      String   @map("mime_type") @db.VarChar(50)
  width         Int?
  height        Int?
  createdAt     DateTime @default(now()) @map("created_at")

  gallery VendorGallery @relation(fields: [galleryId], references: [id], onDelete: Cascade)

  @@unique([galleryId, orderPosition])
  @@index([galleryId])
  @@map("gallery_images")
}

enum GalleryStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

#### Contrôleur avec Prisma

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class GalleryController {
  async createGallery(req, res) {
    try {
      const { title, description } = req.body;
      const vendorId = req.user.id;
      const files = req.files;

      // Créer la galerie avec les images en transaction
      const gallery = await prisma.$transaction(async (tx) => {
        // Créer la galerie
        const newGallery = await tx.vendorGallery.create({
          data: {
            vendorId,
            title,
            description,
            status: 'DRAFT'
          }
        });

        // Créer les images
        const imageData = files.map((file, index) => ({
          galleryId: newGallery.id,
          imageUrl: file.path,
          imagePath: file.path,
          caption: req.body.captions?.[index] || null,
          orderPosition: index + 1,
          fileSize: file.size,
          mimeType: file.mimetype,
          width: file.width,
          height: file.height
        }));

        await tx.galleryImage.createMany({
          data: imageData
        });

        // Retourner la galerie avec les images
        return tx.vendorGallery.findUnique({
          where: { id: newGallery.id },
          include: { images: { orderBy: { orderPosition: 'asc' } } }
        });
      });

      res.status(201).json({
        success: true,
        message: 'Galerie créée avec succès',
        data: gallery
      });
    } catch (error) {
      console.error('Erreur création galerie:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la galerie'
      });
    }
  }

  async getVendorGalleries(req, res) {
    try {
      const vendorId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const galleries = await prisma.vendorGallery.findMany({
        where: {
          vendorId,
          deletedAt: null,
          ...(status && { status })
        },
        include: {
          images: {
            orderBy: { orderPosition: 'asc' }
          }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.vendorGallery.count({
        where: {
          vendorId,
          deletedAt: null,
          ...(status && { status })
        }
      });

      res.json({
        success: true,
        data: {
          galleries,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur récupération galeries:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des galeries'
      });
    }
  }
}

module.exports = new GalleryController();
```

---

### 6. Tests avec Supertest & Jest

#### tests/gallery.test.js

```javascript
const request = require('supertest');
const app = require('../app');
const path = require('path');

describe('Gallery API Tests', () => {
  let vendorToken;
  let galleryId;

  beforeAll(async () => {
    // Login pour obtenir le token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'vendor@test.com',
        password: 'testpassword123'
      });

    vendorToken = loginRes.body.token;
  });

  describe('POST /api/vendor/galleries', () => {
    it('devrait créer une galerie avec 5 images', async () => {
      const res = await request(app)
        .post('/api/vendor/galleries')
        .set('Authorization', `Bearer ${vendorToken}`)
        .field('title', 'Test Gallery')
        .field('description', 'Test Description')
        .attach('images', path.join(__dirname, 'fixtures/image1.jpg'))
        .attach('images', path.join(__dirname, 'fixtures/image2.jpg'))
        .attach('images', path.join(__dirname, 'fixtures/image3.jpg'))
        .attach('images', path.join(__dirname, 'fixtures/image4.jpg'))
        .attach('images', path.join(__dirname, 'fixtures/image5.jpg'));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Gallery');
      expect(res.body.data.images).toHaveLength(5);

      galleryId = res.body.data.id;
    });

    it('devrait rejeter moins de 5 images', async () => {
      const res = await request(app)
        .post('/api/vendor/galleries')
        .set('Authorization', `Bearer ${vendorToken}`)
        .field('title', 'Incomplete Gallery')
        .attach('images', path.join(__dirname, 'fixtures/image1.jpg'));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('devrait rejeter un fichier trop volumineux', async () => {
      const res = await request(app)
        .post('/api/vendor/galleries')
        .set('Authorization', `Bearer ${vendorToken}`)
        .field('title', 'Large File Test')
        .attach('images', path.join(__dirname, 'fixtures/large-image.jpg')); // > 5MB

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/vendor/galleries', () => {
    it('devrait récupérer toutes les galeries du vendeur', async () => {
      const res = await request(app)
        .get('/api/vendor/galleries')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.galleries)).toBe(true);
    });

    it('devrait filtrer par status', async () => {
      const res = await request(app)
        .get('/api/vendor/galleries?status=PUBLISHED')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      res.body.data.galleries.forEach(gallery => {
        expect(gallery.status).toBe('PUBLISHED');
      });
    });
  });

  describe('PUT /api/vendor/galleries/:id', () => {
    it('devrait mettre à jour une galerie', async () => {
      const res = await request(app)
        .put(`/api/vendor/galleries/${galleryId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/vendor/galleries/:id', () => {
    it('devrait supprimer une galerie', async () => {
      const res = await request(app)
        .delete(`/api/vendor/galleries/${galleryId}`)
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('ne devrait pas trouver la galerie supprimée', async () => {
      const res = await request(app)
        .get(`/api/vendor/galleries/${galleryId}`)
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(404);
    });
  });
});
```

---

### 7. Variables d'Environnement

#### .env.example

```bash
# Serveur
NODE_ENV=development
PORT=3004

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=printalma_db

# JWT
JWT_SECRET=votre_secret_jwt_super_securise_ici
JWT_EXPIRES_IN=7d

# Cloudinary (Optionnel)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
FRONTEND_URL=http://localhost:5174

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads/galleries

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
```

---

### 8. Script de Migration de Base de Données

#### migrations/001_create_gallery_tables.sql

```sql
-- Migration pour créer les tables de galerie

-- Table vendor_galleries
CREATE TABLE IF NOT EXISTS vendor_galleries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  INDEX idx_vendor_galleries_vendor_id (vendor_id),
  INDEX idx_vendor_galleries_status (status),
  INDEX idx_vendor_galleries_created_at (created_at),

  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT chk_title_length CHECK (CHAR_LENGTH(title) >= 3 AND CHAR_LENGTH(title) <= 100),
  CONSTRAINT chk_description_length CHECK (description IS NULL OR CHAR_LENGTH(description) <= 500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table gallery_images
CREATE TABLE IF NOT EXISTS gallery_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gallery_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  caption VARCHAR(200),
  order_position INT NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  width INT,
  height INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_gallery_images_gallery_id (gallery_id),
  INDEX idx_gallery_images_order (gallery_id, order_position),

  UNIQUE KEY unique_gallery_order (gallery_id, order_position),
  FOREIGN KEY (gallery_id) REFERENCES vendor_galleries(id) ON DELETE CASCADE,

  CONSTRAINT chk_order_position CHECK (order_position BETWEEN 1 AND 5),
  CONSTRAINT chk_mime_type CHECK (mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger pour limiter à 5 images par galerie
DELIMITER //

CREATE TRIGGER enforce_gallery_image_count_insert
BEFORE INSERT ON gallery_images
FOR EACH ROW
BEGIN
  DECLARE img_count INT;
  SELECT COUNT(*) INTO img_count FROM gallery_images WHERE gallery_id = NEW.gallery_id;

  IF img_count >= 5 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Une galerie ne peut contenir que 5 images maximum';
  END IF;
END //

CREATE TRIGGER enforce_gallery_image_count_update
BEFORE UPDATE ON gallery_images
FOR EACH ROW
BEGIN
  IF NEW.gallery_id != OLD.gallery_id THEN
    DECLARE img_count INT;
    SELECT COUNT(*) INTO img_count FROM gallery_images WHERE gallery_id = NEW.gallery_id;

    IF img_count >= 5 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La galerie cible contient déjà 5 images';
    END IF;
  END IF;
END //

DELIMITER ;

-- Données de test (optionnel)
-- INSERT INTO vendor_galleries (vendor_id, title, description, status, is_published)
-- VALUES (1, 'Galerie de Test', 'Description de test', 'DRAFT', FALSE);
```

---

### 9. Docker Compose (Optionnel)

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # Base de données MySQL
  mysql:
    image: mysql:8.0
    container_name: printalma_mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: printalma_db
      MYSQL_USER: printalma_user
      MYSQL_PASSWORD: printalma_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./migrations:/docker-entrypoint-initdb.d
    networks:
      - printalma_network

  # Backend Node.js
  backend:
    build: .
    container_name: printalma_backend
    environment:
      NODE_ENV: development
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: printalma_user
      DB_PASSWORD: printalma_password
      DB_NAME: printalma_db
      JWT_SECRET: your_jwt_secret_here
    ports:
      - "3004:3004"
    volumes:
      - .:/app
      - /app/node_modules
      - ./uploads:/app/uploads
    depends_on:
      - mysql
    networks:
      - printalma_network

volumes:
  mysql_data:

networks:
  printalma_network:
    driver: bridge
```

---

### 10. Package.json Scripts Utiles

#### package.json (Backend)

```json
{
  "name": "printalma-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js",
    "lint": "eslint .",
    "format": "prettier --write \"**/*.js\""
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.6",
    "mysql2": "^3.6.0",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.3.1",
    "winston": "^3.10.0",
    "sanitize-html": "^2.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4",
    "supertest": "^6.3.3",
    "eslint": "^8.48.0",
    "prettier": "^3.0.3"
  }
}
```

---

## 🚀 Commandes Rapides

### Démarrage Rapide Backend

```bash
# Cloner le projet
git clone <repo>
cd backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Créer la base de données
npm run migrate

# (Optionnel) Données de test
npm run seed

# Démarrer en mode développement
npm run dev
```

### Tests

```bash
# Tous les tests
npm test

# Mode watch
npm run test:watch

# Coverage
npm test -- --coverage
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

---

**Ces exemples sont prêts à l'emploi et couvrent tous les cas d'usage du système de galerie !** 🎉
