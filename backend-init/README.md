# 🚀 Guide d'initialisation Backend - Système de Gestion des Commandes Vendeur

Ce dossier contient tous les fichiers nécessaires pour implémenter le backend du système de gestion des commandes vendeur de PrintAlma.

## 📁 Structure des fichiers

```
backend-init/
├── README.md                     # Ce fichier
├── database-schema.sql           # Schéma complet de la base de données
├── sample-data.sql              # Données d'exemple pour les tests
└── api-endpoints-examples.js    # Exemples d'implémentation des endpoints
```

## 🗄️ 1. Base de données - Étapes d'installation

### Prérequis
- PostgreSQL 12+ installé et configuré
- Accès administrateur à la base de données
- Extensions PostgreSQL : `uuid-ossp`

### Installation du schéma

```bash
# 1. Se connecter à PostgreSQL
psql -U postgres -d printalma_db

# 2. Exécuter le schéma
\i backend-init/database-schema.sql

# 3. Insérer les données d'exemple
\i backend-init/sample-data.sql

# 4. Vérifier l'installation
SELECT 'Installation terminée!' as status;
```

### Vérifications post-installation

```sql
-- Vérifier les tables créées
\dt

-- Vérifier les données d'exemple
SELECT table_name, count(*) as records
FROM (
  SELECT 'users' as table_name, count(*) FROM users WHERE email LIKE '%@test.printalma.com'
  UNION ALL
  SELECT 'orders' as table_name, count(*) FROM orders
  UNION ALL
  SELECT 'products' as table_name, count(*) FROM products
  UNION ALL
  SELECT 'order_items' as table_name, count(*) FROM order_items
) as counts;
```

## 🔧 2. Backend API - Implémentation

### Framework recommandé
- **Node.js** avec Express.js
- **ORM** : Sequelize ou TypeORM
- **Base de données** : PostgreSQL
- **Authentification** : JWT

### Installation des dépendances

```bash
npm install express sequelize pg pg-hstore jsonwebtoken bcryptjs cors helmet
npm install --save-dev nodemon jest supertest
```

### Structure de projet suggérée

```
backend/
├── src/
│   ├── controllers/
│   │   └── vendorOrderController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── vendorAuth.js
│   ├── models/
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   ├── User.js
│   │   └── Product.js
│   ├── routes/
│   │   └── vendorOrders.js
│   ├── services/
│   │   └── orderService.js
│   └── app.js
├── config/
│   └── database.js
└── server.js
```

### Configuration de base

```javascript
// config/database.js
module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'printalma_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
};

// .env
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=printalma_db
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

### Intégration des endpoints

1. **Copier le code d'exemple** : Utilisez le fichier `api-endpoints-examples.js` comme base
2. **Adapter aux modèles** : Ajustez selon votre ORM (Sequelize/TypeORM)
3. **Configurer les routes** : Intégrez dans votre application Express

```javascript
// server.js
const express = require('express');
const vendorOrderRoutes = require('./src/routes/vendorOrders');

const app = express();

app.use('/vendor', vendorOrderRoutes);

app.listen(3004, () => {
  console.log('🚀 Backend PrintAlma démarré sur le port 3004');
});
```

## 🧪 3. Tests et validation

### Données de test disponibles

Le fichier `sample-data.sql` contient :

- **3 vendeurs** avec profils complets
- **5 clients** pour les commandes
- **8 produits** approuvés et actifs
- **6 commandes** avec différents statuts
- **Notifications** et historique des statuts

### Comptes de test

```javascript
// Vendeurs
{
  email: 'khadija.design@test.printalma.com',
  shopName: 'Khadija Design Studio',
  products: ['T-shirt Design Afrique', 'Hoodie Premium Baobab', 'Carnet Dakar Vibes']
}

{
  email: 'mamadou.art@test.printalma.com',
  shopName: 'Mamadou Art Gallery',
  products: ['Mug Téranga Sénégal', 'Tote Bag Artisanal', 'T-shirt Femme Empowerment']
}

