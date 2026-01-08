import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  Sparkles, 
  Target, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import VendorDesignTransformationWorkflow from '../../components/vendor/VendorDesignTransformationWorkflow';
import { Transformation } from '../../services/transformationService';

const VendorDesignTransformationPage: React.FC = () => {
  const { baseProductId, designId } = useParams<{ baseProductId: string; designId?: string }>();
  const navigate = useNavigate();
  
  const [transformationStats, setTransformationStats] = useState({
    totalCreated: 0,
    totalPublished: 0,
    lastActivity: null as string | null
  });
  
  const [recentTransformations, setRecentTransformations] = useState<Transformation[]>([]);
  
  // Gestion des événements du workflow
  const handleTransformationCreated = (transformation: Transformation) => {
    setTransformationStats(prev => ({
      ...prev,
      totalCreated: prev.totalCreated + 1,
      lastActivity: new Date().toISOString()
    }));
    
    setRecentTransformations(prev => [transformation, ...prev.slice(0, 4)]);
    toast.success('Prototype créé avec succès !');
  };
  
  const handleProductPublished = (productId: number) => {
    setTransformationStats(prev => ({
      ...prev,
      totalPublished: prev.totalPublished + 1,
      lastActivity: new Date().toISOString()
    }));
    
    toast.success('Produit publié avec succès !', {
      action: {
        label: 'Voir le produit',
        onClick: () => navigate(`/vendor/products/${productId}`)
      }
    });
  };
  
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
                Système de Transformation
              </h1>
              <p className="text-gray-600 mt-1">
                Positionnez vos designs et créez des prototypes
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
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Prototypes créés</p>
                  <p className="text-2xl font-bold text-blue-600">{transformationStats.totalCreated}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produits publiés</p>
                  <p className="text-2xl font-bold text-green-600">{transformationStats.totalPublished}</p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dernière activité</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transformationStats.lastActivity 
                      ? new Date(transformationStats.lastActivity).toLocaleString()
                      : 'Aucune activité'
                    }
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Guide étapes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Guide du workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Sélectionner un design</h4>
                  <p className="text-sm text-gray-600">Choisissez un design depuis votre bibliothèque</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Positionner le design</h4>
                  <p className="text-sm text-gray-600">Déplacez, redimensionnez et ajustez</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Prototype créé</h4>
                  <p className="text-sm text-gray-600">Sauvegarde automatique toutes les 500ms</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Publier le produit</h4>
                  <p className="text-sm text-gray-600">Complétez les détails et publiez</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Composant principal du workflow */}
        <VendorDesignTransformationWorkflow
          baseProductId={parseInt(baseProductId)}
          designId={designId ? parseInt(designId) : undefined}
          onTransformationCreated={handleTransformationCreated}
          onProductPublished={handleProductPublished}
        />
        
        {/* Activité récente */}
        {recentTransformations.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransformations.map((transformation) => (
                  <div key={transformation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{transformation.autoGeneratedName}</h4>
                        <p className="text-sm text-gray-600">
                          Créé le {new Date(transformation.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Prototype</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Conseils */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
              Conseils d'utilisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Positionnement optimal</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Centrez le design sur la zone de délimitation</li>
                  <li>• Évitez les bords pour un rendu professionnel</li>
                  <li>• Testez plusieurs échelles pour trouver la meilleure</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Gestion des prototypes</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Les prototypes se sauvegardent automatiquement</li>
                  <li>• Nettoyez régulièrement les anciens prototypes</li>
                  <li>• Publiez rapidement pour libérer de l'espace</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDesignTransformationPage; 