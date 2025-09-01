// Service WebSocket pour les notifications en temps réel PrintAlma
import { io } from 'socket.io-client';

class NotificationWebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
    this.baseUrl = import.meta.env.VITE_WS_URL || 'wss://printalma-back-dep.onrender.com';
  }

  /**
   * 🔌 Connexion au WebSocket des notifications
   */
  connect() {
    if (this.socket?.connected) {
      console.log('🔔 WebSocket notifications déjà connecté');
      return this.socket;
    }

    console.log('🔔 Connexion au WebSocket notifications...');

    this.socket = io(this.baseUrl + '/notifications', {
      withCredentials: true, // Important pour les cookies
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  /**
   * 🔧 Configuration des écouteurs d'événements
   */
  setupEventListeners() {
    // Connexion établie
    this.socket.on('connect', () => {
      console.log('✅ WebSocket notifications connecté:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners('connection', { status: 'connected', id: this.socket.id });
    });

    // Confirmation de connexion du serveur
    this.socket.on('connected', (data) => {
      console.log('🔔 Connecté aux notifications:', data);
      this.notifyListeners('authenticated', data);
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket notifications déconnecté:', reason);
      this.isConnected = false;
      this.notifyListeners('disconnection', { reason });
    });

    // Erreurs de connexion
    this.socket.on('connect_error', (error) => {
      console.error('🚫 Erreur connexion WebSocket notifications:', error);
      this.reconnectAttempts++;
      
      // Redirection si problème d'authentification
      if (error.message && error.message.includes('Authentication')) {
        console.warn('🔒 Problème d\'authentification WebSocket - redirection vers login');
        // window.location.href = '/login';
      }
      
      this.notifyListeners('error', { error, attempts: this.reconnectAttempts });
    });

    // 🆕 NOUVELLE COMMANDE (pour admins)
    this.socket.on('newOrderNotification', (data) => {
      console.log('🆕 Nouvelle commande reçue via WebSocket:', data);
      this.notifyListeners('newOrder', data);
      this.showBrowserNotification(data, '🆕');
    });

    // 📝 MISE À JOUR COMMANDE
    this.socket.on('orderUpdateNotification', (data) => {
      console.log('📝 Commande mise à jour via WebSocket:', data);
      this.notifyListeners('orderUpdate', data);
      this.showBrowserNotification(data, '📝');
    });

    // ⚙️ NOTIFICATION SYSTÈME
    this.socket.on('systemNotification', (data) => {
      console.log('⚙️ Notification système via WebSocket:', data);
      this.notifyListeners('system', data);
      this.showBrowserNotification(data, '⚙️');
    });

    // 📢 NOTIFICATION GÉNÉRALE
    this.socket.on('notification', (data) => {
      console.log('📢 Notification générale via WebSocket:', data);
      this.notifyListeners('general', data);
      this.showBrowserNotification(data, '📢');
    });

    // 🏓 Pong (test de connexion)
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong reçu:', data);
      this.notifyListeners('pong', data);
    });

    // 📊 Statistiques
    this.socket.on('stats', (data) => {
      console.log('📊 Stats WebSocket:', data);
      this.notifyListeners('stats', data);
    });

    // Debug - Écouter tous les événements
    this.socket.onAny((event, data) => {
      console.log(`📡 Événement WebSocket reçu: ${event}`, data);
    });
  }

  /**
   * 🔔 Afficher une notification navigateur
   */
  showBrowserNotification(data, icon = '🔔') {
    if (!data.notification) return;
    
    // Vérifier si les notifications sont autorisées
    if (window.Notification && Notification.permission === 'granted') {
      const notification = new Notification(data.notification.title, {
        body: data.notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `order-${data.orderData?.orderId || Date.now()}`,
        requireInteraction: true, // Notification persistante
        data: {
          orderId: data.orderData?.orderId,
          orderNumber: data.orderData?.orderNumber,
          url: data.orderData?.orderId ? `/admin/orders/${data.orderData.orderId}` : '/admin/orders'
        }
      });

      // Clic sur la notification
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (notification.data?.url) {
          window.location.href = notification.data.url;
        }
        notification.close();
      };

      // Auto-fermeture après 10 secondes
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }

  /**
   * 👂 Ajouter un écouteur d'événement
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Retourner une fonction de nettoyage
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * 🔔 Notifier tous les écouteurs d'un événement
   */
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur dans le callback ${event}:`, error);
        }
      });
    }
  }

  /**
   * 🏓 Test de connexion
   */
  ping() {
    if (this.socket?.connected) {
      console.log('🏓 Envoi ping WebSocket...');
      this.socket.emit('ping', { timestamp: Date.now() });
    } else {
      console.warn('🚫 Impossible d\'envoyer ping - WebSocket déconnecté');
    }
  }

  /**
   * 📊 Demander les statistiques
   */
  getStats() {
    if (this.socket?.connected) {
      console.log('📊 Demande de statistiques WebSocket...');
      this.socket.emit('getStats');
    } else {
      console.warn('🚫 Impossible de demander les stats - WebSocket déconnecté');
    }
  }

  /**
   * 🔔 Demander la permission pour les notifications navigateur
   */
  requestNotificationPermission() {
    if (window.Notification) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('🔔 Permission notifications:', permission);
        });
      }
    }
  }

  /**
   * 🔌 Déconnexion
   */
  disconnect() {
    if (this.socket) {
      console.log('🔔 Déconnexion WebSocket notifications...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * 🔄 Reconnexion manuelle
   */
  reconnect() {
    console.log('🔄 Reconnexion manuelle WebSocket...');
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * 📊 Statut de connexion
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      transport: this.socket?.io?.engine?.transport?.name,
    };
  }
}

// Singleton pour utilisation globale
const notificationWebSocketService = new NotificationWebSocketService();
export default notificationWebSocketService; 