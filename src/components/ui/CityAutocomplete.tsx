import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { IoLocationSharp } from 'react-icons/io5';
import cityService, { City } from '../../services/cityService';

interface CityAutocompleteProps {
  countryCode: string;
  value: string;
  onChange: (cityName: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  countryCode,
  value,
  onChange,
  onBlur,
  placeholder = 'Rechercher une ville...',
  className = '',
  error = false,
}) => {
  const [query, setQuery] = useState(value);
  const [cities, setCities] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (!query || query.length < 2 || !countryCode) {
      setCities([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        console.log('🔍 [CityAutocomplete] Recherche villes pour:', { query, countryCode });
        const results = await cityService.searchCities(query, countryCode, 15); // Augmenter le nombre de résultats
        console.log('✅ [CityAutocomplete] Résultats trouvés:', results.length, results);
        setCities(results);
        setIsOpen(true); // Toujours ouvrir pour afficher les résultats ou le message d'erreur
      } catch (error) {
        console.error('❌ [CityAutocomplete] Erreur recherche villes:', error);
        setCities([]);
        setIsOpen(true); // Afficher le message d'erreur
      } finally {
        setIsLoading(false);
      }
    }, 200); // Réduire le debounce à 200ms pour une meilleure réactivité

    return () => clearTimeout(timer);
  }, [query, countryCode]);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleSelectCity = (city: City) => {
    const cityName = city.name;
    setQuery(cityName);
    onChange(cityName);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || cities.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < cities.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < cities.length) {
          handleSelectCity(cities[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative group">
        <IoLocationSharp
          className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
            error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'
          }`}
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (cities.length > 0) setIsOpen(true);
          }}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 border-2 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base placeholder:text-slate-400 font-medium ${
            error
              ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'
          }`}
        />

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Icône de recherche */}
        {!isLoading && query.length < 2 && (
          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </div>
        )}
      </div>

      {/* Dropdown des suggestions */}
      {isOpen && cities.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 sm:mt-2 bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl shadow-slate-300/50 max-h-60 sm:max-h-80 overflow-y-auto">
          <div className="p-1.5 sm:p-2 space-y-0.5 sm:space-y-1">
            {cities.map((city, index) => (
              <button
                key={city.geonameId}
                onClick={() => handleSelectCity(city)}
                className={`w-full text-left px-2.5 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-lg transition-all ${
                  index === selectedIndex
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'hover:bg-slate-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <MapPin className={`w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 ${
                    index === selectedIndex ? 'text-blue-500' : 'text-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {city.name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer avec info */}
          <div className="border-t border-slate-100 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-50 hidden sm:block">
            <p className="text-xs text-slate-500 text-center">
              ↑ ↓ pour naviguer • Entrée pour sélectionner • Échap pour fermer
            </p>
          </div>
        </div>
      )}

      {/* Message si aucun résultat */}
      {isOpen && !isLoading && query.length >= 2 && cities.length === 0 && (
        <div className="absolute z-50 w-full mt-1.5 sm:mt-2 bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 text-slate-500">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            <p className="text-xs sm:text-sm">Aucune ville trouvée pour "{query}"</p>
          </div>
        </div>
      )}

      {/* Message d'aide */}
      {!isLoading && query.length === 1 && (
        <p className="text-xs text-slate-500 mt-1 sm:mt-2">
          Tapez au moins 2 caractères pour rechercher une ville
        </p>
      )}
    </div>
  );
};

export default CityAutocomplete;
