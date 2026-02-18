import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, RefreshCw, Loader2, Edit3, ArrowLeft } from 'lucide-react';
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Category } from '../types/category.types';
import { useCategories } from '../contexts/CategoryContext';
import subcategoryService from '../services/subcategoryService';
import categoryDeleteService from '../services/categoryDeleteService';
import DeleteConfirmDialog from '../components/categories/DeleteConfirmDialog';
import { Label } from "../components/ui/label";
import { CreateCategoryRealForm } from '../components/categories/CreateCategoryRealForm';
import { CategoryTree } from '../components/categories/CategoryTree';
import categoryService from '../services/categoryService';
import { Category as HierarchicalCategory } from '../types/category.types';
import { AdminButton } from '../components/admin/AdminButton';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CategoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const {
    categories,
    error,
    refreshCategories: refreshData,
  } = useCategories();

  // États locaux
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // États pour la gestion hiérarchique des catégories
  const [hierarchicalCategories, setHierarchicalCategories] = useState<HierarchicalCategory[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // États pour la gestion des sous-catégories et variations
  const [showAddSubCategoryModal, setShowAddSubCategoryModal] = useState(false);
  const [showAddVariationModal, setShowAddVariationModal] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  const [selectedParentSubCategory, setSelectedParentSubCategory] = useState<Category | null>(null);

  // États pour la suppression améliorée
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [elementToDelete, setElementToDelete] = useState<{
    id: number;
    name: string;
    type: 'category' | 'subcategory' | 'variation';
  } | null>(null);
  const [deleteUsageInfo, setDeleteUsageInfo] = useState<{
    productsCount: number;
  } | null>(null);

  // Formulaires pour sous-catégories et variations
  const [newSubCategory, setNewSubCategory] = useState({
    name: '',
    description: ''
  });

  const [newVariation, setNewVariation] = useState({
    name: ''
  });

  const [variationsToAdd, setVariationsToAdd] = useState<string[]>([]);
  const [currentVariationInput, setCurrentVariationInput] = useState('');

  // Charger la hiérarchie des catégories
  const loadHierarchy = async () => {
    setLoadingHierarchy(true);
    try {
      const hierarchy = await categoryService.getCategoryHierarchy();
      setHierarchicalCategories(hierarchy);
    } catch (error) {
      console.error('Erreur lors du chargement de la hiérarchie:', error);
      toast.error('Erreur lors du chargement de la hiérarchie des catégories');
    } finally {
      setLoadingHierarchy(false);
    }
  };

  useEffect(() => {
    loadHierarchy();
  }, []);

  // Actualiser les données
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshData(), loadHierarchy()]);
      toast.success('Données actualisées avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fonctions pour gérer les sous-catégories
  const handleAddSubCategory = (parentCategory: Category) => {
    setSelectedParentCategory(parentCategory);
    setShowAddSubCategoryModal(true);
    setNewSubCategory({ name: '', description: '' });
  };

  const handleSaveSubCategory = async () => {
    if (!selectedParentCategory || !newSubCategory.name.trim()) return;

    setIsEditing(true);
    try {
      const newSubCategoryData = {
        name: newSubCategory.name.trim(),
        description: newSubCategory.description?.trim() || '',
        categoryId: selectedParentCategory.id,
        level: 1
      };

      const result = await subcategoryService.createSubCategoryWithNotification(
        newSubCategoryData,
        (subcategory) => {
          console.log('Sous-catégorie créée avec succès:', subcategory);
        },
        (error) => {
          console.error('Erreur lors de la création de la sous-catégorie:', error);
        }
      );

      if (result) {
        refreshData();
        setShowAddSubCategoryModal(false);
        setNewSubCategory({ name: '', description: '' });
        setSelectedParentCategory(null);
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      toast.error('Erreur lors de la création de la sous-catégorie');
    } finally {
      setIsEditing(false);
    }
  };

  // Fonctions pour gérer les variations
  const handleAddVariation = (parentSubCategory: Category) => {
    setSelectedParentSubCategory(parentSubCategory);
    setShowAddVariationModal(true);
    setVariationsToAdd([]);
    setCurrentVariationInput('');
  };

  const handleAddVariationToList = () => {
    if (currentVariationInput.trim()) {
      setVariationsToAdd([...variationsToAdd, currentVariationInput.trim()]);
      setCurrentVariationInput('');
    }
  };

  const handleRemoveVariationFromList = (index: number) => {
    setVariationsToAdd(variationsToAdd.filter((_, i) => i !== index));
  };

  const handleSaveVariations = async () => {
    if (!selectedParentSubCategory || variationsToAdd.length === 0) return;

    setIsEditing(true);
    try {
      for (const variationName of variationsToAdd) {
        const newVariationData = {
          name: variationName,
          categoryId: selectedParentSubCategory.parentId || selectedParentSubCategory.id,
          level: 2
        };

        await subcategoryService.createSubCategoryWithNotification(
          newVariationData,
          (variation) => {
            console.log('Variation créée avec succès:', variation);
          },
          (error) => {
            console.error('Erreur lors de la création de la variation:', error);
          }
        );
      }

      refreshData();
      setShowAddVariationModal(false);
      setVariationsToAdd([]);
      setSelectedParentSubCategory(null);
      toast.success('Variations créées avec succès');
    } catch (error) {
      console.error('Erreur inattendue:', error);
      toast.error('Erreur lors de la création des variations');
    } finally {
      setIsEditing(false);
    }
  };

  // Wrapper pour CategoryTree qui convertit Category en type avec 'type'
  const handleDeleteCategory = async (category: Category) => {
    const type = category.level === 0 ? 'category' : category.level === 1 ? 'subcategory' : 'variation';
    await handleDeleteElement({ id: category.id, name: category.name, type });
  };

  // Fonction pour gérer la suppression
  const handleDeleteElement = async (element: { id: number; name: string; type: 'category' | 'subcategory' | 'variation' }) => {
    setElementToDelete(element);

    try {
      const usageInfo = await categoryDeleteService.canDeleteElement(element.type, element.id);
      setDeleteUsageInfo({ productsCount: usageInfo.productsCount || 0 });
      setShowDeleteConfirmDialog(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations:', error);
      toast.error('Erreur lors de la récupération des informations');
    }
  };

  const confirmDelete = async () => {
    if (!elementToDelete) return;

    try {
      await categoryDeleteService.deleteWithNotification(
        elementToDelete.type,
        elementToDelete.id,
        elementToDelete.name,
        () => {
          toast.success(`${elementToDelete.type === 'category' ? 'Catégorie' : elementToDelete.type === 'subcategory' ? 'Sous-catégorie' : 'Variation'} supprimée avec succès`);
          refreshData();
          loadHierarchy();
        },
        (error) => {
          toast.error(error.message || error.error || 'Erreur lors de la suppression');
        }
      );
      setShowDeleteConfirmDialog(false);
      setElementToDelete(null);
      setDeleteUsageInfo(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Fonction pour éditer une catégorie
  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentCategory || !newCategoryName.trim()) {
      toast.error('Le nom de la catégorie ne peut pas être vide.');
      return;
    }

    setIsEditing(true);
    try {
      await categoryService.updateCategory(currentCategory.id, {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim()
      });

      toast.success('Catégorie mise à jour avec succès');
      refreshData();
      loadHierarchy();
      setIsEditModalOpen(false);
      setCurrentCategory(null);
      setNewCategoryName('');
      setNewCategoryDescription('');
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);

      if (error.response?.status === 404) {
        toast.error('Catégorie non trouvée.');
      } else if (error.response?.status === 409) {
        toast.error('Une catégorie avec ce nom existe déjà.');
      } else {
        toast.error(error.message || 'Impossible de modifier la catégorie. Veuillez réessayer.');
      }
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* En-tête simplifié */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gestion des catégories
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{hierarchicalCategories.length}</span> catégorie{hierarchicalCategories.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </AdminButton>

            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle catégorie</span>
            </AdminButton>
          </div>
        </div>
      </motion.div>

      {/* Contenu principal */}
      <div className="px-4 sm:px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Structure hiérarchique
              </h2>
              <Badge variant="outline" className="bg-gray-50">
                {hierarchicalCategories.length} catégories
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Visualisez et organisez vos catégories, sous-catégories et variations
            </p>
          </div>

          <div className="p-6">
            {loadingHierarchy ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="mt-4 text-gray-500">Chargement de la hiérarchie...</span>
              </div>
            ) : (
              <CategoryTree
                categories={hierarchicalCategories}
                onRefresh={loadHierarchy}
                onAddSubCategory={handleAddSubCategory}
                onAddVariation={handleAddVariation}
                onDelete={handleDeleteCategory}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal d'ajout de catégorie */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => setIsAddModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Nouvelle Catégorie
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Ajoutez une nouvelle catégorie
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CreateCategoryRealForm
              onSuccess={() => {
                setIsAddModalOpen(false);
                loadHierarchy();
                refreshData();
                toast.success('Catégorie créée avec succès !');
              }}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition de catégorie */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => !isEditing && setIsEditModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Modifier la catégorie
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editCategoryName" className="text-sm font-medium">
                Nom de la catégorie *
              </Label>
              <Input
                id="editCategoryName"
                placeholder="Nom de la catégorie"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editCategoryDescription" className="text-sm font-medium">
                Description (optionnelle)
              </Label>
              <Textarea
                id="editCategoryDescription"
                placeholder="Description de la catégorie"
                className="resize-none"
                rows={3}
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                disabled={isEditing}
              />
            </div>
          </div>
          <DialogFooter>
            <AdminButton
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditing}
            >
              Annuler
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={handleSaveEdit}
              disabled={isEditing || !newCategoryName.trim()}
            >
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout de sous-catégorie */}
      <Dialog open={showAddSubCategoryModal} onOpenChange={(open) => !isEditing && setShowAddSubCategoryModal(open)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Ajouter une sous-catégorie
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Ajoutez une nouvelle sous-catégorie à "{selectedParentCategory?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subCategoryName" className="text-sm font-medium">
                Nom de la sous-catégorie *
              </Label>
              <Input
                id="subCategoryName"
                placeholder="Nom de la sous-catégorie"
                value={newSubCategory.name}
                onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
                disabled={isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subCategoryDescription" className="text-sm font-medium">
                Description (optionnelle)
              </Label>
              <Textarea
                id="subCategoryDescription"
                placeholder="Description de la sous-catégorie"
                className="resize-none"
                rows={3}
                value={newSubCategory.description}
                onChange={(e) => setNewSubCategory({ ...newSubCategory, description: e.target.value })}
                disabled={isEditing}
              />
            </div>
          </div>
          <DialogFooter>
            <AdminButton
              variant="outline"
              onClick={() => setShowAddSubCategoryModal(false)}
              disabled={isEditing}
            >
              Annuler
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={handleSaveSubCategory}
              disabled={isEditing || !newSubCategory.name.trim()}
            >
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout de variations */}
      <Dialog open={showAddVariationModal} onOpenChange={(open) => !isEditing && setShowAddVariationModal(open)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Ajouter des variations
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Ajoutez des variations à "{selectedParentSubCategory?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">
                Nouvelle variation
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: S, M, L, XL"
                  value={currentVariationInput}
                  onChange={(e) => setCurrentVariationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddVariationToList();
                    }
                  }}
                  disabled={isEditing}
                />
                <AdminButton
                  variant="outline"
                  onClick={handleAddVariationToList}
                  disabled={!currentVariationInput.trim() || isEditing}
                >
                  <PlusCircle className="h-4 w-4" />
                </AdminButton>
              </div>
            </div>

            {variationsToAdd.length > 0 && (
              <div className="grid gap-2">
                <Label className="text-sm font-medium">
                  Variations à ajouter ({variationsToAdd.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {variationsToAdd.map((variation, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {variation}
                      <button
                        onClick={() => handleRemoveVariationFromList(index)}
                        className="ml-1 hover:text-red-500"
                        disabled={isEditing}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <AdminButton
              variant="outline"
              onClick={() => setShowAddVariationModal(false)}
              disabled={isEditing}
            >
              Annuler
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={handleSaveVariations}
              disabled={isEditing || variationsToAdd.length === 0}
            >
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter {variationsToAdd.length} variation{variationsToAdd.length > 1 ? 's' : ''}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      {elementToDelete && (
        <DeleteConfirmDialog
          isOpen={showDeleteConfirmDialog}
          onClose={() => {
            setShowDeleteConfirmDialog(false);
            setElementToDelete(null);
            setDeleteUsageInfo(null);
          }}
          onConfirm={confirmDelete}
          element={elementToDelete}
          usageInfo={deleteUsageInfo}
        />
      )}
    </div>
  );
};

export default CategoryManagement;
