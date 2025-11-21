# 🚀 Intégration Simple - Zones de Livraison

## Étape 1: Vérifier que le Backend est Prêt

Tester si le backend répond:

```bash
curl http://localhost:3004/delivery/cities

# Doit retourner un tableau de villes (peut être vide si pas de seed)
```

---

## Étape 2: Utiliser le Nouveau Service

J'ai créé `src/services/deliveryApiService.ts` qui est prêt à l'emploi.

### Test Rapide dans la Console du Navigateur

Ouvrez `/admin/livraison` et dans la console:

```javascript
import deliveryApiService from '../services/deliveryApiService';

// Tester la récupération des villes
const cities = await deliveryApiService.getCities('dakar-ville');
console.log('Villes:', cities);

// Tester la création d'une ville
const newCity = await deliveryApiService.createCity({
  name: 'Test Ville',
  category: 'Centre',
  zoneType: 'dakar-ville',
  price: 1000,
  isFree: false,
  deliveryTimeMin: 24,
  deliveryTimeMax: 48,
  deliveryTimeUnit: 'heures'
});
console.log('Ville créée:', newCity);
```

---

## Étape 3: Intégrer dans ZonesLivraisonPage (Simple)

### Option A: Sans Modifier le Code Existant (Temporaire)

Ouvrir `src/pages/admin/ZonesLivraisonPage.tsx` et ajouter en haut:

```typescript
import { useEffect } from 'react';
import deliveryApiService from '../../services/deliveryApiService';

// Dans le composant, après les useState existants, ajouter:
useEffect(() => {
  // Charger les données réelles du backend
  const loadRealData = async () => {
    try {
      const cities = await deliveryApiService.getCities('dakar-ville');
      console.log('Données réelles chargées:', cities);
      // Pour l'instant on log juste, après on remplacera les données statiques
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  
  loadRealData();
}, []);
```

### Option B: Remplacer Complètement (Recommandé)

#### B.1. Remplacer le useState pour Dakar Ville

**CHERCHER** (ligne ~139):
```typescript
const [dakarVilleCities, setDakarVilleCities] = useState<City[]>([
  { id: '1', name: 'Plateau', ... },
  // ... données statiques
]);
```

**REMPLACER PAR**:
```typescript
const [dakarVilleCities, setDakarVilleCities] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Charger les données au montage
useEffect(() => {
  const loadCities = async () => {
    try {
      setLoading(true);
      const data = await deliveryApiService.getCities('dakar-ville');
      setDakarVilleCities(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  loadCities();
}, []);
```

#### B.2. Mettre à jour handleAddCity

**CHERCHER**:
```typescript
const handleAddCity = () => {
  const id = Date.now().toString();
  const cityToAdd = { ...newCity, id };
  setDakarVilleCities([...dakarVilleCities, cityToAdd]);
  setIsAddCityModalOpen(false);
  // ...
};
```

**REMPLACER PAR**:
```typescript
const handleAddCity = async () => {
  try {
    const created = await deliveryApiService.createCity({
      ...newCity,
      zoneType: 'dakar-ville',
      price: Number(newCity.price), // Convertir en number pour l'API
    });
    
    setDakarVilleCities([...dakarVilleCities, created]);
    setIsAddCityModalOpen(false);
    setNewCity({
      name: '',
      category: 'Centre',
      status: 'active' as 'active' | 'inactive',
      isFree: true,
      price: 0,
    });
    
    alert('Ville ajoutée avec succès !');
  } catch (error: any) {
    console.error('Erreur:', error);
    alert('Erreur: ' + error.message);
  }
};
```

#### B.3. Mettre à jour handleUpdateCity

**CHERCHER**:
```typescript
const handleUpdateCity = () => {
  if (!selectedCity) return;
  setDakarVilleCities(
    dakarVilleCities.map((city) =>
      city.id === selectedCity.id ? selectedCity : city
    )
  );
  setIsEditCityModalOpen(false);
  setSelectedCity(null);
};
```

**REMPLACER PAR**:
```typescript
const handleUpdateCity = async () => {
  if (!selectedCity) return;
  
  try {
    const updated = await deliveryApiService.updateCity(selectedCity.id, {
      name: selectedCity.name,
      category: selectedCity.category,
      status: selectedCity.status,
      price: Number(selectedCity.price),
      isFree: selectedCity.isFree,
      deliveryTimeMin: selectedCity.deliveryTimeMin,
      deliveryTimeMax: selectedCity.deliveryTimeMax,
      deliveryTimeUnit: selectedCity.deliveryTimeUnit,
    });
    
    setDakarVilleCities(
      dakarVilleCities.map((city) =>
        city.id === selectedCity.id ? updated : city
      )
    );
    setIsEditCityModalOpen(false);
    setSelectedCity(null);
    
    alert('Ville mise à jour !');
  } catch (error: any) {
    console.error('Erreur:', error);
    alert('Erreur: ' + error.message);
  }
};
```

