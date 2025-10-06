# Guide d'implémentation Backend - Système de Gestion des Utilisateurs et Rôles (RBAC)

## 📋 Vue d'ensemble

Ce guide décrit l'implémentation complète d'un système de gestion des utilisateurs avec **RBAC (Role-Based Access Control)** granulaire, comme dans les grandes applications (Notion, Stripe, AWS IAM, etc.).

### Fonctionnalités

- ✅ Gestion complète des utilisateurs (CRUD)
- ✅ Système de rôles personnalisables
- ✅ Permissions granulaires par module et action
- ✅ Statuts utilisateurs (actif, inactif, suspendu)
- ✅ Réinitialisation de mot de passe
- ✅ Audit trail (créé par, modifié par)
- ✅ Rôles système protégés
- ✅ Interface d'administration complète

---

## 🗄️ Structure de base de données

### Table : `users`

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Hashé avec bcrypt
  phone VARCHAR(50),
  avatar VARCHAR(500),
  role_id INT NOT NULL,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,

  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_email (email),
  INDEX idx_role (role_id),
  INDEX idx_status (status)
);
```

### Table : `roles`

```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,  -- Ex: 'superadmin', 'admin', 'finance'
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,  -- Les rôles système ne peuvent pas être supprimés
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_slug (slug)
);
```

### Table : `permissions`

```sql
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key VARCHAR(100) UNIQUE NOT NULL,  -- Ex: 'users.create', 'products.edit'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL,  -- Ex: 'users', 'products', 'orders', 'stock'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_key (key),
  INDEX idx_module (module)
);
```

### Table : `role_permissions` (pivot)

```sql
CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

---

## 🔑 Permissions par défaut

Voici la structure de permissions recommandée :

```sql
-- Module: users
INSERT INTO permissions (key, name, description, module) VALUES
('users.view', 'Voir les utilisateurs', 'Consulter la liste des utilisateurs', 'users'),
('users.create', 'Créer des utilisateurs', 'Ajouter de nouveaux utilisateurs', 'users'),
('users.edit', 'Modifier les utilisateurs', 'Éditer les informations utilisateurs', 'users'),
('users.delete', 'Supprimer les utilisateurs', 'Supprimer des utilisateurs', 'users'),
('users.manage', 'Gérer les utilisateurs', 'Accès complet à la gestion des utilisateurs', 'users');

-- Module: products
INSERT INTO permissions (key, name, description, module) VALUES
('products.view', 'Voir les produits', 'Consulter le catalogue produits', 'products'),
('products.create', 'Créer des produits', 'Ajouter de nouveaux produits', 'products'),
('products.edit', 'Modifier les produits', 'Éditer les produits existants', 'products'),
('products.delete', 'Supprimer des produits', 'Supprimer des produits', 'products'),
('products.validate', 'Valider les produits', 'Approuver ou rejeter des produits', 'products');

-- Module: stock
INSERT INTO permissions (key, name, description, module) VALUES
('stock.view', 'Voir les stocks', 'Consulter les niveaux de stock', 'stock'),
('stock.edit', 'Modifier les stocks', 'Ajuster les quantités en stock', 'stock'),
('stock.manage', 'Gérer les stocks', 'Accès complet à la gestion des stocks', 'stock');

-- Module: orders
INSERT INTO permissions (key, name, description, module) VALUES
('orders.view', 'Voir les commandes', 'Consulter les commandes', 'orders'),
('orders.edit', 'Modifier les commandes', 'Modifier le statut des commandes', 'orders'),
('orders.manage', 'Gérer les commandes', 'Accès complet aux commandes', 'orders');

-- Module: finance
INSERT INTO permissions (key, name, description, module) VALUES
('finance.view', 'Voir les finances', 'Consulter les données financières', 'finance'),
('finance.manage', 'Gérer les finances', 'Gérer paiements et transactions', 'finance'),
('finance.reports', 'Rapports financiers', 'Générer des rapports financiers', 'finance');

-- Module: vendors
INSERT INTO permissions (key, name, description, module) VALUES
('vendors.view', 'Voir les vendeurs', 'Consulter la liste des vendeurs', 'vendors'),
('vendors.create', 'Créer des vendeurs', 'Ajouter de nouveaux vendeurs', 'vendors'),
('vendors.edit', 'Modifier les vendeurs', 'Éditer les vendeurs', 'vendors'),
('vendors.delete', 'Supprimer des vendeurs', 'Supprimer des vendeurs', 'vendors'),
('vendors.validate', 'Valider les vendeurs', 'Approuver ou rejeter des vendeurs', 'vendors');

-- Module: categories
INSERT INTO permissions (key, name, description, module) VALUES
('categories.view', 'Voir les catégories', 'Consulter les catégories', 'categories'),
('categories.manage', 'Gérer les catégories', 'Créer, modifier, supprimer des catégories', 'categories');

-- Module: marketing
INSERT INTO permissions (key, name, description, module) VALUES
('marketing.view', 'Voir le marketing', 'Accéder aux outils marketing', 'marketing'),
('marketing.manage', 'Gérer le marketing', 'Gérer campagnes et promotions', 'marketing');

-- Module: settings
INSERT INTO permissions (key, name, description, module) VALUES
('settings.view', 'Voir les paramètres', 'Consulter les paramètres système', 'settings'),
('settings.manage', 'Gérer les paramètres', 'Modifier les paramètres système', 'settings');

-- Module: reports
INSERT INTO permissions (key, name, description, module) VALUES
('reports.view', 'Voir les rapports', 'Consulter les rapports et analytics', 'reports'),
('reports.export', 'Exporter les rapports', 'Exporter les données', 'reports');

-- Module: designs
INSERT INTO permissions (key, name, description, module) VALUES
('designs.view', 'Voir les designs', 'Consulter les designs', 'designs'),
('designs.create', 'Créer des designs', 'Ajouter de nouveaux designs', 'designs'),
('designs.edit', 'Modifier les designs', 'Éditer les designs', 'designs'),
('designs.delete', 'Supprimer des designs', 'Supprimer des designs', 'designs'),
('designs.validate', 'Valider les designs', 'Approuver ou rejeter des designs', 'designs');
```

---

## 👥 Rôles système par défaut

```sql
-- 1. Super Administrateur (accès total)
INSERT INTO roles (name, slug, description, is_system) VALUES
('Super Administrateur', 'superadmin', 'Accès complet à toutes les fonctionnalités', TRUE);

-- Assigner toutes les permissions au superadmin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 2. Administrateur (gestion quotidienne)
INSERT INTO roles (name, slug, description, is_system) VALUES
('Administrateur', 'admin', 'Gestion quotidienne de la plateforme', TRUE);

-- Assigner la plupart des permissions sauf settings critiques
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE key NOT LIKE 'settings.manage';

-- 3. Finance
INSERT INTO roles (name, slug, description, is_system) VALUES
('Finance', 'finance', 'Accès aux données financières et paiements', FALSE);

INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE module IN ('finance', 'orders', 'vendors', 'reports');

-- 4. Production / Stock
INSERT INTO roles (name, slug, description, is_system) VALUES
('Production', 'production', 'Gestion des stocks et de la production', FALSE);

INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE module IN ('stock', 'products', 'orders');

-- 5. Marketing
INSERT INTO roles (name, slug, description, is_system) VALUES
('Marketing', 'marketing', 'Gestion du marketing et des promotions', FALSE);

INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE module IN ('marketing', 'products', 'reports', 'designs');

-- 6. Vendeur
INSERT INTO roles (name, slug, description, is_system) VALUES
('Vendeur', 'vendor', 'Compte vendeur avec accès limité', TRUE);

INSERT INTO role_permissions (role_id, permission_id)
SELECT 6, id FROM permissions WHERE key IN (
  'products.view', 'products.create', 'products.edit',
  'designs.view', 'designs.create', 'designs.edit',
  'orders.view', 'finance.view', 'reports.view'
);

-- 7. Client
INSERT INTO roles (name, slug, description, is_system) VALUES
('Client', 'customer', 'Compte client standard', TRUE);
```

---

## 🔌 Endpoints API

### 1. Gestion des utilisateurs

#### GET /admin/users

Récupérer tous les utilisateurs (avec filtres et pagination).

**Query Parameters:**
- `search` (string) : Recherche par nom ou email
- `roleId` (number) : Filtrer par rôle
- `status` (string) : Filtrer par statut
- `page` (number) : Page actuelle
- `limit` (number) : Nombre par page

