# Backend - Gestion des Fonds Vendeurs (Appel de Fonds)

## 📋 Résumé

Ce document décrit les modifications nécessaires au backend pour implémenter une gestion correcte des fonds disponibles pour retrait par les vendeurs. **Règle principale** : Un vendeur ne peut retirer des fonds **que pour les commandes livrées** (`status = 'DELIVERED'`).

---

## 🎯 Objectif

Actuellement, le frontend affiche un "Solde disponible" qui inclut **tous les gains** des commandes payées, **même si elles ne sont pas encore livrées**. Ceci est incorrect car :

1. ❌ Les vendeurs peuvent demander un retrait avant que la commande soit livrée
2. ❌ Si une commande est annulée après paiement, le montant a déjà été retiré
3. ❌ Risque de trésorerie négative pour la plateforme

### ✅ Solution

Le backend doit calculer le **montant disponible pour retrait** en ne prenant en compte **que les commandes livrées** :

```
Disponible = Gains des commandes DELIVERED - Retraits effectués - Retraits en cours
```

---

## 📊 Modèle de Données

### Structure de la réponse API `/orders/my-orders`

Actuellement, l'API retourne :

```typescript
{
  success: true,
  data: {
    orders: Order[],
    statistics: {
      totalOrders: number,
      totalAmount: number,
      totalRevenue: number,          // Toutes les commandes payées
      totalCommission: number,        // Commission plateforme
      totalVendorAmount: number,      // Gains vendeur (toutes commandes payées)
      monthlyRevenue: number,
      annualRevenue: number,
      ...
    },
    vendorFinances?: {
      totalVendorAmount: number,           // Total des gains (toutes commandes)
      withdrawnAmount: number,             // Montant déjà retiré
      pendingWithdrawalAmount: number,     // Retraits en attente
      availableForWithdrawal: number,      // ⚠️ À CORRIGER
      deliveredOrdersCount: number,
      totalCommissionDeducted: number,
      fundsRequestsSummary: {...},
      message: string
    }
  }
}
```

---

## 🔧 Modifications Nécessaires

### 1. **Endpoint `/orders/my-orders` (Vendeur)**

**Fichier backend** : `src/orders/orders.controller.ts` ou similaire

#### Calcul actuel (INCORRECT) :

```typescript
// ❌ PROBLÈME : Inclut TOUTES les commandes payées
const totalVendorAmount = orders
  .filter(o => o.paymentStatus === 'PAID')
  .reduce((sum, o) => sum + o.vendorAmount, 0);

const availableForWithdrawal = totalVendorAmount - withdrawnAmount - pendingWithdrawalAmount;
```

#### Calcul corrigé (CORRECT) :

```typescript
// ✅ SOLUTION : Ne compter que les commandes DELIVERED
const deliveredOrders = orders.filter(
  o => o.status === 'DELIVERED' && o.paymentStatus === 'PAID'
);

const totalVendorAmount = orders
  .filter(o => o.paymentStatus === 'PAID')
  .reduce((sum, o) => sum + o.vendorAmount, 0);

// Montant disponible = seulement les commandes livrées
const deliveredVendorAmount = deliveredOrders
  .reduce((sum, o) => sum + o.vendorAmount, 0);

const withdrawnAmount = await prisma.withdrawalRequest.aggregate({
  where: {
    vendorId: vendorId,
    status: 'COMPLETED'
  },
  _sum: { amount: true }
});

const pendingWithdrawalAmount = await prisma.withdrawalRequest.aggregate({
  where: {
    vendorId: vendorId,
    status: 'PENDING'
  },
  _sum: { amount: true }
});

const availableForWithdrawal = Math.max(
  0,
  deliveredVendorAmount - (withdrawnAmount._sum.amount || 0) - (pendingWithdrawalAmount._sum.amount || 0)
);
```

---

### 2. **Statistiques à retourner**

Ajouter des champs distincts pour :

```typescript
{
  vendorFinances: {
    // Total des gains (toutes commandes payées)
    totalVendorAmount: number,

    // 🆕 Total des gains livrés (commandes DELIVERED uniquement)
    deliveredVendorAmount: number,

    // Montant déjà retiré (COMPLETED)
    withdrawnAmount: number,

    // Montant en attente (PENDING)
    pendingWithdrawalAmount: number,

    // 🆕 Montant réellement disponible pour retrait
    availableForWithdrawal: number,

    // Statistiques additionnelles
    deliveredOrdersCount: number,
    pendingOrdersAmount: number,      // Gains en attente de livraison
    totalCommissionDeducted: number,

    fundsRequestsSummary: {
      total: number,
      paid: number,
      pending: number,
      approved: number,
      rejected: number
    },

    message: string
  }
}
```

---

### 3. **Validation lors de la demande de retrait**

**Endpoint** : `POST /funds/withdrawal-requests`

#### Validation à implémenter :

```typescript
async createWithdrawalRequest(vendorId: number, createDto: CreateWithdrawalRequestDto) {
  // 1. Calculer le montant disponible
  const deliveredOrders = await prisma.order.findMany({
    where: {
      vendorId: vendorId,
      status: 'DELIVERED',
      paymentStatus: 'PAID'
    }
  });

  const deliveredVendorAmount = deliveredOrders.reduce(
    (sum, o) => sum + o.vendorAmount,
    0
  );

  const withdrawnAmount = await prisma.withdrawalRequest.aggregate({
    where: {
      vendorId: vendorId,
      status: 'COMPLETED'
    },
    _sum: { amount: true }
  });

  const pendingWithdrawalAmount = await prisma.withdrawalRequest.aggregate({
    where: {
      vendorId: vendorId,
      status: 'PENDING'
    },
    _sum: { amount: true }
  });

  const availableForWithdrawal = Math.max(
    0,
    deliveredVendorAmount -
    (withdrawnAmount._sum.amount || 0) -
    (pendingWithdrawalAmount._sum.amount || 0)
  );

  // 2. Valider que le montant demandé est disponible
  if (createDto.amount > availableForWithdrawal) {
    throw new BadRequestException(
      `Montant demandé (${createDto.amount} F) supérieur au solde disponible (${availableForWithdrawal} F). ` +
      `Seules les commandes livrées peuvent être retirées.`
    );
  }

  // 3. Montant minimum (exemple : 5000 F CFA)
  const MIN_WITHDRAWAL_AMOUNT = 5000;
  if (createDto.amount < MIN_WITHDRAWAL_AMOUNT) {
    throw new BadRequestException(
      `Le montant minimum de retrait est de ${MIN_WITHDRAWAL_AMOUNT} F CFA`
    );
  }

  // 4. Créer la demande de retrait
  const withdrawalRequest = await prisma.withdrawalRequest.create({
    data: {
      vendorId: vendorId,
      amount: createDto.amount,
      method: createDto.method,
      status: 'PENDING',
      mobileDetails: createDto.mobileDetails,
      bankDetails: createDto.bankDetails,
      notes: createDto.notes,
      requestedAt: new Date()
    }
  });

  return withdrawalRequest;
}
```

---

## 🔄 Workflow Complet

### Cycle de vie des fonds

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Commande créée (PENDING)                                    │
│     Gains vendeur = 0 F (non comptabilisé)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Commande confirmée (CONFIRMED)                              │
│     Gains vendeur = 0 F (non comptabilisé)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Paiement effectué (paymentStatus = PAID)                    │
│     totalVendorAmount += vendorAmount                           │
│     availableForWithdrawal = 0 F (pas encore livré)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Commande en préparation (PROCESSING)                        │
│     availableForWithdrawal = 0 F (pas encore livré)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Commande expédiée (SHIPPED)                                 │
│     availableForWithdrawal = 0 F (pas encore livré)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Commande livrée (DELIVERED) ✅                              │
│     deliveredVendorAmount += vendorAmount                       │
│     availableForWithdrawal += vendorAmount                      │
│     → Le vendeur PEUT maintenant retirer ces fonds              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Demande de retrait (PENDING)                                │
│     pendingWithdrawalAmount += montant_demandé                  │
│     availableForWithdrawal -= montant_demandé                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. Retrait validé par admin (COMPLETED)                        │
│     withdrawnAmount += montant_demandé                          │
│     pendingWithdrawalAmount -= montant_demandé                  │
│     → Argent transféré au vendeur                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Impact Frontend

### Page `/vendeur/sales` (VendorSalesPage.tsx)

**Actuellement** :

```typescript
const totalVendorEarnings = orders.reduce((sum, order) => {
  if (order.status !== 'CANCELLED' &&
      order.paymentStatus === 'PAID' &&
      order.commission_info?.vendor_amount) {
    return sum + order.commission_info.vendor_amount;
  }
  return sum;
}, 0);
```

**Nouvelle statistique à afficher** :

```typescript
// Gains totaux (toutes commandes payées)
const totalVendorEarnings = orders.reduce((sum, order) => {
  if (order.status !== 'CANCELLED' &&
      order.paymentStatus === 'PAID' &&
      order.commission_info?.vendor_amount) {
    return sum + order.commission_info.vendor_amount;
  }
  return sum;
}, 0);

// 🆕 Gains livrés (seulement commandes DELIVERED)
const deliveredVendorEarnings = orders.reduce((sum, order) => {
  if (order.status === 'DELIVERED' &&
      order.paymentStatus === 'PAID' &&
      order.commission_info?.vendor_amount) {
    return sum + order.commission_info.vendor_amount;
  }
  return sum;
}, 0);

// 🆕 Gains en attente de livraison
const pendingVendorEarnings = totalVendorEarnings - deliveredVendorEarnings;
```

**Nouvelles cards à ajouter** :

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Mes Gains Nets</CardTitle>
    <DollarSign className="h-4 w-4 text-green-600" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-green-600">
      {(totalVendorEarnings / 100).toLocaleString()} F
    </div>
    <p className="text-xs text-muted-foreground">Total des gains</p>
  </CardContent>
</Card>

<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Livrés</CardTitle>
    <CheckCircle className="h-4 w-4 text-blue-600" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-blue-600">
      {(deliveredVendorEarnings / 100).toLocaleString()} F
    </div>
    <p className="text-xs text-muted-foreground">Gains disponibles pour retrait</p>
  </CardContent>
</Card>

<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">En attente</CardTitle>
    <Clock className="h-4 w-4 text-orange-600" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-orange-600">
      {(pendingVendorEarnings / 100).toLocaleString()} F
    </div>
    <p className="text-xs text-muted-foreground">Gains en attente de livraison</p>
  </CardContent>
</Card>
```

---

### Page `/appel-de-fonds` (AppelDeFondsPage.tsx)

**Modification de la card "Disponible"** :

```tsx
<Card className="border border-gray-200">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium text-gray-600">
        Disponible
      </CardTitle>
      <CircleCheckBig className="h-4 w-4 text-blue-600" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-3">
      <Wallet className="h-6 w-6 text-blue-600" />
      <div>
        <div className="text-2xl font-bold text-blue-900">
          {showBalance
            ? fundsService.formatCFA(statistics.availableBalance)
            : '••••••'
          }
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Prêt pour retrait (commandes livrées uniquement)
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

**Calcul du montant disponible** :

```typescript
const statistics = useMemo(() => {
  // Récupérer depuis vendorFinances du backend
  const availableBalance = backendStatistics?.vendorFinances?.availableForWithdrawal || 0;
  const deliveredEarnings = backendStatistics?.vendorFinances?.deliveredVendorAmount || 0;
  const totalEarnings = backendStatistics?.vendorFinances?.totalVendorAmount || 0;

  const pendingWithdrawals = withdrawalRequests
    .filter(req => req.status === 'PENDING')
    .reduce((sum, req) => sum + req.amount, 0);

  return {
    totalEarnings,           // Tous les gains
    deliveredEarnings,       // Gains des commandes livrées
    availableBalance,        // Disponible pour retrait
    pendingWithdrawals,      // Retraits en cours
    pendingEarnings: totalEarnings - deliveredEarnings,  // En attente de livraison
    monthlyRevenue: backendStatistics?.monthlyRevenue || 0,
    annualRevenue: backendStatistics?.annualRevenue || 0
  };
}, [backendStatistics, withdrawalRequests]);
```

---

## 🛡️ Sécurité et Validation

### 1. **Validation côté backend**

```typescript
// Montant minimum de retrait
const MIN_WITHDRAWAL = 5000; // 5 000 F CFA

// Montant maximum par retrait (optionnel)
const MAX_WITHDRAWAL = 10_000_000; // 10 millions F CFA

// Limite de retraits par jour (optionnel)
const MAX_WITHDRAWALS_PER_DAY = 3;
```

### 2. **Vérification de l'intégrité**

Avant de créer une demande de retrait, vérifier :

```typescript
// 1. Le vendeur a-t-il des commandes livrées ?
const hasDeliveredOrders = await prisma.order.count({
  where: {
    vendorId: vendorId,
    status: 'DELIVERED',
    paymentStatus: 'PAID'
  }
});

if (hasDeliveredOrders === 0) {
  throw new BadRequestException(
    'Vous devez avoir au moins une commande livrée pour demander un retrait'
  );
}

// 2. Le vendeur n'a-t-il pas dépassé la limite quotidienne ?
const todayRequests = await prisma.withdrawalRequest.count({
  where: {
    vendorId: vendorId,
    requestedAt: {
      gte: startOfDay(new Date())
    }
  }
});

if (todayRequests >= MAX_WITHDRAWALS_PER_DAY) {
  throw new BadRequestException(
    `Vous avez atteint la limite de ${MAX_WITHDRAWALS_PER_DAY} demandes par jour`
  );
}
```

---

## 📊 Exemple de Réponse API

### GET `/orders/my-orders` (Vendeur)

```json
{
  "success": true,
  "data": {
    "orders": [...],
    "statistics": {
      "totalOrders": 25,
      "totalAmount": 5000000,
      "totalRevenue": 5000000,
      "totalCommission": 750000,
      "totalVendorAmount": 4250000,
      "monthlyRevenue": 1200000,
      "annualRevenue": 5000000
    },
    "vendorFinances": {
      "totalVendorAmount": 4250000,
      "deliveredVendorAmount": 3200000,
      "withdrawnAmount": 1000000,
      "pendingWithdrawalAmount": 500000,
      "availableForWithdrawal": 1700000,
      "deliveredOrdersCount": 18,
      "pendingOrdersAmount": 1050000,
      "totalCommissionDeducted": 750000,
      "fundsRequestsSummary": {
        "total": 5,
        "paid": 3,
        "pending": 1,
        "approved": 1,
        "rejected": 0
      },
      "message": "Vous avez 1 700 000 F CFA disponibles pour retrait (18 commandes livrées)"
    }
  }
}
```

### Explication des montants :

- **totalVendorAmount** (4 250 000 F) : Total des gains de **toutes** les commandes payées
- **deliveredVendorAmount** (3 200 000 F) : Gains des commandes **livrées uniquement**
- **withdrawnAmount** (1 000 000 F) : Montant déjà retiré (status = COMPLETED)
- **pendingWithdrawalAmount** (500 000 F) : Retraits en attente (status = PENDING)
- **availableForWithdrawal** (1 700 000 F) : `3 200 000 - 1 000 000 - 500 000 = 1 700 000 F`
- **pendingOrdersAmount** (1 050 000 F) : `4 250 000 - 3 200 000 = 1 050 000 F` (gains en attente de livraison)

---

## 🧪 Tests

### Scénarios à tester :

1. ✅ Vendeur avec 0 commandes livrées → `availableForWithdrawal = 0`
2. ✅ Vendeur avec commandes livrées → `availableForWithdrawal > 0`
3. ✅ Demande de retrait supérieure au disponible → Erreur 400
4. ✅ Demande de retrait avec montant disponible → Succès
5. ✅ Commande annulée après paiement → Ne compte pas dans le disponible
6. ✅ Commande livrée puis retrait → Le disponible diminue
7. ✅ Retrait validé → `withdrawnAmount` augmente, `pendingWithdrawalAmount` diminue
8. ✅ Retrait rejeté → `pendingWithdrawalAmount` diminue, `availableForWithdrawal` augmente

---

## 📝 Checklist d'implémentation

### Backend

