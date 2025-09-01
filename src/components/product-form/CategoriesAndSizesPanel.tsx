import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Tag, 
  Ruler, 
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: Subcategory[];
  defaultSizes: string[];
}

interface Subcategory {
  id: string;
  name: string;
  sizes: string[];
}

interface CategoriesAndSizesPanelProps {
  categories: string[];
  sizes: string[];
  onCategoriesUpdate: (categories: string[]) => void;
  onSizesUpdate: (sizes: string[]) => void;
}

// Structure hiérarchique des catégories avec sous-catégories et tailles
const CATEGORIES_HIERARCHY: Category[] = [
  {
    id: 'vetements',
    name: 'Vêtements',
    icon: '👕',
    defaultSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    subcategories: [
      {
        id: 't-shirts',
        name: 'T-shirts',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      },
      {
        id: 'polos',
        name: 'Polos',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      },
      {
        id: 'sweats',
        name: 'Sweats',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      },
      {
        id: 'hoodies',
        name: 'Hoodies',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      },
      {
        id: 'vestes',
        name: 'Vestes',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      },
      {
        id: 'pantalons',
        name: 'Pantalons',
        sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44']
      }
    ]
  },
  {
    id: 'accessoires',
    name: 'Accessoires',
    icon: '🧢',
    defaultSizes: ['Unique'],
    subcategories: [
      {
        id: 'casquettes',
        name: 'Casquettes',
        sizes: ['Unique', 'Ajustable', '56cm', '58cm', '60cm', '62cm']
      },
      {
        id: 'bonnets',
        name: 'Bonnets',
        sizes: ['Unique', 'S/M', 'L/XL']
      },
      {
        id: 'echarpes',
        name: 'Écharpes',
        sizes: ['Unique']
      },
      {
        id: 'gants',
        name: 'Gants',
        sizes: ['XS', 'S', 'M', 'L', 'XL']
      },
      {
        id: 'ceintures',
        name: 'Ceintures',
        sizes: ['80cm', '85cm', '90cm', '95cm', '100cm', '105cm', '110cm', '115cm']
      }
    ]
  },
  {
    id: 'sacs',
    name: 'Sacs et Bagages',
    icon: '👜',
    defaultSizes: ['Unique'],
    subcategories: [
      {
        id: 'tote-bags',
        name: 'Tote bags',
        sizes: ['Petit (30x35cm)', 'Moyen (35x40cm)', 'Grand (40x45cm)']
      },
      {
        id: 'sacs-a-dos',
        name: 'Sacs à dos',
        sizes: ['15L', '20L', '25L', '30L', '35L']
      },
      {
        id: 'pochettes',
        name: 'Pochettes',
        sizes: ['Petit (15x20cm)', 'Moyen (20x25cm)', 'Grand (25x30cm)']
      },
      {
        id: 'valises',
        name: 'Valises',
        sizes: ['Cabine (55cm)', 'Moyen (65cm)', 'Grand (75cm)']
      }
    ]
  },
  {
    id: 'objets',
    name: 'Objets',
    icon: '☕',
    defaultSizes: ['Unique'],
    subcategories: [
      {
        id: 'mugs',
        name: 'Mugs',
        sizes: ['250ml', '300ml', '350ml', '400ml', '500ml']
      },
      {
        id: 'gourdes',
        name: 'Gourdes',
        sizes: ['350ml', '500ml', '750ml', '1L']
      },
      {
        id: 'coques-telephone',
        name: 'Coques téléphone',
        sizes: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'Samsung S21', 'Samsung S22', 'Samsung S23']
      },
      {
        id: 'mousepads',
        name: 'Tapis de souris',
        sizes: ['Standard (23x19cm)', 'Large (35x25cm)', 'XL (90x40cm)']
      }
    ]
  },
  {
    id: 'papeterie',
    name: 'Papeterie & Print',
    icon: '📄',
    defaultSizes: ['A4'],
    subcategories: [
      {
        id: 'cartes-visite',
        name: 'Cartes de visite',
        sizes: ['Standard (85x54mm)', 'Mini (80x50mm)', 'Carrée (55x55mm)']
      },
      {
        id: 'flyers',
        name: 'Flyers',
        sizes: ['A6 (105x148mm)', 'A5 (148x210mm)', 'A4 (210x297mm)', 'DL (99x210mm)']
      },
      {
        id: 'affiches',
        name: 'Affiches',
        sizes: ['A3 (297x420mm)', 'A2 (420x594mm)', 'A1 (594x841mm)', 'A0 (841x1189mm)']
      },
      {
        id: 'stickers',
        name: 'Stickers',
        sizes: ['Petit (5cm)', 'Moyen (10cm)', 'Grand (15cm)', 'XL (20cm)', 'Personnalisé']
      },
      {
        id: 'calendriers',
        name: 'Calendriers',
        sizes: ['A4 mural', 'A3 mural', 'De bureau', 'De poche']
      }
    ]
  }
];

export const CategoriesAndSizesPanel: React.FC<CategoriesAndSizesPanelProps> = ({
  categories = [],
  sizes = [],
  onCategoriesUpdate,
  onSizesUpdate
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newCustomSize, setNewCustomSize] = useState('');

  // Récupérer la catégorie actuelle sélectionnée (une seule)
  const selectedCategory = categories.length > 0 ? categories[0] : '';
  
  // Fonction pour basculer l'expansion d'une catégorie
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Fonction pour sélectionner une sous-catégorie (remplace la sélection précédente)
  const selectSubcategory = (categoryId: string, subcategoryId: string) => {
    const category = CATEGORIES_HIERARCHY.find(c => c.id === categoryId);
    const subcategory = category?.subcategories.find(s => s.id === subcategoryId);
    
    if (subcategory) {
      // Remplacer la catégorie sélectionnée (une seule catégorie autorisée)
      const subcategoryName = `${category?.name} > ${subcategory.name}`;
      onCategoriesUpdate([subcategoryName]);

      // Remplacer les tailles par celles de la nouvelle sous-catégorie
      onSizesUpdate(subcategory.sizes);
    }
  };

  // Fonction pour supprimer la catégorie sélectionnée
  const removeSelectedCategory = () => {
    onCategoriesUpdate([]);
    onSizesUpdate([]);
  };

  // Fonction pour ajouter une taille personnalisée
  const addCustomSize = () => {
    if (newCustomSize.trim() && !(sizes || []).includes(newCustomSize.trim())) {
      onSizesUpdate([...(sizes || []), newCustomSize.trim()]);
      setNewCustomSize('');
    }
  };

  // Fonction pour supprimer une taille
  const removeSize = (sizeToRemove: string) => {
    const updatedSizes = (sizes || []).filter(size => size !== sizeToRemove);
    onSizesUpdate(updatedSizes);
  };

  // Fonction pour basculer une taille prédéfinie
  const toggleSize = (sizeName: string) => {
    const currentSizes = sizes || [];
    if (currentSizes.includes(sizeName)) {
      removeSize(sizeName);
    } else {
      onSizesUpdate([...currentSizes, sizeName]);
    }
  };

  // Obtenir les tailles suggérées pour la catégorie actuelle
  const getSuggestedSizes = () => {
    if (!selectedCategory || !selectedCategory.includes(' > ')) return [];
    
    const [categoryName, subcategoryName] = selectedCategory.split(' > ');
    const category = CATEGORIES_HIERARCHY.find(c => c.name === categoryName);
    const subcategory = category?.subcategories.find(s => s.name === subcategoryName);
    
    return subcategory ? subcategory.sizes : [];
  };

  const suggestedSizes = getSuggestedSizes();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Panel Catégorie sélectionnée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Tag className="h-5 w-5 text-blue-500" />
            Catégorie du produit
            <Badge variant="outline" className="text-xs">
              Une seule catégorie par produit
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Catégorie actuellement sélectionnée */}
          {selectedCategory ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Catégorie sélectionnée
              </Label>
              <div className="flex items-center gap-2">
                      <Badge 
                        variant="default" 
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 text-sm"
                      >
                  <Check className="h-4 w-4" />
                  <span>{selectedCategory}</span>
                        <button
                    onClick={removeSelectedCategory}
                    className="ml-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-1 transition-colors"
                    title="Changer de catégorie"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Cliquez sur le X pour changer de catégorie
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Aucune catégorie sélectionnée
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Choisissez une catégorie et sous-catégorie ci-dessous
              </p>
            </div>
          )}

          {/* Structure hiérarchique des catégories */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedCategory ? 'Changer de catégorie' : 'Sélectionner une catégorie'}
            </Label>
            <div className="space-y-2">
              {CATEGORIES_HIERARCHY.map((category) => (
                <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  {/* En-tête de catégorie */}
                  <button
                    onClick={() => toggleCategoryExpansion(category.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {category.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {category.subcategories.length} sous-catégories
                      </Badge>
                    </div>
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {/* Sous-catégories */}
                  <AnimatePresence>
                    {expandedCategories.has(category.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-200 dark:border-gray-700 p-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {category.subcategories.map((subcategory) => {
                            const subcategoryName = `${category.name} > ${subcategory.name}`;
                            const isSelected = selectedCategory === subcategoryName;
                            
                return (
                  <motion.button
                                key={subcategory.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                                onClick={() => selectSubcategory(category.id, subcategory.id)}
                    className={`
                                  flex items-center justify-between p-3 rounded-md border-2 text-left transition-all text-sm
                      ${isSelected 
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 shadow-md' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                  }
                                `}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{subcategory.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {subcategory.sizes.length} tailles disponibles
                                  </span>
                                </div>
                    {isSelected && (
                                  <div className="flex items-center gap-1">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span className="text-xs font-medium text-green-600">ACTUEL</span>
                                  </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
          </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel Tailles adaptatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Ruler className="h-5 w-5 text-purple-500" />
            Tailles disponibles
            {selectedCategory && (
              <Badge variant="outline" className="text-xs">
                Adaptées à la catégorie sélectionnée
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message d'information si aucune catégorie */}
          {!selectedCategory && (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Ruler className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Aucune taille disponible
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Sélectionnez d'abord une catégorie pour voir les tailles adaptées
              </p>
            </div>
          )}

          {/* Tailles sélectionnées */}
          {(sizes?.length > 0) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tailles sélectionnées ({sizes?.length || 0})
              </Label>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {(sizes || []).map((size) => (
                    <motion.div
                      key={size}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      layout
                    >
                      <Badge 
                        variant="default" 
                        className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200"
                      >
                        <span>{size}</span>
                        <button
                          onClick={() => removeSize(size)}
                          className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Tailles suggérées pour la catégorie sélectionnée */}
          {selectedCategory && suggestedSizes.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tailles recommandées pour cette catégorie
              </Label>
              
              <div className="flex flex-wrap gap-2">
                {suggestedSizes.map((size) => {
                  const isSelected = (sizes || []).includes(size);
                  return (
                    <motion.button
                      key={size}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleSize(size)}
                      className={`
                        px-3 py-2 rounded-md border-2 text-sm font-medium transition-all
                        ${isSelected 
                          ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                        }
                      `}
                    >
                      {size}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ajouter taille personnalisée */}
          {selectedCategory && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ajouter une taille personnalisée
            </Label>
            <div className="flex gap-2">
              <Input
                  value={newCustomSize}
                  onChange={(e) => setNewCustomSize(e.target.value)}
                placeholder="Taille personnalisée..."
                onKeyPress={(e) => e.key === 'Enter' && addCustomSize()}
                className="flex-1"
              />
              <Button 
                onClick={addCustomSize}
                  disabled={!newCustomSize.trim() || (sizes || []).includes(newCustomSize.trim())}
                size="sm"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}; 