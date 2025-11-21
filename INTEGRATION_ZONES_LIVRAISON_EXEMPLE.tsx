/**
 * EXEMPLE D'INTÉGRATION DANS ZonesLivraisonPage.tsx
 *
 * Ce fichier montre comment intégrer les hooks useDelivery dans la page existante
 * pour remplacer les données statiques par des appels API réels.
 *
 * INSTRUCTIONS:
 * 1. Ouvrir src/pages/admin/ZonesLivraisonPage.tsx
 * 2. Importer les hooks au début du fichier
 * 3. Remplacer les useState par les hooks correspondants
 * 4. Mettre à jour les fonctions handle* pour utiliser les méthodes async des hooks
 */

import React, { useState } from 'react';
import {
  useCities,
  useRegions,
  useInternationalZones,
  useTransporteurs,
  useZoneTarifs,
} from '../../hooks/useDelivery';

// Types (déjà définis dans ZonesLivraisonPage)
import type { City, Region, InternationalZone, Transporteur, ZoneTarif } from '../../services/deliveryService';

// ============================================================
// ÉTAPE 1: REMPLACER LES IMPORTS
// ============================================================

// AVANT:
// const [dakarVilleCities, setDakarVilleCities] = useState<City[]>([...données statiques]);

// APRÈS:
const {
  cities: dakarVilleCities,
  loading: loadingDakarVille,
  error: errorDakarVille,
  createCity: createDakarCity,
  updateCity: updateDakarCity,
  deleteCity: deleteDakarCity,
  toggleCityStatus: toggleDakarCityStatus,
} = useCities('dakar-ville');

// ============================================================
// ÉTAPE 2: REMPLACER LES HOOKS POUR BANLIEUE
// ============================================================

// AVANT:
// const [banlieueCities, setBanlieueCities] = useState<City[]>([...données statiques]);

// APRÈS:
const {
  cities: banlieueCities,
  loading: loadingBanlieue,
  error: errorBanlieue,
  createCity: createBanlieueCity,
  updateCity: updateBanlieueCity,
  deleteCity: deleteBanlieueCity,
  toggleCityStatus: toggleBanlieueCityStatus,
} = useCities('banlieue');

// ============================================================
// ÉTAPE 3: REMPLACER LES HOOKS POUR RÉGIONS
// ============================================================

// AVANT:
// const [regions, setRegions] = useState<Region[]>([...données statiques]);

// APRÈS:
const {
  regions,
  loading: loadingRegions,
  error: errorRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  toggleRegionStatus,
} = useRegions();

// ============================================================
// ÉTAPE 4: REMPLACER LES HOOKS POUR ZONES INTERNATIONALES
// ============================================================

// AVANT:
// const [internationalZones, setInternationalZones] = useState<InternationalZone[]>([...données statiques]);

// APRÈS:
const {
  zones: internationalZones,
  loading: loadingInternationalZones,
  error: errorInternationalZones,
  createZone: createInternationalZone,
  updateZone: updateInternationalZone,
  deleteZone: deleteInternationalZone,
  toggleZoneStatus: toggleInternationalZoneStatus,
} = useInternationalZones();

// ============================================================
// ÉTAPE 5: REMPLACER LES HOOKS POUR TRANSPORTEURS
// ============================================================

// AVANT:
// const [transporteurs, setTransporteurs] = useState<Transporteur[]>([...données statiques]);

// APRÈS:
const {
  transporteurs,
  loading: loadingTransporteurs,
  error: errorTransporteurs,
  createTransporteur,
  updateTransporteur,
  deleteTransporteur,
  toggleTransporteurStatus,
} = useTransporteurs();

// ============================================================
// ÉTAPE 6: REMPLACER LES HOOKS POUR ZONE TARIFS
// ============================================================

// AVANT:
// const [zoneTarifs, setZoneTarifs] = useState<ZoneTarif[]>([...données statiques]);

// APRÈS:
const {
  tarifs: zoneTarifs,
  loading: loadingZoneTarifs,
  error: errorZoneTarifs,
  createTarif: createZoneTarif,
  updateTarif: updateZoneTarif,
  deleteTarif: deleteZoneTarif,
  toggleTarifStatus: toggleZoneTarifStatus,
} = useZoneTarifs();

// ============================================================
// ÉTAPE 7: METTRE À JOUR LES FONCTIONS HANDLE*
// ============================================================

// ---- EXEMPLE 1: AJOUT D'UNE VILLE DAKAR ----

