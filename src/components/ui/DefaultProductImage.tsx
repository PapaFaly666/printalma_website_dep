import React from 'react';
import { Package } from 'lucide-react';

interface DefaultProductImageProps {
  className?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const DefaultProductImage: React.FC<DefaultProductImageProps> = ({
  className = '',
  alt = 'Image non disponible',
  size = 'md',
  showText = true
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <img
        src="/images/placeholder.jpg"
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Si l'image placeholder échoue, afficher l'icône
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                  <svg class="${iconSizes[size]} text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                  ${showText ? `<p class="text-xs text-gray-500 mt-1 hidden sm:block">${alt}</p>` : ''}
                </div>
              </div>
            `;
          }
        }}
      />
    </div>
  );
};

export default DefaultProductImage;
