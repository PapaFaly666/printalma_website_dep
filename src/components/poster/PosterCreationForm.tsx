import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  Ruler,
  Palette,
  Frame as FrameIcon,
  DollarSign,
  Package,
  Check,
  Loader2,
  Info
} from 'lucide-react';
import Button from '../ui/Button';
import { Design } from '../../services/designService';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

// Formats disponibles
export const POSTER_FORMATS = [
  { id: 'A5', name: 'A5', width: 14.8, height: 21.0, basePrice: 500, description: 'Petit format, idéal pour série' },
  { id: 'A4', name: 'A4', width: 21.0, height: 29.7, basePrice: 800, description: 'Format standard' },
  { id: 'A3', name: 'A3', width: 29.7, height: 42.0, basePrice: 1500, description: 'Format moyen' },
  { id: 'A2', name: 'A2', width: 42.0, height: 59.4, basePrice: 3000, description: 'Grand format' },
  { id: 'A1', name: 'A1', width: 59.4, height: 84.1, basePrice: 5000, description: 'Très grand format' },
  { id: '30x40', name: '30×40 cm', width: 30.0, height: 40.0, basePrice: 1200, description: 'Format portrait' },
  { id: '40x50', name: '40×50 cm', width: 40.0, height: 50.0, basePrice: 2000, description: 'Format moyen' },
  { id: '50x70', name: '50×70 cm', width: 50.0, height: 70.0, basePrice: 3500, description: 'Format populaire' },
  { id: '70x100', name: '70×100 cm', width: 70.0, height: 100.0, basePrice: 6000, description: 'Format mural' },
];

// Finitions disponibles
export const FINISHES = [
  {
    id: 'MAT',
    name: 'Mat',
    description: 'Papier mat premium, sans reflets',
    icon: '📄',
    priceMultiplier: 1.0
  },
  {
    id: 'GLOSSY',
    name: 'Brillant',
    description: 'Papier brillant, couleurs éclatantes',
    icon: '✨',
    priceMultiplier: 1.1
  },
  {
    id: 'CANVAS',
    name: 'Canvas',
    description: 'Texture toile, aspect artistique',
    icon: '🎨',
    priceMultiplier: 1.3
  },
  {
    id: 'FINE_ART',
    name: 'Fine Art',
    description: 'Papier beaux-arts, qualité galerie',
    icon: '🖼️',
    priceMultiplier: 1.5
  },
];

// Cadres disponibles
export const FRAMES = [
  {
    id: 'NO_FRAME',
    name: 'Sans cadre',
    description: 'Poster seul',
    icon: '📋',
    price: 0
  },
  {
    id: 'BLACK_FRAME',
    name: 'Cadre noir',
    description: 'Élégant et moderne',
    icon: '⬛',
    price: 1000
  },
  {
    id: 'WHITE_FRAME',
    name: 'Cadre blanc',
    description: 'Minimaliste et épuré',
    icon: '⬜',
    price: 1000
  },
  {
    id: 'WOOD_FRAME',
    name: 'Cadre bois',
    description: 'Naturel et chaleureux',
    icon: '🪵',
    price: 1500
  },
  {
    id: 'GOLD_FRAME',
    name: 'Cadre doré',
    description: 'Luxueux et raffiné',
    icon: '🟨',
    price: 2000
  },
];

