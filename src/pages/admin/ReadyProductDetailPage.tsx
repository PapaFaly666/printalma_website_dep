import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { apiGet, apiPatch, apiDelete, is404Error } from '../../utils/apiHelpers';
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  Palette,
  Ruler,
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react';

// Types pour les produits prêts
interface ReadyProductImage {
  id: number;
  view: string;
  url: string;
  publicId: string;
  naturalWidth: number | null;
  naturalHeight: number | null;
  colorVariationId: number;
  delimitations: any[];
  customDesign: any;
}

interface ReadyColorVariation {
  id: number;
  name: string;
  colorCode: string;
  productId: number;
  images: ReadyProductImage[];
}

interface ReadyProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: 'DRAFT' | 'PUBLISHED';
  description: string;
  createdAt: string;
  updatedAt: string;
  isValidated: boolean;
  validatedAt: string | null;
  validatedBy: string | null;
  rejectionReason: string | null;
  submittedForValidationAt: string | null;
  isDelete: boolean;
  isReadyProduct: boolean;
  hasCustomDesigns: boolean;
  designsMetadata: {
    totalDesigns: number;
    lastUpdated: string | null;
  };

  // ✅ NEW: FK-based category system
  categoryId?: number | null;
  subCategoryId?: number | null;
  variationId?: number | null;
  category?: {
    id: number;
    name: string;
    level: number;
  } | null;
  subCategory?: {
    id: number;
    name: string;
    level: number;
  } | null;
  variation?: {
    id: number;
    name: string;
    level: number;
  } | null;

  sizes: Array<{
    id: number;
    productId: number;
    sizeName: string;
  }>;
  colorVariations: ReadyColorVariation[];
}

const ReadyProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ReadyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Charger le produit prêt
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const result = await apiGet(`https://printalma-back-dep.onrender.com/products/${id}`);
        
        if (result.error) {
          if (is404Error(result.error)) {
            toast.error('Produit prêt non trouvé');
            navigate('/admin/ready-products');
          } else {
            toast.error(result.error);
          }
          return;
        }

        // Vérifier que c'est bien un produit prêt
        if (!result.data?.isReadyProduct) {
          toast.error('Ce produit n\'est pas un produit prêt');
          navigate('/admin/ready-products');
          return;
        }

        setProduct(result.data);
      } catch (error: any) {
        console.error('Erreur:', error);
        toast.error(error.message || 'Erreur lors du chargement du produit');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Publier le produit
  const handlePublish = async () => {
    try {
      const result = await apiPatch(`https://printalma-back-dep.onrender.com/products/${product.id}`, {
        status: 'published'
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Produit publié avec succès');
      // fetchProduct(); // Function not defined
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la publication');
    }
  };

  // Supprimer le produit
  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit prêt ?')) {
      return;
    }

    try {
      const result = await apiDelete(`https://printalma-back-dep.onrender.com/products/${product.id}`);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Produit supprimé avec succès');
      navigate('/admin/ready-products');
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Produit non trouvé</p>
        <Button onClick={() => navigate('/admin/ready-products')} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

  const currentColor = product.colorVariations[selectedColorIndex];
  const currentImage = currentColor?.images[selectedImageIndex];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/ready-products')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-gray-600">Produit prêt à l'emploi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/ready-products/${product.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          {product.status === 'DRAFT' && (
            <Button onClick={handlePublish}>
              <Eye className="h-4 w-4 mr-2" />
              Publier
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images du produit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Images du produit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentImage && (
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={currentImage.url}
                    alt={`${currentColor.name} - ${currentImage.view}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Navigation des images */}
                {currentColor.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {currentColor.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded border-2 ${
                          index === selectedImageIndex
                            ? 'border-blue-500'
                            : 'border-gray-200'
                        } overflow-hidden`}
                      >
                        <img
                          src={image.url}
                          alt={image.view}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Navigation des couleurs */}
                {product.colorVariations.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {product.colorVariations.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedColorIndex(index);
                          setSelectedImageIndex(0);
                        }}
                        className={`flex-shrink-0 px-3 py-2 rounded border-2 ${
                          index === selectedColorIndex
                            ? 'border-blue-500'
                            : 'border-gray-200'
                        } flex items-center gap-2`}
                      >
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: color.colorCode }}
                        />
                        <span className="text-sm">{color.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations du produit */}
        <div className="space-y-6">
          {/* Statut */}
          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={product.status === 'PUBLISHED' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {product.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
              </Badge>
            </CardContent>
          </Card>

          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informations de base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nom:</span>
                <span className="font-medium">{product.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Prix:</span>
                <span className="font-medium">{(product.price / 100).toFixed(2)} €</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Stock:</span>
                <span className="font-medium">{product.stock}</span>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Description:</span>
                <p className="mt-1 text-sm">{product.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Catégories et tailles */}
          <Card>
            <CardHeader>
              <CardTitle>Catégories et tailles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ✅ NEW: FK-based category hierarchy display */}
              {(product.category || product.subCategory || product.variation) && (
                <div>
                  <span className="text-sm text-gray-600">Hiérarchie de catégories:</span>
                  <div className="flex flex-wrap gap-1 mt-1 items-center">
                    {product.category && (
                      <>
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                          {product.category.name}
                        </Badge>
                        {product.subCategory && <span className="text-gray-400 text-xs">›</span>}
                      </>
                    )}
                    {product.subCategory && (
                      <>
                        <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                          {product.subCategory.name}
                        </Badge>
                        {product.variation && <span className="text-gray-400 text-xs">›</span>}
                      </>
                    )}
                    {product.variation && (
                      <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                        {product.variation.name}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {product.sizes.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Tailles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.sizes.map(size => (
                      <Badge key={size.id} variant="outline" className="text-xs">
                        {size.sizeName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variations de couleur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Variations de couleur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {product.colorVariations.map((color, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <span className="font-medium">{color.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {color.images.length} image{color.images.length > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Métadonnées */}
          <Card>
            <CardHeader>
              <CardTitle>Métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Créé le:</span>
                <span>{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Modifié le:</span>
                <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ID:</span>
                <span>{product.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReadyProductDetailPage; 