import React, { useEffect } from 'react';
import { useWebSocketSimple } from '../../hooks/useWebSocketSimple';
import { useAuth } from '../../contexts/AuthContext';

const AdminNotificationsSimple = () => {
  const { user } = useAuth();
  const { isConnected, notifications, addNotification, clearNotifications, webSocketService } = useWebSocketSimple();

  // Vérifier que l'utilisateur est admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  useEffect(() => {
    if (!isAdmin) return;

    // Écouter les nouvelles commandes
    const handleNewOrder = (notification) => {
      addNotification(notification);
      console.log('🆕 Nouvelle commande pour admin:', notification);
      
      // Optionnel: jouer un son
      playNotificationSound();
    };

    // Écouter les changements de statut
    const handleStatusChange = (notification) => {
      addNotification(notification);
      console.log('📝 Changement de statut:', notification);
    };

    // S'abonner aux événements
    webSocketService.onNewOrder(handleNewOrder);
    webSocketService.onOrderStatusChanged(handleStatusChange);

  }, [webSocketService, addNotification, isAdmin]);

  const playNotificationSound = () => {
    try {
      // Son simple généré
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Son optionnel
    }
  };

  const clearAllNotifications = () => {
    clearNotifications();
  };

  // Ne pas afficher si pas admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-notifications">
      {/* Indicateur de connexion */}
      <div className={`websocket-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        {isConnected ? '🟢 Temps réel activé' : '🔴 Déconnecté'}
      </div>

      {/* Panel notifications */}
      <div className="notifications-panel">
        <div className="panel-header">
          <h3>🔔 Notifications ({notifications.length})</h3>
          {notifications.length > 0 && (
            <button onClick={clearAllNotifications} className="clear-btn">
              Effacer tout
            </button>
          )}
        </div>

        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <p>🔔 En attente de notifications...</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className={`notification-item ${notif.type || 'default'}`}>
                <div className="notification-header">
                  <strong className="notification-title">{notif.title}</strong>
                  <span className="notification-time">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="notification-message">{notif.message}</div>
                {notif.data && (
                  <div className="notification-details">
                    <span>📦 ID: {notif.data.orderId}</span>
                    {notif.data.customerName && (
                      <span>👤 {notif.data.customerName}</span>
                    )}
                    {notif.data.totalAmount && (
                      <span>💰 {notif.data.totalAmount} FCFA</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsSimple; 