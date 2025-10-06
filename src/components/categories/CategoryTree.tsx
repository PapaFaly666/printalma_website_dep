import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Package, FolderOpen, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import categoryService from '../../services/categoryService';
import { Category } from '../../types/category.types';
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

interface CategoryTreeProps {
  categories: Category[];
  onRefresh: () => void;
  onEdit?: (category: Category) => void;
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({ categories, onRefresh, onEdit }) => {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-blue-50 dark:bg-blue-950/20 p-4 mb-4">
          <Package className="h-12 w-12 text-blue-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          Aucune catégorie
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Créez votre première structure pour commencer
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
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level = 0,
  onRefresh,
  onEdit
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasChildren = category.subcategories && category.subcategories.length > 0;

  const getIconAndColor = () => {
    switch (category.level) {
      case 0:
        return {
          icon: <Package className="h-5 w-5" />,
          colorClass: 'text-blue-600 dark:text-blue-400',
          bgClass: 'bg-blue-50 dark:bg-blue-950/30'
        };
      case 1:
        return {
          icon: <FolderOpen className="h-5 w-5" />,
          colorClass: 'text-green-600 dark:text-green-400',
          bgClass: 'bg-green-50 dark:bg-green-950/30'
        };
      case 2:
        return {
          icon: <FileText className="h-4 w-4" />,
          colorClass: 'text-orange-600 dark:text-orange-400',
          bgClass: 'bg-orange-50 dark:bg-orange-950/30'
        };
      default:
        return {
          icon: <FileText className="h-4 w-4" />,
          colorClass: 'text-gray-600 dark:text-gray-400',
          bgClass: 'bg-gray-50 dark:bg-gray-950/30'
        };
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(category.id);
      toast.success('✅ Catégorie supprimée avec succès');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const childCount = category.subcategories?.length || 0;
  const deleteMessage = childCount > 0
    ? `Supprimer "${category.name}" et ses ${childCount} sous-catégorie(s) ?`
    : `Supprimer "${category.name}" ?`;

  const { icon, colorClass, bgClass } = getIconAndColor();

  return (
    <>
      <div
        className={`group ${level === 0 ? 'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`flex items-center gap-3 p-3.5 transition-all duration-200 ${
            level === 0
              ? 'hover:bg-gray-50 dark:hover:bg-gray-750'
              : level === 1
              ? 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
          style={{ paddingLeft: `${level * 32 + 14}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Icon */}
          <div className={`flex-shrink-0 p-1.5 rounded ${bgClass}`}>
            <div className={colorClass}>{icon}</div>
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {category.name}
              </h4>
              {hasChildren && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({childCount})
                </span>
              )}
            </div>

            {category.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {category.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-1 transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(category)}
                title="Modifier"
                className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              title="Supprimer"
              className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {expanded && hasChildren && (
          <div className={level === 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}>
            {category.subcategories!.map(child => (
              <CategoryNode
                key={child.id}
                category={child}
                level={level + 1}
                onRefresh={onRefresh}
                onEdit={onEdit}
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
    </>
  );
};
