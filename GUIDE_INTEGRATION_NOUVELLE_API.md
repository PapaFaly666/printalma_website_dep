# 🚀 Guide d'Intégration - Nouvelle API PrintAlma

## 🎯 Vue d'Ensemble

Ce guide vous aide à intégrer votre frontend React avec la nouvelle API backend de commandes et statistiques selon la documentation fournie.

## ✅ Changements Principaux

### 🔄 Format API Mis à Jour

**Avant :**
- Endpoints personnalisés avec formats variés
- Gestion d'erreurs basique
- Statistiques simplifiées

**Maintenant :**
- Endpoints standardisés REST selon documentation
- Gestion d'erreurs robuste avec codes HTTP appropriés
- Pagination standardisée avec `hasNext/hasPrevious`
- Statistiques détaillées avec `overview`, `statusBreakdown`, etc.
- **NOUVEAU :** Endpoints analytics complets avec temps réel

## 📊 Nouveautés Analytics

### ✨ Endpoints de Statistiques Disponibles

- **📊 GET /orders/admin/statistics** - Statistiques générales du dashboard
- **💰 GET /orders/admin/revenue-stats** - Revenus détaillés avec projections
- **👥 GET /orders/admin/customer-stats** - Analyse des clients et rétention
- **📦 GET /orders/admin/product-stats** - Performance des produits
- **📋 POST /orders/admin/custom-report** - Rapports personnalisés
- **🔌 WebSocket /analytics** - Notifications temps réel

### 🎨 Nouveaux Composants Frontend

- **KPICards** - Cartes d'indicateurs clés avec animations
- **RevenueChart** - Graphiques de revenus avec Recharts
- **TopProducts** - Classement des produits avec badges
- **AnalyticsDashboard** - Dashboard complet avec temps réel

## 📋 Checklist d'Intégration

### ✅ 1. Service `NewOrderService` Mis à Jour

- [x] Interfaces adaptées au nouveau format API
- [x] Méthodes `getAllOrders()` avec paramètres corrects
- [x] Gestion d'erreurs améliorée avec messages appropriés
- [x] Statistiques avec mapping backend → frontend
- [x] Support de la recherche avancée

### ✅ 2. **NOUVEAU** Service `AnalyticsService`

- [x] Service dédié aux statistiques avec cache intelligent
- [x] Support WebSocket temps réel pour `/analytics`
- [x] Méthodes pour tous les endpoints de stats
- [x] Génération et téléchargement de rapports
- [x] Gestion des erreurs spécifiques aux analytics

### ✅ 3. Types TypeScript Adaptés

- [x] `Order` interface mise à jour (format API)
- [x] `OrderItem` avec nouveaux champs (`orderId`, `size`, `color`)
- [x] `AdminOrderFilters` avec support `search` et `userId`
- [x] `OrderStatistics` compatible backend
- [x] `OrderPagination` avec `hasNext/hasPrevious`

### ✅ 4. **NOUVEAU** Composants Analytics

- [x] `KPICards` - Affichage des métriques principales
- [x] `RevenueChart` - Graphiques avec Recharts
- [x] `TopProducts` - Classement avec tendances
- [x] `AnalyticsDashboard` - Dashboard complet
- [x] CSS responsive avec support dark mode

### ✅ 5. **NOUVEAU** Tests Analytics

- [x] `test-analytics-endpoints.html` - Test complet des endpoints
- [x] Tests WebSocket temps réel
- [x] Tests de génération de rapports
- [x] Validation des formats de données

## 🔧 Tests d'Intégration

### 1. Test Endpoints Commandes

```bash
# Ouvrir test-api-integration.html dans le navigateur
# Tester les endpoints de commandes un par un
```

### 2. **NOUVEAU** Test Endpoints Analytics

```bash
# Ouvrir test-analytics-endpoints.html dans le navigateur
# Tester tous les endpoints de statistiques
# Vérifier le WebSocket temps réel
```

### 3. Test Dashboard Complet

```bash
# Aller sur http://localhost:5173/admin/analytics
# Tester la sélection de périodes
# Activer/désactiver le temps réel
# Générer des rapports
```

### 4. Test Intégration Temps Réel

```bash
# Ouvrir admin dashboard sur http://localhost:5173/admin/analytics
# Créer une commande via test-create-real-order.html
# Vérifier la mise à jour automatique des KPI
```

## 📊 Architecture Analytics

### 🔄 Flux de Données

```
Backend API → AnalyticsService → Components → UI
     ↓              ↓              ↓        ↓
WebSocket → Real-time updates → State → Live KPI
```

