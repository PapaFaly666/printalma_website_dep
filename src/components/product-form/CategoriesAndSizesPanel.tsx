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
  Loader2
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
      {/* Panel Catégorie sélectionnée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Tag className="h-5 w-5 text-blue-500" />
            Catégorie du produit
            <Badge variant="outline" className="text-xs">
              Une sous-catégorie, plusieurs variations
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Catégories actuellement sélectionnées */}
          {selectedParent && selectedChildName ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sous-catégorie sélectionnée
              </Label>

              {/* Affichage de la sous-catégorie */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 text-sm"
                >
                  <Tag className="h-4 w-4" />
                  <span>{selectedParent} &gt; {selectedChildName}</span>
                  <button
                    onClick={removeSelectedCategory}
                    className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1 transition-colors"
                    title="Changer de sous-catégorie"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>

              {/* Affichage des variations sélectionnées */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Variations sélectionnées ({selectedVariations.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {selectedVariations.map((variation) => (
                      <motion.div
                        key={variation}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                      >
                        <Badge
                          variant="default"
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200"
                        >
                          <Check className="h-3 w-3" />
                          <span>{variation}</span>
                          <button
                            onClick={() => removeVariation(variation)}
                            className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Cliquez sur une variation pour l'ajouter ou la retirer
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
              {selectedParent ? 'Changer de sous-catégorie' : 'Sélectionner une sous-catégorie'}
            </Label>

            {loadingCategories ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">Chargement des catégories...</span>
              </div>
            ) : hierarchicalCategories.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune catégorie disponible
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Créez des catégories dans la page de gestion
                </p>
              </div>
            ) : (
            <div className="space-y-2">
              {selectedParent && selectedChildName && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Vous pouvez sélectionner plusieurs variations pour <strong>{selectedParent} &gt; {selectedChildName}</strong>.
                      Pour changer de sous-catégorie, cliquez sur le X ci-dessus.
                    </p>
                  </div>
                </div>
              )}
              {hierarchicalCategories.map((category) => (
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
                        {category.children.length} sous-catégories
                      </Badge>
                    </div>
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {/* Sous-catégories (Enfants) */}
                  <AnimatePresence>
                    {expandedCategories.has(category.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3"
                      >
                        {category.children.map((child) => (
                          <div key={child.id} className="space-y-2">
                            <div className="flex items-center gap-2 px-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {child.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {child.variations.length} variations
                              </Badge>
                            </div>

                            {/* Variations */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pl-4">
                              {child.variations.map((variation) => {
                                const fullCategoryName = `${category.name} > ${child.name} > ${variation.name}`;
                                const isSelected = categories.includes(fullCategoryName);
                                const isDifferentChild = selectedParent && selectedChildName &&
                                  (selectedParent !== category.name || selectedChildName !== child.name);

                                return (
                                  <motion.button
                                    key={variation.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleVariation(category.name, child.name, variation.name, child.variations)}
                                    disabled={isDifferentChild}
                                    className={`
                                      flex items-center justify-center p-2 rounded-md border-2 text-left transition-all text-xs
                                      ${isDifferentChild
                                        ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                                        : isSelected
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                      }
                                    `}
                                  >
                                    <div className="flex flex-col items-center text-center w-full">
                                      <span className="font-medium">{variation.name}</span>
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-green-500 mt-1" />
                                      )}
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
          </div>
              ))}
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Panel Tailles adaptatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Ruler className="h-5 w-5 text-purple-500" />
            Tailles disponibles
            {selectedParent && selectedVariations.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Pour {selectedVariations.length} variation(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message d'information si aucune catégorie */}
          {!selectedParent && (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Ruler className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Aucune taille disponible
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Sélectionnez d'abord une sous-catégorie et des variations
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


          {/* Info tailles - Afficher seulement si pas de tailles */}
          {selectedParent && selectedVariations.length > 0 && sizes.length === 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                    ⚠️ Aucune taille définie
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Les variations sélectionnées n'ont pas de tailles prédéfinies. Ajoutez-les ci-dessous.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ajouter taille personnalisée */}
          {selectedParent && selectedVariations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ou ajouter une taille personnalisée
            </Label>
            <div className="flex gap-2">
              <Input
                  value={newCustomSize}
                  onChange={(e) => setNewCustomSize(e.target.value)}
                placeholder="Ex: 42, Grande, 500ml..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSize();
                  }
                }}
                className="flex-1 border-2 border-purple-300 dark:border-purple-600 focus:border-purple-500"
              />
              <Button
                onClick={addCustomSize}
                  disabled={!newCustomSize.trim() || (sizes || []).includes(newCustomSize.trim())}
                size="sm"
                className="shrink-0 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Appuyez sur Entrée ou cliquez sur "Ajouter" pour valider
            </p>
          </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}; 