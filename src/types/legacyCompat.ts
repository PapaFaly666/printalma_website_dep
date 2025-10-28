// Fichier de compatibilité pour les anciens composants
// Ces déclarations permettent de maintenir la compatibilité avec le code existant

// Déclaration pour OrderService avec les anciennes méthodes
declare module '../services/orderService' {
  interface OrderService {
    // Anciennes méthodes pour compatibilité
    getAllOrders?(): Promise<any>;
    handleError?(error: any, context?: string): string;
    calculateOrderTotals?(items: any[]): any;
    createOrderFromCart?(cartItems: any[], shippingInfo: any): Promise<any>;
  }
}

// Déclaration pour le contexte de panier
declare module '../contexts/CartContext' {
  interface CartContextType {
    // Méthode de compatibilité
    createOrderFromCart?(cartItems: any[], shippingInfo: any, onSuccess?: () => void, onError?: (error: string) => void): Promise<void>;
  }
}