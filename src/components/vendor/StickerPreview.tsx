import React from 'react';

interface StickerPreviewProps {
  /**
   * URL de l'image générée avec bordures par le backend
   * Si non fournie, affiche le design original (pour l'aperçu en création)
   */
  imageUrl: string;
  /**
   * Type de sticker (pour information, plus utilisé pour les effets CSS)
   */
  stickerType?: 'autocollant' | 'pare-chocs';
  /**
   * Classe CSS personnalisée
   */
  className?: string;
  /**
   * Afficher la grille de mesure (pour aperçu création)
   * @default false
   */
  showGrid?: boolean;
  /**
   * Dimensions pour la grille (ex: "83 mm x 100 mm")
   */
  size?: string;
}

/**
 * StickerPreview - Composant d'affichage de sticker
 *
 * IMPORTANT: Ce composant affiche directement l'image générée par le backend.
 * Les bordures, ombres et effets sont désormais appliqués côté serveur avec Sharp.
 *
 * Le backend génère l'image avec:
 * - Bordure blanche épaisse (10px pour autocollant, 25px pour pare-chocs)
 * - 16+ layers de contour blanc (style cartoon/sticker)
 * - 4 layers de définition gris foncé
 * - 3 ombres portées pour effet 3D
 * - Effet glossy (luminosité +15%, saturation +10%, contraste +10%)
 */
const StickerPreview: React.FC<StickerPreviewProps> = ({
  imageUrl,
  className = '',
  showGrid = false,
  size = '83 mm x 100 mm'
}) => {
  const renderGrid = () => {
    if (!showGrid) return null;

    // Parser la taille sélectionnée (ex: "83 mm x 100 mm")
    const [widthStr, heightStr] = size.split(' x ').map(s => parseInt(s));
    const gridSize = 10; // Taille de chaque cellule de grille en mm
    const cellsX = Math.ceil(widthStr / gridSize);
    const cellsY = Math.ceil(heightStr / gridSize);

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.2 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="sticker-grid"
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
        <rect width="100%" height="100%" fill="url(#sticker-grid)" />
      </svg>
    );
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Image du sticker générée avec bordures par le backend */}
      <img
        src={imageUrl}
        alt="Aperçu sticker"
        className="w-full h-full object-contain"
        style={{
          display: 'block'
          // NOTE: Plus de filter CSS - les effets sont dans l'image générée
        }}
      />
      {renderGrid()}
    </div>
  );
};

export default StickerPreview;
