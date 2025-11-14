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
    id: number;
    name: string;
    price: number;
    suggestedPrice?: number;
    color: string;
    colorCode: string;
    size: string;
    imageUrl: string;
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
    designElements?: any[];
  }) => void;
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

  // Sauvegarder le panier dans le localStorage à chaque modification
  useEffect(() => {
    if (items.length > 0) {
      console.log('💾 [CartContext] Sauvegarde panier dans localStorage:', {
        itemCount: items.length,
        itemsWithCustomization: items.filter(i => i.customizationId).length,
        itemsWithElements: items.filter(i => i.designElements && i.designElements.length > 0).length
      });
      localStorage.setItem('cart', JSON.stringify(items));
    } else {
      localStorage.removeItem('cart');
    }
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: {
    id: number;
    name: string;
    price: number;
    suggestedPrice?: number;
    color: string;
    colorCode: string;
    size: string;
    imageUrl: string;
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
    designElements?: any[];
  }) => {
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
        // Si le produit existe déjà avec la même taille, augmenter la quantité
        console.log('🛒 [CartContext] Produit existant trouvé, incrémentation quantité:', {
          productId: product.id,
          color: product.color,
          size: sizeValue,
          existingQuantity: existingItem.quantity
        });
        const updatedItems = prevItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + 1 }
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
          productId: product.id,
          name: product.name,
          price: product.price,
          suggestedPrice: product.suggestedPrice,
          color: product.color,
          colorCode: product.colorCode,
          size: product.size,
          imageUrl: product.imageUrl,
          designUrl: product.designUrl,
          vendorName: product.vendorName,
          quantity: 1,
          // Nouvelles propriétés pour afficher le design
          designId: product.designId,
          adminProductId: product.adminProductId,
          designScale: product.designScale,
          delimitations: product.delimitations,
          // Propriétés pour les vraies tailles de la base de données
          selectedSize: product.selectedSize,
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
          designElements: product.designElements
        };

        console.log('🎨 [CartContext] Personnalisation incluse:', {
          customizationId: newItem.customizationId,
          hasDesignElements: !!newItem.designElements,
          designElementsLength: newItem.designElements?.length,
          designElements: newItem.designElements
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

    // Ouvrir le panier après ajout
    console.log('🛒 [CartContext] Ouverture du panier');
    setIsOpen(true);
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