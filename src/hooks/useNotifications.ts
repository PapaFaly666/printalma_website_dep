import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import notificationService, { BackendNotification } from '../services/notificationService';
// Types pour les événements WebSocket
interface NewOrderNotificationData {
  type: 'NEW_ORDER_NOTIFICATION';
  notification: BackendNotification;
  orderData: {
    orderId: number;
    orderNumber: string;
    totalAmount: number;
    customer: string;
    itemsCount: number;
  };
  timestamp: string;
}

interface OrderUpdateNotificationData {
  type: 'ORDER_UPDATE_NOTIFICATION';
  notification: BackendNotification;
  orderData: {
    orderId: number;
    orderNumber: string;
    oldStatus: string;
    newStatus: string;
  };
  timestamp: string;
}

interface SystemNotificationData {
  type: 'SYSTEM_NOTIFICATION';
  notification: BackendNotification;
  timestamp: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  // Configuration API URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

  // Fonction pour obtenir le token d'authentification JWT
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }, []);

  // Fonction pour afficher une notification toast/browser
  const showNotificationToast = useCallback((data: any) => {
    console.log('🔔 Notification toast:', data);

    // Vérifier si les notifications browser sont supportées
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(data.notification?.title || 'Nouvelle notification', {
        body: data.notification?.message || 'Vous avez une nouvelle notification',
        icon: '/favicon.ico',
        tag: `notification-${data.notification?.id}`,
        badge: '/favicon.ico'
      });

      // Gérer le clic sur la notification browser
      notification.onclick = () => {
        window.focus();

        // Naviguer vers la commande si c'est une notification de commande
        if (data.notification?.metadata?.orderId) {
          window.location.href = `/admin/orders/${data.notification.metadata.orderId}`;
        } else if (data.orderData?.orderId) {
          window.location.href = `/admin/orders/${data.orderData.orderId}`;
        }

        notification.close();
      };

      // Auto-fermeture après 5 secondes
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    // Demander la permission si ce n'est pas déjà fait
    else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotificationToast(data); // Relancer la fonction
        }
      });
    }
  }, []);

  // Configuration et connexion WebSocket
  useEffect(() => {
    const token = getAuthToken();
    if (!user || !token) {
      console.log('🔌 [useNotifications] Utilisateur non connecté ou pas de token, pas de WebSocket');
      return;
    }

    console.log('🔌 [useNotifications] Connexion WebSocket avec JWT token');

    setConnectionStatus('connecting');
    setError(null);

    try {
      const socket = io(`${API_BASE_URL}/notifications`, {
        auth: { token: token }, // Envoyer le token JWT dans l'authentification WebSocket
        withCredentials: true, // Garder les cookies en backup
        transports: ['websocket', 'polling'], // Essayer WebSocket d'abord, fallback sur polling
        timeout: 10000,
        forceNew: true
      });

      socketRef.current = socket;

      // Événement de connexion réussie
      socket.on('connect', () => {
        console.log('🔌 [useNotifications] WebSocket connecté avec succès');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      });

      socket.on('connected', (data: any) => {
        console.log('🔌 [useNotifications] Message de connexion reçu:', data);
        setIsConnected(true);
        setConnectionStatus('connected');
      });

      // Événement de déconnexion
      socket.on('disconnect', (reason) => {
        console.log('🔌 [useNotifications] WebSocket déconnecté:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      // Erreur de connexion
      socket.on('connect_error', (error) => {
        console.error('🔌 [useNotifications] Erreur de connexion WebSocket:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        setError('Erreur de connexion aux notifications');

        // Tentative de reconnexion automatique
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 [useNotifications] Tentative de reconnexion ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);

          setTimeout(() => {
            socket.connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else {
          console.error('🔌 [useNotifications] Max tentatives de reconnexion atteint');
          setError('Impossible de se connecter aux notifications en temps réel');
        }
      });

      // Nouvelle commande (pour admins)
      socket.on('newOrderNotification', (data: NewOrderNotificationData) => {
        console.log('📦 [useNotifications] Nouvelle commande reçue:', data);

        // Ajouter la notification à la liste
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Afficher la notification toast
        showNotificationToast(data);

        // Son de notification (optionnel)
        if ('Audio' in window) {
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Ignorer les erreurs de lecture audio
          });
        }
      });

      // Mise à jour de commande
      socket.on('orderUpdateNotification', (data: OrderUpdateNotificationData) => {
        console.log('🔄 [useNotifications] Mise à jour de commande:', data);

        setNotifications(prev => [data.notification, ...prev]);
        if (!data.notification.isRead) {
          setUnreadCount(prev => prev + 1);
        }

        showNotificationToast(data);
      });

      // Notification système
      socket.on('systemNotification', (data: SystemNotificationData) => {
        console.log('⚡ [useNotifications] Notification système:', data);

        setNotifications(prev => [data.notification, ...prev]);
        if (!data.notification.isRead) {
          setUnreadCount(prev => prev + 1);
        }

        showNotificationToast(data);
      });

      // Notification générale
      socket.on('notification', (data: any) => {
        console.log('📢 [useNotifications] Notification générale:', data);

        if (data.notification) {
          setNotifications(prev => [data.notification, ...prev]);
          if (!data.notification.isRead) {
            setUnreadCount(prev => prev + 1);
          }
          showNotificationToast(data);
        }
      });

      // Pong response
      socket.on('pong', (data: any) => {
        console.log('🏓 [useNotifications] Pong reçu:', data);
        setIsConnected(true);
      });

    } catch (error) {
      console.error('🔌 [useNotifications] Erreur création WebSocket:', error);
      setConnectionStatus('error');
      setError('Erreur lors de la configuration des notifications');
    }

    // Nettoyage à la déconnexion
    return () => {
      if (socketRef.current) {
        console.log('🔌 [useNotifications] Nettoyage WebSocket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [user, showNotificationToast]);

  // Envoyer un ping périodique pour maintenir la connexion
  useEffect(() => {
    if (!isConnected || !socketRef.current) return;

    const pingInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping', { timestamp: new Date().toISOString() });
      }
    }, 30000); // Ping toutes les 30 secondes

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  // Charger les notifications avec gestion d'erreur améliorée
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err: any) {
      console.error('Erreur notifications:', err);
      setError(err.message || 'Erreur lors du chargement des notifications');
      
      // En cas d'erreur d'authentification, réinitialiser les données
      if (err.response?.status === 401 || err.response?.status === 403) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Marquer comme lue avec mise à jour locale (adapté à la nouvelle API)
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const success = await notificationService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur marquage comme lu:', error);
      return false;
    }
  }, []);

  // Marquer toutes comme lues (adapté à la nouvelle API)
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        return { success: true, updatedCount: result.updatedCount };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur marquage global:', error);
      return { success: false };
    }
  }, []);

  // Supprimer une notification (adapté à la nouvelle API)
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const success = await notificationService.deleteNotification(notificationId);
      if (success) {
        setNotifications(prev => {
          const notif = prev.find(n => n.id === notificationId);
          if (notif && !notif.isRead) {
            setUnreadCount(count => Math.max(0, count - 1));
          }
          return prev.filter(n => n.id !== notificationId);
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      return false;
    }
  }, []);

  // Obtenir uniquement le compteur (pour la performance)
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (error) {
      console.error('Erreur compteur non lues:', error);
      return 0;
    }
  }, []);

  // Filtrer par type de notification
  const getNotificationsByType = useCallback((type: BackendNotification['type']) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Obtenir les notifications récentes (dernières 24h)
  const getRecentNotifications = useCallback(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return notifications.filter(n => 
      new Date(n.createdAt) > oneDayAgo
    );
  }, [notifications]);

  // Chargement initial + polling toutes les 30s
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  return {
    // Données
    notifications,
    unreadCount,
    loading,
    error,

    // États WebSocket
    isConnected,
    connectionStatus,

    // Actions principales
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Utilitaires
    fetchNotifications: loadNotifications,
    refresh: loadNotifications,
    refreshUnreadCount,
    getNotificationsByType,
    getRecentNotifications,

    // États calculés
    hasUnread: unreadCount > 0,
    recentNotifications: getRecentNotifications(),
    orderNotifications: getNotificationsByType('ORDER_NEW').concat(getNotificationsByType('ORDER_UPDATED'))
  };
}; 