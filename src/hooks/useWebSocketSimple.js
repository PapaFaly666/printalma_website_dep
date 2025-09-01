import { useEffect, useState, useRef } from 'react';
import WebSocketService from '../services/WebSocketService';

export const useWebSocketSimple = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const connectionRef = useRef(false);

  useEffect(() => {
    // ✅ Éviter les connexions multiples
    if (connectionRef.current) {
      console.log('🔌 Hook WebSocket déjà initialisé');
      return;
    }

    connectionRef.current = true;

    // Connecter WebSocket une seule fois
    console.log('🔌 Initialisation WebSocket depuis le hook');
    WebSocketService.connect();

    // Vérifier le statut de connexion
    const checkConnection = () => {
      const connected = WebSocketService.isConnectedToWebSocket();
      setIsConnected(connected);
    };

    // Vérifier immédiatement puis toutes les 2 secondes
    checkConnection();
    const interval = setInterval(checkConnection, 2000);

    return () => {
      clearInterval(interval);
      connectionRef.current = false;
      // ✅ Ne pas déconnecter le WebSocket ici car il peut être utilisé ailleurs
      // WebSocketService.disconnect();
    };
  }, []);

  const addNotification = (notification) => {
    setNotifications(prev => [
      { 
        ...notification, 
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // ✅ ID vraiment unique
      },
      ...prev.slice(0, 9) // Garder 10 max
    ]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    isConnected,
    notifications,
    addNotification,
    clearNotifications,
    webSocketService: WebSocketService
  };
}; 