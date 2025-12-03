# Guide Backend - Système de Livraison et Transporteurs

Ce document décrit la structure des données de livraison (transporteur, zone, tarifs, délai) à implémenter côté backend pour assurer le suivi complet des informations de livraison depuis la sélection dans ModernOrderFormPage jusqu'à l'affichage dans OrderDetailPage.

## 📋 Vue d'ensemble

Le système de livraison dynamique permet aux clients de :
- Sélectionner un pays de destination (Sénégal ou international)
- Choisir une ville/région de livraison
- Voir les transporteurs disponibles pour leur zone avec tarifs et délais
- Sélectionner leur transporteur préféré

Ces informations doivent être sauvegardées avec la commande et affichées à l'administrateur.

---

## 🗄️ Structure de la Base de Données

### Table: `orders` (Modifications)

Ajouter les champs suivants à la table `orders` :

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50); -- 'city', 'region', 'international'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city_id INTEGER REFERENCES cities(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_region_id INTEGER REFERENCES regions(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_region_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone_id INTEGER REFERENCES international_zones(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone_name VARCHAR(255);

-- Informations du transporteur sélectionné
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transporteur_id INTEGER REFERENCES transporteurs(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transporteur_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transporteur_logo TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transporteur_phone VARCHAR(50);

-- Tarification et délai
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(100); -- Ex: "24-48h", "2-3 jours"
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zone_tarif_id INTEGER REFERENCES zone_tarifs(id);

-- Métadonnées complètes (JSONB pour flexibilité)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_metadata JSONB;
```

### Structure `delivery_metadata` (JSONB)

Ce champ stocke toutes les informations de livraison de manière structurée :

```json
{
  "deliveryType": "city",
  "location": {
    "type": "city",
    "id": 123,
    "name": "Dakar",
    "countryCode": "SN",
    "countryName": "Sénégal"
  },
  "transporteur": {
    "id": 45,
    "name": "DHL Express",
    "logo": "https://example.com/logos/dhl.png",
    "phone": "+221 33 XXX XX XX",
    "email": "contact@dhl.sn",
    "description": "Livraison express internationale"
  },
  "tarif": {
    "id": 789,
    "amount": 5000,
    "currency": "XOF",
    "deliveryTime": "24-48h",
    "description": "Livraison express Dakar"
  },
  "zone": {
    "id": 12,
    "name": "Zone Dakar Centre",
    "type": "city",
    "parentZoneId": null
  },
  "calculatedAt": "2025-01-15T10:30:00Z",
  "availableCarriers": [
    {
      "transporteurId": 45,
      "transporteurName": "DHL Express",
      "tarifAmount": 5000,
      "deliveryTime": "24-48h"
    },
    {
      "transporteurId": 46,
      "transporteurName": "UPS",
      "tarifAmount": 4500,
      "deliveryTime": "48-72h"
    }
  ]
}
```

---

## 📦 Format des Données de Livraison

### 1. Structure `CreateOrderRequest` (Frontend → Backend)

Ajouter les champs suivants à l'interface `CreateOrderRequest` :

```typescript
export interface CreateOrderRequest {
  // ... champs existants (shippingDetails, phoneNumber, email, orderItems, etc.)

  // 🆕 INFORMATIONS DE LIVRAISON
  deliveryInfo?: {
    // Type de livraison
    deliveryType: 'city' | 'region' | 'international';

    // Localisation
    cityId?: number;           // ID de la ville (si deliveryType = 'city')
    cityName?: string;         // Nom de la ville
    regionId?: number;         // ID de la région (si deliveryType = 'region')
    regionName?: string;       // Nom de la région
    zoneId?: number;           // ID de la zone internationale (si deliveryType = 'international')
    zoneName?: string;         // Nom de la zone internationale
    countryCode?: string;      // Code pays (ex: "SN", "FR", "US")
    countryName?: string;      // Nom du pays

    // Transporteur sélectionné
    transporteurId: number;    // ID du transporteur choisi (OBLIGATOIRE)
    transporteurName?: string; // Nom du transporteur (pour affichage)
    transporteurLogo?: string; // URL du logo du transporteur

    // Tarification
    zoneTarifId: number;       // ID du tarif appliqué (OBLIGATOIRE)
    deliveryFee: number;       // Montant des frais de livraison en XOF
    deliveryTime?: string;     // Délai de livraison (ex: "24-48h")

    // Métadonnées complètes (optionnel)
    metadata?: {
      availableCarriers?: any[]; // Liste des transporteurs disponibles lors de la sélection
      selectedAt?: string;        // Timestamp de la sélection
      calculationDetails?: any;   // Détails du calcul de tarif
    };
  };
}
```

### 2. Exemple de Requête Complète

```json
{
  "email": "client@example.com",
  "shippingDetails": {
    "firstName": "Mamadou",
    "lastName": "Diop",
    "street": "123 Avenue Bourguiba",
    "city": "Dakar",
    "region": "Dakar",
    "postalCode": "12000",
    "country": "Sénégal"
  },
  "phoneNumber": "+221 77 XXX XX XX",
  "orderItems": [
    {
      "productId": 123,
      "quantity": 2,
      "unitPrice": 15000,
      "size": "M",
      "color": "Noir"
    }
  ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true,
  "deliveryInfo": {
    "deliveryType": "city",
    "cityId": 1,
    "cityName": "Dakar",
    "countryCode": "SN",
    "countryName": "Sénégal",
    "transporteurId": 5,
    "transporteurName": "DHL Express",
    "transporteurLogo": "https://api.printalma.com/uploads/logos/dhl.png",
    "zoneTarifId": 23,
    "deliveryFee": 3000,
    "deliveryTime": "24-48h",
    "metadata": {
      "availableCarriers": [
        {
          "transporteurId": 5,
          "name": "DHL Express",
          "fee": 3000,
          "time": "24-48h"
        },
        {
          "transporteurId": 6,
          "name": "UPS",
          "fee": 3500,
          "time": "48-72h"
        }
      ],
      "selectedAt": "2025-01-15T10:30:00Z"
    }
  }
}
```

---

## 🔄 Workflow Complet

### Étape 1: Sélection de la Livraison (Frontend)

**Page:** `ModernOrderFormPage.tsx`

Le client sélectionne :
1. Son pays (Sénégal ou autre)
2. Sa ville/région de destination
3. Le système charge automatiquement les transporteurs disponibles
4. Le client choisit son transporteur préféré

```typescript
// États actuels (déjà implémentés)
const [deliveryType, setDeliveryType] = useState<'city' | 'region' | 'international'>('city');
const [selectedCity, setSelectedCity] = useState<City | null>(null);
const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
const [selectedZone, setSelectedZone] = useState<InternationalZone | null>(null);
const [availableCarriers, setAvailableCarriers] = useState<Array<{
  transporteur: Transporteur;
  tarif: ZoneTarif;
}>>([]);
const [selectedCarrier, setSelectedCarrier] = useState<string>('');
const [deliveryFee, setDeliveryFee] = useState<number>(0);
const [deliveryTime, setDeliveryTime] = useState<string>('');

// 🆕 NOUVEAU : Construire deliveryInfo avant l'envoi
const buildDeliveryInfo = () => {
  const selectedCarrierData = availableCarriers.find(
    c => c.transporteur.id.toString() === selectedCarrier
  );

  if (!selectedCarrierData) return null;

  const deliveryInfo: any = {
    deliveryType: deliveryType,
    transporteurId: selectedCarrierData.transporteur.id,
    transporteurName: selectedCarrierData.transporteur.name,
    transporteurLogo: selectedCarrierData.transporteur.logo,
    zoneTarifId: selectedCarrierData.tarif.id,
    deliveryFee: selectedCarrierData.tarif.price,
    deliveryTime: selectedCarrierData.tarif.delaiEstime,
    countryCode: formData.country
  };

  // Ajouter les infos spécifiques selon le type
  if (deliveryType === 'city' && selectedCity) {
    deliveryInfo.cityId = selectedCity.id;
    deliveryInfo.cityName = selectedCity.nom;
    deliveryInfo.countryName = 'Sénégal';
  } else if (deliveryType === 'region' && selectedRegion) {
    deliveryInfo.regionId = selectedRegion.id;
    deliveryInfo.regionName = selectedRegion.nom;
    deliveryInfo.countryName = 'Sénégal';
  } else if (deliveryType === 'international' && selectedZone) {
    deliveryInfo.zoneId = selectedZone.id;
    deliveryInfo.zoneName = selectedZone.nom;
    deliveryInfo.countryName = getCountryByCode(formData.country)?.name || formData.country;
  }

  // Métadonnées
  deliveryInfo.metadata = {
    availableCarriers: availableCarriers.map(ac => ({
      transporteurId: ac.transporteur.id,
      name: ac.transporteur.name,
      fee: ac.tarif.price,
      time: ac.tarif.delaiEstime
    })),
    selectedAt: new Date().toISOString()
  };

  return deliveryInfo;
};
```

### Étape 2: Envoi de la Commande

**Modification dans `handleSubmit`** :

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Valider que le transporteur est sélectionné
  if (!selectedCarrier || deliveryFee === 0) {
    setErrors(prev => ({
      ...prev,
      delivery: 'Veuillez sélectionner un mode de livraison'
    }));
    return;
  }

  try {
    const orderItems = createOrderItems();
    const deliveryInfo = buildDeliveryInfo(); // 🆕 Construire les infos de livraison

    const orderRequest: OrderRequest = {
      email: formData.email,
      shippingDetails: {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        street: formData.address,
        city: formData.city,
        region: formData.city,
        postalCode: formData.postalCode || undefined,
        country: formData.country,
      },
      phoneNumber: formData.phone,
      notes: formData.notes || undefined,
      orderItems: orderItems,
      paymentMethod: 'PAYDUNYA',
      initiatePayment: true,
      deliveryInfo: deliveryInfo // 🆕 AJOUTER LES INFOS DE LIVRAISON
    };

    console.log('📦 [ModernOrderForm] Envoi commande avec livraison:', {
      deliveryType: deliveryInfo?.deliveryType,
      transporteur: deliveryInfo?.transporteurName,
      fee: deliveryInfo?.deliveryFee,
      location: deliveryInfo?.cityName || deliveryInfo?.regionName || deliveryInfo?.zoneName
    });

    const orderResponse = orderService.isUserAuthenticated()
      ? await orderService.createOrderWithPayment(orderRequest)
      : await orderService.createGuestOrder(orderRequest);

    // ... suite du traitement
  } catch (error) {
    // ... gestion d'erreur
  }
};
```

### Étape 3: Réception et Validation Backend

**Endpoint:** `POST /api/orders`

```javascript
// Validation des données de livraison
function validateDeliveryInfo(deliveryInfo) {
  if (!deliveryInfo) {
    return { valid: false, error: 'Informations de livraison manquantes' };
  }

  // Champs obligatoires
  if (!deliveryInfo.transporteurId) {
    return { valid: false, error: 'Transporteur non spécifié' };
  }

  if (!deliveryInfo.zoneTarifId) {
    return { valid: false, error: 'Tarif de livraison non spécifié' };
  }

  if (typeof deliveryInfo.deliveryFee !== 'number' || deliveryInfo.deliveryFee < 0) {
    return { valid: false, error: 'Frais de livraison invalides' };
  }

  // Validation du type de livraison
  const validTypes = ['city', 'region', 'international'];
  if (!validTypes.includes(deliveryInfo.deliveryType)) {
    return { valid: false, error: 'Type de livraison invalide' };
  }

  // Vérifier la cohérence des données selon le type
  if (deliveryInfo.deliveryType === 'city' && !deliveryInfo.cityId) {
    return { valid: false, error: 'ID de ville manquant pour livraison en ville' };
  }

  if (deliveryInfo.deliveryType === 'region' && !deliveryInfo.regionId) {
    return { valid: false, error: 'ID de région manquant pour livraison en région' };
  }

  if (deliveryInfo.deliveryType === 'international' && !deliveryInfo.zoneId) {
    return { valid: false, error: 'ID de zone manquant pour livraison internationale' };
  }

  return { valid: true };
}

// Enrichir les données de livraison avec les informations complètes depuis la BDD
async function enrichDeliveryInfo(deliveryInfo) {
  const enriched = { ...deliveryInfo };

  // Récupérer les infos complètes du transporteur
  const transporteur = await db.query(
    'SELECT * FROM transporteurs WHERE id = ?',
    [deliveryInfo.transporteurId]
  );

  if (transporteur.length > 0) {
    enriched.transporteur = {
      id: transporteur[0].id,
      name: transporteur[0].name,
      logo: transporteur[0].logo,
      phone: transporteur[0].phone,
      email: transporteur[0].email,
      description: transporteur[0].description
    };
  }

  // Récupérer les infos complètes du tarif
  const zoneTarif = await db.query(
    'SELECT * FROM zone_tarifs WHERE id = ?',
    [deliveryInfo.zoneTarifId]
  );

  if (zoneTarif.length > 0) {
    enriched.tarif = {
      id: zoneTarif[0].id,
      amount: zoneTarif[0].price,
      currency: 'XOF',
      deliveryTime: zoneTarif[0].delai_estime,
      description: zoneTarif[0].description
    };
  }

  // Récupérer les infos de la zone
  if (deliveryInfo.deliveryType === 'city' && deliveryInfo.cityId) {
    const city = await db.query('SELECT * FROM cities WHERE id = ?', [deliveryInfo.cityId]);
    if (city.length > 0) {
      enriched.location = {
        type: 'city',
        id: city[0].id,
        name: city[0].nom,
        countryCode: 'SN',
        countryName: 'Sénégal'
      };
    }
  } else if (deliveryInfo.deliveryType === 'region' && deliveryInfo.regionId) {
    const region = await db.query('SELECT * FROM regions WHERE id = ?', [deliveryInfo.regionId]);
    if (region.length > 0) {
      enriched.location = {
        type: 'region',
        id: region[0].id,
        name: region[0].nom,
        countryCode: 'SN',
        countryName: 'Sénégal'
      };
    }
  } else if (deliveryInfo.deliveryType === 'international' && deliveryInfo.zoneId) {
    const zone = await db.query('SELECT * FROM international_zones WHERE id = ?', [deliveryInfo.zoneId]);
    if (zone.length > 0) {
      enriched.location = {
        type: 'international',
        id: zone[0].id,
        name: zone[0].nom,
        countryCode: deliveryInfo.countryCode,
        countryName: deliveryInfo.countryName
      };
    }
  }

  enriched.calculatedAt = new Date().toISOString();

  return enriched;
}
```

### Étape 4: Sauvegarde en Base de Données

```javascript
async function createOrder(orderRequest) {
  // Valider les infos de livraison
  const deliveryValidation = validateDeliveryInfo(orderRequest.deliveryInfo);
  if (!deliveryValidation.valid) {
    throw new Error(`Erreur de livraison: ${deliveryValidation.error}`);
  }

  // Enrichir avec les données complètes
  const enrichedDelivery = await enrichDeliveryInfo(orderRequest.deliveryInfo);

  // Calculer le montant total (produits + livraison)
  const productsTotal = calculateProductsTotal(orderRequest.orderItems);
  const totalAmount = productsTotal + enrichedDelivery.tarif.amount;

  // Créer la commande
  const orderData = {
    user_id: userId || null,
    order_number: generateOrderNumber(),
    total_amount: totalAmount,
    status: 'PENDING',

    // Adresse de livraison
    shipping_address: JSON.stringify(orderRequest.shippingDetails),
    phone_number: orderRequest.phoneNumber,
    notes: orderRequest.notes,

    // 🆕 INFORMATIONS DE LIVRAISON
    delivery_type: enrichedDelivery.deliveryType,
    delivery_city_id: enrichedDelivery.cityId || null,
    delivery_city_name: enrichedDelivery.cityName || null,
    delivery_region_id: enrichedDelivery.regionId || null,
    delivery_region_name: enrichedDelivery.regionName || null,
    delivery_zone_id: enrichedDelivery.zoneId || null,
    delivery_zone_name: enrichedDelivery.zoneName || null,

    // Transporteur
    transporteur_id: enrichedDelivery.transporteurId,
    transporteur_name: enrichedDelivery.transporteurName,
    transporteur_logo: enrichedDelivery.transporteurLogo || null,
    transporteur_phone: enrichedDelivery.transporteur?.phone || null,

    // Tarification
    delivery_fee: enrichedDelivery.deliveryFee,
    delivery_time: enrichedDelivery.deliveryTime || null,
    zone_tarif_id: enrichedDelivery.zoneTarifId,

    // Métadonnées complètes
    delivery_metadata: JSON.stringify(enrichedDelivery),

    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await db.query('INSERT INTO orders SET ?', orderData);
  const orderId = result.insertId;

  // Créer les order_items
  for (const item of orderRequest.orderItems) {
    await createOrderItem(orderId, item);
  }

  return {
    id: orderId,
    orderNumber: orderData.order_number,
    totalAmount: totalAmount,
    deliveryFee: enrichedDelivery.deliveryFee
  };
}
```

### Étape 5: Récupération pour l'Admin

**Endpoint:** `GET /api/admin/orders/:orderId`

```javascript
async function getOrderByIdAdmin(orderId) {
  // Récupérer la commande
  const orders = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (orders.length === 0) {
    throw new Error('Commande introuvable');
  }

  const order = orders[0];

  // Parser les données JSON
  const shippingAddress = order.shipping_address ? JSON.parse(order.shipping_address) : null;
  const deliveryMetadata = order.delivery_metadata ? JSON.parse(order.delivery_metadata) : null;

  // Récupérer les articles
  const orderItems = await getOrderItems(orderId);

  // Récupérer l'utilisateur
  const user = order.user_id ? await getUserById(order.user_id) : null;

  // 🆕 Construire l'objet deliveryInfo pour le frontend
  const deliveryInfo = {
    deliveryType: order.delivery_type,
    location: {
      cityId: order.delivery_city_id,
      cityName: order.delivery_city_name,
      regionId: order.delivery_region_id,
      regionName: order.delivery_region_name,
      zoneId: order.delivery_zone_id,
      zoneName: order.delivery_zone_name
    },
    transporteur: {
      id: order.transporteur_id,
      name: order.transporteur_name,
      logo: order.transporteur_logo,
      phone: order.transporteur_phone
    },
    tarif: {
      id: order.zone_tarif_id,
      amount: order.delivery_fee,
      deliveryTime: order.delivery_time
    },
    metadata: deliveryMetadata
  };

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    totalAmount: order.total_amount,
    deliveryFee: order.delivery_fee,
    user: user,
    shippingAddress: shippingAddress,
    phoneNumber: order.phone_number,
    notes: order.notes,
    orderItems: orderItems,
    deliveryInfo: deliveryInfo, // 🆕 AJOUTER LES INFOS DE LIVRAISON
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
}
```

### Étape 6: Affichage dans OrderDetailPage

**Page:** `OrderDetailPage.tsx`

```tsx
// Dans le composant OrderDetailPage
const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  // ... chargement de la commande

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* ... */}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <section className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-gray-200">
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total</div>
                <div className="text-2xl font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</div>
              </div>
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</div>
                <div className="text-base font-medium text-gray-900 truncate">{order.user.firstName} {order.user.lastName}</div>
              </div>
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Livraison</div>
                <div className="text-base font-medium text-gray-900 truncate">
                  {order.deliveryInfo?.location?.cityName ||
                   order.deliveryInfo?.location?.regionName ||
                   order.deliveryInfo?.location?.zoneName ||
                   'Non définie'}
                </div>
              </div>
              {/* 🆕 NOUVEAU: Transporteur */}
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Transporteur</div>
                <div className="flex items-center gap-2">
                  {order.deliveryInfo?.transporteur?.logo && (
                    <img
                      src={order.deliveryInfo.transporteur.logo}
                      alt={order.deliveryInfo.transporteur.name}
                      className="h-6 w-auto object-contain"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {order.deliveryInfo?.transporteur?.name || 'N/A'}
                  </span>
                </div>
              </div>
              {/* 🆕 NOUVEAU: Frais de livraison */}
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Frais de livraison</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatCurrency(order.deliveryFee || 0)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Articles */}
          {/* ... */}

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Customer Card */}
            {/* ... */}

            {/* Shipping Address */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Adresse de livraison</h3>
              {order.shippingAddress ? (
                <div className="text-sm text-gray-600 space-y-1.5">
                  {order.shippingAddress.name && (
                    <div className="font-medium text-gray-900">{order.shippingAddress.name}</div>
                  )}
                  <div>{order.shippingAddress.street}</div>
                  {order.shippingAddress.apartment && <div>{order.shippingAddress.apartment}</div>}
                  <div>{order.shippingAddress.city}, {order.shippingAddress.region}</div>
                  {order.shippingAddress.postalCode && <div>{order.shippingAddress.postalCode}</div>}
                  <div className="font-medium text-gray-900 pt-1">{order.shippingAddress.country}</div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aucune adresse</p>
              )}
            </div>

            {/* 🆕 NOUVEAU: Delivery Information Card */}
            {order.deliveryInfo && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Informations de livraison
                </h3>

                <div className="space-y-4">
                  {/* Transporteur */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Transporteur
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {order.deliveryInfo.transporteur?.logo && (
                        <img
                          src={order.deliveryInfo.transporteur.logo}
                          alt={order.deliveryInfo.transporteur.name}
                          className="h-10 w-auto object-contain"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {order.deliveryInfo.transporteur?.name || 'N/A'}
                        </div>
                        {order.deliveryInfo.transporteur?.phone && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            📞 {order.deliveryInfo.transporteur.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Zone de livraison */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Zone de livraison
                    </div>
                    <div className="text-sm text-gray-900">
                      {order.deliveryInfo.deliveryType === 'city' && order.deliveryInfo.location?.cityName && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            Ville
                          </span>
                          <span>{order.deliveryInfo.location.cityName}</span>
                        </div>
                      )}
                      {order.deliveryInfo.deliveryType === 'region' && order.deliveryInfo.location?.regionName && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Région
                          </span>
                          <span>{order.deliveryInfo.location.regionName}</span>
                        </div>
                      )}
                      {order.deliveryInfo.deliveryType === 'international' && order.deliveryInfo.location?.zoneName && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            International
                          </span>
                          <span>{order.deliveryInfo.location.zoneName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tarif et délai */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Frais
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(order.deliveryFee)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Délai
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.deliveryInfo.tarif?.deliveryTime || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Autres transporteurs disponibles */}
                  {order.deliveryInfo.metadata?.availableCarriers?.length > 1 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Autres options disponibles
                      </div>
                      <div className="space-y-1">
                        {order.deliveryInfo.metadata.availableCarriers
                          .filter((carrier: any) => carrier.transporteurId !== order.deliveryInfo.transporteur.id)
                          .map((carrier: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-600 flex justify-between">
                              <span>{carrier.name}</span>
                              <span className="font-medium">{formatCurrency(carrier.fee)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Total */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 text-white">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Sous-total</span>
                  <span className="font-medium">
                    {formatCurrency((order.totalAmount || 0) - (order.deliveryFee || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Livraison</span>
                  <span className="font-medium">{formatCurrency(order.deliveryFee || 0)}</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Total de la commande
                    </span>
                    <span className="text-2xl font-semibold">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
```

---

## 🛡️ Règles de Validation Backend

### 1. Validation du Transporteur

```javascript
async function validateTransporteur(transporteurId, zoneTarifId) {
  // Vérifier que le transporteur existe
  const transporteur = await db.query(
    'SELECT * FROM transporteurs WHERE id = ? AND active = true',
    [transporteurId]
  );

  if (transporteur.length === 0) {
    throw new Error('Transporteur invalide ou inactif');
  }

  // Vérifier que le tarif existe et correspond au transporteur
  const tarif = await db.query(
    'SELECT * FROM zone_tarifs WHERE id = ? AND transporteur_id = ?',
    [zoneTarifId, transporteurId]
  );

  if (tarif.length === 0) {
    throw new Error('Tarif de livraison invalide pour ce transporteur');
  }

  return { transporteur: transporteur[0], tarif: tarif[0] };
}
```

### 2. Validation de la Zone

```javascript
async function validateDeliveryZone(deliveryInfo) {
  if (deliveryInfo.deliveryType === 'city') {
    if (!deliveryInfo.cityId) {
      throw new Error('ID de ville manquant');
    }

    const city = await db.query('SELECT * FROM cities WHERE id = ?', [deliveryInfo.cityId]);
    if (city.length === 0) {
      throw new Error('Ville introuvable');
    }

    return { type: 'city', location: city[0] };
  }

  if (deliveryInfo.deliveryType === 'region') {
    if (!deliveryInfo.regionId) {
      throw new Error('ID de région manquant');
    }

    const region = await db.query('SELECT * FROM regions WHERE id = ?', [deliveryInfo.regionId]);
    if (region.length === 0) {
      throw new Error('Région introuvable');
    }

    return { type: 'region', location: region[0] };
  }

  if (deliveryInfo.deliveryType === 'international') {
    if (!deliveryInfo.zoneId) {
      throw new Error('ID de zone internationale manquant');
    }

    const zone = await db.query('SELECT * FROM international_zones WHERE id = ?', [deliveryInfo.zoneId]);
    if (zone.length === 0) {
      throw new Error('Zone internationale introuvable');
    }

    return { type: 'international', location: zone[0] };
  }

  throw new Error('Type de livraison invalide');
}
```

### 3. Validation des Frais

```javascript
function validateDeliveryFee(requestedFee, tarifFromDB) {
  // Tolérance de 1% pour les arrondis
  const tolerance = tarifFromDB.price * 0.01;
  const difference = Math.abs(requestedFee - tarifFromDB.price);

  if (difference > tolerance) {
    throw new Error(
      `Frais de livraison incorrects. Attendu: ${tarifFromDB.price}, Reçu: ${requestedFee}`
    );
  }

  return true;
}
```

---

## 📊 Endpoints API Requis

### 1. Créer une Commande avec Livraison

```
POST /api/orders
Content-Type: application/json

Body: {
  "email": "client@example.com",
  "shippingDetails": { ... },
  "phoneNumber": "+221 77 XXX XX XX",
  "orderItems": [ ... ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true,
  "deliveryInfo": {
    "deliveryType": "city",
    "cityId": 1,
    "cityName": "Dakar",
    "transporteurId": 5,
    "transporteurName": "DHL Express",
    "zoneTarifId": 23,
    "deliveryFee": 3000,
    "deliveryTime": "24-48h"
  }
}

Response: {
  "success": true,
  "data": {
    "id": 1001,
    "orderNumber": "ORD-2025-001",
    "totalAmount": 35000,
    "deliveryFee": 3000,
    "payment": { ... }
  }
}
```

### 2. Récupérer Détails Commande (Admin)

```
GET /api/admin/orders/:orderId

Response: {
  "id": 1001,
  "orderNumber": "ORD-2025-001",
  "status": "PENDING",
  "totalAmount": 35000,
  "deliveryFee": 3000,
  "user": { ... },
  "shippingAddress": { ... },
  "orderItems": [ ... ],
  "deliveryInfo": {
    "deliveryType": "city",
    "location": {
      "cityId": 1,
      "cityName": "Dakar",
      "countryCode": "SN",
      "countryName": "Sénégal"
    },
    "transporteur": {
      "id": 5,
      "name": "DHL Express",
      "logo": "https://api.printalma.com/uploads/logos/dhl.png",
      "phone": "+221 33 XXX XX XX"
    },
    "tarif": {
      "id": 23,
      "amount": 3000,
      "deliveryTime": "24-48h"
    },
    "metadata": { ... }
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### 3. Calculer Frais de Livraison (Optionnel)

```
POST /api/delivery/calculate-fee
Content-Type: application/json

Body: {
  "deliveryType": "city",
  "cityId": 1,
  "transporteurId": 5,
  "cartTotal": 30000
}

Response: {
  "success": true,
  "data": {
    "transporteur": {
      "id": 5,
      "name": "DHL Express",
      "logo": "https://..."
    },
    "deliveryFee": 3000,
    "deliveryTime": "24-48h",
    "totalAmount": 33000
  }
}
```

---

## ✅ Checklist Backend

### Configuration BDD
- [ ] Champs de livraison ajoutés à la table `orders`
- [ ] Index créés sur `transporteur_id`, `delivery_city_id`, etc.
- [ ] Migrations exécutées avec succès

### Types & Interfaces (TypeScript)
- [ ] Interface `CreateOrderRequest` mise à jour avec `deliveryInfo`
- [ ] Type `DeliveryInfo` créé et exporté
- [ ] Interface `Order` mise à jour avec les champs de livraison

### Validation
- [ ] Validation de `deliveryInfo` implémentée
- [ ] Validation du transporteur et du tarif
- [ ] Validation de la zone de livraison
- [ ] Validation des frais (cohérence avec tarif BDD)

### Enrichissement des Données
- [ ] Fonction `enrichDeliveryInfo` implémentée
- [ ] Récupération complète du transporteur depuis BDD
- [ ] Récupération complète du tarif depuis BDD
- [ ] Construction de `delivery_metadata` JSONB

### Endpoints API
- [ ] `POST /api/orders` accepte `deliveryInfo`
- [ ] `GET /api/admin/orders/:orderId` retourne `deliveryInfo` complet
- [ ] Gestion d'erreur appropriée pour données manquantes

### Tests
- [ ] Test: Commande avec livraison en ville (Sénégal)
- [ ] Test: Commande avec livraison en région (Sénégal)
- [ ] Test: Commande avec livraison internationale
- [ ] Test: Validation échoue si transporteur invalide
- [ ] Test: Validation échoue si frais incorrects
- [ ] Test: Affichage admin avec toutes les infos de livraison

---

## 🐛 Problèmes Fréquents et Solutions

### Problème 1: Frais de Livraison Incorrects

**Symptôme:** Le total de la commande ne correspond pas aux calculs

**Causes:**
- Frais de livraison non ajoutés au total
- Frais calculés différemment frontend vs backend

**Solution:**
```javascript
// Backend - Toujours recalculer le total
const productsTotal = orderItems.reduce((sum, item) =>
  sum + (item.unitPrice * item.quantity), 0
);

const deliveryFee = deliveryInfo.deliveryFee || 0;
const totalAmount = productsTotal + deliveryFee;

// Vérifier la cohérence
if (Math.abs(totalAmount - requestedTotal) > 1) {
  throw new Error('Montant total incohérent');
}
```

---

### Problème 2: Transporteur Non Trouvé

**Symptôme:** Erreur "Transporteur invalide" alors que le transporteur existe

**Causes:**
- Transporteur désactivé (`active = false`)
- ID de transporteur incorrect
- Zone non couverte par le transporteur

**Solution:**
```javascript
// Vérifier que le transporteur couvre la zone
const coverage = await db.query(`
  SELECT zt.*
  FROM zone_tarifs zt
  WHERE zt.transporteur_id = ?
  AND (
    (zt.city_id = ? AND ? IS NOT NULL) OR
    (zt.region_id = ? AND ? IS NOT NULL) OR
    (zt.zone_id = ? AND ? IS NOT NULL)
  )
`, [
  transporteurId,
  cityId, cityId,
  regionId, regionId,
  zoneId, zoneId
]);

if (coverage.length === 0) {
  throw new Error('Ce transporteur ne couvre pas cette zone');
}
```

---

### Problème 3: Données de Livraison Manquantes dans l'Admin

**Symptôme:** OrderDetailPage n'affiche pas les infos de livraison

**Causes:**
- Champ `deliveryInfo` non renvoyé par l'API
- Anciennes commandes sans données de livraison
- Parsing JSON échoue

**Solution:**
```javascript
// Backend - Toujours construire deliveryInfo
function buildDeliveryInfoForResponse(order) {
  // Si pas de données de livraison (anciennes commandes)
  if (!order.transporteur_id) {
    return null;
  }

  return {
    deliveryType: order.delivery_type || 'unknown',
    location: {
      cityId: order.delivery_city_id,
      cityName: order.delivery_city_name,
      regionId: order.delivery_region_id,
      regionName: order.delivery_region_name,
      zoneId: order.delivery_zone_id,
      zoneName: order.delivery_zone_name
    },
    transporteur: {
      id: order.transporteur_id,
      name: order.transporteur_name,
      logo: order.transporteur_logo,
      phone: order.transporteur_phone
    },
    tarif: {
      id: order.zone_tarif_id,
      amount: order.delivery_fee,
      deliveryTime: order.delivery_time
    },
    metadata: order.delivery_metadata ?
      (typeof order.delivery_metadata === 'string' ?
        JSON.parse(order.delivery_metadata) :
        order.delivery_metadata) :
      null
  };
}
```

---

## 📞 Support

Pour toute question sur l'implémentation backend, référez-vous à:
- `src/services/deliveryService.ts` - Logique frontend de livraison
- `src/pages/ModernOrderFormPage.tsx` - Sélection transporteur
- `src/pages/admin/OrderDetailPage.tsx` - Affichage admin
- `src/services/orderService.ts` - Types et interfaces

---

**Version:** 1.0
**Date:** 2025-01-15
**Auteur:** Documentation Backend Delivery System
