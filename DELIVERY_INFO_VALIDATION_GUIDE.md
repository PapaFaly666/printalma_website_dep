# Guide de gestion de deliveryInfo pour le backend

## Contexte

Ce document guide le backend sur la gestion des champs `deliveryInfo.transporteurId` et `deliveryInfo.zoneTarifId` qui peuvent être optionnels selon le type de livraison.

## Problème identifié

Le frontend convertit actuellement `transporteurId` et `zoneTarifId` en entiers, mais le backend attend des chaînes de caractères.

## Structure de deliveryInfo

### Règles de validation

1. **Pour le Sénégal (code = 'SN')** :
   - `transporteurId` et `zoneTarifId` sont **OPTIONNELS**
   - La livraison standard peut être utilisée sans transporteur spécifique
   - Si non fournis, utiliser les valeurs par défaut du système

2. **Pour l'international (code ≠ 'SN')** :
   - `transporteurId` et `zoneTarifId` sont **OBLIGATOIRES**
   - Un transporteur doit être sélectionné obligatoirement

### Formats attendus

```typescript
interface DeliveryInfo {
  // Type de livraison (OBLIGATOIRE)
  deliveryType: 'city' | 'region' | 'international';

  // Localisation (selon le type)
  cityId?: string;              // Si deliveryType = 'city'
  cityName?: string;
  regionId?: string;            // Si deliveryType = 'region'
  regionName?: string;
  zoneId?: string;              // Si deliveryType = 'international'
  zoneName?: string;
  countryCode?: string;         // Code ISO du pays (ex: "SN", "FR", "US")
  countryName?: string;

  // Transporteur (OPTIONNEL pour le Sénégal, OBLIGATOIRE pour l'international)
  transporteurId?: string;      // Doit être une chaîne de caractères
  transporteurName?: string;
  transporteurLogo?: string;

  // Tarification (OBLIGATOIRE si transporteur sélectionné)
  zoneTarifId?: string;        // Doit être une chaîne de caractères
  deliveryFee: number;         // Montant en XOF
  deliveryTime?: string;        // Ex: "24-48h", "2-3 jours"

  // Métadonnées optionnelles
  metadata?: {
    availableCarriers?: Array<{
      transporteurId: string;
      name: string;
      fee: number;
      time: string;
    }>;
    selectedAt?: string;        // ISO timestamp
    calculationDetails?: any;
  };
}
```

## Logique de validation pour le backend

### 1. Vérifier le pays de livraison

```javascript
const isSenegalDelivery = deliveryInfo.countryCode === 'SN';

// Les règles de validation dépendent du pays
if (isSenegalDelivery) {
  // Pour le Sénégal : transporteurId et zoneTarifId optionnels
  if (!deliveryInfo.transporteurId || !deliveryInfo.zoneTarifId) {
    // Utiliser la livraison standard par défaut
    deliveryInfo.transporteurId = deliveryInfo.transporteurId || null;
    deliveryInfo.zoneTarifId = deliveryInfo.zoneTarifId || null;
    // Ne pas générer d'erreur
  }
} else {
  // Pour l'international : transporteurId et zoneTarifId obligatoires
  if (!deliveryInfo.transporteurId) {
    throw new Error('deliveryInfo.transporteurId is required for international delivery');
  }
  if (!deliveryInfo.zoneTarifId) {
    throw new Error('deliveryInfo.zoneTarifId is required for international delivery');
  }
}
```

### 2. Conversion des types

```javascript
// S'assurer que les IDs sont des chaînes de caractères
if (deliveryInfo.transporteurId) {
  deliveryInfo.transporteurId = String(deliveryInfo.transporteurId);
}

if (deliveryInfo.zoneTarifId) {
  deliveryInfo.zoneTarifId = String(deliveryInfo.zoneTarifId);
}
```

### 3. Validation des IDs

```javascript
// Vérifier que les IDs ne sont pas vides
if (deliveryInfo.transporteurId === '') {
  deliveryInfo.transporteurId = null;
}

if (deliveryInfo.zoneTarifId === '') {
  deliveryInfo.zoneTarifId = null;
}

// Pour l'international, les IDs ne peuvent pas être null
if (!isSenegalDelivery && (!deliveryInfo.transporteurId || !deliveryInfo.zoneTarifId)) {
  throw new Error('Valid transporteurId and zoneTarifId are required for international delivery');
}
```

## Messages d'erreur recommandés

### Pour l'international
- `deliveryInfo.transporteurId is required for international delivery`
- `deliveryInfo.zoneTarifId is required for international delivery`
- `deliveryInfo.transporteurId must be a string`
- `deliveryInfo.zoneTarifId must be a string`
- `deliveryInfo.transporteurId should not be empty`

### Pour le Sénégal
- Pas d'erreur si les champs sont absents ou null
- Utiliser les valeurs par défaut du système

## Exemples de payloads valides

### Livraison standard Sénégal
```json
{
  "deliveryInfo": {
    "deliveryType": "city",
    "countryCode": "SN",
    "cityName": "Dakar",
    "countryName": "Sénégal",
    "transporteurName": "Livraison standard",
    "deliveryFee": 0,
    "deliveryTime": "Standard"
  }
}
```

### Livraison avec transporteur Sénégal
```json
{
  "deliveryInfo": {
    "deliveryType": "city",
    "countryCode": "SN",
    "cityId": "1",
    "cityName": "Dakar",
    "countryName": "Sénégal",
    "transporteurId": "5",
    "transporteurName": "Transporteur Express",
    "zoneTarifId": "12",
    "deliveryFee": 1500,
    "deliveryTime": "1-2 jours"
  }
}
```

### Livraison internationale
```json
{
  "deliveryInfo": {
    "deliveryType": "international",
    "countryCode": "FR",
    "countryName": "France",
    "zoneId": "3",
    "zoneName": "Europe",
    "transporteurId": "7",
    "transporteurName": "DHL International",
    "zoneTarifId": "25",
    "deliveryFee": 15000,
    "deliveryTime": "3-5 jours"
  }
}
```

## Correction nécessaire dans le frontend

Dans `src/pages/ModernOrderFormPage.tsx`, lignes 408-411 :

```typescript
// CORRECT - Garder en tant que chaînes de caractères
deliveryInfo.transporteurId = selectedCarrierData.transporteur.id.toString();
deliveryInfo.zoneTarifId = selectedCarrierData.tarif.id.toString();
```

Au lieu de :
```typescript
// INCORRECT - Conversion en entiers
deliveryInfo.transporteurId = parseInt(selectedCarrierData.transporteur.id.toString());
deliveryInfo.zoneTarifId = parseInt(selectedCarrierData.tarif.id.toString());
```

## Résumé

1. **Sénégal** : `transporteurId` et `zoneTarifId` optionnels
2. **International** : `transporteurId` et `zoneTarifId` obligatoires
3. **Type** : Doivent être des chaînes de caractères
4. **Validation** : Les champs vides sont traités comme null pour le Sénégal
5. **Messages d'erreur** : Spécifiques et clairs selon le contexte