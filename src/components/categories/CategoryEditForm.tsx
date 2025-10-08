import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import categoryService from '../../services/categoryService';
import { Category } from '../../types/category.types';

interface CategoryEditFormProps {
  category: Category;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CategoryEditForm: React.FC<CategoryEditFormProps> = ({
  category,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || ''
  });
  const [loading, setLoading] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProductCount();
  }, [category.id]);

  const fetchProductCount = async () => {
    setLoadingCount(true);
    try {
      const count = await categoryService.getCategoryProductCount(category.id);
      setProductCount(count);
    } catch (error) {
      console.error('Error fetching product count:', error);
      setProductCount(category.productCount || 0);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Le nom de la catégorie est requis');
      return;
    }

    setLoading(true);

    try {
      const response = await categoryService.updateCategory(category.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });

      // ✅ Afficher le message de synchronisation
      toast.success(response.message, {
        description: productCount > 0
          ? `${productCount} produit(s) ont été automatiquement mis à jour`
          : 'Catégorie mise à jour avec succès',
        icon: <CheckCircle className="h-4 w-4" />
      });

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error('Error updating category:', error);
      const errorMessage = error.message || 'Erreur lors de la mise à jour';
      setError(errorMessage);
      toast.error('Échec de la mise à jour', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    formData.name !== category.name ||
    formData.description !== (category.description || '');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la catégorie *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: T-Shirts, Coques iPhone..."
          disabled={loading}
          className={error && !formData.name.trim() ? 'border-red-500' : ''}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description optionnelle de la catégorie"
          disabled={loading}
          rows={3}
        />
      </div>

      {/* Warning: Synchronisation automatique */}
      {productCount > 0 && hasChanges && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Attention : Synchronisation automatique</strong>
            <br />
            Cette catégorie est liée à <strong>{productCount} produit(s)</strong>.
            {' '}Tous seront automatiquement mis à jour avec les nouvelles informations.
          </AlertDescription>
        </Alert>
      )}

      {/* Info: Aucun produit lié */}
      {productCount === 0 && !loadingCount && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Aucun produit n'est actuellement lié à cette catégorie.
          </AlertDescription>
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading || !hasChanges}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            'Mettre à jour'
          )}
        </Button>
      </div>
    </form>
  );
};
