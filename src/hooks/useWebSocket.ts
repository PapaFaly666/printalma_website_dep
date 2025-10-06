import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import websocketService from '../services/websocketService';
import { toast } from 'sonner';

interface UseWebSocketOptions {
  // Callbacks pour les événements
  onNewOrder?: (notification: any) => void;
  onOrderStatusChanged?: (notification: any) => void;
  onMyOrderUpdated?: (notification: any) => void;
  
  // Options de configuration
  autoConnect?: boolean;
  showNotifications?: boolean;
  enableBrowserNotifications?: boolean;
  enableSounds?: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  data?: any;
  read?: boolean;
}

// Singleton pour éviter les connexions multiples
let isConnecting = false;
const connectionInstance: any = null;

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { user } = useAuth();
  const {
    onNewOrder,
    onOrderStatusChanged,
    onMyOrderUpdated,
    autoConnect = true,
    showNotifications = true,
    enableBrowserNotifications = true,
    enableSounds = true
  } = options;

  // États avec useMemo pour éviter les re-rendus
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Refs pour éviter les re-créations
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initCallbacksRef = useRef(false);
  const lastConnectTimeRef = useRef<number>(0);

  // Memoization pour éviter les re-rendus
  const isAdmin = useMemo(() => {
    return user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  }, [user?.role]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // ==========================================
  // SONS DE NOTIFICATION (Optimisé)
  // ==========================================

  const initializeAudio = useCallback(() => {
    if (!enableSounds || audioRef.current) return;
    
    try {
      // Créer un son de notification simple
      audioRef.current = new Audio();
      audioRef.current.src = 'data:audio/wav;base64,UklGRvQCAABXQVZFZm10IBAAAAABAAEAESsAADErAAD//wAIAAgAZGF0YdACAAA';
      audioRef.current.volume = 0.3;
      audioRef.current.preload = 'auto';
    } catch (error) {
      console.warn('Impossible de créer l\'audio de notification:', error);
    }
  }, [enableSounds]);

  const playNotificationSound = useCallback(() => {
    if (!enableSounds || !audioRef.current) return;
    
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignorer les erreurs de lecture audio (permissions navigateur)
      });
    } catch (error) {
      console.warn('Erreur lecture son:', error);
    }
  }, [enableSounds]);

  // ==========================================
  // GESTION DES NOTIFICATIONS (Optimisée)
  // ==========================================

  const addNotification = useCallback((notification: any) => {
    const notif: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type: notification.type || 'INFO',
      title: notification.title || 'Notification',
      message: notification.message || '',
      timestamp: notification.timestamp || new Date().toISOString(),
      data: notification.data,
      read: false
    };

    setNotifications(prev => [notif, ...prev.slice(0, 49)]); // Garder max 50 notifications
    setLastActivity(new Date());

    // Toast notification (avec debounce)
    if (showNotifications) {
      setTimeout(() => {
        toast.success(notif.title, {
          description: notif.message,
          duration: 5000,
        });
      }, 100);
    }

    // Son de notification
    playNotificationSound();

    // Notification navigateur (async pour éviter le blocage)
    if (enableBrowserNotifications) {
      setTimeout(() => showBrowserNotification(notif), 200);
    }

    return notif;
  }, [showNotifications, enableBrowserNotifications, playNotificationSound]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearOldNotifications = useCallback(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    setNotifications(prev => 
      prev.filter(n => new Date(n.timestamp) > oneDayAgo)
    );
  }, []);

  // ==========================================
  // NOTIFICATIONS NAVIGATEUR (Optimisées)
  // ==========================================

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (error) {
        return 'denied';
      }
    }

    return Notification.permission;
  }, []);

  const showBrowserNotification = useCallback(async (notification: Notification) => {
    if (!enableBrowserNotifications || !('Notification' in window)) return;

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return;

    try {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.type,
        requireInteraction: false,
        silent: false
      });

      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
        markAsRead(notification.id);
      };

      // Auto-fermeture après 5 secondes
      setTimeout(() => {
        browserNotif.close();
      }, 5000);
    } catch (error) {
      console.warn('Erreur notification navigateur:', error);
    }
  }, [enableBrowserNotifications, requestNotificationPermission, markAsRead]);

  // ==========================================
  // WEBSOCKET CONNECTION (Optimisée)
  // ==========================================

  const initializeCallbacks = useCallback(() => {
    if (initCallbacksRef.current) return;
    initCallbacksRef.current = true;

    // Configuration des callbacks WebSocket (une seule fois)
    websocketService.onConnect = () => {
      console.log('✅ WebSocket connecté');
      setIsConnected(true);
      setConnectionStatus('connected');
      setLastActivity(new Date());
      isConnecting = false;
      
      if (showNotifications) {
        toast.success('Connexion temps réel activée', {
          description: 'Vous recevrez les notifications en temps réel',
          duration: 3000,
        });
      }
    };

    websocketService.onDisconnect = () => {
      console.log('❌ WebSocket déconnecté');
      setIsConnected(false);
      setConnectionStatus('disconnected');
      isConnecting = false;
      
      if (showNotifications) {
        toast.warning('Connexion temps réel perdue', {
          description: 'Tentative de reconnexion...',
          duration: 3000,
        });
      }
    };

    websocketService.onError = (error: any) => {
      console.error('❌ Erreur WebSocket:', error);
      setConnectionStatus('error');
      isConnecting = false;
      
      if (showNotifications) {
        toast.error('Erreur de connexion temps réel', {
          description: 'Vérifiez votre connexion internet',
          duration: 5000,
        });
      }
    };

    // Gestion des événements spécifiques
    websocketService.onNewOrder = (notification: any) => {
      console.log('🆕 Nouvelle commande reçue:', notification);
      const notif = addNotification({
        type: 'NEW_ORDER',
        title: '🆕 Nouvelle Commande',
        message: `Commande ${notification.data?.orderNumber || '#'} - ${notification.data?.customerName || 'Client'} - ${notification.data?.totalAmount || 0} FCFA`,
        data: notification.data,
        timestamp: notification.timestamp
      });
      
      onNewOrder?.(notification);
    };

    websocketService.onOrderStatusChanged = (notification: any) => {
      console.log('📝 Statut de commande modifié:', notification);
      const notif = addNotification({
        type: 'ORDER_STATUS_CHANGED',
        title: '📝 Statut Modifié',
        message: `Commande ${notification.data?.orderNumber || '#'} : ${notification.data?.previousStatus || ''} → ${notification.data?.newStatus || ''}`,
        data: notification.data,
        timestamp: notification.timestamp
      });
      
      onOrderStatusChanged?.(notification);
    };

    websocketService.onMyOrderUpdated = (notification: any) => {
      console.log('📦 Ma commande mise à jour:', notification);
      const notif = addNotification({
        type: 'MY_ORDER_UPDATED',
        title: '📦 Commande Mise à Jour',
        message: `Votre commande ${notification.data?.orderNumber || '#'} est maintenant ${notification.data?.statusLabel || notification.data?.status || ''}`,
        data: notification.data,
        timestamp: notification.timestamp
      });
      
      onMyOrderUpdated?.(notification);
    };
  }, [addNotification, onNewOrder, onOrderStatusChanged, onMyOrderUpdated, showNotifications]);

  const connect = useCallback(() => {
    if (!user || !isAdmin) {
      console.warn('Utilisateur non authentifié ou non admin pour WebSocket');
      return;
    }

    // Éviter les connexions multiples
    const now = Date.now();
    if (isConnecting || (now - lastConnectTimeRef.current) < 2000) {
      console.log('🔄 Connexion déjà en cours ou trop récente');
      return;
    }

    isConnecting = true;
    lastConnectTimeRef.current = now;
    setConnectionStatus('connecting');
    
    // Initialiser les callbacks une seule fois
    initializeCallbacks();
    
    // Connexion WebSocket sans token explicite (utilise les cookies automatiquement)
    console.log('🔌 Démarrage connexion WebSocket...');
    websocketService.connectWebSocket();
  }, [user, isAdmin, initializeCallbacks]);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    isConnecting = false;
    initCallbacksRef.current = false;
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 Reconnexion WebSocket...');
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // ==========================================
  // EFFETS (Optimisés)
  // ==========================================

  // Initialisation (une seule fois)
  useEffect(() => {
    initializeAudio();
    
    // Demander la permission pour les notifications (une seule fois)
    if (enableBrowserNotifications) {
      requestNotificationPermission();
    }

    // Nettoyage automatique des anciennes notifications (moins fréquent)
    const cleanupInterval = setInterval(clearOldNotifications, 60000 * 30); // Toutes les 30 minutes

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []); // Pas de dépendances pour éviter les re-initialisations

  // Connexion automatique (avec debounce)
  useEffect(() => {
    if (autoConnect && user && isAdmin && !isConnected && !isConnecting) {
      const timer = setTimeout(() => {
        connect();
      }, 500); // Délai pour éviter les connexions multiples

      return () => {
        clearTimeout(timer);
      };
    }
  }, [autoConnect, user, isAdmin, isConnected, connect]);

  // Déconnexion lors du logout
  useEffect(() => {
    if (!user && isConnected) {
      disconnect();
    }
  }, [user, isConnected, disconnect]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Pas de déconnexion automatique pour permettre le partage entre composants
    };
  }, []);

  // ==========================================
  // MÉTHODES UTILITAIRES (Memoizées)
  // ==========================================

  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  return useMemo(() => ({
    // État de connexion
    isConnected,
    connectionStatus,
    lastActivity,
    
    // Notifications
    notifications,
    unreadCount,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    addNotification,
    markAsRead,
    clearNotifications,
    getNotificationsByType,
    
    // Permissions
    requestNotificationPermission,
    
    // Info utilisateur
    isAdmin,
    user
  }), [
    isConnected,
    connectionStatus,
    lastActivity,
    notifications,
    unreadCount,
    connect,
    disconnect,
    reconnect,
    addNotification,
    markAsRead,
    clearNotifications,
    getNotificationsByType,
    requestNotificationPermission,
    isAdmin,
    user
  ]);
};

export default useWebSocket; 