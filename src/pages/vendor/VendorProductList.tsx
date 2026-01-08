import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, X, PlusCircle, Filter, Grid3X3, List, RefreshCcw,
  Loader2, Package, ArrowLeft, Edit, Trash2, Eye, Rocket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useVendorProducts } from '../../hooks/useVendorProducts';
import { useDeletedProducts } from '../../hooks/useDeletedProducts';
import { useProductImageUrl } from '../../hooks/useProductImage';
import { Product } from '../../schemas/product.schema';
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "../../components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ProductsTableSkeleton, ProductsGridSkeleton, StatsSkeleton } from '../../components/ui/loading';
import { productValidationService } from '../../services/ProductValidationService';
import { vendorProductServiceNew, ManualPublishResult } from '../../services/vendorProductService';
import { ModernVendorProductCard } from '../../components/vendor/ModernVendorProductCard';

interface ProductListProps {
  showFilters?: boolean;
}

// Extension du type Product pour inclure les nouveaux champs workflow
interface ProductWithWorkflow extends Product {
  isValidated?: boolean;
  designValidationStatus?: 'PENDING' | 'VALIDATED' | 'REJECTED';
  forcedStatus?: 'PENDING' | 'DRAFT';
  colorVariations?: Array<{
    id: number;
    name: string;
    colorCode: string;
    images?: Array<{ 
      id: number;
      url: string;
      view?: string;
      colorName: string;
      colorCode: string;
      validation?: {
        colorId: number;
        vendorProductId: number;
      };
    }>;
    _debug?: {
      validatedImages: number;
      filteredOut: number;
    };
  }>;
  baseProduct?: {
    id: number;
    name: string;
    type?: string;
    categories?: Array<{ id: number; name: string }>;
  };
  vendorName?: string;
  vendorDescription?: string;
  images?: {
    validation?: {
      hasImageMixing: boolean;
      allImagesValidated: boolean;
      productType: string;
    };
  };
}

// 🎯 Logique de détection workflow selon les spécifications
interface ProductDisplayLogic {
  status: 'PUBLISHED' | 'PENDING' | 'DRAFT';
  forcedStatus: 'PENDING' | 'DRAFT';
  isValidated: boolean;
  designValidationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
}

const getProductDisplay = (product: ProductWithWorkflow) => {
  // 1️⃣ Déterminer le workflow original
  const workflowType = product.forcedStatus === 'PENDING' ? 'AUTO_PUBLISH' : 'MANUAL_PUBLISH';
  
  // 2️⃣ Status badge affiché
  const displayStatus = product.status || 'DRAFT';
  
  // 3️⃣ Bouton "Publier maintenant" visible
  const showPublishButton = (
    product.forcedStatus === 'DRAFT' && 
    product.isValidated === true &&
    displayStatus === 'DRAFT'
  );
  
  // 4️⃣ Message workflow
  const workflowMessage = workflowType === 'AUTO_PUBLISH' 
    ? "Workflow AUTO-PUBLISH activé" 
    : "Workflow MANUEL - Clic requis pour publier";
    
  return {
    workflowType,
    displayStatus,
    showPublishButton,
    workflowMessage
  };
};

// 🎨 Composant StatusBadge moderne selon les spécifications
const StatusBadge = ({ product }: { product: ProductWithWorkflow }) => {
  const display = getProductDisplay(product);
  
  if (display.displayStatus === 'PUBLISHED') {
    return (
      <Badge className="bg-black text-white hover:bg-gray-800">
        🚀 Publié
      </Badge>
    );
  }
  
  if (display.displayStatus === 'DRAFT') {
    if (display.showPublishButton) {
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-700">
          📝 Prêt à publier
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500 text-white hover:bg-gray-600">
          📝 Brouillon
        </Badge>
      );
    }
  }
  
  // Par défaut, traiter comme "En attente" pour les statuts non-PUBLISHED et non-DRAFT
  return (
    <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
      ⏳ En attente
    </Badge>
  );
};

