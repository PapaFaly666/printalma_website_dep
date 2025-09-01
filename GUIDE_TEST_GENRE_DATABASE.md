# 🔍 Guide de Test - Problème Genre = UNISEXE dans la Base de Données

## 🚨 Problème Identifié

Le champ `genre` est toujours mis à `UNISEXE` par défaut dans la base de données, même quand l'utilisateur sélectionne un autre genre.

## 🔧 Test de Diagnostic Étape par Étape

### **Étape 1: Test de l'Interface Utilisateur**

1. **Aller sur `/admin/add-product`**
2. **Remplir les informations de base :**
   - Nom: "Test Genre Homme"
   - Description: "Test du genre Homme"
   - Prix: 1000
3. **Sélectionner "Homme" dans le dropdown genre**
4. **Vérifier que "Homme" est bien sélectionné**
5. **Continuer vers l'étape Couleurs**
6. **Ajouter une couleur et une image**
7. **Continuer vers l'étape Catégories**
8. **Sélectionner au moins une catégorie**
9. **Aller à l'étape Validation**
10. **Vérifier que le badge affiche "Homme" (badge bleu)**

**Résultat attendu :** Le badge doit afficher "Homme" avec un fond bleu.

### **Étape 2: Test des Logs Frontend**

1. **Ouvrir la console du navigateur** (F12)
2. **Sélectionner "Homme" dans le dropdown**
3. **Vérifier les logs dans la console**

**Logs attendus :**
```javascript
🔄 updateFormData: genre = HOMME
```

**Si ce log n'apparaît pas :** Le problème vient du dropdown genre.

### **Étape 3: Test de Création du Produit**

1. **Créer le produit avec genre "Homme"**
2. **Vérifier les logs dans la console**

**Logs attendus :**
```javascript
🔍 Données envoyées au backend: {
  name: "Test Genre Homme",
  description: "Test du genre Homme",
  price: 1000,
  stock: 0,
  status: "published",
  categories: ["Vêtements > T-shirts"],
  sizes: ["S", "M", "L"],
  isReadyProduct: true,
  genre: "HOMME", // ← CE CHAMP DOIT ÊTRE PRÉSENT
  colorVariations: [...]
}
🔍 Genre: HOMME
🔍 formData.genre: HOMME
🔍 Genre sélectionné par l'utilisateur: HOMME
🔍 Genre qui sera envoyé: HOMME
🔍 Vérification - genre est-il défini? true
🔍 Vérification - genre est-il différent de UNISEXE? true
```

### **Étape 4: Test des Logs Backend**

1. **Vérifier les logs du backend** après création du produit
2. **Chercher les logs de réception des données**

**Logs backend attendus :**
```javascript
🔍 [DEBUG] Données reçues: {
  "name": "Test Genre Homme",
  "description": "Test du genre Homme",
  "price": 1000,
  "stock": 0,
  "status": "published",
  "categories": ["Vêtements > T-shirts"],
  "sizes": ["S", "M", "L"],
  "genre": "HOMME", // ← CE CHAMP DOIT ÊTRE PRÉSENT
  "colorVariations": [...]
}
```

### **Étape 5: Test de la Base de Données**

1. **Vérifier la base de données** après création du produit
2. **Chercher le produit créé**

**Requête SQL :**
```sql
SELECT id, name, genre FROM products WHERE name = 'Test Genre Homme' ORDER BY id DESC LIMIT 1;
```

**Résultat attendu :**
```sql
id | name              | genre
1  | Test Genre Homme  | HOMME
```

## 🐛 Diagnostic des Problèmes

### **Problème 1: Frontend n'envoie pas le genre**
**Symptôme :** Les logs frontend montrent `genre: "UNISEXE"`
**Cause :** L'utilisateur n'a pas sélectionné de genre ou le dropdown ne fonctionne pas
**Solution :** Vérifier que le dropdown genre fonctionne correctement

### **Problème 2: Backend ne reçoit pas le genre**
**Symptôme :** Les logs backend ne montrent pas le champ `"genre"`
**Cause :** Le champ genre n'est pas inclus dans la requête
**Solution :** Vérifier que le champ genre est bien dans `productDataToSend`

### **Problème 3: Backend reçoit le genre mais l'ignore**
**Symptôme :** Les logs backend montrent `genre: "HOMME"` mais la DB a `"UNISEXE"`
**Cause :** Le backend ne traite pas le champ genre ou a une logique par défaut
**Solution :** Vérifier la logique du backend pour le champ genre

### **Problème 4: Base de données a une contrainte par défaut**
**Symptôme :** Le backend traite correctement mais la DB force `"UNISEXE"`
**Cause :** Contrainte `DEFAULT` dans la base de données
**Solution :** Vérifier le schéma de la base de données

## 🔍 Instructions de Débogage

### **Test Rapide :**

1. **Créer un produit avec genre "Homme"**
2. **Vérifier les logs frontend :**
   - `🔄 updateFormData: genre = HOMME`
   - `🔍 Genre: HOMME`
3. **Vérifier les logs backend :**
   - `"genre": "HOMME"` dans les données reçues
4. **Vérifier la base de données :**
   - `SELECT genre FROM products WHERE name = 'Test Genre Homme'`
5. **Identifier où le genre devient "UNISEXE"**

### **Si le problème vient du Frontend :**
- Vérifier que le composant `ProductFormFields` fonctionne
- Vérifier que `onUpdate` est bien appelé
- Vérifier que `formData.genre` est mis à jour

### **Si le problème vient de l'Envoi :**
- Vérifier que `productDataToSend` inclut le genre
- Vérifier que `formData.genre` a la bonne valeur
- Vérifier que le fallback `|| "UNISEXE"` ne s'active pas

### **Si le problème vient du Backend :**
- Vérifier que le backend traite le champ genre
- Vérifier qu'il n'y a pas de logique qui force `"UNISEXE"`
- Vérifier que le DTO inclut le champ genre

### **Si le problème vient de la Base de Données :**
- Vérifier le schéma Prisma
- Chercher `@default("UNISEXE")` sur le champ genre
- Modifier le schéma si nécessaire

## 📊 Rapport de Test

Après avoir suivi ce guide, rapportez :

1. **Le dropdown genre fonctionne-t-il ?** (Oui/Non)
2. **Les logs frontend montrent-ils le bon genre ?** (Oui/Non)
3. **Les logs backend reçoivent-ils le genre ?** (Oui/Non)
4. **La base de données contient-elle le bon genre ?** (Oui/Non)
5. **Où exactement le genre devient-il "UNISEXE" ?**

Avec ces informations, je pourrai identifier et corriger le problème précis ! 