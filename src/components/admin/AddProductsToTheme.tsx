import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  X, 
  Check,
  Package,
  Tag,
  DollarSign,
  Eye,
  Upload,
  FileText,
  Settings
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { apiGet, apiPost } from '../../utils/apiHelpers';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  coverImage?: string;
  categories: string[];
  isReadyProduct: boolean;
}

interface NewProduct {
  name: string;
  description: string;
  price: number;
  status: 'draft' | 'published';
  categories: string[];
  isReadyProduct: boolean;
  images: File[];
}

interface AddProductsToThemeProps {
  themeId: number;
  themeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddProductsToTheme: React.FC<AddProductsToThemeProps> = ({
  themeId,
  themeName,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  
  // États pour les produits existants
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterType, setFilterType] = useState<'all' | 'ready' | 'mockup'>('all');

  // États pour les nouveaux produits
  const [newProducts, setNewProducts] = useState<NewProduct[]>([]);
  const [currentNewProduct, setCurrentNewProduct] = useState<NewProduct>({
    name: '',
    description: '',
    price: 0,
    status: 'draft',
    categories: [],
    isReadyProduct: false,
    images: []
  });

  // Charger les produits disponibles
  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      fetchProducts();
    }
  }, [isOpen, activeTab, filterStatus, filterType]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Construire les paramètres de recherche
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') {
        params.append('isReadyProduct', filterType === 'ready' ? 'true' : 'false');
      }
      
      const url = `https://printalma-back-dep.onrender.com/products${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await apiGet(url);
      
      if (result.success && Array.isArray(result.data)) {
        setProducts(result.data);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les produits existants
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    const matchesType = filterType === 'all' || 
                       (filterType === 'ready' && product.isReadyProduct) ||
                       (filterType === 'mockup' && !product.isReadyProduct);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Sélectionner/désélectionner un produit existant
  const toggleProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Ajouter un nouveau produit à la liste
  const addNewProduct = () => {
    if (!currentNewProduct.name || !currentNewProduct.description || currentNewProduct.price <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setNewProducts([...newProducts, { ...currentNewProduct }]);
    setCurrentNewProduct({
      name: '',
      description: '',
      price: 0,
      status: 'draft',
      categories: [],
      isReadyProduct: false,
      images: []
    });
    toast.success('Produit ajouté à la liste');
  };

  // Supprimer un nouveau produit de la liste
  const removeNewProduct = (index: number) => {
    setNewProducts(newProducts.filter((_, i) => i !== index));
  };

  // Gérer l'upload d'images
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setCurrentNewProduct({
      ...currentNewProduct,
      images: [...currentNewProduct.images, ...files]
    });
  };

  // Ajouter les produits au thème
  const handleAddProducts = async () => {
    const hasExistingProducts = selectedProducts.size > 0;
    const hasNewProducts = newProducts.length > 0;

    if (!hasExistingProducts && !hasNewProducts) {
      toast.error('Veuillez sélectionner ou créer au moins un produit');
      return;
    }

    try {
      setLoading(true);

      // Ajouter les produits existants
      if (hasExistingProducts) {
        const existingResponse = await apiPost(`https://printalma-back-dep.onrender.com/themes/${themeId}/products`, {
          productIds: Array.from(selectedProducts)
        });

        if (!existingResponse.success) {
          toast.error('Erreur lors de l\'ajout des produits existants');
          return;
        }
      }

      // Créer et ajouter les nouveaux produits
      if (hasNewProducts) {
        for (const newProduct of newProducts) {
          const formData = new FormData();
          formData.append('productData', JSON.stringify({
            name: newProduct.name,
            description: newProduct.description,
            price: newProduct.price,
            status: newProduct.status,
            categories: newProduct.categories,
            isReadyProduct: newProduct.isReadyProduct
          }));

          // Ajouter les images
          newProduct.images.forEach((image, index) => {
            formData.append(`file_${index}`, image);
          });

          const createResponse = await apiPost('https://printalma-back-dep.onrender.com/products', formData);
          
          if (createResponse.success) {
            // Ajouter le nouveau produit au thème
            await apiPost(`https://printalma-back-dep.onrender.com/themes/${themeId}/products`, {
              productIds: [createResponse.data.id]
            });
          }
        }
      }

      const totalAdded = selectedProducts.size + newProducts.length;
      toast.success(`${totalAdded} produit(s) ajouté(s) au thème`);
      
      // Réinitialiser
      setSelectedProducts(new Set());
      setNewProducts([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout des produits:', error);
      toast.error('Erreur lors de l\'ajout des produits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Gérer les produits du thème "{themeName}"
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Produits existants
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Créer des produits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="mt-6">
            {/* Interface pour les produits existants */}
            <div className="flex flex-col h-full">
              {/* Barre de recherche et filtres */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="published">Publié</option>
                      <option value="draft">Brouillon</option>
                    </select>

                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                    >
                      <option value="all">Tous les types</option>
                      <option value="ready">Produits prêts</option>
                      <option value="mockup">Produits mockup</option>
                    </select>

                    <Button
                      onClick={fetchProducts}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                    >
                      Actualiser
                    </Button>
                  </div>
                </div>
              </div>

              {/* Liste des produits existants */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Chargement des produits...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Aucun produit trouvé
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Aucun produit ne correspond à vos critères de recherche.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                      >
                        <Card 
                          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                            selectedProducts.has(product.id) 
                              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => toggleProduct(product.id)}
                        >
                          <CardContent className="p-4">
                            {/* Image du produit */}
                            <div className="relative h-32 mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {product.coverImage ? (
                                <img
                                  src={product.coverImage}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              
                              {/* Badge de sélection */}
                              {selectedProducts.has(product.id) && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-blue-500 text-white rounded-full p-1">
                                    <Check className="h-4 w-4" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Informations du produit */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                                {product.name}
                              </h4>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {product.description}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    {(product.price / 100).toFixed(2)}€
                                  </span>
                                </div>
                                
                                <Badge 
                                  variant={product.status === 'published' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {product.status}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2">
                                <Tag className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {product.categories.join(', ')}
                                </span>
                              </div>

                              <Badge 
                                variant="outline" 
                                className="text-xs"
                              >
                                {product.isReadyProduct ? 'Produit prêt' : 'Produit mockup'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="new" className="mt-6">
            {/* Interface pour créer de nouveaux produits */}
            <div className="space-y-6">
              {/* Formulaire de création */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Créer un nouveau produit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nom du produit *</label>
                      <Input
                        value={currentNewProduct.name}
                        onChange={(e) => setCurrentNewProduct({
                          ...currentNewProduct,
                          name: e.target.value
                        })}
                        placeholder="Ex: T-Shirt Manga"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Prix (en centimes) *</label>
                      <Input
                        type="number"
                        value={currentNewProduct.price}
                        onChange={(e) => setCurrentNewProduct({
                          ...currentNewProduct,
                          price: parseInt(e.target.value) || 0
                        })}
                        placeholder="2500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea
                      value={currentNewProduct.description}
                      onChange={(e) => setCurrentNewProduct({
                        ...currentNewProduct,
                        description: e.target.value
                      })}
                      placeholder="Description détaillée du produit..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Statut</label>
                      <Select
                        value={currentNewProduct.status}
                        onValueChange={(value) => setCurrentNewProduct({
                          ...currentNewProduct,
                          status: value as 'draft' | 'published'
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Type de produit</label>
                      <Select
                        value={currentNewProduct.isReadyProduct ? 'ready' : 'mockup'}
                        onValueChange={(value) => setCurrentNewProduct({
                          ...currentNewProduct,
                          isReadyProduct: value === 'ready'
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mockup">Produit mockup</SelectItem>
                          <SelectItem value="ready">Produit prêt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Catégories</label>
                      <Input
                        value={currentNewProduct.categories.join(', ')}
                        onChange={(e) => setCurrentNewProduct({
                          ...currentNewProduct,
                          categories: e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat)
                        })}
                        placeholder="T-shirts, Manga, Anime"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Images du produit</label>
                    <div className="mt-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="product-images"
                      />
                      <label
                        htmlFor="product-images"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4" />
                        Sélectionner des images
                      </label>
                      {currentNewProduct.images.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          {currentNewProduct.images.length} image(s) sélectionnée(s)
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={addNewProduct}
                    disabled={!currentNewProduct.name || !currentNewProduct.description || currentNewProduct.price <= 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter à la liste
                  </Button>
                </CardContent>
              </Card>

              {/* Liste des nouveaux produits */}
              {newProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Produits à créer ({newProducts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {newProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-600">{(product.price / 100).toFixed(2)}€</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {product.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {product.isReadyProduct ? 'Produit prêt' : 'Produit mockup'}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeNewProduct(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {activeTab === 'existing' ? (
                `${selectedProducts.size} produit(s) existant(s) sélectionné(s)`
              ) : (
                `${newProducts.length} nouveau(x) produit(s) à créer`
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              
              <Button
                onClick={handleAddProducts}
                disabled={
                  (activeTab === 'existing' && selectedProducts.size === 0) ||
                  (activeTab === 'new' && newProducts.length === 0) ||
                  loading
                }
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {activeTab === 'existing' 
                  ? `Ajouter ${selectedProducts.size} produit(s)`
                  : `Créer ${newProducts.length} produit(s)`
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductsToTheme; 