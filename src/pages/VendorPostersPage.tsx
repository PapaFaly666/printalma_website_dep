import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Frame,
  Image as ImageIcon,
  Plus,
  Loader2,
  Check,
  X,
  Package,
  DollarSign,
  Ruler,
  Palette,
  Eye,
  Trash2,
  Edit,
  AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import designService, { Design } from '../services/designService';
import { useToast } from '../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import PosterCreationForm from '../components/poster/PosterCreationForm';
import PosterCard from '../components/poster/PosterCard';
import posterService from '../services/posterService';

export interface PosterProduct {
  id: number;
  vendorId: number;
  designId: number;
  name: string;
  description: string | null;
  sku: string;
  formatId: string;
  width: number;
  height: number;
  finish: 'MAT' | 'GLOSSY' | 'CANVAS' | 'FINE_ART';
  frame: 'NO_FRAME' | 'BLACK_FRAME' | 'WHITE_FRAME' | 'WOOD_FRAME' | 'GOLD_FRAME';
  imageUrl: string | null;
  finalPrice: number;
  stockQuantity: number;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';
  design?: Design;
  createdAt: string;
  updatedAt: string;
}

export default function VendorPostersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // États
  const [posters, setPosters] = useState<PosterProduct[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<PosterProduct | null>(null);

  // Filtres
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterFormat, setFilterFormat] = useState<string>('ALL');

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postersData, designsResponse] = await Promise.all([
        posterService.getVendorPosters(),
        designService.getDesigns({ status: 'all', limit: 500 })
      ]);

      // Filtrer les designs publiés (validés et publiés automatiquement)
      const validatedDesigns = (designsResponse.designs || []).filter(
        d => d.isPublished === true || d.isValidated === true
      );

      setPosters(postersData);
      setDesigns(validatedDesigns);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les posters
  const filteredPosters = posters.filter(poster => {
    if (filterStatus !== 'ALL' && poster.status !== filterStatus) return false;
    if (filterFormat !== 'ALL' && poster.formatId !== filterFormat) return false;
    return true;
  });

  // Statistiques
  const stats = {
    total: posters.length,
    pending: posters.filter(p => p.status === 'PENDING').length,
    validated: posters.filter(p => p.status === 'VALIDATED').length,
    rejected: posters.filter(p => p.status === 'REJECTED').length
  };

  const handleCreatePoster = async (posterData: any) => {
    try {
      const newPoster = await posterService.createPoster(posterData);
      setPosters([newPoster, ...posters]);
      setShowCreateDialog(false);
      toast({
        title: 'Succès',
        description: 'Poster créé avec succès',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le poster',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePoster = async (posterId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce poster ?')) return;

    try {
      await posterService.deletePoster(posterId);
      setPosters(posters.filter(p => p.id !== posterId));
      toast({
        title: 'Succès',
        description: 'Poster supprimé avec succès',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le poster',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Frame className="h-6 w-6 text-white" />
            </div>
            Mes Tableaux/Posters
          </h1>
          <p className="text-gray-600 mt-2">
            Créez et vendez vos designs en format poster haute qualité
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Créer un poster
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-10 w-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En attente</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-yellow-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Validés</p>
              <p className="text-3xl font-bold text-green-600">{stats.validated}</p>
            </div>
            <Check className="h-10 w-10 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rejetés</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <X className="h-10 w-10 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Filtres
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="VALIDATED">Validés</option>
              <option value="REJECTED">Rejetés</option>
              <option value="ARCHIVED">Archivés</option>
            </select>
          </div>

          {/* Filtre par format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="ALL">Tous les formats</option>
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="A2">A2</option>
              <option value="50x70">50×70 cm</option>
              <option value="70x100">70×100 cm</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des posters */}
      {filteredPosters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Frame className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun poster
          </h3>
          <p className="text-gray-600 mb-6">
            {filterStatus !== 'ALL' || filterFormat !== 'ALL'
              ? 'Aucun poster ne correspond à vos filtres'
              : 'Créez votre premier poster pour commencer'}
          </p>
          {filterStatus === 'ALL' && filterFormat === 'ALL' && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer un poster
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPosters.map((poster) => (
              <motion.div
                key={poster.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <PosterCard
                  poster={poster}
                  onDelete={() => handleDeletePoster(poster.id)}
                  onEdit={() => {
                    setSelectedPoster(poster);
                    setShowCreateDialog(true);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Dialog de création/édition */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Frame className="h-6 w-6 text-purple-600" />
              {selectedPoster ? 'Modifier le poster' : 'Créer un nouveau poster'}
            </DialogTitle>
            <DialogDescription>
              {selectedPoster
                ? 'Modifiez les paramètres de votre poster'
                : 'Sélectionnez un design et configurez votre poster'}
            </DialogDescription>
          </DialogHeader>

          <PosterCreationForm
            designs={designs}
            initialData={selectedPoster}
            onSubmit={handleCreatePoster}
            onCancel={() => {
              setShowCreateDialog(false);
              setSelectedPoster(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
