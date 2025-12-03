/**
 * Composant de formulaire pour les informations de livraison par pays
 * Gère la logique conditionnelle entre Sénégal et International
 */

import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { isSenegalCountry, buildDeliveryInfo, validateDeliveryInfo, type InternationalDeliveryParams } from '../../utils/deliveryInfoUtils';
import { deliveryService } from '../../services/deliveryService';
import { deliveryApiService } from '../../services/deliveryApiService';
import type { DeliveryInfo } from '../../types/order';
import type { City, Region, InternationalZone, Transporteur, ZoneTarifEnriched } from '../../services/deliveryService';

interface DeliveryInfoFormProps {
  country: string;
  countryCode: string;
  onDeliveryInfoChange: (deliveryInfo: DeliveryInfo | undefined) => void;
  onDeliveryFeeChange: (fee: number) => void;
  onValidationError: (errors: string[]) => void;
  initialDeliveryInfo?: DeliveryInfo | undefined;
  disabled?: boolean;
}

interface AvailableDeliveryOptions {
  cities: City[];
  regions: Region[];
  internationalZones: any[]; // Utiliser any pour éviter les conflits de types
  transporteurs: Transporteur[];
  zoneTarifs: ZoneTarifEnriched[];
}

const DeliveryInfoForm: React.FC<DeliveryInfoFormProps> = ({
  country,
  countryCode,
  onDeliveryInfoChange,
  onDeliveryFeeChange,
  onValidationError,
  initialDeliveryInfo,
  disabled = false
}) => {
  // États principaux
  const [isInternational, setIsInternational] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'city' | 'region' | 'international'>('city');
  const [availableOptions, setAvailableOptions] = useState<AvailableDeliveryOptions>({
    cities: [],
    regions: [],
    internationalZones: [],
    transporteurs: [],
    zoneTarifs: []
  });

  // États pour la sélection
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedInternationalZone, setSelectedInternationalZone] = useState<InternationalZone | null>(null);
  const [selectedTransporteur, setSelectedTransporteur] = useState<Transporteur | null>(null);
  const [selectedZoneTarif, setSelectedZoneTarif] = useState<ZoneTarifEnriched | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCode);

  // États de chargement et d'erreur
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Déterminer si c'est international
  useEffect(() => {
    const international = !isSenegalCountry(country, countryCode);
    setIsInternational(international);

    if (!international) {
      // Pour le Sénégal, on n'a pas besoin des informations complexes
      const senegalDeliveryInfo = buildDeliveryInfo(country, countryCode);
      onDeliveryInfoChange(senegalDeliveryInfo);
      onDeliveryFeeChange(0); // Livraison standard au Sénégal
      onValidationError([]);
      setErrors([]);
    } else {
      // Pour l'international, charger les options
      loadDeliveryOptions();
    }
  }, [country, countryCode]);

  // Charger les options de livraison internationales
  const loadDeliveryOptions = async () => {
    if (!isInternational) return;

    setIsLoading(true);
    try {
      const [cities, regions, internationalZones, transporteurs, zoneTarifs] = await Promise.all([
        deliveryService.getCities(),
        deliveryService.getRegions(),
        deliveryApiService.getInternationalZones(),
        deliveryApiService.getTransporteurs(),
        deliveryApiService.getZoneTarifs()
      ]);

      setAvailableOptions({
        cities: cities.filter(c => c.status === 'active'),
        regions: regions.filter(r => r.status === 'active'),
        internationalZones: internationalZones.filter(z => z.status === 'active'),
        transporteurs: transporteurs.filter(t => t.status === 'active'),
        zoneTarifs: zoneTarifs.filter(zt => zt.status === 'active') as ZoneTarifEnriched[]
      });
    } catch (error) {
      console.error('Erreur lors du chargement des options de livraison:', error);
      setErrors(['Impossible de charger les options de livraison internationales']);
    } finally {
      setIsLoading(false);
    }
  };

  // Construire et valider les informations de livraison internationales
  useEffect(() => {
    if (!isInternational) return;

    try {
      const internationalParams: InternationalDeliveryParams = {
        deliveryType,
        ...(deliveryType === 'city' && {
          cityId: selectedCity?.id,
          cityName: selectedCity?.name
        }),
        ...(deliveryType === 'region' && {
          regionId: selectedRegion?.id,
          regionName: selectedRegion?.name
        }),
        ...(deliveryType === 'international' && {
          zoneId: selectedInternationalZone?.id,
          zoneName: selectedInternationalZone?.name
        }),
        transporteurId: selectedTransporteur?.id || '',
        transporteurName: selectedTransporteur?.name,
        transporteurLogo: selectedTransporteur?.logoUrl,
        zoneTarifId: selectedZoneTarif?.id || '',
        deliveryFee: selectedZoneTarif ? Number(selectedZoneTarif.prixTransporteur) : 0,
        deliveryTime: selectedZoneTarif ? `${selectedZoneTarif.delaiLivraisonMin}-${selectedZoneTarif.delaiLivraisonMax} ${selectedZoneTarif.delaiLivraisonUnit || 'jours'}` : undefined,
        countryCode: selectedCountryCode,
        countryName: country
      };

      const deliveryInfo = buildDeliveryInfo(country, countryCode, internationalParams);
      const validationErrors = validateDeliveryInfo(deliveryInfo, country, countryCode);

      onDeliveryInfoChange(deliveryInfo);
      onDeliveryFeeChange(deliveryInfo?.deliveryFee || 0);
      onValidationError(validationErrors);
      setErrors(validationErrors);

    } catch (error: any) {
      const errorMessage = error.message || 'Erreur dans les informations de livraison';
      setErrors([errorMessage]);
      onValidationError([errorMessage]);
    }
  }, [deliveryType, selectedCity, selectedRegion, selectedInternationalZone, selectedTransporteur, selectedZoneTarif, selectedCountryCode, country, isInternational]);

  // Filtrer les zoneTarifs selon le transporteur et la zone
  const filteredZoneTarifs = React.useMemo(() => {
    if (!selectedTransporteur) return [];

    return availableOptions.zoneTarifs.filter(tarif =>
      tarif.transporteur.id === selectedTransporteur.id &&
      (
        (deliveryType === 'city' && selectedCity && availableOptions.cities.some(c => c.id === tarif.zoneId)) ||
        (deliveryType === 'region' && selectedRegion && availableOptions.regions.some(r => r.id === tarif.zoneId)) ||
        (deliveryType === 'international' && selectedInternationalZone && availableOptions.internationalZones.some(z => z.id === tarif.zoneId))
      )
    );
  }, [selectedTransporteur, deliveryType, selectedCity, selectedRegion, selectedInternationalZone, availableOptions.zoneTarifs]);

  // Filtrer les transporteurs selon le type de livraison
  const filteredTransporteurs = React.useMemo(() => {
    return availableOptions.transporteurs.filter(transporteur => {
      switch (deliveryType) {
        case 'city':
          return availableOptions.cities.some(city => transporteur.deliveryZones.includes(city.id));
        case 'region':
          return availableOptions.regions.some(region => transporteur.deliveryZones.includes(region.id));
        case 'international':
          return availableOptions.internationalZones.some(zone => transporteur.deliveryZones.includes(zone.id));
        default:
          return false;
      }
    });
  }, [availableOptions.transporteurs, deliveryType, availableOptions]);

  if (!isInternational) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-900">Livraison au Sénégal</h4>
            <p className="text-sm text-green-700 mt-1">
              La livraison sera gérée selon nos standards nationaux. Aucune sélection de transporteur n'est requise.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Globe className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-900">Livraison Internationale</h4>
          <p className="text-sm text-blue-700 mt-1">
            Sélectionnez les options de livraison pour {country}
          </p>
        </div>
      </div>

      {/* Erreurs */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Erreurs de validation</h4>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Type de livraison */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de livraison
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'city', label: 'Ville', icon: MapPin },
            { value: 'region', label: 'Région', icon: MapPin },
            { value: 'international', label: 'Zone internationale', icon: Globe }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setDeliveryType(value as any);
                setSelectedCity(null);
                setSelectedRegion(null);
                setSelectedInternationalZone(null);
                setSelectedTransporteur(null);
                setSelectedZoneTarif(null);
              }}
              disabled={disabled}
              className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                deliveryType === value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Chargement des options...</span>
        </div>
      ) : (
        <>
          {/* Sélection de la localisation */}
          {deliveryType === 'city' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionnez une ville
              </label>
              <select
                value={selectedCity?.id || ''}
                onChange={(e) => setSelectedCity(availableOptions.cities.find(c => c.id === e.target.value) || null)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionnez une ville...</option>
                {availableOptions.cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} - {city.price} FCFA
                  </option>
                ))}
              </select>
            </div>
          )}

          {deliveryType === 'region' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionnez une région
              </label>
              <select
                value={selectedRegion?.id || ''}
                onChange={(e) => setSelectedRegion(availableOptions.regions.find(r => r.id === e.target.value) || null)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionnez une région...</option>
                {availableOptions.regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name} - {region.price} FCFA
                  </option>
                ))}
              </select>
            </div>
          )}

          {deliveryType === 'international' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionnez une zone internationale
              </label>
              <select
                value={selectedInternationalZone?.id || ''}
                onChange={(e) => {
                  const zone = availableOptions.internationalZones.find(z => z.id === e.target.value);
                  setSelectedInternationalZone(zone || null);
                }}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionnez une zone...</option>
                {availableOptions.internationalZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} - {zone.price} FCFA ({zone.countries.length} pays)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Transporteur */}
          {filteredTransporteurs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionnez un transporteur
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTransporteurs.map((transporteur) => (
                  <label
                    key={transporteur.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTransporteur?.id === transporteur.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="transporteur"
                      value={transporteur.id}
                      checked={selectedTransporteur?.id === transporteur.id}
                      onChange={() => setSelectedTransporteur(transporteur)}
                      disabled={disabled}
                      className="text-blue-600"
                    />
                    {transporteur.logoUrl && (
                      <img
                        src={transporteur.logoUrl}
                        alt={transporteur.name}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{transporteur.name}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tarif de livraison */}
          {selectedTransporteur && filteredZoneTarifs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarif de livraison
              </label>
              <div className="space-y-2">
                {filteredZoneTarifs.map((tarif) => (
                  <label
                    key={tarif.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedZoneTarif?.id === tarif.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="zoneTarif"
                        value={tarif.id}
                        checked={selectedZoneTarif?.id === tarif.id}
                        onChange={() => setSelectedZoneTarif(tarif)}
                        disabled={disabled}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {tarif.internationalZone.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {tarif.transporteur.name} • {tarif.delaiLivraisonMin}-{tarif.delaiLivraisonMax} {tarif.delaiLivraisonUnit || 'jours'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {parseFloat(tarif.prixTransporteur).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Résumé de la sélection */}
          {selectedZoneTarif && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Options de livraison sélectionnées</h4>
                  <div className="mt-2 space-y-1 text-sm text-green-700">
                    <p>• Transporteur: {selectedTransporteur?.name}</p>
                    <p>• Zone: {selectedZoneTarif.internationalZone.name}</p>
                    <p>• Délai: {selectedZoneTarif.delaiLivraisonMin}-{selectedZoneTarif.delaiLivraisonMax} {selectedZoneTarif.delaiLivraisonUnit || 'jours'}</p>
                    <p>• Coût: {parseFloat(selectedZoneTarif.prixTransporteur).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeliveryInfoForm;