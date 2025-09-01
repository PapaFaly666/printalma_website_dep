import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  RefreshCw, 
  Package, 
  Clock, 
  CheckCircle, 
  Eye, 
  Edit3,
  Trash2,
  Plus,
  Settings,
  Search,
  Grid,
  List,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '../../components/ui/dialog';
import { SimpleProductPreview } from '../../components/vendor/SimpleProductPreview';

// Services et hooks
import { vendorProductService } from '../../services/vendorProductService';

// 🆕 Interface basée sur la structure de /public/best-sellers et compatible avec SimpleProductPreview
interface VendorProductFromAPI {
  id: number;
  vendorName: string; // ✅ Nom du produit vendeur
  price: number;
  status: string;
  
  bestSeller: {
    isBestSeller: boolean;
    salesCount: number;
    totalRevenue: number;
  };
  
  adminProduct: {
    id: number;
    name: string;
    genre: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
    categories: Array<{
      id: number;
      name: string;
    }>;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        url: string;
        viewType: string; // ✅ Compatible avec SimpleProductPreview
        delimitations: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          coordinateType: 'PERCENTAGE' | 'PIXEL';
        }>;
      }>;
    }>;
  };
  
  designApplication: {
    hasDesign: boolean;
    designUrl: string;
    positioning: string; // JSON string avec {x, y, scale, rotation}
    scale: number;
    mode: string;
  };
  
  designPositions: Array<{
    designId: number;
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      constraints: {
        minScale: number;
        maxScale: number;
      };
      designWidth: number;  // ✅ VRAIES DIMENSIONS
      designHeight: number; // ✅ VRAIES DIMENSIONS
    };
  }>;
  
  // ✅ AJOUTÉ : Propriété requise par SimpleProductPreview
  designTransforms: Array<{
    id: number;
    designUrl: string;
    transforms: {
      [key: string]: {
        x: number;
        y: number;
        scale: number;
        rotation?: number;
        designWidth?: number;
        designHeight?: number;
        designScale?: number;
        constraints?: any;
      };
    };
  }>;
  
  vendor: {
    id: number;
    fullName: string;
    shop_name: string;
    profile_photo_url: string;
  };
  
  images: {
    adminReferences: Array<{
      colorName: string;
      colorCode: string;
      adminImageUrl: string;
      imageType: string;
    }>;
    total: number;
    primaryImageUrl: string;
  };
  
  selectedSizes: Array<{
    id: number;
    sizeName: string;
  }>;
  
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  
  designId: number;
  isDelete?: boolean; // Optionnel pour compatibilité
}

