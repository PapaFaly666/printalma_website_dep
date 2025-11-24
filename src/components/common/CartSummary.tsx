import { CartItem } from '../../types/order';
import { orderService } from '../../services/orderService';
import { formatPriceInFRF as formatPrice } from '../../utils/priceUtils';

interface CartSummaryProps {
  items: CartItem[];
  className?: string;
}

export const CartSummary = ({ items, className = '' }: CartSummaryProps) => {
  const totals = orderService.calculateOrderTotals(items);

  return (
    <div className={`cart-summary ${className}`}>
      <div className="line-item">
        <span>Sous-total:</span>
        <span>{formatPrice(totals.subtotal)}</span>
      </div>
      <div className="line-item">
        <span>TVA (18%):</span>
        <span>{formatPrice(totals.taxAmount)}</span>
      </div>
      <div className="line-item">
        <span>Livraison:</span>
        <span>
          {totals.freeShipping ? (
            <span className="free">Gratuite ✨</span>
          ) : (
            formatPrice(totals.shippingAmount)
          )}
        </span>
      </div>
      {!totals.freeShipping && (
        <div className="shipping-notice">
          Livraison gratuite à partir de 50 000 FCFA
        </div>
      )}
      <div className="total">
        <strong>
          Total: {formatPrice(totals.totalAmount)}
        </strong>
      </div>
    </div>
  );
}; 