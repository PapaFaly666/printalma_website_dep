import React from 'react';
import { Eye, Trash2, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import Button from '../ui/Button';
import { StickerListItem } from '../../services/vendorStickerService';

interface StickerCardProps {
  sticker: StickerListItem;
  onDelete?: (id: number) => void;
  onView?: (imageUrl: string) => void;
}

/**
 * StickerCard - Carte d'affichage d'un sticker style autocollant cartoon
 *
 * OPTIMISATIONS APPLIQUÉES :
 * - will-change: transform pour accélération GPU
 * - transform: translateZ(0) pour forcer layer GPU
 * - Lazy loading des images
 * - contain: layout style paint pour isolation du rendu
 * - Filtres CSS pré-calculés en constante
 */

// 🚀 OPTIMISATION 1: Pré-calculer les filtres CSS (évite recalcul à chaque render)
const STICKER_FILTER = [
  // Contour blanc épais externe (style cartoon/sticker)
  'drop-shadow(1px 0 0 white)',
  'drop-shadow(-1px 0 0 white)',
  'drop-shadow(0 1px 0 white)',
  'drop-shadow(0 -1px 0 white)',
  'drop-shadow(2px 0 0 white)',
  'drop-shadow(-2px 0 0 white)',
  'drop-shadow(0 2px 0 white)',
  'drop-shadow(0 -2px 0 white)',
  'drop-shadow(3px 0 0 white)',
  'drop-shadow(-3px 0 0 white)',
  'drop-shadow(0 3px 0 white)',
  'drop-shadow(0 -3px 0 white)',
  'drop-shadow(2px 2px 0 white)',
  'drop-shadow(-2px -2px 0 white)',
  'drop-shadow(2px -2px 0 white)',
  'drop-shadow(-2px 2px 0 white)',

  // Contour gris foncé interne très fin
  'drop-shadow(0.3px 0 0 rgba(50, 50, 50, 0.7))',
  'drop-shadow(-0.3px 0 0 rgba(50, 50, 50, 0.7))',
  'drop-shadow(0 0.3px 0 rgba(50, 50, 50, 0.7))',
  'drop-shadow(0 -0.3px 0 rgba(50, 50, 50, 0.7))',

  // Ombres pour effet autocollant décollé
  'drop-shadow(2px 3px 5px rgba(0, 0, 0, 0.3))',
  'drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.25))',
  'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.2))',

  // Amélioration légère des couleurs
  'brightness(1.02)',
  'contrast(1.05)',
  'saturate(1.1)'
].join(' ');

const StickerCard: React.FC<StickerCardProps> = ({
  sticker,
  onDelete,
  onView
}) => {
  // Badge de statut
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      PUBLISHED: { label: 'Publié', color: 'bg-green-100 text-green-800' },
      DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800' }
    };

    const { label, color } = config[status as keyof typeof config] || config.DRAFT;
    return <Badge className={color}>{label}</Badge>;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-lg transition-all overflow-hidden">
      {/* Zone d'aperçu - Fond gris pour mieux voir les bordures (comme CustomerProductCustomizationPageV3) */}
      {/* 🚀 OPTIMISATION 2: contain pour isolation du rendu */}
      <div
        className="relative aspect-square bg-gray-200 p-6 flex items-center justify-center"
        style={{ contain: 'layout style paint' }}
      >
        {/* Image du sticker avec effet autocollant : bordure blanche + ombre */}
        {/* 🚀 OPTIMISATION 3: will-change + translateZ pour accélération GPU */}
        <div
          className="relative inline-block"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
        >
          <img
            src={sticker.stickerImage || sticker.designPreview}
            alt={sticker.name}
            loading="lazy" // 🚀 OPTIMISATION 4: Lazy loading natif
            decoding="async" // 🚀 OPTIMISATION 5: Décodage asynchrone
            className="max-w-full max-h-full object-contain"
            style={{
              maxWidth: '280px',
              maxHeight: '280px',
              display: 'block',
              filter: STICKER_FILTER, // 🚀 Utilisation de la constante pré-calculée
              // 🚀 OPTIMISATION 6: backface-visibility pour GPU
              backfaceVisibility: 'hidden',
              // 🚀 OPTIMISATION 7: perspective pour GPU layer
              WebkitTransform: 'translateZ(0)',
              WebkitFontSmoothing: 'antialiased'
            }}
          />
        </div>

        {/* Badge statut */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={sticker.status} />
        </div>
      </div>

      {/* Informations */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-2" title={sticker.name}>
          {sticker.name}
        </h3>

        {/* Métadonnées */}
        <div className="space-y-1 mb-3 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Taille:</span>
            <span className="font-medium">{sticker.size}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Finition:</span>
            <span className="font-medium capitalize">{sticker.finish}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Prix:</span>
            <span className="font-bold text-primary">
              {sticker.price.toLocaleString()} FCFA
            </span>
          </div>
        </div>

        {/* Statistiques */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-b">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{sticker.viewCount} vues</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>{sticker.saleCount} ventes</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView(sticker.stickerImage || sticker.designPreview)}
            >
              <Eye className="w-3 h-3 mr-1" />
              Voir
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(sticker.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Date de création */}
        <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Créé le {new Date(sticker.createdAt).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
};

export default StickerCard;
