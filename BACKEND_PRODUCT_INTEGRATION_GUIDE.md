# Guide d'Intégration Backend pour la Création de Produits

Ce document détaille la structure des données que le backend doit attendre lors de la création ou de la mise à jour d'un produit. Il reflète les dernières modifications du formulaire de création de produit, notamment la gestion des catégories, des tailles, et la structure des zones de personnalisation (délimitations).

## 📋 Endpoints

-   **Création :** `POST /api/products`
-   **Mise à jour :** `PUT /api/products/:id`
-   **Récupération :** `GET /api/products`
-   **Récupération individuelle :** `GET /api/products/:id`
-   **Suppression :** `DELETE /api/products/:id`

Le front-end enverra les données en `multipart/form-data` car des fichiers images sont uploadés. Le corps de la requête contiendra :
1.  Une partie nommée `productData` contenant le payload JSON détaillé ci-dessous.
2.  Une ou plusieurs parties pour chaque fichier image uploadé avec le format `file_<fileId>`.

## 🔧 Structure du Payload JSON (`productData`)

Voici la structure complète de l'objet JSON que le backend recevra :

```json
{
  "name": "string",
  "price": "number",
  "stock": "number", 
  "status": "'published' | 'draft'",
  "description": "string",
  "categories": ["string"], // Nouveau: Gestion multiple des catégories
  "sizes": ["string"], // Nouveau: Tailles disponibles pour le produit
  "colorVariations": [
    {
      "name": "string",
      "colorCode": "string", // Code hexadécimal (ex: "#FF0000")
      "images": [
        {
          "fileId": "string", // Un identifiant unique pour lier à un fichier image
          "view": "'Front' | 'Back' | 'Left' | 'Right' | 'Top' | 'Bottom' | 'Detail'",
          "delimitations": [
            {
              "x": "number", // Coordonnées en pixels réels de l'image
              "y": "number", // Coordonnées en pixels réels de l'image  
              "width": "number", // Dimensions en pixels réels de l'image
              "height": "number", // Dimensions en pixels réels de l'image
              "rotation": "number" // Angle de rotation en degrés (optionnel)
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 📊 Détail des Champs

### 🏷️ Racine de l'objet

-   **`name`** (string, **requis**): Le nom du produit.
-   **`price`** (number, **requis**): Le prix du produit en FCFA. Doit être supérieur à 0.
-   **`stock`** (number, **requis**): La quantité en stock. Doit être >= 0.
-   **`status`** ('published' | 'draft', **requis**): Le statut du produit.
    - `'published'` : Produit visible sur le site
    - `'draft'` : Produit en brouillon, non visible
-   **`description`** (string, **requis**): La description détaillée du produit.
-   **`categories`** (array de strings, **optionnel**): Liste des catégories associées au produit.
    - **Catégories prédéfinies disponibles** : T-shirts, Polos, Sweats, Hoodies, Casquettes, Tote bags, Mugs, Stickers, Cartes de visite, Flyers
    - **Catégories personnalisées** : L'utilisateur peut créer ses propres catégories
    - **Recommandation** : Stocker en base soit comme des références vers une table `categories`, soit comme des strings simples
-   **`sizes`** (array de strings, **optionnel**): Liste des tailles disponibles pour ce produit.
    - **Tailles prédéfinies** : XS, S, M, L, XL, XXL, XXXL
    - **Tailles personnalisées** : L'utilisateur peut créer des tailles spécifiques (ex: "4 ans", "Enfant", "120cm")
    - **Usage** : Utilisé pour la gestion des stocks par taille et l'affichage des options client
-   **`colorVariations`** (array d'objets, **requis**): La liste des variations de couleur du produit. Doit contenir au moins un élément.

### 🎨 Objet `colorVariations`

Chaque objet représente une couleur disponible pour le produit.

-   **`name`** (string, **requis**): Le nom de la couleur (ex: "Bleu Marine", "Rouge Vif").
-   **`colorCode`** (string, **requis**): Le code hexadécimal de la couleur (ex: `"#000080"`).
    - **Format attendu** : `#RRGGBB` (6 caractères hexadécimaux)
    - **Validation recommandée** : Vérifier le format avec regex `/^#[0-9A-Fa-f]{6}$/`
