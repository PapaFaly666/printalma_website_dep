import React from 'react';
import {
  getGridDimensions,
  type StickerType,
  type BorderColor
} from '../utils/stickerFilters';

interface SynchronizedStickerPreviewProps {
  /**
   * URL de l'image du sticker générée par le backend
   */
  stickerImage: string;

  /**
   * Configuration du sticker (pour informations seulement)
   */
  stickerType: StickerType;
  borderColor?: BorderColor;
  size?: string;

  /**
   * Options d'affichage
   */
  className?: string;
  showGrid?: boolean;
  alt?: string;
}

/**
 * SynchronizedStickerPreview - Aperçu de sticker
 *
 * ✅ SYNCHRONISATION BACKEND/FRONTEND :
 *
 * Les effets "autocollant cartoon" sont maintenant générés entièrement par le backend
 * via le service StickerGeneratorService (Sharp).
 *
 * Ce composant affiche uniquement l'image pré-générée par le backend, sans aucun
 * filtre CSS destructeur côté client.
 *
 * Les effets générés par le backend incluent :
 * - Bordures blanches (contour cartoon)
 * - Contour gris fin (trait de découpe)
 * - Ombres portées (effet décollé)
 * - Amélioration des couleurs (brightness, contrast, saturation)
 * - Effet glossy (si demandé)
 *
 * @see StickerGeneratorService pour la génération des effets
 */
const SynchronizedStickerPreview: React.FC<SynchronizedStickerPreviewProps> = ({
  stickerImage,
  stickerType,
  borderColor = 'glossy-white',
  size = '83 mm x 100 mm',
  className = '',
  showGrid = false,
  alt = 'Aperçu du sticker'
}) => {
  // Style de base de l'image
  const baseStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  };

  // Rendu de la grille dimensionnelle
  const renderGrid = () => {
    if (!showGrid || !size) return null;

    const { cellsX, cellsY } = getGridDimensions(size);
    const gridId = `sticker-grid-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.2 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={gridId}
            width={`${100 / cellsX}%`}
            height={`${100 / cellsY}%`}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${100 / cellsX} 0 L 0 0 0 ${100 / cellsY}`}
              fill="none"
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${gridId})`} />
      </svg>
    );
  };

  // Affichage de l'image générée par le backend
  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={stickerImage}
        alt={alt}
        style={baseStyle}
      />
      {renderGrid()}

      {/* Badge debug (uniquement en développement) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
          📸 Backend Generated
        </div>
      )}
    </div>
  );
};

export default SynchronizedStickerPreview;
