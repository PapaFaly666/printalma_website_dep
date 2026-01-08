// Page de démonstration du système de validation en cascade

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Plus, Filter, BarChart3 } from 'lucide-react';

import { PostValidationAction, VendorProduct } from '@/types/cascadeValidation';
import useCascadeValidation, { useCascadeNotifications } from '@/hooks/useCascadeValidation';
import ProductStatusBadge from '@/components/cascade/ProductStatusBadge';
import ValidationActionSelector from '@/components/cascade/ValidationActionSelector';
import ProductActions from '@/components/cascade/ProductActions';
import CascadeValidationService from '@/services/cascadeValidationService';
import { vendorProductService } from '@/services/vendorProductService';

export function CascadeValidationDemo() {
  const [newProductAction, setNewProductAction] = useState<PostValidationAction>(PostValidationAction.AUTO_PUBLISH);
  const [newProductName, setNewProductName] = useState('');
  
  const {
    loading,
    products,
    error,
    // setAction,
    // publishProduct,
    refreshProducts,
    filters,
    setFilters,
    stats
  } = useCascadeValidation();

  const setAction = (action: any) => console.log('setAction:', action);
  const publishProduct = (id: number) => console.log('publishProduct:', id);

  // Notifications en temps réel
  useCascadeNotifications((productIds) => {
    console.log('🔔 Produits mis à jour via cascade:', productIds);
    refreshProducts();
  });

  // Créer un produit de démonstration
  const createDemoProduct = async () => {
    if (!newProductName.trim()) return;
    
    try {
      await vendorProductService.createVendorProduct({
        baseProductId: 1,
        selectedColors: [],
        selectedSizes: [],
        finalImagesBase64: {},
        vendorName: newProductName,
        vendorPrice: Math.floor(Math.random() * 5000) + 1000, // Prix aléatoire
        // designCloudinaryUrl: `https://res.cloudinary.com/demo/design-${Date.now()}.jpg`,
        postValidationAction: newProductAction,
        forcedStatus: 'PENDING',
        productStructure: {
          adminProduct: {
            id: 1,
            name: 'T-shirt',
            description: 'Basic T-shirt',
            price: 2500,
            images: { colorVariations: [] },
            sizes: []
          },
          designApplication: {
            designBase64: '',
            positioning: 'CENTER' as const,
            scale: 1
          }
        }
      });
      
      setNewProductName('');
      refreshProducts();
    } catch (error) {
      console.error('Erreur création produit demo:', error);
    }
  };

  // Simuler la validation admin
  const simulateAdminValidation = (designUrl: string, action: 'VALIDATE' | 'REJECT') => {
    // Simuler la cascade en mettant à jour localStorage
    const notification = {
      type: action === 'VALIDATE' ? 'PRODUCTS_AUTO_PUBLISHED' : 'DESIGN_REJECTED',
      productIds: products.filter(p => p.designCloudinaryUrl === designUrl).map(p => p.id),
      message: action === 'VALIDATE' ? 'Design validé, cascade appliquée' : 'Design rejeté',
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cascade-notification', JSON.stringify(notification));
    
    // Déclencher l'événement pour les autres onglets
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cascade-notification',
      newValue: JSON.stringify(notification)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🌊 Système de Validation en Cascade
            </h1>
            <p className="text-gray-600 mt-2">
              Démonstration complète du workflow design → produits avec validation automatique
            </p>
          </div>
          
          <Button onClick={refreshProducts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Publiés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Brouillons validés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{(stats as any).validatedDrafts || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Mes Produits</TabsTrigger>
            <TabsTrigger value="create">Créer Produit</TabsTrigger>
            <TabsTrigger value="admin">Simulation Admin</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          {/* Onglet Produits */}
          <TabsContent value="products" className="space-y-4">
            
            {/* Filtres */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Statut</Label>
                    <Select 
                      value={filters.status || 'all'} 
                      onValueChange={(value) => setFilters({ 
                        ...filters, 
                        status: value === 'all' ? undefined : value as any 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="DRAFT">Brouillon</SelectItem>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="PUBLISHED">Publié</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Action post-validation</Label>
                    <Select 
                      value={filters.postValidationAction || 'all'} 
                      onValueChange={(value) => setFilters({ 
                        ...filters, 
                        postValidationAction: value === 'all' ? undefined : value as any 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value={PostValidationAction.AUTO_PUBLISH}>🚀 Auto-publication</SelectItem>
                        <SelectItem value={PostValidationAction.TO_DRAFT}>📝 Brouillon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Validation</Label>
                    <Select 
                      value={filters.isValidated === undefined ? 'all' : filters.isValidated.toString()} 
                      onValueChange={(value) => setFilters({ 
                        ...filters, 
                        isValidated: value === 'all' ? undefined : value === 'true' 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="true">Validés</SelectItem>
                        <SelectItem value="false">Non validés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liste des produits */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-600">❌ {error}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{product.name}</h3>
                          <ProductStatusBadge product={product} />
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Prix: {((product as any).vendorPrice || 0 / 100).toFixed(2)}€</p>
                          <p>Action: {product.postValidationAction === PostValidationAction.AUTO_PUBLISH ? '🚀 Auto-publication' : '📝 Brouillon'}</p>
                          {product.designCloudinaryUrl && (
                            <p className="text-xs">Design: {product.designCloudinaryUrl.split('/').pop()}</p>
                          )}
                        </div>
                      </div>
                      
                      <ProductActions
                        product={product}
                        onActionChange={setAction}
                        onPublish={publishProduct}
                        loading={loading}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {products.length === 0 && !loading && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500">Aucun produit trouvé</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Onglet Création */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Créer un nouveau produit
                </CardTitle>
                <CardDescription>
                  Créez un produit avec design et choisissez l'action post-validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="productName">Nom du produit</Label>
                  <Input
                    id="productName"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ex: T-Shirt Dragon Fantastique"
                  />
                </div>
                
                <ValidationActionSelector
                  selectedAction={newProductAction}
                  onActionChange={setNewProductAction}
                />
                
                <Button 
                  onClick={createDemoProduct}
                  disabled={!newProductName.trim() || loading}
                  className="w-full"
                >
                  Créer le produit (demo)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Admin */}
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Simulation Admin - Validation des designs
                </CardTitle>
                <CardDescription>
                  Simulez la validation/rejet d'un design pour déclencher la cascade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Grouper les produits par design */}
                {Array.from(new Set(products.map(p => p.designCloudinaryUrl))).map((designUrl) => {
                  const productsForDesign = products.filter(p => p.designCloudinaryUrl === designUrl);
                  const pendingCount = productsForDesign.filter(p => p.status === 'PENDING').length;
                  
                  if (pendingCount === 0) return null;
                  
                  return (
                    <Card key={designUrl} className="border-yellow-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Design: {designUrl?.split('/').pop()}</h4>
                            <p className="text-sm text-gray-600">
                              {pendingCount} produit(s) en attente de validation
                            </p>
                            <div className="flex gap-2 mt-2">
                              {productsForDesign.map(p => (
                                <Badge key={p.id} variant="outline">
                                  {p.name} ({p.postValidationAction === PostValidationAction.AUTO_PUBLISH ? '🚀' : '📝'})
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => simulateAdminValidation(designUrl!, 'VALIDATE')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              ✅ Valider Design
                            </Button>
                            <Button 
                              onClick={() => simulateAdminValidation(designUrl!, 'REJECT')}
                              variant="destructive"
                            >
                              ❌ Rejeter Design
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {products.filter(p => p.status === 'PENDING').length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-500">Aucun design en attente de validation</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Documentation */}
          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📚 Documentation du système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">🌊 Workflow de validation en cascade</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Vendeur crée un design et des produits associés</li>
                    <li>Vendeur choisit l'action post-validation pour chaque produit</li>
                    <li>Produits passent en statut PENDING (en attente validation design)</li>
                    <li>Admin valide le design → Cascade automatique sur tous les produits</li>
                    <li>Selon l'action choisie:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>🚀 AUTO_PUBLISH → Produit publié automatiquement</li>
                        <li>📝 TO_DRAFT → Produit en brouillon validé, publication manuelle</li>
                      </ul>
                    </li>
                  </ol>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">🎯 États des produits</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">📄 Brouillon</Badge>
                      <span>En cours de création</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">⏳ En attente admin</Badge>
                      <span>Design soumis, en attente de validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">📝 Brouillon validé</Badge>
                      <span>Validé par admin, prêt à publier manuellement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">✅ Publié</Badge>
                      <span>Visible par les clients</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">❌ Rejeté</Badge>
                      <span>Design rejeté par admin</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default CascadeValidationDemo; 
 