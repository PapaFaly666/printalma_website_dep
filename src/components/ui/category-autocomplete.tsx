import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import Button from './Button';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id?: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  level?: number;
}

interface CategoryAutocompleteProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  onCategorySelect?: (category: Category | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  parentId?: number | null; // Pour vérifier les doublons dans le contexte du parent
}

export const CategoryAutocomplete: React.FC<CategoryAutocompleteProps> = ({
  categories,
  value,
  onChange,
  onCategorySelect,
  placeholder = "Saisissez une catégorie...",
  className,
  disabled = false,
  parentId = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [apiCheckResult, setApiCheckResult] = useState<{ exists: boolean; category: Category | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Combiner les suggestions locales et de l'API
  const filteredSuggestions = React.useMemo(() => {
    const localSuggestions = categories.filter(category =>
      category.name.toLowerCase().includes(value.toLowerCase())
    );

    // Ajouter le résultat de l'API s'il n'est pas déjà dans les suggestions locales
    if (apiCheckResult?.exists && apiCheckResult.category) {
      const apiCategory = apiCheckResult.category;
      const alreadyIncluded = localSuggestions.some(cat => cat.id === apiCategory.id);

      if (!alreadyIncluded && apiCategory.name.toLowerCase().includes(value.toLowerCase())) {
        return [...localSuggestions, apiCategory];
      }
    }

    return localSuggestions;
  }, [categories, value, apiCheckResult]);

  // Vérifier si la catégorie saisie existe exactement dans les données locales
  const exactMatch = categories.find(cat =>
    cat.name.toLowerCase() === value.toLowerCase()
  );

  // Vérifier via l'API si la catégorie existe (avec debounce)
  useEffect(() => {
    if (!value || value.length < 2) {
      setApiCheckResult(null);
      return;
    }

    // Annuler la vérification précédente
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Vérifier après 500ms de pause dans la saisie
    checkTimeoutRef.current = setTimeout(async () => {
      setIsChecking(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
        const params = new URLSearchParams({ name: value.trim() });
        if (parentId !== null && parentId !== undefined) {
          params.append('parentId', String(parentId));
        }

        const response = await fetch(`${API_URL}/categories/check-duplicate?${params}`);
        const result = await response.json();
        setApiCheckResult(result);

        // Si trouvé via API et pas dans les catégories locales, notifier
        if (result.exists && result.category) {
          const isInLocal = categories.some(cat => cat.id === result.category.id);
          if (!isInLocal && onCategorySelect) {
            onCategorySelect(result.category);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        setApiCheckResult(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, parentId]); // Retirer exactMatch et onCategorySelect des dépendances

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setIsOpen(true);

    // Si la valeur correspond exactement à une catégorie
    const match = categories.find(cat =>
      cat.name.toLowerCase() === inputValue.toLowerCase()
    );

    setSelectedCategory(match || null);
    if (onCategorySelect) {
      onCategorySelect(match || null);
    }
  };

  const handleSuggestionClick = (category: Category) => {
    onChange(category.name);
    setSelectedCategory(category);
    setIsOpen(false);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={cn(
            "pr-10",
            exactMatch && "border-green-300 bg-green-50/50 dark:bg-green-950/20",
            className
          )}
          disabled={disabled}
        />

        {/* Indicateur de statut */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {exactMatch && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
            </div>
          )}
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </div>

      {/* Message d'aide avec statut API */}
      {isChecking && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Vérification en cours...
        </p>
      )}

      {!isChecking && value && apiCheckResult?.exists && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          ✓ Catégorie existante trouvée - sera réutilisée
        </p>
      )}

      {!isChecking && value && apiCheckResult && !apiCheckResult.exists && (
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          ✨ Nouvelle catégorie - sera créée
        </p>
      )}

      {!isChecking && value && !apiCheckResult && exactMatch && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          ✓ Catégorie existante trouvée (local)
        </p>
      )}

      {/* Dropdown des suggestions */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredSuggestions.map((category) => {
            // Déterminer la couleur et le badge selon le niveau
            const isParent = !category.parentId;
            const levelColor = isParent ? 'bg-blue-500' : 'bg-green-400';
            const levelLabel = isParent ? 'Parent' : 'Enfant';
            const levelBgColor = isParent ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

            return (
              <Button
                key={category.id}
                variant="ghost"
                className="w-full justify-start h-auto p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                onClick={() => handleSuggestionClick(category)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-2 h-6 ${levelColor} rounded-full flex-shrink-0`}></div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelBgColor}`}>
                        {levelLabel}
                      </span>
                    </div>
                    {category.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {category.description}
                      </div>
                    )}
                  </div>
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};