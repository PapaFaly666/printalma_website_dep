import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sticker,
  Loader2,
  Search,
  Check,
  ArrowLeft
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import designService, { Design } from '../../services/designService';
import vendorStickerService from '../../services/vendorStickerService';
import { useAuth } from '../../contexts/AuthContext';

const VendorStickerSimplePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // États
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingStickerId, setCreatingStickerId] = useState<string | number | null>(null);

  // Charger les designs du vendeur
  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const response = await designService.getDesigns({
        status: 'all',
        limit: 100
      });

      console.log('📦 [Stickers] Réponse complète:', response);
      console.log('📦 [Stickers] Designs chargés:', response.designs?.length || 0);

      // Log de TOUS les designs pour voir leur structure
      if (response.designs && response.designs.length > 0) {
        console.log('🔍 [Stickers] Structure du premier design:', response.designs[0]);
        console.log('🔍 [Stickers] Tous les designs:', response.designs.map(d => ({
          id: d.id,
          name: d.name,
          isValidated: d.isValidated,
          isPending: d.isPending,
          isDraft: d.isDraft,
          isPublished: d.isPublished
        })));
      }

      // Filtrer les designs publiés (validés et publiés automatiquement)
      const validatedDesigns = (response.designs || []).filter(
        d => {
          // Un design est utilisable pour sticker s'il est publié
          const isValid = d.isPublished === true || d.isValidated === true;

          console.log(`Design "${d.name}":`, {
            isPublished: d.isPublished,
            isValidated: d.isValidated,
            result: isValid ? '✅ VALIDE' : '❌ NON VALIDE'
          });
          return isValid;
        }
      );

      console.log('✅ [Stickers] Designs publiés trouvés:', validatedDesigns.length);

      setDesigns(validatedDesigns);
    } catch (error) {
      console.error('Erreur chargement designs:', error);
      toast.error('Erreur lors du chargement de vos designs');
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  // Filtrer les designs selon la recherche
  const filteredDesigns = designs.filter(design =>
    design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    design.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Créer automatiquement un autocollant depuis un design
  const handleCreateSticker = async (design: Design) => {
    try {
      setCreatingStickerId(design.id);

      // Configuration simplifiée - Taille et prix définis directement
      const stickerWidth = 10;  // 10 cm
      const stickerHeight = 10; // 10 cm
      const basePrice = 1500;   // Prix de base en FCFA
      const designPrice = design.price || 0;
      const totalPrice = basePrice + designPrice;

      console.log('💰 Calcul prix:', {
        basePrice,
        designPrice,
        total: totalPrice
      });

      // Configuration au format simplifié attendu par le backend
      const stickerPayload = {
        designId: design.id,
        name: `Autocollant - ${design.name}`,
        description: design.description || `Autocollant personnalisé avec le design ${design.name}`,

        // Taille simplifiée (seulement width et height)
        size: {
          width: stickerWidth,
          height: stickerHeight
        },

        // Prix défini directement par le vendeur
        price: totalPrice,

        // Forme
        shape: 'DIE_CUT',

        // Stock
        stockQuantity: 50,

        // Configuration de génération d'image
        stickerType: 'autocollant' as const,
        borderColor: 'glossy-white'
      };

      console.log('📦 Création sticker (le backend génère l\'image avec bordures):', stickerPayload);

      // Toast de chargement pendant la génération
      toast.loading('⏳ Génération de l\'autocollant en cours...', {
        id: 'creating-sticker',
        description: 'Le serveur génère l\'image avec bordures (Sharp) - 2-8 secondes'
      });

      // Utiliser fetch avec authentification par cookies (comme vendorStickerService)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
      const response = await fetch(`${API_BASE_URL}/vendor/stickers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Authentification par cookies de session
        body: JSON.stringify(stickerPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.message || `Erreur HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      toast.dismiss('creating-sticker');
      toast.success(`✅ Autocollant créé: ${stickerPayload.name}`, {
        description: `Prix: ${totalPrice.toLocaleString()} FCFA - Image générée par le serveur`,
        duration: 4000
      });

      setTimeout(() => {
        navigate('/vendeur/products');
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erreur création sticker:', error);
      toast.dismiss('creating-sticker');
      toast.error('Erreur lors de la création du sticker', {
        description: error.message || 'Impossible de créer le sticker'
      });
    } finally {
      setCreatingStickerId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sticker className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Créer des Autocollants
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Sélectionnez un design pour créer un autocollant automatiquement
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/vendeur/dashboard')}
              className="hidden sm:flex"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Info box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Sticker className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Autocollants créés automatiquement
              </h3>
              <p className="text-sm text-blue-800">
                Cliquez sur un design pour créer un autocollant avec :
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Bordure blanche brillante (effet glossy) générée par le serveur</li>
                <li>Taille: 100 mm x 100 mm (10 cm x 10 cm)</li>
                <li>Forme: Découpe personnalisée (contour du design)</li>
                <li>Prix: 1,500 FCFA (base) + prix du design</li>
                <li>Stock initial: 50 unités</li>
                <li><strong>Image finale avec contours blancs pré-générée (Sharp)</strong></li>
              </ul>
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                Les images sont générées côté serveur avec Sharp pour des performances optimales et une qualité constante.
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un design..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Grille de designs */}
        {isLoadingDesigns ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Chargement de vos designs...</span>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Sticker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchTerm
                ? 'Aucun design trouvé pour cette recherche'
                : 'Aucun design validé disponible'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Seuls les designs validés peuvent être transformés en autocollants
            </p>
            <Button onClick={() => navigate('/vendeur/designs')}>
              Voir mes designs
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredDesigns.map((design) => {
              const isCreating = creatingStickerId === design.id;

              return (
                <div
                  key={design.id}
                  className="group relative bg-white rounded-lg border-2 border-gray-200 hover:border-primary overflow-hidden transition-all hover:shadow-lg"
                >
                  {/* Aperçu simple du design (sans effet CSS lourd) */}
                  <div className="relative aspect-square bg-gray-100 p-4 flex items-center justify-center">
                    <img
                      src={design.imageUrl || design.thumbnailUrl}
                      alt={design.name}
                      className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                    />
                    {/* Badge informatif - l'image sera générée par le serveur */}
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Sticker className="w-3 h-3" />
                      <span>Server</span>
                    </div>
                  </div>

                  {/* Informations */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate mb-1 text-gray-900">
                      {design.name}
                    </h3>
                    {design.price > 0 && (
                      <p className="text-xs text-primary font-medium mb-2">
                        Design: +{design.price} FCFA
                      </p>
                    )}

                    {/* Bouton de création */}
                    <Button
                      onClick={() => handleCreateSticker(design)}
                      disabled={isCreating}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-2" />
                          Créer autocollant
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Badge prix calculé */}
                  <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    {(() => {
                      // Calcul simplifié (identique à handleCreateSticker)
                      const basePrice = 1500;
                      const designPrice = design.price || 0;
                      return (basePrice + designPrice).toLocaleString();
                    })()} FCFA
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        {filteredDesigns.length > 0 && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              {filteredDesigns.length} design{filteredDesigns.length > 1 ? 's' : ''} disponible{filteredDesigns.length > 1 ? 's' : ''} pour créer des autocollants
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Les autocollants sont créés en brouillon. Vous pourrez les modifier avant publication.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorStickerSimplePage;
