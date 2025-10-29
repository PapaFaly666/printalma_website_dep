# 🧪 Guide de Test - Création de Commande

## 🎯 Objectif
Tester que les corrections du bug `productId: 0` fonctionnent correctement et que les commandes se créent sans erreur de contrainte de clé étrangère.

## ✅ Pré-requis

1. Backend en cours d'exécution sur `http://localhost:3004`
2. Base de données avec des produits valides (IDs: 1, 2, 3, etc.)
3. Frontend démarré (`npm run dev`)

## 🧪 Scénarios de Test

### Test 1: Création de Commande Normale (ID Valide)

**Objectif**: Vérifier qu'une commande avec un productId valide se crée correctement.

**Étapes**:
1. Ouvrir l'application frontend
2. Ajouter un produit au panier (ex: T-Shirt avec ID=1)
3. Aller sur la page de commande (`/order-form`)
4. Remplir tous les champs du formulaire:
   - Prénom: Awa
   - Nom: Ndiaye
   - Email: awa@example.com
   - Téléphone: 77 123 45 67
   - Adresse: 123 Avenue Bourguiba (max 200 caractères)
   - Ville: Dakar (max 100 caractères)
   - Code postal: 12345
   - Pays: Sénégal (max 100 caractères)
5. Sélectionner une méthode de paiement (ex: PayTech)
6. Cliquer sur "Confirmer la commande"

**Résultat Attendu**:
- ✅ Commande créée avec succès
- ✅ Pas d'erreur de contrainte de clé étrangère
- ✅ Redirection vers la page de paiement PayTech (si paiement en ligne)
- ✅ Dans les logs frontend: `✅ [OrderForm] Commande créée avec succès`

**Résultat à Éviter**:
- ❌ Erreur: `Foreign key constraint violated on the constraint: OrderItem_productId_fkey`
- ❌ Erreur: `Invalid productId`

### Test 2: Validation ProductId Invalide (Scénario d'Erreur)

**Objectif**: Vérifier que la validation empêche l'envoi de productId invalides.

**Étapes**:
1. Ouvrir la console développeur du navigateur
2. Simuler un panier avec un productId invalide:
```javascript
// Dans la console
localStorage.setItem('cart', JSON.stringify([{
  id: 0,  // ❌ ID invalide
  name: "Test Product",
  price: 5000,
  quantity: 1
}]));
```
3. Rafraîchir la page
4. Aller sur `/order-form`
5. Remplir le formulaire
6. Cliquer sur "Confirmer"

**Résultat Attendu**:
- ✅ Erreur affichée: `Invalid productId: 0. Must be greater than 0`
- ✅ La requête n'est PAS envoyée au backend
- ✅ L'utilisateur voit un message d'erreur clair

### Test 3: Panier Vide

**Objectif**: Vérifier le comportement avec un panier vide.

**Étapes**:
1. Vider le panier
2. Essayer d'accéder à `/order-form` directement

**Résultat Attendu**:
- ✅ Redirection vers la page d'accueil ou affichage d'un message "Panier vide"
- ✅ Pas d'erreur JavaScript

### Test 4: Création Multiple de Commandes

**Objectif**: Tester plusieurs commandes successives.

**Étapes**:
1. Créer une commande avec un produit (ID=1)
2. Attendre la confirmation
3. Ajouter un autre produit au panier (ID=2)
4. Créer une nouvelle commande

**Résultat Attendu**:
- ✅ Chaque commande est créée indépendamment
- ✅ Aucune erreur de contrainte
- ✅ Les numéros de commande sont uniques

### Test 5: Guest Checkout (Sans Authentification)

**Objectif**: Vérifier la création de commande sans compte utilisateur.

**Étapes**:
1. Se déconnecter (si connecté)
2. Ajouter un produit au panier
3. Créer une commande

**Résultat Attendu**:
- ✅ Commande créée via l'endpoint `/orders/guest`
- ✅ Pas besoin de token d'authentification
- ✅ La commande est enregistrée avec les informations fournies