### 🎯 Structure des Composants

```
AnalyticsDashboard/
├── KPICards (métriques principales)
├── RevenueChart (graphiques)
├── TopProducts (classements)
├── RecentActivity (activité temps réel)
└── Controls (périodes, rapports, temps réel)
```

## 📊 Mapping des Données Analytics

### Format Backend → Frontend

```typescript
// Backend (Statistiques générales)
{
  "overview": {
    "totalOrders": 156,
    "totalRevenue": 15847.50,
    "ordersToday": 8,
    "revenueToday": 240.50,
    "growthRate": { "orders": 15.3, "revenue": 18.7 }
  },
  "statusBreakdown": {
    "PENDING": 12,
    "CONFIRMED": 25
  },
  "revenueChart": [...],
  "topProducts": [...],
  "recentActivity": [...]
}

// Frontend (KPI Cards automatiquement)
✅ Formatage des devises (EUR)
✅ Calcul des pourcentages de croissance
✅ Icônes de tendance (📈📉➡️)
✅ Animations de chargement
```

### WebSocket Temps Réel

```typescript
// Événements supportés
"orderCreated" → Nouvelle commande
"revenueUpdate" → Mise à jour revenus
"visitorsUpdate" → Visiteurs en ligne
"orderStatusChanged" → Changement statut
```

## 🛠️ Étapes de Migration Complète

### 1. Backend Ready
- [x] API sur `http://localhost:3004`
- [x] Endpoints commandes selon documentation
- [x] **NOUVEAU :** Endpoints analytics complets
- [x] WebSocket `/orders` + **NOUVEAU :** `/analytics`
- [x] Authentification par cookies

### 2. Frontend Adapté
- [x] `NewOrderService` mis à jour
- [x] **NOUVEAU :** `AnalyticsService` complet
- [x] Types TypeScript adaptés
- [x] Composants commandes compatibles
- [x] **NOUVEAU :** Composants analytics + CSS

### 3. Tests & Validation
- [x] Test endpoints commandes avec `test-api-integration.html`
- [x] **NOUVEAU :** Test analytics avec `test-analytics-endpoints.html`
- [x] Test commandes réelles avec `test-create-real-order.html`
- [x] **NOUVEAU :** Test dashboard analytics complet
- [x] Validation WebSocket temps réel
- [x] Test des permissions admin

## 🎨 Nouvelles Pages Admin

### 📊 Analytics Dashboard (`/admin/analytics`)

**Fonctionnalités :**
- KPI en temps réel (revenus, commandes, panier moyen)
- Graphiques de revenus interactifs
- Top produits avec tendances
- Activité récente temps réel
- Sélection de périodes (7j, 30j, 3m, 1an)
- Génération de rapports PDF
- Mode temps réel on/off

**Accès :** Admin uniquement, authentification requise

## 🔍 Points de Vérification Analytics

### ✅ Service Analytics
```typescript
// Vérifier que le service fonctionne
analyticsService.getStatistics('30d')
  .then(data => console.log('📊 Stats:', data))
  .catch(err => console.error('❌ Erreur:', err));

// Tester le cache
analyticsService.getDebugInfo(); // Infos de debug
```

### ✅ WebSocket Analytics
```typescript
// Vérifier la connexion temps réel
analyticsService.connectRealTime();
analyticsService.onNewOrder(data => {
  console.log('🆕 Nouvelle commande:', data);
});
```

### ✅ Composants React
```jsx
// Test des composants
<KPICards overview={stats?.overview} loading={false} />
<RevenueChart data={revenueData} period="30d" />
<TopProducts products={topProducts} />
```

## 🚀 Démarrage Rapide Analytics

### 1. Lancer le Système Complet
```bash
# 1. Démarrer le backend avec analytics
npm run start:backend

# 2. Démarrer le frontend  
npm run dev

# 3. Se connecter en admin
# http://localhost:5173/login

# 4. Accéder au dashboard analytics
# http://localhost:5173/admin/analytics
```

### 2. Tester les Analytics
```bash
# Tests des endpoints
./test-analytics-endpoints.html

# Test dashboard complet
http://localhost:5173/admin/analytics

# Test création commande + temps réel
./test-create-real-order.html
```

## 📞 Support & Debugging Analytics

### 🐛 Problèmes Courants Analytics

1. **Erreur 403 - Droits admin requis**
   - Vérifier que l'utilisateur a le rôle ADMIN
   - Vérifier `credentials: 'include'` dans les requêtes

