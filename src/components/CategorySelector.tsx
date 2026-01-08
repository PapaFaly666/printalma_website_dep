import React, { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import Button from './ui/Button';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface CategoryItem {
  id: number;
  name: string;
  parentId?: number;
  level?: number;
  order?: number;
  subcategories?: CategoryItem[];
}

interface CategorySelectorProps {
  categories: CategoryItem[];
  selectedCategoryId?: number;
  selectedSubcategoryId?: number;
  onCategoryChange: (categoryId: number | null) => void;
  onSubcategoryChange: (subcategoryId: number | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  placeholder = "Sélectionner une catégorie",
  className,
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Organiser les catégories
  const mainCategories = categories.filter(cat => cat.level === 0 || !cat.parentId);

  // Créer une structure hiérarchique
  const categoriesWithSubs = mainCategories.map(mainCat => {
    const subcategories = categories.filter(cat => cat.parentId === mainCat.id);
    return {
      ...mainCat,
      subcategories: subcategories.sort((a, b) => (a.order || 0) - (b.order || 0))
    };
  }).sort((a, b) => (a.order || 0) - (b.order || 0));

  // Trouver les éléments sélectionnés
  const selectedCategory = selectedCategoryId 
    ? categories.find(cat => cat.id === selectedCategoryId)
    : null;
  
  const selectedSubcategory = selectedSubcategoryId 
    ? categories.find(cat => cat.id === selectedSubcategoryId)
    : null;

  const toggleExpandCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (category: CategoryItem) => {
    if (category.subcategories && category.subcategories.length > 0) {
      toggleExpandCategory(category.id);
    } else {
      onCategoryChange(category.id);
      onSubcategoryChange(null);
      setOpen(false);
    }
  };

  const handleSubcategorySelect = (subcategory: CategoryItem, parentCategory: CategoryItem) => {
    onCategoryChange(parentCategory.id);
    onSubcategoryChange(subcategory.id);
    setOpen(false);
  };

  const clearSelection = () => {
    onCategoryChange(null);
    onSubcategoryChange(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="text-gray-900 dark:text-white font-semibold">
        Catégorie {required && <span className="text-red-500">*</span>}
      </Label>
      
      {/* Bouton de sélection */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setOpen(!open)}
          className="w-full justify-between p-4 h-auto text-left bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCategory ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {selectedSubcategory ? (
                    <>
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {selectedCategory.name}
                      </span>
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                      <FolderOpen className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {selectedSubcategory.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {selectedCategory.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(selectedCategory || selectedSubcategory) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
              >
                ×
              </Button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            <div className="p-2">
              {categoriesWithSubs.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                const hasSubcategories = category.subcategories && category.subcategories.length > 0;
                const isSelected = selectedCategoryId === category.id && !selectedSubcategoryId;

                return (
                  <div key={category.id}>
                    <div
                      onClick={() => handleCategorySelect(category)}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-3 rounded-md"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {hasSubcategories ? (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        
                        <Folder className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{category.name}</span>
                        
                        {hasSubcategories && (
                          <Badge variant="secondary" className="ml-auto">
                            {category.subcategories!.length}
                          </Badge>
                        )}
                      </div>
                      
                      {isSelected && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>

                    {/* Sous-catégories */}
                    {hasSubcategories && isExpanded && (
                      <div className="ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                        {category.subcategories!.map((subcategory) => {
                          const isSubSelected = selectedSubcategoryId === subcategory.id;
                          
                          return (
                            <div
                              key={subcategory.id}
                              onClick={() => handleSubcategorySelect(subcategory, category)}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-md"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <div className="w-4 h-4" />
                                <FolderOpen className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{subcategory.name}</span>
                              </div>
                              
                              {isSubSelected && (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Affichage de la sélection actuelle */}
      {(selectedCategory || selectedSubcategory) && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Sélection:</strong>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {selectedSubcategory ? (
                    <>
                      <span className="text-blue-600 dark:text-blue-400">{selectedCategory?.name}</span>
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">{selectedSubcategory.name}</span>
                    </>
                  ) : (
                    <span className="font-medium text-blue-800 dark:text-blue-200">{selectedCategory?.name}</span>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 