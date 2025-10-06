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
  AlertCircle,
  Loader2,
  Palette
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import categoryService from '../../services/categoryService';
import { Category as HierarchicalCategory } from '../../types/category.types';

interface CategoriesAndSizesPanelProps {
  categories: string[];
  sizes: string[];
  onCategoriesUpdate: (categories: string[]) => void;
  onSizesUpdate: (sizes: string[]) => void;
}

// Interface pour la structure transformée
interface CategoryForDisplay {
  id: number;
  name: string;
  icon: string;
  children: ChildCategoryForDisplay[];
}

interface ChildCategoryForDisplay {
  id: number;
  name: string;
  variations: VariationForDisplay[];
}

interface VariationForDisplay {
  id: number;
  name: string;
  sizes?: string[];
}

// Icônes par défaut basées sur le nom de catégorie
const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('vêtement') || name.includes('vetement') || name.includes('t-shirt') || name.includes('polo')) return '👕';
  if (name.includes('téléphone') || name.includes('telephone') || name.includes('phone') || name.includes('coque')) return '📱';
  if (name.includes('accessoire') || name.includes('casquette') || name.includes('bonnet')) return '🧢';
  if (name.includes('sac') || name.includes('bag')) return '👜';
  if (name.includes('objet') || name.includes('mug') || name.includes('gourde')) return '☕';
  if (name.includes('papeterie') || name.includes('print') || name.includes('carte')) return '📄';
  return '📦';
};

