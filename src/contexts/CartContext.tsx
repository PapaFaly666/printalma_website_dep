import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types/cart';

// Interface pour les délimitations
interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  isOpen: boolean;
  addToCart: (product: {
    id: number | string;
    name: string;
    price: number;
    suggestedPrice?: number;
    color: string;
    colorCode: string;
    colorVariationId?: number; // 🆕 ID de la variation de couleur
    size: string;
    imageUrl: string;
    quantity?: number;
    designUrl?: string;
    vendorName?: string;
    // Propriétés pour afficher le design
    designId?: number;
    adminProductId?: number;
    designScale?: number;
    delimitations?: DelimitationData[];
    // Propriétés pour les vraies tailles de la base de données
    selectedSize?: {
      id: number;
      sizeName: string;
    };
    selectedSizes?: Array<{
      size: string;
      sizeId?: number;
      quantity: number;
    }>;
    sizeId?: number;
    sizeName?: string;
    // 🎨 Nouveaux champs pour la sauvegarde du design
    vendorProductId?: number;
    mockupUrl?: string;
    designPositions?: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      designWidth?: number;
      designHeight?: number;
    };
    designMetadata?: {
      designName?: string;
      designCategory?: string;
      designImageUrl?: string;
      appliedAt?: string;
    };
    delimitation?: DelimitationData;
    // 🆕 Personnalisation
    customizationId?: number;
    customizationIds?: Record<string, number>; // 🆕 Plusieurs IDs de personnalisation
    designElements?: any[]; // @deprecated
    designElementsByView?: Record<string, any[]>; // 🆕 Organisé par vue
  }, options?: { openCartAfterAdd?: boolean }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Charger le panier depuis le localStorage au démarrage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('📥 [CartContext] Chargement panier depuis localStorage:', {
          itemCount: parsedCart.length,
          itemsWithCustomization: parsedCart.filter((i: CartItem) => i.customizationId).length,
          itemsWithElements: parsedCart.filter((i: CartItem) => i.designElements && i.designElements.length > 0).length,
          sample: parsedCart[0] ? {
            id: parsedCart[0].id,
            customizationId: parsedCart[0].customizationId,
            designElementsCount: parsedCart[0].designElements?.length
          } : null
        });
        setItems(parsedCart);
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // 🆕 Fonction pour nettoyer les éléments avant sauvegarde localStorage
  const cleanItemsForStorage = (items: CartItem[]): CartItem[] => {
    return items.map(item => {
      // Nettoyer designElementsByView pour supprimer les Data URLs
      let cleanedDesignElementsByView = item.designElementsByView;

      if (cleanedDesignElementsByView) {
        const cleaned: Record<string, any[]> = {};
        Object.entries(cleanedDesignElementsByView).forEach(([viewKey, elements]) => {
          cleaned[viewKey] = elements.map(element => {
            // Si c'est une image avec une Data URL, la supprimer (trop volumineuse)
            if (element.type === 'image' && element.imageUrl?.startsWith('data:')) {
              return {
                ...element,
                imageUrl: undefined, // Supprimer la Data URL
                _hasDataUrl: true, // Marquer qu'elle avait une Data URL
              };
            }
            return element;
          });
        });
        cleanedDesignElementsByView = cleaned;
      }

      // Nettoyer designElements (déprécié mais encore utilisé)
      let cleanedDesignElements = item.designElements;
      if (cleanedDesignElements) {
        cleanedDesignElements = cleanedDesignElements.map(element => {
          if (element.type === 'image' && element.imageUrl?.startsWith('data:')) {
            return {
              ...element,
              imageUrl: undefined,
              _hasDataUrl: true,
            };
          }
          return element;
        });
      }

      return {
        ...item,
        designElementsByView: cleanedDesignElementsByView,
        designElements: cleanedDesignElements,
      };
    });
  };

  // Sauvegarder le panier dans le localStorage à chaque modification
  useEffect(() => {
    if (items.length > 0) {
      console.log('💾 [CartContext] Sauvegarde panier dans localStorage:', {
        itemCount: items.length,
        itemsWithCustomization: items.filter(i => i.customizationId).length,
        itemsWithElements: items.filter(i => i.designElements && i.designElements.length > 0).length
      });

      // 🆕 Nettoyer les items avant sauvegarde
      const cleanedItems = cleanItemsForStorage(items);

      try {
        localStorage.setItem('cart', JSON.stringify(cleanedItems));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('❌ [CartContext] Quota localStorage dépassé, nettoyage du panier...');
          // En dernier recours, vider le panier
          localStorage.removeItem('cart');
          console.warn('⚠️ [CartContext] Panier vidé du localStorage pour libérer de l\'espace');
        } else {
          console.error('❌ [CartContext] Erreur sauvegarde panier:', error);
        }
      }
    } else {
      localStorage.removeItem('cart');
    }
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: {
    id: number | string;
    productId?: number; // ✅ Ajouter productId explicite
    name: string;
    price: number;
    suggestedPrice?: number;
    color: string;
    colorCode: string;
    colorVariationId?: number; // 🆕 ID de la variation de couleur
    size: string;
    imageUrl: string;
    quantity?: number;
    designUrl?: string;
    vendorName?: string;
    designId?: number;
    adminProductId?: number;
    designScale?: number;
    delimitations?: DelimitationData[];
    selectedSize?: {
      id: number;
      sizeName: string;
    };
    selectedSizes?: Array<{
      size: string;
      sizeId?: number;
      quantity: number;
    }>;
    sizeId?: number;
    sizeName?: string;
    vendorProductId?: number;
    mockupUrl?: string;
    designPositions?: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      designWidth?: number;
      designHeight?: number;
    };
    designMetadata?: {
      designName?: string;
      designCategory?: string;
      designImageUrl?: string;
      appliedAt?: string;
    };
    delimitation?: DelimitationData;
    customizationId?: number;
    customizationIds?: Record<string, number>; // 🆕 Plusieurs IDs de personnalisation
    designElements?: any[]; // @deprecated
    designElementsByView?: Record<string, any[]>; // 🆕 Organisé par vue
    // ✅ Support stickers
    productType?: 'STICKER' | 'PRODUCT';
    stickerId?: number;
  }, options?: { openCartAfterAdd?: boolean }) => {
    console.log('🛒 [CartContext] Ajout au panier:', product);
    // Utiliser la vraie taille si disponible, sinon la taille de base
    const sizeValue = product.selectedSize?.sizeName || product.sizeName || product.size;
    const cartItemId = `${product.id}-${product.color}-${sizeValue}`;
    console.log('🛒 [CartContext] CartItem ID:', cartItemId);
    console.log('🛒 [CartContext] Taille utilisée:', sizeValue);

    setItems(prevItems => {
      console.log('🛒 [CartContext] Articles précédents:', prevItems.length);

      // Chercher un article existant avec le même produit, couleur ET taille
      const existingItem = prevItems.find(item => {
        const itemSizeValue = item.selectedSize?.sizeName || item.sizeName || item.size;
        return item.productId === product.id &&
               item.color === product.color &&
               itemSizeValue === sizeValue;
      });

      if (existingItem) {
        // Si le produit existe déjà avec la même taille, ajouter la quantité spécifiée
        console.log('🛒 [CartContext] Produit existant trouvé, ajout de la quantité:', {
          productId: product.id,
          color: product.color,
          size: sizeValue,
          existingQuantity: existingItem.quantity,
          addingQuantity: product.quantity || 1
        });
        const updatedItems = prevItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );

        // Afficher tous les articles du panier après la modification
        console.log('🛒 [CartContext] État du panier après ajout:', updatedItems.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          color: item.color,
          size: item.size,
          selectedSize: item.selectedSize,
          sizeId: item.sizeId,
          sizeName: item.sizeName,
          displaySize: item.selectedSize?.sizeName || item.sizeName || item.size,
          quantity: item.quantity
        })));

        return updatedItems;
      } else {
        // Sinon, ajouter le nouveau produit
        console.log('🛒 [CartContext] Nouveau produit, ajout au panier');
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.productId || (typeof product.id === 'number' ? product.id : parseInt(product.id as string)),
          name: product.name,
          price: product.price,
          suggestedPrice: product.suggestedPrice,
          color: product.color,
          colorCode: product.colorCode,
          colorVariationId: product.colorVariationId, // 🆕 ID de la variation de couleur
          size: product.size,
          imageUrl: product.imageUrl,
          designUrl: product.designUrl,
          vendorName: product.vendorName,
          quantity: product.quantity || 1,
          // Nouvelles propriétés pour afficher le design
          designId: product.designId,
          adminProductId: product.adminProductId,
          designScale: product.designScale,
          delimitations: product.delimitations,
          // Propriétés pour les vraies tailles de la base de données
          selectedSize: product.selectedSize,
          selectedSizes: product.selectedSizes, // 🆕 Support des tailles multiples
          sizeId: product.sizeId,
          sizeName: product.sizeName,
          // 🎨 Nouveaux champs pour la sauvegarde du design dans les commandes
          vendorProductId: product.vendorProductId,
          mockupUrl: product.mockupUrl,
          designPositions: product.designPositions,
          designMetadata: product.designMetadata,
          delimitation: product.delimitation,
          // 🆕 Personnalisation
          customizationId: product.customizationId,
          customizationIds: product.customizationIds, // 🆕 Plusieurs IDs
          designElements: product.designElements, // @deprecated
          designElementsByView: product.designElementsByView, // 🆕 Organisé par vue
          // ✅ Support stickers
          productType: product.productType,
          stickerId: product.stickerId
        };

        console.log('🎨 [CartContext] Personnalisation incluse:', {
          customizationId: newItem.customizationId,
          customizationIds: newItem.customizationIds,
          customizationIdsKeys: Object.keys(newItem.customizationIds || {}),
          hasDesignElements: !!newItem.designElements,
          designElementsLength: newItem.designElements?.length,
          hasDesignElementsByView: !!newItem.designElementsByView,
          viewsCount: Object.keys(newItem.designElementsByView || {}).length,
          designElementsByViewKeys: Object.keys(newItem.designElementsByView || {}),
          colorVariationId: newItem.colorVariationId,
          vendorProductId: newItem.vendorProductId,
          designUrl: newItem.designUrl,
          delimitationsCount: newItem.delimitations?.length || 0
        });

        console.log('🛒 [CartContext] Nouvel article créé:', {
          id: newItem.id,
          productId: newItem.productId,
          name: newItem.name,
          color: newItem.color,
          size: newItem.size,
          selectedSize: newItem.selectedSize,
          sizeId: newItem.sizeId,
          sizeName: newItem.sizeName,
          finalDisplaySize: newItem.selectedSize?.sizeName || newItem.sizeName || newItem.size
        });

        const updatedItems = [...prevItems, newItem];

        // Afficher tous les articles du panier après la modification
        console.log('🛒 [CartContext] État du panier après ajout:', updatedItems.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          color: item.color,
          size: item.size,
          selectedSize: item.selectedSize,
          sizeId: item.sizeId,
          sizeName: item.sizeName,
          displaySize: item.selectedSize?.sizeName || item.sizeName || item.size,
          quantity: item.quantity
        })));

        return updatedItems;
      }
    });

    // Ouvrir le panier après ajout (seulement si demandé, par défaut true)
    const shouldOpenCart = options?.openCartAfterAdd !== false;
    if (shouldOpenCart) {
      console.log('🛒 [CartContext] Ouverture du panier');
      setIsOpen(true);
    } else {
      console.log('🛒 [CartContext] Produit ajouté sans ouvrir le panier');
    }
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const clearCart = () => setItems([]);

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + ((item.suggestedPrice || item.price) * item.quantity), 0);
  };

  const value: CartContextType = {
    items,
    itemCount,
    isOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    openCart,
    closeCart,
    clearCart,
    getTotalPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartProvider;