# 🎨 Intégration Personnalisations → Commandes

## 📋 Vue d'ensemble

Ce document décrit l'implémentation technique de l'intégration entre le système de personnalisation de produits et le système de commandes dans PrintAlma.

## 🏗️ Architecture

### Backend (API Node.js + PostgreSQL)
- **Table `customizations`** : Stocke les personnalisations clients
- **Endpoints `/customizations`** : CRUD complet des personnalisations
- **Support invités** : SessionId + email pour clients non connectés
- **Index optimisés** : Requêtes ultra-rapides avec clauses composites

### Frontend (React + TypeScript)
- **CartContext** : Gestion du panier avec données de personnalisation
- **OrderService** : Service de commande avec support `customizationId`
- **OrderFormPage** : Formulaire de commande intégrant les personnalisations

## 🔄 Flux de données

### 1. Page de Personnalisation
```
CustomerProductCustomizationPageV3
├── designElements: DesignElement[]
├── Sauvegarde → CustomizationService.saveCustomization()
├── Retour → customizationId: number
└── Ajout panier → CartContext.addToCart({customizationId, designElements})
```

### 2. Panier → Commande
```
CartContext (localStorage)
├── CartItem.customizationId?: number
├── CartItem.designElements?: any[]
└── OrderFormPage.tsx
    ├── Récupère cartItem avec données de personnalisation
    ├── Construit orderRequest avec customizationId
    └── Envoie → OrderService.createOrderWithPayment()
```

### 3. Backend Commande
```
POST /orders ou /orders/guest
├── orderItems[].customizationId: number
├── orderItems[].designElements: any[]
└── Backend traite → Lien vers personnalisation existante
```

## 📝 Structures de données

### CustomizationData (Backend)
```typescript
interface CustomizationData {
  productId: number;
  colorVariationId: number;
  viewId: number;
  designElements: DesignElement[];
  sizeSelections?: SizeSelection[];
  sessionId?: string;
  previewImageUrl?: string;
}
```

### CartItem (Frontend)
```typescript
interface CartItem {
  // ... autres propriétés
  customizationId?: number;     // 🆕 Lien vers personnalisation
  designElements?: any[];       // 🆕 Éléments de design (backup)
}
```

### OrderItem (Frontend + Backend)
```typescript
interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice?: number;
  size?: string;
  color?: string;
  // ... autres propriétés

  // 🆕 PERSONNALISATION (API backend)
  customizationId?: number;     // ID de la personnalisation sauvegardée
  designElements?: any[];       // Éléments de design complets (backup)
}
```

## 🔧 Points d'intégration clés

### 1. CartContext.tsx
```typescript
addToCart(product: {
  // ... autres propriétés
  customizationId?: number;
  designElements?: any[];
}) {
  const newItem: CartItem = {
    // ... autres propriétés
    customizationId: product.customizationId,
    designElements: product.designElements
  };
}
```

### 2. OrderService.ts
```typescript
interface OrderItem {
  // ... existant
  customizationId?: number;
  designElements?: any[];
}

createOrderFromCart(cartItems: any[], shippingInfo: any) {
  const itemsWithPrices = cartItems.map(item => {
    const orderItem = {
      // ... autres propriétés
      customizationId: item.customizationId,
      designElements: item.designElements
    };
    return orderItem;
  });
}
```

### 3. OrderFormPage.tsx
```typescript
// Paiement PayDunya
orderItems: [{
  productId: productId,
  quantity: 1,
  unitPrice: productPrice,
  // ... autres propriétés
  customizationId: productData?.customizationId,
  designElements: productData?.designElements,
}]

// Paiement à la livraison
orderItems: [{
  // ... même structure
  customizationId: productData?.customizationId,
  designElements: productData?.designElements,
}]
```

## 🎯 Cas d'usage

### Scénario 1 : Client connecté avec personnalisation
1. Client se connecte
2. Personnalise un produit → `customizationId: 123`
3. Ajoute au panier avec `customizationId`
4. Commande → `orderItems[].customizationId: 123`
5. Backend lie automatiquement la commande à la personnalisation

