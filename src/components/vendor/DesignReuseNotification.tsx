import React from 'react';
import { X, Info, Recycle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface DesignReuseNotificationProps {
  isReused: boolean;
  designId?: number;
  onClose: () => void;
  className?: string;
}

export const DesignReuseNotification: React.FC<DesignReuseNotificationProps> = ({ 
  isReused, 
  designId, 
  onClose, 
  className = "" 
}) => {
  if (!isReused) return null;

  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <div className="flex items-start">
        <Recycle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800">
              Design existant réutilisé
            </h3>
            <button
              onClick={onClose}
              className="text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <AlertDescription className="text-blue-700">
            <p className="mb-2">
              Ce design existe déjà dans le système{designId && ` (ID: ${designId})`}. 
              Votre produit utilise le même design qu'un autre vendeur, 
              ce qui permet d'économiser l'espace de stockage.
            </p>
            <div className="bg-blue-100 border border-blue-200 rounded-md p-3 mt-3">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <p className="text-xs text-blue-800">
                  <strong>Avantage :</strong> Quand l'admin validera ce design, 
                  tous les produits qui l'utilisent seront mis à jour automatiquement.
                </p>
              </div>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}; 
 
 
 
 
 
 