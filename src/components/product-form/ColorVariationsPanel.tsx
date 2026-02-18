import React, { useRef, useState } from 'react';
import { Plus, X, Upload, Palette, ImageIcon, Trash2, AlertCircle, Sparkles, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { AdminButton } from '../admin/AdminButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ColorVariation, ProductImage } from '../../types/product';
import { resizeImage } from '../../utils/imageResizer';
import { toast } from 'sonner';

interface ColorVariationsPanelProps {
  colorVariations: ColorVariation[];
  onAddColorVariation: () => string;
  onUpdateColorVariation: (colorId: string, updates: Partial<ColorVariation>) => void;
  onRemoveColorVariation: (colorId: string) => void;
  onAddImageToColor: (colorId: string, file: File, colorName: string) => string | Promise<string>;
  onUpdateImage: (colorId: string, imageId: string, updates: Partial<ProductImage>) => void;
  onReplaceImage?: (colorId: string, imageId: string, file: File) => Promise<void>;
  onSuggestedPriceChange?: (price: number) => void;
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE' | 'AUTOCOLLANT' | 'TABLEAU';
  suggestedPrice?: number;
}

const VIEW_OPTIONS = [
  { value: 'Front', label: 'Face avant' },
  { value: 'Back', label: 'Face arrière' },
  { value: 'Left', label: 'Côté gauche' },
  { value: 'Right', label: 'Côté droit' },
  { value: 'Top', label: 'Dessus' },
  { value: 'Bottom', label: 'Dessous' },
  { value: 'Detail', label: 'Détail' },
] as const;

// Palette de couleurs prédéfinies pour simplifier la sélection
const PRESET_COLORS = [
  { name: 'Blanc', code: '#FFFFFF' },
  { name: 'Noir', code: '#000000' },
  { name: 'Gris', code: '#808080' },
  { name: 'Rouge', code: '#FF0000' },
  { name: 'Bleu', code: '#0000FF' },
  { name: 'Vert', code: '#008000' },
  { name: 'Jaune', code: '#FFFF00' },
  { name: 'Orange', code: '#FFA500' },
  { name: 'Violet', code: '#800080' },
  { name: 'Rose', code: '#FFC0CB' },
  { name: 'Marron', code: '#964B00' },
  { name: 'Beige', code: '#F5F5DC' },
  { name: 'Bleu marine', code: '#000080' },
  { name: 'Bleu ciel', code: '#87CEEB' },
  { name: 'Vert forêt', code: '#228B22' },
];

export const ColorVariationsPanel: React.FC<ColorVariationsPanelProps> = ({
  colorVariations,
  onAddColorVariation,
  onUpdateColorVariation,
  onRemoveColorVariation,
  onAddImageToColor,
  onUpdateImage,
  onReplaceImage,
  onSuggestedPriceChange,
  genre,
  suggestedPrice,
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const replaceInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [selectedPresetColors, setSelectedPresetColors] = useState<string[]>([]);
  const quickAddInputRef = useRef<HTMLInputElement>(null);

  // États pour la galerie d'images uploadées
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: string;
    url: string;
    file: File;
    name: string;
  }>>([]);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [dropZoneActive, setDropZoneActive] = useState(false);

  const handleImageUpload = async (colorId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Vérifier que le nom de la couleur est rempli
      const color = colorVariations.find(c => c.id === colorId);
      if (!color || !color.name.trim()) {
        toast.error('⚠️ Le nom de la couleur est obligatoire avant d\'ajouter des images');
        event.target.value = '';
        return;
      }

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        try {
          const resizedFile = await resizeImage(file);
          onAddImageToColor(colorId, resizedFile, color.name);
        } catch (err) {
          console.error('Erreur de redimensionnement', err);
        }
      }
    }
    if (fileInputRefs.current[colorId]) {
      fileInputRefs.current[colorId]!.value = '';
    }
  };

  const handleViewChange = (colorId: string, imageId: string, view: ProductImage['view']) => {
    onUpdateImage(colorId, imageId, { view });
  };

  const handleColorChange = (colorId: string, colorCode: string) => {
    onUpdateColorVariation(colorId, { colorCode });
  };

  const handleNameChange = (colorId: string, name: string) => {
    onUpdateColorVariation(colorId, { name });
  };

  const removeImageFromColor = (colorId: string, imageId: string) => {
    const color = colorVariations.find(c => c.id === colorId);
    if (color) {
      const updatedImages = color.images.filter(img => img.id !== imageId);
      onUpdateColorVariation(colorId, { images: updatedImages });
    }
  };

  const handleReplaceImage = async (colorId: string, imageId: string, file: File) => {
    // Vérifier que le nom de la couleur est rempli
    const color = colorVariations.find(c => c.id === colorId);
    if (!color || !color.name.trim()) {
      toast.error('⚠️ Le nom de la couleur est obligatoire avant de remplacer des images');
      return;
    }

    if (onReplaceImage) {
      await onReplaceImage(colorId, imageId, file);
    }
  };

  // Fonction pour ajouter rapidement plusieurs couleurs prédéfinies
  const handleQuickAddColors = () => {
    const colorsToAdd = PRESET_COLORS.filter(
      preset => selectedPresetColors.includes(preset.code) &&
      !colorVariations.some(existing => existing.colorCode === preset.code)
    );

    if (colorsToAdd.length === 0) {
      toast.info('Aucune nouvelle couleur à ajouter');
      return;
    }

    colorsToAdd.forEach(preset => {
      const newColorId = onAddColorVariation();
      onUpdateColorVariation(newColorId, {
        name: preset.name,
        colorCode: preset.code
      });
    });

    toast.success(`${colorsToAdd.length} couleur(s) ajoutée(s) avec succès`);
    setSelectedPresetColors([]);
    setQuickAddMode(false);
  };

  // Fonction pour dupliquer une couleur avec ses images
  const handleDuplicateColor = (color: ColorVariation) => {
    const newColorId = onAddColorVariation();
    const newName = `${color.name} (copie)`;

    onUpdateColorVariation(newColorId, {
      name: newName,
      colorCode: color.colorCode,
      images: [] // Ne pas copier les images pour éviter les doublons
    });

    toast.success(`Couleur "${newName}" ajoutée`);
  };

  // Fonction pour uploader des images dans la galerie temporaire
  const handleImagesToGallery = async (files: FileList | null) => {
    if (!files) return;

    const newImages: typeof uploadedImages = [];
    let loadedCount = 0;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      try {
        // Créer un aperçu sans redimensionner pour l'instant
        const url = URL.createObjectURL(file);
        newImages.push({
          id: `img_${Date.now()}_${Math.random()}`,
          url,
          file,
          name: file.name
        });
        loadedCount++;
      } catch (err) {
        console.error('Erreur de traitement du fichier:', err);
      }
    }

    if (loadedCount > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
      setShowImageGallery(true);
      toast.success(`${loadedCount} image(s) uploadée(s) dans la galerie`);
    }
  };

  // Fonction pour gérer le drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    await handleImagesToGallery(e.dataTransfer.files);
  };

  // Fonction pour assigner les images sélectionnées à une couleur
  const assignImagesToColor = async (colorId: string, colorName: string) => {
    if (selectedImages.size === 0) {
      toast.error('Sélectionnez d\'abord des images à assigner');
      return;
    }

    const imagesToAssign = uploadedImages.filter(img => selectedImages.has(img.id));
    let assignedCount = 0;

    for (const image of imagesToAssign) {
      try {
        const resizedFile = await resizeImage(image.file);
        await onAddImageToColor(colorId, resizedFile, colorName);
        assignedCount++;
      } catch (err) {
        console.error('Erreur lors de l\'assignation:', err);
      }
    }

    if (assignedCount > 0) {
      toast.success(`${assignedCount} image(s) assignée(s) à ${colorName}`);
      // Retirer les images assignées de la galerie
      setUploadedImages(prev => prev.filter(img => !selectedImages.has(img.id)));
      setSelectedImages(new Set());
    }
  };

  // Fonction pour supprimer des images de la galerie
  const removeImagesFromGallery = () => {
    if (selectedImages.size === 0) {
      toast.error('Sélectionnez d\'abord des images à supprimer');
      return;
    }

    // Libérer les URLs blob
    selectedImages.forEach(imgId => {
      const img = uploadedImages.find(i => i.id === imgId);
      if (img) {
        URL.revokeObjectURL(img.url);
      }
    });

    setUploadedImages(prev => prev.filter(img => !selectedImages.has(img.id)));
    setSelectedImages(new Set());
    toast.success('Image(s) supprimée(s) de la galerie');
  };

  // Fonction pour gérer la sélection d'images
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  // Fonction pour sélectionner/désélectionner toutes les images
  const selectAllImages = () => {
    if (selectedImages.size === uploadedImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(uploadedImages.map(img => img.id)));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Variations de couleur
            </CardTitle>
            <div className="flex gap-2">
              <AdminButton
                onClick={() => setQuickAddMode(!quickAddMode)}
                size="sm"
                variant="outline"
              >
                <Sparkles className="h-4 w-4" />
                <span>Ajout rapide</span>
              </AdminButton>
              <AdminButton onClick={onAddColorVariation} size="sm" variant="primary">
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </AdminButton>
            </div>
          </div>
        </CardHeader>

        {/* Mode d'ajout rapide */}
        {quickAddMode && (
          <CardContent className="border-t border-gray-200 bg-[rgb(20,104,154)]/5">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[rgb(16,83,123)] flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Ajout rapide de couleurs
              </h3>

              {/* Palette de couleurs prédéfinies */}
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {PRESET_COLORS.map((preset) => {
                  const isSelected = selectedPresetColors.includes(preset.code);
                  const isAlreadyAdded = colorVariations.some(c => c.colorCode === preset.code);

                  return (
                    <button
                      key={preset.code}
                      onClick={() => {
                        if (isAlreadyAdded) return;
                        if (isSelected) {
                          setSelectedPresetColors(prev => prev.filter(code => code !== preset.code));
                        } else {
                          setSelectedPresetColors(prev => [...prev, preset.code]);
                        }
                      }}
                      disabled={isAlreadyAdded}
                      className={`relative w-10 h-10 rounded-lg border-2 transition-all ${
                        isAlreadyAdded
                          ? 'opacity-50 cursor-not-allowed border-gray-300'
                          : isSelected
                            ? 'border-[rgb(20,104,154)] scale-110 shadow-md'
                            : 'border-gray-300 hover:border-[rgb(20,104,154)]/70 hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.code }}
                      title={`${preset.name} ${isAlreadyAdded ? '(déjà ajoutée)' : ''}`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[rgb(20,104,154)]/50/20 rounded-lg">
                          <div className="w-2 h-2 bg-[rgb(16,83,123)] rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions rapides */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-[rgb(20,104,154)]">
                  {selectedPresetColors.length} couleur(s) sélectionnée(s)
                </p>
                <div className="flex gap-2">
                  <AdminButton
                    onClick={() => setSelectedPresetColors([])}
                    size="sm"
                    variant="outline"
                  >
                    <span>Effacer</span>
                  </AdminButton>
                  <AdminButton
                    onClick={handleQuickAddColors}
                    size="sm"
                    disabled={selectedPresetColors.length === 0}
                    variant="primary"
                  >
                    <span>Ajouter les couleurs</span>
                  </AdminButton>
                </div>
              </div>
            </div>
          </CardContent>
        )}
        <CardContent className="space-y-6">
          {/* Galerie d'images uploadées */}
          <div className="p-4 bg-[rgb(20,104,154)]/5 border border-[rgb(20,104,154)]/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[rgb(16,83,123)] flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Galerie d'images ({uploadedImages.length})
              </h3>
              <div className="flex gap-2">
                <AdminButton
                  onClick={() => setShowImageGallery(!showImageGallery)}
                  size="sm"
                  variant="outline"
                  className="text-[rgb(20,104,154)] border-[rgb(20,104,154)]"
                >
                  {showImageGallery ? 'Masquer' : 'Voir'} la galerie
                </AdminButton>
                <input
                  ref={quickAddInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImagesToGallery(e.target.files)}
                  className="hidden"
                />
                <AdminButton
                  onClick={() => quickAddInputRef.current?.click()}
                  size="sm"
                  className="bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Ajouter des images
                </AdminButton>
              </div>
            </div>

            <p className="text-xs text-[rgb(20,104,154)] mb-3">
              Uploadez plusieurs images puis assignez-les aux couleurs de votre choix
            </p>

            {/* Zone de drag & drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                dropZoneActive
                  ? 'border-[rgb(20,104,154)] bg-[rgb(20,104,154)]/10'
                  : 'border-[rgb(20,104,154)]/50 hover:border-[rgb(20,104,154)]/70'
              }`}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-[rgb(20,104,154)]" />
              <p className="text-sm text-[rgb(20,104,154)]">
                Glissez-déposez vos images ici ou cliquez sur "Ajouter des images"
              </p>
            </div>

            {/* Galerie d'images */}
            {showImageGallery && uploadedImages.length > 0 && (
              <div className="mt-4 space-y-3">
                {/* Barre d'actions */}
                <div className="flex items-center justify-between p-3 bg-[rgb(20,104,154)]/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedImages.size === uploadedImages.length && uploadedImages.length > 0}
                        onChange={selectAllImages}
                        className="rounded"
                      />
                      <span className="text-sm text-[rgb(16,83,123)]">
                        Tout sélectionner ({selectedImages.size})
                      </span>
                    </label>
                  </div>
                  <AdminButton
                    onClick={removeImagesFromGallery}
                    size="sm"
                    variant="ghost"
                    disabled={selectedImages.size === 0}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Supprimer la sélection
                  </AdminButton>
                </div>

                {/* Grille d'images */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-3 bg-white rounded-lg">
                  {uploadedImages.map((image) => (
                    <div
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImages.has(image.id)
                          ? 'border-[rgb(20,104,154)] shadow-md'
                          : 'border-gray-200 hover:border-[rgb(20,104,154)]/50'
                      }`}
                      onClick={() => toggleImageSelection(image.id)}
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Checkbox de sélection */}
                      <div className="absolute top-1 left-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedImages.has(image.id)
                            ? 'bg-[rgb(20,104,154)]/50 border-[rgb(20,104,154)]'
                            : 'bg-white border-gray-300'
                        }`}>
                          {selectedImages.has(image.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Info au survol */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions d'assignation */}
            {uploadedImages.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  💡 Sélectionnez des images dans la galerie, puis utilisez le bouton "Assigner" sur chaque couleur ci-dessous
                </p>
              </div>
            )}
          </div>

          {colorVariations.map((color) => {
            const hasValidName = color.name && color.name.trim().length > 0;
            
            return (
            <div
              key={color.id}
              className="p-4 border border-gray-200 rounded-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: color.colorCode }}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={color.colorCode}
                      onChange={(e) => handleColorChange(color.id, e.target.value)}
                      className="w-12 h-8 p-0 border-0 rounded cursor-pointer"
                    />
                      <div className="relative">
                    <Input
                      value={color.name}
                      onChange={(e) => handleNameChange(color.id, e.target.value)}
                          placeholder="Nom de la couleur *"
                          className={`w-40 ${!hasValidName ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                        {!hasValidName && (
                          <div className="absolute -bottom-6 left-0 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Nom obligatoire
                          </div>
                        )}
                      </div>
                      {(genre === 'AUTOCOLLANT' || genre === 'TABLEAU') && (
                        <div className="relative">
                          <Input
                            type="number"
                            value={color.price ?? suggestedPrice ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : Number(e.target.value);
                              onUpdateColorVariation(color.id, { price: value });
                            }}
                            placeholder="Prix (FCFA)"
                            className="w-32"
                            min="0"
                            step="100"
                          />
                          <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                            Prix pour cette couleur
                          </div>
                        </div>
                      )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <AdminButton
                    onClick={() => handleDuplicateColor(color)}
                    size="sm"
                    variant="ghost"
                    className="text-[rgb(20,104,154)] hover:text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)]/5"
                    title="Dupliquer cette couleur"
                  >
                    <Copy className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    onClick={() => onRemoveColorVariation(color.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </AdminButton>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Images ({color.images.length})
                  </p>
                  <div className="flex gap-2">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[color.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(color.id, e)}
                      className="hidden"
                    />
                    <AdminButton
                      onClick={() => fileInputRefs.current[color.id]?.click()}
                      size="sm"
                      variant="outline"
                        disabled={!hasValidName}
                        title={!hasValidName ? "Le nom de la couleur est obligatoire" : "Ajouter des images"}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Ajouter images
                    </AdminButton>
                    {uploadedImages.length > 0 && hasValidName && (
                      <AdminButton
                        onClick={() => assignImagesToColor(color.id, color.name)}
                        size="sm"
                        disabled={selectedImages.size === 0}
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50 disabled:opacity-50"
                        title={
                          selectedImages.size === 0
                            ? "Sélectionnez d'abord des images dans la galerie"
                            : `Assigner ${selectedImages.size} image(s) à ${color.name}`
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Assigner ({selectedImages.size})
                      </AdminButton>
                    )}
                  </div>
                </div>

                  {!hasValidName && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Nom de couleur requis</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Vous devez définir un nom pour cette couleur avant de pouvoir ajouter des images.
                      </p>
                    </div>
                  )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {color.images.map((image) => (
                    <div key={image.id} className="space-y-2">
                      <div className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={image.url}
                            alt={`Variation ${color.name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <AdminButton
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-7 w-7 bg-black/50 text-white hover:bg-black/70 z-10"
                          onClick={() => removeImageFromColor(color.id, image.id)}
                        >
                          <X className="h-4 w-4" />
                        </AdminButton>
                        {/* Bouton remplacer l'image */}
                        <input
                          ref={el => {
                            if (!replaceInputRefs.current) replaceInputRefs.current = {};
                            replaceInputRefs.current[`${color.id}_${image.id}`] = el;
                          }}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                await handleReplaceImage(color.id, image.id, e.target.files[0]);
                              e.target.value = '';
                            }
                          }}
                        />
                        <AdminButton
                          variant="outline"
                          size="icon"
                          className="absolute bottom-1 right-1 h-7 w-7 bg-white/80 text-gray-700 hover:bg-gray-200 z-10"
                          title="Remplacer l'image"
                          onClick={() => replaceInputRefs.current[`${color.id}_${image.id}`]?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </AdminButton>
                      </div>
                      <Select
                        value={image.view}
                        onValueChange={(value: ProductImage['view']) => handleViewChange(color.id, image.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une vue..." />
                        </SelectTrigger>
                        <SelectContent>
                          {VIEW_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};