import React, { useState, useRef, useCallback } from 'react';
import { useVendorDesignProduct } from '../../hooks/useVendorDesignProduct';
import { VendorDesignProductStatus, VendorDesignProductResponse } from '../../types/vendorDesignProduct';

interface VendorDesignProductCreatorProps {
  productId: number;
  onSuccess?: (designProduct: any) => void;
  onCancel?: () => void;
  editingProduct?: VendorDesignProductResponse | null;
  className?: string;
}

export const VendorDesignProductCreator: React.FC<VendorDesignProductCreatorProps> = ({
  productId,
  onSuccess,
  onCancel,
  editingProduct,
  className = '',
}) => {
  const { createCompleteDesignProduct, updateDesignProduct, loading, error, uploadProgress, clearError } = useVendorDesignProduct();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(editingProduct?.designUrl || null);
  const [dragOver, setDragOver] = useState(false);
  const [transformations, setTransformations] = useState({
    positionX: editingProduct?.positionX || 0.5,
    positionY: editingProduct?.positionY || 0.5,
    scale: editingProduct?.scale || 1.0,
    rotation: editingProduct?.rotation || 0,
    name: editingProduct?.name || '',
    description: editingProduct?.description || '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isEditMode = !!editingProduct;

  // Validation du fichier
  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      return 'Le fichier ne doit pas dépasser 10MB';
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Format non supporté. Utilisez JPG, PNG, GIF ou WebP';
    }
    
    return null;
  }, []);

  // Gestion du fichier
  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      alert(validationError);
      return;
    }
    
    setFile(selectedFile);
    
    // Créer une URL de preview
    if (previewUrl && !isEditMode) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    
    // Nettoyer l'erreur précédente
    clearError();
  }, [validateFile, previewUrl, isEditMode, clearError]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  // Gestion du drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  // Gestion des transformations
  const handleTransformationChange = useCallback((field: string, value: string | number) => {
    setTransformations(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Réinitialiser les transformations
  const resetTransformations = useCallback(() => {
    setTransformations({
      positionX: 0.5,
      positionY: 0.5,
      scale: 1.0,
      rotation: 0,
      name: '',
      description: '',
    });
  }, []);

  // Soumission du formulaire
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditMode && !file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditMode) {
        // Mode édition - mise à jour
        const updatedDesignProduct = await updateDesignProduct(editingProduct.id, {
          ...transformations,
          // Si un nouveau fichier est sélectionné, il faudra d'abord l'uploader
          // Pour l'instant, on ne change que les transformations et métadonnées
        });
        
        onSuccess?.(updatedDesignProduct);
      } else {
        // Mode création
        const designProduct = await createCompleteDesignProduct(
          file!,
          productId,
          transformations,
          VendorDesignProductStatus.DRAFT
        );
        
        // Nettoyer le formulaire
        setFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        resetTransformations();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        onSuccess?.(designProduct);
      }
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditMode, file, editingProduct, updateDesignProduct, transformations, createCompleteDesignProduct, productId, onSuccess, previewUrl, resetTransformations]);

  // Nettoyage de la preview URL
  React.useEffect(() => {
    return () => {
      if (previewUrl && !isEditMode) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, isEditMode]);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Modifier le Design-Produit' : 'Créer un Design-Produit'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de fichier */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Design (Image) {!isEditMode && '*'} <span className="text-gray-500">(Max 10MB)</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Changer de fichier
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-gray-500">
                  {isEditMode 
                    ? 'Glissez-déposez une nouvelle image ici pour remplacer ou'
                    : 'Glissez-déposez votre image ici ou'
                  }
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  {isEditMode ? 'Changer l\'image' : 'Sélectionner un fichier'}
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Preview interactif du design */}
        {previewUrl && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Aperçu du Design avec Transformations
            </label>
            <div className="relative bg-gray-100 rounded-lg p-4 overflow-hidden min-h-[300px] flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-[250px] max-h-[250px] object-contain transition-transform duration-200"
                style={{
                  transform: `translate(${(transformations.positionX - 0.5) * 200}px, ${(transformations.positionY - 0.5) * 200}px) scale(${transformations.scale}) rotate(${transformations.rotation}deg)`,
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Live Preview
              </div>
            </div>
          </div>
        )}

        {/* Contrôles de transformation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-700">Transformations</h3>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={resetTransformations}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                🔄 Réinitialiser
              </button>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAdvanced ? 'Masquer' : 'Afficher'} les détails
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Position X */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position X {showAdvanced && `(${Math.round(transformations.positionX * 100)}%)`}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transformations.positionX}
                onChange={(e) => handleTransformationChange('positionX', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              {showAdvanced && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Gauche</span>
                  <span>Centre</span>
                  <span>Droite</span>
                </div>
              )}
            </div>

            {/* Position Y */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Y {showAdvanced && `(${Math.round(transformations.positionY * 100)}%)`}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transformations.positionY}
                onChange={(e) => handleTransformationChange('positionY', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              {showAdvanced && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Haut</span>
                  <span>Centre</span>
                  <span>Bas</span>
                </div>
              )}
            </div>

            {/* Échelle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Échelle {showAdvanced && `(${Math.round(transformations.scale * 100)}%)`}
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={transformations.scale}
                onChange={(e) => handleTransformationChange('scale', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              {showAdvanced && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              )}
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rotation {showAdvanced && `(${transformations.rotation}°)`}
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={transformations.rotation}
                onChange={(e) => handleTransformationChange('rotation', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              {showAdvanced && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0°</span>
                  <span>180°</span>
                  <span>360°</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Métadonnées */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">Informations du Design</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du design
            </label>
            <input
              type="text"
              value={transformations.name}
              onChange={(e) => handleTransformationChange('name', e.target.value)}
              placeholder="Ex: Logo d'entreprise personnalisé"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={transformations.description}
              onChange={(e) => handleTransformationChange('description', e.target.value)}
              placeholder="Décrivez votre design..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700">{error}</span>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center space-x-4 pt-4">
          <button
            type="submit"
            disabled={(!isEditMode && !file) || loading || isSubmitting}
            className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? 'Modification en cours...' : 'Création en cours...'}
              </span>
            ) : (
              isEditMode ? 'Modifier Design-Produit' : 'Créer Design-Produit'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
}; 