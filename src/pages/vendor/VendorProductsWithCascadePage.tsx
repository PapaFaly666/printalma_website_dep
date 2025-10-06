import React, { useState } from 'react';
import { useVendorProductsWithCascade } from '../../hooks/useVendorProductsWithCascade';
import { ProductStatusBadge } from '../../components/vendor/ProductStatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { SellDesignWithCascade } from '../../components/cascade/SellDesignWithCascade';
import { PostValidationAction } from '../../types/cascadeValidation';
import { Rocket, RefreshCw, Plus, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';

export const VendorProductsWithCascadePage: React.FC = () => {
  const {
    products,
    loading,
    error,
    cascadeProducts,
    legacyProducts,
    publishValidatedDraft,
    updatePostValidationAction,
    refreshAll,
    canPublishManually,
    canModifyProduct
  } = useVendorProductsWithCascade();

  const [activeTab, setActiveTab] = useState('products');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handlePublishProduct = async (productId: number) => {
    try {
      await publishValidatedDraft(productId);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleChangeAction = async (productId: number, action: PostValidationAction) => {
    try {
      await updatePostValidationAction(productId, action);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleCreateProduct = async (productId: number) => {
    toast.success(`Produit créé avec l'ID: ${productId}`);
    setShowCreateForm(false);
    setActiveTab('products');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Erreur de chargement
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={refreshAll} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mes Produits avec Cascade Validation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez vos produits avec le nouveau système de validation en cascade
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={refreshAll} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            
            <Button onClick={() => setShowCreateForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Badge variant="secondary">{cascadeProducts.length} cascade</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Publiés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {products.filter(p => p.status === 'PUBLISHED').length}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Actifs</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {products.filter(p => p.status === 'PENDING').length}
                  </p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Validation</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Brouillons</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {products.filter(p => p.status === 'DRAFT').length}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Brouillon</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Mes Produits</TabsTrigger>
            <TabsTrigger value="cascade">Cascade Products</TabsTrigger>
            <TabsTrigger value="legacy">Legacy Products</TabsTrigger>
          </TabsList>

          {/* Liste des produits combinés */}
          <TabsContent value="products" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Chargement...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">Aucun produit trouvé</p>
                <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre premier produit
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{product.vendorName}</h3>
                            <ProductStatusBadge product={product} />
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span>Prix: {product.vendorPrice}€</span>
                            <span>ID: {product.id}</span>
                            <span>Créé: {new Date(product.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Actions spécifiques au système cascade */}
                          {canPublishManually(product) && (
                            <div className="mb-3">
                              <Badge className="bg-blue-100 text-blue-800">
                                ✅ Prêt à publier manuellement
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Bouton de publication manuelle */}
                          {canPublishManually(product) && (
                            <Button
                              onClick={() => handlePublishProduct(product.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Rocket className="h-4 w-4 mr-2" />
                              Publier maintenant
                            </Button>
                          )}

                          {/* Bouton de modification d'action */}
                          {canModifyProduct(product) && (
                            <Button
                              onClick={() => {
                                const newAction = product.postValidationAction === PostValidationAction.AUTO_PUBLISH 
                                  ? PostValidationAction.TO_DRAFT 
                                  : PostValidationAction.AUTO_PUBLISH;
                                handleChangeAction(product.id, newAction);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Changer action
                            </Button>
                          )}

                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Produits cascade uniquement */}
          <TabsContent value="cascade" className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Produits créés avec le système de cascade validation: {cascadeProducts.length}
            </div>
            
            {cascadeProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Aucun produit cascade trouvé
                </p>
                <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un produit cascade
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {cascadeProducts.map((product) => (
                  <Card key={product.id} className="border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{product.vendorName}</h3>
                            <ProductStatusBadge product={product} />
                            <Badge className="bg-blue-100 text-blue-800">Cascade</Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>Action: {product.postValidationAction}</p>
                            <p>Validé: {product.isValidated ? 'Oui' : 'Non'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canPublishManually(product) && (
                            <Button
                              onClick={() => handlePublishProduct(product.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Rocket className="h-4 w-4 mr-2" />
                              Publier
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Produits legacy */}
          <TabsContent value="legacy" className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Produits créés avec l'ancien système: {legacyProducts.length}
            </div>
            
            <div className="grid gap-4">
              {legacyProducts.map((product) => (
                <Card key={product.id} className="border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          <Badge className="bg-gray-100 text-gray-800">Legacy</Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Statut: {product.status}</p>
                          <p>Prix: {product.price}€</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Créer un nouveau produit</h2>
                
                <SellDesignWithCascade
                  designUrl="https://example.com/design.jpg"
                  productStructure={{ example: true }}
                  onProductCreated={handleCreateProduct}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
 