// Composant WebSocket pour notifications en temps réel
import React, { useState } from 'react';
import { useNotificationsWebSocket } from '../hooks/useNotificationsWebSocket';
import { Bell, Wifi, WifiOff, AlertCircle, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useNavigate } from 'react-router-dom';

const WebSocketNotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const { 
    connectionStatus,
    newNotifications,
    lastNotification,
    stats,
    error,
    ping,
    getStats,
    clearNotifications,
    reconnect,
    isConnected,
    isConnecting,
    hasError,
    hasNewNotifications,
    getDetailedStatus
  } = useNotificationsWebSocket();

  // Debug logs
  console.log('🔔 WebSocketNotificationCenter render:', {
    connectionStatus,
    notificationsCount: newNotifications.length,
    isConnected,
    hasError,
    lastNotification
  });

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'authenticated': return 'bg-emerald-500';
      case 'connected': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'authenticated': return <Wifi className="h-3 w-3" />;
      case 'connected': return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'error': return <AlertCircle className="h-3 w-3" />;
      default: return <WifiOff className="h-3 w-3" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'authenticated': return 'WebSocket connecté';
      case 'connected': return 'Connexion en cours...';
      case 'error': return `Erreur: ${error || 'Connexion échouée'}`;
      default: return 'En attente de connexion';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'NEW_ORDER_NOTIFICATION': '🆕',
      'ORDER_UPDATE_NOTIFICATION': '📝',
      'SYSTEM_NOTIFICATION': '⚙️',
      'GENERAL_NOTIFICATION': '📢',
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'NEW_ORDER_NOTIFICATION': 'border-l-emerald-500 bg-emerald-50',
      'ORDER_UPDATE_NOTIFICATION': 'border-l-blue-500 bg-blue-50',
      'SYSTEM_NOTIFICATION': 'border-l-purple-500 bg-purple-50',
      'GENERAL_NOTIFICATION': 'border-l-slate-500 bg-slate-50',
    };
    return colors[type] || 'border-l-slate-500 bg-slate-50';
  };

  const handleNotificationClick = (notification) => {
    // Navigation vers la commande si disponible
    if (notification.orderData?.orderId) {
      navigate(`/admin/orders/${notification.orderData.orderId}`);
      setIsOpen(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' FCFA';
  };

  return (
    <TooltipProvider>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-slate-100 transition-colors duration-200"
              >
                {/* Indicateur de statut WebSocket */}
                <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor()}`}>
                  <div className="flex items-center justify-center h-full text-white text-xs">
                    {getStatusIcon()}
                  </div>
                </div>

                {/* Icône principale */}
                <Bell className="h-5 w-5" />

                {/* Badge de notifications */}
                {hasNewNotifications && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse"
                  >
                    {newNotifications.length > 99 ? '99+' : newNotifications.length}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getStatusText()}</p>
              {hasNewNotifications && <p>{newNotifications.length} notification(s) temps réel</p>}
            </TooltipContent>
          </Tooltip>
        </SheetTrigger>

        <SheetContent side="right" className="w-[480px] sm:w-[540px] p-0">
          <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="h-5 w-5" />
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor()}`} />
                </div>
                Notifications WebSocket
                {hasNewNotifications && (
                  <Badge variant="secondary" className="ml-2">
                    {newNotifications.length} temps réel
                  </Badge>
                )}
              </SheetTitle>
              
              <div className="flex items-center gap-2">
                {/* Test ping */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={ping}
                      className="h-8 w-8 p-0"
                      disabled={!isConnected}
                    >
                      🏓
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Test connexion (ping)</p>
                  </TooltipContent>
                </Tooltip>

                {/* Stats */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getStats}
                      className="h-8 w-8 p-0"
                      disabled={!isConnected}
                    >
                      📊
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Statistiques</p>
                  </TooltipContent>
                </Tooltip>

                {/* Reconnect */}
                {hasError && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reconnect}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reconnecter</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Clear */}
                {hasNewNotifications && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearNotifications}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Effacer notifications</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Statut de connexion */}
          <div className={`px-6 py-3 text-sm ${isConnected ? 'bg-emerald-50 text-emerald-700' : hasError ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon()}
                {getStatusText()}
              </span>
              {isConnected && (
                <span className="text-xs">
                  👑 {stats.connectedAdmins} admin(s) • 👤 {stats.connectedUsers} user(s)
                </span>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 h-[calc(100vh-160px)]">
            {/* État vide ou erreur */}
            {!isConnected && !isConnecting && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500 p-6">
                <WifiOff className="h-12 w-12 mb-2 opacity-30" />
                <p className="text-sm text-center">En attente de connexion</p>
                <p className="text-xs text-center mt-1">Les notifications temps réel ne sont pas disponibles</p>
              </div>
            )}

            {isConnecting && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                <RefreshCw className="h-12 w-12 mb-2 opacity-30 animate-spin" />
                <p className="text-sm">Connexion en cours...</p>
              </div>
            )}

            {isConnected && !hasNewNotifications && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                <Bell className="h-12 w-12 mb-2 opacity-30" />
                <p className="text-sm">En attente de notifications...</p>
                <p className="text-xs mt-1">WebSocket connecté et opérationnel</p>
              </div>
            )}

            {/* Liste des notifications WebSocket */}
            {hasNewNotifications && (
              <div className="divide-y divide-slate-100">
                {newNotifications.map((notification, index) => (
                  <div
                    key={`ws-${notification.notification?.id || index}-${notification.timestamp}`}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      relative p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50
                      border-l-4 ${getNotificationColor(notification.type)}
                      ${index === 0 ? 'bg-opacity-75' : ''}
                    `}
                  >
                    {/* Nouveau badge */}
                    {index === 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                          Nouveau
                        </Badge>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {/* Icône de type */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium leading-5 text-slate-900">
                            {notification.notification?.title}
                          </h4>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 mt-1 leading-5">
                          {notification.notification?.message}
                        </p>

                        {/* Métadonnées commande */}
                        {notification.orderData && (
                          <div className="mt-2 p-2 bg-white/50 rounded-lg text-xs border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-700">
                                #{notification.orderData.orderNumber}
                              </span>
                              {notification.orderData.totalAmount && (
                                <span className="font-semibold text-emerald-600">
                                  {formatAmount(notification.orderData.totalAmount)}
                                </span>
                              )}
                            </div>
                            {notification.orderData.customer && (
                              <div className="text-slate-600 mt-1">
                                Client: {notification.orderData.customer}
                              </div>
                            )}
                            {notification.orderData.itemsCount && (
                              <div className="text-slate-600">
                                {notification.orderData.itemsCount} article(s)
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        {notification.orderData?.orderId && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Voir commande
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer avec statut détaillé */}
          {isConnected && (
            <div className="px-6 py-2 border-t bg-slate-50 text-xs text-slate-600">
              WebSocket: {connectionStatus} • Transport: WebSocket • Notifications: {newNotifications.length}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
};

export default WebSocketNotificationCenter; 