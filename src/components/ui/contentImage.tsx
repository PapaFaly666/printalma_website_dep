import React, { useState, useRef } from 'react';
import { Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { SvgUtils } from '../../utils/svgUtils';

export interface ContentImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  onLoad?: () => void;
  onError?: () => void;
  showFallback?: boolean;
  fallbackText?: string;
}

/**
 * Composant d'image optimisé pour gérer les SVG et les images raster
 * Utilise object-fit: contain pour les SVG et object-fit: cover pour les images raster
 *
 * Basé sur le guide d'affichage SVG du contenu page d'accueil
 */
export const ContentImage: React.FC<ContentImageProps> = ({
  src,
  alt,
  className = '',
  width = '100%',
  height = '100%',
  onLoad,
  onError,
  showFallback = true,
  fallbackText = 'Pas d\'image',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const isSvg = SvgUtils.isSvg(imageSrc);
  const imgRef = useRef<HTMLImageElement>(null);

  // Mettre à jour imageSrc quand src change (important pour l'upload)
  React.useEffect(() => {
    if (src !== imageSrc) {
      setImageSrc(src);

      // Si c'est un blob URL (preview local), afficher immédiatement
      const isBlobUrl = src && src.startsWith('blob:');
      if (isBlobUrl) {
        setImageLoaded(true); // ✅ Affichage instantané pour les previews locaux
        setImageError(false);
      } else {
        setImageLoaded(false); // Attendre le chargement pour les URLs distantes
        setImageError(false);
      }
    }
  }, [src]);

  const handleLoad = () => {
    console.log('✅ Image chargée:', imageSrc?.substring(0, 60));
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleError = (e: any) => {
    console.error('❌ Erreur chargement image:', imageSrc?.substring(0, 60), e);
    setImageLoaded(false);
    setImageError(true);
    onError?.();
  };

  // Si pas de source ou erreur, afficher le fallback
  if (!imageSrc || imageError) {
    if (!showFallback) return null;
    return (
      <div
        className={`content-image-fallback ${className}`}
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px dashed #dee2e6',
        }}
      >
        <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
        <span className="text-xs text-gray-500">{fallbackText}</span>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    width,
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isSvg ? '#ffffff' : 'transparent',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: isSvg ? 'contain' : 'cover',
    objectPosition: 'center',
    display: imageLoaded ? 'block' : 'none',
    transition: 'opacity 0.3s ease',
  };

  // Pour les SVG, ajouter du padding pour ne pas rogner
  if (isSvg) {
    (imageStyle as any).padding = '8px';
  }

  return (
    <div className={`content-image-container ${isSvg ? 'svg-container' : 'raster-container'} ${className}`} style={containerStyle}>
      {/* Skeleton de chargement */}
      {!imageLoaded && (
        <div
          className="image-skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}

      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        style={imageStyle}
        className={isSvg ? 'svg-image' : 'raster-image'}
      />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .svg-image {
          image-rendering: optimizeQuality;
          -webkit-font-smoothing: antialiased;
        }

        .raster-image {
          image-rendering: auto;
        }
      `}</style>
    </div>
  );
};

export default ContentImage;