-   **`images`** (array d'objets, **requis**): La liste des images pour cette variation de couleur.

### 🖼️ Objet `images`

Chaque objet représente une image uploadée pour une variation de couleur.

-   **`fileId`** (string, **requis**): Un identifiant unique généré par le front-end (ex: timestamp + index).
    - **Utilisation** : Le backend devra utiliser cet ID pour faire correspondre le fichier image reçu dans la requête `multipart/form-data` avec cet objet de données.
    - **Format des fichiers** : `file_<fileId>` dans la requête multipart
-   **`view`** (string, **requis**): Le nom de la vue associée à cette image. Les valeurs possibles sont :
    -   `'Front'` : Vue de face
    -   `'Back'` : Vue de dos
    -   `'Left'` : Vue côté gauche
    -   `'Right'` : Vue côté droit
    -   `'Top'` : Vue du dessus
    -   `'Bottom'` : Vue du dessous
    -   `'Detail'` : Vue détail/zoom
-   **`delimitations`** (array d'objets, **optionnel**): La liste des zones de personnalisation définies sur cette image.

### 📐 Objet `delimitations`

**⚠️ Information cruciale :** Toutes les coordonnées et dimensions (`x`, `y`, `width`, `height`) sont exprimées en **pixels réels par rapport à l'image source originale en pleine résolution**. Elles ne dépendent pas de la taille d'affichage dans le navigateur.

-   **`x`** (number): La coordonnée X (depuis le bord gauche de l'image) du coin supérieur gauche de la zone.
-   **`y`** (number): La coordonnée Y (depuis le bord haut de l'image) du coin supérieur gauche de la zone.
-   **`width`** (number): La largeur de la zone en pixels.
-   **`height`** (number): La hauteur de la zone en pixels.
-   **`rotation`** (number, **optionnel**): L'angle de rotation de la zone en degrés (0 par défaut).

---

## 📁 Gestion des Fichiers

### 🔄 Structure multipart/form-data

La requête contiendra :

1. **Un champ JSON** : `productData` (contient toutes les métadonnées)
2. **Plusieurs champs fichiers** : `file_<fileId>` (un par image)

### Exemple de structure reçue :
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="productData"

{"name":"T-Shirt Premium"...}
------WebKitFormBoundary...
Content-Disposition: form-data; name="file_1678886400001"; filename="tshirt-blanc-face.jpg"
Content-Type: image/jpeg

[DONNÉES BINAIRES DE L'IMAGE]
------WebKitFormBoundary...
Content-Disposition: form-data; name="file_1678886400002"; filename="tshirt-blanc-dos.jpg"
Content-Type: image/jpeg

[DONNÉES BINAIRES DE L'IMAGE]
------WebKitFormBoundary...
```

### 💾 Recommandations de stockage

1. **Images** : Stocker dans un système de fichiers ou cloud storage (AWS S3, Google Cloud Storage)
2. **Métadonnées** : Stocker en base de données (PostgreSQL, MongoDB, etc.)
3. **Nommage des fichiers** : Utiliser un système de hash ou UUID pour éviter les conflits
4. **Optimisation** : Générer automatiquement des thumbnails et différentes résolutions

---

## 🚀 Exemple de Payload Complet

Voici un exemple concret de ce que le backend recevra pour un t-shirt avec deux couleurs.

### **Partie 1: `productData` (JSON)**
```json
{
  "name": "T-Shirt Premium en Coton Bio",
  "price": 8500,
  "stock": 150,
  "status": "published",
  "description": "Un t-shirt doux et résistant, parfait pour toutes les occasions. Fabriqué en coton bio certifié.",
  "categories": ["T-shirts", "Vêtements éco-responsables"],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [
    {
      "name": "Blanc Éclatant",
      "colorCode": "#FFFFFF",
      "images": [
        {
          "fileId": "1678886400001",
          "view": "Front",
          "delimitations": [
            {
              "x": 250,
              "y": 150,
              "width": 300,
              "height": 400,
              "rotation": 0
            }
          ]
        },
        {
          "fileId": "1678886400002", 
          "view": "Back",
          "delimitations": [
            {
              "x": 280,
              "y": 200,
              "width": 240,
              "height": 300,
              "rotation": 0
            }
          ]
        }
      ]
    },
    {
      "name": "Noir Profond",
      "colorCode": "#000000",
      "images": [
        {
          "fileId": "1678886400003",
          "view": "Front", 
          "delimitations": [
            {
              "x": 255,
              "y": 152,
              "width": 298,
              "height": 405,
              "rotation": 0
            }
          ]
        }
      ]
    }
  ]
}
```

### **Parties fichiers correspondantes :**
- **Nom du champ :** `file_1678886400001`
- **Contenu :** (Données binaires de l'image pour le t-shirt blanc de face)

- **Nom du champ :** `file_1678886400002`
- **Contenu :** (Données binaires de l'image pour le t-shirt blanc de dos)

- **Nom du champ :** `file_1678886400003`
- **Contenu :** (Données binaires de l'image pour le t-shirt noir de face)

---

## 🗄️ Modèle de Base de Données Recommandé

### Table `products`
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL, -- Prix en centimes pour éviter les problèmes de précision
    stock INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `product_categories` 
```sql
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL
);
```

### Table `product_sizes`
```sql
CREATE TABLE product_sizes ([vite] connecting...
client:912 [vite] connected.
react-dom-client.development.js:24868 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
useProductsAPI.ts:45 🔄 [useProductsAPI] Récupération de TOUS les produits...
useDeletedProducts.ts:45 🔄 [useDeletedProducts] Récupération des produits supprimés...
useProductsAPI.ts:45 🔄 [useProductsAPI] Récupération de TOUS les produits...
useDeletedProducts.ts:45 🔄 [useDeletedProducts] Récupération des produits supprimés...
scheduler.development.js:14 [Violation] 'message' handler took 453ms
2useDeletedProducts.ts:48 ✅ [useDeletedProducts] 0 produits récupérés.
productService.ts:181 ✅ Produits récupérés via API officielle: (3) [{…}, {…}, {…}]0: {id: 6, name: 'deze', price: 12, stock: 12, status: 'DRAFT', …}1: {id: 5, name: 'Tshirt', price: 12000, stock: 12, status: 'PUBLISHED', …}2: {id: 4, name: 'ProjetBoutique', price: 12000, stock: 12, status: 'PUBLISHED', …}length: 3[[Prototype]]: Array(0)
useProductsAPI.ts:48 ✅ [useProductsAPI] 3 produits récupérés.
react-dom-client.development.js:3860  Uncaught Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
    at getRootForUpdatedFiber (react-dom-client.development.js:3860:11)
    at enqueueConcurrentHookUpdate (react-dom-client.development.js:3820:14)
    at dispatchSetStateInternal (react-dom-client.development.js:6966:18)
    at dispatchSetState (react-dom-client.development.js:6927:7)
    at setRef (compose-refs.tsx:11:12)
    at compose-refs.tsx:25:23
    at Array.map (<anonymous>)
    at compose-refs.tsx:24:27
    at setRef (compose-refs.tsx:11:12)
    at compose-refs.tsx:25:23
getRootForUpdatedFiber @ react-dom-client.development.js:3860
enqueueConcurrentHookUpdate @ react-dom-client.development.js:3820
dispatchSetStateInternal @ react-dom-client.development.js:6966
dispatchSetState @ react-dom-client.development.js:6927
setRef @ compose-refs.tsx:11
(anonymous) @ compose-refs.tsx:25
(anonymous) @ compose-refs.tsx:24
setRef @ compose-refs.tsx:11
(anonymous) @ compose-refs.tsx:25
(anonymous) @ compose-refs.tsx:24
runWithFiberInDEV @ react-dom-client.development.js:1519
safelyDetachRef @ react-dom-client.development.js:12220
commitMutationEffectsOnFiber @ react-dom-client.development.js:13352
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13347
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13134
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13562
recursivelyTraverseMutationEffects @ react-dom-client.development.js:13123
commitMutationEffectsOnFiber @ react-dom-client.development.js:13405
flushMutationEffects @ react-dom-client.development.js:15426
commitRoot @ react-dom-client.development.js:15401
commitRootWhenReady @ react-dom-client.development.js:14652
performWorkOnRoot @ react-dom-client.development.js:14575
performSyncWorkOnRoot @ react-dom-client.development.js:16231
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
flushSpawnedWork @ react-dom-client.development.js:15677
commitRoot @ react-dom-client.development.js:15403
commitRootWhenReady @ react-dom-client.development.js:14652
performWorkOnRoot @ react-dom-client.development.js:14575
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
react-dom-client.development.js:8283  An error occurred in the <button> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.

defaultOnUncaughtError @ react-dom-client.development.js:8283
logUncaughtError @ react-dom-client.development.js:8352
runWithFiberInDEV @ react-dom-client.development.js:1519
lane.callback @ react-dom-client.development.js:8382
callCallback @ react-dom-client.development.js:5363
commitCallbacks @ react-dom-client.development.js:5383
runWithFiberInDEV @ react-dom-client.development.js:1522
commitLayoutEffectOnFiber @ react-dom-client.development.js:12709
flushLayoutEffects @ react-dom-client.development.js:15559
commitRoot @ react-dom-client.development.js:15402
commitRootWhenReady @ react-dom-client.development.js:14652
performWorkOnRoot @ react-dom-client.development.js:14575
performSyncWorkOnRoot @ react-dom-client.development.js:16231
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
flushSpawnedWork @ react-dom-client.development.js:15677
commitRoot @ react-dom-client.development.js:15403
commitRootWhenReady @ react-dom-client.development.js:14652
performWorkOnRoot @ react-dom-client.development.js:14575
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
scheduler.development.js:14 [Violation] 'message' handler took 9569ms
[NEW] Explain Console errors by using Copilot in Edge: click
         
         to explain an error. 
        Learn more
        Don't show again
productService.ts:181 ✅ Produits récupérés via API officielle: (3) [{…}, {…}, {…}]0: {id: 6, name: 'deze', price: 12, stock: 12, status: 'DRAFT', …}1: {id: 5, name: 'Tshirt', price: 12000, stock: 12, status: 'PUBLISHED', …}2: {id: 4, name: 'ProjetBoutique', price: 12000, stock: 12, status: 'PUBLISHED', …}length: 3[[Prototype]]: Array(0)
useProductsAPI.ts:48 ✅ [useProductsAPI] 3 produits récupérés.
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    size_name VARCHAR(50) NOT NULL
);
```

### Table `product_color_variations`
```sql
CREATE TABLE product_color_variations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color_code VARCHAR(7) NOT NULL -- Format #RRGGBB
);
```

### Table `product_images`
```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    color_variation_id INTEGER REFERENCES product_color_variations(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    view_type VARCHAR(20) NOT NULL,
    original_filename VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100)
);
```

### Table `product_delimitations`
```sql
CREATE TABLE product_delimitations (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES product_images(id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    rotation DECIMAL(5,2) DEFAULT 0
);
```

---

## 🔒 Validation Backend Recommandée

### Validation des données générales
```javascript
const validateProductData = (data) => {
  const errors = [];
  
  // Validation du nom
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Le nom du produit doit faire au moins 2 caractères');
  }
  
  // Validation du prix
  if (!data.price || data.price <= 0) {
    errors.push('Le prix doit être supérieur à 0');
  }
  
  // Validation du stock
  if (data.stock < 0) {
    errors.push('Le stock ne peut pas être négatif');
  }
  
  // Validation du statut
  if (!['published', 'draft'].includes(data.status)) {
    errors.push('Le statut doit être "published" ou "draft"');
  }
  
  // Validation des variations de couleur
  if (!data.colorVariations || data.colorVariations.length === 0) {
    errors.push('Au moins une variation de couleur est requise');
  }
  
  return errors;
};
```

### Validation des couleurs
```javascript
const validateColorCode = (colorCode) => {
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  return colorRegex.test(colorCode);
};
```

### Validation des fichiers
```javascript
const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.';
  }
  
  if (file.size > maxSize) {
    return 'Le fichier est trop volumineux (max 10MB).';
  }
  
  return null;
};
```

---

## 🧪 Exemple d'Implémentation (Node.js/Express)

```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/products', upload.any(), async (req, res) => {
  try {
    // 1. Parser les données JSON
    const productData = JSON.parse(req.body.productData);
    
    // 2. Valider les données
    const validationErrors = validateProductData(productData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }
    
    // 3. Traiter les fichiers uploadés
    const fileMap = {};
    req.files.forEach(file => {
      const fileId = file.fieldname.replace('file_', '');
      fileMap[fileId] = file;
    });
    
    // 4. Créer le produit en base
    const product = await createProduct(productData);
    
    // 5. Traiter les variations de couleur et images
    for (const colorVariation of productData.colorVariations) {
      const color = await createColorVariation(product.id, colorVariation);
      
      for (const imageData of colorVariation.images) {
        const file = fileMap[imageData.fileId];
        if (!file) {
          throw new Error(`Fichier manquant pour fileId: ${imageData.fileId}`);
        }
        
        // Sauvegarder le fichier et créer l'enregistrement image
        const savedImagePath = await saveImageFile(file);
        const image = await createProductImage(color.id, {
          ...imageData,
          filePath: savedImagePath
        });
        
        // Créer les délimitations
        for (const delimitation of imageData.delimitations) {
          await createDelimitation(image.id, delimitation);
        }
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Produit créé avec succès',
      productId: product.id 
    });
    
  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});
