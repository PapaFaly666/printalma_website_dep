# Guide Complet Backend : Système de Personnalisation

## 📚 Documentation disponible

Ce dossier contient la documentation complète pour implémenter le système de personnalisation de produits côté backend.

### Fichiers de documentation

1. **[BACKEND_CUSTOMIZATION_DATABASE_GUIDE.md](./BACKEND_CUSTOMIZATION_DATABASE_GUIDE.md)**
   - Vue d'ensemble du système
   - Structure complète des données
   - Schéma de base de données
   - Endpoints API détaillés
   - Logique métier
   - Exemples de code Sequelize
   - Flux complet de personnalisation

2. **[BACKEND_CUSTOMIZATION_SQL_EXAMPLES.md](./BACKEND_CUSTOMIZATION_SQL_EXAMPLES.md)**
   - Requêtes SQL prêtes à l'emploi
   - Scripts de création de tables
   - Requêtes d'insertion, mise à jour, suppression
   - Requêtes JSON pour MySQL
   - Statistiques et rapports
   - Procédures stockées
   - Vues SQL utiles
   - Conseils de performance

3. **[BACKEND_CUSTOMIZATION_IMPLEMENTATION.md](./BACKEND_CUSTOMIZATION_IMPLEMENTATION.md)**
   - Implémentation complète des contrôleurs
   - Routes Express.js
   - Middleware d'authentification
   - Validation des données
   - Exemples de tests avec cURL
   - Code prêt à copier-coller

---

## 🚀 Démarrage rapide

### Étape 1 : Créer la base de données

```bash
# Créer la table customizations
mysql -u root -p votre_database < migrations/create-customizations.sql

# Ajouter la colonne à order_items
mysql -u root -p votre_database < migrations/add-customization-to-order-items.sql
```

**Ou avec Sequelize :**

```bash
# Créer la migration
npx sequelize-cli migration:generate --name create-customizations

# Copier le contenu du fichier de migration depuis la documentation

# Exécuter la migration
npx sequelize-cli db:migrate
```

### Étape 2 : Créer le modèle Sequelize

Créer le fichier `models/Customization.js` avec le contenu fourni dans la documentation.

### Étape 3 : Créer le contrôleur

Créer le fichier `controllers/customizationController.js` avec le contenu fourni.

### Étape 4 : Créer les routes

Créer le fichier `routes/customizationRoutes.js` avec le contenu fourni.

### Étape 5 : Ajouter les middleware

Créer les fichiers :
- `middleware/auth.js`
- `middleware/validateCustomization.js`

### Étape 6 : Intégrer dans l'application

Dans votre `app.js` ou `server.js` :

```javascript
const customizationRoutes = require('./routes/customizationRoutes');

app.use('/api/customizations', customizationRoutes);
```

### Étape 7 : Tester

```bash
# Créer une personnalisation
curl -X POST http://localhost:3004/api/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 42,
    "colorVariationId": 5,
    "viewId": 12,
    "designElements": [...],
    "sizeSelections": [...],
    "sessionId": "guest-123-xyz"
  }'
```

---

## 📊 Structure de la base de données

### Table : customizations

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGINT UNSIGNED | ID auto-incrémenté |
| `user_id` | BIGINT UNSIGNED NULL | ID utilisateur (NULL si guest) |
| `session_id` | VARCHAR(255) NULL | ID session pour guests |
| `product_id` | BIGINT UNSIGNED | ID du produit |
| `color_variation_id` | BIGINT UNSIGNED | ID de la variation de couleur |
| `view_id` | BIGINT UNSIGNED | ID de la vue (Front, Back, etc.) |
| `design_elements` | JSON | Éléments de design (texte, images) |
| `size_selections` | JSON NULL | Sélections taille/quantité |
| `preview_image_url` | VARCHAR(500) NULL | URL de l'aperçu |
| `total_price` | DECIMAL(10, 2) | Prix total calculé |
| `status` | ENUM | draft, saved, in_cart, ordered |
| `order_id` | BIGINT UNSIGNED NULL | ID de la commande |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

### Exemple de données

```json
{
  "id": 1,
  "userId": 5,
  "sessionId": null,
  "productId": 42,
  "colorVariationId": 5,
  "viewId": 12,
  "designElements": [
    {
      "id": "element-123",
      "type": "text",
      "x": 0.5,
      "y": 0.3,
      "width": 200,
      "height": 50,
      "rotation": 0,
      "zIndex": 1,
      "text": "Mon texte",
      "fontSize": 32,
      "color": "#FF0000"
    }
  ],
  "sizeSelections": [
    { "size": "M", "quantity": 2 },
    { "size": "L", "quantity": 1 }
  ],
  "totalPrice": 15000.00,
  "status": "ordered",
  "orderId": 123
}
```

---

## 🔌 Endpoints API

### POST `/api/customizations`

Créer une nouvelle personnalisation.

**Body :**
```json
{
  "productId": 42,
  "colorVariationId": 5,
  "viewId": 12,
  "designElements": [...],
  "sizeSelections": [...],
  "sessionId": "guest-123-xyz"
}
```

