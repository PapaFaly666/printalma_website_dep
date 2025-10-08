import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Package,
  FolderTree,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import categoryService from '../../services/categoryService';
import { Category } from '../../types/category.types';

interface ProductCategoryMoverProps {
  product: {
    id: number;
    name: string;
    categories?: Category[];
    categoryId?: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ProductCategoryMover: React.FC<ProductCategoryMoverProps> = ({
  product,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    product.categoryId || null
  );
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [message, setMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const categories = await categoryService.getCategoryHierarchy();
      setAllCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoryId) {
      setMessage('Veuillez sélectionner une catégorie');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await categoryService.updateProductCategories(
        product.id,
        [selectedCategoryId]
      );

      toast.success(response.message, {
        description: `Le produit "${product.name}" a été déplacé`,
        icon: <CheckCircle className="h-4 w-4" />
      });

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    } catch (error: any) {
      console.error('Error moving product:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du déplacement';
      setMessage(errorMessage);
      toast.error('Échec du déplacement', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const flattenCategories = (categories: Category[], level: number = 0): Array<Category & { level: number }> => {
    let result: Array<Category & { level: number }> = [];

    categories.forEach(category => {
      result.push({ ...category, level });

      if (category.children && category.children.length > 0) {
        result = [...result, ...flattenCategories(category.children, level + 1)];
      }
    });

    return result;
  };

  const flatCategories = flattenCategories(allCategories);

  const filteredCategories = searchTerm
    ? flatCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : flatCategories;

  const getCurrentCategoryName = () => {
    const currentCategory = flatCategories.find(cat => cat.id === product.categoryId);
    return currentCategory?.name || 'Aucune catégorie';
  };

  const getSelectedCategoryName = () => {
    const selectedCategory = flatCategories.find(cat => cat.id === selectedCategoryId);
    return selectedCategory?.name || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Déplacer le produit vers une autre catégorie
          </DialogTitle>
          <DialogDescription>
            Sélectionnez la nouvelle catégorie pour le produit "{product.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info produit actuel */}
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Produit :</strong> {product.name}
              <br />
              <strong>Catégorie actuelle :</strong> {getCurrentCategoryName()}
            </AlertDescription>
          </Alert>

          {/* Barre de recherche */}
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher une catégorie</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Rechercher par nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={loadingCategories}
              />
            </div>
          </div>

          {/* Liste des catégories */}
          <div className="space-y-2">
            <Label>Sélectionner la nouvelle catégorie *</Label>
            <ScrollArea className="h-64 border rounded-md p-3">
              {loadingCategories ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCategories.length > 0 ? (
                <div className="space-y-1">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-start gap-2 p-2 rounded hover:bg-accent cursor-pointer ${
                        selectedCategoryId === category.id ? 'bg-accent' : ''
                      }`}
                      style={{ marginLeft: `${category.level * 16}px` }}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <Checkbox
                        checked={selectedCategoryId === category.id}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategoryId(category.id);
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {category.level === 0 && '📁'}
                            {category.level === 1 && '📂'}
                            {category.level === 2 && '🏷️'}
                            {' '}
                            {category.name}
                          </span>
                          {category.productCount !== undefined && category.productCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({category.productCount} produits)
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">Aucune catégorie trouvée</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Catégorie sélectionnée */}
          {selectedCategoryId && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Nouvelle catégorie :</strong> {getSelectedCategoryName()}
              </AlertDescription>
            </Alert>
          )}

          {/* Message d'erreur */}
          {message && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedCategoryId || selectedCategoryId === product.categoryId}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Déplacement...
                </>
              ) : (
                'Déplacer le produit'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
