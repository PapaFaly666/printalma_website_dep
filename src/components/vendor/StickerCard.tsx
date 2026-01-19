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
 * StickerCard - Carte d'affichage d'un sticker
 *
 * SYNCHRONISATION BACKEND/FRONTEND :
 *
 * ✅ Les effets "autocollant cartoon" sont maintenant générés par le backend
 *    via le service StickerGeneratorService (Sharp).
 *
 * ✅ Plus aucun filtre CSS destructeur n'est appliqué côté client.
 *
 * ✅ Performance optimale : 0 opération GPU pour les effets visuels.
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
      {/* Zone d'aperçu - Fond gris pour mieux voir les stickers */}
      <div className="relative aspect-square bg-gray-200 p-6 flex items-center justify-center">
        {/* Image du sticker générée par le backend */}
        <img
          src={sticker.stickerImage || sticker.designPreview}
          alt={sticker.name}
          loading="lazy"
          decoding="async"
          className="max-w-full max-h-full object-contain"
          style={{
            maxWidth: '280px',
            maxHeight: '280px',
            display: 'block'
          }}
        />

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
