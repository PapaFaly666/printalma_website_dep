/**
 * Utilitaires pour la gestion des informations de livraison par pays
 * Basé sur la documentation de gestion des informations de livraison
 */

import type { DeliveryInfo } from '../types/order';

/**
 * Vérifie si un pays correspond au Sénégal
 */
export const isSenegalCountry = (country: string, countryCode?: string): boolean => {
  const normalizedCountry = country?.toLowerCase().trim();
  const normalizedCountryCode = countryCode?.toUpperCase().trim();

  // Vérifications pour le Sénégal
  return (
    normalizedCountry === 'sénégal' ||
    normalizedCountry === 'senegal' ||
    normalizedCountryCode === 'SN' ||
    normalizedCountryCode === 'SEN'
  );
};

/**
 * Interface pour les paramètres de livraison international
 */
export interface InternationalDeliveryParams {
  deliveryType: 'city' | 'region' | 'international';
  cityId?: string;
  cityName?: string;
  regionId?: string;
  regionName?: string;
  zoneId?: string;
  zoneName?: string;
  transporteurId: string;
  transporteurName?: string;
  transporteurLogo?: string;
  zoneTarifId: string;
  deliveryFee: number;
  deliveryTime?: string;
  countryCode: string;
  countryName: string;
}

/**
 * Construit l'objet deliveryInfo selon le pays
 */
export const buildDeliveryInfo = (
  country: string,
  countryCode: string,
  internationalParams?: InternationalDeliveryParams
): DeliveryInfo | undefined => {
  // Si c'est le Sénégal, pas besoin d'informations de livraison complexes
  if (isSenegalCountry(country, countryCode)) {
    return {
      countryCode: 'SN',
      countryName: 'Sénégal'
    };
  }

  // Pour l'international, on doit avoir tous les paramètres requis
  if (!internationalParams) {
    throw new Error('Les paramètres de livraison internationale sont requis pour les commandes hors Sénégal');
  }

  return {
    deliveryType: internationalParams.deliveryType,
    transporteurId: internationalParams.transporteurId,
    transporteurName: internationalParams.transporteurName,
    transporteurLogo: internationalParams.transporteurLogo,
    zoneTarifId: internationalParams.zoneTarifId,
    deliveryFee: internationalParams.deliveryFee,
    deliveryTime: internationalParams.deliveryTime,
    countryCode: internationalParams.countryCode,
    countryName: internationalParams.countryName,

    // Champs de localisation selon le type
    ...(internationalParams.deliveryType === 'city' && {
      cityId: internationalParams.cityId,
      cityName: internationalParams.cityName
    }),
    ...(internationalParams.deliveryType === 'region' && {
      regionId: internationalParams.regionId,
      regionName: internationalParams.regionName
    }),
    ...(internationalParams.deliveryType === 'international' && {
      zoneId: internationalParams.zoneId,
      zoneName: internationalParams.zoneName
    })
  };
};

/**
 * Valide les informations de livraison selon le pays
 */
export const validateDeliveryInfo = (
  deliveryInfo: DeliveryInfo | undefined,
  country: string,
  countryCode: string
): string[] => {
  const errors: string[] = [];

  // Si c'est le Sénégal, la validation est minimale
  if (isSenegalCountry(country, countryCode)) {
    if (!deliveryInfo?.countryCode) {
      errors.push('Le code pays est requis');
    }
    return errors;
  }

  // Pour l'international, toutes les informations sont requises
  if (!deliveryInfo) {
    errors.push('Les informations de livraison sont requises pour les commandes internationales');
    return errors;
  }

  if (!deliveryInfo.deliveryType) {
    errors.push('Le type de livraison est requis');
  }

  if (!deliveryInfo.transporteurId) {
    errors.push('Veuillez sélectionner un transporteur');
  }

  if (!deliveryInfo.zoneTarifId) {
    errors.push('Veuillez sélectionner une zone de tarif');
  }

  if (!deliveryInfo.deliveryFee || deliveryInfo.deliveryFee <= 0) {
    errors.push('Les frais de livraison doivent être supérieurs à 0');
  }

  if (!deliveryInfo.countryCode) {
    errors.push('Le code pays est requis');
  }

  if (!deliveryInfo.countryName) {
    errors.push('Le nom du pays est requis');
  }

  // Validation spécifique selon le type de livraison
  switch (deliveryInfo.deliveryType) {
    case 'city':
      if (!deliveryInfo.cityId) {
        errors.push('L\'ID de la ville est requis');
      }
      if (!deliveryInfo.cityName) {
        errors.push('Le nom de la ville est requis');
      }
      break;
    case 'region':
      if (!deliveryInfo.regionId) {
        errors.push('L\'ID de la région est requis');
      }
      if (!deliveryInfo.regionName) {
        errors.push('Le nom de la région est requis');
      }
      break;
    case 'international':
      if (!deliveryInfo.zoneId) {
        errors.push('L\'ID de la zone internationale est requis');
      }
      if (!deliveryInfo.zoneName) {
        errors.push('Le nom de la zone internationale est requis');
      }
      break;
  }

  return errors;
};

/**
 * Calcule les frais de livraison totaux selon le pays
 */
export const calculateDeliveryFee = (
  basePrice: number,
  country: string,
  countryCode: string,
  deliveryInfo?: DeliveryInfo
): number => {
  // Pour le Sénégal, on peut utiliser les frais de base ou les frais fixes
  if (isSenegalCountry(country, countryCode)) {
    // Si des frais de livraison sont spécifiés dans deliveryInfo, les utiliser
    // Sinon, retourner les frais de base (peut être 0 pour livraison gratuite)
    return deliveryInfo?.deliveryFee || basePrice || 0;
  }

  // Pour l'international, utiliser obligatoirement les frais de deliveryInfo
  if (!deliveryInfo?.deliveryFee) {
    throw new Error('Les frais de livraison internationaux sont requis');
  }

  return Number(deliveryInfo.deliveryFee);
};

/**
 * Formate le temps de livraison pour l'affichage
 */
export const formatDeliveryTime = (
  country: string,
  countryCode: string,
  deliveryInfo?: DeliveryInfo
): string => {
  // Pour le Sénégal, temps de livraison standard
  if (isSenegalCountry(country, countryCode)) {
    return deliveryInfo?.deliveryTime || '24-48h';
  }

  // Pour l'international, utiliser le temps spécifié
  return deliveryInfo?.deliveryTime || '3-5 jours ouvrables';
};

/**
 * Génère un résumé des informations de livraison pour l'affichage
 */
export const generateDeliverySummary = (
  deliveryInfo: DeliveryInfo | undefined,
  country: string,
  countryCode: string
): string => {
  if (isSenegalCountry(country, countryCode)) {
    return `Livraison au Sénégal (${formatDeliveryTime(country, countryCode, deliveryInfo)})`;
  }

  if (!deliveryInfo) {
    return 'Informations de livraison non disponibles';
  }

  const locationName =
    deliveryInfo.cityName ||
    deliveryInfo.regionName ||
    deliveryInfo.zoneName ||
    deliveryInfo.countryName;

  return `Livraison internationale vers ${locationName} via ${deliveryInfo.transporteurName || 'transporteur sélectionné'} (${formatDeliveryTime(country, countryCode, deliveryInfo)})`;
};