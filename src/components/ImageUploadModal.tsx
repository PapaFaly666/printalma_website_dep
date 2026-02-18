import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Image as ImageIcon, FileImage, Palette, Globe, Layers, Loader2 } from 'lucide-react';
import Button from './ui/Button';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (file: File, imageUrl: string) => Promise<void> | void;
}

const SUPPORTED_FORMATS = [
  { mime: 'image/jpeg', ext: 'JPG/JPEG', icon: FileImage, color: 'text-[#14689A]' },
  { mime: 'image/png', ext: 'PNG', icon: Palette, color: 'text-[#14689A]' },
  { mime: 'image/webp', ext: 'WEBP', icon: Globe, color: 'text-[#14689A]' },
  { mime: 'image/svg+xml', ext: 'SVG', icon: Layers, color: 'text-[#14689A]' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
const MIN_DPI = 100;

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose, onImageSelect }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{
    width: number;
    height: number;
    dpi: number;
    size: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const calculateDPI = (width: number, height: number, fileSize: number): number => {
    // Estimation du DPI basée sur la résolution et la taille du fichier
    // Pour une image JPEG/PNG standard, on peut estimer le DPI
    const estimatedDPI = Math.sqrt((width * height) / (fileSize / 1024)) * 10;

    // Pour les images vectorielles (SVG), retourner une valeur par défaut élevée
    return Math.round(Math.max(estimatedDPI, 72));
  };

  const validateImage = async (file: File): Promise<boolean> => {
    setValidationError(null);
    setValidationSuccess(null);

    // 1. Vérifier le format
    if (!SUPPORTED_FORMATS.some(format => format.mime === file.type)) {
      setValidationError(`Format non supporté. Formats acceptés : ${SUPPORTED_FORMATS.map(f => f.ext).join(', ')}`);
      return false;
    }

    // 2. Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setValidationError(`Fichier trop volumineux (${sizeMB} MB). Taille maximale : 5 MB`);
      return false;
    }

    // 3. Convertir le fichier en Data URL (plus stable que blob URL)
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          setValidationError('Impossible de lire le fichier');
          resolve(false);
          return;
        }

        // Charger l'image pour vérifier les dimensions et le DPI
        const img = new Image();

        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          const dpi = calculateDPI(width, height, file.size);

          // Stocker les métadonnées
          setImageMetadata({
            width,
            height,
            dpi,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
          });

          // 4. Vérifier le DPI minimum
          if (dpi < MIN_DPI && file.type !== 'image/svg+xml') {
            setValidationError(`Qualité insuffisante (${dpi} DPI estimé). Minimum requis : ${MIN_DPI} DPI`);
            resolve(false);
            return;
          }

          // 5. Validation réussie - Stocker la Data URL
          setPreviewUrl(dataUrl);
          setValidationSuccess(`✓ Image valide : ${width}x${height}px, ~${dpi} DPI, ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
          resolve(true);
        };

        img.onerror = () => {
          setValidationError('Impossible de charger l\'image. Fichier corrompu ?');
          resolve(false);
        };

        img.src = dataUrl;
      };

      reader.onerror = () => {
        setValidationError('Erreur lors de la lecture du fichier');
        resolve(false);
      };

      // Lire le fichier comme Data URL
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    // Réinitialiser l'état
    setPreviewUrl(null);
    setSelectedFile(file);

    const isValid = await validateImage(file);

    if (!isValid) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageMetadata(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConfirm = async () => {
    if (selectedFile && previewUrl) {
      try {
        setIsUploading(true);

        // ✅ Appeler la fonction parent (peut être async)
        await onImageSelect(selectedFile, previewUrl);

        // Nettoyer le state local
        setSelectedFile(null);
        setPreviewUrl(null);
        setValidationError(null);
        setValidationSuccess(null);
        setImageMetadata(null);
        setIsDragging(false);
        setIsUploading(false);
        onClose();
      } catch (error) {
        console.error('Erreur upload:', error);
        setIsUploading(false);
        setValidationError('Erreur lors de l\'upload. Veuillez réessayer.');
      }
    }
  };

  const handleClose = () => {
    // Nettoyer tous les états (pas besoin de révoquer les Data URLs)
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    setValidationSuccess(null);
    setImageMetadata(null);
    setIsDragging(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* 🆕 Overlay de chargement */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-[#14689A] animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload en cours...</h3>
              <p className="text-sm text-gray-600">Veuillez patienter pendant l'upload de votre image</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="sticky top-0 bg-[#14689A] border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Importer une image</h2>
              <p className="text-sm text-white/80">Formats acceptés : JPG, PNG, WEBP, SVG</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contraintes */}
          <div className="bg-[#14689A]/10 border border-[#14689A]/30 rounded-lg p-4">
            <h3 className="font-semibold text-[#14689A] mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Contraintes requises
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Taille maximale : <strong>5 MB</strong></li>
              <li>• Résolution minimale : <strong>100 DPI</strong></li>
              <li>• Formats : JPG, PNG, WEBP, SVG</li>
            </ul>
          </div>

          {/* Formats supportés */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Formats supportés</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SUPPORTED_FORMATS.map((format) => {
                const IconComponent = format.icon;
                return (
                  <div
                    key={format.mime}
                    className="bg-white border-2 border-gray-200 rounded-lg p-3 text-center hover:border-[#14689A] hover:bg-[#14689A]/5 transition-all"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <IconComponent className={`w-8 h-8 ${format.color}`} />
                    </div>
                    <div className="text-xs font-semibold text-gray-700">{format.ext}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zone de drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-[#14689A] bg-[#14689A]/10'
                : 'border-gray-300 hover:border-[#14689A]/50'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isDragging
                  ? 'bg-[#14689A] text-white'
                  : 'bg-gray-100 text-[#14689A]'
              }`}>
                <ImageIcon className="w-8 h-8" />
              </div>

              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  Glissez-déposez votre image ici
                </p>
                <p className="text-sm text-gray-600 mb-4">ou</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mx-auto border-[#14689A] text-[#14689A] hover:bg-[#14689A]/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Parcourir les fichiers
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SUPPORTED_FORMATS.map(f => f.mime).join(',')}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Validation échouée</h4>
                <p className="text-sm text-red-800">{validationError}</p>
              </div>
            </div>
          )}

          {/* Validation Success + Preview */}
          {validationSuccess && previewUrl && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Image validée</h4>
                  <p className="text-sm text-green-700">{validationSuccess}</p>
                </div>
              </div>

              {/* Métadonnées */}
              {imageMetadata && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Informations de l'image</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Dimensions :</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {imageMetadata.width} x {imageMetadata.height} px
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">DPI estimé :</span>
                      <span className="ml-2 font-semibold text-gray-900">~{imageMetadata.dpi}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Taille :</span>
                      <span className="ml-2 font-semibold text-gray-900">{imageMetadata.size}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Format :</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {SUPPORTED_FORMATS.find(f => f.mime === selectedFile?.type)?.ext}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Aperçu</h4>
                <div className="flex items-center justify-center bg-white rounded-lg p-4 min-h-[200px]">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 object-contain rounded-lg shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={isUploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedFile || !previewUrl || !!validationError || isUploading}
            className="bg-[#14689A] hover:bg-[#14689A]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer et ajouter
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
