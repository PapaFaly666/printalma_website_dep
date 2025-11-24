# Guide de Gestion Livraison pour l'Admin

Ce guide détaille l'implémentation et l'utilisation du système de gestion de livraison dans l'interface d'administration de PrintAlma.

## 📋 Table des matières

1. [Architecture du système](#architecture)
2. [Pages principales](#pages-principales)
3. [Composants de livraison](#composants-livraison)
4. [Services et API](#services-et-api)
5. [Types et interfaces](#types-et-interfaces)
6. [Workflow de gestion](#workflow)
7. [Bonnes pratiques](#bonnes-pratiques)

## 🏗️ Architecture du système

Le système de livraison est organisé en plusieurs couches :

```
src/
├── pages/admin/
│   ├── DeliveryManagementPage.tsx     # Page principale de gestion
│   └── ZonesLivraisonPage.tsx         # Gestion des zones (ancienne version)
├── components/admin/delivery/
│   ├── ZoneManagementPanel.tsx        # Gestion des zones de livraison
│   ├── DeliverySettingsSection.tsx    # Paramètres généraux
│   ├── TransporterManagementSection.tsx # Gestion des transporteurs
│   ├── DeliveryTrackingDashboard.tsx  # Suivi des livraisons
│   └── ProductPreviewModal.tsx        # Modal de test livraison
├── services/
│   ├── deliveryService.ts             # Service API principal
│   └── deliveryApiService.ts          # Service API additionnel
└── types/
    └── order.ts                       # Types liés aux commandes
```

## 📄 Pages principales

### DeliveryManagementPage.tsx

**Rôle**: Page centrale de gestion de la livraison avec 4 onglets

**Fonctionnalités**:
- **Zones**: Gestion des zones de livraison (villes, régions, international)
- **Paramètres**: Configuration générale de la livraison
- **Transporteurs**: Gestion des livreurs et leurs zones
- **Suivi**: Dashboard de suivi des livraisons en temps réel

**Props principales**:
```typescript
interface DeliveryManagementPageProps {
  // Pas de props - page autonome avec état local
}
```

**États gérés**:
```typescript
const [zones, setZones] = useState<DeliveryZone[]>([]);
const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({});
const [transporters, setTransporters] = useState<Transporteur[]>([]);
const [activeTab, setActiveTab] = useState('zones');
```

### ZonesLivraisonPage.tsx

**Rôle**: Version avancée de la gestion des zones avec support complet

**Fonctionnalités**:
- Gestion des villes (Dakar ville + banlieue)
- Gestion des régions (13 régions du Sénégal)
- Gestion des zones internationales
- Gestion des transporteurs et tarifs associés
- Support des masques de saisie pour les prix

**Types complexes**:
```typescript
interface City {
  id: string;
  name: string;
  category: string;
  zoneType: 'dakar-ville' | 'banlieue';
  status: 'active' | 'inactive';
  price: string; // Decimal depuis l'API
  isFree: boolean;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  deliveryTimeUnit?: 'heures' | 'jours';
}

interface Region {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  price: string;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryTimeUnit: string;
  mainCities?: string;
}
```

## 🧩 Composants de livraison

### ZoneManagementPanel.tsx

**Rôle**: Interface de gestion des zones de livraison

**Props**:
```typescript
interface ZoneManagementPanelProps {
  zones: DeliveryZone[];
  onUpdateZone: (zone: DeliveryZone) => void;
  onDeleteZone: (zoneId: string) => void;
  onAddZone: () => void;
}
```

**Fonctionnalités**:
- Liste des zones avec statut actif/inactif
- Modification inline des prix et délais
- Suppression avec confirmation
- Ajout de nouvelles zones

### DeliverySettingsSection.tsx

**Rôle**: Configuration des paramètres généraux de livraison

**Props**:
```typescript
interface DeliverySettingsSectionProps {
  settings: DeliverySettings;
  onSettingsChange: (settings: DeliverySettings) => void;
}
```

**Paramètres configurables**:
- Paiement à la livraison (espèces/mobile money)
- Livraison programmée
- Gestion des transporteurs
- Tarifs de base (standard, express, par distance)

### TransporterManagementSection.tsx

**Rôle**: Gestion des transporteurs et leurs zones d'intervention

**Props**:
```typescript
interface TransporterManagementSectionProps {
  transporters: Transporteur[];
  zones: DeliveryZone[];
  onTransportersChange: (transporters: Transporteur[]) => void;
  enabled: boolean;
}
```

**Fonctionnalités**:
- Ajout/suppression de transporteurs
- Attribution des zones d'intervention
- Suivi des statuts (actif, inactif, occupé)
- Visualisation des performances

### DeliveryTrackingDashboard.tsx

**Rôle**: Dashboard de suivi des livraisons en temps réel

**Props**: Aucune (composant autonome)

**Fonctionnalités**:
- Suivi des livraisons en cours
- Filtrage par statut et transporteur
- Détails des livraisons (tracking, temps, client)
- Gestion des priorités

### ProductPreviewModal.tsx

**Rôle**: Modal de test des paramètres de livraison

**Props**:
```typescript
interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Utilité**: Permet de tester les calculs de frais de livraison selon les zones configurées

## 🔧 Services et API

### deliveryService.ts

**Rôle**: Service principal pour la communication avec l'API de livraison

**Endpoints disponibles**:

#### Cities (Dakar ville + banlieue)
```typescript
// GET /delivery/cities
async getCities(zoneType?: 'dakar-ville' | 'banlieue'): Promise<City[]>

// POST /delivery/cities
async createCity(payload: CreateCityPayload): Promise<City>

// PUT /delivery/cities/:id
async updateCity(id: string, payload: Partial<CreateCityPayload>): Promise<City>

// DELETE /delivery/cities/:id
async deleteCity(id: string): Promise<void>

// PATCH /delivery/cities/:id/toggle-status
async toggleCityStatus(id: string): Promise<City>
```

#### Regions (13 régions du Sénégal)
```typescript
// GET /delivery/regions
async getRegions(): Promise<Region[]>

// POST /delivery/regions
async createRegion(payload: CreateRegionPayload): Promise<Region>

// PUT /delivery/regions/:id
async updateRegion(id: string, payload: Partial<CreateRegionPayload>): Promise<Region>

// DELETE /delivery/regions/:id
async deleteRegion(id: string): Promise<void>

// PATCH /delivery/regions/:id/toggle-status
async toggleRegionStatus(id: string): Promise<Region>
```

#### Zones internationales
```typescript
// GET /delivery/international-zones
async getInternationalZones(): Promise<InternationalZone[]>

// POST /delivery/international-zones
async createInternationalZone(payload: CreateInternationalZonePayload): Promise<InternationalZone>

// PUT /delivery/international-zones/:id
async updateInternationalZone(id: string, payload: Partial<CreateInternationalZonePayload>): Promise<InternationalZone>

// DELETE /delivery/international-zones/:id
async deleteInternationalZone(id: string): Promise<void>

// PATCH /delivery/international-zones/:id/toggle-status
async toggleInternationalZoneStatus(id: string): Promise<InternationalZone>
```

#### Transporteurs
```typescript
// GET /delivery/transporteurs
async getTransporteurs(): Promise<Transporteur[]>

// POST /delivery/transporteurs
async createTransporteur(payload: CreateTransporteurPayload): Promise<Transporteur>

// PUT /delivery/transporteurs/:id
async updateTransporteur(id: string, payload: Partial<CreateTransporteurPayload>): Promise<Transporteur>

// DELETE /delivery/transporteurs/:id
async deleteTransporteur(id: string): Promise<void>

// PATCH /delivery/transporteurs/:id/toggle-status
async toggleTransporteurStatus(id: string): Promise<Transporteur>
```

#### Tarifs des zones
```typescript
// GET /delivery/zone-tarifs
async getZoneTarifs(): Promise<ZoneTarif[]>

// POST /delivery/zone-tarifs
async createZoneTarif(payload: CreateZoneTarifPayload): Promise<ZoneTarif>

// PUT /delivery/zone-tarifs/:id
async updateZoneTarif(id: string, payload: Partial<CreateZoneTarifPayload>): Promise<ZoneTarif>

// DELETE /delivery/zone-tarifs/:id
async deleteZoneTarif(id: string): Promise<void>

// PATCH /delivery/zone-tarifs/:id/toggle-status
async toggleZoneTarifStatus(id: string): Promise<ZoneTarif>
```

#### Calcul des frais
```typescript
// GET /delivery/calculate-fee
async calculateDeliveryFee(
  cityId?: string,
  regionId?: string,
  internationalZoneId?: string
): Promise<{ fee: number; deliveryTime: string }>
```

### deliveryApiService.ts

**Rôle**: Service additionnel pour les opérations spécifiques de livraison

**Utilisation**: Complémentaire à `deliveryService.ts`, contient des fonctions utilitaires et des endpoints supplémentaires.

## 📝 Types et interfaces

### Types principaux

```typescript
interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  price: number;
  estimatedTime: string;
  isActive: boolean;
  deliveryType: 'standard' | 'express' | 'scheduled';
}

interface DeliverySettings {
  cashOnDelivery: boolean;
  mobileMoneyOnDelivery: boolean;
  scheduledDelivery: boolean;
  transporterManagement: boolean;
  baseFee: number;
  expressFee: number;
  perDistanceFee: number;
}

interface Transporter {
  id: string;
  name: string;
  avatar: string;
  status: 'active' | 'inactive' | 'busy';
  rating: number;
  zones: string[];
  totalDeliveries: number;
  avgDeliveryTime: string;
}

interface Delivery {
  id: string;
  orderNumber: string;
  customerName: string;
  transporterName: string;
  status: 'pending' | 'preparing' | 'on_way' | 'delivered' | 'delayed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: string;
  actualTime?: string;
  origin: string;
  destination: string;
  distance: string;
  price: number;
  trackingNumber: string;
}
```

## 🔄 API Requêtes & Réponses

### Configuration

**Base URL**: `http://localhost:3004` (configurable via `VITE_API_URL`)
**Authentification**: Bearer token requis dans les headers
**Content-Type**: `application/json`

---

## 📋 Cities (Villes - Dakar ville + banlieue)

### GET /delivery/cities
Récupère toutes les villes, optionnellement filtrées par type

**Request:**
```typescript
// Sans filtre
GET /delivery/cities

// Avec filtre
GET /delivery/cities?zoneType=dakar-ville
// ou
GET /delivery/cities?zoneType=banlieue
```

**Response:**
```typescript
// Status: 200 OK
[
  {
    "id": "city_123",
    "name": "Dakar",
    "category": "Capitale",
    "zoneType": "dakar-ville",
    "status": "active",
    "price": "1500.00",
    "isFree": false,
    "deliveryTimeMin": 2,
    "deliveryTimeMax": 4,
    "deliveryTimeUnit": "heures",
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-01-01T10:00:00Z"
  }
]
```

### GET /delivery/cities/:id
Récupère une ville spécifique

**Response:**
```typescript
// Status: 200 OK
{
  "id": "city_123",
  "name": "Pikine",
  "category": "Banlieue",
  "zoneType": "banlieue",
  "status": "active",
  "price": "2000.00",
  "isFree": false,
  "deliveryTimeMin": 3,
  "deliveryTimeMax": 6,
  "deliveryTimeUnit": "heures",
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-01T10:00:00Z"
}
```

### POST /delivery/cities
Crée une nouvelle ville

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "name": "Guédiawaye",
  "category": "Banlieue",
  "zoneType": "banlieue",
  "status": "active",
  "price": 2000,
  "isFree": false,
  "deliveryTimeMin": 3,
  "deliveryTimeMax": 5,
  "deliveryTimeUnit": "heures"
}
```

**Response:**
```typescript
// Status: 201 Created
{
  "id": "city_456",
  "name": "Guédiawaye",
  "category": "Banlieue",
  "zoneType": "banlieue",
  "status": "active",
  "price": "2000.00",
  "isFree": false,
  "deliveryTimeMin": 3,
  "deliveryTimeMax": 5,
  "deliveryTimeUnit": "heures",
  "createdAt": "2025-01-02T10:00:00Z",
  "updatedAt": "2025-01-02T10:00:00Z"
}
```

### PUT /delivery/cities/:id
Met à jour une ville existante

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "name": "Guédiawaye",
  "price": 2500,
  "deliveryTimeMin": 2,
  "deliveryTimeMax": 4,
  "status": "active"
}
```

**Response:**
```typescript
// Status: 200 OK
{
  "id": "city_456",
  "name": "Guédiawaye",
  "category": "Banlieue",
  "zoneType": "banlieue",
  "status": "active",
  "price": "2500.00",
  "isFree": false,
  "deliveryTimeMin": 2,
  "deliveryTimeMax": 4,
  "deliveryTimeUnit": "heures",
  "createdAt": "2025-01-02T10:00:00Z",
  "updatedAt": "2025-01-02T15:30:00Z"
}
```

### DELETE /delivery/cities/:id
Supprime une ville

**Response:**
```typescript
// Status: 204 No Content
```

### PATCH /delivery/cities/:id/toggle-status
Change le statut d'une ville

**Response:**
```typescript
// Status: 200 OK
{
  "id": "city_456",
  "name": "Guédiawaye",
  "category": "Banlieue",
  "zoneType": "banlieue",
  "status": "inactive", // Changé de "active" à "inactive"
  "price": "2500.00",
  "isFree": false,
  "deliveryTimeMin": 2,
  "deliveryTimeMax": 4,
  "deliveryTimeUnit": "heures",
  "createdAt": "2025-01-02T10:00:00Z",
  "updatedAt": "2025-01-02T16:00:00Z"
}
```

---

## 🗺️ Regions (13 régions du Sénégal)

### GET /delivery/regions
Récupère toutes les régions

**Response:**
```typescript
// Status: 200 OK
[
  {
    "id": "region_1",
    "name": "Thiès",
    "status": "active",
    "price": "3000.00",
    "deliveryTimeMin": 6,
    "deliveryTimeMax": 12,
    "deliveryTimeUnit": "heures",
    "mainCities": "Thiès, Mbour",
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-01-01T10:00:00Z"
  }
]
```

### POST /delivery/regions
Crée une nouvelle région

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "name": "Kaolack",
  "status": "active",
  "price": 3500,
  "deliveryTimeMin": 8,
  "deliveryTimeMax": 16,
  "deliveryTimeUnit": "heures",
  "mainCities": "Kaolack, Fatick"
}
```

**Response:**
```typescript
// Status: 201 Created
{
  "id": "region_2",
  "name": "Kaolack",
  "status": "active",
  "price": "3500.00",
  "deliveryTimeMin": 8,
  "deliveryTimeMax": 16,
  "deliveryTimeUnit": "heures",
  "mainCities": "Kaolack, Fatick",
  "createdAt": "2025-01-02T11:00:00Z",
  "updatedAt": "2025-01-02T11:00:00Z"
}
```

### PUT /delivery/regions/:id
Met à jour une région

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "price": 4000,
  "deliveryTimeMin": 6,
  "deliveryTimeMax": 14
}
```

**Response:**
```typescript
// Status: 200 OK
{
  "id": "region_2",
  "name": "Kaolack",
  "status": "active",
  "price": "4000.00",
  "deliveryTimeMin": 6,
  "deliveryTimeMax": 14,
  "deliveryTimeUnit": "heures",
  "mainCities": "Kaolack, Fatick",
  "createdAt": "2025-01-02T11:00:00Z",
  "updatedAt": "2025-01-02T14:00:00Z"
}
```

### DELETE /delivery/regions/:id
Supprime une région

**Response:**
```typescript
// Status: 204 No Content
```

### PATCH /delivery/regions/:id/toggle-status
Change le statut d'une région

**Response:**
```typescript
// Status: 200 OK
{
  "id": "region_2",
  "name": "Kaolack",
  "status": "inactive", // Changé de "active" à "inactive"
  "price": "4000.00",
  "deliveryTimeMin": 6,
  "deliveryTimeMax": 14,
  "deliveryTimeUnit": "heures",
  "mainCities": "Kaolack, Fatick",
  "createdAt": "2025-01-02T11:00:00Z",
  "updatedAt": "2025-01-02T15:00:00Z"
}
```

---

## 🌍 International Zones

### GET /delivery/international-zones
Récupère toutes les zones internationales

**Response:**
```typescript
// Status: 200 OK
[
  {
    "id": "intl_1",
    "name": "Europe",
    "countries": ["France", "Belgique", "Suisse"],
    "status": "active",
    "price": "15000.00",
    "deliveryTimeMin": 3,
    "deliveryTimeMax": 7,
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-01-01T10:00:00Z"
  }
]
```

### POST /delivery/international-zones
Crée une nouvelle zone internationale

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "name": "Amérique du Nord",
  "countries": ["USA", "Canada", "Mexique"],
  "status": "active",
  "price": 25000,
  "deliveryTimeMin": 5,
  "deliveryTimeMax": 10
}
```

**Response:**
```typescript
// Status: 201 Created
{
  "id": "intl_2",
  "name": "Amérique du Nord",
  "countries": ["USA", "Canada", "Mexique"],
  "status": "active",
  "price": "25000.00",
  "deliveryTimeMin": 5,
  "deliveryTimeMax": 10,
  "createdAt": "2025-01-02T12:00:00Z",
  "updatedAt": "2025-01-02T12:00:00Z"
}
```

### PUT /delivery/international-zones/:id
Met à jour une zone internationale

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "price": 22000,
  "deliveryTimeMin": 4,
  "deliveryTimeMax": 8,
  "status": "active"
}
```

**Response:**
```typescript
// Status: 200 OK
{
  "id": "intl_2",
  "name": "Amérique du Nord",
  "countries": ["USA", "Canada", "Mexique"],
  "status": "active",
  "price": "22000.00",
  "deliveryTimeMin": 4,
  "deliveryTimeMax": 8,
  "createdAt": "2025-01-02T12:00:00Z",
  "updatedAt": "2025-01-02T16:00:00Z"
}
```

### DELETE /delivery/international-zones/:id
Supprime une zone internationale

**Response:**
```typescript
// Status: 204 No Content
```

### PATCH /delivery/international-zones/:id/toggle-status
Change le statut d'une zone internationale

**Response:**
```typescript
// Status: 200 OK
{
  "id": "intl_2",
  "name": "Amérique du Nord",
  "countries": ["USA", "Canada", "Mexique"],
  "status": "inactive", // Changé de "active" à "inactive"
  "price": "22000.00",
  "deliveryTimeMin": 4,
  "deliveryTimeMax": 8,
  "createdAt": "2025-01-02T12:00:00Z",
  "updatedAt": "2025-01-02T17:00:00Z"
}
```

---

## 🚚 Transporteurs

### GET /delivery/transporteurs
Récupère tous les transporteurs

**Response:**
```typescript
// Status: 200 OK
[
  {
    "id": "trans_1",
    "name": "Express Livraison SA",
    "logoUrl": "https://example.com/logo.png",
    "status": "active",
    "deliveryZones": ["city_123", "region_1"],
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-01-01T10:00:00Z"
  }
]
```

### POST /delivery/transporteurs
Crée un nouveau transporteur

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "name": "Rapide Service",
  "logoUrl": "https://example.com/rapide-logo.png",
  "deliveryZones": ["city_456", "region_2"],
  "status": "active"
}
```

**Response:**
```typescript
// Status: 201 Created
{
  "id": "trans_2",
  "name": "Rapide Service",
  "logoUrl": "https://example.com/rapide-logo.png",
  "status": "active",
  "deliveryZones": ["city_456", "region_2"],
  "createdAt": "2025-01-02T13:00:00Z",
  "updatedAt": "2025-01-02T13:00:00Z"
}
```

### PUT /delivery/transporteurs/:id
Met à jour un transporteur

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "name": "Rapide Service Plus",
  "deliveryZones": ["city_123", "city_456", "region_1"]
}
```

**Response:**
```typescript
// Status: 200 OK
{
  "id": "trans_2",
  "name": "Rapide Service Plus",
  "logoUrl": "https://example.com/rapide-logo.png",
  "status": "active",
  "deliveryZones": ["city_123", "city_456", "region_1"],
  "createdAt": "2025-01-02T13:00:00Z",
  "updatedAt": "2025-01-02T18:00:00Z"
}
```

### DELETE /delivery/transporteurs/:id
Supprime un transporteur

**Response:**
```typescript
// Status: 204 No Content
```

### PATCH /delivery/transporteurs/:id/toggle-status
Change le statut d'un transporteur

**Response:**
```typescript
// Status: 200 OK
{
  "id": "trans_2",
  "name": "Rapide Service Plus",
  "logoUrl": "https://example.com/rapide-logo.png",
  "status": "inactive", // Changé de "active" à "inactive"
  "deliveryZones": ["city_123", "city_456", "region_1"],
  "createdAt": "2025-01-02T13:00:00Z",
  "updatedAt": "2025-01-02T19:00:00Z"
}
```

---

## 💰 Zone Tarifs

### GET /delivery/zone-tarifs
Récupère tous les tarifs des zones

**Response:**
```typescript
// Status: 200 OK
[
  {
    "id": "tarif_1",
    "zoneId": "city_123",
    "zoneName": "Dakar",
    "transporteurId": "trans_1",
    "transporteurName": "Express Livraison SA",
    "prixTransporteur": "1200.00",
    "prixStandardInternational": "8000.00",
    "delaiLivraisonMin": 1,
    "delaiLivraisonMax": 3,
    "status": "active",
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-01-01T10:00:00Z"
  }
]
```

### POST /delivery/zone-tarifs
Crée un nouveau tarif de zone

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "zoneId": "region_2",
  "zoneName": "Kaolack",
  "transporteurId": "trans_2",
  "transporteurName": "Rapide Service Plus",
  "prixTransporteur": 3000,
  "prixStandardInternational": 18000,
  "delaiLivraisonMin": 6,
  "delaiLivraisonMax": 10,
  "status": "active"
}
```

**Response:**
```typescript
// Status: 201 Created
{
  "id": "tarif_2",
  "zoneId": "region_2",
  "zoneName": "Kaolack",
  "transporteurId": "trans_2",
  "transporteurName": "Rapide Service Plus",
  "prixTransporteur": "3000.00",
  "prixStandardInternational": "18000.00",
  "delaiLivraisonMin": 6,
  "delaiLivraisonMax": 10,
  "status": "active",
  "createdAt": "2025-01-02T14:00:00Z",
  "updatedAt": "2025-01-02T14:00:00Z"
}
```

### PUT /delivery/zone-tarifs/:id
Met à jour un tarif de zone

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
{
  "prixTransporteur": 3200,
  "delaiLivraisonMin": 5,
  "delaiLivraisonMax": 9
}
```

**Response:**
```typescript
// Status: 200 OK
{
  "id": "tarif_2",
  "zoneId": "region_2",
  "zoneName": "Kaolack",
  "transporteurId": "trans_2",
  "transporteurName": "Rapide Service Plus",
  "prixTransporteur": "3200.00",
  "prixStandardInternational": "18000.00",
  "delaiLivraisonMin": 5,
  "delaiLivraisonMax": 9,
  "status": "active",
  "createdAt": "2025-01-02T14:00:00Z",
  "updatedAt": "2025-01-02T20:00:00Z"
}
```

### DELETE /delivery/zone-tarifs/:id
Supprime un tarif de zone

**Response:**
```typescript
// Status: 204 No Content
```

### PATCH /delivery/zone-tarifs/:id/toggle-status
Change le statut d'un tarif de zone

**Response:**
```typescript
// Status: 200 OK
{
  "id": "tarif_2",
  "zoneId": "region_2",
  "zoneName": "Kaolack",
  "transporteurId": "trans_2",
  "transporteurName": "Rapide Service Plus",
  "prixTransporteur": "3200.00",
  "prixStandardInternational": "18000.00",
  "delaiLivraisonMin": 5,
  "delaiLivraisonMax": 9,
  "status": "inactive", // Changé de "active" à "inactive"
  "createdAt": "2025-01-02T14:00:00Z",
  "updatedAt": "2025-01-02T21:00:00Z"
}
```

---

## 🧮 Calcul des Frais de Livraison

### GET /delivery/calculate-fee
Calcule les frais de livraison selon la zone

**Request:**
```typescript
// Headers: Authorization: Bearer <token>
// Query parameters (un seul requis):
GET /delivery/calculate-fee?cityId=city_123
GET /delivery/calculate-fee?regionId=region_1
GET /delivery/calculate-fee?internationalZoneId=intl_1
```

**Response:**
```typescript
// Status: 200 OK
{
  "fee": 1500,
  "deliveryTime": "2-4 heures"
}
```

---

## ❌ Codes d'erreur

### Erreurs communes

**400 Bad Request**
```typescript
{
  "message": "Invalid request data",
  "errors": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    }
  ]
}
```

**401 Unauthorized**
```typescript
{
  "message": "Authentication required"
}
```

**403 Forbidden**
```typescript
{
  "message": "Insufficient permissions"
}
```

**404 Not Found**
```typescript
{
  "message": "Resource not found"
}
```

**409 Conflict**
```typescript
{
  "message": "City with this name already exists"
}
```

**500 Internal Server Error**
```typescript
{
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## 🔧 Configuration des services

### deliveryService.ts (Fetch natif)
```typescript
// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

// Headers automatiques
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}

