import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  RefreshCw,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';

interface AdminNotificationCenterProps {
  onNewOrder?: () => void;
  onOrderStatusChanged?: () => void;
}

export const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = React.memo(({
  onNewOrder,
  onOrderStatusChanged
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Memoize callbacks pour éviter les re-créations
  const handleNewOrder = useCallback((notification: any) => {
    console.log('🆕 Admin: Nouvelle commande:', notification);
    onNewOrder?.();
    
    // Action spéciale pour les admins
    toast.success('🆕 Nouvelle Commande!', {
      description: `${notification.data?.customerName || 'Client'} - ${notification.data?.totalAmount || 0} FCFA`,
      duration: 8000,
      action: {
        label: 'Voir',
        onClick: () => {
          // Naviguer vers les commandes
          window.location.href = '/admin/orders';
        }
      }
    });
  }, [onNewOrder]);

  const handleOrderStatusChanged = useCallback((notification: any) => {
    console.log('📝 Admin: Statut modifié:', notification);
    onOrderStatusChanged?.();
    
    toast.info('📝 Statut Modifié', {
      description: `Commande ${notification.data?.orderNumber}: ${notification.data?.newStatus}`,
      duration: 5000,
    });
  }, [onOrderStatusChanged]);

  const {
    isConnected,
    connectionStatus,
    notifications,
    unreadCount,
    connect,
    disconnect,
    reconnect,
    markAsRead,
    clearNotifications,
    lastActivity,
    isAdmin
  } = useWebSocket({
    autoConnect: true,
    showNotifications: false, // ⭐ Désactiver les toasts automatiques pour éviter les doublons
    enableBrowserNotifications: true,
    enableSounds: soundEnabled,
    onNewOrder: handleNewOrder,
    onOrderStatusChanged: handleOrderStatusChanged
  });

  // Memoize callbacks pour éviter les re-rendus
  const handleToggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      toast.success(newValue ? '🔊 Sons activés' : '🔇 Sons désactivés');
      return newValue;
    });
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    notifications.forEach(notif => {
      if (!notif.read) {
        markAsRead(notif.id);
      }
    });
    toast.success('Toutes les notifications marquées comme lues');
  }, [notifications, markAsRead]);

  const handleClearAll = useCallback(() => {
    clearNotifications();
    toast.success('Notifications effacées');
  }, [clearNotifications]);

  const handleTogglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Memoize status info pour éviter les re-calculs
  const statusInfo = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: Wifi, color: 'text-green-600', text: 'Connecté' };
      case 'connecting':
        return { icon: RefreshCw, color: 'text-yellow-600', text: 'Connexion...' };
      case 'error':
        return { icon: WifiOff, color: 'text-red-600', text: 'Erreur' };
      default:
        return { icon: WifiOff, color: 'text-gray-600', text: 'Déconnecté' };
    }
  }, [connectionStatus]);

  // Ne pas afficher si pas admin
  if (!isAdmin) {
    return null;
  }

  const StatusIcon = statusInfo.icon;

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleTogglePanel}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel de notifications */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 max-h-[600px] z-50 shadow-lg border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications Admin
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount}</Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePanel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Statut de connexion */}
            <div className="flex items-center justify-between text-sm">
              <div className={`flex items-center gap-2 ${statusInfo.color}`}>
                <StatusIcon className={`h-4 w-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
                <span>{statusInfo.text}</span>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Bouton son */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleSound}
                  title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>

                {/* Bouton reconnexion */}
                {!isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reconnect}
                    title="Reconnecter"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex-1"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Marquer tout lu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Effacer tout
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune notification</p>
                  <p className="text-xs mt-1">
                    Les nouvelles commandes apparaîtront ici en temps réel
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onMarkAsRead={markAsRead}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {/* Footer avec info de dernière activité */}
          {lastActivity && (
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
              Dernière activité: {lastActivity.toLocaleTimeString('fr-FR')}
            </div>
          )}
        </Card>
      )}
    </div>
  );
});

// Composant séparé pour les notifications individuelles (optimisé)
const NotificationItem = React.memo<{
  notification: any;
  onMarkAsRead: (id: string) => void;
}>(({ notification, onMarkAsRead }) => {
  const handleClick = useCallback(() => {
    onMarkAsRead(notification.id);
  }, [notification.id, onMarkAsRead]);

  const badgeClassName = useMemo(() => {
    const baseClass = 'text-xs';
    switch (notification.type) {
      case 'NEW_ORDER':
        return `${baseClass} border-green-200 text-green-700`;
      case 'ORDER_STATUS_CHANGED':
        return `${baseClass} border-blue-200 text-blue-700`;
      default:
        return `${baseClass} border-gray-200 text-gray-700`;
    }
  }, [notification.type]);

  const badgeText = useMemo(() => {
    switch (notification.type) {
      case 'NEW_ORDER':
        return '🆕 Nouvelle';
      case 'ORDER_STATUS_CHANGED':
        return '📝 Statut';
      default:
        return '📦 Commande';
    }
  }, [notification.type]);

  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium text-sm ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {new Date(notification.timestamp).toLocaleTimeString('fr-FR')}
            </span>
            <Badge variant="outline" className={badgeClassName}>
              {badgeText}
            </Badge>
          </div>
        </div>
        
        {notification.read && (
          <Check className="h-4 w-4 text-green-500 ml-2 flex-shrink-0" />
        )}
      </div>
    </div>
  );
});

AdminNotificationCenter.displayName = 'AdminNotificationCenter';
NotificationItem.displayName = 'NotificationItem'; 