export const VendorProductsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // États principaux
  const [products, setProducts] = useState<VendorProductFromAPI[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<VendorProductFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les filtres et la vue
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  
  // 🆕 Charger les produits selon la documentation
  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('📡 Chargement des produits vendeur avec mockups et designs...');
      
      // ✅ CORRECTION : Utiliser l'endpoint spécifique aux produits vendeur
      const response = await fetch('https://printalma-back-dep.onrender.com/vendor/products', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // Ajouter l'authentification JWT si disponible
          ...(localStorage.getItem('jwt_token') && {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          })
        }
      });

      console.log('🔍 Réponse HTTP:', response.status, response.statusText);

      if (!response.ok) {
        console.warn(`⚠️ Erreur ${response.status} pour /vendor/products, essai avec /public/best-sellers...`);
        
        // Fallback vers l'endpoint public si l'authentification échoue
        const fallbackResponse = await fetch('https://printalma-back-dep.onrender.com/public/best-sellers?limit=20', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
        }

        const fallbackResult = await fallbackResponse.json();
        console.log('📋 Réponse API fallback:', fallbackResult);
        
        let apiProducts = [];
        
        if (fallbackResult.success && fallbackResult.data && fallbackResult.data.bestSellers) {
          apiProducts = fallbackResult.data.bestSellers;
        } else if (fallbackResult.data && Array.isArray(fallbackResult.data)) {
          apiProducts = fallbackResult.data;
        } else if (Array.isArray(fallbackResult)) {
          apiProducts = fallbackResult;
        } else {
          console.warn('⚠️ Structure de réponse inattendue:', fallbackResult);
          apiProducts = [];
        }
        
        console.log('✅ Produits chargés (fallback):', apiProducts.length);
        
        setProducts(apiProducts);
        setFilteredProducts(apiProducts);
        return;
      }

      const result = await response.json();
      console.log('📋 Réponse API produits vendeur:', result);
      
      // ✅ CORRECTION : Adapter le parsing selon la structure de /vendor/products
      let apiProducts = [];
      
      if (result.success && result.data && Array.isArray(result.data)) {
        // Format de /vendor/products avec data.products
        apiProducts = result.data;
      } else if (result.data && result.data.products && Array.isArray(result.data.products)) {
        // Format avec data.products
        apiProducts = result.data.products;
      } else if (Array.isArray(result)) {
        // Format tableau direct
        apiProducts = result;
      } else if (result.products && Array.isArray(result.products)) {
        // Format avec products à la racine
        apiProducts = result.products;
      } else {
        console.warn('⚠️ Structure de réponse inattendue pour /vendor/products:', result);
        apiProducts = [];
      }
      
      console.log('✅ Produits vendeur chargés avec mockups:', apiProducts.length);
      
      // ✅ TRANSFORMATION : Adapter les données pour l'affichage avec mockups
      const transformedProducts = apiProducts.map((product: any, index: number) => {
        console.log(`🔍 Produit ${index + 1}:`, {
          id: product.id,
          vendorName: product.vendorName || product.name,
          hasDesign: product.designApplication?.hasDesign,
          designUrl: product.designApplication?.designUrl,
          colorVariations: product.adminProduct?.colorVariations?.length || 0,
          designPositions: product.designPositions?.length || 0
        });
        
        return {
          id: product.id,
          vendorName: product.vendorName || product.name || 'Produit Vendeur',
          price: product.vendorPrice || product.price || 0,
          status: product.status || 'DRAFT',
          
          bestSeller: {
            isBestSeller: product.bestSeller?.isBestSeller || false,
            salesCount: product.bestSeller?.salesCount || 0,
            totalRevenue: product.bestSeller?.totalRevenue || 0,
          },
          
          adminProduct: {
            id: product.adminProduct?.id || product.baseProductId || product.id,
            name: product.adminProduct?.name || product.name || 'Produit Admin',
            genre: product.adminProduct?.genre || 'UNISEXE',
            categories: product.adminProduct?.categories || [],
            colorVariations: product.adminProduct?.colorVariations || product.colorVariations || []
          },
          
          designApplication: {
            hasDesign: product.designApplication?.hasDesign || !!product.designApplication?.designUrl,
            designUrl: product.designApplication?.designUrl || product.designUrl || '',
            positioning: product.designApplication?.positioning || 'CENTER',
            scale: product.designApplication?.scale || 0.6,
            mode: product.designApplication?.mode || 'PRESERVED'
          },
          
          designPositions: product.designPositions || [{
            designId: product.designId || 0,
            position: {
              x: 0.5,
              y: 0.5,
              scale: 0.6,
              rotation: 0,
              constraints: {
                minScale: 0.1,
                maxScale: 2.0
              },
              designWidth: 200,
              designHeight: 200
            }
          }],
          
          designTransforms: product.designTransforms || [{
            id: product.designId || 0,
            designUrl: product.designApplication?.designUrl || product.designUrl || '',
            transforms: {
              'default': {
                x: 0.5,
                y: 0.5,
                scale: 0.6,
                rotation: 0,
                designWidth: 200,
                designHeight: 200
              }
            }
          }],
          
          vendor: {
            id: product.vendor?.id || 0,
            fullName: product.vendor?.fullName || 'Vendeur',
            shop_name: product.vendor?.shop_name || '',
            profile_photo_url: product.vendor?.profile_photo_url || ''
          },
          
          images: {
            adminReferences: product.images?.adminReferences || [],
            total: product.images?.total || 0,
            primaryImageUrl: product.images?.primaryImageUrl || product.adminProduct?.colorVariations?.[0]?.images?.[0]?.url || ''
          },
          
          selectedSizes: product.selectedSizes || [],
          selectedColors: product.selectedColors || [],
          designId: product.designId || 0,
          isDelete: product.isDelete || false
        };
      });
      
      console.log('✅ Produits transformés avec mockups:', transformedProducts.length);
      
      // 🔍 DEBUG : Vérifier les données transformées
      transformedProducts.forEach((product: VendorProductFromAPI, index: number) => {
        console.log(`🎨 Produit transformé ${index + 1}:`, {
          id: product.id,
          vendorName: product.vendorName,
          hasDesign: product.designApplication.hasDesign,
          designUrl: product.designApplication.designUrl,
          colorVariations: product.adminProduct.colorVariations.length,
          designPositions: product.designPositions.length,
          designTransforms: product.designTransforms.length
        });
      });
      
      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
      
    } catch (err) {
      setError('Erreur lors du chargement des produits');
      console.error('❌ Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les produits au montage
  useEffect(() => {
    loadProducts();
  }, []);

  // Filtrer les produits
  useEffect(() => {
    let filtered = [...products];
    
    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.adminProduct.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, statusFilter]);

  // Filtrage des produits non supprimés
  const visibleProducts = products.filter(p => !p.isDelete);

  // Calculer les statistiques
  const nonDeletedProducts = products.filter(p => !p.isDelete);

  const stats = {
    total: nonDeletedProducts.length,
    published: nonDeletedProducts.filter(p => p.status === 'PUBLISHED').length,
    pending: nonDeletedProducts.filter(p => p.status === 'PENDING').length,
    draft: nonDeletedProducts.filter(p => p.status === 'DRAFT').length,
    rejected: nonDeletedProducts.filter(p => p.status === 'REJECTED').length
  };

  // 🆕 Gérer l'aperçu avec le nouveau composant
  const handlePreview = (productId: number) => {
    setSelectedProductId(productId);
    setIsPreviewOpen(true);
  };

  const handleEdit = (product: VendorProductFromAPI) => {
    navigate(`/vendeur/products/${product.id}/edit`);
  };

  const handleDeleteClick = (productId: number) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await vendorProductService.deleteVendorProduct(productToDelete);
      setProducts(products => products.filter(p => p.id !== productToDelete));
      toast.success('Produit supprimé !');
    } catch (err: any) {
      toast.error('Erreur : ' + (err.message || 'Suppression impossible'));
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handlePublish = async (productId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir publier ce produit ?')) {
      return;
    }

    try {
      // Appel API pour publier le produit
      const response = await fetch(`https://printalma-back-dep.onrender.com/vendor/products/${productId}/publish`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Produit publié avec succès');
        loadProducts(); // Recharger la liste
      } else {
        throw new Error(result.message || 'Erreur lors de la publication');
      }
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      toast.error('Erreur lors de la publication du produit');
    }
  };


  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PUBLISHED': 
        return 'bg-gray-900 text-white border-gray-900';
      case 'PENDING': 
        return 'bg-gray-100 text-gray-900 border-gray-300';
      case 'DRAFT': 
        return 'bg-white text-gray-900 border-gray-900';
      case 'REJECTED': 
        return 'bg-gray-600 text-white border-gray-600';
      default: 
        return 'bg-white text-gray-900 border-gray-900';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'Publié';
      case 'PENDING': return 'En attente';
      case 'DRAFT': return 'Brouillon';
      case 'REJECTED': return 'Rejeté';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Chargement des produits...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadProducts} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Produits</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos produits personnalisés avec designs appliqués
            </p>
          </div>
          <Button onClick={() => navigate('/vendeur/sell-design')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Publiés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Brouillons</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                </div>
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejetés</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <X className="w-5 h-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et contrôles */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 items-center flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="PUBLISHED">Publié</option>
                  <option value="PENDING">En attente</option>
                  <option value="DRAFT">Brouillon</option>
                  <option value="REJECTED">Rejeté</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadProducts}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des produits */}
        {visibleProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun produit ne correspond à vos critères de recherche'
                  : 'Vous n\'avez pas encore créé de produit personnalisé'
                }
              </p>
              <Button onClick={() => navigate('/vendeur/sell-design')}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un produit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {visibleProducts.map((product) => {
              console.log('🎨 Rendu produit:', product.id, product.vendorName, product.designApplication);
              return (
                <Card key={product.id} className="group border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-0">
                  {/* Aperçu du produit avec design */}
                    <div className="relative">
                    <div className={viewMode === 'grid' ? 'aspect-square' : 'h-48'}>
                        <SimpleProductPreview
                          product={product}
                          showColorSlider={true}
                          onColorChange={(colorId) => {
                            console.log(`🎨 Couleur changée pour produit ${product.id}: ${colorId}`);
                          }}
                        />
                      </div>
                      
                      {/* Badge de statut en haut à droite */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge 
                          variant="outline"
                          className={`font-medium text-xs ${getStatusBadgeStyle(product.status)}`}
                        >
                          {getStatusText(product.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Informations du produit */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                          {product.vendorName}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3 font-medium">
                          Basé sur: {product.adminProduct.name}
                        </p>
                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                          Produit personnalisé basé sur {product.adminProduct.name}
                        </p>
                      </div>
                      
                      {/* Prix et indicateurs */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xl font-bold text-gray-900">
                          {product.price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA
                        </div>
                        <div className="flex items-center gap-2">
                          {product.designApplication.hasDesign && (
                            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                              Design
                            </Badge>
                          )}
                          {product.designPositions && product.designPositions.length > 0 && (
                            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                              Positionné
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Boutons d'action */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        {/* Bouton Publier pour les produits avec design */}
                        {product.designApplication.hasDesign && (
                          <Button
                            size="sm"
                            onClick={() => handlePublish(product.id)}
                            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Publier
                          </Button>
                        )}
                        
                        {/* Boutons standards */}
                      <Button
                        size="sm"
                          variant="outline"
                          onClick={() => handlePreview(product.id)}
                          className={`${product.designApplication.hasDesign ? 'flex-1' : 'flex-1'} border-gray-300 text-gray-700 hover:bg-gray-50 font-medium`}
                      >
                          <Eye className="w-4 h-4 mr-2" />
                          Aperçu
                      </Button>
                      <Button
                        size="sm"
                          variant="outline"
                        onClick={() => handleEdit(product)}
                          className={`${product.designApplication.hasDesign ? 'flex-1' : 'flex-1'} border-gray-300 text-gray-700 hover:bg-gray-50 font-medium`}
                      >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Modifier
                      </Button>
                      <Button
                        size="sm"
                          variant="outline"
                        onClick={() => handleDeleteClick(product.id)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {/* Modal d'aperçu */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Aperçu du produit</DialogTitle>
            </DialogHeader>
            
            {selectedProductId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Aperçu visuel */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <SimpleProductPreview
                    product={products.find(p => p.id === selectedProductId)!}
                    showColorSlider={true}
                    onColorChange={(colorId) => {
                      console.log(`🎨 Couleur changée dans modal pour produit ${selectedProductId}: ${colorId}`);
                    }}
                  />
                </div>
                
                {/* Détails du produit */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900 mb-3">
                      {products.find(p => p.id === selectedProductId)?.vendorName}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Produit personnalisé basé sur {products.find(p => p.id === selectedProductId)?.adminProduct.name}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-900">Prix:</span>
                          <div className="text-xl font-bold text-gray-900 mt-1">
                            {((products.find(p => p.id === selectedProductId)?.price || 0).toLocaleString('fr-FR', { 
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }))} FCFA
                          </div>
                        </div>
                      <div>
                          <span className="font-medium text-gray-900">Statut:</span>
                          <div className="mt-1">
                            <Badge 
                              variant="outline"
                              className={`font-medium ${getStatusBadgeStyle(products.find(p => p.id === selectedProductId)?.status || 'DRAFT')}`}
                            >
                              {getStatusText(products.find(p => p.id === selectedProductId)?.status || 'DRAFT')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-900">Ventes:</span>
                          <div className="text-gray-600 mt-1">
                            {products.find(p => p.id === selectedProductId)?.bestSeller.salesCount || 0}
                          </div>
                      </div>
                      <div>
                          <span className="font-medium text-gray-900">Revenus:</span>
                          <div className="text-gray-600 mt-1">
                            {(products.find(p => p.id === selectedProductId)?.bestSeller.totalRevenue || 0).toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Produit de base</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>Nom:</strong> {products.find(p => p.id === selectedProductId)?.adminProduct.name}</p>
                      <p><strong>Genre:</strong> {products.find(p => p.id === selectedProductId)?.adminProduct.genre}</p>
                      <p><strong>Couleurs disponibles:</strong> {products.find(p => p.id === selectedProductId)?.selectedColors.length}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Design appliqué</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>Design présent:</strong> {products.find(p => p.id === selectedProductId)?.designApplication.hasDesign ? 'Oui' : 'Non'}</p>
                      <p><strong>Échelle:</strong> {products.find(p => p.id === selectedProductId)?.designApplication.scale.toFixed(2)}x</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    {/* Bouton Publier pour les produits avec design */}
                    {products.find(p => p.id === selectedProductId)?.designApplication.hasDesign && (
                      <Button
                        onClick={() => {
                          handlePublish(selectedProductId);
                          setIsPreviewOpen(false);
                        }}
                        className="bg-gray-900 hover:bg-gray-800 text-white font-medium"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Publier
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        const product = products.find(p => p.id === selectedProductId);
                        if (product) handleEdit(product);
                      }}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleDeleteClick(selectedProductId);
                        setIsPreviewOpen(false);
                      }}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 hover:border-red-300 font-medium"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de confirmation de suppression */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <p>Voulez-vous vraiment supprimer ce produit ? Cette action est réversible.</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VendorProductsPage; 