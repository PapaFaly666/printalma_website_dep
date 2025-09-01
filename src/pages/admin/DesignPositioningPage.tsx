import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductViewWithDesign } from '@/components/product-view/ProductViewWithDesign';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  isReadyProduct: boolean;
  categories: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  colorVariations: Array<{
    id: number;
    name: string;
    colorCode: string;
    productId: number;
    images: Array<{
      id: number;
      view: string;
      url: string;
      publicId: string;
      naturalWidth: number | null;
      naturalHeight: number | null;
      delimitations?: Array<{
        id: number;
        x: number;
        y: number;
        width: number;
        height: number;
        coordinateType: string;
      }>;
    }>;
  }>;
  sizes: Array<{
    id: number;
    productId: number;
    sizeName: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Design {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  url: string;
  vendorId: number;
  createdAt: string;
  updatedAt: string;
}

const DesignPositioningPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupérer les données passées via la navigation
  const { selectedMockups: initialMockups, designUrl: initialDesignUrl, designName: initialDesignName, designDescription: initialDesignDescription, designPrice: initialDesignPrice } = location.state || {};
  
  // États pour la gestion des mockups et designs
  const [selectedMockups, setSelectedMockups] = useState<Product[]>(initialMockups || []);
  const [currentMockupIndex, setCurrentMockupIndex] = useState(0);
  const [designUrl, setDesignUrl] = useState<string>(initialDesignUrl || '');
  const [designName, setDesignName] = useState<string>(initialDesignName || '');
  const [designDescription, setDesignDescription] = useState<string>(initialDesignDescription || '');
  const [designPrice, setDesignPrice] = useState<number>(initialDesignPrice || 0);
  
  // États pour les transformations
  const [transforms, setTransforms] = useState<Record<number, {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>>({});

  // Initialiser les données si elles sont passées via la navigation
  useEffect(() => {
    console.log('🎨 DesignPositioningPage - Données reçues:', {
      initialMockups,
      initialDesignUrl,
      initialDesignName,
      initialDesignDescription,
      initialDesignPrice
    });
    
    if (initialMockups && initialMockups.length > 0) {
      setSelectedMockups(initialMockups);
    }
    if (initialDesignUrl) {
      setDesignUrl(initialDesignUrl);
    }
    if (initialDesignName) {
      setDesignName(initialDesignName);
    }
    if (initialDesignDescription) {
      setDesignDescription(initialDesignDescription);
    }
    if (initialDesignPrice) {
      setDesignPrice(initialDesignPrice);
    }
  }, [initialMockups, initialDesignUrl, initialDesignName, initialDesignDescription, initialDesignPrice]);

  // Créer une vue pour le mockup avec ses vraies délimitations
  const createViewFromMockup = (mockup: Product) => {
    const firstImage = mockup.colorVariations?.[0]?.images?.[0];
    if (!firstImage) return null;

    // Utiliser les vraies délimitations du mockup si elles existent
    const mockupDelimitations = firstImage.delimitations || (mockup as any).delimitations || [];
    
    // Si pas de délimitations, créer une par défaut
    const delimitations = mockupDelimitations.length > 0 ? mockupDelimitations : [
      {
        id: 1,
        x: 50, // 50% du centre
        y: 50, // 50% du centre
        width: 30, // 30% de la largeur
        height: 30, // 30% de la hauteur
        coordinateType: 'PERCENTAGE'
      }
    ];

    return {
      id: firstImage.id,
      url: firstImage.url,
      imageUrl: firstImage.url,
      viewType: 'FRONT',
      width: firstImage.naturalWidth,
      height: firstImage.naturalHeight,
      naturalWidth: firstImage.naturalWidth,
      naturalHeight: firstImage.naturalHeight,
      delimitations: delimitations
    };
  };

  const handleSave = useCallback(() => {
    if (selectedMockups.length === 0) {
      toast.error('Aucun mockup sélectionné');
      return;
    }

    if (!designUrl) {
      toast.error('Aucun design sélectionné');
      return;
    }

    // Ici, vous pouvez implémenter la logique pour sauvegarder
    // les transformations et créer le produit final
    toast.success('Design positionné avec succès !');
    navigate('/admin/ready-products');
  }, [selectedMockups, designUrl, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/admin/ready-products/create');
  }, [navigate]);

  const handlePreviousMockup = useCallback(() => {
    setCurrentMockupIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextMockup = useCallback(() => {
    setCurrentMockupIndex(prev => Math.min(selectedMockups.length - 1, prev + 1));
  }, [selectedMockups.length]);

  const currentMockup = selectedMockups[currentMockupIndex];
  const currentView = currentMockup ? createViewFromMockup(currentMockup) : null;

  if (!currentMockup || !currentView) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Aucun mockup disponible
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Veuillez sélectionner des mockups pour positionner votre design.
          </p>
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Retour
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Positionnement du Design
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mockup {currentMockupIndex + 1} sur {selectedMockups.length}
              </div>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panneau de contrôle */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informations du Design
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du design
                  </label>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {designName || 'Non spécifié'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {designDescription || 'Aucune description'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prix
                  </label>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {(designPrice / 100).toFixed(2)} €
                  </div>
                </div>
              </div>

              {/* Navigation entre mockups */}
              {selectedMockups.length > 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Navigation
                  </h4>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePreviousMockup}
                      disabled={currentMockupIndex === 0}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentMockupIndex + 1} / {selectedMockups.length}
                    </span>
                    <button
                      onClick={handleNextMockup}
                      disabled={currentMockupIndex === selectedMockups.length - 1}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone de positionnement */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {currentMockup.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentMockup.description}
                </p>
              </div>
              
              <div className="relative h-96 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                {currentView && designUrl && (
                  <ProductViewWithDesign
                    view={currentView}
                    designUrl={designUrl}
                    productId={currentMockup.id}
                    products={[currentMockup]}
                    vendorDesigns={[]}
                    isAdmin={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignPositioningPage; 