import { CartItem } from '../../types/order';
import { orderService } from '../../services/orderService';

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
        <span>{totals.subtotal.toLocaleString()} FCFA</span>
      </div>
      <div className="line-item">
        <span>TVA (18%):</span>
        <span>{totals.taxAmount.toLocaleString()} FCFA</span>
      </div>
      <div className="line-item">
        <span>Livraison:</span>
        <span>
          {totals.freeShipping ? (
            <span className="free">Gratuite ✨</span>
          ) : (
            `${totals.shippingAmount.toLocaleString()} FCFA`
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
          Total: {totals.totalAmount.toLocaleString()} FCFA
        </strong>
      </div>
    </div>
  );
}; 