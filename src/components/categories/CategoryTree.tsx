import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-[#049BE5]/10 to-blue-500/10 dark:from-[#049BE5]/20 dark:to-blue-500/20 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-4xl">📂</span>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#049BE5] rounded-full animate-pulse"></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Aucune catégorie
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md">
          Commencez par créer votre première catégorie pour organiser vos produits
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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

  // Support both property names: subcategories and subCategories (backend uses subCategories)
  const children = category.subcategories || (category as any).subCategories || (category as any).variations || [];
  const hasChildren = children && children.length > 0;

  const getIconAndColor = () => {
    // Use level from category or infer from hierarchy depth
    const categoryLevel = category.level ?? level;

    switch (categoryLevel) {
      case 0:
        return {
          colorClass: 'text-blue-600 dark:text-blue-400',
          bgClass: 'bg-blue-50 dark:bg-blue-950/30'
        };
      case 1:
        return {
          colorClass: 'text-green-600 dark:text-green-400',
          bgClass: 'bg-green-50 dark:bg-green-950/30'
        };
      case 2:
        return {
          colorClass: 'text-orange-600 dark:text-orange-400',
          bgClass: 'bg-orange-50 dark:bg-orange-950/30'
        };
      default:
        return {
          colorClass: 'text-gray-600 dark:text-gray-400',
          bgClass: 'bg-gray-50 dark:bg-gray-950/30'
        };
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(category);
    }
  };

  const handleEdit = async () => {
    if (!editName.trim()) {
      toast.error('Erreur', { description: 'Le nom ne peut pas être vide.' });
      return;
    }

    setIsEditing(true);

    try {
      // Déterminer le type et l'endpoint approprié
      const categoryLevel = category.level ?? level;
      let result;

      if (categoryLevel === 0) {
        // Catégorie principale
        result = await categoryService.updateCategory(category.id, {
          name: editName,
          description: editDescription
        });
      } else if (categoryLevel === 1) {
        // Sous-catégorie
        result = await categoryService.updateSubCategory(category.id, {
          name: editName,
          description: editDescription
        });
      } else {
        // Variation
        result = await categoryService.updateVariation(category.id, {
          name: editName,
          description: editDescription
        });
      }

      // Extraire le nombre de produits affectés
      const productCount = result.data.productCount || 0;

      // Afficher un message de succès approprié
      const typeLabel = categoryLevel === 0 ? 'Catégorie' : categoryLevel === 1 ? 'Sous-catégorie' : 'Variation';

      if (productCount > 0) {
        toast.success(`✅ ${typeLabel} mise à jour avec succès`, {
          description: `📦 ${productCount} mockup(s) régénéré(s) automatiquement`
        });
      } else {
        toast.success(`✅ ${typeLabel} mise à jour avec succès`);
      }

      // Rafraîchir la hiérarchie
      onRefresh();

      // Fermer le modal
      setShowEditDialog(false);
    } catch (error: any) {
      // Gestion des erreurs spécifiques
      if (error.message?.includes('401') || error.message?.includes('Non autorisé')) {
        toast.error('Erreur d\'authentification', {
          description: 'Session expirée. Veuillez vous reconnecter.'
        });
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        toast.error('Erreur de permissions', {
          description: 'Vous n\'avez pas les permissions pour cette action.'
        });
      } else if (error.message?.includes('404')) {
        toast.error('Erreur', {
          description: 'Élément non trouvé.'
        });
      } else if (error.message?.includes('409') || error.message?.includes('DUPLICATE')) {
        toast.error('Erreur', {
          description: 'Un élément avec ce nom existe déjà.'
        });
      } else {
        toast.error('Erreur', {
          description: error.message || 'Impossible de modifier. Veuillez réessayer.'
        });
      }
    } finally {
      setIsEditing(false);
    }
  };

  const childCount = children.length || 0;

  // Determine what to call the children based on the level
  const childrenLabel = level === 0 ? 'sous-catégorie(s)' : level === 1 ? 'variation(s)' : 'élément(s)';

  const deleteMessage = childCount > 0
    ? `Supprimer "${category.name}" et ses ${childCount} ${childrenLabel} ?`
    : `Supprimer "${category.name}" ?`;

  const { colorClass, bgClass } = getIconAndColor();

  return (
    <>
      <div
        className={`group ${level === 0 ? 'border border-[#049BE5]/20 rounded-xl overflow-hidden bg-gradient-to-br from-white to-[#049BE5]/2 dark:from-gray-800 dark:to-[#049BE5]/5 shadow-lg hover:shadow-xl transition-all duration-300' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`flex items-center gap-4 p-4 transition-all duration-300 ${
            level === 0
              ? 'hover:bg-[#049BE5]/5 dark:hover:bg-[#049BE5]/10'
              : level === 1
              ? 'bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 hover:from-[#049BE5]/5 hover:to-transparent dark:hover:from-[#049BE5]/10'
              : 'bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-[#049BE5]/3 hover:to-transparent dark:hover:from-[#049BE5]/6'
          }`}
          style={{ paddingLeft: `${level * 28 + 16}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => !isDeleting && setExpanded(!expanded)}
              className="flex-shrink-0 p-2 hover:bg-[#049BE5]/10 dark:hover:bg-[#049BE5]/20 rounded-lg transition-all duration-200 group-hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeleting}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-[#049BE5] dark:text-[#049BE5]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-[#049BE5]" />
              )}
            </button>
          ) : (
            <div className="w-8" />
          )}

          {/* Category Level Indicator */}
          <div className={`flex-shrink-0 w-3 h-3 rounded-full transition-all duration-300 ${bgClass} ${level === 0 ? 'shadow-lg shadow-[#049BE5]/30' : 'shadow-sm'}`}></div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h4 className={`font-semibold text-gray-900 dark:text-white truncate transition-all duration-200 ${level === 0 ? 'text-lg' : level === 1 ? 'text-base' : 'text-sm'}`}>
                {category.name}
              </h4>
              {hasChildren && (
                <span className="text-xs px-2 py-1 bg-[#049BE5]/10 text-[#049BE5] dark:bg-[#049BE5]/20 dark:text-[#049BE5] rounded-full font-medium">
                  {childCount}
                </span>
              )}
              {/* Badge de comptage des produits liés */}
              <ProductCountBadge
                id={category.id}
                type={level === 0 ? 'category' : level === 1 ? 'subcategory' : 'variation'}
              />
            </div>

            {category.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1 opacity-80">
                {category.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
            {/* Bouton d'ajout pour les catégories principales et sous-catégories */}
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
                className="h-9 w-9 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 rounded-lg transition-all duration-200 hover:scale-110"
                disabled={isDeleting}
              >
                <Plus className="h-4 w-4" />
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
              className="h-9 w-9 hover:bg-[#049BE5]/10 hover:text-[#049BE5] dark:hover:bg-[#049BE5]/20 rounded-lg transition-all duration-200 hover:scale-110"
              disabled={isDeleting}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              title="Supprimer"
              className="h-9 w-9 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 rounded-lg transition-all duration-200 hover:scale-110"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Children */}
        {expanded && hasChildren && (
          <div className={`${level === 0 ? 'border-t border-[#049BE5]/10' : ''} bg-gradient-to-b from-transparent to-[#049BE5]/2 dark:to-[#049BE5]/5`}>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMessage}
              {childCount > 0 && (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  ⚠️ Attention : Cette action supprimera également toutes les sous-catégories !
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => !isEditing && setShowEditDialog(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Modifier {level === 0 ? 'la catégorie' : level === 1 ? 'la sous-catégorie' : 'la variation'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Modifiez les informations
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isEditing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                <p className="text-sm font-medium">⏳ Mise à jour en cours...</p>
                <p className="text-xs mt-1">ℹ️ Les mockups liés seront automatiquement régénérés</p>
              </div>
            )}
            <div className="grid gap-2">
              <label htmlFor="editName" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                Nom *
              </label>
              <Input
                id="editName"
                placeholder="Nom"
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isEditing}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="editDescription" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                Description (optionnelle)
              </label>
              <Textarea
                id="editDescription"
                placeholder="Description"
                className="resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={isEditing}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-0">
            <Button
              type="button"
              className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black w-full sm:w-auto"
              onClick={handleEdit}
              disabled={isEditing}
            >
              {isEditing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Mise à jour...</span>
                </span>
              ) : (
                'Enregistrer'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 dark:border-gray-700 dark:text-gray-300 w-full sm:w-auto"
              onClick={() => setShowEditDialog(false)}
              disabled={isEditing}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
