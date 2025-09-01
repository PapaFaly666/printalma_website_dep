# 📄 Guide Backend: Gestion Améliorée de l'Adresse de Livraison (shippingAddress)

## 🎯 Objectif

Ce guide a pour but d'aider l'équipe backend à modifier la gestion des adresses de livraison afin que l'API puisse recevoir une chaîne d'adresse formatée du frontend, la stocker de manière exploitable, et la retourner comme un objet structuré dans les réponses des endpoints de commande (ex: `GET /orders`, `GET /orders/:id`).

Actuellement, le frontend envoie une chaîne `shippingAddress` multiligne (séparée par des `\n`) lors de la création de commande, mais l'API retourne cette adresse comme une simple chaîne (ex: "Point E"), ce qui limite les possibilités d'affichage et d'utilisation côté frontend.

## ❓ Pourquoi une Adresse Structurée ?

- **Affichage Flexible Frontend :** Permet d'afficher séparément la rue, la ville, le code postal, etc.
- **Exploitation des Données :** Facilite les filtres, les statistiques par région/ville, l'intégration avec des services de cartographie ou de livraison.
- **Validation :** Permet une validation plus fine de chaque composant de l'adresse si nécessaire.
- **Cohérence :** S'aligne avec les bonnes pratiques de gestion de données d'adresse.

## 🔩 Options pour la Structure de la Base de Données (Exemple avec Prisma)

Idéalement, l'entité `Order` dans votre `schema.prisma` (ou équivalent ORM) devrait avoir des champs distincts pour l'adresse de livraison.

**Option 1: Champs Séparés (Recommandé pour la flexibilité)**

```prisma
// Dans votre schema.prisma
model Order {
  // ... autres champs de commande ...
  id              Int      @id @default(autoincrement())
  orderNumber     String   @unique
  // ...

  // Champs pour l'adresse de livraison structurée
  shippingName         String? // Nom complet sur l'adresse (ex: "Jean Dupont") ou nom de société
  shippingStreet       String? // Rue et numéro, appartement (ex: "123 Rue Principale, Appt 4B")
  shippingCity         String? // Ville (ex: "Dakar")
  shippingRegion       String? // Région/État (ex: "Dakar")
  shippingPostalCode   String? // Code Postal (ex: "12500")
  shippingCountry      String? // Pays (ex: "Sénégal")
  
  // Vous pouvez conserver l'ancien champ si une migration progressive est nécessaire
  // shippingAddress    String?  // L'ancienne chaîne complète, potentiellement à déprécier
  
  phoneNumber     String   // Toujours nécessaire
  // ...
}
```

**Option 2: Champ JSON (Moins idéal pour les requêtes SQL directes, mais possible)**

Si modifier la structure des colonnes est trop complexe immédiatement, vous pourriez utiliser un champ de type `Json`.

```prisma
// Dans votre schema.prisma
model Order {
  // ... autres champs de commande ...
  shippingAddressObject Json?   // Stocke l'adresse comme un objet JSON
  // shippingAddress    String? // L'ancienne chaîne, à déprécier
  phoneNumber         String
  // ...
}
```

Le reste de ce guide se concentrera sur l'Option 1 (champs séparés) car elle est plus robuste.

## 🛠️ Modifications Backend Nécessaires

### 1. Mise à Jour du Schéma et Migration

- Appliquez les modifications à votre `schema.prisma` (ou équivalent).
- Exécutez une migration de base de données (ex: `npx prisma migrate dev --name add_structured_shipping_address`).

### 2. Logique de Création/Mise à Jour de Commande (`POST /orders`, `PUT /orders/:id`)

Le frontend envoie maintenant une chaîne `shippingAddress` dans `CreateOrderRequest` formatée comme suit (exemple) :

```
Jean Dupont
123 Rue Principale, Appt 4B
Rufisque, Dakar, 12500
Sénégal
```

Votre backend (probablement dans le service de création de commande) doit parser cette chaîne pour peupler les nouveaux champs structurés.

