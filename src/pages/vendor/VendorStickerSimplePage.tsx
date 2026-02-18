import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sticker,
  Loader2,
  Search,
  Check,
  ArrowLeft,
  X,
  Package,
  DollarSign
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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

  // États pour la modale de configuration
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<number>(100);
  const [customPrice, setCustomPrice] = useState<number>(1500);
  const [priceMode, setPriceMode] = useState<'auto' | 'custom'>('auto');

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

  // Ouvrir la modale de configuration
  const openConfigModal = (design: Design) => {
    setSelectedDesign(design);

    // Calculer le prix auto suggéré
    const basePrice = 1500;
    const designPrice = design.price || 0;
    const suggestedPrice = basePrice + designPrice;

    setCustomPrice(suggestedPrice);
    setStockQuantity(100);
    setPriceMode('auto');
    setIsConfigModalOpen(true);
  };

  // Fermer la modale
  const closeConfigModal = () => {
    setIsConfigModalOpen(false);
    setSelectedDesign(null);
  };

  // Calculer le prix final
  const getFinalPrice = (): number => {
    if (priceMode === 'auto' && selectedDesign) {
      const basePrice = 1500;
      const designPrice = selectedDesign.price || 0;
      return basePrice + designPrice;
    }
    return customPrice;
  };

  // Créer un autocollant depuis un design avec configuration personnalisée
  const handleCreateSticker = async () => {
    if (!selectedDesign) return;

    try {
      setCreatingStickerId(selectedDesign.id);

      const stickerWidth = 10;  // 10 cm
      const stickerHeight = 10; // 10 cm
      const finalPrice = getFinalPrice();

      console.log('💰 Configuration finale:', {
        priceMode,
        basePrice: 1500,
        designPrice: selectedDesign.price || 0,
        finalPrice,
        stockQuantity
      });

      // Configuration au format backend DTO
      const stickerPayload = {
        designId: selectedDesign.id,
        name: `Autocollant - ${selectedDesign.name}`,
        description: selectedDesign.description || `Autocollant personnalisé avec le design ${selectedDesign.name}`,

        // Taille avec ID
        size: {
          id: 'medium',
          width: stickerWidth,
          height: stickerHeight
        },

        // Finition (obligatoire)
        finish: 'glossy',

        // Forme
        shape: 'DIE_CUT' as const,

        // Prix et stock
        price: finalPrice,
        stockQuantity: stockQuantity,

        // Configuration de génération d'image (optionnel)
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
        description: `Prix: ${finalPrice.toLocaleString()} FCFA | Stock: ${stockQuantity} unités`,
        duration: 4000
      });

      closeConfigModal();

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

  // Prix calculé pour affichage dans la grille
  const getDisplayPrice = (design: Design): number => {
    const basePrice = 1500;
    const designPrice = design.price || 0;
    return basePrice + designPrice;
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
                      onClick={() => openConfigModal(design)}
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
                          Configurer
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Badge prix calculé */}
                  <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    {getDisplayPrice(design).toLocaleString()} FCFA
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
              Le backend génère automatiquement les images avec bordures via Sharp (2-8 secondes)
            </p>
          </div>
        )}
      </div>

      {/* Modale de configuration du sticker */}
      {isConfigModalOpen && selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête de la modale */}
            <div className="sticky top-0 bg-white border-b p-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Configurer l'autocollant
                </h2>
                <button
                  onClick={closeConfigModal}
                  disabled={creatingStickerId !== null}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Corps de la modale */}
            <div className="p-4 space-y-4">
              {/* Aperçu du design */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                  <img
                    src={selectedDesign.imageUrl || selectedDesign.thumbnailUrl}
                    alt={selectedDesign.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{selectedDesign.name}</h3>
                  {selectedDesign.price > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      +{selectedDesign.price} FCFA
                    </p>
                  )}
                </div>
              </div>

              {/* Configuration du prix */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Prix de vente</Label>

                {/* Sélection du mode de prix */}
                <Select value={priceMode} onValueChange={(value: 'auto' | 'custom') => setPriceMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Automatique (1,500 FCFA + design)
                    </SelectItem>
                    <SelectItem value="custom">
                      Personnalisé
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Affichage du prix */}
                {priceMode === 'auto' ? (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-600">Prix total</span>
                      <span className="text-xl font-semibold text-gray-900">
                        {getFinalPrice().toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="customPrice"
                      type="number"
                      min="100"
                      step="100"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      placeholder="Ex: 2000"
                    />
                    <p className="text-xs text-gray-500">
                      Suggéré: {(1500 + (selectedDesign.price || 0)).toLocaleString()} FCFA
                    </p>
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label htmlFor="stockQuantity" className="text-sm font-medium text-gray-700">
                  Stock initial
                </Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="1"
                  step="10"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  placeholder="Ex: 100"
                />
                <p className="text-xs text-gray-500">
                  Nombre d'unités disponibles à la vente
                </p>
              </div>

              {/* Résumé */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Taille</span>
                  <span className="font-medium text-gray-900">10 cm x 10 cm</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Finition</span>
                  <span className="font-medium text-gray-900">Brillant</span>
                </div>
              </div>
            </div>

            {/* Pied de la modale */}
            <div className="sticky bottom-0 bg-white border-t p-4 rounded-b-2xl">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeConfigModal}
                  disabled={creatingStickerId !== null}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateSticker}
                  disabled={creatingStickerId !== null}
                  className="flex-1"
                >
                  {creatingStickerId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Créer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorStickerSimplePage;
