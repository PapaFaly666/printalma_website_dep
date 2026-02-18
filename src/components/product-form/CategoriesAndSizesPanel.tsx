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
import { AdminButton } from '../admin/AdminButton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import categoryRealApi from '../../services/categoryRealApi';
import { toast } from 'sonner';

// Structure pour les prix par catégorie
export interface CategoryPricing {
  category: string; // Format: "Parent > Enfant > Variation"
  suggestedPrice: number; // Prix de vente suggéré en FCFA
  costPrice?: number; // Prix de revient en FCFA
}

// Structure pour les prix par taille
export interface SizePricing {
  size: string;
  suggestedPrice: number; // Prix de vente suggéré en FCFA
  costPrice: number; // Prix de revient en FCFA
}

interface CategoriesAndSizesPanelProps {
  categories: string[];
  sizes: string[];
  categoryPricing?: CategoryPricing[]; // 🆕 Prix par catégorie
  sizePricing?: SizePricing[]; // Prix par taille
  useGlobalPricing?: boolean; // Utiliser les mêmes prix pour toutes les tailles
  globalCostPrice?: number; // Prix de revient global
  globalSuggestedPrice?: number; // Prix de vente suggéré global
  onCategoriesUpdate: (categories: string[]) => void;
  onSizesUpdate: (sizes: string[]) => void;
  onCategoryPricingUpdate?: (pricing: CategoryPricing[]) => void; // 🆕 Callback pour les prix par catégorie
  onSizePricingUpdate?: (pricing: SizePricing[]) => void; // Callback pour les prix par taille
  onUseGlobalPricingChange?: (value: boolean) => void; // 🆕 Callback pour désactiver useGlobalPricing
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
  sizePricing = [],
  useGlobalPricing = false,
  globalCostPrice = 0,
  globalSuggestedPrice = 0,
  onCategoriesUpdate,
  onSizesUpdate,
  onSizePricingUpdate,
  onUseGlobalPricingChange
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [newCustomSize, setNewCustomSize] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<CategoryForDisplay[]>([]);
  const [localSizePricing, setLocalSizePricing] = useState<SizePricing[]>(sizePricing);

  // Charger les catégories depuis les endpoints réels (cate.md)
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        // 1) Charger toutes les catégories (niveau 0)
        const categories = await categoryRealApi.getCategories().catch((e) => {
          console.warn('⚠️ getCategories error:', e);
          return [] as any[];
        });

        if (!Array.isArray(categories)) {
          console.warn('⚠️ categories non-array, valeur:', categories);
          setHierarchicalCategories([]);
          return;
        }

        // 2) Pour chaque catégorie, charger les sous-catégories (niveau 1)
        const transformed: CategoryForDisplay[] = [];

        for (const parent of categories) {
          const displayParent: CategoryForDisplay = {
            id: parent.id,
            name: parent.name,
            icon: '', // ❌ Plus d'icône
            children: []
          };

          try {
            const subsRaw = await categoryRealApi.getSubCategories(parent.id).catch((e) => {
              console.warn('⚠️ getSubCategories error for', parent.id, e);
              return [] as any[];
            });
            const subs = Array.isArray(subsRaw) ? subsRaw : [];
            for (const sub of subs) {
              const displayChild: ChildCategoryForDisplay = {
                id: sub.id,
                name: sub.name,
                variations: []
              };

              try {
                const varsRaw = await categoryRealApi.getVariations(sub.id).catch((e) => {
                  console.warn('⚠️ getVariations error for sub', sub.id, e);
                  return [] as any[];
                });
                const vars = Array.isArray(varsRaw) ? varsRaw : [];
                displayChild.variations = vars.map(v => ({ id: v.id, name: v.name }));
              } catch (e) {
                console.warn('⚠️ Erreur chargement variations pour sous-catégorie', sub.id, e);
                displayChild.variations = [];
              }

              displayParent.children.push(displayChild);
            }
          } catch (e) {
            console.warn('⚠️ Erreur chargement sous-catégories pour catégorie', parent.id, e);
          }

          transformed.push(displayParent);
        }

