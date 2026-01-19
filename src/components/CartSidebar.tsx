import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem } from '../types/cart';
import { useAuth } from '../contexts/AuthContext';
import { formatPriceInFRF as formatPrice } from '../utils/priceUtils';
import { CustomizationPreview } from './order/CustomizationPreview';
import { SimpleProductPreview } from './vendor/SimpleProductPreview';
import vendorProductsService from '../services/vendorProductsService';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

// 🏪 Composant pour afficher un produit vendeur avec son design
const VendorProductPreview: React.FC<{
  item: CartItem;
}> = ({ item }) => {
  const [vendorProduct, setVendorProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVendorProduct = async () => {
      if (!item.vendorProductId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🏪 [CartSidebar] Chargement produit vendeur:', item.vendorProductId);
        const response = await vendorProductsService.getProductById(item.vendorProductId);

        if (response.success && response.data) {
          console.log('✅ [CartSidebar] Produit vendeur chargé:', {
            id: response.data.id,
            name: response.data.vendorName,
            hasDesign: response.data.designApplication?.hasDesign,
            designUrl: response.data.designApplication?.designUrl
          });
          setVendorProduct(response.data);
        } else {
          console.error('❌ [CartSidebar] Erreur chargement produit vendeur');
        }
      } catch (error) {
        console.error('❌ [CartSidebar] Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVendorProduct();
  }, [item.vendorProductId]);

  if (loading) {
    return (
      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
      </div>
    );
  }

  if (!vendorProduct) {
    // Fallback sur l'image simple si le chargement échoue
    return (
      <div className="w-32 h-32 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // 🆕 Utiliser finalImages si disponible, sinon SimpleProductPreview en fallback
  const hasFinalImages = vendorProduct.finalImages && vendorProduct.finalImages.length > 0;

  // Trouver l'image finale correspondant à la couleur sélectionnée
  const getFinalImage = () => {
    if (!hasFinalImages) return null;
    // Chercher par colorVariationId, sinon prendre la première
    return vendorProduct.finalImages.find((fi: any) => fi.colorId === item.colorVariationId)
      || vendorProduct.finalImages[0];
  };

  const finalImage = getFinalImage();

  return (
    <div className="relative flex flex-col gap-1">
      <div className="w-32 h-32 bg-white rounded-lg border border-gray-200 overflow-hidden">
        {finalImage ? (
          // 🆕 Afficher l'image finale pré-générée (mockup + design)
          <img
            src={finalImage.finalImageUrl}
            alt={`${vendorProduct.vendorName} - ${finalImage.colorName}`}
            className="w-full h-full object-contain"
          />
        ) : (
          // Fallback sur SimpleProductPreview si pas de finalImages
          <SimpleProductPreview
            product={vendorProduct}
            showColorSlider={false}
            showDelimitations={false}
            onProductClick={() => {}}
            hideValidationBadges={true}
            initialColorId={item.colorVariationId}
            imageObjectFit="contain"
          />
        )}
      </div>
      <div className="text-center text-[10px] font-semibold text-purple-600">
        🏪 Design vendeur
      </div>
    </div>
  );
};

// 🎨 Composant pour afficher un produit avec personnalisations multi-vues
const ProductWithDesign: React.FC<{
  item: CartItem;
  user: any;
}> = ({ item, user }) => {
  // 🆕 État pour gérer la vue sélectionnée
  const [selectedViewIndex, setSelectedViewIndex] = useState(0);

  // 🆕 Récupérer toutes les vues disponibles depuis les customizationIds
  // 🔧 Filtrer par couleur sélectionnée et dédupliquer par viewId
  const availableViews = React.useMemo(() => {
    console.log('🔍 [CartSidebar] availableViews - Données entrée:', {
      hasCustomizationIds: !!item.customizationIds,
      customizationIdsKeys: item.customizationIds ? Object.keys(item.customizationIds) : [],
      colorVariationId: item.colorVariationId,
      hasDelimitations: !!item.delimitations,
      delimitationsCount: item.delimitations?.length || 0,
      vendorProductId: item.vendorProductId
    });

    if (!item.customizationIds) {
      console.log('⚠️ [CartSidebar] Pas de customizationIds, retour vide');
      return [];
    }

    // Map pour dédupliquer par viewId
    const uniqueViewsMap = new Map<number, {
      viewKey: string;
      colorId: number;
      viewId: number;
      viewType: string;
      delimitation: any;
    }>();

    Object.keys(item.customizationIds).forEach(viewKey => {
      const [colorId, viewId] = viewKey.split('-').map(Number);
      console.log(`🔍 [CartSidebar] Traitement vue ${viewKey} - colorId: ${colorId}, viewId: ${viewId}`);

      // 🔧 Si colorVariationId est défini, filtrer pour ne garder que cette couleur
      if (item.colorVariationId && colorId !== item.colorVariationId) {
        console.log(`🎨 [CartSidebar] Vue ${viewKey} ignorée (couleur ${colorId} != ${item.colorVariationId})`);
        return;
      }

      // Ne garder que la première occurrence de chaque viewId
      if (!uniqueViewsMap.has(viewId)) {
        // Trouver la délimitation correspondante
        const delimitation = item.delimitations?.find((d: any) => d.viewId === viewId);
        console.log(`🔍 [CartSidebar] Recherche délimitation pour viewId ${viewId}:`, {
          found: !!delimitation,
          viewType: delimitation?.viewType,
          imageUrl: delimitation?.imageUrl?.substring(0, 50)
        });

        uniqueViewsMap.set(viewId, {
          viewKey,
          colorId,
          viewId,
          viewType: delimitation?.viewType || 'OTHER',
          delimitation
        });

        console.log(`✅ [CartSidebar] Vue ${viewKey} ajoutée (${delimitation?.viewType || 'OTHER'})`);
      }
    });

    const result = Array.from(uniqueViewsMap.values());
    console.log(`📦 [CartSidebar] ${result.length} vue(s) disponible(s) pour la couleur ${item.colorVariationId || 'toutes'}`);
    return result;
  }, [item.customizationIds, item.delimitations, item.colorVariationId]);

  // Vue actuellement sélectionnée
  const currentView = availableViews[selectedViewIndex];

  // 🆕 Récupérer les éléments de design pour la vue actuelle uniquement
  const getCurrentViewElements = () => {
    if (!currentView) return [];

    // Utiliser le nouveau système organisé par vue
    if (item.designElementsByView) {
      // 🔧 Chercher les éléments pour cette vue
      let elements = item.designElementsByView[currentView.viewKey];

      // Si pas trouvé, chercher par viewId dans tous les viewKey disponibles
      if (!elements || elements.length === 0) {
        for (const [key, value] of Object.entries(item.designElementsByView)) {
          const [, viewId] = key.split('-').map(Number);
          if (viewId === currentView.viewId && value.length > 0) {
            elements = value;
            break;
          }
        }
      }

      return elements || [];
    }

    // 🆕 Fallback pour les produits vendeur avec design legacy (sans designElementsByView)
    if (item.vendorProductId && item.designUrl && item.designPositions) {
      console.log('🔧 [CartSidebar] Création d\'élément de design legacy pour produit vendeur');
      return [{
        id: `design-${item.vendorProductId}-legacy`,
        type: 'image',
        imageUrl: item.designUrl,
        x: item.designPositions.x || 0.5,
        y: item.designPositions.y || 0.5,
        width: (item.designPositions.designWidth || 200) * (item.designPositions.scale || 0.8),
        height: (item.designPositions.designHeight || 200) * (item.designPositions.scale || 0.8),
        rotation: item.designPositions.rotation || 0,
        zIndex: 1
      }];
    }

    // Fallback sur l'ancien système (pour compatibilité)
    return item.designElements || [];
  };

  // Traduire le viewType en français
  const getViewName = (viewType: string, totalViews: number = 1): string => {
    const viewNames: Record<string, string> = {
      'FRONT': 'Devant',
      'BACK': 'Arrière',
      'LEFT': 'Gauche',
      'RIGHT': 'Droite',
      'TOP': 'Dessus',
      'BOTTOM': 'Dessous',
      'DETAIL': 'Détail',
      'OTHER': 'Autre'
    };

    // Si c'est 'OTHER' et qu'il n'y a qu'une seule vue, utiliser un nom plus descriptif
    if (viewType?.toUpperCase() === 'OTHER' && totalViews === 1) {
      return 'Personnalisation';
    }

    // Si le viewType est reconnu, l'utiliser
    const translatedName = viewNames[viewType?.toUpperCase()];
    if (translatedName) {
      return translatedName;
    }

    // Sinon, utiliser le viewType tel quel ou 'Vue' par défaut
    return viewType || 'Vue';
  };

  const currentViewElements = getCurrentViewElements();
  const currentDelimitation = currentView?.delimitation;

  // 🆕 Obtenir l'URL de l'image pour la vue actuelle
  const currentImageUrl = currentDelimitation?.imageUrl || item.imageUrl;

  // Déterminer le type de produit
  const isVendorProduct = !!item.vendorProductId;
  const isCustomProduct = !isVendorProduct && item.customizationIds && Object.keys(item.customizationIds).length > 0;

  // Log de débogage pour le design
  useEffect(() => {
    console.log('🔍 [CartSidebar] ProductWithDesign - Item:', {
      id: item.id,
      type: isVendorProduct ? '🏪 VENDOR PRODUCT' : isCustomProduct ? '🎨 CUSTOM PRODUCT' : '📦 STANDARD PRODUCT',
      vendorProductId: item.vendorProductId,
      vendorName: item.vendorName,
      availableViewsCount: availableViews.length,
      selectedViewIndex,
      currentView: currentView ? {
        viewKey: currentView.viewKey,
        viewType: currentView.viewType,
        hasDelimitation: !!currentView.delimitation
      } : null,
      hasDesignElementsByView: !!item.designElementsByView,
      currentViewElementsCount: currentViewElements.length,
      customizationIds: item.customizationIds,
      designUrl: item.designUrl,
      designId: item.designId
    });

    if (currentViewElements.length > 0) {
      console.log('🎨 [CartSidebar] Current View Elements:', {
        productType: isVendorProduct ? 'VENDOR' : 'CUSTOM',
        viewKey: currentView?.viewKey,
        count: currentViewElements.length,
        elements: currentViewElements.map((el, idx) => ({
          index: idx,
          type: el.type,
          text: el.text?.substring(0, 20),
          imageUrl: el.imageUrl?.substring(0, 50),
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height
        }))
      });
    } else {
      console.log('⚠️ [CartSidebar] Aucun élément de design pour cette vue');
    }
  }, [item, currentView, currentViewElements, selectedViewIndex, isVendorProduct, isCustomProduct]);

  return (
    <div className="relative flex flex-col gap-1">
      {/* 🆕 Utilisation de CustomizationPreview pour un rendu cohérent */}
      <div className="relative w-32 h-32 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <CustomizationPreview
          productImageUrl={currentImageUrl}
          designElements={currentViewElements}
          delimitation={currentDelimitation}
          productName={item.name}
          showInfo={false}
          className="w-full h-full"
        />
      </div>

      {/* 🆕 Navigation entre les vues (si plusieurs vues disponibles) */}
      {availableViews.length > 1 && (
        <div className="flex items-center justify-center gap-1">
          {availableViews.map((view, index) => (
            <button
              key={view.viewKey}
              onClick={() => setSelectedViewIndex(index)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                selectedViewIndex === index
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={getViewName(view.viewType, availableViews.length)}
            >
              {getViewName(view.viewType, availableViews.length)}
            </button>
          ))}
        </div>
      )}

      {/* Badge pour indiquer les personnalisations ou produit vendeur */}
      {availableViews.length > 0 && (
        <div className="text-center text-[10px] text-gray-500">
          {isVendorProduct ? (
            <>
              <span className="font-semibold">🏪 Design vendeur</span>
              {availableViews.length > 1 && ` • ${availableViews.length} vue${availableViews.length > 1 ? 's' : ''}`}
            </>
          ) : (
            <>
              {availableViews.length} vue{availableViews.length > 1 ? 's' : ''} personnalisée{availableViews.length > 1 ? 's' : ''}
            </>
          )}
        </div>
      )}

      {/* Badge pour produits vendeur sans vues multiples mais avec design */}
      {isVendorProduct && availableViews.length === 0 && item.designUrl && (
        <div className="text-center text-[10px] font-semibold text-purple-600">
          🏪 Design vendeur
        </div>
      )}
    </div>
  );
};

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const { user } = useAuth();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {/* Overlay avec fond semi-transparent et backdrop blur */}
      <div
        className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panier latéral avec animation slide */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:max-w-md md:max-w-lg bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* En-tête du panier */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-2xl">
                <ShoppingCart className="w-5 h-5 text-gray-900" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Mon Panier ({totalItems})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-2xl transition-all duration-200 hover:scale-110"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Liste des produits */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {items.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-lg font-semibold mb-2">Votre panier est vide</p>
                  <p className="text-gray-500 text-sm mb-6">
                    Découvrez nos produits et designs personnalisés pour commencer vos achats
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-2.5 rounded-2xl font-semibold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Découvrir les produits
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
                    <div className="flex gap-4">
                      {/* Image du produit avec design intégré */}
                      {item.vendorProductId ? (
                        <VendorProductPreview item={item} />
                      ) : (
                        <ProductWithDesign item={item} user={user} />
                      )}

                      {/* Détails du produit */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                          {item.name}
                        </h3>
                        {item.vendorName && (
                          <p className="text-xs text-gray-500 mb-1">
                            Par {item.vendorName}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                              style={{ backgroundColor: item.colorCode }}
                            />
                            <span className="truncate">{item.color}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="truncate">
                            Taille {item.selectedSize?.sizeName || item.sizeName || item.size}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900 text-base">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Contrôles */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                          aria-label="Supprimer l'article"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>

                        <div className="flex items-center gap-1 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-l-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1}
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-3 h-3 text-gray-600" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-r-xl transition-colors"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pied du panier */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
              {/* Résumé du total */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Sous-total ({totalItems} article{totalItems > 1 ? 's' : ''})</span>
                  <span className="text-base font-semibold text-gray-900">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="space-y-3">
                <button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 py-3.5 rounded-2xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  Commander maintenant
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-white text-gray-700 py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md"
                >
                  Continuer mes achats
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Paiement sécurisé • Frais de port calculés à l'étape suivante
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;