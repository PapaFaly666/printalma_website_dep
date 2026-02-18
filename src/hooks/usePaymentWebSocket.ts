import { useEffect, useRef, useState } from 'react';
import { PaymentStatus } from '../types/payment';

interface PaymentUpdateMessage {
  type: 'payment_update';
  orderNumber: string;
  paymentStatus: string;
  transactionId?: string;
}

interface UsePaymentWebSocketOptions {
  orderNumber: string;
  onStatusChange?: (status: PaymentStatus) => void;
  enabled?: boolean;
}

export const usePaymentWebSocket = ({
  orderNumber,
  onStatusChange,
  enabled = true
}: UsePaymentWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef<number>(0);
  // Ref pour vérifier si on doit encore reconnecter (évite la race condition
  // entre le polling qui désactive enabled et les timeouts de reconnexion)
  const enabledRef = useRef<boolean>(enabled);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  // Synchroniser enabledRef à chaque render
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled || !orderNumber) {
      return;
    }

    const connectWebSocket = () => {
      // Ne pas reconnecter si désactivé entre temps (statut terminal)
      if (!enabledRef.current) {
        return;
      }

      try {
        // Déterminer l'URL du WebSocket en fonction de l'environnement
        // Forcer wss: si le host est distant (Render ne supporte pas ws: non sécurisé)
        const wsHost = import.meta.env.VITE_WS_URL || 'localhost:3004';
        const isRemote = !wsHost.includes('localhost');
        const wsProtocol = (window.location.protocol === 'https:' || isRemote) ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${wsHost}`;

        console.log('🔌 [WebSocket] Connexion à:', wsUrl);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ [WebSocket] Connecté');
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;

          // S'abonner aux mises à jour de cette commande
          ws.send(JSON.stringify({
            type: 'subscribe_payment',
            orderNumber
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message: PaymentUpdateMessage = JSON.parse(event.data);
            console.log('📨 [WebSocket] Message reçu:', message);

            if (message.type === 'payment_update' && message.orderNumber === orderNumber) {
              setLastUpdate(new Date());

              // Mapper le statut reçu vers PaymentStatus
              let status: PaymentStatus;
              const paymentStatus = message.paymentStatus.toLowerCase();

              if (paymentStatus === 'completed' || paymentStatus === 'paid') {
                status = PaymentStatus.PAID;
              } else if (paymentStatus === 'cancelled') {
                status = PaymentStatus.CANCELLED;
              } else if (paymentStatus === 'failed') {
                status = PaymentStatus.FAILED;
              } else if (paymentStatus === 'pending') {
                status = PaymentStatus.PENDING;
              } else {
                status = PaymentStatus.PENDING;
              }

              console.log('🔄 [WebSocket] Changement de statut:', status);

              // Notifier le composant parent
              if (onStatusChange) {
                onStatusChange(status);
              }
            }
          } catch (error) {
            console.error('❌ [WebSocket] Erreur parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ [WebSocket] Erreur:', error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('🔌 [WebSocket] Déconnecté');
          setIsConnected(false);

          // Ne pas reconnecter si le statut est terminal (enabled=false)
          if (!enabledRef.current) {
            return;
          }

          // Tentative de reconnexion
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1;
            console.log(`🔄 [WebSocket] Reconnexion ${reconnectAttemptsRef.current}/${maxReconnectAttempts} dans ${reconnectDelay}ms...`);

            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, reconnectDelay);
          } else {
            console.warn('⚠️ [WebSocket] Nombre maximal de tentatives de reconnexion atteint');
          }
        };

      } catch (error) {
        console.error('❌ [WebSocket] Erreur de connexion:', error);
      }
    };

    // Connexion initiale
    connectWebSocket();

    // Nettoyage
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        // Se désabonner avant de fermer
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'unsubscribe_payment',
            orderNumber
          }));
        }

        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [orderNumber, enabled, onStatusChange]);

  return {
    isConnected,
    lastUpdate
  };
};