**Response :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": null,
    "sessionId": "guest-123-xyz",
    "productId": 42,
    "designElements": [...],
    "status": "saved",
    "createdAt": "2025-01-22T10:30:00Z"
  }
}
```

### GET `/api/customizations/:id`

Récupérer une personnalisation par ID.

### GET `/api/customizations/user/me`

Récupérer les personnalisations de l'utilisateur connecté (authentification requise).

### GET `/api/customizations/session/:sessionId`

Récupérer les personnalisations d'une session guest.

### PUT `/api/customizations/:id`

Mettre à jour une personnalisation.

### DELETE `/api/customizations/:id`

Supprimer une personnalisation.

### POST `/api/customizations/migrate-session`

Migrer les personnalisations d'une session vers un utilisateur connecté.

---

## 🔄 Flux complet

### 1. Client personnalise un produit

```
Frontend → localStorage
- Éléments de design sauvegardés localement
- Structure : { "elementsByView": { "colorId-viewId": [...] } }
```

### 2. Client ajoute au panier

```
Frontend → POST /api/customizations → Backend
- Envoi des designElements, sizeSelections, etc.
- Backend crée l'enregistrement
- Backend retourne customizationId
Frontend → localStorage
- Sauvegarde customizationId
```

### 3. Client passe commande

```
Frontend → POST /api/orders → Backend
- Items contiennent customizationId
Backend :
- Crée order
- Crée order_items avec customizationId
- Met à jour customizations (status='ordered', orderId)
```

### 4. Admin/Vendeur consulte la commande

```
Frontend → GET /api/orders/:id → Backend
Backend :
- Récupère order avec order_items
- Inclut customizations avec designElements
- Parse les JSON et retourne tout
Frontend :
- Affiche commande avec aperçu des personnalisations
```

---

## ✅ Checklist d'implémentation

### Base de données

- [ ] Créer la table `customizations`
- [ ] Ajouter la colonne `customization_id` à `order_items`
- [ ] Créer les index nécessaires
- [ ] Ajouter les contraintes de clés étrangères

### Backend

- [ ] Créer le modèle `Customization` (Sequelize)
- [ ] Créer le contrôleur `customizationController.js`
- [ ] Créer les routes `customizationRoutes.js`
- [ ] Créer le middleware `validateCustomization.js`
- [ ] Intégrer dans `app.js`
- [ ] Tester tous les endpoints

### Intégration avec les commandes

- [ ] Modifier le contrôleur de commandes pour gérer `customizationId`
- [ ] Mettre à jour le statut des personnalisations lors de la commande
- [ ] Inclure les personnalisations dans la récupération des commandes
- [ ] Parser les JSON avant de retourner au frontend

### Tests

- [ ] Tester création personnalisation (guest)
- [ ] Tester création personnalisation (utilisateur)
- [ ] Tester récupération personnalisation
- [ ] Tester mise à jour personnalisation
- [ ] Tester suppression personnalisation
- [ ] Tester migration session vers utilisateur
- [ ] Tester création de commande avec personnalisation
- [ ] Tester récupération de commande avec personnalisation

---

## 🐛 Débogage

### Problèmes courants

#### 1. Erreur "designElements must be an array"

**Cause :** Le frontend envoie des données mal formatées.

**Solution :** Vérifier que `designElements` est bien un tableau dans la requête.

```javascript
// ❌ FAUX
{ designElements: { id: "123", ... } }

// ✅ BON
{ designElements: [{ id: "123", ... }] }
```

#### 2. Erreur "Invalid JSON"

**Cause :** Les JSON stockés en base ne sont pas valides.

**Solution :** Toujours utiliser `JSON.stringify()` avant d'insérer et `JSON.parse()` après récupération.

```javascript
// Insertion
designElements: JSON.stringify(designElements)

// Récupération
response.designElements = JSON.parse(response.designElements);
```

#### 3. Personnalisations non liées aux commandes

**Cause :** Le champ `customization_id` n'est pas rempli dans `order_items`.

**Solution :** Vérifier que le frontend envoie bien `customizationId` dans les items de commande.

#### 4. Permissions refusées

**Cause :** L'utilisateur tente de modifier une personnalisation qui ne lui appartient pas.

**Solution :** Le contrôleur vérifie automatiquement les permissions. Assurer que `userId` ou `sessionId` correspond.

---

## 📖 Ressources supplémentaires

- [Documentation Sequelize](https://sequelize.org/)
- [Documentation Express.js](https://expressjs.com/)
- [Documentation MySQL JSON](https://dev.mysql.com/doc/refman/8.0/en/json.html)

---

## 💡 Conseils de performance

1. **Index sur les colonnes fréquemment interrogées**
   - `user_id`, `session_id`, `product_id`, `status`

2. **Pagination des résultats**
   ```javascript
   const { page = 1, limit = 10 } = req.query;
   const offset = (page - 1) * limit;

   const customizations = await Customization.findAll({
     limit: parseInt(limit),
     offset: parseInt(offset)
   });
   ```

3. **Cache avec Redis**
   - Mettre en cache les personnalisations fréquemment consultées

4. **Archivage régulier**
   - Déplacer les anciennes personnalisations commandées vers une table d'archive

5. **Nettoyage des brouillons**
   - Supprimer automatiquement les personnalisations brouillons anciennes

---

## 📞 Support

Pour toute question ou problème :

1. Consulter d'abord les fichiers de documentation
2. Vérifier la structure des données envoyées
3. Consulter les logs backend
4. Tester avec cURL pour isoler le problème

---

## 🎯 Prochaines étapes

Une fois le système de base implémenté :

1. **Génération d'aperçus**
   - Générer des images d'aperçu des personnalisations
   - Stocker dans Cloudinary ou autre CDN

2. **Notifications**
   - Notifier l'utilisateur quand une commande avec personnalisation est validée

3. **Interface admin**
   - Créer une interface pour visualiser les personnalisations
   - Exporter les fichiers de production (PDF, PNG, etc.)

4. **Statistiques**
   - Tableau de bord des personnalisations populaires
   - Analyse des éléments les plus utilisés

---

## ✨ Conclusion

Ce guide complet vous permet d'implémenter un système de personnalisation de produits robuste et évolutif. Tous les fichiers sont prêts à l'emploi et documentés en détail.

**Bon développement ! 🚀**
