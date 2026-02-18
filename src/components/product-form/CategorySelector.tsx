import React, { useEffect, useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Info, Package } from 'lucide-react';
import { useCategories } from '../../contexts/CategoryContext';
import { toast } from 'sonner';

interface CategorySelectorProps {
  value?: number; // ID de la catégorie sélectionnée
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const { categories, loading: categoriesLoading } = useCategories();
  const [error, setError] = useState<string | null>(null);

  // Debug: Afficher les catégories reçues
  useEffect(() => {
    console.log('🔍 [CategorySelector] Categories loaded:', categories);
    console.log('🔍 [CategorySelector] Loading:', categoriesLoading);
    console.log('🔍 [CategorySelector] Categories count:', categories?.length || 0);
  }, [categories, categoriesLoading]);

  const handleChange = (categoryIdStr: string) => {
    console.log('🔍 [handleChange] categoryIdStr:', categoryIdStr);
    console.log('🔍 [handleChange] Available categories:', categories.map(c => ({ id: c.id, name: c.name, level: c.level, parentId: c.parentId })));
    console.log('🔍 [handleChange] handleChange function called with:', categoryIdStr);

    if (categoryIdStr === 'none') {
      console.log('🔍 [handleChange] Sélection: Aucune catégorie');
      onChange(null);
      return;
    }

    const categoryId = parseInt(categoryIdStr);
    console.log('🔍 [handleChange] categoryId parsed:', categoryId);
    console.log('🔍 [handleChange] Is valid number:', !isNaN(categoryId));

    const category = categories.find((c: any) => c.id === categoryId);
    console.log('🔍 [handleChange] Found category:', category);

    if (isNaN(categoryId)) {
      console.error('❌ [handleChange] Invalid category ID:', categoryIdStr);
      toast.error('ID de catégorie invalide');
      return;
    }

    onChange(categoryId);
    console.log('✅ [handleChange] onChange appelé avec:', categoryId);

    if (category) {
      console.log('✅ Catégorie sélectionnée:', category.name, `(ID: ${category.id}, Level: ${category.level}, ParentId: ${category.parentId})`);
      toast.success(`Catégorie liée: ${category.name}`);
    } else {
      console.log('⚠️ Catégorie non trouvée avec ID:', categoryId);
      toast.error(`Catégorie non trouvée avec ID: ${categoryId}`);
    }
  };