**Exemple de Logique de Parsing (Conceptuel en TypeScript/JavaScript) :**

```typescript
async function createOrder(data: CreateOrderRequest) {
  const { shippingAddress, phoneNumber, notes, orderItems } = data;

  // Parsing de la chaîne shippingAddress envoyée par le frontend
  const addressLines = shippingAddress.split('\n').map(line => line.trim()).filter(line => line);
  
  let parsedShippingName = null;
  let parsedShippingStreet = null;
  let parsedShippingCityRegionPostal = [];
  let parsedShippingCity = null;
  let parsedShippingRegion = null;
  let parsedShippingPostalCode = null;
  let parsedShippingCountry = null;

  // Heuristique simple pour parser (à adapter/améliorer selon la robustesse attendue)
  // Ceci est un exemple basique. Une librairie de parsing d'adresse pourrait être envisagée pour des cas complexes.
  if (addressLines.length > 0) parsedShippingName = addressLines[0];
  if (addressLines.length > 1) parsedShippingStreet = addressLines[1];
  
  if (addressLines.length > 2) {
    parsedShippingCityRegionPostal = addressLines[2].split(',').map(p => p.trim()).filter(p => p);
    if (parsedShippingCityRegionPostal.length > 0) parsedShippingCity = parsedShippingCityRegionPostal[0];
    if (parsedShippingCityRegionPostal.length > 1) parsedShippingRegion = parsedShippingCityRegionPostal[1];
    if (parsedShippingCityRegionPostal.length > 2) parsedShippingPostalCode = parsedShippingCityRegionPostal[2];
  }
  
  if (addressLines.length > 3) parsedShippingCountry = addressLines[3];
  // Si moins de lignes, certains champs resteront null, ce qui est acceptable si les champs DB sont optionnels.

  // Création dans la base de données
  const newOrder = await prisma.order.create({
    data: {
      // ... autres données de la commande (orderNumber, userId, totalAmount etc.)
      phoneNumber,
      notes,
      orderItems: { createMany: { data: orderItems } }, // Exemple pour Prisma

      // Nouveaux champs d'adresse peuplés
      shippingName: parsedShippingName,
      shippingStreet: parsedShippingStreet,
      shippingCity: parsedShippingCity,
      shippingRegion: parsedShippingRegion,
      shippingPostalCode: parsedShippingPostalCode,
      shippingCountry: parsedShippingCountry,
      
      // L'ancien champ `shippingAddress` peut être alimenté pour compatibilité ou laissé vide
      // shippingAddress: shippingAddress, // La chaîne originale si besoin
    },
    include: { orderItems: true, user: true } // Inclure les relations nécessaires
  });

  return newOrder;
}
```

**Considérations pour le Parsing :**

*   La robustesse du parsing dépend du format exact envoyé par le frontend. L'exemple ci-dessus est une heuristique simple.
*   Pour une solution plus robuste, surtout si les formats d'adresse peuvent varier grandement, envisagez d'utiliser une bibliothèque de parsing d'adresses ou de demander au frontend d'envoyer un objet `shippingDetails` structuré directement au lieu d'une chaîne à parser.
*   Si le frontend peut envoyer un objet `shippingDetails` (comme il le fait pour `createOrderFromCart` dans `newOrderService.ts` du frontend), le backend pourrait accepter cet objet directement, simplifiant grandement le besoin de parser une chaîne.

### 3. Logique de Récupération de Commande (`GET /orders`, `GET /orders/:id`)

Modifiez les services qui retournent les commandes pour inclure un objet `shippingAddress` structuré.

**Exemple de Transformation de la Donnée (Conceptuel) :**

Si vous avez stocké les champs séparément en base de données :

```typescript
// Dans votre service qui récupère les commandes (ex: findAllOrders)
const ordersFromDb = await prisma.order.findMany({
  // ... vos conditions de recherche et pagination ...
  include: { user: true, orderItems: true } // Inclure les infos utilisateur et items
});

const formattedOrders = ordersFromDb.map(order => {
  const {
    shippingName,
    shippingStreet,
    shippingCity,
    shippingRegion,
    shippingPostalCode,
    shippingCountry,
    // Exclure les champs d'adresse individuels de la racine de l'objet commande si désiré
    ...restOfOrder // Le reste des champs de la commande
  } = order;

  return {
    ...restOfOrder,
    user: order.user ? { // Assurer que seul un sous-ensemble des infos user est exposé
        id: order.user.id,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email
    } : null,
    orderItems: order.orderItems, // S'assurer que les items sont formatés comme attendu
    shippingAddress: { // Nouvel objet structuré
      name: shippingName,
      street: shippingStreet,
      city: shippingCity,
      region: shippingRegion,
      postalCode: shippingPostalCode,
      country: shippingCountry
    }
  };
});

return formattedOrders;
```

**Structure de l'Objet `shippingAddress` à Retourner dans l'API :**

```json
{
  // ... autres champs de la commande ...
  "shippingAddress": {
    "name": "Jean Dupont",
    "street": "123 Rue Principale, Appt 4B",
    "city": "Rufisque",
    "region": "Dakar",
    "postalCode": "12500",
    "country": "Sénégal"
  },
  "phoneNumber": "771234567"
  // ...
}
```

### 4. Mise à Jour des DTOs (Data Transfer Objects)

- Mettez à jour vos DTOs de réponse pour refléter la nouvelle structure avec `shippingAddress` en tant qu'objet.

## ✨ Avantages de l'Approche Recommandée

- **Données Atomiques :** Chaque partie de l'adresse est stockée et accessible individuellement.
- **Requêtage Facilité :** Permet de facilement faire des requêtes en base de données basées sur la ville, le code postal, etc.
- **Clarté :** La structure des données est explicite.

## 🔄 Alternative: Modifier le Contrat d'API pour `POST /orders`

Plutôt que d'envoyer une chaîne `shippingAddress` multiligne du frontend que le backend doit parser, le backend pourrait directement accepter un objet `shippingDetails` structuré dans le payload de `POST /orders`.

Le frontend a déjà cette logique pour construire `shippingDetails` (comme vu dans `newOrderService.ts` -> `createOrderFromCart`).

**Nouvelle `CreateOrderRequest` (Backend) :**

```typescript
interface ShippingDetailsPayload {
  firstName?: string;
  lastName?: string;
  company?: string;
  street?: string;
  apartment?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

interface CreateOrderRequest {
  shippingDetails: ShippingDetailsPayload; // Objet au lieu d'une chaîne
  phoneNumber: string;
  notes?: string;
  orderItems: { /* ... */ }[];
}
```

Si cette approche est adoptée :
1.  Le backend n'a plus besoin de parser une chaîne `shippingAddress`.
2.  Il mappe directement les champs de `shippingDetails` aux colonnes de la base de données.
3.  Le frontend devra être ajusté pour envoyer `shippingDetails` comme un objet dans le payload de `POST /orders` (la méthode `createOrder` dans `newOrderService.ts` du frontend devrait être alignée sur `createOrderFromCart` pour la gestion de `shippingDetails`).

Cette alternative est souvent plus propre car elle évite le parsing de chaînes, qui peut être source d'erreurs.

## 🗓️ Étapes Suggérées

1.  **Discuter** des options de structure de base de données et de contrat d'API.
2.  **Choisir** une approche (champs séparés recommandés, avec potentiellement la modification du contrat d'API pour `POST /orders` pour accepter un objet structuré).
3.  **Mettre à jour** le schéma de la base de données et effectuer la migration.
4.  **Modifier** la logique de création/mise à jour des commandes pour gérer la nouvelle structure d'adresse.
5.  **Modifier** la logique de récupération des commandes pour retourner l'adresse de manière structurée.
6.  **Tester** rigoureusement.

N'hésitez pas si vous avez des questions ou besoin de clarifications supplémentaires. 