// ANCIEN CODE STATIQUE REMPLACÉ
const CATEGORIES_HIERARCHY_OLD: any[] = [
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
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [newCustomSize, setNewCustomSize] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<CategoryForDisplay[]>([]);

  // Charger les catégories depuis la BD
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const hierarchy = await categoryService.getCategoryHierarchy();

        // Transformer la structure pour l'affichage
        const transformed: CategoryForDisplay[] = hierarchy
          .filter(cat => cat.level === 0) // Parents seulement
          .map(parent => ({
            id: parent.id,
            name: parent.name,
            icon: getCategoryIcon(parent.name),
            children: (parent.subcategories || [])
              .filter(child => child.level === 1)
              .map(child => ({
                id: child.id,
                name: child.name,
                variations: (child.subcategories || [])
                  .filter(variation => variation.level === 2)
                  .map(variation => ({
                    id: variation.id,
                    name: variation.name,
                    sizes: variation.sizes || []
                  }))
              }))
          }));

        setHierarchicalCategories(transformed);
        console.log('📦 Catégories chargées:', transformed);
      } catch (error) {
        console.error('❌ Erreur chargement catégories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // État pour suivre quelle sous-catégorie (enfant) est actuellement sélectionnée
  const [selectedChild, setSelectedChild] = useState<{ parent: string; child: string } | null>(null);

  // Extraire les informations de sélection depuis categories
  const getSelectedInfo = () => {
    if (categories.length === 0) return { parent: null, child: null, variations: [] };

    // Format: "Parent > Enfant > Variation1", "Parent > Enfant > Variation2", etc.
    const parts = categories[0].split(' > ');
    if (parts.length < 3) return { parent: null, child: null, variations: [] };

    const parent = parts[0];
    const child = parts[1];
    const variations = categories.map(cat => cat.split(' > ')[2]).filter(Boolean);

    return { parent, child, variations };
  };

  const { parent: selectedParent, child: selectedChildName, variations: selectedVariations } = getSelectedInfo();

  // Fonction pour basculer l'expansion d'une catégorie
  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Fonction pour sélectionner/désélectionner une variation (multi-sélection)
  const toggleVariation = (parentName: string, childName: string, variationName: string, allVariationsOfChild: VariationForDisplay[]) => {
    const fullCategoryName = `${parentName} > ${childName} > ${variationName}`;

    // Si on change de sous-catégorie, on reset tout
    if (selectedParent !== parentName || selectedChildName !== childName) {
      onCategoriesUpdate([fullCategoryName]);
      setSelectedChild({ parent: parentName, child: childName });

      // Stratégie de chargement des tailles :
      // 1. Si les variations ont des tailles définies, utiliser celles-ci
      // 2. Sinon, utiliser les noms des variations comme tailles (ex: S, M, L, XL)

      const variationData = allVariationsOfChild.find(v => v.name === variationName);

      if (variationData?.sizes && variationData.sizes.length > 0) {
        // Cas 1: Tailles explicites définies
        onSizesUpdate(variationData.sizes);
        console.log('✅ Tailles chargées depuis la variation:', variationData.sizes);
      } else {
        // Cas 2: Utiliser les noms des variations comme tailles
        const allVariationNames = allVariationsOfChild.map(v => v.name);
        onSizesUpdate(allVariationNames);
        console.log('✅ Tailles chargées depuis les noms de variations:', allVariationNames);
      }

      console.log('✅ Nouvelle sous-catégorie sélectionnée:', `${parentName} > ${childName}`);
      console.log('✅ Variation ajoutée:', variationName);
      return;
    }

    // Même sous-catégorie : toggle de la variation
    const isAlreadySelected = categories.includes(fullCategoryName);

    if (isAlreadySelected) {
      // Retirer la variation
      const updated = categories.filter(cat => cat !== fullCategoryName);
      onCategoriesUpdate(updated);
      console.log('❌ Variation retirée:', variationName);

      // Si on retire toutes les variations, garder les tailles (ne pas reset)
      // L'utilisateur pourra les modifier manuellement si besoin
    } else {
      // Ajouter la variation
      onCategoriesUpdate([...categories, fullCategoryName]);
      console.log('✅ Variation ajoutée:', variationName);
    }
  };

  // Fonction pour supprimer toutes les catégories sélectionnées
  const removeSelectedCategory = () => {
    onCategoriesUpdate([]);
    onSizesUpdate([]);
    setSelectedChild(null);
  };

  // Fonction pour retirer une variation spécifique
  const removeVariation = (variationToRemove: string) => {
    const updated = categories.filter(cat => !cat.endsWith(` > ${variationToRemove}`));
    onCategoriesUpdate(updated);
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

  // Pas de tailles suggérées automatiques - l'utilisateur les ajoute manuellement
  const suggestedSizes: string[] = [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Panel Sélection moderne de catégories */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Catégorie du produit</h3>
                <p className="text-sm text-blue-100">Sélectionnez une sous-catégorie et ses variations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Breadcrumb de sélection */}
          {selectedParent && selectedChildName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                <Badge className="bg-blue-600 text-white shrink-0">
                  {selectedParent}
                </Badge>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                <Badge className="bg-purple-600 text-white shrink-0">
                  {selectedChildName}
                </Badge>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedVariations.map((variation, idx) => (
                    <React.Fragment key={variation}>
                      {idx > 0 && <span className="text-gray-400 text-xs">•</span>}
                      <Badge className="bg-green-600 text-white shrink-0 text-xs">
                        {variation}
                      </Badge>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={removeSelectedCategory}
                className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Variations sélectionnées (si existantes) */}
          {selectedVariations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Variations sélectionnées
                </Label>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300">
                  {selectedVariations.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {selectedVariations.map((variation) => (
                    <motion.div
                      key={variation}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      layout
                    >
                      <Badge
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                        <span className="font-medium">{variation}</span>
                        <button
                          onClick={() => removeVariation(variation)}
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
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

          {/* État vide */}
          {!selectedParent && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-4">
                <Tag className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Aucune catégorie sélectionnée
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Parcourez les catégories ci-dessous pour commencer
              </p>
            </div>
          )}

          {/* Liste des catégories */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              {selectedParent ? 'Changer de catégorie' : 'Parcourir les catégories'}
            </Label>

            {loadingCategories ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chargement des catégories...</p>
              </div>
            ) : hierarchicalCategories.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Aucune catégorie disponible
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Créez des catégories dans la page de gestion
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {hierarchicalCategories.map((category) => (
                  <motion.div
                    key={category.id}
                    layout
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    {/* En-tête catégorie parent */}
                    <button
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div className="text-left">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100">
                            {category.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {category.children.length} sous-{category.children.length > 1 ? 'catégories' : 'catégorie'}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedCategories.has(category.id) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      </motion.div>
                    </button>

                    {/* Sous-catégories */}
                    <AnimatePresence>
                      {expandedCategories.has(category.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                        >
                          <div className="p-4 space-y-4">
                            {category.children.map((child) => {
                              const isChildSelected = selectedParent === category.name && selectedChildName === child.name;

                              return (
                                <div
                                  key={child.id}
                                  className={`rounded-lg border-2 overflow-hidden transition-all ${
                                    isChildSelected
                                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-md'
                                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                  }`}
                                >
                                  {/* En-tête sous-catégorie */}
                                  <div className="p-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {child.name}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {child.variations.length} variation{child.variations.length > 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Variations en grille */}
                                  <div className="p-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                      {child.variations.map((variation) => {
                                        const fullCategoryName = `${category.name} > ${child.name} > ${variation.name}`;
                                        const isSelected = categories.includes(fullCategoryName);
                                        const isDifferentChild = selectedParent && selectedChildName &&
                                          (selectedParent !== category.name || selectedChildName !== child.name);

                                        return (
                                          <motion.button
                                            key={variation.id}
                                            whileHover={!isDifferentChild ? { scale: 1.05, y: -2 } : {}}
                                            whileTap={!isDifferentChild ? { scale: 0.95 } : {}}
                                            onClick={() => !isDifferentChild && toggleVariation(category.name, child.name, variation.name, child.variations)}
                                            disabled={isDifferentChild}
                                            className={`
                                              relative p-3 rounded-lg border-2 font-medium text-sm transition-all
                                              ${isDifferentChild
                                                ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                                                : isSelected
                                                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 text-green-700 dark:text-green-300 shadow-lg'
                                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:shadow-md'
                                              }
                                            `}
                                          >
                                            <div className="flex flex-col items-center gap-1">
                                              <span className="text-center leading-tight">{variation.name}</span>
                                              {isSelected && (
                                                <motion.div
                                                  initial={{ scale: 0 }}
                                                  animate={{ scale: 1 }}
                                                  className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1"
                                                >
                                                  <Check className="h-3 w-3" />
                                                </motion.div>
                                              )}
                                            </div>
                                          </motion.button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel Tailles & Couleurs - Version simplifiée */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Section Tailles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-purple-600" />
                Tailles
              </Label>
              {sizes?.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {sizes.length}
                </Badge>
              )}
            </div>

            {!selectedParent ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sélectionnez d'abord une catégorie
              </p>
            ) : (
              <>
                {/* Tailles */}
                {sizes?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence mode="popLayout">
                      {sizes.map((size) => (
                        <motion.div
                          key={size}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          layout
                        >
                          <Badge className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <span>{size}</span>
                            <button
                              onClick={() => removeSize(size)}
                              className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Ajouter taille */}
                {selectedVariations.length > 0 && (
                  <div className="flex gap-2">
                    <Input
                      value={newCustomSize}
                      onChange={(e) => setNewCustomSize(e.target.value)}
                      placeholder="Ajouter une taille..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomSize();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={addCustomSize}
                      disabled={!newCustomSize.trim() || (sizes || []).includes(newCustomSize.trim())}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}; 