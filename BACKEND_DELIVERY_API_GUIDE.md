# Guide d'Implémentation Backend - API de Gestion des Zones de Livraison

## Vue d'ensemble

Ce document décrit l'implémentation complète de l'API backend nécessaire pour gérer les zones de livraison du système PrintAlma. Le frontend est déjà implémenté et attend ces endpoints pour fonctionner.

## Architecture de la Base de Données

### Tables Principales

#### 1. `delivery_cities` - Villes de Dakar et Banlieue

```sql
CREATE TABLE delivery_cities (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Centre', 'Résidentiel', 'Populaire', 'Banlieue'
  zone_type VARCHAR(50) NOT NULL, -- 'dakar-ville' ou 'banlieue'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' ou 'inactive'
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  delivery_time_min INT, -- en heures ou jours
  delivery_time_max INT,
  delivery_time_unit VARCHAR(10), -- 'heures' ou 'jours'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_zone_type (zone_type),
  INDEX idx_status (status)
);
```

**Données Initiales:**
- Dakar Ville: Plateau, Médina, Point E, Fann, HLM, Ouakam, Ngor, Yoff, Sacré-Coeur, Mermoz, Almadies, etc.
- Banlieue: Pikine, Guédiawaye, Thiaroye-sur-Mer, Keur Massar, Rufisque, Malika, etc.

#### 2. `delivery_regions` - 13 Régions du Sénégal (hors Dakar)

```sql
CREATE TABLE delivery_regions (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  price DECIMAL(10, 2) NOT NULL,
  delivery_time_min INT NOT NULL, -- en jours
  delivery_time_max INT NOT NULL,
  delivery_time_unit VARCHAR(10) NOT NULL DEFAULT 'jours',
  main_cities TEXT, -- Liste des principales villes de la région
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);
```

**Régions à Pré-remplir:**
- Diourbel, Fatick, Kaffrine, Kaolack, Kédougou, Kolda, Louga, Matam, Saint-Louis, Sédhiou, Tambacounda, Thiès, Ziguinchor

#### 3. `delivery_international_zones` - Zones Internationales

```sql
CREATE TABLE delivery_international_zones (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  price DECIMAL(10, 2) NOT NULL,
  delivery_time_min INT NOT NULL, -- en jours
  delivery_time_max INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);
```

#### 4. `delivery_international_countries` - Pays des Zones Internationales

```sql
CREATE TABLE delivery_international_countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  zone_id VARCHAR(50) NOT NULL,
  country VARCHAR(255) NOT NULL,
  FOREIGN KEY (zone_id) REFERENCES delivery_international_zones(id) ON DELETE CASCADE,
  INDEX idx_zone_id (zone_id)
);
```

#### 5. `delivery_transporteurs` - Transporteurs

```sql
CREATE TABLE delivery_transporteurs (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);
```

#### 6. `delivery_transporteur_zones` - Zones de Livraison des Transporteurs

```sql
CREATE TABLE delivery_transporteur_zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transporteur_id VARCHAR(50) NOT NULL,
  zone_id VARCHAR(50) NOT NULL,
  zone_type VARCHAR(50) NOT NULL, -- 'city', 'region', 'international'
  FOREIGN KEY (transporteur_id) REFERENCES delivery_transporteurs(id) ON DELETE CASCADE,
  INDEX idx_transporteur (transporteur_id),
  INDEX idx_zone (zone_id, zone_type)
);
```

#### 7. `delivery_zone_tarifs` - Tarifs par Zone et Transporteur

```sql
CREATE TABLE delivery_zone_tarifs (
  id VARCHAR(50) PRIMARY KEY,
  zone_id VARCHAR(50) NOT NULL,
  zone_name VARCHAR(255) NOT NULL,
  transporteur_id VARCHAR(50) NOT NULL,
  transporteur_name VARCHAR(255) NOT NULL,
  prix_transporteur DECIMAL(10, 2) NOT NULL,
  prix_standard_international DECIMAL(10, 2) NOT NULL,
  delai_livraison_min INT NOT NULL,
  delai_livraison_max INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (transporteur_id) REFERENCES delivery_transporteurs(id) ON DELETE CASCADE,
  INDEX idx_zone (zone_id),
  INDEX idx_transporteur (transporteur_id),
  INDEX idx_status (status)
);
```

