import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Paintbrush,
  Image as ImageIcon
} from 'lucide-react';
import InteractiveDesignPositioner from '../../components/vendor/InteractiveDesignPositioner';

interface DesignTransforms {
  positionX: number;
  positionY: number;
  scale: number;
  rotation: number;
}

interface BoundaryValidation {
  isValid: boolean;
  message: string;
  violations: string[];
}

interface AdminProductForMockupEdit {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  colorVariations: Array<{
    id: number;
    name: string;
    colorCode: string;
    images: Array<{
      id: number;
      url: string;
      viewType: string;
      delimitations: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        coordinateType: 'PERCENTAGE' | 'PIXEL';
      }>;
    }>;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

export const AdminMockupEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<AdminProductForMockupEdit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentTransforms, setCurrentTransforms] = useState<DesignTransforms>({
    positionX: 0.5,
    positionY: 0.3,
    scale: 0.95,
    rotation: 0
  });
  const [boundaryValidation, setBoundaryValidation] = useState<BoundaryValidation>({
    isValid: true,
    message: 'Position valide',
    violations: []
  });

  // Design par défaut pour les tests (tu peux le remplacer par un vrai système d'upload)
  const [designUrl] = useState('https://via.placeholder.com/300x300/4F46E5/ffffff?text=Design+Test');

  useEffect(() => {
    if (id) {
      fetchProductForMockupEdit(parseInt(id));
    }
  }, [id]);

  const fetchProductForMockupEdit = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Produit introuvable');
        } else if (response.status === 403) {
          throw new Error('Accès refusé');
        } else if (response.status === 401) {
          throw new Error('Vous devez être connecté');
        }
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data) {
        setProduct(data);
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(errorMessage);
      console.error('❌ Error fetching product for mockup edit:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTransformsChange = (transforms: DesignTransforms) => {
    setCurrentTransforms(transforms);
  };

  const handleValidationChange = (validation: BoundaryValidation) => {
    setBoundaryValidation(validation);
  };

  const handleSaveDelimitations = async (transforms: DesignTransforms) => {
    if (!product || !boundaryValidation.isValid) {
      toast.error('Position invalide - impossible de sauvegarder');
      return;
    }

    const currentColor = product.colorVariations[selectedColorIndex];
    const currentImage = currentColor?.images[selectedImageIndex];

    if (!currentImage) {
      toast.error('Aucune image sélectionnée');
      return;
    }

    try {
      setSaving(true);

      // Convertir les transformations en délimitations
      const newDelimitation = {
        x: transforms.positionX * 100, // Convertir en pourcentage
        y: transforms.positionY * 100,
        width: 20 * transforms.scale, // Largeur de base * scale
        height: 20 * transforms.scale, // Hauteur de base * scale
        coordinateType: 'PERCENTAGE' as const
      };

      const response = await fetch(`${API_BASE_URL}/products/${product.id}/images/${currentImage.id}/delimitations`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delimitations: [newDelimitation]
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des délimitations');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Délimitations sauvegardées avec succès');
        setCurrentTransforms(transforms);
        
        // Recharger les données du produit pour refléter les changements
        await fetchProductForMockupEdit(product.id);
      } else {
        throw new Error(result.message || 'Erreur de sauvegarde');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      console.error('❌ Error saving delimitations:', err);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/admin/products/${id}`);
  };

  const handlePreview = () => {
    window.open(`/admin/products/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chargement du produit</h2>
          <p className="text-gray-600">Préparation de l'interface de modification...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Produit non disponible"}
          </h2>
          <p className="text-gray-600 mb-8">
            Impossible de charger le produit pour la modification.
          </p>
          <Button 
            onClick={() => navigate('/admin/products')}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  // Obtenir la couleur et l'image actuellement sélectionnées
  const currentColor = product.colorVariations[selectedColorIndex];
  const currentImage = currentColor?.images[selectedImageIndex];

  if (!currentColor || !currentImage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <ImageIcon className="h-16 w-16 mx-auto text-orange-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Aucun mockup disponible
          </h2>
          <p className="text-gray-600 mb-8">
            Ce produit n'a pas de variations de couleur ou d'images mockup configurées.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate(`/admin/products/${id}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurer les variations
            </Button>
            <Button 
              onClick={handleBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au produit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au produit
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Modification des Mockups
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  {product.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="border-gray-300 hover:border-gray-400"
              >
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
              <Button 
                size="sm"
                onClick={() => handleSaveDelimitations(currentTransforms)}
                disabled={!boundaryValidation.isValid || saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder les délimitations
              </Button>
            </div>
          </div>
          
          {/* Statut et informations */}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant={product.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
              {product.status.toLowerCase() === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
              ID: {product.id}
            </Badge>
            <Badge 
              variant="outline" 
              className="bg-gray-50 text-gray-600 border-gray-300 flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: currentColor.colorCode }}
              />
              {currentColor.name}
            </Badge>
          </div>
        </div>

        {/* État de validation */}
        <div className="mb-6">
          <Card className={`border-2 ${
            boundaryValidation.isValid 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {boundaryValidation.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className={boundaryValidation.isValid ? 'text-green-800' : 'text-red-800'}>
                  <p className="font-medium">{boundaryValidation.message}</p>
                  {boundaryValidation.violations.length > 0 && (
                    <ul className="mt-2 text-sm space-y-1">
                      {boundaryValidation.violations.map((violation, index) => (
                        <li key={index}>• {violation}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sélecteurs de couleur et image */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sélecteur de couleur */}
          {product.colorVariations.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paintbrush className="h-5 w-5" />
                  Sélection de couleur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {product.colorVariations.map((color, index) => (
                    <button
                      key={color.id}
                      onClick={() => {
                        setSelectedColorIndex(index);
                        setSelectedImageIndex(0); // Reset image index
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        index === selectedColorIndex 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <span className="text-sm font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sélecteur d'image */}
          {currentColor.images.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Sélection d'image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {currentColor.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        index === selectedImageIndex 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-sm font-medium">{image.viewType}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-6" />

        {/* Interface de positionnement interactif */}
        <InteractiveDesignPositioner
          productId={product.id}
          productImageUrl={currentImage.url}
          productName={`${product.name} - ${currentColor.name} (${currentImage.viewType})`}
          designUrl={designUrl}
          designName={`Délimitations Test`}
          initialTransforms={currentTransforms}
          onTransformsChange={handleTransformsChange}
          onValidationChange={handleValidationChange}
          onSave={handleSaveDelimitations}
          autoSave={false} // Désactiver l'auto-save pour l'admin
          className="w-full"
        />

        {/* Informations sur les délimitations actuelles */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Délimitations actuelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Image sélectionnée</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Type de vue:</span> {currentImage.viewType}</p>
                    <p><span className="font-medium">URL:</span> {currentImage.url}</p>
                    <p><span className="font-medium">Délimitations:</span> {currentImage.delimitations.length} configurée(s)</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Position actuelle</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">X:</span> {Math.round(currentTransforms.positionX * 100)}%</p>
                    <p><span className="font-medium">Y:</span> {Math.round(currentTransforms.positionY * 100)}%</p>
                    <p><span className="font-medium">Échelle:</span> {currentTransforms.scale.toFixed(2)}x</p>
                    <p><span className="font-medium">Rotation:</span> {Math.round(currentTransforms.rotation)}°</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Instructions pour l'admin :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Utilisez le carré bleu pour définir la zone d'impression autorisée</li>
                  <li>• Les designs des vendeurs devront rester dans cette zone</li>
                  <li>• Ajustez la position, taille et rotation pour définir les limites</li>
                  <li>• Sauvegardez pour appliquer les nouvelles délimitations</li>
                  <li>• Ces paramètres s'appliqueront à tous les produits vendeurs utilisant ce mockup</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMockupEditPage;