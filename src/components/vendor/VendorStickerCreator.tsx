import React, { useState, useMemo } from 'react';
import {
  Sticker,
  Flag,
  Check,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/use-toast';
import vendorStickerService, {
  StickerType,
  StickerSurface,
  CreateStickerProductPayload
} from '../../services/vendorStickerService';

interface VendorStickerCreatorProps {
  design: {
    id: number;
    name: string;
    imageUrl: string;
    thumbnailUrl?: string;
    price: number;
  };
  onSuccess?: (productId: number) => void;
  onCancel?: () => void;
}

const VendorStickerCreator: React.FC<VendorStickerCreatorProps> = ({
  design,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();

  // États du formulaire
  const [stickerType, setStickerType] = useState<StickerType | null>(null);
  const [stickerSurface, setStickerSurface] = useState<StickerSurface>('blanc-mat');
  const [stickerBorderColor, setStickerBorderColor] = useState('transparent');
  const [stickerSize, setStickerSize] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productStock, setProductStock] = useState(10);
  const [autoPublish, setAutoPublish] = useState(false);

  // États UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'type' | 'config' | 'preview'>('type');

  // Récupérer les options disponibles
  const availableSizes = useMemo(() => {
    if (!stickerType) return [];
    return vendorStickerService.getAvailableSizes(stickerType);
  }, [stickerType]);

  const availableBorderColors = useMemo(() => {
    return vendorStickerService.getAvailableBorderColors();
  }, []);

  const availableSurfaces = useMemo(() => {
    return vendorStickerService.getAvailableSurfaces();
  }, []);

  // Calculer le prix du produit
  const calculatedPrice = useMemo(() => {
    if (!stickerType) return 0;
    return vendorStickerService.calculateStickerPrice(
      stickerType,
      design.price,
      stickerSize
    );
  }, [stickerType, design.price, stickerSize]);

  // Initialiser la première taille disponible quand le type change
  React.useEffect(() => {
    if (stickerType && availableSizes.length > 0) {
      setStickerSize(availableSizes[0]);
    }
  }, [stickerType, availableSizes]);

  // Générer un nom de produit par défaut
  React.useEffect(() => {
    if (stickerType && !productName) {
      const typeName = stickerType === 'autocollant' ? 'Autocollant' : 'Sticker Pare-chocs';
      setProductName(`${typeName} - ${design.name}`);
    }
  }, [stickerType, design.name, productName]);

  // Gérer la sélection du type de sticker
  const handleTypeSelection = (type: StickerType) => {
    setStickerType(type);
    setCurrentStep('config');
  };

  // Valider et passer à l'aperçu
  const handleConfigComplete = () => {
    if (!stickerSize) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une taille',
        variant: 'destructive'
      });
      return;
    }

    if (!productName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un nom de produit',
        variant: 'destructive'
      });
      return;
    }

    setCurrentStep('preview');
  };

  // Créer le produit sticker
  const handleCreateSticker = async () => {
    if (!stickerType) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un type de sticker',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Parse size from string "100mm x 120mm" -> {width: 10, height: 12}
      const sizeMatch = stickerSize.match(/(\d+)\s*mm\s*x\s*(\d+)\s*mm/);
      const parsedSize = sizeMatch
        ? { width: parseInt(sizeMatch[1]) / 10, height: parseInt(sizeMatch[2]) / 10 }
        : { width: 10, height: 10 };

      const payload: CreateStickerProductPayload = {
        designId: design.id,
        name: productName,
        description: productDescription || undefined,
        size: parsedSize,
        finish: stickerSurface, // Map stickerSurface to finish
        shape: 'SQUARE', // Default shape
        price: calculatedPrice,
        stockQuantity: productStock,
        stickerType,
        borderColor: stickerBorderColor
      };

      console.log('📦 Création produit sticker:', payload);

      const result = await vendorStickerService.createStickerProduct(payload);

      toast({
        title: '✅ Sticker créé',
        description: `Le produit "${productName}" a été créé avec l'image générée par le serveur`,
        duration: 4000
      });

      if (onSuccess) {
        onSuccess(result.productId);
      }
    } catch (error: any) {
      console.error('❌ Erreur création sticker:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le produit sticker',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu de l'étape 1: Sélection du type
  const renderTypeSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Choisissez le type de sticker
        </h3>
        <p className="text-sm text-gray-600">
          Sélectionnez le type de sticker que vous souhaitez créer avec ce design
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Autocollant */}
        <button
          onClick={() => handleTypeSelection('autocollant')}
          className="group relative p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Sticker className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Autocollant</h4>
              <p className="text-sm text-gray-600">
                Avec contours découpés et bordure personnalisable
              </p>
            </div>
            <div className="text-sm font-semibold text-primary">
              À partir de 2 000 FCFA
            </div>
          </div>
        </button>

        {/* Pare-chocs */}
        <button
          onClick={() => handleTypeSelection('pare-chocs')}
          className="group relative p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Flag className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Pare-chocs</h4>
              <p className="text-sm text-gray-600">
                Format rectangulaire avec bordure blanche large
              </p>
            </div>
            <div className="text-sm font-semibold text-primary">
              À partir de 4 500 FCFA
            </div>
          </div>
        </button>
      </div>

      {onCancel && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      )}
    </div>
  );

  // Rendu de l'étape 2: Configuration
  const renderConfiguration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Configuration du sticker
          </h3>
          <p className="text-sm text-gray-600">
            {stickerType === 'autocollant' ? 'Autocollant' : 'Sticker pare-chocs'} avec le design "{design.name}"
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep('type')}
        >
          Changer de type
        </Button>
      </div>

      {/* Taille */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Taille du sticker *
        </label>
        <select
          value={stickerSize}
          onChange={(e) => setStickerSize(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {availableSizes.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      {/* Surface (autocollants uniquement) */}
      {stickerType === 'autocollant' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Surface *
          </label>
          <div className="grid grid-cols-1 gap-3">
            {availableSurfaces.map(surface => (
              <button
                key={surface.value}
                onClick={() => setStickerSurface(surface.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  stickerSurface === surface.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      {surface.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {surface.description}
                    </div>
                  </div>
                  {stickerSurface === surface.value && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bordure (autocollants uniquement) */}
      {stickerType === 'autocollant' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Bordure *
          </label>
          <div className="grid grid-cols-1 gap-3">
            {availableBorderColors.map(border => (
              <button
                key={border.value}
                onClick={() => setStickerBorderColor(border.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  stickerBorderColor === border.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: border.preview }}
                    />
                    <span className="font-semibold text-gray-900">
                      {border.label}
                    </span>
                  </div>
                  {stickerBorderColor === border.value && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nom du produit */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Nom du produit *
        </label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Ex: Autocollant Logo Entreprise"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Description (optionnel)
        </label>
        <textarea
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder="Décrivez votre sticker..."
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
        />
      </div>

      {/* Stock */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Stock initial
        </label>
        <input
          type="number"
          value={productStock}
          onChange={(e) => setProductStock(parseInt(e.target.value) || 0)}
          min="0"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Prix calculé */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-900 font-medium mb-1">
              Prix calculé automatiquement
            </div>
            <div className="text-xs text-blue-700">
              Basé sur le type, la taille et le prix du design
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {calculatedPrice.toLocaleString()} FCFA
          </div>
        </div>
      </div>

      {/* Auto-publication */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="autoPublish"
          checked={autoPublish}
          onChange={(e) => setAutoPublish(e.target.checked)}
          className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="autoPublish" className="text-sm text-gray-700 cursor-pointer">
          Publier automatiquement après création
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('type')}
          className="flex-1"
        >
          Retour
        </Button>
        <Button
          onClick={handleConfigComplete}
          className="flex-1"
        >
          Aperçu
        </Button>
      </div>
    </div>
  );

  // Rendu de l'étape 3: Aperçu et confirmation
  const renderPreview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Aperçu du produit
        </h3>
        <p className="text-sm text-gray-600">
          Vérifiez les détails avant de créer votre produit sticker
        </p>
      </div>

      {/* Aperçu visuel */}
      <div className="bg-gray-100 rounded-xl p-8">
        <div className="flex items-center justify-center">
          {/* NOTE: L'image finale sera générée par le backend avec bordures */}
          <div className="relative inline-block">
            <img
              src={design.imageUrl || design.thumbnailUrl}
              alt={design.name}
              className="max-w-xs max-h-xs object-contain"
            />
            {/* Indicateur que les bordures seront ajoutées par le serveur */}
            {stickerBorderColor !== 'transparent' && (
              <div className="absolute inset-0 border-4 border-white/30 pointer-events-none rounded-sm" />
            )}
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          L'image finale sera générée avec bordures par le serveur
        </p>
      </div>

      {/* Détails du produit */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Type</div>
            <div className="font-semibold text-gray-900">
              {stickerType === 'autocollant' ? 'Autocollant' : 'Pare-chocs'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Taille</div>
            <div className="font-semibold text-gray-900">{stickerSize}</div>
          </div>
          {stickerType === 'autocollant' && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Surface</div>
                <div className="font-semibold text-gray-900">
                  {stickerSurface === 'blanc-mat' ? 'Blanc mat' : 'Transparent'}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Bordure</div>
                <div className="font-semibold text-gray-900">
                  {availableBorderColors.find(b => b.value === stickerBorderColor)?.label || 'N/A'}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Nom du produit</div>
          <div className="font-semibold text-gray-900">{productName}</div>
        </div>

        {productDescription && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Description</div>
            <div className="text-sm text-gray-900">{productDescription}</div>
          </div>
        )}

        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-primary font-medium mb-1">Prix de vente</div>
              <div className="text-xs text-gray-700">Stock: {productStock} unités</div>
            </div>
            <div className="text-3xl font-bold text-primary">
              {calculatedPrice.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        {autoPublish && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              Ce produit sera <strong>publié automatiquement</strong> après création
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('config')}
          disabled={isSubmitting}
          className="flex-1"
        >
          Modifier
        </Button>
        <Button
          onClick={handleCreateSticker}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Création...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Créer le sticker
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-3xl mx-auto">
      {/* En-tête avec design */}
      <div className="mb-6 pb-6 border-b">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
            <img
              src={design.thumbnailUrl || design.imageUrl}
              alt={design.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Créer un produit sticker
            </h2>
            <p className="text-sm text-gray-600">
              Design: {design.name}
              {design.price > 0 && (
                <span className="text-primary ml-2">+ {design.price} FCFA</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Étapes */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {['type', 'config', 'preview'].map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === step
                      ? 'bg-primary text-white'
                      : index < ['type', 'config', 'preview'].indexOf(currentStep)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < ['type', 'config', 'preview'].indexOf(currentStep) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="text-xs mt-1 text-gray-600">
                  {step === 'type' && 'Type'}
                  {step === 'config' && 'Configuration'}
                  {step === 'preview' && 'Aperçu'}
                </div>
              </div>
              {index < 2 && (
                <div className="w-16 h-0.5 bg-gray-200 mt-[-20px]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Contenu de l'étape */}
      {currentStep === 'type' && renderTypeSelection()}
      {currentStep === 'config' && renderConfiguration()}
      {currentStep === 'preview' && renderPreview()}
    </div>
  );
};

export default VendorStickerCreator;
