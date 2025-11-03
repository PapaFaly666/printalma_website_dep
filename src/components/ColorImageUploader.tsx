import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { UPLOAD_CONFIG } from '../config/api';

interface ColorImageUploaderProps {
  productId: number;
  colorId: number;
  onImageUploaded: (image: any) => void;
  disabled?: boolean;
}

export function ColorImageUploader({ productId, colorId, onImageUploaded, disabled = false }: ColorImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImageDirect = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Validation du fichier
      if (!UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Format d\'image non supporté. Utilisez JPG, PNG, GIF, WEBP ou SVG.');
      }

      if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`L'image est trop volumineuse. Taille maximum: ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      }

      console.log(`🚀 [ColorImageUploader] Upload direct image couleur ${colorId}...`);

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://printalma-back-dep.onrender.com/products/upload-color-image/${productId}/${colorId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'upload de l\'image');
      }

      const result = await response.json();

      if (result.success && result.image) {
        console.log(`✅ [ColorImageUploader] Image couleur ${colorId} uploadée directement:`, result.image.url);
        
        // ✅ Notifier le parent avec l'image uploadée
        onImageUploaded(result.image);
        
        toast.success('Image couleur uploadée avec succès', {
          duration: 2000
        });

        return result;
      } else {
        throw new Error(result.message || 'Erreur lors de l\'upload de l\'image');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`❌ [ColorImageUploader] Erreur upload image couleur ${colorId}:`, error);
      setUploadError(errorMessage);
      toast.error(`Erreur lors de l'upload: ${errorMessage}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [productId, colorId, onImageUploaded]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadImageDirect(file);
    } catch (error) {
      console.error('Erreur upload:', error);
    }
  }, [uploadImageDirect]);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    
    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    
    try {
      await uploadImageDirect(file);
    } catch (error) {
      console.error('Erreur upload:', error);
    }
  }, [uploadImageDirect]);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="color-image-uploader">
      <div 
        className={`
          upload-area border-2 border-dashed rounded-lg p-6 text-center transition-all
          ${isUploading || disabled 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 cursor-pointer'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          accept={UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={isUploading || disabled}
          id={`color-image-${colorId}`}
          className="hidden"
        />
        
        <label 
          htmlFor={`color-image-${colorId}`}
          className={`
            flex flex-col items-center gap-2 cursor-pointer
            ${isUploading || disabled ? 'cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Upload en cours...</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {disabled ? 'Upload désactivé' : 'Glissez-déposez une image ou cliquez pour sélectionner'}
              </span>
              <span className="text-xs text-gray-500">
                JPG, PNG, WEBP, SVG - Max {UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB
              </span>
            </>
          )}
        </label>
      </div>

      {uploadError && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{uploadError}</span>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Upload en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorImageUploader; 