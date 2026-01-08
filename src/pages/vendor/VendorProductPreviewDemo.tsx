import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import ProductDesignPreview from '../../components/vendor/ProductDesignPreview';
import VendorProductDesignPreview, { LegacyVendorProductPreview } from '../../components/vendor/VendorProductDesignPreview';
import { VendorDesignProductResponse } from '../../types/vendorDesignProduct';
import { Palette, Move, RotateCcw, ZoomIn, Eye, Settings } from 'lucide-react';

const VendorProductPreviewDemo: React.FC = () => {
  // État pour les transformations en temps réel
  const [transformations, setTransformations] = useState({
    positionX: 0.5,
    positionY: 0.3,
    scale: 1.2,
    rotation: 0
  });
  
  const [showInfo, setShowInfo] = useState(true);
  const [previewSize, setPreviewSize] = useState({ width: 400, height: 400 });
  
  // Données d'exemple pour les tests
  const mockDesignProducts: VendorDesignProductResponse[] = [
    {
      id: 1,
      vendorId: 1,
      productId: 1,
      designUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/designs/example-logo.png",
      designPublicId: "designs/example-logo",
      designFileName: "Logo d'entreprise",
      positionX: 0.4,
      positionY: 0.25,
      scale: 1.5,
      rotation: 0,
      name: "T-shirt avec logo",
      description: "Design professionnel pour t-shirt",
      status: "PUBLISHED" as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      product: {
        id: 1,
        name: "T-shirt classique",
        price: 25.99,
        description: "T-shirt en coton de qualité"
        // imageUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/products/tshirt-white.png"
      }
    },
    {
      id: 2,
      vendorId: 1,
      productId: 2,
      designUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/designs/artistic-pattern.png",
      designPublicId: "designs/artistic-pattern",
      designFileName: "Motif artistique",
      positionX: 0.3,
      positionY: 0.4,
      scale: 0.8,
      rotation: 15,
      name: "Mug avec motif",
      description: "Design artistique pour mug",
      status: "VALIDATED" as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      product: {
        id: 2,
        name: "Mug blanc",
        price: 12.99,
        description: "Mug en céramique"
        // imageUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/products/mug-white.png"
      }
    }
  ];
  
  // Produits au format legacy pour test
  const mockLegacyProducts = [
    {
      id: 1,
      name: "Casquette personnalisée",
      designUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/designs/cap-design.png",
      view: {
        url: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/products/cap-black.png"
      }
    },
    {
      id: 2,
      name: "Sac tote bag",
      designUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/designs/bag-design.png",
      view: {
        imageUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/products/bag-canvas.png"
      }
    }
  ];
  
  // Gérer les changements de transformation
  const handleTransformChange = (key: string, value: number) => {
    setTransformations(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const resetTransformations = () => {
    setTransformations({
      positionX: 0.5,
      positionY: 0.3,
      scale: 1.2,
      rotation: 0
    });
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Aperçu des Produits avec Designs</h1>
        <p className="text-gray-600">
          Démonstration du composant d'aperçu pour visualiser les designs sur les produits
        </p>
      </div>
      
      <Tabs defaultValue="interactive" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interactive">
            <Settings className="h-4 w-4 mr-2" />
            Interactif
          </TabsTrigger>
          <TabsTrigger value="api-format">
            <Palette className="h-4 w-4 mr-2" />
            Format API
          </TabsTrigger>
          <TabsTrigger value="legacy-format">
            <Move className="h-4 w-4 mr-2" />
            Format Legacy
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Eye className="h-4 w-4 mr-2" />
            Galerie
          </TabsTrigger>
        </TabsList>
        
        {/* Onglet Interactif */}
        <TabsContent value="interactive">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contrôles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Contrôles de Transformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-info">Afficher les informations</Label>
                  <Switch
                    id="show-info"
                    checked={showInfo}
                    onCheckedChange={setShowInfo}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position-x">Position X: {Math.round(transformations.positionX * 100)}%</Label>
                  <Input
                    id="position-x"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={transformations.positionX}
                    onChange={(e) => handleTransformChange('positionX', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position-y">Position Y: {Math.round(transformations.positionY * 100)}%</Label>
                  <Input
                    id="position-y"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={transformations.positionY}
                    onChange={(e) => handleTransformChange('positionY', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scale">Échelle: {transformations.scale.toFixed(2)}</Label>
                  <Input
                    id="scale"
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={transformations.scale}
                    onChange={(e) => handleTransformChange('scale', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rotation">Rotation: {transformations.rotation}°</Label>
                  <Input
                    id="rotation"
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={transformations.rotation}
                    onChange={(e) => handleTransformChange('rotation', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="width">Largeur: {previewSize.width}px</Label>
                  <Input
                    id="width"
                    type="range"
                    min="200"
                    max="600"
                    step="50"
                    value={previewSize.width}
                    onChange={(e) => setPreviewSize(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                  />
                </div>
                
                <Button onClick={resetTransformations} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </CardContent>
            </Card>
            
            {/* Aperçu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu en Temps Réel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductDesignPreview
                  productImageUrl="https://res.cloudinary.com/dxhh7qpob/image/upload/v1/products/tshirt-white.png"
                  designUrl="https://res.cloudinary.com/dxhh7qpob/image/upload/v1/designs/example-logo.png"
                  positionX={transformations.positionX}
                  positionY={transformations.positionY}
                  scale={transformations.scale}
                  rotation={transformations.rotation}
                  productName="T-shirt personnalisé"
                  designName="Design interactif"
                  showInfo={showInfo}
                  width={previewSize.width}
                  height={previewSize.height}
                  onError={(error) => console.error('Erreur aperçu:', error)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Onglet Format API */}
        <TabsContent value="api-format">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockDesignProducts.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {product.name}
                    <Badge variant="outline">{product.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VendorProductDesignPreview
                    vendorDesignProduct={product}
                    showInfo={showInfo}
                    width={300}
                    height={300}
                    onError={(error) => console.error('Erreur produit:', error)}
                  />
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>Design:</strong> {product.designFileName}</p>
                    <p><strong>Prix:</strong> {product.product?.price}€</p>
                    <p><strong>Position:</strong> {Math.round(product.positionX * 100)}%, {Math.round(product.positionY * 100)}%</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Onglet Format Legacy */}
        <TabsContent value="legacy-format">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockLegacyProducts.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <LegacyVendorProductPreview
                    product={product}
                    transforms={transformations}
                    showInfo={showInfo}
                    width={300}
                    height={300}
                    onError={(error) => console.error('Erreur produit legacy:', error)}
                  />
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>Transformations appliquées:</strong></p>
                    <p>• Position: {Math.round(transformations.positionX * 100)}%, {Math.round(transformations.positionY * 100)}%</p>
                    <p>• Échelle: {transformations.scale.toFixed(2)}</p>
                    <p>• Rotation: {transformations.rotation}°</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Onglet Galerie */}
        <TabsContent value="gallery">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDesignProducts.map((product) => (
              <Card key={`gallery-${product.id}`} className="overflow-hidden">
                <CardContent className="p-0">
                  <VendorProductDesignPreview
                    vendorDesignProduct={product}
                    showInfo={false}
                    width={250}
                    height={250}
                  />
                </CardContent>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-sm text-gray-600">{product.product?.price}€</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Informations d'utilisation */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Guide d'utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Composant ProductDesignPreview</h3>
              <p className="text-sm text-gray-600">
                Composant de base pour afficher un produit avec un design superposé. 
                Prend les URLs des images et les transformations normalisées.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Composant VendorProductDesignPreview</h3>
              <p className="text-sm text-gray-600">
                Wrapper pour les données au format VendorDesignProductResponse de l'API.
                Simplifie l'utilisation avec les données backend.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Composant LegacyVendorProductPreview</h3>
              <p className="text-sm text-gray-600">
                Adapter pour les données au format legacy/transformé existant.
                Permet la migration progressive vers le nouveau format.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorProductPreviewDemo; 