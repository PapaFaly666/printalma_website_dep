// Hook combiné pour fusionner les notifications REST et WebSocket
import { useCallback, useMemo } from 'react';
import { useNotifications } from './useNotifications';
import { useNotificationsWebSocket } from './useNotificationsWebSocket';

export const useCombinedNotifications = () => {
  // Hooks individuels
  const restNotifications = useNotifications();
  const wsNotifications = useNotificationsWebSocket();

  // Fusionner les notifications
  const allNotifications = useMemo(() => {
    const combined = [];

    // Ajouter les notifications REST avec un flag
    restNotifications.notifications.forEach(notification => {
      combined.push({
        ...notification,
        source: 'REST',
        timestamp: notification.createdAt,
        isRealTime: false
      });
    });

    // Ajouter les notifications WebSocket avec un flag
    wsNotifications.newNotifications.forEach(wsNotification => {
      combined.push({
        ...wsNotification.notification,
        source: 'WebSocket',
        timestamp: wsNotification.timestamp,
        isRealTime: true,
        orderData: wsNotification.orderData,
        wsType: wsNotification.type
      });
    });

    // Trier par timestamp (plus récent en premier)
    return combined.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [restNotifications.notifications, wsNotifications.newNotifications]);

  // Compteur total non lu
  const totalUnreadCount = useMemo(() => {
    return restNotifications.unreadCount + wsNotifications.newNotifications.length;
  }, [restNotifications.unreadCount, wsNotifications.newNotifications.length]);

  // Statut global
  const globalStatus = useMemo(() => {
    if (wsNotifications.isConnected && !restNotifications.loading) {
      return 'connected';
    } else if (wsNotifications.hasError || restNotifications.error) {
      return 'error';
    } else if (restNotifications.loading || wsNotifications.isConnecting) {
      return 'loading';
    } else {
      return 'disconnected';
    }
  }, [
    wsNotifications.isConnected,
    wsNotifications.hasError,
    wsNotifications.isConnecting,
    restNotifications.loading,
    restNotifications.error
  ]);

  // Actions combinées
  const markAsRead = useCallback(async (notificationId) => {
    // Uniquement pour les notifications REST
    return await restNotifications.markAsRead(notificationId);
  }, [restNotifications.markAsRead]);

  const markAllAsRead = useCallback(async () => {
    // Marquer toutes les REST comme lues et vider les WebSocket
    const restResult = await restNotifications.markAllAsRead();
    wsNotifications.clearNotifications();
    return restResult;
  }, [restNotifications.markAllAsRead, wsNotifications.clearNotifications]);

  const deleteNotification = useCallback(async (notificationId) => {
    // Uniquement pour les notifications REST
    return await restNotifications.deleteNotification(notificationId);
  }, [restNotifications.deleteNotification]);

  const clearAllRealTime = useCallback(() => {
    wsNotifications.clearNotifications();
  }, [wsNotifications.clearNotifications]);

  const refreshAll = useCallback(() => {
    restNotifications.refresh();
    if (!wsNotifications.isConnected) {
      wsNotifications.reconnect();
    }
  }, [restNotifications.refresh, wsNotifications.isConnected, wsNotifications.reconnect]);

  // Statistiques
  const stats = useMemo(() => ({
    total: allNotifications.length,
    rest: restNotifications.notifications.length,
    webSocket: wsNotifications.newNotifications.length,
    unread: restNotifications.unreadCount,
    realTime: wsNotifications.newNotifications.length,
    wsConnected: wsNotifications.isConnected,
    restLoading: restNotifications.loading
  }), [
    allNotifications.length,
    restNotifications.notifications.length,
    restNotifications.unreadCount,
    restNotifications.loading,
    wsNotifications.newNotifications.length,
    wsNotifications.isConnected
  ]);

  // Obtenir les notifications par source
  const getNotificationsBySource = useCallback((source) => {
    return allNotifications.filter(notif => notif.source === source);
  }, [allNotifications]);

  // Obtenir les notifications récentes (dernière heure)
  const getRecentNotifications = useCallback(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return allNotifications.filter(notif => 
      new Date(notif.timestamp) > oneHourAgo
    );
  }, [allNotifications]);

  // Debug pour développement
  const debugInfo = useMemo(() => ({
    restStatus: {
      loading: restNotifications.loading,
      error: restNotifications.error,
      count: restNotifications.notifications.length,
      unread: restNotifications.unreadCount
    },
    wsStatus: {
      connectionStatus: wsNotifications.connectionStatus,
      connected: wsNotifications.isConnected,
      error: wsNotifications.error,
      count: wsNotifications.newNotifications.length
    },
    combined: {
      total: allNotifications.length,
      totalUnread: totalUnreadCount,
      globalStatus
    }
  }), [
    restNotifications,
    wsNotifications,
    allNotifications.length,
    totalUnreadCount,
    globalStatus
  ]);

  return {
    // Données combinées
    allNotifications,
    totalUnreadCount,
    globalStatus,
    stats,
    
    // Notifications par source
    restNotifications: getNotificationsBySource('REST'),
    webSocketNotifications: getNotificationsBySource('WebSocket'),
    recentNotifications: getRecentNotifications(),
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRealTime,
    refreshAll,
    
    // Utilitaires
    getNotificationsBySource,
    getRecentNotifications,
    
    // États individuels (pour accès direct si nécessaire)
    rest: restNotifications,
    webSocket: wsNotifications,
    
    // Debug
    debugInfo,
    
    // États booléens utiles
    hasNotifications: allNotifications.length > 0,
    hasUnreadNotifications: totalUnreadCount > 0,
    isFullyConnected: wsNotifications.isConnected && !restNotifications.loading,
    hasAnyError: wsNotifications.hasError || !!restNotifications.error
  };
}; 