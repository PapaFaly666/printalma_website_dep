import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, ArrowRight, Store, ShoppingBag } from 'lucide-react';
import { searchService, SearchResult } from '../../services/searchService';
import { debounce } from '../../utils/debounce';

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

const BRAND_GRADIENT = 'linear-gradient(90deg, #1E88E5 0%, #5C6BC0 25%, #7B1FA2 50%, #C2185B 75%, #D32F2F 100%)';

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  placeholder = 'Rechercher un produit, une boutique...',
  className = '',
  onSearch,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches());
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const results = await searchService.combinedSearch(q);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (query.trim().length >= 2) {
      setShowDropdown(true);
      debouncedSearch(query);
    } else {
      setSuggestions([]);
      setIsLoading(false);
      if (!query.trim()) setShowDropdown(false);
    }
  }, [query, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Séparer produits et boutiques
  const products = suggestions.filter(s => s.type === 'product');
  const vendors = suggestions.filter(s => s.type === 'vendor');

  // Index total pour navigation clavier
  const allItems = [...products, ...vendors];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          handleSuggestionClick(allItems[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (result: SearchResult) => {
    if (query.trim()) searchService.saveRecentSearch(query.trim());
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    navigate(result.url);
  };

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    setShowDropdown(false);
    searchService.saveRecentSearch(recentQuery);
    onSearch?.(recentQuery);
    navigate(`/filtered-articles?search=${encodeURIComponent(recentQuery.trim())}`);
    setQuery('');
  };

  const handleSearch = (q?: string) => {
    const finalQuery = (q ?? query).trim();
    if (!finalQuery) return;
    searchService.saveRecentSearch(finalQuery);
    onSearch?.(finalQuery);
    navigate(`/filtered-articles?search=${encodeURIComponent(finalQuery)}`);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price) + ' FCFA';
  };

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showResults = query.trim().length >= 2;
  const hasContent = showRecent || showResults || isLoading;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Barre de recherche — UX originale conservée */}
      <form onSubmit={e => { e.preventDefault(); handleSearch(); }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(recentSearches.length > 0 || query.trim().length >= 2)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 lg:pl-12 pr-10 py-2.5 lg:py-3 xl:py-3.5 rounded-full border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base xl:text-lg transition-all duration-200"
            autoComplete="off"
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

      {/* Dropdown */}
      {showDropdown && hasContent && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl overflow-hidden z-[9999]"
          style={{
            boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
            border: '1px solid rgba(0,0,0,0.07)',
            maxHeight: '520px',
            overflowY: 'auto',
          }}
        >
          {/* Bande branding en haut */}
          <div className="h-0.5 w-full" style={{ background: BRAND_GRADIENT }} />

          {/* ── Recherches récentes ── */}
          {showRecent && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Récemment recherché
                  </span>
                </div>
                <button
                  onClick={() => {
                    searchService.clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Tout effacer
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(recent => (
                  <button
                    key={recent}
                    onClick={() => handleRecentClick(recent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-full text-sm text-gray-700 transition-all"
                  >
                    <Clock className="w-3 h-3 text-gray-400" />
                    {recent}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {isLoading && (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Résultats ── */}
          {!isLoading && showResults && (
            <>
              {/* Section Produits */}
              {products.length > 0 && (
                <div>
                  <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" style={{ color: '#1E88E5' }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#1E88E5' }}>
                      Produits
                    </span>
                    <span className="text-xs text-gray-400">({products.length})</span>
                  </div>
                  <div className="px-2 pb-2 space-y-0.5">
                    {products.map((result, i) => {
                      const globalIndex = i;
                      const isSelected = selectedIndex === globalIndex;
                      return (
                        <button
                          key={`product-${result.id}`}
                          onClick={() => handleSuggestionClick(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                            {result.imageUrl ? (
                              <img
                                src={result.imageUrl}
                                alt={result.name}
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                              {result.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {result.category && (
                                <span className="text-xs text-gray-500 truncate">{result.category}</span>
                              )}
                              {result.shopName && (
                                <span className="text-xs text-gray-400">• {result.shopName}</span>
                              )}
                            </div>
                          </div>

                          {/* Prix */}
                          {result.price && (
                            <div className="flex-shrink-0 text-right">
                              <span
                                className="text-sm font-bold"
                                style={{ color: '#1E88E5' }}
                              >
                                {formatPrice(result.price)}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Séparateur */}
              {products.length > 0 && vendors.length > 0 && (
                <div className="mx-4 border-t border-gray-100" />
              )}

              {/* Section Boutiques */}
              {vendors.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                    <Store className="w-3.5 h-3.5" style={{ color: '#7B1FA2' }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7B1FA2' }}>
                      Boutiques
                    </span>
                    <span className="text-xs text-gray-400">({vendors.length})</span>
                  </div>
                  <div className="px-2 pb-2 space-y-0.5">
                    {vendors.map((result, i) => {
                      const globalIndex = products.length + i;
                      const isSelected = selectedIndex === globalIndex;
                      return (
                        <button
                          key={`vendor-${result.id}`}
                          onClick={() => handleSuggestionClick(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                            isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden border-2 border-purple-100">
                            {result.imageUrl ? (
                              <img
                                src={result.imageUrl}
                                alt={result.name}
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                                style={{ background: BRAND_GRADIENT }}
                              >
                                {result.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Infos boutique */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                              {result.name}
                            </p>
                            {result.category && (
                              <span
                                className="inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 font-medium"
                                style={{ background: 'rgba(123,31,162,0.08)', color: '#7B1FA2' }}
                              >
                                {result.category}
                              </span>
                            )}
                          </div>

                          <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aucun résultat */}
              {products.length === 0 && vendors.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Aucun résultat</p>
                  <p className="text-xs text-gray-400">
                    Aucun résultat pour «&nbsp;{query}&nbsp;»
                  </p>
                </div>
              )}

              {/* Bouton "Voir tous les résultats" */}
              {(products.length > 0 || vendors.length > 0) && (
                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={() => handleSearch()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: BRAND_GRADIENT }}
                  >
                    <Search className="w-4 h-4" />
                    Voir tous les résultats pour «&nbsp;{query}&nbsp;»
                  </button>
                </div>
              )}
            </>
          )}

          {/* Aucun résultat state (quand query mais pas encore de résultats chargés) */}
          {!isLoading && showResults && suggestions.length === 0 && !isLoading && (
            <div className="px-4 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Aucun résultat</p>
              <p className="text-xs text-gray-400">
                Essayez avec d'autres mots-clés
              </p>
              <button
                onClick={() => handleSearch()}
                className="mt-3 text-xs font-semibold px-4 py-1.5 rounded-full text-white"
                style={{ background: BRAND_GRADIENT }}
              >
                Rechercher quand même
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
