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
      name: string;
    };
    sizeId?: number;
    sizeName?: string;
  }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
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
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Sauvegarder le panier dans le localStorage à chaque modification
  useEffect(() => {
    if (items.length > 0) {
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
      name: string;
    };
    sizeId?: number;
    sizeName?: string;
  }) => {
    console.log('🛒 [CartContext] Ajout au panier:', product);
    // Utiliser la vraie taille si disponible, sinon la taille de base
    const sizeValue = product.selectedSize?.name || product.sizeName || product.size;
    const cartItemId = `${product.id}-${product.color}-${sizeValue}`;
    console.log('🛒 [CartContext] CartItem ID:', cartItemId);
    console.log('🛒 [CartContext] Taille utilisée:', sizeValue);

    setItems(prevItems => {
      console.log('🛒 [CartContext] Articles précédents:', prevItems.length);
      const existingItem = prevItems.find(item => item.id === cartItemId);

      if (existingItem) {
        // Si le produit existe déjà, augmenter la quantité
        console.log('🛒 [CartContext] Produit existant, incrémentation quantité');
        return prevItems.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Sinon, ajouter le nouveau produit
        console.log('🛒 [CartContext] Nouveau produit, ajout au panier');
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          price: product.price,
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
          sizeName: product.sizeName
        };
        return [...prevItems, newItem];
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

  const value: CartContextType = {
    items,
    itemCount,
    isOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    openCart,
    closeCart,
    clearCart
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