---

## Endpoints API à Implémenter

### Base URL: `/api/delivery`

---

## 1. CITIES (Villes Dakar & Banlieue)

### GET `/api/delivery/cities`
Récupère toutes les villes

**Query Parameters:**
- `zoneType` (optional): `'dakar-ville'` ou `'banlieue'` pour filtrer

**Response:**
```json
[
  {
    "id": "1",
    "name": "Plateau",
    "category": "Centre",
    "zoneType": "dakar-ville",
    "status": "active",
    "price": 0,
    "isFree": true,
    "deliveryTimeMin": null,
    "deliveryTimeMax": null,
    "deliveryTimeUnit": null
  }
]
```

### GET `/api/delivery/cities/:id`
Récupère une ville spécifique

**Response:**
```json
{
  "id": "1",
  "name": "Plateau",
  "category": "Centre",
  "zoneType": "dakar-ville",
  "status": "active",
  "price": 0,
  "isFree": true
}
```

### POST `/api/delivery/cities`
Crée une nouvelle ville

**Body:**
```json
{
  "name": "Nouvelle Ville",
  "category": "Résidentiel",
  "zoneType": "dakar-ville",
  "status": "active",
  "price": 1500,
  "isFree": false,
  "deliveryTimeMin": 24,
  "deliveryTimeMax": 48,
  "deliveryTimeUnit": "heures"
}
```

**Response:** Ville créée (201 Created)

### PUT `/api/delivery/cities/:id`
Met à jour une ville

**Body:** Champs partiels de City

**Response:** Ville mise à jour

### DELETE `/api/delivery/cities/:id`
Supprime une ville

**Response:** 204 No Content

### PATCH `/api/delivery/cities/:id/toggle-status`
Change le statut d'une ville (active ↔ inactive)

**Response:** Ville mise à jour

---

## 2. REGIONS (13 Régions du Sénégal)

### GET `/api/delivery/regions`
Récupère toutes les régions

**Response:**
```json
[
  {
    "id": "r1",
    "name": "Diourbel",
    "status": "active",
    "price": 3000,
    "deliveryTimeMin": 2,
    "deliveryTimeMax": 4,
    "deliveryTimeUnit": "jours",
    "mainCities": "Diourbel, Bambey, Mbacké"
  }
]
```

### GET `/api/delivery/regions/:id`
Récupère une région spécifique

### POST `/api/delivery/regions`
Crée une nouvelle région

**Body:**
```json
{
  "name": "Nouvelle Région",
  "status": "active",
  "price": 3500,
  "deliveryTimeMin": 3,
  "deliveryTimeMax": 5,
  "deliveryTimeUnit": "jours",
  "mainCities": "Ville1, Ville2, Ville3"
}
```

### PUT `/api/delivery/regions/:id`
Met à jour une région

### DELETE `/api/delivery/regions/:id`
Supprime une région

### PATCH `/api/delivery/regions/:id/toggle-status`
Change le statut d'une région

---

## 3. INTERNATIONAL ZONES (Zones Internationales)

### GET `/api/delivery/international-zones`
Récupère toutes les zones internationales avec leurs pays

**Response:**
```json
[
  {
    "id": "iz1",
    "name": "Afrique de l'Ouest",
    "countries": ["Mali", "Mauritanie", "Guinée", "Côte d'Ivoire"],
    "status": "active",
    "price": 15000,
    "deliveryTimeMin": 5,
    "deliveryTimeMax": 10
  }
]
```

**Note:** Faire une jointure avec `delivery_international_countries` pour récupérer les pays

### GET `/api/delivery/international-zones/:id`
Récupère une zone internationale spécifique

### POST `/api/delivery/international-zones`
Crée une nouvelle zone internationale

**Body:**
```json
{
  "name": "Nouvelle Zone",
  "countries": ["Pays1", "Pays2"],
  "status": "active",
  "price": 20000,
  "deliveryTimeMin": 7,
  "deliveryTimeMax": 14
}
```

**Logique Backend:**
1. Créer l'entrée dans `delivery_international_zones`
2. Créer les entrées correspondantes dans `delivery_international_countries`

### PUT `/api/delivery/international-zones/:id`
Met à jour une zone internationale