2. **WebSocket analytics ne fonctionne pas**
   - Vérifier namespace `/analytics` sur le backend
   - Vérifier `withCredentials: true` dans Socket.IO

3. **Graphiques ne s'affichent pas**
   - Vérifier installation `recharts`
   - Vérifier format des données revenueChart

4. **Cache analytics problématique**
   - Utiliser `analyticsService.clearCache()`
   - Vérifier timeout de cache (5 minutes)

### 🔧 Debug Console Analytics
```javascript
// Vérifier le service analytics
analyticsService.getDebugInfo();

// Tester connexion
analyticsService.testConnection();

// Vider le cache
analyticsService.clearCache();

// Tester un endpoint
fetch('http://localhost:3004/orders/admin/statistics', { 
  credentials: 'include' 
})
.then(r => r.json())
.then(console.log);
```

## ✅ Résultat Final

Après cette intégration complète, vous avez :

### 🎯 Système de Commandes
- ✅ **API entièrement fonctionnelle** selon la documentation
- ✅ **Gestion d'erreurs robuste** avec messages appropriés  
- ✅ **Pagination standardisée** avec navigation intuitive
- ✅ **WebSocket temps réel** pour les notifications

### 📊 Système Analytics (NOUVEAU)
- ✅ **Dashboard analytics complet** avec KPI temps réel
- ✅ **Graphiques interactifs** avec Recharts
- ✅ **Rapports personnalisés** téléchargeables
- ✅ **WebSocket analytics** pour mises à jour live
- ✅ **Cache intelligent** pour optimiser les performances

### 🧪 Tests Automatisés
- ✅ **Tests commandes** : `test-api-integration.html`
- ✅ **Tests analytics** : `test-analytics-endpoints.html`
- ✅ **Tests temps réel** : Dashboard + création commandes
- ✅ **Tests intégration** : Validation continue

## 🎉 Félicitations !

Votre système PrintAlma est maintenant équipé d'un **système analytics professionnel** ! 

**Architecture complète :**
```
🏪 E-commerce Frontend (React)
├── 📦 Gestion des commandes (temps réel)
├── 📊 Analytics Dashboard (KPI, graphiques, rapports)
├── 👑 Admin Panel (gestion complète)
└── 🔌 WebSocket (notifications temps réel)

🏗️ Backend NestJS
├── 📋 API Commandes (CRUD complet)
├── 📊 API Analytics (statistiques avancées)
├── 🔌 WebSocket (/orders + /analytics)
└── 🔐 Authentification (cookies HTTP-only)
```

**Prochaines étapes :**
1. ✅ Tester tous les scénarios d'usage
2. ✅ Valider les performances en charge
3. ✅ Configurer monitoring en production
4. ✅ Former les administrateurs
5. 🚀 **Déployer en production !**

---

**Support** : En cas de problème, vérifiez d'abord les tests d'intégration, les logs de la console, et le guide de debugging ci-dessus.

# 📦 Guide Frontend - Endpoints Produits

Documentation complète des endpoints produits pour l'intégration frontend.

## 🔧 Configuration Base

```javascript
const API_BASE = 'https://localhost:3004';
const CONFIG = {
  credentials: 'include', // Obligatoire pour cookies HTTPS
  headers: {
    'Content-Type': 'application/json'
  }
};
```

---

## 📋 Liste Complète des Endpoints

### **1. GET /products** - Récupérer tous les produits

**URL :** `https://localhost:3004/products`

**Requête :**
```javascript
const response = await fetch(`${API_BASE}/products`, {
  method: 'GET',
  credentials: 'include'
});
const data = await response.json();
```

**Réponse Success (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-shirt Premium Homme",
      "description": "T-shirt en coton bio de qualité supérieure",
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-10T12:30:00.000Z",
      "category": {
        "id": 1,
        "name": "T-shirts",
        "description": "Collection T-shirts"
      },
      "colors": [
        {
          "id": 1,
          "name": "Rouge",
          "hexCode": "#FF0000",
          "imageUrl": "https://res.cloudinary.com/printalma/color-rouge.jpg"
        },
        {
          "id": 2,
          "name": "Bleu",
          "hexCode": "#0000FF",
          "imageUrl": "https://res.cloudinary.com/printalma/color-bleu.jpg"
        }
      ],
      "sizes": [
        {
          "id": 1,
          "name": "S",
          "description": "Small"
        },
        {
          "id": 2,
          "name": "M",
          "description": "Medium"
        },
        {
          "id": 3,
          "name": "L",
          "description": "Large"
        }
      ],
      "images": [
        {
          "id": 45,
          "url": "https://res.cloudinary.com/printalma/tshirt-main.jpg",
          "isMain": true,
          "naturalWidth": 1000,
          "naturalHeight": 800
        },
        {
          "id": 46,
          "url": "https://res.cloudinary.com/printalma/tshirt-dos.jpg",
          "isMain": false,
          "naturalWidth": 1000,
          "naturalHeight": 800
        }
      ]
    }
  ],
  "count": 2
}
```

### **2. POST /products** - Créer un nouveau produit

**URL :** `https://localhost:3004/products`

**⚠️ CRITICAL - FORMAT EXACT REQUIS :**

Le backend attend:
- `productData`: un string JSON avec la structure complète
- Fichiers images avec des fileId correspondants

**Structure JSON obligatoire pour productData :**
```javascript
const productData = {
  name: "Nom du produit",                    // OBLIGATOIRE
  description: "Description du produit",     // OBLIGATOIRE  
  price: 25.99,                             // OBLIGATOIRE (number)
  stock: 100,                               // OBLIGATOIRE (number >= 0)
  status: "published",                       // OPTIONNEL: "published" ou "draft"
  categories: ["T-shirts", "Vêtements"],    // OBLIGATOIRE (array de strings)
  sizes: ["S", "M", "L"],                   // OPTIONNEL (array de strings)
  colorVariations: [                        // OBLIGATOIRE (au moins 1)
    {
      name: "Rouge",                        // OBLIGATOIRE
      colorCode: "#FF0000",                 // OBLIGATOIRE (format #RRGGBB)
      images: [                             // OBLIGATOIRE (au moins 1)
        {
          fileId: "image1",                 // OBLIGATOIRE (doit correspondre au fichier)
          view: "Front",                    // OBLIGATOIRE ("Front", "Back", "Left", "Right", "Top", "Bottom", "Detail")
          delimitations: [                  // OPTIONNEL
            {
              x: 25.0,                      // Coordonnées en pourcentage (0-100)
              y: 30.0,
              width: 40.0,
              height: 20.0,
              rotation: 0,                  // OPTIONNEL
              name: "Zone Logo",            // OPTIONNEL
              coordinateType: "PERCENTAGE"  // OPTIONNEL (défaut: "PERCENTAGE")
            }
          ]
        }
      ]
    }
  ]
};
```

**Code d'exemple complet qui FONCTIONNE :**
```javascript
async function createProductCorrect() {
  try {
    // 1. Préparer les données
    const productData = {
      name: "T-shirt Test API",
      description: "T-shirt de test pour vérifier l'API",
      price: 25.00,
      stock: 50,
      status: "draft",
      categories: ["T-shirts"],
      sizes: ["S", "M", "L"],
      colorVariations: [
        {
          name: "Rouge",
          colorCode: "#FF0000",
          images: [
            {
              fileId: "image1",
              view: "Front",
              delimitations: []
            }
          ]
        }
      ]
    };

    // 2. Récupérer les fichiers
    const fileInput = document.getElementById('imageInput');
    const imageFile = fileInput.files[0];
    
    if (!imageFile) {
      throw new Error('Sélectionnez au moins une image');
    }

    // 3. Créer FormData
    const formData = new FormData();
    
    // CRITIQUE: productData doit être un string JSON
    formData.append('productData', JSON.stringify(productData));
    
    // CRITIQUE: Le nom du fichier doit correspondre au fileId
    formData.append('file_image1', imageFile); // "file_" + fileId

    console.log('🚀 Envoi de la requête...');

    // 4. Envoyer la requête
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      credentials: 'include',
      // PAS de Content-Type avec FormData
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erreur:', result);
      throw new Error(result.message || `Erreur ${response.status}`);
    }

    console.log('✅ Produit créé:', result);
    return result;

  } catch (error) {
    console.error('❌ Erreur création:', error);
    throw error;
  }
}
```

**Points CRITIQUES :**

1. **productData** doit être un **string JSON**, pas un objet
2. **Fichiers** doivent être nommés `file_${fileId}` (ex: `file_image1`)
3. **categories** est un **array obligatoire** de strings
4. **colorVariations** est un **array obligatoire** avec au moins 1 élément
5. **fileId** dans le JSON doit correspondre au nom du fichier uploadé

**🚀 Cette documentation résout nos erreurs 500 !** 

---

*Document mis à jour le 10/06/2025 selon la réponse de l'équipe backend* 