#### B.4. Mettre à jour handleToggleCityStatus

**CHERCHER**:
```typescript
const handleToggleCityStatus = (cityId: string) => {
  setDakarVilleCities(
    dakarVilleCities.map((city) =>
      city.id === cityId
        ? { ...city, status: city.status === 'active' ? 'inactive' : 'active' }
        : city
    )
  );
};
```

**REMPLACER PAR**:
```typescript
const handleToggleCityStatus = async (cityId: string) => {
  try {
    const updated = await deliveryApiService.toggleCityStatus(cityId);
    
    setDakarVilleCities(
      dakarVilleCities.map((city) =>
        city.id === cityId ? updated : city
      )
    );
    
    alert('Statut modifié !');
  } catch (error: any) {
    console.error('Erreur:', error);
    alert('Erreur: ' + error.message);
  }
};
```

---

## Étape 4: Afficher le Loading

Dans le JSX, avant l'affichage des données:

```typescript
{loading && (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <p className="ml-4">Chargement des données...</p>
  </div>
)}

{error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    <p className="font-bold">Erreur</p>
    <p>{error}</p>
  </div>
)}

{!loading && !error && (
  // Votre tableau normal
)}
```

---

## Étape 5: Répéter pour les Autres Entités

Faire la même chose pour:
- Banlieue: `deliveryApiService.getCities('banlieue')`
- Régions: `deliveryApiService.getRegions()`
- Zones internationales: `deliveryApiService.getInternationalZones()`
- Transporteurs: `deliveryApiService.getTransporteurs()`
- Tarifs: `deliveryApiService.getZoneTarifs()`

---

## ⚠️ Points Importants

### 1. Conversion des Prix

L'API renvoie `price` en **string** (`"1500.00"`), mais dans vos formulaires c'est un number.

**Pour l'affichage:**
```typescript
<span>{parseFloat(city.price)} FCFA</span>
```

**Pour l'envoi à l'API:**
```typescript
await deliveryApiService.createCity({
  ...newCity,
  price: Number(newCity.price), // Convertir en number
});
```

### 2. Le zoneType est Obligatoire

Toujours ajouter `zoneType: 'dakar-ville'` ou `'banlieue'` lors de la création:

```typescript
await deliveryApiService.createCity({
  ...newCity,
  zoneType: 'dakar-ville', // IMPORTANT
});
```

### 3. Gestion des Erreurs

Toujours wrapper les appels API dans try/catch:

```typescript
try {
  await deliveryApiService.createCity(...);
  alert('Succès !');
} catch (error: any) {
  console.error('Erreur:', error);
  alert('Erreur: ' + error.message);
}
```

---

## 🧪 Test Complet

### 1. Tester la Récupération

1. Ouvrir `/admin/livraison`
2. Vérifier que les villes se chargent
3. Si aucune donnée: Le backend doit exécuter le seed

### 2. Tester la Création

1. Cliquer sur "Ajouter une ville"
2. Remplir le formulaire
3. Cliquer sur "Enregistrer"
4. La ville doit apparaître dans la liste
5. Recharger la page → la ville doit toujours être là

### 3. Tester la Modification

1. Cliquer sur "Modifier" une ville
2. Changer le prix
3. Enregistrer
4. Le prix doit être mis à jour

### 4. Tester le Toggle

1. Cliquer sur le bouton de statut
2. Le statut doit changer (vert ↔ rouge)

---

## 🔧 Debug

### Problème: "404 Not Found"

Le backend n'est pas lancé ou le module delivery n'est pas enregistré.

```bash
# Vérifier que le backend tourne
curl http://localhost:3004/delivery/cities

# Doit retourner un tableau JSON
```

### Problème: "CORS Error"

Vérifier dans le backend que CORS est activé pour `http://localhost:5174`.

### Problème: "Données vides"

Le seed n'a pas été exécuté:

```bash
npx ts-node prisma/seed-delivery-zones.ts
```

### Problème: "401 Unauthorized"

Les opérations POST/PUT/DELETE nécessitent l'authentification admin.
Les GET sont publics.

---

## 📝 Checklist Rapide

- [ ] Backend lancé sur port 3004
- [ ] Seed exécuté (27 villes, 13 régions)
- [ ] Service `deliveryApiService.ts` importé
- [ ] handleAddCity mis à jour avec async/await
- [ ] handleUpdateCity mis à jour avec async/await
- [ ] handleToggleCityStatus mis à jour avec async/await
- [ ] Loading state ajouté
- [ ] Error state ajouté
- [ ] Tests effectués (create, update, toggle)

---

**Auteur:** PrintAlma Team
**Date:** 2025-11-21