**Logique Backend:**
1. Mettre à jour `delivery_international_zones`
2. Si `countries` est fourni, supprimer les anciennes entrées et créer les nouvelles dans `delivery_international_countries`

### DELETE `/api/delivery/international-zones/:id`
Supprime une zone internationale (cascade sur les pays)

### PATCH `/api/delivery/international-zones/:id/toggle-status`
Change le statut d'une zone internationale

---

## 4. TRANSPORTEURS

### GET `/api/delivery/transporteurs`
Récupère tous les transporteurs avec leurs zones

**Response:**
```json
[
  {
    "id": "t1",
    "name": "DHL",
    "logoUrl": "https://example.com/dhl-logo.png",
    "deliveryZones": ["Zone1", "Zone2"],
    "status": "active"
  }
]
```

**Note:** Faire une jointure avec `delivery_transporteur_zones` pour récupérer les zones

### GET `/api/delivery/transporteurs/:id`
Récupère un transporteur spécifique

### POST `/api/delivery/transporteurs`
Crée un nouveau transporteur

**Body:**
```json
{
  "name": "Nouveau Transporteur",
  "logoUrl": "https://example.com/logo.png",
  "deliveryZones": ["zone1", "zone2"],
  "status": "active"
}
```

**Logique Backend:**
1. Créer l'entrée dans `delivery_transporteurs`
2. Créer les entrées correspondantes dans `delivery_transporteur_zones`

### PUT `/api/delivery/transporteurs/:id`
Met à jour un transporteur

### DELETE `/api/delivery/transporteurs/:id`
Supprime un transporteur

### PATCH `/api/delivery/transporteurs/:id/toggle-status`
Change le statut d'un transporteur

---

## 5. ZONE TARIFS (Association Zone + Transporteur)

### GET `/api/delivery/zone-tarifs`
Récupère tous les tarifs de zones

**Response:**
```json
[
  {
    "id": "zt1",
    "zoneId": "iz1",
    "zoneName": "Afrique de l'Ouest",
    "transporteurId": "t1",
    "transporteurName": "DHL",
    "prixTransporteur": 25000,
    "prixStandardInternational": 15000,
    "delaiLivraisonMin": 5,
    "delaiLivraisonMax": 10,
    "status": "active"
  }
]
```

### GET `/api/delivery/zone-tarifs/:id`
Récupère un tarif de zone spécifique

### POST `/api/delivery/zone-tarifs`
Crée un nouveau tarif de zone

**Body:**
```json
{
  "zoneId": "iz1",
  "zoneName": "Afrique de l'Ouest",
  "transporteurId": "t1",
  "transporteurName": "DHL",
  "prixTransporteur": 25000,
  "prixStandardInternational": 15000,
  "delaiLivraisonMin": 5,
  "delaiLivraisonMax": 10,
  "status": "active"
}
```

### PUT `/api/delivery/zone-tarifs/:id`
Met à jour un tarif de zone

### DELETE `/api/delivery/zone-tarifs/:id`
Supprime un tarif de zone

### PATCH `/api/delivery/zone-tarifs/:id/toggle-status`
Change le statut d'un tarif de zone

---

## 6. CALCUL DE FRAIS DE LIVRAISON

### GET `/api/delivery/calculate-fee`
Calcule les frais de livraison pour une commande

**Query Parameters:**
- `cityId` (optional): ID de la ville
- `regionId` (optional): ID de la région
- `internationalZoneId` (optional): ID de la zone internationale

**Logique:**
- Un seul des paramètres doit être fourni
- Si `cityId`: récupérer le prix de la ville
- Si `regionId`: récupérer le prix de la région
- Si `internationalZoneId`: récupérer le prix de la zone internationale

**Response:**
```json
{
  "fee": 1500,
  "deliveryTime": "24-48 heures"
}
```

---

## Sécurité et Authentification

### Middleware d'Authentification

Tous les endpoints de création, modification et suppression doivent être protégés:

```javascript
// Exemple Express.js
router.use('/api/delivery', requireAuth, requireAdmin);
```

**Vérifications:**
1. Token JWT valide
2. Rôle utilisateur = `admin`
3. Token non expiré

### Validation des Données

Pour chaque endpoint POST/PUT, valider:
- Formats des champs (email, URL, etc.)
- Types de données
- Valeurs min/max pour les prix et délais
- Unicité des noms (villes, régions, zones)