**⚠️ IMPORTANT:** Toujours inclure le rôle complet avec ses permissions dans la réponse (JOIN avec la table roles et role_permissions).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+33 6 12 34 56 78",
        "avatar": "https://...",
        "status": "active",
        "role": {
          "id": 2,
          "name": "Administrateur",
          "slug": "admin",
          "permissions": [...]
        },
        "roleId": 2,
        "emailVerified": true,
        "lastLogin": "2025-10-03T10:30:00Z",
        "createdAt": "2025-01-15T08:00:00Z",
        "updatedAt": "2025-10-03T10:30:00Z"
      }
    ],
    "total": 50
  }
}
```

#### GET /admin/users/:id

Récupérer un utilisateur par ID.

#### POST /admin/users

Créer un nouvel utilisateur.

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "phone": "+33 6 98 76 54 32",
  "roleId": 3,
  "status": "active"
}
```

**Validation:**
- `name` : requis, 2-255 caractères
- `email` : requis, format email valide, unique
- `password` : requis, minimum 8 caractères
- `roleId` : requis, doit exister
- `status` : optionnel, enum ('active', 'inactive', 'suspended')

**Response (201):**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": { ... }
}
```

#### PATCH /admin/users/:id

Mettre à jour un utilisateur.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+33 6 11 22 33 44",
  "roleId": 4,
  "status": "active"
}
```

#### DELETE /admin/users/:id

Supprimer un utilisateur.

**Response (200):**
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

#### POST /admin/users/:id/reset-password

Réinitialiser le mot de passe d'un utilisateur.

**Body:**
```json
{
  "password": "NewSecurePass123!"
}
```

#### PATCH /admin/users/:id/status

Changer le statut d'un utilisateur.

**Body:**
```json
{
  "status": "suspended"
}
```

#### GET /admin/users/stats

Récupérer les statistiques des utilisateurs.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 120,
    "inactive": 20,
    "suspended": 10,
    "byRole": {
      "admin": 5,
      "finance": 3,
      "production": 8,
      "marketing": 4,
      "vendor": 100,
      "customer": 30
    }
  }
}
```

---

### 2. Gestion des rôles

#### GET /admin/roles

Récupérer tous les rôles avec leurs permissions.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Super Administrateur",
      "slug": "superadmin",
      "description": "Accès complet à toutes les fonctionnalités",
      "isSystem": true,
      "permissions": [
        {
          "id": 1,
          "key": "users.view",
          "name": "Voir les utilisateurs",
          "description": "Consulter la liste des utilisateurs",
          "module": "users"
        },
        ...
      ],
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /admin/roles/:id

Récupérer un rôle par ID.

#### POST /admin/roles

Créer un nouveau rôle.

**Body:**
```json
{
  "name": "Responsable SAV",
  "slug": "support-manager",
  "description": "Gestion du service après-vente",
  "permissionIds": [1, 5, 10, 15, 20]
}
```

**Validation:**
- `name` : requis
- `slug` : requis, unique, format kebab-case
- `permissionIds` : tableau d'IDs de permissions

#### PATCH /admin/roles/:id

Mettre à jour un rôle.

**Body:**
```json
{
  "name": "Responsable SAV Senior",
  "description": "Gestion avancée du SAV",
  "permissionIds": [1, 5, 10, 15, 20, 25]
}
```

**Validation:**
- Ne pas autoriser la modification des rôles système (`is_system = true`)

#### DELETE /admin/roles/:id

Supprimer un rôle.

**Validation:**
- Ne pas autoriser la suppression des rôles système
- Vérifier qu'aucun utilisateur n'a ce rôle

---

### 3. Gestion des permissions

#### GET /admin/permissions

Récupérer toutes les permissions.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "users.view",
      "name": "Voir les utilisateurs",
      "description": "Consulter la liste des utilisateurs",
      "module": "users"
    },
    ...
  ]
}
```

#### GET /admin/permissions/by-module

Récupérer les permissions groupées par module.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "key": "users.view",
        "name": "Voir les utilisateurs",
        "description": "Consulter la liste des utilisateurs",
        "module": "users"
      },
      ...
    ],
    "products": [...],
    "stock": [...],
    ...
  }
}
```

---

## 🔒 Middleware d'autorisation

Créer un middleware pour vérifier les permissions :

```javascript
// middlewares/checkPermission.js
const checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // Doit être défini par le middleware d'auth

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
      }

      // Récupérer le rôle avec permissions
      const role = await Role.findById(user.roleId).include('permissions');

      // Vérifier si l'utilisateur a la permission
      const hasPermission = role.permissions.some(p => p.key === permissionKey);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Permission refusée'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  };
};

