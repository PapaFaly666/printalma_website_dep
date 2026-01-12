import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, Package, Palette } from 'lucide-react';
import { searchService, SearchResult } from '../../services/searchService';
import { debounce } from '../../utils/debounce';

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

/**
 * Composant de recherche avec autocomplétion
 *
 * Caractéristiques:
 * - Recherche en temps réel avec debounce
 * - Affichage des suggestions (produits, designs, articles)
 * - Historique des recherches récentes
 * - Navigation au clavier
 * - Recherche directe sur Entrée
 */
export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  placeholder = 'Recherche de designs/produits',
  className = '',
  onSearch
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les recherches récentes au montage
  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches());
  }, []);

  // Recherche avec debounce
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Utiliser la recherche combinée (produits + designs)
        const results = await searchService.combinedSearch(searchQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erreur de recherche:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Mettre à jour les suggestions quand la query change
  useEffect(() => {
    if (query.trim()) {
      if (query.length >= 2) {
        setShowSuggestions(true);
        debouncedSearch(query);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  }, [query, debouncedSearch]);

  // Gérer la fermeture du dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + recentSearches.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < recentSearches.length) {
            handleRecentSearchClick(recentSearches[selectedIndex]);
          } else {
            const suggestionIndex = selectedIndex - recentSearches.length;
            handleSuggestionClick(suggestions[suggestionIndex]);
          }
        } else {
          handleSearch();
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Cliquer sur une suggestion
  const handleSuggestionClick = (result: SearchResult) => {
    searchService.saveRecentSearch(query);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(result.url);
  };

  // Cliquer sur une recherche récente
  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    setShowSuggestions(false);
    handleSearch(recentQuery);
  };

  // Effectuer une recherche
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      searchService.saveRecentSearch(finalQuery);
      onSearch?.(finalQuery);
      navigate(`/filtered-articles?search=${encodeURIComponent(finalQuery.trim())}`);
      setQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Effacer la query
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Effacer les recherches récentes
  const handleClearRecent = () => {
    searchService.clearRecentSearches();
    setRecentSearches([]);
  };

  // Obtenir l'icône selon le type
  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'design':
        return <Palette className="w-4 h-4 text-purple-500" />;
      case 'article':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  // Formatter le prix
  const formatPrice = (price?: number) => {
    if (price === undefined) return null;
    return `${price.toLocaleString()} FCFA`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input de recherche */}
      <div className="relative">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (!query.trim()) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 lg:pl-12 pr-10 py-2.5 lg:py-3 xl:py-3.5 rounded-full border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base xl:text-lg transition-all duration-200"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Dropdown des suggestions */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
        >
          {/* Recherches récentes */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4" />
                  Recherches récentes
                </div>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Effacer
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((recent, index) => (
                  <button
                    key={recent}
                    onClick={() => handleRecentSearchClick(recent)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                      selectedIndex === index
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {recent}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions en cours */}
          {(isLoading || suggestions.length > 0) && (
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-1">
                  {suggestions.map((result, index) => {
                    const itemIndex = recentSearches.length + index;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSuggestionClick(result)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                          selectedIndex === itemIndex
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Image/Thumbnail */}
                        {result.imageUrl && (
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={result.imageUrl}
                              alt={result.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Informations */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(result.type)}
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {result.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {result.category && (
                              <span className="text-xs text-gray-500">{result.category}</span>
                            )}
                            {result.price && (
                              <span className="text-xs font-semibold text-blue-600">
                                {formatPrice(result.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  Aucun résultat pour "{query}"
                </div>
              )}
            </div>
          )}

          {/* Bouton voir tous les résultats */}
          {query.trim() && (
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={() => handleSearch()}
                className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
                Voir tous les résultats pour "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
