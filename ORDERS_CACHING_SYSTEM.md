# 🚀 Système de Caching des Commandes

## 📖 Vue d'ensemble

Le système de caching des commandes utilise **TanStack Query (React Query)** pour optimiser les performances et réduire les appels API inutiles.

### Principe

- **Cache intelligent** : Les données sont mises en cache pendant 5 minutes (staleTime)
- **Conservation** : Le cache est conservé pendant 10 minutes (gcTime)
- **Pas de refetch automatique** : Les données ne sont rechargées que lors d'actions explicites ou de mises à jour

## 📁 Architecture

### Fichiers

```
src/
├── hooks/
│   └── useOrders.ts          # Hooks TanStack Query pour les commandes
└── pages/admin/
    └── OrdersManagement.tsx  # Page utilisant le système de caching
```

## 🎯 Fonctionnalités

### 1. Chargement des Commandes avec Cache

```typescript
const ordersQuery = useOrders({
  page: 1,
  limit: 20,
  status: 'PENDING',
  orderNumber: 'ORD-123'
});

// Accès aux données
const orders = ordersQuery.data?.orders || [];
const loading = ordersQuery.isLoading;
const error = ordersQuery.error;
```

**Comportement** :
- ✅ Les données sont chargées une seule fois
- ✅ Utilise le cache pendant 5 minutes
- ✅ Pas de refetch au montage du composant
- ✅ Pas de refetch au focus de la fenêtre

### 2. Chargement des Statistiques avec Cache

```typescript
const statisticsQuery = useOrderStatistics();
const statistics = statisticsQuery.data;
```

**Comportement** :
- ✅ Cache de 5 minutes
- ✅ Mise à jour uniquement lors d'actions

### 3. Mise à Jour du Statut avec Invalidation

```typescript
const updateOrderStatusMutation = useUpdateOrderStatus();

await updateOrderStatusMutation.mutateAsync({
  orderId: 123,
  newStatus: 'CONFIRMED',
  notes: 'Commande confirmée'
});
```

**Comportement automatique** :
- ✅ Invalide le cache des listes de commandes
- ✅ Invalide le cache des statistiques
- ✅ Invalide la commande spécifique
- ✅ Force un refetch automatique
- ✅ Affiche une notification de succès/erreur

### 4. Rafraîchissement Manuel

```typescript
const { refreshOrders, refreshStatistics, refreshAll } = useRefreshOrders();

// Rafraîchir uniquement les commandes
refreshOrders();

// Rafraîchir uniquement les statistiques
refreshStatistics();

// Rafraîchir tout
refreshAll();
```

**Utilisé pour** :
- Bouton "Actualiser"
- Notifications WebSocket
- Actions utilisateur explicites

### 5. Mise à Jour Optimiste du Cache

```typescript
const { updateOrderStatus } = useUpdateOrderInCache();

// Mise à jour immédiate dans le cache (sans attendre l'API)
updateOrderStatus(orderId, 'SHIPPED');
```

**Utilisé pour** :
- Drag & Drop dans le Kanban
- Mises à jour WebSocket
- UI réactive instantanée

## 🔄 Cas d'Usage

### Cas 1 : Nouvelle Commande (WebSocket)

```typescript
webSocketService.onNewOrder = (notification) => {
  console.log('🆕 Nouvelle commande reçue');
  refreshOrders();      // Recharge les commandes
  refreshStatistics();  // Recharge les stats
};
```

### Cas 2 : Changement de Statut (WebSocket)

```typescript
webSocketService.onOrderStatusChanged = (data) => {
  console.log('📝 Statut changé');
  // Mise à jour optimiste immédiate
  updateOrderInCache(data.orderId, data.newStatus);
  // Recharge les stats
  refreshStatistics();
};
```

### Cas 3 : Action Utilisateur (Drag & Drop)

```typescript
const handleDragOver = (event) => {
  const orderId = extractOrderId(event.active.id);
  const newStatus = extractStatus(event.over.id);

  // Mise à jour optimiste dans le cache
  updateOrderInCache(orderId, newStatus);
};

const handleDragEnd = (event) => {
  // Mise à jour réelle via API
  await updateOrderStatus(orderId, newStatus);
  // La mutation invalide automatiquement le cache
};
```

### Cas 4 : Bouton Actualiser

```typescript
<Button onClick={debouncedRefresh}>
  Actualiser
</Button>

// Implementation
const debouncedRefresh = useCallback(() => {
  refreshAll(); // Invalide et refetch tout
}, [refreshAll]);
```

