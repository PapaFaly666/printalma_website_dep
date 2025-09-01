import { useState, useEffect, useCallback } from 'react';
// Restauration du vrai service notifications
import notificationService, { BackendNotification } from '../services/notificationService';
// TEMPORAIRE: Utiliser le service mock pour tester l'interface
// import notificationService from '../services/notificationService.mock';
// import { BackendNotification } from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    
    // Actions principales
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Utilitaires
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