```

---

## 📈 API Responses

### Réponse de succès (201 Created)
```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "data": {
    "id": 123,
    "name": "T-Shirt Premium en Coton Bio",
    "status": "published",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Réponse d'erreur de validation (400 Bad Request)
```json
{
  "success": false,
  "message": "Erreurs de validation",
  "errors": [
    "Le nom du produit doit faire au moins 2 caractères",
    "Au moins une variation de couleur est requise"
  ]
}
```

### Réponse d'erreur serveur (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Erreur interne du serveur",
  "error": "Database connection failed"
}
```

---

## 🔄 Récupération des Produits

### GET /api/products
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "T-Shirt Premium",
      "price": 8500,
      "stock": 150,
      "status": "published",
      "categories": ["T-shirts"],
      "sizes": ["S", "M", "L", "XL"],
      "colorVariations": [
        {
          "id": 456,
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "images": [
            {
              "id": 789,
              "url": "/uploads/tshirt-blanc-face.jpg",
              "view": "Front",
              "delimitations": [...]
            }
          ]
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## 🚀 Résumé des Changements

### ✅ Nouvelles fonctionnalités ajoutées :
1. **Gestion multiple des catégories** avec support des catégories personnalisées
2. **Système de tailles** pour vêtements avec support des tailles personnalisées  
3. **Structure d'image simplifiée** (une vue par image au lieu de multiples vues)
4. **Payload multipart** optimisé pour les uploads de fichiers
5. **Coordonnées précises** des délimitations en pixels réels

### 🔧 Recommandations d'implémentation :
1. **Validation stricte** des données côté backend
2. **Gestion des erreurs** avec messages explicites
3. **Optimisation des images** (thumbnails, compression)
4. **Pagination** pour les listes de produits
5. **Indexation** des champs de recherche (nom, catégories)

L'API est maintenant prête pour une intégration complète avec le frontend modernisé ! 🎉 