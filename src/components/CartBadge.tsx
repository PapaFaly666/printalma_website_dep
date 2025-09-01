import { ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCart } from '../hooks/useCart';
import { useNavigate } from 'react-router-dom';

export default function CartBadge() {
  const { getCartItemsCount, cartItems } = useCart();
  const navigate = useNavigate();
  const itemsCount = getCartItemsCount();

  const handleCartClick = () => {
    if (cartItems.length === 0) {
      // Si le panier est vide, rediriger vers les produits
      navigate('/products');
    } else {
      // Créer un objet de commande à partir du premier item du panier (pour compatibilité avec CartPage)
      const firstItem = cartItems[0];
      navigate('/cart', {
        state: {
          product: {
            id: firstItem.productId.toString(),
            title: firstItem.productName,
            price: `${firstItem.unitPrice} CFA`,
            image: firstItem.productImage
          },
          quantity: firstItem.quantity,
          selectedSize: firstItem.selectedSize.name,
          selectedColor: firstItem.selectedColor.name,
          fromCart: true, // Indicateur pour distinguer du panier normal
          allCartItems: cartItems // Passer tous les items du panier
        }
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10"
      onClick={handleCartClick}
      title={itemsCount > 0 ? `${itemsCount} article${itemsCount > 1 ? 's' : ''} dans le panier` : 'Panier vide'}
    >
      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
      {itemsCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3 w-3 sm:h-4 sm:w-4 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
        >
          {itemsCount > 99 ? '99+' : itemsCount}
        </Badge>
      )}
    </Button>
  );
} 