module.exports = checkPermission;
```

**Utilisation :**

```javascript
// routes/admin/users.js
const router = require('express').Router();
const checkPermission = require('../middlewares/checkPermission');

router.get('/users', checkPermission('users.view'), getUsersController);
router.post('/users', checkPermission('users.create'), createUserController);
router.patch('/users/:id', checkPermission('users.edit'), updateUserController);
router.delete('/users/:id', checkPermission('users.delete'), deleteUserController);
```

---

## 🧪 Tests recommandés

### Test 1 : Créer un utilisateur
```bash
POST /admin/users
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test123!",
  "roleId": 3
}
# Vérifier: utilisateur créé, email unique, mot de passe hashé
```

### Test 2 : Permissions
```bash
# Utilisateur avec role "finance"
GET /admin/products  # Devrait retourner 403 (pas de permission)
GET /admin/finance/reports  # Devrait retourner 200 (permission OK)
```

### Test 3 : Rôles système
```bash
DELETE /admin/roles/1  # Superadmin - Devrait retourner 400
DELETE /admin/roles/5  # Role custom - Devrait retourner 200
```

---

## 📊 Rapports et Audit

### Endpoint bonus : Audit Log

Créer une table pour tracer les actions :

```sql
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100),  -- 'user.create', 'role.update', etc.
  entity_type VARCHAR(50),
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at DESC)
);
```

---

## 🔐 Sécurité

1. **Hashage des mots de passe :** Utiliser bcrypt avec au moins 10 rounds
2. **Validation stricte :** Valider tous les inputs
3. **Rate limiting :** Limiter les tentatives de connexion
4. **Logs d'audit :** Tracer toutes les actions sensibles
5. **HTTPS obligatoire** en production
6. **Tokens JWT** avec expiration courte (15min) et refresh tokens

---

## 📝 Checklist d'implémentation

- [ ] Créer les tables (`users`, `roles`, `permissions`, `role_permissions`, `audit_logs`)
- [ ] Insérer les permissions par défaut
- [ ] Créer les rôles système
- [ ] Implémenter les endpoints utilisateurs
  - [ ] GET /admin/users (avec filtres et pagination)
  - [ ] GET /admin/users/:id
  - [ ] POST /admin/users (avec validation et hashage password)
  - [ ] PATCH /admin/users/:id
  - [ ] DELETE /admin/users/:id
  - [ ] POST /admin/users/:id/reset-password
  - [ ] PATCH /admin/users/:id/status
  - [ ] GET /admin/users/stats
- [ ] Implémenter les endpoints rôles
  - [ ] GET /admin/roles
  - [ ] GET /admin/roles/:id
  - [ ] POST /admin/roles
  - [ ] PATCH /admin/roles/:id
  - [ ] DELETE /admin/roles/:id (avec protection rôles système)
- [ ] Implémenter les endpoints permissions
  - [ ] GET /admin/permissions
  - [ ] GET /admin/permissions/by-module
- [ ] Créer le middleware `checkPermission`
- [ ] Protéger toutes les routes avec les permissions appropriées
- [ ] Implémenter l'audit log
- [ ] Tests unitaires et d'intégration
- [ ] Documentation API (Swagger)

---

## 🚀 Références Frontend

Le frontend utilise ces services (déjà implémentés) :

- [userManagementService.ts](src/services/userManagementService.ts) - Tous les appels API
- [user.types.ts](src/types/user.types.ts) - Types TypeScript
- [AdminUsersPage.tsx](src/pages/admin/AdminUsersPage.tsx) - Interface de gestion des utilisateurs
- [AdminRolesPage.tsx](src/pages/admin/AdminRolesPage.tsx) - Interface de gestion des rôles
- [Sidebar.tsx](src/components/Sidebar.tsx:471-493) - Menu "Administration"

---

## 💡 Bonnes pratiques

1. **Ne jamais** exposer les mots de passe dans les réponses API
2. **Toujours** valider les permissions côté backend (ne pas faire confiance au frontend)
3. **Logger** toutes les actions sensibles (création/suppression utilisateur, changement de rôle)
4. **Tester** exhaustivement les permissions (tests automatisés)
5. **Documenter** clairement chaque permission et son usage

---

## 📞 Support

Pour toute question sur l'implémentation frontend, consultez les fichiers de service et les pages d'administration.
