import React, { useState, useEffect } from 'react';
import { designCategoryService, DesignCategory } from '../services/designCategoryService';
import { Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react';

interface DesignCategorySelectorProps {
  value?: number | null;
  onChange: (categoryId: number | null) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  showImages?: boolean;
}

export const DesignCategorySelector: React.FC<DesignCategorySelectorProps> = ({
  value,
  onChange,
  required = false,
  className = "",
  placeholder = "-- Choisir une catégorie --",
  showImages = true
}) => {
  const [categories, setCategories] = useState<DesignCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await designCategoryService.getActiveCategories();
        setCategories(data);
      } catch (err: any) {
        console.error('Erreur lors du chargement des catégories:', err);
        setError(err.message || 'Erreur lors du chargement des catégories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSelect = (categoryId: number | null) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const selectedCategory = categories.find(cat => cat.id === value);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-600">Chargement des catégories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-700">{error}</span>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <span className="text-sm text-yellow-700">Aucune catégorie de design disponible</span>
      </div>
    );
  }

  // Si pas d'images à afficher, utiliser le select simple
  if (!showImages) {
    return (
      <select
        value={value || ''}
        onChange={(e) => {
          const selectedValue = e.target.value;
          if (selectedValue === '') {
            onChange(null);
          } else {
            onChange(parseInt(selectedValue, 10));
          }
        }}
        required={required}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      >
        <option value="">{placeholder}</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.icon} {category.name} ({category.designCount})
          </option>
        ))}
      </select>
    );
  }

  // Version avec images
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedCategory ? (
            <>
              {selectedCategory.coverImageUrl ? (
                <img 
                  src={selectedCategory.coverImageUrl} 
                  alt={selectedCategory.name}
                  className="w-6 h-6 object-cover rounded"
                />
              ) : selectedCategory.icon ? (
                <span>{selectedCategory.icon}</span>
              ) : null}
              <span>{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div
            className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
            onClick={() => handleSelect(null)}
          >
            <span className="text-gray-500">{placeholder}</span>
          </div>
          {categories.map(category => (
            <div
              key={category.id}
              className={`px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 ${
                category.id === value ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSelect(category.id)}
            >
              {category.coverImageUrl ? (
                <img 
                  src={category.coverImageUrl} 
                  alt={category.name}
                  className="w-8 h-8 object-cover rounded"
                />
              ) : category.icon ? (
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-lg">
                  {category.icon}
                </div>
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded" />
              )}
              <div className="flex-1">
                <div className="font-medium">{category.name}</div>
                <div className="text-sm text-gray-500">{category.designCount} designs</div>
              </div>
              {category.id === value && (
                <Check className="h-4 w-4 text-blue-500" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Click outside hook
const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler]);
};

export default DesignCategorySelector;