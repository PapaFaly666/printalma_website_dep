import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileImage } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import designService from '../../services/designService';
import { DesignUploadOptions } from '../../types/product';
import { toast } from 'sonner';

interface DesignUploaderProps {
  productId: number | string;
  colorId: number | string;
  imageId: number | string;
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export const DesignUploader: React.FC<DesignUploaderProps> = ({
  productId,
  colorId,
  imageId,
  onUploadSuccess,
  onUploadError,
  className = '',
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Validation côté client
    const validation = designService.validateDesignFile(file);
    if (!validation.valid) {
      const errorMsg = validation.error || 'Fichier invalide';
      onUploadError?.(errorMsg);
      toast.error(`❌ ${errorMsg}`);
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulation du progrès (à remplacer par un vrai suivi si l'API le supporte)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const options: DesignUploadOptions = {
        name: file.name,
        replaceExisting: true
      };

      const result = await designService.uploadDesign(productId, colorId, imageId, file, options);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onUploadSuccess?.(result);
      toast.success(`✅ Design "${result.designFileName}" uploadé avec succès !`);
      
      // Reset après succès
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
      }, 2000);
      
    } catch (error: any) {
      const errorMsg = error.message || 'Erreur lors de l\'upload';
      onUploadError?.(errorMsg);
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const getUploadStateIcon = () => {
    if (uploading) {
      return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>;
    }
    if (uploadProgress === 100) {
      return <CheckCircle className="h-8 w-8 text-green-600" />;
    }
    return <Upload className="h-8 w-8 text-gray-400" />;
  };

  const getUploadStateText = () => {
    if (uploading) {
      return selectedFile ? `Upload de "${selectedFile.name}"...` : 'Upload en cours...';
    }
    if (uploadProgress === 100) {
      return 'Design uploadé avec succès !';
    }
    return 'Glissez votre design ici ou cliquez pour sélectionner';
  };

  return (
    <Card className={`design-uploader relative ${className}`}>
      <CardContent className="p-0">
        <div 
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
            ${dragOver ? 'border-gray-900 bg-gray-50 dark:bg-gray-800' : 'border-gray-300 dark:border-gray-600'}
            ${uploading ? 'border-gray-400 bg-gray-50 dark:bg-gray-800' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
            ${uploadProgress === 100 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          {/* Icône d'état */}
          <div className="mb-4 flex justify-center">
            {getUploadStateIcon()}
          </div>

          {/* Texte principal */}
          <p className="product-title mb-2 text-gray-900 dark:text-gray-100">
            {getUploadStateText()}
          </p>

          {/* Barre de progression */}
          {uploading && (
            <div className="mb-4">
              <Progress value={uploadProgress} className="w-full h-2" />
              <p className="product-meta mt-1">{uploadProgress}%</p>
            </div>
          )}

          {/* Bouton de sélection */}
          {!uploading && uploadProgress !== 100 && (
            <Button 
              type="button" 
              variant="outline"
              className="mt-4 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={disabled}
            >
              <FileImage className="h-4 w-4 mr-2" />
              Choisir un fichier
            </Button>
          )}

          {/* Informations sur les formats acceptés */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600">
              PNG
            </Badge>
            <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600">
              JPG
            </Badge>
            <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600">
              SVG
            </Badge>
          </div>
          
          <p className="product-meta mt-2">
            Taille max: 10MB
          </p>

          {/* Input file caché */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      </CardContent>
    </Card>
  );
}; 