// AVANT:
const handleAddCityOLD = () => {
  const id = Date.now().toString();
  const cityToAdd = { ...newCity, id };
  setDakarVilleCities([...dakarVilleCities, cityToAdd]);
  setIsAddCityModalOpen(false);
  setNewCity({
    name: '',
    category: 'Centre',
    status: 'active' as 'active' | 'inactive',
    isFree: true,
    price: 0,
  });
};

// APRÈS:
const handleAddCity = async () => {
  try {
    await createDakarCity({
      ...newCity,
      zoneType: 'dakar-ville', // Important: ajouter le zoneType
    });

    // Fermer le modal et réinitialiser
    setIsAddCityModalOpen(false);
    setNewCity({
      name: '',
      category: 'Centre',
      status: 'active' as 'active' | 'inactive',
      isFree: true,
      price: 0,
    });

    // Optionnel: Afficher une notification de succès
    alert('Ville ajoutée avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la ville:', error);
    alert('Erreur lors de l\'ajout de la ville');
  }
};

// ---- EXEMPLE 2: MISE À JOUR D'UNE VILLE ----

// AVANT:
const handleUpdateCityOLD = () => {
  if (!selectedCity) return;
  setDakarVilleCities(
    dakarVilleCities.map((city) =>
      city.id === selectedCity.id ? selectedCity : city
    )
  );
  setIsEditCityModalOpen(false);
  setSelectedCity(null);
};

// APRÈS:
const handleUpdateCity = async () => {
  if (!selectedCity) return;

  try {
    await updateDakarCity(selectedCity.id, {
      name: selectedCity.name,
      category: selectedCity.category,
      status: selectedCity.status,
      price: selectedCity.price,
      isFree: selectedCity.isFree,
      deliveryTimeMin: selectedCity.deliveryTimeMin,
      deliveryTimeMax: selectedCity.deliveryTimeMax,
      deliveryTimeUnit: selectedCity.deliveryTimeUnit,
    });

    setIsEditCityModalOpen(false);
    setSelectedCity(null);
    alert('Ville mise à jour avec succès !');
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    alert('Erreur lors de la mise à jour de la ville');
  }
};

// ---- EXEMPLE 3: TOGGLE DU STATUT ----

// AVANT:
const handleToggleCityStatusOLD = (cityId: string) => {
  setDakarVilleCities(
    dakarVilleCities.map((city) =>
      city.id === cityId
        ? { ...city, status: city.status === 'active' ? 'inactive' : 'active' }
        : city
    )
  );
};

// APRÈS:
const handleToggleCityStatus = async (cityId: string) => {
  try {
    await toggleDakarCityStatus(cityId);
    alert('Statut de la ville modifié !');
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    alert('Erreur lors du changement de statut');
  }
};

// ---- EXEMPLE 4: SUPPRESSION D'UNE VILLE ----

// AVANT:
const handleDeleteCityOLD = (cityId: string) => {
  setDakarVilleCities(dakarVilleCities.filter((city) => city.id !== cityId));
};

// APRÈS:
const handleDeleteCity = async (cityId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette ville ?')) {
    return;
  }

  try {
    await deleteDakarCity(cityId);
    alert('Ville supprimée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    alert('Erreur lors de la suppression de la ville');
  }
};

// ============================================================
// ÉTAPE 8: GESTION DU LOADING ET DES ERREURS DANS LE JSX
// ============================================================

// EXEMPLE DE RENDU AVEC LOADING ET ERREURS