## 📊 Configuration du Cache

### staleTime (Temps de fraîcheur)

```typescript
staleTime: 5 * 60 * 1000, // 5 minutes
```

- Pendant ce temps, les données sont considérées comme "fraîches"
- Aucun refetch automatique ne sera effectué
- Les données du cache sont utilisées directement

### gcTime (Garbage Collection Time)

```typescript
gcTime: 10 * 60 * 1000, // 10 minutes
```

- Temps pendant lequel les données restent en cache
- Même si le composant est démonté
- Permet de revenir sur la page sans recharger

### Options de Refetch

```typescript
refetchOnMount: false,        // Pas de refetch au montage
refetchOnWindowFocus: false,  // Pas de refetch au focus
refetchOnReconnect: false,    // Pas de refetch à la reconnexion
```

## 🎨 Keys de Query

```typescript
export const orderKeys = {
  all: ['orders'],                          // Base key
  lists: () => ['orders', 'list'],          // Toutes les listes
  list: (filters) => ['orders', 'list', { filters }], // Liste spécifique
  details: () => ['orders', 'detail'],      // Tous les détails
  detail: (id) => ['orders', 'detail', id], // Détail spécifique
  statistics: () => ['orders', 'statistics'], // Statistiques
};
```

**Hiérarchie** :
- Invalider `['orders']` → Invalide TOUT
- Invalider `['orders', 'list']` → Invalide toutes les listes
- Invalider `['orders', 'detail', 123]` → Invalide la commande #123

## ✅ Avantages du Système

### Performance

- ⚡ **Moins d'appels API** : Cache de 5 minutes
- ⚡ **UI réactive** : Mises à jour optimistes
- ⚡ **Navigation rapide** : Données conservées 10 minutes

### Expérience Utilisateur

- 🎯 **Chargement instantané** : Utilise le cache
- 🎯 **UI toujours à jour** : Invalidations automatiques
- 🎯 **Feedback immédiat** : Mises à jour optimistes

### Maintenance

- 🔧 **Code centralisé** : Tous les hooks dans useOrders.ts
- 🔧 **Type-safe** : TypeScript strict
- 🔧 **Facile à débugger** : React Query DevTools

## 🛠️ Débugger le Cache

### React Query DevTools

Installer les DevTools (déjà fait) :

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Logs Console

Tous les hooks affichent des logs :

```
🔄 [useOrders] Fetching orders from API... { page: 1, limit: 20 }
✅ [useOrders] Orders fetched: 15
🔄 [useUpdateOrderStatus] Updating order status... { orderId: 123, newStatus: 'CONFIRMED' }
✅ [useUpdateOrderStatus] Order status updated, invalidating cache...
```

## 📝 Bonnes Pratiques

### ✅ À FAIRE

```typescript
// Utiliser les hooks TanStack Query
const ordersQuery = useOrders({ page: 1 });

// Invalider le cache après une mutation
await updateOrderStatus(orderId, newStatus);
// ✅ Le cache est automatiquement invalidé

// Mise à jour optimiste pour UI réactive
updateOrderInCache(orderId, newStatus);
```

### ❌ À ÉVITER

```typescript
// ❌ Ne pas utiliser useState pour les données d'API
const [orders, setOrders] = useState([]);

// ❌ Ne pas refetch manuellement à chaque action
useEffect(() => {
  fetchOrders(); // ❌ Mauvais
}, []);

// ❌ Ne pas modifier les données sans invalider le cache
setOrders(prev => prev.map(...)); // ❌ Le cache devient obsolète
```

## 🔮 Évolutions Futures

### Possibilités

1. **Pagination infinie**
   ```typescript
   useInfiniteQuery({
     queryKey: orderKeys.lists(),
     queryFn: ({ pageParam = 1 }) => fetchOrders(pageParam),
     getNextPageParam: (lastPage) => lastPage.nextPage,
   });
   ```

2. **Prefetching**
   ```typescript
   // Précharger la page suivante
   queryClient.prefetchQuery({
     queryKey: orderKeys.list({ page: currentPage + 1 }),
     queryFn: () => fetchOrders({ page: currentPage + 1 }),
   });
   ```

3. **Synchronisation multi-onglets**
   ```typescript
   // Partager le cache entre onglets
   import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';
   ```

## 📚 Ressources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Caching Best Practices](https://tanstack.com/query/latest/docs/react/guides/important-defaults)

---

**Dernière mise à jour** : 2025-11-28
