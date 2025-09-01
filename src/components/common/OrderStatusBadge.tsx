import { OrderStatus } from '../../types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge = ({ status, className = '' }: OrderStatusBadgeProps) => {
  const getStatusConfig = (status: OrderStatus) => {
    const statusConfig = {
      'PENDING': { color: 'orange', text: 'En attente' },
      'CONFIRMED': { color: 'blue', text: 'Confirmée' },
      'PROCESSING': { color: 'purple', text: 'En traitement' },
      'SHIPPED': { color: 'indigo', text: 'Expédiée' },
      'DELIVERED': { color: 'green', text: 'Livrée' },
      'CANCELLED': { color: 'red', text: 'Annulée' }
    };
    
    return statusConfig[status] || { color: 'gray', text: status };
  };

  const config = getStatusConfig(status);

  return (
    <span className={`badge badge-${config.color} ${className}`}>
      {config.text}
    </span>
  );
}; 