interface PosterCreationFormProps {
  designs: Design[];
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function PosterCreationForm({
  designs,
  initialData,
  onSubmit,
  onCancel
}: PosterCreationFormProps) {
  // État du formulaire
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Données du formulaire
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(
    initialData?.designId || null
  );
  const [selectedFormat, setSelectedFormat] = useState(
    initialData?.formatId || 'A4'
  );
  const [selectedFinish, setSelectedFinish] = useState(
    initialData?.finish || 'MAT'
  );
  const [selectedFrame, setSelectedFrame] = useState(
    initialData?.frame || 'NO_FRAME'
  );
  const [posterName, setPosterName] = useState(initialData?.name || '');
  const [posterDescription, setPosterDescription] = useState(
    initialData?.description || ''
  );
  const [posterPrice, setPosterPrice] = useState(
    initialData?.finalPrice || 0
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialData?.stockQuantity || 10
  );

  // Calcul du prix suggéré
  useEffect(() => {
    if (!posterPrice || posterPrice === 0) {
      const format = POSTER_FORMATS.find(f => f.id === selectedFormat);
      const finish = FINISHES.find(f => f.id === selectedFinish);
      const frame = FRAMES.find(f => f.id === selectedFrame);

      if (format && finish && frame) {
        const basePrice = format.basePrice;
        const finishMultiplier = finish.priceMultiplier;
        const framePrice = frame.price;

        const suggestedPrice = Math.round(basePrice * finishMultiplier + framePrice);
        setPosterPrice(suggestedPrice);
      }
    }
  }, [selectedFormat, selectedFinish, selectedFrame]);

  // Générer le nom automatiquement
  useEffect(() => {
    if (!posterName && selectedDesignId) {
      const design = designs.find(d => d.id === selectedDesignId);
      const format = POSTER_FORMATS.find(f => f.id === selectedFormat);
      if (design && format) {
        setPosterName(`${design.name} - Poster ${format.name}`);
      }
    }
  }, [selectedDesignId, selectedFormat, designs, posterName]);

  const handleSubmit = async () => {
    if (!selectedDesignId) {
      alert('Veuillez sélectionner un design');
      return;
    }

    if (!posterName.trim()) {
      alert('Veuillez donner un nom au poster');
      return;
    }

    if (posterPrice < 100) {
      alert('Le prix doit être d\'au moins 100 FCFA');
      return;
    }

    setSubmitting(true);

    try {
      const format = POSTER_FORMATS.find(f => f.id === selectedFormat);

      const posterData = {
        designId: selectedDesignId,
        name: posterName,
        description: posterDescription,
        formatId: selectedFormat,
        width: format!.width,
        height: format!.height,
        finish: selectedFinish,
        frame: selectedFrame,
        price: posterPrice,
        stockQuantity: stockQuantity
      };

      await onSubmit(posterData);
    } catch (error) {
      console.error('Erreur création poster:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDesign = designs.find(d => d.id === selectedDesignId);
  const currentFormat = POSTER_FORMATS.find(f => f.id === selectedFormat);
  const currentFinish = FINISHES.find(f => f.id === selectedFinish);
  const currentFrame = FRAMES.find(f => f.id === selectedFrame);

  return (
    <div className="space-y-6">
      {/* Indicateur d'étapes */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Design', icon: ImageIcon },
          { num: 2, label: 'Format', icon: Ruler },
          { num: 3, label: 'Finition', icon: Palette },
          { num: 4, label: 'Cadre', icon: FrameIcon },
          { num: 5, label: 'Détails', icon: Package }
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <div
              className={`flex items-center gap-3 ${
                step >= s.num ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s.num
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > s.num ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <s.icon className="h-5 w-5" />
                )}
              </div>
              <span className="text-sm font-medium hidden md:block">{s.label}</span>
            </div>
            {i < 4 && (
              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  step > s.num ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Étape 1 : Sélection du design */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-purple-600" />
            Sélectionnez votre design
          </h3>

          {designs.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">
                Vous devez d'abord créer au moins un design.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {designs.map((design) => (
                <button
                  key={design.id}
                  onClick={() => setSelectedDesignId(Number(design.id))}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                    selectedDesignId === design.id
                      ? 'border-purple-500 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={design.imageUrl}
                      alt={design.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="font-medium text-sm truncate">{design.name}</p>
                    </div>
                  </div>
                  {selectedDesignId === design.id && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Étape 2 : Format */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Ruler className="h-6 w-6 text-purple-600" />
            Choisissez le format
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {POSTER_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedFormat === format.id
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{format.name}</span>
                  {selectedFormat === format.id && (
                    <Check className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {format.width} × {format.height} cm
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {format.description}
                </div>
                <div className="text-sm font-semibold text-purple-600">
                  Base: {format.basePrice} FCFA
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Étape 3 : Finition */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-600" />
            Choisissez la finition
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FINISHES.map((finish) => (
              <button
                key={finish.id}
                onClick={() => setSelectedFinish(finish.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedFinish === finish.id
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{finish.icon}</span>
                    <div>
                      <div className="font-bold text-lg">{finish.name}</div>
                      <div className="text-sm text-gray-600">{finish.description}</div>
                    </div>
                  </div>
                  {selectedFinish === finish.id && (
                    <Check className="h-6 w-6 text-purple-600 flex-shrink-0" />
                  )}
                </div>
                <div className="text-sm font-semibold text-purple-600">
                  ×{finish.priceMultiplier} du prix de base
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Étape 4 : Cadre */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FrameIcon className="h-6 w-6 text-purple-600" />
            Ajoutez un cadre (optionnel)
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FRAMES.map((frame) => (
              <button
                key={frame.id}
                onClick={() => setSelectedFrame(frame.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedFrame === frame.id
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{frame.icon}</span>
                  {selectedFrame === frame.id && (
                    <Check className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div className="font-bold text-sm mb-1">{frame.name}</div>
                <div className="text-xs text-gray-600 mb-2">{frame.description}</div>
                <div className="text-sm font-semibold text-purple-600">
                  {frame.price > 0 ? `+${frame.price} FCFA` : 'Gratuit'}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Étape 5 : Détails et prix */}
      {step === 5 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-6 w-6 text-purple-600" />
            Détails et prix de vente
          </h3>

          {/* Résumé de la configuration */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Résumé de votre configuration
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Design:</span>
                <span className="ml-2 font-medium">{selectedDesign?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Format:</span>
                <span className="ml-2 font-medium">{currentFormat?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Finition:</span>
                <span className="ml-2 font-medium">{currentFinish?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Cadre:</span>
                <span className="ml-2 font-medium">{currentFrame?.name}</span>
              </div>
            </div>
          </div>

          {/* Nom du poster */}
          <div>
            <Label htmlFor="posterName" className="text-sm font-medium text-gray-700 mb-2">
              Nom du poster *
            </Label>
            <Input
              id="posterName"
              value={posterName}
              onChange={(e) => setPosterName(e.target.value)}
              placeholder="Ex: Sunset Paradise - Poster A3"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="posterDescription" className="text-sm font-medium text-gray-700 mb-2">
              Description (optionnelle)
            </Label>
            <Textarea
              id="posterDescription"
              value={posterDescription}
              onChange={(e) => setPosterDescription(e.target.value)}
              placeholder="Décrivez votre poster..."
              className="w-full min-h-[100px]"
            />
          </div>

          {/* Prix et stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="posterPrice" className="text-sm font-medium text-gray-700 mb-2">
                Prix de vente (FCFA) *
              </Label>
              <Input
                id="posterPrice"
                type="number"
                value={posterPrice}
                onChange={(e) => setPosterPrice(Number(e.target.value))}
                min="100"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Prix suggéré: {posterPrice} FCFA
              </p>
            </div>

            <div>
              <Label htmlFor="stockQuantity" className="text-sm font-medium text-gray-700 mb-2">
                Stock initial
              </Label>
              <Input
                id="stockQuantity"
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                min="1"
                className="w-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Boutons de navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
            >
              Précédent
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Annuler
          </Button>

          {step < 5 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedDesignId}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !posterName.trim() || posterPrice < 100}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Créer le poster
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