---

## Gestion des Erreurs

### Codes de Statut HTTP

- `200 OK`: Requête réussie (GET, PUT, PATCH)
- `201 Created`: Ressource créée (POST)
- `204 No Content`: Suppression réussie (DELETE)
- `400 Bad Request`: Données invalides
- `401 Unauthorized`: Non authentifié
- `403 Forbidden`: Non autorisé (pas admin)
- `404 Not Found`: Ressource introuvable
- `409 Conflict`: Conflit (nom déjà existant)
- `500 Internal Server Error`: Erreur serveur

### Format des Erreurs

```json
{
  "error": true,
  "message": "Description claire de l'erreur",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## Données Initiales à Pré-remplir

### Villes de Dakar Ville (Livraison Gratuite)

```sql
INSERT INTO delivery_cities (id, name, category, zone_type, status, price, is_free) VALUES
('1', 'Plateau', 'Centre', 'dakar-ville', 'active', 0, true),
('2', 'Médina', 'Centre', 'dakar-ville', 'active', 0, true),
('3', 'Point E', 'Centre', 'dakar-ville', 'active', 0, true),
('4', 'Fann', 'Centre', 'dakar-ville', 'active', 0, true),
('5', 'Colobane', 'Centre', 'dakar-ville', 'active', 0, true);
```

### Villes de Dakar Ville (Payantes)

```sql
INSERT INTO delivery_cities (id, name, category, zone_type, status, price, is_free) VALUES
('6', 'HLM', 'Résidentiel', 'dakar-ville', 'active', 1500, false),
('7', 'Ouakam', 'Résidentiel', 'dakar-ville', 'active', 1500, false),
('8', 'Ngor', 'Résidentiel', 'dakar-ville', 'active', 2000, false),
('9', 'Yoff', 'Résidentiel', 'dakar-ville', 'active', 1500, false),
('10', 'Sacré-Coeur', 'Résidentiel', 'dakar-ville', 'active', 1000, false),
('11', 'Mermoz', 'Résidentiel', 'dakar-ville', 'active', 1000, false),
('12', 'Almadies', 'Résidentiel', 'dakar-ville', 'active', 2500, false);
```

### Banlieue de Dakar

```sql
INSERT INTO delivery_cities (id, name, category, zone_type, status, price, is_free, delivery_time_min, delivery_time_max, delivery_time_unit) VALUES
('b1', 'Pikine', 'Banlieue', 'banlieue', 'active', 2000, false, 48, 72, 'heures'),
('b2', 'Guédiawaye', 'Banlieue', 'banlieue', 'active', 1800, false, 48, 72, 'heures'),
('b3', 'Thiaroye-sur-Mer', 'Banlieue', 'banlieue', 'active', 2200, false, 48, 72, 'heures'),
('b4', 'Keur Massar', 'Banlieue', 'banlieue', 'active', 2000, false, 48, 72, 'heures'),
('b5', 'Rufisque', 'Banlieue', 'banlieue', 'active', 2200, false, 48, 72, 'heures'),
('b6', 'Malika', 'Banlieue', 'banlieue', 'active', 2500, false, 48, 72, 'heures');
```

### 13 Régions du Sénégal

```sql
INSERT INTO delivery_regions (id, name, status, price, delivery_time_min, delivery_time_max, delivery_time_unit, main_cities) VALUES
('r1', 'Diourbel', 'active', 3000, 2, 4, 'jours', 'Diourbel, Bambey, Mbacké'),
('r2', 'Fatick', 'active', 3200, 2, 4, 'jours', 'Fatick, Foundiougne, Gossas'),
('r3', 'Kaffrine', 'active', 3500, 3, 5, 'jours', 'Kaffrine, Koungheul, Birkelane'),
('r4', 'Kaolack', 'active', 2800, 2, 4, 'jours', 'Kaolack, Guinguinéo, Nioro du Rip'),
('r5', 'Kédougou', 'active', 5000, 5, 7, 'jours', 'Kédougou, Saraya, Salémata'),
('r6', 'Kolda', 'active', 4500, 4, 6, 'jours', 'Kolda, Vélingara, Médina Yoro Foulah'),
('r7', 'Louga', 'active', 2500, 2, 3, 'jours', 'Louga, Linguère, Kébémer'),
('r8', 'Matam', 'active', 4000, 3, 5, 'jours', 'Matam, Kanel, Ranérou'),
('r9', 'Saint-Louis', 'active', 2200, 1, 3, 'jours', 'Saint-Louis, Dagana, Podor'),
('r10', 'Sédhiou', 'active', 4200, 4, 6, 'jours', 'Sédhiou, Goudomp, Bounkiling'),
('r11', 'Tambacounda', 'active', 4800, 4, 6, 'jours', 'Tambacounda, Bakel, Goudiry'),
('r12', 'Thiès', 'active', 2000, 1, 2, 'jours', 'Thiès, Mbour, Tivaouane'),
('r13', 'Ziguinchor', 'active', 5000, 5, 7, 'jours', 'Ziguinchor, Oussouye, Bignona');
```

---

## Tests Recommandés

### Tests Unitaires

Pour chaque endpoint, tester:
1. Création réussie avec données valides
2. Validation des données (données invalides rejetées)
3. Mise à jour réussie
4. Suppression réussie
5. Toggle status fonctionne correctement
6. Erreurs 404 pour ressources inexistantes
7. Erreurs 401/403 pour accès non autorisés

### Tests d'Intégration

1. Création d'une zone internationale avec plusieurs pays
2. Mise à jour d'une zone internationale (modification des pays)
3. Suppression en cascade (zone → pays)
4. Création d'un transporteur avec plusieurs zones
5. Calcul correct des frais de livraison
6. Filtrage des villes par zone_type

---

## Optimisations Recommandées

### Index Base de Données

Les index suivants sont recommandés pour améliorer les performances:

```sql
CREATE INDEX idx_delivery_cities_zone_status ON delivery_cities(zone_type, status);
CREATE INDEX idx_delivery_regions_status ON delivery_regions(status);
CREATE INDEX idx_delivery_zones_status ON delivery_international_zones(status);
CREATE INDEX idx_delivery_transporteurs_status ON delivery_transporteurs(status);
CREATE INDEX idx_delivery_tarifs_zone_transporteur ON delivery_zone_tarifs(zone_id, transporteur_id);
```

### Cache

Mettre en cache les données suivantes (durée: 1 heure):
- Liste des villes actives
- Liste des régions actives
- Liste des zones internationales actives
- Liste des transporteurs actifs

Invalider le cache lors des opérations de création/modification/suppression.

---

## Exemple d'Utilisation Frontend

Le frontend utilise le service `deliveryService.ts` pour interagir avec l'API:

```typescript
import deliveryService from '@/services/deliveryService';

