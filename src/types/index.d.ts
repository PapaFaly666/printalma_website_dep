// Fichier de déclaration globale pour les compatibilités
// Ce fichier permet de résoudre les erreurs de type dans les composants existants

// Extensions pour le service OrderService
declare module '../services/orderService' {
  interface OrderService {
    // Méthodes legacy pour compatibilité avec les composants existants
    getAllOrders?(): Promise<any>;
    handleError?(error: any, context?: string): string;
    calculateOrderTotals?(items: any[]): any;
    createOrderFromCart?(cartItems: any[], shippingInfo: any, paymentMethod?: string): Promise<any>;
  }
}

// Extensions pour le contexte de panier
declare module '../contexts/CartContext' {
  interface CartContextType {
    // Méthode de compatibilité pour useCart
    createOrderFromCart?(cartItems: any[], shippingInfo: any, onSuccess?: () => void, onError?: (error: string) => void): Promise<void>;
  }
}