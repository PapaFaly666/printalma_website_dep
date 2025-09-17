# 🔗 Intégration Frontend-Backend - Système de Gestion des Commandes Vendeur

Ce document détaille l'intégration du frontend avec le backend pour le système de gestion des commandes vendeur.

## 📋 Modifications apportées

### **1. Page de liste des commandes (`/vendeur/sales`)**

#### ✅ **Avant** (données mockées)
```typescript
const mockOrders: Order[] = [
  // ... données statiques
];

useEffect(() => {
  setOrders(mockOrders);
  setFilteredOrders(mockOrders);
}, []);
```

#### ✅ **Après** (intégration backend)
```typescript
import { vendorOrderService, VendorOrderStatistics, VendorOrderFilters } from '../../services/vendorOrderService';

const loadOrders = async () => {
  const filters: VendorOrderFilters = {
    page: pagination.page,
    limit: 10,
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter as OrderStatus : undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  const response = await vendorOrderService.getVendorOrders(filters);
  setOrders(response.orders);
  setPagination(response);
};
```

#### **Nouvelles fonctionnalités :**
- 🔄 **Chargement dynamique** depuis l'API
- 🔍 **Filtrage côté serveur** (recherche, statut, date)
- 📄 **Pagination complète** avec navigation
- 📊 **Statistiques en temps réel**
- ⚡ **Debounce sur la recherche** (500ms)
- 🛡️ **Gestion d'erreurs** robuste

### **2. Page de détails commande (`/vendeur/sales/:orderId`)**

#### ✅ **Avant** (données mockées)
```typescript
const mockOrder: Order = { /* ... */ };

useEffect(() => {
  setOrder(mockOrder);
}, []);
```

#### ✅ **Après** (intégration backend)
```typescript
const loadOrderDetails = async () => {
  const orderData = await vendorOrderService.getVendorOrderDetails(parseInt(orderId));
  setOrder(orderData);
};

const updateOrderStatus = async () => {
  const updatedOrder = await vendorOrderService.updateOrderStatus(
    order.id,
    newStatus,
    statusNote || undefined
  );
  setOrder(updatedOrder);
};
```

#### **Nouvelles fonctionnalités :**
- 📡 **Chargement depuis l'API** avec ID dynamique
- ✏️ **Mise à jour de statut** en temps réel
- 🔔 **Notifications toast** pour feedback utilisateur
- 🚨 **Gestion d'erreurs** avec messages appropriés
- 🔄 **Redirection automatique** si commande introuvable

### **3. Service API (`vendorOrderService.ts`)**

#### **Endpoints implémentés :**
```typescript
// Récupération des commandes avec pagination et filtres
getVendorOrders(filters?: VendorOrderFilters): Promise<PaginatedOrderResponse>

// Détails d'une commande spécifique
getVendorOrderDetails(orderId: number): Promise<Order>

// Mise à jour du statut d'une commande
updateOrderStatus(orderId: number, status: OrderStatus, notes?: string): Promise<Order>

// Statistiques du vendeur
getVendorOrderStatistics(): Promise<VendorOrderStatistics>

// Fonctions utilitaires
calculateLocalStatistics(orders: Order[]): VendorOrderStatistics
handleError(error: any, context: string): string
```

## 🔧 Configuration requise

### **Variables d'environnement**
```env
VITE_API_URL=http://localhost:3004
# ou
VITE_API_URL=https://printalma-back-dep.onrender.com
```

### **Headers de requête**
Toutes les requêtes incluent automatiquement :
```javascript
{
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>' // Géré par le context auth
  }
}
```

## 📡 Format des données API

