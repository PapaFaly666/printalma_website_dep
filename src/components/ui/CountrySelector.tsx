import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, ChevronDown, Check } from 'lucide-react';
import { COUNTRIES, type Country, getPopularCountries, searchCountries } from '../../data/countries';

interface CountrySelectorProps {
  value: string;
  onChange: (country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showPopular?: boolean;
  showRegion?: boolean;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder = "Sélectionner un pays",
  disabled = false,
  className = "",
  showPopular = true,
  showRegion = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialiser le pays sélectionné
  useEffect(() => {
    if (value) {
      const country = COUNTRIES.find(c => c.code === value);
      setSelectedCountry(country || null);
    }
  }, [value]);

  // Gérer le clic en dehors pour fermer le dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer les pays en fonction de la recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // Afficher les pays populaires si pas de recherche
      setFilteredCountries(showPopular ? getPopularCountries() : COUNTRIES.slice(0, 20));
    } else {
      setFilteredCountries(searchCountries(searchQuery));
    }
  }, [searchQuery, showPopular]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onChange(country);
    setIsOpen(false);
    setSearchQuery('');
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  };

  const getCountryDisplay = () => {
    if (selectedCountry) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedCountry.flag}</span>
          <span className="font-medium">{selectedCountry.name}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Globe className="w-5 h-5" />
        <span>{placeholder}</span>
      </div>
    );
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCountry(null);
    onChange({} as Country);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton principal */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
          disabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : isOpen
              ? 'border-blue-500 bg-white shadow-lg'
              : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex-1 text-left truncate">
          {getCountryDisplay()}
        </div>
        <div className="flex items-center gap-2">
          {selectedCountry && !disabled && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Effacer la sélection"
            >
              <span className="text-gray-400 hover:text-gray-600">×</span>
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Barre de recherche */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un pays..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Liste des pays */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucun pays trouvé
              </div>
            ) : (
              <div>
                {showPopular && searchQuery.trim() === '' && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-700">⭐ Populaires</p>
                    </div>
                    {getPopularCountries().map((country) => (
                      <CountryOption
                        key={country.code}
                        country={country}
                        isSelected={selectedCountry?.code === country.code}
                        onSelect={handleCountrySelect}
                        showRegion={showRegion}
                      />
                    ))}

                    {COUNTRIES.length > getPopularCountries().length && (
                      <>
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 mt-2">
                          <p className="text-xs font-semibold text-gray-700">🌍 Tous les pays</p>
                        </div>
                        {COUNTRIES.slice(0, 15).map((country) => (
                          <CountryOption
                            key={country.code}
                            country={country}
                            isSelected={selectedCountry?.code === country.code}
                            onSelect={handleCountrySelect}
                            showRegion={showRegion}
                          />
                        ))}
                      </>
                    )}
                  </div>
                )}

                {searchQuery.trim() !== '' && filteredCountries.map((country) => (
                  <CountryOption
                    key={country.code}
                    country={country}
                    isSelected={selectedCountry?.code === country.code}
                    onSelect={handleCountrySelect}
                    showRegion={showRegion}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant d'option de pays
interface CountryOptionProps {
  country: Country;
  isSelected: boolean;
  onSelect: (country: Country) => void;
  showRegion?: boolean;
}

const CountryOption: React.FC<CountryOptionProps> = ({
  country,
  isSelected,
  onSelect,
  showRegion = false
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(country)}
      className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
    >
      <span className="text-xl">{country.flag}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{country.name}</span>
          {showRegion && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {country.region}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {country.code} • {country.dialCode}
        </div>
      </div>
      {isSelected && (
        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
      )}
    </button>
  );
};

export default CountrySelector;