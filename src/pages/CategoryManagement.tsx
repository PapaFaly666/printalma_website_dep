import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Edit, Trash2, RefreshCcw, Loader2, Tag, CheckCircle, XCircle, Search, Box, ShoppingBag,
  Package, ArrowUpDown, ChevronDown, ArrowLeft, Filter, Eye, DollarSign, ChevronRight, Grid3X3, List, X
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
  CardFooter,
} from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Category } from '../schemas/category.schema';
import { useCategories } from '../contexts/CategoryContext';
import { useProducts } from '@/hooks/useProducts';
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
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
import { CreateCategoryStructureForm } from '../components/categories/CreateCategoryStructureForm';
import { CategoryTree } from '../components/categories/CategoryTree';
import categoryService from '../services/categoryService';
import { Category as HierarchicalCategory } from '../types/category.types';
import { fetchCategoryUsage, reassignCategory } from '../services/categoryAdminService';

const CategoryManagement: React.FC = () => {
  const navigate = useNavigate();
  // Utiliser le contexte de catégorie au lieu des états locaux
  const { 
    categories, 
    loading, 
    error, 
    refreshCategories: refreshData, 
    addCategory,
    editCategory,
    removeCategory
  } = useCategories();

  // Obtenir les produits et fonctions
  const { 
    products, 
    isLoading: loadingProducts,
    deleteProduct: removeProduct 
  } = useProducts();

  // Fonction pour compter les produits par catégorie
  const countProductsByCategory = (categoryId: number | undefined) => {
    if (!categoryId || loadingProducts) return 0;
    return products.filter(product => product.categoryId === categoryId).length;
  };

  // États locaux
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [showProductsView, setShowProductsView] = useState(false);
  
  // États de chargement pour les opérations
  const [isAdding, setIsAdding] = useState(false);
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
  
  // État pour la confirmation de suppression de produit
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);
  
  // États pour la pagination et le filtrage des produits
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  // Add state for product color management
  const [productColorImages, setProductColorImages] = useState<Record<number, { selectedColor?: number }>>({});
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  // États pour la gestion hiérarchique des catégories
  const [hierarchicalCategories, setHierarchicalCategories] = useState<HierarchicalCategory[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  
  const handleDeleteConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeleteConfirmationText(e.target.value);
  };

  const isDeleteConfirmationValid = () => {
    return currentCategory && deleteConfirmationText === currentCategory.name;
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

  // Gestion du formulaire d'ajout
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Erreur', { description: 'Le nom de la catégorie ne peut pas être vide.' });
      return;
    }
    
    setIsAdding(true);
    
    try {
      const result = await addCategory(newCategoryName, newCategoryDescription);
      if (result) {
        setIsAddModalOpen(false);
        setNewCategoryName('');
        setNewCategoryDescription('');
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Ouvrir le modal d'édition
  const openEditModal = (category: Category) => {
    setCurrentCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || '');
    setIsEditModalOpen(true);
  };

  // Gestion du formulaire d'édition
  const handleEditCategory = async () => {
    if (!currentCategory || !newCategoryName.trim()) {
      toast.error('Erreur', { description: 'Le nom de la catégorie ne peut pas être vide.' });
      return;
    }
    
    setIsEditing(true);
    
    try {
      const result = await editCategory(
        currentCategory.id as number, 
        newCategoryName, 
        newCategoryDescription
      );
      
      if (result) {
        setIsEditModalOpen(false);
        setCurrentCategory(null);
        setNewCategoryName('');
        setNewCategoryDescription('');
      }
    } finally {
      setIsEditing(false);
    }
  };

  // Ouvrir le modal de suppression
  const openDeleteModal = (category: Category) => {
    setCurrentCategory(category);
    setDeleteConfirmationText(''); // Reset confirmation text
    // Avant d'ouvrir la suppression, vérifier l'usage
    fetchCategoryUsage(category.id as number)
      .then((res) => {
        const data = (res as any)?.data;
        const totalUse = (data?.productsWithCategory || 0) + (data?.productsWithSubCategory || 0);
        if (totalUse > 0) {
          setCategoryUsage({
            productsWithCategory: data?.productsWithCategory || 0,
            productsWithSubCategory: data?.productsWithSubCategory || 0,
            subcategoriesCount: data?.subcategoriesCount || 0,
            variationsCount: data?.variationsCount || 0,
          });
          setIsReassignModalOpen(true);
        } else {
          setIsDeleteModalOpen(true);
        }
      })
      .catch(() => {
        // En cas d'erreur, fallback sur le modal suppression classique
        setIsDeleteModalOpen(true);
      });
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

  // Ouvrir la vue des produits
  const openProductsView = (category: Category) => {
    setCurrentCategory(category);
    setShowProductsView(true);
  };

  // Revenir à la liste des catégories
  const backToCategories = () => {
    setShowProductsView(false);
    setCurrentCategory(null);
  };

  // Filtrer les catégories par le terme de recherche
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );
  
  // Améliorer le composant de chargement pour les catégories
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 flex items-center justify-center">
          <Tag className="h-8 w-8 text-gray-300 dark:text-gray-600" />
        </div>
        <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mt-6">Chargement des catégories...</p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Veuillez patienter</p>
    </div>
  );

  // Améliorer le rendu pour le chargement des produits
  const renderProductSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton pour les stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 shadow-sm rounded-lg h-24 p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>

      {/* Skeleton pour les contrôles */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    </div>
  );

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
  }, [searchTerm, statusFilter, stockFilter]);
  
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
    <div className="w-full max-w-[1400px] mx-auto pt-8 pb-12 space-y-8 px-4 sm:px-6">
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
                className="border-gray-200 dark:border-gray-700 relative"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
                className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black font-medium"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Créer un produit
              </Button>
            </div>
          </div>
          
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {getCategoryProductStats(currentCategory.id).total}
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Publiés</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {getCategoryProductStats(currentCategory.id).published}
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Brouillons</p>
              <h3 className="text-2xl font-bold text-gray-500 dark:text-gray-400 mt-1">
                {getCategoryProductStats(currentCategory.id).draft}
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Rupture</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {getCategoryProductStats(currentCategory.id).outOfStock}
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Stock faible</p>
              <h3 className="text-2xl font-bold text-amber-500 dark:text-amber-400 mt-1">
                {getCategoryProductStats(currentCategory.id).lowStock}
              </h3>
            </div>
          </div>
          
          {/* Section principale avec onglets */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                  <TabsList className="bg-gray-100 dark:bg-gray-900 p-1">
                    <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Tous</TabsTrigger>
                    <TabsTrigger value="published" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Publiés</TabsTrigger>
                    <TabsTrigger value="draft" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Brouillons</TabsTrigger>
                    <TabsTrigger value="out-of-stock" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">En rupture</TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className={viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-900' : ''}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className={viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-900' : ''}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Barre de filtres et recherche */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      placeholder="Rechercher un produit..."
                      className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Select
                      value={stockFilter}
                      onValueChange={setStockFilter}
                    >
                      <SelectTrigger className="w-auto min-w-[150px] border-gray-200 dark:border-gray-700 dark:bg-gray-900 gap-1">
                        <Filter className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Stock" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800">
                        <SelectItem value="all" className="dark:text-gray-100">Tous les stocks</SelectItem>
                        <SelectItem value="in-stock" className="dark:text-gray-100">En stock</SelectItem>
                        <SelectItem value="low-stock" className="dark:text-gray-100">Stock faible</SelectItem>
                        <SelectItem value="out-of-stock" className="dark:text-gray-100">Rupture</SelectItem>
                      </SelectContent>
                    </Select>

                    {(searchTerm || stockFilter !== 'all') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSearchTerm('');
                          setStockFilter('all');
                        }}
                        className="border border-gray-200 dark:border-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
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
                            {searchTerm || stockFilter !== 'all' || statusFilter !== 'all'
                              ? "Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                              : "Cette catégorie ne contient actuellement aucun produit."}
                          </p>
                          {(searchTerm || stockFilter !== 'all' || statusFilter !== 'all') ? (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSearchTerm('');
                                setStockFilter('all');
                                setStatusFilter('all');
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
                                                    (e.target as HTMLImageElement).onerror = null;
                                                    (e.target as HTMLImageElement).src = '';
                                                    (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                                      `<div class="h-full w-full flex items-center justify-center">
                                                        <span class="text-gray-400 text-xs">Photo</span>
                                                      </div>`;
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
                                                    (e.target as HTMLImageElement).onerror = null;
                                                    (e.target as HTMLImageElement).src = '';
                                                    (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                                      `<div class="h-full w-full flex items-center justify-center">
                                                        <span class="text-gray-400 text-xs">Photo</span>
                                                      </div>`;
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
                                              (e.target as HTMLImageElement).onerror = null;
                                              (e.target as HTMLImageElement).src = '';
                                              (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                                `<div class="h-full w-full flex items-center justify-center">
                                                  <span class="text-gray-400 dark:text-gray-500 text-sm">Image non disponible</span>
                                                </div>`;
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
                                              (e.target as HTMLImageElement).onerror = null;
                                              (e.target as HTMLImageElement).src = '';
                                              (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                                `<div class="h-full w-full flex items-center justify-center">
                                                  <span class="text-gray-400 dark:text-gray-500 text-sm">Image non disponible</span>
                                                </div>`;
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
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catégories</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gérez la structure hiérarchique de vos catégories
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRefreshData}
                variant="outline"
                size="sm"
                className="border-gray-200 dark:border-gray-700"
                disabled={isRefreshing}
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                onClick={() => setIsAddModalOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle catégorie
              </Button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                className="mt-2 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <RefreshCcw className="mr-2 h-3 w-3" />
                Réessayer
              </Button>
            </div>
          )}

          {/* Vue Hiérarchique Unique */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Catégories</CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    Structure hiérarchique parent/enfant/variation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingHierarchy ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Chargement...</span>
                </div>
              ) : (
                <CategoryTree
                  categories={hierarchicalCategories}
                  onRefresh={loadHierarchy}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Modal d'ajout de catégorie avec structure hiérarchique */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => setIsAddModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Nouvelle Catégorie
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Ajoutez une catégorie et ses sous-catégories
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CreateCategoryStructureForm
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
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Modifier la catégorie
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Modifiez les informations de la catégorie
            </DialogDescription>
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
              className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black w-full sm:w-auto"
              onClick={handleEditCategory}
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
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Cette action est irréversible. Tous les produits associés à cette catégorie seront affectés.
            </DialogDescription>
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
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Suppression...</span>
                </span>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-200 dark:border-gray-700 dark:text-gray-300 w-full sm:w-auto"
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
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              La catégorie "{currentCategory?.name}" est utilisée par des produits. Réaffectez-les vers une autre catégorie avant suppression.
            </DialogDescription>
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
              className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black w-full sm:w-auto"
              onClick={handleReassignThenDelete}
              disabled={reassignLoading || !reassignTargetCategoryId}
            >
              {reassignLoading ? 'Réaffectation...' : 'Réaffecter puis supprimer'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-200 dark:border-gray-700 dark:text-gray-300 w-full sm:w-auto"
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
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Cette action est irréversible. Le produit sera définitivement supprimé.
            </DialogDescription>
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
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Suppression...</span>
                </span>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-200 dark:border-gray-700 dark:text-gray-300 w-full sm:w-auto"
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
    </div>
  );
};

export default CategoryManagement; 