// Credentials inclus pour les cookies
credentials: 'include'
```

### deliveryApiService.ts (Axios)
```typescript
// Instance Axios configurée
axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// Intercepteurs automatiques
- Ajout du token Bearer
- Gestion centralisée des erreurs
- Logs des requêtes/réponses
```

## 🔄 Workflow de gestion

### 1. Configuration initiale

1. **Définir les zones de livraison**:
   - Villes (Dakar ville et banlieue)
   - Régions (13 régions du Sénégal)
   - Zones internationales

2. **Configurer les transporteurs**:
   - Ajouter les transporteurs disponibles
   - Leur assigner les zones d'intervention
   - Définir leurs tarifs spécifiques

3. **Paramétrer les options**:
   - Activer/désactiver le paiement à la livraison
   - Configurer les tarifs de base
   - Définir les options de livraison programmée

### 2. Gestion quotidienne

1. **Suivi des livraisons**:
   - Monitorer les livraisons en cours
   - Gérer les retards et annulations
   - Communiquer avec les transporteurs

2. **Maintenance des zones**:
   - Ajouter de nouvelles zones
   - Mettre à jour les tarifs
   - Gérer les zones actives/inactives

### 3. Rapports et analyses

1. **Performance des transporteurs**:
   - Temps moyen de livraison
   - Nombre de livraisons effectuées
   - Satisfaction client

2. **Analyse des zones**:
   - Volume de livraison par zone
   - Rentabilité par zone
   - Zones à optimiser

## ✅ Bonnes pratiques

### Performance

1. **Utiliser React Query** pour le cache des données de zones
2. **Pagination** pour les listes de livraisons importantes
3. **Mémoisation** des composants complexes (DeliveryTrackingDashboard)

### Sécurité

1. **Validation des inputs** côté client avant envoi à l'API
2. **Gestion des erreurs** avec messages explicites
3. **Permissions** : vérifier les droits d'administration

### UX/UI

1. **Feedback visuel** immédiat lors des actions
2. **Confirmation** pour les actions destructives (suppression)
3. **Indicateurs de chargement** pendant les appels API
4. **Messages d'erreur** clairs et actionnables

### Code

1. **Typage TypeScript** strict pour tous les composants
2. **Composants réutilisables** pour les patterns UI communs
3. **Services centralisés** pour la logique API
4. **Gestion d'état** locale ou globale selon la complexité

### Maintenance

1. **Documentation** des types complexes
2. **Tests unitaires** pour les fonctions critiques
3. **Gestion des erreurs** robuste avec logs
4. **Surveillance** des performances API

## 🚀 Évolutions possibles

1. **Intégration GPS** pour le suivi en temps réel
2. **Notifications push** pour les mises à jour de statut
3. **Optimisation algorithmique** des tournées
4. **Interface mobile** pour les transporteurs
5. **Analytics avancés** avec graphiques et prédictions
6. **Intégration paiement** pour la validation automatique

---

## 📞 Support

Pour toute question ou problème concernant le système de livraison :

1. Consulter la documentation technique de l'API
2. Vérifier les logs dans la console du navigateur
3. Contacter l'équipe de développement avec les détails de l'erreur

**Dernière mise à jour**: 23/11/2025
**Version**: 1.0.0