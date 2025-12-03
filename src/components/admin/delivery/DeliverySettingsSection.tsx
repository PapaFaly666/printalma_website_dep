import React, { useState } from 'react';
import {
  DollarSign,
  Clock,
  CreditCard,
  Smartphone,
  Calendar,
  Users,
  Truck,
  Settings,
  Save,
  Info,
  MapPin
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Switch } from '../../../components/ui/switch';
import { Slider } from '../../../components/ui/slider';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';

interface DeliverySettings {
  cashOnDelivery: boolean;
  mobileMoneyOnDelivery: boolean;
  scheduledDelivery: boolean;
  transporterManagement: boolean;
  baseFee: number;
  expressFee: number;
  perDistanceFee: number;
}

interface DeliverySettingsSectionProps {
  settings: DeliverySettings;
  onSettingsChange: (settings: DeliverySettings) => void;
}

const DeliverySettingsSection: React.FC<DeliverySettingsSectionProps> = ({
  settings,
  onSettingsChange
}) => {
  const [tempSettings, setTempSettings] = useState(settings);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  const handleToggle = (key: keyof DeliverySettings) => {
    const newSettings = { ...tempSettings, [key]: !tempSettings[key] };
    setTempSettings(newSettings);
  };

  const handleSliderChange = (key: 'baseFee' | 'expressFee' | 'perDistanceFee', value: number[]) => {
    const newSettings = { ...tempSettings, [key]: value[0] };
    setTempSettings(newSettings);
  };

  const handleInputChange = (key: keyof DeliverySettings, value: string) => {
    const newSettings = { ...tempSettings, [key]: parseInt(value) || 0 };
    setTempSettings(newSettings);
  };

  const handleSave = () => {
    onSettingsChange(tempSettings);
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  const paymentMethods = [
    {
      id: 'cashOnDelivery',
      title: 'Paiement à la livraison',
      description: 'Accepter les paiements en espèces lors de la livraison',
      icon: DollarSign,
      enabled: tempSettings.cashOnDelivery,
      toggle: () => handleToggle('cashOnDelivery'),
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'mobileMoneyOnDelivery',
      title: 'Mobile Money à la livraison',
      description: 'Accepter Orange Money, Wave, etc. lors de la livraison',
      icon: Smartphone,
      enabled: tempSettings.mobileMoneyOnDelivery,
      toggle: () => handleToggle('mobileMoneyOnDelivery'),
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'scheduledDelivery',
      title: 'Livraison programmée',
      description: 'Permettre aux clients de programmer leurs livraisons',
      icon: Calendar,
      enabled: tempSettings.scheduledDelivery,
      toggle: () => handleToggle('scheduledDelivery'),
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-black">Paramètres de livraison</h2>
          <p className="text-gray-500">Configurez les options de livraison et les tarifs</p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-black hover:bg-gray-800 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </div>

      {/* Success Message */}
      {showSaveMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Settings className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">Paramètres enregistrés avec succès</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-gray-600" />
              Méthodes de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${method.color}`}>
                    <method.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-black">{method.title}</h4>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </div>
                <Switch
                  checked={method.enabled}
                  onCheckedChange={method.toggle}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Transporter Management */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="w-5 h-5 text-gray-600" />
              Gestion des transporteurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-black">Activer la gestion des transporteurs</h4>
                  <p className="text-sm text-gray-500">
                    Gérer les livreurs, leurs zones et leurs performances
                  </p>
                </div>
              </div>
              <Switch
                checked={tempSettings.transporterManagement}
                onCheckedChange={() => handleToggle('transporterManagement')}
              />
            </div>

            {tempSettings.transporterManagement && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-700">
                    <p className="font-medium mb-1">Gestion activée</p>
                    <p>
                      Vous pouvez maintenant ajouter des transporteurs, définir leurs zones de livraison
                      et suivre leurs performances dans l'onglet Transporteurs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing Rules */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-gray-600" />
            Règles de tarification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Base Fee */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Tarif de base</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-black">
                    {tempSettings.baseFee.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">FCFA</span>
                </div>
              </div>
              <Slider
                value={[tempSettings.baseFee]}
                onValueChange={(value) => handleSliderChange('baseFee', value)}
                min={500}
                max={5000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>500 FCFA</span>
                <span>5 000 FCFA</span>
              </div>
              <Input
                type="number"
                value={tempSettings.baseFee}
                onChange={(e) => handleInputChange('baseFee', e.target.value)}
                className="border-gray-200"
                min={500}
                max={5000}
              />
            </div>

            {/* Express Fee */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Supplément Express</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-black">
                    {tempSettings.expressFee.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">FCFA</span>
                </div>
              </div>
              <Slider
                value={[tempSettings.expressFee]}
                onValueChange={(value) => handleSliderChange('expressFee', value)}
                min={0}
                max={3000}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 FCFA</span>
                <span>3 000 FCFA</span>
              </div>
              <Input
                type="number"
                value={tempSettings.expressFee}
                onChange={(e) => handleInputChange('expressFee', e.target.value)}
                className="border-gray-200"
                min={0}
                max={3000}
              />
            </div>

            {/* Per Distance Fee */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Frais par distance</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-black">
                    {tempSettings.perDistanceFee.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">FCFA/km</span>
                </div>
              </div>
              <Slider
                value={[tempSettings.perDistanceFee]}
                onValueChange={(value) => handleSliderChange('perDistanceFee', value)}
                min={50}
                max={500}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>50 FCFA</span>
                <span>500 FCFA</span>
              </div>
              <Input
                type="number"
                value={tempSettings.perDistanceFee}
                onChange={(e) => handleInputChange('perDistanceFee', e.target.value)}
                className="border-gray-200"
                min={50}
                max={500}
              />
            </div>
          </div>

          {/* Price Rules Summary */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-black mb-3">Calcul des frais de livraison</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tarif standard:</span>
                <Badge className="bg-gray-100 text-gray-700">
                  {tempSettings.baseFee.toLocaleString()} FCFA
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Livraison express:</span>
                <Badge className="bg-blue-100 text-blue-700">
                  {(tempSettings.baseFee + tempSettings.expressFee).toLocaleString()} FCFA
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Frais distance (10km):</span>
                <Badge className="bg-green-100 text-green-700">
                  {(tempSettings.baseFee + (tempSettings.perDistanceFee * 10)).toLocaleString()} FCFA
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Time Settings */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-gray-600" />
            Temps de livraison par défaut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-black">Centre-ville</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Livraison standard</p>
              <Input
                defaultValue="2-4h"
                className="border-gray-200 text-sm"
                placeholder="ex: 2-4h"
              />
            </div>

            <div className="p-4 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-black">Banlieue</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Livraison standard</p>
              <Input
                defaultValue="3-6h"
                className="border-gray-200 text-sm"
                placeholder="ex: 3-6h"
              />
            </div>

            <div className="p-4 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-black">Régions</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Livraison standard</p>
              <Input
                defaultValue="6-12h"
                className="border-gray-200 text-sm"
                placeholder="ex: 6-12h"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliverySettingsSection;