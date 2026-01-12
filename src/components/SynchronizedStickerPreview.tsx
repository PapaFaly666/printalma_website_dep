import React from 'react';
import {
  generateStickerFilters,
  getGridDimensions,
  getStickerStyle,
  type StickerType,
  type BorderColor
} from '../utils/stickerFilters';

interface SynchronizedStickerPreviewProps {
  /**
   * URL de l'image du design original
   */
  designUrl: string;

  /**
   * URL de l'image pré-générée par le backend (avec bordures intégrées)
   * Si fournie, elle sera utilisée en priorité (pas de filtres CSS)
   */
  stickerImage?: string;

  /**
   * Configuration du sticker
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

  /**
   * Force l'utilisation des filtres CSS même si stickerImage est fourni
   * (utile pour comparer les rendus ou déboguer)
   */
  forceCssFilters?: boolean;
}

/**
 * SynchronizedStickerPreview - Aperçu de sticker synchronisé CSS/Sharp
 *
 * IMPORTANT: Ce composant garantit que l'aperçu CSS correspond EXACTEMENT
 * au rendu Sharp du backend.
 *
 * 🔄 CONFIGURATION SYNCHRONISÉE:
 * Voir ../utils/stickerFilters.ts pour les valeurs exactes
 *
 * 📋 MODES D'AFFICHAGE:
 *
 * 1. Mode "Image pré-générée" (stickerImage fourni)
 *    - Affiche directement l'image du backend
 *    - PAS de filtres CSS (les bordures sont dans l'image)
 *    - Utilisation: Affichage après création, liste des stickers
 *
 * 2. Mode "Aperçu en direct" (designUrl sans stickerImage)
 *    - Affiche le design avec filtres CSS
 *    - Les filtres correspondent EXACTEMENT au traitement Sharp
 *    - Utilisation: Création/édition de sticker (aperçu temps réel)
 *
 * 🎨 CONFIGURATION CSS = SHARP:
 * ----------------------------------------
 * Autocollant (16 layers blanc + 4 layers gris + 3 ombres):
 * - Contour: drop-shadow(1px 0 0 white) ... drop-shadow(16px 0 0 white)
 * - Définition: drop-shadow(0.3px 0 0 rgba(50,50,50,0.7))
 * - Ombres: drop-shadow(2px 3px 5px rgba(0,0,0,0.3))
 * - Glossy: brightness(1.15) saturate(1.1) contrast(1.1)
 *
 * Pare-chocs (bordure large 25px):
 * - border: 8px solid white
 * - box-shadow: 0 0 0 4px white, 0 0 0 8px #f0f0f0
 */
const SynchronizedStickerPreview: React.FC<SynchronizedStickerPreviewProps> = ({
  designUrl,
  stickerImage,
  stickerType,
  borderColor = 'glossy-white',
  size = '83 mm x 100 mm',
  className = '',
  showGrid = false,
  alt = 'Aperçu du sticker',
  forceCssFilters = false
}) => {
  // Déterminer si on utilise l'image pré-générée ou le design avec filtres
  const usePregenerated = stickerImage && !forceCssFilters;
  const displayUrl = usePregenerated ? stickerImage : designUrl;

  // Style de base de l'image
  const baseStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  };

  // Appliquer les filtres CSS seulement en mode "aperçu direct"
  const finalStyle = usePregenerated
    ? baseStyle
    : { ...baseStyle, ...getStickerStyle(stickerType, borderColor) };

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

  // Mode pare-chocs avec CSS
  if (stickerType === 'pare-chocs' && !usePregenerated) {
    return (
      <div
        className={`inline-block ${className}`}
        style={{
          backgroundColor: 'white',
          padding: '40px',
          boxShadow: '0 0 0 4px #ffffff, 0 0 0 8px #f0f0f0, 0 8px 16px -2px rgba(0, 0, 0, 0.2), 0 4px 8px -2px rgba(0, 0, 0, 0.1)'
        }}
      >
        <img
          src={displayUrl}
          alt={alt}
          style={baseStyle}
        />
        {renderGrid()}
      </div>
    );
  }

  // Mode autocollant (CSS ou image pré-générée)
  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={displayUrl}
        alt={alt}
        style={finalStyle}
      />
      {renderGrid()}

      {/* Badge debug (uniquement en développement) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
          {usePregenerated ? '📸 Pré-généré' : '🎨 CSS Live'}
        </div>
      )}
    </div>
  );
};

export default SynchronizedStickerPreview;
