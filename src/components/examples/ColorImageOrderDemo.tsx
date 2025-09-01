import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import ColorSelector from '../common/ColorSelector';
import OrderItemDisplay from '../common/OrderItemDisplay';
import { productColorService } from '../../services/productColorService';
import { OrderService } from '../../services/orderService';
import { ColorInProductDto, OrderItemDto } from '../../types/order';

const ColorImageOrderDemo: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [availableColors, setAvailableColors] = useState<ColorInProductDto[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorInProductDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  
  const orderService = new OrderService();

  // Couleurs mockées pour la démonstration
  const mockColors: ColorInProductDto[] = [
    {
      id: 1,
      name: "Rouge Écarlate",
      hexCode: "#DC143C",
      imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f37f5042?w=300&h=300&fit=crop"
    },
    {
      id: 2,
      name: "Bleu Océan",
      hexCode: "#006994",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop"
    },
    {
      id: 3,
      name: "Vert Forêt",
      hexCode: "#228B22",
      imageUrl: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=300&h=300&fit=crop"
    },
    {
      id: 4,
      name: "Noir Élégant",
      hexCode: "#1a1a1a",
      imageUrl: "https://images.unsplash.com/photo-1503341338144-d39772d86d18?w=300&h=300&fit=crop"
    },
    {
      id: 5,
      name: "Blanc Pur",
      hexCode: "#FFFFFF",
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop"
    }
  ];

  // Charger les couleurs au montage
  useEffect(() => {
    loadProductColors();
  }, [selectedProductId]);

  const loadProductColors = async () => {
    try {
      setIsLoading(true);
      // En mode démo, utiliser les couleurs mockées
      // En production, utiliser: const colors = await productColorService.getProductColors(selectedProductId);
      const colors = mockColors;
      setAvailableColors(colors);
      
      // Sélectionner la première couleur par défaut
      if (colors.length > 0) {
        setSelectedColorId(colors[0].id);
        setSelectedColor(colors[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des couleurs:', error);
      toast.error('Erreur lors du chargement des couleurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorSelect = (color: ColorInProductDto) => {
    setSelectedColorId(color.id);
    setSelectedColor(color);
    toast.success(`Couleur sélectionnée: ${color.name}`);
  };

  const createTestOrder = async () => {
    if (!selectedColor) {
      toast.error('Veuillez sélectionner une couleur');
      return;
    }

    try {
      setIsLoading(true);
      
      // Données de commande de test avec le nouveau système colorId
      const orderData = {
        shippingDetails: {
          firstName: "Jean",
          lastName: "Dupont",
          street: "123 Rue de la Paix",
          city: "Dakar",
          postalCode: "12000",
          country: "Sénégal"
        },
        phoneNumber: "+221123456789",
        orderItems: [
          {
            productId: selectedProductId,
            quantity: 2,
            size: "M",
            // 🆕 NOUVEAU: Utiliser colorId (prioritaire)
            colorId: selectedColor.id,
            // OPTIONNEL: garder color pour compatibilité
            color: selectedColor.name
          }
        ]
      };

      console.log('📋 Création de commande avec colorId:', orderData);
      
      // Simuler la création de commande
      const mockOrder = {
        id: Math.floor(Math.random() * 10000),
        orderNumber: `CMD${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        orderItems: [
          {
            id: 1,
            quantity: 2,
            unitPrice: 25000,
            totalPrice: 50000,
            size: "M",
            color: selectedColor.name,
            colorId: selectedColor.id,
            selectedColor: selectedColor,
            product: {
              id: selectedProductId,
              name: "T-shirt Custom Demo",
              designName: "Design PrintAlma",
              designImageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
              // 🆕 NOUVELLES INFORMATIONS DE COULEUR GARANTIES
              orderedColorName: selectedColor.name,
              orderedColorHexCode: selectedColor.hexCode,
              orderedColorImageUrl: selectedColor.imageUrl
            }
          } as OrderItemDto
        ]
      };

      setCreatedOrder(mockOrder);
      toast.success(`Commande créée avec succès! Numéro: ${mockOrder.orderNumber}`);
      
    } catch (error) {
      console.error('Erreur lors de la création de commande:', error);
      toast.error('Erreur lors de la création de commande');
    } finally {
      setIsLoading(false);
    }
  };

  const resetDemo = () => {
    setCreatedOrder(null);
    setSelectedColorId(availableColors[0]?.id || null);
    setSelectedColor(availableColors[0] || null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎨 Démonstration - Images de Couleur dans les Commandes
            <Badge variant="outline">Nouvelle Fonctionnalité</Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Cette démonstration montre comment le nouveau système colorId garantit l'affichage des images de couleur dans les commandes.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Étape 1: Sélection de couleur */}
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Sélection de couleur avec images</h3>
            <p className="text-sm text-gray-600 mb-4">
              Chaque couleur a maintenant son ID unique et son image spécifique.
            </p>
            
            {isLoading ? (
              <div className="animate-pulse">
                <div className="grid grid-cols-5 gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : (
              <ColorSelector
                colors={availableColors}
                selectedColorId={selectedColorId}
                onColorSelect={handleColorSelect}
                size="md"
                showImages={true}
              />
            )}
          </div>

          {/* Informations sur la couleur sélectionnée */}
          {selectedColor && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Couleur sélectionnée:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <strong>ID:</strong> {selectedColor.id}
                </div>
                <div>
                  <strong>Nom:</strong> {selectedColor.name}
                </div>
                <div>
                  <strong>Code Hex:</strong> {selectedColor.hexCode}
                </div>
              </div>
              <div className="mt-2">
                <strong>Image URL:</strong> 
                <span className="text-xs bg-gray-100 px-2 py-1 rounded ml-2">
                  {selectedColor.imageUrl}
                </span>
              </div>
            </div>
          )}

          {/* Bouton pour créer la commande */}
          <div className="flex gap-4">
            <Button 
              onClick={createTestOrder} 
              disabled={!selectedColor || isLoading}
              size="lg"
            >
              {isLoading ? 'Création...' : '🛒 Créer une commande de test'}
            </Button>
            
            {createdOrder && (
              <Button variant="outline" onClick={resetDemo} size="lg">
                🔄 Réinitialiser la démo
              </Button>
            )}
          </div>

          {/* Étape 2: Affichage de la commande créée */}
          {createdOrder && (
            <div>
              <h3 className="text-lg font-semibold mb-3">2. Résultat - Commande avec image de couleur</h3>
              <p className="text-sm text-gray-600 mb-4">
                La commande affiche maintenant l'image exacte de la couleur commandée grâce au système colorId.
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-green-900 mb-2">✅ Commande créée avec succès!</h4>
                <p><strong>Numéro:</strong> {createdOrder.orderNumber}</p>
                <p><strong>Statut:</strong> {createdOrder.status}</p>
              </div>

              {createdOrder.orderItems.map((item: OrderItemDto, index: number) => (
                <OrderItemDisplay 
                  key={index}
                  item={item}
                  showPrice={true}
                />
              ))}
            </div>
          )}

          {/* Informations techniques */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">🔧 Informations techniques</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div><strong>Avant:</strong> Les commandes stockaient seulement le nom de couleur (string)</div>
              <div><strong>Après:</strong> Les commandes utilisent colorId pour une référence directe vers l'image</div>
              <div><strong>Avantage:</strong> Image de couleur garantie et rétrocompatibilité maintenue</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorImageOrderDemo; 