### **Commandes vendeur** (`GET /vendor/orders`)
```json
{
  "success": true,
  "message": "Commandes récupérées avec succès",
  "data": {
    "orders": [
      {
        "id": 1,
        "orderNumber": "CMD-2024-01-0001",
        "user": {
          "id": 1000,
          "firstName": "Marie",
          "lastName": "Durand",
          "email": "marie.durand@test.printalma.com"
        },
        "status": "PROCESSING",
        "totalAmount": 35000,
        "createdAt": "2024-01-15T10:30:00Z",
        "orderItems": [
          {
            "id": 1,
            "quantity": 2,
            "unitPrice": 17500,
            "productName": "T-shirt Design Afrique",
            "product": {
              "designName": "Motif Wax Traditionnel"
            }
          }
        ]
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### **Statistiques vendeur** (`GET /vendor/orders/statistics`)
```json
{
  "success": true,
  "data": {
    "totalOrders": 25,
    "totalRevenue": 875000,
    "averageOrderValue": 35000,
    "monthlyGrowth": 15.2,
    "pendingOrders": 3,
    "processingOrders": 5,
    "shippedOrders": 8,
    "deliveredOrders": 7,
    "cancelledOrders": 2
  }
}
```

## 🎯 Fonctionnement des filtres

### **Filtres disponibles**
1. **Recherche textuelle** : `search`
   - Numéro de commande
   - Nom du client
   - Email du client

2. **Statut** : `status`
   - PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED

3. **Période** : `startDate` / `endDate`
   - Aujourd'hui
   - 7 derniers jours
   - 30 derniers jours

4. **Pagination** : `page` / `limit`
   - 10 commandes par page par défaut

### **Exemple de requête complète**
```
GET /vendor/orders?page=1&limit=10&status=PROCESSING&search=marie&startDate=2024-01-01&sortBy=createdAt&sortOrder=desc
```

## 🔄 Gestion des états de chargement

### **États UI gérés**
1. **Loading** : Pendant les appels API
2. **Empty** : Aucune commande trouvée
3. **Error** : Erreur de connexion ou permissions
4. **Success** : Données chargées avec succès

### **Skeleton loading**
```typescript
{loading ? (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    ))}
  </div>
) : (
  // Contenu réel
)}
```

## 🚨 Gestion d'erreurs

### **Types d'erreurs gérées**
1. **401 Unauthorized** : Session expirée
2. **403 Forbidden** : Permissions insuffisantes
3. **404 Not Found** : Commande introuvable
4. **400 Bad Request** : Données invalides
5. **500 Server Error** : Erreur serveur

### **Messages utilisateur**
```typescript
const handleError = (error: any, context: string): string => {
  if (error.message?.includes('401')) {
    return 'Session expirée. Veuillez vous reconnecter.';
  } else if (error.message?.includes('403')) {
    return 'Vous n\'avez pas les permissions pour cette action.';
  } else if (error.message?.includes('404')) {
    return 'Commande non trouvée ou vous n\'y avez pas accès.';
  }
  return 'Une erreur est survenue. Veuillez réessayer.';
};
```

## 🎨 Améliorations UX

### **Feedback utilisateur**
- ✅ **Toasts de confirmation** pour les actions réussies
- ❌ **Messages d'erreur** clairs et actionnables
- 🔄 **Loading states** avec animations
- ⏱️ **Debounce sur la recherche** pour éviter trop de requêtes

### **Navigation optimisée**
- 🔢 **Pagination intuitive** avec numéros de page
- 🔍 **Reset des filtres** en un clic
- 📱 **Responsive design** pour mobile
- ⬅️ **Navigation breadcrumb** dans les détails

### **Performance**
- 📊 **Chargement des statistiques** en parallèle
- 🔄 **Rafraîchissement intelligent** des données
- 💾 **Optimisation des re-renders** avec useEffect dependencies

## 🧪 Testing

### **Comment tester l'intégration**

1. **Démarrer le frontend** :
```bash
npm run dev
# Disponible sur http://localhost:5174
```

2. **Configurer l'API** :
```bash
# Dans .env ou .env.local
VITE_API_URL=http://localhost:3004
```

3. **Tester les fonctionnalités** :
   - Se connecter en tant que vendeur
   - Aller sur `/vendeur/sales`
   - Tester les filtres et la recherche
   - Cliquer sur une commande pour voir les détails
   - Essayer de changer le statut

### **Logs de debugging**
Le système inclut des logs détaillés :
```typescript
console.log('🔄 Chargement des commandes vendeur depuis le backend...');
console.log('✅ Commandes récupérées:', response);
console.log('❌ Erreur lors du chargement des commandes:', error);
```

## 🔮 Prochaines étapes

1. **WebSockets** : Notifications temps réel
2. **Export CSV** : Téléchargement des commandes
3. **Filtres avancés** : Montant, période personnalisée
4. **Cache** : Optimisation des performances
5. **Offline support** : Fonctionnement hors ligne

---

**✨ L'intégration est maintenant complète et prête pour la production !**

Le frontend consomme les vraies données du backend avec toutes les fonctionnalités attendues d'un système de gestion de commandes professionnel.