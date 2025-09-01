// Hook React pour les notifications WebSocket en temps réel
import { useState, useEffect, useCallback } from 'react';
import NotificationWebSocketService from '../services/NotificationWebSocketService';

export const useNotificationsWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [newNotifications, setNewNotifications] = useState([]);
  const [lastNotification, setLastNotification] = useState(null);
  const [stats, setStats] = useState({ connectedAdmins: 0, connectedUsers: 0 });
  const [error, setError] = useState(null);

  // Gestionnaires d'événements
  const handleConnection = useCallback((data) => {
    console.log('🔌 WebSocket connecté:', data);
    setConnectionStatus('connected');
    setError(null);
  }, []);

  const handleDisconnection = useCallback((data) => {
    console.log('🔌 WebSocket déconnecté:', data);
    setConnectionStatus('disconnected');
  }, []);

  const handleError = useCallback((data) => {
    console.error('🚫 Erreur WebSocket:', data);
    setConnectionStatus('error');
    setError(data.error?.message || 'Erreur de connexion WebSocket');
  }, []);

  const handleAuthenticated = useCallback((data) => {
    console.log('🔐 WebSocket authentifié:', data);
    setConnectionStatus('authenticated');
    setError(null);
  }, []);

  const handleNewOrder = useCallback((data) => {
    console.log('🆕 Nouvelle commande WebSocket:', data);
    setLastNotification(data);
    setNewNotifications(prev => [data, ...prev.slice(0, 49)]); // Garder les 50 dernières

    // Son de notification (optionnel)
    if (typeof Audio !== 'undefined') {
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Son non disponible:', e));
      } catch (error) {
        // Pas grave si le son ne fonctionne pas
      }
    }
  }, []);

  const handleOrderUpdate = useCallback((data) => {
    console.log('📝 Commande mise à jour WebSocket:', data);
    setLastNotification(data);
    setNewNotifications(prev => [data, ...prev.slice(0, 49)]);
  }, []);

  const handleSystemNotification = useCallback((data) => {
    console.log('⚙️ Notification système WebSocket:', data);
    setLastNotification(data);
    setNewNotifications(prev => [data, ...prev.slice(0, 49)]);
  }, []);

  const handleGeneralNotification = useCallback((data) => {
    console.log('📢 Notification générale WebSocket:', data);
    setLastNotification(data);
    setNewNotifications(prev => [data, ...prev.slice(0, 49)]);
  }, []);

  const handleStats = useCallback((data) => {
    console.log('📊 Stats WebSocket reçues:', data);
    setStats(data);
  }, []);

  const handlePong = useCallback((data) => {
    console.log('🏓 Pong WebSocket:', data);
  }, []);

  // Connexion et nettoyage
  useEffect(() => {
    console.log('🚀 Initialisation WebSocket notifications...');

    // Demander la permission pour les notifications navigateur
    NotificationWebSocketService.requestNotificationPermission();

    // Connexion WebSocket
    NotificationWebSocketService.connect();

    // Ajout des écouteurs d'événements
    const removeListeners = [
      NotificationWebSocketService.addEventListener('connection', handleConnection),
      NotificationWebSocketService.addEventListener('disconnection', handleDisconnection),
      NotificationWebSocketService.addEventListener('error', handleError),
      NotificationWebSocketService.addEventListener('authenticated', handleAuthenticated),
      NotificationWebSocketService.addEventListener('newOrder', handleNewOrder),
      NotificationWebSocketService.addEventListener('orderUpdate', handleOrderUpdate),
      NotificationWebSocketService.addEventListener('system', handleSystemNotification),
      NotificationWebSocketService.addEventListener('general', handleGeneralNotification),
      NotificationWebSocketService.addEventListener('stats', handleStats),
      NotificationWebSocketService.addEventListener('pong', handlePong),
    ];

    // Demander les stats initiales après 2 secondes
    const statsTimeout = setTimeout(() => {
      NotificationWebSocketService.getStats();
    }, 2000);

    return () => {
      console.log('🧹 Nettoyage WebSocket notifications...');
      clearTimeout(statsTimeout);
      
      // Nettoyage des écouteurs
      removeListeners.forEach(removeListener => {
        if (typeof removeListener === 'function') {
          removeListener();
        }
      });
    };
  }, [
    handleConnection, handleDisconnection, handleError, handleAuthenticated,
    handleNewOrder, handleOrderUpdate, handleSystemNotification, 
    handleGeneralNotification, handleStats, handlePong
  ]);

  // Fonctions utilitaires
  const ping = useCallback(() => {
    NotificationWebSocketService.ping();
  }, []);

  const getStats = useCallback(() => {
    NotificationWebSocketService.getStats();
  }, []);

  const clearNotifications = useCallback(() => {
    setNewNotifications([]);
    setLastNotification(null);
  }, []);

  const disconnect = useCallback(() => {
    NotificationWebSocketService.disconnect();
    setConnectionStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    NotificationWebSocketService.reconnect();
  }, []);

  // Obtenir le statut détaillé
  const getDetailedStatus = useCallback(() => {
    return {
      ...NotificationWebSocketService.getConnectionStatus(),
      connectionStatus,
      error,
      notificationsCount: newNotifications.length,
      lastNotificationTime: lastNotification?.timestamp,
    };
  }, [connectionStatus, error, newNotifications.length, lastNotification]);

  // Filtrer les notifications par type
  const getNotificationsByType = useCallback((type) => {
    return newNotifications.filter(notif => 
      notif.type === type || notif.notification?.type === type
    );
  }, [newNotifications]);

  // Obtenir les notifications récentes (dernières 10 minutes)
  const getRecentNotifications = useCallback(() => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return newNotifications.filter(notif => 
      new Date(notif.timestamp) > tenMinutesAgo
    );
  }, [newNotifications]);

  return {
    // États
    connectionStatus,
    newNotifications,
    lastNotification,
    stats,
    error,
    
    // Actions
    ping,
    getStats,
    clearNotifications,
    disconnect,
    reconnect,
    
    // Utilitaires
    getDetailedStatus,
    getNotificationsByType,
    getRecentNotifications,
    
    // États calculés
    isConnected: connectionStatus === 'authenticated',
    isConnecting: connectionStatus === 'connected',
    hasError: connectionStatus === 'error',
    hasNewNotifications: newNotifications.length > 0,
    recentNotifications: getRecentNotifications(),
    orderNotifications: getNotificationsByType('NEW_ORDER_NOTIFICATION').concat(
      getNotificationsByType('ORDER_UPDATE_NOTIFICATION')
    ),
  };
}; 