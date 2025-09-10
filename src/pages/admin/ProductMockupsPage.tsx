import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Upload,
  Trash2,
  Edit3,
  Eye,
  Plus,
  ImageIcon,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';

interface ProductImage {
  id: number;
  view: string;
  url: string;
  publicId: string;
  naturalWidth: number;
  naturalHeight: number;
  colorVariationId: number;
}

interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  productId: number;
  images: ProductImage[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  colorVariations: ColorVariation[];
}

export const ProductMockupsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
    }
  }, [id]);

  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`https://printalma-back-dep.onrender.com/products/${productId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Erreur lors du chargement du produit');
      
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger le produit');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (colorVariationId: number, file: File) => {
    try {
      setUploadingImage(`color-${colorVariationId}`);
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('view', 'front'); // Par défaut
      formData.append('colorVariationId', colorVariationId.toString());
      
      const response = await fetch(`https://printalma-back-dep.onrender.com/products/${id}/images`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Erreur lors de l\'upload');
      
      await fetchProduct(parseInt(id!));
      toast.success('Image ajoutée avec succès');
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;
    
    try {
      const response = await fetch(`https://printalma-back-dep.onrender.com/products/${id}/images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      
      await fetchProduct(parseInt(id!));
      toast.success('Image supprimée avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleUpdateImageView = async (imageId: number, newView: string) => {
    try {
      const response = await fetch(`https://printalma-back-dep.onrender.com/products/${id}/images/${imageId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view: newView })
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      
      await fetchProduct(parseInt(id!));
      toast.success('Vue mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du produit...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Impossible de charger le produit. Veuillez réessayer.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/products')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux produits
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestion des Mockups
                </h1>
                <p className="text-gray-600 mt-1">
                  {product.name} - {product.colorVariations.length} couleur(s)
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Color Variations */}
        <div className="space-y-8">
          {product.colorVariations.map((colorVariation, index) => (
            <motion.div
              key={colorVariation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: colorVariation.colorCode }}
                      ></div>
                      <span>{colorVariation.name}</span>
                      <Badge variant="outline">
                        {colorVariation.images.length} image(s)
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Upload nouvelle image */}
                  <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <Label 
                        htmlFor={`upload-${colorVariation.id}`}
                        className="cursor-pointer text-sm text-gray-600 hover:text-gray-800"
                      >
                        {uploadingImage === `color-${colorVariation.id}` ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
                            Upload en cours...
                          </div>
                        ) : (
                          <>Cliquer pour ajouter une image mockup</>
                        )}
                      </Label>
                      <Input
                        id={`upload-${colorVariation.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(colorVariation.id, file);
                          }
                        }}
                        disabled={uploadingImage === `color-${colorVariation.id}`}
                      />
                    </div>
                  </div>

                  {/* Liste des images */}
                  {colorVariation.images.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Aucune image pour cette couleur</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {colorVariation.images.map((image) => (
                        <div
                          key={image.id}
                          className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden"
                        >
                          <div className="aspect-square relative">
                            <img
                              src={image.url}
                              alt={`${colorVariation.name} - ${image.view}`}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Actions overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => window.open(image.url, '_blank')}
                                title="Voir en grand"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteImage(image.id)}
                                title="Supprimer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Infos image */}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs">
                                {image.view}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {image.naturalWidth} × {image.naturalHeight}
                              </span>
                            </div>
                            
                            {/* Modification de la vue */}
                            <div className="flex items-center gap-1">
                              <Label className="text-xs text-gray-600">Vue:</Label>
                              <Input
                                value={image.view}
                                onChange={(e) => handleUpdateImageView(image.id, e.target.value)}
                                className="text-xs h-6 flex-1"
                                placeholder="front, back, side..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instructions:</strong> Ajoutez des images mockup pour chaque couleur du produit. 
              Les vues courantes sont: front (face), back (dos), side (côté), etc. 
              Les images seront automatiquement optimisées pour l'affichage.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductMockupsPage;