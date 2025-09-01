# 🎯 Guide Prompt - Backend Filtrage Produits Mockup

## 📋 **Contexte**

Dans `/sell-design`, quand un vendeur uploade un design, nous voulons afficher uniquement :
- Produits avec `isReadyProduct: false` 
- ET qui ont des délimitations

## 🔍 **Problème actuel**

Les logs montrent que tous les produits ont :
- `isReadyProduct: undefined`
- `delimitations: undefined`

Cela signifie que ces champs ne sont pas définis dans la base de données.

## 🎯 **Demande au Backend**

### **1. Explication de la structure actuelle**

Pouvez-vous m'expliquer :

1. **Structure de la table `products`** :
   - Quels champs existent actuellement ?
   - Y a-t-il des champs pour `isReadyProduct` et `delimitations` ?
   - Comment sont stockées les délimitations ?

2. **API `/products`** :
   - Quel endpoint est utilisé ?
   - Quels paramètres de filtrage sont disponibles ?
   - Comment les produits sont-ils retournés ?

### **2. Implémentation du filtrage**

Comment implémenter le filtrage côté serveur pour :

```javascript
// Endpoint souhaité
GET /api/products?isReadyProduct=false&hasDelimitations=true&forVendorDesign=true
```

### **3. Structure de données**

Quelle devrait être la structure des données :

```sql
-- Exemple de structure souhaitée
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  isReadyProduct BOOLEAN DEFAULT false,
  delimitations JSON,
  status VARCHAR(50),
  -- autres champs...
);
```

### **4. Logique de filtrage**

Comment implémenter la logique :

```javascript
// Logique souhaitée
const filteredProducts = products.filter(product => {
  // 1. isReadyProduct === false
  const isNotReady = product.isReadyProduct === false;
  
  // 2. delimitations existe et n'est pas vide
  const hasDelimitations = product.delimitations && 
                          Array.isArray(product.delimitations) && 
                          product.delimitations.length > 0;
  
  return isNotReady && hasDelimitations;
});
```

## 🔧 **Questions spécifiques**

1. **Migration de base de données** :
   - Comment ajouter les champs `isReadyProduct` et `delimitations` ?
   - Quelles sont les valeurs par défaut ?

2. **API Endpoint** :
   - Comment modifier l'endpoint `/products` pour supporter le filtrage ?
   - Quels paramètres de requête ajouter ?

3. **Validation des données** :
   - Comment valider que les délimitations sont correctes ?
   - Comment gérer les produits existants sans ces champs ?

4. **Performance** :
   - Comment optimiser les requêtes avec ces filtres ?
   - Quels index ajouter ?

## 📊 **Exemples de données**

### **Produit Mockup (AFFICHÉ)**
```json
{
  "id": 1,
  "name": "T-shirt Classique",
  "isReadyProduct": false,
  "delimitations": [
    {"x": 0.1, "y": 0.1, "width": 0.8, "height": 0.8}
  ],
  "status": "PUBLISHED"
}
```

### **Produit Prêt (NON AFFICHÉ)**
```json
{
  "id": 2,
  "name": "T-shirt Prêt",
  "isReadyProduct": true,
  "delimitations": [],
  "status": "PUBLISHED"
}
```

### **Mockup sans délimitations (NON AFFICHÉ)**
```json
{
  "id": 3,
  "name": "Mockup Sans Delim",
  "isReadyProduct": false,
  "delimitations": [],
  "status": "PUBLISHED"
}
```

## 🚀 **Résultat attendu**

Après implémentation, l'API devrait :

1. **Retourner uniquement les produits appropriés** :
   ```javascript
   GET /api/products?isReadyProduct=false&hasDelimitations=true
   // Retourne seulement les produits avec isReadyProduct=false ET des délimitations
   ```

2. **Filtrer automatiquement** :
   - ❌ Produits avec `isReadyProduct: true`
   - ❌ Produits sans délimitations
   - ✅ Produits avec `isReadyProduct: false` ET des délimitations

3. **Gérer les cas par défaut** :
   - Si `isReadyProduct` n'est pas défini → considérer comme `false`
   - Si `delimitations` n'est pas défini → considérer comme ayant des délimitations

## 🔍 **Debug et Monitoring**

Ajouter des logs pour diagnostiquer :

```javascript
console.log('🔍 Filtrage backend:');
console.log('- isReadyProduct:', isReadyProduct);
console.log('- hasDelimitations:', hasDelimitations);
console.log('- Produits filtrés:', filteredProducts.length);
```

## 📝 **Questions pour le Backend**

1. **Structure actuelle** : Pouvez-vous m'expliquer la structure actuelle de la table `products` ?

2. **Migration** : Comment ajouter les champs `isReadyProduct` et `delimitations` ?

3. **API** : Comment modifier l'endpoint `/products` pour supporter le filtrage ?

4. **Validation** : Comment valider les délimitations côté serveur ?

5. **Performance** : Quels index ajouter pour optimiser les requêtes ?

6. **Cas par défaut** : Comment gérer les produits existants sans ces champs ?

Merci de m'expliquer comment implémenter cette logique côté backend ! 