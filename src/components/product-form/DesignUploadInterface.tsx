import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RotateCw, 
  Download,
  X,
  Plus,
  FileImage,
  Sparkles,
  Info
} from 'lucide-react';
import Button from '../ui/Button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface DesignUploadInterfaceProps {
  currentDesignUrl?: string;
  onDesignUpload: (file: File) => void;
  onDesignRemove: () => void;
  onDesignReplace: (file: File) => void;
  onExport: () => void;
  hasDelimitation: boolean;
  className?: string;
}

export const DesignUploadInterface: React.FC<DesignUploadInterfaceProps> = ({
  currentDesignUrl,
  onDesignUpload,
  onDesignRemove,
  onDesignReplace,
  onExport,
  hasDelimitation,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('La taille du fichier ne doit pas dépasser 10MB');
      return;
    }

    setIsProcessing(true);
    
    try {
      if (currentDesignUrl) {
        onDesignReplace(file);
        toast.success('Design remplacé avec succès');
      } else {
        onDesignUpload(file);
        toast.success('Design uploadé avec succès');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  const handleRemoveDesign = () => {
    onDesignRemove();
    toast.success('Design supprimé');
  };

  // Upload Zone Component
  const UploadZone = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
        ${isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
        }
        ${!hasDelimitation ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={hasDelimitation ? openFileDialog : undefined}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4 w-8 h-8 border border-current rounded-lg rotate-12" />
        <div className="absolute top-8 right-6 w-6 h-6 border border-current rounded rotate-45" />
        <div className="absolute bottom-6 left-8 w-4 h-4 border border-current rounded-full" />
        <div className="absolute bottom-4 right-4 w-10 h-10 border border-current rounded-xl -rotate-12" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex justify-center">
          <div className={`
            relative p-4 rounded-full transition-all duration-300
            ${isDragging 
              ? 'bg-blue-500 text-white scale-110' 
              : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:scale-105'
            }
          `}>
            <Upload className="h-8 w-8" />
            {isDragging && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -inset-2 border-2 border-blue-400 rounded-full"
              />
            )}
          </div>
        </div>

        

        {hasDelimitation && (
          <Button 
            onClick={openFileDialog}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            disabled={isProcessing}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isProcessing ? 'Traitement...' : 'Choisir un fichier'}
          </Button>
        )}
      </div>
    </motion.div>
  );

  // Design Preview Component
  const DesignPreview = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <Card className="overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img 
            src={currentDesignUrl} 
            alt="Design prévisualisé"
            className="w-full h-full object-contain"
          />
          
          {/* Success badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-500 text-white border-0 shadow-lg">
              <Sparkles className="h-3 w-3 mr-1" />
              Design actif
            </Badge>
          </div>

          {/* Action buttons overlay */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-300 group">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={onExport}
                className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 shadow-lg"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={openFileDialog}
                className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 shadow-lg"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemoveDesign}
                className="bg-red-500/90 backdrop-blur-sm hover:bg-red-600 shadow-lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          

          <div className="flex gap-2">
            <Button
              onClick={onExport}
              size="sm"
              variant="default"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button
              onClick={openFileDialog}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Remplacer
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        
        
        {currentDesignUrl && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            1 design actif
          </Badge>
        )}
      </div>

      {/* Main Content */}
      

      {/* Help Text for locked state */}
      {currentDesignUrl && (
        <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800 mt-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Zone de personnalisation verrouillée</p>
              <p className="text-amber-700 dark:text-amber-300">Pour la modifier, veuillez d'abord supprimer le design actif en utilisant le bouton ci-dessus.</p>
            </div>
          </div>
        </div>
      )}

      

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}; 