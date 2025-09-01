import React from 'react';
import { Check } from 'lucide-react';

interface Color {
  id: number;
  name: string;
  hexCode?: string;
  imageUrl?: string;
}

interface ColorSelectorProps {
  colors: Color[];
  selectedColorId?: number;
  onColorSelect: (color: Color) => void;
  className?: string;
  showImages?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colors,
  selectedColorId,
  onColorSelect,
  className = '',
  showImages = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const imageClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`color-selector ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {colors.map(color => (
          <div 
            key={color.id}
            className={`
              color-option cursor-pointer rounded-lg border-2 p-2 transition-all duration-200 hover:shadow-md
              ${selectedColorId === color.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => onColorSelect(color)}
          >
            {/* Image de couleur ou swatch */}
            <div className="relative flex justify-center mb-2">
              {showImages && color.imageUrl ? (
                <img 
                  src={color.imageUrl} 
                  alt={color.name}
                  className={`${imageClasses[size]} object-cover rounded`}
                />
              ) : (
                <div 
                  className={`${sizeClasses[size]} rounded border border-gray-200`}
                  style={{ backgroundColor: color.hexCode || '#cccccc' }}
                />
              )}
              
              {/* Icône de sélection */}
              {selectedColorId === color.id && (
                <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            {/* Nom de la couleur */}
            <div className="text-center">
              <span className={`${textSizes[size]} font-medium text-gray-700 block truncate`}>
                {color.name}
              </span>
              {color.hexCode && (
                <span className="text-xs text-gray-500 block">
                  {color.hexCode}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorSelector; 