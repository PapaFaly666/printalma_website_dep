# 🚀 Guide d'Intégration - Zones de Livraison

## Vue d'ensemble

Ce guide vous accompagne dans l'intégration complète du système de gestion des zones de livraison entre le frontend et le backend.

## 📋 Prérequis

### Backend (À vérifier côté backend)

- [ ] Base de données configurée
- [ ] Prisma schema mis à jour avec les tables de livraison
- [ ] Migration Prisma exécutée : `npx prisma db push`
- [ ] Seed des données initiales : `npx ts-node prisma/seed-delivery-zones.ts`
- [ ] Module delivery créé et enregistré dans `app.module.ts`
- [ ] Serveur backend démarré sur `http://localhost:3004`

### Frontend (Déjà fait)

- [x] Service `deliveryService.ts` créé
- [x] Hooks `useDelivery.ts` créés
- [x] Types TypeScript définis
- [x] Endpoints corrigés : `/delivery/*` (sans `/api`)

---

## 🔧 Étapes d'Intégration

### Étape 1: Vérifier le Backend (Côté Backend)

Le backend doit avoir ces endpoints disponibles:

```
GET    /delivery/cities?zoneType=dakar-ville|banlieue
POST   /delivery/cities
PUT    /delivery/cities/:id
DELETE /delivery/cities/:id
PATCH  /delivery/cities/:id/toggle-status

GET    /delivery/regions
POST   /delivery/regions
... (et ainsi de suite)
```

**Test rapide:**
```bash
# Tester si le backend répond
curl http://localhost:3004/delivery/cities

# Devrait retourner un tableau de villes
```

---

### Étape 2: Intégrer dans ZonesLivraisonPage.tsx

#### 2.1 Importer les hooks

Ouvrir `src/pages/admin/ZonesLivraisonPage.tsx` et ajouter en haut:

```typescript
import {
  useCities,
  useRegions,
  useInternationalZones,
  useTransporteurs,
  useZoneTarifs,
} from '../../hooks/useDelivery';
```

#### 2.2 Remplacer les données statiques

**AVANT (lignes ~139-159):**
```typescript
const [dakarVilleCities, setDakarVilleCities] = useState<City[]>([
  { id: '1', name: 'Plateau', category: 'Centre', status: 'active', price: 0, isFree: true },
  // ... plus de données statiques
]);
```

**APRÈS:**
```typescript
const {
  cities: dakarVilleCities,
  loading: loadingDakarVille,
  error: errorDakarVille,
  createCity: createDakarCity,
  updateCity: updateDakarCity,
  deleteCity: deleteDakarCity,
  toggleCityStatus: toggleDakarCityStatus,
} = useCities('dakar-ville');
```

Répéter pour:
- Banlieue: `useCities('banlieue')`
- Régions: `useRegions()`
- Zones internationales: `useInternationalZones()`
- Transporteurs: `useTransporteurs()`
- Zone tarifs: `useZoneTarifs()`

#### 2.3 Mettre à jour les fonctions handle*

Chercher toutes les fonctions qui commencent par `handle` et les mettre à jour:

**Exemple - handleAddCity (ligne ~XXX):**

AVANT:
```typescript
const handleAddCity = () => {
  const id = Date.now().toString();
  const cityToAdd = { ...newCity, id };
  setDakarVilleCities([...dakarVilleCities, cityToAdd]);
  setIsAddCityModalOpen(false);
  // ...
};
```

APRÈS:
```typescript
const handleAddCity = async () => {
  try {
    await createDakarCity({
      ...newCity,
      zoneType: 'dakar-ville',
    });
    setIsAddCityModalOpen(false);
    alert('Ville ajoutée avec succès !');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de l\'ajout');
  }
};
```

**Liste des fonctions à modifier:**

Pour les VILLES:
- [ ] `handleAddCity` (Dakar Ville)
- [ ] `handleUpdateCity` (Dakar Ville)
- [ ] `handleToggleCityStatus` (Dakar Ville)
- [ ] `handleDeleteCity` (Dakar Ville)
- [ ] `handleAddBanlieueCity` (Banlieue)
- [ ] `handleUpdateBanlieueCity` (Banlieue)
- [ ] `handleToggleBanlieueCityStatus` (Banlieue)

