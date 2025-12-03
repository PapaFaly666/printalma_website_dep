/**
 * Service pour l'autocomplétion des villes via l'API GeoNames
 * Documentation: http://www.geonames.org/export/geonames-search.html
 */

export interface City {
  name: string;
  countryCode: string;
  countryName: string;
  adminName1?: string; // État/Province/Région
  population?: number;
  geonameId: number;
}

class CityService {
  // Username GeoNames gratuit (à remplacer par votre propre username)
  private readonly GEONAMES_USERNAME = 'pfdev';
  private readonly GEONAMES_BASE_URL = 'http://api.geonames.org';

  /**
   * Recherche des villes par nom et code pays avec support pour les recherches partielles
   * @param query - Terme de recherche (minimum 2 caractères)
   * @param countryCode - Code ISO du pays (ex: 'SN', 'FR', 'US')
   * @param maxRows - Nombre maximum de résultats (par défaut: 10)
   */
  async searchCities(
    query: string,
    countryCode: string,
    maxRows: number = 10
  ): Promise<City[]> {
    // Validation du query
    if (!query || query.length < 2) {
      console.log('🔍 [CityService] Query trop court:', query);
      return [];
    }

    if (!countryCode) {
      console.log('⚠️ [CityService] Code pays manquant');
      return [];
    }

    try {
      console.log('🔍 [CityService] Recherche villes:', { query, countryCode, maxRows });

      // Essai 1: Recherche standard avec starts_with pour les résultats plus pertinents
      let params = new URLSearchParams({
        name_startsWith: query.toLowerCase(), // Commence par la query (plus pertinent pour autocomplete)
        country: countryCode,
        maxRows: maxRows.toString(),
        featureClass: 'P', // P = populated place (ville, village, etc.)
        orderby: 'population', // Trier par population (grandes villes en premier)
        type: 'json',
        username: this.GEONAMES_USERNAME,
      });

      let url = `${this.GEONAMES_BASE_URL}/searchJSON?${params.toString()}`;
      console.log('🌐 [CityService] URL (startsWith):', url);

      let response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data = await response.json();

      // Vérifier s'il y a une erreur dans la réponse
      if (data.status) {
        console.error('❌ [CityService] Erreur API (startsWith):', data.status.message);
      }

      let cities: City[] = (data.geonames || []).map((item: any) => ({
        name: item.name,
        countryCode: item.countryCode,
        countryName: item.countryName,
        adminName1: item.adminName1, // État/Province
        population: item.population,
        geonameId: item.geonameId,
      }));

      console.log('✅ [CityService] Villes trouvées (startsWith):', cities.length);

      // Si pas assez de résultats avec startsWith, essayer la recherche standard q=
      if (cities.length < 3) {
        console.log('🔄 [CityService] Résultats insuffisants, essai avec recherche standard...');

        params = new URLSearchParams({
          q: query,
          country: countryCode,
          maxRows: maxRows.toString(),
          featureClass: 'P',
          orderby: 'population',
          type: 'json',
          username: this.GEONAMES_USERNAME,
        });

        url = `${this.GEONAMES_BASE_URL}/searchJSON?${params.toString()}`;
        console.log('🌐 [CityService] URL (standard):', url);

        response = await fetch(url);

        if (response.ok) {
          data = await response.json();

          if (!data.status) {
            const additionalCities: City[] = (data.geonames || []).map((item: any) => ({
              name: item.name,
              countryCode: item.countryCode,
              countryName: item.countryName,
              adminName1: item.adminName1,
              population: item.population,
              geonameId: item.geonameId,
            }));

            // Fusionner les résultats sans doublons
            const existingNames = new Set(cities.map(city => city.name.toLowerCase()));
            const uniqueAdditionalCities = additionalCities.filter(
              city => !existingNames.has(city.name.toLowerCase())
            );

            cities = [...cities, ...uniqueAdditionalCities].slice(0, maxRows);
            console.log('✅ [CityService] Villes trouvées (après fusion):', cities.length);
          }
        }
      }

      // Trier par pertinence: d'abord celles qui commencent par la query, puis par population
      cities.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // Même critère de départ, trier par population
        return (b.population || 0) - (a.population || 0);
      });

      console.log('✅ [CityService] Résultat final:', cities.length, 'villes');
      return cities;
    } catch (error) {
      console.error('❌ [CityService] Erreur recherche villes:', error);
      return [];
    }
  }

  /**
   * Recherche des villes avec debounce pour optimiser les appels API
   */
  private debounceTimer: NodeJS.Timeout | null = null;

  searchCitiesDebounced(
    query: string,
    countryCode: string,
    callback: (cities: City[]) => void,
    delay: number = 300
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      const cities = await this.searchCities(query, countryCode);
      callback(cities);
    }, delay);
  }
}

export const cityService = new CityService();
export default cityService;