### Scénario 2 : Client invité avec personnalisation
1. Client invité arrive → `sessionId: guest-123`
2. Personnalise → `customizationId: 456` + `sessionId`
3. Ajoute au panier → `customizationId: 456`
4. Commande → `orderItems[].customizationId: 456`
5. Backend associe commande à personnalisation invité

### Scénario 3 : Commande sans personnalisation (compatibilité)
1. Client ajoute produit standard au panier
2. Pas de `customizationId` dans le cartItem
3. Commande → `orderItems` sans `customizationId`
4. Flux normal de commande préservé

## 🔍 Logs de Debug

### OrderFormPage.tsx
```typescript
console.log('🎨 [OrderForm] Personnalisation détectée:', {
  hasCustomization: !!productData?.customizationId,
  hasDesignElements: !!(productData?.designElements?.length > 0),
  customizationId: productData?.customizationId,
  designElementsCount: productData?.designElements?.length,
  orderItemCustomizationId: orderRequest.orderItems[0]?.customizationId
});
```

### CartContext.tsx
```typescript
console.log('📥 [CartContext] Chargement panier:', {
  itemsWithCustomization: parsedCart.filter(i => i.customizationId).length,
  itemsWithElements: parsedCart.filter(i => i.designElements?.length > 0).length
});
```

### OrderService.ts
```typescript
console.log('🎨 [OrderService] OrderItem construit:', orderItem);
// Affiche toutes les données y compris customizationId et designElements
```

## ✅ Validation et Tests

### Tests manuels à effectuer :

1. **Personnalisation → Panier → Commande**
   - [ ] Personnaliser un produit
   - [ ] Vérifier `customizationId` dans le panier (localStorage)
   - [ ] Passer commande et vérifier les logs
   - [ ] Vérifier backend reçoit `customizationId`

2. **Client invité**
   - [ ] Se déconnecter
   - [ ] Personnaliser → `sessionId` généré
   - [ ] Commander en tant qu'invité
   - [ ] Vérifier lien commande-personnalisation

3. **Compatibilité**
   - [ ] Ajouter produit standard au panier
   - [ ] Commander sans personnalisation
   - [ ] Vérifier flux normal fonctionne

4. **Paiements**
   - [ ] Tester PayDunya avec personnalisation
   - [ ] Tester paiement à la livraison avec personnalisation
   - [ ] Vérifier données conservées dans les deux cas

## 📊 Performance

### Optimisations :
- **Index composés** : `(userId, productId, status)` sur `customizations`
- **Requêtes préparées** : Éviter l'injection SQL
- **Cache localStorage** : Panier avec personnalisations persistant
- **Lazy loading** : DesignElements chargés à la demande

### Indicateurs à surveiller :
- Temps de réponse `/customizations` < 200ms
- Taille moyenne `designElements` < 10KB
- Ratio commandes avec personnalisation vs standard

## 🚀 Évolutions futures

### V1.1 - Optimisations
- Cache Redis pour personnalisations fréquentes
- Compression designElements
- Prévisualisation temps réel améliorée

### V1.2 - Fonctionnalités
- Partage de personnalisations
- Templates de personnalisation
- Historique personnalisé par client

### V2.0 - Advanced
- IA de suggestion de designs
- Personnalisation 3D
- Collaboration multi-utilisateurs

## 🔧 Dépannage

### Problèmes courants :

**Personnalisation non sauvegardée**
```bash
# Vérifier console pour :
# - CustomizationService.saveCustomization() response
# - localStorage cart item avec customizationId
# - OrderRequest avec customizationId
```

**Commande sans personnalisation**
```bash
# Vérifier :
# - productData.customizationId dans OrderFormPage
# - cartItem.customizationId dans CartContext
# - Backend reçoit bien orderItems[].customizationId
```

**Session invité perdue**
```bash
# Vérifier :
# - localStorage 'guest-session-id' présent
# - CustomizationService.getOrCreateSessionId()
# - Backend sessionId bien transmis
```

---

## 📞 Support

Pour toute question sur l'implémentation :
- **Backend** : Voir documentation API `/api` swagger
- **Frontend** : Voir composants `CustomerProductCustomizationPageV3.tsx`
- **Tests** : Voir logs console et debug des services