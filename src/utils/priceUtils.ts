/**
 * Utilitaires de formatage des prix pour l'application PrintAlma
 */

/**
 * Formate un prix en FCFA de manière cohérente
 * @param price - Le prix brut (généralement en centimes ou en FCFA selon la source)
 * @returns Le prix formaté en FCFA
 */
export const formatPriceInFCFA = (price: number): string => {
  // Déterminer si le prix est en centimes (< 1000) ou déjà en FCFA (>= 1000)
  const priceInFCFA = price >= 1000 ? price : price;

  return new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
    currencyDisplay: 'symbol'
  }).format(priceInFCFA);
};

/**
 * Formate un prix en FCFA avec une alternative simple
 * @param price - Le prix brut (en centimes ou en FCFA)
 * @returns Le prix formaté en FCFA
 */
export const formatPrice = (price: number): string => {
  // Déterminer si le prix est en centimes (< 1000) ou déjà en FCFA (>= 1000)
  const priceInFCFA = price >= 1000 ? price : price;

  return `${priceInFCFA.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} FCFA`;
};

/**
 * Détermine si le prix est en centimes ou en FCFA direct
 * @param price - Le prix à vérifier
 * @returns true si le prix est en centimes, false si c'est déjà en FCFA
 */
export const isPriceInCents = (price: number): boolean => {
  // Si le prix est inférieur à 1000, on considère que c'est en centimes
  // Si c'est supérieur ou égal à 1000, on considère que c'est déjà en FCFA
  return price < 1000;
};

/**
 * Formate un prix en détectant automatiquement s'il est en centimes ou en FCFA
 * @param price - Le prix brut
 * @returns Le prix formaté en FCFA
 */
export const formatPriceAuto = (price: number): string => {
  const priceInFCFA = isPriceInCents(price) ? price : price;
  return formatPrice(priceInFCFA);
};

/**
 * Formate un prix en Francs CFA (XOF) - monnaie du Sénégal
 * @param price - Le prix brut (généralement en centimes ou en FCFA selon la source)
 * @returns Le prix formaté en Francs CFA
 */
export const formatPriceInXOF = (price: number): string => {
  // Debug: log la valeur d'entrée
  console.log('🔍 [formatPriceInXOF] Prix d\'entrée:', price, typeof price);

  // S'assurer que le prix est un nombre valide
  const validPrice = typeof price === 'number' && !isNaN(price) ? price : 0;

  // Le prix est déjà en FCFA (XOF) dans la base de données
  const priceInXOF = validPrice;

  // Formater avec le bon séparateur de milliers pour le français (Sénégal)
  const formattedPrice = `${priceInXOF.toLocaleString('fr-SN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true // S'assurer que les séparateurs de milliers sont utilisés
  })} FCFA`;

  console.log('🔍 [formatPriceInXOF] Prix calculé:', priceInXOF);
  console.log('🔍 [formatPriceInXOF] Prix formaté:', formattedPrice);

  return formattedPrice;
};

/**
 * Formate un prix en Francs CFA avec une alternative plus simple
 * @param price - Le prix brut (en centimes ou en FCFA)
 * @returns Le prix formaté en Francs CFA
 */
export const formatPriceFCFA = formatPriceInXOF;

// Garder pour compatibilité mais utiliser XOF maintenant
export const formatPriceInFRF = formatPriceInXOF;
export const formatPriceFR = formatPriceInXOF;