Pour les RÉGIONS:
- [ ] `handleAddRegion`
- [ ] `handleEditRegion`
- [ ] `handleUpdateRegion`
- [ ] `handleToggleRegionStatus`

Pour les ZONES INTERNATIONALES:
- [ ] `handleAddZone`
- [ ] `handleEditZone`
- [ ] `handleUpdateZone`
- [ ] `handleToggleZoneStatus`
- [ ] `handleDeleteInternationalZone`

Pour les TRANSPORTEURS:
- [ ] `handleAddTransporteur`
- [ ] `handleEditTransporteur`
- [ ] `handleUpdateTransporteur`
- [ ] `handleToggleTransporteurStatus`
- [ ] `handleDeleteTransporteur`

Pour les ZONE TARIFS:
- [ ] `handleAddTarif`
- [ ] `handleEditTarif`
- [ ] `handleUpdateTarif`
- [ ] `handleToggleTarifStatus`

#### 2.4 Ajouter la gestion du loading

Dans le JSX, ajouter des conditions de loading:

```typescript
{(loadingDakarVille || loadingBanlieue) ? (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <p className="ml-4">Chargement...</p>
  </div>
) : (
  // Afficher les données normalement
)}
```

#### 2.5 Ajouter la gestion des erreurs

```typescript
{(errorDakarVille || errorBanlieue) && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    <p className="font-bold">Erreur</p>
    <p>{errorDakarVille || errorBanlieue}</p>
  </div>
)}
```

---

### Étape 3: Adapter les Types (Important!)

**⚠️ ATTENTION:** L'API renvoie `price` en **string**, pas en number!

Si votre code affiche:
```typescript
<span>{city.price} FCFA</span>
```

Il faut le convertir:
```typescript
<span>{parseFloat(city.price)} FCFA</span>
```

Ou mieux, créer une fonction helper:
```typescript
const formatPrice = (price: string) => {
  return new Intl.NumberFormat('fr-FR').format(parseFloat(price));
};

// Usage:
<span>{formatPrice(city.price)} FCFA</span>
```

---

### Étape 4: Gérer le zoneType manquant

Si vous voyez une erreur de type TypeScript sur `city.zoneType`, c'est que les données statiques n'avaient pas ce champ.

**Solution 1:** Ajouter un filtre conditionnel:
```typescript
const filteredDakarVilleCities = dakarVilleCities.filter(city => 
  city.zoneType === 'dakar-ville' || !city.zoneType // Compatibilité données anciennes
);
```

**Solution 2:** Créer une fonction de migration:
```typescript
const migrateCityData = (city: any): City => ({
  ...city,
  zoneType: city.zoneType || 'dakar-ville',
  price: typeof city.price === 'number' ? city.price.toString() : city.price,
});
```

---

## 🧪 Tests

### Test 1: Récupération des données

1. Ouvrir la page `/admin/livraison`
2. Vérifier que les villes se chargent
3. Vérifier qu'il n'y a pas d'erreur dans la console

**Console à vérifier:**
```
[DeliveryService] GET /delivery/cities?zoneType=dakar-ville
[DeliveryService] Response: 200
```

### Test 2: Création d'une ville

1. Cliquer sur "Ajouter une ville"
2. Remplir le formulaire
3. Cliquer sur "Enregistrer"
4. Vérifier que la ville apparaît dans la liste
5. Recharger la page → la ville doit toujours être là

### Test 3: Modification d'une ville

1. Cliquer sur "Modifier" sur une ville
2. Changer le prix
3. Enregistrer
4. Vérifier que le prix a changé

### Test 4: Toggle du statut

1. Cliquer sur le bouton de statut
2. Vérifier que le statut change (active ↔ inactive)

### Test 5: Suppression

1. Cliquer sur "Supprimer"
2. Confirmer
3. Vérifier que la ville disparaît de la liste

---

## 🐛 Problèmes Courants

