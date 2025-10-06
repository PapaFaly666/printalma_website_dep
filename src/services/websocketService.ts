import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Types pour les notifications WebSocket
interface BaseNotification {
  type: string;
  title: string;
  message: string;
  timestamp: string;
}

interface NewOrderNotification extends BaseNotification {
  type: 'NEW_ORDER';
  data: {
    orderId: number;
    orderNumber: string;
    totalAmount: number;
    customerName: string;
    customerEmail: string;
    itemsCount: number;
    createdAt: string;
  };
}

interface OrderStatusChangedNotification extends BaseNotification {
  type: 'ORDER_STATUS_CHANGED';
  data: {
    orderId: number;
    orderNumber: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    customerEmail: string;
  };
}

interface MyOrderUpdatedNotification extends BaseNotification {
  type: 'MY_ORDER_UPDATED';
  data: {
    orderId: number;
    orderNumber: string;
    status: string;
    statusLabel: string;
  };
}

type OrderNotification = NewOrderNotification | OrderStatusChangedNotification | MyOrderUpdatedNotification;

export class WebSocketService {
  private socket: Socket | null = null;
  private baseURL = API_BASE_URL;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Callbacks pour les différents événements
  public onConnect?: () => void;
  public onDisconnect?: () => void;
  public onNewOrder?: (notification: NewOrderNotification) => void;
  public onOrderStatusChanged?: (notification: OrderStatusChangedNotification) => void;
  public onMyOrderUpdated?: (notification: MyOrderUpdatedNotification) => void;
  public onError?: (error: any) => void;

  // ==========================================
  // CONNEXION WEBSOCKET
  // ==========================================

  connectWebSocket(token?: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket déjà connecté');
      return;
    }

    console.log('🔌 Connexion WebSocket...', this.baseURL);

    // Configuration pour l'authentification par cookies
    this.socket = io(`${this.baseURL}/orders`, {
      // ⭐ PAS DE TOKEN - Utiliser les cookies automatiquement
      // Le backend lira le token depuis les cookies HTTP-only
      withCredentials: true, // ⭐ IMPORTANT: Envoyer les cookies
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: false, // ⭐ Gérer manuellement la reconnexion
      timeout: 20000,
      forceNew: true, // ⭐ Nouvelle connexion à chaque fois
      // Désactiver l'auth par token car on utilise les cookies
      auth: undefined
    });

    this.setupEventListeners();
  }

  // ==========================================
  // CONFIGURATION DES ÉVÉNEMENTS
  // ==========================================

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket déconnecté:', reason);
      this.onDisconnect?.();
      
      // Tentative de reconnexion automatique pour certaines raisons
      if (reason === 'io server disconnect') {
        // Le serveur a fermé la connexion, reconnexion manuelle
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion WebSocket:', error);
      this.onError?.(error);
      this.handleReconnection();
    });

    // Événements de notification
    this.socket.on('newOrder', (notification: NewOrderNotification) => {
      console.log('🆕 Nouvelle commande:', notification);
      this.onNewOrder?.(notification);
      this.showBrowserNotification(notification);
    });

    this.socket.on('orderStatusChanged', (notification: OrderStatusChangedNotification) => {
      console.log('📝 Statut modifié:', notification);
      this.onOrderStatusChanged?.(notification);
      this.showBrowserNotification(notification);
    });

    this.socket.on('myOrderUpdated', (notification: MyOrderUpdatedNotification) => {
      console.log('📦 Ma commande mise à jour:', notification);
      this.onMyOrderUpdated?.(notification);
      this.showBrowserNotification(notification);
    });

    // Événement ping/pong pour tester la connexion
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong reçu:', data);
    });

    // Gestion des erreurs
    this.socket.on('error', (error) => {
      console.error('❌ Erreur WebSocket:', error);
      this.onError?.(error);
    });
  }

  // ==========================================
  // GESTION DE LA RECONNEXION
  // ==========================================

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.socket?.connect();
    }, delay);
  }

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  // Envoyer un ping pour tester la connexion
  ping(): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket non connecté');
      return;
    }

    this.socket.emit('ping', { 
      timestamp: new Date().toISOString() 
    });
  }

  // Vérifier le statut de la connexion
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Obtenir l'ID de la socket
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Déconnexion propre
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    console.log('🔌 WebSocket déconnecté proprement');
  }

  // Reconnecter manuellement
  reconnect(token?: string): void {
    this.disconnect();
    setTimeout(() => {
      this.connectWebSocket(token);
    }, 1000);
  }

  // ==========================================
  // NOTIFICATIONS NAVIGATEUR
  // ==========================================

  private async showBrowserNotification(notification: OrderNotification): Promise<void> {
    // Vérifier les permissions de notification
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `order-${notification.data.orderId}`,
        requireInteraction: false,
        silent: false
      });
    }
  }

  // Demander les permissions de notification
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Les notifications ne sont pas supportées par ce navigateur');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Permission de notification:', permission);
    return permission;
  }

  // ==========================================
  // MÉTHODES STATIQUES UTILITAIRES
  // ==========================================

  static formatNotificationMessage(notification: OrderNotification): string {
    switch (notification.type) {
      case 'NEW_ORDER':
        return `Nouvelle commande ${notification.data.orderNumber} - ${notification.data.totalAmount.toLocaleString()} CFA`;
      
      case 'ORDER_STATUS_CHANGED':
        return `Commande ${notification.data.orderNumber}: ${notification.data.previousStatus} → ${notification.data.newStatus}`;
      
      case 'MY_ORDER_UPDATED':
        return `Votre commande ${notification.data.orderNumber} est maintenant: ${notification.data.statusLabel}`;
      
      default:
        // TS: all union cases are covered above; default is for safety at runtime
        return (notification as unknown as BaseNotification).message;
    }
  }

  static getNotificationIcon(type: string): string {
    switch (type) {
      case 'NEW_ORDER':
        return '🆕';
      case 'ORDER_STATUS_CHANGED':
        return '📝';
      case 'MY_ORDER_UPDATED':
        return '📦';
      default:
        return '🔔';
    }
  }

  static getNotificationColor(type: string): string {
    switch (type) {
      case 'NEW_ORDER':
        return '#28a745';
      case 'ORDER_STATUS_CHANGED':
        return '#007bff';
      case 'MY_ORDER_UPDATED':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  }
}

// Export du service singleton
export const websocketService = new WebSocketService();
export default websocketService; 