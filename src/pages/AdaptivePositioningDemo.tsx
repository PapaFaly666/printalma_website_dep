import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Palette, 
  Package,
  ArrowLeft,
  Lightbulb,
  CheckCircle,
  Settings
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AdaptiveDesignPositioner } from '../components/AdaptiveDesignPositioner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Données simulées pour la démonstration
const mockProducts = [
  {
    id: 1,
    name: "T-shirt Premium",
    type: "tshirt",
    description: "T-shirt en coton bio avec positionnement poitrine optimal",
    image: "/api/placeholder/300/300",
    category: "Vêtements"
  },
  {
    id: 2,
    name: "Mug Céramique",
    type: "mug",
    description: "Mug en céramique avec zone de design horizontale",
    image: "/api/placeholder/300/300",
    category: "Accessoires"
  },
  {
    id: 3,
    name: "Casquette Baseball",
    type: "cap",
    description: "Casquette avec positionnement frontal optimisé",
    image: "/api/placeholder/300/300",
    category: "Accessoires"
  },
  {
    id: 4,
    name: "Hoodie Unisexe",
    type: "hoodie",
    description: "Hoodie avec zone de design poitrine large",
    image: "/api/placeholder/300/300",
    category: "Vêtements"
  }
];

const mockDesigns = [
  {
    id: 1,
    name: "Logo Solo Leveling",
    url: "https://res.cloudinary.com/dqr1k5vxd/image/upload/v1234567890/designs/solo-leveling-logo.png",
    thumbnail: "/api/placeholder/100/100"
  },
  {
    id: 2,
    name: "Design Géométrique",
    url: "https://res.cloudinary.com/dqr1k5vxd/image/upload/v1234567890/designs/geometric-pattern.png",
    thumbnail: "/api/placeholder/100/100"
  },
  {
    id: 3,
    name: "Citation Motivante",
    url: "https://res.cloudinary.com/dqr1k5vxd/image/upload/v1234567890/designs/motivational-quote.png",
    thumbnail: "/api/placeholder/100/100"
  }
];

export const AdaptivePositioningDemo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]);
  const [selectedDesign, setSelectedDesign] = useState(mockDesigns[0]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [showDemo, setShowDemo] = useState(false);

  const handlePositionChange = (position: any) => {
    setCurrentPosition(position);
    console.log('Position mise à jour:', position);
  };

  const handleStartDemo = () => {
    setShowDemo(true);
    toast.success('Démonstration lancée !', {
      description: 'Testez le positionnement adaptatif avec différents produits.'
    });
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    toast.info(`Produit sélectionné: ${product.name}`, {
      description: `Type: ${product.type} - Positionnement optimisé automatiquement`
    });
  };

  const handleDesignSelect = (design: any) => {
    setSelectedDesign(design);
    toast.info(`Design sélectionné: ${design.name}`, {
      description: 'Le positionnement va s\'adapter au nouveau design'
    });
  };

  if (!showDemo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <Target className="w-12 h-12 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Positionnement Adaptatif
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8"
            >
              Système intelligent de positionnement des designs selon le type de produit
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            >
              {mockProducts.map((product, index) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {product.name}
                    </h3>
                    <Badge variant="outline" className="mb-3">
                      {product.type.toUpperCase()}
                    </Badge>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>

          {/* Fonctionnalités */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <Card className="text-center">
              <CardContent className="p-6">
                <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Positionnement Intelligent
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chaque type de produit a son positionnement optimal automatique
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Settings className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Presets Rapides
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Boutons pour positions courantes (centre, poitrine, etc.)
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Palette className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Personnalisation Fine
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ajustements précis avec aperçu temps réel
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button
              onClick={handleStartDemo}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              Lancer la démonstration
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowDemo(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Démonstration Positionnement Adaptatif
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Testez le système avec différents produits et designs
              </p>
            </div>
          </div>
          
          <Badge variant="outline" className="text-sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Système actif
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sélection du produit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Sélectionner un produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockProducts.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedProduct.id === product.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </h3>
                          <Badge variant="outline" className="text-xs mt-1">
                            {product.type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Sélection du design */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Sélectionner un design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockDesigns.map((design) => (
                <motion.div
                  key={design.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedDesign.id === design.id 
                        ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleDesignSelect(design)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Palette className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {design.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Design personnalisé
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Contrôleur de positionnement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Positionnement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Produit:</strong> {selectedProduct.name}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Design:</strong> {selectedDesign.name}
                  </p>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-3 rounded">
                  <strong>Position actuelle:</strong>
                  {currentPosition ? (
                    <pre className="mt-1 text-xs">
                      {JSON.stringify(currentPosition, null, 2)}
                    </pre>
                  ) : (
                    <p className="mt-1">Aucune position définie</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Composant de positionnement adaptatif */}
        <div className="mt-8">
          <AdaptiveDesignPositioner
            productId={selectedProduct.id}
            designUrl={selectedDesign.url}
            onPositionChange={handlePositionChange}
            showPreview={true}
            className="w-full"
          />
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Instructions d'utilisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  🎯 Fonctionnalités testées
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Positionnement automatique par type de produit</li>
                  <li>• Presets prédéfinis (centre, poitrine, etc.)</li>
                  <li>• Contrôles de positionnement fin</li>
                  <li>• Aperçu temps réel</li>
                  <li>• Sauvegarde des positions</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  🚀 Comment tester
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>1. Sélectionnez un produit différent</li>
                  <li>2. Changez le design</li>
                  <li>3. Utilisez les presets rapides</li>
                  <li>4. Ajustez finement avec les sliders</li>
                  <li>5. Sauvegardez votre position</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 
 
 
 