## 🔍 Vérifications Backend

### Logs à Surveiller

**Logs de succès**:
```bash
🛒 [OrderService] Création de commande avec paiement: { orderData }
✅ [OrderService] Commande créée avec succès: { result }
```

**Logs d'erreur à éviter**:
```bash
❌ [OrderService] Erreur lors de la création de commande: Foreign key constraint violated
❌ Invalid productId: 0
```

### Vérification en Base de Données

Après chaque test réussi, vérifier dans la BDD:

```sql
-- Vérifier la dernière commande créée
SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 1;

-- Vérifier les items de la commande
SELECT * FROM "OrderItem" WHERE "orderId" = <lastOrderId>;

-- Vérifier que le productId existe
SELECT * FROM "Product" WHERE id IN (
  SELECT "productId" FROM "OrderItem" WHERE "orderId" = <lastOrderId>
);
```

## 📊 Résultats des Tests

| Test | Description | Statut | Notes |
|------|-------------|--------|-------|
| 1 | Création normale | ⏳ À tester | ID valide (1, 2, 3) |
| 2 | Validation productId | ⏳ À tester | Doit rejeter ID=0 |
| 3 | Panier vide | ⏳ À tester | Redirection attendue |
| 4 | Multiple commandes | ⏳ À tester | Indépendance des commandes |
| 5 | Guest checkout | ⏳ À tester | Sans authentification |

## 🐛 Problèmes Connus Résolus

### ✅ Problème 1: `productId: 0`
- **Avant**: `productId: Number(cartItem.id) || 0`
- **Après**: Validation stricte avec exception si ID <= 0
- **Statut**: ✅ Corrigé

### ✅ Problème 2: Champs d'adresse trop longs
- **Avant**: Pas de limite
- **Après**:
  - `street`: max 200 caractères
  - `city`: max 100 caractères
  - `country`: max 100 caractères
- **Statut**: ✅ Corrigé

### ✅ Problème 3: Noms de champs incorrects
- **Avant**: `shippingName`, `shippingStreet`, etc.
- **Après**: `name`, `street`, `city`, etc.
- **Statut**: ✅ Corrigé

## 🚀 Commandes Utiles

### Démarrer le Frontend
```bash
npm run dev
```

### Voir les Logs en Temps Réel
```bash
# Frontend (dans la console du navigateur)
# Filtrer par: "OrderForm" ou "OrderService"

# Backend (dans le terminal du serveur)
# Chercher: [OrderService] ou [OrderController]
```

### Réinitialiser le Panier
```javascript
// Dans la console du navigateur
localStorage.removeItem('cart');
window.location.reload();
```

### Inspecter le Panier Actuel
```javascript
// Dans la console du navigateur
console.log(JSON.parse(localStorage.getItem('cart') || '[]'));
```

## 📞 En Cas de Problème

Si vous rencontrez encore l'erreur de contrainte:

1. **Vérifier le productId dans le panier**:
```javascript
const cart = JSON.parse(localStorage.getItem('cart') || '[]');
console.log('ProductIds in cart:', cart.map(item => item.id));
```

2. **Vérifier que le produit existe en BDD**:
```bash
curl http://localhost:3004/products/<productId>
```

3. **Vérifier les logs de validation**:
   - Ouvrir la console du navigateur
   - Chercher les logs avec `[OrderForm]` ou `[OrderService]`
   - Vérifier que la validation `productId > 0` est exécutée

4. **Forcer un productId valide**:
```javascript
// Nettoyer et recréer le panier avec un ID valide
localStorage.setItem('cart', JSON.stringify([{
  id: 1,  // ✅ ID valide
  name: "T-Shirt Paytech Test 1",
  price: 500000,  // Prix en centimes
  quantity: 1,
  size: "L",
  color: "Noir"
}]));
window.location.reload();
```

---

**Date**: 29/10/2025
**Version**: 1.0
**Status**: Prêt pour les tests
