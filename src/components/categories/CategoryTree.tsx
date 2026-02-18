import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import categoryService from '../../services/categoryService';
import { Category } from '../../types/category.types';
import { ProductCountBadge } from '../category/ProductCountBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface CategoryTreeProps {
  categories: Category[];
  onRefresh: () => void;
  onEdit?: (category: Category) => void;
  onAddSubCategory?: (category: Category) => void;
  onAddVariation?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({ categories, onRefresh, onEdit, onAddSubCategory, onAddVariation, onDelete }) => {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune catégorie
        </h3>
        <p className="text-sm text-gray-500">
          Créez votre première catégorie pour organiser vos produits
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map(category => (
        <CategoryNode
          key={category.id}
          category={category}
          onRefresh={onRefresh}
          onEdit={onEdit}
          onAddSubCategory={onAddSubCategory}
          onAddVariation={onAddVariation}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

interface CategoryNodeProps {
  category: Category;
  level?: number;
  onRefresh: () => void;
  onEdit?: (category: Category) => void;
  onAddSubCategory?: (category: Category) => void;
  onAddVariation?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level = 0,
  onRefresh,
  onEdit,
  onAddSubCategory,
  onAddVariation,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editDescription, setEditDescription] = useState(category.description || '');

  const children = category.subcategories || (category as any).subCategories || (category as any).variations || [];
  const hasChildren = children && children.length > 0;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(category);
    }
  };

  const handleEdit = async () => {
    if (!editName.trim()) {
      toast.error('Le nom ne peut pas être vide.');
      return;
    }

    setIsEditing(true);

    try {
      const categoryLevel = category.level ?? level;
      let result;

      if (categoryLevel === 0) {
        result = await categoryService.updateCategory(category.id, {
          name: editName,
          description: editDescription
        });
      } else if (categoryLevel === 1) {
        result = await categoryService.updateSubCategory(category.id, {
          name: editName,
          description: editDescription
        });
      } else {
        result = await categoryService.updateVariation(category.id, {
          name: editName,
          description: editDescription
        });
      }

      const productCount = result.data.productCount || 0;
      const typeLabel = categoryLevel === 0 ? 'Catégorie' : categoryLevel === 1 ? 'Sous-catégorie' : 'Variation';

      if (productCount > 0) {
        toast.success(`${typeLabel} mise à jour avec succès`, {
          description: `${productCount} mockup(s) régénéré(s) automatiquement`
        });
      } else {
        toast.success(`${typeLabel} mise à jour avec succès`);
      }

      onRefresh();
      setShowEditDialog(false);
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('Non autorisé')) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        toast.error('Vous n\'avez pas les permissions pour cette action.');
      } else if (error.message?.includes('404')) {
        toast.error('Élément non trouvé.');
      } else if (error.message?.includes('409') || error.message?.includes('DUPLICATE')) {
        toast.error('Un élément avec ce nom existe déjà.');
      } else {
        toast.error(error.message || 'Impossible de modifier. Veuillez réessayer.');
      }
    } finally {
      setIsEditing(false);
    }
  };

  const childCount = children.length || 0;
  const childrenLabel = level === 0 ? 'sous-catégorie(s)' : level === 1 ? 'variation(s)' : 'élément(s)';
  const deleteMessage = childCount > 0
    ? `Supprimer "${category.name}" et ses ${childCount} ${childrenLabel} ?`
    : `Supprimer "${category.name}" ?`;

  return (
    <>
      <div className={level === 0 ? 'border border-gray-200 rounded-lg bg-white mb-1' : ''}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50"
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => !isDeleting && setExpanded(!expanded)}
              className="flex-shrink-0"
              disabled={isDeleting}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Category Info */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className={`font-medium text-gray-900 truncate ${level === 0 ? 'text-sm' : 'text-sm'}`}>
              {category.name}
            </span>
            {hasChildren && (
              <span className="text-xs text-gray-400">
                {childCount}
              </span>
            )}
            <ProductCountBadge
              id={category.id}
              type={level === 0 ? 'category' : level === 1 ? 'subcategory' : 'variation'}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {(level === 0 || level === 1) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (level === 0 && onAddSubCategory) {
                    onAddSubCategory(category);
                  } else if (level === 1 && onAddVariation) {
                    onAddVariation(category);
                  }
                }}
                title={level === 0 ? "Ajouter une sous-catégorie" : "Ajouter une variation"}
                className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                disabled={isDeleting}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditName(category.name);
                setEditDescription(category.description || '');
                setShowEditDialog(true);
              }}
              title="Modifier"
              className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              disabled={isDeleting}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              title="Supprimer"
              className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-gray-100"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Children */}
        {expanded && hasChildren && (
          <div className={level === 0 ? 'border-t border-gray-100' : ''}>
            {children.map((child: any) => (
              <CategoryNode
                key={child.id}
                category={child}
                level={level + 1}
                onRefresh={onRefresh}
                onEdit={onEdit}
                onAddSubCategory={onAddSubCategory}
                onAddVariation={onAddVariation}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-medium">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              {deleteMessage}
              {childCount > 0 && (
                <span className="block mt-2 text-red-600 text-sm">
                  Cette action supprimera également toutes les sous-catégories
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-sm">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-sm"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => !isEditing && setShowEditDialog(open)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              Modifier {level === 0 ? 'la catégorie' : level === 1 ? 'la sous-catégorie' : 'la variation'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isEditing && (
              <div className="bg-blue-50 p-3 rounded text-blue-800 text-sm">
                Mise à jour en cours...
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="editName" className="text-sm font-medium text-gray-700">
                Nom
              </label>
              <Input
                id="editName"
                placeholder="Nom"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isEditing}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="editDescription" className="text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                id="editDescription"
                placeholder="Description (optionnelle)"
                className="resize-none text-sm"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={isEditing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isEditing}
              className="text-sm"
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              onClick={handleEdit}
              disabled={isEditing}
            >
              {isEditing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mise à jour...
                </span>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
