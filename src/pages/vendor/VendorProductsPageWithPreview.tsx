import React, { useState, useEffect } from 'react';
import { useVendorProducts } from '../../hooks/useVendorProducts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  RefreshCw, 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle, 
  Eye, 
  Edit3,
  Trash2,
  Plus,
  Settings,
  X
} from 'lucide-react';

// Import des composants d'aperçu
import { LegacyVendorProductPreview } from '../../components/vendor/VendorProductDesignPreview';

// 🆕 Imports pour cascade validation
import { ProductStatusBadgeIntegrated } from '../../components/cascade/ProductStatusBadgeIntegrated';
import { PublishButtonIntegrated } from '../../components/cascade/PublishButtonIntegrated';
import { useCascadeValidationIntegrated } from '../../hooks/useCascadeValidationIntegrated';
import designService, { Design } from '../../services/designService';

export const VendorProductsPageWithPreview: React.FC = () => {
  const navigate = useNavigate();
  const { products, loading, error, refetch, deleteProduct, stats } = useVendorProducts();
  
  // 🆕 État pour l'aperçu
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 1200, height: 1200 });
  const [showPreviewInfo, setShowPreviewInfo] = useState(true);
  
  // 🆕 Hook cascade validation
  const {
    publishValidatedProduct,
    canPublishManually,
    refreshProducts,
    stats: cascadeStats
  } = useCascadeValidationIntegrated();

  // 🆕 État pour les notifications de cascade
  const [lastValidationCheck, setLastValidationCheck] = useState<Date | null>(null);

  // 🆕 Liste complète des designs du vendeur pour résolution d'IDs
  const [vendorDesigns, setVendorDesigns] = useState<Design[]>([]);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const resp = await designService.getDesigns({ limit: 200 });
        setVendorDesigns(resp.designs || []);
      } catch (e) {
        console.warn('⚠️ Impossible de charger les designs du vendeur:', e);
      }
    };
    fetchDesigns();
  }, []);

  // 🆕 Vérifier les nouvelles validations/rejets
  const checkForValidationUpdates = async () => {
    try {
      await refetch();
      if (!lastValidationCheck) {
        setLastValidationCheck(new Date());
        return;
      }

      // Chercher les produits récemment validés ou rejetés
      const recentlyUpdated = products.filter(product => {
        if (!product.validatedAt) return false;
        const validatedDate = new Date(product.validatedAt);
        return validatedDate > lastValidationCheck;
      });

      // Afficher les notifications
      recentlyUpdated.forEach(product => {
        if (product.isValidated) {
          toast.success('Design validé !', {
            description: `Votre produit "${product.name}" a été validé. ${product.status === 'PUBLISHED' ? 'Il est maintenant publié.' : 'Vous pouvez le publier quand vous voulez.'}`,
            duration: 8000
          });
        } else if (product.rejectionReason) {
          toast.error('Design rejeté', {
            description: `Votre produit "${product.name}" a été rejeté. Motif: ${product.rejectionReason}`,
            duration: 10000
          });
        }
      });

      setLastValidationCheck(new Date());
    } catch (error) {
      console.error('Erreur vérification validations:', error);
    }
  };

  // 🆕 Actualisation avec cascade
  const handleRefreshWithCascade = async () => {
    try {
      await Promise.all([
        refetch(),
        refreshProducts()
      ]);
      await checkForValidationUpdates();
      toast.success('Produits actualisés !');
    } catch (error) {
      console.error('Erreur actualisation:', error);
    }
  };

  // 🆕 Ouvrir l'aperçu d'un produit
  const handlePreviewProduct = (product: any) => {
    console.log('🔍 Aperçu du produit:', product);
    setSelectedProduct(product);
    setIsPreviewOpen(true);
  };

  // 🆕 Fermer l'aperçu
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedProduct(null);
  };

  const handleEditProduct = (product: any) => {
    console.log('Modifier le produit vendeur:', product);
    toast.info('Redirection vers l\'édition du produit...');
    navigate(`/vendeur/products/${product.id}/edit`);
  };

  const handleViewProduct = (product: any) => {
    console.log('🔍 Product structure:', {
      id: product.id,
      baseProductId: product.baseProductId,
      vendorProductId: product.vendorProductId,
      status: product.status,
      vendorProduct: product.vendorProduct,
      designUrl: product.designUrl,
      view: product.view,
      postValidationAction: product.postValidationAction,
      isValidated: product.isValidated,
      workflow: product.workflow,
      pendingAutoPublish: product.pendingAutoPublish,
      readyToPublish: product.readyToPublish
    });

    navigate(`/vendeur/products/${product.id}`);
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct(id);
      toast.success('Produit supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  const handleAddProduct = () => {
    navigate('/sell-design');
    toast.info('Redirection vers la création de produit...');
  };

  // 🆕 Polling automatique pour détecter les validations admin
  useEffect(() => {
    const interval = setInterval(() => {
      checkForValidationUpdates();
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, [lastValidationCheck, products]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Erreur de chargement
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes Produits
          </h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefreshWithCascade}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
            <Button
              onClick={handleAddProduct}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau produit
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalProducts}
                  </p>
                </div>
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Publiés
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.activeProducts}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Brouillons
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    {stats.totalProducts - stats.activeProducts - stats.inactiveProducts - stats.pendingProducts}
                  </p>
                </div>
                <Package className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Validés
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {cascadeStats.validatedDrafts || 0}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    En attente
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {cascadeStats.pending}
                  </p>
                </div>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        )}

        {/* Liste des produits */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Chargement des produits...
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Aperçu du produit */}
                  <div className="relative group">
                    <div className="aspect-square bg-gray-100">
                      {product.designUrl && product.view ? (
                        <LegacyVendorProductPreview
                          product={product}
                          transforms={{
                            positionX: 0.5,
                            positionY: 0.3,
                            scale: 1.0,
                            rotation: 0
                          }}
                          showInfo={false}
                          width={300}
                          height={300}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    
                    {/* Overlay avec actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePreviewProduct(product)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
                
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.price}€
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ProductStatusBadgeIntegrated product={product} />
                      {canPublishManually(product) && (
                        <PublishButtonIntegrated
                          product={product}
                          onPublish={() => publishValidatedProduct(product.id)}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Modal d'aperçu */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Aperçu du produit
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPreviewInfo(!showPreviewInfo)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClosePreview}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Aperçu */}
                <div className="flex flex-col items-center">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <LegacyVendorProductPreview
                      product={selectedProduct}
                      transforms={{
                        positionX: 0.5,
                        positionY: 0.3,
                        scale: 1.2,
                        rotation: 0
                      }}
                      showInfo={showPreviewInfo}
                      width={previewSize.width}
                      height={previewSize.height}
                    />
                  </div>
                  
                  {/* Contrôles de taille */}
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-1">
                      Taille:
                      <select
                        value={previewSize.width}
                        onChange={(e) => {
                          const size = parseInt(e.target.value);
                          setPreviewSize({ width: size, height: size });
                        }}
                        className="border rounded px-2 py-1"
                      >
                        <option value={300}>300px</option>
                        <option value={400}>400px</option>
                        <option value={1200}>1200px</option>
                        <option value={600}>600px</option>
                      </select>
                    </label>
                  </div>
                </div>
                
                {/* Informations */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{selectedProduct.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {selectedProduct.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Prix:</span>
                      <span className="text-green-600">{selectedProduct.price}€</span>
                      <ProductStatusBadgeIntegrated product={selectedProduct} />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Détails techniques</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">ID:</span> {selectedProduct.id}</p>
                      <p><span className="font-medium">Statut:</span> {selectedProduct.status}</p>
                      <p><span className="font-medium">Validé:</span> {selectedProduct.isValidated ? 'Oui' : 'Non'}</p>
                      <p><span className="font-medium">Design:</span> {selectedProduct.designUrl ? 'Oui' : 'Non'}</p>
                      <p><span className="font-medium">Créé:</span> {new Date(selectedProduct.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProduct(selectedProduct)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewProduct(selectedProduct)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir détails
                      </Button>
                      {canPublishManually(selectedProduct) && (
                        <PublishButtonIntegrated
                          product={selectedProduct}
                          onPublish={() => publishValidatedProduct(selectedProduct.id)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VendorProductsPageWithPreview; 