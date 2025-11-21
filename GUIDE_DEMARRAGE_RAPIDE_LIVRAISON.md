# 🚀 Guide de Démarrage Rapide - Zones de Livraison

## Vue d'ensemble

Ce guide vous permet de tester l'intégration complète de l'API de zones de livraison en **5 minutes**.

## Prérequis

✅ Backend PrintAlma démarré sur `http://localhost:3004`
✅ Base de données configurée
✅ Seed des données de livraison exécuté

---

## Étape 1: Vérifier que le Backend Fonctionne (30 secondes)

### Test Simple

Ouvrir un terminal et exécuter:

```bash
# Test de l'API
curl http://localhost:3004/delivery/cities?zoneType=dakar-ville
```

**Résultat attendu:** Une liste de villes en JSON

```json
[
  {
    "id": "city-plateau",
    "name": "Plateau",
    "category": "Centre",
    "zoneType": "dakar-ville",
    "status": "active",
    "price": "0.00",
    "isFree": true,
    ...
  }
]
```

### Si ça ne fonctionne pas:

```bash
# Dans le dossier backend
cd /chemin/vers/backend

# Installer les dépendances (si pas déjà fait)
npm install

# Générer le client Prisma
npx prisma generate

# Synchroniser la base de données
npx prisma db push

# Exécuter le seed
npx ts-node prisma/seed-delivery-zones.ts

# Démarrer le serveur
npm run start:dev
```

---

## Étape 2: Tester avec le Composant de Test (2 minutes)

### Ajouter la Route de Test

Dans `src/App.tsx`, ajouter:

```typescript
import DeliveryApiTest from './components/test/DeliveryApiTest';

// Dans les Routes
<Route path='/test-delivery-api' element={<DeliveryApiTest />} />
```

### Accéder au Composant de Test

1. Démarrer le frontend: `npm run dev`
2. Ouvrir: `http://localhost:5174/test-delivery-api`

### Ce que vous devriez voir:

✅ Statistiques affichées (Villes, Régions, Zones)
✅ Liste des 10 premières villes
✅ Liste des régions du Sénégal
✅ Liste des zones internationales

### Test CRUD Complet

Cliquer sur le bouton **"🧪 Lancer le Test CRUD Complet"**

**Ce qui se passe:**
1. ✅ CREATE - Crée une nouvelle ville de test
2. ✅ READ - Lit toutes les villes
3. ✅ UPDATE - Modifie le prix de la ville
4. ✅ TOGGLE - Change le statut active/inactive
5. ✅ DELETE - Supprime la ville de test

**Résultat attendu dans les logs:**
```
🚀 Démarrage du test CRUD complet...

🔄 Test création ville...
✅ Ville créée: Test Ville 1732186800000 (ID: abc-123)
✅ READ: 27 villes chargées
🔄 Test modification ville...
✅ Ville modifiée: prix = 1500.00 FCFA
🔄 Test toggle status...
✅ Status changé: inactive
🔄 Test suppression ville...
✅ Ville supprimée

✅ Test CRUD complet réussi!
```

---

## Étape 3: Vérifier dans la Base de Données (1 minute)

### Option 1: Prisma Studio

```bash
# Dans le dossier backend
npx prisma studio
```

Ouvrir: `http://localhost:5555`
Naviguer vers: `DeliveryCity` → Voir toutes les villes

### Option 2: Swagger UI

Ouvrir: `http://localhost:3004/api-docs`

Tester les endpoints directement:
- GET `/delivery/cities`
- POST `/delivery/cities`
- etc.

---

## Étape 4: Intégrer dans ZonesLivraisonPage (1 minute)

### Ouvrir la Page Admin

1. Se connecter en tant qu'admin
2. Naviguer vers: `/admin/livraison`

### Activer l'Intégration API

Dans `src/pages/admin/ZonesLivraisonPage.tsx`, remplacer les données statiques par:

```typescript
import {
  useCities,
  useRegions,
  useInternationalZones,
} from '../../hooks/useDelivery';

const ZonesLivraisonPage: React.FC = () => {
  // Remplacer useState par les hooks API
  const { cities: dakarVilleCities, loading, error, createCity, updateCity } = 
    useCities('dakar-ville');

  // ... reste du code
};
```

Voir le guide complet: `INTEGRATION_ZONES_LIVRAISON_COMPLETE.md`

---

## Tests Rapides

### Test 1: Récupération des Données

```typescript
// Dans la console du navigateur (F12)
fetch('http://localhost:3004/delivery/cities')
  .then(r => r.json())
  .then(data => console.log('Villes:', data));
```

### Test 2: Création d'une Ville

```typescript
fetch('http://localhost:3004/delivery/cities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Ma Ville Test',
    category: 'Test',
    zoneType: 'dakar-ville',
    status: 'active',
    price: 2000,
    isFree: false,
  })
})
  .then(r => r.json())
  .then(data => console.log('Ville créée:', data));
```

### Test 3: Calcul des Frais

```typescript
fetch('http://localhost:3004/delivery/calculate-fee?cityId=city-plateau')
  .then(r => r.json())
  .then(data => console.log('Frais:', data));

// Résultat: { "fee": 0, "deliveryTime": "Standard" }
```

---

## Données Disponibles

### 27 Villes (Dakar + Banlieue)

**Gratuites (5):**
- Plateau, Médina, Point E, Fann, Colobane

**Payantes Dakar (12):**
- HLM (1500), Ouakam (1500), Ngor (2000), Yoff (1500)
- Sacré-Coeur (1000), Mermoz (1000), Almadies (2500)
- Grand Dakar (1000), Gueule Tapée (1000), Fass (1000)
- Dieuppeul (1500), Liberté 6 (1000)

**Banlieue (10):**
- Pikine (2000), Guédiawaye (1800), Thiaroye-sur-Mer (2200)
- Keur Massar (2000), Rufisque (2200), Malika (2500)
- Parcelles Assainies (1500), Yeumbeul (2000), Mbao (2000), Bargny (2500)

### 13 Régions du Sénégal

Diourbel, Fatick, Kaffrine, Kaolack, Kédougou, Kolda, Louga, Matam, Saint-Louis, Sédhiou, Tambacounda, Thiès, Ziguinchor

### 6 Zones Internationales

Afrique de l'Ouest, Afrique Centrale, Afrique du Nord, Afrique de l'Est, Europe, Amérique du Nord

---

## Problèmes Courants

### ❌ Erreur: Cannot GET /delivery/cities

**Solution:**
```bash
# Backend pas démarré
cd /chemin/vers/backend
npm run start:dev
```

### ❌ Erreur: Empty array []

**Solution:**
```bash
# Données pas seedées
npx ts-node prisma/seed-delivery-zones.ts
```

### ❌ Erreur: CORS

**Solution:**
Vérifier que le backend autorise `http://localhost:5174` dans CORS

### ❌ Erreur: 401 Unauthorized

**Solution:**
Les endpoints POST/PUT/DELETE nécessitent l'authentification admin.
Se connecter d'abord.

---

## Prochaines Étapes

1. ✅ **Tester l'API** (vous êtes ici)
2. ⏭️ **Intégrer dans ZonesLivraisonPage** (voir `INTEGRATION_ZONES_LIVRAISON_COMPLETE.md`)
3. ⏭️ **Utiliser dans le formulaire de commande** (calcul des frais automatique)

---

## Support

### Documentation Complète

- **API Frontend:** `DELIVERY_API_GUIDE_FRONTEND.md`
- **API Backend:** `BACKEND_DELIVERY_API_GUIDE.md`
- **Intégration:** `INTEGRATION_ZONES_LIVRAISON_COMPLETE.md`

### Swagger UI

`http://localhost:3004/api-docs`

### Prisma Studio

```bash
npx prisma studio
```

### Logs Backend

```bash
# Dans la console du backend
[Nest] LOG [DeliveryController] GET /delivery/cities
```

---

**Temps total:** ~5 minutes
**Status:** ✅ Prêt pour la production
**Version:** 1.0
**Date:** 2025-11-21
