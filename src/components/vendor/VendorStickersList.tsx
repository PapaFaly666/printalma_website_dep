import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import Button from '../ui/Button';
import {
  Package,
  RefreshCw,
  Sticker as StickerIcon
} from 'lucide-react';
import StickerCard from './StickerCard';
import { StickerListItem } from '../../services/vendorStickerService';

interface VendorStickersListProps {
  className?: string;
}

/**
 * VendorStickersList - Liste des stickers du vendeur
 *
 * Affiche les stickers générés par le backend avec tous les effets Sharp.
 * Plus aucun toggle CSS/Serveur n'est nécessaire - toutes les images
 * sont pré-générées côté serveur.
 */
export const VendorStickersList: React.FC<VendorStickersListProps> = ({ className }) => {
  const navigate = useNavigate();
  const [stickers, setStickers] = useState<StickerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // Charger les stickers
  const loadStickers = async () => {
    try {
      setIsLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

      const response = await fetch(
        `${API_BASE_URL}/vendor/stickers?page=${page}&limit=${limit}&sortBy=created_at&sortOrder=desc`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des stickers');
      }

      const result = await response.json();
      console.log('📦 Stickers chargés:', result);

      if (result.success && result.data) {
        setStickers(result.data.stickers || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.totalItems || 0);
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement stickers:', error);
      toast.error('Erreur lors du chargement des stickers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStickers();
  }, [page]);

  // Supprimer un sticker
  const handleDelete = async (stickerId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sticker ?')) {
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

      const response = await fetch(`${API_BASE_URL}/vendor/stickers/${stickerId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      toast.success('Sticker supprimé avec succès');
      loadStickers(); // Recharger la liste
    } catch (error: any) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur lors de la suppression du sticker');
    }
  };

  // Voir l'image en plein écran
  const handleViewImage = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  if (isLoading && stickers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-600">Chargement des stickers...</span>
      </div>
    );
  }

  if (stickers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <StickerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun sticker créé
        </h3>
        <p className="text-gray-600 mb-4">
          Commencez par créer votre premier autocollant
        </p>
        <Button onClick={() => navigate('/vendeur/stickers')}>
          <StickerIcon className="w-4 h-4 mr-2" />
          Créer un autocollant
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <StickerIcon className="w-6 h-6 text-primary" />
            Mes Autocollants
            <Badge variant="secondary" className="ml-2">
              {totalItems}
            </Badge>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Stickers générés avec bordures cartoon (effets Sharp)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadStickers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/vendeur/stickers')}>
            <StickerIcon className="w-4 h-4 mr-2" />
            Créer
          </Button>
        </div>
      </div>

      {/* Grille de stickers */}
      {/* 🚀 OPTIMISATION: content-visibility pour rendu incrémental */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        style={{
          // Permet au navigateur de sauter le rendu des éléments hors écran
          contentVisibility: 'auto' as any,
          containIntrinsicSize: '0 400px' // Taille estimée pour le calcul de scroll
        }}
      >
        {stickers.map((sticker) => (
          <StickerCard
            key={sticker.id}
            sticker={sticker}
            onDelete={handleDelete}
            onView={handleViewImage}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
};

export default VendorStickersList;
