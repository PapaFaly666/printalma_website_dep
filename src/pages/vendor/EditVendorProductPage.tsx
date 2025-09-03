import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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
  Loader2
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

interface VendorProductForEdit {
  id: number;
  vendorName: string;
  vendorDescription: string;
  price: number;
  status: 'PUBLISHED' | 'DRAFT';
  designUrl: string;
  baseProduct: {
    id: number;
    name: string;
    description: string;
  };
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  adminProduct: {
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
  };
  designPositions: Array<{
    designId: number;
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
    };
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

export const EditVendorProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<VendorProductForEdit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
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

  useEffect(() => {
    if (id) {
      fetchProductForEdit(parseInt(id));
    }
  }, [id]);

  const fetchProductForEdit = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/vendor/products/${productId}`, {
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

      const result = await response.json();
      
      if (result.success && result.data) {
        setProduct(result.data);
        
        // Initialiser les transformations depuis les données existantes
        if (result.data.designPositions && result.data.designPositions.length > 0) {
          const position = result.data.designPositions[0].position;
          setCurrentTransforms(position);
        }
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(errorMessage);
      console.error('❌ Error fetching product for edit:', err);
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

  const handleSavePosition = async (transforms: DesignTransforms) => {
    if (!product || !boundaryValidation.isValid) {
      toast.error('Position invalide - impossible de sauvegarder');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE_URL}/vendor/products/${product.id}/position`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position: transforms
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Position sauvegardée avec succès');
        setCurrentTransforms(transforms);
      } else {
        throw new Error(result.message || 'Erreur de sauvegarde');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      console.error('❌ Error saving position:', err);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/vendeur/products/${id}`);
  };

  const handlePreview = () => {
    window.open(`/vendeur/products/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chargement du produit</h2>
          <p className="text-gray-600">Préparation de l'interface d'édition...</p>
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
            Impossible de charger le produit pour l'édition.
          </p>
          <Button 
            onClick={() => navigate('/vendeur/products')}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  // Obtenir la couleur actuellement sélectionnée
  const currentColor = product.selectedColors[selectedColorIndex] || product.selectedColors[0];
  
  // Trouver l'image mockup correspondante
  const colorVariation = product.adminProduct.colorVariations.find(cv => cv.id === currentColor?.id);
  const mockupImage = colorVariation?.images.find(img => img.viewType === 'Front') || colorVariation?.images[0];

  if (!mockupImage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="h-16 w-16 mx-auto text-orange-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Image mockup manquante
          </h2>
          <p className="text-gray-600 mb-8">
            Aucune image mockup n'est disponible pour ce produit.
          </p>
          <Button 
            onClick={handleBack}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au produit
          </Button>
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
                  Édition du design
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  {product.vendorName}
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
                onClick={() => handleSavePosition(currentTransforms)}
                disabled={!boundaryValidation.isValid || saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </div>
          </div>
          
          {/* Statut et informations */}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant={product.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {product.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
              ID: {product.id}
            </Badge>
            {currentColor && (
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
            )}
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

        {/* Sélecteur de couleur si plusieurs couleurs */}
        {product.selectedColors.length > 1 && (
          <div className="mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sélection de couleur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Couleur:</span>
                  <div className="flex gap-3">
                    {product.selectedColors.map((color, index) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColorIndex(index)}
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Separator className="my-6" />

        {/* Interface de positionnement interactif */}
        <InteractiveDesignPositioner
          productId={product.id}
          productImageUrl={mockupImage.url}
          productName={`${product.baseProduct.name} - ${currentColor?.name || 'Couleur par défaut'}`}
          designUrl={product.designUrl}
          designName={`Design ${product.id}`}
          initialTransforms={currentTransforms}
          onTransformsChange={handleTransformsChange}
          onValidationChange={handleValidationChange}
          onSave={handleSavePosition}
          autoSave={true}
          className="w-full"
        />

        {/* Informations sur le produit */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Produit de base</h4>
                  <p className="text-gray-600">{product.baseProduct.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{product.baseProduct.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description vendeur</h4>
                  <p className="text-gray-600">{product.vendorDescription}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditVendorProductPage;