import React, { useState } from 'react';

interface ColorDisplayProps {
  colorName?: string;
  colorHexCode?: string;
  colorImageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ColorDisplay = ({ 
  colorName, 
  colorHexCode, 
  colorImageUrl, 
  size = 'md',
  showLabel = true 
}: ColorDisplayProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (!colorName && !colorHexCode) {
    return null;
  }

  return (
    <div className="flex items-center">
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
        <span className="flex items-center">
          {colorHexCode && (
            <span 
              className={`${dotSizeClasses[size]} rounded-full mr-1.5 border border-gray-300`}
              style={{ backgroundColor: colorHexCode }}
              title={`Couleur: ${colorName}`}
            ></span>
          )}
          {showLabel && `Couleur: ${colorName}`}
        </span>
      </span>
      
      {colorImageUrl && (
        <div className="flex items-center ml-2">
          <div className="relative">
            <img 
              src={colorImageUrl}
              alt={`Aperçu couleur ${colorName}`}
              className={`${sizeClasses[size]} object-cover rounded border-2 border-gray-300 shadow-sm transition-opacity`}
              style={{ 
                backgroundColor: '#f3f4f6',
                opacity: imageLoaded ? 1 : 0.5
              }}
              onError={() => {
                console.error('❌ Erreur chargement image couleur:', colorImageUrl);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('✅ Image couleur chargée:', colorImageUrl);
                setImageLoaded(true);
              }}
              title={`Aperçu couleur: ${colorName}`}
            />
            {imageError && (
              <div 
                className={`${sizeClasses[size]} absolute inset-0 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center`}
                title="Image non disponible"
              >
                <span className="text-xs text-gray-400">?</span>
              </div>
            )}
          </div>
          <span className="ml-1 text-xs text-gray-400">
            Aperçu
          </span>
        </div>
      )}
    </div>
  );
}; 