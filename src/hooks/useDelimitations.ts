import { useState, useCallback } from 'react';

interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
}

interface UseDelimitationsOptions {
  imageNaturalWidth?: number;
  imageNaturalHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const useDelimitations = (options: UseDelimitationsOptions = {}) => {
  const [delimitations, setDelimitations] = useState<DelimitationData[]>([]);

  // Convertir coordonnées absolues en pourcentage
  const toPercentage = useCallback((delimitation: DelimitationData): DelimitationData => {
    if (delimitation.coordinateType === 'PERCENTAGE') {
      return delimitation;
    }

    const { imageNaturalWidth, imageNaturalHeight } = options;
    if (!imageNaturalWidth || !imageNaturalHeight) {
      return delimitation;
    }

    return {
      x: (delimitation.x / imageNaturalWidth) * 100,
      y: (delimitation.y / imageNaturalHeight) * 100,
      width: (delimitation.width / imageNaturalWidth) * 100,
      height: (delimitation.height / imageNaturalHeight) * 100,
      coordinateType: 'PERCENTAGE'
    };
  }, [options.imageNaturalWidth, options.imageNaturalHeight]);

  // Convertir coordonnées pourcentage en absolues
  const toAbsolute = useCallback((delimitation: DelimitationData): DelimitationData => {
    if (delimitation.coordinateType === 'ABSOLUTE') {
      return delimitation;
    }

    const { imageNaturalWidth, imageNaturalHeight } = options;
    if (!imageNaturalWidth || !imageNaturalHeight) {
      return delimitation;
    }

    return {
      x: (delimitation.x / 100) * imageNaturalWidth,
      y: (delimitation.y / 100) * imageNaturalHeight,
      width: (delimitation.width / 100) * imageNaturalWidth,
      height: (delimitation.height / 100) * imageNaturalHeight,
      coordinateType: 'ABSOLUTE'
    };
  }, [options.imageNaturalWidth, options.imageNaturalHeight]);

  // Obtenir coordonnées pour l'affichage (ajustées au container)
  const getDisplayCoordinates = useCallback((delimitation: DelimitationData) => {
    const { containerWidth, containerHeight, imageNaturalWidth, imageNaturalHeight } = options;
    
    if (!containerWidth || !containerHeight || !imageNaturalWidth || !imageNaturalHeight) {
      return delimitation;
    }

    const scaleX = containerWidth / imageNaturalWidth;
    const scaleY = containerHeight / imageNaturalHeight;

    if (delimitation.coordinateType === 'PERCENTAGE') {
      return {
        x: (delimitation.x / 100) * containerWidth,
        y: (delimitation.y / 100) * containerHeight,
        width: (delimitation.width / 100) * containerWidth,
        height: (delimitation.height / 100) * containerHeight,
        coordinateType: 'ABSOLUTE' as const
      };
    } else {
      return {
        x: delimitation.x * scaleX,
        y: delimitation.y * scaleY,
        width: delimitation.width * scaleX,
        height: delimitation.height * scaleY,
        coordinateType: 'ABSOLUTE' as const
      };
    }
  }, [options]);

  // Valider qu'une délimitation est dans les limites
  const isValidDelimitation = useCallback((delimitation: DelimitationData): boolean => {
    if (delimitation.coordinateType === 'PERCENTAGE') {
      return (
        delimitation.x >= 0 && delimitation.x <= 100 &&
        delimitation.y >= 0 && delimitation.y <= 100 &&
        delimitation.width > 0 && delimitation.width <= (100 - delimitation.x) &&
        delimitation.height > 0 && delimitation.height <= (100 - delimitation.y)
      );
    } else {
      const { imageNaturalWidth, imageNaturalHeight } = options;
      if (!imageNaturalWidth || !imageNaturalHeight) return true;

      return (
        delimitation.x >= 0 && delimitation.x <= imageNaturalWidth &&
        delimitation.y >= 0 && delimitation.y <= imageNaturalHeight &&
        delimitation.width > 0 && delimitation.width <= (imageNaturalWidth - delimitation.x) &&
        delimitation.height > 0 && delimitation.height <= (imageNaturalHeight - delimitation.y)
      );
    }
  }, [options]);

  return {
    delimitations,
    setDelimitations,
    toPercentage,
    toAbsolute,
    getDisplayCoordinates,
    isValidDelimitation
  };
}; 