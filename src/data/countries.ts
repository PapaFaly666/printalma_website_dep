// Liste des pays du monde avec drapeaux Unicode et informations
export interface Country {
  code: string; // Code ISO 2 lettres (SN, FR, etc.)
  name: string; // Nom complet
  flag: string; // Drapeau Unicode
  dialCode: string; // Indicatif téléphonique
  region: string; // Continent/région
}

export const COUNTRIES: Country[] = [
  // Afrique
  { code: "SN", name: "Sénégal", flag: "🇸🇳", dialCode: "+221", region: "Afrique" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dialCode: "+225", region: "Afrique" },
  { code: "ML", name: "Mali", flag: "🇲🇱", dialCode: "+223", region: "Afrique" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dialCode: "+226", region: "Afrique" },
  { code: "NE", name: "Niger", flag: "🇳🇪", dialCode: "+227", region: "Afrique" },
  { code: "TG", name: "Togo", flag: "🇹🇬", dialCode: "+228", region: "Afrique" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", dialCode: "+229", region: "Afrique" },
  { code: "GN", name: "Guinée", flag: "🇬🇳", dialCode: "+224", region: "Afrique" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", dialCode: "+237", region: "Afrique" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", dialCode: "+212", region: "Afrique" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿", dialCode: "+213", region: "Afrique" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", dialCode: "+216", region: "Afrique" },
  { code: "EG", name: "Égypte", flag: "🇪🇬", dialCode: "+20", region: "Afrique" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234", region: "Afrique" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dialCode: "+233", region: "Afrique" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254", region: "Afrique" },
  { code: "ZA", name: "Afrique du Sud", flag: "🇿🇦", dialCode: "+27", region: "Afrique" },
  { code: "CD", name: "RD Congo", flag: "🇨🇩", dialCode: "+243", region: "Afrique" },
  { code: "CF", name: "Centrafrique", flag: "🇨🇫", dialCode: "+236", region: "Afrique" },
  { code: "AO", name: "Angola", flag: "🇦🇴", dialCode: "+244", region: "Afrique" },
  { code: "ET", name: "Éthiopie", flag: "🇪🇹", dialCode: "+251", region: "Afrique" },
  { code: "TZ", name: "Tanzanie", flag: "🇹🇿", dialCode: "+255", region: "Afrique" },
  { code: "UG", name: "Ouganda", flag: "🇺🇬", dialCode: "+256", region: "Afrique" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", dialCode: "+265", region: "Afrique" },
  { code: "ZM", name: "Zambie", flag: "🇿🇲", dialCode: "+260", region: "Afrique" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", dialCode: "+263", region: "Afrique" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", dialCode: "+267", region: "Afrique" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", dialCode: "+258", region: "Afrique" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", dialCode: "+261", region: "Afrique" },
  { code: "MU", name: "Maurice", flag: "🇲🇺", dialCode: "+230", region: "Afrique" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", dialCode: "+248", region: "Afrique" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", dialCode: "+250", region: "Afrique" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", dialCode: "+257", region: "Afrique" },
  { code: "SO", name: "Somalie", flag: "🇸🇴", dialCode: "+252", region: "Afrique" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", dialCode: "+253", region: "Afrique" },
  { code: "ER", name: "Érythrée", flag: "🇪🇷", dialCode: "+291", region: "Afrique" },
  { code: "GQ", name: "Guinée Équatoriale", flag: "🇬🇶", dialCode: "+240", region: "Afrique" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", dialCode: "+241", region: "Afrique" },
  { code: "CG", name: "Congo-Brazzaville", flag: "🇨🇬", dialCode: "+242", region: "Afrique" },
  { code: "ST", name: "São Tomé et Principe", flag: "🇸🇹", dialCode: "+239", region: "Afrique" },
  { code: "CV", name: "Cap-Vert", flag: "🇨🇻", dialCode: "+238", region: "Afrique" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱", dialCode: "+232", region: "Afrique" },
  { code: "LR", name: "Libéria", flag: "🇱🇷", dialCode: "+231", region: "Afrique" },
  { code: "GM", name: "Gambie", flag: "🇬🇲", dialCode: "+220", region: "Afrique" },
  { code: "GW", name: "Guinée-Bissau", flag: "🇬🇼", dialCode: "+245", region: "Afrique" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷", dialCode: "+222", region: "Afrique" },
  { code: "LY", name: "Libye", flag: "🇱🇾", dialCode: "+218", region: "Afrique" },
  { code: "SD", name: "Soudan", flag: "🇸🇩", dialCode: "+249", region: "Afrique" },
  { code: "TD", name: "Tchad", flag: "🇹🇩", dialCode: "+235", region: "Afrique" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", dialCode: "+266", region: "Afrique" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", dialCode: "+268", region: "Afrique" },
  { code: "KM", name: "Comores", flag: "🇰🇲", dialCode: "+269", region: "Afrique" },

  // Europe
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33", region: "Europe" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", dialCode: "+49", region: "Europe" },
  { code: "IT", name: "Italie", flag: "🇮🇹", dialCode: "+39", region: "Europe" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", dialCode: "+34", region: "Europe" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", dialCode: "+44", region: "Europe" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351", region: "Europe" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", dialCode: "+32", region: "Europe" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱", dialCode: "+31", region: "Europe" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", dialCode: "+41", region: "Europe" },
  { code: "AT", name: "Autriche", flag: "🇦🇹", dialCode: "+43", region: "Europe" },
  { code: "SE", name: "Suède", flag: "🇸🇪", dialCode: "+46", region: "Europe" },
  { code: "NO", name: "Norvège", flag: "🇳🇴", dialCode: "+47", region: "Europe" },
  { code: "DK", name: "Danemark", flag: "🇩🇰", dialCode: "+45", region: "Europe" },
  { code: "FI", name: "Finlande", flag: "🇫🇮", dialCode: "+358", region: "Europe" },
  { code: "PL", name: "Pologne", flag: "🇵🇱", dialCode: "+48", region: "Europe" },
  { code: "CZ", name: "République Tchèque", flag: "🇨🇿", dialCode: "+420", region: "Europe" },
  { code: "SK", name: "Slovaquie", flag: "🇸🇰", dialCode: "+421", region: "Europe" },
  { code: "HU", name: "Hongrie", flag: "🇭🇺", dialCode: "+36", region: "Europe" },
  { code: "RO", name: "Roumanie", flag: "🇷🇴", dialCode: "+40", region: "Europe" },
  { code: "BG", name: "Bulgarie", flag: "🇧🇬", dialCode: "+359", region: "Europe" },
  { code: "GR", name: "Grèce", flag: "🇬🇷", dialCode: "+30", region: "Europe" },
  { code: "IE", name: "Irlande", flag: "🇮🇪", dialCode: "+353", region: "Europe" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", dialCode: "+352", region: "Europe" },
  { code: "EE", name: "Estonie", flag: "🇪🇪", dialCode: "+372", region: "Europe" },
  { code: "LV", name: "Lettonie", flag: "🇱🇻", dialCode: "+371", region: "Europe" },
  { code: "LT", name: "Lituanie", flag: "🇱🇹", dialCode: "+370", region: "Europe" },
  { code: "MT", name: "Malte", flag: "🇲🇹", dialCode: "+356", region: "Europe" },
  { code: "CY", name: "Chypre", flag: "🇨🇾", dialCode: "+357", region: "Europe" },
  { code: "HR", name: "Croatie", flag: "🇭🇷", dialCode: "+385", region: "Europe" },
  { code: "SI", name: "Slovénie", flag: "🇸🇮", dialCode: "+386", region: "Europe" },
  { code: "BA", name: "Bosnie-Herzégovine", flag: "🇧🇦", dialCode: "+387", region: "Europe" },
  { code: "RS", name: "Serbie", flag: "🇷🇸", dialCode: "+381", region: "Europe" },
  { code: "ME", name: "Monténégro", flag: "🇲🇪", dialCode: "+382", region: "Europe" },
  { code: "AL", name: "Albanie", flag: "🇦🇱", dialCode: "+355", region: "Europe" },
  { code: "MK", name: "Macédoine du Nord", flag: "🇲🇰", dialCode: "+389", region: "Europe" },
  { code: "IS", name: "Islande", flag: "🇮🇸", dialCode: "+354", region: "Europe" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮", dialCode: "+423", region: "Europe" },
  { code: "AD", name: "Andorre", flag: "🇦🇩", dialCode: "+376", region: "Europe" },
  { code: "MC", name: "Monaco", flag: "🇲🇨", dialCode: "+377", region: "Europe" },
  { code: "SM", name: "Saint-Marin", flag: "🇸🇲", dialCode: "+378", region: "Europe" },
  { code: "VA", name: "Vatican", flag: "🇻🇦", dialCode: "+379", region: "Europe" },
  { code: "MD", name: "Moldavie", flag: "🇲🇩", dialCode: "+373", region: "Europe" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", dialCode: "+380", region: "Europe" },
  { code: "BY", name: "Biélorussie", flag: "🇧🇾", dialCode: "+375", region: "Europe" },

  // Asie
  { code: "CN", name: "Chine", flag: "🇨🇳", dialCode: "+86", region: "Asie" },
  { code: "IN", name: "Inde", flag: "🇮🇳", dialCode: "+91", region: "Asie" },
  { code: "JP", name: "Japon", flag: "🇯🇵", dialCode: "+81", region: "Asie" },
  { code: "KR", name: "Corée du Sud", flag: "🇰🇷", dialCode: "+82", region: "Asie" },
  { code: "TH", name: "Thaïlande", flag: "🇹🇭", dialCode: "+66", region: "Asie" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", dialCode: "+84", region: "Asie" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", dialCode: "+63", region: "Asie" },
  { code: "ID", name: "Indonésie", flag: "🇮🇩", dialCode: "+62", region: "Asie" },
  { code: "MY", name: "Malaisie", flag: "🇲🇾", dialCode: "+60", region: "Asie" },
  { code: "SG", name: "Singapour", flag: "🇸🇬", dialCode: "+65", region: "Asie" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", dialCode: "+852", region: "Asie" },
  { code: "TW", name: "Taïwan", flag: "🇹🇼", dialCode: "+886", region: "Asie" },

  // Amérique du Nord
  { code: "US", name: "États-Unis", flag: "🇺🇸", dialCode: "+1", region: "Amérique du Nord" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1", region: "Amérique du Nord" },
  { code: "MX", name: "Mexique", flag: "🇲🇽", dialCode: "+52", region: "Amérique du Nord" },

  // Amérique Centrale et Caraïbes
  { code: "GT", name: "Guatemala", flag: "🇬🇹", dialCode: "+502", region: "Amérique Centrale" },
  { code: "SV", name: "Salvador", flag: "🇸🇻", dialCode: "+503", region: "Amérique Centrale" },
  { code: "HN", name: "Honduras", flag: "🇭🇳", dialCode: "+504", region: "Amérique Centrale" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", dialCode: "+505", region: "Amérique Centrale" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dialCode: "+506", region: "Amérique Centrale" },
  { code: "PA", name: "Panama", flag: "🇵🇦", dialCode: "+507", region: "Amérique Centrale" },
  { code: "CU", name: "Cuba", flag: "🇨🇺", dialCode: "+53", region: "Caraïbes" },
  { code: "JM", name: "Jamaïque", flag: "🇯🇲", dialCode: "+1", region: "Caraïbes" },
  { code: "HT", name: "Haïti", flag: "🇭🇹", dialCode: "+509", region: "Caraïbes" },
  { code: "DO", name: "République Dominicaine", flag: "🇩🇴", dialCode: "+1", region: "Caraïbes" },
  { code: "PR", name: "Porto Rico", flag: "🇵🇷", dialCode: "+1", region: "Caraïbes" },
  { code: "TT", name: "Trinité-et-Tobago", flag: "🇹🇹", dialCode: "+1", region: "Caraïbes" },
  { code: "BB", name: "Barbade", flag: "🇧🇧", dialCode: "+1", region: "Caraïbes" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸", dialCode: "+1", region: "Caraïbes" },

  // Amérique du Sud
  { code: "BR", name: "Brésil", flag: "🇧🇷", dialCode: "+55", region: "Amérique du Sud" },
  { code: "AR", name: "Argentine", flag: "🇦🇷", dialCode: "+54", region: "Amérique du Sud" },
  { code: "CL", name: "Chili", flag: "🇨🇱", dialCode: "+56", region: "Amérique du Sud" },
  { code: "PE", name: "Pérou", flag: "🇵🇪", dialCode: "+51", region: "Amérique du Sud" },
  { code: "CO", name: "Colombie", flag: "🇨🇴", dialCode: "+57", region: "Amérique du Sud" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", dialCode: "+58", region: "Amérique du Sud" },
  { code: "EC", name: "Équateur", flag: "🇪🇨", dialCode: "+593", region: "Amérique du Sud" },
  { code: "BO", name: "Bolivie", flag: "🇧🇴", dialCode: "+591", region: "Amérique du Sud" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", dialCode: "+595", region: "Amérique du Sud" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", dialCode: "+598", region: "Amérique du Sud" },
  { code: "GY", name: "Guyana", flag: "🇬🇾", dialCode: "+592", region: "Amérique du Sud" },
  { code: "SR", name: "Suriname", flag: "🇸🇷", dialCode: "+597", region: "Amérique du Sud" },

  // Océanie
  { code: "AU", name: "Australie", flag: "🇦🇺", dialCode: "+61", region: "Océanie" },
  { code: "NZ", name: "Nouvelle-Zélande", flag: "🇳🇿", dialCode: "+64", region: "Océanie" },
  { code: "FJ", name: "Fidji", flag: "🇫🇯", dialCode: "+679", region: "Océanie" },
  { code: "PG", name: "Papouasie-Nouvelle-Guinée", flag: "🇵🇬", dialCode: "+675", region: "Océanie" },
  { code: "SB", name: "Îles Salomon", flag: "🇸🇧", dialCode: "+677", region: "Océanie" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺", dialCode: "+678", region: "Océanie" }
];

// Fonctions utilitaires
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(country => country.code === code.toUpperCase());
};

export const searchCountries = (query: string): Country[] => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return COUNTRIES.slice(0, 20); // Retourner les 20 premiers si pas de recherche

  return COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm) ||
    country.region.toLowerCase().includes(searchTerm)
  ).slice(0, 20); // Limiter à 20 résultats pour éviter trop de résultats
};

export const getCountriesByRegion = (region: string): Country[] => {
  return COUNTRIES.filter(country => country.region === region);
};

export const getPopularCountries = (): Country[] => {
  // Pays les plus populaires pour la livraison depuis le Sénégal
  return [
    getCountryByCode('SN')!,
    getCountryByCode('CI')!,
    getCountryByCode('ML')!,
    getCountryByCode('FR')!,
    getCountryByCode('US')!,
    getCountryByCode('CA')!,
    getCountryByCode('GB')!,
    getCountryByCode('BE')!,
    getCountryByCode('CH')!,
    getCountryByCode('IT')!
  ].filter(Boolean);
};

export const REGIONS = [
  'Afrique',
  'Europe',
  'Asie',
  'Amérique du Nord',
  'Amérique Centrale',
  'Amérique du Sud',
  'Caraïbes',
  'Océanie'
];