### Problème 1: Erreur 404 sur les endpoints

**Symptôme:** `GET /delivery/cities → 404 Not Found`

**Solution:**
- Vérifier que le module delivery est enregistré dans `app.module.ts`
- Vérifier que le contrôleur a le bon préfixe: `@Controller('delivery')`
- Redémarrer le serveur backend

### Problème 2: CORS Error

**Symptôme:** `Access to fetch blocked by CORS policy`

**Solution (Backend):**
```typescript
// main.ts
app.enableCors({
  origin: 'http://localhost:5174',
  credentials: true,
});
```

### Problème 3: Erreur 401 Unauthorized

**Symptôme:** Les POST/PUT/DELETE retournent 401

**Solution:**
- Vérifier que vous êtes authentifié en tant qu'admin
- Vérifier que le token est bien envoyé dans les headers
- Les GET sont publics, mais les autres opérations nécessitent l'authentification

### Problème 4: Types TypeScript incompatibles

**Symptôme:** `Type 'string' is not assignable to type 'number'`

**Solution:**
- L'API renvoie `price` en string, pas en number
- Utiliser `parseFloat(price)` pour convertir
- Mettre à jour vos interfaces TypeScript

### Problème 5: Données vides au chargement

**Symptôme:** La page se charge mais les tableaux sont vides

**Solution:**
- Vérifier que le seed a été exécuté: `npx ts-node prisma/seed-delivery-zones.ts`
- Vérifier les données en base: `npx prisma studio`
- Vérifier la console réseau (Network tab)

---

## 📝 Checklist Complète

### Backend
- [ ] Prisma schema à jour
- [ ] Migration exécutée
- [ ] Seed des données exécuté
- [ ] Module delivery créé
- [ ] Controller configuré avec `@Controller('delivery')`
- [ ] Service delivery créé
- [ ] DTOs créés et validés
- [ ] CORS activé
- [ ] Swagger documenté (optionnel)

### Frontend
- [ ] Service deliveryService.ts mis à jour
- [ ] Hooks useDelivery.ts importés
- [ ] Types adaptés (price en string)
- [ ] Toutes les fonctions handle* mises à jour avec async/await
- [ ] Loading states ajoutés
- [ ] Error states ajoutés
- [ ] Notifications utilisateur ajoutées (alert/toast)
- [ ] Tests effectués pour chaque opération CRUD

### Tests
- [ ] GET cities - fonctionne
- [ ] GET regions - fonctionne
- [ ] GET international-zones - fonctionne
- [ ] POST city - crée et enregistre
- [ ] PUT city - met à jour en base
- [ ] PATCH toggle-status - change le statut
- [ ] DELETE city - supprime de la base
- [ ] Rechargement de page - données persistent

---

## 🎯 Prochaines Étapes

Une fois l'intégration terminée:

1. **Notifications Toast:**
   Remplacer les `alert()` par un système de notifications (ex: react-hot-toast)

2. **Confirmations:**
   Ajouter des confirmations élégantes pour les suppressions

3. **Pagination:**
   Si vous avez beaucoup de données, ajouter la pagination

4. **Recherche avancée:**
   Améliorer les filtres de recherche

5. **Export/Import:**
   Ajouter la possibilité d'exporter/importer en CSV

6. **Historique:**
   Tracker les modifications avec un système d'audit

---

## 📚 Ressources

- **Guide Backend:** `BACKEND_DELIVERY_API_GUIDE.md`
- **Guide API Frontend:** `DELIVERY_API_GUIDE_FRONTEND.md`
- **Exemple d'intégration:** `INTEGRATION_ZONES_LIVRAISON_EXEMPLE.tsx`
- **Documentation Prisma:** https://www.prisma.io/docs

---

## 🆘 Support

En cas de problème:

1. Vérifier les logs du backend
2. Vérifier la console du frontend
3. Vérifier la base de données avec Prisma Studio
4. Consulter la documentation Swagger: `http://localhost:3004/api-docs`

---

**Auteur:** PrintAlma Team
**Date:** 2025-11-21
**Version:** 1.0