// Récupérer toutes les villes de Dakar
const cities = await deliveryService.getCities('dakar-ville');

// Créer une nouvelle ville
const newCity = await deliveryService.createCity({
  name: 'Nouvelle Ville',
  category: 'Résidentiel',
  zoneType: 'dakar-ville',
  status: 'active',
  price: 1500,
  isFree: false
});

// Calculer les frais de livraison
const { fee, deliveryTime } = await deliveryService.calculateDeliveryFee(
  cityId: 'city123'
);
```

---

## Questions Fréquentes

### Q: Comment gérer les zones de livraison qui changent de prix?
**R:** Utiliser l'endpoint PUT pour mettre à jour le prix. L'historique peut être géré avec une table d'audit si nécessaire.

### Q: Peut-on avoir des tarifs différents pour le même transporteur selon la zone?
**R:** Oui, c'est l'objectif de la table `delivery_zone_tarifs` qui associe un transporteur à une zone avec un tarif spécifique.

### Q: Comment gérer les promotions (livraison gratuite temporaire)?
**R:** Créer une table séparée `delivery_promotions` avec des dates de début/fin et des conditions. À implémenter dans une future version.

### Q: Faut-il versionner l'API?
**R:** Recommandé. Utiliser `/api/v1/delivery/...` pour permettre les évolutions futures.

---

## Contact & Support

Pour toute question sur l'implémentation backend:
- Consulter la documentation frontend: `src/services/deliveryService.ts`
- Consulter la page frontend: `src/pages/admin/ZonesLivraisonPage.tsx`
- Types TypeScript: Voir les interfaces dans `deliveryService.ts`

---

**Version:** 1.0
**Date:** 2025-11-21
**Auteur:** Claude Code - PrintAlma Team
