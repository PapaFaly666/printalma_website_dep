import React from 'react';
import { Badge } from './badge';

interface GenreBadgeProps {
  genre: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
  className?: string;
}

export const GenreBadge: React.FC<GenreBadgeProps> = ({ genre, className = '' }) => {
  const getGenreConfig = (genre: string) => {
    switch (genre) {
      case 'HOMME':
        return {
          label: 'Homme',
          className: 'bg-blue-500 hover:bg-blue-600 text-white'
        };
      case 'FEMME':
        return {
          label: 'Femme',
          className: 'bg-pink-500 hover:bg-pink-600 text-white'
        };
      case 'BEBE':
        return {
          label: 'Bébé',
          className: 'bg-orange-500 hover:bg-orange-600 text-white'
        };
      case 'UNISEXE':
        return {
          label: 'Unisexe',
          className: 'bg-gray-500 hover:bg-gray-600 text-white'
        };
      default:
        return {
          label: 'Inconnu',
          className: 'bg-gray-400 hover:bg-gray-500 text-white'
        };
    }
  };

  const config = getGenreConfig(genre);

  return (
    <Badge 
      className={`${config.className} ${className}`}
      variant="secondary"
    >
      {config.label}
    </Badge>
  );
}; 