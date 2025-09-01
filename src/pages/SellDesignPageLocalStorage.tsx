import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  Save, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import VendorDesignTransformationWorkflow from '../components/vendor/VendorDesignTransformationWorkflow';
import { designPositionService } from '../services/DesignPositionService';
import { ProductService } from '../services/productService';
import designService from '../services/designService';

const SellDesignPageLocalStorage: React.FC = () => {
  const navigate = useNavigate();
  const { baseProductId, designId } = useParams<{ baseProductId: string; designId?: string }>();
  
  const [vendorId, setVendorId] = useState<number>(2); // TODO: Récupérer depuis l'auth
  const [adminProduct, setAdminProduct] = useState<any>(null);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Gestion des événements du workflow
  const handleProductCreated = (productId: number) => {
    toast.success('Produit créé avec succès !', {
      action: {
        label: 'Voir le produit',
        onClick: () => navigate(`/vendor/products/${productId}`)
      }
    });
  };
  
  // Chargement des données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Vérifier les paramètres
        if (!baseProductId || isNaN(parseInt(baseProductId))) {
          throw new Error('ID de produit invalide');
        }
        
        // Charger le produit admin
        const productResponse = await ProductService.getProductSmart(parseInt(baseProductId));
        setAdminProduct(productResponse.data);
        
        // Charger le design si spécifié
        if (designId) {
          const designResponse = await designService.getDesigns({});
          setSelectedDesign(designResponse);
        }
        
        console.log('✅ Données chargées:', {
          baseProductId,
          designId,
          vendorId,
          adminProduct: productResponse.data,
          selectedDesign: designId ? selectedDesign : null
        });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
        setError(errorMessage);
        console.error('❌ Erreur chargement données:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [baseProductId, designId]);
  
  // Validation des paramètres
  if (!baseProductId || isNaN(parseInt(baseProductId))) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64 text-red-500">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>ID de produit invalide</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin mr-2" />
            <span>Chargement...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64 text-red-500">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/vendor/products')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Vendre votre Design
              </h1>
              <p className="text-gray-600 mt-1">
                Version localStorage • Pas de création automatique • Validation finale
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              Produit #{baseProductId}
            </Badge>
            {designId && (
              <Badge variant="outline" className="text-sm">
                Design #{designId}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Informations importantes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-500" />
              Nouvelle approche - Pas de création automatique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Aucune création automatique</h4>
                  <p className="text-sm text-gray-600">
                    Pas de produit créé tant que vous n'avez pas validé
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Save className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Stockage local</h4>
                  <p className="text-sm text-gray-600">
                    Position sauvegardée en localStorage uniquement
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Validation finale</h4>
                  <p className="text-sm text-gray-600">
                    Création en base seulement après validation
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Composant principal du workflow */}
        <VendorDesignTransformationWorkflow
          baseProductId={parseInt(baseProductId)}
          designId={designId ? parseInt(designId) : undefined}
          vendorId={vendorId}
          onProductCreated={handleProductCreated}
        />
        
        {/* Instructions d'utilisation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Sélectionnez un design</h4>
                  <p className="text-sm text-gray-600">Choisissez parmi vos designs publiés</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Positionnez votre design</h4>
                  <p className="text-sm text-gray-600">Déplacez, redimensionnez et ajustez comme vous le souhaitez</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Validez et créez</h4>
                  <p className="text-sm text-gray-600">Cliquez sur "Créer le produit" pour finaliser</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">✓</span>
                </div>
                <div>
                  <h4 className="font-medium">Remplissez le formulaire</h4>
                  <p className="text-sm text-gray-600">Ajoutez nom, description, prix et sélectionnez les options</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellDesignPageLocalStorage; 