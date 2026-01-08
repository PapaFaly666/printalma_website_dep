import React, { useState } from 'react';
import VendorProductCardWithDesign from '../VendorProductCardWithDesign';
import ProductImageGallery from '../ProductImageGallery';
import DesignPreview from '../DesignPreview';
import DesignConfigPanel from '../DesignConfigPanel';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';

// Données de test
const mockProduct = {
  id: 1,
  vendorName: "T-Shirt Premium Design",
  vendorDescription: "Un magnifique t-shirt avec design personnalisé",
  price: 15000,
  status: 'PUBLISHED' as const,
  colorVariations: [
    {
      id: 1,
      name: "Noir",
      colorCode: "#000000",
      images: [
        {
          id: 1,
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
          viewType: "FRONT",
          delimitations: [
            {
              x: 30,
              y: 25,
              width: 40,
              height: 35,
              coordinateType: 'PERCENTAGE' as const
            }
          ]
        },
        {
          id: 2,
          url: "https://images.unsplash.com/photo-1503341338985-b855c51faa49?w=400",
          viewType: "BACK",
          delimitations: [
            {
              x: 25,
              y: 20,
              width: 50,
              height: 40,
              coordinateType: 'PERCENTAGE' as const
            }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "Blanc",
      colorCode: "#FFFFFF",
      images: [
        {
          id: 3,
          url: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400",
          viewType: "FRONT",
          delimitations: [
            {
              x: 30,
              y: 25,
              width: 40,
              height: 35,
              coordinateType: 'PERCENTAGE' as const
            }
          ]
        }
      ]
    },
    {
      id: 3,
      name: "Rouge",
      colorCode: "#DC2626",
      images: [
        {
          id: 4,
          url: "https://images.unsplash.com/photo-1583743814966-8936f37f4fe2?w=400",
          viewType: "FRONT",
          delimitations: [
            {
              x: 30,
              y: 25,
              width: 40,
              height: 35,
              coordinateType: 'PERCENTAGE' as const
            }
          ]
        }
      ]
    }
  ],
  baseProduct: {
    name: "T-Shirt Unisexe Premium",
    type: "APPAREL",
    categories: [
      { id: 1, name: "Vêtements" },
      { id: 2, name: "T-Shirts" }
    ]
  },
  designApplication: {
    designUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=200",
    positioning: 'CENTER' as const,
    scale: 0.8
  },
  basePriceAdmin: 10000,
  vendorStock: 50,
  publishedAt: new Date().toISOString()
};

// Données pour la galerie complète
const mockGalleryProduct = {
  adminProduct: {
    images: {
      colorVariations: mockProduct.colorVariations
    }
  },
  designApplication: mockProduct.designApplication,
  selectedColors: mockProduct.colorVariations.map(color => ({
    id: color.id,
    name: color.name,
    colorCode: color.colorCode
  }))
};

const VendorDesignDemo: React.FC = () => {
  const [showDelimitations, setShowDelimitations] = useState(false);
  const [designConfig, setDesignConfig] = useState<{
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  }>({
    positioning: 'CENTER',
    scale: 0.8
  });
  const [currentView, setCurrentView] = useState<'card' | 'gallery' | 'preview'>('card');

  // Produit avec configuration de design mise à jour
  const productWithConfig = {
    ...mockProduct,
    designApplication: {
      ...mockProduct.designApplication!,
      ...designConfig
    }
  };

  const galleryProductWithConfig = {
    ...mockGalleryProduct,
    designApplication: {
      ...mockGalleryProduct.designApplication!,
      ...designConfig
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🎨 Démonstration - Design dans Délimitations
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cette démo montre comment les designs du vendeur s'affichent précisément dans 
            les zones de délimitation des images de produits.
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>🎮 Contrôles de Démonstration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* View Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode d'affichage
              </label>
              <div className="flex gap-2">
                <Button
                  variant={currentView === 'card' ? 'default' : 'outline'}
                  onClick={() => setCurrentView('card')}
                >
                  Carte Produit
                </Button>
                <Button
                  variant={currentView === 'gallery' ? 'default' : 'outline'}
                  onClick={() => setCurrentView('gallery')}
                >
                  Galerie Images
                </Button>
                <Button
                  variant={currentView === 'preview' ? 'default' : 'outline'}
                  onClick={() => setCurrentView('preview')}
                >
                  Aperçu Design
                </Button>
              </div>
            </div>

            {/* Debug Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="show-delimitations"
                checked={showDelimitations}
                onCheckedChange={setShowDelimitations}
              />
              <label htmlFor="show-delimitations" className="text-sm font-medium">
                Afficher les zones de délimitation (Debug)
              </label>
              {showDelimitations && (
                <Badge variant="secondary" className="ml-2">
                  Mode Debug Activé
                </Badge>
              )}
            </div>

            {/* Design Configuration */}
            <DesignConfigPanel
              config={designConfig}
              onChange={setDesignConfig}
            />
          </CardContent>
        </Card>

        {/* Demo Content */}
        <div className="space-y-6">
          {currentView === 'card' && (
            <Card>
              <CardHeader>
                <CardTitle>🃏 Carte Produit Vendeur avec Design</CardTitle>
                <p className="text-sm text-gray-600">
                  Affichage du design superposé dans les délimitations de l'image principale
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <VendorProductCardWithDesign
                    product={productWithConfig}
                    showDelimitations={showDelimitations}
                    onView={(product) => console.log('View:', product)}
                    onEdit={(product) => console.log('Edit:', product)}
                    onDelete={(id) => console.log('Delete:', id)}
                    className="max-w-sm"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentView === 'gallery' && (
            <Card>
              <CardHeader>
                <CardTitle>🖼️ Galerie d'Images avec Design</CardTitle>
                <p className="text-sm text-gray-600">
                  Navigation entre couleurs et vues avec design appliqué
                </p>
              </CardHeader>
              <CardContent>
                <ProductImageGallery
                  product={galleryProductWithConfig}
                  showDelimitations={showDelimitations}
                />
              </CardContent>
            </Card>
          )}

          {currentView === 'preview' && (
            <Card>
              <CardHeader>
                <CardTitle>👁️ Aperçu Design Multi-Couleurs</CardTitle>
                <p className="text-sm text-gray-600">
                  Prévisualisation du design appliqué sur toutes les couleurs sélectionnées
                </p>
              </CardHeader>
              <CardContent>
                <DesignPreview
                  adminProduct={{
                    name: mockProduct.baseProduct.name,
                    images: {
                      colorVariations: mockProduct.colorVariations
                    }
                  }}
                  designUrl={mockProduct.designApplication!.designUrl}
                  designConfig={designConfig}
                  selectedColors={mockProduct.colorVariations.map(color => ({
                    id: color.id,
                    name: color.name,
                    colorCode: color.colorCode
                  }))}
                  maxImages={4}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🎯 Délimitations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Les zones de personnalisation sont définies par des coordonnées précises 
                (pourcentage ou pixels absolus) sur chaque image.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🎨 Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Le design du vendeur est automatiquement redimensionné et positionné 
                dans les zones de délimitation selon la configuration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">⚙️ Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Positionnement (haut, centre, bas) et échelle (30%-100%) 
                configurables pour chaque application de design.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Info */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Informations Techniques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Types de Coordonnées:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>PERCENTAGE:</strong> Coordonnées relatives (0-100%)</li>
                  <li>• <strong>ABSOLUTE:</strong> Coordonnées en pixels fixes</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Positionnement Design:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>CENTER:</strong> Centré dans la délimitation</li>
                  <li>• <strong>TOP:</strong> Aligné en haut avec marge</li>
                  <li>• <strong>BOTTOM:</strong> Aligné en bas avec marge</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Structure de Données:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  delimitations: [{
    x: 30,          // Position X
    y: 25,          // Position Y  
    width: 40,      // Largeur
    height: 35,     // Hauteur
    coordinateType: 'PERCENTAGE'
  }],
  designApplication: {
    designUrl: "...",
    positioning: 'CENTER',
    scale: 0.8
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDesignDemo; 