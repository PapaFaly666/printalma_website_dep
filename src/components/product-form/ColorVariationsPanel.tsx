import React, { useRef, useState } from 'react';
import { Plus, X, Upload, Palette, ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
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

export const ColorVariationsPanel: React.FC<ColorVariationsPanelProps> = ({
  colorVariations,
  onAddColorVariation,
  onUpdateColorVariation,
  onRemoveColorVariation,
  onAddImageToColor,
  onUpdateImage,
  onReplaceImage,
  onSuggestedPriceChange,
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const replaceInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Variations de couleur
          </CardTitle>
          <Button onClick={onAddColorVariation} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter couleur
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {colorVariations.map((color) => {
            const hasValidName = color.name && color.name.trim().length > 0;
            
            return (
            <div
              key={color.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
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
                  </div>
                </div>
                <Button
                  onClick={() => onRemoveColorVariation(color.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    <Button
                      onClick={() => fileInputRefs.current[color.id]?.click()}
                      size="sm"
                      variant="outline"
                        disabled={!hasValidName}
                        title={!hasValidName ? "Le nom de la couleur est obligatoire" : "Ajouter des images"}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Ajouter images
                    </Button>
                  </div>
                </div>

                  {!hasValidName && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Nom de couleur requis</span>
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Vous devez définir un nom pour cette couleur avant de pouvoir ajouter des images.
                      </p>
                    </div>
                  )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {color.images.map((image) => (
                    <div key={image.id} className="space-y-2">
                      <div className="relative group">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                          <img
                            src={image.url}
                            alt={`Variation ${color.name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-7 w-7 bg-black/50 text-white hover:bg-black/70 z-10"
                          onClick={() => removeImageFromColor(color.id, image.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute bottom-1 right-1 h-7 w-7 bg-white/80 text-gray-700 hover:bg-gray-200 z-10"
                          title="Remplacer l'image"
                          onClick={() => replaceInputRefs.current[`${color.id}_${image.id}`]?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
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