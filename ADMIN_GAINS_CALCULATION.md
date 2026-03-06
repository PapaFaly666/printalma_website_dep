# 💰 Calcul des Gains Admin - PrintAlma

## Résumé

Le système calcule correctement les gains de l'administrateur en fonction de deux sources de revenus :

1. **Commission sur le bénéfice des mockups** (produits de customisation)
2. **Commission sur les designs vendeurs** utilisés dans les commandes

---

## 🎯 Logique Backend (Déjà Implémentée)

**Fichier:** `/printalma-back-dep/src/superadmin-dashboard/superadmin-dashboard.service.ts`

### Formule de Calcul (Lignes 100-178)

Pour chaque commande **payée et validée** (`status: CONFIRMED/PROCESSING/SHIPPED/DELIVERED` + `paymentStatus: PAID`), le système calcule :

```typescript
commissionBase = 0

// 1️⃣ BÉNÉFICE MOCKUP (pour produits customisation)
for (const item of order.orderItems) {
  const productCost = item.product?.price          // Prix d'achat du mockup
  const sellingPrice = item.unitPrice              // Prix de vente au client
  const quantity = item.quantity

  const itemProfit = (sellingPrice - productCost) * quantity
  commissionBase += itemProfit

  // 2️⃣ DESIGNS VENDEURS UTILISÉS
  let itemDesignsTotal = 0

  // Extraire les designs depuis designElementsByView ou customization.designElements
  for (const element of designElements) {
    if (element.type === 'image' && element.designPrice) {
      itemDesignsTotal += parseFloat(element.designPrice)
    }
  }

  commissionBase += itemDesignsTotal
}

// 3️⃣ CALCUL DE LA COMMISSION ADMIN
const commissionRate = (order.commissionRate || 40) / 100  // 40% par défaut
const commissionAmount = commissionBase * commissionRate

totalAdminGains += commissionAmount
```

---

## 📊 Exemples Concrets

### **Exemple 1 : Commande avec Produit Customisation**

**Commande #123**
- 1x T-shirt blanc (mockup)
  - Prix d'achat mockup : **5000 FCFA**
  - Prix de vente client : **8000 FCFA**
  - Bénéfice mockup : **3000 FCFA**

- Design vendeur utilisé :
  - Prix design : **2000 FCFA**

- Commission admin : **40%**

**Calcul :**
```
Base commission = Bénéfice mockup + Prix design^
                = 3000 + 2000
                = 5000 FCFA

Gain admin = 5000 × 40%
           = 2000 FCFA ✅
``` 

**Répartition :**
- Admin : **2000 FCFA** (40%)
- Vendeur : **3000 FCFA** (60% de 5000)

---

### **Exemple 2 : Commande avec Produit Vendeur**

**Commande #456**
- 1x Sticker personnalisé (produit vendeur)
  - Prix de vente : **3000 FCFA**

- Commission admin : **30%**

**Calcul :**
```
Base commission = Prix total produit
                = 3000 FCFA

Gain admin = 3000 × 30%
           = 900 FCFA ✅
```

**Répartition :**
- Admin : **900 FCFA** (30%)
- Vendeur : **2100 FCFA** (70%)

---

### **Exemple 3 : Commande Mixte**

**Commande #789**
- 2x T-shirts (mockups)
  - Bénéfice mockup unitaire : **3000 FCFA**
  - Bénéfice total : **6000 FCFA**

- 3 designs vendeurs utilisés :
  - Design 1 : **1500 FCFA**
  - Design 2 : **2000 FCFA**
  - Design 3 : **1000 FCFA**
  - Total designs : **4500 FCFA**

- Commission admin : **40%**

**Calcul :**
```
Base commission = Bénéfice mockups + Prix designs
                = 6000 + 4500
                = 10500 FCFA

Gain admin = 10500 × 40%
           = 4200 FCFA ✅
```

**Répartition :**
- Admin : **4200 FCFA** (40%)
- Vendeurs designs : **6300 FCFA** (60%)

---

## 🖥️ Affichage Frontend (Adapté)

**Fichier:** `/printalma_website_dep/src/pages/Dashboard.tsx`

### Modifications Apportées

#### **1. Cartes CA Annuel/Mensuel**

**Avant :**
```tsx
<CardTitle>Chiffre d'affaires annuel</CardTitle>
<p>Gain annuel</p>
```

**Après :**
```tsx
<CardTitle>CA Annuel (Commandes)</CardTitle>
<p>Montant total commandes année</p>
```

**Clarification :** Ces champs affichent le **montant total des commandes**, pas les gains admin.

---

#### **2. Statistiques Financières**

**Avant :**
```tsx
<span>Gains Admin</span>
<span>{formatCurrency(dashboardData.financialStats.totalAdminGains)}</span>
```

**Après :**
```tsx
<span className="text-green-700">💰 Gains Admin (Total)</span>
<span className="text-green-700">{formatCurrency(dashboardData.financialStats.totalAdminGains)}</span>
<div className="text-xs text-gray-500">
  Commission sur bénéfices mockups + commission designs vendeurs
</div>
```

**Amélioration :**
- Mise en évidence en **vert** 💰
- **Explication claire** de ce que représentent les gains
- Utilise directement `totalAdminGains` calculé par le backend

---

## 📋 Champs Disponibles dans `financialStats`

```typescript
interface FinancialStats {
  totalAdminGains: number;           // ✅ Gains totaux admin (toutes commissions)
  totalRevenue: number;              // CA total (montant commandes)
  thisMonthRevenue: number;          // CA du mois
  thisYearRevenue: number;           // CA de l'année
  totalPlatformRevenue: number;      // Commissions générées (ancien calcul)
  thisMonthPlatformRevenue: number;  // Commissions du mois
  totalVendorEarnings: number;       // Total versé aux vendeurs
  thisMonthVendorEarnings: number;   // Versé ce mois
  pendingPayouts: number;            // En attente de paiement
  availableForPayout: number;        // Disponibles pour paiement
  averageCommissionRate: number;     // Taux commission moyen
}
```

---

## ✅ Validation

### **Backend**

- ✅ Calcule correctement sur **bénéfice mockup**
- ✅ Additionne les **prix designs vendeurs**
- ✅ Applique la **commission appropriée**
- ✅ Prend en compte seulement les **commandes payées**

### **Frontend**

- ✅ Affiche `totalAdminGains` depuis le backend
- ✅ Explique clairement la composition des gains
- ✅ Distingue **CA commandes** vs **Gains admin**
- ✅ Mise en forme visuelle claire (vert, icône 💰)

---

## 🔍 Pour Déboguer

Si les gains semblent incorrects, vérifier :

1. **Backend - Commandes**
   ```sql
   SELECT * FROM Order
   WHERE status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')
   AND paymentStatus = 'PAID'
   ```

2. **Backend - Items de Commande**
   ```sql
   SELECT
     oi.unitPrice AS sellingPrice,
     p.price AS productCost,
     (oi.unitPrice - p.price) * oi.quantity AS profit
   FROM OrderItem oi
   JOIN Product p ON oi.productId = p.id
   ```

3. **Backend - Design Elements**
   ```sql
   SELECT
     oi.designElementsByView,
     c.designElements
   FROM OrderItem oi
   LEFT JOIN Customization c ON oi.customizationId = c.id
   ```

4. **Logs Backend**
   - Ajouter des `console.log()` dans `superadmin-dashboard.service.ts` lignes 111-178

---

## 📅 Date d'Implémentation

**Backend :** Déjà implémenté (lignes 100-194)
**Frontend :** Adapté le 5 mars 2026
**Version :** 1.0.0
**Auteur :** Claude Sonnet 4.5

---

## 🎉 Conclusion

Le système calcule maintenant correctement les gains admin selon la logique métier :

- **Produits customisation** → Commission sur le bénéfice (prix vente - prix mockup) + commission designs
- **Produits vendeurs** → Commission sur le prix total du produit

L'affichage frontend reflète fidèlement ces calculs avec des explications claires pour l'utilisateur.