        setHierarchicalCategories(transformed);
        console.log('📦 Catégories (cate.md) chargées:', transformed);
      } catch (error) {
        console.error('❌ Erreur chargement catégories (cate.md):', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Initialiser/Mettre à jour les prix par taille quand les tailles changent
  useEffect(() => {
    if (sizes.length > 0) {
      setLocalSizePricing((prevPricing) => {
        const newPricing: SizePricing[] = sizes.map((size) => {
          const existing = prevPricing.find((p) => p.size === size);

          // Si useGlobalPricing est activé, utiliser les prix globaux
          if (useGlobalPricing) {
            return {
              size,
              suggestedPrice: globalSuggestedPrice || 0,
              costPrice: globalCostPrice || 0
            };
          }

          // Sinon, utiliser les valeurs existantes ou des valeurs par défaut
          return existing || {
            size,
            suggestedPrice: 0,
            costPrice: 0
          };
        });
        return newPricing;
      });
    } else {
      setLocalSizePricing([]);
    }
  }, [sizes, useGlobalPricing, globalCostPrice, globalSuggestedPrice]);

  // Appeler onSizePricingUpdate quand localSizePricing change
  useEffect(() => {
    console.log('🔍 [DEBUG CategoriesAndSizesPanel] localSizePricing changed:', {
      localSizePricing,
      hasCallback: !!onSizePricingUpdate
    });
    if (onSizePricingUpdate && localSizePricing.length > 0) {
      console.log('✅ [DEBUG CategoriesAndSizesPanel] Calling onSizePricingUpdate with:', localSizePricing);
      onSizePricingUpdate(localSizePricing);
    }
  }, [localSizePricing, onSizePricingUpdate]);

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

    console.log('🔍 [DEBUG toggleVariation]', {
      parentName,
      childName,
      variationName,
      fullCategoryName,
      selectedParent,
      selectedChildName,
      currentCategories: categories
    });

    // Si on change de sous-catégorie, on reset tout
    if (selectedParent !== parentName || selectedChildName !== childName) {
      onCategoriesUpdate([fullCategoryName]);
      setSelectedChild({ parent: parentName, child: childName });

      // ✅ Les variations sélectionnées deviennent les tailles
      onSizesUpdate([variationName]);
      console.log('✅ Nouvelle sous-catégorie sélectionnée:', `${parentName} > ${childName}`);
      console.log('✅ Taille initialisée:', variationName);
      return;
    }

    // Même sous-catégorie : toggle de la variation
    const isAlreadySelected = categories.includes(fullCategoryName);

    if (isAlreadySelected) {
      // Retirer la variation
      const updated = categories.filter(cat => cat !== fullCategoryName);
      onCategoriesUpdate(updated);

      // Retirer la taille correspondante
      const updatedSizes = (sizes || []).filter(s => s !== variationName);
      onSizesUpdate(updatedSizes);
      console.log('❌ Variation et taille retirées:', variationName);
    } else {
      // Ajouter la variation
      onCategoriesUpdate([...categories, fullCategoryName]);

      // Ajouter la taille correspondante
      if (!sizes.includes(variationName)) {
        onSizesUpdate([...sizes, variationName]);
      }
      console.log('✅ Variation et taille ajoutées:', variationName);
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

  // Fonction pour mettre à jour un champ de prix pour une taille
  const updateSizePricing = (size: string, field: keyof Omit<SizePricing, 'size'>, value: number) => {
    console.log('🔍 [DEBUG updateSizePricing] Called:', { size, field, value });

    // 🔧 CORRECTION: Si useGlobalPricing est activé et que l'utilisateur modifie manuellement un prix,
    // désactiver automatiquement useGlobalPricing
    if (useGlobalPricing && onUseGlobalPricingChange) {
      console.log('⚠️ [DEBUG] Modification manuelle détectée alors que useGlobalPricing est actif');
      console.log('🔧 [DEBUG] Désactivation automatique de useGlobalPricing');
      onUseGlobalPricingChange(false);
      toast.info('Mode "prix global" désactivé suite à votre modification manuelle', {
        duration: 3000
      });
    }

    setLocalSizePricing((prev) => {
      const updated = prev.map((p) =>
        p.size === size ? { ...p, [field]: value } : p
      );
      console.log('🔍 [DEBUG updateSizePricing] New localSizePricing:', updated);

      // 🔧 CORRECTION: Appeler onSizePricingUpdate immédiatement pour éviter les délais de useEffect
      // Cela garantit que le parent reçoit les données à jour même si le formulaire est soumis immédiatement
      if (onSizePricingUpdate && updated.length > 0) {
        console.log('✅ [DEBUG updateSizePricing] Calling onSizePricingUpdate immediately with:', updated);
        onSizePricingUpdate(updated);
      }

      return updated;
    });
  };

  // Récupérer les prix pour une taille donnée
  const getSizePricing = (size: string): SizePricing => {
    return localSizePricing.find((p) => p.size === size) || {
      size,
      suggestedPrice: 0,
      costPrice: 0
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Panel Sélection moderne de catégories */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* En-tête */}
        <div className="bg-gray-900 p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-white" />
            <div>
              <h3 className="text-base font-semibold text-white">Catégorie du produit</h3>
              <p className="text-sm text-gray-300">Sélectionnez une sous-catégorie et ses variations</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Breadcrumb de sélection */}
          {selectedParent && selectedChildName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                <Badge className="bg-gray-900 text-white shrink-0">
                  {selectedParent}
                </Badge>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                <Badge className="bg-gray-700 text-white shrink-0">
                  {selectedChildName}
                </Badge>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedVariations.map((variation, idx) => (
                    <React.Fragment key={variation}>
                      {idx > 0 && <span className="text-gray-400 text-xs">•</span>}
                      <Badge className="bg-gray-600 text-white shrink-0 text-xs">
                        {variation}
                      </Badge>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <AdminButton
                size="sm"
                variant="ghost"
                onClick={removeSelectedCategory}
                className="shrink-0 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </AdminButton>
            </motion.div>
          )}

          {/* Variations sélectionnées (si existantes) */}
          {selectedVariations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-900">
                  Variations sélectionnées
                </Label>
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
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
                        className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white border border-gray-900"
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Tag className="h-8 w-8 text-gray-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune catégorie sélectionnée
              </h4>
              <p className="text-sm text-gray-500">
                Parcourez les catégories ci-dessous pour commencer
              </p>
            </div>
          )}

          {/* Liste des catégories */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              {selectedParent ? 'Changer de catégorie' : 'Parcourir les catégories'}
            </Label>

            {loadingCategories ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
                <p className="text-sm font-medium text-gray-600">Chargement des catégories...</p>
              </div>
            ) : hierarchicalCategories.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-700 mb-1">
                  Aucune catégorie disponible
                </h4>
                <p className="text-sm text-gray-500">
                  Créez des catégories dans la page de gestion
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {hierarchicalCategories.map((category) => (
                  <motion.div
                    key={category.id}
                    layout
                    className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-900 transition-colors"
                  >
                    {/* En-tête catégorie parent */}
                    <button
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">
                          {category.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {category.children.length} sous-{category.children.length > 1 ? 'catégories' : 'catégorie'}
                        </p>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedCategories.has(category.id) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-5 w-5 text-gray-400" />
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
                          className="border-t border-gray-200 bg-gray-50"
                        >
                          <div className="p-4 space-y-3">
                            {category.children.map((child) => {
                              const isChildSelected = selectedParent === category.name && selectedChildName === child.name;

                              return (
                                <div
                                  key={child.id}
                                  className={`rounded-lg border overflow-hidden transition-all ${
                                    isChildSelected
                                      ? 'border-gray-900 bg-gray-100'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {/* En-tête sous-catégorie */}
                                  <div className="p-3 bg-gray-100 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-gray-900">
                                        {child.name}
                                      </span>
                                      <Badge variant="outline" className="text-xs bg-white">
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
                                            whileHover={!isDifferentChild ? { scale: 1.02 } : {}}
                                            whileTap={!isDifferentChild ? { scale: 0.98 } : {}}
                                            onClick={() => !isDifferentChild && toggleVariation(category.name, child.name, variation.name, child.variations)}
                                            disabled={isDifferentChild}
                                            className={`
                                              relative p-3 rounded-lg border font-medium text-sm transition-all
                                              ${isDifferentChild
                                                ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-300'
                                                : isSelected
                                                ? 'border-gray-900 bg-gray-900 text-white'
                                                : 'border-gray-300 bg-white hover:border-gray-900 hover:bg-gray-50'
                                              }
                                            `}
                                          >
                                            <div className="flex flex-col items-center gap-1">
                                              <span className="text-center leading-tight">{variation.name}</span>
                                              {isSelected && (
                                                <motion.div
                                                  initial={{ scale: 0 }}
                                                  animate={{ scale: 1 }}
                                                  className="absolute -top-1 -right-1 bg-gray-900 text-white rounded-full p-1"
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

      {/* Panel Tailles - Simplifié : les variations = tailles */}
      {selectedVariations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ruler className="h-5 w-5 text-white" />
                <h3 className="text-base font-semibold text-white">Tailles et tarification</h3>
              </div>
              <Badge className="bg-white text-gray-900 text-xs">
                {sizes.length} taille{sizes.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <div className="p-6">
            <p className="text-xs text-gray-500 mb-4">
              Les tailles correspondent aux variations sélectionnées ci-dessus. Définissez les tarifs pour chaque taille.
            </p>

            {/* Tableau des prix par taille */}
            <div className="space-y-4">
              {sizes.map((size) => {
                const pricing = getSizePricing(size);
                return (
                  <motion.div
                    key={size}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    {/* Nom de la taille */}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-gray-900 text-white border border-gray-900">
                        {size}
                      </Badge>
                    </div>

                    {/* Champs de prix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Prix de revient */}
                      <div className="space-y-2">
                        <Label htmlFor={`costPrice-${size}`} className="text-sm font-medium">
                          💰 Prix de revient (FCFA)
                        </Label>
                        <Input
                          id={`costPrice-${size}`}
                          type="number"
                          value={pricing.costPrice || ''}
                          onChange={(e) => updateSizePricing(size, 'costPrice', parseFloat(e.target.value) || 0)}
                          placeholder="Coût de production"
                          min="0"
                          step="100"
                          className="font-semibold"
                        />
                      </div>

                      {/* Prix de vente suggéré */}
                      <div className="space-y-2">
                        <Label htmlFor={`suggestedPrice-${size}`} className="text-sm font-medium">
                          💡 Prix de vente suggéré (FCFA)
                        </Label>
                        <Input
                          id={`suggestedPrice-${size}`}
                          type="number"
                          value={pricing.suggestedPrice || ''}
                          onChange={(e) => updateSizePricing(size, 'suggestedPrice', parseFloat(e.target.value) || 0)}
                          placeholder="Prix recommandé"
                          min="0"
                          step="100"
                          className="font-semibold border-green-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Indicateur de marge */}
                    {pricing.costPrice > 0 && pricing.suggestedPrice > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className={`text-xs font-medium ${
                          pricing.suggestedPrice > pricing.costPrice
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          Marge: {pricing.suggestedPrice - pricing.costPrice} FCFA
                          {pricing.costPrice > 0 && ` (${Math.round(((pricing.suggestedPrice - pricing.costPrice) / pricing.costPrice) * 100)}%)`}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {sizes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucune taille sélectionnée
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}; 