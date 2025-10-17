import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Trash2, RefreshCcw, Loader2, Tag, Search, Package, ArrowLeft, Filter, Eye,
  Grid3X3, List, X
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Category } from '../types/category.types';
import { useCategories } from '../contexts/CategoryContext';
import { useProducts } from '@/hooks/useProducts';
import subcategoryService from '../services/subcategoryService';
import categoryDeleteService, { determineCategoryElementType } from '../services/categoryDeleteService';
import DeleteConfirmDialog from '../components/categories/DeleteConfirmDialog';
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useNavigate } from 'react-router-dom';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext,
  PaginationPrevious, 
  PaginationEllipsis
} from "../components/ui/pagination";
import { Skeleton } from "../components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CreateCategoryRealForm } from '../components/categories/CreateCategoryRealForm';
import { CategoryTree } from '../components/categories/CategoryTree';
import categoryService from '../services/categoryService';
import { Category as HierarchicalCategory } from '../types/category.types';
import { fetchCategoryUsage, reassignCategory } from '../services/categoryAdminService';

const CategoryManagement: React.FC = () => {
  const navigate = useNavigate();
  // Utiliser le contexte de catégorie au lieu des états locaux
  const {
    categories,
    error,
    refreshCategories: refreshData,
    addCategory,
    removeCategory
  } = useCategories();

  // Obtenir les produits et fonctions
  const { 
    products, 
    isLoading: loadingProducts,
    deleteProduct: removeProduct 
  } = useProducts();

  
  // États locaux
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [showProductsView, setShowProductsView] = useState(false);
  
  // États de chargement pour les opérations
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // Modal de confirmation de suppression
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [reassignTargetCategoryId, setReassignTargetCategoryId] = useState<number | null>(null);
  const [reassignType, setReassignType] = useState<'category' | 'subcategory' | 'both'>('both');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [categoryUsage, setCategoryUsage] = useState<{
    productsWithCategory: number;
    productsWithSubCategory: number;
    subcategoriesCount: number;
    variationsCount: number;
  } | null>(null);

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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // État pour la confirmation de suppression de produit
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);
  
  // États pour la pagination et le filtrage des produits
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [colorsFilter, setColorsFilter] = useState('all');
  const [imageFilter, setImageFilter] = useState('all');
  
  // Add state for product color management
  const [productColorImages, setProductColorImages] = useState<Record<number, { selectedColor?: number }>>({});
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  // États pour la gestion hiérarchique des catégories
  const [hierarchicalCategories, setHierarchicalCategories] = useState<HierarchicalCategory[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // États pour la gestion des sous-catégories et variations
  const [showAddSubCategoryModal, setShowAddSubCategoryModal] = useState(false);
  const [showAddVariationModal, setShowAddVariationModal] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  const [selectedParentSubCategory, setSelectedParentSubCategory] = useState<Category | null>(null);

  // Formulaires pour sous-catégories et variations
  const [newSubCategory, setNewSubCategory] = useState({
    name: '',
    description: ''
  });

  const [newVariation, setNewVariation] = useState({
    name: ''
  });

  // Liste des variations à ajouter
  const [variationsToAdd, setVariationsToAdd] = useState<string[]>([]);
  const [currentVariationInput, setCurrentVariationInput] = useState('');
  
  const handleDeleteConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeleteConfirmationText(e.target.value);
  };

  const isDeleteConfirmationValid = () => {
    return currentCategory && deleteConfirmationText === currentCategory.name;
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
      // Préparer les données pour l'API
      const newSubCategoryData = {
        name: newSubCategory.name.trim(),
        description: newSubCategory.description?.trim() || '',
        categoryId: selectedParentCategory.id, // Utiliser categoryId comme attendu par le backend
        level: 1 // Niveau sous-catégorie
      };

      // Appeler le service pour créer la sous-catégorie
      const result = await subcategoryService.createSubCategoryWithNotification(
        newSubCategoryData,
        // Callback de succès
        (subcategory) => {
          console.log('Sous-catégorie créée avec succès:', subcategory);
        },
        // Callback d'erreur
        (error) => {
          console.error('Erreur lors de la création de la sous-catégorie:', error);
        }
      );

      if (result) {
        // Recharger les données des catégories
        refreshData();

        // Fermer le modal et réinitialiser le formulaire
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

  // Fonctions pour gérer l'ajout multiple de variations
  const handleAddVariationToList = () => {
    if (currentVariationInput.trim()) {
      setVariationsToAdd([...variationsToAdd, currentVariationInput.trim()]);
      setCurrentVariationInput('');
    }
  };

  const handleRemoveVariationFromList = (index: number) => {
    setVariationsToAdd(variationsToAdd.filter((_, i) => i !== index));
  };

  const handleSaveAllVariations = async () => {
    if (!selectedParentSubCategory || variationsToAdd.length === 0) return;

    setIsEditing(true);

    try {
      // Préparer les données pour l'API
      const variationsData = variationsToAdd.map(variationName => ({
        name: variationName.trim(),
        parentId: selectedParentSubCategory.id,
        level: 2 // Niveau variation
      }));

      // Appeler le service pour créer les variations en lot
      const result = await subcategoryService.createVariationsBatchWithNotification(
        variationsData,
        // Callback de succès
        (batchResult) => {
          console.log('Variations créées avec succès:', batchResult);
        },
        // Callback d'erreur
        (error) => {
          console.error('Erreur lors de la création des variations:', error);
        }
      );

      if (result) {
        // Recharger les données des catégories
        refreshData();

        // Fermer le modal et réinitialiser
        setShowAddVariationModal(false);
        setVariationsToAdd([]);
        setCurrentVariationInput('');
        setSelectedParentSubCategory(null);
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      toast.error('Erreur lors de la création des variations');
    } finally {
      setIsEditing(false);
    }
  };

  const handleVariationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddVariationToList();
    }
  };

  // Fonctions pour la suppression améliorée
  const handleDeleteElement = (element: Category) => {
    const elementType = determineCategoryElementType(element);

    setElementToDelete({
      id: element.id,
      name: element.name,
      type: elementType
    });

    setDeleteUsageInfo(null);
    setDeleteError(null);
    setShowDeleteConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!elementToDelete) return;

    setDeleteError(null);

    try {
      await categoryDeleteService.deleteWithNotification(
        elementToDelete.type,
        elementToDelete.id,
        elementToDelete.name,
        // Callback succès
        () => {
          refreshData();
          setShowDeleteConfirmDialog(false);
          setElementToDelete(null);
        },
        // Callback erreur
        (result) => {
          if (result.details?.productsCount && result.details.productsCount > 0) {
            setDeleteUsageInfo({
              productsCount: result.details.productsCount
            });
          } else {
            setDeleteError(result.message || result.error || 'Erreur lors de la suppression');
          }
        }
      );
    } catch (error) {
      console.error('Erreur inattendue lors de la suppression:', error);
      setDeleteError('Erreur lors de la suppression');
    }
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteConfirmDialog(false);
    setElementToDelete(null);
    setDeleteUsageInfo(null);
    setDeleteError(null);
  };

  
  // Charger la hiérarchie des catégories
  const loadHierarchy = async () => {
    setLoadingHierarchy(true);
    try {
      const hierarchy = await categoryService.getCategoryHierarchy();
      setHierarchicalCategories(hierarchy);
    } catch (error) {
      console.error('Error loading hierarchy:', error);
      toast.error('Erreur lors du chargement de la hiérarchie');
    } finally {
      setLoadingHierarchy(false);
    }
  };

  // Charger la hiérarchie au montage du composant
  useEffect(() => {
    loadHierarchy();
  }, []);
  
  // Fonction pour rafraîchir les données avec feedback
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast.success('Données actualisées', {
        description: 'Les catégories ont été mises à jour avec succès.'
      });
    } catch (err) {
      // Le toast d'erreur est déjà géré dans le contexte
    } finally {
      setIsRefreshing(false);
    }
  };

  
  
  // Gestion du formulaire d'édition
  const handleEditCategory = async () => {
    if (!currentCategory || !newCategoryName.trim()) {
      toast.error('Erreur', { description: 'Le nom de la catégorie ne peut pas être vide.' });
      return;
    }

    setIsEditing(true);

    try {
      // Utiliser directement categoryService pour obtenir la réponse complète avec productCount
      const result = await categoryService.updateCategory(
        currentCategory.id as number,
        {
          name: newCategoryName,
          description: newCategoryDescription
        }
      );

      // Extraire le nombre de produits affectés
      const productCount = result.data.productCount || 0;

      // Afficher un message de succès approprié
      if (productCount > 0) {
        toast.success('✅ Catégorie mise à jour avec succès', {
          description: `📦 ${productCount} mockup(s) régénéré(s) automatiquement`
        });
      } else {
        toast.success('✅ Catégorie mise à jour avec succès');
      }

      // Rafraîchir les données
      await Promise.all([
        loadHierarchy(),
        refreshData()
      ]);

      // Fermer le modal et réinitialiser les champs
      setIsEditModalOpen(false);
      setCurrentCategory(null);
      setNewCategoryName('');
      setNewCategoryDescription('');
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
          description: 'Catégorie non trouvée.'
        });
      } else if (error.message?.includes('409') || error.message?.includes('DUPLICATE_CATEGORY')) {
        toast.error('Erreur', {
          description: 'Une catégorie avec ce nom existe déjà.'
        });
      } else {
        toast.error('Erreur', {
          description: error.message || 'Impossible de modifier la catégorie. Veuillez réessayer.'
        });
      }
    } finally {
      setIsEditing(false);
    }
  };

  
  // Gestion de la suppression
  const handleDeleteCategory = async () => {
    if (!currentCategory || !isDeleteConfirmationValid()) return;
    
    setIsDeleting(true);
    
    try {
      const success = await removeCategory(currentCategory.id as number);
      
      if (success) {
        setIsDeleteModalOpen(false);
        setCurrentCategory(null);
        setDeleteConfirmationText('');
        
        toast.success('Catégorie supprimée', {
          description: `La catégorie "${currentCategory.name}" a été supprimée avec succès.`
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Réaffectation des produits avant suppression
  const handleReassignThenDelete = async () => {
    if (!currentCategory || !reassignTargetCategoryId) {
      toast.error('Veuillez sélectionner une catégorie cible.');
      return;
    }
    setReassignLoading(true);
    try {
      await reassignCategory(currentCategory.id as number, {
        targetCategoryId: reassignTargetCategoryId,
        reassignType,
        reassignVariations: 'keep'
      });
      toast.success('Produits réaffectés');
      setIsReassignModalOpen(false);
      // Après réaffectation, ouvrir le modal de suppression normal
      setIsDeleteModalOpen(true);
    } catch (e: any) {
      toast.error(e?.message || 'Réaffectation impossible');
    } finally {
      setReassignLoading(false);
    }
  };

  // Obtenir les produits d'une catégorie spécifique
  const getProductsByCategory = (categoryId: number | undefined) => {
    if (!categoryId || loadingProducts) return [];
    return products.filter(product => product.categoryId === categoryId);
  };

  
  // Revenir à la liste des catégories
  const backToCategories = () => {
    setShowProductsView(false);
    setCurrentCategory(null);
  };

    
  
  
  // Améliorer l'animation de chargement pour les listes de produits
  const renderProductsLoading = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex items-center space-x-3 mb-6">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 border-t-2 border-b-2 border-purple-500 rounded-full animate-[spin_1.5s_linear_infinite]"></div>
          </div>
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 border-t-2 border-b-2 border-green-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Chargement des produits...</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Préparation de l'affichage</p>
      </div>

      {/* Skeleton pour quelques produits */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden border border-gray-200 dark:border-gray-800">
              <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-900">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
                <TableHead className="w-[350px]"><Skeleton className="h-4 w-32" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="text-center"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="text-center"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-24" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                  <TableCell>
                    <div className="flex gap-3">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  // Ouvrir le modal de suppression de produit
  const openDeleteProductModal = (productId: number) => {
    setProductToDelete(productId);
    setIsDeleteProductModalOpen(true);
  };
  
  // Fonction pour supprimer un produit
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Utiliser la fonction removeProduct obtenue du hook useProducts
      const success = await removeProduct(productToDelete);
      
      if (success) {
        setIsDeleteProductModalOpen(false);
        setProductToDelete(null);
        
        toast.success('Produit supprimé', {
          description: 'Le produit a été supprimé avec succès.'
        });
      } else {
        throw new Error('La suppression a échoué');
      }
    } catch (err) {
      toast.error('Erreur', {
        description: 'Impossible de supprimer le produit. Veuillez réessayer.'
      });
      console.error('Error deleting product:', err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Redirections
  const goToProductDetail = (productId: number) => {
    navigate(`/products/${productId}`);
  };
  
  const goToAddProduct = (categoryId?: number) => {
    navigate('/products/add', { state: { categoryId } });
  };

  // Fonction pour filtrer les produits
  const filterProducts = (products: any[]) => {
    // Filtrage par recherche
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (statusFilter === 'published') {
          return product.status?.toUpperCase() === 'PUBLISHED';
        } else if (statusFilter === 'draft') {
          return product.status?.toUpperCase() === 'DRAFT';
        }
        return true;
      });
    }

    // Filtrage par stock
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (stockFilter === 'in-stock') {
          return product.stock > 0;
        } else if (stockFilter === 'low-stock') {
          return product.stock > 0 && product.stock < 10;
        } else if (stockFilter === 'out-of-stock') {
          return product.stock <= 0;
        }
        return true;
      });
    }

    // Filtrage par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (categoryFilter === 'with-category') {
          return product.categoryId !== undefined && product.categoryId !== null;
        } else if (categoryFilter === 'no-category') {
          return product.categoryId === undefined || product.categoryId === null;
        }
        return true;
      });
    }

    // Filtrage par prix
    if (priceFilter !== 'all') {
      filtered = filtered.filter(product => {
        const price = product.price || 0;
        if (priceFilter === 'low') {
          return price < 5000;
        } else if (priceFilter === 'medium') {
          return price >= 5000 && price < 15000;
        } else if (priceFilter === 'high') {
          return price >= 15000;
        }
        return true;
      });
    }

    // Filtrage par popularité
    if (featuredFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (featuredFilter === 'featured') {
          return product.featured === true;
        } else if (featuredFilter === 'regular') {
          return product.featured !== true;
        }
        return true;
      });
    }

    // Filtrage par nombre de couleurs
    if (colorsFilter !== 'all') {
      filtered = filtered.filter(product => {
        const colorCount = product.colors ? product.colors.length : 0;
        if (colorsFilter === 'no-colors') {
          return colorCount === 0;
        } else if (colorsFilter === 'single-color') {
          return colorCount === 1;
        } else if (colorsFilter === 'multiple-colors') {
          return colorCount > 1;
        }
        return true;
      });
    }

    // Filtrage par présence d'images
    if (imageFilter !== 'all') {
      filtered = filtered.filter(product => {
        const hasImages = product.imageUrl ||
                          product.views?.[0]?.imageUrl ||
                          (product.colors && product.colors.some((color: any) => color.imageUrl));

        if (imageFilter === 'with-images') {
          return hasImages === true;
        } else if (imageFilter === 'no-images') {
          return hasImages !== true;
        }
        return true;
      });
    }

    return filtered;
  };
  
  // Fonction pour paginer les produits
  const paginateProducts = (items: any[], pageNumber: number, perPage: number) => {
    const startIndex = (pageNumber - 1) * perPage;
    return items.slice(startIndex, startIndex + perPage);
  };
  
  // Réinitialiser la page lors du changement de filtres
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, stockFilter, categoryFilter, priceFilter, featuredFilter, colorsFilter, imageFilter]);
  
  // Statistiques des produits pour une catégorie
  const getCategoryProductStats = (categoryId: number | undefined) => {
    const products = categoryId !== undefined ? getProductsByCategory(categoryId) : [];
    return {
      total: products.length,
      published: products.filter(p => p.status?.toUpperCase() === 'PUBLISHED').length,
      draft: products.filter(p => p.status?.toUpperCase() === 'DRAFT').length,
      outOfStock: products.filter(p => p.stock <= 0).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
    };
  };

  // Add this function to handle color selection
  const handleColorClick = (e: React.MouseEvent, product: any, colorIndex: number) => {
    e.stopPropagation(); // Prevent navigation to product detail
    
    // Update the state to store selected color for this product
    setProductColorImages(prev => ({
      ...prev,
      [product.id || 0]: {
        ...(prev[product.id || 0] || {}),
        selectedColor: colorIndex
      }
    }));
  };

  // Initialize default colors when products change
  useEffect(() => {
    if (showProductsView && currentCategory && products.length > 0) {
      const categoryProducts = getProductsByCategory(currentCategory.id);
      const initialColorState: Record<number, { selectedColor?: number }> = {};
      
      categoryProducts.forEach(product => {
        if (product.id && product.colors && product.colors.length > 0) {
          initialColorState[product.id] = { selectedColor: 0 };
        }
      });
      
      setProductColorImages(initialColorState);
    }
  }, [showProductsView, currentCategory, products]);

  return (
    <div className="w-full min-h-screen pt-8 pb-12 space-y-8 px-4 sm:px-6">
      {showProductsView && currentCategory ? (
        <>
          {/* En-tête pour la vue des produits */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={backToCategories}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Retour</span>
                </Button>
                <span className="text-gray-500 dark:text-gray-400">/</span>
                <span className="text-gray-500 dark:text-gray-400">Produits</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentCategory.name}
              </h1>
              {currentCategory.description && (
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {currentCategory.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRefreshData}
                variant="outline"
                className="border-[#049BE5] text-[#049BE5] hover:bg-[#049BE5] hover:text-white relative"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Actualisation...</span>
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Actualiser
                  </>
                )}
              </Button>

              <Button
                onClick={() => goToAddProduct(currentCategory.id)}
                className="bg-[#049BE5] hover:bg-[#0378B1] text-white font-medium"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Créer un produit
              </Button>
            </div>
          </div>
          
          {/* Cartes de statistiques modernisées */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="relative bg-gradient-to-br from-[#049BE5]/10 to-[#049BE5]/5 dark:from-[#049BE5]/20 dark:to-[#049BE5]/10 shadow-lg rounded-xl p-5 border border-[#049BE5]/20 hover:border-[#049BE5]/40 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#049BE5]/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#049BE5] animate-pulse"></div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-[#049BE5] to-blue-600 bg-clip-text text-transparent">
                  {getCategoryProductStats(currentCategory.id).total}
                </h3>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg rounded-xl p-5 border border-green-200/50 hover:border-green-400/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Publiés</p>
                </div>
                <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {getCategoryProductStats(currentCategory.id).published}
                </h3>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 shadow-lg rounded-xl p-5 border border-gray-200/50 hover:border-gray-400/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Brouillons</p>
                </div>
                <h3 className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                  {getCategoryProductStats(currentCategory.id).draft}
                </h3>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 shadow-lg rounded-xl p-5 border border-red-200/50 hover:border-red-400/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Rupture</p>
                </div>
                <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {getCategoryProductStats(currentCategory.id).outOfStock}
                </h3>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-lg rounded-xl p-5 border border-amber-200/50 hover:border-amber-400/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Stock faible</p>
                </div>
                <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {getCategoryProductStats(currentCategory.id).lowStock}
                </h3>
              </div>
            </div>
          </div>
          
          {/* Section principale avec onglets modernisée */}
          <div className="relative bg-gradient-to-br from-white to-[#049BE5]/2 dark:from-gray-800 dark:to-[#049BE5]/5 border border-[#049BE5]/15 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:border-[#049BE5]/25">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#049BE5] via-blue-500 to-[#049BE5]"></div>
            <div className="p-6 sm:p-8">
              <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-8">
                  <TabsList className="relative bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-1.5 border border-[#049BE5]/20 shadow-lg rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#049BE5]/5 to-blue-500/5 rounded-xl"></div>
                    <TabsTrigger value="all" className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#049BE5] data-[state=active]:shadow-md data-[state=active]:border border-transparent data-[state=active]:border-[#049BE5]/30 rounded-lg font-medium transition-all duration-200">Tous</TabsTrigger>
                    <TabsTrigger value="published" className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#049BE5] data-[state=active]:shadow-md data-[state=active]:border border-transparent data-[state=active]:border-[#049BE5]/30 rounded-lg font-medium transition-all duration-200">Publiés</TabsTrigger>
                    <TabsTrigger value="draft" className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#049BE5] data-[state=active]:shadow-md data-[state=active]:border border-transparent data-[state=active]:border-[#049BE5]/30 rounded-lg font-medium transition-all duration-200">Brouillons</TabsTrigger>
                    <TabsTrigger value="out-of-stock" className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-[#049BE5] data-[state=active]:shadow-md data-[state=active]:border border-transparent data-[state=active]:border-[#049BE5]/30 rounded-lg font-medium transition-all duration-200">En rupture</TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-2 rounded-xl shadow-lg border border-[#049BE5]/10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={viewMode === 'grid' ? 'bg-[#049BE5] text-white shadow-lg' : 'hover:bg-[#049BE5]/10 hover:text-[#049BE5] rounded-lg transition-all duration-200'}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={viewMode === 'list' ? 'bg-[#049BE5] text-white shadow-lg' : 'hover:bg-[#049BE5]/10 hover:text-[#049BE5] rounded-lg transition-all duration-200'}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Barre de filtres et recherche modernisée */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#049BE5]/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#049BE5] group-hover:scale-110 transition-transform duration-300" />
                    <Input
                      placeholder="Rechercher un produit..."
                      className="relative pl-12 bg-white dark:bg-gray-900 border-[#049BE5]/20 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-12"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="relative group">
                      <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger className="w-auto min-w-[160px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-12">
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-[#049BE5] group-hover:scale-110 transition-transform duration-300" />
                            <SelectValue placeholder="Stock" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                          <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Tous les stocks</SelectItem>
                          <SelectItem value="in-stock" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">En stock</SelectItem>
                          <SelectItem value="low-stock" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Stock faible</SelectItem>
                          <SelectItem value="out-of-stock" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Rupture</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative group">
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-auto min-w-[160px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-12">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-[#049BE5] group-hover:scale-110 transition-transform duration-300" />
                            <SelectValue placeholder="Catégorie" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                          <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Toutes catégories</SelectItem>
                          <SelectItem value="with-category" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Avec catégorie</SelectItem>
                          <SelectItem value="no-category" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Sans catégorie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative group">
                      <Select value={priceFilter} onValueChange={setPriceFilter}>
                        <SelectTrigger className="w-auto min-w-[160px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-12">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#049BE5] group-hover:scale-110 transition-transform duration-300" />
                            <SelectValue placeholder="Prix" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                          <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Tous les prix</SelectItem>
                          <SelectItem value="low" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">- de 5 000 FCFA</SelectItem>
                          <SelectItem value="medium" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">5 000 - 15 000 FCFA</SelectItem>
                          <SelectItem value="high" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">+ de 15 000 FCFA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(searchTerm || stockFilter !== 'all' || categoryFilter !== 'all' || priceFilter !== 'all' || featuredFilter !== 'all' || colorsFilter !== 'all' || imageFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSearchTerm('');
                          setStockFilter('all');
                          setCategoryFilter('all');
                          setPriceFilter('all');
                          setFeaturedFilter('all');
                          setColorsFilter('all');
                          setImageFilter('all');
                        }}
                        className="bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 hover:bg-[#049BE5]/10 hover:text-[#049BE5] rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-12 w-12"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filtres avancés supplémentaires */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative group">
                    <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                      <SelectTrigger className="w-auto min-w-[140px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-10">
                        <div className="flex items-center gap-2">
                          <span className="text-[#049BE5] group-hover:scale-110 transition-transform duration-300">⭐</span>
                          <SelectValue placeholder="Popularité" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                        <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Tous</SelectItem>
                        <SelectItem value="featured" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">⭐ Populaires</SelectItem>
                        <SelectItem value="regular" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">📦 Standards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative group">
                    <Select value={colorsFilter} onValueChange={setColorsFilter}>
                      <SelectTrigger className="w-auto min-w-[140px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-10">
                        <div className="flex items-center gap-2">
                          <span className="text-[#049BE5] group-hover:scale-110 transition-transform duration-300">🎨</span>
                          <SelectValue placeholder="Couleurs" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                        <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Toutes les couleurs</SelectItem>
                        <SelectItem value="no-colors" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">🔴 Sans couleur</SelectItem>
                        <SelectItem value="single-color" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">🔵 Une seule couleur</SelectItem>
                        <SelectItem value="multiple-colors" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">🌈 Plusieurs couleurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative group">
                    <Select value={imageFilter} onValueChange={setImageFilter}>
                      <SelectTrigger className="w-auto min-w-[140px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-10">
                        <div className="flex items-center gap-2">
                          <span className="text-[#049BE5] group-hover:scale-110 transition-transform duration-300">🖼️</span>
                          <SelectValue placeholder="Images" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                        <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Tous</SelectItem>
                        <SelectItem value="with-images" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">✅ Avec images</SelectItem>
                        <SelectItem value="no-images" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">❌ Sans images</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contenu des onglets avec gestion des produits */}
                <TabsContent value={statusFilter} className="m-0 pt-2">
                  {loadingProducts ? (
                    renderProductsLoading()
                  ) : (() => {
                    const filteredProducts = filterProducts(getProductsByCategory(currentCategory.id));
                    const totalItems = filteredProducts.length;
                    const totalPages = Math.ceil(totalItems / itemsPerPage);
                    const paginatedProducts = paginateProducts(filteredProducts, currentPage, itemsPerPage);
                    
                    if (filteredProducts.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                            <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Aucun produit trouvé</h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                            {searchTerm || stockFilter !== 'all' || statusFilter !== 'all' || featuredFilter !== 'all' || colorsFilter !== 'all' || imageFilter !== 'all'
                              ? "Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                              : "Cette catégorie ne contient actuellement aucun produit."}
                          </p>
                          {(searchTerm || stockFilter !== 'all' || statusFilter !== 'all' || featuredFilter !== 'all' || colorsFilter !== 'all' || imageFilter !== 'all') ? (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSearchTerm('');
                                setStockFilter('all');
                                setStatusFilter('all');
                                setCategoryFilter('all');
                                setPriceFilter('all');
                                setFeaturedFilter('all');
                                setColorsFilter('all');
                                setImageFilter('all');
                              }}
                            >
                              Réinitialiser les filtres
                            </Button>
                          ) : (
                            <Button onClick={() => goToAddProduct(currentCategory.id)}>
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Ajouter un produit
                            </Button>
                          )}
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        {/* Liste de produits */}
                        {viewMode === 'list' ? (
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12 text-center">N°</TableHead>
                                  <TableHead className="w-[350px]">Produit</TableHead>
                                  <TableHead>Prix</TableHead>
                                  <TableHead className="text-center">Stock</TableHead>
                                  <TableHead className="text-center">Statut</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedProducts.map((product, index) => (
                                  <TableRow 
                                    key={product.id} 
                                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                                    onMouseEnter={() => setHoveredProduct(product.id || 0)}
                                    onMouseLeave={() => setHoveredProduct(null)}
                                    onClick={() => goToProductDetail(product.id as number)}
                                  >
                                    <TableCell className="text-center font-medium">
                                      {(currentPage - 1) * itemsPerPage + index + 1}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div 
                                          className="h-14 w-14 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center relative"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            goToProductDetail(product.id as number);
                                          }}
                                        >
                                          {(() => {
                                            // Check if this product has a selected color
                                            const selectedColor = productColorImages[product.id || 0]?.selectedColor;
                                              
                                            // If there's a selected color and it has an image
                                            if (selectedColor !== undefined && 
                                                product.colors && 
                                                product.colors[selectedColor] && 
                                                product.colors[selectedColor].imageUrl) {
                                              return (
                                                <img
                                                  src={product.colors[selectedColor].imageUrl}
                                                  alt={product.name}
                                                  className="h-full w-full object-cover"
                                                  onError={(e) => {
                                                    const img = e.target as HTMLImageElement;
                                                    img.onerror = null;
                                                    img.style.display = 'none';
                                                    const parent = img.parentElement!;
                                                    parent.innerHTML = '<span class="text-gray-400 text-xs">Photo</span>';
                                                  }}
                                                />
                                              );
                                            }
                                            
                                            // Default image behavior
                                            if (product.imageUrl || product.views?.[0]?.imageUrl) {
                                              return (
                                                <img
                                                  src={product.imageUrl || product.views?.[0]?.imageUrl}
                                                  alt={product.name}
                                                  className="h-full w-full object-cover"
                                                  onError={(e) => {
                                                    const img = e.target as HTMLImageElement;
                                                    img.onerror = null;
                                                    img.style.display = 'none';
                                                    const parent = img.parentElement!;
                                                    parent.innerHTML = '<span class="text-gray-400 text-xs">Photo</span>';
                                                  }}
                                                />
                                              );
                                            } else {
                                              return <Package className="h-6 w-6 text-gray-400" />;
                                            }
                                          })()}
                                          
                                          {/* Color switcher overlay on hover */}
                                          {hoveredProduct === product.id && product.colors && product.colors.length > 1 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-0.5 flex justify-center space-x-0.5">
                                              {product.colors.slice(0, 3).map((color: any, index: number) => (
                                                <div 
                                                  key={index}
                                                  className={`w-2.5 h-2.5 rounded-full cursor-pointer ${
                                                    productColorImages[product.id || 0]?.selectedColor === index 
                                                      ? 'ring-1 ring-white' 
                                                      : 'opacity-70 hover:opacity-100'
                                                  }`}
                                                  style={{ backgroundColor: color.hexCode || '#999' }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleColorClick(e, product, index);
                                                  }}
                                                  title={color.name}
                                                />
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{product.name}</p>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900 text-xs font-normal">
                                              {product.category?.name || "Sans catégorie"}
                                            </Badge>
                                            {product.featured && (
                                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-xs font-normal">
                                                Populaire
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {/* Display color swatches */}
                                          {product.colors && product.colors.length > 0 && (
                                            <div className="flex mt-2 gap-1">
                                              {product.colors.slice(0, 4).map((color: any, index: number) => (
                                                <div 
                                                  key={index}
                                                  className={`w-4 h-4 rounded-full cursor-pointer ${
                                                    productColorImages[product.id || 0]?.selectedColor === index 
                                                      ? 'ring-1 ring-black dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-gray-800' 
                                                      : 'border border-gray-200 dark:border-gray-700'
                                                  }`}
                                                  style={{ backgroundColor: color.hexCode || '#999' }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleColorClick(e, product, index);
                                                  }}
                                                  title={color.name}
                                                />
                                              ))}
                                              {product.colors.length > 4 && (
                                                <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">
                                        {new Intl.NumberFormat('fr-FR', { 
                                          style: 'currency', 
                                          currency: 'XOF',
                                          maximumFractionDigits: 0 
                                        }).format(product.price || 0)} FCFA
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge
                                        className={
                                          product.stock > 10
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : product.stock > 0
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        }
                                      >
                                        {product.stock || 0} en stock
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline" className={
                                        product.status?.toUpperCase() === 'PUBLISHED' 
                                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                          : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                      }>
                                        {product.status?.toUpperCase() === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="hidden sm:inline-flex text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 bg-transparent"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            goToProductDetail(product.id as number);
                                          }}
                                        >
                                          <Eye className="h-4 w-4 mr-1" />
                                          Détails
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="hidden md:inline-flex text-red-600 dark:text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 bg-transparent"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteProductModal(product.id as number);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 mr-1" />
                                          Supprimer
                                        </Button>
                                        
                                        {/* Menu déroulant pour mobile */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild className="sm:hidden">
                                            <Button variant="outline" size="sm">
                                              <span className="sr-only">Actions</span>
                                              <span>•••</span>
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                              e.stopPropagation();
                                              goToProductDetail(product.id as number);
                                            }}>
                                              <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-500" />
                                              Voir détails
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 dark:text-red-500" onClick={(e) => {
                                              e.stopPropagation();
                                              openDeleteProductModal(product.id as number);
                                            }}>
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Supprimer
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          /* Mode grille */
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {paginatedProducts.map((product) => (
                              <Card 
                                key={product.id}
                                className="overflow-hidden cursor-pointer hover:border-primary dark:hover:border-primary transition-shadow"
                                onClick={() => goToProductDetail(product.id as number)}
                                onMouseEnter={() => setHoveredProduct(product.id || 0)}
                                onMouseLeave={() => setHoveredProduct(null)}
                              >
                                <div className="aspect-[4/3] relative">
                                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    {(() => {
                                      // Check if this product has a selected color
                                      const selectedColor = productColorImages[product.id || 0]?.selectedColor;
                                        
                                      // If there's a selected color and it has an image
                                      if (selectedColor !== undefined && 
                                          product.colors && 
                                          product.colors[selectedColor] && 
                                          product.colors[selectedColor].imageUrl) {
                                        return (
                                          <img
                                            src={product.colors[selectedColor].imageUrl}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                              const img = e.target as HTMLImageElement;
                                              img.onerror = null;
                                              img.style.display = 'none';
                                              const parent = img.parentElement!;
                                              parent.innerHTML = '<span class="text-gray-400 dark:text-gray-500 text-sm">Image non disponible</span>';
                                            }}
                                          />
                                        );
                                      }
                                      
                                      // Default image behavior
                                      if (product.imageUrl || product.views?.[0]?.imageUrl) {
                                        return (
                                          <img
                                            src={product.imageUrl || product.views?.[0]?.imageUrl}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                              const img = e.target as HTMLImageElement;
                                              img.onerror = null;
                                              img.style.display = 'none';
                                              const parent = img.parentElement!;
                                              parent.innerHTML = '<span class="text-gray-400 dark:text-gray-500 text-sm">Image non disponible</span>';
                                            }}
                                          />
                                        );
                                      } else {
                                        return <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />;
                                      }
                                    })()}
                                  </div>
                                  
                                  {/* Color switcher overlay on hover */}
                                  {hoveredProduct === product.id && product.colors && product.colors.length > 1 && (
                                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                      <div className="flex items-center gap-1">
                                        {product.colors.slice(0, 5).map((color: any, index: number) => (
                                          <div 
                                            key={index}
                                            className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                                              productColorImages[product.id || 0]?.selectedColor === index 
                                                ? 'ring-2 ring-white scale-110' 
                                                : 'opacity-80 hover:opacity-100 hover:scale-110'
                                            }`}
                                            style={{ backgroundColor: color.hexCode || '#999' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleColorClick(e, product, index);
                                            }}
                                            title={color.name}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="absolute top-2 right-2">
                                    <Badge variant="outline" className={
                                      product.status?.toUpperCase() === 'PUBLISHED' 
                                        ? 'bg-green-50/90 backdrop-blur-sm text-green-700 border-green-200 dark:bg-green-900/80 dark:text-green-300 dark:border-green-800'
                                        : 'bg-gray-50/90 backdrop-blur-sm text-gray-700 border-gray-200 dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-700'
                                    }>
                                      {product.status?.toUpperCase() === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                                    </Badge>
                                  </div>
                                </div>
                                <CardContent className="p-4">
                                  <div className="mb-2 flex items-center justify-between">
                                    <Badge className={
                                      product.stock > 10
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                        : product.stock > 0
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    }>
                                      {product.stock || 0} en stock
                                    </Badge>
                                    {product.featured && (
                                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                        Populaire
                                      </Badge>
                                    )}
                                  </div>
                                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                                    {product.name}
                                  </h3>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                                    {product.description || "Aucune description"}
                                  </p>
                                  
                                  {/* Add color swatches for grid view */}
                                  {product.colors && product.colors.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                      {product.colors.map((color: any, index: number) => (
                                        <div
                                          key={index}
                                          className={`w-5 h-5 rounded-full cursor-pointer ${
                                            productColorImages[product.id || 0]?.selectedColor === index 
                                              ? 'ring-1 ring-black dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-gray-800' 
                                              : 'border border-gray-200 dark:border-gray-700'
                                          }`}
                                          style={{ backgroundColor: color.hexCode || '#999' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleColorClick(e, product, index);
                                          }}
                                          title={color.name}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between mt-4">
                                    <div className="font-bold">
                                      {new Intl.NumberFormat('fr-FR', { 
                                        style: 'currency', 
                                        currency: 'XOF',
                                        maximumFractionDigits: 0 
                                      }).format(product.price || 0)} FCFA
                                    </div>
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          goToProductDetail(product.id as number);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDeleteProductModal(product.id as number);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="mt-6">
                            <div className="flex justify-center mb-2 text-sm text-gray-500 dark:text-gray-400">
                              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} produits
                            </div>
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                                
                                {Array.from({ length: totalPages }, (_, i) => {
                                  const pageNum = i + 1;
                                  
                                  if (
                                    pageNum === 1 || 
                                    pageNum === totalPages || 
                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                  ) {
                                    return (
                                      <PaginationItem key={pageNum}>
                                        <PaginationLink
                                          isActive={pageNum === currentPage}
                                          onClick={() => setCurrentPage(pageNum)}
                                          className="cursor-pointer"
                                        >
                                          {pageNum}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  }
                                  
                                  if (
                                    (pageNum === 2 && currentPage > 3) ||
                                    (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                  ) {
                                    return <PaginationItem key={pageNum}><PaginationEllipsis /></PaginationItem>;
                                  }
                                  
                                  return null;
                                })}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                            
                            <div className="flex justify-center mt-2">
                              <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                  setItemsPerPage(Number(value));
                                  setCurrentPage(1);
                                }}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Produits par page" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5 par page</SelectItem>
                                  <SelectItem value="10">10 par page</SelectItem>
                                  <SelectItem value="15">15 par page</SelectItem>
                                  <SelectItem value="25">25 par page</SelectItem>
                                  <SelectItem value="50">50 par page</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* En-tête modernisé */}
          <div className="relative bg-gradient-to-r from-[#049BE5] to-blue-600 rounded-2xl p-8 mb-8 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Catégories</h1>
                <p className="text-white/90 text-lg drop-shadow">
                  Gérez votre structure de catégories
                </p>
              </div>

              <Button
                onClick={() => setIsAddModalOpen(true)}
                size="lg"
                className="bg-white text-[#049BE5] hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold px-6 py-3 rounded-xl hover:scale-105"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Nouvelle catégorie
              </Button>
            </div>
          </div>

          {/* Filtres pour tous les produits */}
          {!showProductsView && products.length > 0 && (
            <div className="relative bg-white dark:bg-gray-800 border border-[#049BE5]/15 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#049BE5] via-blue-500 to-[#049BE5]"></div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#049BE5] animate-pulse"></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Filtres globaux des produits
                  </h2>
                  <Badge variant="outline" className="bg-[#049BE5]/10 text-[#049BE5] border-[#049BE5]/20">
                    {products.length} produits
                  </Badge>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#049BE5]/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#049BE5] group-hover:scale-110 transition-transform duration-300" />
                    <Input
                      placeholder="Rechercher tous les produits..."
                      className="relative pl-12 bg-white dark:bg-gray-900 border-[#049BE5]/20 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-12"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="relative group">
                      <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger className="w-auto min-w-[140px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-12">
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-[#049BE5] group-hover:scale-110 transition-transform duration-300" />
                            <SelectValue placeholder="Stock" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                          <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Tous les stocks</SelectItem>
                          <SelectItem value="in-stock" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">En stock</SelectItem>
                          <SelectItem value="low-stock" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Stock faible</SelectItem>
                          <SelectItem value="out-of-stock" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Rupture</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative group">
                      <Select value={priceFilter} onValueChange={setPriceFilter}>
                        <SelectTrigger className="w-auto min-w-[140px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-12">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#049BE5] group-hover:scale-110 transition-transform duration-300" />
                            <SelectValue placeholder="Prix" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                          <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Tous les prix</SelectItem>
                          <SelectItem value="low" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">- de 5 000 FCFA</SelectItem>
                          <SelectItem value="medium" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">5 000 - 15 000 FCFA</SelectItem>
                          <SelectItem value="high" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">+ de 15 000 FCFA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(searchTerm || stockFilter !== 'all' || priceFilter !== 'all' || featuredFilter !== 'all' || colorsFilter !== 'all' || imageFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSearchTerm('');
                          setStockFilter('all');
                          setPriceFilter('all');
                          setFeaturedFilter('all');
                          setColorsFilter('all');
                          setImageFilter('all');
                        }}
                        className="bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 hover:bg-[#049BE5]/10 hover:text-[#049BE5] rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-12 w-12"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filtres avancés supplémentaires */}
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="relative group">
                    <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                      <SelectTrigger className="w-auto min-w-[130px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-10">
                        <div className="flex items-center gap-2">
                          <span className="text-[#049BE5] group-hover:scale-110 transition-transform duration-300">⭐</span>
                          <SelectValue placeholder="Popularité" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                        <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Tous</SelectItem>
                        <SelectItem value="featured" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">⭐ Populaires</SelectItem>
                        <SelectItem value="regular" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">📦 Standards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative group">
                    <Select value={colorsFilter} onValueChange={setColorsFilter}>
                      <SelectTrigger className="w-auto min-w-[130px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-10">
                        <div className="flex items-center gap-2">
                          <span className="text-[#049BE5] group-hover:scale-110 transition-transform duration-300">🎨</span>
                          <SelectValue placeholder="Couleurs" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                        <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Toutes les couleurs</SelectItem>
                        <SelectItem value="no-colors" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">🔴 Sans couleur</SelectItem>
                        <SelectItem value="single-color" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">🔵 Une seule couleur</SelectItem>
                        <SelectItem value="multiple-colors" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">🌈 Plusieurs couleurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative group">
                    <Select value={imageFilter} onValueChange={setImageFilter}>
                      <SelectTrigger className="w-auto min-w-[130px] bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40 focus:border-[#049BE5] focus:ring-[#049BE5]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-10">
                        <div className="flex items-center gap-2">
                          <span className="text-[#049BE5] group-hover:scale-110 transition-transform duration-300">🖼️</span>
                          <SelectValue placeholder="Images" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 border-[#049BE5]/20 rounded-xl shadow-lg">
                        <SelectItem value="all" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">Tous</SelectItem>
                        <SelectItem value="with-images" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">✅ Avec images</SelectItem>
                        <SelectItem value="no-images" className="dark:text-gray-100 hover:bg-[#049BE5]/5 transition-colors">❌ Sans images</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur modernisé */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-6 rounded-2xl shadow-lg border-[#049BE5]/20 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
              </div>
              <div>
                <p className="font-medium">Erreur</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Vue Hiérarchique Modernisée */}
          <div className="relative bg-white dark:bg-gray-800 border border-[#049BE5]/15 hover:border-[#049BE5]/25 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#049BE5] via-blue-500 to-[#049BE5]"></div>
            <div className="p-8 border-b border-[#049BE5]/10 bg-gradient-to-r from-white to-[#049BE5]/3 dark:from-gray-800 dark:to-[#049BE5]/8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#049BE5] animate-pulse"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Structure hiérarchique
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Visualisez et organisez vos catégories, sous-catégories et variations
              </p>
            </div>
            <div className="p-8">
              {loadingHierarchy ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <Loader2 className="h-8 w-8 animate-spin text-[#049BE5]" />
                    <div className="absolute inset-0 h-8 w-8 animate-ping bg-[#049BE5]/20 rounded-full"></div>
                  </div>
                  <span className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Chargement de la hiérarchie...</span>
                </div>
              ) : (
                <CategoryTree
                  categories={hierarchicalCategories}
                  onRefresh={loadHierarchy}
                  onAddSubCategory={handleAddSubCategory}
                  onAddVariation={handleAddVariation}
                  onDelete={handleDeleteElement}
                />
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Modal d'ajout de catégorie simplifié */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => setIsAddModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Nouvelle Catégorie
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Ajoutez une nouvelle catégorie
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CreateCategoryRealForm
              onSuccess={() => {
                setIsAddModalOpen(false);
                loadHierarchy();
                refreshData();
                toast.success('✅ Catégorie créée avec succès !');
              }}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition de catégorie */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => !isEditing && setIsEditModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Modifier la catégorie
            </DialogTitle>
            </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="editCategoryName" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                Nom de la catégorie *
              </label>
              <Input
                id="editCategoryName"
                placeholder="Nom de la catégorie"
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isEditing}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="editCategoryDescription" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                Description (optionnelle)
              </label>
              <Textarea
                id="editCategoryDescription"
                placeholder="Description de la catégorie"
                className="resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                rows={3}
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                disabled={isEditing}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-0">
            <Button
              type="button"
              className="bg-[#049BE5] hover:bg-[#0378B1] text-white w-full sm:w-auto"
              onClick={handleEditCategory}
              disabled={isEditing}
            >
              {isEditing ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
                  <span>Mise à jour...</span>
                </span>
              ) : (
                'Enregistrer'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#049BE5]/30 text-[#049BE5] hover:bg-[#049BE5]/10 w-full sm:w-auto"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditing}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !isDeleting && setIsDeleteModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Supprimer la catégorie ?
            </DialogTitle>
              </DialogHeader>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 my-2">
            <p className="text-sm">
              Pour confirmer la suppression, veuillez saisir le nom exact de la catégorie <strong>"{currentCategory?.name}"</strong> ci-dessous.
            </p>
          </div>
          
          <div className="my-4">
            <Label htmlFor="deleteConfirmation" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
              Nom de la catégorie
            </Label>
            <Input
              id="deleteConfirmation"
              placeholder={`Saisissez "${currentCategory?.name}"`}
              className="mt-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              value={deleteConfirmationText}
              onChange={handleDeleteConfirmationChange}
              autoComplete="off"
              disabled={isDeleting}
            />
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-0">
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleDeleteCategory}
              disabled={!isDeleteConfirmationValid() || isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
                  <span>Suppression...</span>
                </span>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#049BE5]/30 text-[#049BE5] hover:bg-[#049BE5]/10 w-full sm:w-auto"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmationText('');
              }}
              disabled={isDeleting}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de réaffectation avant suppression */}
      <Dialog open={isReassignModalOpen} onOpenChange={(open) => !reassignLoading && setIsReassignModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Catégorie utilisée: réaffecter les produits
            </DialogTitle>
                </DialogHeader>

          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
              <div>Produits avec cette catégorie: <strong>{categoryUsage?.productsWithCategory || 0}</strong></div>
              <div>Produits avec cette sous-catégorie: <strong>{categoryUsage?.productsWithSubCategory || 0}</strong></div>
              <div>Sous-catégories: <strong>{categoryUsage?.subcategoriesCount || 0}</strong> • Variations: <strong>{categoryUsage?.variationsCount || 0}</strong></div>
            </div>

            <div className="grid gap-2">
              <Label>Catégorie cible</Label>
              <Select
                value={reassignTargetCategoryId ? String(reassignTargetCategoryId) : ''}
                onValueChange={(v) => setReassignTargetCategoryId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.id !== currentCategory?.id)
                    .map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Type de réaffectation</Label>
              <Select value={reassignType} onValueChange={(v) => setReassignType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Catégorie seulement</SelectItem>
                  <SelectItem value="subcategory">Sous-catégorie seulement</SelectItem>
                  <SelectItem value="both">Catégorie et sous-catégorie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-0">
            <Button
              type="button"
              className="bg-[#049BE5] hover:bg-[#0378B1] text-white w-full sm:w-auto"
              onClick={handleReassignThenDelete}
              disabled={reassignLoading || !reassignTargetCategoryId}
            >
              {reassignLoading ? 'Réaffectation...' : 'Réaffecter puis supprimer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#049BE5]/30 text-[#049BE5] hover:bg-[#049BE5]/10 w-full sm:w-auto"
              onClick={() => setIsReassignModalOpen(false)}
              disabled={reassignLoading}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression de produit */}
      <Dialog open={isDeleteProductModalOpen} onOpenChange={(open) => !isDeleting && setIsDeleteProductModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Supprimer ce produit ?
            </DialogTitle>
                  </DialogHeader>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 my-2">
            <p className="text-sm">
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action ne peut pas être annulée.
            </p>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-0">
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleDeleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
                  <span>Suppression...</span>
                </span>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#049BE5]/30 text-[#049BE5] hover:bg-[#049BE5]/10 w-full sm:w-auto"
              onClick={() => {
                setIsDeleteProductModalOpen(false);
                setProductToDelete(null);
              }}
              disabled={isDeleting}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout de sous-catégorie */}
      <Dialog open={showAddSubCategoryModal} onOpenChange={setShowAddSubCategoryModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Ajouter une sous-catégorie
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Ajoutez une nouvelle sous-catégorie à "{selectedParentCategory?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subCategoryName" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                Nom de la sous-catégorie *
              </Label>
              <Input
                id="subCategoryName"
                placeholder="Nom de la sous-catégorie"
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                value={newSubCategory.name}
                onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subCategoryDescription" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                Description (optionnelle)
              </Label>
              <Textarea
                id="subCategoryDescription"
                placeholder="Description de la sous-catégorie"
                className="resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                rows={3}
                value={newSubCategory.description}
                onChange={(e) => setNewSubCategory({ ...newSubCategory, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-0">
            <Button
              type="button"
              className="bg-[#049BE5] hover:bg-[#0378B1] text-white w-full sm:w-auto"
              onClick={handleSaveSubCategory}
              disabled={!newSubCategory.name.trim() || isEditing}
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Ajouter la sous-catégorie'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#049BE5]/30 text-[#049BE5] hover:bg-[#049BE5]/10 w-full sm:w-auto"
              onClick={() => {
                setShowAddSubCategoryModal(false);
                setNewSubCategory({ name: '', description: '' });
                setSelectedParentCategory(null);
              }}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout de variation */}
      <Dialog open={showAddVariationModal} onOpenChange={setShowAddVariationModal}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Ajouter des variations
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Ajoutez plusieurs variations à "{selectedParentSubCategory?.name}" en appuyant sur Entrée
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="variationInput" className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                Nom de la variation
              </Label>
              <div className="flex gap-2">
                <Input
                  id="variationInput"
                  placeholder="Tapez un nom et appuyez sur Entrée"
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex-1"
                  value={currentVariationInput}
                  onChange={(e) => setCurrentVariationInput(e.target.value)}
                  onKeyDown={handleVariationInputKeyDown}
                />
                <Button
                  type="button"
                  onClick={handleAddVariationToList}
                  disabled={!currentVariationInput.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Ajouter
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Appuyez sur Entrée pour ajouter rapidement plusieurs variations
              </p>
            </div>

            {/* Liste des variations à ajouter */}
            {variationsToAdd.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                  Variations à ajouter ({variationsToAdd.length})
                </Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {variationsToAdd.map((variation, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-2 rounded border">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{variation}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariationFromList(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-0">
            <Button
              type="button"
              className="bg-[#049BE5] hover:bg-[#0378B1] text-white w-full sm:w-auto"
              onClick={handleSaveAllVariations}
              disabled={variationsToAdd.length === 0 || isEditing}
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                `Ajouter ${variationsToAdd.length} variation(s)`
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#049BE5]/30 text-[#049BE5] hover:bg-[#049BE5]/10 w-full sm:w-auto"
              onClick={() => {
                setShowAddVariationModal(false);
                setVariationsToAdd([]);
                setCurrentVariationInput('');
                setSelectedParentSubCategory(null);
              }}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression amélioré */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirmDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        element={elementToDelete || { id: 0, name: '', type: 'category' }}
        usageInfo={deleteUsageInfo}
        loading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default CategoryManagement; 