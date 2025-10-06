import React, { useState, useEffect } from 'react';
import { X, Plus, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ChipsInput } from '../ui/chips-input';
import { CategoryAutocomplete } from '../ui/category-autocomplete';
import { toast } from 'sonner';
import categoryService from '../../services/categoryService';
import { CreateCategoryStructureDto } from '../../types/category.types';
import { Category } from '../../types/category.types';

interface CreateCategoryStructureFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const CreateCategoryStructureForm: React.FC<CreateCategoryStructureFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateCategoryStructureDto>({
    parentName: '',
    parentDescription: '',
    childName: '',
    variations: [],
    sizes: [],
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [selectedChild, setSelectedChild] = useState<Category | null>(null);

  // Charger les catégories existantes pour l'autocomplete
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const allCategories = await categoryService.getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleVariationsChange = (variations: string[]) => {
    setFormData({ ...formData, variations });
  };

  const handleSizesChange = (sizes: string[]) => {
    setFormData({ ...formData, sizes });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.parentName.trim()) {
        toast.error('Le nom de la catégorie est requis');
        setLoading(false);
        return;
      }

      // Si sous-catégorie existe, les variations sont requises
      if (formData.childName && formData.childName.trim() && formData.variations.length === 0) {
        toast.error('Veuillez ajouter au moins une variation pour la sous-catégorie');
        setLoading(false);
        return;
      }

      const result = await categoryService.createStructure(formData);

      toast.success(
        `✅ ${result.message}\n\nCréé: ${result.createdCount} élément(s)\nIgnoré: ${result.skippedVariations.length} doublon(s)`
      );

      onSuccess();

      // Reset form
      setFormData({
        parentName: '',
        parentDescription: '',
        childName: '',
        variations: [],
        sizes: []
      });
    } catch (err: any) {
      console.error('Error creating structure:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // Générer l'aperçu de la structure
  const getStructurePreview = () => {
    const lines: string[] = [];
    const parent = formData.parentName.trim() || 'Catégorie Parent';
    lines.push(`📦 ${parent}`);

    if (formData.childName?.trim()) {
      lines.push(`    └── 📂 ${formData.childName}`);
      if (formData.variations.length > 0) {
        formData.variations.forEach((v, i) => {
          const isLast = i === formData.variations.length - 1;
          lines.push(`        ${isLast ? '└──' : '├──'} 📄 ${v}`);
        });
      } else {
        lines.push(`        └── 📄 [Aucune variation]`);
      }
    } else {
      if (formData.variations.length > 0) {
        formData.variations.forEach((v, i) => {
          const isLast = i === formData.variations.length - 1;
          lines.push(`    ${isLast ? '└──' : '├──'} 📄 ${v}`);
        });
      } else {
        lines.push(`    └── 📄 [Aucune variation]`);
      }
    }

    return lines.join('\n');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Catégorie Parent */}
      <div>
        <Label htmlFor="parentName">
          Catégorie <span className="text-red-500">*</span>
        </Label>
        <CategoryAutocomplete
          categories={categories.filter(cat => cat.level === 0 || !cat.parentId)}
          value={formData.parentName}
          onChange={(value) => setFormData({ ...formData, parentName: value })}
          onCategorySelect={setSelectedParent}
          placeholder="Ex: Téléphone, Vêtements, Accessoires..."
          disabled={loading}
        />
      </div>

      {/* Sous-catégorie (optionnel) */}
      <div>
        <Label htmlFor="childName">Sous-catégorie (optionnel)</Label>
        <CategoryAutocomplete
          categories={categories.filter(cat => cat.level === 1 || (cat.parentId && cat.parentId !== null))}
          value={formData.childName || ''}
          onChange={(value) => setFormData({ ...formData, childName: value })}
          onCategorySelect={setSelectedChild}
          placeholder="Ex: Coque, T-Shirt, Écouteur..."
          disabled={loading}
          parentId={selectedParent?.id}
        />
      </div>

      {/* Variations - Affichées seulement si sous-catégorie existe */}
      {formData.childName && formData.childName.trim() && (
        <>
          <div>
            <Label htmlFor="variations">
              Variations <span className="text-red-500">*</span>
            </Label>
            <ChipsInput
              value={formData.variations}
              onChange={handleVariationsChange}
              placeholder="Ex: iPhone 13, iPhone 14, iPhone 15..."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Appuyez sur Entrée ou virgule pour ajouter une variation
            </p>
          </div>

          {/* Tailles communes pour ces variations */}
          <div>
            <Label htmlFor="sizes">
              Tailles (optionnel)
            </Label>
            <ChipsInput
              value={formData.sizes || []}
              onChange={handleSizesChange}
              placeholder="Ex: Unique, S, M, L, XL..."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tailles communes pour toutes les variations ci-dessus
            </p>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Création en cours...' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};
