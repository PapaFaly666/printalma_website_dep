import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Clock, Package, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { BackendNotification } from '../services/notificationService';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    refresh
  } = useNotifications();
  const navigate = useNavigate();

  // Demander la permission de notification au premier montage
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const getIcon = (type: BackendNotification['type']) => {
    const icons = {
      'ORDER_NEW': Package,
      'ORDER_UPDATED': Package,
      'SYSTEM': Bell,
      'SUCCESS': Check,
      'WARNING': Clock,
      'ERROR': X
    };
    return icons[type] || Bell;
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-emerald-600 bg-emerald-100';
      case 'connecting': return 'text-amber-600 bg-amber-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return Wifi;
      case 'connecting': return RefreshCw;
      case 'error': return WifiOff;
      default: return WifiOff;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'En ligne';
      case 'connecting': return 'Connexion...';
      case 'error': return 'Hors ligne';
      default: return 'Hors ligne';
    }
  };

  const handleNotificationClick = async (notification: BackendNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.metadata?.orderId) {
      navigate(`/admin/orders/${notification.metadata.orderId}`);
      setIsOpen(false);
    } else if (notification.metadata?.orderNumber) {
      // Si on a seulement le numéro de commande, naviguer vers la liste des commandes
      navigate(`/admin/orders`);
      setIsOpen(false);
    }
  };

  const handleRefresh = async () => {
    await fetchNotifications();
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount || 0) + ' FCFA';
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-9 w-9 hover:bg-slate-100 transition-all duration-200 ${
            unreadCount > 0 ? 'animate-pulse' : ''
          }`}
        >
          <Bell className={`h-5 w-5 ${
            isConnected ? 'text-slate-700' : 'text-slate-400'
          }`} />

          {/* Badge de notifications non lues */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}

          {/* Indicateur de connexion */}
          <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-emerald-500' : 'bg-slate-300'
          }`}></div>
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-96 p-0 border-slate-200 shadow-lg" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-700" />
            <span className="font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs border-red-200">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Indicateur de connexion */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getConnectionColor()}`}>
              {React.createElement(getConnectionIcon(), {
                className: `h-3 w-3 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`
              })}
              <span className="hidden sm:inline">{getConnectionText()}</span>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Tout lire
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
              title="Actualiser"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="text-xs text-red-700">{error}</span>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="max-h-96">
          {loading && (
            <div className="flex items-center justify-center h-24">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                Chargement...
              </div>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 text-slate-400">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="divide-y divide-slate-50">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      relative p-3 cursor-pointer transition-colors hover:bg-slate-50
                      ${!notification.isRead ? 'bg-slate-50/50' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                        ${!notification.isRead ? 'bg-black text-white' : 'bg-slate-100 text-slate-600'}
                      `}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${!notification.isRead ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                          {notification.message}
                        </p>
                        
                        {/* Metadata */}
                        {notification.metadata && (
                          <div className="mt-1 space-y-1">
                            {notification.metadata.customer && (
                              <p className="text-xs text-slate-500">
                                👤 {notification.metadata.customer}
                              </p>
                            )}
                            {notification.metadata.amount && (
                              <p className="text-xs text-slate-500">
                                💰 {formatAmount(notification.metadata.amount)}
                              </p>
                            )}
                            {notification.metadata.orderNumber && (
                              <p className="text-xs text-slate-500 font-mono">
                                #{notification.metadata.orderNumber}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Time and actions */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-400">
                            {formatTime(notification.createdAt)}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="h-6 w-6 p-0 hover:bg-slate-200"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-black rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500 text-center">
              {notifications.length} notification{notifications.length > 1 ? 's' : ''} au total
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter; 