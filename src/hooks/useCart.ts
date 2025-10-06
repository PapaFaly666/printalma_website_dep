import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import type { Order, PaymentMethod } from '../types/order';

export interface CartItem {
  productId: number;
  productName: string;
  selectedColor: {
    id: number;
    name: string;
    hexCode: string;
    imageUrl: string;
  };
  selectedColorId?: number;
  selectedColorObject?: {
    id: number;
    name: string;
    hexCode?: string;
    imageUrl?: string;
  };
  selectedSize: {
    id: number;
    name: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage: string;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Sauvegarder le panier dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Ajouter un article au panier
  const addToCart = (newItem: CartItem) => {
    setIsLoading(true);
    
    try {
      setCartItems(prevItems => {
        // Vérifier si l'article existe déjà
        const existingItemIndex = prevItems.findIndex(
          item => 
            item.productId === newItem.productId &&
            item.selectedColor.id === newItem.selectedColor.id &&
            item.selectedSize.id === newItem.selectedSize.id
        );

        if (existingItemIndex >= 0) {
          // Mettre à jour la quantité
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex].quantity += newItem.quantity;
          updatedItems[existingItemIndex].totalPrice = 
            updatedItems[existingItemIndex].unitPrice * updatedItems[existingItemIndex].quantity;
          return updatedItems;
        } else {
          // Ajouter le nouvel article
          return [...prevItems, newItem];
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Retirer un article du panier
  const removeFromCart = (productId: number, colorId: number, sizeId: number) => {
    setCartItems(prevItems => 
      prevItems.filter(item => 
        !(item.productId === productId && 
          item.selectedColor.id === colorId && 
          item.selectedSize.id === sizeId)
      )
    );
  };

  // Mettre à jour la quantité d'un article
  const updateQuantity = (productId: number, colorId: number, sizeId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, colorId, sizeId);
      return;
    }

    setCartItems(prevItems => 
      prevItems.map(item => 
        item.productId === productId && 
        item.selectedColor.id === colorId && 
        item.selectedSize.id === sizeId
          ? { 
              ...item, 
              quantity: newQuantity, 
              totalPrice: item.unitPrice * newQuantity 
            }
          : item
      )
    );
  };

  // Vider le panier
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculer le total du panier
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  // Calculer le nombre total d'articles
  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Créer une commande à partir du panier
  const createOrder = async (shippingDetails: any, paymentMethod: PaymentMethod): Promise<Order> => {
    if (cartItems.length === 0) {
      throw new Error('Le panier est vide');
    }

    try {
      setIsLoading(true);
      
      // Convertir les items du panier au format compatible avec CartPage et le nouveau système colorId
      const cartItemsForOrder = cartItems.map(item => ({
        id: item.productId.toString(),
        productId: item.productId,
        title: item.productName,
        price: `${item.unitPrice} CFA`,
        image: item.productImage,
        quantity: item.quantity,
        size: item.selectedSize.name,
        color: item.selectedColor.name,
        selectedColorId: item.selectedColorId || item.selectedColor.id,
        selectedColorObject: item.selectedColorObject || {
          id: item.selectedColor.id,
          name: item.selectedColor.name,
          hexCode: item.selectedColor.hexCode,
          imageUrl: item.selectedColor.imageUrl
        },
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        unitPrice: item.unitPrice
      }));

      const order = await orderService.createOrderFromCart(
        cartItemsForOrder,
        shippingDetails,
        paymentMethod
      );

      // Vider le panier après la commande réussie
      clearCart();
      
      return order;
    } finally {
      setIsLoading(false);
    }
  };

  // Formater le prix en FCFA
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(price);
  };

  return {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    createOrder,
    formatPrice
  };
}; 