- [ ] Modifier `GET /orders/my-orders` pour ajouter `vendorFinances.deliveredVendorAmount`
- [ ] Corriger le calcul de `availableForWithdrawal` (ne prendre que DELIVERED)
- [ ] Ajouter `vendorFinances.pendingOrdersAmount`
- [ ] Valider dans `POST /funds/withdrawal-requests` que le montant est disponible
- [ ] Ajouter validation du montant minimum (5 000 F CFA)
- [ ] Ajouter message d'erreur explicite si commande non livrée
- [ ] Tester les scénarios edge cases (annulation, rejet, etc.)

### Frontend

- [ ] Mettre à jour `AppelDeFondsPage.tsx` pour utiliser `vendorFinances.availableForWithdrawal`
- [ ] Ajouter la distinction "Gains totaux" vs "Gains livrés" dans `/vendeur/sales`
- [ ] Afficher un message informatif sur la card "Disponible"
- [ ] Désactiver le bouton "Retrait" si `availableBalance <= 0`
- [ ] Ajouter un tooltip expliquant pourquoi le montant n'est pas disponible
- [ ] Tester l'interface avec différents statuts de commandes

---

## 🎨 Messages d'erreur suggérés

### Lors d'une demande de retrait invalide :

```typescript
// Montant supérieur au disponible
throw new BadRequestException({
  message: "Montant demandé supérieur au solde disponible",
  details: {
    requested: 2000000,
    available: 1700000,
    reason: "Seules les commandes livrées peuvent être retirées"
  }
});

// Pas de commandes livrées
throw new BadRequestException({
  message: "Aucune commande livrée disponible pour retrait",
  details: {
    totalEarnings: 4250000,
    deliveredEarnings: 0,
    pendingEarnings: 4250000,
    reason: "Attendez que vos commandes soient livrées"
  }
});

// Montant minimum non atteint
throw new BadRequestException({
  message: "Le montant minimum de retrait est de 5 000 F CFA",
  details: {
    requested: 3000,
    minimum: 5000
  }
});
```

---

## 📖 Documentation API

### GET `/orders/my-orders`

**Description** : Récupère les commandes et les finances du vendeur connecté

**Headers** :
```
Authorization: Bearer <token>
```

**Response** :
```typescript
{
  success: true,
  data: {
    orders: Order[],
    statistics: OrderStatistics,
    vendorFinances: {
      totalVendorAmount: number,           // Tous les gains
      deliveredVendorAmount: number,       // Gains livrés
      withdrawnAmount: number,             // Retraits effectués
      pendingWithdrawalAmount: number,     // Retraits en attente
      availableForWithdrawal: number,      // Disponible pour retrait
      deliveredOrdersCount: number,
      pendingOrdersAmount: number,         // Gains en attente de livraison
      totalCommissionDeducted: number,
      fundsRequestsSummary: {...},
      message: string
    }
  }
}
```

---

## 🚀 Déploiement

1. **Appliquer les migrations Prisma** (si modification du schéma)
2. **Tester en environnement de développement**
3. **Vérifier les données existantes** (recalculer `availableForWithdrawal` pour tous les vendeurs)
4. **Déployer en production**
5. **Monitorer les logs** pour détecter d'éventuelles incohérences

---

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs/)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [Validation Pipes](https://docs.nestjs.com/pipes)

---

**Date de création** : 09 février 2026
**Version** : 1.0.0
**Auteur** : Claude Sonnet 4.5

---

## 💡 Notes importantes

1. **Conversion des montants** : Les montants sont stockés en **centimes** dans la base de données (ex: 1 000 000 = 10 000 F CFA)
2. **Affichage** : Diviser par 100 pour afficher en F CFA
3. **Précision** : Utiliser `Math.max(0, ...)` pour éviter les soldes négatifs
4. **Transactions** : Utiliser des transactions Prisma pour garantir la cohérence des données

```typescript
// Exemple de transaction pour créer une demande de retrait
await prisma.$transaction(async (tx) => {
  // 1. Vérifier le solde disponible
  const available = await calculateAvailableBalance(tx, vendorId);

  if (amount > available) {
    throw new Error('Solde insuffisant');
  }

  // 2. Créer la demande
  const withdrawal = await tx.withdrawalRequest.create({
    data: {
      vendorId,
      amount,
      status: 'PENDING',
      ...
    }
  });

  return withdrawal;
});
```

---

**Fin du document**
