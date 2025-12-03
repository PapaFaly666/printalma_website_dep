# 🌍 Support des Deux Formats de Livraison

## ✅ Implémentation Complète

Le système supporte maintenant **deux formats de données de livraison** :

### 📦 Format 1 : Structure Imbriquée (International - France)

**Utilisé pour** : Livraisons internationales

**Exemple API Response** :
```json
{
  "deliveryInfo": {
    "deliveryType": "international",
    "location": {
      "type": "international",
      "countryCode": "France",
      "countryName": "France"
    },
    "transporteur": {
      "id": "e57845c7-048c-47e2-a368-68d398f69c9b",
      "name": "DHL",
      "logo": "https://...dhl_express.png"
    },
    "tarif": {
      "id": "616d7649-9ef0-401c-a5a4-77f4e3d6d0fd",
      "amount": 12000,
      "deliveryTime": "1-3 jours"
    },
    "metadata": {
      "selectedAt": "2025-11-28T13:09:37.432Z",
      "calculatedAt": "2025-11-28T13:09:39.620Z",
      "availableCarriers": [
        {
          "transporteurId": "e57845c7-048c-47e2-a368-68d398f69c9b",
          "name": "DHL",
          "fee": 12000,
          "time": "1-3 jours"
        }
      ]
    }
  }
}
```

**Affichage** :
```
┌─────────────────────────────────────────┐
│ 🚚 Informations de Livraison            │
│    ✈️ Livraison internationale          │
├─────────────────────────────────────────┤
│ 📍 DESTINATION                          │
│    Pays: France                         │
│                                         │
│ 🚛 TRANSPORTEUR                         │
│    [LOGO DHL]                           │
│    DHL                                  │
│    ⏱️ 1-3 jours                         │
│                                         │
│ 💰 TARIFICATION                         │
│    Frais de livraison                   │
│    12 000 XOF                           │
│    Délai estimé: 1-3 jours              │
└─────────────────────────────────────────┘
```

---

### 📦 Format 2 : Champs Plats (Sénégal - Local)

**Utilisé pour** : Livraisons locales au Sénégal

**Exemple API Response** :
```json
{
  "deliveryInfo": null,
  "deliveryType": "city",
  "deliveryCityId": "city-rufisque",
  "deliveryCityName": "Rufisque",
  "deliveryRegionId": null,
  "deliveryRegionName": null,
  "deliveryZoneId": null,
  "deliveryZoneName": null,
  "transporteurId": null,
  "transporteurName": null,
  "transporteurLogo": null,
  "deliveryFee": 2200,
  "deliveryTime": null,
  "deliveryMetadata": {
    "location": {
      "id": "city-rufisque",
      "name": "Rufisque",
      "type": "city",
      "category": "Banlieue",
      "zoneType": "banlieue",
      "countryCode": "SN",
      "countryName": "Sénégal"
    },
    "metadata": {
      "selectedAt": "2025-11-28T13:24:44.262Z",
      "availableCarriers": [],
      "calculationDetails": {
        "hasCarrier": false,
        "isSenegalDelivery": true,
        "availableCarriersCount": 0
      },
      "isStandardDelivery": true
    },
    "calculatedAt": "2025-11-28T13:24:46.187Z",
    "deliveryType": "city"
  }
}
```

**Affichage** :
```
┌─────────────────────────────────────────┐
│ 🚚 Informations de Livraison            │
│    🏙️ Livraison en ville                │
├─────────────────────────────────────────┤
│ 📍 DESTINATION                          │
│    Ville: Rufisque                      │
│    Pays: Sénégal                        │
│                                         │
│ 🚛 TRANSPORTEUR                         │
│    Non sélectionné                      │
│                                         │
│ 💰 TARIFICATION                         │
│    Frais de livraison                   │
│    2 200 XOF                            │
└─────────────────────────────────────────┘
```

---

## 🔄 Normalisation Automatique

### Service Layer (`newOrderService.ts`)

```typescript
private normalizeOrderData(orderData: any): Order {
  // Cas 1: Structure imbriquée (deliveryInfo existe)
  if (orderData.deliveryInfo && !orderData.delivery_info) {
    console.log('🔄 Mapping deliveryInfo (imbriquée) -> delivery_info');
    orderData.delivery_info = orderData.deliveryInfo;
    delete orderData.deliveryInfo;
  }

  // Cas 2: Champs plats (deliveryInfo est null)
  else if (!orderData.deliveryInfo && !orderData.delivery_info && orderData.deliveryType) {
    console.log('🔄 Création delivery_info depuis champs plats');

    orderData.delivery_info = {
      deliveryType: orderData.deliveryType,
      cityId: orderData.deliveryCityId,
      cityName: orderData.deliveryCityName,
      regionId: orderData.deliveryRegionId,
      regionName: orderData.deliveryRegionName,
      zoneId: orderData.deliveryZoneId,
      zoneName: orderData.deliveryZoneName,
      countryCode: orderData.shippingCountry === 'Sénégal' ? 'SN' : undefined,
      countryName: orderData.shippingCountry,
      transporteurId: orderData.transporteurId,
      transporteurName: orderData.transporteurName,
      transporteurLogo: orderData.transporteurLogo,
      deliveryFee: orderData.deliveryFee,
      deliveryTime: orderData.deliveryTime,
      metadata: orderData.deliveryMetadata || undefined
    };
  }

  return orderData;
}
```

