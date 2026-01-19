import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Ruler,
  Palette,
  Frame as FrameIcon,
  CheckCircle,
  Clock,
  XCircle,
  Archive
} from 'lucide-react';
import Button from '../ui/Button';
import { PosterProduct } from '../../pages/VendorPostersPage';
import { POSTER_FORMATS, FINISHES, FRAMES } from './PosterCreationForm';

interface PosterCardProps {
  poster: PosterProduct;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export default function PosterCard({ poster, onEdit, onDelete, onView }: PosterCardProps) {
  // Trouver les infos de format, finition et cadre
  const format = POSTER_FORMATS.find(f => f.id === poster.formatId);
  const finish = FINISHES.find(f => f.id === poster.finish);
  const frame = FRAMES.find(f => f.id === poster.frame);

  // Badge de statut
  const getStatusBadge = () => {
    switch (poster.status) {
      case 'VALIDATED':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            <span>Validé</span>
          </div>
        );
      case 'PENDING':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            <span>En attente</span>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
            <XCircle className="h-3 w-3" />
            <span>Rejeté</span>
          </div>
        );
      case 'ARCHIVED':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
            <Archive className="h-3 w-3" />
            <span>Archivé</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* Image du poster */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden group">
        {poster.imageUrl ? (
          <>
            <img
              src={poster.imageUrl}
              alt={poster.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
            {/* Overlay au survol */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                onClick={onView}
                className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="h-4 w-4" />
                Voir
              </motion.button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">En cours de génération...</p>
            </div>
          </div>
        )}

        {/* Badge de statut en haut à droite */}
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
      </div>

      {/* Informations du poster */}
      <div className="p-5">
        {/* Nom */}
        <h3 className="font-bold text-lg text-gray-900 mb-2 truncate" title={poster.name}>
          {poster.name}
        </h3>

        {/* Description (si présente) */}
        {poster.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {poster.description}
          </p>
        )}

        {/* Détails techniques */}
        <div className="space-y-2 mb-4">
          {/* Format */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Ruler className="h-4 w-4 text-purple-500 flex-shrink-0" />
            <span className="font-medium">{format?.name || poster.formatId}</span>
            <span className="text-gray-500">
              ({poster.width} × {poster.height} cm)
            </span>
          </div>

          {/* Finition */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Palette className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span>{finish?.name || poster.finish}</span>
          </div>

          {/* Cadre */}
          {poster.frame !== 'NO_FRAME' && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FrameIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span>{frame?.name || poster.frame}</span>
            </div>
          )}
        </div>

        {/* Prix et stock */}
        <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-xl font-bold text-gray-900">
              {poster.finalPrice} <span className="text-sm font-normal text-gray-500">FCFA</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Package className="h-4 w-4" />
            <span>Stock: {poster.stockQuantity}</span>
          </div>
        </div>

        {/* SKU */}
        <div className="text-xs text-gray-500 mb-4">
          SKU: {poster.sku}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Date de création */}
        <div className="text-xs text-gray-400 mt-3 text-center">
          Créé le {new Date(poster.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </div>
      </div>
    </motion.div>
  );
}