// 🔄 Composant WorkflowIndicator selon les spécifications
const WorkflowIndicator = ({ product }: { product: ProductWithWorkflow }) => {
  const display = getProductDisplay(product);
  
  return (
    <div className="text-xs space-y-1">
      <div className={`font-medium ${
        display.workflowType === 'AUTO_PUBLISH' ? 'text-green-600' : 'text-purple-600'
      }`}>
        {display.workflowMessage}
      </div>
      
      {/* Validation Status */}
      {product.designValidationStatus === 'PENDING' && (
        <div className="text-yellow-600">🔍 Design en cours de validation</div>
      )}
      {product.designValidationStatus === 'VALIDATED' && (
        <div className="text-green-600">✅ Design validé</div>
      )}
      {product.designValidationStatus === 'REJECTED' && (
        <div className="text-red-600">❌ Design rejeté</div>
      )}
    </div>
  );
};

// Interface d'adaptation pour unifier les types
interface AdaptedVendorProduct {
  id: number;
  name?: string;
  vendorName?: string;
  vendorDescription?: string;
  description?: string;
  price: number;
  stock?: number;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING';
  isValidated?: boolean;
  forcedStatus?: 'PENDING' | 'DRAFT';
  colorVariations?: Array<{
    id: number;
    name: string;
    colorCode: string;
    images?: Array<{ 
      id: number;
      url: string;
      view?: string;
      colorName: string;
      colorCode: string;
      validation?: {
        colorId: number;
        vendorProductId: number;
      };
    }>;
    _debug?: {
      validatedImages: number;
      filteredOut: number;
    };
  }>;
  baseProduct?: {
    id: number;
    name: string;
    type?: string;
    categories?: Array<{ id: number; name: string }>;
  };
  selectedSizes?: Array<{
    id: number;
    sizeName: string;
  }>;
  images?: {
    validation?: {
      hasImageMixing: boolean;
      allImagesValidated: boolean;
      productType: string;
    };
  };
}

// Fonction d'adaptation pour convertir ProductWithWorkflow vers AdaptedVendorProduct
const adaptProductForCard = (product: ProductWithWorkflow): AdaptedVendorProduct & any => {
  // Un objet que nous allons enrichir progressivement
  const adapted: any = {
    ...product,
    // 🔑 Toujours avoir un id défini
    id: product.id || 0,
    // 🏷️ Nom à afficher : priorité au nom vendeur puis admin
    name: (product as any).name || product.vendorName || (product as any).originalAdminName,
    vendorName: product.vendorName || (product as any).name,
    vendorDescription: product.vendorDescription || product.description,
  };

  // 🎨 Variations couleur : priorité à l'architecture V2 adminProduct
  adapted.colorVariations = (product as any).adminProduct?.colorVariations?.length
    ? (product as any).adminProduct.colorVariations
    : (product as any).colorVariations || [];

  // 📏 Tailles sélectionnées (compatibilité V1/V2)
  adapted.selectedSizes = (product as any).selectedSizes || product.sizes?.map(size => ({
    id: size.id,
    sizeName: (size as any).sizeName || (size as any).name
  })) || [];

  // 🆕 Injecter directement adminProduct & images si présents (Architecture V2)
  if ((product as any).adminProduct) {
    adapted.adminProduct = (product as any).adminProduct;
  }
  if ((product as any).images) {
    adapted.images = (product as any).images;
  }

  // 🖼️ Si aucune structure images n'existe mais que nous pouvons déduire une primaryImageUrl
  if (!adapted.images && adapted.colorVariations?.length) {
    const firstVariation = adapted.colorVariations[0];
    const firstImageUrl = firstVariation?.images?.[0]?.url;
    if (firstImageUrl) {
      adapted.images = {
        adminReferences: adapted.colorVariations.map((cv: any) => ({
          colorName: cv.name,
          colorCode: cv.colorCode,
          adminImageUrl: cv.images?.[0]?.url,
          imageType: 'admin_reference'
        })),
        total: adapted.colorVariations.reduce((acc: number, cv: any) => acc + (cv.images?.length || 0), 0),
        primaryImageUrl: firstImageUrl,
        validation: {
          isHealthy: true,
          totalIssuesDetected: 0
        }
      };
    }
  }

  return adapted;
};

// Composant pour la grille de produits
const ProductGrid = ({ 
  products, 
  onEdit, 
  onDelete, 
  onView,
  onSubmit,
  onPublishManually,
  onUnpublish
}: { 
  products: ProductWithWorkflow[],
  onEdit: (product: ProductWithWorkflow) => void,
  onDelete: (id: number) => void,
  onView: (product: ProductWithWorkflow) => void,
  onSubmit: (id: number) => void,
  onPublishManually: (id: number) => void,
  onUnpublish: (id: number) => void
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ModernVendorProductCard
          key={product.id}
          product={adaptProductForCard(product) as any}
          onEdit={(p) => onEdit(product)}
          onDelete={onDelete}
          onView={(p) => onView(product)}
          onPublish={onPublishManually}
        />
      ))}
    </div>
  );
};

// Composant pour le tableau de produits
const ProductTable = ({ 
  products, 
  onEdit, 
  onDelete, 
  onView,
  onSubmit,
  onPublishManually,
  onUnpublish
}: { 
  products: ProductWithWorkflow[], 
  onEdit: (product: ProductWithWorkflow) => void,
  onDelete: (id: number) => void,
  onView: (product: ProductWithWorkflow) => void,
  onSubmit: (id: number) => void,
  onPublishManually: (id: number) => void,
  onUnpublish: (id: number) => void 
}) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produit</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(product => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                {typeof product.category === 'object' 
                  ? product.category?.name 
                  : product.category}
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  maximumFractionDigits: 0
                }).format(product.price)}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <span>{product.stock}</span>
                  <Badge className={`ml-2 ${
                    product.stock <= 0
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : product.stock < 10
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {product.stock <= 0 ? 'Rupture' : product.stock < 10 ? 'Faible' : 'En stock'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                {(() => {
                  const ready = (
                    product.isValidated === true ||
                    (typeof product.designValidationStatus === 'string' && product.designValidationStatus === 'VALIDATED') ||
                    (typeof product.designValidationStatus === 'object' && (product.designValidationStatus as any)?.isValidated === true)
                  );

                  if (product.status?.toUpperCase() === 'PUBLISHED') {
                    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">✅ Publié</Badge>;
                  }

                  if (product.status?.toUpperCase() === 'DRAFT' && ready) {
                    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">📝 Prêt à publier</Badge>;
                  }

                  if (product.status?.toUpperCase() === 'DRAFT') {
                    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">📋 À valider</Badge>;
                  }

                  return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">⏳ En attente</Badge>;
                })()}
              </TableCell>
              <TableCell className="text-right flex justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onView(product)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(product.id || 0)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
                {(() => {
                  const ready = (
                    product.isValidated === true ||
                    (typeof product.designValidationStatus === 'string' && product.designValidationStatus === 'VALIDATED') ||
                    (typeof product.designValidationStatus === 'object' && (product.designValidationStatus as any)?.isValidated === true)
                  );

                  if (product.status?.toUpperCase() === 'DRAFT' && ready) {
                    return (
                      <Button variant="ghost" size="sm" onClick={() => onPublishManually(product.id || 0)}>
                        <Rocket className="h-4 w-4 mr-1" />
                        Publier
                      </Button>
                    );
                  }

                  if (product.status?.toUpperCase() !== 'PUBLISHED') {
                    return (
                  <Button variant="ghost" size="sm" onClick={() => onSubmit(product.id || 0)}>
                    <ArrowLeft className="h-4 w-4 mr-1 rotate-90" />
                    Soumettre
                  </Button>
                    );
                  }
                  return null;
                })()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const VendorProductList: React.FC<ProductListProps> = ({ showFilters = true }) => {
  const navigate = useNavigate();

  // 🔄 CORRECTION : Utiliser le bon hook pour les produits vendeur V2
  const { 
    products, 
    loading: isLoading, 
    error, 
    refresh: refreshProducts,
    deleteProduct
  } = useVendorProducts({ 
    autoFetch: true,
    limit: 50,
    status: 'all' 
  });

  const { softDeleteProduct } = useDeletedProducts();

  // États UI
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentColor, setCurrentColor] = useState('all');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [colors, setColors] = useState<{name: string, colorCode: string}[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isPublishing, setIsPublishing] = useState<number | null>(null);

  // Filtrer pour n'afficher que les produits du vendeur courant (à implémenter avec l'authentification)
  // Ici, nous simulons que tous les produits appartiennent au vendeur connecté
  // Dans une vraie implémentation, vous filtrerez par l'ID du vendeur connecté
  const vendorProducts = products;

  // Chargement initial des catégories à partir des produits
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      // Extract unique categories from baseProduct
      const uniqueCategories = Array.from(
        new Set(
          products
            .map(product => (product as any).baseProduct?.categories?.[0]?.name)
            .filter(Boolean)
        )
      ).map(categoryName => {
        const productWithCategory = products.find(p => (p as any).baseProduct?.categories?.[0]?.name === categoryName);
        const category = (productWithCategory as any)?.baseProduct?.categories?.[0];
        return category ? { id: category.id, name: category.name } : { id: 0, name: categoryName as string };
      });
      
      setCategories(uniqueCategories);

      // Extract unique colors across all products
      const uniqueColorsMap: Record<string, string> = {};
      products.forEach(p => {
        (p as any).colorVariations?.forEach((cv: any) => {
          if (cv.name && !uniqueColorsMap[cv.name]) {
            uniqueColorsMap[cv.name] = cv.colorCode;
          }
        });
      });
      setColors(Object.entries(uniqueColorsMap).map(([name, colorCode]) => ({ name, colorCode })));
    }
  }, [products, isLoading]);

  // 🆕 Rafraîchissement automatique si produits en attente (PENDING)
  useEffect(() => {
    const hasPending = vendorProducts.some(p => (p.status || '').toUpperCase() === 'PENDING');
    if (!hasPending) return; // Pas de pending → pas de polling

    const interval = setInterval(() => {
      console.log('⏰ Polling automatique - rafraîchissement des produits...');
      refreshProducts();
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, [vendorProducts]);

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    setIsRefreshing(true);
    
    try {
      await refreshProducts();
      setCurrentPage(1); // Réinitialiser à la première page lors de l'actualisation
      toast.success('Données actualisées', {
        description: 'Les produits ont été mis à jour avec succès.'
      });
    } catch (err) {
      console.error('Error refreshing products:', err);
      toast.error('Erreur d\'actualisation', {
        description: 'Impossible d\'actualiser les produits. Veuillez réessayer.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fonctions de gestion
  const handleOpenProductForm = () => {
    navigate('/vendeur/add-product');
  };

  const handleViewProduct = (product: Product) => {
    navigate(`/vendeur/products/${product.id}`);
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/vendeur/product-form`, { state: { product } });
  };

  const handleDeleteProduct = (id: number) => {
    // Ouvrir la boîte de dialogue de confirmation
    setDeletingProductId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProductId || !isDeleteConfirmationValid()) return;
    
    // Sauvegarde pour état en cas de besoin
    const productToDelete = products.find(p => p.id === deletingProductId);
    
    try {
      // 🔄 CORRECTION : Utiliser le hook deleteProduct
      await deleteProduct(deletingProductId);
      
      if (productToDelete) {
        // Afficher un message de succès
        toast.success('Produit supprimé', {
          description: `${productToDelete.name} a été déplacé dans la corbeille.`
        });
        
        // Fermer la boîte de dialogue et réinitialiser l'état
        setIsDeleteDialogOpen(false);
        setDeletingProductId(null);
        setDeleteConfirmationText('');
        
        // Rafraîchir la liste des produits après suppression
        await refreshProducts();
      }
    } catch (error: any) {
      // Afficher un message d'erreur
      toast.error('Erreur de suppression', {
        description: error.message || 'Impossible de supprimer le produit. Veuillez réessayer.'
      });
      
      console.error('Error deleting product:', error);
    }
  };

  const cancelDeleteProduct = () => {
    setIsDeleteDialogOpen(false);
    setDeletingProductId(null);
    setDeleteConfirmationText('');
  };

  // Vérifier si la confirmation de suppression est valide
  const isDeleteConfirmationValid = () => {
    const productToDelete = products.find(p => p.id === deletingProductId);
    return productToDelete && deleteConfirmationText === productToDelete.name;
  };

  // Fonction pour paginer les produits
  const paginateProducts = (items: Product[], pageNumber: number, perPage: number) => {
    const startIndex = (pageNumber - 1) * perPage;
    return items.slice(startIndex, startIndex + perPage);
  };
  
  // Appliquer les filtres sur les produits
  let filteredProducts = [...vendorProducts];
  
  // Filtre par recherche
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(product => {
      const productName = product.name.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      // Chercher dans le nom du produit
      if (productName.includes(searchLower)) {
        return true;
      }
      
      // Chercher dans la catégorie de manière sécurisée
      try {
        const categoryText = String(
          (product.category && typeof product.category === 'object' && 'name' in product.category)
            ? (product.category as any).name
            : product.category || ''
        );
        if (categoryText && categoryText.toLowerCase().includes(searchLower)) {
          return true;
        }
      } catch {
        // Ignore les erreurs et continue
      }
      
      return false;
    });
  }
  
  // Filtre par catégorie
  if (currentCategory !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      (typeof product.category === 'object'
        ? product.category?.name === currentCategory
        : product.category === currentCategory)
    );
  }
  
  // Filtre par couleur
  if (currentColor !== 'all') {
    filteredProducts = filteredProducts.filter(product =>
      (product as any).colorVariations?.some((cv: any) => cv.name === currentColor)
    );
  }
  
  // Appliquer la pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = paginateProducts(filteredProducts, currentPage, itemsPerPage);

  const handleSubmitForValidation = async (id: number) => {
    try {
      await productValidationService.submitForValidation(id);
      toast.success('Produit soumis pour validation !');
      await refreshProducts();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la soumission');
      console.error('❌ Erreur soumission validation:', err);
    }
  };

  // NOUVELLE FONCTION : Publication manuelle d'un produit DRAFT
  const handlePublishManually = async (productId: number) => {
    if (!productId || productId === 0) {
      toast.error('ID de produit invalide');
      return;
    }

    setIsPublishing(productId);
    try {
      const result: ManualPublishResult = await vendorProductServiceNew.publishDraftProduct(productId);
      
      toast.success('Produit publié avec succès !', {
        description: 'Votre produit est maintenant visible aux clients.',
        duration: 5000
      });
      
      console.log('✅ Publication manuelle réussie:', result);
      
      // Recharger la liste
      await refreshProducts();
      
    } catch (error: any) {
      console.error('❌ Erreur publication manuelle:', error);
      toast.error('Erreur lors de la publication', {
        description: error.message || 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setIsPublishing(null);
    }
  };

  // NOUVELLE FONCTION : Mettre un produit publié en brouillon
  const handleUnpublishProduct = async (productId: number) => {
    if (!productId || productId === 0) {
      toast.error('ID de produit invalide');
      return;
    }

    if (!confirm('Mettre ce produit en brouillon ?')) return;
    
    try {
      await vendorProductServiceNew.unpublishProduct(productId);
      
      toast.success('Produit déplacé en brouillon', {
        description: 'Le produit n\'est plus visible aux clients.'
      });
      
      await refreshProducts();
    } catch (error: any) {
      console.error('❌ Erreur mise en brouillon:', error);
      toast.error('Erreur lors du changement de statut', {
        description: error.message || 'Une erreur inattendue s\'est produite'
      });
    }
  };

  // 🆕 NOUVELLE LOGIQUE DE GROUPEMENT
  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      const groupName = (product as any).baseProduct?.name || 'Autres';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(product);
      return acc;
    }, {} as Record<string, ProductWithWorkflow[]>);
  }, [filteredProducts]);

  return (
    <div className="w-full max-w-[1400px] mx-auto pt-8 pb-12 space-y-8 px-4 sm:px-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Produits</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos produits en vente sur PrintAlma
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/vendeur/deleted-products')}
            variant="outline"
            className="border-gray-200 dark:border-gray-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Corbeille
          </Button>

          <Button 
            onClick={refreshData}
            variant="outline"
            className="border-gray-200 dark:border-gray-700"
            disabled={isRefreshing}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          <Button 
            onClick={handleOpenProductForm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 font-medium"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Créer un produit
          </Button>
        </div>
      </div>

      {/* Statistiques des produits */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <>
          {/* 🆕 Bannière informative nouveau workflow */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">ℹ</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  🚀 Nouveau Workflow Simplifié (Décembre 2024)
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>
                    <strong>✅ Créez directement :</strong> Vos produits sont créés immédiatement, plus besoin d'attendre.
                  </p>
                  <p>
                    <strong>⏳ Validation automatique :</strong> Dès que l'admin valide votre design, tous vos produits liés passent en "Publié" automatiquement.
                  </p>
                  <p>
                    <strong>🎯 Publication manuelle :</strong> Pour les designs déjà validés, vous pouvez publier vos produits quand vous voulez avec le bouton "Publier".
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{vendorProducts.length}</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Publiés</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {vendorProducts.filter(p => p.status?.toUpperCase?.() === 'PUBLISHED').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {vendorProducts.filter(p => p.status?.toUpperCase?.() === 'PENDING').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Rupture</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {vendorProducts.filter(p => p.stock <= 0).length}
              </h3>
            </div>
          </div>
        </>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <p>{typeof error === 'string' ? error : String(error)}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData} 
            className="mt-2 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <RefreshCcw className="mr-2 h-3 w-3" />
            Réessayer
          </Button>
        </div>
      )}

      {/* Container principal */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
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
                value={currentCategory}
                onValueChange={setCurrentCategory}
              >
                <SelectTrigger className="w-auto min-w-[150px] border-gray-200 dark:border-gray-700 dark:bg-gray-900 gap-1">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800">
                  <SelectItem value="all" className="dark:text-gray-100">Toutes catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name} className="dark:text-gray-100">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentColor}
                onValueChange={setCurrentColor}
              >
                <SelectTrigger className="w-auto min-w-[150px] border-gray-200 dark:border-gray-700 dark:bg-gray-900 gap-1">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Couleur" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800">
                  <SelectItem value="all" className="dark:text-gray-100">Toutes couleurs</SelectItem>
                  {colors.map(color => (
                    <SelectItem key={color.name} value={color.name} className="dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 rounded-full border border-gray-300" style={{backgroundColor: color.colorCode}} />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-900' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-900' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {(searchTerm || currentCategory !== 'all' || currentColor !== 'all') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentCategory('all');
                    setCurrentColor('all');
                  }}
                  className="border border-gray-200 dark:border-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Contenu des produits */}
          {isLoading ? (
            viewMode === 'grid' ? <ProductsGridSkeleton /> : <ProductsTableSkeleton />
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                {searchTerm || currentCategory !== 'all' || currentColor !== 'all' 
                  ? "Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                  : "Vous n'avez pas encore ajouté de produits. Commencez par créer votre premier produit."}
              </p>
              {searchTerm || currentCategory !== 'all' || currentColor !== 'all' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentCategory('all');
                    setCurrentColor('all');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button
                  onClick={handleOpenProductForm}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Créer mon premier produit
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedProducts).map(([groupName, groupProducts]) => {
                const products = Array.isArray(groupProducts) ? groupProducts : [];
                return (
                <div key={groupName}>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                    {groupName}
                  </h2>
                  {viewMode === 'grid' ? (
                    <ProductGrid 
                      products={products} 
                      onEdit={handleEditProduct} 
                      onDelete={handleDeleteProduct}
                      onView={handleViewProduct}
                      onSubmit={handleSubmitForValidation}
                      onPublishManually={handlePublishManually}
                      onUnpublish={handleUnpublishProduct}
                    />
                  ) : (
                    <ProductTable 
                      products={products} 
                      onEdit={handleEditProduct} 
                      onDelete={handleDeleteProduct}
                      onView={handleViewProduct}
                      onSubmit={handleSubmitForValidation}
                      onPublishManually={handlePublishManually}
                      onUnpublish={handleUnpublishProduct}
                    />
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              {(() => {
                const productToDelete = products.find(p => p.id === deletingProductId);
                return (
                  <div className="space-y-4">
                    <p>
                      Êtes-vous sûr de vouloir supprimer ce produit ? Il sera placé dans la corbeille
                      et pourra être restauré ultérieurement.
                    </p>
                    
                    <div>
                      <label htmlFor="delete-confirm" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Pour confirmer, saisissez le nom du produit: <span className="font-bold text-black dark:text-white">{productToDelete?.name}</span>
                      </label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        placeholder="Saisissez le nom du produit"
                        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isRefreshing}
              onClick={cancelDeleteProduct}
              className="border-gray-200 dark:border-gray-700 dark:text-gray-300"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRefreshing || !isDeleteConfirmationValid()}
              onClick={confirmDeleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VendorProductList; 