---

## 📊 Tableau Comparatif

| Caractéristique | Format 1 (Imbriqué) | Format 2 (Plat) |
|----------------|---------------------|-----------------|
| **Utilisation** | International | Sénégal (Local) |
| **API Field** | `deliveryInfo` (objet) | `deliveryInfo` (null) |
| **Type** | `international` | `city`, `region` |
| **Transporteur** | Souvent défini | Souvent null |
| **Structure Location** | `location: {...}` | Champs plats `deliveryCityName`, etc. |
| **Structure Tarif** | `tarif: { amount, time }` | Champs plats `deliveryFee`, `deliveryTime` |
| **Metadata** | `metadata: {...}` | `deliveryMetadata: {...}` |

---

## 🎯 Cas d'Usage

### Cas 1 : Livraison Internationale (France)
- ✅ Structure imbriquée
- ✅ Transporteur défini (DHL, FedEx, etc.)
- ✅ Tarif élevé (12 000 XOF)
- ✅ Délai précis (1-3 jours)
- ✅ Liste de transporteurs disponibles

### Cas 2 : Livraison Locale Ville (Rufisque)
- ✅ Champs plats
- ❌ Pas de transporteur (livraison standard)
- ✅ Tarif local (2 200 XOF)
- ❌ Pas de délai spécifique
- ❌ Liste transporteurs vide

### Cas 3 : Livraison Régionale (Thiès)
- ✅ Champs plats
- ⚠️ Transporteur optionnel
- ✅ Tarif intermédiaire (3 500 XOF)
- ✅ Délai possible (24-48h)
- ⚠️ Liste transporteurs variable

---

## 🔍 Logs de Debug

### Format Imbriqué
```
Console:
🔄 [NewOrderService] Mapping deliveryInfo (structure imbriquée) -> delivery_info pour commande #ORD-1764335380032
```

### Format Plat
```
Console:
🔄 [NewOrderService] Création delivery_info depuis champs plats pour commande #ORD-1764336286532
```

---

## ✅ Checklist de Test

### Test Format 1 (International)
- [ ] Naviguer vers `/admin/orders/347`
- [ ] Vérifier affichage "✈️ Livraison internationale"
- [ ] Vérifier Pays: France
- [ ] Vérifier Transporteur: DHL avec logo
- [ ] Vérifier Frais: 12 000 XOF
- [ ] Vérifier Délai: 1-3 jours
- [ ] Vérifier liste transporteurs disponibles

### Test Format 2 (Sénégal)
- [ ] Naviguer vers `/admin/orders/348`
- [ ] Vérifier affichage "🏙️ Livraison en ville"
- [ ] Vérifier Ville: Rufisque
- [ ] Vérifier Pays: Sénégal
- [ ] Vérifier "Non sélectionné" pour transporteur
- [ ] Vérifier Frais: 2 200 XOF
- [ ] Vérifier métadonnées si disponibles

---

## 🚀 Déploiement

Les deux formats sont **automatiquement gérés** sans intervention manuelle :

1. ✅ L'API retourne le format selon le type de livraison
2. ✅ Le service normalise automatiquement vers `delivery_info`
3. ✅ L'UI affiche les données de manière cohérente
4. ✅ Aucune erreur si des champs sont manquants

---

## 📝 Notes Importantes

### Pour les Développeurs Backend
- ⚠️ Pour l'international : utiliser la structure imbriquée `deliveryInfo`
- ⚠️ Pour le Sénégal : laisser `deliveryInfo = null` et remplir les champs plats
- ⚠️ Toujours inclure `deliveryType` pour identifier le type

### Pour les Développeurs Frontend
- ✅ Ne jamais accéder directement à `deliveryInfo`
- ✅ Toujours utiliser `delivery_info` normalisé
- ✅ Gérer les champs optionnels (transporteur, délai, etc.)
- ✅ Afficher "Non sélectionné" si transporteur absent

---

## 🎉 Résultat

Une interface **unifiée et robuste** qui fonctionne automatiquement avec les deux formats de données, sans nécessiter de configuration ou de logique conditionnelle complexe dans l'UI.
