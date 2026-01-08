import React, { useState } from 'react';
import {
  X,
  Package,
  MapPin,
  Clock,
  DollarSign,
  Truck,
  Settings,
  Send,
  Eye,
  Download,
  Share,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedTransporter, setSelectedTransporter] = useState('');
  const [urgentDelivery, setUrgentDelivery] = useState(false);
  const [scheduledDelivery, setScheduledDelivery] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Données simulées pour le produit
  const product = {
    id: '123',
    name: 'T-shirt Personnalisé "PrintAlma"',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1470309864661-1b5ae02a847c?w=800&h=800&fit=crop'
    ],
    description: 'T-shirt en coton bio avec impression personnalisée de haute qualité',
    variations: [
      { name: 'Taille', value: 'L' },
      { name: 'Couleur', value: 'Noir' },
      { name: 'Matière', value: 'Coton 100%' }
    ],
    customization: {
      hasDesign: true,
      designElements: 3,
      colors: ['#000000', '#FFFFFF', '#FF0000'],
      fonts: ['Arial', 'Montserrat', 'Roboto']
    },
    price: 15000,
    weight: '200g',
    dimensions: '30 x 20 x 5 cm'
  };

  // Transporteurs disponibles
  const transporters = [
    { id: '1', name: 'Alpha Diallo', status: 'active', rating: 4.8, avatar: '' },
    { id: '2', name: 'Fatou Sow', status: 'active', rating: 4.6, avatar: '' },
    { id: '3', name: 'Mamadou Ba', status: 'busy', rating: 4.4, avatar: '' }
  ];

  // Informations de livraison
  const deliveryInfo = {
    origin: 'Entrepôt Principal, Dakar',
    destination: 'Client Address',
    estimatedTime: '2-4 heures',
    cost: 1500,
    priority: urgentDelivery ? 'Urgent' : 'Standard'
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleAssignDelivery = () => {
    // Logique pour assigner la livraison
    console.log('Assigning delivery:', {
      productId: product.id,
      transporterId: selectedTransporter,
      urgent: urgentDelivery,
      scheduled: scheduledDelivery,
      scheduledDate,
      scheduledTime,
      instructions: deliveryInstructions
    });
    onClose();
  };

  const handleEditDeliverySettings = () => {
    // Logique pour éditer les paramètres de livraison
    console.log('Editing delivery settings for product:', product.id);
  };

  const handleShare = () => {
    // Logique pour partager
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownload = () => {
    // Logique pour télécharger l'image
    const link = document.createElement('a');
    link.href = product.images[currentImageIndex];
    link.download = `product-${product.id}-${currentImageIndex + 1}.jpg`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-gray-600" />
              <div>
                <DialogTitle className="text-xl font-semibold text-black text-left">
                  {product.name}
                </DialogTitle>
                <p className="text-sm text-gray-500">ID: #{product.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleShare} className="border-gray-200">
                <Share className="w-4 h-4 mr-2" />
                Partager
              </Button>
              <Button variant="outline" onClick={handleDownload} className="border-gray-200">
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
              <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Left Column - Product Preview */}
              <div className="space-y-4">
                {/* Image Gallery */}
                <Card className="border-gray-100">
                  <CardContent className="p-4">
                    <div className="relative">
                      {/* Main Image */}
                      <div className="relative bg-gray-50 rounded-xl overflow-hidden" style={{ height: '400px' }}>
                        <img
                          src={product.images[currentImageIndex]}
                          alt={product.name}
                          className="w-full h-full object-contain transition-transform duration-200"
                          style={{ transform: `scale(${zoomLevel / 100})` }}
                        />

                        {/* Image Navigation */}
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-2 py-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePrevImage}
                            className="h-6 w-6 p-0 text-white hover:bg-white/20"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-xs text-white">
                            {currentImageIndex + 1} / {product.images.length}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNextImage}
                            className="h-6 w-6 p-0 text-white hover:bg-white/20"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Zoom Controls */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white rounded-lg shadow-lg p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            className="h-6 w-6 p-0"
                            disabled={zoomLevel <= 50}
                          >
                            <ZoomOut className="w-3 h-3" />
                          </Button>
                          <span className="text-xs font-medium px-1 min-w-[3rem] text-center">
                            {zoomLevel}%
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            className="h-6 w-6 p-0"
                            disabled={zoomLevel >= 200}
                          >
                            <ZoomIn className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetZoom}
                            className="h-6 w-6 p-0"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Thumbnail Navigation */}
                      <div className="flex gap-2 mt-4">
                        {product.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-1 rounded-lg overflow-hidden border-2 transition-all ${
                              index === currentImageIndex
                                ? 'border-black shadow-md'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ height: '60px' }}
                          >
                            <img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Details */}
                <Card className="border-gray-100">
                  <CardHeader>
                    <CardTitle className="text-lg">Détails du produit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Description</Label>
                      <p className="text-gray-600">{product.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Prix</Label>
                        <p className="text-xl font-bold text-black">{product.price.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Poids</Label>
                        <p className="text-gray-600">{product.weight}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Dimensions</Label>
                      <p className="text-gray-600">{product.dimensions}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Variations</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.variations.map((variation, index) => (
                          <Badge key={index} className="bg-gray-100 text-gray-700 border-gray-200">
                            {variation.name}: {variation.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Delivery Settings */}
              <div className="space-y-4">
                {/* Customization Info */}
                {product.customization.hasDesign && (
                  <Card className="border-gray-100">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="w-5 h-5 text-gray-600" />
                        Personnalisation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Éléments design</Label>
                          <p className="text-gray-600">{product.customization.designElements} éléments</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Couleurs</Label>
                          <div className="flex gap-1 mt-1">
                            {product.customization.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Polices utilisées</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.customization.fonts.map((font, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-gray-200">
                              {font}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Delivery Assignment */}
                <Card className="border-gray-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="w-5 h-5 text-gray-600" />
                      Assignation Livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Transporteur</Label>
                      <Select value={selectedTransporter} onValueChange={setSelectedTransporter}>
                        <SelectTrigger className="border-gray-200">
                          <SelectValue placeholder="Sélectionner un transporteur" />
                        </SelectTrigger>
                        <SelectContent>
                          {transporters.map((transporter) => (
                            <SelectItem key={transporter.id} value={transporter.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={transporter.avatar} alt={transporter.name} />
                                  <AvatarFallback className="text-xs">
                                    {transporter.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm">{transporter.name}</p>
                                  <p className="text-xs text-gray-500">⭐ {transporter.rating}</p>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Livraison urgente</Label>
                        <p className="text-xs text-gray-500">Priorité maximum</p>
                      </div>
                      <Switch
                        checked={urgentDelivery}
                        onCheckedChange={setUrgentDelivery}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Livraison programmée</Label>
                        <p className="text-xs text-gray-500">Planifier pour plus tard</p>
                      </div>
                      <Switch
                        checked={scheduledDelivery}
                        onCheckedChange={setScheduledDelivery}
                      />
                    </div>

                    {scheduledDelivery && (
                      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Date</Label>
                          <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="border-gray-200"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Heure</Label>
                          <Input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="border-gray-200"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Instructions de livraison</Label>
                      <Input
                        placeholder="Ex: Livrer au gardien, appeler avant..."
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        className="border-gray-200"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Summary */}
                <Card className="border-gray-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      Résumé Livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-black">Départ</p>
                        <p className="text-gray-600">{deliveryInfo.origin}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-black">Destination</p>
                        <p className="text-gray-600">{deliveryInfo.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-black">Temps estimé</p>
                        <p className="text-gray-600">{deliveryInfo.estimatedTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-black">Coût livraison</p>
                        <p className="text-gray-600">{deliveryInfo.cost.toLocaleString()} FCFA</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-black">Priorité</p>
                        <Badge className={urgentDelivery ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {deliveryInfo.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
            <div className="text-sm text-gray-600">
              Total commande: <span className="font-bold text-black text-lg">
                {(product.price + deliveryInfo.cost).toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleEditDeliverySettings} className="border-gray-200">
                <Settings className="w-4 h-4 mr-2" />
                Paramètres Livraison
              </Button>
              <Button
                onClick={handleAssignDelivery}
                className="bg-black hover:bg-gray-800 text-white"
                disabled={!selectedTransporter}
              >
                <Send className="w-4 h-4 mr-2" />
                Assigner Livraison
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPreviewModal;