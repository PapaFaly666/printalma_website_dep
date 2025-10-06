import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, X, PlusCircle,  Grid3X3, List,  RefreshCcw, Package, ArrowLeft, Edit, Save, Eye, Trash2, CheckCircle, Info
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  FormControl,
  FormItem,
  FormLabel,
} from "../components/ui/form";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { useForm, FormProvider } from 'react-hook-form';
import ProductTable from '../components/ProductTable';
import { useProducts } from '@/hooks/useProducts';
import { useDeletedProducts } from '../hooks/useDeletedProducts';
import { Product } from '../schemas/product.schema';
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Pagination,
} from "../components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from "../components/ui/sheet";
import { AspectRatio } from "../components/ui/aspect-ratio";
import { Separator } from "../components/ui/separator";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { ImageIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { ProductsTableSkeleton, ProductsGridSkeleton, StatsSkeleton } from '../components/ui/loading';

const ProductList: React.FC = () => {
  // Formulaire pour le modal d'édition (unused - removed)

  // Formulaire pour le tiroir de détail 
  const editDetailMethods = useForm({
    defaultValues: {
      name: '',
      category: 'Mug',
      price: 0,
      stock: 0,
      featured: false,
      description: '',
      status: 'draft'
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Hook pour la gestion des produits (API backend)
  const { 
    products: apiProducts, 
    isLoading: loading, 
    error, 
    refreshProducts,
    deleteProduct,
    updateProduct: updateProductAPI,
    restoreProduct: restoreProductAPI
  } = useProducts();

  // État pour le message de succès
  const [successMessage, setSuccessMessage] = useState('');

  // Utiliser directement les produits de l'API backend
  const products = useMemo(() => {
    return apiProducts;
  }, [apiProducts]);

  // Calcul des statistiques des produits avec useMemo pour éviter la boucle infinie
  const productStats = useMemo(() => {
    return {
      total: products.length,
      published: products.filter(p => p.status === 'PUBLISHED').length,
      draft: products.filter(p => p.status === 'DRAFT').length,
      outOfStock: products.filter(p => p.stock === 0).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length
    };
  }, [products]);

  // Afficher le message de succès si on vient du formulaire de création
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Nettoyer le state après utilisation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Hook pour la gestion de la corbeille
  const { } = useDeletedProducts();

  // États UI
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [, setIsEditModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [, ] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEditProduct, setCurrentEditProduct] = useState<Product | null>(null);
  const [currentDetailProduct, setCurrentDetailProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, ] = useState(5);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Chargement initial des catégories à partir des produits
  useEffect(() => {
    if (!loading && products.length > 0) {
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(products.map(product => product.category?.name))
      ).map(categoryName => {
        const category = products.find(p => p.category?.name === categoryName)?.category;
        return category ? { id: category.id, name: category.name } : { id: 0, name: categoryName as string };
      });
      
      setCategories(uniqueCategories);
    }
  }, [products, loading]);

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await refreshProducts();
      toast.success('Données actualisées');
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fonction pour gérer l'édition d'un produit
  const _unused_handleEditProduct = async (formData: any) => {
    if (!currentEditProduct?.id) return;

    try {
      await updateProductAPI(currentEditProduct.id, formData);
      setIsEditModalOpen(false);
      setCurrentEditProduct(null);
      toast.success('Produit mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du produit');
    }
  };

  // Fonction pour supprimer un produit
  const handleDeleteProduct = async (id: number) => {
    setDeletingProductId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProductId) return;

    try {
      await deleteProduct(deletingProductId);
        setIsDeleteDialogOpen(false);
        setDeletingProductId(null);
        setDeleteConfirmationText('');
      toast.success('Produit supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  const cancelDeleteProduct = () => {
    setIsDeleteDialogOpen(false);
    setDeletingProductId(null);
    setDeleteConfirmationText('');
  };

  const openEditModal = (product: Product) => {
    setCurrentEditProduct(product);
    setIsEditModalOpen(true);
  };

  const openDetailDrawer = (product: Product) => {
    // Si on est en mode carte (grille), rediriger vers la page de détails
    if (viewMode === 'grid') {
      navigate(`/admin/products/${product.id}`);
      return; // on ne montre pas le tiroir de détail
    }

    // Sinon (mode liste), afficher le tiroir latéral comme avant
    setCurrentDetailProduct(product);
    setIsDetailDrawerOpen(true);
    setEditMode(false);
    
    // Pré-remplir le formulaire avec les données du produit pour l'édition rapide
    editDetailMethods.reset({
      name: product.name,
      category: product.category?.name || '',
      price: product.price,
      stock: product.stock,
      featured: product.featured || false,
      description: product.description || '',
      status: product.status
    });
  };

  const openAddDrawer = () => {
    navigate('/admin/add-product');
  };

  const _unused_closeDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
    setCurrentDetailProduct(null);
    setEditMode(false);
    editDetailMethods.reset();
  };

  // Fonction de pagination
  const paginateProducts = (items: Product[], pageNumber: number, perPage: number) => {
    const startIndex = (pageNumber - 1) * perPage;
    return items.slice(startIndex, startIndex + perPage);
  };

  // Fonction de rendu du contenu principal
  const renderProductContent = (products: Product[], filterStatus?: string) => {
    let filteredProducts = products;

    // Filtrage par statut si fourni
    if (filterStatus && filterStatus !== 'all') {
      if (filterStatus === 'published') {
        filteredProducts = products.filter(p => p.status === 'PUBLISHED');
      } else if (filterStatus === 'draft') {
        filteredProducts = products.filter(p => p.status === 'DRAFT');
      } else if (filterStatus === 'out-of-stock') {
        filteredProducts = products.filter(p => p.stock === 0);
      } else if (filterStatus === 'low-stock') {
        filteredProducts = products.filter(p => p.stock > 0 && p.stock < 10);
      }
    }

    // Filtrage par terme de recherche
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par catégorie
    if (currentCategory !== 'all') {
      filteredProducts = filteredProducts.filter(product =>
        product.category?.name === currentCategory
      );
    }

    // Pagination
    const paginatedProducts = paginateProducts(filteredProducts, currentPage, itemsPerPage);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
    if (loading) {
      return viewMode === 'grid' ? <ProductsGridSkeleton /> : <ProductsTableSkeleton />;
    }

    if (filteredProducts.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || currentCategory !== 'all' ? 'Aucun produit trouvé' : 'Aucun produit'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || currentCategory !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter votre premier produit'
            }
          </p>
          {(!searchTerm && currentCategory === 'all') && (
            <Button onClick={openAddDrawer} className="bg-black hover:bg-gray-800 text-white">
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter un produit
          </Button>
          )}
        </div>
      );
    }
    
    return (
      <>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="p-0">
                  <AspectRatio ratio={1} className="bg-gray-100 dark:bg-gray-800">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="object-cover w-full h-full rounded-t-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </AspectRatio>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate flex-1 mr-2">{product.name}</h3>
                    <Badge variant={product.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-xs">
                      {product.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm">{formatPrice(product.price)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Stock: {product.stock}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailDrawer(product);
                      }}
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(product);
                      }}
                      className="flex-1 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.id) {
                          handleDeleteProduct(product.id);
                        }
                      }}
                      className="text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
        <ProductTable
          products={paginatedProducts}
          loading={loading}
          searchTerm={searchTerm}
          currentCategory={currentCategory}
          onEdit={openEditModal}
          onDelete={handleDeleteProduct}
          onDetail={openDetailDrawer}
        />
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                      <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                      {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                ))}
              
              <PaginationItem>
                <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          </div>
        )}
      </>
    );
  };

  // Gestion de l'édition depuis le détail
  const handleEditFromDetail = () => {
    setEditMode(true);
  };

  const handleSaveFromDetail = async () => {
    if (!currentDetailProduct?.id) return;

    try {
      const formData = editDetailMethods.getValues();
      await updateProductAPI(currentDetailProduct.id, {
        ...formData,
        status: formData.status as 'PUBLISHED' | 'DRAFT',
        category: { name: formData.category, id: 0 }
        });
        setEditMode(false);
      toast.success('Produit mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du produit');
    }
  };

  const cancelEditMode = () => {
    setEditMode(false);
    if (currentDetailProduct) {
      editDetailMethods.reset({
        name: currentDetailProduct.name,
        category: currentDetailProduct.category?.name || '',
        price: currentDetailProduct.price,
        stock: currentDetailProduct.stock,
        featured: currentDetailProduct.featured || false,
        description: currentDetailProduct.description || '',
        status: currentDetailProduct.status
      });
    }
  };

  // Gestion de la restauration de produit
  const _unused_handleRestoreProduct = async (id: number) => {
    try {
      await restoreProductAPI(id);
      toast.success('Produit restauré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la restauration du produit');
    }
  };

  // Fonction utilitaire pour vérifier si un produit est supprimé
  const _unused_isProductDeleted = (product: Product) => !!product.deletedAt;
  
  // Validation du texte de confirmation de suppression
  const isDeleteConfirmationValid = () => {
    if (!deletingProductId) return false;
    const product = products.find(p => p.id === deletingProductId);
    return deleteConfirmationText === product?.name;
  };

  // Fonction pour formater les prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(price);
  };

  if (error) {
  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">Erreur</div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={refreshData} className="mt-4">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header avec navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au tableau de bord
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestion des produits
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button 
                onClick={openAddDrawer}
                size="sm"
                className="bg-black hover:bg-gray-800 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouveau produit
              </Button>
            </div>
          </div>
            </div>
          </div>

      {/* Message de succès */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistiques */}
          {loading ? (
            <StatsSkeleton />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
              </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{productStats.total}</p>
              </div>
              </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Publiés</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{productStats.published}</p>
              </div>
            </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Edit className="h-6 w-6 text-yellow-600" />
        </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Brouillons</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{productStats.draft}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <X className="h-6 w-6 text-red-600" />
          </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rupture</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{productStats.outOfStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Info className="h-6 w-6 text-orange-600" />
                </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock bas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{productStats.lowStock}</p>
              </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                </div>

                <div className="flex gap-2">
                <Select value={currentCategory} onValueChange={setCurrentCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                <div className="flex border rounded-lg">
                    <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none"
                    >
                    <List className="h-4 w-4" />
                    </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-l-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onglets */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="published">Publiés</TabsTrigger>
            <TabsTrigger value="draft">Brouillons</TabsTrigger>
            <TabsTrigger value="out-of-stock">Rupture</TabsTrigger>
            <TabsTrigger value="low-stock">Stock bas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
                {renderProductContent(products)}
              </TabsContent>

          <TabsContent value="published" className="mt-6">
            {renderProductContent(products, 'published')}
              </TabsContent>

          <TabsContent value="draft" className="mt-6">
            {renderProductContent(products, 'draft')}
              </TabsContent>

          <TabsContent value="out-of-stock" className="mt-6">
            {renderProductContent(products, 'out-of-stock')}
          </TabsContent>
          
          <TabsContent value="low-stock" className="mt-6">
            {renderProductContent(products, 'low-stock')}
              </TabsContent>
            </Tabs>
        </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le produit. Cette action ne peut pas être annulée.
              <br /><br />
              Pour confirmer, veuillez taper le nom du produit : <strong>{products.find(p => p.id === deletingProductId)?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
                          <Input
                            placeholder="Nom du produit"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            />
                      </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteProduct}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={!isDeleteConfirmationValid()}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet pour les détails du produit */}
        <Sheet open={isDetailDrawerOpen} onOpenChange={setIsDetailDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <FormProvider {...editDetailMethods}>
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <span>{editMode ? 'Modifier le produit' : 'Détails du produit'}</span>
                {!editMode && (
                        <Button 
                          size="sm"
                          variant="outline" 
                          onClick={handleEditFromDetail}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                )}
              </SheetTitle>
              <SheetDescription>
                {editMode ? 'Modifiez les informations du produit' : 'Consultez les informations détaillées du produit'}
              </SheetDescription>
            </SheetHeader>

                  {currentDetailProduct && (
              <div className="py-6 space-y-6">
                      {/* Image du produit */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image</label>
                  <AspectRatio ratio={1} className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    {currentDetailProduct.imageUrl ? (
                            <img 
                        src={currentDetailProduct.imageUrl}
                              alt={currentDetailProduct.name} 
                        className="object-cover w-full h-full"
                            />
                          ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </AspectRatio>
                      </div>
                      
                {/* Formulaire */}
                        <div className="space-y-4">
                          <FormItem>
                    <FormLabel>Nom du produit</FormLabel>
                            <FormControl>
                              <Input
                        {...editDetailMethods.register('name')}
                        disabled={!editMode}
                              />
                            </FormControl>
                          </FormItem>
                          
                            <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <FormControl>
                      <Input
                        {...editDetailMethods.register('category')}
                        disabled={!editMode}
                      />
                    </FormControl>
                            </FormItem>
                            
                  <div className="grid grid-cols-2 gap-4">
                            <FormItem>
                      <FormLabel>Prix (XOF)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                          {...editDetailMethods.register('price', { valueAsNumber: true })}
                          disabled={!editMode}
                                />
                              </FormControl>
                            </FormItem>
                          
                            <FormItem>
                      <FormLabel>Stock</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                          {...editDetailMethods.register('stock', { valueAsNumber: true })}
                          disabled={!editMode}
                                />
                              </FormControl>
                            </FormItem>
                  </div>
                            
                            <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...editDetailMethods.register('description')}
                        disabled={!editMode}
                        rows={3}
                      />
                    </FormControl>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <FormControl>
                              <Select
                        value={editDetailMethods.watch('status')}
                        onValueChange={(value) => editDetailMethods.setValue('status', value)}
                        disabled={!editMode}
                              >
                        <SelectTrigger>
                          <SelectValue />
                                </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Brouillon</SelectItem>
                          <SelectItem value="PUBLISHED">Publié</SelectItem>
                                </SelectContent>
                              </Select>
                    </FormControl>
                            </FormItem>
                          
                  <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                        checked={editDetailMethods.watch('featured')}
                        onCheckedChange={(checked) => editDetailMethods.setValue('featured', checked)}
                        disabled={!editMode}
                              />
                            </FormControl>
                    <FormLabel className="!mt-0">Produit mis en avant</FormLabel>
                          </FormItem>
                          </div>
                          
                {/* Informations supplémentaires (lecture seule) */}
                {!editMode && (
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-sm">Informations</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <div className="flex justify-between">
                        <span>ID:</span>
                        <span>{currentDetailProduct.id}</span>
                                </div>
                      {currentDetailProduct.createdAt && (
                        <div className="flex justify-between">
                          <span>Créé le:</span>
                          <span>{new Date(currentDetailProduct.createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                      {currentDetailProduct.updatedAt && (
                        <div className="flex justify-between">
                          <span>Modifié le:</span>
                          <span>{new Date(currentDetailProduct.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                      )}
                              </div>
                            </div>
                          )}
                            </div>
                          )}
                          
            <SheetFooter className="flex gap-2">
              {editMode ? (
                <>
                  <Button variant="outline" onClick={cancelEditMode}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveFromDetail}>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <SheetClose asChild>
                  <Button variant="outline">Fermer</Button>
                </SheetClose>
                          )}
            </SheetFooter>
            </FormProvider>
          </SheetContent>
        </Sheet>
                    </div>
  );
};

export default ProductList;