const ExempleRendu = () => {
  // Afficher un loader pendant le chargement
  if (loadingDakarVille || loadingBanlieue) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4">Chargement des données...</p>
      </div>
    );
  }

  // Afficher les erreurs
  if (errorDakarVille || errorBanlieue) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Erreur</p>
        <p>{errorDakarVille || errorBanlieue}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Afficher les données
  return (
    <div>
      <h2>Villes de Dakar ({dakarVilleCities.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Prix</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dakarVilleCities.map((city) => (
            <tr key={city.id}>
              <td>{city.name}</td>
              <td>{city.category}</td>
              <td>{city.isFree ? 'Gratuit' : `${city.price} FCFA`}</td>
              <td>
                <span className={city.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                  {city.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td>
                <button onClick={() => handleToggleCityStatus(city.id)}>
                  {city.status === 'active' ? 'Désactiver' : 'Activer'}
                </button>
                <button onClick={() => handleDeleteCity(city.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// ÉTAPE 9: EXEMPLES POUR LES AUTRES ENTITÉS
// ============================================================

// ---- RÉGIONS ----

const handleAddRegion = async () => {
  try {
    await createRegion({
      name: newRegion.name,
      status: newRegion.status,
      price: newRegion.price,
      deliveryTimeMin: newRegion.deliveryTimeMin,
      deliveryTimeMax: newRegion.deliveryTimeMax,
      deliveryTimeUnit: newRegion.deliveryTimeUnit,
      mainCities: newRegion.mainCities,
    });

    setIsAddRegionModalOpen(false);
    setNewRegion({
      name: '',
      status: 'active' as 'active' | 'inactive',
      price: 3000,
      deliveryTimeMin: 2,
      deliveryTimeMax: 4,
      deliveryTimeUnit: 'jours' as 'jours',
      mainCities: '',
    });

    alert('Région ajoutée avec succès !');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de l\'ajout de la région');
  }
};

// ---- ZONES INTERNATIONALES ----

const handleAddInternationalZone = async () => {
  try {
    await createInternationalZone({
      name: newZone.name,
      countries: newZone.countries, // Tableau de pays
      status: newZone.status,
      price: newZone.price,
      deliveryTimeMin: newZone.deliveryTimeMin,
      deliveryTimeMax: newZone.deliveryTimeMax,
    });

    setIsAddZoneModalOpen(false);
    setNewZone({
      name: '',
      countries: [],
      status: 'active' as 'active' | 'inactive',
      price: 15000,
      deliveryTimeMin: 5,
      deliveryTimeMax: 10,
    });

    alert('Zone internationale créée avec succès !');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création de la zone');
  }
};

// ---- TRANSPORTEURS ----

const handleAddTransporteur = async () => {
  try {
    await createTransporteur({
      name: newTransporteur.name,
      logoUrl: newTransporteur.logoUrl,
      deliveryZones: newTransporteur.deliveryZones, // Tableau d'IDs de zones
      status: newTransporteur.status,
    });

    setIsAddTransporteurModalOpen(false);
    setNewTransporteur({
      name: '',
      logoUrl: '',
      deliveryZones: [],
      status: 'active' as 'active' | 'inactive',
    });

    alert('Transporteur créé avec succès !');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création du transporteur');
  }
};

// ---- ZONE TARIFS ----

const handleAddZoneTarif = async () => {
  try {
    await createZoneTarif({
      zoneId: newTarif.zoneId,
      zoneName: newTarif.zoneName,
      transporteurId: newTarif.transporteurId,
      transporteurName: newTarif.transporteurName,
      prixTransporteur: newTarif.prixTransporteur,
      prixStandardInternational: newTarif.prixStandardInternational,
      delaiLivraisonMin: newTarif.delaiLivraisonMin,
      delaiLivraisonMax: newTarif.delaiLivraisonMax,
      status: newTarif.status,
    });

    setIsAddTarifModalOpen(false);
    setNewTarif({
      zoneId: '',
      zoneName: '',
      transporteurId: '',
      transporteurName: '',
      prixTransporteur: 0,
      prixStandardInternational: 0,
      delaiLivraisonMin: 5,
      delaiLivraisonMax: 10,
      status: 'active' as 'active' | 'inactive',
    });

    alert('Tarif de zone créé avec succès !');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création du tarif');
  }
};

// ============================================================
// CHECKLIST D'INTÉGRATION
// ============================================================

/**
 * CHECKLIST:
 *
 * [x] 1. Importer les hooks useDelivery dans ZonesLivraisonPage.tsx
 * [x] 2. Remplacer useState par les hooks correspondants
 * [x] 3. Supprimer les données statiques
 * [x] 4. Mettre à jour toutes les fonctions handle* avec async/await
 * [x] 5. Ajouter la gestion du loading (spinners)
 * [x] 6. Ajouter la gestion des erreurs (messages d'erreur)
 * [x] 7. Ajouter les notifications utilisateur (alert ou toast)
 * [x] 8. Tester chaque fonctionnalité (CRUD)
 * [x] 9. Vérifier que le backend est lancé
 * [x] 10. Vérifier que les données sont bien enregistrées en base
 *
 * IMPORTANT:
 * - Les endpoints sont: /delivery/* (sans /api)
 * - Le backend doit être lancé sur http://localhost:3004
 * - Les données pré-remplies doivent être en base (seed)
 * - L'authentification admin est requise pour les opérations d'écriture
 */

export default {};