{
  email: 'awa.creative@test.printalma.com',
  shopName: 'Awa Créative Designs',
  products: ['Casquette Design Wax', 'Coussin Déco Casamance']
}
```

### Tests d'endpoints

```bash
# Test d'authentification
curl -X GET "http://localhost:3004/vendor/orders" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test de récupération des commandes
curl -X GET "http://localhost:3004/vendor/orders?page=1&limit=5&status=PROCESSING" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test de mise à jour de statut
curl -X PATCH "http://localhost:3004/vendor/orders/1/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "SHIPPED", "notes": "Expédié via DHL"}'
```

## 📊 4. Monitoring et métriques

### Métriques à surveiller

1. **Performance**
   - Temps de réponse des endpoints
   - Nombre de requêtes par minute
   - Erreurs 4xx/5xx

2. **Business**
   - Commandes créées/heure
   - Chiffre d'affaires par vendeur
   - Taux de conversion par statut

3. **Sécurité**
   - Tentatives d'authentification
   - Accès non autorisés
   - Modification de statuts

### Logs recommandés

```javascript
// Structure de logs
{
  timestamp: '2024-01-20T10:30:00Z',
  level: 'info',
  action: 'ORDER_STATUS_UPDATED',
  vendorId: 2000,
  orderId: 1,
  fromStatus: 'CONFIRMED',
  toStatus: 'PROCESSING',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
}
```

## 🔐 5. Sécurité

### Points critiques à vérifier

1. **Authentification JWT**
   - Vérification de la signature
   - Expiration des tokens
   - Rotation des clés

2. **Autorisation**
   - Vérification du rôle vendeur
   - Accès aux commandes uniquement si produits du vendeur
   - Validation des transitions de statut

3. **Validation des données**
   - Sanitisation des entrées
   - Validation des types
   - Protection contre l'injection SQL

4. **Rate limiting**
   - Limiter les requêtes par IP/utilisateur
   - Protection contre les attaques DDoS

## 🌐 6. WebSockets (optionnel)

### Configuration Socket.IO

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:5174",
    methods: ["GET", "POST"]
  }
});

// Gestion des connexions vendeur
io.on('connection', (socket) => {
  socket.on('vendor:join', (vendorId) => {
    socket.join(`vendor_${vendorId}`);
  });
});

// Émission d'événements
io.to(`vendor_${vendorId}`).emit('vendor:new_order', orderData);
```

## 📧 7. Notifications (optionnel)

### Service email

```javascript
const nodemailer = require('nodemailer');

const sendOrderNotification = async (vendor, order, type) => {
  const transporter = nodemailer.createTransporter({
    // Configuration SMTP
  });

  const templates = {
    NEW_ORDER: `Nouvelle commande ${order.orderNumber} reçue`,
    STATUS_CHANGED: `Commande ${order.orderNumber} mise à jour`
  };

  await transporter.sendMail({
    to: vendor.email,
    subject: templates[type],
    html: generateEmailTemplate(vendor, order, type)
  });
};
```

## 🚀 8. Déploiement

### Variables d'environnement requises

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Serveur
PORT=3004
NODE_ENV=production

# CORS
FRONTEND_URL=https://printalma.com

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@printalma.com
SMTP_PASS=your-app-password

# Uploads (optionnel)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Commandes de déploiement

```bash
# Build et démarrage
npm run build
npm start

# Avec PM2 (recommandé)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔄 9. Intégration Frontend

### Configuration côté frontend

```typescript
// src/config/api.ts
export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3004';

// src/services/vendorOrderService.ts
// Le service existe déjà et est compatible avec ces endpoints
```

### Test de l'intégration

1. Démarrer le backend : `npm start`
2. Démarrer le frontend : `npm run dev`
3. Se connecter en tant que vendeur
4. Naviguer vers `/vendeur/sales`
5. Vérifier que les données s'affichent

## 📞 Support et dépannage

### Problèmes courants

1. **Erreur de connexion DB**
   - Vérifier les credentials dans `.env`
   - S'assurer que PostgreSQL est démarré
   - Vérifier les permissions utilisateur

2. **Authentification échoue**
   - Vérifier le `JWT_SECRET`
   - Contrôler l'expiration des tokens
   - Valider le middleware d'auth

3. **Pas de données**
   - Exécuter `sample-data.sql`
   - Vérifier les contraintes de clés étrangères
   - Contrôler les filtres de requête

4. **Erreurs CORS**
   - Configurer correctement les origins autorisées
   - Vérifier les headers de requête

### Logs utiles

```bash
# Logs PostgreSQL
tail -f /var/log/postgresql/postgresql-12-main.log

# Logs application
tail -f logs/app.log

# Monitoring en temps réel
npm run dev -- --verbose
```

---

## ✅ Checklist de mise en production

- [ ] Base de données configurée et sécurisée
- [ ] Toutes les variables d'environnement définies
- [ ] Tests d'intégration passés
- [ ] Authentification et autorisation testées
- [ ] Rate limiting configuré
- [ ] Logs et monitoring en place
- [ ] Backups automatiques configurés
- [ ] HTTPS activé
- [ ] Performance testée sous charge

---

💡 **Astuce** : Commencez par implémenter les endpoints de base (GET /orders, GET /orders/:id) avant d'ajouter les fonctionnalités avancées (WebSockets, emails, etc.).

🎯 **Objectif** : Avoir un système de gestion des commandes vendeur fonctionnel et compatible avec le frontend existant.