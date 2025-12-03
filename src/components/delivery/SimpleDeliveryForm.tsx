/**
 * Version simplifiée du formulaire de livraison par pays
 * Évite les conflits de types complexes
 */

import React, { useState, useEffect } from 'react';
import { Globe, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { isSenegalCountry, buildDeliveryInfo, validateDeliveryInfo, type InternationalDeliveryParams } from '../../utils/deliveryInfoUtils';
import type { DeliveryInfo } from '../../types/order';

interface SimpleDeliveryFormProps {
  country: string;
  countryCode: string;
  onDeliveryInfoChange: (deliveryInfo: DeliveryInfo | undefined) => void;
  onDeliveryFeeChange: (fee: number) => void;
  onValidationError: (errors: string[]) => void;
  initialDeliveryInfo?: DeliveryInfo | undefined;
  disabled?: boolean;
}

// Types simplifiés pour éviter les conflits
interface SimpleTransportOption {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  logo?: string;
}

const SimpleDeliveryForm: React.FC<SimpleDeliveryFormProps> = ({
  country,
  countryCode,
  onDeliveryInfoChange,
  onDeliveryFeeChange,
  onValidationError,
  initialDeliveryInfo,
  disabled = false
}) => {
  // États
  const [isInternational, setIsInternational] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'city' | 'region' | 'international'>('city');
  const [selectedCarrier, setSelectedCarrier] = useState<SimpleTransportOption | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Déterminer si c'est international
  useEffect(() => {
    const international = !isSenegalCountry(country, countryCode);
    setIsInternational(international);

    if (!international) {
      // Pour le Sénégal, pas de frais de livraison spécifiques
      const senegalDeliveryInfo = buildDeliveryInfo(country, countryCode);
      onDeliveryInfoChange(senegalDeliveryInfo);
      onDeliveryFeeChange(0);
      onValidationError([]);
      setErrors([]);
    } else {
      // Pour l'international, on pourrait charger les options ici
      // Pour simplifier, on met des options par défaut
      loadDefaultInternationalOptions();
    }
  }, [country, countryCode]);

  // Charger des options internationales par défaut
  const loadDefaultInternationalOptions = () => {
    // Options fictives pour démonstration - à remplacer par un vrai appel API
    const defaultCarriers: SimpleTransportOption[] = [
      {
        id: 'dhl_express',
        name: 'DHL Express',
        price: 15000,
        deliveryTime: '3-5 jours ouvrables',
        logo: '/logos/dhl.png'
      },
      {
        id: 'fedex_international',
        name: 'FedEx International',
        price: 12000,
        deliveryTime: '5-7 jours ouvrables',
        logo: '/logos/fedex.png'
      },
      {
        id: 'chronopost_international',
        name: 'Chronopost International',
        price: 18000,
        deliveryTime: '2-4 jours ouvrables',
        logo: '/logos/chronopost.png'
      }
    ];

    // Pour l'instant, utiliser le premier transporteur par défaut
    if (defaultCarriers.length > 0) {
      setSelectedCarrier(defaultCarriers[0]);
    }
  };

  // Construire et valider les informations de livraison internationales
  useEffect(() => {
    if (!isInternational) return;

    if (!selectedCarrier) {
      const errorMsgs = ['Veuillez sélectionner un transporteur international'];
      setErrors(errorMsgs);
      onValidationError(errorMsgs);
      return;
    }

    try {
      const internationalParams: InternationalDeliveryParams = {
        deliveryType,
        transporteurId: selectedCarrier.id,
        transporteurName: selectedCarrier.name,
        transporteurLogo: selectedCarrier.logo,
        zoneTarifId: selectedCarrier.id, // Simplification
        deliveryFee: selectedCarrier.price,
        deliveryTime: selectedCarrier.deliveryTime,
        countryCode: countryCode.toUpperCase(),
        countryName: country
      };

      const deliveryInfo = buildDeliveryInfo(country, countryCode, internationalParams);
      const validationErrors = validateDeliveryInfo(deliveryInfo, country, countryCode);

      onDeliveryInfoChange(deliveryInfo);
      onDeliveryFeeChange(selectedCarrier.price);
      onValidationError(validationErrors);
      setErrors(validationErrors);

    } catch (error: any) {
      const errorMessage = error.message || 'Erreur dans les informations de livraison';
      setErrors([errorMessage]);
      onValidationError([errorMessage]);
    }
  }, [deliveryType, selectedCarrier, country, countryCode, isInternational]);

  if (!isInternational) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-900">Livraison au Sénégal</h4>
            <p className="text-sm text-green-700 mt-1">
              La livraison sera gérée selon nos standards nationaux. Aucune sélection de transporteur n&apos;est requise.
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
              onClick={() => setDeliveryType(value as any)}
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

      {/* Transporteurs disponibles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionnez un transporteur
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              id: 'dhl_express',
              name: 'DHL Express',
              price: 15000,
              deliveryTime: '3-5 jours ouvrables',
              logo: '/logos/dhl.png'
            },
            {
              id: 'fedex_international',
              name: 'FedEx International',
              price: 12000,
              deliveryTime: '5-7 jours ouvrables',
              logo: '/logos/fedex.png'
            },
            {
              id: 'chronopost_international',
              name: 'Chronopost International',
              price: 18000,
              deliveryTime: '2-4 jours ouvrables',
              logo: '/logos/chronopost.png'
            }
          ].map((carrier) => (
            <label
              key={carrier.id}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                selectedCarrier?.id === carrier.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="carrier"
                value={carrier.id}
                checked={selectedCarrier?.id === carrier.id}
                onChange={() => setSelectedCarrier(carrier)}
                disabled={disabled}
                className="text-blue-600"
              />
              {carrier.logo && (
                <img
                  src={carrier.logo}
                  alt={carrier.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Masquer l'image si elle ne charge pas
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{carrier.name}</p>
                <p className="text-sm text-gray-600">{carrier.deliveryTime}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {carrier.price.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </label>
          ))}
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

      {/* Résumé de la sélection */}
      {selectedCarrier && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Options de livraison sélectionnées</h4>
              <div className="mt-2 space-y-1 text-sm text-green-700">
                <p>• Transporteur: {selectedCarrier.name}</p>
                <p>• Type: {deliveryType === 'city' ? 'Ville' : deliveryType === 'region' ? 'Région' : 'Zone internationale'}</p>
                <p>• Délai: {selectedCarrier.deliveryTime}</p>
                <p>• Coût: {selectedCarrier.price.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDeliveryForm;