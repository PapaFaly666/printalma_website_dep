# Guide d'Intégration Frontend - Zones de Livraison

## Vue d'ensemble

Ce guide explique comment intégrer les appels API dans la page `ZonesLivraisonPage.tsx` en utilisant les hooks personnalisés et le service de livraison.

## Fichiers Créés

1. **`src/services/deliveryService.ts`** - Service pour les appels API
2. **`src/hooks/useDelivery.ts`** - Hooks personnalisés React pour la gestion des données
3. **`BACKEND_DELIVERY_API_GUIDE.md`** - Guide complet pour l'implémentation backend

## Architecture

```
┌─────────────────────────────────────┐
│   ZonesLivraisonPage.tsx            │
│   (Interface utilisateur)           │
└───────────────┬─────────────────────┘
                │
                ├─► useDelivery hooks
                │   (Gestion d'état React)
                │
                └─► deliveryService
                    (Appels API)
                    │
                    └─► Backend API
                        /api/delivery/*
```

## Intégration Rapide

### Étape 1: Importer les Hooks

Dans `ZonesLivraisonPage.tsx`:

```typescript
import {
  useCities,
  useRegions,
  useInternationalZones,
  useTransporteurs,
  useZoneTarifs,
} from '../../hooks/useDelivery';
```

### Étape 2: Utiliser les Hooks

```typescript
// Remplacer les useState par les hooks
const { cities: dakarVilleCities, loading, error, createCity, updateCity, deleteCity, toggleCityStatus } = useCities('dakar-ville');
const { cities: banlieueCities } = useCities('banlieue');
const { regions, createRegion, updateRegion, toggleRegionStatus } = useRegions();
const { zones: internationalZones, createZone, updateZone } = useInternationalZones();
const { transporteurs, createTransporteur, updateTransporteur } = useTransporteurs();
const { tarifs: zoneTarifs, createTarif, updateTarif } = useZoneTarifs();
```

### Étape 3: Exemple de Fonction Mise à Jour

**AVANT:**
```typescript
const handleAddCity = () => {
  const id = Date.now().toString();
  const cityToAdd = { ...newCity, id };
  setDakarVilleCities([...dakarVilleCities, cityToAdd]);
  setIsAddCityModalOpen(false);
};
```

**APRÈS:**
```typescript
const handleAddCity = async () => {
  try {
    await createCity({ ...newCity, zoneType: 'dakar-ville' });
    setIsAddCityModalOpen(false);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## Checklist d'Intégration

- [ ] Backend implémenté (voir BACKEND_DELIVERY_API_GUIDE.md)
- [ ] Hooks importés dans ZonesLivraisonPage.tsx
- [ ] Fonctions handle* mises à jour avec async/await
- [ ] Gestion du loading ajoutée
- [ ] Gestion des erreurs ajoutée
- [ ] Tests effectués

**Auteur:** Claude Code
**Date:** 2025-11-21