  // Les catégories arrivent déjà plates du backend avec un champ "level"
  // Pas besoin de les aplatir, juste les trier par level et construire le displayName
  const prepareCategoriesForDisplay = (cats: any[]): any[] => {
    console.log('🔍 [prepareCategoriesForDisplay] Input categories:', cats);

    if (!cats || !Array.isArray(cats)) {
      console.log('⚠️ [prepareCategoriesForDisplay] Cats not an array:', cats);
      return [];
    }

    // Créer une map pour retrouver les parents
    const categoryMap = new Map<number, any>();
    cats.forEach(cat => {
      categoryMap.set(cat.id, cat);
    });

    // Construire le displayName avec la hiérarchie
    const result = cats.map(cat => {
      let displayName = cat.name;

      // Si la catégorie a un parentId, trouver le parent pour construire le chemin
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          // Si le parent a lui-même un parent (3 niveaux)
          if (parent.parentId) {
            const grandParent = categoryMap.get(parent.parentId);
            if (grandParent) {
              displayName = `${grandParent.name} > ${parent.name} > ${cat.name}`;
            } else {
              displayName = `${parent.name} > ${cat.name}`;
            }
          } else {
            displayName = `${parent.name} > ${cat.name}`;
          }
        }
      }

      return {
        ...cat,
        displayName
      };
    });

    // Trier par level puis par ordre/nom
    result.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
      return a.name.localeCompare(b.name);
    });

    console.log('📋 [prepareCategoriesForDisplay] Result:', result);
    console.log('📊 [prepareCategoriesForDisplay] Total categories:', result.length);
    console.log('📊 [prepareCategoriesForDisplay] By level:', {
      level0: result.filter(c => c.level === 0).length,
      level1: result.filter(c => c.level === 1).length,
      level2: result.filter(c => c.level === 2).length
    });

    return result;
  };

  const flatCategories = prepareCategoriesForDisplay(categories);

  const selectValue = value?.toString() || 'none';
  console.log('🔍 [CategorySelector] Select value:', selectValue);
  console.log('🔍 [CategorySelector] Prop value:', value);
  console.log('🔍 [CategorySelector] Available categories for selection:', flatCategories.map(c => ({ id: c.id, name: c.name, value: c.id.toString() })));

  return (
    <div className="space-y-3">
      <Label htmlFor="category" className="text-sm font-semibold">
        Catégorie *
      </Label>

      <Select
        value={selectValue}
        onValueChange={handleChange}
        disabled={disabled || categoriesLoading}
        onOpenChange={(open) => {
          console.log('🔍 [CategorySelector] Select opened:', open);
        }}
      >
        <SelectTrigger id="category" className="w-full">
          <SelectValue placeholder={categoriesLoading ? 'Chargement...' : 'Sélectionnez une catégorie'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-gray-500">Aucune catégorie</span>
          </SelectItem>

          {flatCategories.length > 0 ? (
            flatCategories.map(category => {
              console.log('🔍 [CategorySelector] Rendering category:', {
                id: category.id,
                name: category.name,
                level: category.level,
                parentId: category.parentId,
                displayName: category.displayName
              });
              
              return (
                <SelectItem 
                  key={category.id} 
                  value={category.id.toString()}
                  onSelect={() => {
                    console.log('🔍 [SelectItem] onSelect triggered for category:', category.id, category.name);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {/* Indentation visuelle selon le niveau */}
                    <span style={{ marginLeft: `${category.level * 16}px` }} className="text-sm">
                      {category.level === 0 && '📁 '}
                      {category.level === 1 && '📂 '}
                      {category.level === 2 && '🏷️ '}
                      {category.displayName || category.name}
                      {category.level < 2 && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Niveau {category.level})
                        </span>
                      )}
                    </span>
                  </div>
                </SelectItem>
              );
            })
          ) : (
            <SelectItem value="no-categories" disabled>
              <span className="text-gray-500">Aucune catégorie disponible</span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          ⚠️ <strong>Sélectionnez une catégorie existante</strong><br />
          Pour créer une nouvelle catégorie, rendez-vous dans{' '}
          <a href="/admin/categories" className="underline font-semibold">
            Gestion des catégories
          </a>
        </AlertDescription>
      </Alert>

      {value && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Package className="h-4 w-4" />
          <span>
            Catégorie liée: <strong>{flatCategories.find(c => c.id === value)?.name}</strong>
          </span>
        </div>
      )}

      {/* Test de débogage */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm font-medium text-yellow-800 mb-2">Test de débogage :</p>
        <div className="space-y-2">
          <button
            onClick={() => {
              console.log('🧪 [Test] Forcing selection of category 96 (2XL)');
              handleChange('96');
            }}
            className="px-3 py-1 bg-[rgb(20,104,154)]/50 text-white text-xs rounded hover:bg-[rgb(20,104,154)]"
          >
            Test: Sélectionner 2XL (ID: 96)
          </button>
          <button
            onClick={() => {
              console.log('🧪 [Test] Forcing selection of category 93 (Polo)');
              handleChange('93');
            }}
            className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 ml-2"
          >
            Test: Sélectionner Polo (ID: 93)
          </button>
          <button
            onClick={() => {
              console.log('🧪 [Test] Forcing selection of category 92 (Vetement)');
              handleChange('92');
            }}
            className="px-3 py-1 bg-[rgb(20,104,154)]/50 text-white text-xs rounded hover:bg-[rgb(16,83,123)] ml-2"
          >
            Test: Sélectionner Vetement (ID: 92)
          </button>
        </div>
        <p className="text-xs text-yellow-700 mt-2">
          Valeur actuelle: {selectValue} | Prop value: {value}
        </p>
      </div>
    </div>
  );
};
